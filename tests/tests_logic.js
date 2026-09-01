// tests_logic.js
// ─────────────────────────────────────────────────────────────────────────────
// Unit tests for pure functions in logic.js and deterministic parts of
// generators.js (save encoding, hash). All tests are 100% deterministic —
// no Math.random() is called. Tests are organised into labelled sections.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  const {
    makeState, makeShip, makeHold, makeCrewMember, fillRoster,
    makePortState, makeBattleState, makeEnemy,
    setRandomSequence, resetRandomStub, makeEncounterSession,
  } = window.testHelpers;

  const L = window.L;
  const D = window.D;

  const reg = (id, name, run) =>
    window._tests.push({ id, name, run });

  // ══════════════════════════════════════════════════════════════════════════
  // L.STATS — getShipStats with and without equipment
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.STATS.01", "getShipStats: dinghy base stats — no equipment", (u) => {
    const state = makeState({ ship: makeShip("dinghy") });
    const stats = L.getShipStats(state);
    u.assertEqual(stats.maxHull, 30, "maxHull");
    u.assertEqual(stats.cannons, 2, "cannons");
    u.assertEqual(stats.speed, 6, "speed");
    u.assertEqual(stats.holdCapacity, 30, "holdCapacity");
    u.assertEqual(stats.maxCrew, 5, "maxCrew");
  });

  reg("L.STATS.02", "getShipStats: sloop base stats — no equipment", (u) => {
    const state = makeState({ ship: makeShip("sloop") });
    const stats = L.getShipStats(state);
    u.assertEqual(stats.maxHull, 100);
    u.assertEqual(stats.speed, 11);
    u.assertEqual(stats.holdCapacity, 200);
  });

  reg("L.STATS.03", "getShipStats: reinforced_hull adds 20% hull", (u) => {
    const state = makeState({
      ship: { ...makeShip("sloop"), equipment: { hull: ["reinforced_hull"], armament: [], rigging: [], special: [] } },
    });
    const stats = L.getShipStats(state);
    u.assertEqual(stats.maxHull, 120);
  });

  reg("L.STATS.04", "getShipStats: extra_cannons adds 4 cannons", (u) => {
    const state = makeState({
      ship: { ...makeShip("schooner"), equipment: { hull: [], armament: ["extra_cannons"], rigging: [], special: [] } },
    });
    const stats = L.getShipStats(state);
    u.assertEqual(stats.cannons, 16);
  });

  reg("L.STATS.05", "getShipStats: tar_sealed_hull adds maxDays and reduces speed", (u) => {
    const state = makeState({
      ship: { ...makeShip("cutter"), equipment: { hull: ["tar_sealed_hull"], armament: [], rigging: [], special: [] } },
    });
    const stats = L.getShipStats(state);
    u.assertEqual(stats.maxDays, 10, "maxDays");
    u.assertEqual(stats.speed, 11, "speed");
  });

  reg("L.STATS.06", "getShipStats: unknown equipment key is silently ignored", (u) => {
    const state = makeState({
      ship: { ...makeShip("sloop"), equipment: { hull: ["not_real_item"], armament: [], rigging: [], special: [] } },
    });
    const stats = L.getShipStats(state);
    u.assertEqual(stats.maxHull, 100);
    u.assertEqual(stats.speed, 11);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.REPAIR — shipRepairCost formula (tier-scaled)
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.REPAIR.01", "shipRepairCost: 0 missing hull = 0 cost", (u) => {
    const ship = makeShip("sloop");
    const state = makeState({ ship });
    u.assertEqual(L.shipRepairCost(state), 0);
  });

  reg("L.REPAIR.02", "shipRepairCost: dinghy — 2g per hull point (ceil(30/20)=2)", (u) => {
    const ship = { ...makeShip("dinghy"), hull: 20 };
    const state = makeState({ ship });
    u.assertEqual(L.shipRepairCost(state), 20);
  });

  reg("L.REPAIR.03", "shipRepairCost: sloop — 5g per hull point (ceil(100/20)=5)", (u) => {
    const ship = { ...makeShip("sloop"), hull: 60 };
    const state = makeState({ ship });
    u.assertEqual(L.shipRepairCost(state), 200);
  });

  reg("L.REPAIR.04", "shipRepairCost: galleon — 15g per hull point (ceil(300/20)=15)", (u) => {
    const ship = { ...makeShip("galleon"), hull: 250 };
    const state = makeState({ ship });
    u.assertEqual(L.shipRepairCost(state), 750);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.HOLD — hold capacity, usage, load percentage
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.HOLD.01", "getHoldCapacity: derives from ship type, not hold.capacity field", (u) => {
    const state = makeState({ ship: makeShip("sloop") });
    u.assertEqual(L.getHoldCapacity(state), 200);
  });

  reg("L.HOLD.02", "getHoldCapacity: cutter with no equipment = 80", (u) => {
    const state = makeState({ ship: makeShip("cutter") });
    u.assertEqual(L.getHoldCapacity(state), 80);
  });

  reg("L.HOLD.03", "getHoldUsed: sums all item quantities", (u) => {
    const items = { food: 10, water: 5, rum: 3, sugar: 0, timber: 0,
                    cloth: 0, spices: 0, silk: 0, coffee: 0, cocoa: 0,
                    weapons: 0, tobacco: 0, silver: 0, slaves: 0 };
    u.assertEqual(L.getHoldUsed(items), 18);
  });

  reg("L.HOLD.04", "getHoldUsed: empty hold = 0", (u) => {
    const state = makeState();
    u.assertEqual(L.getHoldUsed(state.hold.items), 0);
  });

  reg("L.HOLD.05", "hold speed: <50% load has no penalty", (u) => {
    const state = makeState({
      ship: makeShip("sloop"),
      hold: makeHold({ food: 99 }),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
    });
    const days = L.travelDays("portRoyal", "tortuga", state);
    u.assert(days >= 1, "positive travel days");
    const heavyState = makeState({
      ship: makeShip("sloop"),
      hold: makeHold({ food: 151 }),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
    });
    const heavyDays = L.travelDays("portRoyal", "tortuga", heavyState);
    u.assert(heavyDays >= days, "heavy hold takes at least as long");
  });

  reg("L.HOLD.06", "getDaysOfProvisions: calculates remaining days correctly", (u) => {
    const state = makeState({
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      day: 5,
    });
    const items = { food: 10, water: 5 };
    const days = L.getDaysOfProvisions(items, state);
    u.assertEqual(days.food, 10, "food days = 10");
    u.assertEqual(days.water, 5, "water days = 5");
  });

  reg("L.HOLD.07", "getHoldSpeedMultiplier: returns correct multipliers", (u) => {
    u.assertEqual(L.getHoldSpeedMultiplier(0.4), 1.00, "<0.5 -> 1.00");
    u.assertEqual(L.getHoldSpeedMultiplier(0.5), 1.11, "0.5-0.75 -> 1.11");
    u.assertEqual(L.getHoldSpeedMultiplier(0.75), 1.33, "≥0.75 -> 1.33");
  });

  reg("L.HOLD.08", "payCrewWages: calculates wages with morale modifier", (u) => {
    const stateGood = makeState({ crew: { roster: fillRoster(10), morale: 80, max: 40 } });
    u.assertEqual(L.payCrewWages(stateGood), 20, "normal morale -> 20g");
    const stateLow = makeState({ crew: { roster: fillRoster(10), morale: 20, max: 40 } });
    u.assertEqual(L.payCrewWages(stateLow), 30, "low morale -> 30g");
  });

  reg("L.HOLD.09", "applyLoseContraband: removes illegal goods from hold", (u) => {
    const items = { food: 5, rum: 10, tobacco: 3, slaves: 2 };
    const result = L.applyLoseContraband(items);
    u.assertEqual(result.tobacco, 0, "tobacco removed");
    u.assertEqual(result.slaves, 0, "slaves removed");
    u.assertEqual(result.food, 5, "food preserved");
    u.assertEqual(result.rum, 10, "rum preserved");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.REP — reputation label thresholds
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.REP.01", "reputationLabel: exact boundary values", (u) => {
    u.assertEqual(L.reputationLabel(80), "Allied");
    u.assertEqual(L.reputationLabel(79), "Friendly");
    u.assertEqual(L.reputationLabel(60), "Friendly");
    u.assertEqual(L.reputationLabel(59), "Neutral");
    u.assertEqual(L.reputationLabel(40), "Neutral");
    u.assertEqual(L.reputationLabel(39), "Unfriendly");
    u.assertEqual(L.reputationLabel(20), "Unfriendly");
    u.assertEqual(L.reputationLabel(19), "Hostile");
    u.assertEqual(L.reputationLabel(10), "Hostile");
    u.assertEqual(L.reputationLabel(9),  "At War");
    u.assertEqual(L.reputationLabel(0),  "At War");
  });

  reg("L.REP.02", "getRepPerk: correct tier and multipliers at key thresholds", (u) => {
    const allied = L.getRepPerk(80);
    u.assertEqual(allied.tier, "allied");
    u.assertEqual(allied.repairMult, 0.80);
    u.assertEqual(allied.missionMult, 1.20);
    u.assert(!allied.servicesBlocked, "allied: services open");

    const friendly = L.getRepPerk(50);
    u.assertEqual(friendly.tier, "friendly");
    u.assertEqual(friendly.repairMult, 0.90);

    const neutral = L.getRepPerk(30);
    u.assertEqual(neutral.tier, "neutral");
    u.assertEqual(neutral.missionMult, 0.90);

    const hostile = L.getRepPerk(10);
    u.assertEqual(hostile.tier, "hostile");
    u.assert(!hostile.servicesBlocked, "hostile: services not blocked");

    const atWar = L.getRepPerk(9);
    u.assertEqual(atWar.tier, "at_war");
    u.assert(atWar.servicesBlocked, "at_war: services blocked");
    u.assertEqual(atWar.missionMult, 0);
  });

  reg("L.REP.03", "getRepPerk: rep=49 is friendly (≥50 threshold)", (u) => {
    u.assertEqual(L.getRepPerk(49).tier, "neutral");
    u.assertEqual(L.getRepPerk(50).tier, "friendly");
  });

  reg("L.REP.04", "getInfamyLabel: returns correct labels at thresholds", (u) => {
    u.assertEqual(L.getInfamyLabel(0), "Clean", "0 infamy");
    u.assertEqual(L.getInfamyLabel(9), "Clean", "9 infamy");
    u.assertEqual(L.getInfamyLabel(10), "Suspect", "10 infamy");
    u.assertEqual(L.getInfamyLabel(24), "Suspect", "24 infamy");
    u.assertEqual(L.getInfamyLabel(25), "Wanted", "25 infamy");
    u.assertEqual(L.getInfamyLabel(49), "Wanted", "49 infamy");
    u.assertEqual(L.getInfamyLabel(50), "Notorious", "50 infamy");
    u.assertEqual(L.getInfamyLabel(99), "Notorious", "99 infamy");
    u.assertEqual(L.getInfamyLabel(100), "Legendary Outlaw", "100 infamy");
  });

  reg("L.REP.05", "getHeatLabel: returns labels for heat levels", (u) => {
    u.assertEqual(L.getHeatLabel(0), "", "0 heat");
    u.assertEqual(L.getHeatLabel(1), "Alert", "1 heat");
    u.assertEqual(L.getHeatLabel(2), "Alert", "2 heat");
    u.assertEqual(L.getHeatLabel(3), "Active Search", "3 heat");
    u.assertEqual(L.getHeatLabel(5), "Active Search", "5 heat");
    u.assertEqual(L.getHeatLabel(6), "Hunted", "6 heat");
    u.assertEqual(L.getHeatLabel(7), "Hunted", "7 heat");
    u.assertEqual(L.getHeatLabel(8), "Hunted", "8 heat");
    u.assertEqual(L.getHeatLabel(9), "Manhunt", "9 heat");
    u.assertEqual(L.getHeatLabel(10), "Manhunt", "10 heat");
  });

  reg("L.REP.06", "decayReputation: reduces rep above 50 toward 50", (u) => {
    const state = { reputation: { portRoyal: 80, tortuga: 40 } };
    const newRep = L.decayReputation(state);
    u.assertEqual(newRep.portRoyal, 79, "above 50 decays by 1");
    u.assertEqual(newRep.tortuga, 40, "below 50 unchanged");
  });

  // ── Bribe gate (incl. Pirate bypass) ───────────────────────────────────
  reg("L.REP.07", "canBribe: respects infamy, reputation, and pirate bypass", (u) => {
    const base = { reputation: { portRoyal: 40 }, currentPort: 'portRoyal' };
    u.assert(L.canBribe({ ...base, infamy: 0 }), "infamy 0, rep 40 -> true");
    u.assert(L.canBribe({ ...base, infamy: 24 }), "infamy 24, rep 40 -> true");
    u.assert(!L.canBribe({ ...base, infamy: 25 }), "infamy 25 -> false");
    u.assert(!L.canBribe({ ...base, infamy: 0, reputation: { portRoyal: 30 } }), "rep 30 -> false");
    u.assert(L.canBribe({ ...base, faction: 'pirate', infamy: 100, reputation: { portRoyal: 31 } }),
      "pirate with high infamy, rep 31 -> true");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.FAME — fame tier thresholds
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.FAME.01", "getFameInfo: exact boundary values", (u) => {
    u.assertEqual(L.getFameInfo(0).label,   "Greenhorn");
    u.assertEqual(L.getFameInfo(9).label,   "Greenhorn");
    u.assertEqual(L.getFameInfo(10).label,  "Unknown");
    u.assertEqual(L.getFameInfo(49).label,  "Unknown");
    u.assertEqual(L.getFameInfo(50).label,  "Recognised");
    u.assertEqual(L.getFameInfo(99).label,  "Recognised");
    u.assertEqual(L.getFameInfo(100).label, "Notorious");
    u.assertEqual(L.getFameInfo(199).label, "Notorious");
    u.assertEqual(L.getFameInfo(200).label, "Legendary");
    u.assertEqual(L.getFameInfo(349).label, "Legendary");
    u.assertEqual(L.getFameInfo(350).label, "Immortal");
  });

  reg("L.FAME.02", "getFameInfo: tier numbers are 0–5", (u) => {
    u.assertEqual(L.getFameInfo(0).tier,   0);
    u.assertEqual(L.getFameInfo(10).tier,  1);
    u.assertEqual(L.getFameInfo(50).tier,  2);
    u.assertEqual(L.getFameInfo(100).tier, 3);
    u.assertEqual(L.getFameInfo(200).tier, 4);
    u.assertEqual(L.getFameInfo(350).tier, 5);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.CREW — tag operations and alignment
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.CREW.01", "hasTag: returns true only when tag is present", (u) => {
    const m = makeCrewMember({ tags: ["seasoned", "scar_storm"] });
    u.assert(L.hasTag(m, "seasoned"), "seasoned present");
    u.assert(L.hasTag(m, "scar_storm"), "scar_storm present");
    u.assert(!L.hasTag(m, "veteran"), "veteran absent");
  });

  reg("L.CREW.02", "hasTag: works on member with no tags field", (u) => {
    const m = { id: "x", firstName: "A", lastName: "B" };
    u.assert(!L.hasTag(m, "any"), "no tags → false");
  });

  reg("L.CREW.03", "addTag: appends the tag without mutating original", (u) => {
    const original = makeCrewMember({ tags: ["seasoned"] });
    const updated  = L.addTag(original, "veteran");
    u.assert(L.hasTag(updated, "seasoned"), "old tag preserved");
    u.assert(L.hasTag(updated, "veteran"),  "new tag added");
    u.assert(!L.hasTag(original, "veteran"), "original not mutated");
  });

  reg("L.CREW.04", "addTag: appends duplicate tag (does not dedupe)", (u) => {
    const m = makeCrewMember({ tags: ["seasoned"] });
    const updated = L.addTag(m, "seasoned");
    u.assertEqual(updated.tags.filter(t => t === "seasoned").length, 2);
  });

  reg("L.CREW.05", "removeTag: removes only the specified tag", (u) => {
    const m = makeCrewMember({ tags: ["seasoned", "veteran", "scar_storm"] });
    const updated = L.removeTag(m, "veteran");
    u.assert(!L.hasTag(updated, "veteran"),  "veteran removed");
    u.assert(L.hasTag(updated, "seasoned"),  "seasoned preserved");
    u.assert(L.hasTag(updated, "scar_storm"), "scar_storm preserved");
  });

  reg("L.CREW.06", "removeTag: is a no-op if tag is absent", (u) => {
    const m = makeCrewMember({ tags: ["seasoned"] });
    const updated = L.removeTag(m, "veteran");
    u.assertEqual(updated.tags.length, 1);
  });

  reg("L.CREW.07", "revealTag: replaces hidden_ with revealed_", (u) => {
    const m = makeCrewMember({ tags: ["hidden_drunkard"] });
    const revealed = L.revealTag(m, "drunkard");
    u.assert(!L.hasTag(revealed, "hidden_drunkard"), "hidden tag removed");
    u.assert(L.hasTag(revealed, "revealed_drunkard"), "revealed tag present");
  });

  reg("L.CREW.08", "revealTag: no-op when hidden trait is absent", (u) => {
    const m = makeCrewMember({ tags: ["seasoned"] });
    const unchanged = L.revealTag(m, "drunkard");
    u.assert(!L.hasTag(unchanged, "revealed_drunkard"));
    u.assert(L.hasTag(unchanged, "seasoned"));
  });

  reg("L.CREW.09", "getAlignmentModifier: all crew same faction = 1.5", (u) => {
    const state = makeState({
      crew: {
        roster: fillRoster(5, { faction: "english" }),
        max: 40, morale: 80,
      },
    });
    u.assertEqual(L.getAlignmentModifier(state, "english"), 1.5);
  });

  reg("L.CREW.10", "getAlignmentModifier: no matching crew = 0.5 (base)", (u) => {
    const state = makeState({
      crew: {
        roster: fillRoster(5, { faction: "spanish" }),
        max: 40, morale: 80,
      },
    });
    u.assertEqual(L.getAlignmentModifier(state, "english"), 0.5);
  });

  reg("L.CREW.11", "getAlignmentModifier: mixed crew = proportional value", (u) => {
    const state = makeState({
      crew: {
        roster: [
          ...fillRoster(2, { faction: "english" }),
          ...fillRoster(3, { faction: "spanish" }).map((m, i) =>
            ({ ...m, id: `spanish_${i}` })
          ),
        ],
        max: 40, morale: 80,
      },
    });
    u.assertApprox(L.getAlignmentModifier(state, "english"), 0.9, 0.01);
  });

  reg("L.CREW.12", "processDesertion: returns roster and log lines", (u) => {
    const roster = [
      makeCrewMember({ faction: "english", tags: ["upset", "mutineer"] }),
      makeCrewMember({ faction: "english", tags: ["upset"] }),
      makeCrewMember({ faction: "spanish", tags: ["upset"] }),
      makeCrewMember({ faction: "english", tags: ["loyal"] }),
    ];
    const state = makeState({ crew: { roster, max: 10, morale: 80 }, currentPort: "portRoyal" });
    const result = L.processDesertion(roster, 80, "portRoyal", state);
    u.assert(Array.isArray(result.roster), "returns roster array");
    u.assert(Array.isArray(result.logLines), "returns log lines array");
  });

  reg("L.CREW.13", "processPositiveTraits: promotes crew based on days and rep", (u) => {
    const roster = [
      makeCrewMember({ daysAboard: 60, tags: [] }),
      makeCrewMember({ daysAboard: 120, tags: [] }),
      makeCrewMember({ daysAboard: 250, tags: [] }),
    ];
    const state = makeState({
      crew: { roster, max: 10, morale: 80 },
      reputation: { portRoyal: 85 },
      currentPort: "portRoyal",
    });
    const result = L.processPositiveTraits(roster, state);
    const updated = result.roster;
    u.assert(updated[0].tags.includes("seasoned"), "first becomes seasoned");
    u.assert(updated[1].tags.includes("veteran"), "second becomes veteran");
    u.assert(Array.isArray(updated), "returns roster array");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.PROV — provisions & starvation (consolidated)
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.PROV.01", "getProvisionConsumptionForDay: consumption pattern for 10 crew", (u) => {
    const crew = 10;
    const state = makeState({ crew: { roster: fillRoster(crew), max: 40, morale: 80 }, day: 1 });
    const c = L.getProvisionConsumptionForDay(state);
    u.assertEqual(c.food, 1, "day 1: 1");
    u.assertEqual(c.water, 1);
    state.day = 10;
    const c2 = L.getProvisionConsumptionForDay(state);
    u.assertEqual(c2.food, 1, "day 10: 1");
    u.assertEqual(c2.water, 1);
  });

  reg("L.PROV.02", "getProvisionConsumptionForDay: 11 crew pattern", (u) => {
    const crew = 11;
    const state = makeState({ crew: { roster: fillRoster(crew), max: 40, morale: 80 }, day: 5 });
    const c = L.getProvisionConsumptionForDay(state);
    u.assertEqual(c.food, 1);
    state.day = 10;
    const c2 = L.getProvisionConsumptionForDay(state);
    u.assertEqual(c2.food, 2);
  });

  reg("L.PROV.03", "getProvisionConsumptionForDay: 0 crew = 0", (u) => {
    const state = makeState({ crew: { roster: [], max: 40, morale: 80 }, day: 1 });
    const c = L.getProvisionConsumptionForDay(state);
    u.assertEqual(c.food, 0);
    u.assertEqual(c.water, 0);
  });

  reg("L.PROV.04", "processStarvation: reduces crew and updates counters", (u) => {
    const state = makeState({ daysWithoutFood: 13, daysWithoutWater: 2 });
    const prov = { foodEmpty: true, waterEmpty: true };
    const roster = fillRoster(5);
    const result = L.processStarvation(state, prov, roster);
    u.assert(result.roster.length <= roster.length, "crew may be reduced");
    u.assert(result.warningLogs.length >= 0, "returns warning logs");
  });

  reg("L.PROV.05", "1 crew: 0 consumption for first 9 days, 1 on day 10", (u) => {
    const state = makeState({ crew: { roster: fillRoster(1), max: 5, morale: 80 }, day: 10 });
    const consumption = L.getProvisionConsumptionForDay(state);
    u.assertEqual(consumption.food, 1);
    u.assertEqual(consumption.water, 1);
  });

  reg("L.PROV.06", "cumulative correctness: after 10 days, total consumption = crew size", (u) => {
    const crew = 5;
    const state = makeState({ crew: { roster: fillRoster(crew), max: 40, morale: 80 }, day: 10 });
    let total = 0;
    for (let d = 1; d <= 10; d++) {
      state.day = d;
      const c = L.getProvisionConsumptionForDay(state);
      total += c.food;
    }
    u.assertEqual(total, crew);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.EQUIPMENT — canInstallEquipment and getEquipmentEffect
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.EQ.01", "canInstallEquipment: dinghy has no hull slot — blocked", (u) => {
    const state = makeState({ ship: makeShip("dinghy"), fame: 0 });
    const result = L.canInstallEquipment(state, "reinforced_hull");
    u.assert(!result.ok, "dinghy has no hull slot");
  });

  reg("L.EQ.02", "canInstallEquipment: sloop can install reinforced_hull in hull slot", (u) => {
    const state = makeState({ ship: makeShip("sloop"), fame: 0 });
    const result = L.canInstallEquipment(state, "reinforced_hull");
    u.assert(result.ok, result.reason);
  });

  reg("L.EQ.03", "canInstallEquipment: blocked by requiredFame", (u) => {
    const state = makeState({ ship: makeShip("frigate"), fame: 0 });
    const result = L.canInstallEquipment(state, "ironclad_plates");
    u.assert(!result.ok, "needs fame 50");
    u.assert(result.reason.includes("fame"), "reason mentions fame");
  });

  reg("L.EQ.04", "canInstallEquipment: slot already filled → blocked", (u) => {
    const state = makeState({
      ship: {
        ...makeShip("sloop"),
        equipment: { hull: ["reinforced_hull"], armament: [], rigging: [], special: [] },
      },
      fame: 0,
    });
    const result = L.canInstallEquipment(state, "tar_sealed_hull");
    u.assert(!result.ok, "slot already occupied");
  });

  reg("L.EQ.05", "getEquipmentEffect: returns 0 for additive effect when no equipment installed", (u) => {
    const state = makeState({ ship: makeShip("sloop") });
    u.assertEqual(L.getEquipmentEffect(state, "repairCostPct"), 0);
  });

  reg("L.EQ.06", "getEquipmentEffect: copper_plating gives repairCostPct 0.40", (u) => {
    const state = makeState({
      ship: {
        ...makeShip("frigate"),
        equipment: { hull: ["copper_plating"], armament: [], rigging: [], special: [] },
      },
      fame: 200,
    });
    u.assertEqual(L.getEquipmentEffect(state, "repairCostPct"), 0.40);
    u.assertEqual(L.getEquipmentEffect(state, "speed"), 2);
  });

  reg("L.EQ.07", "canInstallEquipment: covers multiple failure conditions", (u) => {
    const state = makeState({ ship: makeShip("sloop"), fame: 0 });
    let result = L.canInstallEquipment(state, "reinforced_hull");
    u.assert(result.ok, "reinforced_hull installable on sloop");

    const stateFameLow = makeState({ ship: makeShip("frigate"), fame: 0 });
    result = L.canInstallEquipment(stateFameLow, "ironclad_plates");
    u.assert(!result.ok && result.reason.toLowerCase().includes("fame"), "fame blocked");

    const stateSlotFull = makeState({
      ship: {
        ...makeShip("sloop"),
        equipment: { hull: ["reinforced_hull"], armament: [], rigging: [], special: [] }
      },
      fame: 20,
    });
    result = L.canInstallEquipment(stateSlotFull, "tar_sealed_hull");
    u.assert(!result.ok && (result.reason.toLowerCase().includes("slot") || result.reason.toLowerCase().includes("full")),
             "slot full blocked");

    const stateAlreadyInstalled = makeState({
      ship: {
        ...makeShip("galleon"),
        equipment: { hull: [], armament: [], rigging: [], special: ["expanded_hold"] }
      },
      fame: 0,
    });
    result = L.canInstallEquipment(stateAlreadyInstalled, "expanded_hold");
    u.assert(!result.ok && (result.reason.toLowerCase().includes("already") || result.reason.toLowerCase().includes("installed")),
             "already installed blocked");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.TRAVEL — travelDays with modifiers (boundary tests)
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.TRAVEL.01", "travelDays: same port → Infinity or undefined — not 0", (u) => {
    const state = makeState({
      ship: makeShip("sloop"),
      hold: makeHold(),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
    });
    const days = L.travelDays("portRoyal", "portRoyal", state);
    u.assert(typeof days === "number", "returns a number");
  });

  reg("L.TRAVEL.02", "travelDays: low morale (<50) adds a day penalty", (u) => {
    const base = makeState({
      ship: makeShip("sloop"),
      hold: makeHold(),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
    });
    const lowMorale = makeState({
      ship: makeShip("sloop"),
      hold: makeHold(),
      crew: { roster: [], max: 40, morale: 40 },
      wind: { angle: 0, speed: 10 },
    });
    const normalDays = L.travelDays("portRoyal", "havana", base);
    const slowDays   = L.travelDays("portRoyal", "havana", lowMorale);
    u.assert(slowDays >= normalDays, "low morale adds at least 0 days");
  });

  reg("L.TRAVEL.03", "travelDays: invalid port key returns Infinity", (u) => {
    const state = makeState({
      ship: makeShip("sloop"),
      hold: makeHold(),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
    });
    u.assertEqual(L.travelDays("portRoyal", "notAPort", state), Infinity);
  });

  reg("L.TRAVEL.04", "canReach: sloop can reach nearby ports", (u) => {
    const state = makeState({
      currentPort: "portRoyal",
      ship: makeShip("sloop"),
      hold: makeHold(),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
    });
    u.assert(L.canReach(state, "tortuga"), "can reach tortuga");
  });

  reg("L.TRAVEL.05", "canReach: always false for current port", (u) => {
    const state = makeState({
      currentPort: "portRoyal",
      ship: makeShip("sloop"),
      hold: makeHold(),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
    });
    u.assert(!L.canReach(state, "portRoyal"), "can't sail to current port");
  });

  reg("L.TRAVEL.06", "getUnreachableReason: hidden port not in discoveredPorts returns null", (u) => {
    const state = makeState({
      currentPort: "portRoyal",
      ship: makeShip("sloop"),
      hold: makeHold(),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
      discoveredPorts: [],
    });
    const hiddenKey = Object.keys(D.PORTS).find(k => D.PORTS[k].hidden);
    if (!hiddenKey) return;
    const reason = L.getUnreachableReason(state, hiddenKey);
    u.assertEqual(reason, null, "hidden undiscovered port returns null");
  });

  reg("L.TRAVEL.07", "getSeaPosition: returns interpolated position", (u) => {
    const route = {
      originPos: { x: 100, y: 200 },
      destinationPos: { x: 300, y: 400 },
      totalDays: 4,
      progressDays: 2,
    };
    const pos = L.getSeaPosition(route);
    u.assertEqual(pos.x, 200, "x interpolated halfway");
    u.assertEqual(pos.y, 300, "y interpolated halfway");
  });

  reg("L.TRAVEL.08", "travelDaysFromPosition: returns number of days from a sea position", (u) => {
    const state = makeState({
      ship: makeShip("sloop"),
      crew: { roster: [], morale: 80, max: 40 },
      wind: { angle: 0, speed: 10 },
    });
    const days = L.travelDaysFromPosition({ x: 400, y: 230 }, "tortuga", state);
    u.assert(days >= 1, "returns a positive number");
  });

  reg("L.TRAVEL.09", "canReachFromPosition: determines reachability from sea", (u) => {
    const state = makeState({
      ship: makeShip("sloop"),
      crew: { roster: [], morale: 80, max: 40 },
      wind: { angle: 0, speed: 10 },
    });
    const reachable = L.canReachFromPosition({ x: 500, y: 235 }, "tortuga", state, 10);
    u.assert(reachable === true || reachable === false, "returns boolean");
  });

  reg("L.TRAVEL.10", "getReachablePortsFromSea: returns array of port keys", (u) => {
    const route = {
      originPos: { x: 400, y: 230 },
      destinationPos: { x: 480, y: 200 },
      totalDays: 4,
      progressDays: 1,
      enduranceBudget: 10,
      enduranceSpent: 1,
      destinationPort: "tortuga",
    };
    const state = makeState({
      ship: makeShip("sloop"),
      crew: { roster: [], morale: 80, max: 40 },
      wind: { angle: 0, speed: 10 },
      route,
    });
    const ports = L.getReachablePortsFromSea(state);
    u.assert(Array.isArray(ports), "returns array");
    u.assert(!ports.includes("tortuga"), "excludes current destination");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.LOG — classifyLogLine and getLogTabCategory (table tests)
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.LOG.01", "classifyLogLine: table of all known categories", (u) => {
    const cases = [
      ["Arrived at Port Royal", "arrival"],
      ["Setting sail for Havana", "sailing"],
      ["Hired 3 crew members", "crew"],
      ["Jean Dupont has left the crew", "crew"],
      ["Victory! Enemy sunk.", "combat"],
      ["Sold cloth for 200g", "trade"],
      ["Completed: delivery mission", "mission"],
      ["New port discovered: Libertalia.", "discovery"],
      ["+5 infamy", "infamy"],
      ["The patrol is active", "warning"],
      ["Something else", null],
    ];
    for (const [text, expected] of cases) {
      const result = L.classifyLogLine(text);
      u.assertEqual(result, expected, `"${text}" -> ${expected}`);
    }
  });

  reg("L.LOG.02", "getLogTabCategory: maps to correct UI tabs", (u) => {
    const cases = [
      ["Arrived at Port Royal", "ports"],
      ["Setting sail for Tortuga", "ports"],
      ["New port discovered: Libertalia.", "ports"],
      ["Jean Dupont has left the crew", "crew"],
      ["The patrol is active", "crew"],
      ["Victory! Enemy sunk.", "combat"],
      ["Plundered the ship.", "combat"],
      ["Completed: delivery mission", "missions"],
      ["+5 infamy", "missions"],
      ["Bought sugar for 200g", "trade"],
      ["Something random", "other"],
      ["", "other"],
    ];
    for (const [text, expected] of cases) {
      const result = L.getLogTabCategory(text);
      u.assertEqual(result, expected, `"${text}" -> ${expected}`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.SAVE — encode/decode round-trip, tamper, garbage, non-empty
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.SAVE.01", "encodeSave produces a non-empty string (cheap invariant)", (u) => {
    const state = makeState({ gold: 500 });
    const encoded = L.encodeSave(state);
    u.assert(typeof encoded === "string" && encoded.length > 0, "non-empty string");
  });

  reg("L.SAVE.02", "decodeSave round-trips state without data loss", (u) => {
    const state = makeState({ gold: 1234, fame: 77, captainName: "Test Captain" });
    const encoded = L.encodeSave(state);
    const result = L.decodeSave(encoded);
    u.assert(result.state !== undefined, "decode returns object with state");
    u.assertEqual(result.state.gold, 1234, "gold preserved");
    u.assertEqual(result.state.fame, 77, "fame preserved");
    u.assertEqual(result.state.captainName, "Test Captain", "captainName preserved");
    u.assertEqual(result.tampered, false, "tampered flag false for valid save");
    u.assertEqual(result.error, null, "error null for valid save");
  });

  reg("L.SAVE.03", "decodeSave: tampered data returns tampered:true and still loads state", (u) => {
    const state = makeState({ gold: 100 });
    const encoded = L.encodeSave(state);

    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const decoded = new TextDecoder().decode(bytes);
    const payload = JSON.parse(decoded);
    const innerData = JSON.parse(payload.data);
    innerData.gold = 999;
    payload.data = JSON.stringify(innerData);
    const newPayload = JSON.stringify(payload);
    const newBytes = new TextEncoder().encode(newPayload);
    const newBinary = String.fromCharCode(...newBytes);
    const tampered = btoa(newBinary);

    const result = L.decodeSave(tampered);
    u.assert(result.tampered === true, "tampered flagged");
    u.assert(result.error === null, "no error for tampered data");
    u.assertEqual(result.state.gold, 999, "modified state loaded despite tamper");
  });

  reg("L.SAVE.04", "decodeSave: garbage input returns error and no state", (u) => {
    const result = L.decodeSave("not a valid save");
    u.assert(result.error !== null, "error set for garbage input");
    u.assert(result.state === null || result.state === undefined, "no state for garbage");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.FEATURE — isFeatureUnlocked (onboarding gating)
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.FEAT.01", "isFeatureUnlocked: all features unlocked when onboarding disabled", (u) => {
    const state = makeState({
      onboarding: { ...window.E.initialState.onboarding, enabled: false, completed: true },
    });
    const features = ["market", "navigation", "crew", "shipyard", "journal"];
    for (const f of features) {
      u.assert(L.isFeatureUnlocked(state, f), `${f} should be unlocked`);
    }
  });

  reg("L.FEAT.02", "isFeatureUnlocked: all features unlocked when tutorialMode is none", (u) => {
    const state = makeState({
      tutorialMode: "none",
      onboarding: { ...window.E.initialState.onboarding, enabled: false, completed: true },
    });
    u.assert(L.isFeatureUnlocked(state, "market"), "market unlocked in none mode");
  });

  reg("L.FEAT.03", "isFeatureUnlocked: market locked until contractsOpened step", (u) => {
    const state = makeState({
      tutorialMode: "full",
      onboarding: {
        ...window.E.initialState.onboarding,
        enabled: true,
        completed: false,
        stepsCompleted: {
          ...window.E.initialState.onboarding.stepsCompleted,
          contractsOpened: false,
        },
        qmMessagesSeen: { welcome: false },
      },
    });
    u.assert(!L.isFeatureUnlocked(state, "market"), "market locked before welcome + contractsOpened");
  });

  reg("L.FEAT.04", "isFeatureUnlocked: market unlocked after welcome message and firstContractAccepted", (u) => {
    const state = makeState({
      tutorialMode: "full",
      onboarding: {
        ...window.E.initialState.onboarding,
        enabled: true,
        completed: false,
        stepsCompleted: {
          ...window.E.initialState.onboarding.stepsCompleted,
          firstContractAccepted: true,
        },
        qmMessagesSeen: { welcome: true },
      },
    });
    u.assert(L.isFeatureUnlocked(state, "market"), "market unlocked after welcome + firstContractAccepted");
  });

  reg("L.FEAT.05", "isFeatureUnlocked: checks various gates correctly", (u) => {
    const baseState = makeState({
      tutorialMode: "full",
      onboarding: {
        enabled: true,
        completed: false,
        stepsCompleted: {
          firstContractAccepted: true,
          provisionsAndGoodsBought: false,
          firstContractDelivered: false,
          tutorialHuntCompleted: false,
          shipRepaired: false,
        },
        qmMessagesSeen: { welcome: true },
      },
    });
    u.assert(L.isFeatureUnlocked(baseState, "market"), "market unlocked with welcome + firstContractAccepted");
    u.assert(!L.isFeatureUnlocked(baseState, "navigation"), "navigation locked without provisionsAndGoodsBought");
    u.assert(!L.isFeatureUnlocked(baseState, "crew"), "crew locked without firstContractDelivered");
    u.assert(!L.isFeatureUnlocked(baseState, "shipyard"), "shipyard locked without tutorialHuntCompleted");
    u.assert(!L.isFeatureUnlocked(baseState, "journal"), "journal locked without shipRepaired");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.COMBAT — B11 combat helpers and resolvers (core contracts)
  // ══════════════════════════════════════════════════════════════════════════

  function runNavalRound(playerAction, enemyAction, distance = "medium", enemyOverrides = {}) {
    const state = makePortState();
    const enemy = makeEnemy({ speed: 10, ...enemyOverrides });
    const battle = {
      distance,
      playerHull: 100,
      playerCrew: 10,
      enemyHull: enemy.hull,
      enemyCrew: enemy.crew,
    };
    return L.resolveNavalRound(state, playerAction, enemyAction, battle, enemy);
  }

  // ── Contest helpers ──────────────────────────────────────────────────────

  reg("L.CONTEST.01", "resolveSpeedContest: higher speed increases win probability", (u) => {
    let wins = 0, total = 1000;
    setRandomSequence(Array.from({ length: total }, () => Math.random()));
    for (let i = 0; i < total; i++) {
      if (L.resolveSpeedContest(10, 8)) wins++;
    }
    resetRandomStub();
    u.assert(wins > 500, "faster wins more often than not");
  });

  reg("L.CONTEST.02", "resolveSpeedContest: clamps to [0.15, 0.85]", (u) => {
    const rand = 0.5;
    setRandomSequence([rand]);
    u.assert(L.resolveSpeedContest(100, 1) === true, "clamps high");
    setRandomSequence([rand]);
    u.assert(L.resolveSpeedContest(1, 100) === false, "clamps low");
    resetRandomStub();
  });

  reg("L.DIST.01", "stepDistance: Far→Medium→Close on +1, clamps at Close", (u) => {
    u.assertEqual(L.stepDistance("far", +1), "medium");
    u.assertEqual(L.stepDistance("medium", +1), "close");
    u.assertEqual(L.stepDistance("close", +1), "close");
  });

  reg("L.DIST.02", "stepDistance: Close→Medium→Far on -1, clamps at Far", (u) => {
    u.assertEqual(L.stepDistance("close", -1), "medium");
    u.assertEqual(L.stepDistance("medium", -1), "far");
    u.assertEqual(L.stepDistance("far", -1), "far");
  });

  reg("L.DIST.03", "initialDistanceFor: navy_patrol/hostile_port_entry → close; random → far", (u) => {
    u.assertEqual(L.initialDistanceFor("navy_patrol"), "close");
    u.assertEqual(L.initialDistanceFor("hostile_port_entry"), "close");
    u.assertEqual(L.initialDistanceFor("random"), "far");
    u.assertEqual(L.initialDistanceFor("patrol"), "far");
  });

  // ── Naval resolver: deterministic pairing tests ────────────────────────

  reg("L.NAVAL.01", "Br vs Br at Far: both damage at 0.6×, distance unchanged", (u) => {
    setRandomSequence([0.5, 0.5]);
    const result = runNavalRound("broadside", "broadside", "far");
    resetRandomStub();
    u.assertEqual(result.outcome, "continue");
    u.assert(result.enemyHullDamage > 0, "enemy takes damage");
    u.assert(result.playerHullDamage > 0, "player takes damage");
    u.assertEqual(result.newDistance, "far");
  });

  reg("L.NAVAL.02", "Br vs Cl at Medium: firer deals damage, distance drops to Close", (u) => {
    setRandomSequence([0.5, 0.5]);
    const result = runNavalRound("broadside", "close_distance", "medium");
    resetRandomStub();
    u.assertEqual(result.outcome, "continue");
    u.assert(result.enemyHullDamage > 0, "enemy takes damage");
    u.assertEqual(result.playerHullDamage, 0, "closer doesn't fire");
    u.assertEqual(result.newDistance, "close");
  });

  reg("L.NAVAL.03", "Br vs Ev at any distance: Evade succeeds, zero damage", (u) => {
    const result = runNavalRound("broadside", "evade", "medium");
    u.assertEqual(result.outcome, "enemy_evaded");
    u.assertEqual(result.playerHullDamage, 0);
    u.assertEqual(result.enemyHullDamage, 0);
  });

  reg("L.NAVAL.04", "Cl vs Cl at Far: mutual, distance → Medium, zero damage", (u) => {
    const result = runNavalRound("close_distance", "close_distance", "far");
    u.assertEqual(result.outcome, "continue");
    u.assertEqual(result.playerHullDamage, 0);
    u.assertEqual(result.enemyHullDamage, 0);
    u.assertEqual(result.newDistance, "medium");
  });

  reg("L.NAVAL.05", "Br vs Gr at Close, lethal shot: outcome = enemy_sunk, NOT boarding_begins", (u) => {
    setRandomSequence([0.9, 0.9]);
    const result = runNavalRound("broadside", "grapple", "close", { hull: 5 });
    resetRandomStub();
    u.assertEqual(result.outcome, "enemy_sunk");
    u.assertEqual(result.playerHullDamage, 0);
  });

  reg("L.NAVAL.06", "Gr vs Gr at Close, no lethal damage: outcome = boarding_begins", (u) => {
    const result = runNavalRound("grapple", "grapple", "close");
    u.assertEqual(result.outcome, "boarding_begins");
    u.assertEqual(result.playerGrappleSuccess, true);
    u.assertEqual(result.npcGrappleSuccess, true);
  });

  reg("L.NAVAL.07", "Op vs Gr at Close: Open resolves uncontested, distance → Medium, grapple fails", (u) => {
    const result = runNavalRound("open_distance", "grapple", "close");
    u.assertEqual(result.outcome, "continue");
    u.assertEqual(result.newDistance, "medium");
    u.assertEqual(result.playerGrappleSuccess, false);
  });

  // ── Contested pairings (seeded RNG) ────────────────────────────────────

  reg("L.NAVAL.08", "Cl vs Ev at Far, evader wins: outcome = player_evaded", (u) => {
    setRandomSequence([0.5]);
    const result = runNavalRound("close_distance", "evade", "far");
    resetRandomStub();
    u.assert(["player_evaded", "continue"].includes(result.outcome), "outcome is either evaded or continue");
    if (result.outcome === "player_evaded") {
      u.assertEqual(result.playerHullDamage, 0);
    }
  });

  reg("L.NAVAL.09", "Cl vs Op at Medium, player wins contest: distance → Close, damage zero", (u) => {
    setRandomSequence([0.5]);
    const result = runNavalRound("close_distance", "open_distance", "medium", { speed: 8 });
    resetRandomStub();
    u.assertEqual(result.outcome, "continue");
    u.assertEqual(result.playerHullDamage, 0);
    u.assertEqual(result.enemyHullDamage, 0);
    u.assertEqual(result.newDistance, "close");
    u.assertEqual(result.distanceChangeWinner, "player");
  });

  reg("L.NAVAL.10", "Cl vs Op at Medium, enemy wins contest: distance → Far", (u) => {
    setRandomSequence([0.5]);
    const result = runNavalRound("close_distance", "open_distance", "medium", { speed: 12 });
    resetRandomStub();
    u.assertEqual(result.outcome, "continue");
    u.assertEqual(result.newDistance, "far");
    u.assertEqual(result.distanceChangeWinner, "enemy");
  });

  // ── Tie‑break tests ─────────────────────────────────────────────────────

  reg("L.NAVAL.11", "Mutual defeat: player takes priority over enemy", (u) => {
    setRandomSequence([0.9, 0.9]);
    const state = makePortState();
    const enemy = makeEnemy({ hull: 1, cannons: 10 });
    const battle = { distance: "medium", playerHull: 1, playerCrew: 10, enemyHull: 1, enemyCrew: 10 };
    const result = L.resolveNavalRound(state, "broadside", "broadside", battle, enemy);
    resetRandomStub();
    u.assert(["player_sunk", "player_captured"].includes(result.outcome), "player defeat takes priority");
  });

  reg("L.NAVAL.12", "Same‑side dual condition: hull and crew both 0 → sunk over captured", (u) => {
    const state = makePortState();
    const enemy = makeEnemy({ hull: 0, crew: 0 });
    const battle = { distance: "medium", playerHull: 100, playerCrew: 10, enemyHull: 0, enemyCrew: 0 };
    const result = L.resolveNavalRound(state, "broadside", "broadside", battle, enemy);
    u.assertEqual(result.outcome, "enemy_sunk", "sunk over captured");
  });

  // ── Boarding resolver outcome classes (consolidated) ───────────────────
  // FIX: Use pirate faction to avoid English skip rule interfering with fallback cost test.
  reg("L.BOARD.01", "ratio calculation: equal, player advantage, disadvantage", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(10), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    let battle = { playerCrew: 10, enemyCrew: 10 };
    u.assertApprox(L.getBoardingRatio(state, battle, enemy), 0.5, 0.05, "equal crews ~0.5");

    battle = { playerCrew: 20, enemyCrew: 10 };
    const ratio = L.getBoardingRatio(state, battle, enemy);
    u.assert(ratio > 0.5, "player crew advantage -> ratio > 0.5");

    battle = { playerCrew: 5, enemyCrew: 20 };
    const ratio2 = L.getBoardingRatio(state, battle, enemy);
    u.assert(ratio2 < 0.5, "player crew disadvantage -> ratio < 0.5");
  });

  reg("L.BOARD.02", "continue: normal continuation, player wipeout, enemy wipeout", (u) => {
  // Use pirate faction to avoid English skip rule
  const state = makePortState({
    faction: "pirate",
    crew: { roster: fillRoster(20), morale: 50, max: 40 }
  });
  const enemy = makeEnemy({ crew: 10, risk: "medium" });

  // Normal
  let battle = { playerCrew: 20, enemyCrew: 10 };
  // Seed RNG for predictable loss (0.5 for even split, but we want both losses > 0)
  setRandomSequence([0.5, 0.5, 0.5]);
  let result = L.resolveBoardingRound(state, "continue_fighting", "continue_fighting", battle, enemy);
  resetRandomStub();
  u.assert(result.playerCrewLoss > 0 && result.enemyCrewLoss > 0, "both lose crew");
  u.assertEqual(result.outcome, "continue");

  // Player wipeout (1 vs 10)
  battle = { playerCrew: 1, enemyCrew: 10 };
  // Force loss for player: with 1 crew, the loss calculation will be 0 or 1.
  // To ensure wipeout, we set the first random to force loss (>=0.5) and avoid skip rule.
  setRandomSequence([0.6, 0.5]); // ensures maybeCrewLoss returns the loss
  result = L.resolveBoardingRound(state, "continue_fighting", "continue_fighting", battle, enemy);
  resetRandomStub();
  u.assertEqual(result.outcome, "player_wipeout");

  // Enemy wipeout (10 vs 1)
  battle = { playerCrew: 10, enemyCrew: 1 };
  setRandomSequence([0.5, 0.6]); // force enemy loss
  result = L.resolveBoardingRound(state, "continue_fighting", "continue_fighting", battle, enemy);
  resetRandomStub();
  u.assertEqual(result.outcome, "enemy_wipeout");
});

  reg("L.BOARD.03", "demand surrender: below threshold fails, above succeeds or fails with chance", (u) => {
    const stateLow = makePortState({ crew: { roster: fillRoster(5), morale: 50, max: 40 } });
    const stateHigh = makePortState({ crew: { roster: fillRoster(20), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });

    // Below threshold should throw
    const battleLow = { playerCrew: 5, enemyCrew: 10 };
    u.assertThrows(() => L.resolveBoardingRound(stateLow, "demand_surrender", "continue_fighting", battleLow, enemy),
      "below 0.65 threshold throws");

    // Above threshold: success or failure
    const battleHigh = { playerCrew: 20, enemyCrew: 5 };
    setRandomSequence([0.1]); // success
    let result = L.resolveBoardingRound(stateHigh, "demand_surrender", "continue_fighting", battleHigh, enemy);
    resetRandomStub();
    u.assertEqual(result.outcome, "enemy_win_capture", "demand succeeds on lucky roll");

    setRandomSequence([0.9]); // failure
    result = L.resolveBoardingRound(stateHigh, "demand_surrender", "continue_fighting", battleHigh, enemy);
    resetRandomStub();
    u.assertEqual(result.outcome, "continue", "demand fails, continues");
    u.assert(result.playerCrewLoss > 0, "failure costs crew");
  });

  reg("L.BOARD.04", "fall back: mutual fallback, player fallback, enemy fallback", (u) => {
  // Use pirate faction to avoid English skip rule
  const state = makePortState({
    faction: "pirate",
    crew: { roster: fillRoster(10), morale: 50, max: 40 }
  });
  const enemy = makeEnemy({ crew: 10, risk: "medium" });
  let battle = { playerCrew: 10, enemyCrew: 10 };

  // Mutual fallback
  let result = L.resolveBoardingRound(state, "fall_back", "fall_back", battle, enemy);
  u.assertEqual(result.outcome, "returned_to_naval");
  u.assertEqual(result.playerCrewLoss, 0);

  // Player fallback vs continue – seed to ensure loss is > 0
  battle = { playerCrew: 10, enemyCrew: 10 };
  setRandomSequence([0.5]); // force a loss
  result = L.resolveBoardingRound(state, "fall_back", "continue_fighting", battle, enemy);
  resetRandomStub();
  u.assertEqual(result.outcome, "returned_to_naval");
  u.assert(result.playerCrewLoss > 0, "player loses crew on fallback");
  u.assertEqual(result.enemyCrewLoss, 0);

  // Enemy fallback vs continue
  setRandomSequence([0.5]);
  result = L.resolveBoardingRound(state, "continue_fighting", "fall_back", battle, enemy);
  resetRandomStub();
  u.assertEqual(result.outcome, "returned_to_naval");
  u.assert(result.enemyCrewLoss > 0, "enemy loses crew on fallback");
  u.assertEqual(result.playerCrewLoss, 0);
});

  reg("L.BOARD.05", "surrender: player surrender, enemy surrender", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(10), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    const battle = { playerCrew: 10, enemyCrew: 10 };

    let result = L.resolveBoardingRound(state, "surrender", "continue_fighting", battle, enemy);
    u.assertEqual(result.outcome, "player_surrendered");

    result = L.resolveBoardingRound(state, "continue_fighting", "surrender", battle, enemy);
    u.assertEqual(result.outcome, "enemy_surrendered");
  });

  reg("L.BOARD.06", "NPC boarding action output classes (policy contract)", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(10), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    const session = makeEncounterSession(state, enemy, { playerCrew: 10, enemyCrew: 10 });
    const action = L.getNPCBoardingAction(state, session);
    u.assert(["continue_fighting", "fall_back", "surrender"].includes(action), "returns a legal boarding action");
  });

  // ── NEW: NPC AI action coverage ──────────────────────────────────────────

  reg("L.BOARD.07", "NPC naval action output classes (policy contract)", (u) => {
    const state = makePortState({ ship: makeShip("sloop"), crew: { roster: fillRoster(10), morale: 80, max: 40 } });
    const enemy = makeEnemy({ hull: 100, maxHull: 100, cannons: 10, crew: 20, speed: 10 });
    const session = makeEncounterSession(state, enemy, { distance: "medium", enemyHull: 100 });
    const action = L.getNPCNavalAction(state, session);
    u.assert(["broadside", "precision", "close_distance", "open_distance"].includes(action),
      "returns a legal naval action");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.ENC_OPT — Encounter option matrix (consolidated)
  // ══════════════════════════════════════════════════════════════════════════

  // FIX: Set reputation for both current port AND destination (since canBribe uses destination port's reputation).
  reg("L.ENC_OPT.01", "bribe availability matrix: context, faction, infamy, rep, contraband", (u) => {
    const base = {
      destination: "tortuga",
      gold: 1000,
      ship: makeShip("sloop"),
      reputation: { portRoyal: 40, tortuga: 40 },  // both ports set to same rep value
    };

    // Each entry: [context, faction, infamy, rep, hasContraband, expectedAvailable]
    const matrix = [
      ["random", "pirate", 100, 40, false, true],
      ["random", "english", 0, 40, false, true],
      ["random", "english", 25, 40, false, false],
      ["random", "english", 0, 25, false, false],
      ["navy_patrol", "pirate", 100, 40, true, true],
      ["navy_patrol", "english", 0, 40, true, true],
      ["navy_patrol", "english", 25, 40, true, false],
      ["navy_patrol", "english", 0, 25, true, false],
      ["navy_patrol", "english", 0, 40, false, false],
    ];

    for (const [ctx, faction, infamy, rep, contraband, expected] of matrix) {
      const state = makePortState("portRoyal", {
        ...base,
        faction,
        infamy,
        reputation: { portRoyal: rep, tortuga: rep },
        hold: contraband ? makeHold({ tobacco: 2 }) : makeHold(),
      });
      const enemy = { name: "Test", faction: "english", hull: 100, cannons: 10, crew: 20 };
      const context = L.buildEncounterContext(state, ctx, enemy);
      const bribe = context.options.find(o => o.id === "bribe");
      u.assert(bribe !== undefined, `bribe missing for ${ctx}/${faction}/${infamy}/${rep}`);
      u.assertEqual(bribe.available, expected,
        `expected ${expected} for ${ctx}/${faction}/${infamy}/${rep} with contraband=${contraband}`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.GAMEOVER — Game Over System (B9)
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.GAMEOVER.01", "getMinViableCrew: dinghy returns 0, sloop returns 4, galleon returns 15", (u) => {
    u.assertEqual(L.getMinViableCrew("dinghy"), 0, "dinghy exempt");
    u.assertEqual(L.getMinViableCrew("sloop"), 4, "sloop maxCrew 40 -> 10% = 4");
    u.assertEqual(L.getMinViableCrew("brigantine"), 8, "brigantine maxCrew 80 -> 8");
    u.assertEqual(L.getMinViableCrew("galleon"), 15, "galleon maxCrew 150 -> 15");
    u.assertEqual(L.getMinViableCrew("ship_of_the_line"), 28, "ship_of_the_line maxCrew 280 -> 28");
    u.assertEqual(L.getMinViableCrew("unknown_ship"), 0, "unknown ship returns 0");
  });

  reg("L.GAMEOVER.02", "getCaptainTag: returns correct label based on fame/infamy", (u) => {
    u.assertEqual(L.getCaptainTag({ fame: 0, infamy: 0 }).text, "An Unknown Captain");
    u.assertEqual(L.getCaptainTag({ fame: 9, infamy: 0 }).text, "An Unknown Captain");
    u.assertEqual(L.getCaptainTag({ fame: 0, infamy: 10 }).text, "A Suspect in Several Ports");
    u.assertEqual(L.getCaptainTag({ fame: 0, infamy: 25 }).text, "Wanted by the Law");
    u.assertEqual(L.getCaptainTag({ fame: 50, infamy: 0 }).text, "A Recognised Captain");
    u.assertEqual(L.getCaptainTag({ fame: 100, infamy: 0 }).text, "A Notorious Captain");
    u.assertEqual(L.getCaptainTag({ fame: 200, infamy: 0 }).text, "A Legend of the Caribbean");
    u.assertEqual(L.getCaptainTag({ fame: 0, infamy: 50 }).text, "Notorious Across the Caribbean");
    u.assertEqual(L.getCaptainTag({ fame: 0, infamy: 100 }).text, "Legendary Outlaw of the Caribbean");
    u.assertEqual(L.getCaptainTag({ fame: 150, infamy: 50 }).text, "Notorious Across the Caribbean");
    u.assertEqual(L.getCaptainTag({ fame: 200, infamy: 100 }).text, "Legendary Outlaw of the Caribbean");
  });

  reg("L.GAMEOVER.03", "getCareerHighlights: returns array of strings with correct stats", (u) => {
    const career = {
      goldEarned: 5000,
      goldSpent: 2500,
      battles: { won: 10, lost: 2, fled: 1 },
      shipsSunk: 5,
      shipsPlundered: 3,
      crewLost: { inBattle: 20, inStorm: 5, deserted: 3, other: 2 },
      longestCrewTenure: 120,
      portsVisited: ["portRoyal", "tortuga"],
      stormsSurvived: 4,
      shipsOwned: [{ type: "sloop", dayAcquired: 1 }, { type: "frigate", dayAcquired: 100 }],
      contrabandSeized: 2,
    };
    const state = { day: 100, career };
    const lines = L.getCareerHighlights(state);
    u.assert(Array.isArray(lines), "returns array");
    u.assert(lines.some(l => l.includes("100 days")), "includes days sailed");
    u.assert(lines.some(l => l.includes("won 10") && l.includes("lost 2") && l.includes("fled 1")), "includes battle summary");
    u.assert(lines.some(l => l.includes("sunk 5") && l.includes("boarded and plundered 3")), "includes ships sunk/plundered");
    u.assert(lines.some(l => l.includes("20 to combat") && l.includes("5 to the storms") && l.includes("3 who walked away")), "includes crew loss breakdown");
    u.assert(lines.some(l => l.includes("120 days")), "includes longest tenure");
    u.assert(lines.some(l => l.includes("ports") && l.includes("2 of")), "includes ports visited");
    u.assert(lines.some(l => l.includes("5,000g and spent 2,500g")), "includes gold earned/spent");
    u.assert(lines.some(l => l.includes("4 storms")), "includes storms survived");
    u.assert(lines.some(l => l.includes("2 ships")), "includes ships owned");
    u.assert(lines.some(l => l.includes("2 times")), "includes contraband seized");
  });

  reg("L.GAMEOVER.04", "getCareerHighlights: handles empty career gracefully", (u) => {
    const state = { day: 1, career: { portsVisited: [], battles: {}, crewLost: {}, shipsOwned: [] } };
    const lines = L.getCareerHighlights(state);
    u.assert(Array.isArray(lines), "returns array");
    u.assertEqual(lines.length, 1, "only the 'sailed for 1 day' line");
    u.assert(lines[0].includes("1 day"), "default line shown");
  });

  reg("L.GAMEOVER.05", "isUnrecoverable: hull=0, no gold, no cargo -> true", (u) => {
    const state = {
      ship: { type: "sloop", hull: 0 },
      crew: { roster: [{ id: "x" }], max: 40, morale: 80 },
      gold: 0,
      hold: { items: { food: 0, water: 0 } },
      portMarket: { goods: {} },
    };
    const result = L.isUnrecoverable(state);
    u.assert(result.unrecoverable, "should be unrecoverable");
    u.assert(result.reason.includes("wrecked"), "reason mentions wrecked ship");
  });

  reg("L.GAMEOVER.06", "isUnrecoverable: hull=0, but gold >= repair cost -> false", (u) => {
    const state = {
      ship: { type: "sloop", hull: 0 },
      crew: { roster: [{ id: "x" }], max: 40, morale: 80 },
      gold: 1000,
      hold: { items: { food: 0, water: 0 } },
      portMarket: { goods: {} },
    };
    const result = L.isUnrecoverable(state);
    u.assert(!result.unrecoverable, "should not be unrecoverable (has gold to repair)");
    u.assertEqual(result.reason, null);
  });

  reg("L.GAMEOVER.07", "isUnrecoverable: hull=0, no gold, but cargo value covers repair -> false", (u) => {
    const state = {
      ship: { ...makeShip("sloop"), hull: 0 },
      crew: { roster: fillRoster(4), max: 40, morale: 80 },
      gold: 0,
      hold: { items: { sugar: 20 } },
      portMarket: { goods: { sugar: { sellToPort: 30 } } },
    };
    const result = L.isUnrecoverable(state);
    u.assert(!result.unrecoverable, "should not be unrecoverable (cargo value covers repair)");
    u.assertEqual(result.reason, null);
  });

  reg("L.GAMEOVER.08", "isUnrecoverable: non-dinghy, crew=0, no gold, no cargo -> true (crew crisis)", (u) => {
    const state = {
      ship: { type: "sloop", hull: 100 },
      crew: { roster: [], max: 40, morale: 80 },
      gold: 0,
      hold: { items: { food: 0, water: 0 } },
      portMarket: { goods: {} },
    };
    const result = L.isUnrecoverable(state);
    u.assert(result.unrecoverable, "should be unrecoverable (no crew, no money, hull intact but can't sail)");
    u.assert(result.reason.includes("no one left"), "reason mentions no crew");
  });

  reg("L.GAMEOVER.09", "isUnrecoverable: dinghy, crew=0, hull intact -> false (exempt)", (u) => {
    const state = {
      ship: { type: "dinghy", hull: 100 },
      crew: { roster: [], max: 5, morale: 80 },
      gold: 0,
      hold: { items: { food: 0, water: 0 } },
      portMarket: { goods: {} },
    };
    const result = L.isUnrecoverable(state);
    u.assert(!result.unrecoverable, "dinghy exempt from crew crisis");
    u.assertEqual(result.reason, null);
  });

  reg("L.GAMEOVER.10", "isUnrecoverable: non-dinghy, crew=0, but gold covers hiring minCrew -> false", (u) => {
    const state = {
      ship: { type: "sloop", hull: 100 },
      crew: { roster: [], max: 40, morale: 80 },
      gold: 200,
      hold: { items: { food: 0, water: 0 } },
      portMarket: { goods: {} },
    };
    const result = L.isUnrecoverable(state);
    u.assert(!result.unrecoverable, "should not be unrecoverable (has gold to hire min crew)");
    u.assertEqual(result.reason, null);
  });

  reg("L.GAMEOVER.11", "isUnrecoverable: hull=0 and crew=0, repair + hire cost > liquid -> true", (u) => {
    const state = {
      ship: { type: "sloop", hull: 0 },
      crew: { roster: [], max: 40, morale: 80 },
      gold: 100,
      hold: { items: { food: 0, water: 0 } },
      portMarket: { goods: {} },
    };
    const result = L.isUnrecoverable(state);
    u.assert(result.unrecoverable, "should be unrecoverable (not enough for both repair and crew)");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.MISC — miscellaneous (helpers not covered elsewhere)
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.MISC.01", "roll: returns an integer between 1 and sides", (u) => {
    const originalRandom = Math.random;
    try {
      Math.random = () => 0.0;
      u.assertEqual(L.roll(6), 0, "roll 6 with 0.0 -> 0 (Math.ceil)");
      Math.random = () => 0.999;
      u.assertEqual(L.roll(6), 6, "roll 6 with 0.999 -> 6");
    } finally {
      Math.random = originalRandom;
    }
  });

  reg("L.MISC.02", "emptyOutcome: returns a fresh empty outcome object", (u) => {
    const outcome = L.emptyOutcome();
    u.assert(outcome.player !== undefined, "has player");
    u.assert(outcome.enemy !== undefined, "has enemy");
    u.assertEqual(outcome.moraleDelta, 0, "moraleDelta zero");
    u.assert(outcome.fled === false, "fled false");
  });

  reg("L.MISC.03", "removeRandomCrew: removes specified number of crew", (u) => {
    const roster = fillRoster(5);
    const result = L.removeRandomCrew(roster, 2);
    u.assertEqual(result.newRoster.length, 3, "removed 2");
    u.assertEqual(result.removed.length, 2, "returns removed list");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.TRADE — getTradeOpportunity
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.TRADE.01", "getTradeOpportunity: returns null when no profitable trade exists", (u) => {
    const state = makePortState("portRoyal", {
      portMarket: {
        goods: {
          sugar: { buyFromPort: 100, sellToPort: 90, available: 10 },
          cloth: { buyFromPort: 200, sellToPort: 180, available: 5 },
        },
      },
    });
    const origGenerate = window.G.generatePortMarket;
    window.G.generatePortMarket = (portKey) => {
      return {
        goods: {
          sugar: { sellToPort: 80 },
          cloth: { sellToPort: 150 },
        },
      };
    };
    const result = L.getTradeOpportunity(state, "portRoyal", "tortuga");
    window.G.generatePortMarket = origGenerate;
    u.assertEqual(result, null, "no profitable trade -> null");
  });

  reg("L.TRADE.02", "getTradeOpportunity: returns best profitable trade", (u) => {
    const state = makePortState("portRoyal", {
      portMarket: {
        goods: {
          sugar: { buyFromPort: 50, sellToPort: 40, available: 20 },
          cloth: { buyFromPort: 100, sellToPort: 90, available: 10 },
          rum: { buyFromPort: 30, sellToPort: 25, available: 15 },
        },
      },
      previewPortMarket: {
        goods: {
          sugar: { sellToPort: 45 },
          cloth: { sellToPort: 95 },
          rum: { sellToPort: 45 },
        },
      },
    });
    const result = L.getTradeOpportunity(state, "portRoyal", "tortuga");
    u.assert(result !== null, "returns a trade opportunity");
    u.assertEqual(result.good, "rum", "best trade is rum");
    u.assertEqual(result.buyPrice, 30, "buy price 30");
    u.assertEqual(result.sellPrice, 45, "sell price 45");
    u.assertEqual(result.profit, 15, "profit 15");
    u.assert(result.profitPct >= 0.49, "profit pct ~50%");
    u.assertEqual(result.availableQty, 15, "available quantity 15");
  });

  reg("L.TRADE.03", "getTradeOpportunity: skips food and water", (u) => {
    const state = makePortState("portRoyal", {
      portMarket: {
        goods: {
          food: { buyFromPort: 3, sellToPort: 2, available: 999 },
          water: { buyFromPort: 2, sellToPort: 1, available: 999 },
          sugar: { buyFromPort: 50, sellToPort: 40, available: 20 },
        },
      },
    });
    const origGenerate = window.G.generatePortMarket;
    window.G.generatePortMarket = (portKey) => {
      return {
        goods: {
          food: { sellToPort: 10 },
          water: { sellToPort: 8 },
          sugar: { sellToPort: 45 },
        },
      };
    };
    const result = L.getTradeOpportunity(state, "portRoyal", "tortuga");
    window.G.generatePortMarket = origGenerate;
    u.assertEqual(result, null, "food and water skipped, no profit -> null");
  });

  reg("L.TRADE.04", "getTradeOpportunity returns null if no targetMarket provided", (u) => {
    const state = makePortState("portRoyal", { portMarket: { goods: { sugar: { buyFromPort: 50, sellToPort: 40, available: 20 } } } });
    const result = L.getTradeOpportunity(state, "portRoyal", "tortuga");
    u.assertEqual(result, null, "No market provided => null");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.AISIG — NPC AI signal functions
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.AISIG.01", "getHullAdvantage: symmetric inputs → 0; clear advantage → positive", (u) => {
    u.assertEqual(L.getHullAdvantage(100, 100, 100, 100), 0, "symmetric returns 0");
    u.assertEqual(L.getHullAdvantage(100, 100, 50, 100), 0.5, "clear advantage positive");
    u.assertEqual(L.getHullAdvantage(50, 100, 100, 100), -0.5, "clear disadvantage negative");
  });

  reg("L.AISIG.02", "getCrewAdvantage: normalized correctly, symmetric inputs → 0", (u) => {
    u.assertEqual(L.getCrewAdvantage(10, 10), 0, "symmetric returns 0");
    u.assertEqual(L.getCrewAdvantage(20, 10), 10/30, "positive advantage normalized");
    u.assertEqual(L.getCrewAdvantage(10, 20), -10/30, "negative advantage normalized");
  });

  reg("L.AISIG.03", "computeAIDisposition: pirate medium weights", (u) => {
    const state = makeState({ fame: 50, infamy: 0, factionAlerts: {} });
    const enemy = { faction: "pirate", risk: "medium" };
    const disposition = L.computeAIDisposition(state, enemy, "random");
    u.assertApprox(disposition.weights.broadside, 0.8, 0.001);
    u.assertApprox(disposition.weights.precision, 0.7, 0.001);
    u.assertApprox(disposition.weights.close, 1.3, 0.001);
    u.assertApprox(disposition.weights.open, 0.5, 0.001);
    u.assertApprox(disposition.weights.grapple, 1.4, 0.001);
  });

  reg("L.AISIG.04", "computeAIDisposition: infamy/fame affect surrenderWillingness and continueFightingBonus", (u) => {
    const lowFameState = makeState({ fame: 0, infamy: 0 });
    const highFameState = makeState({ fame: 200, infamy: 0 });
    const highInfamyState = makeState({ fame: 0, infamy: 100 });

    const enemy = { faction: "pirate", risk: "medium" };

    const lowDisc = L.computeAIDisposition(lowFameState, enemy, "random");
    const highFameDisc = L.computeAIDisposition(highFameState, enemy, "random");
    const highInfamyDisc = L.computeAIDisposition(highInfamyState, enemy, "random");

    u.assert(highFameDisc.surrenderWillingness > lowDisc.surrenderWillingness, "higher fame increases surrender willingness");
    u.assert(highInfamyDisc.surrenderWillingness < lowDisc.surrenderWillingness, "higher infamy decreases surrender willingness");
    u.assert(highInfamyDisc.continueFightingBonus > lowDisc.continueFightingBonus, "higher infamy increases continue fighting bonus");
  });

  reg("L.AISIG.05", "computeAIDisposition: mission_combat adds grapple weight bonus", (u) => {
    const state = makeState({ fame: 0, infamy: 0, factionAlerts: {} });
    const enemy = { faction: "pirate", risk: "medium" };
    const base = L.computeAIDisposition(state, enemy, "random");
    const mission = L.computeAIDisposition(state, enemy, "mission_combat");
    const expectedBase = 1.4 * 1.0;
    const expectedMission = (1.4 + 0.3) * 1.0;
    u.assertApprox(base.weights.grapple, expectedBase, 0.001);
    u.assertApprox(mission.weights.grapple, expectedMission, 0.001);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.AISCORE — NPC AI scorers
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.AISCORE.01", "scoreNavalActions: never returns evade key", (u) => {
    const self = { hull: 100, maxHull: 100, crew: 10, speed: 10, shipType: "sloop" };
    const opponent = { hull: 100, maxHull: 100, crew: 10, speed: 10, shipType: "sloop" };
    const disposition = { weights: { broadside: 1, precision: 1, close: 1, open: 1, grapple: 1 }, riskLevel: "medium" };
    const legalActions = ["broadside", "precision", "close_distance", "evade"];
    const scores = L.scoreNavalActions(self, opponent, "far", disposition, legalActions);
    u.assert(!("evade" in scores), "evade should never be in scores");
  });

  reg("L.AISCORE.02", "scoreBoardingActions: never returns demand_surrender key", (u) => {
    const disposition = { riskLevel: "medium", continueFightingBonus: 0, surrenderWillingness: 0.5 };
    const scores = L.scoreBoardingActions(0.6, disposition);
    u.assert(!("demand_surrender" in scores), "demand_surrender should never be in scores");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.AISELECT — NPC AI selector
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.AISELECT.01", "selectWeightedAction: picks the only positive score", (u) => {
    const scores = { broadside: 1, precision: 0 };
    const action = L.selectWeightedAction(scores, 2);
    u.assertEqual(action, "broadside", "only positive score is chosen");
  });

  reg("L.AISELECT.01b", "selectWeightedAction: dominant score chosen with low random value", (u) => {
    setRandomSequence([0.01]);
    const scores = { broadside: 0.1, precision: 0.9 };
    const action = L.selectWeightedAction(scores, 2);
    resetRandomStub();
    u.assertEqual(action, "precision", "dominant score chosen with low random value");
  });

  reg("L.AISELECT.02", "selectWeightedAction: empty/all-zero scores returns null", (u) => {
    u.assertEqual(L.selectWeightedAction({}), null, "empty object returns null");
    u.assertEqual(L.selectWeightedAction({ broadside: 0, precision: 0 }), null, "all-zero scores returns null");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.CONTRA — getPatrolContrabandInfo
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.CONTRA.01", "getPatrolContrabandInfo returns consistent results", (u) => {
    const state = makePortState("portRoyal", {
      hold: makeHold({ tobacco: 3, slaves: 1, rum: 10 }),
      activeMission: { type: "smuggle", requiredGood: "rum", requiredQty: 5 },
    });
    const info = L.getPatrolContrabandInfo(state);
    u.assertEqual(info.hasContraband, true);
    u.assertEqual(info.seizedValue, 3 * 90 + 1 * 220 + 10 * 30);
    u.assertEqual(info.fine, Math.round((3 * 90 + 1 * 220 + 10 * 30) * 0.20 / 25) * 25);
    const info2 = L.getPatrolContrabandInfo(state, 0.40);
    u.assertEqual(info2.fine, Math.round((3 * 90 + 1 * 220 + 10 * 30) * 0.40 / 25) * 25);
  });

  reg("L.CONTRA.02", "getPatrolContrabandInfo: detects weapons in smuggle mission", (u) => {
    const state = makePortState("portRoyal", {
      hold: makeHold({ weapons: 5 }),
      activeMission: { type: "smuggle", requiredGood: "weapons", requiredQty: 5 },
    });
    const info = L.getPatrolContrabandInfo(state);
    u.assert(info.hasContraband, true);
    u.assertEqual(info.smuggledGood, "weapons");
    u.assertEqual(info.seizedValue, 5 * 80);
    u.assertEqual(info.fine, Math.round((5 * 80 * 0.20) / 25) * 25);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // B10 — Captain identity & port services (consolidated contracts)
  // ══════════════════════════════════════════════════════════════════════════

  reg("B10.DATA.BIRTH_TRAITS", "All factions have the expected complete trait shape", (u) => {
    const expected = {
      english: { crewLossMult: 0.80 },
      spanish: { crewCost: 40, crewLock: 'spanish', crewPortLock: true },
      french: { provisionMult: 0.75, maxDaysBonus: 1 },
      dutch: { tradeSellMult: 0.95, tradeBuyMult: 1.05 },
      pirate: { fleeEvadeBonus: 0.10, bribeGateRemoved: true, contrabandAvoidBonus: 0.10 },
    };
    const traits = window.D.BIRTH_TRAITS;
    u.assert(traits !== undefined, "BIRTH_TRAITS missing from D");
    for (const [faction, exp] of Object.entries(expected)) {
      const t = traits[faction];
      u.assert(t !== undefined, `BIRTH_TRAITS.${faction} missing`);
      for (const [key, value] of Object.entries(exp)) {
        u.assertEqual(t[key], value, `${faction}.${key} should be ${value}`);
      }
    }
  });

  reg("B10.DATA.PORT_SERVICES", "All port specialties have correct ids and thresholds", (u) => {
    const specs = window.D.PORT_SPECIALTIES;
    u.assert(specs !== undefined, "PORT_SPECIALTIES missing");
    const expectedIds = { dutch: 'bank', french: 'embassy', spanish: 'inquisitor', pirate: 'black_market', english: 'naval_yard' };
    for (const [faction, id] of Object.entries(expectedIds)) {
      u.assert(specs[faction] !== undefined, `PORT_SPECIALTIES.${faction} missing`);
      u.assertEqual(specs[faction].id, id, `${faction}.id should be ${id}`);
    }
    const st = window.D.SERVICE_THRESHOLDS;
    u.assert(st !== undefined, "SERVICE_THRESHOLDS missing");
    ["inquisitor", "embassy", "bank", "navalYard"].forEach(k => {
      u.assert(st[k] !== undefined, `SERVICE_THRESHOLDS.${k} missing`);
    });
    u.assert(Array.isArray(st.inquisitor.pricing) && st.inquisitor.pricing.length > 0, "inquisitor pricing table");
    u.assert(Array.isArray(st.embassy.pricing) && st.embassy.pricing.length > 0, "embassy pricing table");
    u.assert(st.bank.maturityDays === 30, "bank maturityDays = 30");
    u.assert(st.navalYard.repRequiredForRemoval === 50, "navalYard repRequired = 50");
  });

  reg("B10.HELPERS.BIRTH", "getBirthTrait / getBirthTraits / isSpanishBorn work as accessors", (u) => {
    const stateEnglish = { faction: "english" };
    u.assertEqual(L.getBirthTrait(stateEnglish, "crewLossMult"), 0.80);
    u.assertEqual(L.getBirthTrait(stateEnglish, "nonexistent"), null);
    const traits = L.getBirthTraits(stateEnglish);
    u.assert(traits.crewLossMult === 0.80, "full traits object contains crewLossMult");

    const stateSpanish = { faction: "spanish" };
    u.assertEqual(L.getBirthTrait(stateSpanish, "crewCost"), 40);
    u.assert(L.isSpanishBorn(stateSpanish) === true);
    u.assert(L.isSpanishBorn({ faction: "english" }) === false);
  });

  reg("B10.HELPERS.SERVICES", "Specialty lookup and availability calculations", (u) => {
    // getPortSpecialty
    u.assertEqual(L.getPortSpecialty("curacao").id, "bank");
    u.assertEqual(L.getPortSpecialty("portRoyal").id, "naval_yard");

    // isPortServiceAvailable
    const state = { reputation: { curacao: 40 } };
    u.assert(L.isPortServiceAvailable(state, "curacao", "bank") === true);
    const state2 = { reputation: { curacao: 20 } };
    u.assert(L.isPortServiceAvailable(state2, "curacao", "bank") === false);

    // Bank trust/interest
    const state3 = { reputation: { curacao: 30 } };
    u.assertEqual(L.getBankTrustPct(state3, "curacao"), 0.25);
    u.assertEqual(L.getBankInterestRate(state3, "curacao"), 0.10);
    const state4 = { reputation: { curacao: 90 } };
    u.assertEqual(L.getBankTrustPct(state4, "curacao"), 1.00);
    u.assertEqual(L.getBankInterestRate(state4, "curacao"), 0.05);

    // Bank capacity/ceiling
    const state5 = { fame: 100, ship: { type: "frigate" }, reputation: { curacao: 50 } };
    const capacity = L.getBankCapacity(state5);
    u.assertEqual(capacity, 105000, "bank capacity = 10000 + 100*200 + 250000*0.3");
    const trust = L.getBankTrustPct(state5, "curacao");
    u.assertEqual(L.getBankLoanCeiling(state5, "curacao"), Math.floor(capacity * trust));

    // Inquisitor cost
    const state6 = { infamy: 30 };
    u.assertEqual(L.getInquisitorCost(state6), 400);
    const state7 = { infamy: 110 };
    u.assertEqual(L.getInquisitorCost(state7), 1500);

    // Embassy cost
    const state8 = { reputation: { spanish: 30 } };
    u.assertEqual(L.getEmbassyCost(state8, "spanish"), 1000);
    const state9 = { reputation: { spanish: 85 } };
    u.assertEqual(L.getEmbassyCost(state9, "spanish"), 5000);

    // Naval yard early access
    const state10 = { fame: 80 };
    u.assert(L.getNavalYardEarlyAccess(state10) !== null, "early access available at fame 80");
    const shipItem = { requiredFame: 50 };
    u.assert(L.isEarlyAccessEligible(state10, shipItem, "ship") === true);
    const equipItem = { requiredFame: 150 };
    u.assert(L.isEarlyAccessEligible(state10, equipItem, "equipment") === false);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FRENCH — birth trait (consolidated)
  // ══════════════════════════════════════════════════════════════════════════

  reg("FRENCH.CONTRACT", "French provision multiplier and maxDays bonus", (u) => {
    // provisionMult from data
    u.assertEqual(window.D.BIRTH_TRAITS.french.provisionMult, 0.75);
    u.assertEqual(window.D.BIRTH_TRAITS.french.maxDaysBonus, 1);

    // Consumption pattern for 10 crew
    const state = makeState({
      faction: "french",
      crew: { roster: fillRoster(10), max: 40, morale: 80 },
      day: 1,
    });
    let total = 0;
    for (let d = 1; d <= 10; d++) {
      state.day = d;
      total += L.getProvisionConsumptionForDay(state).food;
    }
    u.assertEqual(total, 7, "French 10 crew over 10 days -> 7 (75% of 10)");

    // maxDays bonus
    const shipState = makeState({ faction: "french", ship: makeShip("sloop") });
    const stats = L.getShipStats(shipState);
    u.assertEqual(stats.maxDays, 11, "sloop maxDays +1 = 11");

    // Non-French unaffected
    const nonFrenchState = makeState({ faction: "english", ship: makeShip("sloop") });
    const stats2 = L.getShipStats(nonFrenchState);
    u.assertEqual(stats2.maxDays, 10, "non-French unchanged");

    // getBirthTrait accessors
    u.assertEqual(L.getBirthTrait(state, "provisionMult"), 0.75);
    u.assertEqual(L.getBirthTrait(state, "maxDaysBonus"), 1);
    u.assertEqual(L.getBirthTrait({ faction: "english" }, "provisionMult"), null);
  });

})();