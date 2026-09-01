// ============================================================
// Utilidades de combate de DM Copilot Web
// ============================================================

import type { Combatant, Monster, Player, StatAbbrev } from '../types';
import { SRD_CLASSES } from '../data/srd2024';
import { crToXp } from '../data/srdMonsters';

// Salvaciones competentes de una clase (SRD) al abreviatura de estadística.
const SAVE_LABEL_TO_STAT: Record<string, StatAbbrev> = {
  FUE: 'str', DES: 'dex', CON: 'con', INT: 'int', SAB: 'wis', CAR: 'cha',
};

/**
 * Salvaciones en las que es competente el personaje según su clase (2024):
 * cada clase otorga competencia en dos tiradas de salvación.
 */
const classSaves = (className: string | undefined): StatAbbrev[] => {
  const entry = SRD_CLASSES.find((c) => c.title === className);
  if (!entry) return [];
  return entry.saves.map((s) => SAVE_LABEL_TO_STAT[s]).filter((s): s is StatAbbrev => Boolean(s));
};

/**
 * Ordena los combatientes por iniciativa descendente.
 */
export const sortByInitiative = (participants: Combatant[]): Combatant[] =>
  [...participants].sort((a, b) => b.initiative - a.initiative);

/**
 * Indica si hay un combate con participantes.
 */
export const hasActiveParticipants = (participants: Combatant[]): boolean =>
  participants.length > 0;

/**
 * Calcula el total de daño aplicado con resistencia y vulnerabilidad.
 * amount: daño base
 * resistance: multiplicador de resistencia (0.5)
 * vulnerability: multiplicador de vulnerabilidad (2)
 * immunity: si es inmune, el daño es 0.
 */
export const calculateDamage = (
  amount: number,
  options?: { resistance?: boolean; vulnerability?: boolean; immunity?: boolean }
): number => {
  if (options?.immunity) return 0;
  let total = amount;
  if (options?.vulnerability) total *= 2;
  if (options?.resistance) total *= 0.5;
  return Math.max(0, total);
};

/**
 * Extrae la velocidad (en pies) de una cadena de velocidad de un monstruo,
 * p. ej. "30 pies", "15 ft., 10 ft. volando", "30 pies, 15 pies nadando".
 * Devuelve 30 (el valor por defecto) si no encuentra un número.
 */
const parseMonsterSpeed = (speed: string | undefined): number => {
  const match = speed ? speed.match(/\d+/) : null;
  return match ? Number(match[0]) : 30;
};

/**
 * Crea un combatiente nuevo a partir de un monstruo de la biblioteca.
 */
export const monsterToCombatant = (
  monster: Monster,
  initiative: number
): Omit<Combatant, 'id'> => {
  return {
    name: monster.name,
    initiative,
    hp: monster.hitPoints,
    maxHp: monster.hitPoints,
    tempHp: 0,
    armorClass: monster.armorClass,
    type: 'monster',
    isActive: true,
    statusEffects: [],
    monsterId: monster.id,
    xpReward: crToXp(monster.challengeRating),
    isDead: false,
    speed: parseMonsterSpeed(monster.speed),
  };
};

/**
 * Crea un combatiente nuevo a partir de un jugador.
 */
export const playerToCombatant = (
  player: Pick<Player, 'id' | 'name' | 'hp' | 'maxHp' | 'armorClass'> &
    Partial<Pick<Player, 'proficiencyBonus' | 'stats' | 'weaponIds' | 'cantrips' | 'spells' | 'class' | 'feats'>>,
  initiative: number
): Omit<Combatant, 'id'> => {
  return {
    name: player.name,
    initiative,
    hp: player.hp,
    maxHp: player.maxHp,
    tempHp: 0,
    armorClass: player.armorClass,
    type: 'player',
    isActive: true,
    statusEffects: [],
    playerId: player.id,
    playerStats: player.stats,
    playerProficiencyBonus: player.proficiencyBonus,
    weaponIds: player.weaponIds,
    playerCantrips: player.cantrips,
    playerSpells: player.spells,
    playerSaves: classSaves(player.class),
    playerFeats: player.feats,
    isDead: false,
    speed: 30,
  };
};

/**
 * Barra de vida normalizada 0-1.
 */
export const hpRatio = (combatant: Combatant): number => {
  const effectiveMax = combatant.maxHp + combatant.tempHp;
  if (effectiveMax <= 0) return 0;
  return Math.max(0, Math.min(1, (combatant.hp + combatant.tempHp) / effectiveMax));
};

/**
 * Color de la barra de vida según el porcentaje de HP.
 */
export const hpColorClass = (ratio: number): string => {
  if (ratio > 0.6) return 'bg-green-600';
  if (ratio > 0.3) return 'bg-yellow-500';
  return 'bg-red-600';
};

/**
 * Color de la barra de PG según el porcentaje de vida (verde >70%, amarillo 70%-25%, rojo <25%).
 */
export const hpBarColorClass = (ratio: number): string => {
  if (ratio > 0.7) return 'bg-green-500';
  if (ratio > 0.25) return 'bg-yellow-500';
  return 'bg-red-600';
};

/**
 * Descripción de la condición de vida del combatiente.
 */
export const hpStatus = (combatant: Combatant): string => {
  const { hp, tempHp, isDead } = combatant;
  if (isDead) return 'Muerto';
  if (hp === 0 && tempHp > 0) return 'Requiere rescate';
  const ratio = hpRatio(combatant);
  if (ratio > 0.6) return 'Sano';
  if (ratio > 0.3) return 'Herido';
  return 'Al borde de la muerte';
};