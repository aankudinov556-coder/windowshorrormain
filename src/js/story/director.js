// The story director: infection levels, triggers, ambient scares, the final act.
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;
  const list = (key) => [].concat(t(key));

  const MIN = 60000;
  let timers = [];
  let unsubs = [];
  let ambientTimer = null;
  let levelEnteredAt = Date.now();
  let onceFlags = {};

  function later(ms, fn) { const tm = setTimeout(() => { if (S.active) fn(); }, ms); timers.push(tm); return tm; }

  // ---------------- ambient scares ----------------
  const SCARES = {
    clock333() { G.taskbar.clockOverride(t('clock.333'), U.randi(900, 2200)); },
    microGlitch() { G.fx.glitch(U.randi(80, 170), 0.7); },
    hdd() { G.audio.play('hddDeath'); },
    jitter() { G.cursor.jitter(500); },
    labelFlicker() {
      const lbl = U.$('.dicon[data-id="d_mydocs"] .di-label') || U.$('.dicon[data-id="d_mycomputer"] .di-label');
      if (!lbl) return;
      const orig = lbl.textContent;
      lbl.textContent = lbl.closest('[data-id="d_mydocs"]') ? t('st.hisDocs') : t('st.hisComp');
      setTimeout(() => { lbl.textContent = orig; }, 1300);
    },
    stillWatching() {
      if (onceFlags['sw' + G.state.level] || U.$('.dialog')) return;
      onceFlags['sw' + G.state.level] = true;
      G.dialogs.msg({ title: t('app.tv'), icon: 'question', text: t('st.stillQ'), buttons: [t('common.yes'), t('common.no')] }).then((r) => {
        if (r === t('common.no')) { G.audio.play('whisper'); G.dialogs.msg({ title: t('app.tv'), icon: 'info', text: t('st.stillNo') }); } else G.fx.glitch(120, 0.6);
      });
    },
    subWatch() {
      G.fx.glitch(220, 1.2, { sound: false });
      G.fx.subliminal(U.fill(U.pick(list('st.subs'))), 85);
    },
    whisper() { G.audio.play('whisper'); },
    corruptActive() { if (G.wm.active) G.fx.corruptText(G.wm.active.el, 900, 0.3); },
    balloonRec() {
      G.dialogs.balloon({ title: t('st.schedTitle'), icon: 'info', text: t('st.rec'), onclick: () => G.apps.launch('tv') });
    },
    async possess() {
      const ic = U.$('.dicon[data-id="d_tv"]');
      if (!ic || U.$('.dialog') || G.wm.get('tv')) return;
      const x = ic.offsetLeft + 38, y = ic.offsetTop + 20;
      await G.cursor.possess([[x + U.randi(-80, 80), y + U.randi(40, 120), 700], [x, y, 900]]);
      G.desktop.select(ic);
      await U.sleep(400);
      G.apps.launch('tv', {});
    },
    hostNote() { S.note(U.pick(list('st.hostNotes')), 'host'); },
    danielNote() { S.note(U.pick(list('st.danNotes')), 'daniel'); },
    redTint() { G.fx.tint('#ff1010', 260); G.audio.play('heartbeat'); },
    tvAuto() {
      if (onceFlags.tvAuto || G.wm.get('tv')) return;
      onceFlags.tvAuto = true;
      G.fx.glitch(200, 1);
      G.apps.launch('tv', {});
    },
    dontTurn() { G.fx.subliminal(t('st.dontTurn'), 110, { cls: 'small' }); }
  };

  const POOLS = {
    0: [],
    1: ['clock333', 'microGlitch', 'hdd', 'jitter', 'labelFlicker', 'clock333'],
    2: ['clock333', 'microGlitch', 'subWatch', 'whisper', 'corruptActive', 'balloonRec', 'stillWatching', 'jitter', 'hdd'],
    3: ['subWatch', 'whisper', 'corruptActive', 'possess', 'hostNote', 'redTint', 'dontTurn', 'clock333', 'tvAuto', 'microGlitch'],
    4: ['microGlitch', 'whisper', 'subWatch', 'danielNote', 'redTint', 'corruptActive', 'hostNote']
  };
  const GAP = { 1: [40, 80], 2: [28, 55], 3: [20, 40], 4: [25, 45] };

  function scheduleAmbient() {
    clearTimeout(ambientTimer);
    const L = G.state.level;
    if (!POOLS[L] || !POOLS[L].length) return;
    const [a, b] = GAP[L];
    ambientTimer = setTimeout(() => {
      if (!S.active) return;
      // No pop-ups once the sign-off procedure has started: the terminal must stay readable.
      const signingOff = L >= 4 && G.state.signoff.length > 0;
      if (!S.busy && !G.state.flags.ended && !signingOff) {
        const name = U.pick(POOLS[L]);
        try { SCARES[name](); } catch (e) { console.warn(e); }
      }
      scheduleAmbient();
    }, U.rand(a, b) * 1000);
  }

  // ---------------- director ----------------
  const S = {
    active: false,
    busy: false,

    note(text, who = 'host') {
      const w = G.apps.launch('notepad', { title: who === 'daniel' ? t('st.untitledDan') : t('st.untitled'), text: '', x: U.randi(120, 420), y: U.randi(60, 260), w: 380, h: 220 });
      const mins = Math.max(1, Math.round(G.state.playMs / MIN));
      G.apps.notepadType(w, String(text).replace('{mins}', mins), who === 'daniel' ? { min: 90, max: 220 } : { min: 60, max: 150 });
      return w;
    },

    start() {
      S.stop();
      S.active = true;
      onceFlags = {};
      levelEnteredAt = Date.now();
      const on = (e, fn) => unsubs.push(G.on(e, fn));

      on('backup:done', () => later(1500, check));
      on('file:open', (n) => {
        if (n.id === 'f_englog') later(2500, check);
        if (n.id === 'p_0047' && !G.flag('saw0047')) { G.flag('saw0047', true); later(2500, () => { G.audio.play('whisper'); G.fx.glitch(150, 0.8); }); }
        if (n.id === 'f_readmeviewer') later(4000, () => SCARES.subWatch());
      });
      on('folder:unlock', () => later(1500, check));
      on('tape:watched', (id) => {
        if (id === 't_inside' && G.state.level >= 1) later(3000, () => { G.audio.play('sting'); G.fx.subliminal(U.fill(t('st.nextUser')), 120); });
        if (id === 't_live') later(2000, () => { G.fx.blackout(700); G.audio.play('scare'); G.fx.shake(500); });
      });
      on('backup:all', () => {
        const L = G.state.level;
        if (L >= 3) later(4000, () => S.note(t('st.allDone'), 'host'));
        else later(1500, () => G.dialogs.balloon({ title: t('app.backup'), icon: 'info', text: t('st.peteDone') }));
      });
      on('mail:sendrecv', () => {
        const L = G.state.level;
        if (L >= 1 && !G.state.mailArrived.m_bounce) G.mailbox.deliver('m_bounce', { balloon: false });
        if (L >= 3 && !G.state.mailArrived.m_host) G.mailbox.deliver('m_host', { balloon: false });
      });
      on('host:kill', () => S.killHost('cmd'));

      clearInterval(S._play);
      S._play = setInterval(() => { G.state.playMs += 5000; G.save(); }, 5000);

      S.applyLevel(G.state.level, false);
      if (G.state.level >= 4) S.enterFinal();
      else {
        if (G.state.playMs > 0 && !G.state.flags.welcomedBack) {
          G.state.flags.welcomedBack = true;
          later(5000, () => G.dialogs.balloon({ title: 'Meridian', icon: 'warn', text: t('st.recovered') + (G.state.level >= 2 ? '\n' + t('st.recovered2') : '') }));
        }
        S.hints();
        later(2000, check);
      }
      if (G.state.level === 0 && !G.flag('introBalloon')) {
        G.flag('introBalloon', true);
        later(9000, () => G.dialogs.balloon({ title: t('st.schedTitle'), icon: 'info', text: t('st.intro'), ms: 7000 }));
      }
    },

    stop() {
      S.active = false;
      timers.forEach(clearTimeout);
      timers = [];
      unsubs.forEach((u) => u());
      unsubs = [];
      clearTimeout(ambientTimer);
      clearInterval(S._play);
      clearInterval(S._hintIv);
    },

    applyLevel(L, refresh = true) {
      G.fx.setLevel(L);
      G.audio.setAmbientLevel(L);
      if (window.meridian) window.meridian.setLevel(L);
      if (refresh) {
        G.desktop.refresh();
        G.taskbar.renderTray();
        G.emit('fs:change');
      }
      scheduleAmbient();
    },

    async setLevel(n) {
      if (n <= G.state.level) return;
      G.state.level = n;
      levelEnteredAt = Date.now();
      G.save();
      G.emit('level', n);
      if (n === 1) {
        S.applyLevel(1);
        later(3000, () => G.fx.glitch(140, 0.6));
        later(7000, () => G.mailbox.deliver('m_bounce'));
        later(25000, () => SCARES.clock333());
      } else if (n === 2) {
        S.busy = true;
        G.audio.play('sting');
        G.fx.glitch(450, 1.6);
        await U.sleep(450);
        S.applyLevel(2);
        S.busy = false;
        later(9000, () => SCARES.stillWatching());
        later(20000, () => SCARES.balloonRec());
      } else if (n === 3) {
        S.busy = true;
        await U.sleep(800);
        G.audio.play('scare');
        G.fx.shake(600);
        await G.fx.blackout(1200);
        S.applyLevel(3);
        S.busy = false;
        later(5000, () => G.mailbox.deliver('m_host'));
        later(16000, () => S.note(t('st.hello3'), 'host'));
      }
    },

    hints() {
      clearInterval(S._hintIv);
      S._hintIv = setInterval(() => {
        if (!S.active || S.busy) return;
        const L = G.state.level;
        const m = (Date.now() - levelEnteredAt) / MIN;
        const b = G.state.backups;
        if (L === 0) {
          if (m > 3 && !onceFlags.h0a) { onceFlags.h0a = 1; G.dialogs.balloon({ title: t('tray.smartTitle'), icon: 'warn', text: t('st.h0'), onclick: () => G.apps.launch('backup') }); }
          if (m > 7 && !b.pics) S.setLevel(1);
        } else if (L === 1) {
          if (m > 4 && !G.state.unlocked.engineering && !onceFlags.h1a) { onceFlags.h1a = 1; G.dialogs.balloon({ title: t('app.mail'), icon: 'info', text: t('st.h1'), onclick: () => G.apps.launch('mail', { open: 'm_ruth3' }) }); }
          if (m > 9 && !G.state.unlocked.engineering && !onceFlags.h1b) { onceFlags.h1b = 1; S.note(t('st.h1b'), 'host'); }
        } else if (L === 2) {
          if (m > 4 && !onceFlags.h2a && !(b.mail && b.docs)) {
            onceFlags.h2a = 1;
            const missing = (!b.docs ? '• ' + t('bk.cDocs') + '\n' : '') + (!b.mail ? '• ' + t('bk.cMail') : '');
            G.dialogs.balloon({ title: t('app.backup'), icon: 'warn', text: t('st.h2') + '\n' + missing, onclick: () => G.apps.launch('backup') });
          }
          if (m > 10 && !onceFlags.h2b) { onceFlags.h2b = 1; check(true); }
        } else if (L === 3) {
          if (m > 4 && !onceFlags.h3a) { onceFlags.h3a = 1; S.note(t('st.h3'), 'host'); }
        } else if (L === 4 && !G.state.signoff.length) {
          if (m > 2.5 && !onceFlags.h4a) { onceFlags.h4a = 1; G.mailbox.deliver('m_dan_last'); }
          if (m > 5 && !onceFlags.h4b) { onceFlags.h4b = 1; if (!G.wm.get('tv')) G.apps.launch('tv', {}); }
          if (m > 8 && !onceFlags.h4c) { onceFlags.h4c = 1; G.fx.subliminal('TXCTL', 400, { cls: 'small' }); }
        }
      }, 15000);
    },

    // ---------------- final act ----------------
    enterFinal() {
      G.state.signoff = [];
      G.save();
      document.body.classList.remove('fade-out-ui');
      S.hints();
      later(3500, () => S.note(t('st.welcomeBack'), 'host'));
      later(30000, () => G.dialogs.balloon({ title: G.fs.byId('f_goodnight').name, icon: 'txt', text: t('st.goodnightBalloon'), onclick: () => G.fs.open(G.fs.byId('f_goodnight')) }));
    },

    async onShutdown(mode, fromLogin) {
      const L = G.state.level;
      if (mode === 'standby') {
        await G.fx.blackout(1600);
        if (L >= 2) G.fx.subliminal(t('st.dontSleep'), 200, { cls: 'red' });
        return;
      }
      if (L >= 4) {
        G.dialogs.msg({ title: t('off.titleSign'), icon: 'warn', text: t('st.signOffOnly') });
        return;
      }
      if (L === 3) return S.hauntedReboot();
      if (L === 2) {
        const r = await G.dialogs.msg({ title: t('st.endProgTitle'), icon: 'warn', text: t('st.endProg'), buttons: [t('st.endNow'), t('common.cancel')] });
        if (r === t('st.endNow')) {
          G.fx.glitch(300, 1.5);
          G.audio.play('sting');
          G.dialogs.msg({ title: 'host.exe', icon: 'error', text: t('st.hostNo') });
        }
        return;
      }
      G.save();
      if (fromLogin) G.audio.stopAmbient();
      await G.boot.shutdownScreen(mode === 'restart' ? t('shut.restart') : t('shut.text'));
      if (mode === 'restart') return G.boot.bios();
      await G.boot.safeToTurnOff();
      G.boot.quit();
    },

    async hauntedReboot() {
      S.stop();
      G.flag('afterShutdown', true);
      await G.boot.shutdownScreen(t('shut.text'));
      await G.boot.safeToTurnOff();
      await U.sleep(2200);
      G.audio.play('static');
      G.fx.glitch(500, 1.5, { sound: false });
      await U.sleep(400);
      G.boot.screen('safe', U.el('div', { class: 'safe-text', style: { color: '#e33' } }, t('shut.notSafe')));
      G.audio.play('thump');
      await U.sleep(2400);
      G.boot.bios();
    },

    hostProgram() {
      G.fx.glitch(300, 1.4);
      G.fx.subliminal(U.fill(t('st.helloUser')), 120);
      G.audio.play('whisper');
      const tv = G.apps.launch('tv', {});
      if (tv && tv.tune) tv.tune(12);
    },

    async killHost(src) {
      const L = G.state.level;
      if (src === 'cmd') return;
      if (L <= 1) return G.dialogs.msg({ title: t('tm.unable'), icon: 'error', text: t('tm.denied') });
      if (L === 2) {
        G.state.flags.hostHidden = true;
        const tm = G.wm.get('taskmgr');
        tm && tm.refresh && tm.refresh();
        await U.sleep(3500);
        G.state.flags.hostHidden = false;
        G.state.flags.hostTwins = true;
        G.save();
        G.audio.play('whisper');
        tm && tm.refresh && tm.refresh();
        return;
      }
      if (L === 3) {
        G.audio.play('sting');
        return G.dialogs.msg({ title: t('tm.unable'), icon: 'error', text: U.fill(t('st.kill3')) });
      }
      return G.dialogs.msg({ title: 'host.exe', icon: 'warn', text: t('st.kill4') });
    },

    // ---------------- TXCTL sign-off (final act) ----------------
    async txctl(step, T) {
      const ORDER = ['anthem', 'bars', 'visual off', 'aural off', 'sign'];
      const done = G.state.signoff;
      if (step === 'status') {
        T.print(t('tx.transmitter'));
        T.print(t('tx.reel', { v: done.includes('anthem') ? t('tx.played') : t('tx.notPlayed') }));
        T.print(t('tx.bars', { v: done.includes('bars') ? t('tx.done') : '—' }));
        T.print(t('tx.visual', { v: done.includes('visual off') ? t('tx.down') : t('tx.on') }));
        T.print(t('tx.aural', { v: done.includes('aural off') ? t('tx.down') : t('tx.on') }));
        T.print(t('tx.log'));
        if (!done.length) await T.host(t('tx.tired'));
        return;
      }
      if (step === 'visual on' || step === 'aural on') {
        if (done.includes(step.replace('on', 'off'))) return S.violation(T, step);
        T.print(t('tx.alreadyOn'));
        return;
      }
      if (!ORDER.includes(step)) { T.print(t('tx.syntax')); return; }
      const expected = ORDER[done.length];
      if (step !== expected) return S.violation(T, step);
      S.busy = true;
      try {
        await S['step_' + step.replace(' ', '_')](T);
      } finally { S.busy = false; }
      if (T.win.closed) return;
      if (step !== 'sign') { done.push(step); G.save(); }
    },

    procedurePath() {
      return ['mydocs', 'station', 'f_procedure'].map((id) => G.fs.byId(id).name).join('\\');
    },

    async violation(T, step) {
      S.busy = true;
      T.print(t('tx.accepted', { step: step.toUpperCase() }));
      await U.sleep(600);
      G.audio.play('scare');
      G.fx.glitch(600, 2);
      G.fx.tint('#f00', 600);
      await T.host(t('tx.notDaniel'), 60);
      T.print(t('tx.violation'), 'warn');
      T.print(t('tx.followProc', { path: S.procedurePath() }), 'warn');
      G.state.signoff = [];
      G.save();
      document.body.classList.remove('fade-out-ui');
      if (!G.audio.ready) G.audio.init();
      G.audio.startAmbient();
      G.audio.setAmbientLevel(4);
      S.busy = false;
    },

    broadcastOverlay(draw, ms) {
      const c = U.el('canvas', { width: 320, height: 240 });
      const ov = U.el('div', { class: 'overlay-full bars-overlay' }, c);
      U.$('#stage').appendChild(ov);
      const ctx = c.getContext('2d');
      const t0 = performance.now();
      let raf;
      const frame = (now) => {
        const tt = (now - t0) / 1000;
        draw(ctx, tt);
        G.tapeArt.snow(ctx, 0.07);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      return new Promise((res) => setTimeout(() => { cancelAnimationFrame(raf); ov.remove(); res(); }, ms));
    },

    async step_anthem(T) {
      T.print(t('tx.rolling'), 'ok');
      G.audio.duckAmbient(true);
      const a = G.audio.anthem(false);
      const interrupts = list('tx.anthemLines');
      const ov = S.broadcastOverlay((ctx, tt) => {
        if (tt < 3) G.tapeArt.stationId(ctx, tt);
        else G.tapeArt.towerNight(ctx, tt, { text: t('tp.goodnightHV') });
        if (Math.random() < 0.04) G.tapeArt.snow(ctx, 0.8);
      }, Math.min(14500, a.duration * 1000 + 600));
      for (let i = 0; i < interrupts.length; i++) {
        await U.sleep(2600);
        G.fx.glitch(200, 1 + i * 0.3);
      }
      await ov;
      for (const line of interrupts) await T.host(line, 45);
      G.audio.duckAmbient(false);
      T.print(t('tx.anthemDone'), 'ok');
    },

    async step_bars(T) {
      T.print(t('tx.barsStart'), 'ok');
      const tone = G.audio.tone(1000, 0.07, null);
      await S.broadcastOverlay((ctx, tt) => G.tapeArt.bars(ctx, { figureBar: tt > 3.2 && tt < 3.6 }), 6000);
      tone.stop();
      T.print(t('tx.barsDone'), 'ok');
      await T.host(t('tx.cold'), 70);
    },

    async step_visual_off(T) {
      T.print(t('tx.visualDown'), 'ok');
      G.wm.wins.filter((w) => w !== T.win).forEach((w) => w.close(true));
      document.body.classList.add('fade-out-ui');
      G.audio.play('thump');
      await U.sleep(2600);
      for (const line of list('tx.visualLines')) await T.host(line, 80);
    },

    async step_aural_off(T) {
      T.print(t('tx.auralDown'), 'ok');
      G.audio.stopAmbient();
      G.audio.stopSpeech();
      await U.sleep(2500);
      for (const line of list('tx.quietLines')) {
        const el = T.print('', 'host');
        for (const ch of U.fill(line)) { el.textContent += ch; await U.sleep(90); }
        await U.sleep(700);
      }
    },

    async step_sign(T) {
      T.print(t('tx.ready'), 'ok');
      const hostName = t('tx.hostPretype');
      let pre = hostName;
      for (;;) {
        const name = await T.ask(t('tx.engineer'), pre);
        pre = null;
        if (name == null) return;
        const n = name.trim();
        if (!n) continue;
        if (/^(the\s*)?host$/i.test(n) || n.toLowerCase() === hostName.toLowerCase() || n.toLowerCase() === t('name.host').toLowerCase()) { T.print(t('tx.hostCant'), 'host'); continue; }
        if (n.length > 40) { T.print(t('tx.tooLong')); continue; }
        T.lock(true);
        G.state.flags.ended = true;
        G.save();
        T.print('');
        T.print(t('tx.signed', { name: n.toUpperCase(), date: U.fmtDate(new Date()), time: t('clock.333') }), 'ok');
        if (/daniel/i.test(n) || n.toLowerCase().includes(t('name.daniel').toLowerCase())) T.print(t('tx.danielSig'), 'warn');
        await U.sleep(1500);
        T.print('');
        T.print(t('tx.concluded'), 'big');
        await U.sleep(2500);
        S.stop();
        G.endings.signoff(n);
        return;
      }
    }
  };

  function check(force) {
    if (!S.active || S.busy) return;
    const L = G.state.level;
    const b = G.state.backups;
    if (L === 0 && b.pics) return S.setLevel(1);
    if (L === 1 && (G.state.opened.f_englog || b.docs)) return S.setLevel(2);
    if (L === 2 && ((b.docs && b.mail) || force)) return S.setLevel(3);
  }

  S.check = check;
  S.SCARES = SCARES;
  G.story = S;
})(window.G);
