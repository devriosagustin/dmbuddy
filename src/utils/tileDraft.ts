// ============================================================
// Edición de tiles fuera del mapa en vivo: mismas reglas que usa el
// mapa activo (toggleTile/updatePortal de combatStore), pero puras y
// sobre un array local — para editar un layout guardado sin tener
// que cargarlo primero en el mapa de la sesión.
// ============================================================

import type { MapTile, TileType } from '../types';
import { inBounds } from './mapUtils';

/**
 * Igual semántica que combatStore.toggleTile: si la celda ya tiene un tile
 * del mismo tipo lo quita (o alterna abierta/cerrada si es una puerta); si
 * tiene uno de otro tipo lo reemplaza; si está vacía, coloca uno nuevo.
 */
export const toggleDraftTile = (tiles: MapTile[], x: number, y: number, type: TileType): MapTile[] => {
  const idx = tiles.findIndex((t) => t.x === x && t.y === y);
  if (idx >= 0) {
    if (tiles[idx].type === type) {
      if (type === 'door') {
        const updated = [...tiles];
        updated[idx] = { ...updated[idx], open: updated[idx].open === true ? false : true };
        return updated;
      }
      return tiles.filter((t) => !(t.x === x && t.y === y));
    }
    const updated = [...tiles];
    updated[idx] = type === 'door' ? { x, y, type, open: false } : { x, y, type };
    return updated;
  }
  if (!inBounds(x, y)) return tiles;
  const tile: MapTile = type === 'door' ? { x, y, type, open: false } : { x, y, type };
  return [...tiles, tile];
};

/** Quita cualquier tile en una celda, sin importar su tipo. */
export const removeDraftTileAt = (tiles: MapTile[], x: number, y: number): MapTile[] =>
  tiles.filter((t) => !(t.x === x && t.y === y));

/**
 * Igual semántica que combatStore.updatePortal: actualiza los datos de un
 * portal ya colocado en esa celda. No hace nada si la celda no es un portal.
 */
export const applyPortalUpdate = (
  tiles: MapTile[],
  x: number,
  y: number,
  updates: { targetLayoutId?: string; targetX?: number; targetY?: number; label?: string }
): MapTile[] =>
  tiles.map((t) => (t.x === x && t.y === y && t.type === 'portal' ? { ...t, ...updates } : t));
