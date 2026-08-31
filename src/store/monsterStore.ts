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
      monsters: SRD_MONSTERS,
      encounters: [],

      addMonster: (monster) => {
        const withCustom = { ...monster, id: monster.id || makeId(), custom: true };
        set((state) => ({ monsters: [...state.monsters, withCustom] }));
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
      version: 3,
      migrate: (persisted, version) => {
        if (version < 3) {
          return { monsters: SRD_MONSTERS, encounters: [] } as unknown as MonsterStore;
        }
        return persisted as MonsterStore;
      },
    }
  )
);