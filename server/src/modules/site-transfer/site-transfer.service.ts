import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SiteTransferService {
  constructor(private prisma: PrismaService) {}

  /** Initiate a cross-site transfer (called by owner or supervisor) */
  async create(dto: CreateTransferDto, userId: string) {
    if (dto.fromSiteId === dto.toSiteId) {
      throw new BadRequestException('Cannot transfer to the same site');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const fromSite = await tx.site.findUnique({ where: { id: dto.fromSiteId } });
      const toSite = await tx.site.findUnique({ where: { id: dto.toSiteId } });

      if (!fromSite) throw new NotFoundException('Source site not found');
      if (!toSite) throw new NotFoundException('Destination site not found');

      const transferAmount = new Decimal(dto.amount);

      if (fromSite.currentBalance.lessThan(transferAmount)) {
        throw new BadRequestException(
          `Insufficient balance at ${fromSite.name}. Available: ₹${fromSite.currentBalance}`,
        );
      }

      // 1. Create the transfer record
      const transfer = await tx.siteTransfer.create({
        data: {
          fromSiteId: dto.fromSiteId,
          toSiteId: dto.toSiteId,
          amount: transferAmount,
          notes: dto.notes,
          status: 'PENDING',
          initiatedById: userId,
        },
        include: {
          fromSite: { select: { id: true, name: true, code: true } },
          toSite: { select: { id: true, name: true, code: true } },
          initiatedBy: { select: { id: true, name: true } },
        },
      });

      // 2. Deduct balance from source site atomically
      const updatedSite = await tx.site.update({
        where: { id: dto.fromSiteId },
        data: { currentBalance: { decrement: transferAmount } },
      });

      if (updatedSite.currentBalance.lessThan(0)) {
        throw new BadRequestException(
          `Insufficient balance at ${fromSite.name} due to concurrent transactions.`
        );
      }

      // 3. Create ledger entry for source site (debit)
      await tx.ledgerEntry.create({
        data: {
          siteId: dto.fromSiteId,
          transactionType: 'SITE_TRANSFER_OUT',
          referenceType: 'SiteTransfer',
          referenceId: transfer.id,
          credit: 0,
          debit: transferAmount,
          balanceAfter: updatedSite.currentBalance,
          description: `Transfer to ${toSite.name} (${toSite.code})`,
        },
      });

      // 4. Notify the receiving site's supervisor
      if (toSite.supervisorId) {
        await tx.notification.create({
          data: {
            userId: toSite.supervisorId,
            title: 'Incoming Site Transfer',
            message: `₹${transferAmount} incoming from ${fromSite.name} — please confirm receipt`,
            type: 'TRANSFER_CREATED',
            referenceType: 'SiteTransfer',
            referenceId: transfer.id,
          },
        });
      }

      return transfer;
    });

    return result;
  }

  /** Confirm receipt of a cross-site transfer */
  async confirmReceive(transferId: string, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.siteTransfer.findUnique({
        where: { id: transferId },
        include: {
          fromSite: { include: { supervisor: true } },
          toSite: true,
          initiatedBy: true,
        },
      });

      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'PENDING') {
        throw new BadRequestException('This transfer has already been processed');
      }

      // 1. Update transfer status
      const updated = await tx.siteTransfer.update({
        where: { id: transferId },
        data: { status: 'RECEIVED', receivedById: userId },
        include: {
          fromSite: { select: { id: true, name: true, code: true } },
          toSite: { select: { id: true, name: true, code: true } },
        },
      });

      // 2. Credit balance to destination site atomically
      const updatedToSite = await tx.site.update({
        where: { id: transfer.toSiteId },
        data: { currentBalance: { increment: transfer.amount } },
      });

      // 3. Create ledger entry for destination site (credit)
      await tx.ledgerEntry.create({
        data: {
          siteId: transfer.toSiteId,
          transactionType: 'SITE_TRANSFER_IN',
          referenceType: 'SiteTransfer',
          referenceId: transfer.id,
          credit: transfer.amount,
          debit: 0,
          balanceAfter: updatedToSite.currentBalance,
          description: `Transfer received from ${transfer.fromSite.name} (${transfer.fromSite.code})`,
        },
      });

      // 4. Notify the initiator that transfer was received
      await tx.notification.create({
        data: {
          userId: transfer.initiatedById,
          title: 'Transfer Received',
          message: `₹${transfer.amount} confirmed received at ${transfer.toSite.name}`,
          type: 'TRANSFER_RECEIVED',
          referenceType: 'SiteTransfer',
          referenceId: transfer.id,
        },
      });

      // 5. Notify the source site supervisor
      if (transfer.fromSite.supervisorId) {
        await tx.notification.create({
          data: {
            userId: transfer.fromSite.supervisorId,
            title: 'Transfer Completed',
            message: `₹${transfer.amount} received at ${transfer.toSite.name}`,
            type: 'TRANSFER_RECEIVED',
            referenceType: 'SiteTransfer',
            referenceId: transfer.id,
          },
        });
      }

      return updated;
    });

    return result;
  }

  /** Cancel a pending cross-site transfer and refund the amount */
  async cancelTransfer(transferId: string, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.siteTransfer.findUnique({
        where: { id: transferId },
        include: {
          fromSite: true,
          toSite: true,
          initiatedBy: true,
        },
      });

      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'PENDING') {
        throw new BadRequestException('Only pending transfers can be cancelled');
      }

      // 1. Update transfer status to REJECTED (Cancelled)
      const updated = await tx.siteTransfer.update({
        where: { id: transferId },
        data: { status: 'REJECTED' }, // Using REJECTED to represent Cancelled in our enum
      });

      // 2. Refund balance to the originating site atomically
      const updatedFromSite = await tx.site.update({
        where: { id: transfer.fromSiteId },
        data: { currentBalance: { increment: transfer.amount } },
      });

      // 3. Create ledger entry for the refund (credit to source site)
      await tx.ledgerEntry.create({
        data: {
          siteId: transfer.fromSiteId,
          transactionType: 'ADJUSTMENT', // Using ADJUSTMENT since it's a refund
          referenceType: 'SiteTransfer',
          referenceId: transfer.id,
          credit: transfer.amount,
          debit: 0,
          balanceAfter: updatedFromSite.currentBalance,
          description: `Refund for cancelled transfer to ${transfer.toSite.name} (${transfer.toSite.code})`,
        },
      });

      // 4. Notify the initiator that transfer was cancelled
      await tx.notification.create({
        data: {
          userId: transfer.initiatedById,
          title: 'Transfer Cancelled & Refunded',
          message: `Your transfer of ₹${transfer.amount} to ${transfer.toSite.name} was cancelled.`,
          type: 'EXPENSE_REJECTED', // Borrowing this type as there's no TRANSFER_REJECTED
          referenceType: 'SiteTransfer',
          referenceId: transfer.id,
        },
      });

      return updated;
    });

    return result;
  }

  /** List all transfers (optionally filtered by siteId) */
  async findAll(query: any) {
    const { page = 1, limit = 10, siteId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (siteId) {
      where.OR = [{ fromSiteId: siteId }, { toSiteId: siteId }];
    }
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.siteTransfer.findMany({
        where,
        skip,
        take: limit,
        include: {
          fromSite: { select: { id: true, name: true, code: true } },
          toSite: { select: { id: true, name: true, code: true } },
          initiatedBy: { select: { id: true, name: true } },
          receivedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.siteTransfer.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Get pending transfers for a supervisor's sites */
  async findPendingForSupervisor(supervisorId: string) {
    const sites = await this.prisma.site.findMany({
      where: { supervisorId },
      select: { id: true },
    });
    const siteIds = sites.map((s) => s.id);

    return this.prisma.siteTransfer.findMany({
      where: {
        toSiteId: { in: siteIds },
        status: 'PENDING',
      },
      include: {
        fromSite: { select: { id: true, name: true, code: true } },
        toSite: { select: { id: true, name: true, code: true } },
        initiatedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
