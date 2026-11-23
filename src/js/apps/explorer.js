// App registry + the file Explorer.
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;

  G.apps = {
    reg: {},
    register(name, fn) { G.apps.reg[name] = fn; },
    launch(name, args = {}) {
      const fn = G.apps.reg[name];
      if (!fn) { G.dialogs.msg({ title: 'Meridian', icon: 'error', text: t('run.notFound', { v: name }) }); return null; }
      G.cursor.busy(400);
      G.emit('app:launch', { name, args });
      return fn(args);
    }
  };

  const OTHER_PLACES = {
    desktop: ['mycomputer', 'mydocs', 'recycle'],
    mycomputer: ['mydocs', 'desktop', 'recycle'],
    mydocs: ['desktop', 'mycomputer', 'recycle'],
    recycle: ['desktop', 'mydocs', 'mycomputer'],
    _default: ['mydocs', 'mycomputer', 'desktop']
  };

  function folderIcon(n) {
    const ic = G.fs.icon(n);
    return ic === 'folder' ? 'folderOpen' : ic;
  }

  G.apps.register('explorer', (args) => {
    let node = args.node || G.fs.byId('mycomputer');
    const existing = G.wm.wins.find((w) => w.explorerNode === node);
    if (existing) { existing.restore(); existing.focus(); return existing; }

    const hist = [];
    const fwd = [];
    let selected = null;

    const addrIcon = U.el('span', { class: 'addr-ico' });
    const addrText = U.el('span', { class: 'addr-text' });
    const backBtn = U.el('button', { class: 'tbtn' }, U.el('span', { class: 'arrow-ico back' }), t('ex.back'));
    const fwdBtn = U.el('button', { class: 'tbtn' }, U.el('span', { class: 'arrow-ico fwd' }));
    const upBtn = U.el('button', { class: 'tbtn', title: t('ex.up') }, U.el('span', { class: 'up-ico', html: G.icon('folderOpen', 20) }));
    const toolbar = U.el('div', { class: 'ex-toolbars' },
      U.el('div', { class: 'ex-toolbar' }, backBtn, fwdBtn, upBtn,
        U.el('span', { class: 'tsep' }),
        U.el('button', { class: 'tbtn', onclick: () => G.apps.launch('search') }, U.el('span', { html: G.icon('search', 20) }), t('app.search')),
        U.el('button', { class: 'tbtn' }, U.el('span', { html: G.icon('folder', 20) }), t('ex.folders'))),
      U.el('div', { class: 'ex-address' }, U.el('span', { class: 'addr-label' }, t('ex.address')), U.el('div', { class: 'addr-box' }, addrIcon, addrText, U.el('span', { class: 'addr-drop' }, '▾')), U.el('button', { class: 'tbtn go' }, '➜ ' + t('ex.go'))));

    const tasks = U.el('div', { class: 'ex-tasks' });
    const list = U.el('div', { class: 'ex-list' });

    const w = G.wm.open({
      title: G.fs.label(node), icon: folderIcon(node), w: 640, h: 440, status: ' ',
      menu: [
        { label: t('menu.file'), items: () => [{ label: t('menu.open'), disabled: !selected, action: () => selected && openNode(selected) }, { sep: true }, { label: t('menu.close'), action: () => w.close() }] },
        { label: t('menu.edit'), items: [{ label: t('menu.selectAll'), disabled: true }] },
        { label: t('menu.view'), items: [{ label: t('menu.refresh'), action: () => render() }] },
        { label: t('menu.favorites'), items: [{ label: t('menu.empty'), disabled: true }] },
        { label: t('menu.tools'), items: [{ label: t('menu.folderOptions'), disabled: true }] },
        { label: t('menu.help'), items: [{ label: t('menu.about'), action: () => G.apps.launch('about') }] }
      ],
      toolbar,
      bodyClass: 'ex-body'
    });
    w.body.appendChild(tasks);
    w.body.appendChild(list);

    backBtn.addEventListener('click', () => { if (hist.length) { fwd.push(node); go(hist.pop(), true); } });
    fwdBtn.addEventListener('click', () => { if (fwd.length) { hist.push(node); go(fwd.pop(), true); } });
    upBtn.addEventListener('click', () => { if (node.parent && node.parent.id !== 'root') navigate(node.parent); else if (node.id !== 'desktop') navigate(G.fs.byId('desktop')); });

    const unsub = G.on('fs:change', () => { if (!w.closed) render(); });
    w.onClose(() => unsub());

    function go(n, fromHistory) {
      if (!fromHistory) { hist.push(node); fwd.length = 0; }
      node = n;
      w.explorerNode = n;
      selected = null;
      render();
    }

    async function navigate(n) {
      if (n.type === 'drive' && n.onOpen) { n.onOpen(n); return; }
      if (n.locked && !G.state.unlocked[n.id]) {
        const ok = await G.apps.unlock(n);
        if (!ok) return;
      }
      G.audio.play('click');
      go(n);
    }

    function openNode(n) {
      if (n.bin && !G.state.restored[n.id]) return restorePrompt(n);
      if (n.kind === 'lnk' && n.target) n = G.fs.byId(n.target);
      if (n.type === 'dir' || n.type === 'drive' || n.type === 'special') return navigate(n);
      G.fs.open(n);
    }

    async function restorePrompt(n) {
      const r = await G.dialogs.msg({ title: t('fs.recycle'), icon: 'question', text: t('ex.restoreQ', { name: n.name }), buttons: [t('ex.restoreBtn'), t('common.cancel')] });
      if (r !== t('ex.restoreBtn')) return;
      G.state.restored[n.id] = true;
      G.save();
      G.audio.play('click');
      G.emit('file:restore', n);
      G.emit('fs:change');
      G.desktop.renderIcons();
    }

    function taskBox(title, rows) {
      return U.el('div', { class: 'tk-box' }, U.el('div', { class: 'tk-head' }, title, U.el('span', { class: 'tk-chev' }, '︽')), U.el('div', { class: 'tk-rows' }, rows));
    }

    function renderTasks() {
      tasks.innerHTML = '';
      const rows = [];
      if (node.id === 'recycle') {
        rows.push(U.el('div', { class: 'tk-link', onclick: () => { if (selected) restorePrompt(selected); else G.dialogs.msg({ title: t('fs.recycle'), icon: 'info', text: t('ex.selectToRestore') }); } }, U.el('span', { html: G.icon('folderOpen', 16) }), t('ex.restoreItem')));
        rows.push(U.el('div', { class: 'tk-link', onclick: () => G.dialogs.msg({ title: t('fs.recycle'), icon: 'error', text: t('ex.emptyBinErr') }) }, U.el('span', { html: G.icon('binEmpty', 16) }), t('ex.emptyBin')));
        tasks.appendChild(taskBox(t('ex.binTasks'), rows));
      } else if (node.id === 'mycomputer') {
        rows.push(U.el('div', { class: 'tk-link', onclick: () => G.apps.launch('sysinfo') }, U.el('span', { html: G.icon('info', 16) }), t('ex.sysInfo')));
        rows.push(U.el('div', { class: 'tk-link', onclick: () => G.apps.launch('control') }, U.el('span', { html: G.icon('control', 16) }), t('ex.changeSetting')));
        tasks.appendChild(taskBox(t('ex.sysTasks'), rows));
      } else {
        rows.push(U.el('div', { class: 'tk-link dis' }, U.el('span', { html: G.icon('folder', 16) }), t('ex.newFolder')));
        rows.push(U.el('div', { class: 'tk-link dis' }, U.el('span', { html: G.icon('web', 16) }), t('ex.publish')));
        tasks.appendChild(taskBox(t('ex.fileTasks'), rows));
      }
      const placeIds = OTHER_PLACES[node.id] || OTHER_PLACES._default;
      const places = placeIds.map((id) => {
        const p = G.fs.byId(id);
        return U.el('div', { class: 'tk-link', onclick: () => navigate(p) }, U.el('span', { html: G.icon(G.fs.icon(p), 16) }), G.fs.label(p));
      });
      if (node.parent && node.parent.id !== 'root' && !OTHER_PLACES[node.id] && !placeIds.includes(node.parent.id)) {
        places.unshift(U.el('div', { class: 'tk-link', onclick: () => navigate(node.parent) }, U.el('span', { html: G.icon(folderIcon(node.parent), 16) }), G.fs.label(node.parent)));
      }
      tasks.appendChild(taskBox(t('ex.otherPlaces'), places));
      const d = selected || node;
      const details = [U.el('b', null, G.fs.label(d)), U.el('div', null, G.fs.typeName(d))];
      if (d.date) details.push(U.el('div', null, t('ex.dateMod', { v: U.stamp(d.date) })));
      if (d.size) details.push(U.el('div', null, t('ex.size', { v: G.fs.size(d) })));
      if (d.free) details.push(U.el('div', null, d.free));
      tasks.appendChild(taskBox(t('ex.details'), [U.el('div', { class: 'tk-details' }, details)]));
    }

    function render() {
      const L = G.state.level;
      w.setTitle(G.fs.label(node));
      w.setIcon(folderIcon(node));
      addrIcon.innerHTML = G.icon(folderIcon(node), 16);
      addrText.textContent = node.addr || (node.type === 'special' ? G.fs.label(node) : G.fs.path(node));
      backBtn.disabled = !hist.length;
      fwdBtn.disabled = !fwd.length;
      list.innerHTML = '';
      if (node.locked && !G.state.unlocked[node.id]) {
        list.appendChild(U.el('div', { class: 'ex-empty' }, t('ex.locked')));
        renderTasks();
        return;
      }
      const kids = G.fs.children(node);
      const tiles = node.id === 'mycomputer';
      list.classList.toggle('tiles', tiles);
      if (!kids.length) list.appendChild(U.el('div', { class: 'ex-empty' }, node.emptyText || t('fs.emptyFolder')));
      kids.forEach((k) => {
        const label = G.fs.label(k);
        const item = U.el('div', { class: 'ex-item', tabindex: '0' },
          U.el('span', { class: 'ex-ico', html: k.shortcut ? G.iconWithShortcut(G.fs.icon(k), 32) : G.icon(G.fs.icon(k), 32) }),
          U.el('span', { class: 'ex-label' }, label, tiles ? U.el('small', null, k.free || G.fs.typeName(k)) : null));
        item.addEventListener('pointerdown', () => {
          U.$$('.ex-item.sel', list).forEach((x) => x.classList.remove('sel'));
          item.classList.add('sel');
          selected = k;
          renderTasks();
          w.setStatus(t('ex.statusType', { v: G.fs.typeName(k) }) + (k.date ? '   ' + t('ex.dateMod', { v: U.stamp(k.date) }) : '') + (k.size ? '   ' + t('ex.size', { v: G.fs.size(k) }) : ''));
        });
        item.addEventListener('dblclick', () => openNode(k));
        item.addEventListener('keydown', (e) => { if (e.key === 'Enter') openNode(k); });
        list.appendChild(item);
      });
      w.setStatus(t('ex.objects', { n: kids.length }) + (L >= 3 && node.id === 'mydocs' ? '   ' + t('ex.watching') : ''));
      renderTasks();
      if (L >= 2 && U.chance(0.12 * L)) setTimeout(() => G.fx.corruptText(list, 500, 0.3), U.randi(300, 1500));
    }

    list.addEventListener('pointerdown', (e) => {
      if (e.target === list) { U.$$('.ex-item.sel', list).forEach((x) => x.classList.remove('sel')); selected = null; renderTasks(); }
    });

    w.explorerNode = node;
    render();
    if (node.locked && !G.state.unlocked[node.id]) {
      G.apps.unlock(node).then((ok) => { if (ok) render(); else w.close(true); });
    }
    return w;
  });

  // Password prompt for protected folders.
  G.apps.unlock = async function (n) {
    G.state.flags.unlockTries = G.state.flags.unlockTries || 0;
    const hint = G.state.flags.unlockTries >= 2 ? '\n' + t('pw.hint') : '';
    const pw = await G.dialogs.prompt({ title: t('pw.title'), icon: 'lockedFolder', text: t('pw.text', { name: n.name }) + hint, label: t('pw.label'), password: true });
    if (pw == null) return false;
    if (pw.replace(/\s/g, '') === n.locked || pw.replace(/[\s.,]/g, '') === n.locked) {
      G.state.unlocked[n.id] = true;
      G.save();
      G.audio.play('logon');
      G.emit('folder:unlock', n);
      G.emit('fs:change');
      return true;
    }
    G.state.flags.unlockTries++;
    G.save();
    await G.dialogs.msg({ title: t('pw.title'), icon: 'error', text: t('pw.wrong') });
    return false;
  };
})(window.G);
