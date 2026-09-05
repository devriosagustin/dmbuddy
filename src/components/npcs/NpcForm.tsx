// ============================================================
// Formulario de creación/edición de NPC (rehén o aliado).
// Página completa (sin modal), como la ficha de personaje: alterna
// con la lista de NPC desde el propio NpcManager.
// ============================================================

import { useState } from 'react';
import { ArrowLeft, Dices, Save, Shuffle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Npc, NpcRole } from '../../types';
import { useNpcStore } from '../../store/npcStore';
import { NPC_NAME_TABLES } from '../../data/randomTables';
import { rollNpcName } from '../../utils/randomTables';
import { RandomTablesPage } from '../tools/RandomTablesPage';

interface NpcFormProps {
  npc: Npc | null; // null = crear nuevo
  onBack: () => void;
}

const ROLE_OPTIONS: { value: NpcRole; label: string; hint: string; icon: string }[] = [
  { value: 'hostage', label: 'Rehén', hint: 'Persona secuestrada que el party debe liberar', icon: '🪢' },
  { value: 'ally', label: 'Aliado', hint: 'Ayudante del party durante el combate', icon: '🤝' },
  { value: 'neutral', label: 'Neutral', hint: 'No toma partido: no ayuda ni ataca', icon: '⚖️' },
  { value: 'enemy', label: 'Enemigo', hint: 'Actúa contra el party en el combate', icon: '🗡️' },
];

/**
 * Página para crear o editar un NPC en la sección NPC. Incluye acceso al
 * generador aleatorio (ganchos, complicaciones, botín) en un panel propio,
 * para no necesitar una pestaña separada en la barra lateral.
 */
export const NpcForm = ({ npc, onBack }: NpcFormProps) => {
  const { addNpc, updateNpc } = useNpcStore();

  const [form, setForm] = useState<Npc>(
    npc ?? {
      id: '',
      name: '',
      role: 'hostage',
      hp: 10,
      maxHp: 10,
      armorClass: 10,
      speed: 30,
      notes: '',
    }
  );

  // Especie usada solo para sesgar el generador de nombre aleatorio de
  // acá abajo — no se guarda con el NPC (el registro de NPC no tiene campo
  // de especie).
  const [nameSpecies, setNameSpecies] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);

  const setField = <K extends keyof Npc>(key: K, value: Npc[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) {
      alert('Por favor escribe al menos el nombre del NPC.');
      return;
    }
    const cleaned: Npc = {
      ...form,
      name: form.name.trim(),
      hp: Math.max(0, Math.min(form.hp, form.maxHp)),
      maxHp: Math.max(1, form.maxHp),
      armorClass: Math.max(0, form.armorClass),
      speed: Math.max(0, form.speed ?? 30),
      notes: (form.notes ?? '').trim() || undefined,
    };
    if (npc) {
      updateNpc(npc.id, cleaned);
    } else {
      addNpc(cleaned);
    }
    onBack();
  };

  const input = 'input text-sm';
  const isNew = !npc;

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft size={15} />} aria-label="Volver a la lista de NPC">
            Volver
          </Button>
          <div>
            <h2 className="page-title">{isNew ? 'Nuevo NPC' : `Editar: ${npc.name}`}</h2>
            <p className="text-sm text-dnd-muted">
              Los NPC pueden ser rehenes que liberar o aliados que ayudan al party
            </p>
          </div>
        </div>
        <div className="page-actions">
          <Button variant="secondary" size="sm" icon={<Shuffle size={15} />} onClick={() => setShowGenerator(true)}>
            Generador aleatorio
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} icon={<Save size={15} />}>
            {isNew ? 'Crear NPC' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Datos básicos */}
        <section className="section-box">
          <h3 className="mb-2 section-title">Datos básicos</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="n-name" className="label">Nombre *</label>
              <div className="flex gap-2">
                <input
                  id="n-name"
                  className={`${input} flex-1`}
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="P. ej. Pelagia, la posadera"
                  aria-required="true"
                  autoFocus
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Dices size={14} />}
                  onClick={() => setField('name', rollNpcName(nameSpecies || undefined).name)}
                  aria-label="Generar nombre aleatorio"
                >
                  Azar
                </Button>
              </div>
              <select
                className="input mt-1.5 h-7 text-[11px]"
                value={nameSpecies}
                onChange={(e) => setNameSpecies(e.target.value)}
                aria-label="Especie para el nombre aleatorio"
              >
                <option value="">🎲 Especie al azar entre todas</option>
                {NPC_NAME_TABLES.map((t) => (
                  <option key={t.speciesId} value={t.speciesId}>{t.speciesLabel}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label htmlFor="n-role" className="label">Rol</label>
              <div id="n-role" className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Rol del NPC">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={form.role === opt.value}
                    onClick={() => setField('role', opt.value)}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors ${
                      form.role === opt.value
                        ? 'border-dnd-gold bg-dnd-gold/10'
                        : 'border-dnd-leather/40 hover:border-dnd-leather/70'
                    }`}
                  >
                    <span className="text-lg" aria-hidden="true">{opt.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{opt.label}</span>
                      <span className="block text-[11px] text-dnd-muted">{opt.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Combate */}
        <section className="section-box">
          <h3 className="mb-2 section-title">Combate</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="n-hp" className="label">PG</label>
              <input
                id="n-hp"
                className={input}
                type="number"
                min="0"
                value={form.hp}
                onChange={(e) => setField('hp', Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="n-maxhp" className="label">PG máx.</label>
              <input
                id="n-maxhp"
                className={input}
                type="number"
                min="1"
                value={form.maxHp}
                onChange={(e) => setField('maxHp', Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="n-ac" className="label">CA</label>
              <input
                id="n-ac"
                className={input}
                type="number"
                min="0"
                value={form.armorClass}
                onChange={(e) => setField('armorClass', Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="n-speed" className="label">Velocidad (pies)</label>
              <input
                id="n-speed"
                className={input}
                type="number"
                min="0"
                value={form.speed ?? 30}
                onChange={(e) => setField('speed', Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* Notas */}
        <section className="section-box">
          <h3 className="mb-2 section-title">Notas del máster</h3>
          <textarea
            id="n-notes"
            className={input}
            rows={3}
            placeholder="Contexto, vínculos, cómo reacciona si lo atacan…"
            value={form.notes ?? ''}
            onChange={(e) => setField('notes', e.target.value)}
          />
        </section>

        {/* Guardar */}
        <div className="form-actions">
          <Button variant="ghost" onClick={onBack}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>
            {isNew ? 'Crear NPC' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      {/* Generador aleatorio: ganchos, complicaciones y botín, sin salir de esta página */}
      <Modal open={showGenerator} onClose={() => setShowGenerator(false)} maxWidth="2xl">
        <RandomTablesPage />
      </Modal>
    </div>
  );
};
