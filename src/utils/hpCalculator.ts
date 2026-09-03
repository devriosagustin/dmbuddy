// ============================================================
// Cálculo de PG máximos "de libro" al subir de nivel.
// Nivel 1 = dado de golpe máximo + mod. Constitución.
// Niveles siguientes = valor fijo del dado (promedio redondeado
// arriba, sin tiradas) + mod. Constitución, mínimo 1 por nivel.
// Suma la dote Robusto (Tough: +2 PG por nivel, incluidos los ya
// obtenidos) si el personaje la tiene.
// ============================================================

import { SRD_CLASSES, SRD_FEATS } from '../data/srd2024';
import { abilityModifier } from './diceUtils';

/** Dado de golpe (lados) de una clase por su nombre en español. d8 si no se reconoce. */
const hitDieSides = (className: string): number => {
  const entry = SRD_CLASSES.find((c) => c.title === className);
  const sides = parseInt((entry?.hitDice ?? 'd8').replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(sides) && sides > 0 ? sides : 8;
};

/** Título curado de la dote Robusto (feats guarda títulos, no ids). */
const TOUGH_FEAT_TITLE = SRD_FEATS.find((f) => f.id === 'feat-tough')?.title ?? 'Robusto';

/** ¿El personaje tiene la dote Robusto (Tough)? */
export const hasToughFeat = (feats: string[] | undefined): boolean =>
  (feats ?? []).includes(TOUGH_FEAT_TITLE);

/**
 * PG máximos "de libro" para una clase/nivel/Constitución dados, con el
 * método del valor fijo (sin tiradas): determinista, para no tener que
 * llevar registro de tiradas de dado de golpe por nivel.
 */
export const bookMaxHp = (
  className: string,
  level: number,
  conScore: number,
  feats?: string[]
): number => {
  const sides = hitDieSides(className);
  const conMod = abilityModifier(conScore);
  const avgPerLevel = Math.floor(sides / 2) + 1;
  const level1 = Math.max(1, sides + conMod);
  const perLevel = Math.max(1, avgPerLevel + conMod);
  const base = level1 + Math.max(0, level - 1) * perLevel;
  const toughBonus = hasToughFeat(feats) ? 2 * level : 0;
  return base + toughBonus;
};
