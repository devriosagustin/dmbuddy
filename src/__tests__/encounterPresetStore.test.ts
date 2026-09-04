// ============================================================
// Tests del store de presets de encuentro
// ============================================================

import { beforeEach, describe, expect, it } from 'vitest';
import { useEncounterPresetStore } from '../store/encounterPresetStore';

beforeEach(() => {
  useEncounterPresetStore.setState({ presets: [] });
});

describe('Encounter Preset Store', () => {
  it('guarda un preset con su composición de monstruos', () => {
    const { savePreset } = useEncounterPresetStore.getState();
    const preset = savePreset('Emboscada de goblins', [
      { monsterId: 'goblin', quantity: 3 },
      { monsterId: 'ogro', quantity: 1 },
    ]);
    expect(preset.name).toBe('Emboscada de goblins');
    expect(preset.monsters).toHaveLength(2);
    expect(useEncounterPresetStore.getState().presets).toHaveLength(1);
  });

  it('actualiza la composición al guardar con el mismo nombre', () => {
    const { savePreset } = useEncounterPresetStore.getState();
    savePreset('Sala de guardias', [{ monsterId: 'guardia', quantity: 2 }]);
    savePreset('Sala de guardias', [{ monsterId: 'guardia', quantity: 4 }]);

    const presets = useEncounterPresetStore.getState().presets;
    expect(presets).toHaveLength(1);
    expect(presets[0].monsters[0].quantity).toBe(4);
  });

  it('usa un nombre por defecto si se guarda sin nombre', () => {
    const { savePreset } = useEncounterPresetStore.getState();
    const preset = savePreset('   ', [{ monsterId: 'lobo', quantity: 2 }]);
    expect(preset.name).toBe('Preset sin nombre');
  });

  it('elimina un preset', () => {
    const { savePreset, deletePreset } = useEncounterPresetStore.getState();
    const preset = savePreset('Cripta', [{ monsterId: 'esqueleto', quantity: 5 }]);
    expect(useEncounterPresetStore.getState().presets).toHaveLength(1);

    deletePreset(preset.id);
    expect(useEncounterPresetStore.getState().presets).toHaveLength(0);
  });

  it('renombra un preset', () => {
    const { savePreset, renamePreset } = useEncounterPresetStore.getState();
    const preset = savePreset('Vieja emboscada', [{ monsterId: 'goblin', quantity: 2 }]);
    renamePreset(preset.id, 'Nueva emboscada');
    expect(useEncounterPresetStore.getState().presets[0].name).toBe('Nueva emboscada');
  });
});
