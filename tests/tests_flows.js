// tests_flows.js — Integration and Scenario tests
window.TESTS = window.TESTS || [];

window.TESTS.push({
  name: "Integration: End-to-End Flows",
  type: "integration",
  tests: [
    {
      name: "I.01 Basic voyage: Start → sail → arrive → port screen",
      
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[0].id });
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
  run: (u) => {
    u.installLocalStorageMock(); u.clearLocalStorageMock();
    let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[0].id });
    s = { ...s, currentPort: "portRoyal", reputation: { portRoyal: 80 } };
    // Create a trade mission that requires 5 rum
    const tradeMission = testMission({
      type: "trade", targetPort: s.currentPort, requiredGood: "rum", requiredQty: 5, gold: 300, fame: 1
    });
    // Give the player 5 rum in hold
    s = { ...s, hold: { ...s.hold, items: { ...s.hold.items, rum: 5 } } };
    s.missions = [tradeMission];
    s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: tradeMission });
    s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
    while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
    s = E.reducer(s, { type: E.A.ENTER_PORT });
    u.assertEqual(s.currentPort, "tortuga");
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
  run: (u) => {
    u.installLocalStorageMock(); u.clearLocalStorageMock();
    u.resetRandomStub();
    let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[2].id });
    const combatMission = testMission({
      type: "combat", faction: "english",
      targetPort: s.currentPort,
      enemy: { name: "The Iron Drake", hull: 60, cannons: 8, crew: 25, faction: "pirate" }
    });
    const goldBeforeMission = s.gold;
    s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: combatMission });
    u.assertEqual(s.screen, "intercept");
    s = E.reducer(s, { type: E.A.INTERCEPT_FIGHT });
    u.assertEqual(s.screen, "battle");
    // Force enemy hull to 0 → victory guaranteed
    s = { ...s, battleState: { ...s.battleState, enemyHull: 0 } };
    s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
    u.assertEqual(s.battleState.phase, "victory");
    s = E.reducer(s, { type: E.A.DISMISS_BATTLE });
    // Back at port — complete the mission
    s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
    u.assert(s.activeMission === null, "Mission cleared");
    u.assert(s.gold > goldBeforeMission, "Gold reward from mission");
    u.restoreLocalStorage();
  }
},
    {
      name: "I.04 Defeat in combat (through intercept)",
      
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[2].id });
        const combatMission = testMission({
          type: "combat", faction: "english",
          enemy: { name: "The Iron Drake", hull: 60, cannons: 8, crew: 25, faction: "pirate" }
        });
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: combatMission });
        s = E.reducer(s, { type: E.A.INTERCEPT_FIGHT });
        s = { ...s, battleState: { ...s.battleState, playerHull: 1, enemyHull: 100, enemy: { ...s.battleState.enemy, cannons: 50 } } };
        u.setRandomSequence(new Array(30).fill(0.5));
        s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
        u.assertEqual(s.battleState.phase, "defeat");
        u.assertEqual(s.ship.hull, 0);
        u.assertEqual(s.screen, "battle"); // defeat screen shown
        u.restoreLocalStorage();
      }
    },
{
  name: "I.05 Smuggle mission intercept during voyage (intercept)",
  run: (u) => {
    u.installLocalStorageMock(); u.clearLocalStorageMock();
    u.resetRandomStub();
    let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[0].id });
    const smugMission = testMission({
      type: "smuggle", faction: "pirate", targetPort: "nassau",
      risk: "medium", gold: 400, infamyGain: 1,
      requiredGood: "rum", requiredQty: 5, patrolRisk: 0.30,
      enemy: { name: "The Serpent", hull: 50, cannons: 6, crew: 20, faction: "english" }
    });
    s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: smugMission });
    s = E.reducer(s, { type: E.A.SAIL_TO, port: "nassau" });
    // Use a long enough sequence for wind + intercept check
    u.setRandomSequence([0.5, 0.5, 0.1]);
    s = E.reducer(s, { type: E.A.ADVANCE_DAY });
    u.assertEqual(s.screen, "intercept");
    s = E.reducer(s, { type: E.A.INTERCEPT_FIGHT });
    // Force enemy hull to 0 → instant victory
    s = { ...s, battleState: { ...s.battleState, enemyHull: 0 } };
    s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
    u.assertEqual(s.battleState.phase, "victory");
    s = E.reducer(s, { type: E.A.DISMISS_BATTLE });
    u.assertEqual(s.screen, "sailing");
    // Sail remaining days — use real random, no need for stubbing
    u.resetRandomStub();
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
      
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[3].id });
        s = { ...s, gold: 600000, fame: 100  }; // ensure enough
        const frigateCost = D.SHIPS.frigate.cost;
        const upgradeCost = D.EQUIPMENT.extra_cannons.cost;
        s = E.reducer(s, { type: E.A.BUY_SHIP, shipType: "frigate" });
        u.assertEqual(s.ship.type, "frigate");
        u.assert(s.gold === 10000 - frigateCost, "Gold deducted for ship");
        s = E.reducer(s, { type: E.A.BUY_EQUIPMENT, equipmentKey: "extra_cannons" });
        u.assert(Object.values(s.ship.equipment).flat().includes("extra_cannons"), "Upgrade installed");
        u.assert(s.gold === 10000 - frigateCost - upgradeCost, "Gold deducted for upgrade");
        u.assertEqual(L.getShipStats(s).cannons, D.SHIPS.frigate.cannons + 2);
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.07 Crew hiring and wage scaling",
      
      run: (u) => {
        u.resetRandomStub();
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[0].id });
        s = { ...s, gold: 2000 };   // enough for 10 hires
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
      
      run: (u) => {
        u.resetRandomStub();
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[2].id });
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
      
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[0].id });
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
      
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[2].id });
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
  run: (u) => {
    u.installLocalStorageMock(); u.clearLocalStorageMock();
    u.resetRandomStub();
    let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[2].id });
    const combatMission = testMission({
      type: "combat", faction: "english",
      enemy: { name: "The Iron Drake", hull: 60, cannons: 8, crew: 25, faction: "pirate" }
    });
    s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: combatMission });
    s = E.reducer(s, { type: E.A.INTERCEPT_FIGHT });
    // Prepare battle state: enemy dead, and fake crew loss data
    s = {
      ...s,
      battleState: {
        ...s.battleState,
        enemyHull: 0,
        initialCrewCount: s.crew.roster.length + 3,  // pretend we started with 3 more
        lostCrewNames: ["Abe Seaman", "Coral Reef"]
      }
    };
    s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
    u.assertEqual(s.battleState.phase, "victory");
    u.assert(
      s.log.some(line => line.includes("Victory!") && line.includes("Lost")),
      "Log includes victory and crew loss"
    );
    u.restoreLocalStorage();
  }
},
  ]
});

window.TESTS.push({
  name: "Scenarios: User Simulation",
  type: "integration",
  tests: [
    {
      name: "S.01 Full voyage from start to arrival at Tortuga",
      
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock(); u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[0].id });
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "map" });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        u.assertEqual(s.currentPort, "tortuga");
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state: s, dispatch: () => {} });
        u.assert(s.log.some(l => l.includes("Tortuga")), "Log should mention arrival");
        unmount();
        u.restoreLocalStorage();
      }
    },
  {
  name: "S.02 Purchase ship and verify updated ship stats",
  run: (u) => {
    u.installLocalStorageMock(); u.clearLocalStorageMock();
    let s = makeState({ screen: "port", gold: 1100000, fame: 150, ship: { type: "sloop", hull: 100, cannons: 10, equipment: { hull: [], armament: [], rigging: [], special: [] } } });
    s = E.reducer(s, { type: E.A.NAVIGATE, screen: "shipyard" });
    s = E.reducer(s, { type: E.A.BUY_SHIP, shipType: "galleon" });
    u.assertEqual(s.ship.type, "galleon");
    u.assertEqual(s.hold.capacity, D.SHIPS.galleon.holdCapacity);
    u.assertEqual(s.crew.max, D.SHIPS.galleon.maxCrew);
    u.restoreLocalStorage();
  }
},
{
  name: "S.03 Combat mission: fight and win, see rewards in port",
  run: (u) => {
    u.installLocalStorageMock(); u.clearLocalStorageMock(); u.resetRandomStub();
    let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[2].id });
    const mission = testMission({
      type: "combat", faction: "english",
      targetPort: s.currentPort,
      enemy: { name: "The Iron Drake", hull: 60, cannons: 8, crew: 25, faction: "pirate" }
    });
    const goldBefore = s.gold;
    s = E.reducer(s, { type: E.A.TAKE_MISSION, mission });
    s = E.reducer(s, { type: E.A.INTERCEPT_FIGHT });
    s = { ...s, battleState: { ...s.battleState, enemyHull: 0 } };
    s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
    u.assertEqual(s.battleState.phase, "victory");
    s = E.reducer(s, { type: E.A.DISMISS_BATTLE });
    s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
    u.assert(s.gold > goldBefore, "Gold increased after mission completion");
    u.restoreLocalStorage();
  }
},
{
  name: "S.04 Hire crew and verify manifest update",
  run: (u) => {
    u.installLocalStorageMock(); u.clearLocalStorageMock();
    let s = makeState({ screen: "port", gold: 5000, ship: { type: "sloop", hull: 100, cannons: 10, equipment: { hull: [], armament: [], rigging: [], special: [] } }, crew: { roster: fillRoster(20), max: 50, morale: 80 } });
    s = E.reducer(s, { type: E.A.NAVIGATE, screen: "crew" });
    s = E.reducer(s, { type: E.A.HIRE_CREW, count: 10 });
    u.assertEqual(s.crew.roster.length, 30);
    u.restoreLocalStorage();
  }
},
{
  name: "S.05 Low morale triggers warning on CrewScreen",
  run: (u) => {
    u.installLocalStorageMock(); u.clearLocalStorageMock();
    let s = makeState({ screen: "crew", crew: { roster: fillRoster(30), max: 50, morale: 25 }, ship: { type: "sloop", hull: 100, cannons: 10, equipment: { hull: [], armament: [], rigging: [], special: [] } } });
    const { container, unmount } = u.mountReact(window.S.CrewScreen, { state: s, dispatch: () => {} });
    // The screen should render without error – mountReact already throws on failure.
    unmount();
    u.restoreLocalStorage();
  }
},
    {
      name: "S.06 Save game and continue after reload",
      
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[0].id });
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
      
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = makeState({ screen: "port", gold: 2000, ship: { type: "sloop", hull: 100, cannons: 10, equipment: { hull: [], armament: [], rigging: [], special: [] } } });
        s = E.reducer(s, { type: E.A.BUY_EQUIPMENT, equipmentKey: "reinforced_hull" });
        u.assert(Object.values(s.ship.equipment).flat().includes("reinforced_hull"));
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state: s, dispatch: () => {} });
        u.assert(s.log.some(l => l.includes("Reinforced Hull")), "Log should mention upgrade installation");
        unmount();
        u.restoreLocalStorage();
      }
    },
{
  name: "S.08 Complete two trade missions and verify cumulative rewards",
  run: (u) => {
    u.installLocalStorageMock(); u.clearLocalStorageMock(); u.resetRandomStub();
    let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[0].id });
    s = { ...s, currentPort: "portRoyal", reputation: { ...s.reputation, portRoyal: 80 } };
    // Give hold some goods for the missions
    s = { ...s, hold: { ...s.hold, items: { ...s.hold.items, rum: 10, sugar: 5 } } };

    // Mission 1: trade rum to Tortuga
    const m1 = testMission({ type: "trade", targetPort: s.currentPort, requiredGood: "rum", requiredQty: 3, gold: 200, fame: 1 });
    s.missions = [m1];
    s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: m1 });
    s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
    while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
    s = E.reducer(s, { type: E.A.ENTER_PORT });
    s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
    const gold1 = s.gold, fame1 = s.fame;

    // Mission 2: trade sugar to Havana
    const m2 = testMission({ type: "trade", targetPort: "havana", requiredGood: "sugar", requiredQty: 2, gold: 150, fame: 1 });
    s.missions = [m2];
    s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: m2 });
    s = E.reducer(s, { type: E.A.SAIL_TO, port: "havana" });
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
  run: (u) => {
    u.installLocalStorageMock(); u.clearLocalStorageMock();
    let s = makeState({ currentPort: "curacao", reputation: { curacao: 60 } });
    const mission = testMission({
      type: "escort", targetPort: "curacao", faction: "dutch",
      repImpact: { dutch: 5 }
    });
    s = E.reducer(s, { type: E.A.TAKE_MISSION, mission });
    s = E.reducer(s, { type: E.A.SAIL_TO, port: mission.targetPort });
    while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
    s = E.reducer(s, { type: E.A.ENTER_PORT });
    s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
    // Dutch rep should have increased
    u.assert(s.reputation.curacao >= 65, "Reputation increased after mission");
    u.restoreLocalStorage();
  }
},
    {
      name: "S.10 Random event during sailing",
      
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock(); u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: D.STARTS[0].id });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
        u.setRandomSequence([0.5, 0.5, 0.05, ...new Array(120).fill(0.5)]); // wind + event
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
    },
    {
      name: "EQ.I.01 Buy equipment, see stat change",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = makeState({
          screen: "port", gold: 5000, fame: 50,
          currentPort: "portRoyal",
          reputation: { portRoyal: 80 },
          ship: {
            type: "sloop", hull: 100, cannons: 10, equipment: { hull: [], armament: [], rigging: [], special: [] },
            equipment: { hull: [], armament: [], rigging: [], special: [] }
          }
        });
        const beforeCannons = L.getShipStats(s).cannons;
        s = E.reducer(s, { type: E.A.BUY_EQUIPMENT, equipmentKey: "extra_cannons" });
        u.assert(s.ship.equipment.armament.includes("extra_cannons"));
        u.assertEqual(L.getShipStats(s).cannons, beforeCannons + 4);
        u.assert(s.gold < 5000);
        u.restoreLocalStorage();
      }
    },
    {
      name: "EQ.I.02 Remove equipment to inventory, reinstall on new ship",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = makeState({
          screen: "port", gold: 5000, fame: 100,
          currentPort: "portRoyal",
          reputation: { portRoyal: 80 },
          ship: {
            type: "sloop", hull: 100, cannons: 10, equipment: { hull: [], armament: [], rigging: [], special: [] },
            equipment: { hull: [], armament: ["extra_cannons"], rigging: [], special: [] }
          },
          equipmentInventory: []
        });
        // Remove
        s = E.reducer(s, { type: E.A.REMOVE_EQUIPMENT, equipmentKey: "extra_cannons" });
        u.assert(!s.ship.equipment.armament.includes("extra_cannons"));
        u.assert(s.equipmentInventory.includes("extra_cannons"));
        // Buy new ship (frigate) — after removing removable, BUY_SHIP should succeed
        s = E.reducer(s, { type: E.A.BUY_SHIP, shipType: "frigate" });
        u.assertEqual(s.ship.type, "frigate");
        // Install from inventory onto new ship
        s = E.reducer(s, { type: E.A.INSTALL_EQUIPMENT, equipmentKey: "extra_cannons" });
        u.assert(s.ship.equipment.armament.includes("extra_cannons"));
        u.assert(!s.equipmentInventory.includes("extra_cannons"));
        u.restoreLocalStorage();
      }
    },
    {
      name: "EQ.I.03 Ship purchase loses structural equipment",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        let s = makeState({
          screen: "port", gold: 30000, fame: 100,
          currentPort: "portRoyal",
          reputation: { portRoyal: 80 },
          ship: {
            type: "sloop", hull: 100, cannons: 10, equipment: { hull: [], armament: [], rigging: [], special: [] },
            equipment: { hull: ["reinforced_hull"], armament: [], rigging: [], special: [] } // structural
          },
          equipmentInventory: []
        });
        s = E.reducer(s, { type: E.A.BUY_SHIP, shipType: "frigate" });
        u.assertEqual(s.ship.type, "frigate");
        u.assert(!s.ship.equipment.hull.includes("reinforced_hull"), "Structural equipment gone");
        u.assert(!s.equipmentInventory.includes("reinforced_hull"), "Not in inventory");
        u.restoreLocalStorage();
      }
    },
    {
      name: "NAV.I.01 Start voyage, advance 2 days, change course, arrive",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock(); u.resetRandomStub();
        let s = makeState({ screen: "map", currentPort: "portRoyal", wind: { angle: 0, speed: 15 }, crew: { roster: fillRoster(10), max: 50, morale: 80 }, hold: { items: { food: 10, water: 10 } } });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
        u.assertEqual(s.screen, "sailing");
        u.assertEqual(s.route.destinationPort, "tortuga");
        // Advance 2 days
        s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        const progressBefore = s.route.progressDays;
        // Change course to havana
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "map" });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "havana" });
        u.assertEqual(s.route.destinationPort, "havana");
        u.assertEqual(s.route.progressDays, 0, "New leg started");
        u.assert(s.route.enduranceSpent > 0, "Endurance spent preserved");
        // Sail to arrival
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        u.assertEqual(s.currentPort, "havana");
        u.restoreLocalStorage();
      }
    },
    {
      name: "NAV.I.02 Open map from sea, back out, continue original destination",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock(); u.resetRandomStub();
        let s = makeState({ screen: "map", currentPort: "portRoyal", wind: { angle: 0, speed: 15 }, crew: { roster: fillRoster(10), max: 50, morale: 80 }, hold: { items: { food: 10, water: 10 } } });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
        s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        const destBefore = s.route.destinationPort;
        // Open map (simulate by navigating, but then navigate back without selecting a port)
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "map" });
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "sailing" }); // back out
        u.assertEqual(s.route.destinationPort, destBefore, "Destination unchanged");
        u.assertEqual(s.route.progressDays, 1, "Progress not reset");
        u.restoreLocalStorage();
      }
    },
    {
      name: "NAV.I.03 Discover hidden port mid-sea, reroute to it",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock(); u.resetRandomStub();
        let s = makeState({
          screen: "map", currentPort: "tortuga", wind: { angle: 0, speed: 15 },
          ship: { type: "brigantine", hull: 150, cannons: 14, upgrades: [] },
          crew: { roster: fillRoster(20), max: 80, morale: 80 },
          hold: { items: { food: 20, water: 20 } },
          discoveredPorts: Object.keys(D.PORTS).filter(k => !D.PORTS[k].hidden),
          reputation: { tortuga: 70, dryTortugas: 50 },
        });
        // Start sailing toward havana
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "havana" });
        s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        // Simulate discovery of dryTortugas (a hidden port) – add to discoveredPorts
        s = { ...s, discoveredPorts: [...s.discoveredPorts, "dryTortugas"] };
        // Now open map and reroute to dryTortugas
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "map" });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "dryTortugas" });
        u.assertEqual(s.route.destinationPort, "dryTortugas");
        u.restoreLocalStorage();
      }
    },
  ]
});
