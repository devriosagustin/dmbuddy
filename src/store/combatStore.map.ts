// ============================================================
// Slice de mapa: tiles, criaturas persistentes y fichas del party.
// Parte de useCombatStore (ver combatStore.ts) — comparte set/get
// con los demás slices (core, session).
// ============================================================

import type { StateCreator } from 'zustand';
import type { MapTile, TileType, MapCreature } from '../types';
import { inBounds, setActiveMapSize, MAP_COLS, MAP_ROWS } from '../utils/mapUtils';
import { tileKey } from '../types/session';
import { DEFAULT_MAP_BACKGROUND } from '../config/mapBackgrounds';
import { usePlayerStore } from './playerStore';
import { makeId, baseName, copyLetter } from './combatStore.helpers';
import type { CombatStore } from './combatStore';

export type MapSlice = Pick<
  CombatStore,
  | 'tiles'
  | 'mapCreatures'
  | 'partyTokens'
  | 'revealedTileKeys'
  | 'revealedEnemyIds'
  | 'visionRange'
  | 'mapCols'
  | 'mapRows'
  | 'mapVisible'
  | 'mapBackground'
  | 'toggleTile'
  | 'setTiles'
  | 'clearTiles'
  | 'addMapCreature'
  | 'removeMapCreature'
  | 'updateMapCreature'
  | 'setPartyToken'
  | 'removePartyToken'
  | 'clearMap'
  | 'toggleRevealTile'
  | 'toggleRevealEnemy'
  | 'setVisionRange'
  | 'setMapBackground'
  | 'setMapSize'
  | 'setMapVisible'
>;

export const createMapSlice: StateCreator<CombatStore, [], [], MapSlice> = (set, get) => ({
  tiles: [],
  mapCreatures: [],
  partyTokens: [],
  revealedTileKeys: [],
  revealedEnemyIds: [],
  visionRange: 30,
  mapCols: MAP_COLS,
  mapRows: MAP_ROWS,
  mapVisible: true,
  mapBackground: DEFAULT_MAP_BACKGROUND,

  toggleTile: (x, y, type: TileType) => {
    const { tiles } = get();
    const idx = tiles.findIndex((t) => t.x === x && t.y === y);
    if (idx >= 0) {
      // Si ya existe un tile del mismo tipo, lo quita (toggle off).
      // Si es de otro tipo, lo reemplaza.
      if (tiles[idx].type === type) {
        if (type === 'door') {
          // Puerta: alterna entre cerrada y abierta.
          const updated = [...tiles];
          updated[idx] = { ...updated[idx], open: updated[idx].open === true ? false : true };
          set({ tiles: updated });
        } else {
          set({ tiles: tiles.filter((t) => !(t.x === x && t.y === y)) });
        }
      } else {
        const updated = [...tiles];
        updated[idx] = { x, y, type };
        set({ tiles: updated });
      }
    } else if (inBounds(x, y)) {
      // Añadir nuevo tile (las puertas nacen cerradas).
      const tile: MapTile = type === 'door' ? { x, y, type, open: false } : { x, y, type };
      set({ tiles: [...tiles, tile] });
    }
  },

  setTiles: (tiles) => {
    set({ tiles: tiles.filter((t) => inBounds(t.x, t.y)) });
  },

  clearTiles: () => {
    set({ tiles: [] });
  },

  addMapCreature: (creature) => {
    // Etiquetar copias del mismo monstruo (Wolf -> Wolf A, Wolf B...).
    const base = baseName(creature.name);
    const sameBefore = get().mapCreatures.filter((c) => baseName(c.name) === base).length;
    const name = sameBefore >= 1 ? `${base} ${copyLetter(sameBefore)}` : creature.name;
    const full: MapCreature = {
      ...creature,
      name,
      id: makeId(),
      isDead: false,
    };
    set((state) => {
      let withNew = [...state.mapCreatures, full];
      // Re-etiquetar retroactivamente copias previas sin sufijo (p. ej. un
      // "Wolf" suelto pasa a "Wolf A" al añadir un segundo "Wolf B").
      const same = withNew.filter((c) => baseName(c.name) === base);
      if (same.length > 1) {
        const relabel = new Map(same.map((c, idx) => [c.id, `${base} ${copyLetter(idx)}`]));
        withNew = withNew.map((c) => (relabel.has(c.id) ? { ...c, name: relabel.get(c.id)! } : c));
      }
      return { mapCreatures: withNew };
    });
    get().addLogEntry({
      type: 'custom',
      message: `🪧 ${name} colocado en el mapa en (${creature.x},${creature.y})`,
    });
  },

  removeMapCreature: (id) => {
    const creature = get().mapCreatures.find((c) => c.id === id);
    set((state) => ({ mapCreatures: state.mapCreatures.filter((c) => c.id !== id) }));
    if (creature) {
      get().addLogEntry({
        type: 'custom',
        message: `🗑 ${creature.name} retirado del mapa`,
      });
    }
  },

  updateMapCreature: (id, updates) => {
    set((state) => ({
      mapCreatures: state.mapCreatures.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  setPartyToken: (playerId, x, y) => {
    set((state) => {
      const exists = state.partyTokens.some((t) => t.playerId === playerId);
      const partyTokens = exists
        ? state.partyTokens.map((t) => (t.playerId === playerId ? { ...t, x, y } : t))
        : [...state.partyTokens, { playerId, x, y }];
      return { partyTokens };
    });
    const player = usePlayerStore.getState().players.find((p) => p.id === playerId);
    if (player) {
      get().addLogEntry({
        type: 'custom',
        message: `🪪 ${player.name} colocado en el mapa en (${x},${y})`,
      });
    }
  },

  removePartyToken: (playerId) => {
    const token = get().partyTokens.find((t) => t.playerId === playerId);
    set((state) => ({
      partyTokens: state.partyTokens.filter((t) => t.playerId !== playerId),
    }));
    if (token) {
      const player = usePlayerStore.getState().players.find((p) => p.id === playerId);
      get().addLogEntry({
        type: 'custom',
        message: `🗑 ${player?.name ?? 'Un miembro del party'} retirado del mapa`,
      });
    }
  },

  clearMap: () => {
    const { mapCreatures, partyTokens } = get();
    set({ mapCreatures: [], partyTokens: [] });
    const count = mapCreatures.length + partyTokens.length;
    if (count > 0) {
      get().addLogEntry({
        type: 'custom',
        message: `🧹 Mapa limpiado: se retiraron ${count} ficha${count !== 1 ? 's' : ''} (criaturas y party)`,
      });
    }
  },

  toggleRevealTile: (x, y) => {
    const key = tileKey(x, y);
    set((state) => ({
      revealedTileKeys: state.revealedTileKeys.includes(key)
        ? state.revealedTileKeys.filter((k) => k !== key)
        : [...state.revealedTileKeys, key],
    }));
  },

  toggleRevealEnemy: (id) => {
    set((state) => ({
      revealedEnemyIds: state.revealedEnemyIds.includes(id)
        ? state.revealedEnemyIds.filter((e) => e !== id)
        : [...state.revealedEnemyIds, id],
    }));
  },

  setVisionRange: (feet) => {
    set({ visionRange: Math.max(5, Math.round(feet)) });
  },

  setMapBackground: (id) => {
    set({ mapBackground: id });
  },

  setMapSize: (cols, rows) => {
    const { participants, tiles, mapCols, mapRows } = get();
    const nCols = Math.max(8, Math.round(cols));
    const nRows = Math.max(8, Math.round(rows));
    if (nCols === mapCols && nRows === mapRows) return;
    // Fija primero las dims activas para que inBounds use la nueva cuadrícula.
    setActiveMapSize(nCols, nRows);
    // Recorta tiles y fichas fuera de los nuevos límites.
    const inBoundsTiles = tiles.filter((t) => inBounds(t.x, t.y));
    const clampedParticipants = participants.map((p) => ({
      ...p,
      x: p.x === undefined ? p.x : Math.min(nCols - 1, p.x),
      y: p.y === undefined ? p.y : Math.min(nRows - 1, p.y),
    }));
    const clampedCreatures = get().mapCreatures.map((c) => ({
      ...c,
      x: Math.min(nCols - 1, c.x),
      y: Math.min(nRows - 1, c.y),
    }));
    set({
      mapCols: nCols,
      mapRows: nRows,
      tiles: inBoundsTiles,
      participants: clampedParticipants,
      mapCreatures: clampedCreatures,
    });
    get().addLogEntry({
      type: 'custom',
      message: `🗺 Mapa cambiado a ${nCols}×${nRows} (${nCols * 5}×${nRows * 5} pies)`,
    });
  },

  setMapVisible: (visible) => {
    set({ mapVisible: visible });
    get().addLogEntry({
      type: 'custom',
      message: visible ? '🗺 Mapa visible para el party' : '🗺 Mapa oculto para el party (el DM está preparando)',
    });
  },
});
