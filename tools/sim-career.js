// @ts-check
// ═══════════════════════════════════════════════════════════════════
//  sim-career.js — Broadside Career Simulator (core)
//  Uses sim-legal.js for getLegalActions.
//  Exposes: window.Simulator
// ═══════════════════════════════════════════════════════════════════

(() => {
  "use strict";

  const VERSION = "0.8.1"; // bump after changes

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  1.  DETERMINISTIC PRNG (Mulberry32)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function mulberry32(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let _originalMathRandom = null;
  let _currentRandom = null;

  function setRunSeed(seed) {
    if (_originalMathRandom === null) {
      _originalMathRandom = Math.random;
    }
    const rng = mulberry32(seed >>> 0);
    _currentRandom = rng;
    Math.random = rng;
    console.log(`🌱 Seeded RNG with ${seed}`);
  }

  function restoreMathRandom() {
    if (_originalMathRandom !== null) {
      Math.random = _originalMathRandom;
      _originalMathRandom = null;
      _currentRandom = null;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  2.  HELPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const A = window.E.A;
  const L = window.L;
  const D = window.D;

  function createFreshState() {
    const state = JSON.parse(JSON.stringify(window.E.initialState));
    state.tutorialMode = "none";
    state.onboarding.enabled = false;
    state.onboarding.completed = true;
    return state;
  }

  function isGameOver(state) {
    return state.screen === "gameover" || !!state.gameOverReason;
  }

  function generateRunId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function isProgressing(prevState, nextState, action) {
    if (nextState.day !== prevState.day) return true;
    if (nextState.currentPort && nextState.currentPort !== prevState.currentPort) return true;
    if (nextState.destination && nextState.destination !== prevState.destination) return true;

    if (action?.type === A.BATTLE_ACTION) {
      const prevBattle = prevState.encounterSession?.battle;
      const nextBattle = nextState.encounterSession?.battle;
      if (prevBattle && nextBattle) {
        if (prevBattle.round !== nextBattle.round) return true;
        if (prevBattle.playerHull !== nextBattle.playerHull) return true;
        if (prevBattle.enemyHull !== nextBattle.enemyHull) return true;
        if (prevBattle.playerCrew !== nextBattle.playerCrew) return true;
        if (prevBattle.enemyCrew !== nextBattle.enemyCrew) return true;
        if (prevBattle.distance !== nextBattle.distance) return true;
        if (prevBattle.subPhase !== nextBattle.subPhase) return true;
      }
      return false;
    }

    const progressActions = [
      A.REPAIR,
      A.HIRE_CREW,
      A.RAISE_MORALE,
      A.TOP_UP_PROVISIONS,
      A.BUY_SHIP,
      A.BUY_EQUIPMENT,
      A.INSTALL_EQUIPMENT,
      A.REMOVE_EQUIPMENT,
      A.TAKE_MISSION,
      A.COMPLETE_MISSION,
      A.ABANDON_MISSION,
      A.DISMISS_BATTLE,
      A.TAKE_PLUNDER,
    ];

    if (progressActions.includes(action?.type)) {
      if (nextState.gold !== prevState.gold) return true;
      if (nextState.ship.hull !== prevState.ship.hull) return true;
      if (nextState.crew.roster.length !== prevState.crew.roster.length) return true;
      if (nextState.crew.morale !== prevState.crew.morale) return true;
      if (nextState.hold?.items?.food !== prevState.hold?.items?.food) return true;
      if (nextState.hold?.items?.water !== prevState.hold?.items?.water) return true;
      if (nextState.hold?.items !== prevState.hold?.items) return true;
      if (nextState.activeMission !== prevState.activeMission) return true;
      if (nextState.encounterSession !== prevState.encounterSession) return true;
    }
    return false;
  }

  function stateToString(state) {
    const gold = state.gold !== undefined && !isNaN(state.gold) ? state.gold : 'NaN';
    return `gold=${gold}, crew=${state.crew?.roster?.length || 0}, hull=${state.ship?.hull || 0}, screen=${state.screen}, dest=${state.destination || 'none'}, activeMission=${state.activeMission ? state.activeMission.name : 'null'}`;
  }

  // ── Wrapper for getLegalActions (from sim-legal.js) ──────────────
  function getLegalActions(state) {
    if (typeof window.Simulator.getLegalActions === 'function') {
      return window.Simulator.getLegalActions(state);
    } else {
      console.error("❌ getLegalActions not loaded – did you include sim-legal.js?");
      return { context: "unknown", actions: [] };
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  3.  OPERATIONAL SAFETY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function isOperationallySafe(state, routeDays, safetyMargin = 2) {
    if (state.ship.hull === 0) {
      const repairCost = L.shipRepairCost(state);
      if (state.gold < repairCost) {
        return { safe: false, reason: "Hull destroyed and not enough gold to repair" };
      }
    }
    const minCrew = L.getMinViableCrew(state.ship.type);
    if (state.crew.roster.length < minCrew) {
      const hireCost = (minCrew - state.crew.roster.length) * 50;
      if (state.gold < hireCost) {
        return { safe: false, reason: `Insufficient crew (${state.crew.roster.length}/${minCrew}) and not enough gold to hire` };
      }
    }
    if (routeDays && routeDays > 0) {
      const crew = state.crew.roster.length;
      if (crew > 0) {
        const daysOfFood = L.getDaysOfProvisions(state.hold?.items || {}, state).food;
        if (daysOfFood < routeDays + safetyMargin) {
          const market = state.portMarket;
          if (market && market.goods.food) {
            const needed = (routeDays + safetyMargin) - daysOfFood;
            const cost = needed * market.goods.food.buyFromPort;
            if (state.gold < cost) {
              return { safe: false, reason: `Not enough gold to buy provisions for the voyage (need ${cost}g)` };
            }
          } else {
            return { safe: false, reason: "Not enough provisions and cannot buy more" };
          }
        }
      }
    }
    if (L.isUnrecoverable(state).unrecoverable) {
      return { safe: false, reason: "State is unrecoverable" };
    }
    return { safe: true, reason: null };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  4.  TRACE & METRICS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  class TraceCollector {
    constructor() {
      this.decisions = [];
      this.events = [];
      this.encounters = [];
      this.battles = [];
      this.portVisits = [];
      this.snapshots = [];
      this.lastDecisions = [];
    }

    recordDecision(decision) {
      this.decisions.push(decision);
      this.lastDecisions.push(decision);
      if (this.lastDecisions.length > 10) this.lastDecisions.shift();
    }

    recordEvent(event) { this.events.push(event); }
    recordEncounter(encounter) { this.encounters.push(encounter); }
    recordBattle(battle) { this.battles.push(battle); }
    recordPortVisit(port) { this.portVisits.push(port); }

    // Now stores a lightweight snapshot (not full state) to keep JSON small
    recordSnapshot(state, label) {
      const summary = {
        day: state.day,
        label,
        gold: state.gold,
        crew: state.crew?.roster?.length || 0,
        hull: state.ship?.hull || 0,
        morale: state.crew?.morale || 0,
        ship: state.ship?.type || null,
        port: state.currentPort || null,
        screen: state.screen,
        mission: state.activeMission?.name || null,
      };
      this.snapshots.push(summary);
    }

    getLastDecisions(n = 5) {
      return this.lastDecisions.slice(-n);
    }

    getTrace() {
      return {
        decisions: this.decisions,
        events: this.events,
        encounters: this.encounters,
        battles: this.battles,
        portVisits: this.portVisits,
        snapshots: this.snapshots,
        lastDecisions: this.lastDecisions,
      };
    }
  }

  class MetricsCollector {
    constructor() {
      // Existing counters
      this.goldEarned = 0;
      this.goldSpent = 0;
      this.goldSpentByCategory = { repair: 0, crew: 0, provision: 0, mission: 0, trade: 0, equipment: 0, ship: 0, morale: 0, other: 0 };
      this.crewHired = 0;
      this.crewLost = 0;
      this.crewDeserted = 0;
      this.fameGained = 0;
      this.infamyGained = 0;
      this.battlesWon = 0;
      this.battlesLost = 0;
      this.battlesFled = 0;
      this.plunders = 0;
      this.trades = 0;
      this.smuggles = 0;
      this.missionsTaken = 0;
      this.missionsCompleted = 0;
      this.missionsFailed = 0;
      this.missionsAbandoned = 0;
      this.portsVisited = new Set();
      this.eventsEncountered = 0;
      this.patrols = 0;
      this.randomEncounters = 0;
      this.storms = 0;
      this.longestCrewTenure = 0;
      this.repairs = 0;
      this.crewHires = 0;
      this.portArrivals = 0;
      this.fightStarts = 0;
      this.fightWins = 0;
      this.fightLosses = 0;
      this.fightFlees = 0;
      this.boardings = 0;
      this.plunderActions = 0;

      // NEW: action counts for all important actions
      this.actionCounts = {
        [A.TAKE_MISSION]: 0,
        [A.COMPLETE_MISSION]: 0,
        [A.ABANDON_MISSION]: 0,
        [A.REFRESH_MISSIONS]: 0,
        [A.INTERCEPT_FIGHT]: 0,
        [A.INTERCEPT_FLEE]: 0,
        [A.BATTLE_ACTION]: 0,
        [A.DISMISS_BATTLE]: 0,
        [A.TAKE_PLUNDER]: 0,
        [A.SAIL_TO]: 0,
        [A.ENTER_PORT]: 0,
        [A.REPAIR]: 0,
        [A.HIRE_CREW]: 0,
        [A.RAISE_MORALE]: 0,
        [A.TOP_UP_PROVISIONS]: 0,
        [A.BUY_SHIP]: 0,
        [A.BUY_EQUIPMENT]: 0,
        [A.INSTALL_EQUIPMENT]: 0,
        [A.REMOVE_EQUIPMENT]: 0,
        [A.CONFIRM_TRADE]: 0,
        [A.RESOLVE_EVENT]: 0,
        [A.RESOLVE_INSPECTION]: 0,
        [A.PATROL_INSPECT]: 0,
        [A.NAVIGATE]: 0,
        [A.ADVANCE_DAY]: 0,
      };

      // NEW: key events list for detailed log
      this.keyEvents = [];
    }

    updateFromTransition(prevState, nextState, action) {
      // Track action counts
      if (this.actionCounts.hasOwnProperty(action.type)) {
        this.actionCounts[action.type]++;
      }

      // Track key events
      const day = nextState.day;
      if (action.type === A.TAKE_MISSION) {
        const missionName = action.mission?.name || 'unknown';
        this.keyEvents.push({ day, type: 'TAKE_MISSION', detail: missionName });
      } else if (action.type === A.COMPLETE_MISSION) {
        this.keyEvents.push({ day, type: 'COMPLETE_MISSION', detail: 'mission completed' });
      } else if (action.type === A.ABANDON_MISSION) {
        this.keyEvents.push({ day, type: 'ABANDON_MISSION', detail: 'mission abandoned' });
      } else if (action.type === A.REFRESH_MISSIONS) {
        this.keyEvents.push({ day, type: 'REFRESH_MISSIONS', detail: 'refresh' });
      } else if (action.type === A.INTERCEPT_FIGHT) {
        this.keyEvents.push({ day, type: 'FIGHT_START', detail: 'enemy engaged' });
      } else if (action.type === A.BATTLE_ACTION) {
        const battleAction = action.action;
        const keyTypes = {
          close_distance: 'CLOSE_DISTANCE',
          grapple: 'GRAPPLE',
          continue_fighting: 'BOARDING_FIGHT',
          demand_surrender: 'DEMAND_SURRENDER',
          fall_back: 'FALL_BACK',
          surrender: 'SURRENDER',
          evade: 'EVADE',
          open_distance: 'OPEN_DISTANCE',
        };
        if (keyTypes[battleAction]) {
          this.keyEvents.push({ day, type: keyTypes[battleAction], detail: '' });
        }
        const nextBattle = nextState.encounterSession?.battle;
        if (nextBattle?.phase === 'victory') {
          this.keyEvents.push({ day, type: 'FIGHT_VICTORY', detail: nextBattle.enemy?.name || 'unknown' });
        }
      } else if (action.type === A.DISMISS_BATTLE) {
        const battle = prevState.encounterSession?.battle;
        if (battle) {
          const phase = battle.phase;
          this.keyEvents.push({ day, type: `FIGHT_${phase.toUpperCase()}`, detail: battle.enemy?.name || 'unknown' });
        }
      } else if (action.type === A.TAKE_PLUNDER) {
        this.keyEvents.push({ day, type: 'PLUNDER', detail: 'took cargo' });
      } else if (action.type === A.BUY_SHIP) {
        this.keyEvents.push({ day, type: 'BUY_SHIP', detail: action.shipType });
      } else if (action.type === A.BUY_EQUIPMENT || action.type === A.INSTALL_EQUIPMENT) {
        this.keyEvents.push({ day, type: 'BUY_EQUIPMENT', detail: action.equipmentKey });
      } else if (action.type === A.REMOVE_EQUIPMENT) {
        this.keyEvents.push({ day, type: 'REMOVE_EQUIPMENT', detail: action.equipmentKey });
      } else if (action.type === A.CONFIRM_TRADE) {
        const buys = Object.keys(action.buys || {}).join(',');
        const sells = Object.keys(action.sells || {}).join(',');
        let detail = '';
        if (buys) detail += `Bought ${buys}`;
        if (sells) detail += (detail ? ', ' : '') + `Sold ${sells}`;
        this.keyEvents.push({ day, type: 'TRADE', detail });
      } else if (action.type === A.SAIL_TO) {
        this.keyEvents.push({ day, type: 'SAIL', detail: `to ${action.port}` });
      } else if (action.type === A.ENTER_PORT) {
        this.keyEvents.push({ day, type: 'ENTER_PORT', detail: `at ${nextState.currentPort}` });
      } else if (action.type === A.REPAIR) {
        this.keyEvents.push({ day, type: 'REPAIR', detail: 'ship repaired' });
      } else if (action.type === A.HIRE_CREW) {
        this.keyEvents.push({ day, type: 'HIRE_CREW', detail: `+${action.count}` });
      } else if (action.type === A.RAISE_MORALE) {
        this.keyEvents.push({ day, type: 'RAISE_MORALE', detail: 'morale boost' });
      } else if (action.type === A.TOP_UP_PROVISIONS) {
        this.keyEvents.push({ day, type: 'PROVISIONS', detail: 'provisions topped' });
      } else if (action.type === A.RESOLVE_EVENT) {
        const event = prevState.activeEvent;
        if (event) {
          this.keyEvents.push({ day, type: 'EVENT', detail: event.title });
        }
      }

      // ── Gold / spending ────────────────────────────────────────────
      const goldDelta = (nextState.gold || 0) - (prevState.gold || 0);
      if (goldDelta > 0) {
        this.goldEarned += goldDelta;
      } else if (goldDelta < 0) {
        this.goldSpent += Math.abs(goldDelta);
        if (action.type === A.REPAIR) this.goldSpentByCategory.repair += Math.abs(goldDelta);
        else if (action.type === A.HIRE_CREW) this.goldSpentByCategory.crew += Math.abs(goldDelta);
        else if (action.type === A.CONFIRM_TRADE) {
          const buys = action.buys || {};
          const sells = action.sells || {};
          let isProvision = false;
          for (const good in buys) if (good === "food" || good === "water") isProvision = true;
          for (const good in sells) if (good === "food" || good === "water") isProvision = true;
          if (isProvision) this.goldSpentByCategory.provision += Math.abs(goldDelta);
          else this.goldSpentByCategory.trade += Math.abs(goldDelta);
        }
        else if (action.type === A.BUY_EQUIPMENT || action.type === A.INSTALL_EQUIPMENT || action.type === A.REMOVE_EQUIPMENT) {
          this.goldSpentByCategory.equipment += Math.abs(goldDelta);
        }
        else if (action.type === A.BUY_SHIP) this.goldSpentByCategory.ship += Math.abs(goldDelta);
        else if (action.type === A.RAISE_MORALE) this.goldSpentByCategory.morale += Math.abs(goldDelta);
        else this.goldSpentByCategory.other += Math.abs(goldDelta);
      }

      // ── Crew changes ───────────────────────────────────────────────
      const prevCrew = prevState.crew?.roster?.length || 0;
      const nextCrew = nextState.crew?.roster?.length || 0;
      if (nextCrew > prevCrew) {
        this.crewHired += nextCrew - prevCrew;
        this.crewHires += nextCrew - prevCrew;
      } else if (nextCrew < prevCrew) {
        this.crewLost += prevCrew - nextCrew;
      }

      // ── Fame / Infamy ──────────────────────────────────────────────
      if (nextState.fame > prevState.fame) this.fameGained += nextState.fame - prevState.fame;
      if (nextState.infamy > prevState.infamy) this.infamyGained += nextState.infamy - prevState.infamy;

      // ── Missions ───────────────────────────────────────────────────
      if (action.type === A.TAKE_MISSION) this.missionsTaken++;
      if (action.type === A.COMPLETE_MISSION) this.missionsCompleted++;
      if (action.type === A.ABANDON_MISSION) this.missionsAbandoned++;
      if (action.type === A.REPAIR) this.repairs++;
      if (action.type === A.ENTER_PORT) this.portArrivals++;
      if (action.type === A.INTERCEPT_FIGHT) this.fightStarts++;

      // ── Battles ────────────────────────────────────────────────────
      if (action.type === A.DISMISS_BATTLE) {
        const session = prevState.encounterSession;
        const battle = session?.battle;
        if (battle) {
          if (battle.phase === "victory") {
            this.battlesWon++;
            this.fightWins++;
          } else if (battle.phase === "defeat") {
            this.battlesLost++;
            this.fightLosses++;
          } else if (battle.phase === "fled") {
            this.battlesFled++;
            this.fightFlees++;
          }
        }
      }

      // ── Plunder / boardings ────────────────────────────────────────
      if (action.type === A.TAKE_PLUNDER) {
        this.plunders++;
        this.plunderActions++;
      }
      if (action.type === A.BATTLE_ACTION && action.action === 'continue_fighting') {
        this.boardings++;
      }

      // ── Port visits ────────────────────────────────────────────────
      if (nextState.currentPort && nextState.currentPort !== prevState.currentPort) {
        this.portsVisited.add(nextState.currentPort);
      }

      // ── Events / patrols / random encounters / storms ───────────────
      const prevSession = prevState.encounterSession;
      const nextSession = nextState.encounterSession;
      const openedRandomEncounter = !prevSession && nextSession &&
        (nextSession.source?.kind === 'random' || nextSession.type === 'random');
      if (openedRandomEncounter) this.randomEncounters++;

      if (action.type === A.RESOLVE_EVENT) {
        this.eventsEncountered++;
        const event = prevState.activeEvent;
        if (event && event.id === "storm") this.storms++;
      }
      if (action.type === A.INTERCEPT_FIGHT || action.type === A.INTERCEPT_FLEE || action.type === A.INTERCEPT_SURRENDER ||
          action.type === A.INTERCEPT_BRIBE || action.type === A.PATROL_INSPECT) {
        const session = prevState.encounterSession;
        if (session && session.type === "navy_patrol") this.patrols++;
      }

      // ── Longest crew tenure ────────────────────────────────────────
      const maxDays = Math.max(0, ...(nextState.crew?.roster || []).map(m => m.daysAboard || 0));
      if (maxDays > this.longestCrewTenure) this.longestCrewTenure = maxDays;
    }

    finalizeCareer(finalState, trace) {
      const missionLog = finalState.career?.missionLog || [];
      for (const entry of missionLog) {
        if (entry.type === "smuggle") this.smuggles++;
        if (entry.type === "trade") this.trades++;
      }

      return {
        careerDays: finalState.day,
        gameOverReason: finalState.gameOverReason || null,
        finalGold: finalState.gold ?? 0,
        finalFame: finalState.fame ?? 0,
        finalInfamy: finalState.infamy ?? 0,
        finalShip: finalState.ship?.type || null,
        finalCrew: finalState.crew?.roster?.length || 0,
        finalMorale: finalState.crew?.morale ?? 0,
        goldEarned: this.goldEarned,
        goldSpent: this.goldSpent,
        goldSpentByCategory: this.goldSpentByCategory,
        crewHired: this.crewHired,
        crewLost: this.crewLost,
        crewDeserted: this.crewDeserted,
        longestCrewTenure: this.longestCrewTenure,
        fameGained: this.fameGained,
        infamyGained: this.infamyGained,
        battlesWon: this.battlesWon,
        battlesLost: this.battlesLost,
        battlesFled: this.battlesFled,
        plunders: this.plunders,
        missionsTaken: this.missionsTaken,
        missionsCompleted: this.missionsCompleted,
        missionsFailed: this.missionsFailed,
        missionsAbandoned: this.missionsAbandoned,
        trades: this.trades,
        smuggles: this.smuggles,
        portsVisited: Array.from(this.portsVisited),
        eventsEncountered: this.eventsEncountered,
        patrols: this.patrols,
        randomEncounters: this.randomEncounters,
        storms: this.storms,
        repairs: this.repairs,
        crewHires: this.crewHires,
        portArrivals: this.portArrivals,
        fightStarts: this.fightStarts,
        fightWins: this.fightWins,
        fightLosses: this.fightLosses,
        fightFlees: this.fightFlees,
        boardings: this.boardings,
        plunderActions: this.plunderActions,

        // NEW
        actionCounts: this.actionCounts,
        keyEvents: this.keyEvents,
      };
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  5.  BASE POLICY CLASS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  class Policy {
    constructor(name, parameters = {}) {
      this.name = name;
      this.parameters = parameters;
      this.lastActionType = null;
      this.repeatCount = 0;
    }
    chooseDecision(context, state) {
      throw new Error("Policy.chooseDecision not implemented");
    }
    getVersion() { return "1.0.0"; }

    noteAction(actionType) {
      if (this.lastActionType === actionType) {
        this.repeatCount++;
      } else {
        this.lastActionType = actionType;
        this.repeatCount = 1;
      }
    }

    isLooping() {
      return this.repeatCount >= 3;
    }

    resetLoop() {
      this.lastActionType = null;
      this.repeatCount = 0;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  6.  RUNNER (with live progress callback)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function runCareer(scenarioId, seed, policy, config, onRunProgress) {
    const maxDays = config.maxDays || 5000;
    const startingGold = config.startingGold || 0;

    console.log(`🚀 Starting run: ${scenarioId}, seed ${seed}, policy ${policy.name}`);

    setRunSeed(seed);

    let state = createFreshState();

    state = window.E.reducer(state, {
      type: A.START_GAME,
      captainName: `${policy.name} Capt`,
      faction: scenarioId,
      tutorialMode: "none",
    });

    if (state.screen === "title") {
      restoreMathRandom();
      console.error(`❌ START_GAME failed for ${scenarioId}`);
      return {
        status: "simulation_error",
        metadata: { runId: generateRunId(), seed, scenario: scenarioId, policy: policy.name, startDay: 1, endDay: 1 },
        trace: null,
        summary: null,
        finalState: state,
        error: "START_GAME failed"
      };
    }

    if (startingGold > 0) {
      const currentGold = state.gold;
      const extra = startingGold - currentGold;
      if (extra > 0) {
        state = window.E.reducer(state, { type: window.E.A.DEBUG_ADD_GOLD, amount: extra });
        console.log(`💰 Injected ${extra} gold → total ${state.gold}`);
      }
    }

    const trace = new TraceCollector();
    const metrics = new MetricsCollector();
    trace.recordSnapshot(state, "start");

    let actionsTaken = 0;
    let consecutiveNonProgressing = 0;
    let lastDay = state.day;
    let lastLocation = state.currentPort || state.destination || "sea";
    const maxActions = 100000;
    let status = "completed";
    let statusReason = null;
    let refreshLoopCount = 0;

    if (onRunProgress) {
      onRunProgress({ day: state.day, screen: state.screen, status: "running", runStarted: true });
    }

    while (true) {
      if (isGameOver(state)) {
        status = "game_over";
        statusReason = state.gameOverReason || "Unknown game over";
        break;
      }
      if (state.day >= maxDays) {
        status = "horizon";
        statusReason = `Reached max days (${maxDays})`;
        break;
      }
      if (actionsTaken >= maxActions) {
        status = "policy_stall";
        statusReason = "Max actions reached";
        break;
      }

      const legalCtx = getLegalActions(state);
      const context = legalCtx.context;
      const legalActions = legalCtx.actions.filter(a => a.legal);

      if (legalActions.length === 0) {
        status = "policy_stall";
        statusReason = "No legal actions available";
        break;
      }

      if (context === "port") {
        const hasSail = legalActions.some(a => a.type === A.SAIL_TO && a.legal);
        if (!hasSail && consecutiveNonProgressing > 10) {
          status = "policy_stall";
          statusReason = "No reachable ports from current position";
          break;
        }
      }

      const decision = policy.chooseDecision(legalCtx, state);
      let action = decision.action;
      let reason = decision.reason || "No reason given";

      if (!action) {
        const fallback = legalActions.find(a => a.type === A.NAVIGATE && a.screen === 'port') ||
                         legalActions.find(a => a.type === A.REPAIR) ||
                         legalActions.find(a => a.type === A.TOP_UP_PROVISIONS) ||
                         legalActions.find(a => a.type === A.SAIL_TO) ||
                         legalActions[0];
        action = fallback;
        reason = "Policy returned null, using fallback";
      }

      let isLegal = false;
      if (action.type === A.CONFIRM_TRADE) {
        isLegal = legalActions.some(a => a.type === A.CONFIRM_TRADE);
      } else if (action.type === A.TAKE_PLUNDER) {
        isLegal = legalActions.some(a => a.type === A.TAKE_PLUNDER);
      } else {
        isLegal = legalActions.some(a => a.type === action.type && JSON.stringify(a) === JSON.stringify(action));
      }

      if (!isLegal) {
        status = "policy_error";
        statusReason = `Illegal action: ${action.type}`;
        const fallback = legalActions[0];
        action = fallback;
        reason = "Illegal action chosen, using fallback";
      }

      policy.noteAction(action.type);

      if (action.type === A.REFRESH_MISSIONS) {
        refreshLoopCount++;
        if (refreshLoopCount > 5) {
          status = "policy_stall";
          statusReason = "Excessive REFRESH_MISSIONS loop";
          break;
        }
      } else {
        refreshLoopCount = 0;
      }

      trace.recordDecision({
        day: state.day,
        context,
        action: action.type,
        payload: action,
        reason,
        scoreDetails: decision.scoreDetails || null,
      });

      const prevState = state;
      try {
        state = window.E.reducer(state, action);
      } catch (err) {
        status = "simulation_error";
        statusReason = err.message || "Reducer threw error";
        break;
      }

      if (action.type === A.SAIL_TO && state.screen !== "sailing") {
        console.error(`❌ CRITICAL: SAIL_TO to ${action.port} did not change screen to sailing. State: ${stateToString(state)}`);
        status = "policy_stall";
        statusReason = `SAIL_TO failed: screen stayed ${state.screen}`;
        break;
      }

      if (isProgressing(prevState, state, action)) {
        consecutiveNonProgressing = 0;
        lastDay = state.day;
        lastLocation = state.currentPort || state.destination || "sea";
        policy.resetLoop();
      } else {
        consecutiveNonProgressing++;
        if (consecutiveNonProgressing > 30) {
          status = "policy_stall";
          statusReason = "No progress for 30 actions";
          break;
        }
      }

      metrics.updateFromTransition(prevState, state, action);
      actionsTaken++;

      if (onRunProgress && actionsTaken % 10 === 0) {
        onRunProgress({ day: state.day, screen: state.screen, status: "running", runStarted: false });
      }

      if (state.screen === "port" && prevState.screen !== "port") {
        trace.recordPortVisit({ port: state.currentPort, day: state.day, gold: state.gold, crew: state.crew.roster.length, hull: state.ship.hull, morale: state.crew.morale });
        trace.recordSnapshot(state, "port_arrival");
      }
      if (state.screen === "battle" && prevState.screen !== "battle") trace.recordSnapshot(state, "battle_start");
      if (state.screen === "plunder" && prevState.screen !== "plunder") trace.recordSnapshot(state, "plunder_start");
      if (state.screen === "event" && prevState.screen !== "event") trace.recordSnapshot(state, "event_start");
      if (isGameOver(state)) trace.recordSnapshot(state, "game_over");
      if (state.day % 100 === 0) trace.recordSnapshot(state, `day_${state.day}`);
    }

    trace.recordSnapshot(state, "end");
    const summary = metrics.finalizeCareer(state, trace);

    const metadata = {
      runId: generateRunId(),
      seed,
      scenario: scenarioId,
      policy: policy.name,
      policyVersion: policy.getVersion(),
      simulatorVersion: VERSION,
      gameVersion: window.E.initialState.version || 1,
      startDay: 1,
      endDay: state.day,
      status,
      statusReason,
    };

    restoreMathRandom();

    console.log(`🏁 Run ${metadata.runId} finished: ${status} after ${state.day} days (${statusReason || 'OK'})`);

    return {
      status,
      metadata,
      trace: trace.getTrace(),
      summary,
      finalState: state,
      error: statusReason,
      lastDecisions: trace.getLastDecisions(10),
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  7.  BATCH AGGREGATOR
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  class BatchAggregator {
    constructor() {
      this.careers = [];
    }

    addCareer(career) {
      this.careers.push(career);
    }

    aggregate() {
      const total = this.careers.length;
      if (total === 0) return { total: 0 };

      const statusCounts = { completed: 0, game_over: 0, horizon: 0, policy_stall: 0, policy_error: 0, simulation_error: 0 };
      const days = [];
      const gold = [];
      const fame = [];
      const infamy = [];
      const crew = [];
      const morale = [];
      const randomEncounters = [];

      for (const c of this.careers) {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
        days.push(c.summary?.careerDays || 0);
        gold.push(c.summary?.finalGold || 0);
        fame.push(c.summary?.finalFame || 0);
        infamy.push(c.summary?.finalInfamy || 0);
        crew.push(c.summary?.finalCrew || 0);
        morale.push(c.summary?.finalMorale || 0);
        randomEncounters.push(c.summary?.randomEncounters || 0);
      }

      const stats = (arr) => {
        const sorted = [...arr].sort((a, b) => a - b);
        const len = sorted.length;
        return {
          min: sorted[0],
          max: sorted[len - 1],
          mean: sorted.reduce((s, v) => s + v, 0) / len,
          median: len % 2 === 1 ? sorted[Math.floor(len / 2)] : (sorted[len / 2 - 1] + sorted[len / 2]) / 2,
          p10: sorted[Math.floor(len * 0.1)],
          p25: sorted[Math.floor(len * 0.25)],
          p75: sorted[Math.floor(len * 0.75)],
          p90: sorted[Math.floor(len * 0.9)],
        };
      };

      return {
        total,
        ...statusCounts,
        days: stats(days),
        gold: stats(gold),
        fame: stats(fame),
        infamy: stats(infamy),
        crew: stats(crew),
        morale: stats(morale),
        randomEncounters: stats(randomEncounters),
      };
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  8.  EXPORT FUNCTIONS (supports detailed logs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function exportMarkdown(batchResult, options = {}) {
    const { metadata, aggregate, careers } = batchResult;
    const detailed = options.detailed || false;

    let md = `# Broadside Career Simulator – Results\n\n`;
    md += `- **Persona**: ${metadata.persona}\n`;
    md += `- **Scenario**: ${metadata.scenario}\n`;
    md += `- **Runs**: ${metadata.runs}\n`;
    md += `- **Max Days**: ${metadata.maxDays}\n`;
    md += `- **Seed**: ${metadata.seed}\n`;
    md += `- **Simulator Version**: ${metadata.simulatorVersion}\n`;
    if (detailed) md += `- **Detailed logs enabled**: Yes\n\n`;
    else md += `\n`;

    md += `## Aggregate Summary\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Completed | ${aggregate.completed || 0} |\n`;
    md += `| Game‑Over | ${aggregate.game_over || 0} |\n`;
    md += `| Horizon | ${aggregate.horizon || 0} |\n`;
    md += `| Policy Stall | ${aggregate.policy_stall || 0} |\n`;
    md += `| Policy Error | ${aggregate.policy_error || 0} |\n`;
    md += `| Simulation Error | ${aggregate.simulation_error || 0} |\n`;
    md += `| Avg Days | ${aggregate.days?.mean?.toFixed(0) || '—'} |\n`;
    md += `| Median Days | ${aggregate.days?.median?.toFixed(0) || '—'} |\n`;
    md += `| Avg Final Gold | ${aggregate.gold?.mean?.toFixed(0) || '—'} |\n`;
    md += `| Avg Final Fame | ${aggregate.fame?.mean?.toFixed(0) || '—'} |\n`;
    md += `| Avg Final Crew | ${aggregate.crew?.mean?.toFixed(0) || '—'} |\n`;
    md += `| Avg Final Morale | ${aggregate.morale?.mean?.toFixed(0) || '—'} |\n`;
    md += `| Avg Random Encounters | ${aggregate.randomEncounters?.mean?.toFixed(1) || '—'} |\n\n`;

    md += `## Per‑Run Details\n\n`;
    md += `| # | Status | Days | Ship | Gold | Fame | Crew | Morale | Random Enc. | Stall Reason | Last 5 Actions |\n`;
    md += `|---|--------|------|------|------|------|------|--------|-------------|--------------|----------------|\n`;

    for (const career of careers) {
      const idx = career.index + 1;
      const status = career.status;
      const days = career.summary?.careerDays || 0;
      const ship = career.finalState?.ship?.type || '—';
      const gold = career.summary?.finalGold || 0;
      const fame = career.summary?.finalFame || 0;
      const crew = career.summary?.finalCrew || 0;
      const morale = career.summary?.finalMorale || 0;
      const randomEncounters = career.summary?.randomEncounters || 0;
      const reason = career.error || career.metadata?.statusReason || '—';
      const lastDecisions = (career.lastDecisions || []).map(d => `${d.day}:${d.action}`).join('; ') || '—';
      md += `| ${idx} | ${status} | ${days} | ${ship} | ${gold} | ${fame} | ${crew} | ${morale} | ${randomEncounters} | ${reason} | ${lastDecisions} |\n`;
    }

    // ── Action Counts table ──
    md += `\n## Action Counts (per Run)\n\n`;
    md += `| # | TAKE_MISSION | COMPLETE_MISSION | ABANDON_MISSION | REFRESH | FIGHT_START | FIGHT_WIN | FIGHT_LOSS | FIGHT_FLED | PLUNDER | BOARDING | SAIL | ENTER_PORT | REPAIR | HIRE | RAISE_MORALE | PROVISIONS | BUY_SHIP | BUY_EQUIP | TRADE |\n`;
    md += `|---|-------------|----------------|----------------|---------|------------|----------|------------|------------|---------|----------|-----|------------|-------|------|-------------|-----------|---------|----------|-------|\n`;
    for (const career of careers) {
      const s = career.summary || {};
      const idx = career.index + 1;
      const ac = s.actionCounts || {};
      md += `| ${idx} | ${ac[A.TAKE_MISSION] || 0} | ${ac[A.COMPLETE_MISSION] || 0} | ${ac[A.ABANDON_MISSION] || 0} | ${ac[A.REFRESH_MISSIONS] || 0} | ${ac[A.INTERCEPT_FIGHT] || 0} | ${s.fightWins || 0} | ${s.fightLosses || 0} | ${s.fightFlees || 0} | ${s.plunderActions || 0} | ${s.boardings || 0} | ${ac[A.SAIL_TO] || 0} | ${ac[A.ENTER_PORT] || 0} | ${ac[A.REPAIR] || 0} | ${ac[A.HIRE_CREW] || 0} | ${ac[A.RAISE_MORALE] || 0} | ${ac[A.TOP_UP_PROVISIONS] || 0} | ${ac[A.BUY_SHIP] || 0} | ${ac[A.BUY_EQUIPMENT] || 0} | ${ac[A.CONFIRM_TRADE] || 0} |\n`;
    }

    // ── Detailed logs per career (if enabled) ──
    if (detailed) {
      md += `\n## Detailed Run Logs\n\n`;
      for (const career of careers) {
        const idx = career.index + 1;
        const fs = career.finalState || {};
        md += `### Run ${idx} – ${career.status}\n\n`;
        md += `- **Days:** ${career.summary?.careerDays || 0}\n`;
        md += `- **Final State:** screen=${fs.screen || '?'}, port=${fs.currentPort || '?'}, dest=${fs.destination || 'none'}, gold=${fs.gold ?? '?'}, crew=${fs.crew?.roster?.length ?? '?'}, hull=${fs.ship?.hull ?? '?'}, morale=${fs.crew?.morale ?? '?'}\n`;

        // Key events grouped by type: one row per event type, with all days listed.
        const keyEvents = career.summary?.keyEvents || [];
        if (keyEvents.length > 0) {
          const grouped = {};
          for (const ev of keyEvents) {
            if (!grouped[ev.type]) grouped[ev.type] = { days: [], details: new Set() };
            grouped[ev.type].days.push(ev.day);
            if (ev.detail) grouped[ev.type].details.add(ev.detail);
          }
          md += `- **Key Events:**\n\n`;
          md += `| Event | Count | Days |\n|---|---:|---|\n`;
          for (const [type, info] of Object.entries(grouped)) {
            const days = info.days.join(', ');
            md += `| ${type} | ${info.days.length} | ${days} |\n`;
          }
          md += `\n`;
        }

        // Last 20 journal entries
        const journal = (fs.log || []).slice(-20);
        if (journal.length > 0) {
          md += `- **Last 20 journal entries:**\n`;
          for (const entry of journal) {
            md += `  - ${entry}\n`;
          }
        }

        // Last 20 decisions
        const decisions = (career.trace?.decisions || []).slice(-20);
        if (decisions.length > 0) {
          md += `- **Last 20 decisions:**\n`;
          for (const d of decisions) {
            md += `  - day ${d.day}: ${d.action} (${d.reason || 'no reason'})\n`;
          }
        }

        // Any battles
        const battles = career.trace?.battles || [];
        if (battles.length > 0) {
          md += `- **Battles (last 5):**\n`;
          const recentBattles = battles.slice(-5);
          for (const b of recentBattles) {
            md += `  - ${b.day}: ${b.outcome || 'unknown'} — enemy ${b.enemyName || '?'}\n`;
          }
        }

        md += `\n`;
      }
    }

    // ── Stall analysis (always) ──
    md += `\n## Stall Analysis\n\n`;
    const stalled = careers.filter(c => c.status === 'policy_stall');
    if (stalled.length > 0) {
      md += `**${stalled.length} runs** ended with **policy_stall**.\n\n`;
      const reasons = {};
      for (const c of stalled) {
        const r = c.error || c.metadata?.statusReason || 'unknown';
        reasons[r] = (reasons[r] || 0) + 1;
      }
      md += `| Reason | Count |\n|--------|-------|\n`;
      for (const [reason, count] of Object.entries(reasons)) {
        md += `| ${reason} | ${count} |\n`;
      }
      md += `\n`;

      md += `### Repeated Action Patterns Across Stalls\n\n`;
      const patternCounts = {};
      stalled.forEach(c => {
        const lastDec = (c.trace?.decisions || c.lastDecisions || []).slice(-10);
        if (lastDec.length === 0) return;
        let curAction = null, curLen = 0, bestLen = 0, bestAction = null;
        lastDec.forEach(d => {
          const act = d.action;
          if (act === curAction) curLen++;
          else { curAction = act; curLen = 1; }
          if (curLen > bestLen) { bestLen = curLen; bestAction = act; }
        });
        if (bestLen >= 2 && bestAction) {
          const key = `${bestAction} x${bestLen}`;
          patternCounts[key] = (patternCounts[key] || 0) + 1;
        }
      });
      if (Object.keys(patternCounts).length > 0) {
        md += `| Pattern | Count |\n|---------|-------|\n`;
        Object.entries(patternCounts).sort((a,b) => b[1] - a[1]).forEach(([pat, cnt]) => {
          md += `| ${pat} | ${cnt} |\n`;
        });
        md += `\n`;
      } else {
        md += `No repeated patterns detected.\n\n`;
      }

      // Individual stall blocks (top 30)
      const maxDetailedStalls = 30;
      const detailedStalls = stalled.slice(0, maxDetailedStalls);
      detailedStalls.forEach((career) => {
        md += `### Run ${career.index + 1} – ${career.status}\n`;
        md += `- **Day:** ${career.metadata?.endDay || career.summary?.careerDays || '?'}\n`;
        md += `- **Reason:** ${career.error || career.metadata?.statusReason || 'unknown'}\n`;
        const fs = career.finalState || {};
        md += `- **State:** screen=${fs.screen || '?'}, port=${fs.currentPort || '?'}, `;
        md += `dest=${fs.destination || 'none'}, gold=${fs.gold ?? '?'}, `;
        md += `crew=${fs.crew?.roster?.length ?? '?'}, hull=${fs.ship?.hull ?? '?'}, `;
        md += `morale=${fs.crew?.morale ?? '?'}, mission=${fs.activeMission ? fs.activeMission.name : 'none'}\n`;
        const lastDec = (career.trace?.decisions || career.lastDecisions || []).slice(-10);
        if (lastDec.length > 0) {
          md += `- **Last ${lastDec.length} decisions:**\n`;
          lastDec.forEach(d => {
            md += `  - day ${d.day}: ${d.action} (${d.reason || 'no reason'})\n`;
          });
        } else {
          md += `- **No decisions recorded**\n`;
        }
        md += `\n`;
      });
    } else {
      md += `No policy stalls.\n`;
    }

    return md;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  9.  PUBLIC API
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const Simulator = {
    VERSION,
    createFreshState,
    isOperationallySafe,
    setRunSeed,
    restoreMathRandom,
    Policy,
    TraceCollector,
    MetricsCollector,
    BatchAggregator,
    getPersona: (id) => (Simulator.PERSONAS[id] || null),
    listPersonas: () => Object.keys(Simulator.PERSONAS),
    runCareer,
    exportMarkdown,
    // Mutable persona registry
    PERSONAS: {},

    runBatch: async function (config, callbacks = {}) {
      console.log(`📊 runBatch START: ${JSON.stringify(config)}`);
      const { onProgress, onRunProgress, shouldStop } = callbacks;
      const scenario = config.scenario || "english";
      const personaId = config.persona || "naive";
      const total = config.runs || 200;
      const maxDays = config.maxDays || 5000;
      const baseSeed = config.seed || 0;
      const startingGold = config.startingGold || 0;

      const persona = Simulator.PERSONAS[personaId];
      if (!persona) throw new Error(`Unknown persona: ${personaId}`);

      const results = [];
      const aggregator = new BatchAggregator();
      const startTime = Date.now();

      for (let i = 0; i < total; i++) {
        if (shouldStop && shouldStop()) {
          onProgress && onProgress({ done: i, total, status: "stopped", runs: results });
          break;
        }

        const seed = baseSeed === 0 ? Math.floor(Math.random() * 0xFFFFFFFF) : baseSeed + i;
        const policy = persona.factory();
        const runStartTime = Date.now();

        const career = runCareer(scenario, seed, policy, { maxDays, startingGold }, onRunProgress);

        const runEndTime = Date.now();
        const runDurationMs = runEndTime - runStartTime;

        career.index = i;
        results.push(career);
        aggregator.addCareer(career);

        if (onProgress) {
          const aggregate = aggregator.aggregate();
          onProgress({
            done: i + 1,
            total,
            status: career.status,
            persona: policy.name,
            runs: results,
            currentRun: i + 1,
            runDurationMs,
            totalElapsedMs: Date.now() - startTime,
            summary: {
              total: aggregate.total,
              completed: aggregate.completed || 0,
              gameOver: aggregate.game_over || 0,
              horizon: aggregate.horizon || 0,
              stalled: aggregate.policy_stall || 0,
              avgDays: aggregate.days?.mean,
              avgGold: aggregate.gold?.mean,
              avgFame: aggregate.fame?.mean,
            }
          });
        }

        if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 0));
      }

      const aggregate = aggregator.aggregate();
      console.log(`✅ Batch complete: ${results.length} careers`);
      return {
        metadata: {
          scenario,
          persona: personaId,
          runs: results.length,
          maxDays,
          seed: baseSeed,
          startingGold,
          simulatorVersion: VERSION,
        },
        aggregate,
        careers: results,
      };
    },
  };

  // ── MERGE instead of overwrite ────────────────────────────────────
  window.Simulator = Object.assign(window.Simulator || {}, Simulator);
  console.log(`⚓ Career Simulator v${VERSION} loaded.`);
})();





// @ts-check
