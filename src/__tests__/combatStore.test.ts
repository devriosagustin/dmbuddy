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
    expect(state.turn).toBe(-1); // sin turno activo hasta pulsar «Siguiente»
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
    initializeWithTwo(); // turn -1, ronda 1
    useCombatStore.getState().nextTurn(); // -1 -> 0
    let s = useCombatStore.getState();
    expect(s.turn).toBe(0);
    expect(s.round).toBe(1);
    useCombatStore.getState().nextTurn(); // 0 -> 1
    s = useCombatStore.getState();
    expect(s.turn).toBe(1);
    expect(s.round).toBe(1);
    useCombatStore.getState().nextTurn(); // 1 -> 0 → ronda 2
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
    expect(useCombatStore.getState().turn).toBe(-1);
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

  it('debe asignar una posición inicial a cada combatiente', () => {
    useCombatStore.getState().initializeCombat();
    const x = useCombatStore.getState();
    x.addCombatant(makeCombatant({ name: 'Goblin', initiative: 15 }));
    x.addCombatant(makeCombatant({ name: 'Thorin', initiative: 12, type: 'player' }) as Omit<Combatant, 'id' | 'isActive' | 'isDead'>);
    const ps = useCombatStore.getState().participants;
    for (const p of ps) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
    }
    // PJ y monstruo no deben compartir la misma casilla.
    expect(ps[0].x === ps[1].x && ps[0].y === ps[1].y).toBe(false);
  });

  it('debe respetar una posición explícita al añadir', () => {
    useCombatStore.getState().initializeCombat();
    const combatant = makeCombatant({ name: 'Especial', initiative: 15 });
    useCombatStore.getState().addCombatant({ ...combatant, x: 5, y: 3 });
    const p = useCombatStore.getState().participants[0];
    expect(p.x).toBe(5);
    expect(p.y).toBe(3);
  });

  it('debe mover un combatiente a otra casilla', () => {
    useCombatStore.getState().initializeCombat();
    useCombatStore.getState().addCombatant(makeCombatant({ name: 'Goblin', initiative: 15 }));
    const id = useCombatStore.getState().participants[0].id;
    useCombatStore.getState().moveCombatant(id, 8, 4);
    const p = useCombatStore.getState().participants[0];
    expect(p.x).toBe(8);
    expect(p.y).toBe(4);
  });

  it('debe registrar el desplazamiento de una ficha en el log', () => {
    useCombatStore.getState().initializeCombat();
    useCombatStore.getState().addCombatant(makeCombatant({ name: 'Goblin', initiative: 15 }));
    const id = useCombatStore.getState().participants[0].id;
    const before = useCombatStore.getState().combatLog.length;
    useCombatStore.getState().moveCombatant(id, 8, 4);
    const after = useCombatStore.getState().combatLog;
    const moveEntry = after.find((e) => e.type === 'move');
    expect(moveEntry).toBeTruthy();
    expect(moveEntry?.message).toContain('Goblin');
    expect(moveEntry?.message).toContain('pies');
    expect(after.length).toBe(before + 1);
  });

  it('debe redondear y limitar las coordenadas al mover', () => {
    useCombatStore.getState().initializeCombat();
    useCombatStore.getState().addCombatant(makeCombatant({ name: 'Goblin', initiative: 15 }));
    const id = useCombatStore.getState().participants[0].id;
    useCombatStore.getState().moveCombatant(id, 3.6, -2);
    const p = useCombatStore.getState().participants[0];
    expect(p.x).toBe(3);
    expect(p.y).toBe(0); // no negativas
    useCombatStore.getState().moveCombatant(id, 99, 99);
    const p2 = useCombatStore.getState().participants[0];
    expect(p2.x).toBeLessThan(100);
  });
});

function initializeWithTwo() {
  const { initializeCombat, addCombatant } = useCombatStore.getState();
  initializeCombat();
  addCombatant(makeCombatant({ name: 'A', initiative: 20, hp: 10, maxHp: 10 }));
  addCombatant(makeCombatant({ name: 'B', initiative: 10, hp: 10, maxHp: 10 }));
}