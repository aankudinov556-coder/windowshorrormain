// Every sound in the game is synthesised live with WebAudio:
// no audio files, no licensing, and the ambience can react to
// the infection level in real time.
(function (G) {
  'use strict';
  const U = G.util;

  let ctx = null;
  let master, sfx, amb, tape, verb, verbSend;
  let noiseBuf = null;
  let ambient = null;
  let voices = [];

  function t0() { return ctx.currentTime; }

  function makeNoise() {
    const len = ctx.sampleRate * 2;
    const b = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function makeImpulse(sec = 2.6, decay = 2.4) {
    const len = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return b;
  }

  function gainNode(v, dest) {
    const g = ctx.createGain();
    g.gain.value = v;
    if (dest) g.connect(dest);
    return g;
  }

  function noiseSrc(loop = true) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = loop;
    s.loopStart = Math.random();
    return s;
  }

  function osc(type, freq, dest) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    if (dest) o.connect(dest);
    return o;
  }

  // Bell-ish tone made from inharmonic partials.
  function bell(freq, t, dur = 1.6, gain = 0.15, dest = sfx, send = 0.35) {
    const out = gainNode(1, dest);
    if (send) { const s = gainNode(send, verbSend); out.connect(s); }
    [[1, 1], [2.0, 0.42], [3.01, 0.2], [4.18, 0.1], [5.43, 0.05]].forEach(([m, a]) => {
      const o = osc('sine', freq * m);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain * a, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (1 + (m - 1) * 0.5));
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  // Warm detuned pad.
  function pad(freqs, t, dur, gain = 0.08, opts = {}) {
    const attack = opts.attack ?? 0.5;
    const release = opts.release ?? 1.2;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(opts.cutoff ?? 1400, t);
    if (opts.sweep) f.frequency.linearRampToValueAtTime(opts.sweep, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.setValueAtTime(gain, Math.max(t + attack, t + dur - release));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g);
    g.connect(opts.dest || sfx);
    g.connect(gainNode(opts.send ?? 0.5, verbSend));
    freqs.forEach((fr) => {
      [-7, 7].forEach((det) => {
        const o = osc(opts.type || 'sawtooth', fr);
        o.detune.value = det;
        const og = gainNode(1 / (freqs.length * 2), f);
        o.connect(og);
        o.start(t);
        o.stop(t + dur + 0.1);
      });
    });
  }

  function noiseBurst(t, dur, gain, type, freq, q, dest) {
    const s = noiseSrc(false);
    const f = ctx.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.value = freq || 3000;
    f.Q.value = q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + Math.min(0.004, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dest || sfx);
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur + 0.02);
  }

  function thump(t, freq = 70, gain = 0.5, dur = 0.35, dest = sfx) {
    const o = osc('sine', freq);
    o.frequency.setValueAtTime(freq * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.6, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // midi -> Hz

  const SOUNDS = {
    startup() {
      const t = t0() + 0.05;
      pad([N(51), N(58), N(63), N(67)], t, 4.2, 0.09, { attack: 1.0, release: 2.0, cutoff: 900, sweep: 2600 });
      thump(t, 55, 0.25, 1.2);
      [[70, 0.0], [75, 0.32], [79, 0.64], [82, 1.05], [87, 1.5]].forEach(([n, d], i) => bell(N(n), t + 0.2 + d, 2.6, 0.08 + i * 0.01));
    },
    shutdown() {
      const t = t0() + 0.05;
      pad([N(51), N(58), N(62)], t, 3.0, 0.08, { attack: 0.3, release: 2.2, cutoff: 1600, sweep: 500 });
      [[82, 0], [79, 0.28], [75, 0.56], [70, 0.95]].forEach(([n, d]) => bell(N(n), t + d, 2.2, 0.08));
    },
    logon() {
      const t = t0() + 0.02;
      [[75, 0], [82, 0.14]].forEach(([n, d]) => bell(N(n), t + d, 1.4, 0.08));
    },
    ding() { // critical stop
      const t = t0();
      bell(N(76), t, 1.2, 0.16);
      bell(N(71), t + 0.03, 1.2, 0.12);
      bell(N(64), t + 0.03, 1.3, 0.1);
    },
    exclaim() {
      const t = t0();
      bell(N(81), t, 1.1, 0.13);
      bell(N(76), t + 0.02, 1.1, 0.09);
    },
    notify() {
      const t = t0();
      bell(N(84), t, 0.7, 0.07, sfx, 0.2);
      bell(N(88), t + 0.09, 0.9, 0.07, sfx, 0.2);
    },
    click() { noiseBurst(t0(), 0.018, 0.12, 'highpass', 2500, 0.7); },
    type() { noiseBurst(t0(), 0.03, 0.12 + Math.random() * 0.06, 'bandpass', 1800 + Math.random() * 1600, 2); },
    hdd() {
      const t = t0();
      noiseBurst(t, 0.012, 0.18, 'bandpass', 4200, 3, amb);
      noiseBurst(t + 0.045 + Math.random() * 0.05, 0.01, 0.12, 'bandpass', 3400, 3, amb);
      thump(t, 140, 0.05, 0.05, amb);
    },
    hddDeath() { // the infamous failing-drive click-click-whirr
      const t = t0();
      for (let i = 0; i < 3; i++) {
        noiseBurst(t + i * 0.32, 0.02, 0.35, 'bandpass', 2600, 2, amb);
        thump(t + i * 0.32, 90, 0.18, 0.08, amb);
      }
      const o = osc('triangle', 180, null);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + 1.0);
      g.gain.linearRampToValueAtTime(0.03, t + 1.2);
      g.gain.linearRampToValueAtTime(0, t + 1.8);
      o.frequency.setValueAtTime(120, t + 1.0);
      o.frequency.linearRampToValueAtTime(260, t + 1.8);
      o.connect(g).connect(amb);
      o.start(t + 1.0);
      o.stop(t + 1.9);
    },
    static() { noiseBurst(t0(), 0.5, 0.25, 'bandpass', 2500, 0.4); },
    staticShort() { noiseBurst(t0(), 0.15, 0.22, 'bandpass', 3000, 0.4); },
    glitch() {
      const t = t0();
      const dur = U.rand(0.08, 0.22);
      const o = osc('square', U.rand(60, 220));
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0, t);
      for (let i = 0; i < 8; i++) g.gain.setValueAtTime(i % 2 ? 0 : 0.07, t + (dur / 8) * i);
      g.gain.setValueAtTime(0, t + dur);
      o.connect(g).connect(sfx);
      o.start(t);
      o.stop(t + dur + 0.02);
      noiseBurst(t, dur, 0.12, 'highpass', 1500, 0.5);
    },
    scare() {
      const t = t0();
      pad([N(26), N(27), N(32), N(38), N(39)], t, 2.6, 0.32, { attack: 0.02, release: 2.3, cutoff: 3500, sweep: 300, send: 0.8 });
      noiseBurst(t, 1.2, 0.35, 'lowpass', 2000, 0.5);
      thump(t, 45, 0.6, 1.2);
    },
    sting() { // quieter, unsettling chord
      const t = t0();
      pad([N(45), N(46), N(52)], t, 2.4, 0.12, { attack: 0.05, release: 2, cutoff: 1200, send: 0.9, type: 'triangle' });
    },
    thump() { thump(t0(), 55, 0.5, 0.5); },
    heartbeat() {
      const t = t0();
      thump(t, 50, 0.45, 0.25);
      thump(t + 0.28, 45, 0.35, 0.3);
    },
    whisper() {
      const t = t0();
      const s = noiseSrc(false);
      const f1 = ctx.createBiquadFilter();
      f1.type = 'bandpass';
      f1.Q.value = 6;
      f1.frequency.setValueAtTime(700, t);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      const syl = U.randi(3, 6);
      for (let i = 0; i < syl; i++) {
        const st = t + i * 0.22;
        f1.frequency.setValueAtTime(U.rand(500, 2600), st);
        g.gain.linearRampToValueAtTime(0.35, st + 0.05);
        g.gain.linearRampToValueAtTime(0.02, st + 0.19);
      }
      g.gain.linearRampToValueAtTime(0, t + syl * 0.22 + 0.1);
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pan) pan.pan.value = U.pick([-0.8, 0.8]);
      s.connect(f1).connect(g);
      if (pan) g.connect(pan).connect(sfx); else g.connect(sfx);
      g.connect(gainNode(0.6, verbSend));
      s.start(t, Math.random());
      s.stop(t + syl * 0.22 + 0.2);
    },
    jingle() { // cheerful-but-wrong TV program jingle
      const t = t0();
      [[72, 0], [76, 0.18], [79, 0.36], [84, 0.54], [83, 0.9], [79, 1.1]].forEach(([n, d]) => bell(N(n) * 0.985, t + d, 1.3, 0.08, tape, 0.4));
      pad([N(60), N(64), N(67)], t, 2.2, 0.05, { attack: 0.05, release: 1.5, cutoff: 2000, dest: tape });
    },
    error() { SOUNDS.ding(); },
    blip() { bell(N(96), t0(), 0.25, 0.04, sfx, 0); }
  };

  const A = {
    ready: false,

    init() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      noiseBuf = makeNoise();
      master = gainNode(G.meta.volume, ctx.destination);
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 4;
      comp.connect(master);
      sfx = gainNode(1, comp);
      amb = gainNode(1, comp);
      tape = gainNode(1, comp);
      verb = ctx.createConvolver();
      verb.buffer = makeImpulse();
      verbSend = gainNode(0.5, verb);
      verb.connect(comp);
      A.ready = true;
      if ('speechSynthesis' in window) {
        const load = () => { voices = speechSynthesis.getVoices() || []; };
        load();
        speechSynthesis.onvoiceschanged = load;
      }
    },

    setVolume(v) {
      G.meta.volume = U.clamp(v, 0, 1);
      G.saveMeta();
      if (master) master.gain.setTargetAtTime(G.meta.volume, t0(), 0.05);
    },

    play(name) {
      if (!ctx || !SOUNDS[name]) return;
      if (ctx.state === 'suspended') ctx.resume();
      try { SOUNDS[name](); } catch (e) { console.warn('sound', name, e); }
    },

    // Continuous 1 kHz reference tone (color bars) or any sine.
    tone(freq = 1000, gain = 0.08, dest) {
      if (!ctx) return { stop() {} };
      const o = osc('sine', freq);
      const g = gainNode(0, dest || tape);
      g.gain.setTargetAtTime(gain, t0(), 0.01);
      o.connect(g);
      o.start();
      return {
        stop() { try { g.gain.setTargetAtTime(0, t0(), 0.02); o.stop(t0() + 0.1); } catch (e) { /* ok */ } },
        set(f) { o.frequency.setTargetAtTime(f, t0(), 0.01); }
      };
    },

    // Two-tone emergency attention signal.
    eas(gain = 0.07) {
      if (!ctx) return { stop() {} };
      const g = gainNode(0, tape);
      g.gain.setTargetAtTime(gain, t0(), 0.01);
      const a = osc('sine', 853, g);
      const b = osc('sine', 960, g);
      a.start();
      b.start();
      return { stop() { try { g.gain.setTargetAtTime(0, t0(), 0.02); a.stop(t0() + 0.1); b.stop(t0() + 0.1); } catch (e) { /* ok */ } } };
    },

    // TV snow hiss.
    hiss(gain = 0.12) {
      if (!ctx) return { stop() {}, set() {} };
      const s = noiseSrc(true);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 3200;
      f.Q.value = 0.3;
      const g = gainNode(0, tape);
      g.gain.setTargetAtTime(gain, t0(), 0.02);
      s.connect(f).connect(g);
      s.start();
      return {
        stop() { try { g.gain.setTargetAtTime(0, t0(), 0.03); s.stop(t0() + 0.2); } catch (e) { /* ok */ } },
        set(v) { g.gain.setTargetAtTime(v, t0(), 0.05); }
      };
    },

    // Low unsettling hum for tapes.
    hum(gain = 0.08, freq = 55) {
      if (!ctx) return { stop() {} };
      const g = gainNode(0, tape);
      g.gain.setTargetAtTime(gain, t0(), 0.5);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 300;
      f.connect(g);
      const o1 = osc('sawtooth', freq, f);
      const o2 = osc('sawtooth', freq * 1.006, f);
      const o3 = osc('sine', freq * 2.01, g);
      [o1, o2, o3].forEach((o) => o.start());
      return { stop() { try { g.gain.setTargetAtTime(0, t0(), 0.2); [o1, o2, o3].forEach((o) => o.stop(t0() + 1)); } catch (e) { /* ok */ } } };
    },

    // Music-box sign-off anthem (original melody). slow=true gives the "return" version.
    anthem(slow = false) {
      if (!ctx) return { stop() {}, duration: 0 };
      const mel = [
        [67, 1], [72, 1], [76, 1.5], [74, 0.5], [72, 1], [67, 1], [69, 1.5], [67, 0.5],
        [64, 1], [65, 1], [67, 1.5], [72, 0.5], [71, 1], [69, 1], [67, 2],
        [67, 1], [72, 1], [76, 1.5], [77, 0.5], [79, 1], [76, 1], [74, 1.5], [72, 0.5],
        [69, 1], [71, 1], [72, 1], [74, 1], [72, 3]
      ];
      const bassMap = { 0: 48, 4: 53, 8: 48, 12: 55, 16: 48, 20: 53, 24: 55, 27: 48 };
      const beat = slow ? 0.62 : 0.42;
      const pitch = slow ? 0.74 : 1;
      const out = gainNode(1, tape);
      const lfo = osc('sine', slow ? 0.6 : 0.2);
      const lfoG = gainNode(slow ? 18 : 3);
      lfo.connect(lfoG);
      lfo.start();
      let t = t0() + 0.1;
      const oscs = [];
      mel.forEach(([n, d], i) => {
        const f = N(n) * pitch;
        const o = osc('triangle', f);
        lfoG.connect(o.detune);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d * beat * 1.8 + 0.3);
        o.connect(g).connect(out);
        g.connect(gainNode(0.5, verbSend));
        o.start(t);
        o.stop(t + d * beat * 1.8 + 0.4);
        oscs.push(o);
        if (bassMap[i] !== undefined) {
          const b = osc('sine', N(bassMap[i]) * pitch);
          const bg = ctx.createGain();
          bg.gain.setValueAtTime(0, t);
          bg.gain.linearRampToValueAtTime(0.07, t + 0.02);
          bg.gain.exponentialRampToValueAtTime(0.0001, t + beat * 4);
          b.connect(bg).connect(out);
          b.start(t);
          b.stop(t + beat * 4 + 0.1);
          oscs.push(b);
        }
        t += d * beat;
      });
      const duration = t - t0();
      return {
        duration,
        stop() {
          try { out.gain.setTargetAtTime(0, t0(), 0.05); lfo.stop(t0() + 0.3); } catch (e) { /* ok */ }
        }
      };
    },

    // --- ambient bed: PC fan + failing HDD + level-driven drone ---
    startAmbient() {
      if (!ctx || ambient) return;
      const fan = noiseSrc(true);
      const ff = ctx.createBiquadFilter();
      ff.type = 'lowpass';
      ff.frequency.value = 420;
      const fg = gainNode(0.05, amb);
      fan.connect(ff).connect(fg);
      fan.start();
      const mains = osc('sine', 120);
      const mg = gainNode(0.008, amb);
      mains.connect(mg);
      mains.start();

      const dg = gainNode(0, amb);
      const df = ctx.createBiquadFilter();
      df.type = 'lowpass';
      df.frequency.value = 160;
      df.connect(dg);
      const d1 = osc('sawtooth', 41.2, df);
      const d2 = osc('sawtooth', 41.5, df);
      const d3 = osc('sine', 82.6, dg);
      [d1, d2, d3].forEach((o) => o.start());

      const ring = osc('sine', 3150);
      const rg = gainNode(0, amb);
      ring.connect(rg);
      ring.start();

      ambient = { fg, dg, rg, df, level: 0, hddTimer: null };
      const hddLoop = () => {
        if (!ambient) return;
        const lvl = ambient.level;
        if (Math.random() < 0.08 + lvl * 0.04) A.play('hddDeath');
        else A.play('hdd');
        ambient.hddTimer = setTimeout(hddLoop, U.rand(1500, 7000) / (1 + lvl * 0.35));
      };
      ambient.hddTimer = setTimeout(hddLoop, 2500);
    },

    setAmbientLevel(lvl) {
      if (!ambient) return;
      ambient.level = lvl;
      const t = t0();
      const drone = [0, 0.03, 0.07, 0.12, 0.17][U.clamp(lvl, 0, 4)];
      ambient.dg.gain.setTargetAtTime(drone, t, 3);
      ambient.df.frequency.setTargetAtTime(160 + lvl * 50, t, 3);
      ambient.rg.gain.setTargetAtTime(lvl >= 3 ? 0.004 : 0, t, 4);
      ambient.fg.gain.setTargetAtTime(lvl >= 4 ? 0.02 : 0.05, t, 2);
    },

    duckAmbient(on) {
      if (!ambient) return;
      amb.gain.setTargetAtTime(on ? 0.15 : 1, t0(), 0.3);
    },

    stopAmbient() {
      if (!ambient) return;
      clearTimeout(ambient.hddTimer);
      amb.gain.setTargetAtTime(0, t0(), 0.2);
      const a = ambient;
      ambient = null;
      setTimeout(() => { try { a.fg.disconnect(); a.dg.disconnect(); a.rg.disconnect(); } catch (e) { /* ok */ } amb.gain.value = 1; }, 600);
    },

    silenceAll(ms = 400) {
      if (!master) return;
      master.gain.setTargetAtTime(0, t0(), 0.02);
      setTimeout(() => master.gain.setTargetAtTime(G.meta.volume, t0(), 0.1), ms);
    },

    // --- text to speech (Windows SAPI voices sound period-correct) ---
    hasVoice() { return 'speechSynthesis' in window && voices.length > 0; },

    speak(text, opts = {}) {
      const est = 900 + String(text).length * 75 / (opts.rate || 0.85);
      return new Promise((resolve) => {
        if (!A.hasVoice() || G.meta.volume === 0) { setTimeout(resolve, opts.wait === false ? 0 : est); return; }
        let done = false;
        const fin = () => { if (!done) { done = true; resolve(); } };
        try {
          const u = new SpeechSynthesisUtterance(text);
          const en = voices.filter((v) => /^en/i.test(v.lang));
          const pref = en.find((v) => /david|mark|george|male|daniel|guy/i.test(v.name)) || en[0] || voices[0];
          if (pref) u.voice = pref;
          u.rate = opts.rate ?? 0.85;
          u.pitch = opts.pitch ?? 0.5;
          u.volume = (opts.volume ?? 1) * G.meta.volume;
          u.onend = fin;
          u.onerror = fin;
          speechSynthesis.speak(u);
        } catch (e) { fin(); }
        setTimeout(fin, est * 1.8 + 1500);
      });
    },

    stopSpeech() {
      try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* ok */ }
    }
  };

  G.audio = A;
})(window.G);
