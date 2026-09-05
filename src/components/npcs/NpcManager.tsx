// ============================================================
// Gestor de NPC: personajes no jugadores (rehenes o aliados)
// ============================================================

import { useState } from 'react';
import { useNpcStore } from '../../store/npcStore';
import type { Npc } from '../../types';
import { NpcForm } from './NpcForm';
import { Button } from '../common/Button';
import { Plus, Pencil, Trash2, UserRound } from 'lucide-react';

const ROLE_META: Record<Npc['role'], { label: string; icon: string; badge: string }> = {
  hostage: { label: 'Rehén', icon: '🪢', badge: 'bg-amber-900/50 text-amber-300' },
  ally: { label: 'Aliado', icon: '🤝', badge: 'bg-sky-900/50 text-sky-300' },
  neutral: { label: 'Neutral', icon: '⚖️', badge: 'bg-stone-800/60 text-stone-300' },
  enemy: { label: 'Enemigo', icon: '🗡️', badge: 'bg-red-900/50 text-red-300' },
};

/**
 * Pantalla principal de NPC de la aplicación.
 */
/**
 * Vista de pantalla: lista de NPC o su ficha (creación/edición).
 */
type NpcView = { type: 'list' } | { type: 'form'; npc: Npc | null };

export const NpcManager = () => {
  const npcs = useNpcStore((s) => s.npcs);
  const removeNpc = useNpcStore((s) => s.removeNpc);
  const [view, setView] = useState<NpcView>({ type: 'list' });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="page-title">NPC</h2>
          <p className="text-sm text-dnd-muted">
            Crea personajes no jugadores para tus escenas: personas secuestradas que el party debe liberar
            o ayudantes que luchan a su lado. Cuando tenga un combate delante, podrás añadirlos al mapa
            como una ficha más.
          </p>
        </div>
        <Button variant="primary" onClick={() => setView({ type: 'form', npc: null })} icon={<Plus size={16} />} className="shrink-0">
          Nuevo NPC
        </Button>
      </div>

      {view.type === 'form' && (
        <NpcForm npc={view.npc} onBack={() => setView({ type: 'list' })} />
      )}

      {view.type === 'list' && (
      <>
      {npcs.length === 0 ? (
        <div className="section-box flex flex-col items-center gap-2 py-10 text-center">
          <UserRound size={32} className="text-dnd-muted" aria-hidden="true" />
          <p className="text-sm text-dnd-muted">Aún no hay NPCs. Crea el primero con «Nuevo NPC».</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {npcs.map((npc) => {
            const meta = ROLE_META[npc.role];
            return (
              <article key={npc.id} className="section-box flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                      aria-hidden="true"
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-fantasy text-sm font-bold">{npc.name}</h3>
                      <span className={`badge text-[10px] ${meta.badge}`}>{meta.label}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => setView({ type: 'form', npc })}
                      aria-label={`Editar a ${npc.name}`}
                      className="icon-btn"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar a ${npc.name}? Esta acción no se puede deshacer.`))
                          removeNpc(npc.id);
                      }}
                      aria-label={`Eliminar a ${npc.name}`}
                      className="icon-btn"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-dnd-ink/50 p-2">
                    <span className="block text-[10px] uppercase text-dnd-muted">PG</span>
                    <span className="font-bold">
                      {npc.hp}<span className="text-dnd-muted">/{npc.maxHp}</span>
                    </span>
                  </div>
                  <div className="rounded-lg bg-dnd-ink/50 p-2">
                    <span className="block text-[10px] uppercase text-dnd-muted">CA</span>
                    <span className="font-bold">{npc.armorClass}</span>
                  </div>
                  <div className="rounded-lg bg-dnd-ink/50 p-2">
                    <span className="block text-[10px] uppercase text-dnd-muted">Vel.</span>
                    <span className="font-bold">{npc.speed ?? 30}′</span>
                  </div>
                </div>

                {npc.notes && (
                  <p className="line-clamp-2 text-xs text-dnd-muted">{npc.notes}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default NpcManager;