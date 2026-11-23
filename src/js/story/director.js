// The story director: infection levels, triggers, ambient scares, the final act.
(function (G) {
  'use strict';
  const U = G.util;

  const MIN = 60000;
  let timers = [];
  let unsubs = [];
  let ambientTimer = null;
  let levelEnteredAt = Date.now();
  let onceFlags = {};

  function later(ms, fn) { const t = setTimeout(() => { if (S.active) fn(); }, ms); timers.push(t); return t; }

  // ---------------- ambient scares ----------------
  const HOST_NOTES = [
    'hello, {user}.\n\nyou have been watching for {mins} minutes.\nthank you.',
    '{user}, do you live alone?',
    'is your door locked?\ndaniel\'s wasn\'t.',
    'we like your room.\nit is very blue in here.\nthe light from the screen is on your face.',
    'the backup is a lovely idea.\nbring everyone.',
    'daniel says you type like lily.\nslow. careful.\nwe will be very careful with you.'
  ];
  const DANIEL_NOTES = [
    'don\'t copy the tapes. it isn\'t me in them.\nit only wears me.',
    'txctl. the procedure is in Station.\nevery step. in order.',
    'she was the moon.\ntell her i saw.',
    'it can\'t stand the anthem.\nstart with the anthem.'
  ];

  const SCARES = {
    clock333() { G.taskbar.clockOverride('3:33 AM', U.randi(900, 2200)); },
    microGlitch() { G.fx.glitch(U.randi(80, 170), 0.7); },
    hdd() { G.audio.play('hddDeath'); },
    jitter() { G.cursor.jitter(500); },
    labelFlicker() {
      const lbl = U.$$('.dicon .di-label').find((l) => /Documents|Computer/.test(l.textContent));
      if (!lbl) return;
      const orig = lbl.textContent;
      lbl.textContent = orig.replace(/My|Our/, 'His');
      setTimeout(() => { lbl.textContent = orig; }, 1300);
    },
    stillWatching() {
      if (onceFlags['sw' + G.state.level] || U.$('.dialog')) return;
      onceFlags['sw' + G.state.level] = true;
      G.dialogs.msg({ title: 'Meridian TV', icon: 'question', text: 'Are you still watching?', buttons: ['Yes', 'No'] }).then((r) => {
        if (r === 'No') { G.audio.play('whisper'); G.dialogs.msg({ title: 'Meridian TV', icon: 'info', text: 'That\'s alright.\n\nWe are.' }); } else G.fx.glitch(120, 0.6);
      });
    },
    subWatch() {
      G.fx.glitch(220, 1.2, { sound: false });
      G.fx.subliminal(U.fill(U.pick(['WE CAN SEE YOU', 'STAY TUNED', '3:33', 'HELLO {USER}', 'PLEASE REMAIN TUNED'])), 85);
    },
    whisper() { G.audio.play('whisper'); },
    corruptActive() { if (G.wm.active) G.fx.corruptText(G.wm.active.el, 900, 0.3); },
    balloonRec() {
      G.dialogs.balloon({ title: 'Meridian TV Scheduler', icon: 'info', text: 'Recording scheduled:\nCH 12 — 3:33 AM — "Tonight\'s Host"', onclick: () => G.apps.launch('tv') });
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
    hostNote() { S.note(U.pick(HOST_NOTES), 'host'); },
    danielNote() { S.note(U.pick(DANIEL_NOTES), 'daniel'); },
    redTint() { G.fx.tint('#ff1010', 260); G.audio.play('heartbeat'); },
    tvAuto() {
      if (onceFlags.tvAuto || G.wm.get('tv')) return;
      onceFlags.tvAuto = true;
      G.fx.glitch(200, 1);
      G.apps.launch('tv', {});
    },
    dontTurn() { G.fx.subliminal("DON'T TURN AROUND", 110, { cls: 'small' }); }
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
      if (!S.busy && !G.state.flags.ended) {
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
      const w = G.apps.launch('notepad', { title: who === 'daniel' ? 'untitled (Daniel)' : 'untitled', text: '', x: U.randi(120, 420), y: U.randi(60, 260), w: 380, h: 220 });
      const mins = Math.max(1, Math.round(G.state.playMs / MIN));
      G.apps.notepadType(w, text.replace('{mins}', mins), who === 'daniel' ? { min: 90, max: 220 } : { min: 60, max: 150 });
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
        if (id === 't_inside' && G.state.level >= 1) later(3000, () => { G.audio.play('sting'); G.fx.subliminal(U.fill('NEXT: {USER}'), 120); });
        if (id === 't_live') later(2000, () => { G.fx.blackout(700); G.audio.play('scare'); G.fx.shake(500); });
      });
      on('backup:all', () => {
        const L = G.state.level;
        if (L >= 3) later(4000, () => S.note('all done?\n\nthen turn it off, {user}.\ngo on.\nturn it off and go home.', 'host'));
        else later(1500, () => G.dialogs.balloon({ title: 'Backup Wizard', icon: 'info', text: 'Pete\'s checklist is complete.\nYou can shut down the computer now.' }));
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
          later(5000, () => G.dialogs.balloon({ title: 'Meridian', icon: 'warn', text: 'Meridian recovered from an unexpected shutdown.' + (G.state.level >= 2 ? '\nWe kept everything running while you were gone.' : '') }));
        }
        S.hints();
        later(2000, check);
      }
      if (G.state.level === 0 && !G.flag('introBalloon')) {
        G.flag('introBalloon', true);
        later(9000, () => G.dialogs.balloon({ title: 'Meridian TV Scheduler', icon: 'info', text: '6 recordings were captured while you were away.\nLast recording: 10/14/2003 3:58 AM', ms: 7000 }));
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
        later(16000, () => S.note('hello {user}.\n\nthank you for tuning in.\nwe saved you a seat.', 'host'));
      }
    },

    hints() {
      clearInterval(S._hintIv);
      S._hintIv = setInterval(() => {
        if (!S.active || S.busy) return;
        const L = G.state.level;
        const t = (Date.now() - levelEnteredAt) / MIN;
        const b = G.state.backups;
        if (L === 0) {
          if (t > 3 && !onceFlags.h0a) { onceFlags.h0a = 1; G.dialogs.balloon({ title: 'Hard Disk Warning', icon: 'warn', text: 'S.M.A.R.T.: hard disk failure is imminent.\nBack up your files now (Backup Wizard).', onclick: () => G.apps.launch('backup') }); }
          if (t > 7 && !b.pics) S.setLevel(1);
        } else if (L === 1) {
          if (t > 4 && !G.state.unlocked.engineering && !onceFlags.h1a) { onceFlags.h1a = 1; G.dialogs.balloon({ title: 'Meridian Mail', icon: 'info', text: 'Flagged message from Ruth Calloway:\n"Lock it up"', onclick: () => G.apps.launch('mail', { open: 'm_ruth3' }) }); }
          if (t > 9 && !G.state.unlocked.engineering && !onceFlags.h1b) { onceFlags.h1b = 1; S.note('2 0 5 2 5\n\nthere.\nnow read what he wrote about us.', 'host'); }
        } else if (L === 2) {
          if (t > 4 && !onceFlags.h2a && !(b.mail && b.docs)) { onceFlags.h2a = 1; G.dialogs.balloon({ title: 'Backup Wizard', icon: 'warn', text: 'Pete\'s checklist is not finished:\n' + (!b.docs ? '• My Documents\n' : '') + (!b.mail ? '• E-mail' : ''), onclick: () => G.apps.launch('backup') }); }
          if (t > 10 && !onceFlags.h2b) { onceFlags.h2b = 1; check(true); }
        } else if (L === 3) {
          if (t > 4 && !onceFlags.h3a) { onceFlags.h3a = 1; S.note('you can turn it off now, {user}.\nwe\'ll still be here.\nturn it off.', 'host'); }
        } else if (L === 4) {
          if (t > 2.5 && !onceFlags.h4a) { onceFlags.h4a = 1; G.mailbox.deliver('m_dan_last'); }
          if (t > 5 && !onceFlags.h4b) { onceFlags.h4b = 1; if (!G.wm.get('tv')) G.apps.launch('tv', {}); }
          if (t > 8 && !onceFlags.h4c) { onceFlags.h4c = 1; G.fx.subliminal('TXCTL', 400, { cls: 'small' }); }
        }
      }, 15000);
    },

    // ---------------- final act ----------------
    enterFinal() {
      G.state.signoff = [];
      G.save();
      document.body.classList.remove('fade-out-ui');
      S.hints();
      later(3500, () => {
        S.note('welcome back, {user}.\n\ndaniel wants to go home.\nlily is waiting for him.\n\nopen the backup wizard.\ncopy the recordings.\ntake him home.', 'host');
      });
      later(30000, () => G.dialogs.balloon({ title: 'GOODNIGHT.txt', icon: 'txt', text: 'Someone left a file on the desktop.', onclick: () => G.fs.open(G.fs.byId('f_goodnight')) }));
    },

    async onShutdown(mode, fromLogin) {
      const L = G.state.level;
      if (mode === 'standby') {
        await G.fx.blackout(1600);
        if (L >= 2) G.fx.subliminal('WE DON\'T SLEEP', 200, { cls: 'red' });
        return;
      }
      if (L >= 4) {
        G.dialogs.msg({ title: 'Sign off Meridian', icon: 'warn', text: 'This station cannot be turned off.\n\nIt can only be signed off — by the procedure.' });
        return;
      }
      if (L === 3) return S.hauntedReboot();
      if (L === 2) {
        const r = await G.dialogs.msg({ title: 'End Program - host.exe', icon: 'warn', text: 'This program is not responding.\n\nhost.exe is preventing Meridian from shutting down.', buttons: ['End Now', 'Cancel'] });
        if (r === 'End Now') {
          G.fx.glitch(300, 1.5);
          G.audio.play('sting');
          G.dialogs.msg({ title: 'host.exe', icon: 'error', text: 'No.\n\nThe program isn\'t over yet.' });
        }
        return;
      }
      G.save();
      if (fromLogin) G.audio.stopAmbient();
      await G.boot.shutdownScreen(mode === 'restart' ? 'Meridian is restarting...' : 'Meridian is shutting down...');
      if (mode === 'restart') return G.boot.bios();
      await G.boot.safeToTurnOff();
      G.boot.quit();
    },

    async hauntedReboot() {
      S.stop();
      G.flag('afterShutdown', true);
      await G.boot.shutdownScreen('Meridian is shutting down...');
      await G.boot.safeToTurnOff();
      await U.sleep(2200);
      G.audio.play('static');
      G.fx.glitch(500, 1.5, { sound: false });
      await U.sleep(400);
      G.boot.screen('safe', U.el('div', { class: 'safe-text', style: { color: '#e33' } }, 'It is not safe to turn off your computer.'));
      G.audio.play('thump');
      await U.sleep(2400);
      G.boot.bios();
    },

    hostProgram() {
      G.fx.glitch(300, 1.4);
      G.fx.subliminal(U.fill('HELLO {USER}'), 120);
      G.audio.play('whisper');
      const tv = G.apps.launch('tv', {});
      if (tv && tv.tune) tv.tune(12);
    },

    async killHost(src) {
      const L = G.state.level;
      if (src === 'cmd') return;
      if (L <= 1) return G.dialogs.msg({ title: 'Unable to Terminate Process', icon: 'error', text: 'The operation could not be completed.\n\nAccess is denied.' });
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
        return G.dialogs.msg({ title: 'Unable to Terminate Process', icon: 'error', text: U.fill('Access is denied.\n\nI am not a process, {User}.\nI am a program. You are watching it.') });
      }
      return G.dialogs.msg({ title: 'host.exe', icon: 'warn', text: 'There is nothing to end.\n\nA station is not ended. It is signed off.' });
    },

    // ---------------- TXCTL sign-off (final act) ----------------
    async txctl(step, T) {
      const ORDER = ['anthem', 'bars', 'visual off', 'aural off', 'sign'];
      const done = G.state.signoff;
      if (step === 'status') {
        T.print('TRANSMITTER ........ ON   (source: LOCAL — this terminal)');
        T.print('SIGN-OFF REEL ...... ' + (done.includes('anthem') ? 'PLAYED' : 'NOT PLAYED'));
        T.print('BARS / TONE ........ ' + (done.includes('bars') ? 'DONE' : '—'));
        T.print('VISUAL 205.25 MHz .. ' + (done.includes('visual off') ? 'DOWN' : 'ON'));
        T.print('AURAL  209.75 MHz .. ' + (done.includes('aural off') ? 'DOWN' : 'ON'));
        T.print('LOG ................ UNSIGNED');
        if (!done.length) await T.host('it has been on since 2003. it is very tired. let it rest with us.');
        return;
      }
      if (step === 'visual on' || step === 'aural on') {
        if (done.includes(step.replace('on', 'off'))) return S.violation(T, step);
        T.print('RCU: carrier is already ON.');
        return;
      }
      if (!ORDER.includes(step)) { T.print('RCU: ?SYNTAX — type TXCTL HELP'); return; }
      const expected = ORDER[done.length];
      if (step !== expected) return S.violation(T, step);
      S.busy = true;
      try {
        await S['step_' + step.replace(' ', '_')](T);
      } finally { S.busy = false; }
      if (T.win.closed) return;
      if (step !== 'sign') { done.push(step); G.save(); }
    },

    async violation(T, step) {
      S.busy = true;
      T.print('RCU: ' + step.toUpperCase() + ' — COMMAND ACCEPTED.');
      await U.sleep(600);
      G.audio.play('scare');
      G.fx.glitch(600, 2);
      G.fx.tint('#f00', 600);
      await T.host("that isn't how daniel did it.", 60);
      T.print('*** PROCEDURE VIOLATION — SIGN-OFF SEQUENCE RESET ***', 'warn');
      T.print('(Follow the written procedure: My Documents\\Station\\SIGNOFF_PROCEDURE.txt)', 'warn');
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
        const t = (now - t0) / 1000;
        draw(ctx, t);
        G.tapeArt.snow(ctx, 0.07);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      return new Promise((res) => setTimeout(() => { cancelAnimationFrame(raf); ov.remove(); res(); }, ms));
    },

    async step_anthem(T) {
      T.print('RCU: Rolling SIGN-OFF reel (station ID + anthem)...', 'ok');
      G.audio.duckAmbient(true);
      const a = G.audio.anthem(false);
      const interrupts = ['no.', 'turn that off.', 'daniel. make them stop.', 'we were having such a nice time.'];
      const ov = S.broadcastOverlay((ctx, t) => {
        if (t < 3) G.tapeArt.stationId(ctx, t);
        else G.tapeArt.towerNight(ctx, t, { text: 'GOODNIGHT, HARROW VALLEY' });
        if (Math.random() < 0.04) G.tapeArt.snow(ctx, 0.8);
      }, Math.min(14500, a.duration * 1000 + 600));
      for (let i = 0; i < interrupts.length; i++) {
        await U.sleep(2600);
        G.fx.glitch(200, 1 + i * 0.3);
      }
      await ov;
      for (const line of interrupts) await T.host(line, 45);
      G.audio.duckAmbient(false);
      T.print('RCU: Anthem complete.', 'ok');
    },

    async step_bars(T) {
      T.print('RCU: Color bars + 1 kHz reference tone...', 'ok');
      const tone = G.audio.tone(1000, 0.07, null);
      await S.broadcastOverlay((ctx, t) => G.tapeArt.bars(ctx, { figureBar: t > 3.2 && t < 3.6 }), 6000);
      tone.stop();
      T.print('RCU: Reference tone complete.', 'ok');
      await T.host('please. it is so cold out there.', 70);
    },

    async step_visual_off(T) {
      T.print('RCU: Visual carrier 205.25 MHz ........ DOWN', 'ok');
      G.wm.wins.filter((w) => w !== T.win).forEach((w) => w.close(true));
      document.body.classList.add('fade-out-ui');
      G.audio.play('thump');
      await U.sleep(2600);
      await T.host("you can't see me anymore.", 80);
      await T.host('i can still see you.', 80);
    },

    async step_aural_off(T) {
      T.print('RCU: Aural carrier 209.75 MHz ......... DOWN', 'ok');
      G.audio.stopAmbient();
      G.audio.stopSpeech();
      await U.sleep(2500);
      const prev = G.meta.volume;
      for (const line of ['...', '{user}?', 'it is so quiet.', 'is this what the end of the day sounds like?']) {
        const el = T.print('', 'host');
        for (const ch of U.fill(line)) { el.textContent += ch; await U.sleep(90); }
        await U.sleep(700);
      }
      G.meta.volume = prev;
    },

    async step_sign(T) {
      T.print('RCU: Ready to sign the transmitter log.', 'ok');
      let pre = 'HOST';
      for (;;) {
        const name = await T.ask('Engineer on duty: ', pre);
        pre = null;
        if (name == null) return;
        const n = name.trim();
        if (!n) continue;
        if (/^(the\s*)?host$/i.test(n)) { T.print('The Host cannot sign off. Only a viewer can.', 'host'); continue; }
        if (n.length > 40) { T.print('Name too long.'); continue; }
        T.lock(true);
        G.state.flags.ended = true;
        G.save();
        T.print('');
        T.print('LOG SIGNED: ' + n.toUpperCase() + '    ' + U.fmtDate(new Date()) + '  3:33 AM', 'ok');
        if (/daniel/i.test(n)) T.print('(The log already holds that signature. It was waiting for a second one.)', 'warn');
        await U.sleep(1500);
        T.print('');
        T.print('CHANNEL 12 HAS CONCLUDED ITS BROADCAST DAY.', 'big');
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
