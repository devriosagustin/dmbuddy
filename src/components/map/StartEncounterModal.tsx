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
import {
  classifyEncounterDifficulty,
  ENCOUNTER_DIFFICULTY_LABELS,
  partyXpBudget,
} from '../../utils/encounterBudget';

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

  // Presupuesto de XP del encuentro (reglas 2024, sin multiplicador por
  // cantidad de monstruos): suma el XP de las criaturas hostiles elegidas y
  // lo compara contra el presupuesto Baja/Moderada/Alta del party.
  const monsterXp = mapCreatures
    .filter((c) => selectedCreatures.includes(c.id) && (c.kind === 'monster' || c.npcRole === 'enemy'))
    .reduce((sum, c) => sum + (c.xpReward ?? 0), 0);
  // Si no se eligió a nadie del party todavía, se calcula con todo el
  // roster (lo habitual es que participe el party completo).
  const budgetPlayers = selectedPlayers.length > 0
    ? players.filter((p) => selectedPlayers.includes(p.id))
    : players;
  const xpBudget = partyXpBudget(budgetPlayers.map((p) => p.level));
  const difficulty =
    budgetPlayers.length > 0 && monsterXp > 0 ? classifyEncounterDifficulty(monsterXp, xpBudget) : null;

  const DIFFICULTY_STYLES: Record<string, string> = {
    baja: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-100',
    moderada: 'border-amber-500/50 bg-amber-500/15 text-amber-100',
    alta: 'border-orange-500/50 bg-orange-500/15 text-orange-100',
    extrema: 'border-red-500/50 bg-red-500/15 text-red-100',
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

      {/* Presupuesto de XP del encuentro (reglas 2024) */}
      <div className="mt-3 rounded-lg border border-dnd-leather/30 bg-dnd-leather/5 p-3 text-xs">
        {budgetPlayers.length === 0 ? (
          <p className="text-dnd-muted">
            Agrega personajes al party para calcular el presupuesto de XP del encuentro.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="font-bold text-dnd-text">
              XP monstruos: <span className="text-dnd-gold">{monsterXp}</span>
            </span>
            <span className="text-dnd-muted">
              Presupuesto ({budgetPlayers.length} personaje{budgetPlayers.length !== 1 ? 's' : ''}): Baja ≤{xpBudget.low} ·
              Moderada ≤{xpBudget.moderate} · Alta ≤{xpBudget.high}
            </span>
            {difficulty && (
              <span
                className={`badge border font-bold ${DIFFICULTY_STYLES[difficulty]}`}
              >
                Dificultad: {ENCOUNTER_DIFFICULTY_LABELS[difficulty]}
              </span>
            )}
          </div>
        )}
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