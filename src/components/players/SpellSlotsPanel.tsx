// ============================================================
// Panel de espacios de conjuro (spell slots) 2024 para un jugador
// ============================================================

import { Minus, Plus, Sparkles } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { clampUsedToMax, slotProgressionOf, spellSlotsMax } from '../../utils/spellcastingRules';

interface SpellSlotsPanelProps {
  playerId: string;
}

const LEVEL_TONES = [
  'bg-sky-900/70 text-sky-300',
  'bg-emerald-900/70 text-emerald-300',
  'bg-amber-900/70 text-amber-300',
  'bg-orange-900/70 text-orange-300',
  'bg-red-900/70 text-red-300',
  'bg-purple-900/70 text-purple-300',
  'bg-violet-900/70 text-violet-300',
  'bg-indigo-900/70 text-indigo-300',
  'bg-fuchsia-900/70 text-fuchsia-300',
];

/**
 * Bloques de espacios por nivel (totales y usados) con control +/− manual.
 * Se lee de la ficha viva del party, así mantenerlo desde el combate
 * mantiene sincronizadas las dos vistas.
 */
export const SpellSlotsPanel = ({ playerId }: SpellSlotsPanelProps) => {
  const player = usePlayerStore((s) => s.players.find((p) => p.id === playerId));
  const adjustSpellSlot = usePlayerStore((s) => s.adjustSpellSlot);

  if (!player) return null;

  const progression = slotProgressionOf(player.class);
  const max = spellSlotsMax(player.class, player.level);
  const used = clampUsedToMax(player.spellSlotsUsed ?? [], max);

  const rows = max
    .map((total, i) => ({ level: i + 1, total }))
    .filter((r) => r.total > 0);

  if (rows.length === 0) return null;

  const isPact = progression === 'pact';

  return (
    <div className="rounded-dnd-lg border border-dnd-leather/40 bg-dnd-ink/40 p-2.5">
      <p className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase text-dnd-gold">
        <Sparkles size={13} aria-hidden="true" /> Espacios de conjuro
        {isPact && <span className="badge text-[9px] text-dnd-muted">Pacto Mágico</span>}
      </p>
      <div className="flex flex-col gap-1">
        {rows.map(({ level, total }) => {
          const levelUsed = used[level - 1];
          return (
            <div
              key={level}
              className="flex items-center justify-between gap-2 rounded-md bg-dnd-dark/60 px-1.5 py-1"
            >
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold ${LEVEL_TONES[(level - 1) % LEVEL_TONES.length]}`}
                aria-hidden="true"
              >
                {level}
              </span>
              <span className="text-[11px] text-dnd-text">
                {isPact ? 'Espacios' : `Nivel ${level}`}
              </span>
              <span className="text-[11px] font-bold text-dnd-gold">
                {levelUsed}/{total}
              </span>
              <span className="flex items-center gap-0.5">
                <button
                  onClick={() => adjustSpellSlot(playerId, level, -1)}
                  disabled={levelUsed <= 0}
                  aria-label={`Recuperar 1 espacio de nivel ${level} (${player.name})`}
                  title="Recuperar 1 espacio"
                  className="rounded-md bg-dnd-gold/20 px-1.5 py-0.5 text-dnd-gold transition-colors hover:bg-dnd-gold/40 disabled:opacity-30"
                >
                  <Minus size={12} aria-hidden="true" />
                </button>
                <button
                  onClick={() => adjustSpellSlot(playerId, level, 1)}
                  disabled={levelUsed >= total}
                  aria-label={`Gastar 1 espacio de nivel ${level} (${player.name})`}
                  title="Gastar 1 espacio"
                  className="rounded-md bg-dnd-gold/20 px-1.5 py-0.5 text-dnd-gold transition-colors hover:bg-dnd-gold/40 disabled:opacity-30"
                >
                  <Plus size={12} aria-hidden="true" />
                </button>
              </span>
            </div>
          );
        })}
      </div>
      {isPact && (
        <p className="mt-1 text-[10px] text-dnd-muted">Los espacios del Brujo se recuperan en un descanso corto.</p>
      )}
    </div>
  );
};

export default SpellSlotsPanel;