"use client";

import { useMemo, useState } from "react";
import { ReactFlow, Background, Controls, type NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { GitMerge, CheckSquare } from "lucide-react";

import { useTaskStore } from "@/stores/task-store";
import { useAgentStore } from "@/stores/agent-store";
import { useSessionStore } from "@/stores/session-store";
import { useMessageStore } from "@/stores/message-store";
import { buildFlowElements } from "./flow-layout";
import TaskNode from "./TaskNode";
import AgentNode from "./AgentNode";
import TaskChecklist from "@/components/task/TaskChecklist";

const nodeTypes: NodeTypes = {
  taskNode: TaskNode,
  agentNode: AgentNode,
};

type TabType = "flow" | "tasks";

export default function FlowPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("flow");
  const tasks = useTaskStore((s) => s.tasks);
  const agents = useAgentStore((s) => s.agents);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const setFilter = useMessageStore((s) => s.setFilter);
  const filter = useMessageStore((s) => s.filter);

  const { nodes, edges, filteredTasks, filteredAgents } = useMemo(() => {
    const sessionTasks = activeSessionId
      ? tasks.filter((t) => t.sessionId === activeSessionId)
      : tasks;
      
    let sessionAgents = activeSessionId
      ? agents.filter((a) => a.sessionId === activeSessionId)
      : agents;
    sessionAgents = sessionAgents.filter(a => a.status !== "stopped" && a.id !== a.sessionId);

    const flow = buildFlowElements(sessionAgents, sessionTasks);
    
    // Sync React Flow selection with our global filter
    const syncedNodes = flow.nodes.map((n) => {
      const rawAgentId = n.id.replace("agent-", "");
      return {
        ...n,
        selected: n.type === "agentNode" && filter.agentId === rawAgentId,
      };
    });

    return { nodes: syncedNodes, edges: flow.edges, filteredTasks: sessionTasks, filteredAgents: sessionAgents };
  }, [tasks, agents, activeSessionId, filter.agentId]);

  return (
    <div className="flex h-full flex-col border-l border-foreground/10">
      <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-2">
        <h2 className="text-sm font-semibold text-foreground">
          상태 모니터링
        </h2>
        <div className="flex items-center gap-1 rounded-lg bg-foreground/5 p-1">
          <button
            onClick={() => setActiveTab("flow")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "flow"
                ? "bg-background text-foreground shadow"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            <GitMerge className="h-3.5 w-3.5" />
            다이어그램 ({filteredAgents.length})
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "tasks"
                ? "bg-background text-foreground shadow"
                : "text-foreground/50 hover:text-foreground"
            }`}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            체크리스트 {filteredTasks.length > 0 ? "(1)" : ""}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === "tasks" ? (
          <TaskChecklist />
        ) : filteredAgents.length === 0 && filteredTasks.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-foreground/40">
            데이터 대기 중...
          </p>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => {
              if (node.type === "agentNode") {
                const rawAgentId = node.id.replace("agent-", "");
                setFilter({ agentId: filter.agentId === rawAgentId ? null : rawAgentId });
              }
            }}
            fitView
            proOptions={{ hideAttribution: true }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
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
