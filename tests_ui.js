// tests_ui.js — UI Smoke tests and Edge Case / Regression tests
window.TESTS = window.TESTS || [];

window.TESTS.push({
  name: "UI Smoke: Screen Rendering",
  tests: [
    {
      name: "U.01 StartScreen renders all scenarios",
      type: "ui",
      run: (u) => {
        const { container, unmount } = u.mountReact(window.S.StartScreen, { dispatch: () => {} });
        D.STARTS.forEach(s => {
          u.assert(container.textContent.includes(s.name), `Should contain '${s.name}'`);
        });
        unmount();
      }
    },
    {
      name: "U.02 PortScreen shows port name, ship, mission board, log",
      type: "ui",
      run: (u) => {
        const state = makeState({
          screen: "port", currentPort: "portRoyal",
          ship: { type: "sloop", name: "Sea Dog", hull: 100, cannons: 10, upgrades: [] },
          crew: { roster: fillRoster(30), max: 50, morale: 80 },
          missions: [], activeMission: null,
          log: ["Test log entry"]
        });
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("Port Royal"));
        u.assert(container.textContent.includes("Sea Dog"));
        u.assert(container.textContent.includes("MISSION BOARD"));
        u.assert(container.textContent.includes("CAPTAIN'S LOG"));
        u.assert(container.textContent.includes("Test log entry"));
        unmount();
      }
    },
    {
      name: "U.03 MapScreen shows ports, back button, wind rose",
      type: "ui",
      run: (u) => {
        const state = makeState({ screen: "map", currentPort: "portRoyal", wind: { angle: 45, speed: 10 } });
        const { container, unmount } = u.mountReact(window.S.MapScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("Back to Port"));
        u.assert(container.textContent.includes("Port Royal"));
        u.assert(container.textContent.includes("KT"));
        unmount();
      }
    },
    {
      name: "U.04 SailingScreen shows origin, destination, progress, controls",
      type: "ui",
      run: (u) => {
        const state = makeState({
          screen: "sailing", currentPort: "portRoyal", destination: "tortuga",
          sailingDaysLeft: 2, sailingDaysTotal: 4,
          wind: { angle: 45, speed: 10 },
          activeMission: null
        });
        const { container, unmount } = u.mountReact(window.S.SailingScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("Port Royal"));
        u.assert(container.textContent.includes("Tortuga"));
        u.assert(container.textContent.includes("Advance Day"));
        u.assert(container.textContent.includes("Enter Port"));
        unmount();
      }
    },
    {
      name: "U.05 ShipyardScreen shows repair, ship list, upgrades",
      type: "ui",
      run: (u) => {
        const state = makeState({
          screen: "shipyard", currentPort: "portRoyal",
          ship: { type: "sloop", hull: 80, upgrades: [] },
          gold: 2000
        });
        const { container, unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("REPAIR VESSEL"));
        u.assert(container.textContent.includes("SHIPS FOR SALE"));
        u.assert(container.textContent.includes("Sloop"));
        u.assert(container.textContent.includes("Brigantine"));
        unmount();
      }
    },
    {
      name: "U.06 CrewScreen shows hire buttons and manifest",
      type: "ui",
      run: (u) => {
        const state = makeState({
          screen: "crew", crew: { roster: fillRoster(20), max: 50, morale: 80 },
          gold: 1000, ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] }
        });
        const { container, unmount } = u.mountReact(window.S.CrewScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("ROSTER"));
        u.assert(container.textContent.includes("HIRE"));
        u.assert(container.textContent.includes("MANIFEST"));
        u.assert(container.textContent.includes("+1"));
        unmount();
      }
    },
    {
      name: "U.07 StatusScreen shows factions with reputation bars",
      type: "ui",
      run: (u) => {
        const state = makeState({
          screen: "status",
          reputation: { portRoyal: 60, kingston: 60, havana: 40, tortuga: 30 }
        });
        const { container, unmount } = u.mountReact(window.S.StatusScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("English"));
        u.assert(container.textContent.includes("Pirate"));
        u.assert(container.textContent.includes("Allied") || container.textContent.includes("Friendly"));
        unmount();
      }
    },
    {
      name: "U.08 EventScreen shows title, description, choices",
      type: "ui",
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
        const { container, unmount } = u.mountReact(window.S.EventScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("Test Event"));
        u.assert(container.textContent.includes("A description."));
        u.assert(container.textContent.includes("Choice 1"));
        u.assert(container.textContent.includes("Choice 2"));
        unmount();
      }
    },
    {
      name: "U.09 BattleScreen shows enemy, hull bars, actions",
      type: "ui",
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
        const { container, unmount } = u.mountReact(window.S.BattleScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("NAVAL BATTLE"));
        u.assert(container.textContent.includes("Sea Dog"));
        u.assert(container.textContent.includes("Black Bart's Revenge"));
        u.assert(container.textContent.includes("Broadside"));
        u.assert(container.textContent.includes("Precision"));
        unmount();
      }
    },
    {
      name: "U.10 HUD shows fame star on port screen",
      type: "ui",
      run: (u) => {
        const state = makeState({ screen: "port", fame: 5 });
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("★"), "Fame star should be visible");
        unmount();
      }
    },
    {
      name: "U.11 ShipyardScreen shows locked ship with reason",
      type: "ui",
      run: (u) => {
        const state = makeState({
          screen: "shipyard", currentPort: "portRoyal",
          ship: { type: "sloop", hull: 80, upgrades: [] },
          gold: 2000, fame: 10
        });
        const { container, unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        // Frigate requires 50 fame → should show lock
        u.assert(container.textContent.includes("🔒"), "Lock icon should appear");
        u.assert(container.textContent.includes("Requires ★ 50 fame"), "Reason should be shown");
        unmount();
      }
    },
    {
      name: "U.12 ShipyardScreen shows hostile notice when At War",
      type: "ui",
      run: (u) => {
        const state = makeState({
          screen: "shipyard",
          currentPort: "portRoyal",
          reputation: { portRoyal: 5 },
          ship: { type: "sloop", hull: 80, upgrades: [] },
          gold: 2000
        });
        const { container, unmount } = u.mountReact(window.S.ShipyardScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("at war with this port"), "Hostile notice should appear");
        unmount();
      }
    },
    {
      name: "U.13 PortScreen shows bonus notice when Friendly",
      type: "ui",
      run: (u) => {
        const state = makeState({
          screen: "port",
          currentPort: "portRoyal",
          reputation: { portRoyal: 60 },
          missions: [],
          activeMission: null,
        });
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("friendly standing"), "Bonus notice should appear");
        unmount();
      }
    },
    {
      name: "U.14 HUD shows infamy ☠ 0 in faint colour",
      type: "ui",
      run: (u) => {
        const state = makeState({ screen: "port", infamy: 0 });
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("☠"), "Infamy symbol visible");
        unmount();
      }
    },
    {
      name: "U.15 StatusScreen shows infamy label and consequence at level 10",
      type: "ui",
      run: (u) => {
        const state = makeState({ screen: "status", infamy: 10 });
        const { container, unmount } = u.mountReact(window.S.StatusScreen, { state, dispatch: () => {} });
        u.assert(container.textContent.includes("Suspect"), "Label appears");
        u.assert(container.textContent.includes("patrols are watching"), "Consequence text appears");
        unmount();
      }
    },
  ]
});

window.TESTS.push({
  name: "Edge Cases & Bug Regression",
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
        const state = { ...E.initialState, gold: 5000, ship: { type: "galleon", hull: 300, cannons: 30, upgrades: ["reinforced_hull"] }, crew: { roster: fillRoster(150), max: 150, morale: 80 } };
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
  name: "F.10 Pirate port never generates patrol missions",
  type: "unit",
  run: (u) => {
    u.resetRandomStub();
    const state = { fame: 0, infamy: 0, reputation: { tortuga: 50 } };
    const missions = G.generateMissions("tortuga", state);
    u.assert(Array.isArray(missions), "Should return an array");
    u.assert(!missions.some(m => m.type === "patrol"), "Pirate port should not offer patrol missions");
  }
},
  ]
});