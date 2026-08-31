// ============================================================
// Tests de conversión jugador -> combatiente
// ============================================================

import { describe, expect, it } from 'vitest';
import { playerToCombatant } from '../utils/combatUtils';
import type { Player } from '../types';

const basePlayer: Pick<Player, 'id' | 'name' | 'hp' | 'maxHp' | 'armorClass'> & Partial<Player> = {
  id: 'p-1',
  name: 'Aragon',
  hp: 12,
  maxHp: 12,
  armorClass: 16,
  class: 'Guerrero',
  proficiencyBonus: 2,
  stats: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
  feats: ['Alerta', 'Competente'],
};

describe('playerToCombatant', () => {
  it('lleva las dotes del personaje al combatiente', () => {
    const c = playerToCombatant(basePlayer, 15);
    expect(c.type).toBe('player');
    expect(c.playerId).toBe('p-1');
    expect(c.playerFeats).toEqual(['Alerta', 'Competente']);
  });

  it('no incluye dotes cuando el personaje no las tiene', () => {
    const c = playerToCombatant({ ...basePlayer, feats: undefined }, 15);
    expect(c.playerFeats).toBeUndefined();
  });
});
