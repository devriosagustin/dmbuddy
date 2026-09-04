// ============================================================
// Formulario de creación/edición de misiones (bitácora de quests)
// ============================================================

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Quest, QuestStatus } from '../../types';
import { useQuestStore } from '../../store/questStore';

interface QuestFormProps {
  quest: Quest | null; // null = crear nueva
  onClose: () => void;
}

const STATUS_OPTIONS: { value: QuestStatus; label: string; hint: string; icon: string }[] = [
  { value: 'activa', label: 'Activa', hint: 'El party todavía la está persiguiendo', icon: '📜' },
  { value: 'resuelta', label: 'Resuelta', hint: 'El party la completó con éxito', icon: '✅' },
  { value: 'fallida', label: 'Fallida', hint: 'Ya no se puede completar', icon: '❌' },
];

/**
 * Formulario para crear o editar una misión en la bitácora de quests.
 */
export const QuestForm = ({ quest, onClose }: QuestFormProps) => {
  const { addQuest, updateQuest } = useQuestStore();

  const [form, setForm] = useState<{ title: string; status: QuestStatus; reward: string; notes: string }>(
    quest
      ? { title: quest.title, status: quest.status, reward: quest.reward ?? '', notes: quest.notes ?? '' }
      : { title: '', status: 'activa', reward: '', notes: '' }
  );

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    if (!form.title.trim()) {
      alert('Por favor escribe al menos el título de la misión.');
      return;
    }
    const cleaned = {
      title: form.title.trim(),
      status: form.status,
      reward: form.reward.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (quest) {
      updateQuest(quest.id, cleaned);
    } else {
      addQuest(cleaned);
    }
    onClose();
  };

  const input = 'input text-sm';

  return (
    <Modal
      open
      onClose={onClose}
      title={quest ? `Editar: ${quest.title}` : 'Nueva misión'}
      subtitle="Registra objetivos narrativos y su recompensa, separado de las notas libres"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Datos básicos */}
        <section className="section-box">
          <h3 className="mb-2 section-title">Datos básicos</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="q-title" className="label">Título *</label>
              <input
                id="q-title"
                className={input}
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="P. ej. Recuperar la corona perdida"
                aria-required="true"
                autoFocus
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="q-status" className="label">Estado</label>
              <div id="q-status" className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Estado de la misión">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={form.status === opt.value}
                    onClick={() => setField('status', opt.value)}
                    className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors ${
                      form.status === opt.value
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

        {/* Recompensa */}
        <section className="section-box">
          <h3 className="mb-2 section-title">Recompensa</h3>
          <input
            id="q-reward"
            className={input}
            value={form.reward}
            onChange={(e) => setField('reward', e.target.value)}
            placeholder="P. ej. 200 po y el favor del duque"
          />
        </section>

        {/* Notas */}
        <section className="section-box">
          <h3 className="mb-2 section-title">Notas del máster</h3>
          <textarea
            id="q-notes"
            className={input}
            rows={3}
            placeholder="Quién la encargó, pistas, complicaciones…"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
          />
        </section>

        {/* Guardar */}
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>
            {quest ? 'Guardar cambios' : 'Crear misión'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
