// Power-on sequence: warning, BIOS, setup, splash, login, shutdown screens.
(function (G) {
  'use strict';
  const U = G.util;

  const stage = () => U.$('#stage');

  function screen(cls, ...children) {
    const s = stage();
    s.innerHTML = '';
    const el = U.el('div', { class: 'boot-screen ' + cls }, ...children);
    s.appendChild(el);
    return el;
  }

  // Waits for a key/click OR a timeout. Resolves with the key name.
  function waitKey(ms, keys) {
    return new Promise((resolve) => {
      let t = null;
      const done = (k) => { document.removeEventListener('keydown', onKey, true); clearTimeout(t); resolve(k); };
      const onKey = (e) => {
        if (!keys || keys.includes(e.key)) { e.preventDefault(); done(e.key); }
      };
      document.addEventListener('keydown', onKey, true);
      if (ms) t = setTimeout(() => done(null), ms);
    });
  }

  const B = {
    // ---------- first screen: content warning ----------
    warning() {
      const cb = U.el('input', { type: 'checkbox', id: 'rf' });
      cb.checked = !!G.meta.reduceFlash;
      const el = screen('warning',
        U.el('div', { class: 'warn-box' },
          U.el('div', { class: 'warn-title' }, 'WARNING'),
          U.el('p', null, 'This game contains flashing images, sudden loud sounds,'),
          U.el('p', null, 'distorted imagery and themes of disappearance.'),
          U.el('p', { class: 'dim' }, 'Headphones recommended. Play in the dark at your own risk.'),
          U.el('label', { class: 'warn-opt' }, cb, ' Reduce flashing effects'),
          U.el('div', { class: 'warn-go blink' }, 'CLICK TO POWER ON')));
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', () => { G.meta.reduceFlash = cb.checked; G.saveMeta(); });
      el.querySelector('.warn-opt').addEventListener('click', (e) => e.stopPropagation());
      return new Promise((resolve) => {
        el.addEventListener('click', () => {
          G.audio.init();
          G.meta.launches++;
          G.saveMeta();
          resolve();
        }, { once: true });
      }).then(() => B.bios());
    },

    // ---------- BIOS POST ----------
    async bios() {
      G.taskbar.menuEl && G.taskbar.toggleMenu(false);
      const L = G.state.level;
      const haunted = !!G.flag('afterShutdown');
      const pre = U.el('pre', { class: 'bios-text' });
      const logo = U.el('div', { class: 'bios-logo', html: G.icon('logo', 64) });
      const foot = U.el('div', { class: 'bios-foot' }, 'Press DEL to enter SETUP');
      screen('bios', logo, pre, foot);
      G.audio.play('thump');
      G.audio.play('blip');

      const lines = [];
      const add = (s, cls) => lines.push([s, cls]);
      add('Meridian Computers BIOS v1.07, An Energy-Saving Product');
      add('Copyright (C) 1999-2002, Meridian Computers, Inc.');
      add('');
      add('MRD-2002 Home PC  (Build 0915)');
      add('');
      add('Main Processor : 1.80GHz');
      add('@MEM');
      add('');
      add('Detecting IDE drives ...');
      add('  Primary Master   : MAXTRON 4D040H2  40.0 GB');
      add(haunted ? '  Primary Slave    : HOST' : '  Primary Slave    : None', haunted ? 'red' : '');
      add('  Secondary Master : CD-ROM 52X');
      add('  Secondary Slave  : None');
      add('');
      add('PCI device listing ...');
      add('  Bus 0 Dev 9  Multimedia Device  : TVR-878 Video Capture   IRQ 11');
      add('  Bus 0 Dev 11 Communication Dev. : 56K Voice Modem         IRQ 10');
      if (haunted) add('  Bus 0 Dev 12 Receiving Device    : TUNED  CH 12  205.25 MHz', 'red');
      add('');
      if (G.meta.lastEnding && !G.state.playMs) {
        if (G.meta.lastEnding === 'homecoming') add('Last session  : BACKUP DELIVERED.   Hello again, ' + G.userName + '.', 'red');
        else add('Last session  : SIGNED OFF.   CH 12 ........ NO SIGNAL', 'dim');
        add('');
      }
      add(haunted ? 'S.M.A.R.T. Status OCCUPIED' : 'S.M.A.R.T. Capable and Status BAD', 'yellow');
      add(haunted ? 'Do not back up. Do not replace.' : 'Backup and Replace', 'yellow');
      add('');
      add(haunted ? 'PLEASE REMAIN TUNED' : 'Press F1 to Resume', haunted ? 'red' : '');

      let wantSetup = false;
      const onKey = (e) => { if (e.key === 'Delete' || e.key === 'F2') { wantSetup = true; } };
      document.addEventListener('keydown', onKey, true);
      foot.addEventListener('click', () => { wantSetup = true; });

      for (const [s, cls] of lines) {
        if (s === '@MEM') {
          const span = U.el('span', null, '');
          pre.appendChild(U.el('div', null, 'Memory Testing : ', span));
          for (let k = 0; k <= 262144; k += 8192 + Math.floor(Math.random() * 4000)) {
            span.textContent = Math.min(k, 262144) + 'K';
            await U.sleep(18);
          }
          span.textContent = '262144K OK';
          continue;
        }
        pre.appendChild(U.el('div', { class: cls || '' }, s || ' '));
        if (s.startsWith('Detecting')) { G.audio.play('hdd'); await U.sleep(500); G.audio.play('hddDeath'); await U.sleep(400); }
        await U.sleep(s ? U.randi(35, 110) : 25);
      }
      await U.sleep(900);
      document.removeEventListener('keydown', onKey, true);
      if (wantSetup) return B.setup();
      return B.splash();
    },

    // ---------- BIOS setup (settings / new game) ----------
    setup() {
      let sel = 0;
      const box = U.el('div', { class: 'setup-box' });
      const help = U.el('div', { class: 'setup-help' }, '↑↓ : Select Item    Enter : Change/Run    Esc : Exit');
      const el = screen('setup',
        U.el('div', { class: 'setup-title' }, 'MERIDIAN CMOS SETUP UTILITY'),
        box, help);
      const items = [
        { label: () => 'Reduce Flashing Effects ......... [' + (G.meta.reduceFlash ? 'Enabled ' : 'Disabled') + ']', run: () => { G.meta.reduceFlash = !G.meta.reduceFlash; G.saveMeta(); } },
        { label: () => 'Master Volume ................... [' + Math.round(G.meta.volume * 100) + '%]', run: () => { G.audio.setVolume(G.meta.volume >= 1 ? 0 : Math.round((G.meta.volume + 0.2) * 10) / 10); G.audio.play('blip'); } },
        { label: () => 'Fullscreen (F11) ................ [Toggle]', run: () => { if (window.meridian) window.meridian.setFullscreen(!document.fullscreenElement && !window.__fs); else if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); window.__fs = !window.__fs; } },
        { label: () => 'Load Setup Defaults (NEW GAME)', run: async () => {
          if (confirmBox('Erase all progress and start over? (Y/N)')) { G.newGame(); G.audio.play('blip'); flash('PROGRESS ERASED'); }
        } },
        { label: () => 'Erase Everything (incl. endings seen)', run: async () => {
          if (confirmBox('Erase progress AND memory of past sessions? (Y/N)')) { G.wipeAll(); flash('CMOS CLEARED'); }
        } },
        { label: () => 'Save & Exit Setup', run: () => exit() }
      ];
      const status = U.el('div', { class: 'setup-status' }, '');
      el.appendChild(status);
      const flash = (t) => { status.textContent = t; setTimeout(() => { status.textContent = ''; }, 1600); };
      const confirmBox = (q) => window.confirm(q);

      const render = () => {
        box.innerHTML = '';
        items.forEach((it, i) => {
          const r = U.el('div', { class: 'setup-row' + (i === sel ? ' sel' : '') }, it.label());
          r.addEventListener('click', () => { sel = i; it.run(); render(); });
          box.appendChild(r);
        });
      };
      let exited = false;
      const exit = () => {
        if (exited) return;
        exited = true;
        document.removeEventListener('keydown', onKey, true);
        B.bios();
      };
      const onKey = (e) => {
        if (e.key === 'ArrowDown') sel = (sel + 1) % items.length;
        else if (e.key === 'ArrowUp') sel = (sel + items.length - 1) % items.length;
        else if (e.key === 'Enter') items[sel].run();
        else if (e.key === 'Escape') return exit();
        else return;
        e.preventDefault();
        if (!exited) render();
      };
      document.addEventListener('keydown', onKey, true);
      render();
    },

    // ---------- splash ----------
    async splash() {
      const L = G.state.level;
      const haunted = !!G.flag('afterShutdown');
      const bar = U.el('div', { class: 'splash-bar' }, U.el('div', { class: 'splash-blocks' }, U.el('i'), U.el('i'), U.el('i')));
      screen('splash' + (haunted ? ' haunted' : ''),
        U.el('div', { class: 'splash-logo' },
          U.el('span', { html: G.icon('logo', 96) }),
          U.el('div', { class: 'splash-name' }, 'Meridian', U.el('sup', null, '2002')),
          U.el('div', { class: 'splash-ed' }, haunted ? 'Host Edition' : 'Home Edition')),
        bar,
        U.el('div', { class: 'splash-copy' }, 'Copyright © Meridian Computers, Inc.'));
      await U.sleep(haunted ? 1800 : 3000);
      if (haunted) { G.fx.glitch(250, 1.5); await U.sleep(600); }
      return B.login();
    },

    // ---------- user tiles ----------
    userTile(kind, size = 48) {
      const tiles = {
        daniel: '<rect width="48" height="48" rx="5" fill="#e98c2a"/><rect x="7" y="13" width="34" height="26" rx="4" fill="#5a3b1c"/><rect x="10" y="16" width="22" height="20" rx="3" fill="#7fc4ff"/><path d="M17 4 L24 13 L33 3" stroke="#3a2a12" stroke-width="2" fill="none"/><circle cx="36.5" cy="21" r="2" fill="#ddd"/><circle cx="36.5" cy="28" r="2" fill="#ddd"/>',
        you: '<rect width="48" height="48" rx="5" fill="#3d7de0"/><circle cx="24" cy="18" r="8" fill="#e6eefc"/><path d="M8 44 C8 30 40 30 40 44 Z" fill="#e6eefc"/>',
        host: '<rect width="48" height="48" rx="5" fill="#050505"/><ellipse cx="24" cy="17" rx="7" ry="9" fill="#1c1c1c"/><path d="M12 48 C12 32 36 32 36 48 Z" fill="#1c1c1c"/><path d="M0 30 H48" stroke="#300" stroke-width="1"/>',
        guest: '<rect width="48" height="48" rx="5" fill="#777"/><circle cx="24" cy="18" r="8" fill="#ccc"/><path d="M8 44 C8 30 40 30 40 44 Z" fill="#ccc"/>'
      };
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 48 48">' + (tiles[kind] || tiles.guest) + '</svg>';
    },

    // ---------- login ----------
    login() {
      const haunted = !!G.flag('afterShutdown');
      const right = U.el('div', { class: 'login-users' });
      const el = screen('login' + (haunted ? ' haunted' : ''),
        U.el('div', { class: 'login-top' }),
        U.el('div', { class: 'login-mid' },
          U.el('div', { class: 'login-left' },
            U.el('div', { class: 'login-logo', html: G.icon('logo', 72) }),
            U.el('div', { class: 'login-brand' }, 'Meridian'),
            U.el('div', { class: 'login-hint' }, haunted ? 'To continue, click your name.' : 'To begin, click your user name')),
          U.el('div', { class: 'login-divider' }),
          right),
        U.el('div', { class: 'login-bottom' },
          U.el('button', { class: 'login-off', onclick: () => B.turnOffDialog(true) }, U.el('span', { html: G.icon('power', 22) }), 'Turn off computer'),
          U.el('div', { class: 'login-note' }, haunted ? 'After you log on, the program will continue.' : 'After you log on, you can add or change accounts.\nJust go to Control Panel and click User Accounts.')));

      const tile = (kind, name, sub, onClick) => {
        const t = U.el('div', { class: 'user-tile' },
          U.el('span', { class: 'ut-pic', html: B.userTile(kind, 48) }),
          U.el('span', { class: 'ut-name' }, U.el('b', null, name), sub ? U.el('small', null, sub) : null));
        t.addEventListener('click', () => onClick(t));
        right.appendChild(t);
        return t;
      };

      if (!haunted) {
        tile('daniel', 'Daniel', null, (t) => B.logIn(t));
      } else {
        G.audio.setAmbientLevel(3);
        tile('daniel', 'Daniel', 'Logged on since 10/14/2003 3:33 AM', (t) => {
          t.classList.add('shake');
          setTimeout(() => t.classList.remove('shake'), 400);
          G.dialogs.msg({ title: 'Meridian', icon: 'warn', text: 'Daniel is already logged on.\n\nHe has been logged on for a long time.\nHe cannot log off.', x: 340, y: 300 });
        });
        tile('you', G.userName, null, (t) => {
          G.state.level = 4;
          G.save();
          B.logIn(t);
        });
        tile('host', 'Host', 'Tonight\'s host', (t) => {
          G.audio.play('sting');
          G.fx.glitch(200, 1.4);
          t.querySelector('small').textContent = 'Not yet. You first.';
        });
      }
      return el;
    },

    async logIn(tileEl) {
      U.$$('.user-tile').forEach((t) => t.classList.toggle('chosen', t === tileEl));
      G.audio.play('click');
      await U.sleep(500);
      screen('welcome' + (G.state.level >= 4 ? ' haunted' : ''), U.el('div', { class: 'welcome-text' }, G.state.level >= 4 ? 'welcome back' : 'welcome'));
      await U.sleep(1500);
      B.startDesktop();
    },

    startDesktop() {
      const s = stage();
      G.desktop.mount(s);
      G.taskbar.mount(G.desktop.el);
      G.fx.setLevel(G.state.level);
      G.audio.startAmbient();
      G.audio.setAmbientLevel(G.state.level);
      if (window.meridian) window.meridian.setLevel(G.state.level);
      if (G.state.level >= 4) G.audio.play('sting'); else G.audio.play('startup');
      G.story.start();
    },

    // ---------- turn off / log off ----------
    turnOffDialog(fromLogin) {
      if (U.$('.turnoff-overlay')) return;
      const L = G.state.level;
      const close = () => ov.remove();
      const btn = (cls, label, fn) => U.el('div', { class: 'to-btn' }, U.el('button', { class: 'to-circle ' + cls, onclick: () => { close(); fn(); } }), U.el('span', null, label));
      const ov = U.el('div', { class: 'turnoff-overlay' },
        U.el('div', { class: 'turnoff-box' },
          U.el('div', { class: 'to-head' }, U.el('span', null, L >= 4 ? 'Sign off Meridian' : 'Turn off computer'), U.el('span', { class: 'to-logo', html: G.icon('logo', 26) })),
          U.el('div', { class: 'to-body' },
            btn('standby', 'Stand By', () => G.story.onShutdown('standby')),
            btn('off', 'Turn Off', () => G.story.onShutdown('off', fromLogin)),
            btn('restart', 'Restart', () => G.story.onShutdown('restart', fromLogin))),
          U.el('div', { class: 'to-foot' }, U.el('button', { class: 'btn', onclick: close }, 'Cancel'))));
      stage().appendChild(ov);
      document.body.classList.add('grayscale-bg');
      const obs = new MutationObserver(() => { if (!ov.isConnected) { document.body.classList.remove('grayscale-bg'); obs.disconnect(); } });
      obs.observe(stage(), { childList: true });
    },

    logOffDialog() {
      G.dialogs.msg({ title: 'Log Off Meridian', icon: 'logoff', text: 'Are you sure you want to log off?', buttons: ['Log Off', 'Cancel'] }).then((r) => {
        if (r !== 'Log Off') return;
        if (G.state.level >= 3) {
          G.dialogs.msg({ title: 'Log Off Meridian', icon: 'error', text: G.state.level >= 4 ? 'There is no one else to log on as.' : 'You cannot log off while someone is watching.' });
          return;
        }
        B.logOff();
      });
    },

    async logOff() {
      G.story.stop();
      G.wm.closeAll(true);
      G.audio.play('shutdown');
      screen('shutting', U.el('div', { class: 'shut-text' }, 'Logging off...'));
      await U.sleep(1800);
      B.login();
    },

    async shutdownScreen(text = 'Meridian is shutting down...') {
      G.story.stop();
      G.wm.closeAll(true);
      G.audio.play('shutdown');
      screen('shutting', U.el('div', { class: 'shut-logo', html: G.icon('logo', 64) }), U.el('div', { class: 'shut-text' }, text));
      await U.sleep(2600);
      G.audio.stopAmbient();
    },

    async safeToTurnOff() {
      screen('safe', U.el('div', { class: 'safe-text' }, 'It is now safe to turn off your computer.'));
      await U.sleep(1500);
    },

    // Real exit (Electron) or a "powered off" screen in the browser.
    quit() {
      if (window.meridian && window.meridian.quit) { window.meridian.quit(); return; }
      const el = screen('poweroff', U.el('div', { class: 'po-text' }, 'Power off.'), U.el('div', { class: 'po-hint' }, 'Click to power on again.'));
      el.addEventListener('click', () => B.bios(), { once: true });
    },

    screen
  };

  G.boot = B;
})(window.G);
