/* admin.html-er </body>-er age: <script src="admin-push.js"></script>
   Admin "নোটিফিকেশন" panel theke push pathay (Apps Script backend-e) */
(function () {
  var PUSH_API_URL = "https://script.google.com/macros/s/AKfycbyDst04VWdWcUTZ8ILoJYU06movmDWozWac9P2D1kOc-zqaeABdrXrZCKnrgRslfaa75g/exec"; // push-backend.gs deploy korar pore paoa URL
  var btn = document.getElementById("pushSendBtn");
  if (!btn) return;
  var T = document.getElementById("pushTitle"), B = document.getElementById("pushBody"),
      L = document.getElementById("pushLink"), S = document.getElementById("pushStatus");

  btn.addEventListener("click", function () {
    var title = T.value.trim(), body = B.value.trim(), link = L.value.trim();
    if (!title || !body) { S.textContent = "শিরোনাম ও বার্তা দুটোই লিখুন।"; return; }
    if (PUSH_API_URL.indexOf("PASTE_") === 0) { S.textContent = "PUSH_API_URL বসানো হয়নি।"; return; }
    if (!confirm("সব সাবস্ক্রাইবারকে নোটিফিকেশন পাঠাবেন?")) return;
    btn.disabled = true; S.textContent = "পাঠানো হচ্ছে…";
    auth.currentUser.getIdToken().then(function (idToken) {
      return fetch(PUSH_API_URL, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ idToken: idToken, title: title, body: body, url: link })
      });
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d.ok) {
        S.textContent = "✓ " + d.sent + " জনকে পাঠানো হয়েছে" + (d.removed ? " (" + d.removed + " টি অকার্যকর ডিভাইস বাদ)" : "");
        T.value = ""; B.value = ""; L.value = "";
        if (typeof showToast === "function") showToast("নোটিফিকেশন পাঠানো হয়েছে");
      } else {
        S.textContent = "ব্যর্থ: " + (d.error === "unauthorized" ? "আপনি অনুমোদিত অ্যাডমিন নন" : d.error);
      }
    }).catch(function (e) { S.textContent = "ত্রুটি: " + e.message; })
      .then(function () { btn.disabled = false; });
  });
})();
