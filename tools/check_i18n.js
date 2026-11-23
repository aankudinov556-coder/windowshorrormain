#!/usr/bin/env node
// Localization checker.
//
//   node tools/check_i18n.js            check every language in src/lang/languages.js
//   node tools/check_i18n.js ru de      check only these languages
//
// 1. Finds every translation key the game code uses (G.t('...'), t('...'), say('...'), ...)
//    plus the dynamic families (documents, mail, contacts...).
// 2. Verifies English (the reference pack) defines all of them.
// 3. For each other language reports keys that are missing (they fall back to English),
//    keys that don't exist in English (typos), arrays whose length differs,
//    and {placeholders} that were lost in translation.
// Exit code 1 if English is incomplete or a language has errors.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(__dirname, '..', 'src');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith('.js')) out.push(p);
  }
  return out;
}

// ---------- 1. keys used by code ----------
const used = new Set();
const codeFiles = walk(path.join(SRC, 'js'));
const CALL = /\b(?:t|G\.t|say|lines|list|voice|G\.i18n\.t)\(\s*'([a-zA-Z0-9_.]+)'/g;
const KEYLIKE = /'((?:common|name|user|fmt|unit|clock|main|boot|bios|setup|splash|login|off|logoff|shut|power|tb|tray|sm|ap|app|dk|wm|menu|fs|file|type|bklog|ex|pw|np|iv|ml|tv|cmd|tm|bk|run|web|cp|dp|help|srch|pr|about|sys|wp|tape|tp|st|tx|end)\.[a-zA-Z0-9_.]+)'/g;
const NOT_KEY = /^(cmd\.exe|setup\.log|system\.ini|host\.dll|kernel\.sys|txctl\.exe|mtv\.exe|mmail\.exe|backup\.log)$/i; // file names that look like keys
for (const f of codeFiles) {
  if (f.endsWith(path.join('core', 'i18n.js'))) continue;
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = CALL.exec(src))) if (!NOT_KEY.test(m[1])) used.add(m[1]);
  while ((m = KEYLIKE.exec(src))) if (!NOT_KEY.test(m[1])) used.add(m[1]);
}
// dynamic families
const fsdata = fs.readFileSync(path.join(SRC, 'js/content/fsdata.js'), 'utf8');
for (const m of fsdata.matchAll(/txt\('\w+',\s*(?:t\('[^']+'\)|'[^']+'),\s*'(\w+)'/g)) if (m[1] !== 'backupLog') used.add('doc.' + m[1]);
for (const m of fsdata.matchAll(/doc: '(\w+)'/g)) if (m[1] !== 'backupLog') used.add('doc.' + m[1]);
const mailSrc = fs.readFileSync(path.join(SRC, 'js/content/mail.js'), 'utf8');
for (const m of mailSrc.matchAll(/\{ id: '(\w+)', folder: '\w+',(?: late: true,)? from: '(\w+)', to: '(\w+)'/g)) {
  used.add('mail.' + m[1] + '.subject');
  used.add('mail.' + m[1] + '.body');
  used.add('contact.' + m[2]);
  used.add('contact.' + m[3]);
}
['inbox', 'outbox', 'sent', 'deleted', 'drafts'].forEach((f) => used.add('ml.' + f));
[1, 2, 3, 4].forEach((n) => used.add('tv.ch12_' + n));
// prefixes that are only ever built dynamically are not real keys
['tv.ch12_', 'doc.', 'contact.', 'mail.', 'ml.'].forEach((k) => used.delete(k));

// ---------- 2. load packs ----------
const packs = {};
const sandbox = { window: {}, console };
sandbox.G = sandbox.window.G = { i18n: { add: (code, dict) => { packs[code] = Object.assign(packs[code] || {}, dict); } } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(SRC, 'lang/languages.js'), 'utf8'), sandbox);
const LANGS = sandbox.G.LANGUAGES;
for (const l of LANGS) {
  for (const f of l.files) {
    const p = path.join(SRC, 'lang', l.code, f);
    if (!fs.existsSync(p)) { console.error('✗ ' + l.code + ': missing file ' + path.relative(SRC, p)); continue; }
    vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: p });
  }
}

const want = process.argv.slice(2);
const en = packs.en || {};
let failed = false;

const missingEn = [...used].filter((k) => !(k in en)).sort();
const unusedEn = Object.keys(en).filter((k) => !used.has(k)).sort();
console.log('Keys used by the game: ' + used.size + '   English keys: ' + Object.keys(en).length);
if (missingEn.length) { failed = true; console.log('\n✗ English is missing ' + missingEn.length + ' key(s):\n  ' + missingEn.join('\n  ')); }
else console.log('✓ English defines every key the game uses.');
if (unusedEn.length) console.log('\n• English keys not referenced by code (fine if used dynamically):\n  ' + unusedEn.join('\n  '));

const placeholders = (v) => {
  const s = Array.isArray(v) ? v.join('\n') : typeof v === 'string' ? v : '';
  return (s.match(/\{[A-Za-z]+\}/g) || []).sort().join(' ');
};

for (const l of LANGS) {
  if (l.code === 'en' || (want.length && !want.includes(l.code))) continue;
  const p = packs[l.code] || {};
  const missing = Object.keys(en).filter((k) => !(k in p));
  const extra = Object.keys(p).filter((k) => !(k in en));
  const arrays = Object.keys(en).filter((k) => k in p && Array.isArray(en[k]) !== Array.isArray(p[k]));
  const ph = Object.keys(en).filter((k) => k in p && typeof en[k] !== 'function' && typeof p[k] !== 'function' && placeholders(en[k]) !== placeholders(p[k]) && !/^(tp\.e\.names|cmd\.txhelp|cmd\.help)$/.test(k));
  const pct = Math.round(100 * (Object.keys(en).length - missing.length) / Object.keys(en).length);
  console.log('\n[' + l.code + '] ' + l.native + ' — ' + pct + '% translated (' + (Object.keys(en).length - missing.length) + '/' + Object.keys(en).length + ')');
  if (missing.length) console.log('  missing (will show English):\n    ' + missing.join('\n    '));
  if (extra.length) { failed = true; console.log('  ✗ unknown keys (typo?):\n    ' + extra.join('\n    ')); }
  if (arrays.length) { failed = true; console.log('  ✗ must be a list like in English:\n    ' + arrays.join('\n    ')); }
  if (ph.length) console.log('  ! placeholders differ from English (check {…}):\n    ' + ph.map((k) => k + '   en: ' + placeholders(en[k]) + '   ' + l.code + ': ' + placeholders(p[k])).join('\n    '));
  if (!missing.length && !extra.length && !arrays.length) console.log('  ✓ complete');
}
process.exit(failed ? 1 : 0);
