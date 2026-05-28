import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ForwardDispatchDto } from './dto/forward-dispatch.dto';
import { DispatchStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class MiddlemanService {
  constructor(private prisma: PrismaService) {}

  /** Get all dispatches assigned to this middleman */
  async findPendingDispatches(middlemanId: string) {
    return this.prisma.cashDispatch.findMany({
      where: {
        status: DispatchStatus.PENDING_MIDDLEMAN,
        // Global Data Entry: We fetch all pending middleman dispatches regardless of assigned middlemanId
        middlemanId: { not: null },
      },
      include: {
        site: { select: { id: true, name: true, code: true, location: true } },
        createdBy: { select: { id: true, name: true } },
        middleman: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get all dispatches for this middleman (any status) */
  async findAllDispatches(middlemanId: string) {
    return this.prisma.cashDispatch.findMany({
      where: { middlemanId: { not: null } }, // Global Data Entry: all dispatches processed by any middleman
      include: {
        site: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true } },
        middleman: { select: { id: true, name: true } },
        receipt: { select: { receivedAmount: true, receivedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Middleman processes a dispatch: deducts commission and forwards to site */
  async forwardDispatch(dispatchId: string, dto: ForwardDispatchDto, middlemanId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const dispatch = await tx.cashDispatch.findUnique({
        where: { id: dispatchId },
        include: { site: { include: { supervisor: true } } },
      });

      if (!dispatch) throw new NotFoundException('Dispatch not found');
      // Global Data Entry: allow processing regardless of assigned middleman
      // if (dispatch.middlemanId !== middlemanId) {
      //   throw new BadRequestException('This dispatch is not assigned to you');
      // }
      if (dispatch.status !== DispatchStatus.PENDING_MIDDLEMAN) {
        throw new BadRequestException('This dispatch has already been processed');
      }

      const commission = new Decimal(dto.commissionAmount);
      const originalAmount = dispatch.amount;

      if (commission.greaterThanOrEqualTo(originalAmount)) {
        throw new BadRequestException('Commission cannot exceed or equal the dispatched amount');
      }

      const amountAfterCommission = originalAmount.minus(commission);

      // 1. Update the dispatch — set commission, forward to PENDING_RECEIPT
      const updated = await tx.cashDispatch.update({
        where: { id: dispatchId },
        data: {
          status: DispatchStatus.PENDING_RECEIPT,
          commissionAmount: commission,
          amountAfterCommission: amountAfterCommission,
          middlemanProcessedAt: new Date(),
          notes: dto.notes
            ? `${dispatch.notes || ''}\n[Middleman Note]: ${dto.notes}`.trim()
            : dispatch.notes,
        },
        include: {
          site: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      // 2. Notify the site supervisor that cash is on its way
      if (dispatch.site.supervisorId) {
        await tx.notification.create({
          data: {
            userId: dispatch.site.supervisorId,
            title: 'Cash Forwarded by Middleman',
            message: `₹${amountAfterCommission} forwarded to ${dispatch.site.name} (commission: ₹${commission})`,
            type: 'MIDDLEMAN_FORWARDED',
            referenceType: 'CashDispatch',
            referenceId: dispatch.id,
          },
        });
      }

      // 3. Notify the owner that middleman has processed the dispatch
      await tx.notification.create({
        data: {
          userId: dispatch.createdById,
          title: 'Middleman Processed Dispatch',
          message: `₹${amountAfterCommission} forwarded to ${dispatch.site.name} (commission: ₹${commission})`,
          type: 'MIDDLEMAN_FORWARDED',
          referenceType: 'CashDispatch',
          referenceId: dispatch.id,
        },
      });

      return updated;
    });

    return result;
  }

  /** Dashboard stats for middleman */
  async getDashboardStats(middlemanId: string) {
    const [
      pendingDispatches,
      allDispatches,
      totalCommissionAgg,
      totalForwardedAgg,
    ] = await Promise.all([
      this.prisma.cashDispatch.count({
        where: { middlemanId: { not: null }, status: DispatchStatus.PENDING_MIDDLEMAN },
      }),
      this.prisma.cashDispatch.count({
        where: { middlemanId: { not: null } },
      }),
      this.prisma.cashDispatch.aggregate({
        where: {
          middlemanId: { not: null },
          status: { not: DispatchStatus.PENDING_MIDDLEMAN },
        },
        _sum: { commissionAmount: true },
      }),
      this.prisma.cashDispatch.aggregate({
        where: {
          middlemanId: { not: null },
          status: { not: DispatchStatus.PENDING_MIDDLEMAN },
        },
        _sum: { amountAfterCommission: true },
      }),
    ]);

    const recentDispatches = await this.prisma.cashDispatch.findMany({
      where: { middlemanId: { not: null } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        site: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true } },
        middleman: { select: { id: true, name: true } },
        receipt: { select: { receivedAmount: true, receivedAt: true } },
      },
    });

    return {
      pendingCount: pendingDispatches,
      totalProcessed: allDispatches - pendingDispatches,
      totalCommissionEarned: Number(totalCommissionAgg._sum.commissionAmount || 0),
      totalAmountForwarded: Number(totalForwardedAgg._sum.amountAfterCommission || 0),
      recentDispatches,
    };
  }
}
