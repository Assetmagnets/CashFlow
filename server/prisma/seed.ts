import { PrismaClient, Role } from '@prisma/client';
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

  // Create Mock Data so Dashboard shows charts immediately
  console.log('📊 Generating realistic mock data for dashboard...');
  
  // 1. Send some cash to the sites
  const dispatch1 = await prisma.cashDispatch.create({
    data: {
      amount: 500000,
      carrierName: 'SafeTrans Logistics',
      notes: 'Initial site setup funds',
      status: 'RECEIVED',
      siteId: siteAlpha.id,
      createdBy: owner.id,
    }
  });

  const dispatch2 = await prisma.cashDispatch.create({
    data: {
      amount: 250000,
      carrierName: 'SecureCash India',
      notes: 'Weekly operating expense',
      status: 'PENDING_RECEIPT',
      siteId: siteBeta.id,
      createdBy: owner.id,
    }
  });
  console.log('✅ Cash dispatches created');

  // 2. Receive the cash at Site Alpha (Supervisor action)
  const receipt1 = await prisma.cashReceipt.create({
    data: {
      amountReceived: 500000,
      notes: 'Received in full. Counted by supervisor.',
      dispatchId: dispatch1.id,
      receivedBy: supervisor.id,
    }
  });
  
  // Update site ledger balance
  await prisma.ledgerEntry.create({
    data: {
      amount: 500000,
      type: 'CREDIT',
      category: 'CASH_RECEIPT',
      referenceId: receipt1.id,
      balanceAfter: 500000,
      notes: 'Cash received from owner dispatch',
      siteId: siteAlpha.id,
      createdBy: supervisor.id,
    }
  });

  // 3. Add some expenses across different categories
  const expenseData = [
    { amount: 45000, categoryId: categories[0].id, vendor: 'Local Labour Union', note: 'Weekly wages' },
    { amount: 120000, categoryId: categories[1].id, vendor: 'UltraTech Cement', note: '500 bags of cement' },
    { amount: 15000, categoryId: categories[2].id, vendor: 'FastTrack Transport', note: 'Material delivery' },
    { amount: 35000, categoryId: categories[4].id, vendor: 'JCB Rentals', note: 'Excavator rental 2 days' }
  ];

  let currentBalance = 500000;
  
  for (const exp of expenseData) {
    const expense = await prisma.expense.create({
      data: {
        amount: exp.amount,
        vendorName: exp.vendor,
        notes: exp.note,
        date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // Random date in last 4 months
        categoryId: exp.categoryId,
        siteId: siteAlpha.id,
        createdBy: supervisor.id,
      }
    });

    currentBalance -= exp.amount;

    await prisma.ledgerEntry.create({
      data: {
        amount: exp.amount,
        type: 'DEBIT',
        category: 'EXPENSE',
        referenceId: expense.id,
        balanceAfter: currentBalance,
        notes: `Expense: ${exp.note}`,
        siteId: siteAlpha.id,
        createdBy: supervisor.id,
      }
    });
  }
  console.log('✅ Site expenses and ledger updated');

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
