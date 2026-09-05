// ============================================================
// Patrones y generador de layouts de mapa (barreras)
// ============================================================

import { activeCols, activeRows, setActiveMapSize } from './mapUtils';
import type { MapTile, MapCreature, Monster } from '../types';

export interface LayoutCreature {
  name: string;
  kind: 'monster' | 'npc' | 'player';
  refId?: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  tempHp: number;
  armorClass: number;
  speed: number;
  npcRole?: 'hostage' | 'ally' | 'neutral' | 'enemy';
  xpReward?: number;
  /** Tipo del monstruo (si kind es "monster"), para el ícono de su ficha. */
  monsterType?: string;
  /** Tamaño del monstruo (si kind es "monster"), para escalar su ficha. */
  monsterSize?: Monster['size'];
}

/** Tile de mapa guardado en un layout, conservando su tipo (wall/door/trap/…). */
export interface LayoutTile {
  x: number;
  y: number;
  type: 'wall' | 'door' | 'secretDoor' | 'trap' | 'treasure' | 'investigation' | 'portal';
  /** Solo para "door": true = abierta (no bloquea), false/undefined = cerrada. */
  open?: boolean;
  /** Solo para "portal": id del MapLayout destino, casilla de llegada y nombre opcional. */
  targetLayoutId?: string;
  targetX?: number;
  targetY?: number;
  label?: string;
}

export interface MapLayout {
  id: string;
  name: string;
  /** Retrocompatibilidad: posiciones de muro de layouts antiguos. */
  barriers?: { x: number; y: number }[];
  /** Tiles guardados con su tipo. Es la fuente de verdad en layouts nuevos. */
  tiles?: LayoutTile[];
  /** Criaturas (monstruos/NPCs) guardadas con el layout. No se guardan PJs. */
  creatures?: LayoutCreature[];
  /** Carpeta en la que se agrupa el layout (undefined = sin carpeta). */
  folderId?: string;
  /**
   * Tamaño propio de este mapa guardado (columnas/filas). Si falta (layouts
   * viejos, o creados antes de esta función), se asume el tamaño por
   * defecto (MAP_COLS/MAP_ROWS) — nunca el tamaño del mapa en vivo, que
   * puede ser distinto y cambiar en cualquier momento.
   */
  mapCols?: number;
  mapRows?: number;
  /**
   * Patrón de color de fondo propio de este mapa (id de MAP_BACKGROUNDS en
   * config/mapBackgrounds.ts) — p. ej. un bosque en "grass" (verde), una
   * cueva en "dungeon" (oscuro). Si falta, se asume DEFAULT_MAP_BACKGROUND.
   */
  background?: string;
}

/** Carpeta/conjunto para organizar layouts de mapa por sesión o campaña. */
export interface MapFolder {
  id: string;
  name: string;
}

/**
 * Reconstruye los tiles de un layout guardado con su tipo y configuración
 * completa (incluye portales: mapa destino, punto de llegada, nombre).
 * Los layouts viejos solo tenían `barriers` (muros sueltos, sin tipo).
 */
export const restoreTilesFromLayout = (layout: MapLayout): MapTile[] =>
  layout.tiles
    ? layout.tiles.map((t) => ({
        x: t.x,
        y: t.y,
        type: t.type,
        open: t.open,
        targetLayoutId: t.targetLayoutId,
        targetX: t.targetX,
        targetY: t.targetY,
        label: t.label,
      }))
    : (layout.barriers ?? []).map((b) => ({ x: b.x, y: b.y, type: 'wall' as const }));

/**
 * Reconstruye las criaturas (monstruos/NPCs) guardadas en un layout, con ids
 * nuevos para no chocar con las que ya están en el mapa. Descarta entradas
 * legacy con kind "player" (los PJ ya no se guardan en layouts).
 */
export const restoreCreaturesFromLayout = (layout: MapLayout): MapCreature[] =>
  (layout.creatures ?? [])
    .filter((c): c is LayoutCreature & { kind: 'monster' | 'npc' } => c.kind !== 'player')
    .map((c) => ({
      id: `mc-${layout.id}-${c.x}-${c.y}-${Math.random().toString(36).slice(2, 8)}`,
      name: c.name,
      kind: c.kind,
      refId: c.refId,
      x: c.x,
      y: c.y,
      hp: c.hp,
      maxHp: c.maxHp,
      tempHp: c.tempHp,
      armorClass: c.armorClass,
      speed: c.speed,
      npcRole: c.npcRole,
      xpReward: c.xpReward,
      statusEffects: [],
      isDead: false,
      monsterType: c.monsterType,
      monsterSize: c.monsterSize,
    }));

const cell = (x: number, y: number) => ({ x, y });

// Casillas ocupadas por un rectángulo (borde o relleno según thickness).
function rect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  hollow: boolean,
  thickness = 1
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const onEdge =
        x < x0 + thickness || x > x1 - thickness || y < y0 + thickness || y > y1 - thickness;
      if (!hollow || onEdge) out.push(cell(x, y));
    }
  }
  return out;
}

// Añade un campo de "habitación" con salidas (pasillos) eliminando tramos de muro.
function room(bx: number, by: number, w: number, h: number): { x: number; y: number }[] {
  const walls = rect(bx, by, bx + w - 1, by + h - 1, true);
  // Salidas en el centro de cada lado.
  const doors = [
    cell(bx + Math.floor(w / 2), by),
    cell(bx + Math.floor(w / 2), by + h - 1),
    cell(bx, by + Math.floor(h / 2)),
    cell(bx + w - 1, by + Math.floor(h / 2)),
  ];
  const doorSet = new Set(doors.map((d) => `${d.x},${d.y}`));
  return walls.filter((c) => !doorSet.has(`${c.x},${c.y}`));
}

// Línea recta entre dos casillas (Bresenham simple) para pasillos.
function corridor(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (let i = 0; i < 1000; i++) {
    out.push(cell(x, y));
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
  return out;
}

const inMap = (c: { x: number; y: number }) =>
  c.x >= 0 && c.x < activeCols && c.y >= 0 && c.y < activeRows;

const dedupe = (list: { x: number; y: number }[]): { x: number; y: number }[] => {
  const seen = new Set<string>();
  const out: { x: number; y: number }[] = [];
  for (const c of list) {
    const key = `${c.x},${c.y}`;
    if (!seen.has(key) && inMap(c)) {
      seen.add(key);
      out.push(c);
    }
  }
  return out;
};

// Celdas planas (x,y) => tiles de muro; y helpers de tiles especiales.
const doorAt = (x: number, y: number): LayoutTile => ({ x, y, type: 'door' });
const treasureAt = (x: number, y: number): LayoutTile => ({ x, y, type: 'treasure' });
const trapAt = (x: number, y: number): LayoutTile => ({ x, y, type: 'trap' });

// Pequeña variación aleatoria para que cada generación difiera
// ligeramente de la anterior (variación automática al pulsar aleatorio).
const jitter = (amount: number) => Math.floor(Math.random() * (amount + 1) * 2) - amount;

/** Une muros + puertas + tesoros + trampas en un array de tiles deduplicado. */
function assemble(
  opts: {
    walls?: { x: number; y: number }[];
    doors?: LayoutTile[];
    treasures?: LayoutTile[];
    traps?: LayoutTile[];
  }
): LayoutTile[] {
  const seen = new Set<string>();
  const out: LayoutTile[] = [];
  const push = (t: LayoutTile) => {
    const key = `${t.x},${t.y}`;
    if (!seen.has(key) && inMap(t)) {
      seen.add(key);
      out.push(t);
    }
  };
  (opts.walls ?? []).forEach((c) => push({ x: c.x, y: c.y, type: 'wall' }));
  (opts.doors ?? []).forEach(push);
  (opts.traps ?? []).forEach(push);
  (opts.treasures ?? []).forEach(push);
  return out;
}

// Cuatro habitaciones conectadas por pasillos.
function arena(): LayoutTile[] {
  return assemble({
    walls: [
      ...room(2, 2, 10, 7),
      ...room(16, 2, 10, 7),
      ...room(2, 9, 10, 7),
      ...room(16, 9, 10, 7),
      ...corridor(6, 8, 6, 9),
      ...corridor(21, 8, 21, 9),
      ...corridor(11, 5, 16, 5),
      ...corridor(11, 12, 16, 12),
    ],
    doors: [doorAt(11, 5), doorAt(11, 12)],
  });
}

// Mazmorra laberíntica con muros dispersos y pilares.
function dungeon(): LayoutTile[] {
  const out: { x: number; y: number }[] = [];
  // Pilares en una cuadrícula.
  for (let x = 3; x < activeCols - 2; x += 4) {
    for (let y = 2; y < activeRows - 2; y += 3) {
      out.push(cell(x, y));
    }
  }
  // Muros cortos horizontales y verticales.
  for (const [x, y] of [
    [8, 5], [8, 6], [8, 7],
    [16, 5], [16, 6],
    [10, 11], [11, 11],
    [4, 10],
    [20, 8], [20, 9],
  ]) {
    out.push(cell(x, y));
  }
  return assemble({ walls: dedupe(out) });
}

// Laberinto sencillo generado aleatoriamente con muros tipo rejilla.
function maze(): LayoutTile[] {
  const out: { x: number; y: number }[] = [];
  const gapCols = [3, 8, 13, 18, 23].map((c) => c + jitter(1));
  const gapRows = [3, 6, 9].map((r) => r + jitter(1));
  for (let x = 2; x < activeCols - 1; x += 2) {
    for (let y = 0; y < activeRows; y++) {
      if (!gapRows.includes(y)) out.push(cell(x, y));
    }
  }
  for (let y = 2; y < activeRows - 1; y += 2) {
    for (let x = 0; x < activeCols; x += 1) {
      if (!gapCols.includes(x)) out.push(cell(x, y));
    }
  }
  return assemble({ walls: dedupe(out) });
}

// Columnas/pilares aleatorios dentro de un perímetro.
function pillars(): LayoutTile[] {
  const out = rect(1, 1, activeCols - 2, activeRows - 2, true);
  const count = 8 + Math.floor(Math.random() * 4);
  let placed = 0;
  let guard = 0;
  while (placed < count && guard < 3000) {
    guard++;
    const x = 3 + Math.floor(Math.random() * (activeCols - 6));
    const y = 3 + Math.floor(Math.random() * (activeRows - 6));
    if (out.some((b) => b.x === x && b.y === y)) continue;
    const tooClose = out.some((b) => Math.abs(b.x - x) <= 2 && Math.abs(b.y - y) <= 2);
    if (tooClose) continue;
    out.push(cell(x, y));
    placed++;
  }
  return assemble({ walls: dedupe(out) });
}

// División del mapa en cuadrantes con muros en cruz.
function cross(): LayoutTile[] {
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < activeRows; y++) {
    if (y < 6 || y > 9) out.push(cell(13, y));
    if (y < 6 || y > 9) out.push(cell(14, y));
    if (y >= 7 && y <= 8) out.push(cell(13, y));
  }
  for (let x = 0; x < activeCols; x++) {
    if (x < 11 || x > 16) out.push(cell(x, 7));
    if (x < 11 || x > 16) out.push(cell(x, 8));
    if (x >= 13 && x <= 14) out.push(cell(x, 7));
  }
  return assemble({ walls: dedupe(out) });
}

// ==== Patrones temáticos con diseño "clásico" ====

// Cueva con varias salas irregulares unidas por pasillos serpenteantes.
function cavern(): LayoutTile[] {
  const walls: { x: number; y: number }[] = [];
  // Sala central ovalada.
  const cx = activeCols / 2;
  const cy = activeRows / 2;
  for (let y = 3; y < activeRows - 3; y++) {
    for (let x = 2; x < activeCols - 2; x++) {
      // Pared escarpada alrededor del hueco central.
      const dx = (x - cx) / 7;
      const dy = (y - cy) / 4.5;
      if (dx * dx + dy * dy > 1 && Math.random() < 0.6) walls.push(cell(x, y));
    }
  }
  // Pasillos serpenteantes de salida.
  for (let i = 0; i < 3; i++) {
    const startX = cx + (i - 1) * 3;
    const dir = i < 2 ? -1 : 1; // hacia arriba/abajo
    let x = startX;
    let y = cy + dir * 4;
    for (let s = 0; s < 6; s++) {
      x += jitter(1);
      y += dir;
      // Bordes del pasillo (excepto el propio hueco).
      for (const ox of [-2, -1, 1, 2]) {
        if (Math.random() < 0.7) walls.push(cell(x + ox, y));
      }
    }
  }
  const tiles = assemble({ walls: dedupe(walls) });
  const tx = Math.round(cx);
  const ty = Math.round(cy);
  return [...tiles.filter((t) => !(t.x === tx && t.y === ty)), treasureAt(tx, ty)];
}

// Castillo rectangular: muralla, patios y una nave de habitaciones que
// acaba en el salón del trono, con puertas encadenadas.
function castleToThrone(): LayoutTile[] {
  const walls: { x: number; y: number }[] = [];
  const doors: LayoutTile[] = [];
  // Muralla exterior (borde).
  walls.push(...rect(1, 1, activeCols - 2, activeRows - 2, true, 2));
  // Entrada por el sur.
  const gateY = activeRows - 3;
  const gateX = Math.floor(activeCols / 2);
  walls.push(cell(gateX - 1, gateY), cell(gateX + 1, gateY));
  // Nave de habitaciones: recorren el castillo en zigzag hasta el trono
  // (arriba). Muros divisorios con puertas intercaladas.
  const roomH = Math.max(3, Math.floor((activeRows - 5) / 4));
  let prevSide = 1;
  for (let i = 0; i < 3; i++) {
    const dividerY = 3 + i * roomH;
    prevSide = -prevSide;
    const doorX = prevSide > 0
      ? Math.floor(activeCols * 0.72) + jitter(2)
      : Math.floor(activeCols * 0.28) + jitter(2);
    const clamped = Math.max(3, Math.min(activeCols - 4, doorX));
    // Muro horizontal (sección de un pasillo vertical de entrada ya hay gate).
    for (let x = 2; x < activeCols - 2; x++) {
      if (!(Math.abs(x - gateX) < 3)) walls.push(cell(x, dividerY));
    }
    doors.push(doorAt(clamped, dividerY));
  }
  // Salón del trono arriba del todo.
  const throneY = 2;
  const throneX = Math.floor(activeCols / 2);
  // Dosillos del trono (pilares).
  walls.push(cell(throneX - 2, throneY), cell(throneX + 2, throneY));
  doors.push(doorAt(throneX, throneY));
  const tiles = assemble({ walls: dedupe(walls), doors });
  return [...tiles, treasureAt(throneX, throneY + 1)];
}

// Fuerte: muralla exterior con torreones y un patio central abierto.
function fort(): LayoutTile[] {
  const walls: { x: number; y: number }[] = [];
  walls.push(...rect(1, 1, activeCols - 2, activeRows - 2, true, 2));
  // Torreones en las esquinas.
  for (const [tx, ty] of [
    [1, 1], [activeCols - 2, 1], [1, activeRows - 2], [activeCols - 2, activeRows - 2],
  ]) {
    walls.push(cell(tx, ty), cell(tx + (tx === 1 ? 1 : -1), ty), cell(tx, ty + (ty === 1 ? 1 : -1)));
  }
  // Puertas en norte y sur.
  const gateX = Math.floor(activeCols / 2);
  const doors: LayoutTile[] = [doorAt(gateX, 1), doorAt(gateX, activeRows - 2)];
  // Garita central con tesoro.
  const cx = Math.floor(activeCols / 2);
  const cy = Math.floor(activeRows / 2);
  const tiles = assemble({ walls: dedupe(walls), doors });
  return [...tiles, treasureAt(cx, cy), trapAt(cx + 3, cy)];
}

// Ribera/sala de encuentro con columnas al centro y pasillos laterales.
function hall(): LayoutTile[] {
  const walls: { x: number; y: number }[] = [];
  const doors: LayoutTile[] = [];
  walls.push(...rect(2, 2, activeCols - 3, activeRows - 3, true, 1));
  const cx = Math.floor(activeCols / 2);
  const cy = Math.floor(activeRows / 2);
  for (let x = 3; x < activeCols - 3; x += 3) {
    if (Math.random() < 0.7) walls.push(cell(x, cy));
  }
  doors.push(doorAt(cx, 2), doorAt(cx, activeRows - 3));
  const tiles = assemble({ walls: dedupe(walls), doors });
  return [...tiles, treasureAt(cx, cy)];
}

export interface MapTemplate {
  id: string;
  name: string;
  description: string;
  fn: () => LayoutTile[];
}

/** Plantillas de mapa disponibles (tanto en "Aleatorio" como por patrón). */
export const MAP_TEMPLATES: MapTemplate[] = [
  { id: 'arena', name: 'Arena de 4 salas', description: 'Cuatro habitaciones conectadas por pasillos', fn: arena },
  { id: 'dungeon', name: 'Mazmorra', description: 'Laberinto con muros y pilares', fn: dungeon },
  { id: 'maze', name: 'Laberinto', description: 'Rejilla clásica de pasillos', fn: maze },
  { id: 'pillars', name: 'Columnas + perímetro', description: 'Salón con columnas y perímetro', fn: pillars },
  { id: 'cross', name: 'Cruz central', description: 'Cuadrantes separados por una cruz', fn: cross },
  { id: 'cavern', name: 'Cueva', description: 'Salas irregulares con pasillos serpenteantes y tesoro interior', fn: cavern },
  { id: 'castle', name: 'Castillo → Trono', description: 'Muralla, nave de habitaciones encadenadas y salón del trono', fn: castleToThrone },
  { id: 'fort', name: 'Fuerte', description: 'Muralla con torreones, entrada y garita central', fn: fort },
  { id: 'hall', name: 'Gran salón', description: 'Sala con columnas y puertas enfrentadas', fn: hall },
];

export interface GeneratedLayout {
  name: string;
  /** Tiles tipados (muros, puertas, tesoros, trampas). */
  tiles: LayoutTile[];
  /** Barreras (solo muros) para compatibilidad con cargas antiguas. */
  barriers: { x: number; y: number }[];
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/**
 * Genera un patrón aleatorio (o de una plantilla elegida). `size`, si se
 * pasa, es el tamaño del mapa para el que se está generando — TODAS las
 * plantillas usan `activeCols`/`activeRows` (utils/mapUtils.ts) para
 * ubicar sus salas/muros/pilares, que normalmente reflejan el mapa en
 * vivo; al generar para un mapa guardado de otro tamaño hay que adoptar
 * temporalmente SU tamaño (y restaurar el de antes al terminar) para que
 * el patrón salga a la medida real del mapa, no recortado ni desperdiciando
 * la mitad de la cuadrícula.
 */
export function randomLayout(templateId?: string, size?: { cols: number; rows: number }): GeneratedLayout {
  const prevCols = activeCols;
  const prevRows = activeRows;
  if (size) setActiveMapSize(size.cols, size.rows);
  try {
    let pick: MapTemplate[];
    if (templateId) {
      const t = MAP_TEMPLATES.find((x) => x.id === templateId);
      pick = t ? [t] : [MAP_TEMPLATES[Math.floor(Math.random() * MAP_TEMPLATES.length)]];
    } else {
      pick = shuffle(MAP_TEMPLATES).slice(0, 1 + Math.floor(Math.random() * 2));
    }
    const tiles = dedupeTiles(pick.flatMap((g) => g.fn()));
    return {
      name: templateId
        ? pick[0].name
        : `Aleatorio · ${pick.map((g) => g.name.split(' ')[0]).join(' + ')}`,
      tiles,
      barriers: tiles.filter((t) => t.type === 'wall').map((t) => ({ x: t.x, y: t.y })),
    };
  } finally {
    if (size) setActiveMapSize(prevCols, prevRows);
  }
}

// Deduplica tiles conservando la prioridad (muro < puerta < trampa < tesoro).
function dedupeTiles(list: LayoutTile[]): LayoutTile[] {
  const rank = { wall: 0, door: 1, trap: 2, treasure: 3, secretDoor: 2 } as Record<string, number>;
  const byKey = new Map<string, LayoutTile>();
  for (const t of list) {
    if (!inMap(t)) continue;
    const key = `${t.x},${t.y}`;
    const prev = byKey.get(key);
    if (!prev || rank[t.type] >= rank[prev.type]) byKey.set(key, t);
  }
  return [...byKey.values()];
}
