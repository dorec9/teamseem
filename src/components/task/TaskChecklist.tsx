"use client";

import { useTaskStore } from "@/stores/task-store";
import { useSessionStore } from "@/stores/session-store";
import { CheckCircle2, Circle, Clock, Bot } from "lucide-react";
import { useMemo } from "react";

export default function TaskChecklist({ agentId }: { agentId?: string }) {
  const tasks = useTaskStore((s) => s.tasks);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const filteredTasks = useMemo(() => {
    let list = activeSessionId
      ? tasks.filter((t) => t.sessionId === activeSessionId)
      : tasks;
      
    if (agentId) {
      list = list.filter((t) => t.agentId === agentId);
    }
    
    const sorted = list.sort((a, b) => {
      // 1순위: 진행 중인 태스크 (in_progress)
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (b.status === "in_progress" && a.status !== "in_progress") return 1;
      
      // 2순위: 아직 시작 안 한 태스크 (created)
      if (a.status === "created" && b.status !== "created") return -1;
      if (b.status === "created" && a.status !== "created") return 1;
      
      // 3순위: 완료된 태스크 시간순 정렬
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return sorted;
  }, [tasks, activeSessionId, agentId]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {filteredTasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-foreground/40">
          태스크가 없습니다.
        </p>
      ) : (
        <ul className="space-y-3">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === "completed";
            const isInProgress = task.status === "in_progress";
            const Icon = isCompleted
              ? CheckCircle2
              : isInProgress
                ? Clock
                : Circle;

            return (
              <li
                key={task.id}
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  isCompleted
                    ? "border-emerald-500/10 bg-emerald-500/5"
                    : isInProgress
                      ? "border-indigo-500/20 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.05)]"
                      : "border-foreground/5 bg-foreground/5"
                }`}
              >
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    isCompleted
                      ? "text-emerald-500"
                      : isInProgress
                        ? "animate-pulse text-indigo-400"
                        : "text-foreground/30"
                  }`}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p
                    className={`text-sm ${
                      isCompleted
                        ? "text-foreground/50 line-through"
                        : "text-foreground/90"
                    }`}
                  >
                    {task.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="flex items-center gap-1 text-foreground/50">
                      <Bot className="h-3 w-3" />
                      {task.agentName}
                    </span>
                    <span className="text-foreground/30">•</span>
                    <span className="text-foreground/40">
                      {new Date(task.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
