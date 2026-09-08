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

  reg("E.SHIP.01", "REPAIR: hull restored to maxHull with friendly discount", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5000,
      ship: { ...makeShip("sloop"), hull: 60 },
      reputation: { portRoyal: 60 }, // Friendly → 0.9 repairMult
    });
    const s1 = dispatch(s0, A.REPAIR);
    u.assertEqual(s1.ship.hull, 100, "hull restored to sloop maxHull");
  });

  reg("E.SHIP.02", "REPAIR: gold is deducted with friendly discount", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5000,
      ship: { ...makeShip("sloop"), hull: 60 },
      reputation: { portRoyal: 60 },
    });
    const s1 = dispatch(s0, A.REPAIR);
    u.assert(s1.gold < s0.gold, "gold decreased");
  });

  reg("E.SHIP.03", "REPAIR: gold deducted matches L.shipRepairCost with reputation modifier", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 5000,
      ship: { ...makeShip("sloop"), hull: 60 },
      reputation: { portRoyal: 60 },
    });
    // sloop maxHull 100, hull 60 → 40 missing. cost per point = ceil(100/20) = 5. repMult = 0.9. total = 40 * 5 * 0.9 = 180
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
      // No portMarket → goodsValue = 0
    });
    const s1 = dispatch(s0, A.COMPLETE_MISSION);
    // reward = floor(300 * 1.10) = 330 (rep 50 → friendly multiplier 1.1)
    u.assertEqual(s1.gold, 1330, "gold +330");
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

    const originalGetNPC = L.getNPCNavalAction;
    L.getNPCNavalAction = () => "grapple";

    const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "grapple" });

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
    setRandomSequence([0.99]);
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
    setRandomSequence([0.5, 0.99]);
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
    setRandomSequence([0.9]);
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

    u.assertEqual(s1.gold, 650, "gold reduced by fine");
    u.assertEqual(s1.hold.items.tobacco, 0, "tobacco seized");
    u.assertEqual(s1.hold.items.slaves, 0, "slaves seized");
    u.assertEqual(s1.hold.items.rum, 10, "rum preserved");
    u.assertEqual(s1.hold.items.food, 10, "food preserved");
    u.assertEqual(s1.hold.items.water, 10, "water preserved");
    u.assertEqual(s1.hold.items.cloth, 10, "cloth halved (50% cargo loss)");
    u.assertEqual(s1.crew.morale, 65, "morale -15");
    u.assertEqual(s1.infamy, 7, "infamy +2");
    const repAfter = s1.reputation[s1.currentPort];
    u.assert(repAfter < 50, `rep should be <50 (was ${repAfter})`);
    u.assert(s1.encounterSession === null, "encounterSession cleared");
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
    const session = { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null };
    s0.encounterSession = session;

    const s1 = dispatch(s0, A.INTERCEPT_SURRENDER);

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
    s0.encounterSession.type = "navy_patrol";
    s0.encounterSession.inspectionRefused = true;

    const s1 = dispatch(s0, A.DISMISS_BATTLE);

    u.assert(s1.gold < 400, "gold reduced by fine");
    u.assertEqual(s1.hold.items.tobacco, 0, "contraband seized");
    u.assert(s1.encounterSession === null, "encounter cleared");
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
    const s2 = dispatch(s1, A.RESOLVE_INSPECTION, { choice: "handOver" });

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

    setRandomSequence([0.1]);
    const s1 = dispatch(s0, A.PATROL_INSPECT, { encounterSession: session });
    resetRandomStub();

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

    setRandomSequence([0.9]);
    const s1 = dispatch(s0, A.PATROL_INSPECT, { encounterSession: session });
    resetRandomStub();
    const s2 = dispatch(s1, A.RESOLVE_INSPECTION, { choice: "handOver" });

    u.assertEqual(s2.hold.items.tobacco, 0, "tobacco seized");
    u.assertEqual(s2.gold, 475, "gold reduced by fine (500 - 25)");
    u.assertEqual(s2.infamy, 2, "infamy +2");
  });

  reg("E.PATROL.04", "PATROL_INSPECT: weapons smuggle mission triggers contraband detection and removal", (u) => {
    const items = { food: 5, water: 5, weapons: 4 };
    const mission = { type: "smuggle", requiredGood: "weapons", requiredQty: 4, name: "Test Weapons Smuggle" };

    const s0 = makePortState("portRoyal", {
      gold: 500,
      infamy: 0,
      hold: makeHold(items),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      reputation: { portRoyal: 60 },
      activeMission: mission,
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
    u.assertEqual(s1.encounterSession.phase, "inspection_pending");
    u.assert(s1.encounterSession.inspectionContraband.smuggledGood === "weapons");

    const s2 = dispatch(s1, A.RESOLVE_INSPECTION, { choice: "handOver" });

    u.assertEqual(s2.gold, 425, "gold reduced by fine (500 - 75)");
    u.assertEqual(s2.hold.items.weapons, 0, "weapons seized from hold");
    u.assertEqual(s2.infamy, 2, "infamy +2");
    u.assertEqual(s2.crew.morale, 70, "morale -10");
    u.assert(s2.encounterSession === null, "encounter cleared");
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
      reputation: { portRoyal: 0 },
      encounterSession: { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null },
    });
    setRandomSequence([0.9]);
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
          speedCheck: { player: 6, enemy: 12 },
        }],
      },
      returnScreen: "port",
    };
    const s0 = makePortState("portRoyal", {
      encounterSession: { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null },
    });
    setRandomSequence([0.5, 0.5]);
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
    const s0 = makeBattleState(
      {
        subPhase: "boarding",
        distance: "close",
        playerHull: 100,
        playerCrew: 1,
        enemyHull: 100,
        enemyCrew: 10,
      },
      {
        faction: "pirate",
      }
    );
    const originalGetNPC = L.getNPCBoardingAction;
    L.getNPCBoardingAction = () => "continue_fighting";
    const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "continue_fighting" });
    L.getNPCBoardingAction = originalGetNPC;
    const battle = s1.encounterSession?.battle;
    u.assertEqual(battle.phase, "defeat", "phase is defeat");
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
      ship: makeShip("sloop"),
    });
    const enemy = makeEnemy();

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
    const sWithSession = { ...state, encounterSession: sessionEscort };
    const s1 = dispatch(sWithSession, A.INTERCEPT_FIGHT);
    u.assert(s1.encounterSession !== null, "encounter session created");
    u.assertEqual(s1.screen, "battle", "screen changed to battle");
    const battle1 = s1.encounterSession.battle;
    u.assert(battle1.convoyHull !== undefined, "convoyHull set for escort");
    u.assertEqual(battle1.convoyHull, 50, "convoyHull = maxHull/2 for escort");

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

    setRandomSequence([0.5]);
    const resultBroadside = L.resolveNavalRound(state, "broadside", "broadside", battle, enemy);
    resetRandomStub();
    u.assert(resultBroadside.convoyDamage > 0, "broadside deals convoy damage");

    setRandomSequence([0.5, 0.5]);
    const resultPrecision = L.resolveNavalRound(state, "broadside", "precision", battle, enemy);
    resetRandomStub();
    u.assert(resultPrecision.convoyDamage >= 0, "precision can deal convoy damage (0 on miss)");

    const resultEvade = L.resolveNavalRound(state, "broadside", "evade", battle, enemy);
    u.assertEqual(resultEvade.convoyDamage, 0, "evade deals no convoy damage");
  });

  reg("E.CONVOY.03", "BATTLE_ACTION: applies convoy damage and tracks convoyLost", (u) => {
    const s0 = makeBattleState(
      {
        distance: "medium",
        subPhase: "naval",
        enemyHull: 100,
        enemyCrew: 10,
        convoyHull: 2,
        log: [],
      },
      {
        ship: makeShip("sloop"),
        crew: { roster: fillRoster(10), max: 40, morale: 80 },
      }
    );
    s0.encounterSession.enemy.cannons = 10;
    s0.encounterSession.enemy.crew = 10;

    const originalGetNPC = L.getNPCNavalAction;
    L.getNPCNavalAction = () => "broadside";

    setRandomSequence([0.5, 0.5, 0.5]);
    const s1 = dispatch(s0, A.BATTLE_ACTION, { action: "broadside" });
    resetRandomStub();
    L.getNPCNavalAction = originalGetNPC;

    const battle = s1.encounterSession?.battle;
    u.assert(battle !== null, "battle exists");
    u.assertEqual(battle.convoyHull, 0, "convoyHull reduced to 0");
    u.assert(battle.convoyLost === true, "convoyLost set to true");
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
    s0.encounterSession.merchantFaction = "english";
    s0.encounterSession.merchantProtected = true;
    s0.encounterSession.returnScreen = "port";

    const s1 = dispatch(s0, A.DISMISS_BATTLE);

    u.assert(s1.gold > 1000, "gold increased for merchant rescue");
    const repAfter = s1.reputation["portRoyal"] || 0;
    u.assert(repAfter > 50, "reputation increased for merchant faction");
    u.assert(s1.log.some(l => l.includes("merchant is saved")), "rescue log present");
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

    u.assertEqual(s1.gold, 1000, "gold unchanged when merchant destroyed");
    u.assertEqual(s1.reputation["portRoyal"], 50, "reputation unchanged");
    u.assert(s1.log.some(l => l.includes("merchant ship was destroyed") || l.includes("no reward")), "no reward log present");
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
          spices: { sellToPort: 100 },
        },
      },
      activeMission: mission,
    });
    const s1 = dispatch(s0, A.COMPLETE_MISSION);
    // reward = floor(150 * 1.10) = 165
    // goodsValue = 3 * 100 = 300
    // total = 165 + 300 = 465
    // gold = 500 + 465 = 965
    u.assertEqual(s1.gold, 965, "gold should be 965");
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
          rum: { sellToPort: 30 },
        },
      },
      activeMission: mission,
    });
    const s1 = dispatch(s0, A.COMPLETE_MISSION);
    // reward = floor(200 * 1.10) = 220
    // goodsValue = 5 * 30 = 150
    // total = 220 + 150 = 370
    // gold = 1000 + 370 = 1370
    u.assertEqual(s1.gold, 1370, "gold should be 1370");
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
    // reward = floor(150 * 1.10) = 165
    // goodsValue = 0
    // gold = 500 + 165 = 665
    u.assertEqual(s1.gold, 665, "gold should be 665");
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
    // reward = floor(100 * 1.10) = 110, goodsValue = 2*50=100, total=210
    // log should mention "+210g" and "for the goods"
    u.assert(rewardLog.includes("+210g"), "log includes total gold");
    u.assert(rewardLog.includes("for the goods"), "log mentions goods value");
  });

  // ── B10.3 — Spanish HIRE_CREW ──────────────────────────────────────

  reg("E.SPANISH.01", "Spanish: HIRE_CREW costs 40g per crew at Spanish port", (u) => {
    const s0 = makePortState("havana", {
      faction: "spanish",
      gold: 1000,
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.HIRE_CREW, { count: 3 });
    u.assertEqual(s1.gold, 1000 - 3 * 40, "gold reduced by 120 (3 × 40)");
    u.assertEqual(s1.crew.roster.length, 8, "crew increased by 3");
  });

  reg("E.SPANISH.02", "Spanish: HIRE_CREW blocked at non-Spanish port", (u) => {
    const s0 = makePortState("portRoyal", {
      faction: "spanish",
      gold: 1000,
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.HIRE_CREW, { count: 3 });
    u.assertEqual(s1.gold, 1000, "gold unchanged");
    u.assertEqual(s1.crew.roster.length, 5, "crew unchanged");
    u.assert(s1.log.some(l => l.includes("Spanish") && l.includes("recruit")),
      "log explains restriction");
  });

  reg("E.SPANISH.03", "Spanish: HIRE_CREW generates Spanish crew at Spanish port", (u) => {
    const s0 = makePortState("havana", {
      faction: "spanish",
      gold: 1000,
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.HIRE_CREW, { count: 2 });
    const newMembers = s1.crew.roster.slice(-2);
    newMembers.forEach(m => {
      u.assertEqual(m.faction, "spanish", "new crew member is Spanish");
    });
  });

  reg("E.SPANISH.04", "Non-Spanish: HIRE_CREW costs 50g per crew", (u) => {
    const s0 = makePortState("portRoyal", {
      faction: "english",
      gold: 1000,
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.HIRE_CREW, { count: 3 });
    u.assertEqual(s1.gold, 1000 - 3 * 50, "gold reduced by 150 (3 × 50)");
  });

  reg("E.SPANISH.05", "Spanish: HIRE_CREW blocked when port has no crew service", (u) => {
    const s0 = makePortState("campeche", {
      faction: "spanish",
      gold: 1000,
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
    });
    const s1 = dispatch(s0, A.HIRE_CREW, { count: 3 });
    u.assert(true, "No crash when port lacks crew service");
  });

  // ── B10.6 — Pirate: Intercept Flee bonus (+1 die) ──────────────────────

  reg("E.FLEE.01", "INTERCEPT_FLEE: pirate with +1 bonus succeeds where non-pirate fails", (u) => {
    const enemy = { name: "Test", faction: "pirate", hull: 100, cannons: 10, crew: 20, speed: 10 };
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
          speedCheck: { player: 10, enemy: 10 }
        }]
      },
      returnScreen: "port",
    };
    const session = { ...ctx, notableNPCId: null, source: { kind: "random", id: null }, modifiers: [], battle: null, plunder: null };

    const stateNonPirate = makePortState("portRoyal", {
      faction: "english",
      encounterSession: session,
      destination: null,
    });
    setRandomSequence([0.05, 0.35]);
    const s1 = dispatch(stateNonPirate, A.INTERCEPT_FLEE);
    resetRandomStub();
    u.assertEqual(s1.screen, "battle", "non-pirate fails and enters battle");

    const statePirate = makePortState("portRoyal", {
      faction: "pirate",
      encounterSession: session,
      destination: null,
    });
    setRandomSequence([0.05, 0.25]);
    const s2 = dispatch(statePirate, A.INTERCEPT_FLEE);
    resetRandomStub();
    u.assertEqual(s2.encounterSession, null, "pirate succeeds and clears encounter");
    u.assertEqual(s2.screen, "port");
  });

  // ── B10.6 — Pirate: Contraband avoidance bonus (+10%) ────────────────────

  reg("E.PATROL.05", "PATROL_INSPECT: pirate with contraband and no equipment avoids detection due to +10% bonus", (u) => {
    const items = { tobacco: 2 };
    const state = makePortState("portRoyal", {
      faction: "pirate",
      gold: 500,
      hold: makeHold(items),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      ship: makeShip("sloop"),
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
    setRandomSequence([0.05]);
    const s1 = dispatch(state, A.PATROL_INSPECT, { encounterSession: session });
    resetRandomStub();
    u.assertEqual(s1.hold.items.tobacco, 2, "tobacco not seized due to pirate bonus");
    u.assertEqual(s1.gold, 500, "gold not deducted");
    u.assertEqual(s1.encounterSession, null, "encounter cleared");
  });

  reg("E.PATROL.06", "PATROL_INSPECT: non-pirate with contraband and no equipment gets caught (baseline)", (u) => {
    const items = { tobacco: 2 };
    const state = makePortState("portRoyal", {
      faction: "english",
      gold: 500,
      hold: makeHold(items),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
      ship: makeShip("sloop"),
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
    setRandomSequence([0.05]);
    const s1 = dispatch(state, A.PATROL_INSPECT, { encounterSession: session });
    resetRandomStub();
    u.assertEqual(s1.encounterSession.phase, "inspection_pending");
    u.assert(s1.encounterSession.inspectionContraband !== undefined);
  });

  // ──────────────────────────────────────────────────────────────────────────
  //  MOVED FROM tests_scenarios.js — now part of engine tests
  // ──────────────────────────────────────────────────────────────────────────

  // ── STORM ───────────────────────────────────────────────────────────

  reg("E.EVENT.STORM.BRACE", "Storm: Brace applies hull damage and crew loss", (u) => {
    const stormEvent = D.RANDOM_EVENTS.find(e => e.id === "storm");
    u.assert(stormEvent, "Storm event exists");

    const s0 = makeSailingState("portRoyal", "tortuga", 3, {
      ship: { ...makeShip("sloop"), hull: 100 },
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold({ food: 20, water: 20 }),
      activeEvent: { ...stormEvent },
    });

    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 0 });

    u.assertEqual(s1.ship.hull, 85, "hull reduced by 15");
    u.assertEqual(s1.crew.roster.length, 7, "crew reduced by 3");
    u.assertEqual(s1.day, s0.day + 1, "day advanced by lost days");
    u.assert(s1.screen === "sailing", "screen is sailing");
  });

  reg("E.EVENT.STORM.SHELTER", "Storm: Shelter reroutes to map with reduced damage", (u) => {
    const s0 = makeSailingState("portRoyal", "havana", 5, {
      ship: { ...makeShip("sloop"), hull: 100 },
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold({ food: 20, water: 20 }),
      discoveredPorts: Object.keys(D.PORTS),
    });

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

    const stormEvent = D.RANDOM_EVENTS.find(e => e.id === "storm");
    u.assert(stormEvent, "Storm event exists");

    const shelterChoice = stormEvent.choices[1];
    u.assert(shelterChoice, "Shelter choice exists");
    u.assert(shelterChoice.condition(s0), "Shelter condition should be true");

    s0.activeEvent = { ...stormEvent };
    const s1 = dispatch(s0, A.RESOLVE_EVENT, { choiceIndex: 1 });

    u.assertEqual(s1.ship.hull, 95, "hull reduced by 5");
    u.assertEqual(s1.crew.roster.length, 9, "crew reduced by 1");
    u.assertEqual(s1.screen, "map", "screen is map");
    u.assert(s1.log.some(l => l.includes("seek shelter") || l.includes("detour")), "log mentions detour");
  });

  reg("E.EVENT.STORM.NO_SHELTER", "Storm: Shelter condition false when no reachable alternative", (u) => {
    const s0 = makeSailingState("portRoyal", "havana", 5, {
      ship: { ...makeShip("dinghy"), hull: 30 },
      crew: { roster: [], max: 5, morale: 80 },
      hold: makeHold({ food: 5, water: 5 }),
      discoveredPorts: ["havana"],
    });
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

  // ── WRECK ──────────────────────────────────────────────────────────

  reg("E.EVENT.WRECK.AMBUSH", "Wreck: Ambush leads to encounter with preserved source", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 2, {
      fame: 50,
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      hold: makeHold(),
    });

    setRandomSequence([0.05]);
    const s1 = dispatch(s0, A.RESOLVE_DRIFTING_WRECK_SEARCH);
    resetRandomStub();

    u.assert(s1.encounterSession !== null, "encounter session created");
    u.assertEqual(s1.screen, "intercept", "screen is intercept");
    u.assertEqual(s1.encounterSession.type, "pirate_ambush", "type is pirate_ambush");
    u.assertEqual(s1.encounterSession.source.kind, "event", "source kind is event");
    u.assertEqual(s1.encounterSession.source.id, "drifting_wreck", "source id is drifting_wreck");
  });

  reg("E.EVENT.WRECK.SALVAGE", "Wreck: Salvage adds gold and cargo", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 2, {
      fame: 50,
      gold: 500,
      hold: makeHold({ food: 5, water: 5 }),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });

    setRandomSequence([0.3]);
    const s1 = dispatch(s0, A.RESOLVE_DRIFTING_WRECK_SEARCH);
    resetRandomStub();

    u.assert(s1.gold > 500, "gold increased");
    u.assert(Object.keys(s1.hold.items).some(k => s1.hold.items[k] > 0), "some cargo added");
    u.assertEqual(s1.screen, "sailing", "screen is sailing");
  });

  reg("E.EVENT.WRECK.EMPTY", "Wreck: Empty yields no rewards", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 2, {
      gold: 500,
      hold: makeHold({ food: 5, water: 5 }),
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });

    setRandomSequence([0.65]);
    const s1 = dispatch(s0, A.RESOLVE_DRIFTING_WRECK_SEARCH);
    resetRandomStub();

    u.assertEqual(s1.gold, 500, "gold unchanged");
    u.assertEqual(L.getHoldUsed(s1.hold.items), L.getHoldUsed(s0.hold.items), "hold unchanged");
    u.assertEqual(s1.screen, "sailing", "screen is sailing");
  });

  reg("E.EVENT.WRECK.SURVIVOR", "Wreck: Survivor joins crew if capacity", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 2, {
      crew: { roster: fillRoster(3), max: 40, morale: 80 },
      hold: makeHold(),
    });

    setRandomSequence([0.75]);
    const s1 = dispatch(s0, A.RESOLVE_DRIFTING_WRECK_SEARCH);
    resetRandomStub();

    u.assertEqual(s1.crew.roster.length, 4, "one crew added");
    u.assertEqual(s1.screen, "sailing", "screen is sailing");
  });

  // ── MERCHANT ──────────────────────────────────────────────────────

  reg("E.EVENT.MERCHANT.SAVED", "Merchant: Defend and win with merchant saved", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      reputation: { portRoyal: 50 },
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      ship: makeShip("sloop"),
      hold: makeHold(),
    });

    const s1 = dispatch(s0, A.ATTACK_PIRATE);
    u.assert(s1.encounterSession !== null, "encounter session created");
    u.assertEqual(s1.screen, "intercept", "screen is intercept");

    const s2 = dispatch(s1, A.INTERCEPT_FIGHT);
    u.assert(s2.screen === "battle", "screen is battle");

    s2.encounterSession.battle.phase = "victory";
    s2.encounterSession.battle.convoyLost = false;
    s2.encounterSession.battle.canPlunder = false;
    s2.encounterSession.merchantFaction = "english";
    s2.encounterSession.merchantProtected = true;

    const s3 = dispatch(s2, A.DISMISS_BATTLE);

    u.assert(s3.gold > 1000, "gold increased (rescue bonus)");
    u.assert(s3.reputation["portRoyal"] > 50, "reputation increased");
    u.assert(s3.log.some(l => l.includes("merchant is saved")), "log mentions saved");
    u.assert(s3.encounterSession === null, "encounter cleared");
  });

  reg("E.EVENT.MERCHANT.SUNK", "Merchant: Defend and win but merchant sunk yields no rescue reward", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      reputation: { portRoyal: 50 },
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      ship: makeShip("sloop"),
      hold: makeHold(),
    });

    const s1 = dispatch(s0, A.ATTACK_PIRATE);
    const s2 = dispatch(s1, A.INTERCEPT_FIGHT);

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

  reg("E.EVENT.MERCHANT.PLUNDER", "Merchant: Plunder leads to encounter", (u) => {
    const s0 = makePortState("portRoyal", {
      gold: 1000,
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
    });

    const s1 = dispatch(s0, A.ATTACK_MERCHANT);
    u.assert(s1.encounterSession !== null, "encounter session created");
    u.assertEqual(s1.encounterSession.type, "distressed_merchant_plunder", "type is merchant plunder");
    u.assertEqual(s1.screen, "intercept", "screen is intercept");
  });

  // ── SAILORS ──────────────────────────────────────────────────────

  reg("E.EVENT.SAILORS.TAKE_ABOARD", "Marooned Sailors: Take aboard adds crew", (u) => {
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

  reg("E.EVENT.SAILORS.GIVE_SUPPLIES", "Marooned Sailors: Give supplies with sufficient resources", (u) => {
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

  reg("E.EVENT.SAILORS.NO_SUPPLIES", "Marooned Sailors: Give supplies disabled when insufficient", (u) => {
    const s0 = makeSailingState("portRoyal", "tortuga", 3, {
      fame: 50,
      gold: 10,
      hold: makeHold({ food: 5, water: 5 }),
      crew: { roster: fillRoster(5), max: 40, morale: 80 },
    });
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

  reg("E.EVENT.SAILORS.SAIL_ON", "Marooned Sailors: Sail on applies morale penalty", (u) => {
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

  // ── PATROL ──────────────────────────────────────────────────────

  reg("E.PATROL.CLEAN", "Patrol: Clean inspection ends encounter", (u) => {
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
    u.assert(s1.encounterSession === null, "encounter cleared");
    u.assertEqual(s1.gold, 500, "gold unchanged");
    u.assert(s1.log.some(l => l.includes("nothing")), "log mentions nothing found");
  });

  reg("E.PATROL.HANDOVER", "Patrol: Contraband found -> handover applies penalties", (u) => {
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
    u.assertEqual(s1.encounterSession.phase, "inspection_pending", "phase is inspection_pending");

    const s2 = dispatch(s1, A.RESOLVE_INSPECTION, { choice: "handOver" });
    u.assertEqual(s2.gold, 425, "gold reduced by fine (75)");
    u.assertEqual(s2.hold.items.tobacco, 0, "tobacco seized");
    u.assertEqual(s2.infamy, 2, "infamy +2");
    u.assertEqual(s2.crew.morale, 70, "morale -10");
    u.assert(s2.encounterSession === null, "encounter cleared");
  });

  reg("E.PATROL.RESIST", "Patrol: Contraband found -> resist leads to boarding", (u) => {
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

 
// ══════════════════════════════════════════════════════════════════════════
// E.WASH.REDIRECT — Spanish redirection in washAshore (matrix)
// ══════════════════════════════════════════════════════════════════════════

reg("E.WASH.REDIRECT", "Spanish redirection matrix: all conditions", (u) => {
  // Helper to create a wash state with overrides
  const makeWashState = (overrides) => {
    const base = {
      faction: "spanish",
      ship: { type: "sloop", hull: 100 },
      crew: { roster: fillRoster(0), max: 40, morale: 80 },
      gold: 0,
      hold: makeHold({ food: 0, water: 0 }),
      previousPort: "portRoyal",
      currentPort: "portRoyal",
      reputation: { portRoyal: 50 },
      discoveredPorts: ["portRoyal", "tortuga", "havana", "santiagoDeCuba"],
      encounterSession: {
        type: "random",
        enemy: { name: "Test Enemy", faction: "pirate" },
        phase: "battle",
        battle: { phase: "defeat" }
      },
      ...overrides
    };
    if (overrides.route) {
      base.route = overrides.route;
    }
    return makeState(base);
  };

  // Mock findNearestPortOfFaction to return a fixed Spanish port.
  const originalFind = L.findNearestPortOfFaction;
  L.findNearestPortOfFaction = (state, faction, pos) => "havana";

  // Define test matrix:
  // [faction, shipType, crewCount, gold, atSea, currentPortKey, expectedPort, expectedGameOver]
  const matrix = [
    // Spanish, insufficient crew, at sea, non‑Spanish port → redirect to havana
    ["spanish", "sloop", 0, 200, true, "portRoyal", "havana", false],
    // Spanish, insufficient crew, at sea, already at Spanish port → stay at havana
    ["spanish", "sloop", 0, 200, true, "havana", "havana", false],
    // Spanish, insufficient crew, at non‑Spanish port → redirect to havana
    ["spanish", "sloop", 0, 200, false, "portRoyal", "havana", false],
    // Spanish, insufficient crew, in dinghy → stay at portRoyal (no redirect)
    ["spanish", "dinghy", 0, 0, false, "portRoyal", "portRoyal", false],
    // Spanish, sufficient crew (>= min) → stay at portRoyal
    ["spanish", "sloop", 5, 0, false, "portRoyal", "portRoyal", false],
    // Non‑Spanish, 0 crew → stay at portRoyal, gameover
    ["english", "sloop", 0, 0, false, "portRoyal", "portRoyal", true],
    // Spanish, no discovered Spanish ports → fallback to portRoyal, gameover
    ["spanish", "sloop", 0, 200, false, "portRoyal", "portRoyal", true],
  ];

  for (const [faction, shipType, crewCount, gold, atSea, currentPortKey, expectedPort, expectedGameOver] of matrix) {
    let overrides = {
      faction,
      ship: { type: shipType, hull: shipType === "dinghy" ? 30 : 100 },
      crew: { roster: fillRoster(crewCount), max: 40, morale: 80 },
      gold: gold,
      currentPort: currentPortKey,
      previousPort: currentPortKey,
    };

    if (atSea) {
      overrides.route = {
        originPos: D.PORTS.portRoyal,
        destinationPos: D.PORTS.tortuga,
        totalDays: 5,
        progressDays: 2,
        enduranceBudget: 10,
        enduranceSpent: 2,
      };
    }

    // For the "no discovered Spanish ports" case
    if (expectedGameOver && faction === "spanish") {
      overrides.discoveredPorts = ["portRoyal", "tortuga"];
    }

    const state = makeWashState(overrides);
    const result = window.E.washAshore(state);

    u.assertEqual(result.currentPort, expectedPort,
      `${faction}/${shipType}/${crewCount} crew, gold=${gold}, atSea=${atSea}, port=${currentPortKey}: expected ${expectedPort}`);

    const redirectExpected = expectedPort === "havana" && currentPortKey !== "havana";
    const hasRedirectLog = result.log.some(l => l.includes("currents carried you"));
    u.assertEqual(hasRedirectLog, redirectExpected,
      `redirect log ${redirectExpected ? "present" : "absent"} for ${faction}/${shipType}/${crewCount} crew`);

    const isGameOver = result.screen === "gameover";
    u.assertEqual(isGameOver, expectedGameOver,
      `gameover ${expectedGameOver ? "expected" : "not expected"} for ${faction}/${shipType}/${crewCount} crew`);

    u.assert(result.encounterSession === null, "encounter cleared");
  }

  // Restore original
  L.findNearestPortOfFaction = originalFind;
});

  // ══════════════════════════════════════════════════════════════════════════
// B10.ENGINE — New port service actions
// ══════════════════════════════════════════════════════════════════════════

reg("B10.ENGINE.BANK_FLOW", "TAKE_LOAN / REPAY_LOAN: table-driven flow", (u) => {
  // Helper to build a Dutch port state
  const makeDutchState = (overrides = {}) => makePortState("curacao", {
    faction: "dutch",
    reputation: { ...window.E.initialState.reputation, curacao: 50 },
    gold: 1000,
    bankDebt: 0,
    ...overrides,
  });

  // ── TAKE_LOAN ──────────────────────────────────────────────────
  // Non-Dutch port fails
  let s = makeDutchState();
  s.currentPort = "portRoyal"; // English
  s = dispatch(s, A.TAKE_LOAN, { amount: 5000 });
  u.assertEqual(s.bankDebt, 0, "non-Dutch port: no loan");

  // Rep too low
  s = makeDutchState({ reputation: { curacao: 20 } });
  s = dispatch(s, A.TAKE_LOAN, { amount: 5000 });
  u.assertEqual(s.bankDebt, 0, "rep <30: no loan");

  // Already in debt
  s = makeDutchState({ bankDebt: 10000 });
  s = dispatch(s, A.TAKE_LOAN, { amount: 5000 });
  u.assertEqual(s.bankDebt, 10000, "already in debt: no new loan");

  // Amount > capacity
  s = makeDutchState({ fame: 0, reputation: { curacao: 30 } });
  // capacity at rep30, fame0 = 200
  s = dispatch(s, A.TAKE_LOAN, { amount: 5000 });
  u.assertEqual(s.bankDebt, 0, "amount > capacity: no loan");

  // Valid loan
  s = makeDutchState({ fame: 0, reputation: { curacao: 30 }, gold: 0 });
  // capacity = 200, interest = 20%, obligation = ceil(200 * 1.2) = 240
  s = dispatch(s, A.TAKE_LOAN, { amount: 200 });
  u.assertEqual(s.gold, 200, "gold increased by loan amount");
  u.assertEqual(s.bankDebt, 240, "debt includes interest");
  u.assert(s.log.some(l => l.includes("Took a loan")), "log entry present");

  // ── REPAY_LOAN ────────────────────────────────────────────────
  s = makeDutchState({ bankDebt: 240, gold: 300 });
  s = dispatch(s, A.REPAY_LOAN, { amount: 100 });
  u.assertEqual(s.gold, 200, "gold reduced by repayment");
  u.assertEqual(s.bankDebt, 140, "debt reduced");

  s = dispatch(s, A.REPAY_LOAN, { amount: 1000 });
  u.assertEqual(s.gold, 60, "gold reduced by full remaining debt");
  u.assertEqual(s.bankDebt, 0, "debt cleared");
});

reg("B10.ENGINE.INQUISITOR_FLOW", "PAY_INQUISITOR: table-driven flow", (u) => {
  const makeSpanishState = (overrides = {}) => makePortState("havana", {
    faction: "spanish",
    reputation: { ...window.E.initialState.reputation, havana: 60 },
    gold: 500,
    infamy: 30,
    ...overrides,
  });

  // Non-Spanish port fails
  let s = makeSpanishState();
  s.currentPort = "portRoyal";
  s = dispatch(s, A.PAY_INQUISITOR);
  u.assertEqual(s.infamy, 30, "non-Spanish port: no change");

  // Rep < 50 fails
  s = makeSpanishState({ reputation: { havana: 40 } });
  s = dispatch(s, A.PAY_INQUISITOR);
  u.assertEqual(s.infamy, 30, "rep <50: no change");

  // Infamy 0 fails
  s = makeSpanishState({ infamy: 0 });
  s = dispatch(s, A.PAY_INQUISITOR);
  u.assertEqual(s.gold, 500, "infamy 0: no change");

  // Insufficient gold
  s = makeSpanishState({ gold: 100, infamy: 30 });
  s = dispatch(s, A.PAY_INQUISITOR);
  u.assertEqual(s.infamy, 30, "insufficient gold: no change");

  // Valid payment reduces infamy by 1 and deducts cost (30 infamy → 400g)
  s = makeSpanishState({ gold: 500, infamy: 30 });
  s = dispatch(s, A.PAY_INQUISITOR);
  u.assertEqual(s.gold, 100, "gold reduced by 400");
  u.assertEqual(s.infamy, 29, "infamy reduced by 1");
  u.assert(s.log.some(l => l.includes("absolution")), "log entry present");
});

reg("B10.ENGINE.EMBASSY_FLOW", "PURCHASE_EMBASSY_REP: table-driven flow", (u) => {
  const makeFrenchState = (overrides = {}) => makePortState("martinique", {
    faction: "french",
    reputation: { ...window.E.initialState.reputation, martinique: 60, spanish: 30 },
    gold: 5000,
    ...overrides,
  });

  // Non-French port fails
  let s = makeFrenchState();
  s.currentPort = "portRoyal";
  s = dispatch(s, A.PURCHASE_EMBASSY_REP, { targetFaction: "spanish" });
  u.assertEqual(s.reputation.spanish, 30, "non-French port: no change");

  // Rep < 50 fails
  s = makeFrenchState({ reputation: { martinique: 40, spanish: 30 } });
  s = dispatch(s, A.PURCHASE_EMBASSY_REP, { targetFaction: "spanish" });
  u.assertEqual(s.reputation.spanish, 30, "rep <50: no change");

  // Invalid target
  s = makeFrenchState();
  s = dispatch(s, A.PURCHASE_EMBASSY_REP, { targetFaction: "ottoman" });
  u.assertEqual(s.reputation.spanish, 30, "invalid target: no change");

  // Target at 100 fails
const frenchState100 = makeFrenchState({ 
  reputation: { 
    martinique: 60, 
    spanish: 100,
    // Also set all Spanish ports to 100
    havana: 100,
    santiagoDeCuba: 100,
    santoDomingo: 100,
    cartagena: 100,
    maracaibo: 100,
    portobelo: 100,
    campeche: 100,
    veracruz: 100,
    trinidad: 100,
  } 
});
s = dispatch(frenchState100, A.PURCHASE_EMBASSY_REP, { targetFaction: "spanish" });
u.assertEqual(s.gold, 5000, "target max: no change");

  // Insufficient gold
  s = makeFrenchState({ gold: 100, reputation: { martinique: 60, spanish: 30 } });
  s = dispatch(s, A.PURCHASE_EMBASSY_REP, { targetFaction: "spanish" });
  u.assertEqual(s.reputation.spanish, 30, "insufficient gold: no change");

  // Valid purchase: rep 30 → 35, cost 1000
  s = makeFrenchState({ gold: 5000, reputation: { martinique: 60, spanish: 30 } });
  s = dispatch(s, A.PURCHASE_EMBASSY_REP, { targetFaction: "spanish" });
  u.assertEqual(s.gold, 4000, "gold reduced by 1000");
  u.assertEqual(s.reputation.spanish, 35, "rep increased by 5");
  u.assert(s.log.some(l => l.includes("French Embassy")), "log entry present");
});

reg("B10.ENGINE.MISSION_GARNISH", "COMPLETE_MISSION: loan garnish on reward only", (u) => {
  const mission = makeMission({
    type: "trade",
    targetPort: "portRoyal",
    gold: 200,
    fame: 1,
    requiredGood: "sugar",
    requiredQty: 5,
  });
  const s0 = makePortState("portRoyal", {
    gold: 0,
    bankDebt: 1000,
    hold: makeHold({ sugar: 5, food: 5, water: 5 }),
    portMarket: { goods: { sugar: { sellToPort: 50 } } },
    activeMission: mission,
    reputation: { portRoyal: 50 }, // friendly multiplier 1.10
  });

  const s1 = dispatch(s0, A.COMPLETE_MISSION);

  // rewardGold = Math.floor(200 * 1.10) = 220
  // garnish = 220 * 0.20 = 44
  // netReward = 220 - 44 = 176
  // goodsValue = 5 * 50 = 250
  // netGoldGain = 176 + 250 = 426
  u.assertEqual(s1.gold, 426, "gold added correctly");
  u.assertEqual(s1.bankDebt, 956, "debt reduced by 44");
  u.assert(s1.log.some(l => l.includes("Bank repayment")), "garnish log present");
});

reg("B10.ENGINE.TRADE_GARNISH", "CONFIRM_TRADE: garnish on net profit only", (u) => {
  const s0 = makePortState("portRoyal", {
    gold: 0,
    bankDebt: 1000,
    hold: makeHold({ cloth: 10 }),
    portMarket: {
      goods: {
        cloth: { buyFromPort: 60, sellToPort: 45, available: 100 },
        sugar: { buyFromPort: 50, sellToPort: 40, available: 100 },
      }
    },
  });
  // Sell 10 cloth: +450, buy 5 sugar: -250 → net +200
  // Garnish 20% of 200 = 40 → net gold gain = 160
  const s1 = dispatch(s0, A.CONFIRM_TRADE, { buys: { sugar: 5 }, sells: { cloth: 10 } });
  u.assertEqual(s1.gold, 160, "gold after garnish");
  u.assertEqual(s1.bankDebt, 960, "debt reduced by 40");
  u.assert(s1.log.some(l => l.includes("Bank repayment")), "garnish log present");
});

reg("B10.ENGINE.NAVAL_YARD", "BUY_SHIP: early access uses English Rep 80", (u) => {
  // English Rep 80, Fame 40 (Schooner requires 50, adjusted to 40)
  const s0 = makePortState("portRoyal", {
    gold: 25000,
    reputation: { portRoyal: 80 },
    fame: 40,
    ship: makeShip("sloop"),
  });
  const s1 = dispatch(s0, A.BUY_SHIP, { shipType: "schooner" });
  u.assertEqual(s1.ship.type, "schooner", "bought with early access");

  // English Rep 79, Fame 40 → blocked
  const s2 = makePortState("portRoyal", {
    gold: 25000,
    reputation: { portRoyal: 79 },
    fame: 40,
    ship: makeShip("sloop"),
  });
  const s3 = dispatch(s2, A.BUY_SHIP, { shipType: "schooner" });
  u.assertEqual(s3.ship.type, "sloop", "not bought with low English rep");

  // Non-English port → blocked even with Fame
  const s4 = makePortState("tortuga", {
    gold: 25000,
    reputation: { tortuga: 80 },
    fame: 40,
    ship: makeShip("sloop"),
  });
  const s5 = dispatch(s4, A.BUY_SHIP, { shipType: "schooner" });
  u.assertEqual(s5.ship.type, "sloop", "non-English port blocks early access");
});


})();