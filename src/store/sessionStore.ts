// ============================================================
// Store de sesión multijugador: rol, código y estado remoto.
// No se persiste en localStorage: cada carga parte sin sesión.
// ============================================================

import { create } from 'zustand';
import {
  createSessionMeta,
  normalizeCode,
  readSessionMeta,
  watchCombat,
  watchPlayers,
  type CombatPayload,
} from '../services/firebaseSync';
import type { RemotePlayerSheet, SessionRole } from '../types/session';

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

  createSession: (code: string) => Promise<boolean>;
  joinSession: (code: string) => Promise<boolean>;
  leaveSession: () => void;
  /** Aplica un snapshot remoto recibido (jugador). */
  setRemoteCombat: (payload: CombatPayload | null) => void;
  setRemotePlayers: (players: RemotePlayerSheet[]) => void;
  setError: (message: string | null) => void;
}

let activeDetach: (() => void) | null = null;

const detach = () => {
  activeDetach?.();
  activeDetach = null;
};

export const useSessionStore = create<SessionStore>()((set, get) => ({
  role: null,
  code: null,
  status: 'idle',
  error: null,
  remoteCombat: null,
  remotePlayers: [],
  recentCodes: [],

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
    });
  },

  setRemoteCombat: (payload) => set({ remoteCombat: payload }),
  setRemotePlayers: (players) => set({ remotePlayers: players }),
  setError: (message) => set({ error: message }),
}));