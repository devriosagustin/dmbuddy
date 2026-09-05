// ============================================================
// Diagrama de conexiones entre mapas: genera una imagen descargable con
// la disposición de los mapas guardados que conectan por portales con el
// mapa elegido, ubicando cada mapa vecino según el borde donde está el
// portal que lo conecta (derecha → a la derecha, abajo → abajo, etc.).
// Cada mapa se dibuja como una miniatura de su cuadrícula real (muros y
// el resto de los tiles, con los mismos colores que el editor) en vez de
// solo un recuadro con el nombre, para poder reconocer el layout de un
// vistazo.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImageDown } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { MapLayout } from '../../utils/layoutPatterns';
import { restoreTilesFromLayout } from '../../utils/layoutPatterns';
import { buildMapDiagram } from '../../utils/mapConnections';
import type { MapTile, TileType } from '../../types';

interface MapConnectionsModalProps {
  /** Mapa de partida; null = modal cerrado. */
  startLayoutId: string | null;
  layouts: MapLayout[];
  mapCols: number;
  mapRows: number;
  onClose: () => void;
}

// Tamaño máximo de la miniatura de cuadrícula dentro de cada caja: el
// tamaño de celda real sale de encajar mapCols×mapRows ahí adentro (mismo
// criterio de "la cuadrícula más grande con celdas cuadradas que entra en
// el área" que usa el mapa en vivo), así que con mapas muy grandes las
// celdas se ven chicas pero el layout se sigue reconociendo.
const MAX_MAP_W = 220;
const MAX_MAP_H = 130;
const MAP_PAD = 8;
const LABEL_H = 24;
const GAP = 60;
const OUTER_PADDING = 30;
const TITLE_H = 50;

/** Mismos colores que tileVisual() en MapLibraryPage.tsx, para que la miniatura se vea igual que el editor. */
const TILE_FILL: Record<TileType, string> = {
  wall: '#2c1810',
  secretDoor: '#2c1810',
  door: '#452a0a',
  trap: 'rgba(153, 27, 27, 0.65)',
  treasure: 'rgba(202, 138, 4, 0.75)',
  investigation: 'rgba(37, 99, 235, 0.7)',
  portal: 'rgba(126, 34, 206, 0.75)',
};
const FLOOR_FILL = 'rgba(139, 69, 19, 0.12)';
const OPEN_DOOR_FILL = 'rgba(4, 120, 87, 0.5)';

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

/** Dibuja la miniatura de la cuadrícula de un mapa (muros y demás tiles) dentro del rectángulo (x,y,w,h). */
const drawMiniMap = (
  ctx: CanvasRenderingContext2D,
  tiles: MapTile[],
  x: number,
  y: number,
  cellSize: number,
  cols: number,
  rows: number
) => {
  ctx.fillStyle = FLOOR_FILL;
  ctx.fillRect(x, y, cellSize * cols, cellSize * rows);

  for (const tile of tiles) {
    const fill = tile.type === 'door' && tile.open ? OPEN_DOOR_FILL : TILE_FILL[tile.type];
    if (!fill) continue;
    ctx.fillStyle = fill;
    ctx.fillRect(x + tile.x * cellSize, y + tile.y * cellSize, cellSize, cellSize);
  }

  ctx.strokeStyle = 'rgba(218, 165, 32, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, cellSize * cols - 1, cellSize * rows - 1);
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

    const layoutById = new Map(layouts.map((l) => [l.id, l]));
    const cellSize = Math.max(1, Math.floor(Math.min(MAX_MAP_W / mapCols, MAX_MAP_H / mapRows)));
    const mapW = cellSize * mapCols;
    const mapH = cellSize * mapRows;
    const boxW = mapW + MAP_PAD * 2;
    const boxH = mapH + MAP_PAD * 2 + LABEL_H;

    const cols = diagram.nodes.map((n) => n.col);
    const rows = diagram.nodes.map((n) => n.row);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);

    const width = (maxCol - minCol + 1) * (boxW + GAP) - GAP + OUTER_PADDING * 2;
    const height = (maxRow - minRow + 1) * (boxH + GAP) - GAP + OUTER_PADDING * 2 + TITLE_H;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const boxTopLeft = (col: number, row: number) => ({
      x: OUTER_PADDING + (col - minCol) * (boxW + GAP),
      y: TITLE_H + OUTER_PADDING + (row - minRow) * (boxH + GAP),
    });
    const center = (col: number, row: number) => {
      const p = boxTopLeft(col, row);
      return { x: p.x + boxW / 2, y: p.y + boxH / 2 };
    };

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

    // Caja de cada mapa: fondo + miniatura de su cuadrícula + nombre,
    // resaltando el elegido como punto de partida.
    diagram.nodes.forEach((node) => {
      const { x, y } = boxTopLeft(node.col, node.row);
      const isStart = node.id === startLayoutId;
      const radius = 10;

      ctx.fillStyle = isStart ? '#3a2a12' : '#241a14';
      ctx.strokeStyle = isStart ? '#e8c766' : '#8a6d3b';
      ctx.lineWidth = isStart ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + boxW, y, x + boxW, y + boxH, radius);
      ctx.arcTo(x + boxW, y + boxH, x, y + boxH, radius);
      ctx.arcTo(x, y + boxH, x, y, radius);
      ctx.arcTo(x, y, x + boxW, y, radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const layout = layoutById.get(node.id);
      if (layout) {
        drawMiniMap(ctx, restoreTilesFromLayout(layout), x + MAP_PAD, y + MAP_PAD, cellSize, mapCols, mapRows);
      }

      ctx.fillStyle = '#f1e6d0';
      ctx.font = 'bold 13px Georgia, serif';
      ctx.textAlign = 'center';
      wrapCenteredText(ctx, node.name, x + boxW / 2, y + MAP_PAD + mapH + LABEL_H / 2 + 2, boxW - 16, 15);
    });

    setPngUrl(canvas.toDataURL('image/png'));
  }, [diagram, startLayoutId, layouts, mapCols, mapRows]);

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
      subtitle="Disposición de los mapas conectados por portal al mapa elegido, con su layout real"
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
