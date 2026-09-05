// ============================================================
// Tracker de combate (solo lista): turnos, rondas y combatientes.
// El mapa de la escena vive en la pestaña «Mapa»; aquí se gestiona
// el encuentro activo con la lista de iniciativa y sus acciones.
// ============================================================

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Dices,
  Flag,
  Map as MapIcon,
  Play,
  Plus,
  RotateCcw,
  Swords,
  UserPlus,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { InitiativeOrder } from './InitiativeOrder';
import { CombatLog } from './CombatLog';
import { AddCombatantModal } from './AddCombatantModal';
import { CombatantActionsModal } from './CombatantActionsModal';
import { DiceRoller } from '../dice/DiceRoller';
import { useCombatStore } from '../../store/combatStore';
import type { Combatant } from '../../types';

/**
 * Pantalla principal de gestión del combate (lista de iniciativa).
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
    initializeCombat,
    resetCombat,
    endCombat,
    encounterCount,
  } = useCombatStore();

  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Combatant | null>(null);
  const [showDice, setShowDice] = useState(false);

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
    <div className="flex h-dvh min-h-0 flex-col gap-3 overflow-hidden p-2 md:p-4">
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
          <Link
            to="/map"
            className="flex items-center gap-1 rounded-lg border border-dnd-leather/40 px-2.5 py-1 text-xs font-bold text-dnd-muted transition-colors hover:border-dnd-gold/50 hover:text-dnd-gold"
          >
            <MapIcon size={14} /> Mapa
          </Link>
          <button
            type="button"
            onClick={() => setShowDice(true)}
            className="flex items-center gap-1 rounded-lg border border-dnd-leather/40 px-2.5 py-1 text-xs font-bold text-dnd-muted transition-colors hover:border-dnd-gold/50 hover:text-dnd-gold"
          >
            <Dices size={14} /> Dados
          </button>

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
              No hay un encuentro activo. Inícialo desde el{' '}
              <Link to="/map" className="font-bold text-dnd-gold hover:underline">Mapa</Link>
              {encounterCount > 0 ? ` · ${encounterCount} encuentro(s) realizados` : ''}.
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
              <Button variant="primary" onClick={initializeCombat} icon={<Play size={16} />} aria-label="Iniciar combate">
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

      {/* Contenido principal: lista de iniciativa a la izquierda, registro a la derecha */}
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="h-full overflow-y-auto pr-1">
            <InitiativeOrder
              participants={sorted}
              activeIndex={activeIndex}
              onReorder={reorderParticipants}
              onOpenActions={setSelected}
            />
          </div>
        </div>
        <div className="relative z-[60] hidden min-h-0 w-[19rem] shrink-0 flex-col md:flex">
          <CombatLog />
        </div>
      </div>

      {/* Modales */}
      <AddCombatantModal open={showAdd} onClose={() => setShowAdd(false)} />
      <CombatantActionsModal key={selected?.id ?? 'none'} combatant={selected} onClose={() => setSelected(null)} />
      <Modal open={showDice} onClose={() => setShowDice(false)} maxWidth="2xl">
        <DiceRoller />
      </Modal>
    </div>
  );
};

export default CombatTracker;