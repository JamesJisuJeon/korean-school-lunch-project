// Service Worker - PWA 설치 프롬프트 활성화 목적
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // GET 요청만 처리, 나머지는 브라우저 기본 동작에 위임
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request));
});
