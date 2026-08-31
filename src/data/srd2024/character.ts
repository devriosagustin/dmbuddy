// ============================================================
// SRD 5.2 - Clases, especies y dotes (2024)
// Contenido curado resumido, CC-BY-4.0
// ============================================================

import type { SrdClassEntry, SrdFeatEntry, SrdSpeciesEntry, SpeciesStatBonusOption } from '../../types/srd2024';
import { STAT_LABELS } from '../../types';
import type { StatAbbrev } from '../../types';

// ---------------- Clases ----------------

interface Cl {
  id: string;
  name: string;
  ability: string;
  hitDice: string;
  armor: string;
  saves: string[];
  /** Número de habilidades con competencia que la clase otorga al nivel 1. */
  skills: number;
  body: string;
}

const cl = (c: Cl): SrdClassEntry => ({
  id: c.id,
  title: c.name,
  category: 'classes',
  source: 'srd2024',
  tags: ['SRD 2024', 'Clase'],
  primaryAbility: c.ability,
  hitDice: c.hitDice,
  armorProficiency: c.armor,
  saves: c.saves,
  skills: c.skills,
  content: c.body,
});

export const SRD_CLASSES: SrdClassEntry[] = [
  cl({
    id: 'class-barbarian', name: 'Bárbaro', ability: 'Fuerza', hitDice: 'd12',
    armor: 'Armaduras ligeras y medianas, escudos', saves: ['FUE', 'CON'], skills: 2,
    body: `Furia combativa imparable: **Ira** (daño +2/+3/+4, resistencia a daño contundente/ perforante/ cortante al nivel 3+) y **Ataque Temerario** (ventaja a cambio de ventaja del enemigo).\n\n**Primarias (nivel 1):** Ira, Defensa sin armadura (CA = 10 + DES + CON).\n**Mejoras:** Ataque adicional (5º y 11º), Atlético, Instinto peligroso al 14º.`,
  }),
  cl({
    id: 'class-bard', name: 'Bardo', ability: 'Carisma', hitDice: 'd8',
    armor: 'Armaduras ligeras', saves: ['DES', 'CAR'], skills: 3,
    body: `Artista magistral de los **Secretos mágicos** y la **Inspiración bárdica** (d6→d12 añadida a una tirada de aliado).\n\n**Primarias:** Inspiración bárdica, Conjuros (lanza con CAR, comienza con 2 trucos y 2 espacios), Encanto.\n**Mejoras:** Pericia (2º), Bard College (3º), Experto en secretos (10º).`,
  }),
  cl({
    id: 'class-cleric', name: 'Clérigo', ability: 'Sabiduría', hitDice: 'd8',
    armor: 'Armaduras, escudos', saves: ['SAB', 'CAR'], skills: 2,
    body: `Sirviente divino con acceso al **Dominio** (Luz, Vida, Guerra...) que otorga conjuros de dominio y rasgos a nivel 1, 2 y 6.\n\n**Primarias:** Lanzamiento de conjuros (con SAB), Orden divino: **Destruir no muertos** (2º+), Lanzamiento de canalizar divinidad.\n**Mejoras:** Curación mejorada, **Comunión divina** (guía de los dioses), Resurrección.`,
  }),
  cl({
    id: 'class-druid', name: 'Druida', ability: 'Sabiduría', hitDice: 'd8',
    armor: 'Armaduras ligeras y medianas (no metálicas), escudos', saves: ['INT', 'SAB'], skills: 2,
    body: `Guardiana de la naturaleza: **Forma salvaje** (transformarse en bestias) y lanzamiento de conjuros naturales.\n\n**Primarias:** Conjuros (SAB), Forma Salvaje (2º, con CR y velocidades crecientes), Círculo druídico (2º: Tierra, Luna...).\n**Mejoras:** Dormir en la naturaleza sin supervivencia, Inmunidad a veneno, Forma de bestia de alto CR (8º+).`,
  }),
  cl({
    id: 'class-fighter', name: 'Guerrero', ability: 'Fuerza o Destreza', hitDice: 'd10',
    armor: 'Todas las armaduras y escudos', saves: ['FUE', 'CON'], skills: 2,
    body: `Experto en armas: **Estilo de Combate**, **Acción Extra** (2º), **Indomable** (relanza salvaciones), **Ataque adicional** (5º y 11º).\n\n**2024 nuevo:** **Dominio de armas** — cada arma ofrece una técnica especial (Abrir brecha, Lacerar, Derribar, Hacha arrojadiza...).\n**Subclase:** Campeón (crítico en 19), Caballero de magia (conjuros).`,
  }),
  cl({
    id: 'class-monk', name: 'Monje', ability: 'Destreza y Sabiduría', hitDice: 'd8',
    armor: 'Sin armadura', saves: ['FUE', 'DES'], skills: 2,
    body: `Maestro del combate sin armas: **Artes Marciales**, **Defensa sin Armadura**, **Puntos de Ki** (realizan técnicas: Ráfaga de Golpes, Paso del Viento, Mano Abierta...).\n\n**2024:** el recurso se llama **Puntos de Enfoque**; al 2º obtienes **Deflectar Proyectiles**.\n**Subclase:** Camino de las 4 Elementos (lanzamiento con conjuros).`,
  }),
  cl({
    id: 'class-paladin', name: 'Paladín', ability: 'Fuerza y Carisma', hitDice: 'd10',
    armor: 'Todas las armaduras y escudos', saves: ['SAB', 'CAR'], skills: 2,
    body: `Cruzado sagrado: **Sentido Divino**, **Imposición de Manos** (curación), **Golpe Divino** (2024: gasta espacio de conjuro para añadir daño radiante).\n\n**Juramento (3º):** Devoción, Venganza, Ancianos... otorgan conjuros de juramento.\n**Mejoras:** Aura de protección (6º), Mejora de Aura (18º), Golpes extra.`,
  }),
  cl({
    id: 'class-ranger', name: 'Guardabosques', ability: 'Destreza y Sabiduría', hitDice: 'd10',
    armor: 'Armaduras ligeras y medianas, escudos', saves: ['FUE', 'DES'], skills: 3,
    body: `Cazador de la frontera: **Marca del cazador** (2024, rasgo de nivel 1), conjuros (nivel 2+), **Compañero bestia** (primaveral, nivel 3, opción).\n\n**Primarias:** Enemigo favorito→ **Explorador**, Sigilo y supervivencia.\n**Mejoras:** Ataque adicional (5º), Evasión al 15º, Paso fantasma (18º).`,
  }),
  cl({
    id: 'class-rogue', name: 'Pícaro', ability: 'Destreza', hitDice: 'd8',
    armor: 'Armaduras ligeras', saves: ['DES', 'INT'], skills: 4,
    body: `Especialista en emboscadas: **Ataque Furtivo** (d6 extra por nivel cuando tiene ventaja o un aliado está en contacto), **Acción Astuta** (Esconderse/ Carrera / Separarse como bonus action).\n\n**Primarias:** Pericia, Ladrón...\n**Mejoras:** Esquiva increíble (5º), Talento para evitar (7º), Sigilo absoluto (11º).`,
  }),
  cl({
    id: 'class-sorcerer', name: 'Hechicero', ability: 'Carisma', hitDice: 'd6',
    armor: 'Sin armaduras', saves: ['CON', 'CAR'], skills: 2,
    body: `Magia innata: **Metamagia** (2024: puntos de hechicería que gastas en Metamagia y en **Hechicería Innata**), lanzamiento con CAR.\n\n**Metamágicas populares (3º):** Conjuro con dos objetivos, Conjuro doblado, Conjuro prolongado, Conjuro espejado.\n**Orígenes (1º):** Línea dracónica, Mago salvaje (erupción de magia caótica).`,
  }),
  cl({
    id: 'class-warlock', name: 'Brujo', ability: 'Carisma', hitDice: 'd8',
    armor: 'Armaduras ligeras y medianas, escudos', saves: ['SAB', 'CAR'], skills: 2,
    body: `Pacto con un ser extraño. **Magia del Pacto:** espacios de conjuro de máximo nivel que se recuperan en un **descanso corto**. Las **Invocaciones Místicas** personalizan tu pacto.\n\n**1º:** Patrón (El Arquefey, El Infernal, El Gran Antiguo...), dado arcano y trucos.\n**Subclases:** Pactos (Cadena, Hoja, Tomo) que añaden rasgos.\n**9º+:** Arcano Mayor, un conjuro de alto nivel por día.`,
  }),
  cl({
    id: 'class-wizard', name: 'Mago', ability: 'Inteligencia', hitDice: 'd6',
    armor: 'Sin armaduras', saves: ['INT', 'SAB'], skills: 2,
    body: `Erudito arcano que prepara conjuros de su **libro de conjuros**. **Recuperación Arcana:** recuperación de espacios en un descanso corto.\n\n**Primarias:** Lanzamiento de conjuros (INT), Grimorio, Cantrip versátil.\n**Escuelas (2º):** Abjuración, Evocación, Ilusión, Nigromancia... con Magia estable (protecciones adicionales).`,
  }),
];

// ---------------- Especies ----------------

interface Sp {
  id: string;
  name: string;
  size: string;
  speed: number;
  traits: string[];
  body: string;
  /** Asignaciones de bonos raciales (se aplican a las características). */
  bonus?: SpeciesStatBonusOption[];
}

const sp = (s: Sp): SrdSpeciesEntry => ({
  id: s.id,
  title: s.name,
  category: 'species',
  source: 'srd2024',
  tags: ['SRD 2024', 'Especie'],
  size: s.size,
  speed: s.speed,
  traits: s.traits,
  statBonus: s.bonus,
  content: s.body,
});

// -------- Bonos raciales (2024) --------

const ABILITIES: StatAbbrev[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const bonusLabel = (stats: Partial<Record<StatAbbrev, number>>): string =>
  Object.entries(stats)
    .map(([k, v]) => `${STAT_LABELS[k as StatAbbrev]} ${(v as number) >= 0 ? `+${v}` : v}`)
    .join(' · ');

const one = (stats: Partial<Record<StatAbbrev, number>>): SpeciesStatBonusOption => ({
  stats,
  label: bonusLabel(stats),
});

/** Todas las asignaciones "+2 a un atributo y +1 a otro distinto". */
const plusTwoPlusOne = (): SpeciesStatBonusOption[] => {
  const out: SpeciesStatBonusOption[] = [];
  for (const main of ABILITIES) {
    for (const second of ABILITIES) {
      if (main === second) continue;
      const stats: Partial<Record<StatAbbrev, number>> = { [main]: 2, [second]: 1 };
      out.push({ stats, label: bonusLabel(stats) });
    }
  }
  return out;
};

/** Todas las asignaciones "+1 a tres atributos distintos" (Humano). */
const plusOneTres = (): SpeciesStatBonusOption[] => {
  const out: SpeciesStatBonusOption[] = [];
  for (let i = 0; i < ABILITIES.length; i++) {
    for (let j = i + 1; j < ABILITIES.length; j++) {
      for (let k = j + 1; k < ABILITIES.length; k++) {
        const stats: Partial<Record<StatAbbrev, number>> = {
          [ABILITIES[i]]: 1,
          [ABILITIES[j]]: 1,
          [ABILITIES[k]]: 1,
        };
        out.push({ stats, label: bonusLabel(stats) });
      }
    }
  }
  return out;
};

export const SRD_SPECIES: SrdSpeciesEntry[] = [
  sp({
    id: 'sp-aasimar', name: 'Aasimar', size: 'Mediano o Pequeño', speed: 30,
    traits: ['Visión celestial (visión en la oscuridad 60 pies)', 'Resistencia al daño radiante', 'Sanación con toque', 'Manifestación celestial'],
    bonus: [...plusTwoPlusOne(), ...plusOneTres()],
    body: `Descendiente de ángeles o seres celestiales. Obtienes **Visión celestial**, **Resistencia radiante** (1/long descanso, te curas 2x nivel) y una **Manifestación celestial** (alas, aura, mirada) a nivel 3.\n\nCon +2 a un atributo y +1 a otro a tu elección.`,
  }),
  sp({
    id: 'sp-dragonborn', name: 'Dragonborn', size: 'Mediano', speed: 30,
    traits: ['Aliento dracónico (6d6 radio/cono)', 'Afinidad elemental (resistencia al daño)', 'Garras o vuelo según linaje'],
    bonus: [one({ str: 2, cha: 1 })],
    body: `Heredero de linajes dracónicos: **Aliento dracónico** (cono o línea de 15-30 pies con daño elemental por linaje) y **Resistencia elemental**.\n\nAl nivel 5, el aliento hace +1d6. Puede usarse un número de veces igual al bono de CON (se recupera en descansos cortos/largos).`,
  }),
  sp({
    id: 'sp-dwarf', name: 'Enano', size: 'Mediano', speed: 30,
    traits: ['Visión en la oscuridad', 'Resistencia enana (ventaja en veneno/daño veneno)', 'Construcción enana (85 pies de carga)', 'Resistencia a la magia'],
    bonus: [one({ con: 2, str: 1 }), one({ con: 2, wis: 1 })],
    body: `Robusto artesano de las montañas: **Resistencia enana** (ventaja en salvaciones y resistencia al daño de veneno), **Construcción enana** (velocidad sin penalización con armadura) y preferencia por hachas y martillos.\n\n+2 CON, +1 FUE o SAB.`,
  }),
  sp({
    id: 'sp-elf', name: 'Elfo', size: 'Mediano', speed: 30,
    traits: ['Visión en la oscuridad', 'Sueño trance (4 horas = 8 de descanso)', 'Ventaja contra encantamiento', 'Entrenamiento élfico (arcos/espadas)'],
    bonus: [one({ int: 2 }), one({ wis: 2 }), one({ dex: 2 })],
    body: `Gracia y longevidad: **Trance** (4 horas de meditación equivalen a un descanso largo), **Visión en la oscuridad**, ventaja contra **Encantado** y resistencia a la magia que duerme.\n\nSublíneas: Alto Elfo (Inteligencia), Elfo del Bosque (Sabiduría, sigilo algo élfico), Elfo Oscuro (la oscuridad y +2 DES).`,
  }),
  sp({
    id: 'sp-gnome', name: 'Gnomo', size: 'Pequeño', speed: 25,
    traits: ['Visión en la oscuridad', 'Astucia gnómica (ventaja INT/SAB/CAR vs magia)', 'Especialista de la naturaleza (libre flores/piedras)'],
    bonus: [one({ int: 2 })],
    body: `Pequeño pero ingenioso: **Astucia gnómica** te da ventaja en salvaciones de INT, SAB y CAR contra magia, y recuerdas cualquier contacto con ella.\n\nLanzar un truco de tu especialidad (Bosque: Piel rugosa a voluntad; Roca: Comprobar ser piedra). +2 INT.`,
  }),
  sp({
    id: 'sp-goliath', name: 'Goliath', size: 'Mediano', speed: 35,
    traits: ['Aguantes de tormenta (reducir daño con reacción)', 'Poder gigante (apalancamiento relámpago)', 'Alpinista natural'],
    bonus: [one({ str: 2, con: 1 })],
    body: `Gigantes de las montañas: **Aguantes de tormenta** (reducción de daño igual a tu bono de FUE, 2 veces por descanso), **Poder gigante** (aumenta el tamaño que puedes levantar) y resistencia al frío.\n\n+2 FUE, +1 CON. Velocidad de 35 pies.`,
  }),
  sp({
    id: 'sp-halfling', name: 'Mediano', size: 'Pequeño', speed: 30,
    traits: ['Suerte (repetir un 1 natural)', 'Valentía (ventaja vs asustado)', 'Parkour natural (atravesar espacios de criaturas Medias)'],
    bonus: [one({ dex: 2 })],
    body: `Duendes altruistas de la suerte: **Suerte** te permite **repetir un 1 natural** en tiradas de ataque, prueba o salvación, pero debes quedarte con el nuevo resultado.\n\n**Valentía:** ventaja contra el asustado. **Parkour:** te mueves por espacios de criaturas Medias o Enormes y escalas sin penalización.\n\nSub: Caladar, Medianos robusto. +2 DES.`,
  }),
  sp({
    id: 'sp-human', name: 'Humano', size: 'Mediano o Pequeño', speed: 30,
    traits: ['Versatilidad (+1 a 3 atributos distintos)', 'Habilidad de origen (una dote de origen)', 'Lenguas y cultura adaptable'],
    bonus: plusOneTres(),
    body: `La especie más adaptable: **+1 a tres atributos distintos** y una **Dote de origen** a nivel 1 (p. ej. Competente, Curandero, Luchador de taberna).\n\nPerfecto para cualquier clase o trasfondo.`,
  }),
  sp({
    id: 'sp-orc', name: 'Orco', size: 'Mediano', speed: 30,
    traits: ['Visión en la oscuridad', 'Resistencia fiera (vuelve a 1 PG y permanece en pie)', 'Poder de Adrenale (impulso de velocidad)'],
    bonus: [one({ str: 2, con: 1 })],
    body: `Guerreros de la naturaleza: **Adrenalina** (2024: tras un descanso corto o largo, obtienes una **Acción de Bonificación** extra para cargar), **Resistencia fiera** (al caer a 0 PG y no morir, vuelves a 1 PG una vez por descanso largo) y trastes de caza.\n\n+2 FUE, +1 CON. Visión en la oscuridad 60 pies.`,
  }),
  sp({
    id: 'sp-tiefling', name: 'Tiefling', size: 'Mediano o Pequeño', speed: 30,
    traits: ['Visión en la oscuridad', 'Resistencia al fuego', 'Entretejer el infierno (rasgos según ascendencia)'],
    bonus: [one({ cha: 2, dex: 1 })],
    body: `Descendiente de infernales: **Resistencia al fuego** y **Visión en la oscuridad**, además de rasgos según tu ascendencia (trucos como Prestidigitación, Oscuridad, Manos ardientes...).\n\n+2 CAR, +1 DES.`,
  }),
];

// ---------------- Dotes ----------------

interface Fe {
  id: string;
  name: string;
  prereq?: string;
  type: 'origin' | 'general';
  body: string;
  spellBoosts?: { cantrips?: number; spells?: number; minSpellLevel?: number };
  skillBoosts?: number;
}

const fe = (f: Fe): SrdFeatEntry => ({
  id: f.id,
  title: f.name,
  category: 'feats',
  source: 'srd2024',
  tags: ['SRD 2024', f.type === 'origin' ? 'Dote de origen' : 'Dote general'],
  prerequisite: f.prereq,
  type: f.type,
  content: f.body,
  spellBoosts: f.spellBoosts,
  skillBoosts: f.skillBoosts,
});

export const SRD_FEATS: SrdFeatEntry[] = [
  fe({ id: 'feat-alert', name: 'Alerta', type: 'general', body: `**Alerta**\n\n+5 a tu **iniciativa** y obtienes **iniciativa 10** en combate.\n\nAdemás, no puedes estar **sorprendido** mientras estés consciente y tienes ventaja para detectar criaturas ocultas cercanas.` }),
  fe({ id: 'feat-chef', name: 'Chef', type: 'general', body: `**Chef**\n\n+1 a CON o DES. Preparas comida que otorga a tus aliados **1d8 PG temporales** tras un descanso corto y tienes ventaja para preparar comida rápida en el descanso.` }),
  fe({ id: 'feat-crossbow-expert', name: 'Experto en ballestas', type: 'general', body: `**Experto en ballestas** (+1 DES)\n\nIgnoras la **propiedad de carga** de las ballestas. No sufres desventaja por atacar a distancia en combate cuerpo a cuerpo y puedes disparar una segunda vez si tu primera está cargada con ataque adicional.` }),
  fe({ id: 'feat-dual-wielder', name: 'Luchador con doble empuñadura', type: 'general', body: `**Luchador con doble empuñadura** (+1 DES)\n\nPuedes usar **armas de una mano con la propiedad Versátil** en cada mano, y obtienes un **Ataque de Oportunidad** contra quien rodea tu espacio. +1 a CA mientras empuñas dos armas.` }),
  fe({ id: 'feat-gwm', name: 'Gran arma maestra', type: 'general', body: `**Gran arma maestra** (+1 FUE)\n\nCon armas con la propiedad **Dos manos**, cuando lanzas un **crítico** o reduces una criatura a 0 PG, haces un **ataque adicional como Acción de Bonificación**. También obtienes +1 a FUE.` }),
  fe({ id: 'feat-healer', name: 'Curandero', type: 'origin', body: `**Curandero**\n\nEres experto en primeros auxilios: como **Acción** puedes estabilizar a una criatura con 0 PG y curarle 1 PG. Con un **botiquín**, curas 1d4+4 PG una vez por descanso.` }),
  fe({ id: 'feat-inspiring-leader', name: 'Líder inspirador', type: 'origin', body: `**Líder inspirador**\n\nTras un descanso corto o largo, dedicas 10 minutos a arengar a tus aliados: cada uno gana **PG temporales iguales a tu nivel + tu bono de CAR**.` }),
  fe({ id: 'feat-magic-initiate', name: 'Iniciado en magia', type: 'origin', spellBoosts: { cantrips: 2, spells: 1, minSpellLevel: 1 }, body: `**Iniciado en magia**\n\nAprendes **2 trucos** de una lista de conjuro a tu elección y **1 conjuro de nivel 1** que puedes lanzar una vez por día largo.\n\nVuelve a lanzarlo con tus espacios si eres lanzador.` }),
  fe({ id: 'feat-observant', name: 'Observador', type: 'general', body: `**Observador** (+1 SAB)\n\nTu **Percepción pasiva** aumenta en 5. Eres experto en detectar detalles: ventaja para encontrar un objeto específico entre otros.` }),
  fe({ id: 'feat-sentinel', name: 'Centinela', type: 'general', body: `**Centinela**\n\nCuando golpeas a una criatura dentro de tu alcance con un **Ataque de Oportunidad**, su velocidad se reduce a 0 ese turno.\n\nLas criaturas a 5 pies provocan tu oportunidad aunque se retiren con **Separarse**, y puedes golpear a quien ataca a un aliado adyacente.` }),
  fe({ id: 'feat-sharpshooter', name: 'Tirador de élite', type: 'general', body: `**Tirador de élite** (+1 DES)\n\nIgnoras la **desventaja** cuando atacas a larga distancia o contra criaturas con **cobertura media/tres cuartos**, y obtienes una dote extra de elegir objetivo.` }),
  fe({ id: 'feat-shield-master', name: 'Maestro de escudo', type: 'general', body: `**Maestro de escudo** (+1 FUE)\n\nEn tu **Acción de Bonificación** puedes empujar (Artículo: FUE vs FUE/DES) a una criatura adyacente 5 pies.\n\nComo reacción a un conjuro que exija salvación de DES, obtienes +2 con tu escudo (si altura) y puedes evitar el daño de área.` }),
  fe({ id: 'feat-skilled', name: 'Competente', type: 'origin', skillBoosts: 3, body: `**Competente** (+1 INT, SAB o CAR)\n\nObtienes **competencia en tres habilidades** a tu elección. Con Pericia de Pícaro/Bardo, duplica los usos.` }),
  fe({ id: 'feat-tough', name: 'Robusto', type: 'general', body: `**Robusto**\n\nTu máximo de **PG aumenta en 2 por nivel** (incluye los niveles ya obtenidos).` }),
  fe({ id: 'feat-war-caster', name: 'Lanzador de combate', type: 'general', body: `**Lanzador de combate**\n\nTienes **ventaja** en las pruebas de **Constitución para mantener la concentración**.\n\nPuedes realizar **conjuros con componente S** con las manos ocupadas y usar un conjuro en lugar de un **Ataque de Oportunidad** (con tiempo de 1 acción, solo contra ti como objetivo).` }),
  fe({ id: 'feat-savage-attacker', name: 'Atacante salvaje', type: 'general', body: `**Atacante salvaje**\n\nUna vez por turno, cuando haces daño con un ataque, puedes **relanzar el daño** y usar el resultado que prefieras.` }),
  fe({ id: 'feat-grappler', name: 'Agarrador', type: 'general', body: `**Agarrador** (+1 FUE o DES)\n\nAl **agarrar**, obtienes ventaja en la prueba de Atletismo. Las criaturas **Agarradas** que intentan liberarse tienen desventaja, y mientras las agarras no te ralentizan.` }),
  fe({ id: 'feat-elemental-adept', name: 'Adepto elemental', type: 'general', body: `**Adepto elemental** (+1 INT)\n\nEliges un tipo de daño elemental (fuego, frío, relámpago...): ignora la **resistencia** de las criaturas a ese daño y tratas los **1s del dado** como resultado máximo al lanzar daño de ese tipo.` }),
  fe({ id: 'feat-mage-slayer', name: 'Cazador de magos', type: 'general', body: `**Cazador de magos**\n\nLos lanzadores que te atacan con conjuros tienen **desventaja** en las pruebas de Concentración. Puedes usar tu **reacción** para atacar a quien lanza un conjuro a 5 pies.` }),
];