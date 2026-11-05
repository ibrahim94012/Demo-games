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
  const urgent = d.urgent === "1";
  const opts = {
    body: d.body || "",
    icon: d.icon || (SITE_ROOT + "fav.jpeg"),          // ডানদিকের বড় লোগো
    badge: SITE_ROOT + "badge.png",                    // স্ট্যাটাস বারের ছোট সাদা আইকন (ঐচ্ছিক ফাইল)
    vibrate: urgent ? [300, 120, 300, 120, 600] : [200, 100, 200],
    requireInteraction: urgent,                        // জরুরি হলে নিজে থেকে সরবে না
    timestamp: Date.now(),
    tag: "bnb-" + Date.now(),
    renotify: true,
    actions: [{ action: "open", title: "দেখুন" }],
    data: { url: d.url || SITE_ROOT }
  };
  if (d.image) opts.image = d.image;                   // নিচে বড় ছবি (ঐচ্ছিক)
  event.waitUntil(self.registration.showNotification((urgent ? "🆘 " : "") + (d.title || "B.N.B"), opts));
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
