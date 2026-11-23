// Notepad — and a channel for the Host to type through.
(function (G) {
  'use strict';
  const U = G.util;
  const t = G.t;
  const docText = (node) => G.docText(node);

  G.apps.register('notepad', (args = {}) => {
    const node = args.node;
    const key = node ? 'np:' + node.id : null;
    const name = node ? node.name : (args.title || t('np.untitled'));
    let wrap = true;
    const ex = key && G.wm.get(key);
    if (ex) { ex.restore(); ex.focus(); return ex; }

    const ta = U.el('textarea', { class: 'np-text', spellcheck: 'false', wrap: 'soft' });
    ta.value = args.text != null ? args.text : docText(node);

    const w = G.wm.open({
      key, title: t('np.title', { name }), icon: 'notepad',
      w: args.w || 560, h: args.h || 420, x: args.x, y: args.y,
      menu: [
        { label: t('menu.file'), items: [
          { label: t('menu.new'), action: () => G.apps.launch('notepad', {}) },
          { label: t('menu.openDots'), action: () => G.apps.launch('explorer', { node: G.fs.byId('mydocs') }) },
          { label: t('menu.save'), action: () => save() },
          { sep: true },
          { label: t('menu.exit'), action: () => w.close() }] },
        { label: t('menu.edit'), items: [{ label: t('menu.selectAll'), action: () => { ta.focus(); ta.select(); } }, { label: t('menu.timeDate'), action: () => insert(U.fmtClock(new Date()) + ' ' + U.fmtDate(new Date())) }] },
        { label: t('menu.format'), items: () => [{ label: t('menu.wordWrap'), checked: wrap, action: () => { wrap = !wrap; ta.setAttribute('wrap', wrap ? 'soft' : 'off'); ta.classList.toggle('nowrap', !wrap); } }] },
        { label: t('menu.view'), items: [{ label: t('menu.statusBar'), disabled: true }] },
        { label: t('menu.help'), items: [{ label: t('menu.aboutNotepad'), action: () => G.apps.launch('about') }] }
      ],
      bodyClass: 'np-body'
    });
    w.body.appendChild(ta);
    w.textarea = ta;

    function insert(s) {
      const p = ta.selectionStart;
      ta.value = ta.value.slice(0, p) + s + ta.value.slice(ta.selectionEnd);
    }

    function save() {
      if (G.state.level >= 3) {
        G.dialogs.msg({ title: t('app.notepad'), icon: 'warn', text: t('np.saveHost') });
        return;
      }
      G.dialogs.msg({ title: t('app.notepad'), icon: 'error', text: t('np.saveErr', { name }) });
    }

    if (args.hostType) G.apps.notepadType(w, args.hostType, args.typeOpts || {});
    setTimeout(() => { ta.scrollTop = 0; ta.setSelectionRange(0, 0); }, 0);
    return w;
  });

  // Make text appear as if someone else is typing it.
  G.apps.notepadType = async function (w, text, o = {}) {
    const ta = w.textarea;
    if (!ta) return;
    text = U.fill(text);
    if (o.clear) ta.value = '';
    ta.readOnly = true;
    for (const ch of text) {
      if (w.closed) return;
      ta.value += ch;
      ta.scrollTop = ta.scrollHeight;
      if (ch !== ' ' && ch !== '\n') G.audio.play('type');
      await U.sleep(ch === '\n' ? 380 : ch === '.' ? 260 : U.randi(o.min || 45, o.max || 140));
    }
    ta.readOnly = false;
  };
})(window.G);
