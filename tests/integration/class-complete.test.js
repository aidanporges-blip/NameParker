/* Integration test: the "class complete" story through the real app code with test data.
   The rule (isComplete), the controller (answer, go) and the screens (practice, progress, home) run together
   against the app's built-in fake classes. Nobody types or clicks; there is no browser. */

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

// Section D (6 students) with 5 Sure and one Shaky, in an untimed Easy round. Returns the Shaky student's name.
function practiceWithOneLeft(run) {
  return run(`(() => {
    resetAll();
    state.sections.D.roster.forEach((s, i) => { s.status = i === 0 ? "learning" : "confident"; });
    state.activeKey = "D"; state.mode = "easy"; state.duration = null; state.focusQueue = null;
    go("practice");
    return state.sections.D.roster[0].fullName;
  })()`);
}

// Answer the question on screen, right or wrong.
function answerQuestion(run, right) {
  run(`answer(state.practice.question.options.findIndex((o) => o.isCorrect === ${right}))`);
}

test("answering the last Shaky student correctly shows the Class complete card", () => {
  const run = loadApp();
  const lastStudent = practiceWithOneLeft(run);
  assert.equal(run(`state.practice.question.student.fullName`), lastStudent, "the only Shaky student should be asked");

  answerQuestion(run, true);

  const practice = run(`practiceScreen()`);
  assert.match(practice, /class="card done-card"/);
  assert.match(practice, /Class complete!/);
  assert.match(practice, /You know all 6 names in Research Seminar\./);
});

test("a finished class shows Complete on Progress and on the home screen", () => {
  const run = loadApp();
  practiceWithOneLeft(run);
  answerQuestion(run, true);

  run(`go("progress")`);
  assert.match(run(`progressScreen()`), /Class complete\. You know all 6 names\./);

  run(`go("home")`);
  const home = run(`homeScreen()`);
  const sectionD = home.slice(home.indexOf('data-arg="D"'));
  assert.match(sectionD.slice(0, sectionD.indexOf("</button>")), /Complete/);
});

test("missing the last student does not claim the class is complete", () => {
  const run = loadApp();
  practiceWithOneLeft(run);

  answerQuestion(run, false);

  assert.doesNotMatch(run(`practiceScreen()`), /done-card/);
  run(`go("progress")`);
  assert.doesNotMatch(run(`progressScreen()`), /Class complete/);
});
