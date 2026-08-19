// engine_voyage.js – Voyage Domain (Sailing, Wind, Provisions, Hidden Ports)
// Registers its reducer into window.E._reducers.

(() => {
  const { A, autoSave, buildEncounterSession } = window.E;
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


  // ── All ADVANCE_DAY event helpers now accept only baseState ──

  const maybeSmugglePatrol = (baseState) => {
    const mission = baseState.activeMission;
    if (!mission || mission.type !== "smuggle" || mission.encounterOccurred) return null;
    const interceptChance = mission.interceptChance || 0.70;
    if (Math.random() >= interceptChance) return null;
    const destPort = D.PORTS[baseState.destination];
    const faction = destPort?.faction || "english";
    const enemy = G.generateEnemy("medium", baseState.fame, faction);
    enemy.name = `${FACTIONS[faction]?.label || "Colonial"} Revenue Cutter`;
    const context = L.buildEncounterContext(baseState, "navy_patrol", enemy);
    return {
      activeMission: { ...mission, encounterOccurred: true },
      encounterSession: buildEncounterSession(baseState, context),
      screen: "intercept",
      log: [...baseState.log, "A patrol vessel approaches, flying inspection colours."],
    };
  };

  const maybeMissionEncounter = (baseState) => {
    const mission = baseState.activeMission;
    if (!mission || mission.encounterOccurred) return null;
    if (baseState.destination !== mission.targetPort) return null;
    const newDays = baseState.sailingDaysLeft;
    if (newDays < 1) return null;

    const progress = 1 - (newDays / baseState.sailingDaysTotal);

    if (mission.type === "escort" && !mission.starter) {
      const chance = 0.20 + 0.60 * progress;
      if (newDays <= 1 || Math.random() < chance) {
        const enemy = mission.enemy || G.generateEnemy("medium", baseState.fame, mission.faction);
        const context = L.buildEncounterContext(baseState, "escort_defend", enemy);
        return {
          activeMission: { ...mission, encounterOccurred: true },
          encounterSession: buildEncounterSession(baseState, context),
          screen: "intercept",
          log: [...baseState.log, "The convoy is under attack!"],
        };
      }
    } else if (mission.type === "patrol") {
      if (progress > 0.60) {
        const chance = 0.20 + 0.60 * (progress - 0.60) / 0.40;
        if (Math.random() < chance) {
          const enemy = mission.enemy || G.generateEnemy("medium", baseState.fame, mission.faction);
          const context = L.buildEncounterContext(baseState, "mission_combat", enemy);
          return {
            activeMission: { ...mission, encounterOccurred: true },
            encounterSession: buildEncounterSession(baseState, context),
            screen: "intercept",
            log: [...baseState.log, "You spot a hostile vessel in the patrol zone!"],
          };
        }
      }
    }

    return null;
  };

  const maybeRandomEvent = (baseState) => {
    if (baseState.sailingDaysLeft < 1 || Math.random() >= 0.05) return null;
    const event = L.triggerRandomEvent(baseState);
    if (!event) return null;
    return {
      screen: "event",
      activeEvent: event,
      log: [...baseState.log, `Day ${baseState.day}: ${event.title}`],
    };
  };

  const checkRandomPatrol = (baseState) => {
    if (baseState.sailingDaysLeft < 1 || baseState.activeEvent || baseState.encounterSession) return null;
    if (!L.maybeRandomPatrol(baseState)) return null;
    const port = D.PORTS[baseState.currentPort];
    const faction = port.faction;
    const heatLevel = baseState.factionAlerts?.[faction] || 0;
    const patrolRisk = heatLevel >= 7 ? "high" : heatLevel >= 3 ? "medium" : "low";
    const enemy = G.generateEnemy(patrolRisk, baseState.fame, faction);
    const context = L.buildEncounterContext(baseState, "navy_patrol", enemy);
    return {
      encounterSession: buildEncounterSession(baseState, context),
      screen: "intercept",
      log: ["A navy patrol hails you and demands to inspect your cargo.", ...baseState.log],
    };
  };

  const maybeDrunkardEvent = (baseState) => {
    if (baseState.sailingDaysLeft < 1) return null;
    if (Math.random() >= 0.20) return null;

    const rumInHold = baseState.hold?.items?.rum || 0;
    if (rumInHold <= 0) return null;

    if (baseState.activeMission?.type === "smuggle" && baseState.activeMission.requiredGood !== "rum") return null;

    const drunkards = baseState.crew.roster.filter(m =>
      (m.tags || []).includes("hidden_drunkard") || (m.tags || []).includes("revealed_drunkard")
    );
    if (drunkards.length === 0) return null;

    const drunkard = drunkards[Math.floor(Math.random() * drunkards.length)];
    const wasHidden = (drunkard.tags || []).includes("hidden_drunkard");
    const updatedDrunkard = wasHidden ? L.revealTag(drunkard, "drunkard") : drunkard;

    const newRoster = baseState.crew.roster.map(m => m.id === updatedDrunkard.id ? updatedDrunkard : m);
    const newLogLine = wasHidden
      ? `Someone stole some rum from the hold. The Bosun found it was ${drunkard.firstName} ${drunkard.lastName}.`
      : `${drunkard.firstName} ${drunkard.lastName} took some rum from the hold. Again.`;

    return {
      crew: { ...baseState.crew, roster: newRoster },
      hold: { ...baseState.hold, items: { ...baseState.hold.items, rum: rumInHold - 1 } },
      log: [...baseState.log, newLogLine],
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
        autoDiscoveryLog.push(` New port discovered: ${port.name}. Mark it on your charts.`);
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
        let newCrew = advanceCrew(state.crew);
        const prov = advanceProvisions(state);

        // Morale decay
        let newMorale = newCrew.morale;
        const wagesCrisis = state.gold < wages;
        if (prov.foodEmpty || prov.waterEmpty || wagesCrisis) {
          newMorale = Math.max(0, newMorale - 1);
        }

        // Faction alert decay
        let newAlerts = { ...(state.factionAlerts || {}) };
        if (state.day % 2 === 0) {
          Object.keys(newAlerts).forEach(faction => {
            newAlerts[faction] = Math.max(0, (newAlerts[faction] || 0) - 1);
          });
        }

        // ── Build new log (must be done before starvation to use it there) ──
        const newLog = [...state.log];
        if (prov.foodJustRanOut) newLog.push("⚠ The food stores are empty. The crew grows hungry.");
        if (prov.waterJustRanOut) newLog.push("⚠ The water barrels are dry. The crew suffers.");

        // ── Starvation tracking ──────────────────────────────────────
        const starvation = L.processStarvation(state, prov, newCrew.roster);
        newCrew = { ...newCrew, roster: starvation.roster };
        newLog.push(...starvation.warningLogs);
        if (starvation.deathLog) {
          newLog.push(window.E.logEntry(state, starvation.deathLog));
        }

        // ── Route progression ──────────────────────────────────────
        let newRoute = state.route;
        if (newRoute) {
          const progressedDays = newRoute.progressDays + 1;
          const seaPos = L.getSeaPosition({ ...newRoute, progressDays: progressedDays });
          newRoute = {
            ...newRoute,
            progressDays: progressedDays,
            seaPosition: seaPos,
            enduranceSpent: newRoute.enduranceSpent + 1,
          };
        }

        // Base state with all day‑advance changes applied
        const baseState = {
          ...state,
          wind: newWind,
          day: state.day + 1,
          sailingDaysLeft: newDays,
          gold: newGold,
          reputation: newRep,
          crew: { ...newCrew, morale: newMorale },
          hold: { ...state.hold, items: prov.items },
          factionAlerts: newAlerts,
          log: newLog,
          route: newRoute,
          daysWithoutFood: starvation.daysWithoutFood,
          daysWithoutWater: starvation.daysWithoutWater,
        };

        const isOnboarding = state.onboarding?.enabled && !state.onboarding?.completed;

        // Skip random events during onboarding (protect new players)
        if (!isOnboarding) {
          let result;
          result = maybeSmugglePatrol(baseState);
          if (result) return { ...baseState, ...result };

          result = maybeRandomEvent(baseState);
          if (result) return { ...baseState, ...result };

          result = checkRandomPatrol(baseState);
          if (result) return { ...baseState, ...result };

          result = maybeDrunkardEvent(baseState);
          if (result) return { ...baseState, ...result };
        }

        // Mission encounters ALWAYS fire (tutorial hunt needs this)
        const missionEncResult = maybeMissionEncounter(baseState);
        if (missionEncResult) return { ...baseState, ...missionEncResult };

        // Hidden port discovery
        const { discoveredPorts, log: discoveryLog } = advanceHiddenPorts(state);
        if (discoveryLog.length) baseState.log.push(...discoveryLog);
        baseState.discoveredPorts = discoveredPorts;

        return baseState;
      }

      // --- DISCOVER PORT ---
      case A.DISCOVER_PORT: {
        const { portKey } = action;
        if (!portKey || state.discoveredPorts.includes(portKey)) return state;
        const portName = PORTS[portKey]?.name || portKey;
        return {
          ...state,
          discoveredPorts: [...state.discoveredPorts, portKey],
          log: [...state.log, ` New port discovered: ${portName}. Mark it on your charts.`],
        };
      }

      default:
        return state;
    }
  });
})();