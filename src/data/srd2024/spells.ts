// ============================================================
// SRD 5.2 - Conjuros (2024)
// Selección curada del repertorio oficial, CC-BY-4.0.
// Cada conjuro es filtrable por nivel, escuela y clase.
// ============================================================

import type { SrdSpellEntry, SpellSchool } from '../../types/srd2024';

interface Sp {
  id: string;
  level: number;
  school: SpellSchool;
  time: string;
  range: string;
  comp: string;
  duration: string;
  conc?: boolean;
  ritual?: boolean;
  classes: string[];
  damage?: string;
  upcast?: string;
  content: string;
}

const sp = (s: Sp): SrdSpellEntry => ({
  id: s.id,
  title: s.content.split('\n')[0].trim().replace(/^\*+|\*+$/g, ''),
  category: 'spells',
  source: 'srd2024',
  tags: ['SRD 2024', s.school, s.level === 0 ? 'Truco' : `Nivel ${s.level}`],
  level: s.level,
  school: s.school,
  castingTime: s.time,
  range: s.range,
  components: s.comp,
  duration: s.duration,
  concentration: s.conc ?? false,
  ritual: s.ritual ?? false,
  classes: s.classes,
  damageRolls: s.damage,
  upcastInfo: s.upcast,
  content: s.content,
});

/** Repertorio de conjuros (trucos y niveles 1 a 9). */
export const SRD_SPELLS: SrdSpellEntry[] = [
  // ---------------- Trucos ----------------
  sp({
    id: 'spell-fire-bolt', level: 0, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago', 'Brujo'], damage: '1d10',
    content: `**Bola de fuego (Fire Bolt)**\n\nLanza una mota de fuego al objetivo. **Ataque a distancia de conjuro.** Impacta: 1d10 de daño de **fuego**.\n\nA niveles superiores: +1d10 al nivel 5 (2d10), 11 (3d10) y 17 (4d10).`,
  }),
  sp({
    id: 'spell-light', level: 0, school: 'Evocación', time: '1 Acción', range: 'Contacto', comp: 'V, M',
    duration: '1 hora', classes: ['Bardo', 'Clérigo', 'Hechicero', 'Mago'],
    content: `**Luz (Light)**\n\nTocas un objeto y emite luz brillante en un radio de 20 pies y luz tenue en otros 20. La luz puede ser de cualquier color.\n\n*Contraluz* sobre objeto cubierto: la luz se oculta hasta quitar la cobertura.`,
  }),
  sp({
    id: 'spell-mage-hand', level: 0, school: 'Conjuración', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: '1 minuto', conc: true, classes: ['Bardo', 'Hechicero', 'Mago', 'Brujo'],
    content: `**Mano de mago (Mage Hand)**\n\nCreas una mano espectral en un punto dentro del alcance. Durante la duración, manipula objetos a 30 pies: abre puertas, recoge objetos, vierte pociones.\n\nNo puede atacar, darle peso ni activar objetosmágicos.`,
  }),
  sp({
    id: 'spell-minor-illusion', level: 0, school: 'Ilusión', time: '1 Acción', range: '30 pies', comp: 'S, M',
    duration: '1 minuto', classes: ['Bardo', 'Mago', 'Brujo', 'Hechicero'],
    content: `**Ilusión menor (Minor Illusion)**\n\nCreas un sonido o una imagen estática dentro del alcance.\n\n- **Sonido:** voz, rugido, melodía... volumen ajustable.\n- **Imagen:** objeto o criatura de 5 pies; no se mueve ni emite sonido, y no puede superar el tamaño del cubo.\n\nUna criatura puede gastar una Acción para inspeccionarlo y descubrir que es falso con una prueba de **Investigación**.`,
  }),
  sp({
    id: 'spell-prestidigitation', level: 0, school: 'Transmutación', time: '1 Acción', range: '10 pies', comp: 'V, S',
    duration: '1 hora', classes: ['Bardo', 'Hechicero', 'Mago', 'Brujo'],
    content: `**Prestidigitación (Prestidigitation)**\n\nJuego de trucos triviales durante la duración: encender/ apagar una llama pequeña, limpiar o manchar un objeto, enfriar/calentar comida, crear un olor o color, marcar símbolos.\n\nAl lanzarlo, crea un **efecto menor** no mágico que dura 1 hora (p. ej. una nota musical).`,
  }),
  sp({
    id: 'spell-sacred-flame', level: 0, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Clérigo'], damage: '1d8',
    content: `**Llama sagrada (Sacred Flame)**\n\nDesciende llama radiante sobre el objetivo. **Salvación de DES.** Fallo: 1d8 de daño **radiante**, sin importar la cobertura.`,
  }),
  sp({
    id: 'spell-vicious-mockery', level: 0, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V',
    duration: 'Instantáneo', classes: ['Bardo'], damage: '1d6',
    content: `**Mofa cruel (Vicious Mockery)**\n\nInsultas al objetivo con un ingenio mágico. **Salvación de SAB.** Fallo: 1d6 de daño **psíquico** y **desventaja** en su siguiente tirada de ataque antes de tu próximo turno.`,
  }),
  sp({
    id: 'spell-ray-of-frost', level: 0, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago', 'Brujo'], damage: '1d8',
    content: `**Rayo de escarcha (Ray of Frost)**\n\nUn rayo de frío golpea al objetivo. **Ataque a distancia de conjuro.** Impacta: 1d8 de daño de **frío** y su velocidad se reduce 10 pies hasta tu próximo turno.\n\nA niveles superiores: +1d8 al nivel 5 (2d8), 11 (3d8) y 17 (4d8).`,
  }),
  sp({
    id: 'spell-produce-flame', level: 0, school: 'Conjuración', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: '10 minutos', classes: ['Druida'], damage: '1d8',
    content: `**Llama producida (Produce Flame)**\n\nUna llama aparece en tu mano y arde durante 10 minutos sin dañarte. Puedes lanzarla como **ataque a distancia de conjuro**: 1d8 de daño de **fuego**. La llama ilumina 20 pies.\n\nA niveles superiores: +1d8 al nivel 5, 11 y 17.`,
  }),

  sp({
    id: 'spell-acid-splash', level: 0, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Hechicero', 'Mago'], damage: '1d6',
    content: `**Salpicadura ácida (Acid Splash)**

Creas una burbuja de ácido en un punto dentro del alcance que explota en una **esfera de 5 pies de radio**. Cada criatura en la esfera debe superar una salvación de **DES** o recibe 1d6 de daño de **ácido**.

El daño aumenta en 1d6 en los niveles 5 (2d6), 11 (3d6) y 17 (4d6).`,
  }),
  sp({
    id: 'spell-chill-touch', level: 0, school: 'Nigromancia', time: '1 Acción', range: '10 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Hechicero', 'Brujo', 'Mago'], damage: '1d10',
    content: `**Toque gélido (Chill Touch)**

Canalizas el frío de la tumba: haz un **ataque de conjuro cuerpo a cuerpo** contra un objetivo a tu alcance. Si impactas, recibe 1d10 de daño de **necrótico** y no puede recuperar puntos de golpe hasta el final de tu próximo turno.

El daño aumenta en 1d10 en los niveles 5 (2d10), 11 (3d10) y 17 (4d10).`,
  }),
  sp({
    id: 'spell-dancing-lights', level: 0, school: 'Ilusión', time: '1 Acción', range: '120 pies', comp: 'V, S, M (un poco de fósforo)',
    duration: 'Hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Luces danzantes (Dancing Lights)**

Creas hasta cuatro luces del tamaño de una antorcha con aspecto de antorchas, linternas u orbes que flotan, o las combinas en una forma Mediana brillante vagamente humanoide. Cada luz emite **luz tenue** en un radio de 10 pies.

Como **acción de bonificación**, puedes mover las luces hasta 60 pies. Cada luz debe estar a 20 pies de otra creada por el conjuro y desaparece si excede el alcance.`,
  }),
  sp({
    id: 'spell-druidcraft', level: 0, school: 'Transmutación', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Druida'],
    content: `**Poderes druídicos (Druidcraft)**

Susurrando a los espíritus de la naturaleza, produces uno de estos efectos dentro del alcance: **predecir el tiempo** de las próximas 24 horas con un efecto sensorial, **hacer florecer** una flor, abrir una vaina o hacer brotar una hoja, crear un efecto sensorial inofensivo en un **cubo de 5 pies**, o **encender o apagar** una vela, antorcha u hoguera.`,
  }),
  sp({
    id: 'spell-eldritch-blast', level: 0, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Brujo'], damage: '1d10',
    content: `**Explosión sobrenatural (Eldritch Blast)**

Lanzas un rayo de energía crepitante: haz un **ataque a distancia de conjuro** contra una criatura u objeto. Si impactas, recibe 1d10 de daño de **fuerza**.

El conjuro crea 2 rayos a nivel 5, 3 a nivel 11 y 4 a nivel 17; puedes dirigirlos a un mismo objetivo o a objetivos distintos, con una tirada de ataque por rayo.`,
  }),
  sp({
    id: 'spell-elementalism', level: 0, school: 'Transmutación', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Druida', 'Hechicero', 'Mago'],
    content: `**Elementalismo (Elementalism)**

Controlas los elementos para crear uno de estos efectos dentro del alcance: **viento** (brisa que ondea telas y cierra puertas en un cubo de 5 pies), **tierra** (capa de polvo o arena, o escribir una palabra en tierra), **fuego** (nube de brasas inofensivas que enciende velas), **agua** (spray de niebla o 1 taza de agua limpia) o **esculpir elemento** en una forma tosca durante 1 hora.`,
  }),
  sp({
    id: 'spell-guidance', level: 0, school: 'Adivinación', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Hasta 1 minuto', conc: true,
    classes: ['Clérigo', 'Druida'],
    content: `**Guía (Guidance)**

Tocas a una criatura voluntaria y eliges una habilidad. Hasta que el conjuro termine, la criatura suma **1d4** a cualquier prueba de característica que use esa habilidad.`,
  }),
  sp({
    id: 'spell-mending', level: 0, school: 'Transmutación', time: '1 minuto', range: 'Toque', comp: 'V, S, M (dos imanes naturales)',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Hechicero', 'Mago'],
    content: `**Reparar (Mending)**

Reparas una única rotura o desgarrón en un objeto que toques (un eslabón roto, una llave partida, una capa rasgada, un odre con fugas) siempre que no supere **1 pie** en cualquier dimensión, sin dejar rastro del daño.

Puede reparar físicamente un objeto mágico, pero no restaurar su magia.`,
  }),
  sp({
    id: 'spell-message', level: 0, school: 'Transmutación', time: '1 Acción', range: '120 pies', comp: 'S, M (un alambre de cobre)',
    duration: '1 asalto',
    classes: ['Bardo', 'Druida', 'Hechicero', 'Mago'],
    content: `**Mensaje (Message)**

Señalas a una criatura dentro del alcance y susurras un mensaje; solo el objetivo lo oye y puede responder en un susurro que solo tú escuchas.

Puedes lanzarlo a través de objetos sólidos si conoces al objetivo; el **silencio mágico**, 1 pie de piedra, metal o madera, o una lámina fina de plomo lo bloquean.`,
  }),
  sp({
    id: 'spell-poison-spray', level: 0, school: 'Nigromancia', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Druida', 'Hechicero', 'Brujo', 'Mago'], damage: '1d12',
    content: `**Rociada venenosa (Poison Spray)**

Rocías niebla tóxica a una criatura dentro del alcance: haz un **ataque a distancia de conjuro**. Si impactas, recibe 1d12 de daño de **veneno**.

El daño aumenta en 1d12 en los niveles 5 (2d12), 11 (3d12) y 17 (4d12).`,
  }),
  sp({
    id: 'spell-resistance', level: 0, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Hasta 1 minuto', conc: true,
    classes: ['Clérigo', 'Druida'],
    content: `**Resistencia (Resistance)**

Tocas a una criatura voluntaria y eliges un tipo de daño (ácido, contundente, frío, fuego, relámpago, necrótico, perforante, veneno, radiante, cortante o trueno). Cuando la criatura reciba daño de ese tipo antes de que termine el conjuro, reduce el daño total en **1d4**.

Una criatura solo puede beneficiarse de este conjuro una vez por turno.`,
  }),
  sp({
    id: 'spell-shillelagh', level: 0, school: 'Transmutación', time: '1 Acción de Bonificación', range: 'Personal', comp: 'V, S, M (muérdago)',
    duration: '1 minuto',
    classes: ['Druida'],
    content: `**Vara de garrote (Shillelagh)**

Un **garrote** o **bastón** que sostengas queda imbuido del poder de la naturaleza: puedes usar tu aptitud mágica en lugar de **FUE** para las tiradas de ataque y daño cuerpo a cuerpo, y el dado de daño del arma se convierte en un **d8**. El daño puede ser de **fuerza** o el tipo normal del arma (a tu elección).

El conjuro termina antes si lo vuelves a lanzar o si sueltas el arma. El dado cambia a d10 (nivel 5), d12 (nivel 11) y 2d6 (nivel 17).`,
  }),
  sp({
    id: 'spell-shocking-grasp', level: 0, school: 'Evocación', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Hechicero', 'Mago'], damage: '1d8',
    content: `**Agarre electrizante (Shocking Grasp)**

El relámpago brota de ti hacia una criatura que intentas tocar: haz un **ataque de conjuro cuerpo a cuerpo**. Si impactas, recibe 1d8 de daño de **relámpago** y no puede realizar **ataques de oportunidad** hasta el comienzo de su próximo turno.

El daño aumenta en 1d8 en los niveles 5 (2d8), 11 (3d8) y 17 (4d8).`,
  }),
  sp({
    id: 'spell-sorcerous-burst', level: 0, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Hechicero'], damage: '1d8',
    content: `**Explosión de hechicería (Sorcerous Burst)**

Lanzas energía arcana contra una criatura u objeto: haz un **ataque a distancia de conjuro**. Si impactas, recibe 1d8 de daño de un tipo que elijas: **ácido, frío, fuego, relámpago, veneno, psíquico o trueno**.

Si sacas un 8 en un d8, puedes tirar otro d8 y sumarlo al daño; el máximo de estos d8 adicionales es tu modificador de aptitud mágica. El daño aumenta en 1d8 en los niveles 5, 11 y 17.`,
  }),
  sp({
    id: 'spell-spare-the-dying', level: 0, school: 'Nigromancia', time: '1 Acción', range: '15 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Clérigo', 'Druida'],
    content: `**Evitar la muerte (Spare the Dying)**

Eliges una criatura dentro del alcance que tenga **0 puntos de golpe** y no esté muerta; la criatura queda **estable**.

El alcance se duplica en los niveles 5 (30 pies), 11 (60 pies) y 17 (120 pies).`,
  }),
  sp({
    id: 'spell-starry-wisp', level: 0, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Druida'], damage: '1d8',
    content: `**Chispa estelar (Starry Wisp)**

Lanzas una mota de luz contra una criatura u objeto: haz un **ataque a distancia de conjuro**. Si impactas, recibe 1d8 de daño de **radiante** y, hasta el final de tu próximo turno, emite **luz tenue** en un radio de 10 pies y no puede beneficiarse de la condición **invisible**.

El daño aumenta en 1d8 en los niveles 5 (2d8), 11 (3d8) y 17 (4d8).`,
  }),
  sp({
    id: 'spell-thaumaturgy', level: 0, school: 'Transmutación', time: '1 Acción', range: '30 pies', comp: 'V',
    duration: 'Hasta 1 minuto',
    classes: ['Clérigo'],
    content: `**Taumaturgia (Thaumaturgy)**

Manifiestas un pequeño prodigio dentro del alcance: alterar la apariencia de tus ojos, amplificar tu voz (ventaja en **CAR (Intimidación)**), hacer fluctuar llamas, abrir o cerrar de golpe una puerta o ventana sin llave, crear un sonido fantasma o causar temblores inofensivos durante 1 minuto.

Puedes tener hasta **tres efectos de 1 minuto activos a la vez** si vuelves a lanzar el conjuro.`,
  }),
  sp({
    id: 'spell-true-strike', level: 0, school: 'Adivinación', time: '1 Acción', range: 'Personal', comp: 'S, M (un arma con la que tengas competencia)',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Golpe certero (True Strike)**

Guiado por un destello de intuición mágica, haces **un ataque** con el arma usada al lanzar el conjuro. El ataque usa tu **aptitud mágica** para atacar e infligir daño en lugar de **FUE** o **DES**, y el daño puede ser de **radiante** o el tipo normal del arma (a tu elección).

En los niveles 5 (1d6), 11 (2d6) y 17 (3d6), el ataque inflige daño de **radiante** adicional.`,
  }),

  // ---------------- Nivel 1 ----------------
  sp({
    id: 'spell-bless', level: 1, school: 'Encantamiento', time: '1 Acción', range: '30 pies', comp: 'V, S, M',
    duration: '1 minuto', conc: true, classes: ['Clérigo', 'Paladín'],
    content: `**Bendición (Bless)**\n\nHasta 3 criaturas elegidas obtienen **+1d4** en tiradas de ataque y salvaciones durante la duración.\n\nA niveles superiores: +1 criatura por nivel por encima de 1.`,
  }),
  sp({
    id: 'spell-bane', level: 1, school: 'Encantamiento', time: '1 Acción', range: '30 pies', comp: 'V, S, M',
    duration: '1 minuto', conc: true, classes: ['Bardo', 'Clérigo'],
    content: `**Maldición (Bane)**\n\nHasta 3 criaturas (salvación de CAR) sufren **-1d4** en tiradas de ataque y salvaciones durante la duración.\n\nA niveles superiores: +1 criatura por nivel.`,
  }),
  sp({
    id: 'spell-charm-person', level: 1, school: 'Encantamiento', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: '1 hora', classes: ['Bardo', 'Brujo', 'Hechicero', 'Mago'],
    content: `**Embelesar persona (Charm Person)**\n\nUn humanoide (salvación de SAB) queda **Encantado** durante 1 hora. La criatura te considera un amistoso mientras dure.\n\nAl terminar, sabe que fue embelesado. A niveles superiores: 1 objetivo más por nivel.`,
  }),
  sp({
    id: 'spell-cure-wounds', level: 1, school: 'Evocación', time: '1 Acción', range: 'Contacto', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Bardo', 'Clérigo', 'Druida', 'Paladín', 'Guardabosques'], damage: '1d8',
    content: `**Curar heridas (Cure Wounds)**\n\nUna criatura tocada recupera **1d8 + mod. de conjuro** PG.\n\nA niveles superiores: +1d8 por nivel por encima de 1.`,
  }),
  sp({
    id: 'spell-detect-magic', level: 1, school: 'Adivinación', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: '10 minutos', conc: true, ritual: true, classes: ['Bardo', 'Clérigo', 'Druida', 'Hechicero', 'Mago', 'Brujo'],
    content: `**Detectar magia (Detect Magic)**\n\nDurante 10 minutos, percibes magia dentro de 30 pies. Ves un **aura** tenue alrededor de cada criatura u objeto mágico.\n\nPuedes usar una acción para conocer la escuela y si el aura es de un conjuro o de un objeto mágico.`,
  }),
  sp({
    id: 'spell-guiding-bolt', level: 1, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: '1 round', classes: ['Clérigo'], damage: '4d6',
    content: `**Destello guía (Guiding Bolt)**\n\n**Ataque a distancia de conjuro.** Impacto: 4d6 de daño **radiante**, y el siguiente ataque contra el objetivo tiene **ventaja** (antes del final de tu siguiente turno).\n\nA niveles superiores: +1d6 por nivel.`,
  }),
  sp({
    id: 'spell-healing-word', level: 1, school: 'Evocación', time: '1 Acción de Bonificación', range: '60 pies', comp: 'V',
    duration: 'Instantáneo', classes: ['Bardo', 'Clérigo', 'Druida'],
    content: `**Palabra de curación (Healing Word)**\n\nUna criatura a 60 pies recupera **1d4 + mod. de conjuro** PG.\n\nA niveles superiores: +1d4 por nivel.`,
  }),
  sp({
    id: 'spell-magic-missile', level: 1, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago'], damage: '3d4+3',
    content: `**Proyectil mágico (Magic Missile)**\n\nCreas 3 dardos de fuerza que **nunca fallan** y golpean simultáneamente el objetivo elegido. Cada dardo hace **1d4+1** de daño **de fuerza**.\n\nA niveles superiores: +1 dardo por nivel.`,
  }),
  sp({
    id: 'spell-shield', level: 1, school: 'Abjuración', time: '1 Reacción', range: 'Personal', comp: 'V, S',
    duration: '1 ronda', classes: ['Hechicero', 'Mago', 'Brujo'],
    content: `**Escudo (Shield)**\n\nReacción cuando te atacan o te impacta un ataque o proyectil mágico. Obtienes **+5 a CA** y **inmunidad a Proyectil Mágico** hasta el inicio de tu próximo turno.`,
  }),
  sp({
    id: 'spell-sleep', level: 1, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V, S, M',
    duration: '1 minuto', conc: true, classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Sueño (Sleep)**\n\nRealiza 5d8; el total en PG de criaturas medias (5 pies de radio, por orden ascendente de PG) queda **Inconsciente** hasta el final de la duración o hasta recibir daño.\n\nA niveles superiores: +2d8 por nivel.`,
  }),
  sp({
    id: 'spell-thunderwave', level: 1, school: 'Evocación', time: '1 Acción', range: 'Personal (15 pies de cubo)', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Bardo', 'Druida', 'Hechicero', 'Mago'], damage: '2d8',
    content: `**Onda de trueno (Thunderwave)**\n\nOnda de energía atronadora se expande desde ti en un cubo de 15 pies. Las criaturas (salvación de **CON**) reciben **2d8** de daño de **trueno** y son **empujadas 10 pies**; éxito, la mitad de daño y sin empuje.\n\nA niveles superiores: +1d8 por nivel.`,
  }),

  sp({
    id: 'spell-alarm', level: 1, school: 'Abjuración', time: '1 minuto', range: '30 pies', comp: 'V, S, M (una campanita de plata)',
    duration: '8 horas',
    classes: ['Bardo', 'Brujo', 'Mago', 'Guardabosques'],
    content: `**Alarma (Alarm)**

Colocas una alarma invisible en una puerta, ventana o área dentro del alcance (cubo de 20 pies). Cuando una criatura **Pequena o mayor** toca o entra en la zona, el conjuro emite una **señal mental** que te avisa durante 1 hora (si estás a 1 milla), o un **sonido de campanilla audible** a 60 pies.

Puedes crear **contraseñas** por voz o físicas; las criaturas que las cumplan no activan la alarma.`,
  }),
  sp({
    id: 'spell-animal-friendship', level: 1, school: 'Encantamiento', time: '1 Acción', range: '30 pies', comp: 'V, S, M (un trozo de comida)',
    duration: '24 horas',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Guardabosques'],
    content: `**Amistad animal (Animal Friendship)**

Procuras que una bestia que puedas ver dentro del alcance te considere un amigo: debe superar una salvación de **SAB** o queda **encantada** por ti durante la duración. Si tú o tus aliados la dañáis, el conjuro termina.

A niveles superiores: puedes apuntar a una bestia adicional por cada nivel de espacio superior al 1.`,
  }),
  sp({
    id: 'spell-burning-hands', level: 1, school: 'Evocación', time: '1 Acción', range: 'Personal', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Hechicero', 'Mago'], damage: '3d6',
    content: `**Manos ardientes (Burning Hands)**

El fuego brota de tus manos en un **cono de 15 pies**. Cada criatura en el área debe superar una salvación de **DES** o recibe 3d6 de daño de **fuego**; si la supera, recibe la mitad.

El daño aumenta en +1d6 por nivel de espacio superior al consumido para lanzar el conjuro (hasta 5d6).`,
  }),
  sp({
    id: 'spell-chromatic-orb', level: 1, school: 'Evocación', time: '1 Acción', range: '90 pies', comp: 'V, S, M (un diamante de al menos 50 po)',
    duration: 'Instantáneo',
    classes: ['Hechicero', 'Mago'], damage: '3d8',
    content: `**Orbe cromático (Chromatic Orb)**

Lanzas un orbe de energía de un **elemento que elijas al lanzarlo** (ácido, frío, fuego, relámpago, veneno, trueno): haz un **ataque a distancia de conjuro** contra una criatura u objeto. Si impactas, recibe 3d8 de daño de ese tipo.

El daño aumenta en **1d8 por nivel de espacio superior** al consumido.`,
  }),
  sp({
    id: 'spell-color-spray', level: 1, school: 'Ilusión', time: '1 Acción', range: 'Personal', comp: 'S, M (arena de colores)',
    duration: '1 asalto',
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Rociada de color (Color Spray)**

Un destello de colores deslumbrantes surge de tu mano en un **cono de 15 pies**. Tira **6d10**; la cifra es el total de puntos de golpe de criaturas que el destello ciega en orden ascendente (empezando por la de menor PG actual en el área).

Por cada criatura, resta sus PG actuales del total y resta la cantidad de PG **más 10** de las siguientes; cada criatura cuya cantidad se agote queda **ciega** hasta el final de tu próximo turno.`,
  }),
  sp({
    id: 'spell-command', level: 1, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V',
    duration: 'Instantáneo',
    classes: ['Clérigo', 'Paladín'],
    content: `**Mandato (Command)**

Emites una orden de una palabra a una criatura dentro del alcance: debe superar una salvación de **SAB** o cumple la orden en su próximo turno (**Aproximate, Suelta, Huye, Retrocede, Altócelo…**). El efecto depende de la orden dada e ignorar el **encantado** no aplica.

A niveles superiores: puedes afectar a una criatura adicional por cada nivel de espacio superior al 1, todas deben estar a 30 pies entre sí.`,
  }),
  sp({
    id: 'spell-comprehend-languages', level: 1, school: 'Adivinación', time: '1 Acción', range: 'Personal', comp: 'V, S, M (un poco de hollín y sal)',
    duration: '1 hora',
    classes: ['Bardo', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Comprender lenguajes (Comprehend Languages)**

Comprendes el **significado literal** de cualquier idioma hablado que oigas y de cualquier texto escrito que puedas ver durante la duración. Puedes leer códigos y textos mágicos, pero no los descifras mágicamente.`,
  }),
  sp({
    id: 'spell-create-or-destroy-water', level: 1, school: 'Transmutación', time: '1 Acción', range: '30 pies', comp: 'V, S, M (una gota de agua si la creas, unos granos de arena si la destruyes)',
    duration: 'Instantáneo',
    classes: ['Clérigo', 'Druida'],
    content: `**Crear o destruir agua (Create or Destroy Water)**

**Crear:** produces hasta **10 galones de agua limpia** dentro del alcance en un recipiente abierto.
**Destruir:** destruyes hasta **10 galones de agua** en un recipiente abierto o hasta un **cubo de 30 pies** de niebla u otra agua diseminada.

A niveles superiores: +10 galones por nivel de espacio superior al 1 y +cubo de 30 pies en niebla.`,
  }),
  sp({
    id: 'spell-detect-evil-and-good', level: 1, school: 'Adivinación', time: '1 Acción', range: 'Personal', comp: 'V, S',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Clérigo', 'Paladín'],
    content: `**Detectar el bien y el mal (Detect Evil and Good)**

Los **espíritus santos y profanos** que pueblan el cosmos se revelan: mientras mantienes la concentración, detectas la presencia y tipo (celestial, corruptor, elemental, feérico, fiendo, no-muerto) de cualquier criatura de esos tipos en un **radio de 30 pies**, y el lugar de objetos o lugares consagrados o profanados.

Puedes conocer la presencia pero no la ubicación exacta de no puedes ver.`,
  }),
  sp({
    id: 'spell-detect-poison-and-disease', level: 1, school: 'Adivinación', time: '1 Acción', range: 'Personal', comp: 'V, S, M (una rama de tejo)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Clérigo', 'Druida', 'Paladín', 'Guardabosques'],
    content: `**Detectar veneno y enfermedad (Detect Poison and Disease)**

Detecta la presencia de **venenos y enfermedades** dentro de un radio de 30 pies, además de la presencia de criaturas u objetos contagiados. Puedes identificar la **ubicación** exacta con una concentración de 1 asalto (acción de percepcion).`,
  }),
  sp({
    id: 'spell-disguise-self', level: 1, school: 'Ilusión', time: '1 Acción', range: 'Personal', comp: 'V, S',
    duration: '1 hora',
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Disfrazarse (Disguise Self)**

Cambias tu apariencia (tu altura, peso, rasgos faciales, sonido de tu voz, olor y aspecto general) a tu elección, siempre que sigas siendo **la misma categoría de tamaño** (Pequena, Mediana o Grande) y tu forma base sea humanoide.

Inspeccionar la ilusión exige una **prueba de Investigación** contra tu salvación de conjuros; las criaturas inmunes a la **ilusión** o atentas pueden notarla.`,
  }),
  sp({
    id: 'spell-dissonant-whispers', level: 1, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V',
    duration: 'Instantáneo',
    classes: ['Bardo'], damage: '3d6',
    content: `**Susurros discordantes (Dissonant Whispers)**

Susurras una melodía discordante que solo una criatura de tu elección dentro del alcance puede oír: debe superar una salvación de **SAB** o recibe 3d6 de daño **psíquico** y debe usar su **reacción** para alejarse de ti hasta donde su velocidad lo permita.

Si la distancia supera el alcance del conjuro, el conjuro termina. El daño aumenta en **1d6** por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-divine-favor', level: 1, school: 'Evocación', time: '1 Acción de Bonificación', range: 'Personal', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Paladín'], damage: '1d4',
    content: `**Favor divino (Divine Favor)**

Ostentas una energía divina que brilla en tus golpes: hasta que el conjuro termine, tus **ataques con armas** contra criaturas u objetos infligen **1d4 de daño radiante adicional**.`,
  }),
  sp({
    id: 'spell-divine-smite', level: 1, school: 'Evocación', time: '1 Acción de Bonificación', range: 'Personal', comp: 'V',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Paladín'],
    content: `**Golpe divino (Divine Smite)**

Tu arma irradia luz. Si **impactas** a una criatura con un ataque con armas de cuerpo a cuerpo mientras el conjuro está activo, puedes terminar el conjuro para infligir **2d8 de daño radiante adicional** y la criatura queda **postrada** si no supera una salvación de **CON**.

El daño aumenta en 1d8 por nivel de espacio superior al 1 (máximo 5d8).`,
  }),
  sp({
    id: 'spell-ensnaring-strike', level: 1, school: 'Conjuración', time: '1 Acción de Bonificación', range: 'Personal', comp: 'V',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Guardabosques'],
    content: `**Golpe enredador (Ensnaring Strike)**

La próxima vez que impactes con un ataque con armas a los 1 minuto del conjuro, de donde el atacante hizo el ataque surge un **enjambre de raíces mágicas** que consume al objetivo: debe superar una salvación de **SAB** o queda **agarrado** hasta que termine el conjuro.

Mientras está agarrado, recibe **1d6 de daño de cortante** al inicio de cada uno de sus turnos; puede soltarse con una **Acción** superando una salvación de **FUE**.`,
  }),
  sp({
    id: 'spell-entangle', level: 1, school: 'Conjuración', time: '1 Acción', range: '90 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Druida', 'Guardabosques'],
    content: `**Enredar (Entangle)**

En un **cubo de 20 pies** dentro del alcance crece un enredo de hierbas y raíces duras. Las criaturas que entren o terminen su turno ahí deben superar una salvación de **FUE** o quedan **agarradas**, y el terreno cuenta como **difícil**.

Cada criatura agarrada puede repetir la salvación al inicio de cada uno de sus turnos para soltarse.`,
  }),
  sp({
    id: 'spell-expeditious-retreat', level: 1, school: 'Transmutación', time: '1 Acción de Bonificación', range: 'Personal', comp: 'V, S',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Hechicero', 'Brujo', 'Mago'],
    content: `**Retirada expeditiva (Expeditious Retreat)**

Obtienes supervelocidad: mientras el conjuro está activo y puedes ver el terreno, puedes tomar la **Acción de Carrera** como una **Acción de Bonificación** en cada uno de tus turnos.`,
  }),
  sp({
    id: 'spell-faerie-fire', level: 1, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Druida'],
    content: `**Fuego feérico (Faerie Fire)**

Cada objeto y criatura en un **cubo de 20 pies** dentro del alcance queda **envuelto en fuego azul, verde o violeta**. Las criaturas deben superar una salvación de **DES** o quedan resaltadas; mientras estén resaltadas, los **ataques contra ellas tienen ventaja** y no pueden beneficiarse de la condición **invisible**.`,
  }),
  sp({
    id: 'spell-false-life', level: 1, school: 'Nigromancia', time: '1 Acción', range: 'Personal', comp: 'V, S, M (una pequeña cantimplora de alcohol)',
    duration: '1 hora',
    classes: ['Hechicero', 'Brujo', 'Mago'],
    content: `**Falsa vida (False Life)**

Consumes una energía negativa que te da **puntos de golpe temporales** iguales a **1d4 + 4 + tu modificador de aptitud mágica** durante la duración.

A niveles superiores: +5 PG temporales por nivel de espacio superior al 1.`,
  }),
  sp({
    id: 'spell-feather-fall', level: 1, school: 'Transmutación', time: 'Reacción', range: '60 pies', comp: 'V, M (una pluma o plumón)',
    duration: '1 minuto',
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Caída de pluma (Feather Fall)**

Cuando tú o hasta **5 criaturas** dentro del alcance caéis, la velocidad de caída se reduce a **60 pies por asalto** hasta que el conjuro termine: las criaturas afectadas no reciben **daño por caída** al aterrizar mientras dure.`,
  }),
  sp({
    id: 'spell-find-familiar', level: 1, school: 'Conjuración', time: '1 hora', range: '10 pies', comp: 'V, S, M (carbón y sal para un sacrificio de fuego)',
    duration: 'Instantáneo',
    classes: ['Mago'],
    content: `**Encontrar familiar (Find Familiar)**

Obtienes el servicio de un **familiar**: un espíritu feérico, fiendo o celestial que toma la forma de un animal (murciélago, gato, cangrejo, rana, halcón, lagarto, pulpo, rata, cuervo, pez, araña o comadreja). El familiar es una **criatura independiente** controlada por ti, y puede compartir línea de conjuros y recibir tus **trucos con objetivo Personal**.

Mientras el familiar esté a 100 pies y seas una criatura, puedes usar su **reacción** para lanzar un conjuro **cuerpo a cuerpo**.`,
  }),
  sp({
    id: 'spell-floating-disk', level: 1, school: 'Conjuración', time: '1 Acción', range: '30 pies', comp: 'V, S, M (una gota de mercurio)',
    duration: '1 hora',
    classes: ['Mago'],
    content: `**Disco flotante (Floating Disk)**

Este conjuro crea un **disco circular horizontal de 3 pies** de diámetro que flota a 3 pies del suelo dentro del alcance y te acompaña mientras te mantengas a 20 pies de él (de lo contrario se queda donde está).

El disco puede soportar hasta **500 libras** y permanece mientras no lo abandones a más de 20 pies o el conjuro termine.`,
  }),
  sp({
    id: 'spell-fog-cloud', level: 1, school: 'Conjuración', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Druida', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Nube de niebla (Fog Cloud)**

Una **esfera de niebla de 30 pies de radio** surge en un punto del alcance y forma una zona de **vista obstruida**. Un viento de 20 mph disipa la niebla en 4 asaltos; un vendaval o conjuro mayor la disipa en 1 asalto.

A niveles superiores: +30 pies de radio por nivel de espacio superior al 1.`,
  }),
  sp({
    id: 'spell-goodberry', level: 1, school: 'Transmutación', time: '1 Acción', range: 'Personal', comp: 'V, S, M (una ramita de muérdago)',
    duration: 'Instantáneo',
    classes: ['Druida', 'Guardabosques'],
    content: `**Bayas buenas (Goodberry)**

Creas hasta **10 bayas** en tu mano llenas de magia. Durante 24 horas, cada baya puede ser comida como una **Acción** y cura **1 punto de golpe**, y satisface los requerimientos nutricionales de un día entero.`,
  }),
  sp({
    id: 'spell-grease', level: 1, school: 'Conjuración', time: '1 Acción', range: '60 pies', comp: 'V, S, M (un poco de grasa de cerdo)',
    duration: '1 minuto',
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Grasa (Grease)**

Una capa resbaladiza de grasa cubre un **cuadrado de 10 pies** dentro del alcance. Cuando el conjuro se lanza y al final del turno de cada criatura que la atraviese o permanezca ahí, debe superar una salvación de **DES** o cae **postrada**. También puede ayudar a soltarse de agarres.`,
  }),
  sp({
    id: 'spell-hellish-rebuke', level: 1, school: 'Evocación', time: 'Reacción', range: '60 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Brujo'], damage: '2d10',
    content: `**Reprensión infernal (Hellish Rebuke)**

Desarrollas un poder infernal en respuesta verbal a ser dañado por una criatura visible: esa criatura debe superar una salvación de **DES** o recibe **2d10 de daño de fuego**; si la supera, recibe la mitad.

El daño aumenta en 1d10 por nivel de espacio superior al 1 (hasta 4d10).`,
  }),
  sp({
    id: 'spell-heroism', level: 1, school: 'Encantamiento', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Clérigo', 'Paladín'],
    content: `**Heroísmo (Heroism)**

Una criatura voluntaria queda imbuida de valor: es **inmune al miedo** y gana **puntos de golpe temporales** iguales a tu modificador de aptitud mágica al inicio de cada uno de sus turnos mientras dure el conjuro.

A niveles superiores: +1 criatura por nivel de espacio superior al 1.`,
  }),
  sp({
    id: 'spell-hex', level: 1, school: 'Encantamiento', time: '1 Acción de Bonificación', range: '90 pies', comp: 'V, S, M (un ojo petrificado)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Brujo'], damage: '1d6',
    content: `**Maleficio (Hex)**

Colocas una maldición en una criatura dentro del alcance: cuando impactas contra ella con un **ataque**, inflige **1d6 de daño necrótico adicional**, y mientras dure, el objetivo tiene **desventaja en las pruebas de característica** de una tu elección.

Puedes mover el maleficio a otra criatura cuando el objetivo muera o caiga a 0 PG. A niveles superiores: +1 hora de duración por nivel de espacio superior al 1.`,
  }),
  sp({
    id: 'spell-hideous-laughter', level: 1, school: 'Encantamiento', time: '1 Acción', range: '30 pies', comp: 'V, S, M (una tarta y una pluma)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Mago'],
    content: `**Risa horrible (Tasha's Hideous Laughter)**

La criatura objetivo debe superar una salvación de **SAB** o percibe todo como ridículo: **cae postrada** riendo durante la duración y mientras la concentración se mantenga. Puede repetir la salvación al final de cada uno de sus turnos con ventaja si recibe daño de otro.`,
  }),
  sp({
    id: 'spell-hunters-mark', level: 1, school: 'Adivinación', time: '1 Acción de Bonificación', range: '90 pies', comp: 'V',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Guardabosques'],
    content: `**Marca del cazador (Hunter's Mark)**

Eliges una criatura que puedas ver dentro del alcance y la marcas mágicamente como presa: mientras la concentración se mantenga, **cada vez que la dañes con un ataque**, recibes **1d6 de daño de un tipo elegido** (ácido, frío, fuego, relámpago o trueno).

Puedes mover la marca a otra criatura con una acción de bonificación en tu turno.`,
  }),
  sp({
    id: 'spell-ice-knife', level: 1, school: 'Conjuración', time: '1 Acción', range: '60 pies', comp: 'S, M (una gota de agua o un trozo de hielo)',
    duration: 'Instantáneo',
    classes: ['Hechicero', 'Mago'], damage: '1d10',
    content: `**Cuchillo de hielo (Ice Knife)**

Creas un cuchillo de hielo en tu mano que lanzas contra un objetivo dentro del alcance: haz un **ataque a distancia de conjuro**. Si impactas, el objetivo recibe **1d10 de daño de perforante**; impacte o no, se **fragmenta** y cada criatura en una **esfera de 5 pies** alrededor de él debe superar una salvación de **DES** o recibe **2d6 de daño de frío**.

El daño aumenta en 1d10 y 2d6 respectivamente por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-identify', level: 1, school: 'Adivinación', time: '1 minuto', range: 'Toque', comp: 'V, S, M (una perla de al menos 100 po)',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Mago'],
    content: `**Identificar (Identify)**

Eliges un objeto mientras lo tocas y aprendes mágicamente sus **propiedades mágicas**, cómo usarlas, si requiere **vínculo** para usarlas, si tiene cargas y cuántas restan, y si algún conjuro lo afecta o fue creado por un conjuro.

Puedes identificar también conjuros que se ciernen sobre una criatura si eres capaz de verlos. Si lo lanzas como parte de un descanso corto, puedes examinar un objeto mágico.`,
  }),
  sp({
    id: 'spell-illusory-script', level: 1, school: 'Ilusión', time: '1 minuto', range: 'Toque', comp: 'S, M (tinta con plomo)',
    duration: '10 días',
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Escritura ilusoria (Illusory Script)**

Escribes en un pergamino, papel u otro material una escritura que parece una **lengua conocida o código** que tú elijas, mientras que en realidad es **otra escritura** (tal vez un código y nada) que solo tú o una criatura que designes pueden leer. Las demás criaturas que examinen el escrito perciben la escritura ilusoria.`,
  }),
  sp({
    id: 'spell-inflict-wounds', level: 1, school: 'Nigromancia', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Clérigo'], damage: '3d10',
    content: `**Infligir heridas (Inflict Wounds)**

Haz un **ataque de conjuro cuerpo a cuerpo** contra una criatura que puedas tocar. Si impactas, recibe **3d10 de daño necrótico**.

El daño aumenta en 1d10 por nivel de espacio superior al 1 (hasta 5d10).`,
  }),
  sp({
    id: 'spell-jump', level: 1, school: 'Transmutación', time: '1 Acción de Bonificación', range: 'Toque', comp: 'V, S, M (una pata de saltamontes)',
    duration: '1 minuto',
    classes: ['Bardo', 'Druida', 'Mago', 'Guardabosques'],
    content: `**Salto (Jump)**

Tocas a una criatura y su **salto de longitud** se multiplica por 3 durante el conjuro.`,
  }),
  sp({
    id: 'spell-longstrider', level: 1, school: 'Transmutación', time: '1 Acción', range: 'Toque', comp: 'V, S, M (una pizca de tierra)',
    duration: '1 hora',
    classes: ['Bardo', 'Druida', 'Mago', 'Guardabosques'],
    content: `**Zancada larga (Longstrider)**

Tocas a una criatura y su **velocidad de movimiento** aumenta en **10 pies** durante la duración.

A niveles superiores: +1 criatura por nivel de espacio superior al 1 (todas deben estar a 30 pies del objetivo inicial al lanzarlo).`,
  }),
  sp({
    id: 'spell-mage-armor', level: 1, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S, M (un trozo de cuero curtido)',
    duration: '8 horas',
    classes: ['Hechicero', 'Mago'],
    content: `**Armadura de mago (Mage Armor)**

Tocas a una criatura voluntaria que no lleve armadura y la envuelves en una protección mágica: su **CA se vuelve 13 + su modificador de DES** y dura hasta 8 horas.

El efecto termina si la criatura se pone armadura.`,
  }),
  sp({
    id: 'spell-protection-from-evil-and-good', level: 1, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S, M (agua bendita o plata de molido)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Clérigo', 'Paladín', 'Brujo', 'Mago'],
    content: `**Protección contra el bien y el mal (Protection from Evil and Good)**

Tocas a una criatura voluntaria y mientras dura el conjuro está **protegida** contra ciertos tipos de criaturas (aberración, celestial, elemental, feérico, fiendo y no-muerto): las criaturas de ese tipo tienen **desventaja en los ataques** contra ella, no la pueden **encantar**, **asustar** ni **poseer**, y si estas condiciones ya la afectan, el efecto se **suprime** mientras dure.`,
  }),
  sp({
    id: 'spell-purify-food-and-drink', level: 1, school: 'Transmutación', time: '1 Acción', range: '10 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Clérigo', 'Paladín'],
    content: `**Purificar comida y bebida (Purify Food and Drink)**

Purificas comida y bebida dentro de una **esfera de 5 pies de radio** dentro del alcance: se eliminan el **veneno** y las **enfermedades** que contengan, y se dispelan los efluvios espurios.`,
  }),
  sp({
    id: 'spell-ray-of-sickness', level: 1, school: 'Nigromancia', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Hechicero', 'Mago'], damage: '2d8',
    content: `**Rayo de enfermedad (Ray of Sickness)**

Un rayo verdoso brota de tu dedo hacia una criatura dentro del alcance: haz un **ataque a distancia de conjuro**. Si impactas, recibe **2d8 de daño de veneno** y debe superar una salvación de **CON** o queda **envenenada** hasta el final de tu próximo turno.

El daño aumenta en 1d8 por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-sanctuary', level: 1, school: 'Abjuración', time: '1 Acción de Bonificación', range: '30 pies', comp: 'V, S, M (una pequeña placa de plata)',
    duration: '1 minuto',
    classes: ['Clérigo', 'Paladín'],
    content: `**Santuario (Sanctuary)**

Eliges una criatura dentro del alcance y la envuelves en una **protección que desvía los ataques**: mientras está protegida, cualquier criatura que apunte a la protegida con un ataque o conjuro dañino debe superar una salvación de **SAB** para poder atacarla; si falla, debe elegir otro objetivo o perder el ataque (solo una vez por turno).`,
  }),
  sp({
    id: 'spell-searing-smite', level: 1, school: 'Evocación', time: '1 Acción de Bonificación', range: 'Personal', comp: 'V',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Paladín'], damage: '1d6',
    content: `**Golpe abrasador (Searing Smite)**

Tu arma brilla con un fuego oculto. La próxima vez que impactes a una criatura con un ataque con armas mientras el conjuro está activo, puede terminar el conjuro para infligir **1d6 de daño de fuego adicional**, y el objetivo queda **ardiendo**: al inicio de cada uno de sus turnos mientras dure, recibe 1d6 de fuego y puede repetir una salvación de CON para apagarse.

El daño aumenta en 1d6 por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-shield-of-faith', level: 1, school: 'Abjuración', time: '1 Acción de Bonificación', range: '60 pies', comp: 'V, S, M (un pergamino con un símbolo sagrado)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Clérigo', 'Paladín'],
    content: `**Escudo de fe (Shield of Faith)**

Una barrera PROTECTORA de luz apenas visible rodea a una criatura dentro del alcance: hasta que termine el conjuro, su **CA recibe un +2** (incluido contra ataques que no pueden ser esquivados).`,
  }),
  sp({
    id: 'spell-silent-image', level: 1, school: 'Ilusión', time: '1 Acción', range: '60 pies', comp: 'V, S, M (un poco de lana)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Imagen silenciosa (Silent Image)**

Creas la **imagen de un objeto, criatura u otro fenómeno visible** que quepa en un **cubo de 15 pies**, sin sonido ni olor. La imagen no puede crear sonido, luz, olor ni otro efecto sensorial.

Puedes usar la imagen como parte de una **Acción de movimiento** para hacerla moverse dentro del alcance, y las criaturas interaccionando con la imagen física (como un ataque) pueden distinguir que es ilusión con una **prueba de Investigación**.`,
  }),
  sp({
    id: 'spell-speak-with-animals', level: 1, school: 'Adivinación', time: '1 Acción', range: 'Personal', comp: 'V, S',
    duration: '10 minutos',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Guardabosques'],
    content: `**Hablar con los animales (Speak with Animals)**

Obtienes la capacidad de **comunicarte con bestias** durante 10 minutos: estas entienden el significado de tus palabras, aunque su inteligencia es limitada, y pueden revelar información sobre tu entorno y otros.`,
  }),
  sp({
    id: 'spell-unseen-servant', level: 1, school: 'Conjuración', time: '1 Acción', range: '60 pies', comp: 'V, S, M (una cuerda y una pizca de madera)',
    duration: '1 hora',
    classes: ['Bardo', 'Brujo', 'Mago'],
    content: `**Sirviente invisible (Unseen Servant)**

Un sirviente invisible, desencarnado y ciego de fuerza se crea en un punto del alcance y obedece tus órdenes verbales simples durante 1 hora. Puede realizar tareas como limpiar, abrir y cerrar, recoger y sostener objetos, pero **no puede atacar** y puede llevar hasta 10 libras, o empujar/arrastrar hasta 30 libras.

Puede desatar y anudar cuerdas, preparar trampas, y mantener las manos a los oficios que requiere dos criaturas… Usted puede darle una sola tarea simple a la vez.`,
  }),

  // ---------------- Nivel 2 ----------------
  sp({
    id: 'spell-hold-person', level: 2, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V, S, M',
    duration: '1 minuto', conc: true, classes: ['Bardo', 'Clérigo', 'Druida', 'Hechicero', 'Mago'],
    content: `**Inmovilizar persona (Hold Person)**\n\nUn humanoide (salvación de SAB) queda **Paralizado** durante la duración; repite la salvación al final de cada turno.\n\nA niveles superiores: +1 objetivo por nivel.`,
  }),
  sp({
    id: 'spell-misty-step', level: 2, school: 'Conjuración', time: '1 Acción de Bonificación', range: 'Personal', comp: 'V',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago', 'Brujo'],
    content: `**Paso brumoso (Misty Step)**\n\nTe teletransportas hasta **30 pies** a un punto visible. No provoca ataques de oportunidad.`,
  }),
  sp({
    id: 'spell-mirror-image', level: 2, school: 'Ilusión', time: '1 Acción', range: 'Personal', comp: 'V, S',
    duration: '1 minuto', classes: ['Brujo', 'Hechicero', 'Mago'],
    content: `**Imagen especular (Mirror Image)**\n\nCreas 3 duplicados ilusorios. Cuando te atacan, tira d20: con 6+ (o menos según los duplicados restantes), el ataque golpea al duplicado y lo destruye.\n\nAl destruir un duplicado, la probabilidad de que los restantes se lleven el golpe disminuye.`,
  }),
  sp({
    id: 'spell-pass-without-trace', level: 2, school: 'Abjuración', time: '1 Acción', range: 'Personal', comp: 'V, S, M',
    duration: '1 hora', conc: true, classes: ['Druida', 'Guardabosques'],
    content: `**Paso sin dejar huella (Pass Without Trace)**\n\nTú y tus aliados a 30 pies obtenéis **+10 a las tiradas de Sigilo** y no dejáis huellas ni rastros.`,
  }),
  sp({
    id: 'spell-scorching-ray', level: 2, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago'], damage: '2d6',
    content: `**Rayo abrasador (Scorching Ray)**\n\nLanzas **3 rayos** (ataques a distancia de conjuro) contra objetivos al alcance. Cada impacto: 2d6 de daño de **fuego**.\n\nA niveles superiores: +1 rayo por nivel.`,
  }),
  sp({
    id: 'spell-shatter', level: 2, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V, S, M',
    duration: 'Instantáneo', classes: ['Bardo', 'Hechicero', 'Mago', 'Brujo'], damage: '3d8',
    content: `**Quebrantar (Shatter)**\n\nEstallido sonoro en un punto (radio 10 pies). Las criaturas (salvación de **CON**) reciben 3d8 de daño de **trueno**; los objetos no mágicos frágiles se rompen.\n\nA niveles superiores: +1d8 por nivel.`,
  }),
  sp({
    id: 'spell-spiritual-weapon', level: 2, school: 'Evocación', time: '1 Acción de Bonificación', range: '60 pies', comp: 'V, S',
    duration: '1 minuto', classes: ['Clérigo'], damage: '1d8+5',
    content: `**Arma espiritual (Spiritual Weapon)**\n\nUna arma espectral flota a 60 pies. Como acción de bonificación la mueves hasta 20 pies y atacas (ataque de conjuro): 1d8 + mod. de conjuro de daño **fuerza**.\n\nA niveles superiores: +1d8 por nivel.`,
  }),
  sp({
    id: 'spell-web', level: 2, school: 'Conjuración', time: '1 Acción', range: '60 pies', comp: 'V, S, M',
    duration: '1 hora', conc: true, classes: ['Hechicero', 'Mago'],
    content: `**Telaraña (Web)**\n\nCúmulos de telaraña (radio 20 pies) forman **terreno difícil**. Las criaturas que empiezan o entran (salvación de **DES**) quedan **Agarradas** (repite al final de su turno).\n\nLa telaraña es **inflamable**: un fuego quema un sector de 5x5 por ronda.`,
  }),
  sp({
    id: 'spell-invisibility', level: 2, school: 'Ilusión', time: '1 Acción', range: 'Contacto', comp: 'V, S, M',
    duration: '1 hora', conc: true, classes: ['Bardo', 'Hechicero', 'Mago', 'Brujo'],
    content: `**Invisibilidad (Invisibility)**\n\nUna criatura tocada se vuelve **Invisible** durante 1 hora. El efecto termina si ataca o lanza un conjuro.\n\nA niveles superiores: +1 objetivo por nivel por encima de 2.`,
  }),
  sp({
    id: 'spell-moonbeam', level: 2, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S, M',
    duration: '1 minuto', conc: true, classes: ['Druida'], damage: '2d10',
    content: `**Rayo lunar (Moonbeam)**\n\nUn rayo de luz pálida desciende en un cilindro de 5 pies (40 pies de alto). Las criaturas que empiecen o entren (salvación de **CON**) reciben **2d10** de daño **radiante**; éxito, la mitad. Puedes mover el rayo 60 pies como acción.\n\nLos **cambiaformas** sufren desventaja en la salvación. A niveles superiores: +1d10 por nivel.`,
  }),

  sp({
    id: 'spell-acid-arrow', level: 2, school: 'Evocación', time: '1 Acción', range: '90 pies', comp: 'V, S, M (hoja de ruibarbo, glándula de víbora)',
    duration: 'Instantáneo',
    classes: ['Druida', 'Mago'], damage: '4d4',
    content: `**Flecha ácida (Melf's Acid Arrow)**

Lanzas un dardo ácido contra una criatura u objeto dentro del alcance: haz un **ataque a distancia de conjuro**. Si impacta, recibe **4d4 de daño de ácido** y **2d4 de daño de ácido** al final de su próximo turno; si falla, recibe **2d4 de daño de ácido** inmediato.

El daño aumenta en 1d4 y 1d4 en los niveles superiores.`,
  }),
  sp({
    id: 'spell-aid', level: 2, school: 'Abjuración', time: '1 Acción', range: '30 pies', comp: 'V, S, M (una tira de tela blanca)',
    duration: '8 horas',
    classes: ['Clérigo', 'Paladín'],
    content: `**Ayuda (Aid)**

Fortaleces a hasta **3 criaturas** de tu elección dentro del alcance: estos ganan **5 puntos de golpe temporales** y aumentan su **máximo de puntos de golpe actual** en 5 durante la duración.

A niveles superiores: +5 PG temporales por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-alter-self', level: 2, school: 'Transmutación', time: '1 Acción', range: 'Personal', comp: 'V, S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Hechicero', 'Brujo', 'Mago'],
    content: `**Alterar el yo (Alter Self)**

Cambias tu forma física durante 1 hora, eligiendo un **aspecto de transformación** al lanzarlo que se mantiene mientras el conjuro dura: **Aspecto acuático** (puedes respirar bajo el agua, obtienes velocidad de nado), **Cambio de apariencia** (alteras tu apariencia, incluida la forma humanoide y sus extremidades, y <voz>) o **Aspecto bestial parcial** (eliges dos de estos: garras con las que puedes hacer un ataque natural; aletas que te permiten nadar; cuernos; cola; tentáculos).`,
  }),
  sp({
    id: 'spell-animal-messenger', level: 2, school: 'Encantamiento', time: '1 Acción', range: '30 pies', comp: 'V, S, M (un trozo de comida)',
    duration: '24 horas',
    classes: ['Bardo', 'Druida', 'Guardabosques'],
    content: `**Mensajero animal (Animal Messenger)**

Lanzas un hechizo que encomienda a una **bestia Pequena** de tu elección un mensaje para una criatura que reconozcas (una frase de hasta 10 palabras). La bestia viaja al destino y entrega el mensaje mientras puedas mantener su **vínculo** y no sea dañada.

A niveles superiores: +48 horas de duración por nivel de espacio superior al lanzado.`,
  }),
  sp({
    id: 'spell-arcane-lock', level: 2, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S, M (polvo de oro de al menos 25 po)',
    duration: 'Hasta que se disipe',
    classes: ['Mago'],
    content: `**Cierre arcano (Arcane Lock)**

Tocas una **puerta, ventana, cofre u objeto similar** y queda **cerrado mágicamente**: se requiere una llave que tú elijas para abrirlo, y las cerraduras mecánicas y trampas sobre el objeto quedan bloqueadas.

Las criaturas que abran el objeto con un **Conjuro de disipar magia** o un **abrir** un hechizo de nivel 2 o superior pueden abrirlo, y tú puedes reabrir el objeto a voluntad.`,
  }),
  sp({
    id: 'spell-arcanists-magic-aura', level: 2, school: 'Ilusión', time: '1 Acción', range: 'Toque', comp: 'V, S, M (un cuadrado de fieltro plateado)',
    duration: '24 horas',
    classes: ['Mago'],
    content: `**Aura mágica del arcano (Arcanist's Magic Aura)**

Colocas una ilusión en una criatura u objeto que toques durante la duración (24 horas). **Detección de magia** no detecta el aura real del objetivo y en su lugar detecta una de **5 auras falsas** que elijas, y **Detectar el bien y el mal** y conjuros similares no detectan algo que elijas.

Por ejemplo: una criatura puede aparecer como un **elemental** o **aberración**.`,
  }),
  sp({
    id: 'spell-augury', level: 2, school: 'Adivinación', time: '1 minuto', range: 'Personal', comp: 'V, S, M (un juego de naipes de marfil, o dos dados, o caña de pescar)',
    duration: 'Instantáneo',
    classes: ['Clérigo', 'Druida'],
    content: `**Augurio (Augury)**

Lanzas una carta o dado y recibes un **augurio** sobre un curso de acción específico de las próximas 30 minutos: **fortuna**, **infortunio**, **fortuna e infortunio** o **indiferencia**, según las probabilidades de éxito.

El augurio no considera cambios de circunstancias futuras y puede no ser exacto.`,
  }),
  sp({
    id: 'spell-barkskin', level: 2, school: 'Transmutación', time: '1 Acción', range: 'Toque', comp: 'V, S, M (una corteza de roble)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Druida', 'Guardabosques'],
    content: `**Piel cerúlea (Barkskin)**

Tocas a una criatura voluntaria y su piel se vuelve como **corteza de árbol**: su **CA no puede ser inferior a 16** mientras dure el conjuro.`,
  }),
  sp({
    id: 'spell-blindness-deafness', level: 2, school: 'Nigromancia', time: '1 Acción', range: '30 pies', comp: 'V',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Clérigo', 'Hechicero', 'Brujo'],
    content: `**Ceguera y sordera (Blindness/Deafness)**

Ciegas o ensordeces a una criatura de tu elección dentro del alcance hasta que el conjuro termine (o se quiebre su concentración): debe superar una salvación de **CON** o queda **ciega o ensordecida**.

A niveles superiores: puedes afectar a 1 criatura adicional por cada nivel de espacio superior al lanzado (todas dentro de 30 pies).`,
  }),
  sp({
    id: 'spell-blur', level: 2, school: 'Ilusión', time: '1 Acción', range: 'Personal', comp: 'V',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Hechicero', 'Brujo', 'Mago'],
    content: `**Difuminar (Blur)**

Tu cuerpo se vuelve borroso y cambiante por 1 minuto: los **ataques contra ti tienen desventaja** mientras el conjuro esté activo, y las criaturas que dependen de la **vista** para atacarte lo tienen especialmente dificil.`,
  }),
  sp({
    id: 'spell-calm-emotions', level: 2, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Clérigo', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Calmar emociones (Calm Emotions)**

Suprimes las emociones fuertes en una **esfera de 20 pies** dentro del alcance: las criaturas en el área tienen **desventaja en las tiradas de ataque**, y las criaturas afectadas por **miedo o encantamiento** quedan **suprimidos** durante la duración.

Mientras dure, el hechizo puede terminar con una **Acción** y cada criatura afectada obtiene **inmunidad al miedo**.`,
  }),
  sp({
    id: 'spell-continual-flame', level: 2, school: 'Evocación', time: '1 Acción', range: 'Toque', comp: 'V, S, M (rubí en polvo de 50 po + óxido de hierro)',
    duration: 'Hasta que se disipe',
    classes: ['Clérigo', 'Mago'],
    content: `**Llamarada continua (Continual Flame)**

Una llamarada que produce **luz brillante** en un radio de 20 pies y **luz tenue** en otros 20 pies emana de un objeto que tocas. La llama no emite calor, no consume oxígeno ni combustible, y no puede ser apagada con agua.

El efecto es permanente hasta que un **Disipar magia** lo suprima, el objeto se destruye o tú lo finalizas.`,
  }),
  sp({
    id: 'spell-darkness', level: 2, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V, M (un poco de brea o carbón)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Hechicero', 'Brujo', 'Mago'],
    content: `**Oscuridad (Darkness)**

Una **oscuridad mágica** se extiende desde un punto que elijas dentro del alcance en una **esfera de 15 pies de radio**, y se mantiene mientras el conjuro dure. La oscuridad es **impenetrable a la visión oscura** y la luz normal y mágica no puede iluminarla; los rayos solares la disipan.

Si el conjuro se lanza sobre un objeto que llevas y que no está siendo usado, la oscuridad se mueve contigo.`,
  }),
  sp({
    id: 'spell-darkvision', level: 2, school: 'Transmutación', time: '1 Acción', range: 'Toque', comp: 'V, S, M (una zanahoria o un ojo de ágata)',
    duration: '8 horas',
    classes: ['Druida', 'Hechicero', 'Mago', 'Guardabosques'],
    content: `**Visión en la oscuridad (Darkvision)**

Tocas a una criatura voluntaria y le otorgas la capacidad de **ver en la oscuridad** a 60 pies sin luz, usando luz tenue como luz brillante.

A niveles superiores: +1 criatura por cada nivel de espacio superior al lanzado.`,
  }),
  sp({
    id: 'spell-detect-thoughts', level: 2, school: 'Adivinación', time: '1 Acción', range: '30 pies', comp: 'V, S, M (una moneda de cobre)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Mago'],
    content: `**Detectar pensamientos (Detect Thoughts)**

Sondeas los **pensamientos superficiales** de una criatura que puedas ver dentro del alcance: si tiene inteligencia de 3 o menos no la puedes leer, y las criaturas **encantadas** tienen desventaja en la salvación de **SAB**.

Mientras dura, puedes intercambiar pensamientos con la criatura (a distancia de 1 milla) y puedes sondear sus **recuerdos** en busca de un pensamiento relevante.`,
  }),
  sp({
    id: 'spell-dragons-breath', level: 2, school: 'Transmutación', time: '1 Acción de Bonificación', range: 'Toque', comp: 'V, S, M (un diente de dragón)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Hechicero', 'Mago'],
    content: `**Aliento del dragón (Dragon's Breath)**

Tocas a una criatura voluntaria y le otorgas **aliento de dragón**: como **Acción**, puede expeler un **cono de 15 pies** (o línea de 30 pies) de un tipo elegido (ácido, frío, fuego, relámpago, veneno o trueno), causando **3d6 de daño de ese tipo** a las criaturas en el área (salvación de **DES** para media).

A niveles superiores: +1d6 de daño por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-enhance-ability', level: 2, school: 'Transmutación', time: '1 Acción', range: 'Toque', comp: 'V, S, M (una pluma o uña de halcón)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Bardo', 'Clérigo', 'Druida'],
    content: `**Mejorar capacidad (Enhance Ability)**

Tocas a una criatura y le otorgas una **aptitud potenciada**: elige una de estas opciones a la vez.

 **Aguas de la bestia (FUE)**: ventaja en pruebas de FUE, y el peso que puede cargar se duplica.
 **Robustez del gato (DES)**: ventaja en DES.
 **Sabiduría del zorro (SAB)**: ventaja en SAB y pruebas de resolución.
 **Vigor del oso (CON)**: ventaja en CON.
 **Ojos del águila (INT)**: ventaja en INT.
 **Aguas de la bestia (CAR)**: ventaja en CAR.

A niveles superiores: +1 criatura por nivel de espacio superior, con la misma elección de aptitud.`,
  }),
  sp({
    id: 'spell-enlarge-reduce', level: 2, school: 'Transmutación', time: '1 Acción', range: '30 pies', comp: 'V, S, M (una mole de hierro y un vellón de algodón)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Aumentar o reducir (Enlarge/Reduce)**

Aumentas o reduces el tamaño de una criatura o **objeto** a tu elección dentro del alcance. Un objeto no mágico también puede ser afectado.

 **Aumentar:** el objetivo aumenta a una categoría de tamaño mayor, pesa x8, y sus **armas y ataques infligen 1d4 de daño extra** (salvación de **FUE** para reducir el daño).
 **Reducir:** el objetivo disminuye una categoría, pesa x0.125, y sus armas y ataques infligen **1d4 menos** (si no daño mínimo).

Con **Acción** puedes cambiar entre aumentar y reducir mientras dura.`,
  }),
  sp({
    id: 'spell-enthrall', level: 2, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: '1 minuto',
    classes: ['Bardo', 'Clérigo', 'Brujo'],
    content: `**Cautivar (Enthrall)**

Cautivas a las criaturas de tu elección que puedas ver dentro del alcance: cada una que pueda oírte y que no esté a menos de 5 pies de ti queda **encantada** por ti durante 1 minuto, y su **velocidad de movimiento es 0** mientras no reciban daño.

Cuando la criatura recibe daño, el efecto termina si supera una salvación de **SAB**.`,
  }),
  sp({
    id: 'spell-find-steed', level: 2, school: 'Conjuración', time: '10 minutos', range: '30 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Paladín'],
    content: `**Encontrar montura (Find Steed)**

Un **espíritu de montura** feérico, celestial o infernal aparece en una criatura que elijas: puedes montarlo, y mientras lo haces, el conjuro lo hace aliado. El espíritu puede aparecer en forma de caballo, caballo de guerra, poni, camello, alce o mastín, y es **afectado por tus conjuros de toque**.

A niveles superiores: +2 horas de duración del vínculo mágico.`,
  }),
  sp({
    id: 'spell-find-traps', level: 2, school: 'Adivinación', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Clérigo', 'Druida', 'Guardabosques'],
    content: `**Encontrar trampas (Find Traps)**

Detectas trampas del tipo que puedas nombrar (correderas, fosos, trampas con sensor de presión y que no estén cubiertas en **El pozo de 30 pies**). El conjuro revela la presencia de una **trampa** en un **cubo de 30 pies** dentro del alcance pero no su ubicación, solo que existe.

Para ubicarlas, se requiere **investigación** adicional (por ejemplo, un objeto que caiga en el foso lo revela).`,
  }),
  sp({
    id: 'spell-flame-blade', level: 2, school: 'Evocación', time: '1 Acción de Bonificación', range: 'Personal', comp: 'V, S, M (una hoja de acacia)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Druida'], damage: '3d6',
    content: `**Espada de llamas (Flame Blade)**

Creas una espada de fuego en tu mano libre que **se apaga cuando la sueltas** y que puedes usar para hacer un **ataque de distancia de golpe** que inflige **3d6 de daño de fuego** a un objetivo a 5 pies.

El daño aumenta en 1d6 por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-flaming-sphere', level: 2, school: 'Conjuración', time: '1 Acción', range: '60 pies', comp: 'V, S, M (un poco de brea, telarañas y grasa)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Druida'], damage: '2d6',
    content: `**Esfera de fuego (Flaming Sphere)**

Una **esfera de fuego de 5 pies de diámetro** aparece en un punto sin obstrucciones dentro del alcance y emite **luz brillante** en un radio de 20 pies. Las criaturas que entren o terminen su turno dentro de ella deben superar una salvación de **DES** o reciben **2d6 de daño de fuego**.

El fuego se propaga a criaturas y objetos inflamables. La puedes mover hasta 30 pies con una **Acción de Bonificación**.

El daño aumenta en 1d6 por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-gentle-repose', level: 2, school: 'Nigromancia', time: '1 Acción', range: 'Toque', comp: 'V, S, M (una moneda de plata o un guijarro)',
    duration: '10 días',
    classes: ['Clérigo', 'Druida'],
    content: `**Reposo apacible (Gentle Repose)**

Tocas el cadáver de una criatura y queda **protegido del deterioro**: no puede convertirse en no-muerto y su cuerpo no se descompone durante 10 días.

El conjuro también extiende el límite de tiempo para los conjuros que requieren un cadáver para revivir al target.`,
  }),
  sp({
    id: 'spell-gust-of-wind', level: 2, school: 'Evocación', time: '1 Acción', range: 'Personal', comp: 'V, S, M (una semilla de legumbre)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Druida', 'Hechicero', 'Mago'],
    content: `**Ráfaga de viento (Gust of Wind)**

Una **línea de viento de 60 pies de largo y 10 pies de ancho** emana de ti en una dirección que elijas. Las criaturas dentro de la línea deben superar una salvación de **FUE** o son **empujadas 10 pies** alejadas de ti; si son Grandes o más pequeñas, son empujadas hasta 15 pies.

El viento puede sofocar llamas, dispersar niebla y mover objetos sueltos.`,
  }),
  sp({
    id: 'spell-heat-metal', level: 2, school: 'Transmutación', time: '1 Acción', range: '60 pies', comp: 'V, S, M (una herradura de hierro)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Druida'], damage: '2d8',
    content: `**Calentar metal (Heat Metal)**

Elige un objeto de metal manufacturado que puedas ver dentro del alcance, como un arma o armadura. Las criaturas que lo toquen o sostengan reciben **2d8 de daño de fuego** al inicio de tu turno (salvación de **CON** para media), y mientras dure el conjuro el objeto está **brillante al rojo vivo**.

Como **Acción de Bonificación** puedes repetir el daño cada turno. Si el objetivo está agarrado por el objeto (armadura), tiene **desventaja en los ataques**.

El daño aumenta en 1d8 por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-knock', level: 2, school: 'Transmutación', time: '1 Acción', range: '60 pies', comp: 'V',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Abrir (Knock)**

Eliges un objeto que puedas ver dentro del alcance y que esté **cerrado** o **bloqueado** mágicamente (una puerta con llave, un cofre, una cadena, un grillete): produces un **golpe de sonido** que abre el objeto y silencia las cerraduras en un radio de 10 pies.

Un conjuro de **Cierre arcano** puede ser abierto por este hechizo, suprimido durante los siguientes 10 minutos.`,
  }),
  sp({
    id: 'spell-lesser-restoration', level: 2, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Paladín', 'Guardabosques'],
    content: `**Restablecimiento menor (Lesser Restoration)**

Tocas a una criatura y **terminas una de estas condiciones** que la aqueja: **asustada**, **paralizada** o **envenenada**.`,
  }),
  sp({
    id: 'spell-levitate', level: 2, school: 'Transmutación', time: '1 Acción', range: '60 pies', comp: 'V, S, M (un alambre o tira de cuero)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Hechicero', 'Mago'],
    content: `**Levitar (Levitate)**

Una criatura u objeto de tu elección que puedas ver dentro del alcance asciende verticalmente hasta **20 pies** hacia el aire y permanece flotando ahí mientras el conjuro dura (si el objetivo es una criatura voluntaria, la altitud es opcional).

Puedes cambiar la altitud hasta 20 pies por asalto con una **Acción**. Si un objetivo inanimado pesa más de 500 libras, el conjuro falla.`,
  }),
  sp({
    id: 'spell-locate-animals-or-plants', level: 2, school: 'Adivinación', time: '1 Acción', range: 'Personal', comp: 'V, S, M (una pizca de pelo de glotón)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Bardo', 'Druida', 'Guardabosques'],
    content: `**Localizar animales o plantas (Locate Animals or Plants)**

Describe o nombra una clase de animal o planta (no una criatura concreta): el hechizo detecta la **dirección y distancia** al ejemplar más cercano de esa clase dentro de **5 millas**, si existe.

Si la describo con claridad (zorro, árbol frutal), el hechizo localiza al ejemplar más cercano.`,
  }),
  sp({
    id: 'spell-locate-object', level: 2, school: 'Adivinación', time: '1 Acción', range: 'Personal', comp: 'V, S, M (una brújula y una aguja)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Bardo', 'Clérigo', 'Druida', 'Mago'],
    content: `**Localizar objeto (Locate Object)**

Describe o nombra un **objeto conocido** (no una criatura) que esté dentro de **1,000 pies**: descubres su **dirección y distancia**.

Mientras mantienes el conjuro puedes desplazarte para seguir su rastro, pero si el objeto está cubierto por **hoja de plomo** de al menos 1 pie de grosor, el hechizo falla.`,
  }),
  sp({
    id: 'spell-magic-mouth', level: 2, school: 'Ilusión', time: '1 minuto', range: '30 pies', comp: 'V, S, M (un trozo de colmena de panal)',
    duration: 'Hasta que se disipe',
    classes: ['Bardo', 'Mago'],
    content: `**Boca mágica (Magic Mouth)**

Creas un **objeto animado** a distancia: un objeto que tocas puede contener **un mensaje de hasta 25 palabras** que emite cuando una **condición** que defines se cumple.

El mensaje es **audible** o **telepático** a una criatura que cumpla la condición. Puedes comunicar mensajes encriptados o con lenguaje de señas.`,
  }),
  sp({
    id: 'spell-magic-weapon', level: 2, school: 'Transmutación', time: '1 Acción de Bonificación', range: 'Toque', comp: 'V, S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Clérigo', 'Paladín', 'Guardabosques'],
    content: `**Arma mágica (Magic Weapon)**

Tocas un arma no mágica y se vuelve **mágica**: sus ataques infligen **un +1 al dado de daño** (es decir, +1 a las tiradas de ataque y daño) durante la duración.

A niveles superiores: +1 adicional por nivel de espacio superior al 2 (máximo +3), y si el arma es munición, la magia se transfiere a las piezas lanzadas.`,
  }),
  sp({
    id: 'spell-mind-spike', level: 2, school: 'Adivinación', time: '1 Acción', range: '60 pies', comp: 'S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Druida', 'Hechicero', 'Mago'], damage: '3d8',
    content: `**Púa mental (Mind Spike)**

Proyectas un cono de energía psíquica contra una criatura dentro del alcance: haz un **ataque a distancia de conjuro**. Si impacta, recibe **3d8 de daño psíquico** y debe superar una salvación de **INT** o la división de su **visión mental** se rompe: si tiene **telepatía**, perderla hasta que termine tu próximo turno.

A niveles superiores: +1d8 de daño por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-phantasmal-force', level: 2, school: 'Ilusión', time: '1 Acción', range: '60 pies', comp: 'V, S, M (un botón de seda)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Mago'],
    content: `**Fuerza fantasmal (Phantasmal Force)**

Creas una ilusión que solo la **criatura objetivo** percibe durante 1 minuto: describe una **aparición** (por ejemplo, un pozo de fuego o un monstruo) que el objetivo tratará como real.

Mientras dura y el objetivo no supere sus pruebas de **intelecto (Investigación)** para desmentir el conjuro (cada turno, una vez), este recibe **1d6 de daño psíquico** por asalto (salvación de **INT** para media).`,
  }),
  sp({
    id: 'spell-prayer-of-healing', level: 2, school: 'Evocación', time: '10 minutos', range: '30 pies', comp: 'V',
    duration: 'Instantáneo',
    classes: ['Clérigo', 'Paladín'],
    content: `**Plegaria de curación (Prayer of Healing)**

Hasta **6 criaturas** a tu elección dentro del alcance recuperan **2d8 + tu modificador de aptitud mágica** de puntos de golpe.

El conjuro no tiene efecto sobre no-muertos ni constructos.

A niveles superiores: +1d8 de curación por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-protection-from-poison', level: 2, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Clérigo', 'Druida', 'Paladín'],
    content: `**Protección contra el veneno (Protection from Poison)**

Tocas a una criatura y, mientras dure el conjuro, está **protegida contra el veneno**: tiene **ventaja en las salvaciones contra veneno**, es **inmune al daño de veneno** y está **inmune a la condición de envenenado**; si ya estaba envenenada, el efecto se suprime mientras dura.

Si la criatura es un animal que consume algo envenenado, esta protección puede purgar el veneno del cuerpo.`,
  }),
  sp({
    id: 'spell-ray-of-enfeeblement', level: 2, school: 'Nigromancia', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Brujo', 'Mago'], damage: '3d6',
    content: `**Rayo de debilitamiento (Ray of Enfeeblement)**

Un rayo negro brota de tu dedo hacia una criatura dentro del alcance: haz un **ataque a distancia de conjuro**. Si impacta, el objetivo recibe **3d6 de daño necrótico** y su **Fuerza** se reduce en 2 (salvación de **CON** al final de sus turnos para curarse).

El daño aumenta en 1d6 por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-rope-trick', level: 2, school: 'Transmutación', time: '1 Acción', range: 'Toque', comp: 'V, S, M (una varilla de lento)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Bardo', 'Mago'],
    content: `**Truco de cuerda (Rope Trick)**

Toque de **teletransporte**:

Creas un **espacio extradimensional invisible** en un punto de 3 pies que tocas (por ejemplo, de un techo). Un extremo de una cuerda toca el espacio y el otro cuelga visible al nivel de una criatura Pequena o Mediana.

Hasta 8 criaturas (o el número que quepan) pueden subir por la cuerda al **espacio extradimensional** para descansar y ocultarse. El espacio dura hasta que el conjuro termine.`,
  }),
  sp({
    id: 'spell-see-invisibility', level: 2, school: 'Adivinación', time: '1 Acción', range: 'Personal', comp: 'V, S, M (una pizca de talco)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Ver lo invisible (See Invisibility)**

Durante la duración, ves **criaturas y objetos invisibles** como formas translúcidas, y puedes ver a través de **oscuridad mágica** (solo las figuras). Los **conjuros invisibles**, los **espíritus** y las criaturas etéreas son visibles.

Este hechizo no revela criaturas en el **plano etéreo**.`,
  }),
  sp({
    id: 'spell-shining-smite', level: 2, school: 'Evocación', time: '1 Acción de Bonificación', range: 'Personal', comp: 'V',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Paladín'], damage: '2d6',
    content: `**Golpe brillante (Shining Smite)**

Tu arma irradia luz mientras dure el conjuro. La próxima vez que impactes a una criatura con un ataque con armas mientras esté activo, puedes terminar el conjuro: el objetivo recibe **2d6 de daño radiante adicional**, queda **visible** (no puede ser invisible) y su **velocidad se reduce a 0** hasta el final de tu próximo turno (salvación de **CON** para reducir la velocidad a la mitad).`,
  }),
  sp({
    id: 'spell-silence', level: 2, school: 'Ilusión', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Bardo', 'Clérigo', 'Druida', 'Guardabosques', 'Hechicero'],
    content: `**Silencio (Silence)**

Un **cubo de 20 pies** dentro del alcance queda envuelto en **silencio mágico** durante 10 minutos. Ningún sonido puede crearse o pasar dentro o a través del área, y las criaturas en ella son **sordas** a todo sonido. Los conjuros que requieren **componentes verbales** no pueden lanzarse en el área.`,
  }),
  sp({
    id: 'spell-spider-climb', level: 2, school: 'Transmutación', time: '1 Acción', range: 'Toque', comp: 'V, S, M (un poco de betún)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Hechicero', 'Brujo', 'Mago'],
    content: `**Escalar como araña (Spider Climb)**

Hasta que el conjuro termine, la criatura tocada puede **moverse por paredes y techos** verticales, y puede trepar mientras tenga manos libres, sin necesidad de tirar escalada.

Además gana **velocidad de escalada** igual a su velocidad de movimiento, y puede moverse por **techos** sin penalización por mano libre.`,
  }),
  sp({
    id: 'spell-spike-growth', level: 2, school: 'Conjuración', time: '1 Acción', range: '150 pies', comp: 'V, S, M (siete espinas afiladas o siete agujas)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Druida', 'Guardabosques'], damage: '2d4',
    content: `**Crecimiento de púas (Spike Growth)**

El suelo en un **radio de 20 pies** dentro del alcance se cubre con **espinas retorcidas y afiladas**, contando como **terreno difícil** durante 10 minutos.

Cuando una criatura entra o comienza el turno en el área, recibe **2d4 de daño de perforante** (salvación de **CON** para media), y su velocidad se reduce a la mitad.`,
  }),
  sp({
    id: 'spell-suggestion', level: 2, school: 'Encantamiento', time: '1 Acción', range: '30 pies', comp: 'V, M (lengua de serpiente)',
    duration: 'Concentración, hasta 8 horas', conc: true,
    classes: ['Bardo', 'Clérigo', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Sugestión (Suggestion)**

Sugieres un curso de acción (descrito en una frase de dos oraciones como máximo) a una criatura que puedas oír y ver dentro del alcance: debe superar una salvación de **SAB** o hará lo que sugieras de la forma más razonable que pueda, durante la duración o hasta que complete la tarea.

El conjuro no puede ordenar acciones que causen daño directo a la criatura.`,
  }),
  sp({
    id: 'spell-warding-bond', level: 2, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S, M (un par de anillos de platino por 50 po)',
    duration: '1 hora',
    classes: ['Clérigo'],
    content: `**Vínculo de protección (Warding Bond)**

Dos criaturas voluntarias que toques quedan **vinculadas mágicamente** durante 1 hora: mientras ambas vivan, cada una recibe **+1 de CA** y **+1 de salvación**, y **resiste el daño** (el daño que recibe una se distribuye a partes iguales entre ambas).

El que lleva el anillo recibe primero la mitad del daño y la otra criatura el resto; el daño se reduce adecuadamente.`,
  }),
  sp({
    id: 'spell-zone-of-truth', level: 2, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Bardo', 'Clérigo', 'Paladín'],
    content: `**Zona de la verdad (Zone of Truth)**

Creas una **esfera de 15 pies de radio** dentro del alcance donde nadie puede mentir mientras el conjuro dure: cada criatura que entre o comience ahí debe superar una salvación de **CAR** o **no podrá engañar a sabiendas**.

La criatura rompe el conjuro si hace una salvación exitosa contra **disipar magia**, y hasta entonces no puede aprovechar una **mentira deliberada**, aunque omitir detalles no es mentir.`,
  }),

  // ---------------- Nivel 3 ----------------
  sp({
    id: 'spell-counterspell', level: 3, school: 'Abjuración', time: '1 Reacción', range: '60 pies', comp: 'S',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago', 'Brujo'],
    content: `**Contraconjuro (Counterspell)**\n\nReacción cuando una criatura lanza un conjuro a 60 pies. El conjuro **falla**.\n\nSi el conjuro es de nivel 4+, haz una prueba (INT del lanzador) contra CD 10 + nivel del conjuro.`,
  }),
  sp({
    id: 'spell-fireball', level: 3, school: 'Evocación', time: '1 Acción', range: '150 pies', comp: 'V, S, M',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago'], damage: '8d6',
    content: `**Bola de fuego (Fireball)**\n\nGigantesca explosión en un punto al alcance (radio 20 pies). Las criaturas (salvación de **DES**) reciben **8d6** de daño de **fuego**; fallo, la mitad.\n\nA niveles superiores: +1d6 por nivel.`,
  }),
  sp({
    id: 'spell-fly', level: 3, school: 'Transmutación', time: '1 Acción', range: 'Contacto', comp: 'V, S, M',
    duration: '10 minutos', conc: true, classes: ['Hechicero', 'Mago', 'Brujo'],
    content: `**Vuelo (Fly)**\n\nUna criatura tocada obtiene **velocidad de vuelo de 60 pies** durante 10 minutos. Al final, si aún está en el aire, cae.\n\nA niveles superiores: +1 objetivo por nivel.`,
  }),
  sp({
    id: 'spell-haste', level: 3, school: 'Transmutación', time: '1 Acción', range: '30 pies', comp: 'V, S, M',
    duration: '1 minuto', conc: true, classes: ['Hechicero', 'Mago'],
    content: `**Acelerar (Haste)**\n\nUna criatura obtiene: +2 a CA, ventaja en salvaciones de **DES**, velocidad duplicada y una **Acción de Bonificación** extra (Atacar sin armas, carrera o similar) por ronda.\n\nAl terminar, la criatura no puede moverse ni actuar durante 1 ronda (aturdida).`,
  }),
  sp({
    id: 'spell-hypnotic-pattern', level: 3, school: 'Ilusión', time: '1 Acción', range: '120 pies', comp: 'S, M',
    duration: '1 minuto', conc: true, classes: ['Bardo', 'Brujo', 'Hechicero', 'Mago'],
    content: `**Patrón hipnótico (Hypnotic Pattern)**\n\nPautas de color (cubo de 30 pies) **Encantan** a las criaturas (salvación de **SAB**): Incapacitadas y velocidad 0. Si la víctima recibe daño o alguien la sacude, el efecto termina para ella.`,
  }),
  sp({
    id: 'spell-lightning-bolt', level: 3, school: 'Evocación', time: '1 Acción', range: 'Personal (100 x 5 pies)', comp: 'V, S, M',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago'], damage: '8d6',
    content: `**Rayo (Lightning Bolt)**\n\nUn rayo lineal de 100 x 5 pies. Las criaturas (salvación de **DES**) reciben **8d6** de daño de **relámpago**; fallo, la mitad.\n\nA niveles superiores: +1d6 por nivel.`,
  }),
  sp({
    id: 'spell-revivify', level: 3, school: 'Nigromancia', time: '1 Acción', range: 'Contacto', comp: 'V, S, M',
    duration: 'Instantáneo', classes: ['Clérigo', 'Paladín'],
    content: `**Revivir (Revivify)**\n\nTocas una criatura muerta en el último **minuto** y la devuelves a la vida con **1 PG**. No curas heridas ni vicios.\n\n*Consume un **diamante de 300 PO** al lanzarlo.*`,
  }),
  sp({
    id: 'spell-spirit-guardians', level: 3, school: 'Conjuración', time: '1 Acción', range: 'Personal (15 pies)', comp: 'V, S, M',
    duration: '10 minutos', conc: true, classes: ['Clérigo'], damage: '3d8',
    content: `**Guardianes espirituales (Spirit Guardians)**\n\nEspíritus espectrales rodean en un radio de 15 pies (velocidad 0 dentro). Cuando aparecen y en CDC turno (salvación de **SAB**): 3d8 de daño **radiante** (o **necrótico**), mitad al tener éxito.\n\nA niveles superiores: +1d8 por nivel.`,
  }),
  sp({
    id: 'spell-animate-dead', level: 3, school: 'Nigromancia', time: '1 minuto', range: '30 pies', comp: 'V, S, M (una gota de sangre, un trozo de carne y un polvo de hueso)',
    duration: 'Concentración, hasta 24 horas', conc: true,
    classes: ['Clérigo', 'Mago'],
    content: `**Animar muertos (Animate Dead)**\n\nCreas **servidores no muertos** a partir de restos en el suelo dentro del alcance: animas **1 esqueleto** o **esbirro zombi** (CR 1/4) que obedece tus órdenes simples durante la duración.\n\nPuedes ordenarles a un máximo de 4 de tus esbirros que realicen una **tarea simple** si están a 60 pies. Cuando el conjuro termina, vuelven a ser inanimados.\n\nA niveles superiores: +2 esbirros adicionales por cada nivel de espacio superior al 3.`,
  }),
  sp({
    id: 'spell-beacon-of-hope', level: 3, school: 'Abjuración', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Clérigo'],
    content: `**Faro de esperanza (Beacon of Hope)**\n\nUna energía esperanzadora emana de ti en un **radio de 30 pies** durante 1 minuto. Las criaturas de tu elección dentro del radio tienen **ventaja en las salvaciones contra la muerte** y, cuando recuperan puntos de golpe (por conjuro, poción u otro), recuperan **el máximo** en lugar de tirar.`,
  }),
  sp({
    id: 'spell-bestow-curse', level: 3, school: 'Nigromancia', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Clérigo', 'Brujo', 'Mago'],
    content: `**Imponer maldición (Bestow Curse)**\n\nTocas a una criatura; debe superar una salvación de **SAB** o queda maldita mientras dure el conjuro. Elige el efecto de la maldición: opción A de daño (**+1d8 necrótico** por ataque que le inflijas), opción B de **desventaja en tiradas de aptitud y salvaciones** de una característica, opción C de **desventaja en ataques contra ti**, o \u2026 una maldición personalizada de tu elección.\n\nSi la lanzas con un espacio de nivel 5+, la duración es de 8 horas; nivel 7+, 24 horas; nivel 9+, permanente hasta que la levantes.`,
  }),
  sp({
    id: 'spell-blink', level: 3, school: 'Transmutación', time: '1 Acción', range: 'Personal', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Hechicero', 'Mago'],
    content: `**Parpadeo (Blink)**\n\nTe paseas entre el **Plano Etéreo**: al final de tu turno, tira **1d6** y si sacas **3 o más**, desapareces hasta el inicio de tu próximo turno (puedes ver y ser visto por criaturas etéreas, pero no por las del Plano Material a menos que tengan visión de ese plano).\n\nRegresas a un espacio desocupado visible desde tu ubicación etérea.`,
  }),
  sp({
    id: 'spell-call-lightning', level: 3, school: 'Conjuración', time: '1 Acción', range: 'Personal (1112 pies de radio)', comp: 'V, S',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Druida'], damage: '3d10',
    content: `**Invocar relámpago (Call Lightning)**\n\nUna tormenta se acumula sobre ti en un **radio de 120 pies**, y durante la duración puedes usar tu **Acción** para hacer caer un relámpago sobre un punto del radio que puedas ver: las criaturas en un **radio de 5 pies** de él reciben **3d10 de daño de relámpago** (salvación de **DES** para la mitad) y un **retumbar de trueno** (o 3d10 de daño de trueno como alternativa si prefieres sonido).\n\nIncrementa los d10 a 4 en una tormenta real.\n\nA niveles superiores: +1d10 por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-clairvoyance', level: 3, school: 'Adivinación', time: '10 minutos', range: '1 milla', comp: 'V, S, M (un foco, un cuerno de buen oro)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Bardo', 'Clérigo', 'Hechicero', 'Mago'],
    content: `**Clarividencia (Clairvoyance)**\n\nCreas un **sensor invisible** en un punto dentro de 1 milla que te permite **ver u oír** (elige uno al lanzarlo) en esa ubicación durante la concentración.\n\nCon una Acción puedes alternar entre ver y oír, y puedes desplazar el sensor a lugares sin obstrucciones desde tu visión de 360 grados.`,
  }),
  sp({
    id: 'spell-conjure-animals', level: 3, school: 'Conjuración', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Druida', 'Guardabosques'],
    content: `**Conjurar animales (Conjure Animals)**\n\nConjuras **animales feéricos** en un punto sin obstrucciones dentro del alcance: eligen entre **4 bestias CR 1/4, 2 bestias CR 1/2**, **1 bestia CR 1**, o eliges una combinación (hasta **2 bestias CR 1/2** y **4 bestias CR 1/4**).\n\nLas bestias son aliadas hostiles y obedecen tus órdenes verbales; atacan a tu orden. Obtienen ventaja contra ti. Al terminar la concentración, desaparecen.\n\nA niveles superiores: el número de bestias se duplica por cada dos niveles de espacio superiores al 3.`,
  }),
  sp({
    id: 'spell-create-food-and-water', level: 3, school: 'Conjuración', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Clérigo', 'Paladín'],
    content: `**Crear comida y agua (Create Food and Water)**\n\nCreas hasta **45 libras de comida y 30 galones de agua** en el suelo o en un recipiente dentro del alcance, suficiente para sostener a **15 criaturas Humanoides o 5 monturas** durante un día.\n\nLa comida se echa a perder si no se consume en 24 horas.`,
  }),
  sp({
    id: 'spell-daylight', level: 3, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Clérigo', 'Druida', 'Paladín', 'Guardabosques'],
    content: `**Luz del día (Daylight)**\n\nSe crea una **luz brillante de 60 pies de radio** (y luz tenue otros 60 pies) en un punto que elijas dentro del alcance; puedes emitirla desde un objeto que sujetes.\n\nLa luz **suprime la oscuridad mágica** de nivel 2 o menor en el área y, si se conjura sobre un punto por el que pasa **oscuridad mágica** de un conjuro de mayor nivel, compiten como si fueran mutuamente excluyentes.`,
  }),
  sp({
    id: 'spell-dispel-magic', level: 3, school: 'Abjuración', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Paladín', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Disipar magia (Dispel Magic)**\n\nEliges una criatura, objeto o efecto mágico dentro del alcance: cualquier conjuro de **nivel 3 o menor** que lo afecte termina.\n\nPara conjuros de nivel 4 o mayor, haz una prueba de **aptitud mágica** con CD 10 + el nivel; por cada nivel de espacio superior al 3, el conjuro a disipar se considera 1 nivel menos.\n\nA niveles superiores: disipa automáticamente conjuros de nivel 3 o inferior.`,
  }),
  sp({
    id: 'spell-fear', level: 3, school: 'Ilusión', time: '1 Acción', range: 'Personal (30 pies de cono)', comp: 'V, S, M (una pluma blanca)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Miedo (Fear)**\n\nProyectas una imagen aterradora en un **cono de 30 pies**: cada criatura en el área debe superar una salvación de **SAB** o queda **asustada** por ti durante la duración, y **tira sus pertenencias** para **huir** hasta que pueda esconderse.\n\nAl final de cada turno, repite la salvación; si termina con éxito, deja de estar asustada.`,
  }),
  sp({
    id: 'spell-gaseous-form', level: 3, school: 'Transmutación', time: '1 Acción', range: 'Toque', comp: 'V, S, M (un trozo de gasa y brasas)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Bardo', 'Druida', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Forma gaseosa (Gaseous Form)**\n\nTransformas a una criatura voluntaria que toques (y sus objetos) en una **nube gaseosa**: no puede atacar ni lanzar conjuros, tiene **resistencia a daño no mágico** (excepto mágico), **inmune a veneno**, **inmunidad a críticos** y no puede caer.\n\nPuede moverse a través de aberturas pequeñas, tiene **velocidad de vuelo 20 pies** (deslizamiento) y no ofrece **cobertura**.`,
  }),
  sp({
    id: 'spell-glyph-of-warding', level: 3, school: 'Abjuración', time: '1 hora', range: 'Toque', comp: 'V, S, M (incienso y polvo de diamante de al menos 200 po)',
    duration: 'Hasta que se disipe',
    classes: ['Bardo', 'Clérigo', 'Mago'],
    content: `**Glifo de custodia (Glyph of Warding)**\n\nNo puedes lanzar este conjuro mientras estás en movimiento o en un campo de batalla: grabas un **glifo** de hasta 10 pies de diámetro en una superficie (o dentro de un objeto), invisible hasta que se **activa** por una condición que defines (paso, tacto, apertura, etc.).\n\nAl activarse: **conjuro de custodia** (lanza un conjuro almacenado de nivel 3 o menor apuntando al intruso) u **explosión rúnica** (5d8 de daño de fuego, ácido, relámpago o trueno a tu elección en un radio de 20 pies; salvación de DES para la mitad).`,
  }),
  sp({
    id: 'spell-magic-circle', level: 3, school: 'Abjuración', time: '1 minuto', range: '10 pies', comp: 'V, S, M (agua bendita y plata en polvo de al menos 100 po)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Clérigo', 'Paladín', 'Brujo', 'Mago'],
    content: `**Círculo mágico (Magic Circle)**\n\nCreas un círculo de 10 pies de radio y 20 pies de alto en el suelo contra un tipo de criatura (celestial, elemental, feérico, fiendo o no-muerto): esos tipos no pueden entrar en el área.\n\nPuedes elegir 4 rs que **repelan al tipo**: las criaturas del tipo tiene desventaja en los ataques contra las del interior y las criaturas de dentro tienen ventaja en las salvaciones contra las del exterior.\n\nPuedes lanzar un conjuro que afecte a un tipo concreto (como un collar de iniquidad) y canalizarlo a través del círculo para atrapar, pero esto consume la concentración.`,
  }),
  sp({
    id: 'spell-major-image', level: 3, school: 'Ilusión', time: '1 Acción', range: '120 pies', comp: 'V, S, M (un trozo de vellón)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Bardo', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Imagen mayor (Major Image)**\n\nCreas una imagen de un **objeto, criatura o fenómeno** coherente (con sonido y **olor**) dentro de un **cubo de 20 pies**. El imagen puede crear sonido, luz y olor. Puedes moverla dentro del alcance con una Acción, y al ser inspeccionada una **prueba de Investigación** (CD 8 + tu aptitud mágica) la revela como ilusión.`,
  }),
  sp({
    id: 'spell-mass-healing-word', level: 3, school: 'Evocación', time: '1 Acción de Bonificación', range: '60 pies', comp: 'V',
    duration: 'Instantáneo',
    classes: ['Clérigo'], damage: '4d4',
    content: `**Palabra de curación masiva (Mass Healing Word)**\n\nHasta **6 criaturas** de tu elección dentro del alcance recuperan **4d4 + tu modificador de aptitud mágica** de puntos de golpe.\n\nA niveles superiores: +1d4 por nivel de espacio superior al 3.`,
  }),
  sp({
    id: 'spell-meld-into-stone', level: 3, school: 'Transmutación', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Concentración, hasta 8 horas', conc: true,
    classes: ['Clérigo', 'Druida'],
    content: `**Fundirse en la piedra (Meld into Stone)**\n\nEntras en piedra natural o trabajada lo bastante grande como para contenerte, junto con tu equipo. Quedas a 1 pie de la superficie, oculto y seguro.\n\nPercibes a través de la superficie las condiciones exteriores (sonidos, luz, etc.). Los conjuros que te expulsan (terremoto, movimiento de tierra) te dañan o te obligan a salir.`,
  }),
  sp({
    id: 'spell-nondetection', level: 3, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S, M (un trozo de diamante en polvo de 25 po)',
    duration: 'Concentración, hasta 8 horas', conc: true,
    classes: ['Bardo', 'Guardabosques', 'Brujo', 'Mago'],
    content: `**No detección (Nondetection)**\n\nInterrumpes las **adivinaciones** que apuntan a una criatura u objeto que toques durante la duración (8 horas).\n\nEl objetivo no puede ser objetivo de **adivinación** (detectar pensamientos, escudriñar, detectar magia, etc.) por otros medios. Los objetivos de adivinación deben superar 8 + tu aptitud para detectarlo.`,
  }),
  sp({
    id: 'spell-phantom-steed', level: 3, school: 'Ilusión', time: '1 minuto', range: '30 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Mago'],
    content: `**Caballo fantasma (Phantom Steed)**\n\nUn gran **caballo casi real** aparece (debe quedar en un espacio desocupado) y tiene las estadísticas de un caballo de montar, pero es **intangible mientras no lo montas** (puede atravesar obstáculos).\n\nSi montas a caballo y estás a 1 milla, puedes compartir conjuros con tu montura (por ejemplo, tocar). El caballo puede ser atacado (AC 12, 30 PG, se desvanece si muere) y el conjuro termina si la ilusión muere o superas 1 milla.`,
  }),
  sp({
    id: 'spell-plant-growth', level: 3, school: 'Transmutación', time: '1 Acción u 8 horas', range: '150 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Druida', 'Guardabosques'],
    content: `**Crecimiento vegetal (Plant Growth)**\n\n**Modo 8 horas:** enriqueces el suelo en un **radio de 1 milla** del punto elegido, haciendo que las cosechas produzcan el doble de comida, y las plantas crecen y mejoran.\n\n**Modo normal (1 Acción):** en un **radio de 100 pies** al punto elegido, las plantas se retuercen y se vuelven **terreno difícil**; cada **d4 pies** de velocidad excepto las que vuelan o son con plantas.`,
  }),
  sp({
    id: 'spell-protection-from-energy', level: 3, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Clérigo', 'Druida', 'Paladín', 'Guardabosques', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Protección contra la energía (Protection from Energy)**\n\nTocas a una criatura voluntaria y le otorgas **resistencia** a un tipo de daño elijas al lanzarlo (**ácido, frío, fuego, relámpago o trueno**): recibe la mitad de daño de ese tipo durante la duración.\n\nA niveles superiores: +1 criatura por cada nivel de espacio superior al 3.`,
  }),
  sp({
    id: 'spell-remove-curse', level: 3, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Clérigo', 'Paladín', 'Brujo', 'Mago'],
    content: `**Quitar maldición (Remove Curse)**\n\nTocas a una criatura u objeto y terminas **todas las maldiciones** que lo afectan, incluidas las de objetos malditos (que vuelven a poder ser retirados) y las del conjuro de Imponer maldición.\n\nEl conjuro no restaura PG ni estado ni elimina maldiciones heredadas del nacimiento.`,
  }),
  sp({
    id: 'spell-sending', level: 3, school: 'Evocación', time: '1 Acción', range: 'Ilimitado', comp: 'V, S, M (un alambre de cobre)',
    duration: '1 asalto',
    classes: ['Bardo', 'Clérigo', 'Mago'],
    content: `**Enviar (Sending)**\n\nEnvías un **mensaje de hasta 25 palabras** a una criatura que conozcas y que esté en tu mismo plano de existencia; la criatura lo recibe y puede responder con otro de 25 palabras en **1 asalto**.\n\nSi la criatura está en otro plano, el mensaje tiene un **5% de posibilidades de no llegar**.`,
  }),
  sp({
    id: 'spell-sleet-storm', level: 3, school: 'Conjuración', time: '1 Acción', range: '150 pies', comp: 'V, S, M (una gota de agua y un guijarro)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Druida', 'Hechicero', 'Mago'],
    content: `**Tormenta de aguanieve (Sleet Storm)**\n\nUna tormenta de hielo y granizo azota un **radio de 40 pies cúbicos** (20 pies en todas las direcciones, 20 pies de alto) en un punto del alcance: la tormenta se mantiene mientras dura, apaga fuegos y es **terreno difícil**.\n\nLas criaturas que comiencen o terminen su turno dentro deben superar una salvación de **DES** o caen **postradas**; y las que intenten lanzar un conjuro con concentración deben hacer una salvación de **CON** (CD 10) o pierden la concentración.`,
  }),
  sp({
    id: 'spell-slow', level: 3, school: 'Transmutación', time: '1 Acción', range: '120 pies', comp: 'V, S, M (una gota de melaza)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Ralentizar (Slow)**\n\nHasta **6 criaturas** de tu elección en un cubo de 40 pies dentro del alcance deben superar una salvación de **SAB** o se ven afectadas: su velocidad se reduce a la mitad, sufren -2 de CA y de salvaciones de DES, pierden su acción de bonificación y **solo pueden hacer una Acción o una Acción de Bonificación en su turno**.\n\nPueden repetir la salvación al final de cada turno.`,
  }),
  sp({
    id: 'spell-speak-with-dead', level: 3, school: 'Nigromancia', time: '1 Acción', range: '10 pies', comp: 'V, S, M (incienso y velas)',
    duration: '10 minutos',
    classes: ['Clérigo', 'Brujo'],
    content: `**Hablar con los muertos (Speak with Dead)**\n\nOtorgas el simulacro de vida a un cadáver dentro del alcance (que tenga boca) para responder **hasta 5 preguntas** durante 10 minutos.\n\nEl cadáver responde lo que sabía en vida: está limitado por su conocimiento, no por su ánimo; puede ser engañoso si tenía incentivos. Si el cadáver fue víctima de la necromancia, la respuesta se envenena.`,
  }),
  sp({
    id: 'spell-speak-with-plants', level: 3, school: 'Transmutación', time: '1 Acción', range: 'Personal', comp: 'V, S',
    duration: '10 minutos',
    classes: ['Bardo', 'Druida', 'Guardabosques'],
    content: `**Hablar con las plantas (Speak with Plants)**\n\nComo un **hablar con los animales** para **plantas**: comunicas con plantas y vegetación; puedes pedir que revelen lo que **han presenciado** en el último día (como movimiento o brisa) y que se muevan para crear rutas que para criaturas Pequeñas y Mediana son terreno difícil.\n\nLas plantas pueden **crear barreras o rutas** a tu petición, aunque no pueden moverse de sitio.`,
  }),
  sp({
    id: 'spell-stinking-cloud', level: 3, school: 'Conjuración', time: '1 Acción', range: '90 pies', comp: 'V, S, M (un huevo podrido y hojas de col)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Nube apestosa (Stinking Cloud)**\n\nUna nube amarilla y fétida de **20 pies de radio** cubre el área durante la duración, dando **dificultad de visión**.\n\nLas criaturas en la nube deben superar una salvación de **CON** o quedan **asfixiadas** (es decir, no pueden reaccionar o hacer cosas mientras la nube permanezca en su espacio). Pueden repetir la salvación al final de cada turno.`,
  }),
  sp({
    id: 'spell-tiny-hut', level: 3, school: 'Evocación', time: '1 minuto', range: 'Personal (10 pies de radio)', comp: 'V, S, M (una pequeña perla de cristal)',
    duration: '8 horas',
    classes: ['Bardo', 'Mago'],
    content: `**Cabaña (Leomund's Tiny Hut)**\n\nUn **domo de fuerza inerte** de 10 pies de radio e inamovible se crea a tu alrededor (dentro de ti, en el suelo) y te contiene a ti y a un equipo de hasta **9 criaturas Mediano o menores**.\n\nEl domo es opaco a la luz pero permite ver fuera; el clima exterior no entra, y la atmósfera es cálida y seca. Los conjuros no pueden pasar a su través y las criaturas que no estén dentro no pueden tocarlo o dañarlo.`,
  }),
  sp({
    id: 'spell-tongues', level: 3, school: 'Adivinación', time: '1 Acción', range: 'Toque', comp: 'V, M (un pequeño modelo de zigurat de arcilla)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Bardo', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Lenguas (Tongues)**\n\nTocas a una criatura y comprende **cualquier idioma hablado** y puede ser comprendida por quien hable cualquier idioma durante la duración, incluyendo el **lenguaje de signos** y los susurros mágicos.`,
  }),
  sp({
    id: 'spell-vampiric-touch', level: 3, school: 'Nigromancia', time: '1 Acción', range: 'Personal', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Brujo', 'Mago'], damage: '3d6',
    content: `**Toque vampírico (Vampiric Touch)**\n\nEl toque de tu sombra **chupa la vida**: haz un **ataque de conjuro cuerpo a cuerpo** contra una criatura a 5 pies. Si impacta, recibe **3d6 de daño necrótico** y **recuperas PG iguales a la mitad del daño** (máximo a tus PG máximos).\n\nPuedes repetir el ataque en turnos siguientes mientras dure la concentración.\n\nA niveles superiores: +1d6 por nivel de espacio superior al 3.`,
  }),
  sp({
    id: 'spell-water-breathing', level: 3, school: 'Transmutación', time: '1 Acción', range: '30 pies', comp: 'V, S, M (un junco corto o una paja)',
    duration: 'Concentración, hasta 24 horas', conc: true,
    classes: ['Druida', 'Guardabosques', 'Hechicero', 'Mago'],
    content: `**Respirar bajo el agua (Water Breathing)**\n\nHasta **10 criaturas** voluntarias de tu elección dentro del alcance obtienen la capacidad de **respirar bajo el agua** durante 24 horas.\n\nSi una criatura deja el agua, puede seguir respirando aire normalmente.`,
  }),
  sp({
    id: 'spell-water-walk', level: 3, school: 'Transmutación', time: '1 Acción', range: '30 pies', comp: 'V, S, M (un trozo de corcho)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Clérigo', 'Druida', 'Guardabosques'],
    content: `**Caminar sobre el agua (Water Walk)**\n\nConcedes la capacidad de **caminar sobre cualquier superficie líquida** (agua, ácido, barro, nieve, arena movediza o lava) a hasta **10 criaturas** voluntarias de tu elección dentro del alcance durante la duración.\n\nLas criaturas tratan la superficie como terreno normal; si caen dentro, emergen a la superficie a la velocidad de 60 pies por asalto.`,
  }),
  sp({
    id: 'spell-wind-wall', level: 3, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S, M (una pluma)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Druida', 'Guardabosques'],
    content: `**Muro de viento (Wind Wall)**\n\nUn **muro de viento fuerte de 50 pies de largo, 15 pies de alto y 1 pie de grosor** se eleva en un lugar del alcance (puedes curvarlo para rodear a las criaturas) y es invisible.\n\nEl viento impide el paso de **flechas y proyectiles** (los desvía), ralentiza a las criaturas voladoras, **apaga llamas menores de 10 pies** y dispersa niebla y gas. Las criaturas que atraviesen el muro reciben **3d4 de daño contundente** (salvación de FUE para la mitad) y son empujadas 10 pies.`,
  }),

  // ---------------- Nivel 4 ----------------
  sp({
    id: 'spell-banishment', level: 4, school: 'Abjuración', time: '1 Acción', range: '60 pies', comp: 'V, S, M',
    duration: '1 minuto', conc: true, classes: ['Clérigo', 'Paladín', 'Hechicero', 'Mago', 'Brujo'],
    content: `**Destierro (Banishment)**\n\nUna criatura (salvación de **CAR**) es **desterrada** a otro plano (nativo) o a un demi-plano inofensivo. Al terminar la concentración, vuelve.\n\nA niveles superiores: +1 objetivo por nivel.`,
  }),
  sp({
    id: 'spell-dimension-door', level: 4, school: 'Conjuración', time: '1 Acción', range: '500 pies', comp: 'V',
    duration: 'Instantáneo', classes: ['Bardo', 'Hechicero', 'Mago', 'Brujo'],
    content: `**Portal dimensional (Dimension Door)**\n\nTe teletransportas a un punto visible a 500 pies, junto a un objeto/ criatura Mediana o menor que lleves. Puedes llevar una criatura voluntaria.`,
  }),
  sp({
    id: 'spell-greater-invisibility', level: 4, school: 'Ilusión', time: '1 Acción', range: 'Contacto', comp: 'V, S',
    duration: '1 minuto', conc: true, classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Invisibilidad superior (Greater Invisibility)**\n\nUna criatura tocada es **Invisible** durante 1 minuto.\n\nLos ataques contra ella tienen desventaja y sus ataques, ventaja.`,
  }),
  sp({
    id: 'spell-polymorph', level: 4, school: 'Transmutación', time: '1 Acción', range: '60 pies', comp: 'V, S, M',
    duration: '1 hora', conc: true, classes: ['Bardo', 'Druida', 'Hechicero', 'Mago'],
    content: `**Polimorfia (Polymorph)**\n\nUna criatura (salvación de **SAB**) se transforma en una **bestia** CR igual o menor a su nivel, con las estadísticas de la nueva forma (sus PG, su INT/SAB/CAR se mantienen). Al llegar a 0 PG, vuelve a su forma original con el daño restante.\n\nA niveles superiores: afecta a +1 criatura por nivel.`,
  }),
  sp({
    id: 'spell-death-ward', level: 4, school: 'Abjuración', time: '1 Acción', range: 'Contacto', comp: 'V, S',
    duration: '8 horas', classes: ['Clérigo', 'Paladín'],
    content: `**Velo de muerte (Death Ward)**\n\nLa criatura tocada sobrevive al umbral de la muerte: si llega a 0 PG, se queda en **1 PG**; y una vez es inmune a los efectos que la matarían. Termina al gastarse.`,
  }),

  sp({
    id: 'spell-arcane-eye', level: 4, school: 'Adivinación', time: '1 Acción', range: '30 pies', comp: 'V, S, M (un poco de pelo de murciélago)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Ojo arcano (Arcane Eye)**\n\nConjuras un **ojo arcano invisible** del tamaño de una canica en un punto al alcance que te envía información visual en cualquier dirección mientras dure (hasta 1 hora).\n\nEl ojo tiene percepción normal, puede pasar por aberturas de 1 pulgada y puede moverse **30 pies por asalto** (o 60 en línea recta).\n\nPuedes cambiar tu **percepción** (oscura 60) y usar cualquier aptitud de percepción como si estuvieras en el sitio.`,
  }),
  sp({
    id: 'spell-aura-of-life', level: 4, school: 'Abjuración', time: '1 Acción', range: 'Personal (30 pies)', comp: 'V',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Paladín'],
    content: `**Aura de vida (Aura of Life)**\n\nUna **aura de energía vital de 30 pies de radio** te rodea mientras dure la concentración (hasta 10 minutos). Los aliados en el aura ganan **resistencia al daño necrótico** y su **máximo de PG no puede reducirse**.\n\nCuando un aliado vivo con 0 PG inicia su turno en el aura, recupera **1 PG**.`,
  }),
  sp({
    id: 'spell-black-tentacles', level: 4, school: 'Conjuración', time: '1 Acción', range: '90 pies', comp: 'V, S, M (un trozo de tentáculo de pulpo)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Mago'],
    content: `**Tenecillas negras (Evard's Black Tentacles)**\n\nEn un **cuadrado de 20 pies** dentro del alcance brota un enredo retorcido de **tentáculos negros** que convierte el área en **terreno difícil**.\n\nAl aparecer y al final de tu turno, las criaturas en el área deben superar una salvación de **DES** o reciben **3d6 de daño contundente** y quedan **agarradas**. Cada agarrada puede intentar soltarse con una Acción (Atletismo o Acrobacias vs. tu CD).`,
  }),
  sp({
    id: 'spell-blight', level: 4, school: 'Nigromancia', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Druida', 'Hechicero', 'Brujo', 'Mago'], damage: '8d8',
    content: `**Plaga (Blight)**\n\nLa energía necrótica drena la vitalidad de una criatura que puedas ver dentro del alcance: recibe **8d8 de daño necrótico** (salvación de **CON** para la mitad).\n\nSi el objetivo es un **vegetal** o **planta**, tiene desventaja en la salvación y el daño máximo es el doble. Si es un no-muerto, tiene ventaja.\n\nA niveles superiores: +1d8 por nivel de espacio superior al 4.`,
  }),
  sp({
    id: 'spell-charm-monster', level: 4, school: 'Encantamiento', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: '1 hora',
    classes: ['Bardo', 'Hechicero', 'Brujo', 'Mago'],
    content: `**Encantar monstruo (Charm Monster)**\n\nIntentas encantar a una criatura que puedas ver dentro del alcance: debe superar una salvación de **SAB** o queda **encantada** por ti durante 1 hora.\n\nLa criatura te considera un amigo, obedece tus órdenes (evitando el peligro manifiesto), y si le haces daño o la obligas a hacer algo peligroso, la salvación termina.\n\nA niveles superiores: puedes apuntar a +1 criatura extra por cada nivel de espacio superior, todas a 30 pies entre sí.`,
  }),
  sp({
    id: 'spell-compulsion', level: 4, school: 'Encantamiento', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo'],
    content: `**Compulsión (Compulsion)**\n\nUna influencia mágica incita a las criaturas de tu elección que puedas ver dentro del alcance (hasta las que quieras) a moverse en una **dirección que elijas** mientras dure la concentración (hasta 1 minuto).\n\nAl inicio de tu turno, cada una debe superar una salvación de **SAB** o usar su **reacción** para moverse hasta su velocidad en esa dirección, evitando peligros evidentes como fuego o fosos abiertos.`,
  }),
  sp({
    id: 'spell-confusion', level: 4, school: 'Encantamiento', time: '1 Acción', range: '90 pies', comp: 'V, S, M (tres conchas de nuez)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Druida', 'Hechicero', 'Mago'],
    content: `**Confusión (Confusion)**\n\nUn torbellino de energía asalta las mentes de las criaturas en una **esfera de 10 pies de radio** dentro del alcance; cada una debe superar una salvación de **SAB** o queda **confundida** mientras dure la concentración (hasta 1 minuto).\n\nAl inicio de cada uno de sus turnos, la criatura confundida tira **1d10** para decidir sus acciones: 1-4 se mueve aleatoriamente, 5-7 no hace nada, 8-10 ataca a la criatura más cercana (o a un objeto). Puede repetir la salvación al final de cada turno.`,
  }),
  sp({
    id: 'spell-conjure-minor-elementals', level: 4, school: 'Conjuración', time: '1 minuto', range: '90 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Druida', 'Mago'],
    content: `**Conjurar elementales menores (Conjure Minor Elementals)**\n\nConjuras **elementales** de tu elección (aire, tierra, fuego o agua, o un combinado) que aparecen en puntos desocupados o sin obstrucciones dentro del alcance y quedan bajo tu control: elige 4 elementales **CR 1/2**, 2 elementales **CR 1/4** o 1 elemental **CR 1/2** más, aunque la suma no supere **2d8 de dado de golpe** en total.\n\nLos elementales atacan a tu orden (objetivo a 60 pies) y desaparecen al terminar la concentración.\n\nA niveles superiores: más elementales según el nivel (+1 por dos niveles, y la CR máxima aumenta).`,
  }),
  sp({
    id: 'spell-conjure-woodland-beings', level: 4, school: 'Conjuración', time: '1 Acción', range: '60 pies', comp: 'V, S, M (una baya de acebo)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Druida', 'Guardabosques'],
    content: `**Conjurar seres del bosque (Conjure Woodland Beings)**\n\nConjuras **criaturas feéricas** en un punto desocupado dentro del alcance que quedan bajo tu control (excepto las que no son amistosas): elige 4 de **CR 1/2** (como un enjambre de avispas), 2 de **CR 1/2** o **CR 1/4**, o **CR 1** (como un siervo de la agreste).\n\nLas criaturas atacan a tu orden y desaparecen al terminar.\n\nA niveles superiores: el número se duplica en niveles 6 y 9 del espacio.`,
  }),
  sp({
    id: 'spell-control-water', level: 4, school: 'Transmutación', time: '1 Acción', range: '300 pies', comp: 'V, S, M (una gota de agua o arena)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Clérigo', 'Druida', 'Mago'],
    content: `**Controlar el agua (Control Water)**\n\nControlas el **agua** en un **cubo de 100 pies** dentro del alcance mientras mantengas la concentración (hasta 10 minutos). Elige uno de estos efectos al lanzarlo:\n\n**Inundar** (sube 1d8 pies el agua sobre la costa), **Partir corrientes** (en un canal de hasta 100 pies, el agua se levanta a ambos lados formando un muro), **Desviar el flujo** (cambia la dirección del movimiento), **Remolino** (crea un torbellino de 50 pies de radio y 50 pies de alto).`,
  }),
  sp({
    id: 'spell-divination', level: 4, school: 'Adivinación', time: '1 Acción', range: '30 pies', comp: 'V, S, M (incienso)',
    duration: 'Instantáneo',
    classes: ['Clérigo', 'Druida'],
    content: `**Adivinación (Divination)**\n\nRealizas una **adivinación** consultando a una entidad superior (un dios, un espíritu): recibes un **augurio** sobre una acción, evento o objetivo que tenga lugar en un máximo de **7 días**, expresado con un acertijo descifrable.\n\nEl augurio no revela detalles ni consecuencias imprevistas y pueden ser engañoso si las circunstancias cambian (una segunda consulta sobre el mismo resultado tiene un 25% de exactitud).`,
  }),
  sp({
    id: 'spell-dominate-beast', level: 4, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Druida', 'Hechicero'], damage: '8d8',
    content: `**Dominar bestia (Dominate Beast)**\n\nIntentas dominar a una **bestia** que puedas ver dentro del alcance: debe superar una salvación de **SAB** o queda **encantada** durante la concentración (hasta 1 minuto) y obedece tus órdenes.\n\nPuede repetir la salvación cuando reciba daño (con ventaja si es un extraño para ti). Con la concentración puedes usar tu acción para **controlar completamente** a la bestia.\n\nA niveles superiores: +8 horas de duración en nivel 6, +1 día en nivel 8, +7 días en nivel 9.`,
  }),
  sp({
    id: 'spell-fabricate', level: 4, school: 'Transmutación', time: '10 minutos', range: '120 pies', comp: 'V, S',
    duration: 'Instantáneo',
    classes: ['Mago'],
    content: `**Crear (Fabricate)**\n\nConviertes materias primas dentro del alcance en **productos acabados** de su mismo material: por ejemplo, madera a un puente, hierro a una espada o a un atalaya.\n\nEl producto debe ser de un material que controles y no puede ser mágico; las tareas de fabricación de precisión (joyería) requieren la **competencia** correspondiente, y el producto no puede exceder **200 pies cúbicos** de materia prima.`,
  }),
  sp({
    id: 'spell-faithful-hound', level: 4, school: 'Conjuración', time: '1 Acción', range: '30 pies', comp: 'V, S, M (un trozo de diente canino)',
    duration: 'Concentración, hasta 8 horas', conc: true,
    classes: ['Mago'],
    content: `**Sabueso fiel (Mordenkainen's Faithful Hound)**\n\nUn **perro de guarda fantasma** invisible aparece en un punto del alcance y **ladra a 1.600 pies** si una criatura se acerca a 30 pies, a menos que digas la contraseña.\n\nEl perro tiene **CA 15**, no puede moverse, ignora los ataques y aúlla si una criatura se acerca a 30 pies; **muerde** a una criatura a 5 pies en tu turno automáticamente (**4d8 de daño perforante**).`,
  }),
  sp({
    id: 'spell-fire-shield', level: 4, school: 'Evocación', time: '1 Acción', range: 'Personal', comp: 'V, S, M (una brasa y fuego)',
    duration: '10 minutos',
    classes: ['Druida', 'Hechicero', 'Mago'],
    content: `**Escudo de fuego (Fire Shield)**\n\nUna llama se envuelve a tu cuerpo mientras dure (10 minutos), emitiendo **luz brillante** en un radio de 20 pies y **luz tenue** otros 20 pies.\n\nCuando **recibes daño** de una criatura dentro de 5 pies, recibe **2d8 de daño de fuego** (si el escudo es frío) o **2d8 de frío** (si el escudo es de llamas).\n\nEliges el modo al lanzarlo: **escudo frío** (resistencia al daño de fuego, enemigos reciben frío) o **escudo de llamas** (resistencia al frío, enemigos reciben fuego).`,
  }),
  sp({
    id: 'spell-freedom-of-movement', level: 4, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S, M (una correa de cuero)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Bardo', 'Clérigo', 'Druida', 'Guardabosques'],
    content: `**Libertad de movimiento (Freedom of Movement)**\n\nEl movimiento de la criatura tocada queda **libre** de restricciones durante la duración (1 hora): puede moverse sin costo en terreno difícil, los conjuros y efectos mágicos no pueden reducir su velocidad, no puede ser **paralizada o agarrada**, y puede escapar automáticamente de cualquier agarre(s).`,
  }),
  sp({
    id: 'spell-giant-insect', level: 4, school: 'Transmutación', time: '1 Acción', range: '30 pies', comp: 'V, S, M (un poco de descendencia)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Druida'],
    content: `**Insecto gigante (Giant Insect)**\n\nTransformas hasta **10 milpiés en una Cienpiés gigante**, jarra en escorpión gigante, saltamontes en saltamontes gigante, o una araña en araña gigante, de las que encuentres a 30 pies. Las criaturas resultantes son **fieles a ti** y actúan en tu turno.\n\nSi controlas menos de 8, se quedan donde están y no actúan.\n\nA niveles superiores: el número se duplica en nivel 6 del espacio.`,
  }),
  sp({
    id: 'spell-guardian-of-faith', level: 4, school: 'Conjuración', time: '1 Acción', range: '30 pies', comp: 'V',
    duration: 'Concentración, hasta 8 horas', conc: true,
    classes: ['Clérigo', 'Paladín'],
    content: `**Guardiana de la fe (Guardian of Faith)**\n\nUna **figura etérea Grande** (una guardiana halo) aparece en un punto desocupado dentro del alcance y dura hasta 8 horas, o hasta que la **concentración** termine.\n\nCuando una criatura hostil entra en un **radio de 10 pies** de la guardiana, esta le inflige **20 de daño radiante** (salvación de DES para la mitad) y desapapanel; la guardiana pierde una carga de 20 y se debilita cuando recibe más de 20 por turno.`,
  }),
  sp({
    id: 'spell-hallucinatory-terrain', level: 4, school: 'Ilusión', time: '10 minutos', range: '300 pies', comp: 'V, S, M (una pequeña piedra o ramita)',
    duration: 'Concentración, hasta 24 horas', conc: true,
    classes: ['Bardo', 'Brujo', 'Mago'],
    content: `**Terreno alucinatorio (Hallucinatory Terrain)**\n\nHaces que el **terreno natural** en un **cubo de 150 pies** dentro del alcance parezca y suene como otro tipo de terreno natural: por ejemplo, una llanura en un bosque, un pantano en un campo, o una colina en una meseta.\n\nPuedes crear estructuras ilusorias y pequeñas edificaciones en la ilusión. Las criaturas inspeccionan con **prueba de Investigación** (CD 8 + aptitud) y si la superan, distinguen la ilusión.`,
  }),
  sp({
    id: 'spell-ice-storm', level: 4, school: 'Evocación', time: '1 Acción', range: '300 pies', comp: 'V, S, M (una gota de agua y un guijarro)',
    duration: 'Instantáneo',
    classes: ['Druida', 'Hechicero', 'Mago'], damage: '2d8+4d6',
    content: `**Tormenta de hielo (Ice Storm)**\n\nUn alud de rocas heladas cae en un **cilindro de 20 pies de radio y 40 pies de alto** dentro del alcance: las criaturas en el área reciben **2d8 de daño de contundente y 4d6 de daño de frío** (salvación de **DES** para la mitad).\n\nEl área queda cubierta de escombros y hielo, siendo **terreno difícil** hasta tu próximo turno.\n\nA niveles superiores: +1d8 de contundente y +1d6 de frío por nivel de espacio.`,
  }),
  sp({
    id: 'spell-locate-creature', level: 4, school: 'Adivinación', time: '1 Acción', range: 'Personal', comp: 'V, S, M (un pelo de la criatura)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Bardo', 'Clérigo', 'Druida', 'Paladín', 'Guardabosques', 'Mago'],
    content: `**Localizar criatura (Locate Creature)**\n\nDescribe o nombra una **criatura conocida** (por nombre o descripción) y descubres la **dirección y distancia** hasta ella si se encuentra en **1,000 pies**.\n\nMientras mantienes el conjuro, puedes desplazarte siguiendo su rastro; si la criatura **se oculta en un lugar sellado mágicamente** u otra barrera temporal, los efectos no la detectan (los rayos de señales no pasan por plomo).`,
  }),
  sp({
    id: 'spell-phantasmal-killer', level: 4, school: 'Ilusión', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Mago'],
    content: `**Asesino fantasmal (Phantasmal Killer)**\n\nUna imagen horripilante (la cosa que más teme la criatura) surge de no donde, y solo ella la ve: debe superar una salvación de **SAB** o queda **asustada** durante 1 minuto.\n\nAl inicio de cada uno de sus turnos mientras dure y el miedo persista, recibe **4d10 de daño psíquico** (salvación de SAB para media, terminando el conjuro si la supera).\n\nA niveles superiores: +1d10 por nivel de espacio por encima del 4.`,
  }),
  sp({
    id: 'spell-private-sanctum', level: 4, school: 'Abjuración', time: '10 minutos', range: '120 pies', comp: 'V, S, M (polvo de plata, diamantes y hojas)',
    duration: 'Concentración, hasta 24 horas', conc: true,
    classes: ['Mago'],
    content: `**Santuario particular (Mordenkainen's Private Sanctum)**\n\nUna **protección de 30 pies de radio** alrededor de un punto del alcance impide durante 24 horas que el sonido viaje a través de ella, y la hace **oscura e invisible** desde el exterior.\n\nAdemás, impide **escudriñar** con conjuros de adivinación, impide **teletransporte** hacia el interior, y los **espíritus y elementales** no pueden entrar.`,
  }),
  sp({
    id: 'spell-resilient-sphere', level: 4, school: 'Evocación', time: '1 Acción', range: '30 pies', comp: 'V, S, M (una pieza de cristal esférico)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Mago'],
    content: `**Esfera resistente (Otiluke's Resilient Sphere)**\n\nUna **esfera de fuerza translúcida de 10 pies de diámetro** envuelve a una criatura de tamaño Grande o menor que puedas ver dentro del alcance, separándola del exterior.\n\nLa esfera es impenetrable a daño y efectos, y la criatura dentro puede girarla; puede hacer una salvación de **DES** para escapar si es de tamaño Grande o menor, y cuando la esfera agota sus PG (20, respondiendo al daño) explota.`,
  }),
  sp({
    id: 'spell-secret-chest', level: 4, school: 'Conjuración', time: '1 Acción', range: 'Toque', comp: 'V, S, M (una caja de plata de 5,000 po)',
    duration: 'Instantáneo',
    classes: ['Mago'],
    content: `**Cofre secreto (Leomund's Secret Chest)**\n\nEsconde un **cofre pequeño** (3x2x2 pies) en el **Plano Etéreo** para recuperarlo después: debes sostener un **replico en miniatura** de 1 pie (encastado en plata) para convocarlo.\n\nEl cofre y su contenido quedan en el Etéreo; puedes convocarlo con un objeto miniatura como si estuviera en el Plano Material. El cofre no se puede recuperar desde el Etéreo si otro lo contiene.`,
  }),
  sp({
    id: 'spell-stone-shape', level: 4, school: 'Transmutación', time: '1 Acción', range: 'Toque', comp: 'V, S, M (suave arcilla para esculpir)',
    duration: 'Instantáneo',
    classes: ['Clérigo', 'Druida', 'Mago'],
    content: `**Formar piedra (Stone Shape)**\n\nTocas un objeto de **piedra de tamaño Mediano o menor** (o una sección de una estructura de piedra de al menos 5 pies cúbicos) y lo **moldas** en cualquier forma que elijas: una puerta, una vía, una alcantarilla…\n\nPuedes crear una **trampilla o puerta** de hasta 5 pies de diámetro, o hacer un pasaje de hasta 20 pies; no puedes crear objetos de precisión (como engranajes).`,
  }),
  sp({
    id: 'spell-stoneskin', level: 4, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S, M (polvo de diamante de 100 po)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Druida', 'Hechicero', 'Mago'],
    content: `**Piel pétrea (Stoneskin)**\n\nLa piel de una criatura voluntaria que toques se vuelve **dura como la piedra** mientras dure la concentración: obtiene **resistencia al daño contundente, perforante y cortante** no mágico.\n\nEl conjuro termina cuando usas tu **Acción** para disiparlo.`,
  }),
  sp({
    id: 'spell-vitriolic-sphere', level: 4, school: 'Evocación', time: '1 Acción', range: '150 pies', comp: 'V, S, M (una gota de ácido)',
    duration: 'Instantáneo',
    classes: ['Hechicero', 'Mago'], damage: '10d4',
    content: `**Esfera vitriólica (Vitriolic Sphere)**\n\nLanzas una **esfera de 20 pies de radio** de ácido morado dentro del alcance; las criaturas en el área reciben **10d4 de daño de ácido** (salvación de **DES** para la mitad) y **5d4 más** al final de su próximo turno si fallaron la salvación inicial.\n\nA niveles superiores: +2d4 de daño por nivel de espacio superior al 4.`,
  }),
  sp({
    id: 'spell-wall-of-fire', level: 4, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S, M',
    duration: '1 minuto', conc: true, classes: ['Druida', 'Hechicero', 'Brujo', 'Mago'], damage: '5d8',
    content: `**Muro de fuego (Wall of Fire)**\n\nMuro de fuego (60x20x1 pies). Las criaturas que entren o terminen adentro (salvación de **DES**): **5d8** de fuego; el lado caliente inflige **5d8** más. Cruzar la línea por primera vez por turno inflige además 4d6.\n\nA niveles superiores: +1d8 por nivel de daño base.`,
  }),

  // ---------------- Nivel 5 ----------------
  sp({
    id: 'spell-bigby-hand', level: 5, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S, M',
    duration: '1 minuto', conc: true, classes: ['Hechicero', 'Mago'], damage: '4d8+4',
    content: `**Mano de Bigby (Bigby's Hand)**\n\nUna gran mano espectral te obedece como bonus action:\n- **Puñetazo:** 4d8+4 de daño por golpe (ataque de conjuro).\n- **Empujón/ Agarrar/ Escudar:** mueve, agarra (Atletismo vs. Atletismo/Acrobacias) o protege con cobertura.+2 a CA.\n\nA niveles superiores: +2d8 de daño por nivel.`,
  }),
  sp({
    id: 'spell-cone-of-cold', level: 5, school: 'Evocación', time: '1 Acción', range: 'Personal (60 pies de cono)', comp: 'V, S, M',
    duration: 'Instantáneo', classes: ['Druida', 'Hechicero', 'Mago'], damage: '8d8',
    content: `**Cono de frío (Cone of Cold)**\n\nExplosión de frío en un cono de 60 pies. Las criaturas (salvación de **CON**) reciben **8d8** de daño de **frío**; fallo, la mitad.\n\nA niveles superiores: +1d8 por nivel.`,
  }),
  sp({
    id: 'spell-hold-monster', level: 5, school: 'Encantamiento', time: '1 Acción', range: '90 pies', comp: 'V, S, M',
    duration: '1 minuto', conc: true, classes: ['Bardo', 'Hechicero', 'Mago', 'Brujo'],
    content: `**Inmovilizar monstruo (Hold Monster)**\n\nUna criatura (salvación de **SAB**) queda **Paralizada** durante la duración; repite al final de cada turno.\n\nA niveles superiores: +1 objetivo por nivel.`,
  }),
  sp({
    id: 'spell-mass-cure-wounds', level: 5, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Bardo', 'Clérigo', 'Druida'], damage: '5d8',
    content: `**Curar heridas en masa (Mass Cure Wounds)**\n\nHasta 6 criaturas elegidas recuperan **5d8 + mod. de conjuro** PG.\n\nA niveles superiores: +1d8 por nivel.`,
  }),
  sp({
    id: 'spell-scrying', level: 5, school: 'Adivinación', time: '10 minutos', range: 'Personal', comp: 'V, S, M',
    duration: '10 minutos', conc: true, classes: ['Bardo', 'Clérigo', 'Druida', 'Brujo', 'Hechicero', 'Mago'],
    content: `**Escudriñar (Scrying)**\n\nPuedes ver y oír a una criatura con la que estás familiarizado(requiere un vínculo). Salvación de **SAB**: si falla, la observas 10 minutos a través de su entorno. Si pasa, detecta que la estás espiando.`,
  }),
  sp({
    id: 'spell-wall-of-force', level: 5, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S, M',
    duration: '10 minutos', conc: true, classes: ['Hechicero', 'Mago'],
    content: `**Muro de fuerza (Wall of Force)**\n\nCreas un muro **invisible** e inquebrantable (30x10x0,1 pies) hecho de fuerza. Nada físico lo atraviesa; *Teletransporte* sí funciona al otro lado.`,
  }),

  sp({
    id: 'spell-animate-objects', level: 5, school: 'Transmutación', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Animar objetos (Animate Objects)**\n\nAnimas hasta **10 objetos no mágicos** dentro del alcance (hasta 10 objetos Pequeños, o combinas tamaños: 5 Medianos, 2 Grandes o 1 Enorme, con biografías equivalentes) y controlas sus movimientos durante la concentración.\n\nCada objeto tiene **sus propias estadísticas** (PG, CA, ataque) y ataca a tu orden, o **rodea a una criatura** (dentro de 5 pies del objeto) como una masa; el daño de cada objeto animado depende de su tamaño: Pequeño 1d4, Mediano 1d6, Grande 1d10, Enorme 2d8 (o por bludgeoning).`,
  }),
  sp({
    id: 'spell-antilife-shell', level: 5, school: 'Abjuración', time: '1 Acción', range: 'Personal (10 pies)', comp: 'V, S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Druida'],
    content: `**Casco antivida (Antilife Shell)**\n\nUna **barrera mágica de 10 pies de radio** se materializa a tu alrededor y **protege mientras la concentración** dure (hasta 1 hora).\n\nLa barrera impide que **criaturas vivas** (no no-muertos ni constructos) la crucen; las que lo intentan son repelidas, y si lo hacen, reciben 1d10 de daño radiantе y vuelven atrás.`,
  }),
  sp({
    id: 'spell-awaken', level: 5, school: 'Transmutación', time: '8 horas', range: 'Toque', comp: 'V, S, M (un agárico de 1,000 po)',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Druida'],
    content: `**Despertar (Awaken)**\n\nTras 8 horas de ritual, **despiertas la conciencia** de una bestia u otra criatura (una **planta** de tamaño Enorme o menor) que toques: obtiene inteligencia **10** (o su INT original, si es mayor), la capacidad de **hablar un idioma**, el estado **encantado** por ti durante 30 días, y la obediencia a una palabra de comando.\n\nAl terminar, la criatura elige su actitud y puede conservar o romper el encantamiento.`,
  }),
  sp({
    id: 'spell-cloudkill', level: 5, school: 'Conjuración', time: '1 Acción', range: '120 pies', comp: 'V, S',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Hechicero', 'Mago'], damage: '5d8',
    content: `**Nube mortífera (Cloudkill)**\n\nCreas una **nube venenosa de 20 pies de radio** de vapores tóxicos de color verde en un punto del alcance, que se mueve **10 pies por asalto** alejándose de ti mientras dura (o hacia otro lugar) y que desciende por las aberturas.\n\nLas criaturas en la nube mientras la cruzan o terminan en ella reciben **5d8 de daño de veneno** (salvación de **CON** para la mitad) y la nube persiste más si permaneces dentro.\n\nA niveles superiores: +1d8 por nivel de espacio superior al 5.`,
  }),
  sp({
    id: 'spell-commune', level: 5, school: 'Adivinación', time: '1 minuto', range: 'Personal', comp: 'V, S, M (incienso y agua bendita)',
    duration: '1 minuto',
    classes: ['Clérigo', 'Paladín'],
    content: `**Comunión (Commune)**\n\nTe pones en contacto con tu **divinidad o un representante divino** y haces hasta **3 preguntas** que pueden responderse sí o no: la entidad responde **sí, no, tal vez, desconocido, irrelevante, etc.**\n\nLa entidad responde de forma breve y clara, sin importar si la pregunta tiene trampa. Una criatura puede beneficiarse de este conjuro una vez por semana (o una vez por descanso largo, a criterio del DM).`,
  }),
  sp({
    id: 'spell-commune-with-nature', level: 5, school: 'Adivinación', time: '1 minuto', range: 'Personal', comp: 'V, S',
    duration: '1 minuto',
    classes: ['Druida', 'Guardabosques'],
    content: `**Comunión con la naturaleza (Commune with Nature)**\n\nTe conviertes momentáneamente en **parte de la naturaleza** y obtienes conocimiento sobre el territorio circundante durante 1 minuto: en una región de **3 millas** (o **10 millas** en terreno poco frecuentado) obtienes 3 datos de tu elección sobre **terreno, plantas, minerales, cuerpos de agua, criaturas abundantes, civilización, clima** o... Una de las cosas que determines con este conjuro puede ser por área de 1 milla alrededor de tu ubicación.\n\nEl conjuro no revela criaturas escondidas ni ocultas.`,
  }),
  sp({
    id: 'spell-conjure-elemental', level: 5, school: 'Conjuración', time: '1 minuto', range: '90 pies', comp: 'V, S, M (un objeto del elemento: carbón, madriguera de aire, tierra, agua)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Druida', 'Mago'],
    content: `**Conjurar elemental (Conjure Elemental)**\n\nConjuras un **elemental** (aire, tierra, fuego, agua) de CR 5 en un punto desocupado del espacio sin obstrucciones: tienes **concentración** para mantenerlo (hasta 1 hora) y le obedeces, aunque si pierdes la concentración y está a 60 pies, puede volverse **hostil**.\n\nPuedes volver a **iniciar la concentración** como Acción.\n\nA niveles superiores: CR aumentado por nivel de espacio superior al 5 (+1 por dos niveles).`,
  }),
  sp({
    id: 'spell-contact-other-plane', level: 5, school: 'Adivinación', time: '1 minuto', range: 'Personal', comp: 'V',
    duration: '1 minuto',
    classes: ['Brujo', 'Mago'],
    content: `**Contactar con otro plano (Contact Other Plane)**\n\nEntras en contacto con una **entidad de otro plano** (un dios, un superior) y le haces hasta **3 preguntas** que responda sí o no durante la concentración (1 minuto).\n\nAl terminar, debes superar una salvación de **INT** o sufres: tu **INT y tu CAR se reducen a 3** durante 1 hora y no puedes lanzar conjuros ni comunicarte, y no puedes repetir el contacto hasta que se restaure (un restablecimiento mayor o el tiempo).`,
  }),
  sp({
    id: 'spell-contagion', level: 5, school: 'Nigromancia', time: '1 Acción', range: 'Toque', comp: 'V, S',
    duration: 'Concentración, hasta 7 días', conc: true,
    classes: ['Clérigo', 'Druida'], damage: '5d8',
    content: `**Contagio (Contagion)**\n\nInfundes a una criatura que toques con una **enfermedad mágica** de tu elección (de una lista: asfixia, ceguera, confusión, dolor, fiebre tonta, temblor) que se desarrolla mientras dura la concentración (hasta 7 días). Requiere **3 salvaciones de CON fallidas**; al fallar cada una, la enfermedad se manifiesta con sus efectos (desventaja en un tipo de tiradas, etc.).\n\nAl terminar la enfermedad, los efectos acaban.`,
  }),
  sp({
    id: 'spell-creation', level: 5, school: 'Ilusión', time: '1 minuto', range: '30 pies', comp: 'V, S, M (una pequeña parte de algo mayor)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Creación (Creation)**\n\nCreas un **objeto no mágico no vivo** dentro del alcance a partir de un material que consideres: el tamaño depende del material creado: **tejido 2.5 pies cúbicos**, cuero 3, papel 4, madera 5, piedra 10, metal 20, gemas 30, etc. (hasta 300 pies cúbicos en objeto inanimado).\n\nEl objeto real dura el tiempo que determine la **duración de un objeto de ese material** según la tabla (por ejemplo, madera 1 hora, hierro 1 día, oro 10 días ...).`,
  }),
  sp({
    id: 'spell-dispel-evil-and-good', level: 5, school: 'Abjuración', time: '1 Acción', range: 'Personal', comp: 'V, S, M (agua bendita y plata bendecida)',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Clérigo', 'Paladín'],
    content: `**Disipar el bien y el mal (Dispel Evil and Good)**\n\nUna energía resplandeciente te rodea mientras dure la concentración (hasta 1 minuto) y te protege contra **aberraciones, celestiales, elementales, feéricos, fiendos y no-muertos**: tienen desventaja en sus ataques contra ti, no te pueden poseer o encantar, y puedes gastar una **Acción** para apuntar a una de esas criaturas a 30 pies: debe superar una salvación de **CAR** o queda **desterrada** a su plano o hechizada.`,
  }),
  sp({
    id: 'spell-dominate-person', level: 5, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Hechicero', 'Mago'], damage: '8d8',
    content: `**Dominar persona (Dominate Person)**\n\nIntentas esclavizar a un **humanoide** que puedas ver dentro del alcance: debe superar una salvación de **SAB** o queda **encantado** durante la concentración (hasta 1 minuto) y obedece tus órdenes inmediatas.\n\nMientras lo domines con tu **Acción** para controlarlo completamente, puedes usar su **cuerpo**, su mente y sus **sentidos** para interactuar; cualquiera de estas acciones pervertidas (dañarse a sí mismo) le permite repetir la salvación.\n\nA niveles superiores: la duración cambia (8h/1 día/7 días en niveles 6/7/8+).`,
  }),
  sp({
    id: 'spell-dream', level: 5, school: 'Ilusión', time: '1 minuto', range: 'Ilimitado', comp: 'V, S, M (un puñado de arena, una gota de tinta y una pluma)',
    duration: '8 horas',
    classes: ['Bardo', 'Brujo', 'Mago'],
    content: `**Sueño (Dream)**\n\nModelas un **sueño** en la mente de una criatura que conozcas que esté **durmiendo** en otro lugar del mismo plano de existencia (por ejemplo, un enano a 1 milla): el sueño es de tu autoría (una daño, una noticia, una amenaza...).\n\nPuedes entrar en el sueño y parecer un mensajero. El objetivo solo recuerda el sueño si tú quieres; si el sueño es desagradable (pesadilla), no **recupera los beneficios del descanso** y gana 1 nivel de agotamiento.`,
  }),
  sp({
    id: 'spell-flame-strike', level: 5, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V, S, M (un trozo de azufre)',
    duration: 'Instantáneo',
    classes: ['Clérigo', 'Paladín'], damage: '5d6+5d6',
    content: `**Golpe de llama (Flame Strike)**\n\nUna **columna de fuego divino de 10 pies de radio y 40 pies de alto** se desata en un punto del alcance: las criaturas en el área reciben **5d6 de daño de fuego y 5d6 de daño radiante** (salvación de **DES** para la mitad).\n\n(golpe de llama quema y radiante).\n\nA niveles superiores: +1d6 de fuego y +1d6 de radiante por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-geas', level: 5, school: 'Encantamiento', time: '1 minuto', range: '60 pies', comp: 'V',
    duration: 'Concentración, hasta 30 días', conc: true,
    classes: ['Bardo', 'Clérigo', 'Druida', 'Paladín', 'Mago'],
    content: `**Antojo (Geas)**\n\nImpones un **comandamiento mágico** a una criatura que puedas ver dentro del alcance: debe superar una salvación de **SAB** o queda **encantada** y obedece la orden (hasta 30 días).\n\nMientras dure, si la criatura te **desobedece** (ignora una orden que va contra su naturaleza, se niega a cumplir, ataca, se escapa), recibe **5d10 de daño psíquico** cada vez que incumpla.\n\nA niveles superiores: la duración es 10 días a nivel 7, 30 días a nivel 9.`,
  }),
  sp({
    id: 'spell-greater-restoration', level: 5, school: 'Abjuración', time: '1 Acción', range: 'Toque', comp: 'V, S, M (polvo de diamante de 100 po)',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Clérigo', 'Druida', 'Paladín'],
    content: `**Restablecimiento mayor (Greater Restoration)**\n\nTocas a una criatura y terminas **una de las siguientes condiciones**: la reducción de una característica, el efecto de un conjuro que reduzca una aptitud, la reducción de PG máximos, los **niveles de agotamiento** (1), el **cegamiento o sordera**, el **encantamiento** o la **petrificación**.\n\nEl conjuro no termina la maldición ni el veneno de un objeto maldito.`,
  }),
  sp({
    id: 'spell-hallow', level: 5, school: 'Evocación', time: '24 horas', range: 'Toque', comp: 'V, S, M (incienso, hierbas, aceite en polvo de al menos 1,000 po)',
    duration: 'Hasta que se disipe',
    classes: ['Clérigo'],
    content: `**Santificar (Hallow)**\n\nConsagras un **área de hasta 60 pies de radio** dentro de un punto que tocas durante 24 horas: el área queda **protegida** contra los efectos mágicos, los **celestiales, elementales, feéricos, fiendos y no-muertos** no pueden entrar, y los efectos de otras criaturas sobre ella se suprime.\n\nPuedes elegir un efecto **otorgado** (como Energía monstruosa, Miedo, Oscuridad, Luz brillante, Restricción de muerte, Tormenta) que afecte al área mientras dure.`,
  }),
  sp({
    id: 'spell-insect-plague', level: 5, school: 'Conjuración', time: '1 Acción', range: '300 pies', comp: 'V, S, M (unas pocas larvas y unos granos de azúcar)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Clérigo', 'Druida'], damage: '4d10',
    content: `**Plaga de insectos (Insect Plague)**\n\nUn **enjambre de langostas devoradoras** (u otra plaga) llega en una **esfera de 20 pies de radio** dentro del alcance y es **terreno difícil**, con un **centro de densidad de insectos** que lo oculta todo.\n\nLas criaturas en el área mientras se mueven a través o empiezan su turno reciben **4d10 de daño de perforante** (salvación de **CON** para la mitad) y la plaga arruina la visibilidad normal.\n\nA niveles superiores: +1d10 por nivel de espacio superior.`,
  }),
  sp({
    id: 'spell-legend-lore', level: 5, school: 'Adivinación', time: '10 minutos', range: 'Personal', comp: 'V, S, M (incienso más cualquier combinación de elementos)',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Clérigo', 'Mago'],
    content: `**Saber legendario (Legend Lore)**\n\nAveriguas **historias y leyendas** sobre un **objeto, lugar o persona** que pueda tener **información legendaria**: el DM te cuenta los relatos, cuentos y **secreto** asociados.\n\nSi el objetivo es una **criatura**, debes conocerla (por nombre o fisonomía); si es un objeto o lugar, debes haberlo **tocado** o **visto**.\n\nA nivel superior puedes lanzarlo como ritual (10 min) para no consumir espacio.`,
  }),
  sp({
    id: 'spell-mislead', level: 5, school: 'Ilusión', time: '1 Acción', range: 'Personal', comp: 'S',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Bardo', 'Mago'],
    content: `**Confundir (Mislead)**\n\nTe vuelves **invisible** durante la duración (hasta 1 hora) mientras creas a la vez a una **doble ilusoria** tuya que se mueve cuando tú te mueves.\n\nPuedes cambiar tu perspectiva: usar la ilusión como si estuvieras allí, pero la ilusión no puede ser objetivo de ataques ni de conjuros; puedes alternar entre ver desde ti y desde la ilusión con tu **Acción**.`,
  }),
  sp({
    id: 'spell-modify-memory', level: 5, school: 'Encantamiento', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Mago'],
    content: `**Modificar memoria (Modify Memory)**\n\nIntentas falsificar los **recuerdos** de una criatura que puedas ver dentro del alcance: debe superar una salvación de **SAB** o queda **encantada** durante la concentración (hasta 1 minuto); mientras dure, su percepción (saber dónde está, qué ve, quién la rodea) se sustituye por la que tú determines.\n\nPuedes modificar su memoria de hasta **10 minutos** (cómo recuerda algo: eran 5 minutos de una conversación, o todo el evento). La memoria puede ser completamente falsa o modificada. Repite la salvación si la dañas.\n\nA niveles superiores: puedes modificar hasta 1 hora (nivel 6), 1 día (7), 7 días (8) o 30 días (9) de memoria.`,
  }),
  sp({
    id: 'spell-passwall', level: 5, school: 'Transmutación', time: '1 Acción', range: '30 pies', comp: 'V, S, M (una pizca de semillas de sésamo)',
    duration: '1 hora',
    classes: ['Mago'],
    content: `**Paso a través de pared (Passwall)**\n\nUn **pasaje que atraviesa madera, yeso o piedra** de 5 pies de ancho, 8 pies de alto y 20 pies de largo aparece en un punto que toques dentro del alcance (la pared debe tener al menos 3 pies de grosor).\n\nEl pasaje dura 1 hora; si la pared es una **fortaleza mágica** o está hecha de hierro, el conjuro no funciona.\n\nAl terminar, el pasaje se **cierra**: cualquier criatura que quede dentro es arrojada a un lado u otra.`,
  }),
  sp({
    id: 'spell-planar-binding', level: 5, school: 'Abjuración', time: '1 hora', range: '60 pies', comp: 'V, S, M (una joya de 1,000 po)',
    duration: 'Concentración, hasta 24 horas', conc: true,
    classes: ['Bardo', 'Clérigo', 'Druida', 'Brujo', 'Mago'],
    content: `**Vínculo planar (Planar Binding)**\n\nIntentas encadenar a un **celestial, elemental, feérico o fiendo** que pueda ver dentro del alcance durante la duración (hasta 24 horas mientras mantengas la concentración): debe superar una salvación de **CAR** o queda **vinculado** a tu servicio, obedeciendo tus órdenes mientras los términos sean razonables (y no peligrosos).\n\nSi el objetivo se ajusta a tu alineamiento o te es hostil, la salvación tiene ventaja; si negocias un servicio, no hay tiradura.\n\nA niveles superiores: +1 día de duración por nivel de espacio superior al 5 (y la concentración se requiere por cada día).`,
  }),
  sp({
    id: 'spell-raise-dead', level: 5, school: 'Nigromancia', time: '1 hora', range: 'Toque', comp: 'V, S, M (un diamante de 500 po)',
    duration: 'Instantáneo',
    classes: ['Bardo', 'Clérigo', 'Paladín'],
    content: `**Levantar a los muertos (Raise Dead)**\n\nDevuelves la vida a una criatura que haya muerto hace **hasta 10 días**: debe tener la mayor parte del cuerpo intacta y no puede tratarse de un no-muerto.\n\nVuelve con **1 PG**, en su ubicación, con los **conjuros de su cuerpo** intactos; la **parálisis, la ceguera o la sordera** persisten, y sufre **-4 a las tiradas de ataque y salvación** durante los próximos días hasta que **descansé** (los efectos terminan con un descanso largo).`,
  }),
  sp({
    id: 'spell-reincarnate', level: 5, school: 'Transmutación', time: '1 hora', range: 'Toque', comp: 'V, S, M (aceite y polvo de 100 po)',
    duration: 'Instantáneo',
    classes: ['Druida'],
    content: `**Reencarnar (Reincarnate)**\n\nReencarnas el espíritu de una criatura humanoide que murió hace **hasta 10 días** en su lugar: aparece en **nuevo cuerpo** de un humanoide aleatorio (según la tabla: enano, elfo, mediano –orco, etc.).\n\nConserva su **INT, SAB y CAR**, su personalidad, memoria y habilidades de clase; pierde los rasgos raciales y los conjuros de cuerpo. El nuevo cuerpo es **válido** para su plantilla de raza.`,
  }),
  sp({
    id: 'spell-seeming', level: 5, school: 'Ilusión', time: '1 Acción', range: '30 pies', comp: 'V, S',
    duration: 'Concentración, hasta 8 horas', conc: true,
    classes: ['Bardo', 'Mago'],
    content: `**Apariencia (Seeming)**\n\nCambias la **apariencia** de hasta **un número de criaturas ilimitado** dentro del alcance (excepto tú) según tu descripción (disfraces): puedes hacer que parezcan una **raza o género diferente**, más altas o bajas, con **características similares**.\n\nLas criaturas voluntarias pueden elegir aceptar el cambio; las reacias deben superar una salvación de **CAR** o quedan disfrazadas. La ilusión no sobrevive a una **inspección táctil**.`,
  }),
  sp({
    id: 'spell-summon-dragon', level: 5, school: 'Conjuración', time: '1 Acción', range: '60 pies', comp: 'V, S, M (un diente de dragón)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Mago'],
    content: `**Conjurar dragón (Summon Dragon)**\n\nConjuras un **espíritu de dragón** que se materializa en un punto del alcance (los espíritus de dragón jóvenes son CR 2, los dragones jóvenes CR 6 o 7), y que obedece tus órdenes durante la concentración (hasta 1 hora).\n\nPuede atacar, usar su **aliento**, moverse y ayudarte en combate; tiene **ataque a distancia** de daño elemental según su tipo.\n\nA niveles superiores: CR +1 por cada dos niveles del espacio por encima del 5.`,
  }),
  sp({
    id: 'spell-telekinesis', level: 5, school: 'Transmutación', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Hechicero', 'Mago'],
    content: `**Telequinesis (Telekinesis)**\n\nObtienes la **capacidad de mover criaturas y objetos con la mente** por el poder de la concentración (hasta 10 minutos): tiras contra el **peso y fuerza** (contra un objeto de hasta 1,000 libras) y contra la **FUE (Atletismo)** o **DES (Acrobacias)** de la criatura.\n\nPuedes **sostener** a la criatura (inmovilizada en el aire), **empujarla** (hasta 30 pies), o **lanzarla** (contra un objeto o criatura); gastas tu **Acción** al mantenerlo.\n\nA niveles superiores: puedes apuntar a 2 objetos a nivel 6+.`,
  }),
  sp({
    id: 'spell-telepathic-bond', level: 5, school: 'Adivinación', time: '1 Acción', range: '30 pies', comp: 'V, S, M (trocitos de huevo de distintas especies)',
    duration: 'Concentración, hasta 1 hora', conc: true,
    classes: ['Mago'],
    content: `**Vínculo telepático (Rary's Telepathic Bond)**\n\nForjas una **conexión telepática** entre hasta **8 criaturas voluntarias** dentro del alcance (y, si lo desean, contigo): mientras dure la concentración (hasta 1 hora), pueden comunicarse **telepáticamente** entre sí a cualquier distancia.\n\nSi una criatura deja el alcance o muere, el vínculo se rompe para ella; la conexión no traspasa planos.`,
  }),
  sp({
    id: 'spell-teleportation-circle', level: 5, school: 'Conjuración', time: '1 minuto', range: '10 pies (círculo de 10 pies)', comp: 'V, M',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Círculo de teletransporte (Teleportation Circle)**\n\nCreas un **círculo de 10 pies de radio** de energía que teletransporta a cualquier criatura que entre en él al **círculo de teletransporte** de un destino permanente que conozcas en un plano (cada 6 segundos teletransporta a una criatura).\n\nEl círculo es **permanente** si lanzas el conjuro en el mismo lugar todos los días durante 1 año. Lanzarlo en un círculo permanente de otro viaja instantáneamente.`,
  }),
  sp({
    id: 'spell-tree-stride', level: 5, school: 'Conjuración', time: '1 Acción', range: 'Personal', comp: 'V, S',
    duration: 'Concentración, hasta 1 minuto', conc: true,
    classes: ['Druida', 'Guardabosques'],
    content: `**Paso entre árboles (Tree Stride)**\n\nMientras dure la concentración (hasta 1 minuto), puedes **entrar en un árbol vivo** (de al menos 4 pulgadas de diámetro) y salir por cualquier **otro árbol vivo** del mismo tipo dentro de un radio de 500 pies, apareciendo a 5 pies.\n\nPuedes **caminar** a través de los árboles a tu velocidad normal (o 5 millas) y salir por otro árbol del mismo tipo.`,
  }),
  sp({
    id: 'spell-wall-of-stone', level: 5, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S, M (un pequeño bloque de granito)',
    duration: 'Concentración, hasta 10 minutos', conc: true,
    classes: ['Druida', 'Hechicero', 'Mago'],
    content: `**Muro de piedra (Wall of Stone)**\n\nCreas un **muro de piedra no mágico** (de hasta 10 pies de grosor y 30 pies de alto; hasta **10 pies de grosor** y 100 pies de largo) en el suelo dentro del alcance, con objeto anclado.\n\nEl muro es **permanente** salvo que lo destruyan; es una **estructura de piedra**, no se puede disipar con disipar magia. Puedes **moldearlo** con tu concentración (por ejemplo, hacer un paso).`,
  }),

  // ---------------- Nivel 6 ----------------
  sp({
    id: 'spell-chain-lightning', level: 6, school: 'Evocación', time: '1 Acción', range: '150 pies', comp: 'V, S, M',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago'], damage: '10d8',
    content: `**Cadena de relámpagos (Chain Lightning)**\n\nUn rayo golpea al objetivo primario y **salta** a 3 criaturas a 30 pies. Cada una (salvación de **DES**): **10d8** de daño de relámpago, la mitad si supera.\n\nA niveles superiores: +1 salto por nivel.`,
  }),
  sp({
    id: 'spell-disintegrate', level: 6, school: 'Transmutación', time: '1 Acción', range: '60 pies', comp: 'V, S, M',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago'], damage: '10d6+40',
    content: `**Desintegrar (Disintegrate)**\n\nUn rayo verde desintegra (salvación de **DES**): **10d6+40** de daño de **fuerza**. Si el objetivo muere, queda **reducido a polvo** (solo Revivir o magia mayor puede restaurarlo).`,
  }),
  sp({
    id: 'spell-heal', level: 6, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Clérigo', 'Druida'],
    content: `**Curar (Heal)**\n\nUna criatura recupera **70 PG**, y termina estados como Cegado, Sordo, Parálisis, venenos, maldiciones y agotamiento. (No recupera la vista ni el oído perdidos por defectos previos.)`,
  }),
  sp({
    id: 'spell-sunbeam', level: 6, school: 'Evocación', time: '1 Acción', range: '120 pies', comp: 'V, S, M',
    duration: '1 minuto', conc: true, classes: ['Clérigo', 'Druida', 'Hechicero', 'Mago'], damage: '6d8',
    content: `**Rayo de sol (Sunbeam)**\n\nLínea de luz (5 pies de ancho). Las criaturas (salvación de **CON**) reciben **6d8** de daño **radiante**; los no muertos también incurren en desventaja.\n\nPuedes emitir un nuevo rayo como **acción** en turnos siguientes mientras dure la concentración.`,
  }),

  // ---------------- Nivel 7 ----------------
  sp({
    id: 'spell-fire-storm', level: 7, school: 'Evocación', time: '1 Acción', range: '150 pies', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Clérigo', 'Druida', 'Hechicero'], damage: '7d10',
    content: `**Tormenta de fuego (Fire Storm)**\n\nTorres de llama en 10 cubos de 10 pies. Las criaturas (salvación de **DES**) reciben **7d10** de daño de fuego, la mitad si superan. Arde un área y consume vegetación/ objetos inflamables.`,
  }),
  sp({
    id: 'spell-forcecage', level: 7, school: 'Evocación', time: '1 Acción', range: '100 pies', comp: 'V, S, M',
    duration: '1 hora', classes: ['Bardo', 'Brujo', 'Hechicero', 'Mago'],
    content: `**Jaula de fuerza (Forcecage)**\n\nCreas una jaula o caja de barras de fuerza (o una esfera sólida) que encierra a las criaturas del área. **No puede escaparse** por medios físicos ni mágicos ordinarios (solo Teletransporte al exterior); las barras bloquean proyectiles y conjuros.`,
  }),
  sp({
    id: 'spell-prismatic-spray', level: 7, school: 'Evocación', time: '1 Acción', range: '60 pies', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago'], damage: '10d6',
    content: `**Aspersión prismática (Prismatic Spray)**\n\nRayos de 8 colores en un cono de 60 pies. Cada criatura (salvación de **DES**) o no puede esquivar **y** recibe **10d6** de daño (mitad con éxito), además de un efecto por color (tira 1d8): fuego 6d6, ácido 6d6, relámpago 6d6, veneno 6d6, frío 6d6,...`,
  }),
  sp({
    id: 'spell-teleport', level: 7, school: 'Conjuración', time: '1 Acción', range: '10 pies (destino en cualquier plano)', comp: 'V',
    duration: 'Instantáneo', classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Teletransporte (Teleport)**\n\nTrasladas a varias criaturas (máx. 8 objetivos) al destino elegido en un plano. La fiabilidad depende de la **familiaridad** con el destino: objeto asociado (fiable), descrito con precisión, visto de pasada o descrito vagamente (increíblemente peligroso).\n\nEl DM determina el resultado según la tabla de errores del conjuro.`,
  }),

  // ---------------- Nivel 8 ----------------
  sp({
    id: 'spell-antimagic-field', level: 8, school: 'Abjuración', time: '1 Acción', range: 'Personal (10 pies)', comp: 'V, S, M',
    duration: '1 hora', conc: true, classes: ['Clérigo', 'Mago'],
    content: `**Campo antimagia (Antimagic Field)**\n\nBurbuja de 10 pies de radio: **sin magia** dentro (conjuros suprimidos, objetos mágicos apagados, criaturas mágicas neutralizadas). Las criaturas del interior no pueden lanzar conjuros ni usar efectos mágicos.\n\nAl terminar la duración, la magia retorna con normalidad.`,
  }),
  sp({
    id: 'spell-power-word-stun', level: 8, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V',
    duration: 'Instantáneo', classes: ['Bardo', 'Hechicero', 'Mago'],
    content: `**Palabra de poder: Aturdir (Power Word Stun)**\n\nUna criatura de **150 PG o menos** (visible, sin tirada) queda **Aturdida** durante 1 minuto (salvación de CON al final de cada turno). Las de más PG son inmunes.`,
  }),
  sp({
    id: 'spell-sunburst', level: 8, school: 'Evocación', time: '1 Acción', range: '150 pies', comp: 'V, S, M',
    duration: 'Instantáneo', classes: ['Clérigo', 'Druida', 'Hechicero', 'Mago'], damage: '12d6',
    content: `**Explosión solar (Sunburst)**\n\nFulgor radiante (radio 60 pies). Las criaturas (salvación de **CON**) reciben **12d6** de daño **radiante**; los no muertos son **incinerados** si mueren. La luz brillante persiste 1 minuto (daña e incega a los sensibles a la luz).`,
  }),

  // ---------------- Nivel 9 ----------------
  sp({
    id: 'spell-meteor-swarm', level: 9, school: 'Evocación', time: '1 Acción', range: '1 milla', comp: 'V, S',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago'], damage: '20d6+20d6',
    content: `**Enjambre de meteoros (Meteor Swarm)**\n\n4 bolas de fuego impactan en puntos a 1 milla (radio 40 pies cada una). Las criaturas (salvación de **DES**): **20d6 de fuego + 20d6 de contundente**; la mitad si superan. El impacto quema el área y deja cráteres.`,
  }),
  sp({
    id: 'spell-power-word-kill', level: 9, school: 'Encantamiento', time: '1 Acción', range: '60 pies', comp: 'V',
    duration: 'Instantáneo', classes: ['Bardo', 'Hechicero', 'Mago', 'Brujo'],
    content: `**Palabra de poder: Matar (Power Word Kill)**\n\nUna criatura de **100 PG o menos** muere al instante (sin tirada). Las de más PG son inmunes.`,
  }),
  sp({
    id: 'spell-wish', level: 9, school: 'Conjuración', time: '1 Acción', range: 'Personal', comp: 'V',
    duration: 'Instantáneo', classes: ['Hechicero', 'Mago'],
    content: `**Deseo (Wish)**\n\nEl conjuro más poderoso del repertorio arcano.

- **Modo seguro:** replica un conjuro de nivel 8 o menor sin componentes, o crea un objeto de hasta 25.000 PO.
- **Modo creativo:** expresa un deseo más potente y el DM lo interpreta literalmente. Ese uso, suele traer consecuencias: el lanzador sufre un estrés tremendo (FUE a 3, 1d10 necrótico por nivel y penalización de 33% en futuros usos).`,
  }),
];