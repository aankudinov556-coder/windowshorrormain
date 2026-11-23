// Screen-level visual effects: grain, scanlines, glitches, subliminal frames.
// Everything respects the "reduce flashing" setting.
(function (G) {
  'use strict';
  const U = G.util;

  let level = 0;
  let noiseCtx = null;
  let noiseFrames = [];
  let noiseTimer = null;
  let noiseOn = false;

  const FX = {
    screen: null,

    init() {
      FX.screen = U.$('#screen');
      const c = U.$('#fx-noise');
      noiseCtx = c.getContext('2d');
      for (let f = 0; f < 6; f++) {
        const img = noiseCtx.createImageData(c.width, c.height);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = Math.random() * 255;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
        noiseFrames.push(img);
      }
    },

    get flashSafe() { return !!G.meta.reduceFlash; },

    setLevel(l) {
      level = l;
      for (let i = 0; i <= 4; i++) document.body.classList.toggle('lvl-' + i, i === l);
      document.body.classList.toggle('lvl-ge2', l >= 2);
      document.body.classList.toggle('lvl-ge3', l >= 3);
      FX.noise(l >= 2);
    },

    noise(on) {
      noiseOn = on;
      clearInterval(noiseTimer);
      if (!on) return;
      let i = 0;
      noiseTimer = setInterval(() => {
        noiseCtx.putImageData(noiseFrames[i++ % noiseFrames.length], 0, 0);
      }, 70);
    },

    // Short burst of RGB split + jitter + corrupted bands.
    glitch(ms = 180, strength = 1, opts = {}) {
      const s = FX.screen;
      s.style.setProperty('--gx', (U.rand(-6, 6) * strength).toFixed(1) + 'px');
      s.classList.add('glitching');
      if (strength > 1.2) s.classList.add('glitching-hard');
      if (opts.sound !== false) G.audio.play('glitch');
      FX.bands(ms, Math.round(2 + strength * 3));
      clearTimeout(FX._gt);
      FX._gt = setTimeout(() => { s.classList.remove('glitching', 'glitching-hard'); }, ms);
    },

    // Horizontal corrupted bands using backdrop filters.
    bands(ms = 200, count = 4) {
      const host = U.$('#fx-bands');
      host.innerHTML = '';
      const filters = ['invert(1)', 'hue-rotate(120deg) saturate(3)', 'blur(2px) brightness(1.6)', 'contrast(3) grayscale(1)', 'hue-rotate(-90deg)'];
      for (let i = 0; i < count; i++) {
        const b = U.el('div', { class: 'band' });
        b.style.top = U.randi(0, 740) + 'px';
        b.style.height = U.randi(2, 26) + 'px';
        b.style.left = U.randi(-40, 0) + 'px';
        b.style.backdropFilter = U.pick(filters);
        b.style.webkitBackdropFilter = b.style.backdropFilter;
        host.appendChild(b);
      }
      clearTimeout(FX._bt);
      FX._bt = setTimeout(() => { host.innerHTML = ''; }, ms);
    },

    shake(ms = 400) {
      FX.screen.classList.add('shaking');
      setTimeout(() => FX.screen.classList.remove('shaking'), ms);
    },

    // Full-screen colour flash. Becomes a soft fade with reduceFlash.
    flash(color = '#fff', ms = 90) {
      const f = U.$('#fx-flash');
      f.style.background = color;
      f.style.transition = 'none';
      f.style.opacity = FX.flashSafe ? '0.25' : '1';
      requestAnimationFrame(() => {
        f.style.transition = 'opacity ' + (FX.flashSafe ? 600 : ms) + 'ms ease-out';
        f.style.opacity = '0';
      });
    },

    // A message that appears for a split second.
    subliminal(text, ms = 90, opts = {}) {
      const s = U.$('#fx-sub');
      s.innerHTML = '';
      s.appendChild(U.el('div', { class: 'sub-text ' + (opts.cls || '') }, text));
      s.style.background = opts.bg || 'transparent';
      s.classList.add('show');
      if (opts.sound !== false) G.audio.play('staticShort');
      setTimeout(() => s.classList.remove('show'), FX.flashSafe ? Math.max(ms, 500) : ms);
    },

    // Fullscreen blackout for a moment.
    blackout(ms = 400) {
      return new Promise((res) => {
        const f = U.$('#fx-flash');
        f.style.transition = 'none';
        f.style.background = '#000';
        f.style.opacity = '1';
        setTimeout(() => {
          f.style.transition = 'opacity 200ms';
          f.style.opacity = '0';
          res();
        }, ms);
      });
    },

    // Temporarily corrupt visible text inside an element.
    corruptText(root, ms = 600, amount = 0.25) {
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
      const orig = nodes.map((n) => n.nodeValue);
      nodes.forEach((n) => { n.nodeValue = U.corrupt(n.nodeValue, amount); });
      setTimeout(() => nodes.forEach((n, i) => { if (n.isConnected) n.nodeValue = orig[i]; }), ms);
    },

    tint(color, ms) {
      FX.screen.style.setProperty('--tint', color);
      FX.screen.classList.add('tinted');
      if (ms) setTimeout(() => FX.screen.classList.remove('tinted'), ms);
    },

    untint() { FX.screen.classList.remove('tinted'); },

    blockInput(on) {
      U.$('#input-block').style.display = on ? 'block' : 'none';
    }
  };

  G.fx = FX;
})(window.G);
