"use client";

import { create } from "zustand";
import type { Agent } from "@/lib/types";

interface AgentStore {
  agents: Agent[];
  addOrUpdateAgent: (agent: Agent) => void;
  clear: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: [],

  addOrUpdateAgent: (agent) =>
    set((state) => {
      const idx = state.agents.findIndex((a) => a.id === agent.id);
      if (idx >= 0) {
        const updated = [...state.agents];
        updated[idx] = agent;
        return { agents: updated };
      }
      return { agents: [...state.agents, agent] };
    }),

  clear: () => set({ agents: [] }),
}));
