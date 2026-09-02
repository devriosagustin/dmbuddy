// ============================================================
// Tests del store de layouts (barreras + criaturas)
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { useLayoutStore } from '../store/layoutStore';
import type { LayoutCreature } from '../utils/layoutPatterns';

beforeEach(() => {
  useLayoutStore.setState({ savedLayouts: [] });
});

describe('Layout Store', () => {
  it('guarda barreras y criaturas en un layout', () => {
    const { saveLayout, savedLayout } = useLayoutStore.getState();
    const creatures: LayoutCreature[] = [
      {
        name: 'Orco',
        kind: 'monster',
        x: 5,
        y: 5,
        hp: 15,
        maxHp: 15,
        tempHp: 0,
        armorClass: 12,
        speed: 30,
      },
    ];
    saveLayout('Sala del trono', [{ x: 1, y: 1 }], creatures);

    const layout = savedLayout(useLayoutStore.getState().savedLayouts[0].id);
    expect(layout).toBeDefined();
    expect(layout!.name).toBe('Sala del trono');
    expect(layout!.barriers).toEqual([{ x: 1, y: 1 }]);
    expect(layout!.creatures).toHaveLength(1);
    expect(layout!.creatures![0].name).toBe('Orco');
    expect(layout!.creatures![0].x).toBe(5);
  });

  it('actualiza criaturas al guardar con el mismo nombre', () => {
    const { saveLayout, savedLayout } = useLayoutStore.getState();
    saveLayout('Zona', [{ x: 0, y: 0 }], [
      { name: 'A', kind: 'npc', x: 1, y: 1, hp: 5, maxHp: 5, tempHp: 0, armorClass: 10, speed: 30 },
    ]);
    const firstId = useLayoutStore.getState().savedLayouts[0].id;

    saveLayout('Zona', [{ x: 0, y: 0 }], [
      { name: 'B', kind: 'npc', x: 2, y: 2, hp: 8, maxHp: 8, tempHp: 0, armorClass: 11, speed: 30 },
    ]);

    expect(useLayoutStore.getState().savedLayouts).toHaveLength(1);
    const layout = savedLayout(firstId)!;
    expect(layout.creatures).toHaveLength(1);
    expect(layout.creatures![0].name).toBe('B');
    expect(layout.creatures![0].x).toBe(2);
  });
});
