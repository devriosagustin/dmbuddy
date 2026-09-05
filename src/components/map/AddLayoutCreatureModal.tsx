// ============================================================
// Modal para precargar NPCs y monstruos en un MAPA GUARDADO
// (biblioteca de mapas), sin tener que cargarlo primero en el
// mapa en vivo de la sesión. Escribe directamente en
// `layout.creatures` (LayoutCreature[]) vía layoutStore, a
// diferencia de PlaceCreatureModal, que agrega a `mapCreatures`
// del mapa en vivo (combatStore).
// ============================================================

import { useMemo, useState } from 'react';
import { Plus, Search, Skull, Users, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useMonsterStore } from '../../store/monsterStore';
import { useNpcStore } from '../../store/npcStore';
import { useLayoutStore } from '../../store/layoutStore';
import { crToXp } from '../../data/srdMonsters';
import { creatureIcon } from '../../utils/combatUtils';
import type { MapLayout, LayoutCreature } from '../../utils/layoutPatterns';

interface AddLayoutCreatureModalProps {
  open: boolean;
  onClose: () => void;
  layout: MapLayout;
  cols: number;
  rows: number;
}

const npcLabel: Record<string, string> = {
  hostage: 'Rehén',
  ally: 'Aliado',
  neutral: 'Neutral',
  enemy: 'Enemigo',
};

/**
 * Añade una criatura (monstruo o NPC) a un mapa guardado en una casilla
 * libre (sin otra criatura ya puesta ahí). Pensado para precargar
 * encuentros en la biblioteca de mapas, antes de que el DM lo cargue en
 * el mapa en vivo.
 */
export const AddLayoutCreatureModal = ({ open, onClose, layout, cols, rows }: AddLayoutCreatureModalProps) => {
  const monsters = useMonsterStore((s) => s.monsters);
  const npcs = useNpcStore((s) => s.npcs);
  const addLayoutCreature = useLayoutStore((s) => s.addLayoutCreature);
  const removeLayoutCreature = useLayoutStore((s) => s.removeLayoutCreature);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'monsters' | 'npcs' | 'placed'>('monsters');

  const layoutCreatures = layout.creatures ?? [];

  const filteredMonsters = useMemo(() => {
    if (!search.trim()) return monsters;
    return monsters.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [monsters, search]);

  const filteredNpcs = useMemo(() => {
    if (!search.trim()) return npcs;
    return npcs.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()));
  }, [npcs, search]);

  // Primera casilla libre (sin otra criatura ya puesta ahí).
  const freeCell = (): { x: number; y: number } => {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!layoutCreatures.some((c) => c.x === x && c.y === y)) return { x, y };
      }
    }
    return { x: 0, y: 0 };
  };

  const placeMonster = (monsterId: string) => {
    const monster = monsters.find((m) => m.id === monsterId);
    if (!monster) return;
    const cell = freeCell();
    const creature: LayoutCreature = {
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
      monsterType: monster.type,
      monsterSize: monster.size,
    };
    addLayoutCreature(layout.id, creature);
  };

  const placeNpc = (npcId: string) => {
    const npc = npcs.find((n) => n.id === npcId);
    if (!npc) return;
    const cell = freeCell();
    const creature: LayoutCreature = {
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
    };
    addLayoutCreature(layout.id, creature);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Añadir NPC o monstruo al mapa"
      subtitle={`Se coloca en una casilla libre de «${layout.name}» y queda guardado con el mapa`}
      maxWidth="xl"
    >
      <div className="mb-4 flex gap-2" role="tablist" aria-label="Tipo de criatura">
        <button
          role="tab"
          aria-selected={tab === 'monsters'}
          onClick={() => setTab('monsters')}
          className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'monsters' ? 'bg-dnd-gold text-dnd-ink' : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          <Skull size={14} /> Monstruos
        </button>
        <button
          role="tab"
          aria-selected={tab === 'npcs'}
          onClick={() => setTab('npcs')}
          className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'npcs' ? 'bg-dnd-gold text-dnd-ink' : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          <Users size={14} /> NPCs
        </button>
        <button
          role="tab"
          aria-selected={tab === 'placed'}
          onClick={() => setTab('placed')}
          className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'placed' ? 'bg-dnd-gold text-dnd-ink' : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          Ya puestos ({layoutCreatures.length})
        </button>
      </div>

      {tab !== 'placed' && (
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
        {tab === 'placed' ? (
          layoutCreatures.length === 0 ? (
            <p className="py-6 text-center text-sm text-dnd-muted">
              Todavía no hay NPCs ni monstruos precargados en este mapa.
            </p>
          ) : (
            layoutCreatures.map((c, i) => (
              <div
                key={`${c.name}-${c.x}-${c.y}-${i}`}
                role="listitem"
                className="flex items-center justify-between gap-2 rounded-lg border border-dnd-leather/30 px-3 py-2 transition-colors hover:border-dnd-gold/50 hover:bg-dnd-leather/10"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span aria-hidden="true">
                    {c.kind === 'player' ? '🧑' : creatureIcon(c.kind, { monsterType: c.monsterType, npcRole: c.npcRole })}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{c.name}</p>
                    <p className="text-[11px] text-dnd-muted">
                      ({c.x},{c.y}) · HP {c.hp}/{c.maxHp}
                      {c.npcRole ? ` · ${npcLabel[c.npcRole] ?? c.npcRole}` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeLayoutCreature(layout.id, c.x, c.y)}
                  aria-label={`Quitar ${c.name} de este mapa`}
                  className="icon-btn shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )
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
                  aria-label={`Añadir ${monster.name} a este mapa`}
                >
                  Añadir
                </Button>
              </div>
            ))
          )
        ) : npcs.length === 0 ? (
          <p className="py-6 text-center text-sm text-dnd-muted">
            No hay NPCs creados todavía. Creálos en la pestaña «NPCs» del menú.
          </p>
        ) : filteredNpcs.length === 0 ? (
          <p className="py-6 text-center text-sm text-dnd-muted">Sin resultados.</p>
        ) : (
          filteredNpcs.map((npc) => (
            <div
              key={npc.id}
              role="listitem"
              className="flex items-center justify-between gap-2 rounded-lg border border-dnd-leather/30 px-3 py-2 transition-colors hover:border-dnd-gold/50 hover:bg-dnd-leather/10"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{npc.name}</p>
                <p className="text-[11px] text-dnd-muted">
                  {npcLabel[npc.role] ?? npc.role} · HP {npc.hp}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => placeNpc(npc.id)}
                aria-label={`Añadir ${npc.name} a este mapa`}
              >
                Añadir
              </Button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};
