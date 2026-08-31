// ============================================================
// Etiquetas del SRD: badge de fuente (2024/5.1/Homebrew) y tags
// ============================================================

import { SRD_SOURCES } from '../../types/srd2024';
import type { SrdSource } from '../../types/srd2024';

const sourceStyle: Record<SrdSource, string> = {
  srd2024: 'text-dnd-muted',
  srd51: 'text-dnd-text',
  homebrew: 'text-purple-300',
};

/**
 * Badge que identifica la procedencia del contenido (requisito de
 * visibilidad del sistema de etiquetas SRD 2024).
 */
export const SrdSourceBadge = ({ source }: { source: SrdSource }) => (
  <span
    className={`badge ${sourceStyle[source]}`}
    title={SRD_SOURCES[source].notice}
  >
    {SRD_SOURCES[source].short}
  </span>
);

/** Chip de tag genérico. */
export const TagChip = ({ label }: { label: string }) => (
  <span className="badge border border-dnd-leather/40 bg-dnd-ink/60 text-dnd-muted">
    {label}
  </span>
);