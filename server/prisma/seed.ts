import { PrismaClient, Role, DispatchStatus, TransactionType, ExpenseStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.cashReceipt.deleteMany();
  await prisma.cashDispatch.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.site.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Owner
  const owner = await prisma.user.create({
    data: {
      email: 'owner@cashflow.com',
      name: 'Rajesh Kumar',
      password: hashedPassword,
      phone: '+91-9876543210',
      role: Role.OWNER,
    },
  });
  console.log(`✅ Owner created: ${owner.email}`);

  // Create Supervisor
  const supervisor = await prisma.user.create({
    data: {
      email: 'supervisor@cashflow.com',
      name: 'Amit Sharma',
      password: hashedPassword,
      phone: '+91-9876543211',
      role: Role.SUPERVISOR,
    },
  });
  console.log(`✅ Supervisor created: ${supervisor.email}`);

  // Create Expense Categories
  const categories = await Promise.all(
    [
      { name: 'Labour', description: 'Worker wages and labour charges' },
      { name: 'Material', description: 'Construction materials and supplies' },
      { name: 'Transport', description: 'Transportation and logistics costs' },
      { name: 'Food', description: 'Food and refreshments for workers' },
      { name: 'Machinery', description: 'Equipment and machinery rental/purchase' },
      { name: 'Miscellaneous', description: 'Other miscellaneous expenses' },
    ].map((cat) => prisma.expenseCategory.create({ data: cat })),
  );
  console.log(`✅ ${categories.length} expense categories created`);

  // Create Sites
  const siteAlpha = await prisma.site.create({
    data: {
      code: 'SITE-001',
      name: 'Green Valley Residency',
      location: 'Sector 45, Gurugram, Haryana',
      supervisorId: supervisor.id,
    },
  });

  const siteBeta = await prisma.site.create({
    data: {
      code: 'SITE-002',
      name: 'Sunrise Commercial Complex',
      location: 'MG Road, Bangalore, Karnataka',
      supervisorId: supervisor.id,
    },
  });
  console.log(`✅ 2 sites created: ${siteAlpha.name}, ${siteBeta.name}`);

  // ========== TRANSACTION DATA ==========
  console.log('📊 Generating multi-month transaction data for dashboard charts...');

  // Helper to create a date N months ago
  const monthsAgo = (n: number, day: number = 15) => {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    d.setDate(day);
    return d;
  };

  // 1. Cash Dispatches from Owner to Sites (across multiple months)
  const dispatch1 = await prisma.cashDispatch.create({
    data: {
      siteId: siteAlpha.id,
      amount: 500000,
      carrierName: 'SafeTrans Logistics',
      purpose: 'Initial site setup funds',
      dispatchDate: monthsAgo(5, 5),
      status: DispatchStatus.RECEIVED,
      createdById: owner.id,
    },
  });

  const dispatch2 = await prisma.cashDispatch.create({
    data: {
      siteId: siteAlpha.id,
      amount: 400000,
      carrierName: 'QuickSend Couriers',
      purpose: 'Monthly operations funds',
      dispatchDate: monthsAgo(3, 10),
      status: DispatchStatus.RECEIVED,
      createdById: owner.id,
    },
  });

  const dispatch3 = await prisma.cashDispatch.create({
    data: {
      siteId: siteBeta.id,
      amount: 350000,
      carrierName: 'SecureCash India',
      purpose: 'Site Beta launch budget',
      dispatchDate: monthsAgo(2, 8),
      status: DispatchStatus.RECEIVED,
      createdById: owner.id,
    },
  });

  const dispatch4 = await prisma.cashDispatch.create({
    data: {
      siteId: siteAlpha.id,
      amount: 200000,
      carrierName: 'SafeTrans Logistics',
      purpose: 'Material purchase advance',
      dispatchDate: monthsAgo(0, 5),
      status: DispatchStatus.PENDING_RECEIPT,
      createdById: owner.id,
    },
  });
  console.log('✅ 4 cash dispatches created');

  // 2. Cash Receipts
  const receipt1 = await prisma.cashReceipt.create({
    data: {
      dispatchId: dispatch1.id,
      siteId: siteAlpha.id,
      receivedAmount: 500000,
      receivedById: supervisor.id,
    },
  });

  const receipt2 = await prisma.cashReceipt.create({
    data: {
      dispatchId: dispatch2.id,
      siteId: siteAlpha.id,
      receivedAmount: 400000,
      receivedById: supervisor.id,
    },
  });

  const receipt3 = await prisma.cashReceipt.create({
    data: {
      dispatchId: dispatch3.id,
      siteId: siteBeta.id,
      receivedAmount: 350000,
      receivedById: supervisor.id,
    },
  });
  console.log('✅ 3 cash receipts confirmed');

  // 3. Ledger entries for receipts
  await prisma.ledgerEntry.create({
    data: {
      siteId: siteAlpha.id,
      transactionType: TransactionType.CASH_RECEIVED,
      referenceType: 'CASH_RECEIPT',
      referenceId: receipt1.id,
      credit: 500000,
      debit: 0,
      balanceAfter: 500000,
      description: 'Cash received - Initial setup funds',
    },
  });
  await prisma.ledgerEntry.create({
    data: {
      siteId: siteAlpha.id,
      transactionType: TransactionType.CASH_RECEIVED,
      referenceType: 'CASH_RECEIPT',
      referenceId: receipt2.id,
      credit: 400000,
      debit: 0,
      balanceAfter: 900000,
      description: 'Cash received - Monthly operations funds',
    },
  });
  await prisma.ledgerEntry.create({
    data: {
      siteId: siteBeta.id,
      transactionType: TransactionType.CASH_RECEIVED,
      referenceType: 'CASH_RECEIPT',
      referenceId: receipt3.id,
      credit: 350000,
      debit: 0,
      balanceAfter: 350000,
      description: 'Cash received - Site Beta launch budget',
    },
  });

  // 4. Expenses spread across 6 months for realistic charts
  const expenseItems = [
    // 5 months ago
    { amount: 60000, catIdx: 0, vendor: 'Labour Union', desc: 'Foundation work crew', site: siteAlpha, monthsBack: 5, day: 10 },
    { amount: 85000, catIdx: 1, vendor: 'UltraTech Cement', desc: '300 bags cement', site: siteAlpha, monthsBack: 5, day: 20 },
    // 4 months ago
    { amount: 72000, catIdx: 0, vendor: 'Labour Union', desc: 'Column casting crew', site: siteAlpha, monthsBack: 4, day: 8 },
    { amount: 110000, catIdx: 1, vendor: 'Ambuja Steel', desc: 'TMT steel bars', site: siteAlpha, monthsBack: 4, day: 18 },
    { amount: 18000, catIdx: 2, vendor: 'FastTrack Transport', desc: 'Steel delivery', site: siteAlpha, monthsBack: 4, day: 22 },
    // 3 months ago
    { amount: 55000, catIdx: 0, vendor: 'Local Contractors', desc: 'Plastering work', site: siteAlpha, monthsBack: 3, day: 5 },
    { amount: 95000, catIdx: 1, vendor: 'ACC Cement Dealer', desc: '400 bags PPC cement', site: siteAlpha, monthsBack: 3, day: 15 },
    { amount: 12000, catIdx: 3, vendor: 'Annapurna Caterers', desc: 'Worker meals 2 weeks', site: siteAlpha, monthsBack: 3, day: 25 },
    // 2 months ago
    { amount: 45000, catIdx: 0, vendor: 'Sharma Contractors', desc: 'Plumbing work', site: siteBeta, monthsBack: 2, day: 10 },
    { amount: 130000, catIdx: 1, vendor: 'BuildPro Supplies', desc: 'Electrical fittings', site: siteBeta, monthsBack: 2, day: 16 },
    { amount: 42000, catIdx: 4, vendor: 'JCB Rentals', desc: 'Crane rental 3 days', site: siteAlpha, monthsBack: 2, day: 20 },
    // 1 month ago
    { amount: 68000, catIdx: 0, vendor: 'Daily Wage Workers', desc: 'Finishing & tiling', site: siteAlpha, monthsBack: 1, day: 7 },
    { amount: 25000, catIdx: 2, vendor: 'BlueDart Logistics', desc: 'Tile delivery', site: siteAlpha, monthsBack: 1, day: 14 },
    { amount: 15000, catIdx: 3, vendor: 'Food Corner', desc: 'Worker lunches', site: siteBeta, monthsBack: 1, day: 18 },
    { amount: 8000, catIdx: 5, vendor: 'General Store', desc: 'Safety gear & gloves', site: siteAlpha, monthsBack: 1, day: 25 },
    // Current month
    { amount: 48000, catIdx: 0, vendor: 'Local Labour', desc: 'Painting crew', site: siteAlpha, monthsBack: 0, day: 3 },
    { amount: 75000, catIdx: 1, vendor: 'Asian Paints Dealer', desc: 'Interior & exterior paints', site: siteAlpha, monthsBack: 0, day: 10 },
    { amount: 35000, catIdx: 4, vendor: 'Equipment World', desc: 'Scaffolding rental', site: siteBeta, monthsBack: 0, day: 12 },
  ];

  let alphaBalance = 900000; // After 2 receipts
  let betaBalance = 350000;  // After 1 receipt

  for (const item of expenseItems) {
    const expense = await prisma.expense.create({
      data: {
        siteId: item.site.id,
        categoryId: categories[item.catIdx].id,
        amount: item.amount,
        vendorName: item.vendor,
        description: item.desc,
        expenseDate: monthsAgo(item.monthsBack, item.day),
        status: ExpenseStatus.APPROVED,
        createdById: supervisor.id,
      },
    });

    if (item.site.id === siteAlpha.id) {
      alphaBalance -= item.amount;
    } else {
      betaBalance -= item.amount;
    }

    await prisma.ledgerEntry.create({
      data: {
        siteId: item.site.id,
        transactionType: TransactionType.EXPENSE,
        referenceType: 'EXPENSE',
        referenceId: expense.id,
        credit: 0,
        debit: item.amount,
        balanceAfter: item.site.id === siteAlpha.id ? alphaBalance : betaBalance,
        description: `${categories[item.catIdx].name}: ${item.desc}`,
      },
    });
  }

  // Update final site balances
  await prisma.site.update({
    where: { id: siteAlpha.id },
    data: { currentBalance: alphaBalance },
  });
  await prisma.site.update({
    where: { id: siteBeta.id },
    data: { currentBalance: betaBalance },
  });

  console.log(`✅ ${expenseItems.length} expenses and ledger entries created across 6 months`);
  console.log(`   Site Alpha balance: ₹${alphaBalance.toLocaleString('en-IN')}`);
  console.log(`   Site Beta balance:  ₹${betaBalance.toLocaleString('en-IN')}`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('---');
  console.log('Owner Login:      owner@cashflow.com / password123');
  console.log('Supervisor Login: supervisor@cashflow.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
