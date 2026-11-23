// Window manager + dropdown/context menus.
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;

  const SCREEN_W = 1024;
  const DESK_H = 738; // 768 minus taskbar

  let zTop = 20;
  let cascade = 0;

  const WM = {
    layer: null,
    wins: [],
    active: null,

    attach(layer) { WM.layer = layer; WM.wins = []; WM.active = null; },

    get(key) { return WM.wins.find((w) => w.key === key && !w.closed); },

    open(o) {
      if (o.key) {
        const ex = WM.get(o.key);
        if (ex) { ex.restore(); ex.focus(); return ex; }
      }
      const w = Object.create(WinProto);
      w.id = U.uid();
      w.key = o.key || null;
      w.opts = o;
      w.closed = false;
      w.minimized = false;
      w.maximized = false;
      w.onCloseHandlers = [];
      if (o.onClose) w.onCloseHandlers.push(o.onClose);

      const width = o.w || 480;
      const autoH = typeof o.h !== 'number';
      const height = autoH ? 180 : o.h;
      let x = o.x, y = o.y;
      if (x == null || y == null) {
        if (o.center) {
          x = Math.round((SCREEN_W - width) / 2);
          y = Math.round((DESK_H - height) / 2);
        } else {
          x = 70 + (cascade * 26) % 220;
          y = 30 + (cascade * 26) % 170;
          cascade++;
        }
      }
      x = U.clamp(x, 0, SCREEN_W - 80);
      y = U.clamp(y, 0, DESK_H - 40);

      const btns = U.el('div', { class: 'wt-btns' });
      if (o.minimizable !== false) btns.appendChild(U.el('button', { class: 'wt-btn wt-min', title: t('wm.min'), onclick: (e) => { e.stopPropagation(); w.minimize(); } }));
      if (o.maximizable !== false && o.resizable !== false) btns.appendChild(U.el('button', { class: 'wt-btn wt-max', title: t('wm.max'), onclick: (e) => { e.stopPropagation(); w.toggleMax(); } }));
      btns.appendChild(U.el('button', { class: 'wt-btn wt-close', title: t('wm.close'), onclick: (e) => { e.stopPropagation(); G.audio.play('click'); w.close(); } }));

      w.titleText = U.el('span', { class: 'wt-text' }, o.title || '');
      w.titleIcon = U.el('span', { class: 'wt-icon', html: o.icon ? G.icon(o.icon, 16) : '' });
      w.titlebar = U.el('div', { class: 'win-title' }, w.titleIcon, w.titleText, btns);
      w.body = U.el('div', { class: 'win-body ' + (o.bodyClass || '') });
      w.el = U.el('div', { class: 'win ' + (o.cls || ''), dataset: { id: w.id } }, w.titlebar);
      if (o.menu) { w.menubar = WM.menubar(o.menu, w); w.el.appendChild(w.menubar); }
      if (o.toolbar) w.el.appendChild(o.toolbar);
      w.el.appendChild(w.body);
      if (o.status) {
        w.statusbar = U.el('div', { class: 'win-status' }, U.el('span', { class: 'ws-cell' }, typeof o.status === 'string' ? o.status : ''));
        w.el.appendChild(w.statusbar);
      }
      if (o.resizable !== false) {
        const grip = U.el('div', { class: 'win-grip' });
        w.el.appendChild(grip);
        WM.makeResizable(w, grip);
      }
      Object.assign(w.el.style, { left: x + 'px', top: y + 'px', width: width + 'px', height: autoH ? 'auto' : height + 'px' });

      WM.makeDraggable(w);
      w.el.addEventListener('pointerdown', () => w.focus(), true);
      if (o.maximizable !== false && o.resizable !== false) w.titlebar.addEventListener('dblclick', () => w.toggleMax());

      WM.layer.appendChild(w.el);
      WM.wins.push(w);
      if (typeof o.body === 'function') o.body(w);
      else if (o.body) w.body.appendChild(o.body);
      w.focus();
      if (o.maximized) w.toggleMax();
      G.taskbar && G.taskbar.sync();
      G.emit('win:open', w);
      return w;
    },

    focus(w) {
      if (WM.active === w && w && !w.minimized) return;
      WM.wins.forEach((x) => x.el.classList.toggle('inactive', x !== w));
      WM.active = w;
      if (w) w.el.style.zIndex = ++zTop;
      G.taskbar && G.taskbar.sync();
    },

    focusTop() {
      const vis = WM.wins.filter((w) => !w.minimized && !w.closed);
      vis.sort((a, b) => (+b.el.style.zIndex) - (+a.el.style.zIndex));
      WM.focus(vis[0] || null);
    },

    closeAll(force = true) {
      WM.wins.slice().forEach((w) => w.close(force));
    },

    makeDraggable(w) {
      let drag = null;
      w.titlebar.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || e.target.closest('.wt-btn') || w.maximized) return;
        const p = G.toLocal(e.clientX, e.clientY);
        drag = { sx: p.x, sy: p.y, ox: w.el.offsetLeft, oy: w.el.offsetTop };
        w.titlebar.setPointerCapture(e.pointerId);
      });
      w.titlebar.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const p = G.toLocal(e.clientX, e.clientY);
        const nx = U.clamp(drag.ox + p.x - drag.sx, -w.el.offsetWidth + 60, SCREEN_W - 60);
        const ny = U.clamp(drag.oy + p.y - drag.sy, 0, DESK_H - 24);
        w.el.style.left = nx + 'px';
        w.el.style.top = ny + 'px';
      });
      const end = () => { drag = null; };
      w.titlebar.addEventListener('pointerup', end);
      w.titlebar.addEventListener('pointercancel', end);
    },

    makeResizable(w, grip) {
      let rs = null;
      grip.addEventListener('pointerdown', (e) => {
        if (w.maximized) return;
        e.stopPropagation();
        const p = G.toLocal(e.clientX, e.clientY);
        rs = { sx: p.x, sy: p.y, ow: w.el.offsetWidth, oh: w.el.offsetHeight };
        grip.setPointerCapture(e.pointerId);
      });
      grip.addEventListener('pointermove', (e) => {
        if (!rs) return;
        const p = G.toLocal(e.clientX, e.clientY);
        w.el.style.width = Math.max(w.opts.minW || 220, rs.ow + p.x - rs.sx) + 'px';
        w.el.style.height = Math.max(w.opts.minH || 140, rs.oh + p.y - rs.sy) + 'px';
        if (w.opts.onResize) w.opts.onResize(w);
      });
      grip.addEventListener('pointerup', () => { rs = null; });
    },

    // ---- menus ----
    menubar(items, w) {
      const bar = U.el('div', { class: 'win-menu' });
      items.forEach((m) => {
        const it = U.el('span', { class: 'wm-item' }, m.label);
        it.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          const r = it.getBoundingClientRect();
          const p = G.toLocal(r.left, r.bottom);
          const list = typeof m.items === 'function' ? m.items(w) : m.items;
          WM.showMenu(p.x, p.y, list || [{ label: t('menu.empty'), disabled: true }]);
        });
        bar.appendChild(it);
      });
      return bar;
    },

    showMenu(x, y, items, opts = {}) {
      WM.hideMenu();
      const m = U.el('div', { class: 'ctx-menu ' + (opts.cls || '') });
      items.forEach((it) => {
        if (it.sep) { m.appendChild(U.el('div', { class: 'ctx-sep' })); return; }
        const row = U.el('div', { class: 'ctx-row' + (it.disabled ? ' disabled' : '') + (it.bold ? ' bold' : '') },
          U.el('span', { class: 'ctx-ico', html: it.icon ? G.icon(it.icon, 16) : (it.checked ? '✓' : '') }),
          U.el('span', { class: 'ctx-label' }, it.label),
          U.el('span', { class: 'ctx-arrow' }, it.sub ? '▸' : ''));
        if (!it.disabled) {
          row.addEventListener('pointerup', (e) => {
            e.stopPropagation();
            if (it.sub) return;
            WM.hideMenu();
            G.audio.play('click');
            it.action && it.action();
          });
        }
        m.appendChild(row);
      });
      const root = U.$('#stage');
      root.appendChild(m);
      const mw = m.offsetWidth, mh = m.offsetHeight;
      m.style.left = Math.min(x, SCREEN_W - mw - 2) + 'px';
      m.style.top = Math.min(y, 768 - mh - 2) + 'px';
      m.style.zIndex = 99000;
      WM.menuEl = m;
      setTimeout(() => {
        WM._closer = (e) => { if (!m.contains(e.target)) WM.hideMenu(); };
        document.addEventListener('pointerdown', WM._closer, true);
      }, 0);
      return m;
    },

    hideMenu() {
      if (WM.menuEl) { WM.menuEl.remove(); WM.menuEl = null; }
      if (WM._closer) { document.removeEventListener('pointerdown', WM._closer, true); WM._closer = null; }
    }
  };

  const WinProto = {
    setTitle(t) { this.titleText.textContent = t; G.taskbar && G.taskbar.sync(); },
    setIcon(i) { this.opts.icon = i; this.titleIcon.innerHTML = G.icon(i, 16); G.taskbar && G.taskbar.sync(); },
    setStatus(t) { if (this.statusbar) this.statusbar.firstChild.textContent = t; },
    center() {
      this.el.style.left = Math.max(0, Math.round((SCREEN_W - this.el.offsetWidth) / 2)) + 'px';
      this.el.style.top = Math.max(0, Math.round((DESK_H - this.el.offsetHeight) / 2)) + 'px';
    },
    focus() { if (this.closed) return; WM.focus(this); },
    minimize() {
      this.minimized = true;
      this.el.style.display = 'none';
      if (WM.active === this) WM.focusTop();
      G.taskbar && G.taskbar.sync();
    },
    restore() {
      if (!this.minimized) return;
      this.minimized = false;
      this.el.style.display = '';
      this.focus();
    },
    toggleMax() {
      if (!this.maximized) {
        this.prev = { l: this.el.style.left, t: this.el.style.top, w: this.el.style.width, h: this.el.style.height };
        Object.assign(this.el.style, { left: '0px', top: '0px', width: SCREEN_W + 'px', height: DESK_H + 'px' });
        this.el.classList.add('maxed');
        this.maximized = true;
      } else {
        Object.assign(this.el.style, { left: this.prev.l, top: this.prev.t, width: this.prev.w, height: this.prev.h });
        this.el.classList.remove('maxed');
        this.maximized = false;
      }
      if (this.opts.onResize) this.opts.onResize(this);
    },
    onClose(fn) { this.onCloseHandlers.push(fn); },
    close(force) {
      if (this.closed) return;
      if (!force && this.opts.canClose && this.opts.canClose(this) === false) return;
      this.closed = true;
      this.onCloseHandlers.forEach((fn) => { try { fn(this); } catch (e) { console.error(e); } });
      this.el.remove();
      WM.wins = WM.wins.filter((x) => x !== this);
      if (WM.active === this) { WM.active = null; WM.focusTop(); }
      G.taskbar && G.taskbar.sync();
      G.emit('win:close', this);
    },
    shake() {
      this.el.classList.add('win-shake');
      setTimeout(() => this.el.classList.remove('win-shake'), 400);
    }
  };

  WM.SCREEN_W = SCREEN_W;
  WM.DESK_H = DESK_H;
  G.wm = WM;
})(window.G);
