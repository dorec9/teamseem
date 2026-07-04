import { type NextRequest } from "next/server";
import { eventStore } from "@/lib/store/event-store";
import { prisma } from "@/lib/db";
import type { HookEvent, RawHookPayload } from "@/lib/types";
import {
  isRawHookPayload,
  normalizePayload,
  VALID_EVENT_TYPES,
} from "@/lib/store/normalize-payload";
import { readNewEvents } from "@/lib/store/transcript-reader";
import type { HookEventType } from "@/lib/types";

async function processTranscript(
  raw: RawHookPayload,
  hookEvent: HookEvent,
): Promise<void> {
  if (!raw.transcriptPath) return;

  const sessionId = raw.conversationId;
  const targetAgentId = hookEvent.agentId || `${sessionId}-antigravity-1`;
  const dbCount = await prisma.message.count({
    where: {
      sessionId,
      agentId: targetAgentId,
      eventType: { in: ["UserPrompt", "PreToolUse", "PostToolUse", "AgentResponse"] }
    }
  });
  
  const newEvents = await readNewEvents(raw.transcriptPath, dbCount);

  for (const ev of newEvents) {
    const parsedEvent: HookEvent = {
      type: ev.type as HookEventType,
      sessionId,
      timestamp: ev.timestamp,
      agentId: ev.agentId || hookEvent.agentId,
      agentName: ev.type === "UserPrompt" ? "사용자" : (ev.type === "SubagentStart" ? "서브 에이전트" : hookEvent.agentName),
      taskId: ev.taskId,
      parentTaskId: ev.parentTaskId,
      toolName: ev.toolName,
      content: ev.content,
      metadata: {
        ...(ev.metadata || {}),
        parentAgentId: ev.type === "SubagentStart" ? hookEvent.agentId : undefined,
        toolInput: ev.toolInput,
        toolResponse: ev.toolResponse as any,
      }
    };
    await eventStore.addEvent(parsedEvent);
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

import { syncTasks } from "@/lib/store/task-reader";

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
    const eventName = request.nextUrl.searchParams.get("event");
    if (eventName && typeof body === "object" && body !== null) {
      (body as Record<string, unknown>).hook_event_name = eventName;
    }
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

    // Map subagent session to main session if applicable
    const existingAgent = await prisma.agent.findUnique({
      where: { id: hookEvent.agentId || hookEvent.sessionId }
    });
    
    if (existingAgent && existingAgent.sessionId) {
      hookEvent.sessionId = existingAgent.sessionId;
      if (isRawHookPayload(body)) {
        body.conversationId = existingAgent.sessionId;
      }
    }

    console.log("HOOK EVENT TYPE:", hookEvent.type);
    if (isRawHookPayload(body)) {
      console.log("RAW HOOK KEYS:", Object.keys(body));
    }
    
    const sseEvents = await eventStore.addEvent(hookEvent);
    console.log("SSE EVENTS LENGTH:", sseEvents.length);

    if (isRawHookPayload(body)) {
      if (body.transcriptPath) {
        processTranscript(body, hookEvent).catch(console.error);
      }

      // If artifactDirectoryPath is not in payload, derive it from transcriptPath
      // transcriptPath: C:\...\brain\<conversation-id>\.system_generated\logs\transcript.jsonl
      let artifactDir = body.artifactDirectoryPath;
      if (!artifactDir && body.transcriptPath) {
        const parts = body.transcriptPath.split(/\\|\//);
        const sysGenIndex = parts.indexOf(".system_generated");
        if (sysGenIndex !== -1) {
          artifactDir = parts.slice(0, sysGenIndex).join("/");
        }
      }

      if (artifactDir) {
        syncTasks(artifactDir, hookEvent.sessionId, hookEvent.agentId || hookEvent.sessionId).catch(console.error);
      }
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
