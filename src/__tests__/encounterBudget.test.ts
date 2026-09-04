// ============================================================
// Tests del presupuesto de XP para encuentros (reglas SRD 2024)
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  classifyEncounterDifficulty,
  partyXpBudget,
  xpBudgetPerCharacter,
} from '../utils/encounterBudget';

describe('Presupuesto de XP de encuentros', () => {
  it('debe devolver el presupuesto por personaje según la tabla oficial', () => {
    expect(xpBudgetPerCharacter(1)).toEqual({ low: 50, moderate: 75, high: 100 });
    expect(xpBudgetPerCharacter(5)).toEqual({ low: 500, moderate: 750, high: 1100 });
    expect(xpBudgetPerCharacter(20)).toEqual({ low: 6400, moderate: 13200, high: 22000 });
  });

  it('debe clampear niveles fuera de rango (1-20)', () => {
    expect(xpBudgetPerCharacter(0)).toEqual(xpBudgetPerCharacter(1));
    expect(xpBudgetPerCharacter(25)).toEqual(xpBudgetPerCharacter(20));
  });

  it('debe sumar el presupuesto de todo el grupo (ejemplo del libro: 4 personajes nivel 1, dificultad Baja = 200 XP)', () => {
    const budget = partyXpBudget([1, 1, 1, 1]);
    expect(budget).toEqual({ low: 200, moderate: 300, high: 400 });
  });

  it('debe soportar niveles mixtos en el party', () => {
    // 2 personajes nivel 1 (50 c/u) + 1 nivel 3 (150) = 250 de presupuesto Bajo
    const budget = partyXpBudget([1, 1, 3]);
    expect(budget.low).toBe(50 + 50 + 150);
  });

  it('debe clasificar la dificultad sin exceder el presupuesto (regla del libro)', () => {
    const budget = { low: 200, moderate: 300, high: 400 };
    expect(classifyEncounterDifficulty(0, budget)).toBe('baja');
    expect(classifyEncounterDifficulty(200, budget)).toBe('baja');
    expect(classifyEncounterDifficulty(201, budget)).toBe('moderada');
    expect(classifyEncounterDifficulty(300, budget)).toBe('moderada');
    expect(classifyEncounterDifficulty(301, budget)).toBe('alta');
    expect(classifyEncounterDifficulty(400, budget)).toBe('alta');
    expect(classifyEncounterDifficulty(401, budget)).toBe('extrema');
  });

  it('ejemplo 1 del SRD: 4 personajes nivel 1, dificultad Baja — 1 Bugbear Warrior (200 XP) encaja justo', () => {
    const budget = partyXpBudget([1, 1, 1, 1]);
    expect(classifyEncounterDifficulty(200, budget)).toBe('baja');
  });

  it('ejemplo 2 del SRD: 5 personajes nivel 3, presupuesto Moderado = 1.125 XP', () => {
    const budget = partyXpBudget([3, 3, 3, 3, 3]);
    expect(budget.moderate).toBe(1125);
    // 2 Druids (450 c/u) + 9 Stirges (25 c/u) = 1.125 XP total (justo el presupuesto)
    expect(classifyEncounterDifficulty(2 * 450 + 9 * 25, budget)).toBe('moderada');
  });
});
