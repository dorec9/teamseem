"use client";

import { useMemo } from "react";
import { useAgentStore } from "@/stores/agent-store";
import { useMessageStore } from "@/stores/message-store";
import { useTaskStore } from "@/stores/task-store";
import { useSessionStore } from "@/stores/session-store";

function formatDuration(startedAt: string): string {
  const diff = Date.now() - new Date(startedAt).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}시간 ${minutes % 60}분`;
  if (minutes > 0) return `${minutes}분`;
  return `${seconds}초`;
}

interface StatItemProps {
  label: string;
  value: string | number;
  color?: string;
}

function StatItem({ label, value, color }: StatItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-foreground/40">{label}</span>
      <span className={`text-sm font-semibold ${color ?? "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

export default function StatsBar() {
  const agents = useAgentStore((s) => s.agents);
  const messages = useMessageStore((s) => s.messages);
  const tasks = useTaskStore((s) => s.tasks);
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const stats = useMemo(() => {
    const sessionAgents = activeSessionId
      ? agents.filter((a) => a.sessionId === activeSessionId)
      : agents;
    const sessionMessages = activeSessionId
      ? messages.filter((m) => m.sessionId === activeSessionId)
      : messages;
    const sessionTasks = activeSessionId
      ? tasks.filter((t) => t.sessionId === activeSessionId)
      : tasks;

    const working = sessionAgents.filter((a) => a.status === "working").length;
    const completedTasks = sessionTasks.filter(
      (t) => t.status === "completed",
    ).length;

    const activeSession = sessions.find((s) => s.id === activeSessionId);
    const duration = activeSession
      ? formatDuration(activeSession.startedAt)
      : "-";

    return {
      agentCount: sessionAgents.length,
      workingCount: working,
      messageCount: sessionMessages.length,
      taskCount: sessionTasks.length,
      completedTasks,
      duration,
    };
  }, [agents, messages, tasks, sessions, activeSessionId]);

  return (
    <div className="flex items-center gap-6 border-t border-foreground/10 px-4 py-1.5">
      <StatItem
        label="에이전트"
        value={`${stats.workingCount}/${stats.agentCount}`}
        color="text-green-400"
      />
      <StatItem label="메시지" value={stats.messageCount} />
      <StatItem
        label="태스크"
        value={`${stats.completedTasks}/${stats.taskCount}`}
        color="text-blue-400"
      />
      <StatItem label="경과" value={stats.duration} />
    </div>
  );
}
