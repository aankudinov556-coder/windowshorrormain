// Command Prompt with a tiny DOS-like shell and TXCTL (remote transmitter control).
(function (G) {
  'use strict';
  const U = G.util;

  const DRIVES = { a: 'drive_a', c: 'drive_c', d: 'drive_d', e: 'drive_e' };

  function docText(n) {
    let d = n.doc ? G.docs[n.doc] : '';
    if (typeof d === 'function') d = d(G.state);
    return U.fill(d || '');
  }

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
      key: 'cmd', title: 'Command Prompt', icon: 'cmd', w: 640, h: 400, bodyClass: 'cmd-body',
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
      if (!n) return T.print('File Not Found');
      if (!isDir(n)) return T.print(' ' + n.name);
      if (locked(n)) return T.print('Access is denied.');
      if (n.onOpen && n.type === 'drive') return T.print('The device is not ready.');
      const d = driveOf(n);
      T.print(' Volume in drive ' + d.pathName[0] + (d.id === 'drive_e' ? ' is BYTELINE_BKP' : d.id === 'drive_d' ? ' is TV CAPTURE' : ' has no label.'));
      T.print(' Volume Serial Number is 0333-0333');
      T.print('');
      T.print(' Directory of ' + G.fs.path(n));
      T.print('');
      let files = 0, dirs = 0;
      G.fs.children(n).forEach((k) => {
        const date = U.fill(k.date || '06/02/2002 07:22 PM').replace(/^(\d+)\/(\d+)\/(\d+)/, (a, mo, da, y) => U.pad(mo) + '/' + U.pad(da) + '/' + y);
        if (isDir(k)) { dirs++; T.print(date.padEnd(22) + '<DIR>'.padEnd(15) + k.name); } else { files++; T.print(date.padEnd(22) + String(k.size || '0').padStart(14) + ' ' + k.name); }
      });
      T.print('               ' + files + ' File(s)');
      T.print('               ' + dirs + ' Dir(s)   ' + (n.free || d.free || '1,288,490,188 bytes free'));
    }

    function cmdCd(arg) {
      if (!arg) return T.print(G.fs.path(cwd));
      const n = resolve(arg);
      if (!n || !isDir(n)) return T.print('The system cannot find the path specified.');
      if (locked(n)) return T.print('Access is denied.');
      if (n.id === 'drive_a') return T.print('The device is not ready.');
      cwd = n;
    }

    function cmdType(arg) {
      const n = resolve(arg);
      if (!n) return T.print('The system cannot find the file specified.');
      if (isDir(n)) return T.print('Access is denied.');
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
      if (!im) return T.print('ERROR: Invalid syntax. Type "TASKKILL /?" for usage.');
      if (im.startsWith('host')) {
        G.emit('host:kill', 'cmd');
        const L = G.state.level;
        if (L <= 1) return T.print('ERROR: The process "host.exe" could not be terminated.\nReason: Access is denied.');
        if (L === 2) return T.print('ERROR: The process "host.exe" could not be terminated.\nReason: The process is a guest of this system.');
        return T.host('you cannot end a program by closing your eyes, {user}.');
      }
      T.print('ERROR: The process "' + im + '" could not be terminated.\nReason: Access is denied.');
    }

    // ---------------- TXCTL ----------------
    async function txctl(argv) {
      const sub = (argv[0] || 'help').toLowerCase();
      const arg2 = (argv[1] || '').toLowerCase();
      if (sub === 'help' || sub === '/?') {
        T.print('TXCTL 2.1 — Remote Transmitter Control  (c) 1998 Burrell Broadcast Systems');
        T.print('');
        ['  txctl status            Report transmitter status',
          '  txctl anthem            Roll sign-off reel (station ID + anthem)',
          '  txctl bars              Color bars + 1 kHz reference tone',
          '  txctl visual on|off     Visual carrier on / off',
          '  txctl aural on|off      Aural carrier on / off',
          '  txctl sign              Sign the transmitter log',
          '', 'Follow your station\'s written sign-off procedure.'].forEach((l) => T.print(l));
        return;
      }
      const L = G.state.level;
      T.lock(true);
      await T.slow('Dialing RCU 555-0112 ...', '', 22);
      G.audio.play('hdd');
      await U.sleep(1200);
      if (L < 4) {
        T.print('NO DIALTONE');
        if (L === 3) { await U.sleep(900); await T.host('...but something picked up anyway.'); await T.host('"not yet. you haven\'t met everyone yet."'); }
        T.lock(false);
        return;
      }
      T.print('CONNECT 33600   RCU: HVB-12 PELL HILL', 'ok');
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
          ['CD       Displays the name of or changes the current directory.', 'CLS      Clears the screen.', 'DIR      Displays a list of files and subdirectories in a directory.',
            'ECHO     Displays messages.', 'EXIT     Quits the command interpreter.', 'START    Starts a program.', 'TASKLIST Displays all currently running tasks.',
            'TASKKILL Kill or stop a running process.', 'TYPE     Displays the contents of a text file.', 'VER      Displays the Meridian version.', 'WHOAMI   Displays the current user.',
            '', 'TXCTL    Burrell remote transmitter control (type TXCTL HELP).'].forEach((l) => T.print(l));
          break;
        case 'dir': cmdDir(rest); break;
        case 'cd': case 'chdir': cmdCd(parts.join(' ')); break;
        case 'type': case 'more': cmdType(rest); break;
        case 'cls': T.clear(); break;
        case 'echo': T.print(rest || 'ECHO is on.'); break;
        case 'ver': T.print(''); T.print('Meridian 2002 [Version 5.1.2600]'); break;
        case 'date': T.print('The current date is: ' + (G.state.level >= 4 ? 'Tue 10/14/2003' : new Date().toDateString())); break;
        case 'time': T.print('The current time is: ' + (G.state.level >= 4 ? '3:33:00.00' : new Date().toLocaleTimeString())); break;
        case 'whoami': T.print('meridian\\' + (G.state.level >= 4 ? 'host' : G.state.level === 3 ? G.userName.toLowerCase() : 'daniel')); break;
        case 'tasklist': cmdTasklist(); break;
        case 'taskkill': case 'kill': cmdKill(parts); break;
        case 'exit': w.close(); return;
        case 'txctl': case 'txctl.exe': await txctl(parts); break;
        case 'start': case 'notepad': case 'taskmgr': case 'explorer': {
          const name = (c === 'start' ? parts[0] || '' : c).toLowerCase().replace('.exe', '');
          const map = { notepad: 'notepad', taskmgr: 'taskmgr', explorer: 'explorer', mtv: 'tv', tv: 'tv', mmail: 'mail', mail: 'mail', backup: 'backup', cmd: 'cmd' };
          if (map[name]) G.apps.launch(map[name], {}); else T.print('The system cannot find the file ' + name + '.');
          break;
        }
        case 'ping': T.print(''); T.print('Ping request could not find host ' + (parts[0] || '') + '. Please check the name and try again.'); break;
        case 'format': T.print(G.state.level >= 2 ? 'Access is denied. We live here.' : 'Access is denied. The disk is write-protected.'); break;
        case 'del': case 'erase': case 'rd': case 'rmdir': case 'copy': case 'xcopy': case 'move': case 'ren':
          T.print('Access is denied. The disk is write-protected.'); break;
        case 'shutdown': G.boot.turnOffDialog(); break;
        case 'host': case 'host.exe': G.story.hostProgram(); break;
        default:
          T.print("'" + c + "' is not recognized as an internal or external command,\noperable program or batch file.");
      }
      if (G.state.level >= 3 && U.chance(0.12) && c !== 'txctl') {
        await U.sleep(500);
        await T.host(U.pick(['who are you talking to?', 'we can hear you typing.', 'daniel used to type faster.', 'it\'s late, {user}.', 'keep going. we like this part.']));
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

    T.print('Meridian 2002 [Version 5.1.2600]');
    T.print('(C) Copyright 1985-2002 Meridian Computers, Inc.');
    T.print('');
    resetPrompt();
    setTimeout(() => input.focus(), 50);
    if (args.run) w.runCommand(args.run);
    return w;
  });
})(window.G);
