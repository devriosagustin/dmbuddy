// ============================================================
// Ficha ampliada de un miembro del party (vista de jugador).
// Muestra características, habilidades, salvaciones y los chips
// de conjuros/dotes/armas con vínculo a la biblioteca (SRD 5.2).
// ============================================================

import { useState } from 'react';
import { Modal } from '../common/Modal';
import { SrdDetailPanel } from '../reference/SrdDetailPanel';
import { abilityModifier } from '../../utils/diceUtils';
import { skillBonus } from '../../utils/skills';
import { srdSpellByTitle, srdFeatByTitle, srdWeaponById } from '../../data/srd2024';
import { weaponAttackBonus, weaponDamageFormula } from '../../utils/weaponUtils';
import { STAT_LABELS } from '../../types';
import type { Combatant, PlayerStats } from '../../types';
import { SpellChip, FeatChip } from '../players/srdChips';

interface PlayerPartyDetailProps {
  combatant: Combatant | null;
  onClose: () => void;
}

/** Muestra 1 columna de característica (abreviatura, mod y valor). */
const StatBox = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-dnd-leather/40 bg-dnd-ink/50 px-2 py-1 text-center">
    <span className="block text-[10px] text-dnd-muted">{label}</span>
    <span className="block font-fantasy text-sm font-bold text-dnd-gold">
      {abilityModifier(value) >= 0 ? `+${abilityModifier(value)}` : abilityModifier(value)}
    </span>
    <span className="block text-[10px] text-dnd-muted">{value}</span>
  </div>
);

export const PlayerPartyDetail = ({ combatant, onClose }: PlayerPartyDetailProps) => {
  const [openSpellId, setOpenSpellId] = useState<string | null>(null);
  const [openFeatId, setOpenFeatId] = useState<string | null>(null);

  const openSpellEntry = openSpellId ? (srdSpellByTitle(openSpellId) ?? null) : null;
  const openFeatEntry = openFeatId ? (srdFeatByTitle(openFeatId) ?? null) : null;

  const stats: PlayerStats | undefined = combatant?.playerStats;
  const prof = combatant?.playerProficiencyBonus ?? 2;

  const weapons = (combatant?.weaponIds ?? [])
    .map((id) => srdWeaponById(id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));

  return (
    <>
      <Modal
        open={combatant !== null}
        onClose={onClose}
        title={combatant?.name ?? ''}
        subtitle={combatant ? 'Miembro del party · consulta su ficha y rasgos en la biblioteca' : undefined}
        maxWidth="lg"
      >
        {combatant && (
          <div className="flex flex-col gap-3">
            {/* Cabecera rápida */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="badge border border-sky-500/40 bg-dnd-ink/60 text-sky-300">🛡️ CA {combatant.armorClass}</span>
              <span className="badge border border-red-500/40 bg-dnd-ink/60 text-red-300">❤️ {combatant.hp}/{combatant.maxHp} PG</span>
              <span className="text-dnd-muted">Competencia +{prof}</span>
            </div>

            {/* Características */}
            {stats && (
              <div className="grid grid-cols-6 gap-1.5">
                {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((key) => (
                  <StatBox key={key} label={STAT_LABELS[key]} value={stats[key]} />
                ))}
              </div>
            )}

            {/* Habilidades con competencia */}
            {combatant.playerSkills && combatant.playerSkills.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase text-dnd-muted">
                  Habilidades ({combatant.playerSkills.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {[...combatant.playerSkills]
                    .sort((a, b) => a.localeCompare(b))
                    .map((name) => {
                      const bonus = stats ? skillBonus(stats, name, true, prof) : 0;
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

            {/* Salvaciones */}
            {combatant.playerSaves && combatant.playerSaves.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase text-dnd-muted">Salvaciones competentes: {combatant.playerSaves.join(' · ')}</p>
              </div>
            )}

            {/* Armas equipadas */}
            {weapons.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] uppercase text-dnd-muted">Armas ({weapons.length})</p>
                {weapons.map((wpn) => {
                  const atk = stats ? weaponAttackBonus(wpn, stats, prof) : 0;
                  const dmg = stats ? weaponDamageFormula(wpn, stats) : wpn.damage;
                  return (
                    <div key={wpn.id} className="rounded-lg border border-dnd-leather/30 bg-dnd-ink/40 p-2 text-[11px]">
                      <p className="font-bold text-dnd-gold">⚔️ {wpn.name} · {wpn.damage} {wpn.damageType}</p>
                      <p className="text-dnd-text">
                        Ataque <span className="font-bold">+{atk}</span> · Daño <span className="font-bold">{dmg}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Conjuros y dotes (vínculo a biblioteca) */}
            <div className="flex flex-col gap-2 text-[11px] text-dnd-muted">
              {combatant.playerCantrips && combatant.playerCantrips.length > 0 && (
                <div>
                  <p className="mb-1">✨ {combatant.playerCantrips.length} trucos</p>
                  <div className="flex flex-wrap gap-1">
                    {combatant.playerCantrips.map((spell) => (
                      <SpellChip key={spell.id} spell={spell} onOpen={setOpenSpellId} />
                    ))}
                  </div>
                </div>
              )}
              {combatant.playerSpells && combatant.playerSpells.length > 0 && (
                <div>
                  <p className="mb-1">🌟 {combatant.playerSpells.length} conjuros</p>
                  <div className="flex flex-wrap gap-1">
                    {[...combatant.playerSpells]
                      .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
                      .map((spell) => (
                        <SpellChip key={spell.id} spell={spell} onOpen={setOpenSpellId} />
                      ))}
                  </div>
                </div>
              )}
              {combatant.playerFeats && combatant.playerFeats.length > 0 && (
                <div>
                  <p className="mb-1">🛡️ {combatant.playerFeats.length} dote{combatant.playerFeats.length !== 1 ? 's' : ''}</p>
                  <div className="flex flex-wrap gap-1">
                    {combatant.playerFeats.map((title) => (
                      <FeatChip key={title} title={title} onOpen={setOpenFeatId} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-dnd-muted">
              Toca un conjuro o una dote para abrir su ficha completa en la biblioteca.
            </p>
          </div>
        )}
      </Modal>

      <SrdDetailPanel entry={openSpellEntry} onClose={() => setOpenSpellId(null)} />
      <SrdDetailPanel entry={openFeatEntry} onClose={() => setOpenFeatId(null)} />
    </>
  );
};