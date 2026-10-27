const CACHE_PREFIX='lianhe-clinical-mobile-';
const CACHE_NAME=CACHE_PREFIX+'89016b1edd3e';
const APP_ROOT=new URL('./',self.location.href);
const INDEX=new URL('./index.html',APP_ROOT).href;
const ASSETS=['./index.html','./manifest.webmanifest','./icons/apple-touch-icon.png','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'].map(path=>new URL(path,APP_ROOT).href);
const ASSET_SET=new Set(ASSETS);
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));
  // Updates wait for existing sessions to close. Never reload a clinical record.
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==APP_ROOT.origin)return;
  const canonical=url.origin+url.pathname;
  const isEntry=canonical===INDEX||canonical===APP_ROOT.href;
  if(request.mode==='navigate'&&isEntry){
    event.respondWith(fetch(request).then(response=>{
      if(!response.ok)return caches.match(INDEX).then(cached=>cached||response);
      return caches.open(CACHE_NAME).then(cache=>cache.put(INDEX,response.clone())).then(()=>response);
    }).catch(()=>caches.match(INDEX)));
  }else if(ASSET_SET.has(canonical)){
    event.respondWith(caches.open(CACHE_NAME).then(cache=>cache.match(canonical)).then(cached=>cached||fetch(request)));
  }
});
