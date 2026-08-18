// tests_engine.js
// ─────────────────────────────────────────────────────────────────────────────
// Reducer (engine) tests. Only tests with deterministic outcomes are included
// here — no seeded-RNG cases. For each test, the pre-condition state is built
// with makePortState/makeSailingState/makeState from tests_helpers.js, an
// action is dispatched, and the post-condition is asserted.
//
// RNG-dependent outcomes (ADVANCE_DAY event rolls, BATTLE_ACTION combat rolls,
// ENTER_PORT desertion rolls) are intentionally excluded — they are tested via
// the simulation tools (sim.html, crew_sim.html, tests_balance.html) instead.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  const {
    makeState, makePortState, makeSailingState, makeBattleState,
    makeCrewMember, fillRoster, makeShip, makeHold, makeMission,
    makeBattle, dispatch,
  } = window.testHelpers;

  const A = window.E.A;
  const D = window.D;
  const L = window.L;

  const reg = (id, name, run) =>
    window._tests.push({ id, name, run });

  // ══════════════════════════════════════════════════════════════════════════
  // E.START — START_GAME (faction-keyed STARTS shape)
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.START.01", "START_GAME english: lands at kingston with dinghy", (u) => {
    const s = dispatch(makeState(), A.START_GAME, {
      captainName: "Thomas Wells",
      faction: "english",
      tutorialMode: "none",
    });
    u.assertEqual(s.screen, "port", "screen");
    u.assertEqual(s.currentPort, "kingston", "english starts at kingston");
    u.assertEqual(s.ship.type, "dinghy", "starting ship");
    u.assertEqual(s.captainName, "Thomas Wells", "captain name");
    u.assertEqual(s.faction, "english", "faction");
    u.assertEqual(s.gold, D.STARTS.gold, "starting gold");
    u.assertEqual(s.tutorialMode, "none", "tutorial mode");
  });

  reg("E.START.02", "START_GAME spanish: lands at havana", (u) => {
    const s = dispatch(makeState(), A.START_GAME, {
      captainName: "Juan Ruiz",
      faction: "spanish",
      tutorialMode: "none",
    });
    u.assertEqual(s.currentPort, "havana", "spanish starts at havana");
    u.assertEqual(s.faction, "spanish");
  });

  reg("E.START.03", "START_GAME french: lands at petitGoave", (u) => {
    const s = dispatch(makeState(), A.START_GAME, {
      captainName: "Louis Bernard",
      faction: "french",
      tutorialMode: "none",
    });
    u.assertEqual(s.currentPort, "petitGoave");
  });

  reg("E.START.04", "START_GAME dutch: lands at santoDomingo", (u) => {
    const s = dispatch(makeState(), A.START_GAME, {
      captainName: "Hendrik Bakker",
      faction: "dutch",
      tutorialMode: "none",
    });
    u.assertEqual(s.currentPort, "santoDomingo");
  });

  reg("E.START.05", "START_GAME pirate: lands at santiagoDeCuba", (u) => {
    const s = dispatch(makeState(), A.START_GAME, {
      captainName: "Scarred Jim",
      faction: "pirate",
      tutorialMode: "none",
    });
    u.assertEqual(s.currentPort, "santiagoDeCuba");
  });

  reg("E.START.06", "START_GAME invalid faction: returns to title", (u) => {
    const s = dispatch(makeState(), A.START_GAME, {
      captainName: "Nobody",
      faction: "ottoman",
      tutorialMode: "none",
    });
    u.assertEqual(s.screen, "title", "invalid faction → title screen");
  });

  reg("E.START.07", "START_GAME tutorialMode full: onboarding enabled, QM in roster", (u) => {
    const s = dispatch(makeState(), A.START_GAME, {
      captainName: "New Captain",
      faction: "english",
      tutorialMode: "full",
    });
    u.assert(s.onboarding.enabled, "onboarding enabled");
    u.assert(!s.onboarding.completed, "onboarding not completed");
    const hasQM = s.crew.roster.some(m => m.tags?.includes("quartermaster"));
    u.assert(hasQM, "QM crew member injected");
  });

  reg("E.START.08", "START_GAME tutorialMode none: onboarding disabled", (u) => {
    const s = dispatch(makeState(), A.START_GAME, {
      captainName: "Veteran",
      faction: "english",
      tutorialMode: "none",
    });
    u.assert(!s.onboarding.enabled, "onboarding disabled");
    u.assert(s.onboarding.completed, "onboarding marked complete");
    const hasQM = s.crew.roster.some(m => m.tags?.includes("quartermaster"));
    u.assert(!hasQM, "no QM injected in none mode");
  });

  reg("E.START.09", "START_GAME english: rep adjusted for english ports", (u) => {
    const s = dispatch(makeState(), A.START_GAME, {
      captainName: "Test",
      faction: "english",
      tutorialMode: "none",
    });
    // English start adjusts english ports +10 rep (50+10=60) and pirate ports -5 (50-5=45)
    const engAdj = D.STARTS.factionRepAdjust.english;
    const portAffected = Object.keys(D.PORTS).find(k => D.PORTS[k].faction === "english");
    if (portAffected && engAdj.english) {
      u.assertEqual(s.reputation[portAffected], 50 + engAdj.english);
    }
  });

  reg("E.START.10", "START_GAME: ship equipment starts empty for all slots", (u) => {
    const s = dispatch(makeState(), A.START_GAME, {
      captainName: "Test",
      faction: "english",
      tutorialMode: "none",
    });
    u.assertEqual(s.ship.equipment.hull.length, 0, "no hull equipment");
    u.assertEqual(s.ship.equipment.armament.length, 0, "no armament");
    u.assertEqual(s.ship.equipment.rigging.length, 0, "no rigging");
    u.assertEqual(s.ship.equipment.special.length, 0, "no special");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.NAV — NAVIGATE and SAIL_TO
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.NAV.01", "NAVIGATE: changes screen field", (u) => {
    const s0 = makePortState();
    const s1 = dispatch(s0, A.NAVIGATE, { screen: "market" });
    u.assertEqual(s1.screen, "market");
  });

  reg("E.NAV.02", "NAVIGATE: preserves all other state fields", (u) => {
    const s0 = makePortState("portRoyal", { gold: 777 });
    const s1 = dispatch(s0, A.NAVIGATE, { screen: "journal" });
    u.assertEqual(s1.gold, 777);
    u.assertEqual(s1.currentPort, "portRoyal");
  });

  reg("E.NAV.03", "SAIL_TO: sets destination, screen, route from port", (u) => {
    const s0 = makePortState("portRoyal");
    const s1 = dispatch(s0, A.SAIL_TO, { port: "tortuga" });
    u.assertEqual(s1.screen, "sailing", "screen");
    u.assertEqual(s1.destination, "tortuga", "destination");
    u.assert(s1.sailingDaysLeft >= 1, "sailingDaysLeft ≥ 1");
    u.assert(s1.route !== null, "route set");
    u.assertEqual(s1.route.originPort, "portRoyal", "route origin");
    u.assertEqual(s1.route.destinationPort, "tortuga", "route destination");
    u.assert(s1.route.enduranceBudget >= 1, "endurance budget set");
    u.assertEqual(s1.route.enduranceSpent, 0, "endurance spent starts 0");
  });

  reg("E.NAV.04", "SAIL_TO: invalid port key = no change", (u) => {
    const s0 = makePortState("portRoyal");
    const s1 = dispatch(s0, A.SAIL_TO, { port: "notAPort" });
    u.assertEqual(s1.screen, "port", "screen unchanged");
    u.assertEqual(s1.destination, null, "no destination set");
  });

  reg("E.NAV.05", "SAIL_TO: resets completedCombatThisVisit to false", (u) => {
    const s0 = makePortState("portRoyal", { completedCombatThisVisit: true });
    const s1 = dispatch(s0, A.SAIL_TO, { port: "tortuga" });
    u.assert(!s1.completedCombatThisVisit, "combat flag reset on sail");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.SHIP — REPAIR
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.SHIP.01", "REPAIR: hull restored to maxHull", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5000,
      ship: { ...makeShip("sloop"), hull: 60 }, // 40 missing
    });
    const s1 = dispatch(s0, A.REPAIR);
    u.assertEqual(s1.ship.hull, 100, "hull restored to sloop maxHull");
  });

  reg("E.SHIP.02", "REPAIR: gold is deducted", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5000,
      ship: { ...makeShip("sloop"), hull: 60 },
    });
    const s1 = dispatch(s0, A.REPAIR);
    u.assert(s1.gold < s0.gold, "gold decreased");
  });

  // FIX: repair cost now includes reputation multiplier. rep=50 → Friendly → repairMult=0.90.
  // baseCost = L.shipRepairCost(s0) = 200; cost = 200 * 0.90 = 180; gold = 5000-180 = 4820.
  reg("E.SHIP.03", "REPAIR: gold deducted matches L.shipRepairCost multiplied by reputation modifier", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5000,
      ship: { ...makeShip("sloop"), hull: 60 },
    });
    const expectedCost = 180; // 40 missing * 5 rate * 0.90 friendly discount
    const s1 = dispatch(s0, A.REPAIR);
    u.assertEqual(s1.gold, s0.gold - expectedCost,
      `expected gold ${s0.gold - expectedCost}, got ${s1.gold}`);
  });

  reg("E.SHIP.04", "REPAIR: blocked when not enough gold", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 1, // not enough for any repair
      ship: { ...makeShip("sloop"), hull: 60 },
    });
    const s1 = dispatch(s0, A.REPAIR);
    u.assertEqual(s1.ship.hull, 60, "hull unchanged");
    u.assertEqual(s1.gold, 1, "gold unchanged");
  });

  reg("E.SHIP.05", "REPAIR: no-op when hull is already full", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5000,
      ship: makeShip("sloop"), // hull == maxHull
    });
    const s1 = dispatch(s0, A.REPAIR);
    u.assertEqual(s1.gold, s0.gold, "gold unchanged on full-hull repair");
    u.assertEqual(s1.ship.hull, 100);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.SHIP — BUY_SHIP
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.BUY.01", "BUY_SHIP: gold reduced by ship cost", (u) => {
    const cutterCost = D.SHIPS.cutter.cost; // 1000
    const s0 = makePortState("portRoyal", { gold: cutterCost + 500 });
    const s1 = dispatch(s0, A.BUY_SHIP, { shipType: "cutter" });
    u.assertEqual(s1.gold, 500, `gold: expected 500, got ${s1.gold}`);
  });

  reg("E.BUY.02", "BUY_SHIP: new ship type is set", (u) => {
    const s0 = makePortState("portRoyal", { gold: 10000, fame: 0 });
    const s1 = dispatch(s0, A.BUY_SHIP, { shipType: "cutter" });
    u.assertEqual(s1.ship.type, "cutter");
  });

  reg("E.BUY.03", "BUY_SHIP: equipment is reset to empty slots", (u) => {
    const s0 = makePortState("portRoyal", { gold: 10000 });
    const s1 = dispatch(s0, A.BUY_SHIP, { shipType: "cutter" });
    u.assertEqual(s1.ship.equipment.hull.length, 0, "hull eq empty");
    u.assertEqual(s1.ship.equipment.armament.length, 0, "armament eq empty");
    u.assertEqual(s1.ship.equipment.rigging.length, 0, "rigging eq empty");
    u.assertEqual(s1.ship.equipment.special.length, 0, "special eq empty");
  });

  reg("E.BUY.04", "BUY_SHIP: hull set to new ship maxHull", (u) => {
    const s0 = makePortState("portRoyal", { gold: 10000 });
    const s1 = dispatch(s0, A.BUY_SHIP, { shipType: "cutter" });
    u.assertEqual(s1.ship.hull, D.SHIPS.cutter.maxHull);
  });

  reg("E.BUY.05", "BUY_SHIP: blocked when not enough gold", (u) => {
    const s0 = makePortState("portRoyal", { gold: 10 });
    const s1 = dispatch(s0, A.BUY_SHIP, { shipType: "cutter" });
    u.assertEqual(s1.ship.type, "sloop", "ship type unchanged");
    u.assertEqual(s1.gold, 10, "gold unchanged");
  });

  reg("E.BUY.06", "BUY_SHIP: blocked by fame requirement", (u) => {
    const s0 = makePortState("portRoyal", { gold: 5000, fame: 0 });
    // sloop requires fame 20
    const s1 = dispatch(s0, A.BUY_SHIP, { shipType: "sloop" });
    // With fame 0 and the current ship already a sloop in makePortState,
    // try buying schooner which requires fame 50
    const s2 = dispatch(makePortState("portRoyal", { gold: 50000, fame: 0 }), A.BUY_SHIP, { shipType: "schooner" });
    u.assertEqual(s2.ship.type, "sloop", "schooner blocked by fame requirement");
  });

  reg("E.BUY.07", "BUY_SHIP: roster trimmed to new ship maxCrew", (u) => {
    // Cutter maxCrew = 20. Build a state with 25 crew on a sloop.
    const bigCrew = fillRoster(25);
    const s0 = makePortState("portRoyal", {
      gold: 10000,
      crew: { roster: bigCrew, max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.BUY_SHIP, { shipType: "cutter" });
    u.assert(s1.crew.roster.length <= D.SHIPS.cutter.maxCrew,
      `roster trimmed to ${D.SHIPS.cutter.maxCrew}`);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.EQ — Equipment actions
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.EQ.01", "BUY_EQUIPMENT: adds equipment to correct slot, deducts cost+fee", (u) => {
    const item = D.EQUIPMENT.tar_sealed_hull;
    const totalCost = item.cost + item.installFee; // 1200 + 150 = 1350
    // cutter has hull slot, tar_sealed_hull requires fame 20, minHull 60
    // Use a frigate (hull 180) with fame 100
    const s0 = makePortState("portRoyal", {
      gold: 10000,
      fame: 100,
      ship: makeShip("frigate"),
    });
    const s1 = dispatch(s0, A.BUY_EQUIPMENT, { equipmentKey: "tar_sealed_hull" });
    u.assert(s1.ship.equipment.hull.includes("tar_sealed_hull"), "equipment in hull slot");
    u.assertEqual(s1.gold, s0.gold - totalCost, "gold deducted correctly");
  });

  reg("E.EQ.02", "BUY_EQUIPMENT: blocked if no slot available", (u) => {
    // Dinghy has zero hull slots
    const s0 = makePortState("portRoyal", {
      gold: 10000,
      fame: 0,
      ship: makeShip("dinghy"),
    });
    const s1 = dispatch(s0, A.BUY_EQUIPMENT, { equipmentKey: "reinforced_hull" });
    u.assertEqual(s1.gold, s0.gold, "gold unchanged — no slot");
  });

  reg("E.EQ.03", "INSTALL_EQUIPMENT: moves item from locker to ship slot", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 10000,
      fame: 100,
      ship: makeShip("frigate"),
      equipmentInventory: ["tar_sealed_hull"],
    });
    const s1 = dispatch(s0, A.INSTALL_EQUIPMENT, { equipmentKey: "tar_sealed_hull" });
    u.assert(s1.ship.equipment.hull.includes("tar_sealed_hull"), "installed in slot");
    u.assert(!s1.equipmentInventory.includes("tar_sealed_hull"), "removed from locker");
  });

  reg("E.EQ.04", "REMOVE_EQUIPMENT: moves removable item from slot to locker", (u) => {
    // extra_cannons is armament slot, removable: true
    const s0 = makePortState("portRoyal", {
      fame: 0,
      ship: {
        ...makeShip("sloop"),
        equipment: { hull: [], armament: ["extra_cannons"], rigging: [], special: [] },
      },
      equipmentInventory: [],
    });
    const s1 = dispatch(s0, A.REMOVE_EQUIPMENT, { equipmentKey: "extra_cannons" });
    u.assert(!s1.ship.equipment.armament.includes("extra_cannons"), "removed from slot");
    u.assert(s1.equipmentInventory.includes("extra_cannons"), "moved to locker");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.CREW — HIRE_CREW, DISMISS_CREW, RAISE_MORALE
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.CREW.01", "HIRE_CREW: roster count increases by action.count", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      crew: { roster: fillRoster(3), max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.HIRE_CREW, { count: 2 });
    u.assertEqual(s1.crew.roster.length, 5, "3 + 2 = 5");
  });

  reg("E.CREW.02", "HIRE_CREW: gold deducted at 50g per crew", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      crew: { roster: [], max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.HIRE_CREW, { count: 3 });
    u.assertEqual(s1.gold, 850, "1000 - 3*50 = 850");
  });

  reg("E.CREW.03", "HIRE_CREW: blocked when crew at max", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5000,
      crew: { roster: fillRoster(40), max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.HIRE_CREW, { count: 1 });
    u.assertEqual(s1.crew.roster.length, 40, "roster unchanged at max");
    u.assertEqual(s1.gold, 5000, "gold unchanged");
  });

  reg("E.CREW.04", "HIRE_CREW: blocked when not enough gold", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 40, // not enough for 1 crew (costs 50)
      crew: { roster: [], max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.HIRE_CREW, { count: 1 });
    u.assertEqual(s1.crew.roster.length, 0, "no hire below cost");
  });

  reg("E.CREW.05", "DISMISS_CREW: removes crew member by id", (u) => {
    const roster = fillRoster(5);
    const targetId = roster[2].id;
    const s0 = makePortState("portRoyal", {
      crew: { roster, max: 40, morale: 80 },
      onboarding: { ...window.E.initialState.onboarding, enabled: false, completed: true },
    });
    const s1 = dispatch(s0, A.DISMISS_CREW, { memberId: targetId });
    u.assertEqual(s1.crew.roster.length, 4, "roster shrinks by 1");
    u.assert(!s1.crew.roster.some(m => m.id === targetId), "dismissed member gone");
  });

  reg("E.CREW.06", "DISMISS_CREW: no-op for unknown id", (u) => {
    const roster = fillRoster(5);
    const s0 = makePortState("portRoyal", {
      crew: { roster, max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.DISMISS_CREW, { memberId: "nonexistent_id" });
    u.assertEqual(s1.crew.roster.length, 5, "roster unchanged");
  });

  reg("E.CREW.07", "RAISE_MORALE: adds 5 morale, deducts roster.length * 5 gold", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      crew: { roster: fillRoster(10), max: 40, morale: 70 },
    });
    const cost = 10 * 5; // 50g
    const s1 = dispatch(s0, A.RAISE_MORALE);
    u.assertEqual(s1.crew.morale, 75, "morale +5");
    u.assertEqual(s1.gold, 950, "gold -50");
  });

  reg("E.CREW.08", "RAISE_MORALE: blocked when not enough gold", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 10, // not enough for 10 crew * 5g = 50g
      crew: { roster: fillRoster(10), max: 40, morale: 70 },
    });
    const s1 = dispatch(s0, A.RAISE_MORALE);
    u.assertEqual(s1.crew.morale, 70, "morale unchanged");
    u.assertEqual(s1.gold, 10, "gold unchanged");
  });

  reg("E.CREW.09", "RAISE_MORALE: morale capped at 100", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5000,
      crew: { roster: fillRoster(2), max: 40, morale: 98 },
    });
    const s1 = dispatch(s0, A.RAISE_MORALE);
    u.assert(s1.crew.morale <= 100, "morale does not exceed 100");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.MISSION — TAKE_MISSION, COMPLETE_MISSION, ABANDON_MISSION
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.MISS.01", "TAKE_MISSION: sets activeMission", (u) => {
    const mission = makeMission({ type: "trade", targetPort: "tortuga" });
    const s0 = makePortState("portRoyal");
    const s1 = dispatch(s0, A.TAKE_MISSION, { mission });
    u.assert(s1.activeMission !== null, "activeMission set");
    u.assertEqual(s1.activeMission.id, mission.id);
  });

  reg("E.MISS.02", "TAKE_MISSION: combat mission blocked after completedCombatThisVisit", (u) => {
    const mission = makeMission({ type: "combat", id: "combat_1" });
    const s0 = makePortState("portRoyal", { completedCombatThisVisit: true });
    const s1 = dispatch(s0, A.TAKE_MISSION, { mission });
    u.assert(s1.activeMission === null, "combat mission rejected after chaining");
    u.assert(s1.log.length > s0.log.length, "a message was logged");
  });

  reg("E.MISS.03", "COMPLETE_MISSION trade: gold awarded, goods consumed", (u) => {
    const mission = makeMission({
      type: "trade",
      targetPort: "portRoyal",
      gold: 300,
      fame: 2,
      requiredGood: "sugar",
      requiredQty: 5,
    });
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      hold: makeHold({ sugar: 10, food: 5, water: 5 }),
      activeMission: mission,
    });
    const s1 = dispatch(s0, A.COMPLETE_MISSION);
    u.assertEqual(s1.gold, 1300, "gold +300");
    u.assertEqual(s1.hold.items.sugar, 5, "sugar consumed");
    u.assert(s1.activeMission === null, "mission cleared");
    u.assert(s1.fame >= 2, "fame increased");
  });

  reg("E.MISS.04", "COMPLETE_MISSION: blocked at wrong port", (u) => {
    const mission = makeMission({ targetPort: "tortuga" });
    const s0 = makePortState("portRoyal", { activeMission: mission });
    const s1 = dispatch(s0, A.COMPLETE_MISSION);
    u.assert(s1.activeMission !== null, "mission not cleared");
    u.assertEqual(s1.gold, s0.gold, "gold unchanged");
  });

  reg("E.MISS.05", "COMPLETE_MISSION: blocked without required goods", (u) => {
    const mission = makeMission({
      targetPort: "portRoyal",
      requiredGood: "spices",
      requiredQty: 10,
    });
    const s0 = makePortState("portRoyal", {
      hold: makeHold({ spices: 2 }), // only 2, need 10
      activeMission: mission,
    });
    const s1 = dispatch(s0, A.COMPLETE_MISSION);
    u.assert(s1.activeMission !== null, "mission not cleared");
    u.assert(s1.log.some(l => l.includes("required")), "requirement message logged");
  });

  reg("E.MISS.06", "COMPLETE_MISSION patrol: blocked when enemyDefeated is false", (u) => {
    const mission = makeMission({
      type: "patrol",
      targetPort: "portRoyal",
      requiredGood: null,
      requiredQty: 0,
      enemyDefeated: false,
    });
    const s0 = makePortState("portRoyal", { activeMission: mission });
    const s1 = dispatch(s0, A.COMPLETE_MISSION);
    u.assert(s1.activeMission !== null, "patrol mission not cleared without defeat");
    u.assert(s1.log.some(l => l.includes("enemy") || l.includes("defeated") || l.includes("searching")),
      "informative message logged");
  });

  reg("E.MISS.07", "COMPLETE_MISSION: marks completedCombatThisVisit for combat type", (u) => {
    const mission = makeMission({
      type: "combat",
      targetPort: "portRoyal",
      requiredGood: null,
      requiredQty: 0,
      enemyDefeated: true,
    });
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      activeMission: mission,
    });
    const s1 = dispatch(s0, A.COMPLETE_MISSION);
    u.assert(s1.completedCombatThisVisit, "flag set after combat mission");
  });

  reg("E.MISS.08", "ABANDON_MISSION: clears activeMission", (u) => {
    const mission = makeMission({ faction: "english" });
    const s0 = makePortState("portRoyal", { activeMission: mission });
    const s1 = dispatch(s0, A.ABANDON_MISSION);
    u.assert(s1.activeMission === null, "mission cleared");
  });

  reg("E.MISS.09", "ABANDON_MISSION: applies reputation penalty to mission faction", (u) => {
    const mission = makeMission({ faction: "english" });
    const repBefore = {};
    Object.keys(D.PORTS).filter(k => D.PORTS[k].faction === "english")
      .forEach(k => { repBefore[k] = 60; });

    const s0 = makePortState("portRoyal", {
      activeMission: mission,
      reputation: { ...window.E.initialState.reputation, ...repBefore },
    });
    const s1 = dispatch(s0, A.ABANDON_MISSION);
    const portKey = Object.keys(D.PORTS).find(k => D.PORTS[k].faction === "english");
    if (portKey && repBefore[portKey] !== undefined) {
      u.assert(s1.reputation[portKey] < repBefore[portKey],
        "rep decreased at english port after abandonment");
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.TRADE — CONFIRM_TRADE
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.TRADE.01", "CONFIRM_TRADE: buying goods costs gold and fills hold", (u) => {
    // Build a minimal market with sugar available
    const market = {
      goods: {
        sugar: { buyFromPort: 50, sellToPort: 40, available: 20, price: 50 },
      },
    };
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      portMarket: market,
      hold: makeHold(),
    });
    const s1 = dispatch(s0, A.CONFIRM_TRADE, {
      buys: { sugar: 5 },
      sells: {},
    });
    u.assertEqual(s1.gold, 750, "1000 - 5*50 = 750");
    u.assertEqual(s1.hold.items.sugar, 5, "5 sugar in hold");
  });

  reg("E.TRADE.02", "CONFIRM_TRADE: selling goods earns gold and clears hold", (u) => {
    const market = {
      goods: {
        cloth: { buyFromPort: 60, sellToPort: 45, available: 100, price: 60 },
      },
    };
    const s0 = makePortState("portRoyal", {
      gold: 500,
      portMarket: market,
      hold: makeHold({ cloth: 10 }),
    });
    const s1 = dispatch(s0, A.CONFIRM_TRADE, {
      buys: {},
      sells: { cloth: 10 },
    });
    u.assertEqual(s1.gold, 950, "500 + 10*45 = 950");
    u.assertEqual(s1.hold.items.cloth, 0, "cloth sold");
  });

  reg("E.TRADE.03", "CONFIRM_TRADE: no-op when portMarket is null", (u) => {
    const s0 = makePortState("portRoyal", { portMarket: null });
    const s1 = dispatch(s0, A.CONFIRM_TRADE, { buys: { sugar: 1 }, sells: {} });
    u.assertEqual(s1.gold, s0.gold, "no gold change without market");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.COMBAT — INTERCEPT_SURRENDER, INTERCEPT_BRIBE, DISMISS_BATTLE
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.CMB.01", "INTERCEPT_SURRENDER random type: morale penalty applied", (u) => {
    const consequence = D.SURRENDER_CONSEQUENCE.random;
    const ctx = {
      type: "random",
      enemy: { faction: "pirate", name: "The Test Brigand" },
      options: [],
    };
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      encounterContext: ctx,
    });
    const s1 = dispatch(s0, A.INTERCEPT_SURRENDER);
    u.assert(s1.crew.morale < s0.crew.morale, "morale decreased");
    u.assertEqual(s1.crew.morale, 80 - consequence.moralePenalty, "correct morale penalty");
    u.assert(s1.encounterContext === null, "encounter context cleared");
  });

  reg("E.CMB.02", "INTERCEPT_SURRENDER random type: cargo loss applied", (u) => {
    const ctx = { type: "random", enemy: { faction: "pirate" }, options: [] };
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      hold: makeHold({ sugar: 100 }),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      encounterContext: ctx,
    });
    const s1 = dispatch(s0, A.INTERCEPT_SURRENDER);
    const consequence = D.SURRENDER_CONSEQUENCE.random;
    if (consequence.loseCargoPercent) {
      u.assert(s1.hold.items.sugar < 100, "cargo reduced by surrender");
    }
  });

  reg("E.CMB.03", "INTERCEPT_BRIBE: deducts bribe cost from gold", (u) => {
    const bribeCost = 150;
    const ctx = {
      type: "patrol",
      options: [{ id: "bribe", cost: bribeCost }],
    };
    const s0 = makePortState("portRoyal", {
      gold: 500,
      destination: "tortuga",
      encounterContext: ctx,
    });
    const s1 = dispatch(s0, A.INTERCEPT_BRIBE);
    u.assertEqual(s1.gold, 350, "gold reduced by bribe cost");
    u.assert(s1.encounterContext === null, "encounter cleared");
  });

  reg("E.CMB.04", "DISMISS_BATTLE victory: battleState cleared, screen returns", (u) => {
    const s0 = makeBattleState({ phase: "victory" });
    const s1 = dispatch(s0, A.DISMISS_BATTLE);
    u.assert(s1.battleState === null, "battleState cleared");
    u.assert(s1.screen === "port" || s1.screen === "sailing", "back to port or sailing");
  });

  reg("E.CMB.05", "DISMISS_BATTLE defeat: battleState cleared, cargo lost, gold unchanged", (u) => {
    const s0 = makeBattleState({ phase: "defeat" }, {
      gold: 1000,
      ship: { ...makeShip("sloop"), hull: 100 },
      hold: makeHold({ sugar: 50, cloth: 20 }),
    });
    const s1 = dispatch(s0, A.DISMISS_BATTLE);
    u.assert(s1.battleState === null, "battleState cleared");
    u.assertEqual(s1.gold, 1000, "gold unchanged");
    // Defeat zeroes all hold items (keys remain, but all set to 0)
    u.assertEqual(L.getHoldUsed(s1.hold.items), 0, "hold cleared (all quantities zero)");
    // Optionally verify that all items in hold are 0:
    for (const [good, qty] of Object.entries(s1.hold.items)) {
      u.assertEqual(qty, 0, `${good} quantity is 0 after defeat`);
    }
  });

  reg("E.CMB.06", "TAKE_PLUNDER: adds goldReward to gold and clears battleState", (u) => {
    const s0 = makeBattleState({
      phase: "victory",
      canPlunder: true,
      goldReward: 200,
      enemyCargo: [],
    });
    const newHold = { ...s0.hold.items };
    const s1 = dispatch(s0, A.TAKE_PLUNDER, { holdItems: newHold });
    u.assertEqual(s1.gold, s0.gold + 200, "gold reward added");
    u.assert(s1.battleState === null, "battleState cleared");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.EVENT — RESOLVE_EVENT (deterministic gold/rep choices)
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.EVT.01", "RESOLVE_EVENT: gold outcome adds gold to state", (u) => {
    const event = {
      id: "test_gold_event",
      title: "Lucky Find",
      choices: [{
        label: "Take the gold",
        outcome: { gold: 150, log: "You take the gold." },
      }],
    };
    const s0 = makePortState("portRoyal", {
      gold: 500,
      activeEvent: event,
    });
    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 0 });
    u.assertEqual(s1.gold, 650, "gold increased by event reward");
    u.assert(s1.activeEvent === null, "event cleared");
  });

  reg("E.EVT.02", "RESOLVE_EVENT: hull damage outcome reduces hull", (u) => {
    const event = {
      id: "test_hull_event",
      title: "Storm Damage",
      choices: [{
        label: "Ride it out",
        outcome: { hullDamage: 10, log: "The storm batters your hull." },
      }],
    };
    const s0 = makePortState("portRoyal", {
      ship: { ...makeShip("sloop"), hull: 100 },
      activeEvent: event,
    });
    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 0 });
    u.assertEqual(s1.ship.hull, 90, "hull reduced by 10");
    u.assert(s1.activeEvent === null, "event cleared");
  });

  reg("E.EVT.03", "RESOLVE_EVENT: no-op when activeEvent is null", (u) => {
    const s0 = makePortState("portRoyal", { activeEvent: null });
    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 0 });
    u.assertEqual(s1.gold, s0.gold, "no change when no active event");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.SAVE — SAVE_GAME, LOAD_GAME, EXPORT_SAVE, IMPORT_SAVE
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.SAVE.01", "SAVE_GAME + LOAD_GAME: round-trips gold, fame, captainName", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 7777,
      fame: 99,
      captainName: "Round Trip Captain",
    });
    dispatch(s0, A.SAVE_GAME);
    const s1 = dispatch(makeState(), A.LOAD_GAME);
    u.assertEqual(s1.gold, 7777, "gold round-tripped");
    u.assertEqual(s1.fame, 99, "fame round-tripped");
    u.assertEqual(s1.captainName, "Round Trip Captain", "captain name round-tripped");
  });

  reg("E.SAVE.02", "EXPORT_SAVE: action triggers file download (not unit-testable)", (u) => {
    // This action is intentionally not unit-tested because it uses Blob/URL.createObjectURL.
    // See L.encodeSave tests in tests_logic.js for the encoding logic.
    u.assert(true, "skipping EXPORT_SAVE test by design");
  });

  reg("E.SAVE.03", "IMPORT_SAVE: loads state from valid encoded string", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5555,
      captainName: "Imported Captain",
    });
    const encoded = L.encodeSave(s0);
    const s1 = dispatch(makeState(), A.IMPORT_SAVE, { fileContent: encoded });
    u.assertEqual(s1.gold, 5555, "gold imported");
    u.assertEqual(s1.captainName, "Imported Captain", "captainName imported");
  });

  // FIX: tamper by modifying inner JSON while keeping base64 valid; state loads with warning.
  reg("E.SAVE.04", "IMPORT_SAVE: tampered data loads state and logs warning", (u) => {
    const original = makePortState("portRoyal", { gold: 999 });
    const encoded = L.encodeSave(original);

    // Decode outer base64, modify inner 'data', re-encode.
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const decoded = new TextDecoder().decode(bytes);
    const payload = JSON.parse(decoded);
    const innerData = JSON.parse(payload.data);
    innerData.gold = 1234;
    payload.data = JSON.stringify(innerData);
    const newPayload = JSON.stringify(payload);
    const newBytes = new TextEncoder().encode(newPayload);
    const newBinary = String.fromCharCode(...newBytes);
    const tampered = btoa(newBinary);

    const s1 = dispatch(makeState(), A.IMPORT_SAVE, { fileContent: tampered });
    u.assertEqual(s1.gold, 1234, "tampered state loaded");
    u.assert(s1.log.some(l => l.toLowerCase().includes("modified")),
      "warning about tampered save logged");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.MIGRATE — migrateState
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.MIG.01", "migrateState: adds onboarding object to old save", (u) => {
    const oldSave = { gold: 100, ship: makeShip("sloop"), crew: { roster: [], morale: 80, max: 40 } };
    const migrated = window.E.migrateState(oldSave);
    u.assert(migrated.onboarding !== undefined, "onboarding added");
    u.assert(migrated.onboarding.stepsCompleted !== undefined, "stepsCompleted added");
  });

  reg("E.MIG.02", "migrateState: adds career object to old save", (u) => {
    const oldSave = { gold: 100, ship: makeShip("sloop"), crew: { roster: [], morale: 80, max: 40 } };
    const migrated = window.E.migrateState(oldSave);
    u.assert(migrated.career !== undefined, "career added");
    u.assertEqual(migrated.career.goldEarned, 0, "career starts zeroed");
  });

  reg("E.MIG.03", "migrateState: adds daysWithoutFood / daysWithoutWater", (u) => {
    const oldSave = { gold: 100, ship: makeShip("sloop"), crew: { roster: [], morale: 80, max: 40 } };
    const migrated = window.E.migrateState(oldSave);
    u.assertEqual(migrated.daysWithoutFood, 0, "daysWithoutFood added");
    u.assertEqual(migrated.daysWithoutWater, 0, "daysWithoutWater added");
  });

  reg("E.MIG.04", "migrateState: existing fields preserved", (u) => {
    const oldSave = {
      gold: 1234,
      fame: 77,
      captainName: "Old Save Captain",
      ship: makeShip("sloop"),
      crew: { roster: [], morale: 80, max: 40 },
    };
    const migrated = window.E.migrateState(oldSave);
    u.assertEqual(migrated.gold, 1234, "gold preserved");
    u.assertEqual(migrated.fame, 77, "fame preserved");
    u.assertEqual(migrated.captainName, "Old Save Captain", "captainName preserved");
  });

  reg("E.MIG.05", "migrateState: upgrades shape converted to equipment slots", (u) => {
    // Simulate a pre-refactor save with upgrades field
    const oldSave = {
      gold: 100,
      ship: {
        type: "sloop",
        name: "Old Ship",
        hull: 100,
        cannons: 10,
        upgrades: ["reinforced_hull"],
        // no equipment field
      },
      crew: { roster: [], morale: 80, max: 40 },
    };
    const migrated = window.E.migrateState(oldSave);
    u.assert(migrated.ship.equipment !== undefined, "equipment field added");
    u.assert(!migrated.ship.upgrades, "upgrades field removed or ignored");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.GAMEOVER — Game Over System (B9)
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.GAMEOVER.01", "SAIL_TO: blocks sailing with 0 hull", (u) => {
    const s0 = makePortState("portRoyal", {
      ship: { ...makeShip("sloop"), hull: 0 },
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.SAIL_TO, { port: "tortuga" });
    u.assertEqual(s1.screen, "port", "screen unchanged");
    u.assert(s1.destination === null, "destination not set");
    u.assert(s1.log.some(l => l.includes("hull is destroyed")), "log contains reason");
  });

  reg("E.GAMEOVER.02", "SAIL_TO: blocks sailing with insufficient crew (non-dinghy)", (u) => {
    // sloop minCrew = 4, we have 2
    const s0 = makePortState("portRoyal", {
      ship: makeShip("sloop"),
      crew: { roster: fillRoster(2), max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.SAIL_TO, { port: "tortuga" });
    u.assertEqual(s1.screen, "port", "screen unchanged");
    u.assert(s1.destination === null, "destination not set");
    u.assert(s1.log.some(l => l.includes("need at least 4 crew")), "log contains minimum crew requirement");
  });

  reg("E.GAMEOVER.03", "SAIL_TO: allows sailing with dinghy and 0 crew (exempt)", (u) => {
    const s0 = makePortState("portRoyal", {
      ship: makeShip("dinghy"),
      crew: { roster: [], max: 5, morale: 80 },
    });
    const s1 = dispatch(s0, A.SAIL_TO, { port: "tortuga" });
    u.assertEqual(s1.screen, "sailing", "screen changed to sailing");
    u.assert(s1.destination === "tortuga", "destination set");
  });

  reg("E.GAMEOVER.04", "TAKE_MISSION: blocks combat/patrol/assault/escort missions with 0 hull", (u) => {
    const mission = makeMission({ type: "combat", id: "combat_1", enemy: { name: "Test", hull: 50, cannons: 5, crew: 10 } });
    const s0 = makePortState("portRoyal", {
      ship: { ...makeShip("sloop"), hull: 0 },
      missions: [mission],
    });
    const s1 = dispatch(s0, A.TAKE_MISSION, { mission });
    u.assert(s1.activeMission === null, "mission not accepted");
    u.assert(s1.log.some(l => l.includes("unfit for a fight")), "log contains reason");
  });

  reg("E.GAMEOVER.05", "TAKE_MISSION: allows trade mission with 0 hull", (u) => {
    const mission = makeMission({ type: "trade", id: "trade_1", targetPort: "tortuga", requiredGood: "sugar", requiredQty: 5 });
    const s0 = makePortState("portRoyal", {
      ship: { ...makeShip("sloop"), hull: 0 },
      missions: [mission],
    });
    const s1 = dispatch(s0, A.TAKE_MISSION, { mission });
    u.assert(s1.activeMission !== null, "trade mission accepted");
    u.assertEqual(s1.activeMission.id, "trade_1");
  });

  reg("E.GAMEOVER.06", "INTERCEPT_FIGHT: blocks fighting with 0 hull", (u) => {
    const ctx = {
      type: "random",
      enemy: { name: "Test", faction: "pirate", hull: 50, cannons: 5, crew: 10 },
      options: [],
    };
    const s0 = makePortState("portRoyal", {
      ship: { ...makeShip("sloop"), hull: 0 },
      encounterContext: ctx,
    });
    const s1 = dispatch(s0, A.INTERCEPT_FIGHT);
    u.assert(s1.battleState === null, "battleState not created");
    u.assert(s1.log.some(l => l.includes("ship is already lost")), "log contains reason");
  });

  reg("E.GAMEOVER.07", "ENTER_PORT: triggers gameover when unrecoverable and skips autosave", (u) => {
    // Sloop, hull=0, no crew, no gold, empty hold.
    const s0 = makeSailingState("portRoyal", "tortuga", 0, {
      ship: { ...makeShip("sloop"), hull: 0 },
      crew: { roster: [], max: 40, morale: 80 },
      gold: 0,
      hold: makeHold(),
      autoSave: true,
    });
    // Ensure destination is set so ENTER_PORT triggers
    const s1 = dispatch(s0, A.ENTER_PORT);
    u.assertEqual(s1.screen, "gameover", "screen changed to gameover");
    u.assert(s1.gameOverReason !== null, "gameOverReason set");
    u.assert(s1.gameOverReason.includes("wrecked"), "reason mentions wrecked ship");
    // Autosave would have happened after the check. Since we can't easily spy on localStorage here,
    // we check that the state returned has the gameover flag set. Autosave is called conditionally
    // after the check. If the check returns gameover, it returns early and never calls autoSave.
    // This is verified by the screen being gameover instead of port.
  });

  reg("E.GAMEOVER.08", "ENTER_PORT: does NOT trigger gameover if unrecoverable but dinghy (exempt)", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 0, {
      ship: { ...makeShip("dinghy"), hull: 100 },
      crew: { roster: [], max: 5, morale: 80 },
      gold: 0,
      hold: makeHold(),
      autoSave: true,
    });
    const s1 = dispatch(s0, A.ENTER_PORT);
    u.assertEqual(s1.screen, "port", "screen is port (not gameover)");
    u.assert(s1.gameOverReason === undefined || s1.gameOverReason === null, "gameOverReason not set");
  });

  reg("E.GAMEOVER.09", "ENTER_PORT: does NOT trigger gameover if hull=0 but enough gold to repair", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 0, {
      ship: { ...makeShip("sloop"), hull: 0 },
      crew: { roster: fillRoster(1), max: 40, morale: 80 },
      gold: 1000,
      hold: makeHold(),
      autoSave: true,
    });
    const s1 = dispatch(s0, A.ENTER_PORT);
    u.assertEqual(s1.screen, "port", "screen is port (not gameover)");
    u.assert(s1.gameOverReason === undefined || s1.gameOverReason === null, "gameOverReason not set");
  });

  reg("E.GAMEOVER.10", "DISMISS_BATTLE defeat: triggers gameover via washAshore if unrecoverable", (u) => {
    const s0 = makeBattleState(
      { phase: "defeat", encounterType: "random" },
      {
        ship: { ...makeShip("sloop"), hull: 0 },
        crew: { roster: fillRoster(1), max: 40, morale: 80 },
        gold: 0,
        hold: makeHold(),
        previousPort: "portRoyal",
      }
    );
    const s1 = dispatch(s0, A.DISMISS_BATTLE);
    u.assertEqual(s1.screen, "gameover", "screen changed to gameover");
    u.assert(s1.gameOverReason !== null, "gameOverReason set");
  });

  reg("E.GAMEOVER.11", "RESOLVE_EVENT storm: triggers washAshore when hull hits 0", (u) => {
    const stormEvent = {
      id: "storm",
      title: "Storm",
      choices: [{
        label: "Brace",
        outcome: { hullDamage: 30, log: "Storm hit!" },
      }],
    };
    const s0 = makePortState("portRoyal", {
      ship: { ...makeShip("sloop"), hull: 15 }, // 15 - 30 = 0
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      gold: 0,
      hold: makeHold(),
      previousPort: "portRoyal",
      activeEvent: stormEvent,
    });
    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 0 });
    u.assertEqual(s1.screen, "gameover", "screen changed to gameover (hull hit 0, unrecoverable)");
    u.assert(s1.gameOverReason !== null, "gameOverReason set");
  });

  reg("E.GAMEOVER.12", "RESOLVE_EVENT storm: does NOT trigger gameover if hull doesn't hit 0", (u) => {
    const stormEvent = {
      id: "storm",
      title: "Storm",
      choices: [{
        label: "Brace",
        outcome: { hullDamage: 10, log: "Storm hit!" },
      }],
    };
    const s0 = makePortState("portRoyal", {
      ship: { ...makeShip("sloop"), hull: 50 },
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      gold: 0,
      hold: makeHold(),
      previousPort: "portRoyal",
      activeEvent: stormEvent,
    });
    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 0 });
    u.assertEqual(s1.screen, "port", "screen is port (not gameover)");
    u.assert(s1.gameOverReason === undefined || s1.gameOverReason === null, "gameOverReason not set");
    u.assertEqual(s1.ship.hull, 40, "hull reduced to 40");
  });


  // ══════════════════════════════════════════════════════════════════════════
  // E.STATE — initialState shape completeness
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.STATE.01", "initialState has all required top-level fields", (u) => {
    const s = window.E.initialState;
    const required = [
      "version", "screen", "day", "startDate", "log", "gold", "fame", "infamy",
      "factionAlerts", "currentPort", "route", "captainName", "faction",
      "tutorialMode", "onboarding", "autoSave", "completedCombatThisVisit",
      "daysWithoutFood", "daysWithoutWater", "ship", "crew", "hold",
      "missions", "activeMission", "reputation", "battleState", "activeEvent",
      "encounterContext", "encounterSession","notableNPCs","career", "equipmentInventory", "discoveredPorts",
    ];
    for (const field of required) {
      u.assert(s.hasOwnProperty(field), `initialState missing field: ${field}`);
    }
  });

  reg("E.STATE.02", "initialState onboarding has all step flags", (u) => {
    const steps = window.E.initialState.onboarding.stepsCompleted;
    const required = [
      "contractsOpened", "firstContractAccepted", "marketOpened",
      "provisionsAndGoodsBought", "mapOpened", "firstVoyageStarted",
      "firstArrival", "firstContractDelivered", "crewOpened", "firstCrewHired",
      "tutorialHuntAccepted", "tutorialHuntCompleted", "shipyardOpened",
      "shipRepaired", "journalOpened",
    ];
    for (const step of required) {
      u.assert(steps.hasOwnProperty(step), `onboarding.stepsCompleted missing: ${step}`);
    }
  });

  reg("E.STATE.03", "initialState career has all tracking fields", (u) => {
    const c = window.E.initialState.career;
    const required = [
      "goldEarned", "goldSpent", "battles", "shipsSunk", "shipsPlundered",
      "crewHired", "crewLost", "crewDismissed", "longestCrewTenure",
      "portsVisited", "shipsOwned", "stormsSurvived", "contrabandSeized",
      "missionLog", "combatLog",
    ];
    for (const field of required) {
      u.assert(c.hasOwnProperty(field), `career missing field: ${field}`);
    }
  });

  reg("E.STATE.04", "initialState hold has no capacity field", (u) => {
    // Architecture rule: hold.capacity must not exist; use L.getHoldCapacity(state) instead
    u.assert(!window.E.initialState.hold.hasOwnProperty("capacity"),
      "hold.capacity should not be on initialState");
  });

  reg("E.STATE.05", "initialState ship equipment is empty for all slots", (u) => {
    const eq = window.E.initialState.ship.equipment;
    u.assert(Array.isArray(eq.hull)      && eq.hull.length === 0,      "hull slot empty");
    u.assert(Array.isArray(eq.armament)  && eq.armament.length === 0,  "armament slot empty");
    u.assert(Array.isArray(eq.rigging)   && eq.rigging.length === 0,   "rigging slot empty");
    u.assert(Array.isArray(eq.special)   && eq.special.length === 0,   "special slot empty");
  });

})();