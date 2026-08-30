// 캐싱 없는 빈 서비스 워커.
// 오직 안드로이드 크롬/삼성인터넷이 이 사이트를 "설치 가능한 PWA"로 인식하게 하려는
// 목적만 있고, 실제로 아무것도 캐싱하지 않는다 (GitHub Pages 캐시 이슈 회피).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
