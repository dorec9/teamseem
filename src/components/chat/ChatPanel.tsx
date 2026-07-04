"use client";

import { useMemo, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, MessageSquare, Box } from "lucide-react";
import { useMessageStore } from "@/stores/message-store";
import { useAgentStore } from "@/stores/agent-store";

export default function ChatPanel() {
  const filter = useMessageStore((s) => s.filter);
  const setFilter = useMessageStore((s) => s.setFilter);
  const messages = useMessageStore((s) => s.messages);
  const agents = useAgentStore((s) => s.agents);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedAgent = useMemo(() => 
    agents.find(a => a.id === filter.agentId), 
  [agents, filter.agentId]);

  const filteredMessages = useMemo(() => {
    if (!filter.agentId) return [];
    return messages.filter(m => m.agentId === filter.agentId);
  }, [messages, filter.agentId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredMessages]);

  if (!filter.agentId) return null;

  return (
    <div className="flex h-full flex-col bg-background border-l border-foreground/10">
      <div className="flex h-12 items-center justify-between border-b border-foreground/10 px-4 bg-foreground/[0.02]">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-foreground/90">
            {selectedAgent?.name || "Agent Messages"}
          </h2>
        </div>
        <button 
          onClick={() => setFilter({ agentId: null })}
          className="p-1 hover:bg-foreground/10 rounded-md transition-colors"
        >
          <X className="h-4 w-4 text-foreground/50" />
        </button>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-foreground/40">
            기록된 메시지가 없습니다.
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isUser = msg.eventType === "UserPrompt" || msg.agentName === "사용자";
            const isSystem = msg.eventType === "AgentStateChange" || msg.eventType === "SessionStart";
            const isModel = !isUser && !isSystem;

            return (
              <div 
                key={idx} 
                className={`flex flex-col gap-1 max-w-[90%] ${
                  isUser ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-[11px] font-medium text-foreground/50">
                    {isUser ? "사용자" : isSystem ? "시스템" : "모델"}
                  </span>
                  <span className="text-[10px] text-foreground/30">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div 
                  className={`rounded-xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                    isUser 
                      ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100 border border-indigo-200 dark:border-indigo-500/30" 
                      : isSystem 
                      ? "bg-foreground/5 text-foreground/80 dark:text-foreground/90 border border-foreground/10 font-mono text-[12px]" 
                      : "bg-background border border-foreground/10 text-foreground/90 dark:text-foreground"
                  }`}
                >
                  {msg.toolName && (
                    <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      <Box className="h-3 w-3" />
                      {msg.toolName}
                    </div>
                  )}
                  
                  {isModel && msg.content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1 prose-pre:bg-foreground/5 dark:prose-pre:bg-black/50 prose-pre:border prose-pre:border-foreground/10 dark:prose-a:text-indigo-400 dark:prose-strong:text-white dark:prose-code:text-indigo-300">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
