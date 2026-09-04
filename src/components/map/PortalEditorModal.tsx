// ============================================================
// Editor de un portal de mapa: elige a qué layout guardado conecta
// la casilla y en qué punto del mapa destino aparece el party al
// cruzar. Permite armar mazmorras complejas encadenando mapas en
// vez de un único mapa gigante.
//
// Componente presentacional (no lee/escribe ningún store directamente):
// lo usan tanto el mapa en vivo (MapExplorer.tsx, contra combatStore) como
// la biblioteca de mapas (MapLibraryPage.tsx, contra el layout en edición).
// ============================================================

import { useEffect, useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { MapTile } from '../../types';

export interface PortalUpdate {
  targetLayoutId: string;
  targetX: number;
  targetY: number;
  label?: string;
}

interface PortalEditorModalProps {
  cell: { x: number; y: number } | null;
  /** Tile actual en esa celda (para precargar el formulario si ya estaba configurado). */
  tile: MapTile | undefined;
  /** Mapas guardados entre los que se puede elegir como destino. */
  layoutOptions: { id: string; name: string }[];
  mapCols: number;
  mapRows: number;
  onSave: (updates: PortalUpdate) => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * Editor de un tile de portal. La celda ya tiene el tile colocado (quien lo
 * abre lo crea antes, en blanco, si no existía); acá solo se elige/edita a
 * qué mapa guardado conecta y dónde llega el party.
 */
export const PortalEditorModal = ({
  cell,
  tile,
  layoutOptions,
  mapCols,
  mapRows,
  onSave,
  onDelete,
  onClose,
}: PortalEditorModalProps) => {
  const [targetLayoutId, setTargetLayoutId] = useState('');
  const [targetX, setTargetX] = useState(0);
  const [targetY, setTargetY] = useState(0);
  const [label, setLabel] = useState('');

  // Al abrir el editor para una celda (nueva o existente), precarga su
  // configuración actual. No depende de `tile` para no resetear el
  // formulario mientras el usuario está editando la misma celda.
  useEffect(() => {
    if (!cell) return;
    setTargetLayoutId(tile?.targetLayoutId ?? '');
    setTargetX(tile?.targetX ?? Math.floor(mapCols / 2));
    setTargetY(tile?.targetY ?? Math.floor(mapRows / 2));
    setLabel(tile?.label ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell?.x, cell?.y]);

  if (!cell) return null;

  const handleSave = () => {
    if (!targetLayoutId) {
      alert('Elegí a qué mapa guardado conecta este portal.');
      return;
    }
    onSave({
      targetLayoutId,
      targetX: Math.max(0, Math.min(mapCols - 1, targetX)),
      targetY: Math.max(0, Math.min(mapRows - 1, targetY)),
      label: label.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const input = 'input text-sm';

  return (
    <Modal
      open
      onClose={onClose}
      title="Portal a otro mapa"
      subtitle={`Casilla (${cell.x},${cell.y}) — al pisarla, todo el party cruza directamente al mapa elegido`}
      maxWidth="md"
    >
      <div className="space-y-5">
        <section className="section-box">
          <h3 className="mb-2 section-title">Identificación</h3>
          <label htmlFor="portal-label" className="label">Nombre (opcional)</label>
          <input
            id="portal-label"
            className={input}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="P. ej. Escalera al sótano"
          />
        </section>

        <section className="section-box">
          <h3 className="mb-2 section-title">Mapa destino</h3>
          {layoutOptions.length === 0 ? (
            <p className="text-xs text-dnd-muted">
              Todavía no guardaste ningún layout de mapa. Guardá uno primero desde la biblioteca de mapas
              para poder conectar este portal.
            </p>
          ) : (
            <>
              <label htmlFor="portal-target" className="label">Conecta con *</label>
              <select
                id="portal-target"
                className={input}
                value={targetLayoutId}
                onChange={(e) => setTargetLayoutId(e.target.value)}
              >
                <option value="">— Elegir mapa guardado —</option>
                {layoutOptions.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </section>

        <section className="section-box">
          <h3 className="mb-2 section-title">Punto de llegada en el mapa destino</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="portal-x" className="label">Columna (X)</label>
              <input
                id="portal-x"
                type="number"
                min="0"
                max={mapCols - 1}
                className={input}
                value={targetX}
                onChange={(e) => setTargetX(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="portal-y" className="label">Fila (Y)</label>
              <input
                id="portal-y"
                type="number"
                min="0"
                max={mapRows - 1}
                className={input}
                value={targetY}
                onChange={(e) => setTargetY(Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        {tile?.targetLayoutId ? (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-900/40"
          >
            <Trash2 size={13} className="mr-1.5 inline-block" /> Eliminar este portal
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full rounded-lg border border-dnd-leather/40 px-3 py-2 text-xs font-bold text-dnd-muted transition-colors hover:border-dnd-leather/70 hover:text-dnd-text"
          >
            <Trash2 size={13} className="mr-1.5 inline-block" /> Cancelar y no colocar el portal
          </button>
        )}

        <div className="form-actions">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PortalEditorModal;
