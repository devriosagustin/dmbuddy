// ============================================================
// Tests de peticiones de tirada (salvación/habilidad/iniciativa)
// y de la cascada de iniciativas al iniciar un encuentro.
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { useCombatStore } from '../store/combatStore';
import { usePlayerStore } from '../store/playerStore';
import { useSessionStore } from '../store/sessionStore';
import { playerInitiativeBonus, playerSavingThrowBonus } from '../utils/combatUtils';
import type { Player, RollResponse } from '../types';

beforeEach(() => {
  useCombatStore.setState({
    isActive: false,
    participants: [],
    combatLog: [],
    round: 0,
    turn: 0,
    encounterCount: 0,
    mapCreatures: [],
    partyTokens: [],
    rollRequest: null,
    rollResponses: [],
    pendingEncounter: null,
  });
  usePlayerStore.setState({ players: [] });
  useSessionStore.setState({ remotePlayers: [] });
});

const makePlayer = (name = 'Thorin'): Player => ({
  id: `p-${name}`,
  name,
  level: 3,
  class: 'Guerrero',
  hp: 20,
  maxHp: 20,
  armorClass: 16,
  proficiencyBonus: 2,
  stats: { str: 16, dex: 14, con: 14, int: 8, wis: 10, cha: 12 },
  skills: ['Atletismo'],
});

const addCreature = () => {
  useCombatStore.getState().addMapCreature({
    name: 'Goblin',
    kind: 'monster',
    hp: 7,
    maxHp: 7,
    tempHp: 0,
    armorClass: 15,
    speed: 30,
    x: 2,
    y: 2,
    statusEffects: [],
    isDead: false,
  });
  return useCombatStore.getState().mapCreatures[0];
};

describe('bonos de tirada', () => {
  it('playerInitiativeBonus usa solo mod de Destreza', () => {
    const p = makePlayer();
    expect(playerInitiativeBonus(p)).toBe(2); // DES 14 -> +2
  });

  it('playerSavingThrowBonus suma competencia por clase', () => {
    const p = makePlayer();
    // Guerrero es competente en FUE y CON.
    expect(playerSavingThrowBonus(p, 'str')).toBe(5); // FUE +3 + prof 2
    expect(playerSavingThrowBonus(p, 'wis')).toBe(0); // SAB +0 sin competencia
  });
});

describe('petición de habilidad', () => {
  it('registra en el log el total elegido por el jugador', () => {
    const { requestRoll, receiveRollResponse } = useCombatStore.getState();
    requestRoll({
      kind: 'skill',
      playerId: 'remote-1',
      playerName: 'Thorin',
      skills: ['Atletismo', 'Sigilo'],
      label: 'Saltar la fosa',
    });
    expect(useCombatStore.getState().rollRequest?.kind).toBe('skill');

    const res: RollResponse = {
      requestId: useCombatStore.getState().rollRequest!.id,
      kind: 'skill',
      playerId: 'remote-1',
      playerName: 'Thorin',
      die: 10,
      bonus: 5, // FUE +3 + competencia (Atletismo) +2
      result: 15,
      skill: 'Atletismo',
      ability: 'str',
      breakdown: '10 + 5 = 15',
      createdAt: Date.now(),
    };
    receiveRollResponse(res);
    const log = useCombatStore.getState().combatLog;
    const entry = log.find((e) => e.message.includes('total 15'));
    expect(entry).toBeDefined();
    expect(entry!.message).toContain('Atletismo');
    expect(useCombatStore.getState().rollRequest).toBeNull();
  });
});

describe('cascada de iniciativas al iniciar un encuentro', () => {
  it('si hay un jugador conectado (por nombre), espera su iniciativa y luego activa', () => {
    const player = usePlayerStore.getState().addPlayer(makePlayer());
    const creature = addCreature();
    useSessionStore.getState().setRemotePlayers([
      {
        id: 'remote-1',
        name: 'Thorin',
        updatedAt: Date.now(),
        sheet: { active: true, ownerPlayerId: 'remote-1' },
      },
    ]);

    useCombatStore.getState().startEncounter([creature.id], [player.id]);

    let s = useCombatStore.getState();
    // Aún no se activa: espera la iniciativa de "Thorin".
    expect(s.isActive).toBe(false);
    expect(s.pendingEncounter).not.toBeNull();
    expect(s.pendingEncounter!.pendingNames).toEqual(['Thorin']);
    // El encuentro pendiente ya contiene a la criatura y al PJ.
    expect(s.pendingEncounter!.participants.map((p) => p.name).sort()).toEqual(['Goblin', 'Thorin']);

    // El jugador responde su iniciativa: d20 15 + DES +2 = 17.
    const res: RollResponse = {
      requestId: s.rollRequest!.id,
      kind: 'initiative',
      playerId: 'remote-1',
      playerName: 'Thorin',
      die: 15,
      bonus: 2,
      result: 17,
      initiative: 17,
      breakdown: '15 + 2 = 17',
      createdAt: Date.now(),
    };
    useCombatStore.getState().receiveRollResponse(res);

    s = useCombatStore.getState();
    expect(s.isActive).toBe(true);
    expect(s.pendingEncounter).toBeNull();
    const thorin = s.participants.find((p) => p.name === 'Thorin');
    expect(thorin!.initiative).toBe(17);
    // Ordenado por iniciativa descendente.
    expect(s.participants[0].initiative).toBeGreaterThanOrEqual(s.participants[1].initiative);
  });

  it('finalizeEncounter continúa con iniciativa provisional si un jugador no responde', () => {
    const player = usePlayerStore.getState().addPlayer(makePlayer());
    const creature = addCreature();
    useSessionStore.getState().setRemotePlayers([
      {
        id: 'remote-1',
        name: 'Thorin',
        updatedAt: Date.now(),
        sheet: { active: true, ownerPlayerId: 'remote-1' },
      },
    ]);

    useCombatStore.getState().startEncounter([creature.id], [player.id]);
    expect(useCombatStore.getState().isActive).toBe(false);

    // El DM pulsa "Continuar" sin respuesta.
    useCombatStore.getState().finalizeEncounter();
    const s = useCombatStore.getState();
    expect(s.isActive).toBe(true);
    expect(s.pendingEncounter).toBeNull();
  });

  it('sin jugadores conectados, el encuentro inicia de inmediato', () => {
    const player = usePlayerStore.getState().addPlayer(makePlayer());
    const creature = addCreature();
    useCombatStore.getState().startEncounter([creature.id], [player.id]);
    expect(useCombatStore.getState().isActive).toBe(true);
    expect(useCombatStore.getState().pendingEncounter).toBeNull();
  });
});
