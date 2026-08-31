// ============================================================
// Gestor de monstruos: pantalla de biblioteca + modales
// ============================================================

import { useState } from 'react';
import { useMonsterStore } from '../../store/monsterStore';
import type { Monster } from '../../types';
import { MonsterLibrary } from './MonsterLibrary';
import { MonsterForm } from './MonsterForm';
import { MonsterDetailModal } from './MonsterDetailModal';

/**
 * Pantalla principal de monstruos de la aplicación.
 */
export const MonsterManager = () => {
  const monsters = useMonsterStore((s) => s.monsters);
  const [detailTarget, setDetailTarget] = useState<Monster | null>(null);
  const [formTarget, setFormTarget] = useState<Monster | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h2 className="page-title">Biblioteca de monstruos</h2>
        <p className="text-sm text-dnd-muted">
          Gestiona criaturas del SRD y crea las tuyas propias. Cambios guardados localmente.
        </p>
      </div>

      <MonsterLibrary
        monsters={monsters}
        onSelect={setDetailTarget}
        onNew={() => {
          setFormTarget(null);
          setFormOpen(true);
        }}
      />

      {/* Modales */}
      <MonsterDetailModal
        monster={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={(m) => {
          setDetailTarget(null);
          setFormTarget(m);
          setFormOpen(true);
        }}
      />
      {formOpen && (
        <MonsterForm
          monster={formTarget}
          onClose={() => {
            setFormOpen(false);
            setFormTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default MonsterManager;
