// ============================================================
// Tests del store de jugadores: XP y subida de nivel
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { usePlayerStore } from '../store/playerStore';
import type { Player } from '../types';

// Reset del estado en memoria (ignora la persistencia en tests)
beforeEach(() => {
  usePlayerStore.setState({ players: [] });
});

const makePlayer = (overrides: Partial<Player> = {}): Omit<Player, 'id' | 'proficiencyBonus'> => ({
  name: 'Aragon',
  level: 1,
  class: 'Guerrero',
  race: 'Humano',
  hp: 12,
  maxHp: 12,
  armorClass: 16,
  stats: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
  ...overrides,
});

describe('Player Store - XP y nivel', () => {
  it('debe sumar XP y subir de nivel al superar el umbral', () => {
    const created = usePlayerStore.getState().addPlayer(makePlayer());
    expect(created.level).toBe(1);
    expect(created.xp ?? 0).toBe(0);

    usePlayerStore.getState().addXp(created.id, 150);
    let p = usePlayerStore.getState().players[0];
    expect(p.xp).toBe(150);
    expect(p.level).toBe(1);

    usePlayerStore.getState().addXp(created.id, 150); // 300 total → Nv 2
    p = usePlayerStore.getState().players[0];
    expect(p.xp).toBe(300);
    expect(p.level).toBe(2);
    expect(p.proficiencyBonus).toBe(2);
  });

  it('debe manejar un salto de varios niveles', () => {
    const created = usePlayerStore.getState().addPlayer(makePlayer());
    usePlayerStore.getState().addXp(created.id, 7000);
    const p = usePlayerStore.getState().players[0];
    expect(p.xp).toBe(7000);
    expect(p.level).toBe(5);
    expect(p.proficiencyBonus).toBe(3);
  });

  it('debe subir de nivel manualmente y arrastrar la XP al umbral', () => {
    const created = usePlayerStore.getState().addPlayer(makePlayer());
    usePlayerStore.getState().levelUp(created.id);
    let p = usePlayerStore.getState().players[0];
    expect(p.level).toBe(2);
    expect(p.xp).toBe(300);

    // Al llegar al nivel 20 ya no sube más
    usePlayerStore.setState({
      players: [{ ...created, level: 20, xp: 999999, proficiencyBonus: 6 }],
    });
    usePlayerStore.getState().levelUp(created.id);
    p = usePlayerStore.getState().players[0];
    expect(p.level).toBe(20);
  });
});
