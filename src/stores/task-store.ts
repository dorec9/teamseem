"use client";

import { create } from "zustand";
import type { Task } from "@/lib/types";

interface TaskStore {
  tasks: Task[];
  addOrUpdateTask: (task: Task) => void;
  clear: () => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],

  addOrUpdateTask: (task) =>
    set((state) => {
      const idx = state.tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        const updated = [...state.tasks];
        updated[idx] = task;
        return { tasks: updated };
      }
      return { tasks: [...state.tasks, task] };
    }),

  clear: () => set({ tasks: [] }),
}));
