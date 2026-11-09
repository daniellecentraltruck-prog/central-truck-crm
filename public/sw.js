/* Central Truck CRM: cache somente dos recursos publicos do aplicativo.
   Nunca armazena respostas de autenticacao ou dados de clientes. */
const CACHE = 'central-truck-shell-v1';
const SCOPE = self.registration.scope;
const APP_URL = new URL('./', SCOPE).href;
const OFFLINE_ASSETS = [APP_URL, new URL('manifest.webmanifest', SCOPE).href, new URL('pwa-icon.svg', SCOPE).href];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(OFFLINE_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('central-truck-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(SCOPE).pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(APP_URL)));
    return;
  }
  if (!['script','style','image','font'].includes(request.destination)) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)));
    }
    return response;
  }).catch(() => caches.match(request)));
});
