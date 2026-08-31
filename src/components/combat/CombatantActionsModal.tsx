// ============================================================
// Modal de acciones rápidas para un combatiente
// ============================================================

import { useState } from 'react';
import { BookOpen, Crosshair, Eye, Handshake, Dices, Trash2, Sparkles, Shield } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Combatant, Spell } from '../../types';
import { STAT_LABELS } from '../../types';
import type { StatAbbrev } from '../../types';
import { useCombatStore } from '../../store/combatStore';
import { useMonsterStore } from '../../store/monsterStore';
import { rollAttackAgainst } from '../../utils/damageCalculator';
import { abilityModifier } from '../../utils/diceUtils';
import { useDice } from '../../hooks/useDice';
import { srdSpellByTitle, srdWeaponById, srdFeatByTitle } from '../../data/srd2024';
import type { SrdWeaponEntry } from '../../data/srd2024';
import { weaponAttackBonus, weaponDamageBonus } from '../../utils/weaponUtils';
import { SrdDetailPanel } from '../reference/SrdDetailPanel';
import type { SrdSpellEntry, SrdFeatEntry } from '../../types/srd2024';
import { HealthBar } from '../common/HealthBar';

// Conjuros de curación: en combate se resuelven como curación, no como daño.
const HEALING_SPELL_IDS = new Set([
  'spell-cure-wounds',
  'spell-healing-word',
  'spell-mass-cure-wounds',
  'spell-heal',
]);

// Estados comunes rápidos de 5e
const QUICK_EFFECTS = [
  { name: 'Envenenado', duration: -1, description: 'Desventaja en tiradas de ataque y pruebas de habilidad', icon: '☠️' },
  { name: 'Paralizado', duration: -1, description: 'Inmovilizado e incapacitado; impactos en su contra son automáticos', icon: '🧊' },
  { name: 'Inconsciente', duration: -1, description: 'Incapacitado, derribado y sin percepción', icon: '😵' },
  { name: 'Asustado', duration: -1, description: 'Desventaja en tiradas de ataque mientras vea la fuente', icon: '😱' },
  { name: 'Derribado', duration: -1, description: 'Desventaja en tiradas de ataque; los ataques en su contra tienen ventaja', icon: '🛐' },
  { name: 'Cegado', duration: -1, description: 'Falla automáticamente pruebas que requieran visión', icon: '🙈' },
  { name: 'Apresado', duration: -1, description: 'Velocidad 0 e incapacitado para moverse', icon: '🪢' },
  { name: 'Aturdido', duration: -1, description: 'Salva falla automáticamente; pierde su turno si el efecto continúa', icon: '💫' },
];

interface CombatantActionsModalProps {
  combatant: Combatant | null;
  onClose: () => void;
}

/**
 * Modal de acciones: daño preciso, ataque de monstruo, estados y más.
 */
export const CombatantActionsModal = ({ combatant, onClose }: CombatantActionsModalProps) => {
  const { updateHP, removeCombatant, addStatusEffect, removeStatusEffect, setInitiative } = useCombatStore();
  const participants = useCombatStore((s) => s.participants);
  const turn = useCombatStore((s) => s.turn);
  const monsters = useMonsterStore((s) => s.monsters);
  const { roll } = useDice();

  const [damage, setDamage] = useState('');
  const [heal, setHeal] = useState('');
  const [temp, setTemp] = useState('');
  const [openSpellEntry, setOpenSpellEntry] = useState<SrdSpellEntry | null>(null);
  const [openFeatEntry, setOpenFeatEntry] = useState<SrdFeatEntry | null>(null);
  const [targetId, setTargetId] = useState<string>('');
  const [initVal, setInitVal] = useState<string>(() =>
    combatant ? String(combatant.initiative) : ''
  );

  if (!combatant) return null;

  const monster = monsters.find((m) => m.id === combatant.monsterId);
  const atac = damage !== '';

  // Objetivo por defecto: el del turno actual si no es el propio combatiente;
  // si no, el primero distinto; como último recurso, el propio combatiente.
  const live = participants.filter((p) => !p.isDead);
  const turnTarget = participants[turn];
  const defaultTarget =
    live.length === 0
      ? combatant
      : (turnTarget && turnTarget.id !== combatant.id
          ? live.find((p) => p.id === turnTarget.id)
          : undefined) ?? live.find((p) => p.id !== combatant.id) ?? live[0];
  const target = participants.find((p) => p.id === targetId && !p.isDead) ?? defaultTarget;

  // Armas equipadas del jugador (SRD 5.2)
  const wStats = combatant.playerStats;
  const weapons =
    combatant.type === 'player'
      ? (combatant.weaponIds ?? [])
          .map((id) => srdWeaponById(id))
          .filter((w): w is SrdWeaponEntry => Boolean(w))
      : [];

  const rollWeaponDamage = (formula: string): { result: number; breakdown: string } => {
    if (!/d/i.test(formula)) {
      const base = Number(formula) || 0;
      return { result: base, breakdown: String(base) };
    }
    const dr = roll(formula);
    return { result: dr.result, breakdown: dr.breakdown };
  };

  const attackWithWeapon = (weapon: SrdWeaponEntry) => {
    if (!wStats || !target) return;
    const wProf = combatant.playerProficiencyBonus ?? 2;
    const bonus = weaponAttackBonus(weapon, wStats, wProf);
    const dmgBonus = weaponDamageBonus(weapon, wStats);
    const d20 = roll('d20').result;
    const total = d20 + bonus;
    const crit = d20 === 20;
    const hit = crit || total >= target.armorClass;
    let damage = 0;
    let dmgBreakdown = '';
    if (hit) {
      const dr = rollWeaponDamage(weapon.damage);
      damage = dr.result + dmgBonus;
      dmgBreakdown = dmgBonus !== 0 ? `${dr.breakdown} + ${dmgBonus}` : dr.breakdown;
    }
    const attackLine = hit
      ? `impacto${crit ? ' · CRÍTICO' : ''} (${d20} + ${bonus} = ${total} ≥ CA ${target.armorClass})`
      : `falla (${d20} + ${bonus} = ${total} < CA ${target.armorClass})`;
    const damageLine = damage > 0 ? `, ${damage} de daño (${dmgBreakdown})` : '';
    useCombatStore.getState().addLogEntry({
      type: 'damage',
      message: `${combatant.name} ataca a ${target.name} con «${weapon.name}»: ${attackLine}${damageLine}`,
      combatantId: target.id,
    });
    if (damage > 0) updateHP(target.id, damage, true);
  };

  // Conjuros del monstruo resueltos contra el repertorio SRD (por título).
  const sc = monster?.spellcasting;
  const spellRows: { name: string; level: string; spell: SrdSpellEntry | undefined }[] = [];
  if (sc) {
    for (const [level, names] of Object.entries(sc.spellbook)) {
      for (const name of names) spellRows.push({ name, level, spell: srdSpellByTitle(name) });
    }
  }

  // Trucos y conjuros del jugador (para consultar su detalle en combate).
  // Se muestran ordenados: trucos, luego nivel 1, luego nivel 2, etc.
  const playerCantrips = combatant.playerCantrips ?? [];
  const playerSpells = combatant.playerSpells ?? [];
  const sortedPlayerSpells = [...playerSpells].sort(
    (a, b) => a.level - b.level || a.name.localeCompare(b.name)
  );
  const playerSpellGroups: { label: string; list: Spell[] }[] = [
    ...(playerCantrips.length > 0
      ? [{ label: `Trucos (${playerCantrips.length})`, list: [...playerCantrips].sort((a, b) => a.name.localeCompare(b.name)) }]
      : []),
    ...LevelList(sortedPlayerSpells),
  ];

  const castSpell = (row: { name: string; spell: SrdSpellEntry | undefined }) => {
    if (!monster) return;
    const spell = row.spell;
    const suffix = sc ? ` (CD ${sc.spellSaveDC})` : '';
    const receiver = target ?? combatant;
    if (!spell || !spell.damageRolls) {
      useCombatStore.getState().addLogEntry({
        type: 'custom',
        message: `${monster.name} lanza «${row.name}»${suffix}`,
        combatantId: receiver.id,
      });
      return;
    }
    const damageRoll = roll(spell.damageRolls);
    if (HEALING_SPELL_IDS.has(spell.id)) {
      updateHP(receiver.id, damageRoll.result, false);
      useCombatStore.getState().addLogEntry({
        type: 'heal',
        message: `${monster.name} lanza «${row.name}»: ${receiver.name} recupera ${damageRoll.result} PG (${damageRoll.breakdown})`,
        combatantId: receiver.id,
      });
    } else {
      updateHP(receiver.id, damageRoll.result, true);
      useCombatStore.getState().addLogEntry({
        type: 'damage',
        message: `${monster.name} lanza «${row.name}» contra ${receiver.name}: ${damageRoll.result} de daño (${damageRoll.breakdown})${suffix}`,
        combatantId: receiver.id,
      });
    }
  };

  // Estadísticas para las salvaciones (jugador desde el party, monstruo del bestiario)
  const saveStats = monster ? monster.stats : combatant.playerStats;

  const rollSavingThrow = (key: StatAbbrev) => {
    if (!saveStats) return;
    const d20 = roll('d20').result;
    const mod = abilityModifier(saveStats[key]);
    const prof =
      combatant.type === 'player' && combatant.playerSaves?.includes(key)
        ? (combatant.playerProficiencyBonus ?? 2)
        : 0;
    const total = d20 + mod + prof;
    const calc = prof !== 0 ? `${d20} + ${mod} + ${prof} = ${total}` : `${d20} + ${mod} = ${total}`;
    const natTag = d20 === 20 ? ' · 20 natural' : d20 === 1 ? ' · 1 natural' : '';
    useCombatStore.getState().addLogEntry({
      type: 'custom',
      message: `${combatant.name} tira salvación de ${STAT_LABELS[key]}: ${calc}${natTag}`,
      combatantId: combatant.id,
    });
  };

  const applyDamage = () => {
    const amount = Number(damage);
    if (!isNaN(amount) && amount > 0) {
      updateHP(combatant.id, amount, true);
      setDamage('');
    }
  };

  const applyHeal = () => {
    const amount = Number(heal);
    if (!isNaN(amount) && amount > 0) {
      updateHP(combatant.id, amount, false);
      setHeal('');
    }
  };

  const applyTemp = () => {
    const amount = Number(temp);
    if (!isNaN(amount) && amount >= 0) {
      useCombatStore.setState((s) => ({
        participants: s.participants.map((p) =>
          p.id === combatant.id ? { ...p, tempHp: amount } : p
        ),
      }));
      useCombatStore.getState().addLogEntry({
        type: 'status',
        message: `${combatant.name} obtiene ${amount} PG temporales`,
        combatantId: combatant.id,
      });
      setTemp('');
    }
  };

  const commitInit = () => {
    const value = Number(initVal);
    if (!isNaN(value)) setInitiative(combatant.id, value);
    setInitVal('');
  };

  const applyEffect = (name: string, description: string, icon: string) => {
    const already = combatant.statusEffects.some((e) => e.name === name);
    if (already) {
      const effect = combatant.statusEffects.find((e) => e.name === name);
      if (effect) removeStatusEffect(combatant.id, effect.id);
    } else {
      addStatusEffect(combatant.id, {
        name,
        duration: -1,
        description,
        icon,
      });
    }
  };

  return (
    <>
      <Modal
        open={!!combatant}
        onClose={onClose}
        title={combatant.name}
        subtitle={`${combatant.type === 'player' ? 'Jugador' : 'Monstruo'} · Iniciativa ${combatant.initiative}`}
        maxWidth="lg"
      >
      <div className="space-y-4">
        {/* Iniciativa editable (arriba a la derecha) */}
        <div className="flex items-center justify-end gap-2">
          <label htmlFor="combatant-init" className="text-xs font-bold uppercase text-dnd-gold">
            🎲 Iniciativa
          </label>
          <input
            id="combatant-init"
            value={initVal}
            onChange={(e) => setInitVal(e.target.value)}
            onBlur={commitInit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitInit(); }
            }}
            type="number"
            aria-label="Iniciativa del combatiente (reordena los turnos al cambiar)"
            title="Edita el valor y pulsa Enter o sal del campo para reordenar los turnos"
            className="input w-20 text-right text-sm"
          />
        </div>

        {/* Estado de vida */}
        <HealthBar hp={combatant.hp} maxHp={combatant.maxHp} tempHp={combatant.tempHp} isDead={combatant.isDead} />

        {/* Objetivo de ataques y conjuros */}
        {((monster && (monster.actions.length > 0 || (monster.spellcasting && spellRows.length > 0))) ||
        (weapons.length > 0 && wStats)) && (
          <div className="rounded-dnd-lg border border-dnd-leather/40 p-3">
            <label htmlFor="target-select" className="mb-1 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              <Crosshair size={14} aria-hidden="true" /> Objetivo de ataques y conjuros
            </label>
            <select
              id="target-select"
              value={target?.id ?? ''}
              onChange={(e) => setTargetId(e.target.value)}
              aria-label="Objetivo de ataques y conjuros"
              className="input text-sm"
            >
              {live.length === 0 && <option value={combatant.id}>{combatant.name} (único)</option>}
              {live.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.type === 'player' ? 'Jugador' : 'Monstruo'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Ataques de arma del jugador */}
        {weapons.length > 0 && wStats && (
          <div className="rounded-dnd-lg border border-dnd-leather/40 p-3">
            <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              <Crosshair size={14} aria-hidden="true" /> Ataques de {combatant.name}
            </p>
            <div className="space-y-1">
              {weapons.map((wpn) => {
                const wProf = combatant.playerProficiencyBonus ?? 2;
                const bonus = weaponAttackBonus(wpn, wStats, wProf);
                const dmgBonus = weaponDamageBonus(wpn, wStats);
                return (
                  <Button
                    key={wpn.id}
                    variant="secondary"
                    size="sm"
                    className="w-full justify-between text-left"
                    onClick={() => attackWithWeapon(wpn)}
                  >
                    <span>
                      {wpn.name} · <span className="text-xs text-dnd-muted">{wpn.kind === 'ranged' ? 'Distancia' : 'Melee'}</span>
                      <span className="ml-1 text-xs text-dnd-muted">
                        {wpn.damage} {wpn.damageType}
                        {dmgBonus !== 0 ? ` + ${dmgBonus}` : ''} · +{bonus}
                      </span>
                    </span>
                    <Crosshair size={14} aria-hidden="true" />
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Ataques del monstruo */}
        {monster && monster.actions.length > 0 && (
          <div className="rounded-dnd-lg border border-dnd-leather/40 p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              <Crosshair size={14} aria-hidden="true" /> Ataques de {monster.name}
            </p>
            <div className="space-y-1">
              {monster.actions.map((action) => (
                <Button
                  key={action.name}
                  variant="secondary"
                  size="sm"
                  className="w-full justify-between text-left"
                  onClick={() => {
                    const result = rollAttackAgainst(action, target.armorClass);
                    const crit = result.d20Roll === 20;
                    const attackLine = result.hit
                      ? `impacto${crit ? ' · CRÍTICO' : ''} (${result.d20Roll} + ${result.attackBonus} = ${result.attackTotal} ≥ CA ${result.targetAC})`
                      : `falla (${result.d20Roll} + ${result.attackBonus} = ${result.attackTotal} < CA ${result.targetAC})`;
                    const damageLine =
                      result.hit && result.totalDamage > 0
                        ? `, ${result.totalDamage} de daño (${result.damageRolls.join(', ')})`
                        : '';
                    useCombatStore.getState().addLogEntry({
                      type: 'damage',
                      message: `${monster.name} ataca a ${target.name}: ${attackLine}${damageLine}`,
                      combatantId: target.id,
                    });
                    if (result.hit && result.totalDamage > 0) {
                      updateHP(target.id, result.totalDamage, true);
                    }
                  }}
                >
                  <span>
                    {action.name}
                    {action.damage && <span className="ml-1 text-xs text-dnd-muted">({action.damage})</span>}
                  </span>
                  <Dices size={14} aria-hidden="true" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Conjuros del monstruo */}
        {monster?.spellcasting && spellRows.length > 0 && (
          <div className="rounded-dnd-lg border border-dnd-gold/30 p-3">
            <p className="mb-1 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              <Sparkles size={14} aria-hidden="true" /> Conjuros de {monster.name}
            </p>
            <p className="mb-2 text-[11px] text-dnd-muted">
              Habilidad {sc?.ability} · CD {sc?.spellSaveDC} · Ataque +{sc?.spellAttackBonus}
            </p>
            <div className="space-y-1">
              {spellRows.map((row) => (
                <div key={`${row.level}-${row.name}`} className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 justify-between text-left"
                    onClick={() => castSpell(row)}
                  >
                    <span>
                      <span className="mr-1 text-[10px] uppercase text-dnd-gold">{row.level}</span>
                      {row.name}
                      {row.spell?.damageRolls && (
                        <span className="ml-1 text-xs text-dnd-muted">
                          ({row.spell.damageRolls}
                          {row.spell.concentration ? ' · conc.' : ''})
                        </span>
                      )}
                    </span>
                    <Dices size={14} aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!row.spell}
                    title={`Ver detalle de ${row.name}`}
                    aria-label={`Ver detalle de ${row.name}`}
                    onClick={() => setOpenSpellEntry(row.spell ?? null)}
                  >
                    <BookOpen size={14} aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trucos y conjuros del jugador */}
        {combatant.type === 'player' && playerSpellGroups.length > 0 && (
          <div className="rounded-dnd-lg border border-dnd-gold/30 p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              <Sparkles size={14} aria-hidden="true" /> Conjuros de {combatant.name}
            </p>
            <div className="space-y-2">
              {playerSpellGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1 text-[10px] uppercase text-dnd-muted">{group.label}</p>
                  <div className="space-y-1">
                    {group.list.map((spell) => {
                      const entry = srdSpellByTitle(spell.name);
                      return (
                        <div key={spell.id} className="flex items-center gap-1">
                          <p className="min-w-0 flex-1 truncate text-sm">
                            <span className="mr-1 text-[10px] uppercase text-dnd-gold">
                              {spell.level === 0 ? 'Truco' : `N${spell.level}`}
                            </span>
                            <span className="font-bold">{spell.name}</span>
                            {entry?.damageRolls && (
                              <span className="ml-1 text-xs text-dnd-muted">
                                ({entry.damageRolls}
                                {entry.concentration ? ' · conc.' : ''})
                              </span>
                            )}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!entry}
                            title={`Ver detalle de ${spell.name}`}
                            aria-label={`Ver detalle de ${spell.name}`}
                            onClick={() => setOpenSpellEntry(entry ?? null)}
                          >
                            <BookOpen size={14} aria-hidden="true" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dotes y rasgos (consulta del texto reglado) */}
        {(combatant.type === 'player' && (combatant.playerFeats?.length ?? 0) > 0) ||
        (monster && monster.traits.length > 0) ? (
          <div className="rounded-dnd-lg border border-dnd-leather/40 p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              <BookOpen size={14} aria-hidden="true" /> Dotes y rasgos
            </p>
            {combatant.type === 'player' && (combatant.playerFeats?.length ?? 0) > 0 && (
              <>
                <p className="mb-1 text-[10px] uppercase text-dnd-muted">Dotes ({combatant.playerFeats?.length})</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {(combatant.playerFeats ?? []).map((title) => {
                    const entry = srdFeatByTitle(title);
                    return (
                      <button
                        key={title}
                        onClick={() => setOpenFeatEntry(entry ?? null)}
                        disabled={!entry}
                        title={entry ? `Ver detalle de ${title}` : `${title} (sin ficha SRD)`}
                        aria-label={`Ver detalle de ${title}`}
                        className="inline-flex max-w-full items-center gap-1 rounded-full border border-dnd-gold/30 bg-dnd-gold/10 px-2 py-0.5 text-[10px] text-dnd-text transition-colors hover:border-dnd-gold/60 hover:bg-dnd-gold/20"
                      >
                        <BookOpen size={10} className="shrink-0 text-dnd-gold" aria-hidden="true" />
                        <span className="truncate">{title}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {monster && monster.traits.length > 0 && (
              <>
                <p className="mb-1 text-[10px] uppercase text-dnd-muted">Rasgos de {monster.name} ({monster.traits.length})</p>
                <div className="space-y-1.5">
                  {monster.traits.map((trait) => (
                    <div key={trait.name} className="text-[11px]">
                      <p className="font-bold italic text-dnd-text">{trait.name}.</p>
                      <p className="text-dnd-text/85">{trait.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* Salvaciones */}
        {saveStats && (
          <div className="rounded-dnd-lg border border-dnd-leather/40 p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              <Shield size={14} aria-hidden="true" /> Salvaciones de {combatant.name}
            </p>
            <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="Tiradas de salvación">
              {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((key) => {
                const mod = abilityModifier(saveStats[key]);
                const prof =
                  combatant.type === 'player' && combatant.playerSaves?.includes(key)
                    ? (combatant.playerProficiencyBonus ?? 2)
                    : 0;
                const total = mod + prof;
                return (
                  <Button
                    key={key}
                    variant="secondary"
                    size="sm"
                    className="flex-col justify-center"
                    onClick={() => rollSavingThrow(key)}
                    title={`Tirar salvación de ${STAT_LABELS[key]}`}
                  >
                    <span className="text-[10px] uppercase text-dnd-gold">{STAT_LABELS[key]}</span>
                    <span className="text-xs">{total >= 0 ? `+${total}` : total}</span>
                  </Button>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-dnd-muted">
              Toca un atributo para tirar d20 + modificador
              {combatant.type === 'player' && combatant.playerSaves && combatant.playerSaves.length > 0
                ? ' (+ competencia si la clase es competente)'
                : ''}
              . El resultado queda en el log.
            </p>
          </div>
        )}

        {/* Daño / Curación / Temp */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label htmlFor="dmg-input" className="label">Daño</label>
            <div className="flex gap-1">
              <input
                id="dmg-input"
                value={damage}
                onChange={(e) => setDamage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyDamage()}
                type="number"
                placeholder="0"
                className="input text-sm"
                aria-label="Cantidad de daño a aplicar"
              />
              <Button variant="danger" size="sm" onClick={applyDamage}>
                {atac ? 'Aplicar' : 'Dañar'}
              </Button>
            </div>
          </div>
          <div>
            <label htmlFor="heal-input" className="label">Cura</label>
            <div className="flex gap-1">
              <input
                id="heal-input"
                value={heal}
                onChange={(e) => setHeal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyHeal()}
                type="number"
                placeholder="0"
                className="input text-sm"
                aria-label="Cantidad de curación"
              />
              <Button variant="secondary" size="sm" onClick={applyHeal}>
                Curar
              </Button>
            </div>
          </div>
          <div>
            <label htmlFor="temp-input" className="label">Temp PG</label>
            <div className="flex gap-1">
              <input
                id="temp-input"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyTemp()}
                type="number"
                placeholder="0"
                className="input text-sm"
                aria-label="Puntos de golpe temporales"
              />
              <Button variant="secondary" size="sm" onClick={applyTemp}>
                Fijar
              </Button>
            </div>
          </div>
        </div>

        {/* Estados rápidos */}
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
            <Eye size={14} aria-hidden="true" /> Estados
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EFFECTS.map((effect) => {
              const active = combatant.statusEffects.some((e) => e.name === effect.name);
              return (
                <button
                  key={effect.name}
                  onClick={() => applyEffect(effect.name, effect.description, effect.icon)}
                  className={`badge border px-2 py-1 text-xs transition-colors ${
                    active
                      ? 'border-dnd-blood bg-dnd-blood/40 text-white'
                      : 'border-dnd-leather/50 bg-dnd-ink/50 text-dnd-text hover:border-dnd-gold'
                  }`}
                  aria-pressed={active}
                  aria-label={`${active ? 'Quitar' : 'Aplicar'} ${effect.name}`}
                >
                  <span aria-hidden="true">{effect.icon}</span> {effect.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Peligro y estabilización */}
        <div className="flex justify-between border-t border-dnd-leather/30 pt-3">
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={() => {
              removeCombatant(combatant.id);
              onClose();
            }}
          >
            Eliminar del combate
          </Button>
          {combatant.isDead && (
            <Button
              variant="primary"
              size="sm"
              icon={<Handshake size={14} />}
              onClick={() => {
                useCombatStore.setState((s) => ({
                  participants: s.participants.map((p) =>
                    p.id === combatant.id
                      ? { ...p, hp: 1, isDead: false }
                      : p
                  ),
                }));
                onClose();
              }}
            >
              Estabilizar
            </Button>
          )}
        </div>
      </div>
      </Modal>

      <SrdDetailPanel entry={openSpellEntry} onClose={() => setOpenSpellEntry(null)} />
      <SrdDetailPanel entry={openFeatEntry} onClose={() => setOpenFeatEntry(null)} />
    </>
  );
};

/** Agrupa conjuros por nivel (nivel 1, 2, 3...) en orden ascendente. */
const LevelList = (spells: Spell[]): { label: string; list: Spell[] }[] => {
  const byLevel = new Map<number, Spell[]>();
  for (const s of spells) {
    const list = byLevel.get(s.level) ?? [];
    list.push(s);
    byLevel.set(s.level, list);
  }
  return [...byLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, list]) => ({
      label: `Conjuros nivel ${level} (${list.length})`,
      list,
    }));
};