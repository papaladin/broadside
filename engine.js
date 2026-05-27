// engine.js – Named Crew Roster (P1.5.1) + Intercept + Assault Priority + Wind + DaysLost
window.E = (() => {
  const { PORTS, SHIPS, FACTIONS, UPGRADES, STARTS } = window.D;
  const L = window.L;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ACTION CONSTANTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const A = {
    NAVIGATE: "NAVIGATE",
    SAIL_TO: "SAIL_TO",
    ADVANCE_DAY: "ADVANCE_DAY",
    ENTER_PORT: "ENTER_PORT",
    START_GAME: "START_GAME",
    SAVE_GAME: "SAVE_GAME",
    LOAD_GAME: "LOAD_GAME",
    REPAIR: "REPAIR",
    BUY_SHIP: "BUY_SHIP",
    BUY_UPGRADE: "BUY_UPGRADE",
    HIRE_CREW: "HIRE_CREW",
    RAISE_MORALE: "RAISE_MORALE",
    REFRESH_MISSIONS: "REFRESH_MISSIONS",
    TAKE_MISSION: "TAKE_MISSION",
    COMPLETE_MISSION: "COMPLETE_MISSION",
    ABANDON_MISSION: "ABANDON_MISSION",
    INTERCEPT_FIGHT: "INTERCEPT_FIGHT",
    INTERCEPT_FLEE: "INTERCEPT_FLEE",
    INTERCEPT_PARLEY: "INTERCEPT_PARLEY",
    INTERCEPT_BRIBE: "INTERCEPT_BRIBE",
    INTERCEPT_SURRENDER: "INTERCEPT_SURRENDER",
    BATTLE_ACTION: "BATTLE_ACTION",
    DISMISS_BATTLE: "DISMISS_BATTLE",
    RESOLVE_EVENT: "RESOLVE_EVENT",
    SET_WIND: "SET_WIND",
    CONFIRM_TRADE: "CONFIRM_TRADE",
    ENTER_MARKET:  "ENTER_MARKET",
    LEAVE_MARKET:  "LEAVE_MARKET",
    DEBUG_ADD_GOLD:     "DEBUG_ADD_GOLD",
    DEBUG_SET_FAME:     "DEBUG_SET_FAME",
    DEBUG_SET_INFAMY:   "DEBUG_SET_INFAMY",
    DEBUG_SET_SHIP:     "DEBUG_SET_SHIP",
    DEBUG_SET_PORT_REP: "DEBUG_SET_PORT_REP",
    DEBUG_FILL_HOLD:    "DEBUG_FILL_HOLD",
    DEBUG_REPAIR:       "DEBUG_REPAIR",
    DISCOVER_PORT: "DISCOVER_PORT",
  };


  // ── Auto-save helper ─────────────────────────────────────────────
const autoSave = (state) => {
  try {
    localStorage.setItem("piratesSave", JSON.stringify(state));
  } catch (e) {
    console.warn("Auto-save failed:", e);
  }
};

  // ── State migration ──────────────────────────────────────────────
// Additive patches to bring older saves up to current version.
// Each patch is gated by version number and must be non‑destructive.
const migrateState = (loaded) => {
  let s = { ...loaded };

  // Ensure version field exists on very old saves
  if (!s.version) s.version = 1;

 if (!s.version || s.version < 2) {
  s.discoveredPorts = s.discoveredPorts ||
    Object.keys(D.PORTS).filter(k => !D.PORTS[k].hidden);
  s.mapFragments = s.mapFragments || [];
  s.version = 2;
}

  // Future patches go here, e.g.:
  // if (s.version < 2) {
  //   s.crew = { ...s.crew, moraleZeroDays: s.crew?.moraleZeroDays ?? 0 };
  //   s.version = 2;
  // }

  return s;
};

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  INITIAL STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const initialState = {
    version: 1,
    screen: "start",
    day: 1,
    log: [],
    gold: 1000,
    fame: 0,
    infamy: 0,
    currentPort: "portRoyal",
    previousPort: null,
    destination: null,
    discoveredPorts: Object.keys(PORTS).filter(k => !PORTS[k].hidden),
    mapFragments: [],
    sailingDaysLeft: 0,
    sailingDaysTotal: 0,
    wind: { angle: 45, speed: 10 },
    ship: { type: "sloop", name: "Sea Dog", hull: 100, cannons: 10, upgrades: [] },
    crew: { roster: [], max: 50, morale: 80 },
    hold: {
      capacity: 200,   // default sloop
      items: {
        food: 10, water: 10,
        rum: 0, sugar: 0, timber: 0, cloth: 0, spices: 0, silk: 0,
        coffee: 0, cocoa: 0, weapons: 0, tobacco: 0, silver: 0, slaves: 0,
      },
    },
    portMarket: null,
    missions: [],
    activeMission: null,
    reputation: {},
    battleState: null,
    activeEvent: null,
    encounterContext: null,
  };

  Object.keys(PORTS).forEach(portKey => {
    initialState.reputation[portKey] = 50;
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  REDUCER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const reducer = (state, action) => {
    switch (action.type) {

      // --- START GAME ---
      case A.START_GAME: {
  const start = STARTS.find(s => s.id === action.scenarioId);
  if (!start) return { ...initialState, screen: "start" };

  // 1. Base state
  const newState = {
    ...initialState,
    screen: "port",
    day: 1,
    infamy: 0,
    fame: start.debugStartFame ?? 0,
    gold: start.gold,
    currentPort: start.startPort,
    portMarket: null,
    log: [...(start.openingLog || [])],
  };

  // 2. Ship and hold
  const shipData = SHIPS[start.ship];
  newState.ship = {
    type: start.ship,
    name: shipData.name,
    hull: shipData.maxHull,
    cannons: shipData.cannons,
    upgrades: [],
  };
  newState.hold = {
    capacity: shipData.holdCapacity,
    items: {
      food: 0, water: 0, rum: 0, sugar: 0, timber: 0, cloth: 0,
      spices: 0, silk: 0, coffee: 0, cocoa: 0, weapons: 0,
      tobacco: 0, silver: 0, slaves: 0,
      ...(start.hold || {}),
    },
  };
  newState.crew = {
    ...newState.crew,
    max: shipData.maxCrew,
    roster: start.crewCount > 0
      ? G.generateRoster(start.crewCount, start.crewFaction || start.faction)
      : [],
    morale: 80,
  };

  // 3. Reputation
  const rep = {};
  Object.keys(PORTS).forEach(portKey => { rep[portKey] = 50; });
  Object.entries(start.repAdjust || {}).forEach(([faction, delta]) => {
    Object.keys(PORTS).forEach(portKey => {
      if (PORTS[portKey].faction === faction) {
        rep[portKey] = Math.max(0, Math.min(100, 50 + delta));
      }
    });
  });
  newState.reputation = rep;

  // 4. Market and missions
  newState.portMarket = G.generatePortMarket(start.startPort);
  const generatedMissions = G.generateMissions(start.startPort, newState);
  if (start.starterMission) {
    // Auto‑accept the starter mission – it goes straight into activeMission
    newState.activeMission = { ...start.starterMission, encounterOccurred: false };
    // Show the generated missions on the board (starter is already active, so don't list it)
    newState.missions = generatedMissions;
    newState.log = [...newState.log, `Accepted opening quest: ${start.starterMission.name}.`];
  } else {
    newState.missions = generatedMissions;
  }

  return newState;
}

      // --- NAVIGATION ---
      case A.NAVIGATE: return { ...state, screen: action.screen };

      // --- SAILING ---
      case A.SAIL_TO: {
        const days = L.travelDays(state.currentPort, action.port, state);
        return { ...state, previousPort: state.currentPort, destination: action.port, sailingDaysLeft: days, sailingDaysTotal: days, screen: "sailing", log: [...state.log, `Setting sail for ${PORTS[action.port].name}. ${days} day${days !== 1 ? "s" : ""} voyage.`] };
      }

      
      // --- ADVANCE DAY ---
      case A.ADVANCE_DAY: {
  if (state.sailingDaysLeft <= 0) return state;

  const newDays = state.sailingDaysLeft - 1;
  const newLog = [...state.log];

  // Wind shifts gradually each day at sea
  const rawAngle = (state.wind.angle + (Math.random() - 0.5) * 30 + 360) % 360;
  const newWind = {
    angle: Math.round(rawAngle) % 360,
    speed: Math.round(Math.max(1, Math.min(20, state.wind.speed + (Math.random() - 0.5) * 5)))
  };

  // Deduct crew wages
  const wages = L.payCrewWages(state);
  const newGold = Math.max(0, state.gold - wages);

  // Reputation decay (every 2 days, never below 50)
  const newRep = (state.day % 2 === 0)
    ? L.decayReputation(state)
    : state.reputation;

  // Morale decay (only if already below 30)
  let newMorale = state.crew.morale < 30
    ? Math.max(0, state.crew.morale - 1)
    : state.crew.morale;

  // Increment days aboard for all crew
  const updatedRoster = state.crew.roster.map(m => ({ ...m, daysAboard: m.daysAboard + 1 }));

  // ── Provision consumption ──
  const consumption = L.getProvisionConsumptionPerDay(state);
  const holdItems = state.hold?.items || {};
  const newFood  = Math.max(0, (holdItems.food || 0) - consumption.food);
  const newWater = Math.max(0, (holdItems.water || 0) - consumption.water);
  const newHoldItems = { ...holdItems, food: newFood, water: newWater };

  // Morale penalty from provision/wages crisis (max -1, stacks with other systems)
  const foodJustRanOut  = newFood  === 0 && (holdItems.food  || 0) > 0;
  const waterJustRanOut = newWater === 0 && (holdItems.water || 0) > 0;
  const foodOut  = newFood  === 0;
  const waterOut = newWater === 0;
  const wagesCrisis = state.gold < wages;
  const anyProvisionCrisis = foodOut || waterOut || wagesCrisis;

  if (anyProvisionCrisis) {
    newMorale = Math.max(0, newMorale - 1);
  }
  if (foodJustRanOut)  newLog.push("⚠ The food stores are empty. The crew grows hungry.");
  if (waterJustRanOut) newLog.push("⚠ The water barrels are dry. The crew suffers.");

// ── Smuggle mission patrol risk ───────────────────────────────
// Single high-probability check per voyage, routes through navy_patrol event
if (state.activeMission?.type === "smuggle" && !state.activeMission.encounterOccurred) {
  const interceptChance = state.activeMission.interceptChance || 0.70;
  if (Math.random() < interceptChance) {
    const navyPatrol = window.D.RANDOM_EVENTS?.find(e => e.id === "navy_patrol");
    if (navyPatrol) {
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
        activeEvent: { ...navyPatrol },
        screen: "event",
        log: [...newLog, "A patrol vessel approaches, flying inspection colours."]
      };
    }
  }
}

  // ── Random event (skip on final day) ──
  if (newDays >= 1 && Math.random() < 0.1) {
    const event = L.triggerRandomEvent(state);
    if (event) {
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
        log: [...newLog, `Day ${state.day + 1}: ${event.title}`]
      };
    }
  }

// --- Random patrol check (new) ---
// Only if not arrived, no active event/encounter, and not the final day (arrived).
// --- Random patrol check (via InterceptScreen) ---
if (state.sailingDaysLeft > 0 && !state.activeEvent && !state.encounterContext) {
  if (L.maybeRandomPatrol(state)) {
    const port = D.PORTS[state.currentPort];
    const faction = port.faction;
    const enemy = G.generateEnemy("low", state.fame, faction);
    const context = L.buildEncounterContext(state, "navy_patrol", enemy);

    // Override the static surrender consequence with a dynamic function
    context.options.surrender.consequence = function(st) {
      const illegalGoods = Object.keys(D.RESOURCES).filter(k => D.RESOURCES[k].illegal);
      const hasIllegal = illegalGoods.some(g => (st.hold?.items?.[g] || 0) > 0);

      if (!hasIllegal) {
        return {
          log: "The patrol finds nothing illegal. They let you pass.",
          reputation: L.updateReputation(st, faction, 5)
        };
      } else {
        const newItems = { ...st.hold.items };
        illegalGoods.forEach(g => newItems[g] = 0);
        return {
          log: "The patrol finds illegal goods! They confiscate everything and fine you.",
          hold: { ...st.hold, items: newItems },
          gold: Math.max(0, st.gold - 200),
          infamy: (st.infamy || 0) + 1,
          crew: { ...st.crew, morale: Math.max(0, st.crew.morale - 10) },
          reputation: L.updateReputation(st, faction, -5)
        };
      }
    };

    return {
      ...state,
      encounterContext: context,
      screen: "intercept",
      log: ["A navy patrol hails you and demands to inspect your cargo.", ...state.log]
    };
  }
}




   // ── Hidden port auto‑discovery check ─────────────────────────
  let autoDiscovered = [...(state.discoveredPorts || [])];
  let autoDiscoveryLog = [];

  Object.entries(PORTS).forEach(([key, port]) => {
    if (!port.hidden) return;
    if (autoDiscovered.includes(key)) return;

    const conditions = port.unlockCondition?.conditions || [];
    if (port.unlockCondition?.type === "item") return;   // item conditions handled in RESOLVE_EVENT

    const operator = port.unlockCondition?.type || "any";
    const results = conditions.map(c => {
      if (c.type === "fame")       return state.fame >= c.value;
      if (c.type === "infamy")     return (state.infamy ?? 0) >= c.value;
      if (c.type === "reputation") {
        const factionPorts = Object.keys(PORTS).filter(k => PORTS[k].faction === c.faction);
        if (factionPorts.length === 0) return false;
        const avgRep = factionPorts.reduce((sum, k) => sum + (state.reputation[k] ?? 50), 0) / factionPorts.length;
        return avgRep >= c.value;
      }
      return false;
    });

    const unlocked = operator === "all"
      ? results.every(Boolean)
      : results.some(Boolean);

    if (unlocked) {
      autoDiscovered.push(key);
      autoDiscoveryLog.push(`⚓ New port discovered: ${port.name}. Mark it on your charts.`);
    }
  });

  if (autoDiscoveryLog.length > 0) {
    newLog.push(...autoDiscoveryLog);
  }

  // ── Normal sailing day ──
  return {
    ...state,
    wind: newWind,
    day: state.day + 1,
    sailingDaysLeft: newDays,
    gold: newGold,
    reputation: newRep,
    crew: { ...state.crew, roster: updatedRoster, morale: newMorale },
    hold: { ...state.hold, items: newHoldItems },
    discoveredPorts: autoDiscovered,
  };
}

      //---- PORT DISCOVERY EVENT -------------------

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


      // --- ENTER PORT (with assault / hostile priority) ---
      case A.ENTER_PORT: {
        const port = PORTS[state.destination];
        const portFaction = port.faction;
        const playerRep = state.reputation[state.destination] ?? 50;
        let combatEncounter = null;

        // 1. Assault mission at destination
        if (state.activeMission?.type === "assault" && state.activeMission.targetPort === state.destination) {
          const mission = state.activeMission;
          if (mission.enemy) combatEncounter = { type: "hostile_port_entry", enemy: mission.enemy };
          else combatEncounter = { type: "hostile_port_entry", enemy: { name: `${port.name} Garrison`, hull: 200, cannons: 20, crew: 50, faction: portFaction, gold: 500 } };
        }
        // 2. Hostile port
        else if (playerRep < 10) {
          combatEncounter = { type: "hostile_port_entry", enemy: { name: `${port.name} Guards`, hull: 150, cannons: 15, crew: 40, faction: portFaction, gold: 300 } };
        }

        if (combatEncounter) {
          const encounterContext = L.buildEncounterContext(state, combatEncounter.type, combatEncounter.enemy);
          const logMsg = state.activeMission?.type === "assault" ? `Arrived at ${port.name}. The garrison is on high alert!` : `Arrived at ${port.name}. Hostile port!`;
          return { ...state, currentPort: state.destination, destination: null, sailingDaysLeft: 0, encounterContext, screen: "intercept", portMarket: G.generatePortMarket(state.destination), log: [...state.log, logMsg] };
        }

        // Normal entry
        const nextState = {
          ...state,
          currentPort: state.destination,
          destination: null,
          sailingDaysLeft: 0,
          screen: "port",
          missions: G.generateMissions(state.destination, state),
          portMarket: G.generatePortMarket(state.destination),
          log: [...state.log, `Arrived at ${port.name}.`]
        };
        autoSave(nextState);
        return nextState;
      }

      // --- PORT ACTIONS ---
      case A.REPAIR: {
        const repPerk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
        if (repPerk.servicesBlocked) return {
          ...state,
          log: [...state.log, "You are at war with this port. No services available."]
        };
        const shipStats = L.getShipStats(state);
        const rep = state.reputation[state.currentPort] ?? 50;
        const perk = L.getRepPerk(rep);
        const baseCost = (shipStats.maxHull - state.ship.hull) * 2;
        const cost = Math.floor(baseCost * perk.repairMult);
        if (state.gold < cost) {
          return { ...state, log: [...state.log, "Not enough gold to repair."] };
        }
        const discountNote = perk.repairMult < 1 ? ` (${perk.tier} discount applied)` : "";
        return {
          ...state,
          gold: state.gold - cost,
          ship: { ...state.ship, hull: shipStats.maxHull },
          log: [...state.log, `Repaired ship for ${cost}g${discountNote}.`]
        };
      }

      case A.BUY_SHIP: {
        const repPerk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
        if (repPerk.servicesBlocked) return {
          ...state,
          log: [...state.log, "You are at war with this port. No services available."]
        };
        const ship = SHIPS[action.shipType];
        const req = L.meetsRequirement(state, ship);
        if (!req.allowed) return { ...state, log: [...state.log, `Cannot purchase: ${req.reason}.`] };
        if (!ship || state.gold < ship.cost) return { ...state };
        let newRoster = state.crew.roster;
        if (ship.maxCrew < newRoster.length) newRoster = newRoster.slice(0, ship.maxCrew);
        return { ...state, gold: state.gold - ship.cost, ship: { type: action.shipType, name: ship.name, hull: ship.maxHull, cannons: ship.cannons, upgrades: [] }, crew: { ...state.crew, roster: newRoster, max: ship.maxCrew }, hold: {...state.hold, capacity: ship.holdCapacity,}, log: [...state.log, `Purchased ${ship.name} for ${ship.cost}g.`] };
      }

      case A.BUY_UPGRADE: {
        const upgrade = D.UPGRADES[action.upgradeKey]; 
        const repPerk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
        if (repPerk.servicesBlocked) return {
          ...state,
          log: [...state.log, "You are at war with this port. No services available."]
        };
        const req = L.meetsRequirement(state, upgrade);
        if (!req.allowed) return { ...state, log: [...state.log, `Cannot install: ${req.reason}.`] };
        if (!upgrade || state.gold < upgrade.cost || state.ship.upgrades.includes(action.upgradeKey) || !SHIPS[state.ship.type].upgradeable.includes(action.upgradeKey)) return { ...state };
        return { ...state, gold: state.gold - upgrade.cost, ship: { ...state.ship, upgrades: [...state.ship.upgrades, action.upgradeKey] }, log: [...state.log, `Installed ${upgrade.name} for ${upgrade.cost}g.`] };
      }

      // --- CREW & MORALE ---
      case A.HIRE_CREW: {
        const repPerk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
        if (repPerk.servicesBlocked) return {
          ...state,
          log: [...state.log, "You are at war with this port. No services available."]
        };
        const cost = action.count * 50;
        if (state.crew.roster.length >= state.crew.max || state.gold < cost) return { ...state };
        const portFaction = PORTS[state.currentPort]?.faction || "pirate";
        const newMembers = G.generateRoster(action.count, portFaction);
        return { ...state, gold: state.gold - cost, crew: { ...state.crew, roster: [...state.crew.roster, ...newMembers] }, log: [...state.log, `Hired ${action.count} crew for ${cost}g.`] };
      }

      case A.RAISE_MORALE: {
        const repPerk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
        if (repPerk.servicesBlocked) return {
          ...state,
          log: [...state.log, "You are at war with this port. No services available."]
        };
        const cost = state.crew.roster.length * 5;
        if (state.gold < cost || state.crew.morale >= 100) return { ...state };
        return { ...state, gold: state.gold - cost, crew: { ...state.crew, morale: Math.min(100, state.crew.morale + 5) }, log: [...state.log, `Bought drinks for the crew: -${cost}g. Morale +5.`] };
      }

      // --- MISSIONS ---
      case A.REFRESH_MISSIONS: return { ...state, missions: G.generateMissions(state.currentPort, state) };

      case A.TAKE_MISSION: {
        const mission = action.mission;
        if (!mission) return state;

        // Combat missions go to intercept screen immediately
        if (mission.type === "combat" && mission.enemy) {
          return {
            ...state,
            activeMission: mission,
            encounterContext: L.buildEncounterContext(state, "mission_combat", mission.enemy),
            screen: "intercept",
            log: [...state.log, `Accepted mission: ${mission.name}.`]
          };
        }

        // Other mission types (trade, escort, smuggle, assault)
        return {
          ...state,
          activeMission: { ...mission, encounterOccurred: false },
          log: [...state.log, `Accepted mission: ${mission.name}.`]
        };
      }

case A.COMPLETE_MISSION: {
  const mission = state.activeMission;
  if (!mission) return state;
  if (mission.targetPort && state.currentPort !== mission.targetPort) {
    return { ...state };
  }

  // ── Cargo satisfaction check (trade and smuggle) ──────────────
  if (mission.requiredGood && mission.requiredQty) {
    const inHold = state.hold?.items?.[mission.requiredGood] || 0;
    if (inHold < mission.requiredQty) {
      return {
        ...state,
        log: [...state.log,
          `Cannot complete: ${mission.requiredQty} ${window.D.RESOURCES[mission.requiredGood]?.name} required, ${inHold} in hold.`
        ]
      };
    }
  }

  // ── Remove goods from hold on trade/smuggle completion ────────
  let holdItems = { ...(state.hold?.items || {}) };
  if (mission.requiredGood && mission.requiredQty) {
    holdItems[mission.requiredGood] = Math.max(0,
      (holdItems[mission.requiredGood] || 0) - mission.requiredQty
    );
  }

  // ── Gold (no rep multiplier for trade or smuggle) ─────────────
  let finalGold;
  let bonusNote;

  if (mission.type === "trade" || mission.type === "smuggle") {
    finalGold = mission.gold;
    bonusNote = "";
  } else {
    const rep = state.reputation[state.currentPort] ?? 50;
    const perk = L.getRepPerk(rep);
    const baseGold = mission.gold;
    finalGold = Math.floor(baseGold * perk.missionMult);
    const goldDelta = finalGold - baseGold;
    bonusNote = goldDelta > 0 ? ` (+${goldDelta}g ${perk.tier} bonus)`
              : goldDelta < 0 ? ` (${Math.abs(goldDelta)}g ${perk.tier} penalty)` : "";
  }

  // ── Infamy, rep, fame (unchanged logic) ───────────────────────
  const newRep = L.applyReputationImpact(state, mission.repImpact);
  const infamyGain = mission.infamyGain || 0;
  const oldInfamy = state.infamy ?? 0;
  const newInfamy = Math.min(999, oldInfamy + infamyGain);
  const crossedThreshold = L.getInfamyLabel(newInfamy) !== L.getInfamyLabel(oldInfamy);

  const newLog = [
    ...state.log,
    `Completed: ${mission.name}. +${finalGold}g${bonusNote}, +${mission.fame} fame.`
  ];
  if (infamyGain > 0) newLog.push(`+${infamyGain} infamy.`);
  if (crossedThreshold) newLog.push(`Your name grows darker. You are now ${L.getInfamyLabel(newInfamy)}.`);

  // Remove plot item if mission had one
  if (mission.plotItem) {
    holdItems = { ...holdItems, plot_item: 0 };
  }

  const nextState = {
    ...state,
    gold: state.gold + finalGold,
    fame: state.fame + mission.fame,
    infamy: newInfamy,
    reputation: newRep,
    activeMission: null,
    hold: { ...state.hold, items: holdItems },
    missions: G.generateMissions(state.currentPort, { ...state, activeMission: null }),
    log: newLog,
  };
  autoSave(nextState);
  return nextState;
}

      case A.ABANDON_MISSION: return { ...state, activeMission: null, reputation: L.applyReputationImpact(state, { [state.activeMission?.faction || "pirate"]: -10 }), log: [...state.log, `Abandoned mission: ${state.activeMission?.name}.`] };


      // --- MARKET AND COMMERCE ---

case A.CONFIRM_TRADE: {
  const { buys, sells } = action;
  if (!state.portMarket) return state;

  const items = { ...(state.hold?.items || {}) };
  let goldDelta = 0;
  let infamyDelta = 0;
  const logLines = [];

  // 1. Process sells (frees hold space)
  Object.entries(sells || {}).forEach(([good, qty]) => {
    if (qty <= 0) return;
    const portGood = state.portMarket.goods[good];
    if (!portGood) return;
    const actualQty = Math.min(qty, items[good] || 0);
    if (actualQty <= 0) return;
    const revenue = actualQty * portGood.sellToPort;
    items[good] = (items[good] || 0) - actualQty;
    goldDelta += revenue;
    logLines.push(`Sold ${actualQty} ${window.D.RESOURCES[good]?.unit || good} of ${window.D.RESOURCES[good]?.name || good} for ${revenue}g.`);
  });

  // 2. Validate buys holistically
  const usedAfterSells = L.getHoldUsed(items);
  let pendingBuysGold = 0;
  let pendingBuysSpace = 0;
  const buyEntries = Object.entries(buys || {}).filter(([_, qty]) => qty > 0);

  for (const [good, qty] of buyEntries) {
    const portGood = state.portMarket.goods[good];
    if (!portGood) { logLines.push(`${good} is not available at this port.`); continue; }
    if (qty > portGood.available) { logLines.push(`Not enough ${good} available.`); continue; }
    pendingBuysGold += qty * portGood.buyFromPort;
    pendingBuysSpace += qty;
  }

  // Check gold
  if (state.gold + goldDelta - pendingBuysGold < 0) {
    return { ...state, log: [...state.log, "Trade cancelled — insufficient gold."] };
  }
  // Check space
  if (usedAfterSells + pendingBuysSpace > state.hold.capacity) {
    return { ...state, log: [...state.log, "Trade cancelled — not enough hold space."] };
  }

  // 3. Commit buys
  for (const [good, qty] of buyEntries) {
    const portGood = state.portMarket.goods[good];
    if (!portGood) continue;
    const cost = qty * portGood.buyFromPort;
    items[good] = (items[good] || 0) + qty;
    goldDelta -= cost;
    const res = window.D.RESOURCES[good];
    if (res?.infamyOnBuy) {
      infamyDelta += res.infamyOnBuy;
      logLines.push(`Purchasing ${res.name} darkens your reputation.`);
    }
    logLines.push(`Bought ${qty} ${res?.unit || good} of ${res?.name || good} for ${cost}g.`);
  }

  return {
    ...state,
    gold: state.gold + goldDelta,
    hold: { ...state.hold, items },
    infamy: Math.min(999, (state.infamy ?? 0) + infamyDelta),
    log: [...state.log, ...logLines],
  };
}


  case A.ENTER_MARKET:
    return { ...state, screen: "market" };

  case A.LEAVE_MARKET:
    return { ...state, screen: "port" };



      // ── INTERCEPT ACTIONS ──────────────────────────────────────

      case A.INTERCEPT_FIGHT: {
  const ctx = state.encounterContext;
  if (!ctx) return state;
  const enemy = ctx.enemy;
  const bs = {
    phase: "player_turn",
    playerHull: state.ship.hull,
    playerCrew: state.crew.roster.length,
    enemy,
    enemyHull: enemy.hull,
    enemyCrew: enemy.crew,
    round: 1,
    log: [`You engage the ${enemy.name}!`],
    returnScreen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port",
    initialCrewCount: state.crew.roster.length,
    lostCrewNames: [],
    isNavyPatrol: ctx.isNavyPatrol || false,   // ← carry flag into battle state
  };
  return { ...state, encounterContext: null, battleState: bs, screen: "battle" };
}

      case A.INTERCEPT_FLEE: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const { player, enemy } = ctx.options.flee.speedCheck;
        const playerRoll = player + L.roll(6);
        const enemyRoll  = enemy  + L.roll(6);
        if (playerRoll >= enemyRoll) {
          return { ...state, encounterContext: null, screen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port", log: [...state.log, "You pulled clear — the enemy couldn't keep up."] };
        }
        // Failed flee → battle
        const enemyObj = ctx.enemy;
        const bs = {
          phase: "player_turn",
          playerHull: state.ship.hull,
          playerCrew: state.crew.roster.length,
          enemy: enemyObj,
          enemyHull: enemyObj.hull,
          enemyCrew: enemyObj.crew,
          round: 1,
          log: ["Escape failed! The enemy closes in."],
          returnScreen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port",
          initialCrewCount: state.crew.roster.length,
          lostCrewNames: [],
        };
        return { ...state, encounterContext: null, battleState: bs, screen: "battle", log: [...state.log, "Failed to escape — battle unavoidable."] };
      }

      case A.INTERCEPT_PARLEY: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const rep = state.reputation[state.destination ?? state.currentPort] ?? 20;
        const success = L.roll(100) <= Math.min(80, rep + 20);
        if (success) {
          const portKey = state.destination ?? state.currentPort;
          return { ...state, encounterContext: null, screen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port", reputation: { ...state.reputation, [portKey]: Math.min(100, (state.reputation[portKey] ?? 20) + 3) }, log: [...state.log, "Parley successful. They let you pass."] };
        }
        // Failed parley → battle
        const enemyObj = ctx.enemy;
        const bs = {
          phase: "player_turn",
          playerHull: state.ship.hull,
          playerCrew: state.crew.roster.length,
          enemy: enemyObj,
          enemyHull: enemyObj.hull,
          enemyCrew: enemyObj.crew,
          round: 1,
          log: ["Parley failed — they attack!"],
          returnScreen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port",
          initialCrewCount: state.crew.roster.length,
          lostCrewNames: [],
        };
        return { ...state, encounterContext: null, battleState: bs, screen: "battle", log: [...state.log, "Parley failed. Battle unavoidable."] };
      }

      case A.INTERCEPT_BRIBE: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const cost = ctx.options.bribe.cost;
        const portKey = state.destination ?? state.currentPort;
        return { ...state, encounterContext: null, gold: state.gold - cost, reputation: { ...state.reputation, [portKey]: Math.max(0, (state.reputation[portKey] ?? 20) - 2) }, screen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port", log: [...state.log, `Bribed them with ${cost}g. They looked the other way.`] };
      }

      case A.INTERCEPT_SURRENDER: {
  const ctx = state.encounterContext;
  if (!ctx) return state;
  const consequence = ctx.options.surrender.consequence;

  // --- Dynamic consequence (random patrol) ---
  if (typeof consequence === "function") {
    // Call the function with the current state to get a partial state update
    const result = consequence(state);
    let s = { ...state, encounterContext: null };

    // Merge all fields the function returned
    if (result.log)          s.log = [result.log, ...state.log];
    if (result.reputation)   s.reputation = result.reputation;
    if (result.hold)         s.hold = result.hold;
    if (result.gold !== undefined) s.gold = result.gold;
    if (result.infamy !== undefined) s.infamy = result.infamy;
    if (result.crew)         s.crew = result.crew;
    // Any other top-level fields the function might return can be added here

    // Return to sailing (or port if already arrived)
    s.screen = state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port";
    // Append a generic surrender note if not already in the dynamic log
    if (!(result.log || "").includes("surrender")) {
      s.log = ["You surrendered to the patrol.", ...s.log];
    }
    return s;
  }

  // --- Static consequence (all existing encounter types) ---
  let s = { ...state, encounterContext: null };

  // Gold penalties
  if (consequence.goldFine) s.gold = Math.max(0, s.gold - consequence.goldFine);
  if (consequence.loseGoldPercent) s.gold = Math.max(0, Math.round(s.gold * (1 - consequence.loseGoldPercent / 100)));

  // Morale penalty
  if (consequence.moralePenalty) s.crew = { ...s.crew, morale: Math.max(0, s.crew.morale - consequence.moralePenalty) };

  // Days lost
  if (consequence.loseDays) { s.day += consequence.loseDays; }

  // Reputation loss
  if (consequence.rep_loss) {
    const portKey = state.destination ?? state.currentPort;
    s.reputation = { ...s.reputation, [portKey]: Math.max(0, (s.reputation[portKey] ?? 20) - consequence.rep_loss) };
  }

  // Cargo seizure
  let newHoldItems = { ...(state.hold?.items || {}) };
  const logExtra = [];
  if (consequence.loseCargoPercent) {
    newHoldItems = L.applyLoseCargoPercent(newHoldItems, consequence.loseCargoPercent);
    logExtra.push(`${consequence.loseCargoPercent}% of your cargo was seized.`);
  }
  if (consequence.loseContraband) {
    newHoldItems = L.applyLoseContraband(newHoldItems);
    logExtra.push("Your contraband was confiscated.");
  }

  s.hold = { ...state.hold, items: newHoldItems };
  s.screen = state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port";
  s.log = [...state.log, "You surrendered. The consequences were steep.", ...logExtra];

  return s;
}

      // ── COMBAT ──────────────────────────────────────────────────

      case A.BATTLE_ACTION: {
        const outcome = L.resolveCombatAction(state, action.action);
        const newLog = [...state.battleState.log];
        const newMorale = Math.max(0, Math.min(100, state.crew.morale + (outcome.moraleDelta || 0)));

        if (outcome.instantVictory) {
          const newGold = state.gold + (outcome.goldReward || 0);
          const newRep = L.applyReputationImpact(state, { [state.battleState.enemy.faction]: -5 });
          const initialCrew = state.battleState.initialCrewCount ?? state.crew.roster.length;
          const lostCrewNames = state.battleState.lostCrewNames ?? [];
          const totalLost = initialCrew - state.crew.roster.length;
          let capMsg = "Victory! Boarding successful.";
          if (totalLost > 0) { const some = lostCrewNames.slice(0,3).join(", "); capMsg += ` Lost ${totalLost} crew, including ${some}.`; }
          return { ...state, gold: newGold, reputation: newRep, ship: { ...state.ship, hull: state.battleState.playerHull }, crew: { ...state.crew, morale: newMorale }, battleState: { ...state.battleState, phase: "victory", goldReward: outcome.goldReward, log: [...newLog, `Player: ${action.action}. Instant victory! +${outcome.goldReward}g`] }, log: [...state.log, capMsg] };
        }

        const newPlayerCrewCount = Math.max(0, state.battleState.playerCrew - outcome.enemy.crewLoss);
        const lostCount = state.crew.roster.length - newPlayerCrewCount;
        let newRoster = state.crew.roster;
        let crewLog = "";
        if (lostCount > 0) {
          const { newRoster: nr, removed } = L.removeRandomCrew(state.crew.roster, lostCount);
          newRoster = nr;
          const lostCrewNames = [...state.battleState.lostCrewNames, ...removed.map(m => `${m.firstName} ${m.lastName}`)];
          state.battleState.lostCrewNames = lostCrewNames;
          const names = removed.map(m => `${m.firstName} ${m.lastName}`).join(", ");
          crewLog = ` Lost ${lostCount} crew: ${names}.`;
        }

        const newBattleState = {
          ...state.battleState,
          playerHull: Math.max(0, state.battleState.playerHull - outcome.enemy.hullDamage),
          enemyHull: Math.max(0, state.battleState.enemyHull - outcome.player.hullDamage),
          playerCrew: newRoster.length,
          enemyCrew: Math.max(0, state.battleState.enemyCrew - outcome.player.crewLoss),
          round: state.battleState.round + 1,
          phase: "npc_turn",
          log: [...newLog, `Player: ${action.action}. Enemy: ${L.getNPCAction(state.battleState.enemy)}.${crewLog}`],
          lostCrewNames: state.battleState.lostCrewNames ?? [],
        };

        if (newBattleState.enemyHull <= 0) {
          newBattleState.phase = "victory";
          newBattleState.goldReward = outcome.goldReward || 0;
          const initialCrew = newBattleState.initialCrewCount ?? state.crew.roster.length;
          const lostCrewNames = newBattleState.lostCrewNames ?? [];
          const totalLost = initialCrew - newRoster.length;
          let capMsg = "Victory! The enemy ship was sunk.";
          if (totalLost > 0) {
            const some = lostCrewNames.slice(0, 3).join(", ");
            capMsg += ` Lost ${totalLost} crew, including ${some}.`;
          }
          const newRep = L.applyReputationImpact(state, { [state.battleState.enemy.faction]: -5 });
          return {
            ...state,
            gold: state.gold + (outcome.goldReward || 0),
            reputation: newRep,
            ship: { ...state.ship, hull: newBattleState.playerHull },
            crew: { ...state.crew, roster: newRoster, morale: newMorale },
            battleState: newBattleState,
            log: [...state.log, capMsg]
          };
        }

        if (newBattleState.playerHull <= 0) {
          newBattleState.phase = "defeat";
          const initialCrew = newBattleState.initialCrewCount ?? state.crew.roster.length;
          const lostCrewNames = newBattleState.lostCrewNames ?? [];
          const totalLost = initialCrew - newRoster.length;
          let capMsg = "Defeated! Your ship was destroyed.";
          if (totalLost > 0) {
            const some = lostCrewNames.slice(0, 3).join(", ");
            capMsg += ` Lost ${totalLost} crew, including ${some}.`;
          }
          newBattleState.log.push("Your ship is destroyed!");
          return {
            ...state,
            ship: { ...state.ship, hull: newBattleState.playerHull },
            crew: { ...state.crew, roster: newRoster, morale: newMorale },
            battleState: newBattleState,
            log: [...state.log, capMsg]
          };
        }
          // Flee (evade success)
        if (outcome.fled) {
          newBattleState.phase = "fled";
          return {
            ...state,
            ship: { ...state.ship, hull: newBattleState.playerHull },
            crew: { ...state.crew, roster: newRoster, morale: newMorale },
            battleState: newBattleState
          };
        }

        // Normal round – continue fighting
        return {
          ...state,
          ship: { ...state.ship, hull: newBattleState.playerHull },
          crew: { ...state.crew, roster: newRoster, morale: newMorale },
          battleState: newBattleState
        };
      }

      case A.DISMISS_BATTLE: {
  const { battleState } = state;

  // Patrol infamy: +2 for fighting (any outcome), 0 for fleeing from intercept
  const patrolInfamy = battleState.isNavyPatrol ? 2 : 0;
  const patrolLog = patrolInfamy > 0
    ? [`+${patrolInfamy} infamy — attacking crown forces was witnessed.`]
    : [];

  if (battleState.phase === "defeat") {
    const returnPort = state.previousPort || state.currentPort;
    const portName = PORTS[returnPort]?.name || "a nearby port";
    return {
      ...state,
      battleState: null,
      screen: "port",
      currentPort: returnPort,
      destination: null,
      sailingDaysLeft: 0,
      sailingDaysTotal: 0,
      hold: {
        ...state.hold,
        items: Object.fromEntries(Object.keys(state.hold?.items || {}).map(k => [k, 0])),
      },
      portMarket: G.generatePortMarket(returnPort),
      missions: G.generateMissions(returnPort, state),
      infamy: Math.min(999, (state.infamy ?? 0) + patrolInfamy),
      log: [
        ...state.log,
        `Defeated in battle and washed ashore at ${portName}.`,
        "All cargo lost.",
        ...patrolLog,
      ],
    };
  }

  if (battleState.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0) {
    return {
      ...state,
      battleState: null,
      screen: "sailing",
      infamy: Math.min(999, (state.infamy ?? 0) + patrolInfamy),
      log: [...state.log, ...patrolLog],
    };
  }

  // Victory or other returns to port
  return {
    ...state,
    battleState: null,
    screen: battleState.returnScreen || "port",
    infamy: Math.min(999, (state.infamy ?? 0) + patrolInfamy),
    log: [...state.log, ...patrolLog],
  };
}

      // ── EVENTS ──────────────────────────────────────────────────

      case A.RESOLVE_EVENT: {
      const event = state.activeEvent;
      if (!event) return state;

      // ── Special: navy_patrol event ────────────────────────────────
      if (event.id === "navy_patrol") {
        const choiceIndex = action.choiceIndex;

        // 0 = Allow inspection
        if (choiceIndex === 0) {
          const activeMission = state.activeMission;
          const hasTobacco = (state.hold?.items?.tobacco || 0) > 0;
          const hasSlaves  = (state.hold?.items?.slaves  || 0) > 0;
          const hasRumSmuggle = activeMission?.requiredGood === "rum"
                            && (state.hold?.items?.rum || 0) >= activeMission.requiredQty;
          const hasContraband = hasTobacco || hasSlaves || hasRumSmuggle;

          if (hasContraband) {
            const items = state.hold?.items || {};
            let seizedValue = 0;
            if (hasTobacco) seizedValue += (items.tobacco || 0) * (window.D.RESOURCES.tobacco?.basePrice || 90);
            if (hasSlaves)  seizedValue += (items.slaves  || 0) * (window.D.RESOURCES.slaves?.basePrice  || 220);
            if (hasRumSmuggle) seizedValue += activeMission.requiredQty * (window.D.RESOURCES.rum?.basePrice || 30);
            const fine = Math.round(seizedValue * 0.5 / 25) * 25;
            const goldAfterFine = Math.max(0, state.gold - fine);

            const inspectingFaction = window.D.PORTS[state.currentPort]?.faction || null;
            let newRep = { ...state.reputation };
            if (inspectingFaction) {
              Object.keys(window.D.PORTS).forEach(portKey => {
                if (window.D.PORTS[portKey].faction === inspectingFaction) {
                  newRep[portKey] = Math.max(0, (newRep[portKey] ?? 50) - 5);
                }
              });
            }

            const newHoldItems = L.applyLoseContraband(state.hold?.items || {});
            const newInfamy = Math.min(999, (state.infamy ?? 0) + 1);
            const newMorale = Math.max(0, state.crew.morale - 10);

            return {
              ...state,
              activeEvent: null,
              screen: (state.destination && state.sailingDaysLeft > 0) ? "sailing" : "port",
              gold: goldAfterFine,
              hold: { ...state.hold, items: newHoldItems },
              infamy: newInfamy,
              reputation: newRep,
              crew: { ...state.crew, morale: newMorale },
              log: [
                ...state.log,
                "The patrol found contraband. All illegal goods seized.",
                `Fine levied: ${fine}g.`,
                "+1 infamy — your name is in their ledger now.",
                "The crew's morale drops. They know this will bring more trouble."
              ]
            };
          }

          // Clean hold
          return {
            ...state,
            activeEvent: null,
            screen: (state.destination && state.sailingDaysLeft > 0) ? "sailing" : "port",
            log: [...state.log, "The patrol found nothing. You are waved through."]
          };
        }

        // 1 = Refuse inspection → combat
        if (choiceIndex === 1) {
          const enemy = {
            name: "Navy Patrol",
            faction: "english",
            hull: 100,
            cannons: 12,
            crew: 35,
            gold: 300,
          };
          const encounterContext = L.buildEncounterContext(state, "navy_patrol_combat", enemy);
          encounterContext.isNavyPatrol = true;
          return {
            ...state,
            activeEvent: null,
            encounterContext,
            screen: "intercept",
            log: [...state.log, "You refuse the inspection. The patrol moves to engage!"]
          };
        }

        // fallback (shouldn't happen)
        return {
          ...state,
          activeEvent: null,
          screen: (state.destination && state.sailingDaysLeft > 0) ? "sailing" : "port"
        };
      }

      // ── All other events ───────────────────────────────────────────
      const choice = event.choices[action.choiceIndex];
      const newState = { ...state, activeEvent: null };

      if (choice.outcome.log) newState.log = [...state.log, choice.outcome.log];
      if (choice.outcome.gold) newState.gold = Math.max(0, state.gold + choice.outcome.gold);
      if (choice.outcome.fame) newState.fame += choice.outcome.fame;
      if (choice.outcome.hullDamage) newState.ship = { ...state.ship, hull: Math.max(0, state.ship.hull - choice.outcome.hullDamage) };
      if (choice.outcome.crewLoss) {
        const lost = choice.outcome.crewLoss;
        const { newRoster, removed } = L.removeRandomCrew(state.crew.roster, lost);
        newState.crew = { ...state.crew, roster: newRoster };
        const names = removed.map(m => `${m.firstName} ${m.lastName}`).join(", ");
        newState.log = [...(newState.log || state.log), `Lost ${lost} crew: ${names}.`];
      }
      if (choice.outcome.loseCargoPercent) {
        const newHoldItems = L.applyLoseCargoPercent(state.hold?.items || {}, choice.outcome.loseCargoPercent);
        newState.hold = { ...state.hold, items: newHoldItems };
        newState.log = [...(newState.log || state.log), `${choice.outcome.loseCargoPercent}% of your cargo was lost.`];
      }
      if (choice.outcome.daysLost) {
        const lost = choice.outcome.daysLost;
        newState.day += lost;
        newState.sailingDaysTotal = (state.sailingDaysTotal || 0) + lost;
        newState.sailingDaysLeft = (state.sailingDaysLeft || 0) + lost;
        newState.gold = Math.max(0, newState.gold - L.payCrewWages(state) * lost);
        let rep = { ...state.reputation };
        for (let i = 0; i < lost; i++) rep = L.decayReputation({ reputation: rep });
        newState.reputation = rep;
      }
      if (choice.outcome.repImpact) newState.reputation = L.applyReputationImpact(state, choice.outcome.repImpact);
      if (choice.outcome.moraleBonus) newState.crew = { ...newState.crew, morale: Math.max(0, Math.min(100, (newState.crew.morale || state.crew.morale) + choice.outcome.moraleBonus)) };
      if (choice.outcome.battle) {
        newState.encounterContext = L.buildEncounterContext(state, "patrol", choice.outcome.battle.enemy);
        newState.screen = "intercept";
      } else {
        newState.screen = (state.destination && state.sailingDaysLeft > 0) ? "sailing" : "port";
      }

      // --- Map fragment discovery ---
    if (choice.outcome.mapFragment) {
      const fragment = choice.outcome.mapFragment;
      const alreadyHave = (newState.mapFragments || state.mapFragments).includes(fragment);
      if (!alreadyHave) {
        newState.mapFragments = [...(newState.mapFragments || state.mapFragments), fragment];
        // Check if this fragment unlocks any hidden port
        Object.entries(PORTS).forEach(([portKey, port]) => {
          if (!port.hidden) return;
          if ((newState.discoveredPorts || []).includes(portKey)) return;
          const cond = port.unlockCondition?.conditions || [];
          const itemCond = cond.find(c => c.type === "item" && c.value === fragment);
          if (itemCond) {
            newState.discoveredPorts = [...(newState.discoveredPorts || []), portKey];
            newState.log = [...(newState.log || []), `⚓ New port discovered: ${port.name}. The chart reveals everything.`];
          }
        });
      }
    }



      return newState;
    }

      // --- SAVE/LOAD ---
      case A.SAVE_GAME: { localStorage.setItem("piratesSave", JSON.stringify(state)); return { ...state, log: [...state.log, "Game saved."] }; }
      case A.LOAD_GAME: {
        try {
          const raw = localStorage.getItem("piratesSave");
          if (!raw) return { ...state, log: [...state.log, "No saved game found."] };
          const parsed = JSON.parse(raw);
          const loaded = migrateState(parsed);                // ← migrate first
          const currentPort = loaded.currentPort || "portRoyal";
          return {
            ...loaded,
            screen: "port",
            battleState: null,
            activeEvent: null,
            encounterContext: null,
            portMarket: G.generatePortMarket(currentPort),
            missions: G.generateMissions(currentPort, loaded),
          };
        } catch (e) {
          return { ...state, log: [...state.log, "Failed to load save — corrupted data."] };
        }
      }

      // ── Debug actions (dev tooling only) ─────────────────────────────
      case A.DEBUG_ADD_GOLD:
        return { ...state, gold: state.gold + action.amount };

      case A.DEBUG_SET_FAME:
        return { ...state, fame: action.fame };

      case A.DEBUG_SET_INFAMY:
        return { ...state, infamy: action.infamy };

      case A.DEBUG_SET_SHIP: {
        const s = SHIPS[action.shipType];
        if (!s) return state;
        return { ...state,
          ship: { type: action.shipType, name: s.name,
                  hull: s.maxHull, cannons: s.cannons, upgrades: [] },
          hold: { ...state.hold, capacity: s.holdCapacity },
          crew: { ...state.crew, max: s.maxCrew },
        };
      }

      case A.DEBUG_SET_PORT_REP: {
        return { ...state,
          reputation: { ...state.reputation, [action.port]: action.amount }
        };
      }

      case A.DEBUG_FILL_HOLD:
        return { ...state, hold: { ...state.hold, items: {
          food: 20, water: 20, rum: 10, sugar: 8, spices: 4,
          silk: 3, cloth: 6, weapons: 5, coffee: 5, cocoa: 4,
          timber: 0, tobacco: 3, silver: 2, slaves: 0,
        }}};

      case A.DEBUG_REPAIR: {
        const stats = L.getShipStats(state);
        return { ...state,
          ship: { ...state.ship, hull: stats.maxHull },
          hold: { ...state.hold, items: {
            ...state.hold.items,
            food: Math.ceil(state.crew.roster.length / 10) * 10,
            water: Math.ceil(state.crew.roster.length / 10) * 10,
          }},
        };
      }



      default: return state;
    }
  };
  return { A, initialState, reducer, migrateState  };
})();