/* Guess Hoo? (Name Parker) app logic: the "controller" and "view" in MVC terms.
   Plain JavaScript, no frameworks. Data lives in data.js; saving lives in storage.js. */

const TOTAL_WEEKS = 15;

/* ---------------- State ---------------- */

const state = {
  sections: seedProgress(initialSections()),
  activeKey: "E",
  tab: "home", // home | class | sectionMenu | practice | progress | addClass
  mode: "easy", // easy | hard
  duration: null, // null (untimed) or minutes
  namesFilter: "all", // all | missed
  week: 5,
  modOpen: false,
  focusQueue: null, // list of student ids to practice, or null for all
  practice: null, // the current practice session (see startPractice)
  showAllNeeds: false, // Progress screen: show every name that needs practice, not just the top three
  classUi: { syncing: false, uploaded: false },
  addClass: { picked: CANVAS_COURSES[0].id, query: "" },
};

// Pick up where the professor left off, if this browser has saved progress.
const savedProgress = loadProgress();
if (savedProgress) {
  Object.assign(state, savedProgress);
  if (!state.sections[state.activeKey]) state.activeKey = Object.keys(state.sections)[0];
}

let timerId = null;

/* ---------------- Helpers ---------------- */

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function initials(first, last) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

function syllableChunks(word) {
  return word.match(/[^aeiouAEIOU]*[aeiouAEIOU]+[^aeiouAEIOU]*/g) || [word];
}

function correctPhonetic(student) {
  if (student.pronunciation) return student.pronunciation.toUpperCase();
  return [student.first, student.last].map((w) => syllableChunks(w).join("-").toUpperCase()).join(" ");
}

function mistakePhonetic(student) {
  if (student.mistakePronunciation) return student.mistakePronunciation.toUpperCase();
  return [student.first, student.last]
    .map((w) => {
      const chunks = syllableChunks(w);
      const reordered = chunks.length > 1 ? [...chunks].reverse() : chunks;
      return reordered.join("-").toUpperCase();
    })
    .join(" ");
}

function coverageOf(section) {
  if (!section || section.roster.length === 0) return 0;
  const confident = section.roster.filter((s) => s.status === "confident").length;
  return Math.round((confident / section.roster.length) * 100);
}

function sectionDescription(label) {
  const idx = label.indexOf(":");
  return idx >= 0 ? label.slice(idx + 1).trim() : label;
}

function speak(text) {
  try {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  } catch (e) {
    // Speech isn't available in this browser; do nothing.
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function activeSection() {
  return state.sections[state.activeKey];
}

function isBehindPace() {
  const cov = coverageOf(activeSection());
  const expected = Math.round((state.week / TOTAL_WEEKS) * 100);
  return cov < expected - 5;
}

/* ---------------- Icons and small pieces ---------------- */

const ICONS = {
  tilde: '<path d="M3 14c3-4.5 6-4.5 9 0s6 4.5 9 0"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  clock: '<g><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></g>',
  play: '<path d="M8.5 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>',
  speaker: '<g><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/></g>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  home: '<path d="M3 11 12 3.5 21 11v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor" stroke="none"/>',
  users: '<g fill="currentColor" stroke="none"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 19.5c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6z"/><circle cx="17" cy="9" r="2.6"/><path d="M16.2 13.6c3.1 0 5.3 2.1 5.3 5.9h-4.4c0-2.3-.4-4.3-.9-5.9z"/></g>',
  bars: '<g fill="currentColor" stroke="none"><rect x="4" y="13" width="3.6" height="7.5" rx="1"/><rect x="10.2" y="8.5" width="3.6" height="12" rx="1"/><rect x="16.4" y="3.5" width="3.6" height="17" rx="1"/></g>',
  search: '<g><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></g>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  cloud: '<path d="M7 18.5a4.2 4.2 0 0 1-.5-8.4A5.8 5.8 0 0 1 17.6 9a4.8 4.8 0 0 1-.1 9.5z"/>',
  refresh: '<g><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4.5v5h-5"/></g>',
  warning: '<g><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/></g>',
  personPlus: '<g><circle cx="10" cy="8" r="3.5"/><path d="M3.5 19.5c0-3.4 2.9-5.5 6.5-5.5 1.2 0 2.3.2 3.2.7M18 13.5v6M15 16.5h6"/></g>',
  person: '<g fill="currentColor" stroke="none"><circle cx="12" cy="9" r="4"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5z"/></g>',
};

function icon(name, s = 16, w = 2.2, cls = "") {
  return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${cls ? ` class="${cls}"` : ""} aria-hidden="true">${ICONS[name]}</svg>`;
}

const STATUS = {
  confident: { cls: "sure", label: "Sure", icon: "check" },
  learning: { cls: "shaky", label: "Shaky", icon: "tilde" },
  new: { cls: "new", label: "New", icon: "personPlus" },
};

function statusOf(student) {
  return STATUS[student.status] || STATUS.new;
}

function pill(cls, iconName, text) {
  return `<span class="pill pill-${cls}">${iconName ? icon(iconName, 14, 2.6) : ""}${text}</span>`;
}

function statusPill(student) {
  const m = statusOf(student);
  return pill(m.cls, m.icon, m.label);
}

function wordmark() {
  return `<span class="wordmark">Guess H<span class="oo">oo<svg class="rays" width="24" height="11" viewBox="0 0 24 11" aria-hidden="true"><path d="M12 1.5v5.5M4 4l3 4M20 4l-3 4" stroke="var(--orange)" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg></span></span>`;
}

function header(withHomeLink) {
  const mark = withHomeLink
    ? `<button data-action="go" data-arg="home" aria-label="Guess Hoo home">${wordmark()}</button>`
    : `<h1 style="margin:0">${wordmark()}</h1>`;
  return `<div class="app-header">${mark}<span class="me" aria-hidden="true">${icon("person", 22)}</span></div>`;
}

function backLink(target, text) {
  return `<button class="back" data-action="go" data-arg="${target}">${icon("arrowLeft", 16)} ${text}</button>`;
}

function rotunda() {
  let columns = "";
  for (let i = 0; i < 6; i++) columns += `<rect x="${48 + i * 9}" y="55" width="4.5" height="19" rx="1" fill="#14213D"/>`;
  return `<svg class="hero-art" viewBox="0 0 140 112" aria-hidden="true">
    <ellipse cx="112" cy="16" rx="16" ry="6" fill="#DCE2EC"/>
    <ellipse cx="100" cy="18" rx="10" ry="5" fill="#DCE2EC"/>
    <ellipse cx="34" cy="26" rx="14" ry="5" fill="#E3E8F0"/>
    <path d="M0 112 C22 86 48 84 70 94 S118 78 140 86 V112Z" fill="#CFD6E3"/>
    <circle cx="24" cy="80" r="11" fill="#B9C3D4"/>
    <circle cx="120" cy="78" r="12" fill="#B9C3D4"/>
    <rect x="40" y="80" width="64" height="7" rx="1.5" fill="#14213D"/>
    <rect x="43" y="74" width="58" height="6" fill="#14213D"/>
    ${columns}
    <path d="M40 55 L72 45 L104 55 Z" fill="#14213D"/>
    <rect x="54" y="38" width="36" height="7" fill="#14213D"/>
    <path d="M54 38 a18 18 0 0 1 36 0z" fill="#E57200"/>
    <rect x="69.5" y="16" width="5" height="5" rx="1" fill="#14213D"/>
    <path d="M0 112 C30 98 70 100 100 106 S130 104 140 102 V112Z" fill="#DCE2EC"/>
  </svg>`;
}

function ring(pct, label, size = 96, stroke = 10) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const half = size / 2;
  return `<div class="ring" style="width:${size}px;height:${size}px" role="img" aria-label="${pct}%">
    <svg width="${size}" height="${size}">
      <circle cx="${half}" cy="${half}" r="${r}" fill="none" stroke="#E8EBF1" stroke-width="${stroke}"/>
      <circle cx="${half}" cy="${half}" r="${r}" fill="none" stroke="var(--green)" stroke-width="${stroke}"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - clamped / 100)}" stroke-linecap="round"
        transform="rotate(-90 ${half} ${half})"/>
    </svg>
    <span class="ring-label">${label !== undefined ? esc(label) : `${pct}%`}</span>
  </div>`;
}

function avatar(student, size = 48) {
  return `<div class="initials" style="width:${size}px;height:${size}px;font-size:${size / 2.7}px" aria-label="${esc(student.fullName)}">${esc(initials(student.first, student.last))}</div>`;
}

function statusBarIcons() {
  return `<span class="sb-icons" aria-hidden="true">
    <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M8 11.5l2.3-2.6a3.2 3.2 0 0 0-4.6 0zM3.4 6.8a6.6 6.6 0 0 1 9.2 0l-1.4 1.6a4.5 4.5 0 0 0-6.4 0zM1 4.2a10 10 0 0 1 14 0l-1.4 1.6a7.9 7.9 0 0 0-11.2 0z"/></svg>
    <svg width="26" height="12" viewBox="0 0 26 12" fill="currentColor"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="19" height="8" rx="1.8"/><rect x="23.5" y="4" width="1.8" height="4" rx=".9" opacity=".4"/></svg>
  </span>`;
}

function tabBar() {
  const active = state.tab === "class" ? "roster" : state.tab === "progress" ? "progress" : "today";
  const items = [
    { id: "today", label: "Today", icon: "home", target: "home" },
    { id: "roster", label: "Roster", icon: "users", target: "class" },
    { id: "progress", label: "Progress", icon: "bars", target: "progress" },
  ];
  const behind = isBehindPace();
  return `<nav class="tabbar" aria-label="Main">${items
    .map(
      (it) => `<button class="tab${active === it.id ? " on" : ""}" data-action="go" data-arg="${it.target}"${active === it.id ? ' aria-current="page"' : ""}>
        <span class="tab-ico">${icon(it.icon, 24, 2)}${it.id === "progress" && behind ? '<span class="tab-dot"></span>' : ""}</span>
        <span>${it.label}</span>
      </button>`
    )
    .join("")}</nav>`;
}

/* ---------------- Practice logic ---------------- */

function practicePool() {
  const roster = activeSection().roster;
  if (state.focusQueue && state.focusQueue.length > 0) {
    const focused = roster.filter((s) => state.focusQueue.includes(s.id));
    if (focused.length > 0) return focused;
  }
  return roster;
}

// Pick the next student: a missed student who is due again first, otherwise a random
// name that isn't "confident" yet (skipping anyone already waiting to be re-asked).
function pickQuestion() {
  const roster = activeSection().roster;
  const pool = practicePool();
  const p = state.practice;
  const n = p.asked + 1; // the question number being picked
  const byId = (id) => pool.find((s) => s.id === id);
  p.reask = p.reask.filter((r) => byId(r.id)); // drop anyone no longer in the pool

  let from;
  const due = p.reask.find((r) => r.due <= n);
  if (due) {
    from = [byId(due.id)];
  } else {
    const waiting = p.reask.map((r) => r.id);
    const needing = pool.filter((s) => s.status !== "confident" && !waiting.includes(s.id));
    if (needing.length > 0) from = needing;
    else if (p.reask.length > 0) from = [byId(p.reask[0].id)]; // nobody else left: re-ask now
    else from = pool;
  }
  const student = from[Math.floor(Math.random() * from.length)];
  p.reask = p.reask.filter((r) => r.id !== student.id);
  p.asked = n;
  console.log("[pick]", student.fullName, "from", from.length, from.length === 1 ? "candidate" : "candidates");
  let options;
  if (state.mode === "easy") {
    const distractors = shuffle(roster.filter((s) => s.id !== student.id)).slice(0, 3);
    options = shuffle([student, ...distractors]).map((s) => ({ id: s.id, text: s.fullName, isCorrect: s.id === student.id }));
  } else {
    options = shuffle([
      { text: correctPhonetic(student), isCorrect: true },
      { text: mistakePhonetic(student), isCorrect: false },
    ]);
  }
  return { student, options };
}

function snapshotStatuses() {
  const snap = {};
  activeSection().roster.forEach((s) => {
    snap[s.id] = s.status;
  });
  return snap;
}

function startPractice(minutes) {
  stopTimer();
  // Build the session first, so pickQuestion() reads this round's re-ask list, not the last round's.
  state.practice = {
    question: null,
    asked: 0, // questions shown so far this round
    reask: [], // missed students to ask again soon: { id, due } where due is a question number
    picked: null, // index of the option the user tapped
    score: { correct: 0, total: 0 },
    duration: minutes,
    secondsLeft: minutes ? minutes * 60 : null,
    ended: false,
    startStatuses: minutes ? snapshotStatuses() : null,
  };
  state.practice.question = pickQuestion();
  if (minutes) startTimer();
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    const p = state.practice;
    if (!p || p.ended || p.duration === null) return stopTimer();
    p.secondsLeft -= 1;
    if (p.secondsLeft <= 0) {
      p.secondsLeft = 0;
      p.ended = true;
      stopTimer();
      render();
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

// Update just the timer, so the rest of the screen isn't redrawn every second.
function updateTimerDisplay() {
  const p = state.practice;
  const text = document.getElementById("timer-text");
  const timer = document.getElementById("timer");
  const fill = document.getElementById("track-fill");
  if (text) text.textContent = `${formatTime(p.secondsLeft)} left`;
  if (timer) timer.classList.toggle("low", p.secondsLeft <= 10);
  if (fill) fill.style.width = `${(1 - p.secondsLeft / (p.duration * 60)) * 100}%`;
}

function answer(index) {
  const p = state.practice;
  if (p.picked !== null) return;
  p.picked = index;
  const correct = p.question.options[index].isCorrect;
  p.score.correct += correct ? 1 : 0;
  p.score.total += 1;
  const s = p.question.student;
  if (correct) {
    s.status = s.status === "new" ? "learning" : "confident";
  } else {
    s.missedCount += 1;
    s.status = "learning";
    // Story 4: ask a missed student again within the next two questions.
    p.reask = p.reask.filter((r) => r.id !== s.id);
    p.reask.push({ id: s.id, due: p.asked + 2 });
  }
  console.log("[answer]", s.fullName, correct ? "RIGHT" : "MISS", "status:", s.status, "misses:", s.missedCount);
  render();
}

function nextQuestion() {
  const p = state.practice;
  p.picked = null;
  p.question = pickQuestion();
  render();
}

/* ---------------- Screens ---------------- */

function homeScreen() {
  const keys = Object.keys(state.sections);
  const rows = keys
    .map((k) => {
      const s = state.sections[k];
      const cov = coverageOf(s);
      return `<button class="list-row" data-action="pickSection" data-arg="${k}">
        <span class="letter">${k}</span>
        <span class="grow">
          <span class="row-title">${esc(sectionDescription(s.label))}</span>
          <span class="row-sub">${s.roster.length} students</span>
          <span class="bar"><span style="width:${cov}%"></span></span>
        </span>
        <span class="pct">${cov}%</span>
        ${icon("chevron", 18, 2.2, "chev")}
      </button>`;
    })
    .join("");

  return `${header(false)}
    <section class="hero">
      <div class="hero-copy">
        <h2 class="display">Pick a class to practice.</h2>
      </div>
      ${rotunda()}
    </section>
    <div class="section-head"><h2 class="h2">Your classes</h2><span class="meta">${keys.length} sections</span></div>
    <div class="card list">${rows}</div>
    <button class="add-row" data-action="go" data-arg="addClass">${icon("plus", 18, 2.6)} Add a class</button>`;
}

function classScreen() {
  const section = activeSection();
  const ui = state.classUi;
  const rows = section.roster
    .map((s) => {
      const m = statusOf(s);
      return `<div class="list-row">
        <span class="av-wrap">${avatar(s, 48)}
          <span class="av-badge av-${m.cls}" title="${m.label}">${icon(m.icon, 11, 3)}</span>
        </span>
        <div class="grow">
          <p class="row-title">${esc(s.fullName)}</p>
          <p class="pron ellipsis"><span class="status-word sw-${m.cls}">${m.label}</span>${s.pronunciation ? ` &middot; “${esc(s.pronunciation)}”` : ""}</p>
        </div>
        <button class="speak" data-action="speak" data-arg="${esc(s.fullName)}" aria-label="Hear ${esc(s.fullName)}">${icon("speaker", 17)}</button>
      </div>`;
    })
    .join("");

  return `${header(true)}
    <div class="page-title">
      <p class="eyebrow">Your class &middot; Section ${state.activeKey}</p>
      <h1 class="title">${esc(sectionDescription(section.label))}</h1>
    </div>
    <div class="stack">
      <button class="btn btn-primary" data-action="go" data-arg="sectionMenu">Practice these names ${icon("arrow", 18)}</button>
      <button class="btn btn-secondary" data-action="go" data-arg="progress">
        ${isBehindPace() ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--orange)" aria-label="Behind pace"></span>' : ""}
        View progress
      </button>
    </div>
    <div class="card canvas-card">
      <span class="icon-tile navy">${icon("cloud", 22)}</span>
      <span class="grow">
        <span class="row-title">Canvas roster</span>
        <span class="row-sub">${ui.syncing ? "Syncing…" : `Connected · ${section.roster.length} students · Synced ${esc(section.lastSync)}`}</span>
      </span>
      <button class="chip-btn" data-action="resync"${ui.syncing ? " disabled" : ""}>${ui.syncing ? "…" : `${icon("refresh", 14, 2.6)} Re-sync`}</button>
    </div>
    <div class="section-head"><h2 class="h2">Class roster</h2><span class="meta">${section.roster.length} students</span></div>
    <div class="card list">${rows}</div>
    ${ui.uploaded
      ? '<p class="link ok">Roster file uploaded</p>'
      : '<button class="link" data-action="upload">Roster missing someone? Upload a file instead</button>'}`;
}

function sectionMenuScreen() {
  const section = activeSection();
  const coverage = coverageOf(section);
  const missedCount = section.roster.filter((s) => s.missedCount > 0).length;
  const opt = (on, action, arg, label) =>
    `<button class="opt${on ? " on" : ""}" data-action="${action}" data-arg="${arg}" aria-pressed="${on}">${label}</button>`;
  const timers = [null, 1, 5, 10]
    .map((d) => opt(state.duration === d, "setDuration", d === null ? "none" : d, d === null ? "Untimed" : `${d} min`))
    .join("");

  return `${backLink("class", "Back to roster")}
    ${header(true)}
    <div class="card summary">
      <p class="eyebrow">Section ${state.activeKey}</p>
      <p class="summary-title">${esc(sectionDescription(section.label))}</p>
      <div class="summary-stats">
        <span><b>${section.roster.length}</b> students</span>
        <span><b>${coverage}%</b> confident</span>
        <span>Week <b>${state.week}</b> of ${TOTAL_WEEKS}</span>
      </div>
    </div>
    <p class="group-label">Which names</p>
    <div class="seg">
      ${opt(state.namesFilter === "all", "setFilter", "all", "All names")}
      ${opt(state.namesFilter === "missed", "setFilter", "missed", `Often missed (${missedCount})`)}
    </div>
    <p class="group-label">Mode</p>
    <div class="seg">
      <button class="opt tall${state.mode === "easy" ? " on" : ""}" data-action="setMode" data-arg="easy" aria-pressed="${state.mode === "easy"}">Easy Mode<small>Multiple choice</small></button>
      <button class="opt tall${state.mode === "hard" ? " on" : ""}" data-action="setMode" data-arg="hard" aria-pressed="${state.mode === "hard"}">Hard Mode<small>Pick the pronunciation</small></button>
    </div>
    <p class="group-label">Timer</p>
    <div class="seg">${timers}</div>
    <button class="btn btn-primary btn-lg" data-action="launch">Start practice ${icon("arrow", 20)}</button>`;
}

function practiceScreen() {
  const section = activeSection();
  const p = state.practice;
  const q = p.question.student;
  const answered = p.picked !== null;
  const answeredCorrectly = answered && p.question.options[p.picked].isCorrect;
  const acingEasy = state.mode === "easy" && p.score.total >= 3 && p.score.correct / p.score.total >= 0.9;

  // No logo or tab bar here: both lead out of practice, so "End practice" is the only way out.
  let html = `<div class="card session-card">
      <p class="eyebrow">${state.mode === "easy" ? "Easy mode" : "Hard mode"} &middot; Section ${state.activeKey}${state.focusQueue && state.focusQueue.length > 0 ? " &middot; Missed only" : ""}</p>
      <p class="session-title">${esc(sectionDescription(section.label))}</p>`;
  if (!p.ended) {
    html += `<div class="session-stats">
        <span>Class size<b>${section.roster.length}</b></span>
        <span class="grow">This session<b class="${p.score.total ? "" : "dim"}">${p.score.correct}/${p.score.total}</b></span>
        ${p.duration !== null
          ? `<span id="timer" class="timer${p.secondsLeft <= 10 ? " low" : ""}">${icon("clock", 17)} <span id="timer-text">${formatTime(p.secondsLeft)} left</span></span>`
          : ""}
      </div>`;
    if (p.duration !== null) {
      html += `<div class="track"><span id="track-fill" style="width:${(1 - p.secondsLeft / (p.duration * 60)) * 100}%"></span></div>`;
    }
  }
  html += `</div>`;

  if (p.ended) {
    html += recapView(section, p, acingEasy);
  } else {
    if (acingEasy && p.duration === null) {
      html += hardModeNudge(`${p.score.correct}/${p.score.total} and counting!`);
    }
    html += `<div class="card question">
        <div class="q-initials" aria-label="Student initials">${esc(initials(q.first, q.last))}</div>
        <p class="eyebrow center">${state.mode === "easy" ? "Who is this?" : "How do you say their name?"}</p>
        <h2 class="prompt">${state.mode === "easy" ? "Choose the name." : "Pick the pronunciation."}</h2>
      </div>`;

    const buttons = p.question.options
      .map((opt, i) => {
        let cls = "";
        if (answered && i === p.picked) cls = opt.isCorrect ? " correct" : " wrong";
        else if (answered && opt.isCorrect) cls = " correct";
        return `<button class="answer${state.mode === "hard" ? " phon" : ""}${cls}" data-action="answer" data-arg="${i}"${answered ? " disabled" : ""}>${esc(opt.text)}</button>`;
      })
      .join("");
    html += `<div class="answers${state.mode === "hard" ? " col" : ""}">${buttons}</div>`;

    if (answered) {
      html += `<div class="feedback ${answeredCorrectly ? "good" : "bad"}" role="status">
          <span class="fb-ico">${icon(answeredCorrectly ? "check" : "x", 18, 2.8)}</span>
          <div>
            <p class="fb-title">${answeredCorrectly ? `Nice, that's ${esc(q.first)}.` : `Missed. That's ${esc(q.fullName)}.`}</p>
          </div>
        </div>`;
    }
    if (state.mode === "hard" && answered) {
      html += `<button class="card hear" data-action="speak" data-arg="${esc(q.fullName)}">
          <span class="play">${icon("play", 24)}</span>
          <span class="grow">
            <span class="hear-label">Hear how to say it</span>
            <span class="hear-phon">${esc(correctPhonetic(q))}</span>
          </span>
        </button>`;
    }
    if (answered) {
      // Side by side after answering, so the whole question fits on one screen.
      return `${html}<div class="btn-row">
          <button class="btn btn-secondary" data-action="go" data-arg="class">End practice</button>
          <button class="btn btn-primary" data-action="next">Next name ${icon("arrow", 18)}</button>
        </div>`;
    }
  }

  html += `<button class="btn btn-secondary" data-action="go" data-arg="class">End practice</button>`;
  return html;
}

function hardModeNudge(title) {
  return `<div class="nudge">
    <div class="grow"><p class="nudge-title">${title}</p><p class="nudge-sub">Ready to try Hard Mode?</p></div>
    <button class="chip-btn solid" data-action="tryHard">Try it</button>
  </div>`;
}

function recapView(section, p, acingEasy) {
  const newlyConfident = p.startStatuses
    ? section.roster.filter((s) => p.startStatuses[s.id] !== "confident" && s.status === "confident").length
    : 0;
  const stillShaky = section.roster.filter((s) => s.status !== "confident").sort((a, b) => b.missedCount - a.missedCount);

  let html = `<section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Session recap</p>
        <h2 class="display">${p.duration} minute${p.duration === 1 ? "" : "s"} well spent.</h2>
        <p class="lede">${newlyConfident} ${newlyConfident === 1 ? "name" : "names"} went from shaky to sure.${stillShaky.length > 0 ? ` ${stillShaky.length} still worth a glance.` : ""}</p>
      </div>
      ${rotunda()}
    </section>
    <div class="card stat-split" style="margin-bottom:14px">
      <div class="split-cell">
        <p class="big-num">${newlyConfident}</p>
        <p class="split-label">newly confident</p>
        ${pill("sure", "check", `Score ${p.score.correct}/${p.score.total}`)}
      </div>
      <div class="split-cell">
        <p class="split-cap">Roster confidence</p>
        ${ring(coverageOf(section))}
        <p class="split-note">Names you feel sure about</p>
      </div>
    </div>`;

  if (acingEasy) html += hardModeNudge("Acing Easy Mode!");

  if (stillShaky.length > 0) {
    const rows = stillShaky
      .slice(0, 5)
      .map(
        (s) => `<div class="list-row">${avatar(s, 44)}
          <div class="grow"><p class="row-title">${esc(s.fullName)}</p>${s.pronunciation ? `<p class="pron">“${esc(s.pronunciation)}”</p>` : ""}</div>
          ${statusPill(s)}
        </div>`
      )
      .join("");
    html += `<div class="section-head" style="margin-top:8px"><h2 class="h2">Still worth a glance</h2></div>
      <div class="card list" style="margin-bottom:16px">${rows}${stillShaky.length > 5 ? `<p class="more">+${stillShaky.length - 5} more</p>` : ""}</div>`;
  }

  html += `<div class="stack" style="margin-bottom:10px">
      <button class="btn btn-primary" data-action="goAgain">Go again ${icon("arrow", 18)}</button>
      <button class="btn btn-secondary" data-action="untimed">Untimed practice</button>
    </div>`;
  return html;
}

function progressScreen() {
  const section = activeSection();
  const coverage = coverageOf(section);
  const expected = Math.round((state.week / TOTAL_WEEKS) * 100);
  const behind = coverage < expected - 5;
  const ahead = coverage > expected + 5;
  const sure = section.roster.filter((s) => s.status === "confident").length;
  // Everyone not yet sure: most-missed first, then shaky, then new.
  const needs = section.roster
    .filter((s) => s.status !== "confident")
    .sort((a, b) => b.missedCount - a.missedCount || (a.status === "learning" ? -1 : 0) - (b.status === "learning" ? -1 : 0));
  const shown = state.showAllNeeds ? needs : needs.slice(0, 3);

  const needsRows = shown.length === 0
    ? '<p class="empty">Everyone is sure. Nice work.</p>'
    : shown
        .map(
          (s) => `<div class="list-row">${avatar(s, 44)}
            <div class="grow"><p class="row-title">${esc(s.fullName)}</p>${s.pronunciation ? `<p class="pron ellipsis">“${esc(s.pronunciation)}”</p>` : ""}</div>
            ${s.missedCount > 0 ? pill("missed", null, `Missed ${s.missedCount}&times;`) : statusPill(s)}
          </div>`
        )
        .join("");

  return `${backLink("class", "Back to roster")}
    ${header(true)}
    <div class="page-title">
      <p class="eyebrow">Progress &middot; Section ${state.activeKey}</p>
      <h1 class="title">${esc(sectionDescription(section.label))}</h1>
    </div>
    <div class="pace ${behind ? "behind" : ahead ? "ahead" : "even"}">
      ${icon(behind ? "warning" : ahead ? "check" : "tilde", 18, 2.4)}
      ${behind ? "Behind pace." : ahead ? "Ahead of pace." : "On pace."}
    </div>
    <div class="card stat-split">
      <div class="split-cell">
        <p class="split-cap">Week</p>
        <p class="big-num">${state.week}</p>
        <p class="split-label">of ${TOTAL_WEEKS}</p>
        <div class="mini-track"><span style="width:${expected}%"></span></div>
      </div>
      <div class="split-cell">
        <p class="split-cap">Covered</p>
        ${ring(coverage, `${sure}/${section.roster.length}`)}
        <p class="split-note">${coverage}% of your roster</p>
      </div>
    </div>
    <div class="section-head"><h2 class="h2">Names that need practice</h2><span class="meta">${needs.length} of ${section.roster.length}</span></div>
    <div class="card list">${needsRows}</div>
    ${needs.length > 3
      ? `<button class="link" data-action="toggleNeeds">${state.showAllNeeds ? "Show fewer" : `Show all ${needs.length}`}</button>`
      : ""}
    ${shown.length > 0
      ? `<button class="btn btn-primary mt" data-action="practiceMissed" data-arg="${shown.map((s) => s.id).join(",")}">Practice these names ${icon("arrow", 18)}</button>`
      : ""}`;
}

// A Canvas course counts as added once one of the sections came from it.
function isCourseAdded(id) {
  return Object.values(state.sections).some((s) => s.courseId === id);
}

function firstOpenCourse() {
  const course = CANVAS_COURSES.find((c) => !isCourseAdded(c.id));
  return course ? course.id : null;
}

function courseList() {
  const { picked, query } = state.addClass;
  return CANVAS_COURSES.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    .map((c) => {
      const added = isCourseAdded(c.id);
      const on = !added && picked === c.id;
      return `<button class="course${on ? " on" : ""}" data-action="pickCourse" data-arg="${c.id}" aria-pressed="${on}"${added ? ' disabled style="opacity:.55"' : ""}>
        <span class="grow"><span class="row-title">${esc(c.name)}</span><span class="row-sub">${added ? "Already added" : `${c.size} students`}</span></span>
        <span class="radio">${on ? icon("check", 14, 3) : ""}</span>
      </button>`;
    })
    .join("");
}

function addClassScreen() {
  return `${backLink("home", "Back")}
    <div class="page-title" style="margin-top:16px">
      <p class="eyebrow">Canvas import</p>
      <h1 class="title">Add a class</h1>
      <p class="lede">Choose a course from Canvas to import its roster.</p>
    </div>
    <label class="search">${icon("search", 20)}
      <input id="course-search" value="${esc(state.addClass.query)}" placeholder="Search your Canvas courses">
    </label>
    <div id="course-list">${courseList()}</div>
    <p class="link" style="margin:6px 0 18px">Canvas not working? Upload a roster file instead</p>
    ${firstOpenCourse()
      ? `<button class="btn btn-primary" data-action="importCourse">Import course ${icon("arrow", 18)}</button>`
      : '<p class="empty" style="text-align:center">All your Canvas courses are already added.</p>'}`;
}

function moderatorPanel() {
  return `<div class="mod">
    <button class="mod-toggle" data-action="toggleMod" aria-expanded="${state.modOpen}">${state.modOpen ? "Hide moderator controls ▴" : "Moderator controls ▾"}</button>
    ${state.modOpen
      ? `<div class="mod-body">
          <label>Current week: <b id="week-num" style="color:var(--ink)">${state.week}</b> of ${TOTAL_WEEKS}
            <input id="week-slider" type="range" min="1" max="${TOTAL_WEEKS}" value="${state.week}" step="1">
          </label>
          <button class="mod-reset" data-action="reset">Reset all progress</button>
        </div>`
      : ""}
  </div>`;
}

/* ---------------- Rendering ---------------- */

const SCREENS = {
  home: homeScreen,
  class: classScreen,
  sectionMenu: sectionMenuScreen,
  practice: practiceScreen,
  progress: progressScreen,
  addClass: addClassScreen,
};

let lastRenderedTab = null;

function render() {
  const oldScroll = document.querySelector(".scroll");
  const keepScroll = lastRenderedTab === state.tab && oldScroll ? oldScroll.scrollTop : 0;

  document.getElementById("root").innerHTML = `<div class="phone"><div class="screen">
      <div class="statusbar"><span>9:41</span>${statusBarIcons()}</div>
      <div class="scroll${state.tab !== "practice" ? " with-mod" : ""}">${SCREENS[state.tab]()}</div>
      ${state.tab !== "addClass" && state.tab !== "practice" ? tabBar() : ""}
      <div class="home-ind"></div>
    </div></div>`;
  // Hidden during practice: without the tab bar the floating button would cover the answers.
  document.getElementById("mod-root").innerHTML = state.tab === "practice" ? "" : moderatorPanel();

  document.querySelector(".scroll").scrollTop = keepScroll;
  lastRenderedTab = state.tab;

  // Every change on screen goes through render(), so saving here keeps progress current.
  saveProgress(state);
}

/* ---------------- Navigation and actions ---------------- */

function go(tab) {
  if (state.tab === "practice" && tab !== "practice") stopTimer();
  if (tab === "class") state.classUi = { syncing: false, uploaded: false };
  if (tab === "addClass") state.addClass = { picked: firstOpenCourse(), query: "" };
  if (tab === "practice") startPractice(state.duration);
  if (tab !== state.tab) state.showAllNeeds = false;
  state.tab = tab;
  render();
}

function resetAll() {
  stopTimer();
  clearProgress();
  Object.assign(state, {
    sections: seedProgress(initialSections()),
    activeKey: "E",
    mode: "easy",
    duration: null,
    namesFilter: "all",
    week: 5,
    focusQueue: null,
    practice: null,
  });
  go("home");
}

const ACTIONS = {
  go: (arg) => go(arg),
  pickSection: (key) => {
    state.activeKey = key;
    go("class");
  },
  speak: (name) => speak(name),
  resync: () => {
    state.classUi.syncing = true;
    render();
    setTimeout(() => {
      activeSection().lastSync = "just now";
      state.classUi.syncing = false;
      if (state.tab === "class") render();
      else saveProgress(state);
    }, 900);
  },
  upload: () => {
    state.classUi.uploaded = true;
    render();
  },
  setFilter: (v) => {
    state.namesFilter = v;
    render();
  },
  setMode: (v) => {
    state.mode = v;
    render();
  },
  setDuration: (v) => {
    state.duration = v === "none" ? null : Number(v);
    render();
  },
  launch: () => {
    if (state.namesFilter === "missed") {
      const ids = activeSection().roster.filter((s) => s.missedCount > 0).map((s) => s.id);
      state.focusQueue = ids.length > 0 ? ids : null;
    } else {
      state.focusQueue = null;
    }
    go("practice");
  },
  answer: (i) => answer(Number(i)),
  next: () => nextQuestion(),
  tryHard: () => {
    state.mode = "hard";
    go("sectionMenu");
  },
  goAgain: () => {
    startPractice(state.practice.duration);
    render();
  },
  untimed: () => {
    startPractice(null);
    render();
  },
  practiceMissed: (ids) => {
    state.focusQueue = ids.split(",");
    go("practice");
  },
  toggleNeeds: () => {
    state.showAllNeeds = !state.showAllNeeds;
    render();
  },
  pickCourse: (id) => {
    state.addClass.picked = id;
    document.getElementById("course-list").innerHTML = courseList();
  },
  importCourse: () => {
    const course = CANVAS_COURSES.find((c) => c.id === state.addClass.picked);
    if (!course || isCourseAdded(course.id)) return;
    const used = Object.keys(state.sections);
    const letter = "FGHIJKLMNOPQRSTUVWXYZ".split("").find((l) => !used.includes(l)) || "X";
    const name = course.name.split(":")[1] ? course.name.split(":")[1].trim() : course.name;
    state.sections[letter] = {
      label: `Section ${letter}: ${name}`,
      courseId: course.id,
      canvasSynced: true,
      lastSync: "just now",
      roster: canvasRoster(course),
    };
    state.activeKey = letter;
    go("class");
  },
  toggleMod: () => {
    state.modOpen = !state.modOpen;
    render();
  },
  reset: () => resetAll(),
};

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const handler = ACTIONS[el.dataset.action];
  if (handler) handler(el.dataset.arg);
});

document.addEventListener("input", (e) => {
  if (e.target.id === "course-search") {
    state.addClass.query = e.target.value;
    document.getElementById("course-list").innerHTML = courseList();
  }
  if (e.target.id === "week-slider") {
    // While dragging, only update the number; redraw the app when the drag ends.
    state.week = Number(e.target.value);
    document.getElementById("week-num").textContent = state.week;
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "week-slider") {
    render();
    const slider = document.getElementById("week-slider");
    if (slider) slider.focus();
  }
});

render();
