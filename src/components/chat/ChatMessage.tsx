"use client";

import { useState } from "react";
import type { Message } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
}

const EVENT_LABELS: Record<string, string> = {
  PreToolUse: "실행",
  PostToolUse: "완료",
  TaskCreated: "태스크",
  TaskCompleted: "완료",
  SessionStart: "시작",
  Stop: "종료",
  SubagentStart: "서브에이전트",
  SubagentStop: "종료",
  TeammateIdle: "대기",
  UserPrompt: "사용자 입력",
};

interface ToolResponse {
  stdout?: string;
  stderr?: string;
  interrupted?: boolean;
  content?: string;
  filePath?: string;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const [expanded, setExpanded] = useState(false);

  const isUserPrompt = message.eventType === "UserPrompt";
  const hasMetadata =
    !isUserPrompt &&
    !!message.metadata &&
    !!(message.metadata.toolInput || message.metadata.toolResponse);

  const time = new Date(message.timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const handleToggle = () => {
    if (hasMetadata) {
      setExpanded((prev) => !prev);
    }
  };

  const toolInput = message.metadata?.toolInput as
    | Record<string, unknown>
    | undefined;
  const toolResponse = message.metadata?.toolResponse as
    | ToolResponse
    | undefined;

  return (
    <div
      className={`px-4 py-2.5 transition-colors ${
        isUserPrompt
          ? "border-l-2 border-blue-400 bg-blue-500/10"
          : "hover:bg-foreground/[0.02]"
      } ${hasMetadata ? "cursor-pointer" : ""}`}
      onClick={handleToggle}
    >
      <div className="flex items-baseline gap-2">
        <span
          className={`text-sm font-semibold ${
            isUserPrompt ? "text-blue-400" : "text-foreground"
          }`}
        >
          {isUserPrompt ? "사용자" : message.agentName}
        </span>
        {!isUserPrompt && message.toolName && (
          <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-xs text-foreground/60">
            {message.toolName}
          </span>
        )}
        <span
          className={`rounded px-1.5 py-0.5 text-xs ${
            isUserPrompt
              ? "bg-blue-500/15 text-blue-400/80"
              : "bg-foreground/5 text-foreground/40"
          }`}
        >
          {EVENT_LABELS[message.eventType] ?? message.eventType}
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-foreground/30">
          {hasMetadata && (
            <span className="text-foreground/25">
              {expanded ? "\u25BC" : "\u25B6"}
            </span>
          )}
          {time}
        </span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground/80">
        {message.content}
      </p>

      {/* 상세 패널 */}
      <div
        className={`grid transition-all duration-200 ease-in-out ${
          expanded ? "grid-rows-[1fr] pt-2" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          {expanded && toolInput && (
            <div className="mb-2">
              <span className="text-xs font-medium text-foreground/50">
                입력
              </span>
              <pre className="mt-1 overflow-x-auto rounded bg-foreground/5 p-2 text-xs leading-relaxed text-foreground/70">
                <code>{JSON.stringify(toolInput, null, 2)}</code>
              </pre>
            </div>
          )}
          {expanded && toolResponse && (
            <div>
              <span className="text-xs font-medium text-foreground/50">
                결과
              </span>
              {toolResponse.stdout && (
                <pre className="mt-1 overflow-x-auto rounded bg-foreground/5 p-2 text-xs leading-relaxed text-foreground/70">
                  {toolResponse.stdout}
                </pre>
              )}
              {toolResponse.stderr && (
                <pre className="mt-1 overflow-x-auto rounded bg-red-500/5 p-2 text-xs leading-relaxed text-red-400/80">
                  {toolResponse.stderr}
                </pre>
              )}
              {toolResponse.content && !toolResponse.stdout && (
                <pre className="mt-1 overflow-x-auto rounded bg-foreground/5 p-2 text-xs leading-relaxed text-foreground/70">
                  {toolResponse.content}
                </pre>
              )}
              {toolResponse.interrupted && (
                <span className="mt-1 inline-block text-xs text-yellow-500">
                  (중단됨)
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
