// 앱은 폰에 저장된 버전으로 바로 열고, GitHub에서는 설치·업데이트만 받아옵니다.
// 사이트가 없어지거나 오프라인이어도 설치된 앱은 계속 열려요.
// 파일을 수정해 배포할 때는 CACHE 이름의 버전을 올려주세요.
const CACHE = 'pt-log-v5';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// 저장된 버전이 있으면 네트워크를 기다리지 않고 바로 열고,
// 뒤에서 새 버전을 받아 둡니다(다음 실행 때 적용). 정상 응답(200)일 때만 저장해서
// 사이트가 사라져 404가 나도 저장된 버전은 그대로 남아요.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const update = fetch(e.request).then(async res => {
      if (res.status === 200) await cache.put(e.request, res.clone());
      return res;
    });
    if (cached){
      e.waitUntil(update.catch(() => {}));
      return cached;
    }
    try { return await update; }
    catch { return (await cache.match('./index.html')) || Response.error(); }
  })());
});
