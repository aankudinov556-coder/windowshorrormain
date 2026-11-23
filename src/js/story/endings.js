// The two endings.
(function (G) {
  'use strict';
  const U = G.util;

  async function typeInto(el, text, ms = 38) {
    for (const ch of text) {
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
    const b = U.el('button', { class: 'end-btn' }, window.meridian ? '[ Turn off ]' : '[ Power off ]');
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
      await typeInto(lines, 'Backup complete.\n7 recordings copied to BYTELINE_BKP (E:).\n\n');
      await U.sleep(1500);
      await typeInto(lines, 'PETE — 8:14 AM\n"got the stick, thanks. dropping it at Lily\'s tonight.\nweird, there\'s a host.exe on it? whatever, she\'ll figure it out."\n\n', 30);
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
        const t = (now - t0) / 1000;
        G.tapeArt.house(ctx, t, { zoom: 1 + Math.min(1.2, t * 0.08), flicker: t > 8 });
        G.tapeArt.text(ctx, t < 6 ? 'LIVE — THE MERCER HOUSE' : 'SHE LEFT A LIGHT ON.', 160, 214, { size: 12 });
        G.tapeArt.snow(ctx, 0.1);
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
      G.audio.speak('Thank you for watching. See you at home.', { rate: 0.5, pitch: 0.01 });
      await U.sleep(13000);
      run = false;
      hum.stop();
      c.remove();
      G.audio.play('thump');
      el.appendChild(U.el('div', { class: 'end-title' }, 'THANK YOU FOR WATCHING.'));
      await U.sleep(2500);
      el.appendChild(U.el('div', { class: 'end-sub' }, 'ENDING 1 OF 2 — HOMECOMING'));
      el.appendChild(U.el('div', { class: 'end-sub' }, 'Some recordings should never be backed up.'));
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
      await typeInto(lines, 'Pete pulled the drive the next morning.\nIt was blank. Every sector read zero.\n\n', 42);
      await U.sleep(1200);
      await typeInto(lines, 'The backup stick held his pictures and his letters.\nLily Mercer cried at most of them.', 42);
      await U.sleep(2200);
      lines.style.transition = 'opacity 1.2s';
      lines.style.opacity = '0';
      await U.sleep(1300);
      lines.textContent = '';
      lines.style.opacity = '1';
      await typeInto(lines, 'One she just stared at, for a long time:\na photo nobody remembered taking.', 42);
      await U.sleep(1500);
      const img = U.el('img', { class: 'end-photo', src: 'assets/img/school_play_2003.jpg', alt: '' });
      el.appendChild(img);
      await U.sleep(100);
      img.classList.add('show');
      await U.sleep(3500);
      const cap = U.el('div', { class: 'end-lines' });
      el.appendChild(cap);
      await typeInto(cap, 'Harrow Valley Elementary — October 17, 2003.\nIn the last row, by the door, someone is clapping too loud.', 40);
      await U.sleep(3000);
      el.appendChild(U.el('div', { class: 'end-title' }, 'GOODNIGHT, EVERYBODY.'));
      el.appendChild(U.el('div', { class: 'end-sub' }, 'ENDING 2 OF 2 — SIGN-OFF        (log signed by ' + name + ')'));
      el.appendChild(U.el('div', { class: 'end-sub' }, 'AFTER SIGN-OFF — thank you for watching.'));
      G.audio.init();
      G.audio.anthem(false);
      finish('signoff');
      await U.sleep(1500);
      powerButton(el);
    }
  };
})(window.G);
