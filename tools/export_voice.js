#!/usr/bin/env node
// Exports the voice script for recording / AI voice generation.
//
//   node tools/export_voice.js          -> docs/voice/voice_lines_<lang>.csv for every language
//
// Each row: key, character, direction, file, text.
// Put the finished audio files in src/lang/<lang>/assets/voice/<file>
// and register them in src/lang/languages.js:  voices: { '<key>': '<file>' }.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(__dirname, '..', 'src');
const OUT = path.join(__dirname, '..', 'docs', 'voice');

const ANNOUNCER = 'Calm early-2000s local TV announcer, warm and formal, clean studio mic.';
const RETURN = 'The same announcer played back WRONG: ~70% speed, pitched down ~5 semitones, long pauses, tape wobble.';
const HOST = 'THE HOST: very deep, calm, friendly TV-host voice, slightly too slow, smiling while it speaks, unnatural pauses. Never raises its voice.';
const HOST_WHISPER = 'THE HOST, whispering very close to the mic, almost no voice.';
const EAS = 'Synthetic emergency-broadcast voice: flat monotone text-to-speech like early-2000s weather radio, band-passed, a little distorted.';

// key -> [character, direction, file name without extension, note]
const LINES = {
  'tp.s.say': ['Announcer', ANNOUNCER, 'announcer_signoff'],
  'tp.r.say1': ['Announcer (return)', RETURN, 'return_1'],
  'tp.r.say2': ['Announcer (return)', RETURN, 'return_2'],
  'tp.h.say': ['The Host', HOST, 'host_good_evening'],
  'tp.e.say1': ['EAS voice', EAS, 'eas_guests'],
  'tp.e.say2': ['EAS voice', EAS + ' Read the names slowly, one by one.', 'eas_names'],
  'tp.o.say': ['The Host', HOST_WHISPER, 'host_whisper_daniel'],
  'tp.i.say': ['The Host', HOST, 'host_thanks_daniel'],
  'tp.l.sayEvening': ['The Host', HOST, 'host_good_evening_you', 'Contains the PLAYER\'S NAME. A recording cannot know it: record it without the name ("Good evening.") or leave this line to text-to-speech.'],
  'tp.l.sayDont': ['The Host', HOST_WHISPER, 'host_dont_turn'],
  'end.h.say': ['The Host', HOST, 'host_see_you_home']
};

// load language packs the same way the checker does
const packs = {};
const sandbox = { window: {}, console };
sandbox.G = sandbox.window.G = { i18n: { add: (code, dict) => { packs[code] = Object.assign(packs[code] || {}, dict); } } };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(SRC, 'lang/languages.js'), 'utf8'), sandbox);
for (const l of sandbox.G.LANGUAGES) {
  for (const f of l.files) {
    const p = path.join(SRC, 'lang', l.code, f);
    if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), sandbox, { filename: p });
  }
}

const csv = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
fs.mkdirSync(OUT, { recursive: true });
for (const l of sandbox.G.LANGUAGES) {
  const rows = [['key', 'character', 'direction', 'file', 'text', 'note'].map(csv).join(',')];
  for (const [key, [who, dir, file, note]] of Object.entries(LINES)) {
    const text = (packs[l.code] && packs[l.code][key]) || (packs.en && packs.en[key]) || '';
    rows.push([key, who, dir, file + '.ogg', text, note || ''].map(csv).join(','));
  }
  const out = path.join(OUT, 'voice_lines_' + l.code + '.csv');
  fs.writeFileSync(out, '﻿' + rows.join('\r\n') + '\r\n');
  console.log('wrote ' + path.relative(path.join(__dirname, '..'), out) + '  (' + (rows.length - 1) + ' lines)');
}
console.log('\nRegister finished files in src/lang/languages.js, e.g.:\n  voices: { \'tp.h.say\': \'host_good_evening.ogg\' }');
