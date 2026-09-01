// ============================================================
// Registro del combate (combat log)
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { ScrollText, Trash2 } from 'lucide-react';
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
};

/**
 * Registro cronológico de eventos del combate.
 */
export const CombatLog = () => {
  const combatLog = useCombatStore((s) => s.combatLog);
  const [showLog, setShowLog] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último evento
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [combatLog.length]);

  // Limpiar solo el log sin tocar el resto del combate
  const clearLog = () => {
    useCombatStore.setState({ combatLog: [] });
  };

  return (
    <section className="card flex min-h-0 flex-col" aria-label="Registro del combate">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-fantasy text-lg font-bold text-dnd-gold">
          <ScrollText size={18} aria-hidden="true" />
          <span>
            Registro
            <span className="ml-2 rounded-full bg-dnd-leather/40 px-2 py-0.5 text-[10px] text-dnd-text">
              {combatLog.length}
            </span>
          </span>
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowLog((s) => !s)}
            aria-expanded={showLog}
            aria-controls="combat-log-list"
            className="rounded-lg px-2 py-1 text-xs font-bold text-dnd-muted transition-colors hover:bg-dnd-leather/30 hover:text-dnd-text focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold"
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
          className="max-h-64 min-h-0 flex-1 space-y-1 overflow-y-auto rounded-lg bg-dnd-ink/40 p-3 font-body text-xs"
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
          <div ref={endRef} />
        </div>
      )}
    </section>
  );
};