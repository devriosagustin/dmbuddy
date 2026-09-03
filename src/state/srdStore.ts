// ============================================================
// Store del SRD 5.2 (biblioteca de referencia + paleta de búsqueda)
// El bundle NO se persiste (es contenido estático); el estado de
// la paleta y la selección son de sesión.
// ============================================================

import { create } from 'zustand';
import type { SrdBundle, SrdCategoryId, SrdRecord } from '../types/srd2024';
import { BASE_SRD_BUNDLE } from '../data/srd2024';

interface SrdStoreState {
  bundle: SrdBundle;
  selected: SrdRecord | null;
  paletteOpen: boolean;
  overlayApplied: boolean;
}

interface SrdStoreActions {
  openEntry: (entry: SrdRecord) => void;
  closeEntry: () => void;
  openById: (category: SrdCategoryId, id: string) => boolean;
  setPaletteOpen: (open: boolean) => void;
  applyOverlay: (bundle: SrdBundle) => void;
}

export type SrdStore = SrdStoreState & SrdStoreActions;

export const useSrdStore = create<SrdStore>((set, get) => ({
  bundle: BASE_SRD_BUNDLE,
  selected: null,
  paletteOpen: false,
  overlayApplied: false,

  openEntry: (entry) => set({ selected: entry, paletteOpen: false }),
  closeEntry: () => set({ selected: null }),

  openById: (category, id) => {
    const found = get().bundle[category].find((entry) => entry.id === id);
    if (!found) return false;
    get().openEntry(found);
    return true;
  },

  setPaletteOpen: (open) => set({ paletteOpen: open }),
  applyOverlay: (bundle) => set({ bundle, overlayApplied: true }),
}));