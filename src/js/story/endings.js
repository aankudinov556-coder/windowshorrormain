// The two endings.
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;

  async function typeInto(el, text, ms = 38) {
    for (const ch of U.fill(text)) {
      el.textContent += ch;
      if (ch !== ' ' && ch !== '\n' && Math.random() < 0.5) G.audio.play('type');
      await U.sleep(ch === '\n' ? ms * 9 : ms);
    }
  }

  function overlay(cls) {
    const el = U.el('div', { class: 'ending ' + (cls || '') });
    U.$('#stage').appendChild(el);
    return el;
  }

  function finish(id) {
    G.meta.endings[id] = true;
    G.meta.lastEnding = id;
    G.saveMeta();
    G.newGame();
    if (window.meridian) window.meridian.setLevel(0);
  }

  function powerButton(el) {
    const b = U.el('button', { class: 'end-btn' }, window.meridian ? t('end.turnOff') : t('end.powerOff'));
    b.addEventListener('click', () => {
      G.fx.setLevel(0);
      document.body.classList.remove('fade-out-ui');
      G.boot.quit();
    });
    el.appendChild(b);
  }

  G.endings = {
    async homecoming() {
      G.story.stop();
      G.state.flags.ended = true;
      G.audio.stopSpeech();
      G.wm.closeAll(true);
      G.audio.play('scare');
      await G.fx.blackout(900);
      G.audio.stopAmbient();
      const el = overlay('red');
      const lines = U.el('div', { class: 'end-lines' });
      el.appendChild(lines);
      await typeInto(lines, t('end.h.1'));
      await U.sleep(1500);
      await typeInto(lines, t('end.h.2'), 30);
      await U.sleep(2500);
      lines.textContent = '';
      const c = U.el('canvas', { width: 320, height: 240, style: { width: '480px', height: '360px', filter: 'contrast(1.1) blur(.4px)' } });
      el.insertBefore(c, lines);
      const ctx = c.getContext('2d');
      const t0 = performance.now();
      const hum = G.audio.hum(0.09, 41);
      let run = true;
      const draw = (now) => {
        if (!run) return;
        const tt = (now - t0) / 1000;
        G.tapeArt.house(ctx, tt, { zoom: 1 + Math.min(1.2, tt * 0.08), flicker: tt > 8 });
        G.tapeArt.text(ctx, tt < 6 ? t('end.h.live') : t('end.h.light'), 160, 214, { size: 12 });
        G.tapeArt.snow(ctx, 0.1);
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
      G.audio.voice('end.h.say', t('end.h.say'), { rate: 0.5, pitch: 0.01 });
      await U.sleep(13000);
      run = false;
      hum.stop();
      c.remove();
      G.audio.play('thump');
      el.appendChild(U.el('div', { class: 'end-title' }, t('end.h.title')));
      await U.sleep(2500);
      el.appendChild(U.el('div', { class: 'end-sub' }, t('end.h.sub')));
      el.appendChild(U.el('div', { class: 'end-sub' }, t('end.h.moral')));
      finish('homecoming');
      await U.sleep(1500);
      powerButton(el);
    },

    async signoff(name) {
      G.story.stop();
      G.audio.stopSpeech();
      G.wm.closeAll(true);
      const tone = G.audio.tone(1000, 0.06, null);
      await G.story.broadcastOverlay((ctx) => G.tapeArt.bars(ctx), 3500);
      tone.stop();
      G.audio.play('shutdown');
      const el = overlay();
      await U.sleep(2500);
      const lines = U.el('div', { class: 'end-lines' });
      el.appendChild(lines);
      await typeInto(lines, t('end.s.1'), 42);
      await U.sleep(1200);
      await typeInto(lines, t('end.s.2'), 42);
      await U.sleep(2200);
      lines.style.transition = 'opacity 1.2s';
      lines.style.opacity = '0';
      await U.sleep(1300);
      lines.textContent = '';
      lines.style.opacity = '1';
      await typeInto(lines, t('end.s.3'), 42);
      await U.sleep(1500);
      const img = U.el('img', { class: 'end-photo', src: G.i18n.asset('img/school_play_2003.jpg'), alt: '' });
      el.appendChild(img);
      await U.sleep(100);
      img.classList.add('show');
      await U.sleep(3500);
      const cap = U.el('div', { class: 'end-lines' });
      el.appendChild(cap);
      await typeInto(cap, t('end.s.caption'), 40);
      await U.sleep(3000);
      el.appendChild(U.el('div', { class: 'end-title' }, t('end.s.title')));
      el.appendChild(U.el('div', { class: 'end-sub' }, t('end.s.sub', { name })));
      el.appendChild(U.el('div', { class: 'end-sub' }, t('end.s.thanks')));
      G.audio.init();
      G.audio.anthem(false);
      finish('signoff');
      await U.sleep(1500);
      powerButton(el);
    }
  };
})(window.G);
