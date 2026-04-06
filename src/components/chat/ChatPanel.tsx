"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMessageStore } from "@/stores/message-store";
import { useSessionStore } from "@/stores/session-store";
import ChatMessage from "./ChatMessage";
import ChatFilter from "./ChatFilter";

const SCROLL_THRESHOLD = 80;

export default function ChatPanel() {
  const messages = useMessageStore((s) => s.messages);
  const filter = useMessageStore((s) => s.filter);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [seenCount, setSeenCount] = useState(0);

  const filtered = useMemo(() => {
    let result = activeSessionId
      ? messages.filter((m) => m.sessionId === activeSessionId)
      : messages;

    if (filter.agentId) {
      result = result.filter((m) => m.agentId === filter.agentId);
    }
    if (filter.eventType) {
      result = result.filter((m) => m.eventType === filter.eventType);
    }
    if (filter.search) {
      const query = filter.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.content.toLowerCase().includes(query) ||
          m.agentName.toLowerCase().includes(query) ||
          (m.toolName && m.toolName.toLowerCase().includes(query)),
      );
    }

    return result;
  }, [messages, activeSessionId, filter]);

  const newCount = isAtBottom ? 0 : Math.max(0, filtered.length - seenCount);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
    setIsAtBottom(atBottom);
    if (atBottom) setSeenCount(filtered.length);
  }, [filtered.length]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setSeenCount(filtered.length);
    setIsAtBottom(true);
  }, [filtered.length]);

  // 바닥에 있을 때 새 메시지 오면 자동 스크롤
  useEffect(() => {
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [filtered.length, isAtBottom]);

  return (
    <div className="relative flex h-full flex-col">
      <div className="border-b border-foreground/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          대화 ({filtered.length})
        </h2>
      </div>

      <ChatFilter />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-foreground/40">
            메시지 대기 중...
          </p>
        ) : (
          <div className="divide-y divide-foreground/5">
            {filtered.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* 새 메시지 버튼 */}
      {newCount > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-foreground/90 px-4 py-1.5 text-xs font-medium text-background shadow-lg transition-colors hover:bg-foreground"
        >
          새 메시지 {newCount}개
        </button>
      )}
    </div>
  );
}
