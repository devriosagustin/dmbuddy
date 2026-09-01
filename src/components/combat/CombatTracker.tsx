// ============================================================
// Tracker de combate principal: turnos, rondas y combatientes
// ============================================================

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Play,
  Plus,
  RotateCcw,
  Swords,
  UserPlus,
} from 'lucide-react';
import { Button } from '../common/Button';
import { InitiativeOrder } from './InitiativeOrder';
import { CombatMap } from './CombatMap';
import { CombatLog } from './CombatLog';
import { AddCombatantModal } from './AddCombatantModal';
import { CombatantActionsModal } from './CombatantActionsModal';
import { useCombatStore } from '../../store/combatStore';
import type { Combatant } from '../../types';

/**
 * Pantalla principal de gestión del combate.
 */
export const CombatTracker = () => {
  const {
    participants,
    turn,
    round,
    isActive,
    nextTurn,
    previousTurn,
    setTurn,
    reorderParticipants,
    moveCombatant,
    initializeCombat,
    resetCombat,
    endCombat,
    encounterCount,
  } = useCombatStore();

  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Combatant | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');

  // Ordenar por iniciativa (descendente)
  const sorted = useMemo(
    () => [...participants].sort((a, b) => b.initiative - a.initiative),
    [participants]
  );

  const activeIndex = useMemo(() => {
    if (!isActive || sorted.length === 0) return -1;
    return Math.min(turn, sorted.length - 1);
  }, [isActive, turn, sorted.length]);

  const activeCombatant = activeIndex >= 0 ? sorted[activeIndex] : null;

return (
    <div className="page">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Swords size={22} aria-hidden="true" />
            Combate
          </h2>
          {isActive ? (
            <p className="text-sm text-dnd-muted">
              Ronda <span className="text-lg font-bold text-dnd-text">{round}</span> · Turno{' '}
              {sorted.length > 0 ? (
                activeIndex >= 0 ? (
                  <span className="text-dnd-text">
                    {activeCombatant?.name ?? '—'}
                  </span>
                ) : (
                  <span className="text-dnd-muted">sin iniciar — pulsa «Siguiente»</span>
                )
              ) : (
                'sin combatientes'
              )}
            </p>
          ) : (
            <p className="text-sm text-dnd-muted">
              No hay un combate activo{encounterCount > 0 ? ` · ${encounterCount} encuentros realizados` : ''}
            </p>
          )}
        </div>

<div className="page-actions">
          {isActive ? (
            <>
              <Button variant="ghost" size="sm" onClick={previousTurn} aria-label="Turno anterior" icon={<ChevronLeft size={16} />}>
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={nextTurn}
                aria-label="Siguiente turno"
                icon={<ChevronRight size={16} />}
              >
                Siguiente
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={16} />}>
                Añadir
              </Button>
              <Button variant="danger" size="sm" onClick={endCombat} icon={<Flag size={16} />}>
                <span className="hidden sm:inline">Finalizar</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={resetCombat} aria-label="Reiniciar combate" icon={<RotateCcw size={16} />}>
                <span className="hidden sm:inline">Reiniciar</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                onClick={initializeCombat}
                icon={<Play size={16} />}
                aria-label="Iniciar combate"
              >
                Iniciar combate
              </Button>
              <Button variant="secondary" onClick={() => setShowAdd(true)} icon={<UserPlus size={16} />}>
                Añadir al prepararse
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Barra de progreso del turno */}
      {isActive && sorted.length > 0 && (
        <div
          className="card py-3"
          role="group"
          aria-label="Selección de turno por posiciones"
        >
          <div className="mb-2 flex items-center justify-between text-[11px] uppercase text-dnd-muted">
            <span>Turnos</span>
            <span>
              {activeIndex >= 0 ? `${activeIndex + 1} / ${sorted.length}` : '—'}
            </span>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {sorted.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setTurn(i)}
                aria-label={`Saltar al turno de ${c.name}`}
                aria-current={i === activeIndex ? 'true' : undefined}
                className={`h-2.5 min-w-6 flex-1 rounded-full transition-all ${
                  i === activeIndex
                    ? 'bg-dnd-gold shadow-dnd-glow'
                    : c.isDead
                      ? 'bg-red-900/70'
                      : 'bg-dnd-leather/40 hover:bg-dnd-leather/70'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Selector de vista */}
      <div className="flex items-center gap-1" role="group" aria-label="Vista de combate">
        <button
          onClick={() => setView('list')}
          aria-pressed={view === 'list'}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            view === 'list' ? 'bg-dnd-gold text-dnd-ink' : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          Lista
        </button>
        <button
          onClick={() => setView('map')}
          aria-pressed={view === 'map'}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
            view === 'map' ? 'bg-dnd-gold text-dnd-ink' : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          Mapa
        </button>
      </div>

      {/* Grid principal */}
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div>
          {view === 'list' ? (
            <InitiativeOrder
              participants={sorted}
              activeIndex={activeIndex}
              onReorder={reorderParticipants}
              onOpenActions={setSelected}
            />
          ) : (
            <CombatMap
              participants={sorted}
              activeId={activeCombatant?.id}
              onOpenActions={setSelected}
              onMove={moveCombatant}
            />
          )}
        </div>
        <CombatLog />
      </div>

      {/* Modales */}
      <AddCombatantModal open={showAdd} onClose={() => setShowAdd(false)} />
      <CombatantActionsModal key={selected?.id ?? 'none'} combatant={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default CombatTracker;
