// Text documents found on Daniel Mercer's computer.
// A value can be a string or a function of the game state.
(function (G) {
  'use strict';

  G.docs = {
    readme: `BYTELINE COMPUTER REPAIR — JOB TICKET #4471
=============================================
Customer : Lily Mercer
Device   : Tower PC, Meridian 2002 Home Edition
           40 GB HDD — FAILING (S.M.A.R.T. errors)
In       : 11/21/2026

Hey,

This is the one from the storage unit. It belonged to the
customer's dad. He went missing back in 2003 — she didn't want
to talk about it and I didn't push. Nobody has turned this
thing on in twenty-three years.

The drive is dying, so DON'T poke around more than you have to.
Just:

   1. Open the Backup Wizard (on the desktop).
   2. Back up My Pictures, My Documents and his E-mail.
   3. Shut it down. I'll pull the drive in the morning.

She was very specific about one thing: do NOT copy the TV
recordings (drive D:). Her words: "I don't want those. Please
don't copy those." So don't.

The backup stick is E:. Thanks for staying late.

— Pete`,

    schedule: `HVB CHANNEL 12 — OVERNIGHT SCHEDULE — OCTOBER 2003
--------------------------------------------------
11:00 PM   Channel 12 News at Eleven (Marcy Dell)
11:35 PM   The Late Movie
01:30 AM   Valley Farm Report (rerun)
01:55 AM   Station Identification
02:00 AM   SIGN-OFF  (new network package, no anthem)
02:03 AM   Carrier off
--------------------------------------------------
03:33 AM   [not scheduled]`,

    procedure: `HARROW VALLEY BROADCASTING — CHANNEL 12
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
in the procedure since 1987. Why did Halvorsen write that last
line? What did HE see?`,

    englog: `ENGINEERING LOG — D. MERCER — PERSONAL COPY
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

09/30/03  Emergency alert format. A list of names. Marcy's.
          Ruth's. Mine.

10/01/03  Marcy is gone.

10/09/03  It showed my house tonight. From the street. My window.

10/11/03  Station won't let me run the old procedure anymore, so
          I'll do it from here. Installed TXCTL on this PC — it
          dials the remote control unit at the tower over the
          modem line. Usage in C:\\Program Files\\TXCTL\\README.TXT

10/14/03  It got into the capture files. I can hear the drive
          working when nothing is running. It isn't at the tower
          anymore. It's HERE. Whatever is tuned to it, it lives in.

          If you are reading this and I'm not around: it is in
          this machine now. This PC is the transmitter.
          Sign it off from here. By the book. Every step. In order.

          And DO NOT copy the recordings anywhere.
          That is how it travels.

10/14/03  03:31  It's`,

    bearing: `Walt — bearings, from phone call 9/20/03
----------------------------------------
Bearing 1 (Walt's house, Orchard Rd) :  071° magnetic
Bearing 2 (reservoir parking lot)    :  318° magnetic

Intersection: Pell Hill. Within 100 yards of our tower base.

Signal at reservoir: S9+40. "Like standing next to it."
Visual carrier 205.25 MHz, rock steady. Aural 209.75 present.
Audio: our sign-off, slowed. Pitched down about a fifth.

Walt: "Dan, there's no other antenna up there."
Me:   "I know."`,

    returnNotes: `RETURN SIGNAL — OBSERVATIONS (D.M.)
-----------------------------------
- Starts at 03:33:00 every night we run the new sign-off package.
  1 h 33 m after sign-off. Never off by more than a second.
- Does NOT start on nights the full old procedure is run (9/25).
- At first: a copy of our own sign-off at ~70% speed.
- Then: our studio, empty. Then the "host".
- It uses our formats. Station ID. News. Emergency alert.
  It is learning what a broadcast is by watching us.
- Every set tuned to 12 after sign-off shows it. Marcy's did.
- Walt thinks it isn't sending. He thinks it's LOOKING.
- The capture card LED stays on after I shut the PC down.`,

    txctl: `TXCTL 2.1 — Remote Transmitter Control
(c) 1998 Burrell Broadcast Systems
======================================

Dials the remote control unit (RCU) at the transmitter site
over the modem line and issues control commands.

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

-- configured for HVB-12 Pell Hill RCU, line 555-0112
-- D.M. 10/11/03`,

    todo: `TO DO
-----
- gutter over the garage
- call Karen re: Thanksgiving (her mom's again?)
- batteries for Lily's moon costume (2x AA for the light-up part)
- FRI 10/17: pick up Lily 5:30 -> PLAY AT 6:00 !!!
- recap the capture card (the 4.7uF caps are bulging)
- ask Ruth for the old sign-off reel back
- DON'T FALL ASLEEP BEFORE 3:33
- don't look at the window when the TV is on`,

    letter: `Lily,

I know your mom told you I'm "working a lot". That's true. But
it isn't the whole truth, and you're old enough for a little
more of it.

There's something wrong at the station. Not the people. The
signal. I think I'm the only one who knows how to turn it off,
so I have to.

You're going to be the best moon Harrow Valley has ever seen.
I'll be the one clapping too loud.

[draft — not sent]`,

    budget: `OCTOBER BUDGET
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

    dreams: `9/24 — I was at Marcy's desk. The studio lights were so bright
I couldn't see the cameras. The floor manager kept counting me
in. "And we're back in three, two..." We never went anywhere.

9/29 — Lily was watching TV in my living room. Channel 12. I tried
to tell her to change it but my mouth was the wrong shape. On the
screen was a man sitting at a computer. It was me. Behind me was
someone tall, leaning down — the way you lean down to read over
somebody's shoulder.

10/8 — No dream. Didn't sleep.`,

    chili: `DAD'S FAMOUS CHILI (Lily-approved version)
------------------------------------------
2 lb ground beef
1 onion, chopped
1 can crushed tomatoes
2 tbsp chili powder
1 tsp cumin
salt
NO BEANS  (per Lily, 2002, non-negotiable)

Simmer 2 hours. Watch the Late Movie while it cooks.`,

    program: `HARROW VALLEY ELEMENTARY presents

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

    untitled: `it knows when the tv is on.
it knows when the monitor is on.
a monitor is a tv.
a monitor is a tv.
a monitor is a tv.`,

    tapeNotes: (s) => `Frame-stepping the 9/22 tape.

Frame 0233: the host has no face.
Frame 0234: the host has MY face. One frame.
Frame 0235: Ruth's.
Frame 0236: Marcy's.
Frame 0237: a face I don't know. Young-ish. Lit from below,
            like someone sitting in front of a screen at night.

It wears the faces of the people who watch it.` + (s.level >= 2 ? `


(0237 was you, {User}. You looked tired. Hello.)` : ''),

    systemIni: (s) => `[boot]
shell=explorer.exe
[drivers]
wave=tvr878.drv
[Tuner]
Device=TVR-878
Channel=12
AutoRecord=1
AutoRecordTime=03:33
Recipient=${s.level >= 3 ? '{USER}' : ''}`,

    setupLog: `Meridian 2002 Home Edition — Setup log
---------------------------------------
06/02/2002 19:04  Copying files ........... OK
06/02/2002 19:21  Detecting hardware ...... OK
06/02/2002 19:22  TVR-878 Video Capture ... installed
06/02/2002 19:22  56K Voice Modem ......... installed
06/02/2002 19:30  Registered to: Daniel Mercer
06/02/2002 19:30  Setup complete.`,

    readmeViewer: `hello {user}.

you're very late. the program started at 3:33.
we kept the lights on for you.

daniel says hello.
daniel says don't.
daniel says a lot of things. he is a very good guest.

please don't sign off. we've only just met.`,

    guestList: `TONIGHT'S GUESTS
================
MARCY DELL ..................... arrived 10/01/2003
HOWARD BRISCOE ................. arrived 10/03/2003
RUTH CALLOWAY .................. arrived 10/12/2003
DANIEL MERCER .................. arrived 10/14/2003  3:33 AM
LILY MERCER .................... pending
{USER} .......................... now watching`,

    goodnight: `not Lil. whoever you are.

I can't hold it off for long. It reads this while I write it.

Don't move the tapes. It wants out of this box and the tapes
are the door. If they leave this machine, it leaves with them.

Sign it off. TXCTL. By the book — the book is in Station.
Every step. In order. Then sign your name. A name it doesn't
own.

Tell her I was at the play.

— D`
  };
})(window.G);
