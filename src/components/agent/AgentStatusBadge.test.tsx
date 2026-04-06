// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AgentStatusBadge from "./AgentStatusBadge";
import type { AgentStatus } from "@/lib/types";

describe("AgentStatusBadge", () => {
  const statusCases: { status: AgentStatus; label: string; color: string }[] = [
    { status: "idle", label: "대기", color: "bg-gray-500" },
    { status: "working", label: "작업중", color: "bg-green-500" },
    { status: "stopped", label: "중지", color: "bg-red-500" },
    { status: "error", label: "오류", color: "bg-yellow-500" },
  ];

  it.each(statusCases)(
    "$status 상태일 때 '$label' 텍스트와 $color 색상을 렌더링한다",
    ({ status, label, color }) => {
      const { container } = render(<AgentStatusBadge status={status} />);

      expect(screen.getByText(label)).toBeDefined();

      const dot = container.querySelector("span > span");
      expect(dot?.className).toContain(color);
    },
  );

  it("알 수 없는 상태일 때 fallback을 렌더링한다", () => {
    const unknownStatus = "unknown" as AgentStatus;
    const { container } = render(<AgentStatusBadge status={unknownStatus} />);

    expect(screen.getByText("알 수 없음")).toBeDefined();

    const dot = container.querySelector("span > span");
    expect(dot?.className).toContain("bg-gray-400");
  });
});
