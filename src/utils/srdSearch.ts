// ============================================================
// Búsqueda rápida del SRD (Command Palette / Ctrl+K)
// Índice plano y scoring tolerante a acentos.
// ============================================================

import type {
  SrdBundle,
  SrdRecord,
  SrdSearchItem,
  SrdSearchResult,
} from '../types/srd2024';

/** Normaliza un texto: minúsculas y sin acentos. */
const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Extrae las palabras clave buscables de un registro. */
const keywordsFor = (rec: SrdRecord): string => {
  const base = [rec.title, rec.tags.join(' ')];
  switch (rec.category) {
    case 'spells':
      base.push(rec.school, rec.classes.join(' '), String(rec.level), rec.duration);
      break;
    case 'monsters':
      base.push(rec.creatureType, rec.size, String(rec.challengeRating), rec.speed);
      break;
    case 'classes':
      base.push(rec.primaryAbility, rec.saves.join(' '), rec.armorProficiency);
      break;
    case 'species':
      base.push(rec.size, String(rec.speed), rec.traits.join(' '));
      break;
    case 'feats':
      base.push(rec.type, rec.prerequisite ?? '');
      break;
    case 'rules':
      base.push(rec.chapter ?? '');
      break;
    case 'conditions':
      break;
  }
  return base.filter(Boolean).join(' ');
};

/** Convierte el bundle en elementos planos indexables. */
export const indexBundle = (bundle: SrdBundle): SrdSearchItem[] => {
  const all = [
    ...bundle.rules,
    ...bundle.conditions,
    ...bundle.spells,
    ...bundle.monsters,
    ...bundle.classes,
    ...bundle.species,
    ...bundle.feats,
  ];
  return all.map((rec) => ({
    id: rec.id,
    title: rec.title,
    category: rec.category,
    source: rec.source,
    tags: rec.tags,
    keywords: normalize(keywordsFor(rec)),
  }));
};

/**
 * Puntuación de coincidencia para una consulta normalizada.
 * Requiere que todos los términos aparezcan en el índice.
 */
export const scoreAgainst = (item: SrdSearchItem, tokens: string[]): number => {
  const title = normalize(item.title);
  const haystack = `${title} ${item.keywords} ${normalize(item.tags.join(' '))}`;
  for (const token of tokens) {
    if (!haystack.includes(token)) return 0;
  }

  const query = tokens.join(' ');
  let score = 0;
  if (title === query) score += 60;
  else if (title.startsWith(query)) score += 35;
  for (const token of tokens) {
    score += title.includes(token) ? 20 : 8;
  }
  return score;
};

/**
 * Busca en el índice (resultados agrupados por puntuación descendente).
 */
export const searchSrd = (
  items: SrdSearchItem[],
  query: string,
  limit = 24
): SrdSearchResult[] => {
  const tokens = normalize(query)
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return [];

  return items
    .map((item) => ({ item, score: scoreAgainst(item, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};