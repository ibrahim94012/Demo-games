/* B.N.B push subscribe (index.html-e app.js-er pore load hobe)
   VAPID key Firebase Console > Project Settings > Cloud Messaging > Web Push certificates theke boshan */
(function () {
  "use strict";
  var VAPID_KEY = "BHg7c4T34Vy4LPZWzW7e_T-E1QMOGoy0BorxHNP2MwBQ1f3sgOZiF261pMSjvstEvMC8JTpW1Yd-vV0WHGtDv0Y";
  var SW_URL = "firebase-messaging-sw.js";
  var SW_SCOPE = "./fcm-push/";
  var DISMISS_KEY = "bnb_push_dismissed_at";
  var TOKEN_KEY = "bnb_push_token_at";
  var DAY = 86400000;

  if (!("serviceWorker" in navigator) || !("Notification" in window) || !("PushManager" in window)) {
    // iPhone Safari tab-e PushManager thake na: ekhane install-hint dekhabo
    if (!/iphone|ipad|ipod/i.test(navigator.userAgent)) return;
  }
  if (location.protocol !== "https:" && location.hostname !== "localhost") return;

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  function whenFirebaseReady(cb) {
    var n = 0;
    (function poll() {
      if (window.firebase && firebase.apps && firebase.apps.length && typeof db !== "undefined" && db) return cb();
      if (++n < 60) setTimeout(poll, 500);
    })();
  }

  function saveToken() {
    return loadScript("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js")
      .then(function () { return navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE }); })
      .then(function (reg) {
        return navigator.serviceWorker.ready.then(function () { return reg; });
      })
      .then(function (reg) {
        var messaging = firebase.messaging();
        // site khola obosthay push ashle ekhane dekhano hoy
        messaging.onMessage(function (p) {
          var d = p.data || {};
          reg.showNotification(d.title || "B.N.B", { body: d.body || "", icon: "fav.jpeg", data: { url: d.url || "./" } });
        });
        return messaging.getToken({ vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
      })
      .then(function (token) {
        if (!token) throw new Error("no token");
        return db.ref("fcmTokens/" + token).set({ t: Date.now(), p: isIOS ? "ios" : "web" })
          .then(function () { try { localStorage.setItem(TOKEN_KEY, String(Date.now())); } catch (e) {} });
      });
  }

  function injectStyle() {
    var st = document.createElement("style");
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

  var banner = null;
  function closeBanner() { if (banner) { banner.remove(); banner = null; } }
  function dismissForSession() {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch (e) {}
    closeBanner();
  }

  function showBanner(perm) {
    if (banner) return;
    var needsInstall = isIOS && !standalone;
    var html, hasYes = false;
    if (perm === "denied") {
      // আগে ব্লক/ডিনাই করা হয়েছে: ব্রাউজার আর নিজে থেকে প্রশ্ন করবে না, তাই ম্যানুয়ালি চালু করার নির্দেশ
      html = "<b>🔕 নোটিফিকেশন বন্ধ আছে</b>" +
        "<p>জরুরি রক্তের অনুরোধ ও আপডেট পেতে নোটিফিকেশন চালু করুন: ব্রাউজারের ঠিকানা বারের পাশে <b style='display:inline'>🔒 / ⚙️</b> আইকনে চাপুন → <b style='display:inline'>Notifications</b> → <b style='display:inline'>Allow</b>। তারপর পেজটি রিলোড করুন।</p>" +
        "<div class='row'><button class='no' type='button'>ঠিক আছে</button></div>";
    } else if (needsInstall) {
      html = "<b>🔔 জরুরি আপডেট পেতে চান?</b>" +
        "<p>আইফোনে নোটিফিকেশন পেতে Safari-র Share বাটনে চেপে <b style='display:inline'>“Add to Home Screen”</b> করুন, তারপর অ্যাপটি খুলে অনুমতি দিন।</p>" +
        "<div class='row'><button class='no' type='button'>পরে</button></div>";
    } else {
      hasYes = true;
      html = "<b>🔔 জরুরি আপডেট পেতে চান?</b>" +
        "<p>রক্তের জরুরি অনুরোধ ও নতুন আপডেট সরাসরি আপনার ফোনে নোটিফিকেশন হিসেবে পেতে অনুমতি দিন।</p>" +
        "<div class='row'><button class='no' type='button'>পরে</button><button class='yes' type='button'>চালু করুন</button></div>";
    }
    banner = document.createElement("div");
    banner.id = "pushBanner";
    banner.innerHTML = html;
    document.body.appendChild(banner);
    banner.querySelector(".no").onclick = dismissForSession;
    if (hasYes) {
      var yes = banner.querySelector(".yes");
      yes.onclick = function () {
        yes.disabled = true; yes.textContent = "অপেক্ষা করুন…";
        Notification.requestPermission().then(function (result) {
          if (result === "granted") return saveToken().then(closeBanner);
          closeBanner(); // ডিনাই করলে এখন বন্ধ; পরের ভিজিটে আবার পপআপ আসবে
        }).catch(function (e) { console.log("push setup failed:", e); closeBanner(); });
      };
    }
  }

  // ব্যবহারকারী ব্রাউজার সেটিং থেকে Allow করলে নিজে থেকেই সাবস্ক্রাইব হয়ে যাবে
  function watchPermission() {
    if (!navigator.permissions || !navigator.permissions.query) return;
    navigator.permissions.query({ name: "notifications" }).then(function (st) {
      st.onchange = function () {
        if (st.state === "granted") { closeBanner(); whenFirebaseReady(function () { saveToken().catch(function () {}); }); }
      };
    }).catch(function () {});
  }

  function init() {
    var perm = ("Notification" in window) ? Notification.permission : "default";

    // ✅ Allow করা থাকলে: আর কোনো পপআপ নয় (শুধু টোকেন ঠিক রাখা)
    if (perm === "granted") {
      var last = 0; try { last = parseInt(localStorage.getItem(TOKEN_KEY), 10) || 0; } catch (e) {}
      if (!last || Date.now() - last > 7 * DAY) whenFirebaseReady(function () { saveToken().catch(function () {}); });
      return;
    }

    // ❌ নতুন ভিজিটর (default) বা Deny করা (denied): প্রতিবার নতুন ভিজিটে পপআপ আসবে
    // শুধু একই সেশনে "পরে/ঠিক আছে" চাপলে ওই সেশনে আর দেখাবে না
    var dismissed = false; try { dismissed = sessionStorage.getItem(DISMISS_KEY) === "1"; } catch (e) {}
    if (dismissed) return;

    injectStyle();
    watchPermission();
    setTimeout(function () { showBanner(perm); }, 5000);
  }

  window.addEventListener("load", init);
})();
