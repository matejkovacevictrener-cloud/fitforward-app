/* Fit Forward – service worker: ljuska aplikacije radi i bez signala.
 * Podaci (trening, prehrana, tracker) se NE spremaju ovdje – njih čita i šalje Apps Script kao i do sada. */
var CACHE = 'ff-shell-1';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-32.png'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
self.addEventListener('fetch', function(e){
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;            // Apps Script i fontovi idu ravno na internet
  if (req.mode === 'navigate') {                                                    // stranica: prvo internet (nova verzija), bez signala spremljena
    e.respondWith(fetch(req).then(function(r){ var c = r.clone(); caches.open(CACHE).then(function(x){ x.put('index.html', c); }); return r; })
      .catch(function(){ return caches.match('index.html'); }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function(hit){ return hit || fetch(req); }));
});
