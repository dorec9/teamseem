import { readFile } from "fs/promises";
import type { HookEvent } from "@/lib/types";

export interface ParsedEvent {
  type: string; // "UserPrompt", "PreToolUse", "PostToolUse"
  timestamp: string;
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolResponse?: { stdout?: string; content?: string };
}

const TOOL_NAME_KO: Record<string, string> = {
  run_command: "터미널 명령 실행",
  view_file: "파일 내용 조회",
  replace_file_content: "파일 내용 수정",
  write_to_file: "새 파일 생성",
  list_dir: "디렉토리 구조 조회",
  grep_search: "프로젝트 내 코드 검색",
  manage_task: "백그라운드 작업 관리",
  schedule: "스케줄/타이머 설정",
  ask_question: "사용자에게 질문",
  code_action: "코드 수정",
  generic: "시스템 작업",
  "default_api:replace_file_content": "파일 내용 수정",
  "default_api:write_to_file": "새 파일 생성",
  "default_api:run_command": "터미널 명령 실행",
  "default_api:view_file": "파일 내용 조회",
  "default_api:grep_search": "코드 검색",
  "default_api:manage_task": "작업 관리",
};

export async function readNewEvents(
  transcriptPath: string,
  offsetCount: number,
): Promise<ParsedEvent[]> {
  try {
    const data = await readFile(transcriptPath, "utf-8");
    const lines = data.split("\n").filter((line) => line.trim());
    const events: ParsedEvent[] = [];

    for (const line of lines) {
      let entry: any;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }

      const ts = entry.created_at;
      if (!ts) continue;

      // User Input
      if (entry.type === "USER_INPUT" && entry.source === "USER_EXPLICIT") {
        let cleanContent = entry.content || "";
        // Extract text between <USER_REQUEST> and </USER_REQUEST> if it exists
        const match = cleanContent.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
        if (match && match[1]) {
          cleanContent = match[1].trim();
        } else {
          // Remove any stray ADDITIONAL_METADATA just in case
          cleanContent = cleanContent.replace(/<ADDITIONAL_METADATA>[\s\S]*?<\/ADDITIONAL_METADATA>/g, "").trim();
        }

        events.push({
          type: "UserPrompt",
          timestamp: ts,
          content: cleanContent,
        });
      }
      
      // Planner Response (Thinking + Tool Calls)
      else if (entry.type === "PLANNER_RESPONSE" && entry.source === "MODEL") {
        // 1. Text response
        if (entry.content && typeof entry.content === "string") {
          events.push({
            type: "AgentResponse",
            timestamp: ts,
            content: entry.content,
          });
        }
        // Tool calls are intentionally ignored to keep UI clean
      }
      
      // Subagent Creation
      else if (entry.type === "INVOKE_SUBAGENT" && entry.source === "MODEL") {
        try {
          const content = entry.content || "";
          const match = content.match(/"conversationId":\s*"([^"]+)"/);
          if (match && match[1]) {
            events.push({
              type: "SubagentStart",
              timestamp: ts,
              content: "서브 에이전트 시작",
              agentId: match[1],
            });
          }
        } catch {}
      }
    }

    return events.slice(offsetCount);
  } catch {
    return [];
  }
}
