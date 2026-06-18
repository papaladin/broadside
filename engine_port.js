// engine_port.js – Port Domain (Market, Missions, Crew, Shipyard, Repairs, Start/Load)
// Registers its reducer into window.E._reducers.

(() => {
  const { A, autoSave, createBattleState } = window.E;
  const { PORTS, SHIPS, FACTIONS, EQUIPMENT, STARTS } = window.D;
  const D = window.D;   // for convenience
  const L = window.L;
  const G = window.G;

  // ── Port‑specific helpers ─────────────────────────────────────
  const checkServicesBlocked = (state) => {
    const repPerk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
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

// ── Arrival message picker ──────────────────────────────────
const arrivalMessages = [
  name => `⚓ Arrived at ${name}.`,
  name => `⚓ Dropped anchor at ${name}.`,
  name => `⚓ Made port at ${name}.`,
  name => `⚓ The harbour of ${name} comes into view.`,
  name => `⚓ ${name} at last. The crew is glad to see land.`,
  name => `⚓ ${name} welcomes you, for now.`,
];

const pickArrivalMessage = (portName) => {
  const template = arrivalMessages[Math.floor(Math.random() * arrivalMessages.length)];
  return template(portName);
};

// ── Desertion check ─────────────────────────────────────────
const processDesertion = (crewRoster, crewMorale, currentPort, state) => {
  const destFaction = PORTS[currentPort]?.faction;
  const deserters = [];
  const settlers = [];
  const newRoster = [];

  for (const member of crewRoster) {
    if (L.hasTag(member, "loyal")) {
      newRoster.push(member);
      continue;
    }

    if (L.hasTag(member, "protected")) {
      newRoster.push(member);
      continue; // QM never deserts
    }

    if (L.hasTag(member, "upset")) {
      let desertChance = 0.30;
      if (crewMorale > 60) desertChance = 0.10;
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

  if (deserters.length > 0) {
    let deserterMsg = "";
    if (deserters.length === 1)
      deserterMsg = `${deserters[0]} has left the crew.`;
    else if (deserters.length === 2)
      deserterMsg = `${deserters[0]} and ${deserters[1]} have left the crew.`;
    else
      deserterMsg = `${deserters.length} crew members have left the crew.`;

    const repFaction = FACTIONS[crewRoster.find(m =>
      `${m.firstName} ${m.lastName}` === deserters[0]
    )?.faction]?.label || "their former faction";
    deserterMsg += ` They could not forgive the attack on ${repFaction} ships.`;
    logLines.push(window.E.logEntry(state, deserterMsg));
  }

  if (settlers.length > 0) {
    const settledTemplates = [
      "👥 The rest of the upset crew seem to have settled down.",
      "👥 The mood aboard has improved. Tensions are easing.",
      "👥 Your upset crew appear to have calmed down. For now.",
    ];
    const settledMsg = settledTemplates[Math.floor(Math.random() * settledTemplates.length)];
    logLines.push(window.E.logEntry(state, settledMsg));
  }

  return { roster: newRoster, logLines };
};

// ── Positive traits (seasoned → veteran → loyal) ────────────
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
      const factionPorts = Object.keys(D.PORTS).filter(k => D.PORTS[k].faction === memberFaction);
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
  if (newSeasoned.length === 1)
    promoLines.push(`${newSeasoned[0]} has found their sea legs. A seasoned hand now.`);
  else if (newSeasoned.length > 1)
    promoLines.push(`${newSeasoned.length} crew members have found their sea legs.`);

  if (newVeterans.length === 1)
    promoLines.push(`${newVeterans[0]} has served 100 days aboard. A true veteran.`);
  else if (newVeterans.length > 1)
    promoLines.push(`${newVeterans.length} crew members are now veterans.`);

  if (newLoyal.length === 1)
    promoLines.push(`${newLoyal[0]} has pledged their loyalty. 'This ship is my home now, Captain.'`);
  else if (newLoyal.length > 1)
    promoLines.push(`${newLoyal.length} crew members have sworn their loyalty.`);

  const logLines = promoLines.map(l => window.E.logEntry(state, l));

  return { roster: newRoster, logLines };
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
    name: shipData.name,
    hull: shipData.maxHull,
    cannons: shipData.cannons,
    upgrades: [],
  };

  // ── Hold ────────────────────────────────────────────────────
  newState.hold = {
    capacity: shipData.holdCapacity,
    items: {
      food: 0, water: 0, rum: 0, sugar: 0, timber: 0, cloth: 0,
      spices: 0, silk: 0, coffee: 0, cocoa: 0, weapons: 0,
      tobacco: 0, silver: 0, slaves: 0,
      ...(start.hold || {}),
    },
  };

  // ── Reputation ──────────────────────────────────────────────
  const rep = {};
  Object.keys(PORTS).forEach(portKey => { rep[portKey] = 50; });
  const repAdj = start.factionRepAdjust?.[faction] || {};
  Object.entries(repAdj).forEach(([adjFaction, delta]) => {
    Object.keys(PORTS).forEach(portKey => {
      if (PORTS[portKey].faction === adjFaction) {
        rep[portKey] = Math.max(0, Math.min(100, 50 + delta));
      }
    });
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
    newState.onboarding.stepsCompleted.firstArrival = true;
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

  // Onboarding screen‑based step advances
  const screenSteps = {
    market: 'marketOpened',
    map: 'mapOpened',
    crew: 'crewOpened',
    shipyard: 'shipyardOpened',
    journal: 'journalOpened',
  };
  const step = screenSteps[action.screen];
  if (step && nextState.onboarding?.enabled && !nextState.onboarding.completed) {
    nextState = {
      ...nextState,
      onboarding: {
        ...nextState.onboarding,
        stepsCompleted: { ...nextState.onboarding.stepsCompleted, [step]: true },
      },
    };
  } 

  return nextState;
}

      // --- SAIL_TO ---
      case A.SAIL_TO: {
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

          let newState = {
            ...state,
            destination: action.port,
            sailingDaysLeft: newDays,
            sailingDaysTotal: newDays,
            screen: "sailing",
            portGossip: [],
            log: [...state.log, `Changing course for ${destPort.name}. ${newDays} day${newDays !== 1 ? "s" : ""} voyage.`],
            route: {
              ...state.route,
              destinationPort: action.port,
              destinationPos: { x: destPort.x, y: destPort.y },
              progressDays: 0,
              totalDays: newDays,
              seaPosition: seaPos,
            },
          };

          // Onboarding: advance mapOpened + firstVoyageStarted
          if (newState.onboarding?.enabled && !newState.onboarding.completed) {
            newState = {
              ...newState,
              onboarding: {
                ...newState.onboarding,
                stepsCompleted: {
                  ...newState.onboarding.stepsCompleted,
                  mapOpened: true,
                  firstVoyageStarted: true,
                },
              },
            };
          }

          return newState;
        }

    // ── Normal port departure ─────────────────────────────────
    const days = L.travelDays(state.currentPort, action.port, state);
    const originPort = PORTS[state.currentPort];
    const shipStats = L.getShipStats(state);

    let newState = {
      ...state,
      previousPort: state.currentPort,
      destination: action.port,
      sailingDaysLeft: days,
      sailingDaysTotal: days,
      screen: "sailing",
      portGossip: [],
      log: [...state.log, `Setting sail for ${destPort.name}. ${days} day${days !== 1 ? "s" : ""} voyage.`],
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

    // Onboarding: advance mapOpened + firstVoyageStarted
    if (newState.onboarding?.enabled && !newState.onboarding.completed) {
      newState = {
        ...newState,
        onboarding: {
          ...newState.onboarding,
          stepsCompleted: {
            ...newState.onboarding.stepsCompleted,
            mapOpened: true,
            firstVoyageStarted: true,
          },
        },
      };
    }

    return newState;
}

// ------------ ENTER PORT ------------------------------
case A.ENTER_PORT: {
  if (!state.destination) {
    return { ...state, screen: "port", log: [...state.log, "You return to port."] };
  }
  const port = PORTS[state.destination];
  const portFaction = port.faction;
  const playerRep = state.reputation[state.destination] ?? 50;
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
    const encounterContext = L.buildEncounterContext(state, combatEncounter.type, combatEncounter.enemy);
    const logMsg = state.activeMission?.type === "assault"
      ? `Arrived at ${port.name}. The garrison is on high alert!`
      : `Arrived at ${port.name}. Hostile port!`;
    return {
      ...state,
      currentPort: state.destination,
      destination: null,
      sailingDaysLeft: 0,
      encounterContext,
      screen: "intercept",
      portMarket: G.generatePortMarket(state.destination, state),   // ← pass state
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
    portMarket: G.generatePortMarket(state.destination, state),     // ← pass state
    log: [...state.log, window.E.logEntry(state, pickArrivalMessage(port.name))]
  };

  // Run post‑arrival logic
  const desertionResult = processDesertion(
    nextState.crew.roster,
    nextState.crew.morale,
    nextState.currentPort,
    state
  );
  nextState.crew = { ...nextState.crew, roster: desertionResult.roster };
  if (desertionResult.logLines.length > 0) {
    nextState.log = [...nextState.log, ...desertionResult.logLines];
  }

  const traitResult = processPositiveTraits(nextState.crew.roster, state);
  nextState.crew = { ...nextState.crew, roster: traitResult.roster };
  if (traitResult.logLines.length > 0) {
    nextState.log = [...nextState.log, ...traitResult.logLines];
  }

  nextState.portGossip = G.generatePortGossip(nextState, nextState.currentPort);

  // ── Onboarding step advances ──────────────────────────
  // Onboarding step advances – direct immutable update
if (nextState.onboarding?.enabled && !nextState.onboarding.completed) {
  nextState = {
    ...nextState,
    onboarding: {
      ...nextState.onboarding,
      stepsCompleted: {
        ...nextState.onboarding.stepsCompleted,
        contractsOpened: true,
        firstArrival: true,
      },
    },
  };
}

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

  autoSave(nextState);
  return nextState;
}

// --------------------- PORT ACTIONS --------------------------------
        case A.REPAIR: {
          const blocked = checkServicesBlocked(state);
          if (blocked) return blocked;
          const shipStats = L.getShipStats(state);
          const rep = state.reputation[state.currentPort] ?? 50;
          const perk = L.getRepPerk(rep);
          const baseCost = (shipStats.maxHull - state.ship.hull) * 2;
          const eqRepairPct = L.getEquipmentEffect(state, "repairCostPct") || 0;
          const combinedMult = perk.repairMult * (1 + eqRepairPct);
          const cost = Math.floor(baseCost * combinedMult);
          if (state.gold < cost) return { ...state, log: [...state.log, "Not enough gold to repair."] };
          const discountNote = perk.repairMult < 1 ? ` (${perk.tier} discount applied)` : "";
          const eqPenaltyNote = eqRepairPct > 0 ? ` (+${Math.round(eqRepairPct * 100)}% equipment penalty)` : "";
          let s = {
            ...state,
            gold: state.gold - cost,
            ship: { ...state.ship, hull: shipStats.maxHull },
            log: [...state.log, `Repaired ship for ${cost}g${discountNote}${eqPenaltyNote}.`]
          };
          // Advance onboarding step: ship repaired
          if (s.onboarding?.enabled && !s.onboarding.completed) {
            s = {
              ...s,
              onboarding: {
                ...s.onboarding,
                stepsCompleted: { ...s.onboarding.stepsCompleted, shipRepaired: true },
              },
            };
          }
          return s;
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
        return {
          ...state,
          gold: state.gold - ship.cost,
          ship: {
            type: action.shipType,
            name: ship.name,
            hull: ship.maxHull,
            cannons: ship.cannons,
            equipment: { hull: [], armament: [], rigging: [], special: [] },  // NEW
          },
          crew: { ...state.crew, roster: newRoster, max: ship.maxCrew },
          hold: { ...state.hold },
          log: [...state.log, `Purchased ${ship.name} for ${ship.cost}g.`],
        };
      }

      case A.BUY_EQUIPMENT: {
        const blocked = checkServicesBlocked(state);
        if (blocked) return blocked;
        const item = D.EQUIPMENT[action.equipmentKey];
        if (!item) return { ...state, log: [...state.log, "Unknown equipment."] };
        const validation = L.canInstallEquipment(state, action.equipmentKey);
        if (!validation.ok) return { ...state, log: [...state.log, `Cannot install: ${validation.reason}.`] };
        const totalCost = item.cost + item.installFee;
        if (state.gold < totalCost) return { ...state, log: [...state.log, "Not enough gold."] };

        const newShip = {
          ...state.ship,
          equipment: {
            ...state.ship.equipment,
            [item.slot]: [...(state.ship.equipment[item.slot] || []), action.equipmentKey],
          },
        };
        // Cap hull at new effective max after equipment change
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
        const item = D.EQUIPMENT[action.equipmentKey];
        if (!item) return { ...state, log: [...state.log, "Unknown equipment."] };
        if (!(state.equipmentInventory || []).includes(action.equipmentKey))
          return { ...state, log: [...state.log, "Equipment not in inventory."] };
        const validation = L.canInstallEquipment(state, action.equipmentKey);
        if (!validation.ok) return { ...state, log: [...state.log, `Cannot install: ${validation.reason}.`] };
        if (state.gold < item.installFee) return { ...state, log: [...state.log, "Not enough gold for installation fee."] };

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
  const cost = action.count * 50;
  if (state.crew.roster.length >= state.crew.max || state.gold < cost) return { ...state };
  const portFaction = PORTS[state.currentPort]?.faction || "pirate";
  const newMembers = G.generateRoster(action.count, portFaction);
  let s = {
    ...state,
    gold: state.gold - cost,
    crew: { ...state.crew, roster: [...state.crew.roster, ...newMembers] },
    log: [...state.log, window.E.logEntry(state, `Hired ${action.count} crew for ${cost}g.`)]
  };

  // Advance onboarding step: first crew hired
  if (s.onboarding?.enabled && !s.onboarding.completed) {
    s = {
      ...s,
      onboarding: {
        ...s.onboarding,
        stepsCompleted: { ...s.onboarding.stepsCompleted, firstCrewHired: true },
      },
    };
  }

  // Inject tutorial hunt into the board (but do NOT auto‑accept)
  const huntData = D.TUTORIAL_HUNT;
  if (
    huntData &&
    s.onboarding?.enabled &&
    !s.onboarding.completed &&
    s.onboarding.stepsCompleted.firstCrewHired &&
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

        // Helper: mark hunt messages as seen when accepting the tutorial hunt
        const markHuntMessagesSeen = (s) => {
          if (
            mission.tutorial &&
            !mission.requiredGood &&
            s.onboarding?.enabled &&
            !s.onboarding.completed
          ) {
            return {
              ...s,
              onboarding: {
                ...s.onboarding,
                qmMessagesSeen: {
                  ...s.onboarding.qmMessagesSeen,
                  crewHired: true,
                  huntAccepted: true,
                },
              },
            };
          }
          return s;
        };

        if (mission.type === "combat" && mission.enemy) {
          return markHuntMessagesSeen({
            ...state,
            activeMission: mission,
            encounterContext: L.buildEncounterContext(state, "mission_combat", mission.enemy),
            screen: "intercept",
            log: [...state.log, `Accepted mission: ${mission.name}.`],
            onboarding: (mission.tutorial && !mission.requiredGood && state.onboarding?.enabled && !state.onboarding.completed)
              ? {
                  ...state.onboarding,
                  stepsCompleted: { ...state.onboarding.stepsCompleted, tutorialHuntAccepted: true },
                }
              : state.onboarding,
          });
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

            return markHuntMessagesSeen({
              ...state,
              activeMission: { ...mission, encounterOccurred: false },
              crew: { ...state.crew, roster: newRoster, morale: newMorale },
              log: [...state.log, logLine],
              onboarding: (mission.tutorial && !mission.requiredGood && state.onboarding?.enabled && !state.onboarding.completed)
                ? {
                    ...state.onboarding,
                    stepsCompleted: { ...state.onboarding.stepsCompleted, tutorialHuntAccepted: true },
                  }
                : state.onboarding,
            });
          }
        }

        return markHuntMessagesSeen({
          ...state,
          activeMission: { ...mission, encounterOccurred: false },
          log: [...state.log, `Accepted mission: ${mission.name}.`],
          onboarding: (mission.tutorial && !mission.requiredGood && state.onboarding?.enabled && !state.onboarding.completed)
            ? {
                ...state.onboarding,
                stepsCompleted: { ...state.onboarding.stepsCompleted, tutorialHuntAccepted: true },
              }
            : state.onboarding,
        });
      }

       case A.COMPLETE_MISSION: {
        const mission = state.activeMission;
        if (!mission) return state;
        if (mission.targetPort && state.currentPort !== mission.targetPort) return { ...state };

        // Patrol must have defeated enemy
        if (mission.type === "patrol" && !mission.enemyDefeated) {
          return {
            ...state,
            log: [...state.log, "You have not yet found and defeated the enemy in the patrol zone. Keep searching."]
          };
        }

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

        let holdItems = { ...(state.hold?.items || {}) };
        if (mission.requiredGood && mission.requiredQty) {
          holdItems[mission.requiredGood] = Math.max(0, (holdItems[mission.requiredGood] || 0) - mission.requiredQty);
        }

        let finalGold, bonusNote;
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

        // Apply Ornate Figurehead bonus to positive rep gains
        const repImpact = { ...mission.repImpact };
        const repBonus = L.getEquipmentEffect(state, "repGainBonus") || 0;
        if (repBonus > 0) {
          for (const faction in repImpact) {
            if (repImpact[faction] > 0) {
              repImpact[faction] += repBonus;
            }
          }
        }
        const newRep = L.applyReputationImpact(state, repImpact);
        const infamyGain = mission.infamyGain || 0;
        const oldInfamy = state.infamy ?? 0;
        const newInfamy = Math.min(999, oldInfamy + infamyGain);
        const crossedThreshold = L.getInfamyLabel(newInfamy) !== L.getInfamyLabel(oldInfamy);

        // ── MSorale gain for mission completion ────────────────
        const alignment = L.getAlignmentModifier(state, mission.faction);
        const moraleGain = Math.round(3 * alignment);
        const newMorale = Math.min(100, state.crew.morale + moraleGain);

        // War Pennants fame bonus
        let finalFame = mission.fame || 0;
        const isWarPennantMission = (
          mission.type === "combat" ||
          mission.type === "patrol" ||
          mission.type === "assault"
        ) && !mission.starter;
        if (isWarPennantMission) {
          finalFame += L.getEquipmentEffect(state, "missionCombatFameBonus");
        }

        const newLog = [
          ...state.log,
          window.E.logEntry(state, `Completed: ${mission.name}. +${finalGold}g${bonusNote}, +${finalFame} fame.`)
        ];
        if (infamyGain > 0) newLog.push(`+${infamyGain} infamy.`);
        if (crossedThreshold) newLog.push(`Your name grows darker. You are now ${L.getInfamyLabel(newInfamy)}.`);
        if (mission.plotItem) holdItems = { ...holdItems, plot_item: 0 };

        let nextState = {
          ...state,
          gold: state.gold + finalGold,
          fame: state.fame + finalFame,
          infamy: newInfamy,
          reputation: newRep,
          activeMission: null,
          hold: { ...state.hold, items: holdItems },
          crew: { ...state.crew, morale: newMorale },
          missions: G.generateMissions(state.currentPort, { ...state, activeMission: null }),
          log: newLog,
        };

        // Onboarding: mark delivery delivered
        if (mission.tutorial && mission.requiredGood) {
          nextState = {
            ...nextState,
            onboarding: {
              ...nextState.onboarding,
              stepsCompleted: {
                ...nextState.onboarding.stepsCompleted,
                firstContractDelivered: true,
              },
            },
          };
        }

        // ── Smuggle mission: add heat to target faction ────────────
        if (mission.type === "smuggle" && mission.targetPort) {
          const targetFaction = PORTS[mission.targetPort]?.faction;
          if (targetFaction && targetFaction !== "pirate") {
            const alerts = { ...(nextState.factionAlerts || {}) };
            alerts[targetFaction] = Math.min(10, (alerts[targetFaction] || 0) + 1);
            nextState.factionAlerts = alerts;
          }
        }

        // ── Greedy trait: demands bonus ──────────────────────────────
        const greedyMembers = nextState.crew.roster.filter(m =>
          m.tags?.includes("hidden_greedy") || m.tags?.includes("revealed_greedy")
        );
        if (greedyMembers.length > 0) {
          const greedy = greedyMembers[0]; // only one triggers per mission
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
            // Can't afford : becomes upset
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

        // Onboarding: mark hunt completed
        if (mission.tutorial && !mission.requiredGood) { // hunt missions have no requiredGood
          nextState = {
            ...nextState,
            onboarding: {
              ...nextState.onboarding,
              stepsCompleted: {
                ...nextState.onboarding.stepsCompleted,
                tutorialHuntCompleted: true,
              },
            },
          };
        }

        autoSave(nextState);
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

        const newState = {
          ...state,
          gold: state.gold + goldDelta,
          hold: { ...state.hold, items },
          portMarket: { ...state.portMarket, goods: marketGoods },
          infamy: Math.min(999, (state.infamy ?? 0) + infamyDelta),
          log: [...state.log, ...logLines],
        };

        // Onboarding advancement: if tutorial mission goods and provisions are now in hold, mark provisionsAndGoodsBought
        if (
          newState.onboarding?.enabled &&
          !newState.onboarding.completed &&
          newState.activeMission?.tutorial &&
          newState.activeMission?.requiredGood
        ) {
          const requiredGood = newState.activeMission.requiredGood;
          const requiredQty = newState.activeMission.requiredQty;
          const holdItems = newState.hold?.items || {};
          if (
            (holdItems[requiredGood] || 0) >= requiredQty &&
            (holdItems.food || 0) > 0 &&
            (holdItems.water || 0) > 0
          ) {
            newState.onboarding = {
              ...newState.onboarding,
              stepsCompleted: {
                ...newState.onboarding.stepsCompleted,
                provisionsAndGoodsBought: true,
              },
            };
          }
        }

        return newState;
      }


      default:
        return state;
    }
  });

  // Expose port-specific helpers for other modules that may need them
  window.E.checkServicesBlocked = checkServicesBlocked;
  window.E.validateTrade = validateTrade;
})();