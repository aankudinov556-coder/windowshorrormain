// The file tree of Daniel Mercer's computer.
// Built by G.buildFS() once the language is known, because folder and file
// names are translated. Ids never change between languages (saves use ids).
// Dates use content stamps ('YYYY-MM-DD HH:MM', 'TODAY HH:MM', 'NOW'), see util.parseStamp.
(function (G) {
  'use strict';
  const t = G.t;

  G.buildFS = function () {
    const lvl = (n) => (s) => s.level >= n;
    const kindOf = (name) => (/\.log$/i.test(name) ? 'log' : /\.ini$/i.test(name) ? 'ini' : 'txt');
    const txt = (id, name, doc, date, size, extra) => Object.assign({ id, name, type: 'file', kind: kindOf(name), doc, date, size: size || '1 KB' }, extra || {});
    const jpg = (id, name, src, date, size, extra) => Object.assign({ id, name, type: 'file', kind: 'jpg', src, date, size: size || '84 KB' }, extra || {});
    const mpg = (id, name, tape, date, size, extra) => Object.assign({ id, name, type: 'file', kind: 'mpg', tape, date, size }, extra || {});
    const dir = (id, name, children, extra) => Object.assign({ id, name, type: 'dir', children }, extra || {});

    const tree = {
      id: 'root', name: t('fs.desktop'), type: 'special', pathName: t('fs.desktop'), children: [

        // ---------------- desktop ----------------
        { id: 'desktop', name: t('fs.desktop'), type: 'special', pathName: t('fs.desktop'), icon: 'computer', children: [
          { id: 'd_mycomputer', name: t('fs.mycomp'), type: 'file', kind: 'lnk', target: 'mycomputer', icon: 'computer', label: (s) => (s.level >= 3 ? t('fs.ourcomp') : t('fs.mycomp')) },
          { id: 'd_mydocs', name: t('fs.mydocs'), type: 'file', kind: 'lnk', target: 'mydocs', icon: 'docs', label: (s) => (s.level >= 3 ? t('fs.ourdocs') : t('fs.mydocs')) },
          { id: 'd_recycle', name: t('fs.recycle'), type: 'file', kind: 'lnk', target: 'recycle', icon: () => (G.fs.children(G.fs.byId('recycle')).length ? 'binFull' : 'binEmpty'), label: (s) => (s.level >= 3 ? t('fs.recycleGuests') : t('fs.recycle')) },
          { id: 'd_mail', name: t('app.mail'), type: 'file', kind: 'app', app: 'mail', icon: 'mail', shortcut: true },
          { id: 'd_tv', name: t('app.tv'), type: 'file', kind: 'app', app: 'tv', icon: (s) => (s.level >= 3 ? 'tvLive' : 'tv'), shortcut: true, label: (s) => (s.level >= 3 ? t('fs.tvLive') : t('app.tv')) },
          { id: 'd_backup', name: t('app.backup'), type: 'file', kind: 'app', app: 'backup', icon: 'backup', shortcut: true },
          txt('f_readme', t('file.readme'), 'readme', '2026-11-21 18:12', '2 KB'),
          txt('f_guestlist', t('file.guestlist'), 'guestList', '2003-10-14 03:33', '1 KB', { show: lvl(3) }),
          txt('f_goodnight', t('file.goodnight'), 'goodnight', '2003-10-14 03:33', '1 KB', { show: lvl(4) }),
          { id: 'd_txctl', name: 'TXCTL', type: 'file', kind: 'app', app: 'cmd', appArgs: { run: 'txctl' }, icon: 'cmd', shortcut: true, show: lvl(4) }
        ] },

        // ---------------- my computer ----------------
        { id: 'mycomputer', name: t('fs.mycomp'), type: 'special', pathName: t('fs.mycomp'), icon: 'computer', label: (s) => (s.level >= 3 ? t('fs.ourcomp') : t('fs.mycomp')), children: [
          { id: 'drive_a', name: t('fs.driveA'), type: 'drive', icon: 'floppy', driveType: 'type.floppy', pathName: 'A:\\', children: [],
            onOpen: () => { G.dialogs.msg({ title: 'A:\\', icon: 'error', text: t('fs.aNotReady') }); return false; } },

          { id: 'drive_c', name: t('fs.driveC'), type: 'drive', icon: 'drive', pathName: 'C:\\', free: t('fs.freeC'), children: [
            dir('c_docset', 'Documents and Settings', [
              dir('c_daniel', 'Daniel', [
                dir('mydocs', t('fs.mydocs'), [
                  dir('mypics', t('fs.mypics'), [
                    jpg('p_picnic', t('file.p_picnic'), 'family_picnic_2001.jpg', '2001-06-17 14:14', '96 KB'),
                    jpg('p_bday', t('file.p_bday'), 'lily_birthday_8.jpg', '2002-03-09 18:40', '88 KB'),
                    jpg('p_xmas', t('file.p_xmas'), 'christmas_2002.jpg', '2002-12-25 08:02', '91 KB'),
                    jpg('p_lake', t('file.p_lake'), 'lake_fishing.jpg', '2003-07-04 07:31', '102 KB'),
                    jpg('p_tower', t('file.p_tower'), 'pell_hill_tower.jpg', '2003-08-11 17:55', '77 KB'),
                    jpg('p_control', t('file.p_control'), 'station_control_room.jpg', '2003-08-30 01:12', '70 KB'),
                    jpg('p_staff', t('file.p_staff'), (s) => (s.level >= 3 ? 'ch12_staff_2003_b.jpg' : 'ch12_staff_2003.jpg'), '2003-09-05 16:00', '110 KB'),
                    jpg('p_moon', t('file.p_moon'), 'lily_moon_costume.jpg', '2003-10-12 18:21', '93 KB'),
                    jpg('p_0047', 'IMG_0047.jpg', 'IMG_0047.jpg', '2003-10-14 03:33', '64 KB', { show: lvl(1) })
                  ], { icon: 'pics' }),
                  dir('mymusic', t('fs.mymusic'), [], { icon: 'music', emptyText: t('fs.emptyFolder') }),
                  dir('station', t('fs.station'), [
                    txt('f_schedule', t('file.schedule'), 'schedule', '2003-09-30 11:02'),
                    txt('f_procedure', t('file.procedure'), 'procedure', '2003-09-25 04:48', '2 KB'),
                    dir('engineering', t('fs.engineering'), [
                      txt('f_englog', t('file.englog'), 'englog', '2003-10-14 03:31', '4 KB'),
                      txt('f_bearing', t('file.bearing'), 'bearing', '2003-09-20 06:10'),
                      txt('f_halvorsen', t('file.halvorsen'), 'halvorsen', '2003-09-27 05:40', '2 KB'),
                      txt('f_returnnotes', t('file.returnnotes'), 'returnNotes', '2003-10-02 05:17'),
                      dir('frames', 'frame_captures', [
                        jpg('p_f233', 'frame_0233.jpg', 'frame_0233.jpg', '2003-09-23 04:40', '22 KB'),
                        jpg('p_f234', 'frame_0234.jpg', 'frame_0234.jpg', '2003-09-23 04:40', '22 KB'),
                        jpg('p_f237', 'frame_0237.jpg', 'frame_0237.jpg', '2003-09-23 04:41', '23 KB')
                      ])
                    ], { locked: '20525' })
                  ]),
                  dir('personal', t('fs.personal'), [
                    txt('f_todo', t('file.todo'), 'todo', '2003-10-13 23:50'),
                    txt('f_letter', t('file.letter'), 'letter', '2003-10-12 02:14'),
                    txt('f_budget', t('file.budget'), 'budget', '2003-10-01 21:00'),
                    txt('f_dreams', t('file.dreams'), 'dreams', '2003-10-08 04:44'),
                    txt('f_chili', t('file.chili'), 'chili', '2003-01-19 15:30'),
                    txt('f_program', t('file.program'), 'program', '2003-10-06 19:15')
                  ]),
                  txt('f_readmeviewer', 'README_VIEWER.txt', 'readmeViewer', 'TODAY 03:33', '1 KB', { show: lvl(2) })
                ], { icon: 'docs', addr: t('fs.mydocs') }),
                dir('c_favorites', t('fs.favorites'), [], { emptyText: t('fs.emptyFolder'), noBackup: true })
              ]),
              dir('c_allusers', 'All Users', [], { emptyText: t('fs.emptyFolder') })
            ]),
            dir('c_progs', 'Program Files', [
              dir('c_burrell', 'Burrell Broadcast', [
                dir('c_txctl', 'TXCTL', [
                  { id: 'f_txctl_exe', name: 'txctl.exe', type: 'file', kind: 'app', app: 'cmd', appArgs: { run: 'txctl' }, icon: 'cmd', date: '1998-03-02 12:00', size: '88 KB' },
                  txt('f_txctl_readme', 'README.TXT', 'txctl', '2003-10-11 23:40', '2 KB')
                ])
              ]),
              dir('c_mtv', 'Meridian TV', [
                { id: 'f_mtv_exe', name: 'mtv.exe', type: 'file', kind: 'app', app: 'tv', icon: 'tv', date: '2002-06-02 19:22', size: '1.4 MB' },
                { id: 'f_mtvsched', name: 'mtvsched.exe', type: 'file', kind: 'exe', date: '2002-06-02 19:22', size: '212 KB' }
              ]),
              dir('c_mmail', 'Meridian Mail', [
                { id: 'f_mmail_exe', name: 'mmail.exe', type: 'file', kind: 'app', app: 'mail', icon: 'mail', date: '2002-06-02 19:20', size: '980 KB' }
              ])
            ]),
            dir('c_sys', 'MERIDIAN', [
              txt('f_sysini', 'system.ini', 'systemIni', '2003-10-14 03:33'),
              txt('f_setuplog', 'setup.log', 'setupLog', '2002-06-02 19:30'),
              { id: 'f_hostdll', name: 'host.dll', type: 'file', kind: 'dll', date: 'TODAY 03:33', size: '3,333 KB', show: lvl(2), onOpen: () => { G.story.hostProgram(); return false; } },
              { id: 'f_kernel', name: 'kernel.sys', type: 'file', kind: 'sys', date: '2002-06-02 19:04', size: '1.1 MB' }
            ], { noBackup: true })
          ] },

          { id: 'drive_d', name: t('fs.driveD'), type: 'drive', icon: 'driveTv', pathName: 'D:\\', free: t('fs.freeD'), children: [
            mpg('t1', 'CH12_2003-09-01_0200.mpg', 't_signoff', '2003-09-01 02:04', '3.1 GB'),
            mpg('t2', 'CH12_2003-09-16_0333.mpg', 't_return', '2003-09-16 03:58', '4.4 GB'),
            mpg('t3', 'CH12_2003-09-22_0333.mpg', 't_host', '2003-09-22 03:58', '4.4 GB'),
            mpg('t4', 'CH12_2003-09-30_0333.mpg', 't_eas', '2003-09-30 03:58', '4.4 GB'),
            mpg('t5', 'CH12_2003-10-09_0333.mpg', 't_outside', '2003-10-09 03:58', '4.4 GB'),
            mpg('t6', 'CH12_2003-10-14_0333.mpg', 't_inside', '2003-10-14 03:58', '4.4 GB'),
            mpg('t7', 'CH12_LIVE.mpg', 't_live', 'TODAY 03:33', '∞', { show: lvl(3) })
          ] },

          { id: 'drive_e', name: t('fs.driveE'), type: 'drive', icon: 'usb', driveType: 'type.removable', pathName: 'E:\\', free: t('fs.freeE'), children: [
            { id: 'e_pics', name: t('file.e_pics'), type: 'file', kind: 'mbk', icon: 'backup', size: '1.1 MB', date: 'NOW', show: (s) => !!s.backups.pics },
            { id: 'e_docs', name: t('file.e_docs'), type: 'file', kind: 'mbk', icon: 'backup', size: '96 KB', date: 'NOW', show: (s) => !!s.backups.docs },
            { id: 'e_mail', name: t('file.e_mail'), type: 'file', kind: 'mbk', icon: 'backup', size: '64 KB', date: 'NOW', show: (s) => !!s.backups.mail },
            { id: 'e_log', name: 'backup.log', type: 'file', kind: 'txt', doc: 'backupLog', size: '1 KB', date: 'NOW', show: (s) => Object.keys(s.backups).length > 0 }
          ] }
        ] },

        // ---------------- recycle bin ----------------
        { id: 'recycle', name: t('fs.recycle'), type: 'special', pathName: t('fs.recycle'), icon: 'binFull', children: [] },
        txt('r_tapenotes', t('file.tapenotes'), 'tapeNotes', '2003-09-23 05:02', '1 KB', { bin: 'station' }),
        jpg('r_dsc', 'DSC_0013.jpg', 'DSC_0013.jpg', '2003-10-09 03:41', '71 KB', { bin: 'mypics' }),
        txt('r_untitled', t('file.untitled'), 'untitled', '2003-10-13 03:34', '1 KB', { bin: 'personal' })
      ]
    };

    G.fs.init(tree);
  };

  // Text of a document node: pack key 'doc.<id>' (string, or function of state).
  G.docText = function (node) {
    if (!node) return '';
    if (node.doc === 'backupLog') return G.backupLog(G.state);
    const d = node.doc ? G.t('doc.' + node.doc) : node.text;
    return G.util.fill(d || '');
  };

  // A backup log that grows as the player backs things up.
  G.backupLog = (s) => {
    const lines = [t('bklog.title'), '-------------------------------'];
    if (s.backups.pics) lines.push(t('bklog.pics') + (s.flags.picsSkipped ? '   ' + t('bklog.skipped') : ''));
    if (s.backups.docs) lines.push(t('bklog.docs'));
    if (s.backups.mail) lines.push(t('bklog.mail'));
    if (s.level >= 3) lines.push(t('bklog.tapes'));
    return lines.join('\n');
  };

  // Rebuild everything that depends on the language.
  G.buildContent = function () {
    G.buildFS();
  };
})(window.G);
