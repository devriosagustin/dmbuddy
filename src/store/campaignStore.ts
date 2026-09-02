// ============================================================
// Store de campañas: snapshots del party + combate para poder
// perdurar varias sesiones/campañas independientes
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CombatState, Player } from '../types';
import { usePlayerStore } from './playerStore';
import { useCombatStore } from './combatStore';
import { setActiveMapSize } from '../utils/mapUtils';

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

/** El fragmento de estado que se guarda por campaña. */
export type CampaignSnapshot = {
  party: Player[];
  combat: { startTime: Date | string } & Omit<CombatState, 'startTime'>;
};

export interface Campaign {
  id: string;
  name: string;
  savedAt: number;
  snapshot: CampaignSnapshot;
}

interface CampaignStore {
  campaigns: Campaign[];
  activeCampaignId: string | null;
  /** Guarda el estado actual de party y combate en la campaña activa. */
  saveCurrent: () => void;
  /** Crea una nueva campaña con el estado actual y la activa. */
  createCampaign: (name: string) => string | null;
  renameCampaign: (id: string, name: string) => void;
  deleteCampaign: (id: string) => void;
  /** Guarda el estado actual en la campaña activa y carga la elegida. */
  loadCampaign: (id: string) => void;
}

const captureLive = (): CampaignSnapshot => {
  const players = usePlayerStore.getState().players;
  const c = useCombatStore.getState();
  return {
    party: players,
    combat: {
      id: c.id,
      round: c.round,
      turn: c.turn,
      isActive: c.isActive,
      participants: c.participants,
      combatLog: c.combatLog,
      startTime: c.startTime,
      encounterCount: c.encounterCount,
      tiles: c.tiles,
      mapCreatures: c.mapCreatures,
      partyTokens: c.partyTokens,
      revealedTileKeys: c.revealedTileKeys,
      revealedEnemyIds: c.revealedEnemyIds,
      visionRange: c.visionRange,
      mapCols: c.mapCols,
      mapRows: c.mapRows,
      mapVisible: c.mapVisible,
      chat: c.chat,
      xpAwards: c.xpAwards,
    },
  };
};

const toDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));

const applySnapshot = (snapshot: CampaignSnapshot): void => {
  usePlayerStore.setState({ players: snapshot.party });
  useCombatStore.setState({
    id: snapshot.combat.id,
    round: snapshot.combat.round,
    turn: snapshot.combat.turn,
    isActive: snapshot.combat.isActive,
    participants: snapshot.combat.participants,
    combatLog: snapshot.combat.combatLog.map((entry) => ({ ...entry, timestamp: toDate(entry.timestamp) })),
    startTime: toDate(snapshot.combat.startTime),
    encounterCount: snapshot.combat.encounterCount,
    tiles: snapshot.combat.tiles ?? [],
    mapCreatures: snapshot.combat.mapCreatures ?? [],
    partyTokens: snapshot.combat.partyTokens ?? [],
    revealedTileKeys: snapshot.combat.revealedTileKeys ?? [],
    revealedEnemyIds: snapshot.combat.revealedEnemyIds ?? [],
    visionRange: snapshot.combat.visionRange ?? 30,
    mapCols: snapshot.combat.mapCols,
    mapRows: snapshot.combat.mapRows,
    mapVisible: snapshot.combat.mapVisible ?? true,
    chat: snapshot.combat.chat ?? [],
    xpAwards: snapshot.combat.xpAwards ?? [],
  });
  // Resincroniza las dimensiones activas de la cuadrícula.
  setActiveMapSize(snapshot.combat.mapCols ?? 28, snapshot.combat.mapRows ?? 16);
};

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => ({
      campaigns: [],
      activeCampaignId: null,

      saveCurrent: () =>
        set((state) => {
          if (!state.activeCampaignId) return state;
          const snapshot = captureLive();
          return {
            campaigns: state.campaigns.map((campaign) =>
              campaign.id === state.activeCampaignId
                ? { ...campaign, savedAt: Date.now(), snapshot }
                : campaign,
            ),
          };
        }),

      createCampaign: (name) => {
        const id = makeId();
        set((state) => ({
          campaigns: [
            ...state.campaigns,
            { id, name: name.trim() || 'Campaña sin nombre', savedAt: Date.now(), snapshot: captureLive() },
          ],
          activeCampaignId: id,
        }));
        return id;
      },

      renameCampaign: (id, name) =>
        set((state) => ({
          campaigns: state.campaigns.map((campaign) =>
            campaign.id === id ? { ...campaign, name: name.trim() || campaign.name } : campaign,
          ),
        })),

      deleteCampaign: (id) =>
        set((state) => {
          const remaining = state.campaigns.filter((campaign) => campaign.id !== id);
          const wasActive = state.activeCampaignId === id;
          return {
            campaigns: remaining,
            activeCampaignId: wasActive ? (remaining[0]?.id ?? null) : state.activeCampaignId,
          };
        }),

      loadCampaign: (id) => {
        const target = get().campaigns.find((campaign) => campaign.id === id);
        if (!target || id === get().activeCampaignId) return;
        const wasActive = get().activeCampaignId;
        if (wasActive) get().saveCurrent();
        applySnapshot(target.snapshot);
        set({ activeCampaignId: id });
      },
    }),
    {
      name: 'campaign-storage',
      version: 1,
    },
  ),
);

export default useCampaignStore;