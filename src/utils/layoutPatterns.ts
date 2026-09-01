// ============================================================
// Patrones y generador de layouts de mapa (barreras)
// ============================================================

import { MAP_COLS, MAP_ROWS } from './mapUtils';

export interface MapLayout {
  id: string;
  name: string;
  barriers: { x: number; y: number }[];
}

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
  c.x >= 0 && c.x < MAP_COLS && c.y >= 0 && c.y < MAP_ROWS;

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

// Cuatro habitaciones conectadas por pasillos.
function arena(): { x: number; y: number }[] {
  return dedupe([
    ...room(2, 2, 10, 7),
    ...room(16, 2, 10, 7),
    ...room(2, 9, 10, 7),
    ...room(16, 9, 10, 7),
    ...corridor(6, 8, 6, 9),
    ...corridor(21, 8, 21, 9),
    ...corridor(11, 5, 16, 5),
    ...corridor(11, 12, 16, 12),
  ]);
}

// Mazmorra laberíntica con muros dispersos y pilares.
function dungeon(): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  // Pilares en una cuadrícula.
  for (let x = 3; x < MAP_COLS - 2; x += 4) {
    for (let y = 2; y < MAP_ROWS - 2; y += 3) {
      out.push(cell(x, y));
    }
  }
  // Muros cortos horizontales y verticales.
  for (const [x, y] of [
    [8, 5],
    [8, 6],
    [8, 7],
    [16, 5],
    [16, 6],
    [10, 11],
    [11, 11],
    [4, 10],
    [20, 8],
    [20, 9],
  ]) {
    out.push(cell(x, y));
  }
  return dedupe(out);
}

// Laberinto sencillo generado aleatoriamente con muros tipo rejilla.
function maze(): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const gapCols = [3, 8, 13, 18, 23];
  const gapRows = [3, 6, 9, 12];
  for (let x = 2; x < MAP_COLS - 1; x += 2) {
    for (let y = 0; y < MAP_ROWS; y++) {
      if (!gapRows.includes(y)) out.push(cell(x, y));
    }
  }
  for (let y = 2; y < MAP_ROWS - 1; y += 2) {
    for (let x = 0; x < MAP_COLS; x += 1) {
      if (!gapCols.includes(x)) out.push(cell(x, y));
    }
  }
  return dedupe(out);
}

// Columnas/pilares aleatorios dentro de un perímetro.
function pillars(): { x: number; y: number }[] {
  const out = rect(1, 1, MAP_COLS - 2, MAP_ROWS - 2, true);
  const count = 8;
  let placed = 0;
  let guard = 0;
  while (placed < count && guard < 2000) {
    guard++;
    const x = 3 + Math.floor(Math.random() * (MAP_COLS - 6));
    const y = 3 + Math.floor(Math.random() * (MAP_ROWS - 6));
    if (out.some((b) => b.x === x && b.y === y)) continue;
    // Evita pilares demasiado juntos.
    const tooClose = out.some((b) => Math.abs(b.x - x) <= 2 && Math.abs(b.y - y) <= 2);
    if (tooClose) continue;
    out.push(cell(x, y));
    placed++;
  }
  return dedupe(out);
}

// División del mapa en cuadrantes con muros en cruz.
function cross(): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < MAP_ROWS; y++) {
    if (y < 6 || y > 9) out.push(cell(13, y));
    if (y < 6 || y > 9) out.push(cell(14, y));
    if (y >= 7 && y <= 8) out.push(cell(13, y));
  }
  for (let x = 0; x < MAP_COLS; x++) {
    if (x < 11 || x > 16) out.push(cell(x, 7));
    if (x < 11 || x > 16) out.push(cell(x, 8));
    if (x >= 13 && x <= 14) out.push(cell(x, 7));
  }
  return dedupe(out);
}

const GENERATORS: { name: string; fn: () => { x: number; y: number }[] }[] = [
  { name: 'Arena de 4 salas', fn: arena },
  { name: 'Mazmorra', fn: dungeon },
  { name: 'Laberinto', fn: maze },
  { name: 'Columnas + perímetro', fn: pillars },
  { name: 'Cruz central', fn: cross },
];

export function randomLayout(): { name: string; barriers: { x: number; y: number }[] } {
  // Mezcla la selección de generador.
  const shuffled = [...GENERATORS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const pick = shuffled.slice(0, 1 + Math.floor(Math.random() * 2));
  const barriers = dedupe(pick.flatMap((g) => g.fn()));
  return { name: `Aleatorio · ${pick.map((g) => g.name.split(' ')[0]).join(' + ')}`, barriers };
}
