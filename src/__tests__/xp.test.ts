// ============================================================
// Tests de la progresión de experiencia (XP)
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  applyXpToLevel,
  canLevelUp,
  levelFromXp,
  MAX_LEVEL,
  xpForLevel,
  xpForNextLevel,
  xpIntoLevel,
  xpNeededForNextLevel,
  xpProgress,
} from '../utils/xp';

describe('Progresión de XP', () => {
  it('debe mapear XP acumulada a nivel', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(299)).toBe(1);
    expect(levelFromXp(300)).toBe(2);
    expect(levelFromXp(899)).toBe(2);
    expect(levelFromXp(900)).toBe(3);
    expect(levelFromXp(355000)).toBe(20);
    expect(levelFromXp(999999)).toBe(20);
  });

  it('debe devolver los umbrales de nivel', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(5)).toBe(6500);
    expect(xpForLevel(20)).toBe(355000);
    // Clampeo
    expect(xpForLevel(30)).toBe(355000);
    expect(xpForLevel(0)).toBe(0);
  });

  it('debe calcular la XP necesaria para el siguiente nivel', () => {
    expect(xpNeededForNextLevel(1)).toBe(300);
    expect(xpNeededForNextLevel(4)).toBe(6500 - 2700); // 3800
    expect(xpNeededForNextLevel(MAX_LEVEL)).toBe(0);
    expect(xpForNextLevel(1)).toBe(300);
    expect(xpForNextLevel(MAX_LEVEL)).toBe(Infinity);
  });

  it('debe calcular el progreso de la barra dentro del nivel', () => {
    // Nv 1, entre 0 y 300
    expect(xpProgress(1, 0)).toBe(0);
    expect(xpProgress(1, 150)).toBeCloseTo(0.5);
    expect(xpProgress(1, 300)).toBe(1);
    // Nv 20 → barra llena
    expect(xpProgress(MAX_LEVEL, 100)).toBe(1);
  });

  it('debe calcular la XP acumulada dentro del nivel actual', () => {
    expect(xpIntoLevel(1, 150)).toBe(150);
    expect(xpIntoLevel(2, 300)).toBe(0);
    expect(xpIntoLevel(2, 450)).toBe(150);
  });

  it('debe aplicar la XP y subir de nivel cuando corresponde', () => {
    expect(applyXpToLevel(1, 150)).toEqual({ level: 1, leveledUp: false });
    expect(applyXpToLevel(1, 300)).toEqual({ level: 2, leveledUp: true });
    // Salto de varios niveles
    expect(applyXpToLevel(1, 7000)).toEqual({ level: 5, leveledUp: true });
    // No puede bajar de nivel
    expect(applyXpToLevel(5, 100)).toEqual({ level: 5, leveledUp: false });
  });

  it('debe saber si puede subir de nivel', () => {
    expect(canLevelUp(1, 150)).toBe(false);
    expect(canLevelUp(1, 300)).toBe(true);   // ya alcanzó Nv 2
    expect(canLevelUp(2, 300)).toBe(false);  // ya es nivel 2
    expect(canLevelUp(2, 900)).toBe(true);   // ya alcanzó Nv 3
    expect(canLevelUp(20, 999999)).toBe(false); // nivel máximo
  });
});
