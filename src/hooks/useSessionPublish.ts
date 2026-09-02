// ============================================================
// Hook: el DM publica el combate y ajustes en Firebase cuando hay
// una sesión activa. Reacciona a cualquier cambio del combatStore.
// ============================================================

import { useEffect, useRef } from 'react';
import { useCombatStore } from '../store/combatStore';
import { useSessionStore } from '../store/sessionStore';
import { buildCombatSnapshot, publishCombat } from '../services/firebaseSync';

/**
 * Mantiene sincronizado el estado del combate local (DM) con la sesión
 * de Firebase. Solo publica cuando el rol activo es "dm" y la sesión está
 * conectada; los jugadores leen ese nodo en modo solo-lectura.
 */
export const useSessionPublish = () => {
  const role = useSessionStore((s) => s.role);
  const code = useSessionStore((s) => s.code);
  const status = useSessionStore((s) => s.status);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (role !== 'dm' || !code || status !== 'connected') return;

    const publishNow = () => {
      const s = useCombatStore.getState();
      const snapshot = buildCombatSnapshot({
        id: s.id,
        round: s.round,
        turn: s.turn,
        isActive: s.isActive,
        encounterCount: s.encounterCount,
        participants: s.participants,
        tiles: s.tiles,
        revealedTileKeys: s.revealedTileKeys,
        revealedEnemyIds: s.revealedEnemyIds,
        chat: s.chat,
      });
      void publishCombat(code, snapshot, {
        visionRange: s.visionRange,
        mapCols: s.mapCols ?? 28,
        mapRows: s.mapRows ?? 16,
      });
    };

    // Debounce simple: retraso fijo que se reinicia con cada cambio.
    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        publishNow();
      }, 200);
    };

    const unsubscribe = useCombatStore.subscribe(schedule);
    // Publicación inicial (por si el combate no ha cambiado desde que se conectó).
    publishNow();

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [role, code, status]);
};