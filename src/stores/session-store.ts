"use client";

import { create } from "zustand";
import type { Session } from "@/lib/types";

interface SessionStore {
  sessions: Session[];
  activeSessionId: string | null;
  loadedSessionIds: string[];
  setActiveSession: (id: string | null) => void;
  addSession: (session: Session) => void;
  updateSession: (session: Session) => void;
  removeSession: (id: string) => void;
  markSessionLoaded: (id: string) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  activeSessionId: null,
  loadedSessionIds: [],

  setActiveSession: (id) => set({ activeSessionId: id }),

  markSessionLoaded: (id) =>
    set((state) => ({
      loadedSessionIds: state.loadedSessionIds.includes(id)
        ? state.loadedSessionIds
        : [...state.loadedSessionIds, id],
    })),

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

  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    })),

  clear: () => set({ sessions: [], activeSessionId: null, loadedSessionIds: [] }),
}));
