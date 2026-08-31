// ============================================================
// Orden de iniciativa con drag & drop (@dnd-kit)
// ============================================================

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Combatant } from '../../types';
import { CombatantCard } from './CombatantCard';

interface InitiativeOrderProps {
  participants: Combatant[];
  activeIndex: number;
  onReorder: (ordered: Combatant[]) => void;
  onOpenActions: (combatant: Combatant) => void;
}

/**
 * Tarjeta individual arrastrable.
 */
const SortableCombatant = ({
  combatant,
  index,
  isTurn,
  onOpenActions,
}: {
  combatant: Combatant;
  index: number;
  isTurn: boolean;
  onOpenActions: (combatant: Combatant) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: combatant.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'relative z-30 opacity-90' : 'relative'}
      {...attributes}
      {...listeners}
    >
      <CombatantCard
        combatant={combatant}
        isActive={isTurn}
        rank={index}
        onOpenActions={onOpenActions}
      />
    </div>
  );
};

/**
 * Lista vertical de combatientes reordenable por drag & drop.
 */
export const InitiativeOrder = ({
  participants,
  activeIndex,
  onReorder,
  onOpenActions,
}: InitiativeOrderProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const [dragBegin, setDragBegin] = useState(false);

  const handleDragStart = () => setDragBegin(true);

  const handleDragEnd = (event: DragEndEvent) => {
    setDragBegin(false);
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id && over.id !== null) {
      const oldIndex = participants.findIndex((c) => c.id === active.id);
      const newIndex = participants.findIndex((c) => c.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(participants, oldIndex, newIndex));
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={participants.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2" role="list" aria-label="Orden de iniciativa">
          {participants.length === 0 && (
            <div className="rounded-dnd-lg border border-dashed border-dnd-leather/50 p-6 text-center text-sm text-dnd-muted">
              No hay combatientes. Añade monstruos o jugadores para comenzar la batalla.
            </div>
          )}
          {participants.map((combatant, index) => (
            <SortableCombatant
              key={combatant.id}
              combatant={combatant}
              index={index}
              isTurn={index === activeIndex}
              onOpenActions={onOpenActions}
            />
          ))}
        </div>
      </SortableContext>
      {dragBegin && (
        <p className="sr-only" role="status">
          Arrastrando combatiente
        </p>
      )}
    </DndContext>
  );
};