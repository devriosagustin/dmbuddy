// ============================================================
// Gestor de monstruos: biblioteca + ficha de detalle en vista
// ============================================================

import { useState } from 'react';
import { useMonsterStore } from '../../store/monsterStore';
import type { Monster } from '../../types';
import { MonsterLibrary } from './MonsterLibrary';
import { MonsterSheet } from './MonsterSheet';
import { MonsterForm } from './MonsterForm';

type MonsterView =
  | { type: 'list' }
  | { type: 'detail'; monster: Monster }
  | { type: 'create' };

/**
 * Pantalla principal de monstruos de la aplicación.
 */
export const MonsterManager = () => {
  const monsters = useMonsterStore((s) => s.monsters);
  const removeMonster = useMonsterStore((s) => s.removeMonster);
  const [view, setView] = useState<MonsterView>({ type: 'list' });

  const handleDelete = (monster: Monster) => {
    removeMonster(monster.id);
    if (view.type === 'detail' && view.monster.id === monster.id) setView({ type: 'list' });
  };

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
            onSelect={(m) => setView({ type: 'detail', monster: m })}
            onNew={() => setView({ type: 'create' })}
            onDelete={handleDelete}
          />
        </>
      ) : view.type === 'create' ? (
        <div className="page">
          <div className="page-header">
            <div>
              <h2 className="page-title">Nuevo monstruo</h2>
              <p className="text-sm text-dnd-muted">Crea un monstruo propio y añádelo a tu biblioteca.</p>
            </div>
          </div>
          <MonsterForm inline monster={null} onClose={() => setView({ type: 'list' })} />
        </div>
      ) : (
        <MonsterSheet
          monster={view.monster}
          initialEditable={false}
          onBack={() => setView({ type: 'list' })}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default MonsterManager;