// ============================================================
// Calculadora de daño para ataques de monstruos
// ============================================================

import type { Monster, MonsterAction } from '../types';
import { abilityModifier } from './diceUtils';

export interface DamageRollResult {
  action: MonsterAction;
  damageRolls: string[];
  totalDamage: number;
  hit: boolean;
  d20Roll: number;
  attackBonus: number;
  attackTotal: number;
  targetAC: number;
}

/**
 * Realiza una tirada de ataque de una acción contra una CA objetivo.
 * Devuelve si impacta, la tirada del d20, el total comparado contra la CA
 * y el desglose del daño.
 */
export const rollAttackAgainst = (action: MonsterAction, targetAC: number): DamageRollResult => {
  const d20 = Math.floor(Math.random() * 20) + 1;
  const attackBonus = action.attackBonus ?? 0;
  const attackTotal = d20 + attackBonus;
  const hit = d20 === 20 || attackTotal >= targetAC;

  const damageRolls: string[] = [];
  let totalDamage = 0;
  if (hit && action.damage) {
    // Puede haber varias expresiones de daño separadas por coma
    const formulas = action.damage.split(',').map((f) => f.trim());
    for (const formula of formulas) {
      const parsed = formula.match(/(\d*)d(\d+)([+-]\d+)?/);
      if (!parsed) continue;
      const count = parsed[1] === '' ? 1 : parseInt(parsed[1], 10);
      const sides = parseInt(parsed[2], 10);
      const mod = parsed[3] ? parseInt(parsed[3], 10) : 0;

      let total = 0;
      const rolls: number[] = [];
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        total += r;
      }
      total += mod;
      totalDamage += Math.max(0, total);
      damageRolls.push(`${rolls.join('+')}${mod !== 0 ? `${mod > 0 ? '+' : '-'}${Math.abs(mod)}` : ''} = ${total}`);
    }
  }

  return { action, damageRolls, totalDamage, hit, d20Roll: d20, attackBonus, attackTotal, targetAC };
};

/**
 * Calcula un daño promedio con un número arbitrario de repeticiones
 * (útil para determinar encuentros balanceados).
 */
export const calculateAverageDamage = (monster: Monster): number => {
  let total = 0;
  const action = monster.actions[0];
  if (!action?.damage) return 0;

  const parsed = action.damage.match(/(\d*)d(\d+)([+-]\d+)?/);
  if (!parsed) return 0;
  const count = parsed[1] === '' ? 1 : parseInt(parsed[1], 10);
  const sides = parseInt(parsed[2], 10);
  const mod = parsed[3] ? parseInt(parsed[3], 10) : 0;

  // Promedio de un dado dN es (N+1)/2
  total = count * (sides + 1) / 2 + mod;
  return total;
};

/**
 * Estima el nivel de dificultad de un encuentro sumando los CR y XP.
 */
export const estimateEncounterDifficulty = (xpTotal: number, partyLevel: number, partySize: number): 'Fácil' | 'Medio' | 'Difícil' | 'Mortal' => {
  if (partySize === 0) return 'Fácil';
  // Umbrales aproximados por adventurer level (DMG)
  const perCharacter = xpTotal / partySize;
  const medium = 0.5 * partyLevel * 25;
  const hard = 0.75 * partyLevel * 25;
  const deadly = 1.0 * partyLevel * 50;

  if (perCharacter >= deadly) return 'Mortal';
  if (perCharacter >= hard) return 'Difícil';
  if (perCharacter >= medium) return 'Medio';
  return 'Fácil';
};

/**
 * Bonus de competencia según nivel (simplificado 5e).
 */
export const proficiencyAtLevel = (level: number): number => Math.floor((level + 7) / 4);

/**
 * CA de un monstruo a partir de sus estadísticas (aproximada).
 */
export const suggestedAC = (monster: Monster): number => 10 + abilityModifier(monster.stats.dex) + (monster.size === 'Grande' || monster.size === 'Enorme' ? 1 : 0);