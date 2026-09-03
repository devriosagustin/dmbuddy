// ============================================================
// Store de combate (Zustand con persistencia)
// Combina 3 slices que comparten el mismo set/get (patrón oficial
// de Zustand): combatStore.core.ts (turnos/participantes/log/XP),
// combatStore.map.ts (tiles/criaturas del mapa/fichas del party) y
// combatStore.session.ts (chat/tiradas/encuentro pendiente).
// Helpers compartidos en combatStore.helpers.ts.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CombatState, Combatant, CombatLogEntry, StatusEffect, MapTile, TileType, ChatMessage, MapCreature, RollRequest, RollResponse } from '../types';
import { setActiveMapSize, MAP_COLS, MAP_ROWS } from '../utils/mapUtils';
import { migrateWeapons } from './combatStore.helpers';
import { createCoreSlice } from './combatStore.core';
import { createMapSlice } from './combatStore.map';
import { createSessionSlice } from './combatStore.session';

export interface CombatStore extends CombatState {  // Acciones
  initializeCombat: () => void;
  addCombatant: (combatant: Omit<Combatant, 'id' | 'isActive' | 'isDead'>) => boolean;
  removeCombatant: (id: string) => void;
  nextTurn: () => void;
  previousTurn: () => void;
  setTurn: (index: number) => void;
  updateHP: (id: string, amount: number, isDamage: boolean, useTempHpFirst?: boolean) => void;
  setMaxHP: (id: string, maxHp: number) => void;
  setAC: (id: string, ac: number) => void;
  setInitiative: (id: string, initiative: number) => void;
  setSpeed: (id: string, speed: number) => void;
  /** Alterna un tile en el mapa (wall/trap/treasure/investigation). */
  toggleTile: (x: number, y: number, type: TileType) => void;
  /** Reemplaza todos los tiles (para cargar un layout de mapa). */
  setTiles: (tiles: MapTile[]) => void;
  /** Elimina todos los tiles. */
  clearTiles: () => void;
  reorderParticipants: (ordered: Combatant[]) => void;
  /** Actualiza campos arbitrarios de un combatiente del combate activo. */
  updateCombatant: (id: string, updates: Partial<Combatant>) => void;
  /** Mueve una ficha a una casilla del mapa (coordenadas columna/fila). */
  moveCombatant: (id: string, x: number, y: number) => void;
  addStatusEffect: (id: string, effect: Omit<StatusEffect, 'id'>) => void;
  removeStatusEffect: (id: string, effectId: string) => void;
  tickStatusEffects: () => void;
  addLogEntry: (entry: Omit<CombatLogEntry, 'id' | 'timestamp'>) => void;
  endCombat: () => void;
  resetCombat: () => void;
  /** Coloca una criatura persistente en el mapa (monstruo/NPC). */
  addMapCreature: (creature: Omit<MapCreature, 'id'>) => void;
  /** Retira una criatura persistente del mapa. */
  removeMapCreature: (id: string) => void;
  /** Actualiza campos de una criatura persistente del mapa. */
  updateMapCreature: (id: string, updates: Partial<MapCreature>) => void;
  /** Fija o mueve la posición de ficha de un miembro del party en el mapa. */
  setPartyToken: (playerId: string, x: number, y: number) => void;
  /** Retira la ficha de un miembro del party del mapa. */
  removePartyToken: (playerId: string) => void;
  /** Vacía el mapa de criaturas y fichas del party (lo deja limpio). */
  clearMap: () => void;
  /** Inicia un encuentro con las criaturas indicadas + el party indicado. */
  startEncounter: (creatureIds: string[], playerIds: string[]) => void;
  /** Revela u oculta una casilla (trampa/tesoro/investigación) a la party. */
  toggleRevealTile: (x: number, y: number) => void;
  /** Revela u oculta la vida de un enemigo a la party. */
  toggleRevealEnemy: (id: string) => void;
  /** Fija el radio de visión (pies) de la cortina de guerra. */
  setVisionRange: (feet: number) => void;
  /** Cambia el patrón de fondo de la cuadrícula del mapa. */
  setMapBackground: (id: string) => void;
  /** Cambia la resolución de la cuadrícula (columnas/filas) del mapa. */
  setMapSize: (cols: number, rows: number) => void;
  /** Activa/desactiva si el party puede ver el mapa. */
  setMapVisible: (visible: boolean) => void;
  /** Vacía el chat/lore de la sesión. */
  clearChat: () => void;
  /** Envía una petición de tirada a un jugador (se publica en el snapshot). */
  requestRoll: (request: Omit<RollRequest, 'id' | 'createdAt'>) => void;
  /** Guarda la respuesta de un jugador, la registra y cierra la petición. */
  receiveRollResponse: (response: RollResponse) => void;
  /** Cancela la petición de tirada vigente sin esperar respuesta. */
  cancelRollRequest: () => void;
  /**
   * Cierra el encuentro pendiente de iniciativas: aplica las iniciativas
   * recibidas (fallback si faltan) y activa el combate con el orden final.
   */
  finalizeEncounter: () => void;
  /** Cancela un encuentro pendiente de iniciativas (no se inicia combate). */
  cancelPendingEncounter: () => void;
  /** Envía un mensaje de chat/lore: se guarda en el registro y se sincroniza. */
  sendChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
}

export const useCombatStore = create<CombatStore>()(
  persist(
    (set, get, api) => ({
      ...createCoreSlice(set, get, api),
      ...createMapSlice(set, get, api),
      ...createSessionSlice(set, get, api),
    }),
    {
      name: 'combat-storage',
      // v1 = un PJ puede llevar varias armas equipadas (weaponIds).
      // v2 = capa de criaturas persistentes del mapa (mapCreatures).
      // v3 = los miembros del party ya no son criaturas: se separan en
      //      partyTokens (posición en el mapa) y se sacan de mapCreatures.
      version: 3,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as {
          participants?: Array<Record<string, unknown>>;
          mapCreatures?: Array<Record<string, unknown>>;
          partyTokens?: unknown;
        };
        let out = state as Record<string, unknown>;
        if (version < 1) {
          out = migrateWeapons(state as never);
        }
        if (out.mapCreatures === undefined) {
          out.mapCreatures = [];
        }
        if (out.partyTokens === undefined) {
          out.partyTokens = [];
        }
        // v3: separar a los miembros del party (kind === 'player') que aún
        // vivieran como criaturas en mapCreatures hacia partyTokens.
        if (version < 3) {
          const creatures = (out.mapCreatures as Array<Record<string, unknown>>) ?? [];
          const playersAsCreatures = creatures.filter((c) => c.kind === 'player');
          const cleanCreatures = creatures.filter((c) => c.kind !== 'player');
          const tokens: Array<{ playerId: string; x: number; y: number }> = [
            ...((out.partyTokens as Array<{ playerId: string; x: number; y: number }>) ?? []),
            ...playersAsCreatures
              .filter((c) => typeof c.playerId === 'string')
              .map((c) => ({
                playerId: c.playerId as string,
                x: typeof c.x === 'number' ? c.x : 0,
                y: typeof c.y === 'number' ? c.y : 0,
              })),
          ];
          out = { ...out, mapCreatures: cleanCreatures, partyTokens: tokens };
        }
        return out as unknown as CombatStore;
      },
      // Al rehidratar, resincroniza las dimensiones activas con las guardadas.
      onRehydrateStorage: () => (state) => {
        if (state) {
          setActiveMapSize(state.mapCols ?? MAP_COLS, state.mapRows ?? MAP_ROWS);
        }
      },
    }
  )
);
