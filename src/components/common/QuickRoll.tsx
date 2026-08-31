// ============================================================
// Lanzador rápido de dados: botón flotante fijo (abajo a la derecha)
// con opciones d4, d6, d8, d12, d20 y d100.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dices, X } from 'lucide-react';
import { useDice } from '../../hooks/useDice';

const DICE_OPTIONS = [4, 6, 8, 12, 20, 100] as const;

/**
 * Botón circular flotante de dados. Se abre/cierra con el propio botón,
 * tocando fuera del menú o con Escape, y muestra la última tirada sobre
 * el botón durante un instante.
 */
export const QuickRoll = () => {
  const { roll } = useDice();
  const [open, setOpen] = useState(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const flashTimer = useRef<number | null>(null);

  // Cerrar con Escape desde cualquier sitio
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const handleRoll = (sides: number) => {
    const res = roll(`d${sides}`);
    setLastResult(res.result);
    setOpen(false);
    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setLastResult(null), 1800);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
        {open && (
          <motion.div
            key="menu"
            role="dialog"
            aria-label="Lanzamiento rápido de dados"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="fixed bottom-20 right-4 left-4 z-40 max-w-xs rounded-dnd-lg border border-dnd-gold/40 bg-dnd-dark p-3 shadow-dnd-card sm:left-auto sm:w-64"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-dnd-gold">
                Lanzamiento rápido
              </p>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar lanzamiento rápido"
                className="icon-btn"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DICE_OPTIONS.map((sides) => (
                <button
                  key={sides}
                  onClick={() => handleRoll(sides)}
                  className="flex items-center justify-center rounded-lg border border-dnd-leather/50 bg-dnd-ink/60 py-2.5 font-fantasy text-sm font-bold text-dnd-text transition-colors hover:border-dnd-gold/60 hover:bg-dnd-gold/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold"
                >
                  D{sides}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante circular */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Lanzamiento rápido de dados"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dnd-gold/70 bg-dnd-gold text-dnd-ink shadow-dnd-card transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold sm:right-5"
      >
        {lastResult !== null ? (
          <span className="font-fantasy text-lg font-bold">{lastResult}</span>
        ) : (
          <Dices size={26} aria-hidden="true" />
        )}
      </button>
    </>
  );
};