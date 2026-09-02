// ============================================================
// Hook useFullscreen: pantalla completa con respaldo CSS.
// iOS Safari no soporta requestFullscreen() en elementos
// arbitrarios, así que cuando la API nativa no existe o falla
// activamos un "overlay" fijo que cubre todo el viewport.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';

export interface FullscreenControls {
  /** true si el elemento está agrandado (nativa o overlay CSS). */
  isFullscreen: boolean;
  toggle: () => void;
  /** Ref que debe apuntar al elemento que se quiere agrandar. */
  targetRef: React.RefObject<HTMLDivElement | null>;
  /** Clases a añadir al elemento mientras el respaldo CSS está activo. */
  overlayClass?: string;
}

/**
 * Gestiona la pantalla completa de un elemento del DOM. Bien con la API
 * nativa del navegador, bien con un fallback CSS (position: fixed) para
 * dispositivos y navegadores sin soporte (p. ej. iPhone/iOS Safari).
 */
export const useFullscreen = (): FullscreenControls => {
  const [native, setNative] = useState(false);
  const [cssOverlay, setCssOverlay] = useState(false);
  const targetRef = useRef<HTMLDivElement | null>(null);

  // El estado nativo solo se sincroniza si el navegador soporta la API.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fullscreenEnabled) return;
    const onChange = () => setNative(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const exitCss = useCallback(() => setCssOverlay(false), []);

  const toggle = useCallback(() => {
    if (cssOverlay) {
      exitCss();
      return;
    }
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    const el = targetRef.current;
    if (el && typeof el.requestFullscreen === 'function') {
      try {
        const promise = el.requestFullscreen() as unknown;
        // Si la API no devuelve promesa (Safari antiguo) o la rechaza
        // (permisos), caemos al overlay CSS.
        if (promise && typeof (promise as Promise<void>).catch === 'function') {
          (promise as Promise<void>).catch(() => setCssOverlay(true));
        } else {
          setCssOverlay(true);
        }
      } catch {
        setCssOverlay(true);
      }
      return;
    }
    setCssOverlay(true);
  }, [cssOverlay, exitCss]);

  return {
    isFullscreen: native || cssOverlay,
    toggle,
    targetRef,
    overlayClass: cssOverlay ? 'fixed inset-0 z-50 bg-dnd-deep' : undefined,
  };
};