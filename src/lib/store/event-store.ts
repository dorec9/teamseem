import type {
  HookEvent,
  Agent,
  Message,
  Task,
  Session,
  SessionDetail,
  SSEEvent,
} from "@/lib/types";
import { processHookEvent } from "./event-processor";

const MAX_MESSAGES = 10000;

type SSEListener = (event: SSEEvent) => void;

export class EventStore {
  sessions = new Map<string, Session>();
  agents = new Map<string, Agent>();
  messages: Message[] = [];
  tasks = new Map<string, Task>();
  private listeners = new Set<SSEListener>();

  addEvent(hookEvent: HookEvent): SSEEvent[] {
    const state = { sessions: this.sessions, agents: this.agents };
    const sseEvents = processHookEvent(hookEvent, state);

    for (const event of sseEvents) {
      switch (event.type) {
        case "message": {
          this.messages.push(event.data as Message);
          if (this.messages.length > MAX_MESSAGES) {
            this.messages.splice(0, this.messages.length - MAX_MESSAGES);
          }
          break;
        }
        case "task": {
          const task = event.data as Task;
          const existing = this.tasks.get(task.id);
          if (existing) {
            Object.assign(existing, task);
          } else {
            this.tasks.set(task.id, task);
          }
          break;
        }
      }

      this.broadcast(event);
    }

    return sseEvents;
  }

  subscribe(listener: SSEListener): void {
    this.listeners.add(listener);
  }

  unsubscribe(listener: SSEListener): void {
    this.listeners.delete(listener);
  }

  private broadcast(event: SSEEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        this.listeners.delete(listener);
      }
    }
  }

  getSnapshot(): SSEEvent[] {
    const events: SSEEvent[] = [];

    for (const session of this.sessions.values()) {
      events.push({ type: "session", data: session });
    }
    for (const agent of this.agents.values()) {
      events.push({ type: "agent", data: agent });
    }
    for (const task of this.tasks.values()) {
      events.push({ type: "task", data: task });
    }
    for (const message of this.messages) {
      events.push({ type: "message", data: message });
    }

    return events;
  }

  getSessionList(): Session[] {
    return Array.from(this.sessions.values());
  }

  getSessionDetail(sessionId: string): SessionDetail | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      ...session,
      agents: Array.from(this.agents.values()).filter(
        (a) => a.sessionId === sessionId,
      ),
      messages: this.messages.filter((m) => m.sessionId === sessionId),
      tasks: Array.from(this.tasks.values()).filter(
        (t) => t.sessionId === sessionId,
      ),
    };
  }
}

const globalForStore = globalThis as unknown as { eventStore: EventStore };
export const eventStore = globalForStore.eventStore ?? new EventStore();
globalForStore.eventStore = eventStore;
