// ============================================================
// Chips de biblioteca (SRD 5.2) reutilizables: conjuro y dote.
// Abren el panel de detalle de la biblioteca en un clic.
// ============================================================

import { BookOpen } from 'lucide-react';
import type { Spell } from '../../types';

/** Chip clicable de un conjuro: abre el detalle del SRD 5.2. */
export const SpellChip = ({ spell, onOpen }: { spell: Spell; onOpen: (name: string) => void }) => (
  <button
    type="button"
    onClick={() => onOpen(spell.name)}
    title={`Ver detalle de ${spell.name}`}
    aria-label={`Ver detalle de ${spell.name}`}
    className="inline-flex max-w-full items-center gap-1 rounded-full border border-dnd-gold/30 bg-dnd-gold/10 px-2 py-0.5 text-[10px] text-dnd-text transition-colors hover:border-dnd-gold/60 hover:bg-dnd-gold/20"
  >
    <BookOpen size={10} className="shrink-0 text-dnd-gold" aria-hidden="true" />
    <span className="truncate">{spell.name}</span>
  </button>
);

/** Chip clicable de una dote: abre su texto completo del SRD 5.2 (o el título si no tiene ficha). */
export const FeatChip = ({ title, onOpen }: { title: string; onOpen: (title: string) => void }) => (
  <button
    type="button"
    onClick={() => onOpen(title)}
    title={`Ver detalle de ${title}`}
    aria-label={`Ver detalle de ${title}`}
    className="inline-flex max-w-full items-center gap-1 rounded-full border border-dnd-gold/30 bg-dnd-gold/10 px-2 py-0.5 text-[10px] text-dnd-text transition-colors hover:border-dnd-gold/60 hover:bg-dnd-gold/20"
  >
    <BookOpen size={10} className="shrink-0 text-dnd-gold" aria-hidden="true" />
    <span className="truncate">{title}</span>
  </button>
);

/** Chip clicable de un arma equipada: abre su detalle en la biblioteca. */
export const WeaponChip = ({
  name,
  onOpen,
}: {
  name: string;
  onOpen: (weaponName: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onOpen(name)}
    title={`Ver detalle de ${name}`}
    aria-label={`Ver detalle de ${name}`}
    className="inline-flex max-w-full items-center gap-1 rounded-full border border-dnd-gold/30 bg-dnd-gold/10 px-2 py-0.5 text-[10px] text-dnd-text transition-colors hover:border-dnd-gold/60 hover:bg-dnd-gold/20"
  >
    <BookOpen size={10} className="shrink-0 text-dnd-gold" aria-hidden="true" />
    <span className="truncate">{name}</span>
  </button>
);