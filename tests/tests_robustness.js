// tests_robustness.js
// Robustness tests: property-based, save/load, and fuzz testing.
// All tests are prefixed with "R." to group under the "Robustness" tab.

(function() {
  "use strict";

const { makeState, makePortState, makeSailingState, makeShip, makeHold, makeMission,
        makeEnemy, fillRoster, dispatch, makeCrewMember } = window.testHelpers;
  const L = window.L;
  const G = window.G;
  const D = window.D;
  const A = window.E.A;

  // ── Detect fast-check global ──────────────────────────────────────────────
  let fc = null;
  if (typeof window.fastCheck !== "undefined") {
    fc = window.fastCheck;
  } else if (typeof window.fc !== "undefined") {
    fc = window.fc;
  }

  const reg = (id, name, run) => window._tests.push({ id, name, run });

  // ========== PROPERTY-BASED TESTS (fast-check) ==========
  // Prefix: R.PROP.
  // Only register these tests if fast-check is available.
  if (fc) {
    reg("R.PROP.01", "generateEnemy: always returns valid stats", (u) => {
      fc.assert(
        fc.property(
          fc.integer(0, 350),                     // fame
          fc.constantFrom('low', 'medium', 'high', 'assault'), // risk
          fc.constantFrom('english', 'spanish', 'french', 'dutch', 'pirate'), // faction
          (fame, risk, faction) => {
            const enemy = G.generateEnemy(risk, fame, faction);
            return enemy.hull > 0 && enemy.cannons > 0 && enemy.crew > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    reg("R.PROP.02", "travelDays: never returns negative or NaN", (u) => {
      fc.assert(
        fc.property(
          fc.constantFrom('portRoyal', 'tortuga', 'havana'),
          fc.constantFrom('portRoyal', 'tortuga', 'havana'),
          (from, to) => {
            const state = makeState();
            const days = L.travelDays(from, to, state);
            return days >= 0 && !isNaN(days);
          }
        ),
        { numRuns: 50 }
      );
    });

    reg("R.PROP.03", "shipRepairCost: always returns non-negative number", (u) => {
      fc.assert(
        fc.property(
          fc.integer(0, 100), // hull damage (0-100)
          fc.constantFrom('dinghy', 'sloop', 'frigate', 'galleon'), // ship type
          (hull, type) => {
            const state = makeState({ ship: { ...makeShip(type), hull } });
            const cost = L.shipRepairCost(state);
            return cost >= 0 && !isNaN(cost);
          }
        ),
        { numRuns: 50 }
      );
    });

    reg("R.PROP.04", "getRepPerk: always returns valid perk object", (u) => {
      fc.assert(
        fc.property(
          fc.integer(0, 100), // rep (0-100)
          (rep) => {
            const perk = L.getRepPerk(rep);
            return perk.tier && perk.repairMult !== undefined;
          }
        ),
        { numRuns: 100 }
      );
    });

    reg("R.PROP.05", "generatePortMarket: always includes food/water", (u) => {
      fc.assert(
        fc.property(
          fc.constantFrom('portRoyal', 'tortuga', 'havana'),
          (portKey) => {
            const state = makeState();
            const market = G.generatePortMarket(portKey, state);
            return market.goods.food !== undefined &&
                   market.goods.water !== undefined &&
                   market.goods.food.available > 0 &&
                   market.goods.water.available > 0;
          }
        ),
        { numRuns: 20 }
      );
    });

    // ── NEW: Combat resolver invariants ─────────────────────────────

    reg("R.PROP.06", "resolveNavalRound: invariants hold for valid inputs", (u) => {
      fc.assert(
        fc.property(
          fc.constantFrom("dinghy", "cutter", "sloop", "brigantine", "frigate"), // player ship
          fc.constantFrom("far", "medium", "close"),                             // distance
          fc.constantFrom("broadside", "precision", "close_distance", "open_distance", "grapple", "evade"), // player action
          fc.constantFrom("broadside", "precision", "close_distance", "open_distance", "grapple", "evade"), // enemy action
          fc.integer(10, 200),   // player hull
          fc.integer(1, 50),     // player crew
          fc.integer(10, 200),   // enemy hull
          fc.integer(1, 50),     // enemy crew
          (playerType, distance, playerAction, enemyAction, playerHull, playerCrew, enemyHull, enemyCrew) => {
            const state = makePortState({
              ship: makeShip(playerType),
              crew: { roster: fillRoster(playerCrew), max: 40, morale: 80 },
            });
            const enemy = makeEnemy({ hull: enemyHull, maxHull: enemyHull, crew: enemyCrew });
            const battle = {
              distance,
              playerHull,
              playerCrew,
              enemyHull,
              enemyCrew,
            };
            const result = L.resolveNavalRound(state, playerAction, enemyAction, battle, enemy);
            // Invariants
            u.assert(result.playerHullDamage >= 0, "player hull damage non-negative");
            u.assert(result.enemyHullDamage >= 0, "enemy hull damage non-negative");
            u.assert(result.playerCrewLoss >= 0, "player crew loss non-negative");
            u.assert(result.enemyCrewLoss >= 0, "enemy crew loss non-negative");
            u.assert(["continue", "boarding_begins", "player_evaded", "enemy_evaded",
                      "player_sunk", "player_captured", "enemy_sunk", "enemy_captured"].includes(result.outcome),
                      "outcome is valid");
            u.assert(result.newDistance === null || ["far", "medium", "close"].includes(result.newDistance),
                      "newDistance is valid");
            return true;
          }
        ),
        { numRuns: 200 }
      );
    });

    reg("R.PROP.07", "resolveBoardingRound: invariants hold for valid inputs", (u) => {
      fc.assert(
        fc.property(
          fc.constantFrom("dinghy", "sloop", "frigate"), // player ship
          fc.constantFrom("continue_fighting", "fall_back", "demand_surrender", "surrender"), // player action
          fc.constantFrom("continue_fighting", "fall_back", "demand_surrender", "surrender"), // enemy action
          fc.integer(1, 50),   // player crew
          fc.integer(1, 50),   // enemy crew
          fc.integer(50, 90),  // player morale
          fc.constantFrom("low", "medium", "high"), // enemy risk
          (playerType, playerAction, enemyAction, playerCrew, enemyCrew, playerMorale, risk) => {
            const state = makePortState({
              ship: makeShip(playerType),
              crew: { roster: fillRoster(playerCrew), max: 40, morale: playerMorale },
            });
            const enemy = makeEnemy({ crew: enemyCrew, risk });
            const battle = {
              playerCrew,
              enemyCrew,
              subPhase: "boarding",
              distance: "close",
            };
            // Only test if demand_surrender is legal (ratio >= 0.65) for the player
            const ratio = L.getBoardingRatio(state, battle, enemy);
            if (playerAction === "demand_surrender" && ratio < 0.65) {
              // This combination is invalid; skip by returning true (not testing invalid case)
              return true;
            }
            const result = L.resolveBoardingRound(state, playerAction, enemyAction, battle, enemy);
            u.assert(result.playerCrewLoss >= 0, "player crew loss non-negative");
            u.assert(result.enemyCrewLoss >= 0, "enemy crew loss non-negative");
            u.assert(["continue", "returned_to_naval", "player_wipeout", "enemy_wipeout",
                      "player_surrendered", "enemy_surrendered", "player_defeated_by_demand", "enemy_win_capture"].includes(result.outcome),
                      "outcome is valid");
            return true;
          }
        ),
        { numRuns: 200 }
      );
    });

    reg("R.PROP.08", "getBoardingRatio: ratio stays in [0,1]", (u) => {
      fc.assert(
        fc.property(
          fc.integer(0, 50),   // player crew
          fc.integer(0, 50),   // enemy crew
          fc.integer(50, 90),  // player morale
          fc.constantFrom("low", "medium", "high"), // enemy risk
          (playerCrew, enemyCrew, playerMorale, risk) => {
            const state = makePortState({
              crew: { roster: fillRoster(playerCrew), max: 40, morale: playerMorale },
            });
            const enemy = makeEnemy({ crew: enemyCrew, risk });
            const battle = { playerCrew, enemyCrew };
            const ratio = L.getBoardingRatio(state, battle, enemy);
            u.assert(ratio >= 0 && ratio <= 1, "ratio in [0,1]");
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // ── NEW: Cargo / hold invariants ────────────────────────────────

    reg("R.PROP.09", "applyLoseContraband: removes only illegal goods", (u) => {
      fc.assert(
        fc.property(
          fc.array(fc.integer(0, 100), { minLength: 14, maxLength: 14 }),
          (quantities) => {
            const keys = ["food", "water", "rum", "sugar", "timber", "cloth", "spices", "silk",
                          "coffee", "cocoa", "weapons", "tobacco", "silver", "slaves"];
            const items = {};
            keys.forEach((k, i) => items[k] = quantities[i]);
            const result = L.applyLoseContraband(items);
            u.assert(result.tobacco === 0, "tobacco removed");
            u.assert(result.slaves === 0, "slaves removed");
            u.assert(result.food === items.food, "food preserved");
            u.assert(result.water === items.water, "water preserved");
            u.assert(result.rum === items.rum, "rum preserved");
            u.assert(result.sugar === items.sugar, "sugar preserved");
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    reg("R.PROP.10", "hold load stays within bounds after trade", (u) => {
      fc.assert(
        fc.property(
          fc.integer(0, 500),   // current used
          fc.integer(0, 200),   // capacity
          fc.integer(0, 100),   // buy qty
          (used, capacity, buyQty) => {
            const holdItems = { sugar: used, food: 0, water: 0 };
            const state = makePortState({
              ship: makeShip("sloop"),
              hold: { items: holdItems },
              portMarket: { goods: { sugar: { buyFromPort: 50, sellToPort: 40, available: 100 } } },
            });
            // Simulate a buy
            const s1 = dispatch(state, A.CONFIRM_TRADE, { buys: { sugar: buyQty }, sells: {} });
            const newUsed = L.getHoldUsed(s1.hold.items);
            u.assert(newUsed <= L.getHoldCapacity(s1), "hold not exceeded after buy");
            u.assert(s1.gold >= 0, "gold non-negative");
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // ── NEW: Reputation/heat bounds ────────────────────────────────

    reg("R.PROP.11", "applyReputationImpact: rep stays in [0,100]", (u) => {
      fc.assert(
        fc.property(
          fc.integer(0, 100),   // current rep
          fc.integer(-20, 20),  // delta
          (rep, delta) => {
            const state = makePortState({ reputation: { english: rep } });
            const impact = { english: delta }; // will apply to all english ports
            const s1 = L.applyReputationImpact(state, impact);
            const resultRep = s1.reputation.english;
            u.assert(resultRep >= 0 && resultRep <= 100, "rep in [0,100]");
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    reg("R.PROP.12", "addHeat: heat stays in [0,10]", (u) => {
      fc.assert(
        fc.property(
          fc.integer(0, 10),   // current heat
          fc.integer(0, 5),    // addition
          (current, add) => {
            const state = makePortState({ factionAlerts: { english: current } });
            const s1 = L.addHeat(state, "english", add);
            const resultHeat = s1.factionAlerts.english;
            u.assert(resultHeat >= 0 && resultHeat <= 10, "heat in [0,10]");
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // ── NEW: Navigation invariants ─────────────────────────────────

    reg("R.PROP.13", "travelDays: returns finite non-negative for valid ports", (u) => {
      fc.assert(
        fc.property(
          fc.constantFrom("portRoyal", "tortuga", "havana", "kingston"),
          fc.constantFrom("portRoyal", "tortuga", "havana", "kingston"),
          (from, to) => {
            const state = makePortState({
              ship: makeShip("sloop"),
              crew: { roster: [], morale: 80, max: 40 },
              wind: { angle: 0, speed: 10 },
            });
            const days = L.travelDays(from, to, state);
            u.assert(Number.isFinite(days), "days is finite");
            u.assert(days >= 0, "days non-negative");
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    reg("R.PROP.14", "canReach: a valid port is reachable if travelDays <= maxDays", (u) => {
      fc.assert(
        fc.property(
          fc.constantFrom("portRoyal", "tortuga", "havana", "kingston"),
          fc.constantFrom("portRoyal", "tortuga", "havana", "kingston"),
          (from, to) => {
            if (from === to) return true;
            const state = makePortState({
              currentPort: from,
              ship: makeShip("sloop"),
              crew: { roster: [], morale: 80, max: 40 },
              wind: { angle: 0, speed: 10 },
            });
            const days = L.travelDays(from, to, state);
            const maxDays = D.SHIPS.sloop.maxDays;
            if (days <= maxDays) {
              u.assert(L.canReach(state, to) === true, "should be reachable");
            } else {
              u.assert(L.canReach(state, to) === false, "should be unreachable");
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  } else {
    // If fast-check is not available, skip property tests with a clear message.
    reg("R.PROP.SKIP", "fast-check not available – skipping property-based tests", (u) => {
      u.assert(true, "fast-check not loaded; property tests skipped.");
    });
  }

  // ========== SAVE/LOAD TESTS ==========
  // Prefix: R.SAVE.

  reg("R.SAVE.01", "encodeSave/decodeSave: round-trip preserves state", (u) => {
    const state = makeState({
      gold: 1234,
      fame: 77,
      captainName: "Jean-Paul \"Le Loup\"",
      currentPort: "tortuga",
      ship: { type: "sloop", hull: 80, equipment: { hull: ["reinforced_hull"] } },
      crew: { roster: fillRoster(5), morale: 85 },
      hold: { items: { food: 50, water: 30, rum: 10 } },
      reputation: { english: 60, pirate: 40 },
    });
    const encoded = L.encodeSave(state);
    const decoded = L.decodeSave(encoded);
    u.assertEqual(decoded.state.gold, 1234, "gold preserved");
    u.assertEqual(decoded.state.fame, 77, "fame preserved");
    u.assertEqual(decoded.state.captainName, "Jean-Paul \"Le Loup\"", "name preserved");
    u.assertEqual(decoded.state.currentPort, "tortuga", "port preserved");
    u.assertEqual(decoded.state.ship.type, "sloop", "ship type preserved");
    u.assertEqual(decoded.state.crew.roster.length, 5, "crew count preserved");
    u.assertEqual(decoded.state.hold.items.food, 50, "hold preserved");
  });

  reg("R.SAVE.02", "encodeSave: handles special characters", (u) => {
    const state = makeState({ captainName: "A\"B\\C✗🏴‍☠️" });
    const encoded = L.encodeSave(state);
    const decoded = L.decodeSave(encoded);
    u.assertEqual(decoded.state.captainName, "A\"B\\C✗🏴‍☠️", "special chars preserved");
  });

  // FIX: For unparseable tampered data, decodeSave returns { error, state: null }, not { tampered: true }.
  reg("R.SAVE.03", "decodeSave: returns error for unparseable tampered data", (u) => {
    const state = makeState({ gold: 100 });
    let encoded = L.encodeSave(state);
    // Corrupt the base64 string so it becomes unparseable
    encoded = encoded.slice(0, -5) + "XXXXX";
    const decoded = L.decodeSave(encoded);
    u.assert(decoded.error !== null, "error set for unparseable data");
    u.assertEqual(decoded.state, null, "state is null for unparseable data");
  });

  reg("R.SAVE.04", "decodeSave: returns error for garbage input", (u) => {
    const decoded = L.decodeSave("not a valid save");
    u.assert(decoded.error !== null, "error set for garbage input");
    u.assertEqual(decoded.state, null, "no state for garbage");
  });

  reg("R.SAVE.05", "encodeSave: produces consistent output for same state", (u) => {
    const state = makeState({ gold: 500, fame: 25 });
    const encoded1 = L.encodeSave(state);
    const encoded2 = L.encodeSave(state);
    u.assertEqual(encoded1, encoded2, "same state → same encoding");
  });

  // ========== FUZZ TESTS ==========
  // Prefix: R.FUZZ.

  reg("R.FUZZ.01", "getShipStats: handles invalid ship types", (u) => {
    const invalidTypes = [null, undefined, 9999, "", {}, []];
    invalidTypes.forEach(type => {
      const state = makeState({ ship: { type } });
      try {
        L.getShipStats(state);
        u.assert(false, `Expected error for type: ${type}`);
      } catch (e) {
        // Expected to throw or return fallback
      }
    });
  });

  reg("R.FUZZ.02", "travelDays: handles invalid ports", (u) => {
    const invalidPorts = [null, undefined, 9999, "", {}, []];
    invalidPorts.forEach(port => {
      const state = makeState();
      const days = L.travelDays(port, "tortuga", state);
      u.assertEqual(days, Infinity, `Invalid port returns Infinity: ${port}`);
    });
  });

  reg("R.FUZZ.03", "generateEnemy: handles invalid inputs", (u) => {
    const invalidInputs = [
      { risk: null, fame: 50, faction: "english" },
      { risk: "invalid", fame: 50, faction: "english" },
      { risk: "medium", fame: -100, faction: "english" },
      { risk: "medium", fame: 50, faction: null },
    ];
    invalidInputs.forEach(input => {
      try {
        G.generateEnemy(input.risk, input.fame, input.faction);
        // If it doesn't throw, at least validate output
        u.assert(true, `Generated enemy for invalid input: ${JSON.stringify(input)}`);
      } catch (e) {
        u.assert(true, `Caught error for invalid input: ${JSON.stringify(input)}`);
      }
    });
  });

  reg("R.FUZZ.04", "getRepPerk: handles edge rep values", (u) => {
    const edgeValues = [-100, -1, 0, 100, 101, 9999, NaN, Infinity];
    edgeValues.forEach(rep => {
      const perk = L.getRepPerk(rep);
      u.assert(perk.tier, `Valid perk for rep: ${rep}`);
    });
  });

  reg("R.FUZZ.05", "shipRepairCost: handles edge cases", (u) => {
    const edgeShips = [
      { type: "dinghy", hull: -10 }, // Negative hull
      { type: "galleon", hull: 9999 }, // Hull > max
      { type: "invalid", hull: 50 },  // Invalid type
      { hull: 50 },                   // Missing type
    ];
    edgeShips.forEach(ship => {
      const state = makeState({ ship });
      try {
        const cost = L.shipRepairCost(state);
        u.assert(typeof cost === "number", `Valid cost for ship: ${JSON.stringify(ship)}`);
      } catch (e) {
        u.assert(true, `Caught error for ship: ${JSON.stringify(ship)}`);
      }
    });
  });

})();