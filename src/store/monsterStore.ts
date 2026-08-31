// ============================================================
// Store de monstruos (persistido en localStorage, con semilla SRD)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Encounter, Monster } from '../types';
import { SRD_MONSTERS } from '../data/srdMonsters';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

interface MonsterStore {
  monsters: Monster[];
  encounters: Encounter[];
  // Acciones de monster
  addMonster: (monster: Monster) => void;
  updateMonster: (id: string, updates: Partial<Monster>) => void;
  removeMonster: (id: string) => void;
  getMonster: (id: string) => Monster | undefined;
  resetToSRD: () => void;
  // Acciones de encounter
  createEncounter: (name: string, monsterIds: string[]) => Encounter;
  removeEncounter: (id: string) => void;
}

export const useMonsterStore = create<MonsterStore>()(
  persist(
    (set, get) => ({
      // La biblioteca arranca vacía: el usuario importa de la Biblioteca SRD 5.2
      // o crea sus propios monstruos. `resetToSRD` permite recargar la semilla clásica.
      monsters: [],
      encounters: [],

      addMonster: (monster) => {
        const withCustom = { ...monster, id: monster.id || makeId(), custom: true };
        // Upsert por id: si ya existe (p. ej. un monstruo importado del SRD),
        // se actualiza en lugar de duplicar. Así un re-import renueva la ficha
        // con los datos corregidos de la fuente.
        set((state) => {
          const idx = state.monsters.findIndex((m) => m.id === withCustom.id);
          if (idx === -1) {
            return { monsters: [...state.monsters, withCustom] };
          }
          const next = [...state.monsters];
          next[idx] = { ...withCustom };
          return { monsters: next };
        });
      },

      updateMonster: (id, updates) => {
        set((state) => ({
          monsters: state.monsters.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },

      removeMonster: (id) => {
        set((state) => ({
          monsters: state.monsters.filter((m) => m.id !== id),
        }));
      },

      getMonster: (id) => {
        return get().monsters.find((m) => m.id === id);
      },

      resetToSRD: () => {
        set({ monsters: SRD_MONSTERS });
      },

      createEncounter: (name, monsterIds) => {
        const encounter: Encounter = {
          id: makeId(),
          name,
          monsterIds,
          difficulty: 'Medio',
          createdAt: new Date(),
        };
        set((state) => ({ encounters: [encounter, ...state.encounters] }));
        return encounter;
      },

      removeEncounter: (id) => {
        set((state) => ({
          encounters: state.encounters.filter((e) => e.id !== id),
        }));
      },
    }),
    {
      name: 'monster-storage',
      // v0 = datos anteriores (sin versión). v2 volvió a la semilla SRD tras el
      // lavado de contenido. v3 reintroduce la semilla con lanzadores de conjuros
      // (Acólito, Druida, Sacerdote, Mago, Arquimago, Liche).
      // v4 (actual): la biblioteca arranca vacía; el usuario importa lo que quiera.
      version: 4,
      migrate: (persisted, version) => {
        if (version < 4) {
          return { monsters: [], encounters: [] } as unknown as MonsterStore;
        }
        return persisted as MonsterStore;
      },
    }
  )
);