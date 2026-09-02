// ============================================================
// Fondos del mapa: patrones de colores seleccionables por el DM
// para la cuadrícula, que se sincronizan a la vista del jugador.
// ============================================================

export interface MapBackground {
  id: string;
  label: string;
  /** Color de las casillas pares (ajax claro). */
  a: string;
  /** Color de las casillas impares (ajax oscuro). */
  b: string;
}

export const MAP_BACKGROUNDS: MapBackground[] = [
  { id: 'leather', label: 'Cuero', a: 'rgba(139,69,19,0.09)', b: 'rgba(139,69,19,0.18)' },
  { id: 'stone', label: 'Piedra', a: 'rgba(100,106,118,0.32)', b: 'rgba(100,106,118,0.58)' },
  { id: 'dungeon', label: 'Mazmorra', a: 'rgba(70,64,86,0.45)', b: 'rgba(80,74,96,0.68)' },
  { id: 'grass', label: 'Césped', a: 'rgba(58,108,66,0.34)', b: 'rgba(58,108,66,0.6)' },
  { id: 'sand', label: 'Arena', a: 'rgba(205,180,130,0.32)', b: 'rgba(205,180,130,0.58)' },
  { id: 'water', label: 'Agua', a: 'rgba(46,92,150,0.38)', b: 'rgba(50,98,160,0.62)' },
  { id: 'snow', label: 'Nieve', a: 'rgba(224,232,244,0.16)', b: 'rgba(224,232,244,0.34)' },
  { id: 'lava', label: 'Lava', a: 'rgba(150,48,22,0.34)', b: 'rgba(198,86,22,0.6)' },
];

export const DEFAULT_MAP_BACKGROUND = 'leather';

export const getMapBackground = (id: string | undefined | null): MapBackground =>
  MAP_BACKGROUNDS.find((b) => b.id === id) ?? MAP_BACKGROUNDS[0];
