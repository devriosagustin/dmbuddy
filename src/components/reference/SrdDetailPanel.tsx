// ============================================================
// Panel de detalle de una entrada del SRD 5.2
// Renderiza estadísticas específicas por colección + Markdown.
// ============================================================

import { useState } from 'react';
import { BookOpen, Dices, Plus, Shield, Sparkles, Swords } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MarkdownPreview } from '../notes/MarkdownPreview';
import { SrdSourceBadge, TagChip } from './SrdBadge';
import { useDice } from '../../hooks/useDice';
import { useMonsterStore } from '../../store/monsterStore';
import { srdMonsterToMonster } from '../../data/srd2024';
import { STAT_LABELS } from '../../types';
import { abilityModifier } from '../../utils/diceUtils';
import { SRD_CATEGORIES } from '../../types/srd2024';
import type { SrdRecord, SrdSpellEntry, SrdMonsterEntry } from '../../types/srd2024';

interface SrdDetailPanelProps {
  entry: SrdRecord | null;
  onClose: () => void;
}

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-dnd-leather/40 bg-dnd-ink/50 px-2.5 py-1.5">
    <p className="text-[10px] leading-none text-dnd-muted">{label}</p>
    <p className="mt-0.5 text-xs font-bold text-dnd-text">{value}</p>
  </div>
);

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center rounded-lg border border-dnd-leather/40 bg-dnd-ink/50 px-2 py-1">
    <span className="text-[10px] text-dnd-muted">{label}</span>
    <span className="font-fantasy text-sm font-bold text-dnd-text">{value}</span>
    <span className="text-[10px] text-dnd-gold">
      {abilityModifier(value) >= 0 ? `+${abilityModifier(value)}` : abilityModifier(value)}
    </span>
  </div>
);

/** Encabezado con ficha técnica de un conjuro + tirada rápida. */
const SpellBlock = ({ spell }: { spell: SrdSpellEntry }) => {
  const { roll } = useDice();
  const [last, setLast] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        <Meta label="Nivel" value={spell.level === 0 ? 'Truco' : `${spell.level}º`} />
        <Meta label="Escuela" value={spell.school} />
        <Meta label="Tiempo de lanzamiento" value={spell.castingTime} />
        <Meta label="Alcance" value={spell.range} />
        <Meta label="Componentes" value={spell.components} />
        <Meta label="Duración" value={spell.concentration ? `${spell.duration} (Conc.)` : spell.duration} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {spell.ritual && <TagChip label="Ritual" />}
        <span className="text-xs text-dnd-gold">
          Clases: <span className="text-dnd-text">{spell.classes.join(', ')}</span>
        </span>
        {spell.damageRolls && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Dices size={14} />}
            onClick={() => {
              const r = roll(spell.damageRolls as string);
              setLast(`${r.result} (${r.breakdown})`);
            }}
          >
            {last ? `Tirada: ${last}` : `Lanzar ${spell.damageRolls}`}
          </Button>
        )}
      </div>
    </>
  );
};

const MonsterBlock = ({ monster }: { monster: SrdMonsterEntry }) => {
  const addMonster = useMonsterStore((s) => s.addMonster);
  const [imported, setImported] = useState(false);

  const handleImport = () => {
    addMonster(srdMonsterToMonster(monster));
    setImported(true);
    setTimeout(() => setImported(false), 1500);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <span className="badge border border-dnd-gold/50 bg-dnd-gold/15 text-dnd-gold">CR {monster.challengeRating}</span>
        <TagChip label={`PG ${monster.hitPoints}`} />
        <TagChip label={`CA ${monster.armorClass}`} />
        <TagChip label={`Vel. ${monster.speed}`} />
        <TagChip label={monster.senses ?? 'Sentidos —'} />
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {(Object.keys(STAT_LABELS) as Array<keyof typeof STAT_LABELS>).map((key) => (
          <Stat key={key} label={STAT_LABELS[key]} value={monster.stats[key]} />
        ))}
      </div>

      {monster.traits.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
            <Sparkles size={14} aria-hidden="true" /> Rasgos
          </h3>
          <div className="space-y-2">
            {monster.traits.map((trait) => (
              <p key={trait.name} className="rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/30 p-2.5 text-xs text-dnd-text/85">
                <span className="font-bold italic text-dnd-text">{trait.name}.</span> {trait.description}
              </p>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
          <Swords size={14} aria-hidden="true" /> Acciones
        </h3>
        <div className="space-y-2">
          {monster.actions.map((action) => (
            <p key={action.name} className="rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/30 p-2.5 text-xs text-dnd-text/85">
              <span className="font-bold text-dnd-text">{action.name}</span>
              {action.attackBonus !== undefined && (
                <span className="ml-1 text-sky-300">+{action.attackBonus}</span>
              )}
              {action.damage && (
                <span className="ml-1 text-red-300">{action.damage} {action.damageType}</span>
              )}
              {action.description && <p className="mt-1 text-dnd-text/75">{action.description}</p>}
            </p>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleImport} disabled={imported}>
          {imported ? '¡En la biblioteca!' : 'Importar a la biblioteca'}
        </Button>
      </div>
    </>
  );
};

/**
 * Modal con el detalle completo de una entrada de referencia.
 */
export const SrdDetailPanel = ({ entry, onClose }: SrdDetailPanelProps) => {
  if (!entry) return null;

  const categoryLabel = SRD_CATEGORIES[entry.category].label;

  return (
    <Modal
      open={!!entry}
      onClose={onClose}
      title={entry.title}
      subtitle={`${categoryLabel} · ${entry.source === 'srd2024' ? 'SRD 5.2 (2024)' : entry.source}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <SrdSourceBadge source={entry.source} />
          {entry.tags.slice(0, 4).map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </div>

        {entry.category === 'spells' && <SpellBlock spell={entry} />}
        {entry.category === 'monsters' && <MonsterBlock monster={entry} />}
        {entry.category === 'classes' && (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <Meta label="Atributo principal" value={entry.primaryAbility} />
            <Meta label="Dados de golpe" value={entry.hitDice} />
            <Meta label="Armadura" value={entry.armorProficiency} />
            <Meta label="Salvaciones" value={entry.saves.join(', ')} />
          </div>
        )}
        {entry.category === 'species' && (
          <div className="flex flex-wrap gap-2">
            <TagChip label={`Tamaño: ${entry.size}`} />
            <TagChip label={`Velocidad: ${entry.speed} pies`} />
            {entry.traits.map((t) => (
              <TagChip key={t} label={t} />
            ))}
          </div>
        )}
        {entry.category === 'feats' && (
          <div className="flex flex-wrap gap-2">
            <TagChip label={entry.type === 'origin' ? 'Dote de origen' : 'Dote general'} />
            {entry.prerequisite && <TagChip label={`Requisito: ${entry.prerequisite}`} />}
          </div>
        )}
        {entry.category === 'rules' && entry.chapter && (
          <p className="flex items-center gap-1 text-xs text-dnd-muted">
            <BookOpen size={13} aria-hidden="true" /> {entry.chapter}
          </p>
        )}

        {'content' in entry && (
          <div className="border-t border-dnd-leather/30 pt-3">
            <MarkdownPreview content={entry.content} />
          </div>
        )}

        {entry.category === 'conditions' && (
          <p className="flex items-center gap-1 text-[11px] text-dnd-muted">
            <Shield size={12} aria-hidden="true" /> Aplica estos estados en el rastreador de combate desde las acciones del combatiente.
          </p>
        )}
      </div>
    </Modal>
  );
};