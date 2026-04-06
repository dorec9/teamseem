"use client";

import { useEffect, useRef, useState } from "react";
import type { SSEEvent, Agent, Message, Task, Session } from "@/lib/types";
import { useSessionStore } from "@/stores/session-store";
import { useAgentStore } from "@/stores/agent-store";
import { useMessageStore } from "@/stores/message-store";
import { useTaskStore } from "@/stores/task-store";

type ConnectionState = "connecting" | "connected" | "disconnected";

const MAX_RETRY_DELAY_MS = 30000;
const BASE_RETRY_DELAY_MS = 1000;

export function useEventStream() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const retryCount = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  const addSession = useSessionStore((s) => s.addSession);
  const updateSession = useSessionStore((s) => s.updateSession);
  const addOrUpdateAgent = useAgentStore((s) => s.addOrUpdateAgent);
  const addMessage = useMessageStore((s) => s.addMessage);
  const addOrUpdateTask = useTaskStore((s) => s.addOrUpdateTask);

  useEffect(() => {
    let mounted = true;
    let retryTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      if (!mounted) return;

      setConnectionState("connecting");
      const es = new EventSource("/api/events/stream");
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!mounted) return;
        retryCount.current = 0;
        setConnectionState("connected");
      };

      es.onmessage = (event) => {
        if (!mounted) return;
        try {
          const sseEvent = JSON.parse(event.data) as SSEEvent;
          dispatch(sseEvent);
        } catch {
          // 파싱 실패 무시
        }
      };

      es.onerror = () => {
        if (!mounted) return;
        es.close();
        setConnectionState("disconnected");

        const delay = Math.min(
          BASE_RETRY_DELAY_MS * Math.pow(2, retryCount.current),
          MAX_RETRY_DELAY_MS,
        );
        retryCount.current += 1;
        retryTimeout = setTimeout(connect, delay);
      };
    }

    function dispatch(event: SSEEvent) {
      switch (event.type) {
        case "session": {
          const session = event.data as Session;
          addSession(session);
          updateSession(session);
          break;
        }
        case "agent":
          addOrUpdateAgent(event.data as Agent);
          break;
        case "message":
          addMessage(event.data as Message);
          break;
        case "task":
          addOrUpdateTask(event.data as Task);
          break;
      }
    }

    connect();

    return () => {
      mounted = false;
      clearTimeout(retryTimeout);
      eventSourceRef.current?.close();
    };
  }, [
    addSession,
    updateSession,
    addOrUpdateAgent,
    addMessage,
    addOrUpdateTask,
  ]);

  return connectionState;
}
