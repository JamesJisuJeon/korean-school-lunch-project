// Service Worker - 설치 프롬프트 활성화 목적 (캐싱 없음)
const CACHE_NAME = "dongnam-snack-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // 네트워크 요청을 그대로 통과 (캐싱 없음)
  event.respondWith(fetch(event.request));
});
