import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const result = await prisma.message.deleteMany({
    where: { eventType: 'AgentStateChange' }
  });
  console.log(`Deleted ${result.count} AgentStateChange messages.`);
}
main().finally(() => prisma.$disconnect());
