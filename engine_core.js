// engine_core.js : Shared Infrastructure
// Exposes window.E with A, initialState, reducer, shared helpers.

window.E = window.E || {};

(function() {
  const { PORTS } = window.D;
  const L = window.L;
  const G = window.G;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ACTION CONSTANTS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  window.E.A = {
    NAVIGATE: "NAVIGATE",
    SAIL_TO: "SAIL_TO",
    ADVANCE_DAY: "ADVANCE_DAY",
    ENTER_PORT: "ENTER_PORT",
    DISCOVER_PORT: "DISCOVER_PORT",
    START_GAME: "START_GAME",
    SAVE_GAME: "SAVE_GAME",
    LOAD_GAME: "LOAD_GAME",
    EXPORT_SAVE: "EXPORT_SAVE",
    IMPORT_SAVE: "IMPORT_SAVE",
    REPAIR: "REPAIR",
    BUY_SHIP: "BUY_SHIP",
    BUY_EQUIPMENT: "BUY_EQUIPMENT",
    INSTALL_EQUIPMENT: "INSTALL_EQUIPMENT",
    REMOVE_EQUIPMENT: "REMOVE_EQUIPMENT",
    HIRE_CREW: "HIRE_CREW",
    DISMISS_CREW: "DISMISS_CREW",
    RAISE_MORALE: "RAISE_MORALE",
    REFRESH_MISSIONS: "REFRESH_MISSIONS",
    TAKE_MISSION: "TAKE_MISSION",
    COMPLETE_MISSION: "COMPLETE_MISSION",
    ABANDON_MISSION: "ABANDON_MISSION",
    CONFIRM_TRADE: "CONFIRM_TRADE",
    INTERCEPT_FIGHT: "INTERCEPT_FIGHT",
    INTERCEPT_FLEE: "INTERCEPT_FLEE",
    INTERCEPT_PARLEY: "INTERCEPT_PARLEY",
    INTERCEPT_BRIBE: "INTERCEPT_BRIBE",
    INTERCEPT_SURRENDER: "INTERCEPT_SURRENDER",
    BATTLE_ACTION: "BATTLE_ACTION",
    DISMISS_BATTLE: "DISMISS_BATTLE",
    TAKE_PLUNDER: "TAKE_PLUNDER",
    RESOLVE_EVENT: "RESOLVE_EVENT",
    RESOLVE_DRIFTING_WRECK_SEARCH: "RESOLVE_DRIFTING_WRECK_SEARCH",
    PATROL_INSPECT: "PATROL_INSPECT",
    ATTACK_PIRATE: "ATTACK_PIRATE",
    ATTACK_MERCHANT: "ATTACK_MERCHANT",
    ONBOARDING_ADVANCE: "ONBOARDING_ADVANCE",
    ONBOARDING_QM_SEEN: "ONBOARDING_QM_SEEN",
    ONBOARDING_SKIP: "ONBOARDING_SKIP",
    ONBOARDING_COMPLETE: "ONBOARDING_COMPLETE",
    DEBUG_ADD_GOLD: "DEBUG_ADD_GOLD",
    DEBUG_SET_FAME: "DEBUG_SET_FAME",
    DEBUG_SET_INFAMY: "DEBUG_SET_INFAMY",
    DEBUG_SET_SHIP: "DEBUG_SET_SHIP",
    DEBUG_SET_PORT_REP: "DEBUG_SET_PORT_REP",
    DEBUG_FILL_HOLD: "DEBUG_FILL_HOLD",
    DEBUG_REPAIR: "DEBUG_REPAIR",
    DEBUG_SET_MORALE: "DEBUG_SET_MORALE",
    DEBUG_UNLOCK_HIDDEN_PORTS: "DEBUG_UNLOCK_HIDDEN_PORTS",
    DEBUG_MAX_CREW: "DEBUG_MAX_CREW",
    DEBUG_COMPLETE_MISSION: "DEBUG_COMPLETE_MISSION",
    DEBUG_SET_HEAT: "DEBUG_SET_HEAT",
    DEBUG_AGE_CREW: "DEBUG_AGE_CREW",
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  SHARED HELPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  window.E.autoSave = (state) => {
    try {
      localStorage.setItem("piratesSave", JSON.stringify(state));
    } catch (e) {
      console.warn("Auto-save failed:", e);
    }
  };

  window.E.migrateState = (loaded) => {
    let s = { ...loaded };
    if (!s.version) s.version = 1;
    if (!s.version || s.version < 2) {
      s.discoveredPorts = s.discoveredPorts ||
        Object.keys(window.D.PORTS).filter(k => !window.D.PORTS[k].hidden);
      s.mapFragments = s.mapFragments || [];
      s.version = 2;
    }
    if (!s.factionAlerts) {
      s.factionAlerts = { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 };
    }
    if (!s.portGossip) s.portGossip = [];
    if (s.crew?.roster) {
      s.crew.roster = s.crew.roster.map(member => ({
        ...member,
        tags: member.tags || [],
      }));
    }
    if (!s.startDate) s.startDate = { day: 1, month: 6, year: 1695 };
    if (!s.scenarioId) s.scenarioId = null;
    if (!s.ship.equipment) {
      s.ship.equipment = { hull: [], armament: [], rigging: [], special: [] };
      delete s.ship.upgrades;
    }
    if (!s.equipmentInventory) s.equipmentInventory = [];
    if (!s.onboarding) {
      s.onboarding = {
        enabled: false,
        completed: true,
        currentStep: 9,
        stepsCompleted: Object.fromEntries(
          Object.keys(window.E.initialState.onboarding.stepsCompleted).map(k => [k, true])
        ),
        combatHintShown: true,
        qmDismissed: false,
      };
    }
    if (!s.captainName) s.captainName = "";
    if (!s.faction) s.faction = null;
    return s;
  };

  window.E.logEntry = (state, message) => `[${state.day}] ${message}`;

  window.E.createBattleState = (state, enemy, initialLog = "You engage the enemy!", encounterType = "unknown") => ({
    phase: "player_turn",
    playerHull: state.ship.hull,
    playerCrew: state.crew.roster.length,
    enemy,
    enemyHull: enemy.hull,
    enemyCrew: enemy.crew,
    round: 1,
    log: [initialLog],
    returnScreen: window.L.returnScreen(state),
    initialCrewCount: state.crew.roster.length,
    lostCrewNames: [],
    encounterType,
    ...(encounterType === "escort_defend" ? { convoyHull: 50 } : {}),
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  INITIAL STATE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  window.E.initialState = {
    version: 1,
    screen: "title",
    day: 1,
    startDate: { day: 1, month: 6, year: 1695 },
    log: [],
    gold: 1000,
    fame: 0,
    infamy: 0,
    factionAlerts: { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 },
    currentPort: "portRoyal",
    route: null,
    captainName: "",
    faction: null,
    onboarding: {
      enabled: false,
      completed: true,
      currentStep: 0,
      stepsCompleted: {
        contractsOpened: false,
        firstContractAccepted: false,
        marketOpened: false,
        provisionsAndGoodsBought: false,
        mapOpened: false,
        firstVoyageStarted: false,
        firstArrival: false,
        firstContractDelivered: false,
        crewOpened: false,
        firstCrewHired: false,
        tutorialHuntAccepted: false,
        tutorialHuntCompleted: false,
        shipyardOpened: false,
        shipRepaired: false,
        journalOpened: false,
      },
       qmMessagesSeen: {}, 
      combatHintShown: false,
      qmDismissed: false,
    },
    scenarioId: null,
    previousPort: null,
    destination: null,
    discoveredPorts: Object.keys(PORTS).filter(k => !PORTS[k].hidden),
    mapFragments: [],
    equipmentInventory: [],
    sailingDaysLeft: 0,
    sailingDaysTotal: 0,
    wind: { angle: 45, speed: 10 },
    ship: {
      type: "sloop",
      name: "Sea Dog",
      hull: 100,
      cannons: 10,
      equipment: { hull: [], armament: [], rigging: [], special: [] },
    },
    crew: { roster: [], max: 50, morale: 80 },
    hold: {
      items: {
        food: 10, water: 10,
        rum: 0, sugar: 0, timber: 0, cloth: 0, spices: 0, silk: 0,
        coffee: 0, cocoa: 0, weapons: 0, tobacco: 0, silver: 0, slaves: 0,
      },
    },
    portMarket: null,
    portGossip: [],
    missions: [],
    activeMission: null,
    reputation: {},
    battleState: null,
    activeEvent: null,
    encounterContext: null,
  };

  Object.keys(PORTS).forEach(portKey => {
    window.E.initialState.reputation[portKey] = 50;
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  REDUCER CHAIN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  window.E._reducers = [];

  window.E.reducer = (state, action) =>
    window.E._reducers.reduce((s, r) => r(s, action), state);

  // ── Debug reducer ──────────────────────────────────────────────
  window.E._reducers.push((state, action) => {
    switch (action.type) {
      case window.E.A.DEBUG_ADD_GOLD:
        return { ...state, gold: state.gold + action.amount };
      case window.E.A.DEBUG_SET_FAME:
        return { ...state, fame: action.fame };
      case window.E.A.DEBUG_SET_INFAMY:
        return { ...state, infamy: action.infamy };
      case window.E.A.DEBUG_SET_SHIP: {
        const s = window.D.SHIPS[action.shipType];
        if (!s) return state;
        return {
          ...state,
          ship: { type: action.shipType, name: s.name, hull: s.maxHull, cannons: s.cannons, equipment: { hull: [], armament: [], rigging: [], special: [] } },
          equipmentInventory: [],
          hold: { ...state.hold, capacity: s.holdCapacity },
          crew: { ...state.crew, max: s.maxCrew },
        };
      }
      case window.E.A.DEBUG_SET_PORT_REP:
        return { ...state, reputation: { ...state.reputation, [action.port]: action.amount } };
      case window.E.A.DEBUG_FILL_HOLD:
        return { ...state, hold: { ...state.hold, items: { food:20, water:20, rum:10, sugar:8, spices:4, silk:3, cloth:6, weapons:5, coffee:5, cocoa:4, timber:0, tobacco:3, silver:2, slaves:0 } } };
      case window.E.A.DEBUG_REPAIR: {
        const stats = L.getShipStats(state);
        return { ...state, ship: { ...state.ship, hull: stats.maxHull }, hold: { ...state.hold, items: { ...state.hold.items, food: Math.ceil(state.crew.roster.length/10)*10, water: Math.ceil(state.crew.roster.length/10)*10 } } };
      }
      case window.E.A.DEBUG_SET_MORALE:
        return { ...state, crew: { ...state.crew, morale: Math.min(100, Math.max(0, action.morale)) } };
      case window.E.A.DEBUG_UNLOCK_HIDDEN_PORTS:
        return { ...state, discoveredPorts: Object.keys(window.D.PORTS), log: [...state.log, "⚙ All hidden ports unlocked."] };
      case window.E.A.DEBUG_MAX_CREW: {
        const max = L.getShipStats(state).maxCrew;
        const deficit = Math.max(0, max - state.crew.roster.length);
        if (deficit === 0) return state;
        const factions = Object.keys(window.D.FACTIONS);
        const existingNames = state.crew.roster.map(c => `${c.firstName} ${c.lastName}`);
        const newMembers = [];
        for (let i = 0; i < deficit; i++) {
          const faction = factions[Math.floor(Math.random() * factions.length)];
          const member = G.generateCrewMember(faction, existingNames);
          member.daysAboard = Math.floor(Math.random() * 240) + 10;
          if (Math.random() < 0.30) member.tags.push("loyal");
          if (Math.random() < 0.30 && !member.tags.includes("loyal")) member.tags.push("upset");
          if (Math.random() < 0.25) member.tags.push("mutineer");
          if (Math.random() < 0.35) member.tags.push("scar_battle");
          if (Math.random() < 0.25) member.tags.push("scar_storm");
          if (Math.random() < 0.15) member.tags.push("scar_shipwreck");
          if (Math.random() < 0.25) member.tags.push("revealed_drunkard");
          if (Math.random() < 0.15) member.tags.push("revealed_coward");
          if (Math.random() < 0.15) member.tags.push("revealed_greedy");
          if (Math.random() < 0.20) {
            const hiddenPool = ["hidden_drunkard","hidden_coward","hidden_greedy"];
            member.tags.push(hiddenPool[Math.floor(Math.random()*hiddenPool.length)]);
          }
          newMembers.push(member);
          existingNames.push(`${member.firstName} ${member.lastName}`);
        }
        return { ...state, crew: { ...state.crew, roster: [...state.crew.roster, ...newMembers] }, log: [...state.log, `⚙ Hired ${deficit} crew with random traits for testing.`] };
      }
      case window.E.A.DEBUG_COMPLETE_MISSION: {
        const mission = state.activeMission;
        if (!mission) return state;
        const rep = state.reputation[state.currentPort] ?? 50;
        const perk = L.getRepPerk(rep);
        const baseGold = mission.gold || 0;
        const finalGold = (mission.type === "trade" || mission.type === "smuggle") ? baseGold : Math.floor(baseGold * perk.missionMult);
        return { ...state, gold: state.gold + finalGold, fame: state.fame + (mission.fame || 0), infamy: Math.min(999, (state.infamy ?? 0) + (mission.infamyGain || 0)), reputation: L.applyReputationImpact(state, mission.repImpact), activeMission: null, log: [...state.log, `⚙ Debug-completed mission: ${mission.name}. +${finalGold}g.`] };
      }
      case window.E.A.DEBUG_SET_HEAT: {
        const alerts = { ...(state.factionAlerts || {}) };
        alerts[action.faction] = Math.min(10, Math.max(0, action.amount));
        return { ...state, factionAlerts: alerts };
      }
      case window.E.A.DEBUG_AGE_CREW: {
        const aged = state.crew.roster.map(member => ({ ...member, daysAboard: (member.daysAboard || 0) + 50 }));
        return { ...state, crew: { ...state.crew, roster: aged }, log: [...state.log, `⚙ Added 50 days aboard to all crew.`] };
      }
      default:
        return state;
    }
  });

  // ── Save / Load / Export / Import ────────────────────────────
  window.E._reducers.push((state, action) => {
    switch (action.type) {
      case window.E.A.SAVE_GAME:
        localStorage.setItem("piratesSave", JSON.stringify(state));
        return { ...state };
      case window.E.A.LOAD_GAME: {
        try {
          const raw = localStorage.getItem("piratesSave");
          if (!raw) return { ...state, log: [...state.log, "No saved game found."] };
          const parsed = JSON.parse(raw);
          const loaded = window.E.migrateState(parsed);
          const currentPort = loaded.currentPort || "portRoyal";
          return { ...loaded, screen: "port", battleState: null, activeEvent: null, encounterContext: null, portMarket: G.generatePortMarket(currentPort), missions: G.generateMissions(currentPort, loaded) };
        } catch (e) {
          return { ...state, log: [...state.log, "Failed to load save. Corrupted data."] };
        }
      }
      case window.E.A.EXPORT_SAVE: {
        const encoded = L.encodeSave(state);
        const scenario = state.scenarioId || "unknown";
        const day = state.day || 0;
        const filename = `broadside-${state.captainName || "captain"}-${state.faction || "unknown"}-day${state.day}.broadside`;
        const blob = new Blob([encoded], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        return state;
      }
      case window.E.A.IMPORT_SAVE: {
        const { state: loaded, tampered, error } = L.decodeSave(action.fileContent);
        if (error) return { ...state, log: [...state.log, `⚠ ${error}`] };
        const migrated = window.E.migrateState(loaded);
        if (tampered) migrated.log = [...(migrated.log || []), "⚠ This save file appears to have been modified."];
        return { ...migrated, screen: "port", battleState: null, activeEvent: null, encounterContext: null, portMarket: G.generatePortMarket(migrated.currentPort || "portRoyal"), missions: G.generateMissions(migrated.currentPort || "portRoyal", migrated) };
      }
      default:
        return state;
    }
  });

    // --- ONBOARDING REDUCER ------------------
  window.E._reducers.push((state, action) => {
    if (action.type === window.E.A.ONBOARDING_QM_SEEN) {
      if (!state.onboarding?.enabled || state.onboarding.completed) return state;
      return {
        ...state,
        onboarding: {
          ...state.onboarding,
          qmMessagesSeen: {
            ...state.onboarding.qmMessagesSeen,
            [action.messageKey]: true,
          },
        },
      };
    }
    return state;
  });

  window.E._reducers.push((state, action) => {
    if (action.type === window.E.A.ONBOARDING_SKIP) {
      if (!state.onboarding?.enabled || state.onboarding.completed) return state;

      const allStepsComplete = {};
      Object.keys(state.onboarding.stepsCompleted).forEach(k => {
        allStepsComplete[k] = true;
      });

      const newRoster = state.crew.roster.filter(
        m => !(m.tags || []).includes("quartermaster")
      );

      return {
        ...state,
        onboarding: {
          enabled: false,
          completed: true,
          currentStep: 9,
          stepsCompleted: allStepsComplete,
          qmMessagesSeen: state.onboarding.qmMessagesSeen || {},
          combatHintShown: true,
          qmDismissed: true,
        },
        crew: {
          ...state.crew,
          roster: newRoster,
        },
        log: [
          ...state.log,
          "You've decided to go it alone. All features are now available.",
        ],
      };
    }
    return state;
  });

  window.E._reducers.push((state, action) => {
  if (action.type === window.E.A.ONBOARDING_COMPLETE) {
    if (!state.onboarding?.enabled || state.onboarding.completed) return state;

    const qm = state.crew.roster.find(m => (m.tags || []).includes('quartermaster'));
    const farewellName = qm ? `${qm.firstName} ${qm.lastName}` : 'Your quartermaster';

    const newRoster = state.crew.roster.filter(m => !(m.tags || []).includes('quartermaster'));

    return {
      ...state,
      onboarding: {
        ...state.onboarding,
        enabled: false,
        completed: true,
        currentStep: 9,
      },
      crew: {
        ...state.crew,
        roster: newRoster,
      },
      log: [
        ...state.log,
        `${farewellName} tips his hat. "You've got your sea legs now, Captain, you don't need me around. Fair winds." He takes a jolly boat ashore.`,
      ],
    };
  }
  return state;
});


})();