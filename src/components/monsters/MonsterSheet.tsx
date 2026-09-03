// ============================================================
// Ficha de monstruo (vista completa con pestañas, dentro del
// gestor de monstruos, sin modal). Alterna vista/edición en el
// mismo formato, igual que la ficha de personaje (CharacterSheet).
// ============================================================

import { useState } from 'react';
import { ArrowLeft, BookOpen, Heart, Plus, Save, Shield, Sparkles, Swords, Trash2, X } from 'lucide-react';
import { Button } from '../common/Button';
import { useMonsterStore } from '../../store/monsterStore';
import type { Monster, MonsterAction, MonsterTrait, Spellcasting } from '../../types';
import { STAT_LABELS } from '../../types';
import { crToXp } from '../../data/srdMonsters';
import { abilityModifier } from '../../utils/diceUtils';
import { useCombatStore } from '../../store/combatStore';
import { useDice } from '../../hooks/useDice';
import { monsterToCombatant } from '../../utils/combatUtils';
import { srdSpellByTitle } from '../../data/srd2024';
import { SrdDetailPanel } from '../reference/SrdDetailPanel';

type Tab = 'stats' | 'actions' | 'traits' | 'spells';

const TABS: { id: Tab; label: string; icon?: string }[] = [
  { id: 'stats', label: 'Características', icon: '📊' },
  { id: 'actions', label: 'Acciones', icon: '⚔️' },
  { id: 'traits', label: 'Rasgos', icon: '🛡️' },
  { id: 'spells', label: 'Conjuros', icon: '✨' },
];

interface MonsterSheetProps {
  /** Monstruo a consultar/editar. null = creación de uno nuevo. */
  monster: Monster | null;
  initialMode?: 'view' | 'edit';
  /** Volver a la biblioteca. */
  onBack: () => void;
}

const EMPTY_ACTION: MonsterAction = { name: '', description: '', damage: '', damageType: '', target: 'Una criatura' };
const EMPTY_TRAIT: MonsterTrait = { name: '', description: '' };

const EMPTY_MONSTER: Monster = {
  id: '',
  name: '',
  type: 'Monstruosidad',
  size: 'Mediano',
  alignment: 'No alineado',
  armorClass: 10,
  hitPoints: 20,
  hitDice: '4d8',
  speed: '30 ft',
  stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  skills: {},
  senses: 'Percepción pasiva 10',
  languages: '—',
  challengeRating: 1,
  traits: [],
  actions: [{ ...EMPTY_ACTION }],
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center rounded-lg border border-dnd-leather/40 bg-dnd-ink/50 px-2 py-1">
    <span className="text-[10px] text-dnd-muted">{label}</span>
    <span className="font-fantasy text-sm font-bold text-dnd-text">{value}</span>
    <span className="text-[10px] text-dnd-gold">{abilityModifier(value) >= 0 ? `+${abilityModifier(value)}` : abilityModifier(value)}</span>
  </div>
);

/**
 * Ficha de monstruo con pestañas y alternancia vista/edición (sin modal).
 */
export const MonsterSheet = ({ monster, initialMode, onBack }: MonsterSheetProps) => {
  const { addMonster, updateMonster } = useMonsterStore();
  const addCombatant = useCombatStore((s) => s.addCombatant);
  const isActive = useCombatStore((s) => s.isActive);
  const initializeCombat = useCombatStore((s) => s.initializeCombat);
  const { roll } = useDice();

  const isNew = !monster;
  const [mode, setMode] = useState<'view' | 'edit'>(isNew ? 'edit' : initialMode === 'edit' ? 'edit' : 'view');
  const [tab, setTab] = useState<Tab>('stats');

  const [added, setAdded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [openSpell, setOpenSpell] = useState<string | null>(null);

  const [form, setForm] = useState<Monster>(monster ?? EMPTY_MONSTER);
  const setField = <K extends keyof Monster>(key: K, value: Monster[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setStat = (key: keyof Monster['stats'], value: number) => setForm((f) => ({ ...f, stats: { ...f.stats, [key]: value } }));
  const updateAction = (index: number, patch: Partial<MonsterAction>) =>
    setForm((f) => ({ ...f, actions: f.actions.map((a, i) => (i === index ? { ...a, ...patch } : a)) }));
  const updateTrait = (index: number, patch: Partial<MonsterTrait>) =>
    setForm((f) => ({ ...f, traits: f.traits.map((t, i) => (i === index ? { ...t, ...patch } : t)) }));

  const openSpellEntry = openSpell ? (srdSpellByTitle(openSpell) ?? null) : null;
  const input = 'input text-sm';

  const onChangeSpellcasting = (patch: Partial<Spellcasting>) => {
    setForm((f) =>
      f.spellcasting
        ? { ...f, spellcasting: { ...f.spellcasting, ...patch, level: (f.spellcasting.level ?? 0) as number } }
        : f
    );
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      alert('Por favor completa al menos el nombre.');
      return;
    }
    const cleaned: Monster = {
      ...form,
      name: form.name.trim(),
      custom: true,
      actions: form.actions.filter((a) => a.name.trim() !== ''),
      traits: form.traits.filter((t) => t.name.trim() !== ''),
    };
    if (monster) {
      updateMonster(monster.id, cleaned);
      setMode('view');
    } else {
      addMonster(cleaned);
      onBack();
    }
  };

  const handleDelete = () => {
    if (!monster) return;
    useMonsterStore.getState().removeMonster(monster.id);
    onBack();
  };

  const handleAdd = () => {
    if (!monster) return;
    if (!isActive) initializeCombat();
    const inits = roll('d20');
    addCombatant(monsterToCombatant(monster, inits.result));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const displayMonster = isNew ? form : monster;

  // ===================== PESTAÑA: CARACTERÍSTICAS =====================
  const renderStats = () => {
    if (mode === 'view') {
      const m = monster!;
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="badge border border-dnd-gold/50 bg-dnd-gold/15 text-dnd-gold">CR {m.challengeRating}</span>
            <span className="badge border border-dnd-leather/50 bg-dnd-ink/60 text-dnd-text">XP {crToXp(m.challengeRating)}</span>
            <span className="badge border border-dnd-leather/50 bg-dnd-ink/60 text-dnd-text">
              <Heart size={12} className="mr-1 text-red-400" aria-hidden="true" /> PG {m.hitPoints}
            </span>
            <span className="badge border border-dnd-leather/50 bg-dnd-ink/60 text-dnd-text">
              <Shield size={12} className="mr-1 text-sky-400" aria-hidden="true" /> CA {m.armorClass}
            </span>
            <span className="badge border border-dnd-leather/50 bg-dnd-ink/60 text-dnd-text">
              <Swords size={12} className="mr-1 text-dnd-gold" aria-hidden="true" /> Vel. {m.speed}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {(Object.keys(STAT_LABELS) as (keyof typeof STAT_LABELS)[]).map((key) => (
              <Stat key={key} label={STAT_LABELS[key]} value={m.stats[key]} />
            ))}
          </div>

          <div className="grid gap-1.5 text-sm sm:grid-cols-2">
            <p><span className="text-dnd-gold">Dados de golpe:</span> {m.hitDice}</p>
            <p><span className="text-dnd-gold">Sentidos:</span> {m.senses}</p>
            <p className="sm:col-span-2"><span className="text-dnd-gold">Idiomas:</span> {m.languages}</p>
            {Object.keys(m.skills).length > 0 && (
              <p className="sm:col-span-2">
                <span className="text-dnd-gold">Habilidades:</span>{' '}
                {Object.entries(m.skills).map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v}`).join(', ')}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <section className="section-box">
          <h3 className="mb-2 section-title">Datos básicos</h3>
          <div className="form-grid">
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="m-name" className="label">Nombre *</label>
              <input id="m-name" className={input} value={form.name} onChange={(e) => setField('name', e.target.value)} aria-required="true" />
            </div>
            <div>
              <label htmlFor="m-type" className="label">Tipo</label>
              <input id="m-type" className={input} value={form.type} onChange={(e) => setField('type', e.target.value)} />
            </div>
            <div>
              <label htmlFor="m-size" className="label">Tamaño</label>
              <select id="m-size" className={input} value={form.size} onChange={(e) => setField('size', e.target.value as Monster['size'])}>
                <option>Pequeño</option>
                <option>Mediano</option>
                <option>Grande</option>
                <option>Enorme</option>
              </select>
            </div>
            <div>
              <label htmlFor="m-align" className="label">Alineamiento</label>
              <input id="m-align" className={input} value={form.alignment} onChange={(e) => setField('alignment', e.target.value)} />
            </div>
            <div>
              <label htmlFor="m-cr" className="label">CR</label>
              <input id="m-cr" className={input} type="number" step="0.25" min="0" value={form.challengeRating} onChange={(e) => setField('challengeRating', Number(e.target.value))} />
            </div>
            <div>
              <label htmlFor="m-ac" className="label">CA</label>
              <input id="m-ac" className={input} type="number" min="0" value={form.armorClass} onChange={(e) => setField('armorClass', Number(e.target.value))} />
            </div>
            <div>
              <label htmlFor="m-hp" className="label">PG</label>
              <input id="m-hp" className={input} type="number" min="1" value={form.hitPoints} onChange={(e) => setField('hitPoints', Number(e.target.value))} />
            </div>
            <div>
              <label htmlFor="m-hd" className="label">Dados de golpe</label>
              <input id="m-hd" className={input} value={form.hitDice} onChange={(e) => setField('hitDice', e.target.value)} placeholder="4d8+2" />
            </div>
            <div>
              <label htmlFor="m-speed" className="label">Velocidad</label>
              <input id="m-speed" className={input} value={form.speed} onChange={(e) => setField('speed', e.target.value)} />
            </div>
            <div>
              <label htmlFor="m-senses" className="label">Sentidos</label>
              <input id="m-senses" className={input} value={form.senses} onChange={(e) => setField('senses', e.target.value)} />
            </div>
            <div>
              <label htmlFor="m-lang" className="label">Idiomas</label>
              <input id="m-lang" className={input} value={form.languages} onChange={(e) => setField('languages', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="section-box">
          <h3 className="mb-2 section-title">Características</h3>
          <div className="stat-grid">
            {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((key) => (
              <div key={key}>
                <label className="label" htmlFor={`m-stat-${key}`}>{key.toUpperCase()}</label>
                <input
                  id={`m-stat-${key}`}
                  className={input}
                  type="number"
                  min="1"
                  max="30"
                  value={form.stats[key]}
                  onChange={(e) => setStat(key, Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  // ===================== PESTAÑA: ACCIONES =====================
  const renderActions = () => {
    if (mode === 'view') {
      const m = monster!;
      if (m.actions.length === 0 && (!m.legendaryActions || m.legendaryActions.length === 0)) {
        return <p className="text-sm text-dnd-muted">Este monstruo no tiene acciones definidas.</p>;
      }
      return (
        <div className="space-y-2">
          {m.actions.map((action) => (
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
          {m.legendaryActions && m.legendaryActions.length > 0 && (
            <div>
              <h3 className="mb-2 mt-4 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">👑 Acciones legendarias</h3>
              {m.legendaryActions.map((action) => (
                <div key={action.name} className="rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/30 p-2.5">
                  <p className="text-sm font-bold text-dnd-text">{action.name}</p>
                  <p className="text-xs text-dnd-text/80">{action.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <section className="section-box">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="section-title">Acciones ({form.actions.length})</h3>
            <Button variant="ghost" size="sm" onClick={() => setField('actions', [...form.actions, { ...EMPTY_ACTION }])}>
              + Acción
            </Button>
          </div>
          <div className="space-y-2">
            {form.actions.map((action, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-lg bg-dnd-ink/40 p-2 md:grid-cols-6">
                <input className={`${input} md:col-span-2`} placeholder="Nombre" value={action.name} onChange={(e) => updateAction(i, { name: e.target.value })} aria-label={`Nombre de la acción ${i + 1}`} />
                <input className={input} placeholder="Daño (2d6+2)" value={action.damage ?? ''} onChange={(e) => updateAction(i, { damage: e.target.value })} aria-label={`Daño de la acción ${i + 1}`} />
                <input className={input} placeholder="Tipo (cortante)" value={action.damageType ?? ''} onChange={(e) => updateAction(i, { damageType: e.target.value })} aria-label={`Tipo de daño ${i + 1}`} />
                <input className={input} placeholder="Bonus ataque" type="number" value={action.attackBonus ?? ''} onChange={(e) => updateAction(i, { attackBonus: Number(e.target.value) })} aria-label={`Bonus de ataque ${i + 1}`} />
                <input className={input} placeholder="Alcance" value={action.range ?? ''} onChange={(e) => updateAction(i, { range: e.target.value })} aria-label={`Alcance de la acción ${i + 1}`} />
                <textarea
                  className={`${input} md:col-span-6`}
                  rows={2}
                  placeholder="Descripción"
                  value={action.description}
                  onChange={(e) => updateAction(i, { description: e.target.value })}
                  aria-label={`Descripción de la acción ${i + 1}`}
                />
                <button
                  onClick={() => setField('actions', form.actions.filter((_, idx) => idx !== i))}
                  aria-label={`Eliminar acción ${i + 1}`}
                  className="rounded-lg border border-dnd-blood/50 p-2 text-red-300 hover:bg-dnd-blood/30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="section-box">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="section-title">Acciones legendarias ({form.legendaryActions?.length ?? 0})</h3>
            <Button variant="ghost" size="sm" onClick={() => setField('legendaryActions', [...(form.legendaryActions ?? []), { ...EMPTY_ACTION }])}>
              + Legendaria
            </Button>
          </div>
          {(!form.legendaryActions || form.legendaryActions.length === 0) ? (
            <p className="text-xs text-dnd-muted">Sin acciones legendarias.</p>
          ) : (
            <div className="space-y-2">
              {form.legendaryActions!.map((action, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-dnd-ink/40 p-2">
                  <div className="flex-1 space-y-1">
                    <input className={input} placeholder="Nombre" value={action.name} onChange={(e) => {
                      const list = [...(form.legendaryActions ?? [])];
                      list[i] = { ...list[i], name: e.target.value };
                      setField('legendaryActions', list);
                    }} aria-label={`Nombre de la acción legendaria ${i + 1}`} />
                    <textarea className={input} rows={1} placeholder="Descripción" value={action.description} onChange={(e) => {
                      const list = [...(form.legendaryActions ?? [])];
                      list[i] = { ...list[i], description: e.target.value };
                      setField('legendaryActions', list);
                    }} aria-label={`Descripción de la acción legendaria ${i + 1}`} />
                  </div>
                  <button
                    onClick={() => setField('legendaryActions', (form.legendaryActions ?? []).filter((_, idx) => idx !== i))}
                    aria-label={`Eliminar acción legendaria ${i + 1}`}
                    className="rounded-lg border border-dnd-blood/50 p-2 text-red-300 hover:bg-dnd-blood/30"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  // ===================== PESTAÑA: RASGOS =====================
  const renderTraits = () => {
    if (mode === 'view') {
      const m = monster!;
      if (m.traits.length === 0) return <p className="text-sm text-dnd-muted">Este monstruo no tiene rasgos.</p>;
      return (
        <div className="space-y-2">
          {m.traits.map((trait) => (
            <div key={trait.name} className="rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/30 p-2.5">
              <p className="text-sm font-bold italic text-dnd-text">{trait.name}.</p>
              <p className="text-xs text-dnd-text/80">{trait.description}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <section className="section-box">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="section-title">Rasgos y habilidades ({form.traits.length})</h3>
          <Button variant="ghost" size="sm" onClick={() => setField('traits', [...form.traits, { ...EMPTY_TRAIT }])}>
            + Rasgo
          </Button>
        </div>
        {form.traits.length === 0 ? (
          <p className="text-xs text-dnd-muted">Sin rasgos todavía.</p>
        ) : (
          <div className="space-y-2">
            {form.traits.map((trait, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-dnd-ink/40 p-2">
                <div className="flex-1 space-y-1">
                  <input className={input} placeholder="Nombre del rasgo" value={trait.name} onChange={(e) => updateTrait(i, { name: e.target.value })} aria-label={`Nombre del rasgo ${i + 1}`} />
                  <textarea className={input} rows={1} placeholder="Descripción" value={trait.description} onChange={(e) => updateTrait(i, { description: e.target.value })} aria-label={`Descripción del rasgo ${i + 1}`} />
                </div>
                <button
                  onClick={() => setField('traits', form.traits.filter((_, idx) => idx !== i))}
                  aria-label={`Eliminar rasgo ${i + 1}`}
                  className="rounded-lg border border-dnd-blood/50 p-2 text-red-300 hover:bg-dnd-blood/30"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  // ===================== PESTAÑA: CONJUROS =====================
  const renderSpells = () => {
    const cast = displayMonster.spellcasting;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === 'edit' ? 'secondary' : 'ghost'}
            size="sm"
            icon={<Sparkles size={14} />}
            disabled={cast === undefined}
            onClick={() => setMode('edit')}
          >
            {cast ? `Lanzo conjuros (${cast.ability})` : 'No lanza conjuros'}
          </Button>
        </div>

        {mode === 'edit' && (
          <section className="section-box">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="section-title">Conjuros</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (cast) {
                    const { ability, spellSaveDC, spellAttackBonus, spellbook } = cast;
                    const next: Spellcasting | undefined = {
                      ability, level: cast.level ?? 0, spellSaveDC, spellAttackBonus, spellbook,
                    };
                    setField('spellcasting', next);
                  }
                }}
              >
                Conservar conjuros
              </Button>
            </div>
            <p className="mb-2 text-xs text-dnd-muted">
              {cast
                ? `Los conjuros actuales se mantienen. CD ${cast.spellSaveDC} · Ataque +${cast.spellAttackBonus} · característica ${cast.ability}.`
                : 'Este monstruo no tiene conjuros asociados en momentos de creación.'}
            </p>
            {cast && (
              <div className="space-y-1">
                <div className="form-grid">
                  <div>
                    <label htmlFor="m-sc-ability" className="label">Característica</label>
                    <select id="m-sc-ability" className={input} value={cast.ability} onChange={(e) => onChangeSpellcasting({ ability: e.target.value as Spellcasting['ability'] })}>
                      <option value="INT">INT</option>
                      <option value="WIS">WIS</option>
                      <option value="CHA">CHA</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="m-sc-dc" className="label">CD salvación</label>
                    <input id="m-sc-dc" className={input} type="number" value={cast.spellSaveDC} onChange={(e) => onChangeSpellcasting({ spellSaveDC: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label htmlFor="m-sc-atk" className="label">Ataque</label>
                    <input id="m-sc-atk" className={input} type="number" value={cast.spellAttackBonus} onChange={(e) => onChangeSpellcasting({ spellAttackBonus: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label htmlFor="m-sc-level" className="label">Nivel</label>
                    <input id="m-sc-level" className={input} type="number" value={cast.level ?? 0} onChange={(e) => onChangeSpellcasting({ level: Number(e.target.value) })} />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {cast ? (
          <div className="rounded-dnd-lg border border-dnd-gold/30 bg-dnd-gold/5 p-3">
            <h3 className="text-xs font-bold uppercase text-dnd-gold">Conjuros ({cast.ability})</h3>
            <p className="text-xs text-dnd-muted">
              CD de salvación {cast.spellSaveDC} · Ataque +{cast.spellAttackBonus}
            </p>
            {Object.entries(cast.spellbook).map(([level, spells]) => (
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
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft size={15} />} aria-label="Volver a la biblioteca de monstruos">
            Volver
          </Button>
          <div>
            <h2 className="page-title">{isNew ? 'Nuevo monstruo' : (monster?.name ?? '')}</h2>
            <p className="text-sm text-dnd-muted">
              {isNew
                ? 'Completa las pestañas y guarda al finalizar.'
                : `${monster?.size} · ${monster?.type} · ${monster?.alignment}${monster?.custom ? ' · Monstruo propio (editable)' : ' · SRD 5.2'}`}
            </p>
          </div>
        </div>
        <div className="page-actions">
          {!isNew && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAdd}
              icon={<Plus size={15} />}
              disabled={added}
            >
              {added ? '¡Añadido!' : 'Añadir al combate'}
            </Button>
          )}
          {mode === 'view' ? (
            <Button variant="primary" size="sm" onClick={() => setMode('edit')} icon={<BookOpen size={15} />}>
              Editar
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleSave} icon={<Save size={15} />}>
              {isNew ? 'Crear monstruo' : 'Guardar cambios'}
            </Button>
          )}
        </div>
      </div>

      {/* Delete en vista de monstruo existente */}
      {!isNew && mode === 'view' && (
        <div className="mb-2 flex justify-end">
          {confirmDelete ? (
            <div className="flex items-center gap-2 rounded-lg border border-dnd-blood/50 bg-dnd-blood/10 px-3 py-1.5">
              <span className="text-xs text-red-200">¿Eliminar {monster?.name}?</span>
              <Button variant="danger" size="sm" onClick={handleDelete}>Sí</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>No</Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} icon={<Trash2 size={14} />}>
              Eliminar
            </Button>
          )}
        </div>
      )}

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
        {tab === 'stats' && renderStats()}
        {tab === 'actions' && renderActions()}
        {tab === 'traits' && renderTraits()}
        {tab === 'spells' && renderSpells()}
      </div>

      {mode === 'edit' && (
        <div className="flex justify-end gap-2">
          {isNew ? (
            <Button variant="ghost" onClick={onBack}>Cancelar</Button>
          ) : (
            <Button variant="ghost" onClick={() => setMode('view')}>Cancelar edición</Button>
          )}
          <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>
            {isNew ? 'Crear monstruo' : 'Guardar cambios'}
          </Button>
        </div>
      )}

      <SrdDetailPanel entry={openSpellEntry} onClose={() => setOpenSpell(null)} />
    </div>
  );
};

export default MonsterSheet;