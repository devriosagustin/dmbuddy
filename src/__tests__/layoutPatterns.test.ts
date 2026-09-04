// ============================================================
// Tests de reconstrucción de tiles/criaturas al cargar un layout
// (usado tanto al cargar un layout manualmente como al cruzar un
// portal de mapa)
// ============================================================

import { describe, expect, it } from 'vitest';
import { restoreTilesFromLayout, restoreCreaturesFromLayout } from '../utils/layoutPatterns';
import type { MapLayout } from '../utils/layoutPatterns';

describe('restoreTilesFromLayout', () => {
  it('reconstruye tiles con su tipo y config completa, incluida la de un portal', () => {
    const layout: MapLayout = {
      id: 'l1',
      name: 'Sala del trono',
      tiles: [
        { x: 1, y: 1, type: 'wall' },
        { x: 2, y: 2, type: 'door', open: true },
        { x: 3, y: 3, type: 'portal', targetLayoutId: 'l2', targetX: 4, targetY: 5, label: 'Escalera' },
      ],
    };
    const tiles = restoreTilesFromLayout(layout);
    expect(tiles).toHaveLength(3);
    expect(tiles[2]).toEqual({
      x: 3,
      y: 3,
      type: 'portal',
      open: undefined,
      targetLayoutId: 'l2',
      targetX: 4,
      targetY: 5,
      label: 'Escalera',
    });
  });

  it('convierte barriers legacy (sin tipo) a muros', () => {
    const layout: MapLayout = { id: 'l1', name: 'Vieja', barriers: [{ x: 0, y: 0 }] };
    const tiles = restoreTilesFromLayout(layout);
    expect(tiles).toEqual([{ x: 0, y: 0, type: 'wall' }]);
  });

  it('devuelve una lista vacía si el layout no tiene tiles ni barriers', () => {
    const layout: MapLayout = { id: 'l1', name: 'Vacío' };
    expect(restoreTilesFromLayout(layout)).toEqual([]);
  });
});

describe('restoreCreaturesFromLayout', () => {
  it('reconstruye monstruos y NPCs con ids nuevos', () => {
    const layout: MapLayout = {
      id: 'l1',
      name: 'Cripta',
      creatures: [
        {
          name: 'Esqueleto',
          kind: 'monster',
          x: 2,
          y: 2,
          hp: 13,
          maxHp: 13,
          tempHp: 0,
          armorClass: 13,
          speed: 30,
          xpReward: 50,
        },
      ],
    };
    const creatures = restoreCreaturesFromLayout(layout);
    expect(creatures).toHaveLength(1);
    expect(creatures[0].name).toBe('Esqueleto');
    expect(creatures[0].id).toBeTruthy();
    expect(creatures[0].isDead).toBe(false);
    expect(creatures[0].statusEffects).toEqual([]);
  });

  it('descarta entradas legacy con kind "player"', () => {
    const layout: MapLayout = {
      id: 'l1',
      name: 'Vieja',
      creatures: [
        { name: 'PJ viejo', kind: 'player', x: 0, y: 0, hp: 10, maxHp: 10, tempHp: 0, armorClass: 10, speed: 30 },
      ],
    };
    expect(restoreCreaturesFromLayout(layout)).toEqual([]);
  });

  it('devuelve una lista vacía si el layout no tiene criaturas', () => {
    const layout: MapLayout = { id: 'l1', name: 'Vacío' };
    expect(restoreCreaturesFromLayout(layout)).toEqual([]);
  });
});
