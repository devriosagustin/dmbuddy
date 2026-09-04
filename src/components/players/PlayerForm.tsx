// ============================================================
// Formulario de jugador (crear/editar)
// ============================================================

import { useEffect, useState } from 'react';
import { BookOpen, Save, Sparkles, Upload } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MarkdownPreview } from '../notes/MarkdownPreview';
import type { Player, Spell } from '../../types';
import { STAT_LABELS } from '../../types';
import type { StatAbbrev } from '../../types';
import type { SrdFeatEntry, SpeciesStatBonusOption } from '../../types/srd2024';
import { usePlayerStore } from '../../store/playerStore';
import { rollStats } from '../../utils/diceUtils';
import { proficiencyAtLevel } from '../../utils/damageCalculator';
import { bookMaxHp } from '../../utils/hpCalculator';
import { spellcastingLimits, featSpellBoosts } from '../../utils/spellcastingRules';
import { BASE_SRD_BUNDLE, SRD_CLASSES, SRD_SPECIES, SRD_WEAPONS, srdWeaponById } from '../../data/srd2024';
import { weaponAttackModifier, weaponAttackBonus, weaponDamageFormula, weaponAbility, weaponDamageBonus } from '../../utils/weaponUtils';
import { SpellPicker } from './SpellPicker';
import { SkillPicker } from './SkillPicker';
import { featSkillBoosts } from '../../utils/skills';

const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const SRD_FEAT_TITLES = BASE_SRD_BUNDLE.feats.map((f) => f.title);

// Clases oficiales de 2024 (el resto de datos del SRD usan estos mismos nombres).
const CLASSES = SRD_CLASSES.map((c) => c.title);

// Especies del SRD 5.2 (la raza se elige igual que la clase).
const SPECIES = SRD_SPECIES.map((s) => s.title);

const ABILITIES: StatAbbrev[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

interface PlayerFormProps {
  player: Player | null;
  onClose: () => void;
}

const ROLLING_DICE: Record<string, keyof Player['stats']> = {
  FUE: 'str', DES: 'dex', CON: 'con', INT: 'int', SAB: 'wis', CAR: 'cha',
};

/**
 * Formulario de creación/edición de personajes con generador de stats.
 */
export const PlayerForm = ({ player, onClose }: PlayerFormProps) => {
  const { addPlayer, updatePlayer, importPlayer } = usePlayerStore();

  const [name, setName] = useState(player?.name ?? '');
  const [level, setLevel] = useState(player?.level ?? 1);
  const [className, setClassName] = useState(player?.class ?? 'Guerrero');
  const [race, setRace] = useState(player?.race ?? '');
  const [hp, setHp] = useState(player?.hp ?? player?.maxHp ?? 10);
  const [maxHp, setMaxHp] = useState(player?.maxHp ?? 10);
  const [ac, setAC] = useState(player?.armorClass ?? 10);
  const [stats, setStats] = useState<Player['stats']>(
    player?.stats ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
  );
  const [spells, setSpells] = useState<Spell[]>(player?.spells ?? []);
  const [cantrips, setCantrips] = useState<Spell[]>(player?.cantrips ?? []);
  const [feats, setFeats] = useState<string[]>(player?.feats ?? []);
  const [featQuery, setFeatQuery] = useState('');
  const [viewingFeat, setViewingFeat] = useState<SrdFeatEntry | null>(null);
  const [skills, setSkills] = useState<string[]>(player?.skills ?? []);
  const [weaponIds, setWeaponIds] = useState<string[]>(player?.weaponIds ?? []);
  const [raceBonusIndex, setRaceBonusIndex] = useState(0);
  const [appliedBonus, setAppliedBonus] = useState<Partial<Record<StatAbbrev, number>>>({});

  const setStat = (key: keyof Player['stats'], value: number) =>
    setStats((s) => ({ ...s, [key]: value }));

  // Al crear un personaje nuevo, los PG máximos (y actuales, a full) se
  // recalculan "de libro" cada vez que cambia algo que los afecta: clase,
  // nivel, Constitución o dotes (p. ej. Robusto). El campo sigue siendo un
  // input editable: el DM puede pisar el valor calculado a mano en cualquier
  // momento para una excepción fuera de las reglas — solo vuelve a
  // recalcularse si alguno de esos datos cambia de nuevo. No se aplica al
  // editar un personaje ya existente (para no pisar PG ya ajustados en
  // partida, p. ej. por daño o por un cambio manual anterior del DM).
  useEffect(() => {
    if (player) return;
    const recalculated = bookMaxHp(className, Math.max(1, Number(level) || 1), stats.con, feats);
    setMaxHp(recalculated);
    setHp(recalculated);
  }, [player, className, level, stats.con, feats]);

  const toggleCantrip = (spell: Spell) =>
    setCantrips((prev) =>
      prev.some((s) => s.id === spell.id) ? prev.filter((s) => s.id !== spell.id) : [...prev, spell]
    );

  const toggleSpell = (spell: Spell) =>
    setSpells((prev) =>
      prev.some((s) => s.id === spell.id) ? prev.filter((s) => s.id !== spell.id) : [...prev, spell]
    );

  const toggleFeat = (title: string) =>
    setFeats((prev) => (prev.includes(title) ? prev.filter((f) => f !== title) : [...prev, title]));

  const toggleSkill = (name: string) =>
    setSkills((prev) => (prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]));

  const toggleWeapon = (id: string) =>
    setWeaponIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const equippedWeapons = weaponIds
    .map((id) => srdWeaponById(id))
    .filter((wp): wp is NonNullable<typeof wp> => Boolean(wp));

  // Especie seleccionada y sus opciones de bonos raciales
  const speciesEntry = SRD_SPECIES.find((s) => s.title === race);
  const bonusOptions = speciesEntry?.statBonus ?? [];
  const currentBonus = bonusOptions[Math.min(raceBonusIndex, bonusOptions.length - 1)];

  /** Revierte el bono anterior y aplica la opción elegida a las características. */
  const applySpeciesBonus = (option: SpeciesStatBonusOption | undefined) => {
    const base = { ...stats };
    for (const key of Object.keys(appliedBonus) as StatAbbrev[]) {
      const v = appliedBonus[key];
      if (v) base[key] = Math.max(1, Math.min(30, base[key] - v));
    }
    if (option) {
      for (const key of ABILITIES) {
        const v = option.stats[key];
        if (v) base[key] = Math.max(1, Math.min(30, base[key] + v));
      }
    }
    setStats(base);
    setAppliedBonus(option ? { ...option.stats } : {});
  };

  const handleRaceChange = (title: string) => {
    setRace(title);
    const entry = SRD_SPECIES.find((s) => s.title === title);
    setRaceBonusIndex(0);
    applySpeciesBonus(entry?.statBonus?.[0]);
  };

  const filteredFeats = SRD_FEAT_TITLES.filter((f) => normalize(f).includes(normalize(featQuery.trim())));

  // Generador de stats con dados (conserva el bono racial aplicado)
  const regenerateStats = () => {
    const base = rollStats();
    if (currentBonus) {
      for (const key of ABILITIES) {
        const v = currentBonus.stats[key];
        if (v) base[key] = Math.max(1, Math.min(30, base[key] + v));
      }
    }
    setStats(base);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const data: Omit<Player, 'id' | 'proficiencyBonus'> = {
      name: name.trim(),
      level: Math.max(1, Number(level) || 1),
      class: className,
      race: race.trim() || undefined,
      hp: Math.min(hp, maxHp),
      maxHp: Math.max(1, maxHp),
      armorClass: ac,
      stats,
      spells: spells.length > 0 ? spells : undefined,
      cantrips: cantrips.length > 0 ? cantrips : undefined,
      feats: feats.length > 0 ? feats : undefined,
      skills: skills.length > 0 ? skills : undefined,
      weaponIds: weaponIds.length > 0 ? weaponIds : undefined,
    };
    if (player) {
      updatePlayer(player.id, data);
    } else {
      addPlayer(data);
    }
    onClose();
  };

  const handleImportFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = importPlayer(String(reader.result));
      if (ok) onClose();
    };
    reader.readAsText(file);
  };

  const input = 'input text-sm';

  return (
    <Modal
      open
      onClose={onClose}
      title={player ? `Editar: ${player.name}` : 'Nuevo personaje'}
      subtitle={player ? proficiencyAtLevel(player.level) > 0 ? `Competencia +${proficiencyAtLevel(player.level)}` : 'Competencia +2' : 'Competencia +2'}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Identidad */}
        <section className="form-grid">
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="p-name" className="label">Nombre *</label>
            <input id="p-name" className={input} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="p-race" className="label">Raza</label>
            <select id="p-race" className={input} value={race} onChange={(e) => handleRaceChange(e.target.value)}>
              <option value="">Sin especie</option>
              {SPECIES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="p-class" className="label">Clase</label>
            <select id="p-class" className={input} value={className} onChange={(e) => setClassName(e.target.value)}>
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="p-level" className="label">Nivel</label>
            <input id="p-level" className={input} type="number" min="1" max="20" value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="p-pb" className="label">Competencia</label>
            <input id="p-pb" className={`${input} opacity-60`} value={`+${proficiencyAtLevel(Math.max(1, Number(level) || 1))}`} disabled readOnly />
          </div>
        </section>

        {/* Bonos raciales */}
        {speciesEntry && bonusOptions.length > 0 && (
          <section className="section-box">
            <div className="flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              <Sparkles size={14} aria-hidden="true" /> Bonos raciales · {race}
            </div>
            {bonusOptions.length > 1 ? (
              <select
                id="p-race-bonus"
                className={`${input} mt-2 w-full`}
                value={Math.min(raceBonusIndex, bonusOptions.length - 1)}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setRaceBonusIndex(idx);
                  applySpeciesBonus(bonusOptions[idx]);
                }}
                aria-label="Asignación de bonos raciales"
              >
                {bonusOptions.map((op, i) => (
                  <option key={i} value={i}>
                    {op.label}
                  </option>
                ))}
              </select>
            ) : (
              currentBonus && (
                <p className="mt-2 text-sm font-bold text-dnd-text">{currentBonus.label}</p>
              )
            )}
            <p className="mt-1 text-[11px] text-dnd-muted">
              Se aplican automáticamente a tus características (FUE, DES, CON, INT, SAB, CAR).
            </p>
          </section>
        )}

        {/* Combate */}
        <section className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="p-hp" className="label">PG actual</label>
            <input id="p-hp" className={input} type="number" min="0" value={hp} onChange={(e) => setHp(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="p-maxhp" className="label">PG máximo</label>
            <input id="p-maxhp" className={input} type="number" min="1" value={maxHp} onChange={(e) => setMaxHp(Number(e.target.value))} />
            {!player && (
              <p className="mt-1 text-[10px] text-dnd-muted">
                Se recalcula solo según clase/nivel/CON/dotes. Editalo si querés algo fuera de las reglas.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="p-ac" className="label">CA</label>
            <input id="p-ac" className={input} type="number" min="0" value={ac} onChange={(e) => setAC(Number(e.target.value))} />
          </div>
        </section>

        {/* Armas */}
        <section className="section-box">
          <h3 className="mb-2 section-title">
            Armas equipadas · SRD 5.2 ({weaponIds.length})
          </h3>
          <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-dnd-leather/30 p-2">
            {(['simple', 'martial'] as const).map((cat) => (
              <div key={cat}>
                <p className="mb-1 text-[10px] uppercase text-dnd-muted">
                  {cat === 'simple' ? 'Simples' : 'Marciales'}
                </p>
                <ul aria-label={`Armas ${cat === 'simple' ? 'simples' : 'marciales'}`}>
                  {SRD_WEAPONS.filter((wp) => wp.category === cat).map((wp) => {
                    const selected = weaponIds.includes(wp.id);
                    return (
                      <li key={wp.id}>
                        <button
                          onClick={() => toggleWeapon(wp.id)}
                          aria-pressed={selected}
                          className={`flex w-full items-center gap-2 px-2 py-1 text-left text-sm transition-colors hover:bg-dnd-leather/20 ${
                            selected ? 'bg-dnd-gold/10' : ''
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              selected ? 'border-dnd-gold bg-dnd-gold text-dnd-ink' : 'border-dnd-leather/60'
                            }`}
                            aria-hidden="true"
                          >
                            {selected && '✓'}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-bold text-dnd-text">{wp.name}</span>
                          <span className="shrink-0 text-[10px] text-dnd-muted">
                            {wp.damage} {wp.damageType}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {equippedWeapons.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {equippedWeapons.map((weapon) => {
                const prof = proficiencyAtLevel(Math.max(1, Number(level) || 1));
                const ability = weaponAbility(weapon);
                const mod = weaponAttackModifier(weapon, stats);
                const bonus = weaponAttackBonus(weapon, stats, prof);
                return (
                  <div key={weapon.id} className="rounded-lg bg-dnd-ink/40 p-2 text-xs text-dnd-text">
                    <p className="font-bold text-dnd-gold">
                      ⚔️ {weapon.name} · {weapon.kind === 'ranged' ? 'A distancia' : 'Cuerpo a cuerpo'} · {weapon.damage} {weapon.damageType}
                    </p>
                    {weapon.properties.length > 0 && (
                      <p className="text-dnd-muted">Propiedades: {weapon.properties.join(', ')}</p>
                    )}
                    {weapon.range && <p className="text-dnd-muted">Alcance: {weapon.range} pies</p>}
                    <p>
                      Ataque: <span className="font-bold text-dnd-text">+{bonus}</span>{' '}
                      <span className="text-dnd-muted">
                        (competencia {prof} + {STAT_LABELS[ability]} {mod >= 0 ? `+${mod}` : mod})
                      </span>
                    </p>
                    <p>
                      Daño: <span className="font-bold text-dnd-text">{weaponDamageFormula(weapon, stats)}</span>
                      {weaponDamageBonus(weapon, stats) !== 0 && (
                        <span className="text-dnd-muted"> (modificador {STAT_LABELS[ability]})</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="section-box">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="section-title">Características</h3>
            <Button variant="ghost" size="sm" icon={<Sparkles size={14} />} onClick={regenerateStats}>
              Tirar (4d6)
            </Button>
          </div>
          <div className="stat-grid">
            {(Object.keys(ROLLING_DICE) as (keyof typeof ROLLING_DICE)[]).map((label) => (
              <div key={label}>
                <label htmlFor={`p-stat-${label}`} className="label">{label}</label>
                <input
                  id={`p-stat-${label}`}
                  className={input}
                  type="number"
                  min="1"
                  max="30"
                  value={stats[ROLLING_DICE[label]]}
                  onChange={(e) => setStat(ROLLING_DICE[label], Number(e.target.value))}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Trucos + conjuros del SRD */}
        <SpellPicker
          cantrips={cantrips}
          spells={spells}
          onToggleCantrip={toggleCantrip}
          onToggleSpell={toggleSpell}
          onRemoveCantrip={(id) => setCantrips((prev) => prev.filter((s) => s.id !== id))}
          onRemoveSpell={(id) => setSpells((prev) => prev.filter((s) => s.id !== id))}
          className={className}
          maxCantrips={spellcastingLimits(className, level).cantrips + featSpellBoosts(feats).cantrips}
          maxSpells={spellcastingLimits(className, level).spells + featSpellBoosts(feats).spells}
          maxSpellLevel={Math.max(
            spellcastingLimits(className, level).maxSlotLevel,
            featSpellBoosts(feats).minSpellLevel
          )}
        />

        {/* Dotes del SRD 2024 */}
        <section className="section-box">
          <h3 className="mb-2 section-title">
            Dotes · SRD 2024 ({feats.length})
          </h3>
          <input
            value={featQuery}
            onChange={(e) => setFeatQuery(e.target.value)}
            placeholder="Buscar dote…"
            aria-label="Buscar dote en el SRD"
            className={`${input} w-full`}
          />
          {feats.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {feats.map((feat) => {
                const featEntry = BASE_SRD_BUNDLE.feats.find((f) => f.title === feat);
                return (
                  <span key={feat} className="badge border border-dnd-gold/40 bg-dnd-gold/10 text-dnd-text">
                    {feat}
                    {featEntry && (
                      <button
                        onClick={() => setViewingFeat(featEntry)}
                        aria-label={`Ver descripción de la dote ${feat}`}
                        title="Ver descripción"
                        className="ml-1 text-dnd-gold hover:text-dnd-gold/80"
                      >
                        <BookOpen size={12} aria-hidden="true" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleFeat(feat)}
                      aria-label={`Quitar dote ${feat}`}
                      className="ml-1 text-red-300 hover:text-red-200"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-dnd-leather/30">
            {filteredFeats.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-dnd-muted">Sin dotes para ese criterio.</p>
            ) : (
              <ul aria-label="Dotes disponibles">
                {filteredFeats.map((feat) => {
                  const selected = feats.includes(feat);
                  const featEntry = BASE_SRD_BUNDLE.feats.find((f) => f.title === feat);
                  return (
                    <li key={feat}>
                      <div className="flex items-stretch">
                        <button
                          onClick={() => toggleFeat(feat)}
                          aria-pressed={selected}
                          className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-dnd-leather/20 ${
                            selected ? 'bg-dnd-gold/10' : ''
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              selected ? 'border-dnd-gold bg-dnd-gold text-dnd-ink' : 'border-dnd-leather/60'
                            }`}
                            aria-hidden="true"
                          >
                            {selected && '✓'}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bold text-dnd-text">{feat}</span>
                            <span className="block text-[10px] text-dnd-muted">
                              {featEntry?.type === 'origin'
                                ? 'Dote de origen'
                                : 'Dote general'}
                              {featEntry?.prerequisite ? ` · ${featEntry.prerequisite}` : ''}
                            </span>
                          </span>
                        </button>
                        {featEntry && (
                          <button
                            onClick={() => setViewingFeat(featEntry)}
                            aria-label={`Ver descripción de la dote ${feat}`}
                            title="Ver descripción"
                            className="flex w-9 shrink-0 items-center justify-center border-l border-dnd-leather/30 text-dnd-gold transition-colors hover:bg-dnd-gold/10"
                          >
                            <BookOpen size={14} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Habilidades (competencias) */}
        <SkillPicker
          skills={skills}
          onToggleSkill={toggleSkill}
          onRemoveSkill={(name) => setSkills((prev) => prev.filter((s) => s !== name))}
          stats={stats}
          proficiencyBonus={proficiencyAtLevel(Math.max(1, Number(level) || 1))}
          maxSkills={
            (SRD_CLASSES.find((c) => c.title === className)?.skills ?? 0) + featSkillBoosts(feats)
          }
        />

        {/* Modal de descripción de dote */}
        <Modal
          open={viewingFeat !== null}
          onClose={() => setViewingFeat(null)}
          title={viewingFeat?.title ?? ''}
          subtitle={viewingFeat ? (viewingFeat.type === 'origin' ? 'Dote de origen' : 'Dote general') + (viewingFeat.prerequisite ? ` · ${viewingFeat.prerequisite}` : '') : ''}
          maxWidth="lg"
        >
          {viewingFeat && (
            <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-dnd-leather/30 p-3">
              <MarkdownPreview content={viewingFeat.content} />
            </div>
          )}
        </Modal>

        {/* Importar */}
        {!player && (
          <section className="dropzone">
            <Upload size={16} className="text-dnd-muted" aria-hidden="true" />
            <label htmlFor="import-player" className="cursor-pointer text-xs font-bold text-dnd-gold hover:underline">
              Importar personaje desde JSON
            </label>
            <input
              id="import-player"
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
            />
          </section>
        )}

        {/* Acciones */}
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>
            {player ? 'Guardar cambios' : 'Crear personaje'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};