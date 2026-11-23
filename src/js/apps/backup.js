// Byteline Backup Wizard — the player's "job", and the spine of the story.
(function (G) {
  'use strict';
  const U = G.util;

  const ITEMS = [
    { id: 'pics', label: 'My Pictures', icon: 'pics', node: 'mypics' },
    { id: 'docs', label: 'My Documents', icon: 'docs', node: 'mydocs' },
    { id: 'mail', label: 'E-mail (Meridian Mail)', icon: 'mail' },
    { id: 'tapes', label: 'TV Recordings (D:)', icon: 'driveTv', node: 'drive_d', warn: true }
  ];

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
    const pLabel = U.el('div', { class: 'bk-plabel' }, 'Ready.');
    const pFill = U.el('div', { class: 'bk-fill' });
    const pFile = U.el('div', { class: 'bk-file' }, ' ');
    const check = U.el('div', { class: 'bk-check' });

    const w = G.wm.open({
      key: 'backup', title: 'Byteline Backup Wizard', icon: 'backup', w: 560, h: 470, resizable: false, bodyClass: 'bk-body',
      canClose: () => {
        if (running) { G.dialogs.msg({ title: 'Backup Wizard', icon: 'warn', text: 'A backup is in progress. Please wait until it finishes.' }); return false; }
        return true;
      }
    });
    w.body.appendChild(U.el('div', { class: 'bk-banner' },
      U.el('div', null, U.el('b', null, 'Byteline Backup Wizard'), U.el('div', null, 'Job #4471 — customer: L. Mercer — destination: BYTELINE_BKP (E:)')),
      U.el('span', { html: G.icon('backup', 32) })));
    w.body.appendChild(U.el('div', { class: 'bk-intro' }, 'Choose what to copy to the backup drive. Each item is copied separately.'));
    w.body.appendChild(rows);
    w.body.appendChild(U.el('div', { class: 'bk-progress' }, pLabel, U.el('div', { class: 'bk-bar' }, pFill), pFile));
    w.body.appendChild(check);

    function status(id) {
      if (running === id) return ['Copying...', 'run'];
      if (G.state.backups[id]) return ['Backed up ✓', 'ok'];
      if (G.state.flags['bk_err_' + id]) return [G.state.flags['bk_err_' + id], 'err'];
      return ['Not backed up', ''];
    }

    function render() {
      const L = G.state.level;
      rows.innerHTML = '';
      ITEMS.forEach((it) => {
        const files = filesFor(it.id);
        const [st, cls] = status(it.id);
        let sub = files.length + ' item(s)';
        if (it.id === 'tapes') sub = L >= 4 ? files.length + ' recording(s) — Lily wants her father.' : files.length + ' recording(s), 26.7 GB — customer said DO NOT COPY';
        const btn = U.el('button', { class: 'btn' }, G.state.backups[it.id] ? 'Again' : 'Back Up');
        btn.disabled = !!running || (G.state.backups[it.id] && it.id !== 'tapes');
        btn.addEventListener('click', () => run(it.id));
        rows.appendChild(U.el('div', { class: 'bk-row' + (it.warn ? ' warn' : '') + (it.warn && L >= 4 ? ' haunted' : '') },
          U.el('span', { html: G.icon(it.icon, 32) }),
          U.el('div', { class: 'bk-name' }, U.el('b', null, it.label), U.el('small', null, sub)),
          U.el('span', { class: 'bk-st ' + cls }, st),
          btn));
      });
      const b = G.state.backups;
      check.innerHTML = '';
      check.appendChild(U.el('b', null, "Pete's checklist: "));
      [['pics', 'Pictures'], ['docs', 'Documents'], ['mail', 'E-mail']].forEach(([k, l]) => check.appendChild(U.el('span', { class: b[k] ? 'done' : '' }, (b[k] ? '☑ ' : '☐ ') + l)));
      if (b.pics && b.docs && b.mail) check.appendChild(U.el('span', { class: 'bk-alldone' }, L >= 4 ? '— one item left.' : '— all done. You can shut down now.'));
    }

    function setP(frac, label, file) {
      pFill.style.width = Math.round(U.clamp(frac, 0, 1) * 100) + '%';
      if (label != null) pLabel.textContent = label;
      if (file != null) pFile.textContent = file || ' ';
    }

    async function confirmTapes() {
      const L = G.state.level;
      if (L >= 4) {
        const a = await G.dialogs.msg({ title: 'Daniel', icon: 'question', text: 'Lily should have these.\n\nIt\'s me in them. It\'s the only place I still am.\nPlease. Take me home.', buttons: ['Back Up', 'Cancel'] });
        if (a !== 'Back Up') return false;
        const b = await G.dialogs.msg({ title: 'Backup Wizard', icon: 'warn', text: 'The customer asked you NOT to copy the TV recordings.\n\n"I don\'t want those. Please don\'t copy those."\n\nCopy them to BYTELINE_BKP (E:) anyway?', buttons: ['Yes', 'No'], defaultBtn: 1 });
        return b === 'Yes';
      }
      const r = await G.dialogs.msg({ title: 'Backup Wizard', icon: 'warn', text: 'Pete\'s note says the customer does NOT want the TV recordings copied.\n\nCopy them anyway?', buttons: ['Yes', 'No'], defaultBtn: 1 });
      return r === 'Yes';
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
      setP(0, 'Copying ' + it.label + '...', '');
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
          pFile.textContent = f.name + ' — in use by another program. Skipped.';
          G.audio.play('exclaim');
          skipped++;
          G.flag('picsSkipped', true);
          await U.sleep(1300);
        }
        if (id === 'docs' && f.parent && (f.parent.id === 'engineering' || f.parent.id === 'frames')) {
          if (!G.state.unlocked.engineering) {
            G.audio.play('ding');
            G.state.flags.bk_err_docs = 'Stopped: password';
            G.save();
            running = null;
            setP(i / all.length, 'Backup stopped.', 'Cannot read "My Documents\\Station\\Engineering": the folder is password protected.');
            render();
            G.emit('backup:blocked', 'docs');
            G.dialogs.msg({ title: 'Backup Wizard', icon: 'error', text: 'Cannot read "My Documents\\Station\\Engineering".\n\nThe folder is password protected. Open it in Explorer and enter the password, then run the backup again.' });
            return;
          }
        }
        if (id === 'tapes') {
          if (L < 4 && i >= 2) {
            G.audio.play('ding');
            running = null;
            G.state.flags.bk_err_tapes = L >= 3 ? 'Not yet.' : 'Not enough space';
            G.save();
            setP(i / all.length, 'Backup failed.', '');
            render();
            G.dialogs.msg({ title: 'Backup Wizard', icon: 'error', text: L >= 3 ? 'Not yet, {User}.\n\nYou haven\'t met everyone.'.replace('{User}', G.userName) : 'There is not enough free space on BYTELINE_BKP (E:).\n\n26.7 GB required, 14.2 GB available.\n\n(Probably for the best. Pete said not to.)' });
            return;
          }
          if (L >= 4) {
            G.fx.glitch(250, 1 + i * 0.25);
            G.fx.subliminal(U.pick(['THANK YOU', 'HOME', 'LILY', 'GOODNIGHT', 'WE\'RE COMING']), 90);
            if (i === all.length - 1) G.audio.play('sting');
          }
        }
      }
      if (id === 'tapes' && L >= 4) {
        running = null;
        setP(1, 'Backup complete.', 'Thank you.');
        await U.sleep(1200);
        G.endings.homecoming();
        return;
      }
      setP(1, it.label + ': ' + (all.length - skipped) + ' of ' + all.length + ' copied' + (skipped ? ', ' + skipped + ' skipped.' : '.'), skipped ? 'Skipped: IMG_0047.jpg (in use by another program)' : 'Done.');
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

    w.refresh = render;
    const unsub = G.on('fs:change', () => { if (!w.closed && !running) render(); });
    w.onClose(unsub);
    render();
    return w;
  });
})(window.G);
