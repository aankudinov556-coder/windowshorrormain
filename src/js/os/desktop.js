// Desktop: wallpaper, icons, context menu, and the window layer.
(function (G) {
  'use strict';
  const U = G.util;

  const DK = {
    el: null,
    icons: null,
    winLayer: null,
    selected: null,

    mount(stage) {
      stage.innerHTML = '';
      const canvas = U.el('canvas', { class: 'wallpaper' });
      DK.canvas = canvas;
      DK.beacons = U.el('div', { class: 'beacons' });
      DK.icons = U.el('div', { class: 'desk-icons' });
      DK.winLayer = U.el('div', { class: 'win-layer' });
      DK.el = U.el('div', { id: 'desktop' }, canvas, DK.beacons, DK.icons, DK.winLayer);
      stage.appendChild(DK.el);
      G.wm.attach(DK.winLayer);

      DK.el.addEventListener('pointerdown', (e) => {
        if (e.target === DK.icons || e.target === DK.el || e.target === canvas) DK.select(null);
      });
      DK.icons.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (e.target.closest('.dicon')) return;
        const p = G.toLocal(e.clientX, e.clientY);
        G.wm.showMenu(p.x, p.y, DK.deskMenu());
      });
      DK.drawWallpaper();
      DK.renderIcons();
    },

    drawWallpaper() {
      const lvl = G.state.level;
      const info = G.wallpaper.draw(DK.canvas, lvl);
      DK.beacons.innerHTML = '';
      info.beacons.forEach((b, i) => {
        const d = U.el('div', { class: 'beacon' });
        d.style.left = (b.x - 3) + 'px';
        d.style.top = (b.y - 3) + 'px';
        d.style.animationDelay = (i * 0.7) + 's';
        DK.beacons.appendChild(d);
      });
    },

    renderIcons() {
      const root = G.fs.byId('desktop');
      DK.icons.innerHTML = '';
      const items = G.fs.children(root);
      const perCol = 8;
      items.forEach((n, i) => {
        const col = Math.floor(i / perCol), row = i % perCol;
        const ic = U.el('div', { class: 'dicon', tabindex: '0', dataset: { id: n.id } },
          U.el('span', { class: 'di-img', html: n.shortcut ? G.iconWithShortcut(G.fs.icon(n), 32) : G.icon(G.fs.icon(n), 32) }),
          U.el('span', { class: 'di-label' }, G.fs.label(n)));
        ic.style.left = (6 + col * 80) + 'px';
        ic.style.top = (8 + row * 84) + 'px';
        ic.addEventListener('pointerdown', (e) => { e.stopPropagation(); DK.select(ic); });
        ic.addEventListener('dblclick', () => { G.cursor.busy(500); G.fs.open(n, { from: 'desktop' }); });
        ic.addEventListener('keydown', (e) => { if (e.key === 'Enter') G.fs.open(n); });
        ic.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          DK.select(ic);
          const p = G.toLocal(e.clientX, e.clientY);
          G.wm.showMenu(p.x, p.y, DK.iconMenu(n));
        });
        DK.icons.appendChild(ic);
      });
    },

    select(ic) {
      if (DK.selected) DK.selected.classList.remove('sel');
      DK.selected = ic;
      if (ic) ic.classList.add('sel');
    },

    iconMenu(n) {
      const items = [{ label: 'Open', bold: true, action: () => G.fs.open(n) }];
      if (n.id === 'recycle') items.push({ label: 'Empty Recycle Bin', action: () => G.dialogs.msg({ title: 'Confirm', icon: 'warn', text: G.state.level >= 2 ? 'Some items cannot be deleted. They are still being watched.' : 'Unable to empty the Recycle Bin. The disk is write-protected.' }) });
      items.push({ sep: true });
      items.push({ label: 'Properties', action: () => G.apps.launch('props', { node: n }) });
      return items;
    },

    deskMenu() {
      const lvl = G.state.level;
      const items = [
        { label: 'Arrange Icons By', disabled: true },
        { label: 'Refresh', action: () => { DK.renderIcons(); if (lvl >= 2 && U.chance(0.5)) G.fx.glitch(160, 1); } },
        { sep: true },
        { label: 'Paste', disabled: true },
        { label: 'New', disabled: true },
        { sep: true },
        { label: 'Properties', action: () => G.apps.launch('display') }
      ];
      if (lvl >= 3) items.splice(2, 0, { label: "Don't turn around", action: () => { G.audio.play('whisper'); G.fx.subliminal('GOOD.', 120); } });
      return items;
    },

    refresh() {
      if (!DK.el) return;
      DK.drawWallpaper();
      DK.renderIcons();
    }
  };

  G.desktop = DK;
})(window.G);
