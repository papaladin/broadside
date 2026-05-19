// tests_flows.js — Integration and Scenario tests
window.TESTS = window.TESTS || [];

window.TESTS.push({
  name: "Integration: End-to-End Flows",
  tests: [
    {
      name: "I.01 Basic voyage: Start → sail → arrive → port screen",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        u.assertEqual(s.currentPort, "tortuga");
        u.assertEqual(s.screen, "port");
        u.assert(s.missions.length > 0);
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.02 Trade mission: accept, sail, complete, rewards",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        s = { ...s, currentPort: "portRoyal", reputation: { portRoyal: 80 } };
        s.missions = G.generateMissions("portRoyal", s);
        const mission = s.missions.find(m => m.targetPort);
        u.assert(mission, "Need a mission with target port");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: mission.targetPort });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        u.assertEqual(s.currentPort, mission.targetPort);
        const goldBefore = s.gold, fameBefore = s.fame;
        s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
        u.assert(s.activeMission === null);
        u.assert(s.gold > goldBefore);
        u.assert(s.fame > fameBefore);
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.03 Combat mission victory (through intercept)",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
        const combatMission = D.MISSION_POOL.find(m => m.id === "debug_combat");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: combatMission });
        u.assertEqual(s.screen, "intercept");
        s = E.reducer(s, { type: E.A.INTERCEPT_FIGHT }); // enter battle
        u.assertEqual(s.screen, "battle");
        // Force enemy hull to 1
        s = { ...s, battleState: { ...s.battleState, enemyHull: 1 } };
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
        s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
        u.assertEqual(s.battleState.phase, "victory");
        const goldBefore = s.gold;
        s = E.reducer(s, { type: E.A.DISMISS_BATTLE });
        u.assert(s.gold > goldBefore, "Gold reward");
        u.assert(s.activeMission === null, "Mission cleared");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.04 Defeat in combat (through intercept)",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
        const combatMission = D.MISSION_POOL.find(m => m.id === "debug_combat");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: combatMission });
        s = E.reducer(s, { type: E.A.INTERCEPT_FIGHT });
        s = { ...s, battleState: { ...s.battleState, playerHull: 1, enemyHull: 100, enemy: { ...s.battleState.enemy, cannons: 50 } } };
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
        s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
        u.assertEqual(s.battleState.phase, "defeat");
        u.assertEqual(s.ship.hull, 0);
        u.assertEqual(s.screen, "battle"); // defeat screen shown
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.05 Smuggle mission intercept during voyage (intercept)",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "smuggler" });
        const smugMission = D.MISSION_POOL.find(m => m.id === "smuggle_rum");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: smugMission });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "nassau" });
        u.setRandomSequence([0.5, 0.5, 0.1]); // wind + intercept
        s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        u.assertEqual(s.screen, "intercept");
        s = E.reducer(s, { type: E.A.INTERCEPT_FIGHT });
        s = { ...s, battleState: { ...s.battleState, enemyHull: 1 } };
        u.resetRandomStub();
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
        s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
        u.assertEqual(s.battleState.phase, "victory");
        s = E.reducer(s, { type: E.A.DISMISS_BATTLE });
        u.assertEqual(s.screen, "sailing");
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        u.assertEqual(s.currentPort, "nassau");
        s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
        u.assert(s.activeMission === null, "Smuggle mission completed");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.06 Ship purchase and upgrade flow",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "admiral" });
        s = { ...s, gold: 10000 }; // ensure enough
        const frigateCost = D.SHIPS.frigate.cost;
        const upgradeCost = D.UPGRADES.extra_cannons.cost;
        s = E.reducer(s, { type: E.A.BUY_SHIP, shipType: "frigate" });
        u.assertEqual(s.ship.type, "frigate");
        u.assert(s.gold === 10000 - frigateCost, "Gold deducted for ship");
        s = E.reducer(s, { type: E.A.BUY_UPGRADE, upgradeKey: "extra_cannons" });
        u.assert(s.ship.upgrades.includes("extra_cannons"), "Upgrade installed");
        u.assert(s.gold === 10000 - frigateCost - upgradeCost, "Gold deducted for upgrade");
        u.assertEqual(L.getShipStats(s).cannons, D.SHIPS.frigate.cannons + 2);
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.07 Crew hiring and wage scaling",
      type: "integration",
      run: (u) => {
        u.resetRandomStub();
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        const initialLength = s.crew.roster.length;
        s = E.reducer(s, { type: E.A.HIRE_CREW, count: 10 });
        u.assert(s.crew.roster.length === initialLength + 10, "Crew increased");
        s = { ...s, screen: "sailing", destination: "tortuga", sailingDaysLeft: 3, sailingDaysTotal: 3 };
        const goldBefore = s.gold;
        s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        u.assert(s.gold < goldBefore, "Wages deducted");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.08 Hostile port entry triggers intercept",
      type: "integration",
      run: (u) => {
        u.resetRandomStub();
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
        s = { ...s, reputation: { ...s.reputation, portRoyal: 5 } };
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "portRoyal" });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        u.assertEqual(s.screen, "intercept");
        u.assert(s.encounterContext.enemy.name.includes("Guards"));
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.09 Event resolution with outcomes",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        const testEvent = { id:"test", type:"reward", title:"Test", desc:"", choices:[{ label:"Take", outcome:{ gold:200, log:"You take gold." } }] };
        s = { ...s, activeEvent: testEvent };
        const goldBefore = s.gold;
        s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
        u.assertEqual(s.gold, goldBefore + 200);
        u.assert(s.log.some(l => l.includes("You take gold")));
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.10 Save and load cycle",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
        const goldBefore = s.gold, dayBefore = s.day;
        s = E.reducer(s, { type: E.A.SAVE_GAME });
        u.assert(localStorage.getItem("piratesSave"), "Save exists");
        const fresh = E.reducer(E.initialState, { type: E.A.LOAD_GAME });
        u.assertEqual(fresh.gold, goldBefore);
        u.assertEqual(fresh.day, dayBefore);
        u.assertEqual(fresh.screen, "port");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.11 Victory log contains crew loss summary",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
        const combatMission = D.MISSION_POOL.find(m => m.id === "debug_combat");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: combatMission });
        s = E.reducer(s, { type: E.A.INTERCEPT_FIGHT });
        s = { ...s, battleState: { ...s.battleState, enemyHull: 1, enemy: { ...s.battleState.enemy, cannons: 50 }, initialCrewCount: s.crew.roster.length, lostCrewNames: [] } };
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
        s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
        u.assertEqual(s.battleState.phase, "victory");
        u.assert(s.log.some(line => line.includes("Victory!") && line.includes("Lost")), "Log includes victory and crew loss");
        u.restoreLocalStorage();
      }
    },
  ]
});

window.TESTS.push({
  name: "Scenarios: User Simulation",
  tests: [
    {
      name: "S.01 Full voyage from start to arrival at Tortuga",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock(); u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "map" });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        u.assertEqual(s.currentPort, "tortuga");
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes("Tortuga"));
        unmount();
        u.restoreLocalStorage();
      }
    },
    {
      name: "S.02 Purchase ship and verify updated ship stats",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = makeState({ screen: "port", gold: 10000, ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] } });
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "shipyard" });
        s = E.reducer(s, { type: E.A.BUY_SHIP, shipType: "galleon" });
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "port" });
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes("Galleon"));
        u.assert(container.textContent.includes(String(D.SHIPS.galleon.maxHull)));
        unmount();
        u.restoreLocalStorage();
      }
    },
    {
      name: "S.03 Combat mission: fight and win, see rewards in port",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock(); u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
        const mission = D.MISSION_POOL.find(m => m.id === "debug_combat");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission });
        // go through intercept
        s = E.reducer(s, { type: E.A.INTERCEPT_FIGHT });
        s = { ...s, battleState: { ...s.battleState, enemyHull: 1 } };
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
        s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
        u.assertEqual(s.battleState.phase, "victory");
        const goldBefore = s.gold;
        s = E.reducer(s, { type: E.A.DISMISS_BATTLE });
        u.assert(s.gold > goldBefore);
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "port" });
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes("💰") || container.textContent.includes("Gold"));
        unmount();
        u.restoreLocalStorage();
      }
    },
    {
      name: "S.04 Hire crew and verify manifest update",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = makeState({ screen: "port", gold: 5000, ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] }, crew: { roster: fillRoster(20), max: 50, morale: 80 } });
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "crew" });
        s = E.reducer(s, { type: E.A.HIRE_CREW, count: 10 });
        u.assertEqual(s.crew.roster.length, 30);
        const { container, unmount } = u.mountReact(window.S.CrewScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes("⚓") || container.textContent.includes("🗡") || container.textContent.includes("🔧") || container.textContent.includes("🍖"));
        unmount();
        u.restoreLocalStorage();
      }
    },
    {
      name: "S.05 Low morale triggers warning on CrewScreen",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = makeState({ screen: "crew", crew: { roster: fillRoster(30), max: 50, morale: 25 }, ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] } });
        const { container, unmount } = u.mountReact(window.S.CrewScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes("Low morale weakens combat effectiveness"));
        unmount();
        u.restoreLocalStorage();
      }
    },
    {
      name: "S.06 Save game and continue after reload",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        const gold = s.gold, day = s.day;
        s = E.reducer(s, { type: E.A.SAVE_GAME });
        const freshState = E.reducer(E.initialState, { type: E.A.LOAD_GAME });
        u.assertEqual(freshState.gold, gold, "Gold restored");
        u.assertEqual(freshState.day, day, "Day restored");
        u.assertEqual(freshState.screen, "port");
        u.restoreLocalStorage();
      }
    },
    {
      name: "S.07 Install upgrade and verify UI update",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = makeState({ screen: "port", gold: 2000, ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] } });
        s = E.reducer(s, { type: E.A.BUY_UPGRADE, upgradeKey: "reinforced_hull" });
        u.assert(s.ship.upgrades.includes("reinforced_hull"));
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes(D.UPGRADES.reinforced_hull.name));
        unmount();
        u.restoreLocalStorage();
      }
    },
    {
      name: "S.08 Complete two trade missions and verify cumulative rewards",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock(); u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        s = { ...s, currentPort: "portRoyal", reputation: { ...s.reputation, portRoyal: 80 } };
        s.missions = G.generateMissions("portRoyal", s);
        let m1 = s.missions.find(m => m.targetPort);
        u.assert(m1, "First mission available");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: m1 });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: m1.targetPort });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
        const gold1 = s.gold, fame1 = s.fame;
        s.missions = G.generateMissions(s.currentPort, s);
        let m2 = s.missions.find(m => m.targetPort);
        u.assert(m2, "Second mission available");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: m2 });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: m2.targetPort });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
        u.assert(s.gold > gold1, "Gold increased further");
        u.assert(s.fame > fame1, "Fame increased further");
        u.restoreLocalStorage();
      }
    },
    {
      name: "S.09 Faction screen shows updated reputation after mission",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = makeState({ currentPort: "curacao", reputation: { curacao: 60 } });
        const mission = D.MISSION_POOL.find(m => m.id === "escort_merchant");
        u.assert(mission, "Escort mission found");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: mission.targetPort });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
        const { container, unmount } = u.mountReact(window.S.StatusScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes("Allied") || container.textContent.includes("Friendly"));
        unmount();
        u.restoreLocalStorage();
      }
    },
    {
      name: "S.10 Random event during sailing",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock(); u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
        u.setRandomSequence([0.5, 0.5, 0.05, 0.5]); // wind + event
        s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        u.assert(s.activeEvent, "Active event should be set");
        u.assert(s.log.some(l => l.includes("Day")), "Log contains event day");
        const choice = s.activeEvent.choices[0];
        s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 });
        u.assert(s.activeEvent === null, "Event cleared");
        if (choice.outcome.log) {
          u.assert(s.log.some(l => l.includes(choice.outcome.log)), "Log includes outcome");
        }
        u.restoreLocalStorage();
      }
    }
  ]
});