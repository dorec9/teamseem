import { describe, it, expect, beforeEach } from "vitest";
import { useSessionStore } from "./session-store";
import type { Session } from "@/lib/types";

function createSession(overrides: Partial<Session> = {}): Session {
  return {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    agents: [],
    status: "active",
    ...overrides,
  };
}

describe("useSessionStore", () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it("초기 상태는 빈 세션 배열과 null activeSessionId", () => {
    const state = useSessionStore.getState();
    expect(state.sessions).toEqual([]);
    expect(state.activeSessionId).toBeNull();
  });

  it("addSession으로 세션을 추가할 수 있다", () => {
    const session = createSession({ id: "s-1" });
    useSessionStore.getState().addSession(session);

    const state = useSessionStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]).toBe(session);
  });

  it("첫 번째 세션 추가 시 activeSessionId가 자동 설정된다", () => {
    const session = createSession({ id: "s-1" });
    useSessionStore.getState().addSession(session);
    expect(useSessionStore.getState().activeSessionId).toBe("s-1");
  });

  it("이미 activeSessionId가 있으면 새 세션 추가 시 변경하지 않는다", () => {
    const s1 = createSession({ id: "s-1" });
    const s2 = createSession({ id: "s-2" });
    useSessionStore.getState().addSession(s1);
    useSessionStore.getState().addSession(s2);

    expect(useSessionStore.getState().activeSessionId).toBe("s-1");
    expect(useSessionStore.getState().sessions).toHaveLength(2);
  });

  it("중복 id의 세션은 추가하지 않는다", () => {
    const session = createSession({ id: "s-1" });
    useSessionStore.getState().addSession(session);
    useSessionStore.getState().addSession(session);

    expect(useSessionStore.getState().sessions).toHaveLength(1);
  });

  it("setActiveSession으로 활성 세션을 변경할 수 있다", () => {
    useSessionStore.getState().setActiveSession("s-99");
    expect(useSessionStore.getState().activeSessionId).toBe("s-99");

    useSessionStore.getState().setActiveSession(null);
    expect(useSessionStore.getState().activeSessionId).toBeNull();
  });

  it("updateSession으로 기존 세션을 업데이트할 수 있다", () => {
    const session = createSession({ id: "s-1", status: "active" });
    useSessionStore.getState().addSession(session);

    const updated = { ...session, status: "stopped" as const };
    useSessionStore.getState().updateSession(updated);

    expect(useSessionStore.getState().sessions[0].status).toBe("stopped");
  });

  it("updateSession은 다른 세션에 영향을 주지 않는다", () => {
    const s1 = createSession({ id: "s-1", status: "active" });
    const s2 = createSession({ id: "s-2", status: "active" });
    useSessionStore.getState().addSession(s1);
    useSessionStore.getState().addSession(s2);

    useSessionStore.getState().updateSession({ ...s1, status: "stopped" });

    expect(useSessionStore.getState().sessions[0].status).toBe("stopped");
    expect(useSessionStore.getState().sessions[1].status).toBe("active");
  });

  it("clear로 세션과 activeSessionId를 초기화한다", () => {
    useSessionStore.getState().addSession(createSession({ id: "s-1" }));
    useSessionStore.getState().clear();

    expect(useSessionStore.getState().sessions).toEqual([]);
    expect(useSessionStore.getState().activeSessionId).toBeNull();
  });
});
