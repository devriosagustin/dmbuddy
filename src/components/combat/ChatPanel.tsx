// ============================================================
// Panel de chat/lore de sesión.
// - El DM (rol "dm") puede hablar como Narrador, como NPC o como
//   monstruo del combate, eligiendo al personaje.
// - Los jugadores ven el chat en vivo (solo lectura).
// Texto plano, preparado para un futuro lector de voz (TTS).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { Mic2, Send, Volume2 } from 'lucide-react';
import type { ChatMessage, Combatant } from '../../types';

interface ChatPanelProps {
  /** Mensajes a mostrar (en orden cronológico). */
  messages: ChatMessage[];
  /** Solo lectura: jugadores no envían. */
  readOnly?: boolean;
  /** Participantes para elegir cómo habla el DM (NPC/monstruo). */
  participants?: Combatant[];
  /** Envía un mensaje como el DM (Narrador, NPC o monstruo). */
  onSend?: (msg: { author: string; kind: ChatMessage['kind']; text: string; combatantId?: string }) => void;
}

/** Icono de color según el autor (Narrador = DM, aliado, enemigo...). */
const authorColor = (kind: ChatMessage['kind']): string => {
  switch (kind) {
    case 'dm':
      return 'text-dnd-gold';
    case 'npc':
      return 'text-sky-300';
    case 'monster':
      return 'text-red-300';
    default:
      return 'text-dnd-muted';
  }
};

const authorBadge = (kind: ChatMessage['kind']): string => {
  switch (kind) {
    case 'dm':
      return 'Narrador';
    case 'npc':
      return 'NPC';
    case 'monster':
      return 'Monstruo';
    default:
      return '';
  }
};

export const ChatPanel = ({ messages, readOnly, participants, onSend }: ChatPanelProps) => {
  const [text, setText] = useState('');
  const [who, setWho] = useState<string>('__dm__');
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Combatientes que pueden "hablar" (NPCs y monstruos), por nombre.
  const speakers = (participants ?? []).filter(
    (c) => c.type === 'npc' || c.type === 'monster'
  );

  const resolveAuthor = (): { author: string; kind: ChatMessage['kind']; combatantId?: string } => {
    if (who === '__dm__') return { author: 'Narrador', kind: 'dm' };
    const p = speakers.find((s) => s.id === who);
    if (p) {
      return {
        author: p.name,
        kind: p.type === 'monster' ? 'monster' : 'npc',
        combatantId: p.id,
      };
    }
    return { author: 'NPC', kind: 'npc' };
  };

  const handleSend = () => {
    if (!onSend || !text.trim()) return;
    onSend({ ...resolveAuthor(), text: text.trim() });
    setText('');
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-dnd-muted">
        <Volume2 size={13} className="text-dnd-gold" aria-hidden="true" />
        Chat / Lore
      </div>

      {/* Lista de mensajes */}
      <div
        ref={listRef}
        className="scrollbar-thin min-h-0 flex-1 space-y-1.5 overflow-y-auto rounded-dnd-lg border border-dnd-leather/30 bg-dnd-ink/40 p-2"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-[11px] text-dnd-muted">
            {readOnly
              ? 'El DM aún no ha hablado. Los mensajes de lore llegarán aquí en vivo.'
              : 'Elige cómo hablar (Narrador, NPC o monstruo) y escribe el lore. Cada mensaje se guarda en el registro y se sincroniza con el party.'}
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="rounded-lg border border-dnd-leather/20 bg-dnd-ink/30 px-2 py-1.5">
              <p className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-bold ${authorColor(m.kind)}`}>
                  {m.author}
                  <span className="ml-1 font-normal text-dnd-muted/70">({authorBadge(m.kind)})</span>
                </span>
                <span className="shrink-0 text-[9px] text-dnd-muted/60">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-dnd-text">{m.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Zona de envío (solo DM) */}
      {!readOnly && onSend && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <Mic2 size={13} className="shrink-0 text-dnd-gold" aria-hidden="true" />
            <select
              value={who}
              onChange={(e) => setWho(e.target.value)}
              aria-label="Hablar como"
              className="input h-8 min-w-0 flex-1 px-2 py-0 text-xs"
            >
              <option value="__dm__">📖 Narrador (DM)</option>
              {speakers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.type === 'monster' ? '👹' : '🧙'} {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Escribe lore, diálogo o descripción…"
              aria-label="Mensaje de chat"
              className="input h-8 min-w-0 flex-1 px-2 py-0 text-xs"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim()}
              aria-label="Enviar mensaje"
              className="rounded-md bg-dnd-gold px-2.5 py-1.5 text-dnd-ink transition-colors hover:bg-dnd-gold/80 disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};