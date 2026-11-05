/* B.N.B push subscribe (v4)
   VAPID key: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates */
(function () {
  "use strict";
  var PUSH_VERSION = "v5";
  var VAPID_KEY = "BHg7c4T34Vy4LPZWzW7e_T-E1QMOGoy0BorxHNP2MwBQ1f3sgOZiF261pMSjvstEvMC8JTpW1Yd-vV0WHGtDv0Y";
  var SW_URL = "firebase-messaging-sw.js";
  var SW_SCOPE = "./fcm-push/";
  var DISMISS_KEY = "bnb_push_dismissed";
  var TOKEN_KEY = "bnb_push_token_at";
  var DAY = 86400000;

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  var hasPush = ("serviceWorker" in navigator) && ("Notification" in window) && ("PushManager" in window);

  var isMobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  var supported = hasPush || isIOS;
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = function () { rej(new Error("script load hoyni: " + src)); };
      document.head.appendChild(s);
    });
  }
  function whenFirebaseReady(cb) {
    var n = 0;
    (function poll() {
      if (window.firebase && firebase.apps && firebase.apps.length && typeof db !== "undefined" && db) return cb();
      if (++n < 60) setTimeout(poll, 500);
    })();
  }
  function step(name, ms, p) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error("[" + name + "] " + (ms / 1000) + " sec-e response ashe ni")); }, ms);
      Promise.resolve(p).then(function (v) { clearTimeout(t); resolve(v); },
        function (e) { clearTimeout(t); reject(new Error("[" + name + "] " + ((e && (e.code ? e.code + " - " : "") + (e.message || e)) || "error"))); });
    });
  }
  function waitActive(reg) {
    return new Promise(function (resolve, reject) {
      var n = 0;
      (function poll() {
        if (reg.active && reg.active.state === "activated") return resolve(reg);
        var w = reg.installing || reg.waiting;
        if (w && w.state === "redundant") return reject(new Error("firebase-messaging-sw.js load hoyni (file-e error ba upload hoyni)"));
        if (++n > 100) return reject(new Error("service worker activate hoyni, state=" + (w ? w.state : "none")));
        setTimeout(poll, 150);
      })();
    });
  }

  function saveToken() {
    if (VAPID_KEY.indexOf("PASTE_") === 0) return Promise.reject(new Error("VAPID key push.js-e boshano hoyni"));
    var reg0;
    return step("1 messaging library", 15000, loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js"))
      .then(function () { return step("2 support check", 5000, firebase.messaging.isSupported ? firebase.messaging.isSupported() : true); })
      .then(function (ok) { if (!ok) throw new Error("ei browser push support kore na"); })
      .then(function () { return step("3 service worker register", 15000, navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE })); })
      .then(function (reg) { reg0 = reg; reg.update().catch(function () {}); return step("4 service worker activate", 15000, waitActive(reg)); })
      .then(function () {
        return step("5 FCM token", 25000, firebase.messaging().getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: reg0 }));
      })
      .then(function (token) {
        if (!token) throw new Error("[5] FCM token paoa jayni");
        return step("6 database write", 15000, db.ref("fcmTokens/" + token).set({ t: Date.now(), p: isIOS ? "ios" : "web" }));
      })
      .then(function () {
        console.log("PUSH: fcmTokens-e save hoyeche");
        try { localStorage.setItem(TOKEN_KEY, String(Date.now())); } catch (e) {}
      });
  }

  /* ---------- UI ---------- */
  var banner = null;
  function injectStyle() {
    if (document.getElementById("pushStyle")) return;
    var st = document.createElement("style"); st.id = "pushStyle";
    st.textContent =
      "#pushBanner{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9999;" +
      "max-width:440px;margin:0 auto;background:#fff;color:#2a1c18;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.25);" +
      "padding:16px;font-family:'Noto Sans Bengali',Inter,sans-serif;border-top:4px solid #9E1B32}" +
      "#pushBanner p{margin:0 0 12px;font-size:14px;line-height:1.55}#pushBanner b{display:block;font-size:15px;margin-bottom:4px}" +
      "#pushBanner .row{display:flex;gap:8px;justify-content:flex-end}" +
      "#pushBanner button{border:0;border-radius:10px;padding:9px 16px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit}" +
      "#pushBanner .yes{background:#9E1B32;color:#fff}#pushBanner .no{background:#f1e9e4;color:#5b4a43}";
    document.head.appendChild(st);
  }
  function closeBanner() { if (banner) { banner.remove(); banner = null; } }
  function dismissForSession() { try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch (e) {} closeBanner(); }
  function makeBanner(html) {
    injectStyle(); closeBanner();
    banner = document.createElement("div"); banner.id = "pushBanner"; banner.innerHTML = html;
    document.body.appendChild(banner);
    var no = banner.querySelector(".no"); if (no) no.onclick = dismissForSession;
    return banner;
  }
  function showError(e) {
    console.error("PUSH ERROR:", e);
    var msg = (e && (e.code ? e.code + " - " : "") + (e.message || e)) || "unknown";
    makeBanner("<b>⚠️ নোটিফিকেশন চালু করা যায়নি</b><p style='word-break:break-word;font-size:12.5px;color:#9E1B32'>" +
      String(msg).replace(/</g, "&lt;") + " <i style='color:#999'>(push " + PUSH_VERSION + ")</i></p>" +
      "<div class='row'><button class='no' type='button'>বন্ধ করুন</button></div>");
  }
  function showDenied() {
    makeBanner("<b>🔕 নোটিফিকেশন বন্ধ আছে</b>" +
      "<p>জরুরি রক্তের অনুরোধ ও আপডেট পেতে চালু করুন: ঠিকানা বারের পাশে <b style='display:inline'>🔒 / ⚙️</b> আইকনে চাপুন → <b style='display:inline'>Notifications</b> → <b style='display:inline'>Allow</b>। তারপর পেজ রিলোড করুন।</p>" +
      "<div class='row'><button class='no' type='button'>ঠিক আছে</button></div>");
  }
  function showIOSInstall() {
    makeBanner("<b>🔔 জরুরি আপডেট পেতে চান?</b>" +
      "<p>আইফোনে নোটিফিকেশন পেতে Safari-র Share বাটনে চেপে <b style='display:inline'>“Add to Home Screen”</b> করুন, তারপর অ্যাপটি খুলে অনুমতি দিন।</p>" +
      "<div class='row'><button class='no' type='button'>পরে</button></div>");
  }
  function showMobileAsk() {
    var b = makeBanner("<b>🔔 জরুরি আপডেট পেতে চান?</b>" +
      "<p>রক্তের জরুরি অনুরোধ ও নতুন আপডেট সরাসরি ফোনে পেতে নিচের বাটনে চাপুন, তারপর <b style='display:inline'>Allow</b> দিন।</p>" +
      "<div class='row'><button class='no' type='button'>পরে</button><button class='yes' type='button'>চালু করুন</button></div>");
    b.querySelector(".yes").onclick = function () { askNative(); }; // ফোনে বাটন-ট্যাপ ছাড়া Chrome পারমিশন বক্স দেখায় না
  }
  function showUnsupported() {
    makeBanner("<b>🔕 এই ব্রাউজারে নোটিফিকেশন চলবে না</b>" +
      "<p>নোটিফিকেশন পেতে সাইটটি <b style='display:inline'>Chrome</b> ব্রাউজারে খুলুন (Facebook/Messenger-এর ভেতরের ব্রাউজারে সাপোর্ট নেই)।</p>" +
      "<div class='row'><button class='no' type='button'>ঠিক আছে</button></div>");
  }
  function showDebug(perm) {
    makeBanner("<b>🛠 Push debug (" + PUSH_VERSION + ")</b><p style='font-size:12.5px;word-break:break-word'>" +
      "permission: " + perm + "<br>PushManager: " + hasPush + "<br>iOS: " + isIOS + " | installed app: " + standalone +
      "<br>mobile: " + isMobile + "<br>VAPID: " + (VAPID_KEY.indexOf("PASTE_") === 0 ? "BOSHANO NEI" : "OK") + "</p>" +
      "<div class='row'><button class='no' type='button'>বন্ধ</button></div>");
  }

  function showIOSAsk() {
    var b = makeBanner("<b>🔔 জরুরি আপডেট পেতে চান?</b><p>নোটিফিকেশন চালু করতে নিচের বাটনে চাপুন।</p>" +
      "<div class='row'><button class='no' type='button'>পরে</button><button class='yes' type='button'>চালু করুন</button></div>");
    b.querySelector(".yes").onclick = function () { askNative(); }; // iOS-e user tap dorkar
  }

  /* ব্রাউজারের নিজস্ব Allow/Block বক্স সরাসরি দেখায় */
  function askNative() {
    return Notification.requestPermission().then(function (result) {
      closeBanner();
      if (result === "granted") return saveToken().catch(showError);
    }).catch(showError);
  }

  function watchPermission() {
    if (!navigator.permissions || !navigator.permissions.query) return;
    navigator.permissions.query({ name: "notifications" }).then(function (st) {
      st.onchange = function () {
        if (st.state === "granted") { closeBanner(); whenFirebaseReady(function () { saveToken().catch(showError); }); }
      };
    }).catch(function () {});
  }

  function init() {
    var perm = ("Notification" in window) ? Notification.permission : "default";

    if (/pushdebug/.test(location.search + location.hash)) return showDebug(perm); // সাইটের ঠিকানার শেষে ?pushdebug দিলে অবস্থা দেখায়

    if (!supported) {
      var d0 = false; try { d0 = sessionStorage.getItem(DISMISS_KEY) === "1"; } catch (e) {}
      if (!d0) setTimeout(showUnsupported, 2500);
      return;
    }

    // ✅ Allow করা: আর পপআপ নেই। শুধু SW আপডেট ও token ঠিক রাখা
    if (perm === "granted") {
      navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE }).then(function (r) { r.update().catch(function () {}); }).catch(function () {});
      var last = 0; try { last = parseInt(localStorage.getItem(TOKEN_KEY), 10) || 0; } catch (e) {}
      if (!last || Date.now() - last > 7 * DAY) whenFirebaseReady(function () { saveToken().catch(showError); });
      return;
    }

    var dismissed = false; try { dismissed = sessionStorage.getItem(DISMISS_KEY) === "1"; } catch (e) {}
    if (dismissed) return;

    watchPermission();
    setTimeout(function () {
      if (perm === "denied") return showDenied();          // ❌ Deny করা: প্রতি নতুন ভিজিটে নির্দেশ
      if (isIOS && !standalone) return showIOSInstall();   // iPhone Safari ট্যাব
      if (isIOS) return showIOSAsk();                      // iPhone অ্যাপ
      if (isMobile) return showMobileAsk();                // Android: বাটনে ট্যাপ করলে ব্রাউজারের Allow বক্স
      askNative();                                         // কম্পিউটার: সরাসরি ডিফল্ট পারমিশন বক্স
    }, 2000);
  }

  window.addEventListener("load", init);
})();
