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
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const time = new Date(message.timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="px-4 py-2.5 transition-colors hover:bg-foreground/[0.02]">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-foreground">
          {message.agentName}
        </span>
        {message.toolName && (
          <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-xs text-foreground/60">
            {message.toolName}
          </span>
        )}
        <span className="rounded bg-foreground/5 px-1.5 py-0.5 text-xs text-foreground/40">
          {EVENT_LABELS[message.eventType] ?? message.eventType}
        </span>
        <span className="ml-auto text-xs text-foreground/30">{time}</span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground/80">
        {message.content}
      </p>
    </div>
  );
}
