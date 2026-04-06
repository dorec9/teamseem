import { readFile } from "fs/promises";

interface TranscriptEntry {
  type: string;
  message?: {
    role?: string;
    content?: string | Array<{ type: string; text?: string }>;
  };
  timestamp?: string;
  sessionId?: string;
}

export interface UserMessage {
  content: string;
  timestamp: string;
  sessionId: string;
}

function extractContent(
  raw: string | Array<{ type: string; text?: string }>,
): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .filter(
        (block) => block.type === "text" && typeof block.text === "string",
      )
      .map((block) => block.text!)
      .join("\n");
  }
  return "";
}

export async function readNewUserMessages(
  transcriptPath: string,
  lastTimestamp: string | null,
): Promise<UserMessage[]> {
  try {
    const data = await readFile(transcriptPath, "utf-8");
    const lines = data.split("\n").filter((line) => line.trim());
    const messages: UserMessage[] = [];

    for (const line of lines) {
      let entry: TranscriptEntry;
      try {
        entry = JSON.parse(line) as TranscriptEntry;
      } catch {
        continue;
      }

      if (entry.type !== "user" || entry.message?.role !== "user") continue;
      if (!entry.timestamp || !entry.message.content) continue;

      if (lastTimestamp && entry.timestamp <= lastTimestamp) continue;

      const content = extractContent(entry.message.content);
      if (!content) continue;

      messages.push({
        content,
        timestamp: entry.timestamp,
        sessionId: entry.sessionId ?? "",
      });
    }

    return messages;
  } catch {
    return [];
  }
}
