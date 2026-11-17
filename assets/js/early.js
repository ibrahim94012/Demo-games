/* Runs before first paint (was an inline <script> in index.html — moved here so the CSP can forbid inline scripts). */
(function () {
  // 0) পুরনো # লিংক (ourbnb.org/#news/ID, #process …) নতুন URL-এ পাঠায় — আগে শেয়ার করা লিংক যেন কাজ করে
  try {
    var hash = (location.hash || "").replace(/^#/, "");
    if (hash) {
      var legacy = { "process": "/how-it-works/", "blood-group": "/blood-group-chart/", "donations": "/donations/",
                     "news": "/news/", "hospitals": "/hospitals/", "gallery": "/gallery/" };
      var to = "";
      if (legacy[hash]) to = legacy[hash];
      else if (hash.indexOf("news/") === 0 && hash.length > 5) to = "/news/?post=" + hash.slice(5);   // id আগে থেকেই encode করা
      if (to) { location.replace(to); return; }
    }
  } catch (e) {}

  // 0b) সংবাদের বিস্তারিত পেজে (/news/?post=…) তালিকা এক ঝলকও দেখানো হয় না
  try {
    if (location.pathname.replace(/\/+$/, "") === "/news" && /[?&]post=[^&]/.test(location.search)) {
      document.documentElement.classList.add("newsDetailMode");
    }
  } catch (e) {}

  // 1) first visit with no local cache -> show skeleton placeholders
  try { if (!localStorage.getItem("blood_donor_landing_cache")) document.documentElement.classList.add("skelMode"); }
  catch (e) { document.documentElement.classList.add("skelMode"); }

  // 2) clickjacking protection (static hosts like GitHub Pages can't send X-Frame-Options)
  try {
    if (window.top !== window.self) {
      try { window.top.location = window.self.location.href; }
      catch (e) { document.documentElement.style.display = "none"; }
    }
  } catch (e) { document.documentElement.style.display = "none"; }
})();
