// ============================================================
// Tests de la capa de sesión: snapshot de combate y helpers de
// cortina de guerra (revelación de enemigos y tiles).
// ============================================================

import { describe, it, expect } from 'vitest';
import { tileKey } from '../types/session';
import { buildCombatSnapshot, isEnemyRevealed, isTileRevealed } from '../services/firebaseSync';
import type { Combatant, MapTile } from '../types';
import type { SyncCombatSnapshot } from '../types/session';

const combatant = (id: string, type: Combatant['type'], npcRole?: 'enemy'): Combatant => ({
  id,
  name: id,
  initiative: 10,
  hp: 20,
  maxHp: 20,
  tempHp: 0,
  armorClass: 12,
  type,
  isActive: true,
  isDead: false,
  statusEffects: [],
  x: 1,
  y: 1,
  // Añadimos un campo de función para verificar que el snapshot lo serializa
  // sin romper (JSON round-trip lo elimina).
  ...(type === 'npc' && npcRole ? { npcRole } : {}),
} as Combatant);

const tile = (x: number, y: number, type: MapTile['type']): MapTile => ({ x, y, type });

const snapshot: SyncCombatSnapshot = {
  id: 'c1',
  round: 1,
  turn: 0,
  isActive: true,
  encounterCount: 1,
  participants: [combatant('gob', 'monster'), combatant('ally', 'npc', 'enemy')],
  tiles: [tile(0, 0, 'wall'), tile(2, 3, 'trap')],
  revealedTileKeys: [tileKey(2, 3)],
  revealedEnemyIds: ['gob'],
  mapVisible: true,
  chat: [],
};

describe('buildCombatSnapshot', () => {
  it('serializa el combate sin perder campos esenciales', () => {
    const out = buildCombatSnapshot({
      id: 'c1',
      round: 2,
      turn: 1,
      isActive: true,
      encounterCount: 3,
      participants: [combatant('orc', 'monster')],
      tiles: [tile(0, 0, 'wall')],
      revealedTileKeys: [],
      revealedEnemyIds: [],
      chat: [],
    });
    expect(out.id).toBe('c1');
    expect(out.round).toBe(2);
    expect(out.turn).toBe(1);
    expect(out.participants).toHaveLength(1);
    expect(out.participants[0].name).toBe('orc');
  });
});

describe('cortina de guerra (revelación)', () => {
  it('isEnemyRevealed consulta revealedEnemyIds', () => {
    expect(isEnemyRevealed(snapshot, 'gob')).toBe(true);
    expect(isEnemyRevealed(snapshot, 'nope')).toBe(false);
  });

  it('isEnemyRevealed tolera snapshots sin revealedEnemyIds', () => {
    const old = { ...snapshot, revealedEnemyIds: undefined as unknown as string[] };
    expect(isEnemyRevealed(old, 'gob')).toBe(false);
  });

  it('isTileRevealed tolera snapshots sin revealedTileKeys', () => {
    const old = { ...snapshot, revealedTileKeys: undefined as unknown as string[] };
    expect(isTileRevealed(old, 2, 3)).toBe(false);
  });

  it('buildCombatSnapshot normaliza revealedEnemyIds/revealedTileKeys ausentes', () => {
    const out = buildCombatSnapshot({
      id: 'c1',
      round: 1,
      turn: 0,
      isActive: true,
      encounterCount: 1,
      participants: [combatant('gob', 'monster')],
      tiles: [],
      revealedTileKeys: undefined as unknown as string[],
      revealedEnemyIds: undefined as unknown as string[],
      chat: [],
    });
    expect(out.revealedEnemyIds).toEqual([]);
    expect(out.revealedTileKeys).toEqual([]);
  });

  it('incluye mapCreatures en el snapshot (modo exploración)', () => {
    const out = buildCombatSnapshot({
      id: 'c1',
      round: 0,
      turn: -1,
      isActive: false,
      encounterCount: 0,
      participants: [],
      tiles: [],
      mapCreatures: [
        {
          id: 'mc-1',
          name: 'Orco',
          kind: 'monster',
          x: 3,
          y: 4,
          hp: 10,
          maxHp: 10,
          tempHp: 0,
          armorClass: 12,
          speed: 30,
          statusEffects: [],
          isDead: false,
        },
      ],
      revealedTileKeys: [],
      revealedEnemyIds: [],
      chat: [],
    });
    expect(out.mapCreatures).toHaveLength(1);
    expect(out.mapCreatures![0].name).toBe('Orco');
    expect(out.mapCreatures![0].x).toBe(3);
  });

  it('incluye partyCombatants en el snapshot (miembros del party del DM)', () => {
    const party: Combatant = {
      ...combatant('party-1', 'player'),
      id: 'party-1',
      x: 5,
      y: 2,
    };
    const out = buildCombatSnapshot({
      id: 'c1',
      round: 0,
      turn: -1,
      isActive: false,
      encounterCount: 0,
      participants: [],
      tiles: [],
      partyCombatants: [party],
      revealedTileKeys: [],
      revealedEnemyIds: [],
      chat: [],
    });
    expect(out.partyCombatants).toHaveLength(1);
    expect(out.partyCombatants![0].id).toBe('party-1');
    expect(out.partyCombatants![0].x).toBe(5);
    expect(out.partyCombatants![0].type).toBe('player');
  });

  it('partyCombatants ausente se normaliza a lista vacía', () => {
    const out = buildCombatSnapshot({
      id: 'c1',
      round: 0,
      turn: -1,
      isActive: false,
      encounterCount: 0,
      participants: [],
      tiles: [],
      revealedTileKeys: [],
      revealedEnemyIds: [],
      chat: [],
    });
    expect(out.partyCombatants).toEqual([]);
  });
});