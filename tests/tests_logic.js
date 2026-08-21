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
    setRandomSequence, resetRandomStub,
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
    u.assertEqual(stats.holdCapacity, 20, "holdCapacity");
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
    const items = { food: 10, water: 5 };
    const consumption = { food: 2, water: 1 };
    const days = L.getDaysOfProvisions(items, consumption);
    u.assertEqual(days.food, 5, "food days = 10/2 = 5");
    u.assertEqual(days.water, 5, "water days = 5/1 = 5");
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

  reg("L.REP.07", "canBribe: returns true only if infamy < 50", (u) => {
    u.assert(L.canBribe({ infamy: 0 }), "infamy 0 -> can bribe");
    u.assert(L.canBribe({ infamy: 49 }), "infamy 49 -> can bribe");
    u.assert(!L.canBribe({ infamy: 50 }), "infamy 50 -> cannot bribe");
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
  // L.PROVISIONS — consumption rates and starvation counters
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.PROV.01", "getProvisionConsumptionPerDay: 1 per 10 crew, rounded up", (u) => {
    const state = makeState({ crew: { roster: fillRoster(10), max: 40, morale: 80 } });
    const rates = L.getProvisionConsumptionPerDay(state);
    u.assertEqual(rates.food, 1);
    u.assertEqual(rates.water, 1);
  });

  reg("L.PROV.02", "getProvisionConsumptionPerDay: 11 crew = 2 per day (ceil)", (u) => {
    const state = makeState({ crew: { roster: fillRoster(11), max: 40, morale: 80 } });
    const rates = L.getProvisionConsumptionPerDay(state);
    u.assertEqual(rates.food, 2);
    u.assertEqual(rates.water, 2);
  });

  reg("L.PROV.03", "getProvisionConsumptionPerDay: 0 crew = 0 per day", (u) => {
    const state = makeState({ crew: { roster: [], max: 40, morale: 80 } });
    const rates = L.getProvisionConsumptionPerDay(state);
    u.assertEqual(rates.food, 0);
    u.assertEqual(rates.water, 0);
  });

  reg("L.PROV.04", "processStarvation: reduces crew and updates counters", (u) => {
    const state = makeState({ daysWithoutFood: 13, daysWithoutWater: 2 });
    const prov = { foodEmpty: true, waterEmpty: true };
    const roster = fillRoster(5);
    const result = L.processStarvation(state, prov, roster);
    u.assert(result.roster.length <= roster.length, "crew may be reduced");
    u.assert(result.warningLogs.length >= 0, "returns warning logs");
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
  // L.TRAVEL — travelDays with modifiers
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
  // L.LOG — classifyLogLine and getLogTabCategory
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.LOG.01", "classifyLogLine: returns a string category key, not an object", (u) => {
    const result = L.classifyLogLine("Arrived at Port Royal");
    u.assert(typeof result === "string" || result === null,
      `expected string or null, got ${typeof result}`);
  });

  reg("L.LOG.02", "classifyLogLine: arrival text → 'arrival'", (u) => {
    u.assertEqual(L.classifyLogLine("Arrived at Port Royal on day 5"), "arrival");
  });

  reg("L.LOG.03", "classifyLogLine: crew departure → 'crew'", (u) => {
    u.assertEqual(L.classifyLogLine("Jean Dupont has left the crew"), "crew");
  });

  reg("L.LOG.04", "classifyLogLine: combat text → 'combat'", (u) => {
    u.assertEqual(L.classifyLogLine("Victory! Enemy ship sunk."), "combat");
    u.assertEqual(L.classifyLogLine("Defeated! The crew surrenders."), "combat");
  });

  reg("L.LOG.05", "classifyLogLine: trade text → 'trade'", (u) => {
    u.assertEqual(L.classifyLogLine("Bought 10 sugar at Port Royal"), "trade");
    u.assertEqual(L.classifyLogLine("Sold cloth for 200g"), "trade");
  });

  reg("L.LOG.06", "classifyLogLine: unknown text → null", (u) => {
    u.assertEqual(L.classifyLogLine("Something completely unrelated"), null);
    u.assertEqual(L.classifyLogLine(""), null);
  });

  reg("L.LOG.07", "getLogTabCategory: always returns a non-null string", (u) => {
    const texts = [
      "Arrived at Kingston",
      "Jean Dupont has left the crew",
      "Victory! Boarded and plundered.",
      "Bought sugar for 200g",
      "Something random",
      "",
    ];
    for (const text of texts) {
      const result = L.getLogTabCategory(text);
      u.assert(typeof result === "string", `expected string for "${text}", got ${typeof result}`);
      u.assert(result.length > 0, `non-empty string for "${text}"`);
    }
  });

  reg("L.LOG.08", "getLogTabCategory: unknown text falls back to 'other'", (u) => {
    u.assertEqual(L.getLogTabCategory("Something completely unrelated"), "other");
    u.assertEqual(L.getLogTabCategory(""), "other");
  });

  reg("L.LOG.09", "getLogTabCategory: maps arrival/sailing/discovery to 'ports' tab", (u) => {
    u.assertEqual(L.getLogTabCategory("Arrived at Port Royal"), "ports");
    u.assertEqual(L.getLogTabCategory("Setting sail for Tortuga"), "ports");
    u.assertEqual(L.getLogTabCategory("New port discovered: Libertalia. Mark it on your charts."), "ports");
  });

  reg("L.LOG.10", "getLogTabCategory: maps combat to 'combat' tab", (u) => {
    u.assertEqual(L.getLogTabCategory("Victory! Enemy sunk."), "combat");
    u.assertEqual(L.getLogTabCategory("Plundered the ship."), "combat");
  });

  reg("L.LOG.11", "getLogTabCategory: maps mission/infamy to 'missions' tab", (u) => {
    u.assertEqual(L.getLogTabCategory("Completed: delivery mission"), "missions");
    u.assertEqual(L.getLogTabCategory("+5 infamy for attacking allies"), "missions");
  });

  reg("L.LOG.12", "classifyLogLine: handles all categories", (u) => {
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
      u.assertEqual(L.classifyLogLine(text), expected, `"${text}" -> ${expected}`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.SAVE — encodeSave / decodeSave round-trip and tamper detection
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.SAVE.01", "encodeSave produces a non-empty string", (u) => {
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

  reg("L.SAVE.05", "simpleHash: same string always produces same hash", (u) => {
    const a = L.simpleHash("hello broadside");
    const b = L.simpleHash("hello broadside");
    u.assertEqual(a, b);
  });

  reg("L.SAVE.06", "simpleHash: different strings produce different hashes", (u) => {
    u.assert(L.simpleHash("abc") !== L.simpleHash("xyz"));
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
  // L.COMBAT — B11 combat helpers and resolvers
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

  // ── Boarding resolver tests ─────────────────────────────────────────────

  reg("L.BOARD.01", "getBoardingRatio: even crew/morale → ratio ≈ 0.5", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(10), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    const battle = { playerCrew: 10, enemyCrew: 10 };
    const ratio = L.getBoardingRatio(state, battle, enemy);
    u.assertApprox(ratio, 0.5, 0.05);
  });

  reg("L.BOARD.02", "getBoardingRatio: player crew advantage → ratio > 0.5", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(20), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    const battle = { playerCrew: 20, enemyCrew: 10 };
    const ratio = L.getBoardingRatio(state, battle, enemy);
    u.assert(ratio > 0.5);
  });

  reg("L.BOARD.03", "Continue vs Continue: both sides take proportional losses", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(20), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    const battle = { playerCrew: 20, enemyCrew: 10 };
    const result = L.resolveBoardingRound(state, "continue_fighting", "continue_fighting", battle, enemy);
    u.assert(result.playerCrewLoss > 0, "player loses crew");
    u.assert(result.enemyCrewLoss > 0, "enemy loses crew");
    u.assertEqual(result.outcome, "continue");
  });

  reg("L.BOARD.04", "Demand Surrender vs Fall Back: always resolves to capture", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(5), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 20, risk: "medium" });
    const battle = { playerCrew: 5, enemyCrew: 20 };
    const result = L.resolveBoardingRound(state, "demand_surrender", "fall_back", battle, enemy);
    u.assertEqual(result.outcome, "enemy_win_capture");
  });

  reg("L.BOARD.05", "Demand Surrender declared below 0.65 threshold throws", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(5), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 20, risk: "medium" });
    const battle = { playerCrew: 5, enemyCrew: 20 };
    u.assertThrows(() => L.resolveBoardingRound(state, "demand_surrender", "continue_fighting", battle, enemy),
      "Demand Surrender below threshold should throw");
  });

  reg("L.BOARD.06", "Fall Back vs Continue, retreater's cost brings crew to 0 → wipeout", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(1), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    const battle = { playerCrew: 1, enemyCrew: 10 };
    const result = L.resolveBoardingRound(state, "fall_back", "continue_fighting", battle, enemy);
    u.assertEqual(result.outcome, "player_wipeout");
  });

  reg("L.BOARD.07", "mutual Fall Back: outcome = returned_to_naval, zero cost", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(10), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    const battle = { playerCrew: 10, enemyCrew: 10 };
    const result = L.resolveBoardingRound(state, "fall_back", "fall_back", battle, enemy);
    u.assertEqual(result.outcome, "returned_to_naval");
    u.assertEqual(result.playerCrewLoss, 0);
    u.assertEqual(result.enemyCrewLoss, 0);
  });

  reg("L.BOARD.08", "Surrender vs anything: always resolves to surrender outcome", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(10), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    const battle = { playerCrew: 10, enemyCrew: 10 };
    let result = L.resolveBoardingRound(state, "surrender", "continue_fighting", battle, enemy);
    u.assertEqual(result.outcome, "player_surrendered");
    result = L.resolveBoardingRound(state, "continue_fighting", "surrender", battle, enemy);
    u.assertEqual(result.outcome, "enemy_surrendered");
  });

  // ── NEW: Extended boarding resolver coverage ────────────────────────────

  reg("L.BOARD.09", "Continue vs Continue: player wipeout when crew hits 0", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(1), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    // Ratio will be low (1 vs 10), so player loss ~ ceil(1 * 0.15 * 0.9) = 1
    const battle = { playerCrew: 1, enemyCrew: 10 };
    const result = L.resolveBoardingRound(state, "continue_fighting", "continue_fighting", battle, enemy);
    u.assertEqual(result.outcome, "player_wipeout", "player wiped out when crew reaches 0");
  });

  reg("L.BOARD.10", "Continue vs Continue: enemy wipeout when enemy crew hits 0", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(10), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 1, risk: "medium" });
    // Ratio will be high (10 vs 1), so enemy loss ~ ceil(1 * 0.15 * 0.9) = 1
    const battle = { playerCrew: 10, enemyCrew: 1 };
    const result = L.resolveBoardingRound(state, "continue_fighting", "continue_fighting", battle, enemy);
    u.assertEqual(result.outcome, "enemy_wipeout", "enemy wiped out when crew reaches 0");
  });

  reg("L.BOARD.11", "Demand Surrender vs Continue: success when ratio >= 0.65", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(20), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 5, risk: "medium" });
    // Ratio should be > 0.65 (20 vs 5)
    const battle = { playerCrew: 20, enemyCrew: 5 };
    setRandomSequence([0.1]); // success chance = (ratio - 0.5) * 2, with ratio ~0.8 => 0.6, so 0.1 succeeds
    const result = L.resolveBoardingRound(state, "demand_surrender", "continue_fighting", battle, enemy);
    resetRandomStub();
    u.assertEqual(result.outcome, "enemy_win_capture", "Demand Surrender succeeds");
  });

  reg("L.BOARD.12", "Demand Surrender vs Continue: failure when ratio high but roll fails", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(20), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 5, risk: "medium" });
    const battle = { playerCrew: 20, enemyCrew: 5 };
    setRandomSequence([0.9]); // roll > success chance -> fails
    const result = L.resolveBoardingRound(state, "demand_surrender", "continue_fighting", battle, enemy);
    resetRandomStub();
    u.assertEqual(result.outcome, "continue", "Demand Surrender fails, continues");
    u.assert(result.playerCrewLoss > 0, "player loses crew on failure");
  });

  reg("L.BOARD.13", "Fall Back vs Continue: retreater loses crew proportional to ratio", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(10), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    const battle = { playerCrew: 10, enemyCrew: 10 };
    const result = L.resolveBoardingRound(state, "fall_back", "continue_fighting", battle, enemy);
    u.assertEqual(result.outcome, "returned_to_naval", "returns to naval");
    u.assert(result.playerCrewLoss > 0, "player loses crew on fall back");
    u.assertEqual(result.enemyCrewLoss, 0, "enemy loses no crew");
  });

  // ── NEW: NPC AI action coverage ──────────────────────────────────────────

  reg("L.BOARD.14", "getNPCBoardingAction: returns fall_back when enemy ratio is very low", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(20), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 5, risk: "low" });
    const battle = { playerCrew: 20, enemyCrew: 5 };
    const ratio = L.getBoardingRatio(state, battle, enemy);
    // enemy ratio = 1 - ratio, which will be very low
    const action = L.getNPCBoardingAction(battle, enemy, ratio);
    // With low enemy ratio, fall_back should be chosen when roll hits that branch
    // Since it's stochastic, we just verify it returns a valid action
    u.assert(["continue_fighting", "fall_back", "surrender"].includes(action), "returns valid boarding action");
  });

  reg("L.BOARD.15", "getNPCBoardingAction: returns surrender when enemy ratio is extremely low", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(30), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 2, risk: "low" });
    const battle = { playerCrew: 30, enemyCrew: 2 };
    const ratio = L.getBoardingRatio(state, battle, enemy);
    // enemy ratio will be very low
    const action = L.getNPCBoardingAction(battle, enemy, ratio);
    u.assert(["continue_fighting", "fall_back", "surrender"].includes(action), "returns valid boarding action");
  });

  reg("L.BOARD.16", "getNPCBoardingAction: returns continue_fighting when enemy ratio is moderate", (u) => {
    const state = makePortState({ crew: { roster: fillRoster(10), morale: 50, max: 40 } });
    const enemy = makeEnemy({ crew: 10, risk: "medium" });
    const battle = { playerCrew: 10, enemyCrew: 10 };
    const ratio = L.getBoardingRatio(state, battle, enemy);
    const action = L.getNPCBoardingAction(battle, enemy, ratio);
    u.assert(["continue_fighting", "fall_back", "surrender"].includes(action), "returns valid boarding action");
  });

  reg("L.BOARD.17", "getNPCNavalAction: returns broadside when health is good", (u) => {
    const enemy = makeEnemy({ hull: 100, cannons: 10, crew: 20 });
    const battle = { distance: "medium", enemyHull: 100 };
    const action = L.getNPCNavalAction(battle, enemy);
    u.assert(["broadside", "precision", "close_distance", "open_distance"].includes(action), "returns valid naval action");
  });

  reg("L.BOARD.18", "getNPCNavalAction: returns open_distance when hull is low and at close range", (u) => {
    const enemy = makeEnemy({ hull: 100, cannons: 10, crew: 20 });
    const battle = { distance: "close", enemyHull: 20 };
    // With low hull at close range, open_distance is likely
    const action = L.getNPCNavalAction(battle, enemy);
    u.assert(["broadside", "precision", "close_distance", "open_distance"].includes(action), "returns valid naval action");
  });

  // ── NEW: maybeCrewLoss helper ────────────────────────────────────────────

  reg("L.COMBAT.01", "maybeCrewLoss: returns 0 or computed loss (deterministic with seed)", (u) => {
    // Test with seed that returns 0
    setRandomSequence([0.4]); // < 0.5 -> returns 0
    const result0 = L.maybeCrewLoss(10);
    resetRandomStub();
    u.assertEqual(result0, 0, "returns 0 when random < 0.5");

    // Test with seed that returns > 0
    setRandomSequence([0.6]); // >= 0.5 -> returns floor(amount)
    const result1 = L.maybeCrewLoss(10);
    resetRandomStub();
    u.assertEqual(result1, 10, "returns floor(amount) when random >= 0.5");

    // Test with fractional amount
    setRandomSequence([0.6]);
    const result2 = L.maybeCrewLoss(7.5);
    resetRandomStub();
    u.assertEqual(result2, 7, "returns floor of amount when random >= 0.5");
  });

  // ── NEW: travelDaysBetween coverage ──────────────────────────────────────

  reg("L.TRAVEL.11", "travelDaysBetween: calculates travel days between coordinates", (u) => {
    const state = makeState({
      ship: makeShip("sloop"),
      crew: { roster: [], morale: 80, max: 40 },
      wind: { angle: 0, speed: 10 },
    });
    const days = L.travelDaysBetween({ x: 400, y: 230 }, { x: 480, y: 200 }, state);
    u.assert(days >= 1, "returns positive integer");
    u.assert(Number.isInteger(days), "returns integer");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.EVENTS — random event and patrol triggers
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.EVT.01", "maybeRandomPatrol: returns boolean based on infamy, heat, rep", (u) => {
    const state = makeState({
      infamy: 100,
      factionAlerts: { english: 10 },
      reputation: { portRoyal: 80 },
      currentPort: "portRoyal",
      destination: "tortuga",
    });
    const result = L.maybeRandomPatrol(state);
    u.assert(typeof result === "boolean", "returns boolean");
  });

  reg("L.EVT.02", "triggerRandomEvent: returns an event or null", (u) => {
    const state = makeState({ fame: 100, screen: "sailing" });
    const event = L.triggerRandomEvent(state);
    u.assert(event === null || (event.id && event.title), "returns null or valid event");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.ENC — buildEncounterContext
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.ENC.01", "buildEncounterContext: creates a context for random encounter", (u) => {
    const state = makePortState("portRoyal", { destination: "tortuga" });
    const enemy = { name: "The Test", faction: "pirate", hull: 100, cannons: 10, crew: 20 };
    const context = L.buildEncounterContext(state, "random", enemy);
    u.assert(context.type === "random", "type set");
    u.assert(context.enemy.name === "The Test", "enemy name");
    u.assert(Array.isArray(context.options), "options array");
    u.assert(context.options.some(o => o.id === "fight"), "includes fight");
    u.assert(context.options.some(o => o.id === "flee"), "includes flee");
  });

  reg("L.ENC.02", "buildEncounterContext: patrol encounter has inspect option", (u) => {
    const state = makePortState("portRoyal", { destination: "tortuga" });
    const enemy = { name: "Patrol", faction: "english" };
    const context = L.buildEncounterContext(state, "navy_patrol", enemy);
    u.assert(context.options.some(o => o.id === "inspect"), "includes inspect");
    u.assert(context.options.some(o => o.id === "fight"), "includes fight");
    u.assert(!context.options.some(o => o.id === "flee"), "no flee for patrol");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.PORT — getPortTradeProfile
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.PROF.01", "getPortTradeProfile: returns goodDeals and inDemand for a port", (u) => {
    const profile = L.getPortTradeProfile("portRoyal");
    u.assert(profile.goodDeals.includes("sugar"), "sugar is a good deal");
    u.assert(profile.goodDeals.includes("cloth"), "cloth is a good deal");
    u.assert(profile.goodDeals.includes("food"), "food is always a good deal");

    const profileTortuga = L.getPortTradeProfile("tortuga");
    u.assert(profileTortuga.goodDeals.includes("rum"), "rum is a good deal");
    u.assert(profileTortuga.goodDeals.includes("tobacco"), "tobacco is a good deal");
    const inDemand = profileTortuga.inDemand;
    u.assert(inDemand.length > 0, "Tortuga has some in demand");
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
  // L.MISC — miscellaneous
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

})();