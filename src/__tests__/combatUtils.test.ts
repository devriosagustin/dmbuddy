// ============================================================
// Tests de conversión jugador -> combatiente
// ============================================================

import { describe, expect, it } from 'vitest';
import {
  playerToCombatant,
  npcToCombatant,
  creatureIcon,
  tokenIcon,
  tokenSizeScale,
  tokenShapeClass,
  tokenColorClasses,
} from '../utils/combatUtils';
import type { Player, Npc, Combatant } from '../types';

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

// ============================================================
// Aspecto de la ficha: ícono, tamaño y forma según tipo de combatiente
// ============================================================

const baseCombatant: Combatant = {
  id: 'c-1',
  name: 'Ficha',
  initiative: 10,
  hp: 10,
  maxHp: 10,
  tempHp: 0,
  armorClass: 12,
  type: 'monster',
  isActive: false,
  statusEffects: [],
  isDead: false,
};

describe('creatureIcon', () => {
  it('usa un ícono fijo para NPCs, distinto si es rehén', () => {
    expect(creatureIcon('npc')).toBe('🧑');
    expect(creatureIcon('npc', { npcRole: 'hostage' })).toBe('⛓️');
  });

  it('elige el ícono de monstruo según el tipo, insensible a mayúsculas', () => {
    expect(creatureIcon('monster', { monsterType: 'Goblinoide' })).toBe('👺');
    expect(creatureIcon('monster', { monsterType: 'dragón' })).toBe('🐉');
  });

  it('cae en un ícono genérico cuando el tipo no matchea nada conocido', () => {
    expect(creatureIcon('monster', { monsterType: 'algo-inexistente' })).toBe('👹');
    expect(creatureIcon('monster')).toBe('👹');
  });
});

describe('tokenIcon', () => {
  it('usa el ícono de la clase para un jugador con clase conocida', () => {
    const c: Combatant = { ...baseCombatant, type: 'player', playerClass: 'Mago' };
    expect(tokenIcon(c)).toBe('📖');
  });

  it('cae en la inicial del nombre si el jugador no tiene clase reconocida', () => {
    const c: Combatant = { ...baseCombatant, type: 'player', name: 'zara' };
    expect(tokenIcon(c)).toBe('Z');
  });

  it('usa el ícono del tipo de monstruo para un monstruo', () => {
    const c: Combatant = { ...baseCombatant, type: 'monster', monsterType: 'no-muerto' };
    expect(tokenIcon(c)).toBe('💀');
  });

  it('usa el ícono de NPC (rehén u ordinario) para un npc', () => {
    const ally: Combatant = { ...baseCombatant, type: 'npc', npcRole: 'ally' };
    const hostage: Combatant = { ...baseCombatant, type: 'npc', npcRole: 'hostage' };
    expect(tokenIcon(ally)).toBe('🧑');
    expect(tokenIcon(hostage)).toBe('⛓️');
  });
});

describe('tokenSizeScale', () => {
  it('escala monstruos según su tamaño', () => {
    expect(tokenSizeScale({ ...baseCombatant, monsterSize: 'Pequeño' })).toBe(0.8);
    expect(tokenSizeScale({ ...baseCombatant, monsterSize: 'Mediano' })).toBe(1);
    expect(tokenSizeScale({ ...baseCombatant, monsterSize: 'Grande' })).toBe(1.35);
    expect(tokenSizeScale({ ...baseCombatant, monsterSize: 'Enorme' })).toBe(1.75);
  });

  it('no escala jugadores, npcs ni monstruos sin tamaño registrado', () => {
    expect(tokenSizeScale({ ...baseCombatant, type: 'player' })).toBe(1);
    expect(tokenSizeScale({ ...baseCombatant, type: 'npc' })).toBe(1);
    expect(tokenSizeScale({ ...baseCombatant, monsterSize: undefined })).toBe(1);
  });
});

describe('tokenShapeClass', () => {
  it('da una forma distinta a cada tipo de combatiente', () => {
    expect(tokenShapeClass({ ...baseCombatant, type: 'player' })).toBe('rounded-full');
    expect(tokenShapeClass({ ...baseCombatant, type: 'npc' })).toBe('rounded-xl');
    expect(tokenShapeClass({ ...baseCombatant, type: 'monster' })).toContain('rounded-[');
  });
});

describe('tokenColorClasses', () => {
  it('colorea por rol de NPC', () => {
    expect(tokenColorClasses({ ...baseCombatant, type: 'npc', npcRole: 'ally' })).toContain('sky');
    expect(tokenColorClasses({ ...baseCombatant, type: 'npc', npcRole: 'neutral' })).toContain('stone');
    expect(tokenColorClasses({ ...baseCombatant, type: 'npc', npcRole: 'enemy' })).toContain('orange');
    expect(tokenColorClasses({ ...baseCombatant, type: 'npc', npcRole: 'hostage' })).toContain('violet');
  });

  it('colorea jugadores en verde esmeralda y monstruos en rojo', () => {
    expect(tokenColorClasses({ ...baseCombatant, type: 'player' })).toContain('emerald');
    expect(tokenColorClasses({ ...baseCombatant, type: 'monster' })).toContain('red');
  });
});
