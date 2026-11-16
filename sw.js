const C='tw-v6';
const SHELL=['./','index.html','app.js','office.js','bangla.js','typefx.js','insights.js','sync.js','manifest.webmanifest','icon-192.png','icon-512.png','vendor/purify.min.js','vendor/jszip.min.js','vendor/turndown.js','vendor/turndown-plugin-gfm.js','vendor/typo.js','vendor/supabase.js'];
const CACHEABLE=u=>u.origin===location.origin||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'||u.hostname==='cdn.jsdelivr.net';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||!CACHEABLE(u)||u.pathname.startsWith('/release/'))return; // never cache account/cloud traffic or the APK
  e.respondWith(fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cl=res.clone();caches.open(C).then(c=>c.put(r,cl))}return res})
    .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):undefined))))});
