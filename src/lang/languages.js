// Available languages.
//
// To add a language: copy src/lang/en to src/lang/<code>, translate it,
// add an entry below, then run:  node tools/check_i18n.js <code>
// See docs/LOCALIZATION.md for details.
//
//   code    folder name in src/lang/ and the value saved in settings
//   native  name shown in the language picker
//   speech  text-to-speech language tag (a voice for it must exist on the PC)
//   files   pack files to load, in order
//   assets  paths under src/assets/ that this language overrides with
//           src/lang/<code>/assets/<same path>  (e.g. 'img/school_play_2003.jpg')
//   voices  recorded voice lines: { '<text key>': '<file in lang/<code>/assets/voice/>' }
window.G = window.G || {};
G.LANGUAGES = [
  {
    code: 'en',
    native: 'English',
    speech: 'en',
    files: ['ui.js', 'content.js', 'story.js'],
    assets: [],
    voices: {}
  },
  {
    code: 'ru',
    native: 'Русский',
    speech: 'ru',
    files: ['ui.js', 'content.js', 'story.js'],
    assets: [],
    voices: {}
  }
];
