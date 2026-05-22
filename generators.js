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

    //------------------------------------------------------------------
  // ── crew generators (migrated from logic.js) ──────────────────
  //------------------------------------------------------------------

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

  //------------------------------------------------------------------
  // ── mission generators (new) ──────────────────────────────────
  //------------------------------------------------------------------

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
    const tier = window.L.getFameTier(fame);
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
    const tier = window.L.getFameTier(fame);
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
  
  const generateMissionText = (type, faction, targetPortKey, risk, enemy) => {
    const parts = window.D.MISSION_NAME_PARTS;
    const portName = window.D.PORTS[targetPortKey]?.name || "unknown waters";
    const factionLabel = window.D.FACTIONS[faction]?.label || faction;
    const factionAdj = pickRandom(parts.factionAdj[faction] || ["Foreign"]);
    const riskAdj = { low: "routine", medium: "dangerous", high: "perilous" }[risk] || "";
    const cargo = pickRandom(parts.cargo);
    const contraband = pickRandom(parts.contraband);
    const region = pickRandom(parts.regionAdj);

    let name = "";
    let desc = "";

    switch (type) {
      case "escort":
        name = `Escort ${cargo} to ${portName}`;
        desc = `The ${factionAdj} merchants need safe passage for ${cargo} to ${portName}. Deliver them without incident.`;
        break;
      case "patrol":
        name = `Patrol the ${region} waters`;
        desc = `Clear ${factionAdj} waters of hostile vessels. Return when the route is safe.`;
        break;
      case "combat":
        name = `Hunt down ${enemy?.name || "the enemy"}`;
        desc = `${enemy?.name || "A hostile vessel"} has been raiding ${factionAdj} ships. Find them and sink them.`;
        break;
      case "smuggle":
        name = `Smuggle ${contraband} to ${portName}`;
        desc = `Get ${contraband} past the ${factionLabel} patrols to ${portName}. Ask no questions. This is ${riskAdj} work.`;
        break;
      case "assault":
        name = `Assault ${portName}`;
        desc = `Take ${portName} by force. Show the ${factionLabel} the cost of defiance.`;
        break;
      default:
        name = "Unknown mission";
        desc = "Details unclear.";
    }

    return { name, desc };
  };

  // Pick a destination port, respecting faction politics
  const pickTargetPort = (currentPortKey, type, state, faction) => {
    if (type === "combat" || type === "patrol") return null; // no destination

    const allPorts = Object.keys(window.D.PORTS);
    const commissioningFac = faction; // the faction offering the mission

    let eligible = allPorts.filter(k => k !== currentPortKey);

    if (type === "assault") {
      // Only ports whose faction is different from the commissioning faction
      eligible = eligible.filter(k => window.D.PORTS[k].faction !== commissioningFac);
    } else {
      // trade/escort/smuggle: exclude enemy (rival) factions
      const rivals = window.D.FACTIONS[commissioningFac]?.rivalFactions || [];
      eligible = eligible.filter(k => !rivals.includes(window.D.PORTS[k].faction));
    }

    if (eligible.length === 0) return null;
    return pickRandom(eligible);
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
    const portRivals = window.D.FACTIONS[port.faction]?.rivalFactions || [];
    const eligibleFactions = [port.faction];
    Object.keys(window.D.FACTIONS).forEach(factionKey => {
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
        smuggle: 2,
        assault: 1,
      };
    };

    const riskWeightsFor = (fame) => {
      const tier = window.L.getFameTier(fame);
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

      // Override faction for smuggle → pirate
      const missionFaction = type === "smuggle" ? "pirate" : faction;

      const riskWeights = riskWeightsFor(state.fame ?? 0);
      // Assault always uses assault risk; others use low/med/high
      const riskPool = type === "assault" ? ["assault"] : ["low", "medium", "high"];
      const riskWArr = riskPool.map(r => riskWeights[r]);
      const risk = pickWeighted(riskPool, riskWArr);

      const targetPort = pickTargetPort(portKey, type, state, missionFaction);

      const enemy = (type === "combat" || type === "smuggle" || type === "assault")
        ? (type === "assault"
            ? generateEnemyForAssault(targetPort, state.fame ?? 0)
            : generateEnemy(risk, state.fame ?? 0, missionFaction))
        : null;

      const gold        = generateGold(type, risk, state.fame ?? 0);
      const fame        = type === "assault" ? 3 : risk === "high" ? 2 : 1;
      const infamyGain  = type === "smuggle" ? 1 : type === "assault" ? (risk === "high" ? 3 : 2) : 0;
      const defendingFaction = (type === "assault" && targetPort)
        ? PORTS[targetPort]?.faction : null;
      const repImpact   = generateRepImpact(type, missionFaction, risk, defendingFaction);
      const { name, desc } = generateMissionText(type, missionFaction, targetPort, risk, enemy);

      missions.push({
        type, name, description: desc, faction: missionFaction,
        targetPort: targetPort || null,
        risk, gold, fame, infamyGain, repImpact, enemy,
      });
    }

    return missions;
  };

/// ---------------------------------

// resource, port market genration

//--------------------------------------


const generatePortMarket = (portKey) => {
  const resources   = window.D.RESOURCES;
  const availability = window.D.GOODS_AVAILABILITY[portKey] || [];
  const goodKeys    = Object.keys(resources);

  // Column order must match data.js comment
  const colOrder = [
    "food","water","rum","sugar","timber","cloth","spices","silk",
    "coffee","cocoa","weapons","tobacco","silver","slaves"
  ];

  // Appearance chance per tier and quantities per tier
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

    // Roll market price
    const variance = res.basePrice * res.variance;
    const marketPrice = isFixed
      ? res.basePrice
      : Math.round(res.basePrice + randBetween(-variance, variance));

    const buyFromPort  = isFixed ? res.basePrice : Math.round(marketPrice * 1.10);
    const sellToPort   = isFixed ? res.basePrice : Math.round(marketPrice * 0.90);

    // Quantity – tier-based for trade goods, 999 for food/water
    let available;
    if (good === "food" || good === "water") {
      available = 999;
    } else {
      const tier = availability[idx] || "never";
      const qtyRange = tierQtyRanges[tier];
      available = qtyRange ? randInt(qtyRange.min, qtyRange.max) : 0;
    }

    goods[good] = { basePrice: res.basePrice, buyFromPort, sellToPort, available };
  });

  return { portKey, goods };
};






  // ── exports ───────────────────────────────────────────────────
  return {
    // crew (migrated)
    generateCrewMember,
    generateRoster,
    // missions (new)
    generateMissions,
    generateEnemy,
    generateEnemyName,
    generateMissionText,
    generateGold,
    generateRepImpact,
    pickTargetPort,
    opposingFaction,
    generatePortMarket
  };

})();