// ═══════════════════════════════════════════════════════════════════
//  engine.js — COMPLETE (intercept screen, morale, wind, log cleanup)
//  State management: initialState, reducer, action constants.
//  Exposed as window.E for global access.
// ═══════════════════════════════════════════════════════════════════

window.E = (() => {
  const { PORTS, SHIPS, FACTIONS, UPGRADES, STARTS } = window.D;
  const L = window.L;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ACTION CONSTANTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const A = {
    // Navigation
    NAVIGATE: "NAVIGATE",
    SAIL_TO: "SAIL_TO",
    ADVANCE_DAY: "ADVANCE_DAY",
    ENTER_PORT: "ENTER_PORT",

    // Game
    START_GAME: "START_GAME",
    SAVE_GAME: "SAVE_GAME",
    LOAD_GAME: "LOAD_GAME",

    // Port
    REPAIR: "REPAIR",
    BUY_SHIP: "BUY_SHIP",
    BUY_UPGRADE: "BUY_UPGRADE",
    HIRE_CREW: "HIRE_CREW",
    RAISE_MORALE: "RAISE_MORALE",
    REFRESH_MISSIONS: "REFRESH_MISSIONS",
    TAKE_MISSION: "TAKE_MISSION",
    COMPLETE_MISSION: "COMPLETE_MISSION",
    ABANDON_MISSION: "ABANDON_MISSION",

    // Intercept (pre-combat)
    INTERCEPT_FIGHT:     "INTERCEPT_FIGHT",
    INTERCEPT_FLEE:      "INTERCEPT_FLEE",
    INTERCEPT_PARLEY:    "INTERCEPT_PARLEY",
    INTERCEPT_BRIBE:     "INTERCEPT_BRIBE",
    INTERCEPT_SURRENDER: "INTERCEPT_SURRENDER",

    // Combat
    BATTLE_ACTION: "BATTLE_ACTION",
    DISMISS_BATTLE: "DISMISS_BATTLE",

    // Events
    RESOLVE_EVENT: "RESOLVE_EVENT",
    SET_WIND: "SET_WIND"
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
    currentPort: "port_royal",
    destination: null,
    sailingDaysLeft: 0,
    sailingDaysTotal: 0,
    wind: { angle: 45, speed: 10 },
    ship: {
      type: "sloop",
      name: "Sea Dog",
      hull: 100,
      cannons: 10,
      upgrades: []
    },
    crew: {
      current: 30,
      max: 50,
      morale: 80
    },
    missions: [],
    activeMission: null,
    reputation: {},
    battleState: null,
    activeEvent: null,
    encounterContext: null,   // for intercept screen
  };

  // Initialize reputation for all ports in initialState
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
        if (!start) {
          console.error("Invalid scenario ID:", action.scenarioId);
          return { ...initialState, screen: "start" };
        }

        const newState = {
          ...initialState,
          screen: "port",
          currentPort: "port_royal",
          day: 1,
          log: [`Started as ${start.name}.`],
          reputation: {}
        };

        // Apply bonuses
        start.bonuses.forEach(bonus => {
          if (bonus.includes("gold")) {
            const goldBonus = parseInt(bonus.replace(/[^0-9]/g, "")) || 0;
            newState.gold += goldBonus;
          } else if (bonus.includes("ship:")) {
            const shipType = bonus.split(":")[1].trim();
            if (SHIPS[shipType]) {
              // Spread crew to avoid mutation (P0.4 fix)
              newState.ship = {
                ...newState.ship,
                type: shipType,
                name: SHIPS[shipType].name,
                hull: SHIPS[shipType].maxHull,
                cannons: SHIPS[shipType].cannons
              };
              newState.crew = {
                ...newState.crew,
                max: SHIPS[shipType].maxCrew,
                current: Math.min(newState.crew.current, SHIPS[shipType].maxCrew)
              };
            }
          } else if (bonus.includes("reputation with")) {
            const faction = bonus.split("with")[1].trim().toLowerCase();
            const repBonus = parseInt(bonus.match(/\+\d+/)?.[0] || 0);
            Object.keys(PORTS).forEach(portKey => {
              if (PORTS[portKey].faction === faction) {
                newState.reputation[portKey] = (newState.reputation[portKey] || 50) + repBonus;
              }
            });
          }
        });

        // Initialize reputation for all ports (default: 50)
        Object.keys(PORTS).forEach(portKey => {
          if (newState.reputation[portKey] === undefined) {
            newState.reputation[portKey] = 50;
          }
        });

        return newState;
      }

      // --- NAVIGATION ---
      case A.NAVIGATE: {
        return { ...state, screen: action.screen };
      }

      case A.SAIL_TO: {
        const days = L.travelDays(state.currentPort, action.port, state);
        return {
          ...state,
          destination: action.port,
          sailingDaysLeft: days,
          sailingDaysTotal: days,
          screen: "sailing",
          log: [...state.log, `Setting sail for ${PORTS[action.port].name}. ${days} day${days !== 1 ? "s" : ""} voyage.`]
        };
      }

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

        // Deduct crew wages (no log to reduce spam)
        const wages = L.payCrewWages(state);
        const newGold = Math.max(0, state.gold - wages);

        // Reputation decay (every 2 days, never below 50)
        const newRep = (state.day % 2 === 0)
          ? L.decayReputation(state)
          : state.reputation;

        // Morale decay (only if already below 30)
        const newMorale = state.crew.morale < 30
          ? Math.max(0, state.crew.morale - 1)
          : state.crew.morale;

        // Smuggle mission intercept
        if (state.activeMission?.type === "smuggle" && !state.activeMission.encounterOccurred) {
          const interceptChance = state.activeMission.interceptChance || 0.5;
          if (Math.random() < interceptChance) {
            const enemy = state.activeMission.enemy;
            const encounterContext = L.buildEncounterContext(state, "smuggling_caught", enemy);
            return {
              ...state,
              wind: newWind,
              day: state.day + 1,
              sailingDaysLeft: newDays,
              gold: newGold,
              reputation: newRep,
              crew: { ...state.crew, morale: newMorale },
              activeMission: { ...state.activeMission, encounterOccurred: true },
              encounterContext,
              screen: "intercept",
              log: [...newLog, `Day ${state.day + 1}: ${enemy.name} intercepts you!`]
            };
          }
        }

        // Random event (10% chance)
        if (Math.random() < 0.1) {
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
              crew: { ...state.crew, morale: newMorale },
              activeEvent: event,
              log: [...newLog, `Day ${state.day + 1}: ${event.title}`]
            };
          }
        }

        // Normal sailing day (no log entry)
        return {
          ...state,
          wind: newWind,
          day: state.day + 1,
          sailingDaysLeft: newDays,
          gold: newGold,
          reputation: newRep,
          crew: { ...state.crew, morale: newMorale }
        };
      }

      case A.ENTER_PORT: {
        const port = PORTS[state.destination];
        const portFaction = port.faction;
        const playerRep = state.reputation[state.destination] ?? 50;

        // Hostile port: intercept screen (may lead to battle)
        if (playerRep < 10) {
          const enemy = {
            name: `${port.name} Guards`,
            hull: 150,
            cannons: 15,
            crew: 40,
            faction: portFaction,
            gold: 300,
          };
          const encounterContext = L.buildEncounterContext(state, "hostile_port_entry", enemy);
          return {
            ...state,
            currentPort: state.destination,
            destination: null,
            sailingDaysLeft: 0,
            encounterContext,
            screen: "intercept",
            log: [...state.log, `Arrived at ${port.name}. Hostile port!`]
          };
        }

        // Normal port entry
        return {
          ...state,
          currentPort: state.destination,
          destination: null,
          sailingDaysLeft: 0,
          screen: "port",
          missions: L.generateMissions(state.destination, state),
          log: [...state.log, `Arrived at ${port.name}.`]
        };
      }

      // --- PORT ACTIONS ---
      case A.REPAIR: {
        const shipStats = L.getShipStats(state);
        const cost = (shipStats.maxHull - state.ship.hull) * 2;
        if (state.gold < cost) {
          return { ...state };  // no log
        }
        return {
          ...state,
          gold: state.gold - cost,
          ship: { ...state.ship, hull: shipStats.maxHull },
          log: [...state.log, `Repaired ship for ${cost}g.`]
        };
      }

      case A.BUY_SHIP: {
        const ship = SHIPS[action.shipType];
        if (!ship || state.gold < ship.cost) {
          return { ...state };  // no log
        }
        return {
          ...state,
          gold: state.gold - ship.cost,
          ship: {
            type: action.shipType,
            name: ship.name,
            hull: ship.maxHull,
            cannons: ship.cannons,
            upgrades: []
          },
          crew: {
            ...state.crew,
            max: ship.maxCrew,
            current: Math.min(state.crew.current, ship.maxCrew)
          },
          log: [...state.log, `Purchased ${ship.name} for ${ship.cost}g.`]
        };
      }

      case A.BUY_UPGRADE: {
        const upgrade = UPGRADES[action.upgradeKey];
        if (!upgrade) {
          return { ...state };
        }
        if (state.gold < upgrade.cost) {
          return { ...state };
        }
        if (state.ship.upgrades.includes(action.upgradeKey)) {
          return { ...state };
        }
        if (!SHIPS[state.ship.type].upgradeable.includes(action.upgradeKey)) {
          return { ...state };
        }
        return {
          ...state,
          gold: state.gold - upgrade.cost,
          ship: {
            ...state.ship,
            upgrades: [...state.ship.upgrades, action.upgradeKey]
          },
          log: [...state.log, `Installed ${upgrade.name} for ${upgrade.cost}g.`]
        };
      }

      // --- CREW MANAGEMENT & MORALE ---
      case A.HIRE_CREW: {
        const cost = action.count * 50;
        const shipStats = SHIPS[state.ship.type];
        if (state.crew.current >= state.crew.max) {
          return { ...state };  // no log
        }
        if (state.gold < cost) {
          return { ...state };
        }
        const newCrew = Math.min(state.crew.current + action.count, state.crew.max);
        return {
          ...state,
          gold: state.gold - cost,
          crew: { ...state.crew, current: newCrew },
          log: [...state.log, `Hired ${action.count} crew for ${cost}g.`]
        };
      }

      case A.RAISE_MORALE: {
        const cost = state.crew.current * 5;
        if (state.gold < cost) {
          return { ...state };
        }
        if (state.crew.morale >= 100) {
          return { ...state };
        }
        const newMorale = Math.min(100, state.crew.morale + 5);
        return {
          ...state,
          gold: state.gold - cost,
          crew: { ...state.crew, morale: newMorale },
          log: [...state.log, `Bought drinks for the crew: -${cost}g. Morale +5.`]
        };
      }

      // --- MISSIONS ---
      case A.REFRESH_MISSIONS: {
        return {
          ...state,
          missions: L.generateMissions(state.currentPort, state)
          // no log
        };
      }

      case A.TAKE_MISSION: {
        const mission = action.mission;

        // Combat missions: go through intercept screen
        if (mission.type === "combat" && mission.enemy) {
          return {
            ...state,
            activeMission: mission,
            encounterContext: L.buildEncounterContext(state, "mission_combat", mission.enemy),
            screen: "intercept",
            log: [...state.log, `Accepted mission: ${mission.name}.`]
          };
        }

        // Non-combat missions (trade, escort, etc.)
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
          return { ...state };  // no log
        }

        const newRep = L.applyReputationImpact(state, mission.repImpact);
        return {
          ...state,
          gold: state.gold + mission.gold,
          fame: state.fame + mission.fame,
          reputation: newRep,
          activeMission: null,
          missions: L.generateMissions(state.currentPort, state),
          log: [...state.log, `Completed mission: ${mission.name}. +${mission.gold}g, +${mission.fame} fame.`]
        };
      }

      case A.ABANDON_MISSION: {
        return {
          ...state,
          activeMission: null,
          reputation: L.applyReputationImpact(state, { [state.activeMission?.faction || "pirate"]: -10 }),
          log: [...state.log, `Abandoned mission: ${state.activeMission?.name}.`]
        };
      }

      // --- INTERCEPT ACTIONS ---
      case A.INTERCEPT_FIGHT: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const enemy = ctx.enemy;
        const bs = {
          phase: "player_turn",
          playerHull: state.ship.hull,
          playerCrew: state.crew.current,
          enemy: enemy,
          enemyHull: enemy.hull,
          enemyCrew: enemy.crew,
          round: 1,
          log: [`You engage the ${enemy.name}!`],
          returnScreen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port",
        };
        return {
          ...state,
          encounterContext: null,
          battleState: bs,
          screen: "battle",
        };
      }

      case A.INTERCEPT_FLEE: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const { player, enemy } = ctx.options.flee.speedCheck;
        const playerRoll = player + L.roll(3);
        const enemyRoll  = enemy  + L.roll(3);
        if (playerRoll >= enemyRoll) {
          return {
            ...state,
            encounterContext: null,
            screen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port",
            log: [...state.log, "You pulled clear — the enemy couldn't keep up."]
          };
        }
        // Failed flee → battle
        const enemyObj = ctx.enemy;
        const bs = {
          phase: "player_turn",
          playerHull: state.ship.hull,
          playerCrew: state.crew.current,
          enemy: enemyObj,
          enemyHull: enemyObj.hull,
          enemyCrew: enemyObj.crew,
          round: 1,
          log: ["Escape failed! The enemy closes in."],
          returnScreen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port",
        };
        return {
          ...state,
          encounterContext: null,
          battleState: bs,
          screen: "battle",
          log: [...state.log, "Failed to escape — battle unavoidable."]
        };
      }

      case A.INTERCEPT_PARLEY: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const rep = state.reputation[state.destination ?? state.currentPort] ?? 20;
        const success = L.roll(100) <= Math.min(80, rep + 20);
        if (success) {
          const portKey = state.destination ?? state.currentPort;
          return {
            ...state,
            encounterContext: null,
            screen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port",
            reputation: {
              ...state.reputation,
              [portKey]: Math.min(100, (state.reputation[portKey] ?? 20) + 3),
            },
            log: [...state.log, "Parley successful. They let you pass."]
          };
        }
        // Failed parley → battle
        const enemyObj = ctx.enemy;
        const bs = {
          phase: "player_turn",
          playerHull: state.ship.hull,
          playerCrew: state.crew.current,
          enemy: enemyObj,
          enemyHull: enemyObj.hull,
          enemyCrew: enemyObj.crew,
          round: 1,
          log: ["Parley failed — they attack!"],
          returnScreen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port",
        };
        return {
          ...state,
          encounterContext: null,
          battleState: bs,
          screen: "battle",
          log: [...state.log, "Parley failed. Battle unavoidable."]
        };
      }

      case A.INTERCEPT_BRIBE: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const cost = ctx.options.bribe.cost;
        const portKey = state.destination ?? state.currentPort;
        return {
          ...state,
          encounterContext: null,
          gold: state.gold - cost,
          reputation: {
            ...state.reputation,
            [portKey]: Math.max(0, (state.reputation[portKey] ?? 20) - 2),
          },
          screen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port",
          log: [...state.log, `Bribed them with ${cost}g. They looked the other way.`]
        };
      }

      case A.INTERCEPT_SURRENDER: {
        const ctx = state.encounterContext;
        if (!ctx) return state;
        const consequence = ctx.options.surrender.consequence;
        let s = { ...state, encounterContext: null };

        if (consequence.loseCargoPercent) {
          if (s.cargo) {
            s.gold = Math.max(0, s.gold - Math.round(s.gold * consequence.loseCargoPercent / 100));
          }
        }
        if (consequence.loseContraband && s.cargo) {
          s.cargo = { ...s.cargo, contraband: 0 };
        }
        if (consequence.goldFine) {
          s.gold = Math.max(0, s.gold - consequence.goldFine);
        }
        if (consequence.loseGoldPercent) {
          s.gold = Math.max(0, Math.round(s.gold * (1 - consequence.loseGoldPercent / 100)));
        }
        if (consequence.moralePenalty) {
          s.crew = { ...s.crew, morale: Math.max(0, s.crew.morale - consequence.moralePenalty) };
        }
        if (consequence.loseDays) {
          s.day = s.day + consequence.loseDays;
        }
        if (consequence.rep_loss) {
          const portKey = state.destination ?? state.currentPort;
          s.reputation = {
            ...s.reputation,
            [portKey]: Math.max(0, (s.reputation[portKey] ?? 20) - consequence.rep_loss)
          };
        }

        s.screen = state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port";
        return {
          ...s,
          log: [...state.log, "You surrendered. The consequences were steep."]
        };
      }

      // --- COMBAT ---
      case A.BATTLE_ACTION: {
        const outcome = L.resolveCombatAction(state, action.action);
        const newLog = [...state.battleState.log];

        // Apply morale delta
        const newMorale = Math.max(0, Math.min(100, state.crew.morale + (outcome.moraleDelta || 0)));

        // Instant victory (grapple success)
        if (outcome.instantVictory) {
          const newGold = state.gold + (outcome.goldReward || 0);
          const newRep = L.applyReputationImpact(state, { [state.battleState.enemy.faction]: -5 });
          return {
            ...state,
            gold: newGold,
            reputation: newRep,
            ship: { ...state.ship, hull: state.battleState.playerHull },
            crew: { ...state.crew, morale: newMorale },
            battleState: {
              ...state.battleState,
              phase: "victory",
              goldReward: outcome.goldReward,
              log: [...newLog, `Player: ${action.action}. Instant victory! +${outcome.goldReward}g`]
            }
          };
        }

        // Normal damage
        const newBattleState = {
          ...state.battleState,
          playerHull: Math.max(0, state.battleState.playerHull - outcome.enemy.hullDamage),
          enemyHull: Math.max(0, state.battleState.enemyHull - outcome.player.hullDamage),
          playerCrew: Math.max(0, state.battleState.playerCrew - outcome.enemy.crewLoss),
          enemyCrew: Math.max(0, state.battleState.enemyCrew - outcome.player.crewLoss),
          round: state.battleState.round + 1,
          phase: "npc_turn",
          log: [...newLog, `Player: ${action.action}. Enemy: ${L.getNPCAction(state.battleState.enemy)}.`]
        };

        // Victory
        if (newBattleState.enemyHull <= 0) {
          newBattleState.phase = "victory";
          newBattleState.goldReward = outcome.goldReward || 0;
          const newRep = L.applyReputationImpact(state, { [state.battleState.enemy.faction]: -5 });
          return {
            ...state,
            gold: state.gold + (outcome.goldReward || 0),
            reputation: newRep,
            ship: { ...state.ship, hull: newBattleState.playerHull },
            crew: { ...state.crew, current: newBattleState.playerCrew, morale: newMorale },
            battleState: newBattleState
          };
        }

        // Defeat
        if (newBattleState.playerHull <= 0) {
          newBattleState.phase = "defeat";
          newBattleState.log.push("Your ship is destroyed! Returning to port.");
          return {
            ...state,
            ship: { ...state.ship, hull: newBattleState.playerHull },
            crew: { ...state.crew, current: newBattleState.playerCrew, morale: newMorale },
            battleState: newBattleState,
            screen: "port",
            destination: null,
            sailingDaysLeft: 0,
            sailingDaysTotal: 0
          };
        }

        // Flee
        if (outcome.fled) {
          newBattleState.phase = "fled";
          return {
            ...state,
            ship: { ...state.ship, hull: newBattleState.playerHull },
            crew: { ...state.crew, current: newBattleState.playerCrew, morale: newMorale },
            battleState: newBattleState
          };
        }

        // Normal round
        return {
          ...state,
          ship: { ...state.ship, hull: newBattleState.playerHull },
          crew: { ...state.crew, current: newBattleState.playerCrew, morale: newMorale },
          battleState: newBattleState
        };
      }

      case A.DISMISS_BATTLE: {
        const { battleState } = state;
        const returnScreen = battleState.returnScreen || "port";

        if (battleState.phase === "victory" && state.activeMission) {
          if (state.activeMission.type === "combat" || state.activeMission.type === "assault") {
            const mission = state.activeMission;
            const newRep = L.applyReputationImpact(state, mission.repImpact);
            return {
              ...state,
              gold: state.gold + mission.gold,
              fame: state.fame + mission.fame,
              reputation: newRep,
              activeMission: null,
              missions: L.generateMissions(state.currentPort, state),
              battleState: null,
              screen: returnScreen,
              log: [...state.log, `Completed mission: ${mission.name}. +${mission.gold}g, +${mission.fame} fame.`]
            };
          }
        }

        if (battleState.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0) {
          return {
            ...state,
            battleState: null,
            screen: "sailing"
          };
        }

        return {
          ...state,
          battleState: null,
          screen: returnScreen
        };
      }

      // --- EVENTS ---
      case A.RESOLVE_EVENT: {
        const event = state.activeEvent;
        if (!event) return state;

        const choice = event.choices[action.choiceIndex];
        const newState = { ...state, activeEvent: null };

        if (choice.outcome.log) {
          newState.log = [...state.log, choice.outcome.log];
        }
        if (choice.outcome.gold) {
          newState.gold = Math.max(0, state.gold + choice.outcome.gold);
        }
        if (choice.outcome.fame) {
          newState.fame += choice.outcome.fame;
        }
        if (choice.outcome.hullDamage) {
          newState.ship = {
            ...state.ship,
            hull: Math.max(0, state.ship.hull - choice.outcome.hullDamage)
          };
        }
        if (choice.outcome.crewLoss) {
          newState.crew = {
            ...state.crew,
            current: Math.max(0, state.crew.current - choice.outcome.crewLoss)
          };
        }
        if (choice.outcome.daysLost) {
          newState.day += choice.outcome.daysLost;
          newState.sailingDaysLeft = Math.max(0, state.sailingDaysLeft - choice.outcome.daysLost);
        }
        if (choice.outcome.repImpact) {
          newState.reputation = L.applyReputationImpact(state, choice.outcome.repImpact);
        }
        if (choice.outcome.moraleBonus) {
          newState.crew = {
            ...newState.crew,
            morale: Math.max(0, Math.min(100, newState.crew.morale + choice.outcome.moraleBonus))
          };
        }
        // Battle triggered by event
        if (choice.outcome.battle) {
          newState.encounterContext = L.buildEncounterContext(
            state, "patrol", choice.outcome.battle.enemy
          );
          newState.screen = "intercept";
        } else {
          // Return to sailing/port
          newState.screen = (state.destination && state.sailingDaysLeft > 0) ? "sailing" : "port";
        }

        return newState;
      }

      // --- SAVE/LOAD ---
      case A.SAVE_GAME: {
        localStorage.setItem("piratesSave", JSON.stringify(state));
        return { ...state, log: [...state.log, "Game saved."] };
      }

      case A.LOAD_GAME: {
        const saved = localStorage.getItem("piratesSave");
        if (!saved) {
          return { ...state, log: [...state.log, "No saved game found."] };
        }
        try {
          const loadedState = JSON.parse(saved);
          return {
            ...initialState,
            ...loadedState,
            screen: "port"
          };
        } catch (e) {
          return { ...state, log: [...state.log, "Failed to load game."] };
        }
      }

      default: {
        console.warn(`Unknown action type: ${action.type}`);
        return state;
      }
    }
  };

  return { A, initialState, reducer };
})();