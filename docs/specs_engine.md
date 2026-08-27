# Engine Architecture Specification

**Broadside Game Engine**  
*Last Updated: August 27, 2026*  
*Architecture: 9-Way Split (Core + 5 Domains + 2 Middleware + Scripted)*

---

## 1. Overview

The engine is split into **9 files** for maintainability:

```js
engine_core.js        # Shared infrastructure (action constants, initial state, reducer dispatcher, shared helpers)
engine_port.js        # Port domain (start, navigation, market, missions, crew, shipyard, equipment, repair, preview port)
engine_voyage.js      # Voyage domain (sailing, wind, provisions, hidden ports, events, patrols, drunkard)
engine_battle.js      # Battle domain (BATTLE_ACTION, DISMISS_BATTLE, TAKE_PLUNDER)
engine_encounter.js   # Encounter domain (intercepts, random events, merchant encounters, inspection, wash ashore)
engine_onboarding.js  # Onboarding middleware (QM step tracking, tutorial progression)
engine_career.js      # Career stats middleware (lifetime tracking, delta-based stats)
engine_scripted.js    # Dev-only scripted playthrough reducer (?scripted=1)
engine_debug.js       # [Not yet extracted, currently in engine_core.js] Debug actions
```

**Note**: Debug actions currently reside in `engine_core.js`; extraction to a separate file is planned but not yet done.

**Core Principles:**

- **Single Responsibility**: Each file handles a distinct domain or middleware concern.
- **Shared Infrastructure**: `engine_core.js` contains global constants and the reducer dispatcher.
- **No Circular Dependencies**: Domain files must not import from each other's reducer logic. However, they may use shared helpers exposed on `window.E` (e.g., `washAshore`, `applyNavyPatrolSurrender`) as long as the dependency direction remains acyclic. `engine_battle.js` depends on `engine_encounter.js` via `window.E.washAshore`, which is a one‑way dependency and is permitted.
- **Global Namespace**: All files attach to `window.E` for cross-file access.
- **Middleware Pattern**: `engine_onboarding.js` and `engine_career.js` are **middleware reducers** that run *after* domain reducers to track state deltas.

### Load Order (Critical!)

```html
<!-- engine_core.js MUST load first -->
<script src="engine_core.js"></script>
<!-- Domain files can load in any order after core -->
<script src="engine_port.js"></script>
<script src="engine_voyage.js"></script>
<script src="engine_battle.js"></script>
<script src="engine_encounter.js"></script>
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
1. **Debug reducer** (currently in `engine_core.js`) runs first.
2. **Save/load reducer** (also in `engine_core.js`) runs second.
3. **Domain reducers** (port, voyage, battle, encounter) run in order.
4. **Middleware reducers** (onboarding, career) run afterward, using `action.__prevState`.
5. **Dev-only reducer** (scripted) runs last (if enabled).

---

## 2. engine_core.js -- Shared Infrastructure

**Purpose**: Action constants, initial state, reducer dispatcher, shared helpers, debug actions, save/load actions.

### Exports

| Export | Description |
|---|---|
| `window.E.A` | Action type constants (currently ~51) |
| `window.E.initialState` | Default game state (version 2) |
| `window.E.reducer` | Master reducer (chains all domain reducers) |
| `window.E._reducers` | Reducer registry array |
| `window.E.autoSave` | Auto-save helper (calls `L.saveToLocalStorage`) |
| `window.E.migrateState` | State migration for save compatibility |
| `window.E.logEntry` | Log line formatter |
| `window.E.buildEncounterSession` | Factory for encounterSession from context |

### Action Constants (window.E.A)

```js
window.E.A = {
  NAVIGATE, SAIL_TO, ADVANCE_DAY, ENTER_PORT, DISCOVER_PORT, PREVIEW_PORT,
  START_GAME, SAVE_GAME, LOAD_GAME, TOGGLE_AUTO_SAVE, EXPORT_SAVE, IMPORT_SAVE,
  REPAIR, BUY_SHIP, BUY_EQUIPMENT, INSTALL_EQUIPMENT, REMOVE_EQUIPMENT,
  HIRE_CREW, DISMISS_CREW, RAISE_MORALE,
  REFRESH_MISSIONS, TAKE_MISSION, COMPLETE_MISSION, ABANDON_MISSION,
  CONFIRM_TRADE,
  INTERCEPT_FIGHT, INTERCEPT_FLEE, INTERCEPT_PARLEY, INTERCEPT_BRIBE,
  INTERCEPT_SURRENDER,
  BATTLE_ACTION, DISMISS_BATTLE, TAKE_PLUNDER,
  RESOLVE_EVENT, RESOLVE_DRIFTING_WRECK_SEARCH,
  PATROL_INSPECT, RESOLVE_INSPECTION,
  ATTACK_PIRATE, ATTACK_MERCHANT,
  ONBOARDING_QM_SEEN, ONBOARDING_SKIP, ONBOARDING_COMPLETE,
  DEBUG_ADD_GOLD, DEBUG_SET_FAME, DEBUG_SET_INFAMY, DEBUG_SET_SHIP,
  DEBUG_SET_PORT_REP, DEBUG_FILL_HOLD, DEBUG_REPAIR, DEBUG_SET_MORALE,
  DEBUG_UNLOCK_HIDDEN_PORTS, DEBUG_MAX_CREW, DEBUG_COMPLETE_MISSION,
  DEBUG_SET_HEAT, DEBUG_AGE_CREW, DEBUG_COMBAT, DEBUG_TRIGGER_EVENT
};
```

### Initial State (window.E.initialState)

```js
{
  version: 2,                        // CURRENT_STATE_VERSION
  screen: "title",
  day: 1,
  startDate: { day: 1, month: 6, year: 1695 },
  log: [],
  gold: 0,
  fame: 0,
  infamy: 0,
  factionAlerts: { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 },
  currentPort: "portRoyal",
  route: null,
  captainName: "",
  faction: null,
  tutorialMode: "full",
  onboarding: { /* see below */ },
  autoSave: true,
  scenarioId: null,                  // vestigial
  previousPort: null,
  previewPortMarket: null,           // NEW
  destination: null,
  discoveredPorts: [...],            // non-hidden ports
  mapFragments: [],
  equipmentInventory: [],
  sailingDaysLeft: 0,
  sailingDaysTotal: 0,
  wind: { angle: 45, speed: 10 },
  ship: { type: "dinghy", name: "The Sea Dog", hull: 30, cannons: 2, equipment: { hull: [], armament: [], rigging: [], special: [] } },
  crew: { roster: [], max: 5, morale: 80 },
  hold: { items: { /* all goods, each 0 */ } },
  portMarket: null,
  portGossip: [],
  missions: [],
  activeMission: null,
  reputation: {},
  encounterSession: null,
  notableNPCs: {},
  activeEvent: null,
  gameOverReason: null,
  career: createDefaultCareer(),     // deep-cloned from D.DEFAULT_CAREER
}
```

### Shared Helpers

| Helper | Signature | Purpose |
|---|---|---|
| `autoSave` | `(state) -> void` | Saves state to localStorage via `L.saveToLocalStorage` after 1s debounce |
| `migrateState` | `(loaded) -> state` | Adds missing fields for save compatibility, sets version to 2 |
| `logEntry` | `(state, message) -> string` | Formats a log line with day prefix |
| `buildEncounterSession` | `(state, context) -> encounterSession` | Creates a session from a context object, using explicit `source` |

### Debug Reducer (currently in engine_core.js)

Handles all `DEBUG_*` actions. Available only when `?debug=1` URL param is set. Actions include: add gold, set fame/infamy, set ship, set port rep, fill hold, repair, set morale, unlock hidden ports, max crew, complete mission, set heat, age crew, debug combat, trigger event.

### Save/Load Reducer (also in engine_core.js)

| Action | Effect |
|---|---|
| `SAVE_GAME` | Calls `L.saveToLocalStorage(state)` |
| `LOAD_GAME` | Calls `L.loadFromLocalStorage()`, migrates, regenerates market/missions |
| `EXPORT_SAVE` | Encodes via `L.encodeSave` and triggers download |
| `IMPORT_SAVE` | Decodes via `L.decodeSave`, migrates, restores state |
| `TOGGLE_AUTO_SAVE` | Toggles `state.autoSave` |

---

## 3. engine_port.js -- Port Domain Reducer

**Purpose**: All port-related state transitions (start, navigation, market, missions, crew, shipyard, equipment, repair, preview port).

### Reducer Cases

| Action | Payload | Description |
|---|---|---|
| `START_GAME` | `{ captainName, faction, tutorialMode }` | Initializes state from `D.STARTS` (faction-keyed). Injects QM and tutorial mission if `tutorialMode === "full"`. |
| `NAVIGATE` | `{ screen }` | Changes `state.screen`. Also transitions `encounterSession` to `"plunder"` if navigating to plunder screen from victory. |
| `SAIL_TO` | `{ port }` | Sets destination, calculates travel days, switches to sailing screen. Supports mid-voyage reroute from sea position. |
| `ENTER_PORT` | — | Handles port arrival: generates market/missions/gossip, processes desertion, positive traits, injects tutorial hunt, resets counters, checks unrecoverable state. |
| `PREVIEW_PORT` | `{ port }` | Generates a market for the target port and stores it in `state.previewPortMarket` (used for trade tips). |
| `REPAIR` | — | Repairs hull. Cost based on damage, reputation discount, equipment penalties. |
| `BUY_SHIP` | `{ shipType, shipName }` | Purchases new ship. Resets equipment, truncates crew if needed. |
| `BUY_EQUIPMENT` | `{ equipmentKey }` | Purchases and installs equipment from shop. |
| `INSTALL_EQUIPMENT` | `{ equipmentKey }` | Installs from locker to ship slot. |
| `REMOVE_EQUIPMENT` | `{ equipmentKey }` | Removes from ship slot to locker (if removable). |
| `HIRE_CREW` | `{ count }` | Generates and adds crew members (cost 50g each). Injects tutorial hunt if onboarding active. |
| `DISMISS_CREW` | `{ memberId }` | Removes a crew member by ID. Blocks dismissal of quartermaster during active onboarding. |
| `RAISE_MORALE` | — | Spends gold to boost morale (+5, cost 5g per crew). |
| `REFRESH_MISSIONS` | — | Regenerates mission board for current port. |
| `TAKE_MISSION` | `{ mission }` | Accepts mission. Combat missions trigger immediate intercept. |
| `COMPLETE_MISSION` | — | Awards rewards, removes required goods, applies rep/fame/infamy, handles greedy trait. |
| `ABANDON_MISSION` | — | Clears active mission, applies rep penalty. |
| `CONFIRM_TRADE` | `{ buys, sells }` | Executes market trade, validates via `validateTrade`. |

### Helpers

- `checkServicesBlocked(state)` — returns blocked state if port at war.
- `validateTrade(state, buys, sells)` — validates gold, hold space, market quantities.
- `applyMissionCompletion(state, mission)` — computes rewards/logs.
- `pickArrivalMessage(state)` — selects arrival log message.

---

## 4. engine_voyage.js -- Voyage Domain Reducer

**Purpose**: Sailing and navigation logic (day advancement, wind, provisions, crew, events, patrols, hidden ports).

### Reducer Cases

| Action | Payload | Description |
|---|---|---|
| `ADVANCE_DAY` | — | Core sailing loop. Executes: advance wind, advance crew, consume provisions, pay wages, check smuggle patrol, mission encounter, random event, random patrol, drunkard event, hidden port discovery, decrement sailingDaysLeft, check arrival. |
| `DISCOVER_PORT` | `{ portKey }` | Manually adds a port to `discoveredPorts`. |

### ADVANCE_DAY Pipeline (updated)

```
1. advanceWind()          -- drift wind angle/speed
2. advanceCrew()          -- increment daysAboard, morale decay if <30
3. advanceProvisions()    -- consume food/water based on crew count
4. Pay wages              -- 2g per crew per day (x1.5 if morale <30)
5. maybeSmugglePatrol()   -- if smuggle mission active, chance of intercept
6. maybeMissionEncounter()-- if escort/patrol mission, chance of encounter
7. maybeRandomEvent()     -- ~5% chance per day
8. checkRandomPatrol()    -- patrol chance based on infamy + heat + rep dampening
9. maybeDrunkardEvent()   -- chance to reveal drunkard trait if rum in hold
10. advanceHiddenPorts()  -- check hidden port unlock conditions
11. Decrement sailingDaysLeft
12. Check arrival         -- if sailingDaysLeft <= 0, set screen to 'arriving'
```

Steps 5-9 are mutually exclusive per day; if one triggers an intercept/event, the remaining checks are skipped.

### Helpers

- `advanceWind(wind)` — drifts wind angle/speed.
- `advanceCrew(crew)` — increments daysAboard, reduces morale if <30.
- `advanceProvisions(state)` — consumes food/water.
- `maybeSmugglePatrol(state)` — smuggle mission intercept.
- `maybeMissionEncounter(state)` — escort/patrol encounter.
- `maybeRandomEvent(state)` — filters events by condition, picks one.
- `checkRandomPatrol(state)` — random patrol encounter.
- `maybeDrunkardEvent(state)` — reveals drunkard trait, consumes rum.
- `advanceHiddenPorts(state)` — auto-discovers ports if conditions met.

---

## 5. engine_battle.js -- Battle Domain Reducer

**Purpose**: Combat resolution (naval and boarding phases), victory/defeat handling, plunder.

### Reducer Cases

| Action | Description |
|---|---|
| `BATTLE_ACTION` | Resolves one combat round using `L.resolveNavalRound` or `L.resolveBoardingRound`. Handles all outcomes: continue, sunk, captured, boarded, fled, victory/defeat. |
| `DISMISS_BATTLE` | Clears the encounter session after combat. Applies aftermath (upset tags, scars), handles merchant/escort rewards, inspection consequences, patrol infamy, and victory/defeat flow. |
| `TAKE_PLUNDER` | Adds goldReward and selected cargo to state. Clears encounterSession. Marks patrol/combat missions as defeated. |

### Helpers (exported for use by engine_encounter)

| Helper | Purpose |
|---|---|
| `applyVictoryAftermath` | Tags upset crew, applies battle scars. |
| `handleVictoryWithPlunder` | Creates battle state for plunder victories. |
| `handlePatrolVictory` | Marks patrol missions as defeated. |
| `handleFledMission` | Cancels mission if fled from mission fight. |

**Note**: `applyCrewLossToState` and `washAshore` are **no longer** exported from `engine_battle.js`. `applyCrewLoss` lives in `logic_combat_encounter.js` (`L.applyCrewLoss`), and `washAshore` is owned by `engine_encounter.js`. `engine_battle.js` calls `window.E.washAshore` (defined in `engine_encounter.js`) when needed — this is a one‑way, acyclic dependency.

---

## 6. engine_encounter.js -- Encounter Domain Reducer

**Purpose**: Pre-battle intercept logic, random event resolution, merchant encounters, patrol inspection, and generalized defeat handler (`washAshore`).

### Reducer Cases

| Action | Description |
|---|---|
| `INTERCEPT_FIGHT` | Creates `battle` sub-object from `createBattleState`, transitions to `phase: "battle"`, adds heat for navy patrol. |
| `INTERCEPT_FLEE` | Speed check: success → resume sailing; failure → battle. Adds heat if navy patrol. |
| `INTERCEPT_PARLEY` | Reputation check: success → pass through (+3 rep); failure → battle. |
| `INTERCEPT_BRIBE` | Deducts bribe cost, reduces rep, returns to sailing. |
| `INTERCEPT_SURRENDER` | Applies consequences from `SURRENDER_CONSEQUENCE`; navy patrol uses `applyNavyPatrolSurrender`. |
| `PATROL_INSPECT` | Checks contraband via `L.getPatrolContrabandInfo`. If found, transitions to `inspection_pending` phase. |
| `RESOLVE_INSPECTION` | Player chooses `handOver` (seize + fine) or `resist` (boarding battle). |
| `RESOLVE_EVENT` | Applies event outcome fields; handles storm detour, mutiny, scars, etc. |
| `ATTACK_PIRATE` | Builds merchant-defense encounter session. |
| `ATTACK_MERCHANT` | Builds merchant-plunder encounter session. |
| `RESOLVE_DRIFTING_WRECK_SEARCH` | Resolves wreck search outcomes (cargo, survivor, empty, ambush). |

### Helpers (owned by this file)

| Helper | Purpose |
|---|---|
| `createBattleState` | Single constructor for battle sub-object (naval or boarding). |
| `washAshore` | Generalized defeat handler: clears cargo, returns to port, checks unrecoverable. |
| `applyNavyPatrolSurrender` | Applies navy patrol surrender consequences (fine, cargo loss, etc.). |
| `handleMutinyOutcome` | Resolves mutiny negotiation/crush. |
| `applyStormScar` | Applies storm scars to crew. |

**Exports**: `window.E.washAshore`, `window.E.applyNavyPatrolSurrender`.

---

## 7. engine_onboarding.js -- Onboarding Middleware Reducer

**Purpose**: Tracks onboarding progress and injects tutorial-specific state changes. Runs **after** domain reducers.

### Core Design
- **Middleware Pattern**: Watches all actions and updates `state.onboarding` as a side effect.
- **Declarative Rules**: Uses a `STEP_RULES` lookup table to map actions to onboarding steps.
- **QM Integration**: Manages Quartermaster character lifecycle.

### Reducer Structure

```js
window.E._reducers.push((state, action) => {
  if (!state.onboarding?.enabled || state.onboarding?.completed) return state;
  const rule = STEP_RULES[action.type];
  if (!rule) return state;
  const prevState = action.__prevState || state;
  const marks = rule(prevState, state, action);
  const nextOb = applyMarks(ob, marks);
  if (!nextOb) return state;
  return { ...state, onboarding: nextOb };
});
```

### Lifecycle Actions

| Action | Description |
|---|---|
| `ONBOARDING_QM_SEEN` | Marks a QM message as seen. |
| `ONBOARDING_SKIP` | Skips onboarding, removes QM, marks all steps complete. |
| `ONBOARDING_COMPLETE` | Completes onboarding, removes QM, logs farewell. |

---

## 8. engine_career.js -- Career Stats Middleware Reducer

**Purpose**: Tracks lifetime stats and detailed logs as side effects of gameplay. Runs **after** domain reducers.

### Core Design
- **Middleware Pattern**: Watches all actions and updates `state.career`.
- **Delta-Based Tracking**: Uses `action.__prevState` to detect changes (e.g., gold earned = `currentGold - prevGold`).
- **Excluded Actions**: `START_GAME`, `LOAD_GAME`, `IMPORT_SAVE` are skipped for gold tracking (wholesale replacements).

### Career Shape

```js
career: {
  goldEarned, goldSpent,
  battles: { won, lost, fled },
  shipsSunk, shipsPlundered,
  crewHired, crewDismissed,
  crewLost: { inBattle, inStorm, deserted, other },
  longestCrewTenure,
  portsVisited: [],
  shipsOwned: [],
  stormsSurvived,
  contrabandSeized,
  missionLog: [],
  combatLog: []
}
```

---

## 9. engine_scripted.js -- Dev-Only Scripted Playthrough Reducer

**Purpose**: Enables pre-defined playthroughs for testing/demonstration. **Inert unless `?scripted=1` is in the URL.**

### Core Design
- Overrides `START_GAME` to produce a fixed, hand-authored game state.
- Overrides `ADVANCE_DAY` to fire scripted events at specific days.

---

## 10. Encounter Session Architecture

All encounter-related state is consolidated into a single `encounterSession` field.

### encounterSession Shape (updated)

```js
encounterSession: {
  type: string,           // "navy_patrol" | "mission_combat" | "random" | etc.
  phase: "intercept" | "inspection_pending" | "battle" | "plunder" | null,
  notableNPCId: string | null,
  enemy: { name, faction, hull, maxHull, cannons, crew, speed, risk },
  source: { kind: "mission" | "world" | "random" | "event" | "port", id: string | null },
  intercept: {
    flavourText: string,
    flavourLines: string[],   // generated at session creation (from G.generateCombatFlavour)
    options: [...]
  },
  battle: { ... } | null,     // created on INTERCEPT_FIGHT etc.
  plunder: null,
  returnScreen: "sailing" | "port",
  aiDisposition: {...}
}
```

### Phase Transitions

```
null → "intercept" (encounter opens)
"intercept" → "inspection_pending" (contraband found)
"intercept" → "battle" (fight, flee failure, parley failure, resist inspection)
"battle" → "plunder" (victory with canPlunder, player chooses plunder)
"battle" → null (victory without plunder, defeat, fled, merchant surrendered)
"plunder" → null (TAKE_PLUNDER)
```

---

## 11. File Statistics

| File | Reducer Cases | Helpers | Purpose |
|---|---|---|---|
| `engine_core.js` | ~20 (debug + save/load) | 5 | Shared infrastructure |
| `engine_port.js` | ~20 | 3 | Port logic |
| `engine_voyage.js` | 2 | 8 | Sailing logic |
| `engine_battle.js` | 3 | 4 | Battle resolution |
| `engine_encounter.js` | 11 | 5 | Encounter setup & events |
| `engine_onboarding.js` | 0 (middleware) | 2 | Onboarding middleware |
| `engine_career.js` | 0 (middleware) | 1 | Career stats middleware |
| `engine_scripted.js` | 2 | 0 | Dev-only scripted playthrough |

---

## 12. Dependencies

All engine files depend on:

| Dependency | Used for |
|---|---|
| `window.D` | PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES, RANDOM_EVENTS, STARTS, ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE, AI_ARCHETYPES, AI_ORIGIN_MODIFIERS, DISTANCE_DAMAGE_MULTIPLIERS, LEGAL_ACTIONS_BY_DISTANCE |
| `window.L` | All pure game math (combat, reputation, travel, fame, equipment, crew tags, encounter context, hold capacity, game-over detection, applyCrewLoss, getPatrolContrabandInfo) |
| `window.G` | Generators (missions, markets, crew, enemies, cargo, gossip, bios, combat flavour) — called **only** from engine reducers |
| `window.E.A` | Action constants (from `engine_core.js` -- must load first) |

---

## 13. Domain Responsibility Summary

### engine_core.js (Shared)
- Action constants
- Initial state
- Reducer dispatcher
- Debug actions
- Save/load actions
- `buildEncounterSession`

### engine_port.js (Port)
- Game start & navigation
- Port entry processing
- Market, missions, crew, shipyard, equipment, repair
- `PREVIEW_PORT` for trade tips

### engine_voyage.js (Voyage)
- Day-by-day sailing simulation
- Wind drift, provisions, wages
- Event triggering (random, patrols, drunkard, mission encounters)
- Hidden port discovery

### engine_battle.js (Battle)
- Naval & boarding combat resolution
- Victory/defeat/fled transitions
- Plunder collection
- Convoy/merchant aftermath

### engine_encounter.js (Encounter)
- Intercept actions (fight, flee, parley, bribe, surrender, inspect)
- Inspection two-step flow
- Event resolution
- Merchant/escort encounters
- `washAshore` (defeat handler)

### engine_onboarding.js (Middleware)
- Onboarding step tracking
- Quartermaster lifecycle

### engine_career.js (Middleware)
- Lifetime stats tracking
- Delta-based detection

### engine_scripted.js (Dev-only)
- Scripted gameplay sequences for testing/demos

---

## 14. Notes on Recent Refactors

- `engine_combat.js` was split into `engine_battle.js` and `engine_encounter.js`.
- `createBattleState` was removed from `engine_core.js`; the single constructor now lives in `engine_encounter.js`.
- `applyCrewLossToState` moved to logic as `L.applyCrewLoss`.
- `washAshore` moved to `engine_encounter.js`.
- Encounter `source` is now explicit and provided by callers.
- `modifiers` array removed from encounter session.
- `aiDisposition` is calculated once at session creation.
- `getActionPreview` added to logic for shared combat math.
- `PREVIEW_PORT` action added for trade tips without generator calls in UI.
- Persistence is fully owned by `storage.js` (via `L.saveToLocalStorage`, `L.loadFromLocalStorage`).