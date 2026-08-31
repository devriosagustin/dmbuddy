// ============================================================
// SRD 5.2 - Bestiario (2024)
// Bloques de estadísticas con las convenciones de las reglas 2024.
// ============================================================

import type { SrdMonsterEntry } from '../../types/srd2024';

interface M {
  id: string;
  name: string;
  size: string;
  creatureType: string;
  alignment: string;
  ac: number;
  hp: number;
  hitDice: string;
  speed: string;
  stats: SrdMonsterEntry['stats'];
  skills?: Record<string, number>;
  senses?: string;
  languages?: string;
  cr: number;
  traits: SrdMonsterEntry['traits'];
  actions: SrdMonsterEntry['actions'];
  legendary?: SrdMonsterEntry['legendaryActions'];
  casting?: SrdMonsterEntry['spellcasting'];
}

const mob = (m: M): SrdMonsterEntry => ({
  id: m.id,
  title: m.name,
  category: 'monsters',
  source: 'srd2024',
  tags: ['SRD 2024', 'Bestiario', `CR ${m.cr}`],
  size: m.size,
  creatureType: m.creatureType,
  alignment: m.alignment,
  armorClass: m.ac,
  hitPoints: m.hp,
  hitDice: m.hitDice,
  speed: m.speed,
  stats: m.stats,
  skills: m.skills,
  senses: m.senses,
  languages: m.languages,
  challengeRating: m.cr,
  traits: m.traits,
  actions: m.actions,
  legendaryActions: m.legendary,
  spellcasting: m.casting,
});

/** Bestiario curado con las convenciones 2024. */
export const SRD_MONSTERS_2024: SrdMonsterEntry[] = [
  mob({
    id: 'm2024-guard',
    name: 'Centinela (Guard)', size: 'Mediano', creatureType: 'Humanoide', alignment: 'Cualquiera',
    ac: 14, hp: 11, hitDice: '2d8+2', speed: '30 pies',
    stats: { str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10 },
    skills: { Percepción: 2 }, senses: 'Pasiva 12',
    languages: 'Una lengua',
    cr: 1 / 8,
    traits: [],
    actions: [
      {
        name: 'Lanza', attackBonus: 3, damage: '1d6+1', damageType: 'contundente',
        description: 'Cuerpo a cuerpo o a distancia (20/60 pies). Golpe: 4 (1d6+1) de daño de contundente.',
        range: 'Cuerpo a cuerpo o a distancia',
      },
      { name: 'Garrote', attackBonus: 3, damage: '1d4+1', damageType: 'contundente', description: 'Golpe: 3 (1d4+1) de daño de contundente.' },
    ],
  }),
  mob({
    id: 'm2024-bandit',
    name: 'Bandido (Bandit)', size: 'Mediano', creatureType: 'Humanoide', alignment: 'Cualquiera no legal',
    ac: 12, hp: 11, hitDice: '2d8+2', speed: '30 pies',
    stats: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
    skills: { Engaño: 1, Sigilo: 3 }, senses: 'Pasiva 10',
    languages: 'Una lengua',
    cr: 1 / 8,
    traits: [
      { name: 'Táctica de manada', description: 'El bandido tiene ventaja en los ataques contra una criatura si tiene un aliado adyacente que no esté incapacitado.' },
    ],
    actions: [
      { name: 'Espada corta', attackBonus: 3, damage: '1d6+1', damageType: 'perforante', description: 'Golpe: 4 (1d6+1) de daño de perforante.' },
      { name: 'Ballesta ligera', attackBonus: 3, damage: '1d8+1', damageType: 'perforante', description: 'A distancia (80/320 pies). Golpe: 5 (1d8+1) de daño de perforante.', range: 'A distancia (80/320 pies)' },
    ],
  }),
  mob({
    id: 'm2024-goblin',
    name: 'Goblin', size: 'Pequeño', creatureType: 'Humanoide (trasgo)', alignment: 'Caótico malvado',
    ac: 15, hp: 7, hitDice: '2d6', speed: '30 pies',
    stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
    skills: { Sigilo: 6 }, senses: 'Visión en la oscuridad 60 pies, Pasiva 9',
    languages: 'Goblin, común',
    cr: 1 / 4,
    traits: [
      { name: 'Nimble Escape', description: 'El goblin puede usar Algo (o Separarse) como Acción de Bonificación.' },
    ],
    actions: [
      { name: 'Cimitarra', attackBonus: 4, damage: '1d6+2', damageType: 'cortante', description: 'Golpe: 5 (1d6+2) de daño de cortante.' },
      { name: 'Arco corto', attackBonus: 4, damage: '1d6+2', damageType: 'perforante', description: 'A distancia (80/320 pies). Golpe: 5 (1d6+2) de daño de perforante.', range: 'A distancia (80/320 pies)' },
    ],
  }),
  mob({
    id: 'm2024-wolf',
    name: 'Lobo (Wolf)', size: 'Mediano', creatureType: 'Bestia', alignment: 'Sin alineamiento',
    ac: 13, hp: 11, hitDice: '2d8+2', speed: '40 pies',
    stats: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
    skills: { Percepción: 3, Sigilo: 4 }, senses: 'Pasiva 13',
    languages: '—',
    cr: 1 / 4,
    traits: [
      { name: 'Olfato agudo', description: 'El lobo tiene ventaja en pruebas de Percepción que usen el olfato.' },
      { name: 'Tácticas de manada', description: 'El lobo tiene ventaja en los ataques contra una criatura si tiene un aliado adyacente a ella.' },
    ],
    actions: [
      { name: 'Mordisco', attackBonus: 4, damage: '2d4+2', damageType: 'perforante', description: 'Golpe: 7 (2d4+2) de daño de perforante. Si el objetivo es Mediano o menor, debe superar una salvación de FUE 11 o es **Derribado**.', target: 'Salvación FUE 11' },
    ],
  }),
  mob({
    id: 'm2024-owlbear',
    name: 'Búho-oso (Owlbear)', size: 'Grande', creatureType: 'Monstruosidad', alignment: 'Sin alineamiento',
    ac: 13, hp: 59, hitDice: '7d10+21', speed: '40 pies',
    stats: { str: 18, dex: 13, con: 17, int: 3, wis: 12, cha: 7 },
    skills: { Percepción: 3 }, senses: 'Visión en la oscuridad 60 pies, Pasiva 13',
    languages: '—',
    cr: 3,
    traits: [
      { name: 'Vista y olfato agudos', description: 'Ventaja en pruebas de Percepción que usen la vista o el olfato.' },
    ],
    actions: [
      { name: 'Multiataque', description: 'Dos ataques: uno de Garras y uno de Pico.' },
      { name: 'Garras', attackBonus: 7, damage: '2d6+4', damageType: 'cortante', description: 'Golpe: 11 (2d6+4) de daño de cortante.' },
      { name: 'Pico', attackBonus: 7, damage: '1d10+4', damageType: 'perforante', description: 'Golpe: 9 (1d10+4) de daño de perforante.' },
    ],
  }),
  mob({
    id: 'm2024-mimic',
    name: 'Emulo (Mimic)', size: 'Mediano', creatureType: 'Monstruosidad (transformador)', alignment: 'Neutral',
    ac: 12, hp: 58, hitDice: '9d8+18', speed: '15 pies',
    stats: { str: 17, dex: 12, con: 15, int: 5, wis: 13, cha: 8 },
    skills: { Sigilo: 5 }, senses: 'Visión en la oscuridad 60 pies, Pasiva 11',
    languages: '—',
    cr: 2,
    traits: [
      { name: 'Engaño (Forma imitar)', description: 'Mientras está quieto, es indistinguible de un objeto normal (baúl, puerta...).' },
      { name: 'Aglutinante (Adherente)', description: 'Las criaturas que tocan al emulo quedan **Agarradas** (salvación DES CD 13 o liberarse con acción y FUE 13).' },
      { name: 'Pseudoobjetos', description: 'Tolera golpes con la forma de objeto.' },
    ],
    actions: [
      { name: 'Mordisco', attackBonus: 5, damage: '1d8+3', damageType: 'perforante', description: 'Golpe: 7 (1d8+3) de daño de perforante.' },
      { name: 'Pseudo-pie', attackBonus: 5, damage: '1d6+3', damageType: 'contundente', description: 'Golpe: 6 (1d6+3) de daño de contundente.', range: 'Cuerpo a cuerpo (10 pies)' },
    ],
  }),
  mob({
    id: 'm2024-red-dragon-wyrmling',
    name: 'Cría de dragón rojo (Red Dragon Wyrmling)', size: 'Mediano', creatureType: 'Dragón', alignment: 'Caótico malvado',
    ac: 17, hp: 75, hitDice: '10d8+30', speed: '30 pies, vuelo 60 pies',
    stats: { str: 19, dex: 10, con: 17, int: 12, wis: 11, cha: 15 },
    skills: { Percepción: 4, Sigilo: 2 }, senses: 'Vista ciega 10 pies, Visión en la oscuridad 60 pies, Pasiva 14',
    languages: 'Dracónico',
    cr: 4,
    traits: [
      { name: 'Resistencia al fuego', description: 'El dragón es inmune al daño de fuego.' },
    ],
    actions: [
      { name: 'Mordisco', attackBonus: 6, damage: '1d10+4', damageType: 'perforante', description: 'Golpe: 9 (1d10+4) de daño de perforante más 3 (1d6) de fuego.', target: 'Cuerpo a cuerpo' },
      { name: 'Aliento de fuego (Recarga 5-6)', damage: '7d6', damageType: 'fuego', description: 'Cono de 15 pies (salvación de DES CD 13): 24 (7d6) de daño de fuego; éxito, la mitad.' },
    ],
  }),
  mob({
    id: 'm2024-manticore',
    name: 'Mantícora (Manticore)', size: 'Grande', creatureType: 'Monstruosidad', alignment: 'Legal malvado',
    ac: 14, hp: 68, hitDice: '8d10+24', speed: '30 pies, vuelo 50 pies',
    stats: { str: 17, dex: 16, con: 17, int: 7, wis: 12, cha: 8 },
    skills: { Percepción: 3 }, senses: 'Visión en la oscuridad 60 pies, Pasiva 13',
    languages: 'Común',
    cr: 3,
    traits: [
      { name: 'Colas de púas', description: 'La mantícora tiene 24 púas; se regeneran al terminar un descanso largo.' },
    ],
    actions: [
      { name: 'Multiataque', description: 'Tres ataques: dos con Garras y uno con Púas (o un Mordisco y dos púas).' },
      { name: 'Mordisco', attackBonus: 5, damage: '1d8+3', damageType: 'perforante', description: 'Golpe: 7 (1d8+3) de daño de perforante.' },
      { name: 'Garras', attackBonus: 5, damage: '1d6+3', damageType: 'cortante', description: 'Golpe: 6 (1d6+3) de daño de cortante.' },
      { name: 'Púas', attackBonus: 5, damage: '1d6+3', damageType: 'perforante', description: 'A distancia (20/60 pies). Golpe: 6 (1d6+3) más una púa gastada.', range: 'A distancia (20/60 pies)' },
    ],
  }),
  // ---------------- Lanzadores de conjuros ----------------
  mob({
    id: 'm2024-acolyte',
    name: 'Acólito (Acolyte)', size: 'Mediano', creatureType: 'Humanoide', alignment: 'Cualquiera',
    ac: 10, hp: 9, hitDice: '2d8', speed: '30 pies',
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 14, cha: 11 },
    skills: { Percepción: 4, Religión: 4 }, senses: 'Pasiva 14',
    languages: 'Común',
    cr: 1 / 4,
    traits: [],
    actions: [
      { name: 'Daga', attackBonus: 2, damage: '1d4', damageType: 'perforante', description: 'Cuerpo a cuerpo o a distancia (20/60 pies). Golpe: 2 (1d4) de daño de perforante.', range: 'Cuerpo a cuerpo o a distancia (20/60 pies)' },
    ],
    casting: { ability: 'WIS', level: 2, spellSaveDC: 12, spellAttackBonus: 4, spellbook: { Trucos: ['Luz', 'Llama sagrada'], 'Nivel 1': ['Curar heridas', 'Destello guía'] } },
  }),
  mob({
    id: 'm2024-druid',
    name: 'Druida (Druid)', size: 'Mediano', creatureType: 'Humanoide', alignment: 'Cualquiera',
    ac: 14, hp: 27, hitDice: '5d8+5', speed: '30 pies',
    stats: { str: 10, dex: 12, con: 13, int: 12, wis: 15, cha: 11 },
    skills: { Medicina: 4, Naturaleza: 4, Percepción: 5 }, senses: 'Pasiva 15',
    languages: 'Druídico, común',
    cr: 2,
    traits: [
      { name: 'Lanzamiento (Druida)', description: 'El druida es un lanzador de conjuros de 4º nivel (SAB, CD 12, +4).' },
    ],
    actions: [
      { name: 'Bastón', attackBonus: 2, damage: '1d6', damageType: 'contundente', description: 'Golpe: 3 (1d6) de daño de contundente.' },
    ],
    casting: { ability: 'WIS', level: 4, spellSaveDC: 12, spellAttackBonus: 4, spellbook: { Trucos: ['Llama producida'], 'Nivel 1': ['Onda de trueno', 'Curar heridas'], 'Nivel 2': ['Rayo lunar', 'Paso sin dejar huella'] } },
  }),
  mob({
    id: 'm2024-priest',
    name: 'Sacerdote (Priest)', size: 'Mediano', creatureType: 'Humanoide', alignment: 'Cualquiera',
    ac: 13, hp: 27, hitDice: '5d8+5', speed: '30 pies',
    stats: { str: 10, dex: 10, con: 12, int: 13, wis: 16, cha: 13 },
    skills: { Medicina: 7, Persuasión: 5, Religión: 5 }, senses: 'Pasiva 15',
    languages: 'Común',
    cr: 2,
    traits: [
      { name: 'Lanzamiento (Sacerdote)', description: 'El sacerdote es un lanzador de conjuros de 5º nivel (SAB, CD 13, +5).' },
    ],
    actions: [
      { name: 'Maza', attackBonus: 2, damage: '1d6', damageType: 'contundente', description: 'Golpe: 3 (1d6) de daño de contundente.' },
    ],
    casting: { ability: 'WIS', level: 5, spellSaveDC: 13, spellAttackBonus: 5, spellbook: { Trucos: ['Luz', 'Llama sagrada'], 'Nivel 1': ['Bendición', 'Curar heridas'], 'Nivel 2': ['Arma espiritual'], 'Nivel 3': ['Guardianes espirituales'] } },
  }),
  mob({
    id: 'm2024-mage',
    name: 'Mago (Mage)', size: 'Mediano', creatureType: 'Humanoide', alignment: 'Cualquiera',
    ac: 15, hp: 40, hitDice: '9d8', speed: '30 pies',
    stats: { str: 9, dex: 14, con: 14, int: 17, wis: 12, cha: 11 },
    skills: { Arcanos: 6, Historia: 6 }, senses: 'Pasiva 11',
    languages: 'Común y 4 lenguas',
    cr: 6,
    traits: [
      { name: 'Lanzamiento (Mago)', description: 'El mago es un lanzador de conjuros de 9º nivel (INT, CD 14, +6).' },
    ],
    actions: [
      { name: 'Daga', attackBonus: 5, damage: '1d4+2', damageType: 'perforante', description: 'Cuerpo a cuerpo o a distancia (20/60 pies). Golpe: 4 (1d4+2) de daño de perforante.', range: 'Cuerpo a cuerpo o a distancia (20/60 pies)' },
    ],
    casting: { ability: 'INT', level: 9, spellSaveDC: 14, spellAttackBonus: 6, spellbook: { Trucos: ['Bola de fuego (Fire Bolt)', 'Luz', 'Mano de mago', 'Prestidigitación'], 'Nivel 1': ['Detectar magia', 'Proyectil mágico', 'Escudo'], 'Nivel 2': ['Paso brumoso', 'Imagen especular'], 'Nivel 3': ['Contraconjuro', 'Bola de fuego (Fireball)'], 'Nivel 4': ['Portal dimensional'], 'Nivel 5': ['Cono de frío'] } },
  }),
  mob({
    id: 'm2024-archmage',
    name: 'Arquimago (Archmage)', size: 'Mediano', creatureType: 'Humanoide', alignment: 'Cualquiera',
    ac: 15, hp: 99, hitDice: '18d8+18', speed: '30 pies',
    stats: { str: 10, dex: 14, con: 16, int: 20, wis: 15, cha: 16 },
    skills: { Arcanos: 13, Historia: 13 }, senses: 'Pasiva 12',
    languages: 'Común y 5 lenguas',
    cr: 12,
    traits: [
      { name: 'Resistencia mágica', description: 'El arquimago tiene ventaja en salvaciones contra conjuros y otros efectos mágicos.' },
      { name: 'Lanzamiento (Arquimago)', description: 'El arquimago es un lanzador de conjuros de 18º nivel (INT, CD 17, +9).' },
    ],
    actions: [
      { name: 'Daga', attackBonus: 6, damage: '1d4+2', damageType: 'perforante', description: 'Cuerpo a cuerpo o a distancia (20/60 pies). Golpe: 4 (1d4+2) de daño de perforante.' },
    ],
    casting: { ability: 'INT', level: 18, spellSaveDC: 17, spellAttackBonus: 9, spellbook: { Trucos: ['Bola de fuego (Fire Bolt)', 'Rayo de escarcha', 'Mano de mago', 'Luz', 'Prestidigitación'], 'Nivel 1': ['Detectar magia', 'Proyectil mágico', 'Escudo'], 'Nivel 2': ['Invisibilidad', 'Paso brumoso', 'Imagen especular'], 'Nivel 3': ['Contraconjuro', 'Bola de fuego (Fireball)', 'Vuelo'], 'Nivel 4': ['Destierro', 'Portal dimensional'], 'Nivel 5': ['Cono de frío', 'Escudriñar'], 'Nivel 6': ['Cadena de relámpagos'], 'Nivel 7': ['Teletransporte'], 'Nivel 8': ['Campo antimagia'] } },
  }),
  mob({
    id: 'm2024-lich',
    name: 'Liche (Lich)', size: 'Mediano', creatureType: 'No muerto', alignment: 'Cualquiera malvado',
    ac: 17, hp: 135, hitDice: '18d8+54', speed: '30 pies',
    stats: { str: 11, dex: 16, con: 16, int: 20, wis: 14, cha: 16 },
    skills: { Arcanos: 18, Historia: 18, Percepción: 9, Perspicacia: 9 }, senses: 'Vista verdadera 120 pies, Pasiva 19',
    languages: 'Común y otras 5 lenguas',
    cr: 21,
    traits: [
      { name: 'Resistencia legendaria (3/día)', description: 'Si el liche falla una salvación, puede elegir tener éxito (3 veces al día).' },
      { name: 'Rejuvenecimiento', description: 'Si su filacteria es destruida y el liche muere, se reforma en 1d10 días.' },
      { name: 'Inmunidades', description: 'Inmune a daño de veneno y necrótico, y al daño de armas no mágicas. Condiciones: agotamiento y envenenado.' },
      { name: 'Lanzamiento (Liche)', description: 'El liche es un lanzador de conjuros de 18º nivel (INT, CD 20, +12).' },
    ],
    actions: [
      { name: 'Toque paralizante', attackBonus: 12, damage: '3d6', damageType: 'necrótico', description: 'Golpe: 10 (3d6) de daño necrótico. El objetivo (salvación de CON CD 20) queda **Paralizado** hasta el final de su siguiente turno.', target: 'Salvación CON 20' },
    ],
    legendary: [
      { name: 'Conjuro', description: 'El liche lanza un truco.' },
      { name: 'Toque', description: 'El liche usa su Toque paralizante.' },
    ],
    casting: { ability: 'INT', level: 18, spellSaveDC: 20, spellAttackBonus: 12, spellbook: { Trucos: ['Mano de mago', 'Rayo de escarcha', 'Prestidigitación'], 'Nivel 1': ['Detectar magia', 'Proyectil mágico', 'Escudo'], 'Nivel 2': ['Invisibilidad', 'Imagen especular', 'Paso brumoso'], 'Nivel 3': ['Contraconjuro', 'Bola de fuego (Fireball)'], 'Nivel 4': ['Portal dimensional'], 'Nivel 5': ['Escudriñar'], 'Nivel 6': ['Desintegrar'], 'Nivel 8': ['Palabra de poder: Aturdir'], 'Nivel 9': ['Palabra de poder: Matar'] } },
  }),
];