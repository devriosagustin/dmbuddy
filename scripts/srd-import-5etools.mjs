#!/usr/bin/env node
// ============================================================
// Importador SRD 5.2 (2024) desde los datos de 5e.tools
// (espejo GitHub, English). Genera overlays JSON que la app ya
// carga en `public/data/srd2024/*.json` (ver services/srdService).
//
// Fuente: https://github.com/5etools-mirror-3/5etools-src (MIT, 2024/5.5e)
// El contenido proviene del SRD 5.2 de Wizards of the Coast (CC-BY-4.0).
// Uso:  node scripts/srd-import-5etools.mjs
// ============================================================

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'data', 'srd2024');
const RAW = 'https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/main/data';

// ------------------------------------------------------------
// Utilidades básicas
// ------------------------------------------------------------
const norm = (s) => (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, ' ').toLowerCase().trim().replace(/\s+/g, ' ');

const SCHOOLS_ES = {
  A: 'Abjuración', C: 'Conjuración', D: 'Adivinación', EN: 'Encantamiento',
  V: 'Evocación', I: 'Ilusión', N: 'Nigromancia', T: 'Transmutación', U: 'Universal',
};

const CLASSES_ES = {
  Artificer: 'Artífice', Barbarian: 'Bárbaro', Bard: 'Bardo', Cleric: 'Clérigo',
  Druid: 'Druida', Fighter: 'Guerrero', Monk: 'Monje', Paladin: 'Paladín',
  Ranger: 'Guardabosques', Rogue: 'Pícaro', Sorcerer: 'Hechicero',
  Warlock: 'Brujo', Wizard: 'Mago',
};

const SIZES_ES = { T: 'Diminuto', S: 'Pequeño', M: 'Mediano', L: 'Grande', H: 'Enorme', G: 'Titánico' };

const flattenType = (t) => {
  if (!t) return 'humanoide';
  if (typeof t === 'string') return t.replace(/_/g, ' ');
  if (Array.isArray(t)) return t.map(flattenType).join(' · ');
  if (t.choose) return flattenType(t.choose);
  if (t.type) return flattenType(t.type);
  return 'humanoide';
};

const SENSE_ES = {
  darkvision: 'Visión en la oscuridad', blindsight: 'Visión ciega', truesight: 'Visión verdadera',
  tremorsense: 'Sentido de vibración', 'passive Perception': 'Percepción pasiva',
};

const fetchJson = async (file) => {
  const url = `${RAW}/${file}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} -> ${url}`);
  return res.json();
};

// ------------------------------------------------------------
// Render de entradas de 5e.tools -> Markdown
// ------------------------------------------------------------
const stripTags = (text) =>
  text.replace(/\{@([a-zA-Z0-9]+)([^}]*)\}/g, (m, tag, rest) => {
    const parts = rest.split('|');
    const body = (parts.shift() ?? '').trim(); // texto tras la etiqueta
    if (parts.length >= 2) return parts[parts.length - 1]; // display explícito
    switch (tag) {
      case 'h': return '**Impacta:**';
      case 'd': return '**Daño:**';
      case 'hit': return `+${body}`;
      case 'dc': return `CD ${body}`;
      case 'chance': return `${body}%`;
      case 'atk': return '(ataque)';
      case 'adv': return '**Ventaja**';
      case 'disadv': return '**Desventaja**';
      case 'damage':
      case 'dice': return body;
      default: return body; // {@creature X|src}, {@spell X|src}, {@variantrule X|src}, ...
    }
  });

const renderOne = (e) => {
  if (typeof e === 'string') return stripTags(e).trim();
  if (!e || typeof e !== 'object') return '';
  const name = e.name ? `**${stripTags(String(e.name)).trim()}.** ` : '';
  switch (e.type) {
    case 'entries':
    case 'section':
    case 'card': {
      const kids = (Array.isArray(e.entries) ? e.entries : []).map(renderOne).filter(Boolean);
      return name + kids.join('\n\n');
    }
    case 'list': {
      const items = (e.items ?? []).map((i) => `- ${renderOne(i)}`).filter(Boolean);
      return name + items.join('\n');
    }
    case 'table': {
      const head = e.colLabels?.length ? `| ${e.colLabels.map((c) => stripTags(String(c))).join(' | ')} |\n| ${e.colLabels.map(() => '---').join(' | ')} |` : '';
      const rows = (e.rows ?? []).map((r) => `| ${(Array.isArray(r) ? r : [r]).map((c) => stripTags(String(c)).replace(/\|/g, '/')).join(' | ')} |`).join('\n');
      return name + (head ? `${head}\n${rows}` : rows);
    }
    case 'inset':
    case 'quote': {
      const kids = (Array.isArray(e.entries) ? e.entries : []).map(renderOne).filter(Boolean);
      return `> ${name}${kids.join('\n> ')}`;
    }
    case 'abilityDc': return `CD ${e.ability ?? ''} ${e.dcSuccess ? '(éxito)' : ''}`;
    case 'optfeature':
    case 'refClassFeature':
    case 'refSubclassFeature':
    case 'refOptionalfeature': return '';
    default:
      if (Array.isArray(e.entries)) return name + e.entries.map(renderOne).filter(Boolean).join('\n\n');
      if (e.text) return name + stripTags(String(e.text));
      return '';
  }
};

const render = (entries) =>
  (entries ?? []).map(renderOne).filter((x) => x && x.length > 2).join('\n\n');

// ------------------------------------------------------------
// Set de "ya cubierto en español" (leído de los .ts del bundle)
// ------------------------------------------------------------
const readCoverage = () => {
  const covered = { spells: new Set(), monsters: new Set(), feats: new Set() };
  const spellSrc = readFileSync(path.join(ROOT, 'src', 'data', 'srd2024', 'spells.ts'), 'utf8');
  for (const m of spellSrc.matchAll(/\*\*([^*]+)\*\*/g)) {
    const t = m[1].trim();
    const eng = t.match(/\(([^()]+)\)\s*$/);
    if (eng) covered.spells.add(norm(eng[1]));
    covered.spells.add(norm(t));
  }
  const monSrc = readFileSync(path.join(ROOT, 'src', 'data', 'srd2024', 'monsters.ts'), 'utf8');
  for (const m of monSrc.matchAll(/name:\s*'([^']+)',\s*size:/g)) {
    const t = m[1].trim();
    const eng = t.match(/\(([^()]+)\)\s*$/);
    if (eng) covered.monsters.add(norm(eng[1]));
    covered.monsters.add(norm(t));
  }
  const charSrc = readFileSync(path.join(ROOT, 'src', 'data', 'srd2024', 'character.ts'), 'utf8');
  for (const m of charSrc.matchAll(/fe\(\{ id: '[^']+', name: '([^']+)'/g)) {
    const t = m[1].trim();
    const eng = t.match(/\(([^()]+)\)\s*$/);
    if (eng) covered.feats.add(norm(eng[1]));
    covered.feats.add(norm(t));
  }
  return covered;
};

// ------------------------------------------------------------
// Conversor de conjuros
// ------------------------------------------------------------
const ft = (n, unit) => {
  const map = { action: 'Acción', bonus: 'Acción de bonificación', reaction: 'Reacción', free: 'Libre' };
  const un = map[unit] ?? unit;
  return n > 1 ? `${n} ${un}s` : `${n} ${un}`;
};

const fmtTime = (time) => (Array.isArray(time) ? time.map((t) => ft(t.number, t.unit)).join(' · ') : '1 Acción');

const fmtRange = (r) => {
  if (typeof r === 'string') {
    return r
      .replace(/^Self\s*(\(|$)/i, 'Uno mismo')
      .replace(/-foot cone/i, 'pies, cono')
      .replace(/-foot line/i, 'pies, línea')
      .replace(/-foot cube/i, 'pies, cubo')
      .replace(/-foot sphere/i, 'pies, esfera')
      .replace(/-foot radius/i, 'pies de radio')
      .replace(/feet?/gi, 'pies') || r;
  }
  if (!r || typeof r !== 'object') return 'Especial';
  const d = r.distance;
  const amt = d?.amount ? `${d.amount} pies` : '';
  switch (r.type) {
    case 'point': return amt || 'Especial';
    case 'touch': return 'Contacto';
    case 'self': return 'Uno mismo';
    case 'special': return 'Especial';
    case 'cone': return `Uno mismo (cono de ${amt})`;
    case 'line': return `Uno mismo (línea de ${amt})`;
    case 'cube': return `Uno mismo (cubo de ${amt})`;
    case 'sphere': return `Uno mismo (esfera de ${amt})`;
    case 'radius': return `Uno mismo (radio de ${amt})`;
    default: return amt || 'Especial';
  }
};

const fmtComponents = (c) => {
  if (!c) return '';
  const parts = [];
  if (c.v) parts.push('V');
  if (c.s) parts.push('S');
  if (c.m?.text) parts.push(`M (${stripTags(c.m.text)})`);
  return parts.join(', ');
};

const fmtDuration = (d) => {
  const map = { instant: 'Instantáneo', permanent: 'Permanente', special: 'Especial' };
  const units = { hour: 'hora', minute: 'minuto', day: 'día', week: 'semana', turn: 'turno', round: 'ronda' };
  if (Array.isArray(d)) {
    return d.map((x) => {
      if (map[x.type]) return map[x.type];
      if (x.type === 'timed' && x.duration) {
        const u = (x.duration.type ?? '').replace(/s$/, '');
        const amount = `${x.duration.amount ?? ''} ${units[u] ?? x.duration.type ?? ''}`.trim();
        return x.concentration ? `${amount} (Conc.)` : amount;
      }
      return 'Especial';
    }).join(' · ');
  }
  return 'Instantáneo';
};

const spellToRecord = (s) => {
  const school = SCHOOLS_ES[s.school] ?? s.school ?? 'Universal';
  const levelLabel = s.level === 0 ? 'Truco' : `Nivel ${s.level}`;
  const classes = (s.classes?.fromClassList ?? s.classes ?? [])
    .map((c) => CLASSES_ES[c.name] ?? c.name)
    .filter((v, i, a) => v && a.indexOf(v) === i);
  const hl = (s.entriesHigherLevel ?? [])
    .map((x) => render(Array.isArray(x.entries) ? x.entries : [x]))
    .filter(Boolean)
    .join('\n\n');
  const body = render(s.entries) + (hl ? `\n\n**Mejora a niveles superiores**\n\n${hl}` : '');
  let damage = '';
  if (s.scalingLevelDice?.scaling) {
    const sc = s.scalingLevelDice.scaling;
    damage = sc?.['1'] ?? sc?.['0'] ?? '';
  }
  return {
    id: `srd-en-spell-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title: s.name,
    category: 'spells',
    source: 'srd2024',
    tags: ['SRD 2024', school, levelLabel, 'EN'],
    level: s.level,
    school,
    castingTime: fmtTime(s.time),
    range: fmtRange(s.range),
    components: fmtComponents(s.components),
    duration: fmtDuration(s.duration),
    concentration: !!s.concentration,
    ritual: !!s.ritual,
    classes,
    damageRolls: damage || undefined,
    upcastInfo: s.entriesHigherLevel?.length ? 'A niveles superiores.' : undefined,
    content: body || s.name,
  };
};

// ------------------------------------------------------------
// Conversor de monstruos
// ------------------------------------------------------------
const fmtSpeed = (sp) => {
  if (typeof sp === 'string') return sp.replace(/feet?/gi, 'pies');
  if (!sp || typeof sp !== 'object') return '—';
  const parts = [];
  const add = (k, label) => {
    const v = sp[k];
    if (typeof v === 'number') parts.push(`${label ? label + ' ' : ''}${v} pies`);
    else if (typeof v === 'object' && v.number) parts.push(`${label ? label + ' ' : ''}${v.number} pies${v.conditions ? ` (${v.conditions.join(', ')})` : ''}`);
  };
  add('walk', '');
  if (sp.burrow !== undefined) add('burrow', 'madriguera');
  add('climb', 'escalando');
  add('fly', 'volando');
  add('swim', 'nadando');
  if (parts.length === 0) return '—';
  return parts.join(', ').trim();
};

const fmtSense = (senses, passive) => {
  const out = (senses ?? []).map((s) => {
    const t = String(s).replace(/ft\.?/gi, 'pies').replace(/feet?/gi, 'pies');
    const m = t.match(/^([a-z]+)/i);
    if (m && SENSE_ES[m[1].toLowerCase()]) {
      return `${SENSE_ES[m[1].toLowerCase()]} ${t.slice(m[0].length).trim()}`;
    }
    return t.charAt(0).toUpperCase() + t.slice(1);
  });
  if (passive && !out.some((x) => x.includes('pasiva'))) out.push(`Percepción pasiva ${passive}`);
  return out.join(' · ');
};

const fmtCr = (cr) => {
  if (typeof cr === 'number') return cr;
  if (cr && typeof cr === 'object') cr = cr.cr ?? cr.value ?? cr.number;
  const str = String(cr).trim();
  if (str === '0') return 0;
  const fracs = { '1/8': 0.125, '1/4': 0.25, '1/2': 0.5 };
  if (fracs[str] !== undefined) return fracs[str];
  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
};

const act = (a) => ({
  name: stripTags(String(a.name ?? '—')),
  attackBonus: typeof a.attackBonus === 'number' ? a.attackBonus : undefined,
  damage: a.damage ? String(a.damage) : undefined,
  damageType: a.damageType ? String(a.damageType) : undefined,
  description: render(a.entries) || a.name || '',
});

const monsterToRecord = (m) => {
  const stats = { str: m.str ?? 10, dex: m.dex ?? 10, con: m.con ?? 10, int: m.int ?? 10, wis: m.wis ?? 10, cha: m.cha ?? 10 };
  return {
    id: `srd-en-monster-${m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    title: m.name,
    category: 'monsters',
    source: 'srd2024',
    tags: ['SRD 2024', 'Bestiario', `CR ${fmtCr(m.cr)}`, 'EN'],
    size: SIZES_ES[m.size] ?? m.size,
    creatureType: flattenType(m.type),
    alignment: Array.isArray(m.alignment) ? m.alignment.join(', ') : (m.alignment ?? '—').toString(),
    armorClass: Number(Array.isArray(m.ac) ? (m.ac[0]?.ac ?? 10) : m.ac ?? 10),
    hitPoints: Number(m.hp?.average ?? 0),
    hitDice: (m.hp?.formula ?? m.hp?.special ?? '').toString() || '—',
    speed: fmtSpeed(m.speed),
    stats,
    skills: m.skills ?? {},
    senses: fmtSense(m.senses, m.passive),
    languages: Array.isArray(m.languages) ? m.languages.filter((l) => !l.startsWith('&')).join(', ') : (m.languages ?? '—').toString(),
    challengeRating: fmtCr(m.cr),
    traits: (m.trait ?? []).map((t) => ({ name: t.name ?? '—', description: render(t.entries) })),
    actions: [
      ...(m.action ?? []).map(act),
      ...(m.bonus ?? []).map((a) => ({ ...act(a), name: `(Bonus) ${a.name}` })),
      ...(m.reaction ?? []).map((a) => ({ ...act(a), name: `(Reacción) ${a.name}` })),
    ].filter((x) => x.name && x.name !== '—'),
    legendaryActions: (m.legendary ?? []).map((a) => ({ ...act(a), name: `(Legendario) ${a.name}` })),
  };
};

// ------------------------------------------------------------
// Conversor de reglas (libro PHB) -> entradas de reglas
// ------------------------------------------------------------
const isSection = (e) => e && typeof e === 'object' && Array.isArray(e.entries) && e.name;

const ruleEntry = (chapter, title, entries, extraTags = []) => ({
  id: `srd-en-rules-${norm(`${chapter} ${title}`).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 64)}`,
  title,
  category: 'rules',
  source: 'srd2024',
  tags: ['SRD 2024', 'Regla básica', 'EN', ...extraTags],
  chapter,
  content: render(entries),
});

const flattenBook = (book) => {
  const out = [];
  const chapters = (book.book?.data ?? book.data ?? []);
  for (const ch of chapters) {
    const chName = ch.name ? stripTags(String(ch.name)) : 'Reglas';
    const children = Array.isArray(ch.entries) ? ch.entries : [];
    const sections = children.filter(isSection);
    const intro = children.filter((e) => !isSection(e));
    for (const sec of sections) {
      out.push(ruleEntry(chName, stripTags(String(sec.name)), sec.entries, ['Regla básica']));
    }
    if (intro.length && !sections.length) {
      out.push(ruleEntry(chName, chName, children, ['Regla básica']));
    } else if (intro.map(renderOne).filter(Boolean).join('\n').length > 12) {
      out.push(ruleEntry(chName, `${chName} — introducción`, intro, ['Regla básica']));
    }
  }
  return out;
};

// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------
const main = async () => {
  mkdirSync(OUT, { recursive: true });
  const covered = readCoverage();
  const report = {};

  // --- Conjuros (PHB 2024 completo) ---
  const spells = await fetchJson('spells/spells-xphb.json');
  const spellRecs = spells.spell
    .filter((s) => s.srd52 !== false)
    .filter((s) => !covered.spells.has(norm(s.name)))
    .map(spellToRecord);
  report.spells = spellRecs.length;
  writeFileSync(path.join(OUT, 'spells.json'), JSON.stringify({ entries: spellRecs }));

  // --- Bestiario 2024 (PHB + MM, marcado SRD) ---
  const [phb, mm] = await Promise.all([fetchJson('bestiary/bestiary-xphb.json'), fetchJson('bestiary/bestiary-xmm.json')]);
  const beasts = [...(phb.monster ?? []), ...(mm.monster ?? [])]
    .filter((m) => m.srd52 === true || m.basicRules2024 === true)
    .filter((m) => !covered.monsters.has(norm(m.name)))
    .map(monsterToRecord);
  report.monsters = beasts.length;
  writeFileSync(path.join(OUT, 'monsters.json'), JSON.stringify({ entries: beasts }));

  // --- Dotes 2024 ---
  const feats = await fetchJson('feats.json');
  const featRecs = feats.feat
    .filter((f) => f.srd52 === true || f.source === 'XPHB')
    .filter((f) => !covered.feats.has(norm(f.name)))
    .map((f) => {
      const label =
        f.category === 'O' ? 'Dote de origen'
        : String(f.category).startsWith('FS') ? 'Estilo de combate'
        : f.category === 'EB' ? 'Don épico'
        : 'Dote general';
      return {
        id: `srd-en-feat-${f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title: f.name,
        category: 'feats',
        source: 'srd2024',
        tags: ['SRD 2024', label, 'EN'],
        type: f.category === 'O' ? 'origin' : 'general',
        prerequisite: f.prerequisite ? String(f.prerequisite).slice(0, 80) : undefined,
        content: render(f.entries) || f.name,
      };
    });
  report.feats = featRecs.length;
  writeFileSync(path.join(OUT, 'feats.json'), JSON.stringify({ entries: featRecs }));

  // --- Estados / condiciones 2024 ---
  const conditions = await fetchJson('conditionsdiseases.json');
  const condRecs = (conditions.condition ?? [])
    .filter((c) => c.srd52 === true)
    .map((c) => ({
      id: `srd-en-cond-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: c.name,
      category: 'conditions',
      source: 'srd2024',
      tags: ['SRD 2024', 'Condición', 'EN'],
      content: render(c.entries) || c.name,
    }));
  report.conditions = condRecs.length;
  writeFileSync(path.join(OUT, 'conditions.json'), JSON.stringify({ entries: condRecs }));

  // --- Reglas / mecánicas (PHB 2024 completo) ---
  const book = await fetchJson('book/book-xphb.json');
  const rulesRecs = flattenBook(book);
  report.rules = rulesRecs.length;
  writeFileSync(path.join(OUT, 'rules.json'), JSON.stringify({ entries: rulesRecs }));

  console.log('Overlays generados en public/data/srd2024/:');
  console.table(report);
};

main().catch((err) => { console.error(err); process.exit(1); });