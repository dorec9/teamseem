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
      if (command) return `$ ${command}`;
    }
    if (toolName === "Edit" || toolName === "Write" || toolName === "Read") {
      const filePath = safeString(input.file_path);
      if (filePath) return `${toolName}: ${filePath}`;
    }
    if (toolName === "Grep" || toolName === "Glob") {
      const pattern = safeString(input.pattern);
      if (pattern) return `${toolName}: ${pattern}`;
    }

    const desc =
      safeString(input.description) ?? safeString(input.prompt) ?? toolName;
    return `${toolName}: ${desc}`;
  }

  if (eventType === "PostToolUse" && raw.tool_response) {
    const resp = raw.tool_response;
    if (resp.stdout) {
      const preview = resp.stdout.slice(0, CONTENT_PREVIEW_LIMIT);
      return `${toolName} 완료: ${preview}${resp.stdout.length > CONTENT_PREVIEW_LIMIT ? "..." : ""}`;
    }
    if (resp.stderr) {
      return `${toolName} 오류: ${resp.stderr.slice(0, CONTENT_PREVIEW_LIMIT)}`;
    }
    return `${toolName} 완료`;
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
    },
  };
}
