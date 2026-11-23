// A drawn mouse cursor that lives inside the scaled 1024x768 screen.
// Because it is fake, the "machine" can occasionally take it over.
(function (G) {
  'use strict';
  const U = G.util;

  const ARROW = '<svg width="13" height="21" viewBox="0 0 13 21"><path d="M0.5 0.5 L0.5 17 L4.4 13.4 L7.2 19.8 L9.6 18.8 L6.9 12.5 L12 12.5 Z" fill="#fff" stroke="#000" stroke-width="1" stroke-linejoin="round"/></svg>';
  const HAND = '<svg width="17" height="22" viewBox="0 0 17 22"><path d="M5.5 1.5 C5.5 0.4 7.5 0.4 7.5 1.5 L7.5 8 L8 8 L8 6.5 C8 5.5 10 5.5 10 6.5 L10 8.5 L10.4 8.5 L10.4 7.3 C10.4 6.3 12.4 6.3 12.4 7.3 L12.4 9 L12.8 9 C12.8 8 14.8 8 14.8 9 L14.8 14 C14.8 17 13.5 19.5 12.5 20.5 L5.5 20.5 C4.5 19 2 16 1 14 C0.3 12.6 1.6 11.4 2.8 12.4 L5.5 15 Z" fill="#fff" stroke="#000" stroke-width="1"/></svg>';
  const BEAM = '<svg width="9" height="18" viewBox="0 0 9 18"><path d="M1 1 L3.5 1 L4.5 2 L5.5 1 L8 1 M4.5 2 L4.5 16 M1 17 L3.5 17 L4.5 16 L5.5 17 L8 17" fill="none" stroke="#000" stroke-width="1.6"/><path d="M1 1 L3.5 1 L4.5 2 L5.5 1 L8 1 M4.5 2 L4.5 16 M1 17 L3.5 17 L4.5 16 L5.5 17 L8 17" fill="none" stroke="#fff" stroke-width="0.6"/></svg>';
  const BUSY = '<svg width="13" height="21" viewBox="0 0 13 21"><path d="M0.5 0.5 L0.5 17 L4.4 13.4 L7.2 19.8 L9.6 18.8 L6.9 12.5 L12 12.5 Z" fill="#fff" stroke="#000" stroke-width="1" stroke-linejoin="round"/></svg><svg class="busy-glass" width="13" height="17" viewBox="0 0 13 17"><path d="M1 1 H12 V3 C12 6 8 7 8 8.5 C8 10 12 11 12 14 V16 H1 V14 C1 11 5 10 5 8.5 C5 7 1 6 1 3 Z" fill="#fff" stroke="#000"/><path d="M3 14.5 C3 12.5 6.5 12 6.5 10 C6.5 12 10 12.5 10 14.5 Z" fill="#c8a020"/></svg>';

  const C = {
    x: 512, y: 384,
    el: null,
    possessed: false,
    busyUntil: 0,
    kind: 'arrow',

    init() {
      C.el = U.$('#cursor');
      C.setKind('arrow');
      document.addEventListener('pointermove', (e) => {
        if (C.possessed) return;
        const p = G.toLocal(e.clientX, e.clientY);
        C.x = p.x;
        C.y = p.y;
        C.render();
        C.autoKind(e.target);
      }, { passive: true });
    },

    render() {
      C.el.style.transform = 'translate(' + C.x + 'px,' + C.y + 'px)';
    },

    setKind(k) {
      if (Date.now() < C.busyUntil && k !== 'busy') k = 'busy';
      if (C.kind === k && C.el.innerHTML) return;
      C.kind = k;
      C.el.className = 'cur-' + k;
      C.el.innerHTML = k === 'hand' ? HAND : k === 'beam' ? BEAM : k === 'busy' ? BUSY : ARROW;
    },

    autoKind(t) {
      if (!t || !t.closest) return;
      if (t.closest('textarea, input[type=text], input[type=password], input:not([type]), .cmd-input')) C.setKind('beam');
      else if (t.closest('a, .link, .hand')) C.setKind('hand');
      else C.setKind('arrow');
    },

    busy(ms = 800) {
      C.busyUntil = Date.now() + ms;
      C.setKind('busy');
      setTimeout(() => { if (Date.now() >= C.busyUntil) C.setKind('arrow'); }, ms + 20);
    },

    // The machine drags the cursor somewhere on its own.
    async possess(path, stepMs = 16) {
      C.possessed = true;
      G.fx.blockInput(true);
      for (const [tx, ty, dur] of path) {
        const sx = C.x, sy = C.y;
        const steps = Math.max(1, Math.round((dur || 600) / stepMs));
        for (let i = 1; i <= steps; i++) {
          const k = i / steps;
          const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          C.x = sx + (tx - sx) * e + U.rand(-0.8, 0.8);
          C.y = sy + (ty - sy) * e + U.rand(-0.8, 0.8);
          C.render();
          await U.sleep(stepMs);
        }
      }
      G.fx.blockInput(false);
      C.possessed = false;
    },

    jitter(ms = 600) {
      const end = Date.now() + ms;
      const ox = C.x, oy = C.y;
      const iv = setInterval(() => {
        if (Date.now() > end || C.possessed) { clearInterval(iv); return; }
        C.el.style.transform = 'translate(' + (ox + U.rand(-4, 4)) + 'px,' + (oy + U.rand(-4, 4)) + 'px)';
      }, 30);
    }
  };

  G.cursor = C;
})(window.G);
