// ============================================================
// Biblioteca de Referencia SRD 5.2
// Pestañas por colección, búsqueda en vivo, filtros de conjuros
// y atribución de licencia CC-BY-4.0.
// ============================================================

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, FilterX, Plus, Search } from 'lucide-react';
import { useSrdStore } from '../../state/srdStore';
import { indexBundle, searchSrd } from '../../utils/srdSearch';
import { SrdDetailPanel } from './SrdDetailPanel';
import { SrdSourceBadge, TagChip } from './SrdBadge';
import { Button } from '../common/Button';
import { useMonsterStore } from '../../store/monsterStore';
import { srdMonsterToMonster } from '../../data/srd2024';
import { SRD_CATEGORIES, SRD_SOURCES, CC_BY_4_0_NOTICE } from '../../types/srd2024';
import type { SrdCategoryId, SrdRecord, SrdSearchItem } from '../../types/srd2024';

type Tab = SrdCategoryId | 'all';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'all', label: 'Todo' },
  { id: 'rules', label: 'Reglas' },
  { id: 'conditions', label: 'Estados' },
  { id: 'spells', label: 'Conjuros' },
  { id: 'monsters', label: 'Bestiario' },
  { id: 'classes', label: 'Clases' },
  { id: 'species', label: 'Especies' },
  { id: 'feats', label: 'Dotes' },
];

const SCHOOLS = [
  'Abjuración',
  'Conjuración',
  'Adivinación',
  'Encantamiento',
  'Evocación',
  'Ilusión',
  'Nigromancia',
  'Transmutación',
] as const;

/** Subtítulo de tarjeta según la colección. */
const subtitleFor = (item: SrdSearchItem): string => {
  switch (item.category) {
    case 'rules':
      return item.tags[1] ?? 'Regla básica';
    case 'spells': {
      const level = item.tags.find((t) => t.startsWith('Nivel') || t === 'Truco');
      return level ? `${level} · ${item.tags[1] ?? ''}` : item.tags[1] ?? '';
    }
    case 'monsters':
      return item.tags[2] ?? 'Bestia';
    case 'classes':
      return 'Clase de personaje';
    case 'species':
      return 'Especie';
    case 'feats':
      return item.tags[1] ?? 'Dote';
    case 'conditions':
      return 'Condición';
    default:
      return item.category;
  }
};

const CategoryIcon = ['⚔️', '🚩', '✨', '🐉', '📖', '🧝', '🏅'] as const;

/**
 * Página principal de la biblioteca de referencia.
 */
export const ReferenceLibrary = () => {
  const bundle = useSrdStore((s) => s.bundle);
  const openEntry = useSrdStore((s) => s.openEntry);
  const selected = useSrdStore((s) => s.selected);
  const closeEntry = useSrdStore((s) => s.closeEntry);
  const addMonster = useMonsterStore((s) => s.addMonster);

  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [spellLevel, setSpellLevel] = useState<number | 'all'>('all');
  const [spellSchool, setSpellSchool] = useState<string>('all');
  const [spellClass, setSpellClass] = useState<string>('all');
  const [imported, setImported] = useState<string | null>(null);

  // Índice plano + acceso a los registros completos
  const records = useMemo<SrdRecord[]>(
    () => [
      ...bundle.rules,
      ...bundle.conditions,
      ...bundle.spells,
      ...bundle.monsters,
      ...bundle.classes,
      ...bundle.species,
      ...bundle.feats,
    ],
    [bundle]
  );
  const recordById = useMemo(() => new Map<string, SrdRecord>(records.map((r) => [r.id, r])), [records]);
  const spellById = useMemo(() => new Map(bundle.spells.map((s) => [s.id, s])), [bundle.spells]);
  const items = useMemo(() => indexBundle(bundle), [bundle]);
  const classes = useMemo(
    () => Array.from(new Set(bundle.spells.flatMap((s) => s.classes))).sort(),
    [bundle.spells]
  );

const runSearch = useCallback(
    (list: SrdSearchItem[], query: string): SrdSearchItem[] =>
      query.trim() ? searchSrd(list, query).map((r) => r.item) : list,
    []
  );

  const listFor = useMemo(() => {
    const base = tab === 'all' ? items : items.filter((i) => i.category === tab);

    if (tab === 'spells') {
      const levelOk = (item: SrdSearchItem) =>
        spellLevel === 'all' || spellById.get(item.id)?.level === spellLevel;
      const schoolOk = (item: SrdSearchItem) =>
        spellSchool === 'all' || spellById.get(item.id)?.school === spellSchool;
      const classOk = (item: SrdSearchItem) =>
        spellClass === 'all' || spellById.get(item.id)?.classes.includes(spellClass) === true;
      const filtered = base.filter((i) => levelOk(i) && schoolOk(i) && classOk(i));
      return runSearch(filtered, q);
    }

    return runSearch(base, q);
  }, [items, tab, q, spellLevel, spellSchool, spellClass, spellById, runSearch]);

  const hasActiveFilters =
    tab === 'spells' && (spellLevel !== 'all' || spellSchool !== 'all' || spellClass !== 'all');

  const resetFilters = () => {
    setSpellLevel('all');
    setSpellSchool('all');
    setSpellClass('all');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Biblioteca SRD 5.2</h1>
        <p className="text-sm text-dnd-muted">
          Reglas, estados, conjuros, bestiario y opciones de personaje de las reglas 2024 bajo licencia CC-BY-4.0.
        </p>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dnd-muted" aria-hidden="true" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar regla, estado, conjuro, monstruo, clase, especie o dote…"
          className="input pl-9"
          aria-label="Buscar en la biblioteca"
        />
      </div>

      {/* Pestañas */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === id
                ? 'bg-dnd-gold text-dnd-ink'
                : 'border border-dnd-leather/50 text-dnd-text/70 hover:bg-dnd-leather/20'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filtros de conjuros */}
      <AnimatePresence>
        {tab === 'spells' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-end gap-2 rounded-dnd-lg border border-dnd-leather/40 bg-dnd-ink/30 p-3">
              <div>
                <label className="label" htmlFor="f-level">Nivel</label>
                <select id="f-level" value={spellLevel} onChange={(e) => setSpellLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="input text-sm">
                  <option value="all">Todos</option>
                  <option value="0">Truco</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <option key={n} value={n}>{n}º</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="f-school">Escuela</label>
                <select id="f-school" value={spellSchool} onChange={(e) => setSpellSchool(e.target.value)} className="input text-sm">
                  <option value="all">Todas</option>
                  {SCHOOLS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="f-class">Clase</label>
                <select id="f-class" value={spellClass} onChange={(e) => setSpellClass(e.target.value)} className="input text-sm">
                  <option value="all">Todas</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" icon={<FilterX size={14} />} onClick={resetFilters}>
                  Limpiar
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultados */}
      <p className="text-xs text-dnd-muted" aria-live="polite">
        {listFor.length} {listFor.length === 1 ? 'resultado' : 'resultados'}
      </p>

      {listFor.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-10 text-center">
          <BookOpen size={28} className="text-dnd-muted" aria-hidden="true" />
          <p className="text-sm text-dnd-muted">No se encontró nada con ese criterio.</p>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>Quitar filtros</Button>
          )}
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence initial={false}>
            {listFor.map((item) => {
              const rec = recordById.get(item.id);
              if (!rec) return null;
              const icon = CategoryIcon[
                ['rules', 'conditions', 'spells', 'monsters', 'classes', 'species', 'feats'].indexOf(item.category)
              ];
              return (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="group flex cursor-pointer flex-col gap-2 rounded-dnd-lg border border-dnd-leather/40 bg-dnd-dark/80 p-3 transition-colors hover:border-dnd-gold/60"
                  onClick={() => openEntry(rec)}
                >
<div className="min-w-0">
                    <p className="truncate text-sm font-bold text-dnd-text">
                      <span aria-hidden="true" className="mr-1">{icon}</span>
                      {item.title}
                    </p>
                    <p className="truncate text-[11px] text-dnd-muted">{subtitleFor(item)}</p>
                  </div>

                  <div className="mt-auto flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1">
                      <TagChip label={SRD_CATEGORIES[item.category].label} />
                      {item.category === 'monsters' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addMonster(srdMonsterToMonster(rec as never));
                            setImported(item.id);
                            setTimeout(() => setImported(null), 1400);
                          }}
                          className="badge border border-dnd-gold/50 bg-dnd-gold/10 text-dnd-gold transition-colors hover:bg-dnd-gold/25"
                        >
                          {imported === item.id ? '✓ Importado' : (
                            <>
                              <Plus size={11} aria-hidden="true" /> Importar
                            </>
                          )}
                        </button>
                      )}
                      {rec.tags.length > 0 && <TagChip label={rec.tags[0]} />}
                    </div>
                    <SrdSourceBadge source={item.source} />
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* Atribución de licencia */}
      <section className="mt-6 rounded-dnd-lg border border-dnd-gold/30 bg-dnd-gold/5 p-4 text-xs leading-relaxed text-dnd-text/80">
        <h2 className="mb-1 font-fantasy text-sm font-bold text-dnd-gold">Licencia y créditos</h2>
        <p>{CC_BY_4_0_NOTICE}</p>
        <p className="mt-2 text-dnd-muted">
          El contenido de este proyecto es una adaptación resumida con fines de utilidad para el Dungeon Master.
          El texto original del SRD 5.2 se conserva enlaces: puedes consultarlo en{' '}
          <a
            href="https://www.dndbeyond.com/srd"
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 underline hover:text-sky-300"
          >
            dndbeyond.com/srd
          </a>{' '}
          ({SRD_SOURCES.srd2024.notice}).
        </p>
      </section>

      <SrdDetailPanel entry={selected} onClose={closeEntry} />
    </div>
  );
};

export default ReferenceLibrary;
