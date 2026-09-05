// ============================================================
// Store de layouts de mapa guardados (persistido en localStorage)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapLayout, LayoutCreature, LayoutTile, MapFolder } from '../utils/layoutPatterns';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `layout-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

interface LayoutStore {
  savedLayouts: MapLayout[];
  folders: MapFolder[];
  /** Guarda (o actualiza por nombre) un layout de tiles y criaturas. */
  saveLayout: (name: string, tiles: LayoutTile[], creatures?: LayoutCreature[], folderId?: string) => MapLayout;
  /**
   * Reemplaza los tiles de un layout ya existente, identificado por id (no
   * por nombre). Usado para sincronizar la contraparte de un portal
   * bidireccional en OTRO layout sin pasar por el flujo de "guardar por
   * nombre" (que está pensado para el layout que se está editando).
   */
  updateLayoutTiles: (id: string, tiles: LayoutTile[]) => void;
  savedLayout: (id: string) => MapLayout | undefined;
  deleteLayout: (id: string) => void;
  /** Asigna (o quita con null) un layout a una carpeta. */
  setMapFolder: (id: string, folderId: string | null) => void;
  /** Crea una carpeta nueva y devuelve su id. */
  createFolder: (name: string) => string;
  /** Renombra una carpeta. */
  renameFolder: (id: string, name: string) => void;
  /** Elimina una carpeta; los layouts que contenga pasan a "sin carpeta". */
  deleteFolder: (id: string) => void;
  /** Exporta todos los layouts a JSON string. */
  exportLayouts: () => string;
  /** Importa layouts desde JSON string; retorna {added, skipped}. */
  importLayouts: (json: string) => { added: number; skipped: number };
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      savedLayouts: [],
      folders: [],
      saveLayout: (name, tiles, creatures, folderId) => {
        const trimmed = name.trim() || 'Layout sin nombre';
        const existing = get().savedLayouts.find((l) => l.name === trimmed);
        let layout: MapLayout;
        if (existing) {
          layout = { ...existing, tiles, creatures, folderId: folderId ?? existing.folderId };
          set((s) => ({
            savedLayouts: s.savedLayouts.map((l) => (l.id === existing.id ? layout! : l)),
          }));
        } else {
          layout = { id: makeId(), name: trimmed, tiles, creatures, folderId: folderId || undefined };
          set((s) => ({ savedLayouts: [...s.savedLayouts, layout!] }));
        }
        return layout;
      },
      updateLayoutTiles: (id, tiles) => {
        set((s) => ({
          savedLayouts: s.savedLayouts.map((l) => (l.id === id ? { ...l, tiles } : l)),
        }));
      },
      savedLayout: (id) => get().savedLayouts.find((l) => l.id === id),
      deleteLayout: (id) => {
        set((s) => ({ savedLayouts: s.savedLayouts.filter((l) => l.id !== id) }));
      },
      setMapFolder: (id, folderId) => {
        set((s) => ({
          savedLayouts: s.savedLayouts.map((l) =>
            l.id === id ? { ...l, folderId: folderId || undefined } : l
          ),
        }));
      },
      createFolder: (name) => {
        const trimmed = name.trim();
        if (!trimmed || get().folders.some((f) => f.name === trimmed)) {
          return '';
        }
        const folder: MapFolder = { id: makeId(), name: trimmed };
        set((s) => ({ folders: [...s.folders, folder] }));
        return folder.id;
      },
      renameFolder: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, name: trimmed } : f)),
        }));
      },
      deleteFolder: (id) => {
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
          savedLayouts: s.savedLayouts.map((l) =>
            l.folderId === id ? { ...l, folderId: undefined } : l
          ),
        }));
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
            const newLayout = { ...l, id: makeId(), folderId: undefined };
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
    {
      name: 'dmbuddy-map-layouts',
      // v1 = carpetas de mapa (folders + folderId en cada layout).
      version: 1,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<LayoutStore> & Record<string, unknown>;
        const out = { ...state } as Record<string, unknown>;
        if (version < 1) {
          if (out.folders === undefined) out.folders = [];
          if (Array.isArray(out.savedLayouts)) {
            out.savedLayouts = (out.savedLayouts as MapLayout[]).map((l) => ({
              ...l,
              folderId: (l as MapLayout).folderId || undefined,
            }));
          }
        }
        return out as unknown as LayoutStore;
      },
    }
  )
);
