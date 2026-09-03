// ============================================================
// Formulario de creación/edición de monstruos personalizados
// ============================================================

import { useState } from 'react';
import { Save, Trash2, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Monster, MonsterAction, MonsterTrait } from '../../types';
import { useMonsterStore } from '../../store/monsterStore';

interface MonsterFormProps {
  monster: Monster | null; // null = crear nuevo
  onClose: () => void;
  /** Si es true, se renderiza dentro de la página (sin modal). */
  inline?: boolean;
}

const EMPTY_ACTION: MonsterAction = { name: '', description: '', damage: '', damageType: '', target: 'Una criatura' };
const EMPTY_TRAIT: MonsterTrait = { name: '', description: '' };

/**
 * Formulario completo para crear o editar un monstruo en la biblioteca.
 */
export const MonsterForm = ({ monster, onClose, inline = false }: MonsterFormProps) => {
  const { addMonster, updateMonster } = useMonsterStore();

  const [form, setForm] = useState<Monster>(
    monster ?? {
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
    }
  );

  const setField = <K extends keyof Monster>(key: K, value: Monster[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setStat = (key: keyof Monster['stats'], value: number) =>
    setForm((f) => ({ ...f, stats: { ...f.stats, [key]: value } }));

  const updateAction = (index: number, patch: Partial<MonsterAction>) =>
    setForm((f) => ({
      ...f,
      actions: f.actions.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    }));

  const updateTrait = (index: number, patch: Partial<MonsterTrait>) =>
    setForm((f) => ({
      ...f,
      traits: f.traits.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    }));

  const validate = (): boolean => {
    if (!form.name.trim()) return false;
    if (form.armorClass < 0 || form.hitPoints < 1) return false;
    if (form.challengeRating < 0) return false;
    return true;
  };

  const handleSave = () => {
    if (!validate()) {
      alert('Por favor completa al menos el nombre y con datos válidos.');
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
    } else {
      addMonster(cleaned);
    }
    onClose();
  };

  const input = 'input text-sm';

  const formBody = (
    <div className="space-y-5">
      {/* Datos básicos */}
      <section className="section-box">
        <h3 className="mb-2 section-title">Datos básicos</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="col-span-2">
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
            <div className="col-span-2">
              <label htmlFor="m-senses" className="label">Sentidos</label>
              <input id="m-senses" className={input} value={form.senses} onChange={(e) => setField('senses', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label htmlFor="m-lang" className="label">Idiomas</label>
              <input id="m-lang" className={input} value={form.languages} onChange={(e) => setField('languages', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Stats */}
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

        {/* Acciones */}
        <section className="section-box">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="section-title">Acciones</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setField('actions', [...form.actions, { ...EMPTY_ACTION }])}
            >
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
                <button
                  onClick={() => setField('actions', form.actions.filter((_, idx) => idx !== i))}
                  aria-label={`Eliminar acción ${i + 1}`}
                  className="rounded-lg border border-dnd-blood/50 p-2 text-red-300 hover:bg-dnd-blood/30"
                >
                  <Trash2 size={14} />
                </button>
                <textarea
                  className={`${input} md:col-span-6`}
                  rows={2}
                  placeholder="Descripción"
                  value={action.description}
                  onChange={(e) => updateAction(i, { description: e.target.value })}
                  aria-label={`Descripción de la acción ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Rasgos */}
        <section className="section-box">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="section-title">Rasgos y habilidades</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setField('traits', [...form.traits, { ...EMPTY_TRAIT }])}
            >
              + Rasgo
            </Button>
          </div>
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
        </section>

        {/* Guardar */}
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>
            {monster ? 'Guardar cambios' : 'Crear monstruo'}
          </Button>
        </div>
    </div>
  );

  if (inline) {
    return (
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="page-title">{monster ? `Editar: ${monster.name}` : 'Nuevo monstruo'}</h3>
            <p className="text-sm text-dnd-muted">Los campos con marca son obligatorios</p>
          </div>
        </div>
        {formBody}
      </div>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={monster ? `Editar: ${monster.name}` : 'Nuevo monstruo'}
      subtitle="Los campos con marca son obligatorios"
      maxWidth="4xl"
    >
      {formBody}
    </Modal>
  );
};