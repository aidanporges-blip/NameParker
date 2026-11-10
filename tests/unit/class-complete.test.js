/* Unit test: the "class complete" rule, isComplete(), on its own.
   Fixed inputs only: no page, no saved progress, no app screens. If this fails, the rule is wrong. */

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadApp } = require("../helpers/load-app");

const isComplete = loadApp()("isComplete");

// A made-up class: `sure` students are Sure ("confident"), the rest are Shaky.
function makeClass(sure, total) {
  return {
    roster: Array.from({ length: total }, (_, i) => ({ id: `s${i}`, status: i < sure ? "confident" : "learning" })),
  };
}

test("every student Sure (6 of 6) is complete", () => {
  assert.equal(isComplete(makeClass(6, 6)), true);
});

test("one student still Shaky (5 of 6) is not complete", () => {
  assert.equal(isComplete(makeClass(5, 6)), false);
});

test("199 of 200 is not complete, even though it rounds to 100%", () => {
  assert.equal(isComplete(makeClass(199, 200)), false);
});

test("a class with no students is not complete", () => {
  assert.equal(isComplete(makeClass(0, 0)), false);
});

test("a missing class is not complete", () => {
  assert.equal(isComplete(undefined), false);
});
