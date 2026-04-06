import { eventStore } from "@/lib/store/event-store";

export async function GET() {
  try {
    return Response.json(eventStore.getSessionList());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return Response.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
