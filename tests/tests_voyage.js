// tests_voyage.js
// Deterministic tests for the voyage reducer's orchestration logic.
// These test the ADVANCE_DAY pipeline without relying on stochastic outcomes
// by using setRandomSequence and mocking helper functions where necessary.

(function () {
  "use strict";

  const {
    makeState, makePortState, makeSailingState, makeBattleState,
    makeCrewMember, fillRoster, makeShip, makeHold, makeMission,
    makeEnemy, dispatch,
    setRandomSequence, resetRandomStub,
  } = window.testHelpers;

  const A = window.E.A;
  const D = window.D;
  const L = window.L;

  const reg = (id, name, run) =>
    window._tests.push({ id, name, run });

  // ──────────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────────

  // Create a sailing state with a route and specific settings
  const makeVoyageState = (overrides = {}) => {
    const s = makeSailingState("portRoyal", "tortuga", 3, {
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      hold: makeHold({ food: 20, water: 20 }),
      gold: 1000,
      ...overrides,
    });
    return s;
  };

  // ──────────────────────────────────────────────────────────────
  // V.ADVANCE.01 – Provisions consumed
  // ──────────────────────────────────────────────────────────────

  reg("V.ADVANCE.01", "ADVANCE_DAY: consumes provisions based on crew size", (u) => {
    const s0 = makeVoyageState({
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold({ food: 20, water: 20 }),
    });
    const s1 = dispatch(s0, A.ADVANCE_DAY);
    // 10 crew -> 1 food, 1 water per day
    u.assertEqual(s1.hold.items.food, 19, "food consumed by 1");
    u.assertEqual(s1.hold.items.water, 19, "water consumed by 1");
    u.assertEqual(s1.day, s0.day + 1, "day incremented");
  });

  // ──────────────────────────────────────────────────────────────
  // V.ADVANCE.02 – Wages deducted
  // ──────────────────────────────────────────────────────────────

  reg("V.ADVANCE.02", "ADVANCE_DAY: wages deducted each day", (u) => {
    const s0 = makeVoyageState({
      gold: 1000,
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.ADVANCE_DAY);
    // 10 crew * 2g = 20g deducted
    u.assertEqual(s1.gold, 980, "wages deducted");
  });

  // ──────────────────────────────────────────────────────────────
  // V.ADVANCE.03 – Wind drifts
  // ──────────────────────────────────────────────────────────────

  reg("V.ADVANCE.03", "ADVANCE_DAY: wind angle/speed drifts", (u) => {
    const s0 = makeVoyageState({ wind: { angle: 45, speed: 10 } });
    const s1 = dispatch(s0, A.ADVANCE_DAY);
    u.assert(s1.wind.angle >= 0 && s1.wind.angle < 360, "wind angle in valid range");
    u.assert(s1.wind.speed >= 1 && s1.wind.speed <= 20, "wind speed in valid range");
    u.assert(s1.wind.angle !== s0.wind.angle || s1.wind.speed !== s0.wind.speed, "wind changed");
  });

  // ──────────────────────────────────────────────────────────────
  // V.ADVANCE.04 – Faction alert decay every 2 days
  // ──────────────────────────────────────────────────────────────

  reg("V.ADVANCE.04", "ADVANCE_DAY: heat decays by 1 every 2 days", (u) => {
    const s0 = makeVoyageState({
      factionAlerts: { english: 5, spanish: 0, french: 0, dutch: 0, pirate: 0 },
    });
    // Set day to an even number so decay applies
    s0.day = 10;
    const s1 = dispatch(s0, A.ADVANCE_DAY);
    u.assertEqual(s1.factionAlerts.english, 4, "english heat decayed");
  });

  // ──────────────────────────────────────────────────────────────
  // V.ADVANCE.05 – Starvation kills crew after 14 days no food
  // ──────────────────────────────────────────────────────────────

  reg("V.ADVANCE.05", "ADVANCE_DAY: crew dies after 14 days without food", (u) => {
    const s0 = makeVoyageState({
      hold: makeHold({ water: 20 }), // no food
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      daysWithoutFood: 13,
      daysWithoutWater: 0,
    });
    setRandomSequence([0.5]); // random crew loss
    const s1 = dispatch(s0, A.ADVANCE_DAY);
    resetRandomStub();
    u.assertEqual(s1.crew.roster.length, 4, "one crew died");
    u.assert(s1.daysWithoutFood === 14, "daysWithoutFood incremented");
  });

  // ──────────────────────────────────────────────────────────────
  // V.ADVANCE.06 – Random event fires and sets screen to event
  // ──────────────────────────────────────────────────────────────

  reg("V.ADVANCE.06", "ADVANCE_DAY: random event fires and sets screen to event", (u) => {
    const s0 = makeVoyageState();
    // Force random event: set random to 0.04 (less than 0.05 trigger)
    setRandomSequence([0.04, 0.0]); // trigger + pick first event
    const s1 = dispatch(s0, A.ADVANCE_DAY);
    resetRandomStub();
    u.assert(s1.activeEvent !== null, "activeEvent set");
    u.assertEqual(s1.screen, "event", "screen is event");
  });

  // ──────────────────────────────────────────────────────────────
  // V.ADVANCE.07 – Random event precedence over patrol
  // ──────────────────────────────────────────────────────────────

  reg("V.ADVANCE.07", "ADVANCE_DAY: random event takes precedence over patrol", (u) => {
    const s0 = makeVoyageState({
      infamy: 100,
      factionAlerts: { english: 10 },
      reputation: { portRoyal: 10, tortuga: 10 },
    });
    // Force random event to trigger (0.04) and also make patrol very likely
    // (by high infamy/heat). But event check runs before patrol, so we should
    // expect activeEvent to be set, not encounterSession.
    setRandomSequence([0.04, 0.0]); // event trigger + event index
    const s1 = dispatch(s0, A.ADVANCE_DAY);
    resetRandomStub();
    u.assert(s1.activeEvent !== null, "random event fired");
    u.assert(s1.encounterSession === null, "no patrol encounter");
  });

  // ──────────────────────────────────────────────────────────────
  // V.ADVANCE.08 – Mission encounter fires near completion
  // ──────────────────────────────────────────────────────────────

reg("V.ADVANCE.08", "ADVANCE_DAY: escort mission encounter fires near destination", (u) => {
  const mission = makeMission({
    type: "escort",
    targetPort: "tortuga",
    enemy: makeEnemy({ name: "Pirate", faction: "pirate" }),
    faction: "english",
    encounterOccurred: false,
  });
  const s0 = makeSailingState("portRoyal", "tortuga", 2, {
    destination: "tortuga",
    sailingDaysTotal: 3,
    activeMission: mission,
    fame: 50,
  });
  // Force progress: sailingDaysLeft = 2, total=3 => progress = 1 - 2/3 = 0.333
  // Encounter chance should be evaluated. In the code, chance = 0.20 + 0.60 * progress.
  // For progress 0.333, chance ~0.4. We'll force random to trigger.
  setRandomSequence([0.1]); // low random to trigger
  const s1 = dispatch(s0, A.ADVANCE_DAY);
  resetRandomStub();

  u.assert(s1.encounterSession !== null, "encounter session created");
  u.assertEqual(s1.screen, "intercept", "screen is intercept");
  u.assert(s1.activeMission.encounterOccurred === true, "mission marked encountered");
});

  // ──────────────────────────────────────────────────────────────
  // V.ADVANCE.09 – Arrival at day 0 sets screen to port (via ENTER_PORT)
  // ──────────────────────────────────────────────────────────────

  reg("V.ADVANCE.09", "ADVANCE_DAY: reaching day 0 leaves sailingDaysLeft at 0", (u) => {
    const s0 = makeVoyageState({ sailingDaysLeft: 1 });
    const s1 = dispatch(s0, A.ADVANCE_DAY);
    u.assertEqual(s1.sailingDaysLeft, 0, "sailingDaysLeft is 0");
    // Note: The actual arrival is triggered by ENTER_PORT, not ADVANCE_DAY.
    // So screen remains sailing (player must press Enter Port).
    u.assertEqual(s1.screen, "sailing", "screen remains sailing until Enter Port");
  });

  // ──────────────────────────────────────────────────────────────
  // V.ADVANCE.10 – Hidden port discovery during voyage
  // ──────────────────────────────────────────────────────────────

  reg("V.ADVANCE.10", "ADVANCE_DAY: hidden port auto-discovers when conditions met", (u) => {
    const s0 = makeVoyageState({
      fame: 100,
      discoveredPorts: ["portRoyal", "tortuga", "havana", "kingston"], // exclude roatan
      reputation: { tortuga: 80 },
      mapFragments: [],
    });
    // Roatan unlock: fame >= 50 OR pirate rep >= 65 (fame is 100, so it should unlock)
    const s1 = dispatch(s0, A.ADVANCE_DAY);
    u.assert(s1.discoveredPorts.includes("roatan"), "roatan discovered");
    u.assert(s1.log.some(l => l.includes("New port discovered")), "discovery logged");
  });

  // ──────────────────────────────────────────────────────────────
  // V.ADVANCE.11 – Mutual exclusivity: drunkard event vs random event
  // ──────────────────────────────────────────────────────────────

  reg("V.ADVANCE.11", "ADVANCE_DAY: drunkard event only fires if no other event occurred", (u) => {
    const s0 = makeVoyageState({
      hold: makeHold({ food: 20, water: 20, rum: 10 }),
      crew: {
        roster: [
          ...fillRoster(4),
          makeCrewMember({ firstName: "Bob", lastName: "Drunk", tags: ["hidden_drunkard"] }),
        ],
        max: 40,
        morale: 80,
      },
    });
    // Force random event to fire (0.04), so drunkard should NOT
    setRandomSequence([0.04, 0.0]); // random event trigger + index
    const s1 = dispatch(s0, A.ADVANCE_DAY);
    resetRandomStub();
    // If random event fires, drunkard event should not
    u.assert(s1.activeEvent !== null || s1.encounterSession !== null, "some event fired");
    u.assert(s1.hold.items.rum === 10, "rum not consumed by drunkard event");
  });

})();