// ============================================================
// Tablas aleatorias para preparar sesión, sin IA: nombres de NPC
// por especie, ganchos de aventura, complicaciones y botín.
// Contenido curado a mano para esta app (no es texto del SRD).
// ============================================================

export interface NpcNameTable {
  /** Coincide con el id de SRD_SPECIES (sp-*) para poder tirar "según la especie elegida". */
  speciesId: string;
  speciesLabel: string;
  firstNames: string[];
  /** Apellidos, epítetos o apodos — se combinan con un nombre al tirar. */
  surnames: string[];
}

export const NPC_NAME_TABLES: NpcNameTable[] = [
  {
    speciesId: 'sp-human',
    speciesLabel: 'Humano',
    firstNames: [
      'Mateo', 'Elena', 'Bruno', 'Sofía', 'Ricardo', 'Ines', 'Tomás', 'Alba',
      'Diego', 'Marta', 'Hugo', 'Lucía', 'Simón', 'Clara', 'Andrés', 'Vera',
    ],
    surnames: [
      'Del Río', 'Ferreiro', 'Cuervo', 'Alba', 'Montes', 'Vega', 'Reyes', 'Duarte',
      'el Manco', 'la Tuerta', 'Sietelenguas', 'Ojoslistos',
    ],
  },
  {
    speciesId: 'sp-elf',
    speciesLabel: 'Elfo',
    firstNames: [
      'Aelar', 'Silveth', 'Thalion', 'Miriel', 'Erevan', 'Naivara', 'Caelis', 'Sylwen',
      'Ithrandir', 'Faelynn', 'Quenlyn', 'Rowanel',
    ],
    surnames: [
      'Susurrodeluna', 'del Bosque Alto', 'Hojaplateada', 'Vientolargo', 'de las Mil Hojas',
      'Cantaestrellas', 'Brisadorada',
    ],
  },
  {
    speciesId: 'sp-dwarf',
    speciesLabel: 'Enano',
    firstNames: [
      'Thorgrim', 'Brunhilda', 'Balin', 'Dagna', 'Kordrek', 'Helga', 'Torvald', 'Grimhild',
      'Nordan', 'Ulfr', 'Bardrin', 'Fjolla',
    ],
    surnames: [
      'Barbahierro', 'Puñoderoca', 'Cavaprofundo', 'Martillorojo', 'Yunquefirme',
      'de los Salones Hondos', 'Escudonegro',
    ],
  },
  {
    speciesId: 'sp-halfling',
    speciesLabel: 'Mediano',
    firstNames: [
      'Poncho', 'Rosalinda', 'Wilibaldo', 'Tomasina', 'Cedrico', 'Meli', 'Bartolo', 'Nona',
      'Tobías', 'Primrosa',
    ],
    surnames: [
      'Piesligeros', 'Buenaviaje', 'Barrigallena', 'Bolsillohondo', 'de la Colina Verde',
      'Manzanadulce',
    ],
  },
  {
    speciesId: 'sp-dragonborn',
    speciesLabel: 'Dragonborn',
    firstNames: [
      'Arjhan', 'Kriv', 'Balasar', 'Sora', 'Medrash', 'Nala', 'Torinn', 'Ghesh',
      'Rhogar', 'Vayeth',
    ],
    surnames: [
      'Garraveloz', 'Escamaférrea', 'Alientoardiente', 'Colmillorroto', 'Alagarra',
      'Fuegoclaro',
    ],
  },
  {
    speciesId: 'sp-gnome',
    speciesLabel: 'Gnomo',
    firstNames: [
      'Fizwidget', 'Nissa', 'Boddynock', 'Wrenna', 'Glim', 'Zanna', 'Podder', 'Fibbet',
      'Corvis', 'Tinka',
    ],
    surnames: [
      'Chispaveloz', 'Tornillosuelto', 'Relojfino', 'Fuellealegre', 'Ruedaloca',
      'Destellobreve',
    ],
  },
  {
    speciesId: 'sp-goliath',
    speciesLabel: 'Goliath',
    firstNames: [
      'Kuldrek', 'Vaunea', 'Threska', 'Orvun', 'Naga', 'Boruk', 'Isskar', 'Vell',
    ],
    surnames: [
      'que No Retrocede', 'Rompepiedra', 'de Voz Grave', 'que Cruzó la Grieta',
      'Puñofrío', 'Guardacumbre',
    ],
  },
  {
    speciesId: 'sp-orc',
    speciesLabel: 'Orco',
    firstNames: [
      'Grukk', 'Vasha', 'Morgul', 'Uzuk', 'Draka', 'Hurok', 'Zasha', 'Bruga',
    ],
    surnames: [
      'Rompecráneos', 'Colmillonegro', 'Puñofuerte', 'Sangrefría', 'Machacahuesos',
      'de las Tierras Bajas',
    ],
  },
  {
    speciesId: 'sp-tiefling',
    speciesLabel: 'Tiefling',
    firstNames: [
      'Akmenos', 'Lirielle', 'Damakos', 'Orianna', 'Kairon', 'Nyx', 'Ravel', 'Seraphine',
    ],
    surnames: [
      'Sombraeterna', 'Cenizanegra', 'Almacurtida', 'Susurronocturno', 'Marcadestino',
      'Vozgraveada',
    ],
  },
  {
    speciesId: 'sp-aasimar',
    speciesLabel: 'Aasimar',
    firstNames: [
      'Amariel', 'Zaphael', 'Seraphina', 'Threnody', 'Micah', 'Auralei', 'Corvael', 'Talissa',
    ],
    surnames: [
      'Luzquieta', 'Alasdealba', 'Bendecidoporerror', 'Vozdelalto', 'Guiaperdida',
      'Corazónfirme',
    ],
  },
];

/** Ganchos de aventura genéricos, listos para adaptar a la campaña propia. */
export const ADVENTURE_HOOKS: string[] = [
  'Un mercader ofrece una fortuna a quien recupere un cargamento robado hace tres noches, pero no dice qué llevaba realmente.',
  'Los animales de la zona huyen en masa hacia el pueblo, como si algo los espantara desde el bosque.',
  'Un miembro del party recibe una carta de alguien que creía muerto.',
  'El agua del pozo del pueblo empezó a saber a metal, y dos aldeanos ya cayeron enfermos.',
  'Una noble ofrece protección a cambio de escoltar una caravana por un camino que todos evitan.',
  'Aparecen luces extrañas cada noche en las ruinas cercanas, siempre a la misma hora.',
  'Un guardia corrupto pide ayuda para encubrir algo que él mismo hizo, y amenaza con culpar al party si se niegan.',
  'Un niño asegura haber visto a su hermano desaparecido, pero nadie más lo cree.',
  'Se ofrece una recompensa por capturar viva a una criatura que hasta ahora solo mató ganado.',
  'Un viejo mapa aparece cosido dentro del abrigo de un cadáver que el party encuentra por casualidad.',
  'El gremio local exige una cuota que nadie recuerda haber aceptado pagar, o cierran el negocio del contacto del party.',
  'Una tormenta fuera de estación arruinó la cosecha, y algunos culpan a un brujo del pueblo vecino.',
  'Un templo pide ayuda para escoltar una reliquia, sin explicar por qué no confían en su propia guardia.',
  'Alguien está pagando muy bien por libros muy específicos, sin importar el tema, siempre y cuando sean "viejos de verdad".',
  'Un rival de toda la vida aparece pidiendo ayuda, jurando que esta vez es diferente.',
  'Un contacto desaparece justo antes de una reunión importante, dejando solo una nota a medio escribir.',
  'Las patrullas de la zona reportan huellas de un tamaño imposible, siempre alejándose del camino principal.',
  'Un festival local se ve interrumpido por un forastero que jura reconocer a alguien del party.',
  'Una posada entera queda en cuarentena por una "enfermedad" que nadie sabe explicar bien.',
  'Un artefacto menor que el party ya tiene empieza a comportarse distinto cerca de cierto lugar.',
  'Alguien ofrece pagar el doble si el trabajo se hace sin hacer preguntas.',
  'Un mensajero herido llega con un pedido de auxilio y muere antes de poder decir de dónde venía.',
  'Se corre el rumor de que la última expedición al mismo lugar volvió, pero nadie quiere hablar con ellos.',
  'Una disputa entre dos facciones locales necesita un tercero neutral — y nadie más quiere el puesto.',
];

/** Complicaciones para insertar en un encuentro o una escena en curso. */
export const COMPLICATIONS: string[] = [
  'Refuerzos inesperados llegan al lugar dos rondas después de empezado el encuentro.',
  'El terreno cede: una parte del área se vuelve difícil o directamente intransitable.',
  'Un civil (o rehén) queda atrapado en medio del conflicto y necesita que alguien lo saque.',
  'Se corta la luz o la fuente de iluminación principal se apaga a mitad de la escena.',
  'Un aliado del party revela que en realidad tiene otro objetivo en mente.',
  'El enemigo principal intenta negociar o rendirse justo cuando parecía perdido.',
  'Empieza una tormenta, temblor o fenómeno similar que afecta a todos por igual.',
  'Alguien reconoce a un miembro del party de un encuentro pasado — para bien o para mal.',
  'El objetivo real de la escena no es el que parecía a simple vista.',
  'Una tercera facción interviene, con intereses propios que no coinciden con ninguno de los bandos.',
  'Una trampa que nadie activó a propósito se dispara igual, por descuido o mala suerte.',
  'El tiempo apremia: algo va a pasar en X rondas si el party no actúa antes.',
  'Un ruido o señal atrae la atención de más criaturas de las que el party esperaba.',
  'Uno de los NPCs presentes miente sobre algo importante desde el principio de la escena.',
  'El botín o el objetivo de la misión resulta estar dañado, incompleto o ser una falsificación.',
  'Alguien del party queda separado del resto por un derrumbe, una puerta que se cierra o similar.',
];

export type LootTier = 'bajo' | 'medio' | 'alto' | 'legendario';

export interface LootEntry {
  text: string;
  /** Rango de piezas de oro asociado (además del objeto/texto). */
  goldMin: number;
  goldMax: number;
}

export const LOOT_TIER_LABELS: Record<LootTier, string> = {
  bajo: 'Bajo (CR 0-4)',
  medio: 'Medio (CR 5-10)',
  alto: 'Alto (CR 11-16)',
  legendario: 'Legendario (CR 17+)',
};

/**
 * Botín curado a mano, sin ser una réplica literal de las tablas de tesoro
 * del DMG — pensado como punto de partida rápido, no como reemplazo.
 */
export const LOOT_TABLES: Record<LootTier, LootEntry[]> = {
  bajo: [
    { text: 'Un puñado de monedas de cobre y plata en un saquito gastado.', goldMin: 5, goldMax: 25 },
    { text: 'Una daga con el mango tallado, de fabricación decente pero sin magia.', goldMin: 2, goldMax: 10 },
    { text: 'Un frasco de una poción sin etiqueta — habrá que identificarla.', goldMin: 10, goldMax: 30 },
    { text: 'Un anillo de cobre sin valor mágico, pero con una inscripción curiosa.', goldMin: 1, goldMax: 5 },
    { text: 'Provisiones para varios días y un mapa parcial de la zona.', goldMin: 0, goldMax: 5 },
    { text: 'Un instrumento musical simple, algo desafinado.', goldMin: 3, goldMax: 15 },
  ],
  medio: [
    { text: 'Una bolsa de monedas de plata y oro, con el sello de un gremio local.', goldMin: 50, goldMax: 150 },
    { text: 'Un arma con un pequeño detalle poco común (no necesariamente mágica).', goldMin: 25, goldMax: 100 },
    { text: 'Una gema pulida de valor moderado.', goldMin: 50, goldMax: 200 },
    { text: 'Un pergamino con un conjuro escrito, listo para copiar o usar una vez.', goldMin: 20, goldMax: 80 },
    { text: 'Una pieza de joyería fina, con el emblema de una casa noble.', goldMin: 75, goldMax: 250 },
    { text: 'Un objeto que reacciona levemente a la magia — probablemente encantado.', goldMin: 100, goldMax: 300 },
  ],
  alto: [
    { text: 'Un cofre con monedas de oro y platino, bien asegurado.', goldMin: 300, goldMax: 800 },
    { text: 'Un arma o pieza de armadura con una propiedad mágica menor identificable.', goldMin: 500, goldMax: 1500 },
    { text: 'Un conjunto de gemas raras, cada una de un color distinto.', goldMin: 400, goldMax: 1000 },
    { text: 'Un tomo con conocimiento poco común, de interés para algún erudito o gremio.', goldMin: 200, goldMax: 600 },
    { text: 'Un objeto mágico menor pero con carga limitada (usos antes de agotarse).', goldMin: 600, goldMax: 1200 },
  ],
  legendario: [
    { text: 'Un tesoro amplio en oro, platino y gemas, digno de una crónica.', goldMin: 2000, goldMax: 6000 },
    { text: 'Un objeto mágico mayor, con al menos una propiedad significativa.', goldMin: 5000, goldMax: 15000 },
    { text: 'Una reliquia con historia propia — alguien más también la busca.', goldMin: 3000, goldMax: 10000 },
    { text: 'Un artefacto sin igual conocido: su verdadero valor no se mide en oro.', goldMin: 1000, goldMax: 3000 },
  ],
};
