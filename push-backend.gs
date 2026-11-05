/**
 * B.N.B Push Sender (Google Apps Script — free, card lagbe na)
 * Deploy: Extensions > Apps Script > Deploy > New deployment > Web app
 *         Execute as: Me | Who has access: Anyone
 *
 * Script Properties (Project Settings > Script properties) e boshan:
 *   SERVICE_ACCOUNT_JSON = Firebase service account-er pura JSON (GOPON, kothao share korben na)
 *   ADMIN_EMAILS         = admin1@gmail.com,admin2@gmail.com   (apnar Firebase Auth admin email)
 */
var PROJECT_ID = "blood-network-a851b";
var DB_URL = "https://blood-network-a851b-default-rtdb.asia-southeast1.firebasedatabase.app";
var WEB_API_KEY = "AIzaSyCH5oHFzuC6qbAjV7cgHWQopHtGA180jiU"; // public web key

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);
    var v = verifyAdmin_(req.idToken);
    if (!v.email) return json_({ ok: false, error: "unauthorized", reason: v.err });

    var title = String(req.title || "").slice(0, 80);
    var body = String(req.body || "").slice(0, 240);
    var url = String(req.url || "").slice(0, 300);
    var image = String(req.image || "").slice(0, 500);
    var urgent = req.urgent ? "1" : "0";
    if (!title || !body) return json_({ ok: false, error: "title/body dorkar" });

    var access = getAccessToken_();
    var tokensObj = fetchJson_(DB_URL + "/fcmTokens.json?shallow=true&access_token=" + access) || {};
    var tokens = Object.keys(tokensObj);
    if (!tokens.length) return json_({ ok: true, sent: 0, removed: 0 });

    var sent = 0, removed = 0;
    for (var i = 0; i < tokens.length; i += 100) {
      var chunk = tokens.slice(i, i + 100);
      var reqs = chunk.map(function (t) {
        return {
          url: "https://fcm.googleapis.com/v1/projects/" + PROJECT_ID + "/messages:send",
          method: "post", contentType: "application/json", muteHttpExceptions: true,
          headers: { Authorization: "Bearer " + access },
          payload: JSON.stringify({ message: { token: t, data: { title: title, body: body, url: url, image: image, urgent: urgent },
            webpush: { headers: { Urgency: "high", TTL: "86400" } } } })
        };
      });
      var resps = UrlFetchApp.fetchAll(reqs);
      resps.forEach(function (r, idx) {
        var code = r.getResponseCode();
        if (code === 200) sent++;
        else if (code === 404 || code === 400 && /UNREGISTERED|INVALID_ARGUMENT/.test(r.getContentText())) {
          // mrito token muche felo
          UrlFetchApp.fetch(DB_URL + "/fcmTokens/" + encodeURIComponent(chunk[idx]) + ".json?access_token=" + access,
            { method: "delete", muteHttpExceptions: true });
          removed++;
        }
      });
    }
    return json_({ ok: true, sent: sent, removed: removed });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/* Admin ID token verify + ADMIN_EMAILS allowlist. Karon sposhto bhabe return kore. */
function verifyAdmin_(idToken) {
  if (!idToken) return { err: "idToken pathano hoyni (admin login ache to?)" };
  var payload = JSON.stringify({ idToken: idToken });
  var r = UrlFetchApp.fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + WEB_API_KEY, {
    method: "post", contentType: "application/json", muteHttpExceptions: true, payload: payload
  });
  if (r.getResponseCode() !== 200) {
    // API key restricted thakle service account diye abar chesta
    r = UrlFetchApp.fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup", {
      method: "post", contentType: "application/json", muteHttpExceptions: true, payload: payload,
      headers: { Authorization: "Bearer " + getAccessToken_() }
    });
  }
  if (r.getResponseCode() !== 200)
    return { err: "token verify hoyni (" + r.getResponseCode() + "): " + r.getContentText().slice(0, 160) };
  var u = (JSON.parse(r.getContentText()).users || [])[0];
  if (!u || !u.email) return { err: "token-e email paoa jayni" };
  var raw = PropertiesService.getScriptProperties().getProperty("ADMIN_EMAILS") || "";
  var allowed = raw.toLowerCase().split(",").map(function (s) { return s.trim(); }).filter(String);
  if (!allowed.length) return { err: "Script Properties-e ADMIN_EMAILS set kora nei" };
  if (allowed.indexOf(u.email.toLowerCase()) < 0)
    return { err: "login email (" + u.email + ") ADMIN_EMAILS-e nei. ADMIN_EMAILS-e eta boshan." };
  return { email: u.email };
}

/* Service account diye OAuth access token (FCM + Realtime DB) */
function getAccessToken_() {
  var cache = CacheService.getScriptCache();
  var hit = cache.get("sa_token_v2");
  if (hit) return hit;
  var sa = JSON.parse(PropertiesService.getScriptProperties().getProperty("SERVICE_ACCOUNT_JSON"));
  var now = Math.floor(Date.now() / 1000);
  var header = b64u_(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  var claim = b64u_(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600
  }));
  var sig = Utilities.base64EncodeWebSafe(Utilities.computeRsaSha256Signature(header + "." + claim, sa.private_key)).replace(/=+$/, "");
  var res = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post", payload: { grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: header + "." + claim + "." + sig }
  });
  var tok = JSON.parse(res.getContentText()).access_token;
  cache.put("sa_token_v2", tok, 3000);
  return tok;
}
function b64u_(s) { return Utilities.base64EncodeWebSafe(s).replace(/=+$/, ""); }
function fetchJson_(u) { return JSON.parse(UrlFetchApp.fetch(u, { muteHttpExceptions: true }).getContentText()); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
