// Small system apps: Run, Web, Control Panel, Help, Search, Properties, About.
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;

  G.apps.register('run', () => {
    const ex = G.wm.get('run');
    if (ex) { ex.focus(); return ex; }
    const input = U.el('input', { class: 'field run-field', spellcheck: 'false' });
    const w = G.wm.open({ key: 'run', title: t('app.run'), w: 360, h: 'auto', x: 8, y: 560, resizable: false, minimizable: false, cls: 'dialog' });
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
      G.dialogs.msg({ title: v, icon: 'error', text: t('run.notFound', { v }) });
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); if (e.key === 'Escape') w.close(true); });
    w.body.appendChild(U.el('div', { class: 'dlg-body' }, U.el('div', { class: 'dlg-icon', html: G.icon('run', 32) }), U.el('div', { class: 'dlg-text' }, t('run.text'))));
    w.body.appendChild(U.el('div', { class: 'run-row' }, U.el('label', null, t('run.open')), input));
    w.body.appendChild(U.el('div', { class: 'dlg-buttons' }, U.el('button', { class: 'btn default', onclick: go }, t('common.ok')), U.el('button', { class: 'btn', onclick: () => w.close(true) }, t('common.cancel'))));
    setTimeout(() => input.focus(), 30);
    return w;
  });

  G.apps.register('web', () => {
    const L = G.state.level;
    const page = U.el('div', { class: 'web-page' },
      U.el('div', { class: 'web-err-title' }, U.el('span', { html: G.icon('info', 32) }), L >= 3 ? t('web.h3') : t('web.h')),
      U.el('p', null, L >= 3 ? t('web.p3') : t('web.p')),
      U.el('hr'),
      U.el('p', null, t('web.try')),
      U.el('ul', null, U.el('li', null, t('web.li1')), U.el('li', null, L >= 2 ? t('web.li2b') : t('web.li2'))),
      U.el('p', { class: 'dim' }, t('web.dim')));
    const w = G.wm.open({ key: 'web', title: t('web.title'), icon: 'web', w: 600, h: 440, status: t('web.done'),
      toolbar: U.el('div', { class: 'ex-address' }, U.el('span', { class: 'addr-label' }, t('ex.address')), U.el('div', { class: 'addr-box' }, U.el('span', { html: G.icon('web', 16) }), U.el('span', { class: 'addr-text' }, 'http://www.hvb12.com/'))),
      bodyClass: 'web-body' });
    w.body.innerHTML = '';
    w.body.appendChild(page);
    return w;
  });

  G.apps.register('control', () => {
    const items = [['display', 'cp.display'], ['speaker', 'cp.sounds'], ['network', 'cp.network'], ['logoff', 'cp.users'], ['tv', 'cp.tuner'], ['backup', 'cp.backup']];
    const grid = U.el('div', { class: 'ex-list' });
    items.forEach(([ic, key]) => {
      const it = U.el('div', { class: 'ex-item' }, U.el('span', { class: 'ex-ico', html: G.icon(G.hasIcon(ic) ? ic : 'control', 32) }), U.el('span', { class: 'ex-label' }, t(key)));
      it.addEventListener('dblclick', () => {
        if (key === 'cp.display') return G.apps.launch('display');
        if (key === 'cp.sounds') return G.taskbar.volumePopup();
        if (key === 'cp.tuner') return G.dialogs.msg({ title: t(key), icon: 'info', text: t('cp.tunerMsg') });
        if (key === 'cp.users') return G.dialogs.msg({ title: t(key), icon: 'info', text: G.state.level >= 3 ? t('cp.usersMsg3') : t('cp.usersMsg') });
        if (key === 'cp.backup') return G.apps.launch('backup');
        G.dialogs.msg({ title: t(key), icon: 'error', text: t('cp.locked') });
      });
      grid.appendChild(it);
    });
    const w = G.wm.open({ key: 'control', title: t('app.control'), icon: 'control', w: 520, h: 320, status: t('cp.objects', { n: items.length }) });
    w.body.innerHTML = '';
    w.body.appendChild(grid);
    return w;
  });

  G.apps.register('display', () => {
    const c = U.el('canvas', { class: 'dp-preview' });
    G.wallpaper.draw(c, G.state.level);
    const w = G.wm.open({ key: 'display', title: t('dp.title'), icon: 'computer', w: 400, h: 'auto', resizable: false, cls: 'dialog' });
    w.el.style.height = 'auto';
    w.body.innerHTML = '';
    w.body.appendChild(U.el('div', { class: 'dp-body' },
      U.el('div', { class: 'dp-monitor' }, c),
      U.el('div', null, t('dp.bg')),
      U.el('div', { class: 'dp-list' }, U.el('div', { class: 'sel' }, t('dp.pell')), U.el('div', { class: 'dis' }, t('dp.autumn')), U.el('div', { class: 'dis' }, t('dp.lace')), U.el('div', { class: 'dis' }, t('dp.none'))),
      U.el('div', { class: 'dim' }, G.state.level >= 2 ? t('dp.lock2') : t('dp.lock'))));
    w.body.appendChild(U.el('div', { class: 'dlg-buttons' }, U.el('button', { class: 'btn default', onclick: () => w.close(true) }, t('common.ok'))));
    return w;
  });

  G.apps.register('help', () => {
    const L = G.state.level;
    const w = G.wm.open({ key: 'help', title: t('help.title'), icon: 'help', w: 560, h: 400 });
    w.body.innerHTML = '';
    w.body.appendChild(U.el('div', { class: 'help-page' },
      U.el('div', { class: 'help-head' }, U.el('span', { html: G.icon('help', 32) }), t('help.title')),
      U.el('div', { class: 'help-text' }, L >= 3 ? t('help.text3') : L >= 2 ? t('help.text2') : t('help.text'))));
    return w;
  });

  G.apps.register('search', () => {
    const input = U.el('input', { class: 'field', placeholder: t('srch.ph') });
    const results = U.el('div', { class: 'srch-results' });
    const w = G.wm.open({ key: 'search', title: t('srch.title'), icon: 'search', w: 520, h: 380 });
    w.body.innerHTML = '';
    const go = () => {
      const q = input.value.trim().toLowerCase();
      results.innerHTML = '';
      if (!q) return;
      if (q.includes('3:33') || q.includes('333') || q === 'host' || q === t('name.host').toLowerCase()) {
        results.appendChild(U.el('div', { class: 'srch-hit host' }, t('srch.you')));
        G.audio.play('sting');
        return;
      }
      const hits = Object.values(G.fs.index).filter((n) => n.type === 'file' && G.fs.visible(n) && n.name.toLowerCase().includes(q) && !(n.parent && n.parent.locked && !G.state.unlocked[n.parent.id]));
      if (!hits.length) results.appendChild(U.el('div', { class: 'srch-none' }, t('srch.none')));
      hits.forEach((n) => {
        const r = U.el('div', { class: 'srch-hit' }, U.el('span', { html: G.icon(G.fs.icon(n), 16) }), n.name, U.el('small', null, n.parent ? G.fs.path(n.parent) : ''));
        r.addEventListener('dblclick', () => G.fs.open(n));
        results.appendChild(r);
      });
    };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    w.body.appendChild(U.el('div', { class: 'srch' },
      U.el('div', { class: 'srch-side' }, U.el('b', null, t('srch.criteria')), input, U.el('button', { class: 'btn', onclick: go }, t('srch.btn'))),
      results));
    setTimeout(() => input.focus(), 30);
    return w;
  });

  G.apps.register('props', (args) => {
    const n = args.node.kind === 'lnk' && args.node.target ? G.fs.byId(args.node.target) : args.node;
    const w = G.wm.open({ title: t('pr.title', { name: G.fs.label(n) }), icon: G.fs.icon(n), w: 340, h: 'auto', resizable: false, cls: 'dialog' });
    w.el.style.height = 'auto';
    const row = (k, v) => U.el('div', { class: 'pr-row' }, U.el('span', null, k), U.el('span', null, v));
    w.body.appendChild(U.el('div', { class: 'pr-body' },
      U.el('div', { class: 'pr-top' }, U.el('span', { html: G.icon(G.fs.icon(n), 32) }), U.el('b', null, G.fs.label(n))),
      row(t('pr.type'), G.fs.typeName(n)),
      row(t('pr.loc'), n.parent ? (n.parent.addr || G.fs.path(n.parent)) : t('fs.desktop')),
      row(t('pr.size'), G.fs.size(n) || (n.type === 'dir' ? t('pr.files', { n: G.fs.files(n).length }) : '—')),
      row(t('pr.created'), U.stamp(n.date || '2002-06-02 19:22')),
      row(t('pr.owner'), G.state.level >= 3 ? t('name.host') : t('name.daniel'))));
    w.body.appendChild(U.el('div', { class: 'dlg-buttons' }, U.el('button', { class: 'btn default', onclick: () => w.close(true) }, t('common.ok'))));
    return w;
  });

  G.apps.register('about', () => {
    return G.dialogs.msg({ title: t('menu.about'), icon: 'info', text: t('about.text') + (G.state.level >= 3 ? t('about.text3', { name: G.userName }) : '') });
  });

  G.apps.register('sysinfo', () => {
    return G.dialogs.msg({ title: t('sys.title'), icon: 'computer', text: t('sys.text') });
  });
})(window.G);
