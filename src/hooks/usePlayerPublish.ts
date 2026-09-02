// ============================================================
// Hook: los jugadores publican su ficha en la sesión. Reacciona
// a los cambios de su playerStore local y sube todas sus fichas.
// ============================================================

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useSessionStore } from '../store/sessionStore';
import { publishPlayerSheet } from '../services/firebaseSync';

/**
 * En modo jugador conectado, cada jugador publica sus personajes (su party
 * local) en la sesión para que el DM pueda traerlos. Debounce 300ms.
 */
export const usePlayerPublish = () => {
  const role = useSessionStore((s) => s.role);
  const code = useSessionStore((s) => s.code);
  const status = useSessionStore((s) => s.status);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (role !== 'player' || !code || status !== 'connected') return;

    const publishAll = () => {
      const players = usePlayerStore.getState().players;
      players.forEach((p) => {
        const sheet = JSON.parse(JSON.stringify(p)) as Record<string, unknown>;
        void publishPlayerSheet(code, `player-${p.id}`, sheet, p.name);
      });
    };

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        publishAll();
      }, 300);
    };

    const unsubscribe = usePlayerStore.subscribe(schedule);
    publishAll();

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [role, code, status]);
};