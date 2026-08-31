// ============================================================
// Selector de habilidades (competencias) del personaje
// Lista las 18 habilidades del SRD 5.2 agrupadas por característica,
// mostrando su bonus total (modificador de atributo + competencia si
// el personaje la eligió) y limitando el número por clase/dotes.
// ============================================================

import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import type { PlayerStats, StatAbbrev } from '../../types';
import { STAT_LABELS } from '../../types';
import { skillBonus } from '../../utils/skills';

interface SkillPickerProps {
  skills: string[];
  onToggleSkill: (name: string) => void;
  onRemoveSkill: (name: string) => void;
  stats: PlayerStats;
  /** Bonus de competencia del personaje (según su nivel). */
  proficiencyBonus: number;
  /** Número máximo de habilidades con competencia (clase + dotes). */
  maxSkills: number;
}

const ABILITY_ORDER: StatAbbrev[] = ['str', 'dex', 'int', 'wis', 'cha'];

const skillNameOf = (name: string, ability: StatAbbrev) => ({ name, ability });

/** Las 18 habilidades agrupadas por característica (sin CON en 2024). */
const SKILLS_BY_ABILITY: Record<StatAbbrev, { name: string }[]> = {
  str: [skillNameOf('Atletismo', 'str')],
  dex: [skillNameOf('Acrobacias', 'dex'), skillNameOf('Juego de manos', 'dex'), skillNameOf('Sigilo', 'dex')],
  int: [
    skillNameOf('Arcanos', 'int'),
    skillNameOf('Historia', 'int'),
    skillNameOf('Investigación', 'int'),
    skillNameOf('Naturaleza', 'int'),
    skillNameOf('Religión', 'int'),
  ],
  wis: [
    skillNameOf('Medicina', 'wis'),
    skillNameOf('Percepción', 'wis'),
    skillNameOf('Perspicacia', 'wis'),
    skillNameOf('Supervivencia', 'wis'),
    skillNameOf('Trato con animales', 'wis'),
  ],
  cha: [
    skillNameOf('Actuación', 'cha'),
    skillNameOf('Engaño', 'cha'),
    skillNameOf('Intimidación', 'cha'),
    skillNameOf('Persuasión', 'cha'),
  ],
  con: [],
};

const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const SkillPicker = ({
  skills,
  onToggleSkill,
  onRemoveSkill,
  stats,
  proficiencyBonus,
  maxSkills,
}: SkillPickerProps) => {
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => new Set(skills), [skills]);
  const atCap = skills.length >= maxSkills;

  const q = normalize(query.trim());

  return (
    <section className="section-box">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="section-title">
          Habilidades ({skills.length}/{maxSkills})
        </h3>
        <span className="text-[10px] text-dnd-muted">
          Modificador = atributo {proficiencyBonus > 0 ? `+ competencia (${proficiencyBonus > 0 ? '+' : ''}${proficiencyBonus})` : ''} si se elige
        </span>
      </div>

      <div className="relative mb-2">
        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-dnd-muted" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar habilidad…"
          aria-label="Buscar habilidad"
          className="input pl-7 text-sm"
        />
      </div>

      {skills.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span key={skill} className="badge border border-dnd-gold/40 bg-dnd-gold/10 text-dnd-text">
              {skill}
              <button
                onClick={() => onRemoveSkill(skill)}
                aria-label={`Quitar habilidad ${skill}`}
                className="ml-1 text-red-300 hover:text-red-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-dnd-leather/30 p-2">
        {ABILITY_ORDER.map((ability) => {
          const group = SKILLS_BY_ABILITY[ability].filter((s) => !q || normalize(s.name).includes(q));
          if (group.length === 0) return null;
          return (
            <div key={ability}>
              <p className="mb-1 text-[10px] font-bold uppercase text-dnd-gold">
                {STAT_LABELS[ability]}
              </p>
              <ul>
                {group.map((entry) => {
                  const selected = selectedSet.has(entry.name);
                  const disabled = !selected && atCap;
                  const bonus = skillBonus(stats, entry.name, selected, proficiencyBonus);
                  const bonusLabel = bonus >= 0 ? `+${bonus}` : `${bonus}`;
                  return (
                    <li key={entry.name}>
                      <button
                        onClick={() => onToggleSkill(entry.name)}
                        aria-pressed={selected}
                        disabled={disabled}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-dnd-leather/20 ${
                          selected ? 'bg-dnd-gold/10' : ''
                        } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
                        title={
                          selected
                            ? 'Con competencia'
                            : disabled
                              ? `Tope alcanzado (${skills.length}/${maxSkills})`
                              : 'Sin competencia'
                        }
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            selected ? 'border-dnd-gold bg-dnd-gold text-dnd-ink' : 'border-dnd-leather/60'
                          }`}
                          aria-hidden="true"
                        >
                          {selected && <Check size={11} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-bold text-dnd-text">{entry.name}</span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            selected ? 'bg-dnd-gold/15 text-dnd-gold' : 'bg-dnd-ink/50 text-dnd-muted'
                          }`}
                        >
                          {bonusLabel}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {q && Object.values(SKILLS_BY_ABILITY).flat().every((s) => !normalize(s.name).includes(q)) && (
          <p className="px-2 py-3 text-center text-xs text-dnd-muted">Sin habilidades para ese criterio.</p>
        )}
      </div>

      <p className="mt-1 text-[10px] text-dnd-muted">
        Elige hasta {maxSkills} habilidades con competencia según tu clase (más las que aporten dotes como Competente).
      </p>
    </section>
  );
};
