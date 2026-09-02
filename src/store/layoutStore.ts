// ============================================================
// Store de layouts de mapa guardados (persistido en localStorage)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapLayout, LayoutCreature, LayoutTile } from '../utils/layoutPatterns';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `layout-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

interface LayoutStore {
  savedLayouts: MapLayout[];
  /** Guarda (o actualiza por nombre) un layout de tiles y criaturas. */
  saveLayout: (name: string, tiles: LayoutTile[], creatures?: LayoutCreature[]) => MapLayout;
  savedLayout: (id: string) => MapLayout | undefined;
  deleteLayout: (id: string) => void;
  /** Exporta todos los layouts a JSON string. */
  exportLayouts: () => string;
  /** Importa layouts desde JSON string; retorna {added, skipped}. */
  importLayouts: (json: string) => { added: number; skipped: number };
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      savedLayouts: [],
      saveLayout: (name, tiles, creatures) => {
        const trimmed = name.trim() || 'Layout sin nombre';
        const existing = get().savedLayouts.find((l) => l.name === trimmed);
        let layout: MapLayout;
        if (existing) {
          layout = { ...existing, tiles, creatures };
          set((s) => ({
            savedLayouts: s.savedLayouts.map((l) => (l.id === existing.id ? layout! : l)),
          }));
        } else {
          layout = { id: makeId(), name: trimmed, tiles, creatures };
          set((s) => ({ savedLayouts: [...s.savedLayouts, layout!] }));
        }
        return layout;
      },
      savedLayout: (id) => get().savedLayouts.find((l) => l.id === id),
      deleteLayout: (id) => {
        set((s) => ({ savedLayouts: s.savedLayouts.filter((l) => l.id !== id) }));
      },
      exportLayouts: () => {
        return JSON.stringify(get().savedLayouts, null, 2);
      },
      importLayouts: (json) => {
        try {
          const parsed = JSON.parse(json) as MapLayout[];
          if (!Array.isArray(parsed)) return { added: 0, skipped: 0 };
          let added = 0;
          let skipped = 0;
          const current = get().savedLayouts;
          const nameSet = new Set(current.map((l) => l.name));
          for (const l of parsed) {
            if (!l.id || !l.name || !(Array.isArray(l.tiles) || Array.isArray(l.barriers))) {
              skipped++;
              continue;
            }
            if (nameSet.has(l.name)) {
              skipped++;
              continue;
            }
            const newLayout = { ...l, id: makeId() };
            set((s) => ({ savedLayouts: [...s.savedLayouts, newLayout] }));
            nameSet.add(l.name);
            added++;
          }
          return { added, skipped };
        } catch {
          return { added: 0, skipped: 0 };
        }
      },
    }),
    { name: 'dmbuddy-map-layouts' }
  )
);
