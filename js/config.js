window.CONFIG = {
  supabaseUrl: "https://bcltcegokxujqxwbhato.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbHRjZWdva3h1anF4d2JoYXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MDg1NDQsImV4cCI6MjEwMjE4NDU0NH0.g9FWyPVizyGkGL7mWs8WMbBeNlvgNJTSQAGfE4ZgHxY",
  cloudinaryCloud: "kpy7nies",
  cloudinaryPreset: "imoveis-unsigned",
  cloudinaryBase: "https://res.cloudinary.com"
};

/* ============ CONFIG VALIDATION ============ */
function validarConfig() {
  var issues = [];
  if (!CONFIG.supabaseUrl || CONFIG.supabaseUrl.indexOf('SEU-PROJETO') !== -1) issues.push('Supabase URL');
  if (!CONFIG.supabaseAnonKey || CONFIG.supabaseAnonKey.indexOf('SUA-ANON') !== -1) issues.push('Supabase Anon Key');
  if (!CONFIG.cloudinaryCloud || CONFIG.cloudinaryCloud.indexOf('SEU-CLOUD') !== -1) issues.push('Cloudinary Cloud');
  if (!CONFIG.cloudinaryPreset || CONFIG.cloudinaryPreset.indexOf('SEU-PRESET') !== -1) issues.push('Cloudinary Preset');
  if (issues.length) console.warn('[Caetano] Config incompleta:', issues.join(', '));
  return issues.length === 0;
}

function otimizarImagem(url, largura) {
  if (!url) return "";
  const cloud = CONFIG.cloudinaryCloud;
  if (cloud && cloud.indexOf("SEU-CLOUD") === -1 && typeof url === "string" && url.indexOf(cloud) !== -1 && url.indexOf("/image/upload/") !== -1) {
    if (url.indexOf("/image/upload/f_auto") !== -1) return url;
    const trans = "f_auto,q_auto" + (largura ? ",w_" + largura : "");
    return url.replace("/image/upload/", "/image/upload/" + trans + "/");
  }
  return url;
}

// Entrega otimizada de vídeo: MP4 com qualidade automática e largura máxima
// (o Cloudinary gera a versão comprimida na entrega e guarda em cache).
function otimizarVideo(url, largura) {
  if (!url) return "";
  const cloud = CONFIG.cloudinaryCloud;
  if (cloud && cloud.indexOf("SEU-CLOUD") === -1 && typeof url === "string" && url.indexOf(cloud) !== -1 && url.indexOf("/video/upload/") !== -1) {
    if (url.indexOf("/video/upload/f_") !== -1) return url;
    const trans = "f_mp4,q_auto" + (largura ? ",w_" + largura : "");
    return url.replace("/video/upload/", "/video/upload/" + trans + "/");
  }
  return url;
}

function precoFormatado(v) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ============ UTILITÁRIOS: DEBOUNCE / THROTTLE ============ */
function debounce(fn, delay) {
  var timer;
  return function () {
    var ctx = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
  };
}

function throttle(fn, limit) {
  var waiting = false;
  var lastArgs = null;
  return function () {
    if (!waiting) {
      fn.apply(this, arguments);
      waiting = true;
      setTimeout(function () {
        waiting = false;
        if (lastArgs) { fn.apply(null, lastArgs); lastArgs = null; }
      }, limit);
    } else {
      lastArgs = arguments;
    }
  };
}

/* ============ CACHE (localStorage com TTL) ============ */
var Cache = {
  _prefix: 'caetano_',
  get: function (key) {
    try {
      var raw = localStorage.getItem(this._prefix + key);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (entry.exp && Date.now() > entry.exp) {
        localStorage.removeItem(this._prefix + key);
        return null;
      }
      return entry.val;
    } catch (e) { return null; }
  },
  set: function (key, val, ttlMs) {
    try {
      var entry = { val: val, exp: ttlMs ? Date.now() + ttlMs : 0 };
      localStorage.setItem(this._prefix + key, JSON.stringify(entry));
    } catch (e) { /* quota exceeded, ignore */ }
  },
  remove: function (key) {
    try { localStorage.removeItem(this._prefix + key); } catch (e) { /* ignore */ }
  }
};
