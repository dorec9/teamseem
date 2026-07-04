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
  messageIds: Record<string, boolean>;
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
  messageIds: {},
  filter: { ...DEFAULT_FILTER },

  addMessage: (message) =>
    set((state) => {
      // O(1) 중복 검사
      if (state.messageIds[message.id]) {
        return state;
      }
      const next = [...state.messages, message];
      
      if (next.length > MAX_MESSAGES) {
        const sliced = next.slice(next.length - MAX_MESSAGES);
        const rebuiltIds: Record<string, boolean> = {};
        for (let i = 0; i < sliced.length; i++) {
          rebuiltIds[sliced[i].id] = true;
        }
        return { messages: sliced, messageIds: rebuiltIds };
      }
      return { 
        messages: next, 
        messageIds: { ...state.messageIds, [message.id]: true } 
      };
    }),

  setFilter: (partial) =>
    set((state) => ({
      filter: { ...state.filter, ...partial },
    })),

  resetFilter: () => set({ filter: { ...DEFAULT_FILTER } }),

  clear: () => set({ messages: [], messageIds: {}, filter: { ...DEFAULT_FILTER } }),
}));
