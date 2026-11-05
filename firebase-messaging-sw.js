/* B.N.B push service worker.
   Firebase library chhara, shorashori Web Push handle kore, tai
   admin tab ba onno tab khola thakleo notification sob somoy dekhabe. */
const SITE_ROOT = new URL("../", self.location.href).href; // .../bnb/

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) {
    payload = { data: { title: "B.N.B", body: event.data ? event.data.text() : "" } };
  }
  const d = Object.assign({}, payload.notification || {}, payload.data || {});
  const title = d.title || "B.N.B";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: d.body || "",
      icon: SITE_ROOT + "fav.jpeg",
      badge: SITE_ROOT + "fav.jpeg",
      tag: "bnb-" + Date.now(),
      data: { url: d.url || SITE_ROOT }
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || SITE_ROOT;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.indexOf(SITE_ROOT) === 0 && "focus" in c) { c.navigate(target); return c.focus(); }
      }
      return clients.openWindow(target);
    })
  );
});
