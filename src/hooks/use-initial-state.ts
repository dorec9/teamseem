"use client";

import { useEffect, useState } from "react";
import type { Session, SessionDetail } from "@/lib/types";
import { useSessionStore } from "@/stores/session-store";
import { useAgentStore } from "@/stores/agent-store";
import { useMessageStore } from "@/stores/message-store";
import { useTaskStore } from "@/stores/task-store";

export function useInitialState() {
  const [loaded, setLoaded] = useState(false);
  const addSession = useSessionStore((s) => s.addSession);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const addOrUpdateAgent = useAgentStore((s) => s.addOrUpdateAgent);
  const addMessage = useMessageStore((s) => s.addMessage);
  const addOrUpdateTask = useTaskStore((s) => s.addOrUpdateTask);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/sessions");
        if (!res.ok) return;

        const sessions: Session[] = await res.json();
        if (cancelled || sessions.length === 0) return;

        // 세션 등록
        for (const session of sessions) {
          addSession(session);
        }

        // 각 세션의 상세 데이터 병렬 로드
        const details = await Promise.allSettled(
          sessions.map((s) =>
            fetch(`/api/sessions/${s.id}`).then((r) =>
              r.ok ? (r.json() as Promise<SessionDetail>) : null,
            ),
          ),
        );

        if (cancelled) return;

        for (const result of details) {
          if (result.status !== "fulfilled" || !result.value) continue;
          const detail = result.value;
          for (const agent of detail.agents) addOrUpdateAgent(agent);
          for (const message of detail.messages) addMessage(message);
          for (const task of detail.tasks) addOrUpdateTask(task);
        }

        // 첫 번째 활성 세션 선택
        const active = sessions.find((s) => s.status === "active");
        if (active) setActiveSession(active.id);
        else if (sessions.length > 0) setActiveSession(sessions[0].id);
      } catch {
        // 서버 미응답 시 무시
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [
    addSession,
    setActiveSession,
    addOrUpdateAgent,
    addMessage,
    addOrUpdateTask,
  ]);

  return loaded;
}
