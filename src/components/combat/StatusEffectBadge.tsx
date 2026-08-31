// ============================================================
// Insignia de estado/condición de un combatiente
// ============================================================

import type { StatusEffect } from '../../types';

interface StatusEffectBadgeProps {
  effect: StatusEffect;
  onRemove?: () => void;
}

const effectIcons: Record<string, string> = {
  Envenenado: '☠️',
  Paralizado: '🧊',
  Cegado: '🙈',
  Derribado: '🛐',
  Aturdido: '😵',
  Asustado: '😱',
  Apresado: '🪢',
};

/**
 * Muestra un estado con duración y opción de eliminarlo.
 */
export const StatusEffectBadge = ({ effect, onRemove }: StatusEffectBadgeProps) => {
  const icon = effectIcons[effect.name] ?? effect.icon ?? '🧷';

  return (
    <span
      title={effect.description}
      className="badge cursor-help border border-dnd-gold/40 bg-dnd-leather/30 text-dnd-text"
    >
      <span aria-hidden="true">{icon}</span>
      <span className="ml-1 mr-0.5">{effect.name}</span>
      {effect.duration !== -1 && (
        <span className="ml-1 rounded bg-dnd-ink/50 px-1 text-[10px]">
          {effect.duration}r
        </span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Quitar ${effect.name}${effect.duration !== -1 ? ` (${effect.duration} rondas)` : ''}`}
          className="ml-1 text-dnd-muted hover:text-dnd-blood focus:outline-none"
        >
          ×
        </button>
      )}
    </span>
  );
};