// ============================================================
// Script de ingestion del SRD 5.2 (2024) para DMBuddy
//
// Propósito: ampliar el bundle curado embebido (src/data/srd2024)
// generando overlays JSON en `public/data/srd2024/`, que la app
// fusiona al arrancar (ver src/services/srdService.ts).
//
// Fuentes:
//   1. RAW locales en `data/srd2024/raw/<coleccion>.json`
//      (documentos exportados del SRD 5.2, CC-BY-4.0) si existen.
//   2. API de Open5e (""2024"" endpoints) si se ejecuta con `--fetch`.
//
// Reglas:
//   - Si el overlay destino ya tiene entradas, NO se sobrescribe:
//     se mantiene el contenido curado existente.
//   - El script nunca toca `src/data/srd2024` (bundle embebido).
//   - Fallos de red o JSON inválidos se ignoran sin romper nada.
//
// Uso: node scripts/fetch-srd2024.mjs [--fetch]
// ============================================================

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'public', 'data', 'srd2024');
const RAW_DIR = resolve(ROOT, 'data', 'srd2024', 'raw');

const FETCH = process.argv.includes('--fetch');

/** Colecciones del bundle y endpoints Open5e (2024) que se intentan usar. */
const COLLECTIONS = [
  { key: 'rules', file: 'rules.json', open5e: 'rules' },
  { key: 'conditions', file: 'conditions.json', open5e: 'conditions' },
  { key: 'spells', file: 'spells.json', open5e: 'spells' },
  { key: 'monsters', file: 'monsters.json', open5e: 'monsters' },
  { key: 'classes', file: 'classes.json', open5e: 'classes' },
  { key: 'species', file: 'species.json', open5e: 'races' },
  { key: 'feats', file: 'feats.json', open5e: 'feats' },
];

const log = (...args) => console.log('[srd2024]', ...args);

/** Normaliza un documento bruto a la forma SrdRecord por colección. */
const normalize = (key, raw) => {
  const rec = { ...raw };
  rec.source = rec.source ?? 'srd2024';
  rec.tags = Array.isArray(rec.tags) && rec.tags.length ? rec.tags : ['SRD 2024'];
  if (!rec.id) {
    const slug = String(rec.name ?? rec.title ?? 'entrada')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    rec.id = `srd-${key}-${slug}`;
  }
  if (!rec.title && rec.name) rec.title = rec.name;
  if (!rec.title) rec.title = String(rec.id);
  // Conjuros: mapear campos típicos de APIs.
  if (key === 'spells') {
    rec.level = rec.level ?? (rec.level_int ?? 0);
    rec.school = rec.school ?? rec.school_name ?? 'Adivinación';
    rec.classes = rec.classes ?? rec.dnd_class ?? [];
    rec.castingTime = rec.castingTime ?? rec.casting_time ?? '';
    rec.duration = rec.duration ?? rec.duration_unit ?? '';
    rec.content = rec.content ?? rec.desc ?? '';
    if (!rec.content && Array.isArray(rec.desc_short)) rec.content = rec.desc_short.join('\n\n');
  }
  if (key === 'monsters') {
    if (!rec.stats) {
      rec.stats = {
        str: rec.strength ?? 10,
        dex: rec.dexterity ?? 10,
        con: rec.constitution ?? 10,
        int: rec.intelligence ?? 10,
        wis: rec.wisdom ?? 10,
        cha: rec.charisma ?? 10,
      };
    }
    rec.challengeRating = rec.challengeRating ?? rec.challenge_rating ?? 0;
  }
  return rec;
};

/** Prueba que un registro cumple la forma mínima antes de escribirlo. */
const isValid = (rec) =>
  !!rec &&
  typeof rec.id === 'string' &&
  rec.id.length > 0 &&
  typeof rec.title === 'string' &&
  rec.title.length > 0 &&
  typeof rec.category === 'string';

/**
 * Intenta traer la colección desde Open5e (solo con --fetch).
 * Devuelve null si la red falla o la API no es compatible.
 */
const fetchOpen5e = async (key, endpoint) => {
  if (!FETCH) return null;
  const url = `https://api.open5e.com/v1/${endpoint}/?limit=1000&document__licence=CC-BY-4.0`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!res.ok) return null;
    const json = await res.json();
    const list = json.results ?? json;
    if (!Array.isArray(list) || list.length === 0) return null;
    return list
      .map((item) => normalize(key, item))
      .map((rec) => ({ ...rec, category: key, source: 'srd2024' }))
      .filter(isValid);
  } catch {
    return null;
  }
};

/** Carga los documentos crudos locales si existen. */
const loadRawLocal = async (key) => {
  const file = resolve(RAW_DIR, `${key}.json`);
  if (!existsSync(file)) return null;
  try {
    const json = JSON.parse(await readFile(file, 'utf8'));
    const list = Array.isArray(json) ? json : json.entries;
    if (!Array.isArray(list) || list.length === 0) return null;
    return list
      .map((item) => normalize(key, item))
      .map((rec) => ({ ...rec, category: key, source: 'srd2024' }))
      .filter(isValid);
  } catch (err) {
    log(`raw local inválido para ${key}:`, err.message);
    return null;
  }
};

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true });
  let written = 0;
  let skipped = 0;

  for (const { key, file, open5e } of COLLECTIONS) {
    const outFile = resolve(OUT_DIR, file);

    // 1) Ya existe contenido curado -> no tocar.
    if (existsSync(outFile)) {
      const existing = JSON.parse(await readFile(outFile, 'utf8'));
      const list = Array.isArray(existing) ? existing : existing.entries;
      if (Array.isArray(list) && list.length > 0) {
        skipped += 1;
        continue;
      }
    }

    // 2) Fuente local primero; si no, Open5e.
    let entries = await loadRawLocal(key);
    if (!entries) entries = await fetchOpen5e(key, open5e);
    if (!entries) {
      log(`${key}: sin datos (se mantiene el bundle embebido).`);
      continue;
    }

    await writeFile(outFile, JSON.stringify(entries, null, 2), 'utf8');
    written += 1;
    log(`${key}: ${entries.length} entradas -> public/data/srd2024/${file}`);
  }

  log(`listo. ${written} overlay(s) escritos, ${skipped} overlay(s) existentes conservados.`);
  if (!FETCH) log('nota: usa --fetch para intentar la API de Open5e.');
};

main().catch((err) => {
  console.error('[srd2024] error:', err);
  process.exitCode = 1;
});