// ============================================================
// Tests del store de monstruos (biblioteca que arranca vacía)
// ============================================================

import { describe, expect, it, beforeEach } from 'vitest';
import { useMonsterStore } from '../store/monsterStore';
import type { Monster } from '../types';

beforeEach(() => {
  useMonsterStore.setState({ monsters: [], encounters: [] });
});

const makeMonster = (overrides: Partial<Monster> = {}): Monster => ({
  id: 'm-1',
  name: 'Goblin',
  type: 'Humanoide (goblenoide)',
  size: 'Pequeño',
  alignment: 'Caótico malvado',
  armorClass: 15,
  hitPoints: 7,
  hitDice: '2d6',
  speed: '30 pies',
  stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
  skills: { Sigilo: 6 },
  senses: 'Visión en la oscuridad 60 pies',
  languages: 'Goblin, Común',
  challengeRating: 0.25,
  traits: [],
  actions: [],
  ...overrides,
});

describe('Monster Store (biblioteca vacía)', () => {
  it('arranca sin monstruos cargados', () => {
    expect(useMonsterStore.getState().monsters).toHaveLength(0);
  });

  it('añade un monstruo y hace upsert por id', () => {
    useMonsterStore.getState().addMonster(makeMonster());
    expect(useMonsterStore.getState().monsters).toHaveLength(1);

    // Reimportar el mismo id actualiza en lugar de duplicar
    useMonsterStore.getState().addMonster(makeMonster({ name: 'Goblin (jefe)' }));
    const state = useMonsterStore.getState();
    expect(state.monsters).toHaveLength(1);
    expect(state.monsters[0].name).toBe('Goblin (jefe)');
  });

  it('elimina un monstruo', () => {
    useMonsterStore.getState().addMonster(makeMonster());
    const id = useMonsterStore.getState().monsters[0].id;
    useMonsterStore.getState().removeMonster(id);
    expect(useMonsterStore.getState().monsters).toHaveLength(0);
  });
});
