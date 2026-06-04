// engine_core.js — Shared Infrastructure
// Exposes window.E with A, initialState, reducer, shared helpers.
// Loaded first; domain files push reducers into window.E._reducers.
console.log("engine_core.js loaded");

// Ensure window.E exists before anything else
window.E = window.E || {};

(function() {
  const { PORTS } = window.D;
  const L = window.L;
  const G = window.G;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  ACTION CONSTANTS (all 44)
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
    REPAIR: "REPAIR",
    BUY_SHIP: "BUY_SHIP",
    BUY_UPGRADE: "BUY_UPGRADE",
    HIRE_CREW: "HIRE_CREW",
    RAISE_MORALE: "RAISE_MORALE",
    REFRESH_MISSIONS: "REFRESH_MISSIONS",
    TAKE_MISSION: "TAKE_MISSION",
    COMPLETE_MISSION: "COMPLETE_MISSION",
    ABANDON_MISSION: "ABANDON_MISSION",
    CONFIRM_TRADE: "CONFIRM_TRADE",
    ENTER_MARKET: "ENTER_MARKET",
    LEAVE_MARKET: "LEAVE_MARKET",
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
    
    // Ensure all crew members have tags array (for T2.2+)
    if (s.crew?.roster) {
      s.crew.roster = s.crew.roster.map(member => ({
        ...member,
        tags: member.tags || [],
      }));
    }
    return s;
  };

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
    screen: "start",
    day: 1,
    log: [],
    gold: 1000,
    fame: 0,
    infamy: 0,
    factionAlerts: {
      english: 0,
      spanish: 0,
      french: 0,
      dutch: 0,
      pirate: 0,
    },
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

  window.E.reducer = (state, action) => {
    return window.E._reducers.reduce(
      (s, r) => r(s, action),
      state
    );
  };

  console.log("engine_core.js setup complete, _reducers ready");

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
        ship: { type: action.shipType, name: s.name, hull: s.maxHull, cannons: s.cannons, upgrades: [] },
        hold: { ...state.hold, capacity: s.holdCapacity },
        crew: { ...state.crew, max: s.maxCrew },
      };
    }

    case window.E.A.DEBUG_SET_PORT_REP:
      return {
        ...state,
        reputation: { ...state.reputation, [action.port]: action.amount }
      };

    case window.E.A.DEBUG_FILL_HOLD:
      return {
        ...state,
        hold: { ...state.hold, items: {
          food: 20, water: 20, rum: 10, sugar: 8, spices: 4,
          silk: 3, cloth: 6, weapons: 5, coffee: 5, cocoa: 4,
          timber: 0, tobacco: 3, silver: 2, slaves: 0,
        }}
      };

    case window.E.A.DEBUG_REPAIR: {
      const stats = L.getShipStats(state);
      return {
        ...state,
        ship: { ...state.ship, hull: stats.maxHull },
        hold: { ...state.hold, items: {
          ...state.hold.items,
          food: Math.ceil(state.crew.roster.length / 10) * 10,
          water: Math.ceil(state.crew.roster.length / 10) * 10,
        }},
      };
    }

    case window.E.A.DEBUG_SET_MORALE:
      return { ...state, crew: { ...state.crew, morale: Math.min(100, Math.max(0, action.morale)) } };

    case window.E.A.DEBUG_UNLOCK_HIDDEN_PORTS:
      return {
        ...state,
        discoveredPorts: Object.keys(window.D.PORTS),
        log: [...state.log, "⚙ All hidden ports unlocked."],
      };

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

    // Random days aboard (10–250) to trigger seasoned/veteran/loyal
    member.daysAboard = Math.floor(Math.random() * 240) + 10;

    // ── Status tags ──────────────────────────────────────
    const rollLoyal = Math.random() < 0.30;  // 30% loyal
    if (rollLoyal) {
      member.tags.push("loyal");
    }

    const rollUpset = Math.random() < 0.30 && !rollLoyal;  // upset only if not loyal
    if (rollUpset) {
      member.tags.push("upset");
    }

    if (Math.random() < 0.25) member.tags.push("mutineer");  // 25% mutineer

    // ── Scars ────────────────────────────────────────────
    if (Math.random() < 0.35) member.tags.push("scar_battle");
    if (Math.random() < 0.25) member.tags.push("scar_storm");
    if (Math.random() < 0.15) member.tags.push("scar_shipwreck");

    // ── Revealed traits (bypass hidden, for UI testing) ───
    if (Math.random() < 0.25) member.tags.push("revealed_drunkard");
    if (Math.random() < 0.15) member.tags.push("revealed_coward");
    if (Math.random() < 0.15) member.tags.push("revealed_greedy");

    // ── Also add a hidden trait occasionally (will be invisible) ──
    if (Math.random() < 0.20) {
      const hiddenPool = ["hidden_drunkard", "hidden_coward", "hidden_greedy"];
      member.tags.push(hiddenPool[Math.floor(Math.random() * hiddenPool.length)]);
    }

    newMembers.push(member);
    existingNames.push(`${member.firstName} ${member.lastName}`);
  }

  return {
    ...state,
    crew: { ...state.crew, roster: [...state.crew.roster, ...newMembers] },
    log: [...state.log, `⚙ Hired ${deficit} crew with random traits for testing.`],
  };
}


    case window.E.A.DEBUG_COMPLETE_MISSION: {
      const mission = state.activeMission;
      if (!mission) return state;
      const rep = state.reputation[state.currentPort] ?? 50;
      const perk = L.getRepPerk(rep);
      const baseGold = mission.gold || 0;
      const finalGold = (mission.type === "trade" || mission.type === "smuggle")
        ? baseGold
        : Math.floor(baseGold * perk.missionMult);
      const newRep = L.applyReputationImpact(state, mission.repImpact);
      return {
        ...state,
        gold: state.gold + finalGold,
        fame: state.fame + (mission.fame || 0),
        infamy: Math.min(999, (state.infamy ?? 0) + (mission.infamyGain || 0)),
        reputation: newRep,
        activeMission: null,
        log: [...state.log, `⚙ Debug-completed mission: ${mission.name}. +${finalGold}g.`],
      };
    }

    case window.E.A.DEBUG_SET_HEAT: {
  const alerts = { ...(state.factionAlerts || {}) };
  alerts[action.faction] = Math.min(10, Math.max(0, action.amount));
  return { ...state, factionAlerts: alerts };
}

case window.E.A.DEBUG_AGE_CREW: {
  const aged = state.crew.roster.map(member => ({
    ...member,
    daysAboard: (member.daysAboard || 0) + 50,
  }));
  return {
    ...state,
    crew: { ...state.crew, roster: aged },
    log: [...state.log, `⚙ Added 50 days aboard to all crew.`],
  };
}


    default:
      return state;
  }
});
})();