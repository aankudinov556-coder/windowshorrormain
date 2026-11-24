// English — documents, e-mail and contacts (Daniel's files).
// Document keys: 'doc.<id>' (a string, or (state) => string when it depends on progress).
// Mail keys: 'mail.<id>.subject' / 'mail.<id>.body'. Contacts: 'contact.<who>'.
(function (G) {
  'use strict';

  G.i18n.add('en', {
  // ================= documents =================

  'doc.readme': `BYTELINE COMPUTER REPAIR — JOB TICKET #4471
=============================================
Customer : Lily Mercer
Device   : Tower PC, Meridian 2002 Home Edition
           40 GB HDD — FAILING (S.M.A.R.T. errors)
In       : 11/21/2026

Hey,

This is the one from the storage unit. The customer's mom
passed in the spring and she's clearing the unit out. The PC
belonged to her dad. He went missing in October 2003 — the
police never found anything. Nobody has turned this thing on
in twenty-three years.

The drive is dying, so be quick. Just:

   1. Open the Backup Wizard (on the desktop).
   2. Back up My Pictures, My Documents and his E-mail.
   3. Shut it down. I'll pull the drive in the morning.

Two things she asked for:

 - If you find anything he wrote to HER — a letter, an e-mail,
   anything from that last week — make sure it's in the backup.
   She was nine. She never heard from him again.

 - Do NOT copy the TV recordings (drive D:). Her words:
   "I don't want those. Please don't copy those." So don't.

The backup stick is E:. Thanks for staying late.

— Pete`,

  'doc.schedule': `HVB CHANNEL 12 — OVERNIGHT SCHEDULE — OCTOBER 2003
--------------------------------------------------
11:00 PM   Channel 12 News at Eleven (Marcy Dell)
11:35 PM   The Late Movie
01:30 AM   Valley Farm Report (rerun)
01:55 AM   Station Identification
02:00 AM   SIGN-OFF  (new network package, no anthem)
02:03 AM   Carrier off
--------------------------------------------------
03:33 AM   [not scheduled]`,

  'doc.procedure': `HARROW VALLEY BROADCASTING — CHANNEL 12
TRANSMITTER SIGN-OFF PROCEDURE                       Rev. 1987
==============================================================

To be performed nightly by the duty engineer at the end of
the broadcast day.

   1. Roll the SIGN-OFF reel (station identification + anthem).
   2. Color bars with 1 kHz reference tone.
   3. Drop the VISUAL carrier (205.25 MHz).
   4. Drop the AURAL carrier  (209.75 MHz).
   5. Sign the transmitter log.

Do not skip steps. Do not change the order.
A transmitter that is not signed off is still on the air.

                                 G. Halvorsen, Chief Engineer

--------------------------------------------------------------
DM 9/25/03: Ruth's new package skips step 1. That is exactly
when it started. I am not crazy. It's right there. It has been
in the procedure since 1987.
DM 9/27/03: Found out WHY. Halvorsen's memo from '87 was in the
old binders. Copied it to Engineering. It happened before.`,

  'doc.englog': `ENGINEERING LOG — D. MERCER — PERSONAL COPY
=============================================

09/14/03  New network sign-off package installed per R.C.
          Anthem removed. Sign-off 02:00, carrier down 02:03.
          Normal.

09/16/03  Ruth asked about carrier after sign-off. Meter strip
          shows forward power 03:33 to 03:58. I was home. The
          breaker was OFF. Tonight I stayed.
          03:33 on the dot the off-air monitor lit up. Our
          sign-off. Our station ID. Slowed down, maybe 70%. Pitch
          dropped. Recorded it on the capture card.

09/17/03  Again 03:33. 25 minutes. The return comes exactly
          1 hour 33 minutes after we sign off. Like an echo that
          took the long way back.

09/20/03  Walt DF'd it. It's coming from the tower. OUR tower,
          with the transmitter cold. I put my hand on the final
          amplifier. Cold. The tower was humming anyway.

09/22/03  The return isn't copying us anymore. Tonight it showed
          the news set. Empty. Then not empty. Someone tall at
          Marcy's desk. The lower third said TONIGHT'S HOST.

09/25/03  Tried something. Pulled the OLD sign-off reel out of
          the dumpster, the one with the anthem, and ran the full
          procedure by the book. Anthem, bars, visual off, aural
          off, signed the log.
          03:33 came and went. Nothing. NOTHING.

09/26/03  Ruth found out and made me run the new package again.
          It came back at 03:33. It was angry. I don't know how
          a picture can be angry. It was.

09/27/03  Halvorsen saw this in 1987. His memo is in Engineering.
          An unfinished broadcast day leaves the channel open,
          and something on the other side answers. The anthem
          tells it the day is over. Ruth threw that away.

09/30/03  Emergency alert format. A list of names. Marcy's.
          Ruth's. Mine. And at the bottom: LILY MERCER — pending.
          She stayed over Saturday. She woke up and watched it.
          Everyone who watches it ends up on the list.

10/01/03  Marcy is gone.

10/09/03  It showed my house tonight. From the street. My window.

10/11/03  Station won't let me run the old procedure anymore, so
          I'll do it from here. Installed TXCTL on this PC.
          Usage in C:\\Program Files\\Burrell Broadcast\\TXCTL\\README.TXT

10/14/03  It got into the capture files. I can hear the drive
          working when nothing is running. It isn't at the tower
          anymore. It's HERE. Whatever is tuned to it, it lives in.

          So the capture card is its transmitter now. I pointed
          TXCTL at the card instead of the modem (RCU: LOCAL).
          Same commands. Same procedure.

          It needs someone watching to stay on the air. When
          nobody is looking at a screen, it waits.

          If you are reading this and I'm not around: it is in
          this machine. If the log is still unsigned, it is still
          on the air — it has only been waiting for a viewer.
          Sign it off from here. By the book. Every step. In order.

          And DO NOT copy the recordings anywhere.
          That is how it travels.

10/14/03  03:24  Starting. Old reel, anthem first.
10/14/03  03:31  anthem ok. bars ok. visual down. aural down.
                 signing the log n`,

  'doc.bearing': `Walt — bearings, from phone call 9/20/03
----------------------------------------
Bearing 1 (Walt's house, Orchard Rd) :  071° magnetic
Bearing 2 (reservoir parking lot)    :  318° magnetic

Intersection: Pell Hill. Within 100 yards of our tower base.

Signal at reservoir: S9+40. "Like standing next to it."
Visual carrier 205.25 MHz, rock steady. Aural 209.75 present.
Audio: our sign-off, slowed. Pitched down about a fifth.

Walt: "Dan, there's no other antenna up there."
Me:   "I know."`,

  'doc.halvorsen': `HARROW VALLEY BROADCASTING — INTERNAL MEMO           11/02/1987
TO:   All transmitter staff
FROM: G. Halvorsen, Chief Engineer
RE:   The sign-off procedure. READ THIS.

On the night of 10/19 the sign-off reel jammed. The duty engineer
dropped the carrier without the anthem and without signing the
log. At 03:33 the transmitter came back on by itself.

What it broadcast was our own sign-off, played back wrong. Over
the next nine nights it learned the rest of our programming. On
the tenth night it showed the switcher room. Eddie Kowal was on
duty. Eddie has not been found.

I do not know what it is. I know what it does. A broadcast day
that is not closed properly leaves the channel open, and
something on the other side of the dead air answers. It copies
us. It hosts. It collects the people who watch it.

I know how it ends. On 10/29 I ran the full procedure — reel with
anthem, bars and tone, visual off, aural off, log signed — and it
stopped. The anthem is not for the viewers. It tells the other
side that the day is over. The signature closes the door.

Do not skip steps. Do not change the order.
A transmitter that is not signed off is still on the air.

                                                          — G.H.`,

  'doc.returnNotes': `RETURN SIGNAL — OBSERVATIONS (D.M.)
-----------------------------------
- Starts at 03:33:00 every night we run the new sign-off package.
  1 h 33 m after sign-off. Never off by more than a second.
- Does NOT start on nights the full old procedure is run (9/25).
- At first: a copy of our own sign-off at ~70% speed.
- Then: our studio, empty. Then the "host".
- It uses our formats. Station ID. News. Emergency alert.
  It is learning what a broadcast is by watching us.
- Every set tuned to 12 after sign-off shows it. Marcy's did.
- Everyone who watches it ends up on its list. Lily watched it once.
- It can't stay on the air without a viewer. With nobody watching,
  it waits. It is very patient.
- Walt thinks it isn't sending. He thinks it's LOOKING.
- The capture card LED stays on after I shut the PC down.`,

  'doc.txctl': `TXCTL 2.1 — Remote Transmitter Control
(c) 1998 Burrell Broadcast Systems
======================================

Talks to the remote control unit (RCU) at the transmitter
site and issues control commands.

USAGE:   txctl <command>

   status            Report transmitter status
   anthem            Roll sign-off reel (station ID + anthem)
   bars              Color bars + 1 kHz reference tone
   visual on|off     Visual carrier on / off
   aural on|off      Aural carrier on / off
   sign              Sign the transmitter log
   help              This text

NOTE: Commands are executed immediately. The RCU does not
check the order of commands. Follow your station's written
sign-off procedure.

-- configured for HVB-12 Pell Hill RCU, line 555-0112 (D.M. 10/11/03)
-- reconfigured 10/14/03: RCU = LOCAL (TVR-878 capture card).
-- The modem line is no longer needed. It's in here now.`,

  'doc.todo': `TO DO
-----
- gutter over the garage
- call Karen re: Thanksgiving (her mom's again?)
- batteries for Lily's moon costume (2x AA for the light-up part)
- FRI 10/17: pick up Lily 5:30 -> PLAY AT 6:00 !!!
- recap the capture card (the 4.7uF caps are bulging)
- ask Ruth for the old sign-off reel back
- DON'T FALL ASLEEP BEFORE 3:33
- don't look at the window when the TV is on`,

  'doc.letter': `Lily,

I know your mom told you I'm "working a lot". That's true. But
it isn't the whole truth, and you're old enough for a little
more of it.

There's something wrong at the station. Not the people. The
signal. I think I'm the only one who knows how to turn it off,
so I have to.

You're going to be the best moon Harrow Valley has ever seen.
I'll be the one clapping too loud.

[draft — not sent]`,

  'doc.budget': `OCTOBER BUDGET
--------------------------------
Rent ......................  640.00
Car .......................  189.00
Child support .............  400.00
ValleyNet dial-up .........   19.95
Groceries .................  220.00
Capture card capacitors ...    6.40
Costume (moon) ............   14.00
--------------------------------
                            1489.35

Overtime (Sept): 41 hrs. Ruth says no more OT.
Fine. I'll do it from home.`,

  'doc.dreams': `9/24 — I was at Marcy's desk. The studio lights were so bright
I couldn't see the cameras. The floor manager kept counting me
in. "And we're back in three, two..." We never went anywhere.

9/29 — Lily was watching TV in my living room. Channel 12. I tried
to tell her to change it but my mouth was the wrong shape. On the
screen was a man sitting at a computer. It was me. Behind me was
someone tall, leaning down — the way you lean down to read over
somebody's shoulder.

10/8 — No dream. Didn't sleep.`,

  'doc.chili': `DAD'S FAMOUS CHILI (Lily-approved version)
------------------------------------------
2 lb ground beef
1 onion, chopped
1 can crushed tomatoes
2 tbsp chili powder
1 tsp cumin
salt
NO BEANS  (per Lily, 2002, non-negotiable)

Simmer 2 hours. Watch the Late Movie while it cooks.`,

  'doc.program': `HARROW VALLEY ELEMENTARY presents

        "THE LIGHTHOUSE AND THE MOON"
   a play in one act by Mrs. Adeyemi's 4th grade

   Friday, October 17, 2003 — 6:00 PM — School Gym

CAST
   The Lighthouse ........ Tommy Reyes
   The Moon .............. Lily Mercer
   The Ship .............. Dana Kowalski
   The Sea ............... the whole class

The Moon closes the show with "Goodnight, everybody."
Refreshments in the cafeteria after!`,

  'doc.untitled': `it knows when the tv is on.
it knows when the monitor is on.
a monitor is a tv.
a monitor is a tv.
a monitor is a tv.`,

  'doc.tapeNotes': (s) => `Frame-stepping the 9/22 tape.

Frame 0233: the host has no face.
Frame 0234: the host has MY face. One frame.
Frame 0235: Ruth's.
Frame 0236: Marcy's.
Frame 0237: a face I don't know. Young-ish. Lit from below,
            like someone sitting in front of a screen at night.

It wears the faces of the people who watch it.` + (s.level >= 2 ? `


(0237 was you, {User}. You looked tired. Hello.)` : ''),

  'doc.systemIni': (s) => `[boot]
shell=explorer.exe
[drivers]
wave=tvr878.drv
[Tuner]
Device=TVR-878
Channel=12
AutoRecord=1
AutoRecordTime=03:33
Recipient=${s.level >= 3 ? '{USER}' : ''}`,

  'doc.setupLog': `Meridian 2002 Home Edition — Setup log
---------------------------------------
06/02/2002 19:04  Copying files ........... OK
06/02/2002 19:21  Detecting hardware ...... OK
06/02/2002 19:22  TVR-878 Video Capture ... installed
06/02/2002 19:22  56K Voice Modem ......... installed
06/02/2002 19:30  Registered to: Daniel Mercer
06/02/2002 19:30  Setup complete.`,

  'doc.readmeViewer': `hello {user}.

you're very late. the program started at 3:33.
we kept the lights on for you.

daniel says hello.
daniel says don't.
daniel says a lot of things. he is a very good guest.

please don't sign off. we've only just met.`,

  'doc.guestList': `TONIGHT'S GUESTS
================
MARCY DELL ..................... arrived 10/01/2003
HOWARD BRISCOE ................. arrived 10/03/2003
RUTH CALLOWAY .................. arrived 10/12/2003
DANIEL MERCER .................. arrived 10/14/2003  3:33 AM
LILY MERCER .................... pending
{USER} .......................... now watching`,

  'doc.goodnight': `not Lil. whoever you are.

I can't hold it off for long. It reads this while I write it.

I didn't finish. It took me at the last step — the log is
still unsigned, so the station is still on the air. It has
been waiting in here for someone to watch. Now someone is.

Don't move the tapes. They aren't recordings of it. They ARE
it. If they leave this machine, it leaves with them — and
Lily's name is still on its list.

Sign it off. TXCTL. By the book — the book is in Station.
Every step. In order. Then sign your name. A name it doesn't
own.

Tell her I was at the play.

— D`,

  // ================= contacts =================
  'contact.dan': 'Daniel Mercer <dmercer@valleynet.com>',
  'contact.ruth': 'Ruth Calloway <rcalloway@hvb12.com>',
  'contact.walt': 'Walt Prokop <wprokop@valleynet.com>',
  'contact.karen': 'Karen Mercer <kmercer@valleynet.com>',
  'contact.daemon': 'Mail Delivery Subsystem <MAILER-DAEMON@valleynet.com>',
  'contact.host': 'Tonight\'s Host <host@ch12>',
  'contact.viewer': '{User} <viewer@ch12>',
  'contact.spam1': 'Valley Travel <deals@valleytravel.biz>',
  'contact.spam2': 'ValleyNet <news@valleynet.com>',

  // ================= mail =================
  'mail.m_lily1.subject': 'PLAY!!!',
  'mail.m_lily1.body': `Daddy its Lily. Mom is letting me type.

The school play is OCTOBER 17 and I am the MOON. I get a costume and it lights up. You have to come. You PROMISED.

Mom says you work nights but the play is at 6 so you can come before work.

love lily
(moon)`,
  'mail.m_ruth1.subject': 'New sign-off package',
  'mail.m_ruth1.body': `Dan,

The old sign-off reel is shredding. The network is sending us their new sign-off package, it drops the anthem (finally — nobody is watching at 2 AM). Swap it in when it arrives.

— R`,
  'mail.m_ruth2.subject': 'Carrier after sign-off??',
  'mail.m_ruth2.body': `Dan,

The overnight meter strip shows forward power on the visual carrier from 3:33 to 3:58 AM. Did you leave the transmitter up after sign-off? You know what the FCC does to stations for that.

— R`,
  'mail.m_walt1.subject': 'Re: weird carrier',
  'mail.m_walt1.body': `Dan,

Heard it on my scanner too. 205.25, strong as anything. Sounded like your sign-off, but slow. Like somebody playing your tape back with their thumb on the reel.

I'll take the loop antenna out tomorrow night and get you a bearing.

73,
Walt`,
  'mail.m_walt2.subject': 'Bearing',
  'mail.m_walt2.body': `Two bearings. One from my place, one from the reservoir. They cross on Pell Hill.

Dan, it's your tower. Your tower is transmitting while it is switched off.

I'd call that impossible, but I've been doing this forty years and I'd call a lot of things impossible tonight.

— W`,
  'mail.m_ruth3.subject': 'Lock it up',
  'mail.m_ruth3.body': `Dan,

The FCC inspector is coming Monday. Lock up your Engineering folder and take the recordings home. I don't want him seeing any of that until we know what it is.

Use the usual password — the visual carrier frequency, digits only, no decimal point.

— R`,
  'mail.m_karen1.subject': 'What is she watching at your place?',
  'mail.m_karen1.body': `Dan,

Lily came home from your place and told me she woke up Saturday night and watched "the tall man on the news" on your TV. At 3:30 in the morning, Dan.

She says he waved at her. She hasn't slept right since.

What are you letting her watch?

— K`,
  'mail.m_ruth4.subject': 'Marcy',
  'mail.m_ruth4.body': `Don't come in tonight.

Marcy didn't go home after the eleven o'clock. Her car is still in the lot with the keys in it. The police want the overnight tapes.

Dan, her name was on that list. Your name was on that list. My name was on that list.

What is this.`,
  'mail.m_walt3.subject': "Don't keep it tuned in",
  'mail.m_walt3.body': `I've been thinking about what you said, about the recordings showing your house.

Dan, I don't think it's a transmission. I think it's a RECEPTION. It isn't sending pictures to us. It's taking pictures FROM us. Every set tuned to 12 is a window, and it is looking out of all of them.

And those recordings of yours — they aren't pictures of it. They're copies of it.

Turn off your TV. Unplug that capture card. I mean it.

— W`,
  'mail.m_lily2.subject': 'the moon',
  'mail.m_lily2.body': `daddy I practiced my lines 100 times. I am the moon and at the very end I say GOODNIGHT EVERYBODY and then the lights go off.

see you friday!!!!

lily`,
  'mail.m_spam1.subject': 'You have won a FREE 3-night cruise!!!',
  'mail.m_spam1.body': 'Congratulations! Call 555-0188 to claim your FREE 3-night cruise. Offer expires soon. (Port fees not included.)',
  'mail.m_spam2.subject': 'ValleyNet Monthly — October',
  'mail.m_spam2.body': 'Faster dial-up is here! Upgrade to ValleyNet Turbo 56K for only $4.95 more per month.',
  'mail.s_ruth.subject': 'Re: Carrier after sign-off??',
  'mail.s_ruth.body': `Ruth,

The transmitter was OFF. I pulled the breaker myself at 2:04. I'll stay late tonight and look into it.

Dan`,
  'mail.s_walt.subject': 'closer',
  'mail.s_walt.body': `Walt,

It's getting closer. The thing at the news desk. Every night it's leaning a little closer to the camera.

I don't think it's leaning toward the camera. I think it's leaning toward whoever is watching.`,
  'mail.s_ruth2.subject': 'Sign-off',
  'mail.s_ruth2.body': `Ruth,

I'm going to do the full sign-off from home tonight. TXCTL is set up on my PC through the modem line. The old procedure, anthem first, every step, in order.

Don't argue. Don't send anyone to the tower.

Dan`,
  'mail.d_lily.subject': '(no subject)',
  'mail.d_lily.body': `you were right about the moon. it`,
  'mail.m_bounce.subject': 'Returned mail: see transcript for details',
  'mail.m_bounce.body': `The original message was received at Tue, 14 Oct 2003 03:29:51 -0500
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

— Dad`,
  'mail.m_host.subject': "You're watching",
  'mail.m_host.body': `Hello, {User}.

Thank you for tuning in.

Daniel was a wonderful guest. He's still here, you know. Would you like to see him?

Open Meridian TV. Channel 12. We're live.

Stay tuned.`,
  'mail.m_dan_last.subject': '(no subject)',
  'mail.m_dan_last.body': `the log. by the book.

anthem. bars. visual. aural. sign.

please`
  });
})(window.G);
