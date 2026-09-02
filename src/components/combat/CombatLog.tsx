// ============================================================
// Registro del combate (combat log)
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Download, ScrollText, Trash2 } from 'lucide-react';
import type { CombatLogEntry } from '../../types';
import { useCombatStore } from '../../store/combatStore';

const typeIcons: Record<CombatLogEntry['type'], string> = {
  initiative: '📋',
  damage: '⚔️',
  heal: '💚',
  status: '🪄',
  death: '☠️',
  custom: '📝',
  xp: '⭐',
  move: '🚶',
  chat: '🗣',
};

const typeColor: Record<CombatLogEntry['type'], string> = {
  initiative: 'text-dnd-gold',
  damage: 'text-red-300',
  heal: 'text-emerald-300',
  status: 'text-purple-300',
  death: 'text-red-400',
  custom: 'text-sky-300',
  xp: 'text-yellow-300',
  move: 'text-cyan-300',
  chat: 'text-dnd-muted',
};

/**
 * Registro cronológico de eventos del combate.
 * `defaultExpanded` fuerza la lista abierta desde el inicio (usado en Registro y Notas).
 */
export const CombatLog = ({ defaultExpanded = false }: { defaultExpanded?: boolean }) => {
  const combatLog = useCombatStore((s) => s.combatLog);
  const [showLog, setShowLog] = useState(defaultExpanded);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll dentro del propio log: bajamos al fondo siempre que llegue
  // una entrada nueva para ver el resultado de la última acción.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [combatLog.length]);

  // Limpiar solo el log sin tocar el resto del combate
  const clearLog = () => {
    useCombatStore.setState({ combatLog: [] });
  };

  // Descarga el registro en JSON legible para un relato posterior (p. ej. IA).
  const downloadJson = () => {
    const payload = {
      exportadoEn: new Date().toISOString(),
      totalEventos: combatLog.length,
      eventos: combatLog.map((entry) => ({
        id: entry.id,
        tipo: entry.type,
        tipoHumano: typeIcons[entry.type],
        fecha: new Date(entry.timestamp).toISOString(),
        fechaLocal: new Date(entry.timestamp).toLocaleString('es-ES'),
        texto: entry.message,
        ...(entry.details ? { detalles: entry.details } : {}),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `registro-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className={`card flex min-h-0 flex-col ${defaultExpanded ? 'h-full min-h-0 flex-1' : ''}`}
      aria-label="Registro del combate"
    >
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-fantasy text-lg font-bold text-dnd-gold">
          <ScrollText size={18} className="shrink-0" aria-hidden="true" />
          <span className="whitespace-nowrap">
            Registro
            <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-dnd-leather/40 px-2 py-0.5 text-[10px] leading-none text-dnd-text">
              {combatLog.length}
            </span>
          </span>
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={downloadJson}
            aria-label="Descargar registro en JSON"
            title="Descargar registro en JSON (para relato posterior)"
            className="rounded-lg p-1.5 text-dnd-muted transition-colors hover:bg-dnd-leather/30 hover:text-dnd-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold"
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => setShowLog((s) => !s)}
            aria-expanded={showLog}
            aria-controls="combat-log-list"
            className="whitespace-nowrap rounded-lg px-3 py-1 text-xs font-bold leading-none text-dnd-muted transition-colors hover:bg-dnd-leather/30 hover:text-dnd-text focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold"
          >
            {showLog ? 'Ocultar' : 'Mostrar'}
          </button>
          <button
            onClick={clearLog}
            aria-label="Vaciar registro"
            className="rounded-lg p-1.5 text-dnd-muted transition-colors hover:bg-dnd-blood/30 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {showLog && (
        <div
          id="combat-log-list"
          ref={listRef}
          className="min-h-0 flex-1 space-y-1 overflow-y-auto rounded-lg bg-dnd-ink/40 p-3 font-body text-xs"
        >
          {combatLog.length === 0 && (
            <p className="text-center text-dnd-muted">Sin eventos todavía.</p>
          )}
          {combatLog.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-2 border-b border-dnd-leather/20 py-1"
            >
              <span aria-hidden="true">{typeIcons[entry.type]}</span>
              <div>
                <p className={`${typeColor[entry.type]}`}>{entry.message}</p>
                <time className="text-[10px] text-dnd-muted">
                  {new Date(entry.timestamp).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};