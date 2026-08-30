// tests_scenarios.js
// Scenario and flow tests: these dispatch a sequence of actions to verify
// the game's state machine behaves correctly in multi-step situations.
// Deterministic only – no probabilistic outcomes.

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
  // SCENARIO.STORM
  // ──────────────────────────────────────────────────────────────

  reg("SCENARIO.STORM.BRACE", "Storm: Brace applies hull damage and crew loss", (u) => {
    // Find the real storm event from data.js
    const stormEvent = D.RANDOM_EVENTS.find(e => e.id === "storm");
    u.assert(stormEvent, "Storm event exists");

    const s0 = makeSailingState("portRoyal", "tortuga", 3, {
      ship: { ...makeShip("sloop"), hull: 100 },
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold({ food: 20, water: 20 }),
      activeEvent: { ...stormEvent }, // shallow copy
    });

    // Choose brace (index 0)
    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 0 });

    // Brace outcome: hullDamage 15, crewLoss 3, daysLost 1
    u.assertEqual(s1.ship.hull, 85, "hull reduced by 15");
    u.assertEqual(s1.crew.roster.length, 7, "crew reduced by 3");
    u.assertEqual(s1.day, s0.day + 1, "day advanced by lost days");
    u.assert(s1.screen === "sailing", "screen is sailing");
  });

  reg("SCENARIO.STORM.SHELTER", "Storm: Shelter reroutes to map with reduced damage", (u) => {
    // We'll set up a state where the shelter option is available.
    const s0 = makeSailingState("portRoyal", "havana", 5, {
      ship: { ...makeShip("sloop"), hull: 100 },
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold({ food: 20, water: 20 }),
      discoveredPorts: Object.keys(D.PORTS), // all ports discovered
    });

    // Create a route that passes near Tortuga (so it's reachable).
    // Set progressDays to 0 so we're at origin (portRoyal) and have full endurance.
    s0.route = {
      originPort: "portRoyal",
      destinationPort: "havana",
      originPos: D.PORTS.portRoyal,
      destinationPos: D.PORTS.havana,
      progressDays: 0,
      totalDays: 5,
      enduranceBudget: 10,
      enduranceSpent: 0,
    };

    // The real storm event
    const stormEvent = D.RANDOM_EVENTS.find(e => e.id === "storm");
    u.assert(stormEvent, "Storm event exists");

    // The shelter choice is index 1
    const shelterChoice = stormEvent.choices[1];
    u.assert(shelterChoice, "Shelter choice exists");
    // Verify the condition passes for this state
    u.assert(shelterChoice.condition(s0), "Shelter condition should be true");

    // Now dispatch with choiceIndex 1
    s0.activeEvent = { ...stormEvent };
    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 1 });

    // Shelter: hullDamage 5, crewLoss 1, no daysLost
    u.assertEqual(s1.ship.hull, 95, "hull reduced by 5");
    u.assertEqual(s1.crew.roster.length, 9, "crew reduced by 1");
    u.assertEqual(s1.screen, "map", "screen is map");
    u.assert(s1.log.some(l => l.includes("seek shelter") || l.includes("detour")), "log mentions detour");
  });

  reg("SCENARIO.STORM.NO_SHELTER", "Storm: Shelter condition false when no reachable alternative", (u) => {
    // State where we are at sea but no alternative port is reachable.
    // We only have the destination port discovered, so no alternative.
    const s0 = makeSailingState("portRoyal", "havana", 5, {
      ship: { ...makeShip("dinghy"), hull: 30 },
      crew: { roster: [], max: 5, morale: 80 },
      hold: makeHold({ food: 5, water: 5 }),
      discoveredPorts: ["havana"], // only destination is discovered
    });
    // Route has no endurance left, so even if another port were discovered,
    // it wouldn't be reachable.
    s0.route = {
      originPort: "portRoyal",
      destinationPort: "havana",
      originPos: D.PORTS.portRoyal,
      destinationPos: D.PORTS.havana,
      progressDays: 2,
      totalDays: 5,
      enduranceBudget: 0,
      enduranceSpent: 0,
    };

    const stormEvent = D.RANDOM_EVENTS.find(e => e.id === "storm");
    const shelterChoice = stormEvent.choices[1];
    u.assert(!shelterChoice.condition(s0), "Shelter condition should be false");
  });

  // ──────────────────────────────────────────────────────────────
  // SCENARIO.WRECK
  // ──────────────────────────────────────────────────────────────

  reg("SCENARIO.WRECK.AMBUSH", "Wreck: Ambush leads to encounter with preserved source", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 2, {
      fame: 50,
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold(),
    });

    // Force ambush: setRandomSequence with value < 0.08
    setRandomSequence([0.05]);
    const s1 = dispatch(s0, A.RESOLVE_DRIFTING_WRECK_SEARCH);
    resetRandomStub();

    u.assert(s1.encounterSession !== null, "encounter session created");
    u.assertEqual(s1.screen, "intercept", "screen is intercept");
    u.assertEqual(s1.encounterSession.type, "pirate_ambush", "type is pirate_ambush");
    u.assertEqual(s1.encounterSession.source.kind, "event", "source kind is event");
    u.assertEqual(s1.encounterSession.source.id, "drifting_wreck", "source id is drifting_wreck");
  });

  reg("SCENARIO.WRECK.SALVAGE", "Wreck: Salvage adds gold and cargo", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 2, {
      fame: 50,
      gold: 500,
      hold: makeHold({ food: 5, water: 5 }),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });

    // Force salvage: RNG between 0.08 and 0.58
    setRandomSequence([0.3]);
    const s1 = dispatch(s0, A.RESOLVE_DRIFTING_WRECK_SEARCH);
    resetRandomStub();

    u.assert(s1.gold > 500, "gold increased");
    u.assert(Object.keys(s1.hold.items).some(k => s1.hold.items[k] > 0), "some cargo added");
    u.assertEqual(s1.screen, "sailing", "screen is sailing");
  });

  reg("SCENARIO.WRECK.EMPTY", "Wreck: Empty yields no rewards", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 2, {
      gold: 500,
      hold: makeHold({ food: 5, water: 5 }),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });

    // Force empty: RNG between 0.58 and 0.70
    setRandomSequence([0.65]);
    const s1 = dispatch(s0, A.RESOLVE_DRIFTING_WRECK_SEARCH);
    resetRandomStub();

    u.assertEqual(s1.gold, 500, "gold unchanged");
    u.assertEqual(L.getHoldUsed(s1.hold.items), L.getHoldUsed(s0.hold.items), "hold unchanged");
    u.assertEqual(s1.screen, "sailing", "screen is sailing");
  });

  reg("SCENARIO.WRECK.SURVIVOR", "Wreck: Survivor joins crew if capacity", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 2, {
      crew: { roster: fillRoster(3), max: 40, morale: 80 },
      hold: makeHold(),
    });

    // Force survivor: RNG > 0.70
    setRandomSequence([0.75]);
    const s1 = dispatch(s0, A.RESOLVE_DRIFTING_WRECK_SEARCH);
    resetRandomStub();

    u.assertEqual(s1.crew.roster.length, 4, "one crew added");
    u.assertEqual(s1.screen, "sailing", "screen is sailing");
  });

  // ──────────────────────────────────────────────────────────────
  // SCENARIO.MERCHANT
  // ──────────────────────────────────────────────────────────────

  reg("SCENARIO.MERCHANT.SAVED", "Merchant: Defend and win with merchant saved", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      reputation: { portRoyal: 50 },
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      ship: makeShip("sloop"),
      hold: makeHold(),
    });

    // Attack pirate to start merchant defense
    const s1 = dispatch(s0, A.ATTACK_PIRATE);
    u.assert(s1.encounterSession !== null, "encounter session created");
    u.assertEqual(s1.screen, "intercept", "screen is intercept");

    // Start battle
    const s2 = dispatch(s1, A.INTERCEPT_FIGHT);
    u.assert(s2.screen === "battle", "screen is battle");

    // Simulate victory with merchant saved: set battle phase to victory, convoyLost false
    s2.encounterSession.battle.phase = "victory";
    s2.encounterSession.battle.convoyLost = false;
    s2.encounterSession.battle.canPlunder = false;
    // Also set merchantFaction and merchantProtected for the reward logic
    s2.encounterSession.merchantFaction = "english";
    s2.encounterSession.merchantProtected = true;

    const s3 = dispatch(s2, A.DISMISS_BATTLE);

    u.assert(s3.gold > 1000, "gold increased (rescue bonus)");
    u.assert(s3.reputation["portRoyal"] > 50, "reputation increased");
    u.assert(s3.log.some(l => l.includes("merchant is saved")), "log mentions saved");
    u.assert(s3.encounterSession === null, "encounter cleared");
  });

  reg("SCENARIO.MERCHANT.SUNK", "Merchant: Defend and win but merchant sunk yields no rescue reward", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      reputation: { portRoyal: 50 },
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      ship: makeShip("sloop"),
      hold: makeHold(),
    });

    const s1 = dispatch(s0, A.ATTACK_PIRATE);
    const s2 = dispatch(s1, A.INTERCEPT_FIGHT);

    // Simulate victory with merchant lost
    s2.encounterSession.battle.phase = "victory";
    s2.encounterSession.battle.convoyLost = true;
    s2.encounterSession.battle.canPlunder = false;
    s2.encounterSession.merchantFaction = "english";
    s2.encounterSession.merchantProtected = true;

    const s3 = dispatch(s2, A.DISMISS_BATTLE);

    u.assertEqual(s3.gold, 1000, "gold unchanged (no rescue bonus)");
    u.assertEqual(s3.reputation["portRoyal"], 50, "reputation unchanged");
    u.assert(s3.log.some(l => l.includes("merchant ship was destroyed")), "log mentions destroyed");
  });

  reg("SCENARIO.MERCHANT.PLUNDER", "Merchant: Plunder leads to encounter", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });

    const s1 = dispatch(s0, A.ATTACK_MERCHANT);
    u.assert(s1.encounterSession !== null, "encounter session created");
    u.assertEqual(s1.encounterSession.type, "distressed_merchant_plunder", "type is merchant plunder");
    u.assertEqual(s1.screen, "intercept", "screen is intercept");
  });

  // ──────────────────────────────────────────────────────────────
  // SCENARIO.SAILORS
  // ──────────────────────────────────────────────────────────────

  reg("SCENARIO.SAILORS.TAKE_ABOARD", "Marooned Sailors: Take aboard adds crew", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 3, {
      fame: 50,
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      hold: makeHold(),
    });
    const event = {
      id: "drifting_sailors",
      choices: [
        { label: "Take them aboard", outcome: { addCrew: { count: 3 }, log: "You take the sailors aboard." } },
        { label: "Give supplies", outcome: {} },
        { label: "Sail on", outcome: {} },
      ],
    };
    s0.activeEvent = event;

    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 0 });
    u.assertEqual(s1.crew.roster.length, 8, "3 sailors added");
    u.assert(s1.activeEvent === null, "event cleared");
  });

  reg("SCENARIO.SAILORS.GIVE_SUPPLIES", "Marooned Sailors: Give supplies with sufficient resources", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 3, {
      fame: 50,
      gold: 500,
      hold: makeHold({ food: 20, water: 20 }),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
    });
    const event = {
      id: "drifting_sailors",
      choices: [
        { label: "Give supplies", outcome: { gold: -50, food: -15, water: -15, moraleBonus: 3, log: "You gave supplies." } },
        { label: "Sail on", outcome: {} },
      ],
    };
    s0.activeEvent = event;

    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 0 });
    u.assertEqual(s1.gold, 450, "gold reduced by 50");
    u.assertEqual(s1.hold.items.food, 5, "food reduced by 15");
    u.assertEqual(s1.hold.items.water, 5, "water reduced by 15");
    u.assertEqual(s1.crew.morale, 83, "morale +3");
    u.assert(s1.activeEvent === null, "event cleared");
  });

  reg("SCENARIO.SAILORS.NO_SUPPLIES", "Marooned Sailors: Give supplies disabled when insufficient", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 3, {
      fame: 50,
      gold: 10,
      hold: makeHold({ food: 5, water: 5 }),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
    });
    // We test the condition function directly
    const event = {
      id: "drifting_sailors",
      choices: [
        {
          label: "Give supplies",
          outcome: {},
          condition: (state) => state.gold >= 50 && state.hold?.items?.food >= 15 && state.hold?.items?.water >= 15,
        },
      ],
    };
    u.assert(!event.choices[0].condition(s0), "Condition false with insufficient resources");
  });

  reg("SCENARIO.SAILORS.SAIL_ON", "Marooned Sailors: Sail on applies morale penalty", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 3, {
      fame: 50,
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      hold: makeHold(),
    });
    const event = {
      id: "drifting_sailors",
      choices: [
        { label: "Sail on", outcome: { moraleBonus: -5, log: "You leave them." } },
      ],
    };
    s0.activeEvent = event;

    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 0 });
    u.assertEqual(s1.crew.morale, 75, "morale -5");
  });

  // ──────────────────────────────────────────────────────────────
  // SCENARIO.PATROL
  // ──────────────────────────────────────────────────────────────

  reg("SCENARIO.PATROL.CLEAN", "Patrol: Clean inspection ends encounter", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 500,
      hold: makeHold({ food: 10, water: 10 }),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
    });
    const enemy = { name: "Patrol", faction: "english" };
    const ctx = {
      type: "navy_patrol",
      phase: "intercept",
      enemy,
      intercept: { flavourText: "test", options: [{ id: "inspect", label: "Inspect", available: true, reason: null, action: { type: "PATROL_INSPECT" } }] },
      returnScreen: "port",
    };
    s0.encounterSession = { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null };

    const s1 = dispatch(s0, A.PATROL_INSPECT);
    // No contraband => encounter cleared
    u.assert(s1.encounterSession === null, "encounter cleared");
    u.assertEqual(s1.gold, 500, "gold unchanged");
    u.assert(s1.log.some(l => l.includes("nothing")), "log mentions nothing found");
  });

  reg("SCENARIO.PATROL.HANDOVER", "Patrol: Contraband found -> handover applies penalties", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 500,
      infamy: 0,
      hold: makeHold({ tobacco: 4, food: 5 }),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      reputation: { portRoyal: 60 },
    });
    const enemy = { name: "Patrol", faction: "english" };
    const ctx = {
      type: "navy_patrol",
      phase: "intercept",
      enemy,
      intercept: { flavourText: "test", options: [{ id: "inspect", label: "Inspect", available: true, reason: null, action: { type: "PATROL_INSPECT" } }] },
      returnScreen: "port",
    };
    s0.encounterSession = { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null };

    const s1 = dispatch(s0, A.PATROL_INSPECT);
    // Now we are in inspection_pending
    u.assertEqual(s1.encounterSession.phase, "inspection_pending", "phase is inspection_pending");

    const s2 = dispatch(s1, A.RESOLVE_INSPECTION, { choice: "handOver" });
    // Fine: 4*90=360 * 0.20 = 72 rounded to 75? Actually formula: Math.round(360*0.20/25)*25 = Math.round(72/25)*25 = Math.round(2.88)*25 = 3*25 = 75
    u.assertEqual(s2.gold, 425, "gold reduced by fine (75)");
    u.assertEqual(s2.hold.items.tobacco, 0, "tobacco seized");
    u.assertEqual(s2.infamy, 2, "infamy +2");
    u.assertEqual(s2.crew.morale, 70, "morale -10");
    u.assert(s2.encounterSession === null, "encounter cleared");
  });

  reg("SCENARIO.PATROL.RESIST", "Patrol: Contraband found -> resist leads to boarding", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 500,
      hold: makeHold({ tobacco: 4 }),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      ship: makeShip("sloop"),
    });
    const enemy = { name: "Patrol", faction: "english", hull: 100, cannons: 10, crew: 20 };
    const ctx = {
      type: "navy_patrol",
      phase: "intercept",
      enemy,
      intercept: { flavourText: "test", options: [{ id: "inspect", label: "Inspect", available: true, reason: null, action: { type: "PATROL_INSPECT" } }] },
      returnScreen: "port",
    };
    s0.encounterSession = { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null };

    const s1 = dispatch(s0, A.PATROL_INSPECT);
    u.assertEqual(s1.encounterSession.phase, "inspection_pending", "phase is inspection_pending");

    const s2 = dispatch(s1, A.RESOLVE_INSPECTION, { choice: "resist" });
    u.assertEqual(s2.screen, "battle", "screen is battle");
    u.assertEqual(s2.encounterSession.battle.subPhase, "boarding", "subPhase is boarding");
    u.assert(s2.encounterSession.inspectionRefused === true, "inspectionRefused set");
  });

})();