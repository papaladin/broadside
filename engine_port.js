// @ts-check
// engine_port.js – Port Domain (Market, Missions, Crew, Shipyard, Repairs, Start/Load)
// Registers its reducer into window.E._reducers.

(() => {
  const { A, autoSave, buildEncounterSession } = window.E;
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT, STARTS } = window.D;
  const D = window.D;   // for convenience
  const L = window.L;
  const G = window.G;

  // ── Port‑specific helpers ─────────────────────────────────────
    const checkServicesBlocked = (state) => {
    const portFaction = PORTS[state.currentPort]?.faction;
    const rep = portFaction ? L.getFactionReputation(state, portFaction, 0) : 0;
    const repPerk = L.getRepPerk(rep);
    if (repPerk.servicesBlocked) {
      return { ...state, log: [...state.log, "You are at war with this port. No services available."] };
    }
    return null;
  };

  const validateTrade = (state, buys, sells) => {
    if (!state.portMarket) return { valid: false, reason: "No market available." };

    const items = { ...(state.hold?.items || {}) };
    let goldDelta = 0;
    let used = Object.values(items).reduce((sum, qty) => sum + qty, 0);
    // Sells
    for (const [good, qty] of Object.entries(sells || {})) {
      if (qty <= 0) continue;
      const portGood = state.portMarket.goods[good];
      if (!portGood) continue;
      const actualQty = Math.min(qty, items[good] || 0);
      if (actualQty <= 0) continue;
      used -= actualQty;
      goldDelta += actualQty * portGood.sellToPort;
    }
    // Buys
    for (const [good, qty] of Object.entries(buys || {})) {
      if (qty <= 0) continue;
      const portGood = state.portMarket.goods[good];
      if (!portGood) continue;
      if (qty > portGood.available) continue;
      used += qty;
      goldDelta -= qty * portGood.buyFromPort;
    }
    if (state.gold + goldDelta < 0) return { valid: false, reason: "Trade cancelled. Insufficient gold." };
    if (used > L.getHoldCapacity(state)) return { valid: false, reason: "Trade cancelled. Not enough hold space." };
    return { valid: true };
  };

  // mission completion effects helper :

const applyMissionEffects = (state, mission) => {

  // ── Goods value (trade / smuggle only) ─────────────────────────────
  let goodsValue = 0;
  if (mission.type === "trade" || mission.type === "smuggle") {
    const good = mission.requiredGood;
    const qty = mission.requiredQty;
    const sellPrice = state.portMarket?.goods?.[good]?.sellToPort || 0;
    goodsValue = sellPrice * qty;
  }

  // ── Reputation impact ─────────────────────────────────────────────
  const repImpact = { ...mission.repImpact };
  const repBonus = L.getEquipmentEffect(state, "repGainBonus") || 0;
  if (repBonus > 0) {
    for (const faction in repImpact) {
      if (repImpact[faction] > 0) repImpact[faction] += repBonus;
    }
  }
  const newRep = L.applyReputationImpact(state, repImpact);

  // ── Infamy ────────────────────────────────────────────────────────
  const infamyGain = mission.infamyGain || 0;
  const oldInfamy = state.infamy ?? 0;
  const newInfamy = Math.min(999, oldInfamy + infamyGain);
  const crossedThreshold = L.getInfamyLabel(newInfamy) !== L.getInfamyLabel(oldInfamy);

  // ── Morale ────────────────────────────────────────────────────────
  const alignment = L.getAlignmentModifier(state, mission.faction);
  const moraleGain = Math.round(3 * alignment);
  const newMorale = Math.min(100, state.crew.morale + moraleGain);

  // ── Fame ──────────────────────────────────────────────────────────
  let finalFame = mission.fame || 0;
  const isWarPennantMission = (
    (mission.type === "combat" || mission.type === "patrol" || mission.type === "assault")
    && !mission.starter
  );
  if (isWarPennantMission) {
    finalFame += L.getEquipmentEffect(state, "missionCombatFameBonus");
  }

  // ── Log lines (without gold amounts) ─────────────────────────────
  const logLines = [];
  if (infamyGain > 0) logLines.push(`+${infamyGain} infamy.`);
  if (crossedThreshold) logLines.push(`Your name grows darker. You are now ${L.getInfamyLabel(newInfamy)}.`);

  return {
    goodsValue,
    finalFame,
    newInfamy,
    newRep,
    newMorale,
    logLines,
  };
};


  //----------------------------------------------------------------------------------------------

  // ── Reducer ────────────────────────────────────────────────────
  window.E._reducers.push((state, action) => {
    switch (action.type) {

      // --- START GAME ---
case A.START_GAME: {
  const { captainName, faction, tutorialMode } = action;
  const start = STARTS;

  // Validate faction
  const startPort = start.factionPorts?.[faction];
  if (!startPort) return { ...window.E.initialState, screen: "title" };

  // ── Deep‑clone the entire initial state ─────────────────────
  const newState = JSON.parse(JSON.stringify(window.E.initialState));

  // ── Overwrite fields that differ from the default ───────────
  newState.screen = "port";
  newState.day = 1;
  newState.captainName = captainName || "Captain";
  newState.faction = faction;
  newState.gold = start.gold;
  newState.startDate = start.startDate;
  newState.currentPort = startPort;
  newState.portMarket = null;
  newState.log = [
    ...(start.factionBackstory?.[faction]?.openingLog || []),
  ];
  newState.tutorialMode = tutorialMode || "full";          // store the choice
  newState.onboarding.enabled = tutorialMode === "full";
  newState.onboarding.completed = tutorialMode !== "full";

  // ── Ship ────────────────────────────────────────────────────
  const shipData = SHIPS[start.ship];
  newState.ship = {
    type: start.ship,
    name: newState.ship.name || shipData.name,
    hull: shipData.maxHull,
    cannons: shipData.cannons,
    equipment: { hull: [], armament: [], rigging: [], special: []},
  };

  // ── Hold ────────────────────────────────────────────────────
  newState.hold = {
    items: {
      food: 0, water: 0, rum: 0, sugar: 0, timber: 0, cloth: 0,
      spices: 0, silk: 0, coffee: 0, cocoa: 0, weapons: 0,
      tobacco: 0, silver: 0, slaves: 0,
      ...(start.hold || {}),
    },
  };

  // ── Reputation ──────────────────────────────────────────────
  const rep = { english: 50, spanish: 50, french: 50, dutch: 50, pirate: 50 };
  const repAdj = start.factionRepAdjust?.[faction] || {};
  Object.entries(repAdj).forEach(([adjFaction, delta]) => {
    if (adjFaction in rep) {
      rep[adjFaction] = Math.max(0, Math.min(100, 50 + delta));
    }
  });
  newState.reputation = rep;

  // ── Crew ────────────────────────────────────────────────────
  newState.crew = {
    ...newState.crew,
    max: shipData.maxCrew,
    roster: [],
    morale: 80,
  };

  // Inject Quartermaster if onboarding is enabled (non‑mutating)
  if (tutorialMode === "full") {
    const qmData = start.factionQM?.[faction];
    if (qmData) {
      newState.crew.roster = [
        ...newState.crew.roster,
        {
          id: "qm_tutorial",
          firstName: qmData.firstName,
          lastName: qmData.lastName,
          bio: qmData.bio || "",
          role: "quartermaster",
          faction: faction,
          daysAboard: 0,
          tags: ["quartermaster", "protected"],
        },
      ];
    }
  }

  // ── Tutorial delivery mission (auto‑accept) ────────────────
  if (tutorialMode === "full") {
    const tutorialMission = D.TUTORIAL_DELIVERY?.[faction];
    if (tutorialMission) {
      newState.missions = [...newState.missions, tutorialMission];
      newState.activeMission = { ...tutorialMission, encounterOccurred: false };
      newState.log.push(`Accepted opening quest: ${tutorialMission.name}.`);
       // Set onboarding steps directly (state is already a deep clone)
    newState.onboarding.stepsCompleted.contractsOpened = true;
    newState.onboarding.stepsCompleted.firstContractAccepted = true;
    }
  }

  // ── Market, gossip, missions ───────────────────────────────
  newState.portMarket = G.generatePortMarket(startPort, newState);
  newState.portGossip = G.generatePortGossip(newState, startPort);
  newState.missions = G.generateMissions(startPort, newState);

  return newState;
}

      // --- NAVIGATION ---
    case A.NAVIGATE: {
  let nextState = { ...state, screen: action.screen };

  // If navigating to plunder screen from a battle victory with canPlunder, transition phase
  if (action.screen === "plunder" &&
      state.encounterSession &&
      state.encounterSession.phase === "battle" &&
      state.encounterSession.battle?.canPlunder) {
    nextState.encounterSession = {
      ...state.encounterSession,
      phase: "plunder",
      // Keep battle as-is; PlunderScreen reads from battle.goldReward/enemyCargo
    };
  }

  return nextState;
}

      // --- SAIL_TO ---
    case A.SAIL_TO: {
        const isDinghy = state.ship.type === "dinghy";
        const minCrew = L.getMinViableCrew(state.ship.type);

        if (state.ship.hull === 0) {
          return { ...state, log: [...state.log,
            window.E.logEntry(state, "The ship cannot sail — the hull is destroyed.")] };
        }
        if (!isDinghy && state.crew.roster.length < minCrew) {
          return { ...state, log: [...state.log,
            window.E.logEntry(state, `You need at least ${minCrew} crew to sail this ship.`)] };
        }
      const destPort = PORTS[action.port];
      if (!destPort) return state;

      // ── Reroute from sea ──────────────────────────────────────
      if (state.route && state.route.totalDays > 0 && state.sailingDaysLeft > 0) {
        // Same destination = cancel / no‑op
        if (action.port === state.route.destinationPort) return state;

        const seaPos = L.getSeaPosition(state.route);
        const remainingEndurance = state.route.enduranceBudget - state.route.enduranceSpent;
        if (!L.canReachFromPosition(seaPos, action.port, state, remainingEndurance)) {
          return {
            ...state,
            log: [...state.log, `Cannot reach ${destPort.name} from current position under present conditions.`],
          };
        }

        const newDays = L.travelDaysFromPosition(seaPos, action.port, state);
        const sailMsg = L.logPick(D.SAILING_MESSAGES, state, destPort.name);

        return {
          ...state,
          destination: action.port,
          sailingDaysLeft: newDays,
          sailingDaysTotal: newDays,
          screen: "sailing",
          inquisitorUsedThisVisit: false,
          portGossip: [],
          completedCombatThisVisit: false,
          log: [...state.log, `${sailMsg} ${newDays} day${newDays !== 1 ? "s" : ""} voyage.`],
          route: {
            ...state.route,
            destinationPort: action.port,
            destinationPos: { x: destPort.x, y: destPort.y },
            progressDays: 0,
            totalDays: newDays,
            seaPosition: seaPos,
          },
        };
      }

      // ── Normal port departure ─────────────────────────────────
      const days = L.travelDays(state.currentPort, action.port, state);
      const originPort = PORTS[state.currentPort];
      const shipStats = L.getShipStats(state);
      const sailMsg = L.logPick(D.SAILING_MESSAGES, state, destPort.name);

      return {
        ...state,
        previousPort: state.currentPort,
        destination: action.port,
        sailingDaysLeft: days,
        sailingDaysTotal: days,
        screen: "sailing",
        inquisitorUsedThisVisit: false,
        portGossip: [],
        completedCombatThisVisit: false,
        log: [...state.log, `${sailMsg} ${days} day${days !== 1 ? "s" : ""} voyage.`],
        route: {
          originPort: state.currentPort,
          destinationPort: action.port,
          originPos: { x: originPort.x, y: originPort.y },
          destinationPos: { x: destPort.x, y: destPort.y },
          progressDays: 0,
          totalDays: days,
          seaPosition: { x: originPort.x, y: originPort.y },
          enduranceBudget: shipStats.maxDays,
          enduranceSpent: 0,
        },
      };
    }

// ------------ ENTER PORT ------------------------------
case A.ENTER_PORT: {
  if (!state.destination) {
    return { ...state, screen: "port", log: [...state.log, "You return to port."] };
  }
  const port = PORTS[state.destination];
  const portFaction = port.faction;
  const destinationFaction = PORTS[state.destination]?.faction;
  const playerRep = destinationFaction ? L.getFactionReputation(state, destinationFaction) : 50;
  let combatEncounter = null;

  if (state.activeMission?.type === "assault" && state.activeMission.targetPort === state.destination) {
    const mission = state.activeMission;
    if (mission.enemy) combatEncounter = { type: "hostile_port_entry", enemy: mission.enemy };
    else combatEncounter = { type: "hostile_port_entry", enemy: { name: `${port.name} Garrison`, hull: 200, cannons: 20, crew: 50, faction: portFaction, gold: 500 } };
  }
  else if (playerRep < 10) {
    combatEncounter = { type: "hostile_port_entry", enemy: { name: `${port.name} Guards`, hull: 150, cannons: 15, crew: 40, faction: portFaction, gold: 300 } };
  }

  if (combatEncounter) {
    const encounterContext = L.buildEncounterContext(state, combatEncounter.type, combatEncounter.enemy, { kind: "port", id: state.destination });
    const logMsg = state.activeMission?.type === "assault"
      ? `Arrived at ${port.name}. The garrison is on high alert!`
      : `Arrived at ${port.name}. Hostile port!`;
    // ── B1.4 batch: use encounterSession instead of encounterContext ──
    return {
      ...state,
      currentPort: state.destination,
      destination: null,
      sailingDaysLeft: 0,
      encounterSession: buildEncounterSession(state, encounterContext),
      screen: "intercept",
      portMarket: G.generatePortMarket(state.destination, state),
      log: [...state.log, window.E.logEntry(state, logMsg)]
    };
  }

  let nextState = {
    ...state,
    currentPort: state.destination,
    destination: null,
    sailingDaysLeft: 0,
    screen: "port",
    missions: G.generateMissions(state.destination, state),
    portMarket: G.generatePortMarket(state.destination, state),
    log: [...state.log, window.E.logEntry(state, L.logPick(D.ARRIVAL_MESSAGES, state, port.name))]
  };

  // Run post‑arrival logic
  const desertionResult = L.processDesertion(
    nextState.crew.roster,
    nextState.crew.morale,
    nextState.currentPort,
    state
  );
  nextState.crew = { ...nextState.crew, roster: desertionResult.roster };
  if (desertionResult.logLines.length > 0) {
    nextState.log = [...nextState.log, ...desertionResult.logLines];
  }

  const traitResult = L.processPositiveTraits(nextState.crew.roster, state);
  nextState.crew = { ...nextState.crew, roster: traitResult.roster };
  if (traitResult.logLines.length > 0) {
    nextState.log = [...nextState.log, ...traitResult.logLines];
  }

  nextState.portGossip = G.generatePortGossip(nextState, nextState.currentPort);

// Inject tutorial hunt mission after player has hired crew
const huntData = D.TUTORIAL_HUNT;
if (
  huntData &&
  nextState.onboarding?.enabled &&
  !nextState.onboarding.completed &&
  nextState.onboarding.stepsCompleted.firstCrewHired &&
  !nextState.onboarding.stepsCompleted.tutorialHuntAccepted
) {
  if (!nextState.missions.some(m => m?.tutorial && !m.requiredGood)) {
    nextState.missions = [huntData, ...nextState.missions];
  }
} 

  //reset hunt/combat flag
  nextState.completedCombatThisVisit = false;
  //reset hunger/thirst counter
  nextState.daysWithoutFood  = 0;
  nextState.daysWithoutWater = 0;
  // reset inquisitor visit
  nextState.inquisitorUsedThisVisit = false;


  // ── Unrecoverable check ──
  const check = L.isUnrecoverable(nextState);
  if (check.unrecoverable) {
    // Skip autosave entirely — preserve whatever save existed before this.
    return { ...nextState, screen: "gameover", gameOverReason: check.reason };
  }


  if (state.autoSave !== false) autoSave(nextState);
  return nextState;
}

// --- PREVIEW PORT MARKET ---
case A.PREVIEW_PORT: {
   const targetPortKey = action.port;
    if (!targetPortKey || !PORTS[targetPortKey]) return state;
      const previewMarket = G.generatePortMarket(targetPortKey, state);
    return {
      ...state,
     previewPortMarket: previewMarket,
  };
}

// --------------------- PORT ACTIONS --------------------------------
      
      case A.BUY_SHIP: {
        const blocked = checkServicesBlocked(state);
        if (blocked) return blocked;
        const ship = SHIPS[action.shipType];
        const earlyAccess = L.isEarlyAccessEligible(state, ship, 'ship');
        const req = L.meetsRequirement(state, ship, earlyAccess);

        if (!req.allowed) {
          return { ...state, log: [...state.log, `Cannot purchase: ${req.reason}.`] };
        }

        if (!ship || state.gold < ship.cost) return { ...state };
        let newRoster = state.crew.roster;
        if (ship.maxCrew < newRoster.length) newRoster = newRoster.slice(0, ship.maxCrew);
        const newShipName = action.shipName || ship.name;
        const purchaseMsg = L.logPick(D.PURCHASE_MESSAGES, state, newShipName, ship.cost);
        return {
          ...state,
          gold: state.gold - ship.cost,
          ship: {
            type: action.shipType,
            name: newShipName,
            hull: ship.maxHull,
            cannons: ship.cannons,
            equipment: { hull: [], armament: [], rigging: [], special: [] },
          },
          crew: { ...state.crew, roster: newRoster, max: ship.maxCrew },
          hold: { ...state.hold },
          log: [...state.log, purchaseMsg],
        };
      }

      case A.REPAIR: {
        const blocked = checkServicesBlocked(state);
        if (blocked) return blocked;
        const shipStats = L.getShipStats(state);
        const portFaction = PORTS[state.currentPort]?.faction;
        const rep = portFaction ? L.getFactionReputation(state, portFaction) : 50;
        const perk = L.getRepPerk(rep);
        const baseCost = L.shipRepairCost(state);
        const eqRepairPct = L.getEquipmentEffect(state, "repairCostPct") || 0;
        const combinedMult = perk.repairMult * (1 + eqRepairPct);
        const cost = Math.floor(baseCost * combinedMult);
        if (state.gold < cost) {
          return {
            ...state,
            log: [...state.log, "Not enough gold to repair."]
          };
        }
        const discountNote =
          perk.repairMult < 1 ? ` (${perk.tier} discount applied)` : "";
        const eqPenaltyNote =
          eqRepairPct > 0
            ? ` (+${Math.round(eqRepairPct * 100)}% equipment penalty)`
            : "";
        const repairMsg = L.logPick(D.REPAIR_MESSAGES, state, cost);

        let s = {
          ...state,
          gold: state.gold - cost,
          ship: { ...state.ship, hull: shipStats.maxHull },
          log: [
            ...state.log,
            `${repairMsg}${discountNote}${eqPenaltyNote}.`
          ]
        };
        return s;
      }

      case A.BUY_EQUIPMENT: {
        const blocked = checkServicesBlocked(state);
        if (blocked) return blocked;
        const item = D.EQUIPMENT[action.equipmentKey];
        if (!item) return { ...state, log: [...state.log, "Unknown equipment."] };
        const earlyAccess = L.isEarlyAccessEligible(state, item, 'equipment');
        const validation = L.canInstallEquipment(state, action.equipmentKey, earlyAccess);

        if (!validation.ok) {
          return { ...state, log: [...state.log, `Cannot install: ${validation.reason}.`] };
        }

        const totalCost = item.cost + item.installFee;
        if (state.gold < totalCost) return { ...state, log: [...state.log, "Not enough gold."] };

        const newShip = {
          ...state.ship,
          equipment: {
            ...state.ship.equipment,
            [item.slot]: [...(state.ship.equipment[item.slot] || []), action.equipmentKey],
          },
        };
        const newStats = L.getShipStats({ ...state, ship: newShip });
        newShip.hull = Math.min(state.ship.hull, newStats.maxHull);

        return {
          ...state,
          gold: state.gold - totalCost,
          ship: newShip,
          log: [...state.log, `Installed ${item.name} for ${totalCost}g.`],
        };
      }

      case A.INSTALL_EQUIPMENT: {
        const blocked = checkServicesBlocked(state);
        if (blocked) return blocked;

        // Only at English Naval Yard
        if (PORTS[state.currentPort]?.faction !== 'english') {
          return {
            ...state,
            log: [...state.log, "Equipment installation is only available at English Naval Yard."]
          };
        }

        // Require English reputation >= 50
        const rep = L.getFactionReputation(state, 'english', 0);
        if (rep < window.D.SERVICE_THRESHOLDS.navalYard.repRequiredForRemoval) {
          return {
            ...state,
            log: [...state.log, "The English Naval Yard requires a reputation of 50 or higher for equipment installation."]
          };
        }

        const item = D.EQUIPMENT[action.equipmentKey];
        if (!item) return { ...state, log: [...state.log, "Unknown equipment."] };
        if (!(state.equipmentInventory || []).includes(action.equipmentKey))
          return { ...state, log: [...state.log, "Equipment not in inventory."] };
        if (state.gold < item.installFee) return { ...state, log: [...state.log, "Not enough gold for installation fee."] };

        const earlyAccess = L.isEarlyAccessEligible(state, item, 'equipment');
        const validation = L.canInstallEquipment(state, action.equipmentKey, earlyAccess);
        if (!validation.ok) return { ...state, log: [...state.log, `Cannot install: ${validation.reason}.`] };

        const newShip = {
          ...state.ship,
          equipment: {
            ...state.ship.equipment,
            [item.slot]: [...(state.ship.equipment[item.slot] || []), action.equipmentKey],
          },
        };
        const newStats = L.getShipStats({ ...state, ship: newShip });
        newShip.hull = Math.min(state.ship.hull, newStats.maxHull);

        return {
          ...state,
          gold: state.gold - item.installFee,
          ship: newShip,
          equipmentInventory: (state.equipmentInventory || []).filter(k => k !== action.equipmentKey),
          log: [...state.log, `Installed ${item.name} from equipment locker. -${item.installFee}g.`],
        };
      }

      case A.REMOVE_EQUIPMENT: {
        const blocked = checkServicesBlocked(state);
        if (blocked) return blocked;

        // Only at English Naval Yard
        if (PORTS[state.currentPort]?.faction !== 'english') {
          return {
            ...state,
            log: [...state.log, "Equipment removal is only available at English Naval Yard."]
          };
        }

        // Require English reputation >= 50
        const rep = L.getFactionReputation(state, 'english', 0);
        if (rep < window.D.SERVICE_THRESHOLDS.navalYard.repRequiredForRemoval) {
          return {
            ...state,
            log: [...state.log, "The English Naval Yard requires a reputation of 50 or higher for equipment removal."]
          };
        }

        const item = D.EQUIPMENT[action.equipmentKey];
        if (!item) return { ...state, log: [...state.log, "Unknown equipment."] };
        if (!item.removable)
          return { ...state, log: [...state.log, `${item.name} is structural and cannot be removed.`] };
        const slot = item.slot;
        const equipped = state.ship.equipment?.[slot] || [];
        if (!equipped.includes(action.equipmentKey))
          return { ...state, log: [...state.log, "Equipment not installed."] };
        if (state.gold < item.installFee)
          return { ...state, log: [...state.log, "Not enough gold for removal fee."] };
        return {
          ...state,
          gold: state.gold - item.installFee,
          ship: {
            ...state.ship,
            equipment: {
              ...state.ship.equipment,
              [slot]: equipped.filter(k => k !== action.equipmentKey),
            },
          },
          equipmentInventory: [...(state.equipmentInventory || []), action.equipmentKey],
          log: [...state.log, `Removed ${item.name}. Stored in equipment locker. -${item.installFee}g.`],
        };
      }

      case A.HIRE_CREW: {
        const blocked = checkServicesBlocked(state);
        if (blocked) return blocked;
        // ── Spanish birth location restriction ──────────────────────────
        const isSpanishBorn = state.faction === 'spanish';
        const isSpanishPort = window.D.PORTS[state.currentPort]?.faction === 'spanish';
        if (isSpanishBorn && !isSpanishPort) {
          return {
            ...state,
            log: [...state.log, window.E.logEntry(state, "You can only recruit crew at Spanish ports.")]
          };
        }
        // ── Cost ──────────────────────────────────────────────────────────
        const baseCost = isSpanishBorn ? 40 : 50;
        const cost = action.count * baseCost;
        // ── Capacity check ────────────────────────────────────────────────
        if (state.crew.roster.length >= state.crew.max || state.gold < cost) return { ...state };
        const portFaction = PORTS[state.currentPort]?.faction || "pirate";
        const newMembers = G.generateRoster(action.count, portFaction);
        let s = {
          ...state,
          gold: state.gold - cost,
          crew: { ...state.crew, roster: [...state.crew.roster, ...newMembers] },
          log: [...state.log, window.E.logEntry(state, `Hired ${action.count} crew for ${cost}g.`)]
        };
        // Inject tutorial hunt into the board (but do NOT auto-accept)
        const huntData = D.TUTORIAL_HUNT;
        if (
          huntData &&
          s.onboarding?.enabled &&
          !s.onboarding.completed &&
          !s.onboarding.stepsCompleted.tutorialHuntAccepted
        ) {
          if (!s.missions.some(m => m?.tutorial && !m.requiredGood)) {
            s = { ...s, missions: [huntData, ...s.missions] };
          }
        }
        return s;
      }
      
      case A.DISMISS_CREW: {
        const memberId = action.memberId;
        const member = state.crew.roster.find(m => m.id === memberId);
        if (!member) return state;

        // Quartermaster dismissal triggers skip confirmation (handled by UI later)
        if (L.hasTag(member, "quartermaster") && state.onboarding?.enabled && !state.onboarding?.completed) {
          return state; // Block direct dismissal : UI will show skip confirmation instead
        }

        return {
          ...state,
          crew: {
            ...state.crew,
            roster: state.crew.roster.filter(m => m.id !== memberId),
          },
          log: [...state.log, window.E.logEntry(state, `${member.firstName} ${member.lastName} was dismissed from the crew.`)],
        };
      }

      case A.RAISE_MORALE: {
        const blocked = checkServicesBlocked(state);
        if (blocked) return blocked;
        const cost = state.crew.roster.length * 5;
        if (state.gold < cost || state.crew.morale >= 100) return { ...state };
        return {
          ...state,
          gold: state.gold - cost,
          crew: { ...state.crew, morale: Math.min(100, state.crew.morale + 5) },
          log: [...state.log, `Bought drinks for the crew: -${cost}g. Morale +5.`]
        };
      }

      case A.TAKE_LOAN: {
        const bankStatus = L.isBankAvailable(state);
        if (!bankStatus.available) return state;

        const portFaction = PORTS[state.currentPort]?.faction;
        const rep = portFaction ? L.getFactionReputation(state, portFaction) : 50;
        if (rep < window.D.SERVICE_THRESHOLDS.bank.repRequired) return state;

        if (state.bankDebt > 0) {
          return { ...state, log: [...state.log, "You already have an outstanding loan."] };
        }

        const loanAmount = Math.floor(action.amount);
        if (!loanAmount || loanAmount <= 0) return state;

        const capacity = Math.floor(L.getBankCapacity(state, state.currentPort));
        if (loanAmount > capacity) {
          return { ...state, log: [...state.log, `Cannot borrow more than ${capacity}g.`] };
        }

        const interestRate = L.getBankInterestRate(state, state.currentPort);
        const totalObligation = Math.ceil(loanAmount * (1 + interestRate));

        const newDebt = state.bankDebt + totalObligation;
        return {
          ...state,
          gold: state.gold + loanAmount,
          bankDebt: newDebt,
          log: [...state.log,
            `Took a loan of ${loanAmount}g from the bank. Total repayment obligation: ${newDebt}g (${Math.round(interestRate * 100)}% interest).`
          ],
        };
      }

      case A.REPAY_LOAN: {
        const bankStatus = L.isBankAvailable(state);
        if (!bankStatus.available) return state;

        if (state.bankDebt <= 0) return state;

        const payment = action.amount;
        if (!payment || payment <= 0) return state;

        const actualPayment = Math.min(payment, state.bankDebt);
        if (state.gold < actualPayment) {
          return { ...state, log: [...state.log, "Not enough gold to repay that amount."] };
        }

        return {
          ...state,
          gold: state.gold - actualPayment,
          bankDebt: state.bankDebt - actualPayment,
          log: [...state.log, `Repaid ${actualPayment}g to the bank. Remaining debt: ${state.bankDebt - actualPayment}g.`],
        };
      }

      case A.PAY_INQUISITOR: {
        const inqStatus = L.isInquisitorAvailable(state);
          if (!inqStatus.available) {
            // Log the reason only if it's a rep issue at a Spanish port
            const port = PORTS[state.currentPort];
            if (port && port.faction === 'spanish') {
              return { ...state, log: [...state.log, "The Inquisitor will not hear you unless Spanish reputation is 50 or higher."] };
            }
            return state;
          }

        if (state.infamy <= 0) return state;

        const cost = L.getInquisitorCost(state);
        if (state.gold < cost) {
          return { ...state, log: [...state.log, "Not enough gold for the Inquisitor's fee."] };
        }

        return {
          ...state,
          gold: state.gold - cost,
          infamy: Math.max(0, state.infamy - 1),
          inquisitorUsedThisVisit: true,
          log: [...state.log, `The Inquisitor grants you absolution for ${cost}g. Your infamy decreases by 1.`],
        };
      }

      case A.PURCHASE_EMBASSY_REP: {
        const embStatus = L.isEmbassyAvailable(state);
          if (!embStatus.available) {
            // Log the reason only if it's a rep issue at a French port
            const port = PORTS[state.currentPort];
            if (port && port.faction === 'french') {
              return { ...state, log: [...state.log, "The French Embassy requires a French reputation of 50 or higher."] };
            }
            return state;
          }

        const targetFaction = action.targetFaction;
        if (!targetFaction || !FACTIONS[targetFaction]) {
          return { ...state, log: [...state.log, "Invalid target faction."] };
        }

        const targetRep = L.getFactionReputation(state, targetFaction);
        if (targetRep >= 100) {
          return { ...state, log: [...state.log, `The ${FACTIONS[targetFaction].label} already regard you with maximum reputation.`] };
        }

        const cost = L.getEmbassyCost(state, targetFaction);
        if (state.gold < cost) {
          return { ...state, log: [...state.log, "Not enough gold for the Embassy's services."] };
        }

        const newRep = L.applyReputationImpact(state, { [targetFaction]: window.D.SERVICE_THRESHOLDS.embassy.repGain });

        return {
          ...state,
          gold: state.gold - cost,
          reputation: newRep,
          log: [...state.log, `The French Embassy uses its influence to improve your standing with the ${FACTIONS[targetFaction].label} by +${window.D.SERVICE_THRESHOLDS.embassy.repGain}. Cost: ${cost}g.`],
        };
      }

      // --- MISSIONS ---
      case A.REFRESH_MISSIONS: {
        let missions = G.generateMissions(state.currentPort, state);
        const huntData = D.TUTORIAL_HUNT;
        if (
          huntData &&
          state.onboarding?.enabled &&
          !state.onboarding.completed &&
          state.onboarding.stepsCompleted.firstCrewHired &&
          !state.onboarding.stepsCompleted.tutorialHuntAccepted
        ) {
          if (!missions.some(m => m?.tutorial && !m.requiredGood)) {
            missions = [...missions, huntData];
          }
        }
        return { ...state, missions };
      }

      case A.TAKE_MISSION: {
        const mission = action.mission;
        if (!mission) return state;

      //cant take fight mission with 0HP
      const FIGHT_INVOLVED_TYPES = ["combat", "patrol", "assault", "escort"];
        if (state.ship.hull === 0 && FIGHT_INVOLVED_TYPES.includes(mission.type)) {
          return { ...state, log: [...state.log,
            window.E.logEntry(state, "The ship is unfit for a fight in this condition.")] };
        }

      if (action.mission.type === "combat" && state.completedCombatThisVisit) {
        return {
          ...state,
          log: [...state.log, "You've already hunted here. Sail to another port to find new prey."],
        };
      }

        // ── Instant combat mission: jump straight into intercept ──────
       if (mission.type === "combat" && mission.enemy) {
        const encounterContext = L.buildEncounterContext(state, "mission_combat", mission.enemy,  { kind: "mission", id: mission.id });
        // ── B1.4 batch: use encounterSession instead of encounterContext ──
        return {
          ...state,
          activeMission: mission,
          acceptedDay: state.day,
          encounterSession: buildEncounterSession(state, encounterContext),
          screen: "intercept",
          log: [...state.log, `Accepted mission: ${mission.name}.`],
        };
      }

        // ── Coward trait: fear on dangerous missions ─────────────────
        const isDangerous = (mission) => mission.risk === "high" || mission.type === "assault";
        if (isDangerous(mission)) {
          const cowards = state.crew.roster.filter(m =>
            m.tags?.includes("hidden_coward") || m.tags?.includes("revealed_coward")
          );
          if (cowards.length > 0) {
            const firstCoward = cowards[0];
            const wasHidden = firstCoward.tags?.includes("hidden_coward");
            const updatedCoward = wasHidden ? L.revealTag(firstCoward, "coward") : firstCoward;
            const newRoster = state.crew.roster.map(m => m.id === updatedCoward.id ? updatedCoward : m);
            const newMorale = Math.max(0, state.crew.morale - 3);
            const logLine = wasHidden
              ? `${firstCoward.firstName} ${updatedCoward.lastName} is visibly shaking. He didn't sign up for this kind of work.`
              : `${firstCoward.firstName} ${updatedCoward.lastName} looks terrified. Again.`;

            // Remove the mission from the list even if coward triggers (acceptance still happens)
            const newMissions = state.missions.filter(m => m !== mission);

            return {
              ...state,
              missions: newMissions,
              activeMission: { ...mission, encounterOccurred: false },
              acceptedDay: state.day,
              crew: { ...state.crew, roster: newRoster, morale: newMorale },
              log: [...state.log, logLine],
            };
          }
        }

          const newMissions = state.missions.filter(m => m !== mission);

          return {
            ...state,
            missions: newMissions, 
            activeMission: { ...mission, encounterOccurred: false },
            acceptedDay: state.day,
            log: [...state.log, `Accepted mission: ${mission.name}.`],
          };
      }

      case A.COMPLETE_MISSION: {
        const mission = state.activeMission;
        if (!mission) return state;

        // ── Escort: convoy lost → mission failed ──
        if (mission.type === "escort" && mission.convoyLost) {
          return {
            ...state,
            activeMission: null,
            log: [...state.log, window.E.logEntry(state, "The convoy was destroyed. The escort mission has failed.")],
            reputation: L.applyReputationImpact(state, { [mission.faction]: -5 }),
          };
        }

        // ── Patrol: must have defeated enemy ──
        if (mission.type === "patrol" && !mission.enemyDefeated) {
          return {
            ...state,
            log: [...state.log, "You have not yet found and defeated the enemy in the patrol zone. Keep searching."]
          };
        }

        // ── Target port check ──
        if (mission.targetPort && state.currentPort !== mission.targetPort) {
          return { ...state };
        }

        // ── Required goods check ──
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

        // ── Remove required goods from hold ──────────────────────────────
        let holdItems = { ...(state.hold?.items || {}) };
        if (mission.requiredGood && mission.requiredQty) {
          holdItems[mission.requiredGood] = Math.max(0, (holdItems[mission.requiredGood] || 0) - mission.requiredQty);
        }

        // ── Compute non‑gold effects + goods value ─────────────────────
        const { goodsValue, finalFame, newInfamy, newRep, newMorale, logLines } =
          applyMissionEffects(state, mission);

        // ── Mission reward: multiplier is baked in at generation time ──
        const rewardGold = mission.gold;

        // ── Loan garnish: only on the mission reward (not goods value) ──
        let netReward = rewardGold;
        let newBankDebt = state.bankDebt ?? 0;
        if (rewardGold > 0 && newBankDebt > 0) {
          const garnishResult = L.applyLoanGarnish(newBankDebt, rewardGold);
          netReward = garnishResult.netIncome;
          newBankDebt = garnishResult.newDebt;
          if (garnishResult.actualRepayment > 0) {
            logLines.push(`Bank repayment: ${garnishResult.actualRepayment}g deducted from mission income.`);
          }
        }

        const netGoldGain = netReward + goodsValue;

        let completionMsg = `Completed: ${mission.name}. +${netGoldGain}g, +${finalFame} fame.`;
        if (goodsValue > 0) {
          completionMsg += ` (includes ${goodsValue}g for the goods)`;
        }

        let nextState = {
          ...state,
          gold: state.gold + netGoldGain,      // ← FIXED: uses netGoldGain
          bankDebt: newBankDebt,
          fame: state.fame + finalFame,
          infamy: newInfamy,
          reputation: newRep,
          activeMission: null,
          hold: { ...state.hold, items: holdItems },
          crew: { ...state.crew, morale: newMorale },
          missions: G.generateMissions(state.currentPort, { ...state, activeMission: null }),
          log: [
            ...state.log,
            window.E.logEntry(state, completionMsg),
            ...logLines,
          ],
        };

        // Prevent chaining combat missions in the same visit
        if (mission.type === "combat") {
          nextState.completedCombatThisVisit = true;
        }

        // Smuggle mission: add heat to target faction
        if (mission.type === "smuggle" && mission.targetPort) {
          const targetFaction = PORTS[mission.targetPort]?.faction;
          if (targetFaction && targetFaction !== "pirate") {
            const alerts = { ...(nextState.factionAlerts || {}) };
            alerts[targetFaction] = Math.min(10, (alerts[targetFaction] || 0) + 1);
            nextState.factionAlerts = alerts;
          }
        }

        // Greedy trait: demands bonus
        const greedyMembers = nextState.crew.roster.filter(m =>
          m.tags?.includes("hidden_greedy") || m.tags?.includes("revealed_greedy")
        );
        if (greedyMembers.length > 0) {
          const greedy = greedyMembers[0];
          const wasHidden = greedy.tags?.includes("hidden_greedy");
          if (nextState.gold >= 50) {
            nextState.gold -= 50;
            nextState.crew.roster = nextState.crew.roster.map(m =>
              m.id === greedy.id ? (wasHidden ? L.revealTag(m, "greedy") : m) : m
            );
            nextState.log = [...nextState.log,
              wasHidden
                ? `${greedy.firstName} ${greedy.lastName} demands a larger share. "I did my part," he says, hand out.`
                : `${greedy.firstName} ${greedy.lastName} demands his usual cut.`
            ];
          } else {
            nextState.crew.roster = nextState.crew.roster.map(m =>
              m.id === greedy.id
                ? L.addTag(wasHidden ? L.revealTag(m, "greedy") : m, "upset")
                : m
            );
            nextState.log = [...nextState.log,
              wasHidden
                ? `${greedy.firstName} ${greedy.lastName} demands a larger share. When refused, he grows bitter.`
                : `${greedy.firstName} ${greedy.lastName} demands his cut, and your refusal leaves him seething.`
            ];
          }
        }

        if (state.autoSave !== false) autoSave(nextState);
        return nextState;
      }

      case A.ABANDON_MISSION:
        return {
          ...state,
          activeMission: null,
          reputation: L.applyReputationImpact(state, { [state.activeMission?.faction || "pirate"]: -10 }),
          log: [...state.log, `Abandoned mission: ${state.activeMission?.name}.`]
        };

      // --- MARKET ---
      case A.CONFIRM_TRADE: {
        const { buys, sells } = action;
        if (!state.portMarket) return state;

        const validation = validateTrade(state, buys, sells);
        if (!validation.valid) return { ...state, log: [...state.log, validation.reason] };

        const items = { ...(state.hold?.items || {}) };
        let goldDelta = 0;
        let infamyDelta = 0;
        const logLines = [];
        const marketGoods = { ...state.portMarket.goods };

        // ── Sells ──────────────────────────────────────────────────
        const soldGoods = [];
        Object.entries(sells || {}).forEach(([good, qty]) => {
          if (qty <= 0) return;
          const portGood = state.portMarket.goods[good];
          const actualQty = Math.min(qty, items[good] || 0);
          if (actualQty <= 0) return;
          const revenue = actualQty * (portGood ? portGood.sellToPort : 0);
          items[good] = (items[good] || 0) - actualQty;
          goldDelta += revenue;
          if (marketGoods[good]) marketGoods[good] = { ...marketGoods[good], available: (marketGoods[good].available || 0) + actualQty };
          // Always record the good name : even if market doesn't trade it
          soldGoods.push(window.D.RESOURCES[good]?.name || good);
        });

        // ── Buys ───────────────────────────────────────────────────
        const boughtGoods = [];
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
          boughtGoods.push(res?.name || good);
        }

        // ── Build consolidated trade summary ───────────────────────
        const uniq = arr => [...new Set(arr)];
        const formatGoods = names => {
          if (names.length === 0) return null;
          if (names.length === 1) return names[0];
          if (names.length === 2) return `${names[0]} and ${names[1]}`;
          return "several goods";
        };

        const bought = formatGoods(uniq(boughtGoods));
        const sold = formatGoods(uniq(soldGoods));

        if (bought || sold) {
          let summary = "";
          if (bought) summary += `Bought ${bought}`;
          if (bought && sold) summary += ". ";
          if (sold)  summary += `Sold ${sold}`;
          summary += `. Net: ${goldDelta >= 0 ? "+" : ""}${goldDelta}g.`;
          logLines.push(summary);
        }

        // ── Loan garnish: 20% of positive trade income goes to debt ──
        let finalGold = goldDelta;
        let newBankDebt = state.bankDebt ?? 0;
        if (goldDelta > 0 && newBankDebt > 0) {
          const garnishResult = L.applyLoanGarnish(newBankDebt, goldDelta);
          finalGold = garnishResult.netIncome;
          newBankDebt = garnishResult.newDebt;
          if (garnishResult.actualRepayment > 0) {
            logLines.push(`Bank repayment: ${garnishResult.actualRepayment}g deducted from trade income.`);
          }
        }

        const newState = {
          ...state,
          gold: state.gold + finalGold,
          bankDebt: newBankDebt,
          hold: { ...state.hold, items },
          portMarket: { ...state.portMarket, goods: marketGoods },
          infamy: Math.min(999, (state.infamy ?? 0) + infamyDelta),
          log: [...state.log, ...logLines],
        };

        return newState;
    }

      case A.TOP_UP_PROVISIONS: {
        const market = state.portMarket;
        if (!market) return state;

        const crew = state.crew.roster.length;
        if (crew === 0) return state;

        const buyQty = Math.max(1, Math.ceil(crew));

        const foodPrice = market.goods.food?.buyFromPort || 3;
        const waterPrice = market.goods.water?.buyFromPort || 2;
        const cost = buyQty * (foodPrice + waterPrice);

        const freeSpace = L.getHoldCapacity(state) - L.getHoldUsed(state.hold?.items || {});
        if (state.gold < cost) return state;
        if (freeSpace < buyQty * 2) return state;

        const newItems = { ...state.hold.items };
        newItems.food = (newItems.food || 0) + buyQty;
        newItems.water = (newItems.water || 0) + buyQty;

        return {
          ...state,
          gold: state.gold - cost,
          hold: { ...state.hold, items: newItems },
          log: [...state.log, window.E.logEntry(state, `Topped up provisions: +${buyQty} food, +${buyQty} water for ${cost}g.`)],
        };
      }

      default:
        return state;
    }
  });

  // Expose port-specific helpers for other modules that may need them
  window.E.checkServicesBlocked = checkServicesBlocked;
  window.E.validateTrade = validateTrade;
})();