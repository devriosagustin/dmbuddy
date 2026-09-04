// ============================================================
// Store de presets de encuentro guardados (persistido en localStorage)
// Mismo patrón de guardado/carga por nombre que layoutStore.ts, pero
// solo la composición de monstruos (sin tiles ni coordenadas): sirve
// para volver a colocar el mismo grupo de monstruos de un solo click.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EncounterPreset, EncounterPresetMonster } from '../types';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `preset-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

interface EncounterPresetStore {
  presets: EncounterPreset[];
  /** Guarda (o actualiza por nombre) un preset con su composición de monstruos. */
  savePreset: (name: string, monsters: EncounterPresetMonster[]) => EncounterPreset;
  deletePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
}

export const useEncounterPresetStore = create<EncounterPresetStore>()(
  persist(
    (set, get) => ({
      presets: [],

      savePreset: (name, monsters) => {
        const trimmed = name.trim() || 'Preset sin nombre';
        const existing = get().presets.find((p) => p.name === trimmed);
        let preset: EncounterPreset;
        if (existing) {
          preset = { ...existing, monsters };
          set((s) => ({
            presets: s.presets.map((p) => (p.id === existing.id ? preset : p)),
          }));
        } else {
          preset = { id: makeId(), name: trimmed, monsters };
          set((s) => ({ presets: [...s.presets, preset] }));
        }
        return preset;
      },

      deletePreset: (id) => {
        set((s) => ({ presets: s.presets.filter((p) => p.id !== id) }));
      },

      renamePreset: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({
          presets: s.presets.map((p) => (p.id === id ? { ...p, name: trimmed } : p)),
        }));
      },
    }),
    {
      name: 'dmbuddy-encounter-presets',
      version: 1,
    }
  )
);
