// Small helpers shared by every module. Everything hangs off window.G.
window.G = window.G || {};

(function (G) {
  'use strict';

  const GLITCH_CHARS = '▓▒░█▄▀■□▪▫◘◙¤§¶†‡ΞΨΩ#@%&$*?!¿¡~^';
  const ZALGO_UP = ['̍', '̎', '̄', '̅', '̿', '̑', '̆', '̐', '͒', '͗', '͑', '̇', '̈', '̊', '͂', '̓', '̈́', '͊', '͋', '͌', '̃', '̂', '̌', '͐', '̀', '́', '̋', '̏', '̒', '̓', '̔', '̽', '̉', 'ͣ', 'ͤ', 'ͥ', 'ͦ', 'ͧ', 'ͨ', 'ͩ', 'ͪ', 'ͫ', 'ͬ', 'ͭ', 'ͮ', 'ͯ', '̾', '͛'];
  const ZALGO_DOWN = ['̖', '̗', '̘', '̙', '̜', '̝', '̞', '̟', '̠', '̤', '̥', '̦', '̩', '̪', '̫', '̬', '̭', '̮', '̯', '̰', '̱', '̲', '̳', '̹', '̺', '̻', '̼', 'ͅ', '͇', '͈', '͉', '͍', '͎', '͓', '͔', '͕', '͖', '͙', '͚', '̣'];

  const U = {
    $(sel, root) { return (root || document).querySelector(sel); },
    $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); },

    // el('div', {class:'a', onclick:fn, style:{...}, html:'..'}, child, 'text', ...)
    el(tag, props, ...children) {
      const node = document.createElement(tag);
      if (props) {
        for (const k in props) {
          const v = props[k];
          if (v == null || v === false) continue;
          if (k === 'class') node.className = v;
          else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
          else if (k === 'html') node.innerHTML = v;
          else if (k === 'text') node.textContent = v;
          else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
          else if (k === 'dataset') Object.assign(node.dataset, v);
          else node.setAttribute(k, v === true ? '' : v);
        }
      }
      for (const c of children.flat()) {
        if (c == null || c === false) continue;
        node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      }
      return node;
    },

    rand(a, b) { return a + Math.random() * (b - a); },
    randi(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    chance(p) { return Math.random() < p; },
    clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
    lerp(a, b, t) { return a + (b - a) * t; },
    sleep(ms) { return new Promise((r) => setTimeout(r, ms)); },

    esc(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },

    pad(n, w = 2) { return String(n).padStart(w, '0'); },

    fmtClock(d) {
      let h = d.getHours();
      const ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return h + ':' + U.pad(d.getMinutes()) + ' ' + ap;
    },

    fmtDate(d) {
      return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
    },

    fmtVCR(d) {
      const M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()];
      let h = d.getHours();
      const ap = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return M + ' ' + U.pad(d.getDate()) + ' ' + d.getFullYear() + '  ' + U.pad(h) + ':' + U.pad(d.getMinutes()) + ':' + U.pad(d.getSeconds()) + ' ' + ap;
    },

    // Replace a fraction of characters with block/glitch glyphs.
    corrupt(text, amount = 0.15) {
      return String(text).split('').map((ch) => (ch !== ' ' && ch !== '\n' && Math.random() < amount ? U.pick(GLITCH_CHARS) : ch)).join('');
    },

    zalgo(text, n = 3) {
      return String(text).split('').map((ch) => {
        if (ch === ' ' || ch === '\n') return ch;
        let s = ch;
        for (let i = 0; i < n; i++) s += U.pick(ZALGO_UP);
        for (let i = 0; i < n; i++) s += U.pick(ZALGO_DOWN);
        return s;
      }).join('');
    },

    uid() { return 'u' + Math.random().toString(36).slice(2, 9); },

    // Fill {USER} {User} {TIME} {DATE} placeholders.
    fill(text) {
      const now = new Date();
      return String(text)
        .replace(/\{USER\}/g, G.userName ? G.userName.toUpperCase() : 'VIEWER')
        .replace(/\{User\}/g, G.userName || 'Viewer')
        .replace(/\{user\}/g, G.userName ? G.userName.toLowerCase() : 'viewer')
        .replace(/\{TIME\}/g, U.fmtClock(now))
        .replace(/\{DATE\}/g, U.fmtDate(now))
        .replace(/\{YEAR\}/g, String(now.getFullYear()));
    }
  };

  G.util = U;
})(window.G);
