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
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  INITIAL STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const initialState = {
    screen: "start",
    day: 1,
    log: [],
    gold: 1000,
    fame: 0,
    infamy: 0,
    currentPort: "portRoyal",
    previousPort: null,
    destination: null,
    sailingDaysLeft: 0,
    sailingDaysTotal: 0,
    wind: { angle: 45, speed: 10 },
    ship: { type: "sloop", name: "Sea Dog", hull: 100, cannons: 10, upgrades: [] },
    crew: { roster: [], max: 50, morale: 80 },
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

        const newState = { ...initialState, screen: "port", currentPort: "portRoyal", day: 1, log: [`Started as ${start.name}.`], reputation: {},infamy: 0, };

        start.bonuses.forEach(bonus => {
          if (bonus.includes("gold")) {
            newState.gold += parseInt(bonus.replace(/[^0-9]/g, "")) || 0;
          } else if (bonus.includes("ship:")) {
            const shipType = bonus.split(":")[1].trim();
            if (SHIPS[shipType]) {
              newState.ship = { ...newState.ship, type: shipType, name: SHIPS[shipType].name, hull: SHIPS[shipType].maxHull, cannons: SHIPS[shipType].cannons };
              newState.crew = { ...newState.crew, max: SHIPS[shipType].maxCrew };
            }
          } else if (bonus.includes("reputation with")) {
            const faction = bonus.split("with")[1].trim().toLowerCase();
            const repBonus = parseInt(bonus.match(/\+\d+/)?.[0] || 0);
            Object.keys(PORTS).forEach(portKey => {
              if (PORTS[portKey].faction === faction) newState.reputation[portKey] = (newState.reputation[portKey] || 50) + repBonus;
            });
          }
        });

        const startFaction = PORTS["portRoyal"].faction; // English
        const crewCount = Math.floor(newState.crew.max * 0.6);
        newState.crew.roster = L.generateRoster(crewCount, startFaction);

        Object.keys(PORTS).forEach(portKey => {
          if (newState.reputation[portKey] === undefined) newState.reputation[portKey] = 50;
        });
        return newState;
      }

      // --- NAVIGATION ---
      case A.NAVIGATE: return { ...state, screen: action.screen };

      // --- SAILING ---
      case A.SAIL_TO: {
        const days = L.travelDays(state.currentPort, action.port, state);
        return { ...state, previousPort: state.currentPort, destination: action.port, sailingDaysLeft: days, sailingDaysTotal: days, screen: "sailing", log: [...state.log, `Setting sail for ${PORTS[action.port].name}. ${days} day${days !== 1 ? "s" : ""} voyage.`] };
      }

      case A.ADVANCE_DAY: {
        if (state.sailingDaysLeft <= 0) return state;
        const newDays = state.sailingDaysLeft - 1;
        const newLog = [...state.log];
        const rawAngle = (state.wind.angle + (Math.random() - 0.5) * 30 + 360) % 360;
        const newWind = { angle: Math.round(rawAngle) % 360, speed: Math.round(Math.max(1, Math.min(20, state.wind.speed + (Math.random() - 0.5) * 5))) };
        const wages = L.payCrewWages(state);
        const newGold = Math.max(0, state.gold - wages);
        const newRep = (state.day % 2 === 0) ? L.decayReputation(state) : state.reputation;
        const newMorale = state.crew.morale < 30 ? Math.max(0, state.crew.morale - 1) : state.crew.morale;

        const updatedRoster = state.crew.roster.map(m => ({ ...m, daysAboard: m.daysAboard + 1 }));

        // Smuggle intercept
        if (state.activeMission?.type === "smuggle" && !state.activeMission.encounterOccurred) {
          const interceptChance = state.activeMission.interceptChance || 0.5;
          if (Math.random() < interceptChance) {
            const enemy = state.activeMission.enemy;
            const encounterContext = L.buildEncounterContext(state, "smuggling_caught", enemy);
            return { ...state, wind: newWind, day: state.day + 1, sailingDaysLeft: newDays, gold: newGold, reputation: newRep, crew: { ...state.crew, roster: updatedRoster, morale: newMorale }, activeMission: { ...state.activeMission, encounterOccurred: true }, encounterContext, screen: "intercept", log: [...newLog, `Day ${state.day + 1}: ${enemy.name} intercepts you!`] };
          }
        }

        // Random event (skip on final day)
        if (newDays >= 1 && Math.random() < 0.1) {
          const event = L.triggerRandomEvent(state);
          if (event) return { ...state, wind: newWind, screen: "event", day: state.day + 1, sailingDaysLeft: newDays, gold: newGold, reputation: newRep, crew: { ...state.crew, roster: updatedRoster, morale: newMorale }, activeEvent: event, log: [...newLog, `Day ${state.day + 1}: ${event.title}`] };
        }

        return { ...state, wind: newWind, day: state.day + 1, sailingDaysLeft: newDays, gold: newGold, reputation: newRep, crew: { ...state.crew, roster: updatedRoster, morale: newMorale } };
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
          return { ...state, currentPort: state.destination, destination: null, sailingDaysLeft: 0, encounterContext, screen: "intercept", log: [...state.log, logMsg] };
        }

        // Normal entry
        return { ...state, currentPort: state.destination, destination: null, sailingDaysLeft: 0, screen: "port", missions: L.generateMissions(state.destination, state), log: [...state.log, `Arrived at ${port.name}.`] };
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
        return { ...state, gold: state.gold - ship.cost, ship: { type: action.shipType, name: ship.name, hull: ship.maxHull, cannons: ship.cannons, upgrades: [] }, crew: { ...state.crew, roster: newRoster, max: ship.maxCrew }, log: [...state.log, `Purchased ${ship.name} for ${ship.cost}g.`] };
      }

      case A.BUY_UPGRADE: {
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
        const newMembers = L.generateRoster(action.count, portFaction);
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
      case A.REFRESH_MISSIONS: return { ...state, missions: L.generateMissions(state.currentPort, state) };

      case A.TAKE_MISSION: {
        const mission = action.mission;
        if (mission.type === "combat" && mission.enemy) return { ...state, activeMission: mission, encounterContext: L.buildEncounterContext(state, "mission_combat", mission.enemy), screen: "intercept", log: [...state.log, `Accepted mission: ${mission.name}.`] };
        return { ...state, activeMission: { ...mission, encounterOccurred: false }, log: [...state.log, `Accepted mission: ${mission.name}.`] };
      }

      case A.COMPLETE_MISSION: {
        const mission = state.activeMission;
        if (!mission) return state;
        if (mission.targetPort && state.currentPort !== mission.targetPort) {
          return { ...state };
        }

        // Reputation-based gold multiplier
        const rep = state.reputation[state.currentPort] ?? 50;
        const perk = L.getRepPerk(rep);
        const baseGold = mission.gold;
        const finalGold = Math.floor(baseGold * perk.missionMult);
        const goldDelta = finalGold - baseGold;
        const bonusNote = goldDelta > 0 ? ` (+${goldDelta}g ${perk.tier} bonus)`
                        : goldDelta < 0 ? ` (${Math.abs(goldDelta)}g ${perk.tier} penalty)` : "";

        const newRep = L.applyReputationImpact(state, mission.repImpact);

        // Infamy gain
        const infamyGain = mission.infamyGain || 0;
        const oldInfamy = state.infamy ?? 0;
        const newInfamy = Math.min(999, oldInfamy + infamyGain);
        const crossedThreshold = L.getInfamyLabel(newInfamy) !== L.getInfamyLabel(oldInfamy);

        const newLog = [
          ...state.log,
          `Completed mission: ${mission.name}. +${finalGold}g${bonusNote}, +${mission.fame} fame.`
        ];
        if (infamyGain > 0) newLog.push(`+${infamyGain} infamy.`);
        if (crossedThreshold) newLog.push(`Your name grows darker. You are now ${L.getInfamyLabel(newInfamy)}.`);

        return {
          ...state,
          gold: state.gold + finalGold,
          fame: state.fame + mission.fame,
          infamy: newInfamy,
          reputation: newRep,
          activeMission: null,
          missions: L.generateMissions(state.currentPort, state),
          log: newLog
        };
      }

      case A.ABANDON_MISSION: return { ...state, activeMission: null, reputation: L.applyReputationImpact(state, { [state.activeMission?.faction || "pirate"]: -10 }), log: [...state.log, `Abandoned mission: ${state.activeMission?.name}.`] };

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
        };
        return { ...state, encounterContext: null, battleState: bs, screen: "battle" };
      }

      case A.INTERCEPT_FLEE: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const { player, enemy } = ctx.options.flee.speedCheck;
        const playerRoll = player + L.roll(3);
        const enemyRoll  = enemy  + L.roll(3);
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
        let s = { ...state, encounterContext: null };
        if (consequence.loseCargoPercent && s.cargo) s.gold = Math.max(0, s.gold - Math.round(s.gold * consequence.loseCargoPercent / 100));
        if (consequence.loseContraband && s.cargo) s.cargo = { ...s.cargo, contraband: 0 };
        if (consequence.goldFine) s.gold = Math.max(0, s.gold - consequence.goldFine);
        if (consequence.loseGoldPercent) s.gold = Math.max(0, Math.round(s.gold * (1 - consequence.loseGoldPercent / 100)));
        if (consequence.moralePenalty) s.crew = { ...s.crew, morale: Math.max(0, s.crew.morale - consequence.moralePenalty) };
        if (consequence.loseDays) { s.day += consequence.loseDays; }
        if (consequence.rep_loss) {
          const portKey = state.destination ?? state.currentPort;
          s.reputation = { ...s.reputation, [portKey]: Math.max(0, (s.reputation[portKey] ?? 20) - consequence.rep_loss) };
        }
        s.screen = state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port";
        return { ...s, log: [...state.log, "You surrendered. The consequences were steep."] };
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
        if (battleState.phase === "defeat") {
          const returnPort = state.previousPort || state.currentPort;
          const portName = PORTS[returnPort]?.name || "a nearby port";
          return { ...state, battleState: null, screen: "port", currentPort: returnPort, destination: null, sailingDaysLeft: 0, sailingDaysTotal: 0, log: [...state.log, `Defeated in battle and washed ashore at ${portName}.`] };
        }
        if (battleState.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0) return { ...state, battleState: null, screen: "sailing" };
        return { ...state, battleState: null, screen: battleState.returnScreen || "port" };
      }

      // ── EVENTS ──────────────────────────────────────────────────

      case A.RESOLVE_EVENT: {
        const event = state.activeEvent;
        if (!event) return state;
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
        return newState;
      }

      // --- SAVE/LOAD ---
      case A.SAVE_GAME: { localStorage.setItem("piratesSave", JSON.stringify(state)); return { ...state, log: [...state.log, "Game saved."] }; }
      case A.LOAD_GAME: {
        try {
          const raw = localStorage.getItem("piratesSave");
          if (!raw) return { ...state, log: [...state.log, "No saved game found."] };
          const loaded = JSON.parse(raw);
          return { ...loaded, screen: "port", battleState: null, activeEvent: null, encounterContext: null };
        } catch (e) {
          return { ...state, log: [...state.log, "Failed to load save — corrupted data."] };
        }
      }

      default: return state;
    }
  };
  return { A, initialState, reducer };
})();