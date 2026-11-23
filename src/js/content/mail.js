// Daniel's mailbox (Meridian Mail, offline since 2003).
// Messages flagged `late` only appear once the story delivers them.
(function (G) {
  'use strict';

  const DAN = 'Daniel Mercer <dmercer@valleynet.com>';
  const RUTH = 'Ruth Calloway <rcalloway@hvb12.com>';
  const WALT = 'Walt Prokop <wprokop@valleynet.com>';
  const LILY = 'Karen Mercer <kmercer@valleynet.com>';

  G.mail = [
    { id: 'm_lily1', folder: 'inbox', from: LILY, to: DAN, date: '9/2/2003 7:12 PM', subject: 'PLAY!!!',
      body: `Daddy its Lily. Mom is letting me type.

The school play is OCTOBER 17 and I am the MOON. I get a costume and it lights up. You have to come. You PROMISED.

Mom says you work nights but the play is at 6 so you can come before work.

love lily
(moon)` },

    { id: 'm_ruth1', folder: 'inbox', from: RUTH, to: DAN, date: '9/12/2003 10:40 AM', subject: 'New sign-off package',
      body: `Dan,

The old sign-off reel is shredding. The network is sending us their new sign-off package, it drops the anthem (finally — nobody is watching at 2 AM). Swap it in when it arrives.

— R` },

    { id: 'm_ruth2', folder: 'inbox', from: RUTH, to: DAN, date: '9/16/2003 8:05 AM', subject: 'Carrier after sign-off??',
      body: `Dan,

The overnight meter strip shows forward power on the visual carrier from 3:33 to 3:58 AM. Did you leave the transmitter up after sign-off? You know what the FCC does to stations for that.

— R` },

    { id: 'm_walt1', folder: 'inbox', from: WALT, to: DAN, date: '9/17/2003 4:20 AM', subject: 'Re: weird carrier',
      body: `Dan,

Heard it on my scanner too. 205.25, strong as anything. Sounded like your sign-off, but slow. Like somebody playing your tape back with their thumb on the reel.

I'll take the loop antenna out tomorrow night and get you a bearing.

73,
Walt` },

    { id: 'm_walt2', folder: 'inbox', from: WALT, to: DAN, date: '9/20/2003 5:02 AM', subject: 'Bearing',
      body: `Two bearings. One from my place, one from the reservoir. They cross on Pell Hill.

Dan, it's your tower. Your tower is transmitting while it is switched off.

I'd call that impossible, but I've been doing this forty years and I'd call a lot of things impossible tonight.

— W` },

    { id: 'm_ruth3', folder: 'inbox', from: RUTH, to: DAN, date: '9/23/2003 9:15 AM', subject: 'Lock it up',
      body: `Dan,

The FCC inspector is coming Monday. Lock up your Engineering folder and take the recordings home. I don't want him seeing any of that until we know what it is.

Use the usual password — the visual carrier frequency, digits only, no decimal point.

— R` },

    { id: 'm_ruth4', folder: 'inbox', from: RUTH, to: DAN, date: '10/1/2003 6:48 AM', subject: 'Marcy',
      body: `Don't come in tonight.

Marcy didn't go home after the eleven o'clock. Her car is still in the lot with the keys in it. The police want the overnight tapes.

Dan, her name was on that list. Your name was on that list. My name was on that list.

What is this.` },

    { id: 'm_walt3', folder: 'inbox', from: WALT, to: DAN, date: '10/10/2003 2:51 AM', subject: "Don't keep it tuned in",
      body: `I've been thinking about what you said, about the recordings showing your house.

Dan, I don't think it's a transmission. I think it's a RECEPTION. It isn't sending pictures to us. It's taking pictures FROM us. Every set tuned to 12 is a window, and it is looking out of all of them.

Turn off your TV. Unplug that capture card. I mean it.

— W` },

    { id: 'm_lily2', folder: 'inbox', from: LILY, to: DAN, date: '10/13/2003 8:30 PM', subject: 'the moon',
      body: `daddy I practiced my lines 100 times. I am the moon and at the very end I say GOODNIGHT EVERYBODY and then the lights go off.

see you friday!!!!

lily` },

    { id: 'm_spam1', folder: 'deleted', from: 'Valley Travel <deals@valleytravel.biz>', to: DAN, date: '9/8/2003 1:00 PM', subject: 'You have won a FREE 3-night cruise!!!',
      body: 'Congratulations! Call 555-0188 to claim your FREE 3-night cruise. Offer expires soon. (Port fees not included.)' },
    { id: 'm_spam2', folder: 'deleted', from: 'ValleyNet <news@valleynet.com>', to: DAN, date: '10/1/2003 6:00 AM', subject: 'ValleyNet Monthly — October',
      body: 'Faster dial-up is here! Upgrade to ValleyNet Turbo 56K for only $4.95 more per month.' },

    { id: 's_ruth', folder: 'sent', from: DAN, to: RUTH, date: '9/16/2003 8:31 AM', subject: 'Re: Carrier after sign-off??',
      body: `Ruth,

The transmitter was OFF. I pulled the breaker myself at 2:04. I'll stay late tonight and look into it.

Dan` },
    { id: 's_walt', folder: 'sent', from: DAN, to: WALT, date: '10/7/2003 4:12 AM', subject: 'closer',
      body: `Walt,

It's getting closer. The thing at the news desk. Every night it's leaning a little closer to the camera.

I don't think it's leaning toward the camera. I think it's leaning toward whoever is watching.` },
    { id: 's_ruth2', folder: 'sent', from: DAN, to: RUTH, date: '10/11/2003 11:58 PM', subject: 'Sign-off',
      body: `Ruth,

I'm going to do the full sign-off from home tonight. TXCTL is set up on my PC through the modem line. The old procedure, anthem first, every step, in order.

Don't argue. Don't send anyone to the tower.

Dan` },

    { id: 'd_lily', folder: 'drafts', from: DAN, to: LILY, date: '10/14/2003 3:27 AM', subject: '(no subject)',
      body: `you were right about the moon. it` },

    // ---------- late deliveries ----------
    { id: 'm_bounce', folder: 'inbox', late: true, from: 'Mail Delivery Subsystem <MAILER-DAEMON@valleynet.com>', to: DAN, date: () => G.util.fmtDate(new Date()) + ' ' + G.util.fmtClock(new Date()), subject: 'Returned mail: see transcript for details',
      body: `The original message was received at Tue, 14 Oct 2003 03:29:51 -0500
----- The following addresses had permanent fatal errors -----
<kmercer@valleynet.com>
    (reason: 550 Host unknown)

----- Original message follows -----
From: Daniel Mercer <dmercer@valleynet.com>
To: kmercer@valleynet.com
Subject: for Lily

Lil,

I'm sorry. I don't think I can make it Friday. I need you to know it isn't because of you.

There's something I have to turn off, and I have to do it the right way, the way it's written down, or it won't stay off.

If you ever get this computer: don't watch the tapes. Don't copy them anywhere. Just look at the pictures.

You're the moon, kiddo. Goodnight, everybody.

— Dad` },

    { id: 'm_host', folder: 'inbox', late: true, from: 'Tonight\'s Host <host@ch12>', to: () => G.userName + ' <viewer@ch12>', date: () => G.util.fmtDate(new Date()) + ' 3:33 AM', subject: "You're watching",
      body: `Hello, {User}.

Thank you for tuning in.

Daniel was a wonderful guest. He's still here, you know. Would you like to see him?

Open Meridian TV. Channel 12. We're live.

Stay tuned.` },

    { id: 'm_dan_last', folder: 'inbox', late: true, from: DAN, to: () => G.userName, date: () => '10/14/2003 3:33 AM', subject: '(no subject)',
      body: `the log. by the book.

anthem. bars. visual. aural. sign.

please` }
  ];
})(window.G);
