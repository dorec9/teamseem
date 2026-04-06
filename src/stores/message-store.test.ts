import { describe, it, expect, beforeEach } from "vitest";
import { useMessageStore } from "./message-store";
import type { Message } from "@/lib/types";

function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: crypto.randomUUID(),
    sessionId: "session-1",
    agentId: "agent-1",
    agentName: "TestAgent",
    content: "test content",
    timestamp: new Date().toISOString(),
    eventType: "PostToolUse",
    ...overrides,
  };
}

describe("useMessageStore", () => {
  beforeEach(() => {
    useMessageStore.getState().clear();
  });

  it("초기 상태는 빈 메시지 배열과 기본 필터", () => {
    const state = useMessageStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.filter).toEqual({
      agentId: null,
      eventType: null,
      search: "",
    });
  });

  it("addMessage로 메시지를 추가할 수 있다", () => {
    const msg = createMessage();
    useMessageStore.getState().addMessage(msg);
    expect(useMessageStore.getState().messages).toHaveLength(1);
    expect(useMessageStore.getState().messages[0]).toBe(msg);
  });

  it("MAX_MESSAGES(10000) 초과 시 오래된 메시지를 잘라낸다", () => {
    const MAX_MESSAGES = 10000;
    const messages: Message[] = [];
    for (let i = 0; i < MAX_MESSAGES + 5; i++) {
      messages.push(createMessage({ id: `msg-${i}` }));
    }

    const store = useMessageStore.getState();
    for (const msg of messages) {
      store.addMessage(msg);
    }

    const state = useMessageStore.getState();
    expect(state.messages).toHaveLength(MAX_MESSAGES);
    expect(state.messages[0].id).toBe("msg-5");
    expect(state.messages[MAX_MESSAGES - 1].id).toBe(`msg-${MAX_MESSAGES + 4}`);
  });

  it("setFilter로 필터를 부분 업데이트할 수 있다", () => {
    useMessageStore.getState().setFilter({ agentId: "agent-1" });
    expect(useMessageStore.getState().filter.agentId).toBe("agent-1");
    expect(useMessageStore.getState().filter.eventType).toBeNull();

    useMessageStore.getState().setFilter({ search: "hello" });
    expect(useMessageStore.getState().filter.agentId).toBe("agent-1");
    expect(useMessageStore.getState().filter.search).toBe("hello");
  });

  it("resetFilter로 필터를 기본값으로 초기화한다", () => {
    useMessageStore
      .getState()
      .setFilter({ agentId: "agent-1", search: "test" });
    useMessageStore.getState().resetFilter();
    expect(useMessageStore.getState().filter).toEqual({
      agentId: null,
      eventType: null,
      search: "",
    });
  });

  it("clear로 메시지와 필터를 모두 초기화한다", () => {
    useMessageStore.getState().addMessage(createMessage());
    useMessageStore.getState().setFilter({ agentId: "agent-1" });
    useMessageStore.getState().clear();

    const state = useMessageStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.filter).toEqual({
      agentId: null,
      eventType: null,
      search: "",
    });
  });
});
