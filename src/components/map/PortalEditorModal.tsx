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
import { ExternalLink, Save, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { MAP_COLS, MAP_ROWS } from '../../utils/mapUtils';
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
  /**
   * Mapas guardados entre los que se puede elegir como destino, cada uno
   * con su propio tamaño (cols/rows): el punto de llegada se valida y se
   * acota contra el tamaño del mapa DESTINO elegido, no contra el del mapa
   * donde está este portal — pueden ser mapas de tamaños distintos.
   */
  layoutOptions: { id: string; name: string; cols: number; rows: number }[];
  onSave: (updates: PortalUpdate) => void;
  onDelete: () => void;
  onClose: () => void;
  /**
   * Ir al mapa destino dentro de la biblioteca de mapas (opcional: el mapa
   * en vivo lo usa para navegar hasta /mapas con ese layout seleccionado;
   * la propia biblioteca lo usa para cambiar de selección sin navegar).
   */
  onGoToLayout?: (layoutId: string) => void;
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
  onSave,
  onDelete,
  onClose,
  onGoToLayout,
}: PortalEditorModalProps) => {
  const [targetLayoutId, setTargetLayoutId] = useState('');
  const [targetX, setTargetX] = useState(0);
  const [targetY, setTargetY] = useState(0);
  const [label, setLabel] = useState('');

  // Tamaño del mapa DESTINO elegido (no del mapa donde vive este portal):
  // el punto de llegada se ubica y se acota contra la cuadrícula a la que
  // en verdad se está apuntando. Sin un destino elegido todavía, usa el
  // tamaño por defecto solo como referencia visual (el botón Guardar exige
  // elegir un destino de todos modos).
  const targetDims = layoutOptions.find((o) => o.id === targetLayoutId);
  const targetCols = targetDims?.cols ?? MAP_COLS;
  const targetRows = targetDims?.rows ?? MAP_ROWS;

  // Al abrir el editor para una celda (nueva o existente), precarga su
  // configuración actual. No depende de `tile` para no resetear el
  // formulario mientras el usuario está editando la misma celda.
  useEffect(() => {
    if (!cell) return;
    const initialTargetId = tile?.targetLayoutId ?? '';
    const initialDims = layoutOptions.find((o) => o.id === initialTargetId);
    setTargetLayoutId(initialTargetId);
    setTargetX(tile?.targetX ?? Math.floor((initialDims?.cols ?? MAP_COLS) / 2));
    setTargetY(tile?.targetY ?? Math.floor((initialDims?.rows ?? MAP_ROWS) / 2));
    setLabel(tile?.label ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cell?.x, cell?.y]);

  if (!cell) return null;

  // Al cambiar de mapa destino, acota el punto de llegada ya elegido a la
  // cuadrícula del mapa nuevo (que puede ser de otro tamaño) en vez de
  // dejarlo apuntando a una celda que ni siquiera existe ahí.
  const handleTargetLayoutChange = (id: string) => {
    setTargetLayoutId(id);
    const dims = layoutOptions.find((o) => o.id === id);
    if (!dims) return;
    setTargetX((x) => Math.min(x, dims.cols - 1));
    setTargetY((y) => Math.min(y, dims.rows - 1));
  };

  // Devuelve false (y avisa) si falta elegir mapa destino; si no, guarda y
  // devuelve true. Usado tanto por "Guardar" como por "Ir al mapa" (que
  // primero confirma los cambios pendientes antes de navegar).
  const commitPortal = (): boolean => {
    if (!targetLayoutId) {
      alert('Elegí a qué mapa guardado conecta este portal.');
      return false;
    }
    onSave({
      targetLayoutId,
      targetX: Math.max(0, Math.min(targetCols - 1, targetX)),
      targetY: Math.max(0, Math.min(targetRows - 1, targetY)),
      label: label.trim() || undefined,
    });
    return true;
  };

  const handleSave = () => {
    if (commitPortal()) onClose();
  };

  const handleGoToLayout = () => {
    if (!onGoToLayout) return;
    if (commitPortal()) {
      onGoToLayout(targetLayoutId);
      onClose();
    }
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
                onChange={(e) => handleTargetLayoutChange(e.target.value)}
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
                max={targetCols - 1}
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
                max={targetRows - 1}
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
          {onGoToLayout && targetLayoutId && (
            <Button variant="secondary" onClick={handleGoToLayout} icon={<ExternalLink size={16} />}>
              Ir al mapa
            </Button>
          )}
          <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PortalEditorModal;
