# Code Quality Audit — `papaladin/broadside`

Repository: https://github.com/papaladin/broadside
Audit consolidation date: May 29, 2026
Source material: Multiple fragmented AI audit outputs merged, deduplicated, and reorganized.

---

# Executive Summary

The repository generally has a coherent architecture, but several recurring issues were identified across multiple audit passes:

* Dead or unreachable code
* Naming inconsistencies
* Duplicate business logic
* Excessive reducer/function complexity
* Magic numbers and hardcoded rules
* Mixed use of custom vs native/random helpers
* State duplication risks

Several findings appeared multiple times across reports and were consolidated below.
Where audits disagreed or proposed different resolutions, both interpretations were preserved.

---

# Severity Overview

| Severity | Description                                                   |
| -------- | ------------------------------------------------------------- |
| Critical | Potential runtime errors, broken flows, or architecture risks |
| High     | Significant maintainability or correctness risks              |
| Medium   | Readability, extensibility, or consistency concerns           |
| Low      | Cosmetic or optional improvements                             |

---

# 1. Critical Issues

## 1.1 Missing `ENCOUNTER_FLAVOUR`

### Location

* `logic.js`
* `data.js`

### Problem

`buildEncounterContext` references `ENCOUNTER_FLAVOUR`, but the constant may not actually exist in `data.js`.

### Impact

Potential runtime errors during encounter generation.

### Suggested Fix

Define `ENCOUNTER_FLAVOUR` in `data.js`.

### Example

```js
const ENCOUNTER_FLAVOUR = {
  navy_patrol: (enemy, rep) =>
    `A ${FACTIONS[enemy.faction]?.label || "Colonial"} patrol hails you!`,
  mission_combat: (enemy, rep) =>
    `${enemy.name} moves to intercept!`,
  default: (enemy, rep) =>
    `A ${enemy.name} moves to intercept.`
};
```

### Note

Different audit passes strongly agreed this is critical.

---

## 1.2 Missing or Dead `SURRENDER_CONSEQUENCE`

### Location

* `data.js`
* `engine.js`

### Conflicting Findings

#### Finding A

`SURRENDER_CONSEQUENCE` is imported/referenced but not defined in `data.js`, causing a potential runtime error.

#### Finding B

`SURRENDER_CONSEQUENCE` is effectively dead code because the reducer case (`INTERCEPT_SURRENDER`) is commented out.

### Suggested Resolution

Two possible directions:

#### Option 1 — Restore Feature

* Add `SURRENDER_CONSEQUENCE`
* Re-enable and implement surrender flow

#### Option 2 — Remove Feature

* Delete import
* Delete commented reducer case
* Remove all references

### Note

This was one of the few major contradictions between audit outputs.

---

## 1.3 Duplicate Patrol Logic

### Location

* `logic.js`
* `engine.js`

### Problem

`maybeRandomPatrol` and `checkRandomPatrol` implement overlapping patrol-generation logic.

### Impact

High maintenance risk and possible logic divergence.

### Recommended Refactor

Centralize all patrol encounter generation into a single function.

### Preferred Direction

```js
const triggerRandomPatrol = (state) => {
  // generate patrol encounter
};
```

### Additional Naming Recommendation

Rename:

```diff
- maybeRandomPatrol
+ triggerRandomPatrol
```

---

# 2. Dead Code & Unused Code

## 2.1 Unused Import: `RESOURCES`

### Location

* `screens_port.jsx`

### Problem

Imported but never referenced.

### Suggested Fix

Remove from destructuring import.

---

## 2.2 Redundant `renderShipStats`

### Location

* `screens_port.jsx`

### Problem

Duplicates logic already handled by `L.getShipStats`.

### Risks

* Hardcoded stat mappings
* Divergence from `SHIPS` schema
* Extra maintenance burden

### Suggested Fix

Delete helper and rely exclusively on:

```js
L.getShipStats(state)
```

---

## 2.3 Unused `PATROL_FINE_RATE`

### Location

* `data.js`

### Problem

Defined but apparently unused.

### Additional Context

Some patrol fine logic hardcodes `0.5` directly in `engine.js`.

### Suggested Fix

Either:

* remove constant entirely
* or replace hardcoded values with the constant

---

## 2.4 Unused `roll` Helper

### Location

* `logic.js`

### Problem

`roll(sides)` has only one call site.

### Conflicting Recommendations

#### Recommendation A

Inline usage entirely.

#### Recommendation B

Keep helper for domain readability (dice semantics).

#### Recommendation C

Replace with:

```js
G.randInt(1, sides)
```

---

## 2.5 Unused `pickMerchantFaction`

### Location

* `engine.js`

### Problem

Defined but never called.

### Suggested Fix

Remove.

---

## 2.6 Unused `MERCHANT_RESCUE_GOLD`

### Location

* `data.js`

### Problem

Defined but never referenced.

### Suggested Fix

Remove.

---

## 2.7 Commented-Out Reducer Case

### Location

* `engine.js`

### Problem

`INTERCEPT_SURRENDER` reducer case is commented out.

### Suggested Fix

Either:

* fully implement
* or delete permanently

---

## 2.8 Potentially Unused `previousPort`

### Location

* `engine.js`

### Problem

Written but never read.

### Suggested Fix

Remove or implement actual usage.

---

## 2.9 Potentially Unused `state.version`

### Location

* `engine.js`

### Problem

Appears intended for save migration but migration logic is commented out.

### Suggested Fix

Either:

* implement migration system
* or remove field

---

# 3. Naming Consistency Issues

---

## 3.1 Generator Naming Inconsistencies

### Location

* `generators.js`

### Problem

Most public functions use `generateX`, but several exceptions exist.

### Recommended Renames

| Current           | Suggested                 |
| ----------------- | ------------------------- |
| `opposingFaction` | `generateOpposingFaction` |
| `pickTargetPort`  | `generateTargetPort`      |

### Conflicting Guidance

#### Audit Group A

Private helpers should also be renamed:

* `pickWeighted` → `generateWeightedPick`
* `pickRandom` → `generateRandomPick`

#### Audit Group B

Private helpers may keep current names since they are internal-only.

### Recommendation

Prefer consistency for exported/public APIs only.

---

## 3.2 Logic Helper Naming

### Location

* `logic.js`

### Problem

Mixed naming conventions:

* `getX`
* `canX`
* `hasX`
* no prefix
* `meetsX`

### Frequently Suggested Renames

| Current            | Suggested                                        |
| ------------------ | ------------------------------------------------ |
| `reputationLabel`  | `getReputationLabel`                             |
| `returnScreen`     | `getReturnScreen`                                |
| `shipRepairCost`   | `getShipRepairCost` or `calculateShipRepairCost` |
| `meetsRequirement` | `isRequirementMet`                               |

### Conflicting Guidance

Some audits recommended:

```txt
Use getX for all pure functions
```

Others recommended:

```txt
Use:
- getX → value retrieval
- canX/isX → boolean checks
- calculateX → computations
```

Second convention is likely cleaner.

---

## 3.3 Event Trigger Naming

### Problem

Mixed prefixes:

* `trigger`
* `maybe`
* `check`

### Suggested Standardization

| Current              | Suggested              |
| -------------------- | ---------------------- |
| `maybeRandomPatrol`  | `triggerRandomPatrol`  |
| `maybeSmugglePatrol` | `triggerSmugglePatrol` |
| `checkRandomPatrol`  | remove entirely        |

---

## 3.4 Action Constant Naming

### Location

* `engine.js`

### Conflicting Suggestions

#### Suggestion Set A

Standardize all actions to semantic verbs:

```txt
INTERCEPT_FIGHT → START_BATTLE
INTERCEPT_FLEE → ATTEMPT_FLEE
INTERCEPT_PARLEY → ATTEMPT_PARLEY
```

#### Suggestion Set B

Current naming is acceptable except:

```txt
PATROL_INSPECT → ALLOW_PATROL_INSPECTION
```

### Additional Suggestion

Generalize:

```txt
ATTACK_PIRATE
ATTACK_MERCHANT
```

into:

```txt
INTERCEPT_ATTACK
```

---

## 3.5 Inconsistent Ship Key

### Problem

Most keys use camelCase or simple lowercase, except:

```txt
ship_of_the_line
```

### Suggested Fix

```txt
shipOfTheLine
```

---

# 4. Duplicate & Redundant Logic

---

## 4.1 Travel Day Logic Duplication

### Location

* `logic.js`
* `engine.js`

### Problem

Travel calculations and wind modifiers are duplicated.

### Suggested Fix

Centralize all travel logic in:

```js
L.travelDays()
```

---

## 4.2 Cargo Validation Duplication

### Location

* `logic.js`
* `engine.js`

### Problem

Validation exists both in:

* `L.validateTrade`
* `CONFIRM_TRADE`

### Suggested Fix

Single source of truth:

```js
L.validateTrade()
```

---

## 4.3 Duplicate Hold Calculations

### Location

* `logic.js`

### Problem

Both:

```js
getHoldUsed()
getHoldLoadPct()
```

sum hold quantities independently.

### Suggested Fix

Reuse:

```js
getHoldUsed()
```

---

## 4.4 Ship Stats Recalculated Multiple Times

### Location

* `App.jsx`
* `screens_port.jsx`
* `screens_voyage.jsx`

### Problem

`L.getShipStats(state)` called repeatedly during same render.

### Suggested Fix

Memoize:

```js
const stats = React.useMemo(
  () => L.getShipStats(state),
  [state.ship.type, state.ship.upgrades]
);
```

---

## 4.5 Duplicate Hold Capacity State

### Location

* `data.js`
* state tree

### Problem

Hold capacity exists both:

* in `SHIPS`
* in `state.hold.capacity`

### Risk

Potential desynchronization after ship upgrades/swaps.

### Suggested Fix

Derive dynamically from ship data only.

---

# 5. Complexity Problems

---

## 5.1 `buildEncounterContext` Too Complex

### Location

* `logic.js`

### Problems

* deeply nested logic
* repeated type arrays
* flee/parley/bribe logic mixed together

### Recommended Refactor

Split into helpers:

```js
canFlee()
canParley()
canBribe()
buildEncounterOptions()
```

### Additional Suggested Improvement

Move encounter rules to data-driven config:

```js
ENCOUNTER_TYPE_RULES
```

---

## 5.2 `generateMissions` Too Large

### Location

* `generators.js`

### Problem

Mixes:

* mission type selection
* enemy generation
* reward calculation
* text generation

### Suggested Split

```js
generateMissionType()
generateMissionRisk()
generateMissionEnemy()
calculateMissionGold()
```

---

## 5.3 `ADVANCE_DAY` Reducer Too Large

### Location

* `engine.js`

### Problem

Handles too many unrelated systems:

* provisions
* morale
* patrols
* discovery
* events
* wind

### Suggested Extraction

```js
applyProvisions()
applyWindChange()
applyCrewMorale()
checkRandomEncounters()
```

---

## 5.4 `resolveCombatAction` Too Complex

### Location

* `logic.js`

### Problems

* deeply nested switches
* embedded morale logic
* magic combat formulas

### Suggested Refactor

Split into:

```js
resolvePlayerAction()
resolveNpcAction()
applyMoraleModifiers()
```

---

# 6. Magic Numbers & Hardcoded Rules

---

## 6.1 Patrol Chance Constants

### Suggested Constants

| Current | Suggested Constant   |
| ------- | -------------------- |
| `0.10`  | `PATROL_BASE_CHANCE` |
| `0.30`  | `PATROL_MAX_CHANCE`  |

---

## 6.2 Reputation Decay Interval

### Problem

Hardcoded:

```js
state.day % 2 === 0
```

### Suggested Constant

```js
REPUTATION_DECAY_INTERVAL = 2
```

---

## 6.3 Combat Damage Formulas

### Problem

Hardcoded combat multipliers.

### Suggested Refactor

Move to:

```js
COMBAT_DAMAGE_FORMULAS
```

---

## 6.4 Repair & Wage Costs

### Suggested Constants

| Current | Suggested              |
| ------- | ---------------------- |
| `2`     | `REPAIR_COST_PER_HULL` |
| `2`     | `CREW_WAGE_BASE`       |

---

## 6.5 Mission Gold Rounding

### Suggested Constant

```js
MISSION_GOLD_ROUNDING = 25
```

---

# 7. Random Helper Standardization

---

## Existing Approaches

| Helper          | Location        |
| --------------- | --------------- |
| `Math.random()` | everywhere      |
| `roll()`        | `logic.js`      |
| `randBetween()` | `generators.js` |
| `randInt()`     | `generators.js` |
| `pickRandom()`  | `generators.js` |

---

## Conflicting Recommendations

### Recommendation A

Delete custom helpers and use native JS directly.

### Recommendation B

Standardize all randomness around:

* `randInt`
* `randBetween`
* `pickRandom`

### Recommendation C

Keep `roll()` for domain semantics (dice behavior).

### Likely Best Compromise

* Keep standardized helper layer
* Keep dice-semantic helpers if game-theme readability matters

---

# 8. Event System Problems

---

## 8.1 `distressed_merchant` Event Not Fully Wired

### Problems

* event not always included in random pool
* reducer actions incomplete
* related actions may be missing

### Suggested Fixes

* ensure included in `RANDOM_EVENTS`
* implement reducer support
* validate action flow

---

## 8.2 Inconsistent Event Structures

### Suggested Improvement

Normalize all events with:

```js
type
condition
```

### Additional Suggestion

Standardize morale fields:

```txt
moraleDelta
```

instead of mixed:

```txt
moraleBonus
moralePenalty
```

---

# 9. State & Persistence Concerns

---

## 9.1 `state.portMarket` Refreshes Instead of Persisting

### Problem

Market stocks regenerate on port entry and do not deplete.

### Impact

Trading exploit / economy inconsistency.

### Suggested Fix

Persist and mutate stock levels after trade actions.

---

# 10. Performance & Architecture Recommendations

---

## Suggested Tooling

### ESLint Rules

* `no-unused-vars`
* `consistent-return`
* naming convention enforcement

### Additional Tooling

* Prettier
* JSDoc
* optional TypeScript migration

---

# 11. Consolidated Recommended Refactor Plan

---

## Phase 1 — Critical Cleanup

1. Fix missing constants
2. Remove dead imports/functions
3. Resolve surrender system ambiguity
4. Consolidate patrol logic

Estimated effort: 1–2 hours

---

## Phase 2 — Duplication Removal

1. Centralize travel logic
2. Centralize trade validation
3. Remove duplicate hold capacity state
4. Reuse hold helpers
5. Memoize ship stats

Estimated effort: 2–3 hours

---

## Phase 3 — Naming Standardization

1. Standardize generator naming
2. Standardize helper naming
3. Standardize action constants
4. Rename inconsistent ship keys

Estimated effort: 1–2 hours

---

## Phase 4 — Complexity Reduction

1. Split `buildEncounterContext`
2. Split `generateMissions`
3. Split `ADVANCE_DAY`
4. Split `resolveCombatAction`
5. Externalize encounter/combat rules

Estimated effort: 3–5 hours

---

# 12. Highest-Value Fixes

The most consistently identified high-value improvements across all audits were:

1. Consolidate patrol logic
2. Remove duplicated trade/travel logic
3. Fix undefined/missing encounter constants
4. Eliminate duplicated hold state
5. Break apart oversized reducers/functions
6. Standardize naming conventions
7. Remove dead code and commented-out features

---
