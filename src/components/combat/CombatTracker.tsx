// ============================================================
// Tracker de combate principal: turnos, rondas y combatientes
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Maximize2,
  Minimize2,
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

  // Pantalla completa del módulo de combate.
  const combatRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void combatRef.current?.requestFullscreen();
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

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

  // Siguiente combatiente en el orden de turnos (para resaltarlo antes de pulsar «Siguiente»).
  const nextCombatant = useMemo(() => {
    if (!isActive || sorted.length === 0) return null;
    if (turn < 0) return sorted[0];
    return sorted[(turn + 1) % sorted.length];
  }, [isActive, turn, sorted]);

return (
    <div
      ref={combatRef}
      className="flex h-dvh min-h-0 flex-col gap-3 overflow-hidden p-2 md:p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex flex-wrap items-center justify-between gap-3 py-3"
      >
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="page-title flex items-center gap-2">
            <Swords size={22} aria-hidden="true" />
            Combate
          </h2>

          {/* Pantalla completa (asociada al mapa, lado izquierdo) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa del combate'}
            icon={isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          >
            <span className="hidden sm:inline">{isFullscreen ? 'Salir' : 'Pantalla completa'}</span>
          </Button>

          {isActive ? (
            <p className="truncate text-sm text-dnd-muted">
              Ronda <span className="text-lg font-bold text-dnd-text">{round}</span> · Turno{' '}
              {sorted.length > 0 ? (
                activeIndex >= 0 ? (
                  <span className="text-dnd-text">{activeCombatant?.name ?? '—'}</span>
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
          {/* Selector de vista */}
          <div
            className="flex items-center gap-0.5 rounded-lg bg-dnd-leather/30 p-0.5"
            role="group"
            aria-label="Vista de combate"
          >
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                view === 'list' ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                view === 'map' ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'
              }`}
            >
              Mapa
            </button>
          </div>

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

      {/* Barra de progreso del turno (compacta, arriba) */}
      {isActive && sorted.length > 0 && (
        <div
          className="card flex items-center gap-3 px-4 py-2"
          role="group"
          aria-label="Selección de turno por posiciones"
        >
          <span className="whitespace-nowrap text-[11px] uppercase text-dnd-muted">
            Turnos {activeIndex >= 0 ? `${activeIndex + 1} / ${sorted.length}` : '—'}
          </span>
          <div className="flex flex-1 gap-1">
            {sorted.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setTurn(i)}
                aria-label={`Saltar al turno de ${c.name}`}
                aria-current={i === activeIndex ? 'true' : undefined}
                className={`h-2.5 min-w-4 flex-1 rounded-full transition-all ${
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

      {/* Contenido principal: mapa/lista a la izquierda, registro a la derecha */}
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {view === 'list' ? (
            <div className="h-full overflow-y-auto pr-1">
              <InitiativeOrder
                participants={sorted}
                activeIndex={activeIndex}
                onReorder={reorderParticipants}
                onOpenActions={setSelected}
              />
            </div>
          ) : (
            <CombatMap
              participants={sorted}
              activeId={activeCombatant?.id}
              nextId={nextCombatant?.id}
              onOpenActions={setSelected}
              onMove={moveCombatant}
            />
          )}
        </div>
        <div className="hidden min-h-0 w-[19rem] shrink-0 flex-col md:flex">
          <CombatLog />
        </div>
      </div>

      {/* Modales */}
      <AddCombatantModal open={showAdd} onClose={() => setShowAdd(false)} />
      <CombatantActionsModal key={selected?.id ?? 'none'} combatant={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default CombatTracker;
