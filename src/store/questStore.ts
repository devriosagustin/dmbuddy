// ============================================================
// Store de misiones (bitácora de quests, persistido en localStorage)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Quest, QuestStatus } from '../types';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `q-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

interface QuestStore {
  quests: Quest[];
  addQuest: (quest: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => Quest;
  updateQuest: (id: string, updates: Partial<Omit<Quest, 'id'>>) => void;
  setQuestStatus: (id: string, status: QuestStatus) => void;
  removeQuest: (id: string) => void;
}

export const useQuestStore = create<QuestStore>()(
  persist(
    (set) => ({
      quests: [],

      addQuest: (quest) => {
        const now = new Date();
        const newQuest: Quest = {
          ...quest,
          id: makeId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ quests: [newQuest, ...state.quests] }));
        return newQuest;
      },

      updateQuest: (id, updates) => {
        set((state) => ({
          quests: state.quests.map((q) =>
            q.id === id ? { ...q, ...updates, updatedAt: new Date() } : q
          ),
        }));
      },

      setQuestStatus: (id, status) => {
        set((state) => ({
          quests: state.quests.map((q) =>
            q.id === id ? { ...q, status, updatedAt: new Date() } : q
          ),
        }));
      },

      removeQuest: (id) => {
        set((state) => ({ quests: state.quests.filter((q) => q.id !== id) }));
      },
    }),
    {
      name: 'quest-storage',
      version: 1,
    }
  )
);
