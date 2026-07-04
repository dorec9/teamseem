import type { HookEvent, HookEventType, RawHookPayload } from "@/lib/types";

export const VALID_EVENT_TYPES: ReadonlySet<string> = new Set<HookEventType>([
  "PreToolUse",
  "PostToolUse",
  "TaskCreated",
  "TaskCompleted",
  "TeammateIdle",
  "SessionStart",
  "Stop",
  "SubagentStart",
  "SubagentStop",
  "UserPrompt",
  "PreInvocation",
  "PostInvocation",
  "AgentResponse",
  "AgentStateChange"
]);

const CONTENT_PREVIEW_LIMIT = 200;

function safeString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function buildContent(raw: RawHookPayload): string {
  const eventType = raw.hook_event_name;
  const toolName = raw.toolCall?.name ?? "";

  if (eventType === "PreToolUse" && raw.toolCall) {
    const args = raw.toolCall.args;

    if (toolName === "run_command") {
      const command = safeString(args.CommandLine);
      if (command) return `명령어 실행 중: ${command}`;
    }
    if (toolName === "view_file") {
      const filePath = safeString(args.AbsolutePath);
      if (filePath) return `${filePath} 파일을 읽고 있습니다`;
    }
    if (toolName === "replace_file_content" || toolName === "multi_replace_file_content") {
      const filePath = safeString(args.TargetFile);
      if (filePath) return `${filePath} 파일을 수정하고 있습니다`;
    }
    if (toolName === "write_to_file") {
      const filePath = safeString(args.TargetFile);
      if (filePath) return `${filePath} 파일을 생성하고 있습니다`;
    }
    if (toolName === "grep_search") {
      const pattern = safeString(args.Query);
      if (pattern) return `코드에서 '${pattern}' 검색 중`;
    }
    if (toolName === "find_by_name") {
      const pattern = safeString(args.Pattern);
      if (pattern) return `'${pattern}' 패턴으로 파일 찾는 중`;
    }
    if (toolName === "invoke_subagent") {
      return "에이전트를 생성하고 있습니다";
    }

    return `${toolName} 도구 실행 중`;
  }

  if (eventType === "PostToolUse") {
    if (raw.error) {
      const preview = raw.error.slice(0, CONTENT_PREVIEW_LIMIT);
      return `오류 발생: ${preview}`;
    }
    return `도구 실행 완료`;
  }

  if (eventType === "PreInvocation") {
    return "모델 추론 시작 (PreInvocation)";
  }

  if (eventType === "PostInvocation") {
    return "모델 응답 수신 (PostInvocation)";
  }

  if (eventType === "Stop") {
    if (raw.terminationReason === "error" && raw.error) {
      return `세션 에러 종료: ${raw.error}`;
    }
    return "세션 종료";
  }

  return eventType || "Unknown Event";
}

export function isRawHookPayload(body: unknown): body is RawHookPayload {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;
  return typeof obj.conversationId === "string";
}

export function normalizePayload(raw: RawHookPayload): HookEvent | null {
  const eventName = raw.hook_event_name || "Unknown";
  if (!VALID_EVENT_TYPES.has(eventName)) return null;
  if (!raw.conversationId.trim()) return null;

  return {
    type: eventName as HookEventType,
    sessionId: raw.conversationId,
    timestamp: new Date().toISOString(),
    agentId: (raw as any).agentId || raw.conversationId,
    agentName: (raw as any).agentName || "Antigravity Agent",
    toolName: raw.toolCall?.name,
    content: buildContent(raw),
    metadata: {
      ...(raw.metadata || {}),
      cwd: raw.workspacePaths?.[0],
      toolInput: raw.toolCall?.args,
      error: raw.error,
    },
  };
}
