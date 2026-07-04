import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";

async function main() {
  try {
    const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
    const prisma = new PrismaClient({ adapter });

    const sessions = await prisma.session.findMany();
    console.log("Success:", sessions.length);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
