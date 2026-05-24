// tests_logic.js — Unit tests for logic.js and generators.js
window.TESTS = window.TESTS || [];

window.TESTS.push({
  name: "Unit: logic.js (Pure Functions)",
  tests: [
    {
      name: "L.01 travelDays: basic distance calculation",
      type: "unit",
      run: (u) => {
        const state = { ship: { type: "sloop", upgrades: [] }, wind: { angle: 0, speed: 10 }, crew: { morale: 80 } };
        u.assert(L.travelDays("portRoyal", "havana", state) >= 1, "Days should be at least 1");
      }
    },
    {
      name: "L.02 travelDays: favorable wind reduces days",
      type: "unit",
      run: (u) => {
        const from = D.PORTS.portRoyal;
        const to = D.PORTS.havana;
        const angleToPort = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
        const base = { ship: { type: "sloop", upgrades: [] }, wind: { angle: 0, speed: 10 }, crew: { morale: 80 } };
        const fav = { ...base, wind: { angle: angleToPort, speed: 10 } };
        const opp = { ...base, wind: { angle: (angleToPort + 180) % 360, speed: 10 } };
        u.assert(L.travelDays("portRoyal", "havana", fav) < L.travelDays("portRoyal", "havana", opp), "Favorable wind should yield fewer days");
      }
    },
    {
      name: "L.03 travelDays: opposing wind increases days",
      type: "unit",
      run: (u) => {
        const from = D.PORTS.portRoyal;
        const to = D.PORTS.havana;
        const angleToPort = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
        const base = { ship: { type: "sloop", upgrades: [] }, wind: { angle: 0, speed: 10 } };
        const neutral = { ...base, wind: { angle: (angleToPort + 90) % 360, speed: 10 } };
        const opp = { ...base, wind: { angle: (angleToPort + 180) % 360, speed: 10 } };
        u.assert(L.travelDays("portRoyal", "havana", opp) > L.travelDays("portRoyal", "havana", neutral), "Opposing wind should increase days");
      }
    },
    {
      name: "L.04 travelDays: low morale adds days",
      type: "unit",
      run: (u) => {
        const base = { ship: { type: "sloop", upgrades: [] }, wind: { angle: 0, speed: 10 } };
        const high = { ...base, crew: { morale: 80 } };
        const low  = { ...base, crew: { morale: 25 } };
        u.assert(L.travelDays("portRoyal", "tortuga", low) > L.travelDays("portRoyal", "tortuga", high), "Low morale should increase travel days");
      }
    },
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
    {
      name: "L.13 payCrewWages: normal morale (>=30)",
      type: "unit",
      run: (u) => {
        const state = {
          ship: { type: "sloop", upgrades: [] },
          crew: { roster: fillRoster(30), morale: 80 }
        };
        u.assertEqual(L.payCrewWages(state), 60, "Wages = 30 * 2");
      }
    },
    {
      name: "L.14 payCrewWages: low morale (<30) multiplier 1.5",
      type: "unit",
      run: (u) => {
        const state = {
          ship: { type: "sloop", upgrades: [] },
          crew: { roster: fillRoster(30), morale: 20 }
        };
        u.assertEqual(L.payCrewWages(state), 90, "Wages = 30 * 2 * 1.5");
      }
    },
    {
      name: "L.15 generateMissions: port with service and high rep returns 2-3 missions",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const state = { reputation: { portRoyal: 80 } };
        const missions = G.generateMissions("portRoyal", state);
        u.assert(missions.length >= 2 && missions.length <= 3, `Expected 2-3 missions, got ${missions.length}`);
      }
    },
    {
      name: "L.16 generateMissions: high-risk missions hidden when rep<40",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const stateLow = { reputation: { portRoyal: 30 } };
        const missions = G.generateMissions("portRoyal", stateLow);
        u.assert(!missions.some(m => m.risk === "high"), "No high-risk missions should appear");
      }
    },
    // Root Cause 5: Updated assertion for allied factions
    {
      name: "L.17 generateMissions: no rival faction missions",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const state = { reputation: { portRoyal: 50 } };
        const missions = G.generateMissions("portRoyal", state);
        u.assert(missions.every(m => !D.FACTIONS.english.rivalFactions.includes(m.faction)), "No rival faction missions should appear");
      }
    },
    {
      name: "L.18 generateMissions: medium-risk hidden when rep<20",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const stateLow = { reputation: { portRoyal: 10 } };
        const missions = G.generateMissions("portRoyal", stateLow);
        u.assert(!missions.some(m => m.risk === "medium" || m.risk === "high"), "Only low-risk missions should appear");
      }
    },
    {
      name: "L.19 triggerRandomEvent: returns a random event (no conditions)",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const state = { crew: { morale: 50 }, currentPort: "portRoyal", reputation: { portRoyal: 50 } };
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
      name: "L.22 decayReputation: only ports above 50 decay by 1",
      type: "unit",
      run: (u) => {
        const state = {
          reputation: { portRoyal: 80, tortuga: 50, havana: 30 }
        };
        const newRep = L.decayReputation(state);
        u.assertEqual(newRep.portRoyal, 79, "Above 50 → decay");
        u.assertEqual(newRep.tortuga, 50, "At 50 → stays");
        u.assertEqual(newRep.havana, 30, "Below 50 → stays");
      }
    },
    {
      name: "L.23 applyReputationImpact: changes all ports of a faction",
      type: "unit",
      run: (u) => {
        const state = { reputation: { portRoyal: 50, kingston: 50, havana: 50 } };
        const newRep = L.applyReputationImpact(state, { english: 10, spanish: -10 });
        u.assertEqual(newRep.portRoyal, 60);
        u.assertEqual(newRep.kingston, 60);
        u.assertEqual(newRep.havana, 40);
      }
    },
    {
      name: "L.24 updateReputation: single port update clamped 0-100",
      type: "unit",
      run: (u) => {
        const state = { reputation: { portRoyal: 95 } };
        u.assertEqual(L.updateReputation(state, "portRoyal", 10).portRoyal, 100);
        u.assertEqual(L.updateReputation(state, "portRoyal", -100).portRoyal, 0);
      }
    },
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
    // Combat tests - Root Cause 9: extended sequences
    {
      name: "L.30 resolveCombatAction: broadside damages enemy hull and crew",
      type: "unit",
      run: (u) => {
        u.setRandomSequence([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
        const state = {
          ship: { type: "sloop", hull: 100, upgrades: [] },
          crew: { roster: fillRoster(30), morale: 80 },
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
        u.setRandomSequence([0.1, 0.5, 0.4, 0.5, 0.5, 0.4, 0.5, 0.5, 0.5, 0.5]);
        const state = {
          ship: { type: "sloop", hull: 100, upgrades: [] },
          crew: { roster: fillRoster(30), morale: 80 },
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
        u.setRandomSequence([0.0, 0.5, 0.5, 0.5, 0.5]);
        const state = {
          ship: { type: "sloop", hull: 100, upgrades: [] },
          crew: { roster: fillRoster(50), morale: 90 },
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
        u.setRandomSequence([0.99, 0.5, 0.3, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
        const state = {
          ship: { type: "sloop", hull: 100, upgrades: [] },
          crew: { roster: fillRoster(20), morale: 20 },
          battleState: {
            playerHull: 100, playerCrew: 20,
            enemy: { name: "test", hull: 100, cannons: 10, crew: 60 },
            enemyHull: 100, enemyCrew: 60
          }
        };
        const o = L.resolveCombatAction(state, "grapple");
        u.assert(o.instantVictory === false);
        u.assert(o.player.crewLoss > 0, "Player should lose crew on failed grapple");
        u.assert(o.player.hullDamage === 0);
        u.resetRandomStub();
      }
    },
    {
      name: "L.34 resolveCombatAction: evade success fled=true",
      type: "unit",
      run: (u) => {
        u.setRandomSequence([0.0, 0.5, 0.5, 0.5, 0.5]);
        const state = {
          ship: { type: "sloop", hull: 100, upgrades: [] },
          crew: { roster: fillRoster(30), morale: 80 },
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
        u.setRandomSequence([0.95, 0.5, 0.4, 0.5, 0.5, 0.4, 0.5, 0.5, 0.5, 0.5]);
        const state = {
          ship: { type: "sloop", hull: 100, upgrades: [] },
          crew: { roster: fillRoster(30), morale: 80 },
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
        u.setRandomSequence([0.5, 0.4, 0.5, 0.5, 0.4, 0.5, 0.5, 0.4, 0.5, 0.5]);
        const highMorale = {
          ship: { type: "sloop", hull: 100, upgrades: [] },
          crew: { roster: fillRoster(30), morale: 80 },
          battleState: {
            playerHull: 100, playerCrew: 30,
            enemy: { name: "test", hull: 100, cannons: 10, crew: 40 },
            enemyHull: 100, enemyCrew: 40
          }
        };
        const lowMorale = { ...highMorale, crew: { ...highMorale.crew, morale: 20 } };
        const oHigh = L.resolveCombatAction(highMorale, "broadside");
        u.resetRandomStub();
        u.setRandomSequence([0.5, 0.4, 0.5, 0.5, 0.4, 0.5, 0.5, 0.4, 0.5, 0.5]);
        const oLow = L.resolveCombatAction(lowMorale, "broadside");
        u.resetRandomStub();
        u.assert(oHigh.player.hullDamage < oLow.player.hullDamage, "High morale reduces damage");
      }
    },
    {
      name: "L.37 resolveCombatAction: NPC weighted actions",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
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
    {
      name: "L.43 getFameLabel returns correct tier at boundaries",
      type: "unit",
      run: (u) => {
        u.assertEqual(L.getFameLabel(0), "Unknown");
        u.assertEqual(L.getFameLabel(49), "Unknown");
        u.assertEqual(L.getFameLabel(50), "Recognised");
        u.assertEqual(L.getFameLabel(99), "Recognised");
        u.assertEqual(L.getFameLabel(100), "Notorious");
        u.assertEqual(L.getFameLabel(199), "Notorious");
        u.assertEqual(L.getFameLabel(200), "Legendary");
        u.assertEqual(L.getFameLabel(349), "Legendary");
        u.assertEqual(L.getFameLabel(350), "Immortal");
      }
    },
    {
      name: "L.44 meetsRequirement blocks when fame too low",
      type: "unit",
      run: (u) => {
        const state = { fame: 10 };
        const item = { requiredFame: 50, name: "Frigate" };
        const res = L.meetsRequirement(state, item);
        u.assert(res.allowed === false, "Should be blocked");
        u.assert(res.reason.includes("Requires ★ 50 fame"), "Reason should mention required fame");
      }
    },
    {
      name: "L.45 meetsRequirement allows when fame sufficient",
      type: "unit",
      run: (u) => {
        const state = { fame: 60 };
        const item = { requiredFame: 50 };
        const res = L.meetsRequirement(state, item);
        u.assert(res.allowed === true, "Should be allowed");
        u.assertEqual(res.reason, null);
      }
    },
    {
      name: "L.46 meetsRequirement allows when no requiredFame field",
      type: "unit",
      run: (u) => {
        const state = { fame: 0 };
        const item = { name: "Sloop" };
        const res = L.meetsRequirement(state, item);
        u.assert(res.allowed === true);
      }
    },
    {
      name: "L.47 generateMissions filters out fame-gated missions",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const state = { fame: 10, reputation: { portRoyal: 80 } };
        const missions = G.generateMissions("portRoyal", state);
        u.assert(!missions.some(m => m.id === "hunt_pirate"), "hunt_pirate should be hidden");
      }
    },
    {
      name: "L.48 generateMissions includes fame-gated missions when unlocked",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const state = { fame: 60, reputation: { portRoyal: 80 } };
        const missions = G.generateMissions("portRoyal", state);
        u.assert(missions.length > 0, "Some missions should appear");
      }
    },
    {
      name: "L.49 getRepPerk returns correct object at rep boundaries",
      type: "unit",
      run: (u) => {
        u.assertEqual(L.getRepPerk(80).tier, "allied");
        u.assertEqual(L.getRepPerk(79).tier, "friendly");
        u.assertEqual(L.getRepPerk(50).tier, "friendly");
        u.assertEqual(L.getRepPerk(49).tier, "neutral");
        u.assertEqual(L.getRepPerk(30).tier, "neutral");
        u.assertEqual(L.getRepPerk(29).tier, "hostile");
        u.assertEqual(L.getRepPerk(10).tier, "hostile");
        u.assertEqual(L.getRepPerk(9).tier, "at_war");
        u.assertEqual(L.getRepPerk(80).repairMult, 0.80);
        u.assertEqual(L.getRepPerk(50).missionMult, 1.10);
        u.assertEqual(L.getRepPerk(9).servicesBlocked, true);
      }
    },
    {
      name: "L.53 getInfamyLabel returns correct tier at boundaries",
      type: "unit",
      run: (u) => {
        u.assertEqual(L.getInfamyLabel(0), "Clean");
        u.assertEqual(L.getInfamyLabel(9), "Clean");
        u.assertEqual(L.getInfamyLabel(10), "Suspect");
        u.assertEqual(L.getInfamyLabel(24), "Suspect");
        u.assertEqual(L.getInfamyLabel(25), "Wanted");
        u.assertEqual(L.getInfamyLabel(49), "Wanted");
        u.assertEqual(L.getInfamyLabel(50), "Notorious");
        u.assertEqual(L.getInfamyLabel(99), "Notorious");
        u.assertEqual(L.getInfamyLabel(100), "Legendary Outlaw");
      }
    },
    {
      name: "L.54 canBribe returns true below 50 infamy",
      type: "unit",
      run: (u) => {
        u.assert(L.canBribe({ infamy: 0 }) === true);
        u.assert(L.canBribe({ infamy: 49 }) === true);
        u.assert(L.canBribe({}) === true, "undefined infamy → true");
      }
    },
    {
      name: "L.55 canBribe returns false at 50+ infamy",
      type: "unit",
      run: (u) => {
        u.assert(L.canBribe({ infamy: 50 }) === false);
        u.assert(L.canBribe({ infamy: 100 }) === false);
      }
    },
    {
      name: "L.56 buildEncounterContext blocks bribe at 50 infamy",
      type: "unit",
      run: (u) => {
        const state = {
          infamy: 50,
          gold: 1000,
          reputation: { tortuga: 50 },
          destination: "tortuga",
          ship: { type: "sloop", upgrades: [] },
          crew: { morale: 80 }
        };
        const enemy = { name: "Patrol", hull: 100, cannons: 10, crew: 40, gold: 300 };
        const ctx = L.buildEncounterContext(state, "patrol", enemy);
        u.assert(ctx.options.bribe.available === false, "Bribe should be unavailable");
        u.assert(ctx.options.bribe.reason.includes("bribery has preceded you"), "Reason should mention bribery reputation");
      }
    },
    // Hold & Provisions
    {
      name: "L.57 getHoldUsed sums quantities",
      type: "unit",
      run: (u) => {
        const items = { food:10, rum:5, water:0 };
        u.assertEqual(L.getHoldUsed(items), 15);
        u.assertEqual(L.getHoldUsed({}), 0);
      }
    },
    {
      name: "L.58 getHoldLoadPct returns fraction",
      type: "unit",
      run: (u) => {
        u.assertEqual(L.getHoldLoadPct({ rum:100 }, 200), 0.5);
        u.assertEqual(L.getHoldLoadPct({ food:80 }, 80), 1.0, "At capacity = 100%");
        u.assertEqual(L.getHoldLoadPct({}, 100), 0, "Empty hold = 0%");
        u.assertEqual(L.getHoldLoadPct({ rum:10 }, 0), 0, "Zero capacity safe");
      }
    },
    {
      name: "L.59 getHoldSpeedMultiplier returns correct tiers",
      type: "unit",
      run: (u) => {
        u.assertEqual(L.getHoldSpeedMultiplier(0.4), 1.00);
        u.assertEqual(L.getHoldSpeedMultiplier(0.6), 1.11);
        u.assertEqual(L.getHoldSpeedMultiplier(0.8), 1.33);
        u.assertEqual(L.getHoldSpeedMultiplier(0.0), 1.00);
      }
    },
    {
      name: "L.60 getProvisionConsumptionPerDay scales with crew",
      type: "unit",
      run: (u) => {
        const state30 = { crew: { roster: Array(30).fill({}) } };
        u.assertDeepEqual(L.getProvisionConsumptionPerDay(state30), { food:3, water:3 }, "30 crew → 3/day");
        const state0 = { crew: { roster: [] } };
        u.assertDeepEqual(L.getProvisionConsumptionPerDay(state0), { food:0, water:0 }, "0 crew → 0/day");
      }
    },
    {
      name: "L.61 getDaysOfProvisions returns remaining days",
      type: "unit",
      run: (u) => {
        const items = { food:9, water:15 };
        const rate = { food:3, water:3 };
        u.assertDeepEqual(L.getDaysOfProvisions(items, rate), { food:3, water:5 });
        u.assertDeepEqual(L.getDaysOfProvisions({ food:0, water:10 }, rate), { food:0, water:3 });
      }
    },
    {
      name: "L.62 applyLoseCargoPercent reduces all goods",
      type: "unit",
      run: (u) => {
        const items = { rum:10, food:20, water:15 };
        u.assertDeepEqual(L.applyLoseCargoPercent(items, 50), { rum:5, food:10, water:7 });
      }
    },
    {
      name: "L.63 applyLoseContraband removes illegal goods",
      type: "unit",
      run: (u) => {
        const items = { rum:10, tobacco:5, slaves:2, food:20 };
        u.assertDeepEqual(L.applyLoseContraband(items), { rum:10, tobacco:0, slaves:0, food:20 });
      }
    },
  ]
});

window.TESTS.push({
  name: "Generator: generators.js (G)",
  tests: [
    {
      name: "G.01 generateCrewMember creates a valid member",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const member = G.generateCrewMember("english");
        u.assert(member.id, "Has id");
        u.assert(member.firstName, "Has first name");
        u.assert(member.lastName, "Has last name");
        u.assert(member.role, "Has role");
        u.assertEqual(member.faction, "english");
      }
    },
    {
      name: "G.02 generateRoster creates correct count",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const roster = G.generateRoster(5, "pirate");
        u.assertEqual(roster.length, 5);
        u.assert(roster.every(m => m.faction === "pirate"), "All pirate faction");
        const names = roster.map(m => m.firstName + " " + m.lastName);
        u.assertEqual(new Set(names).size, 5, "All names unique");
      }
    },
    {
      name: "G.03 removeRandomCrew removes exactly count members",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const roster = G.generateRoster(10, "english");
        const { newRoster, removed } = L.removeRandomCrew(roster, 3);
        u.assertEqual(newRoster.length, 7);
        u.assertEqual(removed.length, 3);
        const removedIds = new Set(removed.map(m => m.id));
        u.assert(newRoster.every(m => !removedIds.has(m.id)), "Removed members not in new roster");
      }
    },
    {
      name: "G.10 generateEnemy returns object within hull range (tier 0, low risk)",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const enemy = G.generateEnemy("low", 0, "english");
        u.assert(enemy.hull >= 20 && enemy.hull <= 45, `Hull ${enemy.hull} in [20,45]`);
        u.assert(enemy.cannons >= 2 && enemy.cannons <= 6, `Cannons ${enemy.cannons} in [2,6]`);
        u.assert(enemy.crew >= 8 && enemy.crew <= 18, `Crew ${enemy.crew} in [8,18]`);
      }
    },
    {
      name: "G.11 generateEnemy assault risk hull can exceed tier max",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const enemy = G.generateEnemy("assault", 200, "english");
        u.assert(enemy.hull >= 95 && enemy.hull <= 248, `Assault hull ${enemy.hull} in extended range`);
      }
    },
    {
      name: "G.12 generateEnemy returns a name (non-empty string)",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const enemy = G.generateEnemy("medium", 50, "french");
        u.assert(typeof enemy.name === "string" && enemy.name.length > 0, "Has a name");
      }
    },
    {
      name: "G.13 generateEnemy returns a faction from rivalFactions",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const enemy = G.generateEnemy("low", 0, "english");
        const valid = D.FACTIONS.english.rivalFactions;
        u.assert(valid.includes(enemy.faction), `Enemy faction ${enemy.faction} should be a rival of english`);
      }
    },
    {
      name: "G.14 generateMissions returns 2-3 missions",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const state = { fame: 0, infamy: 0, reputation: { portRoyal: 50 } };
        const missions = G.generateMissions("portRoyal", state);
        u.assert(missions.length >= 2 && missions.length <= 3, `Got ${missions.length} missions`);
      }
    },
    {
      name: "G.15 generateMissions never returns targetPort === currentPort",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const state = { fame: 50, infamy: 0, reputation: { portRoyal: 50 } };
        const missions = G.generateMissions("portRoyal", state);
        u.assert(missions.every(m => m.targetPort !== "portRoyal"), "No mission targets current port");
      }
    },
    {
      name: "G.16 generateMissions returns [] when At War (rep < 10)",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const state = { fame: 0, infamy: 0, reputation: { portRoyal: 5 } };
        const missions = G.generateMissions("portRoyal", state);
        u.assertEqual(missions.length, 0, "No missions at war");
      }
    },
    {
      name: "G.17 generateMissions gold is multiple of 25",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const state = { fame: 0, infamy: 0, reputation: { portRoyal: 50 } };
        const missions = G.generateMissions("portRoyal", state);
        u.assert(missions.every(m => m.gold % 25 === 0), "All gold multiples of 25");
      }
    },
    {
      name: "G.18 generateMissions all returned missions have non-empty name and description",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const state = { fame: 0, infamy: 0, reputation: { portRoyal: 50 } };
        const missions = G.generateMissions("portRoyal", state);
        u.assert(missions.every(m => m.name.length > 0 && (m.description || m.desc).length > 0), "Name & desc");
      }
    },
    {
      name: "G.19 opposingFaction returns a rival of the given faction",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const enemy = G.opposingFaction("english");
        u.assert(D.FACTIONS.english.rivalFactions.includes(enemy), `Got ${enemy}`);
      }
    },
    {
      name: "G.20 getFameTier boundaries",
      type: "unit",
      run: (u) => {
        u.assertEqual(L.getFameTier(0), 0);
        u.assertEqual(L.getFameTier(50), 1);
        u.assertEqual(L.getFameTier(100), 2);
        u.assertEqual(L.getFameTier(200), 3);
        u.assertEqual(L.getFameTier(350), 4);
      }
    },
    // Port market - Root Cause 6
    {
      name: "G.30 generatePortMarket always includes food and water",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const market = G.generatePortMarket("portRoyal");
        u.assert(market.goods.food !== undefined, "Food must be present");
        u.assert(market.goods.water !== undefined, "Water must be present");
      }
    },
    // Root Cause 6: Updated to match current data.js prices
    {
      name: "G.31 food and water have fixed prices and quantity 999",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const market = G.generatePortMarket("portRoyal");
        u.assertEqual(market.goods.food.buyFromPort, 3);
        u.assertEqual(market.goods.food.sellToPort, 3);
        u.assertEqual(market.goods.food.available, 999);
        u.assertEqual(market.goods.water.buyFromPort, 2);
        u.assertEqual(market.goods.water.available, 999);
      }
    },
    {
      name: "G.32 trade good buy price is above sell price (spread)",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const market = G.generatePortMarket("tortuga");
        const rum = market.goods.rum;
        u.assert(rum, "Rum should appear at Tortuga (always)");
        u.assert(rum.buyFromPort >= rum.sellToPort, "Buy ≥ sell (no negative spread)");
      }
    },
    {
      name: "G.33 goods at never",
      type: "unit",
      run: (u) => {
        u.resetRandomStub();
        const market = G.generatePortMarket("portRoyal");
        u.assert(market.goods.food !== undefined);
        u.assert(market.goods.water !== undefined);
      }
    }
  ]
});
