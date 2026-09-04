// ============================================================
// Tests de rollAttackAgainst: críticos (nat 20) duplican los
// dados de daño, el modificador se suma una sola vez (regla 2024).
// ============================================================

import { afterEach, describe, expect, it, vi } from 'vitest';
import { rollAttackAgainst } from '../utils/damageCalculator';
import type { MonsterAction } from '../types';

/** Sustituye Math.random por una secuencia fija y determinística. */
const mockRandomSequence = (values: number[]) => {
  let i = 0;
  vi.spyOn(Math, 'random').mockImplementation(() => values[Math.min(i++, values.length - 1)]);
};

afterEach(() => {
  vi.restoreAllMocks();
});

const action: MonsterAction = {
  name: 'Mordisco',
  description: '',
  attackBonus: 3,
  damage: '1d6+2',
};

describe('rollAttackAgainst — nat 20 / crítico', () => {
  it('un nat 20 siempre impacta, incluso contra una CA que normalmente fallaría', () => {
    mockRandomSequence([0.96]); // floor(0.96*20)+1 = 20
    const result = rollAttackAgainst(action, 999);
    expect(result.d20Roll).toBe(20);
    expect(result.isCrit).toBe(true);
    expect(result.hit).toBe(true);
  });

  it('en un crítico se tiran los dados de daño el doble de veces y el modificador se suma una sola vez', () => {
    // d20 = 20 (crítico) y cada d6 sale 1 (Math.random = 0 → floor(0*6)+1 = 1)
    mockRandomSequence([0.96, 0, 0]);
    const result = rollAttackAgainst(action, 10);
    expect(result.isCrit).toBe(true);
    // 1d6+2 normal tiraría 1 dado; en crítico son 2 dados de 1 + el +2 UNA sola vez = 4
    expect(result.totalDamage).toBe(4);
    expect(result.damageRolls[0]).toBe('1+1+2 = 4');
  });

  it('un impacto normal (sin crítico) tira los dados de daño una sola vez', () => {
    mockRandomSequence([0.7, 0]); // floor(0.7*20)+1 = 15 (no crítico); el d6 sale 1
    const result = rollAttackAgainst(action, 10); // 15 + 3 = 18 ≥ 10 → impacta
    expect(result.isCrit).toBe(false);
    expect(result.hit).toBe(true);
    // 1d6+2 sin crítico: 1 dado de 1 + 2 = 3
    expect(result.totalDamage).toBe(3);
    expect(result.damageRolls[0]).toBe('1+2 = 3');
  });

  it('un fallo (sin crítico, por debajo de la CA) no inflige daño', () => {
    mockRandomSequence([0.05]); // floor(0.05*20)+1 = 2 (no crítico); 2 + 3 = 5 < CA 20
    const result = rollAttackAgainst(action, 20);
    expect(result.isCrit).toBe(false);
    expect(result.hit).toBe(false);
    expect(result.totalDamage).toBe(0);
    expect(result.damageRolls).toEqual([]);
  });
});
