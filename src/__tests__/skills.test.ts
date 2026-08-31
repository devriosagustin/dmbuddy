import { describe, expect, it } from 'vitest';
import { SKILLS, skillAbility, skillBonus, featSkillBoosts } from '../utils/skills';
import { abilityModifier } from '../utils/diceUtils';

const STATS = { str: 14, dex: 12, con: 13, int: 10, wis: 8, cha: 16 };

describe('SKILLS (definición de habilidades)', () => {
  it('define las 18 habilidades estándar', () => {
    expect(SKILLS).toHaveLength(18);
  });

  it('cada habilidad tiene su característica correcta (2024)', () => {
    expect(skillAbility('Atletismo')).toBe('str');
    expect(skillAbility('Acrobacias')).toBe('dex');
    expect(skillAbility('Sigilo')).toBe('dex');
    expect(skillAbility('Arcanos')).toBe('int');
    expect(skillAbility('Percepción')).toBe('wis');
    expect(skillAbility('Supervivencia')).toBe('wis');
    expect(skillAbility('Persuasión')).toBe('cha');
  });

  it('no hay habilidades de CON en 2024', () => {
    expect(head(SKILLS, 'ability', 'con')).toBe(0);
  });
});

describe('skillBonus (modificador + competencia)', () => {
  const prof = 2;

  it('sin competencia solo suma el modificador de atributo', () => {
    expect(skillBonus(STATS, 'Persuasión', false, prof)).toBe(abilityModifier(16)); // +3
  });

  it('con competencia suma el modificador de atributo + competencia', () => {
    expect(skillBonus(STATS, 'Persuasión', true, prof)).toBe(abilityModifier(16) + 2); // +5
  });

  it('usa la característica correcta por habilidad', () => {
    expect(skillBonus(STATS, 'Atletismo', true, prof)).toBe(abilityModifier(14) + 2); // FUE +4
    expect(skillBonus(STATS, 'Percepción', true, prof)).toBe(abilityModifier(8) + 2); // SAB -1 + 2 = +1
  });

  it('habilidad desconocida devuelve 0', () => {
    expect(skillBonus(STATS, 'Inexistente', true, prof)).toBe(0);
  });
});

describe('featSkillBoosts (dotes que conceden competencias)', () => {
  it('Competente concede +3 competencias de habilidad', () => {
    expect(featSkillBoosts(['Competente'])).toBe(3);
  });

  it('las dotes sin bono no suman competencias', () => {
    expect(featSkillBoosts(['Alerta', 'Robusto'])).toBe(0);
    expect(featSkillBoosts([])).toBe(0);
    expect(featSkillBoosts(['Dote inexistente'])).toBe(0);
  });

  it('la búsqueda de dotes ignora mayúsculas y acentos', () => {
    expect(featSkillBoosts(['COMPETENTE'])).toBe(3);
  });
});

function head<T, K extends keyof T>(arr: T[], key: K, value: T[K]): number {
  return arr.filter((x) => x[key] === value).length;
}
