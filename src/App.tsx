// ============================================================
// App: rutas y estructura principal de DM Copilot Web
// ============================================================

import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';

// Carga diferida (code splitting) para que cada sección se descargue solo cuando se visita
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const CombatTracker = lazy(() => import('./components/combat/CombatTracker'));
const MonsterManager = lazy(() => import('./components/monsters/MonsterManager'));
const ReferenceLibrary = lazy(() => import('./components/reference/ReferenceLibrary'));
const PartyManager = lazy(() => import('./components/players/PartyManager'));
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
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/combat"
            element={
              <Suspense fallback={<PageLoader />}>
                <CombatTracker />
              </Suspense>
            }
          />
          <Route
            path="/monsters"
            element={
              <Suspense fallback={<PageLoader />}>
                <MonsterManager />
              </Suspense>
            }
          />
          <Route
            path="/reference"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReferenceLibrary />
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
            path="/dice"
            element={
              <Suspense fallback={<PageLoader />}>
                <DiceRoller />
              </Suspense>
            }
          />
          <Route
            path="/notes"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotesManager />
              </Suspense>
            }
          />
          <Route path="*" element={<Dashboard />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}