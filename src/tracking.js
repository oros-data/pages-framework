/**
 * Tracking de referência — dataLayer-only, sem endpoint próprio.
 * Veja SKILL.md nesta pasta antes de alterar qualquer coisa aqui.
 */
(function () {
  window.dataLayer = window.dataLayer || [];

  var ATTRIBUTION_KEYS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "gclid", "fbclid",
  ];

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

  function getAttribution() {
    var params = new URLSearchParams(window.location.search);
    var out = {};
    ATTRIBUTION_KEYS.forEach(function (key) {
      var fromUrl = params.get(key);
      if (fromUrl) {
        try { window.sessionStorage.setItem(key, fromUrl); } catch (e) {}
      }
      var value = fromUrl || (function () {
        try { return window.sessionStorage.getItem(key); } catch (e) { return null; }
      })();
      out[key] = value || null;
    });
    return out;
  }

  // Ponto único de disparo — nunca faça dataLayer.push fora daqui.
  window.track = function (eventName, properties) {
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
      properties || {}
    );
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
