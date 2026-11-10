Guess hoo? User Stories and Scenarios
=====================================

Source: Guess hoo Product Brief (checkpoint September 18, 2026).
Primary persona: Pascal the Professor, an instructor teaching more than two classes.

The user stories below are taken from the brief. The brief does not write
Given-When-Then scenarios itself, so the scenarios are derived from its
definitions of done, OEC ratios, usability prompts, and golden and adversarial cases.


EPIC STORY
----------

As Pascal, four minutes from the door of my next section, I want to run one
short, timed drill on the students in that specific section, so I walk in able
to correctly name the faces I was least sure of and can see exactly which names
remain shaky.

Scenario: Pre-class drill on the intended section
  Given Pascal is approaching Section T with four minutes available
  When he starts a drill for Section T
  Then the drill begins on Section T
  And the first face is on screen within ten seconds
  And the round finishes inside the chosen window
  And the round closes with a private readback of the correct count and the remaining shaky names


CHILD STORIES
-------------

1. Identify the section

As Pascal, I want to identify the section I am about to teach, so the first
practice face belongs to that section.

Scenario: Section resolved correctly
  Given Pascal has several classes
  When he asks to practice the section he teaches next
  Then the first practice face belongs to that section

Scenario: Ambiguous section
  Given Sections T and W both meet at 10:00 on different days
  When Pascal says "quiz me on my ten o'clock"
  Then the app asks "T or W?"
  And it does not guess the section from today's calendar


2. Choose a duration

As Pascal, I want to choose a duration that fits my available time, so the
round ends before class begins.

Scenario: Stated time falls between duration options
  Given the duration options are 1, 5, and 10 minutes
  And Pascal says he has four minutes
  When the round is set up
  Then the app chooses one minute
  And it explains that five minutes would run past the bell


3. Answer a name from a face

As Pascal, I want to answer a name from a student's face, so I can observe
whether I retrieved it correctly.

Scenario: Face-to-name retrieval
  Given a round has started
  When a student's face is shown
  Then Pascal can answer the name without help
  And he gets immediate feedback on whether he was correct


4. Resurface a missed name

As Pascal, I want a missed name to reappear, so I answer it correctly later in
the same or next session.

Scenario: Missed name comes back
  Given Pascal is in a round
  When he answers a name wrong
  Then that name reappears within the next two questions


5. See time remaining

As Pascal, I want to know how much practice time remains, so I finish or stop
before reaching the classroom.

Scenario: Timer visible during the round
  Given Pascal started a timed round
  When he is answering prompts
  Then he can see how much practice time remains
  And the round ends on time


6. Section-specific readback

As Pascal, I want a section-specific readback, so I leave knowing which names
remain uncertain.

Scenario: Readback at the end of the round
  Given Pascal finished a round on a section
  When the round ends
  Then he sees the section, the duration, the correct count, and the remaining shaky names
  And the readback is private

Scenario: Missed names requested in a public place
  Given audio is on and Pascal is in a crowded corridor
  When he asks to hear the names he keeps getting wrong
  Then the names are shown on screen only
  And the voice says only the count, for example "Three names, on your screen."


PROGRESS AND COVERAGE (from the usability test plan)
----------------------------------------------------

Scenario: Read coverage
  Given Pascal has practiced a class
  When he opens Progress
  Then he can find and correctly read the percentage of the class he knows

Scenario: Find names needing practice
  Given Pascal has missed some names in a class
  When he looks for names that still need work
  Then he finds the names-often-missed list

Scenario: Pace warning
  Given it is week 14 of 15 and the class is not fully covered
  When Pascal views the class
  Then he notices the pace warning and connects it to more practice

Scenario: Full coverage
  Given Pascal practices the six-person Section D
  When every student has been answered correctly twice
  Then the app shows 6 of 6, or 100% coverage, as the done state


IN CLASS: RANDOM COLD CALL
--------------------------

As Pascal, during class, I want to generate a random list of students from the
section I'm teaching, so I can cold call fairly and use their names without
picking the same few people every time.

Where it lives: on the Today screen, after Pascal selects a class, a
"Random cold call" button sits below "View progress". It opens a new page where
he chooses no replacement or replacement, picks how many students, and taps
Generate.

Analytical question: Do professors use the list in class, and does it spread
cold calls across the whole roster?
OEC ratio: Professors who generate a cold-call list in a week / active professors

Scenario: Open the cold call page from the selected class
  Given Pascal has selected Section E on the Today screen
  When he taps "Random cold call" below "View progress"
  Then a cold call page opens for Section E
  And he can choose no replacement or replacement, and the number of students

Scenario: No replacement
  Given Section E has 12 students
  And Pascal chooses no replacement and 5 students
  When he taps Generate
  Then he sees a list of 5 different students from Section E in random order

Scenario: Replacement
  Given Section E has 12 students
  And Pascal chooses replacement and 5 students
  When he taps Generate
  Then he sees a list of 5 names, each picked at random from all 12 students
  And the same student can appear more than once

Scenario: Only the selected class
  Given Pascal has more than one class
  And he opened the cold call page from Section E
  When he taps Generate
  Then every name on the list is a Section E student

Scenario: Generate again
  Given Pascal chose no replacement and has generated a list that included Jordan Smith
  When he taps Generate again
  Then the new list has only Section E students who haven't been called yet
  And Jordan Smith is not on it

Scenario: Each class keeps its own list
  Given Jordan Smith was cold called in Section E with no replacement
  When Pascal opens the cold call page for another class
  Then that class's students can all still be called
  And starting over in one class does not reset the other

Scenario: Everyone has been called (goes wrong)
  Given all 12 students in Section E have been called with no replacement
  When Pascal tries to generate another list
  Then the app says everyone in this class has been called
  And he can start over to put all 12 back

Scenario: Asking for more students than are left (goes wrong)
  Given Section E has 12 students
  And Pascal chooses no replacement
  When he tries to ask for 15 students
  Then the app does not let the number go above the students left to call (12 at the start)
  And it says why: with no replacement, each student can appear only once

Scenario: Cold calling does not change practice progress (goes wrong)
  Given Kwabena Mensah is Shaky in Section E
  When Pascal generates a cold call list that includes Kwabena
  Then Kwabena is still Shaky
  And Section E's coverage and needs-practice list are unchanged


PRACTICE COACH (agentic extension)
----------------------------------

As a professor who keeps forgetting to practice, I want an agent that, once it
knows my preferred learning style and available days, decides when to remind me
and what kind of session to propose, adjusting based on whether I'm actually
following through, so I stay on track without building my own study plan.

Scenario: Adapting to skipped reminders
  Given Pascal keeps skipping Tuesday evening reminders
  And he has a reliable eight-minute gap before Wednesday's 10:00 class
  When the coach plans his next session
  Then it proposes a one-minute Wednesday session on Section T's shaky names
  And once he accepts, the activity log shows it completed before class

Scenario: Confirm before launching
  Given Pascal is four minutes from Section T with his hands full and ten unresolved names
  When the coach recommends a session
  Then it picks one minute and explains why five would not fit
  And it shows the first face only after Pascal confirms

Scenario: Answer the question that was asked
  Given Pascal is at his desk with 25 minutes
  When he asks who he still misses in his 10am class
  Then the coach shows the three faces and names first
  And it offers a one-minute round without starting it automatically

Scenario: Identify a student from a description
  Given two students match Pascal's description of someone from class
  When he asks who that student is
  Then the coach shows both candidate faces
  And it marks a student shaky only after Pascal taps to confirm

Scenario: Unverified pronunciation
  Given no student-provided recording exists for a name
  When Pascal asks how to pronounce it
  Then the coach says the pronunciation is unverified
  And it asks permission before requesting a recording from the student
  And it never puts a guessed pronunciation into practice as fact

Scenario: Actions that need permission
  Given the coach is running
  When an action would message students, request a pronunciation recording,
    change a roster, mark a class fully covered, expose names through public
    audio, or act on an ambiguous section
  Then the coach asks Pascal first
