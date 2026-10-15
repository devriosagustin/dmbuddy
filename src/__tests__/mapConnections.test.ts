// ============================================================
// Tests del diagrama de conexiones entre mapas (utils/mapConnections.ts)
// ============================================================

import { describe, expect, it } from 'vitest';
import { portalDirection, buildMapDiagram } from '../utils/mapConnections';
import type { MapLayout } from '../utils/layoutPatterns';

const COLS = 10;
const ROWS = 8;

describe('portalDirection', () => {
  it('un portal contra el borde derecho, centrado verticalmente, apunta al Este', () => {
    expect(portalDirection(COLS - 1, 4, COLS, ROWS)).toBe('E');
  });

  it('un portal contra el borde izquierdo, centrado verticalmente, apunta al Oeste', () => {
    expect(portalDirection(0, 4, COLS, ROWS)).toBe('W');
  });

  it('un portal contra el borde superior, centrado horizontalmente, apunta al Norte', () => {
    expect(portalDirection(5, 0, COLS, ROWS)).toBe('N');
  });

  it('un portal contra el borde inferior, centrado horizontalmente, apunta al Sur', () => {
    expect(portalDirection(5, ROWS - 1, COLS, ROWS)).toBe('S');
  });

  it('un portal en la esquina superior izquierda apunta al Noroeste', () => {
    expect(portalDirection(0, 0, COLS, ROWS)).toBe('NW');
  });

  it('un portal en la esquina superior derecha apunta al Noreste', () => {
    expect(portalDirection(COLS - 1, 0, COLS, ROWS)).toBe('NE');
  });

  it('un portal en la esquina inferior izquierda apunta al Suroeste', () => {
    expect(portalDirection(0, ROWS - 1, COLS, ROWS)).toBe('SW');
  });

  it('un portal en la esquina inferior derecha apunta al Sureste', () => {
    expect(portalDirection(COLS - 1, ROWS - 1, COLS, ROWS)).toBe('SE');
  });

  it('un portal pegado al borde derecho pero también claramente hacia el tercio superior es diagonal (Noreste), no puro Este', () => {
    // Con el sistema anterior (4 direcciones, eje dominante) esto daba 'E'
    // porque |nx| > |ny|; con las 8 secciones, caer en el tercio superior
    // Y en el tercio derecho a la vez ya alcanza para clasificarlo como
    // esquina, aunque un eje esté más pegado al borde que el otro.
    expect(portalDirection(COLS - 1, 1, COLS, ROWS)).toBe('NE');
  });

  it('un portal en el tercio central de ambos ejes (sin sección de borde propia) desempata por el eje más desviado, a favor del horizontal en un empate exacto', () => {
    // Grilla 9×9 para tener un centro exacto (índice 4 de 0 a 8 en ambos ejes).
    expect(portalDirection(4, 4, 9, 9)).toBe('E');
  });

  it('un mapa de una sola columna o una sola fila no rompe la clasificación (ese eje queda siempre en el tercio central)', () => {
    expect(portalDirection(0, 0, 1, ROWS)).toBe('N');
    expect(portalDirection(0, ROWS - 1, 1, ROWS)).toBe('S');
    expect(portalDirection(0, 0, COLS, 1)).toBe('W');
    expect(portalDirection(COLS - 1, 0, COLS, 1)).toBe('E');
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
          // y=3 e y=4 caen dentro del tercio central vertical (con ROWS=8,
          // el centro va de y≈2.3 a y≈4.7), así que ambos portales dan
          // dirección Este pura (no diagonal) y sí colisionan en la misma
          // celda, que es lo que este test quiere ejercitar.
          { x: COLS - 1, y: 3, type: 'portal', targetLayoutId: 'b' },
          { x: COLS - 1, y: 4, type: 'portal', targetLayoutId: 'c' },
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
    // y=7 cae en el tercio central vertical del default 28×16 (tercio
    // central ≈ filas 5.3 a 10.7), así que la dirección da Este/Oeste
    // puros — este test es sobre el fallback de tamaño, no sobre esquinas.
    const layouts: MapLayout[] = [
      { id: 'a', name: 'Mapa A', tiles: [{ x: 27, y: 7, type: 'portal', targetLayoutId: 'b' }] },
      { id: 'b', name: 'Mapa B', tiles: [{ x: 0, y: 7, type: 'portal', targetLayoutId: 'a' }] },
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

  it('un portal en una esquina ubica al mapa vecino en diagonal (col y row se mueven juntas)', () => {
    const layouts: MapLayout[] = [
      { id: 'a', name: 'Mapa A', mapCols: COLS, mapRows: ROWS, tiles: [{ x: COLS - 1, y: 0, type: 'portal', targetLayoutId: 'b' }] },
      { id: 'b', name: 'Mapa B', mapCols: COLS, mapRows: ROWS, tiles: [{ x: 0, y: ROWS - 1, type: 'portal', targetLayoutId: 'a' }] },
    ];
    const diagram = buildMapDiagram('a', layouts);
    const byId = Object.fromEntries(diagram.nodes.map((n) => [n.id, n]));
    // Portal de ida en la esquina superior derecha de "a" → Noreste.
    expect(byId.b).toMatchObject({ col: 1, row: -1 });
  });

  it('una cadena de 4 mapas por las 4 esquinas forma un cuadrado en el diagrama, no una línea', () => {
    const layouts: MapLayout[] = [
      {
        id: 'a',
        name: 'Mapa A',
        mapCols: COLS,
        mapRows: ROWS,
        tiles: [{ x: COLS - 1, y: 0, type: 'portal', targetLayoutId: 'b' }], // NE
      },
      {
        id: 'b',
        name: 'Mapa B',
        mapCols: COLS,
        mapRows: ROWS,
        tiles: [{ x: COLS - 1, y: ROWS - 1, type: 'portal', targetLayoutId: 'c' }], // SE
      },
      {
        id: 'c',
        name: 'Mapa C',
        mapCols: COLS,
        mapRows: ROWS,
        tiles: [{ x: 0, y: ROWS - 1, type: 'portal', targetLayoutId: 'd' }], // SW
      },
      {
        id: 'd',
        name: 'Mapa D',
        mapCols: COLS,
        mapRows: ROWS,
        tiles: [{ x: 0, y: 0, type: 'portal', targetLayoutId: 'a' }], // NW
      },
    ];
    const diagram = buildMapDiagram('a', layouts);
    const byId = Object.fromEntries(diagram.nodes.map((n) => [n.id, n]));
    expect(byId.a).toMatchObject({ col: 0, row: 0 });
    expect(byId.b).toMatchObject({ col: 1, row: -1 });
    expect(byId.c).toMatchObject({ col: 2, row: 0 });
    expect(byId.d).toMatchObject({ col: 1, row: 1 });
  });

  it('si dos portales en esquina apuntan a la misma celda diagonal, corre el segundo mapa más lejos en esa misma diagonal', () => {
    const layouts: MapLayout[] = [
      {
        id: 'a',
        name: 'Mapa A',
        mapCols: COLS,
        mapRows: ROWS,
        tiles: [
          { x: COLS - 1, y: 0, type: 'portal', targetLayoutId: 'b' }, // NE
          { x: COLS - 1, y: 1, type: 'portal', targetLayoutId: 'c' }, // también NE (ver test de portalDirection)
        ],
      },
      { id: 'b', name: 'Mapa B', mapCols: COLS, mapRows: ROWS, tiles: [] },
      { id: 'c', name: 'Mapa C', mapCols: COLS, mapRows: ROWS, tiles: [] },
    ];
    const diagram = buildMapDiagram('a', layouts);
    const byId = Object.fromEntries(diagram.nodes.map((n) => [n.id, n]));
    expect(byId.a).toMatchObject({ col: 0, row: 0 });
    expect(byId.b).toMatchObject({ col: 1, row: -1 });
    expect(byId.c).toMatchObject({ col: 2, row: -2 });
  });
});
