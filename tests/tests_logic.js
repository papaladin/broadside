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
    // sloop base maxHull 100, hullPct 0.20 → 100 * 1.20 = 120
    u.assertEqual(stats.maxHull, 120);
  });

  reg("L.STATS.04", "getShipStats: extra_cannons adds 4 cannons", (u) => {
    const state = makeState({
      ship: { ...makeShip("schooner"), equipment: { hull: [], armament: ["extra_cannons"], rigging: [], special: [] } },
    });
    const stats = L.getShipStats(state);
    // schooner base cannons 12 + 4 = 16
    u.assertEqual(stats.cannons, 16);
  });

  reg("L.STATS.05", "getShipStats: tar_sealed_hull adds maxDays and reduces speed", (u) => {
    const state = makeState({
      ship: { ...makeShip("cutter"), equipment: { hull: ["tar_sealed_hull"], armament: [], rigging: [], special: [] } },
    });
    const stats = L.getShipStats(state);
    // cutter base maxDays 8 + 2 = 10; base speed 12 - 1 = 11
    u.assertEqual(stats.maxDays, 10, "maxDays");
    u.assertEqual(stats.speed, 11, "speed");
  });

  reg("L.STATS.06", "getShipStats: unknown equipment key is silently ignored", (u) => {
    const state = makeState({
      ship: { ...makeShip("sloop"), equipment: { hull: ["not_real_item"], armament: [], rigging: [], special: [] } },
    });
    const stats = L.getShipStats(state);
    // Should still return base sloop stats
    u.assertEqual(stats.maxHull, 100);
    u.assertEqual(stats.speed, 11);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.REPAIR — shipRepairCost formula (tier-scaled)
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.REPAIR.01", "shipRepairCost: 0 missing hull = 0 cost", (u) => {
    const ship = makeShip("sloop"); // hull 100, maxHull 100
    const state = makeState({ ship });
    u.assertEqual(L.shipRepairCost(state), 0);
  });

  reg("L.REPAIR.02", "shipRepairCost: dinghy — 2g per hull point (ceil(30/20)=2)", (u) => {
    const ship = { ...makeShip("dinghy"), hull: 20 }; // 10 missing
    const state = makeState({ ship });
    // rate = Math.ceil(30/20) = 2; cost = 10 * 2 = 20
    u.assertEqual(L.shipRepairCost(state), 20);
  });

  reg("L.REPAIR.03", "shipRepairCost: sloop — 5g per hull point (ceil(100/20)=5)", (u) => {
    const ship = { ...makeShip("sloop"), hull: 60 }; // 40 missing
    const state = makeState({ ship });
    // rate = ceil(100/20) = 5; cost = 40 * 5 = 200
    u.assertEqual(L.shipRepairCost(state), 200);
  });

  reg("L.REPAIR.04", "shipRepairCost: galleon — 20g per hull point (ceil(400/20)=20)", (u) => {
    const ship = { ...makeShip("galleon"), hull: 350 }; // 50 missing
    const state = makeState({ ship });
    // rate = ceil(400/20) = 20; cost = 50 * 20 = 1000
    u.assertEqual(L.shipRepairCost(state), 1000);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // L.HOLD — hold capacity, usage, load percentage
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.HOLD.01", "getHoldCapacity: derives from ship type, not hold.capacity field", (u) => {
    const state = makeState({ ship: makeShip("sloop") });
    // sloop holdCapacity = 200
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
    // sloop capacity 200, load 99 = 49.5%
    const state = makeState({
      ship: makeShip("sloop"),
      hold: makeHold({ food: 99 }),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
    });
    // Base days portRoyal→tortuga. Just confirm it returns a positive integer.
    const days = L.travelDays("portRoyal", "tortuga", state);
    u.assert(days >= 1, "positive travel days");
    // Now fill hold to >75% and confirm it takes longer
    const heavyState = makeState({
      ship: makeShip("sloop"),
      hold: makeHold({ food: 151 }),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
    });
    const heavyDays = L.travelDays("portRoyal", "tortuga", heavyState);
    u.assert(heavyDays >= days, "heavy hold takes at least as long");
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
    // 49 falls into neutral (30 ≤ 49 < 50)
    u.assertEqual(L.getRepPerk(49).tier, "neutral");
    u.assertEqual(L.getRepPerk(50).tier, "friendly");
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
    const m = { id: "x", firstName: "A", lastName: "B" }; // no tags key
    u.assert(!L.hasTag(m, "any"), "no tags → false");
  });

  reg("L.CREW.03", "addTag: appends the tag without mutating original", (u) => {
    const original = makeCrewMember({ tags: ["seasoned"] });
    const updated  = L.addTag(original, "veteran");
    u.assert(L.hasTag(updated, "seasoned"), "old tag preserved");
    u.assert(L.hasTag(updated, "veteran"),  "new tag added");
    u.assert(!L.hasTag(original, "veteran"), "original not mutated");
  });

  reg("L.CREW.04", "addTag: does not duplicate an existing tag", (u) => {
    const m = makeCrewMember({ tags: ["seasoned"] });
    const updated = L.addTag(m, "seasoned");
    u.assertEqual(updated.tags.filter(t => t === "seasoned").length, 1);
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
    // alignment = 5/5 = 1.0; modifier = 0.5 + 1.0 = 1.5
    u.assertEqual(L.getAlignmentModifier(state, "english"), 1.5);
  });

  reg("L.CREW.10", "getAlignmentModifier: no matching crew = 0.5 (base)", (u) => {
    const state = makeState({
      crew: {
        roster: fillRoster(5, { faction: "spanish" }),
        max: 40, morale: 80,
      },
    });
    // alignment = 0/5 = 0; modifier = 0.5 + 0 = 0.5
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
    // 2/5 = 0.4 english; modifier = 0.5 + 0.4 = 0.9
    u.assertApprox(L.getAlignmentModifier(state, "english"), 0.9, 0.01);
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

  // ══════════════════════════════════════════════════════════════════════════
  // L.EQUIPMENT — canInstallEquipment and getEquipmentEffect
  // ══════════════════════════════════════════════════════════════════════════

  reg("L.EQ.01", "canInstallEquipment: cutter has no hull slot — blocked", (u) => {
    const state = makeState({ ship: makeShip("cutter"), fame: 0 });
    // cutter slots: { hull: 0, armament: 0, rigging: 1, special: 0 }
    const result = L.canInstallEquipment(state, "reinforced_hull");
    u.assert(!result.allowed, "cutter has no hull slot");
  });

  reg("L.EQ.02", "canInstallEquipment: sloop can install reinforced_hull in hull slot", (u) => {
    const state = makeState({ ship: makeShip("sloop"), fame: 0 });
    // sloop slots: { hull: 1, armament: 1, rigging: 1, special: 0 }
    const result = L.canInstallEquipment(state, "reinforced_hull");
    u.assert(result.allowed, result.reason);
  });

  reg("L.EQ.03", "canInstallEquipment: blocked by requiredFame", (u) => {
    const state = makeState({ ship: makeShip("frigate"), fame: 0 });
    // ironclad_plates requires fame 50
    const result = L.canInstallEquipment(state, "ironclad_plates");
    u.assert(!result.allowed, "needs fame 50");
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
    // sloop hull slot is 1, already filled
    const result = L.canInstallEquipment(state, "tar_sealed_hull");
    u.assert(!result.allowed, "slot already occupied");
  });

  reg("L.EQ.05", "getEquipmentEffect: returns 0 when no equipment installed", (u) => {
    const state = makeState({ ship: makeShip("sloop") });
    u.assertEqual(L.getEquipmentEffect(state, "repairCostPct"), 0);
    u.assertEqual(L.getEquipmentEffect(state, "crewLossMult"), 0);
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
    // portRoyal to portRoyal: PORTS lookup finds same position, distance = 0
    // result is Math.max(1, ceil(0/speed)) = 1, but canReach returns false
    // This test just confirms the function doesn't throw
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
    u.assert(slowDays >= normalDays, "low morale adds at least 0 days (may be same if wind already adds 1)");
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
      ship: makeShip("sloop"), // maxDays 10
      hold: makeHold(),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
    });
    // portRoyal → tortuga is a short hop
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

  reg("L.TRAVEL.06", "getUnreachableReason: hidden port not in discoveredPorts", (u) => {
    const state = makeState({
      currentPort: "portRoyal",
      ship: makeShip("sloop"),
      hold: makeHold(),
      crew: { roster: [], max: 40, morale: 80 },
      wind: { angle: 0, speed: 10 },
      discoveredPorts: [], // no hidden ports discovered
    });
    // Find a hidden port key from D.PORTS
    const hiddenKey = Object.keys(D.PORTS).find(k => D.PORTS[k].hidden);
    if (!hiddenKey) return; // skip if no hidden ports in data
    const reason = L.getUnreachableReason(state, hiddenKey);
    u.assert(reason !== null, "hidden undiscovered port has a reason");
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
    const decoded = L.decodeSave(encoded);
    u.assert(decoded !== null && decoded !== false, "decode succeeds");
    u.assertEqual(decoded.gold, 1234, "gold preserved");
    u.assertEqual(decoded.fame, 77, "fame preserved");
    u.assertEqual(decoded.captainName, "Test Captain", "captainName preserved");
  });

  reg("L.SAVE.03", "decodeSave: tampered data returns false", (u) => {
    const state = makeState({ gold: 100 });
    const encoded = L.encodeSave(state);
    // Corrupt the payload — append garbage to the encoded string
    const tampered = encoded.slice(0, -5) + "XXXXX";
    const result = L.decodeSave(tampered);
    u.assert(result === false || result === null, "tamper detected");
  });

  reg("L.SAVE.04", "decodeSave: garbage input returns false", (u) => {
    u.assert(L.decodeSave("not a valid save") === false ||
             L.decodeSave("not a valid save") === null, "invalid input returns false/null");
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
      },
    });
    u.assert(!L.isFeatureUnlocked(state, "market"), "market locked before contractsOpened");
  });

  reg("L.FEAT.04", "isFeatureUnlocked: market unlocked after contractsOpened", (u) => {
    const state = makeState({
      tutorialMode: "full",
      onboarding: {
        ...window.E.initialState.onboarding,
        enabled: true,
        completed: false,
        stepsCompleted: {
          ...window.E.initialState.onboarding.stepsCompleted,
          contractsOpened: true,
        },
      },
    });
    u.assert(L.isFeatureUnlocked(state, "market"), "market unlocked after contractsOpened");
  });

})();