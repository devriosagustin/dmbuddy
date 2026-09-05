// ============================================================
// Service worker de DMBuddy — soporte offline básico (PWA).
//
// No usa ninguna herramienta de build (Workbox, vite-plugin-pwa, etc.):
// es JS plano porque los archivos de `public/` se copian tal cual al
// build, sin pasar por Vite, así que no hay forma de generarle en build
// time la lista de assets con hash (index-xxxxx.js) — en cambio, cachea
// "sobre la marcha" lo que el navegador va pidiendo (ver `fetch` abajo).
//
// Alcance: dos cachés versionadas.
//  - SHELL_CACHE: el puñado de archivos fijos (sin hash) que sabemos de
//    antemano — la portada de la SPA, el manifest, los íconos.
//  - RUNTIME_CACHE: todo lo demás del propio origen que se vaya pidiendo
//    (JS/CSS con hash de cada build, datos, fuentes locales).
//
// Firebase (sincronización en vivo DM↔jugadores) y cualquier request de
// otro origen (Google Fonts, etc.) NUNCA se interceptan: no tiene sentido
// cachear datos en tiempo real, y cachearlos mal podría mostrar un
// combate viejo como si fuera el actual.
// ============================================================

const SW_VERSION = 'v1';
const SHELL_CACHE = `dmbuddy-shell-${SW_VERSION}`;
const RUNTIME_CACHE = `dmbuddy-runtime-${SW_VERSION}`;
const CURRENT_CACHES = new Set([SHELL_CACHE, RUNTIME_CACHE]);

// Rutas relativas al scope del service worker (funciona igual en dev, en la
// raíz, o publicado bajo /dmbuddy/ como en GitHub Pages).
const SHELL_URLS = ['', 'favicon.svg', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'].map(
  (path) => new URL(path, self.registration.scope).toString()
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch(() => {
        // Sin conexión durante la instalación (o algún archivo falló): no
        // rompe el registro, la próxima visita online completa la caché.
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !CURRENT_CACHES.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Firebase, fuentes, etc.: directo a la red.

  // Navegación (abrir/recargar la SPA): red primero para tener siempre la
  // última versión posible, con la portada cacheada como respaldo offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(new URL(self.registration.scope).toString()))
    );
    return;
  }

  // Assets propios (JS/CSS de la build, íconos, datos SRD, fuentes locales):
  // stale-while-revalidate — responde de la caché al toque si existe (para
  // que ande sin red) y en paralelo pide la versión fresca para la próxima.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
