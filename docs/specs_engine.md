# Engine Architecture Specification

**Broadside Game Engine**
*Last Updated: June 27, 2026*
*Architecture: 4-Way Split (Core + Port + Voyage + Combat + Middleware)*

---

## 1. Overview

The engine is split into **7 files** for maintainability:

```js
engine_core.js      # Shared infrastructure (constants, initial state, reducer dispatcher, debug/save actions)
engine_port.js      # Port domain (start, navigation, market, missions, crew, shipyard, equipment, repair)
engine_voyage.js    # Voyage domain (sailing, wind, provisions, hidden ports, events, patrols)
engine_combat.js    # Combat domain (encounters, battles, plunder, event resolution)
engine_onboarding.js # Onboarding middleware (QM step tracking, tutorial progression)
engine_career.js     # Career stats middleware (lifetime tracking, delta-based stats)
engine_scripted.js  # Dev-only scripted playthrough reducer (inert unless ?scripted=1)
```

**Core Principles:**

- **Single Responsibility**: Each file handles a distinct domain or middleware concern.
- **Shared Infrastructure**: `engine_core.js` contains global constants and the reducer dispatcher.
- **No Circular Dependencies**: `engine_core.js` loads first; domain files and middleware register their reducers afterward.
- **Global Namespace**: All files attach to `window.E` for cross-file access.
- **Middleware Pattern**: `engine_onboarding.js` and `engine_career.js` are **middleware reducers** that run *after* domain reducers to track state deltas.

### Load Order (Critical!)

```html
<!-- engine_core.js MUST load first -->
<script src="engine_core.js"></script>
<!-- Domain files can load in any order after core -->
<script src="engine_port.js"></script>
<script src="engine_voyage.js"></script>
<script src="engine_combat.js"></script>
<!-- Middleware files MUST load AFTER domain files -->
<script src="engine_onboarding.js"></script>
<script src="engine_career.js"></script>
<!-- Dev-only: load last -->
<script src="engine_scripted.js"></script>
```

### Reducer Chaining Mechanism

```js
// In engine_core.js:
window.E._reducers = [];
window.E.reducer = (state, action) => {
  const tagged = { ...action, __prevState: state }; // Tag with previous state
  return window.E._reducers.reduce((s, r) => r(s, tagged), state);
};

// In each file (domain or middleware):
window.E._reducers.push((state, action) => {
  switch (action.type) {
    case A.SOMETHING: { ... }
    default: return state;
  }
});
```

When `window.E.reducer(state, action)` is called:
1. **Domain reducers** (port, voyage, combat) run first.
2. **Middleware reducers** (onboarding, career) run afterward, using `action.__prevState` to detect deltas.
3. **Dev-only reducer** (scripted) runs last (if enabled).

```
Action: A.COMPLETE_MISSION
+-- Debug/save reducer: No match -> returns state unchanged
+-- Port reducer: Matches A.COMPLETE_MISSION -> updates gold, fame, missions
+-- Voyage reducer: No match -> returns state unchanged
+-- Combat reducer: No match -> returns state unchanged
+-- Onboarding reducer: Matches -> updates stepsCompleted if applicable
+-- Career reducer: Matches -> updates missionLog, goldEarned, etc.
+-- Scripted reducer: No match (unless ?scripted=1) -> returns state unchanged
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
| **Onboarding** |  `ONBOARDING_QM_SEEN`, `ONBOARDING_SKIP`, `ONBOARDING_COMPLETE` |

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
  },
  portMarket: null,
  portGossip: [],
  missions: [],
  activeMission: null,
  reputation: { /* all port keys: 50 */ },
  battleState: null,
  activeEvent: null,
  encounterContext: null,
  onboarding: {
    enabled: false,
    completed: true,
    currentStep: 0,
    stepsCompleted: { /* e.g., contractsOpened: false, ... */ },
    qmMessagesSeen: {},
    combatHintShown: false,
    qmDismissed: false
  },
  tutorialMode: "light",      // "full" | "light" | "none"
  career: {
    goldEarned: 0,
    goldSpent: 0,
    crewHired: 0,
    crewDismissed: 0,
    crewLost: { inBattle: 0, inStorm: 0, deserted: 0, other: 0 },
    longestCrewTenure: 0,
    battles: { won: 0, lost: 0, fled: 0 },
    shipsOwned: [],
    shipsSunk: 0,
    shipsPlundered: 0,
    missions: { completed: 0, failed: 0, abandoned: 0 },
    portsVisited: [],
    stormsSurvived: 0,
    contrabandSeized: 0,
    combatLog: [],
    missionLog: []
  }
}
```

### Shared Helpers

| Helper | Signature | Purpose |
|---|---|---|
| `autoSave` | `(state) -> void` | Saves state to localStorage if screen is port-related |
| `migrateState` | `(loaded) -> state` | Adds missing fields for save compatibility with older versions |
| `createBattleState` | `(state, enemy, encounterType) -> battleState` | Factory for battle state objects |

### Debug Reducer (registered first)

Handles all `DEBUG_*` actions. Only available when `?debug=1` URL param is set.

| Action | Payload | Effect |
|---|---|---|
| `DEBUG_ADD_GOLD` | `{ amount }` | Adds gold |
| `DEBUG_SET_FAME` | `{ value }` | Sets fame to value |
| `DEBUG_SET_INFAMY` | `{ value }` | Sets infamy to value |
| `DEBUG_SET_SHIP` | `{ shipType }` | Switches ship type (resets equipment, adjusts crew/hull) |
| `DEBUG_SET_PORT_REP` | `{ port, value }` | Sets port reputation to value |
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
| `START_GAME` | `{ captainName, faction, tutorialMode }` | Initialises state from `D.STARTS` (faction-keyed). Generates crew roster, market, missions, gossip. Sets reputation adjustments. Injects QM and tutorial mission if `tutorialMode === "full"`. |
| `NAVIGATE` | `{ screen }` | Changes `state.screen`. No side effects. |
| `SAIL_TO` | `{ destination }` | Sets destination, calculates travel days, switches to sailing screen. |
| `ENTER_PORT` | -- | Handles port arrival: generates market/missions/gossip, processes desertion, processes positive traits (seasoned/veteran/loyal), applies heat decay, checks hostile port entry. |
| `REPAIR` | -- | Repairs hull. Cost based on damage amount and reputation discount (via `L.getRepairCost`). |
| `BUY_SHIP` | `{ shipType }` | Purchases new ship. Resets equipment to empty. Truncates crew if new maxCrew < current. Awards trade-in value for old ship. |
| `BUY_EQUIPMENT` | `{ equipKey }` | Purchases equipment from shop (adds to `equipmentInventory`). Deducts cost. |
| `INSTALL_EQUIPMENT` | `{ equipKey }` | Installs from locker to ship slot. Validates via `L.canInstallEquipment`. Deducts installFee. |
| `REMOVE_EQUIPMENT` | `{ equipKey, slot }` | Removes from ship slot to locker. Only if `removable: true`. |
| `HIRE_CREW` | `{ count }` | Generates and adds crew members. Cost: 50g per hire. Capped at ship maxCrew. Injects tutorial hunt mission if onboarding is active and first crew hired. |
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
| `pickArrivalMessage(state)` | Selects a random arrival log message template from `D.ARRIVAL_MESSAGES` |

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
| `maybeRandomEvent(state)` | ~10% chance. Filters `D.RANDOM_EVENTS` by `condition(state)`. Picks random eligible event. |
| `checkRandomPatrol(state)` | Patrol chance: `min(0.01 + infamy/400 + maxHeat*0.03, 0.40)`, dampened by high rep |
| `advanceHiddenPorts(state)` | Checks `L.canSeePort` for each hidden port not yet in `discoveredPorts`. Auto-discovers if conditions met. |

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
| `PATROL_INSPECT` | **Navy patrol inspection.** Checks hold for contraband (tobacco, slaves, smuggle-mission rum). Hidden Compartment equipment gives 50% avoid chance. On find: seizes contraband, fine = `PATROL_FINE_RATE * value`, +2 infamy, -5 faction rep, -10 morale. |
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
| `addHeat(state, faction, amount)` | Adds heat to `factionAlerts[faction]`, capped at 10 |

### Battle State Shape

Created by `E.createBattleState()`. Shape:

```js
{
  phase: "player_turn" | "npc_turn" | "victory" | "defeat" | "fled",
  round: number,
  playerHull: number,
  playerCrew: number,
  enemy: { name, hull, maxHull, cannons, crew, faction, gold },
  enemyHull: number,
  enemyCrew: number,
  log: [],           // battle log entries
  canPlunder: boolean,
  goldReward: number,
  enemyCargo: {},    // generated by G.generateEnemyCargo
  lostCrewNames: [], // names of crew lost in battle
  encounterType: string,  // "patrol", "mission_combat", "random", etc.
  initialCrewCount: number // snapshot of crew at battle start
}
```

---

## 6. engine_onboarding.js -- Onboarding Middleware Reducer

**Purpose**: Tracks onboarding progress and injects tutorial-specific state changes. Runs **after** domain reducers (port, voyage, combat) to avoid polluting domain logic.

### Core Design
- **Middleware Pattern**: This reducer **watches all actions** and updates onboarding state as a side effect.
- **Declarative Rules**: Uses a `STEP_RULES` lookup table to map actions to onboarding steps.
- **QM Integration**: Manages the Quartermaster (QM) character, who guides the player in `"full"` tutorial mode.
- **Load Order**: Must load **after** `engine_port.js`, `engine_voyage.js`, and `engine_combat.js` because it inspects *post-domain-reducer* state.

---

### Reducer Structure
```js
window.E._reducers.push((state, action) => {
  // Skip if onboarding is disabled or completed
  if (!state.onboarding?.enabled || state.onboarding?.completed) {
    return state;
  }

  // Apply step rules
  const stepUpdates = STEP_RULES[action.type]?.(state, action);
  if (!stepUpdates) return state;

  // Merge updates into onboarding state
  return {
    ...state,
    onboarding: {
      ...state.onboarding,
      ...stepUpdates
    }
  };
});
```

---

### Step Rules (STEP_RULES)
A lookup table mapping action types to functions that return onboarding state updates. Each rule receives `(prevState, action)` and returns an object to merge into `state.onboarding`.

#### Key Rules

| **Action Type** | **Trigger Condition** | **Effect** |
|------------------|------------------------|------------|
| `START_GAME` | Always | Initializes `stepsCompleted` and `qmMessagesSeen` based on `tutorialMode`. |
| `NAVIGATE` | Screen = `"port"` | Marks `contractsOpened: true`. |
| `CONFIRM_TRADE` | `activeMission?.type === "trade"` | Marks `firstContractAccepted: true` and `provisionsAndGoodsBought: true` if food/water were bought. |
| `HIRE_CREW` | Always | Marks `firstCrewHired: true`. Injects `TUTORIAL_HUNT` mission if not already present. |
| `COMPLETE_MISSION` | `activeMission?.tutorial` | Marks `firstContractDelivered: true`. |
| `SAIL_TO` | Always | Marks `firstVoyageStarted: true`. |
| `ENTER_PORT` | `previousPort !== null` | Marks `firstArrival: true`. |
| `INTERCEPT_FIGHT` | `encounterContext.type === "mission_combat"` | Marks `tutorialHuntAccepted: true`. |
| `DISMISS_BATTLE` | `battleState.phase === "victory"` | Marks `tutorialHuntCompleted: true`. |
| `NAVIGATE` | Screen = `"shipyard"` | Marks `shipyardOpened: true`. |
| `REPAIR` | Always | Marks `shipRepaired: true`. |
| `NAVIGATE` | Screen = `"journal"` | Marks `journalOpened: true`. |
| `ONBOARDING_ADVANCE` | Always | Advances `currentStep` by 1. |
| `ONBOARDING_QM_SEEN` | Always | Marks a QM message as seen in `qmMessagesSeen`. |
| `ONBOARDING_SKIP` | Always | Sets `completed: true`, removes QM from crew, logs farewell. |
| `ONBOARDING_COMPLETE` | Always | Sets `completed: true`, removes QM from crew, logs farewell. |

---

### Quartermaster (QM) System
- **QM Crew Member**: A special crew member with `id: "qm_tutorial"` and tags `["quartermaster", "protected"]`.
  - **Protected**: Cannot be dismissed via `DISMISS_CREW`.
  - **Dialogue**: Uses `D.QM_DIALOGUE` for scripted messages (e.g., `"qm_welcome"`, `"qm_first_contract"`).
- **QM Popup**: Rendered by `OnboardingPopup` in `screens_core.jsx`. Shows QM messages based on `state.onboarding.currentStep`.
- **QM Dismissal**: Triggered by `ONBOARDING_SKIP` or `ONBOARDING_COMPLETE`. Removes QM from `state.crew.roster` and logs:
  ```
  "The Quartermaster disembarks. 'Fair winds, Captain. The Caribbean awaits.'"
  ```

---
### Tutorial Mission Injection
- **Tutorial Delivery Mission**: Auto-accepted in `"full"` mode. Defined in `D.TUTORIAL_DELIVERY`.
- **Tutorial Hunt Mission**: Injected after first crew hire. Defined in `D.TUTORIAL_HUNT`.
- **Injection Logic**:
  - Delivery mission: Added to `missions` in `START_GAME` if `tutorialMode === "full"`.
  - Hunt mission: Added to `missions` in `HIRE_CREW` or `ENTER_PORT` if `tutorialMode === "full"` and `firstCrewHired` is true but `tutorialHuntAccepted` is false.

---
### Onboarding Actions

| Action | Payload | Description |
|---|---|---|
| `ONBOARDING_ADVANCE` | `{ step: number }` | Advances onboarding to the next step. *(Internal to middleware; not in `E.A`)* |
| `ONBOARDING_QM_SEEN` | `{ messageId: string }` | Marks a QM message as seen (e.g., `"qm_welcome"`). |
| `ONBOARDING_SKIP` | -- | Skips onboarding, removes QM, marks all steps as completed. |
| `ONBOARDING_COMPLETE` | -- | Completes onboarding, removes QM, marks all steps as completed. |

---

## 7. engine_career.js -- Career Stats Middleware Reducer

**Purpose**: Tracks **lifetime statistics** and **detailed logs** (missions, combats) as side effects of gameplay. Runs **after** domain reducers to avoid polluting core logic.

### Core Design
- **Middleware Pattern**: This reducer **watches all actions** and updates `state.career` as a side effect.
- **Delta-Based Tracking**: Uses `action.__prevState` to detect changes (e.g., gold earned = `currentGold - prevGold`).
- **No Domain Logic**: Does **not** modify gameplay state—only tracks stats.
- **Load Order**: Must load **after** domain reducers (port, voyage, combat) and `engine_onboarding.js`.

---

### Reducer Structure
```js
window.E._reducers.push(careerMiddleware);

function careerMiddleware(state, action) {
  const nextCareer = { ...state.career };
  let changed = false;
  const prevState = action.__prevState || state;

  // Gold tracking (net deltas only)
  if (!SKIP_GOLD_TRACKING.includes(action.type)) {
    const goldDelta = (state.gold ?? 0) - (prevState.gold ?? 0);
    if (goldDelta > 0) {
      nextCareer.goldEarned = (nextCareer.goldEarned || 0) + goldDelta;
      changed = true;
    } else if (goldDelta < 0) {
      nextCareer.goldSpent = (nextCareer.goldSpent || 0) + Math.abs(goldDelta);
      changed = true;
    }
  }

  // Action-specific tracking
  switch (action.type) {
    case A.HIRE_CREW:      // Track crew hired
    case A.DISMISS_CREW:   // Track crew dismissed + tenure
    case A.ENTER_PORT:     // Track ports visited + desertions
    case A.BUY_SHIP:       // Track ships owned
    case A.RESOLVE_EVENT:  // Track storms survived + crew loss
    case A.PATROL_INSPECT: // Track contraband seized
    case A.DISMISS_BATTLE: // Track battles won/lost/fled + crew loss
    case A.TAKE_PLUNDER:   // Track ships plundered + crew loss
    case A.COMPLETE_MISSION:// Track missions completed
    case A.ABANDON_MISSION:// Track missions abandoned
    case A.START_GAME:    // Initialize with starting port
    default: break;
  }

  if (changed) return { ...state, career: nextCareer };
  return state;
}
```

---
### SKIP_GOLD_TRACKING
Actions that **wholesale-replace state** and should not contribute to career deltas:
```js
const SKIP_GOLD_TRACKING = [
  A.START_GAME,
  A.LOAD_GAME,
  A.IMPORT_SAVE
];
```

---
### Career State Shape
Stored in `state.career` (initialized from `D.DEFAULT_CAREER`):

```js
{
  // Lifetime counters
  goldEarned: number,       // Total gold earned (from positive deltas)
  goldSpent: number,        // Total gold spent (from negative deltas)
  crewHired: number,        // Total crew hired
  crewDismissed: number,    // Total crew dismissed
  crewLost: {               // Crew lost by cause
    inBattle: number,
    inStorm: number,
    deserted: number,
    other: number
  },
  longestCrewTenure: number,// Max daysAboard for any crew member
  battles: {                // Combat stats
    won: number,
    lost: number,
    fled: number
  },
  shipsOwned: [             // History of owned ships
    { type: string, dayAcquired: number }
  ],
  shipsSunk: number,        // Enemy ships sunk (hull-zero victories)
  shipsPlundered: number,   // Enemy ships plundered (grapple victories)
  stormsSurvived: number,   // Storm events survived
  contrabandSeized: number,  // Times contraband was seized by patrols
  portsVisited: string[],    // List of port keys visited
  // Detailed logs
  combatLog: [              // List of combat entries
    {
      day: number,
      encounterType: string,
      enemyName: string,
      enemyFaction: string,
      enemyShipType: string,
      outcome: "won" | "lost" | "fled",
      playerShipType: string,
      crewLost: number,
      plundered: boolean      // True if player took plunder
    }
  ],
  missionLog: [             // List of mission entries
    {
      day: number,
      faction: string,
      type: string,
      risk: string,
      status: "completed" | "failed" | "abandoned",
      gold: number,
      fame: number,
      infamyGain: number,
      targetPort: string,
      daysToComplete: number
    }
  ]
}
```

---
### Tracking Details

#### Crew Tracking
| Action | Tracking | Notes |
|---|---|---|
| `HIRE_CREW` | `crewHired += action.count` | -- |
| `DISMISS_CREW` | `crewDismissed += 1` | Also tracks `longestCrewTenure` from dismissed member’s `daysAboard` |
| `ENTER_PORT` | `crewLost.deserted += departed.length` | Detects crew who left roster between `prevState` and `state` |
| `RESOLVE_EVENT` | `crewLost.inStorm += lostMembers.length` (if event.id === "storm") | Detects crew lost in storms |
| `DISMISS_BATTLE` | `crewLost.inBattle += lostInBattle.length` | Detects crew lost in combat |
| `TAKE_PLUNDER` | `crewLost.inBattle += lostInBattle.length` | Also tracks `shipsPlundered += 1` |

#### Battle Tracking
| Action | Tracking | Notes |
|---|---|---|
| `DISMISS_BATTLE` | `battles[outcome] += 1` | `outcome` = `battleState.phase` ("victory", "defeat", "fled") |
| `DISMISS_BATTLE` | `shipsSunk += 1` | If `!battleState.canPlunder` (enemy hull = 0) |
| `TAKE_PLUNDER` | `shipsPlundered += 1` | Also tracks `battles.won += 1` and crew loss |
| `DISMISS_BATTLE` | `combatLog.push({...})` | Adds entry with enemy details, outcome, crew lost |

#### Mission Tracking
| Action | Tracking | Notes |
|---|---|---|
| `COMPLETE_MISSION` | `missionLog.push({ status: "completed", ... })` | Records mission details |
| `ABANDON_MISSION` | `missionLog.push({ status: "abandoned", ... })` | Records mission details |
| `DISMISS_BATTLE` | `missionLog.push({ status: "failed", ... })` | For mission failures via combat defeat |

#### Ship Tracking
| Action | Tracking | Notes |
|---|---|---|
| `BUY_SHIP` | `shipsOwned.push({ type, dayAcquired: state.day })` | Records ship purchase |
| `START_GAME` | `portsVisited = [startPort]` | Initializes with starting port |

#### Event Tracking
| Action | Tracking | Notes |
|---|---|---|
| `RESOLVE_EVENT` | `stormsSurvived += 1` | If `event.id === "storm"` |
| `PATROL_INSPECT` | `contrabandSeized += 1` | If tobacco or slaves were seized |

---
## 8. engine_scripted.js -- Dev-Only Scripted Playthrough Reducer

**Purpose**: Enables **pre-defined playthroughs** for testing or demonstrations. **Inert unless `?scripted=1` is in the URL.**

### Core Design
- **Dev-Only**: Only active when `?scripted=1` URL parameter is set.
- **Scripted Actions**: Overrides normal gameplay with pre-defined sequences.
- **Load Order**: Must load **last** in the reducer chain.

---
### Reducer Structure
```js
if (new URLSearchParams(window.location.search).get('scripted') !== '1') {
  // No-op: return state unchanged
  return state;
}

// Otherwise, register scripted reducer
window.E._reducers.push((state, action) => {
  // Handle scripted actions (e.g., forced encounters, events)
  switch (action.type) {
    case A.SCRIPTED_TRIGGER_ENCOUNTER:
      return triggerScriptedEncounter(state, action);
    case A.SCRIPTED_FORCE_EVENT:
      return forceScriptedEvent(state, action);
    default:
      return state;
  }
});
```

---
### Scripted Actions

| Action | Payload | Description |
|---|---|---|
| `SCRIPTED_TRIGGER_ENCOUNTER` | `{ enemy, encounterType }` | Forces an encounter with the specified enemy. |
| `SCRIPTED_FORCE_EVENT` | `{ eventId }` | Forces a specific random event to trigger. |
| `SCRIPTED_SET_STATE` | `{ partialState }` | Overwrites parts of the state with the provided values. |

---
### Usage Example
```html
<!-- Enable scripted mode -->
<script>
  // Before loading the game:
  window.location.search = "?scripted=1";
</script>
```

```javascript
// In a test or demo:
dispatch({
  type: A.SCRIPTED_TRIGGER_ENCOUNTER,
  enemy: { name: "The Black Pearl", hull: 200, cannons: 30, crew: 100, faction: "pirate" },
  encounterType: "mission_combat"
});
```

---
## 9. File Statistics

| File | Reducer Cases | Helpers | Purpose |
|---|---|---|---|
| `engine_core.js` | 17 (debug 13 + save/load 4) | 3 | Shared infrastructure |
| `engine_port.js` | 16 | 5 | Port logic |
| `engine_voyage.js` | 2 | 8+ | Sailing logic |
| `engine_combat.js` | 12 | 2 | Combat logic |
| `engine_onboarding.js` | 0 (middleware) | 1 (`STEP_RULES` table) | Onboarding middleware |
| `engine_career.js` | 0 (middleware) | 1 (`careerMiddleware`) | Career stats middleware |
| `engine_scripted.js` | 3 | 0 | Dev-only scripted playthrough |
| **Total** | **47 domain + 3 middleware** | **20+** | All engine logic |

---
## 10. Dependencies

All engine files depend on:

| Dependency | Used for |
|---|---|
| `window.D` | PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES, RANDOM_EVENTS, STARTS, ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE |
| `window.L` | All pure game math (combat, reputation, travel, fame, equipment, crew tags, encounter context, hold capacity) |
| `window.G` | Generators (missions, markets, crew, enemies, cargo, gossip, bios) |
| `window.E.A` | Action constants (from `engine_core.js` -- must load first) |

---
## 11. Domain Responsibility Summary

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

### engine_onboarding.js (Middleware)
- Onboarding step tracking via `STEP_RULES` lookup table
- Quartermaster (QM) character management (add/remove, dialogue)
- Tutorial mission injection (delivery, hunt)
- Onboarding lifecycle actions (`ONBOARDING_ADVANCE`, `ONBOARDING_SKIP`, `ONBOARDING_COMPLETE`)

### engine_career.js (Middleware)
- Lifetime stats tracking (gold, crew, battles, ships, missions)
- Delta-based detection (using `action.__prevState`)
- Detailed logs (combat, missions)
- Career initialization on `START_GAME`

### engine_scripted.js (Dev-Only)
- Scripted encounter/event triggering
- State overrides for testing
- Only active with `?scripted=1` URL parameter