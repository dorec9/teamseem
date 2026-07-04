import { prisma } from './src/lib/db';

async function main() {
  const result = await prisma.message.deleteMany({
    where: { eventType: 'AgentStateChange' }
  });
  console.log(`Deleted ${result.count} AgentStateChange messages.`);
}
main().finally(() => prisma.$disconnect());
