// ============================================================
// Progresión de experiencia (XP) según las reglas básicas de D&D
// ------------------------------------------------------------
// Umbra de XP acumulada necesaria para ALCANZAR cada nivel.
// Índice 0 = nivel 1. (Tabla "Experience Points by Level" del DMG;
// usada en D&D 5e/2024 para niveles 1-20.)
// ============================================================

/** XP acumulada mínima para alcanzar cada nivel (índice 0 = nivel 1). */
export const XP_TO_LEVEL: readonly number[] = [
  0,      // nivel 1
  300,    // nivel 2
  900,    // nivel 3
  2700,   // nivel 4
  6500,   // nivel 5
  14000,  // nivel 6
  23000,  // nivel 7
  34000,  // nivel 8
  48000,  // nivel 9
  64000,  // nivel 10
  85000,  // nivel 11
  100000, // nivel 12
  120000, // nivel 13
  140000, // nivel 14
  165000, // nivel 15
  195000, // nivel 16
  225000, // nivel 17
  265000, // nivel 18
  305000, // nivel 19
  355000, // nivel 20
];

export const MAX_LEVEL = XP_TO_LEVEL.length;

/** Límite superior de XP (nivel 20): no hay umbral de subida. */
export const XP_CAP = XP_TO_LEVEL[MAX_LEVEL - 1];

/**
 * Nivel que corresponde a una cantidad acumulada de XP (1-20).
 */
export const levelFromXp = (xp: number): number => {
  let level = 1;
  for (let i = 0; i < XP_TO_LEVEL.length; i++) {
    if (xp >= XP_TO_LEVEL[i]) level = i + 1;
    else break;
  }
  return level;
};

/** XP mínima acumulada para alcanzar el nivel dado (1-20). */
export const xpForLevel = (level: number): number => {
  const idx = Math.min(Math.max(level, 1), MAX_LEVEL) - 1;
  return XP_TO_LEVEL[idx];
};

/** XP acumulada mínima para alcanzar el nivel siguiente (o Infinity en nivel 20). */
export const xpForNextLevel = (level: number): number => {
  if (level >= MAX_LEVEL) return Infinity;
  return XP_TO_LEVEL[level];
};

/** XP necesaria para pasar del nivel actual al siguiente. */
export const xpNeededForNextLevel = (level: number): number => {
  if (level >= MAX_LEVEL) return 0;
  return XP_TO_LEVEL[level] - XP_TO_LEVEL[level - 1];
};

/** ¿El personaje (a un nivel dado) tiene XP acumulada suficiente para su siguiente nivel? */
export const canLevelUp = (level: number, xp: number): boolean =>
  level < MAX_LEVEL && levelFromXp(xp) > level;

/**
 * Progreso (0-1) de la barra de XP dentro del nivel actual.
 * Nivel 20 => 1 (barra llena).
 */
export const xpProgress = (level: number, xp: number): number => {
  if (level >= MAX_LEVEL) return 1;
  const current = XP_TO_LEVEL[level - 1];
  const next = XP_TO_LEVEL[level];
  if (next <= current) return 1;
  const into = xp - current;
  return Math.min(1, Math.max(0, into / (next - current)));
};

/** Cantidad de XP acumulada dentro del nivel actual (0..necesario). */
export const xpIntoLevel = (level: number, xp: number): number => {
  if (level >= MAX_LEVEL) return xpForNextLevel(level);
  return Math.max(0, xp - XP_TO_LEVEL[level - 1]);
};

/**
 * Devuelve el nivel "efectivo" tras aplicar la XP acumulada, y si hubo subida.
 */
export const applyXpToLevel = (
  currentLevel: number,
  xp: number
): { level: number; leveledUp: boolean } => {
  const computed = levelFromXp(xp);
  const leveledUp = computed > currentLevel;
  return { level: leveledUp ? computed : currentLevel, leveledUp };
};
