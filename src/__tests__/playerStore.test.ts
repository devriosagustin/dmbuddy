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

  it('al subir de nivel (manual) recalcula los PG máximos y deja la vida llena', () => {
    // Guerrero (d10) CON 14 (+2), daña al personaje antes de subir de nivel.
    const created = usePlayerStore.getState().addPlayer(makePlayer({ hp: 3, maxHp: 12 }));
    usePlayerStore.getState().levelUp(created.id); // nivel 2: 12 + (6+2) = 20
    const p = usePlayerStore.getState().players[0];
    expect(p.level).toBe(2);
    expect(p.maxHp).toBe(20);
    expect(p.hp).toBe(20); // vida llena, no queda en 3
  });

  it('al subir de nivel por XP (con salto) recalcula los PG del nivel final', () => {
    const created = usePlayerStore.getState().addPlayer(makePlayer({ hp: 1, maxHp: 12 }));
    usePlayerStore.getState().addXp(created.id, 7000); // salta a nivel 5
    const p = usePlayerStore.getState().players[0];
    expect(p.level).toBe(5);
    // Guerrero (d10) CON 14 (+2): 12 + 4*(6+2) = 44
    expect(p.maxHp).toBe(44);
    expect(p.hp).toBe(44);
  });

  it('no toca los PG si no hubo subida de nivel', () => {
    const created = usePlayerStore.getState().addPlayer(makePlayer({ hp: 5, maxHp: 12 }));
    usePlayerStore.getState().addXp(created.id, 50); // no alcanza el umbral de nivel 2
    const p = usePlayerStore.getState().players[0];
    expect(p.level).toBe(1);
    expect(p.hp).toBe(5);
    expect(p.maxHp).toBe(12);
  });

  it('suma el bonus de la dote Robusto al recalcular PG por nivel', () => {
    const created = usePlayerStore.getState().addPlayer(makePlayer({ feats: ['Robusto'] }));
    usePlayerStore.getState().levelUp(created.id); // nivel 2
    const p = usePlayerStore.getState().players[0];
    // Sin Robusto sería 20 (ver test de arriba); con Robusto +2 por nivel (2 niveles) = +4
    expect(p.maxHp).toBe(24);
    expect(p.hp).toBe(24);
  });
});
