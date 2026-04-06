import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventStore } from "./event-store";
import type { HookEvent, Message, Task, Session, SSEEvent } from "@/lib/types";

vi.mock("uuid", () => ({ v4: () => "mock-uuid" }));

function makeHookEvent(overrides: Partial<HookEvent> = {}): HookEvent {
  return {
    type: "PreToolUse",
    sessionId: "sess-1",
    timestamp: "2026-04-06T00:00:00Z",
    agentId: "agent-1",
    agentName: "TestAgent",
    content: "test",
    toolName: "Bash",
    ...overrides,
  };
}

describe("EventStore", () => {
  let store: EventStore;

  beforeEach(() => {
    store = new EventStore();
  });

  describe("addEvent", () => {
    it("이벤트를 추가하고 SSEEvent 배열을 반환한다", () => {
      const events = store.addEvent(makeHookEvent());
      expect(events.length).toBeGreaterThan(0);
    });

    it("세션과 에이전트를 자동 생성한다", () => {
      store.addEvent(makeHookEvent());
      expect(store.sessions.size).toBe(1);
      expect(store.agents.size).toBe(1);
    });

    it("메시지를 저장한다", () => {
      store.addEvent(makeHookEvent());
      expect(store.messages.length).toBe(1);
    });

    it("태스크를 저장한다", () => {
      store.addEvent(makeHookEvent({ type: "TaskCreated", taskId: "t1" }));
      expect(store.tasks.size).toBe(1);
    });

    it("같은 ID의 태스크를 업데이트한다", () => {
      store.addEvent(
        makeHookEvent({ type: "TaskCreated", taskId: "t1", content: "v1" }),
      );
      store.addEvent(
        makeHookEvent({ type: "TaskCompleted", taskId: "t1", content: "v2" }),
      );
      expect(store.tasks.size).toBe(1);
      const task = store.tasks.get("t1")!;
      expect(task.status).toBe("completed");
    });
  });

  describe("MAX_MESSAGES 상한", () => {
    it("10000개 초과 시 오래된 메시지를 제거한다", () => {
      // 메시지만 생성하기 위해 PreToolUse 이벤트 반복
      for (let i = 0; i < 10005; i++) {
        store.addEvent(
          makeHookEvent({
            content: `msg-${i}`,
            timestamp: `2026-04-06T00:00:${String(i % 60).padStart(2, "0")}Z`,
          }),
        );
      }
      expect(store.messages.length).toBeLessThanOrEqual(10000);
    });
  });

  describe("subscribe / unsubscribe", () => {
    it("리스너에게 이벤트를 브로드캐스트한다", () => {
      const received: SSEEvent[] = [];
      const listener = (event: SSEEvent) => received.push(event);

      store.subscribe(listener);
      store.addEvent(makeHookEvent());

      expect(received.length).toBeGreaterThan(0);
    });

    it("unsubscribe 후 이벤트를 받지 않는다", () => {
      const received: SSEEvent[] = [];
      const listener = (event: SSEEvent) => received.push(event);

      store.subscribe(listener);
      store.unsubscribe(listener);
      store.addEvent(makeHookEvent());

      expect(received.length).toBe(0);
    });

    it("에러 발생 리스너를 자동 제거한다", () => {
      const badListener = () => {
        throw new Error("fail");
      };
      const goodReceived: SSEEvent[] = [];
      const goodListener = (event: SSEEvent) => goodReceived.push(event);

      store.subscribe(badListener);
      store.subscribe(goodListener);

      store.addEvent(makeHookEvent());
      // 첫 번째 이벤트에서 badListener 제거됨, goodListener는 정상 작동
      expect(goodReceived.length).toBeGreaterThan(0);
    });
  });

  describe("getSnapshot", () => {
    it("모든 세션, 에이전트, 태스크, 메시지를 반환한다", () => {
      store.addEvent(makeHookEvent());
      store.addEvent(makeHookEvent({ type: "TaskCreated", taskId: "t1" }));

      const snapshot = store.getSnapshot();
      const types = new Set(snapshot.map((e) => e.type));
      expect(types.has("session")).toBe(true);
      expect(types.has("agent")).toBe(true);
      expect(types.has("message")).toBe(true);
      expect(types.has("task")).toBe(true);
    });
  });

  describe("getSessionList", () => {
    it("모든 세션 목록을 반환한다", () => {
      store.addEvent(makeHookEvent({ sessionId: "s1" }));
      store.addEvent(makeHookEvent({ sessionId: "s2", agentId: "a2" }));

      const sessions = store.getSessionList();
      expect(sessions.length).toBe(2);
    });
  });

  describe("getSessionDetail", () => {
    it("세션 상세 정보를 반환한다", () => {
      store.addEvent(makeHookEvent());
      store.addEvent(makeHookEvent({ type: "TaskCreated", taskId: "t1" }));

      const detail = store.getSessionDetail("sess-1");
      expect(detail).not.toBeNull();
      expect(detail!.agents.length).toBeGreaterThan(0);
      expect(detail!.messages.length).toBeGreaterThan(0);
      expect(detail!.tasks.length).toBeGreaterThan(0);
    });

    it("존재하지 않는 세션은 null을 반환한다", () => {
      expect(store.getSessionDetail("nonexistent")).toBeNull();
    });

    it("해당 세션의 데이터만 필터링한다", () => {
      store.addEvent(makeHookEvent({ sessionId: "s1", agentId: "a1" }));
      store.addEvent(makeHookEvent({ sessionId: "s2", agentId: "a2" }));

      const detail = store.getSessionDetail("s1");
      expect(detail!.agents.every((a) => a.sessionId === "s1")).toBe(true);
      expect(detail!.messages.every((m) => m.sessionId === "s1")).toBe(true);
    });
  });
});
