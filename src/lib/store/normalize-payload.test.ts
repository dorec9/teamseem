import { describe, it, expect } from "vitest";
import {
  normalizePayload,
  isRawHookPayload,
  VALID_EVENT_TYPES,
} from "./normalize-payload";
import type { RawHookPayload } from "@/lib/types";

function makePayload(overrides: Partial<RawHookPayload> = {}): RawHookPayload {
  return {
    session_id: "sess-1",
    hook_event_name: "PreToolUse",
    ...overrides,
  };
}

describe("isRawHookPayload", () => {
  it("유효한 payload를 통과시킨다", () => {
    expect(
      isRawHookPayload({ session_id: "s1", hook_event_name: "Stop" }),
    ).toBe(true);
  });

  it("null/undefined를 거부한다", () => {
    expect(isRawHookPayload(null)).toBe(false);
    expect(isRawHookPayload(undefined)).toBe(false);
  });

  it("필수 필드가 없으면 거부한다", () => {
    expect(isRawHookPayload({ session_id: "s1" })).toBe(false);
    expect(isRawHookPayload({ hook_event_name: "Stop" })).toBe(false);
  });

  it("필수 필드가 string이 아니면 거부한다", () => {
    expect(isRawHookPayload({ session_id: 123, hook_event_name: "Stop" })).toBe(
      false,
    );
  });
});

describe("normalizePayload", () => {
  it("유효한 이벤트 타입을 정규화한다", () => {
    const result = normalizePayload(makePayload());
    expect(result).not.toBeNull();
    expect(result!.type).toBe("PreToolUse");
    expect(result!.sessionId).toBe("sess-1");
    expect(result!.timestamp).toBeTruthy();
  });

  it("유효하지 않은 이벤트 타입은 null을 반환한다", () => {
    const result = normalizePayload(
      makePayload({ hook_event_name: "InvalidEvent" }),
    );
    expect(result).toBeNull();
  });

  it("빈 session_id는 null을 반환한다", () => {
    expect(normalizePayload(makePayload({ session_id: "" }))).toBeNull();
    expect(normalizePayload(makePayload({ session_id: "   " }))).toBeNull();
  });

  it("agent_id가 없으면 session_id를 agentId로 사용한다", () => {
    const result = normalizePayload(makePayload());
    expect(result!.agentId).toBe("sess-1");
  });

  it("agent_id가 있으면 그것을 사용한다", () => {
    const result = normalizePayload(makePayload({ agent_id: "agent-1" }));
    expect(result!.agentId).toBe("agent-1");
  });

  it("agent_name이 없으면 기본값 'Claude'를 사용한다", () => {
    const result = normalizePayload(makePayload());
    expect(result!.agentName).toBe("Claude");
  });

  it("모든 유효 이벤트 타입을 처리한다", () => {
    for (const eventType of VALID_EVENT_TYPES) {
      const result = normalizePayload(
        makePayload({ hook_event_name: eventType }),
      );
      expect(result).not.toBeNull();
    }
  });

  describe("buildContent - tool_input 별 content 생성", () => {
    it("Bash 커맨드를 포맷팅한다", () => {
      const result = normalizePayload(
        makePayload({
          tool_name: "Bash",
          tool_input: { command: "npm test" },
        }),
      );
      expect(result!.content).toBe("$ npm test");
    });

    it("Edit/Write/Read 파일 경로를 포맷팅한다", () => {
      for (const tool of ["Edit", "Write", "Read"]) {
        const result = normalizePayload(
          makePayload({
            tool_name: tool,
            tool_input: { file_path: "/src/index.ts" },
          }),
        );
        expect(result!.content).toBe(`${tool}: /src/index.ts`);
      }
    });

    it("Grep/Glob 패턴을 포맷팅한다", () => {
      for (const tool of ["Grep", "Glob"]) {
        const result = normalizePayload(
          makePayload({
            tool_name: tool,
            tool_input: { pattern: "**/*.ts" },
          }),
        );
        expect(result!.content).toBe(`${tool}: **/*.ts`);
      }
    });

    it("description이 있으면 fallback으로 사용한다", () => {
      const result = normalizePayload(
        makePayload({
          tool_name: "Agent",
          tool_input: { description: "테스트 에이전트" },
        }),
      );
      expect(result!.content).toBe("Agent: 테스트 에이전트");
    });

    it("prompt를 fallback으로 사용한다", () => {
      const result = normalizePayload(
        makePayload({
          tool_name: "Agent",
          tool_input: { prompt: "코드 분석" },
        }),
      );
      expect(result!.content).toBe("Agent: 코드 분석");
    });
  });

  describe("buildContent - PostToolUse", () => {
    it("stdout 응답을 미리보기한다", () => {
      const result = normalizePayload(
        makePayload({
          hook_event_name: "PostToolUse",
          tool_name: "Bash",
          tool_response: { stdout: "success" },
        }),
      );
      expect(result!.content).toBe("Bash 완료: success");
    });

    it("긴 stdout는 잘린다", () => {
      const longOutput = "x".repeat(300);
      const result = normalizePayload(
        makePayload({
          hook_event_name: "PostToolUse",
          tool_name: "Bash",
          tool_response: { stdout: longOutput },
        }),
      );
      expect(result!.content).toContain("...");
      expect(result!.content.length).toBeLessThan(300);
    });

    it("stderr가 있으면 오류로 표시한다", () => {
      const result = normalizePayload(
        makePayload({
          hook_event_name: "PostToolUse",
          tool_name: "Bash",
          tool_response: { stderr: "error occurred" },
        }),
      );
      expect(result!.content).toBe("Bash 오류: error occurred");
    });

    it("stdout/stderr 없으면 '완료'만 표시한다", () => {
      const result = normalizePayload(
        makePayload({
          hook_event_name: "PostToolUse",
          tool_name: "Bash",
          tool_response: {},
        }),
      );
      expect(result!.content).toBe("Bash 완료");
    });
  });

  describe("buildContent - 기타 이벤트", () => {
    it("description이 있으면 사용한다", () => {
      const result = normalizePayload(
        makePayload({
          hook_event_name: "TaskCreated",
          description: "새 태스크",
        }),
      );
      expect(result!.content).toBe("새 태스크");
    });

    it("description 없으면 이벤트 타입을 반환한다", () => {
      const result = normalizePayload(
        makePayload({ hook_event_name: "SessionStart" }),
      );
      expect(result!.content).toBe("SessionStart");
    });
  });

  it("metadata에 cwd, toolUseId 등을 포함한다", () => {
    const result = normalizePayload(
      makePayload({
        tool_use_id: "tu-1",
        cwd: "/home/user",
        permission_mode: "auto",
      }),
    );
    expect(result!.metadata).toEqual({
      toolUseId: "tu-1",
      cwd: "/home/user",
      permissionMode: "auto",
    });
  });
});
