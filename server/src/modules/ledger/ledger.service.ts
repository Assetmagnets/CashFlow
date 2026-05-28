import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any, userId: string, role: Role) {
    const { page = 1, limit = 10, siteId, transactionType, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // RBAC: Supervisors can only view ledger entries for their assigned sites
    if (role === Role.SUPERVISOR) {
      where.site = { supervisorId: userId };
    }

    if (siteId) {
      where.siteId = siteId;
    }
    if (transactionType) {
      where.transactionType = transactionType;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where,
        skip,
        take: limit,
        include: {
          site: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ledgerEntry.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySite(siteId: string, query: any, userId: string, role: Role) {
    // RBAC check
    if (role === Role.SUPERVISOR) {
      const site = await this.prisma.site.findUnique({ where: { id: siteId } });
      if (!site || site.supervisorId !== userId) {
        throw new ForbiddenException('You do not have access to this site ledger');
      }
    }

    return this.findAll({ ...query, siteId }, userId, role);
  }

  async findMiddlemanLedger(query: any, userId: string, role: Role) {
    if (role !== Role.MIDDLEMAN) {
      throw new ForbiddenException('Only middlemen can access this ledger');
    }

    const { page = 1, limit = 10, startDate, endDate } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      middlemanId: userId,
    };

    if (startDate || endDate) {
      where.dispatchDate = {};
      if (startDate) where.dispatchDate.gte = new Date(startDate);
      if (endDate) where.dispatchDate.lte = new Date(endDate);
    }

    const [dispatches, total] = await Promise.all([
      this.prisma.cashDispatch.findMany({
        where,
        skip: Number(skip),
        take: Number(limit),
        include: {
          site: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { dispatchDate: 'desc' },
      }),
      this.prisma.cashDispatch.count({ where }),
    ]);

    const data = dispatches.map(dispatch => {
      const received = Number(dispatch.amount);
      const commission = Number(dispatch.commissionAmount || 0);
      const forwarded = dispatch.amountAfterCommission 
        ? Number(dispatch.amountAfterCommission) 
        : received - commission;
      
      return {
        id: dispatch.id,
        transactionType: 'MIDDLEMAN_FLOW',
        referenceType: 'CASH_DISPATCH',
        referenceId: dispatch.id,
        site: dispatch.site,
        receivedAmount: received,
        forwardedAmount: forwarded,
        commissionEarned: commission,
        status: dispatch.status,
        date: dispatch.dispatchDate,
        description: `Dispatch to ${dispatch.site.name} (Carrier: ${dispatch.carrierName})`,
        createdBy: dispatch.createdBy,
      };
    });

    return { data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }
}
