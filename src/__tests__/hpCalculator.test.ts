// ============================================================
// Tests de bookMaxHp: PG máximos "de libro" al subir de nivel.
// ============================================================

import { describe, expect, it } from 'vitest';
import { bookMaxHp, hasToughFeat } from '../utils/hpCalculator';

describe('bookMaxHp', () => {
  it('nivel 1: dado de golpe máximo + mod. CON', () => {
    // Guerrero (d10), CON 14 (+2): 10 + 2 = 12
    expect(bookMaxHp('Guerrero', 1, 14)).toBe(12);
    // Mago (d6), CON 10 (+0): 6 + 0 = 6
    expect(bookMaxHp('Mago', 1, 10)).toBe(6);
  });

  it('niveles siguientes: valor fijo del dado + mod. CON por nivel', () => {
    // Guerrero (d10, fijo 6), CON 14 (+2): nivel1 12 + 4 niveles * (6+2) = 12 + 32 = 44
    expect(bookMaxHp('Guerrero', 5, 14)).toBe(44);
    // Bárbaro (d12, fijo 7), CON 16 (+3): nivel1 15 + 2 * (7+3) = 15 + 20 = 35
    expect(bookMaxHp('Bárbaro', 3, 16)).toBe(35);
  });

  it('nunca suma menos de 1 PG por nivel, incluso con mod. CON negativo', () => {
    // Mago (d6), CON 6 (-2): nivel1 max(1, 6-2)=4; niveles siguientes max(1, 4-2)=2 c/u
    expect(bookMaxHp('Mago', 1, 6)).toBe(4);
    expect(bookMaxHp('Mago', 3, 6)).toBe(4 + 2 * 2);
  });

  it('detecta la dote Robusto y suma +2 PG por nivel (todos los niveles)', () => {
    expect(hasToughFeat(['Robusto'])).toBe(true);
    expect(hasToughFeat(['Alerta'])).toBe(false);
    expect(hasToughFeat(undefined)).toBe(false);

    const sinRobusto = bookMaxHp('Guerrero', 4, 14);
    const conRobusto = bookMaxHp('Guerrero', 4, 14, ['Robusto']);
    expect(conRobusto).toBe(sinRobusto + 2 * 4);
  });

  it('clase desconocida cae a d8 en vez de romper', () => {
    expect(bookMaxHp('Clase Homebrew', 1, 10)).toBe(8);
  });
});
