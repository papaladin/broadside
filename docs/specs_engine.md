# specs_engine.md -- Engine Architecture Specification

**Broadside Game Engine**
*Last Updated: June 8, 2026*
*Architecture: 4-Way Split (Core + Port + Voyage + Combat)*

---

## 1. Overview

The engine is split into **4 files** for maintainability:

```
engine_core.js    # Shared infrastructure (constants, initial state, reducer dispatcher, debug/save actions)
engine_port.js    # Port domain (start, navigation, market, missions, crew, shipyard, equipment, repair)
engine_voyage.js  # Voyage domain (sailing, wind, provisions, hidden ports, events, patrols)
engine_combat.js  # Combat domain (encounters, battles, plunder, event resolution)
```

**Core Principles:**

- **Single Responsibility**: Each file handles a distinct domain.
- **Shared Infrastructure**: `engine_core.js` contains global constants and the reducer dispatcher.
- **No Circular Dependencies**: `engine_core.js` loads first; domain files register their reducers afterward.
- **Global Namespace**: All files attach to `window.E` for cross-file access.

### Load Order (Critical!)

```html
<!-- engine_core.js MUST load first -->
<script src="engine_core.js"></script>
<!-- Domain files can load in any order after core -->
<script src="engine_port.js"></script>
<script src="engine_voyage.js"></script>
<script src="engine_combat.js"></script>
```

### Reducer Chaining Mechanism

```js
// In engine_core.js:
window.E._reducers = [];
window.E.reducer = (state, action) =>
  window.E._reducers.reduce((s, r) => r(s, action), state);

// In each domain file:
window.E._reducers.push((state, action) => {
  switch (action.type) {
    case A.SOMETHING: { ... }
    default: return state;
  }
});
```

When `window.E.reducer(state, action)` is called, every registered reducer runs in order. Each either handles the action or returns state unchanged.

```
Action: A.ADVANCE_DAY
+-- Debug/save reducer: No match -> returns state unchanged
+-- Port reducer: No match -> returns state unchanged
+-- Voyage reducer: Matches A.ADVANCE_DAY -> updates state
+-- Combat reducer: No match -> returns state unchanged
```

---

## 2. engine_core.js -- Shared Infrastructure

**Purpose**: Action constants, initial state, reducer dispatcher, shared helpers, debug actions, save/load actions.

### Exports

| Export | Description |
|---|---|
| `window.E.A` | Action type constants (48 total) |
| `window.E.initialState` | Default game state |
| `window.E.reducer` | Master reducer (chains all domain reducers) |
| `window.E._reducers` | Reducer registry array |
| `window.E.autoSave` | Auto-save helper |
| `window.E.migrateState` | State migration for save compatibility |
| `window.E.createBattleState` | Battle state factory |

### Action Constants (window.E.A)

All 48 action type strings:

| Category | Actions |
|---|---|
| **Navigation** | `NAVIGATE`, `SAIL_TO`, `ENTER_PORT`, `DISCOVER_PORT` |
| **Port Services** | `REPAIR`, `BUY_SHIP`, `BUY_EQUIPMENT`, `INSTALL_EQUIPMENT`, `REMOVE_EQUIPMENT`, `HIRE_CREW`, `RAISE_MORALE` |
| **Missions** | `TAKE_MISSION`, `COMPLETE_MISSION`, `ABANDON_MISSION`, `REFRESH_MISSIONS` |
| **Trade** | `CONFIRM_TRADE` |
| **Voyage** | `ADVANCE_DAY` |
| **Encounters** | `INTERCEPT_FIGHT`, `INTERCEPT_FLEE`, `INTERCEPT_SURRENDER`, `INTERCEPT_BRIBE`, `INTERCEPT_PARLEY`, `INTERCEPT_INSPECT` |
| **Combat** | `BATTLE_ACTION`, `DISMISS_BATTLE`, `TAKE_PLUNDER` |
| **Events** | `RESOLVE_EVENT`, `ATTACK_PIRATE`, `ATTACK_MERCHANT` |
| **Save/Load** | `START_GAME`, `SAVE_GAME`, `LOAD_GAME`, `EXPORT_SAVE`, `IMPORT_SAVE` |
| **Debug** | `DEBUG_ADD_GOLD`, `DEBUG_SET_FAME`, `DEBUG_SET_INFAMY`, `DEBUG_SET_SHIP`, `DEBUG_SET_PORT_REP`, `DEBUG_FILL_HOLD`, `DEBUG_REPAIR`, `DEBUG_SET_MORALE`, `DEBUG_UNLOCK_HIDDEN_PORTS`, `DEBUG_MAX_CREW`, `DEBUG_COMPLETE_MISSION`, `DEBUG_SET_HEAT`, `DEBUG_AGE_CREW` |

### Initial State (window.E.initialState)

```js
{
  version: 1,
  screen: "title",
  day: 1,
  startDate: { day: 1, month: 6, year: 1695 },
  log: [],
  gold: 0,
  fame: 0,
  infamy: 0,
  scenarioId: null,
  factionAlerts: { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 },
  currentPort: "portRoyal",
  previousPort: null,
  destination: null,
  discoveredPorts: [...],   // all non-hidden port keys
  mapFragments: [],
  equipmentInventory: [],   // locker: removed equipment stored here
  sailingDaysLeft: 0,
  sailingDaysTotal: 0,
  wind: { angle: 0, speed: 10 },
  ship: {
    type: "sloop",
    name: "Sea Dog",
    hull: 100,
    cannons: 10,
    equipment: { hull: [], armament: [], rigging: [], special: [] }
  },
  crew: {
    roster: [],
    max: 50,
    morale: 80
  },
  hold: {
    items: { food: 10, water: 10, rum: 0, sugar: 0, timber: 0, cloth: 0, 
             spices: 0, silk: 0, coffee: 0, cocoa: 0, weapons: 0, 
             tobacco: 0, silver: 0, slaves: 0 }
    // NOTE: no 'capacity' field -- use L.getHoldCapacity(state)
  },
  portMarket: null,
  portGossip: [],
  missions: [],
  activeMission: null,
  reputation: { /* all port keys: 50 */ },
  battleState: null,
  activeEvent: null,
  encounterContext: null
}
```

### Shared Helpers

| Helper | Signature | Purpose |
|---|---|---|
| `autoSave` | `(state) -> void` | Saves state to localStorage if screen is port-related |
| `migrateState` | `(loaded) -> state` | Adds missing fields for save compatibility with older versions |
| `createBattleState` | `(state, enemy, encounterType, canPlunder) -> battleState` | Factory for battle state objects |

### Debug Reducer (registered first)

Handles all `DEBUG_*` actions. Only available when `?debug=1` URL param is set.

| Action | Payload | Effect |
|---|---|---|
| `DEBUG_ADD_GOLD` | `{ amount }` | Adds gold |
| `DEBUG_SET_FAME` | `{ value }` | Sets fame to value |
| `DEBUG_SET_INFAMY` | `{ value }` | Sets infamy to value |
| `DEBUG_SET_SHIP` | `{ shipType }` | Switches ship type (resets equipment, adjusts crew/hull) |
| `DEBUG_SET_PORT_REP` | `{ value }` | Sets current port reputation to value |
| `DEBUG_FILL_HOLD` | -- | Fills hold with food and water |
| `DEBUG_REPAIR` | -- | Full hull repair |
| `DEBUG_SET_MORALE` | `{ value }` | Sets crew morale to value |
| `DEBUG_UNLOCK_HIDDEN_PORTS` | -- | Adds all hidden ports to discoveredPorts |
| `DEBUG_MAX_CREW` | -- | Fills crew roster to ship max |
| `DEBUG_COMPLETE_MISSION` | -- | Force-completes active mission |
| `DEBUG_SET_HEAT` | `{ faction, value }` | Sets faction alert level |
| `DEBUG_AGE_CREW` | `{ days }` | Adds days to all crew daysAboard |

### Save/Load Reducer (registered in core)

| Action | Effect |
|---|---|
| `SAVE_GAME` | `localStorage.setItem("piratesSave", JSON.stringify(state))` |
| `LOAD_GAME` | `JSON.parse` + `migrateState()` + regenerate market/missions |
| `EXPORT_SAVE` | `L.encodeSave(state)` -> triggers browser download as JSON file |
| `IMPORT_SAVE` | File input -> `L.decodeSave(json)` -> `migrateState` -> restore |

---

## 3. engine_port.js -- Port Domain Reducer

**Purpose**: All port-related state transitions (start, navigation, market, missions, crew, shipyard, equipment, repair).

### Reducer Cases

| Action | Payload | Description |
|---|---|---|
| `START_GAME` | `{ scenarioId }` | Initialises state from STARTS[scenarioId]. Generates crew roster, market, missions, gossip. Sets reputation adjustments. |
| `NAVIGATE` | `{ screen }` | Changes `state.screen`. No side effects. |
| `SAIL_TO` | `{ destination }` | Sets destination, calculates travel days, switches to sailing screen. |
| `ENTER_PORT` | -- | Handles port arrival: generates market/missions/gossip, processes desertion, processes positive traits (seasoned/veteran/loyal), applies heat decay, checks hostile port entry. |
| `REPAIR` | -- | Repairs hull. Cost based on damage amount and reputation discount (via `L.getRepairCost`). |
| `BUY_SHIP` | `{ shipType }` | Purchases new ship. Resets equipment to empty. Truncates crew if new maxCrew < current. Awards trade-in value for old ship. |
| `BUY_EQUIPMENT` | `{ equipKey }` | Purchases equipment from shop (adds to equipmentInventory/locker). Deducts cost. |
| `INSTALL_EQUIPMENT` | `{ equipKey }` | Installs from locker to ship slot. Validates via `L.canInstallEquipment`. Deducts installFee. |
| `REMOVE_EQUIPMENT` | `{ equipKey, slot }` | Removes from ship slot to locker. Only if `removable: true`. |
| `HIRE_CREW` | `{ count }` | Generates and adds crew members. Cost: 50g per hire. Capped at ship maxCrew. |
| `RAISE_MORALE` | -- | Spends gold to boost morale. Cost: 5g per crew member. +5 morale. |
| `REFRESH_MISSIONS` | -- | Regenerates mission board for current port. |
| `TAKE_MISSION` | `{ missionIndex }` | Accepts mission. Combat/patrol missions may trigger immediate intercept. |
| `COMPLETE_MISSION` | -- | Awards gold, fame, reputation. Removes required goods from hold (trade/smuggle). Applies infamy for smuggle missions. |
| `ABANDON_MISSION` | -- | Clears active mission. Reputation penalty. |
| `CONFIRM_TRADE` | `{ buys, sells }` | Executes market trade. Validates via `validateTrade`. Updates gold, hold, market quantities. |

### Helpers

| Helper | Purpose |
|---|---|
| `checkServicesBlocked(state)` | Returns true if port services blocked due to low reputation (At War tier) |
| `validateTrade(state, buys, sells)` | Validates gold sufficiency, hold space, market quantities |
| `processDesertion(state)` | On port entry: upset/low-morale crew may desert. Seasoned crew have halved desertion. Loyal crew immune. |
| `processPositiveTraits(state)` | On port entry: awards `seasoned` (50d), `veteran` (100d), `loyal` (200d + conditions) tags |
| `pickArrivalMessage(state)` | Selects a random arrival log message template from D.ARRIVAL_MESSAGES |

---

## 4. engine_voyage.js -- Voyage Domain Reducer

**Purpose**: Sailing and navigation logic (day advancement, wind, provisions, crew, events, patrols, hidden ports).

### Reducer Cases

| Action | Payload | Description |
|---|---|---|
| `ADVANCE_DAY` | -- | The core sailing loop. Executes in order: advance wind, advance crew (days + morale), consume provisions, pay wages, check smuggle patrol, check mission encounter, check random event, check random patrol, advance hidden port discovery, decrement sailingDaysLeft, check arrival. |
| `DISCOVER_PORT` | `{ portKey }` | Manually adds a port to `discoveredPorts`. |

### ADVANCE_DAY Pipeline (execution order)

```
1. advanceWind()          -- drift wind angle +/- random, drift speed
2. advanceCrew()          -- increment daysAboard for all crew, morale decay if low
3. advanceProvisions()    -- consume food/water based on crew count (1 per 10 crew per day)
4. Pay wages              -- 2g per crew per day (x1.5 if morale < 30)
5. maybeSmugglePatrol()   -- if smuggle mission active, chance of intercept
6. maybeMissionEncounter()-- if escort/patrol mission, chance of encounter on specific days
7. maybeRandomEvent()     -- ~10% chance per day, picks from D.RANDOM_EVENTS
8. checkRandomPatrol()    -- patrol chance based on infamy + heat + rep dampening
9. advanceHiddenPorts()   -- check L.canSeePort for each undiscovered hidden port
10. Decrement sailingDaysLeft
11. Check arrival         -- if sailingDaysLeft <= 0, set screen to 'arriving'
```

Steps 5-8 are mutually exclusive per day: if one triggers an intercept/event, the remaining checks are skipped.

### Helpers

| Helper | Purpose |
|---|---|
| `advanceWind(wind)` | Randomly drifts wind angle (+/- 15 deg) and speed (+/- 3) |
| `advanceCrew(crew)` | Increments `daysAboard` for all crew. Reduces morale if < 30. |
| `advanceProvisions(state)` | Consumes food/water: 1 unit per 10 crew per day. Morale penalty if out. |
| `maybeSmugglePatrol(state)` | If active smuggle mission: intercept chance based on risk level (low 70%, med 80%, high 90%) |
| `maybeMissionEncounter(state)` | For escort/patrol missions: triggers encounter at specific sailing day thresholds |
| `maybeRandomEvent(state)` | ~10% chance. Filters D.RANDOM_EVENTS by condition(state). Picks random eligible event. |
| `checkRandomPatrol(state)` | Patrol chance: `min(0.01 + infamy/400 + maxHeat*0.03, 0.40)`, dampened by high rep |
| `advanceHiddenPorts(state)` | Checks `L.canSeePort` for each hidden port not yet in discoveredPorts. Auto-discovers if conditions met. |

---
## 5. engine_combat.js -- Combat Domain Reducer

**Purpose**: Encounters, battles, plunder, and event resolution.

### Reducer Cases

| Action | Description |
|---|---|
| `INTERCEPT_FIGHT` | Creates `battleState` from `encounterContext`. Adds heat (+3) for navy_patrol fights. Switches to battle screen. |
| `INTERCEPT_FLEE` | Speed check: `playerSpeed + L.roll(6) vs enemySpeed + L.roll(6)`. Success = resume sailing. Failure = forced into battle. Adds heat (+2) for navy_patrol flee. |
| `INTERCEPT_PARLEY` | Reputation check: `L.roll(100) <= min(80, rep + 20)`. Success = pass through (+3 rep). Failure = forced into battle. |
| `INTERCEPT_BRIBE` | Pays `bribeCost` (from encounterContext). -2 rep at current port. Returns to sailing. |
| `INTERCEPT_SURRENDER` | Applies `SURRENDER_CONSEQUENCE[ctx.type]` -- cargo loss, gold loss, morale penalty, days lost. Returns to sailing. |
| `INTERCEPT_INSPECT` | **Navy patrol inspection.** Checks hold for contraband (tobacco, slaves, smuggle-mission rum). Hidden Compartment equipment gives 50% avoid chance. On find: seizes contraband, fine = `PATROL_FINE_RATE * value`, +2 infamy, -5 faction rep, -10 morale. |
| `BATTLE_ACTION` | Resolves one combat round via `L.resolveCombatAction(state, playerAction, npcAction)`. Four player actions: `broadside`, `precision`, `grapple`, `evade`. NPC action via `L.getNPCAction`. Phase checks: enemy hull <= 0 = victory, player hull <= 0 = defeat, evade success = fled, grapple success = instant victory. Tracks named crew losses. Updates convoy hull for escort missions. |
| `DISMISS_BATTLE` | Handles post-combat state transitions. **Victory**: faction upset tagging for matching-faction crew, battle scar if >= 10 crew died, heat gain, morale boost (+5 to +10). **Defeat**: wash ashore at previous port, lose all cargo, cancel mission, morale -10. **Fled**: morale -5, cancel mission if it was mission combat. War Pennants equipment multiplies heat gain. |
| `TAKE_PLUNDER` | Player picks cargo items from defeated enemy (PlunderScreen). Gold awarded at `PLUNDER_GOLD_RATIO` (20%). Remaining cargo added to hold (capped by capacity). |
| `RESOLVE_EVENT` | Applies all event outcome fields: `gold`, `fame`, `hullDamage`, `crewLoss`, `daysLost`, `moraleBonus`, `moralePenalty`, `repImpact`, `mapFragment`, `addCrew`, `generateCargo`, `loseCargoPercent`, `battle` (triggers combat). Special handling: mutiny (negotiate = gold / crush = crew loss + mutineer tags), storm scar tagging, calm wind immunity check, storm hull immunity check. |
| `ATTACK_PIRATE` | Generates pirate enemy (fame-tier scaled), builds encounter context as `distressed_merchant_help`. Switches to intercept. |
| `ATTACK_MERCHANT` | Generates weaker merchant enemy (1 tier lower), builds encounter as `distressed_merchant_plunder`. Adds +2 heat to merchant faction. Switches to intercept. |

### Helpers

| Helper | Purpose |
|---|---|
| `pickMerchantFaction()` | Randomly selects a non-pirate faction for merchant encounters |
| `addHeat(state, faction, amount)` | Adds heat to factionAlerts[faction], capped at 10 |

### Battle State Shape

Created by `E.createBattleState()`. Shape:

```js
{
  phase: "active" | "victory" | "defeat" | "fled",
  round: number,
  player: { hull, maxHull, cannons, crew, speed },
  enemy: { name, hull, maxHull, cannons, crew, speed, faction },
  log: [],           // battle log entries
  canPlunder: boolean,
  enemyCargo: {},    // generated by G.generateEnemyCargo
  enemyGold: number,
  encounterType: string,  // "patrol", "mission_combat", "random", etc.
  crewLost: []       // names of crew who died this battle
}
```

---

## 6. File Statistics

| File | Reducer Cases | Helpers | Purpose |
|---|---|---|---|
| `engine_core.js` | 17 (debug 13 + save/load 4) | 3 | Shared infrastructure |
| `engine_port.js` | 16 | 5 | Port logic |
| `engine_voyage.js` | 2 | 8+ | Sailing logic |
| `engine_combat.js` | 12 | 2 | Combat logic |
| **Total** | **47** | **18+** | All engine logic |

---

## 7. Dependencies

All engine files depend on:

| Dependency | Used for |
|---|---|
| `window.D` | PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES, RANDOM_EVENTS, STARTS, ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE |
| `window.L` | All pure game math (combat, reputation, travel, fame, equipment, crew tags, encounter context, hold capacity) |
| `window.G` | Generators (missions, markets, crew, enemies, cargo, gossip, bios) |
| `window.E.A` | Action constants (from engine_core.js -- must load first) |

---

## 8. Domain Responsibility Summary

### engine_core.js (Shared)

- Global constants: All `A.*` action types
- Initial state: Default game state
- Shared helpers: `autoSave`, `migrateState`, `createBattleState`
- Reducer dispatcher: Chains all domain reducers
- Debug actions: Development-only state manipulation
- Save/load actions: localStorage + file export/import

### engine_port.js (Port)

- Game start and scenario initialisation
- Screen navigation
- Ship purchase and equipment management (buy, install, remove)
- Crew hiring and morale management
- Mission lifecycle (take, complete, abandon, refresh)
- Market trading (buy/sell goods)
- Hull repair
- Port entry processing (desertion, positive traits, gossip, market regeneration)

### engine_voyage.js (Voyage)

- Day-by-day sailing simulation
- Wind drift and travel time
- Provision consumption and wage payment
- Event triggering (random events, patrols, mission encounters)
- Hidden port discovery
- Arrival detection

### engine_combat.js (Combat)

- Pre-battle intercept actions (fight, flee, parley, bribe, surrender, inspect)
- Turn-based combat rounds
- Victory/defeat/fled state transitions
- Plunder collection
- Random event resolution
- Faction heat management
- Crew upset tagging and scar assignment