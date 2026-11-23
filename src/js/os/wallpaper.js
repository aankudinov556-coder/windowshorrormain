// Procedural wallpaper: "Pell Hill" — rolling hills and the Channel 12
// transmitter tower. It is redrawn for each infection level: the sky
// darkens and a figure walks closer every time.
(function (G) {
  'use strict';

  const W = 1024, H = 738;

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const farY = (x) => 470 - 112 * Math.exp(-Math.pow((x - 770) / 260, 2)) - 30 * Math.exp(-Math.pow((x - 200) / 200, 2));
  const nearY = (x) => 600 - 110 * Math.exp(-Math.pow((x - 250) / 350, 2)) + 40 * (x / W);

  const PAL = [
    { sky: ['#1b5bd0', '#4f9cef', '#cfe8fb'], far: ['#4f9a36', '#2f7a22'], near: ['#6cbf3c', '#2e8a1e'], cloud: 0.85, sun: true },
    { sky: ['#2159bd', '#5a9add', '#d4e4ef'], far: ['#4c9036', '#2c6e22'], near: ['#66b23c', '#2c7f1e'], cloud: 0.75, sun: false },
    { sky: ['#1f1d4a', '#8a3f5a', '#f0955a'], far: ['#3a4a2a', '#202a16'], near: ['#45552a', '#1f2a12'], cloud: 0.35, sun: false },
    { sky: ['#010208', '#0a1430', '#2a3552'], far: ['#0c140c', '#050805'], near: ['#0e180c', '#040604'], cloud: 0, stars: true },
    { sky: ['#160000', '#7a0a06', '#d0300f'], far: ['#120404', '#050101'], near: ['#160505', '#050101'], cloud: 0, stars: false }
  ];

  function vgrad(ctx, y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
  }

  function hill(ctx, fn, colors, y0) {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, fn(x));
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = vgrad(ctx, y0, H, colors);
    ctx.fill();
  }

  function clouds(ctx, r, alpha) {
    if (!alpha) return;
    for (let i = 0; i < 7; i++) {
      const cx = r() * W, cy = 60 + r() * 220, s = 40 + r() * 90;
      for (let j = 0; j < 6; j++) {
        const x = cx + (r() - 0.5) * s * 2.2, y = cy + (r() - 0.5) * s * 0.4, rad = s * (0.4 + r() * 0.5);
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.55 * alpha) + ')');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x, y, rad * 1.6, rad * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function tower(ctx, level) {
    const bx = 770, by = farY(770) + 4, top = 96, wBase = 28, wTop = 4;
    const dark = level >= 3;
    // guy wires
    ctx.strokeStyle = dark ? 'rgba(120,120,140,0.25)' : 'rgba(230,230,230,0.55)';
    ctx.lineWidth = 0.7;
    [[640, farY(640)], [900, farY(900)], [690, farY(690)], [860, farY(860)]].forEach(([gx, gy], i) => {
      ctx.beginPath();
      ctx.moveTo(bx, top + 40 + (i % 2) * 70);
      ctx.lineTo(gx, gy + 2);
      ctx.stroke();
    });
    const segs = 14;
    for (let i = 0; i < segs; i++) {
      const y0 = by - (by - top) * (i / segs), y1 = by - (by - top) * ((i + 1) / segs);
      const w0 = wBase + (wTop - wBase) * (i / segs), w1 = wBase + (wTop - wBase) * ((i + 1) / segs);
      const red = i % 2 === 0;
      let col = red ? '#c8322a' : '#f2f2f2';
      if (level === 2) col = red ? '#7a2420' : '#b0a8a0';
      if (level >= 3) col = red ? '#2a0a0a' : '#1a1a1e';
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(bx - w0 / 2, y0); ctx.lineTo(bx - w1 / 2, y1);
      ctx.moveTo(bx + w0 / 2, y0); ctx.lineTo(bx + w1 / 2, y1);
      ctx.moveTo(bx - w0 / 2, y0); ctx.lineTo(bx + w1 / 2, y1);
      ctx.moveTo(bx + w0 / 2, y0); ctx.lineTo(bx - w1 / 2, y1);
      ctx.moveTo(bx - w1 / 2, y1); ctx.lineTo(bx + w1 / 2, y1);
      ctx.stroke();
    }
    ctx.strokeStyle = level >= 3 ? '#222' : '#ddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, top);
    ctx.lineTo(bx, top - 34);
    ctx.stroke();
    // small transmitter shed
    ctx.fillStyle = level >= 3 ? '#0a0a0a' : level === 2 ? '#5a5048' : '#d8d0c0';
    ctx.fillRect(bx + 22, by - 12, 26, 13);
    ctx.fillStyle = level >= 3 ? '#140c0c' : '#8a4a3a';
    ctx.fillRect(bx + 20, by - 15, 30, 4);
    return [{ x: bx, y: top - 34 }, { x: bx, y: top + (by - top) * 0.45 }];
  }

  // A tall, thin, faceless silhouette.
  function figure(ctx, x, feet, h, color = '#050505', alpha = 1) {
    const head = h * 0.06;
    const sh = h * 0.13;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.filter = 'blur(' + Math.max(0.4, h / 260) + 'px)';
    ctx.beginPath();
    ctx.ellipse(x, feet - h + head, head * 0.85, head * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    const ny = feet - h + head * 2.1;
    ctx.moveTo(x - head * 0.3, ny);
    ctx.lineTo(x - sh / 2, ny + h * 0.05);
    ctx.lineTo(x - sh / 2 - h * 0.035, feet - h * 0.3); // left arm, too long
    ctx.lineTo(x - sh / 2 - h * 0.012, feet - h * 0.3);
    ctx.lineTo(x - sh * 0.36, ny + h * 0.18);
    ctx.lineTo(x - sh * 0.28, feet - h * 0.47);
    ctx.lineTo(x - sh * 0.3, feet);
    ctx.lineTo(x - sh * 0.1, feet);
    ctx.lineTo(x, feet - h * 0.42);
    ctx.lineTo(x + sh * 0.1, feet);
    ctx.lineTo(x + sh * 0.3, feet);
    ctx.lineTo(x + sh * 0.28, feet - h * 0.47);
    ctx.lineTo(x + sh * 0.36, ny + h * 0.18);
    ctx.lineTo(x + sh / 2 + h * 0.012, feet - h * 0.3);
    ctx.lineTo(x + sh / 2 + h * 0.035, feet - h * 0.3);
    ctx.lineTo(x + sh / 2, ny + h * 0.05);
    ctx.lineTo(x + head * 0.3, ny);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Head and shoulders rising behind the hill — "leaning toward whoever is watching".
  function giant(ctx) {
    ctx.save();
    ctx.filter = 'blur(3px)';
    ctx.fillStyle = '#020000';
    ctx.beginPath();
    ctx.ellipse(470, 250, 95, 125, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(380, 340);
    ctx.quadraticCurveTo(300, 360, 150, 440);
    ctx.lineTo(820, 460);
    ctx.quadraticCurveTo(640, 360, 560, 340);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function grain(ctx, amount, r) {
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const n = (r() - 0.5) * amount;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  function grassTexture(ctx, r, level) {
    ctx.save();
    ctx.globalAlpha = level >= 3 ? 0.15 : 0.22;
    for (let i = 0; i < 2600; i++) {
      const x = r() * W;
      const yBase = nearY(x);
      const y = yBase + r() * (H - yBase);
      ctx.strokeStyle = r() < 0.5 ? (level >= 2 ? '#0c1408' : '#2a6a18') : (level >= 2 ? '#2a3418' : '#9ad85a');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  const WP = {
    farY, nearY, figure,

    draw(canvas, level) {
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      const p = PAL[Math.max(0, Math.min(4, level))];
      const r = rng(1987);

      ctx.fillStyle = vgrad(ctx, 0, 480, p.sky);
      ctx.fillRect(0, 0, W, H);

      if (p.sun) {
        const g = ctx.createRadialGradient(180, 120, 0, 180, 120, 260);
        g.addColorStop(0, 'rgba(255,255,230,0.55)');
        g.addColorStop(1, 'rgba(255,255,230,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      if (p.stars) {
        for (let i = 0; i < 220; i++) {
          ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + r() * 0.6) + ')';
          ctx.fillRect(r() * W, r() * 380, r() < 0.1 ? 2 : 1, 1);
        }
      }
      clouds(ctx, r, p.cloud);

      if (level >= 4) giant(ctx);

      hill(ctx, farY, p.far, 340);
      const beacons = tower(ctx, level);

      if (level === 1) figure(ctx, 742, farY(742) + 3, 15, '#101010', 0.9);
      if (level === 2) figure(ctx, 590, farY(590) + 4, 50, '#060404', 0.95);

      hill(ctx, nearY, p.near, 480);
      grassTexture(ctx, r, level);

      if (level === 3) {
        figure(ctx, 850, nearY(850) + 40, 300, '#000', 1);
        ctx.save();
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = '#9fb';
        ctx.font = 'bold 54px Tahoma, Verdana, sans-serif';
        ctx.fillText('STAY TUNED', 210, 690);
        ctx.restore();
      }
      if (level >= 4) {
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#f33';
        ctx.font = 'bold 40px Tahoma, Verdana, sans-serif';
        ctx.fillText('THANK YOU FOR WATCHING', 60, 700);
        ctx.restore();
      }

      // soft vignette
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,' + (0.12 + level * 0.1) + ')');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      grain(ctx, 10 + level * 8, r);
      return { beacons: level >= 2 ? beacons : [] };
    }
  };

  G.wallpaper = WP;
})(window.G);
