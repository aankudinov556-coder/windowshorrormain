// Picture viewer with slow, scanline-by-scanline loading (failing drive).
(function (G) {
  'use strict';
  const U = G.util;

  function srcOf(n) { return typeof n.src === 'function' ? 'assets/img/' + n.src(G.state) : n.src; }

  G.apps.register('imageview', (args) => {
    let node = args.node;
    const folder = node.bin ? G.fs.byId(node.bin) : node.parent;
    const img = U.el('img', { class: 'iv-img', draggable: 'false', alt: '' });
    const veil = U.el('div', { class: 'iv-veil' });
    const frame = U.el('div', { class: 'iv-frame' }, img, veil);
    const stage = U.el('div', { class: 'iv-stage' }, frame);
    const btn = (label, fn, title) => U.el('button', { class: 'iv-btn', title: title || '', onclick: fn }, label);
    const bar = U.el('div', { class: 'iv-bar' },
      btn('◀', () => step(-1), 'Previous Image'),
      btn('▶', () => step(1), 'Next Image'),
      U.el('span', { class: 'tsep' }),
      btn('⊕', () => zoom(1.25), 'Zoom In'),
      btn('⊖', () => zoom(0.8), 'Zoom Out'),
      btn('1:1', () => zoom(0), 'Actual Size'));
    let scale = 1;

    const w = G.wm.open({
      key: 'imageview', title: node.name + ' - Picture Viewer', icon: 'img', w: 600, h: 520, bodyClass: 'iv-body'
    });
    w.body.innerHTML = '';
    w.body.appendChild(stage);
    w.body.appendChild(bar);

    function zoom(f) {
      scale = f === 0 ? 1 : U.clamp(scale * f, 0.4, 3);
      frame.style.transform = 'scale(' + scale + ')';
    }

    function step(d) {
      const pics = G.fs.children(folder).filter((x) => x.kind === 'jpg');
      if (!pics.length) return;
      const i = pics.indexOf(node);
      node = pics[(i + d + pics.length) % pics.length];
      show();
      G.state.opened[node.id] = (G.state.opened[node.id] || 0) + 1;
      G.save();
      G.emit('file:open', node);
    }

    function show() {
      w.setTitle(node.name + ' - Picture Viewer');
      scale = 1;
      frame.style.transform = '';
      const slow = 600 + G.state.level * 500 + (node.slow ? 2000 : 0);
      veil.style.transition = 'none';
      veil.style.height = '100%';
      img.onerror = () => { stage.classList.add('broken'); };
      img.onload = () => {
        stage.classList.remove('broken');
        requestAnimationFrame(() => {
          veil.style.transition = 'height ' + slow + 'ms steps(' + Math.round(slow / 60) + ')';
          veil.style.height = '0%';
        });
        if (G.state.level >= 1 && U.chance(0.25 + G.state.level * 0.1)) G.audio.play('hddDeath');
      };
      img.src = srcOf(node);
    }

    show();
    return w;
  });
})(window.G);
