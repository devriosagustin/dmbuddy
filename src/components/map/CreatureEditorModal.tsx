// ============================================================
// Editor de una criatura persistente del mapa (modo exploración).
// Permite ajustar su posición, PG y retirarla del mapa.
// ============================================================

import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useCombatStore } from '../../store/combatStore';
import type { MapCreature } from '../../types';

interface CreatureEditorModalProps {
  creature: MapCreature | null;
  onClose: () => void;
}

const kindLabel: Record<MapCreature['kind'], string> = {
  monster: 'Monstruo',
  npc: 'NPC',
  player: 'Personaje',
};

export const CreatureEditorModal = ({ creature, onClose }: CreatureEditorModalProps) => {
  const updateMapCreature = useCombatStore((s) => s.updateMapCreature);
  const removeMapCreature = useCombatStore((s) => s.removeMapCreature);

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [hp, setHp] = useState(0);

  useEffect(() => {
    if (creature) {
      setX(creature.x);
      setY(creature.y);
      setHp(creature.hp);
    }
  }, [creature]);

  if (!creature) return null;

  const save = () => {
    updateMapCreature(creature.id, { x: Number(x) || 0, y: Number(y) || 0, hp: Number(hp) || 0 });
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={creature.name} subtitle={`Criatura en el mapa · ${kindLabel[creature.kind]}`}>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs font-bold text-dnd-muted">
          X
          <input type="number" value={x} onChange={(e) => setX(Number(e.target.value))} className="input h-9 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-dnd-muted">
          Y
          <input type="number" value={y} onChange={(e) => setY(Number(e.target.value))} className="input h-9 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-dnd-muted">
          PG (de {creature.maxHp})
          <input type="number" value={hp} onChange={(e) => setHp(Number(e.target.value))} className="input h-9 text-sm" />
        </label>
      </div>

      <div className="mt-4 flex justify-between border-t border-dnd-leather/30 pt-3">
        <Button
          variant="danger"
          icon={<Trash2 size={14} />}
          onClick={() => {
            removeMapCreature(creature.id);
            onClose();
          }}
        >
          Retirar del mapa
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={save}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreatureEditorModal;