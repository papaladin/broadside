// tests_helpers.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared factories, dispatch wrapper, and RNG control for all test suites.
// Loaded by tests.html after all game files have initialised.
// Exposed as window.testHelpers — each test file destructures what it needs.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── RNG control ────────────────────────────────────────────────────────────
  // Store the real Math.random once, at module load time.
  const _realRandom = Math.random;
  let _sequence = null;
  let _seqIndex = 0;

  // Replace Math.random with a deterministic sequence for a single test.
  // Call resetRandomStub() in a finally block or after every seeded test.
  const setRandomSequence = (values) => {
    _sequence = values;
    _seqIndex = 0;
    Math.random = () => {
      if (_seqIndex >= _sequence.length) {
        // Wrap rather than throw so a test that overestimates doesn't crash
        // the whole suite — but log so the test author knows.
        console.warn(
          `[testHelpers] setRandomSequence: sequence exhausted after ${_sequence.length} calls — wrapping.`
        );
        _seqIndex = 0;
      }
      return _sequence[_seqIndex++];
    };
  };

  const resetRandomStub = () => {
    Math.random = _realRandom;
    _sequence = null;
    _seqIndex = 0;
  };

  // ── State factory ──────────────────────────────────────────────────────────
  // Always derives from the real initialState so it stays structurally valid
  // even as new fields are added to the game. Callers only specify what they
  // need to change. Nested objects must be overridden in full (no deep merge)
  // to avoid partial-state surprises — use the sub-factories below instead.

  const makeState = (overrides = {}) => ({
    ...JSON.parse(JSON.stringify(window.E.initialState)),
    ...overrides,
  });

  // ── Crew factories ─────────────────────────────────────────────────────────

  const makeCrewMember = (overrides = {}) => ({
    id: `crew_test_${Math.floor(_realRandom() * 1e6)}`,
    firstName: "Test",
    lastName: "Sailor",
    role: "deckhand",
    faction: "english",
    daysAboard: 0,
    tags: [],
    bio: "A reliable sailor. No notable history.",
    ...overrides,
  });

  // Returns an array of n crew members with unique sequential ids.
  const fillRoster = (count = 5, memberOverrides = {}) =>
    Array.from({ length: count }, (_, i) =>
      makeCrewMember({
        id: `crew_${i}`,
        firstName: `Sailor`,
        lastName: `${i + 1}`,
        ...memberOverrides,
      })
    );

  // ── Ship state helper ──────────────────────────────────────────────────────
  // Returns a ship object suitable for state.ship, with a clean equipment map.

  const makeShip = (type = "sloop", overrides = {}) => {
    const shipData = window.D.SHIPS[type];
    if (!shipData) throw new Error(`makeShip: unknown ship type "${type}"`);
    return {
      type,
      name: shipData.name,
      hull: shipData.maxHull,
      cannons: shipData.cannons,
      equipment: { hull: [], armament: [], rigging: [], special: [] },
      ...overrides,
    };
  };

  // ── Hold factory ───────────────────────────────────────────────────────────
  // Returns state.hold — no capacity field (use L.getHoldCapacity(state)).

  const makeHold = (itemOverrides = {}) => ({
    items: {
      food: 0, water: 0,
      rum: 0, sugar: 0, timber: 0, cloth: 0, spices: 0, silk: 0,
      coffee: 0, cocoa: 0, weapons: 0, tobacco: 0, silver: 0, slaves: 0,
      ...itemOverrides,
    },
  });

  // ── Battle state factory ───────────────────────────────────────────────────
  // Matches the shape produced by E.createBattleState.

  const makeEnemy = (overrides = {}) => ({
    name: "The Test Brigand",
    faction: "pirate",
    shipType: "sloop",
    hull: 100,
    maxHull: 100,
    cannons: 10,
    crew: 20,
    speed: 8,
    gold: 200,
    ...overrides,
  });

  const makeBattle = (stateForContext, enemyOverrides = {}, battleOverrides = {}) => {
    const enemy = makeEnemy(enemyOverrides);
    // Use the real createBattleState so the shape is always authoritative.
    const base = window.E.createBattleState(stateForContext, enemy, "Battle engaged.", "random");
    return { ...base, ...battleOverrides };
  };

  // ── Mission factory ────────────────────────────────────────────────────────

  const makeMission = (overrides = {}) => ({
    id: "test_mission_1",
    type: "trade",
    name: "Test Delivery",
    faction: "english",
    risk: "low",
    targetPort: "portRoyal",
    description: "Deliver goods to Port Royal.",
    gold: 200,
    fame: 1,
    requiredGood: "sugar",
    requiredQty: 5,
    status: "active",
    daysToComplete: 10,
    acceptedDay: 1,
    enemyDefeated: false,
    tutorial: false,
    starter: false,
    repImpacts: [],
    ...overrides,
  });

  // ── Common state presets ───────────────────────────────────────────────────
  // These are the "arrange" building blocks most engine tests start with.

  // Player docked at a port, sloop, 10 crew, no active mission.
  const makePortState = (portKey = "portRoyal", extraOverrides = {}) =>
    makeState({
      screen: "port",
      currentPort: portKey,
      gold: 1000,
      faction: "english",
      captainName: "Test Captain",
      tutorialMode: "none",
      ship: makeShip("sloop"),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold({ food: 20, water: 20 }),
      activeMission: null,
      onboarding: {
        ...window.E.initialState.onboarding,
        enabled: false,
        completed: true,
      },
      ...extraOverrides,
    });

  // Player mid-voyage toward a port.
  const makeSailingState = (
    fromPort = "portRoyal",
    toPort = "tortuga",
    daysLeft = 3,
    extraOverrides = {}
  ) => {
    const fromPos = window.D.PORTS[fromPort]?.position ?? { x: 400, y: 230 };
    const toPos   = window.D.PORTS[toPort]?.position   ?? { x: 480, y: 200 };
    return makeState({
      screen: "sailing",
      currentPort: fromPort,
      destination: toPort,
      sailingDaysLeft: daysLeft,
      sailingDaysTotal: daysLeft + 1,
      faction: "english",
      captainName: "Test Captain",
      tutorialMode: "none",
      ship: makeShip("sloop"),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold({ food: 20, water: 20 }),
      route: {
        originPort: fromPort,
        destinationPort: toPort,
        originPos: fromPos,
        destinationPos: toPos,
        progressDays: 1,
        totalDays: daysLeft + 1,
        enduranceBudget: 10,
        enduranceSpent: 1,
      },
      onboarding: {
        ...window.E.initialState.onboarding,
        enabled: false,
        completed: true,
      },
      ...extraOverrides,
    });
  };

  // Player mid-battle — pre-built battleState attached to a port state.
const makeBattleState = (battleOverrides = {}, stateOverrides = {}) => {
  const base = makePortState("portRoyal", stateOverrides);
  const enemy = makeEnemy();
  const battle = {
    round: 1,
    log: [],
    playerHull: 100,
    playerCrew: 10,
    initialPlayerCrew: 10,
    lostCrewNames: [],
    enemyHull: enemy.hull,
    enemyCrew: enemy.crew,
    distance: "medium",
    subPhase: "naval",
    phase: "player_turn",
    ...battleOverrides,
  };
  const session = {
    type: "random",
    phase: "battle",
    enemy: enemy,
    battle: battle,
    intercept: null,
    plunder: null,
    returnScreen: "port",
    source: { kind: "random", id: null },
    modifiers: [],
    notableNPCId: null,
  };
  return { ...base, screen: "battle", encounterSession: session };
};

  // ── Dispatch wrapper ───────────────────────────────────────────────────────
  // Thin wrapper so tests read cleanly: const s2 = dispatch(s, A.REPAIR);

  const dispatch = (state, type, payload = {}) =>
    window.E.reducer(state, { type, ...payload });

  // ── Expose ─────────────────────────────────────────────────────────────────
  window.testHelpers = {
    // RNG control
    setRandomSequence,
    resetRandomStub,
    // Factories
    makeState,
    makeCrewMember,
    fillRoster,
    makeShip,
    makeHold,
    makeEnemy,
    makeBattle,
    makeMission,
    // Preset states
    makePortState,
    makeSailingState,
    makeBattleState,
    // Dispatch
    dispatch,
  };
})();