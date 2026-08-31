// ============================================================
// Hook de combate: conecta el store con utilidades
// ============================================================

import { useCallback, useMemo } from 'react';
import { useCombatStore } from '../store/combatStore';
import { sortByInitiative, hpRatio } from '../utils/combatUtils';
import type { Combatant, Monster, StatusEffect } from '../types';
import { monsterToCombatant, playerToCombatant } from '../utils/combatUtils';
import { usePlayerStore } from '../store/playerStore';

export const useCombat = () => {
  const store = useCombatStore();

  // Lista ordenada por iniciativa
  const sortedParticipants = useMemo(
    () => sortByInitiative(store.participants),
    [store.participants]
  );

  // Combatiente activo
  const activeCombatant = store.isActive
    ? sortedParticipants[store.turn] ?? null
    : null;

  // Estado de supervivencia del party
  const playersInCombat = useMemo(
    () => sortedParticipants.filter((c) => c.type === 'player'),
    [sortedParticipants]
  );

  const partyHealthAverage = useMemo(() => {
    if (playersInCombat.length === 0) return 0;
    const total = playersInCombat.reduce((acc, p) => acc + hpRatio(p), 0);
    return total / playersInCombat.length;
  }, [playersInCombat]);

  /**
   * Añade un monstruo de la biblioteca al combate actual.
   * Si no hay combate activo, lo inicializa primero.
   */
  const addMonsterToCombat = useCallback(
    (monster: Monster, initiative?: number) => {
      if (!store.isActive) store.initializeCombat();
      const roll = initiative ?? Math.floor(Math.random() * 20) + 1;
      store.addCombatant(monsterToCombatant(monster, roll));
    },
    [store]
  );

  const players = usePlayerStore((s) => s.players);

  /**
   * Añade un jugador de la party al combate actual.
   */
  const addPlayerToCombat = useCallback(
    (playerId: string, initiative?: number) => {
      const player = players.find((p) => p.id === playerId);
      if (!player) return;
      if (!store.isActive) store.initializeCombat();
      const roll = initiative ?? Math.floor(Math.random() * 20) + 1;
      store.addCombatant(playerToCombatant(player, roll));
    },
    [store, players]
  );

  /**
   * Aplica daño con manejo de temp HP.
   */
  const damageCombatant = useCallback(
    (id: string, amount: number) => {
      store.updateHP(id, Math.abs(amount), true);
    },
    [store]
  );

  /**
   * Cura a un combatiente.
   */
  const healCombatant = useCallback(
    (id: string, amount: number) => {
      store.updateHP(id, Math.abs(amount), false);
    },
    [store]
  );

  /**
   * Añade un estado de efecto con un ID único.
   */
  const applyStatus = useCallback(
    (id: string, effect: Omit<StatusEffect, 'id'>) => {
      store.addStatusEffect(id, effect);
    },
    [store]
  );

  return {
    ...store,
    sortedParticipants,
    activeCombatant,
    partyHealthAverage,
    addMonsterToCombat,
    addPlayerToCombat,
    damageCombatant,
    healCombatant,
    applyStatus,
    combatantExists: (id: string) => store.participants.some((c) => c.id === id),
    isTurnOf: (combatant: Combatant) => activeCombatant?.id === combatant.id,
  };
};