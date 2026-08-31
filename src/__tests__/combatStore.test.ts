// ============================================================
// Tests del store de combate
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { useCombatStore } from '../store/combatStore';
import type { Combatant } from '../types';

// Reiniciar el estado antes de cada prueba
beforeEach(() => {
  useCombatStore.setState({ isActive: false, participants: [], combatLog: [], round: 0, turn: 0 });
});

const makeCombatant = (
  overrides: { name?: string; initiative?: number; hp?: number; maxHp?: number; type?: Combatant['type'] } = {}
): Omit<Combatant, 'id' | 'isActive' | 'isDead'> => ({
  name: 'Test',
  initiative: 10,
  hp: 10,
  maxHp: 10,
  tempHp: 0,
  armorClass: 10,
  type: 'monster',
  statusEffects: [],
  ...overrides,
});

describe('Combat Store', () => {
  it('debe inicializar el combate', () => {
    const { initializeCombat } = useCombatStore.getState();
    initializeCombat();
    const state = useCombatStore.getState();
    expect(state.isActive).toBe(true);
    expect(state.round).toBe(1);
    expect(state.turn).toBe(0);
    expect(state.combatLog.length).toBeGreaterThan(0);
  });

  it('debe añadir un combatiente', () => {
    useCombatStore.getState().initializeCombat();
    useCombatStore.getState().addCombatant(makeCombatant({ name: 'Goblin', initiative: 15 }));
    const state = useCombatStore.getState();
    expect(state.participants).toHaveLength(1);
    expect(state.participants[0].name).toBe('Goblin');
    expect(state.participants[0].id).toBeTruthy();
  });

  it('debe pasar al siguiente turno y a la siguiente ronda', () => {
    initializeWithTwo();
    const s1 = useCombatStore.getState();
    expect(s1.round).toBe(1);
    useCombatStore.getState().nextTurn();
    let s = useCombatStore.getState();
    expect(s.turn).toBe(1);
    expect(s.round).toBe(1);
    useCombatStore.getState().nextTurn(); // vuelve al 0 → ronda 2
    s = useCombatStore.getState();
    expect(s.turn).toBe(0);
    expect(s.round).toBe(2);
  });

  it('debe aplicar daño y registrar la muerte', () => {
    initializeWithTwo();
    const id = useCombatStore.getState().participants[0].id;
    useCombatStore.getState().updateHP(id, 100, true);
    const p = useCombatStore.getState().participants[0];
    expect(p.hp).toBe(0);
    expect(p.isDead).toBe(true);
    const hasDeath = useCombatStore.getState().combatLog.some((e) => e.type === 'death');
    expect(hasDeath).toBe(true);
  });

  it('debe curar sin superar el máximo', () => {
    initializeWithTwo();
    const id = useCombatStore.getState().participants[0].id;
    useCombatStore.getState().updateHP(id, 3, true); // 7
    useCombatStore.getState().updateHP(id, 300, false); // max 10
    const p = useCombatStore.getState().participants[0];
    expect(p.hp).toBe(10);
  });

  it('debe eliminar un combatiente y ajustar el turno', () => {
    initializeWithTwo();
    const s = useCombatStore.getState();
    useCombatStore.getState().removeCombatant(s.participants[0].id);
    expect(useCombatStore.getState().participants).toHaveLength(1);
    expect(useCombatStore.getState().turn).toBe(0);
  });

  it('no debe añadir dos veces al mismo personaje del party', () => {
    useCombatStore.getState().initializeCombat();
    const player = makeCombatant({ name: 'Thorin', type: 'player' }) as Omit<Combatant, 'id' | 'isActive' | 'isDead'>;
    const first = useCombatStore.getState().addCombatant({ ...player, playerId: 'p-1' });
    expect(first).toBe(true);
    const second = useCombatStore.getState().addCombatant({ ...player, playerId: 'p-1' });
    expect(second).toBe(false);
    expect(useCombatStore.getState().participants).toHaveLength(1);
  });
});

function initializeWithTwo() {
  const { initializeCombat, addCombatant } = useCombatStore.getState();
  initializeCombat();
  addCombatant(makeCombatant({ name: 'A', initiative: 20, hp: 10, maxHp: 10 }));
  addCombatant(makeCombatant({ name: 'B', initiative: 10, hp: 10, maxHp: 10 }));
}