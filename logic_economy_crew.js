// logic_economy_crew.js — Crew, economy, reputation, port logic.
// Depends on logic_core.js (must be loaded after).
// Exposed as window.L.

window.L = window.L || {};

(() => {
  const { PORTS, FACTIONS } = window.D;
  // Use L functions from core; they exist at runtime due to load order.

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  REPUTATION
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  CREW
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const payCrewWages = (state) => {
    const effectiveMorale = window.L.getEffectiveMorale(state);
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
    return 0.5 + window.L.getCrewAlignment(state, faction);
  };

  const processDesertion = (crewRoster, crewMorale, currentPort, state) => {
    const destFaction = PORTS[currentPort]?.faction;
    const deserters = [];
    const settlers = [];
    const newRoster = [];
    for (const member of crewRoster) {
      if (window.L.hasTag(member, "loyal")) { newRoster.push(member); continue; }
      if (window.L.hasTag(member, "protected")) { newRoster.push(member); continue; }
      if (window.L.hasTag(member, "upset")) {
        let desertChance = 0.15;
        if (window.L.hasTag(member, "mutineer")) desertChance *= 2;
        if (window.L.hasTag(member, "seasoned") || window.L.hasTag(member, "veteran")) desertChance *= 0.5;
        if (destFaction && member.faction === destFaction) desertChance += 0.20;
        if (Math.random() < desertChance) {
          deserters.push(`${member.firstName} ${member.lastName}`);
        } else {
          settlers.push(`${member.firstName} ${member.lastName}`);
          newRoster.push(window.L.removeTag(member, "upset"));
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
          updated = window.L.removeTag(window.L.removeTag(member, "veteran"), "seasoned");
          updated = window.L.addTag(updated, "loyal");
          newLoyal.push(`${updated.firstName} ${updated.lastName}`);
          return updated;
        }
      }
      if (days >= 100 && !tags.includes("veteran") && !tags.includes("loyal")) {
        updated = window.L.removeTag(member, "seasoned");
        updated = window.L.addTag(updated, "veteran");
        newVeterans.push(`${updated.firstName} ${updated.lastName}`);
        return updated;
      }
      if (days >= 50 && !tags.includes("seasoned") && !tags.includes("veteran") && !tags.includes("loyal")) {
        updated = window.L.addTag(member, "seasoned");
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ECONOMY / CARGO / HOLD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const getHoldCapacity = (state) => window.L.getShipStats(state).holdCapacity ?? 200;
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

  const getPortTradeProfile = (portKey) => {
    const port  = window.D.PORTS[portKey];
    const avail = window.D.GOODS_AVAILABILITY[portKey];
    if (!port || !avail) return { goodDeals: [], inDemand: [] };

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

      if (tier === "always" || (good in factionMods)) {
        goodDeals.push(good);
      }

      if (
        (tier === "rarely" || tier === "never") &&
        !provisionGoods.has(good) &&
        !illegalGoods.has(good)
      ) {
        inDemand.push({ good, tier });
      }
    });

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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EXPOSE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Object.assign(window.L, {
    // Reputation
    decayReputation,
    applyReputationImpact,
    getRepPerk,

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

    // Economy
    getHoldCapacity,
    getHoldUsed,
    getHoldLoadPct,
    getHoldSpeedMultiplier,
    getProvisionConsumptionPerDay,
    getDaysOfProvisions,
    applyLoseCargoPercent,
    applyLoseContraband,
    getPortTradeProfile,
  });
})();