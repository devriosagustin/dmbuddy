// ============================================================
// Layout principal: sidebar + header + contenido + footer
// ============================================================

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { QuickRoll } from './QuickRoll';
import { SearchPalette } from '../reference/SearchPalette';
import { AttributionFooter } from '../reference/AttributionFooter';
import { useUIStore } from '../../store/uiStore';
import { useSrdStore } from '../../state/srdStore';
import { fetchSrdOverlays } from '../../services/srdService';

/**
 * Estructura general de la aplicación.
 */
export const Layout = () => {
  const { sidebarOpen, toggleSidebar, setIsMobile } = useUIStore();
  const setPaletteOpen = useSrdStore((s) => s.setPaletteOpen);
  const navigate = useNavigate();

  // Detectar dispositivos móviles
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsMobile]);

  // Cargar overlays remotos del SRD (opcional, no bloquea la app)
  useEffect(() => {
    let cancelled = false;
    fetchSrdOverlays().then((bundle) => {
      if (!cancelled && bundle) useSrdStore.getState().applyOverlay(bundle);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-dnd-dark via-dnd-deep to-dnd-dark text-dnd-text">
      {/* Sidebar (oculto en móvil si está colapsado) */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Sidebar móvil como overlay */}
      <div
        className={`fixed inset-y-0 left-0 z-40 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300`}
        aria-hidden={!sidebarOpen}
      >
        <Sidebar />
      </div>
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
          aria-label="Cerrar menú"
        />
      )}

      {/* Área principal */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="z-10 flex items-center justify-between gap-3 border-b border-dnd-leather/50 bg-dnd-dark/80 px-3 py-3 backdrop-blur sm:px-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={toggleSidebar}
              aria-label="Abrir menú"
              className="icon-btn shrink-0"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => navigate('/')}
              className="shrink-0 truncate font-fantasy text-base font-bold text-dnd-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold rounded sm:text-lg"
            >
              DMBuddy
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Buscar en el SRD (Ctrl K)"
              className="flex shrink-0 items-center gap-2 rounded-lg border border-dnd-leather/50 px-2.5 py-1.5 text-xs text-dnd-muted transition-colors hover:border-dnd-gold/60 hover:text-dnd-text focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold sm:px-3"
            >
              <Search size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Buscar en el SRD</span>
              <kbd className="hidden rounded border border-dnd-leather/50 px-1 text-[10px] md:inline">Ctrl K</kbd>
            </button>
            <QuickRoll />
          </div>
        </header>

        {/* Contenido enrutado */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <Outlet />
        </div>

        {/* Footer */}
        <footer className="border-t border-dnd-leather/50 bg-dnd-dark/70 px-4 py-2 text-center text-[11px] text-dnd-muted">
          <AttributionFooter />
        </footer>
      </main>

      {/* Paleta de búsqueda global (Ctrl+K) */}
      <SearchPalette />
    </div>
  );
};

export type { ReactNode };