// ═══════════════════════════════════════════════════════════
//  tests_helpers.js — Shared test state factories
//  Provides global helpers: fillRoster, makeState, makeHold,
//  makeBattle, makeMission, testMission
//  NOTE: window.__testUtils is defined INLINE in tests.html
//        (assert, localStorage mock, etc.) — DO NOT override it here.
// ═══════════════════════════════════════════════════════════

window.TESTS = window.TESTS || [];

// ── Helper: build a roster array with N placeholder crew members ──
const fillRoster = (n) => {
  const roster = [];
  for (let i = 0; i < n; i++) {
    roster.push({
      firstName: "Crew",
      lastName: "Member" + i,
      role: "deckhand",
      faction: "pirate",
      daysAboard: 0,
      id: "test_crew_" + i,
    });
  }
  return roster;
};

// ── Default hold items (all zeroed except food/water) ──
const defaultHoldItems = () => ({
  food: 8, water: 8,
  rum: 0, sugar: 0, timber: 0, cloth: 0, spices: 0, silk: 0,
  coffee: 0, cocoa: 0, weapons: 0, tobacco: 0, silver: 0, slaves: 0,
});

// ── State factory for tests ──
// Usage: makeState({ gold: 5000, fame: 100 })
const makeState = (overrides = {}) => {
  const D = window.D;
  const base = {
    version: 1,
    screen: "port",
    day: 1,
    log: [],
    gold: 1000,
    fame: 0,
    infamy: 0,
    currentPort: "portRoyal",
    previousPort: null,
    destination: null,
    sailingDaysLeft: 0,
    sailingDaysTotal: 0,
    wind: { angle: 0, speed: 15 },
    ship: {
      type: "sloop",
      name: "Test Vessel",
      hull: 100,
      upgrades: [],
    },
    crew: {
      roster: fillRoster(10),
      max: 40,
      morale: 70,
    },
    hold: {
      items: defaultHoldItems(),
      capacity: 200,
    },
    reputation: Object.fromEntries(
      Object.keys(D.PORTS).map(k => [k, 50])
    ),
    missions: [],
    activeMission: null,
    battleState: null,
    encounterContext: null,
    activeEvent: null,
    portMarket: null,
    discoveredPorts: Object.keys(D.PORTS).filter(k => !D.PORTS[k].hidden),
    mapFragments: [],
  };
  return { ...base, ...overrides };
};

// ── Make a hold object with custom items ──
// Usage: makeHold({ food: 20, rum: 5 }, 300)
const makeHold = (items = {}, capacity = 200) => ({
  items: { ...defaultHoldItems(), ...items },
  capacity,
});

// ── Make a battle state for testing ──
const makeBattle = (overrides = {}) => ({
  phase: "active",
  round: 1,
  playerHull: 100,
  enemyHull: 50,
  enemyCrew: 15,
  enemy: {
    name: "Test Enemy",
    faction: "pirate",
    ship: "sloop",
    hull: 50,
    maxHull: 50,
    cannons: 8,
    crew: 15,
  },
  canPlunder: false,
  goldReward: 0,
  enemyCargo: {},
  log: [],
  returnScreen: "sailing",
  encounterType: "random",
  ...overrides,
});

// ── Make a mission object for testing ──
const makeMission = (overrides = {}) => ({
  name: "Test Mission",
  type: "escort",
  faction: "english",
  risk: "low",
  targetPort: "kingston",
  gold: 500,
  fame: 1,
  infamyGain: 0,
  repImpact: { english: 2 },
  enemy: null,
  description: "A test mission.",
  ...overrides,
});

// ── Legacy alias: testMission (backward compat) ──
const testMission = makeMission;
