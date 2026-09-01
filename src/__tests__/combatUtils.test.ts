// ============================================================
// Tests de conversión jugador -> combatiente
// ============================================================

import { describe, expect, it } from 'vitest';
import { playerToCombatant, npcToCombatant } from '../utils/combatUtils';
import type { Player, Npc } from '../types';

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

describe('npcToCombatant', () => {
  const baseNpc: Npc = {
    id: 'n-1',
    name: 'Pelagia',
    role: 'hostage',
    hp: 8,
    maxHp: 8,
    armorClass: 10,
    speed: 30,
    notes: 'Posadera secuestrada.',
  };

  it('convierte un NPC rehén en combatiente tipo npc', () => {
    const c = npcToCombatant(baseNpc, 14);
    expect(c.type).toBe('npc');
    expect(c.npcId).toBe('n-1');
    expect(c.npcRole).toBe('hostage');
    expect(c.name).toBe('Pelagia');
    expect(c.hp).toBe(8);
    expect(c.armorClass).toBe(10);
    expect(c.speed).toBe(30);
  });

  it('preserva el rol de aliado', () => {
    const c = npcToCombatant({ ...baseNpc, role: 'ally' }, 5);
    expect(c.npcRole).toBe('ally');
  });
});
