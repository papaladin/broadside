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

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const isExtremePrice = (good, buyPrice) => {
  const res = window.D.RESOURCES[good];
  if (!res || res.variance === 0) return null; // fixed-price goods like food/water
  const min = res.basePrice * (1 - res.variance);
  const max = res.basePrice * (1 + res.variance);
  const range = max - min;
  if (range <= 0) return null;
  const pct = (buyPrice - min) / range; // 0 = min, 1 = max
  if (pct <= 0.20) return { type: "surplus", deviation: 0.20 - pct };
  if (pct >= 0.80) return { type: "shortage", deviation: pct - 0.80 };
  return null;
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
    } while (existingNames.includes(fullName) && firstName === lastName && attempts < 50);

    const member = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      firstName,
      lastName,
      role: pickWeightedRole(),
      faction,
      daysAboard: 0,
      tags: [], 
    };
     // 5% chance of one hidden trait (max 1)
    const traitRoll = Math.random();
    if (traitRoll < 0.02) member.tags.push("hidden_drunkard");
    else if (traitRoll < 0.03) member.tags.push("hidden_coward");
    else if (traitRoll < 0.04) member.tags.push("hidden_greedy");
    else if (traitRoll < 0.05) member.tags.push("hidden_troublemaker");

    return member;

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

const generateCrewBio = (member, state) => {
  const days = member.daysAboard || 0;
  const tags = member.tags || [];
  const firstName = member.firstName;
  const lastName = member.lastName;

  const lines = [];

  // ── Opening (days aboard, random variant) ──────────────────
  const factionLabel = window.D.FACTIONS[member.faction]?.label || member.faction;
  let bracket;
  if (days < 15) bracket = "newHand";
  else if (days < 50) bracket = "settling";
  else if (days < 100) bracket = "seasoned";
  else if (days < 200) bracket = "veteran";
  else bracket = "oldSalt";

  const pool = window.D.BIO_OPENINGS[bracket] || window.D.BIO_OPENINGS.newHand;
  const template = pool[Math.floor(Math.random() * pool.length)];
  lines.push(template
    .replace(/\{fn\}/g, firstName + " " + lastName)
    .replace(/\{days\}/g, String(days))
    .replace(/\{role\}/g, member.role)
    .replace(/\{factionLabel\}/g, factionLabel)
  );

  // ── Combo detection (direct from tags) ──────────────────────
  const has = (t) => tags.includes(t);
  const combos = [];

  // mutineer + X
  if (has("mutineer") && has("scar_battle"))             combos.push("m_battle");
  if (has("mutineer") && has("revealed_coward"))          combos.push("m_coward");
  if (has("mutineer") && has("scar_storm"))               combos.push("m_storm");
  if (has("mutineer") && has("scar_shipwreck"))           combos.push("mutineer_wreck");

  // drunk + X
  if (has("revealed_drunkard") && has("revealed_greedy")) combos.push("drunk_greedy");
  if (has("revealed_drunkard") && has("scar_battle"))     combos.push("drunk_battle");
  if (has("revealed_drunkard") && has("scar_shipwreck"))  combos.push("drunk_wreck");
  if (has("revealed_drunkard") && has("revealed_coward")) combos.push("drunk_coward");

  // coward + X
  if (has("revealed_coward") && has("scar_battle"))      combos.push("coward_battle");
  if (has("revealed_coward") && has("scar_storm"))       combos.push("coward_storm");
  if (has("revealed_coward") && has("scar_shipwreck"))   combos.push("coward_wreck");

  // greedy + X
  if (has("revealed_greedy") && has("scar_battle"))      combos.push("greedy_battle");

  // scar + scar
  if (has("scar_storm") && has("scar_shipwreck"))        combos.push("storm_wreck");
  if (has("scar_battle") && has("scar_storm"))            combos.push("battle_storm");
  if (has("scar_battle") && has("scar_shipwreck"))        combos.push("battle_wreck");

  // ── Special sentences (replace generic fallback lines) ─────
  const specialSentences = {
    m_battle:      "They have survived battle and mutiny alike. Some scars run deeper than others.",
    m_coward:      "They followed the mutineers, but their courage failed when it mattered most.",
    drunk_greedy:  "Their fondness for rum is matched only by their hunger for gold.",
    coward_battle: "They've seen too many battles; it has left them fearful and scarred.",
    storm_wreck:   "Twice the sea tried to claim them — a storm and a wreck. They're still here.",
    m_storm:       "After surviving a storm, they thought they could survive anything — even mutiny.",
    drunk_wreck:   "They say the drink started after the shipwreck. No one asks too many questions.",
    battle_storm:  "They have faced battle and storm alike. Neither broke them.",
    battle_wreck:  "They fought and were shipwrecked. The sea couldn't finish what battle started.",
    drunk_battle:  "They've been drinking since the battle. Some say it keeps the memories at bay.",
    coward_storm:  "Storms terrify them more than any enemy. They've earned that fear.",
    coward_wreck:  "Since the wreck, they flinch at every creak of the hull.",
    drunk_coward:  "They drink to forget what they're afraid of.",
    mutineer_wreck:"After surviving a shipwreck, they thought mutiny was their only way out.",
    greedy_battle: "They survived a deadly battle and now demand a larger share for it.",
  };

  // ── Determine which generic slots are suppressed ──────────
  let suppressScars = false;
  let suppressTraits = false;
  let suppressMutineer = false;

  if (combos.includes("m_battle") || combos.includes("m_storm")) {
    suppressMutineer = true;
    suppressScars = true;
  }
  if (combos.includes("m_coward")) {
    suppressMutineer = true;
    suppressTraits = true;
  }
  if (combos.includes("drunk_greedy")) suppressTraits = true;
  if (combos.includes("coward_battle")) { suppressTraits = true; suppressScars = true; }
  if (combos.includes("storm_wreck")) suppressScars = true;
  if (combos.includes("drunk_wreck")) { suppressTraits = true; suppressScars = true; }

  if (combos.includes("battle_storm") || combos.includes("battle_wreck")) suppressScars = true;
  if (combos.includes("drunk_battle")) { suppressTraits = true; suppressScars = true; }
  if (combos.includes("coward_storm") || combos.includes("coward_wreck")) { suppressTraits = true; suppressScars = true; }
  if (combos.includes("drunk_coward")) suppressTraits = true;
  if (combos.includes("mutineer_wreck")) { suppressMutineer = true; suppressScars = true; }
  if (combos.includes("greedy_battle")) { suppressTraits = true; suppressScars = true; }

  // Output special sentences
  for (const c of combos) lines.push(specialSentences[c]);

  // ── Generic fallback lines (if not suppressed) ───────────
  const scarLabel = {
    scar_battle:     "deadly battle",
    scar_storm:      "violent storm",
    scar_shipwreck:  "shipwreck",
  };
  const traitLabel = {
    revealed_drunkard:   "have a fondness for rum",
    revealed_coward:     "lose their nerve when danger looms",
    revealed_greedy:     "always look for a bigger cut",
  };

  // Variant pools for single scars
  const scarVariants = {
    scar_battle: [
      (label) => `They carry the scars of a ${label}.`,
      (label) => `A ${label} left its mark on them.`,
      (label) => `The ${label} nearly killed them, but they're still here.`,
      (label) => `Still bearing wounds from a ${label}.`,
    ],
    scar_storm: [
      (label) => `They carry the scars of a ${label}.`,
      (label) => `A ${label} left its mark on them.`,
      (label) => `The ${label} nearly killed them, but they're still here.`,
      (label) => `Still bearing wounds from a ${label}.`,
    ],
    scar_shipwreck: [
      (label) => `They carry the scars of a ${label}.`,
      (label) => `A ${label} left its mark on them.`,
      (label) => `The ${label} nearly killed them, but they're still here.`,
      (label) => `Still bearing wounds from a ${label}.`,
    ],
  };

  // Variant pools for single traits
  const traitVariants = {
    revealed_drunkard: [
      (desc) => `Known to ${desc}.`,
      (desc) => `Has a habit of ${desc.replace("have a fondness for rum", "drinking more than their share")}.`,
      (desc) => `The crew whispers that they ${desc}.`,
    ],
    revealed_coward: [
      (desc) => `Known to ${desc}.`,
      (desc) => `Not the bravest soul aboard. The crew has noticed.`,
      (desc) => `They tend to ${desc} — everyone knows it.`,
    ],
    revealed_greedy: [
      (desc) => `Known to ${desc}.`,
      (desc) => `Counts every coin twice and still thinks they're owed more.`,
      (desc) => `Always ${desc.replace("always look for a bigger cut", "angling for a larger share")}.`,
    ],
  };

  if (!suppressScars) {
    const activeScars = tags.filter(t => scarLabel[t]);
    if (activeScars.length === 1) {
      const scar = activeScars[0];
      const variants = scarVariants[scar] || [];
      if (variants.length > 0) {
        const pick = variants[Math.floor(Math.random() * variants.length)];
        lines.push(pick(scarLabel[scar]));
      } else {
        lines.push(`They carry the scars of a ${scarLabel[scar]}.`);
      }
    } else if (activeScars.length === 2) {
      lines.push(`They have survived a ${scarLabel[activeScars[0]]} and a ${scarLabel[activeScars[1]]}.`);
    } else if (activeScars.length >= 3) {
      lines.push(`They have survived a ${scarLabel[activeScars[0]]}, a ${scarLabel[activeScars[1]]}, and a ${scarLabel[activeScars[2]]}.`);
    }
  }

  if (!suppressTraits) {
    const activeTraits = tags.filter(t => traitLabel[t]);
    if (activeTraits.length === 1) {
      const trait = activeTraits[0];
      const variants = traitVariants[trait] || [];
      if (variants.length > 0) {
        const pick = variants[Math.floor(Math.random() * variants.length)];
        lines.push(pick(traitLabel[trait]));
      } else {
        lines.push(`Known to ${traitLabel[trait]}.`);
      }
    } else if (activeTraits.length === 2) {
      lines.push(`Known to ${traitLabel[activeTraits[0]]} and ${traitLabel[activeTraits[1]]}.`);
    } else if (activeTraits.length >= 3) {
      lines.push("Known to drink, shrink from danger, and demand a larger share.");
    }
  }

  if (!suppressMutineer && has("mutineer"))
    lines.push("Their involvement in the mutiny is a stain that will never wash off.");

  return lines.join(" ");
};




// ---- MARKET GENRATORS ---------------------------------

  // ── port market generator ─────────────────────────────────────
  const generatePortMarket = (portKey) => {
    const resources   = window.D.RESOURCES;
    const availability = window.D.GOODS_AVAILABILITY[portKey] || [];

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
  if (type === "combat") return null; // no destination

  const allPorts = Object.keys(window.D.PORTS);
  let eligible = allPorts.filter(k => k !== currentPortKey);

  if (type === "assault") {
    // Only ports whose faction is different from the commissioning faction
    eligible = eligible.filter(k => window.D.PORTS[k].faction !== faction);
  } else if (type === "smuggle") {
    // Exclude pirate ports — you smuggle TO colonial powers, not pirate havens
    eligible = eligible.filter(k => window.D.PORTS[k].faction !== "pirate");
  } else if (type === "patrol") {
    // Patrol: target a port of a rival faction
    const rivals = window.D.FACTIONS[faction]?.rivalFactions || [];
    eligible = eligible.filter(k => rivals.includes(window.D.PORTS[k].faction));
    if (eligible.length === 0) {
      // fallback: any port of a different faction
      eligible = allPorts.filter(k => k !== currentPortKey && window.D.PORTS[k].faction !== faction);
    }
  } else {
    // trade, escort: exclude enemy (rival) factions
    const rivals = window.D.FACTIONS[faction]?.rivalFactions || [];
    eligible = eligible.filter(k => !rivals.includes(window.D.PORTS[k].faction));
  }

  // Exclude hidden ports that the player hasn't discovered yet
  eligible = eligible.filter(k => !window.D.PORTS[k].hidden || (state.discoveredPorts || []).includes(k));

  // NEW: Early-game restriction — limit target ports for fame < 10
  if ((state.fame ?? 0) < 10) {
    const starterPorts = [
      "havana", "nassau", "santiagoDeCuba", "portDePaix", "tortuga",
      "santoDomingo", "petitGoave", "portRoyal", "kingston"
    ];
    eligible = eligible.filter(k => starterPorts.includes(k));
  }

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
    const interceptChance = { low: 0.30, medium: 0.35, high: 0.40 }[risk] || 0.35;

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
  //  MISSION GENERATION HELPERS  (private)
  // ═══════════════════════════════════════════════════════════════

  const getEligibleFactions = (portKey, state) => {
    const port = window.D.PORTS[portKey];
    if (!port) return [];
    const perk = window.L.getRepPerk(state.reputation?.[portKey] ?? 50);
    if (perk.servicesBlocked) return []; // At War

    const portRivals = window.D.FACTIONS[port.faction]?.rivalFactions || [];
    const eligible = [port.faction];
    Object.keys(window.D.FACTIONS).forEach(factionKey => {
      if (factionKey !== port.faction && !portRivals.includes(factionKey)) {
        eligible.push(factionKey);
      }
    });
    return eligible;
  };

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
    const tier = window.L.getFameInfo(fame).tier;
    const table = [
      { low:5, medium:4, high:1, assault:0 },
      { low:4, medium:4, high:2, assault:0 },
      { low:3, medium:4, high:3, assault:0 },
      { low:2, medium:3, high:4, assault:1 },
      { low:1, medium:3, high:4, assault:2 },
    ];
    return table[tier];
  };

  const pickMissionType = (faction) => {
    const weights = typeWeightsFor(faction);
    const types = Object.keys(weights).filter(t => weights[t] > 0);
    const w = types.map(t => weights[t]);
    return pickWeighted(types, w);
  };

  const pickMissionRisk = (type, fame) => {
    const weights = riskWeightsFor(fame);
    const pool = type === "assault" ? ["assault"] : ["low", "medium", "high"];
    const w = pool.map(r => weights[r] || 0);
    return pickWeighted(pool, w);
  };

  const generateOneMission = (portKey, state, eligibleFactions) => {
    const faction = pickRandom(eligibleFactions);
    const type = pickMissionType(faction);
    const missionFaction = type === "smuggle" ? "pirate" : faction;
    const risk = pickMissionRisk(type, state.fame ?? 0);

    if (type === "trade") {
      return generateTradeMission(portKey, state, missionFaction, risk);
    }
    if (type === "smuggle") {
      return generateSmuggleMission(portKey, state, risk);
    }

    // escort, patrol, combat, assault
    const targetPort = pickTargetPort(portKey, type, state, missionFaction);
    const enemy = (type === "combat" || type === "assault" || type === "escort" || type === "patrol")
      ? (type === "assault"
          ? generateEnemyForAssault(targetPort, state.fame ?? 0)
          : generateEnemy(risk, state.fame ?? 0, missionFaction))
      : null;
    const gold = generateGold(type, risk, state.fame ?? 0);
    const fame = type === "assault" ? 3 : risk === "high" ? 2 : 1;
    const infamyGain = type === "assault" ? (risk === "high" ? 3 : 2) : 0;
    const defendingFaction = (type === "assault" && targetPort)
      ? window.D.PORTS[targetPort]?.faction : null;
    const repImpact = generateRepImpact(type, missionFaction, risk, defendingFaction);
    const { name, desc } = generateMissionText(type, missionFaction, targetPort, risk, enemy);

    return {
      type, name, description: desc, faction: missionFaction,
      targetPort: targetPort || null,
      risk, gold, fame, infamyGain, repImpact, enemy,
      ...(type === "patrol" ? { enemyDefeated: false } : {}),
    };
  };

  const generateFallbackMission = (portKey, state) => {
    const fallbackGold = generateGold("escort", "low", state.fame ?? 0);
    const faction = window.D.PORTS[portKey]?.faction || "english";
    return {
      type: "escort",
      name: "Escort the merchant fleet",
      faction,
      description: "Safe passage required.",
      targetPort: null,
      risk: "low",
      gold: fallbackGold,
      fame: 1,
      infamyGain: 0,
      repImpact: { [faction]: 2 },
      enemy: null,
    };
  };

  // ═══════════════════════════════════════════════════════════════
  //  MAIN ENTRY POINT — generateMissions
  // ═══════════════════════════════════════════════════════════════
  const generateMissions = (portKey, state) => {
    const eligibleFactions = getEligibleFactions(portKey, state);
    if (eligibleFactions.length === 0) return [];

    const count = Math.random() < 0.5 ? 2 : 3;
    const missions = [];
    for (let i = 0; i < count; i++) {
      const mission = generateOneMission(portKey, state, eligibleFactions);
      if (mission) missions.push(mission);
    }

    if (missions.length === 0) {
      missions.push(generateFallbackMission(portKey, state));
    }

    return missions;
  };


///-------------------------------------------------------------
  /// GOSSIP GENERATORS
///-------------------------------------------------------------

const generateLocalMarketGossip = (state) => {
  const market = state.portMarket;
  if (!market?.goods) return null;

  let best = null; // { good, type, deviation }
  const templates = window.D.PORT_GOSSIP_TEMPLATES?.market;

  Object.entries(market.goods).forEach(([good, data]) => {
    if (good === "food" || good === "water"  || good === "slaves") return;
    const extreme = isExtremePrice(good, data.buyFromPort);
    if (!extreme) return;
    if (!best || extreme.deviation > best.deviation) {
      best = { good, type: extreme.type, deviation: extreme.deviation };
    }
  });

  if (!best || !templates) return null;

  const res = window.D.RESOURCES[best.good];
  const goodName = res?.name || best.good;
  const pool = templates[best.type] || [];
  if (pool.length === 0) return null;

  const template = pickRandom(pool);
  return template
    .replace(/\{good\}/g, goodName.toLowerCase())
    .replace(/\{Good\}/g, goodName);
};

const generateHiddenPortHint = (state) => {
  // 5% chance to return a hint, regardless of unlock progress
  if (Math.random() >= 0.05) return null;
  const hints = window.D.PORT_GOSSIP_TEMPLATES?.hiddenPorts;
  if (!hints) return null;
  // Pick a random hidden port that is still hidden
  const hidden = Object.keys(window.D.PORTS).filter(
    k => window.D.PORTS[k].hidden && !(state.discoveredPorts || []).includes(k)
  );
  if (hidden.length === 0) return null;
  const portKey = hidden[Math.floor(Math.random() * hidden.length)];
  return hints[portKey] || null;
};

const generatePortGossip = (state, portKey) => {
  const T = window.D.PORT_GOSSIP_TEMPLATES;
  if (!T) return [];

  const port = window.D.PORTS[portKey];
  const faction = port?.faction || "english";
  const heat = state.factionAlerts?.[faction] ?? 0;
  const rep = state.reputation?.[portKey] ?? 50;
  const fame = state.fame ?? 0;
  const infamy = state.infamy ?? 0;
  const holdItems = state.hold?.items || {};
  const hasContraband = (holdItems.tobacco || 0) > 0 || (holdItems.slaves || 0) > 0;

  const pool = []; // { text, priority }

  // ── Priority 3: Heat or Contraband (only one) ──────────────
  if (heat >= 3) {
    const bucket = heat >= 7 ? T.heat.high : T.heat.medium;
    if (bucket?.length) pool.push({ text: pickRandom(bucket), priority: 3 });
  } else if (hasContraband && T.contraband?.length) {
    pool.push({ text: pickRandom(T.contraband), priority: 3 });
  }

  // ── Priority 2: Reputation / Fame / Infamy ─────────────────
  const repTier = rep >= 70 ? "allied" : rep >= 50 ? "friendly"
    : rep >= 30 ? "neutral" : rep >= 10 ? "hostile" : "at_war";
  const fameTier = fame >= 200 ? "legendary" : fame >= 100 ? "notorious"
    : fame >= 50 ? "recognised" : fame >= 20 ? "emerging" : "unknown";
  const infTier = infamy >= 100 ? "extreme" : infamy >= 50 ? "high"
    : infamy >= 25 ? "medium" : "low";

  const eligibleCategories = [];
  if (T.reputation?.[repTier]?.length) eligibleCategories.push({ type: "rep", data: T.reputation[repTier] });
  if (T.fame?.[fameTier]?.length) eligibleCategories.push({ type: "fame", data: T.fame[fameTier] });
  if (infamy >= 10 && T.infamy?.[infTier]?.length) eligibleCategories.push({ type: "infamy", data: T.infamy[infTier] });

  if (eligibleCategories.length > 0) {
    let numLines = 1; // default for infamy < 10
    if (infamy >= 10) {
      numLines = Math.random() < 0.5 ? 1 : 2;
    }
    // Pick distinct categories randomly
    const shuffled = shuffleArray(eligibleCategories);
    for (let i = 0; i < Math.min(numLines, shuffled.length); i++) {
      pool.push({ text: pickRandom(shuffled[i].data), priority: 2 });
    }
  }

  // ── Priority 1: Market gossip + Hidden port hint ──────────
  const marketGossip = generateLocalMarketGossip(state);
  if (marketGossip) pool.push({ text: marketGossip, priority: 1 });

  const hiddenHint = generateHiddenPortHint(state);
  if (hiddenHint) pool.push({ text: hiddenHint, priority: 1 });

  // ── Priority 0: Ambiance + Weather (filler) ───────────────
  // Shuffle within priority so the same categories don't always appear in the same order.
  pool.sort(() => Math.random() - 0.5);
  pool.sort((a, b) => b.priority - a.priority);

  // Determine gossip size (2:25%, 3:50%, 4:25%)
  const roll = Math.random();
  const size = roll < 0.25 ? 2 : roll < 0.75 ? 3 : 4;

  const result = pool.slice(0, size).map(g => g.text);

  // If we didn't reach the desired size, fill with ambiance + weather
  if (result.length < size) {
    const filler = [];
    const amb = T.ambiance?.[faction] || [];
    const wea = T.weather || [];
    filler.push(...amb, ...wea);
    const shuffledFiller = shuffleArray(filler);
    for (let i = 0; result.length < size && i < shuffledFiller.length; i++) {
      // Avoid duplicate lines in the same visit
      if (!result.includes(shuffledFiller[i])) {
        result.push(shuffledFiller[i]);
      }
    }
  }

  return result;
};


  // ── exports ───────────────────────────────────────────────────
  return {
    // crew (migrated)
    generateCrewMember,
    generateRoster,
    generateCrewBio,
    // missions
    generateEnemyCargo,
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
    // port market & gossip
    generatePortMarket,
    generatePortGossip,
  };

})();