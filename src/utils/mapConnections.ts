// ============================================================
// Diagrama de conexiones entre mapas guardados (portales). Dado un mapa
// de partida, calcula la posición relativa (en una cuadrícula de mapas,
// no de celdas) de todos los mapas conectados a él por portales, siguiendo
// el borde donde está cada portal: uno pegado al borde derecho ubica al
// mapa vecino a la derecha, uno pegado abajo lo ubica abajo, etc.
// ============================================================

import type { MapLayout } from './layoutPatterns';
import { restoreTilesFromLayout } from './layoutPatterns';

export type CardinalDir = 'N' | 'S' | 'E' | 'W';

const DIR_OFFSET: Record<CardinalDir, { dc: number; dr: number }> = {
  N: { dc: 0, dr: -1 },
  S: { dc: 0, dr: 1 },
  E: { dc: 1, dr: 0 },
  W: { dc: -1, dr: 0 },
};

/**
 * Dirección del mapa vecino según en qué borde de la cuadrícula está el
 * portal: el eje con mayor desviación del centro manda (un portal contra el
 * borde derecho apunta al Este, uno contra el borde inferior apunta al Sur).
 * Ante un empate exacto entre ambos ejes, prioriza el horizontal.
 */
export const portalDirection = (x: number, y: number, cols: number, rows: number): CardinalDir => {
  const nx = cols > 1 ? x / (cols - 1) - 0.5 : 0;
  const ny = rows > 1 ? y / (rows - 1) - 0.5 : 0;
  if (Math.abs(nx) >= Math.abs(ny)) {
    return nx >= 0 ? 'E' : 'W';
  }
  return ny >= 0 ? 'S' : 'N';
};

export interface MapDiagramNode {
  id: string;
  name: string;
  col: number;
  row: number;
}

export interface MapDiagramEdge {
  a: string;
  b: string;
  label?: string;
}

export interface MapDiagram {
  nodes: MapDiagramNode[];
  edges: MapDiagramEdge[];
}

/**
 * Calcula el grupo de mapas conectados (directa o indirectamente) al mapa
 * de partida por portales, con una posición de cuadrícula (col, row) para
 * cada uno. Si dos mapas terminarían en la misma celda, el segundo se
 * corre en la misma dirección hasta encontrar una celda libre.
 */
export const buildMapDiagram = (
  startId: string,
  layouts: MapLayout[],
  cols: number,
  rows: number
): MapDiagram => {
  const byId = new Map(layouts.map((l) => [l.id, l]));
  if (!byId.has(startId)) return { nodes: [], edges: [] };

  const positions = new Map<string, { col: number; row: number }>();
  const occupied = new Map<string, string>();
  const edgeKeys = new Set<string>();
  const edges: MapDiagramEdge[] = [];

  const place = (id: string, col: number, row: number) => {
    positions.set(id, { col, row });
    occupied.set(`${col},${row}`, id);
  };
  place(startId, 0, 0);

  const findFreeCell = (fromCol: number, fromRow: number, dir: CardinalDir): { col: number; row: number } => {
    const { dc, dr } = DIR_OFFSET[dir];
    const maxSteps = layouts.length + 1;
    for (let step = 1; step <= maxSteps; step++) {
      const col = fromCol + dc * step;
      const row = fromRow + dr * step;
      if (!occupied.has(`${col},${row}`)) return { col, row };
    }
    return { col: fromCol + dc, row: fromRow + dr };
  };

  const visited = new Set<string>([startId]);
  const queue: string[] = [startId];

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const layout = byId.get(currentId);
    const pos = positions.get(currentId);
    if (!layout || !pos) continue;

    const portals = restoreTilesFromLayout(layout).filter(
      (t) => t.type === 'portal' && !!t.targetLayoutId && t.targetLayoutId !== currentId
    );

    for (const portal of portals) {
      const targetId = portal.targetLayoutId as string;
      if (!byId.has(targetId)) continue; // portal a un mapa que ya no existe

      const edgeKey = [currentId, targetId].sort().join('|');
      if (!edgeKeys.has(edgeKey)) {
        edgeKeys.add(edgeKey);
        edges.push({ a: currentId, b: targetId, label: portal.label });
      }

      if (visited.has(targetId)) continue;
      visited.add(targetId);

      const dir = portalDirection(portal.x, portal.y, cols, rows);
      const { dc, dr } = DIR_OFFSET[dir];
      let col = pos.col + dc;
      let row = pos.row + dr;
      if (occupied.has(`${col},${row}`)) {
        ({ col, row } = findFreeCell(pos.col, pos.row, dir));
      }
      place(targetId, col, row);
      queue.push(targetId);
    }
  }

  const nodes: MapDiagramNode[] = Array.from(positions.entries()).map(([id, { col, row }]) => ({
    id,
    name: byId.get(id)?.name ?? '(mapa eliminado)',
    col,
    row,
  }));

  return { nodes, edges };
};
