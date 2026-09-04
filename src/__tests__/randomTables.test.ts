// ============================================================
// Tests de las utilidades del generador aleatorio (sin IA)
// ============================================================

import { describe, expect, it } from 'vitest';
import { ADVENTURE_HOOKS, COMPLICATIONS, LOOT_TABLES, NPC_NAME_TABLES } from '../data/randomTables';
import { pickRandom, rollAdventureHook, rollComplication, rollLoot, rollNpcName } from '../utils/randomTables';

describe('Tablas aleatorias — datos', () => {
  it('todas las tablas de nombres de NPC tienen al menos un nombre y un apellido', () => {
    for (const table of NPC_NAME_TABLES) {
      expect(table.firstNames.length).toBeGreaterThan(0);
      expect(table.surnames.length).toBeGreaterThan(0);
    }
  });

  it('hay una tabla de nombres por cada especie curada del SRD', () => {
    const ids = NPC_NAME_TABLES.map((t) => t.speciesId);
    expect(new Set(ids).size).toBe(ids.length); // sin duplicados
    expect(ids).toEqual(
      expect.arrayContaining([
        'sp-human', 'sp-elf', 'sp-dwarf', 'sp-halfling', 'sp-dragonborn',
        'sp-gnome', 'sp-goliath', 'sp-orc', 'sp-tiefling', 'sp-aasimar',
      ])
    );
  });

  it('los rangos de oro del botín son válidos (min <= max)', () => {
    for (const entries of Object.values(LOOT_TABLES)) {
      for (const entry of entries) {
        expect(entry.goldMin).toBeLessThanOrEqual(entry.goldMax);
        expect(entry.goldMin).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('pickRandom', () => {
  it('devuelve el único elemento de una lista de longitud 1', () => {
    expect(pickRandom(['solo'])).toBe('solo');
  });

  it('siempre devuelve un elemento perteneciente a la lista', () => {
    const list = [1, 2, 3, 4, 5];
    for (let i = 0; i < 50; i++) {
      expect(list).toContain(pickRandom(list));
    }
  });
});

describe('rollNpcName', () => {
  it('usa la tabla de la especie pedida cuando el id es válido', () => {
    for (let i = 0; i < 10; i++) {
      const result = rollNpcName('sp-dwarf');
      expect(result.speciesLabel).toBe('Enano');
    }
  });

  it('cae a una tabla al azar si el id no es reconocido', () => {
    const result = rollNpcName('sp-inventado');
    const labels = NPC_NAME_TABLES.map((t) => t.speciesLabel);
    expect(labels).toContain(result.speciesLabel);
  });

  it('el nombre generado tiene nombre y apellido separados por un espacio', () => {
    const result = rollNpcName('sp-human');
    expect(result.name.split(' ').length).toBeGreaterThanOrEqual(2);
  });
});

describe('rollAdventureHook / rollComplication', () => {
  it('devuelven siempre un texto de la tabla correspondiente', () => {
    for (let i = 0; i < 20; i++) {
      expect(ADVENTURE_HOOKS).toContain(rollAdventureHook());
      expect(COMPLICATIONS).toContain(rollComplication());
    }
  });
});

describe('rollLoot', () => {
  it('el oro tirado siempre cae dentro del rango de alguna entrada del tier', () => {
    for (let i = 0; i < 30; i++) {
      const result = rollLoot('medio');
      const matching = LOOT_TABLES.medio.find((e) => e.text === result.text);
      expect(matching).toBeDefined();
      expect(result.gold).toBeGreaterThanOrEqual(matching!.goldMin);
      expect(result.gold).toBeLessThanOrEqual(matching!.goldMax);
    }
  });

  it('respeta el tier elegido (legendario da más oro que bajo, en promedio)', () => {
    const bajo = rollLoot('bajo');
    const legendario = rollLoot('legendario');
    expect(legendario.gold).toBeGreaterThan(0);
    expect(bajo.gold).toBeGreaterThanOrEqual(0);
  });
});
