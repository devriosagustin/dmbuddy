import { describe, expect, it } from 'vitest';
import type { Combatant } from '../types';
import {
  findSpawnCell,
  inBounds,
  MAP_COLS,
  MAP_ROWS,
  cellsInCone,
  cellsInLine,
  cellsInSphere,
  feetToCells,
  gridDistanceFeet,
  trueDistanceFeet,
} from '../utils/mapUtils';

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

describe('mapUtils geometría', () => {
  it('feetToCells redondea y respeta un mínimo de 1', () => {
    expect(feetToCells(5)).toBe(1);
    expect(feetToCells(30)).toBe(6);
    expect(feetToCells(1)).toBe(1);
  });

  it('gridDistanceFeet usa distancia Chebyshev en pies', () => {
    expect(gridDistanceFeet({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(15);
    expect(gridDistanceFeet({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(20); // max(3,4)*5
  });

  it('trueDistanceFeet usa distancia euclídea', () => {
    expect(trueDistanceFeet({ x: 0, y: 0 }, { x: 3, y: 4 })).toBeCloseTo(25);
  });

  it('cellsInSphere rellena un círculo Chebyshev dentro de la cuadrícula', () => {
    const cells = cellsInSphere(10, 10, 10); // radio 2 casillas
    expect(cells.length).toBe(25); // 5x5
    expect(cells.every((c) => inBounds(c.x, c.y))).toBe(true);
  });

  it('cellsInLine recorre una línea ortogonal', () => {
    const cells = cellsInLine(5, 5, 8, 5, 15); // 3 casillas hacia la derecha
    expect(cells).toEqual([
      { x: 6, y: 5 },
      { x: 7, y: 5 },
      { x: 8, y: 5 },
    ]);
  });

  it('cellsInCone queda dentro del radio y en la dirección', () => {
    const cells = cellsInCone(5, 5, 7, 5, 10);
    expect(cells.length).toBeGreaterThan(0);
    // El cono debe cubrir la casilla hacia el objetivo.
    expect(cells.some((c) => c.x === 6 && c.y === 5)).toBe(true);
    // No debe extenderse más allá del radio.
    for (const c of cells) {
      expect(trueDistanceFeet({ x: 5, y: 5 }, c)).toBeLessThanOrEqual(10 + 0.001);
    }
  });
});