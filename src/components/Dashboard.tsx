"use client";

import { useCallback, useState } from "react";
import { useInitialState } from "@/hooks/use-initial-state";
import Sidebar from "@/components/layout/Sidebar";
import ResizeHandle from "@/components/common/ResizeHandle";
import AgentPanel from "@/components/agent/AgentPanel";
import FlowPanel from "@/components/flow/FlowPanel";
import StatsBar from "@/components/common/StatsBar";

const LEFT_DEFAULT = 250;
const LEFT_MIN = 180;
const LEFT_MAX = 400;
const RIGHT_MIN = 250;

export default function Dashboard() {
  const loaded = useInitialState();
  const [leftWidth, setLeftWidth] = useState(LEFT_DEFAULT);

  const handleLeftResize = useCallback((delta: number) => {
    setLeftWidth((prev) =>
      Math.min(LEFT_MAX, Math.max(LEFT_MIN, prev + delta)),
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
        {/* 2패널 레이아웃 */}
        <div className="flex flex-1 overflow-hidden">
          <div style={{ width: leftWidth }} className="shrink-0 overflow-hidden bg-foreground/[0.02]">
            <AgentPanel />
          </div>
          <ResizeHandle onResize={handleLeftResize} />
          <div className="min-w-0 flex-1 overflow-hidden bg-foreground/[0.02]">
            <FlowPanel />
          </div>
        </div>

        {/* 하단 통계 바 */}
        <StatsBar />
      </div>
    </div>
  );
}
