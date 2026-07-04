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
        const res = await fetch("/api/sessions", { cache: "no-store" });
        if (!res.ok) return;

        const sessions: Session[] = await res.json();
        if (cancelled || sessions.length === 0) return;

        // 세션 등록
        for (const session of sessions) {
          addSession(session);
        }

        // 첫 번째 활성 세션 선택 (없으면 첫 번째 세션)
        const active = sessions.find((s) => s.status === "active") || sessions[0];
        
        if (active) {
          setActiveSession(active.id);
          // 활성 세션 디테일만 로드
          const detailRes = await fetch(`/api/sessions/${active.id}`);
          if (detailRes.ok) {
            const detail: SessionDetail = await detailRes.json();
            for (const agent of detail.agents) addOrUpdateAgent(agent);
            for (const message of detail.messages) addMessage(message);
            for (const task of detail.tasks) addOrUpdateTask(task);
            useSessionStore.getState().markSessionLoaded(active.id);
          }
        }
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
