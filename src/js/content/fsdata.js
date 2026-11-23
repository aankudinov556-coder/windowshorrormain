// The file tree of Daniel Mercer's computer.
(function (G) {
  'use strict';

  const lvl = (n) => (s) => s.level >= n;
  const txt = (id, name, doc, date, size, extra) => Object.assign({ id, name, type: 'file', kind: name.toLowerCase().endsWith('.log') ? 'log' : name.toLowerCase().endsWith('.ini') ? 'ini' : 'txt', doc, date, size: size || '1 KB' }, extra || {});
  const jpg = (id, name, src, date, size, extra) => Object.assign({ id, name, type: 'file', kind: 'jpg', src: 'assets/img/' + src, date, size: size || '84 KB' }, extra || {});
  const mpg = (id, name, tape, date, size, extra) => Object.assign({ id, name, type: 'file', kind: 'mpg', tape, date, size }, extra || {});
  const dir = (id, name, children, extra) => Object.assign({ id, name, type: 'dir', children }, extra || {});

  const tree = {
    id: 'root', name: 'Desktop', type: 'special', pathName: 'Desktop', children: [

      // ---------------- desktop ----------------
      { id: 'desktop', name: 'Desktop', type: 'special', pathName: 'Desktop', icon: 'computer', children: [
        { id: 'd_mycomputer', name: 'My Computer', type: 'file', kind: 'lnk', target: 'mycomputer', icon: 'computer', label: (s) => (s.level >= 3 ? 'Our Computer' : 'My Computer') },
        { id: 'd_mydocs', name: 'My Documents', type: 'file', kind: 'lnk', target: 'mydocs', icon: 'docs', label: (s) => (s.level >= 3 ? 'Our Documents' : 'My Documents') },
        { id: 'd_recycle', name: 'Recycle Bin', type: 'file', kind: 'lnk', target: 'recycle', icon: () => (G.fs.children(G.fs.byId('recycle')).length ? 'binFull' : 'binEmpty'), label: (s) => (s.level >= 3 ? 'Recycle Bin (guests)' : 'Recycle Bin') },
        { id: 'd_mail', name: 'Meridian Mail', type: 'file', kind: 'app', app: 'mail', icon: 'mail', shortcut: true },
        { id: 'd_tv', name: 'Meridian TV', type: 'file', kind: 'app', app: 'tv', icon: (s) => (s.level >= 3 ? 'tvLive' : 'tv'), shortcut: true, label: (s) => (s.level >= 3 ? 'Channel 12 (LIVE)' : 'Meridian TV') },
        { id: 'd_backup', name: 'Backup Wizard', type: 'file', kind: 'app', app: 'backup', icon: 'backup', shortcut: true },
        txt('f_readme', 'READ_ME_FIRST.txt', 'readme', '11/21/2026 6:12 PM', '2 KB'),
        txt('f_guestlist', 'GUEST_LIST.txt', 'guestList', '10/14/2003 3:33 AM', '1 KB', { show: lvl(3) }),
        txt('f_goodnight', 'GOODNIGHT.txt', 'goodnight', '10/14/2003 3:33 AM', '1 KB', { show: lvl(4) }),
        { id: 'd_txctl', name: 'TXCTL', type: 'file', kind: 'app', app: 'cmd', appArgs: { run: 'txctl' }, icon: 'cmd', shortcut: true, show: lvl(4) }
      ] },

      // ---------------- my computer ----------------
      { id: 'mycomputer', name: 'My Computer', type: 'special', pathName: 'My Computer', icon: 'computer', label: (s) => (s.level >= 3 ? 'Our Computer' : 'My Computer'), children: [
        { id: 'drive_a', name: '3½ Floppy (A:)', type: 'drive', icon: 'floppy', driveType: '3½-Inch Floppy Disk', pathName: 'A:\\', children: [],
          onOpen: () => { G.dialogs.msg({ title: 'A:\\', icon: 'error', text: 'A:\\ is not accessible.\n\nThe device is not ready.' }); return false; } },

        { id: 'drive_c', name: 'Local Disk (C:)', type: 'drive', icon: 'drive', pathName: 'C:\\', free: '1.2 GB free of 40.0 GB', children: [
          dir('c_docset', 'Documents and Settings', [
            dir('c_daniel', 'Daniel', [
              dir('mydocs', 'My Documents', [
                dir('mypics', 'My Pictures', [
                  jpg('p_picnic', 'family_picnic_2001.jpg', 'family_picnic_2001.jpg', '6/17/2001 2:14 PM', '96 KB'),
                  jpg('p_bday', 'lily_birthday_8.jpg', 'lily_birthday_8.jpg', '3/9/2002 6:40 PM', '88 KB'),
                  jpg('p_xmas', 'christmas_2002.jpg', 'christmas_2002.jpg', '12/25/2002 8:02 AM', '91 KB'),
                  jpg('p_lake', 'lake_fishing.jpg', 'lake_fishing.jpg', '7/4/2003 7:31 AM', '102 KB'),
                  jpg('p_tower', 'pell_hill_tower.jpg', 'pell_hill_tower.jpg', '8/11/2003 5:55 PM', '77 KB'),
                  jpg('p_control', 'station_control_room.jpg', 'station_control_room.jpg', '8/30/2003 1:12 AM', '70 KB'),
                  jpg('p_staff', 'ch12_staff_2003.jpg', (s) => (s.level >= 3 ? 'ch12_staff_2003_b.jpg' : 'ch12_staff_2003.jpg'), '9/5/2003 4:00 PM', '110 KB'),
                  jpg('p_moon', 'lily_moon_costume.jpg', 'lily_moon_costume.jpg', '10/12/2003 6:21 PM', '93 KB'),
                  jpg('p_0047', 'IMG_0047.jpg', 'IMG_0047.jpg', '10/14/2003 3:33 AM', '64 KB', { show: lvl(1) })
                ], { icon: 'pics' }),
                dir('mymusic', 'My Music', [], { icon: 'music', emptyText: 'This folder is empty.' }),
                dir('station', 'Station', [
                  txt('f_schedule', 'schedule_oct2003.txt', 'schedule', '9/30/2003 11:02 AM'),
                  txt('f_procedure', 'SIGNOFF_PROCEDURE.txt', 'procedure', '9/25/2003 4:48 AM', '2 KB'),
                  dir('engineering', 'Engineering', [
                    txt('f_englog', 'engineering_log.txt', 'englog', '10/14/2003 3:31 AM', '4 KB'),
                    txt('f_bearing', 'walt_bearing.txt', 'bearing', '9/20/2003 6:10 AM'),
                    txt('f_returnnotes', 'return_signal_notes.txt', 'returnNotes', '10/2/2003 5:17 AM'),
                    dir('frames', 'frame_captures', [
                      jpg('p_f233', 'frame_0233.jpg', 'frame_0233.jpg', '9/23/2003 4:40 AM', '22 KB'),
                      jpg('p_f234', 'frame_0234.jpg', 'frame_0234.jpg', '9/23/2003 4:40 AM', '22 KB'),
                      jpg('p_f237', 'frame_0237.jpg', 'frame_0237.jpg', '9/23/2003 4:41 AM', '23 KB')
                    ])
                  ], { locked: '20525' })
                ]),
                dir('personal', 'Personal', [
                  txt('f_todo', 'todo.txt', 'todo', '10/13/2003 11:50 PM'),
                  txt('f_letter', 'letter_to_lily.txt', 'letter', '10/12/2003 2:14 AM'),
                  txt('f_budget', 'budget_oct2003.txt', 'budget', '10/1/2003 9:00 PM'),
                  txt('f_dreams', 'dreams.txt', 'dreams', '10/8/2003 4:44 AM'),
                  txt('f_chili', 'chili.txt', 'chili', '1/19/2003 3:30 PM'),
                  txt('f_program', 'play_program.txt', 'program', '10/6/2003 7:15 PM')
                ]),
                txt('f_readmeviewer', 'README_VIEWER.txt', 'readmeViewer', '{DATE} 3:33 AM', '1 KB', { show: lvl(2) })
              ], { icon: 'docs', addr: 'My Documents' }),
              dir('c_favorites', 'Favorites', [], { emptyText: 'This folder is empty.', noBackup: true })
            ]),
            dir('c_allusers', 'All Users', [], { emptyText: 'This folder is empty.' })
          ]),
          dir('c_progs', 'Program Files', [
            dir('c_burrell', 'Burrell Broadcast', [
              dir('c_txctl', 'TXCTL', [
                { id: 'f_txctl_exe', name: 'txctl.exe', type: 'file', kind: 'app', app: 'cmd', appArgs: { run: 'txctl' }, icon: 'cmd', date: '3/2/1998 12:00 PM', size: '88 KB' },
                txt('f_txctl_readme', 'README.TXT', 'txctl', '10/11/2003 11:40 PM', '2 KB')
              ])
            ]),
            dir('c_mtv', 'Meridian TV', [
              { id: 'f_mtv_exe', name: 'mtv.exe', type: 'file', kind: 'app', app: 'tv', icon: 'tv', date: '6/2/2002 7:22 PM', size: '1.4 MB' },
              { id: 'f_mtvsched', name: 'mtvsched.exe', type: 'file', kind: 'exe', date: '6/2/2002 7:22 PM', size: '212 KB' }
            ]),
            dir('c_mmail', 'Meridian Mail', [
              { id: 'f_mmail_exe', name: 'mmail.exe', type: 'file', kind: 'app', app: 'mail', icon: 'mail', date: '6/2/2002 7:20 PM', size: '980 KB' }
            ])
          ]),
          dir('c_sys', 'MERIDIAN', [
            txt('f_sysini', 'system.ini', 'systemIni', '10/14/2003 3:33 AM'),
            txt('f_setuplog', 'setup.log', 'setupLog', '6/2/2002 7:30 PM'),
            { id: 'f_hostdll', name: 'host.dll', type: 'file', kind: 'dll', date: '{DATE} 3:33 AM', size: '3,333 KB', show: lvl(2), onOpen: () => { G.story.hostProgram(); return false; } },
            { id: 'f_kernel', name: 'kernel.sys', type: 'file', kind: 'sys', date: '6/2/2002 7:04 PM', size: '1.1 MB' }
          ], { noBackup: true })
        ] },

        { id: 'drive_d', name: 'TV Capture (D:)', type: 'drive', icon: 'driveTv', pathName: 'D:\\', free: '0 bytes free of 40.0 GB', children: [
          mpg('t1', 'CH12_2003-09-01_0200.mpg', 't_signoff', '9/1/2003 2:04 AM', '3.1 GB'),
          mpg('t2', 'CH12_2003-09-16_0333.mpg', 't_return', '9/16/2003 3:58 AM', '4.4 GB'),
          mpg('t3', 'CH12_2003-09-22_0333.mpg', 't_host', '9/22/2003 3:58 AM', '4.4 GB'),
          mpg('t4', 'CH12_2003-09-30_0333.mpg', 't_eas', '9/30/2003 3:58 AM', '4.4 GB'),
          mpg('t5', 'CH12_2003-10-09_0333.mpg', 't_outside', '10/9/2003 3:58 AM', '4.4 GB'),
          mpg('t6', 'CH12_2003-10-14_0333.mpg', 't_inside', '10/14/2003 3:58 AM', '4.4 GB'),
          mpg('t7', 'CH12_LIVE.mpg', 't_live', '{DATE} 3:33 AM', '∞', { show: lvl(3) })
        ] },

        { id: 'drive_e', name: 'BYTELINE_BKP (E:)', type: 'drive', icon: 'usb', driveType: 'Removable Disk', pathName: 'E:\\', free: '14.2 GB free of 16.0 GB', children: [
          { id: 'e_pics', name: 'Pictures.mbk', type: 'file', kind: 'mbk', icon: 'backup', size: '1.1 MB', date: '{DATE}', show: (s) => !!s.backups.pics },
          { id: 'e_docs', name: 'Documents.mbk', type: 'file', kind: 'mbk', icon: 'backup', size: '96 KB', date: '{DATE}', show: (s) => !!s.backups.docs },
          { id: 'e_mail', name: 'Mail.mbk', type: 'file', kind: 'mbk', icon: 'backup', size: '64 KB', date: '{DATE}', show: (s) => !!s.backups.mail },
          { id: 'e_log', name: 'backup.log', type: 'file', kind: 'txt', doc: 'backupLog', size: '1 KB', date: '{DATE}', show: (s) => Object.keys(s.backups).length > 0 }
        ] }
      ] },

      // ---------------- recycle bin ----------------
      { id: 'recycle', name: 'Recycle Bin', type: 'special', pathName: 'Recycle Bin', icon: 'binFull', children: [] },
      txt('r_tapenotes', 'tape_notes_DO_NOT_WATCH.txt', 'tapeNotes', '9/23/2003 5:02 AM', '1 KB', { bin: 'station' }),
      jpg('r_dsc', 'DSC_0013.jpg', 'DSC_0013.jpg', '10/9/2003 3:41 AM', '71 KB', { bin: 'mypics' }),
      txt('r_untitled', 'untitled.txt', 'untitled', '10/13/2003 3:34 AM', '1 KB', { bin: 'personal' })
    ]
  };

  // A backup log that grows as the player backs things up.
  G.docs.backupLog = (s) => {
    const lines = ['BYTELINE Backup Log — job #4471', '-------------------------------'];
    if (s.backups.pics) lines.push('[OK]   My Pictures      ' + (s.flags.picsSkipped ? '(1 file skipped: IMG_0047.jpg — in use)' : ''));
    if (s.backups.docs) lines.push('[OK]   My Documents');
    if (s.backups.mail) lines.push('[OK]   E-mail');
    if (s.level >= 3) lines.push('[--]   TV Recordings    waiting for you');
    return lines.join('\n');
  };

  G.fs.init(tree);
})(window.G);
