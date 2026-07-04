const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.agent.deleteMany({ where: { parentAgentId: { not: null } } });
  console.log('Subagents deleted from DB');
}
main().finally(() => prisma.$disconnect());
