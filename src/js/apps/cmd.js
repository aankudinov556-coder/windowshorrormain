// Command Prompt with a tiny DOS-like shell and TXCTL (remote transmitter control).
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;

  const DRIVES = { a: 'drive_a', c: 'drive_c', d: 'drive_d', e: 'drive_e' };

  const docText = (n) => G.docText(n);
  const lines = (key) => [].concat(t(key));

  function driveOf(n) {
    let x = n;
    while (x && x.type !== 'drive') x = x.parent;
    return x || G.fs.byId('drive_c');
  }

  function garbage(lines) {
    const out = [];
    for (let i = 0; i < lines; i++) {
      let s = '';
      for (let j = 0; j < 64; j++) s += String.fromCharCode(U.randi(33, 254));
      out.push(s);
    }
    if (G.state.level >= 2) out.splice(U.randi(1, lines - 1), 0, U.corrupt('ÿØÿà..JFIF....HELLO ' + G.userName.toUpperCase() + '....ÿÛ', 0.05));
    return out.join('\n');
  }

  G.apps.register('cmd', (args = {}) => {
    const ex = G.wm.get('cmd');
    if (ex) { ex.restore(); ex.focus(); if (args.run) ex.runCommand(args.run); return ex; }

    let cwd = G.fs.byId('c_daniel');
    let busy = false;
    const history = [];
    let hIdx = 0;
    let askResolve = null;

    const outEl = U.el('div', { class: 'cmd-out' });
    const promptEl = U.el('span', { class: 'cmd-prompt' });
    const input = U.el('input', { class: 'cmd-input', spellcheck: 'false', autocomplete: 'off' });
    const line = U.el('div', { class: 'cmd-line' }, promptEl, input);
    const term = U.el('div', { class: 'cmd' }, outEl, line);

    const w = G.wm.open({
      key: 'cmd', title: t('app.cmd'), icon: 'cmd', w: 640, h: 400, bodyClass: 'cmd-body',
      onClose: () => { if (askResolve) askResolve(null); }
    });
    w.body.appendChild(term);
    term.addEventListener('pointerup', () => { if (!window.getSelection().toString()) input.focus(); });

    const T = {
      win: w,
      print(text, cls) {
        const el = U.el('div', { class: 'cmd-ln ' + (cls || '') }, String(text));
        outEl.appendChild(el);
        while (outEl.childNodes.length > 400) outEl.firstChild.remove();
        term.scrollTop = term.scrollHeight;
        return el;
      },
      async slow(text, cls, ms = 18) {
        const el = T.print('', cls);
        for (const ch of String(text)) {
          if (w.closed) return;
          el.textContent += ch;
          term.scrollTop = term.scrollHeight;
          if (ms > 25 && ch !== ' ') G.audio.play('type');
          await U.sleep(ch === '\n' ? ms * 8 : ms);
        }
      },
      // The Host types a line by itself.
      async host(text, ms = 70) {
        await T.slow(U.fill(text), 'host', ms);
      },
      lock(on) {
        busy = on;
        input.disabled = on;
        line.style.visibility = on ? 'hidden' : 'visible';
        if (!on) setTimeout(() => input.focus(), 0);
      },
      // Ask for a line of input. Optionally the Host pre-types something.
      ask(label, pretype) {
        return new Promise(async (resolve) => {
          promptEl.textContent = label;
          input.value = '';
          T.lock(false);
          askResolve = resolve;
          if (pretype) {
            input.readOnly = true;
            for (const ch of pretype) { if (w.closed) return; input.value += ch; G.audio.play('type'); await U.sleep(U.randi(120, 260)); }
            input.readOnly = false;
            input.focus();
          }
        });
      },
      clear() { outEl.innerHTML = ''; },
      get cwd() { return cwd; }
    };
    w.term = T;

    function promptText() { return G.fs.path(cwd).replace(/\\$/, cwd.type === 'drive' ? '\\' : '') + '>'; }
    function resetPrompt() { promptEl.textContent = promptText(); }

    function resolve(p) {
      if (!p) return cwd;
      p = p.replace(/\//g, '\\').replace(/"/g, '');
      let node = cwd;
      const m = p.match(/^([a-z]):\\?/i);
      if (m) {
        node = G.fs.byId(DRIVES[m[1].toLowerCase()]);
        if (!node) return null;
        p = p.slice(m[0].length);
      } else if (p.startsWith('\\')) {
        node = driveOf(cwd);
        p = p.slice(1);
      }
      for (const part of p.split('\\').filter(Boolean)) {
        if (part === '.') continue;
        if (part === '..') { if (node.type !== 'drive' && node.parent) node = node.parent; continue; }
        const lp = part.toLowerCase();
        const kid = G.fs.children(node).find((k) => k.name.toLowerCase() === lp) ||
          (lp.includes('~') ? G.fs.children(node).find((k) => k.name.toLowerCase().replace(/\s/g, '').startsWith(lp.split('~')[0])) : null);
        if (!kid) return null;
        node = kid;
      }
      return node;
    }

    function isDir(n) { return n && (n.type === 'dir' || n.type === 'drive'); }
    function locked(n) { return n.locked && !G.state.unlocked[n.id]; }

    function cmdDir(arg) {
      const n = arg ? resolve(arg) : cwd;
      if (!n) return T.print(t('cmd.fileNotFound'));
      if (!isDir(n)) return T.print(' ' + n.name);
      if (locked(n)) return T.print(t('cmd.access'));
      if (n.onOpen && n.type === 'drive') return T.print(t('cmd.notReady'));
      const d = driveOf(n);
      const label = d.id === 'drive_e' ? 'BYTELINE_BKP' : d.id === 'drive_d' ? 'TV CAPTURE' : '';
      T.print(label ? t('cmd.vol', { d: d.pathName[0], label }) : t('cmd.volNoLabel', { d: d.pathName[0] }));
      T.print(t('cmd.serial'));
      T.print('');
      T.print(t('cmd.dirOf', { path: G.fs.path(n) }));
      T.print('');
      let files = 0, dirs = 0;
      G.fs.children(n).forEach((k) => {
        const date = U.stamp(k.date || '2002-06-02 19:22');
        if (isDir(k)) { dirs++; T.print(date.padEnd(22) + '<DIR>'.padEnd(15) + k.name); } else { files++; T.print(date.padEnd(22) + G.fs.size(k).padStart(14) + ' ' + k.name); }
      });
      T.print(t('cmd.files', { n: files }));
      T.print(t('cmd.dirs', { n: dirs, free: n.free || d.free || '' }));
    }

    function cmdCd(arg) {
      if (!arg) return T.print(G.fs.path(cwd));
      const n = resolve(arg);
      if (!n || !isDir(n)) return T.print(t('cmd.pathNotFound'));
      if (locked(n)) return T.print(t('cmd.access'));
      if (n.id === 'drive_a') return T.print(t('cmd.notReady'));
      cwd = n;
    }

    function cmdType(arg) {
      const n = resolve(arg);
      if (!n) return T.print(t('cmd.fileNotSpecified'));
      if (isDir(n)) return T.print(t('cmd.access'));
      if (['txt', 'log', 'ini', 'bat'].includes(n.kind)) { docText(n).split('\n').forEach((l) => T.print(l)); G.state.opened[n.id] = (G.state.opened[n.id] || 0) + 1; G.emit('file:open', n); return; }
      T.print(garbage(6));
    }

    function cmdTasklist() {
      T.print('');
      T.print('Image Name                   PID Session Name     Mem Usage');
      T.print('========================= ====== ================ ============');
      G.apps.processes().forEach((p) => T.print(p.name.padEnd(25) + String(p.pid).padStart(7) + ' Console'.padEnd(17) + (p.mem + ' K').padStart(13)));
    }

    function cmdKill(argv) {
      const im = argv.join(' ').replace(/\/f|\/im|\/t/gi, '').trim().toLowerCase();
      if (!im) return T.print(t('cmd.killSyntax'));
      if (im.startsWith('host')) {
        G.emit('host:kill', 'cmd');
        const L = G.state.level;
        if (L <= 1) return T.print(t('cmd.killDenied', { name: 'host.exe' }));
        if (L === 2) return T.print(t('cmd.killGuest'));
        return T.host(t('cmd.killHost'));
      }
      T.print(t('cmd.killDenied', { name: im }));
    }

    // ---------------- TXCTL ----------------
    async function txctl(argv) {
      const sub = (argv[0] || 'help').toLowerCase();
      const arg2 = (argv[1] || '').toLowerCase();
      if (sub === 'help' || sub === '/?') {
        T.print('TXCTL 2.1 — Remote Transmitter Control  (c) 1998 Burrell Broadcast Systems');
        T.print('');
        lines('cmd.txhelp').forEach((l) => T.print(l));
        return;
      }
      const L = G.state.level;
      T.lock(true);
      await T.slow(t('cmd.dialing'), '', 22);
      G.audio.play('hdd');
      await U.sleep(1200);
      // The "station" only goes on the air once the Host is fully awake (final act).
      if (L < 4) {
        lines(L === 3 ? 'cmd.warming' : 'cmd.carrierOff').forEach((l) => T.print(l));
        if (L === 3) { await U.sleep(900); for (const l of lines('cmd.nodial3')) await T.host(l); }
        T.lock(false);
        return;
      }
      T.print(t('cmd.connect'), 'ok');
      await U.sleep(300);
      const step = sub + (arg2 ? ' ' + arg2 : '');
      await G.story.txctl(step, T);
      if (!w.closed && !G.state.flags.ended) T.lock(false);
    }

    // ---------------- dispatcher ----------------
    async function run(raw) {
      const lineTxt = raw.trim();
      T.print(promptText() + raw);
      if (!lineTxt) return;
      history.push(lineTxt);
      hIdx = history.length;
      const parts = lineTxt.match(/"[^"]*"|\S+/g) || [];
      let c = parts.shift().toLowerCase();
      const rest = parts.join(' ');
      if (/^[a-z]:$/.test(c)) { cmdCd(c); return; }
      if (c === 'cd..') { c = 'cd'; parts.unshift('..'); }
      switch (c) {
        case 'help':
          lines('cmd.help').forEach((l) => T.print(l));
          break;
        case 'dir': cmdDir(rest); break;
        case 'cd': case 'chdir': cmdCd(parts.join(' ')); break;
        case 'type': case 'more': cmdType(rest); break;
        case 'cls': T.clear(); break;
        case 'echo': T.print(rest || t('cmd.echoOn')); break;
        case 'ver': T.print(''); T.print(t('cmd.banner1')); break;
        case 'date': T.print(t('cmd.date', { v: G.state.level >= 4 ? U.fmtDate(new Date(2003, 9, 14)) : U.fmtDate(new Date()) })); break;
        case 'time': T.print(t('cmd.time', { v: G.state.level >= 4 ? '3:33:00.00' : new Date().toLocaleTimeString(G.i18n.lang) })); break;
        case 'whoami': T.print('meridian\\' + (G.state.level >= 4 ? 'host' : G.state.level === 3 ? G.userName.toLowerCase() : 'daniel')); break;
        case 'tasklist': cmdTasklist(); break;
        case 'taskkill': case 'kill': cmdKill(parts); break;
        case 'exit': w.close(); return;
        case 'txctl': case 'txctl.exe': await txctl(parts); break;
        case 'start': case 'notepad': case 'taskmgr': case 'explorer': {
          const name = (c === 'start' ? parts[0] || '' : c).toLowerCase().replace('.exe', '');
          const map = { notepad: 'notepad', taskmgr: 'taskmgr', explorer: 'explorer', mtv: 'tv', tv: 'tv', mmail: 'mail', mail: 'mail', backup: 'backup', cmd: 'cmd' };
          if (map[name]) G.apps.launch(map[name], {}); else T.print(t('cmd.progNotFound', { name }));
          break;
        }
        case 'ping': T.print(''); T.print(t('cmd.ping', { host: parts[0] || '' })); break;
        case 'format': T.print(G.state.level >= 2 ? t('cmd.format2') : t('cmd.writeProt')); break;
        case 'del': case 'erase': case 'rd': case 'rmdir': case 'copy': case 'xcopy': case 'move': case 'ren':
          T.print(t('cmd.writeProt')); break;
        case 'shutdown': G.boot.turnOffDialog(); break;
        case 'host': case 'host.exe': G.story.hostProgram(); break;
        default:
          T.print(t('cmd.unknown', { c }));
      }
      if (G.state.level >= 3 && U.chance(0.12) && c !== 'txctl') {
        await U.sleep(500);
        await T.host(U.pick(lines('cmd.hostQuips')));
      }
    }

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'ArrowUp') { hIdx = Math.max(0, hIdx - 1); input.value = history[hIdx] || ''; e.preventDefault(); return; }
      if (e.key === 'ArrowDown') { hIdx = Math.min(history.length, hIdx + 1); input.value = history[hIdx] || ''; e.preventDefault(); return; }
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const v = input.value;
      input.value = '';
      if (askResolve) {
        const r = askResolve;
        askResolve = null;
        T.print(promptEl.textContent + v);
        T.lock(true);
        r(v);
        return;
      }
      if (busy) return;
      T.lock(true);
      try { await run(v); } catch (err) { console.error(err); }
      if (!w.closed && !askResolve && !G.state.flags.ended) { resetPrompt(); T.lock(false); }
    });

    w.runCommand = async (cmdline) => {
      if (busy) return;
      T.lock(true);
      await U.sleep(300);
      for (const ch of cmdline) { input.value += ch; await U.sleep(40); }
      const v = input.value;
      input.value = '';
      await run(v);
      if (!w.closed && !askResolve) { resetPrompt(); T.lock(false); }
    };

    T.print(t('cmd.banner1'));
    T.print(t('cmd.banner2'));
    T.print('');
    resetPrompt();
    setTimeout(() => input.focus(), 50);
    if (args.run) w.runCommand(args.run);
    return w;
  });
})(window.G);
