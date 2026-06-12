// O dashboard deixou de usar cache offline para que o GitHub Pages sempre
// carregue exatamente a versão atual do branch main.
const VERSION = "20260612-1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then((clients) =>
        Promise.all(
          clients.map((client) => {
            const url = new URL(client.url);
            url.searchParams.set("v", VERSION);
            return client.navigate(url.href);
          }),
        ),
      ),
  );
});
