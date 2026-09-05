// ============================================================
// Diagrama de conexiones entre mapas: genera una imagen descargable con
// la disposición de los mapas guardados que conectan por portales con el
// mapa elegido, ubicando cada mapa vecino según el borde donde está el
// portal que lo conecta (derecha → a la derecha, abajo → abajo, etc.).
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageDown } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { MapLayout } from '../../utils/layoutPatterns';
import { buildMapDiagram } from '../../utils/mapConnections';

interface MapConnectionsModalProps {
  /** Mapa de partida; null = modal cerrado. */
  startLayoutId: string | null;
  layouts: MapLayout[];
  mapCols: number;
  mapRows: number;
  onClose: () => void;
}

const BOX_W = 210;
const BOX_H = 120;
const GAP = 70;
const PADDING = 30;
const TITLE_H = 50;

/** Corta `text` en varias líneas que entren en `maxWidth`, centradas en (cx, cy). */
const wrapCenteredText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  maxWidth: number,
  lineHeight: number
) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(attempt).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineHeight));
};

/**
 * Modal con la vista previa del diagrama y un botón para descargarlo como
 * PNG. El cálculo de posiciones vive en utils/mapConnections.ts (puro,
 * testeado aparte); acá solo se dibuja sobre un <canvas>.
 */
export const MapConnectionsModal = ({ startLayoutId, layouts, mapCols, mapRows, onClose }: MapConnectionsModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pngUrl, setPngUrl] = useState<string | null>(null);

  const diagram = useMemo(
    () => (startLayoutId ? buildMapDiagram(startLayoutId, layouts, mapCols, mapRows) : null),
    [startLayoutId, layouts, mapCols, mapRows]
  );

  useEffect(() => {
    if (!diagram || diagram.nodes.length <= 1) {
      setPngUrl(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cols = diagram.nodes.map((n) => n.col);
    const rows = diagram.nodes.map((n) => n.row);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);

    const width = (maxCol - minCol + 1) * (BOX_W + GAP) - GAP + PADDING * 2;
    const height = (maxRow - minRow + 1) * (BOX_H + GAP) - GAP + PADDING * 2 + TITLE_H;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const center = (col: number, row: number) => ({
      x: PADDING + (col - minCol) * (BOX_W + GAP) + BOX_W / 2,
      y: TITLE_H + PADDING + (row - minRow) * (BOX_H + GAP) + BOX_H / 2,
    });

    // Fondo con el mismo tono oscuro de la app.
    ctx.fillStyle = '#181210';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#e8c766';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Mapa de conexiones', width / 2, 32);

    // Líneas de conexión (una por cada par de mapas con un portal entre sí).
    ctx.strokeStyle = '#8a6d3b';
    ctx.lineWidth = 3;
    diagram.edges.forEach((edge) => {
      const a = diagram.nodes.find((n) => n.id === edge.a);
      const b = diagram.nodes.find((n) => n.id === edge.b);
      if (!a || !b) return;
      const ca = center(a.col, a.row);
      const cb = center(b.col, b.row);
      ctx.beginPath();
      ctx.moveTo(ca.x, ca.y);
      ctx.lineTo(cb.x, cb.y);
      ctx.stroke();
      if (edge.label) {
        ctx.fillStyle = '#c9a876';
        ctx.font = '12px Georgia, serif';
        ctx.fillText(edge.label, (ca.x + cb.x) / 2, (ca.y + cb.y) / 2 - 8);
      }
    });

    // Caja de cada mapa, resaltando el elegido como punto de partida.
    diagram.nodes.forEach((node) => {
      const c = center(node.col, node.row);
      const x = c.x - BOX_W / 2;
      const y = c.y - BOX_H / 2;
      const isStart = node.id === startLayoutId;
      const radius = 10;

      ctx.fillStyle = isStart ? '#3a2a12' : '#241a14';
      ctx.strokeStyle = isStart ? '#e8c766' : '#8a6d3b';
      ctx.lineWidth = isStart ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + BOX_W, y, x + BOX_W, y + BOX_H, radius);
      ctx.arcTo(x + BOX_W, y + BOX_H, x, y + BOX_H, radius);
      ctx.arcTo(x, y + BOX_H, x, y, radius);
      ctx.arcTo(x, y, x + BOX_W, y, radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f1e6d0';
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      wrapCenteredText(ctx, node.name, c.x, c.y, BOX_W - 24, 20);
    });

    setPngUrl(canvas.toDataURL('image/png'));
  }, [diagram, startLayoutId]);

  const handleDownload = () => {
    if (!pngUrl) return;
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `dmbuddy-mapa-conexiones-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  return (
    <Modal
      open={!!startLayoutId}
      onClose={onClose}
      title="Diagrama de conexiones"
      subtitle="Disposición de los mapas conectados por portal al mapa elegido"
      maxWidth="4xl"
    >
      <div className="space-y-3">
        {!diagram || diagram.nodes.length <= 1 ? (
          <p className="text-sm text-dnd-muted">
            Este mapa todavía no tiene portales conectados a otros mapas guardados.
          </p>
        ) : (
          <>
            <p className="text-xs text-dnd-muted">{diagram.nodes.length} mapas conectados en este grupo.</p>
            <div className="max-h-[60vh] overflow-auto rounded-lg border border-dnd-leather/40 bg-dnd-ink/40 p-2">
              <canvas ref={canvasRef} className="block" />
            </div>
          </>
        )}
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          <Button variant="primary" icon={<ImageDown size={16} />} onClick={handleDownload} disabled={!pngUrl}>
            Descargar imagen
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MapConnectionsModal;
