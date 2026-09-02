// ============================================================
// Capa de sincronización con Firebase Realtime Database.
// Estructura en el nodo `sessions/{code}`:
//   meta:       { dmId, createdAt }  (quien crea la sesión es el DM)
//   settings:   { visionRange }      (controlado por el DM)
//   combat:     snapshot del combate publicado por el DM
//   players:    fichas publicadas por cada jugador (clave = id de jugador)
// ============================================================

import { child, get, onValue, ref, set } from 'firebase/database';
import { db } from './firebase';
import type { ChatMessage, Combatant, MapTile, MapCreature, PartyToken, XpAward } from '../types';
import type { RemotePlayerSheet, SessionMeta, SessionSettings, SyncCombatSnapshot, RollResponsePayload, SyncRollRequest } from '../types/session';
import { tileKey } from '../types/session';

/** Código normalizado de sesión (mayúsculas, alfanumérico, sin espacios). */
export const normalizeCode = (code: string): string =>
  code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Ref raíz de una sesión. */
const sessionRef = (code: string) => ref(db, `sessions/${code}`);

// ---------- Meta -----------------------------------------------------------

export const createSessionMeta = async (code: string, dmId: string): Promise<void> => {
  const meta: SessionMeta = { dmId, createdAt: Date.now() };
  await set(child(sessionRef(code), 'meta'), meta);
};

export const readSessionMeta = async (code: string): Promise<SessionMeta | null> => {
  const snap = await get(child(sessionRef(code), 'meta'));
  return snap.val() as SessionMeta | null;
};

// ---------- Ajustes (DM) ----------------------------------------------------

export const writeSettings = async (code: string, settings: SessionSettings): Promise<void> => {
  await set(child(sessionRef(code), 'settings'), settings);
};

// ---------- Combate (DM publica, jugador lee) -------------------------------

/** Serializa valores que no admiten funciones ni Date (JSON round-trip). */
const sanitize = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export interface CombatPayload {
  snapshot: SyncCombatSnapshot;
  settings: SessionSettings;
}

/** Publica el estado actual de combate + ajustes visibles a la party. */
export const publishCombat = async (code: string, snapshot: SyncCombatSnapshot, settings: SessionSettings): Promise<void> => {
  await set(child(sessionRef(code), 'combat'), sanitize(snapshot));
  await set(child(sessionRef(code), 'settings'), settings);
};

/**
 * Suscribe al jugador al combate y ajustes publicados por el DM. Emite con el
 * último estado conocido de ambos nodos (las dos suscripciones pueden llegar
 * en cualquier orden).
 */
export const watchCombat = (code: string, cb: (payload: CombatPayload | null) => void): (() => void) => {
  let latestSnapshot: SyncCombatSnapshot | null = null;
  let latestSettings: SessionSettings | null = null;
  const emit = () => {
    if (latestSnapshot) cb({ snapshot: latestSnapshot, settings: latestSettings ?? { visionRange: 30, mapCols: 28, mapRows: 16 } });
    else cb(null);
  };
  const offCombat = onValue(child(sessionRef(code), 'combat'), (snap) => {
    latestSnapshot = snap.val() as SyncCombatSnapshot | null;
    emit();
  });
  const offSettings = onValue(child(sessionRef(code), 'settings'), (snap) => {
    latestSettings = snap.val() as SessionSettings | null;
    emit();
  });
  return () => {
    offCombat();
    offSettings();
  };
};

// ---------- Fichas de jugadores ----------------------------------------------

/** Publica (o actualiza) la ficha de un jugador en la sesión. */
export const publishPlayerSheet = async (
  code: string,
  playerId: string,
  sheet: Record<string, unknown>,
  name: string
): Promise<void> => {
  const payload: RemotePlayerSheet = { id: playerId, name, updatedAt: Date.now(), sheet };
  await set(child(child(sessionRef(code), 'players'), playerId), payload);
};

/** Suscribe al DM a las fichas publicadas por los jugadores. */
export const watchPlayers = (code: string, cb: (players: RemotePlayerSheet[]) => void): (() => void) => {
  const unsub = onValue(child(sessionRef(code), 'players'), (snap) => {
    const val = snap.val() as Record<string, RemotePlayerSheet> | null;
    const list = val ? Object.values(val) : [];
    cb(list);
  });
  return unsub;
};

/** Elimina la ficha de un jugador (para expulsarlo de la sesión). */
export const removePlayerSheet = async (code: string, playerId: string): Promise<void> => {
  await set(child(child(sessionRef(code), 'players'), playerId), null);
};

// ---------- Respuestas de tirada (jugador → DM) -----------------------------

/** Publica la respuesta de un jugador a una petición de tirada del DM. */
export const publishRollResponse = async (
  code: string,
  response: RollResponsePayload
): Promise<void> => {
  await set(child(child(sessionRef(code), 'responses'), response.requestId), sanitize(response));
};

/** Suscribe al DM a las respuestas de tirada publicadas por los jugadores. */
export const watchRollResponses = (
  code: string,
  cb: (responses: RollResponsePayload[]) => void
): (() => void) => {
  const unsub = onValue(child(sessionRef(code), 'responses'), (snap) => {
    const val = snap.val() as Record<string, RollResponsePayload> | null;
    const list = val ? Object.values(val) : [];
    cb(list);
  });
  return unsub;
};

// ---------- Helpers de cortina de guerra (lado jugador) ----------------------

/** Indica si el DM ha revelado la vida de un combatiente. */
export const isEnemyRevealed = (snapshot: SyncCombatSnapshot, id: string): boolean =>
  (snapshot.revealedEnemyIds ?? []).includes(id);

/** Indica si el DM ha revelado una casilla de trampa/tesoro/investigación. */
export const isTileRevealed = (snapshot: SyncCombatSnapshot, x: number, y: number): boolean =>
  (snapshot.revealedTileKeys ?? []).includes(tileKey(x, y));

/** Tipo de "enemigo" según tipo de combatiente (monstruo o NPC hostil). */
export const isHostileType = (c: Combatant): boolean => c.type === 'monster' || (c.type === 'npc' && c.npcRole === 'enemy');

/**
 * Construye el snapshot serializable del combate local (estado del DM) para
 * publicarlo a la party. Excluye el log (los jugadores no lo ven).
 */
export const buildCombatSnapshot = (
  state: {
    id: string;
    round: number;
    turn: number;
    isActive: boolean;
    encounterCount: number;
    participants: Combatant[];
    tiles: MapTile[];
    mapCreatures?: MapCreature[];
    partyTokens?: PartyToken[];
    revealedTileKeys: string[];
    revealedEnemyIds: string[];
    mapVisible?: boolean;
    rollRequest?: SyncRollRequest | null;
    chat: ChatMessage[];
    xpAwards?: XpAward[];
  }
): SyncCombatSnapshot => ({
  id: state.id,
  round: state.round,
  turn: state.turn,
  isActive: state.isActive,
  encounterCount: state.encounterCount,
  participants: state.participants,
  tiles: state.tiles,
  mapCreatures: state.mapCreatures ?? [],
  partyTokens: state.partyTokens ?? [],
  revealedTileKeys: state.revealedTileKeys ?? [],
  revealedEnemyIds: state.revealedEnemyIds ?? [],
  mapVisible: state.mapVisible ?? true,
  rollRequest: state.rollRequest ?? null,
  chat: state.chat ?? [],
  xpAwards: state.xpAwards ?? [],
});

export type { RemotePlayerSheet, Combatant, MapTile, ChatMessage };