/* Ink Donkey — visitor statistics (Google Analytics 4), loaded only after the visitor agrees.
   Tracks: page views (automatic), photos opened in the viewer, gallery filters,
   WhatsApp / phone / Waze / Instagram clicks, flash "claim" clicks, language switch.
   No names or contact details are collected. */
(function () {
  var GA_ID = "G-XXXXXXXXXX"; // Google Analytics measurement ID
  var KEY = "id-consent";      // "yes" | "no", remembered per browser

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function remember(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var ready = false; // nothing is sent until the visitor agrees
  function track(name, params) {
    if (ready && window.gtag) window.gtag("event", name, params || {});
  }

  function startGA() {
    if (ready || !/^G-[A-Z0-9]+$/.test(GA_ID) || GA_ID === "G-XXXXXXXXXX") return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
    ready = true;
  }

  // ---- what people do on the site ----
  function photoName(src) { return (src || "").split("/").pop().replace(/\.\w+$/, ""); }
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a, button");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var where = a.closest(".wa-float") ? "floating" : a.closest("footer") ? "footer" : a.closest(".card") ? "flash" : "page";
    if (/wa\.link|wa\.me|whatsapp/i.test(href)) {
      if (a.closest(".card")) {
        var h = a.closest(".card").querySelector("h3");
        track("flash_claim", { design: h ? h.textContent.trim() : "" });
      }
      track("whatsapp_click", { placement: where });
    }
    else if (href.indexOf("tel:") === 0) track("phone_click", { placement: where });
    else if (/waze\.com/.test(href)) track("waze_click", { placement: where });
    else if (/google\.com\/maps/.test(href)) track("maps_click", { placement: where });
    else if (/instagram\.com/.test(href)) track("instagram_click", { account: href.replace(/.*instagram\.com\/([^/?]+).*/, "@$1") });
    else if (a.matches(".filters button")) track("gallery_filter", { filter: a.dataset.f || "" });
    else if (a.matches(".lang button")) track("language_switch", { language: a.dataset.lang || "" });
    else if (a.id === "more") track("gallery_show_all");
  }, true);

  // every photo shown in the large viewer (tap, swipe or arrows)
  var lbImg = document.getElementById("lb-img");
  if (lbImg && "MutationObserver" in window) {
    var last = "";
    new MutationObserver(function () {
      var name = photoName(lbImg.getAttribute("src"));
      if (name && name !== last) { last = name; track("photo_view", { photo: name }); }
    }).observe(lbImg, { attributes: true, attributeFilter: ["src"] });
  }

  // ---- consent banner ----
  var he = (document.documentElement.lang || "").indexOf("he") === 0;
  var T = he
    ? { text: "אנחנו משתמשים בעוגיות לסטטיסטיקה אנונימית, כדי לשפר את האתר.", ok: "אישור", no: "לא, תודה" }
    : { text: "We use cookies for anonymous statistics to improve the site.", ok: "OK", no: "No thanks" };

  function banner() {
    var css = document.createElement("style");
    css.textContent =
      ".cc{position:fixed;z-index:60;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));max-width:560px;margin-inline:auto;" +
      "display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;padding:14px 16px;background:#111819;color:#eef3f2;" +
      "border:1px solid #24312f;box-shadow:0 16px 40px -16px rgba(0,0,0,.9);font:14px/1.5 Rubik,system-ui,sans-serif}" +
      ".cc p{margin:0;flex:1 1 240px}.cc div{display:flex;gap:8px}" +
      ".cc button{font:600 14px Rubik,system-ui,sans-serif;padding:8px 16px;border-radius:4px;cursor:pointer;border:1px solid #24312f;background:transparent;color:#94a6a4}" +
      ".cc button.ok{background:#12736e;border-color:#12736e;color:#fff}.cc button:hover{filter:brightness(1.15)}";
    document.head.appendChild(css);
    var box = document.createElement("div");
    box.className = "cc";
    box.setAttribute("role", "region");
    box.setAttribute("aria-label", he ? "עוגיות" : "Cookies");
    if (he) box.dir = "rtl";
    box.innerHTML = '<p></p><div><button type="button" class="ok"></button><button type="button" class="no"></button></div>';
    box.querySelector("p").textContent = T.text;
    box.querySelector(".ok").textContent = T.ok;
    box.querySelector(".no").textContent = T.no;
    box.querySelector(".ok").onclick = function () { remember("yes"); box.remove(); startGA(); };
    box.querySelector(".no").onclick = function () { remember("no"); box.remove(); };
    document.body.appendChild(box);
  }

  var c = stored();
  if (c === "yes") startGA();
  else if (c !== "no") banner();
})();
