// ============================================================
// Tests de edición pura de tiles (usada por la biblioteca de mapas
// para editar un layout guardado sin tocar el mapa en vivo)
// ============================================================

import { describe, expect, it } from 'vitest';
import { toggleDraftTile, removeDraftTileAt, applyPortalUpdate, ensurePortalTile, removeLinkedPortal } from '../utils/tileDraft';
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
