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

/** Devuelve si una casilla está ya ocupada por una ficha. */
export const isOccupied = (participants: Combatant[], x: number, y: number): boolean =>
  participants.some((p) => p.x === x && p.y === y);

/**
 * Encuentra la primera casilla libre para colocar una ficha al entrar en
 * combate: los PJ aparecen por la izquierda y los monstruos por la derecha,
 * en franjas verticales desde el borde correspondiente.
 */
export const findSpawnCell = (participants: Combatant[], isPlayer: boolean): MapCell => {
  const direction = isPlayer ? 1 : -1;
  const startX = isPlayer ? 1 : MAP_COLS - 2;
  const reach = Math.max(MAP_COLS, MAP_ROWS);
  for (let step = 0; step < reach; step++) {
    const x = startX + direction * step;
    for (let y = 0; y < MAP_ROWS; y++) {
      if (inBounds(x, y) && !isOccupied(participants, x, y)) return { x, y };
    }
  }
  // Fallback: primera casilla libre de todo el tablero.
  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      if (!isOccupied(participants, x, y)) return { x, y };
    }
  }
  return { x: 0, y: 0 };
};
