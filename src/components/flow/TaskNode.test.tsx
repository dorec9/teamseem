// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { TaskStatus } from "@/lib/types";

import TaskNode from "./TaskNode";

interface TaskNodeData extends Record<string, unknown> {
  label: string;
  agentName: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

afterEach(() => {
  cleanup();
});

function renderTaskNode(data: Partial<TaskNodeData> = {}) {
  const defaultData: TaskNodeData = {
    label: "테스트 태스크",
    agentName: "Agent-1",
    status: "created",
    createdAt: "2026-04-06T12:00:00Z",
    ...data,
  };

  const nodeProps = {
    id: "node-1",
    data: defaultData,
    type: "taskNode",
    selected: false,
    isConnectable: true,
    zIndex: 0,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    dragHandle: undefined,
    selectable: true,
    deletable: true,
    parentId: undefined,
    width: 220,
    height: 80,
    sourcePosition: undefined,
    targetPosition: undefined,
  } as unknown as NodeProps<Node<TaskNodeData>>;

  return render(
    <ReactFlowProvider>
      <TaskNode {...nodeProps} />
    </ReactFlowProvider>,
  );
}

describe("TaskNode", () => {
  it("label과 agentName을 렌더링한다", () => {
    const { getByText } = renderTaskNode({
      label: "빌드 실행",
      agentName: "BuildAgent",
    });
    expect(getByText("빌드 실행")).toBeDefined();
    expect(getByText("BuildAgent")).toBeDefined();
  });

  const statusCases: {
    status: TaskStatus;
    label: string;
    borderColor: string;
  }[] = [
    { status: "created", label: "생성", borderColor: "border-gray-500" },
    { status: "in_progress", label: "진행중", borderColor: "border-blue-500" },
    { status: "completed", label: "완료", borderColor: "border-green-500" },
    { status: "failed", label: "실패", borderColor: "border-red-500" },
  ];

  it.each(statusCases)(
    "$status 상태일 때 '$label' 텍스트와 $borderColor border를 렌더링한다",
    ({ status, label, borderColor }) => {
      const { container, getByText } = renderTaskNode({ status });
      expect(getByText(label)).toBeDefined();

      const wrapper = container.querySelector("div > div");
      expect(wrapper?.className).toContain(borderColor);
    },
  );

  it("알 수 없는 상태일 때 fallback을 렌더링한다", () => {
    const { container, getByText } = renderTaskNode({ status: "unknown" });
    expect(getByText("알 수 없음")).toBeDefined();

    const wrapper = container.querySelector("div > div");
    expect(wrapper?.className).toContain("border-gray-500");
  });

  it("시간을 한국어 형식으로 표시한다", () => {
    const { container } = renderTaskNode({
      createdAt: "2026-04-06T15:30:45Z",
    });
    const timeSpans = container.querySelectorAll(".mt-1\\.5 span:last-child");
    const timeText = timeSpans[0]?.textContent ?? "";
    expect(timeText).toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});
