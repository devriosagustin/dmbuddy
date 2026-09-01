// ============================================================
// Store de NPC (persistido en localStorage)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Npc } from '../types';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `n-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

interface NpcStore {
  npcs: Npc[];
  addNpc: (npc: Npc) => string;
  updateNpc: (id: string, updates: Partial<Npc>) => void;
  removeNpc: (id: string) => void;
}

export const useNpcStore = create<NpcStore>()(
  persist(
    (set) => ({
      npcs: [],

      addNpc: (npc) => {
        const id = npc.id || makeId();
        set((state) => ({
          npcs: [{ ...npc, id }, ...state.npcs],
        }));
        return id;
      },

      updateNpc: (id, updates) => {
        set((state) => ({
          npcs: state.npcs.map((n) => (n.id === id ? { ...n, ...updates } : n)),
        }));
      },

      removeNpc: (id) => {
        set((state) => ({
          npcs: state.npcs.filter((n) => n.id !== id),
        }));
      },
    }),
    {
      name: 'npc-storage',
      version: 1,
    }
  )
);