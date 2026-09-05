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
    expect(buildMapDiagram('missing', [], COLS, ROWS)).toEqual({ nodes: [], edges: [] });
  });

  it('ubica una cadena de mapas siguiendo la dirección de cada portal', () => {
    const layouts: MapLayout[] = [
      { id: 'a', name: 'Mapa A', tiles: [{ x: COLS - 1, y: 4, type: 'portal', targetLayoutId: 'b' }] },
      {
        id: 'b',
        name: 'Mapa B',
        tiles: [
          { x: 0, y: 4, type: 'portal', targetLayoutId: 'a' },
          { x: COLS - 1, y: 4, type: 'portal', targetLayoutId: 'c' },
        ],
      },
      { id: 'c', name: 'Mapa C', tiles: [{ x: 0, y: 4, type: 'portal', targetLayoutId: 'b' }] },
    ];

    const diagram = buildMapDiagram('a', layouts, COLS, ROWS);

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
        tiles: [
          { x: COLS - 1, y: 2, type: 'portal', targetLayoutId: 'b' },
          { x: COLS - 1, y: 5, type: 'portal', targetLayoutId: 'c' },
        ],
      },
      { id: 'b', name: 'Mapa B', tiles: [] },
      { id: 'c', name: 'Mapa C', tiles: [] },
    ];

    const diagram = buildMapDiagram('a', layouts, COLS, ROWS);
    const byId = Object.fromEntries(diagram.nodes.map((n) => [n.id, n]));

    expect(byId.a).toMatchObject({ col: 0, row: 0 });
    expect(byId.b).toMatchObject({ col: 1, row: 0 });
    expect(byId.c).toMatchObject({ col: 2, row: 0 });
  });

  it('ignora un portal que apunta al mismo mapa (no genera arista ni intenta ubicarse)', () => {
    const layouts: MapLayout[] = [
      { id: 'a', name: 'Mapa A', tiles: [{ x: COLS - 1, y: 4, type: 'portal', targetLayoutId: 'a', targetX: 0, targetY: 0 }] },
    ];
    const diagram = buildMapDiagram('a', layouts, COLS, ROWS);
    expect(diagram.nodes).toEqual([{ id: 'a', name: 'Mapa A', col: 0, row: 0 }]);
    expect(diagram.edges).toEqual([]);
  });

  it('ignora un portal que apunta a un mapa que ya no existe', () => {
    const layouts: MapLayout[] = [
      { id: 'a', name: 'Mapa A', tiles: [{ x: COLS - 1, y: 4, type: 'portal', targetLayoutId: 'mapa-borrado' }] },
    ];
    const diagram = buildMapDiagram('a', layouts, COLS, ROWS);
    expect(diagram.nodes).toEqual([{ id: 'a', name: 'Mapa A', col: 0, row: 0 }]);
    expect(diagram.edges).toEqual([]);
  });
});
