// ============================================================
// Modal para colocar una criatura persistente en el mapa
// (monstruos de la biblioteca o NPCs). La criatura queda en el
// mapa en modo exploración y puede entrar en un encuentro.
// ============================================================

import { useMemo, useState } from 'react';
import { Plus, Search, Hand, Skull } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useCombatStore } from '../../store/combatStore';
import { useMonsterStore } from '../../store/monsterStore';
import { useNpcStore } from '../../store/npcStore';
import { crToXp } from '../../data/srdMonsters';

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
  const mapCreatures = useCombatStore((s) => s.mapCreatures);
  const addMapCreature = useCombatStore((s) => s.addMapCreature);
  const mapCols = useCombatStore((s) => s.mapCols);
  const mapRows = useCombatStore((s) => s.mapRows);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'monsters' | 'npcs'>('monsters');

  const filteredMonsters = useMemo(() => {
    if (!search.trim()) return monsters;
    return monsters.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [monsters, search]);

  const filteredNpcs = useMemo(() => {
    if (!search.trim()) return npcs;
    return npcs.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()));
  }, [npcs, search]);

  // Primera casilla libre (sin ficha y sin muro).
  const freeCell = (): { x: number; y: number } => {
    for (let y = 0; y < mapRows; y++) {
      for (let x = 0; x < mapCols; x++) {
        const occupied = mapCreatures.some((c) => c.x === x && c.y === y);
        if (!occupied) return { x, y };
      }
    }
    return { x: 1, y: 1 };
  };

  const placeMonster = (monsterId: string) => {
    const monster = monsters.find((m) => m.id === monsterId);
    if (!monster) return;
    const cell = freeCell();
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
    });
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Añadir criatura al mapa"
      subtitle="La criatura se coloca en una casilla libre y permanece hasta que la retires"
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
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dnd-muted" aria-hidden="true" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre…"
          className="input pl-9"
        />
      </div>

      <div className="max-h-80 space-y-1 overflow-y-auto pr-1" role="list" aria-label="Criaturas disponibles">
        {tab === 'monsters' ? (
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