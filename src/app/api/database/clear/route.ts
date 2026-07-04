import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    // Delete in order to respect foreign key constraints (if any) or just delete all
    await prisma.$transaction([
      prisma.message.deleteMany({}),
      prisma.task.deleteMany({}),
      prisma.agent.deleteMany({}),
      prisma.session.deleteMany({}),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
