import { describe, expect, it } from 'vitest';
import {
  slotProgressionOf,
  spellSlotsMax,
  shortRestUsed,
  longRestUsed,
  clampUsedToMax,
  spellcastingLimits,
  featSpellBoosts,
} from '../utils/spellcastingRules';

describe('spellSlotsMax (tabla de espacios 2024)', () => {
  it('conjurador completo: Mago nivel 5 tiene 4/3/2 (niveles 1-2-3)', () => {
    expect(spellSlotsMax('Mago', 5)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
  });

  it('conjurador completo: Mago nivel 20 tiene 4/3/3/3/3/2/2/1/1', () => {
    expect(spellSlotsMax('Mago', 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
  });

  it('medio conjurador 2024: Paladín nivel 5 tiene 4/2 (nivel 2 se abre al 5)', () => {
    expect(spellSlotsMax('Paladín', 5)).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0]);
    expect(spellSlotsMax('Paladín', 1)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(spellSlotsMax('Paladín', 9)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
    expect(spellSlotsMax('Guardabosques', 5)).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('medio conjurador nunca llega a espacios de nivel 6+', () => {
    for (let level = 1; level <= 20; level++) {
      const slots = spellSlotsMax('Paladín', level);
      expect(slots.slice(5).every((n) => n === 0)).toBe(true);
    }
  });

  it('Brujo: espacio único que sube de nivel (Pacto Mágico)', () => {
    expect(spellSlotsMax('Brujo', 1)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(spellSlotsMax('Brujo', 2)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(spellSlotsMax('Brujo', 5)).toEqual([0, 0, 2, 0, 0, 0, 0, 0, 0]);
    expect(spellSlotsMax('Brujo', 9)).toEqual([0, 0, 0, 0, 2, 0, 0, 0, 0]);
    expect(spellSlotsMax('Brujo', 11)).toEqual([0, 0, 0, 0, 3, 0, 0, 0, 0]);
    expect(spellSlotsMax('Brujo', 20)).toEqual([0, 0, 0, 0, 4, 0, 0, 0, 0]);
  });

  it('las clases no conjuradoras no tienen espacios', () => {
    for (const cls of ['Bárbaro', 'Guerrero', 'Monje', 'Pícaro']) {
      expect(slotProgressionOf(cls)).toBe('none');
      expect(spellSlotsMax(cls, 10)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
  });

  it('el nivel máximo jugable corrige Paladín (2º a partir del nivel 5)', () => {
    expect(spellcastingLimits('Paladín', 4).maxSlotLevel).toBe(1);
    expect(spellcastingLimits('Paladín', 5).maxSlotLevel).toBe(2);
    expect(spellcastingLimits('Guardabosques', 4).maxSlotLevel).toBe(1);
  });
});

describe('recuperación de espacios (2024)', () => {
  it('descanso corto: Brujo recupera todos sus espacios de pacto', () => {
    const used = spellSlotsMax('Brujo', 9); // [0,0,0,0,2,...] gastados
    expect(shortRestUsed(used, 'pact')).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('descanso corto: resto de clases recupera 1 espacio del nivel más alto gastado', () => {
    // Mago 5 con 4/3/2 y gastados [4,1,2]
    const used = [4, 1, 2, 0, 0, 0, 0, 0, 0];
    const after = shortRestUsed(used, 'full');
    expect(after).toEqual([4, 1, 1, 0, 0, 0, 0, 0, 0]);
  });

  it('descanso corto: recupera 1 del nivel más alto gastado, sin superar el máximo', () => {
    // Todo gastado: recupera 1 del nivel más alto (queda dentro del máximo).
    const full = [4, 3, 2, 0, 0, 0, 0, 0, 0];
    expect(shortRestUsed(full, 'full')).toEqual([4, 3, 1, 0, 0, 0, 0, 0, 0]);
    // Sin ningún espacio gastado: nada que recuperar.
    const unused = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(shortRestUsed(unused, 'full')).toEqual(unused);
  });

  it('descanso largo: todos los espacios vuelven a cero usados', () => {
    expect(longRestUsed()).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('descanso corto no afecta a clases sin conjuros', () => {
    const used = [2, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(shortRestUsed(used, 'none')).toEqual(used);
  });

  it('clampUsedToMax nunca supera el máximo ni baja de cero', () => {
    const max = spellSlotsMax('Mago', 5);
    expect(clampUsedToMax([99, -3, 1, 0, 0, 0, 0, 0, 0], max)).toEqual([4, 0, 1, 0, 0, 0, 0, 0, 0]);
  });
});

describe('featSpellBoosts (bonos de dotes a trucos/conjuros)', () => {
  it('Iniciado en magia suma 2 trucos y 1 conjuro y habilita nivel 1', () => {
    expect(featSpellBoosts(['Iniciado en magia'])).toEqual({
      cantrips: 2,
      spells: 1,
      minSpellLevel: 1,
    });
  });

  it('las dotes sin bono declarado no alteran la cuota', () => {
    expect(featSpellBoosts(['Alerta', 'Robusto', 'Competente'])).toEqual({
      cantrips: 0,
      spells: 0,
      minSpellLevel: 0,
    });
  });

  it('dotes desconocidas o lista vacía no aportan nada', () => {
    expect(featSpellBoosts([])).toEqual({ cantrips: 0, spells: 0, minSpellLevel: 0 });
    expect(featSpellBoosts(['Dote inexistente'])).toEqual({ cantrips: 0, spells: 0, minSpellLevel: 0 });
  });

  it('la búsqueda de dotes ignora mayúsculas y acentos', () => {
    expect(featSpellBoosts(['INICIADO EN MAGIA', 'iniciado en magia'])).toEqual({
      cantrips: 4,
      spells: 2,
      minSpellLevel: 1,
    });
  });
});