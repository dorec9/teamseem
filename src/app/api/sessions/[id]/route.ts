import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      agents: true,
      messages: { orderBy: { timestamp: "asc" } },
      tasks: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!session) {
    return Response.json(
      { error: "세션을 찾을 수 없습니다", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  // Parse metadata from JSON string back to object for messages
  const detail = {
    ...session,
    messages: session.messages.map((m) => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : undefined,
    })),
  };

  return Response.json(detail);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.session.delete({
      where: { id },
    });
    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return Response.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
