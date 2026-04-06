"use client";

import { useEventStream } from "@/hooks/use-event-stream";
import { useInitialState } from "@/hooks/use-initial-state";
import ConnectionStatus from "@/components/common/ConnectionStatus";
import SessionSelector from "@/components/common/SessionSelector";
import AgentPanel from "@/components/agent/AgentPanel";
import ChatPanel from "@/components/chat/ChatPanel";
import FlowPanel from "@/components/flow/FlowPanel";
import StatsBar from "@/components/common/StatsBar";

export default function Dashboard() {
  const loaded = useInitialState();
  const connectionState = useEventStream();

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
      <div className="grid flex-1 grid-cols-[250px_1fr_320px] overflow-hidden">
        <AgentPanel />
        <ChatPanel />
        <FlowPanel />
      </div>

      {/* 하단 통계 바 */}
      <StatsBar />
    </div>
  );
}
