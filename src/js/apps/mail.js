// Meridian Mail — an offline mailbox that still receives messages.
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;

  const FOLDERS = ['inbox', 'outbox', 'sent', 'deleted', 'drafts'];
  const val = (v) => U.fill(typeof v === 'function' ? v() : v);
  const shortFrom = (s) => String(s).replace(/\s*<.*>/, '');
  const when = (m) => U.parseStamp(m.date) || new Date(0);

  // Old messages Daniel never opened.
  const UNREAD_AT_START = { m_lily2: true };

  function visible(m) { return !m.late || G.state.mailArrived[m.id]; }
  function isUnread(m) {
    if (G.state.mailRead[m.id]) return false;
    return !!(m.late || UNREAD_AT_START[m.id]);
  }

  const MAIL = {
    visible: () => G.mail.filter(visible),

    unreadCount() { return G.mail.filter((m) => visible(m) && m.folder === 'inbox' && isUnread(m)).length; },

    // Story hook: a message arrives "now".
    deliver(id, opts = {}) {
      if (G.state.mailArrived[id]) return;
      G.state.mailArrived[id] = Date.now();
      G.save();
      G.emit('mail:arrived', id);
      const m = G.mail.find((x) => x.id === id);
      if (opts.balloon !== false && m) {
        G.dialogs.balloon({ title: t('app.mail'), icon: 'info', text: t('ml.balloon', { from: shortFrom(val(m.from)), subject: val(m.subject) }), onclick: () => G.apps.launch('mail', { open: id }) });
      }
    }
  };
  G.mailbox = MAIL;

  G.apps.register('mail', (args = {}) => {
    const ex = G.wm.get('mail');
    if (ex) { ex.restore(); ex.focus(); if (args.open && ex.openMail) ex.openMail(args.open); return ex; }

    let folder = 'inbox';
    let current = null;
    const folderList = U.el('div', { class: 'ml-folders' });
    const table = U.el('div', { class: 'ml-list' });
    const preview = U.el('div', { class: 'ml-preview' });

    const tb = (icon, label, fn) => U.el('button', { class: 'ml-tbtn', onclick: fn }, U.el('span', { html: G.icon(icon, 24) }), U.el('span', null, label));
    const noConn = () => G.dialogs.msg({ title: t('app.mail'), icon: 'error', text: t('ml.noConn') });
    const toolbar = U.el('div', { class: 'ml-toolbar' },
      tb('eml', t('ml.create'), noConn),
      tb('mail', t('ml.reply'), () => (current ? noConn() : null)),
      tb('mail', t('ml.forward'), () => (current ? noConn() : null)),
      U.el('span', { class: 'tsep' }),
      tb('error', t('ml.delete'), () => G.dialogs.msg({ title: t('app.mail'), icon: 'warn', text: t('ml.deleteErr') })),
      tb('backup', t('ml.sendrecv'), () => sendRecv()));

    const w = G.wm.open({
      key: 'mail', title: t('ml.title', { folder: t('ml.inbox') }), icon: 'mail', w: 780, h: 520, status: ' ',
      menu: [
        { label: t('menu.file'), items: [{ label: t('menu.close'), action: () => w.close() }] },
        { label: t('menu.edit'), items: [{ label: t('menu.find'), disabled: true }] },
        { label: t('menu.view'), items: [{ label: t('menu.refresh'), action: () => renderAll() }] },
        { label: t('menu.tools'), items: [{ label: t('menu.sendRecv'), action: () => sendRecv() }] },
        { label: t('menu.message'), items: [{ label: t('menu.newMessage'), action: noConn }] },
        { label: t('menu.help'), items: [{ label: t('menu.aboutMail'), action: () => G.apps.launch('about') }] }
      ],
      toolbar,
      bodyClass: 'ml-body'
    });
    w.body.appendChild(folderList);
    w.body.appendChild(U.el('div', { class: 'ml-right' }, table, preview));

    const unsub = G.on('mail:arrived', () => { if (!w.closed) renderAll(); });
    w.onClose(() => unsub());

    async function sendRecv() {
      G.cursor.busy(1500);
      w.setStatus(t('ml.connecting'));
      G.audio.play('hdd');
      await U.sleep(1400);
      const before = Object.keys(G.state.mailArrived).length;
      G.emit('mail:sendrecv');
      await U.sleep(200);
      if (Object.keys(G.state.mailArrived).length > before) { w.setStatus(t('ml.newMsg')); return; }
      w.setStatus(t('ml.error'));
      G.dialogs.msg({ title: t('app.mail'), icon: 'error', text: G.state.level >= 3 ? t('ml.err3') : t('ml.err') });
    }

    function renderFolders() {
      folderList.innerHTML = '';
      folderList.appendChild(U.el('div', { class: 'ml-fhead' }, t('ml.folders')));
      folderList.appendChild(U.el('div', { class: 'ml-froot' }, U.el('span', { html: G.icon('mail', 16) }), t('ml.local')));
      FOLDERS.forEach((id) => {
        const unread = id === 'inbox' ? MAIL.unreadCount() : 0;
        const f = U.el('div', { class: 'ml-folder' + (id === folder ? ' sel' : '') + (unread ? ' bold' : '') },
          U.el('span', { html: G.icon('folder', 16) }), t('ml.' + id) + (unread ? ' (' + unread + ')' : ''));
        f.addEventListener('click', () => { folder = id; current = null; renderAll(); });
        folderList.appendChild(f);
      });
    }

    function renderList() {
      table.innerHTML = '';
      const outgoing = folder === 'sent' || folder === 'drafts';
      table.appendChild(U.el('div', { class: 'ml-row ml-hrow' }, U.el('span', { class: 'c-from' }, outgoing ? t('ml.to') : t('ml.from')), U.el('span', { class: 'c-subj' }, t('ml.subject')), U.el('span', { class: 'c-date' }, t('ml.received'))));
      const msgs = MAIL.visible().filter((m) => m.folder === folder);
      msgs.sort((a, b) => (G.state.mailArrived[b.id] || 0) - (G.state.mailArrived[a.id] || 0) || when(b) - when(a));
      if (!msgs.length) table.appendChild(U.el('div', { class: 'ml-empty' }, t('ml.empty')));
      msgs.forEach((m) => {
        const r = U.el('div', { class: 'ml-row' + (isUnread(m) ? ' unread' : '') + (current === m ? ' sel' : '') },
          U.el('span', { class: 'c-from' }, U.el('span', { class: 'ml-env', html: G.icon('eml', 16) }), shortFrom(val(outgoing ? m.to : m.from))),
          U.el('span', { class: 'c-subj' }, val(m.subject)),
          U.el('span', { class: 'c-date' }, U.stamp(m.date)));
        r.addEventListener('click', () => select(m));
        table.appendChild(r);
      });
      w.setStatus(t('ml.status', { n: msgs.length, u: MAIL.unreadCount() }) + '        ' + t('ml.offline'));
    }

    function renderPreview() {
      preview.innerHTML = '';
      if (!current) { preview.appendChild(U.el('div', { class: 'ml-noprev' }, t('ml.select'))); return; }
      const m = current;
      preview.appendChild(U.el('div', { class: 'ml-head' },
        U.el('div', null, U.el('b', null, t('ml.from') + ': '), val(m.from)),
        U.el('div', null, U.el('b', null, t('ml.date') + ': '), U.stamp(m.date)),
        U.el('div', null, U.el('b', null, t('ml.to') + ': '), val(m.to)),
        U.el('div', null, U.el('b', null, t('ml.subject') + ': '), val(m.subject))));
      preview.appendChild(U.el('div', { class: 'ml-text' }, val(m.body)));
    }

    function select(m) {
      current = m;
      if (!G.state.mailRead[m.id]) {
        G.state.mailRead[m.id] = true;
        G.save();
        G.emit('mail:read', m);
      }
      renderAll();
    }

    function renderAll() {
      w.setTitle(t('ml.title', { folder: t('ml.' + folder) }));
      renderFolders();
      renderList();
      renderPreview();
    }

    w.openMail = (id) => {
      const m = G.mail.find((x) => x.id === id);
      if (!m || !visible(m)) return;
      folder = m.folder;
      select(m);
    };

    renderAll();
    if (args.open) w.openMail(args.open);
    return w;
  });
})(window.G);
