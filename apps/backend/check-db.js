const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.perfume.count();
  console.log(`Total perfumes in DB: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
