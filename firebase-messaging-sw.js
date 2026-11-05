/* B.N.B push service worker.
   Firebase library chhara, shorashori Web Push handle kore, tai
   admin tab ba onno tab khola thakleo notification sob somoy dekhabe. */
const SITE_ROOT = new URL("./", self.location.href).href; // sw file jei folder-e (.../bnb/)

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

/* Icon khuje ber kore: prothome icon-192.png (chhoto, square PNG), na thakle fav.jpeg */
async function pickIcon(custom) {
  if (custom) return custom;
  for (const name of ["icon-192.png", "fav.jpeg"]) {
    try {
      const r = await fetch(SITE_ROOT + name, { method: "HEAD", cache: "no-cache" });
      if (r.ok) return SITE_ROOT + name;
    } catch (e) {}
  }
  return undefined;
}

self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) {
    payload = { data: { title: "B.N.B", body: event.data ? event.data.text() : "" } };
  }
  const d = Object.assign({}, payload.notification || {}, payload.data || {});
  const urgent = d.urgent === "1";

  event.waitUntil((async () => {
    const opts = {
      body: d.body || "",
      badge: SITE_ROOT + "badge.png",
      vibrate: urgent ? [300, 120, 300, 120, 600] : [200, 100, 200],
      requireInteraction: urgent,
      timestamp: Date.now(),
      tag: "bnb-" + Date.now(),
      renotify: true,
      actions: [{ action: "open", title: "দেখুন" }],
      data: { url: d.url || SITE_ROOT }
    };
    const icon = await pickIcon(d.icon);
    if (icon) opts.icon = icon;
    if (d.image) opts.image = d.image;
    await self.registration.showNotification((urgent ? "🆘 " : "") + (d.title || "B.N.B"), opts);
  })());
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
