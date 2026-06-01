// engine_voyage.js – Voyage Domain (Sailing, Wind, Provisions, Hidden Ports)
// Registers its reducer into window.E._reducers.

(() => {
  const { A, autoSave } = window.E;
  const { PORTS, FACTIONS } = window.D;
  const D = window.D;
  const L = window.L;
  const G = window.G;

  // ── ADVANCE_DAY helpers ──────────────────────────────────────
  const advanceWind = (wind) => {
    const rawAngle = (wind.angle + (Math.random() - 0.5) * 30 + 360) % 360;
    return {
      angle: Math.round(rawAngle) % 360,
      speed: Math.round(Math.max(1, Math.min(20, wind.speed + (Math.random() - 0.5) * 5)))
    };
  };

  const advanceCrew = (crew) => ({
    ...crew,
    roster: crew.roster.map(m => ({ ...m, daysAboard: m.daysAboard + 1 })),
    morale: crew.morale < 30 ? Math.max(0, crew.morale - 1) : crew.morale,
  });

  const advanceProvisions = (state) => {
    const consumption = L.getProvisionConsumptionPerDay(state);
    const items = state.hold?.items || {};
    const newFood = Math.max(0, (items.food || 0) - consumption.food);
    const newWater = Math.max(0, (items.water || 0) - consumption.water);
    return {
      items: { ...items, food: newFood, water: newWater },
      foodJustRanOut: newFood === 0 && (items.food || 0) > 0,
      waterJustRanOut: newWater === 0 && (items.water || 0) > 0,
      foodEmpty: newFood === 0,
      waterEmpty: newWater === 0,
    };
  };

  const maybeSmugglePatrol = (state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems) => {
    if (!state.activeMission || state.activeMission.type !== "smuggle" || state.activeMission.encounterOccurred) return null;
    const interceptChance = state.activeMission.interceptChance || 0.70;
    if (Math.random() >= interceptChance) return null;
    const destPort = D.PORTS[state.destination];
    const faction = destPort?.faction || "english";
    const enemy = G.generateEnemy("medium", state.fame, faction);
    enemy.name = `${FACTIONS[faction]?.label || "Colonial"} Revenue Cutter`;
    const context = L.buildEncounterContext(state, "navy_patrol", enemy);
    return {
      ...state,
      wind: newWind,
      day: state.day + 1,
      sailingDaysLeft: newDays,
      gold: newGold,
      reputation: newRep,
      crew: { ...state.crew, roster: updatedRoster, morale: newMorale },
      hold: { ...state.hold, items: newHoldItems },
      activeMission: { ...state.activeMission, encounterOccurred: true },
      encounterContext: context,
      screen: "intercept",
      log: [...state.log, "A patrol vessel approaches, flying inspection colours."]
    };
  };

  const maybeMissionEncounter = (state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems) => {
    if (!state.activeMission || state.activeMission.encounterOccurred) return null;
    if (state.destination !== state.activeMission.targetPort) return null;
    if (newDays < 1) return null;

    const mission = state.activeMission;
    const progress = 1 - (newDays / state.sailingDaysTotal);

    if (mission.type === "escort") {
      const chance = 0.20 + 0.60 * progress;
      if (newDays <= 1 || Math.random() < chance) {
        const enemy = mission.enemy || G.generateEnemy("medium", state.fame, mission.faction);
        const ctx = L.buildEncounterContext(state, "escort_defend", enemy);
        const newActiveMission = { ...mission, encounterOccurred: true };
        return {
          ...state,
          activeMission: newActiveMission,
          encounterContext: ctx,
          screen: "intercept",
          log: [...state.log, "The convoy is under attack!"]
        };
      }
    } else if (mission.type === "patrol") {
      if (progress > 0.60) {
        const chance = 0.20 + 0.60 * (progress - 0.60) / 0.40;
        if (Math.random() < chance) {
          const enemy = mission.enemy || G.generateEnemy("medium", state.fame, mission.faction);
          const ctx = L.buildEncounterContext(state, "mission_combat", enemy);
          const newActiveMission = { ...mission, encounterOccurred: true };
          return {
            ...state,
            activeMission: newActiveMission,
            encounterContext: ctx,
            screen: "intercept",
            log: [...state.log, "You spot a hostile vessel in the patrol zone!"]
          };
        }
      }
    }

    return null;
  };

  const maybeRandomEvent = (state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems) => {
    if (newDays < 1 || Math.random() >= 0.05) return null;
    const event = L.triggerRandomEvent(state);
    if (!event) return null;
    return {
      ...state,
      wind: newWind,
      screen: "event",
      day: state.day + 1,
      sailingDaysLeft: newDays,
      gold: newGold,
      reputation: newRep,
      crew: { ...state.crew, roster: updatedRoster, morale: newMorale },
      hold: { ...state.hold, items: newHoldItems },
      activeEvent: event,
      log: [...state.log, `Day ${state.day + 1}: ${event.title}`]
    };
  };

  const checkRandomPatrol = (state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems) => {
    if (newDays < 1 || state.activeEvent || state.encounterContext) return null;
    if (!L.maybeRandomPatrol(state)) return null;
    const port = D.PORTS[state.currentPort];
    const enemy = G.generateEnemy("low", state.fame, port.faction);
    const context = L.buildEncounterContext(state, "navy_patrol", enemy);
    return {
      ...state,
      wind: newWind,
      day: state.day + 1,
      sailingDaysLeft: newDays,
      gold: newGold,
      reputation: newRep,
      crew: { ...state.crew, roster: updatedRoster, morale: newMorale },
      hold: { ...state.hold, items: newHoldItems },
      encounterContext: context,
      screen: "intercept",
      log: ["A navy patrol hails you and demands to inspect your cargo.", ...state.log]
    };
  };

  const advanceHiddenPorts = (state) => {
    let autoDiscovered = [...(state.discoveredPorts || [])];
    let autoDiscoveryLog = [];
    Object.entries(PORTS).forEach(([key, port]) => {
      if (!port.hidden) return;
      if (autoDiscovered.includes(key)) return;
      if (port.unlockCondition?.type === "item") return;
      const conditions = port.unlockCondition?.conditions || [];
      const operator = port.unlockCondition?.type || "any";
      const results = conditions.map(c => {
        if (c.type === "fame") return state.fame >= c.value;
        if (c.type === "infamy") return (state.infamy ?? 0) >= c.value;
        if (c.type === "reputation") {
          const factionPorts = Object.keys(PORTS).filter(k => PORTS[k].faction === c.faction);
          if (factionPorts.length === 0) return false;
          const avgRep = factionPorts.reduce((sum, k) => sum + (state.reputation[k] ?? 50), 0) / factionPorts.length;
          return avgRep >= c.value;
        }
        return false;
      });
      const unlocked = operator === "all" ? results.every(Boolean) : results.some(Boolean);
      if (unlocked) {
        autoDiscovered.push(key);
        autoDiscoveryLog.push(`⚓ New port discovered: ${port.name}. Mark it on your charts.`);
      }
    });
    return { discoveredPorts: autoDiscovered, log: autoDiscoveryLog };
  };

  // ── Reducer ──────────────────────────────────────────────────
  window.E._reducers.push((state, action) => {
    switch (action.type) {

      // --- ADVANCE DAY ---
      case A.ADVANCE_DAY: {
        if (state.sailingDaysLeft <= 0) return state;

        const newDays = state.sailingDaysLeft - 1;
        const newWind = advanceWind(state.wind);
        const wages = L.payCrewWages(state);
        const newGold = Math.max(0, state.gold - wages);
        const newRep = (state.day % 2 === 0) ? L.decayReputation(state) : state.reputation;
        const newCrew = advanceCrew(state.crew);
        const prov = advanceProvisions(state);

        let newMorale = newCrew.morale;
        const wagesCrisis = state.gold < wages;
        if (prov.foodEmpty || prov.waterEmpty || wagesCrisis) {
          newMorale = Math.max(0, newMorale - 1);
        }

        const newLog = [...state.log];
        if (prov.foodJustRanOut) newLog.push("⚠ The food stores are empty. The crew grows hungry.");
        if (prov.waterJustRanOut) newLog.push("⚠ The water barrels are dry. The crew suffers.");

        // Smuggle patrol
        const smuggleResult = maybeSmugglePatrol(state, newDays, newWind, newGold, newRep, newMorale, newCrew.roster, prov.items);
        if (smuggleResult) return smuggleResult;

        // Random event
        const eventResult = maybeRandomEvent(state, newDays, newWind, newGold, newRep, newMorale, newCrew.roster, prov.items);
        if (eventResult) return eventResult;

        // Random patrol
        const patrolResult = checkRandomPatrol(state, newDays, newWind, newGold, newRep, newMorale, newCrew.roster, prov.items);
        if (patrolResult) return patrolResult;

        // Escort / Patrol mission encounter
        const missionEncResult = maybeMissionEncounter(state, newDays, newWind, newGold, newRep, newMorale, newCrew.roster, prov.items);
        if (missionEncResult) return missionEncResult;

        // Hidden port discovery
        const { discoveredPorts, log: discoveryLog } = advanceHiddenPorts(state);
        if (discoveryLog.length) newLog.push(...discoveryLog);

        // Normal sailing day
        return {
          ...state,
          wind: newWind,
          day: state.day + 1,
          sailingDaysLeft: newDays,
          gold: newGold,
          reputation: newRep,
          crew: newCrew,
          hold: { ...state.hold, items: prov.items },
          discoveredPorts,
          log: newLog,
        };
      }

      // --- DISCOVER PORT ---
      case A.DISCOVER_PORT: {
        const { portKey } = action;
        if (!portKey || state.discoveredPorts.includes(portKey)) return state;
        const portName = PORTS[portKey]?.name || portKey;
        return {
          ...state,
          discoveredPorts: [...state.discoveredPorts, portKey],
          log: [...state.log, `⚓ New port discovered: ${portName}. Mark it on your charts.`],
        };
      }

      default:
        return state;
    }
  });
})();