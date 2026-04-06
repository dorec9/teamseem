import { v4 as uuidv4 } from "uuid";
import type {
  HookEvent,
  Agent,
  Message,
  Task,
  Session,
  SSEEvent,
} from "@/lib/types";

interface StoreState {
  sessions: Map<string, Session>;
  agents: Map<string, Agent>;
}

function ensureSession(state: StoreState, event: HookEvent): SSEEvent | null {
  if (state.sessions.has(event.sessionId)) return null;

  const session: Session = {
    id: event.sessionId,
    startedAt: event.timestamp,
    agents: [],
    status: "active",
  };
  state.sessions.set(session.id, session);
  return { type: "session", data: session };
}

function ensureAgent(state: StoreState, event: HookEvent): SSEEvent | null {
  const agentId = event.agentId ?? event.sessionId;
  if (state.agents.has(agentId)) {
    const agent = state.agents.get(agentId)!;
    agent.lastSeen = event.timestamp;
    return null;
  }

  const agent: Agent = {
    id: agentId,
    name: event.agentName ?? agentId,
    sessionId: event.sessionId,
    status: "working",
    lastSeen: event.timestamp,
  };
  state.agents.set(agent.id, agent);

  const session = state.sessions.get(event.sessionId);
  if (session && !session.agents.includes(agent.id)) {
    session.agents.push(agent.id);
  }

  return { type: "agent", data: { ...agent } };
}

export function processHookEvent(
  event: HookEvent,
  state: StoreState,
): SSEEvent[] {
  const events: SSEEvent[] = [];

  const sessionEvent = ensureSession(state, event);
  if (sessionEvent) events.push(sessionEvent);

  const agentEvent = ensureAgent(state, event);
  if (agentEvent) events.push(agentEvent);

  const agentId = event.agentId ?? event.sessionId;

  switch (event.type) {
    case "SessionStart": {
      const agent = state.agents.get(agentId);
      if (agent) {
        agent.status = "working";
        events.push({ type: "agent", data: { ...agent } });
      }
      break;
    }

    case "SubagentStart": {
      const agent = state.agents.get(agentId);
      const parentId = event.metadata?.parentAgentId;
      if (agent && typeof parentId === "string") {
        agent.parentAgentId = parentId;
        events.push({ type: "agent", data: { ...agent } });
      }
      break;
    }

    case "SubagentStop":
    case "Stop": {
      const agent = state.agents.get(agentId);
      if (agent) {
        agent.status = "stopped";
        events.push({ type: "agent", data: { ...agent } });
      }
      if (event.type === "Stop") {
        const session = state.sessions.get(event.sessionId);
        if (session) {
          session.status = "stopped";
          events.push({ type: "session", data: { ...session } });
        }
      }
      break;
    }

    case "TeammateIdle": {
      const agent = state.agents.get(agentId);
      if (agent) {
        agent.status = "idle";
        events.push({ type: "agent", data: { ...agent } });
      }
      break;
    }

    case "TaskCreated": {
      const task: Task = {
        id: event.taskId ?? uuidv4(),
        sessionId: event.sessionId,
        agentId,
        agentName: event.agentName ?? agentId,
        description: event.content ?? "태스크",
        status: "created",
        parentTaskId: event.parentTaskId,
        createdAt: event.timestamp,
      };
      events.push({ type: "task", data: task });
      break;
    }

    case "TaskCompleted": {
      if (event.taskId) {
        const task: Task = {
          id: event.taskId,
          sessionId: event.sessionId,
          agentId,
          agentName: event.agentName ?? agentId,
          description: event.content ?? "",
          status: "completed",
          parentTaskId: event.parentTaskId,
          createdAt: event.timestamp,
          completedAt: event.timestamp,
        };
        events.push({ type: "task", data: task });
      }
      break;
    }

    case "PreToolUse":
    case "PostToolUse": {
      const agent = state.agents.get(agentId);
      if (agent && event.type === "PreToolUse") {
        agent.status = "working";
      }

      const message: Message = {
        id: uuidv4(),
        sessionId: event.sessionId,
        agentId,
        agentName: event.agentName ?? agentId,
        content:
          event.content ??
          `${event.toolName ?? "도구"} ${event.type === "PreToolUse" ? "실행 중" : "완료"}`,
        timestamp: event.timestamp,
        eventType: event.type,
        toolName: event.toolName,
        metadata: event.metadata,
      };
      events.push({ type: "message", data: message });
      break;
    }

    case "UserPrompt": {
      const message: Message = {
        id: uuidv4(),
        sessionId: event.sessionId,
        agentId,
        agentName: event.agentName ?? "사용자",
        content: event.content ?? "",
        timestamp: event.timestamp,
        eventType: event.type,
        metadata: event.metadata,
      };
      events.push({ type: "message", data: message });
      break;
    }
  }

  return events;
}
