// ============================================================
// Bitácora de misiones (quest log): separada de las notas libres
// ============================================================

import { useState } from 'react';
import { useQuestStore } from '../../store/questStore';
import type { Quest, QuestStatus } from '../../types';
import { QuestForm } from './QuestForm';
import { Button } from '../common/Button';
import { Plus, Pencil, Trash2, ScrollText } from 'lucide-react';

const STATUS_META: Record<QuestStatus, { label: string; icon: string; badge: string }> = {
  activa: { label: 'Activa', icon: '📜', badge: 'bg-sky-900/50 text-sky-300' },
  resuelta: { label: 'Resuelta', icon: '✅', badge: 'bg-emerald-900/50 text-emerald-300' },
  fallida: { label: 'Fallida', icon: '❌', badge: 'bg-red-900/50 text-red-300' },
};

const STATUS_ORDER: QuestStatus[] = ['activa', 'resuelta', 'fallida'];

/**
 * Pantalla principal de la bitácora de misiones: agrupa por estado
 * (activa / resuelta / fallida) para que sea fácil ver qué sigue pendiente.
 */
export const QuestManager = () => {
  const quests = useQuestStore((s) => s.quests);
  const setQuestStatus = useQuestStore((s) => s.setQuestStatus);
  const removeQuest = useQuestStore((s) => s.removeQuest);
  const [formTarget, setFormTarget] = useState<Quest | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const startNew = () => {
    setFormTarget(null);
    setFormOpen(true);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="page-title">Misiones</h2>
          <p className="text-sm text-dnd-muted">
            Bitácora de misiones separada de las notas libres: qué está activo, qué se resolvió
            y qué se dio por perdido, con su recompensa.
          </p>
        </div>
        <Button variant="primary" onClick={startNew} icon={<Plus size={16} />} className="shrink-0">
          Nueva misión
        </Button>
      </div>

      {quests.length === 0 ? (
        <div className="section-box flex flex-col items-center gap-2 py-10 text-center">
          <ScrollText size={32} className="text-dnd-muted" aria-hidden="true" />
          <p className="text-sm text-dnd-muted">Aún no hay misiones. Crea la primera con «Nueva misión».</p>
        </div>
      ) : (
        <div className="space-y-6">
          {STATUS_ORDER.map((status) => {
            const group = quests.filter((q) => q.status === status);
            if (group.length === 0) return null;
            const meta = STATUS_META[status];
            return (
              <section key={status} className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-dnd-muted">
                  <span aria-hidden="true">{meta.icon}</span>
                  {meta.label} ({group.length})
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {group.map((quest) => (
                    <article key={quest.id} className="section-box flex flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="truncate font-fantasy text-sm font-bold">{quest.title}</h4>
                          <span className={`badge text-[10px] ${meta.badge}`}>{meta.label}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => {
                              setFormTarget(quest);
                              setFormOpen(true);
                            }}
                            aria-label={`Editar misión ${quest.title}`}
                            className="icon-btn"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar la misión «${quest.title}»? Esta acción no se puede deshacer.`))
                                removeQuest(quest.id);
                            }}
                            aria-label={`Eliminar misión ${quest.title}`}
                            className="icon-btn"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {quest.reward && (
                        <p className="text-xs text-dnd-muted">
                          <span className="font-bold text-dnd-text">Recompensa: </span>
                          {quest.reward}
                        </p>
                      )}

                      {quest.notes && <p className="line-clamp-2 text-xs text-dnd-muted">{quest.notes}</p>}

                      <div className="flex items-center justify-between gap-2 border-t border-dnd-leather/30 pt-2">
                        <span className="text-[10px] text-dnd-muted">
                          Actualizada {new Date(quest.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                        <div className="flex gap-1">
                          {STATUS_ORDER.filter((s) => s !== quest.status).map((s) => (
                            <button
                              key={s}
                              onClick={() => setQuestStatus(quest.id, s)}
                              className="rounded-md border border-dnd-leather/40 px-2 py-1 text-[10px] font-bold text-dnd-muted hover:border-dnd-leather/70 hover:text-dnd-text"
                            >
                              {STATUS_META[s].icon} {STATUS_META[s].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {formOpen && (
        <QuestForm
          quest={formTarget}
          onClose={() => {
            setFormOpen(false);
            setFormTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default QuestManager;
