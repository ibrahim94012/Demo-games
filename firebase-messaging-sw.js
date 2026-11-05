/* B.N.B push notification service worker (GitHub: /bnb/firebase-messaging-sw.js)
   Alada scope-e register hoy, tai apnar ager service-worker.js-er sathe conflict hobe na. */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCH5oHFzuC6qbAjV7cgHWQopHtGA180jiU",
  authDomain: "blood-network-a851b.firebaseapp.com",
  projectId: "blood-network-a851b",
  messagingSenderId: "713058868424",
  appId: "1:713058868424:web:599441c954490ca5cb19fd"
});

const messaging = firebase.messaging();
const SITE_ROOT = new URL("../", self.location.href).href; // .../bnb/

/* Server data-only message pathay (title, body, url), ekhane notification dekhano hoy */
messaging.onBackgroundMessage(payload => {
  const d = payload.data || {};
  return self.registration.showNotification(d.title || "B.N.B", {
    body: d.body || "",
    icon: SITE_ROOT + "fav.jpeg",
    badge: SITE_ROOT + "fav.jpeg",
    data: { url: d.url || SITE_ROOT }
  });
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
