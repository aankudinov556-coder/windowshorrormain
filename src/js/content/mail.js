// Daniel's mailbox (Meridian Mail, offline since 2003).
// Only structure lives here; senders, subjects and bodies come from the
// language pack: 'contact.<who>', 'mail.<id>.subject', 'mail.<id>.body'.
// Messages flagged `late` only appear once the story delivers them.
(function (G) {
  'use strict';

  const c = (who) => () => G.t('contact.' + who);

  const MAIL = [
    { id: 'm_lily1', folder: 'inbox', from: 'karen', to: 'dan', date: '2003-09-02 19:12' },
    { id: 'm_ruth1', folder: 'inbox', from: 'ruth', to: 'dan', date: '2003-09-12 10:40' },
    { id: 'm_ruth2', folder: 'inbox', from: 'ruth', to: 'dan', date: '2003-09-16 08:05' },
    { id: 'm_walt1', folder: 'inbox', from: 'walt', to: 'dan', date: '2003-09-17 04:20' },
    { id: 'm_walt2', folder: 'inbox', from: 'walt', to: 'dan', date: '2003-09-20 05:02' },
    { id: 'm_ruth3', folder: 'inbox', from: 'ruth', to: 'dan', date: '2003-09-23 09:15' },
    { id: 'm_ruth4', folder: 'inbox', from: 'ruth', to: 'dan', date: '2003-10-01 06:48' },
    { id: 'm_walt3', folder: 'inbox', from: 'walt', to: 'dan', date: '2003-10-10 02:51' },
    { id: 'm_lily2', folder: 'inbox', from: 'karen', to: 'dan', date: '2003-10-13 20:30' },
    { id: 'm_spam1', folder: 'deleted', from: 'spam1', to: 'dan', date: '2003-09-08 13:00' },
    { id: 'm_spam2', folder: 'deleted', from: 'spam2', to: 'dan', date: '2003-10-01 06:00' },
    { id: 's_ruth', folder: 'sent', from: 'dan', to: 'ruth', date: '2003-09-16 08:31' },
    { id: 's_walt', folder: 'sent', from: 'dan', to: 'walt', date: '2003-10-07 04:12' },
    { id: 's_ruth2', folder: 'sent', from: 'dan', to: 'ruth', date: '2003-10-11 23:58' },
    { id: 'd_lily', folder: 'drafts', from: 'dan', to: 'karen', date: '2003-10-14 03:27' },
    // ---------- late deliveries ----------
    { id: 'm_bounce', folder: 'inbox', late: true, from: 'daemon', to: 'dan', date: 'NOW' },
    { id: 'm_host', folder: 'inbox', late: true, from: 'host', to: 'viewer', date: 'TODAY 03:33' },
    { id: 'm_dan_last', folder: 'inbox', late: true, from: 'dan', to: 'viewer', date: '2003-10-14 03:33' }
  ];

  G.mail = MAIL.map((m) => Object.assign({}, m, {
    from: c(m.from),
    to: c(m.to),
    subject: () => G.t('mail.' + m.id + '.subject'),
    body: () => G.t('mail.' + m.id + '.body')
  }));
})(window.G);
