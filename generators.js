// ═══════════════════════════════════════════════════════════════════
//  generators.js — ALL RUNTIME CONTENT GENERATORS
//  Functions that use Math.random to produce game content at runtime.
//  No pure game logic here — that lives in logic.js.
//  Reads: window.D (data constants), window.L (pure logic helpers)
//  Exposed as: window.G
// ═══════════════════════════════════════════════════════════════════

window.G = (() => {

  // ── private helpers ────────────────────────────────────────────
  const randBetween = (min, max) => min + Math.random() * (max - min);
  const randInt = (min, max) => Math.floor(randBetween(min, max + 1));
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const pickWeighted = (items, weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };

  // ── crew generators (migrated from logic.js) ──────────────────

  const pickWeightedRole = () => {
    const { CREW_ROLES } = window.D;
    const total = CREW_ROLES.reduce((s, r) => s + r.weight, 0);
    let roll = Math.random() * total;
    for (let r of CREW_ROLES) {
      roll -= r.weight;
      if (roll <= 0) return r.role;
    }
    return "deckhand"; // fallback
  };

  const generateCrewMember = (faction, existingNames = []) => {
    const { CREW_FIRST_NAMES, CREW_LAST_NAMES } = window.D;
    const firstList = CREW_FIRST_NAMES[faction] || CREW_FIRST_NAMES.pirate;
    const lastList  = CREW_LAST_NAMES[faction]  || CREW_LAST_NAMES.pirate;

    let firstName, lastName, fullName;
    let attempts = 0;
    do {
      firstName = pickRandom(firstList);
      lastName  = pickRandom(lastList);
      fullName  = `${firstName} ${lastName}`;
      attempts++;
    } while (existingNames.includes(fullName) && attempts < 50);

    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      firstName,
      lastName,
      role: pickWeightedRole(),
      faction,
      daysAboard: 0,
    };
  };

  const generateRoster = (count, faction = "pirate") => {
    const roster = [];
    const existingNames = [];
    for (let i = 0; i < count; i++) {
      const member = generateCrewMember(faction, existingNames);
      roster.push(member);
      existingNames.push(`${member.firstName} ${member.lastName}`);
    }
    return roster;
  };

// ---- MARKET GENRATORS ---------------------------------

  // ── port market generator ─────────────────────────────────────
  const generatePortMarket = (portKey) => {
    const resources   = window.D.RESOURCES;
    const availability = window.D.GOODS_AVAILABILITY[portKey] || [];
    const goodKeys    = Object.keys(resources);

    // Column order in GOODS_AVAILABILITY rows (must match data.js comment):
    const colOrder = [
      "food","water","rum","sugar","timber","cloth","spices","silk",
      "coffee","cocoa","weapons","tobacco","silver","slaves"
    ];

    // Appearance chance per tier
    const tierChance = {
      always:     1.0,
      frequently: 0.66,
      sometimes:  0.33,
      rarely:     0.10,
      never:      0.0,
    };

    const tierQtyRanges = {
      always:     { min: 40, max: 80  },
      frequently: { min: 20, max: 40  },
      sometimes:  { min: 8,  max: 20  },
      rarely:     { min: 2,  max: 8   },
      never:      null,
    };

    const goods = {};

    colOrder.forEach((good, idx) => {
      const tier = availability[idx] || "never";
      const chance = tierChance[tier] ?? 0;
      if (chance === 0 || Math.random() > chance) return; // didn't appear this visit

      const res = resources[good];
      const isFixed = res.variance === 0;

      // Roll market price (basePrice ± variance)
      const variance = res.basePrice * res.variance;
      const marketPrice = isFixed
        ? res.basePrice
        : Math.round(res.basePrice + randBetween(-variance, variance));

      // Buy from port (player pays) and sell to port (player receives)
      const buyFromPort  = isFixed ? res.basePrice : Math.round(marketPrice * 1.10);
      const sellToPort   = isFixed ? res.basePrice : Math.round(marketPrice * 0.90);

      // Quantity – tier-based for trade goods, 999 for food/water
      let available;
      if (good === "food" || good === "water") {
        available = 999;
      } else {
        const range = tierQtyRanges[tier];
        available = range ? randInt(range.min, range.max) : 0;
      }

      goods[good] = {
        basePrice: res.basePrice,
        buyFromPort,
        sellToPort,
        available,
      };
    });

    return { portKey, goods };
  };

  // -------- PLUNDER /CARGO GENERATOR ----------------------


  const generateEnemyCargo = (state, enemy, risk = "medium") => {
  const tier = window.L.getFameInfo(state.fame ?? 0).tier;
  const target = window.D.PLUNDER_TARGET[tier]?.[risk];
  if (!target) return { gold: 0, cargo: {} }; // assault or invalid

  const goldRatio = window.D.PLUNDER_GOLD_RATIO || 0.20;
  const gold = Math.round(target * goldRatio);
  const cargoValueTarget = target - gold;

  // ── Faction goods pool ──────────────────────────────────────
  const factionPool = window.D.FACTION_PLUNDER_GOODS[enemy.faction]
    || window.D.FACTION_PLUNDER_GOODS.english;
  const goodsList = factionPool.map(p => p.good);
  const weights   = factionPool.map(p => p.weight);

  // Pick 2–4 distinct goods
  const numGoods = Math.min(2 + Math.floor(Math.random() * 3), goodsList.length);
  const chosenGoods = [];
  const tempList = [...goodsList];
  const tempWeights = [...weights];
  for (let i = 0; i < numGoods; i++) {
    const idx = pickWeighted(tempList, tempWeights);
    chosenGoods.push(idx);
    const removeIdx = tempList.indexOf(idx);
    tempList.splice(removeIdx, 1);
    tempWeights.splice(removeIdx, 1);
  }

  // Distribute cargo value proportionally among chosen goods
  const cargo = {};
  const fractions = chosenGoods.map(() => Math.random() + 0.5);
  const totalFrac = fractions.reduce((a, b) => a + b, 0);
  let allocatedValue = 0;
  chosenGoods.forEach((good, i) => {
    const isLast = i === chosenGoods.length - 1;
    const goodBasePrice = window.D.RESOURCES[good]?.basePrice || 100;
    const valueShare = isLast
      ? cargoValueTarget - allocatedValue
      : Math.round(cargoValueTarget * (fractions[i] / totalFrac));
    const qty = Math.max(1, Math.round(valueShare / goodBasePrice));
    cargo[good] = (cargo[good] || 0) + qty;
    allocatedValue += qty * goodBasePrice;
  });

  // Small flavour food/water
  const crew = enemy.crew || 20;
  cargo.food = (cargo.food || 0) + Math.ceil(crew * 0.1);
  cargo.water = (cargo.water || 0) + Math.ceil(crew * 0.1);

  return { gold, cargo };
};



  // ── mission generators ────────────────────────────────────────

  // Pick a random enemy faction for the given faction, using rivalFactions
  const opposingFaction = (factionKey) => {
    const fac = window.D.FACTIONS[factionKey];
    const rivals = fac?.rivalFactions;
    if (rivals && rivals.length > 0) return pickRandom(rivals);
    return "pirate"; // ultimate fallback
  };

  // Ship name like "The Black Serpent"
  const generateEnemyName = (faction) => {
    const { adjectives, nouns } = window.D.ENEMY_SHIP_NAMES;
    return `The ${pickRandom(adjectives)} ${pickRandom(nouns)}`;
  };

  // Build a full enemy object
  const generateEnemy = (risk, fame, faction) => {
    const tier = window.L.getFameInfo(fame).tier;;
    const riskFactors = { low: 0.0, medium: 0.5, high: 1.0, assault: 1.4 };
    const rf = riskFactors[risk] ?? 0.5;

    const pick = (rangeObj) => {
      const [min, max] = rangeObj[tier];
      const span = max - min;
      const effectiveMax = risk === "assault" ? min + span * 1.6 : max;
      const noise = randBetween(0, span * 0.15);
      return Math.round(Math.min(effectiveMax, Math.max(min, min + span * rf + noise)));
    };

    const ranges = window.D.MISSION_ENEMY_RANGES;
    return {
      name:    generateEnemyName(faction),
      faction: opposingFaction(faction),
      hull:    pick(ranges.hull),
      cannons: pick(ranges.cannons),
      crew:    pick(ranges.crew),
    };
  };

  // Assault enemy — uses the defending port's faction
  const generateEnemyForAssault = (targetPortKey, fame) => {
    const port = window.D.PORTS[targetPortKey];
    const faction = port?.faction || "spanish";
    return generateEnemy("assault", fame, faction);
  };

  // Gold reward, rounded to nearest 25
  const generateGold = (type, risk, fame) => {
    const tier = window.L.getFameInfo(fame).tier;;
    const effectiveRisk = type === "assault" ? "assault" : risk;
    const [min, max] = window.D.MISSION_GOLD_RANGES[tier][effectiveRisk];
    const raw = randBetween(min, max);
    return Math.round(raw / 25) * 25;
  };

  // Reputation impact object: { factionKey: delta, ... }
  const generateRepImpact = (type, commissioningFaction, risk, defendingFaction) => {
    const impacts = window.D.MISSION_REP_IMPACTS;
    const impact = {};

    if (type === "smuggle") {
      impact["pirate"] = impacts.smuggle.any;
      if (defendingFaction) impact[defendingFaction] = -3;
      return impact;
    }

    const positiveDelta = impacts[type]?.[risk] ?? impacts[type]?.any ?? 2;
    impact[commissioningFaction] = positiveDelta;

    if (type === "patrol" || type === "combat") {
      const enemy = opposingFaction(commissioningFaction);
      impact[enemy] = -(positiveDelta - 1);
    }
    if (type === "assault" && defendingFaction) {
      impact[commissioningFaction] = impacts.assault.any;
      impact[defendingFaction] = -8;
    }

    return impact;
  };

  // Mission text: name and description
  const generateMissionText = (type, faction, targetPortKey, risk, enemy) => {
    const parts = window.D.MISSION_NAME_PARTS;
    const portName = window.D.PORTS[targetPortKey]?.name || "unknown waters";
    const factionAdj = pickRandom(parts.factionAdj[faction] || ["Foreign"]);
    const riskAdj = { low: "routine", medium: "dangerous", high: "perilous" }[risk] || "";

    const templates = {
      escort: {
        name: `Escort the ${pickRandom(parts.cargo)} to ${portName}`,
        desc: `The ${factionAdj} merchants need safe passage to ${portName}. Deliver them without incident.`,
      },
      patrol: {
        name: `Patrol the ${pickRandom(parts.regionAdj)} waters`,
        desc: `Clear ${factionAdj} waters of hostile vessels. Return when the route is safe.`,
      },
      combat: {
        name: `Hunt down ${enemy?.name || "the enemy"}`,
        desc: `${enemy?.name || "A hostile vessel"} has been raiding our ships. Find them and sink them.`,
      },
      smuggle: {
        name: `Smuggle contraband to ${portName}`,
        desc: `Get the goods to ${portName} without inspection.`,
      },
      assault: {
        name: `Assault ${portName}`,
        desc: `Take ${portName} by force. Show them the cost of defiance. This is ${riskAdj} work.`,
      },
    };

    return templates[type] || { name: "Unknown mission", desc: "Details unclear." };
  };

  // Pick a destination port, respecting faction politics
  const pickTargetPort = (currentPortKey, type, state, faction) => {
    if (type === "combat" || type === "patrol") return null; // no destination

    const allPorts = Object.keys(window.D.PORTS);
    let eligible = allPorts.filter(k => k !== currentPortKey);

    if (type === "assault") {
      // Only ports whose faction is different from the commissioning faction
      eligible = eligible.filter(k => window.D.PORTS[k].faction !== faction);
    } else if (type === "smuggle") {
      // Exclude pirate ports — you smuggle TO colonial powers, not pirate havens
      eligible = eligible.filter(k => window.D.PORTS[k].faction !== "pirate");
    } else {
      // trade, escort: exclude enemy (rival) factions
      const rivals = window.D.FACTIONS[faction]?.rivalFactions || [];
      eligible = eligible.filter(k => !rivals.includes(window.D.PORTS[k].faction));
    }
    // Exclude hidden ports that the player hasn't discovered yet
    eligible = eligible.filter(k => !window.D.PORTS[k].hidden || (state.discoveredPorts || []).includes(k));

    if (eligible.length === 0) return null;
    return pickRandom(eligible);
  };

  // ── Trade mission generator ──────────────────────────────────
  const generateTradeMission = (portKey, state, faction, risk) => {
    const tier = window.L.getFameInfo(state.fame ?? 0).tier;;
    const eligibleGoods = window.D.TRADE_GOODS_BY_TIER[tier] || window.D.TRADE_GOODS_BY_TIER[0];

    const good = pickRandom(eligibleGoods);
    const res = window.D.RESOURCES[good];
    if (!res) return null;

    // Quantity: % of current hold capacity by risk
    const holdCapacity = state.hold?.capacity || 200;
    const holdPct = { low: 0.10, medium: 0.25, high: 0.50 }[risk] || 0.10;
    const requiredQty = Math.max(3, Math.round(holdCapacity * holdPct));

    // Gold: base price × qty × (1 + profitMargin), rounded to 25g
    const margin = window.D.TRADE_MISSION_PROFIT_MARGINS[risk] || 0.60;
    const expectedCost = res.basePrice * requiredQty;
    const gold = Math.round(expectedCost * (1 + margin) / 25) * 25;

    const targetPort = pickTargetPort(portKey, "trade", state, faction);
    if (!targetPort) return null;

    const targetPortName = window.D.PORTS[targetPort]?.name || "unknown port";
    const factionAdj = pickRandom(window.D.MISSION_NAME_PARTS.factionAdj[faction] || ["Foreign"]);
    const fame = risk === "high" ? 2 : 1;
    const repImpact = { [faction]: window.D.MISSION_REP_IMPACTS.trade?.[risk] ?? 2 };

    return {
      type: "trade",
      name: `Deliver ${res.name} to ${targetPortName}`,
      description: `The ${factionAdj} factor requires ${requiredQty} ${res.unit} of ${res.name} at ${targetPortName}. Source the goods yourself and deliver — you will be paid in full on arrival.`,
      faction,
      targetPort,
      risk,
      gold,
      fame,
      infamyGain: 0,
      repImpact,
      enemy: null,
      requiredGood: good,
      requiredQty,
    };
  };

  // ── Smuggle mission generator ────────────────────────────────
  const generateSmuggleMission = (portKey, state, risk) => {
    const tier = window.L.getFameInfo(state.fame ?? 0).tier;;
    const infamy = state.infamy ?? 0;

    // Good pool by tier + infamy gating
    let eligibleGoods = window.D.SMUGGLE_GOODS_BY_TIER[tier] || ["rum", "tobacco"];
    // Slaves only appear at medium+ risk and infamy >= 25
    if (risk === "low" || infamy < 25) {
      eligibleGoods = eligibleGoods.filter(g => g !== "slaves");
    }
    if (eligibleGoods.length === 0) eligibleGoods = ["tobacco"];

    // Infamy weighting: high infamy increases slave probability
    let good;
    if (eligibleGoods.includes("slaves") && infamy >= 50 && Math.random() < 0.50) {
      good = "slaves";
    } else {
      good = pickRandom(eligibleGoods);
    }

    const res = window.D.RESOURCES[good];
    if (!res) return null;

    // Quantity: hold % by risk, with infamy multiplier for slaves at high infamy
    const holdCapacity = state.hold?.capacity || 200;
    const holdPct = { low: 0.08, medium: 0.18, high: 0.35 }[risk] || 0.08;
    const infamyQtyMult = (good === "slaves" && infamy >= 50 && risk === "high") ? 1.5 : 1.0;
    const requiredQty = Math.max(2, Math.round(holdCapacity * holdPct * infamyQtyMult));

    // Gold: delivery fee
    const margin = window.D.SMUGGLE_PROFIT_MARGINS[risk] || 0.80;
    const expectedCost = res.basePrice * requiredQty;
    const gold = Math.round(expectedCost * (1 + margin) / 25) * 25;

    // Intercept chance: one high-probability check per voyage
    const interceptChance = { low: 0.70, medium: 0.80, high: 0.90 }[risk] || 0.70;

    // Infamy on completion: always +1
    const infamyGain = 1;

    const targetPort = pickTargetPort(portKey, "smuggle", state, "pirate");
    if (!targetPort) return null;

    const targetPortName = window.D.PORTS[targetPort]?.name || "unknown port";
    const targetFaction = window.D.PORTS[targetPort]?.faction || "english";
    const goodName = res.name;
    const goodUnit = res.unit;
    const sourceHint = res.sourceHint || "";
    const riskLabel = { low: "routine", medium: "dangerous", high: "perilous" }[risk] || "";
    const infamyWarning = good === "slaves"
      ? " Purchasing this cargo will darken your reputation."
      : "";

    const fame = risk === "high" ? 2 : 1;

    // Rep: +pirate, -receiving faction
    const repImpact = {
      pirate: window.D.MISSION_REP_IMPACTS.smuggle?.any ?? 2,
      [targetFaction]: -3,
    };

    return {
      type: "smuggle",
      name: `Smuggle ${goodName} to ${targetPortName}`,
      description: `Get ${requiredQty} ${goodUnit} of ${goodName} to ${targetPortName} without inspection. ${riskLabel.charAt(0).toUpperCase() + riskLabel.slice(1)} work — patrols are active.${infamyWarning} ${sourceHint}`,
      faction: "pirate",
      targetPort,
      risk,
      gold,
      fame,
      infamyGain,
      repImpact,
      enemy: generateEnemy(risk, state.fame ?? 0, "pirate"),
      requiredGood: good,
      requiredQty,
      interceptChance,
      isContraband: good !== "rum",
    };
  };

  // ═══════════════════════════════════════════════════════════════
  //  MAIN ENTRY POINT — generateMissions
  // ═══════════════════════════════════════════════════════════════
  const generateMissions = (portKey, state) => {
    const { PORTS, FACTIONS } = window.D;
    const port = PORTS[portKey];
    if (!port) return [];

    const perk = window.L.getRepPerk(state.reputation?.[portKey] ?? 50);
    if (perk.servicesBlocked) return []; // At War

    // Port faction + any faction not a rival of the port faction
    const portRivals = FACTIONS[port.faction]?.rivalFactions || [];
    const eligibleFactions = [port.faction];
    Object.keys(FACTIONS).forEach(factionKey => {
      if (factionKey !== port.faction && !portRivals.includes(factionKey)) {
        eligibleFactions.push(factionKey);
      }
    });

    const count = Math.random() < 0.5 ? 2 : 3;
    const missions = [];

    const typeWeightsFor = (faction) => {
      const isPirate = faction === "pirate";
      return {
        escort:  3,
        patrol:  isPirate ? 0 : 2,
        combat:  2,
        smuggle: 1,
        trade:   isPirate ? 0 : 3,
        assault: 1,
      };
    };

    const riskWeightsFor = (fame) => {
      const tier = window.L.getFameInfo(fame).tier;;
      const table = [
        { low:5, medium:4, high:1, assault:0 },
        { low:4, medium:4, high:2, assault:0 },
        { low:3, medium:4, high:3, assault:0 },
        { low:2, medium:3, high:4, assault:1 },
        { low:1, medium:3, high:4, assault:2 },
      ];
      return table[tier];
    };

    for (let i = 0; i < count; i++) {
      const faction = pickRandom(eligibleFactions);
      const typeWeights = typeWeightsFor(faction);
      const types = Object.keys(typeWeights).filter(t => typeWeights[t] > 0);
      const weights = types.map(t => typeWeights[t]);
      const type = pickWeighted(types, weights);
      const missionFaction = type === "smuggle" ? "pirate" : faction;

      const riskWeights = riskWeightsFor(state.fame ?? 0);
      const riskPool = type === "assault" ? ["assault"] : ["low", "medium", "high"];
      const riskWArr = riskPool.map(r => riskWeights[r] || 0);
      const risk = pickWeighted(riskPool, riskWArr);

      let missionObj = null;

      if (type === "trade") {
        missionObj = generateTradeMission(portKey, state, missionFaction, risk);
      } else if (type === "smuggle") {
        missionObj = generateSmuggleMission(portKey, state, risk);
      } else {
        // escort, patrol, combat, assault — existing construction
        const targetPort = pickTargetPort(portKey, type, state, missionFaction);
        const enemy = (type === "combat" || type === "assault")
          ? (type === "assault"
              ? generateEnemyForAssault(targetPort, state.fame ?? 0)
              : generateEnemy(risk, state.fame ?? 0, missionFaction))
          : null;
        const gold = generateGold(type, risk, state.fame ?? 0);
        const fame = type === "assault" ? 3 : risk === "high" ? 2 : 1;
        const infamyGain = type === "assault" ? (risk === "high" ? 3 : 2) : 0;
        const defendingFaction = (type === "assault" && targetPort)
          ? PORTS[targetPort]?.faction : null;
        const repImpact = generateRepImpact(type, missionFaction, risk, defendingFaction);
        const { name, desc } = generateMissionText(type, missionFaction, targetPort, risk, enemy);
        missionObj = {
          type, name, description: desc, faction: missionFaction,
          targetPort: targetPort || null,
          risk, gold, fame, infamyGain, repImpact, enemy,
        };
      }

      if (!missionObj) continue;
      missions.push(missionObj);
    }

    // Fallback: ensure at least 1 mission always returned
    if (missions.length === 0) {
      const fallbackGold = generateGold("escort", "low", state.fame ?? 0);
      const fallback = {
        type: "escort",
        name: "Escort the merchant fleet",
        faction: port.faction,
        description: "Safe passage required.",
        targetPort: null,
        risk: "low",
        gold: fallbackGold,
        fame: 1,
        infamyGain: 0,
        repImpact: { [port.faction]: 2 },
        enemy: null,
      };
      missions.push(fallback);
    }

    return missions;
  };

  // ── exports ───────────────────────────────────────────────────
  return {
    // crew (migrated)
    generateCrewMember,
    generateRoster,
    generateEnemyCargo,
    // missions
    generateMissions,
    generateEnemy,
    generateEnemyName,
    generateMissionText,
    generateGold,
    generateRepImpact,
    pickTargetPort,
    opposingFaction,
    generateTradeMission,
    generateSmuggleMission,
    // port market
    generatePortMarket,
  };

})();