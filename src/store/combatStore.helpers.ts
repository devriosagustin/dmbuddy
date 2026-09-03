// ============================================================
// Helpers compartidos entre los slices de combatStore.
// ============================================================

import type { MapCreature, Combatant, PendingEncounter, RollAbility } from '../types';
import { useSessionStore } from './sessionStore';
// Import circular intencional: solo se usa dentro del cuerpo de la función,
// en tiempo de ejecución (no en la inicialización del módulo), así que es
// seguro con módulos ES. useCombatStore se define en combatStore.ts, que a
// su vez importa estos helpers.
import { useCombatStore } from './combatStore';

export const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

// Etiqueta corta de cada característica para salvaciones (español).
export const STAT_LABELS: Record<RollAbility, string> = {
  str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
};

// Nombre "base" de un combatiente (sin el sufijo de copia " A", " B"...).
export const baseName = (name: string): string => name.replace(/\s+[a-z]$/i, '').trim();
// Letra identificadora para copias del mismo monstruo: 0 -> A, 1 -> B, ...
export const copyLetter = (i: number): string =>
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i % 26] ?? String(i + 1);

/**
 * Envía la petición de iniciativa al siguiente jugador conectado del encuentro
 * pendiente. Busca la ficha remota por nombre para obtener su ownerPlayerId
 * (el id que el jugador usa para reconocer peticiones dirigidas a él).
 */
export const emitInitiativeRequest = (pen: PendingEncounter): void => {
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
export const creatureToCombatant = (c: MapCreature): Omit<Combatant, 'id'> => {
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

/** Migración v1: normaliza weaponId (legacy) a weaponIds (array). */
export const migrateWeapons = (state: {
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
