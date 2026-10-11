/**
 * service-worker.js — Fase 4
 * Tres estrategias distintas según qué se pide, tal como se definió en la
 * spec: shell cache-first (carga instantánea), datos stale-while-revalidate
 * (se puede actualizar el árbol de una obra sin reinstalar la app), y
 * videos cache-first con guardado oportunista (lo que Preload ya descarga
 * en Fase 3, el Service Worker lo intercepta y lo deja disponible offline).
 *
 * Nota de escala: con una sola obra pequeña (~9no Inning, unos pocos MB),
 * cachear todo lo que se pida es razonable. Cuando el catálogo crezca,
 * el punto a revisar es SOLO este archivo — reemplazar el cache-first
 * ilimitado de /videos/ por el LRU con límite de tamaño que ya quedó
 * anotado en la spec v2 (sección 6), sin tocar el resto de la app.
 */

const CACHE_VERSION = 'kine-catalogo-v1.0.0';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const VIDEO_CACHE = `${CACHE_VERSION}-video`;

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/player.js',
  './js/navigation.js',
  './js/tracker.js',
  './js/preload.js',
  './js/analytics.js',
  './icons/kine-192.png',
  './icons/kine-512.png',
  './icons/kine-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) => Promise.all(
      nombres
        .filter((n) => n.startsWith('kine-') && !n.startsWith(CACHE_VERSION))
        .map((n) => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Fuera de nuestro origen (p.ej. Google Fonts): que lo maneje el navegador,
  // no intentamos meternos con respuestas opacas de otro dominio.
  if (url.origin !== self.location.origin) return;
  if (req.method !== 'GET') return;

  if (url.pathname.includes('/videos/')) {
    event.respondWith(cacheFirst(req, VIDEO_CACHE));
  } else if (url.pathname.includes('/data/')) {
    event.respondWith(staleWhileRevalidate(req, DATA_CACHE));
  } else {
    event.respondWith(cacheFirst(req, SHELL_CACHE));
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cacheada = await cache.match(req);
  if (cacheada) return cacheada;

  try {
    const red = await fetch(req);
    if (red.ok) cache.put(req, red.clone());
    return red;
  } catch (err) {
    // sin caché y sin red: no hay nada que devolver para este recurso.
    throw err;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cacheada = await cache.match(req);

  const actualizacion = fetch(req).then((red) => {
    if (red.ok) cache.put(req, red.clone());
    return red;
  }).catch(() => null);

  // Si hay copia en caché, se sirve de inmediato y la red actualiza en segundo plano.
  // Si no hay copia (primera visita), se espera la red.
  return cacheada || (await actualizacion) || Response.error();
}
