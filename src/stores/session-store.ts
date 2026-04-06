"use client";

import { create } from "zustand";
import type { Session } from "@/lib/types";

interface SessionStore {
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSession: (id: string | null) => void;
  addSession: (session: Session) => void;
  updateSession: (session: Session) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  activeSessionId: null,

  setActiveSession: (id) => set({ activeSessionId: id }),

  addSession: (session) =>
    set((state) => {
      const exists = state.sessions.find((s) => s.id === session.id);
      if (exists) return state;
      return {
        sessions: [...state.sessions, session],
        activeSessionId: state.activeSessionId ?? session.id,
      };
    }),

  updateSession: (session) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
    })),

  clear: () => set({ sessions: [], activeSessionId: null }),
}));
