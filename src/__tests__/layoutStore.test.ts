// ============================================================
// Tests del store de layouts (barreras + criaturas)
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { useLayoutStore } from '../store/layoutStore';
import type { LayoutCreature, LayoutTile } from '../utils/layoutPatterns';

beforeEach(() => {
  useLayoutStore.setState({ savedLayouts: [] });
});

describe('Layout Store', () => {
  it('guarda tiles (con su tipo) y criaturas en un layout', () => {
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
    const tiles: LayoutTile[] = [
      { x: 1, y: 1, type: 'wall' },
      { x: 2, y: 2, type: 'trap' },
      { x: 3, y: 3, type: 'door', open: true },
      { x: 4, y: 4, type: 'treasure' },
      { x: 5, y: 5, type: 'investigation' },
    ];
    saveLayout('Sala del trono', tiles, creatures);

    const layout = savedLayout(useLayoutStore.getState().savedLayouts[0].id);
    expect(layout).toBeDefined();
    expect(layout!.name).toBe('Sala del trono');
    expect(layout!.tiles).toHaveLength(5);
    expect(layout!.tiles).toEqual(tiles);
    expect(layout!.creatures).toHaveLength(1);
    expect(layout!.creatures![0].name).toBe('Orco');
    expect(layout!.creatures![0].x).toBe(5);
  });

  it('actualiza criaturas al guardar con el mismo nombre', () => {
    const { saveLayout, savedLayout } = useLayoutStore.getState();
    const tiles: LayoutTile[] = [{ x: 0, y: 0, type: 'wall' }];
    saveLayout('Zona', tiles, [
      { name: 'A', kind: 'npc', x: 1, y: 1, hp: 5, maxHp: 5, tempHp: 0, armorClass: 10, speed: 30 },
    ]);
    const firstId = useLayoutStore.getState().savedLayouts[0].id;

    saveLayout('Zona', [{ x: 0, y: 0, type: 'wall' }], [
      { name: 'B', kind: 'npc', x: 2, y: 2, hp: 8, maxHp: 8, tempHp: 0, armorClass: 11, speed: 30 },
    ]);

    expect(useLayoutStore.getState().savedLayouts).toHaveLength(1);
    const layout = savedLayout(firstId)!;
    expect(layout.creatures).toHaveLength(1);
    expect(layout.creatures![0].name).toBe('B');
    expect(layout.creatures![0].x).toBe(2);
  });

  it('guarda el tamaño propio de un mapa nuevo y lo conserva al autoguardar tiles sin pasar tamaño', () => {
    const { saveLayout, savedLayout } = useLayoutStore.getState();
    const layout = saveLayout('Mazmorra grande', [], [], undefined, { cols: 44, rows: 24 });
    expect(layout.mapCols).toBe(44);
    expect(layout.mapRows).toBe(24);

    // Autoguardado típico: mismo nombre, tiles nuevos, sin tocar el tamaño.
    saveLayout('Mazmorra grande', [{ x: 1, y: 1, type: 'wall' }]);
    const updated = savedLayout(layout.id)!;
    expect(updated.mapCols).toBe(44);
    expect(updated.mapRows).toBe(24);
    expect(updated.tiles).toHaveLength(1);
  });

  it('un mapa creado sin tamaño explícito queda sin mapCols/mapRows (se asume el default en el resto de la app)', () => {
    const { saveLayout } = useLayoutStore.getState();
    const layout = saveLayout('Mapa viejo', []);
    expect(layout.mapCols).toBeUndefined();
    expect(layout.mapRows).toBeUndefined();
  });

  it('resizeLayout cambia el tamaño y recorta tiles/criaturas que quedan fuera de los límites nuevos', () => {
    const { saveLayout, resizeLayout, savedLayout } = useLayoutStore.getState();
    const tiles: LayoutTile[] = [
      { x: 1, y: 1, type: 'wall' },
      { x: 25, y: 10, type: 'wall' },
    ];
    const creatures: LayoutCreature[] = [
      { name: 'Orco', kind: 'monster', x: 25, y: 10, hp: 15, maxHp: 15, tempHp: 0, armorClass: 12, speed: 30 },
    ];
    const layout = saveLayout('Mapa a achicar', tiles, creatures, undefined, { cols: 28, rows: 16 });

    const updated = resizeLayout(layout.id, 20, 12);
    expect(updated).toBeDefined();
    expect(updated!.mapCols).toBe(20);
    expect(updated!.mapRows).toBe(12);
    // El tile en (25,10) queda fuera del 20×12 nuevo y se descarta (mismo
    // criterio que el mapa en vivo: un muro fuera de rango no tiene forma
    // sensata de "acomodarse"); la criatura, en cambio, se reubica dentro
    // del límite nuevo en vez de perderse.
    expect(updated!.tiles).toEqual([{ x: 1, y: 1, type: 'wall' }]);
    expect(updated!.creatures).toEqual([
      { name: 'Orco', kind: 'monster', x: 19, y: 10, hp: 15, maxHp: 15, tempHp: 0, armorClass: 12, speed: 30 },
    ]);

    expect(savedLayout(layout.id)!.mapCols).toBe(20);
  });

  it('resizeLayout no rompe con un id que no existe', () => {
    const { resizeLayout } = useLayoutStore.getState();
    expect(resizeLayout('no-existe', 20, 12)).toBeUndefined();
  });

  it('guarda el color de fondo propio de un mapa nuevo y lo conserva al autoguardar tiles sin pasar color', () => {
    const { saveLayout, savedLayout } = useLayoutStore.getState();
    const layout = saveLayout('Bosque verde', [], [], undefined, undefined, 'grass');
    expect(layout.background).toBe('grass');

    // Autoguardado típico: mismo nombre, tiles nuevos, sin tocar el color.
    saveLayout('Bosque verde', [{ x: 1, y: 1, type: 'wall' }]);
    const updated = savedLayout(layout.id)!;
    expect(updated.background).toBe('grass');
  });

  it('un mapa creado sin color explícito queda sin background (se asume el default en el resto de la app)', () => {
    const { saveLayout } = useLayoutStore.getState();
    const layout = saveLayout('Mapa viejo', []);
    expect(layout.background).toBeUndefined();
  });

  it('setLayoutBackground cambia el color de un layout existente', () => {
    const { saveLayout, setLayoutBackground, savedLayout } = useLayoutStore.getState();
    const layout = saveLayout('Montaña gris', [], [], undefined, undefined, 'stone');

    setLayoutBackground(layout.id, 'snow');
    expect(savedLayout(layout.id)!.background).toBe('snow');
  });

  it('setLayoutBackground no rompe con un id que no existe', () => {
    const { setLayoutBackground } = useLayoutStore.getState();
    expect(() => setLayoutBackground('no-existe', 'lava')).not.toThrow();
  });
});
