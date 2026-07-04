import type { AgentStatus } from "@/lib/types";
import { memo } from "react";

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; color: string; pulse?: boolean }
> = {
  idle: { label: "대기", color: "bg-zinc-500" },
  working: { label: "작업중", color: "bg-indigo-500", pulse: true },
  stopped: { label: "중지", color: "bg-red-500" },
  error: { label: "오류", color: "bg-yellow-500" },
};

const FALLBACK_CONFIG = { label: "알 수 없음", color: "bg-zinc-400" };

function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? FALLBACK_CONFIG;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/50 px-2.5 py-1 text-xs font-medium text-foreground/80 shadow-sm backdrop-blur-sm">
      <span className="relative flex h-2 w-2 items-center justify-center">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.color} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${config.color} ${
            config.pulse ? "shadow-[0_0_8px_rgba(99,102,241,0.8)]" : ""
          }`}
        />
      </span>
      {config.label}
    </span>
  );
}

export default memo(AgentStatusBadge);
