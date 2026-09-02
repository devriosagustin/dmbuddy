// ============================================================
// Layout principal: sidebar + header + contenido + footer
// ============================================================

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Crown, Menu, Search, Users } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { QuickRoll } from './QuickRoll';
import { SearchPalette } from '../reference/SearchPalette';
import { AttributionFooter } from '../reference/AttributionFooter';
import { SessionModal } from '../session/SessionModal';
import { useUIStore } from '../../store/uiStore';
import { useSrdStore } from '../../state/srdStore';
import { useSessionStore } from '../../store/sessionStore';
import { fetchSrdOverlays } from '../../services/srdService';
import { useSessionPublish } from '../../hooks/useSessionPublish';
import { usePlayerPublish } from '../../hooks/usePlayerPublish';

/**
 * Estructura general de la aplicación.
 */
export const Layout = () => {
  const { sidebarOpen, toggleSidebar, setIsMobile } = useUIStore();
  const setPaletteOpen = useSrdStore((s) => s.setPaletteOpen);
  const navigate = useNavigate();
  const [sessionOpen, setSessionOpen] = useState(false);
  const sessionRole = useSessionStore((s) => s.role);
  const sessionStatus = useSessionStore((s) => s.status);

  // Publicación en vivo: el DM sube el combate y los jugadores sus fichas.
  useSessionPublish();
  usePlayerPublish();

  // Si hay una sesión persistida (recarga de página), reintenta conectarse.
  useEffect(() => {
    useSessionStore.getState().restoreSession();
  }, []);

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
    <div className="flex h-dvh overflow-hidden bg-gradient-to-br from-dnd-dark via-dnd-deep to-dnd-dark text-dnd-text">
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
      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
            {/* Sesión multijugador */}
            <button
              onClick={() => setSessionOpen(true)}
              aria-label={sessionRole ? 'Sesión abierta' : 'Abrir sesión multijugador'}
              title={sessionRole ? `Sesión ${sessionRole === 'dm' ? 'DM' : 'Jugador'} — gestionar` : 'Sesión multijugador'}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold ${
                sessionRole
                  ? 'border-dnd-gold/60 bg-dnd-gold/10 text-dnd-gold'
                  : 'border-dnd-leather/50 text-dnd-muted hover:border-dnd-gold/60 hover:text-dnd-text'
              }`}
            >
              {sessionRole === 'dm' ? <Crown size={14} aria-hidden="true" /> : <Users size={14} aria-hidden="true" />}
              <span className="hidden sm:inline">
                {sessionRole === 'dm'
                  ? 'Sesión DM'
                  : sessionRole === 'player'
                    ? 'Sesión'
                    : 'Sesión'}
              </span>
              {sessionRole && sessionStatus === 'connected' && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              )}
            </button>

            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Buscar en el SRD (Ctrl K)"
              className="flex shrink-0 items-center gap-2 rounded-lg border border-dnd-leather/50 px-2.5 py-1.5 text-xs text-dnd-muted transition-colors hover:border-dnd-gold/60 hover:text-dnd-text focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold sm:px-3"
            >
              <Search size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Buscar en el SRD</span>
              <kbd className="hidden rounded border border-dnd-leather/50 px-1 text-[10px] md:inline">Ctrl K</kbd>
            </button>
          </div>
        </header>

        {/* Contenido enrutado */}
        <div className="flex-1 overflow-y-auto overflow-x-clip overscroll-contain p-3 sm:p-4 md:p-6">
          <Outlet />
        </div>

        {/* Footer: margen derecho en móvil para no quedar detrás del botón flotante de dados */}
        <footer className="border-t border-dnd-leather/50 bg-dnd-dark/70 px-4 py-2 text-center text-[11px] text-dnd-muted sm:pr-4 pr-20">
          <AttributionFooter />
        </footer>
      </main>

      {/* Paleta de búsqueda global (Ctrl+K) */}
      <SearchPalette />

      {/* Lanzador rápido de dados (botón flotante) */}
      <QuickRoll />

      {/* Gestión de sesión multijugador */}
      <SessionModal open={sessionOpen} onClose={() => setSessionOpen(false)} />
    </div>
  );
};

export type { ReactNode };