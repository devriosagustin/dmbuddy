// ============================================================
// Store de sesión multijugador: rol, código y estado remoto.
// Se persiste rol + código en localStorage para volver a
// reconectar al recargar la página (restoreSession reinicia los
// listeners). El estado de conexión en sí no se persiste.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createSessionMeta,
  normalizeCode,
  readSessionMeta,
  watchCombat,
  watchPlayers,
  type CombatPayload,
} from '../services/firebaseSync';
import type { RemotePlayerSheet, SessionRole } from '../types/session';
import { usePlayerStore } from './playerStore';

export type SessionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'loading';

interface SessionStore {
  role: SessionRole;
  code: string | null;
  status: SessionStatus;
  error: string | null;
  /** Snapshot del combate (jugador) / estado publicado (DM). */
  remoteCombat: CombatPayload | null;
  /** Fichas remotas publicadas por jugadores (visible para el DM). */
  remotePlayers: RemotePlayerSheet[];
  /** Códigos de sesión usados recientemente (sugerencias). */
  recentCodes: string[];
  /** Id del último combate cuyo reparto de XP ya se aplicó localmente. */
  lastXpCombatId: string | null;

  createSession: (code: string) => Promise<boolean>;
  joinSession: (code: string) => Promise<boolean>;
  leaveSession: () => void;
  /** Aplica un snapshot remoto recibido (jugador). */
  setRemoteCombat: (payload: CombatPayload | null) => void;
  setRemotePlayers: (players: RemotePlayerSheet[]) => void;
  setError: (message: string | null) => void;
  /** Reestablece los listeners tras recargar con una sesión persistida. */
  restoreSession: () => void;
}

let activeDetach: (() => void) | null = null;

const detach = () => {
  activeDetach?.();
  activeDetach = null;
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      role: null,
      code: null,
      status: 'idle',
      error: null,
      remoteCombat: null,
      remotePlayers: [],
      recentCodes: [],
      lastXpCombatId: null,

      createSession: async (code) => {
        const normalized = normalizeCode(code);
        if (normalized.length < 3) {
          set({ error: 'El código debe tener al menos 3 caracteres alfanuméricos.' });
          return false;
        }

        detach();
        const dmId = `dm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

        set({ role: 'dm', code: normalized, status: 'connecting', error: null });
        try {
          const existing = await readSessionMeta(normalized);
          if (existing) {
            set({ role: null, code: null, status: 'error', error: 'Ese código ya está en uso. Prueba otro.' });
            return false;
          }
          await createSessionMeta(normalized, dmId);

          const detachPlayers = watchPlayers(normalized, (players) => {
            get().setRemotePlayers(players);
          });
          activeDetach = detachPlayers;
          set({ status: 'connected', error: null });
          return true;
        } catch {
          set({ role: null, code: null, status: 'error', error: 'No se pudo crear la sesión. Revisa tu conexión.' });
          return false;
        }
      },

      joinSession: async (code) => {
        const normalized = normalizeCode(code);
        if (normalized.length < 3) {
          set({ error: 'El código debe tener al menos 3 caracteres alfanuméricos.' });
          return false;
        }

        detach();
        set({ role: 'player', code: normalized, status: 'connecting', error: null });
        try {
          const meta = await readSessionMeta(normalized);
          if (!meta) {
            set({ role: null, code: null, status: 'error', error: 'No existe una sesión con ese código.' });
            return false;
          }

          const detachCombat = watchCombat(normalized, (payload) => {
            get().setRemoteCombat(payload);
          });
          activeDetach = detachCombat;
          set({ status: 'connected', error: null });
          return true;
        } catch {
          set({ role: null, code: null, status: 'error', error: 'No se pudo unir a la sesión. Revisa tu conexión.' });
          return false;
        }
      },

      leaveSession: () => {
        detach();
        set({
          role: null,
          code: null,
          status: 'idle',
          error: null,
          remoteCombat: null,
          remotePlayers: [],
          lastXpCombatId: null,
        });
      },

      setRemoteCombat: (payload) => {
        const snapshot = payload?.snapshot ?? null;
        // Al terminar un combate, el DM publica el reparto de XP: lo aplicamos
        // a los personajes locales de este jugador una sola vez por combate.
        if (
          snapshot &&
          !snapshot.isActive &&
          (snapshot.xpAwards?.length ?? 0) > 0 &&
          snapshot.id !== get().lastXpCombatId
        ) {
          const localIds = new Set(usePlayerStore.getState().players.map((p) => p.id));
          for (const award of snapshot.xpAwards ?? []) {
            if (localIds.has(award.playerId)) {
              usePlayerStore.getState().addXp(award.playerId, award.xp);
            }
          }
          set({ remoteCombat: payload, lastXpCombatId: snapshot.id });
          return;
        }
        set({ remoteCombat: payload });
      },
      setRemotePlayers: (players) => set({ remotePlayers: players }),
      setError: (message) => set({ error: message }),

      restoreSession: () => {
        const { role, code, status } = get();
        if (!role || !code || status === 'connected' || status === 'connecting') return;

        detach();
        set({ status: 'connecting', error: null });

        if (role === 'dm') {
          const detachPlayers = watchPlayers(code, (players) => {
            get().setRemotePlayers(players);
          });
          activeDetach = detachPlayers;
        } else {
          const detachCombat = watchCombat(code, (payload) => {
            get().setRemoteCombat(payload);
          });
          activeDetach = detachCombat;
        }
        set({ status: 'connected' });
      },
    }),
    {
      name: 'dmbuddy-session',
      partialize: (state) => ({
        role: state.role,
        code: state.code,
        lastXpCombatId: state.lastXpCombatId,
      }),
    },
  ),
);