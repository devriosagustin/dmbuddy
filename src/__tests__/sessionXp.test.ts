// ============================================================
// Tests del reparto de XP hacia el jugador (sessionStore)
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { useSessionStore } from '../store/sessionStore';
import { usePlayerStore } from '../store/playerStore';
import type { SyncCombatSnapshot } from '../types/session';
import type { XpAward } from '../types';

beforeEach(() => {
  usePlayerStore.setState({ players: [] });
  useSessionStore.setState({ remoteCombat: null, lastXpCombatId: null });
});

const makePlayer = () =>
  usePlayerStore.getState().addPlayer({
    name: 'Thorin',
    level: 1,
    class: 'Guerrero',
    hp: 12,
    maxHp: 12,
    armorClass: 16,
    stats: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
  });

const makeSnapshot = (overrides: Partial<SyncCombatSnapshot> = {}): SyncCombatSnapshot => ({
  id: 'c1',
  round: 1,
  turn: 0,
  isActive: true,
  encounterCount: 1,
  participants: [],
  tiles: [],
  revealedTileKeys: [],
  revealedEnemyIds: [],
  mapVisible: true,
  chat: [],
  ...overrides,
});

const applyAward = (awards: XpAward[], id = 'c1') => {
  useSessionStore.getState().setRemoteCombat({
    snapshot: makeSnapshot({ id, isActive: false, xpAwards: awards }),
    settings: { visionRange: 30, mapCols: 28, mapRows: 16 },
  });
};

describe('Reparto de XP al jugador', () => {
  it('aplica la XP publicada por el DM a los personajes locales', () => {
    const player = makePlayer();
    applyAward([{ playerId: player.id, name: 'Thorin', xp: 50, leveledUp: false, level: 1 }]);
    const p = usePlayerStore.getState().players.find((x) => x.id === player.id);
    expect(p?.xp).toBe(50);
  });

  it('no aplica dos veces el mismo combate', () => {
    const player = makePlayer();
    const awards: XpAward[] = [{ playerId: player.id, name: 'Thorin', xp: 50, leveledUp: false, level: 1 }];
    applyAward(awards);
    applyAward(awards); // re-emisión del mismo snapshot
    const p = usePlayerStore.getState().players.find((x) => x.id === player.id);
    expect(p?.xp).toBe(50);
  });

  it('sí aplica la XP de un combate nuevo distinto', () => {
    const player = makePlayer();
    applyAward([{ playerId: player.id, name: 'Thorin', xp: 50, leveledUp: false, level: 1 }], 'c1');
    applyAward([{ playerId: player.id, name: 'Thorin', xp: 30, leveledUp: false, level: 1 }], 'c2');
    const p = usePlayerStore.getState().players.find((x) => x.id === player.id);
    expect(p?.xp).toBe(80);
  });

  it('ignora awards de personajes que no son del jugador', () => {
    const player = makePlayer();
    applyAward([{ playerId: 'otro', name: 'Gandalf', xp: 999, leveledUp: false, level: 1 }]);
    const p = usePlayerStore.getState().players.find((x) => x.id === player.id);
    expect(p?.xp ?? 0).toBe(0);
  });
});