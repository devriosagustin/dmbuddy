// ============================================================
// Lanzador de dados visual con fórmulas e historial
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dices, History, Save, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '../common/Button';
import { DiceFace, DiceToken } from './DiceFace';
import { useDice } from '../../hooks/useDice';
import type { DiceResult } from '../../types';

// Tipos de dados clásicos
const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100];

/**
 * Pantalla completa del lanzador de dados.
 */
export const DiceRoller = () => {
  const {
    roll,
    rollAdvantage,
    rollDisadvantage,
    rollExplode,
    history,
    favorites,
    addFavorite,
    clearHistory,
    isRolling,
  } = useDice();

  const [formula, setFormula] = useState('');
  const [modifier, setModifier] = useState(0);
  const [lastResult, setLastResult] = useState<DiceResult | null>(null);
  const [explodeEnabled, setExplodeEnabled] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const handleRollDiceType = (sides: number) => {
    if (explodeEnabled) {
      // dados explosivos
      const r = rollExplode(sides, 1, modifier);
      setLastResult(r);
      return;
    }
    const formulaStr = `1d${sides}${modifier !== 0 ? `${modifier > 0 ? '+' : '-'}${Math.abs(modifier)}` : ''}`;
    const r = roll(formulaStr);
    setLastResult(r);
  };

  const handleAdvantage = (isAdvantage: boolean) => {
    const r = isAdvantage ? rollAdvantage(modifier) : rollDisadvantage(modifier);
    setLastResult(r);
  };

  const handleFormula = () => {
    if (!formula.trim()) return;
    const r = roll(formula);
    setLastResult(r);
    if (!favorites.includes(formula.trim())) {
      addFavorite(formula.trim());
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Resultado principal */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex flex-col items-center gap-3 py-8"
        role="status"
        aria-live="polite"
      >
<h2 className="page-title flex items-center gap-2">
          <Dices size={24} aria-hidden="true" /> Lanzador de dados
        </h2>

        {lastResult ? (
          <div className="flex flex-col items-center gap-2">
            <motion.p
              key={lastResult.timestamp.toISOString()}
              className="font-fantasy text-5xl font-bold text-dnd-parchment"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {lastResult.result}
            </motion.p>
            <p className="text-sm text-dnd-muted">
              {lastResult.formula} · {lastResult.breakdown}
            </p>
            {lastResult.advantage && <span className="badge border border-dnd-gold/50 text-dnd-gold">Ventaja</span>}
          </div>
        ) : (
          <p className="text-dnd-muted">Tira un dado para comenzar</p>
        )}
      </motion.div>

      {/* Dados rápidos */}
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase text-dnd-gold">Dados rápidos</h3>
          <div className="flex items-center gap-3">
            <label htmlFor="modifier" className="text-xs text-dnd-muted">Modificador:</label>
            <input
              id="modifier"
              type="number"
              value={modifier}
              onChange={(e) => setModifier(Number(e.target.value))}
              className="input w-20 text-sm"
              aria-label="Modificador de la tirada"
            />
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-dnd-muted">
              <input
                type="checkbox"
                checked={explodeEnabled}
                onChange={(e) => setExplodeEnabled(e.target.checked)}
                className="accent-dnd-gold"
              />
              Explosivos
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {DICE_TYPES.map((sides) => {
            if (sides <= 6) {
              return (
                <button
                  key={sides}
                  onClick={() => handleRollDiceType(sides)}
                  aria-label={`Tirar d${sides}${modifier !== 0 ? ` con modificador ${modifier}` : ''}${explodeEnabled ? ' explosivo' : ''}`}
                  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold rounded-lg p-1"
                >
                  <DiceFace sides={sides} value={sides} small={sides === 4} />
                </button>
              );
            }
            return (
              <button
                key={sides}
                onClick={() => handleRollDiceType(sides)}
                aria-label={`Tirar d${sides}${modifier !== 0 ? ` con modificador ${modifier}` : ''}`}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-dnd-gold rounded-lg"
              >
                <DiceToken label={`d${sides}`} value={sides} />
              </button>
            );
          })}
        </div>

        {/* Ventaja / Desventaja */}
        <div className="mt-4 flex justify-center gap-3">
          <Button
            variant="secondary"
            icon={<TrendingUp size={16} />}
            onClick={() => handleAdvantage(true)}
            aria-label="Tirar d20 con ventaja"
          >
            Ventaja (2d20)
          </Button>
          <Button
            variant="secondary"
            icon={<TrendingDown size={16} />}
            onClick={() => handleAdvantage(false)}
            aria-label="Tirar d20 con desventaja"
          >
            Desventaja
          </Button>
        </div>
      </div>

      {/* Fórmula personalizada */}
      <div className="card space-y-3">
        <h3 className="text-sm font-bold uppercase text-dnd-gold">Fórmula personalizada</h3>
        <div className="flex gap-2">
          <label htmlFor="dice-formula" className="sr-only">Fórmula de dados</label>
          <input
            id="dice-formula"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFormula()}
            placeholder="ej: 2d20k1, 4d6dl1, 2d8+3, 1d20+proficiency+d4"
            className="input font-body"
            aria-label="Fórmula de dados"
          />
          <Button variant="primary" onClick={handleFormula} disabled={isRolling || !formula.trim()}>
            Tirar
          </Button>
        </div>

        {/* Fórmulas favoritas */}
        {favorites.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Fórmulas favoritas">
            {favorites.slice(0, 8).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFormula(f);
                  const r = roll(f.replace('d20 adv', 'd20').replace('adv', ''));
                  setLastResult(r);
                }}
                aria-label={`Usar fórmula ${f}`}
                className="badge border border-dnd-gold/40 bg-dnd-gold/10 px-2.5 py-1 font-body text-xs hover:bg-dnd-gold/25"
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Historial */}
      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-dnd-gold">
            <History size={16} aria-hidden="true" /> Historial
            <span className="rounded-full bg-dnd-leather/40 px-2 text-[10px] text-dnd-text">{history.length}</span>
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory((s) => !s)}
              aria-expanded={showHistory}
              className="rounded px-2 py-1 text-xs text-dnd-muted hover:text-dnd-text focus:outline-none"
            >
              {showHistory ? 'Ocultar' : 'Mostrar'}
            </button>
            <button
              onClick={clearHistory}
              aria-label="Vaciar historial"
              className="rounded p-1.5 text-dnd-muted hover:text-red-300 focus:outline-none"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {showHistory && (
          <ul className="max-h-80 space-y-1 overflow-y-auto font-body text-sm" aria-label="Tiradas recientes">
            {history.length === 0 && <li className="text-dnd-muted">Sin tiradas todavía.</li>}
            {history.map((h, i) => (
<li
                key={`${new Date(h.timestamp).toISOString()}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg border-b border-dnd-leather/20 py-1.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-dnd-text">
                    <span className="font-bold text-dnd-gold">{h.formula}</span>
                    {h.advantage && <span className="ml-1 text-[10px] text-dnd-gold">(ventaja)</span>}
                  </p>
                  <p className="truncate text-[11px] text-dnd-muted">{h.breakdown}</p>
                </div>
                <span className="shrink-0 font-fantasy text-base font-bold text-dnd-parchment">{h.result}</span>
                <span className="shrink-0 text-[10px] text-dnd-muted">{formatTime(new Date(h.timestamp))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Guardado de favorito */}
      {lastResult && !favorites.includes(lastResult.formula) && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            icon={<Save size={14} />}
            onClick={() => addFavorite(lastResult.formula)}
            aria-label={`Guardar ${lastResult.formula} como favorita`}
          >
            Guardar como favorita
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiceRoller;
