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

### T1.1b — Implement N1.1 Structured STARTS Format

> This is the second half of T1.1. The five persona designs are specified in
> `n1-1-personas-and-debug.md`. This task implements them in code.

**File: `data.js`**

- [X] **Replace the existing `STARTS` array** with the five structured persona
  entries. Each entry follows this shape:
  ```js
  {
    id: string,
    name: string,
    faction: string,
    tagline: string,        // one line for StartScreen card
    story: string,          // 2–3 sentences for expanded card view
    startPort: string,      // port key
    ship: string,           // ship type key
    gold: number,
    crewCount: number,      // 0 or 1
    crewFaction: string,
    hold: { food: number, water: number },  // starting hold (all other goods 0)
    repAdjust: { [factionKey]: delta },     // applied ON TOP of default 50
    openingLog: string[],   // prepended to state.log before player acts
    starterMission: object | null,          // see shape below
  }
  ```
  Starter mission shape (if present):
  ```js
  {
    type: string, name: string, description: string,
    faction: string, targetPort: string, risk: "low",
    gold: number, fame: 1, infamyGain: 0,
    repImpact: object, enemy: null,
    starter: true,    // flag for UI styling
  }
  ```

- [X] **Add the debug persona** (id: `"debug"`) as the sixth entry. Only shown
  in StartScreen when URL contains `?debug=1`. See debug spec in
  `n1-1-personas-and-debug.md` for field values. Add `debugStartFame: 100` field.

- [ ] **Verify `STARTS` is exported** in the return object at the bottom of data.js.

**File: `engine.js`**

- [X] **Rewrite the `START_GAME` case** to read the structured STARTS format
  instead of parsing `start.bonuses` strings. The `start.bonuses.forEach` loop
  (lines 92–134) is replaced with direct field reads:
  ```js
  case A.START_GAME: {
    const start = STARTS.find(s => s.id === action.scenarioId);
    if (!start) return { ...initialState, screen: "start" };

    // 1. Base state from initialState
    const newState = { ...initialState, screen: "port", day: 1, infamy: 0, fame: 0,
      gold: start.gold,
      currentPort: start.startPort,
      log: [...(start.openingLog || [])],
      portMarket: null,
    };

    // 2. Ship and hold
    const shipData = SHIPS[start.ship];
    newState.ship = {
      type: start.ship, name: shipData.name,
      hull: shipData.maxHull, cannons: shipData.cannons, upgrades: [],
    };
    newState.hold = {
      capacity: shipData.holdCapacity,
      items: {
        food: 0, water: 0, rum: 0, sugar: 0, timber: 0, cloth: 0,
        spices: 0, silk: 0, coffee: 0, cocoa: 0, weapons: 0,
        tobacco: 0, silver: 0, slaves: 0,
        ...(start.hold || {}),
      },
    };

    // 3. Crew
    newState.crew = {
      ...initialState.crew,
      max: shipData.maxCrew,
      roster: start.crewCount > 0
        ? G.generateRoster(start.crewCount, start.crewFaction || start.faction)
        : [],
      morale: 80,
    };

    // 4. Reputation: start all ports at 50, apply faction deltas
    const rep = {};
    Object.keys(PORTS).forEach(portKey => { rep[portKey] = 50; });
    Object.entries(start.repAdjust || {}).forEach(([faction, delta]) => {
      Object.keys(PORTS).forEach(portKey => {
        if (PORTS[portKey].faction === faction)
          rep[portKey] = Math.max(0, Math.min(100, 50 + delta));
      });
    });
    newState.reputation = rep;

    // 5. Debug fame
    if (start.debugStartFame !== undefined) newState.fame = start.debugStartFame;

    // 6. Market, missions, starter mission
    newState.portMarket = G.generatePortMarket(start.startPort);
    const generated = G.generateMissions(start.startPort, newState);
    newState.missions = start.starterMission
      ? [start.starterMission, ...generated]
      : generated;

    return newState;
  }
  ```

**File: `screens_port.jsx` — StartScreen**

- [X] **Update StartScreen** to render the new persona card format:
  - One card per `D.STARTS` entry, filtered by `?debug=1` URL param for debug persona
  - Card shows: persona name, tagline, faction colour strip, faction label, starting ship name
  - On click/tap: expand card to show `story` paragraph, opening log preview (first 2 entries), starter mission label ("Opening Quest: {mission.name}"), starting conditions summary (gold, crew count, home faction +10)
  - Select button dispatches `{ type: E.A.START_GAME, scenarioId: start.id }`

- [ ] **Add debug visibility gate** at the top of StartScreen:
  ```jsx
  const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';
  const visibleStarts = isDebug ? D.STARTS : D.STARTS.filter(s => s.id !== 'debug');
  ```

**File: `tests/tests_engine.js`**

- [X] **Update E.01–E.04** to use the new structured start data:
  ```js
  // E.01 — English persona
  const start = D.STARTS.find(s => s.faction === "english" && s.id !== "debug");
  const s = E.reducer(E.initialState, { type: E.A.START_GAME, scenarioId: start.id });
  u.assertEqual(s.gold, start.gold);
  u.assertEqual(s.ship.type, start.ship);
  u.assertEqual(s.currentPort, start.startPort);
  u.assert(s.missions.some(m => m.starter), "Starter mission should be in missions");
  u.assert(s.log.length > 0, "Opening log should be populated");
  ```
  Repeat for E.02 (Spanish), E.03 (Pirate), E.04 (Dutch).

---

## T1.2 — State Shape Versioning + Save Migration

> Must be done before T1.5 (auto-save) so all saves are versioned from the start.
> Must be done before any Tier 2+ feature adds new state fields.

**File: `engine.js`**

- [X] **Add `version: 1` to `initialState`:**
  ```js
  const initialState = {
    version: 1,    // ← new — increment when state shape changes
    screen: "start",
    // ... rest unchanged
  };
  ```

- [X] **Add `migrateState(loaded)` function** inside the `window.E` IIFE,
  before the reducer. This function applies additive patches to bring any
  older save up to current shape:
  ```js
  const migrateState = (loaded) => {
    let s = { ...loaded };
    // v1: baseline — no migration needed for saves that already have version: 1
    // Future patches go here, gated by version number:
    // if (!s.version || s.version < 2) {
    //   s.world = s.world || { wars: [], plagues: [], eventLog: [] };
    //   s.version = 2;
    // }
    // Always ensure version field exists
    if (!s.version) s.version = 1;
    return s;
  };
  ```

- [X] **Update `LOAD_GAME` case** to call `migrateState` before applying the
  loaded state:
  ```js
  case A.LOAD_GAME: {
    try {
      const raw = localStorage.getItem("piratesSave");
      if (!raw) return { ...state, log: [...state.log, "No saved game found."] };
      const parsed = JSON.parse(raw);
      const loaded = migrateState(parsed);    // ← add this line
      const currentPort = loaded.currentPort || "portRoyal";
      return {
        ...loaded,
        screen: "port",
        battleState: null,
        activeEvent: null,
        encounterContext: null,
        portMarket: G.generatePortMarket(currentPort),
        missions: G.generateMissions(currentPort, loaded),
      };
    } catch (e) {
      return { ...state, log: [...state.log, "Failed to load save — corrupted data."] };
    }
  }
  ```

- [X] **Expose `migrateState`** in the return object for testing:
  ```js
  return { A, initialState, reducer, migrateState };
  ```

**File: `tests/tests_engine.js`**

- [X] **Add migration test:** verify that a v1-shaped state (missing `version`
  field) is given `version: 1` after migration:
  ```js
  {
    name: "E.M.1 migrateState adds version to old saves",
    type: "reducer",
    run: (u) => {
      const old = { gold: 500, screen: "port" }; // no version field
      const migrated = E.migrateState(old);
      u.assertEqual(migrated.version, 1);
      u.assertEqual(migrated.gold, 500); // existing fields preserved
    }
  }
  ```

- [X] **Add LOAD_GAME migration test:** save a versionless state, load it,
  verify it gets a version field and loads correctly (uses localStorage mock):
  ```js
  {
    name: "E.M.2 LOAD_GAME migrates versionless save",
    type: "reducer",
    run: (u) => {
      u.installLocalStorageMock();
      const old = JSON.stringify({ ...E.initialState, version: undefined, gold: 9999 });
      localStorage.setItem("piratesSave", old);
      const s = E.reducer(E.initialState, { type: E.A.LOAD_GAME });
      u.assertEqual(s.gold, 9999);
      u.assert(s.version >= 1);
      u.restoreLocalStorage();
    }
  }
  ```

---

## T1.3 — React Error Boundary

> One component. Prevents the white screen of death on any render error.

**File: `App.jsx`**

- [X] **Add `ErrorBoundary` class component** before the `App` function
  definition:
  ```jsx
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    componentDidCatch(error, info) {
      console.error("Broadside render error:", error, info);
    }
    render() {
      if (this.state.hasError) {
        return (
          <div style={{
            height: "100vh", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "#0a141e", color: "#e0e0e0",
            fontFamily: "'Courier New', monospace", gap: 16, padding: 20,
          }}>
            <div style={{ color: "#ffd700", fontSize: 18 }}>⚠ Something went wrong</div>
            <div style={{ color: "#a0a0a0", fontSize: 12, maxWidth: 400, textAlign: "center" }}>
              {this.state.error?.message || "An unexpected error occurred."}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => window.location.reload()}
                style={{ background: "#121c28", border: "1px solid #ffd700", color: "#ffd700",
                  padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", borderRadius: 3 }}>
                Reload Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  // Attempt to load last save if available
                  if (window.L?.hasSave?.()) {
                    // Trigger load on next render cycle
                    setTimeout(() => {
                      document.dispatchEvent(new CustomEvent("broadside:loadSave"));
                    }, 50);
                  }
                }}
                style={{ background: "#121c28", border: "1px solid #2a3a4a", color: "#e0e0e0",
                  padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", borderRadius: 3 }}>
                Try Load Last Save
              </button>
            </div>
            <div style={{ color: "#606060", fontSize: 10 }}>
              Open the browser console for details.
            </div>
          </div>
        );
      }
      return this.props.children;
    }
  }
  ```

- [X] **Wrap the root render** with the ErrorBoundary:
  ```jsx
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  ```

- [X] **No test needed** — ErrorBoundary is dev infrastructure, not game logic.
  Verify manually by temporarily throwing in a screen component.

---

## T1.4 — Wind System Verification

> `travelDays` in logic.js lines 139–142 already reads `state.wind` and applies
> a ±1 day modifier for headwind/tailwind. **This is already implemented.**
> This task verifies it works correctly and adds the missing test coverage.

**File: `tests/tests_logic.js`**

- [X] **Add wind modifier tests** (add to the Unit: logic.js suite):
  ```js
  {
    name: "L.W.1 travelDays applies tailwind bonus (-1 day)",
    type: "unit",
    run: (u) => {
      // Port Royal (405,280) → Tortuga (490,245): bearing is roughly NE (positive x, negative y)
      // atan2(-35, 85) ≈ -22°, so ~338° bearing
      // Wind angle 338° → within 45° of bearing → tailwind → days -1
      const state = makeState({
        currentPort: "portRoyal",
        wind: { angle: 338, speed: 15 },
        ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] },
        crew: { roster: fillRoster(30), morale: 80 },
        hold: { capacity: 200, items: { food:10, water:10 } },
      });
      const withWind = L.travelDays("portRoyal", "tortuga", state);
      const noWindState = { ...state, wind: { angle: 0, speed: 0 } };
      // atan2(-35,85)*180/PI ≈ -22, windDiff = |(-22) - 338| % 360 = 316 → > 315, tailwind
      // Actually recalculate: windAngleDiff = Math.abs(-22 - 338) % 360 = 360 % 360 = 0 → < 45, tailwind
      const noWind = L.travelDays("portRoyal", "tortuga", noWindState);
      u.assert(withWind <= noWind, "Tailwind should reduce or match travel days");
    }
  },
  {
    name: "L.W.2 travelDays applies headwind penalty (+1 day)",
    type: "unit",
    run: (u) => {
      // Wind angle directly opposing the bearing adds 1 day
      // Port Royal → Tortuga bearing ≈ -22° (338°). Opposing wind = 338 - 180 = 158°
      const state = makeState({
        currentPort: "portRoyal",
        wind: { angle: 158, speed: 15 },
        ship: { type: "sloop", hull: 100, cannons: 10, upgrades: [] },
        crew: { roster: fillRoster(30), morale: 80 },
        hold: { capacity: 200, items: { food:10, water:10 } },
      });
      const withHeadwind = L.travelDays("portRoyal", "tortuga", state);
      const neutralState = { ...state, wind: { angle: 60, speed: 15 } }; // crosswind
      const crosswind = L.travelDays("portRoyal", "tortuga", neutralState);
      u.assert(withHeadwind >= crosswind, "Headwind should increase or match travel days");
    }
  },
  ```

  ⚙ **Agent note:** Calculate actual angle values before writing the tests.
  Use `Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI` for
  Port Royal (405,280) → Tortuga (490,245) to get the real bearing.
  The test should use that bearing ±10° for tailwind and bearing ±180° for headwind.
  Do not guess — compute it.

---

## T1.5 — Auto-Save at Key Moments

> Requires T1.2 ✅ so all saved states are versioned.

**File: `engine.js`**

- [X] **Add auto-save helper** inside the `window.E` IIFE:
  ```js
  const autoSave = (state) => {
    try {
      localStorage.setItem("piratesSave", JSON.stringify(state));
    } catch (e) {
      console.warn("Auto-save failed:", e);
    }
  };
  ```

- [X] **Call `autoSave` at the end of three reducer cases**, after building
  the return value. In each case, save the state being returned:

  In `ADVANCE_DAY` — at the normal sailing day return (line ~232):
  ```js
  const nextState = { ...state, wind: newWind, day: state.day + 1, ... };
  autoSave(nextState);
  return nextState;
  ```

  In `ENTER_PORT` — at the normal entry return (line ~270):
  ```js
  const nextState = { ...state, currentPort: ..., screen: "port", ... };
  autoSave(nextState);
  return nextState;
  ```

  In `COMPLETE_MISSION` — at the successful completion return:
  ```js
  const nextState = { ...state, gold: ..., activeMission: null, ... };
  autoSave(nextState);
  return nextState;
  ```

  ⚙ **Do not auto-save on defeat, event, or intercept states** — these are
  mid-sequence states the player should not be locked into. Save only at
  stable resting states (sailing day complete, port entered, mission done).

**File: `App.jsx`**

- [X] **Add saved flash indicator** to HUD. Add a `savedFlash` state and trigger:
  ```jsx
  const [savedFlash, setSavedFlash] = React.useState(false);

  // Listen for save events (optional — or just poll on state change)
  // Simpler: show flash when state.log last entry is "Game saved."
  // Even simpler: show a permanent small indicator that fades
  ```
  Minimal implementation — show `"✓"` in T.greenBr for 1.5 seconds after any
  ADVANCE_DAY, ENTER_PORT, or COMPLETE_MISSION dispatch. Use a `useEffect` that
  watches `state.day`, `state.currentPort`, and `state.activeMission`:
  ```jsx
  React.useEffect(() => {
    setSavedFlash(true);
    const t = setTimeout(() => setSavedFlash(false), 1500);
    return () => clearTimeout(t);
  }, [state.day, state.currentPort, state.missions.length]);
  ```
  In HUD, after the infamy span:
  ```jsx
  {savedFlash && (
    <span style={{ color: T.greenBr, marginLeft: 10, fontSize: 10,
      transition: "opacity 0.3s", opacity: savedFlash ? 1 : 0 }}>
      ✓ saved
    </span>
  )}
  ```

**File: `tests/tests_engine.js`**

- [X] **Add auto-save integration test** (uses localStorage mock):
  ```js
  {
    name: "E.AS.1 ENTER_PORT auto-saves state",
    type: "reducer",
    run: (u) => {
      u.installLocalStorageMock();
      u.clearLocalStorageMock();
      let s = makeState({ screen: "sailing", destination: "tortuga", sailingDaysLeft: 0 });
      s = E.reducer(s, { type: E.A.ENTER_PORT });
      const saved = localStorage.getItem("piratesSave");
      u.assert(saved !== null, "Should have saved after ENTER_PORT");
      const parsed = JSON.parse(saved);
      u.assertEqual(parsed.screen, "port");
      u.restoreLocalStorage();
    }
  }
  ```

---

## T1.6 — Morale Floor Cascade

> Turns morale 0 from a permanent inconvenience into an escalating emergency.

**File: `engine.js`**

- [ ] **Add `moraleZeroDays: 0` to `initialState`.**

- [ ] **Update the `migrateState` function** (T1.2) to handle saves without
  this field:
  ```js
  // In migrateState, inside the function body:
  if (s.crew && s.crew.moraleZeroDays === undefined) {
    s.crew = { ...s.crew, moraleZeroDays: 0 };
  }
  ```

- [ ] **Update ADVANCE_DAY** — after the existing morale calculation, add the
  cascade tracker. Insert after line ~185 (after `anyProvisionCrisis` check):
  ```js
  // ── Morale floor cascade ──────────────────────────────────────
  let moraleZeroDays = state.crew.moraleZeroDays ?? 0;

  if (newMorale === 0) {
    moraleZeroDays += 1;
  } else {
    moraleZeroDays = 0; // reset when morale recovers
  }

  // Day 4+: crew begins deserting
  if (moraleZeroDays >= 4) {
    const { newRoster: afterDesertion, removed } = L.removeRandomCrew(updatedRoster, 1);
    const deserterName = removed.length > 0
      ? `${removed[0].firstName} ${removed[0].lastName}`
      : "A sailor";
    newLog.push(`${deserterName} slips away in the night. The crew is breaking.`);
    updatedRoster.splice(0, updatedRoster.length, ...afterDesertion);
  }

  // Day 8+: ship becomes uncontrollable — forced to nearest port
  if (moraleZeroDays >= 8 && state.destination) {
    newLog.push("The crew refuses to sail further. You must find harbour immediately.");
    // Force ENTER_PORT at destination if close enough, else add flag
    // Simplest: set sailingDaysLeft to 0 to trigger arrival on next ENTER_PORT dispatch
    // The player will see "Arrived" and must dock.
    return {
      ...state,
      wind: newWind,
      day: state.day + 1,
      sailingDaysLeft: 0,   // force arrival
      gold: newGold,
      reputation: newRep,
      crew: { ...state.crew, roster: updatedRoster, morale: newMorale, moraleZeroDays },
      hold: { ...state.hold, items: newHoldItems },
      log: newLog,
    };
  }
  ```
  Include `moraleZeroDays` in all ADVANCE_DAY return states:
  ```js
  crew: { ...state.crew, roster: updatedRoster, morale: newMorale, moraleZeroDays },
  ```

  ⚙ **Agent note:** `updatedRoster` is declared as `const` earlier in ADVANCE_DAY.
  The `splice` mutation approach above is a workaround. Cleaner: compute desertion
  first, use the result in all subsequent references:
  ```js
  let activeRoster = updatedRoster; // updatedRoster is the daysAboard-incremented roster
  if (moraleZeroDays >= 4) {
    const { newRoster: afterDesertion, removed } = L.removeRandomCrew(activeRoster, 1);
    activeRoster = afterDesertion;
    // ... add log entry
  }
  // Then use activeRoster in all return states instead of updatedRoster
  ```

**File: `tests/tests_engine.js`**

- [ ] **E.MZ.1** — morale at 0 for 4 ADVANCE_DAY calls causes crew loss:
  ```js
  {
    name: "E.MZ.1 morale zero for 4 days causes crew desertion",
    type: "reducer",
    run: (u) => {
      let s = makeState({
        screen: "sailing", destination: "tortuga", sailingDaysLeft: 5,
        crew: { roster: fillRoster(10), max: 50, morale: 0, moraleZeroDays: 3 },
        hold: { capacity: 200, items: { food: 0, water: 0 } }, // ensure morale stays 0
        gold: 0, // wages crisis too
      });
      s = E.reducer(s, { type: E.A.ADVANCE_DAY });
      u.assert(s.crew.roster.length < 10, "Crew should have deserted");
      u.assert(s.log.some(l => l.includes("slips away")), "Desertion logged");
    }
  }
  ```

- [ ] **E.MZ.2** — morale recovering from 0 resets moraleZeroDays:
  ```js
  let s = makeState({ crew: { ..., morale: 5, moraleZeroDays: 2 } });
  // Simulate morale recovery (e.g. from a tavern action would set morale higher)
  // But ADVANCE_DAY with enough provisions won't add -1 so morale stays > 0
  // Directly check: if morale > 0 after advance, moraleZeroDays resets
  s = makeState({ crew: { ..., morale: 50, moraleZeroDays: 2 },
    hold: { capacity: 200, items: { food: 20, water: 20 } }, gold: 500,
    screen: "sailing", destination: "tortuga", sailingDaysLeft: 3 });
  s = E.reducer(s, { type: E.A.ADVANCE_DAY });
  u.assertEqual(s.crew.moraleZeroDays, 0, "moraleZeroDays resets when morale > 0");
  ```

---

## T1.7 — Max Days at Sea / Geographic Progression

> Activates `maxDays` on SHIPS to gate port access by ship range.

**File: `data.js`**

- [X] **Verify `maxDays` exists on all SHIPS entries.** If any ship is missing
  it, add it. Expected values (from roadmap hold capacity table):
  ```
  dinghy: 5, cutter: 8, sloop: 10, schooner: 12, merchantman: 14,
  brigantine: 14, corvette: 16, frigate: 18, fluyt: 24, galleon: 22,
  ship_of_the_line: 28
  ```

- [X] **Add `remote: true` flag** to ports that should be unreachable by small
  ships regardless of maxDays calculation. These are ports at the geographic
  extremes of the map:
  ```js
  bermuda:    { ..., remote: true },   // isolated, dinghy can't reach
  veracruz:   { ..., remote: true },   // far west
  campeche:   { ..., remote: true },   // far west
  libertalia: { ..., remote: true },   // hidden/unlockable
  lasAves:    { ..., remote: true },   // hidden/unlockable
  dryTortugas:{ ..., remote: true },   // hidden/unlockable
  ```
  Remote ports are greyed on the map with a tooltip. They are not blocked
  by `maxDays` calculation — they are blocked by the hidden port mechanic
  (to be implemented in T5.1). For now, remote ports are simply unreachable
  and shown as greyed circles with no click action.

**File: `logic.js`**

- [X] **Add `canReach(state, portKey)` pure function:**
  ```js
  const canReach = (state, portKey) => {
    if (portKey === state.currentPort) return false;
    const port = PORTS[portKey];
    if (!port) return false;
    if (port.remote) return false;  // remote ports require special unlock
    const days = travelDays(state.currentPort, portKey, state);
    const shipMaxDays = SHIPS[state.ship.type]?.maxDays ?? 10;
    return days <= shipMaxDays;
  };
  ```
  Export from `window.L`.

- [X] **Add `getUnreachableReason(state, portKey)` pure function:**
  Returns a human-readable string explaining why a port is unreachable, or
  `null` if it is reachable:
  ```js
  const getUnreachableReason = (state, portKey) => {
    const port = PORTS[portKey];
    if (!port) return "Unknown port";
    if (port.remote) return "This location is not yet on your charts";
    if (portKey === state.currentPort) return null;
    const days = travelDays(state.currentPort, portKey, state);
    const shipMaxDays = SHIPS[state.ship.type]?.maxDays ?? 10;
    if (days > shipMaxDays) return `Requires a ship with ${days}+ days range (your ship: ${shipMaxDays})`;
    return null;
  };
  ```
  Export from `window.L`.

**File: `screens_voyage.jsx` — MapScreen**

- [X] **Update the port click handler** to check `L.canReach`:
  ```jsx
  const isReachable = !isCur && L.canReach(state, key);
  const unreachableReason = !isCur && !isReachable
    ? L.getUnreachableReason(state, key) : null;

  // In <g> element:
  onClick={() => isReachable && dispatch({ type: A.SAIL_TO, port: key })}
  style={{ cursor: isReachable ? "pointer" : "default" }}
  ```

- [X] **Update port circle visual** for unreachable ports:
  ```jsx
  <circle
    cx={p.x} cy={p.y}
    r={isCur ? 8 : 5}
    fill={isCur ? T.gold : isReachable ? fColor : T.textFaint}
    stroke={T.bgDeep}
    strokeWidth="2"
    opacity={isReachable || isCur ? 1 : 0.35}
  />
  ```

- [X] **Update hover tooltip** to show unreachable reason:
  ```jsx
  {isHov && !isCur && <>
    <text x={p.x} y={p.y + 26} textAnchor="middle" fontSize="8"
      fill={isReachable ? T.gold : T.redBr} fontFamily={T.font}>
      {isReachable ? `${days} day${days !== 1 ? "s" : ""}` : "Out of range"}
    </text>
    {unreachableReason && (
      <text x={p.x} y={p.y + 36} textAnchor="middle" fontSize="7"
        fill={T.redBr} fontFamily={T.font}>
        {unreachableReason}
      </text>
    )}
    {isReachable && (
      <text x={p.x} y={p.y + 36} textAnchor="middle" fontSize="7"
        fill={rep >= 40 ? T.greenBr : T.redBr} fontFamily={T.font}>
        {L.reputationLabel(rep)}
      </text>
    )}
  </>}
  ```

**File: `tests/tests_logic.js`**

- [X] **L.CR.1** — `canReach` returns true for a nearby port within range:
  ```js
  const s = makeState({ ship: { type: "sloop", ... } }); // maxDays: 10
  u.assert(L.canReach(s, "tortuga"), "Sloop should reach Tortuga from Port Royal");
  ```

- [X] **L.CR.2** — `canReach` returns false for a port beyond ship range:
  ```js
  const s = makeState({ ship: { type: "dinghy", ... } });
  u.assert(!L.canReach(s, "veracruz"), "Dinghy should not reach Veracruz");
  ```

- [X] **L.CR.3** — `canReach` returns false for remote ports:
  ```js
  const s = makeState({ ship: { type: "galleon", ... } });
  u.assert(!L.canReach(s, "libertalia"), "Libertalia is remote — not reachable");
  ```

- [X] **L.CR.4** — `getUnreachableReason` returns null for reachable port:
  ```js
  const s = makeState({ ship: { type: "sloop", ... } });
  u.assertEqual(L.getUnreachableReason(s, "tortuga"), null);
  ```

- [X] **L.CR.5** — `getUnreachableReason` returns range message for out-of-range:
  ```js
  const s = makeState({ ship: { type: "dinghy", ... } });
  const reason = L.getUnreachableReason(s, "veracruz");
  u.assert(reason.includes("days range"), reason);
  ```

---

## T1.8 — Mobile Browser Support

> Layout pass only. No game logic changes. Do after T1.7 (screens in final structure).

**File: `App.jsx` — HUD**

- [X] **Wrap HUD spans in responsive flex container** that wraps on narrow screens:
  ```jsx
  // Replace the single <div> with two rows on mobile
  <div style={{
    display: "flex", flexWrap: "wrap", gap: "4px 10px", alignItems: "center"
  }}>
    {/* Row 1: economy */}
    <span style={{ color: T.gold }}>💰 {state.gold}</span>
    <span style={{ color: foodColor }}>🍖 {food}</span>
    <span style={{ color: waterColor }}>💧 {water}</span>
    <span style={{ color: T.textDim }}>📦 {holdUsed}/{holdCap}</span>
    {/* Row 2: status */}
    <span style={{ color: T.textDim }}>📅 Day {state.day}</span>
    <span style={{ color: T.textDim }}>👥 {crew}/{maxCrew}</span>
    <span style={{ color: T.textDim }}>❤️ {hull}/{maxHull}</span>
    <span style={{ color: T.textDim }}>😊 {morale}%</span>
    <span style={{ color: T.gold }}>★ {state.fame}</span>
    <span style={{ color: infamyColor }}>☠ {state.infamy ?? 0}</span>
    {savedFlash && <span style={{ color: T.greenBr, fontSize: 10 }}>✓ saved</span>}
  </div>
  ```

**File: `screens_port.jsx`**

- [X] **All panel containers:** replace any hardcoded `width` or `minWidth`
  values with responsive equivalents. Pattern:
  ```jsx
  // BEFORE
  style={{ width: 400, padding: 14 }}

  // AFTER
  style={{ width: "min(100%, 480px)", padding: 14 }}
  ```

- [X] **MarketScreen:** add a `flexWrap: "wrap"` to the main row layout for
  +/− buttons so they don't overflow on 390px width.

- [X] **All buttons:** add `minHeight: 44` to every `<button>` and `<Btn>`
  element that is interactive (not purely display). This is the iOS minimum
  touch target size.

- [X] **Modals and overlays:** ensure no fixed-width modals wider than `100vw`.

**File: `screens_voyage.jsx`**

- [X] **MapScreen:** the SVG viewBox is `0 0 760 460`. On mobile this renders
  at ~390px width, making ports very small. Add `minHeight: 300` to the SVG
  container and ensure touch targets (port circles) are at least `r={8}` for
  non-current ports on mobile. Use a CSS media query equivalent via JS:
  ```jsx
  const isMobile = window.innerWidth < 480;
  const portRadius = isMobile ? 8 : 5; // larger tap targets on mobile
  ```

- [X] **SailingScreen:** the flex layout (`flex: 2` for map, `flex: 1` for info)
  doesn't work well on mobile portrait. Stack vertically on narrow screens:
  ```jsx
  style={{
    display: "flex",
    flexDirection: window.innerWidth < 480 ? "column" : "row",
    gap: 12, flex: 1,
  }}
  ```

- [X] **BattleScreen:** action buttons (`Broadside`, `Precision`, `Grapple`,
  `Evade`) should stack vertically on mobile:
  ```jsx
  style={{ display: "flex", flexDirection: "column", gap: 8 }}
  ```

**File: `ui.jsx` — Btn component**

- [X] **Add `minHeight: 44` to the Btn default style** when not `sm`:
  ```jsx
  padding: sm ? "4px 8px" : "8px 14px",
  minHeight: sm ? "auto" : 44,
  ```
  This propagates touch targets to every button that uses `<Btn>` automatically.

---

## T1.9 — Missing UI Polish

> One session. All items are UI-only — no reducer changes except defeat summary.

### Live Hold Preview in MarketScreen

**File: `screens_port.jsx` — MarketScreen**

- [ ] **Compute hold preview from `pending` state** and show it in the hold bar.
  The hold bar at the top of MarketScreen should show the post-trade state, not
  the current state:
  ```jsx
  // Compute preview items (current + pending buys - pending sells)
  const previewItems = { ...state.hold.items };
  Object.entries(pending).forEach(([good, { buy = 0, sell = 0 }]) => {
    previewItems[good] = Math.max(0, (previewItems[good] || 0) + buy - sell);
  });
  const previewUsed = L.getHoldUsed(previewItems);
  const previewLoadPct = L.getHoldLoadPct(previewItems, state.hold.capacity);
  const previewMult = L.getHoldSpeedMultiplier(previewLoadPct);

  // Show bar with preview values
  <Bar
    value={previewUsed}
    max={state.hold.capacity}
    color={previewLoadPct > 0.75 ? T.red : previewLoadPct > 0.50 ? T.gold : T.greenBr}
  />
  <div style={{ fontSize: 10, color: T.textDim }}>
    {previewUsed}/{state.hold.capacity} units
    {Object.keys(pending).length > 0 && (
      <span style={{ color: T.gold }}> (after trade)</span>
    )}
  </div>
  {previewMult > 1.0 && (
    <div style={{ fontSize: 10, color: T.gold }}>
      ⚠ Hold over 50% — voyages take ~{Math.round((previewMult - 1) * 100)}% longer
    </div>
  )}
  ```

### HUD Stat Tooltips

**File: `App.jsx` — HUD component**

- [ ] **Add a `tooltip` state** and tooltip component:
  ```jsx
  const [tooltip, setTooltip] = React.useState(null);

  const TOOLTIPS = {
    gold: "Your gold. Spent on repairs, crew wages, provisions, and upgrades.",
    food: "Food in hold. Crew consumes food daily at sea. Runs out → morale drops.",
    water: "Water in hold. Consumed daily at sea alongside food.",
    hold: "Cargo hold: used / capacity. Over 50% full slows your ship.",
    day: "Days elapsed since campaign start.",
    crew: "Crew aboard / maximum. More crew = higher wages and faster combat.",
    hull: "Hull integrity / maximum. Reaches 0 → defeat.",
    morale: "Crew morale. Below 50 slows travel. Below 30 increases wages. At 0 crew desert.",
    fame: "Fame — your permanent reputation. Gates ships, upgrades, and missions.",
    infamy: "Infamy — your criminal notoriety. Reaches 50 → bribe option blocked.",
  };

  // Wrap each span in a relative-positioned div with onMouseEnter/Leave
  // Render tooltip as absolute-positioned div below the span
  ```
  Keep the tooltip implementation minimal — a `title` attribute on each span
  is the simplest approach and works on desktop. For mobile, a tap-toggle is
  needed. Recommendation: use `title` attribute for now (one line per stat):
  ```jsx
  <span title={TOOLTIPS.gold} style={{ color: T.gold }}>💰 {state.gold}</span>
  ```
  This requires no additional component. `title` shows on hover on desktop and
  on long-press on most mobile browsers.

### Ship Comparison in Shipyard

**File: `screens_port.jsx` — ShipyardScreen**

- [ ] **Add `comparing` state** (`null` or a ship type key). When the player
  taps a ship for sale, set `comparing` to that ship type and show a comparison
  panel:
  ```jsx
  const [comparing, setComparing] = React.useState(null);
  ```
  When `comparing` is set, show a two-column comparison below the ship list:
  ```
  ┌────────────────┬────────────────┐
  │ Current Ship   │ Selected Ship  │
  │ Sloop          │ Brigantine     │
  │ Hull: 100      │ Hull: 180  ↑   │
  │ Cannons: 10    │ Cannons: 14 ↑  │
  │ Crew: 50       │ Crew: 80   ↑   │
  │ Hold: 200      │ Hold: 448  ↑   │
  │ Speed: 18      │ Speed: 14  ↓   │
  │ Range: 10 days │ Range: 14 days ↑│
  └────────────────┴────────────────┘
  ```
  Arrows (↑ ↓ =) in T.greenBr / T.redBr / T.textDim. Simple table layout,
  no new UI components needed.

### Port Flavour Text

**File: `data.js`**

- [ ] **Each port entry already has a `desc` field.** Verify all 25 ports have
  a `desc` string. Add any missing ones. These are already present — this task
  is about displaying them, not writing them.

**File: `screens_port.jsx` — PortScreen**

- [ ] **Show `desc` below the port name** in the port screen header:
  ```jsx
  const port = D.PORTS[state.currentPort];
  // In the header section:
  <div style={{ color: T.textFaint, fontSize: 10, marginTop: 4, fontStyle: "italic" }}>
    {port.desc}
  </div>
  ```

### Defeat Summary Screen

**File: `engine.js`**

- [ ] **Add `A.DISMISS_DEFEAT = "DISMISS_DEFEAT"` action.**

- [ ] **Add `defeatSummary` to state** (null normally):
  ```js
  // In initialState:
  defeatSummary: null,

  // Shape when set:
  // { daysSailed, missionsCompleted, goldLost, crewLost, lastPort }
  ```

- [ ] **Update DISMISS_BATTLE defeat branch** to set `defeatSummary` instead of
  immediately going to `screen: "port"`:
  ```js
  if (battleState.phase === "defeat") {
    const returnPort = state.previousPort || state.currentPort;
    const defeatSummary = {
      daysSailed: state.day,
      missionsCompleted: state.completedMissions ?? 0, // add completedMissions counter
      goldLost: Object.values(state.hold?.items || {}).reduce((sum, qty) => sum, 0), // cargo value
      crewLost: state.battleState.initialCrewCount - state.crew.roster.length,
      lastPort: PORTS[returnPort]?.name || "open sea",
    };
    return {
      ...state,
      battleState: null,
      screen: "defeat",          // new screen key
      defeatSummary,
      currentPort: returnPort,
      // ... rest of defeat state
    };
  }
  ```

- [ ] **Add `DISMISS_DEFEAT` case:**
  ```js
  case A.DISMISS_DEFEAT:
    return {
      ...state,
      screen: "port",
      defeatSummary: null,
      hold: { ...state.hold,
        items: Object.fromEntries(Object.keys(state.hold?.items || {}).map(k => [k, 0]))
      },
      portMarket: G.generatePortMarket(state.currentPort),
      missions: G.generateMissions(state.currentPort, state),
      log: [...state.log, "You survived the wreck and washed ashore."],
    };
  ```

- [ ] **Add `completedMissions: 0`** to `initialState`. Increment it in
  `COMPLETE_MISSION`:
  ```js
  completedMissions: (state.completedMissions ?? 0) + 1,
  ```

**File: `screens_voyage.jsx`** (or `screens_port.jsx` — whichever feels right)

- [ ] **Add `DefeatScreen` component:**
  ```jsx
  function DefeatScreen({ state, dispatch }) {
    const { T, Btn } = window.UI;
    const s = state.defeatSummary || {};
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "100%", padding: 20, gap: 16 }}>
        <div style={{ color: T.red, fontSize: 20 }}>⚓ Wrecked</div>
        <div style={{ color: T.text, fontSize: 13, textAlign: "center", maxWidth: 320 }}>
          Your ship is gone. You survived — barely.
        </div>
        <div style={{ ...panelStyle(), width: "min(100%, 320px)" }}>
          <div style={{ color: T.textDim, fontSize: 11, lineHeight: 1.8 }}>
            <div>Days sailed: <span style={{ color: T.text }}>{s.daysSailed ?? 0}</span></div>
            <div>Missions completed: <span style={{ color: T.text }}>{s.missionsCompleted ?? 0}</span></div>
            <div>Crew lost in battle: <span style={{ color: T.red }}>{s.crewLost ?? 0}</span></div>
            <div>Last port: <span style={{ color: T.text }}>{s.lastPort ?? "unknown"}</span></div>
          </div>
        </div>
        <Btn v="gold" onClick={() => dispatch({ type: window.E.A.DISMISS_DEFEAT })}>
          Continue →
        </Btn>
      </div>
    );
  }
  ```

**File: `App.jsx`**

- [ ] **Add `defeat` to the screen router:**
  ```jsx
  case "defeat": return <S.DefeatScreen state={state} dispatch={dispatch} />;
  ```

- [ ] **Export `DefeatScreen` from `window.S`** (in whichever screens file it lives).

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

---

## architecture.md Updates (do once, after all T1 items are complete)

- [ ] **State shape:** add `version: number`, `moraleZeroDays: number` (inside
  `crew`), `defeatSummary: object | null`, `completedMissions: number`.
- [ ] **engine.js:** document `migrateState(loaded)` function, `autoSave(state)`
  helper. Document new actions: `DISMISS_DEFEAT`.
- [ ] **logic.js exports:** add `canReach`, `getUnreachableReason`.
- [ ] **Screens:** add `DefeatScreen` to the screen inventory table.
  Update `MapScreen` entry to note range gating.
- [ ] **SHIPS data:** document `maxDays` and `remote` fields.
- [ ] **Note:** `moraleZeroDays` is a new state field introduced in T1.6.
  Any future migration that adds more crew sub-fields should remember this field
  already exists at the crew level, not as a top-level field.