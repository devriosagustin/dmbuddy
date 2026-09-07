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
import { DEFAULT_MAP_BACKGROUND } from '../config/mapBackgrounds';

/** Código normalizado de sesión (mayúsculas, alfanumérico, sin espacios). */
export const normalizeCode = (code: string): string =>
  code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Ref raíz de una sesión. */
const sessionRef = (code: string) => ref(db, `sessions/${code}`);

// ---------- Meta / ciclo de vida de la sesión -------------------------------

/**
 * Tiempo de inactividad tras el cual una sesión se considera abandonada y su
 * código vuelve a estar disponible: nadie borra nada proactivamente (no hay
 * backend/Cloud Functions en esta app), pero createSession/joinSession en
 * sessionStore.ts revisan esto y limpian la sesión vieja apenas alguien
 * intenta crear o unirse con ese código otra vez. 24hs: sobrevive una sesión
 * larga con pausas (cena, etc.) y, si el mismo código se reutiliza semana a
 * semana para la misma campaña, se resetea solo entre partidas sin que el DM
 * tenga que hacer nada. La sesión de Firebase es solo el canal de
 * sincronización EN VIVO de una partida (combate/chat/fichas publicadas) —
 * nada de la campaña (party, notas, mapas, NPCs) vive acá, así que borrar una
 * sesión vencida no pierde nada importante.
 */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** true si la sesión no tuvo actividad (o no se creó) hace más de SESSION_TTL_MS. */
export const isSessionExpired = (meta: SessionMeta, now: number = Date.now()): boolean =>
  now - (meta.lastActivityAt ?? meta.createdAt) > SESSION_TTL_MS;

export const createSessionMeta = async (code: string, dmId: string): Promise<void> => {
  const now = Date.now();
  const meta: SessionMeta = { dmId, createdAt: now, lastActivityAt: now };
  await set(child(sessionRef(code), 'meta'), meta);
};

export const readSessionMeta = async (code: string): Promise<SessionMeta | null> => {
  const snap = await get(child(sessionRef(code), 'meta'));
  return snap.val() as SessionMeta | null;
};

/** Marca actividad reciente en la sesión (llamado desde publishCombat, el
 * único heartbeat real de una sesión en curso). */
const touchSessionActivity = async (code: string): Promise<void> => {
  await set(child(sessionRef(code), 'meta/lastActivityAt'), Date.now());
};

/**
 * Borra toda la sesión (meta/settings/combat/players/responses) para que su
 * código vuelva a estar libre. Usado por endSession (DM, botón "Finalizar
 * sesión") y por createSession/joinSession cuando detectan un código vencido.
 */
export const deleteSession = async (code: string): Promise<void> => {
  await set(sessionRef(code), null);
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
  void touchSessionActivity(code).catch(() => {
    /* best-effort: no bloquea ni rompe la publicación de combate si falla */
  });
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
    if (latestSnapshot) cb({ snapshot: latestSnapshot, settings: latestSettings ?? { visionRange: 30, mapCols: 28, mapRows: 16, mapBackground: DEFAULT_MAP_BACKGROUND } });
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
    partyCombatants?: Combatant[];
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
  partyCombatants: state.partyCombatants ?? [],
  revealedTileKeys: state.revealedTileKeys ?? [],
  revealedEnemyIds: state.revealedEnemyIds ?? [],
  mapVisible: state.mapVisible ?? true,
  rollRequest: state.rollRequest ?? null,
  chat: state.chat ?? [],
  xpAwards: state.xpAwards ?? [],
});

export type { RemotePlayerSheet, Combatant, MapTile, ChatMessage };