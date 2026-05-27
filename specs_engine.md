# **Broadside: specs_engine.md**

*Game state management, reducer, and action handlers. Exposed as `window.E`.*

---

## **📌 Overview**

- **File**: `engine.js`
- **Exposed as**: `window.E`
- **Dependencies**:
  - `window.D` (data constants: `PORTS`, `SHIPS`, `FACTIONS`, `UPGRADES`, `STARTS`, `RANDOM_EVENTS`).
  - `window.L` (pure logic helpers from `logic.js`).
  - `window.G` (generators from `generators.js`).
- **Purpose**:
  - Manages the **game state** via a **reducer pattern**.
  - Handles **actions** (e.g., navigation, combat, missions, trading).
  - Includes **auto-save**, **state migration**, and **initial state** setup.

---

---

## **🔧 Constants & Helpers**

---

### **1. `A` (Action Types)**

A global object defining all action types as strings for consistency.  
**Example**:

```js
const A = {
  NAVIGATE: "NAVIGATE",
  SAIL_TO: "SAIL_TO",
  ADVANCE_DAY: "ADVANCE_DAY",
  ENTER_PORT: "ENTER_PORT",
  START_GAME: "START_GAME",
  SAVE_GAME: "SAVE_GAME",
  LOAD_GAME: "LOAD_GAME",
  REPAIR: "REPAIR",
  BUY_SHIP: "BUY_SHIP",
  BUY_UPGRADE: "BUY_UPGRADE",
  HIRE_CREW: "HIRE_CREW",
  RAISE_MORALE: "RAISE_MORALE",
  REFRESH_MISSIONS: "REFRESH_MISSIONS",
  TAKE_MISSION: "TAKE_MISSION",
  COMPLETE_MISSION: "COMPLETE_MISSION",
  ABANDON_MISSION: "ABANDON_MISSION",
  INTERCEPT_FIGHT: "INTERCEPT_FIGHT",
  INTERCEPT_FLEE: "INTERCEPT_FLEE",
  INTERCEPT_PARLEY: "INTERCEPT_PARLEY",
  INTERCEPT_BRIBE: "INTERCEPT_BRIBE",
  INTERCEPT_SURRENDER: "INTERCEPT_SURRENDER",
  BATTLE_ACTION: "BATTLE_ACTION",
  DISMISS_BATTLE: "DISMISS_BATTLE",
  RESOLVE_EVENT: "RESOLVE_EVENT",
  SET_WIND: "SET_WIND",
  CONFIRM_TRADE: "CONFIRM_TRADE",
  ENTER_MARKET: "ENTER_MARKET",
  LEAVE_MARKET: "LEAVE_MARKET",
  DISCOVER_PORT: "DISCOVER_PORT",
  // Debug actions
  DEBUG_ADD_GOLD: "DEBUG_ADD_GOLD",
  DEBUG_SET_FAME: "DEBUG_SET_FAME",
  DEBUG_SET_INFAMY: "DEBUG_SET_INFAMY",
  DEBUG_SET_SHIP: "DEBUG_SET_SHIP",
  DEBUG_SET_PORT_REP: "DEBUG_SET_PORT_REP",
  DEBUG_FILL_HOLD: "DEBUG_FILL_HOLD",
  DEBUG_REPAIR: "DEBUG_REPAIR",
};
```

---

### **2. `autoSave(state)**`

- **Purpose**: Saves the current state to `localStorage` automatically.
- **Input**:
  - `state` (object): The current game state.
- **Output**: `void`
- **Notes**:
  - Uses `localStorage.setItem("piratesSave", JSON.stringify(state))`.
  - Wrapped in a `try-catch` to handle errors silently.

---

### **3. `migrateState(loaded)**`

- **Purpose**: Migrates older saved states to the current version.
- **Input**:
  - `loaded` (object): The loaded save state.
- **Output**: `object` (migrated state)
- **Notes**:
  - **Version 1 → 2**:
    - Adds `discoveredPorts` (all non-hidden ports by default).
    - Adds `mapFragments` (empty array by default).
  - **Extensible**: New migrations can be added for future versions.

---

---

## **🌍 Initial State**

The default state for a new game. Used as the baseline for `START_GAME` and reducer initialization.

### **Structure**:

```js
const initialState = {
  version: 1,                // State version for migration
  screen: "start",           // Current screen (e.g., "port", "map", "battle")
  day: 1,                    // Current day
  log: [],                   // Captain's log entries
  gold: 1000,                // Player's gold
  fame: 0,                   // Player's fame
  infamy: 0,                 // Player's infamy
  currentPort: "portRoyal",  // Current port key
  previousPort: null,        // Previous port key
  destination: null,         // Destination port key (if sailing)
  discoveredPorts: [...],    // Keys of discovered ports
  mapFragments: [],          // Collected map fragments
  sailingDaysLeft: 0,        // Days remaining in current voyage
  sailingDaysTotal: 0,       // Total days for current voyage
  wind: { angle: 45, speed: 10 }, // Wind direction (degrees) and speed
  ship: {                    // Player's ship
    type: "sloop",
    name: "Sea Dog",
    hull: 100,
    cannons: 10,
    upgrades: [],
  },
  crew: {                    // Player's crew
    roster: [],              // Array of crew members
    max: 50,                 // Maximum crew capacity
    morale: 80,              // Crew morale (0-100)
  },
  hold: {                    // Ship's cargo hold
    capacity: 200,           // Maximum capacity
    items: {                 // Current items in hold
      food: 10, water: 10,   // Starting provisions
      rum: 0, sugar: 0, timber: 0, cloth: 0, spices: 0, silk: 0,
      coffee: 0, cocoa: 0, weapons: 0, tobacco: 0, silver: 0, slaves: 0,
    },
  },
  portMarket: null,          // Current port's market data
  missions: [],              // Available missions
  activeMission: null,       // Currently active mission
  reputation: {},            // Reputation with each port (initialized to 50)
  battleState: null,         // Current battle state (if in combat)
  activeEvent: null,         // Current random event (if any)
  encounterContext: null,    // Current encounter context (if any)
};
```

- **Reputation Initialization**:
  - All ports start with `50` reputation (neutral).

---

---

## **🔄 Reducer**

The core of `engine.js`. Handles state transitions based on actions.  
**Signature**:

```js
const reducer = (state, action) => { ... };
```

---

---

## **📜 Action Cases**

---

### **1. `START_GAME**`

**Purpose**: Initializes a new game based on a selected scenario.  
**Action**:

```js
{ type: A.START_GAME, scenarioId: string }
```

**Logic**:

1. Finds the scenario in `STARTS` using `scenarioId`.
2. Creates a new state based on `initialState` with scenario-specific overrides:
  - **Day**: Always starts at `1`.
  - **Gold**: Uses `start.gold` (or default `1000`).
  - **Fame**: Uses `start.debugStartFame` (if present).
  - **Current Port**: Uses `start.startPort`.
  - **Ship**: Uses `SHIPS[start.ship]` to set type, name, hull, cannons, and upgrades.
  - **Hold**: Uses `shipData.holdCapacity` and initializes items (including scenario-specific `start.hold`).
  - **Crew**:
    - Sets `max` from ship stats.
    - Generates roster using `G.generateRoster(start.crewCount, start.crewFaction || start.faction)`.
    - Sets morale to `80`.
  - **Reputation**:
    - Starts at `50` for all ports.
    - Applies `start.repAdjust` (e.g., `{ english: +10 }`).
  - **Market**: Generates port market using `G.generatePortMarket(start.startPort)`.
  - **Missions**:
    - Generates missions using `G.generateMissions(start.startPort, newState)`.
    - If `start.starterMission` exists, auto-accepts it and adds it to `activeMission`.
  - **Log**: Adds scenario-specific `openingLog` entries.
3. Sets `screen` to `"port"`.

**Output**:

- New game state with all scenario-specific overrides applied.

---

### **2. `NAVIGATE**`

**Purpose**: Changes the current screen.  
**Action**:

```js
{ type: A.NAVIGATE, screen: string }
```

**Logic**:

- Updates `state.screen` to `action.screen`.  
**Output**:
- State with updated `screen`.

---

### **3. `SAIL_TO**`

**Purpose**: Starts a voyage to a new port.  
**Action**:

```js
{ type: A.SAIL_TO, port: string }
```

**Logic**:

1. Calculates travel days using `L.travelDays(state.currentPort, action.port, state)`.
2. Updates state:
  - `previousPort`: Set to `state.currentPort`.
  - `destination`: Set to `action.port`.
  - `sailingDaysLeft`: Set to calculated days.
  - `sailingDaysTotal`: Set to calculated days.
  - `screen`: Set to `"sailing"`.
  - `log`: Adds entry: `"Setting sail for [port name]. [days] day(s) voyage."`.

**Output**:

- State with updated sailing-related fields.

---

### **4. `ADVANCE_DAY**`

**Purpose**: Advances the game by one day (used during sailing).  
**Action**:

```js
{ type: A.ADVANCE_DAY }
```

**Logic**:

1. **Early Exit**: If `sailingDaysLeft <= 0`, returns state unchanged.
2. **Wind Update**:
  - Randomly adjusts wind angle (`-15°` to `+15°`).
  - Randomly adjusts wind speed (`-5` to `+5`, clamped to `1-20`).
3. **Crew Wages**:
  - Calculates wages using `L.payCrewWages(state)`.
  - Deducts from `state.gold` (minimum `0`).
4. **Reputation Decay**:
  - Applies `L.decayReputation(state)` every **2 days** (never below `50`).
5. **Morale Decay**:
  - Decreases morale by `1` if already `< 30`.
6. **Crew Days Aboard**:
  - Increments `daysAboard` for all crew members.
7. **Provision Consumption**:
  - Calculates consumption using `L.getProvisionConsumptionPerDay(state)`.
  - Deducts food and water from hold (minimum `0`).
  - Logs warnings if food or water runs out.
8. **Morale Penalty for Crises**:
  - Applies `-1 morale` if:
    - Food or water runs out.
    - Wages cannot be paid (`state.gold < wages`).
9. **Smuggle Mission Patrol Check**:
  - If `activeMission.type === "smuggle"` and `!encounterOccurred`:
    - Rolls for intercept chance (`state.activeMission.interceptChance || 0.70`).
    - If intercepted, triggers a `navy_patrol` event:
      - Sets `activeEvent` to the patrol event.
      - Sets `screen` to `"event"`.
      - Marks `activeMission.encounterOccurred = true`.
      - Adds log: `"A patrol vessel approaches, flying inspection colours."`.
10. **Random Event Check**:
  - If `sailingDaysLeft >= 1` and `Math.random() < 0.1`:
    - Triggers a random event using `L.triggerRandomEvent(state)`.
    - Sets `activeEvent` and `screen` to `"event"`.
    - Adds log: `"Day [X]: [event title]"`.
11. **Random Patrol Check**:
  - If `sailingDaysLeft > 0` and no `activeEvent` or `encounterContext`:
    - Uses `L.maybeRandomPatrol(state)` to check for a patrol.
    - If patrol appears:
      - Generates enemy using `G.generateEnemy("low", state.fame, faction)`.
      - Builds encounter context using `L.buildEncounterContext(state, "navy_patrol", enemy)`.
      - Overrides `surrender.consequence` for navy patrols (dynamic function to check for illegal goods).
      - Sets `encounterContext` and `screen` to `"intercept"`.
      - Adds log: `"A navy patrol hails you and demands to inspect your cargo."`.
12. **Hidden Port Auto-Discovery**:
  - Checks all hidden ports (`PORTS[k].hidden`) for unlock conditions.
    - Conditions:
      - **Item-based**: Skipped (handled in `RESOLVE_EVENT`).
      - **Fame/Infamy/Reputation**: Evaluates based on `state.fame`, `state.infamy`, or average reputation for a faction.
    - If unlocked, adds port to `discoveredPorts` and logs discovery.
13. **Normal Sailing Day**:
  - Updates:
    - `wind`: New wind values.
    - `day`: Incremented by `1`.
    - `sailingDaysLeft`: Decremented by `1`.
    - `gold`: Deducts wages.
    - `reputation`: Applies decay (if applicable).
    - `crew`: Updates roster and morale.
    - `hold`: Updates items (food/water).
    - `discoveredPorts`: Adds auto-discovered ports.

**Output**:

- State with updated day, wind, resources, and potential events/encounters.

---

### **5. `DISCOVER_PORT**`

**Purpose**: Manually discovers a hidden port.  
**Action**:

```js
{ type: A.DISCOVER_PORT, portKey: string }
```

**Logic**:

1. Checks if `portKey` is valid and not already discovered.
2. Adds `portKey` to `discoveredPorts`.
3. Adds log: `"⚓ New port discovered: [port name]. Mark it on your charts."`.

**Output**:

- State with updated `discoveredPorts` and log.

---

### **6. `ENTER_PORT**`

**Purpose**: Handles arrival at a port, including hostile entry checks.  
**Action**:

```js
{ type: A.ENTER_PORT }
```

**Logic**:

1. **Assault Mission Check**:
  - If `activeMission.type === "assault"` and `activeMission.targetPort === destination`:
    - Sets `combatEncounter` with `hostile_port_entry` type and mission enemy (or default garrison).
2. **Hostile Port Check**:
  - If `reputation[destination] < 10`:
    - Sets `combatEncounter` with `hostile_port_entry` type and default guards.
3. **Combat Encounter Handling**:
  - If `combatEncounter` exists:
    - Builds `encounterContext` using `L.buildEncounterContext`.
    - Sets `screen` to `"intercept"`.
    - Adds log: `"Arrived at [port name]. [Hostile port! | The garrison is on high alert!]"`.
4. **Normal Entry**:
  - Updates:
    - `currentPort`: Set to `destination`.
    - `destination`: Set to `null`.
    - `sailingDaysLeft`: Set to `0`.
    - `screen`: Set to `"port"`.
    - `missions`: Generates new missions using `G.generateMissions(destination, state)`.
    - `portMarket`: Generates new market using `G.generatePortMarket(destination)`.
    - `log`: Adds `"Arrived at [port name]."`.
  - Calls `autoSave(nextState)`.

**Output**:

- State with updated port, missions, market, and screen.

---

### **7. `REPAIR**`

**Purpose**: Repairs the player's ship at the current port.  
**Action**:

```js
{ type: A.REPAIR }
```

**Logic**:

1. **Reputation Check**:
  - Uses `L.getRepPerk(reputation[currentPort])` to check if services are blocked.
  - If blocked, adds log: `"You are at war with this port. No services available."`.
2. **Cost Calculation**:
  - Uses `L.shipRepairCost(state)` to get base cost.
  - Applies `repPerk.repairMult` for discounts/penalties.
3. **Affordability Check**:
  - If `state.gold < cost`, adds log: `"Not enough gold to repair."`.
4. **Repair**:
  - Deducts `cost` from `gold`.
  - Sets `ship.hull` to `shipStats.maxHull`.
  - Adds log: `"Repaired ship for [cost]g [discount note]."`.

**Output**:

- State with updated `gold` and `ship.hull`.

---

### **8. `BUY_SHIP**`

**Purpose**: Purchases a new ship at the current port.  
**Action**:

```js
{ type: A.BUY_SHIP, shipType: string }
```

**Logic**:

1. **Reputation Check**:
  - If services are blocked, adds log: `"You are at war with this port. No services available."`.
2. **Requirement Check**:
  - Uses `L.meetsRequirement(state, SHIPS[action.shipType])`.
  - If not allowed, adds log: `"Cannot purchase: [reason]."`.
3. **Affordability Check**:
  - If `state.gold < ship.cost`, returns state unchanged.
4. **Crew Adjustment**:
  - If new ship's `maxCrew < current roster length`, truncates roster.
5. **Purchase**:
  - Deducts `ship.cost` from `gold`.
  - Updates `ship` to new type, name, hull, cannons, and upgrades (empty).
  - Updates `crew.max` to new ship's `maxCrew`.
  - Updates `hold.capacity` to new ship's `holdCapacity`.
  - Adds log: `"Purchased [ship name] for [cost]g."`.

**Output**:

- State with updated `ship`, `crew`, `hold`, and `gold`.

---

### **9. `BUY_UPGRADE**`

**Purpose**: Purchases a ship upgrade at the current port.  
**Action**:

```js
{ type: A.BUY_UPGRADE, upgradeKey: string }
```

**Logic**:

1. **Reputation Check**:
  - If services are blocked, adds log: `"You are at war with this port. No services available."`.
2. **Requirement Check**:
  - Uses `L.meetsRequirement(state, UPGRADES[action.upgradeKey])`.
  - If not allowed, adds log: `"Cannot install: [reason]."`.
3. **Validation**:
  - Checks if:
    - Upgrade exists.
    - Player can afford it (`state.gold >= upgrade.cost`).
    - Upgrade is not already installed (`!state.ship.upgrades.includes(upgradeKey)`).
    - Ship supports the upgrade (`SHIPS[state.ship.type].upgradeable.includes(upgradeKey)`).
4. **Purchase**:
  - Deducts `upgrade.cost` from `gold`.
  - Adds `upgradeKey` to `ship.upgrades`.
  - Adds log: `"Installed [upgrade name] for [cost]g."`.

**Output**:

- State with updated `ship.upgrades` and `gold`.

---

### **10. `HIRE_CREW**`

**Purpose**: Hires new crew members at the current port.  
**Action**:

```js
{ type: A.HIRE_CREW, count: number }
```

**Logic**:

1. **Reputation Check**:
  - If services are blocked, adds log: `"You are at war with this port. No services available."`.
2. **Validation**:
  - Checks if:
    - `crew.roster.length >= crew.max` (ship at capacity).
    - `state.gold < count * 50` (cannot afford).
3. **Hiring**:
  - Deducts `count * 50` from `gold`.
  - Generates new crew using `G.generateRoster(count, portFaction)`.
  - Adds new members to `crew.roster`.
  - Adds log: `"Hired [count] crew for [cost]g."`.

**Output**:

- State with updated `crew.roster` and `gold`.

---

### **11. `RAISE_MORALE**`

**Purpose**: Raises crew morale by purchasing drinks.  
**Action**:

```js
{ type: A.RAISE_MORALE }
```

**Logic**:

1. **Reputation Check**:
  - If services are blocked, adds log: `"You are at war with this port. No services available."`.
2. **Validation**:
  - Checks if:
    - `state.gold < crew.roster.length * 5` (cannot afford).
    - `crew.morale >= 100` (already maxed).
3. **Morale Boost**:
  - Deducts `crew.roster.length * 5` from `gold`.
  - Increases `crew.morale` by `5` (capped at `100`).
  - Adds log: `"Bought drinks for the crew: -[cost]g. Morale +5."`.

**Output**:

- State with updated `crew.morale` and `gold`.

---

### **12. `REFRESH_MISSIONS**`

**Purpose**: Refreshes the available missions at the current port.  
**Action**:

```js
{ type: A.REFRESH_MISSIONS }
```

**Logic**:

- Generates new missions using `G.generateMissions(state.currentPort, state)`.  
**Output**:
- State with updated `missions`.

---

### **13. `TAKE_MISSION**`

**Purpose**: Accepts a mission from the mission board.  
**Action**:

```js
{ type: A.TAKE_MISSION, mission: object }
```

**Logic**:

1. **Combat Mission Handling**:
  - If `mission.type === "combat"` and `mission.enemy` exists:
    - Sets `activeMission` to `mission`.
    - Builds `encounterContext` using `L.buildEncounterContext(state, "mission_combat", mission.enemy)`.
    - Sets `screen` to `"intercept"`.
    - Adds log: `"Accepted mission: [mission name]."`.
2. **Other Missions**:
  - Sets `activeMission` to `{ ...mission, encounterOccurred: false }`.
  - Adds log: `"Accepted mission: [mission name]."`.

**Output**:

- State with updated `activeMission`, `encounterContext`, and `screen`.

---

### **14. `COMPLETE_MISSION**`

**Purpose**: Completes the active mission.  
**Action**:

```js
{ type: A.COMPLETE_MISSION }
```

**Logic**:

1. **Validation**:
  - Checks if `activeMission` exists.
  - If `mission.targetPort` exists, ensures `currentPort === targetPort`.
2. **Cargo Check (Trade/Smuggle)**:
  - If `mission.requiredGood` and `mission.requiredQty`:
    - Checks if `hold.items[requiredGood] >= requiredQty`.
    - If not, adds log: `"Cannot complete: [qty] [good] required, [inHold] in hold."`.
3. **Cargo Removal**:
  - Deducts `requiredQty` from `hold.items[requiredGood]`.
4. **Gold Reward**:
  - For `trade` or `smuggle` missions: Uses `mission.gold` directly.
  - For other missions:
    - Applies `repPerk.missionMult` (based on `reputation[currentPort]`).
    - Calculates `bonusNote` for log (e.g., `"+Xg allied bonus"`).
5. **Reputation/Infamy/Fame**:
  - Applies `mission.repImpact` using `L.applyReputationImpact`.
  - Adds `mission.fame` to `state.fame`.
  - Adds `mission.infamyGain` to `state.infamy` (capped at `999`).
  - Logs infamy threshold crossings (e.g., `"Your name grows darker. You are now Notorious."`).
6. **Plot Item Removal**:
  - If `mission.plotItem`, sets `hold.items.plot_item = 0`.
7. **Mission Cleanup**:
  - Sets `activeMission` to `null`.
  - Generates new missions using `G.generateMissions(currentPort, state)`.
8. **Auto-Save**:
  - Calls `autoSave(nextState)`.

**Output**:

- State with updated `gold`, `fame`, `infamy`, `reputation`, `hold`, `missions`, and `log`.

---

### **15. `ABANDON_MISSION**`

**Purpose**: Abandons the active mission.  
**Action**:

```js
{ type: A.ABANDON_MISSION }
```

**Logic**:

1. Sets `activeMission` to `null`.
2. Applies reputation penalty: `-10` with the mission's faction (or `"pirate"`).
3. Adds log: `"Abandoned mission: [mission name]."`.

**Output**:

- State with updated `activeMission`, `reputation`, and `log`.

---

### **16. `CONFIRM_TRADE**`

**Purpose**: Confirms a trade transaction (buying/selling goods).  
**Action**:

```js
{ type: A.CONFIRM_TRADE, buys: object, sells: object }
```

**Where**:

- `buys`: `{ [good]: qty, ... }` (goods to buy).
- `sells`: `{ [good]: qty, ... }` (goods to sell).

**Logic**:

1. **Initialization**:
  - Copies `hold.items` to `items`.
  - Initializes `goldDelta = 0`, `infamyDelta = 0`, `logLines = []`.
2. **Process Sells**:
  - For each good in `sells`:
    - Checks if good exists in `portMarket.goods`.
    - Calculates `actualQty` (minimum of requested and available).
    - Deducts `actualQty` from `items[good]`.
    - Adds `actualQty * portGood.sellToPort` to `goldDelta`.
    - Adds log: `"Sold [qty] [unit] of [good] for [revenue]g."`.
3. **Validate Buys**:
  - Calculates `usedAfterSells` using `L.getHoldUsed(items)`.
  - For each good in `buys`:
    - Checks if good exists in `portMarket.goods`.
    - Checks if `qty <= portGood.available`.
    - Calculates `pendingBuysGold` and `pendingBuysSpace`.
4. **Affordability/Capacity Check**:
  - If `state.gold + goldDelta - pendingBuysGold < 0`: Cancels trade (log: `"Trade cancelled — insufficient gold."`).
  - If `usedAfterSells + pendingBuysSpace > hold.capacity`: Cancels trade (log: `"Trade cancelled — not enough hold space."`).
5. **Commit Buys**:
  - For each good in `buys`:
    - Deducts `qty * portGood.buyFromPort` from `goldDelta`.
    - Adds `qty` to `items[good]`.
    - If good is illegal (`RESOURCES[good].infamyOnBuy`), adds `infamyDelta += 1`.
    - Adds log: `"Bought [qty] [unit] of [good] for [cost]g."`.
6. **Finalize**:
  - Updates `gold`: `state.gold + goldDelta`.
  - Updates `hold.items`: `items`.
  - Updates `infamy`: `Math.min(999, state.infamy + infamyDelta)`.
  - Adds all `logLines` to `state.log`.

**Output**:

- State with updated `gold`, `hold.items`, `infamy`, and `log`.

---

### **17. `ENTER_MARKET**`

**Purpose**: Opens the market screen.  
**Action**:

```js
{ type: A.ENTER_MARKET }
```

**Logic**:

- Sets `screen` to `"market"`.

**Output**:

- State with updated `screen`.

---

### **18. `LEAVE_MARKET**`

**Purpose**: Closes the market screen.  
**Action**:

```js
{ type: A.LEAVE_MARKET }
```

**Logic**:

- Sets `screen` to `"port"`.

**Output**:

- State with updated `screen`.

---

### **19. `INTERCEPT_FIGHT**`

**Purpose**: Initiates combat with the encountered enemy.  
**Action**:

```js
{ type: A.INTERCEPT_FIGHT }
```

**Logic**:

1. **Context Check**:
  - If no `encounterContext`, returns state unchanged.
2. **Battle State Setup**:
  - Creates `battleState` with:
    - `phase`: `"player_turn"`.
    - `playerHull`: `state.ship.hull`.
    - `playerCrew`: `state.crew.roster.length`.
    - `enemy`: From `encounterContext.enemy`.
    - `enemyHull`: `enemy.hull`.
    - `enemyCrew`: `enemy.crew`.
    - `round`: `1`.
    - `log`: `["You engage the [enemy name]!"]`.
    - `returnScreen`: `"sailing"` if en route, else `"port"`.
    - `initialCrewCount`: `state.crew.roster.length`.
    - `lostCrewNames`: `[]`.
    - `isNavyPatrol`: `encounterContext.isNavyPatrol || false`.
3. **State Update**:
  - Sets `encounterContext` to `null`.
  - Sets `battleState` to the new object.
  - Sets `screen` to `"battle"`.

**Output**:

- State with `battleState` and updated `screen`.

---

### **20. `INTERCEPT_FLEE**`

**Purpose**: Attempts to flee from an encounter.  
**Action**:

```js
{ type: A.INTERCEPT_FLEE }
```

**Logic**:

1. **Context Check**:
  - If no `encounterContext`, returns state unchanged.
2. **Speed Check**:
  - Uses `encounterContext.options.flee.speedCheck` (player and enemy speeds).
  - Rolls `1d6` for both player and enemy (`L.roll(6)`).
  - `playerRoll = playerSpeed + roll`.
  - `enemyRoll = enemySpeed + roll`.
3. **Success**:
  - If `playerRoll >= enemyRoll`:
    - Sets `encounterContext` to `null`.
    - Sets `screen` to `"sailing"` (if en route) or `"port"`.
    - Adds log: `"You pulled clear — the enemy couldn't keep up."`.
4. **Failure**:
  - Creates `battleState` (similar to `INTERCEPT_FIGHT`).
  - Sets `screen` to `"battle"`.
  - Adds log: `"Failed to escape — battle unavoidable."`.

**Output**:

- State with updated `encounterContext`, `battleState`, `screen`, and `log`.

---

### **21. `INTERCEPT_PARLEY**`

**Purpose**: Attempts to parley with the encountered enemy.  
**Action**:

```js
{ type: A.INTERCEPT_PARLEY }
```

**Logic**:

1. **Context Check**:
  - If no `encounterContext`, returns state unchanged.
2. **Success Check**:
  - Uses `L.roll(100) <= Math.min(80, rep + 20)` (where `rep` is reputation with the current/destination port).
3. **Success**:
  - Sets `encounterContext` to `null`.
  - Sets `screen` to `"sailing"` (if en route) or `"port"`.
  - Increases reputation with the port by `3` (capped at `100`).
  - Adds log: `"Parley successful. They let you pass."`.
4. **Failure**:
  - Creates `battleState` (similar to `INTERCEPT_FIGHT`).
  - Sets `screen` to `"battle"`.
  - Adds log: `"Parley failed. Battle unavoidable."`.

**Output**:

- State with updated `encounterContext`, `battleState`, `reputation`, `screen`, and `log`.

---

### **22. `INTERCEPT_BRIBE**`

**Purpose**: Attempts to bribe the encountered enemy.  
**Action**:

```js
{ type: A.INTERCEPT_BRIBE }
```

**Logic**:

1. **Context Check**:
  - If no `encounterContext`, returns state unchanged.
2. **Bribe Execution**:
  - Deducts `encounterContext.options.bribe.cost` from `gold`.
  - Decreases reputation with the current/destination port by `2` (minimum `0`).
  - Sets `encounterContext` to `null`.
  - Sets `screen` to `"sailing"` (if en route) or `"port"`.
  - Adds log: `"Bribed them with [cost]g. They looked the other way."`.

**Output**:

- State with updated `gold`, `reputation`, `encounterContext`, `screen`, and `log`.

---

### **23. `INTERCEPT_SURRENDER**`

**Purpose**: Surrenders to the encountered enemy.  
**Action**:

```js
{ type: A.INTERCEPT_SURRENDER }
```

**Logic**:

1. **Context Check**:
  - If no `encounterContext`, returns state unchanged.
2. **Consequence Handling**:
  - If `consequence` is a **function** (e.g., navy patrol):
    - Calls `consequence(state)` to get a partial state update.
    - Merges the result into the new state (e.g., `log`, `reputation`, `hold`, `gold`, `infamy`, `crew`).
  - Sets `encounterContext` to `null`.
  - Sets `screen` to `"sailing"` (if en route) or `"port"`.
3. **Static Consequence**:
  - If `consequence` is an object, applies its fields directly (e.g., `gold`, `reputation`).

**Output**:

- State with updated fields based on surrender consequences.

---

### **24. `BATTLE_ACTION**`

**Purpose**: Resolves a player's combat action.  
**Action**:

```js
{ type: A.BATTLE_ACTION, action: string }
```

**Where `action**`: `"broadside"`, `"precision"`, `"grapple"`, or `"evade"`.

**Logic**:

1. **State Check**:
  - If no `battleState`, returns state unchanged.
2. **Resolve Action**:
  - Calls `L.resolveCombatAction(state, action)` to get the outcome.
3. **Update Battle State**:
  - **Player Damage**:
    - Deducts `outcome.player.hullDamage` from `battleState.playerHull`.
    - Deducts `outcome.player.crewLoss` from `battleState.playerCrew`.
  - **Enemy Damage**:
    - Deducts `outcome.enemy.hullDamage` from `battleState.enemyHull`.
    - Deducts `outcome.enemy.crewLoss` from `battleState.enemyCrew`.
  - **Morale**:
    - Adds `outcome.moraleDelta` to `state.crew.morale` (clamped to `0-100`).
  - **Log**:
    - Adds combat log entries (e.g., `"You fire a broadside! [damage] hull damage."`).
4. **Check for Battle End**:
  - **Player Defeat**:
    - If `battleState.playerHull <= 0`:
      - Sets `battleState.phase = "defeat"`.
      - Adds log: `"Your ship is sinking... DEFEAT!"`.
  - **Enemy Defeat**:
    - If `battleState.enemyHull <= 0`:
      - Sets `battleState.phase = "victory"`.
      - Adds `outcome.goldReward` to `battleState.goldReward`.
      - Adds log: `"The enemy is destroyed! VICTORY!"`.
  - **Flee Success**:
    - If `outcome.fled`:
      - Sets `battleState.phase = "fled"`.
      - Adds log: `"You escape the battle! ESCAPED."`.
  - **Instant Victory (Grapple)**:
    - If `outcome.instantVictory`:
      - Sets `battleState.phase = "victory"`.
      - Adds `outcome.goldReward` to `battleState.goldReward`.
      - Adds log: `"You board and capture the enemy! INSTANT VICTORY!"`.
5. **NPC Turn (if battle continues)**:
  - If no end condition, resolves NPC action using `L.resolveCombatAction` (with `battleState` as input).
  - Updates `battleState` with NPC damage and logs.
6. **Round Increment**:
  - If battle continues, increments `battleState.round` by `1`.

**Output**:

- State with updated `battleState` (hull, crew, logs, phase).

---

### **25. `DISMISS_BATTLE**`

**Purpose**: Exits the battle screen and returns to the previous screen.  
**Action**:

```js
{ type: A.DISMISS_BATTLE }
```

**Logic**:

1. **Battle State Check**:
  - If no `battleState`, returns state unchanged.
2. **Victory Rewards**:
  - If `battleState.phase === "victory"`:
    - Adds `battleState.goldReward` to `state.gold`.
    - Adds log: `"+[goldReward] gold"`.
3. **Cleanup**:
  - Sets `battleState` to `null`.
  - Sets `screen` to `battleState.returnScreen` (e.g., `"sailing"` or `"port"`).
4. **Auto-Save**:
  - Calls `autoSave(nextState)`.

**Output**:

- State with updated `gold`, `battleState`, `screen`, and `log`.

---

### **26. `RESOLVE_EVENT**`

**Purpose**: Resolves a random event choice.  
**Action**:

```js
{ type: A.RESOLVE_EVENT, choiceIndex: number }
```

**Logic**:

1. **Event Check**:
  - If no `activeEvent`, returns state unchanged.
2. **Apply Choice Outcome**:
  - Gets the selected choice using `activeEvent.choices[choiceIndex]`.
  - Creates a new state with merged outcomes:
    - **Gold**: Adds `outcome.gold` (if present).
    - **Fame**: Adds `outcome.fame` (if present).
    - **Hull Damage**: Deducts `outcome.hullDamage` from `ship.hull` (minimum `0`).
    - **Crew Loss**: Removes `outcome.crewLoss` random crew members using `L.removeRandomCrew`.
    - **Days Lost**: Adds `outcome.daysLost` to `sailingDaysLeft` (if sailing).
    - **Reputation**: Applies `outcome.repImpact` using `L.applyReputationImpact`.
    - **Battle**: If `outcome.battle`, sets `encounterContext` and `screen` to `"intercept"`.
    - **Map Fragment**: If `outcome.mapFragment`, adds it to `mapFragments` and discovers the port (if applicable).
    - **Log**: Adds `outcome.log` to `state.log`.
3. **Cleanup**:
  - Sets `activeEvent` to `null`.
  - If `outcome.battle`, sets `screen` to `"intercept"`.
  - Otherwise, returns to `"sailing"` (if en route) or `"port"`.

**Output**:

- State with updated fields based on the event choice.

---

### **27. `SET_WIND**`

**Purpose**: Manually sets wind direction and speed (debug/cheat).  
**Action**:

```js
{ type: A.SET_WIND, angle: number, speed: number }
```

**Logic**:

- Updates `state.wind` to `{ angle, speed }`.

**Output**:

- State with updated `wind`.

---

---

---

## **🐛 Debug Actions**

Used for testing and development. Only available if `debug=1` in the URL.

### **1. `DEBUG_ADD_GOLD**`

**Action**:

```js
{ type: A.DEBUG_ADD_GOLD, amount: number }
```

**Logic**:

- Adds `amount` to `state.gold`.

---

### **2. `DEBUG_SET_FAME**`

**Action**:

```js
{ type: A.DEBUG_SET_FAME, fame: number }
```

**Logic**:

- Sets `state.fame` to `fame`.

---

### **3. `DEBUG_SET_INFAMY**`

**Action**:

```js
{ type: A.DEBUG_SET_INFAMY, infamy: number }
```

**Logic**:

- Sets `state.infamy` to `infamy`.

---

### **4. `DEBUG_SET_SHIP**`

**Action**:

```js
{ type: A.DEBUG_SET_SHIP, shipType: string }
```

**Logic**:

- Sets `state.ship` to a new ship of type `shipType` (with full hull and default stats).

---

### **5. `DEBUG_SET_PORT_REP**`

**Action**:

```js
{ type: A.DEBUG_SET_PORT_REP, port: string, amount: number }
```

**Logic**:

- Sets `state.reputation[port]` to `amount`.

---

### **6. `DEBUG_FILL_HOLD**`

**Action**:

```js
{ type: A.DEBUG_FILL_HOLD }
```

**Logic**:

- Fills the hold with a mix of goods (quantities based on capacity).

---

### **7. `DEBUG_REPAIR**`

**Action**:

```js
{ type: A.DEBUG_REPAIR }
```

**Logic**:

- Repairs the ship to full hull and refills provisions (food/water).

---

---

---

## **📦 Exposed Globally**

All actions and the reducer are exposed via `window.E`:

```js
window.E = (() => {
  return {
    A,                // Action types
    initialState,     // Default state
    reducer,          // State reducer
    autoSave,         // Auto-save helper
    migrateState,     // State migration helper
  };
})();
```

---

---

## **🔗 Dependencies**

- `**window.D**`: Data constants (ports, ships, factions, upgrades, etc.).
- `**window.L**`: Pure logic helpers (e.g., `travelDays`, `canReach`, `resolveCombatAction`).
- `**window.G**`: Generators (e.g., `generateMissions`, `generatePortMarket`, `generateRoster`).
- `**localStorage**`: For save/load functionality.
- `**Math.random()**`: For randomness in events, patrols, and combat.

---

---

## **📝 Notes for Refactoring**

1. **Reducer Complexity**:
  - The `ADVANCE_DAY` case is **very large** (handles sailing, events, patrols, discoveries, etc.). Consider splitting it into smaller helper functions (e.g., `handleSailingDay`, `handleRandomEvent`, `handlePatrolCheck`).
  - The `COMPLETE_MISSION` case is also complex. Consider extracting cargo checks and reward calculations into helpers.
2. **State Mutability**:
  - The reducer **should** treat `state` as immutable. Some cases (e.g., `ADVANCE_DAY`) modify arrays/objects directly. Ensure all updates use the spread operator (`...`) or `Object.assign` to avoid side effects.
3. **Auto-Save**:
  - Auto-save is called in `ENTER_PORT` and `DISMISS_BATTLE`. Consider adding it to other critical actions (e.g., `COMPLETE_MISSION`, `ABANDON_MISSION`).
4. **Error Handling**:
  - No explicit error handling for invalid actions (e.g., `BUY_SHIP` with a non-existent ship type). Add validation or fallbacks.
5. **Performance**:
  - No performance issues identified. The reducer is called infrequently (per player action/day).
6. **Testing**:
  - Critical cases to test:
    - `ADVANCE_DAY` (sailing, events, patrols, discoveries).
    - `COMPLETE_MISSION` (cargo checks, rewards, reputation).
    - `BATTLE_ACTION` (combat resolution, damage, morale).
    - `RESOLVE_EVENT` (event outcomes, state updates).
7. **Debug Actions**:
  - Debug actions are **not gated** in the reducer (only in the UI). Consider adding a `isDebug` check in the reducer for security.
8. **State Migration**:
  - The `migrateState` function is **additive** and **non-destructive**. Ensure new migrations follow this pattern.
9. **Encounter Context**:
  - The `buildEncounterContext` function (from `logic.js`) is used heavily. Ensure its logic is consistent with the reducer's expectations.
10. **Battle State**:
  - The `battleState` object is **not persisted** in saves. Ensure it is reconstructed correctly if needed (e.g., after a page reload).

---
