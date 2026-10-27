/* Story 4 ("Resurface a missed name") test. Runs the real app files in plain Node, no browser.
   Run from the NameParker folder:  node tests/story4.test.js */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const TRIALS = 500;

// A fake page element: enough for render() and the timer to write into without crashing.
function fakeElement() {
  return { innerHTML: "", textContent: "", value: "", scrollTop: 0, style: {}, classList: { toggle() {} }, focus() {} };
}

// Load data.js, storage.js and app.js into one sandbox, the way index.html loads them.
function loadApp() {
  const store = new Map();
  const sandbox = {
    document: {
      getElementById: () => fakeElement(),
      querySelector: () => fakeElement(),
      addEventListener() {},
    },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    console: { log() {}, warn: console.warn, error: console.error }, // hide the app's [pick]/[answer] logs
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ["data.js", "storage.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), sandbox, { filename: file });
  }
  return (code) => vm.runInContext(code, sandbox);
}

const run = loadApp();

// Answer the current question, right or wrong, then return the student's id.
const answerCurrent = (right) =>
  run(`(() => {
    const p = state.practice;
    const i = p.question.options.findIndex((o) => o.isCorrect === ${right});
    answer(i);
    return p.question.student.id;
  })()`);
const nextId = () => run("nextQuestion(); state.practice.question.student.id");

function startRound() {
  run(`resetAll(); state.activeKey = "E"; state.mode = "easy"; state.duration = null; state.focusQueue = null; go("practice");`);
}

/* Scenario 1: Missed name comes back in the same round.
   Each trial answers a few warm-up questions (randomly right or wrong), misses one,
   then checks that student is one of the next two questions. */
let passed1 = 0;
const failures = [];
for (let t = 0; t < TRIALS; t++) {
  startRound();
  const warmups = Math.floor(Math.random() * 6);
  for (let w = 0; w < warmups; w++) {
    answerCurrent(Math.random() < 0.5);
    nextId();
  }
  const missedId = answerCurrent(false);
  const next1 = nextId();
  answerCurrent(true);
  const next2 = nextId();
  if (next1 === missedId || next2 === missedId) passed1++;
  else if (failures.length < 3) failures.push({ trial: t + 1, warmups, missedId, next1, next2 });
}
console.log(`Scenario 1 (missed name back within two questions): ${passed1}/${TRIALS} passed`);
failures.forEach((f) => console.log("  failed:", JSON.stringify(f)));

/* Scenario 2: Only one student left to practice.
   Everyone in Section E is "Sure" except one "Shaky" student; missing them brings them straight back. */
let passed2 = false;
let detail = "";
try {
  run(`resetAll();
    state.sections.E.roster.forEach((s, i) => { s.status = i === 3 ? "learning" : "confident"; });
    state.activeKey = "E"; state.mode = "easy"; state.duration = null; state.focusQueue = null; go("practice");`);
  const shakyId = run("state.sections.E.roster[3].id");
  const firstId = run("state.practice.question.student.id");
  const missedId = answerCurrent(false);
  const nextQ = nextId();
  passed2 = firstId === shakyId && missedId === shakyId && nextQ === shakyId;
  detail = passed2 ? "" : ` (first: ${firstId}, missed: ${missedId}, next: ${nextQ}, shaky: ${shakyId})`;
} catch (e) {
  detail = ` (crashed: ${e.message})`;
}
console.log(`Scenario 2 (last shaky student comes straight back): ${passed2 ? "passed" : "FAILED"}${detail}`);

const allPassed = passed1 === TRIALS && passed2;
console.log(allPassed ? "All story 4 checks passed." : "Some story 4 checks failed.");
process.exitCode = allPassed ? 0 : 1;
