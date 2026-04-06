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
]);

const CONTENT_PREVIEW_LIMIT = 200;

function safeString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function buildContent(raw: RawHookPayload): string {
  const eventType = raw.hook_event_name;
  const toolName = raw.tool_name ?? "";

  if (eventType === "PreToolUse" && raw.tool_input) {
    const input = raw.tool_input;

    if (toolName === "Bash") {
      const command = safeString(input.command);
      if (command) return `명령어 실행 중: ${command}`;
    }
    if (toolName === "Read") {
      const filePath = safeString(input.file_path);
      if (filePath) return `${filePath} 파일을 읽고 있습니다`;
    }
    if (toolName === "Edit") {
      const filePath = safeString(input.file_path);
      if (filePath) return `${filePath} 파일을 수정하고 있습니다`;
    }
    if (toolName === "Write") {
      const filePath = safeString(input.file_path);
      if (filePath) return `${filePath} 파일을 생성하고 있습니다`;
    }
    if (toolName === "Grep") {
      const pattern = safeString(input.pattern);
      if (pattern) return `코드에서 '${pattern}' 검색 중`;
    }
    if (toolName === "Glob") {
      const pattern = safeString(input.pattern);
      if (pattern) return `'${pattern}' 패턴으로 파일 찾는 중`;
    }
    if (toolName === "Agent") {
      const desc = safeString(input.description) ?? safeString(input.prompt);
      if (desc) return `에이전트를 생성하고 있습니다: ${desc}`;
      return "에이전트를 생성하고 있습니다";
    }

    return `${toolName} 실행 중`;
  }

  if (eventType === "PostToolUse" && raw.tool_response) {
    const resp = raw.tool_response;
    if (resp.stderr) {
      const preview = resp.stderr.slice(0, CONTENT_PREVIEW_LIMIT);
      return `${toolName} 오류 발생: ${preview}`;
    }
    if (resp.stdout) {
      const preview = resp.stdout.slice(0, CONTENT_PREVIEW_LIMIT);
      return `${toolName} 완료: ${preview}${resp.stdout.length > CONTENT_PREVIEW_LIMIT ? "..." : ""}`;
    }
    return `${toolName} 완료`;
  }

  if (eventType === "SubagentStart") {
    const name = raw.agent_name ?? "unknown";
    return `서브에이전트 '${name}' 시작`;
  }

  if (eventType === "SubagentStop") {
    const name = raw.agent_name ?? "unknown";
    return `서브에이전트 '${name}' 종료`;
  }

  if (eventType === "TaskCreated") {
    return `새 태스크: ${raw.description ?? "태스크"}`;
  }

  if (eventType === "TaskCompleted") {
    return `태스크 완료: ${raw.description ?? ""}`;
  }

  if (eventType === "Stop") {
    return "세션 종료";
  }

  if (raw.description) return raw.description;

  return eventType;
}

export function isRawHookPayload(body: unknown): body is RawHookPayload {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;
  return (
    typeof obj.session_id === "string" &&
    typeof obj.hook_event_name === "string"
  );
}

export function normalizePayload(raw: RawHookPayload): HookEvent | null {
  if (!VALID_EVENT_TYPES.has(raw.hook_event_name)) return null;
  if (!raw.session_id.trim()) return null;

  return {
    type: raw.hook_event_name as HookEventType,
    sessionId: raw.session_id,
    timestamp: new Date().toISOString(),
    agentId: raw.agent_id || raw.session_id,
    agentName: raw.agent_name || "Claude",
    taskId: raw.task_id,
    parentTaskId: raw.parent_task_id,
    toolName: raw.tool_name,
    content: buildContent(raw),
    metadata: {
      toolUseId: raw.tool_use_id,
      cwd: raw.cwd,
      permissionMode: raw.permission_mode,
      toolInput: raw.tool_input,
      toolResponse: raw.tool_response,
    },
  };
}
