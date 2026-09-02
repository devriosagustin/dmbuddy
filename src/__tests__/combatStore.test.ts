// ============================================================
// Tests del store de combate
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { useCombatStore } from '../store/combatStore';
import { usePlayerStore } from '../store/playerStore';
import type { Combatant } from '../types';
import type { Player } from '../types';

// Reiniciar el estado antes de cada prueba
beforeEach(() => {
  useCombatStore.setState({
    isActive: false,
    participants: [],
    combatLog: [],
    round: 0,
    turn: 0,
    encounterCount: 0,
    mapCreatures: [],
  });
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

  it('debe cambiar la resolución del mapa recortando lo fuera de límites', () => {
    useCombatStore.getState().initializeCombat();
    useCombatStore.getState().setTiles([
      { x: 2, y: 2, type: 'wall' },
      { x: 40, y: 5, type: 'wall' }, // fuera del nuevo límite
    ]);
    useCombatStore.getState().addCombatant({
      ...makeCombatant({ name: 'Lejos', initiative: 15 }),
      x: 43,
      y: 23,
    });
    useCombatStore.getState().setMapSize(20, 12);
    const s = useCombatStore.getState();
    expect(s.mapCols).toBe(20);
    expect(s.mapRows).toBe(12);
    // El tile fuera de rango se recorta.
    expect(s.tiles).toEqual([{ x: 2, y: 2, type: 'wall' }]);
    // La ficha fuera de rango se recoloca en el borde.
    expect(s.participants[0].x).toBe(19);
    expect(s.participants[0].y).toBe(11);
    // Se registra el cambio de resolución.
    expect(s.combatLog.some((e) => e.message.includes('Mapa cambiado'))).toBe(true);
  });

  it('debe ignorar un cambio de resolución repetido', () => {
    useCombatStore.getState().setMapSize(20, 12);
    const logBefore = useCombatStore.getState().combatLog.length;
    useCombatStore.getState().setMapSize(20, 12);
    expect(useCombatStore.getState().mapCols).toBe(20);
    expect(useCombatStore.getState().combatLog.length).toBe(logBefore);
  });

  it('debe enviar un mensaje de chat guardándolo en la lista y en el registro', () => {
    useCombatStore.getState().initializeCombat();
    useCombatStore.getState().sendChatMessage({
      author: 'Sombra',
      kind: 'monster',
      text: 'La cripta está ocupada.',
      combatantId: 'm-1',
    });
    const s = useCombatStore.getState();
    expect(s.chat).toHaveLength(1);
    expect(s.chat[0].author).toBe('Sombra');
    expect(s.chat[0].kind).toBe('monster');
    expect(s.chat[0].text).toContain('cripta');
    expect(s.chat[0].id).toBeTruthy();
    const chatLog = s.combatLog.find((e) => e.type === 'chat');
    expect(chatLog).toBeTruthy();
    expect(chatLog?.message).toContain('Sombra');
  });

  it('debe limitar el historial de chat a los últimos mensajes', () => {
    useCombatStore.getState().initializeCombat();
    for (let i = 0; i < 210; i++) {
      useCombatStore.getState().sendChatMessage({ author: 'N', kind: 'dm', text: `msg ${i}` });
    }
    expect(useCombatStore.getState().chat).toHaveLength(200);
    expect(useCombatStore.getState().chat[199].text).toBe('msg 209');
  });

  it('debe repartir XP al finalizar, registrarla y guardar el award', () => {
    usePlayerStore.setState({ players: [] });
    const player = usePlayerStore.getState().addPlayer(makePlayer());
    useCombatStore.setState({
      id: 'combat-xp',
      isActive: true,
      participants: [
        xpMonster('m1', 'Goblin', 50),
        xpPlayerCombatant('p1', player),
      ],
      xpAwards: [],
    });
    useCombatStore.getState().endCombat();
    const s = useCombatStore.getState();
    expect(s.isActive).toBe(false);
    expect(s.xpAwards).toHaveLength(1);
    expect(s.xpAwards[0].playerId).toBe(player.id);
    expect(s.xpAwards[0].xp).toBe(50);
    expect(s.xpAwards[0].leveledUp).toBe(false);
    const p = usePlayerStore.getState().players.find((x) => x.id === player.id);
    expect(p?.xp).toBe(50);
    expect(s.combatLog.some((e) => e.type === 'xp' && e.message.includes('XP total del encuentro: 50'))).toBe(true);
  });

  it('debe marcar leveledUp en el award si la XP cruza el umbral de nivel', () => {
    usePlayerStore.setState({ players: [] });
    const player = usePlayerStore.getState().addPlayer(makePlayer());
    usePlayerStore.getState().addXp(player.id, 280); // 280 + 50 = 330 → Nivel 2
    useCombatStore.setState({
      id: 'combat-xp2',
      isActive: true,
      participants: [
        xpMonster('m1', 'Goblin', 50),
        xpPlayerCombatant('p1', player),
      ],
      xpAwards: [],
    });
    useCombatStore.getState().endCombat();
    const p = usePlayerStore.getState().players.find((x) => x.id === player.id);
    expect(p?.xp).toBe(330);
    expect(p?.level).toBe(2);
    const award = useCombatStore.getState().xpAwards[0];
    expect(award.leveledUp).toBe(true);
    expect(award.level).toBe(2);
  });

  it('no reparte XP cuando no quedan monstruos derrotados', () => {
    usePlayerStore.setState({ players: [] });
    const player = usePlayerStore.getState().addPlayer(makePlayer());
    useCombatStore.setState({
      id: 'combat-xp3',
      isActive: true,
      participants: [
        { ...xpMonster('m1', 'Goblin', 50), isDead: false },
        xpPlayerCombatant('p1', player),
      ],
      xpAwards: [],
    });
    useCombatStore.getState().endCombat();
    expect(useCombatStore.getState().xpAwards).toEqual([]);
    const p = usePlayerStore.getState().players.find((x) => x.id === player.id);
    expect(p?.xp ?? 0).toBe(0);
  });

  it('coloca y actualiza criaturas en el mapa de exploración', () => {
    const { addMapCreature, updateMapCreature, removeMapCreature } = useCombatStore.getState();
    addMapCreature({
      name: 'Goblin',
      kind: 'monster',
      hp: 7,
      maxHp: 7,
      tempHp: 0,
      armorClass: 15,
      speed: 30,
      x: 3,
      y: 4,
      statusEffects: [],
      isDead: false,
    });
    let mc = useCombatStore.getState().mapCreatures[0];
    expect(mc).toBeDefined();
    expect(mc.x).toBe(3);
    expect(mc.y).toBe(4);

    updateMapCreature(mc.id, { hp: 4 });
    mc = useCombatStore.getState().mapCreatures[0];
    expect(mc.hp).toBe(4);

    removeMapCreature(mc.id);
    expect(useCombatStore.getState().mapCreatures).toHaveLength(0);
  });

  it('inicia un encuentro desde criaturas del mapa y sincroniza HP al finalizar', () => {
    usePlayerStore.setState({ players: [] });
    const player = usePlayerStore.getState().addPlayer(makePlayer());
    const { addMapCreature, startEncounter, endCombat } = useCombatStore.getState();
    // Criatura con refId (monstruo de librería).
    addMapCreature({
      name: 'Orco',
      kind: 'monster',
      refId: 'orc-1',
      hp: 15,
      maxHp: 15,
      tempHp: 0,
      armorClass: 12,
      speed: 30,
      x: 5,
      y: 5,
      statusEffects: [],
      isDead: false,
    });
    const orco = useCombatStore.getState().mapCreatures[0];

    startEncounter([orco.id], [player.id]);
    let s = useCombatStore.getState();
    expect(s.isActive).toBe(true);
    expect(s.encounterCount).toBe(1);
    const orcoCombat = s.participants.find((p) => p.name === 'Orco');
    expect(orcoCombat).toBeDefined();

    // El orco recibe daño en el combate.
    useCombatStore.getState().updateHP(orcoCombat!.id, 9, true); // 15 -> 6
    endCombat();

    s = useCombatStore.getState();
    expect(s.isActive).toBe(false);
    // El orco sobrevive y conserva su PG en el mapa.
    const surviving = s.mapCreatures.find((c) => c.id === orco.id);
    expect(surviving).toBeDefined();
    expect(surviving!.hp).toBe(6);
    expect(surviving!.isDead).toBe(false);
  });

  it('retira del mapa las criaturas derrotadas en el combate', () => {
    usePlayerStore.setState({ players: [] });
    const player = usePlayerStore.getState().addPlayer(makePlayer());
    const { addMapCreature, startEncounter, endCombat } = useCombatStore.getState();
    addMapCreature({
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
    const goblin = useCombatStore.getState().mapCreatures[0];

    startEncounter([goblin.id], [player.id]);
    const goblinCombat = useCombatStore.getState().participants.find((p) => p.name === 'Goblin');
    useCombatStore.getState().updateHP(goblinCombat!.id, 20, true); // 7 -> 0
    endCombat();

    const s = useCombatStore.getState();
    // El goblin muerto se retira del mapa; los PJ se conservan en el mapa.
    expect(s.mapCreatures.some((c) => c.name === 'Goblin')).toBe(false);
  });

  it('los miembros del party no son criaturas y se conservan en el mapa tras el encuentro', () => {
    usePlayerStore.setState({ players: [] });
    const player = usePlayerStore.getState().addPlayer(makePlayer());
    const { addMapCreature, setPartyToken, startEncounter, endCombat } = useCombatStore.getState();
    // El DM coloca la ficha del PJ (partyTokens) y un monstruo (mapCreature).
    setPartyToken(player.id, 5, 5);
    addMapCreature({
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

    // El PJ NO es una criatura: no aparece en mapCreatures.
    let s = useCombatStore.getState();
    expect(s.mapCreatures.some((c) => c.name === player.name)).toBe(false);
    expect(s.partyTokens.some((t) => t.playerId === player.id)).toBe(true);

    const goblin = s.mapCreatures.find((c) => c.name === 'Goblin')!;
    startEncounter([goblin.id], [player.id]);
    s = useCombatStore.getState();
    // El PJ entra al encuentro conservando la posición de su ficha y NO se
    // duplica (aparece una sola vez, desde la lista del party).
    const partyCombatants = s.participants.filter((p) => p.name === player.name);
    expect(partyCombatants).toHaveLength(1);
    expect(partyCombatants[0].x).toBe(5);
    expect(partyCombatants[0].y).toBe(5);

    // El PJ cae a 0 PG en el combate.
    useCombatStore.getState().updateHP(partyCombatants[0].id, 99, true);
    endCombat();

    s = useCombatStore.getState();
    // El monstruo sobrevive; el PJ conserva su ficha en el mapa, en ningún
    // momento es una criatura y no se ha duplicado.
    expect(s.mapCreatures.some((c) => c.id === goblin.id)).toBe(true);
    expect(s.partyTokens.some((t) => t.playerId === player.id)).toBe(true);
    expect(s.mapCreatures.some((c) => c.name === player.name)).toBe(false);
    expect(s.partyTokens.length).toBe(1);
  });
});

function initializeWithTwo() {
  const { initializeCombat, addCombatant } = useCombatStore.getState();
  initializeCombat();
  addCombatant(makeCombatant({ name: 'A', initiative: 20, hp: 10, maxHp: 10 }));
  addCombatant(makeCombatant({ name: 'B', initiative: 10, hp: 10, maxHp: 10 }));
}

const makePlayer = (): Omit<Player, 'id' | 'proficiencyBonus'> => ({
  name: 'Thorin',
  level: 1,
  class: 'Guerrero',
  hp: 12,
  maxHp: 12,
  armorClass: 16,
  stats: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
});

const xpMonster = (id: string, name: string, xpReward: number): Combatant => ({
  id,
  name,
  initiative: 10,
  hp: 0,
  maxHp: 7,
  tempHp: 0,
  armorClass: 15,
  type: 'monster',
  isActive: true,
  isDead: true,
  statusEffects: [],
  xpReward,
});

const xpPlayerCombatant = (id: string, player: Player): Combatant => ({
  id,
  name: player.name,
  initiative: 12,
  hp: player.hp,
  maxHp: player.maxHp,
  tempHp: 0,
  armorClass: player.armorClass,
  type: 'player',
  isActive: true,
  isDead: false,
  statusEffects: [],
  playerId: player.id,
});