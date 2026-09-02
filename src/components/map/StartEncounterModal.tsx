// ============================================================
// Modal para iniciar un encuentro desde el mapa.
// Permite elegir qué criaturas del mapa entran en el encuentro y
// qué personajes del party participan. Al iniciar, se tiran las
// iniciativas y el encuentro queda activo sobre el mismo mapa.
// ============================================================

import { useState } from 'react';
import { Play, Skull, Users } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useCombatStore } from '../../store/combatStore';
import { usePlayerStore } from '../../store/playerStore';

interface StartEncounterModalProps {
  open: boolean;
  onClose: () => void;
}

export const StartEncounterModal = ({ open, onClose }: StartEncounterModalProps) => {
  const mapCreatures = useCombatStore((s) => s.mapCreatures);
  const startEncounter = useCombatStore((s) => s.startEncounter);
  const players = usePlayerStore((s) => s.players);

  const [selectedCreatures, setSelectedCreatures] = useState<string[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const toggle = (id: string, list: string[], set: (v: string[]) => void) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const reset = () => {
    setSelectedCreatures([]);
    setSelectedPlayers([]);
  };

  const canStart = selectedCreatures.length > 0;

  const start = () => {
    startEncounter(selectedCreatures, selectedPlayers);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Iniciar encuentro"
      subtitle="Elige qué criaturas del mapa y qué personajes del party participan"
      maxWidth="xl"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Criaturas del mapa */}
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-dnd-muted">
            <Skull size={13} /> Criaturas del mapa ({selectedCreatures.length} seleccionadas)
          </h3>
          {mapCreatures.length === 0 ? (
            <p className="rounded-lg border border-dashed border-dnd-leather/50 p-4 text-center text-xs text-dnd-muted">
              No hay criaturas en el mapa. Colócalas con «Añadir criatura».
            </p>
          ) : (
            <div className="flex max-h-60 flex-col gap-1 overflow-y-auto pr-1">
              {mapCreatures.map((c) => {
                const hostile = c.kind === 'monster' || c.npcRole === 'enemy';
                const checked = selectedCreatures.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                      checked
                        ? 'border-red-500/50 bg-red-500/15 text-red-100'
                        : 'border-dnd-leather/30 bg-dnd-leather/5 text-dnd-text hover:bg-dnd-leather/15'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(c.id, selectedCreatures, setSelectedCreatures)}
                      className="accent-dnd-gold"
                    />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-dnd-muted">
                      {hostile ? '🗡 hostil' : 'aliado'} · ({c.x},{c.y}) · {c.hp}/{c.maxHp}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Party */}
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-dnd-muted">
            <Users size={13} /> Party ({selectedPlayers.length} seleccionado(s))
          </h3>
          {players.length === 0 ? (
            <p className="rounded-lg border border-dashed border-dnd-leather/50 p-4 text-center text-xs text-dnd-muted">
              No hay personajes en tu party. Créalos en la pestaña «Party».
            </p>
          ) : (
            <div className="flex max-h-60 flex-col gap-1 overflow-y-auto pr-1">
              {players.map((p) => {
                const checked = selectedPlayers.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                      checked
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100'
                        : 'border-dnd-leather/30 bg-dnd-leather/5 text-dnd-text hover:bg-dnd-leather/15'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(p.id, selectedPlayers, setSelectedPlayers)}
                      className="accent-dnd-gold"
                    />
                    <span className="truncate">{p.name}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-dnd-muted">
                      Nv {p.level} · {p.hp}/{p.maxHp}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-dnd-leather/30 pt-3">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" icon={<Play size={16} />} disabled={!canStart} onClick={start}>
          Iniciar encuentro
        </Button>
      </div>
    </Modal>
  );
};

export default StartEncounterModal;