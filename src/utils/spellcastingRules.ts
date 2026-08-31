// ============================================================
// Reglas de conjuración SRD 5.2 (2024) aplicadas a la creación
// de personajes: trucos, conjuros preparados/conocidos, nivel
// máximo de espacio y cantidad de espacios por clase y nivel.
// (Índice = nivel − 1)
// ============================================================

import { srdFeatByTitle } from '../data/srd2024';

// Tabla unificada de espacios de conjuro 2024 (PHB, p. 63). Cada fila son
// los espacios por nivel de conjuro 1..9 en el nivel de conjurador dado.
// Los conjuradores completos (Bardo, Clérigo, Druida, Hechicero, Mago) la
// usan directamente; los medio conjuradores (Paladín, Guardabosques) con su
// nivel de conjurador = mitad de nivel (redondeo arriba); Brujo usa Pact Magic.
const SPACE_COUNTS: number[][] = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // 20
];

/** Clases que usan la tabla de conjurador completo (2024). */
const FULL_SLOT_CLASSES = ['Bardo', 'Clérigo', 'Druida', 'Hechicero', 'Mago'];

/** Clases medio conjuradoras (2024: lanzan desde nivel 1, tope 5º). */
const HALF_SLOT_CLASSES = ['Paladín', 'Guardabosques'];

/** Progresión de espacios de conjuro de una clase (2024). */
export type SlotProgression = 'full' | 'half' | 'pact' | 'none';

const ZERO20 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

/** Trucos conocidos (cantrip count) por nivel, por clase (2024). */
const CANTRIPS: Record<string, number[]> = {
  Bardo: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  Clérigo: [3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Druida: [2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  Hechicero: [4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
  Brujo: [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  Mago: [3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Paladín: ZERO20,
  Guardabosques: ZERO20,
};

/**
 * Conjuros por nivel (2024): preparados para Clérigo, Druida, Hechicero y
 * Bardo; aprendidos para Brujo; tamaño del grimorio para Mago; preparados
 * para Paladín y Guardabosques.
 */
const SPELLS: Record<string, number[]> = {
  Bardo: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  Clérigo: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  Druida: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  Hechicero: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
  Brujo: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
  Mago: [4, 5, 6, 7, 9, 10, 11, 12, 14, 14, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
  Paladín: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
  Guardabosques: [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
};

/** Nivel máximo de espacio de conjuro lanzable según nivel y clase (2024). */
const MAX_SLOT: Record<string, number[]> = {
  Bardo: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Clérigo: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Druida: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Hechicero: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Mago: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Brujo: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  Paladín: [1, 1, 1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
  Guardabosques: [1, 1, 1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
};

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

export interface SpellcastingLimits {
  /** La clase lanza conjuros de esta manera en el SRD 5.2. */
  isCaster: boolean;
  /** Trucos conocidos en el nivel dado (0 si no los tiene). */
  cantrips: number;
  /** Conjuros preparados, conocidos o de grimorio en el nivel dado. */
  spells: number;
  /** Nivel máximo de espacio de conjuro lanzable (0 = no lanza). */
  maxSlotLevel: number;
}

/** Clases de 2024 que lanzan conjuros (con o sin trucos). */
export const SPELLCASTING_CLASSES_2024 = Object.keys(SPELLS);

/** Límites de conjuración de una clase en un nivel concreto (1-20). */
export const spellcastingLimits = (className: string, level: number): SpellcastingLimits => {
  const i = clamp(Math.floor(level) - 1, 0, 19);
  const cantrips = CANTRIPS[className]?.[i] ?? 0;
  const spells = SPELLS[className]?.[i] ?? 0;
  const maxSlotLevel = MAX_SLOT[className]?.[i] ?? 0;
  return { isCaster: spells > 0 || maxSlotLevel > 0, cantrips, spells, maxSlotLevel };
};

// ------------------------------------------------------------
// Bonos por dotes/rasgos a la cuota de trucos y conjuros
// ------------------------------------------------------------

/** Bonus a la cuota de conjuros que otorga una dote o rasgo. */
export interface FeatSpellBoosts {
  /** Trucos adicionales que el personaje puede conocer. */
  cantrips: number;
  /** Conjuros adicionales que el personaje puede conocer/preparar. */
  spells: number;
  /** Nivel de conjuro mínimo que la dote habilita (1 si concede conjuro). */
  minSpellLevel: number;
}

const ZERO_BOOST: FeatSpellBoosts = { cantrips: 0, spells: 0, minSpellLevel: 0 };

/**
 * Suma los bonos a la cuota de trucos/conjuros declarados en las dotes o
 * rasgos indicados (leídos de los metadatos `spellBoosts` del SRD). Sirve
 * para casos como "Iniciado en magia", que el usuario no puede ajustar a mano.
 */
export const featSpellBoosts = (titles: string[]): FeatSpellBoosts => {
  let cantrips = 0;
  let spells = 0;
  let minSpellLevel = 0;
  for (const title of titles) {
    const entry = srdFeatByTitle(title);
    const b = entry?.spellBoosts;
    if (!b) continue;
    cantrips += b.cantrips ?? 0;
    spells += b.spells ?? 0;
    minSpellLevel = Math.max(minSpellLevel, b.minSpellLevel ?? 0);
  }
  if (cantrips === 0 && spells === 0 && minSpellLevel === 0) return ZERO_BOOST;
  return { cantrips, spells, minSpellLevel };
};

// ------------------------------------------------------------
// Espacios de conjuro (Spell Slots) 2024
// ------------------------------------------------------------

/** Espacios de Pacto Mágico del Brujo: todos del mismo nivel y pocos. */
const PACTS = (level: number): number[] => {
  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const slotLevel = Math.min(5, Math.ceil(clamp(Math.floor(level), 1, 20) / 2));
  const n = level === 1 ? 1 : level <= 10 ? 2 : level <= 16 ? 3 : 4;
  counts[slotLevel - 1] = n;
  return counts;
};

/** Progresión de espacios de conjuro de una clase (2024). */
export const slotProgressionOf = (className: string): SlotProgression => {
  if (FULL_SLOT_CLASSES.includes(className)) return 'full';
  if (className === 'Brujo') return 'pact';
  if (HALF_SLOT_CLASSES.includes(className)) return 'half';
  return 'none';
};

/**
 * Cantidad máxima de espacios de conjuro por nivel (índice 0 = nivel 1).
 * Conjuradores completos: tabla unificada. Medio conjuradores 2024: mitad de
 * nivel redondeada arriba (tope 5º). Brujo: Pacto Mágico.
 */
export const spellSlotsMax = (className: string, level: number): number[] => {
  const i = clamp(Math.floor(level) - 1, 0, 19);
  const progression = slotProgressionOf(className);
  if (progression === 'full') return [...SPACE_COUNTS[i]];
  if (progression === 'half') return [...SPACE_COUNTS[Math.ceil((i + 1) / 2) - 1].slice(0, 5), 0, 0, 0, 0];
  if (progression === 'pact') return PACTS(i + 1);
  return [0, 0, 0, 0, 0, 0, 0, 0, 0];
};

/** Limita los espacios usados al máximo de cada nivel (no puede superarlos). */
export const clampUsedToMax = (used: number[], max: number[]): number[] => {
  const next = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 9; i++) {
    next[i] = clamp(Math.round(used[i] ?? 0), 0, max[i] ?? 0);
  }
  return next;
};

/**
 * Espacios usados tras un descanso corto:
 *  - Brujo (Pacto Mágico): todos los espacios vuelven al completo.
 *  - El resto: se recupera 1 espacio del nivel más alto gastado (máx. 1);
 *    así se simula la Recuperación Arcana del mago por descanso (2024).
 *  - Clases sin conjuros: sin cambios.
 */
export const shortRestUsed = (used: number[], progression: SlotProgression): number[] => {
  if (progression === 'none') return [...used];
  if (progression === 'pact') return [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const next = [...used];
  for (let i = 8; i >= 0; i--) {
    if (next[i] > 0) {
      next[i] -= 1;
      break;
    }
  }
  return next;
};

/** Espacios usados tras un descanso largo: todos recuperados. */
export const longRestUsed = (): number[] => [0, 0, 0, 0, 0, 0, 0, 0, 0];