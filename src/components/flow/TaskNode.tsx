"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { TaskStatus } from "@/lib/types";

interface TaskNodeData extends Record<string, unknown> {
  label: string;
  agentName: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

const BORDER_COLORS: Record<TaskStatus, string> = {
  created: "border-gray-500",
  in_progress: "border-blue-500",
  completed: "border-green-500",
  failed: "border-red-500",
};

const BG_COLORS: Record<TaskStatus, string> = {
  created: "bg-gray-500/10",
  in_progress: "bg-blue-500/10",
  completed: "bg-green-500/10",
  failed: "bg-red-500/10",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  created: "생성",
  in_progress: "진행중",
  completed: "완료",
  failed: "실패",
};

const DOT_COLORS: Record<TaskStatus, string> = {
  created: "bg-gray-500",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
};

const FALLBACK_BORDER = "border-gray-500";
const FALLBACK_BG = "bg-gray-500/10";
const FALLBACK_DOT = "bg-gray-500";
const FALLBACK_LABEL = "알 수 없음";

function TaskNodeComponent({ data }: NodeProps<Node<TaskNodeData>>) {
  const status = data.status as TaskStatus;
  const time = new Date(data.createdAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div
      className={`w-[220px] rounded-lg border-2 px-3 py-2 shadow-sm ${BORDER_COLORS[status] ?? FALLBACK_BORDER} ${BG_COLORS[status] ?? FALLBACK_BG}`}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />

      <div className="flex items-start justify-between gap-1">
        <p className="line-clamp-2 text-xs font-medium text-foreground">
          {data.label}
        </p>
        <span className="flex shrink-0 items-center gap-1 text-[10px] text-foreground/50">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${DOT_COLORS[status] ?? FALLBACK_DOT}`}
          />
          {STATUS_LABELS[status] ?? FALLBACK_LABEL}
        </span>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-foreground/40 gap-2">
        <span className="truncate max-w-[120px]" title={data.agentName}>{data.agentName}</span>
        <span className="shrink-0">{time}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

export default memo(TaskNodeComponent);
