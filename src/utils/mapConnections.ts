// ============================================================
// Diagrama de conexiones entre mapas guardados (portales). Dado un mapa
// de partida, calcula la posición relativa (en una cuadrícula de mapas,
// no de celdas) de todos los mapas conectados a él por portales, siguiendo
// la sección del mapa donde está cada portal: la cuadrícula de CADA mapa
// se divide en 3×3 y se usan las 8 secciones exteriores (esquinas y
// centros de borde) para ubicar al vecino — un portal pegado al borde
// derecho (centro) ubica al mapa vecino a la Este, uno en la esquina
// superior derecha lo ubica al Noreste, etc. Esto le da al diagrama
// resolución diagonal además de la ortogonal N/S/E/W.
//
// La dirección de cada conexión se calcula combinando el portal de ida Y
// el de vuelta (si ambos existen, que es el caso normal porque los
// portales son bidireccionales) para que el resultado NO dependa de cuál
// de los dos mapas se usó como punto de partida: cada portal se coloca
// donde tiene sentido dentro de SU propio mapa, así que el de ida y el de
// vuelta no necesariamente quedan en secciones "opuestas" entre sí — sin
// este desempate, generar el diagrama desde un mapa u otro podía dar
// formas distintas para el mismo grupo de mapas.
//
// Cada mapa guardado puede tener su propio tamaño (mapCols/mapRows en
// MapLayout); todo el cálculo de dirección normaliza la posición de un
// portal contra el tamaño de SU PROPIO mapa (layoutDims), nunca contra un
// tamaño compartido — así el diagrama no se rompe al mezclar mapas chicos
// y grandes, ni con mapas de una sola fila/columna.
// ============================================================

import type { MapLayout } from './layoutPatterns';
import { restoreTilesFromLayout } from './layoutPatterns';
import { MAP_COLS, MAP_ROWS } from './mapUtils';

/** Tamaño propio de un layout, o el default si nunca se le asignó uno. */
export const layoutDims = (layout: MapLayout | undefined): { cols: number; rows: number } => ({
  cols: layout?.mapCols ?? MAP_COLS,
  rows: layout?.mapRows ?? MAP_ROWS,
});

export type CardinalDir = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW';

const DIR_OFFSET: Record<CardinalDir, { dc: number; dr: number }> = {
  N: { dc: 0, dr: -1 },
  S: { dc: 0, dr: 1 },
  E: { dc: 1, dr: 0 },
  W: { dc: -1, dr: 0 },
  NE: { dc: 1, dr: -1 },
  NW: { dc: -1, dr: -1 },
  SE: { dc: 1, dr: 1 },
  SW: { dc: -1, dr: 1 },
};

const OPPOSITE_DIR: Record<CardinalDir, CardinalDir> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
  NE: 'SW',
  SW: 'NE',
  NW: 'SE',
  SE: 'NW',
};

/**
 * Ancho del tercio central de cada eje (de -0.5 a 0.5, dividido en 3 partes
 * iguales: el tercio del medio va de -THIRD a +THIRD).
 */
const THIRD = 1 / 6;

/** Posición normalizada de un eje: -0.5 (borde "de arriba/izquierda") a 0.5 (borde "de abajo/derecha"), 0 = centro. */
const normalizedAxis = (value: number, size: number): number => (size > 1 ? value / (size - 1) - 0.5 : 0);

/** -1 = tercio "de arriba/izquierda" del eje, 1 = tercio "de abajo/derecha", 0 = tercio central. */
const axisBand = (n: number): -1 | 0 | 1 => (n <= -THIRD ? -1 : n >= THIRD ? 1 : 0);

/**
 * Dirección del mapa vecino según en cuál de las 8 secciones exteriores de
 * una cuadrícula 3×3 cae el portal (esquina superior izquierda, centro
 * superior, esquina superior derecha, centro izquierda, centro derecha,
 * esquina inferior izquierda, centro inferior, esquina inferior derecha):
 * cada eje (x e y) se divide en 3 tercios iguales, y combinar el tercio de
 * cada eje da la sección — dos tercios "de esquina" (uno por eje) dan una
 * dirección diagonal, un tercio central en un eje junto con uno "de borde"
 * en el otro da una dirección ortogonal.
 *
 * Un portal que cae en el tercio central de AMBOS ejes (el noveno cuadro,
 * sin sección de borde propia) no tiene una de las 8 direcciones asignada
 * directamente: para seguir dando un resultado determinístico se usa el
 * mismo criterio que antes de tener secciones (el eje con mayor desviación
 * del centro manda; empate a favor del horizontal).
 */
export const portalDirection = (x: number, y: number, cols: number, rows: number): CardinalDir => {
  const nx = normalizedAxis(x, cols);
  const ny = normalizedAxis(y, rows);
  const bx = axisBand(nx);
  const by = axisBand(ny);

  if (bx === 0 && by === 0) {
    if (Math.abs(nx) >= Math.abs(ny)) return nx >= 0 ? 'E' : 'W';
    return ny >= 0 ? 'S' : 'N';
  }
  if (bx === 0) return by < 0 ? 'N' : 'S';
  if (by === 0) return bx < 0 ? 'W' : 'E';
  if (bx < 0) return by < 0 ? 'NW' : 'SW';
  return by < 0 ? 'NE' : 'SE';
};

/** Qué tan pegado a un borde o esquina está un portal (0 = centro del mapa, ~0.5 = borde/esquina exacta). */
const edgeConfidence = (x: number, y: number, cols: number, rows: number): number => {
  const nx = normalizedAxis(x, cols);
  const ny = normalizedAxis(y, rows);
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
