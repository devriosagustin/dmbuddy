// ============================================================
// Lanzador rápido de dados en el header
// ============================================================

import { useRef } from 'react';
import { Dices } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDice } from '../../hooks/useDice';
import { useUIStore } from '../../store/uiStore';

/**
 * Mini lanzador de dados global (dado + input rápido).
 */
export const QuickRoll = () => {
  const { roll } = useDice();
  const { openModal, closeModal, modal } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpen = modal.type === 'quickRoll';

  const handleRoll = () => {
    const formula = inputRef.current?.value.trim();
    if (!formula) return;
    roll(formula);
    closeModal();
  };

  return (
    <>
      <button
        onClick={() => {
          openModal('quickRoll');
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        aria-label="Lanzamiento rápido de dados"
        className="rounded-lg border border-dnd-gold/50 p-2 text-dnd-gold transition-colors hover:bg-dnd-gold/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold"
      >
        <Dices size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-16 top-3 z-40 rounded-lg border border-dnd-gold/40 bg-dnd-dark p-3 shadow-dnd-card"
            role="dialog"
            aria-label="Lanzamiento rápido"
          >
            <div className="flex items-center gap-2">
              <label htmlFor="quick-roll" className="sr-only">
                Fórmula de dados
              </label>
              <input
                id="quick-roll"
                ref={inputRef}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRoll();
                  if (e.key === 'Escape') closeModal();
                }}
                placeholder="ej. 2d20+5"
                className="input w-40"
                aria-label="Fórmula de dados"
              />
              <button onClick={handleRoll} className="btn-primary px-3 py-2 text-xs">
                Tirar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};