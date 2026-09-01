// ============================================================
// Store de combate (Zustand con persistencia)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CombatState, Combatant, CombatLogEntry, StatusEffect, MapTile, TileType } from '../types';
import { sortByInitiative } from '../utils/combatUtils';
import { findSpawnCell, inBounds, MAP_COLS, MAP_ROWS, gridDistanceFeet } from '../utils/mapUtils';

// Sincroniza los PG finales del combate con el party (sin recarga circular:
// playerStore no importa combatStore).
import { usePlayerStore } from './playerStore';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

// Nombre "base" de un combatiente (sin el sufijo de copia " a", " b"...).
const baseName = (name: string): string => name.replace(/\s+[a-z]$/, '').trim();
// Letra identificadora para copias del mismo monstruo: 0 -> a, 1 -> b, ...
const copyLetter = (i: number): string =>
  'abcdefghijklmnopqrstuvwxyz'[i % 26] ?? String(i + 1);

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
  setSpeed: (id: string, speed: number) => void;
  /** Alterna un tile en el mapa (wall/trap/treasure/investigation). */
  toggleTile: (x: number, y: number, type: TileType) => void;
  /** Reemplaza todos los tiles (para cargar un layout de mapa). */
  setTiles: (tiles: MapTile[]) => void;
  /** Elimina todos los tiles. */
  clearTiles: () => void;
  reorderParticipants: (ordered: Combatant[]) => void;
  /** Actualiza campos arbitrarios de un combatiente del combate activo. */
  updateCombatant: (id: string, updates: Partial<Combatant>) => void;
  /** Mueve una ficha a una casilla del mapa (coordenadas columna/fila). */
  moveCombatant: (id: string, x: number, y: number) => void;
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
      tiles: [],

      initializeCombat: () => {
        set({
          id: makeId(),
          round: 1,
          turn: -1, // Ningún combatiente seleccionado hasta pulsar "Siguiente"
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
        // Etiquetar copias del mismo monstruo (Zombie -> Zombie a, b, c...)
        const isMonster = combatant.type === 'monster';
        const base = isMonster ? baseName(combatant.name) : null;
        const sameBefore = base
          ? get().participants.filter((p) => baseName(p.name) === base).length
          : 0;
        const name =
          isMonster && sameBefore >= 1 ? `${base} ${copyLetter(sameBefore)}` : combatant.name;
        const spawn = findSpawnCell(
          get().participants,
          combatant.type === 'player' || (combatant.type === 'npc' && combatant.npcRole === 'ally'),
          get().tiles
        );
        const newCombatant: Combatant = {
          ...combatant,
          name,
          id: makeId(),
          isActive: true,
          isDead: false,
          x: combatant.x ?? spawn.x,
          y: combatant.y ?? spawn.y,
        };
        set((state) => {
          const withNew = [...state.participants, newCombatant];
          // Re-etiquetar retroactivamente copias previas sin sufijo (p. ej. un
          // "Zombie" suelto pasa a "Zombie a" al añadir un segundo "Zombie b").
          if (isMonster && base) {
            const same = withNew.filter((p) => baseName(p.name) === base);
            if (same.length > 1) {
              const relabel = new Map(same.map((p, idx) => [p.id, `${base} ${copyLetter(idx)}`]));
              return {
                participants: sortByInitiative(
                  withNew.map((p) => (relabel.has(p.id) ? { ...p, name: relabel.get(p.id)! } : p))
                ),
              };
            }
          }
          return { participants: sortByInitiative(withNew) };
        });
        get().addLogEntry({
          type: 'initiative',
          message: `${name} se une al combate (Iniciativa: ${combatant.initiative})`,
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
          newTurn = -1; // Sin combatientes: sin turno activo
        } else if (turn < 0) {
          newTurn = -1;
        } else if (turn >= rest.length) {
          newTurn = 0;
        } else if (id === get().participants[turn]?.id) {
          newTurn = turn % rest.length;
        } else {
          newTurn = Math.min(turn, rest.length - 1);
        }
        set({ participants: rest, turn: newTurn, round: newTurn === 0 && turn > 0 ? round + 1 : round });
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
        // Orden canónico: por iniciativa descendente (igual que la vista).
        const sorted = [...participants].sort((a, b) => b.initiative - a.initiative);

        // Sin turno activo todavía: pasar al primer combatiente de la lista.
        if (turn === -1) {
          set({ turn: 0 });
          get().addLogEntry({
            type: 'initiative',
            message: `Turno de ${sorted[0].name}`,
            combatantId: sorted[0].id,
          });
          return;
        }

        const nextIndex = (turn + 1) % sorted.length;
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
          message: `Turno de ${sorted[nextIndex].name}`,
          combatantId: sorted[nextIndex].id,
        });
      },

      previousTurn: () => {
        const { participants, turn, round, isActive } = get();
        if (!isActive || participants.length === 0) return;
        if (turn === -1) return; // Aún no hay turno activo
        const sorted = [...participants].sort((a, b) => b.initiative - a.initiative);
        const prevIndex = (turn - 1 + sorted.length) % sorted.length;
        const newRound = prevIndex === sorted.length - 1 ? Math.max(1, round - 1) : round;
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
        const { participants } = get();
        const updated = participants.map((p) =>
          p.id === id ? { ...p, initiative: Number(initiative) } : p
        );
        // Reordenar por iniciativa tras el cambio (mantiene el orden canónico).
        set({ participants: sortByInitiative(updated) });
      },

      setSpeed: (id, speed) => {
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id ? { ...p, speed: Math.max(0, Math.round(speed)) } : p
          ),
        }));
      },

      updateCombatant: (id, updates) => {
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      toggleTile: (x, y, type) => {
        const { tiles } = get();
        const idx = tiles.findIndex((t) => t.x === x && t.y === y);
        if (idx >= 0) {
          // Si ya existe un tile del mismo tipo, lo quita (toggle off).
          // Si es de otro tipo, lo reemplaza.
          if (tiles[idx].type === type) {
            set({ tiles: tiles.filter((t) => !(t.x === x && t.y === y)) });
          } else {
            const updated = [...tiles];
            updated[idx] = { x, y, type };
            set({ tiles: updated });
          }
        } else if (inBounds(x, y)) {
          // Añadir nuevo tile.
          set({ tiles: [...tiles, { x, y, type }] });
        }
      },

      setTiles: (tiles) => {
        set({ tiles: tiles.filter((t) => inBounds(t.x, t.y)) });
      },

      clearTiles: () => {
        set({ tiles: [] });
      },

      moveCombatant: (id, x, y) => {
        const { participants, tiles } = get();
        const combatant = participants.find((p) => p.id === id);
        if (!combatant) return;
        const cx = Math.floor(x);
        const cy = Math.floor(y);
        const clamped = inBounds(cx, cy)
          ? { x: cx, y: cy }
          : { x: Math.max(0, Math.min(MAP_COLS - 1, cx)), y: Math.max(0, Math.min(MAP_ROWS - 1, cy)) };
        if (combatant.x === clamped.x && combatant.y === clamped.y) return;
        // Bloquear movimiento si hay un muro en el destino.
        const destWall = tiles.find((t) => t.x === clamped.x && t.y === clamped.y && t.type === 'wall');
        if (destWall) return;
        const from = { x: combatant.x ?? 0, y: combatant.y ?? 0 };
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id ? { ...p, x: clamped.x, y: clamped.y } : p
          ),
        }));
        // Registrar movimiento.
        const distance = gridDistanceFeet(from, clamped);
        get().addLogEntry({
          type: 'move',
          message: `${combatant.name} se mueve a (${clamped.x},${clamped.y}) — ${distance} pies`,
          combatantId: id,
        });
        // Triggers de tiles en el destino.
        const destTile = tiles.find((t) => t.x === clamped.x && t.y === clamped.y);
        if (destTile) {
          if (destTile.type === 'trap') {
            get().addLogEntry({
              type: 'move',
              message: `💥 ${combatant.name} activa una TRAMPA en (${clamped.x},${clamped.y})`,
              combatantId: id,
            });
          } else if (destTile.type === 'investigation') {
            get().addLogEntry({
              type: 'move',
              message: `🔍 ${combatant.name} investiga en (${clamped.x},${clamped.y}) — ¡Descubre algo!`,
              combatantId: id,
            });
          } else if (destTile.type === 'treasure') {
            get().addLogEntry({
              type: 'move',
              message: `💰 ${combatant.name} encuentra un TESORO en (${clamped.x},${clamped.y})`,
              combatantId: id,
            });
          }
        }
        // Trigger de tesoro adyacente (si hay tesoro en casillas vecinas).
        const adjacent = [
          { x: clamped.x - 1, y: clamped.y },
          { x: clamped.x + 1, y: clamped.y },
          { x: clamped.x, y: clamped.y - 1 },
          { x: clamped.x, y: clamped.y + 1 },
        ];
        for (const adj of adjacent) {
          const treasure = tiles.find((t) => t.x === adj.x && t.y === adj.y && t.type === 'treasure');
          if (treasure) {
            get().addLogEntry({
              type: 'move',
              message: `💰 ${combatant.name} detecta un TESORO cercano en (${treasure.x},${treasure.y})`,
              combatantId: id,
            });
          }
        }
      },

      reorderParticipants: (ordered) => {
        set({ participants: sortByInitiative(ordered) });
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

        // Reparto de XP: se suman los monstruos derrotados y se dividen entre
        // los jugadores que participaron en el combate (vivos o caídos).
        const defeatedMonsters = participants.filter((c) => c.type === 'monster' && c.isDead);
        const playerCombatants = participants.filter((c) => c.type === 'player');
        const totalXp = defeatedMonsters.reduce(
          (sum, c) => sum + (c.xpReward ?? 0),
          0
        );

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

        if (playerCombatants.length > 0 && totalXp > 0) {
          const awarded = playerCombatants
            .map((c) => c.playerId)
            .filter((id): id is string => Boolean(id));
          const base = Math.floor(totalXp / playerCombatants.length);
          const remainder = totalXp - base * playerCombatants.length;

          awarded.forEach((playerId, i) => {
            const share = base + (i === 0 ? remainder : 0);
            // addXp sincroniza automáticamente nivel y competencia al superar umbrales.
            usePlayerStore.getState().addXp(playerId, share);
          });

          closeOut.push({
            id: makeId(),
            timestamp: new Date(),
            type: 'xp',
            message: `XP total del encuentro: ${totalXp} (${defeatedMonsters.length} monstruo${defeatedMonsters.length !== 1 ? 's' : ''} derrotado${defeatedMonsters.length !== 1 ? 's' : ''})`,
            details: { totalXp, defeatedCount: defeatedMonsters.length },
          });
          closeOut.push({
            id: makeId(),
            timestamp: new Date(),
            type: 'xp',
            message: awarded.length === 1
              ? `${usePlayerStore.getState().players.find((p) => p.id === awarded[0])?.name ?? 'Un jugador'} recibe ${totalXp} XP`
              : `Reparto entre ${awarded.length} participantes (${base} XP c/u${remainder > 0 ? ` + ${remainder} extra al primero` : ''})`,
            details: { base, remainder, totalXp },
          });
        } else if (defeatedMonsters.length > 0 && playerCombatants.length === 0) {
          closeOut.push({
            id: makeId(),
            timestamp: new Date(),
            type: 'xp',
            message: `Monstruos derrotados: ${totalXp} XP en total (sin jugadores en combate, no se reparte)`,
            details: { totalXp },
          });
        }

        set({ isActive: false, combatLog: [...combatLog, ...closeOut] });
      },

      resetCombat: () => {
        set({ participants: [], combatLog: [], turn: -1, round: 0, isActive: false });
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