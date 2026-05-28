import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { DispatchStatus } from '@prisma/client';

@Injectable()
export class CashDispatchService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDispatchDto, userId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
      include: { supervisor: true },
    });
    if (!site) throw new NotFoundException('Site not found');

    const dispatch = await this.prisma.cashDispatch.create({
      data: {
        ...dto,
        dispatchDate: new Date(dto.dispatchDate),
        createdById: userId,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Create notification for supervisor
    if (site.supervisorId) {
      await this.prisma.notification.create({
        data: {
          userId: site.supervisorId,
          title: 'New Cash Dispatch',
          message: `₹${dto.amount} dispatched to ${site.name} via ${dto.carrierName}`,
          type: 'DISPATCH_CREATED',
          referenceType: 'CashDispatch',
          referenceId: dispatch.id,
        },
      });
    }

    return dispatch;
  }

  async findAll(query: PaginationDto & { status?: DispatchStatus }) {
    const { page = 1, limit = 10, siteId, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (siteId) where.siteId = siteId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.dispatchDate = {};
      if (startDate) where.dispatchDate.gte = new Date(startDate);
      if (endDate) where.dispatchDate.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.cashDispatch.findMany({
        where,
        skip,
        take: limit,
        include: {
          site: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, name: true } },
          receipt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cashDispatch.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPending(supervisorId: string, siteId?: string) {
    const sites = await this.prisma.site.findMany({
      where: { supervisorId },
      select: { id: true },
    });
    let siteIds = sites.map((s) => s.id);

    // If a specific siteId is requested, filter the allowed siteIds
    if (siteId && siteIds.includes(siteId)) {
      siteIds = [siteId];
    } else if (siteId) {
      // Requested siteId is not assigned to this supervisor
      return [];
    }

    return this.prisma.cashDispatch.findMany({
      where: {
        siteId: { in: siteIds },
        status: DispatchStatus.PENDING_RECEIPT,
      },
      include: {
        site: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const dispatch = await this.prisma.cashDispatch.findUnique({
      where: { id },
      include: {
        site: true,
        createdBy: { select: { id: true, name: true, email: true } },
        receipt: { include: { receivedBy: { select: { id: true, name: true } } } },
      },
    });
    if (!dispatch) throw new NotFoundException('Dispatch not found');
    return dispatch;
  }
}
