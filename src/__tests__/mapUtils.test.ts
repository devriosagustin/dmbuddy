import { describe, expect, it } from 'vitest';
import type { Combatant, MapTile } from '../types';
import {
  findSpawnCell,
  inBounds,
  isWall,
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

describe('mapUtils muros', () => {
  const walls: MapTile[] = [{ x: 7, y: 5, type: 'wall' }];

  it('isWall detecta casillas muro', () => {
    expect(isWall(walls, 7, 5)).toBe(true);
    expect(isWall(walls, 6, 5)).toBe(false);
    expect(isWall(undefined, 7, 5)).toBe(false);
  });

  it('cellsInLine se detiene en un muro', () => {
    // Sin muro llega más allá de la casilla 7.
    const free = cellsInLine(5, 5, 12, 5, 40);
    expect(free.some((c) => c.x > 7)).toBe(true);
    // Con muro se detiene en la casilla 6 (antes de la 7).
    const blocked = cellsInLine(5, 5, 12, 5, 40, walls);
    expect(blocked.some((c) => c.x === 7)).toBe(false);
    expect(blocked.some((c) => c.x > 7)).toBe(false);
  });

  it('cellsInSphere excluye la casilla muro y lo que hay detrás', () => {
    const free = cellsInSphere(5, 5, 30);
    expect(free.some((c) => c.x === 7 && c.y === 5)).toBe(true);
    expect(free.some((c) => c.x === 9 && c.y === 5)).toBe(true);
    const blocked = cellsInSphere(5, 5, 30, walls);
    expect(blocked.some((c) => c.x === 7 && c.y === 5)).toBe(false);
    // La casilla con muro bloquea la línea de visión hacia el este.
    expect(blocked.some((c) => c.x > 7 && c.y === 5)).toBe(false);
  });

  it('cellsInCone excluye casillas muro y sin línea de visión', () => {
    const blocked = cellsInCone(5, 5, 9, 5, 30, walls);
    expect(blocked.some((c) => c.x === 7 && c.y === 5)).toBe(false);
  });

  it('tiles no-muro (trampa, tesoro, investigación) no bloquean movimiento ni visión', () => {
    const nonWallTiles: MapTile[] = [
      { x: 7, y: 5, type: 'trap' },
      { x: 8, y: 5, type: 'treasure' },
      { x: 9, y: 5, type: 'investigation' },
    ];
    // cellsInLine no debe detenerse en tiles no-muro.
    const line = cellsInLine(5, 5, 12, 5, 40, nonWallTiles);
    expect(line.some((c) => c.x === 7)).toBe(true);
    expect(line.some((c) => c.x === 8)).toBe(true);
    expect(line.some((c) => c.x === 9)).toBe(true);
    expect(line.some((c) => c.x > 9)).toBe(true);
    // cellsInSphere debe incluir casillas con tiles no-muro.
    const sphere = cellsInSphere(5, 5, 30, nonWallTiles);
    expect(sphere.some((c) => c.x === 7 && c.y === 5)).toBe(true);
    expect(sphere.some((c) => c.x === 8 && c.y === 5)).toBe(true);
    expect(sphere.some((c) => c.x === 9 && c.y === 5)).toBe(true);
  });
});