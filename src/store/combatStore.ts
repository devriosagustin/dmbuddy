// ============================================================
// Store de combate (Zustand con persistencia)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CombatState, Combatant, CombatLogEntry, StatusEffect } from '../types';

// Sincroniza los PG finales del combate con el party (sin recarga circular:
// playerStore no importa combatStore).
import { usePlayerStore } from './playerStore';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

interface CombatStore extends CombatState {
  // Acciones
  initializeCombat: () => void;
  addCombatant: (combatant: Omit<Combatant, 'id' | 'isActive' | 'isDead'>) => boolean;
  removeCombatant: (id: string) => void;
  nextTurn: () => void;
  previousTurn: () => void;
  setTurn: (index: number) => void;
  updateHP: (id: string, amount: number, isDamage: boolean, useTempHpFirst?: boolean) => void;
  setMaxHP: (id: string, maxHp: number) => void;
  setAC: (id: string, ac: number) => void;
  setInitiative: (id: string, initiative: number) => void;
  reorderParticipants: (ordered: Combatant[]) => void;
  addStatusEffect: (id: string, effect: Omit<StatusEffect, 'id'>) => void;
  removeStatusEffect: (id: string, effectId: string) => void;
  tickStatusEffects: () => void;
  addLogEntry: (entry: Omit<CombatLogEntry, 'id' | 'timestamp'>) => void;
  endCombat: () => void;
  resetCombat: () => void;
}

export const useCombatStore = create<CombatStore>()(
  persist(
    (set, get) => ({
      id: '',
      round: 0,
      turn: 0,
      isActive: false,
      participants: [],
      combatLog: [],
      startTime: new Date(),
      encounterCount: 0,

      initializeCombat: () => {
        set({
          id: makeId(),
          round: 1,
          turn: 0,
          isActive: true,
          participants: [],
          combatLog: [{
            id: makeId(),
            timestamp: new Date(),
            type: 'initiative',
            message: '¡Combate iniciado!',
          }],
          startTime: new Date(),
          encounterCount: (get().encounterCount ?? 0) + 1,
        });
      },

      addCombatant: (combatant) => {
        // Un mismo personaje del party no puede entrar dos veces en combate.
        if (combatant.playerId && get().participants.some((p) => p.playerId === combatant.playerId)) {
          return false;
        }
        const newCombatant: Combatant = {
          ...combatant,
          id: makeId(),
          isActive: true,
          isDead: false,
        };
        set((state) => ({
          participants: [...state.participants, newCombatant],
        }));
        get().addLogEntry({
          type: 'initiative',
          message: `${combatant.name} se une al combate (Iniciativa: ${combatant.initiative})`,
          combatantId: newCombatant.id,
        });
        return true;
      },

      removeCombatant: (id) => {
        const combatant = get().participants.find((c) => c.id === id);
        const rest = get().participants.filter((c) => c.id !== id);
        // Ajustar el turno actual si se eliminó un combatiente anterior o el actual
        const { turn, round } = get();
        let newTurn = turn;
        if (rest.length === 0) {
          newTurn = 0;
        } else if (turn >= rest.length) {
          newTurn = 0;
        } else if (id === get().participants[turn]?.id) {
          newTurn = turn % rest.length;
        } else {
          newTurn = Math.min(turn, rest.length - 1);
        }
        set({ participants: rest, turn: newTurn, round: newTurn === 0 && turn !== 0 ? round + 1 : round });
        if (combatant) {
          get().addLogEntry({
            type: 'initiative',
            message: `${combatant.name} ha salido del combate`,
            combatantId: id,
          });
        }
      },

      nextTurn: () => {
        const { participants, turn, round, isActive } = get();
        if (!isActive || participants.length === 0) return;
        const nextIndex = (turn + 1) % participants.length;
        const newRound = nextIndex === 0 ? round + 1 : round;

        set({ turn: nextIndex, round: newRound });

        // Al comenzar una nueva ronda, reducir duración de efectos
        if (nextIndex === 0) {
          get().tickStatusEffects();
          get().addLogEntry({
            type: 'status',
            message: `── Ronda ${newRound} ──`,
          });
        }
        get().addLogEntry({
          type: 'initiative',
          message: `Turno de ${participants[nextIndex].name}`,
          combatantId: participants[nextIndex].id,
        });
      },

      previousTurn: () => {
        const { participants, turn, round, isActive } = get();
        if (!isActive || participants.length === 0) return;
        const prevIndex = (turn - 1 + participants.length) % participants.length;
        const newRound = prevIndex === participants.length - 1 ? Math.max(1, round - 1) : round;
        set({ turn: prevIndex, round: newRound });
      },

      setTurn: (index) => {
        const { participants } = get();
        if (index < 0 || index >= participants.length) return;
        set({ turn: index });
      },

      updateHP: (id, amount, isDamage, useTempHpFirst = true) => {
        const combatant = get().participants.find((p) => p.id === id);
        if (!combatant) return;

        const details: string[] = [];
        let tempHpUsed = 0;
        let newHp = combatant.hp;
        let newTempHp = combatant.tempHp;

        if (isDamage) {
          let remaining = Math.abs(amount);
          if (useTempHpFirst && newTempHp > 0) {
            tempHpUsed = Math.min(newTempHp, remaining);
            newTempHp -= tempHpUsed;
            remaining -= tempHpUsed;
            details.push(`${tempHpUsed} a temp HP`);
          }
          newHp = Math.max(0, newHp - remaining);
        } else {
          newHp = Math.min(combatant.maxHp, newHp + Math.abs(amount));
        }

        const isDead = newHp <= 0;

        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id
              ? { ...p, hp: newHp, tempHp: newTempHp, isDead }
              : p
          ),
        }));

        if (isDamage) {
          get().addLogEntry({
            type: 'damage',
            message: `${combatant.name} recibe ${Math.abs(amount)} de daño${details.length ? ` (${details.join(', ')})` : ''}`,
            combatantId: id,
          });
          if (isDead) {
            get().addLogEntry({
              type: 'death',
              message: `${combatant.name} ha caído a 0 PG`,
              combatantId: id,
            });
          }
        } else {
          get().addLogEntry({
            type: 'heal',
            message: `${combatant.name} recupera ${Math.abs(amount)} PG`,
            combatantId: id,
          });
        }
      },

      setMaxHP: (id, maxHp) => {
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id ? { ...p, maxHp: Math.max(1, Math.round(maxHp)) } : p
          ),
        }));
      },

      setAC: (id, ac) => {
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id ? { ...p, armorClass: Math.max(0, Math.round(ac)) } : p
          ),
        }));
      },

      setInitiative: (id, initiative) => {
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id ? { ...p, initiative: Number(initiative) } : p
          ),
        }));
      },

      reorderParticipants: (ordered) => {
        set({ participants: ordered });
      },

      addStatusEffect: (id, effect) => {
        const fullEffect: StatusEffect = { ...effect, id: makeId() };
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id
              ? { ...p, statusEffects: [...p.statusEffects, fullEffect] }
              : p
          ),
        }));
        get().addLogEntry({
          type: 'status',
          message: `${get().participants.find((p) => p.id === id)?.name ?? 'Alguien'} queda bajo ${effect.name}`,
          combatantId: id,
        });
      },

      removeStatusEffect: (id, effectId) => {
        const combatant = get().participants.find((p) => p.id === id);
        const effect = combatant?.statusEffects.find((e) => e.id === effectId);
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id
              ? { ...p, statusEffects: p.statusEffects.filter((e) => e.id !== effectId) }
              : p
          ),
        }));
        if (effect) {
          get().addLogEntry({
            type: 'status',
            message: `${combatant?.name ?? 'Alguien'} ya no está bajo ${effect.name}`,
            combatantId: id,
          });
        }
      },

      tickStatusEffects: () => {
        const { participants } = get();
        const updated = participants.map((p) => ({
          ...p,
          statusEffects: p.statusEffects
            .map((e) => (e.duration > 0 ? { ...e, duration: e.duration - 1 } : e))
            .filter((e) => e.duration === -1 || e.duration > 0),
        }));
        set({ participants: updated });
      },

      addLogEntry: (entry) => {
        const fullEntry: CombatLogEntry = {
          ...entry,
          id: makeId(),
          timestamp: new Date(),
        };
        set((state) => ({
          combatLog: [...state.combatLog, fullEntry].slice(-100),
        }));
      },

      endCombat: () => {
        const { combatLog, participants } = get();
        // Reflejar el estado final de cada jugador en su ficha del party:
        // resta el daño recibido / aplica la curación, sin tocar PG de forma
        // automática. A 0 PG se mantiene a 0 (estabilizado o moribundo).
        let synced = 0;
        for (const c of participants) {
          if (c.playerId) {
            usePlayerStore.getState().updatePlayer(c.playerId, {
              hp: Math.max(0, Math.min(c.maxHp, c.hp)),
            });
            synced += 1;
          }
        }
        const closeOut: CombatLogEntry[] = [
          { id: makeId(), timestamp: new Date(), type: 'initiative', message: 'Combate finalizado' },
        ];
        if (synced > 0) {
          closeOut.push({
            id: makeId(),
            timestamp: new Date(),
            type: 'custom',
            message: `${synced} jugador${synced !== 1 ? 'es' : ''} del party actualizado(s) a sus PG finales`,
          });
        }
        set({ isActive: false, combatLog: [...combatLog, ...closeOut] });
      },

      resetCombat: () => {
        set({ participants: [], combatLog: [], turn: 0, round: 0, isActive: false });
      },
    }),
    {
      name: 'combat-storage',
      // v1 = un PJ puede llevar varias armas equipadas (weaponIds).
      version: 1,
      migrate: (_persisted, _version) => {
        const state = (_persisted ?? {}) as { participants?: Array<Record<string, unknown>> };
        const participants = state.participants ?? [];
        return {
          ...state,
          participants: participants.map((p) => {
            if (p.weaponIds !== undefined) return p;
            const legacyId = p.weaponId;
            if (typeof legacyId === 'string' && legacyId) {
              return { ...p, weaponIds: [legacyId] };
            }
            return p;
          }),
        } as unknown as CombatStore;
      },
    }
  )
);