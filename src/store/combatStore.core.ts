// ============================================================
// Slice núcleo: turnos, participantes, registro de combate y XP.
// Parte de useCombatStore (ver combatStore.ts) — comparte set/get
// con los demás slices (map, session).
// ============================================================

import type { StateCreator } from 'zustand';
import type { Combatant, CombatLogEntry, StatusEffect, XpAward, PendingEncounter } from '../types';
import { sortByInitiative, playerToCombatant } from '../utils/combatUtils';
import { findSpawnCell, inBounds, gridDistanceFeet, isBlocked } from '../utils/mapUtils';
import { usePlayerStore } from './playerStore';
import { useSessionStore } from './sessionStore';
import { makeId, baseName, copyLetter, emitInitiativeRequest, creatureToCombatant } from './combatStore.helpers';
import type { CombatStore } from './combatStore';
import { useCombatStore } from './combatStore';

export type CoreSlice = Pick<
  CombatStore,
  | 'id'
  | 'round'
  | 'turn'
  | 'isActive'
  | 'participants'
  | 'combatLog'
  | 'startTime'
  | 'encounterCount'
  | 'xpAwards'
  | 'pendingEncounter'
  | 'initializeCombat'
  | 'addCombatant'
  | 'removeCombatant'
  | 'nextTurn'
  | 'previousTurn'
  | 'setTurn'
  | 'updateHP'
  | 'setMaxHP'
  | 'setAC'
  | 'setInitiative'
  | 'setSpeed'
  | 'updateCombatant'
  | 'moveCombatant'
  | 'reorderParticipants'
  | 'addStatusEffect'
  | 'removeStatusEffect'
  | 'tickStatusEffects'
  | 'addLogEntry'
  | 'endCombat'
  | 'resetCombat'
  | 'startEncounter'
>;

export const createCoreSlice: StateCreator<CombatStore, [], [], CoreSlice> = (set, get) => ({
  id: '',
  round: 0,
  turn: 0,
  isActive: false,
  participants: [],
  combatLog: [],
  startTime: new Date(),
  encounterCount: 0,
  xpAwards: [],
  pendingEncounter: null,

  initializeCombat: () => {
    set({
      id: makeId(),
      round: 1,
      turn: -1, // Ningún combatiente seleccionado hasta pulsar "Siguiente"
      isActive: true,
      participants: [],
      combatLog: [{
        id: makeId(),
        timestamp: new Date(),
        type: 'initiative',
        message: '¡Combate iniciado!',
      }],
      startTime: new Date(),
      encounterCount: (get().encounterCount ?? 0) + 1,
      xpAwards: [],
    });
  },

  addCombatant: (combatant) => {
    // Un mismo personaje del party no puede entrar dos veces en combate.
    if (combatant.playerId && get().participants.some((p) => p.playerId === combatant.playerId)) {
      return false;
    }
    // Etiquetar copias del mismo monstruo (Zombie -> Zombie a, b, c...)
    const isMonster = combatant.type === 'monster';
    const base = isMonster ? baseName(combatant.name) : null;
    const sameBefore = base
      ? get().participants.filter((p) => baseName(p.name) === base).length
      : 0;
    const name =
      isMonster && sameBefore >= 1 ? `${base} ${copyLetter(sameBefore)}` : combatant.name;
    const spawn = findSpawnCell(
      get().participants,
      combatant.type === 'player' || (combatant.type === 'npc' && combatant.npcRole === 'ally'),
      get().tiles
    );
    const newCombatant: Combatant = {
      ...combatant,
      name,
      id: makeId(),
      isActive: true,
      isDead: false,
      x: combatant.x ?? spawn.x,
      y: combatant.y ?? spawn.y,
    };
    set((state) => {
      const withNew = [...state.participants, newCombatant];
      // Re-etiquetar retroactivamente copias previas sin sufijo (p. ej. un
      // "Zombie" suelto pasa a "Zombie a" al añadir un segundo "Zombie b").
      if (isMonster && base) {
        const same = withNew.filter((p) => baseName(p.name) === base);
        if (same.length > 1) {
          const relabel = new Map(same.map((p, idx) => [p.id, `${base} ${copyLetter(idx)}`]));
          return {
            participants: sortByInitiative(
              withNew.map((p) => (relabel.has(p.id) ? { ...p, name: relabel.get(p.id)! } : p))
            ),
          };
        }
      }
      return { participants: sortByInitiative(withNew) };
    });
    get().addLogEntry({
      type: 'initiative',
      message: `${name} se une al combate (Iniciativa: ${combatant.initiative})`,
      combatantId: newCombatant.id,
    });
    return true;
  },

  removeCombatant: (id) => {
    const combatant = get().participants.find((c) => c.id === id);
    const rest = get().participants.filter((c) => c.id !== id);
    // Ajustar el turno actual si se eliminó un combatiente anterior o el actual
    const { turn, round } = get();
    let newTurn = turn;
    if (rest.length === 0) {
      newTurn = -1; // Sin combatientes: sin turno activo
    } else if (turn < 0) {
      newTurn = -1;
    } else if (turn >= rest.length) {
      newTurn = 0;
    } else if (id === get().participants[turn]?.id) {
      newTurn = turn % rest.length;
    } else {
      newTurn = Math.min(turn, rest.length - 1);
    }
    set({ participants: rest, turn: newTurn, round: newTurn === 0 && turn > 0 ? round + 1 : round });
    if (combatant) {
      get().addLogEntry({
        type: 'initiative',
        message: `${combatant.name} ha salido del combate`,
        combatantId: id,
      });
    }
  },

  nextTurn: () => {
    const { participants, turn, round, isActive } = get();
    if (!isActive || participants.length === 0) return;
    // Orden canónico: por iniciativa descendente (igual que la vista).
    const sorted = [...participants].sort((a, b) => b.initiative - a.initiative);

    // Sin turno activo todavía: pasar al primer combatiente de la lista.
    if (turn === -1) {
      set({ turn: 0 });
      get().addLogEntry({
        type: 'initiative',
        message: `Turno de ${sorted[0].name}`,
        combatantId: sorted[0].id,
      });
      return;
    }

    const nextIndex = (turn + 1) % sorted.length;
    const newRound = nextIndex === 0 ? round + 1 : round;

    set({ turn: nextIndex, round: newRound });

    // Al comenzar una nueva ronda, reducir duración de efectos
    if (nextIndex === 0) {
      get().tickStatusEffects();
      get().addLogEntry({
        type: 'status',
        message: `── Ronda ${newRound} ──`,
      });
    }
    get().addLogEntry({
      type: 'initiative',
      message: `Turno de ${sorted[nextIndex].name}`,
      combatantId: sorted[nextIndex].id,
    });
  },

  previousTurn: () => {
    const { participants, turn, round, isActive } = get();
    if (!isActive || participants.length === 0) return;
    if (turn === -1) return; // Aún no hay turno activo
    const sorted = [...participants].sort((a, b) => b.initiative - a.initiative);
    const prevIndex = (turn - 1 + sorted.length) % sorted.length;
    const newRound = prevIndex === sorted.length - 1 ? Math.max(1, round - 1) : round;
    set({ turn: prevIndex, round: newRound });
  },

  setTurn: (index) => {
    const { participants } = get();
    if (index < 0 || index >= participants.length) return;
    set({ turn: index });
  },

  updateHP: (id, amount, isDamage, useTempHpFirst = true) => {
    const combatant = get().participants.find((p) => p.id === id);
    if (!combatant) return;

    const details: string[] = [];
    let tempHpUsed = 0;
    let newHp = combatant.hp;
    let newTempHp = combatant.tempHp;

    if (isDamage) {
      let remaining = Math.abs(amount);
      if (useTempHpFirst && newTempHp > 0) {
        tempHpUsed = Math.min(newTempHp, remaining);
        newTempHp -= tempHpUsed;
        remaining -= tempHpUsed;
        details.push(`${tempHpUsed} a temp HP`);
      }
      newHp = Math.max(0, newHp - remaining);
    } else {
      newHp = Math.min(combatant.maxHp, newHp + Math.abs(amount));
    }

    const isDead = newHp <= 0;

    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id
          ? { ...p, hp: newHp, tempHp: newTempHp, isDead }
          : p
      ),
    }));

    if (isDamage) {
      get().addLogEntry({
        type: 'damage',
        message: `${combatant.name} recibe ${Math.abs(amount)} de daño${details.length ? ` (${details.join(', ')})` : ''}`,
        combatantId: id,
      });
      if (isDead) {
        get().addLogEntry({
          type: 'death',
          message: `${combatant.name} ha caído a 0 PG`,
          combatantId: id,
        });
      }
    } else {
      get().addLogEntry({
        type: 'heal',
        message: `${combatant.name} recupera ${Math.abs(amount)} PG`,
        combatantId: id,
      });
    }
  },

  setMaxHP: (id, maxHp) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, maxHp: Math.max(1, Math.round(maxHp)) } : p
      ),
    }));
  },

  setAC: (id, ac) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, armorClass: Math.max(0, Math.round(ac)) } : p
      ),
    }));
  },

  setInitiative: (id, initiative) => {
    const { participants } = get();
    const updated = participants.map((p) =>
      p.id === id ? { ...p, initiative: Number(initiative) } : p
    );
    // Reordenar por iniciativa tras el cambio (mantiene el orden canónico).
    set({ participants: sortByInitiative(updated) });
  },

  setSpeed: (id, speed) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, speed: Math.max(0, Math.round(speed)) } : p
      ),
    }));
  },

  updateCombatant: (id, updates) => {
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },

  moveCombatant: (id, x, y) => {
    const { participants, tiles, mapCols, mapRows } = get();
    const combatant = participants.find((p) => p.id === id);
    if (!combatant) return;
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    const clamped = inBounds(cx, cy)
      ? { x: cx, y: cy }
      : { x: Math.max(0, Math.min(mapCols - 1, cx)), y: Math.max(0, Math.min(mapRows - 1, cy)) };
    if (combatant.x === clamped.x && combatant.y === clamped.y) return;
    // Bloquear movimiento si hay un muro o una puerta cerrada en el destino.
    if (isBlocked(tiles, clamped.x, clamped.y)) return;
    const from = { x: combatant.x ?? 0, y: combatant.y ?? 0 };
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, x: clamped.x, y: clamped.y } : p
      ),
    }));
    // Registrar movimiento.
    const distance = gridDistanceFeet(from, clamped);
    get().addLogEntry({
      type: 'move',
      message: `${combatant.name} se mueve a (${clamped.x},${clamped.y}) — ${distance} pies`,
      combatantId: id,
    });
    // Triggers de tiles en el destino.
    const destTile = tiles.find((t) => t.x === clamped.x && t.y === clamped.y);
    if (destTile) {
      if (destTile.type === 'trap') {
        get().addLogEntry({
          type: 'move',
          message: `💥 ${combatant.name} activa una TRAMPA en (${clamped.x},${clamped.y})`,
          combatantId: id,
        });
      } else if (destTile.type === 'investigation') {
        get().addLogEntry({
          type: 'move',
          message: `🔍 ${combatant.name} investiga en (${clamped.x},${clamped.y}) — ¡Descubre algo!`,
          combatantId: id,
        });
      } else if (destTile.type === 'treasure') {
        get().addLogEntry({
          type: 'move',
          message: `💰 ${combatant.name} encuentra un TESORO en (${clamped.x},${clamped.y})`,
          combatantId: id,
        });
      }
    }
    // Trigger de tesoro adyacente (si hay tesoro en casillas vecinas).
    const adjacent = [
      { x: clamped.x - 1, y: clamped.y },
      { x: clamped.x + 1, y: clamped.y },
      { x: clamped.x, y: clamped.y - 1 },
      { x: clamped.x, y: clamped.y + 1 },
    ];
    for (const adj of adjacent) {
      const treasure = tiles.find((t) => t.x === adj.x && t.y === adj.y && t.type === 'treasure');
      if (treasure) {
        get().addLogEntry({
          type: 'move',
          message: `💰 ${combatant.name} detecta un TESORO cercano en (${treasure.x},${treasure.y})`,
          combatantId: id,
        });
      }
    }
  },

  reorderParticipants: (ordered) => {
    set({ participants: sortByInitiative(ordered) });
  },

  addStatusEffect: (id, effect) => {
    const fullEffect: StatusEffect = { ...effect, id: makeId() };
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id
          ? { ...p, statusEffects: [...p.statusEffects, fullEffect] }
          : p
      ),
    }));
    get().addLogEntry({
      type: 'status',
      message: `${get().participants.find((p) => p.id === id)?.name ?? 'Alguien'} queda bajo ${effect.name}`,
      combatantId: id,
    });
  },

  removeStatusEffect: (id, effectId) => {
    const combatant = get().participants.find((p) => p.id === id);
    const effect = combatant?.statusEffects.find((e) => e.id === effectId);
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id
          ? { ...p, statusEffects: p.statusEffects.filter((e) => e.id !== effectId) }
          : p
      ),
    }));
    if (effect) {
      get().addLogEntry({
        type: 'status',
        message: `${combatant?.name ?? 'Alguien'} ya no está bajo ${effect.name}`,
        combatantId: id,
      });
    }
  },

  tickStatusEffects: () => {
    const { participants } = get();
    const updated = participants.map((p) => ({
      ...p,
      statusEffects: p.statusEffects
        .map((e) => (e.duration > 0 ? { ...e, duration: e.duration - 1 } : e))
        .filter((e) => e.duration === -1 || e.duration > 0),
    }));
    set({ participants: updated });
  },

  addLogEntry: (entry) => {
    const fullEntry: CombatLogEntry = {
      ...entry,
      id: makeId(),
      timestamp: new Date(),
    };
    set((state) => ({
      combatLog: [...state.combatLog, fullEntry].slice(-100),
    }));
  },

  endCombat: () => {
    const { combatLog, participants } = get();
    // Reflejar el estado final de cada jugador en su ficha del party:
    // resta el daño recibido / aplica la curación, sin tocar PG de forma
    // automática. A 0 PG se mantiene a 0 (estabilizado o moribundo).
    let synced = 0;
    for (const c of participants) {
      if (c.playerId) {
        usePlayerStore.getState().updatePlayer(c.playerId, {
          hp: Math.max(0, Math.min(c.maxHp, c.hp)),
        });
        synced += 1;
      }
    }

    // Reparto de XP: se suman los monstruos derrotados y se dividen entre
    // los jugadores que participaron en el combate (vivos o caídos).
    const defeatedMonsters = participants.filter((c) => c.type === 'monster' && c.isDead);
    const playerCombatants = participants.filter((c) => c.type === 'player');
    const totalXp = defeatedMonsters.reduce(
      (sum, c) => sum + (c.xpReward ?? 0),
      0
    );

    const closeOut: CombatLogEntry[] = [
      { id: makeId(), timestamp: new Date(), type: 'initiative', message: 'Combate finalizado' },
    ];
    if (synced > 0) {
      closeOut.push({
        id: makeId(),
        timestamp: new Date(),
        type: 'custom',
        message: `${synced} jugador${synced !== 1 ? 'es' : ''} del party actualizado(s) a sus PG finales`,
      });
    }

    const xpAwards: XpAward[] = [];

    if (playerCombatants.length > 0 && totalXp > 0) {
      const awarded = playerCombatants
        .map((c) => c.playerId)
        .filter((id): id is string => Boolean(id));
      const base = Math.floor(totalXp / playerCombatants.length);
      const remainder = totalXp - base * playerCombatants.length;

      awarded.forEach((playerId, i) => {
        const share = base + (i === 0 ? remainder : 0);
        const before = usePlayerStore.getState().players.find((p) => p.id === playerId);
        const beforeLevel = before?.level;
        // addXp sincroniza automáticamente nivel y competencia al superar umbrales.
        usePlayerStore.getState().addXp(playerId, share);
        const afterLevel = usePlayerStore.getState().players.find((p) => p.id === playerId)?.level;
        xpAwards.push({
          playerId,
          name: before?.name ?? 'Un jugador',
          xp: share,
          leveledUp: Boolean(beforeLevel && afterLevel && afterLevel > beforeLevel),
          level: afterLevel ?? beforeLevel ?? 1,
        });
      });

      closeOut.push({
        id: makeId(),
        timestamp: new Date(),
        type: 'xp',
        message: `XP total del encuentro: ${totalXp} (${defeatedMonsters.length} monstruo${defeatedMonsters.length !== 1 ? 's' : ''} derrotado${defeatedMonsters.length !== 1 ? 's' : ''})`,
        details: { totalXp, defeatedCount: defeatedMonsters.length },
      });
      closeOut.push({
        id: makeId(),
        timestamp: new Date(),
        type: 'xp',
        message: awarded.length === 1
          ? `${usePlayerStore.getState().players.find((p) => p.id === awarded[0])?.name ?? 'Un jugador'} recibe ${totalXp} XP`
          : `Reparto entre ${awarded.length} participantes (${base} XP c/u${remainder > 0 ? ` + ${remainder} extra al primero` : ''})`,
        details: { base, remainder, totalXp },
      });
    } else if (defeatedMonsters.length > 0 && playerCombatants.length === 0) {
      closeOut.push({
        id: makeId(),
        timestamp: new Date(),
        type: 'xp',
        message: `Monstruos derrotados: ${totalXp} XP en total (sin jugadores en combate, no se reparte)`,
        details: { totalXp },
      });
    }

    set({ isActive: false, xpAwards, combatLog: [...combatLog, ...closeOut] });

    // Sincronizar el estado tras el combate con el mapa persistente:
    // - Los monstruos/NPCs que participaron y sobrevivieron conservan su PG
    //   en el mapa para futuros encuentros.
    // - Los monstruos/NPCs derrotados (0 PG) se retiran del mapa.
    // Los personajes del party NO son criaturas: su PG ya se sincronizó
    // arriba a playerStore y sus fichas (partyTokens) permanecen explorando.
    const mapCreatures = get().mapCreatures;
    const updated = mapCreatures
      .map((mc) => {
        // Buscar el combatiente del encuentro que corresponde a esta criatura:
        // por ref/name, por id (si se conservó) o como último recurso por su
        // posición en el mapa (criaturas sin refId añadidas a mano).
        const combatant =
          participants.find(
            (p) => p.id === mc.id || (mc.refId !== undefined && p.monsterId === mc.refId && p.name === mc.name)
          ) ??
          participants.find(
            (p) => (p.x === mc.x && p.y === mc.y && p.name === mc.name) || (p.x === mc.x && p.y === mc.y && p.type === mc.kind)
          );
        if (!combatant) return mc;
        // Monstruo/NPC muerto: retirarlo del mapa (filter más abajo lo elimina).
        if (combatant.isDead || combatant.hp <= 0) return { ...mc, isDead: true };
        return {
          ...mc,
          hp: combatant.hp,
          tempHp: combatant.tempHp,
          statusEffects: combatant.statusEffects,
          isDead: false,
        };
      })
      .filter((mc) => !mc.isDead)
      .map((mc) => ({ ...mc, isDead: false }));
    set({ mapCreatures: updated });
  },

  resetCombat: () => {
    // Al reiniciar/limpiar se deja el mapa en modo exploración: se conservan
    // tiles y criaturas colocadas, pero termina el encuentro en curso.
    set({
      participants: [],
      combatLog: [],
      turn: -1,
      round: 0,
      isActive: false,
      xpAwards: [],
      pendingEncounter: null,
      rollRequest: null,
    });
  },

  startEncounter: (creatureIds, playerIds) => {
    const { mapCreatures, partyTokens, tiles } = get();
    const selected = mapCreatures.filter((c) => creatureIds.includes(c.id));
    if (selected.length === 0 && playerIds.length === 0) return;

    const humanRoll = () =>
      1 + Math.floor(Math.random() * 20);

    const fromPlayer = (playerId: string): Omit<Combatant, 'id'> | null => {
      const player = usePlayerStore.getState().players.find((p) => p.id === playerId);
      if (!player) return null;
      return playerToCombatant(player, humanRoll());
    };

    const participants: Combatant[] = [];
    for (const p of playerIds) {
      const c = fromPlayer(p);
      if (c) {
        // Si el jugador ya tiene ficha en el mapa (exploración), conserva su
        // posición y PG actuales al entrar al encuentro. Los PJ no son
        // criaturas: su posición vive en partyTokens.
        const placed = partyTokens.find((t) => t.playerId === p);
        const spawn = findSpawnCell(participants, true, tiles);
        participants.push({
          ...c,
          id: makeId(),
          x: placed?.x ?? c.x ?? spawn.x,
          y: placed?.y ?? c.y ?? spawn.y,
          hp: c.hp,
        });
      }
    }
    for (const c of selected) {
      participants.push({ ...creatureToCombatant(c), id: makeId() });
    }

    const newId = makeId();

    // Miembros del party que están conectados (ficha remota publicada) cuyo
    // nombre coincide con un PJ seleccionado → les pedimos la iniciativa en
    // cascada. El resto (no conectados) se autotira como respaldo.
    const remotes = useSessionStore.getState().remotePlayers;
    const connectedNames: string[] = [];
    for (const rp of remotes) {
      if (!rp.sheet) continue;
      const isActive = (rp.sheet as { active?: unknown }).active !== false;
      const matched = participants.find(
        (pt) => pt.type === 'player' && pt.name === rp.name
      );
      if (isActive && matched && !connectedNames.includes(matched.name)) {
        connectedNames.push(matched.name);
      }
    }

    if (connectedNames.length > 0) {
      // Encuentro pendiente: esperamos la iniciativa de los conectados antes
      // de activar el combate. Los participantes llevan iniciativa provisional.
      set({
        id: newId,
        round: 0,
        turn: -1,
        isActive: false,
        participants: [],
        pendingEncounter: {
          id: newId,
          participants,
          pendingNames: connectedNames,
          currentName: connectedNames[0],
          tiles,
          mapCreatures: get().mapCreatures,
          partyTokens: get().partyTokens,
        },
        rollRequest: null,
        encounterCount: (get().encounterCount ?? 0) + 1,
      });
      get().addLogEntry({
        type: 'initiative',
        message: `🎲 Pidiendo iniciativa a: ${connectedNames.join(', ')}`,
      });
      emitInitiativeRequest(useCombatStore.getState().pendingEncounter as PendingEncounter);
      return;
    }

    // Sin conectados: inicio inmediato con iniciativas autotiradas.
    const sorted = sortByInitiative(participants);
    set({
      id: newId,
      round: 1,
      turn: -1,
      isActive: true,
      participants: sorted,
      combatLog: [
        {
          id: makeId(),
          timestamp: new Date(),
          type: 'initiative',
          message: `¡Encuentro iniciado con ${selected.length} criatura${selected.length !== 1 ? 's' : ''} y ${playerIds.length} jugador${playerIds.length !== 1 ? 'es' : ''}!`,
        },
      ],
      startTime: new Date(),
      encounterCount: (get().encounterCount ?? 0) + 1,
      xpAwards: [],
    });
    const names = sorted.map((c) => `${c.name} (${c.initiative})`);
    get().addLogEntry({
      type: 'initiative',
      message: `Iniciativa: ${names.join(', ')}`,
    });
  },
});
