import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const sites = await prisma.site.findMany({ select: { id: true, name: true, code: true, currentBalance: true, status: true } });
  const dispatches = await prisma.cashDispatch.count();
  const receipts = await prisma.cashReceipt.count();
  const expenses = await prisma.expense.count();
  const ledger = await prisma.ledgerEntry.count();
  const categories = await prisma.expenseCategory.count();
  const notifications = await prisma.notification.count();

  console.log('========== DATABASE AUDIT ==========');
  console.log(`Users:          ${users}`);
  console.log(`Sites:          ${sites.length}`);
  sites.forEach(s => console.log(`  - ${s.code} | ${s.name} | Balance: ${s.currentBalance} | Status: ${s.status}`));
  console.log(`Categories:     ${categories}`);
  console.log(`Dispatches:     ${dispatches}`);
  console.log(`Receipts:       ${receipts}`);
  console.log(`Expenses:       ${expenses}`);
  console.log(`Ledger Entries: ${ledger}`);
  console.log(`Notifications:  ${notifications}`);
  console.log('====================================');

  // Show some sample dispatches
  if (dispatches > 0) {
    const sampleDispatches = await prisma.cashDispatch.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { site: { select: { name: true } } } });
    console.log('\n--- Sample Dispatches ---');
    sampleDispatches.forEach(d => console.log(`  ${d.site.name} | ₹${d.amount} | ${d.carrierName} | ${d.status} | ${d.dispatchDate}`));
  }

  // Show some sample expenses
  if (expenses > 0) {
    const sampleExpenses = await prisma.expense.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { site: { select: { name: true } }, category: { select: { name: true } } } });
    console.log('\n--- Sample Expenses ---');
    sampleExpenses.forEach(e => console.log(`  ${e.site.name} | ₹${e.amount} | ${e.vendorName} | ${e.category.name} | ${e.status}`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
