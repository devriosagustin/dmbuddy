// ============================================================
// Tarjeta de jugador del party
// ============================================================

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Download, Edit, Swords, Trash2 } from 'lucide-react';
import type { Player } from '../../types';
import { HealthBar } from '../common/HealthBar';
import { abilityModifier } from '../../utils/diceUtils';
import { useCombatStore } from '../../store/combatStore';
import { useDice } from '../../hooks/useDice';
import { playerToCombatant } from '../../utils/combatUtils';
import { srdSpellByTitle, srdWeaponById, srdFeatByTitle } from '../../data/srd2024';
import { weaponAttackBonus, weaponDamageFormula } from '../../utils/weaponUtils';
import { SrdDetailPanel } from '../reference/SrdDetailPanel';
import { STAT_LABELS } from '../../types';
import type { Spell } from '../../types';
import { skillBonus } from '../../utils/skills';
import { SpellSlotsPanel } from './SpellSlotsPanel';
import { XpBar } from './XpBar';

interface PlayerCardProps {
  player: Player;
  onEdit: (player: Player) => void;
  onRemove: (id: string) => void;
}

/**
 * Tarjeta resumen de un personaje jugador.
 */
export const PlayerCard = ({ player, onEdit, onRemove }: PlayerCardProps) => {
  const { addCombatant, isActive, initializeCombat } = useCombatStore();
  const participants = useCombatStore((s) => s.participants);
  const { roll } = useDice();
  const [copied, setCopied] = useState(false);
  const [openSpellId, setOpenSpellId] = useState<string | null>(null);
  const [openFeatId, setOpenFeatId] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const alreadyInCombat = participants.some((p) => p.playerId === player.id);

  const weapons = (player.weaponIds ?? [])
    .map((id) => srdWeaponById(id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));

  const openSpellEntry = openSpellId ? (srdSpellByTitle(openSpellId) ?? null) : null;
  const openFeatEntry = openFeatId ? (srdFeatByTitle(openFeatId) ?? null) : null;

  const addToCombat = () => {
    if (alreadyInCombat) return;
    if (!isActive) initializeCombat();
    const r = roll('d20');
    addCombatant(playerToCombatant(player, r.result));
  };

  const exportJSON = () => {
    const json = JSON.stringify(player, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    if (downloadRef.current) {
      downloadRef.current.href = url;
      downloadRef.current.download = `${player.name.replace(/\s+/g, '_')}.json`;
      downloadRef.current.click();
      URL.revokeObjectURL(url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const initials = player.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card group flex flex-col gap-3 hover:border-dnd-gold/60"
    >
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-dnd-gold/50 bg-gradient-to-b from-dnd-leather/50 to-dnd-ink font-fantasy text-base font-bold text-dnd-gold"
            aria-hidden="true"
          >
            {initials}
          </span>
          <div>
            <h3 className="font-fantasy text-lg font-bold text-dnd-text">{player.name}</h3>
            <p className="text-xs text-dnd-muted">
              {player.race ? `${player.race} · ` : ''}Nv {player.level} · {player.class}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 hover-reveal">
          <button
            onClick={() => onEdit(player)}
            aria-label={`Editar a ${player.name}`}
            className="icon-btn hover:text-dnd-text"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={exportJSON}
            aria-label={`Exportar a ${player.name} como JSON`}
            className="icon-btn hover:text-dnd-gold"
          >
            <Download size={15} />
          </button>
          <button
            onClick={() => onRemove(player.id)}
            aria-label={`Eliminar a ${player.name}`}
            className="rounded-lg p-1.5 text-dnd-muted hover:bg-dnd-blood/30 hover:text-red-300 focus:outline-none"
          >
            <Trash2 size={15} />
          </button>
        </div>
        {/* Botón invisible para accesibilidad si no se usa hover */}
        <div className="flex md:hidden">
          <button onClick={() => onEdit(player)} aria-label={`Editar a ${player.name}`} className="rounded p-1.5 text-dnd-muted">
            <Edit size={15} />
          </button>
        </div>
      </div>

      {/* HP */}
      <HealthBar hp={player.hp} maxHp={player.maxHp} ariaLabel={`Puntos de golpe de ${player.name}`} />

      {/* XP */}
      <XpBar player={player} />

      {/* Stats rápidas */}
      <div className="flex items-center justify-between text-xs">
        <span className="badge border border-sky-500/40 bg-dnd-ink/60 text-sky-300">🛡️ CA {player.armorClass}</span>
        <span className="text-dnd-muted">Competencia +{player.proficiencyBonus}</span>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((key) => {
          const mod = abilityModifier(player.stats[key]);
          return (
            <div key={key} className="stat-box">
              <span className="text-[9px] text-dnd-muted">{STAT_LABELS[key]}</span>
              <span className="font-fantasy text-sm font-bold text-dnd-gold">
                {mod >= 0 ? `+${mod}` : mod}
              </span>
              <span className="text-[10px] text-dnd-muted">{player.stats[key]}</span>
            </div>
          );
        })}
      </div>

      {/* Habilidades con competencia */}
      {player.skills && player.skills.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] uppercase text-dnd-muted">
            Habilidades ({player.skills.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {[...player.skills]
              .sort((a, b) => a.localeCompare(b))
              .map((name) => {
                const bonus = skillBonus(player.stats, name, true, player.proficiencyBonus);
                return (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full border border-dnd-leather/40 bg-dnd-ink/50 px-2 py-0.5 text-[10px] text-dnd-text"
                  >
                    {name}
                    <span className="font-bold text-dnd-gold">{bonus >= 0 ? `+${bonus}` : bonus}</span>
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* Armas equipadas */}
      {weapons.length > 0 && (
        <div className="flex flex-col gap-1">
          {weapons.map((wpn) => {
            const atk = weaponAttackBonus(wpn, player.stats, player.proficiencyBonus);
            const dmg = weaponDamageFormula(wpn, player.stats);
            return (
              <div key={wpn.id} className="rounded-lg border border-dnd-leather/30 bg-dnd-ink/40 p-2 text-[10px]">
                <p className="font-bold text-dnd-gold">
                  ⚔️ {wpn.name} · {wpn.damage} {wpn.damageType}
                </p>
                <p className="text-dnd-text">
                  Ataque <span className="font-bold">+{atk}</span> · Daño <span className="font-bold">{dmg}</span>
                </p>
                {wpn.range && <p className="text-dnd-muted">Alcance {wpn.range} pies</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Espacios de conjuro */}
      <SpellSlotsPanel playerId={player.id} />

      <a ref={downloadRef} className="hidden" aria-hidden="true" tabIndex={-1} />
      {copied && <p className="sr-only" role="status">Exportado como JSON</p>}
      {(player.cantrips && player.cantrips.length > 0) ||
        (player.spells && player.spells.length > 0) || (player.feats && player.feats.length > 0) ? (
        <div className="flex flex-col gap-1.5 text-[11px] text-dnd-muted">
          {player.cantrips && player.cantrips.length > 0 && (
            <div>
              <p className="mb-1">✨ {player.cantrips.length} trucos</p>
              <div className="flex flex-wrap gap-1">
                {player.cantrips.map((spell) => (
                  <SpellChip key={spell.id} spell={spell} onOpen={setOpenSpellId} />
                ))}
              </div>
            </div>
          )}
          {player.spells && player.spells.length > 0 && (
            <div>
              <p className="mb-1">🌟 {player.spells.length} conjuros preparados</p>
              <div className="flex flex-wrap gap-1">
                {[...player.spells]
                  .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
                  .map((spell) => (
                    <SpellChip key={spell.id} spell={spell} onOpen={setOpenSpellId} />
                  ))}
              </div>
            </div>
          )}
          {player.feats && player.feats.length > 0 && (
            <div>
              <p className="mb-1">🛡️ {player.feats.length} dote{player.feats.length !== 1 ? 's' : ''}</p>
              <div className="flex flex-wrap gap-1">
                {player.feats.map((title) => (
                  <FeatChip key={title} title={title} onOpen={setOpenFeatId} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <button
        onClick={addToCombat}
        disabled={alreadyInCombat}
        className={`w-full text-sm ${alreadyInCombat ? 'btn-secondary opacity-50' : 'btn-secondary'}`}
        aria-label={`Añadir a ${player.name} al combate`}
        title={alreadyInCombat ? `${player.name} ya está en combate` : undefined}
      >
        <Swords size={14} aria-hidden="true" /> {alreadyInCombat ? 'Ya en combate' : 'Añadir al combate'}
      </button>

      <SrdDetailPanel entry={openSpellEntry} onClose={() => setOpenSpellId(null)} />
      <SrdDetailPanel entry={openFeatEntry} onClose={() => setOpenFeatId(null)} />
    </motion.article>
  );
};

/** Chip clicable de un conjuro: abre el detalle del SRD 5.2. */
const SpellChip = ({ spell, onOpen }: { spell: Spell; onOpen: (name: string) => void }) => (
  <button
    onClick={() => onOpen(spell.name)}
    title={`Ver detalle de ${spell.name}`}
    aria-label={`Ver detalle de ${spell.name}`}
    className="inline-flex max-w-full items-center gap-1 rounded-full border border-dnd-gold/30 bg-dnd-gold/10 px-2 py-0.5 text-[10px] text-dnd-text transition-colors hover:border-dnd-gold/60 hover:bg-dnd-gold/20"
  >
    <BookOpen size={10} className="shrink-0 text-dnd-gold" aria-hidden="true" />
    <span className="truncate">{spell.name}</span>
  </button>
);

/** Chip clicable de una dote: abre su texto completo del SRD 5.2 (o el título si no tiene ficha). */
const FeatChip = ({ title, onOpen }: { title: string; onOpen: (title: string) => void }) => (
  <button
    onClick={() => onOpen(title)}
    title={`Ver detalle de ${title}`}
    aria-label={`Ver detalle de ${title}`}
    className="inline-flex max-w-full items-center gap-1 rounded-full border border-dnd-gold/30 bg-dnd-gold/10 px-2 py-0.5 text-[10px] text-dnd-text transition-colors hover:border-dnd-gold/60 hover:bg-dnd-gold/20"
  >
    <BookOpen size={10} className="shrink-0 text-dnd-gold" aria-hidden="true" />
    <span className="truncate">{title}</span>
  </button>
);