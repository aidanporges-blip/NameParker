/* Random cold call test. Runs the real app files in plain Node, no browser.
   Run from the NameParker folder:  node tests/coldcall.test.js */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const TRIALS = 1000;

// A fake page element: enough for render() to write into without crashing.
function fakeElement() {
  return { innerHTML: "", textContent: "", value: "", scrollTop: 0, style: {}, classList: { toggle() {} }, focus() {} };
}

// Load data.js, storage.js and app.js into one sandbox, the way index.html loads them.
// Also counts writes to storage, so scenario 7 can check nothing gets saved.
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
      setItem: (k, v) => {
        sandbox.storageWrites++;
        store.set(k, String(v));
      },
      removeItem: (k) => store.delete(k),
    },
    storageWrites: 0,
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
const results = [];
const report = (name, ok, detail) => {
  results.push(ok);
  console.log(`${name}: ${ok ? "passed" : "FAILED"}${detail ? ` (${detail})` : ""}`);
};

// Open the cold call page for Section E (12 students), the way the button does.
function openSectionE() {
  run(`resetAll(); state.activeKey = "E"; go("class"); go("coldCall");`);
}

// Generate a list with the page's own actions and return the picked student ids.
// fresh: tap Start over first, so no-replacement picks from the whole class again.
function generate(replace, count, fresh = true) {
  return run(`(() => {
    if (${fresh}) ACTIONS.coldCallStartOver();
    ACTIONS.coldCallMode(${replace ? '"repeat"' : '"once"'});
    state.coldCall.count = ${count};
    ACTIONS.coldCallGenerate();
    return state.coldCall.list.map((s) => s.id);
  })()`);
}

/* Scenario 2: No replacement. 5 different Section E students, in random order. */
{
  openSectionE();
  const ids = run(`state.sections.E.roster.map((s) => s.id)`);
  const inClass = new Set(ids);
  const firstCounts = new Map(ids.map((id) => [id, 0]));
  let passed = 0;
  for (let t = 0; t < TRIALS; t++) {
    const list = generate(false, 5);
    const ok = list.length === 5 && new Set(list).size === 5 && list.every((id) => inClass.has(id));
    if (ok) passed++;
    firstCounts.set(list[0], firstCounts.get(list[0]) + 1);
  }
  // Random order: over 1000 lists each of the 12 students should come first about 83 times.
  const firsts = [...firstCounts.values()];
  const spreadOk = firsts.every((n) => n >= 40 && n <= 140);
  report(`Scenario 2 (no replacement: 5 different Section E students)`, passed === TRIALS, `${passed}/${TRIALS}`);
  report(`Scenario 2 (random order: each student first 40-140 times)`, spreadOk, `first-place counts ${Math.min(...firsts)}-${Math.max(...firsts)}`);
}

/* Scenario 3: Replacement. Each of the 5 names picked from all 12; repeats can happen. */
{
  openSectionE();
  const ids = run(`state.sections.E.roster.map((s) => s.id)`);
  const inClass = new Set(ids);
  const picks = new Map(ids.map((id) => [id, 0]));
  let passed = 0;
  let withRepeat = 0;
  for (let t = 0; t < TRIALS; t++) {
    const list = generate(true, 5);
    if (list.length === 5 && list.every((id) => inClass.has(id))) passed++;
    if (new Set(list).size < list.length) withRepeat++;
    list.forEach((id) => picks.set(id, picks.get(id) + 1));
  }
  // 5000 picks: each student should be picked about 417 times.
  const counts = [...picks.values()];
  const evenOk = counts.every((n) => n >= 300 && n <= 540);
  report(`Scenario 3 (replacement: 5 names, all from Section E)`, passed === TRIALS, `${passed}/${TRIALS}`);
  report(`Scenario 3 (a student can appear more than once)`, withRepeat > 0, `${withRepeat}/${TRIALS} lists had a repeat`);
  report(`Scenario 3 (each student picked 300-540 times of 5000)`, evenOk, `counts ${Math.min(...counts)}-${Math.max(...counts)}`);
}

/* Scenario 5: Generate again (no replacement). Nobody is called twice until everyone has been called. */
{
  openSectionE();
  let passed = 0;
  const trials = 200;
  for (let t = 0; t < trials; t++) {
    run(`ACTIONS.coldCallStartOver()`);
    const a = generate(false, 5, false);
    const b = generate(false, 5, false);
    const c = generate(false, 5, false); // only 2 left
    const all = [...a, ...b, ...c];
    const noRepeats = all.length === 12 && new Set(all).size === 12;
    const shapes = a.length === 5 && b.length === 5 && c.length === 2;
    const blocked = run(`(() => {
      const before = state.coldCall.list.map((s) => s.id).join();
      ACTIONS.coldCallGenerate();
      const html = coldCallScreen();
      return state.coldCall.list.map((s) => s.id).join() === before &&
        html.includes("Everyone in this class has been called.") &&
        /data-action="coldCallGenerate" disabled/.test(html);
    })()`);
    const backToTwelve = run(`(() => { ACTIONS.coldCallStartOver(); return coldCallPool("E").length; })()`);
    if (noRepeats && shapes && blocked && backToTwelve === 12) passed++;
  }
  report(`Scenario 5 (no one called twice until all 12 are; then blocked until Start over)`, passed === trials, `${passed}/${trials}`);
}

/* Each class keeps its own list: calling in Section E doesn't touch Section D, and Start over is per class. */
{
  openSectionE();
  const ok = run(`(() => {
    ACTIONS.coldCallStartOver();
    ACTIONS.coldCallMode("once"); state.coldCall.count = 5; ACTIONS.coldCallGenerate();    // call 5 in E
    const eLeft = coldCallPool("E").length;
    go("class"); state.activeKey = "D"; go("coldCall");
    const dLeftAtStart = coldCallPool("D").length;                                          // D untouched
    ACTIONS.coldCallMode("once"); state.coldCall.count = 2; ACTIONS.coldCallGenerate();    // call 2 in D
    const eAfterD = coldCallPool("E").length;
    ACTIONS.coldCallStartOver();                                                            // reset D only
    const dAfterReset = coldCallPool("D").length, eAfterDReset = coldCallPool("E").length;
    return [eLeft, dLeftAtStart, eAfterD, dAfterReset, eAfterDReset];
  })()`);
  report(`Per class (E: 7 left; D starts at 6; D's calls and Start over leave E alone)`,
    ok.join() === "7,6,7,6,7", `E/D pools ${ok.join(", ")}`);
}

/* Scenario 6: Too many. With no replacement the number can't go above 12, and the page says why. */
{
  openSectionE();
  const capped = run(`(() => {
    ACTIONS.coldCallMode("once");
    for (let i = 0; i < 20; i++) ACTIONS.coldCallStep("1");
    return state.coldCall.count;
  })()`);
  const html = run(`coldCallScreen()`);
  const saysWhy = html.includes("With no replacement, each student can appear only once, so the most is 12.");
  const plusDisabled = /data-arg="1" aria-label="More" disabled/.test(html);
  const switchedBack = run(`(() => {
    ACTIONS.coldCallMode("repeat");
    for (let i = 0; i < 3; i++) ACTIONS.coldCallStep("1"); // 12 -> 15, allowed with replacement
    const withRepeat = state.coldCall.count;
    ACTIONS.coldCallMode("once");                          // back to no replacement
    return [withRepeat, state.coldCall.count];
  })()`);
  const listSize = generate(false, 99).length; // even if the number were forced too high, the list stops at 12
  const floor = run(`(() => { for (let i = 0; i < 30; i++) ACTIONS.coldCallStep("-1"); return state.coldCall.count; })()`);
  report(`Scenario 6 (pressing + 20 times stops at 12)`, capped === 12, `count ${capped}`);
  report(`Scenario 6 (page says why, and + is greyed out)`, saysWhy && plusDisabled);
  report(`Scenario 6 (15 with replacement drops to 12 without)`, switchedBack[0] === 15 && switchedBack[1] === 12, `${switchedBack[0]} -> ${switchedBack[1]}`);
  report(`Scenario 6 (a forced 99 still gives only 12 names)`, listSize === 12, `${listSize} names`);
  report(`Scenario 6 (pressing - never goes below 1)`, floor === 1, `count ${floor}`);
}

/* Scenario 7: Generating never changes progress, and nothing is saved. */
{
  openSectionE();
  const snapshot = () =>
    run(`JSON.stringify({
      students: Object.values(state.sections).flatMap((sec) => sec.roster.map((s) => [s.id, s.status, s.missedCount])),
      coverage: Object.keys(state.sections).map((k) => coverageOf(state.sections[k])),
      needs: state.sections.E.roster.filter(needsPractice).map((s) => s.id),
    })`);
  const before = snapshot();
  const writesBefore = run(`storageWrites`);
  for (let t = 0; t < 500; t++) {
    generate(t % 2 === 0, 1 + (t % 12));
  }
  const after = snapshot();
  const writes = run(`storageWrites`) - writesBefore;
  report(`Scenario 7 (statuses, misses, coverage and needs-practice unchanged after 500 lists)`, before === after);
  report(`Scenario 7 (nothing saved while generating)`, writes === 0, `${writes} storage writes`);
}

const allPassed = results.every(Boolean);
console.log(allPassed ? "All cold call checks passed." : "Some cold call checks failed.");
process.exitCode = allPassed ? 0 : 1;
