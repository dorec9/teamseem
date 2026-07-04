"use client";

import { useMemo } from "react";

import { useAgentStore } from "@/stores/agent-store";
import { useSessionStore } from "@/stores/session-store";
import { useMessageStore } from "@/stores/message-store";
import AgentStatusBadge from "./AgentStatusBadge";

export default function AgentPanel() {
  const agents = useAgentStore((s) => s.agents);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const messages = useMessageStore((s) => s.messages);
  const filter = useMessageStore((s) => s.filter);
  const setFilter = useMessageStore((s) => s.setFilter);

  const filtered = useMemo(() => {
    let result = activeSessionId
      ? agents.filter((a) => a.sessionId === activeSessionId)
      : agents;
    return result.filter(a => a.status !== "stopped");
  }, [agents, activeSessionId]);

  const rootAgents = useMemo(() => filtered.filter(
    (a) => !a.parentAgentId || !filtered.some((f) => f.id === a.parentAgentId)
  ), [filtered]);

  const lastToolMessagesByAgent = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of messages) {
      if (m.toolName) {
        map.set(m.agentId, m.toolName);
      }
    }
    return map;
  }, [messages]);

  const renderAgent = (agent: typeof agents[0], depth = 0) => {
    const lastToolName = lastToolMessagesByAgent.get(agent.id) || null;

    const children = filtered.filter((a) => a.parentAgentId === agent.id);
    const isSelected = filter.agentId === agent.id;

    return (
      <div key={agent.id} className="flex flex-col gap-2">
        <li
          onClick={() => setFilter({ agentId: isSelected ? null : agent.id })}
          style={{ marginLeft: `${depth * 1.5}rem` }}
          className={`group relative flex flex-col rounded-xl border bg-foreground/[0.02] p-3 transition-all cursor-pointer hover:bg-foreground/[0.04] hover:shadow-sm ${
            isSelected ? "border-indigo-500/50 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]" : "border-foreground/5"
          }`}
        >
          {depth > 0 && (
            <div
              className="absolute -left-6 top-6 h-px w-5 bg-foreground/10"
            />
          )}
          {depth > 0 && (
            <div
              className="absolute -left-6 -top-2 bottom-6 w-px bg-foreground/10"
            />
          )}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M12 8V4H8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M2 14h2" />
                  <path d="M20 14h2" />
                  <path d="M15 13v2" />
                  <path d="M9 13v2" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground/90">
                  {agent.name}
                </span>
                {agent.status === "working" && lastToolName && (
                  <span className="text-[10px] text-foreground/50 animate-pulse">
                    실행 중: {lastToolName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AgentStatusBadge status={agent.status} />
            </div>
          </div>
        </li>
        {children.length > 0 && (
          <div className="flex flex-col gap-2">
            {children.map((child) => renderAgent(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-background/50 backdrop-blur-sm border-r border-foreground/10 shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.02)]">
      <div className="border-b border-foreground/10 bg-foreground/[0.02] px-5 py-4">
        <h2 className="text-sm font-bold tracking-wide text-foreground/90 flex items-center gap-2">
          참여 중인 에이전트
          <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400">
            {filtered.length}
          </span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-sm text-foreground/40">
            <div className="mb-2 h-8 w-8 rounded-full border-2 border-dashed border-foreground/20" />
            에이전트 대기 중...
          </div>
        ) : (
          <ul className="space-y-2">
            {rootAgents.map((agent) => renderAgent(agent))}
          </ul>
        )}
      </div>
    </div>
  );
}
