"use client";

import { useMessageStore } from "@/stores/message-store";
import { useAgentStore } from "@/stores/agent-store";
import { useSessionStore } from "@/stores/session-store";
import type { HookEventType } from "@/lib/types";

const EVENT_TYPE_OPTIONS: { value: HookEventType; label: string }[] = [
  { value: "PreToolUse", label: "도구 실행" },
  { value: "PostToolUse", label: "도구 완료" },
  { value: "TaskCreated", label: "태스크 생성" },
  { value: "TaskCompleted", label: "태스크 완료" },
  { value: "SessionStart", label: "세션 시작" },
  { value: "Stop", label: "세션 종료" },
  { value: "SubagentStart", label: "서브에이전트 시작" },
  { value: "SubagentStop", label: "서브에이전트 종료" },
  { value: "TeammateIdle", label: "대기" },
  { value: "UserPrompt", label: "사용자 입력" },
];

export default function ChatFilter() {
  const filter = useMessageStore((s) => s.filter);
  const setFilter = useMessageStore((s) => s.setFilter);
  const resetFilter = useMessageStore((s) => s.resetFilter);
  const agents = useAgentStore((s) => s.agents);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const sessionAgents = activeSessionId
    ? agents.filter((a) => a.sessionId === activeSessionId)
    : agents;

  const hasFilter = filter.agentId || filter.eventType || filter.search;

  return (
    <div className="flex items-center gap-2 border-b border-foreground/10 px-4 py-2">
      {/* 텍스트 검색 */}
      <input
        type="text"
        placeholder="메시지 검색..."
        value={filter.search}
        onChange={(e) => setFilter({ search: e.target.value })}
        className="flex-1 rounded-md border border-foreground/15 bg-transparent px-2.5 py-1 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20"
      />

      {/* 에이전트 필터 */}
      <select
        value={filter.agentId ?? ""}
        onChange={(e) => setFilter({ agentId: e.target.value || null })}
        className="rounded-md border border-foreground/15 bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
      >
        <option value="">모든 에이전트</option>
        {sessionAgents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>

      {/* 이벤트 타입 필터 */}
      <select
        value={filter.eventType ?? ""}
        onChange={(e) =>
          setFilter({
            eventType: (e.target.value as HookEventType) || null,
          })
        }
        className="rounded-md border border-foreground/15 bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
      >
        <option value="">모든 이벤트</option>
        {EVENT_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 초기화 */}
      {hasFilter && (
        <button
          onClick={resetFilter}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          초기화
        </button>
      )}
    </div>
  );
}
