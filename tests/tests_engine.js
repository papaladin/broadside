// tests_engine.js — Reducer tests for engine.js
window.TESTS = window.TESTS || [];

window.TESTS.push({
  name: "Reducer: engine.js State Transitions",
  tests: [
    // START_GAME tests — add resetRandomStub because generateRoster uses random
    {
      name: "E.01 START_GAME merchant",
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[0].id });
        u.assertEqual(s.gold, D.STARTS[0].gold);
        u.assertEqual(s.ship.type, D.STARTS[0].ship);
        u.assertEqual(s.crew.max, D.SHIPS[D.STARTS[0].ship].maxCrew);
        u.assertEqual(s.screen, "port");
      }
    },
    {
      name: "E.02 START_GAME privateer",
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[1].id });
        u.assertEqual(s.ship.type, D.STARTS[1].ship);
        u.assertEqual(s.gold, D.STARTS[1].gold);
        u.assert(s.reputation.portRoyal === 60, "English rep +10");
        u.assert(s.reputation.kingston === 60, "English rep +10");
      }
    },
    {
      name: "E.03 START_GAME pirate",
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[2].id });
        u.assertEqual(s.ship.type, D.STARTS[2].ship);
        u.assertEqual(s.gold, D.STARTS[2].gold);
        u.assert(s.reputation.tortuga === 70, `Expected 70 but got ${s.reputation.tortuga}`);
        u.assert(s.reputation.nassau === 70, `Expected 70 but got ${s.reputation.nassau}`);
      }
    },
    {
      name: "E.04 START_GAME admiral",
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[3].id });
        u.assertEqual(s.ship.type, D.STARTS[3].ship);
        u.assertEqual(s.gold, D.STARTS[3].gold);
        u.assert(s.reputation.portRoyal === 80, "English rep +30");
      }
    },
    {
      name: "E.05 START_GAME invalid scenario",
      type: "reducer",
      run: (u) => {
        const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "nope" });
        u.assertEqual(s.screen, "start", "Should stay on start screen");
      }
    },
    // SAIL_TO unchanged
    {
      name: "E.06 SAIL_TO sets destination and screen",
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
        // wind (2) + intercept check (1) = 3 values
        u.setRandomSequence([0.5, 0.5, 0.1]);
        const s = E.reducer(state, { type: E.A.ADVANCE_DAY });
        u.assertEqual(s.screen, "intercept", "Smuggle intercept now goes to intercept screen");
        u.assert(s.encounterContext, "Encounter context should exist");
        u.resetRandomStub();
      }
    },
    {
      name: "E.11 ADVANCE_DAY random event (10% chance)",
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        // wind (2) + event chance (1) + event index (1) = 4 values
        u.setRandomSequence([0.5, 0.5, 0.05, 0.1]);
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
      type: "reducer",
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
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, ship: { type: "sloop", hull: 50, upgrades: ["reinforced_hull"] }, gold: 1000 };
        const s = E.reducer(state, { type: E.A.REPAIR });
        u.assertEqual(s.ship.hull, Math.floor(D.SHIPS.sloop.maxHull * 1.2));
        u.assert(s.gold < 1000);
      }
    },
    {
      name: "E.14 REPAIR insufficient gold",
      type: "reducer",
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
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, gold: 5000, ship: { type: "sloop", hull: 100, cannons: 10, upgrades: ["reinforced_hull"] }, crew: { roster: fillRoster(50), max: 50, morale: 80 } };
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
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, gold: 100, ship: { type: "sloop" } };
        const s = E.reducer(state, { type: E.A.BUY_SHIP, shipType: "galleon" });
        u.assertEqual(s.ship.type, "sloop");
      }
    },
    // BUY_UPGRADE — require log on failure (engine fix needed)
    {
      name: "E.17 BUY_UPGRADE installs upgrade",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, ship: { type: "sloop", upgrades: [] }, gold: 1000 };
        const s = E.reducer(state, { type: E.A.BUY_UPGRADE, upgradeKey: "reinforced_hull" });
        u.assert(s.ship.upgrades.includes("reinforced_hull"));
        u.assertEqual(s.gold, 1000 - D.UPGRADES.reinforced_hull.cost);
      }
    },
    {
      name: "E.18 BUY_UPGRADE already installed",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, ship: { type: "sloop", upgrades: ["reinforced_hull"] }, gold: 1000 };
        const s = E.reducer(state, { type: E.A.BUY_UPGRADE, upgradeKey: "reinforced_hull" });
        u.assertEqual(s.gold, 1000);
      }
    },
    {
      name: "E.19 BUY_UPGRADE incompatible ship",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, ship: { type: "dinghy", upgrades: [] }, gold: 1000 };
        const s = E.reducer(state, { type: E.A.BUY_UPGRADE, upgradeKey: "extra_cannons" });
        u.assertEqual(s.gold, 1000);
      }
    },
    // HIRE_CREW — roster
    {
      name: "E.20 HIRE_CREW adds crew, deducts gold",
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        const mission = { id:"test", name:"Test", gold:500, fame:20, repImpact:{english:10}, targetPort:"tortuga", faction:"english" };
        const state = { ...E.initialState, currentPort:"tortuga", activeMission: mission, gold:1000, fame:0, reputation:{ tortuga:50, portRoyal:50, kingston:50 }, crew: { roster: fillRoster(30), morale: 80 } };
        const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
        u.assertEqual(s.gold, 1500);
        u.assertEqual(s.fame, 20);
        u.assert(s.activeMission === null);
        u.assert(s.reputation.portRoyal === 60, "English rep +10");
      }
    },
    {
      name: "E.24 COMPLETE_MISSION wrong port fails",
      type: "reducer",
      run: (u) => {
        const mission = { targetPort:"tortuga", gold:500 };
        const state = { ...E.initialState, currentPort:"portRoyal", activeMission: mission, gold:1000 };
        const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
        u.assertEqual(s.gold, 1000);
      }
    },
    {
      name: "E.25 ABANDON_MISSION clears mission and applies penalty",
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
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
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
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
        // Screen should still be "battle" (defeat shown on battle screen)
        u.assertEqual(s.screen, "battle", "Defeat stays on battle screen");
        u.resetRandomStub();
      }
    },
    {
      name: "E.29 BATTLE_ACTION flee (evade success)",
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        u.setRandomSequence([0.0]); // evade success
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
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        u.setRandomSequence([0.0]); // grapple success
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
      type: "reducer",
      run: (u) => {
        const mission = testMission({ type: "combat", faction: "english", enemy: { faction: "pirate" } });
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
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, screen:"battle", destination:"tortuga", sailingDaysLeft:2, battleState: { phase:"fled", returnScreen:"sailing" }, crew: { roster: fillRoster(30), morale:80 } };
        const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
        u.assertEqual(s.screen, "sailing");
      }
    },
    {
      name: "E.33 DISMISS_BATTLE after victory no mission returns to port",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, screen:"battle", currentPort:"portRoyal", activeMission: null, battleState: { phase:"victory", returnScreen:"port" }, crew: { roster: fillRoster(30), morale:80 } };
        const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
        u.assertEqual(s.screen, "port");
      }
    },
    // EVENTS — fix crew shape and daysLost sign (engine fix)
    {
      name: "E.34 RESOLVE_EVENT gold gain",
      type: "reducer",
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
      type: "reducer",
      run: (u) => {
        const event = { choices: [{ outcome: { hullDamage:20 } }] };
        const state = { ...E.initialState, activeEvent: event, ship: { type:"sloop", hull:100, upgrades:[] }, crew: { roster: fillRoster(30), morale:80 } };
        const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
        u.assertEqual(s.ship.hull, 80);
      }
    },
    {
      name: "E.36 RESOLVE_EVENT crew loss",
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
      run: (u) => {
        const event = { choices: [{ outcome: { repImpact:{english:10} } }] };
        const state = { ...E.initialState, activeEvent: event, reputation:{ portRoyal:50, kingston:50 }, crew: { roster: fillRoster(30), morale:80 } };
        const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
        u.assertEqual(s.reputation.portRoyal, 60);
      }
    },
    {
      name: "E.39 RESOLVE_EVENT triggers battle",
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        const roster = G.generateRoster(30, "pirate"); // uses real random before stubbing
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
      run: (u) => {
        const state = {
          ...E.initialState,
          destination: "tortuga",
          sailingDaysLeft: 2,
          gold: 500,
          crew: { roster: fillRoster(10), morale: 80, max: 50 },
          encounterContext: { options: { surrender: { consequence: { goldFine: 200, moralePenalty: 10 } } } }
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, gold: 10000, fame: 10 };
        const s = E.reducer(state, { type: E.A.BUY_SHIP, shipType: "frigate" });
        u.assertEqual(s.ship.type, state.ship.type, "Ship type unchanged");
        u.assert(s.log.some(l => l.includes("Requires ★ 100 fame")), "Should log fame requirement");
      }
    },
    {
      name: "E.59 BUY_UPGRADE blocked by fame",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, gold: 5000, fame: 10, ship: { type: "frigate", upgrades: [] } };
        const s = E.reducer(state, { type: E.A.BUY_UPGRADE, upgradeKey: "extra_cannons" });
        u.assert(!s.ship.upgrades.includes("extra_cannons"), "Upgrade not installed");
        u.assertEqual(s.gold, 5000, "Gold unchanged");
      }
    },
    {
      name: "E.60 TAKE_MISSION fame blocking removed (no longer gates)",
      type: "reducer",
      run: (u) => {
        const mission = testMission({ type: "escort", targetPort: "nassau" });
        const state = { ...E.initialState, currentPort: "portRoyal", fame: 0, reputation: { nassau: 50 }, crew: { roster: fillRoster(30), morale: 80 } };
        const s = E.reducer(state, { type: E.A.TAKE_MISSION, mission });
        u.assert(s.activeMission !== null, "Mission accepted regardless of fame");
      }
    },
    {
      name: "E.61 BUY_SHIP with sufficient fame",
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
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
      type: "reducer",
      run: (u) => {
        const state = {
          ...E.initialState,
          gold: 10000,
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
      type: "reducer",
      run: (u) => {
        u.resetRandomStub();
        const state = {
          ...E.initialState,
          screen: "sailing", destination: "tortuga", sailingDaysLeft: 1, sailingDaysTotal: 1,
          crew: { roster: fillRoster(30), max: 50, morale: 80 },
          hold: { capacity: 200, items: { food: 0 } }
        };
        const s = E.reducer(state, { type: E.A.ADVANCE_DAY });
        u.assert(s.log.some(l => l.includes("food stores are empty")));
      }
    },
    {
      name: "E.85 CONFIRM_TRADE not enough stock log",
      type: "reducer",
      run: (u) => {
        const state = {
          ...E.initialState,
          currentPort: "portRoyal",
          screen: "port",
          hold: { capacity: 200, items: {} },
          market: { goods: { rum: { stock: 0, buyFromPort: 10 } } }
        };
        const s = E.reducer(state, { type: E.A.CONFIRM_TRADE, good: "rum", qty: 10 });
        u.assert(s.log.some(l => l.includes("Not enough rum available")));
      }
    },


{
  name: "E.M.1 migrateState adds version to old saves",
  type: "reducer",
  run: (u) => {
    const old = { gold: 500, screen: "port" }; // no version field
    const migrated = E.migrateState(old);
    u.assertEqual(migrated.version, 1);
    u.assertEqual(migrated.gold, 500, "Existing fields preserved");
  }
},
{
  name: "E.M.2 LOAD_GAME migrates versionless save",
  type: "reducer",
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

    // Market price test (G.31)
    {
      name: "G.31 Market price for food",
      type: "reducer",
      run: (u) => {
        const state = {
          ...E.initialState,
          currentPort: "portRoyal",
          market: { goods: { food: { stock: 100, buyFromPort: D.RESOURCES.food.basePrice } } }
        };
        u.assertEqual(state.market.goods.food.buyFromPort, 3);
      }
    },
  ]
});
