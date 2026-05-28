import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any, userId: string, role: Role) {
    const { page = 1, limit = 10, search, all } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    // If user is a supervisor and didn't explicitly request 'all' sites (needed for transfer destinations)
    if (role === Role.SUPERVISOR && all !== 'true') {
      where.supervisorId = userId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.site.findMany({
        where,
        skip,
        take: limit,
        include: { supervisor: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.site.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: { supervisor: { select: { id: true, name: true, email: true, phone: true } } },
    });
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async getSummary(id: string) {
    const site = await this.findOne(id);

    const [totalReceived, totalSpent, recentDispatches, recentExpenses] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({
        where: { siteId: id, transactionType: 'CASH_RECEIVED' },
        _sum: { credit: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: { siteId: id, transactionType: 'EXPENSE' },
        _sum: { debit: true },
      }),
      this.prisma.cashDispatch.count({ where: { siteId: id } }),
      this.prisma.expense.count({ where: { siteId: id, status: 'APPROVED' } }),
    ]);

    return {
      ...site,
      totalReceived: totalReceived._sum.credit || new Decimal(0),
      totalSpent: totalSpent._sum.debit || new Decimal(0),
      totalDispatches: recentDispatches,
      totalExpenses: recentExpenses,
    };
  }

  async create(dto: CreateSiteDto) {
    return this.prisma.site.create({
      data: dto,
      include: { supervisor: { select: { id: true, name: true, email: true } } },
    });
  }

  async update(id: string, dto: UpdateSiteDto) {
    await this.findOne(id);
    return this.prisma.site.update({
      where: { id },
      data: dto,
      include: { supervisor: { select: { id: true, name: true, email: true } } },
    });
  }
}
