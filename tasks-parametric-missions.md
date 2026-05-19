# Tasks: Parametric Mission Generation
### P1.6

> Replaces the static MISSION_POOL in data.js with a runtime generator.
> Missions are fully described objects built at generation time — no ID, no
> lookup. TAKE_MISSION dispatches the whole object. The board always shows
> 2–3 missions; Refresh is free for now.
>
> This task list is written for an implementing agent. Sections marked
> ⚙ PARAMETER DISCUSSION require the agent to confirm values before coding.
> The enemy scaling matrix is already decided and included at the end.
>
> **This task includes the creation of a new file: `generators.js` (window.G).**
> All Math.random-using content generators live there, not in logic.js.
> Read Part 0 carefully before touching any other file.

---

## File Size Context (Why generators.js Exists)

Before this task, the codebase is:
- `data.js` ~1050 lines (280 of which is MISSION_POOL, deleted here)
- `logic.js` ~725 lines (pure deterministic game logic)

P1.6 adds ~165 lines of generator functions. Future phases (trade resources,
random events) will add ~200–250 more. Without a split, `logic.js` reaches
~1150 lines and continues growing.

The split is by **concern**, not just by size:
- `logic.js` → pure deterministic functions. Given the same inputs, always
  returns the same output. No `Math.random`. Fully unit-testable with stubs.
- `generators.js` → functions that use `Math.random` to produce runtime content.
  These are tested differently (range checks, not equality).

This boundary is permanent and intentional. If a future function uses
`Math.random`, it goes in `generators.js`. If it doesn't, it goes in `logic.js`.

---

## Part 0 — Create generators.js and Migrate Crew Generators

This part must be completed and verified before any other part begins.
Everything else in this task depends on `window.G` existing.

### 0.1 — Create `generators.js`

Create a new file `generators.js` in the project root (same directory as
`data.js`, `logic.js`, `engine.js`).

File structure:
```js
// ═══════════════════════════════════════════════════════════════════
//  generators.js — ALL RUNTIME CONTENT GENERATORS
//  Functions that use Math.random to produce game content at runtime.
//  No pure game logic here — that lives in logic.js.
//  Reads: window.D (data constants), window.L (pure logic helpers)
//  Exposed as: window.G
// ═══════════════════════════════════════════════════════════════════

window.G = (() => {

  // ── private helpers ────────────────────────────────────────────
  const randBetween = (min, max) => min + Math.random() * (max - min);
  const randInt = (min, max) => Math.floor(randBetween(min, max + 1));
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pickWeighted = (items, weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  };

  // ── crew generators (migrated from logic.js) ──────────────────
  // ... (see 0.2)

  // ── mission generators (new in P1.6) ──────────────────────────
  // ... (see Parts 2–9)

  // ── exports ───────────────────────────────────────────────────
  return {
    // crew (migrated)
    generateCrewMember,
    generateRoster,
    // missions (new)
    generateMissions,
    generateEnemy,
    generateEnemyName,
    generateMissionText,
    generateGold,
    generateRepImpact,
    pickTargetPort,
    opposingFaction,
  };

})();
```

### 0.2 — Migrate crew generators from `logic.js` to `generators.js`

- [ ] **Copy `generateCrewMember` and `generateRoster` from `logic.js` into
  `generators.js`** (into the crew generators section).
  Both use `Math.random` and belong here. Their implementation does not change.

- [ ] **Remove `generateCrewMember` and `generateRoster` from `logic.js`.**
  Also remove them from `window.L`'s return object at the bottom of `logic.js`.

- [ ] **Update `window.L` exports in `logic.js`:**
  Remove `generateCrewMember` and `generateRoster` from the returned object.
  `logic.js` no longer exports anything that uses `Math.random`.

### 0.3 — Update all call sites of the migrated crew generators

Every place that currently calls `L.generateCrewMember(...)` or
`L.generateRoster(...)` must be updated to `G.generateCrewMember(...)` /
`G.generateRoster(...)`.

Audit all files for these calls:

- [ ] **`engine.js`** — search for `L.generateRoster` and `L.generateCrewMember`.
  Expected locations: `START_GAME` case (roster creation), `HIRE_CREW` case
  (single member creation), `BUY_SHIP` case (roster resize).
  Change each to `G.generateRoster(...)` / `G.generateCrewMember(...)`.

- [ ] **`logic.js`** — search for any internal calls to `generateCrewMember`
  or `generateRoster` within logic.js itself (e.g. inside `generateMissions`
  if it ever generated crew). Update or remove.

- [ ] **`screens.jsx`** — search for `L.generateCrewMember` / `L.generateRoster`.
  Unlikely but audit anyway. Update any found.

- [ ] **`tests.js`** — search for `L.generateCrewMember` / `L.generateRoster`.
  Update all test references to `G.generateCrewMember` / `G.generateRoster`.
  These tests are in the Unit suite under L.50, L.51, L.52 — their test IDs
  should be renamed to G.01, G.02, G.03 to reflect the new module.

### 0.4 — Update `index.html` load order

`generators.js` must load **after** `logic.js` (it may call `window.L`
functions) and **before** `engine.js` (the reducer calls `window.G`).

```html
<!-- BEFORE (current order) -->
<script type="text/babel" data-presets="react" src="data.js"></script>
<script type="text/babel" data-presets="react" src="logic.js"></script>
<script type="text/babel" data-presets="react" src="engine.js"></script>
<script type="text/babel" data-presets="react" src="ui.jsx"></script>
<script type="text/babel" data-presets="react" src="screens.jsx"></script>
<script type="text/babel" data-presets="react" src="App.jsx"></script>

<!-- AFTER (add generators.js between logic and engine) -->
<script type="text/babel" data-presets="react" src="data.js"></script>
<script type="text/babel" data-presets="react" src="logic.js"></script>
<script type="text/babel" data-presets="react" src="generators.js"></script>  ← NEW
<script type="text/babel" data-presets="react" src="engine.js"></script>
<script type="text/babel" data-presets="react" src="ui.jsx"></script>
<script type="text/babel" data-presets="react" src="screens.jsx"></script>
<script type="text/babel" data-presets="react" src="App.jsx"></script>
```

### 0.5 — Update `tests.html` load order

`tests.html` loads game files independently. Add the same line in the same
position:

```html
<script type="text/babel" data-presets="react" src="../generators.js"></script>
```
Between `../logic.js` and `../engine.js`.

### 0.6 — Verify migration before proceeding

Before writing any mission generator code, load the game in the browser and
confirm:
- [ ] No console errors on startup.
- [ ] `window.G` is defined and has `generateCrewMember` and `generateRoster`.
- [ ] `window.L` no longer has `generateCrewMember` or `generateRoster`.
- [ ] START_GAME still works (crew roster generates correctly).
- [ ] HIRE_CREW still works.
- [ ] Run the test suite — all previously-passing crew tests still pass
  (under their new G.01–G.03 IDs).

**Do not proceed to Part 1 until Part 0 is verified green.**

---

## Part 1 — data.js: Remove MISSION_POOL, Add Generator Config Constants

### 1.1 — Remove MISSION_POOL

- [ ] **Delete the entire `MISSION_POOL` constant from `data.js`.**
  All hardcoded mission entries are removed. `window.D.MISSION_POOL` will no
  longer exist. The generator in `generators.js` produces equivalent output.

- [ ] **Remove `window.D.MISSION_POOL` from `data.js`'s export/return object**
  if it is explicitly listed there.

### 1.2 — Add generator config constants to `data.js`

These are static lookup tables that configure the generators. They live in
`data.js` (not `generators.js`) because they are pure data — no functions,
no randomness, just numbers and strings that happen to feed generators.

Add the following constants. The agent must confirm or adjust values marked ⚙.

- [ ] **`MISSION_GOLD_RANGES`**

  ⚙ **PARAMETER DISCUSSION — confirm ranges against current ship/upgrade prices**
  Goal: tier-0 player doing low-risk missions can afford a sloop in ~8–12 missions.

  ```js
  window.D.MISSION_GOLD_RANGES = {
    //        [low,      medium,    high,      assault  ]  ← risk brackets [min, max]
    0: { low: [150,300], medium: [300,550],  high: [550,900],  assault: [900,1400]  },
    1: { low: [250,500], medium: [500,850],  high: [850,1400], assault: [1400,2200] },
    2: { low: [400,750], medium: [750,1200], high: [1200,2000],assault: [2000,3200] },
    3: { low: [650,1100],medium: [1100,1800],high: [1800,3000],assault: [3000,5000] },
    4: { low: [1000,1600],medium:[1600,2600],high: [2600,4200],assault: [4200,7000] },
  };
  ```

- [ ] **`MISSION_ENEMY_RANGES`** (already decided — copy exactly)

  ```js
  window.D.MISSION_ENEMY_RANGES = {
    hull:    { 0:[20,45],  1:[40,75],  2:[65,110], 3:[95,155],  4:[135,210] },
    cannons: { 0:[2,6],    1:[5,10],   2:[8,16],   3:[13,22],   4:[18,30]   },
    crew:    { 0:[8,18],   1:[15,35],  2:[25,55],  3:[40,80],   4:[60,110]  },
  };
  ```

- [ ] **`FACTION_ENEMIES`**

  ⚙ **PARAMETER DISCUSSION — confirm this reflects intended Caribbean politics**

  ```js
  window.D.FACTION_ENEMIES = {
    english: ["spanish", "pirate"],
    spanish: ["english", "pirate"],
    french:  ["english", "spanish"],
    dutch:   ["spanish", "pirate"],
    pirate:  ["english", "spanish", "french", "dutch"],
  };
  ```

- [ ] **`MISSION_REP_IMPACTS`**

  ⚙ **PARAMETER DISCUSSION — confirm values (see Part 5 for full discussion)**

  ```js
  window.D.MISSION_REP_IMPACTS = {
    escort:  { low: 2, medium: 3, high: 4 },
    patrol:  { low: 2, medium: 3, high: 4 },   // enemy faction gets negative
    combat:  { low: 3, medium: 4, high: 5 },   // enemy faction gets negative
    smuggle: { any: 2 },                        // pirate faction only
    assault: { any: 5 },                        // defending faction gets -8
  };
  ```

- [ ] **`MISSION_NAME_PARTS`**

  ⚙ **PARAMETER DISCUSSION — agent must expand each list to 6–8 entries**

  ```js
  window.D.MISSION_NAME_PARTS = {
    cargo:      ["spice shipment", "merchant convoy", "supply fleet", "noble passenger"],
    contraband: ["rum", "stolen charts", "black powder", "foreign silk", "untaxed tobacco"],
    regionAdj:  ["southern", "northern", "treacherous", "disputed", "windward"],
    factionAdj: {
      english: ["English", "Crown", "His Majesty's"],
      spanish: ["Spanish", "Colonial", "Crown"],
      french:  ["French", "Republican", "Gallic"],
      dutch:   ["Dutch", "Company", "Merchant"],
      pirate:  ["Brotherhood", "Free", "Unaligned"],
    },
  };
  ```

- [ ] **`ENEMY_SHIP_NAMES`**

  ⚙ **PARAMETER DISCUSSION — agent must expand to 8–10 entries each**

  ```js
  window.D.ENEMY_SHIP_NAMES = {
    adjectives: ["Black", "Scarlet", "Iron", "Crimson", "Silent", "Cursed", "Broken"],
    nouns:      ["Serpent", "Tide", "Fortune", "Drake", "Widow", "Storm", "Revenge"],
  };
  ```

---

## Part 2 — Remove MISSION_POOL References from logic.js

`logic.js` currently contains a `generateMissions` function that filters
`window.D.MISSION_POOL`. That function is deleted here and rebuilt in
`generators.js` in Part 3.

- [ ] **Delete the existing `generateMissions` function from `logic.js`.**

- [ ] **Remove `generateMissions` from `window.L`'s export object in `logic.js`.**
  After this change, `window.L` should have no functions that use `Math.random`
  and no references to `MISSION_POOL`.

- [ ] **Add `getFameTier(fame)` to `logic.js`** — this is a pure deterministic
  function (no randomness) so it belongs in `logic.js`, not `generators.js`.
  It is used by both `generators.js` and `screens.jsx`.
  ```js
  const getFameTier = (fame) => {
    if (fame >= 350) return 4;
    if (fame >= 200) return 3;
    if (fame >= 100) return 2;
    if (fame >= 50)  return 1;
    return 0;
  };
  ```
  Add to `window.L` exports.

- [ ] **Verify `logic.js` still exports everything it should** after these
  removals. Expected exports after this part:
  `getShipStats, getEffectiveMorale, payCrewWages, decayReputation,
  applyReputationImpact, generateMissions` ← **removed**,
  `getRepPerk, getFameLabel, meetsRequirement, canBribe, getInfamyLabel,
  getInfamyTier, buildEncounterContext, resolveCombatAction, getFameTier` ← **new**.
  `generateCrewMember, generateRoster` ← **moved to G in Part 0**.

---

## Part 3 — engine.js: Remove MISSION_POOL References and Update TAKE_MISSION

- [ ] **Search `engine.js` for any direct references to `window.D.MISSION_POOL`.**
  These should not exist (missions are generated via `L.generateMissions`), but
  audit to be sure. Remove any found.

- [ ] **Update all calls to `L.generateMissions(...)` → `G.generateMissions(...)`.**
  Expected locations in engine.js:
  - `ENTER_PORT` case: `missions: L.generateMissions(portKey, state)`
  - `REFRESH_MISSIONS` case: `missions: L.generateMissions(portKey, state)`
  - `COMPLETE_MISSION` case: regenerates missions after completion
  - `START_GAME` case: may generate initial missions
  Change each to `G.generateMissions(...)`.

- [ ] **Update `TAKE_MISSION` action shape.**
  Current: `{ type: A.TAKE_MISSION, missionId: "some_id" }` — reducer calls
  `state.missions.find(m => m.id === action.missionId)`.
  New: `{ type: A.TAKE_MISSION, mission: missionObject }` — reducer sets
  `activeMission: action.mission` directly.

  ```js
  // BEFORE
  case A.TAKE_MISSION: {
    const mission = state.missions.find(m => m.id === action.missionId);
    if (!mission) return state;
    // fame gate check ...
    return { ...state, activeMission: mission, ... };
  }

  // AFTER
  case A.TAKE_MISSION: {
    if (!action.mission) return state;  // safety guard only
    const mission = action.mission;
    return {
      ...state,
      activeMission: mission,
      screen: mission.type === "combat" ? "intercept" : state.screen,
      log: [...state.log, `Mission accepted: ${mission.name}.`],
    };
  }
  ```
  Note: fame gating is now handled at generation time — `G.generateMissions`
  never returns missions the player cannot access. The reducer no longer needs
  to check `requiredFame`.

- [ ] **Confirm `COMPLETE_MISSION` handles arbitrary `repImpact` objects.**
  The new `repImpact` field is `{ [factionKey]: delta }` with any number of
  keys. Confirm `L.applyReputationImpact(state, repImpact)` in `logic.js`
  already iterates all keys. If it was previously written for fixed-key objects,
  update it to iterate `Object.entries(repImpact)`.

---

## Part 4 — screens.jsx: Update All Mission-Related Call Sites

- [ ] **Update all `TAKE_MISSION` dispatches in `screens.jsx`.**
  Every `dispatch({ type: E.A.TAKE_MISSION, missionId: m.id })` becomes
  `dispatch({ type: E.A.TAKE_MISSION, mission: m })`.
  Search for `TAKE_MISSION` in screens.jsx and update all occurrences.

- [ ] **Remove any references to `mission.id`** in mission card rendering.
  If the mission card renders `mission.id` anywhere (as a key prop or displayed
  text), replace with a stable alternative. For React `key` props on the mission
  list, use the array index or `mission.name` — since the list is short (2–3
  items) and regenerated wholesale, index is acceptable.

- [ ] **Update any calls to `L.generateMissions(...)` in screens.jsx.**
  If `screens.jsx` calls this directly (e.g. to preview the board), change to
  `G.generateMissions(...)`. Most likely screens.jsx reads from `state.missions`
  (pre-generated in engine) rather than calling the generator directly — audit
  and confirm.

- [ ] **Add enemy info display to mission cards.**
  For `combat`, `assault`, and `smuggle` mission types where `mission.enemy`
  is not null, add a line below the description:
  ```jsx
  {mission.enemy && (
    <div style={{ color: T.textDim, fontSize: 10, marginTop: 4 }}>
      Enemy: {mission.enemy.name} — {mission.enemy.cannons} cannons,
      hull {mission.enemy.hull}, crew {mission.enemy.crew}
    </div>
  )}
  ```

- [ ] **Update `REFRESH_MISSIONS` dispatch if screens.jsx calls it.**
  No action shape change — `REFRESH_MISSIONS` takes no payload. But verify the
  button still works end-to-end after the generator change.

---

## Part 5 — tests.js: Update All Affected Tests

### 5.1 — Update TAKE_MISSION tests

- [ ] **Search for all `TAKE_MISSION` dispatches in tests.js.**
  Change from `{ type: A.TAKE_MISSION, missionId: "escort_fleet" }` to
  `{ type: A.TAKE_MISSION, mission: { type: "escort", name: "Test", ... } }`.
  Each test that dispatches TAKE_MISSION needs to build a minimal mission object
  inline. Use the mission shape from Part 3 — only fill fields the test cares about.

  Minimal mission fixture for use in tests:
  ```js
  const testMission = (overrides = {}) => ({
    type: "escort", name: "Test Escort", description: "Test.",
    faction: "english", targetPort: "nassau", risk: "low",
    gold: 300, fame: 1, infamyGain: 0, requiredFame: 0,
    repImpact: { english: 2 }, enemy: null,
    ...overrides
  });
  ```
  Add this helper near the top of the test suite or in the relevant test section.

### 5.2 — Rename and update crew generator tests

- [ ] **Rename tests L.50, L.51, L.52 to G.01, G.02, G.03.**
  Update their names in the test suite to reflect they test `window.G`, not
  `window.L`. Update any assertions that call `L.generateCrewMember(...)` to
  `G.generateCrewMember(...)` and `L.generateRoster(...)` to `G.generateRoster(...)`.

### 5.3 — Add new generator unit tests

Add a new test suite section: `"Generator: generators.js (G)"`.

- [ ] `G.generateEnemy` returns object within hull range for fame tier 0, risk "low".
- [ ] `G.generateEnemy` returns object within hull range for fame tier 2, risk "high".
- [ ] `G.generateEnemy` assault risk hull can exceed tier max (confirms assault bracket).
- [ ] `G.generateEnemy` cannons within expected range for fame tier 1, risk "medium".
- [ ] `G.generateEnemy` crew within expected range for fame tier 3, risk "high".
- [ ] `G.generateEnemy` returns a name string (non-empty).
- [ ] `G.generateEnemy` returns a faction from `FACTION_ENEMIES` of the given faction.
- [ ] `G.generateMissions` returns array of length 2 or 3.
- [ ] `G.generateMissions` never returns a mission with `targetPort === currentPort`.
- [ ] `G.generateMissions` returns `[]` when port reputation < 10.
- [ ] `G.generateMissions` never returns a mission with `requiredFame > state.fame`.
- [ ] `G.generateMissions` never returns `patrol` type when port faction is `"pirate"`.
- [ ] `G.generateMissions` all returned gold values are multiples of 25.
- [ ] `G.generateMissions` all returned missions have non-empty `name` and `description`.
- [ ] `G.opposingFaction("english")` returns a value from `FACTION_ENEMIES.english`.
- [ ] `L.getFameTier(14)` returns 0; `L.getFameTier(50)` returns 1;
  `L.getFameTier(200)` returns 3. (This is a logic.js test — add to Unit suite.)

### 5.4 — Update existing MISSION_POOL-dependent tests

- [ ] **Search tests.js for any test that references `D.MISSION_POOL`** or
  hardcoded mission IDs like `"escort_fleet"`, `"smuggle_goods"`, etc.
  These tests either:
  - Used a mission ID in a TAKE_MISSION dispatch → update to full mission object
    (see 5.1).
  - Tested pool contents directly → delete the test. Pool no longer exists.
  - Tested that a specific mission appeared on the board → rewrite to test
    board structure (has 2–3 items, all have required fields) rather than
    specific mission identity.

### 5.5 — Update reducer tests that use generateMissions

Any reducer test that calls `G.generateMissions` (via ENTER_PORT or
REFRESH_MISSIONS) must add `u.resetRandomStub()` before the dispatch — or
the random calls inside the generator will drain the stub. Best practice:
call `u.resetRandomStub()` at the start of every test that triggers port entry
or mission refresh.

---

## Part 6 — Write the Mission Generators in generators.js

All functions below go in `generators.js`. They are listed in dependency order
(helpers first, main function last).

### 6.1 — `opposingFaction(factionKey)` → string

Reads `window.D.FACTION_ENEMIES`. Returns one enemy faction at random.
```js
const opposingFaction = (factionKey) => {
  const enemies = window.D.FACTION_ENEMIES[factionKey] || [];
  if (enemies.length === 0) return "pirate"; // fallback
  return pickRandom(enemies);
};
```

### 6.2 — `getFameTierLocal()` — internal alias

Generators need `getFameTier` frequently. Call `window.L.getFameTier(fame)`
inside each function, or assign a local alias at the top of the IIFE:
```js
const getFameTier = (fame) => window.L.getFameTier(fame);
```
This avoids repeating `window.L.` throughout the file.

### 6.3 — `generateEnemyName(faction)` → string

```js
const generateEnemyName = (faction) => {
  const { adjectives, nouns } = window.D.ENEMY_SHIP_NAMES;
  return `The ${pickRandom(adjectives)} ${pickRandom(nouns)}`;
};
```

### 6.4 — `generateEnemy(risk, fame, faction)` → EnemyObject

```js
const generateEnemy = (risk, fame, faction) => {
  const tier = getFameTier(fame);
  const riskFactors = { low: 0.0, medium: 0.5, high: 1.0, assault: 1.4 };
  const rf = riskFactors[risk] ?? 0.5;

  const pick = (rangeObj) => {
    const [min, max] = rangeObj[tier];
    const span = max - min;
    const effectiveMax = risk === "assault" ? min + span * 1.6 : max;
    const noise = randBetween(0, span * 0.15);
    return Math.round(Math.min(effectiveMax, Math.max(min, min + span * rf + noise)));
  };

  const ranges = window.D.MISSION_ENEMY_RANGES;
  return {
    name:    generateEnemyName(faction),
    faction: opposingFaction(faction),
    hull:    pick(ranges.hull),
    cannons: pick(ranges.cannons),
    crew:    pick(ranges.crew),
  };
};
```

### 6.5 — `generateEnemyForAssault(targetPortKey, fame)` → EnemyObject

Assault missions use the defending port's faction rather than an opposing
faction. Enemy strength is always at the top of the assault bracket.

```js
const generateEnemyForAssault = (targetPortKey, fame) => {
  const port = window.D.PORTS[targetPortKey];
  const faction = port?.faction || "spanish";
  return generateEnemy("assault", fame, faction);
};
```

### 6.6 — `generateGold(type, risk, fame)` → number

```js
const generateGold = (type, risk, fame) => {
  const tier = getFameTier(fame);
  const effectiveRisk = type === "assault" ? "assault" : risk;
  const [min, max] = window.D.MISSION_GOLD_RANGES[tier][effectiveRisk];
  const raw = randBetween(min, max);
  return Math.round(raw / 25) * 25;
};
```

### 6.7 — `generateRepImpact(type, faction, risk)` → object

⚙ See Part 1.2 for the `MISSION_REP_IMPACTS` constant. This function reads it.

```js
const generateRepImpact = (type, faction, risk) => {
  const impacts = window.D.MISSION_REP_IMPACTS;
  const impact = {};

  if (type === "smuggle") {
    impact["pirate"] = impacts.smuggle.any;
    return impact;
  }

  const positiveDelta = impacts[type]?.[risk] ?? impacts[type]?.any ?? 2;
  impact[faction] = positiveDelta;

  if (type === "patrol" || type === "combat") {
    const enemy = opposingFaction(faction);
    impact[enemy] = -(positiveDelta - 1);
  }
  if (type === "assault") {
    const port = window.D.PORTS[faction]; // faction here is the target port's faction
    impact[faction] = impacts.assault.any;
    // defending faction takes heavy rep loss
    // Note: assault rep impact target is the defending port faction, passed as `faction`
    impact[faction + "_defending"] = -8; // see ⚙ discussion below
  }

  return impact;
};
```

⚙ **PARAMETER DISCUSSION — Assault repImpact target**

For assault missions, who gives the mission and who is the defending faction?
If the English commission you to assault Havana, you gain rep with English
and lose with Spanish. Confirm: `faction` param is always the *commissioning*
faction, and `targetPort`'s faction is the *defending* faction. The agent
should confirm these are always different (they should be — you wouldn't assault
your own faction's port) and adjust the repImpact keys accordingly.

### 6.8 — `generateMissionText(type, faction, targetPortKey, risk, enemy)` → `{name, desc}`

```js
const generateMissionText = (type, faction, targetPortKey, risk, enemy) => {
  const parts = window.D.MISSION_NAME_PARTS;
  const portName = window.D.PORTS[targetPortKey]?.name || "unknown waters";
  const factionAdj = pickRandom(parts.factionAdj[faction] || ["Foreign"]);
  const riskAdj = { low: "routine", medium: "dangerous", high: "perilous" }[risk] || "";

  const templates = {
    escort: {
      name: `Escort the ${pickRandom(parts.cargo)} to ${portName}`,
      desc: `The ${factionAdj} merchants need safe passage to ${portName}. Deliver them without incident.`,
    },
    patrol: {
      name: `Patrol the ${pickRandom(parts.regionAdj)} waters`,
      desc: `Clear ${factionAdj} waters of hostile vessels. Return when the route is safe.`,
    },
    combat: {
      name: `Hunt down ${enemy?.name || "the enemy"}`,
      desc: `${enemy?.name || "A hostile vessel"} has been raiding our ships. Find them and sink them.`,
    },
    smuggle: {
      name: `Smuggle ${pickRandom(parts.contraband)} to ${portName}`,
      desc: `Get the cargo to ${portName} without colonial inspection. Ask no questions.`,
    },
    assault: {
      name: `Assault ${portName}`,
      desc: `Take ${portName} by force. Show them the cost of defiance. This is ${riskAdj} work.`,
    },
  };

  return templates[type] || { name: "Unknown mission", desc: "Details unclear." };
};
```

### 6.9 — `pickTargetPort(currentPortKey, type, state)` → portKey | null

```js
const pickTargetPort = (currentPortKey, type, state) => {
  if (type === "combat") return null; // combat has no destination
  if (type === "patrol") return null; // patrol stays local

  const allPorts = Object.keys(window.D.PORTS);
  // Future: filter by state.discoveredPorts when that mechanic exists.
  // For now treat all ports as discovered.
  const eligible = allPorts.filter(k => k !== currentPortKey);

  if (eligible.length === 0) return null;
  return pickRandom(eligible);
};
```

For `assault` type specifically, the eligible pool should exclude ports whose
faction matches the commissioning faction (you don't assault your own faction):
```js
if (type === "assault") {
  const missionFaction = ...; // passed in from generateMissions context
  const assaultEligible = eligible.filter(k =>
    window.D.PORTS[k].faction !== missionFaction
  );
  return assaultEligible.length > 0 ? pickRandom(assaultEligible) : null;
}
```
Since `generateMissions` has the faction context, it should pass it. See 6.10.

### 6.10 — `generateMissions(portKey, state)` → Mission[]

This is the main entry point. Called by `engine.js` on ENTER_PORT,
REFRESH_MISSIONS, and COMPLETE_MISSION.

```js
const generateMissions = (portKey, state) => {
  const { PORTS, FACTIONS, FACTION_ENEMIES } = window.D;
  const port = PORTS[portKey];
  if (!port) return [];

  // At war = no missions
  const perk = window.L.getRepPerk(state.reputation?.[portKey] ?? 50);
  if (perk.servicesBlocked) return [];

  // Eligible factions: port faction + non-enemy factions if allied faction
  // option is implemented. For now: port faction only.
  // ⚙ See Part 8 (allied factions) for the expansion path.
  const eligibleFactions = [port.faction];

  const count = Math.random() < 0.5 ? 2 : 3;
  const missions = [];

  // Mission type weights per faction type
  const typeWeightsFor = (faction) => {
    const isPirate = faction === "pirate";
    return {
      escort:  3,
      patrol:  isPirate ? 0 : 2,
      combat:  2,
      smuggle: 2,
      assault: 1,
    };
  };

  // Risk weights per fame tier
  // ⚙ See Part 7 for the full risk weight table
  const riskWeightsFor = (fame) => {
    const tier = getFameTier(fame);
    const table = [
      { low:5, medium:4, high:1, assault:0 },
      { low:4, medium:4, high:2, assault:0 },
      { low:3, medium:4, high:3, assault:0 },
      { low:2, medium:3, high:4, assault:1 },
      { low:1, medium:3, high:4, assault:2 },
    ];
    return table[tier];
  };

  for (let i = 0; i < count; i++) {
    const faction = pickRandom(eligibleFactions);
    const typeWeights = typeWeightsFor(faction);
    const types = Object.keys(typeWeights).filter(t => typeWeights[t] > 0);
    const weights = types.map(t => typeWeights[t]);
    const type = pickWeighted(types, weights);

    const riskWeights = riskWeightsFor(state.fame ?? 0);
    const riskTypes = ["low", "medium", "high", "assault"];
    const riskWArr = riskTypes.map(r => riskWeights[r]);
    const risk = pickWeighted(riskTypes, riskWArr);

    // assault always uses the assault gold/fame bracket regardless of risk label
    const targetPort = type === "assault"
      ? pickRandom(
          Object.keys(PORTS).filter(k =>
            k !== portKey && PORTS[k].faction !== faction
          ))
      : pickTargetPort(portKey, type, state);

    const enemy = (type === "combat" || type === "smuggle" || type === "assault")
      ? generateEnemy(risk, state.fame ?? 0, faction)
      : null;

    const gold        = generateGold(type, risk, state.fame ?? 0);
    const fame        = type === "assault" ? 3 : risk === "high" ? 2 : 1;
    const infamyGain  = type === "smuggle" ? 1 : type === "assault" ? (risk === "high" ? 3 : 2) : 0;
    const repImpact   = generateRepImpact(type, faction, risk);
    const requiredFame= type === "assault" ? 100 : risk === "high" ? 50 : 0;
    const { name, desc } = generateMissionText(type, faction, targetPort, risk, enemy);

    missions.push({
      type, name, description: desc, faction,
      targetPort: targetPort || null,
      risk, gold, fame, infamyGain, repImpact, enemy,
      requiredFame,
    });
  }

  return missions;
};
```

---

## Part 7 — Risk Distribution Weights

⚙ **PARAMETER DISCUSSION — Confirm weight table before coding**

Assault missions are excluded below tier 3 by weight (0), and also by
`requiredFame: 100` as a belt-and-suspenders guard.

| Fame tier | low | medium | high | assault |
|-----------|-----|--------|------|---------|
| 0 Unknown | 5 | 4 | 1 | 0 |
| 1 Recognised | 4 | 4 | 2 | 0 |
| 2 Notorious | 3 | 4 | 3 | 0 |
| 3 Legendary | 2 | 3 | 4 | 1 |
| 4 Immortal | 1 | 3 | 4 | 2 |

Agent to confirm: should high-risk missions be accessible earlier (e.g. weight 1
at tier 0) or is the current ramp-up appropriate?

---

## Part 8 — Allied Factions (Optional)

⚙ **PARAMETER DISCUSSION — Agent to choose Option A or B**

**Option A (recommended):** Allied faction missions appear at a port if the
allied faction is not in `FACTION_ENEMIES[port.faction]` (i.e. they are
not enemies) AND the player's average reputation with that faction's ports
is ≥ 30.

Implementation: after building `eligibleFactions = [port.faction]`, add:
```js
Object.keys(FACTIONS).forEach(factionKey => {
  if (factionKey === port.faction) return;
  if (FACTION_ENEMIES[port.faction]?.includes(factionKey)) return;
  // Check player rep with this faction's ports
  const factionPorts = Object.values(PORTS).filter(p => p.faction === factionKey);
  const avgRep = factionPorts.reduce((sum, p) =>
    sum + (state.reputation?.[p.id] ?? 50), 0) / (factionPorts.length || 1);
  if (avgRep >= 30) eligibleFactions.push(factionKey);
});
```

**Option B:** Port faction only. Simpler, no reputation cross-checks. Allied
faction missions are a follow-up in Phase 2.

If time is short, implement Option B now and leave a `// TODO: allied factions`
comment at the eligibleFactions line.

---

## Part 9 — Target Port for Combat Missions

⚙ **PARAMETER DISCUSSION — Agent to confirm integration approach**

Combat missions have no `targetPort` (it is null). The enemy appears as a
mandatory encounter during the next voyage. This requires a check in
`ADVANCE_DAY` in `engine.js`:

```js
// In ADVANCE_DAY, when checking for intercepts:
if (state.activeMission?.type === "combat" && !state.combatMissionTriggered) {
  // Trigger encounter on first sailing day after accepting combat mission
  // buildEncounterContext with state.activeMission.enemy
  // Set state.combatMissionTriggered = true so it only fires once
}
```

⚙ **Agent to confirm:** is `combatMissionTriggered` an appropriate new state
field, or should this be handled differently (e.g. via a special intercept
probability modifier)?

Alternative: the encounter triggers on the FIRST day of sailing only (day 1
after TAKE_MISSION), which avoids a new state field. If the player evades,
they can re-accept the mission for another attempt.

---

## Part 10 — architecture.md Updates

- [ ] **Add `generators.js` to the file table** with description, window namespace
  (`window.G`), load order, and dependency list (`window.D`, `window.L`).
- [ ] **Update `index.html` load order diagram** to show generators.js between
  logic.js and engine.js.
- [ ] **Update `tests.html` load order** note to match.
- [ ] **logic.js exports table:** remove `generateCrewMember`, `generateRoster`,
  `generateMissions`. Add `getFameTier`.
- [ ] **New section: generators.js exports table.** List all exported functions
  with signature and description.
- [ ] **Data section:** document removal of `MISSION_POOL`. Document all new
  config constants added in Part 1.2.
- [ ] **State shape:** confirm `activeMission` shape — no `id` field. `enemy`
  is a generated object `{ name, faction, hull, cannons, crew }`.
- [ ] **Action reference:** update `TAKE_MISSION` — new dispatch shape
  `{ type, mission: missionObject }`, no ID field.
- [ ] **Add note on file size discipline:** generators.js is the permanent home
  for all `Math.random`-using functions. Future generators (port resources,
  random events) go here, not in logic.js.

---

## Enemy Scaling Matrix (Confirmed — Do Not Modify)

### Hull (hp)

| Fame tier | Full range | Low risk | Medium risk | High risk | Assault |
|-----------|-----------|----------|-------------|-----------|---------|
| 0 Unknown | 20–45 | 20–28 | 29–37 | 38–45 | 45–72 |
| 1 Recognised | 40–75 | 40–52 | 53–63 | 64–75 | 75–120 |
| 2 Notorious | 65–110 | 65–80 | 81–96 | 97–110 | 110–176 |
| 3 Legendary | 95–155 | 95–115 | 116–136 | 137–155 | 155–248 |
| 4 Immortal | 135–210 | 135–160 | 161–186 | 187–210 | 210–336 |

### Cannons

| Fame tier | Full range | Low risk | Medium risk | High risk | Assault |
|-----------|-----------|----------|-------------|-----------|---------|
| 0 Unknown | 2–6 | 2–3 | 3–4 | 5–6 | 6–9 |
| 1 Recognised | 5–10 | 5–6 | 7–8 | 9–10 | 10–16 |
| 2 Notorious | 8–16 | 8–10 | 11–13 | 14–16 | 16–25 |
| 3 Legendary | 13–22 | 13–16 | 17–19 | 20–22 | 22–35 |
| 4 Immortal | 18–30 | 18–22 | 23–26 | 27–30 | 30–48 |

### Crew count

| Fame tier | Full range | Low risk | Medium risk | High risk | Assault |
|-----------|-----------|----------|-------------|-----------|---------|
| 0 Unknown | 8–18 | 8–11 | 12–15 | 16–18 | 18–28 |
| 1 Recognised | 15–35 | 15–21 | 22–29 | 30–35 | 35–56 |
| 2 Notorious | 25–55 | 25–35 | 36–46 | 47–55 | 55–88 |
| 3 Legendary | 40–80 | 40–53 | 54–67 | 68–80 | 80–128 |
| 4 Immortal | 60–110 | 60–80 | 81–96 | 97–110 | 110–176 |

*Assault crew can significantly exceed the player's max crew at any tier.
Grappling an assault target is always a meaningful risk, not a guaranteed win.*