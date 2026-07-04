import { readFile } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { eventStore } from "@/lib/store/event-store";
import type { Task, HookEventType } from "@/lib/types";

// Helper to generate a consistent ID for a task based on its description
function generateTaskId(sessionId: string, description: string): string {
  return crypto.createHash('sha256').update(`${sessionId}:${description}`).digest('hex').substring(0, 32);
}

export async function syncTasks(
  artifactDirectoryPath: string,
  sessionId: string,
  agentId: string
): Promise<void> {
  if (!artifactDirectoryPath) return;

  const taskFilePath = join(artifactDirectoryPath, "task.md");
  let data: string;
  
  try {
    data = await readFile(taskFilePath, "utf-8");
  } catch (err) {
    // File does not exist yet or cannot be read, which is fine
    return;
  }

  const lines = data.split("\n");
  const parsedTasks: { description: string; status: "created" | "in_progress" | "completed"; parentTaskId?: string }[] = [];

  let currentTopLevelTaskId: string | undefined = undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Check if the line is a top-level task (e.g. "1. " or "**1.**")
    const isTopLevel = /^(?:\*\*|__)?\d+\.\s+/.test(trimmed);

    // Strip leading bullets/numbers if any
    let cleaned = trimmed.replace(/^(?:[-*+]|\d+\.)\s*/, "").trim();
    // Also strip bold/italic markdown characters just in case
    cleaned = cleaned.replace(/^(?:\*\*|__)/, "").trim();
    
    // Check for checkbox
    const match = cleaned.match(/^\[\s*([xX\/ ])\s*\]\s+(.*)/);
    
    let status: "created" | "in_progress" | "completed" = "created";
    let description = cleaned;

    if (match) {
      const mark = match[1].toLowerCase();
      description = match[2].trim();
      if (mark === "x") status = "completed";
      else if (mark === "/") status = "in_progress";
    }

    if (description) {
      const pTask = { description, status, parentTaskId: undefined as string | undefined };
      
      if (isTopLevel) {
        // This is a top-level task
        const taskId = generateTaskId(sessionId, description);
        currentTopLevelTaskId = taskId;
      } else {
        // This is a subtask, assign it to the current top-level task
        pTask.parentTaskId = currentTopLevelTaskId;
      }
      
      parsedTasks.push(pTask);
    }
  }

  if (parsedTasks.length === 0) return;
  console.log(`[TaskSync] Found ${parsedTasks.length} tasks in ${taskFilePath}`);

  const currentTaskIds: string[] = [];

  // Emit hook events for changed tasks and let event-processor handle DB and SSE
  for (const pTask of parsedTasks) {
    const taskId = generateTaskId(sessionId, pTask.description);
    currentTaskIds.push(taskId);
    
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      // It's a new task, emit TaskCreated
      await eventStore.addEvent({
        type: "TaskCreated" as HookEventType,
        sessionId,
        timestamp: new Date().toISOString(),
        agentId,
        taskId,
        parentTaskId: pTask.parentTaskId,
        content: pTask.description,
      });
      
      // If it was already completed when first seen, also emit TaskCompleted
      if (pTask.status === "completed") {
        await eventStore.addEvent({
          type: "TaskCompleted" as HookEventType,
          sessionId,
          timestamp: new Date().toISOString(),
          agentId,
          taskId,
          content: pTask.description,
        });
      }
    } else if (existingTask.status !== pTask.status && pTask.status === "completed") {
      // It was completed, emit TaskCompleted
      await eventStore.addEvent({
        type: "TaskCompleted" as HookEventType,
        sessionId,
        timestamp: new Date().toISOString(),
        agentId,
        taskId,
        content: pTask.description,
      });
    }
  }

  // Mark tasks that were removed from task.md as completed so they don't block the UI
  const obsoleteTasks = await prisma.task.findMany({
    where: {
      sessionId,
      agentId,
      id: { notIn: currentTaskIds },
      status: { not: "completed" }
    }
  });

  for (const t of obsoleteTasks) {
    await prisma.task.update({
      where: { id: t.id },
      data: { status: "completed", completedAt: new Date() }
    });
    await eventStore.addEvent({
      type: "TaskCompleted" as HookEventType,
      sessionId,
      timestamp: new Date().toISOString(),
      agentId,
      taskId: t.id,
      content: t.description,
    });
  }
}
