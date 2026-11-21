/* Fit Forward – service worker: ljuska aplikacije radi i bez signala + obavijesti na mobitelu.
 * Podaci (trening, prehrana, tracker) se NE spremaju ovdje – njih čita i šalje Apps Script kao i do sada. */
var CACHE = 'ff-shell-2', META = 'ff-meta';
var API0 = 'https://script.google.com/macros/s/AKfycbwENVDy1BtT1cpndEtN9jy5N1LJUTpEPMWoEyCtM06uad9bmzfgHVCo5QOO32gCrTM/exec';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-32.png'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE && k !== META; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
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

/* ---------- obavijesti: stiže prazan „ping”, tekst se pita Apps Script ---------- */
function apiUrl(){ return caches.open(META).then(function(c){ return c.match('api'); }).then(function(r){ return r ? r.text() : API0; }).catch(function(){ return API0; }); }
self.addEventListener('push', function(e){
  var show = function(m){ return self.registration.showNotification(m.t || 'Fit Forward', { body: m.b || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: 'ff', renotify: true, data: { url: './' } }); };
  e.waitUntil(Promise.all([self.registration.pushManager.getSubscription(), apiUrl()]).then(function(a){
    return fetch(a[1], { method: 'POST', body: JSON.stringify({ fn: 'pushMsg', args: [a[0] ? a[0].endpoint : ''] }) });
  }).then(function(r){ return r.json(); }).then(function(j){ return show((j && j.r) || {}); })
    .catch(function(){ return show({ t: 'Fit Forward', b: 'Otvori aplikaciju' }); }));
});
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cs){
    for (var i = 0; i < cs.length; i++) if ('focus' in cs[i]) return cs[i].focus();
    return self.clients.openWindow('./');
  }));
});
