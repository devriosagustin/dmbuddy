// ============================================================
// Vista de combate (Jugador): mapa de solo lectura con cortina de
// guerra. Los enemigos solo aparecen dentro del radio de visión de
// alguna ficha aliada; su vida sale como "??? " salvo que el DM la
// revele. Las trampas/tesoros/investigación solo si el DM las revela.
// ============================================================

import { useState } from 'react';
import { Eye, EyeOff, MapPin, Scan, Swords, Radio } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useSessionStore } from '../../store/sessionStore';
import {
  isEnemyRevealed,
  isTileRevealed,
} from '../../services/firebaseSync';
import {
  gridDistanceFeet,
  hasTile,
  MAP_COLS,
  MAP_ROWS,
} from '../../utils/mapUtils';
import type { Combatant } from '../../types';

/** Aliados del party: jugadores, rehenes y NPCs aliados/neutrales. */
const isFriendly = (c: Combatant): boolean =>
  c.type === 'player' ||
  (c.type === 'npc' && c.npcRole !== 'enemy');

/** Fichas enemigas con la vida oculta hasta que el DM la revele. */
const isHiddenHostile = (c: Combatant): boolean =>
  c.type === 'monster' || (c.type === 'npc' && c.npcRole === 'enemy');

const cellClass = (x: number, y: number): string =>
  (x + y) % 2 === 0 ? 'bg-dnd-leather/[0.09]' : 'bg-dnd-leather/[0.18]';

const tokenClass = (c: Combatant): string => {
  const isPlayer = c.type === 'player';
  const isNpc = c.type === 'npc';
  if (isPlayer) return 'border-emerald-400 bg-emerald-950/90 text-emerald-100';
  if (isNpc && c.npcRole === 'ally') return 'border-sky-400 bg-sky-950/90 text-sky-100';
  if (isNpc && c.npcRole === 'neutral') return 'border-stone-400 bg-stone-900/90 text-stone-200';
  if (isNpc && c.npcRole === 'enemy') return 'border-orange-400 bg-orange-950/90 text-orange-100';
  if (isNpc) return 'border-violet-400 bg-violet-950/90 text-violet-100';
  return 'border-red-500 bg-red-950/90 text-red-100';
};

/**
 * Mapa leído en vivo desde la sesión del DM, con cortina de guerra aplicada
 * en el cliente (los jugadores solo ven lo que su party podría ver).
 */
export const PlayerCombatView = () => {
  const remoteCombat = useSessionStore((s) => s.remoteCombat);
  const code = useSessionStore((s) => s.code);

  const [selected, setSelected] = useState<Combatant | null>(null);

  const snapshot = remoteCombat?.snapshot ?? null;
  const visionRange = remoteCombat?.settings?.visionRange ?? 30;
  const participants = snapshot?.participants ?? [];
  const tiles = snapshot?.tiles ?? [];

  if (!snapshot || !snapshot.isActive) {
    return (
      <div className="card flex min-h-60 flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dnd-leather/40 bg-dnd-leather/10 text-3xl">
          <Swords size={26} aria-hidden="true" />
        </span>
        <h2 className="page-title">Esperando al DM…</h2>
        {code ? (
          <p className="max-w-md text-sm text-dnd-muted">
            Estás conectado a la sesión <span className="font-mono font-bold text-dnd-gold">{code}</span>. Cuando el DM
            inicie un combate activo, verás aquí el mapa de tu party.
          </p>
        ) : (
          <p className="max-w-md text-sm text-dnd-muted">
            Únete a una sesión con el código de tu DM para ver el mapa de combate en tiempo real.
          </p>
        )}
      </div>
    );
  }

  // --- Cortina de guerra ------------------------------------------------
  const friendlies = participants.filter(isFriendly);
  const hiddenHostiles = participants.filter((c) => isHiddenHostile(c) || (c.type === 'npc' && c.npcRole === 'enemy'));

  const visibleTokens = participants.filter((c) => {
    if (isFriendly(c)) return true;
    // Enemigo: visible si está dentro del radio de visión de algún aliado.
    if (c.x === undefined || c.y === undefined) return false;
    const cx = c.x;
    const cy = c.y;
    return friendlies.some((f) => {
      const fx = f.x;
      const fy = f.y;
      return fx !== undefined && fy !== undefined && gridDistanceFeet({ x: fx, y: fy }, { x: cx, y: cy }) <= visionRange;
    });
  });

  // Tiles visibles: muros siempre; trampa/tesoro/investigación solo si revelados.
  const visibleTiles = tiles.filter((t) => {
    if (t.type === 'wall') return true;
    return isTileRevealed(snapshot, t.x, t.y);
  });

  const hostileHiddenCount = hiddenHostiles.filter((h) => !visibleTokens.includes(h)).length;
  const revealedCount = (snapshot.revealedEnemyIds ?? []).length;
  const revealedTilesCount = (snapshot.revealedTileKeys ?? []).length;

  const cellColPct = 100 / MAP_COLS;
  const cellRowPct = 100 / MAP_ROWS;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Cabecera informativa */}
      <div className="card flex flex-wrap items-center justify-between gap-2 py-2.5 px-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-md bg-dnd-leather/40 px-2 py-0.5 text-[11px] font-bold uppercase text-dnd-muted">
            Ronda {snapshot.round}
          </span>
          {snapshot.turn >= 0 && participants[snapshot.turn] && (
            <span className="flex items-center gap-1 text-dnd-muted">
              <MapPin size={13} className="text-dnd-gold" />
              Turno de{' '}
              <span className="font-bold text-dnd-text">{participants[snapshot.turn]?.name}</span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-dnd-muted">
          <span className="flex items-center gap-1.5">
            <Scan size={12} className="text-sky-400" /> Visión: {visionRange} pies
          </span>
          {hostileHiddenCount > 0 && (
            <span className="flex items-center gap-1.5">
              <EyeOff size={12} /> {hostileHiddenCount} fuera de tu visión
            </span>
          )}
          {revealedCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Eye size={12} className="text-emerald-400" /> {revealedCount} enemigo(s) con vida visible
            </span>
          )}
          {revealedTilesCount > 0 && (
            <span className="flex items-center gap-1.5">
              <Radio size={12} className="text-amber-400" /> {revealedTilesCount} lugar(es) investigado(s)
            </span>
          )}
        </div>
      </div>

      {/* Mapa de solo lectura */}
      <div className="card flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
        <div
          className="relative max-h-full max-w-full overflow-hidden rounded-dnd-lg border border-dnd-leather/40 bg-dnd-ink/40"
          style={{ aspectRatio: `${MAP_COLS}/${MAP_ROWS}`, width: '100%' }}
          aria-label="Mapa de combate (vista de jugador)"
          role="img"
        >
          {/* Fondo */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${MAP_COLS}, 1fr)`, gridAutoRows: '1fr' }} aria-hidden="true">
            {Array.from({ length: MAP_COLS * MAP_ROWS }, (_, i) => {
              const x = i % MAP_COLS;
              const y = Math.floor(i / MAP_COLS);
              return <div key={i} className={`${cellClass(x, y)} border-r border-b border-dnd-ink/70`} />;
            })}
          </div>

          {/* Tiles visibles */}
          {visibleTiles.length > 0 && (
            <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${MAP_COLS}, 1fr)`, gridAutoRows: '1fr' }} aria-hidden="true">
              {Array.from({ length: MAP_COLS * MAP_ROWS }, (_, i) => {
                const x = i % MAP_COLS;
                const y = Math.floor(i / MAP_COLS);
                const tile = visibleTiles.find((t) => t.x === x && t.y === y);
                if (!tile) return <div key={i} />;
                let baseClass = '';
                let icon = '';
                if (tile.type === 'wall') {
                  const openTop = !hasTile(visibleTiles, x, y - 1, 'wall');
                  const openBottom = !hasTile(visibleTiles, x, y + 1, 'wall');
                  const openLeft = !hasTile(visibleTiles, x - 1, y, 'wall');
                  const openRight = !hasTile(visibleTiles, x + 1, y, 'wall');
                  baseClass = `bg-dnd-ink/95 ${openTop ? 'border-t-2 border-red-400' : ''} ${openBottom ? 'border-b-2 border-red-400' : ''} ${openLeft ? 'border-l-2 border-red-400' : ''} ${openRight ? 'border-r-2 border-red-400' : ''}`;
                } else if (tile.type === 'trap') {
                  baseClass = 'bg-red-900/40 flex items-center justify-center';
                  icon = 'X';
                } else if (tile.type === 'treasure') {
                  baseClass = 'bg-yellow-600/50 flex items-center justify-center';
                  icon = '🟨';
                } else if (tile.type === 'investigation') {
                  baseClass = 'bg-blue-600/50 flex items-center justify-center';
                  icon = '🔍';
                }
                return (
                  <div key={i} className={baseClass}>
                    {icon && <span className="text-[10px] leading-none text-white/90">{icon}</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Fichas visibles */}
          {visibleTokens.map((combatant) => {
            if (combatant.x === undefined || combatant.y === undefined) return null;
            const friendly = isFriendly(combatant);
            const hostile = !friendly;
            const inSame = visibleTokens.filter((p) => p.x === combatant.x && p.y === combatant.y);
            const dupIndex = inSame.findIndex((p) => p.id === combatant.id);
            const offsetX = inSame.length > 1 ? (dupIndex % 2) * 30 - 15 : 0;
            const offsetY = inSame.length > 1 ? Math.floor(dupIndex / 2) * 30 - 15 : 0;

            return (
              <div
                key={combatant.id}
                className="absolute z-10 flex items-center justify-center"
                style={{
                  width: `${cellColPct}%`,
                  height: `${cellRowPct}%`,
                  left: `${combatant.x * cellColPct}%`,
                  top: `${combatant.y * cellRowPct}%`,
                  transform: `translate(${offsetX}%, ${offsetY}%)`,
                  transition: 'left 120ms ease, top 120ms ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelected(combatant)}
                  className={`relative flex h-[82%] w-[72%] items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg outline-none transition-all focus:ring-dnd-gold ${tokenClass(combatant)} ${
                    combatant.isDead ? 'opacity-40 grayscale' : ''
                  } ${hostile ? 'cursor-help' : 'cursor-pointer'}`}
                >
                  {combatant.name.charAt(0).toUpperCase()}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalle de ficha seleccionada */}
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle={selected ? (isFriendly(selected) ? 'Aliado del party' : isHiddenHostile(selected) ? 'Enemigo en tu visión' : 'Personaje') : undefined}
        maxWidth="sm"
      >
        {selected && (
          <div className="flex flex-col gap-3">
            {(isHiddenHostile(selected) && !isEnemyRevealed(snapshot, selected.id)) ? (
              <div className="flex items-center gap-2 rounded-lg border border-dnd-leather/30 bg-dnd-leather/5 px-3 py-2 text-sm text-dnd-muted">
                <EyeOff size={16} className="text-amber-400" />
                El DM aún no revela su estado. Su vida aparece como «??? » hasta que lo revele.
              </div>
            ) : (
              <div className="rounded-lg border border-dnd-leather/30 bg-dnd-leather/5 px-3 py-2 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-dnd-muted">PG</span>
                  <span className="font-bold text-dnd-text">
                    {isFriendly(selected) || isEnemyRevealed(snapshot, selected.id)
                      ? `${selected.hp}/${selected.maxHp}`
                      : '??? '}
                  </span>
                </p>
                {selected.armorClass > 0 && (
                  <p className="mt-1 flex items-center justify-between">
                    <span className="text-dnd-muted">CA</span>
                    <span className="font-bold text-dnd-text">{selected.armorClass}</span>
                  </p>
                )}
                {selected.speed !== undefined && (
                  <p className="mt-1 flex items-center justify-between">
                    <span className="text-dnd-muted">Velocidad</span>
                    <span className="font-bold text-dnd-text">{selected.speed} pies</span>
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-dnd-muted">
              Posición: ({selected.x}, {selected.y}) · {isHiddenHostile(selected) ? 'Enemigo dentro de tu radio de visión' : 'Información visible para tu party'}
            </p>
          </div>
        )}
      </Modal>

      <p className="text-[10px] text-dnd-muted">
        Vista de jugador: solo ves lo que tu party puede percibir. Los enemigos fuera de tu visión (radio {visionRange} pies desde tus aliados) permanecen ocultos.
      </p>
    </div>
  );
};

export default PlayerCombatView;