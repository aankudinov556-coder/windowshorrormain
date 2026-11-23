// Bootstrap: scale the 1024x768 "monitor" to the window and power on.
(function (G) {
  'use strict';
  const U = G.util;
  const screenEl = U.$('#screen');

  function fit() {
    const s = Math.min(window.innerWidth / 1024, window.innerHeight / 768);
    const ox = Math.round((window.innerWidth - 1024 * s) / 2);
    const oy = Math.round((window.innerHeight - 768 * s) / 2);
    screenEl.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + s + ')';
    G.scale = s;
  }

  // Convert window (client) coordinates into 1024x768 screen coordinates.
  G.toLocal = function (cx, cy) {
    const r = screenEl.getBoundingClientRect();
    return { x: (cx - r.left) / G.scale, y: (cy - r.top) / G.scale };
  };

  window.addEventListener('resize', fit);
  fit();

  document.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('dragstart', (e) => e.preventDefault());
  document.addEventListener('keydown', (e) => {
    // Keep the illusion: swallow a few browser shortcuts that would break it.
    if ((e.ctrlKey && ['r', 'p', 's', 'f'].includes(e.key.toLowerCase())) || e.key === 'F5') e.preventDefault();
  }, true);

  G.fx.init();
  G.cursor.init();

  if (window.meridian && window.meridian.onCloseAttempt) {
    window.meridian.onCloseAttempt(() => {
      G.audio.play('whisper');
      G.dialogs.msg({ title: 'Meridian', icon: 'warn', text: U.fill(G.t('main.leaving')) });
    });
  }

  // ---- debug / testing helpers: ?skip=1&level=2&reset=1&lang=ru ----
  const q = new URLSearchParams(location.search);
  G.debug = {
    level(n) { G.story.setLevel(n); },
    end(which) { (which === 'bad' ? G.endings.homecoming() : G.endings.signoff('Tester')); },
    missing() { return Object.keys(G.i18n.missing); }
  };

  async function powerOn() {
    G.load();
    if (q.get('reset')) G.wipeAll();
    // Language: URL ?lang= > saved choice > OS/browser language > English.
    const lang = q.get('lang') || G.meta.lang || G.i18n.detect();
    await G.i18n.use(lang);
    G.meta.lang = G.i18n.lang;
    G.saveMeta();
    G.initUser();
    G.buildContent();

    if (q.get('level') != null) {
      G.state.level = Number(q.get('level')) || 0;
      if (G.state.level >= 4) G.state.flags.afterShutdown = true;
    }
    if (q.get('skip')) {
      const unlockAudio = () => { G.audio.init(); G.audio.startAmbient(); G.audio.setAmbientLevel(G.state.level); };
      document.addEventListener('pointerdown', unlockAudio, { once: true });
      G.boot.startDesktop();
    } else {
      G.boot.warning();
    }
  }
  powerOn();
})(window.G);
