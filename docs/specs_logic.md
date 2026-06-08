# specs_logic.md -- Logic Module Specification

**Broadside Pure Functions**
*Last Updated: June 8, 2026*

---

## 1. Overview

| File | Namespace | Contents |
|---|---|---|
| `logic.js` | `window.L` | Pure functions: game math, combat, reputation, travel, fame, equipment, crew tags, log classification, encounter context |
| `storage.js` | extends `window.L` | Save/load encoding, tutorial state management (localStorage I/O) |

**Core Principles:**

- `logic.js` contains **zero side-effects**. Every function is `(input) -> output` with no mutation, no DOM access, no `Math.random()`. All RNG lives in `generators.js`.
- `storage.js` extends the same `window.L` namespace with localStorage I/O helpers. Loaded immediately after `logic.js`.
- **Dependencies**: Both files may read `window.D` (data constants). Neither may call Engine, Generator, or UI code.

---

## 2. General Helpers

### roll(sides)

- **Purpose**: Deterministic dice roll helper (used in encounter context building).
- **Input**: `sides` (number)
- **Output**: `number` (1 to sides, inclusive)
- **Note**: Despite being in logic.js, this uses `Math.random()`. It is the **sole exception** to the pure-function rule, kept here because `buildEncounterContext` needs inline randomness and moving it to generators.js would create a circular dependency.

### reputationLabel(rep)

- **Input**: `rep` (number, 0-100)
- **Output**: `string`

| Threshold | Label |
|---|---|
| >= 80 | Allied |
| >= 50 | Friendly |
| >= 30 | Neutral |
| >= 10 | Hostile |
| < 10 | At War |

### getFameInfo(fame)

- **Input**: `fame` (number)
- **Output**: `{ label: string, tier: number }`

| Threshold | Label | Tier |
|---|---|---|
| >= 350 | Immortal | 4 |
| >= 200 | Legendary | 3 |
| >= 100 | Notorious | 2 |
| >= 50 | Recognised | 1 |
| < 50 | Unknown | 0 |

### getInfamyLabel(infamy)

- **Input**: `infamy` (number)
- **Output**: `string`

| Threshold | Label |
|---|---|
| >= 100 | Legendary Outlaw |
| >= 50 | Notorious |
| >= 25 | Wanted |
| >= 10 | Suspect |
| < 10 | Clean |

### getHeatLabel(level)

- **Input**: `level` (number, 0-10)
- **Output**: `string`

| Threshold | Label |
|---|---|
| >= 9 | Manhunt |
| >= 6 | Hunted |
| >= 3 | Active Search |
| >= 1 | Alert |
| 0 | (empty) |

### getEffectiveMorale(state)

- **Purpose**: Returns morale including equipment bonuses.
- **Output**: `number` (capped at 100)
- **Formula**: `Math.min(100, state.crew.morale + equipmentMoraleBonus)`

### meetsRequirement(state, item)

- **Purpose**: Checks if player meets fame/hull requirements for a ship or equipment item.
- **Output**: `{ allowed: boolean, reason: string | null }`

### canBribe(state)

- **Output**: `boolean` -- true if `state.infamy < 50`

### returnScreen(state)

- **Purpose**: Determines the correct screen to return to after events/combat.
- **Output**: `"sailing"` if destination + daysLeft > 0, else `"port"`

---

## 3. Ship & Equipment Functions

### getShipStats(state)

- **Purpose**: Computes effective ship stats including all equipment bonuses.
- **Output**: `{ maxHull, cannons, speed, holdCapacity, moraleBonus, ... }`
- **Logic**:
  1. Start with base stats from `D.SHIPS[state.ship.type]`
  2. Iterate all installed equipment across all slots
  3. Apply effects: `hullBonus`/`hullPenalty` are **multiplicative** on base hull, `cannonBonus`/`speedBonus`/`speedPenalty` are **additive**, `holdPct` is **multiplicative** on base hold
  4. Return computed stats object

```js
// Example:
// Base sloop: hull 100, cannons 10, speed 18, hold 200
// + reinforced_hull (hullBonus: 0.2): hull = 100 * 1.2 = 120
// + extra_cannons (cannonBonus: 2): cannons = 10 + 2 = 12
// + expanded_hold (holdPct: 0.25): hold = 200 * 1.25 = 250
```

### getEquipmentEffect(state, effectKey)

- **Purpose**: Sums a specific effect across all installed equipment.
- **Note**: `combatHeatMult` and `crewLossMult` are **multiplicative** (default 1.0). All others are **additive** (default 0).

### canInstallEquipment(state, equipKey)

- **Purpose**: Validates whether equipment can be installed on current ship.
- **Output**: `{ ok: boolean, reason: string | null }`
- **Checks**:
  1. Equipment exists in `D.EQUIPMENT`
  2. Player fame >= `requiredFame` (if set)
  3. Ship base hull >= `requiredHull` (if set)
  4. Ship has available slot of the correct type
  5. Equipment not already installed on this ship

### getHoldCapacity(state)

- **Purpose**: Returns computed hold capacity from ship stats + equipment.
- **Output**: `number`
- **Note**: Do NOT use `state.hold.capacity` directly -- it may be stale. Always use this function.

### getHoldUsed(state)

- **Purpose**: Returns total items currently in hold.
- **Output**: `number` (sum of all `state.hold.items` values)

### getRepairCost(state)

- **Purpose**: Returns gold cost to fully repair hull.
- **Output**: `number`
- **Formula**: `(maxHull - currentHull) * costPerPoint`, with reputation discount applied via `getRepPerk`.

---

## 4. Travel & Navigation Functions

### travelDays(fromPort, toPort, state)

- **Purpose**: Calculates days needed to travel between two ports.
- **Output**: `number` (minimum 1)
- **Formula components**:
  1. **Base**: Euclidean distance / effective speed
  2. **Morale modifier**: +1 day if morale < 50, +1 more if morale < 30
  3. **Wind modifier**: -1 day if favourable wind (angle diff < 60), +1 day if opposing (angle diff > 120)
  4. **Equipment modifier**: `longVoyageDayReduction` for trips > 4 days
  5. **Hold load**: speed penalty when hold > 50% full
  6. **Floor**: `Math.max(1, result)`

### canReach(state, portKey)

- **Purpose**: Checks if a port is reachable from current position.
- **Output**: `boolean`
- **Three-layer check**:
  1. **Hidden guard**: port not in `discoveredPorts` -> false
  2. **minHull guard**: ship maxHull < port.minHull -> false
  3. **Range guard**: travelDays > ship.maxDays -> false

### getUnreachableReason(state, portKey)

- **Output**: `string | null` (human-readable reason, or null if reachable)

### canSeePort(state, portKey)

- **Purpose**: Checks if a hidden port's unlock conditions are met.
- **Output**: `boolean`
- **Logic**: Reads `PORTS[portKey].unlockCondition` and evaluates each condition (fame, infamy, reputation, item) against current state. Combines with `type: 'any'` (OR) or `type: 'all'` (AND).

---

## 5. Reputation Functions

### getRepPerk(rep)

- **Purpose**: Returns gameplay effects based on reputation tier.
- **Output**: `{ label, repairDiscount, missionGoldMult, servicesBlocked, missionsBlocked }`

| Tier | Range | Label | Repair Discount | Mission Gold | Services | Missions |
|---|---|---|---|---|---|---|
| 0 | 0-9 | At War | 0% | 0% (blocked) | Blocked | Blocked |
| 1 | 10-29 | Hostile | 0% | -25% | Open | Blocked |
| 2 | 30-49 | Neutral | 0% | Standard | Open | Open |
| 3 | 50-79 | Friendly | -10% | +10% | Open | Open |
| 4 | 80-100 | Allied | -20% | +20% | Open | Open |

### decayReputation(state)

- **Purpose**: Daily reputation decay. Ports above 50 decay -1 toward 50.
- **Output**: New reputation object

### applyReputationImpact(state, repImpact)

- **Purpose**: Applies faction-wide reputation changes.
- **Input**: `repImpact` -- `{ [factionKey]: deltaNumber }`
- **Logic**: For each faction in repImpact, adjusts reputation of ALL ports belonging to that faction. Clamps to 0-100.

---

## 6. Crew Functions

### payCrewWages(state)

- **Purpose**: Calculates daily crew wage cost.
- **Formula**: `2g * roster.length` (x1.5 if morale < 30)
- **Output**: `number` (gold cost)

### removeRandomCrew(roster, count)

- **Purpose**: Removes `count` random crew members from roster.
- **Output**: `{ newRoster: [], removed: [] }` (removed contains names for logging)

### Tag Operations

All tag operations are **immutable** -- they return new arrays/objects, never mutate.

| Function | Signature | Purpose |
|---|---|---|
| `hasTag` | `(member, tag) -> boolean` | Checks if crew member has a specific tag |
| `addTag` | `(member, tag) -> member` | Returns new member with tag added (no-op if already present) |
| `removeTag` | `(member, tag) -> member` | Returns new member with tag removed |
| `revealTag` | `(member, traitName) -> member` | Swaps `hidden_X` to `revealed_X` (e.g., `hidden_drunkard` -> `revealed_drunkard`) |

### getCrewAlignment(state, faction)

- **Purpose**: Returns the ratio of crew belonging to a specific faction.
- **Output**: `number` (0.0 to 1.0)
- **Formula**: `crewOfFaction.length / roster.length`

### getAlignmentModifier(state, faction)

- **Purpose**: Returns morale modifier based on crew faction alignment.
- **Output**: `number`
- **Formula**: `0.5 + getCrewAlignment(state, faction)`
- **Usage**: Used in `processDesertion` and crew upset calculations.

---
## 7. Event & Patrol Functions

### triggerRandomEvent(state)

- **Purpose**: Filters `D.RANDOM_EVENTS` by `condition(state)`, picks a random eligible event.
- **Output**: `event object | null`
- **Note**: Does NOT roll the 10% chance -- that is handled in `engine_voyage.js`. This function only filters and selects.

### maybeRandomPatrol(state)

- **Purpose**: Determines if a random navy patrol intercepts the player during sailing.
- **Output**: `boolean`
- **Formula**:
  ```
  baseChance = 0.01
  infamyBonus = infamy / 400      (i.e. +0.25% per infamy point)
  heatBonus = maxFactionAlert * 0.03
  repDampening:
    - Allied (>=80): patrol chance * 0.5
    - Friendly (>=50): patrol chance * 0.75
    - Hostile (<10): patrol chance * 1.0 (no dampening)
  Final = min(baseChance + infamyBonus + heatBonus, 0.40)
  ```

---

## 8. Combat Functions

### getNPCAction(enemy)

- **Purpose**: Selects NPC combat action based on weighted random.
- **Weights**: 70% broadside, 25% precision, 5% grapple
- **Output**: `string` (`"broadside"` | `"precision"` | `"grapple"`)

### resolveCombatAction(state, playerAction)

- **Purpose**: Orchestrates a full combat round.
- **Flow**:
  1. Get NPC action via `getNPCAction`
  2. Resolve player action damage
  3. Resolve NPC action damage
  4. Apply morale modifiers
  5. Apply equipment effects (`crewLossMult` from Surgeon's Bay)
  6. Return updated `battleState`

### Combat Actions

| Action | Hit Chance | Damage | Distribution | Special |
|---|---|---|---|---|
| **Broadside** | 100% | 0.8-1.2 x cannons | 60% hull, 40% crew | Reliable consistent damage |
| **Precision** | 70% | 1.2-1.8 x cannons | 90% hull, 10% crew | High hull damage, can miss |
| **Grapple** | Crew-based | -- | -- | Success = instant victory. Chance based on crew ratio, hull %, morale. Failure = lose crew. |
| **Evade** | Speed-based | -- | -- | Success = flee. Failure = take 30% enemy broadside damage. |

### Evade Formula (Speed-Based)

```
playerSpeed = getShipStats(state).speed
enemySpeed = SHIPS[guessShipType(enemy)].speed
speedBonus = min(0.3, max(-0.3, (playerSpeed - enemySpeed) * 0.02))
fleeChance = min(0.95, max(0.20, 0.6 + speedBonus))
```

- Faster ships have higher flee chance (up to 95%)
- Slower ships can still flee but at reduced chance (minimum 20%)
- Equal speed = 60% base chance

### guessShipType(enemy)

- **Purpose**: Maps enemy cannon count to a ship type for speed lookup.
- **Output**: `string` (ship type key)
- **Logic**: Finds the ship in `D.SHIPS` whose cannon count is closest to `enemy.cannons`.

### buildEncounterContext(state, encounterType, enemy)

- **Purpose**: Builds data-driven options array for the InterceptScreen.
- **Output**: `{ enemy, flavourText, type, options: [{ id, label, available, reason, action }] }`
- **Logic**: Reads `encounterType` to determine which options are available (fight, flee, parley, bribe, surrender, inspect). Each option has an `available` flag and a `reason` string explaining why it's disabled (if applicable).
- **Note**: The InterceptScreen renders these options directly -- it has **no game logic**, only UI.

---

## 9. Log Classification Functions

### classifyLogLine(text)

- **Purpose**: Returns an icon/emoji for a log entry based on text content matching.
- **Output**: `string` (emoji character)
- **Logic**: Pattern-matches against known keywords (e.g., 'battle' -> sword icon, 'arrived' -> anchor, 'traded' -> coin).

### getLogTabCategory(text)

- **Purpose**: Returns a category string for journal tab filtering.
- **Output**: `string` -- one of: `"crew"`, `"combat"`, `"ports"`, `"missions"`, `"trade"`, `"other"`
- **Usage**: JournalScreen uses this to filter log entries by tab.

---

## 10. Resource & Trade Functions

### getHoldLoadPct(holdItems, capacity)

- **Output**: `number` (0.0 to 1.0+) -- used/capacity ratio

### getHoldSpeedMultiplier(loadPct)

- **Output**: `number` (speed multiplier)
- **Thresholds**: < 50% = 1.0, < 75% = ~1.11, >= 75% = ~1.33

### getProvisionConsumptionPerDay(state)

- **Output**: `number` -- `Math.ceil(crewCount / 10)` for both food and water

### getDaysOfProvisions(holdItems, consumption)

- **Output**: `number` -- minimum days of food/water remaining

### applyLoseCargoPercent(holdItems, pct)

- **Purpose**: Reduces all non-provision goods by `pct`%.
- **Output**: New holdItems object

### applyLoseContraband(holdItems)

- **Purpose**: Zeros all illegal goods (tobacco, slaves).
- **Output**: New holdItems object

---

## 11. Storage Functions (storage.js)

`storage.js` extends `window.L` with localStorage I/O helpers. These are the only functions in the L namespace that have side effects.

### Save/Load

| Function | Signature | Purpose |
|---|---|---|
| `hasSave` | `() -> boolean` | Checks if `piratesSave` exists in localStorage |
| `encodeSave` | `(state) -> string` | `JSON.stringify(state)` + simpleHash + base64 encoding for file export |
| `decodeSave` | `(fileContent) -> { state, tampered, error }` | base64 decode + JSON parse + hash verification for file import |
| `checkLocalStorageAvailable` | `() -> boolean` | Test write/read/delete cycle to detect iframe/Safari blocks |

### Tutorial State

| Function | Signature | Purpose |
|---|---|---|
| `loadTutorialState` | `() -> object` | Loads tutorial state from `"broadside_tutorial"` key |
| `saveTutorialState` | `(tutState) -> void` | Saves tutorial state to localStorage |
| `getDefaultTutorialState` | `() -> object` | Returns `{ seenScreens: [], disableAll: false }` |
| `shouldShowTutorial` | `(screenName) -> boolean` | Returns true if screen not yet seen and tutorials not disabled |
| `markTutorialSeen` | `(screenName, disableAll?) -> void` | Marks screen as seen. If `disableAll=true`, disables all future tutorials. |

---

## 12. Exposed Functions Summary

### From logic.js

| Category | Functions |
|---|---|
| **General** | `roll`, `reputationLabel`, `getFameInfo`, `getInfamyLabel`, `getHeatLabel`, `getEffectiveMorale`, `meetsRequirement`, `canBribe`, `returnScreen` |
| **Ship/Equipment** | `getShipStats`, `getEquipmentEffect`, `canInstallEquipment`, `getHoldCapacity`, `getHoldUsed`, `getRepairCost` |
| **Travel** | `travelDays`, `canReach`, `getUnreachableReason`, `canSeePort` |
| **Reputation** | `getRepPerk`, `decayReputation`, `applyReputationImpact` |
| **Crew** | `payCrewWages`, `removeRandomCrew`, `hasTag`, `addTag`, `removeTag`, `revealTag`, `getCrewAlignment`, `getAlignmentModifier` |
| **Events/Patrols** | `triggerRandomEvent`, `maybeRandomPatrol` |
| **Combat** | `getNPCAction`, `resolveCombatAction`, `guessShipType`, `buildEncounterContext` |
| **Log** | `classifyLogLine`, `getLogTabCategory` |
| **Resources** | `getHoldLoadPct`, `getHoldSpeedMultiplier`, `getProvisionConsumptionPerDay`, `getDaysOfProvisions`, `applyLoseCargoPercent`, `applyLoseContraband` |

### From storage.js (extends window.L)

| Category | Functions |
|---|---|
| **Save/Load** | `hasSave`, `encodeSave`, `decodeSave`, `checkLocalStorageAvailable` |
| **Tutorial** | `loadTutorialState`, `saveTutorialState`, `getDefaultTutorialState`, `shouldShowTutorial`, `markTutorialSeen` |

---

## Dependencies

| File | Reads | May NOT call |
|---|---|---|
| `logic.js` | `window.D` | Engine, Generators, UI |
| `storage.js` | `window.D`, `window.L`, `localStorage` | Engine, Generators, UI |