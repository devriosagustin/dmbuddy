// ============================================================
// Gestor de monstruos: biblioteca + ficha de detalle en vista
// ============================================================

import { useState } from 'react';
import { useMonsterStore } from '../../store/monsterStore';
import type { Monster } from '../../types';
import { MonsterLibrary } from './MonsterLibrary';
import { MonsterSheet } from './MonsterSheet';

type MonsterView =
  | { type: 'list' }
  | { type: 'detail'; monster: Monster | null; mode: 'view' | 'edit' };

/**
 * Pantalla principal de monstruos de la aplicación.
 */
export const MonsterManager = () => {
  const monsters = useMonsterStore((s) => s.monsters);
  const [view, setView] = useState<MonsterView>({ type: 'list' });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {view.type === 'list' ? (
        <>
          <div>
            <h2 className="page-title">Biblioteca de monstruos</h2>
            <p className="text-sm text-dnd-muted">
              Tu biblioteca arranca vacía: importa desde la Biblioteca SRD 5.2 los monstruos que vayas a usar o crea los tuyos
              propios con «Nuevo monstruo».
            </p>
          </div>
          <MonsterLibrary
            monsters={monsters}
            onSelect={(m) => setView({ type: 'detail', monster: m, mode: 'view' })}
            onNew={() => setView({ type: 'detail', monster: null, mode: 'edit' })}
            onDelete={(m) => useMonsterStore.getState().removeMonster(m.id)}
          />
        </>
      ) : (
        <MonsterSheet
          monster={view.monster}
          initialMode={view.mode}
          onBack={() => setView({ type: 'list' })}
        />
      )}
    </div>
  );
};

export default MonsterManager;