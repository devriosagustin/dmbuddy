// ============================================================
// Gestor de Party: lista de jugadores + formulario
// ============================================================

import { useState } from 'react';
import { Plus, FileJson, Moon, Sun } from 'lucide-react';
import { Button } from '../common/Button';
import { usePlayerStore } from '../../store/playerStore';
import type { Player } from '../../types';
import { PlayerCard } from './PlayerCard';
import { PlayerForm } from './PlayerForm';

/**
 * Pantalla principal de gestión de jugadores.
 */
export const PartyManager = () => {
  const players = usePlayerStore((s) => s.players);
  const removePlayer = usePlayerStore((s) => s.removePlayer);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const handleShortRest = () => {
    if (players.length === 0) return;
    const { recovered, spellcasters } = usePlayerStore.getState().shortRestParty();
    const detail =
      recovered.length > 0
        ? ` ${recovered.join(', ')} recuperan espacios.`
        : spellcasters > 0
          ? ' Sin espacios que recuperar.'
          : '';
    window.alert(`Descanso corto completado.${detail}`);
  };

  const handleLongRest = () => {
    if (players.length === 0) return;
    const proceed = window.confirm('Descanso largo: restaura todos los PG y todos los espacios de conjuro del party. ¿Continuar?');
    if (!proceed) return;
    const { healed, spellcasters } = usePlayerStore.getState().longRestParty();
    const parts: string[] = [];
    if (healed > 0) parts.push(`${healed} personaje${healed !== 1 ? 's' : ''} recupera(n) todos sus PG`);
    if (spellcasters > 0) parts.push(`${spellcasters} conjuradores recuperan todos sus espacios`);
    window.alert(`Descanso largo completado. ${parts.length > 0 ? parts.join(' · ') : 'El party ya estaba al completo.'}`);
  };

  const handleImportText = () => {
    if (!importText.trim()) return;
    const ok = usePlayerStore.getState().importPlayer(importText);
    if (ok) {
      setImportText('');
      setImportOpen(false);
    }
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(players, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dm_copilot_party.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const averageHp = players.length === 0
    ? 0
    : Math.round(players.reduce((acc, p) => acc + (p.hp / Math.max(1, p.maxHp)), 0) / players.length * 100);

return (
    <div className="page">
      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Party</h2>
          <p className="text-sm text-dnd-muted">
            {players.length} aventureros · Salud media del grupo:{' '}
            <span className="font-bold text-dnd-text">{averageHp}%</span>
          </p>
        </div>
<div className="page-actions">
          <Button
            variant="secondary"
            size="sm"
            icon={<Sun size={15} />}
            onClick={handleShortRest}
            disabled={players.length === 0}
            title="Descanso corto: el Brujo recupera todos sus espacios y el resto recupera 1 espacio del nivel más alto gastado"
          >
            Descanso Corto
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Moon size={15} />}
            onClick={handleLongRest}
            disabled={players.length === 0}
            title="Descanso largo: restaura todos los PG y todos los espacios de conjuro"
          >
            Descanso Largo
          </Button>
          <Button variant="ghost" size="sm" onClick={exportAll} icon={<FileJson size={15} />} disabled={players.length === 0}>
            Exportar party
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setImportOpen((o) => !o)}>
            Importar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Nuevo personaje
          </Button>
        </div>
      </div>

      {/* Importar pegado */}
      {importOpen && (
        <div className="card space-y-2" role="group" aria-label="Importar personajes">
          <label htmlFor="import-json" className="label">Pega el JSON de personajes</label>
          <textarea
            id="import-json"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={4}
            placeholder='[{"name":"Aragon","level":5,...}] o {"name":"...","stats":{...}}'
            className="input font-body text-xs"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setImportOpen(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleImportText} disabled={!importText.trim()}>
              Importar
            </Button>
          </div>
        </div>
      )}

{/* Lista */}
      {players.length === 0 && (
        <div className="empty-state">
          <p className="font-fantasy text-xl text-dnd-muted">No hay aventureros en la party</p>
          <p className="mt-1 text-sm text-dnd-muted">
            Crea tu primer personaje para empezar a seguir sus PG y añadirlos al combate.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onEdit={(p) => {
              setEditing(p);
              setFormOpen(true);
            }}
            onRemove={(id) => removePlayer(id)}
          />
        ))}
      </div>

      {/* Formulario */}
      {formOpen && (
        <PlayerForm
          player={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

export default PartyManager;
