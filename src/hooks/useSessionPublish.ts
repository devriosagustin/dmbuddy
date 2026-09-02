// ============================================================
// Hook: el DM publica el combate y ajustes en Firebase cuando hay
// una sesión activa. Reacciona a cualquier cambio del combatStore.
// ============================================================

import { useEffect, useRef } from 'react';
import { useCombatStore } from '../store/combatStore';
import { usePlayerStore } from '../store/playerStore';
import { useSessionStore } from '../store/sessionStore';
import { buildCombatSnapshot, publishCombat, watchRollResponses } from '../services/firebaseSync';
import { playerToCombatant } from '../utils/combatUtils';
import { DEFAULT_MAP_BACKGROUND } from '../config/mapBackgrounds';
import type { Combatant } from '../types';

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
      // Miembros del party del DM, convertidos a combatientes con su posición
      // en el mapa para que los jugadores siempre los vean (exploración).
      const partyCombatants: Combatant[] = s.partyTokens
        .map((t) => {
          const player = usePlayerStore.getState().players.find((p) => p.id === t.playerId);
          if (!player) return null;
          return {
            ...playerToCombatant(player, 0),
            id: `party-${player.id}`,
            x: t.x,
            y: t.y,
          } as Combatant;
        })
        .filter((c): c is Combatant => c !== null);
      const snapshot = buildCombatSnapshot({
        id: s.id,
        round: s.round,
        turn: s.turn,
        isActive: s.isActive,
        encounterCount: s.encounterCount,
        participants: s.participants,
        tiles: s.tiles,
        mapCreatures: s.mapCreatures,
        partyCombatants,
        revealedTileKeys: s.revealedTileKeys,
        revealedEnemyIds: s.revealedEnemyIds,
        mapVisible: s.mapVisible,
        rollRequest: s.rollRequest,
        chat: s.chat,
        xpAwards: s.xpAwards,
      });
      void publishCombat(code, snapshot, {
        visionRange: s.visionRange,
        mapCols: s.mapCols ?? 28,
        mapRows: s.mapRows ?? 16,
        mapBackground: s.mapBackground ?? DEFAULT_MAP_BACKGROUND,
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

  // El DM escucha las respuestas de tirada que publican los jugadores y las
  // aplica localmente (se registran en el log y cierran la petición vigente).
  useEffect(() => {
    if (role !== 'dm' || !code || status !== 'connected') return;
    const unsubscribe = watchRollResponses(code, (responses) => {
      const combat = useCombatStore.getState();
      const seen = new Set((combat.rollResponses ?? []).map((r) => r.requestId));
      for (const response of responses) {
        if (!seen.has(response.requestId)) {
          combat.receiveRollResponse(response);
          seen.add(response.requestId);
        }
      }
    });
    return unsubscribe;
  }, [role, code, status]);
};