// ============================================================
// Habilidades de personaje (2024)
// Lista de las 18 habilidades con su característica asociada,
// bonus total (modificador de atributo + competencia si aplica)
// y bonos a la competencia otorgados por dotes (p. ej. "Competente").
// ============================================================

import type { PlayerStats, StatAbbrev } from '../types';
import { srdFeatByTitle } from '../data/srd2024';
import { abilityModifier } from './diceUtils';

export interface SkillDef {
  /** Nombre de la habilidad en español. */
  name: string;
  /** Característica con la que se usa la habilidad. */
  ability: StatAbbrev;
}

/** Las 18 habilidades de 2014/2024 (sin habilidades de CON en 2024). */
export const SKILLS: SkillDef[] = [
  { name: 'Acrobacias', ability: 'dex' },
  { name: 'Atletismo', ability: 'str' },
  { name: 'Actuación', ability: 'cha' },
  { name: 'Arcanos', ability: 'int' },
  { name: 'Engaño', ability: 'cha' },
  { name: 'Historia', ability: 'int' },
  { name: 'Intimidación', ability: 'cha' },
  { name: 'Investigación', ability: 'int' },
  { name: 'Juego de manos', ability: 'dex' },
  { name: 'Medicina', ability: 'wis' },
  { name: 'Naturaleza', ability: 'int' },
  { name: 'Percepción', ability: 'wis' },
  { name: 'Perspicacia', ability: 'wis' },
  { name: 'Persuasión', ability: 'cha' },
  { name: 'Religión', ability: 'int' },
  { name: 'Sigilo', ability: 'dex' },
  { name: 'Supervivencia', ability: 'wis' },
  { name: 'Trato con animales', ability: 'wis' },
];

/** Característica asociada a una habilidad por su nombre. */
export const skillAbility = (name: string): StatAbbrev | undefined =>
  SKILLS.find((s) => s.name === name)?.ability;

/**
 * Bonus total de una habilidad: modificador de característica (+ competencia
 * si el personaje eligió esa habilidad). Sin competencia = solo el atributo.
 */
export const skillBonus = (
  stats: PlayerStats,
  skillName: string,
  proficient: boolean,
  proficiencyBonus: number
): number => {
  const ability = skillAbility(skillName);
  if (!ability) return 0;
  return abilityModifier(stats[ability]) + (proficient ? proficiencyBonus : 0);
};

/**
 * Competencias de habilidad adicionales que otorgan las dotes o rasgos
 * indicados (leído del metadato `skillBoosts` del SRD, p. ej. "Competente"
 * concede 3). Suma sobre todas las dotes del personaje.
 */
export const featSkillBoosts = (titles: string[]): number => {
  let total = 0;
  for (const title of titles) {
    const entry = srdFeatByTitle(title);
    if (entry?.skillBoosts) total += entry.skillBoosts;
  }
  return total;
};
