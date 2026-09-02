// ============================================================
// Resoluciones de la cuadrícula del mapa (casillas)
// ============================================================

export interface MapSizePreset {
  id: string;
  label: string;
  cols: number;
  rows: number;
}

/** Presets de tamaño de cuadrícula que el DM puede elegir. */
export const MAP_SIZE_PRESETS: MapSizePreset[] = [
  { id: 'small', label: 'Pequeño 20×12', cols: 20, rows: 12 },
  { id: 'standard', label: 'Estándar 28×16', cols: 28, rows: 16 },
  { id: 'large', label: 'Grande 44×24', cols: 44, rows: 24 },
];

/** Preset que mejor coincide con unas dimensiones dadas (por id o tamaño). */
export const presetForSize = (cols: number, rows: number): MapSizePreset | null =>
  MAP_SIZE_PRESETS.find((p) => p.cols === cols && p.rows === rows) ?? null;