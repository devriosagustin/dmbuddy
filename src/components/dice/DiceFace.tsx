// ============================================================
// Dado SVG con la cara dibujada según el valor
// ============================================================

import { motion } from 'framer-motion';

interface DiceFaceProps {
  sides: number;
  value: number;
  highlight?: boolean;
  small?: boolean;
}

/**
 * Renderiza un dado (pips o número) con efecto de rebote al tirar.
 */
export const DiceFace = ({ sides, value, highlight = false, small = false }: DiceFaceProps) => {

  // Distribución de puntos para d4-d6 (sencillo)
  const pipsForD6 = (v: number): number[][] => {
    const map: Record<number, number[][]> = {
      1: [[1, 1]],
      2: [[0.25, 0.25], [1.75, 1.75]],
      3: [[0.25, 0.25], [1, 1], [1.75, 1.75]],
      4: [[0.25, 0.25], [1.75, 0.25], [0.25, 1.75], [1.75, 1.75]],
      5: [[0.25, 0.25], [1.75, 0.25], [1, 1], [0.25, 1.75], [1.75, 1.75]],
      6: [[0.25, 0.25], [1.75, 0.25], [0.25, 1], [1.75, 1], [0.25, 1.75], [1.75, 1.75]],
    };
    return map[v] ?? [];
  };

  const fill = highlight ? '#DAA520' : '#f5e6ca';
  const pipFill = highlight ? '#1a1a2e' : '#8B4513';

  return (
    <motion.div
      initial={{ rotate: -30, scale: 0.7, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      whileHover={{ scale: 1.05, y: -3 }}
      title={`${value} en d${sides}`}
      className={highlight ? 'rounded-lg shadow-dnd-glow' : 'rounded-lg'}
      aria-hidden="true"
    >
      <svg width={small ? 40 : 58} height={small ? 40 : 58} viewBox="0 0 2 2" role="img" aria-label={`Resultado ${value}`}>
        <rect x="0.05" y="0.05" width="1.9" height="1.9" rx="0.25" fill={fill} />
        {pipsForD6(value).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.18" fill={pipFill} />
        ))}
      </svg>
    </motion.div>
  );
};

/**
 * Pequeña ficha numérica para dados mayores (d8+, d100).
 */
export const DiceToken = ({ label, value, highlight = false }: { label: string; value?: number; highlight?: boolean }) => {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`flex h-14 w-14 items-center justify-center rounded-lg font-fantasy font-bold ${highlight ? 'bg-dnd-gold text-dnd-ink shadow-dnd-glow' : 'bg-dnd-parchment text-dnd-ink'}`}
      aria-label={`Resultado ${value ?? ''}`}
    >
      <div className="text-center">
        <div className="text-xl">{value}</div>
        <div className="text-[9px] opacity-70">{label}</div>
      </div>
    </motion.div>
  );
};