// ============================================================
// Ficha de monstruo (vista completa con pestañas, dentro del
// gestor de monstruos, sin modal). Alterna vista/edición.
// ============================================================

import { useState } from 'react';
import { ArrowLeft, BookOpen, Heart, Plus, Shield, Swords, Trash2 } from 'lucide-react';
import { Button } from '../common/Button';
import type { Monster } from '../../types';
import { STAT_LABELS } from '../../types';
import { crToXp } from '../../data/srdMonsters';
import { abilityModifier } from '../../utils/diceUtils';
import { useCombatStore } from '../../store/combatStore';
import { useDice } from '../../hooks/useDice';
import { monsterToCombatant } from '../../utils/combatUtils';
import { srdSpellByTitle } from '../../data/srd2024';
import { SrdDetailPanel } from '../reference/SrdDetailPanel';
import { MonsterForm } from './MonsterForm';

type Tab = 'stats' | 'actions' | 'traits' | 'spells';

const TABS: { id: Tab; label: string; icon?: string }[] = [
  { id: 'stats', label: 'Características', icon: '📊' },
  { id: 'actions', label: 'Acciones', icon: '⚔️' },
  { id: 'traits', label: 'Rasgos', icon: '🛡️' },
  { id: 'spells', label: 'Conjuros', icon: '✨' },
];

interface MonsterSheetProps {
  monster: Monster;
  /** Si es true, arranca directamente en modo edición. */
  initialEditable?: boolean;
  onBack: () => void;
  onDelete: (monster: Monster) => void;
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center rounded-lg border border-dnd-leather/40 bg-dnd-ink/50 px-2 py-1">
    <span className="text-[10px] text-dnd-muted">{label}</span>
    <span className="font-fantasy text-sm font-bold text-dnd-text">{value}</span>
    <span className="text-[10px] text-dnd-gold">{abilityModifier(value) >= 0 ? `+${abilityModifier(value)}` : abilityModifier(value)}</span>
  </div>
);

/**
 * Ficha de monstruo con pestañas y alternancia vista/edición.
 */
export const MonsterSheet = ({ monster, initialEditable, onBack, onDelete }: MonsterSheetProps) => {
  const addCombatant = useCombatStore((s) => s.addCombatant);
  const isActive = useCombatStore((s) => s.isActive);
  const initializeCombat = useCombatStore((s) => s.initializeCombat);
  const { roll } = useDice();

  const [editing, setEditing] = useState(initialEditable === true);
  const [tab, setTab] = useState<Tab>('stats');
  const [added, setAdded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openSpell, setOpenSpell] = useState<string | null>(null);

  const openSpellEntry = openSpell ? (srdSpellByTitle(openSpell) ?? null) : null;

  const handleAdd = () => {
    if (!isActive) initializeCombat();
    const inits = roll('d20');
    addCombatant(monsterToCombatant(monster, inits.result));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleDelete = () => {
    onDelete(monster);
    setConfirmDelete(false);
  };

  if (editing) {
    return (
      <div className="page">
        <div className="page-header">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} icon={<ArrowLeft size={15} />}>
            Cancelar edición
          </Button>
          <div />
        </div>
        <MonsterForm inline monster={monster} onClose={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft size={15} />} aria-label="Volver a la biblioteca de monstruos">
          Volver
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {confirmDelete ? (
            <div className="flex items-center gap-2 rounded-lg border border-dnd-blood/50 bg-dnd-blood/10 px-3 py-1.5">
              <span className="text-xs text-red-200">¿Eliminar {monster.name}?</span>
              <Button variant="danger" size="sm" onClick={handleDelete}>Sí</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>No</Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} icon={<Trash2 size={14} />}>
              Eliminar
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)} icon={<BookOpen size={15} />}>
            Editar
          </Button>
          <Button variant="primary" size="sm" onClick={handleAdd} icon={<Plus size={16} />} disabled={added}>
            {added ? '¡Añadido!' : 'Añadir al combate'}
          </Button>
        </div>
      </div>

      <div className="page-title">{monster.name}</div>
      <p className="text-sm text-dnd-muted">
        {monster.size} · {monster.type} · {monster.alignment}
        {monster.custom ? ' · Monstruo propio (editable)' : ' · SRD 5.2'}
      </p>

      {/* Pestañas */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Secciones de la ficha">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === id ? 'bg-dnd-gold text-dnd-ink' : 'border border-dnd-leather/50 text-dnd-text/70 hover:bg-dnd-leather/20'
            }`}
          >
            {icon && <span className="mr-1" aria-hidden="true">{icon}</span>}{label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'stats' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="badge border border-dnd-gold/50 bg-dnd-gold/15 text-dnd-gold">CR {monster.challengeRating}</span>
              <span className="badge border border-dnd-leather/50 bg-dnd-ink/60 text-dnd-text">XP {crToXp(monster.challengeRating)}</span>
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

            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => (
                <Stat key={key} label={STAT_LABELS[key]} value={monster.stats[key]} />
              ))}
            </div>

            <div className="grid gap-1.5 text-sm sm:grid-cols-2">
              <p><span className="text-dnd-gold">Dados de golpe:</span> {monster.hitDice}</p>
              <p><span className="text-dnd-gold">Sentidos:</span> {monster.senses}</p>
              <p className="sm:col-span-2"><span className="text-dnd-gold">Idiomas:</span> {monster.languages}</p>
              {Object.keys(monster.skills).length > 0 && (
                <p className="sm:col-span-2">
                  <span className="text-dnd-gold">Habilidades:</span>{' '}
                  {Object.entries(monster.skills).map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v}`).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'actions' && (
          monster.actions.length === 0 ? (
            <p className="text-sm text-dnd-muted">Este monstruo no tiene acciones definidas.</p>
          ) : (
            <div className="space-y-2">
              {monster.actions.map((action) => (
                <div key={action.name} className="rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/30 p-2.5">
                  <p className="text-sm font-bold text-dnd-text">
                    {action.name}
                    {action.attackBonus !== undefined && <span className="ml-2 text-xs text-sky-300">+{action.attackBonus} al ataque</span>}
                    {action.damage && <span className="ml-2 text-xs text-red-300">{action.damage} {action.damageType}</span>}
                  </p>
                  <p className="text-xs text-dnd-text/80">{action.description}</p>
                  {action.range && <p className="text-[10px] text-dnd-muted">Alcance: {action.range}</p>}
                </div>
              ))}
              {monster.legendaryActions && monster.legendaryActions.length > 0 && (
                <div>
                  <h3 className="mb-2 mt-4 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">👑 Acciones legendarias</h3>
                  {monster.legendaryActions.map((action) => (
                    <div key={action.name} className="rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/30 p-2.5">
                      <p className="text-sm font-bold text-dnd-text">{action.name}</p>
                      <p className="text-xs text-dnd-text/80">{action.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {tab === 'traits' && (
          monster.traits.length === 0 ? (
            <p className="text-sm text-dnd-muted">Este monstruo no tiene rasgos.</p>
          ) : (
            <div className="space-y-2">
              {monster.traits.map((trait) => (
                <div key={trait.name} className="rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/30 p-2.5">
                  <p className="text-sm font-bold italic text-dnd-text">{trait.name}.</p>
                  <p className="text-xs text-dnd-text/80">{trait.description}</p>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'spells' && (
          monster.spellcasting ? (
            <div className="rounded-dnd-lg border border-dnd-gold/30 bg-dnd-gold/5 p-3">
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
            </div>
          ) : (
            <p className="text-sm text-dnd-muted">Este monstruo no lanza conjuros.</p>
          )
        )}
      </div>

      <SrdDetailPanel entry={openSpellEntry} onClose={() => setOpenSpell(null)} />
    </div>
  );
};

export default MonsterSheet;