# Logic Module Specification

**Broadside Pure Functions & Storage Helpers**
*Last Updated: June 27, 2026*

---

## 1. Overview

| File | Namespace | Contents |
|---|---|---|
| `logic.js` | `window.L` | **Pure functions**: game math, combat, reputation, travel, fame, equipment, crew tags, log classification, encounter context |
| `storage.js` | extends `window.L` | **Storage helpers**: Save/load encoding, tutorial state management, localStorage I/O |

**Core Principles:**

- **`logic.js`** contains **zero side-effects**. Every function is `(input) -> output` with no mutation, no DOM access, no `Math.random()`.
  - **Exception**: `roll()` is the sole exception (uses `Math.random()` for dice rolls in encounter context building).
- **`storage.js`** extends the same `window.L` namespace with **localStorage I/O helpers**. These are the **only functions in `window.L` with side effects**.
- **Dependencies**: Both files may read `window.D` (data constants). Neither may call Engine, Generator, or UI code.
- **Load Order**: `logic.js` loads first, then `storage.js` extends `window.L`.

---

## 2. General Helpers

### roll(sides)

- **Purpose**: Deterministic dice roll helper (used in encounter context building).
- **Input**: `sides` (number)
- **Output**: `number` (1 to `sides`, inclusive)
- **Note**: Despite being in `logic.js`, this uses `Math.random()`. It is the **sole exception** to the pure-function rule, kept here to avoid a circular dependency with `buildEncounterContext` in `generators.js`.

---

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

---

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

---
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

---
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

---
### getEffectiveMorale(state)

- **Purpose**: Returns morale including equipment bonuses.
- **Output**: `number` (capped at 100)
- **Formula**: `Math.min(100, state.crew.morale + equipmentMoraleBonus)`
- **Note**: Equipment bonuses are summed via `getEquipmentEffect(state, "moraleBonus")`.

---
### meetsRequirement(state, item)

- **Purpose**: Checks if player meets fame/hull requirements for a ship or equipment item.
- **Input**: `item` (object from `D.SHIPS` or `D.EQUIPMENT`)
- **Output**: `{ allowed: boolean, reason: string | null }`
- **Checks**:
  - Player `fame >= item.requiredFame` (if set)
  - Ship `maxHull >= item.requiredHull` (if set)

---
### canBribe(state)

- **Purpose**: Checks if player can bribe (infamy < 50).
- **Output**: `boolean`
- **Formula**: `state.infamy < 50`

---
### returnScreen(state)

- **Purpose**: Determines the correct screen to return to after events/combat.
- **Output**: `"sailing"` if `destination + sailingDaysLeft > 0`, else `"port"`

---
## 3. Ship & Equipment Functions

### getShipStats(state)

- **Purpose**: Computes effective ship stats including all equipment bonuses.
- **Output**:
  ```js
  {
    maxHull: number,      // Base hull * (1 + sum of hullBonus) - sum of hullPenalty
    cannons: number,      // Base cannons + sum of cannonBonus
    speed: number,        // Base speed + sum of speedBonus - sum of speedPenalty
    holdCapacity: number, // Base hold * (1 + sum of holdPct)
    moraleBonus: number   // Sum of moraleBonus from equipment
  }
  ```
- **Logic**:
  1. Start with base stats from `D.SHIPS[state.ship.type]`.
  2. Iterate all installed equipment across all slots.
  3. Apply effects:
     - `hullBonus`/`hullPenalty`: **Multiplicative** on base hull.
     - `cannonBonus`/`speedBonus`/`speedPenalty`: **Additive**.
     - `holdPct`: **Multiplicative** on base hold.
  4. Return computed stats object.

**Example:**
```js
// Base sloop: hull 100, cannons 10, speed 11, hold 200
// + reinforced_hull (hullBonus: 0.2): hull = 100 * 1.2 = 120
// + extra_cannons (cannonBonus: 2): cannons = 10 + 2 = 12
// + expanded_hold (holdPct: 0.20): hold = 200 * 1.2 = 240
```

---
### getEquipmentEffect(state, effectKey)

- **Purpose**: Sums a specific effect across all installed equipment.
- **Input**:
  - `effectKey` (string): One of `"hullBonus"`, `"hullPenalty"`, `"cannonBonus"`, `"speedBonus"`, `"speedPenalty"`, `"holdPct"`, `"moraleBonus"`, `"crewLossMult"`, `"combatHeatMult"`, `"repGainBonus"`, etc.
- **Output**: `number`
- **Note**:
  - `combatHeatMult` and `crewLossMult` are **multiplicative** (default 1.0).
  - All others are **additive** (default 0).

---
### canInstallEquipment(state, equipKey)

- **Purpose**: Validates whether equipment can be installed on current ship.
- **Output**: `{ ok: boolean, reason: string | null }`
- **Checks**:
  1. Equipment exists in `D.EQUIPMENT[equipKey]`.
  2. Player `fame >= equipment.requiredFame` (if set).
  3. Ship `maxHull >= equipment.requiredHull` (if set).
  4. Ship has available slot of the correct type (e.g., `equipment.slot === "hull"`).
  5. Equipment is not already installed on this ship.

---
### getHoldCapacity(state)

- **Purpose**: Returns computed hold capacity from ship stats + equipment.
- **Output**: `number`
- **Note**: **Never use `state.hold.capacity` directly**—it may be stale. Always use this function.

---
### getHoldUsed(state)

- **Purpose**: Returns total items currently in hold.
- **Output**: `number` (sum of all `state.hold.items` values)

---
### getRepairCost(state)

- **Purpose**: Returns gold cost to fully repair hull.
- **Output**: `number`
- **Formula**:
  ```js
  baseCost = (maxHull - currentHull) * 2;
  repairMult = L.getRepPerk(reputation).repairMult;
  eqRepairPct = L.getEquipmentEffect(state, "repairCostPct") || 0;
  cost = Math.floor(baseCost * repairMult * (1 + eqRepairPct));
  ```

---
## 4. Travel & Navigation Functions

### travelDays(fromPort, toPort, state)

- **Purpose**: Calculates days needed to travel between two ports.
- **Output**: `number` (minimum 1)
- **Formula**:
  ```js
  baseDays = distance / shipSpeed;
  + morale modifier: +1 if morale < 50, +1 more if morale < 30
  + wind modifier: -1 if favorable wind (angle diff < 60°), +1 if opposing (angle diff > 120°)
  + equipment modifier: -`longVoyageDayReduction` if voyage > 4 days (from `navigation_tools`)
  + hold load modifier: speed penalty if hold > 50% full (see `getHoldSpeedMultiplier`)
  result = Math.max(1, baseDays + modifiers)
  ```

---
### canReach(state, portKey)

- **Purpose**: Checks if a port is reachable from current position.
- **Output**: `boolean`
- **Checks**:
  1. **Hidden guard**: Port must be in `state.discoveredPorts` (or not hidden).
  2. **Hull guard**: Ship `maxHull >= PORTS[portKey].minHull` (if set).
  3. **Range guard**: `travelDays(state.currentPort, portKey, state) <= state.ship.maxDays`.

---
### getUnreachableReason(state, portKey)

- **Purpose**: Returns a human-readable reason if a port is unreachable.
- **Output**: `string | null`
- **Possible Reasons**:
  - `"Port not yet discovered"` (hidden port)
  - `"Ship too small to reach this port"` (minHull requirement)
  - `"Voyage exceeds ship's maximum days at sea"` (range requirement)

---
### canSeePort(state, portKey)

- **Purpose**: Checks if a hidden port's unlock conditions are met.
- **Output**: `boolean`
- **Logic**: Reads `PORTS[portKey].unlockCondition` and evaluates each condition against `state`:
  - `"fame"`: `state.fame >= value`
  - `"infamy"`: `state.infamy >= value`
  - `"reputation"`: Average reputation for faction ports >= value
  - `"item"`: `state.mapFragments.includes(value)`
  - Combines conditions with `type: "any"` (OR) or `type: "all"` (AND).

---
## 5. Reputation Functions

### getRepPerk(rep)

- **Purpose**: Returns gameplay effects based on reputation tier.
- **Input**: `rep` (number, 0-100)
- **Output**:
  ```js
  {
    label: string,          // "At War" | "Hostile" | "Neutral" | "Friendly" | "Allied"
    repairMult: number,     // 1.0 (At War/Hostile) | 0.9 (Neutral) | 0.8 (Friendly) | 0.7 (Allied)
    missionMult: number,    // 0.0 (At War) | 0.75 (Hostile) | 1.0 (Neutral) | 1.1 (Friendly) | 1.2 (Allied)
    servicesBlocked: boolean, // true if At War (rep < 10)
    missionsBlocked: boolean  // true if At War or Hostile (rep < 30)
  }
  ```

| Tier | Range | Label | Repair Discount | Mission Gold | Services | Missions |
|---|---|---|---|---|---|---|
| 0 | 0-9 | At War | +0% (blocked) | +0% (blocked) | Blocked | Blocked |
| 1 | 10-29 | Hostile | +0% | -25% | Open | Blocked |
| 2 | 30-49 | Neutral | +0% | +0% | Open | Open |
| 3 | 50-79 | Friendly | -10% | +10% | Open | Open |
| 4 | 80-100 | Allied | -20% | +20% | Open | Open |

---
### decayReputation(state)

- **Purpose**: Daily reputation decay for ports above 50.
- **Output**: New `reputation` object
- **Logic**: For each port, if `reputation[port] > 50`, decrement by 1 (toward 50).

---
### applyReputationImpact(state, repImpact)

- **Purpose**: Applies faction-wide reputation changes.
- **Input**: `repImpact` — `{ [factionKey]: deltaNumber }`
- **Logic**: For each faction in `repImpact`, adjusts reputation of **all ports** belonging to that faction. Clamps to 0-100.
- **Example**:
  ```js
  // Input: { spanish: -5 }
  // Output: All Spanish ports (havana, cartagena, etc.) have reputation -= 5
  ```

---
## 6. Crew Functions

### payCrewWages(state)

- **Purpose**: Calculates daily crew wage cost.
- **Output**: `number` (gold cost)
- **Formula**: `2g * roster.length` (×1.5 if `morale < 30`)

---
### removeRandomCrew(roster, count)

- **Purpose**: Removes `count` random crew members from roster.
- **Output**: `{ newRoster: CrewMember[], removed: CrewMember[] }`
- **Note**: Preserves order of remaining crew.

---
### Tag Operations

All tag operations are **immutable**—they return new objects, never mutate.

| Function | Signature | Purpose | Example |
|---|---|---|---|
| `hasTag` | `(member, tag) -> boolean` | Checks if crew member has a tag | `L.hasTag(crew, "loyal")` |
| `addTag` | `(member, tag) -> CrewMember` | Returns new member with tag added | `L.addTag(crew, "scar_battle")` |
| `removeTag` | `(member, tag) -> CrewMember` | Returns new member with tag removed | `L.removeTag(crew, "upset")` |
| `revealTag` | `(member, traitName) -> CrewMember` | Swaps `hidden_X` to `revealed_X` | `L.revealTag(crew, "drunkard")` → converts `hidden_drunkard` to `revealed_drunkard` |

---
### getCrewAlignment(state, faction)

- **Purpose**: Returns the ratio of crew belonging to a specific faction.
- **Output**: `number` (0.0 to 1.0)
- **Formula**: `crewOfFaction.length / roster.length`

---
### getAlignmentModifier(state, faction)

- **Purpose**: Returns morale modifier based on crew faction alignment.
- **Output**: `number`
- **Formula**: `0.5 + getCrewAlignment(state, faction)`
- **Usage**: Used in combat and desertion calculations (e.g., Spanish crew penalize morale for attacking Spanish ships).

---
## 7. Event & Patrol Functions

### triggerRandomEvent(state)

- **Purpose**: Filters `D.RANDOM_EVENTS` by `condition(state)`, picks a random eligible event.
- **Output**: `event object | null`
- **Note**: Does **not** roll the 10% chance (handled in `engine_voyage.js`). Only filters and selects.

---
### maybeRandomPatrol(state)

- **Purpose**: Determines if a random navy patrol intercepts the player during sailing.
- **Output**: `boolean`
- **Formula**:
  ```js
  baseChance = 0.01;
  infamyBonus = state.infamy / 400;       // +0.25% per infamy point
  heatBonus = maxFactionAlert * 0.03;    // +3% per heat level
  repDampening:
    - Allied (>=80): patrol chance × 0.5
    - Friendly (>=50): patrol chance × 0.75
    - Hostile/Neutral (<50): patrol chance × 1.0
  finalChance = min(0.40, baseChance + infamyBonus + heatBonus) * repDampening;
  ```

---
## 8. Combat Functions

### getNPCAction(enemy)

- **Purpose**: Selects NPC combat action based on weighted random.
- **Output**: `"broadside" | "precision" | "grapple"`
- **Weights**: 70% broadside, 25% precision, 5% grapple.

---
### resolveCombatAction(state, playerAction)

- **Purpose**: Orchestrates a full combat round.
- **Input**:
  - `playerAction`: `"broadside" | "precision" | "grapple" | "evade"`
- **Output**: `battleState` updates (playerHull, enemyHull, playerCrew, enemyCrew, log, etc.)
- **Flow**:
  1. Get NPC action via `getNPCAction`.
  2. Resolve player action damage (based on action type).
  3. Resolve NPC action damage.
  4. Apply morale modifiers.
  5. Apply equipment effects (`crewLossMult` from Surgeon’s Bay).
  6. Return updated `battleState`.

---
### Combat Action Effects

| Action | Hit Chance | Damage Formula | Damage Distribution | Special |
|---|---|---|---|---|
| **Broadside** | 100% | `0.8–1.2 × cannons` | 60% hull, 40% crew | Reliable, consistent |
| **Precision** | 70% | `1.2–1.8 × cannons` | 90% hull, 10% crew | High hull damage, can miss |
| **Grapple** | Crew-based | — | — | Success = instant victory. Chance = `(playerCrew / enemyCrew) * (playerHullPct) * (morale/100)`. Failure = lose crew. |
| **Evade** | Speed-based | — | — | Success = flee. Chance = `0.6 + (playerSpeed - enemySpeed) * 0.02` (clamped 0.2–0.95). Failure = take 30% enemy broadside damage. |

---
### guessShipType(enemy)

- **Purpose**: Maps enemy cannon count to a ship type for speed lookup.
- **Output**: `string` (ship type key, e.g., `"sloop"`)
- **Logic**: Finds the ship in `D.SHIPS` whose `cannons` is closest to `enemy.cannons`.

---
### buildEncounterContext(state, encounterType, enemy)

- **Purpose**: Builds data-driven options array for the `InterceptScreen`.
- **Output**:
  ```js
  {
    enemy: Object,          // Enemy ship stats
    flavourText: string,    // Narrative text (from D.ENCOUNTER_FLAVOUR)
    type: string,            // Encounter type (e.g., "navy_patrol")
    options: [              // Available actions
      {
        id: string,         // e.g., "fight", "flee"
        label: string,     // Button text
        available: boolean, // Is this option enabled?
        reason: string,    // Why disabled (if !available)
        action: string,     // Action type to dispatch (e.g., "INTERCEPT_FIGHT")
        speedCheck?: {      // For flee option
          player: number,   // Player speed + roll
          enemy: number     // Enemy speed + roll
        },
        cost?: number       // For bribe option
      }
    ]
  }
  ```
- **Note**: The `InterceptScreen` renders these options **directly**—it contains **no game logic**, only UI.

---
## 9. Log Classification Functions

### classifyLogLine(text)

- **Purpose**: Returns an icon/emoji for a log entry based on text content.
- **Output**: `string` (emoji character)
- **Logic**: Pattern-matches against known keywords (e.g., `'battle'` → ⚔️, `'arrived'` → ⚓, `'traded'` → 💰).

---
### getLogTabCategory(text)

- **Purpose**: Returns a category string for journal tab filtering.
- **Output**: `"crew" | "combat" | "ports" | "missions" | "trade" | "other"`
- **Usage**: `JournalScreen` uses this to filter log entries by tab.

---
## 10. Resource & Trade Functions

### getHoldLoadPct(holdItems, capacity)

- **Purpose**: Returns the percentage of hold capacity used.
- **Output**: `number` (0.0 to 1.0+)

---
### getHoldSpeedMultiplier(loadPct)

- **Purpose**: Returns speed multiplier based on hold load.
- **Output**: `number`
- **Thresholds**:
  - `< 50%`: `1.0` (no penalty)
  - `< 75%`: `~1.11` (11% slower)
  - `>= 75%`: `~1.33` (33% slower)

---
### getProvisionConsumptionPerDay(state)

- **Purpose**: Calculates daily food/water consumption.
- **Output**: `{ food: number, water: number }`
- **Formula**: `Math.ceil(crewCount / 10)` for both food and water.

---
### getDaysOfProvisions(holdItems, consumption)

- **Purpose**: Returns minimum days of food/water remaining.
- **Output**: `number`

---
### applyLoseCargoPercent(holdItems, pct)

- **Purpose**: Reduces all non-provision goods by `pct%`.
- **Output**: New `holdItems` object
- **Note**: Preserves food/water.

---
### applyLoseContraband(holdItems)

- **Purpose**: Zeros all illegal goods (tobacco, slaves).
- **Output**: New `holdItems` object

---
---
## 11. Storage Functions (storage.js)

**Purpose**: localStorage I/O helpers for **save/load** and **tutorial state**. These are the **only functions in `window.L` with side effects**.

### Save/Load Functions

| Function | Signature | Purpose | Side Effects |
|---|---|---|---|
| `hasSave()` | `() => boolean` | Checks if a saved game exists in `localStorage` | Reads `localStorage.getItem("piratesSave")` |
| `encodeSave(state)` | `(state: Object) => string` | Encodes state for **file export** (not localStorage) | None (pure) |
| `decodeSave(fileContent)` | `(fileContent: string) => { state: Object \| null, tampered: boolean, error: string \| null }` | Decodes and validates an exported save file | None (pure) |
| `checkLocalStorageAvailable()` | `() => boolean` | Tests if localStorage is usable (e.g., not blocked in private mode/iframes) | Writes/reads/deletes a test key |

#### Save File Format
- **LocalStorage Key**: `"piratesSave"`
- **Format**: Raw `JSON.stringify(state)`
- **Exported File Format**:
  ```
  [version]:[payload]:[hash]
  ```
  - `version`: `"v1"` (current)
  - `payload`: Base64-encoded `JSON.stringify(state)`
  - `hash`: SHA-1 hash of `version:payload` (for tamper detection)

---
### Tutorial State Functions

| Function | Signature | Purpose | Side Effects |
|---|---|---|---|
| `loadTutorialState()` | `() => Object` | Loads tutorial progress from `localStorage` | Reads `localStorage.getItem("broadside_tutorial")` |
| `saveTutorialState(tutState)` | `(tutState: Object) => void` | Saves tutorial progress to `localStorage` | Writes `localStorage.setItem("broadside_tutorial", ...)` |
| `getDefaultTutorialState()` | `() => Object` | Returns default tutorial state | None (pure) |
| `shouldShowTutorial(screenName)` | `(screenName: string) => boolean` | Checks if tutorial should show for `screenName` | Reads `localStorage` + `state.tutorialMode` |
| `markTutorialSeen(screenName, disableAll)` | `(screenName: string, disableAll?: boolean) => void` | Marks tutorial as seen, optionally disables all | Writes to `localStorage` |

#### Tutorial State Shape
```js
{
  seenScreens: string[],    // e.g., ["port", "map", "crew"]
  disableAll: boolean        // true if user opted out of all tutorials
}
```

#### Tutorial Mode Integration
Broadside supports **three tutorial modes** (set in `state.tutorialMode`):

| Mode | Value | Behavior |
|------|-------|----------|
| **Guided (QM)** | `"full"` | Quartermaster guides the player; `shouldShowTutorial` always returns `false` (QM handles tutorials). |
| **Hints Only** | `"light"` | Per-screen popups appear until dismissed. Uses `shouldShowTutorial`/`markTutorialSeen`. |
| **None** | `"none"` | No tutorials or popups. `shouldShowTutorial` always returns `false`. |

**Note**: The `seenScreens` array **only applies to `"light"` mode**. In `"full"` mode, the Quartermaster (QM) system in `engine_onboarding.js` manages all onboarding.

---
## 12. Exposed Functions Summary

### From `logic.js` (Pure Functions)

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

### From `storage.js` (Storage Helpers, Side Effects)

| Category | Functions | Side Effects |
|---|---|---|
| **Save/Load** | `hasSave`, `encodeSave`, `decodeSave`, `checkLocalStorageAvailable` | `localStorage` access (except `encodeSave`) |
| **Tutorial** | `loadTutorialState`, `saveTutorialState`, `getDefaultTutorialState`, `shouldShowTutorial`, `markTutorialSeen` | `localStorage` access |

---
## 13. Dependencies

| File | Reads | May NOT Call |
|---|---|---|
| `logic.js` | `window.D` | Engine, Generators, UI |
| `storage.js` | `window.D`, `window.L`, `localStorage` | Engine, Generators, UI |

---
## 14. Usage Rules

1. **No Side Effects in `logic.js`**: All functions must be pure (`(input) => output`). The **only exception** is `roll()`.
2. **Storage in `storage.js`**: All localStorage I/O must go through `storage.js`. Never call `localStorage` directly from other files.
3. **Immutable State**: Never mutate input objects. Always return new objects/arrays.
4. **Error Handling**: Functions interacting with `localStorage` (e.g., `decodeSave`) must handle errors gracefully (return `{ state: null, error: "..." }`).
5. **Tutorial State Isolation**: Tutorial progress (`broadside_tutorial`) is **separate** from game saves (`piratesSave`). Do not mix them.