// @ts-check
// logic_core.js — Foundation layer: universal helpers, ship stats, equipment, reputation, logs, B9.
// Exposed as window.L. Must be loaded before all other logic files.

window.L = window.L || {};

(() => {
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT, STARTS } = window.D;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  HELPERS (universal)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // ── Default RNG object (injectable) ───────────────────────────────
  const defaultRng = {
    random: () => Math.random(),
    int: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)]
  };

  const reputationLabel = (rep) => {
    if (rep >= 80) return "Allied";
    if (rep >= 60) return "Friendly";
    if (rep >= 40) return "Neutral";
    if (rep >= 20) return "Unfriendly";
    if (rep >= 10) return "Hostile";
    return "At War";
  };

  const getFameInfo = (fame) => {
    if (fame >= 350) return { label: "Immortal", tier: 5 };
    if (fame >= 200) return { label: "Legendary", tier: 4 };
    if (fame >= 100) return { label: "Notorious", tier: 3 };
    if (fame >= 50)  return { label: "Recognised", tier: 2 };
    if (fame >= 10)  return { label: "Unknown", tier: 1 };
    return { label: "Greenhorn", tier: 0 };
  };

  const getInfamyLabel = (infamy) => {
    if (infamy >= 100) return "Legendary Outlaw";
    if (infamy >= 50)  return "Notorious";
    if (infamy >= 25)  return "Wanted";
    if (infamy >= 10)  return "Suspect";
    return "Clean";
  };

  const getHeatLabel = (level) => {
    if (level >= 9) return "Manhunt";
    if (level >= 6) return "Hunted";
    if (level >= 3) return "Active Search";
    if (level >= 1) return "Alert";
    return "";
  };

  const meetsRequirement = (state, item) => {
    if (item.requiredFame && state.fame < item.requiredFame)
      return { allowed: false, reason: `Requires ★ ${item.requiredFame} fame (${L.getFameInfo(item.requiredFame).label})` };
    return { allowed: true, reason: null };
  };

  // logic_core.js
  const canBribe = (state) => {
    const isPirate = state.faction === 'pirate';
    const bribeGateRemoved = isPirate && (L.getBirthTrait(state, 'bribeGateRemoved') || false);
    
    const portKey = state.destination ?? state.currentPort;
    const rep = state.reputation[portKey] ?? 0;

    // Reputation gate: applies to EVERYONE (lowered to 30)
    if (rep <= 30) return false;

    // Infamy gate: Pirates bypass it entirely
    if (bribeGateRemoved) return true;

    // Non-Pirates: infamy must be < 25
    return (state.infamy ?? 0) < 25;
  };

  const getEffectiveMorale = (state) => {
    const shipStats = L.getShipStats(state);
    const moraleBonus = shipStats.moraleBonus || 0;
    return Math.min(100, state.crew.morale + moraleBonus);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SHIP STATS & EQUIPMENT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const getShipStats = (state) => {
    const base = SHIPS[state.ship.type] || SHIPS.dinghy;
    const stats = { ...base };
    let hullPct = 0;
    let holdPct = 0;

    const eq = state.ship.equipment || {};
    for (const key of Object.values(eq).flat()) {
      const item = EQUIPMENT[key];
      if (!item) continue;
      for (const [effect, value] of Object.entries(item.effects || {})) {
        if (effect === "hullPct") {
          hullPct += value;
        } else if (effect === "holdPct") {
          holdPct += value;
        } else if (typeof stats[effect] === "number") {
          stats[effect] += value;
        }
      }
    }

    stats.maxHull = Math.round(base.maxHull * (1 + hullPct));
    stats.holdCapacity = Math.round(base.holdCapacity * (1 + holdPct));
    stats.speed = Math.max(1, stats.speed);
    stats.maxDays = Math.max(1, stats.maxDays);
    stats.moraleBonus = 0;

    // ── French birth trait: +1 maxDays ──────────────────────────────
    if (state?.faction === 'french') {
      const bonus = window.D.BIRTH_TRAITS?.french?.maxDaysBonus ?? 0;
      stats.maxDays = Math.max(1, stats.maxDays + bonus);
    }

    return stats;
  };

  const getEquipmentEffect = (state, effectKey) => {
    const eq = state.ship?.equipment || {};
    let total;

    if (effectKey === "combatHeatMult" || effectKey === "crewLossMult") {
      total = 1;
    } else {
      total = typeof effectKey === 'string' && (effectKey.endsWith('Pct') || effectKey.endsWith('Chance')) ? 0 : 0;
    }

    for (const key of Object.values(eq).flat()) {
      const item = EQUIPMENT[key];
      if (!item) continue;
      const value = item.effects?.[effectKey];
      if (value === undefined) continue;

      if (typeof value === "boolean") {
        total = total || value;
      } else if (effectKey === "combatHeatMult" || effectKey === "crewLossMult") {
        total *= value;
      } else {
        total += value;
      }
    }
    return total;
  };

  const canInstallEquipment = (state, equipmentKey) => {
    const item = EQUIPMENT[equipmentKey];
    if (!item) return { ok: false, reason: "Unknown equipment" };

    const shipDef = SHIPS[state.ship.type];
    const current = state.ship.equipment?.[item.slot] || [];

    if ((state.fame || 0) < item.requiredFame)
      return { ok: false, reason: "Requires more fame" };
    if ((shipDef.maxHull || 0) < item.requiredHull)
      return { ok: false, reason: "Ship hull too small" };
    if ((shipDef.slots?.[item.slot] || 0) <= 0)
      return { ok: false, reason: "No matching slot" };
    if (current.length >= shipDef.slots[item.slot])
      return { ok: false, reason: "Slot full" };
    if (Object.values(state.ship.equipment || {}).flat().includes(equipmentKey))
      return { ok: false, reason: "Already installed" };

    return { ok: true };
  };

  const shipRepairCost = (state) => {
    const ship = L.getShipStats(state);
    const hullMissing = ship.maxHull - state.ship.hull;
    return hullMissing * Math.ceil(ship.maxHull / 20);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  LOG & UTILITY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const classifyLogLine = (text) => {
    if (!text) return null;
    const t = text;

    // ── Arrival / sailing ──────────────────────────────────────────
    if (t.includes("Arrived at") || t.includes("Dropped anchor")) return "arrival";
    if (t.includes("Setting sail") || t.includes("Changing course") || t.includes("sets sail")) return "sailing";

    // ── Crew ───────────────────────────────────────────────────────
    if (t.includes("left the crew") || t.includes("has left") || 
        t.includes("Hired") || t.includes("deserted") || t.includes("join your crew")) return "crew";

    // ── Warnings (upset, heat, patrol, provisions) ──────────────
    if (t.includes("upset") || t.includes("disturbed") || 
        t.includes("heat") || t.includes("alert") || t.includes("patrol") ||
        t.includes("stores are empty") || t.includes("barrels are dry")) return "warning";

    // ── Combat ─────────────────────────────────────────────────────
    if (t.includes("mutineer") || t.includes("Mutiny") ||
        t.includes("Victory") || t.includes("Defeated") ||
        t.includes("Escaped") || t.includes("fled") ||
        t.includes("Plundered") || t.includes("plunder")) return "combat";

    // ── Trade ─────────────────────────────────────────────────────
    if (t.includes("Bought") || t.includes("Sold") || t.includes("trade") || 
        t.includes("repaired") || t.includes("Top up") || t.includes("provisions")) return "trade";

    // ── Mission ────────────────────────────────────────────────────
    if (t.includes("Completed:") || t.includes("mission") || t.includes("Accepted")) return "mission";

    // ── Discovery ──────────────────────────────────────────────────
    if (t.includes("New port discovered") || t.includes("chart")) return "discovery";

    // ── Infamy ────────────────────────────────────────────────────
    if (t.includes("infamy") || t.includes("wanted") || t.includes("Wanted")) return "infamy";

    // ── Crew (secondary) ──────────────────────────────────────────
    if (t.includes("survivor") || t.includes("rescue") || 
        t.includes("settled down") || t.includes("morale") || t.includes("drinks") ||
        t.includes("has died") || t.includes("claims a crew member")) return "crew";

    return null;
  };

  const getLogTabCategory = (text) => {
    const category = L.classifyLogLine(text);
    if (!category) return "other";
    switch (category) {
      case "crew":
      case "warning": return "crew";
      case "combat":  return "combat";
      case "arrival":
      case "sailing":
      case "discovery": return "ports";
      case "mission":
      case "infamy": return "missions";
      case "trade": return "trade";
      default: return "other";
    }
  };

  const logPick = (pool, state, ...args) => {
      // Allow an optional RNG object to be passed as the last argument.
      // If the last argument is an object with random()/int()/pick(), use it as RNG
      // and remove it before calling the template function.
      let rng = defaultRng;
      if (args.length > 0 && typeof args[args.length - 1] === 'object' &&
          args[args.length - 1] !== null &&
          typeof args[args.length - 1].random === 'function' &&
          typeof args[args.length - 1].int === 'function' &&
          typeof args[args.length - 1].pick === 'function') {
          rng = args[args.length - 1];
          args = args.slice(0, -1);
      }
      const fn = pool[rng.int(0, pool.length - 1)];
      return fn(...args, state);
    };

  const returnScreen = (state) =>
    state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port";

  const isFeatureUnlocked = (state, feature) => {
    if (!state.onboarding || !state.onboarding.enabled || state.onboarding.completed) return true;

    const onboarding = state.onboarding;
    const steps = onboarding.stepsCompleted;
    const seen = onboarding.qmMessagesSeen || {};

    switch (feature) {
      case 'contracts': return true;
      case 'market':   return !!(seen.welcome && steps.firstContractAccepted);
      case 'navigation': return steps.provisionsAndGoodsBought;
      case 'crew':     return steps.firstContractDelivered;
      case 'shipyard': return steps.tutorialHuntCompleted;
      case 'journal':  return steps.shipRepaired;
      default:         return true;
    }
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ENCOUNTER HELPERS (used by combat & intercept)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const roll = (sides, rng = defaultRng) => Math.ceil(rng.random() * sides);

  const guessShipType = (enemy) => {
    if (!enemy) return "sloop";
    const cannons = enemy.cannons || 0;
    if (cannons >= 50) return "ship_of_the_line";
    if (cannons >= 30) return "galleon";
    if (cannons >= 24) return "frigate";
    if (cannons >= 18) return "corvette";
    if (cannons >= 14) return "brigantine";
    if (cannons >= 10) return "schooner";
    if (cannons >= 6) return "sloop";
    if (cannons >= 3) return "cutter";
    return "dinghy";
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  HEAT HELPER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const addHeat = (state, faction, amount) => {
    if (faction === "pirate") return state;
    const alerts = { ...(state.factionAlerts || {}) };
    alerts[faction] = Math.min(10, (alerts[faction] || 0) + amount);
    return { ...state, factionAlerts: alerts };
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  GAME OVER / UNRECOVERABLE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const MIN_CREW_RATIO = 0.10;

  const getMinViableCrew = (shipType) => {
    if (shipType === "dinghy") return 0;
    const maxCrew = window.D.SHIPS[shipType]?.maxCrew ?? 0;
    return Math.floor(maxCrew * MIN_CREW_RATIO);
  };

  const getCaptainTag = (state) => {
    const fame = state.fame || 0;
    const infamy = state.infamy || 0;
    if (infamy >= 100) return { text: "Legendary Outlaw of the Caribbean", colorKey: "redBr" };
    if (infamy >= 50)  return { text: "Notorious Across the Caribbean", colorKey: "redBr" };
    if (fame >= 200)   return { text: "A Legend of the Caribbean", colorKey: "gold" };
    if (fame >= 100)   return { text: "A Notorious Captain", colorKey: "gold" };
    if (fame >= 50)    return { text: "A Recognised Captain", colorKey: "gold" };
    if (infamy >= 25)  return { text: "Wanted by the Law", colorKey: "redBr" };
    if (infamy >= 10)  return { text: "A Suspect in Several Ports", colorKey: "gold" };
    return { text: "An Unknown Captain", colorKey: "textDim" };
  };

  const getCareerHighlights = (state) => {
    const career = state.career || {};
    const daysSurvived = state.day;
    const portsTotal = Object.keys(window.D.PORTS).length;
    const portsVisitedCount = (career.portsVisited || []).length;
    const totalBattles = (career.battles?.won || 0) + (career.battles?.lost || 0) + (career.battles?.fled || 0);
    const totalCrewLost = (career.crewLost?.inBattle || 0) + (career.crewLost?.inStorm || 0)
                       + (career.crewLost?.deserted || 0) + (career.crewLost?.other || 0);
    const lines = [];

    lines.push(`You have sailed for ${daysSurvived} day${daysSurvived === 1 ? "" : "s"}.`);

    if (totalBattles > 0) {
      const won = career.battles?.won || 0;
      const lost = career.battles?.lost || 0;
      const fled = career.battles?.fled || 0;
      const parts = [];
      if (won > 0) parts.push(`won ${won}`);
      if (lost > 0) parts.push(`lost ${lost}`);
      if (fled > 0) parts.push(`fled ${fled}`);
      lines.push(`Across ${totalBattles} battle${totalBattles === 1 ? "" : "s"}, you have ${parts.join(", ")}.`);

      const sunk = career.shipsSunk || 0;
      const plundered = career.shipsPlundered || 0;
      if (sunk > 0 || plundered > 0) {
        const detailParts = [];
        if (sunk > 0) detailParts.push(`sunk ${sunk}`);
        if (plundered > 0) detailParts.push(`boarded and plundered ${plundered}`);
        lines.push(`Of those, you ${detailParts.join(" and ")}.`);
      }
    }

    if (totalCrewLost > 0) {
      const inBattle = career.crewLost?.inBattle || 0;
      const inStorm = career.crewLost?.inStorm || 0;
      const deserted = career.crewLost?.deserted || 0;
      const parts = [];
      if (inBattle > 0) parts.push(`${inBattle} to combat`);
      if (inStorm > 0) parts.push(`${inStorm} to the storms`);
      if (deserted > 0) parts.push(`${deserted} who walked away`);
      if (parts.length > 0) lines.push(`You have lost ${totalCrewLost} crew: ${parts.join(", ")}.`);
    }

    if (career.longestCrewTenure && career.longestCrewTenure >= 50) {
      lines.push(`Your longest-serving crew member sailed with you for ${career.longestCrewTenure} days.`);
    }

    if (portsVisitedCount > 0) {
      lines.push(`You have made landfall at ${portsVisitedCount} of ${portsTotal} ports across the Caribbean.`);
    }

    const earned = career.goldEarned || 0;
    const spent = career.goldSpent || 0;
    if (earned > 0 || spent > 0) {
      lines.push(`You have earned ${earned.toLocaleString()}g and spent ${spent.toLocaleString()}g.`);
    }

    if (career.stormsSurvived > 0) {
      lines.push(`You have weathered ${career.stormsSurvived} storm${career.stormsSurvived === 1 ? "" : "s"}.`);
    }

    const ships = (career.shipsOwned || []).length;
    if (ships > 1) {
      lines.push(`You have commanded ${ships} ship${ships === 1 ? "" : "s"} over your career.`);
    }

    if (career.contrabandSeized > 0) {
      lines.push(`You have been caught smuggling contraband ${career.contrabandSeized} time${career.contrabandSeized === 1 ? "" : "s"}.`);
    }

    return lines;
  };

  const isUnrecoverable = (state) => {
    const hull0     = state.ship.hull === 0;
    const noCrew    = state.crew.roster.length === 0;
    const notDinghy = state.ship.type !== "dinghy";
    const crewCrisis = noCrew && notDinghy;

    if (!hull0 && !crewCrisis) {
      return { unrecoverable: false, reason: null };
    }

    const portGoods = state.portMarket?.goods || {};
    const holdValue = Object.entries(state.hold.items).reduce((sum, [good, qty]) => {
      const sellPrice = portGoods[good]?.sellToPort ?? 0;
      return sum + qty * sellPrice;
    }, 0);
    const liquidValue = state.gold + holdValue;

    const repairCost = hull0 ? window.L.shipRepairCost(state) : 0;
    const minCrew = window.L.getMinViableCrew(state.ship.type);
    const crewNeeded = Math.max(0, minCrew - state.crew.roster.length);
    const crewCost = crewNeeded * 50;

    const minRecoveryCost = repairCost + crewCost;

    if (liquidValue >= minRecoveryCost) {
      return { unrecoverable: false, reason: null };
    }

    return {
      unrecoverable: true,
      reason: hull0
        ? "Your ship is wrecked, your crew is gone, and there is nothing left to trade or sail with."
        : "There is no one left to crew your ship, no gold to hire more, and nothing left to sell.",
    };
  };



  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  FACTION SPECIFICITIES (birth & port)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ── Birth traits ──────────────────────────────────────────────────

  const getBirthTrait = (state, traitKey) => {
  if (!state.faction) return null;
  const traits = window.D.BIRTH_TRAITS[state.faction];
  if (!traits) return null;
  return traitKey in traits ? traits[traitKey] : null;
};

  const getBirthTraits = (state) => {
    if (!state.faction) return null;
    return window.D.BIRTH_TRAITS[state.faction] || null;
  };

  const isSpanishBorn = (state) => state.faction === 'spanish';

  // ── Port specialties ─────────────────────────────────────────────

  const getPortSpecialty = (portKey) => {
    const port = window.D.PORTS[portKey];
    if (!port) return null;
    return window.D.PORT_SPECIALTIES[port.faction] || null;
  };

  const getPortSpecialtyById = (portKey, specialtyId) => {
    const specialty = getPortSpecialty(portKey);
    return specialty && specialty.id === specialtyId ? specialty : null;
  };

  const isPortServiceAvailable = (state, portKey, serviceId) => {
    const specialty = getPortSpecialty(portKey);
    if (!specialty || specialty.id !== serviceId) return false;

    const access = specialty.access || {};
    if (access.reputation) {
      const rep = state.reputation[portKey] || 0;
      if (rep < access.reputation) return false;
    }
    return true;
  };

  // ── Bank helpers ──────────────────────────────────────────────────

  const getBankTrustPct = (state, portKey) => {
    const rep = state.reputation[portKey] || 0;
    const thresholds = window.D.SERVICE_THRESHOLDS.bank.trustByReputation;
    for (const tier of thresholds) {
      if (rep >= tier.repMin && rep <= tier.repMax) {
        return tier.pct;
      }
    }
    return 0;
  };

  const getBankInterestRate = (state, portKey) => {
    const rep = state.reputation[portKey] || 0;
    const points = window.D.SERVICE_THRESHOLDS.bank.interestByReputation;
    // Simple stepwise interpolation — if rep >= point.rep, use that point's rate
    let rate = 0.10;
    for (const p of points) {
      if (rep >= p.rep) rate = p.rate;
    }
    return rate;
  };

  const getBankCapacity = (state) => {
    // Player capacity: Fame + ship value
    const fame = state.fame || 0;
    const shipStats = window.L.getShipStats(state);
    const shipValue = window.D.SHIPS[state.ship.type]?.cost || 0;
    const fameComponent = fame * 200;           // Fame 200 → 40,000g
    const shipComponent = Math.floor(shipValue * 0.30); // 30% of ship value
    const baseCapacity = 10000;
    return baseCapacity + fameComponent + shipComponent;
  };

  const getBankLoanCeiling = (state, portKey) => {
    const capacity = getBankCapacity(state);
    const trustPct = getBankTrustPct(state, portKey);
    return Math.floor(capacity * trustPct);
  };

  // ── Inquisitor helpers ────────────────────────────────────────────

  const getInquisitorCost = (state) => {
    const infamy = state.infamy || 0;
    const pricing = window.D.SERVICE_THRESHOLDS.inquisitor.pricing;
    for (const tier of pricing) {
      if (infamy >= tier.infamyMin && infamy <= tier.infamyMax) {
        return tier.cost;
      }
    }
    return 1500; // fallback
  };

  // ── Embassy helpers ──────────────────────────────────────────────

  const getEmbassyCost = (state, targetFaction) => {
    const targetRep = state.reputation[targetFaction] || 0;
    const pricing = window.D.SERVICE_THRESHOLDS.embassy.pricing;
    for (const tier of pricing) {
      if (targetRep >= tier.repMin && targetRep <= tier.repMax) {
        return tier.cost;
      }
    }
    return 8000; // fallback
  };

  // ── Naval Yard helpers ────────────────────────────────────────────

  const getNavalYardEarlyAccess = (state) => {
    const fame = state.fame || 0;
    const thresholds = window.D.SERVICE_THRESHOLDS.navalYard;
    if (fame < thresholds.fameRequiredForEarlyAccess) return null;

    const modifiers = thresholds.earlyAccessModifiers;
    // Return the thresholds for checking individual ships/equipment
    return {
      equipmentFameThreshold: (baseFame) => Math.floor(baseFame * modifiers.equipmentFameReduction),
      shipFameThreshold: (baseFame) => Math.max(0, baseFame - modifiers.shipFameReduction),
    };
  };

  const isEarlyAccessEligible = (state, item, itemType) => {
    const access = getNavalYardEarlyAccess(state);
    if (!access) return false;

    const requiredFame = item.requiredFame || 0;
    const adjusted = itemType === 'ship'
      ? access.shipFameThreshold(requiredFame)
      : access.equipmentFameThreshold(requiredFame);

    return state.fame >= adjusted;
  };



  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EXPOSE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Object.assign(window.L, {
    // Helpers
    RNG : defaultRng,
    reputationLabel,
    getFameInfo,
    getInfamyLabel,
    getHeatLabel,
    meetsRequirement,
    canBribe,
    getEffectiveMorale,

    // Ship & Equipment
    getShipStats,
    getEquipmentEffect,
    canInstallEquipment,
    shipRepairCost,

    // Log & Utility
    classifyLogLine,
    getLogTabCategory,
    logPick,
    returnScreen,
    isFeatureUnlocked,

    // Encounter helpers
    roll,
    guessShipType,

    // Heat
    addHeat,

    // Game-Over
    getMinViableCrew,
    getCaptainTag,
    getCareerHighlights,
    isUnrecoverable,

    // Faction player and port identity
      getBirthTrait,
      getBirthTraits,
      isSpanishBorn,
      getPortSpecialty,
      getPortSpecialtyById,
      isPortServiceAvailable,
      getBankTrustPct,
      getBankInterestRate,
      getBankCapacity,
      getBankLoanCeiling,
      getInquisitorCost,
      getEmbassyCost,
      getNavalYardEarlyAccess,
      isEarlyAccessEligible,

  });
})();