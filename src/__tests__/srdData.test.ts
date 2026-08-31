import { describe, expect, it } from 'vitest';
import { BASE_SRD_BUNDLE, srdMonsterToMonster, srdSpellToSpell, srdSpellByTitle, SRD_CLASSES } from '../data/srd2024';
import { mergeBundle, emptyBundle } from '../services/srdService';
import { CC_BY_4_0_NOTICE } from '../types/srd2024';
import type { SrdRecord } from '../types/srd2024';

describe('BASE_SRD_BUNDLE (integridad de datos)', () => {
  it('todas las colecciones contienen entradas', () => {
    expect(BASE_SRD_BUNDLE.rules.length).toBeGreaterThan(0);
    expect(BASE_SRD_BUNDLE.conditions.length).toBeGreaterThan(0);
    expect(BASE_SRD_BUNDLE.spells.length).toBeGreaterThan(0);
    expect(BASE_SRD_BUNDLE.monsters.length).toBeGreaterThan(0);
    expect(BASE_SRD_BUNDLE.classes.length).toBeGreaterThan(0);
    expect(BASE_SRD_BUNDLE.species.length).toBeGreaterThan(0);
    expect(BASE_SRD_BUNDLE.feats.length).toBeGreaterThan(0);
  });

  it('IDs únicos y metadatos completos en todas las entradas', () => {
    const all = [
      ...BASE_SRD_BUNDLE.rules,
      ...BASE_SRD_BUNDLE.conditions,
      ...BASE_SRD_BUNDLE.spells,
      ...BASE_SRD_BUNDLE.monsters,
      ...BASE_SRD_BUNDLE.classes,
      ...BASE_SRD_BUNDLE.species,
      ...BASE_SRD_BUNDLE.feats,
    ];
    const ids = all.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rec of all) {
      expect(rec.id.length).toBeGreaterThan(0);
      expect(rec.title.length).toBeGreaterThan(0);
      expect(rec.source).toBe('srd2024');
      expect(Array.isArray(rec.tags)).toBe(true);
    }
  });

  it('los conjuros tienen nivel, escuela, clases y contenido', () => {
    for (const s of BASE_SRD_BUNDLE.spells) {
      expect(typeof s.level).toBe('number');
      expect(s.school.length).toBeGreaterThan(0);
      expect(s.classes.length).toBeGreaterThan(0);
      expect(s.castingTime.length).toBeGreaterThan(0);
      expect(s.content.length).toBeGreaterThan(0);
    }
  });

  it('las 12 clases de 2024 tienen atributo, dados y salvaciones', () => {
    expect(BASE_SRD_BUNDLE.classes.length).toBe(12);
    for (const c of BASE_SRD_BUNDLE.classes) {
      expect(c.primaryAbility.length).toBeGreaterThan(0);
      expect(c.hitDice).toMatch(/^d\d+$/);
      expect(c.saves.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('los monstruos 2024 tienen estadísticas completas y CR numérico', () => {
    expect(BASE_SRD_BUNDLE.monsters.length).toBeGreaterThanOrEqual(5);
    for (const m of BASE_SRD_BUNDLE.monsters) {
      expect(typeof m.armorClass).toBe('number');
      expect(typeof m.hitPoints).toBe('number');
      expect(typeof m.challengeRating).toBe('number');
      expect(m.stats.str).toBeGreaterThanOrEqual(1);
      expect(m.stats.cha).toBeGreaterThanOrEqual(1);
      expect(m.actions.length).toBeGreaterThan(0);
    }
  });

  it('srdMonsterToMonster genera un Monster válido para la biblioteca', () => {
    const { name, stats, challengeRating } = srdMonsterToMonster(BASE_SRD_BUNDLE.monsters[0]);
    expect(name.length).toBeGreaterThan(0);
    expect(typeof stats.str).toBe('number');
    expect(typeof challengeRating).toBe('number');
  });

  it('contiene el aviso de atribución CC-BY-4.0', () => {
    expect(CC_BY_4_0_NOTICE).toContain('CC-BY-4.0');
    expect(CC_BY_4_0_NOTICE).toContain('SRD 5.2');
  });

  it('los nombres de clase en los conjuros coinciden con las clases del SRD (filtro del party)', () => {
    const classTitles = new Set(SRD_CLASSES.map((c) => c.title));
    expect(classTitles.has('Guardabosques')).toBe(true);
    for (const s of BASE_SRD_BUNDLE.spells) {
      for (const cl of s.classes) {
        expect(classTitles.has(cl)).toBe(true);
      }
    }
  });

  it('srdSpellByTitle resuelve por título ignorando acentos, mayúsculas y espacios', () => {
    const fireball = BASE_SRD_BUNDLE.spells.find((s) => s.id === 'spell-fireball');
    expect(fireball).toBeDefined();
    expect(fireball!.title).toBe('Bola de fuego (Fireball)');
    expect(srdSpellByTitle('Bola de fuego (Fireball)')).toBe(fireball);
    expect(srdSpellByTitle('  BOLA DE FUEGO (FIREBALL) ')).toBe(fireball);
  });

  it('los lanzadores del bestiario 2024 llevan conjuros resolubles a daño', () => {
    const mage = BASE_SRD_BUNDLE.monsters.find((m) => m.id === 'm2024-mage');
    expect(mage).toBeDefined();
    expect(mage!.spellcasting).toBeDefined();
    expect(mage!.spellcasting!.ability).toBe('INT');
    expect(mage!.spellcasting!.spellSaveDC).toBe(14);
    const names = Object.values(mage!.spellcasting!.spellbook).flat();
    expect(names).toContain('Bola de fuego (Fireball)');
    expect(srdSpellByTitle('Bola de fuego (Fireball)')?.damageRolls).toBe('8d6');
  });

  it('el conversor a Monster conserva el lanzamiento de conjuros', () => {
    const lich = BASE_SRD_BUNDLE.monsters.find((m) => m.id === 'm2024-lich');
    expect(lich?.spellcasting).toBeDefined();
    const monster = srdMonsterToMonster(lich!);
    expect(monster.spellcasting?.spellSaveDC).toBe(20);
    expect(monster.spellcasting?.spellbook['Nivel 9']).toContain('Palabra de poder: Matar');
  });

  it('srdSpellToSpell convierte un conjuro SRD al modelo Spell del party', () => {
    const truco = BASE_SRD_BUNDLE.spells.find((s) => s.level === 0);
    expect(truco).toBeDefined();
    const spell = srdSpellToSpell(truco!);
    expect(spell.id).toBe(truco!.id);
    expect(spell.name).toBe(truco!.title);
    expect(spell.level).toBe(0);
    expect(spell.school).toBe(truco!.school);
    expect(spell.description).toBe(truco!.content);
  });
});

describe('mergeBundle / emptyBundle', () => {
  it('un overlay reemplaza entradas por id y añade nuevas', () => {
    const base = BASE_SRD_BUNDLE;
    const replacement = { ...base.spells[0], title: 'Título reemplazado' };
    const brandNew: SrdRecord = {
      id: 'spell-test-nuevo',
      title: 'Conjuro de prueba',
      category: 'spells',
      source: 'homebrew',
      tags: ['Prueba'],
      level: 0,
      school: 'Evocación',
      castingTime: '1 Acción',
      range: 'Toque',
      components: 'V',
      duration: 'Instantáneo',
      concentration: false,
      ritual: false,
      classes: ['Mago'],
      content: 'Prueba de overlay.',
    };

    const merged = mergeBundle(base, {
      spells: [replacement, brandNew],
    });

    expect(merged.spells.find((s) => s.id === replacement.id)?.title).toBe('Título reemplazado');
    expect(merged.spells.some((s) => s.id === brandNew.id)).toBe(true);
    expect(merged.rules).toBe(base.rules);
  });

  it('un overlay vacío devuelve el bundle sin cambios', () => {
    expect(mergeBundle(BASE_SRD_BUNDLE, {})).toEqual(BASE_SRD_BUNDLE);
    expect(emptyBundle().spells).toEqual([]);
  });
});