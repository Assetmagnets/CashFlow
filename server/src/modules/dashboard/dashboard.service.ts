import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOwnerStats() {
    const [
      activeSitesCount,
      totalCashAtSitesAgg,
      totalCashInTransitAgg,
      totalExpensesAgg,
      recentDispatches,
      recentExpenses,
      categoryExpensesRaw,
      monthlyExpensesRaw,
    ] = await Promise.all([
      this.prisma.site.count({ where: { status: 'ACTIVE' } }),
      this.prisma.site.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { currentBalance: true },
      }),
      this.prisma.cashDispatch.aggregate({
        where: { status: 'PENDING_RECEIPT' },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
      this.prisma.cashDispatch.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { site: { select: { name: true } } },
      }),
      this.prisma.expense.findMany({
        where: { status: 'APPROVED' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          site: { select: { name: true } },
          category: { select: { name: true } },
        },
      }),
      this.prisma.expense.groupBy({
        where: { status: 'APPROVED' },
        by: ['categoryId'],
        _sum: { amount: true },
      }),
      this.prisma.expense.findMany({
        where: { status: 'APPROVED' },
        select: {
          amount: true,
          expenseDate: true,
        },
      }),
    ]);

    // Format category chart data — convert Decimal to Number for Recharts
    const categories = await this.prisma.expenseCategory.findMany();
    const categoryChartData = categoryExpensesRaw.map((item) => {
      const cat = categories.find((c) => c.id === item.categoryId);
      return {
        category: cat ? cat.name : 'Unknown',
        amount: Number(item._sum.amount || 0),
      };
    });

    // Format monthly chart data (past 6 months) — convert Decimal to Number
    const monthlyExpensesMap: Record<string, number> = {};
    monthlyExpensesRaw.forEach((exp) => {
      const date = new Date(exp.expenseDate);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthlyExpensesMap[key]) {
        monthlyExpensesMap[key] = 0;
      }
      monthlyExpensesMap[key] += Number(exp.amount);
    });

    const monthlyChartData = Object.keys(monthlyExpensesMap).map((key) => ({
      month: key,
      amount: monthlyExpensesMap[key],
    })).slice(-6); // Last 6 months

    return {
      activeSitesCount,
      totalCashAtSites: Number(totalCashAtSitesAgg._sum.currentBalance || 0),
      totalCashInTransit: Number(totalCashInTransitAgg._sum.amount || 0),
      totalExpenses: Number(totalExpensesAgg._sum.amount || 0),
      recentDispatches,
      recentExpenses,
      categoryExpenses: categoryChartData,
      monthlyExpenses: monthlyChartData,
    };
  }

  async getSupervisorStats(userId: string, requestedSiteId?: string) {
    // Find all sites assigned to this supervisor
    const assignedSites = await this.prisma.site.findMany({
      where: { supervisorId: userId },
      select: { id: true, name: true, code: true, currentBalance: true },
    });

    if (!assignedSites || assignedSites.length === 0) {
      return {
        hasSite: false,
        message: 'No site assigned to this supervisor.',
      };
    }

    // Determine the active site: use requestedSiteId if valid, else fallback to the first assigned site
    let siteId = requestedSiteId;
    if (!siteId || !assignedSites.some((s) => s.id === siteId)) {
      siteId = assignedSites[0].id;
    }

    // Fetch the full site record for the active site
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return {
        hasSite: false,
        message: 'Selected site not found.',
      };
    }

    const [
      totalReceivedAgg,
      totalSpentAgg,
      recentDispatches,
      recentExpenses,
      categoryExpensesRaw,
    ] = await Promise.all([
      this.prisma.ledgerEntry.aggregate({
        where: { siteId: site.id, transactionType: 'CASH_RECEIVED' },
        _sum: { credit: true },
      }),
      this.prisma.ledgerEntry.aggregate({
        where: { siteId: site.id, transactionType: 'EXPENSE' },
        _sum: { debit: true },
      }),
      this.prisma.cashDispatch.findMany({
        where: { siteId: site.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.expense.findMany({
        where: { siteId: site.id, status: 'APPROVED' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { name: true } } },
      }),
      this.prisma.expense.groupBy({
        where: { siteId: site.id, status: 'APPROVED' },
        by: ['categoryId'],
        _sum: { amount: true },
      }),
    ]);

    // Format category chart data — convert Decimal to Number for Recharts
    const categories = await this.prisma.expenseCategory.findMany();
    const categoryChartData = categoryExpensesRaw.map((item) => {
      const cat = categories.find((c) => c.id === item.categoryId);
      return {
        category: cat ? cat.name : 'Unknown',
        amount: Number(item._sum.amount || 0),
      };
    });

    return {
      hasSite: true,
      siteId: site.id,
      siteName: site.name,
      siteCode: site.code,
      siteLocation: site.location,
      currentBalance: Number(site.currentBalance || 0),
      totalReceived: Number(totalReceivedAgg._sum.credit || 0),
      totalSpent: Number(totalSpentAgg._sum.debit || 0),
      assignedSites,
      recentDispatches,
      recentExpenses,
      categoryExpenses: categoryChartData,
    };
  }
}
