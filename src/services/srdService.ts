// ============================================================
// Cargador del SRD 5.2
// 1) Bundle embebido (curado, offline).
// 2) Overlay remoto opcional desde /data/srd2024/*.json
//    (permite ingestar contenido ampliado generado por scripts
//    o por la API de Open5e sin tocar el bundle embebido).
// ============================================================

import { BASE_SRD_BUNDLE } from '../data/srd2024';
import type { SrdBundle, SrdOverlay, SrdRecord } from '../types/srd2024';

/** Archivos JSON que se intentan cargar desde `public/data/srd2024/`. */
const OVERLAY_FILES: ReadonlyArray<{ key: keyof SrdBundle; file: string }> = [
  { key: 'rules', file: 'rules.json' },
  { key: 'conditions', file: 'conditions.json' },
  { key: 'spells', file: 'spells.json' },
  { key: 'monsters', file: 'monsters.json' },
  { key: 'classes', file: 'classes.json' },
  { key: 'species', file: 'species.json' },
  { key: 'feats', file: 'feats.json' },
];

const EMPTY: SrdBundle = {
  rules: [],
  conditions: [],
  spells: [],
  monsters: [],
  classes: [],
  species: [],
  feats: [],
};

/**
 * Fusiona un overlay sobre el bundle base.
 * Las entradas del overlay reemplazan a las del base con el mismo `id`.
 */
export const mergeBundle = (base: SrdBundle, overlay: SrdOverlay): SrdBundle => {
  const merged: SrdBundle = { ...base };
  const slots = merged as unknown as Record<string, SrdRecord[]>;
  (Object.keys(overlay) as Array<keyof SrdBundle>).forEach((key) => {
    const incoming = overlay[key];
    if (!incoming || incoming.length === 0) return;
    const byId = new Map<string, SrdRecord>(
      [...base[key], ...incoming].map((entry) => [entry.id, entry])
    );
    slots[key] = Array.from(byId.values());
  });
  return merged;
};

/** Devuelve un bundle vacío (para entornos sin datos). */
export const emptyBundle = (): SrdBundle => ({ ...EMPTY });

/**
 * Intenta cargar overlays JSON desde `public/data/srd2024/`.
 * Devuelve `null` si no hay ninguno (no rompe la app).
 */
export const fetchSrdOverlays = async (): Promise<SrdBundle | null> => {
  let overlay: SrdOverlay = {};
  let found = false;

  const loaders = OVERLAY_FILES.map(async ({ key, file }) => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
    const url = `${base}/data/srd2024/${file}`;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const json: unknown = await res.json();
      const entity = (Array.isArray(json) ? { entries: json } : json) as {
        entries?: SrdRecord[];
      };
      if (Array.isArray(entity.entries)) {
        overlay = { ...overlay, [key]: entity.entries as never };
        found = true;
      }
    } catch {
      // Archivo ausente o red sin datos: se ignora silenciosamente.
    }
  });

  await Promise.all(loaders);
  if (!found) return null;

  return mergeBundle(BASE_SRD_BUNDLE, overlay);
};