import type { HookEventType } from "@/lib/types";

interface HookEntry {
  type: "command";
  command: string;
}

interface HookConfig {
  hooks: Partial<Record<HookEventType, HookEntry[]>>;
}

const HOOK_EVENTS: HookEventType[] = [
  "PreToolUse",
  "PostToolUse",
  "SubagentStart",
  "SubagentStop",
  "Stop",
  "TaskCreated",
  "TaskCompleted",
];

function buildCurlCommand(serverUrl: string): string {
  const endpoint = `${serverUrl}/api/events`;
  return `curl -s -X POST ${endpoint} -H 'Content-Type: application/json' -d '$CLAUDE_HOOK_PAYLOAD'`;
}

export function generateHookConfig(serverUrl: string): HookConfig {
  const normalizedUrl = serverUrl.replace(/\/+$/, "");
  const command = buildCurlCommand(normalizedUrl);

  const hooks: HookConfig["hooks"] = {};
  for (const event of HOOK_EVENTS) {
    hooks[event] = [{ type: "command", command }];
  }

  return { hooks };
}
