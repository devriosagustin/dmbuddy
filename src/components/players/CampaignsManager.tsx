// ============================================================
// Gestor de campañas: crear / usar / renombrar / eliminar
// snapshots del party + combate
// ============================================================

import { useState } from 'react';
import { Check, Layers, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useCampaignStore } from '../../store/campaignStore';
import type { Campaign } from '../../store/campaignStore';

interface CampaignsManagerProps {
  open: boolean;
  onClose: () => void;
}

const formatSavedAt = (ts: number): string =>
  new Date(ts).toLocaleString('es', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const campaignMeta = (campaign: Campaign): string => [
  `${campaign.snapshot.party.length} PJ`,
  campaign.snapshot.combat.isActive ? 'combate en curso' : 'sin combate',
  formatSavedAt(campaign.savedAt),
].join(' · ');

export const CampaignsManager = ({ open, onClose }: CampaignsManagerProps) => {
  const campaigns = useCampaignStore((s) => s.campaigns);
  const activeCampaignId = useCampaignStore((s) => s.activeCampaignId);
  const createCampaign = useCampaignStore((s) => s.createCampaign);
  const renameCampaign = useCampaignStore((s) => s.renameCampaign);
  const deleteCampaign = useCampaignStore((s) => s.deleteCampaign);
  const loadCampaign = useCampaignStore((s) => s.loadCampaign);
  const saveCurrent = useCampaignStore((s) => s.saveCurrent);

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCampaign(newName);
    setNewName('');
  };

  const handleDelete = (campaign: Campaign) => {
    const proceed = window.confirm(`¿Eliminar la campaña "${campaign.name}"? Se perderá su party y combate guardados.`);
    if (!proceed) return;
    if (editingId === campaign.id) {
      setEditingId(null);
      setEditName('');
    }
    deleteCampaign(campaign.id);
  };

  return (
    <Modal open={open} onClose={onClose} title="Campañas" subtitle="Cada campaña guarda el party y el combate actuales" maxWidth="md">
      <div className="space-y-4">
        {/* Nueva campaña */}
        <div className="space-y-1.5">
          <label htmlFor="new-campaign" className="label">Nombre de la campaña</label>
          <div className="flex gap-2">
            <input
              id="new-campaign"
              className="input min-w-0 flex-1"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              placeholder="p. ej. La Maldición de Strahd"
            />
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate} disabled={!newName.trim()}>
              Crear
            </Button>
          </div>
        </div>

        {/* Lista */}
        {campaigns.length === 0 ? (
          <div className="empty-state">
            <p className="font-fantasy text-lg text-dnd-muted">Aún no hay campañas guardadas</p>
            <p className="mt-1 text-sm text-dnd-muted">
              Crea la primera para guardar el estado actual del party y del combate; después podrás alternar entre sesiones.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className={`card p-3 ${campaign.id === activeCampaignId ? 'ring-1 ring-dnd-gold/50' : ''}`}
              >
                {editingId === campaign.id ? (
                  <div className="space-y-2">
                    <input
                      className="input"
                      value={editName}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameCampaign(campaign.id, editName);
                          setEditingId(null);
                        }
                      }}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<X size={14} />}
                        onClick={() => {
                          setEditingId(null);
                          setEditName('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Check size={14} />}
                        onClick={() => {
                          renameCampaign(campaign.id, editName);
                          setEditingId(null);
                        }}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-fantasy text-lg leading-tight">{campaign.name}</p>
                        <p className="text-xs text-dnd-muted">{campaignMeta(campaign)}</p>
                      </div>
                      {campaign.id === activeCampaignId && (
                        <span className="shrink-0 rounded-full bg-dnd-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-dnd-ink">
                          Activa
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2">
                      {campaign.id === activeCampaignId ? (
                        <Button variant="ghost" size="sm" icon={<Layers size={14} />} onClick={saveCurrent}>
                          Guardar ahora
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<RotateCcw size={14} />}
                          onClick={() => {
                            loadCampaign(campaign.id);
                            onClose();
                          }}
                        >
                          Usar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil size={14} />}
                        aria-label={`Renombrar ${campaign.name}`}
                        onClick={() => {
                          setEditingId(campaign.id);
                          setEditName(campaign.name);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        aria-label={`Eliminar ${campaign.name}`}
                        onClick={() => handleDelete(campaign)}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CampaignsManager;