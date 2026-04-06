import { describe, it, expect, beforeEach } from "vitest";
import { useAgentStore } from "./agent-store";
import type { Agent } from "@/lib/types";

function createAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: crypto.randomUUID(),
    name: "TestAgent",
    sessionId: "session-1",
    status: "idle",
    lastSeen: new Date().toISOString(),
    ...overrides,
  };
}

describe("useAgentStore", () => {
  beforeEach(() => {
    useAgentStore.getState().clear();
  });

  it("초기 상태는 빈 에이전트 배열", () => {
    expect(useAgentStore.getState().agents).toEqual([]);
  });

  it("addOrUpdateAgent로 새 에이전트를 추가할 수 있다", () => {
    const agent = createAgent({ id: "a-1" });
    useAgentStore.getState().addOrUpdateAgent(agent);

    expect(useAgentStore.getState().agents).toHaveLength(1);
    expect(useAgentStore.getState().agents[0]).toBe(agent);
  });

  it("addOrUpdateAgent로 기존 에이전트를 업데이트할 수 있다", () => {
    const agent = createAgent({ id: "a-1", status: "idle" });
    useAgentStore.getState().addOrUpdateAgent(agent);

    const updated = { ...agent, status: "working" as const };
    useAgentStore.getState().addOrUpdateAgent(updated);

    const agents = useAgentStore.getState().agents;
    expect(agents).toHaveLength(1);
    expect(agents[0].status).toBe("working");
  });

  it("다른 id의 에이전트는 별도로 추가된다", () => {
    useAgentStore.getState().addOrUpdateAgent(createAgent({ id: "a-1" }));
    useAgentStore.getState().addOrUpdateAgent(createAgent({ id: "a-2" }));

    expect(useAgentStore.getState().agents).toHaveLength(2);
  });

  it("업데이트 시 다른 에이전트에 영향을 주지 않는다", () => {
    const a1 = createAgent({ id: "a-1", name: "Agent1" });
    const a2 = createAgent({ id: "a-2", name: "Agent2" });
    useAgentStore.getState().addOrUpdateAgent(a1);
    useAgentStore.getState().addOrUpdateAgent(a2);

    useAgentStore.getState().addOrUpdateAgent({ ...a1, status: "error" });

    const agents = useAgentStore.getState().agents;
    expect(agents[0].status).toBe("error");
    expect(agents[1].name).toBe("Agent2");
  });

  it("clear로 에이전트 배열을 초기화한다", () => {
    useAgentStore.getState().addOrUpdateAgent(createAgent());
    useAgentStore.getState().clear();
    expect(useAgentStore.getState().agents).toEqual([]);
  });
});
