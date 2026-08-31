// ============================================================
// Hook de dados: envuelve las utilidades con estado local
// ============================================================

import { useCallback, useState } from 'react';
import { useDiceStore } from '../store/diceStore';
import {
  rollDice,
  rollWithAdvantage,
  rollWithDisadvantage,
  rollExploding,
} from '../utils/diceUtils';
import type { DiceResult } from '../types';

export const useDice = () => {
  const store = useDiceStore();
  const [isRolling, setIsRolling] = useState(false);

  const commit = useCallback(
    (result: DiceResult) => {
      store.pushResult(result);
      return result;
    },
    [store]
  );

  /**
   * Lanza una fórmula textual de dados.
   */
  const roll = useCallback(
    (formula: string): DiceResult => {
      setIsRolling(true);
      const result = rollDice(formula);
      commit(result);
      setTimeout(() => setIsRolling(false), 400);
      return result;
    },
    [commit]
  );

  /**
   * Tirada de d20 con ventaja.
   */
  const rollAdvantage = useCallback(
    (modifier = 0): DiceResult => {
      setIsRolling(true);
      const result = rollWithAdvantage(modifier);
      commit(result);
      setTimeout(() => setIsRolling(false), 400);
      return result;
    },
    [commit]
  );

  /**
   * Tirada de d20 con desventaja.
   */
  const rollDisadvantage = useCallback(
    (modifier = 0): DiceResult => {
      setIsRolling(true);
      const result = rollWithDisadvantage(modifier);
      commit(result);
      setTimeout(() => setIsRolling(false), 400);
      return result;
    },
    [commit]
  );

  /**
   * Tirada de dados explosivos.
   */
  const rollExplode = useCallback(
    (sides: number, count = 1, modifier = 0): DiceResult => {
      setIsRolling(true);
      const result = rollExploding(sides, count, modifier);
      commit(result);
      setTimeout(() => setIsRolling(false), 400);
      return result;
    },
    [commit]
  );

  const clearHistory = useCallback(() => store.clearHistory(), [store]);

  return {
    history: store.history,
    favorites: store.favorites,
    addFavorite: store.addFavorite,
    removeFavorite: store.removeFavorite,
    isRolling,
    roll,
    rollAdvantage,
    rollDisadvantage,
    rollExplode,
    clearHistory,
  };
};