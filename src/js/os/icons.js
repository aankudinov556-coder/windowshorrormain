// Original 32x32 SVG icon set in a 2000s desktop style.
// "$" inside a definition is replaced with a unique suffix so gradient ids never clash.
(function (G) {
  'use strict';

  const page = (inner, fold = '#d8d8d8') => `
    <path d="M7 2.5 H20 L26 8.5 V29.5 H7 Z" fill="#fff" stroke="#7b7b7b"/>
    <path d="M20 2.5 V8.5 H26" fill="${fold}" stroke="#7b7b7b"/>${inner}`;

  const folderBase = (front = 'url(#fg$)') => `
    <defs><linearGradient id="fg$" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset="1" stop-color="#f0bf45"/></linearGradient></defs>
    <path d="M2.5 7.5 H12 L14 10 H29.5 V27.5 H2.5 Z" fill="#dca738" stroke="#a87b1c"/>
    <path d="M2.5 12.5 H29.5 V27.5 H2.5 Z" fill="${front}" stroke="#a87b1c"/>`;

  const winFrame = (body) => `
    <defs><linearGradient id="tb$" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a8cff"/><stop offset="1" stop-color="#0a4fd4"/></linearGradient></defs>
    <rect x="3.5" y="5.5" width="25" height="21" rx="1.5" fill="#ece9d8" stroke="#0a3fa8"/>
    <rect x="4" y="6" width="24" height="5" fill="url(#tb$)"/>
    <rect x="23.5" y="7" width="3" height="3" fill="#e0503c"/>${body}`;

  const lock = `<g transform="translate(17 15)"><rect x="1" y="6" width="12" height="9" rx="1.5" fill="#e8b830" stroke="#8a6410"/><path d="M3.5 6 V3.5 C3.5 0.5 10.5 0.5 10.5 3.5 V6" fill="none" stroke="#6b6b6b" stroke-width="2"/><circle cx="7" cy="10" r="1.4" fill="#6b4a00"/></g>`;

  const D = {
    logo: `<defs><radialGradient id="sun$" cx="0.5" cy="0.9" r="0.7"><stop offset="0" stop-color="#fff6b0"/><stop offset="0.5" stop-color="#ffc21a"/><stop offset="1" stop-color="#ff7b00"/></radialGradient></defs>
      <g stroke="#ffb000" stroke-width="2" stroke-linecap="round"><path d="M16 4 V8"/><path d="M6.5 8 L9 10.5"/><path d="M25.5 8 L23 10.5"/><path d="M2.5 16.5 H6"/><path d="M29.5 16.5 H26"/></g>
      <path d="M7 21 A9 9 0 0 1 25 21 Z" fill="url(#sun$)"/>
      <path d="M2 21.5 H30" stroke="#1f6fe0" stroke-width="2.5"/><path d="M6 25 H26" stroke="#3aa0ff" stroke-width="2"/><path d="M10 28 H22" stroke="#7cc4ff" stroke-width="1.6"/>`,

    computer: `<defs><linearGradient id="sc$" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ec8ff"/><stop offset="1" stop-color="#1e5fc9"/></linearGradient></defs>
      <rect x="3.5" y="3.5" width="25" height="19" rx="2" fill="#e6e1cf" stroke="#8a8571"/>
      <rect x="6" y="6" width="20" height="14" fill="url(#sc$)" stroke="#55524a"/>
      <path d="M8 18 L13 12 L17 16 L19 14 L24 18 Z" fill="#5fbf4a" opacity=".85"/>
      <path d="M12 22.5 H20 L21.5 26 H10.5 Z" fill="#d4cfbc" stroke="#8a8571"/>
      <rect x="6.5" y="26.5" width="19" height="3" rx="1" fill="#e6e1cf" stroke="#8a8571"/>`,

    folder: folderBase(),
    folderOpen: `<defs><linearGradient id="fo$" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset="1" stop-color="#f0bf45"/></linearGradient></defs>
      <path d="M2.5 7.5 H12 L14 10 H27.5 V27.5 H2.5 Z" fill="#dca738" stroke="#a87b1c"/>
      <path d="M6.5 14.5 H31 L27.5 27.5 H2.5 Z" fill="url(#fo$)" stroke="#a87b1c"/>`,

    docs: folderBase() + `<path d="M9 5.5 H21 V17 H9 Z" fill="#fff" stroke="#888"/><path d="M11 8 H19 M11 10.5 H19 M11 13 H17" stroke="#7ea6d8"/>
      <path d="M2.5 12.5 H29.5 V27.5 H2.5 Z" fill="url(#fg$)" stroke="#a87b1c" opacity=".92"/>`,

    pics: folderBase() + `<rect x="16" y="15.5" width="12" height="10" fill="#fff" stroke="#777"/><rect x="17.5" y="17" width="9" height="7" fill="#79b8f0"/><path d="M17.5 24 L21 19.5 L23.5 22 L26.5 18.5 V24 Z" fill="#4c9a32"/><circle cx="19.5" cy="18.8" r="1" fill="#ffe25a"/>`,

    music: folderBase() + `<path d="M21 14 V23" stroke="#1f4fa0" stroke-width="1.6"/><circle cx="19.3" cy="23.5" r="2.2" fill="#1f4fa0"/><path d="M21 14 L26 13 V21" stroke="#1f4fa0" stroke-width="1.6" fill="none"/><circle cx="24.3" cy="21.5" r="2.2" fill="#1f4fa0"/>`,

    videos: folderBase() + `<rect x="15.5" y="15.5" width="13" height="10" fill="#222" stroke="#000"/><path d="M17 16.5 h1 M20 16.5 h1 M23 16.5 h1 M26 16.5 h1 M17 24.5 h1 M20 24.5 h1 M23 24.5 h1 M26 24.5 h1" stroke="#ddd"/><rect x="17" y="18" width="10" height="5" fill="#5aa0e0"/>`,

    lockedFolder: folderBase() + lock,

    binEmpty: `<defs><linearGradient id="bn$" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9d4dc"/><stop offset=".5" stop-color="#f4f7f9"/><stop offset="1" stop-color="#9eabb5"/></linearGradient></defs>
      <path d="M6 8.5 H26 L23.5 29.5 H8.5 Z" fill="url(#bn$)" stroke="#5d6b75"/>
      <ellipse cx="16" cy="8.5" rx="10" ry="2.5" fill="#dfe6eb" stroke="#5d6b75"/>
      <path d="M10 11 L11 28 M14 11 L14.5 28.5 M18 11 L17.5 28.5 M22 11 L21 28" stroke="#8b98a2" stroke-width=".8"/>
      <path d="M7 15 H25 M7.6 20 H24.4 M8.1 25 H23.9" stroke="#8b98a2" stroke-width=".8"/>`,

    binFull: `<defs><linearGradient id="bf$" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c9d4dc"/><stop offset=".5" stop-color="#f4f7f9"/><stop offset="1" stop-color="#9eabb5"/></linearGradient></defs>
      <path d="M8 9 L12 3 L16 8 Z" fill="#fff" stroke="#999"/><path d="M15 8 L21 2.5 L24 9 Z" fill="#f6f0d0" stroke="#999"/><path d="M10 9 L17 5 L20 9.5 Z" fill="#e8eef8" stroke="#999"/>
      <path d="M6 8.5 H26 L23.5 29.5 H8.5 Z" fill="url(#bf$)" stroke="#5d6b75"/>
      <ellipse cx="16" cy="8.5" rx="10" ry="2.5" fill="none" stroke="#5d6b75"/>
      <path d="M10 11 L11 28 M14 11 L14.5 28.5 M18 11 L17.5 28.5 M22 11 L21 28" stroke="#8b98a2" stroke-width=".8"/>
      <path d="M7 15 H25 M7.6 20 H24.4 M8.1 25 H23.9" stroke="#8b98a2" stroke-width=".8"/>`,

    txt: page('<path d="M10 12 H23 M10 15 H23 M10 18 H23 M10 21 H20 M10 24 H22" stroke="#9aa"/>'),
    log: page('<rect x="7.5" y="3" width="12" height="4" fill="#c33"/><path d="M10 12 H23 M10 15 H23 M10 18 H23 M10 21 H20 M10 24 H22" stroke="#9aa"/>'),
    sys: page('<circle cx="16.5" cy="18" r="5" fill="none" stroke="#777" stroke-width="2"/><path d="M16.5 11 V13 M16.5 23 V25 M9.5 18 H11.5 M21.5 18 H23.5" stroke="#777" stroke-width="2"/>'),
    img: page('<rect x="9.5" y="11.5" width="14" height="12" fill="#86c3f5" stroke="#4a6a8a"/><path d="M9.5 23.5 L14 17 L17 20.5 L19.5 18 L23.5 23.5 Z" fill="#4c9a32"/><circle cx="20.5" cy="14.5" r="1.6" fill="#ffe25a"/>'),
    video: `<rect x="5.5" y="4.5" width="21" height="23" fill="#1c1c1c" stroke="#000"/>
      <path d="M7 6.5 h2 M7 10.5 h2 M7 14.5 h2 M7 18.5 h2 M7 22.5 h2 M23 6.5 h2 M23 10.5 h2 M23 14.5 h2 M23 18.5 h2 M23 22.5 h2" stroke="#e8e8e8" stroke-width="1.6"/>
      <g transform="translate(10.5 8)"><rect width="1.6" height="9" fill="#c0c0c0"/><rect x="1.6" width="1.6" height="9" fill="#c0c000"/><rect x="3.2" width="1.6" height="9" fill="#00c0c0"/><rect x="4.8" width="1.6" height="9" fill="#00c000"/><rect x="6.4" width="1.6" height="9" fill="#c000c0"/><rect x="8" width="1.6" height="9" fill="#c00000"/><rect x="9.6" width="1.4" height="9" fill="#0000c0"/></g>
      <path d="M13 20 L13 26 L18.5 23 Z" fill="#fff"/>`,
    eml: `<rect x="3.5" y="8.5" width="25" height="17" fill="#fffef4" stroke="#7a7a6a"/><path d="M3.5 8.5 L16 18 L28.5 8.5" fill="none" stroke="#7a7a6a"/><rect x="22" y="10.5" width="4" height="4" fill="#e6b422"/>`,
    exe: winFrame('<rect x="6" y="13" width="9" height="11" fill="#fff" stroke="#999"/><rect x="17" y="13" width="9" height="5" fill="#cde" stroke="#999"/>'),
    bat: winFrame('<circle cx="16" cy="18.5" r="4.5" fill="none" stroke="#6a6a6a" stroke-width="2.4" stroke-dasharray="2.2 1.4"/><circle cx="16" cy="18.5" r="1.6" fill="#6a6a6a"/>'),
    cmd: `<rect x="3.5" y="5.5" width="25" height="21" fill="#000" stroke="#555"/><rect x="4" y="6" width="24" height="4" fill="#0a4fd4"/><text x="6" y="18" font-family="monospace" font-size="7" fill="#ccc">C:\\&gt;</text><rect x="20" y="16" width="4" height="1.5" fill="#ccc"/>`,
    taskmgr: winFrame('<rect x="6" y="13" width="20" height="11" fill="#000"/><path d="M6 21 L9 18 L12 22 L15 15 L18 19 L21 16 L26 20" fill="none" stroke="#2f2" stroke-width="1.2"/>'),
    notepad: `<rect x="6.5" y="5.5" width="19" height="24" fill="#fff" stroke="#6a7a8a"/><rect x="6.5" y="5.5" width="19" height="4" fill="#3c78d8"/>
      <path d="M9 4 V7.5 M12 4 V7.5 M15 4 V7.5 M18 4 V7.5 M21 4 V7.5" stroke="#555" stroke-width="1.2"/>
      <path d="M9 13 H23 M9 16 H23 M9 19 H23 M9 22 H20 M9 25 H22" stroke="#9ab"/>`,
    tv: `<defs><radialGradient id="tvs$" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#bfe6ff"/><stop offset=".6" stop-color="#3a7fd0"/><stop offset="1" stop-color="#10305a"/></radialGradient></defs>
      <path d="M11 3 L16 9 L22 2" fill="none" stroke="#555" stroke-width="1.3"/>
      <rect x="2.5" y="8.5" width="27" height="19" rx="3" fill="#8a6a46" stroke="#4a361e"/>
      <rect x="5" y="11" width="17" height="14" rx="3" fill="url(#tvs$)" stroke="#222"/>
      <circle cx="25.5" cy="14" r="1.6" fill="#ddd" stroke="#333"/><circle cx="25.5" cy="19" r="1.6" fill="#ddd" stroke="#333"/><path d="M24 23 h3" stroke="#333"/>
      <path d="M7 27.5 L6 30 M25 27.5 L26 30" stroke="#4a361e" stroke-width="1.5"/>`,
    tvLive: `<path d="M11 3 L16 9 L22 2" fill="none" stroke="#555" stroke-width="1.3"/>
      <rect x="2.5" y="8.5" width="27" height="19" rx="3" fill="#3a2a1a" stroke="#000"/>
      <rect x="5" y="11" width="17" height="14" rx="3" fill="#120000" stroke="#000"/>
      <ellipse cx="13.5" cy="18" rx="4.5" ry="2.6" fill="#ddd"/><circle cx="13.5" cy="18" r="1.8" fill="#000"/><circle cx="14" cy="17.5" r=".5" fill="#fff"/>
      <circle cx="25.5" cy="14" r="1.6" fill="#a00"/>`,
    mail: `<defs><linearGradient id="ml$" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e3e9f2"/></linearGradient></defs>
      <rect x="3.5" y="9.5" width="22" height="15" fill="url(#ml$)" stroke="#5f6f88"/><path d="M3.5 9.5 L14.5 18 L25.5 9.5" fill="none" stroke="#5f6f88"/>
      <path d="M17 25 C22 30 30 26 29 18" fill="none" stroke="#1e7be0" stroke-width="2.4"/><path d="M26.5 17 L29.3 14.5 L31 18.8 Z" fill="#1e7be0"/>`,
    backup: `<defs><linearGradient id="bk$" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2f2f2"/><stop offset="1" stop-color="#a9a9a9"/></linearGradient></defs>
      <rect x="3.5" y="14.5" width="22" height="12" rx="2" fill="url(#bk$)" stroke="#555"/><rect x="6" y="21" width="3" height="2" fill="#3c3"/>
      <path d="M20 4 A8 8 0 1 1 13 15" fill="none" stroke="#1f9a2a" stroke-width="3"/><path d="M9 12 L14 17.5 L16 11 Z" fill="#1f9a2a"/>`,
    drive: `<defs><linearGradient id="dr$" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f4f4"/><stop offset="1" stop-color="#b8b8b8"/></linearGradient></defs>
      <path d="M3.5 13.5 L7 8.5 H25 L28.5 13.5 Z" fill="#dcdcdc" stroke="#666"/>
      <rect x="3.5" y="13.5" width="25" height="10" rx="1" fill="url(#dr$)" stroke="#666"/><rect x="22" y="17" width="4" height="2.5" fill="#2c2"/><path d="M6 17 H18 M6 20 H18" stroke="#999"/>`,
    driveTv: `<defs><linearGradient id="dt$" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f4f4"/><stop offset="1" stop-color="#b8b8b8"/></linearGradient></defs>
      <path d="M3.5 13.5 L7 8.5 H25 L28.5 13.5 Z" fill="#dcdcdc" stroke="#666"/>
      <rect x="3.5" y="13.5" width="25" height="10" rx="1" fill="url(#dt$)" stroke="#666"/><rect x="22" y="17" width="4" height="2.5" fill="#d22"/>
      <rect x="6" y="15.5" width="11" height="6" fill="#123" stroke="#333"/><path d="M7 17 h1.5 v3 h-1.5 z M9 17 h1.5 v3 h-1.5 z M11 17 h1.5 v3 h-1.5 z M13 17 h1.5 v3 h-1.5 z" fill="#4af"/>`,
    usb: `<rect x="8.5" y="5.5" width="15" height="22" rx="2" fill="#3a3a44" stroke="#111"/><rect x="11" y="8" width="10" height="7" fill="#f08a24"/><text x="12.2" y="13.6" font-size="5" font-family="Arial" font-weight="bold" fill="#fff">BKP</text><circle cx="16" cy="22" r="1.3" fill="#3f3"/>`,
    floppy: `<rect x="5.5" y="4.5" width="21" height="23" rx="1" fill="#2a3a6a" stroke="#101830"/><rect x="10" y="4.5" width="12" height="8" fill="#c8ccd2" stroke="#555"/><rect x="17" y="6" width="3" height="5" fill="#2a3a6a"/><rect x="8.5" y="16" width="15" height="10" fill="#f4f4f4"/>`,
    cdrom: `<path d="M3.5 13.5 L7 8.5 H25 L28.5 13.5 Z" fill="#dcdcdc" stroke="#666"/><rect x="3.5" y="13.5" width="25" height="10" rx="1" fill="#d8d8d8" stroke="#666"/><circle cx="16" cy="12" r="7" fill="#e8f0ff" stroke="#8899aa" opacity=".9"/><circle cx="16" cy="12" r="2" fill="#fff" stroke="#8899aa"/>`,
    help: `<rect x="6.5" y="4.5" width="19" height="23" rx="1" fill="#2d6fd2" stroke="#123c80"/><rect x="8.5" y="4.5" width="2" height="23" fill="#1b4fa8"/><text x="13.5" y="22" font-size="16" font-weight="bold" font-family="Georgia,serif" fill="#fff">?</text>`,
    search: `<circle cx="13" cy="13" r="7.5" fill="#d8efff" stroke="#355" stroke-width="2"/><path d="M18.5 18.5 L27 27" stroke="#6b4a1e" stroke-width="4" stroke-linecap="round"/>`,
    run: winFrame('<path d="M9 21 L19 14 M19 14 L14 14 M19 14 L19 19" stroke="#1f9a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>'),
    control: `<rect x="4.5" y="5.5" width="23" height="21" rx="1.5" fill="#ece9d8" stroke="#777"/><path d="M10 9 V23 M16 9 V23 M22 9 V23" stroke="#666" stroke-width="1.5"/><rect x="8" y="12" width="4" height="3" fill="#3a8cff" stroke="#123"/><rect x="14" y="17" width="4" height="3" fill="#3a8cff" stroke="#123"/><rect x="20" y="11" width="4" height="3" fill="#3a8cff" stroke="#123"/>`,
    web: `<defs><radialGradient id="gl$" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#bfe8ff"/><stop offset="1" stop-color="#1e6fd0"/></radialGradient></defs>
      <circle cx="16" cy="16" r="12" fill="url(#gl$)" stroke="#164f99"/><path d="M8 10 C11 9 12 13 15 12 C17 11 15 7 18 6 M18 26 C17 22 21 21 22 18 C23 16 26 17 27 19 M5 18 C8 18 9 21 11 24" fill="none" stroke="#3a9a2a" stroke-width="2.4"/>`,
    error: `<circle cx="16" cy="16" r="13" fill="#e23b2e" stroke="#8a1a12"/><path d="M10.5 10.5 L21.5 21.5 M21.5 10.5 L10.5 21.5" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`,
    warn: `<path d="M16 3 L30 28 H2 Z" fill="#ffd21f" stroke="#8a6a00" stroke-linejoin="round"/><path d="M16 11 V19" stroke="#000" stroke-width="3.2" stroke-linecap="round"/><circle cx="16" cy="23.5" r="1.8" fill="#000"/>`,
    info: `<circle cx="16" cy="16" r="13" fill="#fff" stroke="#2a62c8" stroke-width="2"/><circle cx="16" cy="9.5" r="2" fill="#2a62c8"/><path d="M16 14 V24" stroke="#2a62c8" stroke-width="3.4" stroke-linecap="round"/>`,
    question: `<circle cx="16" cy="16" r="13" fill="#fff" stroke="#2a62c8" stroke-width="2"/><text x="10.5" y="23" font-size="18" font-weight="bold" font-family="Georgia,serif" fill="#2a62c8">?</text>`,
    speaker: `<path d="M5 12 H10 L16 7 V25 L10 20 H5 Z" fill="#e8e8e8" stroke="#555"/><path d="M19 11 C21.5 13.5 21.5 18.5 19 21 M22 8 C26.5 12.5 26.5 19.5 22 24" fill="none" stroke="#e8e8e8" stroke-width="1.8"/>`,
    network: `<rect x="3.5" y="5.5" width="12" height="9" fill="#9cd" stroke="#345"/><rect x="16.5" y="13.5" width="12" height="9" fill="#9cd" stroke="#345"/><path d="M9 14.5 V18 H16" stroke="#ddd" stroke-width="1.5" fill="none"/><path d="M5 20 L13 28 M13 20 L5 28" stroke="#e22" stroke-width="2.6"/>`,
    hddWarn: `<rect x="3.5" y="12.5" width="21" height="10" rx="1" fill="#d8d8d8" stroke="#555"/><rect x="19" y="16" width="3" height="2" fill="#f33"/><path d="M22 3 L31 19 H13 Z" fill="#ffd21f" stroke="#8a6a00"/><path d="M22 8 V13.5" stroke="#000" stroke-width="2.4"/><circle cx="22" cy="16.3" r="1.2" fill="#000"/>`,
    host: `<rect x="3.5" y="5.5" width="25" height="21" rx="2" fill="#111" stroke="#000"/><ellipse cx="16" cy="16" rx="7" ry="4" fill="#eee"/><circle cx="16" cy="16" r="2.8" fill="#000"/><circle cx="16.8" cy="15.2" r=".7" fill="#fff"/>`,
    power: `<circle cx="16" cy="16" r="12" fill="#e04a2a" stroke="#8a2410"/><path d="M11.5 10.5 A7 7 0 1 0 20.5 10.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M16 7 V16" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`,
    logoff: `<rect x="4" y="4" width="24" height="24" rx="4" fill="#f0b428" stroke="#8a6410"/><circle cx="12" cy="16" r="4" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M16 16 H25 M22 16 V20 M25 16 V19" stroke="#fff" stroke-width="2.4"/>`,
    programs: `<circle cx="16" cy="16" r="12" fill="#2fa23a" stroke="#14641c"/><path d="M12 9.5 L20 16 L12 22.5" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    shortcut: `<rect x="0.5" y="0.5" width="10" height="10" fill="#fff" stroke="#444"/><path d="M3 8 C3 5 4.5 4 7.5 4 M5.5 2 L8 4 L5.5 6" fill="none" stroke="#0b3fbf" stroke-width="1.6"/>`,
    paint: `<rect x="4.5" y="6.5" width="23" height="18" fill="#fff" stroke="#666"/><circle cx="12" cy="14" r="3" fill="#e33"/><circle cx="19" cy="13" r="3" fill="#36c"/><circle cx="15" cy="19" r="3" fill="#3a3"/><path d="M22 28 L28 18" stroke="#8a5a2a" stroke-width="2.4"/>`,
    cards: `<rect x="5.5" y="6.5" width="14" height="19" rx="1.5" fill="#fff" stroke="#444" transform="rotate(-12 12 16)"/><rect x="12.5" y="6.5" width="14" height="19" rx="1.5" fill="#fff" stroke="#444"/><path d="M19.5 11 C17 11 16 14 19.5 18 C23 14 22 11 19.5 11 Z" fill="#d22"/>`,
    page: page('')
  };

  let counter = 0;

  G.icon = function (name, size = 32, extraClass = '') {
    const def = D[name] || D.page;
    const id = 'i' + (++counter);
    return '<svg class="ico ' + extraClass + '" width="' + size + '" height="' + size + '" viewBox="0 0 32 32" aria-hidden="true">' + def.replace(/\$/g, id) + '</svg>';
  };

  G.iconWithShortcut = function (name, size = 32) {
    const sc = size >= 32 ? '<svg class="ico-sc" width="11" height="11" viewBox="0 0 11 11">' + D.shortcut + '</svg>' : '';
    return '<span class="ico-wrap">' + G.icon(name, size) + sc + '</span>';
  };

  G.hasIcon = (name) => !!D[name];
})(window.G);
