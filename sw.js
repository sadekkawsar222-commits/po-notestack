const C='tw-v20';
const SHELL=['./','index.html','app.js','office.js','bangla.js','typefx.js','insights.js','game.js','grammar.js','sync.js','manifest.webmanifest','icon-192.png','icon-512.png','vendor/purify.min.js','vendor/jszip.min.js','vendor/turndown.js','vendor/turndown-plugin-gfm.js','vendor/typo.js','vendor/supabase.js'];
const CACHEABLE=u=>u.origin===location.origin||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'||u.hostname==='cdn.jsdelivr.net';
const EXTRA=['https://cdn.jsdelivr.net/npm/dictionary-en@4.0.0/index.aff','https://cdn.jsdelivr.net/npm/dictionary-en@4.0.0/index.dic','https://cdn.jsdelivr.net/gh/LibreOffice/dictionaries@master/bn_BD/bn_BD.dic'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL).then(()=>Promise.all(EXTRA.map(u=>c.add(u).catch(()=>{}))))).catch(()=>{}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||!CACHEABLE(u)||u.pathname.startsWith('/release/'))return; // never cache account/cloud traffic or the APK
  const net=()=>fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cl=res.clone();caches.open(C).then(c=>c.put(r,cl))}return res});
  const cached=()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):undefined));
  if(u.hostname==='cdn.jsdelivr.net'||u.hostname==='fonts.gstatic.com'){e.respondWith(cached().then(m=>m||net()));return}
  e.respondWith(new Promise(res=>{let done=false;const t=setTimeout(()=>cached().then(m=>{if(m&&!done){done=true;res(m)}}),4000);
    net().then(x=>{clearTimeout(t);if(!done){done=true;res(x)}}).catch(()=>{clearTimeout(t);cached().then(m=>{if(!done){done=true;res(m||Response.error())}})})}))});
