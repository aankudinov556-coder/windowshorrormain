// Game state, save/load and a tiny event bus.
(function (G) {
  'use strict';

  const SAVE_KEY = 'meridian.save.v1';
  const META_KEY = 'meridian.meta.v1';

  function freshState() {
    return {
      level: 0,
      flags: {},
      opened: {},      // file ids the player has opened
      watched: {},     // tape ids watched to the end
      restored: {},    // recycle bin items restored
      unlocked: {},    // password protected folders opened
      backups: {},     // item -> true
      mailRead: {},
      mailArrived: {}, // late-arriving mail ids
      signoff: [],     // txctl steps performed in the final act
      startedAt: Date.now(),
      playMs: 0
    };
  }

  // Meta survives a "new game": settings and endings already seen.
  function freshMeta() {
    return { reduceFlash: false, volume: 0.8, endings: {}, launches: 0, lastEnding: null, lang: null };
  }

  G.state = freshState();
  G.meta = freshMeta();

  G.save = function () {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch (e) { /* storage may be blocked */ }
  };
  G.saveMeta = function () {
    try { localStorage.setItem(META_KEY, JSON.stringify(G.meta)); } catch (e) { /* ignore */ }
  };
  G.load = function () {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (s && typeof s === 'object') G.state = Object.assign(freshState(), s);
    } catch (e) { /* ignore */ }
    try {
      const m = JSON.parse(localStorage.getItem(META_KEY) || 'null');
      if (m && typeof m === 'object') G.meta = Object.assign(freshMeta(), m);
    } catch (e) { /* ignore */ }
  };
  G.hasSave = function () {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  };
  G.newGame = function () {
    G.state = freshState();
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  };
  G.wipeAll = function () {
    G.state = freshState();
    G.meta = freshMeta();
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(META_KEY); } catch (e) { /* ignore */ }
  };

  G.flag = function (name, value) {
    if (value === undefined) return !!G.state.flags[name];
    G.state.flags[name] = value;
    G.save();
    return value;
  };

  // --- event bus ---
  const handlers = {};
  G.on = function (evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); return () => G.off(evt, fn); };
  G.off = function (evt, fn) { handlers[evt] = (handlers[evt] || []).filter((f) => f !== fn); };
  G.emit = function (evt, data) {
    (handlers[evt] || []).slice().forEach((fn) => {
      try { fn(data); } catch (e) { console.error('handler for', evt, e); }
    });
  };

  // Real OS user name (Electron) or a neutral fallback in the browser.
  G.initUser = function () {
    let n = '';
    if (window.meridian && window.meridian.username) n = String(window.meridian.username);
    const q = new URLSearchParams(location.search).get('user');
    if (q) n = q;
    n = n.replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 24);
    if (!n) n = G.t('user.default');
    G.userName = n.charAt(0).toUpperCase() + n.slice(1);
  };
})(window.G);
