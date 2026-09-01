// ============================================================
// Tipos y modelos de datos de DM Copilot Web
// ============================================================

export interface StatusEffect {
  id: string;
  name: string;
  duration: number; // en rondas, -1 es permanente
  description: string;
  icon: string;
  applyEffect?: (combatant: Combatant) => Combatant;
  removeEffect?: (combatant: Combatant) => Combatant;
}

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  tempHp: number;
  armorClass: number;
  type: 'player' | 'monster';
  isActive: boolean;
  statusEffects: StatusEffect[];
  monsterId?: string; // Si es un monstruo de la biblioteca
  playerId?: string; // Si es un jugador
  /** XP que otorga este monstruo al ser derrotado (según su CR). */
  xpReward?: number;
  isDead: boolean;
  /** Características del personaje (jugadores añadidos desde el party). */
  playerStats?: PlayerStats;
  /** Bonificador de competencia del personaje en el momento de entrar. */
  playerProficiencyBonus?: number;
  /** Armas equipadas del personaje (ids del SRD 5.2). */
  weaponIds?: string[];
  /** Trucos del personaje llevados al combate para consultar su detalle. */
  playerCantrips?: Spell[];
  /** Conjuros del personaje llevados al combate para consultar su detalle. */
  playerSpells?: Spell[];
  /** Salvaciones en las que el personaje es competente (según su clase). */
  playerSaves?: StatAbbrev[];
  /** Dotes del personaje (títulos del SRD) llevadas al combate para su consulta. */
  playerFeats?: string[];
  /** Velocidad del combatiente en pies por turno (usada para el resaltado de movimiento). */
  speed?: number;
  /** Posición en el mapa de combate (casilla columna/fila, opcional). */
  x?: number;
  /** Posición en el mapa de combate (casilla columna/fila, opcional). */
  y?: number;
}

export interface MonsterTrait {
  name: string;
  description: string;
}

export interface MonsterAction {
  name: string;
  description: string;
  attackBonus?: number;
  damage?: string;
  damageType?: string;
  range?: string;
  target?: string;
}

export interface Spellcasting {
  ability: 'INT' | 'WIS' | 'CHA';
  level: number;
  spellSaveDC: number;
  spellAttackBonus: number;
  spellbook: Record<string, string[]>;
  description?: string;
}

export interface Monster {
  id: string;
  name: string;
  type: string;
  size: 'Pequeño' | 'Mediano' | 'Grande' | 'Enorme';
  alignment: string;
  armorClass: number;
  hitPoints: number;
  hitDice: string;
  speed: string;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  skills: Record<string, number>;
  senses: string;
  languages: string;
  challengeRating: number;
  traits: MonsterTrait[];
  actions: MonsterAction[];
  legendaryActions?: MonsterAction[];
  spellcasting?: Spellcasting;
  custom?: boolean; // Marca si fue creado por el usuario
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  concentration: boolean;
}

/** Las seis características de un personaje (2024). */
export interface PlayerStats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Player {
  id: string;
  name: string;
  level: number;
  class: string;
  race?: string;
  hp: number;
  maxHp: number;
  armorClass: number;
  proficiencyBonus: number;
  stats: PlayerStats;
  spells?: Spell[];
  /** Trucos conocidos (conjuros de nivel 0) seleccionados del SRD. */
  cantrips?: Spell[];
  /** Dotes escogidas del SRD 2024 (modificadores de reglas). */
  feats?: string[];
  /** Habilidades con competencia del personaje (nombres del SRD). */
  skills?: string[];
  /** Armas equipadas (ids del SRD 5.2). */
  weaponIds?: string[];
  /** Espacios de conjuro gastados por nivel (índice 0 = nivel 1). */
  spellSlotsUsed?: number[];
  /** Experiencia acumulada del personaje (PC). */
  xp?: number;
}

export interface CombatLogEntry {
  id: string;
  timestamp: Date;
  type: 'initiative' | 'damage' | 'heal' | 'status' | 'death' | 'custom' | 'xp' | 'move';
  message: string;
  combatantId?: string;
  details?: unknown;
}

export interface CombatState {
  id: string;
  round: number;
  turn: number;
  isActive: boolean;
  participants: Combatant[];
  combatLog: CombatLogEntry[];
  startTime: Date;
  encounterCount: number;
  /** Casillas del mapa que no se pueden atravesar y bloquean áreas/movimiento. */
  barriers: { x: number; y: number }[];
}

// --------- Lanzador de dados ---------

export interface DiceResult {
  formula: string;
  result: number;
  rolls: number[];
  modifier: number;
  advantage?: boolean;
  type?: string;
  timestamp: Date;
  breakdown: string;
}

// --------- Notas del Dungeon Master ---------

export type NoteCategory = 'Campaign' | 'Session' | 'NPCs' | 'Locations';

export interface Note {
  id: string;
  title: string;
  content: string; // contenido en Markdown
  category: NoteCategory;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
}

// --------- Encuentros ---------

export interface Encounter {
  id: string;
  name: string;
  monsterIds: string[];
  difficulty: 'Fácil' | 'Medio' | 'Difícil' | 'Mortal';
  createdAt: Date;
}

// --------- Utilidades de estatísticas ---------

export type StatAbbrev = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export const STAT_LABELS: Record<StatAbbrev, string> = {
  str: 'FUE',
  dex: 'DES',
  con: 'CON',
  int: 'INT',
  wis: 'SAB',
  cha: 'CAR',
};