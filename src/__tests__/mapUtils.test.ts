import { describe, expect, it } from 'vitest';
import type { Combatant } from '../types';
import { findSpawnCell, inBounds, MAP_COLS, MAP_ROWS } from '../utils/mapUtils';

const mk = (x?: number, y?: number): Combatant =>
  ({
    id: 'c',
    name: 'X',
    initiative: 10,
    hp: 1,
    maxHp: 1,
    tempHp: 0,
    armorClass: 10,
    type: 'monster',
    statusEffects: [],
    x,
    y,
  }) as unknown as Combatant;

describe('mapUtils', () => {
  it('inBounds valida los límites de la cuadrícula', () => {
    expect(inBounds(0, 0)).toBe(true);
    expect(inBounds(MAP_COLS - 1, MAP_ROWS - 1)).toBe(true);
    expect(inBounds(MAP_COLS, 0)).toBe(false);
    expect(inBounds(-1, 0)).toBe(false);
    expect(inBounds(0, MAP_ROWS)).toBe(false);
  });

  it('coloca a los PJ por la izquierda y a los monstruos por la derecha', () => {
    const playerPos = findSpawnCell([], true);
    expect(playerPos.x).toBeLessThan(MAP_COLS / 2);
    const monsterPos = findSpawnCell([], false);
    expect(monsterPos.x).toBeGreaterThanOrEqual(MAP_COLS / 2);
  });

  it('encuentra casillas libres para varias fichas sin superponerlas', () => {
    let occupied: Combatant[] = [];
    let positions: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const cell = findSpawnCell(occupied, false);
      expect(inBounds(cell.x, cell.y)).toBe(true);
      const overlap = positions.some((p) => p.x === cell.x && p.y === cell.y);
      expect(overlap).toBe(false);
      positions.push(cell);
      occupied = [...occupied, mk(cell.x, cell.y)];
    }
  });
});