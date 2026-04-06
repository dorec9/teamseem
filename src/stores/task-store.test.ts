import { describe, it, expect, beforeEach } from "vitest";
import { useTaskStore } from "./task-store";
import type { Task } from "@/lib/types";

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    sessionId: "session-1",
    agentId: "agent-1",
    agentName: "TestAgent",
    description: "Test task",
    status: "created",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("useTaskStore", () => {
  beforeEach(() => {
    useTaskStore.getState().clear();
  });

  it("초기 상태는 빈 태스크 배열", () => {
    expect(useTaskStore.getState().tasks).toEqual([]);
  });

  it("addOrUpdateTask로 새 태스크를 추가할 수 있다", () => {
    const task = createTask({ id: "t-1" });
    useTaskStore.getState().addOrUpdateTask(task);

    expect(useTaskStore.getState().tasks).toHaveLength(1);
    expect(useTaskStore.getState().tasks[0]).toBe(task);
  });

  it("addOrUpdateTask로 기존 태스크를 업데이트할 수 있다", () => {
    const task = createTask({ id: "t-1", status: "created" });
    useTaskStore.getState().addOrUpdateTask(task);

    const updated: Task = {
      ...task,
      status: "completed",
      completedAt: new Date().toISOString(),
    };
    useTaskStore.getState().addOrUpdateTask(updated);

    const tasks = useTaskStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].status).toBe("completed");
    expect(tasks[0].completedAt).toBeDefined();
  });

  it("다른 id의 태스크는 별도로 추가된다", () => {
    useTaskStore.getState().addOrUpdateTask(createTask({ id: "t-1" }));
    useTaskStore.getState().addOrUpdateTask(createTask({ id: "t-2" }));

    expect(useTaskStore.getState().tasks).toHaveLength(2);
  });

  it("업데이트 시 다른 태스크에 영향을 주지 않는다", () => {
    const t1 = createTask({ id: "t-1", description: "Task 1" });
    const t2 = createTask({ id: "t-2", description: "Task 2" });
    useTaskStore.getState().addOrUpdateTask(t1);
    useTaskStore.getState().addOrUpdateTask(t2);

    useTaskStore.getState().addOrUpdateTask({ ...t1, status: "failed" });

    const tasks = useTaskStore.getState().tasks;
    expect(tasks[0].status).toBe("failed");
    expect(tasks[1].description).toBe("Task 2");
  });

  it("태스크 상태 전이를 올바르게 반영한다", () => {
    const task = createTask({ id: "t-1", status: "created" });
    useTaskStore.getState().addOrUpdateTask(task);

    useTaskStore.getState().addOrUpdateTask({ ...task, status: "in_progress" });
    expect(useTaskStore.getState().tasks[0].status).toBe("in_progress");

    useTaskStore.getState().addOrUpdateTask({ ...task, status: "completed" });
    expect(useTaskStore.getState().tasks[0].status).toBe("completed");
  });

  it("clear로 태스크 배열을 초기화한다", () => {
    useTaskStore.getState().addOrUpdateTask(createTask());
    useTaskStore.getState().clear();
    expect(useTaskStore.getState().tasks).toEqual([]);
  });
});
