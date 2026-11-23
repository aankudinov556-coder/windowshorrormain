// The Channel 12 recordings. Every tape is a list of procedurally drawn
// scenes (320x240 canvas) with sound cues. The TV app adds the VHS look.
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;
  const W = 320, H = 240;

  // ---------- drawing helpers ----------
  const snowFrames = [];
  function buildSnow() {
    for (let f = 0; f < 6; f++) {
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const x = c.getContext('2d');
      const img = x.createImageData(W, H);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() < 0.5 ? Math.random() * 90 : 90 + Math.random() * 165;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      snowFrames.push(c);
    }
  }

  const T = {};

  T.snow = function (ctx, alpha = 1) {
    if (!snowFrames.length) buildSnow();
    ctx.save();
    ctx.globalAlpha = alpha;
    const f = snowFrames[Math.floor(Math.random() * snowFrames.length)];
    ctx.drawImage(f, -Math.random() * 20, -Math.random() * 20, W + 20, H + 20);
    ctx.restore();
  };

  T.black = function (ctx) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); };

  // Draws text; shrinks the font when a (translated) line is too wide for the frame.
  T.text = function (ctx, str, x, y, o = {}) {
    ctx.save();
    const family = o.font || '"Courier New", "Liberation Mono", monospace';
    let size = o.size || 14;
    ctx.font = (o.weight || 'bold') + ' ' + size + 'px ' + family;
    const maxW = o.maxW || (o.align === 'left' ? W - x - 6 : W - 14);
    const w = ctx.measureText(str).width;
    if (w > maxW && o.fit !== false) {
      size = Math.max(7, Math.floor(size * maxW / w));
      ctx.font = (o.weight || 'bold') + ' ' + size + 'px ' + family;
    }
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = 'middle';
    if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,.8)'; ctx.fillText(str, x + 1.5, y + 1.5); }
    ctx.fillStyle = o.color || '#fff';
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.fillText(str, x, y);
    ctx.restore();
  };

  T.wrap = function (ctx, str, maxW) {
    const words = String(str).split(' ');
    const lines = [];
    let line = '';
    words.forEach((w) => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    });
    if (line) lines.push(line);
    return lines;
  };

  T.card = function (ctx, lines, o = {}) {
    ctx.fillStyle = o.bg || '#000';
    ctx.fillRect(0, 0, W, H);
    const size = o.size || 16;
    const lh = size * 1.5;
    const y0 = H / 2 - ((lines.length - 1) * lh) / 2 + (o.dy || 0);
    lines.forEach((l, i) => T.text(ctx, U.fill(l), W / 2, y0 + i * lh, { size, color: o.color || '#fff', font: o.font, alpha: o.alpha }));
  };

  T.bars = function (ctx, o = {}) {
    let top = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    const mid = ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0'];
    if (o.wrong) top = ['#606060', '#606000', '#006060', '#003000', '#300030', '#600000', '#000030'];
    const bw = W / 7;
    top.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * bw, 0, bw + 1, H * 0.67); });
    mid.forEach((c, i) => { ctx.fillStyle = o.wrong ? '#111' : c; ctx.fillRect(i * bw, H * 0.67, bw + 1, H * 0.08); });
    const bot = [['#00214c', 1.25], ['#ffffff', 1.25], ['#32006a', 1.25], ['#131313', 1.25], ['#090909', 0.33], ['#131313', 0.34], ['#1d1d1d', 0.33], ['#131313', 1]];
    let x = 0;
    bot.forEach(([c, w]) => { ctx.fillStyle = o.wrong ? '#0a0a0a' : c; ctx.fillRect(x, H * 0.75, bw * w + 1, H * 0.25); x += bw * w; });
    if (o.figureBar) {
      ctx.fillStyle = '#000';
      ctx.fillRect(bw * 4, 0, bw, H * 0.67);
      G.wallpaper.figure(ctx, bw * 4.5, H * 0.66, 120, '#c0c0c0', 0.9);
    }
  };

  T.logo12 = function (ctx, cx, cy, r, o = {}) {
    ctx.save();
    ctx.strokeStyle = o.ring || '#e8c040';
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    T.text(ctx, '12', cx, cy + r * 0.06, { size: Math.round(r * 1.1), color: o.color || '#fff', font: 'Arial, "Liberation Sans", sans-serif' });
  };

  T.stationId = function (ctx, tm, o = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, o.wrong ? '#141414' : '#0d2266');
    g.addColorStop(1, o.wrong ? '#1a0505' : '#020a26');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = o.wrong ? 'rgba(255,0,0,.05)' : 'rgba(120,170,255,.08)';
      ctx.beginPath();
      ctx.arc(W / 2, 92, 52 + i * 14 + ((tm * 18) % 14), 0, Math.PI * 2);
      ctx.stroke();
    }
    T.logo12(ctx, W / 2, 92, 46, { ring: o.wrong ? '#8a7a50' : '#e8c040' });
    T.text(ctx, o.line1 || t('tp.hvb'), W / 2, 168, { size: 13, font: 'Arial, "Liberation Sans", sans-serif' });
    T.text(ctx, o.line2 || t('tp.hvbSub'), W / 2, 188, { size: 10, color: '#cdd8ff', weight: 'normal', font: 'Arial, "Liberation Sans", sans-serif' });
  };

  T.towerNight = function (ctx, tm, o = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05081a');
    g.addColorStop(1, o.red ? '#4a0a08' : '#28304e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) {
      const sx = (i * 73) % W, sy = (i * 37) % 120;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.3 * Math.sin(tm * 2 + i)) + ')';
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.fillStyle = '#05070c';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, 185 - 40 * Math.exp(-Math.pow((x - 200) / 90, 2)));
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.strokeStyle = '#0c0f18';
    ctx.lineWidth = 1.2;
    const bx = 200, by = 146, top = 30;
    for (let i = 0; i < 10; i++) {
      const y0 = by - (by - top) * i / 10, y1 = by - (by - top) * (i + 1) / 10;
      const w0 = 14 - 11 * i / 10, w1 = 14 - 11 * (i + 1) / 10;
      ctx.beginPath();
      ctx.moveTo(bx - w0, y0); ctx.lineTo(bx - w1, y1);
      ctx.moveTo(bx + w0, y0); ctx.lineTo(bx + w1, y1);
      ctx.moveTo(bx - w0, y0); ctx.lineTo(bx + w1, y1);
      ctx.moveTo(bx + w0, y0); ctx.lineTo(bx - w1, y1);
      ctx.stroke();
    }
    if (Math.sin(tm * 3) > 0) {
      ctx.fillStyle = '#ff2a1a';
      ctx.beginPath(); ctx.arc(bx, top - 2, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,40,20,.25)';
      ctx.beginPath(); ctx.arc(bx, top - 2, 7, 0, Math.PI * 2); ctx.fill();
    }
    if (o.figure) G.wallpaper.figure(ctx, o.figureX || 180, 150, o.figure, '#000', 1);
    if (o.text) T.text(ctx, o.text, W / 2, 212, { size: 12 });
  };

  // A seated, impossibly tall figure. lean: 0 = head out of frame, 1 = head close to camera.
  T.seated = function (ctx, cx, lean, scale = 1, color = '#050505', rim) {
    const s = scale;
    const sh = -30 + lean * 70; // shoulder line
    ctx.save();
    ctx.fillStyle = color;
    if (rim) { ctx.shadowColor = rim; ctx.shadowBlur = 6; }
    ctx.beginPath();
    ctx.moveTo(cx - 30 * s, sh);
    ctx.quadraticCurveTo(cx, sh - 8 * s, cx + 30 * s, sh);
    ctx.lineTo(cx + 24 * s, 170);
    ctx.lineTo(cx - 24 * s, 170);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - 6 * s, sh - 22 * s, 12 * s, 24 * s);
    ctx.beginPath();
    ctx.ellipse(cx, sh - 22 * s - 22 * s, 15 * s * (1 + lean * 0.6), 22 * s * (1 + lean * 0.6), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 7 * s;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 28 * s, sh + 6);
    ctx.quadraticCurveTo(cx - 70 * s, 110, cx - 75 * s, 166);
    ctx.moveTo(cx + 28 * s, sh + 6);
    ctx.quadraticCurveTo(cx + 70 * s, 110, cx + 75 * s, 166);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx - 75 * s + i * 3, 166); ctx.lineTo(cx - 62 * s + i * 4, 176 + i); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 75 * s - i * 3, 166); ctx.lineTo(cx + 62 * s - i * 4, 176 + i); ctx.stroke();
    }
    ctx.restore();
  };

  T.studio = function (ctx, tm, o = {}) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, o.dark ? '#0a0e1e' : '#1c2f66');
    g.addColorStop(1, o.dark ? '#020308' : '#0a1236');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = 'rgba(255,255,255,' + (o.dark ? 0.015 : 0.05) + ')';
      ctx.fillRect(14 + i * 52, 18, 38, 128);
    }
    T.logo12(ctx, 262, 60, 22, { ring: o.dark ? '#6a5a30' : '#e8c040' });
    if (o.seated) T.seated(ctx, 160, o.lean || 0, 1, '#040404');
    if (o.guest) {
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath(); ctx.ellipse(160, 108, 13, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(130, 170); ctx.quadraticCurveTo(160, 112, 190, 170); ctx.fill();
    }
    ctx.fillStyle = o.dark ? '#15151c' : '#3a3a4c';
    ctx.beginPath();
    ctx.moveTo(40, 160); ctx.lineTo(280, 160); ctx.lineTo(306, 240); ctx.lineTo(14, 240);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = o.dark ? '#25252e' : '#6e6e88';
    ctx.fillRect(40, 158, 240, 4);
    ctx.fillStyle = o.dark ? '#3a0c0a' : '#a8302a';
    ctx.fillRect(70, 182, 180, 16);
    T.text(ctx, t('tp.news'), 160, 190, { size: 10, font: 'Arial, sans-serif', maxW: 172 });
    if (o.lower) {
      const lg = ctx.createLinearGradient(0, 0, W, 0);
      lg.addColorStop(0, '#0b2a8a');
      lg.addColorStop(1, 'rgba(11,42,138,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 204, W, 22);
      ctx.fillStyle = '#c8241c';
      ctx.fillRect(8, 207, 34, 16);
      T.text(ctx, t('tp.live'), 25, 215, { size: 10, font: 'Arial, sans-serif', maxW: 32 });
      T.text(ctx, U.fill(o.lower), 50, 215, { size: 11, align: 'left', font: 'Arial, sans-serif' });
    }
  };

  T.house = function (ctx, tm, o = {}) {
    const z = o.zoom || 1;
    ctx.save();
    ctx.fillStyle = '#04050b';
    ctx.fillRect(0, 0, W, H);
    ctx.translate(207, 135);
    ctx.scale(z, z);
    ctx.translate(-207 + Math.sin(tm * 1.3) * 1.5, -135 + Math.cos(tm * 0.9) * 1.2);
    for (let i = 0; i < 30; i++) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect((i * 97) % W, (i * 41) % 70, 1, 1); }
    ctx.fillStyle = '#07080a';
    ctx.fillRect(-200, 178, 720, 200);
    ctx.fillStyle = '#0c0d13';
    ctx.fillRect(120, 100, 165, 80);
    ctx.fillStyle = '#08090d';
    ctx.beginPath(); ctx.moveTo(108, 101); ctx.lineTo(202, 48); ctx.lineTo(297, 101); ctx.fill();
    ctx.fillStyle = '#101218';
    ctx.fillRect(138, 120, 30, 28);
    const lit = o.lightsOff ? 0 : (o.flicker && Math.random() < 0.3 ? 0.35 : 1);
    if (lit) {
      const wg = ctx.createRadialGradient(207, 135, 2, 207, 135, 40);
      wg.addColorStop(0, 'rgba(255,210,120,' + 0.35 * lit + ')');
      wg.addColorStop(1, 'rgba(255,210,120,0)');
      ctx.fillStyle = wg;
      ctx.fillRect(160, 95, 95, 85);
      ctx.fillStyle = 'rgba(243,196,106,' + lit + ')';
      ctx.fillRect(190, 120, 34, 30);
      ctx.fillStyle = 'rgba(120,160,255,' + 0.6 * lit + ')';
      ctx.fillRect(207, 136, 10, 8);
      ctx.fillStyle = '#1a1208';
      ctx.beginPath(); ctx.ellipse(199, 138, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(193, 142, 12, 8);
    } else {
      ctx.fillStyle = '#0a0b10';
      ctx.fillRect(190, 120, 34, 30);
    }
    ctx.strokeStyle = '#1a1308';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(190, 120, 34, 30);
    ctx.beginPath(); ctx.moveTo(207, 120); ctx.lineTo(207, 150); ctx.moveTo(190, 135); ctx.lineTo(224, 135); ctx.stroke();
    ctx.fillStyle = '#0e0f15';
    ctx.fillRect(240, 140, 22, 40);
    ctx.fillStyle = '#060607';
    ctx.fillRect(40, 70, 3, 112);
    const lg = ctx.createRadialGradient(42, 72, 1, 42, 72, 60);
    lg.addColorStop(0, 'rgba(255,190,110,.5)');
    lg.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(-20, 10, 130, 180);
    ctx.fillStyle = '#030304';
    ctx.beginPath(); ctx.arc(320, 120, 50, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-10, 140, 40, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  // A dark room: someone at a glowing monitor. The monitor shows the previous frame.
  T.room = function (ctx, tm, o = {}, prev) {
    ctx.fillStyle = '#030305';
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(170, 120, 5, 170, 120, 150);
    glow.addColorStop(0, 'rgba(70,110,230,.32)');
    glow.addColorStop(1, 'rgba(70,110,230,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0b0a0c';
    ctx.fillRect(20, 168, 280, 72);
    ctx.fillStyle = '#101014';
    ctx.fillRect(118, 70, 104, 92);
    ctx.fillRect(150, 160, 40, 10);
    if (prev) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(prev, 128, 78, 84, 64);
      ctx.restore();
    }
    ctx.fillStyle = o.white ? 'rgba(255,255,255,.9)' : 'rgba(90,140,255,.35)';
    ctx.fillRect(128, 78, 84, 64);
    if (o.figure) {
      const a = U.clamp(o.figure, 0, 1);
      const lean = o.lean || 0;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#000';
      ctx.shadowColor = 'rgba(90,130,255,.5)';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(250, -10);
      ctx.quadraticCurveTo(255, 40, 225 - lean * 25, 70 + lean * 20);
      ctx.lineTo(205 - lean * 25, 70 + lean * 20);
      ctx.quadraticCurveTo(220, 30, 200, -10);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(208 - lean * 28, 82 + lean * 22, 15 + lean * 4, 21 + lean * 5, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(240, 20);
      ctx.quadraticCurveTo(250, 120, 215 - lean * 10, 150);
      ctx.stroke();
      ctx.restore();
    }
    if (!o.empty) {
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(170, 128, 15, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(128, 200); ctx.quadraticCurveTo(170, 132, 212, 200); ctx.lineTo(212, 240); ctx.lineTo(128, 240); ctx.fill();
    }
    ctx.fillStyle = '#020202';
    ctx.beginPath();
    ctx.moveTo(118, 175); ctx.lineTo(222, 175); ctx.lineTo(226, 240); ctx.lineTo(114, 240);
    ctx.fill();
  };

  T.eas = function (ctx, tm, o = {}) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = o.red ? '#7a0000' : '#b00000';
    ctx.fillRect(0, 0, W, 30);
    T.text(ctx, t('tp.eas'), W / 2, 15, { size: 14, font: 'Arial, "Liberation Sans", sans-serif' });
    ctx.font = 'bold 12px "Courier New", monospace';
    const lines = [];
    (o.lines || []).forEach((l) => T.wrap(ctx, U.fill(l), W - 40).forEach((x) => lines.push(x)));
    const y0 = o.top || 60;
    lines.forEach((l, i) => T.text(ctx, l, W / 2, y0 + i * 17, { size: 12, color: o.color || '#fff' }));
    if (o.crawl) {
      ctx.fillStyle = '#101010';
      ctx.fillRect(0, 210, W, 22);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 210, W, 1);
      ctx.font = 'bold 12px Arial, sans-serif';
      const txt = U.fill(o.crawl);
      const tw = ctx.measureText(txt).width;
      const x = W - ((tm * 55) % (tw + W));
      T.text(ctx, txt, x, 221, { size: 12, align: 'left', font: 'Arial, sans-serif' });
    }
  };

  T.lateProgram = function (ctx, tm) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2a0a4a');
    g.addColorStop(1, '#b0401a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(tm * 0.2);
    for (let i = 0; i < 16; i++) {
      ctx.rotate(Math.PI / 8);
      ctx.fillStyle = i % 2 ? 'rgba(255,220,120,.08)' : 'rgba(255,255,255,.03)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(300, -40); ctx.lineTo(300, 40); ctx.fill();
    }
    ctx.restore();
    T.text(ctx, t('tp.the'), W / 2, 82, { size: 16, color: '#ffe08a', font: 'Georgia, serif' });
    T.text(ctx, t('tp.lateProgram'), W / 2, 112, { size: 28, color: '#ffd23a', font: 'Georgia, "DejaVu Serif", serif' });
    T.text(ctx, t('tp.onCh12'), W / 2, 146, { size: 12, color: '#ffe8c0', weight: 'italic', font: 'Georgia, serif' });
  };

  // ---------- the tapes ----------
  // Each scene: { d: seconds, draw(ctx, t, k, p), enter(p), exit(p) }
  // p.say(key, opts) speaks a pack line (recorded voice file if the language has one, else TTS)
  // and shows it as a caption.
  const say = (key, o) => (p) => p.say(key, o);
  const lines = (key) => t(key);

  G.tapes = {
    t_signoff: {
      title: () => t('tape.t_signoff'),
      date: new Date(2003, 8, 1, 2, 0, 4),
      scenes: [
        { d: 3, draw: (c) => T.snow(c), enter: (p) => p.hiss() },
        { d: 13, draw: (c, tt) => T.stationId(c, tt), enter: say('tp.s.say', { rate: 1, pitch: 0.9, caption: 'tp.s.cap' }) },
        { d: 14, draw: (c, tt) => T.towerNight(c, tt, { text: t('tp.goodnightHV') }), enter: (p) => p.sound(G.audio.anthem(false)) },
        { d: 8, draw: (c) => T.bars(c), enter: (p) => p.sound(G.audio.tone(1000, 0.06)) },
        { d: 4, draw: (c) => T.snow(c), enter: (p) => p.hiss() }
      ]
    },

    t_return: {
      title: () => t('tape.t_return'),
      date: new Date(2003, 8, 16, 3, 33, 0),
      scenes: [
        { d: 4, draw: (c) => T.snow(c), enter: (p) => p.hiss() },
        { d: 15, draw: (c, tt, k) => T.stationId(c, tt, { wrong: true, line1: k > 0.6 ? t('tp.receiving') : t('tp.hvb'), line2: t('tp.returnSub') }),
          enter: (p) => { p.sound(G.audio.hum(0.06, 49)); p.say('tp.r.say1', { rate: 0.55, pitch: 0.1 }); p.later(8000, () => p.say('tp.r.say2', { rate: 0.5, pitch: 0.05 })); } },
        { d: 11, draw: (c, tt) => T.bars(c, { wrong: true, figureBar: tt > 6 }), enter: (p) => { const h = G.audio.tone(740, 0.05); p.sound(h); p.later(4000, () => h.set(700)); } },
        { d: 9, draw: (c, tt) => T.card(c, tt < 4.5 ? lines('tp.r.card1') : lines('tp.r.card2'), { size: 13 }), enter: (p) => p.sound(G.audio.hum(0.08, 41)) },
        { d: 5, draw: (c, tt) => { T.snow(c); if (tt > 3.2 && tt < 3.32) T.card(c, [t('tp.r.who')], { bg: '#000', size: 20 }); }, enter: (p) => p.hiss() }
      ]
    },

    t_host: {
      title: () => t('tape.t_host'),
      date: new Date(2003, 8, 22, 3, 33, 0),
      scenes: [
        { d: 3, draw: (c) => T.snow(c), enter: (p) => p.hiss() },
        { d: 6, draw: (c, tt) => T.lateProgram(c, tt), enter: () => G.audio.play('jingle') },
        { d: 11, draw: (c, tt) => T.studio(c, tt, { lower: t('tp.h.lowerLive') }), enter: (p) => p.sound(G.audio.hum(0.05, 55)) },
        { d: 0.6, draw: (c) => T.snow(c), enter: () => G.audio.play('staticShort') },
        { d: 16, draw: (c, tt, k) => T.studio(c, tt, { seated: true, lean: k * 0.45, lower: t('tp.h.lowerHost'), dark: true }),
          enter: (p) => { p.sound(G.audio.hum(0.09, 41)); p.later(2500, () => p.say('tp.h.say', { rate: 0.6, pitch: 0.05 })); } },
        { d: 5, draw: (c, tt, k) => T.studio(c, tt, { seated: true, lean: 0.45 + k * 0.9, dark: true }), enter: () => G.audio.play('whisper') },
        { d: 1.2, draw: (c) => { T.black(c); T.snow(c, 0.3); }, enter: () => G.audio.play('static') },
        { d: 5, draw: (c) => T.snow(c), enter: (p) => p.hiss() }
      ]
    },

    t_eas: {
      title: () => t('tape.t_eas'),
      date: new Date(2003, 8, 30, 3, 33, 0),
      scenes: [
        { d: 3, draw: (c) => T.snow(c), enter: (p) => p.hiss() },
        { d: 9, draw: (c, tt) => T.eas(c, tt, { lines: lines('tp.e.intro') }), enter: (p) => p.sound(G.audio.eas(0.06)) },
        { d: 32, draw: (c, tt) => {
          const names = lines('tp.e.names');
          const shown = names.slice(0, Math.max(0, Math.floor((tt - 13) / 3.2)));
          T.eas(c, tt, { top: 52, lines: [t('tp.e.header'), ''].concat(shown), crawl: t('tp.e.crawl') });
        }, enter: (p) => {
          p.sound(G.audio.hum(0.04, 60));
          p.say('tp.e.say1', { rate: 0.8, pitch: 0.3, noCaption: true });
          p.later(13500, () => p.say('tp.e.say2', { rate: 0.45, pitch: 0.2, noCaption: true }));
        } },
        { d: 6, draw: (c, tt) => T.eas(c, tt, { red: true, color: '#ff4a3a', top: 100, lines: lines('tp.e.final') }), enter: (p) => { p.sound(G.audio.eas(0.07)); } },
        { d: 4, draw: (c) => T.snow(c), enter: (p) => p.hiss() }
      ]
    },

    t_outside: {
      title: () => t('tape.t_outside'),
      date: new Date(2003, 9, 9, 3, 33, 0),
      scenes: [
        { d: 3, draw: (c) => T.snow(c), enter: (p) => p.hiss() },
        { d: 34, draw: (c, tt, k) => {
          T.house(c, tt, { zoom: 1 + k * 1.4, flicker: tt > 24 });
          if (tt > 12 && tt < 20) T.text(c, t('tp.o.outside'), 160, 210, { size: 14 });
          if (tt > 26) T.text(c, t('tp.o.stillUp'), 160, 210, { size: 14 });
        }, enter: (p) => { p.sound(G.audio.hum(0.07, 46)); p.later(25000, () => G.audio.play('whisper')); p.later(29000, () => p.say('tp.o.say', { rate: 0.5, pitch: 0.01 })); } },
        { d: 3, draw: (c, tt) => T.house(c, tt, { zoom: 2.4, lightsOff: true }), enter: () => G.audio.play('thump') },
        { d: 4, draw: (c) => T.snow(c), enter: (p) => p.hiss() }
      ]
    },

    t_inside: {
      title: () => t('tape.t_inside'),
      date: new Date(2003, 9, 14, 3, 33, 0),
      scenes: [
        { d: 3, draw: (c) => T.snow(c), enter: (p) => p.hiss() },
        { d: 27, draw: (c, tt, k, p) => T.room(c, tt, { figure: Math.max(0, (k - 0.2) * 1.4), lean: Math.max(0, k - 0.5) }, p.prev), enter: (p) => { p.sound(G.audio.hum(0.08, 44)); p.later(9000, () => G.audio.play('hdd')); p.later(15000, () => G.audio.play('hddDeath')); } },
        { d: 6, draw: (c, tt, k, p) => { T.room(c, tt, { figure: 1, lean: 0.6 }, p.prev); T.text(c, t('tp.i.thanks'), 160, 218, { size: 12 }); }, enter: say('tp.i.say', { rate: 0.55, pitch: 0.05, noCaption: true }) },
        { d: 6, draw: (c, tt, k, p) => T.room(c, tt, { figure: 1, lean: 1, white: k > 0.5, empty: k > 0.75 }, p.prev), enter: () => { G.audio.play('sting'); } },
        { d: 6, draw: (c, tt) => T.card(c, tt < 2.5 ? [t('tp.i.next')] : [t('tp.i.next'), '', G.state.level >= 2 ? '{USER}' : t('tp.i.you')], { size: 15 }), enter: (p) => p.sound(G.audio.hum(0.06, 41)) },
        { d: 4, draw: (c) => T.card(c, [t('tp.stayTuned')], { size: 22 }), enter: () => G.audio.play('thump') },
        { d: 3, draw: (c) => T.snow(c), enter: (p) => p.hiss() }
      ]
    },

    t_live: {
      title: () => t('tape.t_live'),
      live: true,
      date: null,
      scenes: [
        { d: 2, draw: (c) => T.snow(c), enter: (p) => p.hiss() },
        { d: 26, draw: (c, tt, k, p) => {
          T.room(c, tt, { figure: k * 1.1, lean: Math.max(0, k - 0.4) }, p.prev);
          if (Math.sin(tt * 4) > 0) { c.fillStyle = '#e11'; c.beginPath(); c.arc(16, 16, 5, 0, Math.PI * 2); c.fill(); }
          T.text(c, t('tp.live'), 28, 16, { size: 12, color: '#fff', align: 'left' });
          if (tt > 4 && tt < 10) T.text(c, U.fill(t('tp.l.goodEvening')), 160, 214, { size: 12 });
          if (tt > 11 && tt < 18) T.text(c, t('tp.l.watching', { n: Math.max(1, Math.round(G.state.playMs / 60000)) }), 160, 214, { size: 11 });
          if (tt > 19) T.text(c, t('tp.l.dontTurn'), 160, 214, { size: 13 });
        }, enter: (p) => {
          p.sound(G.audio.hum(0.09, 41));
          p.later(4500, () => p.say('tp.l.sayEvening', { rate: 0.55, pitch: 0.05, noCaption: true }));
          p.later(19500, () => p.say('tp.l.sayDont', { rate: 0.5, pitch: 0.01, noCaption: true }));
        } },
        { d: 5, draw: (c, tt, k, p) => { T.room(c, tt, { figure: 1, lean: 1.2 }, p.prev); T.text(c, t('tp.l.leaning'), 160, 214, { size: 12 }); }, enter: () => G.audio.play('whisper') },
        { d: 3, draw: (c) => T.card(c, [t('tp.stayTuned')], { size: 22, bg: '#100' }), enter: () => G.audio.play('thump') },
        { d: 2, draw: (c) => T.snow(c), enter: (p) => p.hiss() }
      ]
    }
  };

  // ---------- live channel content (tuner mode) ----------
  G.liveChannel = function (ctx, ch, tt) {
    const L = G.state.level;
    if (ch !== 12) { T.snow(ctx); return; }
    if (L <= 1) {
      T.stationId(ctx, tt, { wrong: true });
      T.snow(ctx, 0.82);
      return;
    }
    if (L === 2) {
      T.bars(ctx, { wrong: true });
      ctx.fillStyle = 'rgba(0,0,0,.7)';
      ctx.fillRect(30, 92, 260, 56);
      T.text(ctx, t('tp.c.standby'), 160, 112, { size: 16 });
      T.text(ctx, t('tp.c.begin'), 160, 132, { size: 10 });
      T.snow(ctx, 0.15);
      return;
    }
    if (L === 3) {
      T.studio(ctx, tt, { seated: true, lean: 0.35 + Math.sin(tt * 0.3) * 0.05, dark: true, lower: t('tp.c.watching', { time: U.fmtClock(new Date()) }) });
      T.snow(ctx, 0.12);
      return;
    }
    T.studio(ctx, tt, { guest: true, dark: true, lower: t('tp.c.guest') });
    if (Math.floor(tt) % 9 < 3) T.text(ctx, t('tp.c.signItOff'), 160, 40, { size: 14, color: '#ddd' });
    T.snow(ctx, 0.18);
  };

  G.tapeArt = T;
})(window.G);
