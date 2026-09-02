// ============================================================
// Tipos para la sincronización de sesiones (Firebase RTDB)
// ============================================================

import type { ChatMessage, Combatant, MapTile, MapCreature, PartyToken, XpAward } from './index';

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
  /** Claves "x-y" de tiles de trampa/tesoro/investigación reveladas a la party. */
  revealedTileKeys: string[];
  /** Ids de enemigos cuya vida es visible a la party. */
  revealedEnemyIds: string[];
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

export type SessionRole = 'dm' | 'player' | null;

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

/**
 * Convierte un MapTile a su clave "x-y" única usada para revelar tiles.
 */
export const tileKey = (x: number, y: number): string => `${x}-${y}`;