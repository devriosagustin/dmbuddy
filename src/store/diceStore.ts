// ============================================================
// Store del lanzador de dados (historial y favoritos)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiceResult } from '../types';

interface DiceStore {
  history: DiceResult[];
  favorites: string[]; // fórmulas guardadas
  totalRolls: number;
  pushResult: (result: DiceResult) => void;
  clearHistory: () => void;
  addFavorite: (formula: string) => void;
  removeFavorite: (formula: string) => void;
}

/**
 * El almacenamiento persistido serializa los `timestamp` (Date) como strings;
 * este merge los devuelve a Date al rehidratar para que la UI no reviente.
 */
const toDate = (value: unknown): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
};

export const useDiceStore = create<DiceStore>()(
  persist(
    (set, get) => ({
      history: [],
      favorites: ['d20', 'd20 adv', '2d6', '4d6dl1', 'd8+3', '1d4+2'],
      totalRolls: 0,

      pushResult: (result) => {
        set((state) => ({
          history: [result, ...state.history].slice(0, 60),
          totalRolls: state.totalRolls + 1,
        }));
      },

      clearHistory: () => set({ history: [] }),

      addFavorite: (formula) => {
        if (get().favorites.includes(formula)) return;
        set((state) => ({ favorites: [...state.favorites, formula] }));
      },

      removeFavorite: (formula) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f !== formula),
        }));
      },
    }),
    {
      name: 'dice-storage',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DiceStore>;
        const history = Array.isArray(p.history)
          ? p.history.map((h) =>
              h && typeof h === 'object'
                ? { ...(h as DiceResult), timestamp: toDate((h as { timestamp?: unknown }).timestamp) }
                : h
            )
          : current.history;
        return { ...current, ...p, history };
      },
    }
  )
);