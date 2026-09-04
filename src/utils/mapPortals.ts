// ============================================================
// Conexiones entre mapas: detecta si una casilla es un portal
// configurado (con mapa destino) para disparar el cruce automático
// cuando un miembro del party la pisa.
// ============================================================

import type { MapTile } from '../types';

/**
 * Busca un tile de tipo "portal" con mapa destino ya configurado en una
 * celda dada. Un portal recién colocado (sin targetLayoutId todavía) no
 * cuenta: no dispara el cruce hasta que el DM elige a qué mapa conecta.
 */
export const findConfiguredPortal = (tiles: MapTile[], x: number, y: number): MapTile | undefined =>
  tiles.find((t) => t.x === x && t.y === y && t.type === 'portal' && !!t.targetLayoutId);
