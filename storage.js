/* Guess Hoo? (Name Parker) storage: the only place the app saves and loads progress.
   For now it uses the browser's own storage (localStorage), so progress stays on
   this device and in this browser only. When we add logins and a real database,
   we replace these three functions and nothing else in the app has to change. */

const STORAGE_KEY = "guess-hoo-progress-v1";

// The parts of the app state worth remembering between visits.
const SAVED_FIELDS = ["sections", "activeKey", "week", "mode", "duration", "namesFilter"];

// Returns the saved progress, or null if there isn't any (or it can't be read).
function loadProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object" || !saved.sections) return null;
    return saved;
  } catch (e) {
    return null; // Storage is blocked or the saved data is damaged; start fresh.
  }
}

function saveProgress(state) {
  try {
    const toSave = {};
    SAVED_FIELDS.forEach((field) => {
      toSave[field] = state[field];
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    // Storage is blocked (for example, a private window). The app still works; it just won't remember.
  }
}

function clearProgress() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // Nothing to clear.
  }
}

/* ---------------- Session log (for moderators running usability sessions) ----------------
   A separate list of timestamped events, kept apart from progress so "Reset all progress"
   never touches it. Saved as { events: [...], exportedAt: "<ISO time>" or null }. */

const LOG_KEY = "guess-hoo-log-v1";
const LOG_MAX_EVENTS = 5000; // keep the newest 5,000 so storage can't fill up
const LOG_COLUMNS = ["timestamp", "round", "event", "section", "mode", "duration", "names", "ms",
  "student_id", "student_name", "result", "new_status", "reason", "score", "seconds_played"];

function readLog() {
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    const log = raw ? JSON.parse(raw) : null;
    if (log && Array.isArray(log.events)) return log;
  } catch (e) {
    // Storage is blocked or the log is damaged; treat it as empty.
  }
  return { events: [], exportedAt: null };
}

function writeLog(log) {
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(log));
  } catch (e) {
    // Storage is blocked (for example, a private window). Practice still works; nothing is logged.
  }
}

// Adds one event, stamped with the current time. `fields` holds the event's own details.
function logEvent(event, fields) {
  const log = readLog();
  log.events.push(Object.assign({ timestamp: new Date().toISOString(), event }, fields));
  if (log.events.length > LOG_MAX_EVENTS) log.events = log.events.slice(-LOG_MAX_EVENTS);
  writeLog(log);
}

function loadEvents() {
  return readLog().events;
}

// True if something was logged after the last export (so clearing would lose it).
function hasUnexportedEvents() {
  const log = readLog();
  if (log.events.length === 0) return false;
  const last = log.events[log.events.length - 1].timestamp;
  return !log.exportedAt || log.exportedAt < last;
}

// Returns the whole log as CSV text (one row per event), or null if nothing is logged.
// Also records the export time, so "Clear log" knows the events are safe.
function exportEvents() {
  const log = readLog();
  if (log.events.length === 0) return null;
  const cell = (v) => {
    const text = v === undefined || v === null ? "" : String(v);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const rows = log.events.map((e) => LOG_COLUMNS.map((c) => cell(e[c])).join(","));
  log.exportedAt = new Date().toISOString();
  writeLog(log);
  return [LOG_COLUMNS.join(","), ...rows].join("\n") + "\n";
}

function clearEvents() {
  try {
    window.localStorage.removeItem(LOG_KEY);
  } catch (e) {
    // Nothing to clear.
  }
}
