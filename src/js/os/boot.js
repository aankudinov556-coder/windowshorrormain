// Power-on sequence: warning, BIOS, setup, splash, login, shutdown screens.
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;

  const stage = () => U.$('#stage');

  function screen(cls, ...children) {
    const s = stage();
    s.innerHTML = '';
    const el = U.el('div', { class: 'boot-screen ' + cls }, ...children);
    s.appendChild(el);
    return el;
  }

  // Switch language: load the pack, rebuild translated content, remember the choice.
  async function setLanguage(code) {
    await G.i18n.use(code);
    G.meta.lang = G.i18n.lang;
    G.saveMeta();
    G.initUser();
    G.buildContent();
  }

  const B = {
    // ---------- first screen: language + content warning ----------
    warning() {
      const cb = U.el('input', { type: 'checkbox', id: 'rf' });
      cb.checked = !!G.meta.reduceFlash;
      const langs = U.el('div', { class: 'warn-langs' });
      G.i18n.list().forEach((l) => {
        const b = U.el('button', { class: 'warn-lang' + (l.code === G.i18n.lang ? ' sel' : '') }, l.native);
        b.addEventListener('click', async (e) => {
          e.stopPropagation();
          await setLanguage(l.code);
          B.warning();
        });
        langs.appendChild(b);
      });
      const el = screen('warning',
        langs,
        U.el('div', { class: 'warn-box' },
          U.el('div', { class: 'warn-title' }, t('boot.warn.title')),
          U.el('p', null, t('boot.warn.l1')),
          U.el('p', null, t('boot.warn.l2')),
          U.el('p', { class: 'dim' }, t('boot.warn.dim')),
          U.el('label', { class: 'warn-opt' }, cb, ' ' + t('boot.warn.reduce')),
          U.el('div', { class: 'warn-go blink' }, t('boot.warn.go'))));
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', () => { G.meta.reduceFlash = cb.checked; G.saveMeta(); });
      el.querySelector('.warn-opt').addEventListener('click', (e) => e.stopPropagation());
      let started = false;
      el.addEventListener('click', (e) => {
        if (e.target.closest('.warn-langs') || started) return;
        started = true;
        G.audio.init();
        G.meta.launches++;
        G.saveMeta();
        B.bios();
      }, { once: false });
      return el;
    },

    // ---------- BIOS POST (firmware text, mostly untranslated on purpose) ----------
    async bios() {
      G.taskbar.menuEl && G.taskbar.toggleMenu(false);
      const haunted = !!G.flag('afterShutdown');
      const pre = U.el('pre', { class: 'bios-text' });
      const logo = U.el('div', { class: 'bios-logo', html: G.icon('logo', 64) });
      const foot = U.el('div', { class: 'bios-foot' }, t('bios.foot'));
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
        if (G.meta.lastEnding === 'homecoming') add(t('bios.lastHome', { name: G.userName }), 'red');
        else add(t('bios.lastSign'), 'dim');
        add('');
      }
      add(haunted ? t('bios.smartOcc') : t('bios.smartBad'), 'yellow');
      add(haunted ? t('bios.doNotBackup') : t('bios.backupReplace'), 'yellow');
      add('');
      add(haunted ? t('bios.remain') : t('bios.f1'), haunted ? 'red' : '');

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

    // ---------- BIOS setup (settings / language / new game) ----------
    setup() {
      let sel = 0;
      const box = U.el('div', { class: 'setup-box' });
      const help = U.el('div', { class: 'setup-help' });
      const title = U.el('div', { class: 'setup-title' });
      const status = U.el('div', { class: 'setup-status' }, '');
      screen('setup', title, box, help, status);
      const flash = (s) => { status.textContent = s; setTimeout(() => { status.textContent = ''; }, 1600); };
      const onOff = (v) => (v ? t('setup.enabled') : t('setup.disabled'));
      const items = [
        { label: () => t('setup.lang', { v: G.i18n.info().native }), run: async () => {
          const list = G.i18n.list();
          const i = list.findIndex((l) => l.code === G.i18n.lang);
          await setLanguage(list[(i + 1) % list.length].code);
        } },
        { label: () => t('setup.reduce', { v: onOff(G.meta.reduceFlash) }), run: () => { G.meta.reduceFlash = !G.meta.reduceFlash; G.saveMeta(); } },
        { label: () => t('setup.volume', { v: Math.round(G.meta.volume * 100) + '%' }), run: () => { G.audio.setVolume(G.meta.volume >= 1 ? 0 : Math.round((G.meta.volume + 0.2) * 10) / 10); G.audio.play('blip'); } },
        { label: () => t('setup.fullscreen'), run: () => { if (window.meridian) window.meridian.setFullscreen(!window.__fs); else if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); window.__fs = !window.__fs; } },
        { label: () => t('setup.newgame'), run: () => {
          if (window.confirm(t('setup.confirmNew'))) { G.newGame(); G.audio.play('blip'); flash(t('setup.erased')); }
        } },
        { label: () => t('setup.erase'), run: () => {
          if (window.confirm(t('setup.confirmErase'))) { const lang = G.i18n.lang; G.wipeAll(); G.meta.lang = lang; G.saveMeta(); flash(t('setup.cleared')); }
        } },
        { label: () => t('setup.exit'), run: () => exit() }
      ];

      const render = () => {
        title.textContent = t('setup.title');
        help.textContent = t('setup.help');
        box.innerHTML = '';
        items.forEach((it, i) => {
          const r = U.el('div', { class: 'setup-row' + (i === sel ? ' sel' : '') }, it.label());
          r.addEventListener('click', async () => { sel = i; await it.run(); if (!exited) render(); });
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
      const onKey = async (e) => {
        if (e.key === 'ArrowDown') sel = (sel + 1) % items.length;
        else if (e.key === 'ArrowUp') sel = (sel + items.length - 1) % items.length;
        else if (e.key === 'Enter') { e.preventDefault(); await items[sel].run(); }
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
      const haunted = !!G.flag('afterShutdown');
      const bar = U.el('div', { class: 'splash-bar' }, U.el('div', { class: 'splash-blocks' }, U.el('i'), U.el('i'), U.el('i')));
      screen('splash' + (haunted ? ' haunted' : ''),
        U.el('div', { class: 'splash-logo' },
          U.el('span', { html: G.icon('logo', 96) }),
          U.el('div', { class: 'splash-name' }, 'Meridian', U.el('sup', null, '2002')),
          U.el('div', { class: 'splash-ed' }, haunted ? t('splash.host') : t('splash.home'))),
        bar,
        U.el('div', { class: 'splash-copy' }, t('splash.copy')));
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
            U.el('div', { class: 'login-hint' }, haunted ? t('login.hintHaunted') : t('login.hint'))),
          U.el('div', { class: 'login-divider' }),
          right),
        U.el('div', { class: 'login-bottom' },
          U.el('button', { class: 'login-off', onclick: () => B.turnOffDialog(true) }, U.el('span', { html: G.icon('power', 22) }), t('login.off')),
          U.el('div', { class: 'login-note' }, haunted ? t('login.noteHaunted') : t('login.note'))));

      const tile = (kind, name, sub, onClick) => {
        const tl = U.el('div', { class: 'user-tile' },
          U.el('span', { class: 'ut-pic', html: B.userTile(kind, 48) }),
          U.el('span', { class: 'ut-name' }, U.el('b', null, name), sub ? U.el('small', null, sub) : null));
        tl.addEventListener('click', () => onClick(tl));
        right.appendChild(tl);
        return tl;
      };

      if (!haunted) {
        tile('daniel', t('name.daniel'), null, (tl) => B.logIn(tl));
      } else {
        G.audio.setAmbientLevel(3);
        tile('daniel', t('name.daniel'), t('login.danielSub'), (tl) => {
          tl.classList.add('shake');
          setTimeout(() => tl.classList.remove('shake'), 400);
          G.dialogs.msg({ title: 'Meridian', icon: 'warn', text: t('login.danielMsg'), x: 340, y: 300 });
        });
        tile('you', G.userName, null, (tl) => {
          G.state.level = 4;
          G.save();
          B.logIn(tl);
        });
        tile('host', t('name.host'), t('login.hostSub'), (tl) => {
          G.audio.play('sting');
          G.fx.glitch(200, 1.4);
          tl.querySelector('small').textContent = t('login.hostNotYet');
        });
      }
      return el;
    },

    async logIn(tileEl) {
      U.$$('.user-tile').forEach((x) => x.classList.toggle('chosen', x === tileEl));
      G.audio.play('click');
      await U.sleep(500);
      screen('welcome' + (G.state.level >= 4 ? ' haunted' : ''), U.el('div', { class: 'welcome-text' }, G.state.level >= 4 ? t('login.welcomeBack') : t('login.welcome')));
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
          U.el('div', { class: 'to-head' }, U.el('span', null, L >= 4 ? t('off.titleSign') : t('off.title')), U.el('span', { class: 'to-logo', html: G.icon('logo', 26) })),
          U.el('div', { class: 'to-body' },
            btn('standby', t('off.standby'), () => G.story.onShutdown('standby')),
            btn('off', t('off.off'), () => G.story.onShutdown('off', fromLogin)),
            btn('restart', t('off.restart'), () => G.story.onShutdown('restart', fromLogin))),
          U.el('div', { class: 'to-foot' }, U.el('button', { class: 'btn', onclick: close }, t('common.cancel')))));
      stage().appendChild(ov);
      document.body.classList.add('grayscale-bg');
      const obs = new MutationObserver(() => { if (!ov.isConnected) { document.body.classList.remove('grayscale-bg'); obs.disconnect(); } });
      obs.observe(stage(), { childList: true });
    },

    logOffDialog() {
      G.dialogs.msg({ title: t('logoff.title'), icon: 'logoff', text: t('logoff.q'), buttons: [t('logoff.btn'), t('common.cancel')] }).then((r) => {
        if (r !== t('logoff.btn')) return;
        if (G.state.level >= 3) {
          G.dialogs.msg({ title: t('logoff.title'), icon: 'error', text: G.state.level >= 4 ? t('logoff.denied4') : t('logoff.denied3') });
          return;
        }
        B.logOff();
      });
    },

    async logOff() {
      G.story.stop();
      G.wm.closeAll(true);
      G.audio.play('shutdown');
      screen('shutting', U.el('div', { class: 'shut-text' }, t('logoff.progress')));
      await U.sleep(1800);
      B.login();
    },

    async shutdownScreen(text) {
      G.story.stop();
      G.wm.closeAll(true);
      G.audio.play('shutdown');
      screen('shutting', U.el('div', { class: 'shut-logo', html: G.icon('logo', 64) }), U.el('div', { class: 'shut-text' }, text || t('shut.text')));
      await U.sleep(2600);
      G.audio.stopAmbient();
    },

    async safeToTurnOff() {
      screen('safe', U.el('div', { class: 'safe-text' }, t('shut.safe')));
      await U.sleep(1500);
    },

    // Real exit (Electron) or a "powered off" screen in the browser.
    quit() {
      if (window.meridian && window.meridian.quit) { window.meridian.quit(); return; }
      const el = screen('poweroff', U.el('div', { class: 'po-text' }, t('power.off')), U.el('div', { class: 'po-hint' }, t('power.hint')));
      el.addEventListener('click', () => B.bios(), { once: true });
    },

    screen
  };

  G.boot = B;
})(window.G);
