"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, Box, Terminal, Activity, Clock, Info } from "lucide-react";
import { useMessageStore } from "@/stores/message-store";
import { useAgentStore } from "@/stores/agent-store";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default function AgentInspector() {
  const filter = useMessageStore((s) => s.filter);
  const setFilter = useMessageStore((s) => s.setFilter);
  const messages = useMessageStore((s) => s.messages);
  const agents = useAgentStore((s) => s.agents);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(150);
  const prevCountRef = useRef(0);

  const selectedAgent = useMemo(() => 
    agents.find(a => a.id === filter.agentId), 
  [agents, filter.agentId]);

  useEffect(() => {
    setLimit(150);
  }, [filter.agentId]);

  const { filteredMessages, totalCount } = useMemo(() => {
    if (!filter.agentId) return { filteredMessages: [], totalCount: 0 };
    const all = messages.filter(m => m.agentId === filter.agentId);
    return {
      filteredMessages: all.slice(-limit),
      totalCount: all.length
    };
  }, [messages, filter.agentId, limit]);

  useEffect(() => {
    if (scrollRef.current) {
      // Only auto scroll to bottom if new messages arrived (totalCount increased)
      if (totalCount > prevCountRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      prevCountRef.current = totalCount;
    }
  }, [totalCount]);

  if (!filter.agentId || !selectedAgent) return null;

  return (
    <div className="flex h-full flex-col bg-background/95 backdrop-blur-md border-l border-foreground/10 shadow-2xl">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-foreground/10 px-4 bg-foreground/[0.02]">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-indigo-400" />
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground/90">
            {selectedAgent.name}
          </h2>
          <span className="ml-2 text-[10px] text-foreground/40 font-mono">
            {selectedAgent.id.substring(0, 8)}
          </span>
        </div>
        <button 
          onClick={() => setFilter({ agentId: null })}
          className="p-1.5 hover:bg-foreground/10 rounded-md transition-colors"
        >
          <X className="h-4 w-4 text-foreground/50" />
        </button>
      </div>
      
      {/* Meta Info Section */}
      <div className="flex flex-col gap-3 border-b border-foreground/5 bg-foreground/[0.01] px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/40 uppercase tracking-wider">
              <Activity className="h-3 w-3" /> Status
            </span>
            <span className={`text-[13px] font-medium flex items-center gap-1.5 ${
              selectedAgent.status === "working" ? "text-amber-500" :
              selectedAgent.status === "stopped" ? "text-rose-500" :
              "text-emerald-500"
            }`}>
              <span className="relative flex h-2 w-2">
                {selectedAgent.status === "working" && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  selectedAgent.status === "working" ? "bg-amber-500" :
                  selectedAgent.status === "stopped" ? "bg-rose-500" :
                  "bg-emerald-500"
                }`}></span>
              </span>
              {selectedAgent.status.toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/40 uppercase tracking-wider">
              <Clock className="h-3 w-3" /> Last Active
            </span>
            <span className="text-[13px] font-medium text-foreground/80">
              {formatDistanceToNow(new Date(selectedAgent.lastSeen), { addSuffix: true, locale: ko })}
            </span>
          </div>
        </div>
        {selectedAgent.parentAgentId && (
          <div className="flex items-start gap-2 rounded-md bg-indigo-500/10 p-2 mt-1">
            <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[12px] leading-tight text-indigo-200">
              이 에이전트는 <span className="font-semibold">{selectedAgent.parentAgentId.substring(0,8)}</span>에 의해 소환된 서브 에이전트입니다.
            </p>
          </div>
        )}
      </div>

      {/* Logs / Messages */}
      <div className="px-4 py-2 text-[11px] font-medium text-foreground/40 uppercase tracking-wider bg-foreground/[0.02] border-b border-foreground/5 shadow-inner">
        Execution Logs ({filteredMessages.length})
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {totalCount > limit && (
          <button 
            onClick={() => setLimit(l => l + 150)}
            className="w-full py-2 mb-2 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-md transition-colors"
          >
            과거 로그 더 보기 ({totalCount - limit}개 남음)
          </button>
        )}
        
        {filteredMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-foreground/30">
            <Terminal className="h-8 w-8 opacity-20" />
            <p>기록된 이벤트가 없습니다.</p>
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isUser = msg.eventType === "UserPrompt" || msg.agentName === "사용자";
            const isSystem = msg.eventType === "AgentStateChange" || msg.eventType === "SessionStart";
            const isError = msg.eventType === "PostToolUse" && msg.content?.includes("오류 발생");
            const isModel = !isUser && !isSystem;

            return (
              <div 
                key={idx} 
                className={`flex flex-col gap-1 w-full`}
              >
                <div className="flex items-center gap-2 px-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isUser ? "text-indigo-400" : isSystem ? "text-foreground/30" : "text-emerald-400"
                  }`}>
                    {isUser ? "USER" : isSystem ? "SYS" : "MODEL"}
                  </span>
                  <div className="h-px flex-1 bg-foreground/5"></div>
                  <span className="text-[10px] text-foreground/30 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                  </span>
                </div>
                
                <div 
                  className={`rounded-lg px-3 py-2 text-[13px] leading-relaxed font-mono ${
                    isUser 
                      ? "bg-indigo-950/30 text-indigo-100 border border-indigo-500/20" 
                      : isError
                      ? "bg-rose-950/30 text-rose-200 border border-rose-500/20"
                      : isSystem 
                      ? "text-foreground/50 text-[12px]" 
                      : "bg-foreground/[0.03] border border-foreground/10 text-foreground/90 dark:text-white"
                  }`}
                >
                  {msg.toolName && (
                    <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-foreground/5 text-[11px] font-bold text-indigo-400">
                      <Box className="h-3 w-3" />
                      {msg.toolName}
                    </div>
                  )}
                  
                  {isModel && msg.content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-1 prose-pre:bg-black/50 prose-pre:border prose-pre:border-foreground/10 dark:prose-p:text-white dark:prose-headings:text-white dark:prose-li:text-white dark:prose-a:text-indigo-400 dark:prose-strong:text-white dark:prose-code:text-indigo-300 dark:text-white">
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
