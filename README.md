# DMBuddy 🎲

Asistente web para Dungeon Masters de **Dungeons & Dragons 5e**, inspirado en la app iOS "DM Copilot". Diseñado para acompañar la mesa durante la partida: seguimiento de combate, biblioteca de monstruos, gestión del grupo, tiradas de dados, notas del DM y un panel de control general.

## ✨ Características

- **⚔️ Rastreador de combate**
  - Iniciativa por turnos con gestión de rondas.
  - Orden de iniciativa editable (arrastrar y soltar).
  - Barra de vida con daños, curaciones y PG temporales.
  - Estados/condiciones rápidos (envenenado, paralizado, derribado...).
  - Ataques directos de monstruos con cálculo de daño (2d6, 1d8+4...) y tirada contra CA.
  - Registro de combate con historial completo.
- **👹 Biblioteca de monstruos**
  - Monstruos SRD (5e y 2024) precargados.
  - Creador de monstruos propios con sugerencia de CA y XP por CR.
  - Encuentros por dificultad (fácil, medio, difícil, mortal).
- **📚 Biblioteca de referencia (SRD 5.2)**
  - Reglas básicas, estados, conjuros, bestiario 2024, clases, especies y dotes con convenciones de 2024.
  - Buscador global con paleta de comandos (**Ctrl+K**) tolerante a acentos y tags por colección.
  - Filtros para conjuros (nivel, escuela, clase) y bloque de estadísticas 2024 para monstruos.
  - Atribución de licencia **CC-BY-4.0** persistente en el pie de página.
- **🧙 Gestión del grupo**
  - Fichas de personaje con estadísticas al estilo 5e.
  - Panel rápido de iniciativa contra trampas/encuentros.
- **🎲 Dados**
  - Tiradas de `XdY`, ventaja/desventaja, críticos en 20, dados explosivos.
  - Lanzador persistente y dados animados.
- **📝 Notas del DM**
  - Editor Markdown con vista previa en vivo.
  - Búsqueda rápida por título o contenido.
- **🏠 Panel de control**
  - Resumen del estado de la partida, enemigos vivos y próximos turnos.

## 🧰 Tecnologías

| Área | Herramienta |
| --- | --- |
| Framework | React 19 + TypeScript (estricto) |
| Estilos | Tailwind CSS 3 + tema D&D propio |
| Estado | Zustand 5 con persistencia en `localStorage` |
| Enrutado | React Router v6 (HashRouter) |
| Drag & drop | @dnd-kit |
| Markdown | react-markdown + remark-gfm + markdown-to-jsx |
| Animaciones | Framer Motion + animaciones CSS |
| Iconos | lucide-react |
| Tests | Vitest + Testing Library |

## 📦 Instalación

```bash
npm install
```

## 🚀 Desarrollo

```bash
npm run dev        # servidor de desarrollo (Vite)
npm run build      # compilación de producción (tsc + vite build)
npm run preview    # previsualizar el build
npm run lint       # oxlint (0 advertencias / 0 errores)
npm run test       # ejecutar la suite de tests
```

## 📖 SRD 5.2 (Biblioteca de referencia)

El contenido de reglas 2024 usa el **System Reference Document 5.2** de Wizards of the Coast bajo licencia
**Creative Commons Attribution 4.0 International (CC-BY-4.0)** (ver el aviso en el pie de página de la app,
<https://www.dndbeyond.com/srd>).

### Arquitectura de datos

- **Bundle embebido (offline):** `src/data/srd2024/` contiene los contenidos curados y tipados
  (`rules.ts`, `spells.ts`, `character.ts` y `monsters.ts`), reunidos en `index.ts`.
- **Overlay remoto (ampliable):** en `public/data/srd2024/*.json`. Al arrancar, `srdService.ts`
  intenta cargarlos (`fetchSrdOverlays`) y los **fusiona** por `id` sobre el bundle embebido;
  si el archivo no existe o está vacío, se mantiene el bundle. Cada overlay es un array de
  entradas con la forma `SrdRecord` (`{ id, title, category, source, tags, ... }`).
- **Ingestión:** para generar overlays desde fuentes externas:

```bash
node scripts/fetch-srd2024.mjs         # desde data/srd2024/raw/*.json si existen
node scripts/fetch-srd2024.mjs --fetch # además intenta la API de Open5e
npm run fetch:srd                      # equivale al primer comando
```

  El script nunca sobrescribe contenido ya existente y no toca el bundle embebido.
  > **Nota:** la API pública de Open5e (`api.open5e.com/v1`) sirve estadísticas de la
  > edición 2014, no de 5.2. Úsala solo para ampliar volumen; el contenido 2024 curado
  > vive en `src/data/srd2024/`. Para datos 5.2 precisos, coloca tus documentos en
  > `data/srd2024/raw/<colección>.json` y el script los normalizará a overlays.

### Búsqueda y búsqueda rápida

- `src/utils/srdSearch.ts`: índice plano y scoring
  tolerante a acentos/mayúsculas (`searchSrd`, `indexBundle`).
- Paleta global **Ctrl+K** (`SearchPalette`) para abrir cualquier entrada desde cualquier pantalla.

## ☁️ Deploy

El proyecto usa `HashRouter`, por lo que el build funciona en cualquier hosting estático sin configuración extra.

```bash
npm run deploy     # build + publicación en GitHub Pages (gh-pages)
```

## 📁 Estructura

```
src/
├── components/          # UI por sección
│   ├── common/          #   Button, Modal, Sidebar, Layout, HealthBar, QuickRoll
│   ├── combat/          #   Rastreador de combate
│   ├── monsters/        #   Biblioteca de monstruos
│   ├── reference/       #   Biblioteca SRD: ReferenceLibrary, SrdDetailPanel,
│   │                    #   SrdBadge, SearchPalette, AttributionFooter
│   ├── players/         #   Gestión del grupo
│   ├── dice/            #   Lanzador de dados
│   ├── notes/           #   Notas del DM
│   └── dashboard/       #   Panel de control
├── data/                # Monstruos SRD 5e + tabla CR→XP
│   └── srd2024/raw/     # (opcional) documentos raw para ingestión externa
├── hooks/               # useCombat, useDice, useLocalStorage
├── services/            # Cargador del SRD (srdService)
├── state/               # Stores de UI y SRD (srdStore)
├── store/               # Zustand stores (combate, monstruos, jugadores, notas, dados)
├── types/               # Tipos compartidos + tipos del SRD (srd2024)
├── utils/               # dados, cálculo de daño, utilidades de combate, búsqueda SRD
└── __tests__/           # Suite de tests (Vitest)
public/data/srd2024/     # Overlays JSON generables (reglas, conjuros, monstruos...)
scripts/                 # fetch-srd2024.mjs (ingestión)
```

## 📜 Licencia

Proyecto de uso personal para mesas de D&D. Los monstruos provienen de la SRD 5e (OGL).
El contenido del SRD 5.2 se usa bajo **CC-BY-4.0** tal como se publica en
<https://www.dndbeyond.com/srd>.