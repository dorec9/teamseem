import { v4 as uuidv4 } from "uuid";
import type { HookEvent, SSEEvent, Message, Task } from "@/lib/types";
import { prisma } from "@/lib/db";

async function ensureSession(event: HookEvent): Promise<SSEEvent | null> {
  let session = await prisma.session.findUnique({
    where: { id: event.sessionId },
  });

  const projectName = typeof event.metadata?.projectName === "string" ? event.metadata.projectName : "Unknown";
  const title = typeof event.metadata?.title === "string" ? event.metadata.title : "새로운 대화";

  if (!session) {
    session = await prisma.session.create({
      data: {
        id: event.sessionId,
        title,
        projectName,
        startedAt: new Date(event.timestamp),
        status: "active",
      },
    });
    return { type: "session", data: { ...session, agents: [] } as any };
  } else if ((session.projectName !== projectName && projectName !== "Unknown") || (session.title !== title && title !== "새로운 대화") || (session.startedAt.getTime() > new Date(event.timestamp).getTime() + 10000)) {
    session = await prisma.session.update({
      where: { id: event.sessionId },
      data: { 
        projectName: projectName !== "Unknown" ? projectName : session.projectName,
        title: title !== "새로운 대화" ? title : session.title,
        startedAt: session.startedAt.getTime() > new Date(event.timestamp).getTime() + 10000 ? new Date(event.timestamp) : session.startedAt,
      },
    });
    return { type: "session", data: { ...session, startedAt: session.startedAt.toISOString(), agents: [] } as any };
  }
  return null;
}

async function ensureAgent(event: HookEvent): Promise<SSEEvent | null> {
  const agentId = event.agentId ?? event.sessionId;
  let agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    agent = await prisma.agent.create({
      data: {
        id: agentId,
        name: event.agentName ?? agentId,
        sessionId: event.sessionId,
        status: "working",
        lastSeen: new Date(event.timestamp),
      },
    });
    return { type: "agent", data: { ...agent, lastSeen: agent.lastSeen.toISOString() } as any };
  } else {
    await prisma.agent.update({
      where: { id: agentId },
      data: { lastSeen: new Date(event.timestamp) },
    });
    return null;
  }
}

class AsyncQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          resolve(await task());
        } catch (err) {
          reject(err);
        }
      });
      if (!this.processing) {
        this.processNext();
      }
    });
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    this.processing = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (e) {
        console.error("Queue task error:", e);
      }
    }
    this.processNext();
  }
}

const globalQueue = new AsyncQueue();

async function processHookEventInternal(event: HookEvent): Promise<SSEEvent[]> {
  const events: SSEEvent[] = [];

  const sessionEvent = await ensureSession(event);
  if (sessionEvent) events.push(sessionEvent);

  const agentEvent = await ensureAgent(event);
  if (agentEvent) events.push(agentEvent);

  const agentId = event.agentId ?? event.sessionId;

  switch (event.type) {
    case "SessionStart": {
      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: { status: "working" },
      });
      events.push({ type: "agent", data: { ...updatedAgent, lastSeen: updatedAgent.lastSeen.toISOString() } as any });
      break;
    }

    case "SubagentStart": {
      const parentId = event.metadata?.parentAgentId;
      if (typeof parentId === "string") {
        const updatedAgent = await prisma.agent.update({
          where: { id: agentId },
          data: { parentAgentId: parentId },
        });
        events.push({ type: "agent", data: { ...updatedAgent, lastSeen: updatedAgent.lastSeen.toISOString() } as any });
      }
      break;
    }

    case "SubagentStop":
    case "Stop": {
      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: { status: "stopped" },
      });
      events.push({ type: "agent", data: { ...updatedAgent, lastSeen: updatedAgent.lastSeen.toISOString() } as any });

      if (event.type === "Stop") {
        const updatedSession = await prisma.session.update({
          where: { id: event.sessionId },
          data: { status: "stopped" },
        });
        events.push({ type: "session", data: { ...updatedSession, startedAt: updatedSession.startedAt.toISOString(), agents: [] } as any });
      }
      break;
    }

    case "TeammateIdle": {
      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: { status: "idle" },
      });
      events.push({ type: "agent", data: { ...updatedAgent, lastSeen: updatedAgent.lastSeen.toISOString() } as any });
      break;
    }

    case "TaskCreated": {
      const taskId = event.taskId ?? uuidv4();
      const task = await prisma.task.upsert({
        where: { id: taskId },
        create: {
          id: taskId,
          sessionId: event.sessionId,
          agentId,
          agentName: event.agentName ?? agentId,
          description: event.content ?? "태스크",
          status: "created",
          parentTaskId: event.parentTaskId,
          createdAt: new Date(event.timestamp),
        },
        update: {
          description: event.content ?? "태스크",
          parentTaskId: event.parentTaskId,
        }
      });
      events.push({ type: "task", data: { ...task, createdAt: task.createdAt.toISOString(), completedAt: task.completedAt?.toISOString() } as any });
      break;
    }

    case "TaskCompleted": {
      if (event.taskId) {
        const task = await prisma.task.update({
          where: { id: event.taskId },
          data: {
            status: "completed",
            completedAt: new Date(event.timestamp),
          },
        });
        events.push({ type: "task", data: { ...task, createdAt: task.createdAt.toISOString(), completedAt: task.completedAt?.toISOString() } as any });
      }
      break;
    }

    case "PreInvocation":
    case "PostInvocation":
    case "PreToolUse":
    case "PostToolUse": {
      if (event.type === "PreToolUse" || event.type === "PreInvocation") {
        const updatedAgent = await prisma.agent.update({
          where: { id: agentId },
          data: { status: "working" },
        });
        events.push({ type: "agent", data: { ...updatedAgent, lastSeen: updatedAgent.lastSeen.toISOString() } as any });
      } else if (event.type === "PostInvocation") {
        const updatedAgent = await prisma.agent.update({
          where: { id: agentId },
          data: { status: "idle" },
        });
        events.push({ type: "agent", data: { ...updatedAgent, lastSeen: updatedAgent.lastSeen.toISOString() } as any });
      }

      const msgData = {
        id: uuidv4(),
        sessionId: event.sessionId,
        agentId,
        agentName: event.agentName ?? agentId,
        content: event.content ?? `${event.toolName ?? "도구"} ${event.type === "PreToolUse" ? "실행 중" : "완료"}`,
        timestamp: new Date(event.timestamp),
        eventType: event.type,
        toolName: event.toolName,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      };

      const dbMessage = await prisma.message.create({ data: msgData });
      
      const payloadMessage: Message = {
        ...dbMessage,
        timestamp: dbMessage.timestamp.toISOString(),
        metadata: event.metadata,
        eventType: dbMessage.eventType as any,
        toolName: dbMessage.toolName ?? undefined,
      };
      events.push({ type: "message", data: payloadMessage });
      break;
    }

    case "UserPrompt": {
      const msgData = {
        id: uuidv4(),
        sessionId: event.sessionId,
        agentId,
        agentName: event.agentName ?? "사용자",
        content: event.content ?? "",
        timestamp: new Date(event.timestamp),
        eventType: event.type,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      };

      const dbMessage = await prisma.message.create({ data: msgData });
      const payloadMessage: Message = {
        ...dbMessage,
        timestamp: dbMessage.timestamp.toISOString(),
        metadata: event.metadata,
        eventType: dbMessage.eventType as any,
        toolName: dbMessage.toolName ?? undefined,
      };
      events.push({ type: "message", data: payloadMessage });
      break;
    }

    case "AgentStateChange": {
      const newStatus = event.metadata?.status === "idle" ? "idle" : "working";
      const updatedAgent = await prisma.agent.update({
        where: { id: agentId },
        data: { status: newStatus },
      });
      events.push({ type: "agent", data: { ...updatedAgent, lastSeen: updatedAgent.lastSeen.toISOString() } as any });
      break;
    }

    case "AgentResponse": {
      const msgData = {
        id: uuidv4(),
        sessionId: event.sessionId,
        agentId,
        agentName: event.agentName ?? agentId,
        content: event.content ?? "",
        timestamp: new Date(event.timestamp),
        eventType: event.type,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      };
      const dbMessage = await prisma.message.create({ data: msgData });
      events.push({ type: "message", data: { ...dbMessage, toolName: dbMessage.toolName || undefined, timestamp: dbMessage.timestamp.toISOString(), eventType: dbMessage.eventType as any, metadata: dbMessage.metadata ? JSON.parse(dbMessage.metadata) : undefined } });
      break;
    }
  }

  return events;
}

export async function processHookEvent(event: HookEvent): Promise<SSEEvent[]> {
  return globalQueue.enqueue(() => processHookEventInternal(event));
}
