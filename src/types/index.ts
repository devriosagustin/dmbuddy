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
  type: 'player' | 'monster' | 'npc';
  isActive: boolean;
  statusEffects: StatusEffect[];
  monsterId?: string; // Si es un monstruo de la biblioteca
  playerId?: string; // Si es un jugador
  npcId?: string; // Si es un NPC de la sección NPC
  /** Rol del NPC (rehén secuestrado o ayudante del party), si es un NPC. */
  npcRole?: NpcRole;
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
  /** Habilidades con competencia del personaje (nombres del SRD) llevadas al combate. */
  playerSkills?: string[];
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

/** Rol de un NPC: rehén secuestrado, aliado del party, neutral o enemigo. */
export type NpcRole = 'hostage' | 'ally' | 'neutral' | 'enemy';

/** Personaje no jugador: puede entrar en combate como rehén o aliado. */
export interface Npc {
  id: string;
  name: string;
  role: NpcRole;
  hp: number;
  maxHp: number;
  armorClass: number;
  speed?: number;
  notes?: string;
}

export interface CombatLogEntry {
  id: string;
  timestamp: Date;
  type: 'initiative' | 'damage' | 'heal' | 'status' | 'death' | 'custom' | 'xp' | 'move' | 'chat';
  message: string;
  combatantId?: string;
  details?: unknown;
}

/**
 * Mensaje de chat/lore de sesión. El DM puede hablar como Narrador (dm),
 * como NPC o como monstruo del combate. Texto plano, listo para un futuro
 * lector de voz (TTS).
 */
export interface ChatMessage {
  id: string;
  timestamp: number;
  /** Quién emite el mensaje: "DM (Narrador)" o el nombre del personaje. */
  author: string;
  kind: 'dm' | 'npc' | 'monster';
  text: string;
  /** Combatiente asociado (NPC o monstruo), si aplica. */
  combatantId?: string;
}

/**
 * Reparto de XP de un combate finalizado hacia un personaje del party.
 * Se sincroniza a la party para que cada jugador aplique su parte.
 */
export interface XpAward {
  /** Id del personaje en el party (coincide entre el DM y el jugador). */
  playerId: string;
  name: string;
  /** XP que recibe este personaje en el reparto. */
  xp: number;
  /** true si la XP acumulada cruza el umbral del siguiente nivel. */
  leveledUp: boolean;
  /** Nivel final del personaje tras el reparto. */
  level: number;
}

/**
 * Criatura persistente en el mapa actual (monstruo, NPC o personaje del
 * party). A diferencia de un Combatant, vive fuera del combate: el DM la
 * coloca mientras explora y solo entra en "combate" cuando se inicia un
 * encuentro. Los personajes del party no se guardan en los layouts.
 */
export interface MapCreature {
  id: string;
  name: string;
  kind: 'monster' | 'npc' | 'player';
  /** Id del registro en su catálogo (monster.id / npc.id / player.id). */
  refId?: string;
  /** Posición en la cuadrícula del mapa. */
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  tempHp: number;
  armorClass: number;
  speed: number;
  /** Vínculo con un personaje del party (kind === 'player'). */
  playerId?: string;
  /** Rol del NPC (hostage/ally/neutral/enemy). */
  npcRole?: 'hostage' | 'ally' | 'neutral' | 'enemy';
  /** XP que otorga al ser derrotado (monstruos). */
  xpReward?: number;
  statusEffects: StatusEffect[];
  isDead: boolean;
}

/**
 * Encuentro en curso dentro del mapa. Cuando es null, el mapa está en modo
 * exploración. Al finalizar el encuentro vuelve a null y las criaturas
 * sobrevivientes conservan su PG en el mapa.
 */
export interface EncounterState {
  id: string;
  round: number;
  turn: number;
  participants: Combatant[];
  combatLog: CombatLogEntry[];
  encounterCount: number;
  /** Reparto de XP del último encuentro finalizado (sincronizado a la party). */
  xpAwards?: XpAward[];
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
  /** Personajes/jugadores persistentes colocados en el mapa (modo exploración). */
  mapCreatures: MapCreature[];
  /** Tiles en el mapa: muros, trampas, tesoros, investigación. */
  tiles: MapTile[];
  /** Claves "x-y" de tiles revelados a la party (trampa/tesoro/investigación). */
  revealedTileKeys: string[];
  /** Ids de enemigos cuya vida se muestra a la party. */
  revealedEnemyIds: string[];
  /** Radio de visión de la cortina de guerra (pies). */
  visionRange: number;
  /** Columnas de la cuadrícula del mapa (resolución controlada por el DM). */
  mapCols: number;
  /** Filas de la cuadrícula del mapa (resolución controlada por el DM). */
  mapRows: number;
  /** Mensajes de chat/lore de la sesión (sincronizados a la party). */
  chat: ChatMessage[];
  /** Reparto de XP del último combate finalizado (sincronizado a la party). */
  xpAwards: XpAward[];
}

export type TileType = 'wall' | 'door' | 'trap' | 'treasure' | 'investigation';

export interface MapTile {
  x: number;
  y: number;
  type: TileType;
  /** Solo para "door": true = abierta (no bloquea), false/undefined = cerrada. */
  open?: boolean;
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