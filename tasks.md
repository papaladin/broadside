# 🔍 Broadside — Codebase Audit Report


---

## Table of Contents
1. [Bugs & Data Issues](#1-bugs--data-issues)
2. [Upgrade System Leftovers](#2-upgrade-system-leftovers)
3. [Dead Code](#3-dead-code)
4. [DRY Violations](#4-dry-violations)
5. [Oversized Functions](#5-oversized-functions)
6. [Separation of Concerns](#6-separation-of-concerns)
7. [Inconsistencies](#7-inconsistencies)
8. [Refactoring Opportunities](#8-refactoring-opportunities)

---

## 1. Bugs & Data Issues

| # | Severity | File | Line(s) | Issue | Impact |
|---|----------|------|---------|-------|--------|
| 1 | 🟡 Low | `data.js` | ~160 | **Martinique services has a double comma:** `["tavern", , "shipyard", "crew", "missions"]` — creates an `undefined` entry in the array. | `port.services.includes("shipyard")` still works, but iterating the array will encounter `undefined`. |
| 2 | 🔴 High | `storage.js` | ~120-140 | **`getStartingShip`, `getStartingGold`, `initializeReputation`, `getStartingReputation`** reference bare `PORTS` and `SHIPS` — these are NOT in scope (the IIFE doesn't destructure from `window.D`). Would throw `ReferenceError` if called. | Theoretical crash — but these are dead code (see §3). Still should be removed. |
| 3 | 🟡 Medium | `screens_voyage.jsx` | 6 | **Imports `UPGRADES`** from `window.D`: `const { PORTS, SHIPS, FACTIONS, UPGRADES } = window.D;` — but `UPGRADES` does not exist in `data.js`. `UPGRADES` is `undefined`. | Silent — `undefined` is assigned but if ever referenced explicitly it will blow up. |
| 4 | 🔴 **High** | `screens_voyage.jsx` | 365 | **`state.ship.upgrades.length > 0`** — `state.ship.upgrades` is `undefined` after the equipment migration. | **Active crash risk.** If a player enters battle, BattleScreen will throw `TypeError: Cannot read properties of undefined (reading 'length')`. ErrorBoundary catches it but causes a broken experience. |
| 5 | 🟡 Low | `logic.js` | (grapple) | **`console.log` left in production** inside `resolvePlayerAction` grapple case: `console.log("enemy object passed to generateEnemyCargo:", ...)` | Console noise in production. |
| 6 | 🟡 Low | `data.js` / `engine_combat.js` | — | **`PATROL_FINE_RATE`** is defined in `data.js` but **not included in the return block** — orphaned constant. `engine_combat.js` accesses `D.PATROL_FINE_RATE` which is `undefined`, saved by fallback `\|\| 0.50`. | Works by accident. Intended constant value is lost. |
| 7 | 🟡 Medium | `logic.js` | (getShipStats) | Uses `D.SHIPS` and `D.EQUIPMENT` in some paths, but `D` is never defined in `logic.js` scope. The IIFE destructures `SHIPS` and `EQUIPMENT` from `window.D`, but later code references `D.*` directly. | May work via other closures or may silently fail. Needs verification per code path. |

### Recommended Fixes (Bugs)

```diff
# Bug 1 — data.js: Martinique double comma
- services: ["tavern", , "shipyard", "crew", "missions"],
+ services: ["tavern", "shipyard", "crew", "missions"],

# Bug 3+4 — screens_voyage.jsx
# Line 6: remove UPGRADES import
- const { PORTS, SHIPS, FACTIONS, UPGRADES } = window.D;
+ const { PORTS, SHIPS, FACTIONS } = window.D;

# Line 365: delete entire upgrades display block in BattleScreen
- {state.ship.upgrades.length > 0 && <div style={{ marginTop: 5, display: "flex", gap: 4, flexWrap: "wrap" }}>
-   {state.ship.upgrades.map(u => <Pill key={u} label={UPGRADES[u]?.name ?? u} color={T.blueBr} />)}
- </div>}

# Bug 5 — logic.js: remove console.log
- console.log("enemy object passed to generateEnemyCargo:", ...);

# Bug 6 — data.js: export PATROL_FINE_RATE
# Add to the return block:
+ PATROL_FINE_RATE,
```

---

## 2. Upgrade System Leftovers

The old "upgrades" system (per-ship upgrade array) was replaced by the "equipment" system (slot-based with install/remove/locker). Several references to the old system remain.

### 🔴 Actionable Items

| # | File | Line | Code | Action |
|---|------|------|------|--------|
| 1 | `screens_voyage.jsx` | L6 | `const { PORTS, SHIPS, FACTIONS, UPGRADES } = window.D;` | **Remove `UPGRADES`** — it's `undefined`, the constant doesn't exist. |
| 2 | `screens_voyage.jsx` | L365 | `{state.ship.upgrades.length > 0 && ...}` | 🔴 **Active crash risk.** `state.ship.upgrades` is `undefined`. **Delete the entire block.** |
| 3 | `storage.js` | L128 | `upgrades: []` inside `getStartingShip` (ship bonus path) | **Dead code** — `getStartingShip` is never called (old init system). Delete the whole function. |
| 4 | `storage.js` | L137 | `upgrades: []` inside `getStartingShip` (default sloop path) | Same — delete with the function. |
| 5 | `engine_core.js` | L108-109 | `// discard old upgrades silently` + `delete s.ship.upgrades;` | ✅ **Correct migration code** — cleans up old saves. **Keep for backward compatibility.** |

### 🟡 Acceptable Uses (not bugs)

| File | Line | Code | Verdict |
|------|------|------|---------|
| `App.jsx` | L95 | `"Spent on repairs, crew wages, provisions, and upgrades."` | HUD tooltip — generic English word. Consider rewording to "equipment". |
| `App.jsx` | L103 | `"Gates ships, upgrades, and missions."` | Fame tooltip — same, consider rewording. |
| `screens_shipyard.jsx` | L109 | `"This is where you upgrade your ship"` | Tutorial text — means "improve", not the old system. ✅ Fine. |
| `screens_voyage.jsx` | L36 | `"Upgrade at a Shipyard when you can afford it."` | Map tutorial — same. ✅ Fine. |

### Recommended Tooltip Polish

```diff
# App.jsx — optional terminology update
- gold: "Your gold. Spent on repairs, crew wages, provisions, and upgrades.",
+ gold: "Your gold. Spent on repairs, crew wages, provisions, and equipment.",

- fame: "Fame — your permanent reputation. Gates ships, upgrades, and missions.",
+ fame: "Fame — your permanent reputation. Gates ships, equipment, and missions.",
```

---

## 3. Dead Code

| File | What | Why It's Dead |
|------|------|---------------|
| `storage.js` | `initializeReputation()` | Old init system from before scenarios. `START_GAME` in `engine_port.js` handles all initialization now. Also **broken** (references bare `PORTS`). |
| `storage.js` | `getStartingShip()` | Same — old init, never called. Contains `upgrades: []` vestige. |
| `storage.js` | `getStartingGold()` | Same — old init, never called, broken references. |
| `storage.js` | `getStartingReputation()` | Same — old init. |
| `storage.js` | `saveGame()` / `loadGame()` | Superseded — save/load is handled directly via `localStorage` in `engine_core.js` reducer. |
| `logic.js` | `canAfford(state, cost)` | Trivial wrapper for `state.gold >= cost`. No callers outside the export. |
| `logic.js` | `updateReputation(state, port, delta)` | Superseded by `applyReputationImpact()` which handles faction-wide updates. No callers. |
| `logic.js` | `crewWithTag(roster, tag)` | Exported but never imported or called anywhere in the codebase. |
| `generators.js` | `goodKeys` variable in `generatePortMarket` | Declared (`Object.keys(resources)`) but never used — `colOrder` is used instead. |
| `data.js` | `PATROL_FINE_RATE` | Defined inside the IIFE but not included in the `return {}` block — invisible to all consumers. |

### Estimated Cleanup

Removing all dead code above eliminates **~80-100 lines** across 3 files and removes 2 broken function references.

---

## 4. DRY Violations

### 4a. Back Button — repeated 8+ times

Every screen has this identical ~8-line inline style block:

```jsx
<button onClick={() => dispatch({ type: A.NAVIGATE, screen: "port" })}
  style={{ alignSelf: "flex-start", background: T.panel,
    border: `1px solid ${T.gold}`, color: T.gold,
    padding: "6px 12px", borderRadius: 3, cursor: "pointer",
    fontSize: 12, fontFamily: T.font, marginBottom: 10 }}>
  ← Back to Port
</button>
```

**Files affected:** `screens_crew.jsx`, `screens_market.jsx`, `screens_port.jsx` (×3), `screens_shipyard.jsx`, `screens_voyage.jsx` (×1)

**Fix:** Extract a `<BackButton>` component in `ui.jsx`:
```jsx
const BackButton = ({ dispatch, screen = "port", label = "← Back to Port" }) => (
  <Btn v="ghost" onClick={() => dispatch({ type: window.E.A.NAVIGATE, screen })}
    style={{ alignSelf: "flex-start", marginBottom: 10 }}>{label}</Btn>
);
```

### 4b. Services Blocked Guard — duplicated in 2 screens

`screens_crew.jsx` and `screens_shipyard.jsx` both have an identical early-return pattern:
```jsx
if (perk.servicesBlocked) {
    return (
        <div style={{ padding: 14, ... }}>
            <BackButton />
            <EmptyState message="⚔ You are at war..." />
        </div>
    );
}
```

**Fix:** Shared `<ServicesBlockedGuard dispatch={dispatch} message="...">` wrapper component.

### 4c. Voyage Helper 8-Parameter Pattern

In `engine_voyage.js`, five functions all take the same 8 positional parameters:
```js
maybeSmugglePatrol(state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems)
maybeMissionEncounter(state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems)
maybeRandomEvent(...)
checkRandomPatrol(...)
maybeDrunkardEvent(...)
```

**Fix:** Bundle into a `dayContext` object:
```js
const ctx = { days, wind, gold, rep, morale, roster, holdItems };
maybeSmugglePatrol(state, ctx);
```

### 4d. "isWarPennantMission" Check — duplicated

Identical logic in both `engine_port.js` (`COMPLETE_MISSION`) and `engine_combat.js` (`DISMISS_BATTLE`):
```js
const isWarPennantMission = (mission.type === "combat" || mission.type === "patrol"
    || mission.type === "assault") && !mission.starter;
```

**Fix:** `L.isWarPennantEligible(mission)` in `logic.js`.

### 4e. Name List Formatting (1/2/many) — 7+ occurrences

The pattern of formatting name lists for log entries appears 7+ times:
```js
if (names.length === 1) return names[0];
else if (names.length === 2) return `${names[0]} and ${names[1]}`;
else return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
```

**Fix:** `L.formatNameList(names)` utility in `logic.js`.

### 4f. Tutorial Popup Boilerplate — every screen

Every screen repeats:
```jsx
const [showTutorial, setShowTutorial] = React.useState(() => shouldShowTutorial("X"));
// ...
{showTutorial && (
  <TutorialPopup title="..." onDismiss={(disableAll) => {
    markTutorialSeen("X", disableAll);
    setShowTutorial(false);
  }}>...</TutorialPopup>
)}
```

**Fix:** Custom hook:
```jsx
const { showTutorial, dismissTutorial } = useTutorial("screenName");
// renders: {showTutorial && <TutorialPopup onDismiss={dismissTutorial}>...</TutorialPopup>}
```

### 4g. Scar Variant Arrays — identical ×3

In `generators.js`, `scarVariants.scar_battle`, `scarVariants.scar_storm`, and `scarVariants.scar_shipwreck` are **identical arrays** (same 4 template functions). Only the scar label differs.

**Fix:** One shared template array, parameterized by scar type label.

---

## 5. Oversized Functions

| Function / Case | File | ~Lines | Recommendation |
|---|---|---|---|
| `RESOLVE_EVENT` | `engine_combat.js` | **~200** | Extract: `applyEventOutcome(state, choice)`, `applyMutinyOutcome(state, choice)`, `applyCargoOutcome(state, cargo)` |
| `BATTLE_ACTION` | `engine_combat.js` | **~150** | Extract: `handleInstantVictory(state, outcome)`, `handleSinkVictory(state, bs, outcome)`, `handleDefeatOutcome(state, bs)`, `handleCombatContinue(state, bs, outcome)` |
| `COMPLETE_MISSION` | `engine_port.js` | **~100** | Extract: `calculateMissionReward(state, mission)`, `applyTraitEffects(state, mission)` |
| `buildEncounterContext` | `logic.js` | **~130** | The 4 "blocked types" arrays (`noFleeTypes`, `noParleyTypes`, `noBribeTypes`, `noSurrenderTypes`) are nearly identical — consolidate into a single data table |
| `generateCrewBio` | `generators.js` | **~200** | Move `specialSentences`, `scarVariants`, `traitVariants` to `data_text.js`. Keep the assembly logic in `generators.js`. |
| `ADVANCE_DAY` | `engine_voyage.js` | ~60 | ✅ Already well-factored with helper functions. No action needed. |

---

## 6. Separation of Concerns

### 6a. Mutating `nextState` in Port Helpers

`processDesertion(nextState, state)` and `processPositiveTraits(nextState, state)` in `engine_port.js` **mutate** `nextState` directly:
```js
nextState.log = [...];
nextState.crew = { ... };
```

This breaks the immutable reducer pattern and makes bugs harder to trace.

**Fix:** Return a patch object:
```js
const patch = processDesertion(state);
return { ...nextState, ...patch };
```

### 6b. RANDOM_EVENTS Contains Logic Functions

`data.js` claims to be "No logic, no functions. Pure data." but `RANDOM_EVENTS` entries have:
```js
condition: (state) => state.crew.morale < 40,
```

**Assessment:** Pragmatic and acceptable. Moving conditions to `logic.js` would add indirection without real benefit. **Keep as-is** but update the header comment to acknowledge the exception.

### 6c. `screens_port.jsx` Contains 5 Screens

`TitleScreen`, `ScenarioScreen`, `PortScreen`, `StatusScreen`, `JournalScreen` — 700+ lines / 4500+ tokens in one file.

Only `PortScreen` truly belongs to "port-zone." The others are navigation/info screens.

**Fix:** Split into:
- `screens_title.jsx` → `TitleScreen` + `ScenarioScreen`
- `screens_info.jsx` → `StatusScreen` + `JournalScreen`
- `screens_port.jsx` → `PortScreen` only

---

## 7. Inconsistencies

| What | Where | Details |
|------|-------|---------|
| **D.SHIPS vs SHIPS** | `logic.js` | Uses both `D.SHIPS` (which may be undefined in scope) and the destructured `SHIPS` from `window.D`. Pick one — since `logic.js` destructures at the top, use `SHIPS` consistently. |
| **logEntry usage** | All engine files | Some log lines use `window.E.logEntry(state, msg)` (adds `[day]` prefix); others push raw strings. The Journal parser expects `[N] text` format. Raw strings won't get day stamps. |
| **Function vs arrow** | Screen files | `MapScreen` and `BattleScreen` use `function` declarations; `InterceptScreen` and `MarketScreen` use `const ... = () =>`. Pick one convention per file for consistency. |
| **`PATROL_FINE_RATE`** | `data.js` → `engine_combat.js` | Defined in `data.js` but not exported. Used with fallback `\|\| 0.50` in `engine_combat.js`. Should be exported or moved to engine. |
| **Bribe cost** | `buildEncounterContext` | Computed as `Math.round((enemy.gold ?? 500) * 0.4)` but `enemy.gold` is rarely set on generated enemies (set on mission enemies only). Usually falls back to `Math.round(500 * 0.4) = 200g`. May be intentional but should be documented. |
| **`description` vs `desc`** | Mission objects | `screens_port.jsx` L304 checks `m.description || m.desc`. Generator sometimes uses `description`, sometimes `desc`. Standardize on one key. |

---

## 8. Refactoring Opportunities

| Priority | Change | Impact | Effort | Files |
|---|---|---|---|---|
| 🟢 Quick | Extract `<BackButton>` component in `ui.jsx` | Removes ~80 lines duplication | 15 min | `ui.jsx` + 5 screen files |
| 🟢 Quick | Delete dead code from `storage.js` (4 init functions + old save/load) | Removes ~60 lines, eliminates broken refs | 10 min | `storage.js` |
| 🟢 Quick | Fix Martinique double comma | Data fix | 2 min | `data.js` |
| 🟢 Quick | Remove `UPGRADES` import + `state.ship.upgrades` block | Fixes crash bug | 5 min | `screens_voyage.jsx` |
| 🟢 Quick | Export `PATROL_FINE_RATE` from `data.js` | Fixes orphaned constant | 2 min | `data.js` |
| 🟢 Quick | Remove `console.log` from grapple | Cleanup | 1 min | `logic.js` |
| 🟢 Quick | Remove dead functions from `logic.js` exports (`canAfford`, `updateReputation`, `crewWithTag`) | Smaller API surface | 5 min | `logic.js` |
| 🟡 Medium | Extract `L.formatNameList(names)` helper | Removes 7+ copy-paste blocks | 20 min | `logic.js` + engine files |
| 🟡 Medium | Bundle voyage day-advance params into `dayContext` object | Cleaner signatures, easier to extend | 30 min | `engine_voyage.js` |
| 🟡 Medium | Extract `applyEventOutcome()` from `RESOLVE_EVENT` | Biggest reducer case becomes testable | 45 min | `engine_combat.js` |
| 🟡 Medium | Consolidate `noFleeTypes`/`noParleyTypes`/`noBribeTypes`/`noSurrenderTypes` into a data table | 4 nearly-identical arrays → 1 lookup | 20 min | `logic.js` |
| 🟡 Medium | Extract `L.isWarPennantEligible(mission)` | Removes duplicated check | 10 min | `logic.js`, `engine_port.js`, `engine_combat.js` |
| 🟡 Medium | Standardize `description` vs `desc` in mission objects | Eliminates `m.description \|\| m.desc` fallback | 15 min | `generators.js`, `screens_port.jsx` |
| 🟠 Larger | Make `processDesertion` / `processPositiveTraits` pure (return patch) | Better reducer hygiene, testability | 45 min | `engine_port.js` |
| 🟠 Larger | Split `screens_port.jsx` into 3 files | Better organization, faster comprehension | 30 min | `screens_port.jsx` → 3 files + `index.html` |
| 🟠 Larger | Create `useTutorial("screenName")` custom hook | Removes 8× boilerplate blocks | 30 min | `logic.js` or new `hooks.js` + all screen files |
| 🔵 Optional | Move `scarVariants`, `traitVariants`, `specialSentences` to `data_text.js` | Cleaner text/logic separation | 20 min | `generators.js`, `data_text.js` |
| 🔵 Optional | Convert `GOODS_AVAILABILITY` from positional arrays to named objects | Eliminates fragile column-index dependency | 30 min | `data.js`, `generators.js` |
| 🔵 Optional | Update App.jsx tooltips "upgrades" → "equipment" | Terminology consistency | 2 min | `App.jsx` |

### Summary

| Priority | Items | Total Effort |
|---|---|---|
| 🟢 Quick wins | 7 items | ~40 min |
| 🟡 Medium refactors | 6 items | ~2.5 hrs |
| 🟠 Larger refactors | 3 items | ~2 hrs |
| 🔵 Optional polish | 3 items | ~1 hr |

---