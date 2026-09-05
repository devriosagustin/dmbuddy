// ============================================================
// Tests de edición pura de tiles (usada por la biblioteca de mapas
// para editar un layout guardado sin tocar el mapa en vivo)
// ============================================================

import { afterEach, describe, expect, it } from 'vitest';
import {
  toggleDraftTile,
  removeDraftTileAt,
  applyPortalUpdate,
  ensurePortalTile,
  removeLinkedPortal,
  paintDraftTile,
  moveDraftTile,
} from '../utils/tileDraft';
import { activeCols, activeRows, setActiveMapSize } from '../utils/mapUtils';
import type { MapTile } from '../types';

describe('toggleDraftTile', () => {
  it('coloca un tile nuevo en una celda vacía', () => {
    const tiles = toggleDraftTile([], 2, 3, 'wall');
    expect(tiles).toEqual([{ x: 2, y: 3, type: 'wall' }]);
  });

  it('quita el tile si ya había uno del mismo tipo', () => {
    const tiles = toggleDraftTile([{ x: 2, y: 3, type: 'wall' }], 2, 3, 'wall');
    expect(tiles).toEqual([]);
  });

  it('reemplaza el tile si había uno de otro tipo', () => {
    const tiles = toggleDraftTile([{ x: 2, y: 3, type: 'wall' }], 2, 3, 'trap');
    expect(tiles).toEqual([{ x: 2, y: 3, type: 'trap' }]);
  });

  it('una puerta nace cerrada y alterna abierta/cerrada en vez de desaparecer', () => {
    let tiles: MapTile[] = toggleDraftTile([], 1, 1, 'door');
    expect(tiles).toEqual([{ x: 1, y: 1, type: 'door', open: false }]);

    tiles = toggleDraftTile(tiles, 1, 1, 'door');
    expect(tiles[0].open).toBe(true);

    tiles = toggleDraftTile(tiles, 1, 1, 'door');
    expect(tiles[0].open).toBe(false);
  });

  it('ignora celdas fuera de los límites activos del mapa', () => {
    const tiles = toggleDraftTile([], -1, 0, 'wall');
    expect(tiles).toEqual([]);
  });

  it('no toca un portal existente si se usa otra herramienta de tile', () => {
    const tiles: MapTile[] = [{ x: 2, y: 3, type: 'portal', targetLayoutId: 'l1', targetX: 0, targetY: 0 }];
    expect(toggleDraftTile(tiles, 2, 3, 'wall')).toBe(tiles);
  });
});

describe('removeDraftTileAt', () => {
  it('quita cualquier tile en la celda sin importar el tipo', () => {
    const tiles = removeDraftTileAt([{ x: 1, y: 1, type: 'portal', targetLayoutId: 'l1' }], 1, 1);
    expect(tiles).toEqual([]);
  });

  it('no afecta otras celdas', () => {
    const tiles = removeDraftTileAt(
      [
        { x: 1, y: 1, type: 'wall' },
        { x: 2, y: 2, type: 'trap' },
      ],
      1,
      1
    );
    expect(tiles).toEqual([{ x: 2, y: 2, type: 'trap' }]);
  });
});

describe('applyPortalUpdate', () => {
  it('actualiza el mapa destino de un portal existente', () => {
    const tiles: MapTile[] = [{ x: 3, y: 4, type: 'portal' }];
    const updated = applyPortalUpdate(tiles, 3, 4, { targetLayoutId: 'l2', targetX: 1, targetY: 1 });
    expect(updated[0].targetLayoutId).toBe('l2');
    expect(updated[0].targetX).toBe(1);
  });

  it('no afecta celdas que no son un portal', () => {
    const tiles: MapTile[] = [{ x: 3, y: 4, type: 'wall' }];
    const updated = applyPortalUpdate(tiles, 3, 4, { targetLayoutId: 'l2' });
    expect(updated[0]).toEqual({ x: 3, y: 4, type: 'wall' });
  });
});

describe('ensurePortalTile', () => {
  it('coloca un portal en blanco en una celda vacía', () => {
    const tiles = ensurePortalTile([], 2, 2);
    expect(tiles).toEqual([{ x: 2, y: 2, type: 'portal' }]);
  });

  it('no toca la celda si ya hay un portal (configurado o no)', () => {
    const tiles: MapTile[] = [{ x: 2, y: 2, type: 'portal', targetLayoutId: 'l1', targetX: 0, targetY: 0 }];
    expect(ensurePortalTile(tiles, 2, 2)).toBe(tiles);
  });

  it('reemplaza un tile de otro tipo por un portal en blanco', () => {
    const tiles = ensurePortalTile([{ x: 2, y: 2, type: 'wall' }], 2, 2);
    expect(tiles).toEqual([{ x: 2, y: 2, type: 'portal' }]);
  });

  it('ignora celdas fuera de los límites activos del mapa', () => {
    expect(ensurePortalTile([], -1, 0)).toEqual([]);
  });
});

describe('removeLinkedPortal', () => {
  it('quita el portal si sigue apuntando de vuelta al origen indicado', () => {
    const tiles: MapTile[] = [{ x: 5, y: 5, type: 'portal', targetLayoutId: 'origin', targetX: 1, targetY: 1 }];
    expect(removeLinkedPortal(tiles, 5, 5, 'origin', 1, 1)).toEqual([]);
  });

  it('no quita nada si el portal fue reconfigurado a otro destino', () => {
    const tiles: MapTile[] = [{ x: 5, y: 5, type: 'portal', targetLayoutId: 'otro-mapa', targetX: 3, targetY: 3 }];
    expect(removeLinkedPortal(tiles, 5, 5, 'origin', 1, 1)).toEqual(tiles);
  });

  it('no afecta tiles que no son portal', () => {
    const tiles: MapTile[] = [{ x: 5, y: 5, type: 'wall' }];
    expect(removeLinkedPortal(tiles, 5, 5, 'origin', 1, 1)).toEqual(tiles);
  });
});

describe('paintDraftTile', () => {
  it('modo "add": coloca el tile si la celda está vacía', () => {
    const tiles = paintDraftTile([], 2, 2, 'wall', 'add');
    expect(tiles).toEqual([{ x: 2, y: 2, type: 'wall' }]);
  });

  it('modo "add": es idempotente, repetir la misma celda no la altera', () => {
    const tiles: MapTile[] = [{ x: 2, y: 2, type: 'wall' }];
    expect(paintDraftTile(tiles, 2, 2, 'wall', 'add')).toBe(tiles);
  });

  it('modo "add": reemplaza un tile de otro tipo', () => {
    const tiles = paintDraftTile([{ x: 2, y: 2, type: 'trap' }], 2, 2, 'wall', 'add');
    expect(tiles).toEqual([{ x: 2, y: 2, type: 'wall' }]);
  });

  it('modo "remove": quita el tile si está presente', () => {
    const tiles = paintDraftTile([{ x: 2, y: 2, type: 'wall' }], 2, 2, 'wall', 'remove');
    expect(tiles).toEqual([]);
  });

  it('modo "remove": no hace nada si la celda ya está vacía', () => {
    const tiles: MapTile[] = [];
    expect(paintDraftTile(tiles, 2, 2, 'wall', 'remove')).toBe(tiles);
  });

  it('ignora celdas fuera de los límites activos del mapa', () => {
    const tiles: MapTile[] = [];
    expect(paintDraftTile(tiles, -1, 0, 'wall', 'add')).toBe(tiles);
  });

  it('modo "add": no pisa un portal existente con otra herramienta', () => {
    const tiles: MapTile[] = [{ x: 2, y: 2, type: 'portal', targetLayoutId: 'l1', targetX: 0, targetY: 0 }];
    expect(paintDraftTile(tiles, 2, 2, 'wall', 'add')).toBe(tiles);
  });

  it('modo "remove": no borra un portal existente con otra herramienta', () => {
    const tiles: MapTile[] = [{ x: 2, y: 2, type: 'portal', targetLayoutId: 'l1', targetX: 0, targetY: 0 }];
    expect(paintDraftTile(tiles, 2, 2, 'wall', 'remove')).toBe(tiles);
  });
});

describe('moveDraftTile', () => {
  it('mueve el tile conservando sus datos', () => {
    const tiles: MapTile[] = [{ x: 1, y: 1, type: 'portal', targetLayoutId: 'l1', targetX: 2, targetY: 2, label: 'Puerta' }];
    const moved = moveDraftTile(tiles, { x: 1, y: 1 }, { x: 5, y: 5 });
    expect(moved).toEqual([{ x: 5, y: 5, type: 'portal', targetLayoutId: 'l1', targetX: 2, targetY: 2, label: 'Puerta' }]);
  });

  it('sobrescribe cualquier tile que ya estuviera en la celda destino', () => {
    const tiles: MapTile[] = [
      { x: 1, y: 1, type: 'portal' },
      { x: 5, y: 5, type: 'wall' },
    ];
    const moved = moveDraftTile(tiles, { x: 1, y: 1 }, { x: 5, y: 5 });
    expect(moved).toEqual([{ x: 5, y: 5, type: 'portal' }]);
  });

  it('no hace nada si origen y destino son la misma celda', () => {
    const tiles: MapTile[] = [{ x: 1, y: 1, type: 'wall' }];
    expect(moveDraftTile(tiles, { x: 1, y: 1 }, { x: 1, y: 1 })).toBe(tiles);
  });

  it('no hace nada si no hay tile en el origen', () => {
    const tiles: MapTile[] = [];
    expect(moveDraftTile(tiles, { x: 1, y: 1 }, { x: 2, y: 2 })).toBe(tiles);
  });

  it('ignora un destino fuera de los límites activos del mapa', () => {
    const tiles: MapTile[] = [{ x: 1, y: 1, type: 'wall' }];
    expect(moveDraftTile(tiles, { x: 1, y: 1 }, { x: -1, y: 0 })).toBe(tiles);
  });
});

describe('inBounds activo vs. tamaño real del layout (bug de mapas grandes)', () => {
  // toggleDraftTile/paintDraftTile validan contra las dimensiones "activas"
  // globales de mapUtils.ts (activeCols/activeRows), no contra un tamaño que
  // reciban como parámetro. MapLibraryPage.tsx es responsable de mantener
  // esas dimensiones sincronizadas con el mapa guardado que se esté editando
  // (ver el useEffect agregado ahí) — si no lo hace, un mapa guardado más
  // grande que el tamaño activo (p. ej. quedó en el Estándar 28×16 del mapa
  // en vivo) solo deja pintar/modificar tiles dentro de ese sector chico.
  afterEach(() => {
    setActiveMapSize(28, 16); // restaurar el default para no afectar otros tests
  });

  it('paintDraftTile no hace nada fuera del tamaño activo, aunque la celda sea válida para un mapa más grande', () => {
    setActiveMapSize(28, 16);
    const tiles = paintDraftTile([], 40, 20, 'wall', 'add');
    expect(tiles).toEqual([]); // (40,20) está fuera de 28×16, aunque sea válido en un mapa 44×24
  });

  it('paintDraftTile funciona en esa misma celda una vez que el tamaño activo coincide con el del mapa real', () => {
    setActiveMapSize(44, 24);
    const tiles = paintDraftTile([], 40, 20, 'wall', 'add');
    expect(tiles).toEqual([{ x: 40, y: 20, type: 'wall' }]);
  });

  it('toggleDraftTile tiene el mismo problema y el mismo fix', () => {
    setActiveMapSize(28, 16);
    expect(toggleDraftTile([], 40, 20, 'wall')).toEqual([]);

    setActiveMapSize(44, 24);
    expect(toggleDraftTile([], 40, 20, 'wall')).toEqual([{ x: 40, y: 20, type: 'wall' }]);
  });

  it('sanity: activeCols/activeRows reflejan el último setActiveMapSize', () => {
    setActiveMapSize(44, 24);
    expect(activeCols).toBe(44);
    expect(activeRows).toBe(24);
  });
});
