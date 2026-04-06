"use client";

import { useMemo } from "react";
import { ReactFlow, Background, Controls, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useTaskStore } from "@/stores/task-store";
import { useSessionStore } from "@/stores/session-store";
import { buildFlowFromTasks } from "./flow-layout";
import TaskNode from "./TaskNode";

const nodeTypes: NodeTypes = {
  taskNode: TaskNode,
};

export default function FlowPanel() {
  const tasks = useTaskStore((s) => s.tasks);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const { nodes, edges, filtered } = useMemo(() => {
    const sessionTasks = activeSessionId
      ? tasks.filter((t) => t.sessionId === activeSessionId)
      : tasks;
    const flow = buildFlowFromTasks(sessionTasks);
    return { ...flow, filtered: sessionTasks };
  }, [tasks, activeSessionId]);

  return (
    <div className="flex h-full flex-col border-l border-foreground/10">
      <div className="border-b border-foreground/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          태스크 ({filtered.length})
        </h2>
      </div>
      <div className="flex-1">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-foreground/40">
            태스크 대기 중...
          </p>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag
            zoomOnScroll
            minZoom={0.3}
            maxZoom={2}
          >
            <Background gap={16} size={1} color="rgba(255,255,255,0.03)" />
            <Controls
              showInteractive={false}
              className="!border-foreground/10 !bg-background/80 !shadow-none [&>button]:!border-foreground/10 [&>button]:!bg-background [&>button]:!fill-foreground/50 [&>button:hover]:!bg-foreground/10"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
