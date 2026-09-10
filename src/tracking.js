/**
 * Tracking de referência — dataLayer-only, sem endpoint próprio.
 * Veja SKILL.md nesta pasta antes de alterar qualquer coisa aqui.
 */
(function () {
  window.dataLayer = window.dataLayer || [];

  var SESSION_KEYS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  ];
  var CLICK_ID_KEYS = ["gclid", "fbclid"];

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getOrCreate(storage, key) {
    try {
      var value = storage.getItem(key);
      if (!value) {
        value = uuid();
        storage.setItem(key, value);
      }
      return value;
    } catch (e) {
      return uuid();
    }
  }

  var anonId = getOrCreate(window.localStorage, "anon_id");
  var sessionId = getOrCreate(window.sessionStorage, "session_id");

  function storageGet(storage, key) {
    try { return storage.getItem(key); } catch (e) { return null; }
  }

  function storageSet(storage, key, value) {
    try { storage.setItem(key, value); } catch (e) {}
  }

  // Janela típica do cookie _fbc / _gcl_aw (Meta e Google Ads).
  var ATTRIBUTION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

  function readTimed(key) {
    var raw = storageGet(window.localStorage, key);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.v && parsed.t && Date.now() - parsed.t < ATTRIBUTION_TTL_MS) {
        return parsed;
      }
    } catch (e) {
      // valor antigo (string pura) — trata como criado agora, uma vez
      if (typeof raw === "string" && raw.indexOf("fb.1.") === 0) {
        return { v: raw, t: Date.now() };
      }
    }
    try { window.localStorage.removeItem(key); } catch (err) {}
    return null;
  }

  function writeTimed(key, value, createdAt) {
    storageSet(
      window.localStorage,
      key,
      JSON.stringify({ v: value, t: createdAt || Date.now() })
    );
  }

  // Meta _fbc: fb.1.{timestamp_ms}.{fbclid}
  // Mesmo fbclid: conserva timestamp. fbclid NOVO (outro anúncio): last-click,
  // fbc novo com timestamp de agora — spec Store ClickID da Meta.
  function fbcFromFbclid(fbclid, existing) {
    if (existing && existing.v && existing.v.split(".").pop() === fbclid) {
      return existing;
    }
    var now = Date.now();
    return { v: "fb.1." + now + "." + fbclid, t: now };
  }

  function fbpEnsure(existing) {
    if (existing && existing.v && existing.v.indexOf("fb.1.") === 0) return existing;
    var now = Date.now();
    var rand = String(Math.floor(1000000000 + Math.random() * 9000000000));
    return { v: "fb.1." + now + "." + rand, t: now };
  }

  function getAttribution() {
    var params = new URLSearchParams(window.location.search);
    var out = {};

    // Campanha da sessão (GA4). Visita orgânica na semana seguinte: vazio.
    SESSION_KEYS.forEach(function (key) {
      var fromUrl = params.get(key);
      if (fromUrl) storageSet(window.sessionStorage, key, fromUrl);
      out[key] = fromUrl || storageGet(window.sessionStorage, key) || null;
    });

    // gclid/fbclid no dataLayer só se esta sessão viu o parâmetro.
    // Persistência de ads é fbc/fbp (abaixo), não o click id cru eterno.
    CLICK_ID_KEYS.forEach(function (key) {
      var fromUrl = params.get(key);
      if (fromUrl) storageSet(window.sessionStorage, key, fromUrl);
      out[key] = fromUrl || storageGet(window.sessionStorage, key) || null;
    });

    var storedFbc = readTimed("fbc");
    if (out.fbclid) {
      storedFbc = fbcFromFbclid(out.fbclid, storedFbc);
      writeTimed("fbc", storedFbc.v, storedFbc.t);
    }
    out.fbc = storedFbc ? storedFbc.v : null;

    var storedFbp = fbpEnsure(readTimed("fbp"));
    writeTimed("fbp", storedFbp.v, storedFbp.t);
    out.fbp = storedFbp.v;

    return out;
  }

  // SHA-256 síncrono (subtle.digest é async e atrasaria o dataLayer).
  // Public domain, baseado no algoritmo FIPS 180-4.
  function sha256Hex(ascii) {
    function rotr(n, x) { return (x >>> n) | (x << (32 - n)); }
    function safeAdd(x, y) {
      var lsw = (x & 0xffff) + (y & 0xffff);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xffff);
    }
    var K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var bytes = unescape(encodeURIComponent(ascii));
    var len = bytes.length;
    var words = [];
    var i;
    for (i = 0; i < len; i++) words[i >> 2] |= (bytes.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
    words[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
    words[(((len + 8) >> 6) << 4) + 15] = len * 8;
    for (i = 0; i < words.length; i += 16) {
      var w = words.slice(i, i + 16);
      var j;
      for (j = 16; j < 64; j++) {
        var s0 = rotr(7, w[j - 15]) ^ rotr(18, w[j - 15]) ^ (w[j - 15] >>> 3);
        var s1 = rotr(17, w[j - 2]) ^ rotr(19, w[j - 2]) ^ (w[j - 2] >>> 10);
        w[j] = safeAdd(safeAdd(safeAdd(w[j - 16], s0), w[j - 7]), s1);
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
        var ch = (e & f) ^ (~e & g);
        var t1 = safeAdd(safeAdd(safeAdd(safeAdd(h, S1), ch), K[j]), w[j]);
        var S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var t2 = safeAdd(S0, maj);
        h = g; g = f; f = e; e = safeAdd(d, t1); d = c; c = b; b = a; a = safeAdd(t1, t2);
      }
      H[0] = safeAdd(H[0], a); H[1] = safeAdd(H[1], b); H[2] = safeAdd(H[2], c); H[3] = safeAdd(H[3], d);
      H[4] = safeAdd(H[4], e); H[5] = safeAdd(H[5], f); H[6] = safeAdd(H[6], g); H[7] = safeAdd(H[7], h);
    }
    return H.map(function (x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); }).join("");
  }

  // Janela em que dois track() iguais colapsam no mesmo event_id (double-bind
  // do listener, React Strict Mode, etc.). Fora dela, outro disparo é outro evento.
  var EVENT_ID_BUCKET_MS = 2000;

  function makeEventId(eventName, properties) {
    var p = properties || {};
    var material = [
      eventName,
      anonId,
      sessionId,
      window.location.pathname,
      p.element_id || "",
      p.element_type || "",
      (p.element_text || "").slice(0, 100),
      p.form_id || "",
      String(Math.floor(Date.now() / EVENT_ID_BUCKET_MS)),
    ].join("|");
    return sha256Hex(material);
  }

  // Ponto único de disparo — nunca faça dataLayer.push fora daqui.
  window.track = function (eventName, properties) {
    var extra = properties || {};
    var payload = Object.assign(
      {
        event: eventName,
        anon_id: anonId,
        session_id: sessionId,
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer,
      },
      getAttribution(),
      extra
    );
    payload.event = eventName;
    payload.event_id = makeEventId(eventName, extra);
    payload.event_time = Math.floor(Date.now() / 1000);
    window.dataLayer.push(payload);
  };

  // Hash pro formato que Enhanced Conversions (Google) e Advanced Matching
  // (Meta) esperam: SHA-256 de e-mail/telefone normalizado (minúsculo, sem
  // espaço). NUNCA passe o valor cru pro track() — sempre hasheie antes.
  // Telefone deve estar em E.164 (+5511999999999) antes de chamar isso.
  window.hashForMatching = async function (value) {
    if (!value) return null;
    var normalized = String(value).trim().toLowerCase();
    var data = new TextEncoder().encode(normalized);
    var hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  };

  // Captura automática de clique — nenhum botão precisa de onclick manual.
  function elementInfo(el) {
    return {
      element_type: el.tagName.toLowerCase(),
      element_text: (el.textContent || "").trim().slice(0, 100),
      element_id: el.id || null,
    };
  }

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target.closest("a, button, [data-track-event]");
      if (!el) return;
      var eventName = el.getAttribute("data-track-event") || "click";
      window.track(eventName, elementInfo(el));
    },
    true
  );

  // Captura automática de submit — nunca inclui valor de campo.
  document.addEventListener(
    "submit",
    function (e) {
      var form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      var fields = Array.from(form.elements).filter(function (el) {
        return el.name;
      });
      window.track("form_submit", {
        form_id: form.id || null,
        field_count: fields.length,
        has_email: fields.some(function (el) {
          return el.type === "email" || /email/i.test(el.name);
        }),
        has_phone: fields.some(function (el) {
          return el.type === "tel" || /phone|telefone/i.test(el.name);
        }),
      });
    },
    true
  );

  window.addEventListener("load", function () {
    window.track("page_view");
  });
})();
