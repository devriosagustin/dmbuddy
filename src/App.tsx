// ============================================================
// App: rutas y estructura principal de DM Copilot Web
// ============================================================

import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { useSessionStore } from './store/sessionStore';
import { PlayerCombatView } from './components/combat/PlayerCombatView';

// Carga diferida (code splitting) para que cada sección se descargue solo cuando se visita
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const CombatTracker = lazy(() => import('./components/combat/CombatTracker'));
const MonsterManager = lazy(() => import('./components/monsters/MonsterManager'));
const ReferenceLibrary = lazy(() => import('./components/reference/ReferenceLibrary'));
const PartyManager = lazy(() => import('./components/players/PartyManager'));
const NpcManager = lazy(() => import('./components/npcs/NpcManager'));
const DiceRoller = lazy(() => import('./components/dice/DiceRoller'));
const NotesManager = lazy(() => import('./components/notes/NotesManager'));

/**
 * Cargador que se muestra mientras se descarga cada sección.
 */
const PageLoader = () => (
  <div className="flex min-h-40 items-center justify-center text-dnd-gold" role="status" aria-label="Cargando sección">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-dnd-gold border-t-transparent" />
  </div>
);

/** Enruta /combat según el rol: el jugador ve el mapa read-only en vivo. */
const CombatRoute = () => {
  const role = useSessionStore((s) => s.role);
  return (
    <Suspense fallback={<PageLoader />}>
      {role === 'player' ? <PlayerCombatView /> : <CombatTracker />}
    </Suspense>
  );
};

/** Protege rutas de DM: los jugadores son redirigidos a su vista de combate. */
const DmOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const role = useSessionStore((s) => s.role);
  return role === 'player' ? <Navigate to="/combat" replace /> : <>{children}</>;
};

/**
 * Aplicación principal con enrutado de las seis secciones.
 * Se usa HashRouter para que funcione en cualquier hosting estático
 * sin configuración extra del servidor.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<PageLoader />}>
                <DmOnlyRoute>
                  <Dashboard />
                </DmOnlyRoute>
              </Suspense>
            }
          />
          <Route
            path="/combat"
            element={<CombatRoute />}
          />
          <Route
            path="/monsters"
            element={
              <Suspense fallback={<PageLoader />}>
                <DmOnlyRoute>
                  <MonsterManager />
                </DmOnlyRoute>
              </Suspense>
            }
          />
          <Route
            path="/party"
            element={
              <Suspense fallback={<PageLoader />}>
                <PartyManager />
              </Suspense>
            }
          />
          <Route
            path="/npcs"
            element={
              <Suspense fallback={<PageLoader />}>
                <DmOnlyRoute>
                  <NpcManager />
                </DmOnlyRoute>
              </Suspense>
            }
          />
          <Route
            path="/reference"
            element={
              <Suspense fallback={<PageLoader />}>
                <DmOnlyRoute>
                  <ReferenceLibrary />
                </DmOnlyRoute>
              </Suspense>
            }
          />
          <Route
            path="/dice"
            element={
              <Suspense fallback={<PageLoader />}>
                <DmOnlyRoute>
                  <DiceRoller />
                </DmOnlyRoute>
              </Suspense>
            }
          />
          <Route
            path="/notes"
            element={
              <Suspense fallback={<PageLoader />}>
                <DmOnlyRoute>
                  <NotesManager />
                </DmOnlyRoute>
              </Suspense>
            }
          />
          <Route path="*" element={<DmOnlyRoute><Dashboard /></DmOnlyRoute>} />
        </Route>
      </Routes>
    </HashRouter>
  );
}