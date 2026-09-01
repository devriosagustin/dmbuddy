// ============================================================
// Utilidades del mapa de combate: dimensiones de la cuadrícula,
// comprobación de límites y colocación inicial de fichas.
// ============================================================

import type { Combatant } from '../types';

/** Número de columnas (casillas horizontales) del mapa. */
export const MAP_COLS = 28;
/** Número de filas (casillas verticales) del mapa. */
export const MAP_ROWS = 16;
/** Pies que representa cada casilla (regla 2024: cuadrícula de 5 pies). */
export const FEET_PER_CELL = 5;

export interface MapCell {
  x: number;
  y: number;
}

/** Indica si una coordenada cae dentro de la cuadrícula. */
export const inBounds = (x: number, y: number): boolean =>
  x >= 0 && x < MAP_COLS && y >= 0 && y < MAP_ROWS;

/** Convierte una distancia en pies al número de casillas (redondeo a ≥1). */
export const feetToCells = (feet: number): number => Math.max(1, Math.round(feet / FEET_PER_CELL));

/** Distancia en pies entre dos casillas usando métrica de tablero (Chebyshev). */
export const gridDistanceFeet = (from: MapCell, to: MapCell): number =>
  Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) * FEET_PER_CELL;

/** Distancia euclídea real en pies entre dos casillas (usada para conos/líneas). */
export const trueDistanceFeet = (from: MapCell, to: MapCell): number =>
  Math.hypot(to.x - from.x, to.y - from.y) * FEET_PER_CELL;

/** Indica si una casilla es una barrera (obstáculo no atravesable). */
export const isBarrier = (barriers: MapCell[] | undefined, x: number, y: number): boolean =>
  !!barriers && barriers.some((b) => b.x === x && b.y === y);

/**
 * Comprueba si hay línea de visión sin obstáculos entre dos casillas (origen y
 * destino), considerando que las barreras bloquean el paso. El destino si es
 * barrera no es alcanzable.
 */
export const hasLineOfSight = (
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  barriers: MapCell[] | undefined
): boolean => {
  if (isBarrier(barriers, tx, ty)) return false;
  let x = cx;
  let y = cy;
  const dx = Math.abs(tx - cx);
  const dy = Math.abs(ty - cy);
  const sx = cx < tx ? 1 : -1;
  const sy = cy < ty ? 1 : -1;
  let err = dx - dy;
  while (true) {
    if (x === tx && y === ty) return true;
    if ((x !== cx || y !== cy) && isBarrier(barriers, x, y)) return false;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
};

/** Casillas dentro de un radio (círculo) en pies. Las barreras bloquean el área. */
export const cellsInSphere = (
  cx: number,
  cy: number,
  radiusFeet: number,
  barriers?: MapCell[]
): MapCell[] => {
  const r = feetToCells(radiusFeet);
  const out: MapCell[] = [];
  for (let y = Math.max(0, cy - r); y <= Math.min(MAP_ROWS - 1, cy + r); y++) {
    for (let x = Math.max(0, cx - r); x <= Math.min(MAP_COLS - 1, cx + r); x++) {
      if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) > r) continue;
      if (isBarrier(barriers, x, y)) continue;
      if (!hasLineOfSight(cx, cy, x, y, barriers)) continue;
      out.push({ x, y });
    }
  }
  return out;
};

/** Casillas de una línea recta ortogonal/diagonal desde el origen hacia el objetivo. */
export const cellsInLine = (
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  lengthFeet: number,
  barriers?: MapCell[]
): MapCell[] => {
  const L = feetToCells(lengthFeet);
  const vecX = tx - cx;
  const vecY = ty - cy;
  const len = Math.hypot(vecX, vecY);
  if (len === 0) return [];
  // Dirección redondeada a las 8 direcciones del tablero (-1, 0, 1 cada eje).
  const stepX = Math.round(vecX / len);
  const stepY = Math.round(vecY / len);
  if (stepX === 0 && stepY === 0) return [];
  const out: MapCell[] = [];
  for (let i = 1; i <= L; i++) {
    const x = cx + stepX * i;
    const y = cy + stepY * i;
    if (!inBounds(x, y)) break;
    if (isBarrier(barriers, x, y)) break;
    out.push({ x, y });
  }
  return out;
};

/** Casillas de un cono de ~90° con vértice en el origen y apuntando al objetivo. */
export const cellsInCone = (
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  lengthFeet: number,
  barriers?: MapCell[]
): MapCell[] => {
  const L = feetToCells(lengthFeet);
  const vecX = tx - cx;
  const vecY = ty - cy;
  const len = Math.hypot(vecX, vecY);
  let ux = 1;
  let uy = 0;
  if (len > 0) {
    ux = vecX / len;
    uy = vecY / len;
  }
  const cosHalf = Math.cos(Math.PI / 4); // 45° a cada lado del eje → cono de 90°
  const out: MapCell[] = [];
  for (let y = Math.max(0, cy - L); y <= Math.min(MAP_ROWS - 1, cy + L); y++) {
    for (let x = Math.max(0, cx - L); x <= Math.min(MAP_COLS - 1, cx + L); x++) {
      if (x === cx && y === cy) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d > L) continue;
      const dot = ((x - cx) * ux + (y - cy) * uy) / d;
      if (dot < cosHalf) continue;
      if (isBarrier(barriers, x, y)) continue;
      if (!hasLineOfSight(cx, cy, x, y, barriers)) continue;
      out.push({ x, y });
    }
  }
  return out;
};

/** Devuelve si una casilla está ya ocupada por una ficha. */
export const isOccupied = (participants: Combatant[], x: number, y: number): boolean =>
  participants.some((p) => p.x === x && p.y === y);

/**
 * Encuentra la primera casilla libre para colocar una ficha al entrar en
 * combate: los PJ aparecen por la izquierda y los monstruos por la derecha,
 * en franjas verticales desde el borde correspondiente.
 */
export const findSpawnCell = (
  participants: Combatant[],
  isPlayer: boolean,
  barriers?: MapCell[]
): MapCell => {
  const direction = isPlayer ? 1 : -1;
  const startX = isPlayer ? 1 : MAP_COLS - 2;
  const reach = Math.max(MAP_COLS, MAP_ROWS);
  for (let step = 0; step < reach; step++) {
    const x = startX + direction * step;
    for (let y = 0; y < MAP_ROWS; y++) {
      if (inBounds(x, y) && !isOccupied(participants, x, y) && !isBarrier(barriers, x, y))
        return { x, y };
    }
  }
  // Fallback: primera casilla libre de todo el tablero.
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      if (!isOccupied(participants, x, y) && !isBarrier(barriers, x, y)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
};
