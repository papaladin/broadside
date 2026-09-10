// @ts-check
// ═══════════════════════════════════════════════════════════════════
//  generators.js : ALL RUNTIME CONTENT GENERATORS
//  Functions that use Math.random to produce game content at runtime.
//  No pure game logic here. that lives in logic.js.
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

  const pickPirateNationality = () => {
  const weights = [
    { faction: "english", weight: 40 },
    { faction: "spanish", weight: 20 },
    { faction: "french",  weight: 15 },
    { faction: "dutch",   weight: 15 },
    { faction: "pirate",  weight: 10 },
  ];
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.faction;
  }
  return "pirate"; // fallback
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

    // Neutral buyFromPort = basePrice × 1.10 (no availability or faction modifier)
    const neutral = res.basePrice * 1.10;
    const ratio   = buyPrice / neutral;

    // Flag goods that are structurally cheap (≤−18%) or expensive (≥+18%).
    // This corresponds to:
    //   "always" tier (0.72×) = ratio ~0.72–0.79 → surplus
    //   "rarely" tier (1.20×) = ratio ~1.20–1.26 → shortage
    //   "sometimes" (1.00×)   = ratio ~0.99–1.01 → not flagged
    if (ratio <= 0.82) return { type: "surplus",  deviation: 0.82 - ratio };
    if (ratio >= 1.18) return { type: "shortage", deviation: ratio - 1.18 };

    return null;
  };

  const applyMissionRewardMultiplier = (state, faction, baseGold) => {
    const rep = window.L.getFactionReputation(state, faction);
    const perk = window.L.getRepPerk(rep);
    return Math.round((baseGold * perk.missionMult) / 25) * 25;
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
    let firstList, lastList;
    if (faction === "pirate") {
      firstList = CREW_FIRST_NAMES[pickPirateNationality()];
      lastList  = CREW_LAST_NAMES[pickPirateNationality()];
    } else {
      firstList = CREW_FIRST_NAMES[faction] || CREW_FIRST_NAMES.pirate;
      lastList  = CREW_LAST_NAMES[faction]  || CREW_LAST_NAMES.pirate;
    }

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
    storm_wreck:   "Twice the sea tried to claim them: a storm and a wreck. They're still here.",
    m_storm:       "After surviving a storm, they thought they could survive anything.. even mutiny.",
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
      (desc) => `They tend to ${desc}. Everyone knows it.`,
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

const generatePortMarket = (portKey, state) => {
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

  const fameTier = window.L.getFameInfo(state?.fame ?? 0).tier;
  const scale = 1 + fameTier;

  const goods = {};

  colOrder.forEach((good, idx) => {
    const res = resources[good];
    if (!res) return;

    // ── Hoist tier so the price formula can use the availability multiplier ──
    const tier = availability[idx] || "never";

    // ── Structural price: basePrice × availabilityMult × factionMod × (1 ± 5%) ──
    const isFixed = res.variance === 0;
    const port = window.D.PORTS[portKey];
    const availMult = window.D.AVAILABILITY_PRICE_MODIFIERS[tier] ?? 1.00;
    const factionMods = window.D.FACTION_PRICE_MODIFIERS[port?.faction] ?? {};
    const factionMod = factionMods[good] ?? 1.00;

    const marketPrice = isFixed
      ? res.basePrice
      : Math.round(res.basePrice * availMult * factionMod * (1 + res.variance * (Math.random() * 2 - 1)));

    let buyFromPort = isFixed ? res.basePrice : Math.round(marketPrice * 1.10);
    let sellToPort  = isFixed ? res.basePrice : Math.round(marketPrice * 0.90);
    // ── Dutch birth trait: better trade margins ──────────────
    const isDutch = state?.faction === 'dutch';
    if (isDutch) {
      // Dutch: buy at 1.05× (instead of 1.10×), sell at 0.95× (instead of 0.90×)
      // This narrows the spread from 20% to 10%
      buyFromPort = isFixed ? res.basePrice : Math.round(marketPrice * 1.05);
      sellToPort = isFixed ? res.basePrice : Math.round(marketPrice * 0.95);
    }

    // ── Roll availability separately  ─────────────────────────────
    const chance = tierChance[tier] ?? 0;
    let available = 0;
    if (chance > 0 && Math.random() <= chance) {
      if (good === "food" || good === "water") {
        available = 999;
      } else {
        const range = tierQtyRanges[tier];
        available = range ? randInt(range.min * scale, range.max * scale) : 0;
      }
    }

    goods[good] = {
      basePrice: res.basePrice,
      buyFromPort,
      sellToPort,
      available,
    };
  });

  // Force‑stock tutorial goods during onboarding
  // (Entry now always exists, so we just bump availability if it's zero)
  if (state?.onboarding?.enabled && !state?.onboarding?.completed && state?.activeMission?.tutorial) {
    const requiredGood = state.activeMission.requiredGood;
    if (requiredGood && goods[requiredGood] && goods[requiredGood].available === 0) {
      goods[requiredGood].available = 20;
    }
  }

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
const generateEnemy = (risk = "medium", fame, faction, enemyFactionOverride = null) => {
  const tier = window.L.getFameInfo(fame).tier;
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
    faction: enemyFactionOverride !== null ? enemyFactionOverride : opposingFaction(faction),
    hull:    pick(ranges.hull),
    cannons: pick(ranges.cannons),
    crew:    pick(ranges.crew),
    risk: risk, 
  };
};

  // Assault enemy : uses the defending port's faction
  const generateEnemyForAssault = (targetPortKey, fame) => {
    const port = window.D.PORTS[targetPortKey];
    const faction = port?.faction || "spanish";
    return generateEnemy("assault", fame, faction, faction);
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

    // For types that involve fighting an enemy, apply negative reputation
    if (["patrol", "combat", "escort"].includes(type) && defendingFaction) {
      // same penalty as patrol/combat
      impact[defendingFaction] = -(positiveDelta - 1);
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
    // Exclude pirate ports : you smuggle TO colonial powers, not pirate havens
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

  // NEW: Early-game restriction : limit target ports for fame < 10
  if ((state.fame ?? 0) < 15) {
    const starterPorts = [
      "havana", "nassau", "santiagoDeCuba", "portDePaix", "tortuga",
      "santoDomingo", "petitGoave", "portRoyal", "kingston"
    ];
    eligible = eligible.filter(k => starterPorts.includes(k));
  }

  if (eligible.length === 0) return null;
  return pickRandom(eligible);
};

// ── NEW: Find a port where a specific good is in demand ──────────────────
// Returns a port key, or null if none found.
// Uses the GOODS_AVAILABILITY tier directly. "rarely" or "never" = in demand.
// Options: { excludePirate: boolean }
const findPortForGoodInDemand = (good, state, currentPort, options = {}) => {
  const { excludePirate = false } = options;
  const allPorts = Object.keys(window.D.PORTS);
  let candidates = allPorts.filter(k => k !== currentPort);

  // Exclude hidden ports not yet discovered
  candidates = candidates.filter(k => !window.D.PORTS[k].hidden || (state.discoveredPorts || []).includes(k));

  // Early-game restriction: fame < 10 limits to starter ports
  if ((state.fame ?? 0) < 10) {
    const starterPorts = [
      "havana", "nassau", "santiagoDeCuba", "portDePaix", "tortuga",
      "santoDomingo", "petitGoave", "portRoyal", "kingston"
    ];
    candidates = candidates.filter(k => starterPorts.includes(k));
  }

  // Optionally exclude pirate ports
  if (excludePirate) {
    candidates = candidates.filter(k => window.D.PORTS[k].faction !== "pirate");
  }

  // Column order used in GOODS_AVAILABILITY
  const colOrder = [
    "food","water","rum","sugar","timber","cloth","spices","silk",
    "coffee","cocoa","weapons","tobacco","silver","slaves"
  ];
  const goodIndex = colOrder.indexOf(good);
  if (goodIndex === -1) return null;

  // Shuffle to avoid always picking the same port
  const shuffled = shuffleArray(candidates);
  for (const port of shuffled) {
    const availability = window.D.GOODS_AVAILABILITY[port];
    if (!availability) continue;
    const tier = availability[goodIndex] || "never";
    // "rarely" or "never" means the good is scarce → high demand
    if (tier === "rarely" || tier === "never") {
      return port;
    }
  }
  return null;
};

// ── NEW: Find a port that has at least one "in demand" good ──────────────
// Returns { port: string, inDemandGoods: string[] } or null.
// Used by trade mission generator to pick a target port.
const findPortWithInDemandGood = (state, currentPort) => {
  const allPorts = Object.keys(window.D.PORTS);
  let candidates = allPorts.filter(k => k !== currentPort);

  // Exclude hidden ports not yet discovered
  candidates = candidates.filter(k => !window.D.PORTS[k].hidden || (state.discoveredPorts || []).includes(k));

  // Early-game: fame < 10 limits to starter ports
  if ((state.fame ?? 0) < 10) {
    const starterPorts = [
      "havana", "nassau", "santiagoDeCuba", "portDePaix", "tortuga",
      "santoDomingo", "petitGoave", "portRoyal", "kingston"
    ];
    candidates = candidates.filter(k => starterPorts.includes(k));
  }

  // Shuffle to avoid always picking the same port
  const shuffled = shuffleArray(candidates);
  for (const port of shuffled) {
    const profile = window.L.getPortTradeProfile(port);
    // Filter out illegal goods? For trade missions, we only care about legal goods.
    // `inDemand` already excludes illegal goods by design (since it's built from
    // `GOODS_AVAILABILITY` tiers, not from RESOURCES.illegal).
    const demand = profile.inDemand || [];
    if (demand.length > 0) {
      return { port, inDemandGoods: demand };
    }
  }
  return null;
};

  // ── Trade mission generator ──────────────────────────────────
  // UPDATED: Picks a target port with in‑demand goods, then selects one of those goods.
  // No profitability checks – the player decides where to source the goods.
  const generateTradeMission = (portKey, state, faction, risk) => {
    const tier = window.L.getFameInfo(state.fame ?? 0).tier;

    // ── Find a port with in‑demand goods ──────────────────────────
    const result = findPortWithInDemandGood(state, portKey);
    if (!result) return null;

    const targetPort = result.port;
    const inDemandGoods = result.inDemandGoods;

    // ── Pick a random good from the in‑demand list ────────────────
    const good = pickRandom(inDemandGoods);
    const res = window.D.RESOURCES[good];
    if (!res) return null;

    // ── Gold reward from the standard mission gold table ──────────
    const [minGold, maxGold] = window.D.MISSION_GOLD_RANGES[tier][risk] || window.D.MISSION_GOLD_RANGES[tier].medium;
    const rawGold = minGold + Math.random() * (maxGold - minGold);
    const gold = applyMissionRewardMultiplier(state, faction, Math.round(rawGold / 25) * 25);

    // ── Required quantity derived from gold reward and profit margin ──
    const margin = window.D.TRADE_MISSION_PROFIT_MARGINS[risk] || 0.60;
    const requiredQty = Math.max(3, Math.round(gold / (res.basePrice * (1 + margin))));

    // ── Build mission object ──────────────────────────────────────
    const targetPortName = window.D.PORTS[targetPort]?.name || "unknown port";
    const factionAdj = pickRandom(window.D.MISSION_NAME_PARTS.factionAdj[faction] || ["Foreign"]);
    const fame = risk === "high" ? 2 : 1;
    const repImpact = { [faction]: window.D.MISSION_REP_IMPACTS.trade?.[risk] ?? 2 };

    return {
      type: "trade",
      name: `Deliver ${res.name} to ${targetPortName}`,
      description: `The ${factionAdj} factor requires ${requiredQty} ${res.unit} of ${res.name} at ${targetPortName}. Source the goods yourself and deliver: you will be paid in full on arrival.`,
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
// UPDATED: uses findPortForGoodInDemand to pick a target port where the contraband good is scarce.
const generateSmuggleMission = (portKey, state, risk) => {
  // ── Safety: only generate at Pirate ports ──
  const port = window.D.PORTS[portKey];
  if (!port || port.faction !== 'pirate') return null;

  const tier = window.L.getFameInfo(state.fame ?? 0).tier;
  const infamy = state.infamy ?? 0;

  // Good pool by tier + infamy gating
  let eligibleGoods = window.D.SMUGGLE_GOODS_BY_TIER[tier] || ["rum", "tobacco"];
  if (risk === "low" || infamy < 25) {
    eligibleGoods = eligibleGoods.filter(g => g !== "slaves");
  }
  if (eligibleGoods.length === 0) eligibleGoods = ["tobacco"];

  // Shuffle to try different goods if the first one fails
  const shuffledGoods = shuffleArray(eligibleGoods);
  for (const good of shuffledGoods) {
    const res = window.D.RESOURCES[good];
    if (!res) continue;

    // ── Find a port where this good is in demand (scarce) ──────
    // Exclude pirate ports – you smuggle TO colonial powers, not pirate havens.
    const targetPort = findPortForGoodInDemand(good, state, portKey, { excludePirate: true });
    if (!targetPort) continue;

    // ── Get the target port's faction ──────────────────────────
    const targetFaction = window.D.PORTS[targetPort]?.faction || "english";

    // ── Gold reward from the standard mission gold table ──────
    const [minGold, maxGold] = window.D.MISSION_GOLD_RANGES[tier][risk] || window.D.MISSION_GOLD_RANGES[tier].medium;
    const rawGold = minGold + Math.random() * (maxGold - minGold);
    const gold = applyMissionRewardMultiplier(state, "pirate", Math.round(rawGold / 25) * 25);

    // ── Required quantity derived from gold reward and profit margin ──
    const margin = window.D.SMUGGLE_PROFIT_MARGINS[risk] || 0.80;
    const requiredQty = Math.max(2, Math.round(gold / (res.basePrice * (1 + margin))));

    // ── Mission properties ──────────────────────────────────────
    const interceptChance = { low: 0.30, medium: 0.35, high: 0.40 }[risk] || 0.35;
    const infamyGain = 1;
    const targetPortName = window.D.PORTS[targetPort]?.name || "unknown port";
    const goodName = res.name;
    const goodUnit = res.unit;
    const sourceHint = res.sourceHint || "";
    const riskLabel = { low: "routine", medium: "dangerous", high: "perilous" }[risk] || "";
    const infamyWarning = good === "slaves"
      ? " Purchasing this cargo will darken your reputation."
      : "";
    const fame = risk === "high" ? 2 : 1;
    const repImpact = {
      pirate: window.D.MISSION_REP_IMPACTS.smuggle?.any ?? 2,
      [targetFaction]: -3,
    };

    // ── Enemy now matches the target port's faction ──────────
    const enemy = generateEnemy(risk, state.fame ?? 0, targetFaction, targetFaction);

    return {
      type: "smuggle",
      name: `Smuggle ${goodName} to ${targetPortName}`,
      description: `Get ${requiredQty} ${goodUnit} of ${goodName} to ${targetPortName} without inspection. ${riskLabel.charAt(0).toUpperCase() + riskLabel.slice(1)} work. Patrols are active.${infamyWarning} ${sourceHint}`,
      faction: "pirate",
      targetPort,
      risk,
      gold,
      fame,
      infamyGain,
      repImpact,
      enemy,
      requiredGood: good,
      requiredQty,
      interceptChance,
      isContraband: good !== "rum",
    };
  }

  return null;
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
      smuggle: isPirate ? 3 : 0,
      trade:   isPirate ? 0 : 3,
      assault: 1,
    };
  };

  const riskWeightsFor = (fame) => {
  const tier = window.L.getFameInfo(fame).tier;
  const table = [
    { low:6, medium:3, high:1, assault:0 },  // NEW tier 0
    { low:5, medium:4, high:1, assault:0 },  // was 0
    { low:4, medium:4, high:2, assault:0 },  // was 1
    { low:3, medium:4, high:3, assault:0 },  // was 2
    { low:2, medium:3, high:4, assault:1 },  // was 3
    { low:1, medium:3, high:4, assault:2 },  // was 4
  ];
  return table[tier] || table[table.length - 1];
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

    // ── Trade / Smuggle (handled by separate generators) ──
    if (type === "trade") {
      return G.generateTradeMission(portKey, state, missionFaction, risk);
    }
    if (type === "smuggle") {
      return G.generateSmuggleMission(portKey, state, risk);
    }

    // ── Escort / Patrol / Combat / Assault ──────────────────
    const targetPort = pickTargetPort(portKey, type, state, missionFaction);
    let enemy = null;
    let defendingFaction = null;

    if (type === "assault") {
      enemy = generateEnemyForAssault(targetPort, state.fame ?? 0);
      defendingFaction = targetPort ? window.D.PORTS[targetPort]?.faction : null;
    } else if (["escort", "patrol", "combat"].includes(type)) {
      // Generate the enemy once and remember its faction
      enemy = generateEnemy(risk, state.fame ?? 0, missionFaction);
      defendingFaction = enemy ? enemy.faction : null;
    }

    const gold = applyMissionRewardMultiplier(state, missionFaction, generateGold(type, risk, state.fame ?? 0));
    const fame = type === "assault" ? 3 : risk === "high" ? 2 : 1;
    const infamyGain = type === "assault" ? (risk === "high" ? 3 : 2) : 0;

    // Pass the correct defendingFaction (enemy faction) to rep impact
    const repImpact = generateRepImpact(type, missionFaction, risk, defendingFaction);
    const { name, desc } = generateMissionText(type, missionFaction, targetPort, risk, enemy);

    return {
      type,
      name,
      description: desc,
      faction: missionFaction,
      targetPort: targetPort || null,
      risk,
      gold,
      fame,
      infamyGain,
      repImpact,
      enemy,
      ...(type === "patrol" ? { enemyDefeated: false } : {}),
    };
  };

  const generateFallbackMission = (portKey, state) => {
    const faction = window.D.PORTS[portKey]?.faction || "english";
    const fallbackGold = applyMissionRewardMultiplier(state, faction, generateGold("escort", "low", state.fame ?? 0));
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
  //  MAIN ENTRY POINT : generateMissions
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
    if (data.available <= 0) return;
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


// ── FLAVOR TEXT FOR PORT SERVICES ──────────────────────────────────────
const generateMarketFlavour = (state, portKey) => {
  const T = window.D?.MARKET_FLAVOUR;
  if (!T) return [];

  const port = window.D.PORTS[portKey];
  if (!port) return [];

  const faction = port.faction;
  const market = state.portMarket;
  const holdItems = state.hold?.items || {};
  const holdUsed = window.L.getHoldUsed(holdItems);
  const holdCap = window.L.getHoldCapacity(state);
  const loadPct = holdCap > 0 ? holdUsed / holdCap : 0;

  const pools = [];   // { priority, category, text } – priority 0 = always eligible

  // ── Gold (rare) ──────────────────────────────────────────────
  if (state.gold >= 100000) {
    pools.push({ priority: 0, category: "gold_rich", text: pickRandom(T.gold_rich) });
  } else if (state.gold >= 10000) {
    pools.push({ priority: 0, category: "gold_comfortable", text: pickRandom(T.gold_comfortable) });
  }

  // ── Hold fullness ────────────────────────────────────────────
  if (loadPct <= 0.2) {
    pools.push({ priority: 1, category: "hold_empty", text: pickRandom(T.hold_empty) });
  } else if (loadPct <= 0.5) {
    pools.push({ priority: 1, category: "hold_light", text: pickRandom(T.hold_light) });
  } else if (loadPct <= 0.8) {
    pools.push({ priority: 1, category: "hold_half", text: pickRandom(T.hold_half) });
  } else {
    pools.push({ priority: 1, category: "hold_full", text: pickRandom(T.hold_full) });
  }

  // ── Extreme prices (reuse same detection as gossip) ──────────
  if (market?.goods) {
    Object.entries(market.goods).forEach(([good, data]) => {
      if (good === "food" || good === "water" || good === "slaves") return;
      if (data.available <= 0) return; 
      const res = window.D.RESOURCES[good];
      if (!res || res.variance === 0) return;
      const min = res.basePrice * (1 - res.variance);
      const max = res.basePrice * (1 + res.variance);
      const range = max - min;
      if (range <= 0) return;
      const pct = (data.buyFromPort - min) / range;
      if (pct <= 0.20) {
        const text = pickRandom(T.price_surplus).replace(/\{good\}/g, res.name.toLowerCase()).replace(/\{Good\}/g, res.name);
        pools.push({ priority: 2, category: "price_surplus", text });
      } else if (pct >= 0.80) {
        const text = pickRandom(T.price_shortage).replace(/\{good\}/g, res.name.toLowerCase()).replace(/\{Good\}/g, res.name);
        pools.push({ priority: 2, category: "price_shortage", text });
      }
    });
  }

  // ── Rare goods (availability tier "rarely" and present) ──────
  if (market?.goods) {
    const availability = window.D.GOODS_AVAILABILITY[portKey] || [];
    const colOrder = ["food","water","rum","sugar","timber","cloth","spices","silk","coffee","cocoa","weapons","tobacco","silver","slaves"];
    Object.keys(market.goods).forEach(good => {
      const idx = colOrder.indexOf(good);
      if (idx === -1) return;
      const tier = availability[idx];
      if (tier === "rarely") {
        const text = pickRandom(T.rare_good).replace(/\{good\}/g, window.D.RESOURCES[good]?.name || good);
        pools.push({ priority: 3, category: "rare_good", text });
      }
    });
  }

  // ── Specific goods ───────────────────────────────────────────
if (market?.goods?.tobacco?.available > 0) {
  pools.push({ priority: 3, category: "tobacco_present", text: pickRandom(T.tobacco_present) });
}
if (market?.goods?.slaves?.available > 0) {
  pools.push({ priority: 3, category: "slaves_present", text: pickRandom(T.slaves_present) });
}

  // ── Fame ─────────────────────────────────────────────────────
  const fameInfo = window.L.getFameInfo(state.fame ?? 0);
  if (fameInfo.tier >= 5) { // Immortal
    pools.push({ priority: 4, category: "fame_legendary", text: pickRandom(T.fame_legendary) });
  } else if (fameInfo.tier >= 3) { // Notorious+
    pools.push({ priority: 4, category: "fame_recognised", text: pickRandom(T.fame_recognised) });
  }

  // ── Infamy ───────────────────────────────────────────────────
  if ((state.infamy ?? 0) >= 50) {
    pools.push({ priority: 4, category: "infamy_notorious", text: pickRandom(T.infamy_notorious) });
  } else if ((state.infamy ?? 0) >= 25) {
    pools.push({ priority: 4, category: "infamy_wanted", text: pickRandom(T.infamy_wanted) });
  }

  // ── Port atmosphere ──────────────────────────────────────────
  const portAtmosphere = T[`port_${faction}`];
  if (portAtmosphere) {
    pools.push({ priority: 0, category: "port_ambiance", text: pickRandom(portAtmosphere).replace(/\{port\}/g, port.name) });
  }

  // ── Fallback ambiance ────────────────────────────────────────
  // Always add one ambiance line as a baseline
  pools.push({ priority: 0, category: "ambiance", text: pickRandom(T.ambiance).replace(/\{port\}/g, port.name) });

  // ── Selection logic ──────────────────────────────────────────
  // Sort by priority (lower = more important), then pick 3 lines,
  // ensuring no duplicate category.
  pools.sort((a, b) => a.priority - b.priority);
  const selected = [];
  const usedCategories = new Set();
  for (const p of pools) {
    if (selected.length >= 3) break;
    if (usedCategories.has(p.category)) continue;
    selected.push(p.text);
    usedCategories.add(p.category);
  }

  return selected;
};

// ── Faction Service Flavour Text ──────────────────────────────────

// Dutch Bank – depends on player faction, gold, Dutch rep, loan debt
const generateBankFlavour = (state) => {
  const rep = state.reputation[state.currentPort] ?? 50;
  const debt = state.bankDebt ?? 0;
  const gold = state.gold ?? 0;

  // Not enough reputation
  if (rep < 30) return "The clerk refuses to meet your eye. 'Your standing with the Bank is insufficient.'";

  // Active loan
  if (debt > 0) {
    if (gold > 10000) return `The manager nods. 'Repayment is going well, Captain. ${debt}g remains.'`;
    return `The manager frowns. 'Your debt stands at ${debt}g. We will take 20% of your trade income until it's cleared.'`;
  }

  // No loan – based on wealth
  if (gold > 20000) return "The manager smiles warmly. 'For a captain of your means, the vault is at your service.'";
  if (gold < 2000) return "The manager hesitates. 'We can offer a small loan, but the terms are strict.'";
  return "The manager taps the ledger. 'We can arrange a loan if you need working capital.'";
};

// Spanish Inquisitor – depends on player faction, fame, infamy
const generateInquisitorFlavour = (state) => {
  const infamy = state.infamy ?? 0;
  const fame = state.fame ?? 0;
  const isSpanish = state.faction === 'spanish';

  if (infamy <= 0) return "The Inquisitor studies you. 'You have no stain on your soul, Captain. Leave.'";
  if (infamy < 25) {
    if (isSpanish) return "The Inquisitor speaks softly in your tongue. 'A few sins, but not beyond redemption. A donation will suffice.'";
    return "The Inquisitor's brow furrows. 'A few sins, but not beyond redemption. A donation will suffice.'";
  }
  if (infamy < 50) return "The Inquisitor leans forward. 'The Church knows your deeds. Pay, and be cleansed.'";
  if (fame >= 200) return "The Inquisitor bows slightly. 'Even the infamous can be forgiven... for a price.'";
  return "The Inquisitor's gaze is cold. 'The devil's shadow is upon you. But even you may buy forgiveness.'";
};

// French Embassy – flavour based on the faction with the lowest reputation
const generateEmbassyFlavour = (state) => {
  const frenchRep = state.reputation[state.currentPort] ?? 50;
  const isFrench = state.faction === 'french';

  // If French rep is too low, the embassy itself is inaccessible
  if (frenchRep < 50) return "The aide closes the door. 'Your standing with France is insufficient.'";

  // Find the faction with the lowest reputation among all five
  let lowestFaction = null;
  let lowestRep = Infinity;
  for (const [faction, fac] of Object.entries(window.D.FACTIONS)) {
    const rep = window.L.getFactionReputation(state, faction);
    if (rep < lowestRep) {
      lowestRep = rep;
      lowestFaction = fac;
    }
  }

  // If all factions are at max, say something
  if (lowestRep >= 100) return "The ambassador laughs. 'Every faction in the Caribbean speaks highly of you.'";

  const targetName = lowestFaction.label;
  const targetRep = lowestRep;

  if (targetRep >= 80) return `The ambassador nods. 'The ${targetName} already respect you. A word from us will strengthen that.'`;
  if (targetRep >= 50) return `The ambassador considers. 'Your standing with the ${targetName} is decent. We could improve it further.'`;
  return `The ambassador sighs. 'The ${targetName} are difficult, but our influence can smooth things over.'`;
};



// ---------EVENTS -------------------

const pickMerchantFaction = () => {
  const factions = Object.keys(window.D.FACTIONS).filter(f => f !== "pirate");
  return factions[Math.floor(Math.random() * factions.length)];
};


// ── Combat Flavour Generator  ─────────────────────────────
const generateCombatFlavour = (disposition) => {
  if (!disposition) return ["The two ships size each other up."];
  const { weights, riskLevel } = disposition;

  // Build pools per category
  const pools = [];

  if (weights.grapple > 1.0 && weights.close > 0.9) {
    pools.push([
      "They're closing fast — this crew means to board.",
      "The enemy crew is gathering at the bow, grappling hooks in hand.",
      "You see the enemy preparing to lash your ships together.",
    ]);
  }
  if (weights.open > 1.0 && weights.close < 0.7) {
    pools.push([
      "They're keeping their distance, guns ready.",
      "The enemy ship is falling back, clearly preferring long range.",
      "Their sails are trimmed to stay far away from your guns.",
    ]);
  }
  if (riskLevel === "low") {
    pools.push([
      "They look like they'd rather not be here.",
      "The enemy crew seems hesitant, their gunners half-hearted.",
      "This is no eager foe — they're going through the motions.",
    ]);
  }
  if (riskLevel === "assault" || riskLevel === "high") {
    pools.push([
      "Their gunners are already in position. No hesitation here.",
      "The enemy is bracing for a brutal fight — no quarter given.",
      "Their sails are full and their cannons run out. This will be bloody.",
    ]);
  }
  if (disposition.surrenderWillingness > 0.6) {
    pools.push([
      "Word of your reputation may have reached this crew already.",
      "Some of the enemy crew look nervous, unsure if they want to fight you.",
      "You overhear a voice on the wind asking if surrender is truly an option.",
    ]);
  }
  if (disposition.surrenderWillingness < 0.2) {
    pools.push([
      "This crew looks ready to fight to the last.",
      "Their captain shouts orders with fury — they will not yield.",
      "There is no fear in their eyes. They intend to win or die.",
    ]);
  }

  if (pools.length === 0) return ["The two ships size each other up."];

  // Pick one random line from each applicable pool
  return pools.map(pool => pool[Math.floor(Math.random() * pool.length)]);
};

  // ── exports ───────────────────────────────────────────────────
  return {
    // crew 
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
    generateMarketFlavour,
    generateBankFlavour,
    generateEmbassyFlavour,
    generateInquisitorFlavour,
    // events
    pickMerchantFaction,
    // intercept combat flavour text
    generateCombatFlavour,
  };

})();