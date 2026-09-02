// ============================================================
// Modal (jugador): responde a una petición de tirada que el DM
// le envía. Soporta tres tipos:
//  - save: tirada de salvación (característica + DC → éxito/fallo).
//  - skill: prueba de habilidad; el DM habilita opciones y el
//    jugador elige cuál usar → mod + competencia si es competente.
//  - initiative: tirada de iniciativa (d20 + mod DES) para el orden
//    de turnos.
// En todos los casos el jugador solo ingresa el valor del d20 y la
// web calcula el total y el desglose.
// ============================================================

import { useMemo, useState } from 'react';
import { Dices, Send, RotateCcw } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { playerSavingThrowBonus, playerInitiativeBonus } from '../../utils/combatUtils';
import { skillBonus, skillAbility } from '../../utils/skills';
import { usePlayerStore } from '../../store/playerStore';
import { useSessionStore } from '../../store/sessionStore';
import { publishRollResponse } from '../../services/firebaseSync';
import type { RollAbility, RollRequest, RollResponse } from '../../types';

const ABILITY_NAMES: Record<RollAbility, string> = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitución',
  int: 'Inteligencia',
  wis: 'Sabiduría',
  cha: 'Carisma',
};

const ABILITY_LABELS: Record<RollAbility, string> = {
  str: 'FUE', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
};

const rollD20 = (): number => Math.floor(Math.random() * 20) + 1;

interface PlayerRollModalProps {
  request: RollRequest;
  onClose: () => void;
}

const TITLES: Record<RollRequest['kind'], string> = {
  save: 'Tirada de salvación',
  skill: 'Prueba de habilidad',
  initiative: 'Tirada de iniciativa',
};

export const PlayerRollModal = ({ request, onClose }: PlayerRollModalProps) => {
  const player = usePlayerStore((s) =>
    s.players.find((p) => p.id === request.playerId)
  );
  const code = useSessionStore((s) => s.code);

  const [die, setDie] = useState<number | null>(null);
  const [manual, setManual] = useState<string>('');
  const [skill, setSkill] = useState<string>(request.kind === 'skill' && request.skills && request.skills.length > 0 ? request.skills[0] : '');
  const [sent, setSent] = useState(false);

  // Bono según el tipo de tirada.
  const bonus = useMemo(() => {
    if (!player) return 0;
    if (request.kind === 'initiative') return playerInitiativeBonus(player);
    if (request.kind === 'skill') {
      const name = skill || '';
      const proficient = (player.skills ?? []).includes(name);
      return name ? skillBonus(player.stats, name, proficient, player.proficiencyBonus) : 0;
    }
    return playerSavingThrowBonus(player, request.ability!);
  }, [player, request, skill]);

  // Resultado y desglose (comunes a los tres tipos).
  const manualNum = manual.trim() !== '' ? Number(manual.trim()) : null;
  const hasDie =
    (die !== null || manualNum !== null) &&
    !Number.isNaN(manualNum ?? die) &&
    (manualNum === null || (manualNum >= 1 && manualNum <= 20));
  const effectiveDie = hasDie ? (manualNum !== null ? manualNum : die) : null;
  const result = effectiveDie !== null ? effectiveDie + bonus : null;
  const success = result !== null && request.dc !== undefined && result >= request.dc;
  const breakdown = effectiveDie !== null ? `${effectiveDie} + ${bonus} = ${result}` : '';
  const manualInvalid = manualNum !== null && (manualNum < 1 || manualNum > 20);

  const skillInvalid = request.kind === 'skill' && (skill || '').trim() === '';

  const rollRandom = () => {
    const d = rollD20();
    setDie(d);
    setManual('');
  };

  const resetRoll = () => {
    setManual('');
    setDie(null);
  };

  const submit = async () => {
    const effectiveSkill = request.kind === 'skill' ? (skill || '').trim() : undefined;
    if (!hasDie || !code || !player || (request.kind === 'skill' && !effectiveSkill)) return;

    const response: RollResponse = {
      requestId: request.id,
      kind: request.kind,
      playerId: player.id,
      playerName: player.name,
      die: effectiveDie!,
      bonus,
      result: result!,
      breakdown,
      createdAt: Date.now(),
    };
    if (request.kind === 'save' || request.kind === 'skill') {
      const ability = request.kind === 'skill' ? skillAbility(effectiveSkill!) : request.ability!;
      response.ability = ability;
      if (request.dc !== undefined) {
        response.dc = request.dc;
        response.success = success!;
      }
      if (request.kind === 'skill') response.skill = effectiveSkill;
    }
    if (request.kind === 'initiative') {
      response.initiative = result!;
    }
    await publishRollResponse(code, response);
    setSent(true);
  };

  const subtitle = player
    ? `${player.name}${
        request.kind === 'save'
          ? ` — ${ABILITY_NAMES[request.ability!]}`
          : request.kind === 'skill'
          ? ' — elige tu habilidad'
          : ' — solo ingresa el d20 (DES)'
      }`
    : request.playerName;

  const showOutcome = hasDie && !manualInvalid && (request.dc !== undefined);

  return (
    <Modal
      open
      onClose={onClose}
      title={TITLES[request.kind]}
      subtitle={subtitle}
      maxWidth="sm"
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-dnd-leather/30 bg-dnd-leather/5 px-3 py-2 text-sm">
          {request.label && (
            <p className="flex items-center justify-between">
              <span className="text-dnd-muted">Contexto</span>
              <span className="font-bold text-dnd-text">{request.label}</span>
            </p>
          )}
          {request.dc !== undefined && (
            <p className="mt-1 flex items-center justify-between">
              <span className="text-dnd-muted">Dificultad (DC)</span>
              <span className="font-bold text-dnd-gold">{request.dc}</span>
            </p>
          )}
          <p className="mt-1 flex items-center justify-between">
            <span className="text-dnd-muted">
              {request.kind === 'save'
                ? `Tu bono (${ABILITY_LABELS[request.ability!]})`
                : request.kind === 'initiative'
                ? 'Tu bono (DES)'
                : skill
                ? `Tu bono (${ABILITY_LABELS[skillAbility(skill) ?? 'dex']})`
                : 'Elige una habilidad'}
            </span>
            <span className="font-bold text-dnd-text">{bonus >= 0 ? `+${bonus}` : bonus}</span>
          </p>
        </div>

        {request.kind === 'skill' && (request.skills ?? []).length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dnd-muted">
              Tu habilidad (elige una)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {request.skills!.map((s) => {
                const sel = skill === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSkill(s)}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors ${
                      sel
                        ? 'border-dnd-gold bg-dnd-gold/20 text-dnd-gold'
                        : 'border-dnd-leather/30 bg-dnd-leather/5 text-dnd-text hover:bg-dnd-leather/15'
                    }`}
                  >
                    {s}
                    {((player?.skills ?? []).includes(s) || !player) && sel && (
                      <span className="ml-1 text-[9px] uppercase text-emerald-400">comp</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {sent ? (
          <div className="rounded-lg border border-dnd-leather/20 bg-dnd-leather/10 px-3 py-4 text-center">
            <p className="text-sm text-emerald-300">Resultado enviado al DM ✔</p>
            <p className="mt-1 text-xs text-dnd-muted">
              {request.kind === 'skill' ? `${skill}: ` : ''}
              {breakdown}
              {request.dc !== undefined ? (success ? ' · ÉXITO' : ' · FALLO') : ''}
              {request.kind === 'initiative' ? ` · Iniciativa ${result}` : ''}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                onClick={rollRandom}
                icon={<Dices size={15} />}
                disabled={manual.trim() !== '' || skillInvalid}
              >
                Tirar d20
              </Button>
              <div className="flex flex-1 items-center gap-1.5">
                <label htmlFor="roll-manual" className="sr-only">Valor del d20</label>
                <input
                  id="roll-manual"
                  type="number"
                  min={1}
                  max={20}
                  value={manual}
                  onChange={(e) => {
                    setManual(e.target.value);
                    setDie(null);
                  }}
                  placeholder="dado"
                  className="input h-9 w-20 px-2 text-center text-sm"
                />
                <Button variant="ghost" size="sm" onClick={resetRoll} title="Reiniciar tirada">
                  <RotateCcw size={14} />
                </Button>
              </div>
            </div>

            {manualInvalid && (
              <p className="text-xs text-red-300">El dado debe estar entre 1 y 20.</p>
            )}
            {skillInvalid && (
              <p className="text-xs text-red-300">Elige una de las habilidades habilitadas.</p>
            )}

            {hasDie && !manualInvalid && (
              <div
                className={`rounded-lg border px-3 py-2 text-center text-sm font-bold ${
                  showOutcome
                    ? success
                      ? 'border-emerald-400/40 bg-emerald-950/30 text-emerald-300'
                      : 'border-red-400/40 bg-red-950/30 text-red-300'
                    : 'border-dnd-leather/30 bg-dnd-leather/10 text-dnd-text'
                }`}
              >
                {request.kind === 'skill' ? `${skill}: ` : ''}
                {breakdown}
                {request.kind === 'initiative' && <span className="ml-2">· 🏁 Iniciativa {result}</span>}
                {showOutcome && <span className="ml-2">({success ? '✔ ÉXITO' : '✖ FALLO'})</span>}
              </div>
            )}

            <Button
              variant="secondary"
              onClick={submit}
              disabled={!hasDie || manualInvalid || skillInvalid || !code || !player}
              icon={<Send size={15} />}
            >
              Enviar al DM
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};
