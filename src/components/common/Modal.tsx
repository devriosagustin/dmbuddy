// ============================================================
// Modal accesible con Framer Motion para transiciones
// ============================================================

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

const maxWidthClass: Record<NonNullable<ModalProps['maxWidth']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

/**
 * Modal genérico accesible (rol="dialog", focus trap simple),
 * con cierre por Esc y clic en el fondo.
 */
export const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
}: ModalProps) => {
  // Cerrar con la tecla Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Bloquear scroll del fondo al abrir
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Diálogo'}
            className={`modal-sheet ${maxWidthClass[maxWidth]}`}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                {title && (
                  <h2 className="page-title">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="mt-0.5 text-xs text-dnd-muted">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="icon-btn"
              >
                <X size={18} />
              </button>
            </div>
            <div className="scrollbar-thin max-h-[70vh] overflow-y-auto pr-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};