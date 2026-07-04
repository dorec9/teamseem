import Dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { Task, Agent } from "@/lib/types";

interface TaskNodeData extends Record<string, unknown> {
  label: string;
  agentName: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

interface AgentNodeData extends Record<string, unknown> {
  label: string;
  status: string;
  lastSeen: string;
}

const TASK_NODE_WIDTH = 220;
const TASK_NODE_HEIGHT = 80;

const AGENT_NODE_WIDTH = 220;
const AGENT_NODE_HEIGHT = 70;

export function buildFlowElements(
  agents: Agent[],
  tasks: Task[],
): {
  nodes: Node[];
  edges: Edge[];
} {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 60 });

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Add Agents to graph
  for (const agent of agents) {
    g.setNode(`agent-${agent.id}`, { width: AGENT_NODE_WIDTH, height: AGENT_NODE_HEIGHT });
    nodes.push({
      id: `agent-${agent.id}`,
      type: "agentNode",
      position: { x: 0, y: 0 },
      data: {
        label: agent.name,
        status: agent.status,
        lastSeen: agent.lastSeen,
      } as AgentNodeData,
    });

    if (agent.parentAgentId) {
      g.setEdge(`agent-${agent.parentAgentId}`, `agent-${agent.id}`);
      edges.push({
        id: `edge-agent-${agent.parentAgentId}-to-${agent.id}`,
        source: `agent-${agent.parentAgentId}`,
        target: `agent-${agent.id}`,
        animated: agent.status === "working",
        style: { stroke: "#6366f1", strokeWidth: 2 },
      });
    }
  }

  // Add Tasks to graph
  for (const task of tasks) {
    g.setNode(`task-${task.id}`, { width: TASK_NODE_WIDTH, height: TASK_NODE_HEIGHT });
    nodes.push({
      id: `task-${task.id}`,
      type: "taskNode",
      position: { x: 0, y: 0 },
      data: {
        label: task.description,
        agentName: task.agentName,
        status: task.status,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
      } as TaskNodeData,
    });

    if (task.parentTaskId) {
      // Task to Subtask edge
      g.setEdge(`task-${task.parentTaskId}`, `task-${task.id}`);
      edges.push({
        id: `edge-task-${task.parentTaskId}-to-${task.id}`,
        source: `task-${task.parentTaskId}`,
        target: `task-${task.id}`,
        animated: task.status === "in_progress" || task.status === "created",
      });
    } else if (task.agentId) {
      // Agent to Top-level Task edge
      g.setEdge(`agent-${task.agentId}`, `task-${task.id}`);
      edges.push({
        id: `edge-agent-${task.agentId}-to-task-${task.id}`,
        source: `agent-${task.agentId}`,
        target: `task-${task.id}`,
        animated: task.status === "in_progress",
        style: { stroke: "#94a3b8", strokeDasharray: "5,5" },
      });
    }
  }

  Dagre.layout(g);

  for (const node of nodes) {
    const pos = g.node(node.id);
    const width = node.type === "agentNode" ? AGENT_NODE_WIDTH : TASK_NODE_WIDTH;
    const height = node.type === "agentNode" ? AGENT_NODE_HEIGHT : TASK_NODE_HEIGHT;
    node.position = {
      x: pos.x - width / 2,
      y: pos.y - height / 2,
    };
  }

  return { nodes, edges };
}
