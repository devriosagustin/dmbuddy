// ============================================================
// SRD 5.2 - Paquete de datos (bundle)
// Agrega todas las colecciones y ofrece utilidades de conversión.
// ============================================================

import type { Monster, Spell } from '../../types';
import type { SrdBundle, SrdMonsterEntry, SrdSpellEntry } from '../../types/srd2024';
import { CORE_RULES, CONDITIONS } from './rules';
import { SRD_SPELLS } from './spells';
import { SRD_CLASSES, SRD_SPECIES, SRD_FEATS } from './character';
import { SRD_MONSTERS_2024 } from './monsters';

export { CORE_RULES, CONDITIONS } from './rules';
export { SRD_SPELLS } from './spells';
export { SRD_CLASSES, SRD_SPECIES, SRD_FEATS } from './character';
export { SRD_MONSTERS_2024 } from './monsters';
export { srdWeaponById, SRD_WEAPONS } from './weapons';
export type { SrdWeaponEntry } from './weapons';

/**
 * Construye el paquete completo de contenido SRD 5.2 curado.
 * Se ejecuta una sola vez al arrancar la app (offline).
 */
export const buildSrdBundle = (): SrdBundle => ({
  rules: CORE_RULES,
  conditions: CONDITIONS,
  spells: SRD_SPELLS,
  monsters: SRD_MONSTERS_2024,
  classes: SRD_CLASSES,
  species: SRD_SPECIES,
  feats: SRD_FEATS,
});

/** Inicial singleton del bundle base (sin overlays). */
export const BASE_SRD_BUNDLE: SrdBundle = buildSrdBundle();

/**
 * Convierte un monstruo del Bestiario 2024 al modelo `Monster` usado
 * por el rastreador de combate y la biblioteca de monstruos.
 */
export const srdMonsterToMonster = (entry: SrdMonsterEntry): Monster => ({
  id: entry.id,
  name: entry.title,
  type: entry.creatureType,
  size: entry.size as Monster['size'],
  alignment: entry.alignment,
  armorClass: entry.armorClass,
  hitPoints: entry.hitPoints,
  hitDice: entry.hitDice,
  speed: entry.speed,
  stats: entry.stats,
  skills: entry.skills ?? {},
  senses: entry.senses ?? '—',
  languages: entry.languages ?? '—',
  challengeRating: entry.challengeRating,
  traits: entry.traits,
  actions: entry.actions,
  legendaryActions: entry.legendaryActions,
  spellcasting: entry.spellcasting ? { ...entry.spellcasting } : undefined,
  custom: true,
});

const normalizeLookupKey = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Título sin la parte inglesa entre paréntesis (p. ej. "Bola de fuego"). */
const stripEnglishName = (title: string): string =>
  title.replace(/\s*\([^)]*\)\s*$/, '').trim();

/** Índice de conjuros por título normalizado (acentos y mayúsculas ignorados). */
const spellIndex = new Map<string, SrdSpellEntry>(
  SRD_SPELLS.map((s) => [normalizeLookupKey(s.title), s])
);

/** Índice por título limpio (sin el nombre inglés entre paréntesis). */
const spellIndexClean = new Map<string, SrdSpellEntry>();
for (const s of SRD_SPELLS) {
  const key = normalizeLookupKey(stripEnglishName(s.title));
  if (key && !spellIndexClean.has(key)) spellIndexClean.set(key, s);
}

/**
 * Resuelve un conjuro por su título (p. ej. `"Bola de fuego (Fireball)"`,
 * `"bola DE FUEGO fireball"` o simplemente `"Bola de fuego"`). Se usa para el
 * lanzamiento de conjuros enemigos y para los detalles desde el party.
 */
export const srdSpellByTitle = (title: string): SrdSpellEntry | undefined =>
  spellIndex.get(normalizeLookupKey(title)) ??
  spellIndexClean.get(normalizeLookupKey(stripEnglishName(title)));

/**
 * Convierte un conjuro del SRD 5.2 al modelo `Spell` usado por
 * el party (trucos y conjuros preparados del personaje).
 */
export const srdSpellToSpell = (entry: SrdSpellEntry): Spell => ({
  id: entry.id,
  name: entry.title,
  level: entry.level,
  school: entry.school,
  castingTime: entry.castingTime,
  range: entry.range,
  components: entry.components,
  duration: entry.duration,
  description: entry.content,
  concentration: entry.concentration,
});