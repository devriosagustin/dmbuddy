# DMBuddy — guía para trabajar en este repo con IA

Asistente web de Dungeon Master (D&D 5e / SRD 2024). Ver README.md para features y estructura completa; esta guía cubre lo que no es obvio leyendo el código.

## Stack y comandos
- React 19 + TypeScript estricto + Vite 8, Zustand 5 (persistencia en localStorage), Tailwind 3, React Router v6 (HashRouter — deploy sin config de servidor).
- `npm run dev` / `npm run build` (tsc -b && vite build) / `npm run test` (vitest run) / `npm run lint` (oxlint) / `npm run preview`.
- Deploy: GitHub Actions (`.github/workflows/deploy.yml`) a GitHub Pages en cada push a `main`. **El workflow solo hace `npm run build`: no corre tests ni lint.** Correrlos localmente antes de pushear a main.

## Antes de tocar código: normalizar finales de línea
El working tree puede mostrar decenas de archivos "modificados" que en realidad son solo CRLF↔LF (no hay `.gitattributes` en el repo). Antes de empezar, correr `git diff --stat`: si aparecen muchos archivos con diffs de archivo completo, es ruido de line endings, no cambios reales. Normalizar (agregar `.gitattributes` con `* text=auto eol=lf`, `git add --renormalize .`) antes de mezclarlo con trabajo nuevo — si no, los diffs reales quedan invisibles dentro del ruido.

## Modelo de datos SRD 2024
- Bundle embebido curado (español) en `src/data/srd2024/*.ts`, agregado en `index.ts` como `BASE_SRD_BUNDLE`.
- Overlays JSON en `public/data/srd2024/*.json` (uno por colección: rules/conditions/spells/monsters/feats — **no existe `classes.json` ni `species.json` como overlay**), cargados en runtime por `srdService.ts` (`fetchSrdOverlays`) y fusionados por `id` sobre el bundle embebido (`mergeBundle`): el overlay solo agrega o pisa por id, nunca borra.
- Patrón de curación en curso (ver historial de commits "SRD ..."): se viene reemplazando contenido en inglés sin curar por versiones en español curadas, colección por colección. Ya completado: reglas, condiciones, dotes. **Pendiente:** monstruos (328 en overlay, solo 14 curados en el bundle embebido) y conjuros (269 curados + 124 sin curar en el overlay). **Especies: no hay ninguna entrada cargada** (0 en bundle y sin overlay) pese a que el README las lista como cubiertas.
- Contenido bajo licencia CC-BY-4.0 (SRD 5.2 de Wizards of the Coast) — mantener el aviso de atribución (`AttributionFooter.tsx`).
- Ingestión: `scripts/fetch-srd2024.mjs` y `scripts/srd-import-5etools.mjs`. Nunca sobrescriben contenido curado existente — respetar esa regla en cualquier script nuevo.

## Sincronización multijugador (Firebase)
- Realtime Database, nodo `sessions/{code}` (meta/settings/combat/players/responses). Config en `src/config/firebase.ts` (la apiKey de un proyecto web no es secreta; la seguridad depende de las Security Rules, que **no están versionadas en este repo** — viven solo en la consola de Firebase).
- No hay autenticación: cualquiera que tenga el código de sesión puede unirse. Es un diseño consciente para uso personal en mesa, no para producción/multi-tenant pública — tenerlo presente antes de "arreglarlo" sin que lo pida el usuario.
- Las sesiones no expiran ni se limpian automáticamente en la base.

## Convenciones observadas
- TypeScript estricto: 0 usos de `any`, 0 `console.log` en `src/` al momento de esta guía — mantenerlo así.
- Componentes/stores grandes a vigilar al tocarlos: `src/store/combatStore.ts` (~1200 líneas) y `src/components/combat/CombatMap.tsx` (~1050 líneas) — considerar dividir antes de agregar más responsabilidades ahí.
- Tests con Vitest cubren stores/utils (`src/__tests__`); no hay tests de componentes todavía.
- Mensajes de commit en español, descriptivos, estilo "Sección: qué cambia. Detalle." — seguir el mismo tono.
