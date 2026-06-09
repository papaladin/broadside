// ═══════════════════════════════════════════════════════════════════
//  logic.js — ALL PURE FUNCTIONS FOR GAME LOGIC
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
  if (fame >= 350) return { label: "Immortal", tier: 4 };
  if (fame >= 200) return { label: "Legendary", tier: 3 };
  if (fame >= 100) return { label: "Notorious", tier: 2 };
  if (fame >= 50)  return { label: "Recognised", tier: 1 };
  return { label: "Unknown", tier: 0 };
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
    return { allowed: false, reason: `Requires ★ ${item.requiredFame} fame (${getFameInfo(item.requiredFame).label})` };
    return { allowed: true, reason: null };
  };

  const canBribe = (state) => (state.infamy ?? 0) < 50;


  const getEffectiveMorale = (state) => {
    const shipStats = getShipStats(state);
    const moraleBonus = shipStats.moraleBonus || 0;
   return Math.min(100, state.crew.morale + moraleBonus); // Cap at 100%
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
    stats.moraleBonus = 0; // no more figurehead, but keep for compatibility

    return stats;
  };

  const getEquipmentEffect = (state, effectKey) => {
    const eq = state.ship?.equipment || {};
    let total;

    // multiplicative effects default to 1, additive to 0
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
        total = total || value; // any true makes it true
      } else if (effectKey === "combatHeatMult" || effectKey === "crewLossMult") {
        total *= value; // multiplicative
      } else {
        total += value; // additive
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



  const returnScreen = (state) =>
    state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port";


// --------------------------------------------
// LOGS FUNCTIONS
// --------------------------------------------


const classifyLogLine = (text) => {
  if (!text) return { icon: null };
  const t = text;

  if (t.includes("Arrived at"))      return { icon: "⚓" };
  if (t.includes("Setting sail"))    return { icon: "⛵" };
  if (t.includes("left the crew") || t.includes("has left")|| t.includes("Hired")) return { icon: "👥" };
  if (t.includes("upset") || t.includes("disturbed"))       return { icon: "⚠" };
  if (t.includes("settled down"))   return { icon: "👥" };
  if (t.includes("mutineer") || t.includes("Mutiny"))       return { icon: "⚔" };
  if (t.includes("Victory") || t.includes("Defeated"))      return { icon: "⚔" };
  if (t.includes("Escaped") || t.includes("fled"))          return { icon: "💨" };
  if (t.includes("Bought") || t.includes("Sold") || t.includes("trade")) return { icon: "💰" };
  if (t.includes("Completed:") || t.includes("mission"))    return { icon: "📜" };
  if (t.includes("New port discovered") || t.includes("chart")) return { icon: "🗺" };
  if (t.includes("infamy") || t.includes("wanted") || t.includes("Wanted")) return { icon: "☠" };
  if (t.includes("heat") || t.includes("alert") || t.includes("patrol")) return { icon: "🚨" };
  if (t.includes("Plundered") || t.includes("plunder"))    return { icon: "🏴‍☠️" };
  if (t.includes("survivor") || t.includes("rescue"))      return { icon: "🆘" };
  if (t.includes("stores are empty") || t.includes("barrels are dry")) return { icon: "⚠" };
  if (t.includes("morale") || t.includes("drinks"))        return { icon: "🍻" };

  return { icon: null };
};

const getLogTabCategory = (text) => {
  const t = text || '';
  // Crew (including traits)
  if (/disturbed|left the crew|settled|seasoned|veteran|loyal|Hired|drinks|mutineer|upset|shaking|terrified|demands|brawl|rum|Bosun/i.test(t))
    return "crew";
  // Combat & Encounters
  if (/Victory|Defeated|sinks|strikes|fled|escaped|Plundered|patrol|inspection|Bribed|Parley|surrendered|contraband/i.test(t))
    return "combat";
  // Ports (navigation, discovery, provisions)
  if (/Arrived|Dropped anchor|Made port|Setting sail|New port discovered|food stores|water barrels/i.test(t))
    return "ports";
  // Missions
  if (/Accepted mission|Completed:|Abandoned|Cannot complete|infamy/i.test(t))
    return "missions";
  // Trade & Repairs
  if (/Bought|Sold|Net:|Repaired|Purchased|Installed/i.test(t))
    return "trade";
  return "other"; // fallback – will show under "All"
};


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SHIP & REPAIR FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const shipRepairCost = (state) => {
    const ship = getShipStats(state);
    const hullMissing = ship.maxHull - state.ship.hull;
    return hullMissing * 2; // 2 gold per hull point
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

  const ship = getShipStats(state);
  let days = Math.ceil(distance / (ship.speed * 4));

  // Morale modifier
  if (state.crew.morale < 50) days += 1;
  if (state.crew.morale < 30) days += 1;

  // Wind modifier
  const angleToPort = Math.atan2(dy, dx) * 180 / Math.PI;
  const windAngleDiff = Math.abs(angleToPort - state.wind.angle) % 360;
  if (windAngleDiff < 45 || windAngleDiff > 315) days -= 1;      // Favourable wind
  else if (windAngleDiff > 135 && windAngleDiff < 225) days += 1; // Opposing wind

  let baseDays = Math.max(1, days);

  // Navigation Tools: reduce long voyages by 1 day (equipment effect)
  if (baseDays > 4) {
    const reduction = getEquipmentEffect(state, "longVoyageDayReduction") || 0;
    baseDays = Math.max(1, baseDays - reduction);
  }

  const loadPct = getHoldLoadPct(state.hold?.items, getHoldCapacity(state));
  const mult = getHoldSpeedMultiplier(loadPct);
  return Math.max(1, Math.round(baseDays * mult));
};

// ── Public: port‑to‑port travel (legacy interface) ─────────────────────────
const travelDays = (fromPort, toPort, state) => {
  const from = D.PORTS[fromPort];
  const to = D.PORTS[toPort];
  if (!from || !to) return Infinity;
  return travelDaysBetween(from, to, state);
};

// ── Public: arbitrary sea‑position to port ─────────────────────────────────
const travelDaysFromPosition = (originPos, portKey, state) => {
  const port = D.PORTS[portKey];
  if (!port) return Infinity;
  return travelDaysBetween(originPos, port, state);
};

// ── General reachability check (used by both land and sea versions) ───────
const canReachFrom = (origin, portKey, state, maxDays) => {
  const port = D.PORTS[portKey];
  if (!port) return false;
  // Hidden port guard
  if (port.hidden && !state.discoveredPorts?.includes(portKey)) return false;
  // Hull size guard
  if (port.minHull) {
    const baseHull = D.SHIPS[state.ship?.type]?.maxHull ?? 0;
    if (baseHull < port.minHull) return false;
  }

  let days;
  if (typeof origin === "string") {
    days = travelDays(origin, portKey, state);
  } else {
    days = travelDaysFromPosition(origin, portKey, state);
  }
  return days <= maxDays;
};

// ── Public: legacy canReach (from current port, using ship's maxDays) ─────
const canReach = (state, portKey) => {
  if (portKey === state.currentPort) return false;
  const shipMaxDays = D.SHIPS[state.ship?.type]?.maxDays ?? 10;
  return canReachFrom(state.currentPort, portKey, state, shipMaxDays);
};

// ── Public: reachability from sea position ─────────────────────────────────
const canReachFromPosition = (originPos, portKey, state, remainingEndurance) => {
  return canReachFrom(originPos, portKey, state, remainingEndurance);
};

// ── Legacy helper: returns reachable ports from sea (for UI button disable) ─
const getReachablePortsFromSea = (state) => {
  const route = state.route;
  if (!route) return [];
  const seaPos = getSeaPosition(route);
  const remaining = (route.enduranceBudget || 0) - (route.enduranceSpent || 0);
  return Object.keys(D.PORTS).filter(portKey => {
    if (portKey === route.destinationPort) return false;
    if (D.PORTS[portKey]?.hidden && !state.discoveredPorts?.includes(portKey)) return false;
    return canReachFromPosition(seaPos, portKey, state, remaining);
  });
};

const getUnreachableReason = (state, portKey) => {
  if (portKey === state.currentPort) return null;
  const port = PORTS[portKey];
  if (!port) return "Unknown port";

  // --- Layer 3: reveal nothing for undiscovered ports ---
 if (port.hidden && !state.discoveredPorts?.includes(portKey)) return null;

  // --- Layer 2: ship size ---
  if (port.minHull) {
    const baseHull = SHIPS[state.ship?.type]?.maxHull ?? 0;
    if (baseHull < port.minHull) {
      return `Requires a heavier vessel (your ship: ${baseHull} hull, required: ${port.minHull}+)`;
    }
  }

  // --- Layer 1: range ---
  const days = travelDays(state.currentPort, portKey, state);
  const shipMaxDays = SHIPS[state.ship?.type]?.maxDays ?? 10;
  if (days > shipMaxDays) {
    return `${days}-day voyage exceeds your ship's range (${shipMaxDays} days)`;
  }

  return null;
};


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  REPUTATION FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const decayReputation = (state) => {
    const newRep = { ...state.reputation };
    Object.keys(newRep).forEach(port => {
      if (newRep[port] > 50) {
        newRep[port] = Math.max(50, newRep[port] - 1);
      }
    });
    return newRep;
  };

  // Apply reputation impact from an object (e.g., { english: +10, spanish: -5 })
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
    if (rep >= 80) return { tier: "allied",   repairMult: 0.80, missionMult: 1.20, servicesBlocked: false };
    if (rep >= 50) return { tier: "friendly", repairMult: 0.90, missionMult: 1.10, servicesBlocked: false };
    if (rep >= 30) return { tier: "neutral",  repairMult: 1.00, missionMult: 0.90, servicesBlocked: false };
    if (rep >= 10) return { tier: "hostile",  repairMult: 1.00, missionMult: 0.75, servicesBlocked: false };
    return               { tier: "at_war",   repairMult: 1.00, missionMult: 0,    servicesBlocked: true  };
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  CREW FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const payCrewWages = (state) => {
    const effectiveMorale = getEffectiveMorale(state);
    const wageMultiplier = effectiveMorale < 30 ? 1.5 : 1;
    const wages = Math.floor(state.crew.roster.length * 2 * wageMultiplier);
    return wages;
  };

    // Remove random members and return the removed list
  const removeRandomCrew = (roster, count) => {
    if (count <= 0) return { newRoster: [...roster], removed: [] };
    const shuffled = [...roster].sort(() => Math.random() - 0.5);
    const removed = shuffled.slice(0, count);
    const removedIds = new Set(removed.map(m => m.id));
    const newRoster = roster.filter(m => !removedIds.has(m.id));
    return { newRoster, removed };
  };

  
    // ── Crew tags (for T2.2+ traits system) ────────────────────────
  const hasTag = (member, tag) => (member.tags || []).includes(tag);
  
  const addTag = (member, tag) => ({
    ...member,
    tags: [...(member.tags || []), tag]
  });
  const removeTag = (member, tag) => ({
    ...member,
    tags: (member.tags || []).filter(t => t !== tag)
  });

const revealTag = (member, traitName) => {
  const hidden = "hidden_" + traitName;
  const revealed = "revealed_" + traitName;
  if (member.tags?.includes(hidden)) {
    return {
      ...member,
      tags: [...(member.tags || []).filter(t => t !== hidden), revealed],
    };
  }
  return member;
};

  // ── Crew faction alignment ─────────────────────────────────────
  const getCrewAlignment = (state, faction) => {
    const roster = state.crew?.roster || [];
    if (roster.length === 0) return 0;
    const matching = roster.filter(m => m.faction === faction).length;
    return matching / roster.length; // 0.0 to 1.0
  };

  const getAlignmentModifier = (state, faction) => {
    return 0.5 + getCrewAlignment(state, faction);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EVENT FUNCTIONS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const triggerRandomEvent = (state) => {
    // Filter events based on conditions
    const availableEvents = RANDOM_EVENTS.filter(event => {
      if (!event.condition) return true;
      return event.condition(state);
    });

    if (availableEvents.length === 0) return null;

    // Randomly select an event
    const event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    // If desc is an array, pick a random variant
    if (Array.isArray(event.desc)) {
      event.desc = event.desc[Math.floor(Math.random() * event.desc.length)];
    }
    return { ...event };
  };

 const maybeRandomPatrol = (state) => {
  const port = D.PORTS[state.currentPort];
  if (!port || port.faction === "pirate") return false;
  
  const baseChance = 0.01;
  const infamyBonus = (state.infamy ?? 0) / 400;
  
  // Heat bonus — based on origin and destination faction
  const alerts = state.factionAlerts || {};
  const originFaction = port.faction;
  const destFaction = state.destination ? D.PORTS[state.destination]?.faction : null;
  const relevantHeat = Math.max(
    alerts[originFaction] || 0,
    destFaction ? (alerts[destFaction] || 0) : 0
  );
  
  // Reputation dampening (average of origin and destination rep)
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



  // ── Combat resolution helpers (pure) ─────────────────────────

  const emptyOutcome = () => ({
    player: { hullDamage: 0, crewLoss: 0 },
    enemy:  { hullDamage: 0, crewLoss: 0 },
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

  // 50% chance to avoid crew loss
  const maybeCrewLoss = (amount) => Math.random() < 0.5 ? 0 : Math.floor(amount);

  const resolvePlayerAction = (state, action) => {
    const shipStats = getShipStats(state);
    const out = emptyOutcome();

    switch (action) {
      case "broadside": {
        const dmg = shipStats.cannons * (0.8 + Math.random() * 0.4);
        const hullMod = 1 + (getEquipmentEffect(state, "hullDmgPct") || 0);
        const crewMod = 1 + (getEquipmentEffect(state, "crewDmgPct") || 0);
        out.player.hullDamage = Math.floor(dmg * 0.6 * hullMod);
        out.player.crewLoss   = maybeCrewLoss(dmg * 0.4 / 3 * crewMod);
        break;
      }
      case "precision": {
        const precisionBaseChance = 0.7 + (getEquipmentEffect(state, "precisionHitPct") || 0);
        if (Math.random() < precisionBaseChance) {
          const dmg = shipStats.cannons * (1.2 + Math.random() * 0.6);
          const hullMod = 1 + (getEquipmentEffect(state, "hullDmgPct") || 0);
          const crewMod = 1 + (getEquipmentEffect(state, "crewDmgPct") || 0);
          out.player.hullDamage = Math.floor(dmg * 0.9 * hullMod);
          out.player.crewLoss   = maybeCrewLoss(dmg * 0.1 / 3 * crewMod);
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
        const crewDiff = playerCrew - enemyCrew;
        successChance += Math.min(0.3, Math.max(0, crewDiff / enemyCrew * 0.3));
        successChance += Math.min(0.2, Math.max(0, (playerMoralePct - 0.5) * 0.4));
        successChance += Math.min(0.2, Math.max(0, (playerHullPct - 0.5) * 0.4));
        successChance = Math.min(0.95, successChance);

        if (Math.random() < successChance) {
          out.instantVictory = true;
          const risk = state.activeMission?.risk || "medium";
          const plunder = G.generateEnemyCargo(state, state.battleState.enemy, risk);
          out.goldReward = plunder.gold;
          out.enemyCargo = plunder.cargo;
        } else {
          const crewLossPct = 0.3 + Math.random() * 0.2;
          out.enemy.crewLoss = Math.floor(playerCrew * crewLossPct);
        }
        break;
      }
      case "evade": {  
        const shipStats = getShipStats(state);
        const enemyShipType = guessShipType(state.battleState.enemy);
        const enemySpeed = SHIPS[enemyShipType]?.speed ?? 10;
        // Speed advantage gives bonus: +10% per speed point difference, clamped
        const speedBonus = Math.min(0.3, Math.max(-0.3, (shipStats.speed - enemySpeed) * 0.02));
        const fleeChance = Math.min(0.95, Math.max(0.20, 0.6 + speedBonus)); 
        if (Math.random() < fleeChance) {

          out.fled = true;
        } else {
          const enemyDmg = state.battleState.enemy.cannons * (0.8 + Math.random() * 0.4);
          out.player.hullDamage = Math.floor(enemyDmg * 0.3);
          out.player.crewLoss   = maybeCrewLoss(enemyDmg * 0.2 / 3);
        }
        break;
      }
    }
    return out;
  };

  const applyMoraleModifier = (state, action, playerOutcome) => {
    let delta = 0;
    if (playerOutcome.instantVictory) {
      delta = 5;
    } else if (playerOutcome.fled) {
      delta = -5;
    } else {
      const newEnemyHull = Math.max(0, state.battleState.enemyHull - playerOutcome.player.hullDamage);
      if (newEnemyHull <= 0) {
        delta = 5;
      } else if (action === "grapple") {
        delta = -10;
      }
    }
    return { moraleDelta: delta };
  };

  const resolveNpcAction = (state) => {
    const enemy = state.battleState.enemy;
    const npcAction = getNPCAction(enemy);
    const npcDmg = enemy.cannons * (0.7 + Math.random() * 0.3);
    const result = { enemy: { hullDamage: 0, crewLoss: 0 }, player: { hullDamage: 0, crewLoss: 0 } };

    switch (npcAction) {
      case "broadside": {
        result.enemy.hullDamage = Math.floor(npcDmg * 0.6);
        result.enemy.crewLoss   = maybeCrewLoss(npcDmg * 0.4 / 3);
        break;
      }
      case "precision": {
        if (Math.random() < 0.7) {
          result.enemy.hullDamage = Math.floor(npcDmg * 0.9);
          result.enemy.crewLoss   = maybeCrewLoss(npcDmg * 0.1 / 3);
        }
        break;
      }
      case "grapple": {
        const enemyCrew = enemy.crew;
        const playerCrew = state.crew.roster.length;
        const enemyHullPct = state.battleState.enemyHull / enemy.hull;

        let npcSuccessChance = 0.5;
        const npcCrewDiff = enemyCrew - playerCrew;
        npcSuccessChance += Math.min(0.3, Math.max(0, npcCrewDiff / playerCrew * 0.3));
        npcSuccessChance += Math.min(0.2, Math.max(0, (enemyHullPct - 0.5) * 0.4));
        npcSuccessChance += Math.min(0.2, 0.7 - 0.5 * 0.4);
        npcSuccessChance = Math.min(0.95, npcSuccessChance);

        if (Math.random() < npcSuccessChance) {
          const npcCrewLossPct = 0.3 + Math.random() * 0.2;
          result.enemy.crewLoss += Math.floor(playerCrew * npcCrewLossPct);
        } else {
          result.player.crewLoss += Math.floor(enemyCrew * 0.05);
        }
        break;
      }
      case "evade": {
        if (Math.random() >= 0.9) {
          result.enemy.hullDamage += result.player?.hullDamage || 0;
          result.enemy.crewLoss   += result.player?.crewLoss   || 0;
        }
        break;
      }
    }
    return result;
  };

  const applyDamageMoralePenalty = (state, outcome) => {
    const effectiveMorale = getEffectiveMorale(state);
    const modifier = effectiveMorale < 30 ? 1.2 : (effectiveMorale > 70 ? 0.9 : 1);
    outcome.player.hullDamage = Math.floor(outcome.player.hullDamage * modifier);
    outcome.player.crewLoss   = Math.floor(outcome.player.crewLoss   * modifier);
    return outcome;
  };

  const combineCombatOutcomes = (playerOut, morale, npcOut) => {
    const final = emptyOutcome();
    // Player action results
    final.player.hullDamage = playerOut.player.hullDamage;
    final.player.crewLoss   = playerOut.player.crewLoss;
    final.enemy.hullDamage  = playerOut.enemy.hullDamage;
    final.enemy.crewLoss    = playerOut.enemy.crewLoss;
    final.fled              = playerOut.fled;
    final.instantVictory    = playerOut.instantVictory;
    final.goldReward        = playerOut.goldReward;
    final.enemyCargo        = playerOut.enemyCargo || {};
    // Morale
    final.moraleDelta       = morale.moraleDelta;
    // NPC action results (added on top)
    if (npcOut) {
      final.enemy.hullDamage  += npcOut.enemy.hullDamage;
      final.enemy.crewLoss    += npcOut.enemy.crewLoss;
      final.player.hullDamage += npcOut.player.hullDamage;
      final.player.crewLoss   += npcOut.player.crewLoss;
    }
    return final;
  };

  const resolveCombatAction = (state, action) => {
  if (!state.battleState) return emptyOutcome();

  // 1. Resolve player action
  const playerOutcome = resolvePlayerAction(state, action);

  // 2. Calculate morale delta
  const moraleOutcome = applyMoraleModifier(state, action, playerOutcome);

  // 3. Resolve NPC action if combat continues
  let npcOutcome = null;
  if (!playerOutcome.fled && !playerOutcome.instantVictory) {
    npcOutcome = resolveNpcAction(state);
  }

  // 4. Combine all parts
  const combined = combineCombatOutcomes(playerOutcome, moraleOutcome, npcOutcome);

  // 4b. Apply Surgeon's Bay crew loss reduction
  const crewLossMult = getEquipmentEffect(state, "crewLossMult");
  if (crewLossMult !== 1) {
    combined.player.crewLoss = Math.floor(combined.player.crewLoss * crewLossMult);
  }

  // 5. Apply morale modifier to player damage
  return applyDamageMoralePenalty(state, combined);
};


//--------------------------------------
// ---  encounter context & pre-screen ---
//--------------------------------------



  // Simple dice roller (1 .. sides)
  const roll = (sides) => Math.ceil(Math.random() * sides);

  // Derive a ship type from enemy stats (for speed display / flee checks)
const guessShipType = (enemy) => {
  if (!enemy) return "sloop";
  const cannons = enemy.cannons || 0;
  if (cannons >= 50) return "ship_of_the_line";   // speed  5
  if (cannons >= 30) return "galleon";            // speed  7
  if (cannons >= 24) return "frigate";            // speed 12
  if (cannons >= 18) return "corvette";           // speed 15
  if (cannons >= 14) return "brigantine";         // speed 14
  if (cannons >= 10) return "sloop";              // speed 18
  if (cannons >=  6) return "schooner";           // speed 19
  return "cutter";                                // speed 20
};

function buildEncounterContext(state, type, enemy) {
  const { ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE, SHIPS } = window.D;

  const shipStats = getShipStats(state);
  const mySpeed   = shipStats.speed;
  const enemyShip = guessShipType(enemy);
  const eSpeed    = SHIPS[enemyShip]?.speed ?? 5;
  const rep       = state.reputation[state.destination ?? state.currentPort] ?? 20;
  const gold      = state.gold;
  const bribeCost = Math.round((enemy.gold ?? 500) * 0.4);

  // ── Flee ────────────────────────────────────────────────────
  const noFleeTypes = ["hostile_port_entry", "bounty_target", "mission_combat",
                       "navy_patrol", "navy_patrol_combat","distressed_merchant_help",
                        "distressed_merchant_plunder","escort_defend"];
  const canFlee    = !noFleeTypes.includes(type);
  const fleeReason = canFlee ? null
    : type === "hostile_port_entry" ? "Already in range of the harbour guns"
    : type === "navy_patrol" || type === "navy_patrol_combat"
      ? "You cannot outrun a patrol in open waters"
    : "The target is cornered — no escape";

  // ── Parley ──────────────────────────────────────────────────
  const noParleyTypes = ["hostile_port_entry", "bounty_target", "mission_combat",
                         "smuggling_caught", "navy_patrol", "navy_patrol_combat",
                         "distressed_merchant_help", "distressed_merchant_plunder","escort_defend"];
  const canParley    = !noParleyTypes.includes(type) && rep >= 30;
  const parleyReason = noParleyTypes.includes(type)
    ? "They are not here to negotiate"
    : rep < 30 ? `Reputation too low (${rep} — need 30)` : null;

  // ── Bribe ───────────────────────────────────────────────────
  const noBribeTypes = ["hostile_port_entry", "bounty_target", "mission_combat",
                        "navy_patrol", "navy_patrol_combat","distressed_merchant_help",
                         "distressed_merchant_plunder","escort_defend"];
  const bribeBlocked       = noBribeTypes.includes(type);
  const canAffordBribe     = gold >= bribeCost;
  const bribeInfamyBlocked = !canBribe(state);
  const canBribeResult     = !bribeBlocked && canAffordBribe && !bribeInfamyBlocked;
  const bribeReason        = bribeBlocked           ? "They cannot be bought"
    : bribeInfamyBlocked                            ? "Your reputation for bribery has preceded you"
    : !canAffordBribe                               ? `Need ${bribeCost}g (you have ${gold}g)`
    : null;

  // ── Surrender ───────────────────────────────────────────────
  const noSurrenderTypes = ["bounty_target", "mission_combat","distressed_merchant_help",
                           "distressed_merchant_plunder","escort_defend"];
  const canSurrender    = !noSurrenderTypes.includes(type);
  const surrenderReason = canSurrender ? null : "Surrender means death here";

  // ── Distressed Merchant encounters: Fight only ─────────────────
  if (type === "distressed_merchant_help" || type === "distressed_merchant_plunder" || type === "escort_defend") {
    return {
      type,
      encounterType: type,
      enemy: { ...enemy, ship: enemyShip },
      flavourText:
        ENCOUNTER_FLAVOUR[type]?.(enemy, rep) ??
        `A ${enemy.name} moves to intercept.`,
      options: [
        {
          id:         "fight",
          label:      "Fight",
          available:  true,
          reason:     null,
          action:     { type: "INTERCEPT_FIGHT" },
          speedCheck: null,
        },
      ],
    };
  }

  // ── Is this a navy patrol encounter? ────────────────────────
  const isNavyPatrol = type === "navy_patrol" || type === "navy_patrol_combat";

  // ── Build options array ─────────────────────────────────────
  const options = [];

  if (isNavyPatrol) {
    // Navy patrol: only Allow Inspection and Refuse (Fight)
    options.push({
      id:         "inspect",
      label:      "Allow Inspection",
      available:  true,
      reason:     null,
      action:     { type: "PATROL_INSPECT" },
      speedCheck: null,
    });
    options.push({
      id:         "fight",
      label:      "Refuse — Open Fire",
      available:  true,
      reason:     null,
      action:     { type: "INTERCEPT_FIGHT" },
      speedCheck: null,
    });
  } else {
    // Standard encounter
    options.push({
      id:         "fight",
      label:      "Fight",
      available:  true,
      reason:     null,
      action:     { type: "INTERCEPT_FIGHT" },
      speedCheck: null,
    });
    options.push({
      id:         "flee",
      label:      "Attempt to Flee",
      available:  canFlee,
      reason:     fleeReason,
      action:     { type: "INTERCEPT_FLEE" },
      speedCheck: canFlee ? { player: mySpeed, enemy: eSpeed } : null,
    });
    options.push({
      id:         "parley",
      label:      "Parley",
      available:  canParley,
      reason:     parleyReason,
      action:     { type: "INTERCEPT_PARLEY" },
      speedCheck: null,
    });
    options.push({
      id:         "bribe",
      label:      canBribeResult ? `Bribe (${bribeCost}g)` : "Bribe",
      available:  canBribeResult,
      reason:     bribeReason,
      action:     { type: "INTERCEPT_BRIBE" },
      speedCheck: null,
    });
    options.push({
      id:         "surrender",
      label:      "Surrender",
      available:  canSurrender,
      reason:     surrenderReason,
      action:     { type: "INTERCEPT_SURRENDER" },
      speedCheck: null,
    });
  }

  return {
    type,
    encounterType: type,
    enemy: { ...enemy, ship: enemyShip },
    flavourText:
      ENCOUNTER_FLAVOUR[type]?.(enemy, rep) ??
      `A ${enemy.name} moves to intercept.`,
    options,
  };
}








//-----------------------------------------------
//----- cargo, economy, trade, and resources functions 
//---------------------------------------------------

const getHoldCapacity = (state) => getShipStats(state).holdCapacity ?? 200;

const getHoldUsed = (holdItems) =>
  Object.values(holdItems || {}).reduce((sum, qty) => sum + qty, 0);

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
  food:  consumptionPerDay.food  > 0 ? Math.floor((holdItems.food  || 0) / consumptionPerDay.food)  : Infinity,
  water: consumptionPerDay.water > 0 ? Math.floor((holdItems.water || 0) / consumptionPerDay.water) : Infinity,
});

const applyLoseCargoPercent = (holdItems, percent) => {
  const factor = 1 - (percent / 100);
  const result = {};
  Object.entries(holdItems || {}).forEach(([good, qty]) => {
    result[good] = Math.floor(qty * factor);
  });
  return result;
};

const applyLoseContraband = (holdItems) => {
  const result = { ...holdItems };
  Object.keys(window.D.RESOURCES).forEach(good => {
    if (window.D.RESOURCES[good].illegal) result[good] = 0;
  });
  return result;
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
    returnScreen,

    // Ship/Repair
    shipRepairCost,

    // Travel
    travelDays,
    canReach,
    getUnreachableReason,
      // New navigation helpers
  getSeaPosition,
  travelDaysFromPosition,
  canReachFromPosition,
  getReachablePortsFromSea,

    // Reputation
    decayReputation,
    //updateReputation,
    applyReputationImpact,
    getRepPerk,

    // Crew
    payCrewWages,
    removeRandomCrew,
    hasTag,
    addTag,
    removeTag,
    //crewWithTag,
    revealTag,
    getCrewAlignment,
    getAlignmentModifier,

    // Events
    triggerRandomEvent,
    maybeRandomPatrol,

    //encounter
    buildEncounterContext,
    roll,

    // Combat
    getNPCAction,
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

  };
})();