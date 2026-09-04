// ============================================================
// Tests de la plantilla de preparación de sesión (noteStore.ts)
// ============================================================

import { describe, expect, it } from 'vitest';
import { SESSION_PREP_TEMPLATE } from '../store/noteStore';

describe('SESSION_PREP_TEMPLATE', () => {
  it('incluye las secciones esperadas de preparación de sesión', () => {
    const sections = [
      'Recap de la sesión anterior',
      'Objetivos de hoy',
      'Encuentros planeados',
      'NPCs clave',
      'Botín / recompensas',
      'Notas sueltas',
    ];
    for (const section of sections) {
      expect(SESSION_PREP_TEMPLATE).toContain(section);
    }
  });

  it('es contenido Markdown válido en formato de encabezados de nivel 2', () => {
    const headingLines = SESSION_PREP_TEMPLATE.split('\n').filter((l) => l.startsWith('## '));
    expect(headingLines.length).toBe(6);
  });
});
