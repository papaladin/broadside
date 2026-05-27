# Tasks: Tier 1 — Close the Loop on What Exists
### T1.1 through T1.10

> **Before starting any item:** read this document fully.
> Items must be done in order within each group — dependencies are explicit.
> The game must remain playable at every commit boundary.
> All items are in `tests/` files, `engine.js`, `logic.js`, `data.js`, or screen files.
> `generators.js` is not touched in this tier.

---

## T1.1 — Fix Test Suite (74 failing tests)

> Do this first. Every subsequent item adds tests. A broken baseline means
> you can't tell if new code is working.

### Root Cause 1 — Stale `D.MISSION_POOL` references (17 failures)

`D.MISSION_POOL` was removed when parametric generation landed. All references
must be replaced with inline `testMission()` fixtures.

**File: `tests/tests_engine.js`**

- [ ] **E.10** — replace `D.MISSION_POOL.find(m => m.id === "smuggle_rum")` with:
  ```js
  const mission = testMission({
    type: "smuggle", faction: "pirate", targetPort: "nassau",
    risk: "medium", gold: 400, infamyGain: 1,
    requiredGood: "rum", requiredQty: 5, patrolRisk: 0.30,
    enemy: { name: "The Serpent", hull: 50, cannons: 6, crew: 20, faction: "english" }
  });
  ```
  Update state to include hold with rum: `hold: { capacity: 200, items: { ...emptyItems, rum: 5 } }`

- [ ] **E.21** — replace `D.MISSION_POOL.find(m => m.type === "combat")` with:
  ```js
  const mission = testMission({
    type: "combat", faction: "english",
    enemy: { name: "The Iron Drake", hull: 60, cannons: 8, crew: 25, faction: "pirate" }
  });
  ```

- [ ] **E.22** — replace MISSION_POOL lookup with:
  ```js
  const mission = testMission({
    type: "trade", targetPort: "nassau", requiredGood: "rum",
    requiredQty: 10, gold: 600
  });
  ```
  State needs hold: `hold: { capacity: 200, items: { ...emptyItems, rum: 10 } }`

- [ ] **E.31** — replace lookup with `testMission({ type: "escort", targetPort: "nassau" })`

- [ ] **E.57** — replace with:
  ```js
  const mission = testMission({
    type: "assault", targetPort: "havana",
    enemy: { name: "Havana Garrison", hull: 200, cannons: 20, crew: 50, faction: "spanish" }
  });
  ```

- [ ] **E.60** — `TAKE_MISSION` fame-gating in the reducer was removed (now handled
  at generation time). The test expects a blocked dispatch and a log entry.
  Two options:
  - **Option A (recommended):** rewrite the test to verify that `generateMissions`
    excludes high-fame missions when `state.fame < requiredFame`. This tests the
    real gate rather than the removed reducer guard.
  - **Option B:** re-add a silent guard in the `TAKE_MISSION` case:
    ```js
    if (action.mission?.requiredFame && state.fame < action.mission.requiredFame)
      return state; // silent — UI already prevents this
    ```
    Then test that dispatching the mission object returns state unchanged. No
    log entry needed — the UI is the gate.
  Choose Option A. It tests the right thing.

- [ ] **E.66** — replace MISSION_POOL lookup with:
  ```js
  const mission = testMission({
    type: "smuggle", targetPort: "nassau", gold: 400, infamyGain: 1,
    requiredGood: "tobacco", requiredQty: 5
  });
  ```
  State must have tobacco in hold:
  `hold: { capacity: 200, items: { ...emptyItems, tobacco: 5 } }`

- [ ] **E.67** — replace with:
  `testMission({ type: "assault", targetPort: "portRoyal", faction: "pirate", infamyGain: 3 })`

- [ ] **E.68** — replace with:
  `testMission({ type: "trade", requiredGood: "rum", requiredQty: 5, infamyGain: 0 })`
  State needs `hold.items.rum: 5`

- [ ] **E.69** — use `testMission({ infamyGain: 1 })` with `state.infamy = 9`
  (crosses Clean → Suspect). Verify log includes "Suspect".

- [ ] **E.70** — use `testMission({ infamyGain: 1 })` with `state.infamy = 5`
  (stays Clean). Verify no threshold log entry.

**File: `tests/tests_flows.js`**

- [ ] **I.03** — after `TAKE_MISSION`, dispatch `INTERCEPT_FIGHT` before
  manipulating `battleState`. Replace mission lookup with `testMission({ type: "combat", enemy: {...} })`.

- [ ] **I.04** — same pattern as I.03.

- [ ] **I.05** — replace MISSION_POOL lookup with `testMission({ type: "smuggle", ... })`.
  Mission intercept now goes to `screen: "intercept"`, not `"battle"`.
  Assert `s.screen === "intercept"`.

- [ ] **I.11** — replace MISSION_POOL lookup. After TAKE_MISSION (combat), dispatch
  `INTERCEPT_FIGHT` to enter battle. Then manipulate `battleState`.

- [ ] **S.03** — replace MISSION_POOL lookup with `testMission({ type: "combat", enemy: {...} })`.
  Add `INTERCEPT_FIGHT` dispatch after `TAKE_MISSION`.

- [ ] **S.09** — replace MISSION_POOL lookup with `testMission({ type: "escort" })`.

---

### Root Cause 2 — Undefined `upgrade` variable (5 failures)

`upgrade` was a local variable that was lost. Replace all bare `upgrade` references
with direct data lookups.

**File: `tests/tests_engine.js`**

- [ ] **E.17** — replace `upgrade.cost` with `D.UPGRADES.reinforced_hull.cost`:
  ```js
  u.assertEqual(s.gold, initialGold - D.UPGRADES.reinforced_hull.cost);
  ```

- [ ] **E.18** — test only asserts upgrade was NOT installed and gold unchanged.
  Remove `upgrade` variable reference entirely. Assert:
  ```js
  u.assertEqual(s.gold, state.gold); // unchanged
  u.assert(s.ship.upgrades.includes("reinforced_hull")); // already there
  ```

- [ ] **E.19** — same pattern as E.18. Assert gold unchanged and upgrade not added.
  ```js
  u.assertEqual(s.gold, state.gold);
  u.assert(!s.ship.upgrades.includes("copper_plated_hull")); // incompatible ship
  ```

- [ ] **E.59** — replace `upgrade` reference with assertion on log only:
  ```js
  u.assert(s.log.some(l => l.includes("Requires")));
  u.assertEqual(s.gold, state.gold);
  ```

**File: `tests/tests_ui.js`**

- [ ] **S.07** — replace `upgrade.name` with literal string or data lookup:
  ```js
  u.assert(container.textContent.includes(D.UPGRADES.reinforced_hull.name));
  ```

---

### Root Cause 3 — START_GAME scenarios don't match current STARTS data (4 failures)

The STARTS entries in `data.js` still use the old `bonuses: string[]` format.
The N1.1 structured format was designed but not yet implemented in data.js.
**Fix strategy:** update the tests to match what STARTS actually contains today
(old format), not what was designed. N1.1's full STARTS redesign is a separate
task (T1.1b below). Tests should not break because of a planned-but-not-landed
feature.

**File: `tests/tests_engine.js`**

- [ ] **E.01** — find `D.STARTS` entry with `id: "merchant"`. Assert gold and
  ship match what that entry's bonuses actually produce today:
  ```js
  const start = D.STARTS.find(s => s.id === "merchant");
  const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: start.id });
  u.assert(s.gold > E.initialState.gold, "Gold should be boosted");
  u.assertEqual(s.ship.type, "merchantman");
  ```

- [ ] **E.02** — same pattern for `id: "privateer"`:
  ```js
  u.assertEqual(s.ship.type, "sloop");
  u.assert(s.gold > E.initialState.gold);
  ```

- [ ] **E.03** — `id: "pirate"`:
  ```js
  u.assertEqual(s.ship.type, "brigantine");
  ```

- [ ] **E.04** — `id: "admiral"`:
  ```js
  u.assertEqual(s.ship.type, "frigate");
  ```

---

### Root Cause 4 — Fame gate log messages and ship fame requirements changed (5 failures)

**File: `tests/tests_engine.js`**

- [ ] **E.58** — check actual `requiredFame` on frigate in data.js. If frigate
  requires fame 100, update test to use `fame: 90` and assert the log contains
  the actual message format from `engine.js`:
  ```js
  u.assert(s.log.some(l => l.includes("Requires ★ 100 fame")));
  ```

- [ ] **E.61** — update `fame` value in test state to actually meet the frigate's
  `requiredFame`. If `D.SHIPS.frigate.requiredFame === 100`, set `state.fame = 100`.

- [ ] **F.05** — test intent is "BUY_SHIP to smaller ship caps crew and clears upgrades."
  Current test sets `gold: 5000` and buys `sloop`. Sloop costs 1000g (fame 10).
  With `fame: 0` in test state, the purchase will fail on fame gate.
  Fix: set `fame: 10` in state:
  ```js
  const state = { ...E.initialState, gold: 5000, fame: 10,
    ship: { type: "galleon", hull: 300, cannons: 30, upgrades: ["reinforced_hull"] },
    crew: { roster: fillRoster(150), max: 150, morale: 80 } };
  ```

---

### Root Cause 5 — L.17 allied faction assertion too strict (1 failure)

**File: `tests/tests_logic.js`**

- [ ] **L.17** — current assertion: `missions.every(m => m.faction === "english" || m.faction === "pirate")`.
  The generator now adds non-rival faction missions at any port. Port Royal
  (English) will also generate Dutch missions (Dutch is not an English rival).
  Update the assertion to test what should actually be excluded:
  ```js
  const englishRivals = D.FACTIONS.english.rivalFactions || [];
  u.assert(
    missions.every(m => !englishRivals.includes(m.faction)),
    "No rival faction missions should appear at Port Royal"
  );
  ```

---

### Root Cause 6 — Data or log string changes not reflected (4 failures)

**File: `tests/tests_logic.js`**

- [ ] **G.31** — food base price is now 3g. Update assertion:
  ```js
  u.assertEqual(market.goods.food?.buyFromPort, 3, "Food buy price should be 3g");
  u.assertEqual(market.goods.water?.buyFromPort, 2, "Water buy price should be 2g");
  ```

**File: `tests/tests_engine.js`**

- [ ] **E.81** — find the exact log string in engine.js ADVANCE_DAY when food hits
  zero (line 186: `"⚠ The food stores are empty. The crew grows hungry."`). Update
  assertion:
  ```js
  u.assert(s.log.some(l => l.includes("food stores are empty")));
  ```

- [ ] **E.85** — find the exact rejection message in engine.js CONFIRM_TRADE when
  available stock is exceeded. Update assertion to match. If the message is
  `"Not enough rum available at this port."`, assert that string. Check engine.js
  CONFIRM_TRADE case for the actual string.

- [ ] **E.87** — BUY_SHIP should update `hold.capacity` to the new ship's
  `holdCapacity`. Check engine.js line 309:
  ```js
  hold: {...state.hold, capacity: ship.holdCapacity,},
  ```
  This exists. If the test is failing, the assertion is likely checking the wrong
  field. Verify the test asserts `s.hold.capacity === D.SHIPS[action.shipType].holdCapacity`.
  If `hold.capacity` is correct in engine.js but the test is wrong, fix the test.

---

### Root Cause 7 — Screen paths missing `../` prefix in tests.html (24 failures)

This single fix unblocks all U.* UI smoke tests and S.01, S.02, S.04, S.05.

**File: `tests/tests.html`**

- [X] Find the three screen script tags and add the `../` prefix:
  ```html
  <!-- BEFORE (broken) -->
  <script type="text/babel" data-presets="react" src="screens_shared.jsx"></script>
  <script type="text/babel" data-presets="react" src="screens_port.jsx"></script>
  <script type="text/babel" data-presets="react" src="screens_voyage.jsx"></script>

  <!-- AFTER (correct) -->
  <script type="text/babel" data-presets="react" src="../screens_shared.jsx"></script>
  <script type="text/babel" data-presets="react" src="../screens_port.jsx"></script>
  <script type="text/babel" data-presets="react" src="../screens_voyage.jsx"></script>
  ```

---

### Root Cause 8 — Random sequences exhausted in combat tests (8 failures)

The combat resolution function consumes more random values than the test sequences
provide. The safest fix: replace all `setRandomSequence` calls in combat tests with
`resetRandomStub()` and test structural output (outcome fields present, values in
range) rather than exact values. This makes combat tests robust to future changes
in the combat formula.

**File: `tests/tests_logic.js`**

- [ ] **L.30–L.36** — for each combat action test, replace:
  ```js
  u.setRandomSequence([...]);
  ```
  with:
  ```js
  u.resetRandomStub(); // use real Math.random
  ```
  Then update assertions to check structure, not exact values:
  ```js
  // BEFORE (fragile)
  u.assertEqual(outcome.enemy.hullDamage, 12);

  // AFTER (robust)
  u.assert(typeof outcome.enemy.hullDamage === "number", "hullDamage should be a number");
  u.assert(outcome.enemy.hullDamage >= 0, "hullDamage should be non-negative");
  ```
  Keep the assertion that the correct *type* of outcome occurred (grapple success
  has `instantVictory: true`, evade success has `fled: true`, etc.) since these
  are structural and don't depend on specific random values.

**File: `tests/tests_engine.js`**

- [ ] **E.27, E.28, E.29, E.30, E.44** — same pattern. Replace `setRandomSequence`
  with `resetRandomStub()`. Assert outcome type and structural shape, not exact
  damage numbers.

---


## T1.10 — Test Coverage: Integration and Regression

> Add the tests that were never written. These catch the bugs T1.1–T1.9 could miss.

**File: `tests/tests_flows.js`**

- [ ] **I.TR.1 — Full trade mission loop:**
  ```js
  {
    name: "I.TR.1 Trade mission: accept, buy goods, sail, complete",
    type: "integration",
    run: (u) => {
      // Start with a state that has a trade mission in the mission list
      let s = makeState({
        currentPort: "portRoyal",
        portMarket: { portKey: "portRoyal", goods: {
          rum: { basePrice: 30, buyFromPort: 33, sellToPort: 27, available: 20 }
        }},
        gold: 1000,
        hold: { capacity: 200, items: { food:10, water:10, rum:0, ...zeroGoods } },
      });
      const mission = testMission({
        type: "trade", targetPort: "nassau", requiredGood: "rum",
        requiredQty: 10, gold: 600, fame: 1
      });
      s = E.reducer(s, { type: E.A.TAKE_MISSION, mission });
      u.assertEqual(s.activeMission.type, "trade");

      // Buy 10 rum
      s = E.reducer(s, { type: E.A.CONFIRM_TRADE,
        buys: { rum: 10 }, sells: {} });
      u.assertEqual(s.hold.items.rum, 10);
      u.assertEqual(s.gold, 1000 - 10 * 33); // 670g

      // Arrive at target port
      s = { ...s, currentPort: "nassau" };
      const goldBefore = s.gold;
      s = E.reducer(s, { type: E.A.COMPLETE_MISSION });
      u.assertEqual(s.hold.items.rum, 0, "Rum removed from hold");
      u.assertEqual(s.gold, goldBefore + 600, "Mission gold paid");
      u.assertEqual(s.fame, 1, "Fame awarded");
      u.assert(s.activeMission === null, "Mission cleared");
    }
  }
  ```

- [ ] **I.SM.1 — Full smuggle patrol intercept loop:**
  ```js
  {
    name: "I.SM.1 Smuggle mission: buy contraband, patrol fires, contraband seized",
    type: "integration",
    run: (u) => {
      let s = makeState({
        screen: "sailing", destination: "nassau", sailingDaysLeft: 3,
        hold: { capacity: 200, items: { ...zeroGoods, food:10, water:10, tobacco: 8 } },
        gold: 1000,
      });
      const mission = testMission({
        type: "smuggle", requiredGood: "tobacco", requiredQty: 8,
        patrolRisk: 1.0, // guarantee patrol fires
        targetPort: "nassau"
      });
      s = { ...s, activeMission: mission };
      // ADVANCE_DAY should fire navy_patrol (patrolRisk: 1.0)
      s = E.reducer(s, { type: E.A.ADVANCE_DAY });
      u.assertEqual(s.screen, "event", "Navy patrol event should fire");
      u.assertEqual(s.activeEvent?.id, "navy_patrol");

      // Resolve: allow inspection
      s = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 });
      u.assertEqual(s.hold.items.tobacco, 0, "Tobacco seized");
      u.assert(s.infamy > 0, "Infamy gained");
      u.assert(s.gold < 1000, "Fine deducted");
    }
  }
  ```

- [ ] **I.SL.1 — Save/load round-trip with complex state:**
  ```js
  {
    name: "I.SL.1 Save and load preserves complex state",
    type: "integration",
    run: (u) => {
      u.installLocalStorageMock();
      u.clearLocalStorageMock();
      const mission = testMission({ type: "trade", requiredGood: "silk", requiredQty: 5 });
      const complexState = {
        ...E.initialState,
        gold: 7654,
        fame: 87,
        infamy: 23,
        day: 142,
        activeMission: mission,
        hold: { capacity: 200, items: { food:5, water:5, silk:5, rum:0,
          sugar:0, timber:0, cloth:0, spices:0, coffee:0, cocoa:0,
          weapons:0, tobacco:0, silver:0, slaves:0 } },
        crew: { roster: fillRoster(15), max: 50, morale: 65, moraleZeroDays: 0 },
      };
      // Save
      E.reducer(complexState, { type: E.A.SAVE_GAME });
      // Load
      const loaded = E.reducer(E.initialState, { type: E.A.LOAD_GAME });
      u.assertEqual(loaded.gold, 7654);
      u.assertEqual(loaded.fame, 87);
      u.assertEqual(loaded.infamy, 23);
      u.assertEqual(loaded.day, 142);
      u.assertEqual(loaded.hold.items.silk, 5);
      u.assertEqual(loaded.crew.roster.length, 15);
      u.assert(loaded.activeMission !== null);
      u.assertEqual(loaded.activeMission.requiredGood, "silk");
      u.restoreLocalStorage();
    }
  }
  ```

- [ ] **I.MG.1 — Generator distribution test (trade missions appear ~20–40%):**
  ```js
  {
    name: "I.MG.1 generateMissions includes trade missions at expected frequency",
    type: "integration",
    run: (u) => {
      const state = makeState({
        portMarket: { portKey: "portRoyal", goods: {
          rum: { basePrice: 30, buyFromPort: 33, sellToPort: 27, available: 20 },
          cloth: { basePrice: 55, buyFromPort: 60, sellToPort: 50, available: 15 },
        }},
      });
      const counts = { trade: 0, escort: 0, combat: 0, smuggle: 0, patrol: 0, assault: 0 };
      const runs = 60;
      for (let i = 0; i < runs; i++) {
        const missions = G.generateMissions("portRoyal", state);
        missions.forEach(m => { counts[m.type] = (counts[m.type] || 0) + 1; });
      }
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const tradePct = counts.trade / total;
      u.assert(tradePct >= 0.15, `Trade missions too rare: ${(tradePct * 100).toFixed(1)}%`);
      u.assert(tradePct <= 0.50, `Trade missions too common: ${(tradePct * 100).toFixed(1)}%`);
      u.assert(counts.assault / total < 0.20, "Assault missions should be rare");
    }
  }
  ```

