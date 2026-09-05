// ============================================================
// Utilidades de combate de DM Copilot Web
// ============================================================

import type { Combatant, Monster, Npc, Player, StatAbbrev, MapCreature, PlayerStats, NpcRole } from '../types';
import { SRD_CLASSES } from '../data/srd2024';
import { crToXp } from '../data/srdMonsters';
import { abilityModifier } from './diceUtils';

// Salvaciones competentes de una clase (SRD) al abreviatura de estadística.
const SAVE_LABEL_TO_STAT: Record<string, StatAbbrev> = {
  FUE: 'str', DES: 'dex', CON: 'con', INT: 'int', SAB: 'wis', CAR: 'cha',
};

/**
 * Etiqueta corta del tipo de combatiente para UI.
 */
export const combatantTypeLabel = (type: Combatant['type']): string => {
  switch (type) {
    case 'player': return 'Jugador';
    case 'npc': return 'NPC';
    case 'monster': return 'Monstruo';
  }
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
 * Bono total de una tirada de salvación: modificador de característica más el
 * bono de competencia si el personaje es competente en esa salvación.
 */
export const savingThrowBonus = (
  stats: PlayerStats,
  ability: StatAbbrev,
  proficientSaves: StatAbbrev[] | undefined,
  proficiencyBonus: number
): number => {
  const mod = abilityModifier(stats[ability]);
  const prof = (proficientSaves ?? []).includes(ability) ? proficiencyBonus : 0;
  return mod + prof;
};

/**
 * Bono de tirada de salvación de un Personaje (party): mod de característica +
 * competencia si la clase del personaje es competente en esa salvación.
 */
export const playerSavingThrowBonus = (
  player: Pick<Player, 'stats' | 'proficiencyBonus' | 'class'>,
  ability: StatAbbrev
): number => savingThrowBonus(player.stats, ability, classSaves(player.class), player.proficiencyBonus);

/**
 * Bono de iniciativa de un personaje: solo el modificador de Destreza
 * (regla estándar de D&D).
 */
export const playerInitiativeBonus = (player: Pick<Player, 'stats'>): number =>
  abilityModifier(player.stats.dex);


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
    monsterType: monster.type,
    monsterSize: monster.size,
  };
};

/**
 * Crea un combatiente nuevo a partir de un NPC (rehén o aliado).
 */
export const npcToCombatant = (
  npc: Npc,
  initiative: number
): Omit<Combatant, 'id'> => {
  return {
    name: npc.name,
    initiative,
    hp: npc.hp,
    maxHp: npc.maxHp,
    tempHp: 0,
    armorClass: npc.armorClass,
    type: 'npc',
    isActive: true,
    statusEffects: [],
    npcId: npc.id,
    npcRole: npc.role,
    isDead: false,
    speed: npc.speed ?? 30,
  };
};

/**
 * Crea un combatiente nuevo a partir de un jugador.
 */
export const playerToCombatant = (
  player: Pick<Player, 'id' | 'name' | 'hp' | 'maxHp' | 'armorClass'> &
    Partial<Pick<Player, 'proficiencyBonus' | 'stats' | 'weaponIds' | 'cantrips' | 'spells' | 'class' | 'feats' | 'skills'>>,
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
    playerSkills: player.skills,
    playerClass: player.class,
    isDead: false,
    speed: 30,
  };
};

/**
 * Convierte una criatura persistente del mapa en un objeto compatible con el
 * renderizado de fichas de CombatMap (no lo añade a ningún encuentro).
 */
export const mapCreatureToCombatant = (c: MapCreature): Combatant => ({
  id: c.id,
  name: c.name,
  initiative: 0,
  hp: c.hp,
  maxHp: c.maxHp,
  tempHp: c.tempHp,
  armorClass: c.armorClass,
  type: c.kind === 'npc' ? 'npc' : 'monster',
  isActive: true,
  statusEffects: c.statusEffects,
  npcId: c.kind === 'npc' ? c.refId : undefined,
  npcRole: c.npcRole,
  xpReward: c.xpReward,
  isDead: c.isDead,
  speed: c.speed,
  x: c.x,
  y: c.y,
  monsterType: c.monsterType,
  monsterSize: c.monsterSize,
});

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

// ============================================================
// Aspecto de la ficha en el mapa: color por rol, ícono representativo
// (clase del PJ / tipo del monstruo), forma por tipo de combatiente y
// escala por tamaño de criatura. Funciones puras (sin acceso a stores) para
// que tanto CombatMap.tsx (DM) como PlayerCombatView.tsx (jugadores) las
// compartan y se vean siempre iguales.
// ============================================================

/** Ícono de clase por nombre (coincide con SRD_CLASSES[].name / Player.class). */
const CLASS_ICONS: Record<string, string> = {
  'Bárbaro': '🪓',
  'Bardo': '🎻',
  'Clérigo': '✝️',
  'Druida': '🌿',
  'Guerrero': '⚔️',
  'Monje': '🥋',
  'Paladín': '🛡️',
  'Guardabosques': '🏹',
  'Pícaro': '🗡️',
  'Hechicero': '⚡',
  'Brujo': '🌙',
  'Mago': '📖',
};

// Se evalúan en orden: los subtipos más específicos ("Humanoide (Goblinoide)")
// van antes que su categoría general ("Humanoide"), y el type es texto libre
// del SRD (con mayúsculas/paréntesis variables), así que se compara con
// substring case-insensitive en vez de una igualdad exacta.
const MONSTER_TYPE_ICONS: [RegExp, string][] = [
  [/no.?muert/i, '💀'],
  [/goblin/i, '👺'],
  [/orco|orc/i, '👹'],
  [/reptil/i, '🦎'],
  [/drag/i, '🐉'],
  [/humanoide/i, '🧑'],
  [/monstruosidad/i, '👾'],
  [/aberraci/i, '🐙'],
  [/celestial/i, '😇'],
  [/constructo/i, '🗿'],
  [/elemental/i, '🔥'],
  [/f[ée]érico|hada|fey/i, '🧚'],
  [/gigante/i, '🧌'],
  [/infernal|demonio|diablo|fiend/i, '😈'],
  [/limo|cieno|ooze|gelatin/i, '🫧'],
  [/planta/i, '🌿'],
  [/bestia|fiera|beast/i, '🐺'],
];

/** Escala visual relativa según el tamaño del monstruo (Mediano = 1). */
const MONSTER_SIZE_SCALE: Record<string, number> = {
  Pequeño: 0.8,
  Mediano: 1,
  Grande: 1.35,
  Enorme: 1.75,
};

/**
 * Ícono representativo de un monstruo o NPC (sin PJ) — usado tanto por las
 * fichas de combate como por la vista previa de criaturas guardadas en un
 * mapa (biblioteca de mapas), donde solo hay datos sueltos, no un Combatant
 * completo.
 */
export const creatureIcon = (
  kind: 'monster' | 'npc',
  opts?: { monsterType?: string; npcRole?: NpcRole }
): string => {
  if (kind === 'npc') return opts?.npcRole === 'hostage' ? '⛓️' : '🧑';
  const hit = opts?.monsterType ? MONSTER_TYPE_ICONS.find(([re]) => re.test(opts.monsterType!)) : undefined;
  return hit ? hit[1] : '👹';
};

/**
 * Ícono representativo de la ficha: la clase del personaje para un PJ, el
 * tipo de criatura (SRD) para un monstruo, o un ícono fijo para NPCs. Si no
 * hay dato suficiente (clase/tipo desconocidos, personajes homebrew, etc.)
 * cae a la inicial del nombre, como antes de este cambio.
 */
export const tokenIcon = (c: Combatant): string => {
  if (c.type === 'player') {
    return (c.playerClass && CLASS_ICONS[c.playerClass]) || c.name.charAt(0).toUpperCase();
  }
  return creatureIcon(c.type === 'npc' ? 'npc' : 'monster', { monsterType: c.monsterType, npcRole: c.npcRole });
};

/** Factor de escala del tamaño visual de la ficha (solo varía en monstruos con tamaño conocido). */
export const tokenSizeScale = (c: Combatant): number =>
  c.type === 'monster' && c.monsterSize ? MONSTER_SIZE_SCALE[c.monsterSize] ?? 1 : 1;

/**
 * Forma de la ficha según el tipo de combatiente: círculo para PJs (clásico
 * "héroe"), blob orgánico y asimétrico para monstruos, cuadrado suave para
 * NPCs — así se distingue el tipo incluso sin fijarse en el color.
 */
export const tokenShapeClass = (c: Combatant): string => {
  if (c.type === 'player') return 'rounded-full';
  if (c.type === 'npc') return 'rounded-xl';
  return 'rounded-[60%_40%_55%_45%/45%_55%_40%_60%]';
};

/** Color de borde/fondo/texto de la ficha según su tipo y (para NPCs) su rol. */
export const tokenColorClasses = (c: Combatant): string => {
  if (c.type === 'player') return 'border-emerald-400 bg-emerald-950/90 text-emerald-100';
  if (c.type === 'npc') {
    if (c.npcRole === 'ally') return 'border-sky-400 bg-sky-950/90 text-sky-100';
    if (c.npcRole === 'neutral') return 'border-stone-400 bg-stone-900/90 text-stone-200';
    if (c.npcRole === 'enemy') return 'border-orange-400 bg-orange-950/90 text-orange-100';
    return 'border-violet-400 bg-violet-950/90 text-violet-100';
  }
  return 'border-red-500 bg-red-950/90 text-red-100';
};
