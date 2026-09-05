// ============================================================
// Tests de alcance de conjuros (parseo de `range` + línea de visión)
// ============================================================

import { describe, expect, it } from 'vitest';
import type { MapTile } from '../types';
import { parseSpellRangeFeet, evaluateSpellReach, spellReachIssue } from '../utils/spellRange';

describe('parseSpellRangeFeet', () => {
  it('interpreta distancias planas en pies', () => {
    expect(parseSpellRangeFeet('120 pies')).toBe(120);
    expect(parseSpellRangeFeet('30 pies')).toBe(30);
  });

  it('interpreta Toque/Contacto como cuerpo a cuerpo (5 pies)', () => {
    expect(parseSpellRangeFeet('Toque')).toBe(5);
    expect(parseSpellRangeFeet('Contacto')).toBe(5);
  });

  it('interpreta el paréntesis de un conjuro Personal (radio/cono/cubo)', () => {
    expect(parseSpellRangeFeet('Personal (15 pies de cubo)')).toBe(15);
    expect(parseSpellRangeFeet('Personal (60 pies de cono)')).toBe(60);
    expect(parseSpellRangeFeet('Personal (120 pies de radio)')).toBe(120);
  });

  it('interpreta una línea "N x M pies" usando el largo, no el ancho', () => {
    expect(parseSpellRangeFeet('Personal (100 x 5 pies)')).toBe(100);
  });

  it('interpreta millas', () => {
    expect(parseSpellRangeFeet('1 milla')).toBe(5280);
  });

  it('un "Personal" sin distancia numérica no tiene alcance interpretable', () => {
    expect(parseSpellRangeFeet('Personal')).toBeNull();
  });

  it('un formato no reconocido no tiene alcance interpretable', () => {
    expect(parseSpellRangeFeet('Ilimitado')).toBeNull();
  });
});

describe('evaluateSpellReach', () => {
  const clearTiles: MapTile[] = [];
  const wallBetween: MapTile[] = [{ x: 5, y: 0, type: 'wall' }];

  it('sin posición de lanzador o de objetivo, no se puede evaluar nada', () => {
    const reach = evaluateSpellReach(null, { x: 5, y: 0 }, clearTiles, '120 pies');
    expect(reach.distanceFeet).toBeNull();
    expect(reach.inRange).toBeNull();
    expect(reach.hasLineOfSight).toBeNull();
    expect(reach.maxRangeFeet).toBe(120);
  });

  it('objetivo dentro de alcance y a la vista', () => {
    const reach = evaluateSpellReach({ x: 0, y: 0 }, { x: 2, y: 0 }, clearTiles, '120 pies');
    expect(reach.distanceFeet).toBe(10); // 2 casillas x 5 pies
    expect(reach.inRange).toBe(true);
    expect(reach.hasLineOfSight).toBe(true);
  });

  it('objetivo fuera de alcance', () => {
    const reach = evaluateSpellReach({ x: 0, y: 0 }, { x: 30, y: 0 }, clearTiles, '60 pies');
    expect(reach.distanceFeet).toBe(150);
    expect(reach.inRange).toBe(false);
  });

  it('objetivo en rango pero sin línea de visión (bloqueado por un muro)', () => {
    const reach = evaluateSpellReach({ x: 0, y: 0 }, { x: 10, y: 0 }, wallBetween, '120 pies');
    expect(reach.inRange).toBe(true);
    expect(reach.hasLineOfSight).toBe(false);
  });

  it('un alcance no interpretable no bloquea, pero la línea de visión se sigue evaluando', () => {
    const reach = evaluateSpellReach({ x: 0, y: 0 }, { x: 10, y: 0 }, wallBetween, 'Personal');
    expect(reach.maxRangeFeet).toBeNull();
    expect(reach.inRange).toBeNull();
    expect(reach.hasLineOfSight).toBe(false);
  });
});

describe('spellReachIssue', () => {
  it('no hay problema cuando el objetivo está en rango y a la vista', () => {
    expect(spellReachIssue({ x: 0, y: 0 }, { x: 2, y: 0 }, [], '120 pies')).toBeNull();
  });

  it('sin posiciones conocidas no se bloquea el lanzamiento', () => {
    expect(spellReachIssue(null, null, [], '30 pies')).toBeNull();
  });

  it('reporta fuera de alcance con la distancia real y el alcance del conjuro', () => {
    const issue = spellReachIssue({ x: 0, y: 0 }, { x: 30, y: 0 }, [], '60 pies');
    expect(issue).toContain('Fuera de alcance');
    expect(issue).toContain('150 pies');
    expect(issue).toContain('60 pies');
  });

  it('reporta línea de visión bloqueada cuando está en rango pero un muro tapa la vista', () => {
    const tiles: MapTile[] = [{ x: 5, y: 0, type: 'wall' }];
    const issue = spellReachIssue({ x: 0, y: 0 }, { x: 10, y: 0 }, tiles, '120 pies');
    expect(issue).toContain('línea de visión');
  });
});
