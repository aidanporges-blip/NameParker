/* Guess Hoo? (Name Parker) data: the "model" in MVC terms.
   FAKE STUDENTS ONLY. Never put real student names or photos in this file. */

// Names used when a new class is "imported" from Canvas.
const NAME_POOL = [
  ["Jordan", "Smith"],
  ["Maya", "Chen"],
  ["Devon", "Brooks"],
  ["Elena", "Vasquez"],
  ["Marcus", "Reed"],
  ["Fatima", "Al-Sayed"],
  ["Grace", "Kim"],
  ["Noah", "Patel"],
  ["Lucia", "Moreno"],
  ["Theo", "Anders"],
];

// One student record. Status moves new -> learning -> confident.
function makeStudent(first, last, pronunciation, mistakePronunciation) {
  return {
    id: `${first}-${last}-${Math.random().toString(36).slice(2, 7)}`,
    first,
    last,
    fullName: `${first} ${last}`,
    pronunciation: pronunciation || null,
    mistakePronunciation: mistakePronunciation || null,
    status: "new",
    missedCount: 0,
  };
}

// Four fake students with names that are easy to mispronounce,
// used to test Hard Mode (pick the pronunciation).
function testStudents() {
  return [
    makeStudent("Siobhan", "Murphy", "shih-VAWN MUR-fee", "see-OH-ban MUR-fee"),
    makeStudent("Xochitl", "Ramirez", "SO-cheel rah-MEER-ez", "ZOH-chit-ul RAM-ih-rez"),
    makeStudent("Saoirse", "Kelly", "SEER-shuh KEL-ee", "say-OR-see KEL-ee"),
    makeStudent("Kwabena", "Mensah", "kwah-BEH-nah MEN-sah", "KWAB-uh-nuh men-SAH"),
  ];
}

function initialSections() {
  return {
    E: {
      label: "Section E: Digital Product Design",
      canvasSynced: true,
      lastSync: "2h ago",
      roster: [
        ...testStudents(),
        makeStudent("Priya", "Natarajan", "PREE-yuh nuh-TAH-ruh-jun", "PRY-uh NAT-uh-RAY-jun"),
        makeStudent("Jordan", "Smith"),
        makeStudent("Maya", "Chen"),
        makeStudent("Devon", "Brooks"),
        makeStudent("Elena", "Vasquez"),
        makeStudent("Marcus", "Reed"),
        makeStudent("Fatima", "Al-Sayed", "fah-TEE-mah al-sy-YED", "FAT-ih-muh AL-say-ed"),
        makeStudent("Grace", "Kim"),
      ],
    },
    D: {
      label: "Section D: Research Seminar",
      canvasSynced: true,
      lastSync: "1d ago",
      roster: [
        makeStudent("Noah", "Patel"),
        makeStudent("Lucia", "Moreno"),
        makeStudent("Theo", "Anders"),
        makeStudent("Ivy", "Okafor"),
        makeStudent("Sam", "Whitfield"),
        makeStudent("Ana", "Petrova"),
      ],
    },
    C: {
      label: "Section C: World History Survey",
      canvasSynced: true,
      lastSync: "3h ago",
      roster: [
        makeStudent("Leo", "Nakamura"),
        makeStudent("Rosa", "Delgado"),
        makeStudent("Kwame", "Boateng"),
        makeStudent("Hana", "Suzuki"),
        makeStudent("Owen", "Fitzgerald"),
        makeStudent("Nadia", "Hussain"),
        makeStudent("Cole", "Bennett"),
        makeStudent("Yuki", "Tanaka"),
        makeStudent("Femi", "Adeyemi"),
        makeStudent("Willa", "Stone"),
      ],
    },
    T: {
      label: "Section T: Testing Roster (4 students)",
      canvasSynced: true,
      lastSync: "just now",
      roster: testStudents(),
    },
  };
}

// Starting progress for the demo, so Section E has some sure and shaky names.
function seedProgress(sections) {
  const e = sections.E.roster;
  e[0].status = "confident";
  e[1].status = "confident";
  e[2].status = "confident";
  e[3].status = "learning";
  e[3].missedCount = 5;
  e[4].status = "learning";
  e[4].missedCount = 4;
  e[5].status = "learning";
  e[5].missedCount = 3;
  e[6].status = "learning";
  return sections;
}

// Fake Canvas courses for the "Add a class" screen.
const CANVAS_COURSES = [
  { id: "hist210", name: "HIST 210: Modern Europe", size: 45 },
  { id: "hist301", name: "HIST 301: Research Seminar", size: 12 },
  { id: "hist150", name: "HIST 150: World History Survey", size: 110 },
];

// Fake classmates for the "How you compare" leaderboard.
const LEADERBOARD_OTHERS = [
  { name: "R. Alvarez", pct: 78 },
  { name: "J. Okafor", pct: 61 },
  { name: "M. Chen", pct: 39 },
];
