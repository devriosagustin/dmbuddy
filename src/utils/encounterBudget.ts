// ============================================================
// Presupuesto de XP para construir encuentros de combate.
// Reglas oficiales SRD 2024 ("Combat Encounters" / "Construcción de
// encuentros"): a diferencia de ediciones anteriores, NO hay
// multiplicador por cantidad de monstruos — se suma el XP de cada
// criatura directo contra el presupuesto del grupo.
// ============================================================

/** Presupuesto de XP por personaje para cada dificultad, a un nivel dado. */
export interface XpBudgetRow {
  low: number;
  moderate: number;
  high: number;
}

/**
 * Tabla "XP Budget per Character" del SRD 2024 (pág. 201). Índice 0 =
 * nivel 1. Valores en XP por personaje.
 */
const XP_BUDGET_PER_CHARACTER: readonly XpBudgetRow[] = [
  { low: 50, moderate: 75, high: 100 }, // nivel 1
  { low: 100, moderate: 150, high: 200 }, // nivel 2
  { low: 150, moderate: 225, high: 400 }, // nivel 3
  { low: 250, moderate: 375, high: 500 }, // nivel 4
  { low: 500, moderate: 750, high: 1100 }, // nivel 5
  { low: 600, moderate: 1000, high: 1400 }, // nivel 6
  { low: 750, moderate: 1300, high: 1700 }, // nivel 7
  { low: 1000, moderate: 1700, high: 2100 }, // nivel 8
  { low: 1300, moderate: 2000, high: 2600 }, // nivel 9
  { low: 1600, moderate: 2300, high: 3100 }, // nivel 10
  { low: 1900, moderate: 2900, high: 4100 }, // nivel 11
  { low: 2200, moderate: 3700, high: 4700 }, // nivel 12
  { low: 2600, moderate: 4200, high: 5400 }, // nivel 13
  { low: 2900, moderate: 4900, high: 6200 }, // nivel 14
  { low: 3300, moderate: 5400, high: 7800 }, // nivel 15
  { low: 3800, moderate: 6100, high: 9800 }, // nivel 16
  { low: 4500, moderate: 7200, high: 11700 }, // nivel 17
  { low: 5000, moderate: 8700, high: 14200 }, // nivel 18
  { low: 5500, moderate: 10700, high: 17200 }, // nivel 19
  { low: 6400, moderate: 13200, high: 22000 }, // nivel 20
];

/** Presupuesto de XP (Baja/Moderada/Alta) de UN personaje según su nivel (1-20). */
export const xpBudgetPerCharacter = (level: number): XpBudgetRow => {
  const idx = Math.min(Math.max(Math.round(level), 1), 20) - 1;
  return XP_BUDGET_PER_CHARACTER[idx];
};

/**
 * Presupuesto de XP del grupo: suma del presupuesto individual de cada
 * personaje (equivale a "multiplicar por la cantidad de personajes" cuando
 * todos comparten nivel, pero también sirve con niveles mixtos).
 */
export const partyXpBudget = (levels: number[]): XpBudgetRow =>
  levels.reduce<XpBudgetRow>(
    (acc, level) => {
      const row = xpBudgetPerCharacter(level);
      return { low: acc.low + row.low, moderate: acc.moderate + row.moderate, high: acc.high + row.high };
    },
    { low: 0, moderate: 0, high: 0 }
  );

/**
 * Las reglas 2024 solo definen tres niveles de dificultad. "extrema" es una
 * etiqueta propia de la app (no del libro) para cuando el XP de monstruos
 * supera incluso el presupuesto de dificultad Alta.
 */
export type EncounterDifficulty = 'baja' | 'moderada' | 'alta' | 'extrema';

export const ENCOUNTER_DIFFICULTY_LABELS: Record<EncounterDifficulty, string> = {
  baja: 'Baja',
  moderada: 'Moderada',
  alta: 'Alta',
  extrema: 'Por encima de Alta',
};

/**
 * Clasifica un encuentro comparando el XP total de los monstruos contra el
 * presupuesto del grupo: se toma la dificultad más baja cuyo presupuesto
 * cubre ese total sin pasarse (regla del libro: "spend as much of your XP
 * budget as you can without going over").
 */
export const classifyEncounterDifficulty = (
  monsterXp: number,
  budget: XpBudgetRow
): EncounterDifficulty => {
  if (monsterXp <= budget.low) return 'baja';
  if (monsterXp <= budget.moderate) return 'moderada';
  if (monsterXp <= budget.high) return 'alta';
  return 'extrema';
};
