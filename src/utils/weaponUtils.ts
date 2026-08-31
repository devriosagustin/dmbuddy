// ============================================================
// Utilidades de armas (SRD 5.2): cálculo de ataque y daño
// ============================================================

import type { PlayerStats } from '../types';
import type { SrdWeaponEntry } from '../data/srd2024';
import { abilityModifier } from './diceUtils';

/**
 * Habilidad de combate de un arma: Destreza para las armas a distancia
 * y las sutiles (finesse); Fuerza para el resto de cuerpo a cuerpo.
 */
export const weaponAbility = (weapon: SrdWeaponEntry): 'str' | 'dex' => {
  if (weapon.kind === 'ranged') return 'dex';
  if (weapon.properties.some((p) => p === 'Sutileza')) return 'dex';
  return 'str';
};

/** Modificador de la habilidad con la que ataca el arma. */
export const weaponAttackModifier = (weapon: SrdWeaponEntry, stats: PlayerStats): number =>
  abilityModifier(stats[weaponAbility(weapon)]);

/** Bonificador total de ataque (competencia + modificador de habilidad). */
export const weaponAttackBonus = (
  weapon: SrdWeaponEntry,
  stats: PlayerStats,
  proficiencyBonus: number
): number => proficiencyBonus + abilityModifier(stats[weaponAbility(weapon)]);

/**
 * Modificador de daño del arma: las armas de cuerpo a cuerpo suman el
 * modificador de habilidad; las armas a distancia, no.
 */
export const weaponDamageBonus = (weapon: SrdWeaponEntry, stats: PlayerStats): number =>
  weapon.kind === 'ranged' ? 0 : abilityModifier(stats[weaponAbility(weapon)]);

/** Fórmula de daño legible para mostrar en tarjetas (p. ej. "1d8 + 3"). */
export const weaponDamageFormula = (weapon: SrdWeaponEntry, stats: PlayerStats): string => {
  const bonus = weaponDamageBonus(weapon, stats);
  return bonus !== 0 ? `${weapon.damage} + ${bonus}` : weapon.damage;
};