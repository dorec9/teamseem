"use client";

interface ConnectionStatusProps {
  state: "connecting" | "connected" | "disconnected";
}

const STATUS_CONFIG = {
  connecting: { label: "연결 중...", color: "bg-yellow-500" },
  connected: { label: "연결됨", color: "bg-green-500" },
  disconnected: { label: "연결 끊김", color: "bg-red-500" },
} as const;

export default function ConnectionStatus({ state }: ConnectionStatusProps) {
  const config = STATUS_CONFIG[state];

  return (
    <div className="flex items-center justify-between rounded-lg bg-foreground/[0.03] px-3 py-2 border border-foreground/5 transition-colors hover:bg-foreground/[0.05]">
      <span className="text-xs font-medium text-foreground/70">
        서버 상태
      </span>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2 items-center justify-center">
          {state === "connecting" && (
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.color} opacity-75`} />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`} />
        </span>
        <span className="text-xs font-medium text-foreground/80">{config.label}</span>
      </div>
    </div>
  );
}
