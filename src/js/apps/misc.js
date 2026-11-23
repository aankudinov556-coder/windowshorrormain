// Small system apps: Run, Web, Control Panel, Help, Search, Properties, About.
(function (G) {
  'use strict';
  const U = G.util;

  G.apps.register('run', () => {
    const ex = G.wm.get('run');
    if (ex) { ex.focus(); return ex; }
    const input = U.el('input', { class: 'field run-field', spellcheck: 'false' });
    const w = G.wm.open({ key: 'run', title: 'Run', w: 360, h: 'auto', x: 8, y: 560, resizable: false, minimizable: false, cls: 'dialog' });
    w.el.style.height = 'auto';
    const go = () => {
      const v = input.value.trim().toLowerCase().replace(/\.exe$/, '');
      w.close(true);
      const map = { cmd: 'cmd', command: 'cmd', notepad: 'notepad', taskmgr: 'taskmgr', explorer: 'explorer', mtv: 'tv', tv: 'tv', mmail: 'mail', mail: 'mail', backup: 'backup', control: 'control', iexplore: 'web', web: 'web' };
      if (!v) return;
      if (v === 'txctl') return G.apps.launch('cmd', { run: 'txctl' });
      if (v === 'host') return G.story.hostProgram();
      if (map[v]) return G.apps.launch(map[v], {});
      const n = G.fs.findByName(v) || G.fs.findByName(v + '.txt', G.fs.byId('desktop'));
      if (n) return G.fs.open(n);
      G.dialogs.msg({ title: v, icon: 'error', text: 'Meridian cannot find \'' + v + '\'. Make sure you typed the name correctly, and then try again.' });
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); if (e.key === 'Escape') w.close(true); });
    w.body.appendChild(U.el('div', { class: 'dlg-body' }, U.el('div', { class: 'dlg-icon', html: G.icon('run', 32) }), U.el('div', { class: 'dlg-text' }, 'Type the name of a program, folder, document, or Internet resource, and Meridian will open it for you.')));
    w.body.appendChild(U.el('div', { class: 'run-row' }, U.el('label', null, 'Open:'), input));
    w.body.appendChild(U.el('div', { class: 'dlg-buttons' }, U.el('button', { class: 'btn default', onclick: go }, 'OK'), U.el('button', { class: 'btn', onclick: () => w.close(true) }, 'Cancel')));
    setTimeout(() => input.focus(), 30);
    return w;
  });

  G.apps.register('web', () => {
    const L = G.state.level;
    const page = U.el('div', { class: 'web-page' },
      U.el('div', { class: 'web-err-title' }, U.el('span', { html: G.icon('info', 32) }), L >= 3 ? 'There is nothing outside.' : 'The page cannot be displayed'),
      U.el('p', null, L >= 3 ? 'You are not connected to the Internet. You are connected to Channel 12.' : 'The page you are looking for is currently unavailable. The Web site might be experiencing technical difficulties, or you may need to adjust your browser settings.'),
      U.el('hr'),
      U.el('p', null, 'Please try the following:'),
      U.el('ul', null, U.el('li', null, 'Check that the network cable is plugged in.'), U.el('li', null, L >= 2 ? 'Check that no one is standing behind you.' : 'Click the Refresh button, or try again later.')),
      U.el('p', { class: 'dim' }, 'Cannot find server or DNS Error\nMeridian Web'));
    const w = G.wm.open({ key: 'web', title: 'Cannot find server - Meridian Web', icon: 'web', w: 600, h: 440, status: 'Done',
      toolbar: U.el('div', { class: 'ex-address' }, U.el('span', { class: 'addr-label' }, 'Address'), U.el('div', { class: 'addr-box' }, U.el('span', { html: G.icon('web', 16) }), U.el('span', { class: 'addr-text' }, 'http://www.hvb12.com/'))),
      bodyClass: 'web-body' });
    w.body.innerHTML = '';
    w.body.appendChild(page);
    return w;
  });

  G.apps.register('control', () => {
    const items = [['display', 'Display'], ['speaker', 'Sounds and Audio'], ['network', 'Network Connections'], ['logoff', 'User Accounts'], ['tv', 'TV Tuner'], ['backup', 'Backup']];
    const grid = U.el('div', { class: 'ex-list' });
    items.forEach(([ic, label]) => {
      const it = U.el('div', { class: 'ex-item' }, U.el('span', { class: 'ex-ico', html: G.icon(G.hasIcon(ic) ? ic : 'control', 32) }), U.el('span', { class: 'ex-label' }, label));
      it.addEventListener('dblclick', () => {
        if (label === 'Display') return G.apps.launch('display');
        if (label === 'Sounds and Audio') return G.taskbar.volumePopup();
        if (label === 'TV Tuner') return G.dialogs.msg({ title: 'TV Tuner', icon: 'info', text: 'TVR-878 Video Capture\nAuto-record: ON\nChannel: 12\nScheduled: 03:33 daily\n\nThese settings are locked by mtvsched.exe.' });
        if (label === 'User Accounts') return G.dialogs.msg({ title: 'User Accounts', icon: 'info', text: G.state.level >= 3 ? 'Accounts on this computer:\n\nDaniel (logged on)\n' + G.userName + ' (watching)\nHost' : 'Accounts on this computer:\n\nDaniel (Computer administrator)' });
        if (label === 'Backup') return G.apps.launch('backup');
        G.dialogs.msg({ title: label, icon: 'error', text: 'This setting cannot be changed while the disk is write-protected.' });
      });
      grid.appendChild(it);
    });
    const w = G.wm.open({ key: 'control', title: 'Control Panel', icon: 'control', w: 520, h: 320, status: items.length + ' objects' });
    w.body.innerHTML = '';
    w.body.appendChild(grid);
    return w;
  });

  G.apps.register('display', () => {
    const c = U.el('canvas', { class: 'dp-preview' });
    G.wallpaper.draw(c, G.state.level);
    const w = G.wm.open({ key: 'display', title: 'Display Properties', icon: 'computer', w: 400, h: 'auto', resizable: false, cls: 'dialog' });
    w.el.style.height = 'auto';
    w.body.innerHTML = '';
    w.body.appendChild(U.el('div', { class: 'dp-body' },
      U.el('div', { class: 'dp-monitor' }, c),
      U.el('div', null, 'Background:'),
      U.el('div', { class: 'dp-list' }, U.el('div', { class: 'sel' }, 'Pell Hill (Daniel)'), U.el('div', { class: 'dis' }, 'Autumn'), U.el('div', { class: 'dis' }, 'Blue Lace'), U.el('div', { class: 'dis' }, '(None)')),
      U.el('div', { class: 'dim' }, G.state.level >= 2 ? 'The background cannot be changed. Someone is standing in it.' : 'The background is locked by the administrator.')));
    w.body.appendChild(U.el('div', { class: 'dlg-buttons' }, U.el('button', { class: 'btn default', onclick: () => w.close(true) }, 'OK')));
    return w;
  });

  G.apps.register('help', () => {
    const L = G.state.level;
    const w = G.wm.open({ key: 'help', title: 'Help and Support Center', icon: 'help', w: 560, h: 400 });
    w.body.innerHTML = '';
    w.body.appendChild(U.el('div', { class: 'help-page' },
      U.el('div', { class: 'help-head' }, U.el('span', { html: G.icon('help', 32) }), 'Help and Support Center'),
      U.el('div', { class: 'help-text' }, L >= 3
        ? 'Help is coming.\n\nPlease leave a light on.\nPlease remain tuned.\nDo not attempt to change the channel.'
        : L >= 2
          ? 'Pick a Help topic\n\n  • What is a carrier?\n  • How do I sign off?\n  • Why is someone in my background?\n\n(The help files could not be read. Bad sector 0x0333.)'
          : 'Pick a Help topic\n\n  • Backing up your files\n  • Using Meridian TV\n  • Working offline\n\nThe Help database is damaged and cannot be opened.')));
    return w;
  });

  G.apps.register('search', () => {
    const input = U.el('input', { class: 'field', placeholder: 'All or part of the file name' });
    const results = U.el('div', { class: 'srch-results' });
    const w = G.wm.open({ key: 'search', title: 'Search Results', icon: 'search', w: 520, h: 380 });
    w.body.innerHTML = '';
    const go = () => {
      const q = input.value.trim().toLowerCase();
      results.innerHTML = '';
      if (!q) return;
      if (q.includes('3:33') || q.includes('333') || q === 'host') {
        results.appendChild(U.el('div', { class: 'srch-hit host' }, 'Found 1 match: YOU (in front of this screen)'));
        G.audio.play('sting');
        return;
      }
      const hits = Object.values(G.fs.index).filter((n) => n.type === 'file' && G.fs.visible(n) && n.name.toLowerCase().includes(q) && !(n.parent && n.parent.locked && !G.state.unlocked[n.parent.id]));
      if (!hits.length) results.appendChild(U.el('div', { class: 'srch-none' }, 'Search is complete. There are no results to display.'));
      hits.forEach((n) => {
        const r = U.el('div', { class: 'srch-hit' }, U.el('span', { html: G.icon(G.fs.icon(n), 16) }), n.name, U.el('small', null, n.parent ? G.fs.path(n.parent) : ''));
        r.addEventListener('dblclick', () => G.fs.open(n));
        results.appendChild(r);
      });
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    w.body.appendChild(U.el('div', { class: 'srch' },
      U.el('div', { class: 'srch-side' }, U.el('b', null, 'Search by any or all of the criteria below.'), input, U.el('button', { class: 'btn', onclick: go }, 'Search')),
      results));
    setTimeout(() => input.focus(), 30);
    return w;
  });

  G.apps.register('props', (args) => {
    const n = args.node.kind === 'lnk' && args.node.target ? G.fs.byId(args.node.target) : args.node;
    const w = G.wm.open({ title: G.fs.label(n) + ' Properties', icon: G.fs.icon(n), w: 340, h: 'auto', resizable: false, cls: 'dialog' });
    w.el.style.height = 'auto';
    const row = (k, v) => U.el('div', { class: 'pr-row' }, U.el('span', null, k), U.el('span', null, v));
    w.body.appendChild(U.el('div', { class: 'pr-body' },
      U.el('div', { class: 'pr-top' }, U.el('span', { html: G.icon(G.fs.icon(n), 32) }), U.el('b', null, G.fs.label(n))),
      row('Type:', G.fs.typeName(n)),
      row('Location:', n.parent ? (n.parent.addr || G.fs.path(n.parent)) : 'Desktop'),
      row('Size:', n.size || (n.type === 'dir' ? G.fs.files(n).length + ' Files' : '—')),
      row('Created:', U.fill(n.date || '6/2/2002 7:22 PM')),
      row('Owner:', G.state.level >= 3 ? 'Host' : 'Daniel')));
    w.body.appendChild(U.el('div', { class: 'dlg-buttons' }, U.el('button', { class: 'btn default', onclick: () => w.close(true) }, 'OK')));
    return w;
  });

  G.apps.register('about', () => {
    return G.dialogs.msg({ title: 'About Meridian', icon: 'info', text: 'Meridian 2002 Home Edition\nVersion 5.1 (Build 2600)\n\nThis product is licensed to:\nDaniel Mercer\nHarrow Valley Broadcasting' + (G.state.level >= 3 ? '\n\nand now to ' + G.userName + '.' : '') });
  });

  G.apps.register('sysinfo', () => {
    return G.dialogs.msg({ title: 'System Properties', icon: 'computer', text: 'System:\n   Meridian 2002 Home Edition\n\nRegistered to:\n   Daniel Mercer\n\nComputer:\n   1.80 GHz, 256 MB of RAM\n   TVR-878 Video Capture (tuned: CH 12)' });
  });
})(window.G);
