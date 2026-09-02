// ============================================================
// Store de combate (Zustand con persistencia)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CombatState, Combatant, CombatLogEntry, StatusEffect, MapTile, TileType, ChatMessage, XpAward, MapCreature, RollRequest, RollResponse, RollAbility, PendingEncounter } from '../types';
import { sortByInitiative, playerToCombatant } from '../utils/combatUtils';
import { findSpawnCell, inBounds, gridDistanceFeet, isBlocked, setActiveMapSize, MAP_COLS, MAP_ROWS } from '../utils/mapUtils';
import { tileKey } from '../types/session';

// Sincroniza los PG finales del combate con el party (sin recarga circular:
// playerStore no importa combatStore).
import { usePlayerStore } from './playerStore';
// Para saber qué miembros del party están conectados al pedir iniciativas.
import { useSessionStore } from './sessionStore';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

// Etiqueta corta de cada característica para salvaciones (español).
const STAT_LABELS: Record<RollAbility, string> = {
  str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
};

// Nombre "base" de un combatiente (sin el sufijo de copia " a", " b"...).
const baseName = (name: string): string => name.replace(/\s+[a-z]$/, '').trim();
// Letra identificadora para copias del mismo monstruo: 0 -> a, 1 -> b, ...
const copyLetter = (i: number): string =>
  'abcdefghijklmnopqrstuvwxyz'[i % 26] ?? String(i + 1);

/**
 * Envía la petición de iniciativa al siguiente jugador conectado del encuentro
 * pendiente. Busca la ficha remota por nombre para obtener su ownerPlayerId
 * (el id que el jugador usa para reconocer peticiones dirigidas a él).
 */
const emitInitiativeRequest = (pen: PendingEncounter): void => {
  if (!pen.currentName) return;
  const remotes = useSessionStore.getState().remotePlayers;
  const rp = remotes.find((r) => r.name === pen.currentName);
  const pid = (rp?.sheet?.ownerPlayerId as string | undefined) ?? rp?.id;
  if (!pid) return;
  useCombatStore.getState().requestRoll({
    kind: 'initiative',
    playerId: pid,
    playerName: pen.currentName,
    label: 'Iniciativa',
  });
};

/**
 * Convierte una criatura persistente del mapa en un combatiente para entrar
 * en un encuentro (con posición ya fijada en la cuadrícula).
 */
const creatureToCombatant = (c: MapCreature): Omit<Combatant, 'id'> => {
  const initiative = 1 + Math.floor(Math.random() * 20);
  return {
    name: c.name,
    initiative,
    hp: c.hp,
    maxHp: c.maxHp,
    tempHp: c.tempHp,
    armorClass: c.armorClass,
    type: c.kind === 'npc' ? 'npc' : 'monster',
    isActive: true,
    statusEffects: c.statusEffects,
    monsterId: c.kind === 'monster' ? c.refId : undefined,
    npcId: c.kind === 'npc' ? c.refId : undefined,
    npcRole: c.npcRole,
    xpReward: c.xpReward,
    isDead: false,
    speed: c.speed,
    x: c.x,
    y: c.y,
  };
};

export interface CombatStore extends CombatState {  // Acciones
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
  /** Coloca una criatura persistente en el mapa (monstruo/NPC). */
  addMapCreature: (creature: Omit<MapCreature, 'id'>) => void;
  /** Retira una criatura persistente del mapa. */
  removeMapCreature: (id: string) => void;
  /** Actualiza campos de una criatura persistente del mapa. */
  updateMapCreature: (id: string, updates: Partial<MapCreature>) => void;
  /** Fija o mueve la posición de ficha de un miembro del party en el mapa. */
  setPartyToken: (playerId: string, x: number, y: number) => void;
  /** Retira la ficha de un miembro del party del mapa. */
  removePartyToken: (playerId: string) => void;
  /** Vacía el mapa de criaturas y fichas del party (lo deja limpio). */
  clearMap: () => void;
  /** Inicia un encuentro con las criaturas indicadas + el party indicado. */
  startEncounter: (creatureIds: string[], playerIds: string[]) => void;
  /** Revela u oculta una casilla (trampa/tesoro/investigación) a la party. */
  toggleRevealTile: (x: number, y: number) => void;
  /** Revela u oculta la vida de un enemigo a la party. */
  toggleRevealEnemy: (id: string) => void;
  /** Fija el radio de visión (pies) de la cortina de guerra. */
  setVisionRange: (feet: number) => void;
  /** Cambia la resolución de la cuadrícula (columnas/filas) del mapa. */
  setMapSize: (cols: number, rows: number) => void;
  /** Activa/desactiva si el party puede ver el mapa. */
  setMapVisible: (visible: boolean) => void;
  /** Vacía el chat/lore de la sesión. */
  clearChat: () => void;
  /** Envía una petición de tirada a un jugador (se publica en el snapshot). */
  requestRoll: (request: Omit<RollRequest, 'id' | 'createdAt'>) => void;
  /** Guarda la respuesta de un jugador, la registra y cierra la petición. */
  receiveRollResponse: (response: RollResponse) => void;
  /** Cancela la petición de tirada vigente sin esperar respuesta. */
  cancelRollRequest: () => void;
  /**
   * Cierra el encuentro pendiente de iniciativas: aplica las iniciativas
   * recibidas (fallback si faltan) y activa el combate con el orden final.
   */
  finalizeEncounter: () => void;
  /** Cancela un encuentro pendiente de iniciativas (no se inicia combate). */
  cancelPendingEncounter: () => void;
  /** Envía un mensaje de chat/lore: se guarda en el registro y se sincroniza. */
  sendChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
}

/** Migración v1: normaliza weaponId (legacy) a weaponIds (array). */
const migrateWeapons = (state: {
  participants?: Array<Record<string, unknown>>;
}): Record<string, unknown> => {
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
  };
};

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
      mapCreatures: [],
      partyTokens: [],
      revealedTileKeys: [],
      revealedEnemyIds: [],
      visionRange: 30,
      mapCols: MAP_COLS,
      mapRows: MAP_ROWS,
      mapVisible: true,
      chat: [],
      xpAwards: [],
      rollRequest: null,
      rollResponses: [],
      pendingEncounter: null,

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
          xpAwards: [],
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

      toggleTile: (x, y, type: TileType) => {
        const { tiles } = get();
        const idx = tiles.findIndex((t) => t.x === x && t.y === y);
        if (idx >= 0) {
          // Si ya existe un tile del mismo tipo, lo quita (toggle off).
          // Si es de otro tipo, lo reemplaza.
          if (tiles[idx].type === type) {
            if (type === 'door') {
              // Puerta: alterna entre cerrada y abierta.
              const updated = [...tiles];
              updated[idx] = { ...updated[idx], open: updated[idx].open === true ? false : true };
              set({ tiles: updated });
            } else {
              set({ tiles: tiles.filter((t) => !(t.x === x && t.y === y)) });
            }
          } else {
            const updated = [...tiles];
            updated[idx] = { x, y, type };
            set({ tiles: updated });
          }
        } else if (inBounds(x, y)) {
          // Añadir nuevo tile (las puertas nacen cerradas).
          const tile: MapTile = type === 'door' ? { x, y, type, open: false } : { x, y, type };
          set({ tiles: [...tiles, tile] });
        }
      },

      setTiles: (tiles) => {
        set({ tiles: tiles.filter((t) => inBounds(t.x, t.y)) });
      },

      clearTiles: () => {
        set({ tiles: [] });
      },

      moveCombatant: (id, x, y) => {
        const { participants, tiles, mapCols, mapRows } = get();
        const combatant = participants.find((p) => p.id === id);
        if (!combatant) return;
        const cx = Math.floor(x);
        const cy = Math.floor(y);
        const clamped = inBounds(cx, cy)
          ? { x: cx, y: cy }
          : { x: Math.max(0, Math.min(mapCols - 1, cx)), y: Math.max(0, Math.min(mapRows - 1, cy)) };
        if (combatant.x === clamped.x && combatant.y === clamped.y) return;
        // Bloquear movimiento si hay un muro o una puerta cerrada en el destino.
        if (isBlocked(tiles, clamped.x, clamped.y)) return;
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

        const xpAwards: XpAward[] = [];

        if (playerCombatants.length > 0 && totalXp > 0) {
          const awarded = playerCombatants
            .map((c) => c.playerId)
            .filter((id): id is string => Boolean(id));
          const base = Math.floor(totalXp / playerCombatants.length);
          const remainder = totalXp - base * playerCombatants.length;

          awarded.forEach((playerId, i) => {
            const share = base + (i === 0 ? remainder : 0);
            const before = usePlayerStore.getState().players.find((p) => p.id === playerId);
            const beforeLevel = before?.level;
            // addXp sincroniza automáticamente nivel y competencia al superar umbrales.
            usePlayerStore.getState().addXp(playerId, share);
            const afterLevel = usePlayerStore.getState().players.find((p) => p.id === playerId)?.level;
            xpAwards.push({
              playerId,
              name: before?.name ?? 'Un jugador',
              xp: share,
              leveledUp: Boolean(beforeLevel && afterLevel && afterLevel > beforeLevel),
              level: afterLevel ?? beforeLevel ?? 1,
            });
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

        set({ isActive: false, xpAwards, combatLog: [...combatLog, ...closeOut] });

        // Sincronizar el estado tras el combate con el mapa persistente:
        // - Los monstruos/NPCs que participaron y sobrevivieron conservan su PG
        //   en el mapa para futuros encuentros.
        // - Los monstruos/NPCs derrotados (0 PG) se retiran del mapa.
        // Los personajes del party NO son criaturas: su PG ya se sincronizó
        // arriba a playerStore y sus fichas (partyTokens) permanecen explorando.
        const mapCreatures = get().mapCreatures;
        const updated = mapCreatures
          .map((mc) => {
            // Buscar el combatiente del encuentro que corresponde a esta criatura:
            // por ref/name, por id (si se conservó) o como último recurso por su
            // posición en el mapa (criaturas sin refId añadidas a mano).
            const combatant =
              participants.find(
                (p) => p.id === mc.id || (mc.refId !== undefined && p.monsterId === mc.refId && p.name === mc.name)
              ) ??
              participants.find(
                (p) => (p.x === mc.x && p.y === mc.y && p.name === mc.name) || (p.x === mc.x && p.y === mc.y && p.type === mc.kind)
              );
            if (!combatant) return mc;
            // Monstruo/NPC muerto: retirarlo del mapa (filter más abajo lo elimina).
            if (combatant.isDead || combatant.hp <= 0) return { ...mc, isDead: true };
            return {
              ...mc,
              hp: combatant.hp,
              tempHp: combatant.tempHp,
              statusEffects: combatant.statusEffects,
              isDead: false,
            };
          })
          .filter((mc) => !mc.isDead)
          .map((mc) => ({ ...mc, isDead: false }));
        set({ mapCreatures: updated });
      },

      resetCombat: () => {
        // Al reiniciar/limpiar se deja el mapa en modo exploración: se conservan
        // tiles y criaturas colocadas, pero termina el encuentro en curso.
        set({
          participants: [],
          combatLog: [],
          turn: -1,
          round: 0,
          isActive: false,
          xpAwards: [],
          pendingEncounter: null,
          rollRequest: null,
        });
      },

      addMapCreature: (creature) => {
        const full: MapCreature = {
          ...creature,
          id: makeId(),
          isDead: false,
        };
        set((state) => ({ mapCreatures: [...state.mapCreatures, full] }));
        get().addLogEntry({
          type: 'custom',
          message: `🪧 ${creature.name} colocado en el mapa en (${creature.x},${creature.y})`,
        });
      },

      removeMapCreature: (id) => {
        const creature = get().mapCreatures.find((c) => c.id === id);
        set((state) => ({ mapCreatures: state.mapCreatures.filter((c) => c.id !== id) }));
        if (creature) {
          get().addLogEntry({
            type: 'custom',
            message: `🗑 ${creature.name} retirado del mapa`,
          });
        }
      },

      updateMapCreature: (id, updates) => {
        set((state) => ({
          mapCreatures: state.mapCreatures.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      setPartyToken: (playerId, x, y) => {
        set((state) => {
          const exists = state.partyTokens.some((t) => t.playerId === playerId);
          const partyTokens = exists
            ? state.partyTokens.map((t) => (t.playerId === playerId ? { ...t, x, y } : t))
            : [...state.partyTokens, { playerId, x, y }];
          return { partyTokens };
        });
        const player = usePlayerStore.getState().players.find((p) => p.id === playerId);
        if (player) {
          get().addLogEntry({
            type: 'custom',
            message: `🪪 ${player.name} colocado en el mapa en (${x},${y})`,
          });
        }
      },

      removePartyToken: (playerId) => {
        const token = get().partyTokens.find((t) => t.playerId === playerId);
        set((state) => ({
          partyTokens: state.partyTokens.filter((t) => t.playerId !== playerId),
        }));
        if (token) {
          const player = usePlayerStore.getState().players.find((p) => p.id === playerId);
          get().addLogEntry({
            type: 'custom',
            message: `🗑 ${player?.name ?? 'Un miembro del party'} retirado del mapa`,
          });
        }
      },

      clearMap: () => {
        const { mapCreatures, partyTokens } = get();
        set({ mapCreatures: [], partyTokens: [] });
        const count = mapCreatures.length + partyTokens.length;
        if (count > 0) {
          get().addLogEntry({
            type: 'custom',
            message: `🧹 Mapa limpiado: se retiraron ${count} ficha${count !== 1 ? 's' : ''} (criaturas y party)`,
          });
        }
      },

      startEncounter: (creatureIds, playerIds) => {
        const { mapCreatures, partyTokens, tiles } = get();
        const selected = mapCreatures.filter((c) => creatureIds.includes(c.id));
        if (selected.length === 0 && playerIds.length === 0) return;

        const humanRoll = () =>
          1 + Math.floor(Math.random() * 20);

        const fromPlayer = (playerId: string): Omit<Combatant, 'id'> | null => {
          const player = usePlayerStore.getState().players.find((p) => p.id === playerId);
          if (!player) return null;
          return playerToCombatant(player, humanRoll());
        };

        const participants: Combatant[] = [];
        for (const p of playerIds) {
          const c = fromPlayer(p);
          if (c) {
            // Si el jugador ya tiene ficha en el mapa (exploración), conserva su
            // posición y PG actuales al entrar al encuentro. Los PJ no son
            // criaturas: su posición vive en partyTokens.
            const placed = partyTokens.find((t) => t.playerId === p);
            const spawn = findSpawnCell(participants, true, tiles);
            participants.push({
              ...c,
              id: makeId(),
              x: placed?.x ?? c.x ?? spawn.x,
              y: placed?.y ?? c.y ?? spawn.y,
              hp: c.hp,
            });
          }
        }
        for (const c of selected) {
          participants.push({ ...creatureToCombatant(c), id: makeId() });
        }

        const newId = makeId();

        // Miembros del party que están conectados (ficha remota publicada) cuyo
        // nombre coincide con un PJ seleccionado → les pedimos la iniciativa en
        // cascada. El resto (no conectados) se autotira como respaldo.
        const remotes = useSessionStore.getState().remotePlayers;
        const connectedNames: string[] = [];
        for (const rp of remotes) {
          if (!rp.sheet) continue;
          const isActive = (rp.sheet as { active?: unknown }).active !== false;
          const matched = participants.find(
            (pt) => pt.type === 'player' && pt.name === rp.name
          );
          if (isActive && matched && !connectedNames.includes(matched.name)) {
            connectedNames.push(matched.name);
          }
        }

        if (connectedNames.length > 0) {
          // Encuentro pendiente: esperamos la iniciativa de los conectados antes
          // de activar el combate. Los participantes llevan iniciativa provisional.
          set({
            id: newId,
            round: 0,
            turn: -1,
            isActive: false,
            participants: [],
            pendingEncounter: {
              id: newId,
              participants,
              pendingNames: connectedNames,
              currentName: connectedNames[0],
              tiles,
              mapCreatures: get().mapCreatures,
              partyTokens: get().partyTokens,
            },
            rollRequest: null,
            encounterCount: (get().encounterCount ?? 0) + 1,
          });
          get().addLogEntry({
            type: 'initiative',
            message: `🎲 Pidiendo iniciativa a: ${connectedNames.join(', ')}`,
          });
          emitInitiativeRequest(useCombatStore.getState().pendingEncounter as PendingEncounter);
          return;
        }

        // Sin conectados: inicio inmediato con iniciativas autotiradas.
        const sorted = sortByInitiative(participants);
        set({
          id: newId,
          round: 1,
          turn: -1,
          isActive: true,
          participants: sorted,
          combatLog: [
            {
              id: makeId(),
              timestamp: new Date(),
              type: 'initiative',
              message: `¡Encuentro iniciado con ${selected.length} criatura${selected.length !== 1 ? 's' : ''} y ${playerIds.length} jugador${playerIds.length !== 1 ? 'es' : ''}!`,
            },
          ],
          startTime: new Date(),
          encounterCount: (get().encounterCount ?? 0) + 1,
          xpAwards: [],
        });
        const names = sorted.map((c) => `${c.name} (${c.initiative})`);
        get().addLogEntry({
          type: 'initiative',
          message: `Iniciativa: ${names.join(', ')}`,
        });
      },

      toggleRevealTile: (x, y) => {
        const key = tileKey(x, y);
        set((state) => ({
          revealedTileKeys: state.revealedTileKeys.includes(key)
            ? state.revealedTileKeys.filter((k) => k !== key)
            : [...state.revealedTileKeys, key],
        }));
      },

      toggleRevealEnemy: (id) => {
        set((state) => ({
          revealedEnemyIds: state.revealedEnemyIds.includes(id)
            ? state.revealedEnemyIds.filter((e) => e !== id)
            : [...state.revealedEnemyIds, id],
        }));
      },

      setVisionRange: (feet) => {
        set({ visionRange: Math.max(5, Math.round(feet)) });
      },

      setMapSize: (cols, rows) => {
        const { participants, tiles, mapCols, mapRows } = get();
        const nCols = Math.max(8, Math.round(cols));
        const nRows = Math.max(8, Math.round(rows));
        if (nCols === mapCols && nRows === mapRows) return;
        // Fija primero las dims activas para que inBounds use la nueva cuadrícula.
        setActiveMapSize(nCols, nRows);
        // Recorta tiles y ficha s fuera de los nuevos límites.
        const inBoundsTiles = tiles.filter((t) => inBounds(t.x, t.y));
        const clampedParticipants = participants.map((p) => ({
          ...p,
          x: p.x === undefined ? p.x : Math.min(nCols - 1, p.x),
          y: p.y === undefined ? p.y : Math.min(nRows - 1, p.y),
        }));
        const clampedCreatures = get().mapCreatures.map((c) => ({
          ...c,
          x: Math.min(nCols - 1, c.x),
          y: Math.min(nRows - 1, c.y),
        }));
        set({
          mapCols: nCols,
          mapRows: nRows,
          tiles: inBoundsTiles,
          participants: clampedParticipants,
          mapCreatures: clampedCreatures,
        });
        get().addLogEntry({
          type: 'custom',
          message: `🗺 Mapa cambiado a ${nCols}×${nRows} (${nCols * 5}×${nRows * 5} pies)`,
        });
      },

      sendChatMessage: (msg) => {
        const { chat } = get();
        const full: ChatMessage = {
          ...msg,
          id: makeId(),
          timestamp: Date.now(),
        };
        set({ chat: [...chat, full].slice(-200) });
        get().addLogEntry({
          type: 'chat',
          message: `🗣 ${msg.author}: ${msg.text}`,
          combatantId: msg.combatantId,
          details: { author: msg.author, kind: msg.kind },
        });
      },

      setMapVisible: (visible) => {
        set({ mapVisible: visible });
        get().addLogEntry({
          type: 'custom',
          message: visible ? '🗺 Mapa visible para el party' : '🗺 Mapa oculto para el party (el DM está preparando)',
        });
      },

      clearChat: () => {
        const removed = get().chat.length;
        set({ chat: [] });
        get().addLogEntry({
          type: 'custom',
          message: `🗑 Chat/lore vaciado (${removed} mensaje${removed === 1 ? '' : 's'} eliminado${removed === 1 ? '' : 's'})`,
        });
      },

      requestRoll: (request) => {
        const full: RollRequest = { ...request, id: makeId(), createdAt: Date.now() };
        set({ rollRequest: full });
        const ctx = full.label ? ` — ${full.label}` : '';
        let msg: string;
        if (full.kind === 'save') {
          msg = `🎲 Petición de salvación (${STAT_LABELS[full.ability!]}) a ${full.playerName}: DC ${full.dc}${ctx}`;
        } else if (full.kind === 'initiative') {
          msg = `🎲 Petición de iniciativa a ${full.playerName}${ctx}`;
        } else {
          const opts = (full.skills ?? []).join(', ');
          msg = `🎲 Petición de habilidad a ${full.playerName}${opts ? ` (elige: ${opts})` : ''}${full.dc ? ` · DC ${full.dc}` : ''}${ctx}`;
        }
        get().addLogEntry({ type: 'roll', message: msg });
      },

      receiveRollResponse: (response) => {
        const existing = get().rollResponses ?? [];
        const already = existing.some((r) => r.requestId === response.requestId);
        if (already) return;
        // Guarda la respuesta y cierra la petición vigente.
        set({ rollResponses: [...existing, response], rollRequest: null });

        if (response.kind === 'save') {
          get().addLogEntry({
            type: 'roll',
            message:
              `🎲 ${response.playerName} (${STAT_LABELS[response.ability!]}) → ${response.breakdown} ` +
              `${response.success ? '✔ ÉXITO' : '✖ FALLO'} (DC ${response.dc})`,
          });
          return;
        }

        if (response.kind === 'skill') {
          const sk = response.skill ?? 'habilidad';
          const total = response.breakdown;
          const outcome =
            response.dc !== undefined
              ? `${response.success ? '✔ ÉXITO' : '✖ FALLO'} (DC ${response.dc})`
              : `total ${response.result}`;
          get().addLogEntry({
            type: 'roll',
            message: `🎲 ${response.playerName} — ${sk} → ${total} · ${outcome}`,
          });
          return;
        }

        // initiative: aplica el resultado y sigue la cascada o finaliza.
        if (response.kind === 'initiative') {
          const pen = get().pendingEncounter;
          get().addLogEntry({
            type: 'roll',
            message: `🎲 ${response.playerName} — ${response.breakdown} → iniciativa ${response.initiative ?? response.result}`,
          });
          if (!pen) return;
          const init = response.initiative ?? response.result;
          const withRoll = pen.participants.map((p) =>
            p.type === 'player' && p.name === response.playerName ? { ...p, initiative: init } : p
          );
          const nextNames = pen.pendingNames.filter((n) => n !== response.playerName);
          set({ pendingEncounter: { ...pen, participants: withRoll, pendingNames: nextNames, currentName: nextNames[0] ?? null } });
          if (nextNames.length === 0) {
            useCombatStore.getState().finalizeEncounter();
          } else {
            emitInitiativeRequest(get().pendingEncounter as PendingEncounter);
          }
          return;
        }
      },

      cancelRollRequest: () => {
        const current = get().rollRequest;
        if (!current) return;
        set({ rollRequest: null });
        get().addLogEntry({
          type: 'roll',
          message: `✖ Petición de tirada cancelada (${current.playerName})`,
        });
      },

      finalizeEncounter: () => {
        const pen = get().pendingEncounter;
        if (!pen) return;
        const sorted = sortByInitiative(pen.participants);
        const names = sorted.map((c) => `${c.name} (${c.initiative})`);
        set({
          id: pen.id,
          round: 1,
          turn: -1,
          isActive: true,
          participants: sorted,
          pendingEncounter: null,
          rollRequest: null,
          startTime: new Date(),
          encounterCount: (get().encounterCount ?? 0) + 1,
          xpAwards: [],
        });
        get().addLogEntry({
          type: 'initiative',
          message: `¡Encuentro iniciado! Iniciativa: ${names.join(', ')}`,
        });
      },

      cancelPendingEncounter: () => {
        const pen = get().pendingEncounter;
        if (!pen) return;
        const names = pen.pendingNames.join(', ');
        set({ pendingEncounter: null, rollRequest: null });
        get().addLogEntry({
          type: 'initiative',
          message: `✖ Encuentro cancelado (iniciativas pendientes: ${names})`,
        });
      },
    }),
    {
      name: 'combat-storage',
      // v1 = un PJ puede llevar varias armas equipadas (weaponIds).
      // v2 = capa de criaturas persistentes del mapa (mapCreatures).
      // v3 = los miembros del party ya no son criaturas: se separan en
      //      partyTokens (posición en el mapa) y se sacan de mapCreatures.
      version: 3,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as {
          participants?: Array<Record<string, unknown>>;
          mapCreatures?: Array<Record<string, unknown>>;
          partyTokens?: unknown;
        };
        let out = state as Record<string, unknown>;
        if (version < 1) {
          out = migrateWeapons(state as never);
        }
        if (out.mapCreatures === undefined) {
          out.mapCreatures = [];
        }
        if (out.partyTokens === undefined) {
          out.partyTokens = [];
        }
        // v3: separar a los miembros del party (kind === 'player') que aún
        // vivieran como criaturas en mapCreatures hacia partyTokens.
        if (version < 3) {
          const creatures = (out.mapCreatures as Array<Record<string, unknown>>) ?? [];
          const playersAsCreatures = creatures.filter((c) => c.kind === 'player');
          const cleanCreatures = creatures.filter((c) => c.kind !== 'player');
          const tokens: Array<{ playerId: string; x: number; y: number }> = [
            ...((out.partyTokens as Array<{ playerId: string; x: number; y: number }>) ?? []),
            ...playersAsCreatures
              .filter((c) => typeof c.playerId === 'string')
              .map((c) => ({
                playerId: c.playerId as string,
                x: typeof c.x === 'number' ? c.x : 0,
                y: typeof c.y === 'number' ? c.y : 0,
              })),
          ];
          out = { ...out, mapCreatures: cleanCreatures, partyTokens: tokens };
        }
        return out as unknown as CombatStore;
      },
      // Al rehidratar, resincroniza las dimensiones activas con las guardadas.
      onRehydrateStorage: () => (state) => {
        if (state) {
          setActiveMapSize(state.mapCols ?? MAP_COLS, state.mapRows ?? MAP_ROWS);
        }
      },
    }
  )
);