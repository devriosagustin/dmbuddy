// ============================================================
// Tracker de combate principal: turnos, rondas y combatientes
// ============================================================

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Maximize2,
  Minimize2,
  Play,
  Plus,
  RotateCcw,
  Swords,
  UserPlus,
} from 'lucide-react';
import { Button } from '../common/Button';
import { InitiativeOrder } from './InitiativeOrder';
import { CombatMap } from './CombatMap';
import { CombatLog } from './CombatLog';
import { FogOfWarPanel } from './FogOfWarPanel';
import { AddCombatantModal } from './AddCombatantModal';
import { CombatantActionsModal } from './CombatantActionsModal';
import { useCombatStore } from '../../store/combatStore';
import { useSessionStore } from '../../store/sessionStore';
import { useLayoutStore } from '../../store/layoutStore';
import { useFullscreen } from '../../hooks/useFullscreen';
import { randomLayout } from '../../utils/layoutPatterns';
import { ChatPanel } from './ChatPanel';
import type { Combatant, TileType } from '../../types';

/**
 * Pantalla principal de gestión del combate.
 */
export const CombatTracker = () => {
  const sessionRole = useSessionStore((s) => s.role);
  const revealedTileKeys = useCombatStore((s) => s.revealedTileKeys);
  const revealedEnemyIds = useCombatStore((s) => s.revealedEnemyIds);
  const visionRange = useCombatStore((s) => s.visionRange);
  const toggleRevealTile = useCombatStore((s) => s.toggleRevealTile);
  const toggleRevealEnemy = useCombatStore((s) => s.toggleRevealEnemy);
  const setVisionRange = useCombatStore((s) => s.setVisionRange);
  const {
    participants,
    turn,
    round,
    isActive,
    nextTurn,
    previousTurn,
    setTurn,
    reorderParticipants,
    moveCombatant,
    toggleTile,
    setTiles,
    clearTiles,
    initializeCombat,
    resetCombat,
    endCombat,
    encounterCount,
    tiles,
    mapCols,
    mapRows,
    setMapSize,
    chat,
    sendChatMessage,
  } = useCombatStore();

  const { savedLayouts, saveLayout, savedLayout: getSavedLayout, deleteLayout, exportLayouts, importLayouts } = useLayoutStore();

  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Combatant | null>(null);
  // Ficha seleccionada en el mapa (resalta sus movimientos posibles).
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  // Modo de colocar tiles en el mapa.
  const [tileMode, setTileMode] = useState(false);
  // Tipo de tile seleccionado.
  const [tileType, setTileType] = useState<TileType>('wall');
  const [view, setView] = useState<'list' | 'map'>('list');

  // Pantalla completa del módulo de combate (con respaldo CSS en móviles).
  const { isFullscreen, toggle: toggleFullscreen, targetRef: combatRef, overlayClass } = useFullscreen();

  // Ordenar por iniciativa (descendente)
  const sorted = useMemo(
    () => [...participants].sort((a, b) => b.initiative - a.initiative),
    [participants]
  );

  const activeIndex = useMemo(() => {
    if (!isActive || sorted.length === 0) return -1;
    return Math.min(turn, sorted.length - 1);
  }, [isActive, turn, sorted.length]);

  const activeCombatant = activeIndex >= 0 ? sorted[activeIndex] : null;

  // Siguiente combatiente en el orden de turnos (para resaltarlo antes de pulsar «Siguiente»).
  const nextCombatant = useMemo(() => {
    if (!isActive || sorted.length === 0) return null;
    if (turn < 0) return sorted[0];
    return sorted[(turn + 1) % sorted.length];
  }, [isActive, turn, sorted]);

  // --- Gestión de layouts de mapa ------------------------------------------
  const handleSaveLayout = (name: string) => {
    if (!name.trim()) return;
    // Guardar solo muros para compatibilidad con layouts existentes.
    const walls = tiles.filter((t) => t.type === 'wall').map((t) => ({ x: t.x, y: t.y }));
    saveLayout(name, walls);
  };
  const handleLoadLayout = (id: string) => {
    const layout = getSavedLayout(id);
    if (layout) setTiles(layout.barriers.map((b) => ({ ...b, type: 'wall' })));
  };
  const handleDeleteLayout = (id: string) => {
    deleteLayout(id);
  };
  const handleRandomLayout = () => {
    const { barriers: b } = randomLayout();
    setTiles(b.map((t) => ({ ...t, type: 'wall' })));
  };

  const handleExportLayouts = () => {
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

  const handleImportLayouts = () => {
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
        const { added, skipped } = importLayouts(text);
        if (added > 0 || skipped > 0) {
          console.log(`Importados: ${added}, Omitidos (duplicados/inválidos): ${skipped}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

return (
    <div
      ref={combatRef}
      className={`flex h-dvh min-h-0 flex-col gap-3 overflow-hidden p-2 md:p-4 ${overlayClass ?? ''}`}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex flex-wrap items-center justify-between gap-3 py-3"
      >
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="page-title flex items-center gap-2">
            <Swords size={22} aria-hidden="true" />
            Combate
          </h2>

          {/* Pantalla completa (asociada al mapa, lado izquierdo) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa del combate'}
            icon={isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          >
            <span className="hidden sm:inline">{isFullscreen ? 'Salir' : 'Pantalla completa'}</span>
          </Button>

          {isActive ? (
            <p className="truncate text-sm text-dnd-muted">
              Ronda <span className="text-lg font-bold text-dnd-text">{round}</span> · Turno{' '}
              {sorted.length > 0 ? (
                activeIndex >= 0 ? (
                  <span className="text-dnd-text">{activeCombatant?.name ?? '—'}</span>
                ) : (
                  <span className="text-dnd-muted">sin iniciar — pulsa «Siguiente»</span>
                )
              ) : (
                'sin combatientes'
              )}
            </p>
          ) : (
            <p className="text-sm text-dnd-muted">
              No hay un combate activo{encounterCount > 0 ? ` · ${encounterCount} encuentros realizados` : ''}
            </p>
          )}
        </div>

        <div className="page-actions">
          {/* Selector de vista */}
          <div
            className="flex items-center gap-0.5 rounded-lg bg-dnd-leather/30 p-0.5"
            role="group"
            aria-label="Vista de combate"
          >
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                view === 'list' ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={`rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                view === 'map' ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'
              }`}
            >
              Mapa
            </button>
          </div>

          {isActive ? (
            <>
              <Button variant="ghost" size="sm" onClick={previousTurn} aria-label="Turno anterior" icon={<ChevronLeft size={16} />}>
                <span className="hidden sm:inline">Anterior</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={nextTurn}
                aria-label="Siguiente turno"
                icon={<ChevronRight size={16} />}
              >
                Siguiente
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowAdd(true)} icon={<Plus size={16} />}>
                Añadir
              </Button>
              <Button variant="danger" size="sm" onClick={endCombat} icon={<Flag size={16} />}>
                <span className="hidden sm:inline">Finalizar</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={resetCombat} aria-label="Reiniciar combate" icon={<RotateCcw size={16} />}>
                <span className="hidden sm:inline">Reiniciar</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                onClick={initializeCombat}
                icon={<Play size={16} />}
                aria-label="Iniciar combate"
              >
                Iniciar combate
              </Button>
              <Button variant="secondary" onClick={() => setShowAdd(true)} icon={<UserPlus size={16} />}>
                Añadir al prepararse
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Barra de progreso del turno (compacta, arriba) */}
      {isActive && sorted.length > 0 && (
        <div
          className="card flex items-center gap-3 px-4 py-2"
          role="group"
          aria-label="Selección de turno por posiciones"
        >
          <span className="whitespace-nowrap text-[11px] uppercase text-dnd-muted">
            Turnos {activeIndex >= 0 ? `${activeIndex + 1} / ${sorted.length}` : '—'}
          </span>
          <div className="flex flex-1 gap-1">
            {sorted.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setTurn(i)}
                aria-label={`Saltar al turno de ${c.name}`}
                aria-current={i === activeIndex ? 'true' : undefined}
                className={`h-2.5 min-w-4 flex-1 rounded-full transition-all ${
                  i === activeIndex
                    ? 'bg-dnd-gold shadow-dnd-glow'
                    : c.isDead
                      ? 'bg-red-900/70'
                      : 'bg-dnd-leather/40 hover:bg-dnd-leather/70'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Contenido principal: mapa/lista a la izquierda, registro a la derecha */}
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {view === 'list' ? (
            <div className="h-full overflow-y-auto pr-1">
              <InitiativeOrder
                participants={sorted}
                activeIndex={activeIndex}
                onReorder={reorderParticipants}
                onOpenActions={setSelected}
              />
            </div>
          ) : (
            <CombatMap
              participants={sorted}
              activeId={activeCombatant?.id}
              nextId={nextCombatant?.id}
              selectedId={selectedTokenId}
              tiles={tiles}
              tileType={tileType}
              onTileTypeChange={setTileType}
              tileMode={tileMode}
              onToggleTileMode={() => setTileMode((v) => !v)}
              onToggleTile={toggleTile}
              onClearTiles={clearTiles}
              savedLayouts={savedLayouts}
              onSaveLayout={handleSaveLayout}
              onLoadLayout={handleLoadLayout}
              onDeleteLayout={handleDeleteLayout}
              onRandomLayout={handleRandomLayout}
              onExportLayouts={handleExportLayouts}
              onImportLayouts={handleImportLayouts}
              onSelect={setSelectedTokenId}
              onOpenActions={setSelected}
              onMove={moveCombatant}
              cols={mapCols ?? 28}
              rows={mapRows ?? 16}
              onMapSizeChange={setMapSize}
            />
          )}
        </div>
        <div className="relative z-[60] hidden min-h-0 w-[19rem] shrink-0 flex-col md:flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTileMode((v) => !v)}
            aria-pressed={tileMode}
            aria-label="Modo tiles: colocar muros, trampas, tesoros, investigación"
            className={`mb-2 w-full justify-center gap-2 text-xs ${
              tileMode ? '!border-amber-400 !bg-amber-500/20 !text-amber-200' : ''
            }`}
            icon={<span aria-hidden="true">🧱</span>}
          >
            {tileMode ? 'Colocando tiles (clic en el mapa)' : 'Tiles (muros/trampas/tesoros)'}
          </Button>
          {sessionRole === 'dm' && (
            <FogOfWarPanel
              participants={participants}
              tiles={tiles}
              visionRange={visionRange}
              revealedTileKeys={revealedTileKeys}
              revealedEnemyIds={revealedEnemyIds}
              onToggleTile={toggleRevealTile}
              onToggleEnemy={toggleRevealEnemy}
              onVisionRange={setVisionRange}
            />
          )}
          <div className="flex h-56 min-h-0 shrink-0 flex-col">
            <ChatPanel
              messages={chat ?? []}
              participants={participants}
              onSend={sendChatMessage}
            />
          </div>
          <CombatLog />
        </div>
      </div>

      {/* Modales */}
      <AddCombatantModal open={showAdd} onClose={() => setShowAdd(false)} />
      <CombatantActionsModal key={selected?.id ?? 'none'} combatant={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default CombatTracker;
