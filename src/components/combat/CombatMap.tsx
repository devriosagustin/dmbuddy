// ============================================================
// Mapa de combate (cuadrícula)
// Muestra las fichas de los combatientes y permite moverlas
// arrastrándolas; un clic sin arrastrar abre sus acciones.
// ============================================================

import { useMemo, useRef, useState } from 'react';
import type { Combatant } from '../../types';
import type { MapCell } from '../../utils/mapUtils';
import { MAP_COLS, MAP_ROWS, inBounds, FEET_PER_CELL } from '../../utils/mapUtils';

interface CombatMapProps {
  participants: Combatant[];
  /** Id del combatiente cuyo turno es ahora (para resaltarlo). */
  activeId?: string | null;
  onOpenActions: (combatant: Combatant) => void;
  /** Mueve una ficha a una casilla (acción del store). */
  onMove: (id: string, x: number, y: number) => void;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  moved: boolean;
}

/** Devuelve la celda bajo un evento puntero, o null si está fuera. */
const cellFromPointer = (e: React.PointerEvent, gridRect: DOMRect): MapCell | null => {
  if (gridRect.width <= 0 || gridRect.height <= 0) return null;
  const cellW = gridRect.width / MAP_COLS;
  const cellH = gridRect.height / MAP_ROWS;
  const x = Math.floor((e.clientX - gridRect.left) / cellW);
  const y = Math.floor((e.clientY - gridRect.top) / cellH);
  if (!inBounds(x, y)) return null;
  return { x, y };
};

export const CombatMap = ({ participants, activeId, onOpenActions, onMove }: CombatMapProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hover, setHover] = useState<MapCell | null>(null);

  const byCell = useMemo(() => {
    const map = new Map<string, MapCell>();
    for (const p of participants) {
      if (p.x !== undefined && p.y !== undefined) map.set(p.id, { x: p.x, y: p.y });
    }
    return map;
  }, [participants]);

  const tokenAt = (cell: MapCell): Combatant | undefined =>
    participants.find((p) => p.x === cell.x && p.y === cell.y);

  const handleDown = (e: React.PointerEvent, combatant: Combatant) => {
    if (e.button !== 0) return;
    gridRef.current?.setPointerCapture(e.pointerId);
    setDrag({ id: combatant.id, startX: e.clientX, startY: e.clientY, moved: false });
    setHover({ x: combatant.x ?? 0, y: combatant.y ?? 0 });
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!drag || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const cell = cellFromPointer(e, rect);
    setHover(cell);
    const distance = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (!drag.moved && distance > 6) {
      setDrag({ ...drag, moved: true });
    }
  };

  const handleUp = (_e: React.PointerEvent) => {
    if (!drag) return;
    if (drag.moved && hover) {
      onMove(drag.id, hover.x, hover.y);
    } else if (!drag.moved) {
      const target =
        hover && (byCell.get(drag.id)?.x === hover.x && byCell.get(drag.id)?.y === hover.y)
          ? tokenAt(hover)
          : undefined;
      if (target) onOpenActions(target);
    }
    setDrag(null);
    setHover(null);
  };

  const cellClass = (x: number, y: number): string => {
    const isHover = hover?.x === x && hover?.y === y;
    const base = (x + y) % 2 === 0 ? 'bg-dnd-leather/[0.05]' : 'bg-dnd-leather/[0.09]';
    return `${base} ${isHover ? 'bg-dnd-gold/30' : ''}`;
  };

  const cellColPct = 100 / MAP_COLS;
  const cellRowPct = 100 / MAP_ROWS;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[11px] text-dnd-muted">
        <span>
          Mapa · {MAP_COLS}×{MAP_ROWS} · <span className="text-dnd-text">{FEET_PER_CELL} pies/casilla</span>
        </span>
        <span>
          {drag?.moved
            ? 'Arrastra para mover'
            : 'Arrastra una ficha para moverla · clic para abrir acciones'}
        </span>
      </div>

      <div
        ref={gridRef}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        className="relative w-full overflow-hidden rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/40"
        style={{
          aspectRatio: `${MAP_COLS} / ${MAP_ROWS}`,
          touchAction: 'none',
        }}
        aria-label="Mapa de combate"
        role="grid"
      >
        {/* Casillas de fondo */}
        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${MAP_COLS}, 1fr)`, gridAutoRows: '1fr' }}
          aria-hidden="true"
        >
          {Array.from({ length: MAP_COLS * MAP_ROWS }, (_, i) => {
            const x = i % MAP_COLS;
            const y = Math.floor(i / MAP_COLS);
            return <div key={i} className={cellClass(x, y)} />;
          })}
        </div>

        {/* Eje de referencia de coordenadas (arriba/izquierda) */}
        <div className="pointer-events-none absolute left-1 top-0.5 text-[9px] leading-none text-dnd-muted/60">
          A
        </div>

        {/* Fichas */}
        {participants.map((combatant) => {
          if (combatant.x === undefined || combatant.y === undefined) return null;
          const isPlayer = combatant.type === 'player';
          const isActive = combatant.id === activeId;
          const isDragging = drag?.id === combatant.id;
          // Duplicados en la misma celda: apiñarlos ligeramente.
          const inSame = participants.filter((p) => p.x === combatant.x && p.y === combatant.y);
          const dupIndex = inSame.findIndex((p) => p.id === combatant.id);
          const offsetX = inSame.length > 1 ? (dupIndex % 2) * 30 - 15 : 0;
          const offsetY = inSame.length > 1 ? Math.floor(dupIndex / 2) * 30 - 15 : 0;

          return (
            <div
              key={combatant.id}
              role="gridcell"
              aria-label={`${combatant.name}, ${isPlayer ? 'Jugador' : 'Monstruo'}, casilla ${combatant.x},${combatant.y}`}
              className="absolute flex items-center justify-center"
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
                onPointerDown={(e) => handleDown(e, combatant)}
                className={`flex h-[82%] w-[72%] items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg outline-none ring-2 ring-transparent transition-all focus:ring-dnd-gold ${
                  isPlayer
                    ? 'border-emerald-400 bg-emerald-950/90 text-emerald-100'
                    : 'border-red-500 bg-red-950/90 text-red-100'
                } ${isActive ? 'ring-2 ring-dnd-gold shadow-dnd-glow' : ''} ${
                  combatant.isDead ? 'opacity-40 grayscale' : ''
                } ${isDragging ? 'z-20 cursor-grabbing ring-2 ring-dnd-gold' : 'cursor-grab hover:scale-110'}`}
                title={`${combatant.name} · ${combatant.hp}/${combatant.maxHp} PG · (${combatant.x},${combatant.y})`}
              >
                {combatant.name.charAt(0).toUpperCase()}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-dnd-muted">
        Las fichas en la misma casilla se muestran apiñadas. Mueve fichas arrastrándolas para separarlas.
      </p>
    </div>
  );
};

export default CombatMap;