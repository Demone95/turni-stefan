const C='turni-321-v54',F=['./','index.html','style.css?v=54','script.js?v=54','auth.js','firebase-config.js','manifest.json','icon.svg','apple-touch-icon.png?v=49','icon-192.png?v=49','icon-512.png?v=49'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))])));
self.addEventListener('fetch',e=>e.respondWith(fetch(e.request).catch(()=>caches.match(e.request))));
