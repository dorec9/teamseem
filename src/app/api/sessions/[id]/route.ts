import { eventStore } from "@/lib/store/event-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const detail = eventStore.getSessionDetail(id);

  if (!detail) {
    return Response.json(
      { error: "세션을 찾을 수 없습니다", code: "NOT_FOUND" },
      { status: 404 },
    );
  }

  return Response.json(detail);
}
