# Pre-B13 Code Cleanup & Documentation Alignment — Consolidated Task List

This document provides a detailed, self-contained list of tasks to be performed before starting B13 (Narrative Synthesis). It covers all confirmed findings from the code-quality review (both ChatGPT's analysis and additional items identified during discussion), with exact file references and expected outcomes. The tasks are prioritized into three levels: **A** (must fix now), **B** (strongly recommended), **C** (cleanup/optional). **D** items (architecture rewrite, ES modules, etc.) are intentionally excluded.

The final section lists documentation updates that must be made to reflect the code changes. All tasks can be executed independently, but the listed order is recommended.

---

## Overarching Goal

Restore the architectural guarantees declared in the project documentation:
- Pure logic (no hidden randomness)
- Reducer immutability
- UI → engine interaction (no direct generator calls from UI)
- Single ownership of persistence
- Clear domain boundaries between engine files
- Data constants remain immutable

This is a *hygiene pass*, not a gameplay change.

---

## Priority A — Must Fix Now

### A1. Remove UI calls to generators

**Problem:** Two UI components directly call `window.G` functions:
- `screens_combat.jsx` → `InterceptScreen` calls `window.G.generateCombatFlavour(disposition)` inside `useMemo`.
- `ui.jsx` → `PortCard` calls `G.generatePortMarket(portKey, state)` for non-current ports.

**Action:**
1. **Combat flavour:** Move flavour generation into the engine when the encounter session is created. In `engine_core.js`, after `buildEncounterSession` creates the session, compute and store `session.intercept.flavourLines` by calling `window.G.generateCombatFlavour(session.aiDisposition)`. Remove the `useMemo` call from `screens_combat.jsx` and render `state.encounterSession.intercept.flavourLines` instead.
2. **Port market preview:** The `PortCard` should not generate a market. It only needs deterministic trade-profile information (`L.getPortTradeProfile(portKey)`) which already exists. Remove the `G.generatePortMarket` call and instead display only the profile-based data (good deals, in-demand, available list for current port uses `state.portMarket`). If actual market quantities for other ports are needed, they must be added as state (e.g., by an engine action), but this is not required.

**Files:** `screens_combat.jsx`, `ui.jsx`, `engine_core.js`, `generators.js` (no change), `tests_ui.js` (update smoke tests if they rely on the old behavior).

**Expected outcome:** Screens no longer trigger RNG or generate content; they only render state.

---

### A2. Restore reducer immutability

**Problem:** Several places in `engine_battle.js` and `engine_encounter.js` mutate state objects after creation.

**Specific instances (non-exhaustive):**
- `engine_battle.js` in `DISMISS_BATTLE`:
  - `currentState.gold += bonusGold`
  - `currentState.log.push(...)`
  - `currentState.activeMission = ...`
  - `currentState.infamy = ...`
  - `currentState.encounterSession.inspectionContraband = null` (nested mutation)
- `engine_encounter.js` in the inspection defeat path:
  - `currentState.gold = ...`
  - `currentState.hold = ...`
  - `currentState.infamy = ...`
  - `currentState.reputation = ...`
  - `currentState.crew = ...`
  - `currentState.log.push(...)`
  - `currentState.encounterSession = null`
  - `currentState.screen = ...`
- `engine_battle.js` in the evade branch:
  - `nextState.activeMission = null`
  - `nextState.log.push(...)`

**Action:** Rewrite these blocks to construct new state objects immutably. Example pattern:
```js
return {
  ...currentState,
  gold: currentState.gold + bonusGold,
  log: [...currentState.log, newEntry],
  activeMission: null,
  encounterSession: {
    ...currentState.encounterSession,
    inspectionContraband: null
  }
};
```
- For complex aftermath, consider extracting a helper function (e.g., `applyVictoryAftermathImmutable(state)`) that returns a new state.

**Files:** `engine_battle.js`, `engine_encounter.js`, `engine_core.js` (if needed).

**Expected outcome:** Reducer functions never mutate the previous state or any nested objects that may be shared. Add regression tests that deep-clone state before dispatch and assert equality after.

---

### A3. Stop mutating `D.RANDOM_EVENTS`

**Problem:** `logic_travel_events.js` in `triggerRandomEvent` modifies the original event object:
```js
if (Array.isArray(event.desc))
    event.desc = randomDescription;
return { ...event };
```

**Action:** Replace with a non-mutating clone:
```js
const event = { ...availableEvents[index] };
if (Array.isArray(event.desc)) {
  event.desc = pick(event.desc);
}
return event;
```
Or better, create a helper `instantiateEvent(event)` that always returns a copy with resolved `desc`.

**Files:** `logic_travel_events.js`, `tests_logic.js` (add test that `D.RANDOM_EVENTS` remains unchanged).

**Expected outcome:** Data constants are never mutated by logic.

---

### A4. Formalize/inject RNG into logic layer

**Problem:** Many logic functions use `Math.random()` directly, violating the "logic has no side effects" claim. Functions include:
- `logic_combat_encounter.js`: `resolveNavalRound`, `resolveBoardingRound`, `getNPCNavalAction`, `resolveSpeedContest`, etc.
- `logic_travel_events.js`: `triggerRandomEvent`, `maybeRandomPatrol`.
- `logic_economy_crew.js`: `removeRandomCrew`, `processDesertion`.
- `logic_core.js`: `roll`, `logPick`.

**Action:** Introduce an injectable RNG dependency. Do **not** move these functions to `generators.js`. Instead:
- Create a small RNG object (e.g., `window.RNG`) with methods `random()`, `int(min,max)`, `pick(array)`.
- Modify logic functions to accept an optional `rng` parameter (defaulting to `window.RNG`). For example:
  ```js
  const resolveNavalRound = (state, playerAction, enemyAction, battle, enemy, rng = window.RNG) => { ... rng.random() ... }
  ```
- In tests, pass a deterministic RNG (e.g., `rng = { random: () => 0.5, int: (a,b) => Math.floor((a+b)/2), pick: (arr) => arr[0] }`).
- Update all internal calls to pass `rng` through where appropriate.

**Files:** `logic_core.js`, `logic_economy_crew.js`, `logic_travel_events.js`, `logic_combat_encounter.js`, `engine_*.js` (if they call these functions and need to pass RNG), `tests_logic.js`, `tests_engine.js`.

**Expected outcome:** Logic functions become deterministic given RNG input; global randomness is isolated.

---

### A5. Remove engine-to-engine dependency

**Problem:** `engine_encounter.js` depends on `engine_battle.js` for `applyCrewLossToState` and `washAshore`.

**Action:**
1. Move `applyCrewLossToState` to `logic_combat_encounter.js` (or `logic_economy_crew.js`) as `L.applyCrewLoss(state, count)`.
2. Move `washAshore` to `engine_encounter.js` (it is an encounter consequence). It may call `G.generatePortMarket`/`G.generateMissions` and `L.isUnrecoverable` — that's fine.
3. Remove the explicit imports in `engine_encounter.js` and update all callers.

**Files:** `logic_combat_encounter.js`, `engine_battle.js`, `engine_encounter.js`, any other file that calls these (e.g., `engine_port.js`).

**Expected outcome:** `engine_encounter.js` no longer imports from `engine_battle.js`; each engine domain stands alone.

---

### A6. Fix `initialState.career` sharing `D.DEFAULT_CAREER`

**Problem:** `engine_core.js` sets `career: window.D.DEFAULT_CAREER` in `initialState`, causing shallow sharing. Migration also uses shallow copy.

**Action:** Create a factory function `createDefaultCareer()` that returns a deep copy of `D.DEFAULT_CAREER` (using `JSON.parse(JSON.stringify(...))` or manual clone). Use it in:
- `initialState`
- `migrateState` (instead of `{ ...D.DEFAULT_CAREER }`)
- `START_GAME` if it sets career.

**Files:** `engine_core.js`.

**Expected outcome:** No shared references between `D` constants and state.

---

### A7. Fix state versioning inconsistency

**Problem:** `initialState.version = 1` while migration sets `version = 2`. This makes new games version 1, upgraded to 2 on load.

**Action:**
- Define `const CURRENT_STATE_VERSION = 2` in `engine_core.js` (or a shared constant).
- Set `initialState.version = CURRENT_STATE_VERSION`.
- Replace all magic numbers in `migrateState` with the constant.

**Files:** `engine_core.js`.

**Expected outcome:** New games start with the current schema version; migration logic is consistent.

---

### A8. Centralize patrol/contraband calculations

**Problem:** The logic for detecting contraband and calculating fines is duplicated in:
- `engine_encounter.js` (in `applyNavyPatrolSurrender` and `PATROL_INSPECT`)
- `logic_combat_encounter.js` (in `buildEncounterContext` for bribe cost).

**Action:** Create a pure helper in `logic_combat_encounter.js` (or `logic_economy_crew.js`):
```js
const getPatrolContrabandInfo = (state) => {
  // returns { hasContraband, hasTobacco, hasSlaves, hasRumSmuggle, seizedValue, fine }
};
```
Use it in all three places. Ensure the fine calculation uses `D.PATROL_FINE_RATE` consistently.

**Files:** `logic_combat_encounter.js` (helper), `engine_encounter.js`, `logic_combat_encounter.js` (bribe), tests.

**Expected outcome:** Single source of truth for contraband/fine logic.

---

### A9. Remove debug-state heuristic from `App.jsx`

**Problem:** `App.jsx`'s `beforeunload` handler skips saving if state matches a suspicious pattern, causing loss of debug-modified saves and confusion.

**Action:** Remove the entire `isDebugState` block. The handler should simply save the state (unless autoSave is disabled). No special treatment for debug states.

**Files:** `App.jsx`.

**Expected outcome:** Debug modifications persist normally. The save system is fully orthogonal to debug actions.

---

## Priority B — Strongly Recommended

### B1. Remove redundant `encounterType` field

**Problem:** `buildEncounterContext` returns both `type` and `encounterType` with the same value; no consumer uses `encounterType`.

**Action:** Remove the `encounterType` property from the returned object in `buildEncounterContext`. Update any code that references it (search for `encounterType` in codebase).

**Files:** `logic_combat_encounter.js`, possibly `engine_encounter.js`, tests.

**Expected outcome:** Cleaner context shape.

---

### B2. Make encounter `source` explicit

**Problem:** `buildEncounterSession` infers source from enemy identity, then overrides; the wreck event manually sets source after creation.

**Action:** Add a `source` field to `buildEncounterContext` (or pass it separately to `buildEncounterSession`). Update all callers:
- `engine_port.js` (hostile port, mission)
- `engine_voyage.js` (random patrol, mission encounters)
- `engine_encounter.js` (merchant, wreck, etc.)
Remove inference logic.

**Files:** `logic_combat_encounter.js`, `engine_core.js`, `engine_port.js`, `engine_voyage.js`, `engine_encounter.js`.

**Expected outcome:** Session source is always explicit and accurate.

---

### B3. Remove dead `modifiers` state

**Problem:** `encounterSession.modifiers` is initialized but never consumed (except tutorial warmup adds an entry).

**Action:** Remove `modifiers` from the session shape and from `INTERCEPT_FIGHT` logic. If tutorial warmup is still needed, implement it directly in battle construction without the array.

**Files:** `engine_core.js` (buildEncounterSession), `engine_battle.js`, `engine_encounter.js`.

**Expected outcome:** Remove dead state.

---

### B4. Consolidate battle-state constructors

**Problem:** `engine_encounter.js` has two nearly identical constructors: `buildBattleFromIntercept` and `buildBoardingBattleFromIntercept`.

**Action:** Create a single `createBattleState(state, session, options)` function that takes `{ subPhase, distance, openingLog }` and returns the battle object. Use it for both cases.

**Files:** `engine_encounter.js`, possibly `engine_battle.js` if it builds battle state.

**Expected outcome:** Reduced duplication.

---

### B5. Clean up encounter-session creation and remove duplicate aiDisposition

**Problem:** `buildEncounterSession` computes `aiDisposition`; `INTERCEPT_FIGHT` recalculates it.

**Action:** Keep the `aiDisposition` computed at session creation; in `INTERCEPT_FIGHT`, use `session.aiDisposition` instead of recalculating. If the intent is to recalculate at battle start, remove it from session creation.

**Files:** `engine_core.js`, `engine_battle.js`, `engine_encounter.js`.

**Expected outcome:** Single calculation point.

---

### B6. Consolidate persistence ownership

**Problem:** Persistence is split:
- `storage.js` has encoding/decoding and localStorage helpers.
- `engine_core.js` directly uses `localStorage.setItem/getItem` in SAVE/LOAD.
- `App.jsx` uses `localStorage` for autosave and discovery popup state.

**Action:** Move all direct `localStorage` calls into `storage.js`:
- Add functions like `saveToLocalStorage(state)`, `loadFromLocalStorage()`, `clearLocalStorage()`.
- Update `engine_core.js` SAVE/LOAD actions to call these functions.
- Update `App.jsx` `beforeunload` to call the storage function.
- Update discovery popup state to use storage functions (or at least move the read/write logic to `storage.js`).

**Files:** `storage.js`, `engine_core.js`, `App.jsx`.

**Expected outcome:** `storage.js` is the single owner of browser persistence.

---

### B7. Share combat preview calculations

**Problem:** `screens_combat.jsx` contains `getActionPreview()` which duplicates combat math from `logic_combat_encounter.js`.

**Action:** Create a pure function `L.getActionPreview(state, battle, action)` in `logic_combat_encounter.js` that returns the same preview info (hull/crew ranges, hit chance, etc.). Use this function in the UI. Ensure it uses the same formulas as the resolver.

**Files:** `logic_combat_encounter.js`, `screens_combat.jsx`.

**Expected outcome:** Single source of truth for combat predictions.

---

## Priority C — Cleanup / Optional

### C1. Remove dead imports/locals

**Examples:**
- `engine_encounter.js` destructures `autoSave` but doesn't use it.
- `engine_battle.js` defines `pickRandom` (check if used).

**Action:** Audit each file for unused variables/imports and remove them.

**Files:** `engine_encounter.js`, `engine_battle.js`, others.

---

### C2. Remove "FIX:" comments and patch archaeology

**Action:** Replace comments like `// FIX: added battleLogMessage parameter...` with descriptive comments about the logic or remove them. Keep comments that explain *why*, not *what was fixed*.

**Files:** `engine_battle.js`, `engine_encounter.js`.

---

### C3. Consolidate encounter-type strings into constants

**Action:** Define a constant object `D.ENCOUNTER_TYPES` with all encounter type strings. Replace string literals in logic/engine files.

**Files:** `data.js`, `logic_combat_encounter.js`, `engine_*.js`.

**Expected outcome:** Reduces typo risk.

---

### C4. Separate debug reducer from `engine_core.js`

**Action:** Move the debug reducer (all `DEBUG_*` actions) into a new file `engine_debug.js`. Update `index.html` and dependency documentation.

**Files:** `engine_core.js` (remove debug reducer), new `engine_debug.js`, `index.html`, `docs/architecture.md`, `docs/specs_engine.md`.

**Expected outcome:** Cleaner separation of dev-only code.

---

### C5. Naming inconsistencies

**Action:** Audit and fix obvious naming mismatches (e.g., `subPhase` vs `subphase`, `encounterType` removal already covered). Not critical.

---

## Documentation Updates (Must Follow Code Changes)

The following documents must be updated to reflect the refactoring. Each doc is tied to specific code tasks; update them as the corresponding task is completed.

### D1. `docs/architecture.md`
- Update file structure to reflect:
  - logic split into 4 files
  - engine split into 9 files (no `engine_combat.js`)
  - new `engine_debug.js` if added
- Update dependency graph accordingly.
- Update "File Responsibilities" section:
  - `engine_battle.js` now only owns battle mechanics (no merchant/escort aftermath)
  - `engine_encounter.js` owns encounter consequences, wash ashore, inspection
  - `engine_core.js` no longer has persistence logic
- Update "Game Mechanics Implementation" to describe:
  - Inject RNG into logic functions
  - UI does not call generators
  - Reducer immutability rule with examples
  - Combat previews in logic
- Remove outdated references to `createBattleState`.
- Update the `START_GAME` description.

### D2. `docs/specs_engine.md`
- Correct file list (remove `engine_combat.js`; add `engine_debug.js` if created).
- Update `engine_port.js` `START_GAME` signature and behavior.
- Update `engine_voyage.js` `ADVANCE_DAY` pipeline to include all current day-event checks (including `maybeDrunkardEvent`).
- Update `engine_encounter.js` to document new ownership of `washAshore` and removal of dependency on `engine_battle.js`.
- Update Encounter Session Architecture: remove `modifiers`, add explicit `source`, note `inspection_pending` phase.
- Update action constants count and add new actions (e.g., `RESOLVE_INSPECTION`, `DEBUG_TRIGGER_EVENT`).
- Update reducer chain description to include `engine_debug.js` if added.

### D3. `docs/specs_logic.md`
- Add all new functions to the exported list:
  - `computeAIDisposition`, `getHullAdvantage`, `getCrewAdvantage`, `getSpeedDifferential`, `scoreNavalActions`, `scoreBoardingActions`, `selectWeightedAction`
  - `getPatrolContrabandInfo` (if added)
  - `applyCrewLoss` (if moved from engine)
- Document the injectable RNG parameter pattern (e.g., `resolveNavalRound(..., rng)`).
- Note that `logic_combat_encounter.js` now includes `getActionPreview`.

### D4. `docs/specs_generators.md`
- Add `generateCombatFlavour` to the list of exported functions.
- Note that UI no longer calls generators; engine does.

### D5. `docs/specs_jsx.md`
- Correct screen file ownership:
  - `screens_status.jsx` contains `StatusScreen` and `JournalScreen`
  - `screens_combat.jsx` contains Event/Intercept/Battle/Plunder
  - Add `screens_menu.jsx`
- Update dependency rules: screens may NOT call `window.G`; if they must, it's a violation to fix (already addressed).
- Update screen descriptions if `PortCard` now uses only deterministic trade profile.

### D6. `docs/specs_data.md`
- Update `STARTS` shape to the faction-keyed object (already outdated).
- Update `QM_DIALOGUE` keys to `step0_welcome`, `step1_accepted`, etc.
- Remove `treasure_map` from `RANDOM_EVENTS`; add `drifting_sailors` if missing.
- Update `COMBAT_LOG_TEMPLATES` to include `boarding` and `combined` sections.
- Note that `data.js` now has `D.ENCOUNTER_TYPES` if added.

### D7. `docs/player_guide.md`
- Update combat description to include:
  - Distance bands (Far/Medium/Close)
  - Close/Open Distance actions
  - Boarding phase (already partially there)
  - NPC AI behavior
- Update patrol/inspection description to include "Resist seizure" option.
- Add storm detour choice, wreck ambush risk.
- Update random events list (remove treasure_map, add drifting_sailors).

### D8. `docs/roadmap.md`
- Mark B11 as DONE.
- Update B12 status: partially complete (subtasks done: storm detour, wreck ambush, marooned sailors, inspection flow; remaining: flee from patrol).
- Remove B12 from "Planned" or mark as "In Progress".
- Add a note about the pre-B13 cleanup (C0 tasks) if desired.

### D9. `docs/changelog.md`
- Add entry for the cleanup (dated today) summarizing the refactoring and architectural fixes.

### D10. `readme.md`
- Update project structure (remove `logic.js`, `engine_combat.js`; add new files).
- Update combat description to B11/B12 state.
- Update feature list to mention B12 events (storm detour, wreck ambush, inspection flow).
- Remove references to non-existent docs (`docs/readme.md`, `docs/developer_guide.md`).
- Update tools list if needed.

### D11. `docs/Home.md`
- Fix broken link to `docs/readme.md` (remove or point to existing doc).

---

## Final Notes

- **Do not** tackle Priority D items (ES modules, TypeScript, full encounter framework, major engine redesign).
- Each task should be implemented with corresponding tests (unit/integration) to prevent regressions.
- After all code changes, run the full test suite (`tests/tests.html`) and the simulation tools to ensure no breakage.
- Documentation updates should be done immediately after each code change to avoid drift.

This task list is complete and self-contained. An agent with access to the codebase can proceed without additional context.