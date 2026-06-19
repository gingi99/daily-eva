self.addEventListener("install", event => {
  console.log("Daily Eva installata");
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});