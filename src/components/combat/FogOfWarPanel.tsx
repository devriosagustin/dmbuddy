// ============================================================
// Panel de cortina de guerra (solo DM): radio de visión, revelado
// de enemigos (vida) y de tiles (trampa/tesoro/investigación).
// ============================================================

import { Eye, EyeOff, Scan } from 'lucide-react';
import { tileKey } from '../../types/session';
import type { Combatant, MapTile, TileType } from '../../types';

interface FogOfWarPanelProps {
  participants: Combatant[];
  tiles: MapTile[];
  visionRange: number;
  revealedTileKeys: string[];
  revealedEnemyIds: string[];
  onToggleTile: (x: number, y: number) => void;
  onToggleEnemy: (id: string) => void;
  onVisionRange: (feet: number) => void;
}

const VISION_PRESETS = [5, 10, 15, 30, 60, 90, 120];

const isHostile = (c: Combatant): boolean =>
  c.type === 'monster' || (c.type === 'npc' && c.npcRole === 'enemy');

const hideableTileTypes: TileType[] = ['trap', 'treasure', 'investigation'];

const tileLabel: Record<'trap' | 'treasure' | 'investigation', string> = {
  trap: '✚ Trampa',
  treasure: '🟨 Tesoro',
  investigation: '🔍 Investigación',
};

/**
 * Controles para el DM: qué pueden ver los jugadores en el mapa. Todo lo que
 * se marque aquí se publica en la sesión y llega a los jugadores en vivo.
 */
export const FogOfWarPanel = ({
  participants,
  tiles,
  visionRange,
  revealedTileKeys,
  revealedEnemyIds,
  onToggleTile,
  onToggleEnemy,
  onVisionRange,
}: FogOfWarPanelProps) => {
  const hostiles = participants.filter(isHostile).filter((h) => h.x !== undefined && h.y !== undefined);
  const hideableTiles = tiles.filter((t) => hideableTileTypes.includes(t.type));

  return (
    <div className="mb-2 flex flex-col gap-2 rounded-dnd-lg border border-sky-500/25 bg-sky-500/[0.06] p-3">
      <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-300">
        <Eye size={13} /> Cortina de guerra
      </h3>

      {/* Radio de visión */}
      <div className="flex items-center gap-2">
        <label htmlFor="vision-range" className="flex items-center gap-1 text-[11px] text-dnd-muted">
          <Scan size={12} className="text-sky-400" /> Visión
        </label>
        <select
          id="vision-range"
          className="input h-8 flex-1 px-2 py-0 text-xs"
          value={visionRange}
          onChange={(e) => onVisionRange(Number(e.target.value))}
        >
          {VISION_PRESETS.map((r) => (
            <option key={r} value={r}>
              {r} pies
            </option>
          ))}
        </select>
      </div>

      {/* Enemigos */}
      {hostiles.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-dnd-muted">
            Vida visible ({revealedEnemyIds.length}/{hostiles.length})
          </span>
          <ul className="flex flex-col gap-1">
            {hostiles.map((h) => {
              const revealed = revealedEnemyIds.includes(h.id);
              return (
                <li key={h.id}>
                  <button
                    onClick={() => onToggleEnemy(h.id)}
                    aria-pressed={revealed}
                    className={`flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs font-bold transition-colors ${
                      revealed
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                        : 'border-dnd-leather/30 bg-dnd-leather/5 text-dnd-text hover:bg-dnd-leather/15'
                    }`}
                  >
                    <span className="truncate">{h.name}</span>
                    {revealed ? <Eye size={13} className="shrink-0 text-emerald-300" /> : <EyeOff size={13} className="shrink-0 text-dnd-muted" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Tiles ocultables */}
      {hideableTiles.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-dnd-muted">
            Lugares revelados ({revealedTileKeys.length}/{hideableTiles.length})
          </span>
          <ul className="flex flex-col gap-1">
            {hideableTiles.map((t) => {
              const key = tileKey(t.x, t.y);
              const revealed = revealedTileKeys.includes(key);
              return (
                <li key={key}>
                  <button
                    onClick={() => onToggleTile(t.x, t.y)}
                    aria-pressed={revealed}
                    className={`flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs font-bold transition-colors ${
                      revealed
                        ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                        : 'border-dnd-leather/30 bg-dnd-leather/5 text-dnd-text hover:bg-dnd-leather/15'
                    }`}
                  >
                    <span className="truncate">
                      {tileLabel[t.type as 'trap' | 'treasure' | 'investigation']} ({t.x},{t.y})
                    </span>
                    {revealed ? <Eye size={13} className="shrink-0 text-amber-300" /> : <EyeOff size={13} className="shrink-0 text-dnd-muted" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {hostiles.length === 0 && hideableTiles.length === 0 && (
        <p className="text-[11px] text-dnd-muted">
          Añade enemigos al combate o coloca trampas/tesoros para controlar su visibilidad.
        </p>
      )}
    </div>
  );
};

export default FogOfWarPanel;