// ============================================================
// Ficha de personaje (vista completa con pestañas).
// Se muestra dentro de la sección Party (sin modal) y alterna
// entre modo vista y modo edición desde el propio componente.
// ============================================================

import { useState } from 'react';
import { ArrowLeft, BookOpen, Save, Swords, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';
import { SrdDetailPanel } from '../reference/SrdDetailPanel';
import { MarkdownPreview } from '../notes/MarkdownPreview';
import { Modal } from '../common/Modal';
import type { Player, Spell, PlayerStats } from '../../types';
import { STAT_LABELS, type StatAbbrev } from '../../types';
import type { SrdFeatEntry, SpeciesStatBonusOption } from '../../types/srd2024';
import { usePlayerStore } from '../../store/playerStore';
import { useCombatStore } from '../../store/combatStore';
import { useDice } from '../../hooks/useDice';
import { rollStats, abilityModifier } from '../../utils/diceUtils';
import { proficiencyAtLevel } from '../../utils/damageCalculator';
import { spellcastingLimits, featSpellBoosts } from '../../utils/spellcastingRules';
import { BASE_SRD_BUNDLE, SRD_CLASSES, SRD_SPECIES, SRD_WEAPONS, srdWeaponById, srdSpellByTitle, srdFeatByTitle } from '../../data/srd2024';
import { weaponAttackModifier, weaponAttackBonus, weaponDamageFormula, weaponAbility, weaponDamageBonus } from '../../utils/weaponUtils';
import { skillBonus, featSkillBoosts } from '../../utils/skills';
import { playerToCombatant } from '../../utils/combatUtils';
import { SpellPicker } from './SpellPicker';
import { SkillPicker } from './SkillPicker';
import { SpellSlotsPanel } from './SpellSlotsPanel';
import { XpBar } from './XpBar';
import { SpellChip, FeatChip } from './srdChips';

const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const SRD_FEAT_TITLES = BASE_SRD_BUNDLE.feats.map((f) => f.title);
const CLASSES = SRD_CLASSES.map((c) => c.title);
const SPECIES = SRD_SPECIES.map((s) => s.title);
const ABILITIES: StatAbbrev[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

type Tab = 'stats' | 'skills' | 'spells' | 'equipment' | 'feats';

interface CharacterSheetProps {
  /** Personaje a mostrar/editar. null = creación de uno nuevo. */
  player: Player | null;
  /** Modo en que se abre; para un personaje existente se fuerza 'view'. */
  initialMode?: 'view' | 'edit';
  /** Volver a la lista del party. */
  onBack: () => void;
}

const TABS: { id: Tab; label: string; icon?: string }[] = [
  { id: 'stats', label: 'Características', icon: '📊' },
  { id: 'skills', label: 'Habilidades', icon: '🎯' },
  { id: 'spells', label: 'Conjuros', icon: '✨' },
  { id: 'equipment', label: 'Equipo', icon: '⚔️' },
  { id: 'feats', label: 'Rasgos', icon: '🛡️' },
];

/**
 * Ficha de personaje con pestañas y alternancia vista/edición.
 */
export const CharacterSheet = ({ player, initialMode, onBack }: CharacterSheetProps) => {
  const { addPlayer, updatePlayer } = usePlayerStore();
  const { addCombatant, isActive, initializeCombat } = useCombatStore();
  const participants = useCombatStore((s) => s.participants);
  const { roll } = useDice();

  const isNew = !player;
  const [mode, setMode] = useState<'view' | 'edit'>(isNew ? 'edit' : initialMode === 'edit' ? 'edit' : 'view');
  const [tab, setTab] = useState<Tab>('stats');

  // ---- Manejadores de vista: SrdDetailPanel para conjuros/dotes servidas en vista ----
  const [openSpellId, setOpenSpellId] = useState<string | null>(null);
  const [openFeatId, setOpenFeatId] = useState<string | null>(null);
  const openSpellEntry = openSpellId ? (srdSpellByTitle(openSpellId) ?? null) : null;
  const openFeatEntry = openFeatId ? (srdFeatByTitle(openFeatId) ?? null) : null;
  // ---- Manejadores de edición: descripción de dote dentro del picker ----
  const [viewingFeat, setViewingFeat] = useState<SrdFeatEntry | null>(null);

  // ---- Borrador de edición (replicando el estado del antiguo PlayerForm) ----
  const [name, setName] = useState(player?.name ?? '');
  const [level, setLevel] = useState(player?.level ?? 1);
  const [className, setClassName] = useState(player?.class ?? 'Guerrero');
  const [race, setRace] = useState(player?.race ?? '');
  const [hp, setHp] = useState(player?.hp ?? player?.maxHp ?? 10);
  const [maxHp, setMaxHp] = useState(player?.maxHp ?? 10);
  const [ac, setAC] = useState(player?.armorClass ?? 10);
  const [stats, setStats] = useState<PlayerStats>(player?.stats ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
  const [spells, setSpells] = useState<Spell[]>(player?.spells ?? []);
  const [cantrips, setCantrips] = useState<Spell[]>(player?.cantrips ?? []);
  const [feats, setFeats] = useState<string[]>(player?.feats ?? []);
  const [featQuery, setFeatQuery] = useState('');
  const [skills, setSkills] = useState<string[]>(player?.skills ?? []);
  const [weaponIds, setWeaponIds] = useState<string[]>(player?.weaponIds ?? []);
  const [raceBonusIndex, setRaceBonusIndex] = useState(0);
  const [appliedBonus, setAppliedBonus] = useState<Partial<Record<StatAbbrev, number>>>({});

  const prof = proficiencyAtLevel(Math.max(1, Number(level) || 1));
  const speciesEntry = SRD_SPECIES.find((s) => s.title === race);
  const bonusOptions = speciesEntry?.statBonus ?? [];
  const currentBonus = bonusOptions[Math.min(raceBonusIndex, bonusOptions.length - 1)];

  const setStat = (key: keyof PlayerStats, value: number) => setStats((s) => ({ ...s, [key]: value }));
  const toggleCantrip = (spell: Spell) =>
    setCantrips((prev) => (prev.some((s) => s.id === spell.id) ? prev.filter((s) => s.id !== spell.id) : [...prev, spell]));
  const toggleSpell = (spell: Spell) =>
    setSpells((prev) => (prev.some((s) => s.id === spell.id) ? prev.filter((s) => s.id !== spell.id) : [...prev, spell]));
  const toggleFeat = (title: string) =>
    setFeats((prev) => (prev.includes(title) ? prev.filter((f) => f !== title) : [...prev, title]));
  const toggleSkill = (name: string) =>
    setSkills((prev) => (prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]));
  const toggleWeapon = (id: string) =>
    setWeaponIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const equippedWeapons = weaponIds.map((id) => srdWeaponById(id)).filter((w): w is NonNullable<typeof w> => Boolean(w));
  const filteredFeats = SRD_FEAT_TITLES.filter((f) => normalize(f).includes(normalize(featQuery.trim())));

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
      setMode('view');
    } else {
      addPlayer(data);
      onBack();
    }
  };

  const handleAddToCombat = () => {
    if (!player) return;
    if (participants.some((p) => p.playerId === player.id)) return;
    if (!isActive) initializeCombat();
    const r = roll('d20');
    addCombatant(playerToCombatant(player, r.result));
  };
  const alreadyInCombat = !!player && participants.some((p) => p.playerId === player.id);

  const input = 'input text-sm';

  // ============================= PESTAÑA: CARACTERÍSTICAS =============================
  const renderStats = () => {
    if (mode === 'view') {
      if (!player) return null;
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="badge border border-red-500/40 bg-dnd-ink/60 text-red-300">
              ❤️ {player.hp}/{player.maxHp} PG
            </span>
            <span className="badge border border-sky-500/40 bg-dnd-ink/60 text-sky-300">🛡️ CA {player.armorClass}</span>
            <span className="text-dnd-muted">Competencia +{player.proficiencyBonus}</span>
            <span className="text-dnd-muted">{player.race ? `${player.race} · ` : ''}Nv {player.level} · {player.class}</span>
          </div>
          <XpBar player={player} />
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
            {ABILITIES.map((key) => {
              const mod = abilityModifier(player.stats[key]);
              return (
                <div key={key} className="stat-box">
                  <span className="text-[9px] text-dnd-muted">{STAT_LABELS[key]}</span>
                  <span className="font-fantasy text-sm font-bold text-dnd-gold">{mod >= 0 ? `+${mod}` : mod}</span>
                  <span className="text-[10px] text-dnd-muted">{player.stats[key]}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    // Edición: identidad + combate + stats
    return (
      <div className="space-y-4">
        <section className="form-grid">
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="cs-name" className="label">Nombre *</label>
            <input id="cs-name" className={input} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="cs-race" className="label">Raza</label>
            <select id="cs-race" className={input} value={race} onChange={(e) => handleRaceChange(e.target.value)}>
              <option value="">Sin especie</option>
              {SPECIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cs-class" className="label">Clase</label>
            <select id="cs-class" className={input} value={className} onChange={(e) => setClassName(e.target.value)}>
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cs-level" className="label">Nivel</label>
            <input id="cs-level" className={input} type="number" min="1" max="20" value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="cs-pb" className="label">Competencia</label>
            <input id="cs-pb" className={`${input} opacity-60`} value={`+${prof}`} disabled readOnly />
          </div>
        </section>

        {speciesEntry && bonusOptions.length > 0 && (
          <section className="section-box">
            <div className="flex items-center gap-1 text-xs font-bold uppercase text-dnd-gold">
              <Sparkles size={14} aria-hidden="true" /> Bonos raciales · {race}
            </div>
            {bonusOptions.length > 1 ? (
              <select
                className={`${input} mt-2 w-full`}
                value={Math.min(raceBonusIndex, bonusOptions.length - 1)}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setRaceBonusIndex(idx);
                  applySpeciesBonus(bonusOptions[idx]);
                }}
              >
                {bonusOptions.map((op, i) => <option key={i} value={i}>{op.label}</option>)}
              </select>
            ) : (
              currentBonus && <p className="mt-2 text-sm font-bold text-dnd-text">{currentBonus.label}</p>
            )}
          </section>
        )}

        <section className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="cs-hp" className="label">PG actual</label>
            <input id="cs-hp" className={input} type="number" min="0" value={hp} onChange={(e) => setHp(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="cs-maxhp" className="label">PG máximo</label>
            <input id="cs-maxhp" className={input} type="number" min="1" value={maxHp} onChange={(e) => setMaxHp(Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="cs-ac" className="label">CA</label>
            <input id="cs-ac" className={input} type="number" min="0" value={ac} onChange={(e) => setAC(Number(e.target.value))} />
          </div>
        </section>

        <section className="section-box">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="section-title">Características</h3>
            <Button variant="ghost" size="sm" icon={<Sparkles size={14} />} onClick={regenerateStats}>Tirar (4d6)</Button>
          </div>
          <div className="stat-grid">
            {ABILITIES.map((key) => (
              <div key={key}>
                <label htmlFor={`cs-stat-${key}`} className="label">{STAT_LABELS[key]}</label>
                <input id={`cs-stat-${key}`} className={input} type="number" min="1" max="30" value={stats[key]} onChange={(e) => setStat(key, Number(e.target.value))} />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  // ============================= PESTAÑA: HABILIDADES =============================
  const renderSkills = () => {
    if (mode === 'view') {
      if (!player) return null;
      const allSkills = player.skills ?? [];
      return (
        <div className="space-y-3">
          {allSkills.length === 0 ? (
            <p className="text-sm text-dnd-muted">Este personaje aún no tiene habilidades con competencia.</p>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] uppercase text-dnd-muted">Competencias ({allSkills.length})</p>
              <div className="flex flex-wrap gap-1">
                {[...allSkills].sort((a, b) => a.localeCompare(b)).map((nm) => {
                  const bonus = skillBonus(player.stats, nm, true, player.proficiencyBonus);
                  return (
                    <span key={nm} className="inline-flex items-center gap-1 rounded-full border border-dnd-leather/40 bg-dnd-ink/50 px-2 py-0.5 text-[10px] text-dnd-text">
                      {nm}
                      <span className="font-bold text-dnd-gold">{bonus >= 0 ? `+${bonus}` : bonus}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <SkillPicker
        skills={skills}
        onToggleSkill={toggleSkill}
        onRemoveSkill={(nm) => setSkills((prev) => prev.filter((s) => s !== nm))}
        stats={stats}
        proficiencyBonus={prof}
        maxSkills={(SRD_CLASSES.find((c) => c.title === className)?.skills ?? 0) + featSkillBoosts(feats)}
      />
    );
  };

  // ============================= PESTAÑA: CONJUROS =============================
  const renderSpells = () => {
    if (mode === 'view') {
      if (!player) return null;
      return (
        <div className="space-y-3">
          <SpellSlotsPanel playerId={player.id} />
          <div className="flex flex-col gap-2 text-[11px] text-dnd-muted">
            {player.cantrips && player.cantrips.length > 0 && (
              <div>
                <p className="mb-1">✨ {player.cantrips.length} trucos</p>
                <div className="flex flex-wrap gap-1">
                  {player.cantrips.map((spell) => <SpellChip key={spell.id} spell={spell} onOpen={setOpenSpellId} />)}
                </div>
              </div>
            )}
            {player.spells && player.spells.length > 0 && (
              <div>
                <p className="mb-1">🌟 {player.spells.length} conjuros preparados</p>
                <div className="flex flex-wrap gap-1">
                  {[...player.spells].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).map((spell) => (
                    <SpellChip key={spell.id} spell={spell} onOpen={setOpenSpellId} />
                  ))}
                </div>
              </div>
            )}
            {(!player.cantrips || player.cantrips.length === 0) && (!player.spells || player.spells.length === 0) && (
              <p className="text-sm text-dnd-muted">Este personaje aún no tiene trucos ni conjuros.</p>
            )}
          </div>
        </div>
      );
    }
    return (
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
        maxSpellLevel={Math.max(spellcastingLimits(className, level).maxSlotLevel, featSpellBoosts(feats).minSpellLevel)}
      />
    );
  };

  // ============================= PESTAÑA: EQUIPO =============================
  const renderEquipment = () => {
    if (mode === 'view') {
      if (!player) return null;
      const weapons = (player.weaponIds ?? []).map((id) => srdWeaponById(id)).filter(Boolean) as NonNullable<ReturnType<typeof srdWeaponById>>[];
      if (weapons.length === 0) return <p className="text-sm text-dnd-muted">Este personaje aún no tiene armas equipadas.</p>;
      return (
        <div className="flex flex-col gap-2">
          {weapons.map((wpn) => {
            const atk = weaponAttackBonus(wpn, player.stats, player.proficiencyBonus);
            const dmg = weaponDamageFormula(wpn, player.stats);
            return (
              <div key={wpn.id} className="rounded-lg border border-dnd-leather/30 bg-dnd-ink/40 p-2 text-[11px]">
                <p className="font-bold text-dnd-gold">{wpn.name} · {wpn.damage} {wpn.damageType}</p>
                <p className="text-dnd-text">Ataque <span className="font-bold">+{atk}</span> · Daño <span className="font-bold">{dmg}</span></p>
                {wpn.range && <p className="text-dnd-muted">Alcance {wpn.range} pies</p>}
              </div>
            );
          })}
        </div>
      );
    }
    return (
      <section className="section-box">
        <h3 className="mb-2 section-title">Armas equipadas · SRD 5.2 ({weaponIds.length})</h3>
        <div className="max-h-60 space-y-1.5 overflow-y-auto rounded-lg border border-dnd-leather/30 p-2">
          {(['simple', 'martial'] as const).map((cat) => (
            <div key={cat}>
              <p className="mb-1 text-[10px] uppercase text-dnd-muted">{cat === 'simple' ? 'Simples' : 'Marciales'}</p>
              <ul>
                {SRD_WEAPONS.filter((wp) => wp.category === cat).map((wp) => {
                  const selected = weaponIds.includes(wp.id);
                  return (
                    <li key={wp.id}>
                      <button
                        onClick={() => toggleWeapon(wp.id)}
                        aria-pressed={selected}
                        className={`flex w-full items-center gap-2 px-2 py-1 text-left text-sm transition-colors hover:bg-dnd-leather/20 ${selected ? 'bg-dnd-gold/10' : ''}`}
                      >
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-dnd-gold bg-dnd-gold text-dnd-ink' : 'border-dnd-leather/60'}`}>{selected && '✓'}</span>
                        <span className="min-w-0 flex-1 truncate font-bold text-dnd-text">{wp.name}</span>
                        <span className="shrink-0 text-[10px] text-dnd-muted">{wp.damage} {wp.damageType}</span>
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
              const ability = weaponAbility(weapon);
              const mod = weaponAttackModifier(weapon, stats);
              const bonus = weaponAttackBonus(weapon, stats, prof);
              return (
                <div key={weapon.id} className="rounded-lg bg-dnd-ink/40 p-2 text-xs text-dnd-text">
                  <p className="font-bold text-dnd-gold">⚔️ {weapon.name} · {weapon.kind === 'ranged' ? 'A distancia' : 'Cuerpo a cuerpo'} · {weapon.damage} {weapon.damageType}</p>
                  {weapon.properties.length > 0 && <p className="text-dnd-muted">Propiedades: {weapon.properties.join(', ')}</p>}
                  <p>Ataque: <span className="font-bold text-dnd-text">+{bonus}</span> <span className="text-dnd-muted">(competencia {prof} + {STAT_LABELS[ability]} {mod >= 0 ? `+${mod}` : mod})</span></p>
                  <p>Daño: <span className="font-bold text-dnd-text">{weaponDamageFormula(weapon, stats)}</span>{weaponDamageBonus(weapon, stats) !== 0 && <span className="text-dnd-muted"> (modificador {STAT_LABELS[ability]})</span>}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  // ============================= PESTAÑA: RASGOS / DOTES =============================
  const renderFeats = () => {
    if (mode === 'view') {
      if (!player) return null;
      const featsList = player.feats ?? [];
      if (featsList.length === 0) return <p className="text-sm text-dnd-muted">Este personaje aún no tiene dotes/rasgos.</p>;
      return (
        <div className="flex flex-col gap-2 text-[11px] text-dnd-muted">
          <p className="uppercase text-dnd-muted">Dotes / rasgos ({featsList.length})</p>
          <div className="flex flex-wrap gap-1">
            {featsList.map((title) => <FeatChip key={title} title={title} onOpen={setOpenFeatId} />)}
          </div>
        </div>
      );
    }
    return (
      <section className="section-box">
        <h3 className="mb-2 section-title">Dotes · SRD 2024 ({feats.length})</h3>
        <input value={featQuery} onChange={(e) => setFeatQuery(e.target.value)} placeholder="Buscar dote…" aria-label="Buscar dote en el SRD" className={`${input} w-full`} />
        {feats.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {feats.map((feat) => {
              const featEntry = BASE_SRD_BUNDLE.feats.find((f) => f.title === feat);
              return (
                <span key={feat} className="badge border border-dnd-gold/40 bg-dnd-gold/10 text-dnd-text">
                  {feat}
                  {featEntry && (
                    <button onClick={() => setViewingFeat(featEntry)} aria-label={`Ver descripción de la dote ${feat}`} title="Ver descripción" className="ml-1 text-dnd-gold hover:text-dnd-gold/80"><BookOpen size={12} /></button>
                  )}
                  <button onClick={() => toggleFeat(feat)} aria-label={`Quitar dote ${feat}`} className="ml-1 text-red-300 hover:text-red-200">×</button>
                </span>
              );
            })}
          </div>
        )}
        <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-dnd-leather/30">
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
                      <button onClick={() => toggleFeat(feat)} aria-pressed={selected} className={`flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-dnd-leather/20 ${selected ? 'bg-dnd-gold/10' : ''}`}>
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${selected ? 'border-dnd-gold bg-dnd-gold text-dnd-ink' : 'border-dnd-leather/60'}`}>{selected && '✓'}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-dnd-text">{feat}</span>
                          <span className="block text-[10px] text-dnd-muted">{featEntry?.type === 'origin' ? 'Dote de origen' : 'Dote general'}{featEntry?.prerequisite ? ` · ${featEntry.prerequisite}` : ''}</span>
                        </span>
                      </button>
                      {featEntry && (
                        <button onClick={() => setViewingFeat(featEntry)} aria-label={`Ver descripción de la dote ${feat}`} className="flex w-9 shrink-0 items-center justify-center border-l border-dnd-leather/30 text-dnd-gold transition-colors hover:bg-dnd-gold/10"><BookOpen size={14} /></button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    );
  };

  const current = player;

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} icon={<ArrowLeft size={15} />} aria-label="Volver a la lista del party">
            Volver
          </Button>
          <div>
            <h2 className="page-title">
              {isNew ? 'Nuevo personaje' : current ? current.name : ''}
            </h2>
            {isNew ? (
              <p className="text-sm text-dnd-muted">Completa las pestañas y guarda al finalizar.</p>
            ) : current && (
              <p className="text-sm text-dnd-muted">
                {current.race ? `${current.race} · ` : ''}Nv {current.level} · {current.class} · Competencia +{current.proficiencyBonus}
              </p>
            )}
          </div>
        </div>
        <div className="page-actions">
          {!isNew && (
            <Button variant="secondary" size="sm" icon={<Swords size={15} />} onClick={handleAddToCombat} disabled={alreadyInCombat} title={alreadyInCombat ? `${current?.name} ya está en combate` : undefined}>
              {alreadyInCombat ? 'Ya en combate' : 'Añadir al combate'}
            </Button>
          )}
          {mode === 'view' ? (
            <Button variant="primary" size="sm" onClick={() => setMode('edit')} icon={<BookOpen size={15} />}>
              Editar
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleSave} icon={<Save size={15} />}>
              {isNew ? 'Crear personaje' : 'Guardar cambios'}
            </Button>
          )}
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Secciones de la ficha">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              tab === id ? 'bg-dnd-gold text-dnd-ink' : 'border border-dnd-leather/50 text-dnd-text/70 hover:bg-dnd-leather/20'
            }`}
          >
            {icon && <span className="mr-1" aria-hidden="true">{icon}</span>}{label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'stats' && renderStats()}
        {tab === 'skills' && renderSkills()}
        {tab === 'spells' && renderSpells()}
        {tab === 'equipment' && renderEquipment()}
        {tab === 'feats' && renderFeats()}
      </div>

      {/* Acciones inferiores */}
      {mode === 'edit' && (
        <div className="flex justify-end gap-2">
          {isNew ? (
            <Button variant="ghost" onClick={onBack}>Cancelar</Button>
          ) : (
            <Button variant="ghost" onClick={() => { setMode('view'); }}>
              Cancelar edición
            </Button>
          )}
          <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>
            {isNew ? 'Crear personaje' : 'Guardar cambios'}
          </Button>
        </div>
      )}

      {/* Paneles flotantes de detalle (conjuros / dotes) */}
      <SrdDetailPanel entry={openSpellEntry} onClose={() => setOpenSpellId(null)} />
      <SrdDetailPanel entry={openFeatEntry} onClose={() => setOpenFeatId(null)} />
      <Modal open={viewingFeat !== null} onClose={() => setViewingFeat(null)} title={viewingFeat?.title ?? ''} subtitle={viewingFeat ? (viewingFeat.type === 'origin' ? 'Dote de origen' : 'Dote general') + (viewingFeat.prerequisite ? ` · ${viewingFeat.prerequisite}` : '') : ''} maxWidth="lg">
        {viewingFeat && <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-dnd-leather/30 p-3"><MarkdownPreview content={viewingFeat.content} /></div>}
      </Modal>
    </div>
  );
};

export default CharacterSheet;