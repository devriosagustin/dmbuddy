// ============================================================
// Mapa de combate (cuadrícula)
// Fichas movibles arrastrándolas + herramientas para medir
// distancias, ver el alcance (radio) de una ficha y pintar
// áreas de efecto (radio, cono, línea).
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Combatant, MapTile, TileType } from '../../types';
import type { MapCell } from '../../utils/mapUtils';
import type { MapLayout } from '../../utils/layoutPatterns';
import {
  MAP_COLS,
  MAP_ROWS,
  inBounds,
  isOccupied,
  isWall,
  hasTile,
  cellsInCone,
  cellsInLine,
  cellsInSphere,
  gridDistanceFeet,
} from '../../utils/mapUtils';

type Mode = 'move' | 'measure' | 'range' | 'aoe';
type AoeShape = 'sphere' | 'cone' | 'line';

interface CombatMapProps {
  participants: Combatant[];
  /** Id del combatiente cuyo turno es ahora (para resaltarlo). */
  activeId?: string | null;
  /** Id del combatiente que viene a continuación (para anticiparlo). */
  nextId?: string | null;
  /** Id del combatiente seleccionado (resalta sus movimientos posibles según su velocidad). */
  selectedId?: string | null;
  /** Tiles del mapa (muros, trampas, tesoros, investigación). */
  tiles: MapTile[];
  /** Tipo de tile seleccionado para colocar. */
  tileType: TileType;
  /** Cambia el tipo de tile seleccionado. */
  onTileTypeChange: (type: TileType) => void;
  /** Si el modo de colocar tiles está activo. */
  tileMode: boolean;
  /** Alterna el modo de colocar tiles. */
  onToggleTileMode: () => void;
  /** Alterna/coloca un tile del tipo seleccionado. */
  onToggleTile: (x: number, y: number, type: TileType) => void;
  /** Elimina todos los tiles del mapa. */
  onClearTiles: () => void;
  /** Exporta layouts guardados a JSON (descarga archivo). */
  onExportLayouts: () => void;
  /** Importa layouts desde archivo JSON (abre file picker). */
  onImportLayouts: () => void;
  /** Layouts de mapa guardados por el usuario. */
  savedLayouts: MapLayout[];
  /** Guarda el layout actual de tiles con un nombre. */
  onSaveLayout: (name: string) => void;
  /** Aplica (reemplaza) los tiles de un layout cargado. */
  onLoadLayout: (id: string) => void;
  /** Elimina un layout guardado. */
  onDeleteLayout: (id: string) => void;
  /** Aplica un layout aleatorio generado por patrón. */
  onRandomLayout: () => void;
  onOpenActions: (combatant: Combatant) => void;
  /** Mueve una ficha a una casilla (acción del store). */
  onMove: (id: string, x: number, y: number) => void;
  /** Selecciona (o deselecciona con null) una ficha en el mapa. */
  onSelect: (id: string | null) => void;
}

interface DragState {
  id: string;
  startX: number;
  startY: number;
  moved: boolean;
}
const cellFromPointer = (e: React.PointerEvent, gridRect: DOMRect): MapCell | null => {
  if (gridRect.width <= 0 || gridRect.height <= 0) return null;
  const cellW = gridRect.width / MAP_COLS;
  const cellH = gridRect.height / MAP_ROWS;
  const x = Math.floor((e.clientX - gridRect.left) / cellW);
  const y = Math.floor((e.clientY - gridRect.top) / cellH);
  if (!inBounds(x, y)) return null;
  return { x, y };
};

const SAME = <T,>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

const RANGE_PRESETS = [5, 10, 15, 30, 60, 90, 120];
const AOE_PRESETS = [5, 10, 15, 20, 30, 60];

export const CombatMap = ({ participants, activeId, nextId, selectedId, tiles, tileType, onTileTypeChange, tileMode, onToggleTileMode, onToggleTile, onClearTiles, onExportLayouts, onImportLayouts, savedLayouts, onSaveLayout, onLoadLayout, onDeleteLayout, onRandomLayout, onOpenActions, onMove, onSelect }: CombatMapProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('move');
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hover, setHover] = useState<MapCell | null>(null);

  // Herramienta «medir distancia».
  const [measureFrom, setMeasureFrom] = useState<MapCell | null>(null);
  // Herramienta «alcance».
  const [rangeSourceId, setRangeSourceId] = useState<string | null>(null);
  const [rangeFeet, setRangeFeet] = useState(30);
  // Herramienta «área de efecto».
  const [aoeSource, setAoeSource] = useState<MapCell | null>(null);
  const [aoeShape, setAoeShape] = useState<AoeShape>('sphere');
  const [aoeFeet, setAoeFeet] = useState(20);

  // Dimensionado del mapa: calcula el mayor tamaño con celdas cuadradas que
  // cabe en el área disponible (así no hay scroll y todo se ve completo).
  const measureRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ w: 0, h: 0 });

  // Panel de layouts de mapa.
  const [layoutsOpen, setLayoutsOpen] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const [layoutSel, setLayoutSel] = useState('');

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      // Celda cuadrada que quepa tanto por ancho como por alto.
      const cellSize = Math.max(1, Math.floor(Math.min(width / MAP_COLS, height / MAP_ROWS)));
      setMapSize({ w: cellSize * MAP_COLS, h: cellSize * MAP_ROWS });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rangeSource = useMemo(
    () => participants.find((p) => p.id === rangeSourceId) ?? null,
    [participants, rangeSourceId]
  );

  const clearTool = () => {
    setMeasureFrom(null);
    setRangeSourceId(null);
    setAoeSource(null);
  };

  const selectMode = (next: Mode) => {
    setMode(next);
    clearTool();
  };

  // --- Fichas bajo el ratón -----------------------------------------------
  const handleTokenPointerDown = (e: React.PointerEvent, combatant: Combatant) => {
    if (e.button !== 0) return;
    // Evita que el clic en una ficha llegue al manejador del grid (casilla "vacía").
    e.stopPropagation();
    const cell = { x: combatant.x ?? 0, y: combatant.y ?? 0 };
    if (tileMode) {
      // En modo tile, clic en una ficha coloca/quita el tile seleccionado.
      onToggleTile(cell.x, cell.y, tileType);
      return;
    }
    if (mode === 'move') {
      gridRef.current?.setPointerCapture(e.pointerId);
      setDrag({ id: combatant.id, startX: e.clientX, startY: e.clientY, moved: false });
      setHover(cell);
    } else if (mode === 'measure') {
      setMeasureFrom(cell);
    } else if (mode === 'range') {
      setRangeSourceId(combatant.id);
    } else if (mode === 'aoe') {
      setAoeSource(cell);
    }
  };

  // --- Clic en una casilla vacía ------------------------------------------
  const handleEmptyDown = (e: React.PointerEvent, cell: MapCell) => {
    if (e.button !== 0) return;
    if (tileMode) {
      // En modo tile, clic en una casilla coloca/quita el tile seleccionado.
      onToggleTile(cell.x, cell.y, tileType);
      return;
    }
    if (mode === 'move') {
      if (selectedId && moveCells.some((c) => c.x === cell.x && c.y === cell.y)) {
        // Clic en un cuadro alcanzable: mueve la ficha seleccionada allí.
        onMove(selectedId, cell.x, cell.y);
      } else if (selectedId) {
        // Clic fuera del alcance: deseleccionar.
        onSelect(null);
      }
    } else if (mode === 'measure') {
      setMeasureFrom(cell);
    } else if (mode === 'aoe') {
      setAoeSource(cell);
    }
  };

  // --- Puntero en movimiento ----------------------------------------------
  const handleMove = (e: React.PointerEvent) => {
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const cell = cellFromPointer(e, rect);
    setHover(cell);
    if (!drag) return;
    const distance = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (!drag.moved && distance > 6) setDrag({ ...drag, moved: true });
  };

  const handleUp = () => {
    if (drag && !drag.moved) {
      const target = participants.find((p) => p.id === drag.id);
      if (target) {
        if (selectedId === target.id) {
          // Segundo clic en la misma ficha: abrir el detalle.
          onOpenActions(target);
        } else {
          // Primer clic: seleccionar la ficha y resaltar su movimiento.
          onSelect(target.id);
        }
      }
    } else if (drag?.moved && hover) {
      onMove(drag.id, hover.x, hover.y);
    }
    setDrag(null);
    setHover(null);
  };

  // --- Cálculo de áreas ----------------------------------------------------
  const aoeCells = useMemo<MapCell[]>(() => {
    if (!aoeSource) return [];
    const aim = hover ?? aoeSource;
    if (aoeShape === 'sphere') return cellsInSphere(aoeSource.x, aoeSource.y, aoeFeet, tiles);
    if (aoeShape === 'cone') return cellsInCone(aoeSource.x, aoeSource.y, aim.x, aim.y, aoeFeet, tiles);
    return cellsInLine(aoeSource.x, aoeSource.y, aim.x, aim.y, aoeFeet, tiles);
  }, [aoeSource, aoeShape, aoeFeet, hover, tiles]);

  const rangeCells = useMemo<MapCell[]>(() => {
    if (!rangeSource || rangeSource.x === undefined || rangeSource.y === undefined) return [];
    return cellsInSphere(rangeSource.x, rangeSource.y, rangeFeet, tiles);
  }, [rangeSource, rangeFeet, tiles]);

  const selectedCombatant = participants.find((p) => p.id === selectedId);

  // Casillas alcanzables por el combatiente seleccionado según su velocidad.
  const selectedX = selectedCombatant?.x;
  const selectedY = selectedCombatant?.y;
  const moveCells: MapCell[] =
    selectedX === undefined || selectedY === undefined
      ? []
      : cellsInSphere(selectedX, selectedY, selectedCombatant?.speed ?? 30, tiles).filter(
          (c) =>
            (c.x !== selectedX || c.y !== selectedY) &&
            !isOccupied(participants, c.x, c.y) &&
            !isWall(tiles, c.x, c.y)
        );

  // --- Info mostrada -------------------------------------------------------
  const measureDistance = measureFrom && hover ? gridDistanceFeet(measureFrom, hover) : null;

  const inRangeCount = rangeSource
    ? participants.filter((p) => {
        if (p.x === undefined || p.y === undefined) return false;
        return gridDistanceFeet({ x: p.x, y: p.y }, { x: rangeSource.x ?? 0, y: rangeSource.y ?? 0 }) <= rangeFeet;
      }).length
    : 0;

  const inAoeCount = aoeCells.length > 0
    ? participants.filter((p) => p.x !== undefined && p.y !== undefined && aoeCells.some((c) => c.x === p.x && c.y === p.y)).length
    : 0;

  const cellClass = (x: number, y: number): string => {
    const isHover = hover?.x === x && hover?.y === y;
    const base = (x + y) % 2 === 0 ? 'bg-dnd-leather/[0.09]' : 'bg-dnd-leather/[0.18]';
    return `${base} ${isHover ? 'bg-dnd-gold/30' : ''}`;
  };

  const isInRange = (x: number, y: number) => rangeCells.some((c) => c.x === x && c.y === y);
  const isInAoe = (x: number, y: number) => aoeCells.some((c) => c.x === x && c.y === y);

  const cellColPct = 100 / MAP_COLS;
  const cellRowPct = 100 / MAP_ROWS;

  const modeButton = (m: Mode, label: string) => (
    <button
      type="button"
      key={m}
      onClick={() => selectMode(m)}
      aria-pressed={mode === m}
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
        mode === m
          ? 'bg-dnd-gold text-dnd-ink'
          : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Barra de herramientas */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <div className="flex items-center gap-1" role="group" aria-label="Herramientas de mapa">
          {modeButton('move', 'Mover')}
          {modeButton('measure', 'Medir')}
          {modeButton('range', 'Alcance')}
          {modeButton('aoe', 'Área')}
          <button
            type="button"
            onClick={onToggleTileMode}
            aria-pressed={tileMode}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
              tileMode
                ? 'bg-amber-500 text-white'
                : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
            }`}
          >
            🧱 Tiles
          </button>
          {tileMode && (
            <div className="flex items-center gap-1.5 ml-1">
              <select
                value={tileType}
                onChange={(e) => onTileTypeChange(e.target.value as TileType)}
                className="input h-7 w-36 shrink-0 text-xs"
              >
                <option value="wall">Muro</option>
                <option value="trap">X Trampa</option>
                <option value="treasure">🟨 Tesoro</option>
                <option value="investigation">🔍 Investigación</option>
              </select>
              <button
                type="button"
                onClick={onClearTiles}
                className="rounded-full bg-red-900/60 px-2.5 py-1 text-[11px] font-bold text-red-200 transition-colors hover:bg-red-700 hover:text-white"
              >
                🗑 Borrar todos
              </button>
            </div>
          )}
        </div>

        <div className="relative flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLayoutsOpen((v) => !v)}
            aria-expanded={layoutsOpen}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
              layoutsOpen
                ? 'bg-dnd-gold text-dnd-ink'
                : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
            }`}
          >
            🗺 Mapas
          </button>
          {layoutsOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 w-80 max-w-[90vw] rounded-dnd-lg border border-dnd-leather/40 bg-dnd-ink p-4 shadow-xl">
              <div className="mb-3 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-dnd-muted">Guardar actual</span>
                <div className="flex gap-2">
                  <input
                    className="input h-8 min-w-0 flex-1 text-sm"
                    placeholder="Nombre del layout"
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSaveLayout(layoutName);
                        setLayoutName('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onSaveLayout(layoutName);
                      setLayoutName('');
                    }}
                    className="rounded-md bg-dnd-gold px-3 py-1 text-xs font-bold text-dnd-ink hover:bg-dnd-gold/80"
                  >
                    Guardar
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onExportLayouts}
                  className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-400 flex-1"
                >
                  📤 Exportar
                </button>
                <button
                  type="button"
                  onClick={onImportLayouts}
                  className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-400 flex-1"
                >
                  📥 Importar
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-dnd-muted">Guardados ({savedLayouts.length})</span>
                {savedLayouts.length === 0 ? (
                  <span className="text-xs text-dnd-muted">Aún no hay layouts guardados.</span>
                ) : (
                  <>
                    <select
                      className="input h-8 w-full text-sm"
                      value={layoutSel}
                      onChange={(e) => setLayoutSel(e.target.value)}
                    >
                      <option value="">— Elegir —</option>
                      {savedLayouts.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.barriers.length} celdas)
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (layoutSel) onLoadLayout(layoutSel);
                        }}
                        disabled={!layoutSel}
                        className="rounded-md bg-emerald-500 px-2 py-1.5 text-xs font-bold text-white hover:bg-emerald-400 disabled:opacity-40"
                      >
                        Cargar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (layoutSel) {
                            onDeleteLayout(layoutSel);
                            setLayoutSel('');
                          }
                        }}
                        disabled={!layoutSel}
                        className="rounded-md bg-red-500 px-2 py-1.5 text-xs font-bold text-white hover:bg-red-400 disabled:opacity-40"
                      >
                        Borrar
                      </button>
                      <button
                        type="button"
                        onClick={onRandomLayout}
                        className="rounded-md bg-violet-500 px-2 py-1.5 text-xs font-bold text-white hover:bg-violet-400"
                      >
                        🎲 Aleatorio
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {mode === 'range' && (
          <div className="flex items-center gap-1">
            <span className="whitespace-nowrap text-[11px] text-dnd-muted">Radio</span>
            <select
              className="input h-7 w-24 shrink-0 text-xs"
              value={rangeFeet}
              onChange={(e) => setRangeFeet(Number(e.target.value))}
            >
              {RANGE_PRESETS.map((r) => (
                <option key={r} value={r}>
                  {r} pies
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === 'aoe' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1" role="group" aria-label="Forma del área">
              {(
                [
                  ['sphere', 'Radio'],
                  ['cone', 'Cono'],
                  ['line', 'Línea'],
                ] as [AoeShape, string][]
              ).map(([s, label]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAoeShape(s)}
                  aria-pressed={aoeShape === s}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    aoeShape === s
                      ? 'bg-dnd-gold text-dnd-ink'
                      : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              className="input h-7 w-24 shrink-0 text-xs"
              value={aoeFeet}
              onChange={(e) => setAoeFeet(Number(e.target.value))}
            >
              {AOE_PRESETS.map((r) => (
                <option key={r} value={r}>
                  {r} pies
                </option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* Barra de estado (a ancho completo, nunca se corta) */}
      <div className="flex min-h-4 items-center gap-2 text-[11px] font-bold">
        {measureDistance !== null && <span className="text-dnd-gold">Distancia: {measureDistance} pies</span>}
        {mode === 'range' && rangeSource && (
          <span className="text-sky-300">
            Alcance: {rangeFeet} pies · {inRangeCount} fichas dentro
          </span>
        )}
        {mode === 'aoe' && aoeSource && (
          <span className="text-violet-300">
            {aoeShape === 'sphere' ? 'Radio' : aoeShape === 'cone' ? 'Cono' : 'Línea'}: {aoeFeet} pies ·{' '}
            {inAoeCount} fichas afectadas
          </span>
        )}
      </div>

      <div ref={measureRef} className="flex min-h-0 flex-1 items-center justify-center">
        <div
          ref={gridRef}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            const cell = gridRef.current && cellFromPointer(e, gridRef.current.getBoundingClientRect());
            if (cell) handleEmptyDown(e, cell);
          }}
          className="relative overflow-hidden rounded-dnd-lg border border-dnd-leather/40 bg-dnd-ink/40"
          style={{
            width: mapSize.w || '100%',
            height: mapSize.h || '100%',
            touchAction: 'none',
          }}
          aria-label="Mapa de combate"
          role="grid"
        >
        {/* Casillas de fondo con mayor contraste */}
        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateColumns: `repeat(${MAP_COLS}, 1fr)`, gridAutoRows: '1fr' }}
          aria-hidden="true"
        >
          {Array.from({ length: MAP_COLS * MAP_ROWS }, (_, i) => {
            const x = i % MAP_COLS;
            const y = Math.floor(i / MAP_COLS);
            return <div key={i} className={`${cellClass(x, y)} border-r border-b border-dnd-ink/70`} />;
          })}
        </div>

        {/* Tiles (muros, trampas, tesoros, investigación) */}
        {tiles.length > 0 && (
          <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${MAP_COLS}, 1fr)`, gridAutoRows: '1fr' }} aria-hidden="true">
            {Array.from({ length: MAP_COLS * MAP_ROWS }, (_, i) => {
              const x = i % MAP_COLS;
              const y = Math.floor(i / MAP_COLS);
              const tile = tiles.find((t) => t.x === x && t.y === y);
              if (!tile) return <div key={i} />;
              // Estilos por tipo de tile.
              let baseClass = '';
              let icon = '';
              if (tile.type === 'wall') {
                // Muro: fondo oscuro + bordes rojos donde no hay muro adyacente.
                const openTop = !hasTile(tiles, x, y - 1, 'wall');
                const openBottom = !hasTile(tiles, x, y + 1, 'wall');
                const openLeft = !hasTile(tiles, x - 1, y, 'wall');
                const openRight = !hasTile(tiles, x + 1, y, 'wall');
                baseClass = `bg-dnd-ink/95 ${openTop ? 'border-t-2 border-red-400' : ''} ${openBottom ? 'border-b-2 border-red-400' : ''} ${openLeft ? 'border-l-2 border-red-400' : ''} ${openRight ? 'border-r-2 border-red-400' : ''}`;
                icon = '';
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
                <div
                  key={i}
                  className={`${baseClass} ${tileMode ? 'ring-2 ring-inset ring-amber-300' : ''}`}
                >
                  {icon && <span className="text-[10px] leading-none text-white/90">{icon}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Movimientos posibles del combatiente seleccionado (según su velocidad) */}
        {moveCells.length > 0 && (
          <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${MAP_COLS}, 1fr)`, gridAutoRows: '1fr' }} aria-hidden="true">
            {Array.from({ length: MAP_COLS * MAP_ROWS }, (_, i) => {
              const x = i % MAP_COLS;
              const y = Math.floor(i / MAP_COLS);
              if (!moveCells.some((c) => c.x === x && c.y === y)) return <div key={i} />;
              return <div key={i} className="bg-emerald-500/[0.22] ring-1 ring-inset ring-emerald-400/60" />;
            })}
          </div>
        )}

        {/* Capa de áreas: alcance y áreas de efecto */}
        {mode === 'range' && rangeCells.length > 0 && (
          <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${MAP_COLS}, 1fr)`, gridAutoRows: '1fr' }} aria-hidden="true">
            {Array.from({ length: MAP_COLS * MAP_ROWS }, (_, i) => {
              const x = i % MAP_COLS;
              const y = Math.floor(i / MAP_COLS);
              if (!isInRange(x, y)) return <div key={i} />;
              return <div key={i} className="bg-sky-500/[0.22] ring-1 ring-inset ring-sky-400/60" />;
            })}
          </div>
        )}

        {mode === 'aoe' && aoeCells.length > 0 && (
          <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${MAP_COLS}, 1fr)`, gridAutoRows: '1fr' }} aria-hidden="true">
            {Array.from({ length: MAP_COLS * MAP_ROWS }, (_, i) => {
              const x = i % MAP_COLS;
              const y = Math.floor(i / MAP_COLS);
              if (!isInAoe(x, y)) return <div key={i} />;
              return <div key={i} className="bg-violet-500/[0.25] ring-1 ring-inset ring-violet-400/70" />;
            })}
          </div>
        )}

        {/* Línea de medición */}
        {measureFrom && hover && !SAME(measureFrom, hover) && mode === 'measure' && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
            <line
              x1={`${(measureFrom.x + 0.5) * cellColPct}%`}
              y1={`${(measureFrom.y + 0.5) * cellRowPct}%`}
              x2={`${(hover.x + 0.5) * cellColPct}%`}
              y2={`${(hover.y + 0.5) * cellRowPct}%`}
              stroke="#f5c542"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          </svg>
        )}

        {/* Marcador del origen del área/medición */}
        {(mode === 'aoe' && aoeSource) || (measureFrom && mode === 'measure') ? (
          <div
            className="pointer-events-none absolute z-10 flex items-center justify-center"
            style={{
              width: `${cellColPct}%`,
              height: `${cellRowPct}%`,
              left: `${(measureFrom ?? aoeSource ?? { x: 0, y: 0 }).x * cellColPct}%`,
              top: `${(measureFrom ?? aoeSource ?? { x: 0, y: 0 }).y * cellRowPct}%`,
            }}
          >
            <div className="h-3 w-3 rounded-full border-2 border-dnd-gold bg-dnd-gold/60" />
          </div>
        ) : null}

        {/* Eje de referencia de coordenadas */}
        <div className="pointer-events-none absolute left-1 top-0.5 text-[9px] leading-none text-dnd-muted/70">
          1
        </div>

        {/* Fichas */}
        {participants.map((combatant) => {
          if (combatant.x === undefined || combatant.y === undefined) return null;
          const isPlayer = combatant.type === 'player';
          const isActive = combatant.id === activeId;
          const isNext = combatant.id === nextId && !isActive;
          const isRangeSource = combatant.id === rangeSourceId;
          const isSelected = combatant.id === selectedId;
          const isDragging = drag?.id === combatant.id;
          const inSame = participants.filter((p) => p.x === combatant.x && p.y === combatant.y);
          const dupIndex = inSame.findIndex((p) => p.id === combatant.id);
          const offsetX = inSame.length > 1 ? (dupIndex % 2) * 30 - 15 : 0;
          const offsetY = inSame.length > 1 ? Math.floor(dupIndex / 2) * 30 - 15 : 0;

          return (
            <div
              key={combatant.id}
              role="gridcell"
              aria-label={`${combatant.name}, ${isPlayer ? 'Jugador' : 'Monstruo'}, casilla ${combatant.x},${combatant.y}${isNext ? ', siguiente en el turno' : ''}`}
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
              {isActive && (
                <span
                  className="pointer-events-none absolute animate-ping rounded-full bg-dnd-gold/25"
                  style={{ inset: '-12%' }}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                onPointerDown={(e) => handleTokenPointerDown(e, combatant)}
                className={`relative flex h-[82%] w-[72%] items-center justify-center rounded-full border-2 text-xs font-bold shadow-lg outline-none ring-4 transition-all focus:ring-dnd-gold ${
                  isPlayer
                    ? 'border-emerald-400 bg-emerald-950/90 text-emerald-100'
                    : 'border-red-500 bg-red-950/90 text-red-100'
                } ${
                  isActive ? 'animate-pulse border-dnd-gold ring-dnd-gold shadow-dnd-glow' : ''
                } ${isRangeSource ? 'ring-2 ring-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]' : ''} ${
                  isSelected ? 'ring-4 ring-emerald-300 shadow-dnd-glow' : ''
                } ${
                  combatant.isDead ? 'opacity-40 grayscale' : ''
                } ${
                  isDragging ? 'z-20 cursor-grabbing ring-2 ring-dnd-gold' : 'cursor-grab hover:scale-110'
                }`}
                title={`${combatant.name} · ${combatant.hp}/${combatant.maxHp} PG · (${combatant.x},${combatant.y})${isNext ? ' · Siguiente en el turno' : ''}`}
              >
                {combatant.name.charAt(0).toUpperCase()}
              </button>
            </div>
          );
        })}
      </div>
      </div>

      <p className="text-[10px] text-dnd-muted">
        {tileMode && 'Modo tiles: elige tipo (Muro/Trampa/Tesoro/Investigación) y haz clic en una casilla para colocarlo/quitarlo.'}
        {!tileMode && mode === 'move' && 'Clic en una ficha para seleccionarla · segundo clic para abrir sus acciones · clic en un cuadro resaltado para moverla.'}
        {!tileMode && mode === 'measure' && 'Clic en un punto y luego pasa el ratón (o haz clic) para medir la distancia en pies.'}
        {!tileMode && mode === 'range' && 'Haz clic en una ficha para ver su alcance (radio) y las fichas dentro.'}
        {!tileMode && mode === 'aoe' && 'Haz clic en una casilla de origen; mueve el ratón para orientar conos y líneas.'}
      </p>
    </div>
  );
};

export default CombatMap;