// ============================================================
// Tests del diagrama de conexiones entre mapas (utils/mapConnections.ts)
// ============================================================

import { describe, expect, it } from 'vitest';
import { portalDirection, buildMapDiagram } from '../utils/mapConnections';
import type { MapLayout } from '../utils/layoutPatterns';

const COLS = 10;
const ROWS = 8;

describe('portalDirection', () => {
  it('un portal contra el borde derecho apunta al Este', () => {
    expect(portalDirection(COLS - 1, 4, COLS, ROWS)).toBe('E');
  });

  it('un portal contra el borde izquierdo apunta al Oeste', () => {
    expect(portalDirection(0, 4, COLS, ROWS)).toBe('W');
  });

  it('un portal contra el borde superior apunta al Norte', () => {
    expect(portalDirection(5, 0, COLS, ROWS)).toBe('N');
  });

  it('un portal contra el borde inferior apunta al Sur', () => {
    expect(portalDirection(5, ROWS - 1, COLS, ROWS)).toBe('S');
  });
});

describe('buildMapDiagram', () => {
  it('devuelve vacío si el mapa de partida no existe en la lista', () => {
    expect(buildMapDiagram('missing', [])).toEqual({ nodes: [], edges: [] });
  });

  it('ubica una cadena de mapas siguiendo la dirección de cada portal', () => {
    const layouts: MapLayout[] = [
      { id: 'a', name: 'Mapa A', mapCols: COLS, mapRows: ROWS, tiles: [{ x: COLS - 1, y: 4, type: 'portal', targetLayoutId: 'b' }] },
      {
        id: 'b',
        name: 'Mapa B',
        mapCols: COLS,
        mapRows: ROWS,
        tiles: [
          { x: 0, y: 4, type: 'portal', targetLayoutId: 'a' },
          { x: COLS - 1, y: 4, type: 'portal', targetLayoutId: 'c' },
        ],
      },
      { id: 'c', name: 'Mapa C', mapCols: COLS, mapRows: ROWS, tiles: [{ x: 0, y: 4, type: 'portal', targetLayoutId: 'b' }] },
    ];

    const diagram = buildMapDiagram('a', layouts);

    const byId = Object.fromEntries(diagram.nodes.map((n) => [n.id, n]));
    expect(byId.a).toMatchObject({ col: 0, row: 0 });
    expect(byId.b).toMatchObject({ col: 1, row: 0 });
    expect(byId.c).toMatchObject({ col: 2, row: 0 });
    expect(diagram.edges).toHaveLength(2);
  });

  it('si dos portales apuntan a la misma celda, corre el segundo mapa más lejos en la misma dirección', () => {
    const layouts: MapLayout[] = [
      {
        id: 'a',
        name: 'Mapa A',
        mapCols: COLS,
        mapRows: ROWS,
        tiles: [
          { x: COLS - 1, y: 2, type: 'portal', targetLayoutId: 'b' },
          { x: COLS - 1, y: 5, type: 'portal', targetLayoutId: 'c' },
        ],
      },
      { id: 'b', name: 'Mapa B', mapCols: COLS, mapRows: ROWS, tiles: [] },
      { id: 'c', name: 'Mapa C', mapCols: COLS, mapRows: ROWS, tiles: [] },
    ];

    const diagram = buildMapDiagram('a', layouts);
    const byId = Object.fromEntries(diagram.nodes.map((n) => [n.id, n]));

    expect(byId.a).toMatchObject({ col: 0, row: 0 });
    expect(byId.b).toMatchObject({ col: 1, row: 0 });
    expect(byId.c).toMatchObject({ col: 2, row: 0 });
  });

  it('ignora un portal que apunta al mismo mapa (no genera arista ni intenta ubicarse)', () => {
    const layouts: MapLayout[] = [
      {
        id: 'a',
        name: 'Mapa A',
        mapCols: COLS,
        mapRows: ROWS,
        tiles: [{ x: COLS - 1, y: 4, type: 'portal', targetLayoutId: 'a', targetX: 0, targetY: 0 }],
      },
    ];
    const diagram = buildMapDiagram('a', layouts);
    expect(diagram.nodes).toEqual([{ id: 'a', name: 'Mapa A', col: 0, row: 0 }]);
    expect(diagram.edges).toEqual([]);
  });

  it('ignora un portal que apunta a un mapa que ya no existe', () => {
    const layouts: MapLayout[] = [
      { id: 'a', name: 'Mapa A', mapCols: COLS, mapRows: ROWS, tiles: [{ x: COLS - 1, y: 4, type: 'portal', targetLayoutId: 'mapa-borrado' }] },
    ];
    const diagram = buildMapDiagram('a', layouts);
    expect(diagram.nodes).toEqual([{ id: 'a', name: 'Mapa A', col: 0, row: 0 }]);
    expect(diagram.edges).toEqual([]);
  });

  it('el resultado no depende de qué mapa se usa como partida, aunque el portal de ida y el de vuelta miren a bordes distintos (bug reportado: el mismo grupo de mapas quedaba con una forma distinta según desde dónde se generaba el diagrama)', () => {
    // "forest" tiene su portal a "pasillo" contra el borde inferior (Sur);
    // "pasillo" tiene su portal a "forest" contra el borde izquierdo (Oeste)
    // en vez del borde superior que "correspondería" — a propósito, para
    // que las dos lecturas de dirección no coincidan y haya que desempatar.
    const layouts: MapLayout[] = [
      { id: 'forest', name: 'Forest', mapCols: COLS, mapRows: ROWS, tiles: [{ x: 5, y: ROWS - 1, type: 'portal', targetLayoutId: 'pasillo' }] },
      { id: 'pasillo', name: 'Pasillo', mapCols: COLS, mapRows: ROWS, tiles: [{ x: 0, y: 4, type: 'portal', targetLayoutId: 'forest' }] },
    ];

    const fromForest = buildMapDiagram('forest', layouts);
    const fromPasillo = buildMapDiagram('pasillo', layouts);

    const posA = Object.fromEntries(fromForest.nodes.map((n) => [n.id, n]));
    const posB = Object.fromEntries(fromPasillo.nodes.map((n) => [n.id, n]));

    const offsetFromForestStart = {
      col: posA.pasillo.col - posA.forest.col,
      row: posA.pasillo.row - posA.forest.row,
    };
    const offsetFromPasilloStart = {
      col: posB.pasillo.col - posB.forest.col,
      row: posB.pasillo.row - posB.forest.row,
    };

    expect(offsetFromPasilloStart).toEqual(offsetFromForestStart);
  });

  it('cuando el portal de ida y el de vuelta coinciden en dirección, esa dirección se usa sin importar el desempate', () => {
    const layouts: MapLayout[] = [
      { id: 'a', name: 'Mapa A', mapCols: COLS, mapRows: ROWS, tiles: [{ x: COLS - 1, y: 4, type: 'portal', targetLayoutId: 'b' }] },
      { id: 'b', name: 'Mapa B', mapCols: COLS, mapRows: ROWS, tiles: [{ x: 0, y: 4, type: 'portal', targetLayoutId: 'a' }] },
    ];
    const diagram = buildMapDiagram('a', layouts);
    const byId = Object.fromEntries(diagram.nodes.map((n) => [n.id, n]));
    expect(byId.b).toMatchObject({ col: 1, row: 0 });
  });

  it('un mapa sin mapCols/mapRows guardado (layout viejo) usa el tamaño por defecto en vez de romper', () => {
    const layouts: MapLayout[] = [
      { id: 'a', name: 'Mapa A', tiles: [{ x: 27, y: 4, type: 'portal', targetLayoutId: 'b' }] },
      { id: 'b', name: 'Mapa B', tiles: [{ x: 0, y: 4, type: 'portal', targetLayoutId: 'a' }] },
    ];
    const diagram = buildMapDiagram('a', layouts);
    const byId = Object.fromEntries(diagram.nodes.map((n) => [n.id, n]));
    expect(byId.b).toMatchObject({ col: 1, row: 0 });
  });

  it('respeta el tamaño propio de cada mapa: dos mapas de tamaños muy distintos igual se ubican por el borde de su propio portal', () => {
    // "chico" es 20×12 y su portal está pegado al borde derecho (columna
    // 19 de 20): con el tamaño de "grande" (44×24) esa misma columna caería
    // cerca del centro y se leería como una dirección distinta. Cada mapa
    // debe normalizarse contra SU PROPIO tamaño.
    const layouts: MapLayout[] = [
      {
        id: 'chico',
        name: 'Mapa chico',
        mapCols: 20,
        mapRows: 12,
        tiles: [{ x: 19, y: 6, type: 'portal', targetLayoutId: 'grande' }],
      },
      {
        id: 'grande',
        name: 'Mapa grande',
        mapCols: 44,
        mapRows: 24,
        tiles: [{ x: 0, y: 12, type: 'portal', targetLayoutId: 'chico' }],
      },
    ];
    const diagram = buildMapDiagram('chico', layouts);
    const byId = Object.fromEntries(diagram.nodes.map((n) => [n.id, n]));
    expect(byId.grande).toMatchObject({ col: 1, row: 0 });
  });
});
