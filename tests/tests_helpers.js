// tests_helpers.js — Shared helpers for the test suite
// Initialises window.TESTS if needed, provides fillRoster, makeState, testMission

window.TESTS = window.TESTS || [];

// ── Helper: build a roster array with N placeholder crew members ──
const fillRoster = (n) => {
  const roster = [];
  for (let i = 0; i < n; i++) {
    roster.push({
      firstName: "Crew",
      lastName: "Member",
      role: "deckhand",
      faction: "pirate",
      daysAboard: 0,
      id: Math.random().toString(36).slice(2) + i,   // unique
    });
  }
  return roster;
};

// ── State factory for tests (already updated) ──
const makeState = (overrides = {}) => {
  const base = {
    screen: "port",
    day: 1,
    log: [],
    gold: 1000,
    fame: 0,
    currentPort: "portRoyal",
    previousPort: null,
    destination: null,
    sailingDaysLeft: 0,
    sailingDaysTotal: 0,
    wind: { angle: 45, speed: 10 },
    ship: { type: "sloop", name: "Sea Dog", hull: 100, cannons: 10, upgrades: [] },
    crew: {
      roster: fillRoster(30),   // 30 crew members
      max: 50,
      morale: 80,
    },
    missions: [],
    activeMission: null,
    reputation: {},
    battleState: null,
    activeEvent: null,
    encounterContext: null,
  };
  Object.keys(D.PORTS).forEach(p => { base.reputation[p] = 50; });
  return { ...base, ...overrides };
};

// ── Minimal mission fixture for tests ──
const testMission = (overrides = {}) => ({
  type: "escort", name: "Test Escort", description: "Test.",
  faction: "english", targetPort: "nassau", risk: "low",
  gold: 300, fame: 1, infamyGain: 0, requiredFame: 0,
  repImpact: { english: 2 }, enemy: null,
  ...overrides
});

// ── Helper: count how many Math.random() calls an action will make ──
// This helps ensure random sequences are long enough for combat tests
const countRandomCalls = (action) => {
  const counts = {
    broadside: 6,
    precision: 7,
    grapple: 5,
    evade: 5,
  };
  return counts[action] || 10; // Default to 10 if unknown
};

// ── Helper: generate a sufficiently long random sequence for combat tests ──
const setRandomSequenceForCombat = (u, action, extraPadding = 5) => {
  const count = countRandomCalls(action);
  const values = Array(count + extraPadding).fill(0.5);
  u.setRandomSequence(values);
};
