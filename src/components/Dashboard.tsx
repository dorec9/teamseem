"use client";

import { useCallback, useState } from "react";
import { useInitialState } from "@/hooks/use-initial-state";
import Sidebar from "@/components/layout/Sidebar";
import ResizeHandle from "@/components/common/ResizeHandle";
import AgentPanel from "@/components/agent/AgentPanel";
import FlowPanel from "@/components/flow/FlowPanel";
import DetailPanel from "@/components/common/DetailPanel";
import StatsBar from "@/components/common/StatsBar";
import { useMessageStore } from "@/stores/message-store";

const LEFT_DEFAULT = 340;
const LEFT_MIN = 260;
const LEFT_MAX = 400;

export default function Dashboard() {
  const loaded = useInitialState();
  const [leftWidth, setLeftWidth] = useState(LEFT_DEFAULT);
  const [chatWidth, setChatWidth] = useState(400);
  const filter = useMessageStore((s) => s.filter);

  const handleLeftResize = useCallback((delta: number) => {
    setLeftWidth((prev) =>
      Math.min(LEFT_MAX, Math.max(LEFT_MIN, prev + delta)),
    );
  }, []);

  const handleChatResize = useCallback((delta: number) => {
    setChatWidth((prev) =>
      Math.min(800, Math.max(300, prev - delta)),
    );
  }, []);

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground/50">
        <div className="animate-pulse">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <div style={{ width: leftWidth }} className="shrink-0 overflow-hidden bg-foreground/[0.02]">
            <AgentPanel />
          </div>
          <ResizeHandle onResize={handleLeftResize} />
          <div className="min-w-0 flex-1 overflow-hidden bg-foreground/[0.02] relative">
            <FlowPanel />
          </div>
          
          {filter.agentId && (
            <>
              <ResizeHandle onResize={handleChatResize} />
              <div style={{ width: chatWidth }} className="shrink-0 overflow-hidden bg-foreground/[0.02]">
                <DetailPanel />
              </div>
            </>
          )}
        </div>

        {/* 하단 통계 바 */}
        <StatsBar />
      </div>
    </div>
  );
}
