# Deferred Work & Audit 3 Task List

Pausing A1 with 4 known failures (2 bank-capacity formula, 2 UI battle interaction) and 4 categories of "noted for later" items that surfaced during the refactor. Below is a clean list of everything that got parked, followed by the Audit 3 plan.

---

## Part A — A1 loose ends parked during the refactor

### A.1 — Failing tests, deferred at pause point

- [ ] **`B10.HELPERS.SERVICES`** — "capacity formula correct". Investigate `L.getBankCapacity` against the expected `55714` at `dutch: 50, fame: 100`. Either the formula drifted in a recent B10 rework or the test expectation is stale.
- [ ] **`B10.LOGIC.BANK_FORMULAS`** — "Rep 100, Fame 50 → 8976". Same root cause family; likely the same formula.
- [ ] **`U.INTERACT.BATTLE.01`** — "Close Distance should be clickable and dispatch BATTLE_ACTION". DOM interaction test; `screens_combat.jsx` was never touched by A1, so either a pre-existing failure or a cascade from B11. Needs investigation.
- [ ] **`U.INTERACT.BATTLE.02`** — "Demand Surrender should be clickable with high advantage". Same family as .01; investigate together.

### A.2 — New A1 tests not yet written

The refactor shipped, but the tests that *prove* the new architecture are still missing. Add when convenient:

- [ ] **Two ports of the same faction see the same reputation.** Construct a state where `reputation.english === 65`, verify `getFactionReputation` returns 65 regardless of `currentPort`. Also verify a `spanish: 40` value doesn't leak into the English read. This is the direct architectural test.
- [ ] **Migration test: old per-port shape averages correctly.** Construct a save with `version: 2` and `reputation: { portRoyal: 60, kingston: 70, tortuga: 40 }`. Run `migrateState`. Assert `reputation.english === 65`, `reputation.pirate === 40`, and no leftover port keys.
- [ ] **`applyReputationImpact` guard against unknown faction keys.** Dispatch `applyReputationImpact(state, { ottoman: -5 })`, assert state unchanged. Proves the `if (!(faction in newRep)) return;` guard works.

### A.3 — Tool files with port-keyed reputation

Each is an isolated simulator with its own state, so no cross-contamination with the game. Update opportunistically, or leave forever:

- [ ] **`tools/sim-career-faction-balance.html`** — reviewer flagged that it reasons about faction reputation as a concept. Align with the new 5-key state shape.
- [ ] **`tools/sim-crew.html`** (line ~212) — writes port-keyed reputation in its isolated sim state. Convert to faction-keyed.
- [ ] Consider an audit sweep of the other `tools/*.html` files for reputation reads that assume port keys.

### A.4 — Cosmetic cleanups noted but skipped

Not bugs, just tidiness:

- [ ] **`screens_status.jsx`** — variable `avgRep` in `getFactionSummary` is now a misnomer (post-A1 it's a direct read, not an average). Rename to `rep`, or leave as-is with the return key preserved. Purely cosmetic.
- [ ] **`ui.jsx` PortCard** — `specialtyAvailable` is assigned but never referenced. Dead code.
- [ ] **`logic_travel_events.js` `maybeRandomPatrol`** — verify the final form of `originFaction`/`destFaction` declarations post the paste-accident fix. Two each, once each. No duplicates.
- [ ] **Debug Panel rep buttons** — verify `DEBUG_SET_FACTION_REP` dispatches correctly with the new `faction` payload field (the buttons were renamed but not manually re-tested).

### A.5 — Design items flagged but out of scope

Not tasks, just breadcrumbs for later:

- **`getMissionFactionBonus` logic helper** — if the mission completion log ever wants to display `(★ +20% Allied)` on the reward line, that would live in `logic_core.js`. Only build it when a second consumer appears.
- **Mission reward badge wording** — the current `(Eng : +20%)` inline tag on mission cards works. If it feels cluttered after playtesting, revisit.
- **Career V2** — reviewer explicitly said "do not resurrect for this". Noted.

---

## Part B — Audit 3: Tutorial state into `state`

**Goal:** Move `tutorialSeen` / `tutorialDisabled` out of `localStorage` and into the game state. Fixes the shared-browser bug (Player B never sees hints because Player A dismissed them). Makes tutorial progress part of the save.

**Semantics to preserve** (documented in a comment block near `tutorialMode` in `engine_core.js`):

```
tutorialMode: "full" | "light" | "none"
  "full"  → QM onboarding handles teaching; per-screen popups suppressed
  "light" → per-screen popups shown until dismissed
  "none"  → no tutorial surface at all

tutorialSeen: { [screenName]: boolean }
  true when the player dismissed that screen's popup this playthrough

tutorialDisabled: boolean
  true when the player clicked "Don't show tutorial hints again"
  reset to false on START_GAME (per-playthrough preference)
```

**Out of scope:** renaming `"full"` (confusing, but a behavior change); adding a "never show on this browser" preference (that's a settings system); deleting the legacy `broadside_tutorial` localStorage key (defer one release cycle).

### B.1 — Semantics documentation

- [ ] Add the comment block above near `tutorialMode` in `engine_core.js`.
- [ ] Add a one-line comment above `shouldShowTutorial` in `storage.js` explaining why `"full"` returns `false`.

### B.2 — State shape

- [ ] `engine_core.js` — add to `initialState`:
  ```js
  tutorialSeen: {
    port: false, map: false, sailing: false, battle: false,
    market: false, crew: false, shipyard: false, journal: false, status: false,
  },
  tutorialDisabled: false,
  ```
- [ ] `engine_core.js` — add `MARK_TUTORIAL_SEEN: "MARK_TUTORIAL_SEEN"` to `window.E.A`.

### B.3 — Reducer

- [ ] `engine_core.js` — add reducer case (next to the debug reducer is fine):
  ```js
  case A.MARK_TUTORIAL_SEEN: {
    const { screen, disableAll } = action;
    const tutorialSeen = { ...state.tutorialSeen };
    if (screen) tutorialSeen[screen] = true;
    return {
      ...state,
      tutorialSeen,
      tutorialDisabled: disableAll ? true : state.tutorialDisabled,
    };
  }
  ```

### B.4 — Logic helpers

- [ ] `storage.js` — rewrite `shouldShowTutorial` to read from state:
  ```js
  const shouldShowTutorial = (state, screenName) => {
    if (state.tutorialMode === "none") return false;
    if (state.tutorialMode === "full") return false;   // QM handles teaching
    if (state.tutorialDisabled) return false;
    return !state.tutorialSeen?.[screenName];
  };
  ```
- [ ] `storage.js` — delete `markTutorialSeen`.
- [ ] `storage.js` — leave `loadTutorialState`, `saveTutorialState`, `getDefaultTutorialState` in place with a `// legacy — used only by migrateState for one-time import` comment.

### B.5 — Screen call sites

Seven screens, nine popup sites total.

**`screens_port.jsx`** — `PortScreen` TutorialPopup
**`screens_status.jsx`** — `StatusScreen` + `JournalScreen` TutorialPopups
**`screens_shipyard.jsx`** — `ShipyardScreen` TutorialPopup
**`screens_crew.jsx`** — `CrewScreen` TutorialPopup
**`screens_market.jsx`** — `MarketScreen` TutorialPopup
**`screens_voyage.jsx`** — `MapScreen` + `SailingScreen` TutorialPopups
**`screens_combat.jsx`** — `BattleScreen` TutorialPopup

- [ ] For each, replace:
  ```js
  onDismiss={(disableAll) => {
    markTutorialSeen("port", disableAll);
    setShowTutorial(false);
  }}
  ```
  with:
  ```js
  onDismiss={(disableAll) => {
    dispatch({ type: A.MARK_TUTORIAL_SEEN, screen: "port", disableAll });
    setShowTutorial(false);
  }}
  ```
  (Screen string matches the existing `shouldShowTutorial(state, "port")` argument.)
- [ ] Confirm `dispatch` is in scope at each site. All seven screens already receive `dispatch` as a prop.

### B.6 — Migration

- [ ] `engine_core.js` — inside `migrateState`, **snapshot the legacy state once**:
  ```js
  const legacyTutorial = window.L.loadTutorialState?.();
  if (s.tutorialSeen === undefined) {
    s.tutorialSeen = legacyTutorial?.seen
      ? { ...window.E.initialState.tutorialSeen, ...legacyTutorial.seen }
      : { ...window.E.initialState.tutorialSeen };
  }
  if (s.tutorialDisabled === undefined) {
    s.tutorialDisabled = legacyTutorial?.enabled === false;
  }
  ```
- [ ] This is **field-undefined-gated, not version-gated** — it's purely additive. Runs for any save lacking the fields.
- [ ] Do not bump `CURRENT_STATE_VERSION` for A3 unless bundled with another version bump.

### B.7 — New game reset

- [ ] Verify `START_GAME` produces fresh `tutorialSeen` (all-false) and `tutorialDisabled: false` via the deep clone of `initialState`. No code change expected; add a test (B.8).

### B.8 — Tests

- [ ] `tests_logic.js`:
  - [ ] `shouldShowTutorial` returns `false` when `tutorialDisabled === true`
  - [ ] `shouldShowTutorial` returns `false` when `tutorialSeen.port === true`
  - [ ] `shouldShowTutorial` returns `true` for a fresh state in `"light"` mode
  - [ ] Two independent state objects don't share tutorial state (simulates two players)
- [ ] `tests_engine.js`:
  - [ ] `MARK_TUTORIAL_SEEN` sets the correct screen flag
  - [ ] `MARK_TUTORIAL_SEEN` with `disableAll: true` sets `tutorialDisabled`
  - [ ] `START_GAME` produces a state with all-false `tutorialSeen` and `tutorialDisabled: false`
  - [ ] **Save/load round-trip preserves tutorial state** — construct a state with `tutorialSeen.port = true, tutorialDisabled = true`, run through save/load, assert the loaded state has the same values. This is the whole point of the change.
- [ ] `tests_robustness.js`:
  - [ ] Migration test: state without `tutorialSeen` field, with legacy localStorage mocked, asserts the field is populated from the legacy data.

### B.9 — Manual verification

- [ ] New game with `"light"` mode: open Port, dismiss. Open Map, dismiss. Reload page. Open Port — no popup (remembered). Open Sailing — popup appears.
- [ ] Start a second New Game on the same browser in `"light"` mode. Open Port — popup should appear (fresh state; previous playthrough doesn't affect it).
- [ ] Existing save with legacy localStorage populated: load it, verify `tutorialSeen` was imported correctly.
- [ ] Start a new game with `"full"` mode: confirm no per-screen popups appear.

### B.10 — Follow-up (defer one release)

- [ ] Delete the legacy `broadside_tutorial` localStorage key entirely. Include a one-line cleanup on first `LOAD_GAME` of a post-A3 save.

---

## Suggested order when you resume

1. **A.1** — the 4 failing tests. Smallest, most concrete. Get back to green.
2. **B.2–B.5** — Audit 3 core implementation. Two to three hours.
3. **B.6, B.8** — Migration + tests. One hour.
4. **A.2** — New A1 architectural tests. Thirty minutes. Fits naturally after B.8.
5. **A.3, A.4** — Opportunistic. Bundle with the next time you touch those files.
6. **A.5** — Reference only. Not a task list.

Everything in **Part A** is fine to defer indefinitely. Everything in **Part B** is a proper workstream that fixes a real user-facing bug. When you're ready to resume, B is the natural next move.