// ============================================================
// Tipos del SRD 5.2 (reglas 2024) - CC-BY-4.0
// Modelo de datos para la Biblioteca de Referencia DM
// ============================================================

import type { MonsterAction, MonsterTrait, Spellcasting, StatAbbrev } from './index';

/** Origen del contenido: SRD 5.2 (2024), SRD 5.1 (2014) o contenido propio. */
export type SrdSource = 'srd2024' | 'srd51' | 'homebrew';

/** Colecciones disponibles en la biblioteca de referencia. */
export type SrdCategoryId =
  | 'rules'
  | 'conditions'
  | 'spells'
  | 'monsters'
  | 'classes'
  | 'species'
  | 'feats';

/** Escuelas de magia oficiales (2024). */
export type SpellSchool =
  | 'Abjuración'
  | 'Conjuración'
  | 'Adivinación'
  | 'Encantamiento'
  | 'Evocación'
  | 'Ilusión'
  | 'Nigromancia'
  | 'Transmutación';

/** Base común de cualquier entrada del SRD. */
export interface SrdBase {
  id: string;
  title: string;
  category: SrdCategoryId;
  source: SrdSource;
  /** Etiquetas extra (p. ej. "Guerra", "A distancia", "SD5.1") para el sistema de tags. */
  tags: string[];
}

/**
 * Entrada documental genérica (reglas, condiciones, clases, especies y dotes
 * comparten esta forma: título + cuerpo en Markdown).
 */
export interface SrdDocEntry extends SrdBase {
  /** Capítulo funcional, solo para reglas (p. ej. "Acciones en combate"). */
  chapter?: string;
  /** Resumen corto para tarjetas y buscador. */
  summary?: string;
  /** Cuerpo de la regla en Markdown. */
  content: string;
}

/** Regla básica (capítulo de reglas). */
export interface SrdRuleEntry extends SrdDocEntry {
  category: 'rules';
}

/** Estado / condición. */
export interface SrdConditionEntry extends SrdDocEntry {
  category: 'conditions';
}

/** Conjuro filtrable por nivel, escuela y clase. */
export interface SrdSpellEntry extends SrdBase {
  category: 'spells';
  level: number; // 0 = truco
  school: SpellSchool;
  castingTime: string;
  range: string;
  components: string; // p. ej. "V, S, M"
  material?: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  /** Clases oficiales que pueden lanzarlo en 2024. */
  classes: string[];
  /** Tirada de daño para el dado rápido (p. ej. "2d6"). */
  damageRolls?: string;
  /** Detalle de lanzamiento a niveles superiores. */
  upcastInfo?: string;
  /** Descripción del efecto en Markdown. */
  content: string;
}

/** Clase de personaje de 2024. */
export interface SrdClassEntry extends SrdBase {
  category: 'classes';
  primaryAbility: string;
  hitDice: string;
  armorProficiency: string;
  saves: string[];
  content: string;
}

/** Especie (antes "raza") de 2024. */
export interface SrdSpeciesEntry extends SrdBase {
  category: 'species';
  size: string;
  speed: number;
  traits: string[];
  /** Bonos de estadística que otorga la especie (según las reglas). */
  statBonus?: SpeciesStatBonusOption[];
  content: string;
}

/**
 * Una posible asignación de bonos raciales a características.
 * P. ej. Enano: `{ con: 2, str: 1 }` ("CON +2 · FUE +1").
 */
export interface SpeciesStatBonusOption {
  stats: Partial<Record<StatAbbrev, number>>;
  label: string;
}

/** Dote de 2024 (de origen o general). */
export interface SrdFeatEntry extends SrdBase {
  category: 'feats';
  prerequisite?: string;
  /** 'origin' = dote de origen; 'general' = dote general. */
  type: 'origin' | 'general';
  content: string;
}

/** Bloque de estadísticas de monstruo compatible con las reglas 2024. */
export interface SrdMonsterEntry extends SrdBase {
  category: 'monsters';
  size: string;
  creatureType: string;
  alignment: string;
  armorClass: number;
  hitPoints: number;
  hitDice: string;
  speed: string;
  stats: Record<StatAbbrev, number>;
  skills?: Record<string, number>;
  senses?: string;
  languages?: string;
  challengeRating: number;
  traits: MonsterTrait[];
  actions: MonsterAction[];
  legendaryActions?: MonsterAction[];
  /** Lanzamiento de conjuros (libro de conjuros referenciado por títulos del SRD). */
  spellcasting?: Spellcasting;
}

/** Unión de todos los tipos de registro del SRD. */
export type SrdRecord =
  | SrdRuleEntry
  | SrdConditionEntry
  | SrdSpellEntry
  | SrdClassEntry
  | SrdSpeciesEntry
  | SrdFeatEntry
  | SrdMonsterEntry;

/** Conjunto completo de colecciones del SRD (bundle). */
export interface SrdBundle {
  rules: SrdRuleEntry[];
  conditions: SrdConditionEntry[];
  spells: SrdSpellEntry[];
  monsters: SrdMonsterEntry[];
  classes: SrdClassEntry[];
  species: SrdSpeciesEntry[];
  feats: SrdFeatEntry[];
}

/** Etiquetas y descripciones de las colecciones. */
export const SRD_CATEGORIES: Record<SrdCategoryId, { label: string; plural: string }> = {
  rules: { label: 'Reglas', plural: 'Reglas básicas' },
  conditions: { label: 'Estados', plural: 'Condiciones' },
  spells: { label: 'Conjuros', plural: 'Conjuros' },
  monsters: { label: 'Bestiario', plural: 'Bestiario 2024' },
  classes: { label: 'Clases', plural: 'Clases' },
  species: { label: 'Especies', plural: 'Especies' },
  feats: { label: 'Dotes', plural: 'Dotes' },
};

/** Metadatos de cada fuente de contenido. */
export const SRD_SOURCES: Record<SrdSource, { label: string; short: string; notice: string }> = {
  srd2024: {
    label: 'SRD 5.2 (2024)',
    short: '2024',
    notice:
      'Contenido bajo licencia Creative Commons Attribution 4.0 International (CC-BY-4.0), tal como se publica en el System Reference Document 5.2 de Wizards of the Coast.',
  },
  srd51: {
    label: 'SRD 5.1 (2014)',
    short: '5.1',
    notice: 'Contenido heredado de la edición 2014, mantenido por compatibilidad.',
  },
  homebrew: {
    label: 'Contenido propio',
    short: 'HB',
    notice: 'Material creado por el Dungeon Master.',
  },
};

/**
 * Aviso de atribución obligatorio por la licencia CC-BY-4.0 del SRD 5.2.
 * Debe mostrarse de forma persistente en el pie de página.
 */
export const CC_BY_4_0_NOTICE = `Este proyecto usa contenido del System Reference Document 5.2 ("SRD 5.2"), publicado por Wizards of the Coast bajo la licencia Creative Commons Attribution 4.0 International (CC-BY-4.0). Visita https://www.dndbeyond.com/srd para más información y las versiones originales.`;

/** Elemento plano para indexar la búsqueda rápida. */
export interface SrdSearchItem {
  id: string;
  title: string;
  category: SrdCategoryId;
  source: SrdSource;
  tags: string[];
  /** Texto normalizado con todo lo buscable (sin acentos). */
  keywords: string;
}

/** Resultado de la búsqueda con su puntuación. */
export interface SrdSearchResult {
  item: SrdSearchItem;
  score: number;
}

/** Colección keyed de un overlay remoto para fusionar. */
export type SrdOverlay = Partial<SrdBundle>;