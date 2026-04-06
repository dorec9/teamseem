"use client";

import { useSessionStore } from "@/stores/session-store";

export default function SessionSelector() {
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  if (sessions.length === 0) {
    return <span className="text-sm text-foreground/50">세션 대기 중...</span>;
  }

  return (
    <select
      value={activeSessionId ?? ""}
      onChange={(e) => setActiveSession(e.target.value || null)}
      className="rounded-md border border-foreground/20 bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
    >
      {sessions.map((session) => (
        <option key={session.id} value={session.id}>
          {session.id.slice(0, 8)}... (
          {session.status === "active" ? "활성" : "종료"})
        </option>
      ))}
    </select>
  );
}
