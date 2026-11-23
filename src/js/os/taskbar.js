// Taskbar, start menu, tray and clock.
(function (G) {
  'use strict';
  const U = G.util;

  const TB = {
    el: null,
    menuEl: null,
    clockOverrideUntil: 0,
    clockOverrideText: '',

    mount(parent) {
      TB.startBtn = U.el('button', { class: 'start-btn' },
        U.el('span', { class: 'sb-logo', html: G.icon('logo', 20) }),
        U.el('span', { class: 'sb-text' }, 'start'));
      TB.startBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); TB.toggleMenu(); });
      TB.tasks = U.el('div', { class: 'tb-tasks' });
      TB.clock = U.el('span', { class: 'tb-clock' }, '');
      TB.trayIcons = U.el('div', { class: 'tray-icons' });
      TB.tray = U.el('div', { class: 'tb-tray' }, TB.trayIcons, TB.clock);
      TB.el = U.el('div', { id: 'taskbar' }, TB.startBtn, TB.tasks, TB.tray);
      TB.el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const p = G.toLocal(e.clientX, e.clientY);
        G.wm.showMenu(p.x, p.y - 80, [
          { label: 'Task Manager', icon: 'taskmgr', action: () => G.apps.launch('taskmgr') },
          { sep: true },
          { label: 'Show the Desktop', action: () => G.wm.wins.forEach((w) => w.minimize()) },
          { label: 'Properties', disabled: true }
        ]);
      });
      parent.appendChild(TB.el);
      TB.renderTray();
      clearInterval(TB._ci);
      TB._ci = setInterval(TB.tick, 1000);
      TB.tick();
      TB.sync();
    },

    renderTray() {
      TB.trayIcons.innerHTML = '';
      const add = (icon, title, fn) => {
        const s = U.el('span', { class: 'tray-ico', title, html: G.icon(icon, 16) });
        s.addEventListener('click', (e) => { e.stopPropagation(); fn && fn(s); });
        TB.trayIcons.appendChild(s);
        return s;
      };
      add('hddWarn', 'S.M.A.R.T.: Hard disk failure predicted', () => G.dialogs.msg({
        title: 'Hard Disk Warning', icon: 'warn',
        text: G.state.level >= 3
          ? 'S.M.A.R.T. status: OCCUPIED.\n\nSector 0x0333 is not damaged.\nSector 0x0333 is inhabited.'
          : 'S.M.A.R.T. failure predicted on Primary Master (40 GB).\n\nBack up your data immediately and replace the disk.\nReallocated sectors: 1,333'
      }));
      TB.tvTray = add(G.state.level >= 3 ? 'tvLive' : 'tv', 'Meridian TV Scheduler', () => G.apps.launch('tv'));
      add('network', 'Network cable unplugged', () => G.dialogs.balloon({ title: 'Local Area Connection', icon: 'warn', text: 'A network cable is unplugged.' }));
      add('speaker', 'Volume', (s) => TB.volumePopup(s));
    },

    volumePopup() {
      if (TB.volEl) { TB.volEl.remove(); TB.volEl = null; return; }
      const range = U.el('input', { type: 'range', min: '0', max: '100', value: String(Math.round(G.meta.volume * 100)), class: 'vol-range' });
      range.addEventListener('input', () => { G.audio.setVolume(range.value / 100); });
      range.addEventListener('change', () => G.audio.play('blip'));
      const box = U.el('div', { class: 'vol-pop' }, U.el('div', { class: 'vol-title' }, 'Volume'), range);
      U.$('#stage').appendChild(box);
      TB.volEl = box;
      setTimeout(() => {
        const close = (e) => { if (!box.contains(e.target)) { box.remove(); TB.volEl = null; document.removeEventListener('pointerdown', close, true); } };
        document.addEventListener('pointerdown', close, true);
      }, 0);
    },

    tick() {
      if (!TB.clock || !TB.clock.isConnected) return;
      const now = new Date();
      let txt = U.fmtClock(now);
      if (G.state.level >= 4) txt = '3:33 AM';
      if (Date.now() < TB.clockOverrideUntil) txt = TB.clockOverrideText;
      TB.clock.textContent = txt;
      TB.clock.title = G.state.level >= 4 ? 'It is always 3:33 here.' : now.toDateString();
    },

    clockOverride(text, ms) {
      TB.clockOverrideText = text;
      TB.clockOverrideUntil = Date.now() + ms;
      TB.tick();
      setTimeout(TB.tick, ms + 10);
    },

    sync() {
      if (!TB.tasks) return;
      TB.tasks.innerHTML = '';
      G.wm.wins.forEach((w) => {
        if (w.opts.noTaskbar) return;
        const b = U.el('button', { class: 'tb-task' + (G.wm.active === w && !w.minimized ? ' active' : '') },
          U.el('span', { class: 'tt-ico', html: w.opts.icon ? G.icon(w.opts.icon, 16) : '' }),
          U.el('span', { class: 'tt-text' }, w.titleText.textContent));
        b.addEventListener('click', () => {
          if (G.wm.active === w && !w.minimized) w.minimize();
          else { w.restore(); w.focus(); }
        });
        TB.tasks.appendChild(b);
      });
    },

    // ---------- start menu ----------
    userName() {
      const l = G.state.level;
      if (l >= 4) return 'Host';
      if (l === 3) return G.userName;
      return 'Daniel';
    },

    toggleMenu(force) {
      const open = force !== undefined ? force : !TB.menuEl;
      if (TB.menuEl) { TB.menuEl.remove(); TB.menuEl = null; TB.startBtn.classList.remove('pressed'); document.removeEventListener('pointerdown', TB._closer, true); }
      if (!open) return;
      G.audio.play('click');
      TB.startBtn.classList.add('pressed');
      TB.menuEl = TB.buildMenu();
      U.$('#stage').appendChild(TB.menuEl);
      TB._closer = (e) => {
        if (!TB.menuEl) return;
        if (TB.menuEl.contains(e.target) || TB.startBtn.contains(e.target)) return;
        TB.toggleMenu(false);
      };
      setTimeout(() => document.addEventListener('pointerdown', TB._closer, true), 0);
    },

    buildMenu() {
      const L = G.state.level;
      const go = (fn) => () => { TB.toggleMenu(false); fn(); };
      const item = (icon, label, sub, fn, bold) => {
        const row = U.el('div', { class: 'sm-item' + (bold ? ' bold' : '') },
          U.el('span', { class: 'sm-ico', html: G.icon(icon, sub ? 32 : 24) }),
          U.el('span', { class: 'sm-label' }, U.el('span', null, label), sub ? U.el('small', null, sub) : null));
        row.addEventListener('click', go(fn));
        return row;
      };
      const right = (icon, label, fn, bold) => {
        const row = U.el('div', { class: 'sm-ritem' + (bold ? ' bold' : '') },
          U.el('span', { class: 'sm-ico', html: G.icon(icon, 22) }),
          U.el('span', null, label));
        row.addEventListener('click', go(fn));
        return row;
      };
      const open = (id) => () => G.fs.open(G.fs.byId(id));

      const left = U.el('div', { class: 'sm-left' },
        item('web', 'Internet', 'Meridian Web', () => G.apps.launch('web'), true),
        item('mail', L >= 4 ? 'Last Messages' : 'E-mail', 'Meridian Mail', () => G.apps.launch('mail'), true),
        U.el('div', { class: 'sm-sep' }),
        item('tv', L >= 3 ? 'Channel 12 (LIVE)' : 'Meridian TV', null, () => G.apps.launch('tv')),
        item('backup', 'Backup Wizard', null, () => G.apps.launch('backup')),
        item('notepad', 'Notepad', null, () => G.apps.launch('notepad', {})),
        item('cmd', 'Command Prompt', null, () => G.apps.launch('cmd')),
        U.el('div', { class: 'sm-spacer' }),
        U.el('div', { class: 'sm-sep' }),
        TB.allPrograms(go));

      const rightCol = U.el('div', { class: 'sm-right' },
        right('docs', L >= 3 ? 'Our Documents' : 'My Documents', open('mydocs'), true),
        right('pics', 'My Pictures', open('mypics'), true),
        right('music', 'My Music', open('mymusic'), true),
        right('computer', L >= 3 ? 'Our Computer' : 'My Computer', open('mycomputer'), true),
        right('driveTv', 'TV Capture (D:)', open('drive_d')),
        U.el('div', { class: 'sm-sep' }),
        right('control', 'Control Panel', () => G.apps.launch('control')),
        U.el('div', { class: 'sm-sep' }),
        right('help', 'Help and Support', () => G.apps.launch('help')),
        right('search', 'Search', () => G.apps.launch('search')),
        right('run', 'Run...', () => G.apps.launch('run')));

      const head = U.el('div', { class: 'sm-head' },
        U.el('span', { class: 'sm-pic', html: G.boot.userTile(L >= 4 ? 'host' : L === 3 ? 'you' : 'daniel', 42) }),
        U.el('b', { class: L === 2 ? 'glitchy' : '' }, TB.userName()));

      const foot = U.el('div', { class: 'sm-foot' },
        U.el('button', { class: 'sm-fbtn', onclick: go(() => G.boot.logOffDialog()) }, U.el('span', { html: G.icon('logoff', 22) }), 'Log Off'),
        U.el('button', { class: 'sm-fbtn', onclick: go(() => G.boot.turnOffDialog()) }, U.el('span', { html: G.icon('power', 22) }), L >= 4 ? 'Sign Off' : 'Turn Off Computer'));

      return U.el('div', { class: 'start-menu' }, head, U.el('div', { class: 'sm-cols' }, left, rightCol), foot);
    },

    allPrograms(go) {
      const L = G.state.level;
      const leaf = (icon, label, fn) => {
        const r = U.el('div', { class: 'ap-item' }, U.el('span', { html: G.icon(icon, 16) }), U.el('span', null, label));
        r.addEventListener('click', (e) => { e.stopPropagation(); go(fn)(); });
        return r;
      };
      const group = (label, kids) => U.el('div', { class: 'ap-item group' },
        U.el('span', { html: G.icon('folder', 16) }), U.el('span', null, label), U.el('span', { class: 'ap-arrow' }, '▸'),
        U.el('div', { class: 'ap-sub' }, kids));
      const missing = (name) => () => G.dialogs.msg({ title: name, icon: 'error', text: 'Meridian cannot find \'' + name.toLowerCase().replace(/ /g, '') + '.exe\'. The file may have been moved or deleted.' });

      const list = U.el('div', { class: 'ap-sub ap-root' },
        group('Accessories', [
          leaf('notepad', 'Notepad', () => G.apps.launch('notepad', {})),
          leaf('cmd', 'Command Prompt', () => G.apps.launch('cmd')),
          leaf('paint', 'Paint', missing('Paint')),
          group('System Tools', [
            leaf('taskmgr', 'Task Manager', () => G.apps.launch('taskmgr')),
            leaf('backup', 'Backup Wizard', () => G.apps.launch('backup'))
          ])
        ]),
        group('Burrell Broadcast', [
          leaf('cmd', 'TXCTL Remote Control', () => G.apps.launch('cmd', { run: 'txctl' })),
          leaf('txt', 'TXCTL Readme', () => G.fs.open(G.fs.byId('f_txctl_readme')))
        ]),
        group('Games', [
          leaf('cards', 'Solitaire', missing('Solitaire'))
        ]),
        leaf('mail', 'Meridian Mail', () => G.apps.launch('mail')),
        leaf('tv', 'Meridian TV', () => G.apps.launch('tv')),
        leaf('web', 'Meridian Web', () => G.apps.launch('web')),
        L >= 2 ? leaf('host', 'host', () => G.story.hostProgram()) : null);

      return U.el('div', { class: 'sm-allprog' },
        U.el('span', null, 'All Programs'),
        U.el('span', { class: 'ap-go', html: G.icon('programs', 18) }),
        list);
    }
  };

  G.taskbar = TB;
})(window.G);
