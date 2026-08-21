# Logic Module Specification

**Broadside Pure Functions — 4‑File Split**
*Last Updated: August 21, 2026*

---

## 1. Overview

The logic layer is split across **four files**, each exposing functions on `window.L`. All functions are **pure** (no side effects, no DOM, no `localStorage`) with the single documented exception of `roll()` (which uses `Math.random()` and is kept here to avoid a circular dependency).

| File | Namespace | Contents |
|---|---|---|
| `logic_core.js` | `window.L` | Core helpers: reputation, fame, infamy, heat, ship stats, equipment effects, game‑over detection, universal utilities. |
| `logic_economy_crew.js` | `window.L` | Crew management (tags, alignment, desertion, positive traits), economy (hold capacity, cargo loss, trade profiles), reputation application/decay. |
| `logic_travel_events.js` | `window.L` | Travel days, reachability, sea position, route helpers, random event/patrol triggers, starvation processing. |
| `logic_combat_encounter.js` | `window.L` | B11 combat resolvers (naval + boarding), contest helpers, encounter context builder, NPC AI stubs. |

**Core Principles:**

- **Zero side‑effects** in all files (except `roll()`).
- **Immutable state**: all functions return new objects/arrays; never mutate inputs.
- **Read‑only access** to `window.D` (data constants).
- **May NOT call** engine (`window.E`), generators (`window.G`), or UI (`window.UI`).

---

## 2. logic_core.js — Core Helpers

**Purpose**: Foundational pure functions used across the game.

### Exported Functions

#### General Helpers

| Function | Signature | Description |
|---|---|---|
| `roll` | `(sides) -> number` | Returns a random integer between 1 and `sides` (inclusive). The **only** non‑pure function in the logic layer. |
| `reputationLabel` | `(rep) -> string` | Returns `"Allied"`, `"Friendly"`, `"Neutral"`, `"Hostile"`, or `"At War"` based on the rep value (0‑100). |
| `getFameInfo` | `(fame) -> { label, tier }` | Returns the fame label and tier (0‑5). Labels: Greenhorn, Unknown, Recognised, Notorious, Legendary, Immortal. |
| `getInfamyLabel` | `(infamy) -> string` | Returns `"Clean"`, `"Suspect"`, `"Wanted"`, `"Notorious"`, or `"Legendary Outlaw"`. |
| `getHeatLabel` | `(level) -> string` | Returns `""`, `"Alert"`, `"Active Search"`, `"Hunted"`, or `"Manhunt"` for heat levels 0‑10. |
| `getEffectiveMorale` | `(state) -> number` | Returns morale including equipment bonuses (capped at 100). |
| `meetsRequirement` | `(state, item) -> { allowed, reason }` | Checks fame/hull requirements for ships/equipment. |
| `canBribe` | `(state) -> boolean` | Returns `true` if `state.infamy < 50`. |
| `returnScreen` | `(state) -> "sailing" | "port"` | Returns the screen to return to after events/combat, based on `destination` and `sailingDaysLeft`. |

#### Ship & Equipment

| Function | Signature | Description |
|---|---|---|
| `getShipStats` | `(state) -> { maxHull, cannons, speed, holdCapacity, maxCrew, maxDays, moraleBonus }` | Computes effective stats including all equipment effects. |
| `getEquipmentEffect` | `(state, effectKey) -> number` | Sums a specific effect across all installed equipment (for `combatHeatMult` and `crewLossMult`, returns a product). |
| `canInstallEquipment` | `(state, equipKey) -> { ok, reason }` | Validates fame, hull, slot availability, and whether the equipment is already installed. |
| `shipRepairCost` | `(state) -> number` | Returns gold cost to fully repair hull (before reputation and equipment modifiers). |

#### Heat & Game‑Over

| Function | Signature | Description |
|---|---|---|
| `addHeat` | `(state, faction, amount) -> state` | Adds heat to a faction, capped at 10. Pirates are immune. |
| `getMinViableCrew` | `(shipType) -> number` | Returns 10% of the ship's max crew (rounded down); 0 for `dinghy`. |
| `getCaptainTag` | `(state) -> { text, colorKey }` | Returns a narrative caption and colour based on fame and infamy. |
| `getCareerHighlights` | `(state) -> string[]` | Returns an array of narrative sentences summarising the career. |
| `isUnrecoverable` | `(state) -> { unrecoverable, reason }` | Checks if the player is in a dead‑end state (0 hull and not enough gold/cargo to recover, or 0 crew on a non‑dinghy). |

---

## 3. logic_economy_crew.js — Crew & Economy

**Purpose**: Crew management, reputation application/decay, and cargo/hold helpers.

### Exported Functions

#### Reputation

| Function | Signature | Description |
|---|---|---|
| `decayReputation` | `(state) -> state` | Reduces all port reputations above 50 by 1 (toward 50). |
| `applyReputationImpact` | `(state, repImpact) -> state` | Applies faction‑wide reputation changes (`{ english: +3 }`). Clamps to 0‑100. |
| `getRepPerk` | `(rep) -> { tier, repairMult, missionMult, servicesBlocked }` | Returns gameplay effects for a given reputation value. |

#### Crew

| Function | Signature | Description |
|---|---|---|
| `payCrewWages` | `(state) -> number` | Returns daily wage cost: `2g × crewCount × (1.5 if morale < 30 else 1)`. |
| `removeRandomCrew` | `(roster, count) -> { newRoster, removed }` | Removes `count` random crew members (preserves order, respects `protected` tag). |
| `hasTag` | `(member, tag) -> boolean` | Checks if a crew member has a tag. |
| `addTag` | `(member, tag) -> member` | Returns a new member with the tag added. |
| `removeTag` | `(member, tag) -> member` | Returns a new member with the tag removed. |
| `revealTag` | `(member, trait) -> member` | Converts `hidden_X` to `revealed_X`. |
| `getCrewAlignment` | `(state, faction) -> number` | Returns the fraction of crew belonging to the given faction. |
| `getAlignmentModifier` | `(state, faction) -> number` | Returns `0.5 + getCrewAlignment(state, faction)`. |
| `processDesertion` | `(crewRoster, morale, currentPort, state) -> { roster, logLines }` | Processes upset crew desertion and settling. |
| `processPositiveTraits` | `(crewRoster, state) -> { roster, logLines }` | Awards `seasoned`, `veteran`, or `loyal` tags based on days aboard and faction reputation. |

#### Economy / Cargo / Hold

| Function | Signature | Description |
|---|---|---|
| `getHoldCapacity` | `(state) -> number` | Returns effective hold capacity (ship base + equipment). |
| `getHoldUsed` | `(holdItems) -> number` | Sums all item quantities in the hold. |
| `getHoldLoadPct` | `(holdItems, capacity) -> number` | Returns used / capacity. |
| `getHoldSpeedMultiplier` | `(loadPct) -> number` | Returns `1.00` (<50%), `1.11` (50‑75%), or `1.33` (≥75%). |
| `getProvisionConsumptionPerDay` | `(state) -> { food, water }` | Returns `ceil(crewCount / 10)` for both. |
| `getDaysOfProvisions` | `(holdItems, consumption) -> { food, water }` | Returns remaining days based on current stock. |
| `applyLoseCargoPercent` | `(holdItems, percent) -> holdItems` | Reduces all goods by a percentage. |
| `applyLoseContraband` | `(holdItems) -> holdItems` | Zeros out illegal goods (tobacco, slaves). |
| `getPortTradeProfile` | `(portKey) -> { goodDeals, inDemand }` | Returns lists of goods that are cheap (good deals) and scarce (in demand) at a port. |

---

## 4. logic_travel_events.js — Travel & Events

**Purpose**: Navigation, sea position, reachability, random event/patrol triggers, starvation.

### Exported Functions

#### Travel & Navigation

| Function | Signature | Description |
|---|---|---|
| `getSeaPosition` | `(route) -> { x, y }` | Interpolates current position along a route. |
| `travelDaysBetween` | `(posA, posB, state) -> number` | Calculates travel days between two coordinates. |
| `travelDays` | `(fromPort, toPort, state) -> number` | Wrapper for `travelDaysBetween` using port positions. |
| `travelDaysFromPosition` | `(originPos, portKey, state) -> number` | Travel days from a sea position to a port. |
| `canReachFrom` | `(origin, portKey, state, maxDays) -> boolean` | Checks reachability from a port or sea position. |
| `canReach` | `(state, portKey) -> boolean` | Checks reachability from current port. |
| `canReachFromPosition` | `(originPos, portKey, state, remainingEndurance) -> boolean` | Checks reachability from sea position within remaining endurance. |
| `getReachablePortsFromSea` | `(state) -> string[]` | Returns ports reachable from the current sea position. |
| `getUnreachableReason` | `(state, portKey) -> string | null` | Returns a human‑readable reason if a port is unreachable. |

#### Events & Patrols

| Function | Signature | Description |
|---|---|---|
| `triggerRandomEvent` | `(state) -> event | null` | Filters `D.RANDOM_EVENTS` by condition, picks one. |
| `maybeRandomPatrol` | `(state) -> boolean` | Returns true if a random patrol should trigger based on infamy, heat, and reputation. |

#### Starvation

| Function | Signature | Description |
|---|---|---|
| `processStarvation` | `(state, prov, roster) -> { daysWithoutFood, daysWithoutWater, warningLogs, deathLog, roster }` | Advances starvation counters and kills crew after 14 days no food / 3 days no water. |

---

## 5. logic_combat_encounter.js — Combat & Encounter

**Purpose**: B11 naval and boarding resolvers, contest helpers, encounter context builder, and NPC AI stubs.

### Exported Functions

#### Naval Combat Resolver

| Function | Signature | Description |
|---|---|---|
| `resolveNavalRound` | `(state, playerAction, enemyAction, battle, enemy) -> result` | Full naval round resolution. Handles Evade, Damage (Broadside/Precision), Hull/Crew check, Reposition (Close/Open distance), and Grapple transition. Returns an outcome object. |
| `resolveSpeedContest` | `(actorSpeed, opposerSpeed) -> boolean` | Returns true if the actor wins a speed contest. Clamped to 15‑85% chance. |
| `stepDistance` | `(current, delta) -> "far" | "medium" | "close"` | Moves distance by +1 or -1, clamped. |
| `initialDistanceFor` | `(encounterType) -> "far" | "medium" | "close"` | Returns the starting distance based on encounter type. |

#### Boarding Resolver

| Function | Signature | Description |
|---|---|---|
| `getBoardingRatio` | `(state, battle, enemy) -> number` | Computes player's boarding advantage based on `crew × (0.5 + morale/200)` for both sides. |
| `resolveBoardingRound` | `(state, playerAction, enemyAction, battle, enemy) -> result` | Resolves a boarding round. Handles Continue Fighting, Fall Back, Demand Surrender, and Surrender. Returns outcome (continue, returned_to_naval, player/enemy_wipeout, surrender, etc.). |

#### Encounter Context Builder

| Function | Signature | Description |
|---|---|---|
| `buildEncounterContext` | `(state, type, enemy) -> context` | Builds the data‑driven intercept screen options (fight, flee, parley, bribe, surrender, inspect) with availability reasons and speed checks. Used by the engine to populate `encounterSession.intercept`. |

#### NPC AI Stubs (Naval & Boarding)

| Function | Signature | Description |
|---|---|---|
| `getNPCNavalAction` | `(battle, enemy) -> string` | Returns a naval action (`broadside`, `precision`, `close_distance`, `open_distance`) based on a simple heuristic (scoring stubbed; full utility AI is in a separate task list but not yet shipped). |
| `getNPCBoardingAction` | `(battle, enemy, ratio) -> string` | Returns a boarding action (`continue_fighting`, `fall_back`, `surrender`) based on the enemy's ratio and risk. |

#### Other Helpers

| Function | Signature | Description |
|---|---|---|
| `emptyOutcome` | `() -> { player, enemy, ... }` | Returns a blank outcome object for combat resolution. |
| `maybeCrewLoss` | `(amount) -> number` | Returns 0 or `floor(amount)` with 50% chance. |

---

## 6. Shared Helpers (Across All Logic Files)

All logic files share the same dependencies and constraints:

| Reads | Used for |
|---|---|
| `window.D` | PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES, RANDOM_EVENTS, ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE, DISTANCE_DAMAGE_MULTIPLIERS, LEGAL_ACTIONS_BY_DISTANCE, AI_ARCHETYPES, AI_ORIGIN_MODIFIERS |

**May NOT call**: `window.E` (engine), `window.G` (generators), `window.UI` (UI).

---

## 7. Exposed Functions Summary

### From logic_core.js
`roll`, `reputationLabel`, `getFameInfo`, `getInfamyLabel`, `getHeatLabel`, `getEffectiveMorale`, `meetsRequirement`, `canBribe`, `returnScreen`, `getShipStats`, `getEquipmentEffect`, `canInstallEquipment`, `shipRepairCost`, `addHeat`, `getMinViableCrew`, `getCaptainTag`, `getCareerHighlights`, `isUnrecoverable`

### From logic_economy_crew.js
`decayReputation`, `applyReputationImpact`, `getRepPerk`, `payCrewWages`, `removeRandomCrew`, `hasTag`, `addTag`, `removeTag`, `revealTag`, `getCrewAlignment`, `getAlignmentModifier`, `processDesertion`, `processPositiveTraits`, `getHoldCapacity`, `getHoldUsed`, `getHoldLoadPct`, `getHoldSpeedMultiplier`, `getProvisionConsumptionPerDay`, `getDaysOfProvisions`, `applyLoseCargoPercent`, `applyLoseContraband`, `getPortTradeProfile`

### From logic_travel_events.js
`getSeaPosition`, `travelDaysBetween`, `travelDays`, `travelDaysFromPosition`, `canReachFrom`, `canReach`, `canReachFromPosition`, `getReachablePortsFromSea`, `getUnreachableReason`, `triggerRandomEvent`, `maybeRandomPatrol`, `processStarvation`

### From logic_combat_encounter.js
`emptyOutcome`, `maybeCrewLoss`, `getNPCNavalAction`, `getNPCBoardingAction`, `resolveNavalRound`, `resolveBoardingRound`, `resolveSpeedContest`, `stepDistance`, `initialDistanceFor`, `getBoardingRatio`, `buildEncounterContext`

---

## 8. Usage Rules

1. **No Side Effects**: All functions are pure (except `roll()`). Never mutate inputs.
2. **No DOM / localStorage**: All I/O must go through `storage.js` or engine reducers.
3. **Immutable State**: Always return new objects/arrays.
4. **Read `window.D` only**: Never modify it.
5. **Encapsulation**: The combat resolvers (`resolveNavalRound`, `resolveBoardingRound`) are the single source of truth for combat rules; the engine (`engine_battle.js`) only dispatches and interprets outcomes.

---

## 9. Dependencies

| File | Reads | May NOT Call |
|---|---|---|
| `logic_core.js` | `window.D` | Engine, Generators, UI |
| `logic_economy_crew.js` | `window.D`, `window.L` (from core) | Engine, Generators, UI |
| `logic_travel_events.js` | `window.D`, `window.L` (from core + economy/crew) | Engine, Generators, UI |
| `logic_combat_encounter.js` | `window.D`, `window.L` (from core) | Engine, Generators, UI |