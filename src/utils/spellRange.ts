// ============================================================
// Alcance de conjuros: interpreta el campo `range` (texto libre en
// español del SRD) como una distancia máxima en pies, y chequea esa
// distancia + línea de visión contra la posición real de lanzador y
// objetivo en el mapa. Usado para habilitar/deshabilitar el botón de
// lanzar un conjuro de daño según si el objetivo elegido es alcanzable.
// ============================================================

import type { MapTile } from '../types';
import { gridDistanceFeet, hasLineOfSight, type MapCell } from './mapUtils';

/**
 * Convierte el campo `range` de un conjuro a una distancia máxima en pies.
 * Cubre los formatos que aparecen en los conjuros con daño ya cargados en
 * el repertorio SRD: "Toque"/"Contacto" (cuerpo a cuerpo), "N pies",
 * "N x M pies" (línea: se usa el largo, no el ancho), "N milla(s)", y
 * "Personal" con o sin un radio/cono/cubo entre paréntesis.
 *
 * Un "Personal" sin ninguna distancia numérica (p. ej. un conjuro que se
 * lanza sobre uno mismo antes de atacar cuerpo a cuerpo) devuelve `null`:
 * no hay una distancia de alcance que chequear contra otro objetivo, así
 * que ese conjuro nunca se bloquea por alcance (sí puede seguir
 * bloqueándose por línea de visión). Un formato no reconocido también
 * devuelve `null` — mejor no bloquear un lanzamiento válido por no poder
 * interpretar el texto, que bloquear uno que sí correspondía.
 */
export const parseSpellRangeFeet = (range: string): number | null => {
  if (/toque|contacto/i.test(range)) return 5;
  const line = range.match(/(\d+)\s*x\s*\d+\s*pies/i);
  if (line) return parseInt(line[1], 10);
  const miles = range.match(/(\d+)\s*millas?/i);
  if (miles) return parseInt(miles[1], 10) * 5280;
  const feet = range.match(/(\d+)\s*pies/i);
  if (feet) return parseInt(feet[1], 10);
  return null;
};

export interface SpellReach {
  /** Distancia real entre lanzador y objetivo, o null si falta alguna posición. */
  distanceFeet: number | null;
  /** Alcance máximo interpretado del conjuro, o null si el texto no se pudo interpretar. */
  maxRangeFeet: number | null;
  /** null cuando no se pudo evaluar (falta alguna posición, o el alcance no es interpretable). */
  inRange: boolean | null;
  /** null cuando no se pudo evaluar (falta alguna posición). */
  hasLineOfSight: boolean | null;
}

/**
 * Evalúa si un objetivo está dentro del alcance de un conjuro y a la vista
 * del lanzador. Si al lanzador o al objetivo les falta posición en el mapa
 * (fichas sin colocar, combate de "teatro de la mente" sin mapa), no se
 * puede evaluar nada — se devuelve null en vez de bloquear el lanzamiento.
 */
export const evaluateSpellReach = (
  casterPos: MapCell | null,
  targetPos: MapCell | null,
  tiles: MapTile[],
  range: string
): SpellReach => {
  const maxRangeFeet = parseSpellRangeFeet(range);
  if (!casterPos || !targetPos) {
    return { distanceFeet: null, maxRangeFeet, inRange: null, hasLineOfSight: null };
  }
  const distanceFeet = gridDistanceFeet(casterPos, targetPos);
  const inRange = maxRangeFeet === null ? null : distanceFeet <= maxRangeFeet;
  const sight = hasLineOfSight(casterPos.x, casterPos.y, targetPos.x, targetPos.y, tiles);
  return { distanceFeet, maxRangeFeet, inRange, hasLineOfSight: sight };
};

/**
 * Motivo legible por el que no se puede lanzar un conjuro contra el
 * objetivo elegido (para deshabilitar el botón con un título explicativo),
 * o null si se puede lanzar sin problema.
 */
export const spellReachIssue = (
  casterPos: MapCell | null,
  targetPos: MapCell | null,
  tiles: MapTile[],
  range: string
): string | null => {
  const reach = evaluateSpellReach(casterPos, targetPos, tiles, range);
  if (reach.inRange === false) {
    return `Fuera de alcance: ${reach.distanceFeet} pies (alcance del conjuro: ${reach.maxRangeFeet} pies)`;
  }
  if (reach.hasLineOfSight === false) {
    return 'Sin línea de visión al objetivo (bloqueada por un muro u obstáculo)';
  }
  return null;
};
