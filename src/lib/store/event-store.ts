import type { HookEvent, SSEEvent, Session, SessionDetail } from "@/lib/types";
import { processHookEvent } from "./event-processor";
import { prisma } from "@/lib/db";

type SSEListener = (event: SSEEvent) => void;

export class EventStore {
  private listeners = new Set<SSEListener>();

  async addEvent(hookEvent: HookEvent): Promise<SSEEvent[]> {
    const sseEvents = await processHookEvent(hookEvent);

    for (const event of sseEvents) {
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
}

const globalForStore = globalThis as unknown as { eventStore: EventStore };
export const eventStore = globalForStore.eventStore ?? new EventStore();
if (process.env.NODE_ENV !== "production") globalForStore.eventStore = eventStore;
