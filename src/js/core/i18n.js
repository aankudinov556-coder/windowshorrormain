// Localization core.
//
// Every visible string lives in a language pack (src/lang/<code>/*.js) under a key.
// Code asks for text with G.t('key', {vars}). Missing keys fall back to English,
// then to the key itself, so a half-finished translation never breaks the game.
//
// A pack value can be:
//   - a string           'Hello, {name}'          ({name} filled from vars)
//   - an array           ['line 1', 'line 2']     (returned as-is: lists, cards, pools)
//   - a function         (state, vars) => '...'   (text that depends on progress)
//
// Story placeholders like {USER} / {User} / {TIME} are filled later by G.util.fill().
(function (G) {
  'use strict';

  const I = {
    lang: 'en',
    packs: {},
    loaded: { en: true },
    debug: /[?&]i18ndebug=1/.test(location.search),
    missing: {},

    add(code, dict) {
      I.packs[code] = Object.assign(I.packs[code] || {}, dict);
      I.loaded[code] = true;
    },

    list() { return G.LANGUAGES && G.LANGUAGES.length ? G.LANGUAGES : [{ code: 'en', native: 'English', files: [] }]; },

    info(code) {
      const c = code || I.lang;
      return I.list().find((l) => l.code === c) || I.list()[0];
    },

    has(key, code) {
      const p = I.packs[code || I.lang];
      return !!p && p[key] !== undefined;
    },

    raw(key) {
      let s = I.packs[I.lang] && I.packs[I.lang][key];
      if (s === undefined && I.packs.en) s = I.packs.en[key];
      return s;
    },

    t(key, vars) {
      let s = I.raw(key);
      if (s === undefined) {
        if (!I.missing[key]) { I.missing[key] = true; if (I.debug) console.warn('[i18n] missing key:', key); }
        return key;
      }
      if (typeof s === 'function') s = s(G.state, vars || {});
      if (Array.isArray(s)) return s;
      s = String(s);
      if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m));
      return s;
    },

    // Pick the player's language from the OS / browser, if we have it.
    detect() {
      const avail = I.list().map((l) => l.code);
      const nav = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'])
        .map((x) => String(x).toLowerCase());
      for (const n of nav) {
        if (avail.includes(n)) return n;
        const short = n.slice(0, 2);
        if (avail.includes(short)) return short;
      }
      return 'en';
    },

    // Language packs are plain scripts, so they also work from file:// (no fetch needed).
    load(code) {
      if (I.loaded[code]) return Promise.resolve();
      const info = I.info(code);
      if (!info || info.code !== code) return Promise.reject(new Error('unknown language ' + code));
      return info.files.reduce((p, f) => p.then(() => new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'lang/' + code + '/' + f;
        s.onload = res;
        s.onerror = () => rej(new Error('cannot load ' + s.src));
        document.head.appendChild(s);
      })), Promise.resolve()).then(() => { I.loaded[code] = true; });
    },

    async use(code) {
      const info = I.info(code);
      code = info.code;
      try { await I.load(code); } catch (e) { console.error(e); code = 'en'; }
      I.lang = code;
      document.documentElement.lang = code;
      if (G.emit) G.emit('lang', code);
      return code;
    },

    // Asset lookup with per-language overrides:
    //   src/lang/<code>/assets/<path>  if the language manifest lists <path> in `assets`
    //   src/assets/<path>              otherwise
    asset(path) {
      const info = I.info();
      if (info.assets && info.assets.includes(path)) return 'lang/' + I.lang + '/assets/' + path;
      return 'assets/' + path;
    },

    // Language tag for text-to-speech voice selection ('en', 'ru', ...).
    speechLang() { return I.info().speech || I.lang; },

    // Recorded voice line for a text key, if the language provides one.
    voiceFile(key) {
      const info = I.info();
      const f = info.voices && info.voices[key];
      return f ? 'lang/' + I.lang + '/assets/voice/' + f : null;
    }
  };

  G.i18n = I;
  G.t = (key, vars) => I.t(key, vars);
})(window.G);
