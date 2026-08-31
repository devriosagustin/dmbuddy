// ============================================================
// Biblioteca de monstruos con búsqueda y filtros
// ============================================================

import { useMemo, useState } from 'react';
import { Eye, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../common/Button';
import type { Monster } from '../../types';
import { crToXp } from '../../data/srdMonsters';
import { useCombatStore } from '../../store/combatStore';
import { useDice } from '../../hooks/useDice';
import { monsterToCombatant } from '../../utils/combatUtils';

interface MonsterLibraryProps {
  monsters: Monster[];
  onSelect: (monster: Monster) => void;
  onNew: () => void;
}

const TYPE_OPTIONS = [
  'Bestia', 'Humanoide (Goblinoid)', 'No-muerto', 'Humanoide (reptiliano)',
  'Humanoide (orco)', 'Monstruosidad', 'Humanoide (cualquier raza)', 'Otro',
];

/**
 * Vista de lista o grid de la biblioteca con filtros por tipo, CR y tamaño.
 */
export const MonsterLibrary = ({ monsters, onSelect, onNew }: MonsterLibraryProps) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [crFilter, setCrFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const addCombatant = useCombatStore((s) => s.addCombatant);
  const isActive = useCombatStore((s) => s.isActive);
  const initializeCombat = useCombatStore((s) => s.initializeCombat);
  const { roll } = useDice();

  const filtered = useMemo(() => {
    return monsters.filter((m) => {
      if (typeFilter !== 'all' && !m.type.includes(typeFilter)) return false;
      if (crFilter !== 'all' && String(m.challengeRating) !== crFilter) return false;
      if (sizeFilter !== 'all' && m.size !== sizeFilter) return false;
      if (!search.trim()) return true;
      return m.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [monsters, search, typeFilter, crFilter, sizeFilter]);

  const allTypes = useMemo(() => {
    return TYPE_OPTIONS.filter((t) => t !== 'Otro');
  }, []);

  const crOptions = useMemo(() => {
    const set = new Set(monsters.map((m) => m.challengeRating));
    return [...set].sort((a, b) => a - b);
  }, [monsters]);

  const quickAdd = (monster: Monster) => {
    if (!isActive) initializeCombat();
    const r = roll('d20');
    addCombatant(monsterToCombatant(monster, r.result));
  };

  const selectClass = 'select';

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="card flex flex-wrap items-center gap-2">
        <div className="relative min-w-40 flex-1">
          <label htmlFor="monster-lib-search" className="sr-only">Buscar monstruo</label>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dnd-muted" aria-hidden="true" />
          <input
            id="monster-lib-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
            className="input pl-9 text-sm"
          />
        </div>
        <label className="sr-only" htmlFor="filter-type">Filtrar por tipo</label>
        <select id="filter-type" className={selectClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">Todos los tipos</option>
          {allTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-cr">Filtrar por CR</label>
        <select id="filter-cr" className={selectClass} value={crFilter} onChange={(e) => setCrFilter(e.target.value)}>
          <option value="all">Todos los CR</option>
          {crOptions.map((cr) => (
            <option key={cr} value={String(cr)}>CR {cr}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="filter-size">Filtrar por tamaño</label>
        <select id="filter-size" className={selectClass} value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}>
          <option value="all">Todos los tamaños</option>
          {['Pequeño', 'Mediano', 'Grande', 'Enorme'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Vista */}
        <div className="flex items-center rounded-lg border border-dnd-leather/50 bg-dnd-ink/70" role="group" aria-label="Cambiar vista">
          <button
            onClick={() => setView('list')}
            aria-label="Ver en lista"
            aria-pressed={view === 'list'}
            className={`rounded-l-lg p-2 ${view === 'list' ? 'bg-dnd-gold/30 text-dnd-gold' : 'text-dnd-muted hover:text-dnd-text'}`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setView('grid')}
            aria-label="Ver en cuadrícula"
            aria-pressed={view === 'grid'}
            className={`rounded-r-lg p-2 ${view === 'grid' ? 'bg-dnd-gold/30 text-dnd-gold' : 'text-dnd-muted hover:text-dnd-text'}`}
          >
            <LayoutGrid size={16} />
          </button>
        </div>

        <Button variant="primary" size="sm" onClick={onNew} icon={<Plus size={14} />}>
          <span className="hidden sm:inline">Nuevo monstruo</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {/* Contador */}
      <p className="text-xs text-dnd-muted" role="status">
        {filtered.length} de {monsters.length} monstruos
      </p>

      {/* Lista / Grid */}
      {filtered.length === 0 && (
<div className="empty-state text-dnd-muted">
  <p>No se encontraron monstruos con esos filtros.</p>
</div>
      )}

      {view === 'list' ? (
        <div className="space-y-2" role="list" aria-label="Lista de monstruos">
          {filtered.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="list-row"
            >
              <button onClick={() => onSelect(m)} className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold rounded" aria-label={`Ver detalles de ${m.name}`}>
                <p className="truncate font-fantasy font-bold text-dnd-text">{m.name}</p>
                <p className="text-[11px] text-dnd-muted">
                  {m.size} · {m.type} · HP {m.hitPoints} · CA {m.armorClass}
                </p>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="badge border border-dnd-gold/40 text-dnd-gold">CR {m.challengeRating}</span>
                <Button variant="secondary" size="sm" onClick={() => quickAdd(m)}>Añadir</Button>
                <Button variant="ghost" size="sm" onClick={() => onSelect(m)} aria-label={`Ver detalle de ${m.name}`} icon={<Eye size={14} />} />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <motion.article
              key={m.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card flex flex-col justify-between gap-3 hover:border-dnd-gold/60"
            >
              <div>
                <div className="mb-1 flex items-start justify-between gap-2">
                  <button onClick={() => onSelect(m)} className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold rounded">
                    <h3 className="font-fantasy text-base font-bold text-dnd-text">{m.name}</h3>
                  </button>
                  <span className="badge shrink-0 border border-dnd-gold/40 text-dnd-gold">CR {m.challengeRating}</span>
                </div>
                <p className="mb-2 text-[11px] text-dnd-muted">
                  {m.size} · {m.type} · {m.alignment}
                </p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <p className="text-dnd-text/80"><span className="text-dnd-gold">PG:</span> {m.hitPoints}</p>
                  <p className="text-dnd-text/80"><span className="text-dnd-gold">CA:</span> {m.armorClass}</p>
                  <p className="text-dnd-text/80"><span className="text-dnd-gold">Vel:</span> {m.speed}</p>
                  <p className="text-dnd-text/80"><span className="text-dnd-gold">XP:</span> {crToXp(m.challengeRating)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => quickAdd(m)}>
                  Añadir al combate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onSelect(m)} aria-label={`Ver detalle de ${m.name}`} icon={<Eye size={14} />} />
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
};