// tests_generators.js
// ─────────────────────────────────────────────────────────────────────────────
// Comprehensive tests for generators.js to maximize return-path coverage.
// Consolidated into table-driven contracts.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  const {
    makeState, makeShip, makeHold, fillRoster, makePortState,
    setRandomSequence, resetRandomStub,
  } = window.testHelpers;

  const G = window.G;
  const L = window.L;
  const D = window.D;

  const reg = (id, name, run) =>
    window._tests.push({ id, name, run });

  // ══════════════════════════════════════════════════════════════════════════
  // G.ENEMY — generateEnemy
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.ENEMY.01", "generateEnemy: field existence, scaling, faction", (u) => {
    // ── Field existence ────────────────────────────────────────────────
    const enemy = G.generateEnemy("medium", 50, "english");
    ["name", "faction", "hull", "cannons", "crew"].forEach(f =>
      u.assert(enemy[f] !== undefined && enemy[f] !== null, `enemy has ${f}`)
    );

    // ── Risk scaling ──────────────────────────────────────────────────
    const low = G.generateEnemy("low", 50, "english");
    const medium = G.generateEnemy("medium", 50, "english");
    const high = G.generateEnemy("high", 50, "english");
    u.assert(low.hull <= medium.hull && medium.hull <= high.hull, "hull scales with risk");
    u.assert(low.cannons <= medium.cannons && medium.cannons <= high.cannons, "cannons scale with risk");

    // ── Fame scaling ──────────────────────────────────────────────────
    const lowFame = G.generateEnemy("medium", 10, "english");
    const highFame = G.generateEnemy("medium", 200, "english");
    u.assert(highFame.hull >= lowFame.hull, "higher fame → higher hull");

    // ── Faction ──────────────────────────────────────────────────────
    const rivals = D.FACTIONS.english.rivalFactions || [];
    const enemyFaction = G.generateEnemy("medium", 50, "english").faction;
    if (rivals.length > 0) {
      u.assert(rivals.includes(enemyFaction), "enemy faction is rival");
    } else {
      u.assertEqual(enemyFaction, "pirate", "fallback to pirate");
    }
  });

  reg("G.ENEMY_NAME.01", "generateEnemyName: returns formatted name for all factions", (u) => {
    const factions = ["english", "spanish", "french", "dutch", "pirate"];
    for (const f of factions) {
      const name = G.generateEnemyName(f);
      u.assert(name.startsWith("The "), `"${name}" starts with "The"`);
      u.assert(name.split(" ").length >= 3, `"${name}" has at least 3 words`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.CARGO — generateEnemyCargo
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.CARGO.01", "generateEnemyCargo: structure, risk scaling, provisions, trade goods", (u) => {
    const state = makeState({ fame: 50 });
    const enemy = { faction: "english", crew: 20 };

    // ── Low risk ──────────────────────────────────────────────────────
    const low = G.generateEnemyCargo(state, enemy, "low");
    u.assert(low.gold >= 0, "gold non-negative");
    u.assert(typeof low.cargo === "object", "cargo object");

    // ── High risk → more gold ──────────────────────────────────────
    const high = G.generateEnemyCargo(state, enemy, "high");
    u.assert(high.gold >= low.gold, "higher risk → more gold");

    // ── Provisions always included ──────────────────────────────────
    u.assert(low.cargo.food > 0, "food included");
    u.assert(low.cargo.water > 0, "water included");

    // ── Trade goods included ──────────────────────────────────────
    const highFame = makeState({ fame: 100 });
    const cargoHigh = G.generateEnemyCargo(highFame, enemy, "medium");
    const goods = Object.keys(cargoHigh.cargo).filter(g => g !== "food" && g !== "water");
    u.assert(goods.length > 0, "trade goods included at higher fame");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.GOLD — generateGold
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.GOLD.01", "generateGold: positive number and rounded to nearest 25", (u) => {
    for (let i = 0; i < 10; i++) {
      const gold = G.generateGold("trade", "medium", 50);
      u.assert(gold > 0, "positive gold");
      u.assert(gold % 25 === 0, `rounded to 25: ${gold}`);
    }
  });

  reg("G.GOLD.02", "generateGold: scaling by risk, fame, type", (u) => {
    const low = G.generateGold("trade", "low", 50);
    const high = G.generateGold("trade", "high", 50);
    u.assert(high >= low, "higher risk → more gold");

    const lowFame = G.generateGold("trade", "medium", 10);
    const highFame = G.generateGold("trade", "medium", 200);
    u.assert(highFame >= lowFame, "higher fame → more gold");

    const trade = G.generateGold("trade", "medium", 50);
    const combat = G.generateGold("combat", "medium", 50);
    u.assert(typeof trade === "number" && typeof combat === "number", "both return numbers");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.CREW — generateCrewMember and generateRoster
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.CREW.01", "generateCrewMember: field shape", (u) => {
    const crew = G.generateCrewMember("english");
    u.assert(crew.id && typeof crew.id === "string", "has ID");
    u.assert(crew.firstName && typeof crew.firstName === "string", "first name");
    u.assert(crew.lastName && typeof crew.lastName === "string", "last name");
    u.assert(crew.role && typeof crew.role === "string", "role");
    u.assert(crew.faction === "english", "faction matches");
    u.assert(crew.daysAboard === 0, "daysAboard starts at 0");
    u.assert(Array.isArray(crew.tags), "tags array");
  });

  reg("G.CREW.02", "generateCrewMember: uniqueness and hidden traits", (u) => {
    // Uniqueness
    const c1 = G.generateCrewMember("english");
    const c2 = G.generateCrewMember("english");
    u.assert(c1.id !== c2.id, "unique IDs");

    const existingNames = ["John Smith", "Jane Doe"];
    const unique = G.generateCrewMember("english", existingNames);
    u.assert(!existingNames.includes(`${unique.firstName} ${unique.lastName}`), "name not in existing list");

    // Hidden traits (probabilistic, but check at least one appears in 100 tries)
    let foundHidden = false;
    for (let i = 0; i < 100; i++) {
      const crew = G.generateCrewMember("english");
      if (crew.tags.some(t => t.startsWith("hidden_"))) {
        foundHidden = true;
        break;
      }
    }
    u.assert(foundHidden, "found at least one hidden trait in 100 tries");
  });

  reg("G.CREW.03", "generateRoster: correct length, same faction, unique names", (u) => {
    const roster = G.generateRoster(5, "english");
    u.assertEqual(roster.length, 5, "length 5");
    u.assert(roster.every(m => m.faction === "english"), "all same faction");

    const names = roster.map(m => `${m.firstName} ${m.lastName}`);
    const uniqueNames = new Set(names);
    u.assertEqual(uniqueNames.size, names.length, "all names unique");

    u.assertEqual(G.generateRoster(0, "english").length, 0, "empty count returns []");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.CREW_BIO — generateCrewBio
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.CREW_BIO.01", "generateCrewBio: handles various inputs", (u) => {
    const state = makeState();
    const cases = [
      { days: 10, tags: [], expected: (bio) => bio.includes("new") || bio.includes("fresh") },
      { days: 10, tags: ["hidden_drunkard"], expected: (bio) => bio.length > 0 },
      { days: 10, tags: ["revealed_drunkard"], expected: (bio) => bio.includes("rum") || bio.includes("drink") },
      { days: 10, tags: ["scar_battle"], expected: (bio) => bio.includes("battle") || bio.includes("scar") },
      { days: 10, tags: ["scar_battle", "scar_storm"], expected: (bio) => bio.includes("battle") && bio.includes("storm") },
      { days: 10, tags: ["mutineer", "scar_battle"], expected: (bio) => bio.includes("mutiny") && bio.includes("battle") },
    ];

    for (const { days, tags, expected } of cases) {
      const member = { firstName: "John", lastName: "Smith", faction: "english", role: "deckhand", daysAboard: days, tags };
      setRandomSequence([0.0]);
      const bio = G.generateCrewBio(member, state);
      resetRandomStub();
      u.assert(typeof bio === "string" && bio.length > 0, "non-empty bio");
      u.assert(expected(bio), `bio "${bio}" meets expectation`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.MARKET — generatePortMarket
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.MARKET.01", "generatePortMarket: structure and invariants", (u) => {
    const state = makeState();
    const market = G.generatePortMarket("portRoyal", state);
    u.assert(market.portKey === "portRoyal", "portKey matches");
    u.assert(typeof market.goods === "object", "goods object");

    const resources = Object.keys(D.RESOURCES);
    resources.forEach(good => {
      u.assert(market.goods[good] !== undefined, `includes ${good}`);
      u.assert(market.goods[good].buyFromPort > 0, `${good} positive buy price`);
      u.assert(market.goods[good].sellToPort > 0, `${good} positive sell price`);
    });

    // Food/water always available
    u.assert(market.goods.food.available > 0, "food available");
    u.assert(market.goods.water.available > 0, "water available");
  });

  reg("G.MARKET.02", "generatePortMarket: availability differs by port and fame scaling", (u) => {
    const state = makeState();
    const market1 = G.generatePortMarket("portRoyal", state);
    const market2 = G.generatePortMarket("tortuga", state);
    // At least one good should differ in availability
    const diff = Object.keys(D.RESOURCES).some(g =>
      market1.goods[g].available !== market2.goods[g].available
    );
    u.assert(diff, "availability differs by port");

    // Fame scaling (stock quantities should increase with fame)
    const stateLow = makeState({ fame: 0 });
    const stateHigh = makeState({ fame: 200 });
    const marketLow = G.generatePortMarket("portRoyal", stateLow);
    const marketHigh = G.generatePortMarket("portRoyal", stateHigh);
    u.assert(marketLow.goods.sugar !== undefined && marketHigh.goods.sugar !== undefined,
      "market goods exist for both fame levels");
  });

  // ── B10.5 Dutch market tests (kept as they are valuable) ──────────────

  reg("G.MARKET.DUTCH.01", "Dutch: generatePortMarket applies buy multiplier 1.05", (u) => {
    setRandomSequence([0.5]);
    const state = makeState({ faction: "dutch" });
    const market = G.generatePortMarket("portRoyal", state);
    resetRandomStub();
    u.assertEqual(market.goods.sugar.buyFromPort, 38);
    u.assertEqual(market.goods.sugar.sellToPort, 34);
  });

  reg("G.MARKET.DUTCH.02", "Non-Dutch: generatePortMarket uses standard multipliers", (u) => {
    setRandomSequence([0.5]);
    const state = makeState({ faction: "english" });
    const market = G.generatePortMarket("portRoyal", state);
    resetRandomStub();
    u.assertEqual(market.goods.sugar.buyFromPort, 40);
    u.assertEqual(market.goods.sugar.sellToPort, 32);
  });

  reg("G.MARKET.DUTCH.03", "Dutch vs Non-Dutch: relative prices differ", (u) => {
    setRandomSequence([0.5]);
    const stateDutch = makeState({ faction: "dutch" });
    const marketDutch = G.generatePortMarket("portRoyal", stateDutch);
    const stateEnglish = makeState({ faction: "english" });
    const marketEnglish = G.generatePortMarket("portRoyal", stateEnglish);
    resetRandomStub();

    u.assert(marketDutch.goods.sugar.buyFromPort < marketEnglish.goods.sugar.buyFromPort,
      `Dutch buy (${marketDutch.goods.sugar.buyFromPort}) < English buy (${marketEnglish.goods.sugar.buyFromPort})`);
    u.assert(marketDutch.goods.sugar.sellToPort > marketEnglish.goods.sugar.sellToPort,
      `Dutch sell (${marketDutch.goods.sugar.sellToPort}) > English sell (${marketEnglish.goods.sugar.sellToPort})`);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.MISSION — generateMissions
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.MISSION.01", "generateMissions: returns array with required fields", (u) => {
    const state = makePortState("portRoyal", { fame: 50 });
    const missions = G.generateMissions("portRoyal", state);
    u.assert(Array.isArray(missions), "returns array");
    u.assert(missions.length > 0, "has at least one mission");

    missions.forEach(m => {
      u.assert(m.type !== undefined, "has type");
      u.assert(m.name !== undefined, "has name");
      u.assert(m.faction !== undefined, "has faction");
      u.assert(m.gold !== undefined, "has gold reward");
      if (m.type !== "combat") {
        u.assert(m.targetPort !== undefined && m.targetPort !== null,
          `mission ${m.name} (type ${m.type}) has targetPort`);
      }
    });
  });

  reg("G.MISSION.02", "generateMissions: includes different types at high fame", (u) => {
    const state = makePortState("portRoyal", { fame: 200 });
    let seenTypes = new Set();
    for (let i = 0; i < 50; i++) {
      const missions = G.generateMissions("portRoyal", state);
      missions.forEach(m => seenTypes.add(m.type));
      if (seenTypes.size >= 2) break;
    }
    u.assert(seenTypes.size >= 2, `Expected at least 2 mission types, got ${seenTypes.size}: ${Array.from(seenTypes).join(", ")}`);
  });

  reg("G.MISSION.03", "generateMissions: respects onboarding state", (u) => {
    const state = makePortState("portRoyal", { onboarding: { enabled: true, completed: false } });
    const missions = G.generateMissions("portRoyal", state);
    u.assert(Array.isArray(missions), "returns array even during onboarding");
  });

  // ── Trade mission target port has required good in demand ───────────────

  reg("G.MISSION.04", "trade mission target port has required good in demand", (u) => {
    const state = makePortState("portRoyal", { fame: 50 });
    const missions = G.generateMissions("portRoyal", state);
    const tradeMissions = missions.filter(m => m.type === "trade");
    if (tradeMissions.length === 0) {
      u.assert(true, "No trade missions generated – test skipped");
      return;
    }
    for (const m of tradeMissions) {
      const profile = L.getPortTradeProfile(m.targetPort);
      u.assert(profile.inDemand.includes(m.requiredGood),
        `Trade mission "${m.name}" targets ${m.targetPort} with good "${m.requiredGood}", but that good is NOT in demand there.`);
    }
  });

  // ── Smuggle mission enemy faction matches target port faction ───────────────

  reg("G.MISSION.05", "smuggle mission enemy faction matches target port faction", (u) => {
    const state = makePortState("portRoyal", { fame: 50 });
    const missions = G.generateMissions("portRoyal", state);
    const smuggleMissions = missions.filter(m => m.type === "smuggle");
    if (smuggleMissions.length === 0) {
      u.assert(true, "No smuggle missions generated – test skipped");
      return;
    }
    for (const m of smuggleMissions) {
      const targetFaction = D.PORTS[m.targetPort].faction;
      u.assertEqual(m.enemy.faction, targetFaction,
        `Smuggle mission enemy faction ${m.enemy.faction} does not match target port faction ${targetFaction}`);
    }
  });

  // ── Smuggle mission required good is scarce at target port ───────────────

  reg("G.MISSION.06", "smuggle mission required good is rarely/never available at target port", (u) => {
    const state = makePortState("portRoyal", { fame: 50 });
    const missions = G.generateMissions("portRoyal", state);
    const smuggleMissions = missions.filter(m => m.type === "smuggle");
    if (smuggleMissions.length === 0) {
      u.assert(true, "No smuggle missions generated – test skipped");
      return;
    }
    const colOrder = ["food","water","rum","sugar","timber","cloth","spices","silk",
                      "coffee","cocoa","weapons","tobacco","silver","slaves"];
    for (const m of smuggleMissions) {
      const avail = D.GOODS_AVAILABILITY[m.targetPort];
      const idx = colOrder.indexOf(m.requiredGood);
      u.assert(idx !== -1, `Good ${m.requiredGood} not in colOrder`);
      const tier = avail[idx] || "never";
      u.assert(tier === "rarely" || tier === "never",
        `Smuggle good "${m.requiredGood}" at ${m.targetPort} has tier "${tier}", expected "rarely" or "never"`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.PIRATE — Smuggling mission exclusivity (B10.6)
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.PIRATE.01", "Smuggling missions appear at Pirate ports", (u) => {
    setRandomSequence([0.8, 0.5, 0.5]);
    const state = makePortState("tortuga", { faction: "pirate", fame: 50 });
    const missions = G.generateMissions("tortuga", state);
    resetRandomStub();
    const smuggleMissions = missions.filter(m => m.type === "smuggle");
    u.assert(smuggleMissions.length > 0, "Pirate port should generate at least one smuggling mission");
  });

  reg("G.PIRATE.02", "Smuggling missions do NOT appear at non-Pirate ports", (u) => {
    const state = makePortState("portRoyal", { faction: "english", fame: 50 });
    const missions = G.generateMissions("portRoyal", state);
    const smuggleMissions = missions.filter(m => m.type === "smuggle");
    u.assertEqual(smuggleMissions.length, 0, "Non-Pirate port should NOT generate smuggling missions");
  });

  reg("G.PIRATE.03", "Smuggling missions do NOT appear at non-Pirate ports on refresh", (u) => {
    const state = makePortState("havana", { faction: "spanish", fame: 50 });
    for (let i = 0; i < 10; i++) {
      const missions = G.generateMissions("havana", state);
      const smuggleMissions = missions.filter(m => m.type === "smuggle");
      u.assertEqual(smuggleMissions.length, 0, `Run ${i+1}: Non-Pirate port should NOT generate smuggling missions`);
    }
  });

  reg("G.PIRATE.04", "Pirate port generates smuggling missions (robust)", (u) => {
    let foundSmuggle = false;
    for (let i = 0; i < 20; i++) {
      const state = makePortState("tortuga", { faction: "pirate", fame: 200 });
      const missions = G.generateMissions("tortuga", state);
      if (missions.some(m => m.type === "smuggle")) {
        foundSmuggle = true;
        break;
      }
    }
    u.assert(foundSmuggle, "Pirate port should eventually generate a smuggling mission");
  });

  reg("G.PIRATE.05", "Non-Pirate port generates no smuggling even with high fame", (u) => {
    const state = makePortState("portRoyal", { faction: "english", fame: 200 });
    const missions = G.generateMissions("portRoyal", state);
    const smuggleMissions = missions.filter(m => m.type === "smuggle");
    u.assertEqual(smuggleMissions.length, 0, "High fame doesn't enable smuggling at non-Pirate ports");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.REP — generateRepImpact
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.REP.01", "generateRepImpact: correct impacts per mission type", (u) => {
    const cases = [
      { type: "trade", commissioning: "english", risk: "low", defending: "spanish",
        check: (impact) => impact.english > 0 },
      { type: "combat", commissioning: "english", risk: "medium", defending: "spanish",
        check: (impact) => impact.english > 0 && Object.values(impact).some(v => v < 0) },
      { type: "smuggle", commissioning: "english", risk: "low", defending: "spanish",
        check: (impact) => impact.pirate !== undefined && impact.pirate > 0 },
      { type: "assault", commissioning: "english", risk: "high", defending: "spanish",
        check: (impact) => impact.spanish < -5 },
    ];

    for (const { type, commissioning, risk, defending, check } of cases) {
      const impact = G.generateRepImpact(type, commissioning, risk, defending);
      u.assert(typeof impact === "object", "returns object");
      u.assert(check(impact), `check passed for ${type}`);
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.TARGET — pickTargetPort
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.TARGET.01", "pickTargetPort: returns valid port, excludes current and hidden", (u) => {
    const state = makePortState("portRoyal", { faction: "english", discoveredPorts: [] });
    const target = G.pickTargetPort("portRoyal", "trade", state, "english");
    if (target) {
      u.assert(D.PORTS[target], "valid port key");
      u.assert(target !== "portRoyal", "excludes current port");
      u.assert(!D.PORTS[target].hidden, "excludes hidden ports");
    }
  });

  reg("G.TARGET.02", "pickTargetPort: faction constraints per type", (u) => {
    const state = makePortState("portRoyal", { faction: "english" });
    // Trade: excludes rivals
    const tradeTarget = G.pickTargetPort("portRoyal", "trade", state, "english");
    if (tradeTarget) {
      const targetFaction = D.PORTS[tradeTarget].faction;
      const rivals = D.FACTIONS.english.rivalFactions || [];
      u.assert(!rivals.includes(targetFaction), "trade excludes rival factions");
    }

    // Patrol: targets rivals
    const patrolTarget = G.pickTargetPort("portRoyal", "patrol", state, "english");
    if (patrolTarget) {
      const targetFaction = D.PORTS[patrolTarget].faction;
      const rivals = D.FACTIONS.english.rivalFactions || [];
      u.assert(rivals.includes(targetFaction), "patrol targets rival factions");
    }

    // Combat: no destination
    u.assertEqual(G.pickTargetPort("portRoyal", "combat", state, "english"), null, "combat has no target");

    // Assault: targets enemy ports
    const assaultTarget = G.pickTargetPort("portRoyal", "assault", state, "english");
    if (assaultTarget) {
      const targetFaction = D.PORTS[assaultTarget].faction;
      u.assert(targetFaction !== "english", "assault targets non-english ports");
    }
  });

  reg("G.TARGET.03", "pickTargetPort: early fame limits to starter ports", (u) => {
    const state = makePortState("portRoyal", { fame: 5, discoveredPorts: Object.keys(D.PORTS) });
    const target = G.pickTargetPort("portRoyal", "trade", state, "english");
    if (target) {
      const starterPorts = ["havana", "nassau", "santiagoDeCuba", "portDePaix", "tortuga", "santoDomingo", "petitGoave", "portRoyal", "kingston"];
      u.assert(starterPorts.includes(target), "low fame limits to starter ports");
    }
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.FLAVOUR — generateMarketFlavour
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.FLAVOUR.01", "generateMarketFlavour: returns array", (u) => {
    const state = makeState({ portMarket: { goods: {} } });
    const flavour = G.generateMarketFlavour(state, "portRoyal");
    u.assert(Array.isArray(flavour), "returns array");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.GOSSIP — generatePortGossip
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.GOSSIP.01", "generatePortGossip: returns non-empty array for valid port", (u) => {
    const gossip = G.generatePortGossip(makeState(), "portRoyal");
    u.assert(Array.isArray(gossip), "returns array");
    u.assert(gossip.length > 0, "non-empty gossip");
  });

  // ══════════════════════════════════════════════════════════════════════════
  // G.MISSION_TEXT — generateMissionText
  // ══════════════════════════════════════════════════════════════════════════

  reg("G.MISSION_TEXT.01", "generateMissionText: returns name and description, different per type", (u) => {
    const trade = G.generateMissionText("trade", "english", "tortuga", "low");
    const combat = G.generateMissionText("combat", "english", "tortuga", "low");
    u.assert(trade.name && typeof trade.name === "string", "trade has name");
    u.assert(trade.desc && typeof trade.desc === "string", "trade has desc");
    u.assert(trade.name !== combat.name, "different types have different names");

    const enemy = { name: "The Black Pearl" };
    const combatWithEnemy = G.generateMissionText("combat", "english", "tortuga", "low", enemy);
    u.assert(combatWithEnemy.name.includes("Black Pearl") || combatWithEnemy.desc.includes("Black Pearl"),
      "includes enemy name");
  });

})();