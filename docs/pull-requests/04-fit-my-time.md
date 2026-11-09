## Story

As Pascal the Professor, I want to tell the app how many minutes I have before class, so that I can get a practice round that ends before the bell without doing the math myself.

This is backlog story 2 ("Choose a duration") in `Product Brief/stories.md`. Before this change, Pascal had to choose Untimed, 1, 5 or 10 min himself. If he had 4 minutes and tapped 5 min, the round ran past the start of class.

## Scenarios

**1. Time falls between the options**
- Given the timer options are 1, 5 and 10 minutes
- And Pascal has 4 minutes before class
- When he tells the app he has 4 minutes
- Then the app chooses the 1-minute round
- And it explains that 5 minutes would run past the bell

**2. More time than the longest round**
- Given Pascal has 12 minutes before class
- When he tells the app he has 12 minutes
- Then the app chooses the 10-minute round, with no warning

**3. Not enough time for any timed round (goes wrong)**
- Given Pascal has chosen a 5-minute round
- And he has only half a minute before class
- When he tells the app he has 0.5 minutes
- Then no timed round is chosen; practice switches to Untimed so he can stop anytime
- And the app says even a 1-minute round would run past the bell

**4. Minutes that aren't a number (goes wrong)**
- Given Pascal has chosen a 5-minute round
- When he types "four" instead of a number
- Then the app asks him to type the minutes as a number
- And his 5-minute round is left as it was

**5. Starting without tapping Fit my time (goes wrong; added after review)**
- Given Pascal has chosen a 5-minute round
- And he types 4 in Minutes until class
- When he starts practice without tapping Fit my time
- Then a 1-minute round starts, not a 5-minute one

## What changed

The practice setup screen has a new "Minutes until class" box with a **Fit my time** button (Enter, or tapping Start practice, works too). The app picks the longest timer that ends in time, shows one line saying why, and falls back to Untimed when even 1 minute won't fit. Choosing a timer by hand clears the box and the message. Only `app.js` and `style.css` changed; nothing new is saved.

## What the AI got wrong, and how I caught it

The AI made picking a timer by hand clear the "fits your time" message, but it left the old number in the box. So after Scenario 3, if I then tapped 5 min, the screen said "Minutes until class: 0.5" next to a selected 5-minute round with no warning. That is exactly the overrun this story is supposed to prevent, and the code looked fine at a glance because the message did go away.

I caught it while running Scenario 3 by hand. After seeing the Untimed warning, I tapped 5 min to set up Scenario 4 and noticed the stale "0.5" still in the box. **Fix (code, not scenario):** picking a timer by hand now clears the box as well as the message. I ran Scenario 3 again after the fix (0.5 → Untimed with the warning; then tapping 5 min leaves an empty box showing "e.g. 4"), and ran Scenario 2 after it.

| Before the fix | After the fix |
|---|---|
| <img src="04-fit-my-time/before-fix-stale-minutes.jpg" alt="Before the fix: 0.5 still in the box with 5 min selected and no warning" width="160"> | <img src="04-fit-my-time/after-fix-field-cleared.jpg" alt="After the fix: box cleared when 5 min is picked by hand" width="160"> |

## Scenario results

All four were run by clicking and typing in the app at phone size (375 × 812) in Research Seminar (Section D), starting from Moderator controls → Reset all progress.

| # | Result | What I did | What I expected | What happened |
|---|---|---|---|---|
| 1 | **Pass** | Typed 4, tapped Fit my time, then Start practice | 1 min chosen, a note that 5 min would run past the bell, a 1-minute round | "1 min fits your 4 min. 5 min would run past the bell." 1 min highlighted. The round opened at "1:00 left". |
| 2 | **Pass** | Typed 12, tapped Fit my time | 10 min chosen, no warning | "10 min fits your 12 min." in green, 10 min highlighted. |
| 3 | **Fail, then pass after a code fix** | Picked 5 min, typed 0.5, pressed Enter, then picked 5 min by hand again | Untimed with a warning; after a hand-picked timer, no leftover minutes | The Untimed switch and the warning worked on the first run, but the "0.5" stayed in the box after tapping 5 min (see above). After the fix the box clears. |
| 4 | **Pass** | With 5 min selected, typed "four", tapped Fit my time | Asked for a number; timer unchanged | "Type your minutes as a number, like 4." in red; 5 min stayed highlighted. |

| 1. Four minutes | 1. Round starts | 2. Twelve minutes | 3. Half a minute | 4. Not a number |
|---|---|---|---|---|
| <img src="04-fit-my-time/s1-four-minutes.jpg" alt="4 minutes: 1 min chosen, 5 min would run past the bell" width="140"> | <img src="04-fit-my-time/s1-round-starts-1-00.png" alt="The round starts at 1:00 left" width="140"> | <img src="04-fit-my-time/s2-twelve-minutes.jpg" alt="12 minutes: 10 min chosen" width="140"> | <img src="04-fit-my-time/s3-half-minute.jpg" alt="0.5 minutes: switched to Untimed with a warning" width="140"> | <img src="04-fit-my-time/s4-not-a-number.jpg" alt="four: asked for a number, 5 min unchanged" width="140"> |

Also checked: no errors in the browser console. Not checked: the voice part of the brief ("says he has four minutes"). This version uses a typed number, not speech.

## Changes after review

Ashby approved, with one question, one risk and two smaller notes:

1. **Risk: typing minutes and tapping Start practice ignored them (code fix, new Scenario 5).** With 5 min selected, typing 4 and starting straight away gave a 5-minute round. Start practice now fits whatever is in the box first. If the box holds something that isn't a number, it shows the "Type your minutes as a number" message and doesn't start. An empty box keeps the hand-picked timer.
2. **Question: should "fits" leave a buffer before the bell? (no change).** It's intentional that a round may end exactly at the bell. That matches the brief's own example ("four minutes" gives 1 min, because 5 would run past the bell). With fix 1, the clock starts as soon as Pascal taps Start, so time on the setup screen is the only slack, and that is now one tap.
3. **`.5`, `4.` and `0,5` were rejected (code fix).** They are now accepted. A comma is read as a decimal point, since some phone keyboards show a comma.
4. **Typed minutes were wiped by tapping Easy or Hard Mode (code fix).** What's typed is now kept as you type, so a redraw doesn't empty the box.

Re-checked at 375 × 812 after the changes: Scenarios 1 to 4 give the same results as before, and Scenario 5 passes. `.5` and `0,5` switch to Untimed, `4.` picks 1 min, and `5` picks 5 min. "four" followed by Start practice stays on the setup screen with the message. Typing 4, then tapping Hard Mode and back to Easy, keeps the 4. No console errors.

| 5. Typed 4, 5 min still selected | 5. Start practice → 1:00 |
|---|---|
| <img src="04-fit-my-time/s5-typed-not-fitted.jpg" alt="4 typed, Fit my time not tapped, 5 min selected" width="160"> | <img src="04-fit-my-time/s5-round-starts-1-00.jpg" alt="The round starts at 1:00 left" width="160"> |

## How to check it

1. Get the branch and open the app:
   ```bash
   git fetch origin
   git switch fit-my-time
   ```
   Then open `index.html` in Chrome or Edge. For phone size, press F12 and turn on the device toolbar (375 × 812).
2. Open **Moderator controls → Reset all progress**, then **Research Seminar (Section D) → Practice these names**.
3. **Scenario 1:** in **Minutes until class**, type `4` and tap **Fit my time**. You should see **1 min** selected and "5 min would run past the bell." Tap **Start practice**: the timer should show 1:00. Tap **End practice**, then **Practice these names** again.
4. **Scenario 2:** type `12` and tap **Fit my time**. You should see **10 min** selected and no warning.
5. **Scenario 3:** tap **5 min**, type `0.5`, and press Enter. You should see **Untimed** selected and the red warning. Then tap **5 min**: the box should go back to empty ("e.g. 4").
6. **Scenario 4:** with **5 min** selected, type `four` and tap **Fit my time**. You should see "Type your minutes as a number, like 4." and **5 min** should still be selected.
7. **Scenario 5:** tap **5 min**, type `4`, and tap **Start practice** without tapping Fit my time. The timer should show 1:00.
