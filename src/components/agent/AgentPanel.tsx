"use client";

import { useAgentStore } from "@/stores/agent-store";
import { useSessionStore } from "@/stores/session-store";
import AgentStatusBadge from "./AgentStatusBadge";

export default function AgentPanel() {
  const agents = useAgentStore((s) => s.agents);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const filtered = activeSessionId
    ? agents.filter((a) => a.sessionId === activeSessionId)
    : agents;

  return (
    <div className="flex h-full flex-col border-r border-foreground/10">
      <div className="border-b border-foreground/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          에이전트 ({filtered.length})
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-foreground/40">
            에이전트 대기 중...
          </p>
        ) : (
          <ul className="divide-y divide-foreground/5">
            {filtered.map((agent) => (
              <li
                key={agent.id}
                className="px-4 py-3 transition-colors hover:bg-foreground/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {agent.name}
                  </span>
                  <AgentStatusBadge status={agent.status} />
                </div>
                {agent.parentAgentId && (
                  <p className="mt-1 text-xs text-foreground/40">
                    상위: {agent.parentAgentId.slice(0, 8)}...
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
