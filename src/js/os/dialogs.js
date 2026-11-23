// Message boxes, prompts and tray balloon tips.
(function (G) {
  'use strict';
  const U = G.util;

  const SOUND = { error: 'ding', warn: 'exclaim', info: 'exclaim', question: null };

  const D = {
    msg(o) {
      return new Promise((resolve) => {
        const buttons = o.buttons || ['OK'];
        let result = null;
        const lines = String(o.text || '');
        const w = G.wm.open({
          title: o.title || 'Meridian',
          icon: o.titleIcon,
          w: o.w || Math.min(460, Math.max(300, 120 + Math.min(lines.length, 60) * 5.4)),
          h: o.h || 'auto',
          center: o.x == null,
          x: o.x, y: o.y,
          resizable: false,
          minimizable: false,
          cls: 'dialog ' + (o.cls || ''),
          onClose: () => resolve(result || buttons[buttons.length - 1])
        });
        w.el.style.height = 'auto';
        const body = U.el('div', { class: 'dlg-body' },
          o.icon ? U.el('div', { class: 'dlg-icon', html: G.icon(o.icon, 32) }) : null,
          U.el('div', { class: 'dlg-text' }, lines));
        const row = U.el('div', { class: 'dlg-buttons' });
        buttons.forEach((b, i) => {
          const btn = U.el('button', { class: 'btn' + (i === (o.defaultBtn || 0) ? ' default' : '') }, b);
          btn.addEventListener('click', () => { result = b; w.close(true); });
          row.appendChild(btn);
        });
        w.body.appendChild(body);
        w.body.appendChild(row);
        if (o.x == null) w.center();
        if (o.onShow) o.onShow(w, body, row);
        const snd = o.sound !== undefined ? o.sound : SOUND[o.icon];
        if (snd) G.audio.play(snd);
        setTimeout(() => { const d = row.querySelector('.default'); d && d.focus(); }, 30);
        if (o.autoClose) setTimeout(() => w.close(true), o.autoClose);
        D.last = w;
      });
    },

    prompt(o) {
      return new Promise((resolve) => {
        let result = null;
        const w = G.wm.open({
          title: o.title || 'Meridian',
          w: o.w || 360,
          h: 'auto',
          center: true,
          resizable: false,
          minimizable: false,
          cls: 'dialog',
          onClose: () => resolve(result)
        });
        w.el.style.height = 'auto';
        const input = U.el('input', { type: o.password ? 'password' : 'text', class: 'field', value: o.value || '', spellcheck: 'false', autocomplete: 'off' });
        const ok = () => { result = input.value; w.close(true); };
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') ok();
          if (e.key === 'Escape') w.close(true);
        });
        w.body.appendChild(U.el('div', { class: 'dlg-body' },
          o.icon ? U.el('div', { class: 'dlg-icon', html: G.icon(o.icon, 32) }) : null,
          U.el('div', { class: 'dlg-text' }, U.el('div', null, o.text || ''), U.el('div', { class: 'dlg-field' }, o.label ? U.el('label', null, o.label) : null, input))));
        w.body.appendChild(U.el('div', { class: 'dlg-buttons' },
          U.el('button', { class: 'btn default', onclick: ok }, 'OK'),
          U.el('button', { class: 'btn', onclick: () => w.close(true) }, 'Cancel')));
        w.center();
        setTimeout(() => input.focus(), 30);
      });
    },

    balloon(o) {
      D.hideBalloon();
      const b = U.el('div', { class: 'balloon' },
        U.el('div', { class: 'bl-head' },
          U.el('span', { class: 'bl-ico', html: G.icon(o.icon || 'info', 16) }),
          U.el('b', null, o.title || ''),
          U.el('span', { class: 'bl-x', onclick: (e) => { e.stopPropagation(); D.hideBalloon(); } }, '×')),
        U.el('div', { class: 'bl-text' }, o.text || ''));
      if (o.right != null) b.style.right = o.right + 'px';
      b.addEventListener('click', () => { D.hideBalloon(); o.onclick && o.onclick(); });
      U.$('#stage').appendChild(b);
      D.balloonEl = b;
      G.audio.play(o.sound || 'notify');
      clearTimeout(D._bt);
      D._bt = setTimeout(D.hideBalloon, o.ms || 9000);
      return b;
    },

    hideBalloon() {
      if (D.balloonEl) { D.balloonEl.remove(); D.balloonEl = null; }
    }
  };

  G.dialogs = D;
})(window.G);
