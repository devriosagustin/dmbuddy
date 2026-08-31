// ============================================================
// Utilidades del lanzador de dados de DM Copilot Web
// ============================================================

import type { DiceResult } from '../types';

/**
 * Lanza un dado de `sides` caras.
 */
const rollOnce = (sides: number): number => Math.floor(Math.random() * sides) + 1;

/**
 * Devuelve la lista de dados que aparecen en la parte izquierda de una
 * fórmula de dados (p. ej. "3d6", "1d20", "d8").
 */
const parseDice = (dicePart: string): { count: number; sides: number } | null => {
  const match = dicePart.toLowerCase().match(/^(\d*)d(\d+)$/);
  if (!match) return null;
  const count = match[1] === '' ? 1 : parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  return { count, sides };
};

export interface DiceTerm {
  kind: 'dice';
  count: number;
  sides: number;
  sign: 1 | -1;
}

export interface ParsedFormula {
  terms: (DiceTerm | { kind: 'mod'; value: number })[];
  keepHighest?: number; // 2d20k1 = conservar los 1 mejores
  keepLowest?: number; // 4d6dl1 = descartar la más baja
  advantage: boolean;
  disadvantage: boolean;
}

/**
 * Parsea una fórmula como "2d20k1", "4d6dl1", "d20+5", "2d8+2d6+3", "d20 adv".
 * Devuelve null si la fórmula no es válida.
 */
export const parseFormula = (formula: string): ParsedFormula | null => {
  const expression = formula.toLowerCase().replace(/\s+/g, '');
  let cleaned = expression;

  let keepHighest: number | undefined;
  let keepLowest: number | undefined;

  // Extrae el número de una marca "k" (keep) o "l" (drop) pegada al dado
  const extract = (re: RegExp): number | undefined => {
    const m = cleaned.match(re);
    if (m) {
      cleaned = cleaned.replace(re, m[1]);
      return parseInt(m[2], 10);
    }
    return undefined;
  };

  keepHighest = extract(/(\d*d\d+)k(\d+)/);
  if (keepHighest === undefined) keepHighest = extract(/(\d*d\d+)kl(\d+)/);
  keepLowest = extract(/(\d*d\d+)l(\d+)/);
  if (keepLowest === undefined) keepLowest = extract(/(\d*d\d+)dl(\d+)/);

  // Marcas textuales de ventaja/desventaja
  const advantage = expression.includes('adv') && !expression.includes('dis');
  const disadvantage = expression.includes('dis') && !expression.includes('adv');
  cleaned = cleaned.replace(/adv/g, '').replace(/dis/g, '');

  // Separar términos por + o -
  const terms = cleaned.split(/([+-])/).filter((t) => t !== '');

  const parts: ParsedFormula['terms'] = [];
  let sign: 1 | -1 = 1;
  let hasDice = false;

  for (const term of terms) {
    if (term === '+') {
      sign = 1;
      continue;
    }
    if (term === '-') {
      sign = -1;
      continue;
    }
    const dice = parseDice(term);
    if (dice) {
      hasDice = true;
      parts.push({ kind: 'dice', count: dice.count, sides: dice.sides, sign });
    } else {
      const value = parseFloat(term);
      if (isNaN(value)) return null;
      parts.push({ kind: 'mod', value: sign * value });
    }
  }

  if (!hasDice) return null;

  return { terms: parts, keepHighest, keepLowest, advantage, disadvantage };
};

/**
 * Lanza dados según una fórmula textual.
 * Soporta: 2d20+5, 2d20k1, 2d20 adv, 4d6dl1, d8+3, 1d20+d4-2, etc.
 */
export const rollDice = (formula: string): DiceResult => {
  const parsed = parseFormula(formula);

  if (!parsed) {
    return {
      formula,
      result: 0,
      rolls: [],
      modifier: 0,
      timestamp: new Date(),
      breakdown: 'Fórmula no válida',
    };
  }

  const modifier = parsed.terms.reduce(
    (acc, term) => acc + (term.kind === 'mod' ? term.value : 0),
    0
  );

  // Recoger los dados en orden y acumular totales por grupo
  const rolledGroups: { sign: 1 | -1; values: number[]; sides: number }[] = [];
  for (const term of parsed.terms) {
    if (term.kind === 'dice') {
      const values: number[] = [];
      for (let i = 0; i < term.count; i++) values.push(rollOnce(term.sides));
      rolledGroups.push({ sign: term.sign, values, sides: term.sides });
    }
  }

  const allRolls = rolledGroups.flatMap((g) => g.values);

  // keep/drop: aplicar sobre el primer grupo de dados
  let adjusted: { sign: 1 | -1; values: number[]; sides: number }[] = rolledGroups;
  const first = rolledGroups[0];
  if (first && (parsed.keepHighest !== undefined || parsed.keepLowest !== undefined)) {
    const sorted = [...first.values];
    let kept: number[];
    if (parsed.keepHighest !== undefined && parsed.keepHighest < sorted.length) {
      kept = sorted.sort((a, b) => b - a).slice(0, parsed.keepHighest);
    } else if (parsed.keepLowest !== undefined && parsed.keepLowest < sorted.length) {
      kept = sorted.sort((a, b) => a - b).slice(parsed.keepLowest);
    } else {
      kept = [...first.values];
    }
    adjusted = [{ sign: first.sign, values: kept, sides: first.sides }];
  }

  const rollTotal = adjusted.reduce(
    (acc, g) => acc + g.sign * g.values.reduce((a, b) => a + b, 0),
    0
  );
  const result = rollTotal + modifier;

  // Desglose legible
  const termsDisplay = adjusted.map((g) => {
    const joined = g.values.join('+');
    const withSign = g.sign === 1 && g.values.length > 0 ? `${joined}` : joined;
    return withSign;
  });
  let breakdown = termsDisplay.filter(Boolean).join(' + ');
  if (modifier !== 0) {
    breakdown = breakdown
      ? `${breakdown} ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}`
      : `${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}`;
  }
  if (breakdown === '') breakdown = '0';
  breakdown = `${breakdown} = ${result}`;

  return {
    formula,
    result,
    rolls: allRolls,
    modifier,
    advantage: parsed.advantage,
    timestamp: new Date(),
    breakdown,
  };
};

/**
 * Tirada con ventaja de d20.
 */
export const rollWithAdvantage = (modifier = 0): DiceResult => {
  const roll1 = rollOnce(20);
  const roll2 = rollOnce(20);
  const result = Math.max(roll1, roll2) + modifier;
  return {
    formula: `d20 adv${modifier !== 0 ? ` ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}` : ''}`,
    result,
    rolls: [roll1, roll2],
    modifier,
    advantage: true,
    type: 'd20',
    timestamp: new Date(),
    breakdown: `[${roll1}, ${roll2}] → ${Math.max(roll1, roll2)}${modifier !== 0 ? `${modifier > 0 ? ' + ' : ' - '}${Math.abs(modifier)}` : ''} = ${result}`,
  };
};

/**
 * Tirada con desventaja de d20.
 */
export const rollWithDisadvantage = (modifier = 0): DiceResult => {
  const roll1 = rollOnce(20);
  const roll2 = rollOnce(20);
  const result = Math.min(roll1, roll2) + modifier;
  return {
    formula: `d20 dis${modifier !== 0 ? ` ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}` : ''}`,
    result,
    rolls: [roll1, roll2],
    modifier,
    advantage: false,
    type: 'd20',
    timestamp: new Date(),
    breakdown: `[${roll1}, ${roll2}] → ${Math.min(roll1, roll2)}${modifier !== 0 ? `${modifier > 0 ? ' + ' : ' - '}${Math.abs(modifier)}` : ''} = ${result}`,
  };
};

/**
 * Dados explosivos: si sale el valor máximo, se relanza y se suma.
 */
export const rollExploding = (sides: number, count = 1, modifier = 0): DiceResult => {
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    const results: number[] = [];
    let roll = rollOnce(sides);
    results.push(roll);
    while (roll === sides && results.length < 10) {
      // explosión
      roll = rollOnce(sides);
      results.push(roll);
    }
    rolls.push(...results);
  }
  const result = rolls.reduce((a, b) => a + b, 0) + modifier;
  return {
    formula: `${count}d${sides}!${modifier !== 0 ? `${modifier > 0 ? '+' : '-'}${Math.abs(modifier)}` : ''}`,
    result,
    rolls,
    modifier,
    timestamp: new Date(),
    breakdown: `${rolls.join(' + ')}${modifier !== 0 ? ` ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}` : ''} = ${result}`,
  };
};

/**
 * Devuelve el modificador de una estadística (score → modifier).
 */
export const abilityModifier = (score: number): number => Math.floor((score - 10) / 2);

/**
 * Genera un personaje con habilidades de punto de compra simplificado
 * para tirar estadísticas aleatorias (4d6, descartar la más baja).
 */
export const rollStats = (): {
  str: number; dex: number; con: number; int: number; wis: number; cha: number;
} => {
  const rollOne = () => {
    const rolls = [rollOnce(6), rollOnce(6), rollOnce(6), rollOnce(6)];
    rolls.sort((a, b) => a - b);
    rolls.shift(); // descartar la más baja
    return rolls.reduce((a, b) => a + b, 0);
  };

  return { str: rollOne(), dex: rollOne(), con: rollOne(), int: rollOne(), wis: rollOne(), cha: rollOne() };
};