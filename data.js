/* Guess Hoo? (Name Parker) data: the "model" in MVC terms.
   FAKE STUDENTS ONLY. Never put real student names or photos in this file. */

// Made-up names used to build the rosters of classes "imported" from Canvas.
// 40 first names and 40 last names, so even a big class has no repeats.
const FIRST_NAMES = [
  "Aaron", "Bianca", "Caleb", "Dalia", "Ethan", "Farah", "Gabriel", "Hannah", "Isaac", "Jasmine",
  "Kenji", "Layla", "Mateo", "Nora", "Oscar", "Paloma", "Quentin", "Rhea", "Silas", "Tara",
  "Umar", "Valeria", "Wesley", "Ximena", "Yusuf", "Zoe", "Adrian", "Beatriz", "Corey", "Daphne",
  "Emeka", "Freya", "Hugo", "Imani", "Jonah", "Keira", "Luca", "Mira", "Nikhil", "Olivia",
];
const LAST_NAMES = [
  "Abara", "Bianchi", "Castillo", "Dawson", "Eriksen", "Ferreira", "Garner", "Haddad", "Ibarra", "Jansen",
  "Kowalski", "Lindqvist", "Mwangi", "Novak", "Osei", "Park", "Quinn", "Rossi", "Sato", "Torres",
  "Ueda", "Varga", "Walsh", "Xu", "Yilmaz", "Zhang", "Asante", "Brennan", "Cruz", "Dubois",
  "Ellis", "Fonseca", "Gupta", "Holloway", "Iyer", "Jovanovic", "Kaur", "Laurent", "Moyo", "Nguyen",
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

// Section E is the main demo class.
// Section D is a six-person class for usability prompt 5 (reach full coverage).
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
// "offset" picks where each course starts in the name lists, so each course has its own students.
const CANVAS_COURSES = [
  { id: "hist210", name: "HIST 210: Modern Europe", size: 15, offset: 0 },
  { id: "hist301", name: "HIST 301: Research Seminar", size: 12, offset: 15 },
  { id: "hist150", name: "HIST 150: World History Survey", size: 20, offset: 27 },
];

// The roster a course brings in when imported. Always the same students for the same course.
// Classes are smaller than the 40 first names, so no one in a class shares a first name.
function canvasRoster(course) {
  const roster = [];
  for (let i = 0; i < course.size; i++) {
    const first = FIRST_NAMES[(course.offset + i) % FIRST_NAMES.length];
    const last = LAST_NAMES[(course.offset + i * 7) % LAST_NAMES.length];
    roster.push(makeStudent(first, last));
  }
  return roster;
}
