// ============================================================
// Barra de vida visual (HealthBar) reutilizable
// ============================================================

import { motion } from 'framer-motion';
import { hpColorClass, hpStatus } from '../../utils/combatUtils';
import type { Combatant } from '../../types';

interface HealthBarProps {
  hp: number;
  maxHp: number;
  tempHp?: number;
  isDead?: boolean;
  showLabel?: boolean;
  ariaLabel?: string;
}

/**
 * Barra de vida con color por porcentaje y tooltip nativo.
 */
export const HealthBar = ({
  hp,
  maxHp,
  tempHp = 0,
  isDead = false,
  showLabel = true,
  ariaLabel,
}: HealthBarProps) => {
  const total = maxHp + tempHp;
  const ratio = total > 0 ? Math.min(1, Math.max(0, (hp + tempHp) / (maxHp > 0 ? maxHp : 1))) : 0;
  const status = isDead ? 'Muerto' : hpStatus({ hp, maxHp, tempHp } as Combatant);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-dnd-text/80">
            {isDead ? 'PG' : status}
          </span>
          <span className="font-bold text-dnd-gold">
            {isDead ? 0 : hp}
            {tempHp > 0 && <span className="text-sky-400">+{tempHp}</span>}
            <span className="text-dnd-muted"> / {maxHp}</span>
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={ariaLabel ?? 'Puntos de golpe'}
        aria-valuenow={isDead ? 0 : hp}
        aria-valuemin={0}
        aria-valuemax={maxHp}
        title={`${hp}/${maxHp} PG${tempHp > 0 ? ` (+${tempHp} temp)` : ''}`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-dnd-ink/80"
      >
        <motion.div
          className={`h-full rounded-full ${hpColorClass(ratio)} transition-all`}
          initial={false}
          animate={{ width: `${Math.max(ratio * 100, isDead ? 0 : 2)}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        {tempHp > 0 && !isDead && (
          <motion.div
            className="h-full rounded-full bg-sky-500/80"
            initial={false}
            animate={{ width: `${Math.max(((hp + tempHp) / (maxHp > 0 ? maxHp : 1)) * 100, 2)}%` }}
          />
        )}
      </div>
      {tempHp > 0 && (
        <p className="mt-0.5 text-[10px] text-sky-400">+{tempHp} PG temporales</p>
      )}
    </div>
  );
};