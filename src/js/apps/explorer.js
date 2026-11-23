// App registry + the file Explorer.
(function (G) {
  'use strict';
  const U = G.util;

  G.apps = {
    reg: {},
    register(name, fn) { G.apps.reg[name] = fn; },
    launch(name, args = {}) {
      const fn = G.apps.reg[name];
      if (!fn) { G.dialogs.msg({ title: 'Meridian', icon: 'error', text: 'Meridian cannot find \'' + name + '\'.' }); return null; }
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
    const backBtn = U.el('button', { class: 'tbtn' }, U.el('span', { class: 'arrow-ico back' }), 'Back');
    const fwdBtn = U.el('button', { class: 'tbtn' }, U.el('span', { class: 'arrow-ico fwd' }));
    const upBtn = U.el('button', { class: 'tbtn', title: 'Up' }, U.el('span', { class: 'up-ico', html: G.icon('folderOpen', 20) }));
    const toolbar = U.el('div', { class: 'ex-toolbars' },
      U.el('div', { class: 'ex-toolbar' }, backBtn, fwdBtn, upBtn,
        U.el('span', { class: 'tsep' }),
        U.el('button', { class: 'tbtn', onclick: () => G.apps.launch('search') }, U.el('span', { html: G.icon('search', 20) }), 'Search'),
        U.el('button', { class: 'tbtn' }, U.el('span', { html: G.icon('folder', 20) }), 'Folders')),
      U.el('div', { class: 'ex-address' }, U.el('span', { class: 'addr-label' }, 'Address'), U.el('div', { class: 'addr-box' }, addrIcon, addrText, U.el('span', { class: 'addr-drop' }, '▾')), U.el('button', { class: 'tbtn go' }, '➜ Go')));

    const tasks = U.el('div', { class: 'ex-tasks' });
    const list = U.el('div', { class: 'ex-list' });

    const w = G.wm.open({
      title: G.fs.label(node), icon: folderIcon(node), w: 640, h: 440, status: ' ',
      menu: [
        { label: 'File', items: () => [{ label: 'Open', disabled: !selected, action: () => selected && openNode(selected) }, { sep: true }, { label: 'Close', action: () => w.close() }] },
        { label: 'Edit', items: [{ label: 'Select All', disabled: true }] },
        { label: 'View', items: [{ label: 'Refresh', action: () => render() }] },
        { label: 'Favorites', items: [{ label: '(empty)', disabled: true }] },
        { label: 'Tools', items: [{ label: 'Folder Options...', disabled: true }] },
        { label: 'Help', items: [{ label: 'About Meridian', action: () => G.apps.launch('about') }] }
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
      const r = await G.dialogs.msg({ title: 'Recycle Bin', icon: 'question', text: '"' + n.name + '" is in the Recycle Bin.\n\nDo you want to restore it to its original location?', buttons: ['Restore', 'Cancel'] });
      if (r !== 'Restore') return;
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
        rows.push(U.el('div', { class: 'tk-link', onclick: () => { if (selected) restorePrompt(selected); else G.dialogs.msg({ title: 'Recycle Bin', icon: 'info', text: 'Select an item to restore it.' }); } }, U.el('span', { html: G.icon('folderOpen', 16) }), 'Restore this item'));
        rows.push(U.el('div', { class: 'tk-link', onclick: () => G.dialogs.msg({ title: 'Recycle Bin', icon: 'error', text: 'Cannot empty the Recycle Bin: the disk is write-protected.' }) }, U.el('span', { html: G.icon('binEmpty', 16) }), 'Empty the Recycle Bin'));
        tasks.appendChild(taskBox('Recycle Bin Tasks', rows));
      } else if (node.id === 'mycomputer') {
        rows.push(U.el('div', { class: 'tk-link', onclick: () => G.apps.launch('sysinfo') }, U.el('span', { html: G.icon('info', 16) }), 'View system information'));
        rows.push(U.el('div', { class: 'tk-link', onclick: () => G.apps.launch('control') }, U.el('span', { html: G.icon('control', 16) }), 'Change a setting'));
        tasks.appendChild(taskBox('System Tasks', rows));
      } else {
        rows.push(U.el('div', { class: 'tk-link dis' }, U.el('span', { html: G.icon('folder', 16) }), 'Make a new folder'));
        rows.push(U.el('div', { class: 'tk-link dis' }, U.el('span', { html: G.icon('web', 16) }), 'Publish this folder to the Web'));
        tasks.appendChild(taskBox('File and Folder Tasks', rows));
      }
      const places = (OTHER_PLACES[node.id] || OTHER_PLACES._default).map((id) => {
        const p = G.fs.byId(id);
        return U.el('div', { class: 'tk-link', onclick: () => navigate(p) }, U.el('span', { html: G.icon(G.fs.icon(p), 16) }), G.fs.label(p));
      });
      const placeIds = OTHER_PLACES[node.id] || OTHER_PLACES._default;
      if (node.parent && node.parent.id !== 'root' && !OTHER_PLACES[node.id] && !placeIds.includes(node.parent.id)) {
        places.unshift(U.el('div', { class: 'tk-link', onclick: () => navigate(node.parent) }, U.el('span', { html: G.icon(folderIcon(node.parent), 16) }), G.fs.label(node.parent)));
      }
      tasks.appendChild(taskBox('Other Places', places));
      const d = selected || node;
      const details = [U.el('b', null, G.fs.label(d)), U.el('div', null, G.fs.typeName(d))];
      if (d.date) details.push(U.el('div', null, 'Date Modified: ' + U.fill(d.date)));
      if (d.size) details.push(U.el('div', null, 'Size: ' + d.size));
      if (d.free) details.push(U.el('div', null, d.free));
      tasks.appendChild(taskBox('Details', [U.el('div', { class: 'tk-details' }, details)]));
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
        list.appendChild(U.el('div', { class: 'ex-empty' }, 'This folder is password protected.'));
        renderTasks();
        return;
      }
      const kids = G.fs.children(node);
      const tiles = node.id === 'mycomputer';
      list.classList.toggle('tiles', tiles);
      if (!kids.length) list.appendChild(U.el('div', { class: 'ex-empty' }, node.emptyText || 'This folder is empty.'));
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
          w.setStatus('Type: ' + G.fs.typeName(k) + (k.date ? '   Date Modified: ' + U.fill(k.date) : '') + (k.size ? '   Size: ' + k.size : ''));
        });
        item.addEventListener('dblclick', () => openNode(k));
        item.addEventListener('keydown', (e) => { if (e.key === 'Enter') openNode(k); });
        list.appendChild(item);
      });
      w.setStatus(kids.length + ' object(s)' + (L >= 3 && node.id === 'mydocs' ? '   (+1 watching)' : ''));
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
    const hint = G.state.flags.unlockTries >= 2 ? '\nHint (set by Daniel): "the usual one — ask Ruth"' : '';
    const pw = await G.dialogs.prompt({ title: 'Protected Folder', icon: 'lockedFolder', text: '"' + n.name + '" is password protected.' + hint, label: 'Password:', password: true });
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
    await G.dialogs.msg({ title: 'Protected Folder', icon: 'error', text: 'The password is incorrect.' });
    return false;
  };
})(window.G);
