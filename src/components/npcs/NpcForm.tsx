// ============================================================
// Formulario de creación/edición de NPC (rehén o aliado)
// ============================================================

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Npc, NpcRole } from '../../types';
import { useNpcStore } from '../../store/npcStore';

interface NpcFormProps {
  npc: Npc | null; // null = crear nuevo
  onClose: () => void;
}

const ROLE_OPTIONS: { value: NpcRole; label: string; hint: string; icon: string }[] = [
  { value: 'hostage', label: 'Rehén', hint: 'Persona secuestrada que el party debe liberar', icon: '🪢' },
  { value: 'ally', label: 'Aliado', hint: 'Ayudante del party durante el combate', icon: '🤝' },
  { value: 'neutral', label: 'Neutral', hint: 'No toma partido: no ayuda ni ataca', icon: '⚖️' },
  { value: 'enemy', label: 'Enemigo', hint: 'Actúa contra el party en el combate', icon: '🗡️' },
];

/**
 * Formulario para crear o editar un NPC en la sección NPC.
 */
export const NpcForm = ({ npc, onClose }: NpcFormProps) => {
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
    onClose();
  };

  const input = 'input text-sm';

  return (
    <Modal
      open
      onClose={onClose}
      title={npc ? `Editar: ${npc.name}` : 'Nuevo NPC'}
      subtitle="Los NPC pueden ser rehenes que liberar o aliados que ayudan al party"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Datos básicos */}
        <section className="section-box">
          <h3 className="mb-2 section-title">Datos básicos</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="n-name" className="label">Nombre *</label>
              <input
                id="n-name"
                className={input}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="P. ej. Pelagia, la posadera"
                aria-required="true"
                autoFocus
              />
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
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>
            {npc ? 'Guardar cambios' : 'Crear NPC'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};