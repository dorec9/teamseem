import type { AgentStatus } from "@/lib/types";

interface AgentStatusBadgeProps {
  status: AgentStatus;
}

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string }> = {
  idle: { label: "대기", color: "bg-gray-500" },
  working: { label: "작업중", color: "bg-green-500" },
  stopped: { label: "중지", color: "bg-red-500" },
  error: { label: "오류", color: "bg-yellow-500" },
};

const FALLBACK_CONFIG = { label: "알 수 없음", color: "bg-gray-400" };

export default function AgentStatusBadge({ status }: AgentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? FALLBACK_CONFIG;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-foreground/70">
      <span className={`inline-block h-2 w-2 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
}
