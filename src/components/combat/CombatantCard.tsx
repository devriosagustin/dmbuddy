// ============================================================
// Tarjeta individual de combatiente con acciones rápidas
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Skull, Star } from 'lucide-react';
import type { Combatant } from '../../types';
import { STAT_LABELS } from '../../types';
import { HealthBar } from '../common/HealthBar';
import { StatusEffectBadge } from './StatusEffectBadge';
import { useCombatStore } from '../../store/combatStore';
import { hpStatus } from '../../utils/combatUtils';
import { abilityModifier } from '../../utils/diceUtils';
import { srdWeaponById } from '../../data/srd2024';
import { weaponAttackBonus, weaponDamageFormula } from '../../utils/weaponUtils';
import { SpellSlotsPanel } from '../players/SpellSlotsPanel';

interface CombatantCardProps {
  combatant: Combatant;
  isActive: boolean;
  onOpenActions: (combatant: Combatant) => void;
  rank: number;
}

/**
 * Tarjeta de combatiente: HP editable, AC, iniciativa, estados y acciones.
 * Doble clic en el HP abre un input para modificar.
 */
export const CombatantCard = ({ combatant, isActive, onOpenActions, rank }: CombatantCardProps) => {
  const { updateHP, removeCombatant, setAC, removeStatusEffect } = useCombatStore();
  const [editingPhase, setEditingPhase] = useState<'hp' | 'ac' | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (phase: 'hp' | 'ac') => {
    setEditingPhase(phase);
    setEditValue(phase === 'hp' ? String(combatant.hp) : String(combatant.armorClass));
  };

  const commitEdit = () => {
    const value = Number(editValue);
    if (!isNaN(value) && editingPhase) {
      if (editingPhase === 'hp') {
        // Fijar HP absoluto
        useCombatStore.setState((s) => ({
          participants: s.participants.map((p) =>
            p.id === combatant.id
              ? { ...p, hp: Math.max(0, Math.min(p.maxHp, value)), isDead: value <= 0 }
              : p
          ),
        }));
      } else if (editingPhase === 'ac') {
        setAC(combatant.id, value);
      }
    }
    setEditingPhase(null);
  };

  const heal = (amount: number) => updateHP(combatant.id, amount, false);

  const pStats = combatant.playerStats;
  const weapons = (combatant.weaponIds ?? [])
    .map((id) => srdWeaponById(id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      data-testid="combatant-card"
      className={`group relative cursor-pointer rounded-dnd-lg border-2 bg-dnd-dark/90 p-3 shadow-dnd-card transition-all ${
        isActive
          ? 'combatant-active border-dnd-gold'
          : 'border-dnd-leather/50 hover:border-dnd-gold/60'
      } ${combatant.isDead ? 'opacity-50 grayscale' : ''}`}
      onClick={() => onOpenActions(combatant)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenActions(combatant);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${combatant.name}, iniciativa ${combatant.initiative}, ${hpStatus(combatant)}`}
    >
      {/* Encabezado */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
              combatant.type === 'player'
                ? 'bg-emerald-900/70 text-emerald-300'
                : fightBadgeClass(rank)
            }`}
            aria-hidden="true"
          >
            {combatant.type === 'player' ? 'PJ' : rank + 1}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-fantasy text-sm font-bold text-dnd-text">
              {combatant.name}
            </h3>
            <span className="badge text-[10px] text-dnd-muted">
              {combatant.type === 'player' ? 'Jugador' : 'Monstruo'}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* Iniciativa (editable desde el detalle) */}
          <span
            className="badge border border-dnd-gold/40 bg-dnd-ink/60 text-dnd-gold"
            title={`Iniciativa: ${combatant.initiative}`}
          >
            🎲 {combatant.initiative}
          </span>
          {/* Botón eliminar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeCombatant(combatant.id);
            }}
            aria-label={`Eliminar a ${combatant.name}`}
            className="rounded p-1 text-dnd-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-dnd-blood/30 hover:text-red-300 focus:opacity-100"
          >
            <Skull size={14} />
          </button>
        </div>
      </div>

      {/* HP con edición por doble clic */}
      <div className="mb-2">
        {editingPhase === 'hp' ? (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setEditingPhase(null);
            }}
            className="input mb-1 text-sm"
            aria-label="Nuevo valor de Puntos de Golpe"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            onDoubleClick={(e) => {
              e.stopPropagation();
              startEdit('hp');
            }}
            title="Doble clic para introducir PG exactos"
          >
            <HealthBar
              hp={combatant.hp}
              maxHp={combatant.maxHp}
              tempHp={combatant.tempHp}
              isDead={combatant.isDead}
              ariaLabel={`Puntos de golpe de ${combatant.name}`}
            />
          </div>
        )}

        {/* Botones rápidos de HP y AC */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => updateHP(combatant.id, 1, true)}
            aria-label={`Restar 1 PG a ${combatant.name}`}
            className="rounded bg-dnd-blood/50 px-1.5 py-0.5 text-xs font-bold text-red-200 hover:bg-dnd-blood"
          >
            -1
          </button>
          <button
            onClick={() => updateHP(combatant.id, 5, true)}
            aria-label={`Restar 5 PG a ${combatant.name}`}
            className="rounded bg-dnd-blood/50 px-1.5 py-0.5 text-xs font-bold text-red-200 hover:bg-dnd-blood"
          >
            -5
          </button>
          <button
            onClick={() => heal(1)}
            aria-label={`Sumar 1 PG a ${combatant.name}`}
            className="rounded bg-emerald-900/60 px-1.5 py-0.5 text-xs font-bold text-emerald-300 hover:bg-emerald-800"
          >
            +1
          </button>
          <button
            onClick={() => heal(5)}
            aria-label={`Sumar 5 PG a ${combatant.name}`}
            className="rounded bg-emerald-900/60 px-1.5 py-0.5 text-xs font-bold text-emerald-300 hover:bg-emerald-800"
          >
            +5
          </button>

          {/* AC editable por doble clic */}
          {editingPhase === 'ac' ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') setEditingPhase(null);
              }}
              className="input w-16 text-sm"
              aria-label="Nuevo valor de Clase de Armadura"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEdit('ac');
              }}
              title="Doble clic para editar AC"
              aria-label={`Clase de Armadura de ${combatant.name}: ${combatant.armorClass}. Doble clic para editar.`}
              className="badge border border-sky-500/40 bg-dnd-ink/60 text-sky-300 hover:border-sky-400"
            >
              🛡️ AC {combatant.armorClass}
            </button>
          )}
        </div>
      </div>

      {/* Características del jugador */}
      {combatant.type === 'player' && pStats && (
        <div
          className="mb-1.5 grid grid-cols-6 gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((key) => {
            const mod = abilityModifier(pStats[key]);
            return (
              <div key={key} className="flex flex-col items-center rounded bg-dnd-ink/40 py-0.5">
                <span className="text-[8px] text-dnd-muted">{STAT_LABELS[key]}</span>
                <span className="text-[10px] font-bold text-dnd-gold">
                  {mod >= 0 ? `+${mod}` : mod}
                </span>
                <span className="text-[8px] text-dnd-muted">{pStats[key]}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Armas equipadas */}
      {weapons.length > 0 && (
        <div
          className="mb-1.5 flex flex-col gap-0.5 rounded-lg border border-dnd-leather/30 bg-dnd-ink/40 p-1.5 text-[10px]"
          onClick={(e) => e.stopPropagation()}
        >
          {weapons.map((wpn) => {
            const atk = pStats ? weaponAttackBonus(wpn, pStats, combatant.playerProficiencyBonus ?? 2) : 0;
            const dmg = pStats ? weaponDamageFormula(wpn, pStats) : wpn.damage;
            return (
              <p key={wpn.id} className="truncate">
                <span className="font-bold text-dnd-gold">⚔️ {wpn.name}</span>{' '}
                <span className="text-dnd-muted">· {wpn.damage} {wpn.damageType}</span>{' '}
                <span className="text-dnd-text">
                  +{atk} · <span className="font-bold">{dmg}</span>
                </span>
              </p>
            );
          })}
        </div>
      )}

      {/* Estados */}
      {combatant.statusEffects.length > 0 && (
        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          {combatant.statusEffects.map((effect) => (
            <StatusEffectBadge
              key={effect.id}
              effect={effect}
              onRemove={() => removeStatusEffect(combatant.id, effect.id)}
            />
          ))}
        </div>
      )}

      {/* Espacios de conjuro del jugador (vista activa del combate) */}
      {combatant.type === 'player' && combatant.playerId && (
        <div onClick={(e) => e.stopPropagation()}>
          <SpellSlotsPanel playerId={combatant.playerId} />
        </div>
      )}

      {/* Indicador de turno */}
      {isActive && (
        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold uppercase text-dnd-gold">
          <Star size={12} aria-hidden="true" />
          Turno actual
        </div>
      )}

      {combatant.isDead && <span className="sr-only">Muerto</span>}
    </motion.article>
  );
};

// Clases de medalla según la posición en el orden de iniciativa
function fightBadgeClass(rank: number): string {
  if (rank === 0) return 'bg-dnd-gold/80 text-dnd-ink';
  if (rank === 1) return 'bg-slate-400/80 text-dnd-ink';
  if (rank === 2) return 'bg-orange-800/80 text-orange-100';
  return 'bg-dnd-leather/60 text-dnd-text';
}