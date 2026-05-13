// ═══════════════════════════════════════════════════════════════════
//  engine.js — COMPLETE, FIXED VERSION
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
    REFRESH_MISSIONS: "REFRESH_MISSIONS",
    TAKE_MISSION: "TAKE_MISSION",
    COMPLETE_MISSION: "COMPLETE_MISSION",
    ABANDON_MISSION: "ABANDON_MISSION",

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
    activeEvent: null
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
              newState.ship = {
                ...newState.ship,
                type: shipType,
                name: SHIPS[shipType].name,
                hull: SHIPS[shipType].maxHull,
                cannons: SHIPS[shipType].cannons
              };
              newState.crew.max = SHIPS[shipType].maxCrew;
              newState.crew.current = Math.min(newState.crew.current, SHIPS[shipType].maxCrew);
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

        // Deduct crew wages
        const wages = L.payCrewWages(state);
        const newGold = Math.max(0, state.gold - wages);
        if (wages > 0) newLog.push(`Paid crew wages: -${wages}g.`);

        // Reputation decay
        const newRep = L.decayReputation(state);

        // Morale decay
        const newMorale = state.crew.morale < 30 ? Math.max(0, state.crew.morale - 1) : state.crew.morale;

        // Smuggle mission: ONE intercept
        if (state.activeMission?.type === "smuggle" && !state.activeMission.encounterOccurred) {
          const interceptChance = state.activeMission.interceptChance || 0.5;
          if (Math.random() < interceptChance) {
            return {
              ...state,
              day: state.day + 1,
              sailingDaysLeft: newDays,
              gold: newGold,
              reputation: newRep,
              crew: { ...state.crew, morale: newMorale },
              activeMission: { ...state.activeMission, encounterOccurred: true },
              battleState: {
                phase: "player_turn",
                playerHull: state.ship.hull,
                playerCrew: state.crew.current,
                enemy: state.activeMission.enemy,
                enemyHull: state.activeMission.enemy.hull,
                enemyCrew: state.activeMission.enemy.crew,
                round: 1,
                log: [`Mission: ${state.activeMission.name} - Intercepted!`],
                returnScreen: "sailing"
              },
              screen: "battle",
              log: [...newLog, `Day ${state.day + 1}: ${state.activeMission.enemy.name} intercepts you!`]
            };
          }
        }

        // Random event (10% chance)
        if (Math.random() < 0.1) {
          const event = L.triggerRandomEvent(state);
          if (event) {
            return {
              ...state,
              screen: "event",          // ← show the event screen
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

        // Normal sailing day
        return {
          ...state,
          day: state.day + 1,
          sailingDaysLeft: newDays,
          gold: newGold,
          reputation: newRep,
          crew: { ...state.crew, morale: newMorale },
          log: [...newLog, `Day ${state.day + 1}: Sailing to ${PORTS[state.destination].name}...`]
        };
      }

      case A.ENTER_PORT: {
        const port = PORTS[state.destination];
        const portFaction = port.faction;
        const playerRep = state.reputation[state.destination] || 50;

        // Hostile port: Direct combat (reputation < 10)
        if (playerRep < 10) {
          return {
            ...state,
            currentPort: state.destination,
            destination: null,
            sailingDaysLeft: 0,
            battleState: {
              phase: "player_turn",
              playerHull: state.ship.hull,
              playerCrew: state.crew.current,
              enemy: {
                name: `${port.name} Guards`,
                hull: 150,
                cannons: 15,
                crew: 40,
                faction: portFaction
              },
              enemyHull: 150,
              enemyCrew: 40,
              round: 1,
              log: [`${port.name} guards attack your ship!`],
              returnScreen: "port"
            },
            screen: "battle",
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
          return { ...state, log: [...state.log, "Not enough gold to repair!"] };
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
          return { ...state, log: [...state.log, "Cannot purchase this ship!"] };
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
          return { ...state, log: [...state.log, "Upgrade not found!"] };
        }
        if (state.gold < upgrade.cost) {
          return { ...state, log: [...state.log, "Not enough gold!"] };
        }
        if (state.ship.upgrades.includes(action.upgradeKey)) {
          return { ...state, log: [...state.log, "Already installed!"] };
        }
        if (!SHIPS[state.ship.type].upgradeable.includes(action.upgradeKey)) {
          return { ...state, log: [...state.log, "Cannot install on this ship!"] };
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

      case A.HIRE_CREW: {
        const cost = action.count * 50;
        const shipStats = SHIPS[state.ship.type];
        if (state.crew.current >= shipStats.maxCrew) {
          return { ...state, log: [...state.log, "Ship is already at full capacity."] };
        }
        if (state.gold < cost) {
          return { ...state, log: [...state.log, "Not enough gold to hire crew!"] };
        }
        const newCrew = Math.min(state.crew.current + action.count, shipStats.maxCrew);
        return {
          ...state,
          gold: state.gold - cost,
          crew: { ...state.crew, current: newCrew },
          log: [...state.log, `Hired ${action.count} crew for ${cost}g.`]
        };
      }

      // --- MISSIONS ---
      case A.REFRESH_MISSIONS: {
        return {
          ...state,
          missions: L.generateMissions(state.currentPort, state),
          log: [...state.log, "Refreshed mission board."]
        };
      }

      case A.TAKE_MISSION: {
        const mission = action.mission;

        // Combat missions: instant battle
        if (mission.type === "combat" && mission.enemy) {
          return {
            ...state,
            activeMission: mission,
            battleState: {
              phase: "player_turn",
              playerHull: state.ship.hull,
              playerCrew: state.crew.current,
              enemy: mission.enemy,
              enemyHull: mission.enemy.hull,
              enemyCrew: mission.enemy.crew,
              round: 1,
              log: [`Mission: ${mission.name} - Combat begins!`],
              returnScreen: "port"
            },
            screen: "battle",
            log: [...state.log, `Accepted mission: ${mission.name}.`]
          };
        }

        // Normal missions
        return {
          ...state,
          activeMission: { ...mission, encounterOccurred: false },
          log: [...state.log, `Accepted mission: ${mission.name}.`]
        };
      }

      case A.COMPLETE_MISSION: {
        const mission = state.activeMission;
        if (!mission) return state;

        // Check if at target port (for non-combat missions)
        if (mission.targetPort && state.currentPort !== mission.targetPort) {
          return { ...state, log: [...state.log, "Mission not completed: Wrong port!"] };
        }

        // Apply rewards
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

      // --- COMBAT ---
      case A.BATTLE_ACTION: {
      const outcome = L.resolveCombatAction(state, action.action);
      const newLog = [...state.battleState.log];

      // --- Apply morale delta ---
      const newMorale = Math.max(0, Math.min(100, state.crew.morale + (outcome.moraleDelta || 0)));

      // --- Instant victory (grapple success) ---
      if (outcome.instantVictory) {
        const newGold = state.gold + (outcome.goldReward || 0);
        return {
          ...state,
          gold: newGold,
          ship: { ...state.ship, hull: state.battleState.playerHull },
          crew: { ...state.crew, morale: newMorale },
          battleState: {
            ...state.battleState,
            phase: "victory",
            goldReward: outcome.goldReward,   // so the screen can show it
            log: [...newLog, `Player: ${action.action}. Instant victory! +${outcome.goldReward}g`]
          }
        };
      }

      // --- Apply damage ---
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

      // --- Check for victory ---
      if (newBattleState.enemyHull <= 0) {
        newBattleState.phase = "victory";
        newBattleState.goldReward = outcome.goldReward || 0;   // 0 for non-grapple
        return {
          ...state,
          gold: state.gold + (outcome.goldReward || 0),
          ship: { ...state.ship, hull: newBattleState.playerHull },
          crew: { ...state.crew, current: newBattleState.playerCrew, morale: newMorale },
          battleState: newBattleState
        };
      }

      // --- Check for defeat ---
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

      // --- Check for flee ---
      if (outcome.fled) {
        newBattleState.phase = "fled";
        return {
          ...state,
          ship: { ...state.ship, hull: newBattleState.playerHull },
          crew: { ...state.crew, current: newBattleState.playerCrew, morale: newMorale },
          battleState: newBattleState
        };
      }

      // --- Normal round (continue fighting) ---
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

        // Auto-complete combat/assault missions on victory
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

        // Return to sailing if fled
        if (battleState.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0) {
          return {
            ...state,
            battleState: null,
            screen: "sailing"
          };
        }

        // Default: return to port
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

        // Apply event outcome
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
        if (choice.outcome.battle) {
          newState.battleState = {
            phase: "player_turn",
            playerHull: state.ship.hull,
            playerCrew: state.crew.current,
            enemy: choice.outcome.battle.enemy,
            enemyHull: choice.outcome.battle.enemy.hull,
            enemyCrew: choice.outcome.battle.enemy.crew,
            round: 1,
            log: [`Event: ${event.title} - Combat begins!`],
            returnScreen: "sailing"
          };
          newState.screen = "battle";
        }

        // ---- Return to sailing after event (unless it led to battle) ----
        if (!choice.outcome.battle) {
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

      // --- DEFAULT ---
      default: {
        console.warn(`Unknown action type: ${action.type}`);
        return state;
      }
    }
  };

  // Expose everything
  return {
    A,
    initialState,
    reducer
  };
})();