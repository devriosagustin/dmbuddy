// ============================================================
// Hook: los jugadores publican su ficha en la sesión. Reacciona
// a los cambios de su playerStore local y sube todas sus fichas.
// ============================================================

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useSessionStore } from '../store/sessionStore';
import { publishPlayerSheet } from '../services/firebaseSync';

/**
 * En modo jugador conectado, cada jugador publica SOLO el personaje que eligió
 * traer (su "personaje activo") para que el DM lo reciba. El resto de su party
 * local no se publica. Debounce 300ms.
 */
export const usePlayerPublish = () => {
  const role = useSessionStore((s) => s.role);
  const code = useSessionStore((s) => s.code);
  const status = useSessionStore((s) => s.status);
  const activePlayerId = useSessionStore((s) => s.activePlayerId);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (role !== 'player' || !code || status !== 'connected') return;

    const publishActive = () => {
      const activeId = useSessionStore.getState().activePlayerId;
      if (!activeId) return;
      const player = usePlayerStore.getState().players.find((p) => p.id === activeId);
      if (!player) return;
      const sheet = JSON.parse(JSON.stringify(player)) as Record<string, unknown>;
      // Marca esta ficha como "activa": es el personaje que este jugador trae.
      sheet.active = true;
      sheet.ownerPlayerId = activeId;
      void publishPlayerSheet(code, `player-${activeId}`, sheet, player.name);
    };

    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        publishActive();
      }, 300);
    };

    publishActive();
    const unsubscribe = usePlayerStore.subscribe(schedule);
    const unsubSession = useSessionStore.subscribe((s) => {
      if (s.activePlayerId !== activePlayerId) schedule();
    });

    return () => {
      unsubscribe();
      unsubSession();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [role, code, status, activePlayerId]);
};