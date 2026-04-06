import { type NextRequest } from "next/server";
import { eventStore } from "@/lib/store/event-store";
import type { HookEvent } from "@/lib/types";
import {
  isRawHookPayload,
  normalizePayload,
  VALID_EVENT_TYPES,
} from "@/lib/store/normalize-payload";

function isNormalizedHookEvent(body: unknown): body is HookEvent {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;
  return (
    typeof obj.type === "string" &&
    VALID_EVENT_TYPES.has(obj.type) &&
    typeof obj.sessionId === "string" &&
    typeof obj.timestamp === "string"
  );
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return Response.json(
      {
        error: "Content-Type must be application/json",
        code: "INVALID_CONTENT_TYPE",
      },
      { status: 415 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "유효하지 않은 JSON", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  try {
    let hookEvent: HookEvent | null = null;

    if (isRawHookPayload(body)) {
      hookEvent = normalizePayload(body);
    } else if (isNormalizedHookEvent(body)) {
      hookEvent = body;
    }

    if (!hookEvent) {
      return Response.json(
        { error: "invalid_event", code: "INVALID_PAYLOAD" },
        { status: 400 },
      );
    }

    const sseEvents = eventStore.addEvent(hookEvent);
    return Response.json({ ok: true, processed: sseEvents.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return Response.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({
    status: "ok",
    sessions: eventStore.getSessionList().length,
    agents: eventStore.agents.size,
    messages: eventStore.messages.length,
    tasks: eventStore.tasks.size,
  });
}
