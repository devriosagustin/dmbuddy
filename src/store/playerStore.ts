// ============================================================
// Store de jugadores (party) persisitdo en localStorage
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player } from '../types';
import { proficiencyAtLevel } from '../utils/damageCalculator';
import { applyXpToLevel, MAX_LEVEL, xpForLevel } from '../utils/xp';
import { bookMaxHp } from '../utils/hpCalculator';
import { clampUsedToMax, longRestUsed, shortRestUsed, slotProgressionOf, spellSlotsMax } from '../utils/spellcastingRules';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};

const ZERO_SLOTS = [0, 0, 0, 0, 0, 0, 0, 0, 0];

interface PlayerStore {
  players: Player[];
  addPlayer: (player: Omit<Player, 'id' | 'proficiencyBonus'>) => Player;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  /** Suma XP al personaje y sincroniza su nivel y competencia. */
  addXp: (id: string, amount: number) => void;
  /** Sube un nivel manualmente (recalcula competencia). */
  levelUp: (id: string) => void;
  exportPlayer: (id: string) => string;
  importPlayer: (json: string) => boolean;
  adjustSpellSlot: (id: string, slotLevel: number, delta: number) => void;
  shortRestParty: () => { recovered: string[]; spellcasters: number };
  longRestParty: () => { healed: number; spellcasters: number };
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      players: [],

      addPlayer: (player) => {
        const newPlayer: Player = {
          ...player,
          id: makeId(),
          proficiencyBonus: player.level ? proficiencyAtLevel(player.level) : 2,
        };
        set((state) => ({ players: [...state.players, newPlayer] }));
        return newPlayer;
      },

      updatePlayer: (id, updates) => {
        set((state) => ({
          players: state.players.map((p) => {
            if (p.id !== id) return p;
            const merged = { ...p, ...updates };
            // Recalcular el bonus de competencia si cambió el nivel
            if (updates.level && updates.level !== p.level) {
              merged.proficiencyBonus = proficiencyAtLevel(updates.level);
            }
            return merged;
          }),
        }));
      },

      removePlayer: (id) => {
        set((state) => ({
          players: state.players.filter((p) => p.id !== id),
        }));
      },

      addXp: (id, amount) => {
        set((state) => ({
          players: state.players.map((p) => {
            if (p.id !== id) return p;
            const nextXp = (p.xp ?? 0) + amount;
            const { level, leveledUp } = applyXpToLevel(p.level, nextXp);
            // Al subir de nivel (aunque sea de un salto), recalcula los PG
            // máximos "de libro" (dado de golpe + mod. CON, + Robusto si la
            // tiene) y deja al personaje con la vida llena.
            const maxHp = leveledUp ? bookMaxHp(p.class, level, p.stats.con, p.feats) : p.maxHp;
            return {
              ...p,
              xp: nextXp,
              level: leveledUp ? level : p.level,
              proficiencyBonus: leveledUp ? proficiencyAtLevel(level) : p.proficiencyBonus,
              maxHp,
              hp: leveledUp ? maxHp : p.hp,
            };
          }),
        }));
      },

      levelUp: (id) => {
        set((state) => ({
          players: state.players.map((p) => {
            if (p.id !== id) return p;
            if (p.level >= MAX_LEVEL) return p;
            const level = p.level + 1;
            // Al subir manualmente, se arrastra la XP al umbral mínimo del nuevo nivel
            // para que la barra nunca quede "hacia atrás".
            const xp = Math.max(p.xp ?? 0, xpForLevel(level));
            // Recalcula los PG máximos "de libro" y deja al personaje con la vida llena.
            const maxHp = bookMaxHp(p.class, level, p.stats.con, p.feats);
            return { ...p, level, xp, proficiencyBonus: proficiencyAtLevel(level), maxHp, hp: maxHp };
          }),
        }));
      },

      exportPlayer: (id) => {
        const player = get().players.find((p) => p.id === id);
        if (!player) return '';
        return JSON.stringify(player, null, 2);
      },

      importPlayer: (json) => {
        try {
          const parsed = JSON.parse(json) as Player & { weaponId?: string };
          if (!parsed.name || !parsed.stats) return false;
          const data: Omit<Player, 'id' | 'proficiencyBonus'> = {
            name: parsed.name,
            level: parsed.level ?? 1,
            class: parsed.class ?? 'Aventurero',
            race: parsed.race,
            hp: parsed.hp ?? parsed.maxHp ?? 10,
            maxHp: parsed.maxHp ?? parsed.hp ?? 10,
            armorClass: parsed.armorClass ?? 10,
            stats: {
              str: parsed.stats?.str ?? 10,
              dex: parsed.stats?.dex ?? 10,
              con: parsed.stats?.con ?? 10,
              int: parsed.stats?.int ?? 10,
              wis: parsed.stats?.wis ?? 10,
              cha: parsed.stats?.cha ?? 10,
            },
            spells: parsed.spells,
            cantrips: parsed.cantrips,
            feats: parsed.feats,
            skills: parsed.skills,
            weaponIds: parsed.weaponIds ?? (parsed.weaponId ? [parsed.weaponId] : undefined),
          };
          const created = get().addPlayer(data);
          return !!created;
        } catch {
          return false;
        }
      },

      adjustSpellSlot: (id, slotLevel, delta) => {
        set((state) => ({
          players: state.players.map((p) => {
            if (p.id !== id) return p;
            const max = spellSlotsMax(p.class, p.level);
            const used = clampUsedToMax(p.spellSlotsUsed ?? ZERO_SLOTS, max);
            used[slotLevel - 1] += delta;
            return { ...p, spellSlotsUsed: clampUsedToMax(used, max) };
          }),
        }));
      },

      shortRestParty: () => {
        const recovered: string[] = [];
        let spellcasters = 0;
        set((state) => ({
          players: state.players.map((p) => {
            const progression = slotProgressionOf(p.class);
            if (progression === 'none') return p;
            const max = spellSlotsMax(p.class, p.level);
            const before = clampUsedToMax(p.spellSlotsUsed ?? ZERO_SLOTS, max);
            const after = clampUsedToMax(shortRestUsed(before, progression), max);
            spellcasters += 1;
            const changed = before.some((v, i) => v !== after[i]);
            if (changed) recovered.push(p.name);
            return after.every((v, i) => v === before[i]) ? p : { ...p, spellSlotsUsed: after };
          }),
        }));
        return { recovered, spellcasters };
      },

      longRestParty: () => {
        let healed = 0;
        let spellcasters = 0;
        set((state) => ({
          players: state.players.map((p) => {
            const progressed = slotProgressionOf(p.class) !== 'none';
            let next: Partial<Player> = {};
            if (p.hp !== p.maxHp) {
              next.hp = p.maxHp;
              healed += 1;
            }
            if (progressed) {
              spellcasters += 1;
              const used = clampUsedToMax(p.spellSlotsUsed ?? ZERO_SLOTS, spellSlotsMax(p.class, p.level));
              const fully = longRestUsed();
              const changed = used.some((v, i) => v !== fully[i]);
              if (changed) next.spellSlotsUsed = fully;
            }
            return Object.keys(next).length === 0 ? p : { ...p, ...next };
          }),
        }));
        return { healed, spellcasters };
      },
    }),
    {
      name: 'player-storage',
      // v4 = control de espacios de conjuro usados (spellSlotsUsed).
      // v3 = un personaje puede equipar varias armas (weaponIds).
      // v2 = integración con el SRD (se descartan los personajes previos).
      version: 4,
      migrate: (persisted, version) => {
        const state = (persisted ?? { players: [] }) as { players?: Array<Record<string, unknown>> };
        if (version < 2) {
          return { players: [] } as unknown as PlayerStore;
        }
        const players = state.players ?? [];
        return {
          ...state,
          players: players.map((p) => {
            let next: Record<string, unknown> = p;
            if (p.weaponIds === undefined) {
              const legacyId = p.weaponId;
              if (typeof legacyId === 'string' && legacyId) {
                next = { ...next, weaponIds: [legacyId] };
              }
            }
            if (next.spellSlotsUsed === undefined) {
              next = { ...next, spellSlotsUsed: [...ZERO_SLOTS] };
            }
            return next;
          }),
        } as unknown as PlayerStore;
      },
    }
  )
);