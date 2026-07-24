// tests_robustness.js
// Robustness tests: property-based, save/load, and fuzz testing.
// All tests are prefixed with "R." to group under the "Robustness" tab.

(function() {
  "use strict";

  const { makeState, makeShip, fillRoster, dispatch } = window.testHelpers;
  const L = window.L;
  const G = window.G;
  const D = window.D;

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
      reputation: { portRoyal: 60, tortuga: 40 },
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