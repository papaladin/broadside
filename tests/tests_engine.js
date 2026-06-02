// tests_engine.js — Reducer tests for engine.js
window.TESTS = window.TESTS || [];

window.TESTS.push({
  name: "Reducer: engine.js State Transitions",
  type: "reducer",
  tests: [
    // START_GAME tests — add resetRandomStub because generateRoster uses random
{
  name: "E.01 START_GAME english_william",
  run: (u) => {
    u.resetRandomStub();
    const start = D.STARTS.find(s => s.id === "english_william");
    const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: start.id });
    u.assertEqual(s.gold, start.gold);
    u.assertEqual(s.ship.type, start.ship);
    u.assertEqual(s.crew.max, D.SHIPS[start.ship].maxCrew);
    u.assertEqual(s.screen, "port");
  }
},
    {
  name: "E.02 START_GAME spanish_elena",
  run: (u) => {
    u.resetRandomStub();
    const start = D.STARTS.find(s => s.id === "spanish_elena");
    const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: start.id });
    u.assertEqual(s.ship.type, start.ship);
    u.assertEqual(s.gold, start.gold);
    // Spanish rep +10 → all Spanish ports 60, English rep -5 → all English 45
    u.assertEqual(s.reputation.havana, 60, "Spanish port rep 60");
    u.assertEqual(s.reputation.portRoyal, 45, "English port rep 45");
  }
},
{
  name: "E.03 START_GAME pirate_rosa",
  run: (u) => {
    u.resetRandomStub();
    const start = D.STARTS.find(s => s.id === "pirate_rosa");
    const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: start.id });
    u.assertEqual(s.ship.type, start.ship);
    u.assertEqual(s.gold, start.gold);
    // Pirate rep +10 → pirate ports 60, Spanish -5 → Spanish 45
    u.assertEqual(s.reputation.tortuga, 60, "Tortuga rep 60");
    u.assertEqual(s.reputation.havana, 45, "Havana rep 45");
  }
},
{
  name: "E.04 START_GAME english_william",
  run: (u) => {
    u.resetRandomStub();
    const start = D.STARTS.find(s => s.id === "english_william");
    const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: start.id });
    u.assertEqual(s.ship.type, start.ship);
    u.assertEqual(s.gold, start.gold);
    // English rep +10 → English ports 60
    u.assertEqual(s.reputation.portRoyal, 60, "Port Royal rep 60");
  }
},
    {
      name: "E.05 START_GAME invalid scenario",
      
      run: (u) => {
        const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "nope" });
        u.assertEqual(s.screen, "start", "Should stay on start screen");
      }
    },
    // SAIL_TO unchanged
    {
      name: "E.06 SAIL_TO sets destination and screen",
      
      run: (u) => {
        const state = { ...E.initialState, screen: "map", currentPort: "portRoyal", reputation: { tortuga: 50 } };
        const s = E.reducer(state, { type: E.A.SAIL_TO, port: "tortuga" });
        u.assertEqual(s.destination, "tortuga");
        u.assert(s.sailingDaysLeft > 0);
        u.assertEqual(s.screen, "sailing");
      }
    },
    // ENTER_PORT tests — update for intercept screen
    {
      name: "E.07 ENTER_PORT normal",
      
      run: (u) => {
        u.resetRandomStub();
        const state = { ...E.initialState, screen: "sailing", destination: "tortuga", sailingDaysLeft: 0, reputation: { tortuga: 50 }, crew: { roster: fillRoster(30), max: 50, morale: 80 } };
        const s = E.reducer(state, { type: E.A.ENTER_PORT });
        u.assertEqual(s.currentPort, "tortuga");
        u.assertEqual(s.screen, "port");
        u.assert(s.missions.length > 0);
      }
    },
    {
      name: "E.08 ENTER_PORT hostile (rep<10) triggers intercept",
      
      run: (u) => {
        const state = { ...E.initialState, screen: "sailing", destination: "portRoyal", sailingDaysLeft: 0, reputation: { portRoyal: 5 }, crew: { roster: fillRoster(30), max: 50, morale: 80 } };
        const s = E.reducer(state, { type: E.A.ENTER_PORT });
        u.assertEqual(s.screen, "intercept");
        u.assert(s.encounterContext !== null);
        u.assert(s.encounterContext.enemy.name.includes("Guards"));
        u.assertEqual(s.currentPort, "portRoyal");
      }
    },
    // ADVANCE_DAY tests — update crew shape and random sequences
    {
      name: "E.09 ADVANCE_DAY reduces days and deducts wages",
      
      run: (u) => {
        u.resetRandomStub();
        const state = {
          ...E.initialState,
          screen: "sailing", destination: "tortuga", sailingDaysLeft: 3, sailingDaysTotal: 3,
          gold: 1000,
          crew: { roster: fillRoster(30), max: 50, morale: 80 },
          reputation: { tortuga: 50 }
        };
        const s = E.reducer(state, { type: E.A.ADVANCE_DAY });
        u.assertEqual(s.sailingDaysLeft, 2);
        u.assert(s.gold < 1000);
        u.assertEqual(s.day, state.day + 1);
      }
    },
    {
      name: "E.10 ADVANCE_DAY smuggle mission intercept",
      
      run: (u) => {
        u.resetRandomStub();
        const mission = testMission({
          type: "smuggle", faction: "pirate", targetPort: "nassau",
          risk: "medium", gold: 400, infamyGain: 1,
          requiredGood: "rum", requiredQty: 5, patrolRisk: 0.30,
          enemy: { name: "The Serpent", hull: 50, cannons: 6, crew: 20, faction: "english" }
        });
        const state = {
          ...E.initialState,
          screen: "sailing", destination: "nassau", sailingDaysLeft: 3, sailingDaysTotal: 3,
          activeMission: { ...mission, encounterOccurred: false },
          crew: { roster: fillRoster(30), max: 50, morale: 80 },
          gold: 1000, reputation: { nassau: 50 }
        };
        u.setRandomSequence(new Array(20).fill(0.1));
        const s = E.reducer(state, { type: E.A.ADVANCE_DAY });
        u.assertEqual(s.screen, "intercept", "Smuggle intercept now goes to intercept screen");
        u.assert(s.encounterContext, "Encounter context should exist");
        u.resetRandomStub();
      }
    },
    {
      name: "E.11 ADVANCE_DAY random event (10% chance)",
      
      run: (u) => {
        u.resetRandomStub();
        u.setRandomSequence(new Array(30).fill(0.05)); // low chance triggers event
        const state = {
          ...E.initialState,
          screen: "sailing", destination: "tortuga", sailingDaysLeft: 3, sailingDaysTotal: 3,
          crew: { roster: fillRoster(30), max: 50, morale: 80 },
          gold: 1000, reputation: { tortuga: 50 }
        };
        const s = E.reducer(state, { type: E.A.ADVANCE_DAY });
        u.assert(s.activeEvent, "Random event should be active");
        u.assertEqual(s.screen, "event");  // now screen is "event"
        u.resetRandomStub();
      }
    },
    {
      name: "E.12 ADVANCE_DAY morale decay if <30",
      
      run: (u) => {
        u.resetRandomStub();
        const state = {
          ...E.initialState,
          screen: "sailing", destination: "tortuga", sailingDaysLeft: 3, sailingDaysTotal: 3,
          crew: { roster: fillRoster(30), max: 50, morale: 25 },
          gold: 1000, reputation: { tortuga: 50 }
        };
        const s = E.reducer(state, { type: E.A.ADVANCE_DAY });
        u.assert(s.crew.morale === 24, "Morale should decay by 1");
      }
    },
    // REPAIR — require log on failure (engine fix needed)
    {
      name: "E.13 REPAIR restores hull to effective max",
      
      run: (u) => {
        const state = { ...E.initialState, ship: { type: "sloop", hull: 50, upgrades: ["reinforced_hull"] }, gold: 1000 };
        const s = E.reducer(state, { type: E.A.REPAIR });
        u.assertEqual(s.ship.hull, Math.floor(D.SHIPS.sloop.maxHull * 1.2));
        u.assert(s.gold < 1000);
      }
    },
    {
      name: "E.14 REPAIR insufficient gold",
      
      run: (u) => {
        const state = { ...E.initialState, ship: { type: "sloop", hull: 50, upgrades: ["reinforced_hull"] }, gold: 10 };
        const s = E.reducer(state, { type: E.A.REPAIR });
        u.assertEqual(s.gold, 10);
        u.assertEqual(s.ship.hull, 50, "Hull unchanged");
      }
    },
    // BUY_SHIP — update crew shape
    {
      name: "E.15 BUY_SHIP changes ship and adjusts crew",
      
      run: (u) => {
        const state = { ...E.initialState, gold: 5000, fame: 100, ship: { type: "sloop", hull: 100, cannons: 10, upgrades: ["reinforced_hull"] }, crew: { roster: fillRoster(50), max: 50, morale: 80 } };
        const s = E.reducer(state, { type: E.A.BUY_SHIP, shipType: "frigate" });
        u.assertEqual(s.ship.type, "frigate");
        u.assertEqual(s.crew.max, D.SHIPS.frigate.maxCrew);
        u.assert(s.crew.roster.length <= s.crew.max, "Crew capped to new max");
        u.assert(s.ship.upgrades.length === 0, "Upgrades cleared");
        u.assertEqual(s.gold, 5000 - D.SHIPS.frigate.cost);
      }
    },
    {
      name: "E.16 BUY_SHIP not enough gold",
      
      run: (u) => {
        const state = { ...E.initialState, gold: 100, ship: { type: "sloop" } };
        const s = E.reducer(state, { type: E.A.BUY_SHIP, shipType: "galleon" });
        u.assertEqual(s.ship.type, "sloop");
      }
    },
    // BUY_UPGRADE — require log on failure (engine fix needed)
    {
      name: "E.17 BUY_UPGRADE installs upgrade",
      
      run: (u) => {
        const state = { ...E.initialState, ship: { type: "sloop", upgrades: [] }, gold: 1000 };
        const s = E.reducer(state, { type: E.A.BUY_UPGRADE, upgradeKey: "reinforced_hull" });
        u.assert(s.ship.upgrades.includes("reinforced_hull"));
        u.assertEqual(s.gold, 1000 - D.UPGRADES.reinforced_hull.cost);
      }
    },
    {
      name: "E.18 BUY_UPGRADE already installed",
      
      run: (u) => {
        const state = { ...E.initialState, ship: { type: "sloop", upgrades: ["reinforced_hull"] }, gold: 1000 };
        const s = E.reducer(state, { type: E.A.BUY_UPGRADE, upgradeKey: "reinforced_hull" });
        u.assertEqual(s.gold, 1000);
      }
    },
    {
      name: "E.19 BUY_UPGRADE incompatible ship",
      
      run: (u) => {
        const state = { ...E.initialState, ship: { type: "dinghy", upgrades: [] }, gold: 1000 };
        const s = E.reducer(state, { type: E.A.BUY_UPGRADE, upgradeKey: "extra_cannons" });
        u.assertEqual(s.gold, 1000);
      }
    },
    // HIRE_CREW — roster
    {
      name: "E.20 HIRE_CREW adds crew, deducts gold",
      
      run: (u) => {
        const state = { ...E.initialState, crew: { roster: fillRoster(20), max: 50, morale: 80 }, gold: 500 };
        const s = E.reducer(state, { type: E.A.HIRE_CREW, count: 5 });
        u.assertEqual(s.crew.roster.length, 25);
        u.assertEqual(s.gold, 250);
      }
    },
    // MISSIONS — intercept changes
    {
      name: "E.21 TAKE_MISSION combat type starts intercept",
      
      run: (u) => {
        const combatMission = testMission({
          type: "combat", faction: "english",
          enemy: { name: "The Iron Drake", hull: 60, cannons: 8, crew: 25, faction: "pirate" }
        });
        const state = { ...E.initialState, currentPort: "portRoyal", crew: { roster: fillRoster(30), morale: 80 } };
        const s = E.reducer(state, { type: E.A.TAKE_MISSION, mission: combatMission });
        u.assertEqual(s.screen, "intercept");
        u.assert(s.encounterContext, "Encounter context created");
      }
    },
    {
      name: "E.22 TAKE_MISSION trade type sets activeMission",
      
      run: (u) => {
        const tradeMission = testMission({
          type: "trade", targetPort: "nassau", requiredGood: "rum", requiredQty: 10, gold: 600
        });
        const state = makeState({ currentPort: "portRoyal", screen: "port" });
        const s = E.reducer(state, { type: E.A.TAKE_MISSION, mission: tradeMission });
        u.assert(s.activeMission, "Should have active mission");
        u.assertEqual(s.screen, "port", "Screen stays port for trade mission");
      }
    },
    {
      name: "E.23 COMPLETE_MISSION at target adds rewards",
      
      run: (u) => {
        u.resetRandomStub();
        const mission = { id:"test", name:"Test", gold:500, fame:20, repImpact:{english:10}, targetPort:"tortuga", faction:"english" };
        const state = { ...E.initialState, currentPort:"tortuga", activeMission: mission, gold:1000, fame:0, reputation:{ tortuga:50, portRoyal:50, kingston:50 }, crew: { roster: fillRoster(30), morale: 80 } };
        const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
        u.assertEqual(s.gold, 1550);
        u.assertEqual(s.fame, 20);
        u.assert(s.activeMission === null);
        u.assert(s.reputation.portRoyal === 60, "English rep +10");
      }
    },
    {
      name: "E.24 COMPLETE_MISSION wrong port fails",
      
      run: (u) => {
        const mission = { targetPort:"tortuga", gold:500 };
        const state = { ...E.initialState, currentPort:"portRoyal", activeMission: mission, gold:1000 };
        const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
        u.assertEqual(s.gold, 1000);
      }
    },
    {
      name: "E.25 ABANDON_MISSION clears mission and applies penalty",
      
      run: (u) => {
        const mission = { faction:"english" };
        const state = { ...E.initialState, activeMission: mission, reputation:{ portRoyal:50, kingston:50, tortuga:50 }, crew: { roster: fillRoster(30), morale: 80 } };
        const s = E.reducer(state, { type: E.A.ABANDON_MISSION });
        u.assert(s.activeMission === null);
        u.assert(s.reputation.portRoyal < 50, "Should lose reputation");
      }
    },
    {
      name: "E.26 REFRESH_MISSIONS regenerates missions",
      
      run: (u) => {
        u.resetRandomStub();
        const state = { ...E.initialState, currentPort:"portRoyal", missions:[], reputation:{ portRoyal:80 }, crew: { roster: fillRoster(30), morale: 80 } };
        const s = E.reducer(state, { type: E.A.REFRESH_MISSIONS });
        u.assert(s.missions.length > 0);
      }
    },
    // COMBAT — fix crew shape and battle states
{
  name: "E.27 BATTLE_ACTION victory when enemy hull<=0",
  
  run: (u) => {
    u.resetRandomStub();
    const state = {
      ...E.initialState, screen:"battle",
      ship: { type:"sloop", hull:100, upgrades:[] },
      crew: { roster: fillRoster(30), max:50, morale:80 },
      battleState: {
        phase:"player_turn", playerHull:100, playerCrew:30,
        enemy: { name:"test", hull:10, cannons:5, crew:10, faction:"pirate" },
        enemyHull:1, enemyCrew:10, round:1, log:[], returnScreen:"port",
        initialCrewCount: 30, lostCrewNames: []
      }
    };
    const s = E.reducer(state, { type: E.A.BATTLE_ACTION, action:"broadside" });
    u.assertEqual(s.battleState.phase, "victory");
    u.resetRandomStub();
  }
},
{
  name: "E.28 BATTLE_ACTION defeat when player hull<=0",
  
  run: (u) => {
    u.resetRandomStub();
    u.setRandomSequence(new Array(30).fill(0.9)); // high values → NPC hits hard
    const state = {
      ...E.initialState, screen:"battle",
      ship: { type:"sloop", hull:1, upgrades:[] },
      crew: { roster: fillRoster(30), max:50, morale:80 },
      battleState: {
        phase:"player_turn", playerHull:1, playerCrew:30,
        enemy: { name:"test", hull:100, cannons:50, crew:50, faction:"pirate" },
        enemyHull:100, enemyCrew:50, round:1, log:[], returnScreen:"port",
        initialCrewCount: 30, lostCrewNames: []
      }
    };
    const s = E.reducer(state, { type: E.A.BATTLE_ACTION, action:"broadside" });
    u.assertEqual(s.battleState.phase, "defeat");
    u.assertEqual(s.ship.hull, 0);
    u.assertEqual(s.screen, "battle", "Defeat stays on battle screen");
    u.resetRandomStub();
  }
},
{
  name: "E.29 BATTLE_ACTION flee (evade success)",
  
  run: (u) => {
    u.resetRandomStub();
    u.setRandomSequence(new Array(30).fill(0.0));
    const state = {
      ...E.initialState, screen:"battle",
      ship: { type:"sloop", hull:100, upgrades:[] },
      crew: { roster: fillRoster(30), max:50, morale:80 },
      battleState: {
        phase:"player_turn", playerHull:100, playerCrew:30,
        enemy: { name:"test", hull:100, cannons:10, crew:40, faction:"pirate" },
        enemyHull:100, enemyCrew:40, round:1, log:[], returnScreen:"port",
        initialCrewCount: 30, lostCrewNames: []
      }
    };
    const s = E.reducer(state, { type: E.A.BATTLE_ACTION, action:"evade" });
    u.assertEqual(s.battleState.phase, "fled");
    u.resetRandomStub();
  }
},
{
  name: "E.30 BATTLE_ACTION grapple instant victory",
  
  run: (u) => {
    u.resetRandomStub();
    u.setRandomSequence(new Array(30).fill(0.0));
    const state = {
      ...E.initialState, screen:"battle",
      ship: { type:"sloop", hull:100, upgrades:[] },
      crew: { roster: fillRoster(50), max:50, morale:90 },
      battleState: {
        phase:"player_turn", playerHull:100, playerCrew:50,
        enemy: { name:"test", hull:100, cannons:10, crew:30, faction:"pirate" },
        enemyHull:100, enemyCrew:30, round:1, log:[], returnScreen:"port",
        initialCrewCount: 50, lostCrewNames: []
      }
    };
    const s = E.reducer(state, { type: E.A.BATTLE_ACTION, action:"grapple" });
    u.assertEqual(s.battleState.phase, "victory");
    u.resetRandomStub();
  }
},
    // DISMISS_BATTLE — auto‑complete combat mission on victory (needs engine fix)
    {
      name: "E.31 DISMISS_BATTLE after victory keeps mission active (manual completion needed)",
      
      run: (u) => {
        const mission = testMission({ type: "combat", faction: "english",  targetPort: "portRoyal", enemy: { faction: "pirate" } });
        const state = {
          ...E.initialState, screen:"battle", currentPort:"portRoyal",
          activeMission: mission,
          battleState: { phase:"victory", returnScreen:"port", enemy:{ faction:"pirate" } },
          gold:1000, fame:0, reputation: { portRoyal:50 },
          crew: { roster: fillRoster(30), morale:80 }
        };
        const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
        u.assert(s.activeMission !== null, "Mission should still be active after battle");
        u.assertEqual(s.screen, "port");
        // Now manually complete
        const s2 = E.reducer(s, { type: E.A.COMPLETE_MISSION });
        u.assert(s2.activeMission === null, "Manual completion works");
        u.assert(s2.gold > 1000, "Gold reward added");
      }
    },
    {
      name: "E.32 DISMISS_BATTLE after fled while sailing returns to sailing",
      
      run: (u) => {
        const state = { ...E.initialState, screen:"battle", destination:"tortuga", sailingDaysLeft:2, battleState: { phase:"fled", returnScreen:"sailing" }, crew: { roster: fillRoster(30), morale:80 } };
        const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
        u.assertEqual(s.screen, "sailing");
      }
    },
    {
      name: "E.33 DISMISS_BATTLE after victory no mission returns to port",
      
      run: (u) => {
        const state = { ...E.initialState, screen:"battle", currentPort:"portRoyal", activeMission: null, battleState: { phase:"victory", returnScreen:"port" }, crew: { roster: fillRoster(30), morale:80 } };
        const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
        u.assertEqual(s.screen, "port");
      }
    },
    // EVENTS — fix crew shape and daysLost sign (engine fix)
    {
      name: "E.34 RESOLVE_EVENT gold gain",
      
      run: (u) => {
        const event = { choices: [{ label:"Take", outcome: { gold:200, log:"Got gold" } }] };
        const state = { ...E.initialState, activeEvent: event, gold:500, crew: { roster: fillRoster(30), morale:80 } };
        const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
        u.assertEqual(s.gold, 700);
        u.assert(s.log.some(l => l.includes("Got gold")));
      }
    },
    {
      name: "E.35 RESOLVE_EVENT hull damage",
      
      run: (u) => {
        const event = { choices: [{ outcome: { hullDamage:20 } }] };
        const state = { ...E.initialState, activeEvent: event, ship: { type:"sloop", hull:100, upgrades:[] }, crew: { roster: fillRoster(30), morale:80 } };
        const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
        u.assertEqual(s.ship.hull, 80);
      }
    },
    {
      name: "E.36 RESOLVE_EVENT crew loss",
      
      run: (u) => {
        u.resetRandomStub();   // already in file, just confirm
        const event = { choices: [{ outcome: { crewLoss:5 } }] };
        const state = {
          ...E.initialState,
          activeEvent: event,
          crew: { roster: fillRoster(20), max:50, morale:80 }
        };
        const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
        u.assertEqual(s.crew.roster.length, 15, "Lost 5 crew");
      }
    },
    {
      name: "E.37 RESOLVE_EVENT days lost",
      
      run: (u) => {
        const event = { choices: [{ outcome: { daysLost:3 } }] };
        const state = { ...E.initialState, activeEvent: event, day:10, sailingDaysLeft:5, sailingDaysTotal:8, crew: { roster: fillRoster(30), morale:80 } };
        const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
        u.assertEqual(s.day, 13);
        // daysLost adds to sailingDaysTotal and sailingDaysLeft (extends voyage)
        u.assertEqual(s.sailingDaysTotal, 11);
        u.assertEqual(s.sailingDaysLeft, 8);
      }
    },
    {
      name: "E.38 RESOLVE_EVENT reputation impact",
      
      run: (u) => {
        const event = { choices: [{ outcome: { repImpact:{english:10} } }] };
        const state = { ...E.initialState, activeEvent: event, reputation:{ portRoyal:50, kingston:50 }, crew: { roster: fillRoster(30), morale:80 } };
        const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
        u.assertEqual(s.reputation.portRoyal, 60);
      }
    },
    {
      name: "E.39 RESOLVE_EVENT triggers battle",
      
      run: (u) => {
        const event = { choices: [{ outcome: { battle: { enemy:{ name:"Navy", hull:100, cannons:10, crew:40, faction:"english" } } } }] };
        const state = { ...E.initialState, activeEvent: event, ship:{ type:"sloop", hull:100, upgrades:[] }, crew: { roster: fillRoster(30), morale:80 } };
        const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
        u.assertEqual(s.screen, "intercept");
        u.assert(s.encounterContext.enemy.name === "Navy");
      }
    },
    // SAVE/LOAD — these tests expect engine fixes
    {
      name: "E.40 SAVE_GAME stores state",
      
      run: (u) => {
        u.installLocalStorageMock();
        const state = { ...E.initialState, gold:1234 };
        const s = E.reducer(state, { type: E.A.SAVE_GAME });
        u.assert(JSON.parse(localStorage.getItem("piratesSave")).gold === 1234);
        u.restoreLocalStorage();
      }
    },
    {
      name: "E.41 LOAD_GAME restores state",
      
      run: (u) => {
        u.installLocalStorageMock();
        localStorage.setItem("piratesSave", JSON.stringify({ gold:9876, screen:"port", day:5 }));
        const s = E.reducer(E.initialState, { type: E.A.LOAD_GAME });
        u.assertEqual(s.gold, 9876);
        u.assertEqual(s.screen, "port");
        u.assertEqual(s.day, 5);
        u.restoreLocalStorage();
      }
    },
    {
      name: "E.42 LOAD_GAME no save",
      
      run: (u) => {
        u.installLocalStorageMock();
        localStorage.removeItem("piratesSave");
        const s = E.reducer(E.initialState, { type: E.A.LOAD_GAME });
        u.assertEqual(s.gold, E.initialState.gold);
        u.assert(s.log.some(l => l.includes("No saved game")));
        u.restoreLocalStorage();
      }
    },
    {
      name: "E.43 LOAD_GAME corrupted save",
      
      run: (u) => {
        u.installLocalStorageMock();
        localStorage.setItem("piratesSave", "not json");
        const s = E.reducer(E.initialState, { type: E.A.LOAD_GAME });
        u.assert(s.log.some(l => l.includes("Failed to load")));
        u.restoreLocalStorage();
      }
    },
    // New reducer tests from previous iterations (some already added, adjusting where needed)
{
  name: "E.44 BATTLE_ACTION logs lost crew names",
  
  run: (u) => {
    u.resetRandomStub();
    const roster = G.generateRoster(30, "pirate");
    u.setRandomSequence(new Array(30).fill(0.5));
    const state = {
      ...E.initialState, screen:"battle",
      ship: { type:"sloop", hull:100, upgrades:[] },
      crew: { roster, max:50, morale:80 },
      battleState: {
        phase:"player_turn", playerHull:100, playerCrew:30,
        enemy: { name:"test", hull:100, cannons:20, crew:40, faction:"pirate" },
        enemyHull:100, enemyCrew:40, round:1, log:[], returnScreen:"port",
        initialCrewCount: 30, lostCrewNames: []
      }
    };
    const s = E.reducer(state, { type: E.A.BATTLE_ACTION, action:"broadside" });
    if (s.crew.roster.length < 30) {
      u.assert(s.battleState.log.some(entry => entry.includes("Lost")), "Battle log mentions lost crew");
    }
    u.resetRandomStub();
  }
},
    // Intercept tests (E.50–E.57)
    {
      name: "E.50 INTERCEPT_FIGHT starts battle",
      
      run: (u) => {
        const state = {
          ...E.initialState,
          encounterContext: { enemy: { name: "test", hull: 100, cannons: 10, crew: 40, faction: "pirate", gold: 200 } },
          crew: { roster: fillRoster(30), max: 50, morale: 80 },
          ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] }
        };
        const s = E.reducer(state, { type: E.A.INTERCEPT_FIGHT });
        u.assertEqual(s.screen, "battle");
        u.assert(s.battleState, "BattleState created");
        u.assertEqual(s.battleState.enemy.name, "test");
      }
    },
    {
      name: "E.51 INTERCEPT_FLEE success",
      
      run: (u) => {
        u.resetRandomStub();
        const state = {
          ...E.initialState,
          destination: "tortuga",
          sailingDaysLeft: 2,
          encounterContext: {
            enemy: { name: "test", hull: 100 },
            options: { flee: { speedCheck: { player: 10, enemy: 1 } } }
          },
          crew: { roster: [], morale: 80 }
        };
        // L.roll(3) will use Math.random (we reset stub, so real random)
        const s = E.reducer(state, { type: E.A.INTERCEPT_FLEE });
        u.assertEqual(s.screen, "sailing");
        u.assert(s.log.some(l => l.includes("pulled clear")));
        u.resetRandomStub();
      }
    },
    {
      name: "E.52 INTERCEPT_FLEE failure leads to battle",
      
      run: (u) => {
        u.resetRandomStub();
        const state = {
          ...E.initialState,
          destination: "tortuga",
          sailingDaysLeft: 2,
          encounterContext: {
            enemy: { name: "test", hull: 100, cannons: 10, crew: 40 },
            options: { flee: { speedCheck: { player: 1, enemy: 10 } } }
          },
          crew: { roster: fillRoster(30), morale: 80 },
          ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] }
        };
        const s = E.reducer(state, { type: E.A.INTERCEPT_FLEE });
        u.assertEqual(s.screen, "battle");
        u.assert(s.battleState, "BattleState created");
        u.assert(s.log.some(l => l.includes("Failed to escape")));
        u.resetRandomStub();
      }
    },
    {
      name: "E.53 INTERCEPT_PARLEY (basic check)",
      
      run: (u) => {
        u.resetRandomStub();
        const state = {
          ...E.initialState,
          destination: "tortuga",
          currentPort: "portRoyal",
          sailingDaysLeft: 2,
          reputation: { tortuga: 50 },
          encounterContext: {
            type: "random",
            enemy: { name: "test", hull: 100 },
            options: { parley: { available: true, repRequired: 30 } }
          },
          crew: { roster: [], morale: 80 }
        };
        const s = E.reducer(state, { type: E.A.INTERCEPT_PARLEY });
        u.assert(s.screen === "sailing" || s.screen === "battle", "Screen is sailing or battle");
        u.resetRandomStub();
      }
    },
    {
      name: "E.54 INTERCEPT_BRIBE",
      
      run: (u) => {
        const state = {
          ...E.initialState,
          destination: "tortuga",
          currentPort: "portRoyal",
          sailingDaysLeft: 2,
          gold: 500,
          reputation: { tortuga: 30 },
          encounterContext: { options: { bribe: { cost: 200, available: true } } },
          crew: { roster: [], morale: 80 }
        };
        const s = E.reducer(state, { type: E.A.INTERCEPT_BRIBE });
        u.assertEqual(s.gold, 300);
        u.assertEqual(s.reputation.tortuga, 28);
        u.assertEqual(s.screen, "sailing");
        u.assert(s.log.some(l => l.includes("Bribed")));
      }
    },
    {
      name: "E.55 INTERCEPT_SURRENDER applies consequences",
      
      run: (u) => {
        const state = {
          ...E.initialState,
          destination: "tortuga",
          sailingDaysLeft: 2,
          gold: 500,
          crew: { roster: fillRoster(10), morale: 80, max: 50 },
          encounterContext: { encounterType: "random", type: "random", enemy: { name: "Pirate", faction: "pirate", ship: "sloop", hull: 50, maxHull: 50, cannons: 8, crew: 15 }, flavourText: "Pirates!", options: [ { id: "fight", label: "Fight", available: true, action: { type: "INTERCEPT_FIGHT" } }, { id: "surrender", label: "Surrender", available: true, action: { type: "INTERCEPT_SURRENDER" } } ] }
        };
        const s = E.reducer(state, { type: E.A.INTERCEPT_SURRENDER });
        u.assertEqual(s.gold, 300);
        u.assertEqual(s.crew.morale, 70);
        u.assertEqual(s.screen, "sailing");
        u.assert(s.log.some(l => l.includes("surrendered")));
      }
    },
    {
      name: "E.56 DISMISS_BATTLE after defeat uses previousPort",
      
      run: (u) => {
        const state = {
          ...E.initialState,
          previousPort: "portRoyal",
          currentPort: "tortuga",
          battleState: { phase: "defeat", returnScreen: "port" },
          crew: { roster: [], morale: 80 }
        };
        const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
        u.assertEqual(s.currentPort, "portRoyal");
        u.assert(s.log.some(l => l.includes("washed ashore")));
      }
    },
    {
      name: "E.57 Assault mission triggers combat on entry",
      
      run: (u) => {
        const mission = testMission({
          type: "assault", targetPort: "havana", faction: "english",
          enemy: { name: "Havana Guards", hull: 80, cannons: 12, crew: 40, faction: "spanish" }
        });
        const state = {
          ...E.initialState,
          destination: mission.targetPort,
          activeMission: mission,
          currentPort: "portRoyal",
          reputation: { [mission.targetPort]: 50 },
          crew: { roster: [], max: 50, morale: 80 }
        };
        const s = E.reducer(state, { type: E.A.ENTER_PORT });
        u.assertEqual(s.screen, "intercept");
        u.assert(s.encounterContext.enemy.name === mission.enemy.name, "Uses mission enemy");
      }
    },
    // Fame gating (P1.5)
    {
      name: "E.58 BUY_SHIP blocked by fame",
      
      run: (u) => {
        const state = { ...E.initialState, gold: 10000, fame: 10 };
        const s = E.reducer(state, { type: E.A.BUY_SHIP, shipType: "frigate" });
        u.assertEqual(s.ship.type, state.ship.type, "Ship type unchanged");
        u.assert(s.log.some(l => l.includes("Requires ★ 100 fame")), "Should log fame requirement");
      }
    },
    {
      name: "E.59 BUY_UPGRADE blocked by fame",
      
      run: (u) => {
        const state = { ...E.initialState, gold: 5000, fame: 10, ship: { type: "frigate", upgrades: [] } };
        const s = E.reducer(state, { type: E.A.BUY_UPGRADE, upgradeKey: "extra_cannons" });
        u.assert(!s.ship.upgrades.includes("extra_cannons"), "Upgrade not installed");
        u.assertEqual(s.gold, 5000, "Gold unchanged");
      }
    },
    {
      name: "E.60 TAKE_MISSION fame blocking removed (no longer gates)",
      
      run: (u) => {
        const mission = testMission({ type: "escort", targetPort: "nassau" });
        const state = { ...E.initialState, currentPort: "portRoyal", fame: 0, reputation: { nassau: 50 }, crew: { roster: fillRoster(30), morale: 80 } };
        const s = E.reducer(state, { type: E.A.TAKE_MISSION, mission });
        u.assert(s.activeMission !== null, "Mission accepted regardless of fame");
      }
    },
    {
      name: "E.61 BUY_SHIP with sufficient fame",
      
      run: (u) => {
        const state = { ...E.initialState, gold: 10000, fame: 100 };
        const s = E.reducer(state, { type: E.A.BUY_SHIP, shipType: "frigate" });
        u.assertEqual(s.ship.type, "frigate");
        u.assertEqual(s.gold, 10000 - D.SHIPS.frigate.cost);
      }
    },
    // Smuggle/Trade mission completion (E.66–E.70)
    {
      name: "E.66 COMPLETE_MISSION smuggle requires goods in hold",
      
      run: (u) => {
        const mission = testMission({
          type: "smuggle", targetPort: "nassau",
          gold: 400, infamyGain: 1, requiredGood: "tobacco", requiredQty: 5
        });
        const state = {
          ...E.initialState,
          currentPort: "nassau",
          activeMission: mission,
          hold: { capacity: 200, items: { tobacco: 5 } },
          gold: 1000, infamy: 9
        };
        const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
        u.assertEqual(s.gold, 1400);
        u.assertEqual(s.infamy, 10);
        u.assert(s.activeMission === null);
      }
    },
    {
      name: "E.67 COMPLETE_MISSION assault increases infamy",
      
      run: (u) => {
        const mission = testMission({
          type: "assault", targetPort: "portRoyal", faction: "pirate", infamyGain: 3
        });
        const state = {
          ...E.initialState,
          currentPort: "portRoyal",
          activeMission: mission,
          gold: 1000, infamy: 5
        };
        const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
        u.assertEqual(s.infamy, 8);
        u.assert(s.activeMission === null);
      }
    },
    {
      name: "E.68 COMPLETE_MISSION trade no infamy",
      
      run: (u) => {
        const mission = testMission({ type: "trade", requiredGood: "rum", requiredQty: 5 });
        const state = {
          ...E.initialState,
          currentPort: mission.targetPort || "tortuga",
          activeMission: mission,
          hold: { capacity: 200, items: { rum: 5 } },
          gold: 1000, infamy: 5
        };
        const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
        u.assertEqual(s.infamy, 5);
        u.assert(s.activeMission === null);
      }
    },
    {
      name: "E.69 COMPLETE_MISSION infamy threshold Clean to Suspect",
      
      run: (u) => {
        const mission = testMission({ type: "smuggle", infamyGain: 1 });
        const state = {
          ...E.initialState,
          currentPort: mission.targetPort || "nassau",
          activeMission: mission,
          hold: { capacity: 200, items: { rum: 5 } },
          gold: 1000, infamy: 9
        };
        const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
        u.assertEqual(s.infamy, 10);
        u.assert(s.activeMission === null);
      }
    },
    {
      name: "E.70 COMPLETE_MISSION infamy threshold Suspect to Notorious",
      
      run: (u) => {
        const mission = testMission({ type: "smuggle", infamyGain: 1 });
        const state = {
          ...E.initialState,
          currentPort: mission.targetPort || "nassau",
          activeMission: mission,
          hold: { capacity: 200, items: { rum: 5 } },
          gold: 1000, infamy: 19
        };
        const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
        u.assertEqual(s.infamy, 20);
        u.assert(s.activeMission === null);
      }
    },
    // Hold capacity (E.87)
    {
      name: "E.87 BUY_SHIP updates hold capacity",
      
      run: (u) => {
        const state = {
          ...E.initialState,
          gold: 10000,
          fame: 150,
          ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] },
          hold: { capacity: 100, items: {} }
        };
        const s = E.reducer(state, { type: E.A.BUY_SHIP, shipType: "galleon" });
        u.assertEqual(s.ship.type, "galleon");
        u.assertEqual(s.hold.capacity, D.SHIPS.galleon.holdCapacity);
      }
    },
    // Log message tests (E.81, E.85)
    {
      name: "E.81 ADVANCE_DAY food stores empty log",
      
      run: (u) => {
        u.resetRandomStub();
        const state = {
          ...E.initialState,
          screen: "sailing", destination: "tortuga", sailingDaysLeft: 1, sailingDaysTotal: 1,
          crew: { roster: fillRoster(30), max: 50, morale: 80 },
          hold: { capacity: 200, items: { food: 1 } }
        };
        const s = E.reducer(state, { type: E.A.ADVANCE_DAY });
        u.assert(s.log.some(l => l.includes("food stores are empty")));
      }
    },
    {
      name: "E.85 CONFIRM_TRADE not enough stock log",
      
      run: (u) => {
        const state = {
          ...E.initialState,
          currentPort: "portRoyal",
          screen: "port",
          hold: { capacity: 200, items: {} },
          portMarket: { goods: { rum: { available: 0, buyFromPort: 10 } } }   };
          const s = E.reducer(state, { type: E.A.CONFIRM_TRADE, buys: { rum: 10 }, sells: {} });
          u.assert(s.log.some(l => l.includes("Not enough rum available")));
      }
    },


{
  name: "E.M.1 migrateState adds version to old saves",
  
  run: (u) => {
    const old = { gold: 500, screen: "port" }; // no version field
    const migrated = E.migrateState(old);
    u.assertEqual(migrated.version, 2);
    u.assertEqual(migrated.gold, 500, "Existing fields preserved");
  }
},
{
  name: "E.M.2 LOAD_GAME migrates versionless save",
  
  run: (u) => {
    u.installLocalStorageMock();
    u.clearLocalStorageMock();
    // Simulate an old save without a version field
    const old = { ...E.initialState, version: undefined, gold: 9999, screen: "port" };
    localStorage.setItem("piratesSave", JSON.stringify(old));
    const s = E.reducer(E.initialState, { type: E.A.LOAD_GAME });
    u.assertEqual(s.gold, 9999);
    u.assert(s.version >= 1, "Version should be set after migration");
    u.restoreLocalStorage();
  }
},

{
  name: "E.AS.1 ENTER_PORT auto-saves state",
  
  run: (u) => {
    u.installLocalStorageMock();
    u.clearLocalStorageMock();
    let s = makeState({ screen: "sailing", destination: "tortuga", sailingDaysLeft: 0 });
    s = E.reducer(s, { type: E.A.ENTER_PORT });
    const saved = localStorage.getItem("piratesSave");
    u.assert(saved !== null, "Should have saved after ENTER_PORT");
    const parsed = JSON.parse(saved);
    u.assertEqual(parsed.screen, "port");
    u.restoreLocalStorage();
  }
},
// ── Hidden port discovery (Layer 3) ──
{
  name: "E.DP.1 DISCOVER_PORT adds port and logs entry",
  
  run: (u) => {
    const s = makeState({
      discoveredPorts: Object.keys(D.PORTS).filter(k => !D.PORTS[k].hidden),
    });
    const next = E.reducer(s, { type: E.A.DISCOVER_PORT, portKey: "libertalia" });
    u.assert(next.discoveredPorts.includes("libertalia"), "Libertalia should be discovered");
    u.assert(next.log.some(l => l.includes("Libertalia")), "Discovery logged");
  }
},
{
  name: "E.DP.2 DISCOVER_PORT is idempotent",
  
  run: (u) => {
    const s = {
      ...makeState({
        screen: "sailing", destination: "tortuga", sailingDaysLeft: 3,
        fame: 50,
        infamy: 25,
        discoveredPorts: Object.keys(D.PORTS).filter(k => !D.PORTS[k].hidden),
        hold: { capacity: 200, items: { food: 10, water: 10 } },
        gold: 500,
        reputation: { ...E.initialState.reputation, tortuga: 70, nassau: 70 },  // pirate ports high
      }),
    };
    const logBefore = s.log.length;
    const next = E.reducer(s, { type: E.A.DISCOVER_PORT, portKey: "libertalia" });
    u.assertEqual(next.discoveredPorts.filter(k => k === "libertalia").length, 1, "Should not duplicate");
    u.assertEqual(next.log.length, logBefore, "Should not re-log");
  }
},
{
  name: "E.DP.3 ADVANCE_DAY auto-discovers dryTortugas at fame 50",
  
  run: (u) => {
    const s = {
      ...makeState({
        screen: "sailing", destination: "tortuga", sailingDaysLeft: 3,
        fame: 50,
        infamy: 25,
        discoveredPorts: Object.keys(D.PORTS).filter(k => !D.PORTS[k].hidden),
        hold: { capacity: 200, items: { food: 10, water: 10 } },
        gold: 500,
        reputation: { ...E.initialState.reputation, tortuga: 70, nassau: 70, },
      }),
    };
    const next = E.reducer(s, { type: E.A.ADVANCE_DAY });
    u.assert(next.discoveredPorts.includes("dryTortugas"), "Dry Tortugas should be discovered at fame 50");
    u.assert(next.log.some(l => l.includes("Dry Tortugas")));
  }
},
{
  name: "E.DP.4 map_libertalia fragment discovers Libertalia",
  
  run: (u) => {
    const chartEvent = D.RANDOM_EVENTS.find(e => e.id === "mysterious_chart");
    u.assert(chartEvent, "mysterious_chart event must exist in RANDOM_EVENTS");
    const s = {
      ...makeState({ fame: 100, mapFragments: [] }),
      activeEvent: chartEvent,
      discoveredPorts: Object.keys(D.PORTS).filter(k => !D.PORTS[k].hidden),
    };
    // Choice index 0 = "Take the chart"
    const next = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 });
    u.assert(next.mapFragments.includes("map_fragment_libertalia"), "Fragment added to state");
    u.assert(next.discoveredPorts.includes("libertalia"), "Libertalia discovered via fragment");
  }
},

    // Market price test (G.31)
    {
      name: "G.31 Market price for food",
      
      run: (u) => {
        const state = {
          ...E.initialState,
          currentPort: "portRoyal",
          market: { goods: { food: { stock: 100, buyFromPort: D.RESOURCES.food.basePrice } } }
        };
        u.assertEqual(state.market.goods.food.buyFromPort, 3);
      }
    },

    // ── Drifting Wreck ──────────────────────────────────────────────
{
  name: "E.DW.1 Drifting Wreck – Leave it be",
  run: (u) => {
    let s = makeState({
      screen: "sailing",
      activeEvent: D.RANDOM_EVENTS.find(e => e.id === "drifting_wreck"),
    });
    s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 1 });
    u.assertEqual(s.activeEvent, null, "Event cleared");
    u.assertEqual(s.screen, "sailing");
    u.assert(s.log.some(l => l.includes("leave the wreck")));
  }
},
{
  name: "E.DW.2 Drifting Wreck – Search (cargo branch, no capacity check)",
  run: (u) => {
    // We'll force the cargo branch by stubbing Math.random to 0.1 (<0.50)
    u.resetRandomStub();
    u.setRandomSequence([0.1]); // only one roll used in RESOLVE_DRIFTING_WRECK_SEARCH
    let s = makeState({
      screen: "sailing",
      hold: { items: { food: 5, water: 5 } },
      activeEvent: D.RANDOM_EVENTS.find(e => e.id === "drifting_wreck"),
    });
    s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 }); // triggers RESOLVE_DRIFTING_WRECK_SEARCH
    u.assertEqual(s.activeEvent, null);
    u.assertEqual(s.screen, "sailing");
    u.assert(s.gold > makeState().gold, "Gold increased");
    u.assert(Object.values(s.hold.items).some(v => v > 0), "Cargo added");
    u.assert(s.log.some(l => l.includes("cargo")));
    u.resetRandomStub();
  }
},
{
  name: "E.DW.3 Drifting Wreck – Search (nothing branch)",
  run: (u) => {
    u.resetRandomStub();
    u.setRandomSequence([0.6]); // 0.50–0.70 → nothing
    let s = makeState({
      screen: "sailing",
      activeEvent: D.RANDOM_EVENTS.find(e => e.id === "drifting_wreck"),
    });
    s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 });
    u.assertEqual(s.activeEvent, null);
    u.assert(s.log.some(l => l.includes("empty")));
    u.resetRandomStub();
  }
},
{
  name: "E.DW.4 Drifting Wreck – Search (survivor branch)",
  run: (u) => {
    u.resetRandomStub();
    u.setRandomSequence([0.8]); // 0.70–0.90 → survivor
    let s = makeState({
      screen: "sailing",
      crew: { roster: fillRoster(10), max: 50, morale: 80 },
      activeEvent: D.RANDOM_EVENTS.find(e => e.id === "drifting_wreck"),
    });
    s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 });
    u.assertEqual(s.crew.roster.length, 11);
    const last = s.crew.roster[s.crew.roster.length - 1];
    u.assert(last.tags.includes("scar_shipwreck"), "Survivor has scar tag");
    u.assert(s.log.some(l => l.includes("survivor")));
    u.resetRandomStub();
  }
},
{
  name: "E.DW.5 Drifting Wreck – Search (trap branch)",
  run: (u) => {
    u.resetRandomStub();
    u.setRandomSequence([0.95]); // ≥0.90 → trap
    let s = makeState({
      screen: "sailing",
      activeEvent: D.RANDOM_EVENTS.find(e => e.id === "drifting_wreck"),
    });
    s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 });
    u.assertEqual(s.screen, "intercept");
    u.assert(s.encounterContext, "Encounter context exists");
    u.assert(s.encounterContext.enemy.name.includes("Wreck Looters"));
    u.resetRandomStub();
  }
},

// ── Marooned Sailors ────────────────────────────────────────────
{
  name: "E.MS.1 Marooned Sailors – Take aboard",
  run: (u) => {
    let s = makeState({
      screen: "sailing",
      crew: { roster: fillRoster(10), max: 50, morale: 80 },
      activeEvent: D.RANDOM_EVENTS.find(e => e.id === "drifting_sailors"),
    });
    s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 });
    u.assertEqual(s.crew.roster.length, 13, "3 crew added");
    u.assert(s.log.some(l => l.includes("join")));
  }
},
{
  name: "E.MS.2 Marooned Sailors – Pay off",
  run: (u) => {
    let s = makeState({
      screen: "sailing",
      gold: 200,
      crew: { roster: fillRoster(10), max: 50, morale: 50 },
      activeEvent: D.RANDOM_EVENTS.find(e => e.id === "drifting_sailors"),
    });
    s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 1 });
    u.assertEqual(s.gold, 150, "50g deducted");
    u.assertEqual(s.crew.morale, 53, "Morale +3");
  }
},
{
  name: "E.MS.3 Marooned Sailors – Sail on",
  run: (u) => {
    let s = makeState({
      screen: "sailing",
      crew: { roster: fillRoster(10), max: 50, morale: 50 },
      activeEvent: D.RANDOM_EVENTS.find(e => e.id === "drifting_sailors"),
    });
    s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 2 });
    u.assertEqual(s.crew.morale, 49, "Morale -1");
  }
},

// ── Faction Heat ──────────────────────────────────────────────
{
  name: "E.HEAT.1 DISMISS_BATTLE victory adds heat to enemy faction",
  run: (u) => {
    const state = makeState({
      screen: "battle",
      battleState: {
        phase: "victory", returnScreen: "port",
        enemy: { name: "Test", hull: 100, cannons: 10, crew: 40, faction: "spanish" },
        encounterType: "random",
        playerHull: 80, enemyHull: 0,
        playerCrew: 25, enemyCrew: 0,
        round: 2, log: [], initialCrewCount: 30, lostCrewNames: []
      },
      factionAlerts: { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 },
    });
    const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
    u.assertEqual(s.factionAlerts.spanish, 3, "Spanish heat +3");
  }
},
{
  name: "E.HEAT.2 DISMISS_BATTLE does not add heat for pirate faction",
  run: (u) => {
    const state = makeState({
      screen: "battle",
      battleState: {
        phase: "victory", returnScreen: "port",
        enemy: { name: "Pirate", hull: 100, cannons: 10, crew: 40, faction: "pirate" },
        encounterType: "random",
        playerHull: 80, enemyHull: 0,
        playerCrew: 25, enemyCrew: 0,
        round: 2, log: [], initialCrewCount: 30, lostCrewNames: []
      },
      factionAlerts: { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 },
    });
    const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
    u.assertEqual(s.factionAlerts.pirate, 0, "Pirate heat unchanged");
  }
},
{
  name: "E.HEAT.3 INTERCEPT_FLEE success adds heat for navy patrol",
  run: (u) => {
    u.resetRandomStub();
    u.setRandomSequence([0.0]); // low roll ensures flee success
    const state = makeState({
      screen: "intercept",
      destination: "havana",
      sailingDaysLeft: 3,
      encounterContext: {
        type: "navy_patrol",
        encounterType: "navy_patrol",
        enemy: { name: "Patrol", hull: 100, cannons: 10, crew: 40, faction: "spanish" },
        options: [ { id: "flee", speedCheck: { player: 10, enemy: 5 } } ]
      },
      factionAlerts: { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 },
    });
    const s = E.reducer(state, { type: E.A.INTERCEPT_FLEE });
    u.assertEqual(s.factionAlerts.spanish, 2, "Spanish heat +2 after fleeing");
    u.resetRandomStub();
  }
},
{
  name: "E.HEAT.4 ATTACK_MERCHANT adds heat to merchant faction",
  run: (u) => {
    u.resetRandomStub();
    const state = makeState({
      factionAlerts: { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 },
    });
    const s = E.reducer(state, { type: E.A.ATTACK_MERCHANT });
    // ATTACK_MERCHANT picks a random non-pirate faction; any non-pirate should have heat +2
    const totalHeat = Object.entries(s.factionAlerts)
      .filter(([f]) => f !== "pirate")
      .reduce((sum, [_, v]) => sum + v, 0);
    u.assertEqual(totalHeat, 2, "Exactly 2 heat added to the merchant's faction");
    u.resetRandomStub();
  }
},
{
  name: "E.HEAT.5 ADVANCE_DAY decays faction alerts every 2 days",
  run: (u) => {
    u.resetRandomStub();
    let s = makeState({
      screen: "sailing", destination: "tortuga", sailingDaysLeft: 5, sailingDaysTotal: 5,
      day: 2,
      factionAlerts: { english: 5, spanish: 3, french: 0, dutch: 0, pirate: 0 },
      hold: { items: { food: 10, water: 10 } },
    });
    s = E.reducer(s, { type: E.A.ADVANCE_DAY });
    // day 2 → 3, so decay triggers because day 3 % 2 != 0? Wait, decay on day%2===0 (before increment). We need day to be even initially. Let's set day=2, so day%2===0 → decay. After ADVANCE_DAY, day becomes 3. Actually we need to check state.day % 2 === 0 before decay. In our ADVANCE_DAY we compute newRep then decay heat. Let's set state.day = 2, so before increment day is 2, which is even. So decay should happen. We'll verify heat decreased by 1.
    u.assertEqual(s.factionAlerts.english, 4, "English heat decayed from 5 to 4");
    u.assertEqual(s.factionAlerts.spanish, 2, "Spanish heat decayed from 3 to 2");
    u.assertEqual(s.factionAlerts.french, 0, "Zero stays zero");
    u.resetRandomStub();
  }
},
{
  name: "E.HEAT.6 Heat caps at 10",
  run: (u) => {
    const state = makeState({
      screen: "battle",
      battleState: {
        phase: "victory", returnScreen: "port",
        enemy: { name: "Test", hull: 100, cannons: 10, crew: 40, faction: "spanish" },
        encounterType: "random",
        playerHull: 80, enemyHull: 0,
        playerCrew: 25, enemyCrew: 0,
        round: 2, log: [], initialCrewCount: 30, lostCrewNames: []
      },
      factionAlerts: { english: 0, spanish: 10, french: 0, dutch: 0, pirate: 0 },
    });
    const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
    u.assertEqual(s.factionAlerts.spanish, 10, "Heat capped at 10");
  }
},
// ── Mutiny Negotiate Conditional Cost ─────────────────────────
{
  name: "E.MUTINY.1 Mutiny negotiate with enough gold",
  run: (u) => {
    const mutinyEvent = D.RANDOM_EVENTS.find(e => e.id === "mutiny");
    u.assert(mutinyEvent, "mutiny event must exist");
    const state = makeState({
      activeEvent: mutinyEvent,
      gold: 1000,
      crew: { roster: fillRoster(30), morale: 15, max: 50 },
    });
    const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 });
    // Cost = 30 * 10 = 300g
    u.assertEqual(s.gold, 700, "Gold should be deducted by 300");
    u.assertEqual(s.crew.morale, 35, "Morale +20 from negotiate (15+20)");
    u.assert(s.log.some(l => l.includes("stands down")), "Log should indicate crew stands down");
  }
},
{
  name: "E.MUTINY.2 Mutiny negotiate with insufficient gold",
  run: (u) => {
    const mutinyEvent = D.RANDOM_EVENTS.find(e => e.id === "mutiny");
    u.assert(mutinyEvent, "mutiny event must exist");
    const state = makeState({
      activeEvent: mutinyEvent,
      gold: 50,
      crew: { roster: fillRoster(10), morale: 15, max: 50 },
    });
    const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 });
    // Cost = 10 * 10 = 100g, but only 50g available -> negotiation fails
    u.assertEqual(s.gold, 50, "Gold unchanged");
    u.assertEqual(s.crew.morale, 10, "Morale -5 (15-5)");
    u.assert(s.log.some(l => l.includes("empty words")), "Log should indicate empty promise");
  }
},

// ── Heat Gossip on Port Entry ─────────────────────────────────
{
  name: "E.GOSSIP.1 ENTER_PORT with low heat has no gossip",
  run: (u) => {
    u.resetRandomStub();
    const state = makeState({
      screen: "sailing",
      destination: "havana",
      sailingDaysLeft: 0,
      reputation: { havana: 50 },
      factionAlerts: { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 },
      crew: { roster: fillRoster(10), max: 50, morale: 80 },
      hold: { items: { food: 5, water: 5 } },
    });
    const s = E.reducer(state, { type: E.A.ENTER_PORT });
    u.assertEqual(s.portGossip.length, 0, "No gossip when heat is low");
    u.resetRandomStub();
  }
},
{
  name: "E.GOSSIP.2 ENTER_PORT with high heat produces warning",
  run: (u) => {
    u.resetRandomStub();
    const state = makeState({
      screen: "sailing",
      destination: "havana",
      sailingDaysLeft: 0,
      reputation: { havana: 50 },
      factionAlerts: { english: 0, spanish: 5, french: 0, dutch: 0, pirate: 0 },
      crew: { roster: fillRoster(10), max: 50, morale: 80 },
      hold: { items: { food: 5, water: 5 } },
    });
    const s = E.reducer(state, { type: E.A.ENTER_PORT });
    u.assert(s.portGossip.length > 0, "Gossip should be present");
    u.assert(s.portGossip[0].includes("Soldiers") || s.portGossip[0].includes("garrison"), "Gossip mentions patrols or garrison");
    u.resetRandomStub();
  }
},
  ]
});
