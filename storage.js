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
