// Task Manager — where host.exe lives and refuses to die.
(function (G) {
  'use strict';
  const U = G.util;

  const APP_PROC = { notepad: 'notepad.exe', mail: 'mmail.exe', tv: 'mtv.exe', cmd: 'cmd.exe', backup: 'bkpwiz.exe', explorer: 'explorer.exe', imageview: 'imgview.exe', taskmgr: 'taskmgr.exe' };

  function hostUser() {
    const L = G.state.level;
    if (L >= 4) return 'HOST';
    if (L === 3) return G.userName.toUpperCase();
    if (L === 2) return 'DANIEL';
    return 'SYSTEM';
  }

  G.apps.processes = function () {
    const L = G.state.level;
    const list = [
      { name: 'System Idle Process', pid: 0, user: 'SYSTEM', cpu: 0, mem: 16 },
      { name: 'System', pid: 4, user: 'SYSTEM', cpu: 0, mem: 236 },
      { name: 'smss.exe', pid: 532, user: 'SYSTEM', cpu: 0, mem: 388 },
      { name: 'csrss.exe', pid: 596, user: 'SYSTEM', cpu: 0, mem: 3204 },
      { name: 'winlogon.exe', pid: 620, user: 'SYSTEM', cpu: 0, mem: 4580 },
      { name: 'services.exe', pid: 664, user: 'SYSTEM', cpu: 0, mem: 3112 },
      { name: 'lsass.exe', pid: 676, user: 'SYSTEM', cpu: 0, mem: 1056 },
      { name: 'svchost.exe', pid: 852, user: 'SYSTEM', cpu: 0, mem: 4720 },
      { name: 'svchost.exe', pid: 940, user: 'NETWORK SERVICE', cpu: 0, mem: 2984 },
      { name: 'explorer.exe', pid: 1456, user: 'Daniel', cpu: U.randi(0, 3), mem: 18304 },
      { name: 'mtvsched.exe', pid: 1580, user: 'Daniel', cpu: U.randi(0, 2), mem: 2210 }
    ];
    const seen = {};
    G.wm.wins.forEach((w) => {
      const k = w.key ? w.key.split(':')[0] : null;
      const map = { np: 'notepad', imageview: 'imageview', mail: 'mail', tv: 'tv', cmd: 'cmd', backup: 'backup', taskmgr: 'taskmgr' };
      const app = map[k] || (w.explorerNode ? 'explorer' : null);
      const name = APP_PROC[app];
      if (name && name !== 'explorer.exe' && !seen[name]) { seen[name] = 1; list.push({ name, pid: 2000 + Object.keys(seen).length * 64, user: 'Daniel', cpu: U.randi(0, 6), mem: U.randi(2000, 9000) }); }
    });
    if (L >= 1 && !G.state.flags.hostHidden) {
      list.push({ name: 'host.exe', pid: 333, user: hostUser(), cpu: L >= 4 ? 99 : U.randi(3, 4 + L * 8), mem: 3333 * (L + 1), host: true });
      if (G.state.flags.hostTwins) list.push({ name: 'host.exe', pid: 3333, user: 'DANIEL', cpu: U.randi(1, 9), mem: 3333, host: true });
    }
    return list;
  };

  G.apps.register('taskmgr', () => {
    const ex = G.wm.get('taskmgr');
    if (ex) { ex.restore(); ex.focus(); return ex; }

    let tab = 'proc';
    let sel = null;
    const tabs = U.el('div', { class: 'tm-tabs' });
    const pane = U.el('div', { class: 'tm-pane' });
    const endBtn = U.el('button', { class: 'btn' }, 'End Process');
    const foot = U.el('div', { class: 'tm-foot' }, endBtn);
    const cpuHist = [];

    const w = G.wm.open({
      key: 'taskmgr', title: 'Meridian Task Manager', icon: 'taskmgr', w: 420, h: 470, status: ' ',
      menu: [
        { label: 'File', items: [{ label: 'New Task (Run...)', action: () => G.apps.launch('run') }, { sep: true }, { label: 'Exit Task Manager', action: () => w.close() }] },
        { label: 'Options', items: [{ label: 'Always On Top', checked: true, disabled: true }] },
        { label: 'View', items: [{ label: 'Refresh Now', action: () => render() }] },
        { label: 'Help', items: [{ label: 'About Task Manager', action: () => G.apps.launch('about') }] }
      ],
      bodyClass: 'tm-body',
      onClose: () => clearInterval(iv)
    });
    w.body.appendChild(tabs);
    w.body.appendChild(pane);
    w.body.appendChild(foot);

    [['apps', 'Applications'], ['proc', 'Processes'], ['perf', 'Performance'], ['users', 'Users']].forEach(([id, label]) => {
      const t = U.el('div', { class: 'tm-tab' }, label);
      t.addEventListener('click', () => { tab = id; sel = null; render(); });
      t.dataset.id = id;
      tabs.appendChild(t);
    });

    endBtn.addEventListener('click', () => endSelected());

    async function endSelected() {
      if (tab === 'apps') {
        if (sel && sel.win) sel.win.close();
        return render();
      }
      if (!sel) return;
      const r = await G.dialogs.msg({ title: 'Task Manager Warning', icon: 'warn', w: 420,
        text: 'WARNING: Terminating a process can cause undesired results including loss of data and system instability. The process will not be given the chance to save its state or data before it is terminated. Are you sure you want to terminate the process?',
        buttons: ['Yes', 'No'] });
      if (r !== 'Yes') return;
      if (sel.host) return G.story.killHost('taskmgr', w);
      if (sel.name === 'explorer.exe' || sel.name === 'System' || sel.name === 'winlogon.exe' || sel.name === 'csrss.exe') {
        G.dialogs.msg({ title: 'Unable to Terminate Process', icon: 'error', text: 'This is a critical system process. Task Manager cannot end this process.' });
        return;
      }
      const win = G.wm.wins.find((x) => x.key && APP_PROC[{ np: 'notepad', imageview: 'imageview', mail: 'mail', tv: 'tv', cmd: 'cmd', backup: 'backup' }[x.key.split(':')[0]]] === sel.name);
      if (win) win.close(true);
      else G.dialogs.msg({ title: 'Unable to Terminate Process', icon: 'error', text: 'The operation could not be completed.\n\nAccess is denied.' });
      render();
    }

    function table(cols, rows, onSel) {
      const t = U.el('div', { class: 'tm-table' });
      t.appendChild(U.el('div', { class: 'tm-row tm-head' }, cols.map((c) => U.el('span', { style: { flex: c[1] } }, c[0]))));
      rows.forEach((r) => {
        const row = U.el('div', { class: 'tm-row' + (r.cls ? ' ' + r.cls : '') }, r.cells.map((v, i) => U.el('span', { style: { flex: cols[i][1] } }, String(v))));
        if (sel && r.key === sel.key) row.classList.add('sel');
        row.addEventListener('click', () => { sel = r.data; sel.key = r.key; U.$$('.tm-row.sel', t).forEach((x) => x.classList.remove('sel')); row.classList.add('sel'); onSel && onSel(r.data); });
        t.appendChild(row);
      });
      return t;
    }

    function render() {
      U.$$('.tm-tab', tabs).forEach((t) => t.classList.toggle('sel', t.dataset.id === tab));
      pane.innerHTML = '';
      foot.style.visibility = tab === 'perf' || tab === 'users' ? 'hidden' : 'visible';
      const procs = G.apps.processes();
      const total = Math.min(100, procs.reduce((a, p) => a + p.cpu, 0) + U.randi(1, 4));
      w.setStatus('Processes: ' + procs.length + '     CPU Usage: ' + total + '%     Commit Charge: 131M / 633M');
      if (tab === 'proc') {
        endBtn.textContent = 'End Process';
        pane.appendChild(table([['Image Name', 3], ['User Name', 2.4], ['CPU', 0.8], ['Mem Usage', 1.6]],
          procs.map((p) => ({ key: p.name + p.pid, data: p, cls: p.host && G.state.level >= 2 ? 'hostrow' : '', cells: [p.name, p.user, U.pad(p.cpu), p.mem.toLocaleString('en-US') + ' K'] }))));
      } else if (tab === 'apps') {
        endBtn.textContent = 'End Task';
        const rows = G.wm.wins.filter((x) => x !== w && !x.opts.noTaskbar).map((x) => ({ key: x.id, data: { win: x }, cells: [x.titleText.textContent, 'Running'] }));
        if (G.state.level >= 3) rows.push({ key: 'ch12', data: {}, cells: ['Channel 12', 'Watching'] });
        pane.appendChild(table([['Task', 4], ['Status', 1.2]], rows));
      } else if (tab === 'perf') {
        const c = U.el('canvas', { class: 'tm-graph', width: 380, height: 150 });
        pane.appendChild(U.el('div', { class: 'tm-perf' }, U.el('div', null, 'CPU Usage History'), c));
        cpuHist.push(total);
        while (cpuHist.length > 64) cpuHist.shift();
        const x = c.getContext('2d');
        x.fillStyle = '#000';
        x.fillRect(0, 0, 380, 150);
        x.strokeStyle = '#008040';
        for (let i = 0; i < 380; i += 12) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 150); x.stroke(); }
        for (let j = 0; j < 150; j += 12) { x.beginPath(); x.moveTo(0, j); x.lineTo(380, j); x.stroke(); }
        x.strokeStyle = '#0f0';
        x.beginPath();
        cpuHist.forEach((v, i) => { const px = 380 - (cpuHist.length - 1 - i) * 6, py = 150 - v * 1.45; i ? x.lineTo(px, py) : x.moveTo(px, py); });
        x.stroke();
        if (G.state.level >= 2) { x.fillStyle = 'rgba(0,255,0,.18)'; x.font = 'bold 60px Courier New, monospace'; x.fillText('3:33', 110, 100); }
      } else {
        const users = [{ cells: ['Daniel', 'Active', 'Console'] }];
        if (G.state.level >= 2) users.push({ cells: [G.state.level >= 3 ? G.userName : 'VIEWER', 'Watching', 'CH 12'] });
        if (G.state.level >= 4) users.push({ cells: ['Host', 'Hosting', '—'] });
        pane.appendChild(table([['User', 2], ['Status', 1.5], ['Session', 1.5]], users.map((u, i) => Object.assign({ key: 'u' + i, data: {} }, u))));
      }
    }

    const iv = setInterval(() => { if (!w.closed) render(); }, 2000);
    render();
    w.refresh = render;
    return w;
  });
})(window.G);
