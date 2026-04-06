import { describe, it, expect, vi } from "vitest";
import { processHookEvent } from "./event-processor";
import type { HookEvent, Agent, Session, SSEEvent } from "@/lib/types";

vi.mock("uuid", () => ({ v4: () => "mock-uuid" }));

function makeState() {
  return {
    sessions: new Map<string, Session>(),
    agents: new Map<string, Agent>(),
  };
}

function makeEvent(overrides: Partial<HookEvent> = {}): HookEvent {
  return {
    type: "PreToolUse",
    sessionId: "sess-1",
    timestamp: "2026-04-06T00:00:00Z",
    agentId: "agent-1",
    agentName: "TestAgent",
    content: "test content",
    ...overrides,
  };
}

function findByType(events: SSEEvent[], type: string) {
  return events.filter((e) => e.type === type);
}

describe("processHookEvent", () => {
  describe("session/agent 자동 생성", () => {
    it("새 세션을 자동 생성한다", () => {
      const state = makeState();
      const events = processHookEvent(makeEvent(), state);

      expect(state.sessions.has("sess-1")).toBe(true);
      const sessionEvents = findByType(events, "session");
      expect(sessionEvents.length).toBeGreaterThanOrEqual(1);
    });

    it("이미 있는 세션은 중복 생성하지 않는다", () => {
      const state = makeState();
      state.sessions.set("sess-1", {
        id: "sess-1",
        startedAt: "t",
        agents: [],
        status: "active",
      });
      const events = processHookEvent(makeEvent(), state);
      const sessionEvents = findByType(events, "session");
      expect(sessionEvents.length).toBe(0);
    });

    it("새 에이전트를 자동 생성하고 세션에 등록한다", () => {
      const state = makeState();
      processHookEvent(makeEvent(), state);

      expect(state.agents.has("agent-1")).toBe(true);
      const session = state.sessions.get("sess-1")!;
      expect(session.agents).toContain("agent-1");
    });

    it("이미 있는 에이전트는 lastSeen만 갱신한다", () => {
      const state = makeState();
      processHookEvent(makeEvent(), state);

      const laterEvent = makeEvent({ timestamp: "2026-04-06T01:00:00Z" });
      processHookEvent(laterEvent, state);

      const agent = state.agents.get("agent-1")!;
      expect(agent.lastSeen).toBe("2026-04-06T01:00:00Z");
    });

    it("agentId 없으면 sessionId를 사용한다", () => {
      const state = makeState();
      processHookEvent(makeEvent({ agentId: undefined }), state);
      expect(state.agents.has("sess-1")).toBe(true);
    });
  });

  describe("SessionStart", () => {
    it("에이전트 상태를 working으로 변경한다", () => {
      const state = makeState();
      const events = processHookEvent(
        makeEvent({ type: "SessionStart" }),
        state,
      );
      const agentEvents = findByType(events, "agent");
      const lastAgent = agentEvents[agentEvents.length - 1].data as Agent;
      expect(lastAgent.status).toBe("working");
    });
  });

  describe("SubagentStart", () => {
    it("parentAgentId를 설정한다 (string 타입 가드)", () => {
      const state = makeState();
      const events = processHookEvent(
        makeEvent({
          type: "SubagentStart",
          metadata: { parentAgentId: "parent-1" },
        }),
        state,
      );
      const agentEvents = findByType(events, "agent");
      const lastAgent = agentEvents[agentEvents.length - 1].data as Agent;
      expect(lastAgent.parentAgentId).toBe("parent-1");
    });

    it("parentAgentId가 string이 아니면 설정하지 않는다", () => {
      const state = makeState();
      const events = processHookEvent(
        makeEvent({
          type: "SubagentStart",
          metadata: { parentAgentId: 123 },
        }),
        state,
      );
      const agentEvents = findByType(events, "agent");
      // 새 에이전트 생성 이벤트만 있고, SubagentStart에 의한 추가 이벤트는 없어야 함
      const agentsWithParent = agentEvents.filter(
        (e) => (e.data as Agent).parentAgentId !== undefined,
      );
      expect(agentsWithParent.length).toBe(0);
    });
  });

  describe("Stop / SubagentStop", () => {
    it("Stop은 에이전트와 세션 모두 stopped로 변경한다", () => {
      const state = makeState();
      const events = processHookEvent(makeEvent({ type: "Stop" }), state);

      const agent = state.agents.get("agent-1")!;
      expect(agent.status).toBe("stopped");

      const session = state.sessions.get("sess-1")!;
      expect(session.status).toBe("stopped");

      expect(findByType(events, "session").length).toBeGreaterThanOrEqual(1);
    });

    it("SubagentStop은 에이전트만 stopped로 변경한다", () => {
      const state = makeState();
      const events = processHookEvent(
        makeEvent({ type: "SubagentStop" }),
        state,
      );

      const agent = state.agents.get("agent-1")!;
      expect(agent.status).toBe("stopped");

      const session = state.sessions.get("sess-1")!;
      expect(session.status).toBe("active");

      // session stopped 이벤트가 없어야 함 (초기 생성 제외)
      const sessionStopEvents = findByType(events, "session").filter(
        (e) => (e.data as Session).status === "stopped",
      );
      expect(sessionStopEvents.length).toBe(0);
    });
  });

  describe("TeammateIdle", () => {
    it("에이전트를 idle 상태로 변경한다", () => {
      const state = makeState();
      processHookEvent(makeEvent({ type: "TeammateIdle" }), state);
      const agent = state.agents.get("agent-1")!;
      expect(agent.status).toBe("idle");
    });
  });

  describe("TaskCreated", () => {
    it("태스크 이벤트를 생성한다", () => {
      const state = makeState();
      const events = processHookEvent(
        makeEvent({
          type: "TaskCreated",
          taskId: "task-1",
          parentTaskId: "parent-task",
          content: "새 태스크",
        }),
        state,
      );
      const taskEvents = findByType(events, "task");
      expect(taskEvents.length).toBe(1);
      const task = taskEvents[0].data as {
        id: string;
        description: string;
        status: string;
        parentTaskId?: string;
      };
      expect(task.id).toBe("task-1");
      expect(task.description).toBe("새 태스크");
      expect(task.status).toBe("created");
      expect(task.parentTaskId).toBe("parent-task");
    });

    it("taskId 없으면 UUID를 생성한다", () => {
      const state = makeState();
      const events = processHookEvent(
        makeEvent({ type: "TaskCreated" }),
        state,
      );
      const taskEvents = findByType(events, "task");
      expect((taskEvents[0].data as { id: string }).id).toBe("mock-uuid");
    });
  });

  describe("TaskCompleted", () => {
    it("완료된 태스크 이벤트를 생성한다", () => {
      const state = makeState();
      const events = processHookEvent(
        makeEvent({ type: "TaskCompleted", taskId: "task-1" }),
        state,
      );
      const taskEvents = findByType(events, "task");
      expect(taskEvents.length).toBe(1);
      const task = taskEvents[0].data as {
        status: string;
        completedAt?: string;
      };
      expect(task.status).toBe("completed");
      expect(task.completedAt).toBeTruthy();
    });

    it("taskId 없으면 태스크 이벤트를 생성하지 않는다", () => {
      const state = makeState();
      const events = processHookEvent(
        makeEvent({ type: "TaskCompleted", taskId: undefined }),
        state,
      );
      const taskEvents = findByType(events, "task");
      expect(taskEvents.length).toBe(0);
    });
  });

  describe("PreToolUse / PostToolUse", () => {
    it("PreToolUse는 메시지를 생성하고 에이전트를 working으로 변경한다", () => {
      const state = makeState();
      const events = processHookEvent(
        makeEvent({ type: "PreToolUse", toolName: "Bash" }),
        state,
      );

      const messageEvents = findByType(events, "message");
      expect(messageEvents.length).toBe(1);
      const msg = messageEvents[0].data as {
        content: string;
        toolName?: string;
        eventType: string;
      };
      expect(msg.content).toBe("test content");
      expect(msg.toolName).toBe("Bash");
      expect(msg.eventType).toBe("PreToolUse");

      const agent = state.agents.get("agent-1")!;
      expect(agent.status).toBe("working");
    });

    it("PostToolUse는 메시지를 생성한다", () => {
      const state = makeState();
      const events = processHookEvent(
        makeEvent({ type: "PostToolUse", toolName: "Read" }),
        state,
      );

      const messageEvents = findByType(events, "message");
      expect(messageEvents.length).toBe(1);
    });

    it("content 없으면 기본 메시지를 생성한다", () => {
      const state = makeState();
      const events = processHookEvent(
        makeEvent({ type: "PreToolUse", toolName: "Bash", content: undefined }),
        state,
      );
      const msg = findByType(events, "message")[0].data as { content: string };
      expect(msg.content).toBe("Bash 실행 중");
    });
  });
});
