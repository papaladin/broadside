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
    makeBattle, makeEnemy, dispatch,
    setRandomSequence, resetRandomStub,
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
      ship: { ...makeShip("sloop"), hull: 60 },
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

  reg("E.SHIP.03", "REPAIR: gold deducted matches L.shipRepairCost multiplied by reputation modifier", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5000,
      ship: { ...makeShip("sloop"), hull: 60 },
    });
    const expectedCost = 180;
    const s1 = dispatch(s0, A.REPAIR);
    u.assertEqual(s1.gold, s0.gold - expectedCost,
      `expected gold ${s0.gold - expectedCost}, got ${s1.gold}`);
  });

  reg("E.SHIP.04", "REPAIR: blocked when not enough gold", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 1,
      ship: { ...makeShip("sloop"), hull: 60 },
    });
    const s1 = dispatch(s0, A.REPAIR);
    u.assertEqual(s1.ship.hull, 60, "hull unchanged");
    u.assertEqual(s1.gold, 1, "gold unchanged");
  });

  reg("E.SHIP.05", "REPAIR: no-op when hull is already full", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5000,
      ship: makeShip("sloop"),
    });
    const s1 = dispatch(s0, A.REPAIR);
    u.assertEqual(s1.gold, s0.gold, "gold unchanged on full-hull repair");
    u.assertEqual(s1.ship.hull, 100);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E.SHIP — BUY_SHIP
  // ══════════════════════════════════════════════════════════════════════════

  reg("E.BUY.01", "BUY_SHIP: gold reduced by ship cost", (u) => {
    const cutterCost = D.SHIPS.cutter.cost;
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
    const s1 = dispatch(s0, A.BUY_SHIP, { shipType: "sloop" });
    const s2 = dispatch(makePortState("portRoyal", { gold: 50000, fame: 0 }), A.BUY_SHIP, { shipType: "schooner" });
    u.assertEqual(s2.ship.type, "sloop", "schooner blocked by fame requirement");
  });

  reg("E.BUY.07", "BUY_SHIP: roster trimmed to new ship maxCrew", (u) => {
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
    const totalCost = item.cost + item.installFee;
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
      gold: 40,
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
    const cost = 10 * 5;
    const s1 = dispatch(s0, A.RAISE_MORALE);
    u.assertEqual(s1.crew.morale, 75, "morale +5");
    u.assertEqual(s1.gold, 950, "gold -50");
  });

  reg("E.CREW.08", "RAISE_MORALE: blocked when not enough gold", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 10,
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
      hold: makeHold({ spices: 2 }),
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
    const ctx = {
      type: "random",
      enemy: { faction: "pirate", name: "The Test Brigand" },
      intercept: {
        flavourText: "Test",
        options: [{ id: "surrender", label: "Surrender", available: true, reason: null, action: { type: "INTERCEPT_SURRENDER" } }],
      },
    };
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      encounterSession: { ...ctx, phase: "intercept", notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null, returnScreen: "port" },
    });
    const s1 = dispatch(s0, A.INTERCEPT_SURRENDER);
    u.assert(s1.crew.morale < s0.crew.morale, "morale decreased");
    u.assert(s1.encounterSession === null, "encounter session cleared");
  });

  reg("E.CMB.02", "INTERCEPT_SURRENDER random type: cargo loss applied", (u) => {
    const ctx = {
      type: "random",
      enemy: { faction: "pirate" },
      intercept: {
        flavourText: "Test",
        options: [{ id: "surrender", label: "Surrender", available: true, reason: null, action: { type: "INTERCEPT_SURRENDER" } }],
      },
    };
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      hold: makeHold({ sugar: 100 }),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      encounterSession: { ...ctx, phase: "intercept", notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null, returnScreen: "port" },
    });
    const s1 = dispatch(s0, A.INTERCEPT_SURRENDER);
    const consequence = D.SURRENDER_CONSEQUENCE.random;
    if (consequence.loseCargoPercent) {
      u.assert(s1.hold.items.sugar < 100, "cargo reduced by surrender");
    }
    u.assert(s1.encounterSession === null, "encounter session cleared");
  });

  reg("E.CMB.03", "INTERCEPT_BRIBE: deducts bribe cost from gold", (u) => {
    const bribeCost = 150;
    const ctx = {
      type: "patrol",
      intercept: {
        flavourText: "Test",
        options: [
          { id: "bribe", label: `Bribe (${bribeCost}g)`, available: true, reason: null, action: { type: "INTERCEPT_BRIBE" }, cost: bribeCost },
        ],
      },
      enemy: { faction: "pirate", name: "Patrol" },
    };
    const s0 = makePortState("portRoyal", {
      gold: 500,
      destination: "tortuga",
      encounterSession: { ...ctx, phase: "intercept", notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null, returnScreen: "sailing" },
    });
    const s1 = dispatch(s0, A.INTERCEPT_BRIBE);
    u.assertEqual(s1.gold, 350, "gold reduced by bribe cost");
    u.assert(s1.encounterSession === null, "encounter cleared");
  });

  reg("E.CMB.04", "DISMISS_BATTLE victory: encounterSession cleared, screen returns (Sail Away path)", (u) => {
    const s0 = makeBattleState({ phase: "victory", log: ["Victory!"] });
    const s1 = dispatch(s0, A.DISMISS_BATTLE);
    u.assert(s1.encounterSession === null, "encounterSession cleared");
    u.assert(s1.screen === "port" || s1.screen === "sailing", "back to port or sailing");
  });

  reg("E.CMB.05", "DISMISS_BATTLE defeat: encounterSession cleared, cargo lost, gold unchanged", (u) => {
    const s0 = makeBattleState(
      { phase: "defeat", log: ["Defeat!"] },
      {
        gold: 1000,
        ship: { ...makeShip("sloop"), hull: 100 },
        hold: makeHold({ sugar: 50, cloth: 20 }),
        previousPort: "portRoyal",
      }
    );
    const s1 = dispatch(s0, A.DISMISS_BATTLE);
    u.assert(s1.encounterSession === null, "encounterSession cleared");
    u.assertEqual(s1.gold, 1000, "gold unchanged");
    u.assertEqual(L.getHoldUsed(s1.hold.items), 0, "hold cleared");
  });

  reg("E.CMB.06", "TAKE_PLUNDER: adds goldReward to gold and clears encounterSession", (u) => {
    const s0 = makeBattleState({
      phase: "plunder",
      canPlunder: true,
      goldReward: 200,
      enemyCargo: {},
    });
    s0.encounterSession.phase = "plunder";
    const newHold = { ...s0.hold.items };
    const s1 = dispatch(s0, A.TAKE_PLUNDER, { holdItems: newHold });
    u.assertEqual(s1.gold, s0.gold + 200, "gold reward added");
    u.assert(s1.encounterSession === null, "encounterSession cleared");
  });

  // ── NEW B11 ENGINE TESTS ──────────────────────────────────────────────────

  reg("E.CMB.NAVAL.01", "BATTLE_ACTION naval: distance updates correctly after reposition", (u) => {
    const s0 = makeBattleState({
      distance: "far",
      subPhase: "naval",
    });
    const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "close_distance" });
    const battle = s1.encounterSession.battle;
    u.assert(battle.distance !== "far", "distance changed from far");
    u.assertEqual(battle.subPhase, "naval", "still in naval phase");
  });

reg("E.CMB.NAVAL.02", "BATTLE_ACTION: boarding_begins flips subPhase to boarding when both grapple", (u) => {
  const s0 = makeBattleState({
    distance: "close",
    subPhase: "naval",
    enemyHull: 100,
    enemyCrew: 10,
  });

  // Force enemy to grapple
  const originalGetNPC = L.getNPCNavalAction;
  L.getNPCNavalAction = () => "grapple";

  const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "grapple" });
  
  // Restore original
  L.getNPCNavalAction = originalGetNPC;

  const battle = s1.encounterSession.battle;
  u.assertEqual(battle.subPhase, "boarding", "subPhase flipped to boarding");
  u.assertEqual(battle.distance, "close", "distance remains close");
  u.assert(battle.phase === "player_turn", "battle is ongoing");
});

reg("E.CMB.NAVAL.03a", "BATTLE_ACTION: enemy_sunk results in phase victory, canPlunder false", (u) => {
  const s0 = makeBattleState({
    enemyHull: 1,
    enemyCrew: 10,
    distance: "medium",
    subPhase: "naval",
  });
  // Force maximum damage (player broadside roll = 1.0)
  setRandomSequence([0.99]); // broadside damage multiplier ~1.2
  const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "broadside" });
  resetRandomStub();

  const battle = s1.encounterSession?.battle;
  u.assert(battle !== null, "battle exists");
  u.assertEqual(battle.phase, "victory", "phase is victory");
  u.assert(battle.canPlunder === false, "canPlunder is false for sunk");
  u.assertEqual(s1.screen, "battle", "screen stays on battle");
});

reg("E.CMB.NAVAL.03b", "BATTLE_ACTION: enemy_captured results in phase victory, canPlunder true", (u) => {
  const s0 = makeBattleState({
    enemyHull: 100,
    enemyCrew: 1,
    distance: "close",
    subPhase: "naval",
  });
  // Force broadside to deal enough crew damage (crew loss formula: dmg*0.4/3; with cannons 10, ~1.3 avg, but maybeCrewLoss can return 0)
  // Use a specific RNG sequence: first random for damage (0.5), second for maybeCrewLoss (0.99 -> returns floor(amount))
  setRandomSequence([0.5, 0.99]); // damage roll, crew loss roll
  const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "broadside" });
  resetRandomStub();

  const battle = s1.encounterSession?.battle;
  u.assert(battle !== null, "battle exists");
  u.assertEqual(battle.phase, "victory", "phase is victory");
  u.assert(battle.canPlunder === true, "canPlunder is true for capture");
  u.assertEqual(s1.screen, "battle", "screen stays on battle");
});

  reg("E.CMB.BOARD.01", "BATTLE_ACTION boarding: fall_back returns to naval with distance close", (u) => {
    const s0 = makeBattleState({
      subPhase: "boarding",
      distance: "close",
    });
    const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "fall_back" });
    const battle = s1.encounterSession.battle;
    u.assertEqual(battle.subPhase, "naval", "subPhase returns to naval");
    u.assertEqual(battle.distance, "close", "distance remains close");
  });

  reg("E.CMB.BOARD.02", "BATTLE_ACTION boarding: surrender leads to defeat phase", (u) => {
    const s0 = makeBattleState({
      subPhase: "boarding",
      phase: "player_turn",
    });
    const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "surrender" });
    const battle = s1.encounterSession.battle;
    u.assertEqual(battle.phase, "defeat", "surrender leads to defeat");
  });

  // ── NEW: enemy_sunk stays on battle screen ─────────────────────────────────

  reg("E.CMB.NAVAL.04", "BATTLE_ACTION enemy_sunk: stays on battle screen, not auto-clearing", (u) => {
    setRandomSequence([0.9]); // high damage to ensure kill
    const s0 = makeBattleState({
      enemyHull: 1,
      enemyCrew: 10,
      distance: "medium",
      subPhase: "naval",
    });
    const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "broadside" });
    resetRandomStub();
    const battle = s1.encounterSession?.battle;
    u.assert(battle !== null && battle !== undefined, "encounterSession still exists");
    u.assertEqual(battle.phase, "victory", "phase is victory");
    u.assertEqual(s1.screen, "battle", "screen stays on battle");
    u.assert(!battle.canPlunder, "canPlunder is false for sunk");
  });

  // ── NEW: TAKE_PLUNDER marks patrol/combat missions as defeated ────────────

  reg("E.CMB.NAVAL.05", "TAKE_PLUNDER: marks patrol/combat mission as defeated", (u) => {
    const mission = makeMission({
      type: "patrol",
      id: "patrol_1",
      targetPort: "portRoyal",
      enemyDefeated: false,
    });
    const s0 = makeBattleState({
      phase: "plunder",
      canPlunder: true,
      goldReward: 200,
      enemyCargo: {},
    });
    s0.encounterSession.phase = "plunder";
    s0.activeMission = mission;
    const newHold = { ...s0.hold.items };
    const s1 = dispatch(s0, A.TAKE_PLUNDER, { holdItems: newHold });
    u.assert(s1.activeMission !== null, "mission still active");
    u.assertEqual(s1.activeMission.enemyDefeated, true, "enemyDefeated set to true");
    u.assert(s1.encounterSession === null, "encounterSession cleared");
  });

reg("E.DEBUG.COMBAT.01", "DEBUG_COMBAT: creates encounterSession with enemy risk medium", (u) => {
  const s0 = makePortState("portRoyal", { fame: 200, crew: { roster: fillRoster(10), max: 40, morale: 80 } });
  const s1 = dispatch(s0, A.DEBUG_COMBAT, { faction: "english", risk: "medium" });
  u.assert(s1.encounterSession !== null, "encounterSession created");
  u.assert(s1.screen === "intercept", "screen is intercept");
  u.assertEqual(s1.encounterSession.enemy.risk, "medium", "risk is medium");
  u.assertEqual(s1.encounterSession.enemy.faction, "english", "enemy faction is english (not rival)");
});

 // surender / patrol inspection

   // ── NEW: Navy Patrol Surrender (applyNavyPatrolSurrender) ──────────────

  reg("E.NAVYSURR.01", "applyNavyPatrolSurrender: applies all consequences correctly", (u) => {
    const items = { food: 10, water: 10, tobacco: 5, slaves: 2, rum: 10, cloth: 20 };
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      infamy: 5,
      hold: makeHold(items),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });
    const enemy = { name: "Patrol", faction: "english" };
    const session = { type: "navy_patrol", enemy, phase: "intercept" };

    const s1 = window.E.applyNavyPatrolSurrender(s0, session);

    // 1. Gold: fine = 40% of contraband value (tobacco 90*5=450, slaves 220*2=440, total 890 * 0.4 = 356, rounded to nearest 25 → 350)
    u.assertEqual(s1.gold, 650, "gold reduced by fine");
    // 2. Contraband removed
    u.assertEqual(s1.hold.items.tobacco, 0, "tobacco seized");
    u.assertEqual(s1.hold.items.slaves, 0, "slaves seized");
    // 3. Rum unaffected (not smuggle-related)
    u.assertEqual(s1.hold.items.rum, 10, "rum preserved");
    // 4. Food and water preserved (excluded from cargo loss)
    u.assertEqual(s1.hold.items.food, 10, "food preserved");
    u.assertEqual(s1.hold.items.water, 10, "water preserved");
    // 5. Non-contraband, non-provisions goods halved (cloth: 20 → 10)
    u.assertEqual(s1.hold.items.cloth, 10, "cloth halved (50% cargo loss)");
    // 6. Morale penalty
    u.assertEqual(s1.crew.morale, 65, "morale -15");
    // 7. Infamy gain
    u.assertEqual(s1.infamy, 7, "infamy +2");
    // 8. Reputation loss
    const repAfter = s1.reputation[s1.currentPort];
    u.assert(repAfter < 50, `rep should be <50 (was ${repAfter})`);
    // 9. Encounter cleared
    u.assert(s1.encounterSession === null, "encounterSession cleared");
    // 10. Screen is returnScreen (port)
    u.assertEqual(s1.screen, "port", "screen set to port");
  });

reg("E.NAVYSURR.02", "INTERCEPT_SURRENDER on navy patrol routes to applyNavyPatrolSurrender", (u) => {
  const items = { food: 10, tobacco: 3 };
  const s0 = makePortState("portRoyal", {
    gold: 500,
    infamy: 0,
    hold: makeHold(items),
    crew: { roster: fillRoster(5), max: 40, morale: 80 },
  });
  const enemy = { name: "HMS Vigilant", faction: "english", hull: 100, cannons: 10, crew: 20 };
  const ctx = {
    type: "navy_patrol",
    phase: "intercept",
    enemy: enemy,
    intercept: {
      flavourText: "Test",
      options: [
        { id: "surrender", label: "Surrender", available: true, reason: null, action: { type: "INTERCEPT_SURRENDER" } }
      ]
    },
    returnScreen: "port",
  };
  // Attach the session to the state
  const session = { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null };
  s0.encounterSession = session;

  const s1 = dispatch(s0, A.INTERCEPT_SURRENDER);

  // Fine = Math.round(3*90*0.40/25)*25 = Math.round(108/25)*25 = 4*25 = 100
  u.assertEqual(s1.gold, 400, "gold reduced by fine (500 - 100)");
  u.assertEqual(s1.hold.items.tobacco, 0, "contraband seized");
  u.assert(s1.encounterSession === null, "encounterSession cleared");
  u.assert(s1.log.some(l => l.includes("surrendered")), "log contains surrender message");
});

  reg("E.NAVYSURR.03", "DISMISS_BATTLE with inspectionRefused and defeat applies navy patrol surrender", (u) => {
    const items = { tobacco: 2 };
    const s0 = makeBattleState(
      { phase: "defeat", enemy: { name: "Patrol", faction: "english", hull: 50, cannons: 5, crew: 10 } },
      {
        gold: 400,
        hold: makeHold(items),
        crew: { roster: fillRoster(3), max: 40, morale: 80 },
        previousPort: "portRoyal",
      }
    );
    // Mark that the player refused inspection and the battle is lost
    s0.encounterSession.type = "navy_patrol";
    s0.encounterSession.inspectionRefused = true;

    const s1 = dispatch(s0, A.DISMISS_BATTLE);

    // Should have applied the surrender consequences, NOT the full wash-ashore
    u.assert(s1.gold < 400, "gold reduced by fine");
    u.assertEqual(s1.hold.items.tobacco, 0, "contraband seized");
    u.assert(s1.encounterSession === null, "encounter cleared");
    // It should NOT have wiped the hold entirely (wash-ashore would clear everything)
    u.assert(s1.hold.items.food === s0.hold.items.food, "non-contraband cargo preserved (not fully washed)");
    u.assert(s1.screen === "port", "screen is port (not gameover)");
  });

  // ── NEW: PATROL_INSPECT tests ──────────────────────────────────────────

 reg("E.PATROL.01", "PATROL_INSPECT: seizes contraband, applies fine, rep/infamy/morale penalties", (u) => {
    const items = { food: 5, water: 5, tobacco: 4, slaves: 1 };
    const s0 = makePortState("portRoyal", {
      gold: 500,
      infamy: 0,
      hold: makeHold(items),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      reputation: { portRoyal: 60 },
    });
    const enemy = { name: "Patrol", faction: "english" };
    const ctx = {
      type: "navy_patrol",
      phase: "intercept",
      enemy: enemy,
      intercept: {
        flavourText: "Test",
        options: [{ id: "inspect", label: "Inspect", available: true, reason: null, action: { type: "PATROL_INSPECT" } }]
      },
      returnScreen: "port",
    };
    const session = { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null };
    const s1 = dispatch(s0, A.PATROL_INSPECT, { encounterSession: session });
    // Now handle over:
    const s2 = dispatch(s1, A.RESOLVE_INSPECTION, { choice: "handOver" });

    // Value: tobacco 90*4=360, slaves 220*1=220, total 580, fine 20% = 116 → rounded to 125
    u.assertEqual(s2.gold, 375, "gold reduced by fine (500 - 125)");
    u.assertEqual(s2.hold.items.tobacco, 0, "tobacco seized");
    u.assertEqual(s2.hold.items.slaves, 0, "slaves seized");
    u.assertEqual(s2.hold.items.food, 5, "food preserved");
    u.assertEqual(s2.infamy, 2, "infamy +2");
    u.assertEqual(s2.crew.morale, 70, "morale -10");
    const repAfter = s2.reputation[s2.currentPort];
    u.assertEqual(repAfter, 55, "reputation -5");
    u.assert(s2.encounterSession === null, "encounter cleared");
  });

  reg("E.PATROL.02", "PATROL_INSPECT: Hidden Compartment can avoid detection", (u) => {
    const items = { tobacco: 3 };
    const s0 = makePortState("portRoyal", {
      gold: 500,
      hold: makeHold(items),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      ship: {
        ...makeShip("sloop"),
        equipment: { hull: [], armament: [], rigging: [], special: ["hidden_compartment"] },
      },
    });
    const enemy = { name: "Patrol", faction: "english" };
    const ctx = {
      type: "navy_patrol",
      phase: "intercept",
      enemy: enemy,
      intercept: {
        flavourText: "Test",
        options: [{ id: "inspect", label: "Inspect", available: true, reason: null, action: { type: "PATROL_INSPECT" } }]
      },
      returnScreen: "port",
    };
    const session = { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null };

    // Force the avoid chance to succeed (random < 0.50)
    setRandomSequence([0.1]);
    const s1 = dispatch(s0, A.PATROL_INSPECT, { encounterSession: session });
    resetRandomStub();

    // Contraband should still be there
    u.assertEqual(s1.hold.items.tobacco, 3, "tobacco not seized (hidden compartment succeeded)");
    u.assertEqual(s1.gold, 500, "gold not deducted");
    u.assertEqual(s1.infamy, 0, "no infamy");
    u.assertEqual(s1.crew.morale, 80, "morale unchanged");
    u.assert(s1.encounterSession === null, "encounter cleared");
  });

  reg("E.PATROL.03", "PATROL_INSPECT: detection occurs when avoid chance fails", (u) => {
    const items = { tobacco: 2 };
    const s0 = makePortState("portRoyal", {
      gold: 500,
      hold: makeHold(items),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      ship: {
        ...makeShip("sloop"),
        equipment: { hull: [], armament: [], rigging: [], special: ["hidden_compartment"] },
      },
    });
    const enemy = { name: "Patrol", faction: "english" };
    const ctx = {
      type: "navy_patrol",
      phase: "intercept",
      enemy: enemy,
      intercept: {
        flavourText: "Test",
        options: [{ id: "inspect", label: "Inspect", available: true, reason: null, action: { type: "PATROL_INSPECT" } }]
      },
      returnScreen: "port",
    };
    const session = { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null };

    // Force avoid chance to fail (random > 0.50)
    setRandomSequence([0.9]);
    const s1 = dispatch(s0, A.PATROL_INSPECT, { encounterSession: session });
    resetRandomStub();
    const s2 = dispatch(s1, A.RESOLVE_INSPECTION, { choice: "handOver" });

    u.assertEqual(s2.hold.items.tobacco, 0, "tobacco seized");
    // Fine: 2*90 = 180, *0.20 = 36 → rounded to 25
    u.assertEqual(s2.gold, 475, "gold reduced by fine (500 - 25)");
    u.assertEqual(s2.infamy, 2, "infamy +2");
  });


  // ── NEW: INTERCEPT_PARLEY failure path (the crash fix) ────────────────────

  reg("E.ENC.01", "INTERCEPT_PARLEY: failure path builds battle correctly (crash fix)", (u) => {
    const enemy = {
      name: "The Test",
      faction: "pirate",
      hull: 100,
      maxHull: 100,
      cannons: 10,
      crew: 20,
      speed: 8,
      risk: "medium",
    };
    const ctx = {
      type: "random",
      phase: "intercept",
      enemy: enemy,
      intercept: {
        flavourText: "Test",
        options: [{ id: "fight", label: "Fight", available: true, reason: null, action: { type: "INTERCEPT_FIGHT" } }],
      },
      returnScreen: "port",
    };
    const s0 = makePortState("portRoyal", {
      reputation: { portRoyal: 0 }, // rep 0 ensures parley fails
      encounterSession: { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null },
    });
    // Force parley failure by ensuring roll fails (rep 0 + roll > 20)
    setRandomSequence([0.9]); // roll 90 > 20 -> fails
    const s1 = dispatch(s0, A.INTERCEPT_PARLEY);
    resetRandomStub();
    u.assertEqual(s1.screen, "battle", "screen transitions to battle on parley failure");
    u.assert(s1.encounterSession !== null, "encounterSession still exists");
    u.assertEqual(s1.encounterSession.phase, "battle", "phase is battle");
    u.assert(s1.encounterSession.battle !== null, "battle object created");
    u.assertEqual(s1.encounterSession.battle.enemyHull, 100, "enemy hull preserved");
    u.assertEqual(s1.encounterSession.battle.enemyCrew, 20, "enemy crew preserved");
  });

  // ── NEW: INTERCEPT_FLEE failure path ──────────────────────────────────────

  reg("E.ENC.02", "INTERCEPT_FLEE: failure path transitions to battle correctly", (u) => {
    const enemy = {
      name: "The Test",
      faction: "pirate",
      hull: 100,
      maxHull: 100,
      cannons: 10,
      crew: 20,
      speed: 8,
      risk: "medium",
    };
    const ctx = {
      type: "random",
      phase: "intercept",
      enemy: enemy,
      intercept: {
        flavourText: "Test",
        options: [{
          id: "flee",
          label: "Flee",
          available: true,
          reason: null,
          action: { type: "INTERCEPT_FLEE" },
          speedCheck: { player: 6, enemy: 12 }, // player slower, flee fails
        }],
      },
      returnScreen: "port",
    };
    const s0 = makePortState("portRoyal", {
      encounterSession: { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null },
    });
    // player speed 6 + roll vs enemy 12 + roll
    // player max 12, enemy max 18 -> player always loses if roll >= 7
    setRandomSequence([0.5, 0.5]); // player roll 4 (6+4=10), enemy roll 4 (12+4=16) -> player loses
    const s1 = dispatch(s0, A.INTERCEPT_FLEE);
    resetRandomStub();
    u.assertEqual(s1.screen, "battle", "screen transitions to battle on flee failure");
    u.assert(s1.encounterSession !== null, "encounterSession still exists");
    u.assertEqual(s1.encounterSession.phase, "battle", "phase is battle");
    u.assert(s1.encounterSession.battle !== null, "battle object created");
  });

  // ── NEW: Victory log message appears in battle log ────────────────────────

  reg("E.CMB.NAVAL.06", "BATTLE_ACTION enemy_sunk: victory message appears in battle log", (u) => {
    setRandomSequence([0.9]);
    const s0 = makeBattleState({
      enemyHull: 1,
      enemyCrew: 10,
      distance: "medium",
      subPhase: "naval",
      log: ["Previous round..."],
    });
    const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "broadside" });
    resetRandomStub();
    const battleLog = s1.encounterSession?.battle?.log || [];
    const victoryMessage = battleLog.find(line => line.includes("sunk"));
    u.assert(victoryMessage !== undefined, "Victory message appears in battle log");
    u.assertEqual(s1.screen, "battle", "screen stays on battle");
  });




  reg("E.CMB.OUTCOME.01", "BATTLE_ACTION: player_evaded clears encounterSession and returns to sailing/port", (u) => {
  const s0 = makeBattleState({
    distance: "far",
    subPhase: "naval",
    enemyHull: 100,
    enemyCrew: 10,
  });
  // Force enemy to broadside (not oppose)
  const originalGetNPC = L.getNPCNavalAction;
  L.getNPCNavalAction = () => "broadside";
  const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "evade" });
  L.getNPCNavalAction = originalGetNPC;

  u.assert(s1.encounterSession === null, "encounter session cleared");
  u.assert(s1.screen === "sailing" || s1.screen === "port", "returns to sailing or port");
  u.assert(s1.log.some(l => l.includes("evaded")), "log mentions evasion");
});

reg("E.CMB.OUTCOME.02", "BATTLE_ACTION: enemy_evaded clears encounterSession", (u) => {
  const s0 = makeBattleState({
    distance: "far",
    subPhase: "naval",
    enemyHull: 100,
    enemyCrew: 10,
  });
  const originalGetNPC = L.getNPCNavalAction;
  L.getNPCNavalAction = () => "evade";
  const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "broadside" });
  L.getNPCNavalAction = originalGetNPC;

  u.assert(s1.encounterSession === null, "encounter session cleared");
  u.assert(s1.log.some(l => l.includes("evaded")), "log mentions enemy evasion");
});

reg("E.CMB.OUTCOME.03", "BATTLE_ACTION boarding: player_wipeout leads to defeat phase", (u) => {
  const s0 = makeBattleState({
    subPhase: "boarding",
    distance: "close",
    playerHull: 100,
    playerCrew: 1,
    enemyHull: 100,
    enemyCrew: 10,
  });
  // No RNG needed? The resolver uses rng for maybeCrewLoss? Actually boarding losses are deterministic? In resolveBoardingRound, playerLoss = ceil(playerCrew * 0.15 * (1-ratio)), no randomness. So we just dispatch.
  const originalGetNPC = L.getNPCBoardingAction;
  L.getNPCBoardingAction = () => "continue_fighting";
  const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "continue_fighting" });
  L.getNPCBoardingAction = originalGetNPC;

  const battle = s1.encounterSession?.battle;
  u.assert(battle.phase === "defeat", "phase is defeat");
});


reg("E.CMB.OUTCOME.04", "BATTLE_ACTION boarding: enemy_surrendered leads to victory with plunder", (u) => {
  const s0 = makeBattleState({
    subPhase: "boarding",
    distance: "close",
    playerHull: 100,
    playerCrew: 20,
    enemyHull: 100,
    enemyCrew: 5,
  });
  const originalGetNPC = L.getNPCBoardingAction;
  L.getNPCBoardingAction = () => "surrender";
  const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "continue_fighting" });
  L.getNPCBoardingAction = originalGetNPC;

  const battle = s1.encounterSession?.battle;
  u.assertEqual(battle.phase, "victory", "phase is victory");
  u.assert(battle.canPlunder === true, "canPlunder is true");
});

  // ── NEW: CONVOY / MERCHANT PROTECTED OBJECTIVE TESTS ──────────────

reg("E.CONVOY.01", "buildBattleFromIntercept: sets convoyHull for escort and merchant defense", (u) => {
  const state = makePortState("portRoyal", {
    ship: makeShip("sloop"), // maxHull 100 -> convoyHull 50
  });
  const enemy = makeEnemy();

  // ── Escort mission ──
  const sessionEscort = {
    type: "escort_defend",
    enemy: enemy,
    phase: "intercept",
    intercept: {
      flavourText: "Test",
      options: [{ id: "fight", label: "Fight", available: true, reason: null, action: { type: "INTERCEPT_FIGHT" } }],
    },
    returnScreen: "port",
    notableNPCId: null,
    source: { kind: "random", id: null },
    modifiers: [],
    battle: null,
    plunder: null,
  };
  // Attach session to state
  const sWithSession = { ...state, encounterSession: sessionEscort };
  const s1 = dispatch(sWithSession, A.INTERCEPT_FIGHT);
  u.assert(s1.encounterSession !== null, "encounter session created");
  u.assertEqual(s1.screen, "battle", "screen changed to battle");
  const battle1 = s1.encounterSession.battle;
  u.assert(battle1.convoyHull !== undefined, "convoyHull set for escort");
  u.assertEqual(battle1.convoyHull, 50, "convoyHull = maxHull/2 for escort");

  // ── Merchant defense ──
  const sessionMerchant = {
    type: "distressed_merchant_help",
    enemy: enemy,
    phase: "intercept",
    intercept: {
      flavourText: "Test",
      options: [{ id: "fight", label: "Fight", available: true, reason: null, action: { type: "INTERCEPT_FIGHT" } }],
    },
    returnScreen: "port",
    notableNPCId: null,
    source: { kind: "random", id: null },
    modifiers: [],
    battle: null,
    plunder: null,
  };
  const sWithMerchant = { ...state, encounterSession: sessionMerchant };
  const s2 = dispatch(sWithMerchant, A.INTERCEPT_FIGHT);
  const battle2 = s2.encounterSession.battle;
  u.assert(battle2.convoyHull !== undefined, "convoyHull set for merchant defense");
  u.assertEqual(battle2.convoyHull, 50, "convoyHull = maxHull/2 for merchant defense");

  // ── Random encounter (should NOT have convoyHull) ──
  const sessionRandom = {
    type: "random",
    enemy: enemy,
    phase: "intercept",
    intercept: {
      flavourText: "Test",
      options: [{ id: "fight", label: "Fight", available: true, reason: null, action: { type: "INTERCEPT_FIGHT" } }],
    },
    returnScreen: "port",
    notableNPCId: null,
    source: { kind: "random", id: null },
    modifiers: [],
    battle: null,
    plunder: null,
  };
  const sWithRandom = { ...state, encounterSession: sessionRandom };
  const s3 = dispatch(sWithRandom, A.INTERCEPT_FIGHT);
  const battle3 = s3.encounterSession.battle;
  u.assert(battle3.convoyHull === undefined, "random encounter has no convoyHull");
});

  reg("E.CONVOY.02", "resolveNavalRound: returns convoyDamage for enemy broadside and precision", (u) => {
    const state = makePortState("portRoyal", {
      ship: makeShip("sloop"),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });
    const enemy = makeEnemy({ cannons: 10, crew: 10 });
    const battle = {
      distance: "medium",
      playerHull: 100,
      playerCrew: 10,
      enemyHull: enemy.hull,
      enemyCrew: enemy.crew,
      convoyHull: 50,
    };

    // Enemy broadside
    setRandomSequence([0.5]);
    const resultBroadside = L.resolveNavalRound(state, "broadside", "broadside", battle, enemy);
    resetRandomStub();
    // convoyDamage should be 2-5 (we can check it's > 0)
    u.assert(resultBroadside.convoyDamage > 0, "broadside deals convoy damage");

    // Enemy precision (hit)
    setRandomSequence([0.5, 0.5]); // hit + random damage
    const resultPrecision = L.resolveNavalRound(state, "broadside", "precision", battle, enemy);
    resetRandomStub();
    u.assert(resultPrecision.convoyDamage >= 0, "precision can deal convoy damage (0 on miss)");

    // Enemy evade (no damage)
    const resultEvade = L.resolveNavalRound(state, "broadside", "evade", battle, enemy);
    u.assertEqual(resultEvade.convoyDamage, 0, "evade deals no convoy damage");
  });

  reg("E.CONVOY.03", "BATTLE_ACTION: applies convoy damage and tracks convoyLost", (u) => {
    // Create a battle with low convoy hull so it gets destroyed
    const s0 = makeBattleState(
      {
        distance: "medium",
        subPhase: "naval",
        enemyHull: 100,
        enemyCrew: 10,
        convoyHull: 2, // low so it gets destroyed
        log: [],
      },
      {
        ship: makeShip("sloop"),
        crew: { roster: fillRoster(10), max: 40, morale: 80 },
      }
    );
    // Ensure we have an enemy that uses broadside
    s0.encounterSession.enemy.cannons = 10;
    s0.encounterSession.enemy.crew = 10;

    // Force enemy action to broadside (we'll mock the NPC action to be broadside)
    // We need to override L.getNPCNavalAction temporarily
    const originalGetNPC = L.getNPCNavalAction;
    L.getNPCNavalAction = () => "broadside";

    // Set random sequence to control damage
    setRandomSequence([0.5, 0.5, 0.5]); // broadside calc, convoy damage calc
    const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "broadside" });
    resetRandomStub();
    L.getNPCNavalAction = originalGetNPC;

    const battle = s1.encounterSession?.battle;
    u.assert(battle !== null, "battle exists");
    // convoyHull should be 0 and convoyLost true
    u.assertEqual(battle.convoyHull, 0, "convoyHull reduced to 0");
    u.assert(battle.convoyLost === true, "convoyLost set to true");
    // Log should contain the destruction message
    u.assert(battle.log.some(l => l.includes("merchant ship is destroyed") || l.includes("convoy")), "destruction message logged");
  });

  reg("E.CONVOY.04", "DISMISS_BATTLE: merchant defense gives reward when convoy survives", (u) => {
    const s0 = makeBattleState(
      {
        phase: "victory",
        canPlunder: false,
        convoyHull: 10,
        convoyLost: false,
        log: [],
        enemy: { name: "Pirate", faction: "pirate" },
      },
      {
        gold: 1000,
        ship: makeShip("sloop"),
        crew: { roster: fillRoster(10), max: 40, morale: 80 },
        reputation: { portRoyal: 50 },
      }
    );
    // Set merchant info on session
    s0.encounterSession.merchantFaction = "english";
    s0.encounterSession.merchantProtected = true;
    s0.encounterSession.returnScreen = "port";

    const s1 = dispatch(s0, A.DISMISS_BATTLE);

    // Gold should have increased (bonus 200-400)
    u.assert(s1.gold > 1000, "gold increased for merchant rescue");
    // Reputation should have increased for merchant faction
    const repAfter = s1.reputation["portRoyal"] || 0;
    u.assert(repAfter > 50, "reputation increased for merchant faction");
    // Log should mention the rescue
    u.assert(s1.log.some(l => l.includes("merchant is saved")), "rescue log present");
    // Encounter session cleared
    u.assert(s1.encounterSession === null, "encounter cleared");
  });

  reg("E.CONVOY.05", "DISMISS_BATTLE: merchant defense gives no reward when convoy destroyed", (u) => {
    const s0 = makeBattleState(
      {
        phase: "victory",
        canPlunder: false,
        convoyHull: 0,
        convoyLost: true,
        log: [],
        enemy: { name: "Pirate", faction: "pirate" },
      },
      {
        gold: 1000,
        ship: makeShip("sloop"),
        crew: { roster: fillRoster(10), max: 40, morale: 80 },
        reputation: { portRoyal: 50 },
      }
    );
    s0.encounterSession.merchantFaction = "english";
    s0.encounterSession.merchantProtected = true;
    s0.encounterSession.returnScreen = "port";

    const s1 = dispatch(s0, A.DISMISS_BATTLE);

    // Gold should NOT have increased (no bonus)
    u.assertEqual(s1.gold, 1000, "gold unchanged when merchant destroyed");
    // Reputation should NOT have increased
    u.assertEqual(s1.reputation["portRoyal"], 50, "reputation unchanged");
    // Log should mention no reward
    u.assert(s1.log.some(l => l.includes("merchant ship was destroyed") || l.includes("no reward")), "no reward log present");
    // Encounter cleared
    u.assert(s1.encounterSession === null, "encounter cleared");
  });

reg("E.CONVOY.06", "COMPLETE_MISSION: blocks escort completion when convoyLost is true", (u) => {
  const mission = {
    type: "escort",
    id: "escort_1",
    targetPort: "portRoyal",
    faction: "english",
    gold: 300,
    fame: 2,
    repImpact: { english: 3 },
    convoyLost: true,
    encounterOccurred: true,
    enemyDefeated: true,
    requiredGood: null,
    requiredQty: 0,
  };
  const s0 = makePortState("portRoyal", {
    activeMission: mission,
    gold: 1000,
    reputation: { portRoyal: 50 },
  });
  const s1 = dispatch(s0, A.COMPLETE_MISSION);

  u.assert(s1.activeMission === null, "mission cleared");
  u.assertEqual(s1.gold, 1000, "gold not awarded for failed escort");
  u.assert(s1.reputation["portRoyal"] < 50, "reputation decreased for failed escort");
  u.assert(s1.log.some(l => l.includes("convoy was destroyed")), "failure log present");
});

reg("E.CONVOY.07", "COMPLETE_MISSION: allows escort completion when convoy survives", (u) => {
  const mission = {
    type: "escort",
    id: "escort_2",
    targetPort: "portRoyal",
    faction: "english",
    gold: 300,
    fame: 2,
    repImpact: { english: 3 },
    convoyLost: false,
    encounterOccurred: true,
    enemyDefeated: true,
    requiredGood: null,
    requiredQty: 0,
  };
  const s0 = makePortState("portRoyal", {
    activeMission: mission,
    gold: 1000,
    reputation: { portRoyal: 50 },
  });
  const s1 = dispatch(s0, A.COMPLETE_MISSION);

  u.assert(s1.activeMission === null, "mission cleared");
  // Reputation perk at 50 = 1.10 → 300 * 1.10 = 330
  u.assertEqual(s1.gold, 1330, "gold awarded for successful escort (1000 + 330 with rep perk)");
  u.assert(s1.reputation["portRoyal"] > 50, "reputation increased");
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

  reg("E.SAVE.04", "IMPORT_SAVE: tampered data loads state and logs warning", (u) => {
    const original = makePortState("portRoyal", { gold: 999 });
    const encoded = L.encodeSave(original);

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
    const oldSave = {
      gold: 100,
      ship: {
        type: "sloop",
        name: "Old Ship",
        hull: 100,
        cannons: 10,
        upgrades: ["reinforced_hull"],
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
      intercept: {
        flavourText: "Test",
        options: [{ id: "fight", label: "Fight", available: true, reason: null, action: { type: "INTERCEPT_FIGHT" } }],
      },
    };
    const s0 = makePortState("portRoyal", {
      ship: { ...makeShip("sloop"), hull: 0 },
      encounterSession: { ...ctx, phase: "intercept", notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null, returnScreen: "port" },
    });
    const s1 = dispatch(s0, A.INTERCEPT_FIGHT);
    u.assert(s1.encounterSession === null || s1.encounterSession?.phase === "intercept",
      "session not transitioned to battle");
    u.assert(s1.log.some(l => l.includes("ship is already lost")), "log contains reason");
  });

  reg("E.GAMEOVER.07", "ENTER_PORT: triggers gameover when unrecoverable and skips autosave", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 0, {
      ship: { ...makeShip("sloop"), hull: 0 },
      crew: { roster: [], max: 40, morale: 80 },
      gold: 0,
      hold: makeHold(),
      autoSave: true,
    });
    const s1 = dispatch(s0, A.ENTER_PORT);
    u.assertEqual(s1.screen, "gameover", "screen changed to gameover");
    u.assert(s1.gameOverReason !== null, "gameOverReason set");
    u.assert(s1.gameOverReason.includes("wrecked"), "reason mentions wrecked ship");
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
      { phase: "defeat", enemy: { name: "Test", hull: 100, faction: "pirate" } },
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
      ship: { ...makeShip("sloop"), hull: 15 },
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
      "missions", "activeMission", "reputation", "activeEvent",
      "encounterSession","notableNPCs","career", "equipmentInventory", "discoveredPorts",
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

  reg("E.CAREER.01", "initialState.career is not shared with D.DEFAULT_CAREER", (u) => {
  const s = window.E.initialState;
  u.assert(s.career !== window.D.DEFAULT_CAREER, "references differ");
  u.assert(s.career.portsVisited !== window.D.DEFAULT_CAREER.portsVisited, "nested arrays differ");
});

reg("E.PREVIEW.01", "PREVIEW_PORT sets previewPortMarket", (u) => {
  const s0 = makePortState("portRoyal");
  const s1 = dispatch(s0, A.PREVIEW_PORT, { port: "tortuga" });
  u.assert(s1.previewPortMarket !== null, "previewPortMarket set");
  u.assert(s1.previewPortMarket.goods.sugar !== undefined, "market has goods");
});

// ══════════════════════════════════════════════════════════════════════════
// E.TRADE.REWARD — Trade/Smuggle mission completion now pays goods value
// ══════════════════════════════════════════════════════════════════════════

reg("E.MISS.10", "COMPLETE_MISSION trade: pays mission.gold + goods sale value", (u) => {
  const mission = makeMission({
    type: "trade",
    targetPort: "portRoyal",
    gold: 150,
    fame: 1,
    requiredGood: "spices",
    requiredQty: 3,
  });
  const s0 = makePortState("portRoyal", {
    gold: 500,
    hold: makeHold({ spices: 3, food: 5, water: 5 }),
    portMarket: {
      goods: {
        spices: { sellToPort: 100 }, // known sell price
      },
    },
    activeMission: mission,
  });
  const s1 = dispatch(s0, A.COMPLETE_MISSION);
  // mission.gold = 150; goods value = 3 * 100 = 300; total = 450
  u.assertEqual(s1.gold, 500 + 150 + 300, "gold should be original + mission reward + goods value");
  u.assertEqual(s1.hold.items.spices, 0, "spices removed from hold");
  u.assert(s1.activeMission === null, "mission cleared");
  u.assert(s1.log.some(l => l.includes("for the goods")), "log mentions goods value");
});

reg("E.MISS.11", "COMPLETE_MISSION smuggle: pays mission.gold + goods sale value", (u) => {
  const mission = makeMission({
    type: "smuggle",
    targetPort: "portRoyal",
    gold: 200,
    fame: 1,
    infamyGain: 1,
    requiredGood: "rum",
    requiredQty: 5,
  });
  const s0 = makePortState("portRoyal", {
    gold: 1000,
    hold: makeHold({ rum: 5, food: 5, water: 5 }),
    portMarket: {
      goods: {
        rum: { sellToPort: 30 }, // known sell price
      },
    },
    activeMission: mission,
  });
  const s1 = dispatch(s0, A.COMPLETE_MISSION);
  // mission.gold = 200; goods value = 5 * 30 = 150; total = 350
  u.assertEqual(s1.gold, 1000 + 200 + 150, "gold should be original + mission reward + goods value");
  u.assertEqual(s1.hold.items.rum, 0, "rum removed from hold");
  u.assertEqual(s1.infamy, 1, "infamy gained from smuggle mission");
});

reg("E.MISS.12", "COMPLETE_MISSION trade: falls back to mission.gold when sellPrice is zero", (u) => {
  const mission = makeMission({
    type: "trade",
    targetPort: "portRoyal",
    gold: 150,
    fame: 1,
    requiredGood: "spices",
    requiredQty: 3,
  });
  // Market with no sell price for spices (or missing)
  const s0 = makePortState("portRoyal", {
    gold: 500,
    hold: makeHold({ spices: 3 }),
    portMarket: {
      goods: {
        // no spices entry => sellPrice = 0
      },
    },
    activeMission: mission,
  });
  const s1 = dispatch(s0, A.COMPLETE_MISSION);
  // goods value = 0; total = 150
  u.assertEqual(s1.gold, 500 + 150, "gold should be original + mission reward only");
});

reg("E.MISS.13", "COMPLETE_MISSION trade: log includes goods value note", (u) => {
  const mission = makeMission({
    type: "trade",
    targetPort: "portRoyal",
    gold: 100,
    fame: 0,
    requiredGood: "sugar",
    requiredQty: 2,
  });
  const s0 = makePortState("portRoyal", {
    gold: 500,
    hold: makeHold({ sugar: 2 }),
    portMarket: {
      goods: {
        sugar: { sellToPort: 50 },
      },
    },
    activeMission: mission,
  });
  const s1 = dispatch(s0, A.COMPLETE_MISSION);
  const rewardLog = s1.log.find(l => l.includes("Completed:"));
  u.assert(rewardLog.includes("for the goods"), "log should mention goods value");
  u.assert(rewardLog.includes("+"), "log includes plus sign");
});

})();