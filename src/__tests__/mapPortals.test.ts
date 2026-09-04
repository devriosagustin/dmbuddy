// ============================================================
// Tests de detección de portales configurados en el mapa
// ============================================================

import { describe, expect, it } from 'vitest';
import { findConfiguredPortal } from '../utils/mapPortals';
import type { MapTile } from '../types';

describe('findConfiguredPortal', () => {
  it('encuentra un portal configurado en su celda', () => {
    const tiles: MapTile[] = [{ x: 3, y: 4, type: 'portal', targetLayoutId: 'layout-1', targetX: 1, targetY: 1 }];
    const found = findConfiguredPortal(tiles, 3, 4);
    expect(found).toBeDefined();
    expect(found!.targetLayoutId).toBe('layout-1');
  });

  it('ignora un portal sin mapa destino todavía (recién colocado)', () => {
    const tiles: MapTile[] = [{ x: 3, y: 4, type: 'portal' }];
    expect(findConfiguredPortal(tiles, 3, 4)).toBeUndefined();
  });

  it('ignora tiles de otro tipo en la misma celda', () => {
    const tiles: MapTile[] = [{ x: 3, y: 4, type: 'wall' }];
    expect(findConfiguredPortal(tiles, 3, 4)).toBeUndefined();
  });

  it('no encuentra nada en una celda vacía', () => {
    const tiles: MapTile[] = [{ x: 3, y: 4, type: 'portal', targetLayoutId: 'layout-1' }];
    expect(findConfiguredPortal(tiles, 5, 5)).toBeUndefined();
  });
});
