const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dispatches = await prisma.cashDispatch.findMany({
    where: { status: 'PENDING_RECEIPT' }
  });
  console.log("DB RESULTS:");
  dispatches.forEach(d => {
    console.log(`ID: ${d.id}, amount: ${d.amount}, commissionAmount: ${d.commissionAmount}, amountAfterCommission: ${d.amountAfterCommission}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
