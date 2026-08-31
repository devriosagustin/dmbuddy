// ============================================================
// Paleta de búsqueda rápida (Command Palette) - Ctrl+K
// Busca cualquier regla, estado, conjuro o monstruo en plena partida.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, Search, X } from 'lucide-react';
import { useSrdStore } from '../../state/srdStore';
import { indexBundle, searchSrd } from '../../utils/srdSearch';
import { SrdSourceBadge } from './SrdBadge';
import { SRD_CATEGORIES } from '../../types/srd2024';
import type { SrdCategoryId } from '../../types/srd2024';

/**
 * Overlay global de búsqueda. Se monta una vez en el Layout y
 * se abre con Ctrl+K (o ⌘K) desde cualquier pantalla.
 */
export const SearchPalette = () => {
  const open = useSrdStore((s) => s.paletteOpen);
  const setOpen = useSrdStore((s) => s.setPaletteOpen);

  // Atajo global Ctrl+K / ⌘K y Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useSrdStore.getState().paletteOpen);
      } else if (e.key === 'Escape' && useSrdStore.getState().paletteOpen) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen]);

  const close = useCallback(() => setOpen(false), [setOpen]);

  return (
    <AnimatePresence>
      {open && <PaletteBody onClose={close} />}
    </AnimatePresence>
  );
};

/**
 * Cuerpo de la paleta. Solo se monta mientras está abierta, por lo que
 * su estado (consulta y selección) se reinicia solo en cada apertura.
 */
const PaletteBody = ({ onClose }: { onClose: () => void }) => {
  const bundle = useSrdStore((s) => s.bundle);
  const openById = useSrdStore((s) => s.openById);
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  const items = useMemo(() => indexBundle(bundle), [bundle]);
  const results = useMemo(() => searchSrd(items, q), [items, q]);

  const select = useCallback(
    (category: SrdCategoryId, id: string) => {
      const ok = openById(category, id);
      if (ok) {
        onClose();
        navigate('/reference');
      }
    },
    [openById, onClose, navigate]
  );

  // Navegación por teclado dentro de la paleta
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const hit = results[Math.max(0, active)];
        if (hit) select(hit.item.category, hit.item.id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [results, active, select, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda en el SRD"
        className="w-full max-w-xl overflow-hidden rounded-dnd-lg border border-dnd-gold/40 bg-gradient-to-b from-dnd-dark to-[#12121f] shadow-2xl"
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Campo de búsqueda */}
        <div className="flex items-center gap-2 border-b border-dnd-leather/40 px-4">
          <Search size={18} className="shrink-0 text-dnd-gold" aria-hidden="true" />
          <input
            ref={(el) => el?.focus()}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder="Busca cualquier regla, estado, conjuro o monstruo…"
            className="w-full bg-transparent py-4 font-body text-sm text-dnd-text placeholder-dnd-muted focus:outline-none"
            aria-label="Término de búsqueda"
          />
          <kbd className="hidden shrink-0 rounded border border-dnd-leather/50 px-1.5 py-0.5 text-[10px] text-dnd-muted sm:inline">
            ESC
          </kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-dnd-muted">
              {q ? `Sin resultados para "${q}"` : 'Empieza a escribir para buscar…'}
            </p>
          ) : (
            <ul role="listbox">
              {results.map(({ item, score }, index) => (
                <li key={`${item.category}-${item.id}`}>
                  <button
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => select(item.category, item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                      index === active ? 'bg-dnd-leather/30' : ''
                    }`}
                  >
                    <span className="mr-auto block min-w-0">
                      <span className="block truncate text-sm font-bold text-dnd-text">{item.title}</span>
                      <span className="block truncate text-[11px] text-dnd-muted">
                        {SRD_CATEGORIES[item.category].label}
                      </span>
                    </span>
                    <span
                      className="rounded bg-dnd-ink/70 px-1.5 py-0.5 text-[10px] font-bold text-dnd-gold"
                      title={`Relevancia ${score}`}
                    >
                      {score}
                    </span>
                    <SrdSourceBadge source={item.source} />
                    {index === active && (
                      <CornerDownLeft size={14} className="shrink-0 text-dnd-muted" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-dnd-leather/40 px-4 py-2 text-[10px] text-dnd-muted">
          <span>↑↓ navegar · Enter abrir · Esc cerrar</span>
          <X size={12} aria-hidden="true" className="md:hidden" />
        </div>
      </motion.div>
    </motion.div>
  );
};