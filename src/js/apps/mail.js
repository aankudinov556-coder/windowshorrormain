// Meridian Mail — an offline mailbox that still receives messages.
(function (G) {
  'use strict';
  const U = G.util;

  const FOLDERS = [
    ['inbox', 'Inbox'], ['outbox', 'Outbox'], ['sent', 'Sent Items'], ['deleted', 'Deleted Items'], ['drafts', 'Drafts']
  ];
  const val = (v) => U.fill(typeof v === 'function' ? v() : v);
  const shortFrom = (s) => String(s).replace(/\s*<.*>/, '');

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
        G.dialogs.balloon({ title: 'Meridian Mail', icon: 'info', text: 'You have a new message.\nFrom: ' + shortFrom(val(m.from)) + '\n' + val(m.subject), onclick: () => G.apps.launch('mail', { open: id }) });
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
    const noConn = () => G.dialogs.msg({ title: 'Meridian Mail', icon: 'error', text: 'The host \'smtp.valleynet.com\' could not be found.\n\nAccount: valleynet\nServer Error: 0x800CCC0D' });
    const toolbar = U.el('div', { class: 'ml-toolbar' },
      tb('eml', 'Create Mail', noConn),
      tb('mail', 'Reply', () => (current ? noConn() : null)),
      tb('mail', 'Forward', () => (current ? noConn() : null)),
      U.el('span', { class: 'tsep' }),
      tb('error', 'Delete', () => G.dialogs.msg({ title: 'Meridian Mail', icon: 'warn', text: 'Messages cannot be deleted while the mailbox is being backed up.' })),
      tb('backup', 'Send/Recv', () => sendRecv()));

    const w = G.wm.open({
      key: 'mail', title: 'Inbox - Meridian Mail', icon: 'mail', w: 780, h: 520, status: ' ',
      menu: [
        { label: 'File', items: [{ label: 'Close', action: () => w.close() }] },
        { label: 'Edit', items: [{ label: 'Find...', disabled: true }] },
        { label: 'View', items: [{ label: 'Refresh', action: () => renderAll() }] },
        { label: 'Tools', items: [{ label: 'Send and Receive', action: () => sendRecv() }] },
        { label: 'Message', items: [{ label: 'New Message', action: noConn }] },
        { label: 'Help', items: [{ label: 'About Meridian Mail', action: () => G.apps.launch('about') }] }
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
      w.setStatus('Connecting to pop.valleynet.com...');
      G.audio.play('hdd');
      await U.sleep(1400);
      const before = Object.keys(G.state.mailArrived).length;
      G.emit('mail:sendrecv');
      await U.sleep(200);
      if (Object.keys(G.state.mailArrived).length > before) { w.setStatus('1 new message received.'); return; }
      w.setStatus('Error');
      G.dialogs.msg({ title: 'Meridian Mail', icon: 'error', text: G.state.level >= 3
        ? 'Receiving from 3:33 ... OK\n\nThere are no new messages. Everyone you know has already written.'
        : 'Unable to connect to the server.\n\nThe host \'pop.valleynet.com\' could not be found.\n\nError Number: 0x800CCC0D' });
    }

    function renderFolders() {
      folderList.innerHTML = '';
      folderList.appendChild(U.el('div', { class: 'ml-fhead' }, 'Folders'));
      folderList.appendChild(U.el('div', { class: 'ml-froot' }, U.el('span', { html: G.icon('mail', 16) }), 'Local Folders'));
      FOLDERS.forEach(([id, label]) => {
        const unread = id === 'inbox' ? MAIL.unreadCount() : 0;
        const f = U.el('div', { class: 'ml-folder' + (id === folder ? ' sel' : '') + (unread ? ' bold' : '') },
          U.el('span', { html: G.icon('folder', 16) }), label + (unread ? ' (' + unread + ')' : ''));
        f.addEventListener('click', () => { folder = id; current = null; renderAll(); });
        folderList.appendChild(f);
      });
    }

    function renderList() {
      table.innerHTML = '';
      table.appendChild(U.el('div', { class: 'ml-row ml-hrow' }, U.el('span', { class: 'c-from' }, folder === 'sent' || folder === 'drafts' ? 'To' : 'From'), U.el('span', { class: 'c-subj' }, 'Subject'), U.el('span', { class: 'c-date' }, 'Received')));
      const msgs = MAIL.visible().filter((m) => m.folder === folder);
      msgs.sort((a, b) => (G.state.mailArrived[b.id] || 0) - (G.state.mailArrived[a.id] || 0) || new Date(val(b.date)) - new Date(val(a.date)));
      if (!msgs.length) table.appendChild(U.el('div', { class: 'ml-empty' }, 'There are no items in this view.'));
      msgs.forEach((m) => {
        const r = U.el('div', { class: 'ml-row' + (isUnread(m) ? ' unread' : '') + (current === m ? ' sel' : '') },
          U.el('span', { class: 'c-from' }, U.el('span', { class: 'ml-env', html: G.icon('eml', 16) }), shortFrom(val(folder === 'sent' || folder === 'drafts' ? m.to : m.from))),
          U.el('span', { class: 'c-subj' }, val(m.subject)),
          U.el('span', { class: 'c-date' }, val(m.date)));
        r.addEventListener('click', () => select(m));
        table.appendChild(r);
      });
      w.setStatus(msgs.length + ' message(s), ' + MAIL.unreadCount() + ' unread' + (G.state.level >= 1 ? '        Working Offline' : '        Working Offline'));
    }

    function renderPreview() {
      preview.innerHTML = '';
      if (!current) { preview.appendChild(U.el('div', { class: 'ml-noprev' }, 'Select a message to read it.')); return; }
      const m = current;
      preview.appendChild(U.el('div', { class: 'ml-head' },
        U.el('div', null, U.el('b', null, 'From: '), val(m.from)),
        U.el('div', null, U.el('b', null, 'Date: '), val(m.date)),
        U.el('div', null, U.el('b', null, 'To: '), val(m.to)),
        U.el('div', null, U.el('b', null, 'Subject: '), val(m.subject))));
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
      w.setTitle(FOLDERS.find((f) => f[0] === folder)[1] + ' - Meridian Mail');
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
