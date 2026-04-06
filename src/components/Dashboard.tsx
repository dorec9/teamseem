"use client";

import { useCallback, useState } from "react";
import { useEventStream } from "@/hooks/use-event-stream";
import { useInitialState } from "@/hooks/use-initial-state";
import ConnectionStatus from "@/components/common/ConnectionStatus";
import SessionSelector from "@/components/common/SessionSelector";
import ResizeHandle from "@/components/common/ResizeHandle";
import AgentPanel from "@/components/agent/AgentPanel";
import ChatPanel from "@/components/chat/ChatPanel";
import FlowPanel from "@/components/flow/FlowPanel";
import StatsBar from "@/components/common/StatsBar";

const LEFT_DEFAULT = 250;
const LEFT_MIN = 180;
const LEFT_MAX = 400;
const RIGHT_MIN = 250;

export default function Dashboard() {
  const loaded = useInitialState();
  const connectionState = useEventStream();
  const [leftWidth, setLeftWidth] = useState(LEFT_DEFAULT);
  const [rightWidth, setRightWidth] = useState(() =>
    typeof window !== "undefined"
      ? Math.max(Math.round(window.innerWidth * 0.35), 320)
      : 400,
  );

  const handleLeftResize = useCallback((delta: number) => {
    setLeftWidth((prev) =>
      Math.min(LEFT_MAX, Math.max(LEFT_MIN, prev + delta)),
    );
  }, []);

  const handleRightResize = useCallback((delta: number) => {
    setRightWidth((prev) => {
      const maxRight =
        typeof window !== "undefined"
          ? Math.round(window.innerWidth * 0.5)
          : 800;
      return Math.min(maxRight, Math.max(RIGHT_MIN, prev - delta));
    });
  }, []);

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground/50">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* 상단 바 */}
      <header className="flex items-center justify-between border-b border-foreground/10 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">TeamSeem</h1>
          <SessionSelector />
        </div>
        <ConnectionStatus state={connectionState} />
      </header>

      {/* 3패널 레이아웃 */}
      <div className="flex flex-1 overflow-hidden">
        <div style={{ width: leftWidth }} className="shrink-0 overflow-hidden">
          <AgentPanel />
        </div>
        <ResizeHandle onResize={handleLeftResize} />
        <div className="min-w-0 flex-1 overflow-hidden">
          <ChatPanel />
        </div>
        <ResizeHandle onResize={handleRightResize} />
        <div style={{ width: rightWidth }} className="shrink-0 overflow-hidden">
          <FlowPanel />
        </div>
      </div>

      {/* 하단 통계 바 */}
      <StatsBar />
    </div>
  );
}
