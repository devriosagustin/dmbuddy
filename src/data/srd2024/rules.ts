// ============================================================
// SRD 5.2 - Reglas básicas y condiciones (2024)
// Contenido curado resumido del Rules Glossary, CC-BY-4.0
// ============================================================

import type { SrdRuleEntry, SrdConditionEntry } from '../../types/srd2024';

const srd = (id: string, chapter: string, summary: string, content: string): SrdRuleEntry => ({
  id,
  title: summary,
  chapter,
  summary,
  content,
  category: 'rules',
  source: 'srd2024',
  tags: ['SRD 2024', chapter],
});

const cond = (id: string, _chapter: string, summary: string, content: string): SrdConditionEntry => ({
  id,
  title: summary,
  summary,
  content,
  category: 'conditions',
  source: 'srd2024',
  tags: ['SRD 2024', 'Condición'],
});

/** Reglas básicas de combate, movimiento, descanso y viaje. */
export const CORE_RULES: SrdRuleEntry[] = [
  srd(
    'rule-combate-turno',
    'Acciones en combate',
    'El turno en combate',
    `En tu turno puedes realizar una **Acción**, un **Movimiento** y una **Acción Gratuita**. Los **Combates** y **Disparos** se resuelven en **rondas** de 6 segundos.

Una **Acción de Reacción** es una respuesta a un suceso (p. ej. el Ataque de Oportunidad) y puede realizarse una vez por ronda aunque no sea tu turno. Las **Acciones de Bonificación** requieren una habilidad o rasgo que las conceda.

> **Orden del turno:** en la primera ronda se lanza iniciativa (d20 + DES) al comienzo de cada combate. En cada ronda se actúa de mayor a menor iniciativa. Cuando todos los combatientes han actuado, empieza la siguiente ronda.`
  ),

  srd(
    'rule-combate-atacar',
    'Acciones en combate',
    'Atacar',
    `**Atacar:** realiza un ataque cuerpo a cuerpo o a distancia.

**Cuerpo a cuerpo:** tira **d20 + modificador de habilidad + Competencia**. Contrapones el resultado a la **CA** del objetivo; si igualas o superas la CA, es un **impacto** y tiras el daño.

**A distancia:** tira d20 + DES (o FUE con un arma de lanzar); tienes **desventaja** si hay una criatura hostil en combate cuerpo a cuerpo contigo sin neutralizar. Si el objetivo está más allá de su alcance normal, el ataque falla automáticamente (algunas dotes amplían el alcance).`
  ),

  srd(
    'rule-combate-lanzar',
    'Acciones en combate',
    'Lanzar un conjuro',
    `**Lanzar un conjuro:** manifiestas uno de tus conjuros en tu turno.

- Usa una **Acción** por norma general; algunos conjuros usan una **Acción de Bonificación** o una **Reacción**.
- Un conjuro con componente **M** requiere una bolsa de componentes o un foco.
- Si el conjuro tiene **Concentración**, mantenerlo consume tu Concentración (solo un conjuro a la vez) y debes tirar una **prueba de Constitución CD 10** si recibes daño.
- Los **trucos** pueden lanzarse a voluntad; el resto consumen **espacios de conjuro**.`
  ),

  srd(
    'rule-combate-carrera',
    'Acciones en combate',
    'Carrera (Dash)',
    `**Carrera:** obtienes un movimiento adicional igual a tu Velocidad para este turno.

Cada pie de movimiento gastado cuenta contra tu velocidad. Utilizar una acción para **Correr** te permite moverte hasta el doble de tu Velocidad total en el turno.`
  ),

  srd(
    'rule-combate-separarse',
    'Acciones en combate',
    'Separarse (Disengage)',
    `**Separarse:** tu movimiento no provoca **Ataques de Oportunidad** durante este turno.

Puedes abandonar el alcance de una criatura hostil sin exponerte: mientras dura esta acción, el movimiento que realices no dispara reacciones de oportunidad.`
  ),

  srd(
    'rule-combate-esconderse',
    'Acciones en combate',
    'Esconderse (Hide)',
    `**Esconderse:** realizas una prueba de **Sigilo (DES)** para no ser encontrado.

Estás oculto si tienes éxito y una criatura no te puede percibir. Mientras estás oculto tienes **ventaja** en los ataques contra criaturas que no te detectan, y ellas tienen **desventaja** para atacarte. Atacar o lanzar un conjuro sonado delata tu posición.`
  ),

  srd(
    'rule-combate-ayudar',
    'Acciones en combate',
    'Ayudar (Help)',
    `**Ayudar:** cooperas con un aliado o interferes con un enemigo.

Da **ventaja** en la siguiente tirada de ataque o prueba de habilidad que realice un aliado contra un objetivo concreto. También puedes intentar distraer a una criatura hostil: tu aliado obtiene ventaja en el siguiente ataque contra ella.`
  ),

  srd(
    'rule-combate-preparar',
    'Acciones en combate',
    'Preparar (Ready)',
    `**Preparar:** eliges una **reacción** para actuar más tarde este ronda.

Declara una acción ("atacaré al primer enemigo que se aproxime") y un **desencadenante**. Cuando el desencadenante se cumpla, gastas tu reacción y ejecutas la acción preparada. Si preparas un **conjuro de acción**, lo canalizas y debes mantener la concentración hasta la reacción.`
  ),

  srd(
    'rule-combate-buscar',
    'Acciones en combate',
    'Buscar (Search)',
    `**Buscar:** inspeccionas una zona u objetivo para encontrar algo.

Realiza una prueba de **Percepción (SAB)** o **Investigación (INT)**. Cada tirada puede descubrir cosas ocultas, trampas u objetos camuflados según lo que se pretenda encontrar.`
  ),

  srd(
    'rule-combate-estudiar',
    'Acciones en combate',
    'Estudiar (Study)',
    `**Estudiar:** examinas un objetivo de forma activa para aprender algo sobre él.

Realiza una prueba de **Historia (INT)**, **Arcana (INT)**, **Naturaleza (INT)**, **Religión (INT)** o similar. Con éxito obtienes información útil sobre la criatura, objeto o lugar, como características, debilidades o significado.`
  ),

  srd(
    'rule-combate-utilizar',
    'Acciones en combate',
    'Utilizar (Utilize)',
    `**Utilizar:** usas un **objeto** no mágico en tu turno.

Abrir una puerta, agarrar un objeto al alcance, montar a caballo, encender una antorcha o activar un mecanismo son ejemplos de Utilizar. El uso de objetos mágicos requiere su propia acción o una regla específica.`
  ),

  srd(
    'rule-combate-influir',
    'Acciones en combate',
    'Influir (Influence)',
    `**Influir:** intentas cambiar el comportamiento o estado de ánimo de una criatura.

Describe tu petición y el DM decide la prueba: **Persuasión (CAR)** para ser amable, **Intimidación (CAR)** para amenazar o **Engaño (CAR)** para mentir. Un éxito modifica la actitud de la criatura: hostil, indiferente o amistosa.`
  ),

  srd(
    'rule-combate-magia',
    'Acciones en combate',
    'Magia (Magic)',
    `**Magia:** usas un objeto mágico u otro poder similar que requiera una acción.

Incluye activar varitas, anillos y otros objetos mágicos que no tengan una regla de uso propia, así como ciertos rasgos de clase que indiquen "Acción: Magia". Si el efecto duplica un conjuro, úsalo como la acción de lanzar conjuro.`
  ),

  srd(
    'rule-movimiento',
    'Movimiento y posición',
    'Movimiento, posición y ataques de oportunidad',
    `En tu turno puedes moverte una distancia igual a tu Velocidad.

- **Terreno difícil** (escombros, bosque espeso): moverse cuesta el doble de pies.
- **Escalada y natación** (sin velocidad especial): cuestan el doble, con FUE a discreción del DM. **Salto:** con carrera puedes saltar FUE pies de largo y (3+FUE)/2 de alto.
- **Caerse:** recibes 1d6 de daño contundente por cada 10 pies de caída, máximo 20d6.

> **Ataque de Oportunidad:** cuando una Hostile criatura sale de tu **alcance** (espacio adyacente sin otras reglas), puedes gastar tu **reacción** para atacarla una vez. La retirada con **Separarse** o el **teletransporte** no provocan este ataque.`
  ),

  srd(
    'rule-cobertura',
    'Cobertura',
    'Cobertura',
    `La **cobertura** influye en las tiradas de defensa contra ataques a distancia y ciertos efectos.

| Cobertura | Protección |
| --- | --- |
| **Media** | +2 a CA y a las tiradas de Destreza que evitan daño |
| **Tres cuartos** | +5 a CA y a las tiradas de Destreza que evitan daño |
| **Total** | No se puede atacar directamente; requiere esquinas o área de efecto |

Una criatura que se arrodilla o se tumba puede obtener cobertura media tras un muro bajo. El DM calcula la cobertura trazando una línea desde las esquinas de tu espacio a las del objetivo.`
  ),

  srd(
    'rule-descanso',
    'Reglas de descanso',
    'Descansos: corto y largo',
    `#### Descanso corto
Al menos **1 hora** de inactividad (comer, leer, curarse vendajes). Al final:
- Gastas **Dados de Golpe** (tira el número que elijas, suma CON) para recuperar PG.
- Recuperas algunos rasgos que especifiquen "al terminar un descanso corto".

#### Descanso largo
Al menos **8 horas** (6 de sueño si eres Elfo). Al final:
- **Recuperas todos los PG perdidos** y los Dados de Golpe gastados (hasta la mitad como máximo recuperada... recuperas la mitad de tu máximo de Dados de Golpe, mínimo 1).
- Se restablecen los espacios de conjuro y rasgos.
- Reduces en 1 los niveles de **Agotamiento**.

> Un descanso solo puede ocurrir una vez cada 24 horas. Si sufres daño durante la mayor parte del descanso, se interrumpe y no obtienes sus beneficios.`
  ),

  srd(
    'rule-muerte',
    'Daño y muerte',
    'Daño, PH 0 y salvaciones de muerte',
    `Cuando recibes daño, resta los PG temporales primero y luego los PG. Si tus PG llegan a **0**, caes **Inconsciente** y comienzas el proceso de muerte.

- **Salvaciones de muerte:** al inicio de tu turno con PG 0, tira d20. **10+** = 1 éxito, **9 o menos** = 1 fallo. Con 3 éxitos te **estabilizas**; con 3 fallos **mueres**.
- Un **20** natural restaura 1 PG; un **1** natural cuenta como 2 fallos.
- **Muerte instantánea:** si un solo golpe deja los PG en el negativo de tu máximo (o menos), mueres al instante.
- Recibir daño mientras estás a 0 PG provoca un fallo de muerte (crítico = 2 fallos). El daño de área también.
- **Estabilizar:** una criatura establecida con 0 PG no tira salvaciones de muerte, pero sigue inconsciente hasta recibir curación.`
  ),

  srd(
    'rule-concentracion',
    'Concentración',
    'Concentración en conjuros',
    `Muchos conjuros potentes requieren que mantengas la **Concentración**.

- Solo puedes concentrarte en **un conjuro a la vez**; lanzar otro con concentración termina el anterior.
- Recibir **daño** obliga a una prueba de **Constitución** con CD = **10 o la mitad del daño recibido (la mayor)**. Fallar rompe la concentración.
- Los **trucos** y conjuros sin concentración son gratuitos de mantener.
- Ciertos efectos (aturdimiento, incapacitación, muerte) rompen la concentración automáticamente.`
  ),

  srd(
    'rule-viaje',
    'Viaje',
    'Viaje: ritmo, marchas y percepciones',
    `Los **ritmos de viaje** determinan cuánto puedes avanzar en un día:

| Ritmo | Distancia/hora | Efecto |
| --- | --- | --- |
| **Rápido** | 4 millas (30 pies) | -5 a Percepción (pasiva 12 → 7) |
| **Normal** | 3 millas | — |
| **Lento** | 2 millas | Puedes usar sigilo |

- **Marcha forzada:** más de 8 horas/día = prueba de Constitución cada hora extra (CD 10 + hora). El fallo acumula 1 nivel de **Agotamiento**.
- **Monturas:** un caballo mantiene el ritmo rápido toda la jornada.
- La **Percepción pasiva** (10 + bonificador) detecta monstruos al acecho y trampas.`
  ),

  srd(
    'rule-encuentros',
    'Construcción de encuentros',
    'Encuentros equilibrados (presupuesto de XP)',
    `Para diseñar un encuentro de combate según las reglas 2024, compará el **presupuesto de XP** del grupo con la suma de XP de los monstruos. A diferencia de ediciones anteriores, **no hay multiplicador por cantidad de enemigos**: el XP se suma directo.

- **Paso 1 — Elegí una dificultad**: Baja (uno o dos sustos, el grupo sale sin bajas), Moderada (sin curación de por medio podría complicarse, chance remota de alguna muerte) o Alta (podría ser letal; requiere táctica y algo de suerte).
- **Paso 2 — Calculá el presupuesto**: la tabla *Presupuesto de XP por personaje* da un valor por nivel (1-20) para Baja/Moderada/Alta. Sumá el valor correspondiente de cada personaje del grupo.
- **Paso 3 — Gastá el presupuesto**: cada criatura tiene un valor de XP según su Valor de Desafío (p. ej. CR 1 = 200 XP; CR 2 = 450 XP; CR 4 = 1.100 XP). Sumá monstruos sin pasarte del presupuesto elegido.
- Con más de dos criaturas por personaje aumenta el riesgo de una racha de suerte en contra; convienen algunas criaturas frágiles para compensar, sobre todo a nivel 1-2.`
  ),

  srd(
    'rule-checks',
    'Pruebas y salvaciones',
    'Tiradas de habilidad y salvaciones',
    `Cuando un personaje intenta algo con riesgo de fallo, tira **d20 + modificador + Competencia**.

- **Pruebas de habilidad:** FUE→Atletismo; DES→Acrobacias, Juego de manos, Sigilo; INT→Arcana, Historia, Investigación, Naturaleza, Religión; SAB→Percepción, Perspicacia, Medicina, Supervivencia, Trato con animales; CAR→Actuación, Engaño, Intimidación, Persuasión (la Constitución no tiene habilidades asociadas).
- **CD (clase de dificultad):** muy fácil 5, fácil 10, media 15, dura 20, muy dura 25, casi imposible 30.
- **Ventaja/Desventaja:** tira **dos d20** y usa el mejor (ventaja) o el peor (desventaja); nunca se apilan más que una de cada.
    - **Salvaciones:** se resisten efectos con d20 + atributo + (competencia si la tienes). CD = 8 + competencia + modificador del lanzador.
    - **20 natural y 1 natural** en ataques: acierto/fallo automático; en pruebas son los valores reales.`
  ),

  srd(
    'rule-dano-tiradas',
    'Daño y muerte',
    'Tiradas de daño',
    `Las armas y conjuros indican sus dados (p. ej. 1d8) y el tipo de daño: cortante, perforante, contundente, fuego, frío, relámpago...

- **Crítico:** con un 20 natural en un ataque duplicas los dados del daño (tira los dados dos veces y suma).
- **Resistencia** = la mitad del daño (redondea hacia abajo).
- **Vulnerabilidad** = el doble del daño.
- **Inmunidad** = 0 de daño.

Aplica primero inmunidad/resistencia/vulnerabilidad sobre los dados y después suma los modificadores planos (p. ej. +2 de FUE).`
  ),

  srd(
    'rule-apresar',
    'Acciones en combate',
    'Apresar y derribar',
    `Para **apresar** o **derribar** en 2024 realizas una prueba de **Atletismo (FUE)** contra **Atletismo o Acrobacias** del objetivo.

- **Apresar (Grapple):** con éxito impones el estado **Agarrado**: velocidad 0 y sin beneficios de velocidad. El apresador necesita al menos una mano libre.
- **Derribar (Shove):** con éxito la criatura queda **Derribada** (tumbada).
- El objetivo puede usar su **Acción** para liberarse con Atletismo o Acrobacias contra tu Atletismo.
- Si eres **Grande o mayor** puedes apresar/derribar criaturas más pequeñas que tú ignorando el límite de tamaño.`
  ),

  srd(
    'rule-dotes-srd',
    'Creación de personaje',
    'Dotes del SRD 2024',
    `Las **dotes** conceden capacidades optativas que modifican el personaje (reglas 2024):

- **Dote de origen:** en 1º nivel cada personaje elige una tras su trasfondo (p. ej. *Competente*, *Alerta*).
- **Dote general:** en los niveles de incremento de atributos (4º, 8º, 12º, 16º, 19º, o según clase) puedes tomar una dote general en lugar del +2/+1+1 (p. ej. *Gran arma maestra*, *Tirador de élite*).

Cada dote otorga rasgos, habilidades o trucos concretos descritos en su propia entrada. Este sistema sustituye a los "talentos" de ediciones anteriores.`
  ),

  srd(
    'rule-preparar-conjuros',
    'Conjuros',
    'Preparar conjuros y espacios',
    `- Los lanzadores **preparan** conjuros al terminar un **descanso largo**: preparan un número igual a su nivel de lanzador + modificador de atributo de lanzamiento.
- Los **espacios de conjuro** (1º a 9º) son recursos; lanzar gasta un espacio del nivel del conjuro o superior.
- Los **trucos** son **nivel 0**: no requieren preparación ni gastan espacios; puedes lanzarlos a voluntad.
- **Lanzamiento ritual:** si el conjuro tiene el rasgo *Ritual* y conoces el ritual, puedes lanzarlo con +10 minutos sin gastar espacio.
- Al terminar un descanso largo se recuperan todos los espacios gastados.`
  ),

  srd(
    'rule-competencia',
    'Pruebas y salvaciones',
    'Bono de competencia',
    `El **bono de competencia** depende del nivel: +2 (1-4), +3 (5-8), +4 (9-12), +5 (13-16) y +6 (17-20).

Se suma a:
- tiradas de ataque con **armas competentes** y **ataques de conjuro**;
- **salvaciones** y **pruebas de habilidad** en las que tengas competencia;
- la **CD de conjuro** (8 + competencia + modificador de lanzamiento).

No se aplica a tiradas sin competencia ni a los **Dados de Golpe**. Algunos rasgos lo duplican o añaden la mitad (p. ej. *Pericia*).`
  ),

  srd(
    'rule-sintonizacion',
    'Equipo',
    'Objetos mágicos y sintonización',
    `Los objetos mágicos comunes suelen usarse sin vínculo; los **poderosos** requieren **sintonización** (indicada en su descripción).

- Puedes estar **sintonizado** con un máximo de **3 objetos** a la vez.
- Sintonizar un objeto requiere un **descanso corto** con el objeto contigo.
- Algunos objetos exigen un **requisito** (clase, atributo, rasgo) que debes cumplir.
- **Identificar:** *Detectar magia* + 1 minuto, o un **descanso corto** dedicado al estudio del objeto.`
  ),

  srd(
    'rule-areas',
    'Conjuros',
    'Áreas de efecto y objetivo',
    `Los efectos de **área** (cono, cubo, esfera, cilindro, línea) afectan a todo lo que quede dentro de su geometría; el DM decide qué objetivos se ven afectados y si hay cobertura.

- Las criaturas en el área hacen la **salvación** del conjuro: con éxito suelen sufrir **la mitad del daño**.
- La **cobertura total** entre ti y el punto de origen bloquea el efecto; la cobertura parcial lo permite si el punto es visible.
- Elige los **puntos de origen** en los cruces de la cuadrícula (regla del vértice) cuando uses miniaturas.`
  ),

  srd(
    'rule-luz',
    'Entorno',
    'Visión e iluminación',
    `Tareas como percibir el peligro, acertar a un enemigo y elegir el objetivo de ciertos conjuros dependen de la capacidad de ver. Los efectos que dificultan la visión pueden ser un gran obstáculo.

#### Zonas oscuras
Una zona puede estar **ligeramente oscura** o **muy oscura**.
- **Ligeramente oscura** (luz tenue, neblinas dispersas o follaje moderado): tienes **desventaja** en las pruebas de Sabiduría (Percepción) que dependan de la vista.
- **Muy oscura** (oscuridad, niebla espesa o follaje denso): es **opaca**; sufres el estado **cegado** al intentar ver algo dentro.

#### Iluminación
| Categoría | Efecto |
| --- | --- |
| **Luz brillante** | Permite ver con normalidad (día, antorchas, linternas, hogueras). |
| **Luz tenue** (sombras) | Hace la zona ligeramente oscura; frontera entre luz brillante y oscuridad (ocaso/amanecer, luna llena). |
| **Oscuridad** | Hace la zona muy oscura (noche al exterior, mazmorra sin iluminar, oscuridad mágica). |

#### Sentidos especiales
Algunas criaturas perciben cosas en situaciones en las que otras no:
- **Sentir vibraciones:** percibes la ubicación de criaturas en movimiento que estén en contacto con el mismo suelo hasta su alcance.
- **Visión ciega:** percibes sin necesidad de luz hasta su alcance.
- **Visión en la oscuridad:** ves en la **oscuridad no mágica** en escala de grises hasta ese alcance.
- **Visión verdadera:** ves lo invisible, disfraces, ilusiones y el plano etéreo.

La **oscuridad mágica** solo la contrarresta un sentido de mayor nivel (como la visión verdadera) o la luz creada por un conjuro de nivel superior.`
  ),

  srd(
    'rule-objetos',
    'Entorno',
    'Interactuar con objetos',
    `Las interacciones con objetos suelen resolverse de forma sencilla: el jugador describe lo que su personaje hace (mover una palanca, abrir una puerta) y el DM describe lo que ocurre.

- **Qué se considera un objeto:** un elemento específico e inanimado —una ventana, una puerta, una espada, un libro, una mesa, una silla o una piedra—, pero no un edificio o un vehículo formado por muchos objetos.
- **En combate tienes tiempo limitado:** una **interacción gratuita** con un objeto por turno, durante tu movimiento o tu acción. Cualquier interacción adicional requiere la acción **Utilizar**.
- **Encontrar objetos escondidos:** la prueba de Sabiduría (Percepción) solo revela un objeto oculto si indicas que examinas sus proximidades; no revela lo que está en sitios que no registras.
- **Transportar:** normalmente puedes llevar tu equipo sin preocuparte del peso; objetos inusualmente pesados o en grandes cantidades siguen las reglas de capacidad de carga.
- **Romper objetos:** como acción puedes romper de forma automática un objeto no mágico frágil; dañar algo más resistente sigue las reglas del glosario.`
  ),

  srd(
    'rule-peligros',
    'Entorno',
    'Peligros del entorno',
    `Los monstruos no son las únicas amenazas. Los siguientes **peligros** se definen en el glosario:
- **Asfixia:** puedes aguantar la respiración una cantidad de minutos igual a 1 + tu modificador de Constitución (mínimo 30 segundos); tras eso te quedas a 0 PG y empiezas las salvaciones de muerte al siguiente turno.
- **Caídas:** al final de una caída recibes **1d6 de daño contundente por cada 10 pies**, máximo 20d6.
- **Deshidratación:** sin agua, las pruebas de Constitución difíciles se hacen con desventaja; sin agua durante 6 horas o más, ganas un nivel de **agotamiento** (24h sin agua, CD 15 de Constitución cada hora).
- **Desnutrición:** puedes pasar días sin comer sin efecto; tras la falta prolongada, pruebas de Constitución con desventaja y niveles de agotamiento diarios.
- **Fuego:** entrar a una zona en llamas o terminar el turno en ella inflige generalmente **1d10 de fuego**; el DM fija la CD de salvación y el daño según el material.`
  ),
];

/** Condiciones oficiales del Rules Glossary 2024. */
export const CONDITIONS: SrdConditionEntry[] = [
  cond(
    'cond-seeing',
    'Condiciones',
    'Cegado (Blinded)',
    `**Cegado**
- No puedes ver y fallas automáticamente cualquier prueba que requiera vista.
- Los ataques contra ti tienen **ventaja** y tus ataques tienen **desventaja**.`
  ),
  cond(
    'cond-charmed',
    'Condiciones',
    'Encantado (Charmed)',
    `**Encantado**
- No puedes atacar al encantador ni apuntarlo con efectos dañinos.
- El encantador tiene **ventaja** en sus pruebas sociales contra ti.`
  ),
  cond(
    'cond-deafened',
    'Condiciones',
    'Ensordecido (Deafened)',
    `**Ensordecido**
- No puedes oír y fallas automáticamente cualquier prueba que requiera oído.`
  ),
  cond(
    'cond-exhaustion',
    'Condiciones',
    'Agotamiento (Exhaustion)',
    `**Agotamiento**
Se acumula en **6 niveles**:
| Nivel | Efecto |
| --- | --- |
| 1 | Desventaja en pruebas de habilidad |
| 2 | Velocidad reducida a la mitad |
| 3 | Desventaja en tiradas de ataque y salvaciones |
| 4 | Máximo de PG reducido a la mitad |
| 5 | Velocidad reducida a 0 |
| 6 | Muerte |

Un **descanso largo** reduce el nivel en 1 (excepto por daño, que requiere un conjuro como *Mayor Restauración*). Algunas fuentes de agotamiento indican cuántos niveles infligen.`
  ),
  cond(
    'cond-frightened',
    'Condiciones',
    'Asustado (Frightened)',
    `**Asustado**
- Tienes **desventaja** en tiradas de ataque y pruebas de habilidad mientras la fuente del miedo esté visible.
- No puedes acercarte voluntariamente a la fuente del miedo.`
  ),
  cond(
    'cond-grappled',
    'Condiciones',
    'Agarrado (Grappled)',
    `**Agarrado**
- Tu velocidad es **0** y no puedes recibir beneficios de velocidad (p. ej. de *Haste*).
- El estado termina si el agarrador queda incapacitado o se separa.
- **En 2024** el estado es binario: impones *Agarrado* con una prueba de Atletismo (FUE) contra Atletismo o Acrobacias de tu rival.`
  ),
  cond(
    'cond-incapacitated',
    'Condiciones',
    'Incapacitado (Incapacitated)',
    `**Incapacitado**
- No puedes tomar Acciones, Reacciones ni Acciones de Bonificación.
- Implica vulnerabilidad total: los ataques contra ti tienen **ventaja** y tus salvaciones de Destreza se hacen con desventaja (según el efecto que lo cause).`
  ),
  cond(
    'cond-invisible',
    'Condiciones',
    'Invisible',
    `**Invisible**
- No te pueden ver por medios normales, aunque los rastros (sonido, olor) delatan tu posición.
- Los ataques contra ti tienen **desventaja** y tus ataques contra criaturas que no te ven, **ventaja**.
- Invisible no te hace indetectable: una criatura con **Vista en la oscuridad** no te ve, pero una con *ver lo invisible* sí.`
  ),
  cond(
    'cond-paralyzed',
    'Condiciones',
    'Paralizado (Paralyzed)',
    `**Paralizado**
- Incapacitado: no puede moverse, hablar ni reaccionar.
- Los ataques contra ti tienen **ventaja**; los que te alcanzan desde a menos de 5 pies son **críticos automáticos**.
- Falla automáticamente las salvaciones de Destreza y Fuerza.`
  ),
  cond(
    'cond-petrified',
    'Condiciones',
    'Petrificado (Petrified)',
    `**Petrificado**
- Transformado en piedra: **Incapacitado**, sin posibilidad de moverse ni hablar; no envejece.
- Resiste el daño (resistencia a todo el daño).
- En estado petrificado no comen, no respiran ni duermen; las salvaciones contra petrificación fallan automáticamente.`
  ),
  cond(
    'cond-poisoned',
    'Condiciones',
    'Envenenado (Poisoned)',
    `**Envenenado**
- Tienes **desventaja** en tiradas de ataque y pruebas de habilidad.
- No hay retroalimentación positiva: algunos venenos también dañan al final del turno de la víctima.`
  ),
  cond(
    'cond-prone',
    'Condiciones',
    'Derribado (Prone)',
    `**Derribado (tumbado)**
- Los ataques contra ti desde más de 5 pies tienen **desventaja**; los de a menos de 5 pies, **ventaja**.
- Tienes desventaja en ataques y en pruebas de Destreza.
- Para levantarte gastas **media velocidad** (p. ej. 15 pies de 30). No puedes gatear: mueves 5 pies arrastrándote con desventaja.`
  ),
  cond(
    'cond-restrained',
    'Condiciones',
    'Restringido (Restrained)',
    `**Restringido**
- Velocidad **0** y no puedes recibir bonificaciones de velocidad.
- Los ataques contra ti tienen **ventaja**; tus ataques y tus salvaciones de Destreza tienen **desventaja**.`
  ),
  cond(
    'cond-slowed',
    'Condiciones',
    'Ralentizado (Slowed)',
    `**Ralentizado**
- **Nuevo en 2024.** Velocidad reducida a la mitad.
- **-2** a CA y a las tiradas de Destreza.
- No puedes usar Reacciones ni una Acción de Bonificación; solo una Acción o un Movimiento.`
  ),
  cond(
    'cond-stunned',
    'Condiciones',
    'Aturdido (Stunned)',
    `**Aturdido**
- **Incapacitado** y sin velocidad.
- Falla automáticamente las salvaciones de **Fuerza** y **Destreza**, y los ataques contra ti tienen **ventaja**.`
  ),
  cond(
    'cond-unconscious',
    'Condiciones',
    'Inconsciente (Unconscious)',
    `**Inconsciente**
- **Incapacitado**, sin poder moverse ni hablar; no percibe el mundo (deja caer lo que sostiene, termina su concentración).
- Falla automáticamente las salvaciones de **Fuerza** y **Destreza**.
- Los ataques contra ti tienen **ventaja**; los que te golpean desde a menos de 5 pies son **críticos**.
- Volver a la consciencia: recibir daño (te despiertas), o finalizar el efecto que lo causa. Con 0 PG, permaneces en **salvaciones de muerte**.`
  ),
];
