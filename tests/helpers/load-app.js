/* Loads the real app files (data.js, storage.js, app.js) into a sandbox, the way index.html loads them,
   with a fake page and fake browser storage. No browser needed. Returns run(code), which runs code inside
   the app and hands back the result, e.g. run("isComplete") gives you the real isComplete function. */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..", "..");

// A fake page element: enough for render() to write into without crashing.
function fakeElement() {
  return { innerHTML: "", textContent: "", value: "", scrollTop: 0, style: {}, classList: { toggle() {} }, focus() {} };
}

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

module.exports = { loadApp };
