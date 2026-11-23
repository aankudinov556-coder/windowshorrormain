// Meridian TV — VHS capture player and live tuner.
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;
  const W = 320, H = 240;
  const titleOf = (tp) => (typeof tp.title === 'function' ? tp.title() : tp.title);

  function tapeNodes() {
    return G.fs.children(G.fs.byId('drive_d')).filter((n) => n.kind === 'mpg');
  }

  G.apps.register('tv', (args = {}) => {
    const ex = G.wm.get('tv');
    if (ex) {
      ex.restore(); ex.focus();
      if (args.tape && ex.playTape) ex.playTape(args.tape);
      return ex;
    }

    const buf = U.el('canvas', { width: W, height: H });
    const bctx = buf.getContext('2d');
    const out = U.el('canvas', { class: 'tv-canvas', width: W, height: H });
    const octx = out.getContext('2d');
    const prev = U.el('canvas', { width: W, height: H });
    const pctx = prev.getContext('2d');
    const caption = U.el('div', { class: 'tv-caption' });
    const screen = U.el('div', { class: 'tv-screen' }, out, U.el('div', { class: 'tv-scan' }), caption);

    const lcd = U.el('div', { class: 'tv-lcd' }, 'CH 12');
    const status = U.el('div', { class: 'tv-status' }, '');
    const select = U.el('select', { class: 'tv-select' });
    const playBtn = U.el('button', { class: 'tv-btn', title: t('tv.play') }, '▶');
    const ctrl = U.el('div', { class: 'tv-controls' },
      U.el('button', { class: 'tv-btn', title: t('tv.rewind'), onclick: () => seek(-10) }, '◀◀'),
      playBtn,
      U.el('button', { class: 'tv-btn', title: t('tv.stop'), onclick: () => stopTape(true) }, '■'),
      U.el('button', { class: 'tv-btn', title: t('tv.ff'), onclick: () => seek(10) }, '▶▶'),
      U.el('span', { class: 'tsep' }),
      U.el('button', { class: 'tv-btn', title: t('tv.chDown'), onclick: () => tune(-1) }, 'CH▼'),
      U.el('button', { class: 'tv-btn', title: t('tv.chUp'), onclick: () => tune(1) }, 'CH▲'),
      lcd);
    const side = U.el('div', { class: 'tv-side' }, U.el('label', null, t('tv.source')), select);

    const w = G.wm.open({
      key: 'tv', title: t('app.tv'), icon: G.state.level >= 3 ? 'tvLive' : 'tv', w: 520, h: 478, resizable: false, x: args.x, y: args.y,
      bodyClass: 'tv-body',
      onClose: () => cleanup()
    });
    w.body.appendChild(screen);
    w.body.appendChild(ctrl);
    w.body.appendChild(side);
    w.body.appendChild(status);

    // ---------------- state ----------------
    let mode = 'live';      // live | tape | stop
    let channel = 12;
    let tape = null, tapeId = null;
    let sceneIdx = -1, sceneStart = 0, tapeTime = 0;
    let paused = false;
    let lastNow = performance.now();
    let raf = 0;
    let liveHiss = null;
    let osdUntil = 0;
    let sounds = [], timers = [];
    let captionTimer = null;

    const player = {
      get prev() { return prev; },
      sound(h) { if (h) sounds.push(h); return h; },
      hiss() { return player.sound(G.audio.hiss(0.06)); },
      later(ms, fn) { timers.push(setTimeout(() => { if (!w.closed && mode === 'tape') fn(); }, ms)); },
      // key: language pack line. Captions show it unless noCaption (on-screen text already says it).
      say(key, o = {}) {
        const text = U.fill(t(key));
        if (!o.noCaption) player.caption(o.caption ? t(o.caption) : text, 1500 + text.length * 70 / (o.rate || 0.85));
        G.audio.voice(key, text, o);
      },
      caption(text, ms) {
        caption.textContent = U.fill(text);
        caption.style.display = 'block';
        clearTimeout(captionTimer);
        captionTimer = setTimeout(() => { caption.style.display = 'none'; }, ms);
      }
    };

    function clearSceneMedia() {
      sounds.forEach((s) => { try { s.stop(); } catch (e) { /* ok */ } });
      sounds = [];
      timers.forEach(clearTimeout);
      timers = [];
    }

    function stopLiveHiss() { if (liveHiss) { liveHiss.stop(); liveHiss = null; } }

    function populate() {
      select.innerHTML = '';
      select.appendChild(U.el('option', { value: '' }, t('tv.live')));
      tapeNodes().forEach((n) => select.appendChild(U.el('option', { value: n.tape }, n.name)));
      select.value = mode === 'tape' && tapeId ? tapeId : '';
    }
    select.addEventListener('change', () => {
      if (!select.value) goLive();
      else playTape(select.value);
    });
    playBtn.addEventListener('click', () => {
      if (mode === 'tape') { paused = !paused; playBtn.textContent = paused ? '▶' : '❚❚'; if (paused) G.audio.stopSpeech(); }
      else if (mode === 'stop' && tapeId) playTape(tapeId);
      else if (select.value) playTape(select.value);
    });

    // ---------------- live tuner ----------------
    function goLive() {
      stopTape(false);
      mode = 'live';
      playBtn.textContent = '▶';
      stopLiveHiss();
      liveHiss = G.audio.hiss(channel === 12 && G.state.level >= 2 ? 0.02 : 0.06);
      lcd.textContent = 'CH ' + U.pad(channel);
      osdUntil = performance.now() + 2500;
      status.textContent = channel === 12 ? statusFor12() : t('tv.noSignal', { n: channel });
      populate();
      G.emit('tv:tune', channel);
    }

    function statusFor12() {
      const L = G.state.level;
      return t('tv.ch12_' + Math.min(L <= 1 ? 1 : L, 4));
    }

    function tune(d) {
      if (mode !== 'live') goLive();
      channel += d;
      if (channel > 13) channel = 2;
      if (channel < 2) channel = 13;
      G.audio.play('staticShort');
      goLive();
    }

    // ---------------- tape playback ----------------
    function playTape(id) {
      const tp = G.tapes[id];
      if (!tp) return;
      clearSceneMedia();
      stopLiveHiss();
      G.audio.stopSpeech();
      tape = tp;
      tapeId = id;
      mode = 'tape';
      paused = false;
      playBtn.textContent = '❚❚';
      sceneIdx = -1;
      tapeTime = 0;
      osdUntil = performance.now() + 4000;
      lcd.textContent = 'PLAY';
      status.textContent = titleOf(tp);
      w.setTitle(titleOf(tp).split(' — ').slice(0, 2).join(' — ') + ' - ' + G.t('app.tv'));
      G.audio.duckAmbient(true);
      populate();
      G.emit('tape:start', id);
    }

    function totalDur(tp) { return tp.scenes.reduce((a, s) => a + s.d, 0); }

    function seek(d) {
      if (mode !== 'tape') return;
      tapeTime = U.clamp(tapeTime + d, 0, totalDur(tape) - 0.1);
      sceneIdx = -1;
      clearSceneMedia();
      G.audio.stopSpeech();
      G.audio.play('staticShort');
    }

    function stopTape(user) {
      if (mode !== 'tape') return;
      clearSceneMedia();
      G.audio.stopSpeech();
      caption.style.display = 'none';
      mode = 'stop';
      lcd.textContent = 'STOP';
      playBtn.textContent = '▶';
      G.audio.duckAmbient(false);
      w.setTitle(G.t('app.tv'));
      if (user) status.textContent = G.t('tv.stopped');
    }

    function tapeFinished() {
      const id = tapeId;
      stopTape(false);
      status.textContent = G.t('tv.end');
      G.state.watched[id] = true;
      G.save();
      G.emit('tape:watched', id);
    }

    // ---------------- render loop ----------------
    function vhs(now) {
      octx.drawImage(buf, 0, 0);
      const jitter = mode === 'tape' ? 1 : 0.6;
      for (let i = 0; i < 3; i++) {
        if (Math.random() < 0.35 * jitter) {
          const y = U.randi(0, H - 4), h = U.randi(1, 4);
          octx.drawImage(buf, 0, y, W, h, U.randi(-5, 5), y, W, h);
        }
      }
      octx.drawImage(buf, 0, H - 7, W, 7, U.randi(5, 10), H - 7, W, 7);
      octx.fillStyle = 'rgba(255,255,255,0.06)';
      octx.fillRect(0, H - 7, W, 2);
      G.tapeArt.snow(octx, 0.07);
      // OSD
      octx.save();
      octx.font = 'bold 12px "Courier New", monospace';
      octx.fillStyle = '#fff';
      octx.shadowColor = '#000';
      octx.shadowBlur = 0;
      octx.shadowOffsetX = 1;
      octx.shadowOffsetY = 1;
      if (now < osdUntil) {
        if (mode === 'tape') octx.fillText('PLAY ▶', 14, 22);
        else if (mode === 'live') octx.fillText('CH ' + U.pad(channel), W - 60, 22);
      }
      if (mode === 'tape') {
        const base = tape.live ? Date.now() - tapeTime * 1000 : tape.date.getTime();
        octx.fillText(U.fmtVCR(new Date(base + tapeTime * 1000)), W - 196, H - 14);
      }
      if (paused && mode === 'tape') octx.fillText('PAUSE ❚❚', 14, 22);
      octx.restore();
      pctx.drawImage(out, 0, 0);
    }

    function stopScreen() {
      bctx.fillStyle = '#0018b0';
      bctx.fillRect(0, 0, W, H);
      G.tapeArt.text(bctx, 'STOP ■', 50, 24, { size: 14 });
      G.tapeArt.text(bctx, 'VIDEO 1', W - 50, 24, { size: 12 });
    }

    function frame(now) {
      if (w.closed) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - lastNow) / 1000);
      lastNow = now;
      if (w.minimized) return;
      if (mode === 'live') {
        G.liveChannel(bctx, channel, now / 1000, player);
      } else if (mode === 'stop') {
        stopScreen();
      } else if (mode === 'tape') {
        if (!paused) tapeTime += dt;
        let acc = 0, idx = 0;
        for (; idx < tape.scenes.length; idx++) {
          if (tapeTime < acc + tape.scenes[idx].d) break;
          acc += tape.scenes[idx].d;
        }
        if (idx >= tape.scenes.length) { tapeFinished(); return; }
        const sc = tape.scenes[idx];
        if (idx !== sceneIdx) {
          clearSceneMedia();
          sceneIdx = idx;
          try { sc.enter && sc.enter(player); } catch (e) { console.error(e); }
        }
        const lt = tapeTime - acc;
        try { sc.draw(bctx, lt, lt / sc.d, player); } catch (e) { console.error(e); }
      }
      vhs(now);
    }

    function cleanup() {
      cancelAnimationFrame(raf);
      clearSceneMedia();
      stopLiveHiss();
      G.audio.stopSpeech();
      G.audio.duckAmbient(false);
      clearTimeout(captionTimer);
      G.emit('tv:close');
    }

    w.playTape = playTape;
    w.goLive = goLive;
    w.tune = (ch) => { channel = ch; goLive(); };

    if (args.tape) playTape(args.tape);
    else goLive();
    raf = requestAnimationFrame(frame);
    return w;
  });
})(window.G);
