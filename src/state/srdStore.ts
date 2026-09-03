// ============================================================
// Store del SRD 5.2 (biblioteca de referencia + paleta de búsqueda)
// El bundle NO se persiste (es contenido estático); el estado de
// la paleta y la selección son de sesión. La preferencia de idioma
// (ES/EN) sí se persiste en localStorage.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SrdBundle, SrdCategoryId, SrdRecord } from '../types/srd2024';
import { BASE_SRD_BUNDLE } from '../data/srd2024';

export type SrdLang = 'es' | 'en';

interface SrdStoreState {
  bundle: SrdBundle;
  /** Capa curada en español (bundle embebido), siempre disponible. */
  baseBundle: SrdBundle;
  /** Capa resultante de fusionar los overlays remotos (contenido extra, p. ej. en inglés). */
  overlayBundle: SrdBundle;
  selected: SrdRecord | null;
  paletteOpen: boolean;
  overlayApplied: boolean;
  lang: SrdLang;
}

interface SrdStoreActions {
  openEntry: (entry: SrdRecord) => void;
  closeEntry: () => void;
  openById: (category: SrdCategoryId, id: string) => boolean;
  setPaletteOpen: (open: boolean) => void;
  applyOverlay: (bundle: SrdBundle) => void;
  /** Cambia el idioma visible: "es" = bundle curado, "en" = bundle con overlays. */
  setLang: (lang: SrdLang) => void;
}

export type SrdStore = SrdStoreState & SrdStoreActions;

export const useSrdStore = create<SrdStore>()(
  persist(
    (set, get) => ({
      bundle: BASE_SRD_BUNDLE,
      baseBundle: BASE_SRD_BUNDLE,
      overlayBundle: BASE_SRD_BUNDLE,
      selected: null,
      paletteOpen: false,
      overlayApplied: false,
      lang: 'es',

      openEntry: (entry) => set({ selected: entry, paletteOpen: false }),
      closeEntry: () => set({ selected: null }),

      openById: (category, id) => {
        const found = get().bundle[category].find((entry) => entry.id === id);
        if (!found) return false;
        get().openEntry(found);
        return true;
      },

      setPaletteOpen: (open) => set({ paletteOpen: open }),

      applyOverlay: (bundle) =>
        set((state) => ({
          overlayBundle: bundle,
          overlayApplied: true,
          bundle: state.lang === 'en' ? bundle : state.bundle,
        })),

      setLang: (lang) =>
        set((state) => {
          const bundle = lang === 'en' ? state.overlayBundle : state.baseBundle;
          // Si la entrada seleccionada ya no existe en este idioma, se cierra.
          const selected = state.selected
            ? bundle[state.selected.category]?.find((e) => e.id === state.selected!.id) ?? null
            : null;
          return { lang, bundle, selected };
        }),
    }),
    {
      name: 'dmbuddy-srd',
      partialize: (state) => ({ lang: state.lang }),
    }
  )
);