// engine.js – Named Crew Roster (P1.5.1) + Intercept + Assault Priority + Wind + DaysLost
window.E = (() => {
  const { PORTS, SHIPS, FACTIONS, UPGRADES, STARTS,  SURRENDER_CONSEQUENCE  } = window.D;
  const L = window.L;
  const D = window.D;

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
    TAKE_PLUNDER: "TAKE_PLUNDER",
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
    PATROL_INSPECT: "PATROL_INSPECT",
  };

//--------------------------------------------
//  HELPERS
//----------------------------------------------


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




 const createBattleState = (state, enemy, initialLog = "You engage the enemy!", encounterType = "unknown") => ({
  phase:            "player_turn",
  playerHull:       state.ship.hull,
  playerCrew:       state.crew.roster.length,
  enemy,
  enemyHull:        enemy.hull,
  enemyCrew:        enemy.crew,
  round:            1,
  log:              [initialLog],
  returnScreen:     L.returnScreen(state),
  initialCrewCount: state.crew.roster.length,
  lostCrewNames:    [],
  encounterType,    // ← keeps the refactored field
});

const checkServicesBlocked = (state) => {
  const repPerk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
  if (repPerk.servicesBlocked) {
    return { ...state, log: [...state.log, "You are at war with this port. No services available."] };
  }
  return null;
};

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

const maybeRandomEvent = (state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems) => {
  if (newDays < 1 || Math.random() >= 0.1) return null;
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

const maybeRandomPatrol = (state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems) => {
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


// ------- TRADE HELPER --------

const validateTrade = (state, buys, sells) => {
  if (!state.portMarket) return { valid: false, reason: "No market available." };

  const items = { ...(state.hold?.items || {}) };
  let goldDelta = 0;
  let used = Object.values(items).reduce((sum, qty) => sum + qty, 0);

  // Process sells
  for (const [good, qty] of Object.entries(sells || {})) {
    if (qty <= 0) continue;
    const portGood = state.portMarket.goods[good];
    if (!portGood) continue;
    const actualQty = Math.min(qty, items[good] || 0);
    if (actualQty <= 0) continue;
    used -= actualQty;
    goldDelta += actualQty * portGood.sellToPort;
  }

  // Process buys
  for (const [good, qty] of Object.entries(buys || {})) {
    if (qty <= 0) continue;
    const portGood = state.portMarket.goods[good];
    if (!portGood) continue;
    if (qty > portGood.available) continue;
    used += qty;
    goldDelta -= qty * portGood.buyFromPort;
  }

  if (state.gold + goldDelta < 0) return { valid: false, reason: "Trade cancelled — insufficient gold." };
  if (used > state.hold.capacity) return { valid: false, reason: "Trade cancelled — not enough hold space." };
  return { valid: true };
};

//---------------------------------------------------------------------------------
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
  const patrolResult = maybeRandomPatrol(state, newDays, newWind, newGold, newRep, newMorale, newCrew.roster, prov.items);
  if (patrolResult) return patrolResult;

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
        if (!state.destination) {
          return {
            ...state,
            screen: "port",
            log: [...state.log, "You return to port."]
          };
        }
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
  const blocked = checkServicesBlocked(state);
  if (blocked) return blocked;

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
  const blocked = checkServicesBlocked(state);
  if (blocked) return blocked;

  const ship = SHIPS[action.shipType];
  const req = L.meetsRequirement(state, ship);
  if (!req.allowed) return { ...state, log: [...state.log, `Cannot purchase: ${req.reason}.`] };
  if (!ship || state.gold < ship.cost) return { ...state };
  let newRoster = state.crew.roster;
  if (ship.maxCrew < newRoster.length) newRoster = newRoster.slice(0, ship.maxCrew);
  return { ...state, gold: state.gold - ship.cost, ship: { type: action.shipType, name: ship.name, hull: ship.maxHull, cannons: ship.cannons, upgrades: [] }, crew: { ...state.crew, roster: newRoster, max: ship.maxCrew }, hold: {...state.hold, capacity: ship.holdCapacity,}, log: [...state.log, `Purchased ${ship.name} for ${ship.cost}g.`] };
}

case A.BUY_UPGRADE: {
  const blocked = checkServicesBlocked(state);
  if (blocked) return blocked;

  const upgrade = D.UPGRADES[action.upgradeKey];   // ← this line was missing, causing the earlier bug
  if (!upgrade) return state;

  const req = L.meetsRequirement(state, upgrade);
  if (!req.allowed) return { ...state, log: [...state.log, `Cannot install: ${req.reason}.`] };
  if (state.gold < upgrade.cost || state.ship.upgrades.includes(action.upgradeKey) || !SHIPS[state.ship.type].upgradeable.includes(action.upgradeKey)) return { ...state };
  return { ...state, gold: state.gold - upgrade.cost, ship: { ...state.ship, upgrades: [...state.ship.upgrades, action.upgradeKey] }, log: [...state.log, `Installed ${upgrade.name} for ${upgrade.cost}g.`] };
}

case A.HIRE_CREW: {
  const blocked = checkServicesBlocked(state);
  if (blocked) return blocked;

  const cost = action.count * 50;
  if (state.crew.roster.length >= state.crew.max || state.gold < cost) return { ...state };
  const portFaction = PORTS[state.currentPort]?.faction || "pirate";
  const newMembers = G.generateRoster(action.count, portFaction);
  return { ...state, gold: state.gold - cost, crew: { ...state.crew, roster: [...state.crew.roster, ...newMembers] }, log: [...state.log, `Hired ${action.count} crew for ${cost}g.`] };
}

case A.RAISE_MORALE: {
  const blocked = checkServicesBlocked(state);
  if (blocked) return blocked;

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

  // Holistic validation (exact same rules as before)
  const validation = validateTrade(state, buys, sells);
  if (!validation.valid) {
    return { ...state, log: [...state.log, validation.reason] };
  }

  // Execute trade
  const items = { ...(state.hold?.items || {}) };
  let goldDelta = 0;
  let infamyDelta = 0;
  const logLines = [];

 // Mutable copy of port market goods — we'll update stock levels
  const marketGoods = { ...state.portMarket.goods };


  // Sells
  Object.entries(sells || {}).forEach(([good, qty]) => {
    if (qty <= 0) return;
    const portGood = state.portMarket.goods[good];
    if (!portGood) return;
    const actualQty = Math.min(qty, items[good] || 0);
    if (actualQty <= 0) return;
    const revenue = actualQty * portGood.sellToPort;
    items[good] = (items[good] || 0) - actualQty;
    goldDelta += revenue;
    if (marketGoods[good]) marketGoods[good] = { ...marketGoods[good], available: (marketGoods[good].available || 0) + actualQty };
    logLines.push(`Sold ${actualQty} ${window.D.RESOURCES[good]?.unit || good} of ${window.D.RESOURCES[good]?.name || good} for ${revenue}g.`);
  });

  // Buys
  const buyEntries = Object.entries(buys || {}).filter(([_, qty]) => qty > 0);
  for (const [good, qty] of buyEntries) {
    const portGood = state.portMarket.goods[good];
    if (!portGood) { logLines.push(`${good} is not available at this port.`); continue; }
    if (qty > portGood.available) { logLines.push(`Not enough ${good} available.`); continue; }
    const cost = qty * portGood.buyFromPort;
    items[good] = (items[good] || 0) + qty;
    goldDelta -= cost;
    marketGoods[good] = { ...portGood, available: portGood.available - qty };
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
    portMarket: { ...state.portMarket, goods: marketGoods },
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
  const bs = createBattleState(state, ctx.enemy, `You engage the ${ctx.enemy.name}!`, ctx.encounterType);
  return { ...state, encounterContext: null, battleState: bs, screen: "battle" };
}

case A.INTERCEPT_FLEE: {
  const ctx = state.encounterContext;
  if (!ctx) return state;
  const fleeOpt = ctx.options.find(o => o.id === "flee");
  const { player, enemy } = fleeOpt.speedCheck;
  const playerRoll = player + L.roll(6);
  const enemyRoll  = enemy  + L.roll(6);
  if (playerRoll >= enemyRoll) {
    return { ...state, encounterContext: null, screen: L.returnScreen(state), log: [...state.log, "You pulled clear — the enemy couldn't keep up."] };
  }
  // Failed flee → battle
  const enemyObj = ctx.enemy;
  const bs = createBattleState(state, enemyObj, "Escape failed! The enemy closes in.", ctx.encounterType);
  return { ...state, encounterContext: null, battleState: bs, screen: "battle", log: [...state.log, "Failed to escape — battle unavoidable."] };
}

case A.INTERCEPT_PARLEY: {
  const ctx = state.encounterContext;
  if (!ctx) return state;
  const rep = state.reputation[state.destination ?? state.currentPort] ?? 20;
  const success = L.roll(100) <= Math.min(80, rep + 20);
  if (success) {
    const portKey = state.destination ?? state.currentPort;
    return { ...state, encounterContext: null, screen: L.returnScreen(state), reputation: { ...state.reputation, [portKey]: Math.min(100, (state.reputation[portKey] ?? 20) + 3) }, log: [...state.log, "Parley successful. They let you pass."] };
  }
  // Failed parley → battle
  const enemyObj = ctx.enemy;
  const bs = createBattleState(state, enemyObj, "Parley failed — they attack!", ctx.encounterType);
  return { ...state, encounterContext: null, battleState: bs, screen: "battle", log: [...state.log, "Parley failed. Battle unavoidable."] };
}

 case A.INTERCEPT_BRIBE: {
  const ctx = state.encounterContext;
  if (!ctx) return state;
  const bribeOpt = ctx.options.find(o => o.id === "bribe");
  const cost = bribeOpt.cost;
  const portKey = state.destination ?? state.currentPort;
  return { ...state, encounterContext: null, gold: state.gold - cost, reputation: { ...state.reputation, [portKey]: Math.max(0, (state.reputation[portKey] ?? 20) - 2) }, screen: L.returnScreen(state), log: [...state.log, `Bribed them with ${cost}g. They looked the other way.`] };
}

   case A.INTERCEPT_SURRENDER: {
  const ctx = state.encounterContext;
  if (!ctx) return state;
  const consequence = SURRENDER_CONSEQUENCE[ctx.type] ?? SURRENDER_CONSEQUENCE.random;

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
  s.screen = L.returnScreen(state);
  s.log = [...state.log, "You surrendered. The consequences were steep.", ...logExtra];

  return s;
}

// ---  PATROL INSPECTION -------

case A.PATROL_INSPECT: {
  const activeMission = state.activeMission;
  const items = state.hold?.items || {};

  const hasTobacco   = (items.tobacco || 0) > 0;
  const hasSlaves    = (items.slaves  || 0) > 0;
  const hasRumSmuggle = activeMission?.requiredGood === "rum"
    && (items.rum || 0) >= (activeMission?.requiredQty || 0);
  const hasContraband = hasTobacco || hasSlaves || hasRumSmuggle;

  if (!hasContraband) {
    return {
      ...state,
      encounterContext: null,
      screen: L.returnScreen(state),
      log: [...state.log, "The patrol found nothing. You are waved through."],
    };
  }

  let seizedValue = 0;
  if (hasTobacco) seizedValue += (items.tobacco || 0) * (D.RESOURCES.tobacco?.basePrice || 90);
  if (hasSlaves)  seizedValue += (items.slaves  || 0) * (D.RESOURCES.slaves?.basePrice  || 220);
  if (hasRumSmuggle) seizedValue += (activeMission.requiredQty || 0) * (D.RESOURCES.rum?.basePrice || 30);

  const fine = Math.round(seizedValue * (D.PATROL_FINE_RATE || 0.50) / 25) * 25;
  const newHoldItems = L.applyLoseContraband(items);

  const inspectingFaction = PORTS[state.destination ?? state.currentPort]?.faction || null;
  let newRep = { ...state.reputation };
  if (inspectingFaction) {
    Object.keys(PORTS).forEach(portKey => {
      if (PORTS[portKey].faction === inspectingFaction) {
        newRep[portKey] = Math.max(0, (newRep[portKey] ?? 50) - 5);
      }
    });
  }

  return {
    ...state,
    encounterContext: null,
    screen: L.returnScreen(state),
    gold:       Math.max(0, state.gold - fine),
    hold:       { ...state.hold, items: newHoldItems },
    infamy:     Math.min(999, (state.infamy ?? 0) + 2),
    reputation: newRep,
    crew:       { ...state.crew, morale: Math.max(0, state.crew.morale - 10) },
    log: [
      ...state.log,
      "The patrol found contraband. All illegal goods seized.",
      `Fine levied: ${fine}g.`,
      "+2 infamy — your name is in their ledger now.",
      "The crew's morale drops.",
    ],
  };
}

      // ── COMBAT ──────────────────────────────────────────────────

      case A.BATTLE_ACTION: {
        const outcome = L.resolveCombatAction(state, action.action);
        const newLog = [...state.battleState.log];
        const newMorale = Math.max(0, Math.min(100, state.crew.morale + (outcome.moraleDelta || 0)));

        if (outcome.instantVictory) {
  const newRep = L.applyReputationImpact(state, { [state.battleState.enemy.faction]: -5 });
  const initialCrew = state.battleState.initialCrewCount ?? state.crew.roster.length;
  const lostCrewNames = state.battleState.lostCrewNames ?? [];
  const totalLost = initialCrew - state.crew.roster.length;
  let capMsg = "Victory! Boarding successful.";
  if (totalLost > 0) {
    const some = lostCrewNames.slice(0, 3).join(", ");
    capMsg += ` Lost ${totalLost} crew, including ${some}.`;
  }

  const newBS = {
    ...state.battleState,
    phase: "victory",
    goldReward: outcome.goldReward || 0,
    enemyCargo: outcome.enemyCargo || {},
    canPlunder: true,
    log: [...newLog, `Player: ${action.action}. Boarding successful!`]
  };

  return {
    ...state,
    reputation: newRep,
    ship: { ...state.ship, hull: state.battleState.playerHull },
    crew: { ...state.crew, morale: newMorale },
    battleState: newBS,
    log: [...state.log, capMsg]
  };
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
const isNavyFight = battleState.encounterType === "navy_patrol"
                 || battleState.encounterType === "navy_patrol_combat";
const patrolInfamy = isNavyFight ? 2 : 0;
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

  // Plunder redirect
  if (battleState.canPlunder && battleState.phase === "victory") {
    return {
      ...state,
      battleState: { ...state.battleState, phase: "victory" }, // keep plunder data
      screen: "plunder",
    };
  }

  // Fleeing from a combat mission = mission failed
if (battleState.phase === "fled" && battleState.encounterType === "mission_combat") {
  return {
    ...state,
    battleState: null,
    activeMission: null,
    screen: "port",
    log: [...state.log, "You fled the battle. The mission is a failure."],
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

case A.TAKE_PLUNDER: {
  const bs = state.battleState;
  if (!bs || !bs.canPlunder) return state;

  const goldReward = bs.goldReward || 0;
  const finalHoldItems = action.holdItems;   // the new hold.items after plunder

  const newGold = state.gold + goldReward;
  const logLines = [`Plundered the ${bs.enemy.name}. +${goldReward}g.`];

  return {
    ...state,
    gold: newGold,
    hold: { ...state.hold, items: finalHoldItems },
    battleState: null,
    screen: bs.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0
      ? "sailing" : "port",
    log: [...state.log, ...logLines],
  };
}

      // ── EVENTS ──────────────────────────────────────────────────

      case A.RESOLVE_EVENT: {
      const event = state.activeEvent;
      if (!event) return state; 

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
        const encounterType = event.id === "navy_patrol" ? "navy_patrol_combat" : "patrol";
        const patrolFaction = PORTS[state.destination]?.faction || "english";
        const patrolEnemy = {
          ...choice.outcome.battle.enemy,
          faction: patrolFaction,
          name: `${FACTIONS[patrolFaction]?.label || "Colonial"} Patrol`,
        };
        newState.encounterContext = L.buildEncounterContext(state, encounterType, patrolEnemy);
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

    // outcome.action: dispatch a further action instead of resolving inline
    if (choice.outcome.action) {
      if (choice.outcome.log && !newState.log.includes(choice.outcome.log)) {
        newState.log = [...newState.log, choice.outcome.log];
      }
      return reducer(
        { ...newState, activeEvent: null },
        { type: choice.outcome.action }
      );
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