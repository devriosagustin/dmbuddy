// ============================================================
// Tipos para la sincronización de sesiones (Firebase RTDB)
// ============================================================

import type { ChatMessage, Combatant, MapTile, MapCreature, PartyToken, XpAward, RollRequest, RollRequest as SyncRollRequest, RollResponse, RollAbility, RollKind } from './index';

/** Snapshot del combate publicado por el DM (formato serializable). */
export interface SyncCombatSnapshot {
  id: string;
  round: number;
  turn: number;
  isActive: boolean;
  encounterCount: number;
  participants: Combatant[];
  tiles: MapTile[];
  /** Criaturas persistentes del mapa (también presentes en exploración). */
  mapCreatures?: MapCreature[];
  /** Posiciones de los miembros del party en el mapa (no son criaturas). */
  partyTokens?: PartyToken[];
  /** Miembros del party del DM como combatientes listos para renderizar (siempre visibles). */
  partyCombatants?: Combatant[];
  /** Claves "x-y" de tiles de trampa/tesoro/investigación reveladas a la party. */
  revealedTileKeys: string[];
  /** Ids de enemigos cuya vida es visible a la party. */
  revealedEnemyIds: string[];
  /** false = el party ve "El DM está preparando el mapa" en vez del mapa. */
  mapVisible: boolean;
  /** Petición de tirada vigente del DM (null/ausente si no hay ninguna). */
  rollRequest?: SyncRollRequest | null;
  /** Mensajes de chat/lore del DM (Narrador, NPC o monstruo). */
  chat: ChatMessage[];
  /** Reparto de XP del último combate finalizado (ausente en snapshots antiguos). */
  xpAwards?: XpAward[];
}

/** Ajustes de la sesión controlados por el DM. */
export interface SessionSettings {
  /** Radio de visión (en pies) para la cortina de guerra del jugador. */
  visionRange: number;
  /** Columnas de la cuadrícula del mapa (resolución). */
  mapCols: number;
  /** Filas de la cuadrícula del mapa (resolución). */
  mapRows: number;
}

/** Metadatos de la sesión. */
export interface SessionMeta {
  dmId: string;
  createdAt: number;
  /** Contraseña opcional (validación de conveniencia; la seguridad real van por Security Rules). */
  password?: string;
}

/** Ficha de un jugador publicada en la sesión. */
export interface RemotePlayerSheet {
  id: string;
  name: string;
  updatedAt: number;
  sheet: Record<string, unknown>;
}

// Re-export de los tipos de petición/respuesta de tirada (definidos en index).
export type { RollRequest as SyncRollRequest, RollResponse as RollResponsePayload, RollAbility, RollKind };

/**
 * Petición de tirada que el DM envía a un jugador (se publica dentro del
 * snapshot de combate y el jugador la lee en vivo). Ej.: una tirada de
 * salvación de Constitución contra un DC concreto.
 */

export type SessionRole = 'dm' | 'player' | null;

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

/**
 * Convierte un MapTile a su clave "x-y" única usada para revelar tiles.
 */
export const tileKey = (x: number, y: number): string => `${x}-${y}`;