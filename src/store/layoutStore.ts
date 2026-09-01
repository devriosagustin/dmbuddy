// ============================================================
// Store de layouts de mapa guardados (persistido en localStorage)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapLayout } from '../utils/layoutPatterns';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `layout-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

interface LayoutStore {
  savedLayouts: MapLayout[];
  /** Guarda (o actualiza por nombre) un layout de barreras. */
  saveLayout: (name: string, barriers: { x: number; y: number }[]) => MapLayout;
  savedLayout: (id: string) => MapLayout | undefined;
  deleteLayout: (id: string) => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      savedLayouts: [],
      saveLayout: (name, barriers) => {
        const trimmed = name.trim() || 'Layout sin nombre';
        const existing = get().savedLayouts.find((l) => l.name === trimmed);
        let layout: MapLayout;
        if (existing) {
          layout = { ...existing, barriers };
          set((s) => ({
            savedLayouts: s.savedLayouts.map((l) => (l.id === existing.id ? layout! : l)),
          }));
        } else {
          layout = { id: makeId(), name: trimmed, barriers };
          set((s) => ({ savedLayouts: [...s.savedLayouts, layout!] }));
        }
        return layout;
      },
      savedLayout: (id) => get().savedLayouts.find((l) => l.id === id),
      deleteLayout: (id) => {
        set((s) => ({ savedLayouts: s.savedLayouts.filter((l) => l.id !== id) }));
      },
    }),
    { name: 'dmbuddy-map-layouts' }
  )
);
