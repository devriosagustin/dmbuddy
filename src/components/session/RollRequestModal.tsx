// ============================================================
// Modal (DM): pide una tirada de salvación a un jugador conectado.
// Elige el personaje, la característica, el DC y el contexto. La
// petición se publica en el snapshot y el jugador la resuelve.
// ============================================================

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { RollAbility } from '../../types';

const ABILITIES: { value: RollAbility; label: string; abbr: string }[] = [
  { value: 'str', label: 'Fuerza', abbr: 'FUE' },
  { value: 'dex', label: 'Destreza', abbr: 'DES' },
  { value: 'con', label: 'Constitución', abbr: 'CON' },
  { value: 'int', label: 'Inteligencia', abbr: 'INT' },
  { value: 'wis', label: 'Sabiduría', abbr: 'SAB' },
  { value: 'cha', label: 'Carisma', abbr: 'CAR' },
];

export interface RollTarget {
  playerId: string;
  playerName: string;
}

interface RollRequestModalProps {
  open: boolean;
  onClose: () => void;
  targets: RollTarget[];
  onRequest?: (payload: { kind: 'save'; playerId: string; playerName: string; ability: RollAbility; dc: number; label: string }) => void;
}

export const RollRequestModal = ({ open, onClose, targets, onRequest }: RollRequestModalProps) => {
  const [playerId, setPlayerId] = useState('');
  const [ability, setAbility] = useState<RollAbility>('dex');
  const [dc, setDc] = useState('12');
  const [label, setLabel] = useState('');

  const dcNum = Number(dc);
  const validDc = dc.trim() !== '' && !Number.isNaN(dcNum) && dcNum >= 1 && dcNum <= 30;

  const handleSubmit = () => {
    const target = targets.find((t) => t.playerId === playerId);
    if (!target || !validDc || !onRequest) return;
    onRequest({
      kind: 'save',
      playerId: target.playerId,
      playerName: target.playerName,
      ability,
      dc: dcNum,
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
      title="Pedir tirada de salvación"
      subtitle="Envía una tirada a un jugador conectado"
      maxWidth="sm"
    >
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="roll-target" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dnd-muted">
            Jugador / personaje
          </label>
          <select
            id="roll-target"
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
          <label htmlFor="roll-ability" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dnd-muted">
            Característica
          </label>
          <select
            id="roll-ability"
            className="input h-10 w-full px-2 text-sm"
            value={ability}
            onChange={(e) => setAbility(e.target.value as RollAbility)}
          >
            {ABILITIES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label} ({a.abbr})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="roll-dc" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dnd-muted">
            Dificultad (DC)
          </label>
          <input
            id="roll-dc"
            type="number"
            min={1}
            max={30}
            value={dc}
            onChange={(e) => setDc(e.target.value)}
            className="input h-10 w-24 px-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="roll-label" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dnd-muted">
            Contexto (opcional)
          </label>
          <input
            id="roll-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="P. ej. Veneno de la trampa"
            className="input h-10 w-full px-2 text-sm"
          />
        </div>

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!playerId || !validDc || targets.length === 0}
          icon={<Send size={15} />}
        >
          Enviar petición
        </Button>
      </div>
    </Modal>
  );
};
