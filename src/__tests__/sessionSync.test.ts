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

  it('isTileRevealed consulta revealedTileKeys', () => {
    expect(isTileRevealed(snapshot, 2, 3)).toBe(true);
    expect(isTileRevealed(snapshot, 0, 0)).toBe(false); // muro no se "revela"
  });

  it('tileKey genera la clave única x-y', () => {
    expect(tileKey(2, 3)).toBe('2-3');
    expect(tileKey(0, 0)).toBe('0-0');
  });
});