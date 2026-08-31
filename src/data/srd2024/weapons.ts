// ============================================================
// SRD 5.2 - Armas (2024)
// Tabla de armas simples y marciales del repertorio oficial
// (CC-BY-4.0). Usadas para equipar personajes y calcular
// sus ataques dentro y fuera de combate.
// ============================================================

export interface SrdWeaponEntry {
  id: string;
  name: string;
  category: 'simple' | 'martial';
  kind: 'melee' | 'ranged';
  /** Dados de daño (p. ej. "1d8" o "2d6"). */
  damage: string;
  damageType: string;
  properties: string[];
  range?: string;
  cost?: string;
  weight?: string;
}

const w = (entry: Omit<SrdWeaponEntry, 'id'> & { id: string }): SrdWeaponEntry => entry;

/** Armas simples y marciales del SRD 5.2. */
export const SRD_WEAPONS: SrdWeaponEntry[] = [
  // ---------- Armas simples de cuerpo a cuerpo ----------
  w({ id: 'weapon-club', name: 'Clava', category: 'simple', kind: 'melee', damage: '1d4', damageType: 'Contundente', properties: ['Ligero'], cost: '1 po', weight: '2 lb' }),
  w({ id: 'weapon-dagger', name: 'Daga', category: 'simple', kind: 'melee', damage: '1d4', damageType: 'Perforante', properties: ['Sutileza', 'Ligero', 'Arrojadiza (20/60)'], range: '20/60', cost: '2 po', weight: '1 lb' }),
  w({ id: 'weapon-greatclub', name: 'Gran clava', category: 'simple', kind: 'melee', damage: '1d8', damageType: 'Contundente', properties: ['a Dos Manos'], cost: '2 sp', weight: '10 lb' }),
  w({ id: 'weapon-handaxe', name: 'Hacha de mano', category: 'simple', kind: 'melee', damage: '1d6', damageType: 'Cortante', properties: ['Ligero', 'Arrojadiza (20/60)'], range: '20/60', cost: '5 po', weight: '2 lb' }),
  w({ id: 'weapon-javelin', name: 'Jabalina', category: 'simple', kind: 'melee', damage: '1d6', damageType: 'Perforante', properties: ['Arrojadiza (30/120)'], range: '30/120', cost: '5 sp', weight: '2 lb' }),
  w({ id: 'weapon-light-hammer', name: 'Martillo ligero', category: 'simple', kind: 'melee', damage: '1d4', damageType: 'Contundente', properties: ['Ligero', 'Arrojadiza (20/60)'], range: '20/60', cost: '2 po', weight: '2 lb' }),
  w({ id: 'weapon-mace', name: 'Maza', category: 'simple', kind: 'melee', damage: '1d6', damageType: 'Contundente', properties: [], cost: '5 po', weight: '4 lb' }),
  w({ id: 'weapon-quarterstaff', name: 'Bastón', category: 'simple', kind: 'melee', damage: '1d6', damageType: 'Contundente', properties: ['Versátil (1d8)'], cost: '2 sp', weight: '4 lb' }),
  w({ id: 'weapon-sickle', name: 'Hoz', category: 'simple', kind: 'melee', damage: '1d4', damageType: 'Cortante', properties: ['Ligero'], cost: '1 po', weight: '2 lb' }),
  w({ id: 'weapon-spear', name: 'Lanza', category: 'simple', kind: 'melee', damage: '1d6', damageType: 'Perforante', properties: ['Arrojadiza (20/60)', 'Versátil (1d8)'], range: '20/60', cost: '1 po', weight: '3 lb' }),

  // ---------- Armas simples a distancia ----------
  w({ id: 'weapon-light-crossbow', name: 'Ballesta ligera', category: 'simple', kind: 'ranged', damage: '1d8', damageType: 'Perforante', properties: ['Munición (80/320)', 'Carga', 'a Dos Manos'], range: '80/320', cost: '25 po', weight: '5 lb' }),
  w({ id: 'weapon-dart', name: 'Dardo', category: 'simple', kind: 'ranged', damage: '1d4', damageType: 'Perforante', properties: ['Sutileza', 'Arrojadiza (20/60)'], range: '20/60', cost: '5 pc', weight: '0,5 lb' }),
  w({ id: 'weapon-shortbow', name: 'Arco corto', category: 'simple', kind: 'ranged', damage: '1d6', damageType: 'Perforante', properties: ['Munición (80/320)', 'a Dos Manos'], range: '80/320', cost: '25 po', weight: '2 lb' }),
  w({ id: 'weapon-sling', name: 'Honda', category: 'simple', kind: 'ranged', damage: '1d4', damageType: 'Contundente', properties: ['Munición (30/120)'], range: '30/120', cost: '1 sp', weight: '0 lb' }),

  // ---------- Armas marciales de cuerpo a cuerpo ----------
  w({ id: 'weapon-battleaxe', name: 'Hacha de batalla', category: 'martial', kind: 'melee', damage: '1d8', damageType: 'Cortante', properties: ['Versátil (1d10)'], cost: '10 po', weight: '4 lb' }),
  w({ id: 'weapon-flail', name: 'Mayal', category: 'martial', kind: 'melee', damage: '1d8', damageType: 'Contundente', properties: [], cost: '10 po', weight: '2 lb' }),
  w({ id: 'weapon-glaive', name: 'Guja', category: 'martial', kind: 'melee', damage: '1d10', damageType: 'Cortante', properties: ['Pesada', 'Alcance', 'a Dos Manos'], cost: '20 po', weight: '6 lb' }),
  w({ id: 'weapon-greataxe', name: 'Gran hacha', category: 'martial', kind: 'melee', damage: '1d12', damageType: 'Cortante', properties: ['Pesada', 'a Dos Manos'], cost: '30 po', weight: '7 lb' }),
  w({ id: 'weapon-greatsword', name: 'Espadón', category: 'martial', kind: 'melee', damage: '2d6', damageType: 'Cortante', properties: ['Pesada', 'a Dos Manos'], cost: '50 po', weight: '6 lb' }),
  w({ id: 'weapon-halberd', name: 'Alabarda', category: 'martial', kind: 'melee', damage: '1d10', damageType: 'Cortante', properties: ['Pesada', 'Alcance', 'a Dos Manos'], cost: '20 po', weight: '6 lb' }),
  w({ id: 'weapon-lance', name: 'Lanza de caballería', category: 'martial', kind: 'melee', damage: '1d10', damageType: 'Perforante', properties: ['Alcance', 'Especial (solo con montura)'], cost: '10 po', weight: '6 lb' }),
  w({ id: 'weapon-longsword', name: 'Espada larga', category: 'martial', kind: 'melee', damage: '1d8', damageType: 'Cortante', properties: ['Versátil (1d10)'], cost: '15 po', weight: '3 lb' }),
  w({ id: 'weapon-maul', name: 'Mazo', category: 'martial', kind: 'melee', damage: '2d6', damageType: 'Contundente', properties: ['Pesada', 'a Dos Manos'], cost: '10 po', weight: '10 lb' }),
  w({ id: 'weapon-morningstar', name: 'Estrella del alba', category: 'martial', kind: 'melee', damage: '1d8', damageType: 'Perforante', properties: [], cost: '15 po', weight: '4 lb' }),
  w({ id: 'weapon-pike', name: 'Pica', category: 'martial', kind: 'melee', damage: '1d10', damageType: 'Perforante', properties: ['Pesada', 'Alcance', 'a Dos Manos'], cost: '5 po', weight: '18 lb' }),
  w({ id: 'weapon-rapier', name: 'Estoque', category: 'martial', kind: 'melee', damage: '1d8', damageType: 'Perforante', properties: ['Sutileza'], cost: '25 po', weight: '2 lb' }),
  w({ id: 'weapon-scimitar', name: 'Cimitarra', category: 'martial', kind: 'melee', damage: '1d6', damageType: 'Cortante', properties: ['Sutileza', 'Ligero'], cost: '25 po', weight: '3 lb' }),
  w({ id: 'weapon-shortsword', name: 'Espada corta', category: 'martial', kind: 'melee', damage: '1d6', damageType: 'Perforante', properties: ['Sutileza', 'Ligero'], cost: '10 po', weight: '2 lb' }),
  w({ id: 'weapon-trident', name: 'Tridente', category: 'martial', kind: 'melee', damage: '1d6', damageType: 'Perforante', properties: ['Arrojadiza (20/60)', 'Versátil (1d8)'], range: '20/60', cost: '5 po', weight: '4 lb' }),
  w({ id: 'weapon-war-pick', name: 'Pico de guerra', category: 'martial', kind: 'melee', damage: '1d8', damageType: 'Perforante', properties: [], cost: '5 po', weight: '2 lb' }),
  w({ id: 'weapon-warhammer', name: 'Martillo de guerra', category: 'martial', kind: 'melee', damage: '1d8', damageType: 'Contundente', properties: ['Versátil (1d10)'], cost: '15 po', weight: '2 lb' }),
  w({ id: 'weapon-whip', name: 'Látigo', category: 'martial', kind: 'melee', damage: '1d4', damageType: 'Cortante', properties: ['Sutileza', 'Alcance'], cost: '2 po', weight: '3 lb' }),

  // ---------- Armas marciales a distancia ----------
  w({ id: 'weapon-blowgun', name: 'Cerbatana', category: 'martial', kind: 'ranged', damage: '1', damageType: 'Perforante', properties: ['Munición (25/100)', 'Carga'], range: '25/100', cost: '10 po', weight: '1 lb' }),
  w({ id: 'weapon-hand-crossbow', name: 'Ballesta de mano', category: 'martial', kind: 'ranged', damage: '1d6', damageType: 'Perforante', properties: ['Munición (30/120)', 'Carga', 'Ligero'], range: '30/120', cost: '75 po', weight: '3 lb' }),
  w({ id: 'weapon-heavy-crossbow', name: 'Ballesta pesada', category: 'martial', kind: 'ranged', damage: '1d10', damageType: 'Perforante', properties: ['Munición (100/400)', 'Carga', 'Pesada', 'a Dos Manos'], range: '100/400', cost: '50 po', weight: '18 lb' }),
  w({ id: 'weapon-longbow', name: 'Arco largo', category: 'martial', kind: 'ranged', damage: '1d8', damageType: 'Perforante', properties: ['Munición (150/600)', 'Pesada', 'a Dos Manos'], range: '150/600', cost: '50 po', weight: '2 lb' }),
];

const weaponIndex = new Map<string, SrdWeaponEntry>(SRD_WEAPONS.map((weap) => [weap.id, weap]));

/** Resuelve un arma del SRD por su id. */
export const srdWeaponById = (id: string): SrdWeaponEntry | undefined => weaponIndex.get(id);