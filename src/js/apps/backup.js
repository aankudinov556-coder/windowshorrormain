// Byteline Backup Wizard — the player's "job", and the spine of the story.
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;

  const ITEMS = [
    { id: 'pics', label: () => t('fs.mypics'), icon: 'pics', node: 'mypics' },
    { id: 'docs', label: () => t('fs.mydocs'), icon: 'docs', node: 'mydocs' },
    { id: 'mail', label: () => t('bk.mail'), icon: 'mail' },
    { id: 'tapes', label: () => t('bk.tapes'), icon: 'driveTv', node: 'drive_d', warn: true }
  ];
  // Errors are saved as codes so switching language never leaves stale text in the save.
  const ERR = { pw: 'bk.errPw', space: 'bk.errSpace', notyet: 'bk.errNotYet' };

  function filesFor(id) {
    if (id === 'mail') return G.mailbox.visible().map((m) => ({ name: String(typeof m.subject === 'function' ? m.subject() : m.subject).slice(0, 40) + '.eml' }));
    const it = ITEMS.find((i) => i.id === id);
    return G.fs.files(G.fs.byId(it.node));
  }

  G.apps.register('backup', () => {
    const ex = G.wm.get('backup');
    if (ex) { ex.restore(); ex.focus(); ex.refresh && ex.refresh(); return ex; }

    let running = null;
    const rows = U.el('div', { class: 'bk-rows' });
    const pLabel = U.el('div', { class: 'bk-plabel' }, t('bk.ready'));
    const pFill = U.el('div', { class: 'bk-fill' });
    const pFile = U.el('div', { class: 'bk-file' }, ' ');
    const check = U.el('div', { class: 'bk-check' });

    const w = G.wm.open({
      key: 'backup', title: t('bk.title'), icon: 'backup', w: 560, h: 470, resizable: false, bodyClass: 'bk-body',
      canClose: () => {
        if (running) { G.dialogs.msg({ title: t('app.backup'), icon: 'warn', text: t('bk.busy') }); return false; }
        return true;
      }
    });
    w.body.appendChild(U.el('div', { class: 'bk-banner' },
      U.el('div', null, U.el('b', null, t('bk.title')), U.el('div', null, t('bk.job'))),
      U.el('span', { html: G.icon('backup', 32) })));
    w.body.appendChild(U.el('div', { class: 'bk-intro' }, t('bk.intro')));
    w.body.appendChild(rows);
    w.body.appendChild(U.el('div', { class: 'bk-progress' }, pLabel, U.el('div', { class: 'bk-bar' }, pFill), pFile));
    w.body.appendChild(check);

    function status(id) {
      if (running === id) return [t('bk.copying'), 'run'];
      if (G.state.backups[id]) return [t('bk.ok'), 'ok'];
      const e = G.state.flags['bk_err_' + id];
      if (e) return [t(ERR[e] || 'bk.errPw'), 'err'];
      return [t('bk.not'), ''];
    }

    function render() {
      const L = G.state.level;
      rows.innerHTML = '';
      ITEMS.forEach((it) => {
        const files = filesFor(it.id);
        const [st, cls] = status(it.id);
        let sub = t('bk.items', { n: files.length });
        if (it.id === 'tapes') sub = L >= 4 ? t('bk.tapesSub4', { n: files.length }) : t('bk.tapesSub', { n: files.length });
        const btn = U.el('button', { class: 'btn' }, G.state.backups[it.id] ? t('bk.again') : t('bk.backup'));
        btn.disabled = !!running || (G.state.backups[it.id] && it.id !== 'tapes');
        btn.addEventListener('click', () => run(it.id));
        rows.appendChild(U.el('div', { class: 'bk-row' + (it.warn ? ' warn' : '') + (it.warn && L >= 4 ? ' haunted' : '') },
          U.el('span', { html: G.icon(it.icon, 32) }),
          U.el('div', { class: 'bk-name' }, U.el('b', null, it.label()), U.el('small', null, sub)),
          U.el('span', { class: 'bk-st ' + cls }, st),
          btn));
      });
      const b = G.state.backups;
      check.innerHTML = '';
      check.appendChild(U.el('b', null, t('bk.check')));
      [['pics', 'bk.cPics'], ['docs', 'bk.cDocs'], ['mail', 'bk.cMail']].forEach(([k, l]) => check.appendChild(U.el('span', { class: b[k] ? 'done' : '' }, (b[k] ? '☑ ' : '☐ ') + t(l))));
      if (b.pics && b.docs && b.mail) check.appendChild(U.el('span', { class: 'bk-alldone' }, L >= 4 ? t('bk.allDone4') : t('bk.allDone')));
    }

    function setP(frac, label, file) {
      pFill.style.width = Math.round(U.clamp(frac, 0, 1) * 100) + '%';
      if (label != null) pLabel.textContent = label;
      if (file != null) pFile.textContent = file || ' ';
    }

    async function confirmTapes() {
      const L = G.state.level;
      if (L >= 4) {
        const a = await G.dialogs.msg({ title: t('name.daniel'), icon: 'question', text: t('bk.danText'), buttons: [t('bk.backup'), t('common.cancel')] });
        if (a !== t('bk.backup')) return false;
        const b = await G.dialogs.msg({ title: t('app.backup'), icon: 'warn', text: t('bk.warnText4'), buttons: [t('common.yes'), t('common.no')], defaultBtn: 1 });
        return b === t('common.yes');
      }
      const r = await G.dialogs.msg({ title: t('app.backup'), icon: 'warn', text: t('bk.warnText'), buttons: [t('common.yes'), t('common.no')], defaultBtn: 1 });
      return r === t('common.yes');
    }

    async function run(id) {
      if (running) return;
      if (id === 'tapes' && !(await confirmTapes())) return;
      const L = G.state.level;
      running = id;
      delete G.state.flags['bk_err_' + id];
      render();
      const it = ITEMS.find((i) => i.id === id);
      const files = filesFor(id);
      const extra = id === 'pics' && !files.some((f) => f.id === 'p_0047') ? [{ name: 'IMG_0047.jpg', phantom: true }] : [];
      const all = files.concat(extra);
      setP(0, t('bk.copyingItem', { item: it.label() }), '');
      G.emit('backup:start', id);
      let skipped = 0;
      for (let i = 0; i < all.length; i++) {
        if (w.closed) { running = null; return; }
        const f = all[i];
        setP(i / all.length, null, (f.parent ? G.fs.path(f) : f.name));
        G.audio.play(U.chance(0.15) ? 'hddDeath' : 'hdd');
        await U.sleep(id === 'tapes' ? U.randi(900, 1500) : U.randi(160, 420));

        if (id === 'pics' && (f.phantom || f.id === 'p_0047')) {
          await U.sleep(900);
          pFile.textContent = t('bk.inUse', { name: f.name });
          G.audio.play('exclaim');
          skipped++;
          G.flag('picsSkipped', true);
          await U.sleep(1300);
        }
        if (id === 'docs' && f.parent && (f.parent.id === 'engineering' || f.parent.id === 'frames')) {
          if (!G.state.unlocked.engineering) {
            G.audio.play('ding');
            G.state.flags.bk_err_docs = 'pw';
            G.save();
            running = null;
            setP(i / all.length, t('bk.stopped'), t('bk.cantRead', { path: engPath() }));
            render();
            G.emit('backup:blocked', 'docs');
            G.dialogs.msg({ title: t('app.backup'), icon: 'error', text: t('bk.cantReadDlg', { path: engPath() }) });
            return;
          }
        }
        if (id === 'tapes') {
          if (L < 4 && i >= 2) {
            G.audio.play('ding');
            running = null;
            G.state.flags.bk_err_tapes = L >= 3 ? 'notyet' : 'space';
            G.save();
            setP(i / all.length, t('bk.failed'), '');
            render();
            G.dialogs.msg({ title: t('app.backup'), icon: 'error', text: U.fill(L >= 3 ? t('bk.notYetDlg') : t('bk.noSpaceDlg')) });
            return;
          }
          if (L >= 4) {
            G.fx.glitch(250, 1 + i * 0.25);
            G.fx.subliminal(U.pick([].concat(t('bk.subs'))), 90);
            if (i === all.length - 1) G.audio.play('sting');
          }
        }
      }
      if (id === 'tapes' && L >= 4) {
        running = null;
        setP(1, t('bk.complete'), t('bk.thanks'));
        await U.sleep(1200);
        G.endings.homecoming();
        return;
      }
      setP(1, t('bk.result', { item: it.label(), ok: all.length - skipped, all: all.length }) + (skipped ? t('bk.resultSkipped', { n: skipped }) : '.'), skipped ? t('bk.skippedFile') : t('bk.done'));
      G.state.backups[id] = true;
      G.save();
      running = null;
      render();
      G.audio.play('notify');
      G.emit('backup:done', id);
      G.emit('fs:change');
      const b = G.state.backups;
      if (b.pics && b.docs && b.mail && !G.flag('backupAll')) { G.flag('backupAll', true); G.emit('backup:all'); }
    }

    // "My Documents\Station\Engineering" in the current language.
    function engPath() {
      return [G.fs.byId('mydocs'), G.fs.byId('station'), G.fs.byId('engineering')].map((n) => n.name).join('\\');
    }

    w.refresh = render;
    const unsub = G.on('fs:change', () => { if (!w.closed && !running) render(); });
    w.onClose(unsub);
    render();
    return w;
  });
})(window.G);
