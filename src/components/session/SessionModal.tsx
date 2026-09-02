// ============================================================
// Modal de sesión multijugador: crear (DM), unirse (jugador) o salir.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { Crown, Users, LogOut, Link2, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useSessionStore } from '../../store/sessionStore';
import { usePlayerStore } from '../../store/playerStore';
import type { RemotePlayerSheet } from '../../types/session';

interface SessionModalProps {
  open: boolean;
  onClose: () => void;
}

const RECENT_KEY = 'dmbuddy-recent-codes';

const loadRecent = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return list.filter((c): c is string => typeof c === 'string');
  } catch {
    return [];
  }
};

const saveRecent = (code: string) => {
  try {
    const list = [code, ...loadRecent().filter((c) => c !== code)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
};

const codeSuggestion = (): string => {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const nums = '23456789';
  const buf: string[] = [];
  for (let i = 0; i < 4; i++) {
    buf.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }
  buf.push(nums[Math.floor(Math.random() * nums.length)]);
  return buf.join('');
};

/**
 * Diálogo para gestionar la sesión: crear como DM, unirse como jugador
 * o mostrar el estado actual y permitir salir.
 */
export const SessionModal = ({ open, onClose }: SessionModalProps) => {
  const role = useSessionStore((s) => s.role);
  const code = useSessionStore((s) => s.code);
  const status = useSessionStore((s) => s.status);
  const error = useSessionStore((s) => s.error);
  const createSession = useSessionStore((s) => s.createSession);
  const joinSession = useSessionStore((s) => s.joinSession);
  const leaveSession = useSessionStore((s) => s.leaveSession);
  const remotePlayers = useSessionStore((s) => s.remotePlayers);

  const localPlayers = usePlayerStore((s) => s.players);

  const [draftCode, setDraftCode] = useState(codeSuggestion());
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [busy, setBusy] = useState(false);

  // Sugerencias de códigos recientes (para unirse).
  const recent = useMemo(loadRecent, [open]);

  useEffect(() => {
    if (open && !role && recent.length > 0 && !recent.includes(draftCode)) {
      // Preferir el más reciente en modo unirse.
      setDraftCode(recent[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async () => {
    if (!draftCode.trim()) return;
    setBusy(true);
    const ok =
      mode === 'create' ? await createSession(draftCode) : await joinSession(draftCode);
    setBusy(false);
    if (ok) {
      saveRecent(draftCode);
      onClose();
    }
  };

  const handleLeave = () => {
    leaveSession();
    onClose();
  };

  const activeCombat = useSessionStore((s) => s.remoteCombat);

  const handleImportRemote = (remote: RemotePlayerSheet) => {
    const json = JSON.stringify(remote.sheet);
    const ok = usePlayerStore.getState().importPlayer(json);
    if (ok) {
      window.alert(`"${remote.name}" añadido al Party del DM.`);
    } else {
      window.alert('No se pudo importar esa ficha (formato no reconocido).');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Sesión multijugador" maxWidth="lg">
      {role === null && (
        <div className="flex flex-col gap-4">
          {/* Selector de modo */}
          <div className="flex items-center gap-0.5 rounded-lg bg-dnd-leather/30 p-0.5" role="group" aria-label="Rol de sesión">
            <button
              onClick={() => setMode('create')}
              aria-pressed={mode === 'create'}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                mode === 'create' ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'
              }`}
            >
              <Crown size={16} /> Crear (DM)
            </button>
            <button
              onClick={() => setMode('join')}
              aria-pressed={mode === 'join'}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-colors ${
                mode === 'join' ? 'bg-dnd-gold text-dnd-ink' : 'text-dnd-muted hover:text-dnd-text'
              }`}
            >
              <Users size={16} /> Unirse (Jugador)
            </button>
          </div>

          {/* Código */}
          <div>
            <label htmlFor="session-code" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-dnd-muted">
              Código de sesión
            </label>
            <div className="flex gap-2">
              <input
                id="session-code"
                className="input h-11 flex-1 text-center text-lg font-bold uppercase tracking-[0.3em]"
                value={draftCode}
                onChange={(e) => setDraftCode(e.target.value.toUpperCase())}
                placeholder="ABC12"
                autoComplete="off"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDraftCode(codeSuggestion())}
                title="Generar código aleatorio"
              >
                🎲
              </Button>
            </div>
            {mode === 'create' && remotePlayers.length === 0 && recent.length > 0 && (
              <p className="mt-1.5 text-xs text-dnd-muted">
                Sugerencia: usa un código distinto a los recientes ({recent.join(', ')}).
              </p>
            )}
          </div>

          {mode === 'join' && recent.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recent.map((c) => (
                <button
                  key={c}
                  onClick={() => setDraftCode(c)}
                  className="rounded-full border border-dnd-leather/40 px-2.5 py-1 text-xs font-bold text-dnd-muted transition-colors hover:border-dnd-gold/60 hover:text-dnd-gold"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-900/20 px-3 py-2 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}

          <Button variant="primary" onClick={handleSubmit} disabled={busy || !draftCode.trim()}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Conectando…
              </>
            ) : mode === 'create' ? (
              'Crear sesión como DM'
            ) : (
              'Unirse a la sesión'
            )}
          </Button>
        </div>
      )}

      {/* Estado conectado */}
      {role !== null && code && (
        <div className="flex flex-col gap-3">
          <div className="rounded-dnd-lg border border-dnd-leather/40 bg-dnd-leather/10 p-3">
            <div className="flex items-center gap-2">
              {role === 'dm' ? <Crown size={18} className="text-dnd-gold" /> : <Users size={18} className="text-sky-400" />}
              <span className="font-fantasy text-base font-bold text-dnd-text">
                {role === 'dm' ? 'Sesión (DM)' : 'Sesión (Jugador)'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {status === 'connected' ? 'Conectado' : 'Conectando…'}
              </span>
              <span className="ml-auto rounded-md bg-dnd-ink/80 px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-dnd-gold">
                {code}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-dnd-muted">
              <Link2 size={13} />
              Comparte el código <span className="font-mono font-bold text-dnd-text">{code}</span> con tu mesa.
            </div>
          </div>

          {role === 'dm' && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-dnd-muted">
                Fichas de jugadores ({remotePlayers.length})
              </h3>
              {remotePlayers.length === 0 ? (
                <p className="text-sm text-dnd-muted">
                  Esperando a que los jugadores publiquen sus personajes…
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {remotePlayers.map((rp) => {
                    const imported = localPlayers.some((p) => p.name === rp.name);
                    return (
                      <li
                        key={rp.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-dnd-leather/30 bg-dnd-leather/5 px-3 py-2"
                      >
                        <span className="text-sm font-bold text-dnd-text">{rp.name}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleImportRemote(rp)}
                          disabled={imported}
                          title={imported ? 'Ya tienes un personaje con ese nombre' : 'Añadir al Party del DM'}
                        >
                          {imported ? 'Añadido' : 'Traer al Party'}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {role === 'player' && (
            <div className="rounded-dnd-lg border border-dnd-leather/40 bg-dnd-leather/5 p-3">
              <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-dnd-muted">
                Tu ficha se publica automáticamente
              </h3>
              <p className="text-sm text-dnd-muted">
                {localPlayers.length > 0
                  ? `Tu Party local (${localPlayers.map((p) => p.name).join(', ')}) se envía al DM. Edítalo en la sección Party.`
                  : 'Aún no tienes personajes. Crea uno en la sección Party para que el DM pueda traerlo.'}
              </p>
              {activeCombat?.snapshot.isActive && (
                <p className="mt-2 text-sm text-emerald-300">
                  ⚔️ Hay un combate en curso. Ábrelo en la sección Combate para ver el mapa de tu party.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-dnd-muted">
              {role === 'dm' ? 'Cierra la sesión cuando la partida termine.' : 'Al salir, tu ficha deja de publicarse.'}
            </p>
            <Button variant="danger" size="sm" onClick={handleLeave} icon={<LogOut size={15} />}>
              Salir de la sesión
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SessionModal;