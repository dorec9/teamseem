"use client";

import { useState } from "react";
import { 
  Folder, 
  GitBranch, 
  MoreHorizontal, 
  Settings, 
  Activity, 
  Filter, 
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Trash2,
  Search,
  X
} from "lucide-react";
import Link from "next/link";
import { useSessionStore } from "@/stores/session-store";
import { useAgentStore } from "@/stores/agent-store";
import { useMessageStore } from "@/stores/message-store";
import { useTaskStore } from "@/stores/task-store";
import ConnectionStatus from "@/components/common/ConnectionStatus";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useEventStream } from "@/hooks/use-event-stream";
import type { SessionDetail } from "@/lib/types";

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  if (diffMins > 0) return `${diffMins}m`;
  return "now";
}

export default function Sidebar() {
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const loadedSessionIds = useSessionStore((s) => s.loadedSessionIds);
  const setActiveSessionId = useSessionStore((s) => s.setActiveSession);
  const markSessionLoaded = useSessionStore((s) => s.markSessionLoaded);
  const removeSession = useSessionStore((s) => s.removeSession);
  
  const addOrUpdateAgent = useAgentStore((s) => s.addOrUpdateAgent);
  const addMessage = useMessageStore((s) => s.addMessage);
  const addOrUpdateTask = useTaskStore((s) => s.addOrUpdateTask);

  const connectionState = useEventStream();

  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleProject = (proj: string) => {
    setExpandedProjects(prev => ({ ...prev, [proj]: prev[proj] === false ? true : false }));
  };

  const handleSessionClick = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    if (!loadedSessionIds.includes(sessionId)) {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const detail: SessionDetail = await res.json();
          for (const agent of detail.agents) addOrUpdateAgent(agent);
          for (const message of detail.messages) addMessage(message);
          for (const task of detail.tasks) addOrUpdateTask(task);
          markSessionLoaded(sessionId);
        }
      } catch {
        // ignore
      }
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        removeSession(id);
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const sortedSessions = [...sessions]
    .filter(s => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const p = (s.projectName || "").toLowerCase();
      const t = (s.title || "").toLowerCase();
      return p.includes(q) || t.includes(q);
    })
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const groupedSessions = sortedSessions.reduce((acc, session) => {
    const proj = session.projectName || "Unknown";
    if (!acc[proj]) acc[proj] = [];
    acc[proj].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  return (
    <div className="flex h-full w-[280px] flex-col bg-background border-r border-foreground/10 text-foreground">
      <div className="flex flex-col border-b border-foreground/5">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-foreground/60 uppercase tracking-wide">
              Projects
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground/40">
            <button onClick={() => setIsSearchOpen(!isSearchOpen)}>
              <Search className="h-3.5 w-3.5 hover:text-foreground transition-colors" />
            </button>
            <FolderPlus className="h-3.5 w-3.5 hover:text-foreground cursor-pointer transition-colors" />
          </div>
        </div>
        
        {isSearchOpen && (
          <div className="px-3 pb-2 relative">
            <input 
              autoFocus
              type="text"
              placeholder="프로젝트 또는 세션 검색..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-foreground/5 border border-foreground/10 rounded-md text-[12px] pl-7 pr-3 py-1.5 focus:outline-none focus:border-foreground/20 text-foreground"
            />
            <Search className="h-3 w-3 absolute left-5 top-2.5 text-foreground/40" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-5 top-2.5 text-foreground/40 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {Object.keys(groupedSessions).length === 0 ? (
          <div className="px-2 py-4 text-xs text-foreground/50">
            진행 중인 프로젝트가 없습니다.
          </div>
        ) : (
          <div className="space-y-1">
            {Object.entries(groupedSessions).map(([projectName, projSessions]) => {
              const isExpanded = expandedProjects[projectName] !== false; // Default true
              
              return (
                <div key={projectName} className="flex flex-col">
                  {/* Project Folder Row */}
                  <div 
                    onClick={() => toggleProject(projectName)}
                    className="group flex items-center justify-between rounded px-2 py-1.5 cursor-pointer hover:bg-foreground/5"
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-foreground/50 stroke-[1.5]" />
                      <span className="text-[13px] text-foreground/90 font-medium">
                        {projectName}
                      </span>
                    </div>
                  </div>

                  {/* Sessions */}
                  {isExpanded && (
                    <div className="flex flex-col mt-0.5 mb-1">
                      {projSessions.map((session) => {
                        const isActive = session.id === activeSessionId;
                        const timeAgo = formatTimeAgo(session.startedAt);
                        const title = session.title || `세션 ${session.id.slice(0, 8)}`;
                        const isStopped = session.status === "stopped";

                        return (
                          <div
                            key={session.id}
                            onClick={() => handleSessionClick(session.id)}
                            className={`group flex items-center justify-between rounded pl-8 pr-2 py-1 cursor-pointer text-[13px] transition-colors ${
                              isActive
                                ? "bg-foreground/10 text-foreground font-medium"
                                : isStopped
                                ? "text-foreground/40 hover:bg-foreground/5 hover:text-foreground/70"
                                : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                            }`}
                          >
                            <span className="truncate flex-1 pr-2">
                              {title}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <GitBranch className="h-3 w-3 opacity-40" />
                              <span className="text-[11px] opacity-60 w-5 text-right">
                                {timeAgo}
                              </span>
                              <button
                                onClick={(e) => handleDeleteSession(e, session.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition-opacity"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connection Status & Footer */}
      <div className="border-t border-foreground/10 p-3 flex items-center justify-between gap-1 bg-foreground/[0.02]">
        <ConnectionStatus state={connectionState} />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link 
            href="/settings"
            className="rounded p-1.5 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
            title="설정"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
