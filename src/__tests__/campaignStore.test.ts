// ============================================================
// Tests del store de campañas (snapshots de party + combate)
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { useCampaignStore } from '../store/campaignStore';
import { usePlayerStore } from '../store/playerStore';
import { useCombatStore } from '../store/combatStore';
import type { Player } from '../types';

const makePlayer = (overrides: Partial<Player> = {}): Player => ({
  id: crypto.randomUUID(),
  name: 'Test',
  level: 1,
  class: 'Guerrero',
  hp: 10,
  maxHp: 10,
  armorClass: 10,
  proficiencyBonus: 2,
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
  usePlayerStore.setState({ players: [] });
  useCombatStore.setState({ isActive: false, participants: [], combatLog: [], round: 0, turn: 0 });
  useCampaignStore.setState({ campaigns: [], activeCampaignId: null });
});

describe('Campaign Store', () => {
  it('debe crear una campaña con el estado actual del party y activarla', () => {
    usePlayerStore.setState({ players: [makePlayer({ name: 'Aragon' })] });
    const id = useCampaignStore.getState().createCampaign('La Maldición de Strahd');

    const state = useCampaignStore.getState();
    expect(id).toBeTruthy();
    expect(state.activeCampaignId).toBe(id);
    expect(state.campaigns).toHaveLength(1);
    expect(state.campaigns[0].name).toBe('La Maldición de Strahd');
    expect(state.campaigns[0].snapshot.party[0].name).toBe('Aragon');
  });

  it('debe alternar entre campañas guardando y restaurando party y combate', () => {
    usePlayerStore.setState({ players: [makePlayer({ name: 'A' })] });
    useCombatStore.setState({ isActive: true, round: 3, turn: 2, encounterCount: 1, startTime: new Date(), combatLog: [{ id: 'l1', timestamp: new Date(), type: 'custom', message: 'inicio' }] });
    const a = useCampaignStore.getState().createCampaign('A')!;

    usePlayerStore.setState({ players: [makePlayer({ name: 'B' })] });
    useCombatStore.setState({ isActive: false, round: 1, turn: 0, combatLog: [] });
    useCampaignStore.getState().createCampaign('B');

    useCampaignStore.getState().loadCampaign(a);
    expect(useCampaignStore.getState().activeCampaignId).toBe(a);
    expect(usePlayerStore.getState().players[0].name).toBe('A');
    const combat = useCombatStore.getState();
    expect(combat.isActive).toBe(true);
    expect(combat.round).toBe(3);
    expect(combat.turn).toBe(2);
    expect(combat.combatLog[0].message).toBe('inicio');
    expect(combat.combatLog[0].timestamp).toBeInstanceOf(Date);
  });

  it('saveCurrent debe actualizar el snapshot de la campaña activa', () => {
    usePlayerStore.setState({ players: [makePlayer({ name: 'A' })] });
    useCampaignStore.getState().createCampaign('A');

    usePlayerStore.setState({ players: [] });
    useCampaignStore.getState().saveCurrent();

    expect(useCampaignStore.getState().campaigns[0].snapshot.party).toHaveLength(0);
  });

  it('debe eliminar una campaña y no dejar una activa huérfana', () => {
    const a = useCampaignStore.getState().createCampaign('A')!;
    useCampaignStore.getState().createCampaign('B');

    useCampaignStore.getState().deleteCampaign(a);
    expect(useCampaignStore.getState().campaigns).toHaveLength(1);
    expect(useCampaignStore.getState().activeCampaignId).not.toBe(a);

    useCampaignStore.getState().deleteCampaign(useCampaignStore.getState().campaigns[0].id);
    expect(useCampaignStore.getState().campaigns).toHaveLength(0);
    expect(useCampaignStore.getState().activeCampaignId).toBeNull();
  });
});