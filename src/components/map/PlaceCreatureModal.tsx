// ============================================================
// Modal para colocar una criatura persistente en el mapa
// (monstruos de la biblioteca o NPCs). La criatura queda en el
// mapa en modo exploración y puede entrar en un encuentro.
// ============================================================

import { useMemo, useState } from 'react';
import { Plus, Search, Hand, Skull, Users, BookMarked, Save, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useCombatStore } from '../../store/combatStore';
import { useMonsterStore } from '../../store/monsterStore';
import { useNpcStore } from '../../store/npcStore';
import { usePlayerStore } from '../../store/playerStore';
import { useEncounterPresetStore } from '../../store/encounterPresetStore';
import { crToXp } from '../../data/srdMonsters';
import type { EncounterPresetMonster } from '../../types';

interface PlaceCreatureModalProps {
  open: boolean;
  onClose: () => void;
}

const npcIcon: Record<string, string> = {
  hostage: '🪢',
  ally: '🤝',
  neutral: '⚖️',
  enemy: '🗡️',
};

const npcLabel: Record<string, string> = {
  hostage: 'Rehén',
  ally: 'Aliado',
  neutral: 'Neutral',
  enemy: 'Enemigo',
};

/**
 * Añade una criatura (monstruo o NPC) al mapa en una casilla libre.
 */
export const PlaceCreatureModal = ({ open, onClose }: PlaceCreatureModalProps) => {
  const monsters = useMonsterStore((s) => s.monsters);
  const npcs = useNpcStore((s) => s.npcs);
  const players = usePlayerStore((s) => s.players);
  const mapCreatures = useCombatStore((s) => s.mapCreatures);
  const partyTokens = useCombatStore((s) => s.partyTokens);
  const addMapCreature = useCombatStore((s) => s.addMapCreature);
  const setPartyToken = useCombatStore((s) => s.setPartyToken);
  const mapCols = useCombatStore((s) => s.mapCols);
  const mapRows = useCombatStore((s) => s.mapRows);

  const presets = useEncounterPresetStore((s) => s.presets);
  const savePreset = useEncounterPresetStore((s) => s.savePreset);
  const deletePreset = useEncounterPresetStore((s) => s.deletePreset);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'monsters' | 'npcs' | 'players' | 'presets'>('monsters');
  const [presetName, setPresetName] = useState('');

  const filteredPlayers = useMemo(() => {
    const placedIds = new Set(partyTokens.map((t) => t.playerId));
    const list = players.filter((pl) => !placedIds.has(pl.id));
    if (!search.trim()) return list;
    return list.filter((pl) => pl.name.toLowerCase().includes(search.toLowerCase()));
  }, [players, partyTokens, search]);

  const filteredMonsters = useMemo(() => {
    if (!search.trim()) return monsters;
    return monsters.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [monsters, search]);

  const filteredNpcs = useMemo(() => {
    if (!search.trim()) return npcs;
    return npcs.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()));
  }, [npcs, search]);

  // Primera casilla libre (sin ficha de criatura ni de party, y sin muro).
  const freeCell = (): { x: number; y: number } => {
    for (let y = 0; y < mapRows; y++) {
      for (let x = 0; x < mapCols; x++) {
        const occupied = mapCreatures.some((c) => c.x === x && c.y === y) || partyTokens.some((t) => t.x === x && t.y === y);
        if (!occupied) return { x, y };
      }
    }
    return { x: 1, y: 1 };
  };

  // Coloca varios monstruos de una sola vez (usado por presets): calcula las
  // casillas libres localmente para no pisarse entre colocaciones sucesivas,
  // ya que el estado del store no se refresca entre llamadas dentro del loop.
  const placeMonstersBatch = (items: EncounterPresetMonster[]) => {
    const occupied = new Set(mapCreatures.map((c) => `${c.x},${c.y}`));
    for (const t of partyTokens) occupied.add(`${t.x},${t.y}`);
    const findFree = (): { x: number; y: number } => {
      for (let y = 0; y < mapRows; y++) {
        for (let x = 0; x < mapCols; x++) {
          const key = `${x},${y}`;
          if (!occupied.has(key)) return { x, y };
        }
      }
      return { x: 1, y: 1 };
    };
    for (const item of items) {
      const monster = monsters.find((m) => m.id === item.monsterId);
      if (!monster) continue; // el monstruo pudo haberse borrado del catálogo
      for (let i = 0; i < item.quantity; i++) {
        const cell = findFree();
        occupied.add(`${cell.x},${cell.y}`);
        addMapCreature({
          name: monster.name,
          kind: 'monster',
          refId: monster.id,
          x: cell.x,
          y: cell.y,
          hp: monster.hitPoints,
          maxHp: monster.hitPoints,
          tempHp: 0,
          armorClass: monster.armorClass,
          speed: Number((monster.speed ?? '').match(/\d+/)?.[0]) || 30,
          xpReward: crToXp(monster.challengeRating),
          statusEffects: [],
          isDead: false,
          monsterType: monster.type,
          monsterSize: monster.size,
        });
      }
    }
  };

  const placeMonster = (monsterId: string) => {
    placeMonstersBatch([{ monsterId, quantity: 1 }]);
    onClose();
  };

  // Composición de monstruos actualmente colocados en el mapa, agrupada por
  // id del catálogo — es lo que se guarda como preset reutilizable.
  const currentMonsterComposition = useMemo((): EncounterPresetMonster[] => {
    const counts = new Map<string, number>();
    for (const c of mapCreatures) {
      if (c.kind !== 'monster' || !c.refId) continue;
      counts.set(c.refId, (counts.get(c.refId) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([monsterId, quantity]) => ({ monsterId, quantity }));
  }, [mapCreatures]);

  const presetSummary = (items: EncounterPresetMonster[]) => {
    const parts = items.map((item) => {
      const monster = monsters.find((m) => m.id === item.monsterId);
      return `${item.quantity}× ${monster?.name ?? '(monstruo borrado)'}`;
    });
    const totalXp = items.reduce((sum, item) => {
      const monster = monsters.find((m) => m.id === item.monsterId);
      return sum + (monster ? crToXp(monster.challengeRating) * item.quantity : 0);
    }, 0);
    return { text: parts.join(', '), totalXp };
  };

  const handleSavePreset = () => {
    if (currentMonsterComposition.length === 0) return;
    savePreset(presetName, currentMonsterComposition);
    setPresetName('');
  };

  const loadPreset = (items: EncounterPresetMonster[]) => {
    placeMonstersBatch(items);
    onClose();
  };

  const placeNpc = (npcId: string) => {
    const npc = npcs.find((n) => n.id === npcId);
    if (!npc) return;
    const cell = freeCell();
    addMapCreature({
      name: npc.name,
      kind: 'npc',
      refId: npc.id,
      x: cell.x,
      y: cell.y,
      hp: npc.hp,
      maxHp: npc.maxHp,
      tempHp: 0,
      armorClass: npc.armorClass,
      speed: npc.speed ?? 30,
      npcRole: npc.role,
      statusEffects: [],
      isDead: false,
    });
    onClose();
  };

  const placePlayer = (playerId: string) => {
    const player = players.find((pl) => pl.id === playerId);
    if (!player) return;
    const cell = freeCell();
    // Los miembros del party NO son criaturas: solo se fija la posición de su
    // ficha en el mapa (partyTokens), separada de las criaturas.
    setPartyToken(player.id, cell.x, cell.y);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Añadir al mapa"
      subtitle="Se coloca en una casilla libre y permanece hasta que la retires"
      maxWidth="xl"
    >
      <div className="mb-4 flex gap-2" role="tablist" aria-label="Tipo de criatura">
        <button
          role="tab"
          aria-selected={tab === 'monsters'}
          onClick={() => setTab('monsters')}
          className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'monsters'
              ? 'bg-dnd-gold text-dnd-ink'
              : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          <Skull size={14} /> Monstruos
        </button>
        <button
          role="tab"
          aria-selected={tab === 'npcs'}
          onClick={() => setTab('npcs')}
          className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'npcs'
              ? 'bg-dnd-gold text-dnd-ink'
              : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          <Hand size={14} /> NPCs
        </button>
        <button
          role="tab"
          aria-selected={tab === 'players'}
          onClick={() => setTab('players')}
          className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'players'
              ? 'bg-dnd-gold text-dnd-ink'
              : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          <Users size={14} /> Party
        </button>
        <button
          role="tab"
          aria-selected={tab === 'presets'}
          onClick={() => setTab('presets')}
          className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'presets'
              ? 'bg-dnd-gold text-dnd-ink'
              : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          <BookMarked size={14} /> Presets
        </button>
      </div>

      {tab !== 'presets' && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dnd-muted" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre…"
            className="input pl-9"
          />
        </div>
      )}

      <div className="max-h-80 space-y-1 overflow-y-auto pr-1" role="list" aria-label="Criaturas disponibles">
        {tab === 'presets' ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-dnd-leather/30 bg-dnd-leather/5 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-dnd-muted">
                Guardar como preset
              </p>
              {currentMonsterComposition.length === 0 ? (
                <p className="text-xs text-dnd-muted">
                  Coloca monstruos en el mapa (pestaña «Monstruos») y después guárdalos aquí como preset
                  reutilizable.
                </p>
              ) : (
                <>
                  <p className="mb-2 text-xs text-dnd-muted">
                    Monstruos en el mapa ahora: {presetSummary(currentMonsterComposition).text} · XP total{' '}
                    {presetSummary(currentMonsterComposition).totalXp}
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Nombre del preset (p. ej. Emboscada de goblins)"
                      className="input h-8 min-w-0 flex-1 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSavePreset();
                      }}
                    />
                    <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={handleSavePreset}>
                      Guardar
                    </Button>
                  </div>
                </>
              )}
            </div>

            {presets.length === 0 ? (
              <p className="py-6 text-center text-sm text-dnd-muted">
                Todavía no guardaste ningún preset de encuentro.
              </p>
            ) : (
              presets.map((preset) => {
                const { text, totalXp } = presetSummary(preset.monsters);
                return (
                  <div
                    key={preset.id}
                    role="listitem"
                    className="flex items-center justify-between gap-2 rounded-lg border border-dnd-leather/30 px-3 py-2 transition-colors hover:border-dnd-gold/50 hover:bg-dnd-leather/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{preset.name}</p>
                      <p className="truncate text-[11px] text-dnd-muted">
                        {text} · XP total {totalXp}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus size={14} />}
                        onClick={() => loadPreset(preset.monsters)}
                        aria-label={`Colocar preset ${preset.name} en el mapa`}
                      >
                        Colocar
                      </Button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar el preset «${preset.name}»? Esta acción no se puede deshacer.`))
                            deletePreset(preset.id);
                        }}
                        aria-label={`Eliminar preset ${preset.name}`}
                        className="icon-btn"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : tab === 'monsters' ? (
          filteredMonsters.length === 0 ? (
            <p className="py-6 text-center text-sm text-dnd-muted">Sin resultados.</p>
          ) : (
            filteredMonsters.slice(0, 30).map((monster) => (
              <div
                key={monster.id}
                role="listitem"
                className="flex items-center justify-between gap-2 rounded-lg border border-dnd-leather/30 px-3 py-2 transition-colors hover:border-dnd-gold/50 hover:bg-dnd-leather/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{monster.name}</p>
                  <p className="text-[11px] text-dnd-muted">
                    CR {monster.challengeRating} · HP {monster.hitPoints}
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => placeMonster(monster.id)}
                  aria-label={`Colocar ${monster.name} en el mapa`}
                >
                  Colocar
                </Button>
              </div>
            ))
          )
        ) : tab === 'players' ? (
          players.length === 0 ? (
            <p className="py-6 text-center text-sm text-dnd-muted">
              No hay personajes en el party. Créalos en la pestaña «Party» del menú.
            </p>
          ) : filteredPlayers.length === 0 ? (
            <p className="py-6 text-center text-sm text-dnd-muted">
              {search.trim() ? 'Sin resultados.' : 'Todos los miembros del party ya están en el mapa.'}
            </p>
          ) : (
            filteredPlayers.map((player) => (
              <div
                key={player.id}
                role="listitem"
                className="flex items-center justify-between gap-2 rounded-lg border border-dnd-leather/30 px-3 py-2 transition-colors hover:border-dnd-gold/50 hover:bg-dnd-leather/10"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span aria-hidden="true">
                    <Users size={15} className="shrink-0 text-emerald-400" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{player.name}</p>
                    <p className="text-[11px] text-dnd-muted">
                      {player.race ? `${player.race} · ` : ''}
                      {player.class} · Nv {player.level} · HP {player.hp}/{player.maxHp}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => placePlayer(player.id)}
                  aria-label={`Colocar ${player.name} en el mapa`}
                >
                  Colocar
                </Button>
              </div>
            ))
          )
        ) : filteredNpcs.length === 0 ? (
          <p className="py-6 text-center text-sm text-dnd-muted">
            No hay NPCs. Créalos en la pestaña «NPC» del menú.
          </p>
        ) : (
          filteredNpcs.map((npc) => (
            <div
              key={npc.id}
              role="listitem"
              className="flex items-center justify-between gap-2 rounded-lg border border-dnd-leather/30 px-3 py-2 transition-colors hover:border-dnd-gold/50 hover:bg-dnd-leather/10"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true">{npcIcon[npc.role] ?? '🤖'}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{npc.name}</p>
                  <p className="text-[11px] text-dnd-muted">
                    {npcLabel[npc.role] ?? npc.role} · HP {npc.hp}/{npc.maxHp}
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => placeNpc(npc.id)}
                aria-label={`Colocar ${npc.name} en el mapa`}
              >
                Colocar
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex justify-end border-t border-dnd-leather/30 pt-3">
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
};

export default PlaceCreatureModal;