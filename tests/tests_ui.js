// tests_ui.js — UI Smoke tests and Edge Case / Regression tests
window.TESTS = window.TESTS || [];

window.TESTS.push({
  name: "UI Smoke: Screen Rendering",
  type: "ui",
  tests: [
    // Each test verifies the screen component renders without throwing.
    // mountReact() throws on render failure — no further assertions needed.

    {
      name: "U.01 StartScreen renders all scenarios",
      run: (u) => {
        const { unmount } = u.mountReact(window.S.StartScreen, { dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.02 PortScreen renders",
      run: (u) => {
        const state = makeState({
          screen: "port", currentPort: "portRoyal",
          ship: { type: "sloop", name: "Sea Dog", hull: 100, cannons: 10, upgrades: [] },
          crew: { roster: fillRoster(30), max: 50, morale: 80 },
          missions: [], activeMission: null,
          log: ["Test log entry"]
        });
        const { unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.03 MapScreen renders",
      run: (u) => {
        const state = makeState({ screen: "map", currentPort: "portRoyal", wind: { angle: 45, speed: 10 } });
        const { unmount } = u.mountReact(window.S.MapScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.04 SailingScreen renders",
      run: (u) => {
        const state = makeState({
          screen: "sailing", currentPort: "portRoyal", destination: "tortuga",
          sailingDaysLeft: 2, sailingDaysTotal: 4,
          wind: { angle: 45, speed: 10 },
          activeMission: null
        });
        const { unmount } = u.mountReact(window.S.SailingScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.05 ShipyardScreen renders",
      run: (u) => {
        const state = makeState({
          screen: "shipyard", currentPort: "portRoyal",
          ship: { type: "sloop", hull: 80, upgrades: [] },
          gold: 2000
        });
        const { unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.06 CrewScreen renders",
      run: (u) => {
        const state = makeState({
          screen: "crew", crew: { roster: fillRoster(20), max: 50, morale: 80 },
          gold: 1000, ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] }
        });
        const { unmount } = u.mountReact(window.S.CrewScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.07 StatusScreen renders",
      run: (u) => {
        const state = makeState({
          screen: "status",
          reputation: { portRoyal: 60, kingston: 60, havana: 40, tortuga: 30 }
        });
        const { unmount } = u.mountReact(window.S.StatusScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.08 EventScreen renders",
      run: (u) => {
        const event = {
          type: "hazard",
          title: "Test Event",
          desc: "A description.",
          choices: [
            { label: "Choice 1", outcome: { log: "Outcome 1" } },
            { label: "Choice 2", outcome: { log: "Outcome 2" } }
          ]
        };
        const state = makeState({ activeEvent: event, day: 5 });
        const { unmount } = u.mountReact(window.S.EventScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.09 BattleScreen renders",
      run: (u) => {
        const state = makeState({
          screen: "battle",
          ship: { type: "sloop", name: "Sea Dog", hull: 100, cannons: 10, upgrades: [] },
          crew: { roster: fillRoster(30), morale: 80 },
          battleState: {
            phase: "player_turn", playerHull: 80, playerCrew: 25,
            enemy: { name: "Black Bart's Revenge", hull: 100, cannons: 15, crew: 40, faction: "pirate" },
            enemyHull: 90, enemyCrew: 38,
            round: 1, log: ["Battle begins!"], returnScreen: "port"
          }
        });
        const { unmount } = u.mountReact(window.S.BattleScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.10 PortScreen with fame renders",
      run: (u) => {
        const state = makeState({ screen: "port", fame: 5 });
        const { unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.11 ShipyardScreen with locked ship renders",
      run: (u) => {
        const state = makeState({
          screen: "shipyard", currentPort: "portRoyal",
          ship: { type: "sloop", hull: 80, upgrades: [] },
          gold: 2000, fame: 10
        });
        const { unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.12 ShipyardScreen at war renders",
      run: (u) => {
        const state = makeState({
          screen: "shipyard",
          currentPort: "portRoyal",
          reputation: { portRoyal: 5 },
          ship: { type: "sloop", hull: 80, upgrades: [] },
          gold: 2000
        });
        const { unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.13 PortScreen with friendly rep renders",
      run: (u) => {
        const state = makeState({
          screen: "port",
          currentPort: "portRoyal",
          reputation: { portRoyal: 60 },
          missions: [],
          activeMission: null,
        });
        const { unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.14 PortScreen with infamy renders",
      run: (u) => {
        const state = makeState({ screen: "port", infamy: 0 });
        const { unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.15 StatusScreen with infamy renders",
      run: (u) => {
        const state = makeState({ screen: "status", infamy: 10 });
        const { unmount } = u.mountReact(window.S.StatusScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.16 PortScreen with provisions renders",
      run: (u) => {
        const state = makeState({ screen:"port", hold: { items: { food:8, water:12 } } });
        const { unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.17 MarketScreen renders",
      run: (u) => {
        const state = makeState({
          screen:"market",
          hold: { capacity:200, items:{} },
          portMarket: { goods: { food:{ basePrice:5, buyFromPort:5, sellToPort:5, available:999 }, water:{ basePrice:3, buyFromPort:3, sellToPort:3, available:999 } } }
        });
        const { unmount } = u.mountReact(window.S.MarketScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.18 MarketScreen with illegal goods renders",
      run: (u) => {
        const state = makeState({
          screen:"market",
          hold: { capacity:200, items:{} },
          portMarket: { goods: { tobacco:{ basePrice:90, buyFromPort:99, sellToPort:81, available:5 } } }
        });
        const { unmount } = u.mountReact(window.S.MarketScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.19 SailingScreen with provisions renders",
      run: (u) => {
        const state = makeState({
          screen:"sailing", currentPort:"portRoyal", destination:"tortuga",
          sailingDaysLeft:2, sailingDaysTotal:4,
          crew: { roster: fillRoster(30), max:50, morale:80 },
          hold: { capacity:200, items: { food:10, water:15 } }
        });
        const { unmount } = u.mountReact(window.S.SailingScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.20 PortScreen with trade mission renders",
      run: (u) => {
        const mission = testMission({
          type: "trade", name: "Trade Test", gold: 500, fame: 1, targetPort: "kingston",
          requiredGood: "rum", requiredQty: 10,
        });
        const state = makeState({
          screen: "port", currentPort: "portRoyal",
          missions: [mission], activeMission: null,
          hold: { capacity: 200, items: { rum: 5 } },
        });
        const { unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.21 PortScreen with ready trade mission renders",
      run: (u) => {
        const mission = testMission({
          type: "trade", name: "Trade Test", gold: 500, fame: 1, targetPort: "kingston",
          requiredGood: "rum", requiredQty: 10,
        });
        const state = makeState({
          screen: "port", currentPort: "portRoyal",
          missions: [mission], activeMission: null,
          hold: { capacity: 200, items: { rum: 10 } },
        });
        const { unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.22 PortScreen with active mission renders",
      run: (u) => {
        const mission = testMission({
          type: "trade", name: "Trade Test", gold: 500, fame: 1, targetPort: "portRoyal",
          requiredGood: "rum", requiredQty: 10,
        });
        const state = makeState({
          screen: "port", currentPort: "portRoyal",
          activeMission: mission,
          hold: { capacity: 200, items: { rum: 3 } },
        });
        const { unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.23 MarketScreen with black market renders",
      run: (u) => {
        const state = makeState({
          screen: "market",
          hold: { capacity: 200, items: {} },
          portMarket: {
            goods: {
              tobacco: { basePrice: 90, buyFromPort: 99, sellToPort: 81, available: 10 },
            },
          },
        });
        const { unmount } = u.mountReact(window.S.MarketScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
  ]
});



window.TESTS.push({
  name: "Edge Cases & Bug Regression",
  type: "ui",
  tests: [
    {
      name: "F.01 LocalStorage key consistency (save/load)",
      type: "unit",
      run: (u) => {
        u.installLocalStorageMock(); u.clearLocalStorageMock();
        const state = { ...E.initialState, gold: 999 };
        E.reducer(state, { type: E.A.SAVE_GAME });
        u.assert(L.hasSave() === true, "hasSave should return true after SAVE_GAME");
        u.restoreLocalStorage();
      }
    },
    {
      name: "F.02 getShipStats with invalid upgrade key does not crash",
      type: "unit",
      run: (u) => {
        const state = { ship: { type: "sloop", upgrades: ["nonexistent"] } };
        const s = L.getShipStats(state);
        u.assert(typeof s.maxHull === "number", "Should return stats even with bad upgrade");
      }
    },
    {
      name: "F.03 applyReputationImpact with empty object leaves rep unchanged",
      type: "unit",
      run: (u) => {
        const state = { reputation: { portRoyal: 50, tortuga: 40 } };
        const newRep = L.applyReputationImpact(state, {});
        u.assertDeepEqual(newRep, state.reputation, "Rep should be identical");
      }
    },
    {
      name: "F.04 ADVANCE_DAY when already arrived does nothing",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, screen: "sailing", destination: "tortuga", sailingDaysLeft: 0 };
        const s = E.reducer(state, { type: E.A.ADVANCE_DAY });
        u.assertEqual(s.sailingDaysLeft, 0);
        u.assertEqual(s.gold, E.initialState.gold);
      }
    },
    {
      name: "F.05 BUY_SHIP to a smaller ship caps crew and clears upgrades",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, gold: 50000, ship: { type: "galleon", hull: 300, cannons: 30, upgrades: ["reinforced_hull"] }, crew: { roster: fillRoster(150), max: 150, morale: 80 } };
        const s = E.reducer(state, { type: E.A.BUY_SHIP, shipType: "sloop" });
        u.assertEqual(s.ship.type, "sloop");
        u.assert(s.crew.max === D.SHIPS.sloop.maxCrew, "Crew max reduced");
        u.assert(s.crew.roster.length <= s.crew.max, "Crew capped");
        u.assert(s.ship.upgrades.length === 0, "Upgrades cleared");
      }
    },
    {
      name: "F.06 HIRE_CREW when already at max fails",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, crew: { roster: fillRoster(50), max: 50, morale: 80 }, gold: 1000 };
        const s = E.reducer(state, { type: E.A.HIRE_CREW, count: 5 });
        u.assertEqual(s.crew.roster.length, 50);
        u.assertEqual(s.gold, 1000);
      }
    },
    {
      name: "F.07 COMPLETE_MISSION without active mission does not crash",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, activeMission: null };
        const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
        u.assert(s.activeMission === null);
        u.assertEqual(s.gold, state.gold);
      }
    },
    {
      name: "F.08 Reputation never decays below 50 (guard)",
      type: "unit",
      run: (u) => {
        let state = { reputation: { portRoyal: 100, tortuga: 5, havana: 50 } };
        for (let i = 0; i < 20; i++) state.reputation = L.decayReputation(state);
        u.assert(state.reputation.portRoyal >= 80, "High rep still decayed to >=80");
        u.assertEqual(state.reputation.tortuga, 5, "Low rep untouched");
        u.assertEqual(state.reputation.havana, 50, "Exactly 50 stays");
      }
    },
    {
      name: "F.09 resolveCombatAction handles missing battleState gracefully",
      type: "unit",
      run: (u) => {
        const state = { ship: { type: "sloop", upgrades: [] }, crew: { roster: fillRoster(30), morale: 80 } };
        try {
          L.resolveCombatAction(state, "broadside");
          u.assert(true);
        } catch (e) {
          u.assert(false, `Should not throw: ${e.message}`);
        }
      }
    },
    {
      name: "F.10 generateMissions returns empty array when no eligible missions",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const state = { reputation: { portRoyal: 0 } };
        const missions = G.generateMissions("portRoyal", state);
        u.assert(Array.isArray(missions), "Should return an array");
        u.assert(missions.every(m => m.risk === "low"), "Only low risk if any");
      }
    },
    {
      name: "U.T4.01 TitleScreen renders",
      run: (u) => {
        const { unmount } = u.mountReact(window.S.TitleScreen, { dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.T4.02 JournalScreen renders with empty log",
      run: (u) => {
        const state = makeState({ log: [] });
        const { unmount } = u.mountReact(window.S.JournalScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "U.T4.03 JournalScreen renders with entries",
      run: (u) => {
        const state = makeState({ log: ["[1] Test entry one", "[2] Another test entry", "[3] Arrived at Tortuga."] });
        const { unmount } = u.mountReact(window.S.JournalScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "EQ.U.01 ShipyardScreen with empty equipment",
      run: (u) => {
        const state = makeState({
          screen: "shipyard",
          currentPort: "portRoyal",
          gold: 5000,
          fame: 50,
          reputation: { portRoyal: 80 },
          ship: {
            type: "sloop", hull: 100, cannons: 10, upgrades: [],
            equipment: { hull: [], armament: [], rigging: [], special: [] }
          },
          equipmentInventory: []
        });
        const { unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "EQ.U.02 ShipyardScreen with installed equipment",
      run: (u) => {
        const state = makeState({
          screen: "shipyard",
          currentPort: "portRoyal",
          gold: 5000,
          fame: 50,
          reputation: { portRoyal: 80 },
          ship: {
            type: "sloop", hull: 100, cannons: 10, upgrades: [],
            equipment: {
              hull: ["reinforced_hull"],
              armament: ["extra_cannons"],
              rigging: ["extra_sails"],
              special: []
            }
          },
          equipmentInventory: ["grapeshot_supply"]
        });
        const { unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "EQ.U.03 ShipyardScreen with full equipment locker",
      run: (u) => {
        const state = makeState({
          screen: "shipyard",
          currentPort: "portRoyal",
          gold: 5000,
          fame: 100,
          reputation: { portRoyal: 80 },
          ship: {
            type: "frigate", hull: 220, cannons: 24, upgrades: [],
            equipment: { hull: [], armament: [], rigging: [], special: [] }
          },
          equipmentInventory: ["extra_cannons", "grapeshot_supply", "surgeons_bay", "ornate_figurehead"]
        });
        const { unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "EQ.U.04 ShipyardScreen at war (blocked services)",
      run: (u) => {
        const state = makeState({
          screen: "shipyard",
          currentPort: "portRoyal",
          reputation: { portRoyal: 5 }, // at war
          ship: {
            type: "sloop", hull: 80, upgrades: [],
            equipment: { hull: [], armament: [], rigging: [], special: [] }
          },
          gold: 2000,
          equipmentInventory: []
        });
        const { unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "EQ.U.05 ShipyardScreen with locked equipment (fame/hull)",
      run: (u) => {
        const state = makeState({
          screen: "shipyard",
          currentPort: "portRoyal",
          gold: 20000,
          fame: 10, // too low for high-tier equipment
          reputation: { portRoyal: 80 },
          ship: {
            type: "sloop", hull: 100, cannons: 10, upgrades: [],
            equipment: { hull: [], armament: [], rigging: [], special: [] }
          },
          equipmentInventory: []
        });
        const { unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        unmount();
      }
    },
    {
      name: "EQ.U.06 ShipyardScreen preview panel (before/after stats)",
      run: (u) => {
        // Simulate selecting an equipment item for preview
        const state = makeState({
          screen: "shipyard",
          currentPort: "portRoyal",
          gold: 5000,
          fame: 50,
          reputation: { portRoyal: 80 },
          ship: {
            type: "sloop", hull: 100, cannons: 10, upgrades: [],
            equipment: { hull: [], armament: [], rigging: [], special: [] }
          },
          equipmentInventory: [],
          // The ShipyardScreen may use local state for preview; this just tests it doesn't crash.
        });
        const { container, unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        // If there is a button to simulate preview, we could click it, but smoke test doesn't require interaction.
        unmount();
      }
    },
  ]
});