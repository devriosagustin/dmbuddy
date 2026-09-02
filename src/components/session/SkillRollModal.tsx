// ============================================================
// Modal (DM): pide una prueba de habilidad a un jugador conectado.
// El DM elige el personaje y habilita una o varias habilidades; el
// jugador elige cuál usar, ingresa el d20 y la web calcula el total
// (mod + competencia si es competente). El DM decide qué hacer con
// el resultado. Opcionalmente puede fijar un DC.
// ============================================================

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SKILLS } from '../../utils/skills';

export interface RollTarget {
  playerId: string;
  playerName: string;
}

interface SkillRollModalProps {
  open: boolean;
  onClose: () => void;
  targets: RollTarget[];
  onRequest?: (payload: {
    kind: 'skill';
    playerId: string;
    playerName: string;
    skills: string[];
    dc?: number;
    label: string;
  }) => void;
}

export const SkillRollModal = ({ open, onClose, targets, onRequest }: SkillRollModalProps) => {
  const [playerId, setPlayerId] = useState('');
  const [selected, setSelected] = useState<string[]>([SKILLS[0].name]);
  const [useDc, setUseDc] = useState(false);
  const [dc, setDc] = useState('12');
  const [label, setLabel] = useState('');

  const toggle = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));

  const dcNum = Number(dc);
  const validDc = !useDc || (dc.trim() !== '' && !Number.isNaN(dcNum) && dcNum >= 1 && dcNum <= 30);

  const handleSubmit = () => {
    const target = targets.find((t) => t.playerId === playerId);
    if (!target || selected.length === 0 || !validDc || !onRequest) return;
    onRequest({
      kind: 'skill',
      playerId: target.playerId,
      playerName: target.playerName,
      skills: selected,
      dc: useDc ? dcNum : undefined,
      label: label.trim(),
    });
    onClose();
    setPlayerId('');
    setLabel('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pedir prueba de habilidad"
      subtitle="Habilita opciones; el jugador elige cuál usar"
      maxWidth="md"
    >
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="skill-target" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dnd-muted">
            Jugador / personaje
          </label>
          <select
            id="skill-target"
            className="input h-10 w-full px-2 text-sm"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
          >
            <option value="" disabled>
              {targets.length === 0 ? 'Ningún jugador conectado' : 'Elegir personaje…'}
            </option>
            {targets.map((t) => (
              <option key={t.playerId} value={t.playerId}>
                {t.playerName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dnd-muted">
            Habilidades habilitadas ({selected.length})
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SKILLS.map((s) => {
              const sel = selected.includes(s.name);
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => toggle(s.name)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                    sel
                      ? 'border-dnd-gold bg-dnd-gold/20 text-dnd-gold'
                      : 'border-dnd-leather/30 bg-dnd-leather/5 text-dnd-muted hover:bg-dnd-leather/15'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-dnd-muted">
              <input
                type="checkbox"
                checked={useDc}
                onChange={(e) => setUseDc(e.target.checked)}
                className="accent-dnd-gold"
              />
              Fijar DC
            </label>
            {useDc && (
              <input
                type="number"
                min={1}
                max={30}
                value={dc}
                onChange={(e) => setDc(e.target.value)}
                className="input h-10 w-24 px-2 text-sm"
              />
            )}
          </div>

          <div className="flex-1">
            <label htmlFor="skill-label" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dnd-muted">
              Contexto (opcional)
            </label>
            <input
              id="skill-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="P. ej. Saltar la fosa"
              className="input h-10 w-full px-2 text-sm"
            />
          </div>
        </div>

        {!validDc && <p className="text-xs text-red-300">El DC debe estar entre 1 y 30.</p>}

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!playerId || selected.length === 0 || !validDc || targets.length === 0}
          icon={<Send size={15} />}
        >
          Enviar petición
        </Button>
      </div>
    </Modal>
  );
};

export default SkillRollModal;
