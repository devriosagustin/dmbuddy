// ============================================================
// Selector de trucos y conjuros del SRD 5.2
// Buscador contextual: se filtran por la clase del personaje
// que se está creando/editando.
// ============================================================

import { useMemo, useState } from 'react';
import { BookOpen, Check, Search } from 'lucide-react';
import { BASE_SRD_BUNDLE, srdSpellToSpell } from '../../data/srd2024';
import { Modal } from '../common/Modal';
import { MarkdownPreview } from '../notes/MarkdownPreview';
import type { Spell } from '../../types';
import type { SrdSpellEntry } from '../../types/srd2024';

interface SpellPickerProps {
  cantrips: Spell[];
  spells: Spell[];
  onToggleCantrip: (spell: Spell) => void;
  onToggleSpell: (spell: Spell) => void;
  onRemoveCantrip: (id: string) => void;
  onRemoveSpell: (id: string) => void;
  /** Clase del personaje (filtra los conjuros que puede lanzar). */
  className: string;
  /** Trucos que la clase conoce en el nivel actual (SRD 5.2). */
  maxCantrips?: number;
  /** Conjuros preparados/conocidos autorizados (SRD 5.2). */
  maxSpells?: number;
  /** Nivel máximo de espacio de conjuro lanzable (SRD 5.2). */
  maxSpellLevel?: number;
}

type Tab = 'cantrips' | 'spells';

/** Normaliza texto para la búsqueda (minúsculas, sin acentos). */
const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Lista de clases oficiales que lanzan conjuros en el SRD 5.2,
 * extraída de los propios conjuros cargados.
 */
const CASTING_CLASSES = Array.from(
  new Set(BASE_SRD_BUNDLE.spells.flatMap((s) => s.classes))
).sort();

export const SpellPicker = ({
  cantrips,
  spells,
  onToggleCantrip,
  onToggleSpell,
  onRemoveCantrip,
  onRemoveSpell,
  className,
  maxCantrips = Infinity,
  maxSpells = Infinity,
  maxSpellLevel = Infinity,
}: SpellPickerProps) => {
  const [tab, setTab] = useState<Tab>('cantrips');
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('auto');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [viewing, setViewing] = useState<SrdSpellEntry | null>(null);

  const isCaster = useMemo(() => {
    if (!className) return false;
    return CASTING_CLASSES.includes(className);
  }, [className]);

  // Filtro de clase efectivo: 'auto' sigue al personaje si puede lanzar; si no, 'Todas'.
  const effectiveClass =
    classFilter !== 'auto' ? classFilter : isCaster ? className : '';

  // Límite de nivel de conjuro según las reglas 2024 de la clase.
  const levelLimit = tab === 'spells' ? Math.floor(maxSpellLevel) : 0;

  // En el nivel actual: alguno de los dos límites es 0 => la clase no lanza.
  const picksNothing =
    (tab === 'cantrips' && maxCantrips === 0) ||
    (tab === 'spells' && (maxSpells === 0 || maxSpellLevel === 0));

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const level = tab === 'cantrips' ? 0 : levelFilter === 'all' ? null : Number(levelFilter);

    return BASE_SRD_BUNDLE.spells.filter((s) => {
      if (tab === 'cantrips') {
        if (s.level !== 0) return false;
      } else if (s.level === 0) {
        return false;
      } else if (level !== null && s.level !== level) {
        return false;
      }
      if (levelLimit > 0 && s.level > levelLimit) return false;
      if (effectiveClass && !s.classes.includes(effectiveClass)) return false;
      if (q && !normalize(s.title).includes(q) && !normalize(s.school).includes(q)) return false;
      return true;
    });
  }, [tab, query, effectiveClass, levelFilter, levelLimit]);

  const toggle = (entry: SrdSpellEntry) => {
    const spell = srdSpellToSpell(entry);
    if (entry.level === 0) onToggleCantrip(spell);
    else onToggleSpell(spell);
  };

  const selectedIds = new Set(
    (tab === 'cantrips' ? cantrips : spells).map((s) => s.id)
  );

  const chipList = tab === 'cantrips' ? cantrips : spells;

  /** Busca la entrada SRD completa de un conjuro seleccionado (para consultar su texto). */
  const srdForSpell = (s: Spell): SrdSpellEntry | undefined =>
    BASE_SRD_BUNDLE.spells.find((e) => e.id === s.id);

  // Cuenta actual y máximo permitido en la pestaña activa.
  const currentCount = tab === 'cantrips' ? cantrips.length : spells.length;
  const capCount = tab === 'cantrips' ? maxCantrips : maxSpells;
  const isAtCap =
    Number.isFinite(capCount) && capCount > 0 && currentCount >= capCount;
  const capLabel = Number.isFinite(capCount) ? String(capCount) : '∞';

  return (
    <section className="rounded-dnd-lg border border-dnd-leather/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-dnd-gold">
          {tab === 'cantrips'
            ? `Trucos (${cantrips.length}/${capLabel})`
            : `Conjuros (${spells.length}/${capLabel})`}
        </h3>
        <div role="tablist" aria-label="Tipo de conjuro" className="flex rounded-lg bg-dnd-ink/50 p-0.5">
          <button
            role="tab"
            aria-selected={tab === 'cantrips'}
            onClick={() => setTab('cantrips')}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
              tab === 'cantrips' ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'
            }`}
          >
            Trucos
          </button>
          <button
            role="tab"
            aria-selected={tab === 'spells'}
            onClick={() => setTab('spells')}
            className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
              tab === 'spells' ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'
            }`}
          >
            Conjuros
          </button>
        </div>
      </div>

      {/* Buscador y filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-dnd-muted" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o escuela…"
            aria-label="Buscar conjuro en el SRD"
            className="input pl-7 text-sm"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          aria-label="Filtrar por clase"
          className="input text-sm"
        >
          <option value="auto">{isCaster ? `Clase: ${className}` : 'Todas las clases'}</option>
          {CASTING_CLASSES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {tab === 'spells' && (
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            aria-label="Filtrar por nivel"
            className="input text-sm"
          >
            <option value="all">Todos los niveles</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9]
              .filter((n) => levelLimit <= 0 || levelLimit >= 9 || n <= levelLimit)
              .map((n) => (
                <option key={n} value={n}>Nivel {n}</option>
              ))}
          </select>
        )}
      </div>

      {/* Seleccionados */}
      {chipList.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {chipList.map((spell) => {
            const levelLabel = spell.level === 0 ? 'truco' : `niv ${spell.level}`;
            return (
              <span
                key={spell.id}
                className="badge border border-dnd-gold/40 bg-dnd-gold/10 text-dnd-text"
                title={spell.description}
              >
                {spell.name}
                <span className="ml-1 text-[9px] uppercase text-dnd-gold">· {levelLabel}</span>
                {srdForSpell(spell) && (
                  <button
                    onClick={() => setViewing(srdForSpell(spell) as SrdSpellEntry)}
                    aria-label={`Ver descripción de ${spell.name}`}
                    title="Ver descripción"
                    className="ml-1 text-dnd-gold hover:text-dnd-gold/80"
                  >
                    <BookOpen size={12} aria-hidden="true" />
                  </button>
                )}
                <button
                  onClick={() => (spell.level === 0 ? onRemoveCantrip(spell.id) : onRemoveSpell(spell.id))}
                  aria-label={`Quitar ${spell.name}`}
                  className="ml-1 text-red-300 hover:text-red-200"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Resultados */}
      <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-dnd-leather/30">
        {picksNothing ? (
          <p className="px-3 py-4 text-center text-xs text-dnd-muted">
            {tab === 'cantrips'
              ? `${className || 'Esta clase'} no obtiene trucos de esta manera según el SRD 5.2.`
              : `${className || 'Esta clase'} no lanza conjuros de esta manera según el SRD 5.2.`}
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-dnd-muted">
            {!effectiveClass && query
              ? `Sin resultados para "${query}".`
              : effectiveClass
                ? `${effectiveClass} no tiene más conjuros de este tipo en el SRD. Prueba con "Todas las clases".`
                : 'Sin resultados. Prueba otra búsqueda.'}
          </p>
        ) : (
          <ul aria-label="Conjuros disponibles">
            {filtered.map((entry) => {
              const isSelected = selectedIds.has(entry.id);
              const disabled = !isSelected && isAtCap;
              return (
                <li key={entry.id}>
                  <div className="flex items-stretch">
                    <button
                      onClick={() => toggle(entry)}
                      aria-pressed={isSelected}
                      disabled={disabled}
                      title={disabled ? `Límite alcanzado (${currentCount}/${capCount})` : undefined}
                      className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-dnd-leather/20 ${
                        isSelected ? 'bg-dnd-gold/10' : ''
                      } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isSelected ? 'border-dnd-gold bg-dnd-gold text-dnd-ink' : 'border-dnd-leather/60'
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-dnd-text">{entry.title}</span>
                        <span className="block text-[10px] text-dnd-muted">
                          {entry.level === 0 ? 'Truco' : `Nivel ${entry.level}`} · {entry.school} ·{' '}
                          {entry.classes.join(', ')}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] text-dnd-muted">{entry.castingTime}</span>
                    </button>
                    <button
                      onClick={() => setViewing(entry)}
                      aria-label={`Ver descripción de ${entry.title}`}
                      title="Ver descripción"
                      className="flex w-9 shrink-0 items-center justify-center border-l border-dnd-leather/30 text-dnd-gold transition-colors hover:bg-dnd-gold/10"
                    >
                      <BookOpen size={14} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!picksNothing && filtered.length > 0 && (
        <p className="mt-1 text-[10px] text-dnd-muted">{filtered.length} resultados. Haz clic para añadir/quitar.</p>
      )}

      {/* Modal de descripción del conjuro/truco */}
      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={viewing?.title ?? ''}
        subtitle={viewing ? `${viewing.level === 0 ? 'Truco' : `Nivel ${viewing.level}`} · ${viewing.school} · ${viewing.classes.join(', ')}` : ''}
        maxWidth="lg"
      >
        {viewing && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-dnd-muted sm:grid-cols-3">
              <p><span className="font-bold text-dnd-text">Lanzamiento</span>: {viewing.castingTime}</p>
              <p><span className="font-bold text-dnd-text">Alcance</span>: {viewing.range}</p>
              <p><span className="font-bold text-dnd-text">Componentes</span>: {viewing.components}</p>
              <p><span className="font-bold text-dnd-text">Duración</span>: {viewing.duration}</p>
              <p><span className="font-bold text-dnd-text">Concentración</span>: {viewing.concentration ? 'Sí' : 'No'}</p>
              {viewing.ritual && <p><span className="font-bold text-dnd-text">Ritual</span>: Sí</p>}
            </div>
            <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-dnd-leather/30 p-3">
              <MarkdownPreview content={viewing.content} />
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
};