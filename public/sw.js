// Service Worker - PWA 설치 프롬프트 활성화 목적
const CACHE_NAME = "dongnam-snack-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
