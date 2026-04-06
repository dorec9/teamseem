import Dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";
import type { Task } from "@/lib/types";

interface TaskNodeData extends Record<string, unknown> {
  label: string;
  agentName: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

export function buildFlowFromTasks(tasks: Task[]): {
  nodes: Node<TaskNodeData>[];
  edges: Edge[];
} {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 30, ranksep: 50 });

  const nodes: Node<TaskNodeData>[] = tasks.map((task) => {
    g.setNode(task.id, { width: NODE_WIDTH, height: NODE_HEIGHT });

    return {
      id: task.id,
      type: "taskNode",
      position: { x: 0, y: 0 },
      data: {
        label: task.description,
        agentName: task.agentName,
        status: task.status,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
      },
    };
  });

  const edges: Edge[] = [];
  for (const task of tasks) {
    if (task.parentTaskId && tasks.some((t) => t.id === task.parentTaskId)) {
      g.setEdge(task.parentTaskId, task.id);
      edges.push({
        id: `${task.parentTaskId}-${task.id}`,
        source: task.parentTaskId,
        target: task.id,
        animated: task.status === "in_progress",
      });
    }
  }

  Dagre.layout(g);

  for (const node of nodes) {
    const pos = g.node(node.id);
    node.position = {
      x: pos.x - NODE_WIDTH / 2,
      y: pos.y - NODE_HEIGHT / 2,
    };
  }

  return { nodes, edges };
}
