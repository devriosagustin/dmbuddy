// ============================================================
// Diagrama de conexiones entre mapas guardados (portales). Dado un mapa
// de partida, calcula la posición relativa (en una cuadrícula de mapas,
// no de celdas) de todos los mapas conectados a él por portales, siguiendo
// el borde donde está cada portal: uno pegado al borde derecho ubica al
// mapa vecino a la derecha, uno pegado abajo lo ubica abajo, etc.
//
// La dirección de cada conexión se calcula combinando el portal de ida Y
// el de vuelta (si ambos existen, que es el caso normal porque los
// portales son bidireccionales) para que el resultado NO dependa de cuál
// de los dos mapas se usó como punto de partida: cada portal se coloca
// donde tiene sentido dentro de SU propio mapa, así que el de ida y el de
// vuelta no necesariamente quedan en bordes "opuestos" entre sí — sin este
// desempate, generar el diagrama desde un mapa u otro podía dar formas
// distintas para el mismo grupo de mapas.
//
// Cada mapa guardado puede tener su propio tamaño (mapCols/mapRows en
// MapLayout); todo el cálculo de dirección normaliza la posición de un
// portal contra el tamaño de SU PROPIO mapa (layoutDims), nunca contra un
// tamaño compartido — así el diagrama no se rompe al mezclar mapas chicos
// y grandes.
// ============================================================

import type { MapLayout } from './layoutPatterns';
import { restoreTilesFromLayout } from './layoutPatterns';
import { MAP_COLS, MAP_ROWS } from './mapUtils';

/** Tamaño propio de un layout, o el default si nunca se le asignó uno. */
export const layoutDims = (layout: MapLayout | undefined): { cols: number; rows: number } => ({
  cols: layout?.mapCols ?? MAP_COLS,
  rows: layout?.mapRows ?? MAP_ROWS,
});

export type CardinalDir = 'N' | 'S' | 'E' | 'W';

const DIR_OFFSET: Record<CardinalDir, { dc: number; dr: number }> = {
  N: { dc: 0, dr: -1 },
  S: { dc: 0, dr: 1 },
  E: { dc: 1, dr: 0 },
  W: { dc: -1, dr: 0 },
};

const OPPOSITE_DIR: Record<CardinalDir, CardinalDir> = { N: 'S', S: 'N', E: 'W', W: 'E' };

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

/** Qué tan pegado a un borde está un portal (0 = centro del mapa, 0.5 = borde exacto). */
const edgeConfidence = (x: number, y: number, cols: number, rows: number): number => {
  const nx = cols > 1 ? x / (cols - 1) - 0.5 : 0;
  const ny = rows > 1 ? y / (rows - 1) - 0.5 : 0;
  return Math.max(Math.abs(nx), Math.abs(ny));
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

interface PortalLink {
  x: number;
  y: number;
  label?: string;
}

/** Por cada mapa, sus portales hacia otros mapas (ignora auto-portales y destinos inexistentes en `byId`). */
const collectPortalLinks = (layouts: MapLayout[]): Map<string, Map<string, PortalLink>> => {
  const result = new Map<string, Map<string, PortalLink>>();
  for (const layout of layouts) {
    const links = new Map<string, PortalLink>();
    for (const tile of restoreTilesFromLayout(layout)) {
      if (tile.type !== 'portal' || !tile.targetLayoutId || tile.targetLayoutId === layout.id) continue;
      if (!links.has(tile.targetLayoutId)) {
        links.set(tile.targetLayoutId, { x: tile.x, y: tile.y, label: tile.label });
      }
    }
    result.set(layout.id, links);
  }
  return result;
};

/**
 * Dirección canónica de `bId` respecto de `aId`, combinando el portal de
 * `aId` hacia `bId` con el de `bId` hacia `aId` (si ambos existen). Cuando
 * coinciden (lo normal), usa esa. Cuando no, confía en el que está más
 * pegado a un borde de su mapa (señal más clara); si también empatan eso,
 * desempata por id para que el resultado sea siempre el mismo sin importar
 * desde qué mapa se generó el diagrama.
 */
const resolveDirection = (
  aId: string,
  bId: string,
  links: Map<string, Map<string, PortalLink>>,
  byId: Map<string, MapLayout>
): CardinalDir => {
  const aToB = links.get(aId)?.get(bId);
  const bToA = links.get(bId)?.get(aId);

  // Cada portal se normaliza contra el tamaño de SU PROPIO mapa: el punto
  // (x,y) de un portal en un mapa de 44×24 no significa lo mismo que el
  // mismo (x,y) en uno de 20×12, así que mezclar un tamaño compartido acá
  // daba direcciones erróneas apenas dos mapas conectados tenían tamaños
  // distintos.
  const aDims = layoutDims(byId.get(aId));
  const bDims = layoutDims(byId.get(bId));

  const dirFromA = aToB ? portalDirection(aToB.x, aToB.y, aDims.cols, aDims.rows) : undefined;
  const dirFromB = bToA ? OPPOSITE_DIR[portalDirection(bToA.x, bToA.y, bDims.cols, bDims.rows)] : undefined;

  if (dirFromA && dirFromB) {
    if (dirFromA === dirFromB) return dirFromA;
    const confA = edgeConfidence(aToB!.x, aToB!.y, aDims.cols, aDims.rows);
    const confB = edgeConfidence(bToA!.x, bToA!.y, bDims.cols, bDims.rows);
    if (confA !== confB) return confA > confB ? dirFromA : dirFromB;
    return aId < bId ? dirFromA : dirFromB;
  }
  return (dirFromA ?? dirFromB) as CardinalDir;
};

/**
 * Calcula el grupo de mapas conectados (directa o indirectamente) al mapa
 * de partida por portales, con una posición de cuadrícula (col, row) para
 * cada uno. Si dos mapas terminarían en la misma celda, el segundo se
 * corre en la misma dirección hasta encontrar una celda libre.
 */
export const buildMapDiagram = (startId: string, layouts: MapLayout[]): MapDiagram => {
  const byId = new Map(layouts.map((l) => [l.id, l]));
  if (!byId.has(startId)) return { nodes: [], edges: [] };

  const links = collectPortalLinks(layouts);

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
    const pos = positions.get(currentId);
    const currentLinks = links.get(currentId);
    if (!pos || !currentLinks) continue;

    for (const [targetId, link] of currentLinks) {
      if (!byId.has(targetId)) continue; // portal a un mapa que ya no existe

      const edgeKey = [currentId, targetId].sort().join('|');
      if (!edgeKeys.has(edgeKey)) {
        edgeKeys.add(edgeKey);
        edges.push({ a: currentId, b: targetId, label: link.label });
      }

      if (visited.has(targetId)) continue;
      visited.add(targetId);

      const dir = resolveDirection(currentId, targetId, links, byId);
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
