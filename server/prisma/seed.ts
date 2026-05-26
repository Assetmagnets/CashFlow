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
