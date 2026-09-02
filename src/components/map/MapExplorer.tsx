// ============================================================
// Mapa de exploración (DM)
// Página propia del mapa: colocación de criaturas (monstruos, NPCs)
// persistentes, inicio/fin de encuentros sin dejar de usar el mapa,
// cortina de guerra y herramientas iguales a las de combate.
// ============================================================

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Play,
  Plus,
  Flag,
  RotateCcw,
  Trash2,
  Users,
  Skull,
} from 'lucide-react';
import { Button } from '../common/Button';
import { CombatMap } from '../combat/CombatMap';
import { CombatLog } from '../combat/CombatLog';
import { ChatPanel } from '../combat/ChatPanel';
import { CombatantActionsModal } from '../combat/CombatantActionsModal';
import { PlayerPartyDetail } from '../combat/PlayerPartyDetail';
import { PlaceCreatureModal } from './PlaceCreatureModal';
import { StartEncounterModal } from './StartEncounterModal';
import { CreatureEditorModal } from './CreatureEditorModal';
import { useCombatStore } from '../../store/combatStore';
import { useLayoutStore } from '../../store/layoutStore';
import { usePlayerStore } from '../../store/playerStore';
import { useFullscreen } from '../../hooks/useFullscreen';
import { randomLayout } from '../../utils/layoutPatterns';
import { mapCreatureToCombatant, playerToCombatant } from '../../utils/combatUtils';
import type { Combatant, MapCreature, TileType } from '../../types';

/**
 * Página del mapa: siempre muestra el mapa. En modo exploración permite
 * colocar/mover criaturas; con un encuentro activo muestra sus fichas y la
 * barra de turnos. Al finalizar el encuentro, las criaturas sobrevivientes
 * permanecen en el mapa para futuros encuentros.
 */
export const MapExplorer = () => {
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
    tiles,
    mapCols,
    mapRows,
    setMapSize,
    chat,
    sendChatMessage,
    toggleTile,
    setTiles,
    clearTiles,
    moveCombatant,
    mapCreatures,
    removeMapCreature,
    updateMapCreature,
    endCombat,
    resetCombat,
    partyTokens,
    setPartyToken,
    removePartyToken,
    clearMap,
  } = useCombatStore();
  const players = usePlayerStore((s) => s.players);

  const { savedLayouts, saveLayout, savedLayout: getSavedLayout, deleteLayout, exportLayouts, importLayouts } = useLayoutStore();

  const [tileType, setTileType] = useState<TileType>('wall');
  const [tileMode, setTileMode] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [selected, setSelected] = useState<Combatant | null>(null);
  const [editingCreature, setEditingCreature] = useState<MapCreature | null>(null);
  const [partyDetail, setPartyDetail] = useState<Combatant | null>(null);

  const { isFullscreen, toggle: toggleFullscreen, targetRef: mapRef, overlayClass } = useFullscreen();

  // Tokens mostrados: en exploración las criaturas del mapa + las fichas del
  // party (que NO son criaturas); en encuentro, los combatientes activos.
  const tokens = useMemo<Combatant[]>(() => {
    if (isActive) return participants;
    const creatureTokens = mapCreatures.map(mapCreatureToCombatant);
    const partyTokensOnMap = partyTokens
      .map((t) => {
        const player = players.find((p) => p.id === t.playerId);
        if (!player) return null;
        // Ficha ocasional para renderizar/tocar: conserva la posición de la
        // ficha y lleva todos los datos del PJ (para abrir su detalle completo).
        const c: Combatant = {
          ...playerToCombatant(player, 0),
          id: `party-${player.id}`,
          x: t.x,
          y: t.y,
        };
        return c;
      })
      .filter((c): c is Combatant => c !== null);
    return [...creatureTokens, ...partyTokensOnMap];
  }, [isActive, participants, mapCreatures, partyTokens, players]);

  const handleMove = (id: string, x: number, y: number) => {
    if (isActive) {
      moveCombatant(id, x, y);
    } else if (id.startsWith('party-')) {
      const playerId = id.replace('party-', '');
      setPartyToken(playerId, x, y);
    } else {
      updateMapCreature(id, { x, y });
    }
  };

  const handleOpenActions = (combatant: Combatant) => {
    // En exploración, abrimos el editor de la criatura del mapa o el detalle
    // completo de un miembro del party (su ficha). En encuentro, el modal de
    // acciones de combate.
    if (isActive) {
      setSelected(combatant);
    } else if (combatant.id.startsWith('party-')) {
      setPartyDetail(combatant);
    } else {
      const creature = mapCreatures.find((c) => c.id === combatant.id);
      if (creature) setEditingCreature(creature);
    }
  };

  const handleClearMap = () => {
    const total = mapCreatures.length + partyTokens.length;
    if (total === 0) return;
    if (window.confirm(`¿Vaciar el mapa de ${total} ficha${total !== 1 ? 's' : ''} (criaturas y party)?`)) {
      clearMap();
    }
  };

  // Layouts: guardar/exportar/importar incluye criaturas del mapa. Los
  // miembros del party no se guardan: sus fichas viven en partyTokens.
  const handleSaveLayout = (name: string) => {
    const walls = tiles.filter((t) => t.type === 'wall').map((t) => ({ x: t.x, y: t.y }));
    const creatures = mapCreatures
      .map((c) => ({
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
    saveLayout(name, walls, creatures);
  };
  const handleLoadLayout = (id: string) => {
    const layout = getSavedLayout(id);
    if (!layout) return;
    setTiles(layout.barriers.map((b) => ({ ...b, type: 'wall' as const })));
    // Restaurar las criaturas guardadas del layout. Las fichas del party
    // actuales se conservan (viven en partyTokens y no se guardan en layouts).
    // Los layouts antiguos podrían incluir kind === 'player' (legacy): se
    // descartan, pues los PJ ya no son criaturas.
    const restored: MapCreature[] = (layout.creatures ?? [])
      .filter((c): c is MapCreature & { kind: 'monster' | 'npc' } => c.kind !== 'player')
      .map((c) => ({
        id: `mc-${layout.id}-${c.x}-${c.y}-${Math.random().toString(36).slice(2, 8)}`,
        name: c.name,
        kind: c.kind,
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
        statusEffects: [],
        isDead: false,
      }));
    useCombatStore.setState({ mapCreatures: restored });
  };
  const handleDeleteLayout = (id: string) => deleteLayout(id);
  const handleRandomLayout = () => {
    const { barriers } = randomLayout();
    setTiles(barriers.map((t) => ({ ...t, type: 'wall' as const })));
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
        importLayouts(text);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const sorted = useMemo(
    () => [...participants].sort((a, b) => b.initiative - a.initiative),
    [participants]
  );
  const activeIndex = sorted.length > 0 ? Math.min(turn, sorted.length - 1) : -1;

  const hostileCreatures = mapCreatures.filter(
    (c) => c.kind === 'monster' || c.npcRole === 'enemy'
  );

  return (
    <div
      ref={mapRef}
      className={`flex h-dvh min-h-0 flex-col gap-3 overflow-hidden p-2 md:p-4 ${overlayClass ?? ''}`}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex flex-wrap items-center justify-between gap-3 py-3"
      >
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="page-title flex items-center gap-2">
            <MapPin size={22} aria-hidden="true" />
            Mapa
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa del mapa'}
          >
            {isFullscreen ? 'Salir' : 'Pantalla completa'}
          </Button>
          {isActive ? (
            <p className="truncate text-sm text-dnd-muted">
              Encuentro · Ronda <span className="font-bold text-dnd-text">{round}</span> ·{' '}
              {activeIndex >= 0 && sorted[activeIndex] ? (
                <span className="font-bold text-dnd-text">{sorted[activeIndex].name}</span>
              ) : (
                'sin iniciar'
              )}
            </p>
          ) : (
            <p className="text-sm text-dnd-muted">
              Exploración{hostileCreatures.length > 0 ? ` · ${hostileCreatures.length} criatura(s) hostil(es)` : ''}
            </p>
          )}
        </div>

        <div className="page-actions">
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
              <Button variant="danger" size="sm" onClick={endCombat} icon={<Flag size={16} />}>
                Finalizar encuentro
              </Button>
              <Button variant="ghost" size="sm" onClick={resetCombat} aria-label="Reiniciar encuentro" icon={<RotateCcw size={16} />}>
                <span className="hidden sm:inline">Reiniciar</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => setShowStart(true)} icon={<Play size={16} />}>
                Iniciar encuentro
              </Button>
              <Button variant="secondary" onClick={() => setShowAdd(true)} icon={<Plus size={16} />}>
                Añadir criatura
              </Button>
              {(mapCreatures.length > 0 || partyTokens.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearMap}
                  icon={<Trash2 size={15} />}
                  aria-label="Vaciar el mapa de criaturas y fichas del party"
                >
                  <span className="hidden sm:inline">Limpiar</span>
                </Button>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Barra de turnos del encuentro activo */}
      {isActive && sorted.length > 0 && (
        <div className="card flex items-center gap-3 px-4 py-2" role="group" aria-label="Selección de turno por posiciones">
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

      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <CombatMap
            participants={tokens}
            activeId={isActive && activeIndex >= 0 ? sorted[activeIndex]?.id : undefined}
            nextId={undefined}
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
            onOpenActions={handleOpenActions}
            onMove={handleMove}
            cols={mapCols ?? 28}
            rows={mapRows ?? 16}
            onMapSizeChange={setMapSize}
            visionRange={visionRange}
            onVisionRange={setVisionRange}
            revealedTileKeys={revealedTileKeys}
            revealedEnemyIds={revealedEnemyIds}
            onToggleRevealTile={toggleRevealTile}
            onToggleRevealEnemy={toggleRevealEnemy}
          />
        </div>

        <div className="relative z-[60] hidden min-h-0 w-[19rem] shrink-0 flex-col md:flex">
          {!isActive && (
            <div className="mb-2 flex flex-col gap-2 rounded-dnd-lg border border-dnd-leather/40 bg-dnd-leather/5 p-3">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-dnd-muted">
                <Users size={13} /> Criaturas en el mapa
              </h3>
              {mapCreatures.length === 0 && (
                <p className="text-[11px] text-dnd-muted">
                  Coloca monstruos o NPCs con «Añadir criatura». Solo estos entran en los encuentros.
                </p>
              )}
              <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto pr-0.5">
                {mapCreatures.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-dnd-leather/30 px-2.5 py-1.5 text-left text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-1.5 truncate font-bold">
                      {c.kind === 'monster' ? (
                        <Skull size={13} className="shrink-0 text-red-400" />
                      ) : (
                        <Users size={13} className="shrink-0 text-sky-400" />
                      )}
                      <span className="truncate">{c.name}</span>
                    </span>
                    <span className="shrink-0 text-[10px] text-dnd-muted">
                      ({c.x},{c.y}) {c.hp}/{c.maxHp}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMapCreature(c.id)}
                      className="shrink-0 text-[10px] font-bold text-red-300 hover:text-red-100"
                      aria-label={`Retirar a ${c.name} del mapa`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
                {partyTokens.map((t) => {
                  const player = players.find((p) => p.id === t.playerId);
                  if (!player) return null;
                  return (
                    <li
                      key={`party-${t.playerId}`}
                      className="flex items-center justify-between gap-2 rounded-md border border-emerald-500/30 px-2.5 py-1.5 text-left text-xs"
                    >
                      <span className="flex min-w-0 items-center gap-1.5 truncate font-bold text-emerald-200">
                        <Users size={13} className="shrink-0 text-emerald-400" />
                        <span className="truncate">{player.name} (party)</span>
                      </span>
                      <span className="shrink-0 text-[10px] text-dnd-muted">
                        ({t.x},{t.y}) {player.hp}/{player.maxHp}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePartyToken(player.id)}
                        className="shrink-0 text-[10px] font-bold text-red-300 hover:text-red-100"
                        aria-label={`Retirar a ${player.name} del mapa`}
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div className="flex h-56 min-h-0 shrink-0 flex-col">
            <ChatPanel messages={chat ?? []} participants={isActive ? participants : undefined} onSend={sendChatMessage} />
          </div>
          <CombatLog />
        </div>
      </div>

      <PlaceCreatureModal open={showAdd} onClose={() => setShowAdd(false)} />
      <StartEncounterModal open={showStart} onClose={() => setShowStart(false)} />
      <CreatureEditorModal creature={editingCreature} onClose={() => setEditingCreature(null)} />
      <CombatantActionsModal key={selected?.id ?? 'none'} combatant={selected} onClose={() => setSelected(null)} />
      <PlayerPartyDetail combatant={partyDetail} onClose={() => setPartyDetail(null)} />
    </div>
  );
};

export default MapExplorer;