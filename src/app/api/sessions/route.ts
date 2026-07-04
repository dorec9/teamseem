import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { startedAt: "desc" },
    });
    return Response.json(sessions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return Response.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

import { v4 as uuidv4 } from "uuid";

export async function POST() {
  try {
    const newSession = await prisma.session.create({
      data: {
        id: uuidv4(),
        status: "active",
      },
    });
    return Response.json(newSession, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return Response.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
