// ============================================================
// Barra de experiencia (XP) de un personaje del party
// ============================================================

import { ArrowUp, Star } from 'lucide-react';
import type { Player } from '../../types';
import { usePlayerStore } from '../../store/playerStore';
import {
  canLevelUp,
  MAX_LEVEL,
  xpForNextLevel,
  xpIntoLevel,
  xpNeededForNextLevel,
  xpProgress,
} from '../../utils/xp';

interface XpBarProps {
  player: Player;
}

/**
 * Acumulador de XP: barra que se llena según el nivel y permite subir de nivel
 * al superar el umbral del nivel siguiente.
 */
export const XpBar = ({ player }: XpBarProps) => {
  const levelUp = usePlayerStore((s) => s.levelUp);

  const level = player.level;
  const xp = player.xp ?? 0;
  const atMax = level >= MAX_LEVEL;
  const nextThreshold = atMax ? null : xpForNextLevel(level);
  const needed = atMax ? 0 : xpNeededForNextLevel(level);
  const intoLevel = atMax ? xp : xpIntoLevel(level, xp);
  const progress = xpProgress(level, xp);
  const ready = canLevelUp(level, xp);

  const remaining = atMax ? 0 : Math.max(0, nextThreshold! - xp);

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-dnd-gold/20 bg-dnd-ink/40 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-dnd-gold">
          <Star size={11} aria-hidden="true" /> Experiencia
        </span>
        <span className="text-[10px] text-dnd-muted">
          {xp.toLocaleString('es')} XP
        </span>
      </div>

      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full bg-dnd-leather/30"
        role="progressbar"
        aria-valuenow={atMax ? 100 : Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso de experiencia de ${player.name}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            ready ? 'bg-gradient-to-r from-dnd-gold to-emerald-400' : 'bg-gradient-to-r from-dnd-gold/70 to-dnd-gold'
          }`}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px]">
        {atMax ? (
          <span className="font-bold text-dnd-gold">Nivel máximo ({MAX_LEVEL}) alcanzado</span>
        ) : (
          <span className="text-dnd-muted">
            {intoLevel.toLocaleString('es')} / {needed.toLocaleString('es')} XP · Nv {level + 1}
          </span>
        )}
        {!atMax && remaining > 0 && (
          <span className="text-dnd-text">
            faltan <span className="font-bold text-dnd-gold">{remaining.toLocaleString('es')}</span>
          </span>
        )}
      </div>

      {!atMax && ready && (
        <button
          onClick={() => levelUp(player.id)}
          className="btn-primary flex items-center justify-center gap-1 text-[11px]"
          aria-label={`Subir a ${player.name} al nivel ${level + 1}`}
          title={`${player.name} ha acumulado suficiente XP para subir al nivel ${level + 1}`}
        >
          <ArrowUp size={12} aria-hidden="true" /> ¡Subir a nivel {level + 1}!
        </button>
      )}
    </div>
  );
};
