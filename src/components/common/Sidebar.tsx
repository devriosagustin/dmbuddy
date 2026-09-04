// ============================================================
// Sidebar de navegación colapsable con tema D&D
// ============================================================

import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Swords,
  Skull,
  BookOpen,
  Users,
  UserRound,
  Dices,
  NotebookPen,
  Map as MapIcon,
  Shuffle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useCombatStore } from '../../store/combatStore';
import { useSessionStore } from '../../store/sessionStore';

const navItems = [
  { to: '/map', label: 'Mapa', icon: MapIcon },
  { to: '/combat', label: 'Combate', icon: Swords },
  { to: '/monsters', label: 'Monstruos', icon: Skull },
  { to: '/party', label: 'Party', icon: Users },
  { to: '/npcs', label: 'NPC', icon: UserRound },
  { to: '/reference', label: 'Biblioteca', icon: BookOpen },
  { to: '/dice', label: 'Dados', icon: Dices },
  { to: '/notes', label: 'Registro y Notas', icon: NotebookPen },
  { to: '/generador', label: 'Generador', icon: Shuffle },
];

/** En modo jugador solo se muestra el mapa de combate (lectura) y el Party. */
const playerItems = navItems.filter((item) => item.to === '/combat' || item.to === '/party');

/**
 * Barra lateral de navegación. Colapsable y adaptable a móvil.
 */
export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const combatActive = useCombatStore((s) => s.isActive);
  const sessionRole = useSessionStore((s) => s.role);
  const items = sessionRole === 'player' ? playerItems : navItems;

  return (
    <aside
      className={`relative z-20 flex h-full flex-col border-r border-dnd-leather/50 bg-dnd-dark/95 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
      aria-label="Navegación principal"
    >
      {/* Logo de marca */}
      <div className="flex items-center gap-3 border-b border-dnd-leather/40 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dnd-gold text-dnd-ink shadow-dnd-glow">
          <Skull size={20} />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-hidden"
            >
              <h1 className="font-fantasy text-lg font-bold leading-tight text-dnd-gold">
                DMBuddy
              </h1>
              <p className="text-[10px] text-dnd-muted">Asistente de Dungeon Master</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enlaces de navegación */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-dnd-leather/40 text-dnd-gold'
                  : 'text-dnd-text/70 hover:bg-dnd-leather/20 hover:text-dnd-text'
              }`
            }
          >
            <Icon size={20} className="shrink-0" aria-hidden="true" />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {label}
                  {to === '/combat' && combatActive && sidebarOpen && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500" aria-label="Combate activo" />
                  )}
                </motion.span>
              )}
            </AnimatePresence>
            {!sidebarOpen && to === '/combat' && combatActive && (
              <span className="absolute right-2 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Botón colapsar */}
      <div className="border-t border-dnd-leather/40 p-3">
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Colapsar barra lateral' : 'Expandir barra lateral'}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dnd-leather/50 px-3 py-2 text-dnd-muted transition-colors hover:bg-dnd-leather/20 hover:text-dnd-text focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          {sidebarOpen && <span className="text-xs font-bold">Colapsar</span>}
        </button>
      </div>
    </aside>
  );
};