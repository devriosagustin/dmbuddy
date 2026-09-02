// ============================================================
// Vista de combate (Jugador): mapa de solo lectura con cortina de
// guerra. Los enemigos solo aparecen dentro del radio de visión de
// alguna ficha aliada; su vida sale como "??? " salvo que el DM la
// revele. Las trampas/tesoros/investigación solo si el DM las revela.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, MapPin, Scan, Swords, Radio, Maximize, Minimize, MessageSquare, Dices } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useSessionStore } from '../../store/sessionStore';
import { usePlayerStore } from '../../store/playerStore';
import { useFullscreen } from '../../hooks/useFullscreen';
import {
  isEnemyRevealed,
  isTileRevealed,
} from '../../services/firebaseSync';
import {
  gridDistanceFeet,
  hasTile,
  hasLineOfSight,
} from '../../utils/mapUtils';
import { mapCreatureToCombatant } from '../../utils/combatUtils';
import type { Combatant, MapCreature } from '../../types';
import { PlayerPartyDetail } from './PlayerPartyDetail';
import { ChatPanel } from './ChatPanel';
import { PlayerRollModal } from '../session/PlayerRollModal';

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
  const role = useSessionStore((s) => s.role);
  const activePlayerId = useSessionStore((s) => s.activePlayerId);
  const setActivePlayer = useSessionStore((s) => s.setActivePlayer);
  const localPlayers = usePlayerStore((s) => s.players);

  const [selected, setSelected] = useState<Combatant | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [rollDismissed, setRollDismissed] = useState<string | null>(null);
  const [mapSize, setMapSize] = useState({ w: 0, h: 0 });
  const { isFullscreen, toggle: toggleFullscreen, targetRef: rootRef, overlayClass } = useFullscreen();
  const measureRef = useRef<HTMLDivElement>(null);

  const snapshot = remoteCombat?.snapshot ?? null;
  const visionRange = remoteCombat?.settings?.visionRange ?? 30;
  const mapCols = remoteCombat?.settings?.mapCols ?? 28;
  const mapRows = remoteCombat?.settings?.mapRows ?? 16;
  const participants = snapshot?.participants ?? [];
  const tiles = snapshot?.tiles ?? [];
  const mapCreatures: MapCreature[] = snapshot?.mapCreatures ?? [];

  // En exploración (sin combate activo) los tokens provienen de las criaturas
  // persistentes del mapa + los miembros del party del DM (partyCombatants,
  // que el DM publica con sus datos y su posición; son siempre visibles); en
  // combate, de la lista de iniciativa.
  const inCombat = !!snapshot?.isActive;
  const tokens: Combatant[] = inCombat
    ? participants
    : [...mapCreatures.map((c) => mapCreatureToCombatant(c)), ...(snapshot?.partyCombatants ?? [])];

  // Dimensionado del mapa: celdas cuadradas que quepan en el área disponible.
  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const cellSize = Math.max(1, Math.floor(Math.min(width / mapCols, height / mapRows)));
      setMapSize({ w: cellSize * mapCols, h: cellSize * mapRows });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [mapCols, mapRows]);

  // El jugador debe elegir qué personaje trae a la sesión antes de participar.
  const activeValid = !!activePlayerId && localPlayers.some((p) => p.id === activePlayerId);
  const needsPick = role === 'player' && !activeValid;

  // Petición de tirada vigente dirigida a este jugador.
  const pendingRoll =
    snapshot?.rollRequest && activeValid && snapshot.rollRequest.playerId === activePlayerId
      ? snapshot.rollRequest
      : null;
  const showRollModal = pendingRoll !== null && rollDismissed !== pendingRoll.id;

  // Si el jugador conectado no ha elegido qué personaje trae, se lo pedimos antes de nada.
  if (needsPick) {
    return (
      <div className="card flex min-h-60 flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <Dices size={28} className="text-dnd-gold" aria-hidden="true" />
        <h2 className="page-title">¿Qué personaje traes?</h2>
        {localPlayers.length === 0 ? (
          <p className="max-w-md text-sm text-dnd-muted">
            No tienes personajes en tu party local. Créalos en la sección Party para poder jugar en la sesión.
          </p>
        ) : (
          <>
            <p className="max-w-md text-sm text-dnd-muted">
              Elegí cuál de tus personajes llevás a esta partida. El DM lo verá y podrá pedirte tiradas.
            </p>
            <div className="flex w-full max-w-sm flex-col gap-2">
              {localPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePlayer(p.id)}
                  className="flex items-center justify-between rounded-lg border border-dnd-leather/30 bg-dnd-leather/5 px-4 py-3 text-left transition-colors hover:border-dnd-gold/60 hover:bg-dnd-leather/10"
                >
                  <span>
                    <span className="block text-sm font-bold text-dnd-text">{p.name}</span>
                    <span className="block text-xs text-dnd-muted">
                      {p.class} · Nv. {p.level} · {p.hp}/{p.maxHp} PG
                    </span>
                  </span>
                  <span className="text-xs font-bold text-dnd-gold">Elegir →</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="card flex min-h-60 flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dnd-leather/40 bg-dnd-leather/10 text-3xl">
          <Swords size={26} aria-hidden="true" />
        </span>
        <h2 className="page-title">Esperando al DM…</h2>
        {code ? (
          <p className="max-w-md text-sm text-dnd-muted">
            Estás conectado a la sesión <span className="font-mono font-bold text-dnd-gold">{code}</span>. Cuando el DM
            comparta su mapa, lo verás aquí.
          </p>
        ) : (
          <p className="max-w-md text-sm text-dnd-muted">
            Únete a una sesión con el código de tu DM para ver el mapa en tiempo real.
          </p>
        )}
      </div>
    );
  }

  // El DM tiene el mapa oculto: la party ve una pantalla de espera.
  if (!snapshot.mapVisible) {
    return (
      <div className="card flex min-h-60 flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dnd-leather/40 bg-dnd-leather/10 text-3xl">
          🗺
        </span>
        <h2 className="page-title">El DM está preparando el mapa…</h2>
        <p className="max-w-md text-sm text-dnd-muted">
          El mapa aparecerá aquí en cuanto el DM lo haga visible. Mientras tanto podés leer el lore en el chat.
        </p>
        {(snapshot.chat?.length ?? 0) > 0 && (
          <button
            type="button"
            onClick={() => setShowChat((v) => !v)}
            aria-expanded={showChat}
            className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-dnd-leather/40 bg-dnd-leather/10 px-3 py-1.5 text-xs text-dnd-text transition-colors hover:bg-dnd-leather/20"
          >
            <MessageSquare size={12} />
            {showChat ? 'Ocultar chat' : 'Ver chat / lore'}
          </button>
        )}
        {showChat && (
          <div className="card h-48 w-full max-w-md shrink-0 overflow-hidden p-3 text-left">
            <ChatPanel messages={snapshot.chat ?? []} readOnly />
          </div>
        )}
      </div>
    );
  }

  // --- Cortina de guerra (siempre, en combate y en exploración) ------------
  // Aliados del party que comparten visión: en combate, los participantes
  // aliados; en exploración, las fichas del party (y NPCs aliados/neutros).
  const friendlies = tokens.filter(isFriendly);

  // Enemigos visibles: dentro del radio de visión de algún aliado Y con línea
  // de visión no bloqueada (muros o puertas cerradas). El fog of war se aplica
  // siempre, incluso sin combate activo; los del party siempre son visibles.
  const visibleTokens = tokens.filter((c) => {
    if (isFriendly(c)) return true;
    if (c.x === undefined || c.y === undefined) return false;
    const cx = c.x;
    const cy = c.y;
    return friendlies.some((f) => {
      const fx = f.x;
      const fy = f.y;
      if (fx === undefined || fy === undefined) return false;
      if (gridDistanceFeet({ x: fx, y: fy }, { x: cx, y: cy }) > visionRange) return false;
      return hasLineOfSight(fx, fy, cx, cy, tiles);
    });
  });

  // Tiles visibles: muros y puertas siempre; trampa/tesoro/investigación solo si revelados.
  const visibleTiles = tiles.filter((t) => {
    if (t.type === 'wall' || t.type === 'door') return true;
    return isTileRevealed(snapshot, t.x, t.y);
  });

  const revealedCount = (snapshot.revealedEnemyIds ?? []).length;
  const revealedTilesCount = (snapshot.revealedTileKeys ?? []).length;

  // Nombre del combatiente al que le toca el turno: oculto si es un enemigo
  // que tu party no ve todavía.
  const turnCombatant = inCombat && snapshot.turn >= 0 ? tokens[snapshot.turn] : undefined;
  const turnNameVisible =
    !turnCombatant || isFriendly(turnCombatant) || visibleTokens.includes(turnCombatant);

  const cellColPct = 100 / mapCols;
  const cellRowPct = 100 / mapRows;

  // Reparto de XP del combate que acaba de terminar (para este jugador).
  const localIds = new Set(localPlayers.map((p) => p.id));
  const myAwards = (snapshot.xpAwards ?? []).filter((a) => localIds.has(a.playerId));
  const myXpTotal = myAwards.reduce((sum, a) => sum + a.xp, 0);

  return (
    <div ref={rootRef} className={`flex h-full min-h-0 flex-col gap-3 ${overlayClass ?? ''}`}>
      {/* Aviso de combate finalizado (reparto de XP) */}
      {!inCombat && snapshot.xpAwards !== undefined && snapshot.xpAwards.length >= 0 && (
        <div className="card border-dnd-gold/40 p-4">
          <h3 className="flex items-center gap-2 font-fantasy text-lg font-bold text-dnd-gold">
            <Swords size={18} aria-hidden="true" /> Combate finalizado
          </h3>
          {myAwards.length > 0 ? (
            <>
              <p className="mt-1 text-sm text-dnd-text">
                Tu party ganó <span className="font-bold text-dnd-gold">{myXpTotal} XP</span> en total.
                {myAwards.some((a) => a.leveledUp) && (
                  <span className="ml-1 text-emerald-300">¡Algún personaje subió de nivel!</span>
                )}
              </p>
              <ul className="mt-2 space-y-1">
                {myAwards.map((a) => (
                  <li key={a.playerId} className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-dnd-text">{a.name}</span>
                    <span className="text-dnd-muted">
                      +{a.xp} XP{a.leveledUp ? ` · Nivel ${a.level}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-1 text-sm text-dnd-muted">El combate terminó sin reparto de XP para tu party.</p>
          )}
        </div>
      )}

      {/* Cabecera informativa */}
      <div className="card flex flex-wrap items-center justify-between gap-2 py-2.5 px-3">
        <div className="flex items-center gap-2 text-sm">
          {inCombat ? (
            <>
              <span className="rounded-md bg-dnd-leather/40 px-2 py-0.5 text-[11px] font-bold uppercase text-dnd-muted">
                Ronda {snapshot.round}
              </span>
              {snapshot.turn >= 0 && tokens[snapshot.turn] && (
                <span className="flex items-center gap-1 text-dnd-muted">
                  <MapPin size={13} className="text-dnd-gold" />
                  Turno de{' '}
                  <span className="font-bold text-dnd-text">
                    {turnNameVisible ? tokens[snapshot.turn]?.name : '??????'}
                  </span>
                </span>
              )}
            </>
          ) : (
            <span className="flex items-center gap-2 text-dnd-muted">
              <MapPin size={14} className="text-dnd-gold" />
              <span className="font-bold uppercase tracking-wide text-dnd-text">Exploración</span>
              {visibleTokens.length > 0 && <span>· {visibleTokens.length} ficha(s) a la vista</span>}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-dnd-muted">
          {inCombat && (
            <>
              <span className="flex items-center gap-1.5">
                <Scan size={12} className="text-sky-400" /> Visión: {visionRange} pies
              </span>
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
            </>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 rounded-full bg-dnd-leather/30 px-2.5 py-1 font-bold text-dnd-muted transition-colors hover:text-dnd-text"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
          >
            {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
            {isFullscreen ? 'Salir' : 'Pantalla completa'}
          </button>
          <button
            type="button"
            onClick={() => setShowChat((v) => !v)}
            aria-expanded={showChat}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold transition-colors ${
              showChat
                ? 'bg-dnd-gold text-dnd-ink'
                : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
            }`}
            title="Chat / lore del DM"
          >
            <MessageSquare size={12} />
            Chat {(snapshot.chat ?? []).length > 0 && `(${(snapshot.chat ?? []).length})`}
          </button>
        </div>
      </div>

      {/* Mapa de solo lectura */}
      <div ref={measureRef} className="card flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3">
        <div
          className="relative overflow-hidden rounded-dnd-lg border border-dnd-leather/40 bg-dnd-ink/40"
          style={{ width: mapSize.w || '100%', height: mapSize.h || '100%' }}
          aria-label={inCombat ? 'Mapa de combate (vista de jugador)' : 'Mapa del DM (exploración)'}
          role="img"
        >
          {/* Fondo */}
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${mapCols}, 1fr)`, gridAutoRows: '1fr' }} aria-hidden="true">
            {Array.from({ length: mapCols * mapRows }, (_, i) => {
              const x = i % mapCols;
              const y = Math.floor(i / mapCols);
              return <div key={i} className={`${cellClass(x, y)} border-r border-b border-dnd-ink/70`} />;
            })}
          </div>

          {/* Tiles visibles */}
          {visibleTiles.length > 0 && (
            <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${mapCols}, 1fr)`, gridAutoRows: '1fr' }} aria-hidden="true">
              {Array.from({ length: mapCols * mapRows }, (_, i) => {
                const x = i % mapCols;
                const y = Math.floor(i / mapCols);
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
                } else if (tile.type === 'door') {
                  baseClass = tile.open === true
                    ? 'bg-emerald-700/40 flex items-center justify-center'
                    : 'bg-amber-950/90 flex items-center justify-center';
                  icon = tile.open === true ? '🚪' : '🔒';
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

      {/* Detalle de ficha seleccionada: ficha completa para el party, resumen para el resto */}
      {selected?.type === 'player' ? (
        <PlayerPartyDetail
          combatant={selected}
          onClose={() => setSelected(null)}
        />
      ) : (
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
      )}

      {/* Chat / lore del DM en vivo */}
      {showChat && (
        <div className="card h-48 shrink-0 overflow-hidden p-3">
          <ChatPanel messages={snapshot.chat ?? []} readOnly />
        </div>
      )}

      {/* Petición de tirada del DM */}
      {showRollModal && pendingRoll && (
        <PlayerRollModal
          request={pendingRoll}
          onClose={() => setRollDismissed(pendingRoll.id)}
        />
      )}

      <p className="text-[10px] text-dnd-muted">
        {inCombat
          ? 'Vista de jugador: solo ves lo que tu party puede percibir. Los aliados comparten su visión (radio ' +
            `${visionRange} pies), pero los muros y las puertas cerradas bloquean la línea de vista. 🔒 Puerta cerrada · 🚪 Puerta abierta.`
          : 'Estás en modo exploración. Tu party siempre ve los aliados en el mapa, pero los enemigos solo aparecen cuando están en el campo de visión de algún personaje del party (respetando el fog of war). 🔒 Puerta cerrada · 🚪 Puerta abierta.'}
      </p>
    </div>
  );
};

export default PlayerCombatView;
