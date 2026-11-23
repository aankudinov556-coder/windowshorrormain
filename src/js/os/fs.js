// Virtual file system. The tree itself lives in content/fsdata.js.
(function (G) {
  'use strict';

  const KIND_ICON = { txt: 'txt', log: 'log', ini: 'sys', sys: 'sys', dll: 'sys', jpg: 'img', mpg: 'video', eml: 'eml', exe: 'exe', bat: 'bat', wav: 'page' };
  const t = G.t;
  const KIND_TYPE = { txt: 'type.txt', log: 'type.txt', ini: 'type.ini', sys: 'type.sys', dll: 'type.dll', jpg: 'type.jpg', mpg: 'type.mpg', eml: 'type.eml', exe: 'type.exe', bat: 'type.bat', wav: 'type.wav' };

  const FS = {
    index: {},
    root: null,

    init(root) {
      FS.root = root;
      FS.index = {};
      const walk = (n, parent) => {
        n.parent = parent || null;
        FS.index[n.id] = n;
        (n.children || []).forEach((c) => walk(c, n));
      };
      walk(root, null);
    },

    byId(id) { return FS.index[id]; },

    visible(n) {
      if (n.show && !n.show(G.state)) return false;
      if (n.bin && !G.state.restored[n.id]) return false; // still in the recycle bin
      return true;
    },

    children(n) {
      if (!n) return [];
      if (n.id === 'recycle') {
        return Object.values(FS.index).filter((x) => x.bin && !G.state.restored[x.id] && (!x.show || x.show(G.state)));
      }
      const list = (n.children || []).filter(FS.visible);
      // restored items appear in their original folder
      Object.values(FS.index).forEach((x) => {
        if (x.bin && x.bin === n.id && G.state.restored[x.id] && !list.includes(x)) list.push(x);
      });
      return list;
    },

    label(n) { return typeof n.label === 'function' ? n.label(G.state) : n.name; },

    // Size string with localized units and decimal separator ('1.4 MB' -> '1,4 МБ').
    size(n) {
      if (!n || !n.size) return '';
      let s = String(n.size);
      if (t('unit.decimal') === ',') s = s.replace(/(\d),(\d{3})/g, '$1 $2').replace(/(\d)\.(\d)/g, '$1,$2');
      return s.replace(/\bKB\b/, t('unit.kb')).replace(/\bMB\b/, t('unit.mb')).replace(/\bGB\b/, t('unit.gb'));
    },

    icon(n) {
      if (typeof n.icon === 'function') return n.icon(G.state);
      if (n.icon) return n.icon;
      if (n.type === 'dir') return n.locked && !G.state.unlocked[n.id] ? 'lockedFolder' : 'folder';
      return KIND_ICON[n.kind] || 'page';
    },

    typeName(n) {
      if (n.type === 'dir') return n.locked && !G.state.unlocked[n.id] ? t('type.protected') : t('type.folder');
      if (n.type === 'drive') return t(n.driveType || 'type.localDisk');
      if (n.type === 'special') return t('type.sysFolder');
      if (n.kind === 'mbk') return t('type.mbk');
      if (n.kind === 'app' || n.kind === 'lnk') return t('type.shortcut');
      return t(KIND_TYPE[n.kind] || 'type.file');
    },

    path(n) {
      if (!n) return '';
      if (n.pathName) return n.pathName;
      const parts = [];
      let x = n;
      while (x && !x.pathName) { parts.unshift(x.name); x = x.parent; }
      const base = x ? x.pathName : '';
      return (base + (base.endsWith('\\') ? '' : '\\') + parts.join('\\')).replace(/\\\\+/g, '\\');
    },

    // Count of files (recursive) under a node, for the backup wizard.
    files(n, out = []) {
      FS.children(n).forEach((c) => {
        if (c.type === 'file') out.push(c);
        else if (c.type === 'dir' && !c.noBackup) FS.files(c, out);
      });
      return out;
    },

    findByName(name, under) {
      const kids = FS.children(under || FS.root);
      const lower = String(name).toLowerCase();
      return kids.find((k) => k.name.toLowerCase() === lower);
    },

    // Open anything: folder, file, shortcut or program.
    open(n, opts = {}) {
      if (!n) return;
      if (n.onOpen && n.onOpen(n, opts) === false) return;
      if (n.kind === 'lnk' && n.target) return FS.open(FS.byId(n.target), opts);
      if (n.app) return G.apps.launch(n.app, Object.assign({ node: n }, n.appArgs || {}, opts));
      if (n.type === 'dir' || n.type === 'drive' || n.type === 'special') return G.apps.launch('explorer', { node: n, from: opts.from });
      G.state.opened[n.id] = (G.state.opened[n.id] || 0) + 1;
      G.save();
      G.emit('file:open', n);
      switch (n.kind) {
        case 'txt': case 'log': case 'ini': case 'bat':
          return G.apps.launch('notepad', { node: n });
        case 'jpg':
          return G.apps.launch('imageview', { node: n });
        case 'mpg':
          return G.apps.launch('tv', { tape: n.tape, node: n });
        case 'eml':
          return G.apps.launch('mail', { open: n.mail });
        case 'exe':
          return G.dialogs.msg({ title: n.name, icon: 'error', text: t('fs.notValid', { name: n.name }) });
        case 'mbk':
          return G.dialogs.msg({ title: n.name, icon: 'info', text: t('fs.mbkMsg') });
        case 'sys': case 'dll':
          return G.dialogs.msg({ title: 'Meridian', icon: 'warn', text: t('fs.sysFile') });
        default:
          return G.dialogs.msg({ title: 'Meridian', icon: 'info', text: t('fs.cantOpen', { name: n.name }) });
      }
    }
  };

  G.fs = FS;
})(window.G);
