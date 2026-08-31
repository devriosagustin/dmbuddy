import { describe, expect, it } from 'vitest';
import { indexBundle, searchSrd } from '../utils/srdSearch';
import { BASE_SRD_BUNDLE } from '../data/srd2024';

const index = indexBundle(BASE_SRD_BUNDLE);

describe('srdSearch', () => {
  it('busca ignorando acentos y mayúsculas', () => {
    const results = searchSrd(index, 'cegado');
    expect(results.length).toBeGreaterThan(0);
    const hits = searchSrd(index, 'cegado');
    expect(hits.map((r) => r.item.title)).toContain('Cegado (Blinded)');
  });

  it('devuelve resultados por título con mayor puntuación primero', () => {
    const results = searchSrd(index, 'bola de fuego');
    const first = results[0];
    expect(first).toBeDefined();
    expect(first.score).toBeGreaterThan(0);
    expect(first.item.title.toLowerCase()).toContain('bola de fuego');
  });

  it('devuelve [] con consulta vacía o sin coincidencias', () => {
    expect(searchSrd(index, '')).toEqual([]);
    expect(searchSrd(index, '   ')).toEqual([]);
    expect(searchSrd(index, 'zzznoexiste')).toEqual([]);
  });

  it('respeta el límite de resultados', () => {
    const results = searchSrd(index, 'o', 9);
    expect(results.length).toBeLessThanOrEqual(9);
  });

  it('indexa categorías con sus campos extra', () => {
    const spell = index.find((i) => i.category === 'spells');
    expect(spell).toBeDefined();
    expect(spell?.keywords.length).toBeGreaterThan(5);
  });
});