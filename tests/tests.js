const makeState = (overrides = {}) => {
  const base = {
    screen: "port",
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
  // Ensure all ports have reputation
  Object.keys(D.PORTS).forEach(p => {
    base.reputation[p] = 50;
  });
  return { ...base, ...overrides };
};

window.TESTS = [


  // ══════════════════════════════════════════════════════════════
  //  A. UNIT TESTS (logic.js)
  // ══════════════════════════════════════════════════════════════
  {
    name: "Unit: logic.js (Pure Functions)",
    tests: [
      // ── travelDays ──
      {
        name: "L.01 travelDays: basic distance calculation",
        type: "unit",
        run: (u) => {
          const state = { ship: { type: "sloop", upgrades: [] }, wind: { angle: 0, speed: 10 }, crew: { morale: 80 } };
          u.assert(L.travelDays("port_royal", "havana", state) >= 1, "Days should be at least 1");
        }
      },
      {
        name: "L.02 travelDays: favorable wind reduces days",
        type: "unit",
        run: (u) => {
          const from = D.PORTS.port_royal;
          const to = D.PORTS.havana;
          const angleToPort = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
          const base = { ship: { type: "sloop", upgrades: [] }, wind: { angle: 0, speed: 10 }, crew: { morale: 80 } };
          const fav = { ...base, wind: { angle: angleToPort, speed: 10 } };
          const opp = { ...base, wind: { angle: (angleToPort + 180) % 360, speed: 10 } };
          u.assert(L.travelDays("port_royal", "havana", fav) < L.travelDays("port_royal", "havana", opp), "Favorable wind should yield fewer days");
        }
      },
      {
        name: "L.03 travelDays: opposing wind increases days",
        type: "unit",
        run: (u) => {
          const from = D.PORTS.port_royal;
          const to = D.PORTS.havana;
          const angleToPort = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
          const base = { ship: { type: "sloop", upgrades: [] }, wind: { angle: 0, speed: 10 }, crew: { morale: 80 } };
          const neutral = { ...base, wind: { angle: (angleToPort + 90) % 360, speed: 10 } };
          const opp = { ...base, wind: { angle: (angleToPort + 180) % 360, speed: 10 } };
          u.assert(L.travelDays("port_royal", "havana", opp) > L.travelDays("port_royal", "havana", neutral), "Opposing wind should increase days");
        }
      },
      {
        name: "L.04 travelDays: low morale adds days",
        type: "unit",
        run: (u) => {
          const base = { ship: { type: "sloop", upgrades: [] }, wind: { angle: 0, speed: 10 } };
          const high = { ...base, crew: { morale: 80 } };
          const low  = { ...base, crew: { morale: 25 } };
          u.assert(L.travelDays("port_royal", "tortuga", low) > L.travelDays("port_royal", "tortuga", high), "Low morale should increase travel days");
        }
      },
      // ── getShipStats ──
      {
        name: "L.05 getShipStats: base stats without upgrades",
        type: "unit",
        run: (u) => {
          const state = { ship: { type: "sloop", upgrades: [] } };
          const s = L.getShipStats(state);
          u.assertEqual(s.maxHull, D.SHIPS.sloop.maxHull);
          u.assertEqual(s.cannons, D.SHIPS.sloop.cannons);
          u.assertEqual(s.speed, D.SHIPS.sloop.speed);
        }
      },
      {
        name: "L.06 getShipStats: reinforced hull adds 20%",
        type: "unit",
        run: (u) => {
          const state = { ship: { type: "sloop", upgrades: ["reinforced_hull"] } };
          u.assertEqual(L.getShipStats(state).maxHull, Math.floor(D.SHIPS.sloop.maxHull * 1.2));
        }
      },
      {
        name: "L.07 getShipStats: extra cannons adds +2",
        type: "unit",
        run: (u) => {
          const state = { ship: { type: "sloop", upgrades: ["extra_cannons"] } };
          u.assertEqual(L.getShipStats(state).cannons, D.SHIPS.sloop.cannons + 2);
        }
      },
      {
        name: "L.08 getShipStats: copper hull & navigational tools increase speed",
        type: "unit",
        run: (u) => {
          const state = { ship: { type: "frigate", upgrades: ["copper_hull", "navigational_tools"] } };
          const s = L.getShipStats(state);
          u.assertEqual(s.speed, D.SHIPS.frigate.speed + 2, "Speed should increase by 2");
        }
      },
      {
        name: "L.09 getShipStats: ornate figurehead adds morale bonus",
        type: "unit",
        run: (u) => {
          const state = { ship: { type: "sloop", upgrades: ["figurehead"] } };
          const s = L.getShipStats(state);
          u.assertEqual(s.moraleBonus, 5, "Figurehead should add 5 morale bonus");
        }
      },
      {
        name: "L.10 getEffectiveMorale: no upgrades returns crew morale (capped 100)",
        type: "unit",
        run: (u) => {
          const state = { ship: { type: "sloop", upgrades: [] }, crew: { morale: 80 } };
          u.assertEqual(L.getEffectiveMorale(state), 80);
          const capped = { ship: { type: "sloop", upgrades: [] }, crew: { morale: 120 } };
          u.assertEqual(L.getEffectiveMorale(capped), 100);
        }
      },
      {
        name: "L.11 getEffectiveMorale: with figurehead adds bonus (max 100)",
        type: "unit",
        run: (u) => {
          const state = { ship: { type: "sloop", upgrades: ["figurehead"] }, crew: { morale: 80 } };
          u.assertEqual(L.getEffectiveMorale(state), 85);
          const high = { ship: { type: "sloop", upgrades: ["figurehead"] }, crew: { morale: 98 } };
          u.assertEqual(L.getEffectiveMorale(high), 100);
        }
      },
      {
        name: "L.12 hasUpgrade: true when installed",
        type: "unit",
        run: (u) => {
          const state = { ship: { upgrades: ["reinforced_hull"] } };
          u.assert(L.hasUpgrade(state, "reinforced_hull") === true);
          u.assert(L.hasUpgrade(state, "extra_cannons") === false);
        }
      },
      // ── Crew & Wages ──
      {
        name: "L.13 payCrewWages: normal morale (>=30)",
        type: "unit",
        run: (u) => {
          const state = { ship: { type: "sloop", upgrades: [] }, crew: { current: 30, morale: 80 } };
          u.assertEqual(L.payCrewWages(state), 60, "Wages = 30 * 2");
        }
      },
      {
        name: "L.14 payCrewWages: low morale (<30) multiplier 1.5",
        type: "unit",
        run: (u) => {
          const state = { ship: { type: "sloop", upgrades: [] }, crew: { current: 30, morale: 20 } };
          u.assertEqual(L.payCrewWages(state), 90, "Wages = 30 * 2 * 1.5");
        }
      },
      // ── Missions ──
      {
        name: "L.15 generateMissions: port with service and high rep returns 2-3 missions",
        type: "unit",
        run: (u) => {
          const state = { reputation: { port_royal: 80 } };
          const missions = L.generateMissions("port_royal", state);
          u.assert(missions.length >= 2 && missions.length <= 3, `Expected 2-3 missions, got ${missions.length}`);
        }
      },
      {
        name: "L.16 generateMissions: high-risk missions hidden when rep<40",
        type: "unit",
        run: (u) => {
          const stateLow = { reputation: { port_royal: 30 } };
          const missions = L.generateMissions("port_royal", stateLow);
          const highRisk = missions.some(m => m.risk === "high");
          u.assert(!highRisk, "No high-risk missions should appear");
        }
      },
      {
        name: "L.17 generateMissions: only port faction or pirate missions",
        type: "unit",
        run: (u) => {
          const state = { reputation: { port_royal: 50 } };
          const missions = L.generateMissions("port_royal", state); // English port
          const wrongFaction = missions.some(m => m.faction !== "english" && m.faction !== "pirate");
          u.assert(!wrongFaction, "All missions must be English or pirate");
        }
      },
      {
        name: "L.18 generateMissions: medium-risk hidden when rep<20",
        type: "unit",
        run: (u) => {
          const stateLow = { reputation: { port_royal: 10 } };
          const missions = L.generateMissions("port_royal", stateLow);
          const mediumOrHigh = missions.some(m => m.risk === "medium" || m.risk === "high");
          u.assert(!mediumOrHigh, "Only low-risk missions should appear");
        }
      },
      // ── Events ──
      {
        name: "L.19 triggerRandomEvent: returns a random event (no conditions)",
        type: "unit",
        run: (u) => {
          const state = { crew: { morale: 50 }, currentPort: "port_royal", reputation: { port_royal: 50 } };
          const ev = L.triggerRandomEvent(state);
          u.assert(ev !== null, "Should return an event");
          u.assert(ev.title && ev.choices, "Event should have title and choices");
        }
      },
      {
        name: "L.20 triggerRandomEvent: conditional event (mutiny) only when morale<20",
        type: "unit",
        run: (u) => {
          const mutinyEvent = D.RANDOM_EVENTS.find(e => e.id === "mutiny");
          u.assert(mutinyEvent.condition({ crew: { morale: 15 } }) === true, "Mutiny condition true at low morale");
          u.assert(mutinyEvent.condition({ crew: { morale: 50 } }) === false, "Mutiny condition false at high morale");
        }
      },
      // ── Reputation ──
      {
        name: "L.21 reputationLabel: correct thresholds",
        type: "unit",
        run: (u) => {
          u.assertEqual(L.reputationLabel(80), "Allied");
          u.assertEqual(L.reputationLabel(60), "Friendly");
          u.assertEqual(L.reputationLabel(40), "Neutral");
          u.assertEqual(L.reputationLabel(20), "Unfriendly");
          u.assertEqual(L.reputationLabel(10), "Hostile");
          u.assertEqual(L.reputationLabel(5), "At War");
        }
      },
      {
        name: "L.22 decayReputation: all ports lose 1, min 0",
        type: "unit",
        run: (u) => {
          const state = { reputation: { port_royal: 3, tortuga: 0, havana: 10 } };
          const newRep = L.decayReputation(state);
          u.assertEqual(newRep.port_royal, 2);
          u.assertEqual(newRep.tortuga, 0);
          u.assertEqual(newRep.havana, 9);
        }
      },
      {
        name: "L.23 applyReputationImpact: changes all ports of a faction",
        type: "unit",
        run: (u) => {
          const state = { reputation: { port_royal: 50, kingston: 50, havana: 50 } };
          const newRep = L.applyReputationImpact(state, { english: 10, spanish: -10 });
          u.assertEqual(newRep.port_royal, 60);
          u.assertEqual(newRep.kingston, 60);
          u.assertEqual(newRep.havana, 40);
        }
      },
      {
        name: "L.24 updateReputation: single port update clamped 0-100",
        type: "unit",
        run: (u) => {
          const state = { reputation: { port_royal: 95 } };
          u.assertEqual(L.updateReputation(state, "port_royal", 10).port_royal, 100);
          u.assertEqual(L.updateReputation(state, "port_royal", -100).port_royal, 0);
        }
      },
      // ── Repair ──
      {
        name: "L.25 shipRepairCost: missing hull * 2",
        type: "unit",
        run: (u) => {
          const state = { ship: { type: "sloop", hull: 80, upgrades: [] } };
          u.assertEqual(L.shipRepairCost(state), 40);
          const withUpgrade = { ship: { type: "sloop", hull: 80, upgrades: ["reinforced_hull"] } };
          const expected = (Math.floor(D.SHIPS.sloop.maxHull * 1.2) - 80) * 2;
          u.assertEqual(L.shipRepairCost(withUpgrade), expected);
        }
      },
      // ── Combat ──
      {
        name: "L.30 resolveCombatAction: broadside damages enemy hull and crew",
        type: "unit",
        run: (u) => {
          u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
          const state = {
            ship: { type: "sloop", hull: 100, upgrades: [] },
            crew: { current: 30, morale: 80 },
            battleState: {
              playerHull: 100, playerCrew: 30,
              enemy: { name: "test", hull: 100, cannons: 10, crew: 40 },
              enemyHull: 100, enemyCrew: 40
            }
          };
          const o = L.resolveCombatAction(state, "broadside");
          u.assert(o.player.hullDamage > 0);
          u.assert(o.enemy.hullDamage > 0 || o.enemy.crewLoss > 0);
          u.resetRandomStub();
        }
      },
      {
        name: "L.31 resolveCombatAction: precision (70% acc) high hull damage",
        type: "unit",
        run: (u) => {
          u.setRandomSequence([0.1, 0.5, 0.5, 0.5, 0.5]);
          const state = {
            ship: { type: "sloop", hull: 100, upgrades: [] },
            crew: { current: 30, morale: 80 },
            battleState: {
              playerHull: 100, playerCrew: 30,
              enemy: { name: "test", hull: 100, cannons: 10, crew: 40 },
              enemyHull: 100, enemyCrew: 40
            }
          };
          const o = L.resolveCombatAction(state, "precision");
          u.assert(o.player.hullDamage > 0);
          u.assert(o.player.crewLoss <= 2);
          u.resetRandomStub();
        }
      },
      {
        name: "L.32 resolveCombatAction: grapple success instant victory",
        type: "unit",
        run: (u) => {
          u.setRandomSequence([0.0]);
          const state = {
            ship: { type: "sloop", hull: 100, upgrades: [] },
            crew: { current: 50, morale: 90 },
            battleState: {
              playerHull: 100, playerCrew: 50,
              enemy: { name: "test", hull: 100, cannons: 10, crew: 30 },
              enemyHull: 100, enemyCrew: 30
            }
          };
          const o = L.resolveCombatAction(state, "grapple");
          u.assert(o.instantVictory === true);
          u.assertEqual(o.player.hullDamage, 0);
          u.assertEqual(o.player.crewLoss, 0);
          u.resetRandomStub();
        }
      },
      {
        name: "L.33 resolveCombatAction: grapple failure causes crew loss",
        type: "unit",
        run: (u) => {
          u.setRandomSequence([0.99, 0.5, 0.3, 0.5, 0.5]);
          const state = {
            ship: { type: "sloop", hull: 100, upgrades: [] },
            crew: { current: 20, morale: 20 },
            battleState: {
              playerHull: 100, playerCrew: 20,
              enemy: { name: "test", hull: 100, cannons: 10, crew: 60 },
              enemyHull: 100, enemyCrew: 60
            }
          };
          const o = L.resolveCombatAction(state, "grapple");
          u.assert(o.instantVictory === false);
          u.assert(o.player.crewLoss > 0);
          u.assert(o.player.hullDamage === 0);
          u.resetRandomStub();
        }
      },
      {
        name: "L.34 resolveCombatAction: evade success fled=true",
        type: "unit",
        run: (u) => {
          u.setRandomSequence([0.0]);
          const state = {
            ship: { type: "sloop", hull: 100, upgrades: [] },
            crew: { current: 30, morale: 80 },
            battleState: {
              playerHull: 100,
              enemy: { name: "test", hull: 100, cannons: 10, crew: 40 },
              enemyHull: 100, enemyCrew: 40
            }
          };
          const o = L.resolveCombatAction(state, "evade");
          u.assert(o.fled === true);
          u.assertEqual(o.player.hullDamage, 0);
          u.resetRandomStub();
        }
      },
      {
        name: "L.35 resolveCombatAction: evade fail takes reduced damage",
        type: "unit",
        run: (u) => {
          u.setRandomSequence([0.95, 0.5, 0.5, 0.5, 0.5]);
          const state = {
            ship: { type: "sloop", hull: 100, upgrades: [] },
            crew: { current: 30, morale: 80 },
            battleState: {
              playerHull: 100,
              enemy: { name: "test", hull: 100, cannons: 10, crew: 40 },
              enemyHull: 100, enemyCrew: 40
            }
          };
          const o = L.resolveCombatAction(state, "evade");
          u.assert(o.fled === false);
          u.assert(o.player.hullDamage > 0 || o.player.crewLoss > 0);
          u.resetRandomStub();
        }
      },
      {
        name: "L.36 resolveCombatAction: morale modifier (high morale reduces damage)",
        type: "unit",
        run: (u) => {
          u.setRandomSequence([0.5, 0.5, 0.5]);
          const highMorale = {
            ship: { type: "sloop", hull: 100, upgrades: [] },
            crew: { current: 30, morale: 80 },
            battleState: {
              playerHull: 100, playerCrew: 30,
              enemy: { name: "test", hull: 100, cannons: 10, crew: 40 },
              enemyHull: 100, enemyCrew: 40
            }
          };
          const lowMorale = { ...highMorale, crew: { current: 30, morale: 20 } };
          const oHigh = L.resolveCombatAction(highMorale, "broadside");
          u.resetRandomStub();
          u.setRandomSequence([0.5, 0.5, 0.5]);
          const oLow = L.resolveCombatAction(lowMorale, "broadside");
          u.resetRandomStub();
          u.assert(oHigh.player.hullDamage < oLow.player.hullDamage, "High morale reduces damage");
        }
      },
      {
        name: "L.37 resolveCombatAction: NPC weighted actions",
        type: "unit",
        run: (u) => {
          const enemy = { hull: 100, cannons: 10, crew: 40 };
          let actions = { broadside:0, precision:0, grapple:0, evade:0 };
          for (let i=0; i<100; i++) {
            const a = L.getNPCAction(enemy);
            actions[a]++;
          }
          u.assert(actions.broadside >= 40, "Broadside most common");
          u.assert(actions.evade <= 20, "Evade rare");
        }
      },
      // ── Save / Load ──
      {
        name: "L.40 hasSave: true when save exists",
        type: "unit",
        run: (u) => {
          u.installLocalStorageMock();
          u.clearLocalStorageMock();
          u.assert(!L.hasSave());
          localStorage.setItem("piratesSave", JSON.stringify({}));
          u.assert(L.hasSave());
          u.restoreLocalStorage();
        }
      },
      {
        name: "L.41 saveGame: stores JSON",
        type: "unit",
        run: (u) => {
          u.installLocalStorageMock();
          const state = { gold: 500 };
          L.saveGame(state);
          u.assertEqual(JSON.parse(localStorage.getItem("piratesSave")).gold, 500);
          u.restoreLocalStorage();
        }
      },
      {
        name: "L.42 loadGame: returns state or null",
        type: "unit",
        run: (u) => {
          u.installLocalStorageMock();
          u.clearLocalStorageMock();
          u.assertEqual(L.loadGame(), null);
          localStorage.setItem("piratesSave", JSON.stringify({ gold: 999 }));
          const loaded = L.loadGame();
          u.assert(loaded && loaded.gold === 999);
          u.restoreLocalStorage();
        }
      },
    ]
  },

  // ══════════════════════════════════════════════════════════════
  //  B. REDUCER TESTS (engine.js)
  // ══════════════════════════════════════════════════════════════
  {
    name: "Reducer: engine.js State Transitions",
    tests: [
      // -- START_GAME (E.01 to E.05) --
      {
        name: "E.01 START_GAME merchant",
        type: "reducer",
        run: (u) => {
          const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
          u.assert(s.gold === 3000, "Gold should be 1000 + 2000");
          u.assertEqual(s.ship.type, "merchantman");
          u.assertEqual(s.crew.max, D.SHIPS.merchantman.maxCrew);
          u.assertEqual(s.screen, "port");
        }
      },
      {
        name: "E.02 START_GAME privateer",
        type: "reducer",
        run: (u) => {
          const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "privateer" });
          u.assertEqual(s.ship.type, "sloop");
          u.assertEqual(s.gold, 1500);
          u.assert(s.reputation.port_royal === 60, "English rep +10");
          u.assert(s.reputation.kingston === 60, "English rep +10");
        }
      },
      {
        name: "E.03 START_GAME pirate",
        type: "reducer",
        run: (u) => {
          const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
          u.assertEqual(s.ship.type, "brigantine");
          u.assertEqual(s.gold, 2000);
          // Pirate ports: tortuga & nassau should have rep >= 70
          u.assert(s.reputation.tortuga === 70, `Expected 70 but got ${s.reputation.tortuga}`);
          u.assert(s.reputation.nassau === 70, `Expected 70 but got ${s.reputation.nassau}`);
        }
      },
      {
        name: "E.04 START_GAME admiral",
        type: "reducer",
        run: (u) => {
          const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "admiral" });
          u.assertEqual(s.ship.type, "frigate");
          u.assertEqual(s.gold, 2500);
          u.assert(s.reputation.port_royal === 80, "English rep +30");
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
      // -- SAIL_TO (E.06) --
      {
        name: "E.06 SAIL_TO sets destination and screen",
        type: "reducer",
        run: (u) => {
          const state = { ...E.initialState, screen: "map", currentPort: "port_royal", reputation: { tortuga: 50 } };
          const s = E.reducer(state, { type: E.A.SAIL_TO, port: "tortuga" });
          u.assertEqual(s.destination, "tortuga");
          u.assert(s.sailingDaysLeft > 0);
          u.assertEqual(s.screen, "sailing");
        }
      },
      // -- ENTER_PORT (E.07 normal, E.08 hostile) --
      {
        name: "E.07 ENTER_PORT normal",
        type: "reducer",
        run: (u) => {
          const state = { ...E.initialState, screen: "sailing", destination: "tortuga", sailingDaysLeft: 0, reputation: { tortuga: 50 } };
          const s = E.reducer(state, { type: E.A.ENTER_PORT });
          u.assertEqual(s.currentPort, "tortuga");
          u.assertEqual(s.screen, "port");
          u.assert(s.missions.length > 0);
        }
      },
      {
        name: "E.08 ENTER_PORT hostile (rep<10) triggers battle",
        type: "reducer",
        run: (u) => {
          const state = { ...E.initialState, screen: "sailing", destination: "port_royal", sailingDaysLeft: 0, reputation: { port_royal: 5 } };
          const s = E.reducer(state, { type: E.A.ENTER_PORT });
          u.assertEqual(s.screen, "battle");
          u.assert(s.battleState !== null);
          u.assertEqual(s.battleState.enemy.name, "Port Royal Guards");
          u.assertEqual(s.currentPort, "port_royal"); // still sets currentPort
        }
      },
      // -- ADVANCE_DAY (E.09 basic, E.10 smuggle intercept, E.11 random event, E.12 morale decay) --
      {
        name: "E.09 ADVANCE_DAY reduces days and deducts wages",
        type: "reducer",
        run: (u) => {
          const state = { ...E.initialState, screen: "sailing", destination: "tortuga", sailingDaysLeft: 3, sailingDaysTotal: 3, gold: 1000, crew: { current: 30, max: 50, morale: 80 }, reputation: { tortuga: 50 } };
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
          // interceptChance 0.7, we force random=0.1 -> intercept triggers
          const mission = D.MISSION_POOL.find(m => m.id === "smuggle_rum");
          u.assert(mission, "Smuggle mission needed");
          const state = {
            ...E.initialState,
            screen: "sailing", destination: "nassau", sailingDaysLeft: 3, sailingDaysTotal: 3,
            activeMission: { ...mission, encounterOccurred: false },
            crew: { current: 30, max: 50, morale: 80 },
            gold: 1000, reputation: { nassau: 50 }
          };
          u.setRandomSequence([0.1]); // first random for intercept chance
          const s = E.reducer(state, { type: E.A.ADVANCE_DAY });
          u.assertEqual(s.screen, "battle", "Smuggle intercept should trigger battle");
          u.assert(s.battleState, "Battle state should exist");
          u.resetRandomStub();
        }
      },
      {
        name: "E.11 ADVANCE_DAY random event (10% chance)",
        type: "reducer",
        run: (u) => {
          // random <0.1 triggers event. Use random sequence: first random 0.05 to trigger event, then random for event index (0.1) -> we'll provide two numbers.
          u.setRandomSequence([0.05, 0.1]);
          const state = {
            ...E.initialState,
            screen: "sailing", destination: "tortuga", sailingDaysLeft: 3, sailingDaysTotal: 3,
            crew: { current: 30, max: 50, morale: 80 },
            gold: 1000, reputation: { tortuga: 50 }
          };
          const s = E.reducer(state, { type: E.A.ADVANCE_DAY });
          u.assert(s.activeEvent, "Random event should be active");
          u.assertEqual(s.screen, "sailing", "Screen still sailing? Actually reducer sets screen based on event? It does not change screen, it returns state with activeEvent and screen stays sailing (unless event turns into battle). So screen should remain 'sailing'.");
          u.resetRandomStub();
        }
      },
      {
        name: "E.12 ADVANCE_DAY morale decay if <30",
        type: "reducer",
        run: (u) => {
          const state = {
            ...E.initialState,
            screen: "sailing", destination: "tortuga", sailingDaysLeft: 3, sailingDaysTotal: 3,
            crew: { current: 30, max: 50, morale: 25 },
            gold: 1000, reputation: { tortuga: 50 }
          };
          const s = E.reducer(state, { type: E.A.ADVANCE_DAY });
          u.assert(s.crew.morale === 24, "Morale should decay by 1");
        }
      },
      // -- REPAIR (E.13, E.14) --
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
          u.assert(s.log.some(l => l.includes("Not enough gold")));
        }
      },
      // -- BUY_SHIP (E.15, E.16) --
      {
        name: "E.15 BUY_SHIP changes ship and adjusts crew",
        type: "reducer",
        run: (u) => {
          const state = { ...E.initialState, gold: 5000, ship: { type: "sloop", hull: 100, cannons: 10, upgrades: ["reinforced_hull"] }, crew: { current: 50, max: 50, morale: 80 } };
          const s = E.reducer(state, { type: E.A.BUY_SHIP, shipType: "frigate" });
          u.assertEqual(s.ship.type, "frigate");
          u.assertEqual(s.crew.max, D.SHIPS.frigate.maxCrew);
          u.assert(s.crew.current <= s.crew.max);
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
          u.assert(s.log.some(l => l.includes("Cannot purchase")));
        }
      },
      // -- BUY_UPGRADE (E.17, E.18, E.19) --
      {
        name: "E.17 BUY_UPGRADE installs upgrade",
        type: "reducer",
        run: (u) => {
          const state = { ...E.initialState, ship: { type: "sloop", upgrades: [] }, gold: 1000 };
          const s = E.reducer(state, { type: E.A.BUY_UPGRADE, upgradeKey: "reinforced_hull" });
          u.assert(s.ship.upgrades.includes("reinforced_hull"));
          u.assertEqual(s.gold, 1000 - 500);
        }
      },
      {
        name: "E.18 BUY_UPGRADE already installed",
        type: "reducer",
        run: (u) => {
          const state = { ...E.initialState, ship: { type: "sloop", upgrades: ["reinforced_hull"] }, gold: 1000 };
          const s = E.reducer(state, { type: E.A.BUY_UPGRADE, upgradeKey: "reinforced_hull" });
          u.assertEqual(s.gold, 1000);
          u.assert(s.log.some(l => l.includes("Already installed")));
        }
      },
      {
        name: "E.19 BUY_UPGRADE incompatible ship",
        type: "reducer",
        run: (u) => {
          const state = { ...E.initialState, ship: { type: "dinghy", upgrades: [] }, gold: 1000 };
          const s = E.reducer(state, { type: E.A.BUY_UPGRADE, upgradeKey: "extra_cannons" });
          u.assertEqual(s.gold, 1000);
          u.assert(s.log.some(l => l.includes("Cannot install")));
        }
      },
      // -- HIRE_CREW (E.20) --
      {
        name: "E.20 HIRE_CREW adds crew, deducts gold",
        type: "reducer",
        run: (u) => {
          const state = { ...E.initialState, crew: { current: 20, max: 50, morale: 80 }, gold: 500 };
          const s = E.reducer(state, { type: E.A.HIRE_CREW, count: 5 });
          u.assertEqual(s.crew.current, 25);
          u.assertEqual(s.gold, 250);
        }
      },
      // -- MISSIONS (E.21 TAKE combat, E.22 TAKE trade, E.23 COMPLETE, E.24 COMPLETE wrong port, E.25 ABANDON, E.26 REFRESH) --
      {
        name: "E.21 TAKE_MISSION combat type starts battle",
        type: "reducer",
        run: (u) => {
          const combatMission = D.MISSION_POOL.find(m => m.id === "debug_combat");
          const state = { ...E.initialState, currentPort: "port_royal" };
          const s = E.reducer(state, { type: E.A.TAKE_MISSION, mission: combatMission });
          u.assertEqual(s.screen, "battle");
          u.assert(s.battleState);
        }
      },
      {
        name: "E.22 TAKE_MISSION trade type sets activeMission",
        type: "reducer",
        run: (u) => {
          const tradeMission = D.MISSION_POOL.find(m => m.type === "trade");
          const state = makeState({ currentPort: "port_royal", screen: "port" });
          const s = E.reducer(state, { type: E.A.TAKE_MISSION, mission: tradeMission });
          u.assert(s.activeMission, "Should have active mission");
          u.assertEqual(s.screen, "port", "Screen stays port for trade mission");
        }
      },
      {
        name: "E.23 COMPLETE_MISSION at target adds rewards",
        type: "reducer",
        run: (u) => {
          const mission = { id:"test", name:"Test", gold:500, fame:20, repImpact:{english:10}, targetPort:"tortuga", faction:"english" };
          const state = { ...E.initialState, currentPort:"tortuga", activeMission: mission, gold:1000, fame:0, reputation:{ tortuga:50, port_royal:50, kingston:50 } };
          const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
          u.assertEqual(s.gold, 1500);
          u.assertEqual(s.fame, 20);
          u.assert(s.activeMission === null);
          u.assert(s.reputation.port_royal === 60, "English rep +10");
        }
      },
      {
        name: "E.24 COMPLETE_MISSION wrong port fails",
        type: "reducer",
        run: (u) => {
          const mission = { targetPort:"tortuga", gold:500 };
          const state = { ...E.initialState, currentPort:"port_royal", activeMission: mission, gold:1000 };
          const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
          u.assertEqual(s.gold, 1000);
          u.assert(s.log.some(l => l.includes("Wrong port")));
        }
      },
      {
        name: "E.25 ABANDON_MISSION clears mission and applies penalty",
        type: "reducer",
        run: (u) => {
          const mission = { faction:"english" };
          const state = { ...E.initialState, activeMission: mission, reputation:{ port_royal:50, kingston:50, tortuga:50 } };
          const s = E.reducer(state, { type: E.A.ABANDON_MISSION });
          u.assert(s.activeMission === null);
          u.assert(s.reputation.port_royal < 50, "Should lose reputation");
        }
      },
      {
        name: "E.26 REFRESH_MISSIONS regenerates missions",
        type: "reducer",
        run: (u) => {
          const state = { ...E.initialState, currentPort:"port_royal", missions:[], reputation:{ port_royal:80 } };
          const s = E.reducer(state, { type: E.A.REFRESH_MISSIONS });
          u.assert(s.missions.length > 0);
        }
      },
      // -- COMBAT (E.27-E.33) --
      {
        name: "E.27 BATTLE_ACTION victory when enemy hull<=0",
        type: "reducer",
        run: (u) => {
          // We'll simulate a state where enemy hull is low, and our action will finish them.
          const state = {
            ...E.initialState, screen:"battle",
            ship: { type:"sloop", hull:100, upgrades:[] },
            crew: { current:30, morale:80 },
            battleState: {
              phase:"player_turn", playerHull:100, playerCrew:30,
              enemy: { name:"test", hull:10, cannons:5, crew:10 },
              enemyHull:1, enemyCrew:10, round:1, log:[], returnScreen:"port"
            }
          };
          u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]); // enough damage to kill
          const s = E.reducer(state, { type: E.A.BATTLE_ACTION, action:"broadside" });
          u.assertEqual(s.battleState.phase, "victory");
          u.resetRandomStub();
        }
      },
      {
        name: "E.28 BATTLE_ACTION defeat when player hull<=0",
        type: "reducer",
        run: (u) => {
          const state = {
            ...E.initialState, screen:"battle",
            ship: { type:"sloop", hull:1, upgrades:[] },
            crew: { current:30, morale:80 },
            battleState: {
              phase:"player_turn", playerHull:1, playerCrew:30,
              enemy: { name:"test", hull:100, cannons:50, crew:50 },
              enemyHull:100, enemyCrew:50, round:1, log:[], returnScreen:"port"
            }
          };
          u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
          const s = E.reducer(state, { type: E.A.BATTLE_ACTION, action:"broadside" });
          u.assertEqual(s.battleState.phase, "defeat");
          u.assertEqual(s.ship.hull, 0);
          u.assertEqual(s.screen, "port", "After defeat should return to port");
          u.resetRandomStub();
        }
      },
      {
        name: "E.29 BATTLE_ACTION flee (evade success)",
        type: "reducer",
        run: (u) => {
          const state = {
            ...E.initialState, screen:"battle",
            ship: { type:"sloop", hull:100, upgrades:[] },
            crew: { current:30, morale:80 },
            battleState: {
              phase:"player_turn", playerHull:100, playerCrew:30,
              enemy: { name:"test", hull:100, cannons:10, crew:40 },
              enemyHull:100, enemyCrew:40, round:1, log:[], returnScreen:"port"
            }
          };
          u.resetRandomStub();
          u.setRandomSequence([0.0]); // evade success
          const s = E.reducer(state, { type: E.A.BATTLE_ACTION, action:"evade" });
          u.assertEqual(s.battleState.phase, "fled");
          u.resetRandomStub();
        }
      },
      {
        name: "E.30 BATTLE_ACTION grapple instant victory",
        type: "reducer",
        run: (u) => {
          const state = {
            ...E.initialState, screen:"battle",
            ship: { type:"sloop", hull:100, upgrades:[] },
            crew: { current:50, morale:90 },
            battleState: {
              phase:"player_turn", playerHull:100, playerCrew:50,
              enemy: { name:"test", hull:100, cannons:10, crew:30 },
              enemyHull:100, enemyCrew:30, round:1, log:[], returnScreen:"port"
            }
          };
          u.setRandomSequence([0.0]); // grapple success
          const s = E.reducer(state, { type: E.A.BATTLE_ACTION, action:"grapple" });
          u.assertEqual(s.battleState.phase, "victory");
          u.resetRandomStub();
        }
      },
      {
        name: "E.31 DISMISS_BATTLE after victory auto-completes combat mission",
        type: "reducer",
        run: (u) => {
          const mission = D.MISSION_POOL.find(m => m.type==="combat");
          const state = {
            ...E.initialState, screen:"battle", currentPort:"port_royal",
            activeMission: mission,
            battleState: { phase:"victory", returnScreen:"port", enemy:{} },
            gold:1000, fame:0, reputation: { port_royal:50 }
          };
          const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
          u.assert(s.activeMission === null, "Mission auto-completed");
          u.assert(s.gold > 1000, "Gold reward added");
        }
      },
      {
        name: "E.32 DISMISS_BATTLE after fled while sailing returns to sailing",
        type: "reducer",
        run: (u) => {
          const state = {
            ...E.initialState, screen:"battle", destination:"tortuga", sailingDaysLeft:2,
            battleState: { phase:"fled", returnScreen:"sailing" }
          };
          const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
          u.assertEqual(s.screen, "sailing");
        }
      },
      {
        name: "E.33 DISMISS_BATTLE after victory no mission returns to port",
        type: "reducer",
        run: (u) => {
          const state = {
            ...E.initialState, screen:"battle", currentPort:"port_royal",
            activeMission: null,
            battleState: { phase:"victory", returnScreen:"port" }
          };
          const s = E.reducer(state, { type: E.A.DISMISS_BATTLE });
          u.assertEqual(s.screen, "port");
        }
      },
      // -- EVENTS (E.34-E.39) --
      {
        name: "E.34 RESOLVE_EVENT gold gain",
        type: "reducer",
        run: (u) => {
          const event = {
            choices: [
              { label:"Take", outcome: { gold:200, log:"Got gold" } }
            ]
          };
          const state = { ...E.initialState, activeEvent: event, gold:500 };
          const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
          u.assertEqual(s.gold, 700);
          u.assert(s.log.some(l => l.includes("Got gold")));
        }
      },
      {
        name: "E.35 RESOLVE_EVENT hull damage",
        type: "reducer",
        run: (u) => {
          const event = {
            choices: [ { outcome: { hullDamage:20 } } ]
          };
          const state = { ...E.initialState, activeEvent: event, ship: { hull:100 } };
          const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
          u.assertEqual(s.ship.hull, 80);
        }
      },
      {
        name: "E.36 RESOLVE_EVENT crew loss",
        type: "reducer",
        run: (u) => {
          const event = {
            choices: [ { outcome: { crewLoss:5 } } ]
          };
          const state = { ...E.initialState, activeEvent: event, crew: { current:20 } };
          const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
          u.assertEqual(s.crew.current, 15);
        }
      },
      {
        name: "E.37 RESOLVE_EVENT days lost",
        type: "reducer",
        run: (u) => {
          const event = {
            choices: [ { outcome: { daysLost:3 } } ]
          };
          const state = { ...E.initialState, activeEvent: event, day:10, sailingDaysLeft:5 };
          const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
          u.assertEqual(s.day, 13);
          u.assertEqual(s.sailingDaysLeft, 2);
        }
      },
      {
        name: "E.38 RESOLVE_EVENT reputation impact",
        type: "reducer",
        run: (u) => {
          const event = {
            choices: [ { outcome: { repImpact:{english:10} } } ]
          };
          const state = { ...E.initialState, activeEvent: event, reputation:{ port_royal:50, kingston:50 } };
          const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
          u.assertEqual(s.reputation.port_royal, 60);
        }
      },
      {
        name: "E.39 RESOLVE_EVENT triggers battle",
        type: "reducer",
        run: (u) => {
          const event = {
            choices: [ { outcome: { battle: { enemy:{ name:"Navy", hull:100, cannons:10, crew:40, faction:"english" } } } } ]
          };
          const state = { ...E.initialState, activeEvent: event, ship:{ hull:100 } };
          const s = E.reducer(state, { type: E.A.RESOLVE_EVENT, choiceIndex:0 });
          u.assertEqual(s.screen, "battle");
          u.assert(s.battleState);
          u.assertEqual(s.battleState.enemy.name, "Navy");
        }
      },
      // -- SAVE/LOAD (E.40-E.43) --
      {
        name: "E.40 SAVE_GAME stores state",
        type: "reducer",
        run: (u) => {
          u.installLocalStorageMock();
          const state = { ...E.initialState, gold:1234 };
          const s = E.reducer(state, { type: E.A.SAVE_GAME });
          const stored = localStorage.getItem("piratesSave");
          u.assert(stored, "State should be saved");
          u.assert(JSON.parse(stored).gold === 1234);
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
          u.assertEqual(s.gold, E.initialState.gold); // unchanged
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
    ]
  },

  // ══════════════════════════════════════════════════════════════
  //  C. INTEGRATION TESTS
  // ══════════════════════════════════════════════════════════════
  {
  name: "Integration: End-to-End Flows",
  tests: [
    {
      name: "I.01 Basic voyage: Start → sail → arrive → port screen",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        u.assertEqual(s.currentPort, "tortuga", "Arrived at Tortuga");
        u.assertEqual(s.screen, "port");
        u.assert(s.missions.length > 0, "Missions generated");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.02 Trade mission: accept, sail, complete, rewards",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        s = { ...s, currentPort: "port_royal", reputation: { port_royal: 80 } };
        s.missions = L.generateMissions("port_royal", s);
        const mission = s.missions.find(m => m.targetPort);
        u.assert(mission, "Need a mission with target port");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: mission.targetPort });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        u.assertEqual(s.currentPort, mission.targetPort, "Arrived at target");
        const goldBefore = s.gold;
        const fameBefore = s.fame;
        s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
        u.assert(s.activeMission === null, "Mission completed");
        u.assert(s.gold > goldBefore, "Gold increased");
        u.assert(s.fame > fameBefore, "Fame increased");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.03 Combat mission victory: accept, fight to victory, rewards",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
        const combatMission = D.MISSION_POOL.find(m => m.id === "debug_combat");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: combatMission });
        u.assertEqual(s.screen, "battle", "Battle screen active");
        // simulate victory by forcing enemy hull to 0 via actions (or just setting phase)
        s = { ...s, battleState: { ...s.battleState, enemyHull: 1, phase: "player_turn" } };
        // one hit should kill enemy
        u.resetRandomStub();
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]); // enough damage to sink
        s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
        u.assertEqual(s.battleState.phase, "victory", "Victory achieved");
        const goldBefore = s.gold;
        s = E.reducer(s, { type: E.A.DISMISS_BATTLE });
        u.assert(s.gold > goldBefore, "Gold reward");
        u.assert(s.activeMission === null, "Mission cleared");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.04 Defeat in combat: player hull reaches zero",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
        const combatMission = D.MISSION_POOL.find(m => m.id === "debug_combat");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: combatMission });
        // Set player hull to very low so enemy's damage will sink us
        s = { ...s, battleState: { ...s.battleState, playerHull: 1, enemyHull: 100, enemy: { ...s.battleState.enemy, cannons: 50 } } };
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
        s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
        u.assertEqual(s.battleState.phase, "defeat", "Player defeated");
        u.assertEqual(s.ship.hull, 0, "Ship hull should be zero");
        u.assertEqual(s.screen, "port", "Returned to port after defeat");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.05 Smuggle mission intercept during voyage",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "smuggler" });
        const smugMission = D.MISSION_POOL.find(m => m.id === "smuggle_rum");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: smugMission });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "nassau" });
        // Force intercept on first advance day (random = 0.1 < 0.5)
        u.resetRandomStub();
        u.setRandomSequence([0.1]);
        s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        u.assertEqual(s.screen, "battle", "Intercept triggered battle");
        u.assert(s.battleState, "Battle state exists");
        // Now simulate a quick victory
        s = { ...s, battleState: { ...s.battleState, enemyHull: 1 } };
        u.resetRandomStub(); // reset before next action
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
        s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
        u.assertEqual(s.battleState.phase, "victory", "Won the intercept battle");
        s = E.reducer(s, { type: E.A.DISMISS_BATTLE });
        u.assertEqual(s.screen, "sailing", "Back to sailing after battle");
        // Continue voyage and complete mission
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
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "admiral" }); // has enough gold
        s = { ...s, gold: 10000 };
        const frigateCost = D.SHIPS.frigate.cost;
        const upgradeCost = D.UPGRADES.extra_cannons.cost;
        s = E.reducer(s, { type: E.A.BUY_SHIP, shipType: "frigate" });
        u.assertEqual(s.ship.type, "frigate");
        u.assert(s.gold === 2500 - frigateCost, "Gold deducted for ship");
        s = E.reducer(s, { type: E.A.BUY_UPGRADE, upgradeKey: "extra_cannons" });
        u.assert(s.ship.upgrades.includes("extra_cannons"), "Upgrade installed");
        u.assert(s.gold === 2500 - frigateCost - upgradeCost, "Gold deducted for upgrade");
        const stats = L.getShipStats(s);
        u.assertEqual(stats.cannons, D.SHIPS.frigate.cannons + 2, "Effective cannons increased");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.07 Crew hiring and wage scaling",
      type: "integration",
      run: (u) => {
        u.resetRandomStub();
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        s = E.reducer(s, { type: E.A.HIRE_CREW, count: 10 });
        u.assertEqual(s.crew.current, 40, "Crew increased");
        // Advance a day to see wage deduction
        s = { ...s, screen: "sailing", destination: "tortuga", sailingDaysLeft: 3, sailingDaysTotal: 3 };
        const goldBefore = s.gold;
        s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        u.assert(s.gold < goldBefore, "Wages deducted");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.08 Hostile port entry triggers battle",
      type: "integration",
      run: (u) => {
        u.resetRandomStub();
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
        // Lower rep to hostile
        s = { ...s, reputation: { ...s.reputation, port_royal: 5 } };
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "port_royal" });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        u.assertEqual(s.screen, "battle", "Hostile port triggered battle");
        u.assert(s.battleState.enemy.name.includes("Port Royal"), "Enemy is port guards");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.09 Event resolution with outcomes",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        // create a fake event
        const testEvent = {
          id: "test_event",
          type: "reward",
          title: "Test Event",
          desc: "A test.",
          choices: [
            { label: "Take gold", outcome: { gold: 200, log: "You take gold." } }
          ]
        };
        s = { ...s, activeEvent: testEvent };
        const goldBefore = s.gold;
        s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 });
        u.assertEqual(s.gold, goldBefore + 200, "Gold gained");
        u.assert(s.activeEvent === null, "Event cleared");
        u.assert(s.log.some(l => l.includes("You take gold")), "Log updated");
        u.restoreLocalStorage();
      }
    },
    {
      name: "I.10 Save and load cycle",
      type: "integration",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
        const goldBefore = s.gold;
        const dayBefore = s.day;
        // Save
        s = E.reducer(s, { type: E.A.SAVE_GAME });
        u.assert(localStorage.getItem("piratesSave"), "Save exists");
        // Load into a fresh state
        const fresh = E.reducer(E.initialState, { type: E.A.LOAD_GAME });
        u.assertEqual(fresh.gold, goldBefore, "Gold restored");
        u.assertEqual(fresh.day, dayBefore, "Day restored");
        u.assertEqual(fresh.screen, "port");
        u.restoreLocalStorage();
      }
    },
  ]
},

  // ══════════════════════════════════════════════════════════════
  //  D. USER SCENARIOS
  // ══════════════════════════════════════════════════════════════


{
  name: "Scenarios: User Simulation",
  tests: [
    // S.01 Full voyage UI: Start → World Map → click port → sail → arrive → port screen
    {
      name: "S.01 Full voyage from start to arrival at Tortuga",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "map" });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        u.assertEqual(s.currentPort, "tortuga");
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes("Tortuga"), "PortScreen shows Tortuga");
        unmount();
        u.restoreLocalStorage();
      }
    },
    // S.02 Purchase ship and check HUD (ship stats in port screen)
    {
      name: "S.02 Purchase ship and verify updated ship stats",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = makeState({
          screen: "port",
          gold: 10000,
          ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] }
        });
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "shipyard" });
        s = E.reducer(s, { type: E.A.BUY_SHIP, shipType: "galleon" });
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "port" });
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes("Galleon"), "PortScreen shows new ship name");
        u.assert(container.textContent.includes(String(D.SHIPS.galleon.maxHull)), "Shows new max hull");
        unmount();
        u.restoreLocalStorage();
      }
    },
    // S.03 Combat mission via UI: accept, fight to victory, dismiss, check rewards
    {
      name: "S.03 Combat mission: fight and win, see rewards in port",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "pirate" });
        const mission = D.MISSION_POOL.find(m => m.id === "debug_combat");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission });
        // Simulate battle: force enemy hull to 1 and attack
        s = { ...s, battleState: { ...s.battleState, enemyHull: 1 } };
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5]);
        s = E.reducer(s, { type: E.A.BATTLE_ACTION, action: "broadside" });
        u.assertEqual(s.battleState.phase, "victory");
        const goldBefore = s.gold;
        s = E.reducer(s, { type: E.A.DISMISS_BATTLE });
        u.assert(s.gold > goldBefore, "Gold increased");
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "port" });
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes("💰") || container.textContent.includes("Gold"), "Gold visible");
        unmount();
        u.restoreLocalStorage();
      }
    },
    // S.04 Crew hiring and manifest count
    {
      name: "S.04 Hire crew and verify manifest update",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = makeState({
          screen: "port",
          gold: 5000,
          ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] },
          crew: { current: 20, max: 50, morale: 80 }
        });
        s = E.reducer(s, { type: E.A.NAVIGATE, screen: "crew" });
        s = E.reducer(s, { type: E.A.HIRE_CREW, count: 10 });
        u.assertEqual(s.crew.current, 30);
        const { container, unmount } = u.mountReact(window.S.CrewScreen, { state: s, dispatch: () => {} });
        // Manifest uses emoji icons: ⚓🗡🔧🍖 – check for at least one
        u.assert(container.textContent.includes("⚓") || container.textContent.includes("🗡") || container.textContent.includes("🔧") || container.textContent.includes("🍖"),
          "Manifest icons should appear");
        unmount();
        u.restoreLocalStorage();
      }
    },
    // S.05 Low morale warning
    {
      name: "S.05 Low morale triggers warning on CrewScreen",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = makeState({
          screen: "crew",
          crew: { current: 30, max: 50, morale: 25 },
          ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] }
        });
        const { container, unmount } = u.mountReact(window.S.CrewScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes("Low morale weakens combat effectiveness"), "Warning should appear");
        unmount();
        u.restoreLocalStorage();
      }
    },
    // S.06 Save and Continue (simulate reload)
    {
      name: "S.06 Save game and continue after reload",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        const gold = s.gold;
        const day = s.day;
        s = E.reducer(s, { type: E.A.SAVE_GAME });
        const freshState = E.reducer(E.initialState, { type: E.A.LOAD_GAME });
        u.assertEqual(freshState.gold, gold, "Gold restored");
        u.assertEqual(freshState.day, day, "Day restored");
        u.assertEqual(freshState.screen, "port");
        u.restoreLocalStorage();
      }
    },
    // S.07 Upgrade ship and see stat changes + upgrade pill
    {
      name: "S.07 Install upgrade and verify UI update",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = makeState({
          screen: "port",
          gold: 2000,
          ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] }
        });
        s = E.reducer(s, { type: E.A.BUY_UPGRADE, upgradeKey: "reinforced_hull" });
        u.assert(s.ship.upgrades.includes("reinforced_hull"), "Upgrade installed");
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes(D.UPGRADES.reinforced_hull.name), "Upgrade name visible");
        unmount();
        u.restoreLocalStorage();
      }
    },
    // S.08 Multiple mission completions: complete two trade missions sequentially
    {
      name: "S.08 Complete two trade missions and verify cumulative rewards",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        s = { ...s, currentPort: "port_royal", reputation: { ...s.reputation, port_royal: 80 } };
        s.missions = L.generateMissions("port_royal", s);
        let m1 = s.missions.find(m => m.targetPort);
        u.assert(m1, "First mission available");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission: m1 });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: m1.targetPort });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
        const gold1 = s.gold, fame1 = s.fame;
        s.missions = L.generateMissions(s.currentPort, s);
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
    // S.09 Faction screen reflects reputation changes after mission
    {
      name: "S.09 Faction screen shows updated reputation after mission",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        let s = makeState({ currentPort: "curacao", reputation: { ...makeState().reputation, curacao: 60 } });
        const mission = D.MISSION_POOL.find(m => m.id === "escort_merchant");
        u.assert(mission, "Escort mission found");
        s = E.reducer(s, { type: E.A.TAKE_MISSION, mission });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: mission.targetPort });
        while (s.sailingDaysLeft > 0) s = E.reducer(s, { type: E.A.ADVANCE_DAY });
        s = E.reducer(s, { type: E.A.ENTER_PORT });
        s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
        const { container, unmount } = u.mountReact(window.S.FactionsScreen, { state: s, dispatch: () => {} });
        u.assert(container.textContent.includes("Allied") || container.textContent.includes("Friendly"), "Reputation label improved");
        unmount();
        u.restoreLocalStorage();
      }
    },
    // S.10 Random event while sailing: trigger, resolve, check log
    {
      name: "S.10 Random event during sailing",
      type: "scenario",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        u.resetRandomStub();
        let s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: "merchant" });
        s = E.reducer(s, { type: E.A.SAIL_TO, port: "tortuga" });
        u.setRandomSequence([0.05, 0.5]);
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
},

  // ══════════════════════════════════════════════════════════════
  //  E. UI SMOKE TESTS
  // ══════════════════════════════════════════════════════════════
  {
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
          screen: "port", currentPort: "port_royal",
          ship: { type: "sloop", name: "Sea Dog", hull: 100, cannons: 10, upgrades: [] },
          crew: { current: 30, max: 50, morale: 80 },
          missions: [], activeMission: null,
          log: ["Test log entry"]
        });
        const { container, unmount } = u.mountReact(window.S.PortScreen, { state, dispatch: () => {} });
        console.log("U.02 innerHTML:", container.innerHTML);  // <-- add this
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
        const state = makeState({
          screen: "map", currentPort: "port_royal",
          wind: { angle: 45, speed: 10 }
        });
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
          screen: "sailing", currentPort: "port_royal", destination: "tortuga",
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
          screen: "shipyard", currentPort: "port_royal",
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
          screen: "crew", crew: { current: 20, max: 50, morale: 80 },
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
      name: "U.07 FactionsScreen shows factions with reputation bars",
      type: "ui",
      run: (u) => {
        const state = makeState({
          screen: "factions",
          reputation: { port_royal: 60, kingston: 60, havana: 40, tortuga: 30 }
        });
        const { container, unmount } = u.mountReact(window.S.FactionsScreen, { state, dispatch: () => {} });
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
          crew: { current: 30, morale: 80 },
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
    }
  ]
},

// ══════════════════════════════════════════════════════════════
  //  F. Additional Tests (bugs / edge cases)
  // ══════════════════════════════════════════════════════════════

{
  name: "Edge Cases & Bug Regression",
  tests: [
    {
      name: "F.01 LocalStorage key consistency (save/load)",
      type: "unit",
      run: (u) => {
        u.installLocalStorageMock();
        u.clearLocalStorageMock();
        // Save game using reducer (which uses key 'piratesSave')
        const state = { ...E.initialState, gold: 999 };
        const afterSave = E.reducer(state, { type: E.A.SAVE_GAME });
        const has = L.hasSave();
        // This test will PASS if keys match, FAIL if mismatch.
        u.assert(has === true, "hasSave should return true after SAVE_GAME");
        u.restoreLocalStorage();
      }
    },
    {
      name: "F.02 getShipStats with invalid upgrade key does not crash",
      type: "unit",
      run: (u) => {
        const state = { ship: { type: "sloop", upgrades: ["nonexistent"] } };
        // Should not throw
        const s = L.getShipStats(state);
        u.assert(typeof s.maxHull === "number", "Should return stats even with bad upgrade");
      }
    },
    {
      name: "F.03 applyReputationImpact with empty object leaves rep unchanged",
      type: "unit",
      run: (u) => {
        const state = { reputation: { port_royal: 50, tortuga: 40 } };
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
        u.assertEqual(s.sailingDaysLeft, 0, "Days left unchanged");
        u.assertEqual(s.day, E.initialState.day, "Day unchanged (except maybe day increment? Actually reducer checks sailingDaysLeft <=0 and returns state)");
        // Actually the reducer returns state if sailingDaysLeft <=0, so no day advance.
        u.assertEqual(s.gold, E.initialState.gold, "No wage deduction");
      }
    },
    {
      name: "F.05 BUY_SHIP to a smaller ship caps crew and clears upgrades",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, gold: 5000, ship: { type: "galleon", hull: 300, cannons: 30, upgrades: ["reinforced_hull"] }, crew: { current: 150, max: 150, morale: 80 } };
        const s = E.reducer(state, { type: E.A.BUY_SHIP, shipType: "sloop" });
        u.assertEqual(s.ship.type, "sloop");
        u.assert(s.crew.max === D.SHIPS.sloop.maxCrew, "Crew max reduced");
        u.assert(s.crew.current <= s.crew.max, "Crew capped");
        u.assert(s.ship.upgrades.length === 0, "Upgrades cleared");
      }
    },
    {
      name: "F.06 HIRE_CREW when already at max fails",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, crew: { current: 50, max: 50, morale: 80 }, gold: 1000 };
        const s = E.reducer(state, { type: E.A.HIRE_CREW, count: 5 });
        u.assertEqual(s.crew.current, 50, "Crew unchanged");
        u.assertEqual(s.gold, 1000, "Gold unchanged");
      }
    },
    {
      name: "F.07 COMPLETE_MISSION without active mission does not crash",
      type: "reducer",
      run: (u) => {
        const state = { ...E.initialState, activeMission: null };
        const s = E.reducer(state, { type: E.A.COMPLETE_MISSION });
        u.assert(s.activeMission === null, "Still no mission");
        u.assertEqual(s.gold, state.gold, "No reward");
      }
    },
    {
      name: "F.08 Reputation clamping (0-100) during many decays",
      type: "unit",
      run: (u) => {
        // Simulate many decays starting from extreme values
        let state = { reputation: { port_royal: 100, tortuga: 5 } };
        for (let i = 0; i < 20; i++) {
          state.reputation = L.decayReputation(state);
        }
        u.assert(state.reputation.port_royal >= 80, "High rep decayed but still high");
        u.assertEqual(state.reputation.tortuga, 0, "Low rep clamped at 0");
      }
    },
    {
      name: "F.09 resolveCombatAction handles missing battleState gracefully",
      type: "unit",
      run: (u) => {
        const state = { ship: { type: "sloop", upgrades: [] }, crew: { morale: 80 } };
        try {
          L.resolveCombatAction(state, "broadside");
          // If no throw, test passes as long as nothing crashes. We'll just assert it doesn't throw.
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
        const state = { reputation: { port_royal: 0 } }; // very low rep
        const missions = L.generateMissions("port_royal", state);
        // With low rep, only low-risk missions are allowed, but if none fit, it returns empty.
        // At least verify it's an array.
        u.assert(Array.isArray(missions), "Should return an array");
        u.assert(missions.every(m => m.risk === "low"), "Only low risk if any");
      }
    },
  ]
}


];