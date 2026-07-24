// ═══════════════════════════════════════════════════════════════════
//  logic.js : ALL PURE FUNCTIONS FOR GAME LOGIC
//  No side effects, no state mutation. Only calculations and data transformations.
//  Imports: window.D (data constants)
//  Exposed as window.L for global access.
// ═══════════════════════════════════════════════════════════════════

window.L = (() => {
  // Destructure constants for easier access
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT, RANDOM_EVENTS, STARTS, } = window.D;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  HELPER FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

  const canBribe = (state) => (state.infamy ?? 0) < 50;

  const getEffectiveMorale = (state) => {
    const shipStats = L.getShipStats(state);
    const moraleBonus = shipStats.moraleBonus || 0;
    return Math.min(100, state.crew.morale + moraleBonus);
  };

  const getShipStats = (state) => {
    const base = SHIPS[state.ship.type];
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

  const returnScreen = (state) =>
    state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port";

  // --------------------------------------------
  // LOGS FUNCTIONS
  // --------------------------------------------

  const classifyLogLine = (text) => {
    if (!text) return null;
    const t = text;

    if (t.includes("Arrived at"))      return "arrival";
    if (t.includes("Setting sail") || t.includes("Changing course"))   return "sailing";
    if (t.includes("left the crew") || t.includes("has left") || t.includes("Hired")) return "crew";
    if (t.includes("upset") || t.includes("disturbed"))       return "warning";
    if (t.includes("settled down"))   return "crew";
    if (t.includes("mutineer") || t.includes("Mutiny"))       return "combat";
    if (t.includes("Victory") || t.includes("Defeated"))      return "combat";
    if (t.includes("Escaped") || t.includes("fled"))          return "combat";
    if (t.includes("Bought") || t.includes("Sold") || t.includes("trade") || t.includes("repaired")) return "trade";
    if (t.includes("Completed:") || t.includes("mission"))    return "mission";
    if (t.includes("New port discovered") || t.includes("chart")) return "discovery";
    if (t.includes("infamy") || t.includes("wanted") || t.includes("Wanted")) return "infamy";
    if (t.includes("heat") || t.includes("alert") || t.includes("patrol")) return "warning";
    if (t.includes("Plundered") || t.includes("plunder"))    return "combat";
    if (t.includes("survivor") || t.includes("rescue"))      return "crew";
    if (t.includes("stores are empty") || t.includes("barrels are dry")) return "warning";
    if (t.includes("morale") || t.includes("drinks"))        return "crew";
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
    const fn = pool[Math.floor(Math.random() * pool.length)];
    return fn(...args, state);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SHIP & REPAIR FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const shipRepairCost = (state) => {
    const ship = L.getShipStats(state);
    const hullMissing = ship.maxHull - state.ship.hull;
    return hullMissing * Math.ceil(ship.maxHull / 20);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  TRAVEL FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const getSeaPosition = (route) => {
    if (!route || route.totalDays === 0) return route?.originPos || { x: 0, y: 0 };
    const progress = route.progressDays / route.totalDays;
    return {
      x: Math.round(route.originPos.x + (route.destinationPos.x - route.originPos.x) * progress),
      y: Math.round(route.originPos.y + (route.destinationPos.y - route.originPos.y) * progress),
    };
  };

  // ── Private helper: calculate travel days between any two coordinate points ──
  const travelDaysBetween = (posA, posB, state) => {
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const distance = Math.hypot(dx, dy);

    const ship = L.getShipStats(state);
    let days = Math.ceil(distance / (ship.speed * 4));

    if (state.crew.morale < 50) days += 1;
    if (state.crew.morale < 30) days += 1;

    const angleToPort = Math.atan2(dy, dx) * 180 / Math.PI;
    const windAngleDiff = Math.abs(angleToPort - state.wind.angle) % 360;
    if (windAngleDiff < 45 || windAngleDiff > 315) days -= 1;
    else if (windAngleDiff > 135 && windAngleDiff < 225) days += 1;

    let baseDays = Math.max(1, days);

    if (baseDays > 4) {
      const reduction = L.getEquipmentEffect(state, "longVoyageDayReduction") || 0;
      baseDays = Math.max(1, baseDays - reduction);
    }

    const loadPct = L.getHoldLoadPct(state.hold?.items, L.getHoldCapacity(state));
    const mult = L.getHoldSpeedMultiplier(loadPct);
    return Math.max(1, Math.round(baseDays * mult));
  };

  // ── Public: port‑to‑port travel (legacy interface) ─────────────────────────
  const travelDays = (fromPort, toPort, state) => {
    const from = D.PORTS[fromPort];
    const to = D.PORTS[toPort];
    if (!from || !to) return Infinity;
    return L.travelDaysBetween(from, to, state);
  };

  // ── Public: arbitrary sea‑position to port ─────────────────────────────────
  const travelDaysFromPosition = (originPos, portKey, state) => {
    const port = D.PORTS[portKey];
    if (!port) return Infinity;
    return L.travelDaysBetween(originPos, port, state);
  };

  // ── General reachability check (used by both land and sea versions) ───────
  const canReachFrom = (origin, portKey, state, maxDays) => {
    const port = D.PORTS[portKey];
    if (!port) return false;
    if (port.hidden && !state.discoveredPorts?.includes(portKey)) return false;
    if (port.minHull) {
      const effectiveHull = L.getShipStats(state).maxHull;
      if (effectiveHull < port.minHull) return false;
    }
    let days;
    if (typeof origin === "string") {
      days = L.travelDays(origin, portKey, state);
    } else {
      days = L.travelDaysFromPosition(origin, portKey, state);
    }
    return days <= maxDays;
  };

  // ── Public: legacy canReach (from current port, using ship's maxDays) ─────
  const canReach = (state, portKey) => {
    if (portKey === state.currentPort) return false;
    const shipMaxDays = D.SHIPS[state.ship?.type]?.maxDays ?? 10;
    return L.canReachFrom(state.currentPort, portKey, state, shipMaxDays);
  };

  // ── Public: reachability from sea position ─────────────────────────────────
  const canReachFromPosition = (originPos, portKey, state, remainingEndurance) => {
    return L.canReachFrom(originPos, portKey, state, remainingEndurance);
  };

  // ── Legacy helper: returns reachable ports from sea (for UI button disable) ─
  const getReachablePortsFromSea = (state) => {
    const route = state.route;
    if (!route) return [];
    const seaPos = L.getSeaPosition(route);
    const remaining = (route.enduranceBudget || 0) - (route.enduranceSpent || 0);
    return Object.keys(D.PORTS).filter(portKey => {
      if (portKey === route.destinationPort) return false;
      if (D.PORTS[portKey]?.hidden && !state.discoveredPorts?.includes(portKey)) return false;
      return L.canReachFromPosition(seaPos, portKey, state, remaining);
    });
  };

  const getUnreachableReason = (state, portKey) => {
    if (portKey === state.currentPort) return null;
    const port = PORTS[portKey];
    if (!port) return "Unknown port";
    if (port.hidden && !state.discoveredPorts?.includes(portKey)) return null;
    if (port.minHull) {
      const effectiveHull = L.getShipStats(state).maxHull;
      if (effectiveHull < port.minHull) {
        return `Requires a heavier vessel (your ship: ${effectiveHull} hull, required: ${port.minHull}+)`;
      }
    }
    const days = L.travelDays(state.currentPort, portKey, state);
    const shipMaxDays = SHIPS[state.ship?.type]?.maxDays ?? 10;
    if (days > shipMaxDays) {
      return `${days}-day voyage exceeds your ship's range (${shipMaxDays} days)`;
    }
    return null;
  };

  const processStarvation = (state, prov, currentRoster) => {
    const roster = currentRoster || [];
    const daysWithoutFood = state.daysWithoutFood ?? 0;
    const daysWithoutWater = state.daysWithoutWater ?? 0;
    const FOOD_GRACE = 14;
    const WATER_GRACE = 3;
    let newDaysWithoutFood = daysWithoutFood;
    let newDaysWithoutWater = daysWithoutWater;
    const warningLogs = [];
    let deathLog = null;
    let newRoster = roster;

    if (prov.foodEmpty) newDaysWithoutFood += 1;
    else newDaysWithoutFood = 0;
    if (prov.waterEmpty) newDaysWithoutWater += 1;
    else newDaysWithoutWater = 0;

    if (newDaysWithoutFood === FOOD_GRACE - 1) {
      warningLogs.push("The crew grows gaunt. Without food, starvation is imminent.");
    }
    if (newDaysWithoutWater === WATER_GRACE - 1) {
      warningLogs.push("Tongues are swollen. The crew is desperate for fresh water.");
    }

    if (roster.length > 0) {
      const foodDeath = newDaysWithoutFood >= FOOD_GRACE;
      const waterDeath = newDaysWithoutWater >= WATER_GRACE;
      if (waterDeath || foodDeath) {
        const { newRoster: tempRoster, removed } = L.removeRandomCrew(roster, 1);
        if (removed.length > 0) {
          const name = `${removed[0].firstName} ${removed[0].lastName}`;
          if (waterDeath && foodDeath) deathLog = `Hunger and thirst claim a crew member. ${name} has died.`;
          else if (waterDeath) deathLog = `Thirst claims a crew member. ${name} has died.`;
          else deathLog = `Starvation claims a crew member. ${name} has died.`;
          newRoster = tempRoster;
        }
      }
    }
    return { daysWithoutFood: newDaysWithoutFood, daysWithoutWater: newDaysWithoutWater, warningLogs, deathLog, roster: newRoster };
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  REPUTATION FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const decayReputation = (state) => {
    const newRep = { ...state.reputation };
    Object.keys(newRep).forEach(port => {
      if (newRep[port] > 50) newRep[port] = Math.max(50, newRep[port] - 1);
    });
    return newRep;
  };

  const applyReputationImpact = (state, repImpact) => {
    const newRep = { ...state.reputation };
    Object.entries(repImpact).forEach(([faction, delta]) => {
      Object.keys(PORTS).forEach(port => {
        if (PORTS[port].faction === faction) {
          newRep[port] = Math.max(0, Math.min(100, (newRep[port] || 50) + delta));
        }
      });
    });
    return newRep;
  };

  const getRepPerk = (rep) => {
    if (rep >= 80) return { tier: "allied", repairMult: 0.80, missionMult: 1.20, servicesBlocked: false };
    if (rep >= 50) return { tier: "friendly", repairMult: 0.90, missionMult: 1.10, servicesBlocked: false };
    if (rep >= 30) return { tier: "neutral", repairMult: 1.00, missionMult: 0.90, servicesBlocked: false };
    if (rep >= 10) return { tier: "hostile", repairMult: 1.00, missionMult: 0.75, servicesBlocked: false };
    return { tier: "at_war", repairMult: 1.00, missionMult: 0, servicesBlocked: true };
  };

  function addHeat(state, faction, amount) {
  if (faction === "pirate") return state;
  const alerts = { ...(state.factionAlerts || {}) };
  alerts[faction] = Math.min(10, (alerts[faction] || 0) + amount);
  return { ...state, factionAlerts: alerts };
}

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  CREW FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const payCrewWages = (state) => {
    const effectiveMorale = L.getEffectiveMorale(state);
    const wageMultiplier = effectiveMorale < 30 ? 1.5 : 1;
    return Math.floor(state.crew.roster.length * 2 * wageMultiplier);
  };

  const removeRandomCrew = (roster, count) => {
    if (count <= 0) return { newRoster: [...roster], removed: [] };
    const eligible = roster.filter(m => !(m.tags || []).includes("protected"));
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const removed = shuffled.slice(0, count);
    const removedIds = new Set(removed.map(m => m.id));
    const newRoster = roster.filter(m => !removedIds.has(m.id));
    return { newRoster, removed };
  };

  const hasTag = (member, tag) => (member.tags || []).includes(tag);
  const addTag = (member, tag) => ({ ...member, tags: [...(member.tags || []), tag] });
  const removeTag = (member, tag) => ({ ...member, tags: (member.tags || []).filter(t => t !== tag) });

  const revealTag = (member, traitName) => {
    const hidden = "hidden_" + traitName;
    const revealed = "revealed_" + traitName;
    if (member.tags?.includes(hidden)) {
      return { ...member, tags: [...(member.tags || []).filter(t => t !== hidden), revealed] };
    }
    return member;
  };

  const getCrewAlignment = (state, faction) => {
    const roster = state.crew?.roster || [];
    if (roster.length === 0) return 0;
    const matching = roster.filter(m => m.faction === faction).length;
    return matching / roster.length;
  };

  const getAlignmentModifier = (state, faction) => {
    return 0.5 + L.getCrewAlignment(state, faction);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EVENT FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const triggerRandomEvent = (state) => {
    const availableEvents = RANDOM_EVENTS.filter(event => !event.condition || event.condition(state));
    if (availableEvents.length === 0) return null;
    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    if (Array.isArray(event.desc)) event.desc = event.desc[Math.floor(Math.random() * event.desc.length)];
    return { ...event };
  };

  const maybeRandomPatrol = (state) => {
    const port = D.PORTS[state.currentPort];
    if (!port || port.faction === "pirate") return false;
    const baseChance = 0.01;
    const infamyBonus = (state.infamy ?? 0) / 400;
    const alerts = state.factionAlerts || {};
    const originFaction = port.faction;
    const destFaction = state.destination ? D.PORTS[state.destination]?.faction : null;
    const relevantHeat = Math.max(alerts[originFaction] || 0, destFaction ? (alerts[destFaction] || 0) : 0);
    const originRep = state.reputation[state.currentPort] || 50;
    const destRep = state.destination ? (state.reputation[state.destination] || 50) : originRep;
    const avgRep = (originRep + destRep) / 2;
    const heatDampening = avgRep >= 70 ? 0.5 : avgRep >= 50 ? 0.75 : 1.0;
    const effectiveHeat = Math.floor(relevantHeat * heatDampening);
    const heatBonus = effectiveHeat * 0.03;
    const chance = Math.min(baseChance + infamyBonus + heatBonus, 0.40);
    return Math.random() < chance;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  COMBAT FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const emptyOutcome = () => ({
    player: { hullDamage: 0, crewLoss: 0 },
    enemy: { hullDamage: 0, crewLoss: 0 },
    moraleDelta: 0,
    fled: false,
    instantVictory: false,
    goldReward: 0,
    enemyCargo: {},
  });

  const getNPCAction = (enemy) => {
    const roll = Math.random();
    if (roll < 0.7) return "broadside";
    if (roll < 0.95) return "precision";
    return "grapple";
  };

  const maybeCrewLoss = (amount) => Math.random() < 0.5 ? 0 : Math.floor(amount);

  const resolvePlayerAction = (state, action) => {
    const shipStats = L.getShipStats(state);
    const out = L.emptyOutcome();
    switch (action) {
      case "broadside": {
        const dmg = shipStats.cannons * (0.8 + Math.random() * 0.4);
        const hullMod = 1 + (L.getEquipmentEffect(state, "hullDmgPct") || 0);
        const crewMod = 1 + (L.getEquipmentEffect(state, "crewDmgPct") || 0);
        out.player.hullDamage = Math.max(1, Math.floor(dmg * 0.6 * hullMod));
        out.player.crewLoss = L.maybeCrewLoss(dmg * 0.4 / 3 * crewMod);
        break;
      }
      case "precision": {
        const precisionBaseChance = 0.7 + (L.getEquipmentEffect(state, "precisionHitPct") || 0);
        if (Math.random() < precisionBaseChance) {
          const dmg = shipStats.cannons * (1.2 + Math.random() * 0.6);
          const hullMod = 1 + (L.getEquipmentEffect(state, "hullDmgPct") || 0);
          const crewMod = 1 + (L.getEquipmentEffect(state, "crewDmgPct") || 0);
          out.player.hullDamage = Math.floor(dmg * 0.9 * hullMod);
          out.player.crewLoss = L.maybeCrewLoss(dmg * 0.1 / 3 * crewMod);
        }
        break;
      }
      case "grapple": {
        const enemy = state.battleState.enemy;
        const playerCrew = state.crew.roster.length;
        const enemyCrew = enemy.crew;
        const playerHullPct = state.ship.hull / shipStats.maxHull;
        const playerMoralePct = state.crew.morale / 100;
        let successChance = 0.5;
        successChance += Math.min(0.3, Math.max(0, (playerCrew - enemyCrew) / enemyCrew * 0.3));
        successChance += Math.min(0.2, Math.max(0, (playerMoralePct - 0.5) * 0.4));
        successChance += Math.min(0.2, Math.max(0, (playerHullPct - 0.5) * 0.4));
        successChance = Math.min(0.95, successChance);
        if (Math.random() < successChance) {
          out.instantVictory = true;
          const ratio = playerCrew / (playerCrew + enemyCrew);
          let loss = Math.ceil(playerCrew * (0.05 + 0.25 * (1 - ratio)));
          if (playerCrew < 5) loss = 0;
          out.enemy.crewLoss = loss;
          out.plunderRisk = state.activeMission?.risk || "medium";
        } else {
          const crewLossPct = 0.3 + Math.random() * 0.2;
          out.enemy.crewLoss = Math.floor(playerCrew * crewLossPct);
        }
        break;
      }
      case "evade": {
        const enemyShipType = L.guessShipType(state.battleState.enemy);
        const enemySpeed = SHIPS[enemyShipType]?.speed ?? 10;
        const speedBonus = Math.min(0.3, Math.max(-0.3, (shipStats.speed - enemySpeed) * 0.02));
        const fleeChance = Math.min(0.95, Math.max(0.20, 0.6 + speedBonus));
        if (Math.random() < fleeChance) {
          out.fled = true;
        } else {
          const enemyDmg = state.battleState.enemy.cannons * (0.8 + Math.random() * 0.4);
          out.player.hullDamage = Math.floor(enemyDmg * 0.3);
          out.player.crewLoss = L.maybeCrewLoss(enemyDmg * 0.2 / 3);
        }
        break;
      }
    }
    return out;
  };

  const applyMoraleModifier = (state, action, playerOutcome) => {
    let delta = 0;
    if (playerOutcome.instantVictory) delta = 5;
    else if (playerOutcome.fled) delta = -5;
    else {
      const newEnemyHull = Math.max(0, state.battleState.enemyHull - playerOutcome.player.hullDamage);
      if (newEnemyHull <= 0) delta = 5;
      else if (action === "grapple") delta = -10;
    }
    return { moraleDelta: delta };
  };

  const resolveNpcAction = (state) => {
    const enemy = state.battleState.enemy;
    const npcAction = L.getNPCAction(enemy);
    const npcDmg = enemy.cannons * (0.7 + Math.random() * 0.3);
    const result = {
      enemy: { hullDamage: 0, crewLoss: 0 },
      player: { hullDamage: 0, crewLoss: 0 },
      action: npcAction,
      hit: false,
      grappleSuccess: false,
    };
    switch (npcAction) {
      case "broadside": {
        result.enemy.hullDamage = Math.floor(npcDmg * 0.6);
        result.enemy.crewLoss = L.maybeCrewLoss(npcDmg * 0.4 / 3);
        break;
      }
      case "precision": {
        const npcHit = Math.random() < 0.7;
        result.hit = npcHit;
        if (npcHit) {
          result.enemy.hullDamage = Math.floor(npcDmg * 0.9);
          result.enemy.crewLoss = L.maybeCrewLoss(npcDmg * 0.1 / 3);
        }
        break;
      }
      case "grapple": {
        const enemyCrew = enemy.crew;
        const playerCrew = state.crew.roster.length;
        const enemyHullPct = state.battleState.enemyHull / enemy.hull;
        let npcSuccessChance = 0.5;
        npcSuccessChance += Math.min(0.3, Math.max(0, (enemyCrew - playerCrew) / playerCrew * 0.3));
        npcSuccessChance += Math.min(0.2, Math.max(0, (enemyHullPct - 0.5) * 0.4));
        npcSuccessChance += 0.1;
        npcSuccessChance = Math.min(0.95, npcSuccessChance);
        const npcSuccess = Math.random() < npcSuccessChance;
        result.grappleSuccess = npcSuccess;
        if (npcSuccess) {
          result.enemy.crewLoss += Math.floor(playerCrew * (0.3 + Math.random() * 0.2));
        } else {
          const ratio = enemyCrew / (enemyCrew + playerCrew);
          let loss = Math.ceil(enemyCrew * (0.05 + 0.25 * (1 - ratio)));
          if (enemyCrew < 5) loss = 0;
          result.player.crewLoss += loss;
        }
        break;
      }
    }
    return result;
  };

  const applyDamageMoralePenalty = (state, outcome) => {
    const effectiveMorale = L.getEffectiveMorale(state);
    const modifier = effectiveMorale < 30 ? 1.2 : (effectiveMorale > 70 ? 0.9 : 1);
    const wasHit = outcome.player.hullDamage > 0;
    outcome.player.hullDamage = Math.floor(outcome.player.hullDamage * modifier);
    if (wasHit && outcome.player.hullDamage === 0) outcome.player.hullDamage = 1;
    outcome.player.crewLoss = Math.floor(outcome.player.crewLoss * modifier);
    return outcome;
  };

  const combineCombatOutcomes = (playerOut, morale, npcOut) => {
    const final = L.emptyOutcome();
    final.player.hullDamage = playerOut.player.hullDamage;
    final.player.crewLoss = playerOut.player.crewLoss;
    final.enemy.hullDamage = playerOut.enemy.hullDamage;
    final.enemy.crewLoss = playerOut.enemy.crewLoss;
    final.fled = playerOut.fled;
    final.instantVictory = playerOut.instantVictory;
    final.goldReward = playerOut.goldReward;
    final.enemyCargo = playerOut.enemyCargo || {};
    final.moraleDelta = morale.moraleDelta;
    if (npcOut) {
      final.enemy.hullDamage += npcOut.enemy.hullDamage;
      final.enemy.crewLoss += npcOut.enemy.crewLoss;
      final.player.hullDamage += npcOut.player.hullDamage;
      final.player.crewLoss += npcOut.player.crewLoss;
    }
    return final;
  };

  const resolveCombatAction = (state, action) => {
    if (!state.battleState) return L.emptyOutcome();
    const playerOutcome = L.resolvePlayerAction(state, action);
    let playerHit = null, playerGrappleSuccess = null;
    if (action === "precision") playerHit = playerOutcome.player.hullDamage > 0;
    else if (action === "grapple") playerGrappleSuccess = playerOutcome.instantVictory;
    const moraleOutcome = L.applyMoraleModifier(state, action, playerOutcome);
    let npcOutcome = null;
    if (!playerOutcome.fled && !playerOutcome.instantVictory) {
      npcOutcome = L.resolveNpcAction(state);
    }
    const combined = L.combineCombatOutcomes(playerOutcome, moraleOutcome, npcOutcome);
    combined.playerCrewLossFromPlayerAction = playerOutcome.enemy.crewLoss;
    combined.playerCrewLossFromNpcAction = npcOutcome ? npcOutcome.enemy.crewLoss : 0;
    combined.enemyCrewLossFromPlayerAction = playerOutcome.player.crewLoss;
    combined.enemyCrewLossFromNpcAction = npcOutcome ? npcOutcome.player.crewLoss : 0;
    combined.playerHullDamageOutput = playerOutcome.player.hullDamage;
    combined.npcHullDamageOutput = npcOutcome ? npcOutcome.enemy.hullDamage : 0;
    const crewLossMult = L.getEquipmentEffect(state, "crewLossMult");
    if (crewLossMult !== 1) combined.player.crewLoss = Math.floor(combined.player.crewLoss * crewLossMult);
    const finalOutcome = L.applyDamageMoralePenalty(state, combined);
    finalOutcome.playerAction = action;
    finalOutcome.npcAction = npcOutcome ? npcOutcome.action : null;
    finalOutcome.playerHit = playerHit;
    finalOutcome.playerGrappleSuccess = playerGrappleSuccess;
    finalOutcome.npcHit = npcOutcome ? npcOutcome.hit : null;
    finalOutcome.npcGrappleSuccess = npcOutcome ? npcOutcome.grappleSuccess : null;
    finalOutcome.playerCrewLossFromPlayerAction = combined.playerCrewLossFromPlayerAction;
    finalOutcome.playerCrewLossFromNpcAction = combined.playerCrewLossFromNpcAction;
    finalOutcome.enemyCrewLossFromPlayerAction = combined.enemyCrewLossFromPlayerAction;
    finalOutcome.enemyCrewLossFromNpcAction = combined.enemyCrewLossFromNpcAction;
    finalOutcome.playerHullDamageOutput = combined.playerHullDamageOutput;
    finalOutcome.npcHullDamageOutput = combined.npcHullDamageOutput;
    return finalOutcome;
  };

  //--------------------------------------
  //---  encounter context & pre-screen ---
  //--------------------------------------

  const roll = (sides) => Math.ceil(Math.random() * sides);

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

  function buildEncounterContext(state, type, enemy) {
    const { ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE, SHIPS } = window.D;
    const shipStats = L.getShipStats(state);
    const mySpeed = shipStats.speed;
    const enemyShip = L.guessShipType(enemy);
    const eSpeed = SHIPS[enemyShip]?.speed ?? 5;
    const rep = state.reputation[state.destination ?? state.currentPort] ?? 20;
    const gold = state.gold;
    const bribeCost = Math.round((enemy.gold ?? 500) * 0.4);

    const noFleeTypes = ["hostile_port_entry", "bounty_target", "mission_combat", "navy_patrol", "navy_patrol_combat", "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend"];
    const canFlee = !noFleeTypes.includes(type);
    const fleeReason = canFlee ? null
      : type === "hostile_port_entry" ? "Already in range of the harbour guns"
      : type === "navy_patrol" || type === "navy_patrol_combat" ? "You cannot outrun a patrol in open waters"
      : "The target is cornered. No escape";

    const noParleyTypes = ["hostile_port_entry", "bounty_target", "mission_combat", "smuggling_caught", "navy_patrol", "navy_patrol_combat", "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend"];
    const canParley = !noParleyTypes.includes(type) && rep >= 30;
    const parleyReason = noParleyTypes.includes(type) ? "They are not here to negotiate" : rep < 30 ? `Reputation too low (${rep} : need 30)` : null;

    const noBribeTypes = ["hostile_port_entry", "bounty_target", "mission_combat", "navy_patrol", "navy_patrol_combat", "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend"];
    const bribeBlocked = noBribeTypes.includes(type);
    const canAffordBribe = gold >= bribeCost;
    const bribeInfamyBlocked = !L.canBribe(state);
    const canBribeResult = !bribeBlocked && canAffordBribe && !bribeInfamyBlocked;
    const bribeReason = bribeBlocked ? "They cannot be bought"
      : bribeInfamyBlocked ? "Your reputation for bribery has preceded you"
      : !canAffordBribe ? `Need ${bribeCost}g (you have ${gold}g)` : null;

    const noSurrenderTypes = ["bounty_target", "mission_combat", "distressed_merchant_help", "distressed_merchant_plunder", "escort_defend"];
    const canSurrender = !noSurrenderTypes.includes(type);
    const surrenderReason = canSurrender ? null : "Surrender means death here";

    if (type === "distressed_merchant_help" || type === "distressed_merchant_plunder" || type === "escort_defend") {
      return {
        type,
        encounterType: type,
        enemy: { ...enemy, ship: enemyShip },
        flavourText: ENCOUNTER_FLAVOUR[type]?.(enemy, rep) ?? `A ${enemy.name} moves to intercept.`,
        options: [{
          id: "fight",
          label: "Fight",
          available: true,
          reason: null,
          action: { type: "INTERCEPT_FIGHT" },
          speedCheck: null,
        }],
      };
    }

    const isNavyPatrol = type === "navy_patrol" || type === "navy_patrol_combat";
    const options = [];
    if (isNavyPatrol) {
      options.push({
        id: "inspect",
        label: "Allow Inspection",
        available: true,
        reason: null,
        action: { type: "PATROL_INSPECT" },
        speedCheck: null,
      });
      options.push({
        id: "fight",
        label: "Refuse and Open Fire",
        available: true,
        reason: null,
        action: { type: "INTERCEPT_FIGHT" },
        speedCheck: null,
      });
    } else {
      options.push({
        id: "fight",
        label: "Fight",
        available: true,
        reason: null,
        action: { type: "INTERCEPT_FIGHT" },
        speedCheck: null,
      });
      options.push({
        id: "flee",
        label: "Attempt to Flee",
        available: canFlee,
        reason: fleeReason,
        action: { type: "INTERCEPT_FLEE" },
        speedCheck: canFlee ? { player: mySpeed, enemy: eSpeed } : null,
      });
      options.push({
        id: "parley",
        label: "Parley",
        available: canParley,
        reason: parleyReason,
        action: { type: "INTERCEPT_PARLEY" },
        speedCheck: null,
      });
      options.push({
        id: "bribe",
        label: canBribeResult ? `Bribe (${bribeCost}g)` : "Bribe",
        available: canBribeResult,
        reason: bribeReason,
        action: { type: "INTERCEPT_BRIBE" },
        speedCheck: null,
      });
      options.push({
        id: "surrender",
        label: "Surrender",
        available: canSurrender,
        reason: surrenderReason,
        action: { type: "INTERCEPT_SURRENDER" },
        speedCheck: null,
      });
    }
    return {
      type,
      encounterType: type,
      enemy: { ...enemy, ship: enemyShip },
      flavourText: ENCOUNTER_FLAVOUR[type]?.(enemy, rep) ?? `A ${enemy.name} moves to intercept.`,
      options,
    };
  }

  //-----------------------------------------------
  //----- cargo, economy, trade, and resources functions  -----
  //---------------------------------------------------

  const getHoldCapacity = (state) => L.getShipStats(state).holdCapacity ?? 200;
  const getHoldUsed = (holdItems) => Object.values(holdItems || {}).reduce((sum, qty) => sum + qty, 0);
  const getHoldLoadPct = (holdItems, capacity) => {
    if (!capacity || capacity <= 0) return 0;
    const used = Object.values(holdItems || {}).reduce((sum, qty) => sum + qty, 0);
    return Math.min(1, used / capacity);
  };
  const getHoldSpeedMultiplier = (loadPct) => {
    if (loadPct < 0.50) return 1.00;
    if (loadPct < 0.75) return 1.11;
    return 1.33;
  };
  const getProvisionConsumptionPerDay = (state) => {
    const crewCount = state.crew?.roster?.length ?? 0;
    const rate = Math.ceil(crewCount / 10);
    return { food: rate, water: rate };
  };
  const getDaysOfProvisions = (holdItems, consumptionPerDay) => ({
    food: consumptionPerDay.food > 0 ? Math.floor((holdItems.food || 0) / consumptionPerDay.food) : Infinity,
    water: consumptionPerDay.water > 0 ? Math.floor((holdItems.water || 0) / consumptionPerDay.water) : Infinity,
  });
  const applyLoseCargoPercent = (holdItems, percent) => {
    const factor = 1 - (percent / 100);
    const result = {};
    Object.entries(holdItems || {}).forEach(([good, qty]) => { result[good] = Math.floor(qty * factor); });
    return result;
  };
  const applyLoseContraband = (holdItems) => {
    const result = { ...holdItems };
    Object.keys(window.D.RESOURCES).forEach(good => {
      if (window.D.RESOURCES[good].illegal) result[good] = 0;
    });
    return result;
  };


  // Returns the static trade profile of a port — which goods are structurally cheap
// (Good Deals) and which are structurally scarce (In Demand / good to sell here).
// This is derived purely from GOODS_AVAILABILITY + FACTION_PRICE_MODIFIERS and
// does NOT change between visits unless the underlying data changes.
const getPortTradeProfile = (portKey) => {
  const port  = window.D.PORTS[portKey];
  const avail = window.D.GOODS_AVAILABILITY[portKey];
  if (!port || !avail) return { goodDeals: [], inDemand: [] };

  // Must match the column order in GOODS_AVAILABILITY rows (same as generators.js)
  const colOrder = [
    "food","water","rum","sugar","timber","cloth","spices","silk",
    "coffee","cocoa","weapons","tobacco","silver","slaves"
  ];

  const factionMods = window.D.FACTION_PRICE_MODIFIERS[port.faction] ?? {};
  const illegalGoods = new Set(
    Object.entries(window.D.RESOURCES)
      .filter(([, r]) => r.illegal)
      .map(([k]) => k)
  );
  const provisionGoods = new Set(["food", "water"]);

  const goodDeals = [];
  const inDemand  = [];

  colOrder.forEach((good, idx) => {
    const tier = avail[idx] || "never";

    // Good Deal: always available at this port OR port faction has a production modifier.
    if (tier === "always" || (good in factionMods)) {
      goodDeals.push(good);
    }

    // In Demand: rarely or never stocked → high structural price → good to sell here.
    // Exclude provisions and illegal goods.
    if (
      (tier === "rarely" || tier === "never") &&
      !provisionGoods.has(good) &&
      !illegalGoods.has(good)
    ) {
      // Sort "never" before "rarely" (higher price = more valuable sell opportunity)
      inDemand.push({ good, tier });
    }
  });

  // Sort In Demand: "never" tier first (1.40× multiplier > 1.20× for "rarely")
  inDemand.sort((a, b) => {
    if (a.tier === "never" && b.tier === "rarely") return -1;
    if (a.tier === "rarely" && b.tier === "never") return 1;
    return 0;
  });

  return {
    goodDeals,
    inDemand: inDemand.map(x => x.good),
  };
};

  // PORT LOGIC
  const processDesertion = (crewRoster, crewMorale, currentPort, state) => {
    const destFaction = PORTS[currentPort]?.faction;
    const deserters = [];
    const settlers = [];
    const newRoster = [];
    for (const member of crewRoster) {
      if (L.hasTag(member, "loyal")) { newRoster.push(member); continue; }
      if (L.hasTag(member, "protected")) { newRoster.push(member); continue; }
      if (L.hasTag(member, "upset")) {
        let desertChance = 0.15;
        if (L.hasTag(member, "mutineer")) desertChance *= 2;
        if (L.hasTag(member, "seasoned") || L.hasTag(member, "veteran")) desertChance *= 0.5;
        if (destFaction && member.faction === destFaction) desertChance += 0.20;
        if (Math.random() < desertChance) {
          deserters.push(`${member.firstName} ${member.lastName}`);
        } else {
          settlers.push(`${member.firstName} ${member.lastName}`);
          newRoster.push(L.removeTag(member, "upset"));
        }
      } else {
        newRoster.push(member);
      }
    }
    const logLines = [];
    const byFaction = {};
    for (const name of deserters) {
      const member = crewRoster.find(m => `${m.firstName} ${m.lastName}` === name);
      const fac = member?.faction || "unknown";
      if (!byFaction[fac]) byFaction[fac] = [];
      byFaction[fac].push(name);
    }
    for (const [faction, names] of Object.entries(byFaction)) {
      const isFactionGrievance = faction !== "pirate" && destFaction && faction !== destFaction;
      const reason = isFactionGrievance ? ` They could not forgive the attack on ${FACTIONS[faction]?.label || faction} ships.` : "";
      let msg;
      if (names.length === 1) msg = `${names[0]} has deserted.${reason}`;
      else if (names.length <= 3) msg = `${names.join(", ")} have deserted.${reason}`;
      else {
        const shown = names.slice(0, 3).join(", ");
        msg = `${shown} and ${names.length - 3} others have deserted.${reason}`;
      }
      logLines.push(window.E.logEntry(state, msg));
    }
    if (settlers.length > 0) {
      const settledTemplates = [
        " The rest of the upset crew seem to have settled down.",
        " The mood aboard has improved. Tensions are easing.",
        " Your upset crew appear to have calmed down. For now.",
      ];
      const settledMsg = settledTemplates[Math.floor(Math.random() * settledTemplates.length)];
      logLines.push(window.E.logEntry(state, settledMsg));
    }
    return { roster: newRoster, logLines };
  };

  const processPositiveTraits = (crewRoster, state) => {
    const newSeasoned = [];
    const newVeterans = [];
    const newLoyal = [];
    const newRoster = crewRoster.map(member => {
      const days = member.daysAboard || 0;
      const tags = member.tags || [];
      let updated = member;
      if (tags.includes("loyal")) return updated;
      if (days >= 200 && !tags.includes("upset")) {
        const memberFaction = member.faction;
        const factionPorts = Object.keys(PORTS).filter(k => PORTS[k].faction === memberFaction);
        const maxRep = Math.max(...factionPorts.map(k => state.reputation[k] || 0));
        if (maxRep >= 80) {
          updated = L.removeTag(L.removeTag(member, "veteran"), "seasoned");
          updated = L.addTag(updated, "loyal");
          newLoyal.push(`${updated.firstName} ${updated.lastName}`);
          return updated;
        }
      }
      if (days >= 100 && !tags.includes("veteran") && !tags.includes("loyal")) {
        updated = L.removeTag(member, "seasoned");
        updated = L.addTag(updated, "veteran");
        newVeterans.push(`${updated.firstName} ${updated.lastName}`);
        return updated;
      }
      if (days >= 50 && !tags.includes("seasoned") && !tags.includes("veteran") && !tags.includes("loyal")) {
        updated = L.addTag(member, "seasoned");
        newSeasoned.push(`${updated.firstName} ${updated.lastName}`);
        return updated;
      }
      return updated;
    });
    const promoLines = [];
    if (newSeasoned.length === 1) promoLines.push(`${newSeasoned[0]} has found their sea legs. A seasoned hand now.`);
    else if (newSeasoned.length > 1) promoLines.push(`${newSeasoned.length} crew members have found their sea legs.`);
    if (newVeterans.length === 1) promoLines.push(`${newVeterans[0]} has served 100 days aboard. A true veteran.`);
    else if (newVeterans.length > 1) promoLines.push(`${newVeterans.length} crew members are now veterans.`);
    if (newLoyal.length === 1) promoLines.push(`${newLoyal[0]} has pledged their loyalty. 'This ship is my home now, Captain.'`);
    else if (newLoyal.length > 1) promoLines.push(`${newLoyal.length} crew members have sworn their loyalty.`);
    const logLines = promoLines.map(l => window.E.logEntry(state, l));
    return { roster: newRoster, logLines };
  };

  // Expose all functions globally
  return {
    // Helpers
    reputationLabel,
    getFameInfo,
    getInfamyLabel,
    getHeatLabel,
    meetsRequirement,
    canBribe,
    getShipStats,
    getEquipmentEffect,
    canInstallEquipment,
    getEffectiveMorale,
    classifyLogLine,
    getLogTabCategory,
    logPick,
    isFeatureUnlocked,
    returnScreen,

    // Ship/Repair
    shipRepairCost,

    // Travel
    travelDays,
    canReach,
    getUnreachableReason,
    getSeaPosition,
    travelDaysFromPosition,
    travelDaysBetween,
    canReachFrom,
    canReachFromPosition,
    getReachablePortsFromSea,
    processStarvation,

    // Reputation
    decayReputation,
    applyReputationImpact,
    getRepPerk,
    addHeat,

    // Crew
    payCrewWages,
    removeRandomCrew,
    hasTag,
    addTag,
    removeTag,
    revealTag,
    getCrewAlignment,
    getAlignmentModifier,
    processDesertion,
    processPositiveTraits,

    // Events
    triggerRandomEvent,
    maybeRandomPatrol,

    // Encounter
    buildEncounterContext,
    roll,
    guessShipType,

    // Combat
    emptyOutcome,
    getNPCAction,
    maybeCrewLoss,
    resolvePlayerAction,
    applyMoraleModifier,
    resolveNpcAction,
    applyDamageMoralePenalty,
    combineCombatOutcomes,
    resolveCombatAction,

    // Resource & trade
    getHoldCapacity,
    getHoldUsed,
    getHoldLoadPct,
    getHoldSpeedMultiplier,
    getProvisionConsumptionPerDay,
    getDaysOfProvisions,
    applyLoseCargoPercent,
    applyLoseContraband,
    getPortTradeProfile,
  };
})();