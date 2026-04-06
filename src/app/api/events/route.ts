import { type NextRequest } from "next/server";
import { eventStore } from "@/lib/store/event-store";
import type { HookEvent, RawHookPayload } from "@/lib/types";
import {
  isRawHookPayload,
  normalizePayload,
  VALID_EVENT_TYPES,
} from "@/lib/store/normalize-payload";
import { readNewUserMessages } from "@/lib/store/transcript-reader";

const lastTimestampMap = new Map<string, string>();

async function processTranscript(
  raw: RawHookPayload,
  hookEvent: HookEvent,
): Promise<void> {
  if (!raw.transcript_path) return;

  const sessionId = raw.session_id;
  const lastTs = lastTimestampMap.get(sessionId) ?? null;
  const userMessages = await readNewUserMessages(raw.transcript_path, lastTs);

  for (const msg of userMessages) {
    const userEvent: HookEvent = {
      type: "UserPrompt",
      sessionId,
      timestamp: msg.timestamp,
      agentId: hookEvent.agentId,
      agentName: "사용자",
      content: msg.content,
    };
    eventStore.addEvent(userEvent);
    lastTimestampMap.set(sessionId, msg.timestamp);
  }
}

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

    if (isRawHookPayload(body) && body.transcript_path) {
      await processTranscript(body, hookEvent);
    }

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
