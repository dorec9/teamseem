import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Bot } from "lucide-react";

interface AgentNodeProps {
  data: {
    label: string;
    status: string;
    lastSeen: string;
    isSubAgent?: boolean;
  };
  selected?: boolean;
}

function AgentNode({ data, selected }: AgentNodeProps) {
  const isWorking = data.status === "working";
  const isError = data.status === "error";
  const isStopped = data.status === "stopped";
  const isSubAgent = data.isSubAgent;

  const borderColor = selected
    ? "border-indigo-500/50 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]"
    : isWorking
    ? "border-indigo-500/30"
    : isError
      ? "border-red-500/50"
      : isStopped
        ? "border-zinc-500/50"
        : "border-foreground/10";

  const glowClass = isWorking ? "shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "";
  const bgClass = isSubAgent ? "bg-background/50 border-dashed" : "bg-background/90";

  return (
    <div
      className={`relative min-w-[200px] rounded-xl border ${borderColor} ${bgClass} p-3 backdrop-blur-sm transition-all ${glowClass}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!border-background !bg-foreground/20"
      />
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5`}
          >
            <Bot className="h-5 w-5 text-foreground/70" />
          </div>
          {isWorking && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-500"></span>
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <span className="truncate text-sm font-semibold text-foreground">
            {data.label}
          </span>
          <span className="text-xs text-foreground/50">
            {data.status === "working"
              ? "작업중"
              : data.status === "stopped"
                ? "중지"
                : "대기"}
          </span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!border-background !bg-foreground/20"
      />
    </div>
  );
}

export default memo(AgentNode);
