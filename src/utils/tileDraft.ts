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
    // Un portal solo se quita desde su modal (botón «Eliminar»): ninguna
    // otra herramienta de tile puede pisarlo ni borrarlo por accidente.
    if (tiles[idx].type === 'portal' && type !== 'portal') return tiles;
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
 * Mueve el tile en (from) a (to), conservando todos sus datos (tipo,
 * abierta/cerrada, destino de portal, etiqueta). Si ya había otro tile en
 * la celda destino, se sobrescribe (igual criterio que colocar un tile
 * nuevo encima de otro). No hace nada si no hay tile en el origen, o si
 * origen y destino son la misma celda.
 */
export const moveDraftTile = (
  tiles: MapTile[],
  from: { x: number; y: number },
  to: { x: number; y: number }
): MapTile[] => {
  if (from.x === to.x && from.y === to.y) return tiles;
  const tile = tiles.find((t) => t.x === from.x && t.y === from.y);
  if (!tile) return tiles;
  if (!inBounds(to.x, to.y)) return tiles;
  const moved = { ...tile, x: to.x, y: to.y };
  const rest = tiles.filter(
    (t) => !(t.x === from.x && t.y === from.y) && !(t.x === to.x && t.y === to.y)
  );
  return [...rest, moved];
};

/**
 * Igual semántica que combatStore.paintTile: coloca/quita el tile de forma
 * IDEMPOTENTE (a diferencia de toggleDraftTile, nunca alterna) — repetir la
 * misma celda con el mismo modo no hace nada. Usado durante un trazo de
 * arrastre continuo, donde el modo ('add'/'remove') se decide una sola vez
 * al empezar el trazo y se repite en cada celda nueva que se visita. Las
 * puertas quedan afuera del arrastre (se manejan aparte, con un solo click).
 */
export const paintDraftTile = (
  tiles: MapTile[],
  x: number,
  y: number,
  type: TileType,
  mode: 'add' | 'remove'
): MapTile[] => {
  if (!inBounds(x, y)) return tiles;
  const idx = tiles.findIndex((t) => t.x === x && t.y === y);
  // Un portal solo se quita desde su modal (botón «Eliminar»): un trazo de
  // pintado con otra herramienta no puede pisarlo ni borrarlo.
  if (idx >= 0 && tiles[idx].type === 'portal' && type !== 'portal') return tiles;
  if (mode === 'remove') {
    return idx >= 0 ? tiles.filter((t) => !(t.x === x && t.y === y)) : tiles;
  }
  if (idx >= 0) {
    if (tiles[idx].type === type) return tiles;
    const updated = [...tiles];
    updated[idx] = type === 'door' ? { x, y, type, open: false } : { x, y, type };
    return updated;
  }
  const tile: MapTile = type === 'door' ? { x, y, type, open: false } : { x, y, type };
  return [...tiles, tile];
};

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

/**
 * Asegura que haya un tile de portal (en blanco, sin configurar) en esa
 * celda: si ya hay un portal ahí no hace nada; si hay un tile de otro tipo
 * lo reemplaza; si está vacía, lo crea. Usado para colocar la contraparte
 * de un portal bidireccional del lado del mapa destino.
 */
export const ensurePortalTile = (tiles: MapTile[], x: number, y: number): MapTile[] => {
  const idx = tiles.findIndex((t) => t.x === x && t.y === y);
  if (idx >= 0) {
    if (tiles[idx].type === 'portal') return tiles;
    const updated = [...tiles];
    updated[idx] = { x, y, type: 'portal' };
    return updated;
  }
  if (!inBounds(x, y)) return tiles;
  return [...tiles, { x, y, type: 'portal' }];
};

/**
 * Quita el portal en (x,y) SOLO si sigue apuntando de vuelta al origen
 * indicado (mismo layout y celda). Evita borrar un portal que el usuario ya
 * reconfiguró para conectar a otro lado. Usado para limpiar la contraparte
 * de un portal bidireccional cuando el lado opuesto se borra o se retarget.
 */
export const removeLinkedPortal = (
  tiles: MapTile[],
  x: number,
  y: number,
  linkedLayoutId: string,
  linkedX: number,
  linkedY: number
): MapTile[] =>
  tiles.filter(
    (t) =>
      !(
        t.x === x &&
        t.y === y &&
        t.type === 'portal' &&
        t.targetLayoutId === linkedLayoutId &&
        t.targetX === linkedX &&
        t.targetY === linkedY
      )
  );
