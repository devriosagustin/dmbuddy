// ============================================================
// Biblioteca de mapas: página aparte (no un popover) para guardar,
// organizar y editar los layouts de mapa guardados. A la izquierda,
// la lista de mapas guardados; a la derecha, una vista al tamaño
// real de la cuadrícula activa del mapa seleccionado, con edición
// de tiles (incluidos portales) sin tener que cargarlo primero en
// el mapa en vivo de la sesión.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Download, FolderPlus, Network, Play, Plus, Shuffle, Trash2, Upload } from 'lucide-react';
import { Button } from '../common/Button';
import { PortalEditorModal } from './PortalEditorModal';
import type { PortalUpdate } from './PortalEditorModal';
import { MapConnectionsModal } from './MapConnectionsModal';
import { useCombatStore } from '../../store/combatStore';
import { useLayoutStore } from '../../store/layoutStore';
import {
  MAP_TEMPLATES,
  randomLayout,
  restoreTilesFromLayout,
  restoreCreaturesFromLayout,
} from '../../utils/layoutPatterns';
import {
  toggleDraftTile,
  removeDraftTileAt,
  applyPortalUpdate,
  ensurePortalTile,
  removeLinkedPortal,
  paintDraftTile,
  moveDraftTile,
} from '../../utils/tileDraft';
import type { MapTile, TileType } from '../../types';

const TILE_OPTIONS: { value: TileType; label: string }[] = [
  { value: 'wall', label: 'Muro' },
  { value: 'door', label: '🚪 Puerta' },
  { value: 'secretDoor', label: '🚪 Puerta secreta' },
  { value: 'trap', label: '✚ Trampa' },
  { value: 'treasure', label: '🟨 Tesoro' },
  { value: 'investigation', label: '🔍 Investigación' },
  { value: 'portal', label: '🌀 Portal a otro mapa' },
];

/** Estilo visual simplificado de cada tile (versión liviana del de CombatMap, sin bordes por vecinos). */
const tileVisual = (tile: MapTile | undefined): { baseClass: string; icon: string } => {
  if (!tile) return { baseClass: '', icon: '' };
  switch (tile.type) {
    case 'wall':
      return { baseClass: 'bg-dnd-ink/95', icon: '' };
    case 'door':
      return tile.open
        ? { baseClass: 'bg-emerald-700/40', icon: '🚪' }
        : { baseClass: 'bg-amber-950/90', icon: '🔒' };
    case 'secretDoor':
      return { baseClass: 'bg-dnd-ink/95 ring-1 ring-inset ring-dnd-gold/70', icon: '🚪' };
    case 'trap':
      return { baseClass: 'bg-red-900/40', icon: 'X' };
    case 'treasure':
      return { baseClass: 'bg-yellow-600/50', icon: '🟨' };
    case 'investigation':
      return { baseClass: 'bg-blue-600/50', icon: '🔍' };
    case 'portal':
      return { baseClass: 'bg-purple-700/50', icon: tile.targetLayoutId ? '🌀' : '❔' };
    default:
      return { baseClass: '', icon: '' };
  }
};

/**
 * Biblioteca de mapas guardados. Reemplaza el viejo popover "Mapas" del
 * mapa en vivo: acá hay espacio para ver el mapa completo mientras se edita,
 * sin un modal tapándolo.
 */
export const MapLibraryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Mapa en vivo: solo se usa para "guardar el mapa actual como layout" y
  // para "cargar este layout en el mapa" — la edición de tiles de acá no lo
  // toca hasta que el usuario elige explícitamente cargarlo.
  const mapCols = useCombatStore((s) => s.mapCols);
  const mapRows = useCombatStore((s) => s.mapRows);
  const liveTiles = useCombatStore((s) => s.tiles);
  const liveMapCreatures = useCombatStore((s) => s.mapCreatures);
  const setLiveTiles = useCombatStore((s) => s.setTiles);

  const savedLayouts = useLayoutStore((s) => s.savedLayouts);
  const folders = useLayoutStore((s) => s.folders);
  const saveLayout = useLayoutStore((s) => s.saveLayout);
  const deleteLayout = useLayoutStore((s) => s.deleteLayout);
  const setMapFolder = useLayoutStore((s) => s.setMapFolder);
  const createFolder = useLayoutStore((s) => s.createFolder);
  const renameFolder = useLayoutStore((s) => s.renameFolder);
  const deleteFolder = useLayoutStore((s) => s.deleteFolder);
  const exportLayouts = useLayoutStore((s) => s.exportLayouts);
  const importLayouts = useLayoutStore((s) => s.importLayouts);
  const updateLayoutTiles = useLayoutStore((s) => s.updateLayoutTiles);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTiles, setDraftTiles] = useState<MapTile[]>([]);
  const [draftTileType, setDraftTileType] = useState<TileType>('wall');
  const [portalCell, setPortalCell] = useState<{ x: number; y: number } | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [connectionsLayoutId, setConnectionsLayoutId] = useState<string | null>(null);

  // Dimensionado de la vista previa: mismo criterio que el mapa en vivo
  // (CombatMap.tsx) — calcula el mayor tamaño con celdas cuadradas que cabe
  // en el área disponible, así el mapa completo se ve sin scroll aunque sea
  // grande (antes quedaba amontonado dentro de un contenedor scrolleable).
  // A diferencia de CombatMap.tsx, este contenedor solo existe en el DOM
  // cuando hay un mapa seleccionado (si no, se muestra el estado vacío), así
  // que un `useRef` + efecto con dependencias [mapCols, mapRows] no alcanza:
  // el efecto no vuelve a correr cuando el div recién aparece al elegir un
  // mapa, y el ResizeObserver nunca llega a engancharse (mapSize se queda en
  // 0 para siempre y el grid cae al fallback 100%/100%, estirándose según la
  // forma del panel). Con un ref callback en estado, el efecto se vuelve a
  // ejecutar apenas el nodo aparece o desaparece.
  const [measureEl, setMeasureEl] = useState<HTMLDivElement | null>(null);
  const [mapSize, setMapSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!measureEl) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const cellSize = Math.max(1, Math.floor(Math.min(width / mapCols, height / mapRows)));
      setMapSize({ w: cellSize * mapCols, h: cellSize * mapRows });
    });
    ro.observe(measureEl);
    return () => ro.disconnect();
  }, [measureEl, mapCols, mapRows]);

  const [newMapName, setNewMapName] = useState('');
  const [newMapFolder, setNewMapFolder] = useState('');
  const [copyName, setCopyName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [templateSel, setTemplateSel] = useState('');

  const selectedLayout = savedLayouts.find((l) => l.id === selectedId) ?? null;

  // Si se llega acá desde "Ir al mapa" del editor de un portal en el mapa en
  // vivo, selecciona ese layout apenas se monta la página (una sola vez;
  // limpia el state de navegación para no volver a disparar esto si el
  // usuario navega hacia atrás y adelante).
  useEffect(() => {
    const incoming = (location.state as { selectLayoutId?: string } | null)?.selectLayoutId;
    if (incoming) {
      setSelectedId(incoming);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar de mapa seleccionado, recarga el borrador de tiles desde el
  // layout guardado (no depende de `selectedLayout` para no pisar ediciones
  // en curso del mismo mapa cuando se autoguarda).
  useEffect(() => {
    if (selectedLayout) {
      setDraftTiles(restoreTilesFromLayout(selectedLayout));
      setCopyName(`${selectedLayout.name} (copia)`);
    } else {
      setDraftTiles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const layoutGroups = useMemo(() => {
    const orphan = savedLayouts.filter((l) => !l.folderId || !folders.some((f) => f.id === l.folderId));
    const grouped = folders
      .map((f) => ({ folder: f, items: savedLayouts.filter((l) => l.folderId === f.id) }))
      .filter((g) => g.items.length > 0);
    return { orphan, grouped };
  }, [savedLayouts, folders]);

  // Autoguarda los tiles editados de vuelta en el mismo layout (por nombre),
  // conservando sus criaturas y carpeta. Sin botón "Guardar" aparte: cada
  // edición en la cuadrícula queda guardada al toque, como en el mapa en
  // vivo (un trazo de arrastre completo autoguarda una sola vez, al soltar).
  const autosave = (tiles: MapTile[]) => {
    if (!selectedLayout) return;
    saveLayout(selectedLayout.name, tiles, selectedLayout.creatures, selectedLayout.folderId);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1000);
  };

  const persistDraft = (nextTiles: MapTile[]) => {
    setDraftTiles(nextTiles);
    autosave(nextTiles);
  };

  // Pintado continuo arrastrando el clic (igual que el mapa en vivo): en
  // pointerdown se decide 'add' o 'remove' según el estado de esa celda y
  // se repite en cada celda nueva que el puntero visita mientras el botón
  // sigue abajo. Se autoguarda una sola vez al soltar, no en cada celda
  // pintada. Puertas y portales quedan afuera del arrastre (un solo click,
  // como antes): alternar una puerta o abrir el editor de un portal en
  // cada celda de un trazo continuo no tiene sentido.
  const gridRef = useRef<HTMLDivElement>(null);
  const paintActionRef = useRef<'add' | 'remove' | null>(null);
  const lastPaintedCellRef = useRef<{ x: number; y: number } | null>(null);
  const strokeTilesRef = useRef<MapTile[] | null>(null);
  // Arrastrar un portal ya colocado (con la herramienta Portal elegida) lo
  // reubica en vez de pintar: se decide recién en pointerup si hubo
  // movimiento real (arrastre → reubicar) o no (click → abrir el editor).
  const portalDragRef = useRef<{ from: { x: number; y: number }; startX: number; startY: number; moved: boolean } | null>(
    null
  );
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

  const cellFromPointer = (e: React.PointerEvent, rect: DOMRect): { x: number; y: number } | null => {
    if (rect.width <= 0 || rect.height <= 0) return null;
    const cellW = rect.width / mapCols;
    const cellH = rect.height / mapRows;
    const x = Math.floor((e.clientX - rect.left) / cellW);
    const y = Math.floor((e.clientY - rect.top) / cellH);
    if (x < 0 || x >= mapCols || y < 0 || y >= mapRows) return null;
    return { x, y };
  };

  const beginPaintStroke = (cell: { x: number; y: number }) => {
    const existing = draftTiles.find((t) => t.x === cell.x && t.y === cell.y);
    const action: 'add' | 'remove' = existing && existing.type === draftTileType ? 'remove' : 'add';
    paintActionRef.current = action;
    lastPaintedCellRef.current = cell;
    const next = paintDraftTile(draftTiles, cell.x, cell.y, draftTileType, action);
    strokeTilesRef.current = next;
    setDraftTiles(next);
  };

  const continuePaintStroke = (cell: { x: number; y: number }) => {
    const action = paintActionRef.current;
    if (!action || !strokeTilesRef.current) return;
    const last = lastPaintedCellRef.current;
    if (last && last.x === cell.x && last.y === cell.y) return;
    lastPaintedCellRef.current = cell;
    const next = paintDraftTile(strokeTilesRef.current, cell.x, cell.y, draftTileType, action);
    strokeTilesRef.current = next;
    setDraftTiles(next);
  };

  const endPaintStroke = () => {
    if (!paintActionRef.current) return;
    paintActionRef.current = null;
    lastPaintedCellRef.current = null;
    const finalTiles = strokeTilesRef.current;
    strokeTilesRef.current = null;
    if (finalTiles) autosave(finalTiles);
  };

  const handleGridPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !selectedLayout) return;
    const cell = cellFromPointer(e, e.currentTarget.getBoundingClientRect());
    if (!cell) return;
    if (draftTileType === 'portal') {
      const existing = draftTiles.find((t) => t.x === cell.x && t.y === cell.y && t.type === 'portal');
      if (existing) {
        // Podría ser un click (abrir el editor) o el inicio de un arrastre
        // para reubicar el portal — se decide en pointerup según si hubo
        // movimiento real de por medio.
        e.currentTarget.setPointerCapture(e.pointerId);
        portalDragRef.current = { from: cell, startX: e.clientX, startY: e.clientY, moved: false };
        return;
      }
      persistDraft(toggleDraftTile(draftTiles, cell.x, cell.y, 'portal'));
      setPortalCell(cell);
      return;
    }
    if (draftTileType === 'door') {
      persistDraft(toggleDraftTile(draftTiles, cell.x, cell.y, 'door'));
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    beginPaintStroke(cell);
  };

  const handleGridPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const cell = cellFromPointer(e, e.currentTarget.getBoundingClientRect());
    setHoverCell(cell);
    const portalDrag = portalDragRef.current;
    if (portalDrag) {
      if (!portalDrag.moved) {
        const distance = Math.hypot(e.clientX - portalDrag.startX, e.clientY - portalDrag.startY);
        if (distance > 6) portalDragRef.current = { ...portalDrag, moved: true };
      }
      return;
    }
    if (cell) continuePaintStroke(cell);
  };

  const handleGridPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const portalDrag = portalDragRef.current;
    if (portalDrag) {
      portalDragRef.current = null;
      const cell = cellFromPointer(e, e.currentTarget.getBoundingClientRect());
      if (!portalDrag.moved || !cell || (cell.x === portalDrag.from.x && cell.y === portalDrag.from.y)) {
        // No hubo arrastre real: fue un click, abre el editor de este portal.
        setPortalCell(portalDrag.from);
      } else {
        relocatePortal(portalDrag.from, cell);
      }
      return;
    }
    endPaintStroke();
  };

  // Contraparte del portal: al conectar el mapa A con el B, B recibe
  // automáticamente un portal de vuelta hacia A en el punto de llegada
  // elegido — la conexión es siempre de ida y vuelta, como pidió el
  // usuario, sin tener que armar el segundo portal a mano del otro lado.
  const upsertReciprocalPortal = (
    layoutId: string,
    tx: number,
    ty: number,
    originId: string,
    ox: number,
    oy: number,
    label: string | undefined
  ) => {
    const target = savedLayouts.find((l) => l.id === layoutId);
    if (!target) return;
    const withPortal = ensurePortalTile(restoreTilesFromLayout(target), tx, ty);
    updateLayoutTiles(
      layoutId,
      applyPortalUpdate(withPortal, tx, ty, { targetLayoutId: originId, targetX: ox, targetY: oy, label })
    );
  };

  // Quita la contraparte en otro layout, pero solo si todavía apunta de
  // vuelta a esta celda exacta (si el usuario ya la reconfiguró a mano para
  // conectar a otro lado, no la toca).
  const removeReciprocalPortal = (
    layoutId: string,
    tx: number | undefined,
    ty: number | undefined,
    originId: string,
    ox: number,
    oy: number
  ) => {
    if (tx === undefined || ty === undefined) return;
    const target = savedLayouts.find((l) => l.id === layoutId);
    if (!target) return;
    updateLayoutTiles(layoutId, removeLinkedPortal(restoreTilesFromLayout(target), tx, ty, originId, ox, oy));
  };

  // Arrastrar un portal ya colocado lo reubica sin perder su configuración
  // (mapa destino, punto de llegada, nombre) en vez de tener que borrarlo y
  // recrearlo — a ciegas por coordenadas es difícil acertar la celda exacta
  // donde va a quedar. Si tenía una contraparte (en este mismo mapa o en
  // otro), se reapunta hacia la nueva celda para que la conexión no se rompa.
  const relocatePortal = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    if (!selectedLayout || (from.x === to.x && from.y === to.y)) return;
    const oldTile = draftTiles.find((t) => t.x === from.x && t.y === from.y && t.type === 'portal');
    if (!oldTile) return;

    let nextTiles = moveDraftTile(draftTiles, from, to);

    if (oldTile.targetLayoutId && oldTile.targetX !== undefined && oldTile.targetY !== undefined) {
      if (oldTile.targetLayoutId === selectedLayout.id) {
        nextTiles = applyPortalUpdate(nextTiles, oldTile.targetX, oldTile.targetY, {
          targetX: to.x,
          targetY: to.y,
        });
      } else {
        upsertReciprocalPortal(
          oldTile.targetLayoutId,
          oldTile.targetX,
          oldTile.targetY,
          selectedLayout.id,
          to.x,
          to.y,
          oldTile.label
        );
      }
    }

    persistDraft(nextTiles);
  };

  const handleSavePortal = (updates: PortalUpdate) => {
    if (!portalCell || !selectedLayout) return;
    const oldTile = draftTiles.find(
      (t) => t.x === portalCell.x && t.y === portalCell.y && t.type === 'portal'
    );

    // Si el portal ya apuntaba a otro mapa y cambió de destino, limpia la
    // contraparte vieja antes de armar la nueva.
    if (
      oldTile?.targetLayoutId &&
      oldTile.targetLayoutId !== selectedLayout.id &&
      (oldTile.targetLayoutId !== updates.targetLayoutId ||
        oldTile.targetX !== updates.targetX ||
        oldTile.targetY !== updates.targetY)
    ) {
      removeReciprocalPortal(
        oldTile.targetLayoutId,
        oldTile.targetX,
        oldTile.targetY,
        selectedLayout.id,
        portalCell.x,
        portalCell.y
      );
    }

    let nextTiles = applyPortalUpdate(draftTiles, portalCell.x, portalCell.y, updates);

    if (updates.targetLayoutId === selectedLayout.id) {
      // Portal a otro punto del mismo mapa: la contraparte va en el mismo
      // array de tiles, se autoguarda todo junto en un solo paso.
      if (updates.targetX !== portalCell.x || updates.targetY !== portalCell.y) {
        nextTiles = applyPortalUpdate(
          ensurePortalTile(nextTiles, updates.targetX, updates.targetY),
          updates.targetX,
          updates.targetY,
          { targetLayoutId: selectedLayout.id, targetX: portalCell.x, targetY: portalCell.y, label: updates.label }
        );
      }
    } else {
      upsertReciprocalPortal(
        updates.targetLayoutId,
        updates.targetX,
        updates.targetY,
        selectedLayout.id,
        portalCell.x,
        portalCell.y,
        updates.label
      );
    }

    persistDraft(nextTiles);
  };

  const handleDeletePortal = () => {
    if (!portalCell || !selectedLayout) return;
    const oldTile = draftTiles.find(
      (t) => t.x === portalCell.x && t.y === portalCell.y && t.type === 'portal'
    );
    let nextTiles = removeDraftTileAt(draftTiles, portalCell.x, portalCell.y);

    if (oldTile?.targetLayoutId) {
      if (oldTile.targetLayoutId === selectedLayout.id) {
        if (oldTile.targetX !== undefined && oldTile.targetY !== undefined) {
          nextTiles = removeLinkedPortal(
            nextTiles,
            oldTile.targetX,
            oldTile.targetY,
            selectedLayout.id,
            portalCell.x,
            portalCell.y
          );
        }
      } else {
        removeReciprocalPortal(
          oldTile.targetLayoutId,
          oldTile.targetX,
          oldTile.targetY,
          selectedLayout.id,
          portalCell.x,
          portalCell.y
        );
      }
    }

    persistDraft(nextTiles);
  };

  const handleCreateBlank = () => {
    const name = newMapName.trim();
    if (!name) return;
    const layout = saveLayout(name, [], [], newMapFolder || undefined);
    setNewMapName('');
    setNewMapFolder('');
    setSelectedId(layout.id);
  };

  const handleSaveCurrentMap = () => {
    const name = newMapName.trim();
    if (!name) return;
    const savedTiles = liveTiles.map((t) => ({ ...t }));
    const creatures = liveMapCreatures.map((c) => ({
      name: c.name,
      kind: c.kind as 'monster' | 'npc',
      refId: c.refId,
      x: c.x,
      y: c.y,
      hp: c.hp,
      maxHp: c.maxHp,
      tempHp: c.tempHp,
      armorClass: c.armorClass,
      speed: c.speed,
      npcRole: c.npcRole,
      xpReward: c.xpReward,
    }));
    const layout = saveLayout(name, savedTiles, creatures, newMapFolder || undefined);
    setNewMapName('');
    setNewMapFolder('');
    setSelectedId(layout.id);
  };

  const handleLoadIntoLiveMap = () => {
    if (!selectedLayout) return;
    setLiveTiles(restoreTilesFromLayout(selectedLayout));
    useCombatStore.setState({ mapCreatures: restoreCreaturesFromLayout(selectedLayout) });
    navigate('/map');
  };

  const handleSaveAsCopy = () => {
    if (!selectedLayout) return;
    const name = copyName.trim();
    if (!name) return;
    const layout = saveLayout(name, draftTiles, selectedLayout.creatures, selectedLayout.folderId);
    setSelectedId(layout.id);
  };

  const handleDeleteSelected = () => {
    if (!selectedLayout) return;
    if (!window.confirm(`¿Eliminar el mapa «${selectedLayout.name}»? Esta acción no se puede deshacer.`)) return;
    deleteLayout(selectedLayout.id);
    setSelectedId(null);
  };

  const handleRandomPattern = () => {
    if (!selectedLayout) return;
    const { tiles } = randomLayout(templateSel || undefined);
    persistDraft(tiles);
  };

  const handleExport = () => {
    const json = exportLayouts();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmbuddy-map-layouts-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (!text) return;
        importLayouts(text);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const layoutButtonClass = (id: string) =>
    `flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-bold transition-colors ${
      selectedId === id
        ? 'border-dnd-gold bg-dnd-gold/10 text-dnd-gold'
        : 'border-dnd-leather/30 text-dnd-text hover:border-dnd-leather/60 hover:bg-dnd-leather/10'
    }`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('/map')}>
            Volver al mapa
          </Button>
          <div>
            <h2 className="page-title">Biblioteca de mapas</h2>
            <p className="text-xs text-dnd-muted">Guardá, organizá y editá tus mapas sin tapar el mapa activo.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Download size={14} />} onClick={handleExport}>
            Exportar
          </Button>
          <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={handleImport}>
            Importar
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* IZQUIERDA: submenú de selección de mapas guardados */}
        <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto pr-1">
          <section className="section-box space-y-2">
            <h3 className="section-title">Nuevo mapa</h3>
            <input
              className="input text-sm"
              placeholder="Nombre del mapa"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
            />
            {folders.length > 0 && (
              <select
                className="input h-8 text-xs"
                value={newMapFolder}
                onChange={(e) => setNewMapFolder(e.target.value)}
                aria-label="Carpeta para el nuevo mapa"
              >
                <option value="">📂 Sin carpeta</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={handleCreateBlank}
                disabled={!newMapName.trim()}
                className="flex-1"
              >
                En blanco
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSaveCurrentMap}
                disabled={!newMapName.trim()}
                className="flex-1"
              >
                Desde el mapa actual
              </Button>
            </div>
          </section>

          <section className="section-box min-h-0 flex-1 space-y-1.5 overflow-y-auto">
            <h3 className="section-title">Mapas guardados ({savedLayouts.length})</h3>
            {savedLayouts.length === 0 ? (
              <p className="text-xs text-dnd-muted">Todavía no guardaste ningún mapa.</p>
            ) : (
              <>
                {layoutGroups.orphan.length > 0 && (
                  <div className="space-y-1">
                    {layoutGroups.orphan.map((l) => (
                      <button key={l.id} type="button" onClick={() => setSelectedId(l.id)} className={layoutButtonClass(l.id)}>
                        <span className="min-w-0 truncate">{l.name}</span>
                        <span className="shrink-0 text-[10px] font-normal text-dnd-muted">
                          {l.tiles?.length ?? l.barriers?.length ?? 0} celdas
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {layoutGroups.grouped.map((g) => (
                  <div key={g.folder.id} className="space-y-1">
                    <p className="mt-2 truncate text-[11px] font-bold text-dnd-muted">📁 {g.folder.name}</p>
                    {g.items.map((l) => (
                      <button key={l.id} type="button" onClick={() => setSelectedId(l.id)} className={layoutButtonClass(l.id)}>
                        <span className="min-w-0 truncate">{l.name}</span>
                        <span className="shrink-0 text-[10px] font-normal text-dnd-muted">
                          {l.tiles?.length ?? l.barriers?.length ?? 0} celdas
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </>
            )}
          </section>

          <section className="section-box space-y-2">
            <h3 className="section-title">Carpetas</h3>
            <div className="flex gap-2">
              <input
                className="input h-8 min-w-0 flex-1 text-xs"
                placeholder="Nueva carpeta (p. ej. Campaña A)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createFolder(newFolderName);
                    setNewFolderName('');
                  }
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<FolderPlus size={14} />}
                onClick={() => {
                  createFolder(newFolderName);
                  setNewFolderName('');
                }}
              />
            </div>
            {folders.length === 0 ? (
              <p className="text-xs text-dnd-muted">Sin carpetas todavía.</p>
            ) : (
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {folders.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 rounded-md bg-dnd-leather/10 px-2 py-1">
                    <input
                      defaultValue={f.name}
                      aria-label={`Renombrar ${f.name}`}
                      className="input h-6 min-w-0 flex-1 px-1 text-[11px]"
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== f.name) renameFolder(f.id, e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => deleteFolder(f.id)}
                      aria-label={`Eliminar carpeta ${f.name}`}
                      className="icon-btn"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="section-box shrink-0 space-y-1.5">
            <h3 className="section-title">Diagrama de conexiones</h3>
            <Button
              variant="secondary"
              size="sm"
              icon={<Network size={14} />}
              onClick={() => selectedLayout && setConnectionsLayoutId(selectedLayout.id)}
              disabled={!selectedLayout}
              className="w-full"
            >
              Generar imagen
            </Button>
          </section>
        </aside>

        {/* DERECHA: mapa seleccionado, al tamaño real de la cuadrícula activa */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          {!selectedLayout ? (
            <div className="flex flex-1 items-center justify-center rounded-dnd-lg border border-dashed border-dnd-leather/40 p-8 text-center text-sm text-dnd-muted">
              Elegí un mapa de la izquierda para verlo y editarlo, o creá uno nuevo.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-fantasy text-lg font-bold text-dnd-gold">{selectedLayout.name}</h3>
                  <p className="text-[11px] text-dnd-muted">
                    {mapCols}×{mapRows} celdas (mismo tamaño que el mapa activo)
                    {savedFlash && <span className="ml-2 text-emerald-400">✓ Guardado</span>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="input h-8 text-xs"
                    value={draftTileType}
                    onChange={(e) => setDraftTileType(e.target.value as TileType)}
                    aria-label="Tipo de tile a colocar"
                  >
                    {TILE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <Button variant="primary" size="sm" icon={<Play size={14} />} onClick={handleLoadIntoLiveMap}>
                    Cargar en el mapa
                  </Button>
                </div>
              </div>

              <div
                ref={setMeasureEl}
                className="flex min-h-0 flex-1 items-center justify-center rounded-dnd-lg border border-dnd-leather/40 bg-dnd-ink/60 p-2"
              >
                <div
                  ref={gridRef}
                  className="grid touch-none select-none"
                  style={{
                    width: mapSize.w || '100%',
                    height: mapSize.h || '100%',
                    gridTemplateColumns: `repeat(${mapCols}, 1fr)`,
                    gridAutoRows: '1fr',
                  }}
                  onPointerDown={handleGridPointerDown}
                  onPointerMove={handleGridPointerMove}
                  onPointerUp={handleGridPointerUp}
                  role="grid"
                  aria-label="Editor de tiles del mapa"
                >
                  {Array.from({ length: mapCols * mapRows }, (_, i) => {
                    const x = i % mapCols;
                    const y = Math.floor(i / mapCols);
                    const tile = draftTiles.find((t) => t.x === x && t.y === y);
                    const creature = selectedLayout.creatures?.find((c) => c.x === x && c.y === y);
                    const { baseClass, icon } = tileVisual(tile);
                    const isHover = hoverCell?.x === x && hoverCell?.y === y;
                    const isDraggablePortal = draftTileType === 'portal' && tile?.type === 'portal';
                    return (
                      <div
                        key={i}
                        title={creature?.name ?? (isDraggablePortal ? 'Arrastrá para reubicar el portal' : undefined)}
                        className={`flex items-center justify-center border border-dnd-ink/40 ${
                          baseClass || 'bg-dnd-leather/10'
                        } ${tile ? 'ring-2 ring-inset ring-amber-300' : ''} ${
                          isHover && !tile ? 'bg-dnd-gold/40' : ''
                        } ${isDraggablePortal ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      >
                        {icon ? (
                          <span className="text-[9px] leading-none text-white/90">{icon}</span>
                        ) : creature ? (
                          <span className="text-[9px] leading-none">{creature.kind === 'monster' ? '👹' : '🧑'}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dnd-leather/30 pt-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <input
                    className="input h-8 w-40 shrink text-xs"
                    value={copyName}
                    onChange={(e) => setCopyName(e.target.value)}
                    placeholder="Nombre para la copia"
                  />
                  <Button variant="secondary" size="sm" icon={<Copy size={14} />} onClick={handleSaveAsCopy} disabled={!copyName.trim()}>
                    Guardar copia
                  </Button>
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    className="input h-8 w-36 text-xs"
                    value={templateSel}
                    onChange={(e) => setTemplateSel(e.target.value)}
                    aria-label="Patrón de mapa a generar"
                  >
                    <option value="">— Patrón aleatorio —</option>
                    {MAP_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <Button variant="secondary" size="sm" icon={<Shuffle size={14} />} onClick={handleRandomPattern}>
                    Generar
                  </Button>
                </div>
                <select
                  className="input h-8 w-36 text-xs"
                  value={selectedLayout.folderId ?? ''}
                  onChange={(e) => setMapFolder(selectedLayout.id, e.target.value || null)}
                  aria-label="Carpeta de este mapa"
                >
                  <option value="">📂 Sin carpeta</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={handleDeleteSelected}
                  className="ml-auto"
                >
                  Eliminar mapa
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <PortalEditorModal
        cell={portalCell}
        tile={portalCell ? draftTiles.find((t) => t.x === portalCell.x && t.y === portalCell.y && t.type === 'portal') : undefined}
        layoutOptions={savedLayouts.map((l) => ({ id: l.id, name: l.name }))}
        mapCols={mapCols}
        mapRows={mapRows}
        onSave={handleSavePortal}
        onDelete={handleDeletePortal}
        onClose={() => setPortalCell(null)}
        onGoToLayout={(layoutId) => setSelectedId(layoutId)}
      />

      <MapConnectionsModal
        startLayoutId={connectionsLayoutId}
        layouts={savedLayouts}
        mapCols={mapCols}
        mapRows={mapRows}
        onClose={() => setConnectionsLayoutId(null)}
      />
    </div>
  );
};

export default MapLibraryPage;
