// ============================================================
// Store de UI (sidebar, modales globales, ajustes)
// ============================================================

import { create } from 'zustand';

export type ModalType =
  | 'quickRoll'
  | 'addCombatant'
  | 'combatantActions'
  | 'monsterForm'
  | 'monsterDetail'
  | 'playerForm'
  | null;

interface UIModalState {
  type: ModalType;
  payload?: unknown;
}

interface UIStore {
  sidebarOpen: boolean;
  isMobile: boolean;
  modal: UIModalState;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setIsMobile: (v: boolean) => void;
  openModal: (type: Exclude<ModalType, null>, payload?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  isMobile: false,
  modal: { type: null },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
  setIsMobile: (v) => set({ isMobile: v, sidebarOpen: v ? false : true }),

  openModal: (type, payload) => set({ modal: { type, payload } }),
  closeModal: () => set({ modal: { type: null } }),
}));