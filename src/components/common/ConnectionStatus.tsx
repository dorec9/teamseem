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
    <div className="flex items-center gap-2 text-sm text-foreground/70">
      <span className={`inline-block h-2 w-2 rounded-full ${config.color}`} />
      {config.label}
    </div>
  );
}
