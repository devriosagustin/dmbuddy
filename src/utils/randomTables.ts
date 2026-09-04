// ============================================================
// Utilidades para tirar de las tablas aleatorias (sin IA): elige
// una entrada al azar, evitando repetir el último resultado cuando
// hay más de una opción disponible.
// ============================================================

import { ADVENTURE_HOOKS, COMPLICATIONS, LOOT_TABLES, NPC_NAME_TABLES } from '../data/randomTables';
import type { LootEntry, LootTier } from '../data/randomTables';

const randomInt = (max: number): number => Math.floor(Math.random() * max);

/**
 * Elige un elemento al azar de una lista, evitando repetir `avoid` cuando
 * la lista tiene más de una opción (para que "tirar otra vez" casi
 * siempre dé algo distinto). Con listas de 1 solo elemento devuelve ese.
 */
export const pickRandom = <T,>(list: readonly T[], avoid?: T): T => {
  if (list.length <= 1) return list[0];
  let choice = list[randomInt(list.length)];
  if (avoid !== undefined) {
    let guard = 0;
    while (choice === avoid && guard < 10) {
      choice = list[randomInt(list.length)];
      guard += 1;
    }
  }
  return choice;
};

export interface RolledNpcName {
  name: string;
  speciesLabel: string;
}

/**
 * Tira un nombre de NPC. Si se pasa `speciesId` (id de SRD_SPECIES,
 * "sp-*") y coincide con una tabla curada, usa esa tabla; si no, elige
 * una tabla al azar entre todas las especies.
 */
export const rollNpcName = (speciesId?: string): RolledNpcName => {
  const table =
    NPC_NAME_TABLES.find((t) => t.speciesId === speciesId) ?? pickRandom(NPC_NAME_TABLES);
  const first = pickRandom(table.firstNames);
  const last = pickRandom(table.surnames);
  return { name: `${first} ${last}`, speciesLabel: table.speciesLabel };
};

export const rollAdventureHook = (avoid?: string): string => pickRandom(ADVENTURE_HOOKS, avoid);

export const rollComplication = (avoid?: string): string => pickRandom(COMPLICATIONS, avoid);

export interface RolledLoot {
  text: string;
  gold: number;
}

/** Tira un botín para el tier de dificultad dado, con oro al azar dentro del rango. */
export const rollLoot = (tier: LootTier, avoid?: LootEntry): RolledLoot => {
  const entry = pickRandom(LOOT_TABLES[tier], avoid);
  const gold = entry.goldMin + randomInt(Math.max(1, entry.goldMax - entry.goldMin + 1));
  return { text: entry.text, gold };
};
