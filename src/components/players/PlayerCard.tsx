// ============================================================
// Tarjeta compacta de jugador del party
// Muestra solo: PG, XP, características (stats) y habilidades.
// Clic en la tarjeta abre la ficha completa del personaje.
// ============================================================

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Edit, Trash2, ChevronRight } from 'lucide-react';
import type { Player } from '../../types';
import { HealthBar } from '../common/HealthBar';
import { abilityModifier } from '../../utils/diceUtils';
import { STAT_LABELS } from '../../types';
import { skillBonus } from '../../utils/skills';
import { XpBar } from './XpBar';

interface PlayerCardProps {
  player: Player;
  /** Abre la ficha completa del personaje (vista con pestañas). */
  onOpen: (player: Player) => void;
  onEdit: (player: Player) => void;
  onRemove: (id: string) => void;
}

/**
 * Tarjeta resumen compacta de un personaje jugador.
 */
export const PlayerCard = ({ player, onOpen, onEdit, onRemove }: PlayerCardProps) => {
  const [copied, setCopied] = useState(false);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const exportJSON = () => {
    const json = JSON.stringify(player, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    if (downloadRef.current) {
      downloadRef.current.href = url;
      downloadRef.current.download = `${player.name.replace(/\s+/g, '_')}.json`;
      downloadRef.current.click();
      URL.revokeObjectURL(url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const initials = player.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(player)}
      className="card group flex flex-col gap-3 hover:border-dnd-gold/60 hover:bg-dnd-dark/60 focus-within:border-dnd-gold/60 cursor-pointer"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(player);
        }
      }}
      aria-label={`Abrir ficha de ${player.name}`}
    >
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-dnd-gold/50 bg-gradient-to-b from-dnd-leather/50 to-dnd-ink font-fantasy text-base font-bold text-dnd-gold"
            aria-hidden="true"
          >
            {initials}
          </span>
          <div>
            <h3 className="font-fantasy text-lg font-bold text-dnd-text">{player.name}</h3>
            <p className="text-xs text-dnd-muted">
              {player.race ? `${player.race} · ` : ''}Nv {player.level} · {player.class}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(player);
            }}
            aria-label={`Editar a ${player.name}`}
            title="Editar"
            className="icon-btn hover:text-dnd-text"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              exportJSON();
            }}
            aria-label={`Exportar a ${player.name} como JSON`}
            title="Exportar JSON"
            className="icon-btn hover:text-dnd-gold"
          >
            <Download size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(player.id);
            }}
            aria-label={`Eliminar a ${player.name}`}
            title="Eliminar"
            className="rounded-lg p-1.5 text-dnd-muted hover:bg-dnd-blood/30 hover:text-red-300 focus:outline-none"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* PG */}
      <HealthBar hp={player.hp} maxHp={player.maxHp} ariaLabel={`Puntos de golpe de ${player.name}`} />

      {/* XP */}
      <XpBar player={player} />

      {/* Características */}
      <div className="grid grid-cols-3 gap-1">
        {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((key) => {
          const mod = abilityModifier(player.stats[key]);
          return (
            <div key={key} className="stat-box">
              <span className="text-[9px] text-dnd-muted">{STAT_LABELS[key]}</span>
              <span className="font-fantasy text-sm font-bold text-dnd-gold">
                {mod >= 0 ? `+${mod}` : mod}
              </span>
              <span className="text-[10px] text-dnd-muted">{player.stats[key]}</span>
            </div>
          );
        })}
      </div>

      {/* Habilidades con competencia */}
      {player.skills && player.skills.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] uppercase text-dnd-muted">
            Habilidades ({player.skills.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {[...player.skills]
              .sort((a, b) => a.localeCompare(b))
              .map((name) => {
                const bonus = skillBonus(player.stats, name, true, player.proficiencyBonus);
                return (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full border border-dnd-leather/40 bg-dnd-ink/50 px-2 py-0.5 text-[10px] text-dnd-text"
                  >
                    {name}
                    <span className="font-bold text-dnd-gold">{bonus >= 0 ? `+${bonus}` : bonus}</span>
                  </span>
                );
              })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-1 border-t border-dnd-leather/20 pt-2 text-xs font-bold text-dnd-gold">
        Ver ficha <ChevronRight size={14} aria-hidden="true" />
      </div>

      <a ref={downloadRef} className="hidden" aria-hidden="true" tabIndex={-1} />
      {copied && <p className="sr-only" role="status">Exportado como JSON</p>}
    </motion.article>
  );
};