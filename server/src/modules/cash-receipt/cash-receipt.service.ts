import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReceiptDto } from './dto/create-receipt.dto';
import { DispatchStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CashReceiptService {
  constructor(private prisma: PrismaService) {}

  async confirmReceipt(dto: CreateReceiptDto, userId: string) {
    // Execute everything in a transaction for data integrity
    const result = await this.prisma.$transaction(async (tx) => {
      const dispatch = await tx.cashDispatch.findUnique({
        where: { id: dto.dispatchId },
        include: { site: true, createdBy: true, middleman: true },
      });

      if (!dispatch) throw new NotFoundException('Dispatch not found');
      if (dispatch.status !== DispatchStatus.PENDING_RECEIPT) {
        throw new BadRequestException('This dispatch has already been processed');
      }

      const receivedAmount = new Decimal(dto.receivedAmount);
      // Use amountAfterCommission if middleman was involved, else use original amount
      const expectedAmount = dispatch.amountAfterCommission || dispatch.amount;
      const discrepancy = expectedAmount.minus(receivedAmount);

      let status: DispatchStatus;
      if (discrepancy.equals(0)) {
        status = DispatchStatus.RECEIVED;
      } else if (receivedAmount.lessThan(expectedAmount)) {
        status = DispatchStatus.PARTIAL_RECEIVED;
      } else {
        status = DispatchStatus.DISPUTED;
      }
      // 1. Create receipt
      const receipt = await tx.cashReceipt.create({
        data: {
          dispatchId: dto.dispatchId,
          siteId: dispatch.siteId,
          receivedAmount: receivedAmount,
          discrepancyAmount: discrepancy.abs(),
          remarks: dto.remarks,
          receivedById: userId,
        },
      });

      // 2. Update dispatch status
      await tx.cashDispatch.update({
        where: { id: dto.dispatchId },
        data: { status },
      });

      // 3. Update site balance atomically
      const updatedSite = await tx.site.update({
        where: { id: dispatch.siteId },
        data: { currentBalance: { increment: receivedAmount } },
      });

      // 4. Create ledger entry
      await tx.ledgerEntry.create({
        data: {
          siteId: dispatch.siteId,
          transactionType: 'CASH_RECEIVED',
          referenceType: 'CashReceipt',
          referenceId: receipt.id,
          credit: receivedAmount,
          debit: 0,
          balanceAfter: updatedSite.currentBalance,
          description: `Cash received from ${dispatch.carrierName} - ${dispatch.purpose}${dispatch.middleman ? ` (via ${dispatch.middleman.name})` : ''}`,
        },
      });

      // 6. Notify owner
      await tx.notification.create({
        data: {
          userId: dispatch.createdById,
          title: 'Receipt Confirmed',
          message: `₹${receivedAmount} received at ${dispatch.site.name}${!discrepancy.equals(0) ? ` (discrepancy: ₹${discrepancy.abs()})` : ''}`,
          type: 'RECEIPT_CONFIRMED',
          referenceType: 'CashReceipt',
          referenceId: receipt.id,
        },
      });

      // 7. Notify middleman (if involved)
      if (dispatch.middlemanId) {
        await tx.notification.create({
          data: {
            userId: dispatch.middlemanId,
            title: 'Cash Receipt Confirmed',
            message: `₹${receivedAmount} confirmed at ${dispatch.site.name} — your commission: ₹${dispatch.commissionAmount}`,
            type: 'RECEIPT_CONFIRMED',
            referenceType: 'CashReceipt',
            referenceId: receipt.id,
          },
        });
      }

      return receipt;
    });

    return result;
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, siteId } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (siteId) where.siteId = siteId;

    const [data, total] = await Promise.all([
      this.prisma.cashReceipt.findMany({
        where,
        skip,
        take: limit,
        include: {
          dispatch: { select: { amount: true, carrierName: true, purpose: true } },
          site: { select: { id: true, name: true, code: true } },
          receivedBy: { select: { id: true, name: true } },
        },
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.cashReceipt.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
