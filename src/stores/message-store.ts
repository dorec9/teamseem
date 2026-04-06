"use client";

import { create } from "zustand";
import type { HookEventType, Message } from "@/lib/types";

const MAX_MESSAGES = 10000;

interface MessageFilter {
  agentId: string | null;
  eventType: HookEventType | null;
  search: string;
}

interface MessageStore {
  messages: Message[];
  filter: MessageFilter;
  addMessage: (message: Message) => void;
  setFilter: (filter: Partial<MessageFilter>) => void;
  resetFilter: () => void;
  clear: () => void;
}

const DEFAULT_FILTER: MessageFilter = {
  agentId: null,
  eventType: null,
  search: "",
};

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  filter: { ...DEFAULT_FILTER },

  addMessage: (message) =>
    set((state) => {
      const next = [...state.messages, message];
      if (next.length > MAX_MESSAGES) {
        return { messages: next.slice(next.length - MAX_MESSAGES) };
      }
      return { messages: next };
    }),

  setFilter: (partial) =>
    set((state) => ({
      filter: { ...state.filter, ...partial },
    })),

  resetFilter: () => set({ filter: { ...DEFAULT_FILTER } }),

  clear: () => set({ messages: [], filter: { ...DEFAULT_FILTER } }),
}));
