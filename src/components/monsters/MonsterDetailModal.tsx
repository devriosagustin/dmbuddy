// ============================================================
// Modal de detalle completo de un monstruo
// ============================================================

import { useState } from 'react';
import { BookOpen, Plus, Swords, Shield, Heart, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Monster } from '../../types';
import { crToXp } from '../../data/srdMonsters';
import { abilityModifier } from '../../utils/diceUtils';
import { useCombatStore } from '../../store/combatStore';
import { useDice } from '../../hooks/useDice';
import { monsterToCombatant } from '../../utils/combatUtils';
import { srdSpellByTitle } from '../../data/srd2024';
import { SrdDetailPanel } from '../reference/SrdDetailPanel';
import { STAT_LABELS } from '../../types';

interface MonsterDetailModalProps {
  monster: Monster | null;
  onClose: () => void;
  onEdit?: (monster: Monster) => void;
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center rounded-lg border border-dnd-leather/40 bg-dnd-ink/50 px-2 py-1">
    <span className="text-[10px] text-dnd-muted">{label}</span>
    <span className="font-fantasy text-sm font-bold text-dnd-text">{value}</span>
    <span className="text-[10px] text-dnd-gold">{abilityModifier(value) >= 0 ? `+${abilityModifier(value)}` : abilityModifier(value)}</span>
  </div>
);

/**
 * Detalle completo: stats, acciones, rasgos y botón de añadir al combate.
 */
export const MonsterDetailModal = ({ monster, onClose, onEdit }: MonsterDetailModalProps) => {
  const addCombatant = useCombatStore((s) => s.addCombatant);
  const isActive = useCombatStore((s) => s.isActive);
  const initializeCombat = useCombatStore((s) => s.initializeCombat);
  const { roll } = useDice();
  const [added, setAdded] = useState(false);
  const [openSpell, setOpenSpell] = useState<string | null>(null);

  if (!monster) return null;

  const openSpellEntry = openSpell ? (srdSpellByTitle(openSpell) ?? null) : null;

  const handleAdd = () => {
    if (!isActive) initializeCombat();
    const inits = roll('d20');
    addCombatant(monsterToCombatant(monster, inits.result));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <>
      <Modal
        open={!!monster}
        onClose={onClose}
        title={monster.name}
        subtitle={`${monster.size} · ${monster.type} · ${monster.alignment}`}
        maxWidth="xl"
      >
      <div className="space-y-4">
        {/* Chip de CR y XP */}
        <div className="flex flex-wrap gap-2">
          <span className="badge border border-dnd-gold/50 bg-dnd-gold/15 text-dnd-gold">
            CR {monster.challengeRating}
          </span>
          <span className="badge border border-dnd-leather/50 bg-dnd-ink/60 text-dnd-text">
            XP {crToXp(monster.challengeRating)}
          </span>
          <span className="badge border border-dnd-leather/50 bg-dnd-ink/60 text-dnd-text">
            <Heart size={12} className="mr-1 text-red-400" aria-hidden="true" /> PG {monster.hitPoints}
          </span>
          <span className="badge border border-dnd-leather/50 bg-dnd-ink/60 text-dnd-text">
            <Shield size={12} className="mr-1 text-sky-400" aria-hidden="true" /> CA {monster.armorClass}
          </span>
          <span className="badge border border-dnd-leather/50 bg-dnd-ink/60 text-dnd-text">
            <Swords size={12} className="mr-1 text-dnd-gold" aria-hidden="true" /> Vel. {monster.speed}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
          {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => (
            <Stat key={key} label={STAT_LABELS[key]} value={monster.stats[key]} />
          ))}
        </div>

        {/* Info básica */}
        <div className="grid gap-1.5 text-sm sm:grid-cols-2">
          <p><span className="text-dnd-gold">Dados de golpe:</span> {monster.hitDice}</p>
          <p><span className="text-dnd-gold">Sentidos:</span> {monster.senses}</p>
          <p className="sm:col-span-2"><span className="text-dnd-gold">Idiomas:</span> {monster.languages}</p>
          {Object.keys(monster.skills).length > 0 && (
            <p className="sm:col-span-2">
              <span className="text-dnd-gold">Habilidades:</span>{' '}
              {Object.entries(monster.skills)
                .map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v}`)
                .join(', ')}
            </p>
          )}
        </div>

        {/* Rasgos */}
        {monster.traits.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              <Sparkles size={14} aria-hidden="true" /> Rasgos
            </h3>
            <div className="space-y-2">
              {monster.traits.map((trait) => (
                <div key={trait.name} className="rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/30 p-2.5">
                  <p className="text-sm font-bold italic text-dnd-text">{trait.name}.</p>
                  <p className="text-xs text-dnd-text/80">{trait.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Acciones */}
        {monster.actions.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              <Swords size={14} aria-hidden="true" /> Acciones
            </h3>
            <div className="space-y-2">
              {monster.actions.map((action) => (
                <div key={action.name} className="rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/30 p-2.5">
                  <p className="text-sm font-bold text-dnd-text">
                    {action.name}
                    {action.attackBonus !== undefined && (
                      <span className="ml-2 text-xs text-sky-300">+{action.attackBonus} al ataque</span>
                    )}
                    {action.damage && (
                      <span className="ml-2 text-xs text-red-300">{action.damage} {action.damageType}</span>
                    )}
                  </p>
                  <p className="text-xs text-dnd-text/80">{action.description}</p>
                  {action.range && <p className="text-[10px] text-dnd-muted">Alcance: {action.range}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Acciones legendarias y conjuros por brevedad */}
        {monster.legendaryActions && monster.legendaryActions.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              👑 Acciones legendarias
            </h3>
            <div className="space-y-2">
              {monster.legendaryActions.map((action) => (
                <div key={action.name} className="rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/30 p-2.5">
                  <p className="text-sm font-bold text-dnd-text">{action.name}</p>
                  <p className="text-xs text-dnd-text/80">{action.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {monster.spellcasting && (
          <section className="rounded-dnd-lg border border-dnd-gold/30 bg-dnd-gold/5 p-3">
            <h3 className="text-xs font-bold uppercase text-dnd-gold">Conjuros ({monster.spellcasting.ability})</h3>
            <p className="text-xs text-dnd-muted">
              CD de salvación {monster.spellcasting.spellSaveDC} · Ataque +{monster.spellcasting.spellAttackBonus}
            </p>
            {Object.entries(monster.spellcasting.spellbook).map(([level, spells]) => (
              <p key={level} className="mt-1 text-xs leading-relaxed text-dnd-text/80">
                <span className="font-bold text-dnd-gold">{level}:</span>{' '}
                {(spells as string[]).map((name) => {
                  const found = !!srdSpellByTitle(name);
                  return found ? (
                    <button
                      key={name}
                      onClick={() => setOpenSpell(name)}
                      title={`Ver detalle de ${name}`}
                      className="mr-1 inline-flex items-center gap-0.5 rounded px-0.5 text-dnd-text transition-colors hover:bg-dnd-gold/15 hover:text-dnd-gold"
                    >
                      <BookOpen size={9} className="text-dnd-gold" aria-hidden="true" />
                      {name}
                    </button>
                  ) : (
                    <span key={name} className="mr-1">{name}</span>
                  );
                })}
              </p>
            ))}
          </section>
        )}

        {/* Acciones finales */}
        <div className="flex justify-end gap-2 border-t border-dnd-leather/30 pt-3">
          {monster.custom && onEdit && (
            <Button variant="secondary" onClick={() => onEdit(monster)}>
              Editar
            </Button>
          )}
          <Button variant="primary" onClick={handleAdd} icon={<Plus size={16} />} disabled={added}>
            {added ? '¡Añadido!' : 'Añadir al combate'}
          </Button>
        </div>
      </div>
      </Modal>

      <SrdDetailPanel entry={openSpellEntry} onClose={() => setOpenSpell(null)} />
    </>
  );
};