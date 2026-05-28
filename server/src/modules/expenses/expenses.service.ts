import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { Role, ExpenseStatus } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExpenseDto, userId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const site = await tx.site.findUnique({
        where: { id: dto.siteId },
      });
      if (!site) throw new NotFoundException('Site not found');

      const amount = new Decimal(dto.amount);
      
      // Perform balance pre-check (though the real deduction check happens upon approval)
      if (site.currentBalance.lessThan(amount)) {
        throw new BadRequestException(`Insufficient balance at site. Current balance is ₹${site.currentBalance}`);
      }

      // 1. Create expense in PENDING status
      const expense = await tx.expense.create({
        data: {
          siteId: dto.siteId,
          categoryId: dto.categoryId,
          amount: amount,
          vendorName: dto.vendorName,
          description: dto.description,
          expenseDate: new Date(dto.expenseDate),
          createdById: userId,
          status: ExpenseStatus.PENDING,
        },
        include: { category: true },
      });

      // 2. If receipt metadata is provided, save it as an Attachment
      if (dto.receipt) {
        await tx.attachment.create({
          data: {
            fileName: dto.receipt.fileName,
            originalName: dto.receipt.originalName,
            filePath: dto.receipt.filePath,
            mimeType: dto.receipt.mimeType,
            size: dto.receipt.size,
            referenceType: 'Expense',
            referenceId: expense.id,
            uploadedById: userId,
          },
        });
      }

      // 3. Notify owner about the new pending expense
      const owner = await tx.user.findFirst({ where: { role: Role.OWNER } });
      if (owner) {
        await tx.notification.create({
          data: {
            userId: owner.id,
            title: 'Expense Approval Required',
            message: `New expense of ₹${amount} submitted at ${site.name} by ${expense.createdById}. Requires approval.`,
            type: 'EXPENSE_ADDED',
            referenceType: 'Expense',
            referenceId: expense.id,
          },
        });
      }

      return expense;
    });

    return result;
  }

  async approve(id: string, ownerId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({
        where: { id },
        include: { category: true },
      });
      if (!expense) throw new NotFoundException('Expense not found');

      if (expense.status !== ExpenseStatus.PENDING) {
        throw new BadRequestException(`Only pending expenses can be approved. Current status is ${expense.status}`);
      }

      const site = await tx.site.findUnique({
        where: { id: expense.siteId },
      });
      if (!site) throw new NotFoundException('Site not found');

      // Verify sufficient balance during approval
      if (site.currentBalance.lessThan(expense.amount)) {
        throw new BadRequestException(`Insufficient balance at site. Site balance: ₹${site.currentBalance}, Expense amount: ₹${expense.amount}`);
      }

      // 1. Update site balance atomically
      const updatedSite = await tx.site.update({
        where: { id: expense.siteId },
        data: { currentBalance: { decrement: expense.amount } },
      });

      if (updatedSite.currentBalance.lessThan(0)) {
        throw new BadRequestException(`Insufficient balance at site due to concurrent transactions. Expense amount: ₹${expense.amount}`);
      }

      // 2. Create ledger entry
      const ledger = await tx.ledgerEntry.create({
        data: {
          siteId: expense.siteId,
          transactionType: 'EXPENSE',
          referenceType: 'Expense',
          referenceId: expense.id,
          credit: 0,
          debit: expense.amount,
          balanceAfter: updatedSite.currentBalance,
          description: `Expense (Approved): ${expense.category.name} - ${expense.vendorName} (${expense.description || ''})`,
        },
      });

      // 4. Update expense status to APPROVED
      const approvedExpense = await tx.expense.update({
        where: { id },
        data: { status: ExpenseStatus.APPROVED },
      });

      // 5. Notify supervisor who created the expense
      await tx.notification.create({
        data: {
          userId: expense.createdById,
          title: 'Expense Approved',
          message: `Your expense of ₹${expense.amount} for ${expense.category.name} at ${site.name} has been approved.`,
          type: 'EXPENSE_APPROVED',
          referenceType: 'Expense',
          referenceId: expense.id,
        },
      });

      // 6. Check low balance threshold (₹5000)
      if (updatedSite.currentBalance.lessThan(5000)) {
        const ownersAndSupervisors = await tx.user.findMany({
          where: {
            OR: [
              { role: Role.OWNER },
              { id: site.supervisorId || '' },
            ],
          },
        });

        for (const user of ownersAndSupervisors) {
          await tx.notification.create({
            data: {
              userId: user.id,
              title: 'Low Balance Alert',
              message: `Site ${site.name} balance has dropped to ₹${updatedSite.currentBalance}. Please dispatch cash soon.`,
              type: 'LOW_BALANCE',
              referenceType: 'Site',
              referenceId: site.id,
            },
          });
        }
      }

      return approvedExpense;
    });

    return result;
  }

  async reject(id: string, ownerId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.findUnique({
        where: { id },
        include: { category: true },
      });
      if (!expense) throw new NotFoundException('Expense not found');

      if (expense.status !== ExpenseStatus.PENDING) {
        throw new BadRequestException(`Only pending expenses can be rejected. Current status is ${expense.status}`);
      }

      const site = await tx.site.findUnique({
        where: { id: expense.siteId },
      });

      // 1. Update expense status to REJECTED
      const rejectedExpense = await tx.expense.update({
        where: { id },
        data: { status: ExpenseStatus.REJECTED },
      });

      // 2. Notify supervisor who created the expense
      await tx.notification.create({
        data: {
          userId: expense.createdById,
          title: 'Expense Rejected',
          message: `Your expense of ₹${expense.amount} for ${expense.category.name} at ${site?.name || 'Site'} was rejected by the Owner.`,
          type: 'EXPENSE_REJECTED',
          referenceType: 'Expense',
          referenceId: expense.id,
        },
      });

      return rejectedExpense;
    });

    return result;
  }

  async findAll(query: any, userId: string, role: Role) {
    const { page = 1, limit = 10, siteId, categoryId, startDate, endDate, search, status } = query;
    const skip = (page - 1) * +limit;
    const take = +limit;

    const where: any = {};

    // RBAC: Supervisors can only view expenses for their assigned sites
    if (role === Role.SUPERVISOR) {
      where.site = { supervisorId: userId };
    }

    if (siteId) {
      where.siteId = siteId;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (status) {
      where.status = status;
    }
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { vendorName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        skip,
        take,
        include: {
          site: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);

    // Fetch attachments/receipts for these expenses
    const expenseIds = data.map((e) => e.id);
    const attachments = await this.prisma.attachment.findMany({
      where: {
        referenceType: 'Expense',
        referenceId: { in: expenseIds },
      },
    });

    // Merge attachments back into data
    const dataWithAttachments = data.map((expense) => ({
      ...expense,
      attachments: attachments.filter((a) => a.referenceId === expense.id),
    }));

    return { data: dataWithAttachments, total, page, limit: take, totalPages: Math.ceil(total / take) };
  }

  async findOne(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        site: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    const attachments = await this.prisma.attachment.findMany({
      where: { referenceType: 'Expense', referenceId: id },
    });

    return { ...expense, attachments };
  }

  async update(id: string, dto: UpdateExpenseDto, userId: string, role: Role) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');

    // Enforce PENDING status
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Only pending expenses can be edited');
    }

    // Permission check: Supervisors can only edit their own created expenses
    if (role === Role.SUPERVISOR && expense.createdById !== userId) {
      throw new BadRequestException('You can only edit expenses you created');
    }

    // 24-hour limit check
    const elapsedMs = Date.now() - new Date(expense.createdAt).getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    if (elapsedHours > 24 && role !== Role.OWNER) {
      throw new BadRequestException('Expenses can only be edited within 24 hours of creation');
    }

    const updatedExpense = await this.prisma.expense.update({
      where: { id },
      data: {
        categoryId: dto.categoryId,
        amount: dto.amount !== undefined ? new Decimal(dto.amount) : undefined,
        vendorName: dto.vendorName,
        description: dto.description,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
      },
      include: { category: true },
    });

    return updatedExpense;
  }

  async remove(id: string, userId: string, role: Role) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');

    // Enforce PENDING status
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Only pending expenses can be deleted');
    }

    // Permission check: Supervisors can only delete their own created expenses
    if (role === Role.SUPERVISOR && expense.createdById !== userId) {
      throw new BadRequestException('You can only delete expenses you created');
    }

    // 24-hour limit check
    const elapsedMs = Date.now() - new Date(expense.createdAt).getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    if (elapsedHours > 24 && role !== Role.OWNER) {
      throw new BadRequestException('Expenses can only be deleted within 24 hours of creation');
    }

    return this.prisma.$transaction(async (tx) => {
      // Delete associated attachments
      await tx.attachment.deleteMany({
        where: { referenceType: 'Expense', referenceId: id },
      });

      // Delete the expense
      return tx.expense.delete({ where: { id } });
    });
  }

  async getCategories() {
    return this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
