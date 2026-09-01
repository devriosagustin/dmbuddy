// ============================================================
// Modal para añadir combatientes (monstruo o jugador)
// ============================================================

import { useMemo, useState } from 'react';
import { User, Plus, Search, Hand } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useCombatStore } from '../../store/combatStore';
import { useMonsterStore } from '../../store/monsterStore';
import { usePlayerStore } from '../../store/playerStore';
import { useNpcStore } from '../../store/npcStore';
import { monsterToCombatant, playerToCombatant, npcToCombatant } from '../../utils/combatUtils';
import { useDice } from '../../hooks/useDice';

interface AddCombatantModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal de añadir: monstruos de la biblioteca, custom, jugadores del party o NPC.
 */
export const AddCombatantModal = ({ open, onClose }: AddCombatantModalProps) => {
  const monsters = useMonsterStore((s) => s.monsters);
  const players = usePlayerStore((s) => s.players);
  const npcs = useNpcStore((s) => s.npcs);
  const addCombatant = useCombatStore((s) => s.addCombatant);
  const participants = useCombatStore((s) => s.participants);
  const isActive = useCombatStore((s) => s.isActive);
  const initializeCombat = useCombatStore((s) => s.initializeCombat);
  const { roll } = useDice();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'monsters' | 'players' | 'npcs'>('monsters');
  const [customName, setCustomName] = useState('');
  const [customHP, setCustomHP] = useState('');
  const [customAC, setCustomAC] = useState('');
  const [customInitiative, setCustomInitiative] = useState('');
  const [batchCount, setBatchCount] = useState(1);

  const filteredMonsters = useMemo(() => {
    if (!search.trim()) return monsters;
    return monsters.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [monsters, search]);

  const ensureCombat = () => {
    if (!isActive) initializeCombat();
  };

  const addMonster = (monsterId: string, count = 1) => {
    const monster = monsters.find((m) => m.id === monsterId);
    if (!monster) return;
    ensureCombat();
    // El store etiqueta las copias del mismo monstruo (a, b, c...) al entrar.
    for (let i = 0; i < count; i++) {
      const rollResult = roll('d20');
      addCombatant(monsterToCombatant(monster, rollResult.result));
    }
  };

  const addPlayer = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;
    if (participants.some((p) => p.playerId === playerId)) return;
    ensureCombat();
    const rollResult = roll('d20');
    addCombatant(playerToCombatant(player, rollResult.result));
  };

  const addNpc = (npcId: string) => {
    const npc = npcs.find((n) => n.id === npcId);
    if (!npc) return;
    if (participants.some((p) => p.npcId === npcId)) return;
    ensureCombat();
    const rollResult = roll('d20');
    addCombatant(npcToCombatant(npc, rollResult.result));
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    ensureCombat();
    const hp = Number(customHP) || 10;
    const ac = Number(customAC) || 10;
    const initiative = Number(customInitiative) || (roll('d20').result);
    addCombatant({
      name: customName.trim(),
      initiative,
      hp,
      maxHp: hp,
      tempHp: 0,
      armorClass: ac,
      type: 'monster',
      statusEffects: [],
    });
    setCustomName('');
    setCustomHP('');
    setCustomAC('');
    setCustomInitiative('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Añadir combatiente"
      subtitle="Elige un monstruo de la biblioteca o un jugador del party"
      maxWidth="xl"
    >
      {/* Pestañas */}
      <div className="mb-4 flex gap-2" role="tablist" aria-label="Tipo de combatiente">
        <button
          role="tab"
          aria-selected={tab === 'monsters'}
          onClick={() => setTab('monsters')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'monsters'
              ? 'bg-dnd-gold text-dnd-ink'
              : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          Monstruos
        </button>
        <button
          role="tab"
          aria-selected={tab === 'players'}
          onClick={() => setTab('players')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'players'
              ? 'bg-dnd-gold text-dnd-ink'
              : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <User size={14} aria-hidden="true" /> Jugadores
          </span>
        </button>
        <button
          role="tab"
          aria-selected={tab === 'npcs'}
          onClick={() => setTab('npcs')}
          className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            tab === 'npcs'
              ? 'bg-dnd-gold text-dnd-ink'
              : 'bg-dnd-leather/30 text-dnd-muted hover:text-dnd-text'
          }`}
        >
          <span className="inline-flex items-center gap-1">
            <Hand size={14} aria-hidden="true" /> NPCs
          </span>
        </button>
      </div>

      {tab === 'monsters' && (
        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <label htmlFor="monster-search" className="sr-only">Buscar monstruo</label>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dnd-muted" aria-hidden="true" />
            <input
              id="monster-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar monstruo por nombre…"
              className="input pl-9"
            />
          </div>

          {/* Lista */}
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1" role="list" aria-label="Monstruos disponibles">
            {filteredMonsters.length === 0 && (
              <p className="py-6 text-center text-sm text-dnd-muted">Sin resultados.</p>
            )}
            {filteredMonsters.slice(0, 30).map((monster) => (
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
                <div className="flex shrink-0 items-center gap-1">
                  <select
                    value={batchCount}
                    onChange={(e) => setBatchCount(Number(e.target.value))}
                    aria-label={`Cantidad de ${monster.name}`}
                    className="rounded border border-dnd-leather/50 bg-dnd-ink/70 px-1 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-dnd-gold"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={14} />}
                    onClick={() => addMonster(monster.id, batchCount)}
                    aria-label={`Añadir ${batchCount} ${monster.name} al combate`}
                  >
                    Añadir
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Combatiente propio */}
          <div className="rounded-dnd-lg border border-dashed border-dnd-leather/50 p-3">
            <p className="mb-2 text-xs font-bold uppercase text-dnd-muted">Combatiente personalizado</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Nombre"
                aria-label="Nombre del combatiente"
                className="input col-span-2 md:col-span-2 text-sm"
              />
              <input
                value={customHP}
                onChange={(e) => setCustomHP(e.target.value)}
                placeholder="PG"
                type="number"
                aria-label="Puntos de golpe"
                className="input text-sm"
              />
              <input
                value={customAC}
                onChange={(e) => setCustomAC(e.target.value)}
                placeholder="CA"
                type="number"
                aria-label="Clase de armadura"
                className="input text-sm"
              />
              <input
                value={customInitiative}
                onChange={(e) => setCustomInitiative(e.target.value)}
                placeholder="Inic."
                type="number"
                aria-label="Iniciativa"
                className="input text-sm"
              />
            </div>
            <Button variant="secondary" size="sm" className="mt-2" icon={<Plus size={14} />} onClick={addCustom}>
              Añadir personalizado
            </Button>
          </div>
        </div>
      )}

      {tab === 'players' && (
        <div className="space-y-2" role="list" aria-label="Jugadores disponibles">
          {players.length === 0 && (
            <p className="py-6 text-center text-sm text-dnd-muted">
              No hay jugadores. Crea tu party en la pestaña «Party».
            </p>
          )}
          {players.map((player) => (
            <div
              key={player.id}
              role="listitem"
              className="flex items-center justify-between gap-2 rounded-lg border border-dnd-leather/30 px-3 py-2 hover:border-dnd-gold/50 hover:bg-dnd-leather/10"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-900 font-bold text-emerald-200">
                  {player.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{player.name}</p>
                  <p className="text-[11px] text-dnd-muted">
                    Nv {player.level} · HP {player.hp}/{player.maxHp}
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={participants.some((p) => p.playerId === player.id) ? undefined : <Plus size={14} />}
                disabled={participants.some((p) => p.playerId === player.id)}
                onClick={() => addPlayer(player.id)}
                aria-label={`Añadir a ${player.name} al combate`}
              >
                {participants.some((p) => p.playerId === player.id) ? 'En combate' : 'Añadir'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {tab === 'npcs' && (
        <div className="space-y-2" role="list" aria-label="NPCs disponibles">
          {npcs.length === 0 && (
            <p className="py-6 text-center text-sm text-dnd-muted">
              No hay NPCs. Créalos en la pestaña «NPC» del menú.
            </p>
          )}
          {npcs.map((npc) => {
            const inCombat = participants.some((p) => p.npcId === npc.id);
            return (
              <div
                key={npc.id}
                role="listitem"
                className="flex items-center justify-between gap-2 rounded-lg border border-dnd-leather/30 px-3 py-2 hover:border-dnd-gold/50 hover:bg-dnd-leather/10"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold"
                    aria-hidden="true"
                  >
                    {npc.role === 'hostage' ? '🪢' : '🤝'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{npc.name}</p>
                    <p className="text-[11px] text-dnd-muted">
                      {npc.role === 'hostage' ? 'Rehén' : 'Aliado'} · HP {npc.hp}/{npc.maxHp}
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={inCombat ? undefined : <Plus size={14} />}
                  disabled={inCombat}
                  onClick={() => addNpc(npc.id)}
                  aria-label={`Añadir a ${npc.name} al combate`}
                >
                  {inCombat ? 'En combate' : 'Añadir'}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex justify-end border-t border-dnd-leather/30 pt-3">
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
};