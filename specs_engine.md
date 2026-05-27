# **Broadside: specs_engine.md**
*Game state management, reducer, and action handlers. Exposed as `window.E`.*

---

## **📌 Overview**
- **File**: `engine.js`
- **Exposed as**: `window.E`
- **Dependencies**:
  - `window.D` (data constants: `PORTS`, `SHIPS`, `FACTIONS`, `UPGRADES`, `STARTS`, `SURRENDER_CONSEQUENCE`, `RESOURCES`, `PATROL_FINE_RATE`).
  - `window.L` (pure logic helpers from `logic.js`).
  - `window.G` (generators from `generators.js`).
- **Purpose**:
  - Manages the **game state** via a **reducer pattern**.
  - Handles **actions** (navigation, combat, missions, trading, events, port discovery).
  - Includes **auto-save**, **state migration**, and **initial state** setup.
  - Private helpers extracted from large reducer cases for readability and testability.

---

## **🔧 Constants & Helpers**

---

### **1. `A` (Action Types)**

```js
const A = {
  NAVIGATE, SAIL_TO, ADVANCE_DAY, ENTER_PORT, START_GAME,
  SAVE_GAME, LOAD_GAME, REPAIR, BUY_SHIP, BUY_UPGRADE,
  HIRE_CREW, RAISE_MORALE, REFRESH_MISSIONS, TAKE_MISSION,
  COMPLETE_MISSION, ABANDON_MISSION,
  INTERCEPT_FIGHT, INTERCEPT_FLEE, INTERCEPT_PARLEY,
  INTERCEPT_BRIBE, INTERCEPT_SURRENDER,
  BATTLE_ACTION, DISMISS_BATTLE, RESOLVE_EVENT,
  SET_WIND, CONFIRM_TRADE, ENTER_MARKET, LEAVE_MARKET,
  DISCOVER_PORT,
  PATROL_INSPECT,
  // Debug (UI-gated via ?debug=1)
  DEBUG_ADD_GOLD, DEBUG_SET_FAME, DEBUG_SET_INFAMY,
  DEBUG_SET_SHIP, DEBUG_SET_PORT_REP, DEBUG_FILL_HOLD, DEBUG_REPAIR,
};
```

---

### **2. `autoSave(state)`**
- **Purpose**: Saves current state to `localStorage`.
- **Notes**: Wrapped in `try/catch`. Uses key `"piratesSave"`.

---

### **3. `migrateState(loaded)`**
- **Purpose**: Brings older saved states up to the current schema version.
- **Input**: `loaded` (object) — parsed save.
- **Output**: migrated state object.
- **Migrations**:
  - **v1 baseline**: Ensures `version` field exists (sets to `1` if absent).
  - **v1 → v2**: Adds `discoveredPorts` (all non-hidden ports) and `mapFragments: []` if absent.
- **Pattern**: Additive and non-destructive. New migrations are appended as version-gated blocks.

---

### **4. Private helpers (not exported)**

These functions are defined inside the `window.E` IIFE and used only by the reducer. They are extracted to improve readability and testability of `ADVANCE_DAY`.

#### `createBattleState(state, enemy, initialLog, encounterType)` → battleState object
Builds the initial `battleState` object used by `INTERCEPT_FIGHT`, `INTERCEPT_FLEE` (on failure), `INTERCEPT_PARLEY` (on failure), and `RESOLVE_EVENT` (battle outcome).
```js
{
  phase: "player_turn",
  playerHull: state.ship.hull,
  playerCrew: state.crew.roster.length,
  enemy,
  enemyHull: enemy.hull,
  enemyCrew: enemy.crew,
  round: 1,
  log: [initialLog],
  returnScreen: L.returnScreen(state),
  initialCrewCount: state.crew.roster.length,
  lostCrewNames: [],
  encounterType,    // string — used by DISMISS_BATTLE to detect patrol fights
}
```

#### `checkServicesBlocked(state)` → `object | null`
Returns a partial state with a "You are at war" log entry if `getRepPerk` returns `servicesBlocked: true` for the current port. Returns `null` if services are available. Used as an early-return guard in `REPAIR`, `BUY_SHIP`, `BUY_UPGRADE`, `HIRE_CREW`, `RAISE_MORALE`.

#### `advanceWind(wind)` → `{ angle, speed }`
Randomly adjusts wind: angle ±15°, speed ±2.5 (clamped 1–20).

#### `advanceCrew(crew)` → crew object
Increments `daysAboard` for all roster members. Decrements morale by 1 if `morale < 30`.

#### `advanceProvisions(state)` → `{ items, foodJustRanOut, waterJustRanOut, foodEmpty, waterEmpty }`
Computes post-consumption hold items. Returns flags for first-run-out detection (used for log warnings).

#### `maybeSmugglePatrol(state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems)` → state | null
Checks if a smuggle mission intercept should fire. Returns a full state object routed to `screen: "intercept"` if triggered, or `null` if not. Fires only once per mission (`encounterOccurred` flag).

#### `maybeRandomEvent(state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems)` → state | null
10% daily chance of a random event. Returns a full state object routed to `screen: "event"` or `null`.

#### `maybeRandomPatrol(state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems)` → state | null
Checks `L.maybeRandomPatrol(state)`. Returns a full state routed to `screen: "intercept"` with a navy patrol encounter context, or `null`.

#### `advanceHiddenPorts(state)` → `{ discoveredPorts, log }`
Checks all hidden ports for auto-unlock conditions (fame, infamy, faction reputation). Returns updated `discoveredPorts` array and any discovery log entries. Item-based unlocks are skipped here (handled in `RESOLVE_EVENT`).

#### `validateTrade(state, buys, sells)` → `{ valid: boolean, reason?: string }`
Performs holistic validation of a trade: checks gold sufficiency and hold capacity across the combined buy/sell batch. Returns `{ valid: false, reason }` if invalid, `{ valid: true }` if OK.

---

## **🌍 Initial State**

```js
const initialState = {
  version: 1,
  screen: "start",
  day: 1,
  log: [],
  gold: 1000,
  fame: 0,
  infamy: 0,
  currentPort: "portRoyal",
  previousPort: null,
  destination: null,
  discoveredPorts: Object.keys(PORTS).filter(k => !PORTS[k].hidden),
  mapFragments: [],
  sailingDaysLeft: 0,
  sailingDaysTotal: 0,
  wind: { angle: 45, speed: 10 },
  ship: { type: "sloop", name: "Sea Dog", hull: 100, cannons: 10, upgrades: [] },
  crew: { roster: [], max: 50, morale: 80 },
  hold: {
    capacity: 200,
    items: {
      food: 10, water: 10,
      rum: 0, sugar: 0, timber: 0, cloth: 0, spices: 0, silk: 0,
      coffee: 0, cocoa: 0, weapons: 0, tobacco: 0, silver: 0, slaves: 0,
    },
  },
  portMarket: null,
  missions: [],
  activeMission: null,
  reputation: {},      // all ports initialised to 50 after object creation
  battleState: null,
  activeEvent: null,
  encounterContext: null,
};
```

**Notes**:
- `discoveredPorts`: All non-hidden ports at game start.
- `mapFragments`: Collected chart fragments used to unlock hidden ports.
- `battleState`, `activeEvent`, `encounterContext`: Transient — not persisted across saves (reset on `LOAD_GAME`).

---

## **📜 Action Cases**

---

### **1. `START_GAME`**
**Action**: `{ type: A.START_GAME, scenarioId: string }`

Reads the matching entry from `STARTS` (structured format, not the old `bonuses[]` strings). Builds a fresh game state:

1. Base fields from `initialState` + scenario overrides (`gold`, `startPort`, `openingLog`).
2. Ship and hold from `SHIPS[start.ship]` — sets `type`, `name`, `hull`, `cannons`, `upgrades: []`, `holdCapacity`.
3. Crew: `G.generateRoster(start.crewCount, start.crewFaction || start.faction)`.
4. Reputation: all ports to 50, then applies `start.repAdjust` faction deltas.
5. Port market via `G.generatePortMarket(start.startPort)`.
6. Missions via `G.generateMissions(start.startPort, newState)`.
7. If `start.starterMission` exists: auto-accepts it into `activeMission` (with `encounterOccurred: false`); generated missions go to `missions[]`.
8. If `start.debugStartFame` is defined, sets `fame` to that value.

**⚠ Stale after T1.1b**: `getStartingShip`, `getStartingGold`, `getStartingReputation` (the old `bonuses[]` parsers) are no longer used. They can be removed from `logic.js`.

---

### **2. `NAVIGATE`**
**Action**: `{ type: A.NAVIGATE, screen: string }`

Sets `state.screen` directly. No other changes.

---

### **3. `SAIL_TO`**
**Action**: `{ type: A.SAIL_TO, port: string }`

Calculates travel days via `L.travelDays(state.currentPort, action.port, state)`. Updates `previousPort`, `destination`, `sailingDaysLeft`, `sailingDaysTotal`, `screen: "sailing"`. Adds log entry.

---

### **4. `ADVANCE_DAY`**
**Action**: `{ type: A.ADVANCE_DAY }`

Early exit if `sailingDaysLeft <= 0`.

Computes shared daily values using private helpers:
```
newDays    = sailingDaysLeft - 1
newWind    = advanceWind(state.wind)
wages      = L.payCrewWages(state)
newGold    = Math.max(0, gold - wages)
newRep     = decayReputation every 2 days (state.day % 2 === 0)
newCrew    = advanceCrew(state.crew)
prov       = advanceProvisions(state)
newMorale  = newCrew.morale - 1 if (food empty OR water empty OR wages crisis)
```

Appends provision-exhaustion log entries if `foodJustRanOut` or `waterJustRanOut`.

Then runs four conditional branches in priority order (first match wins, returns immediately):

1. **`maybeSmugglePatrol`** — checks smuggle mission intercept → `screen: "intercept"`
2. **`maybeRandomEvent`** — 10% daily random event → `screen: "event"`
3. **`maybeRandomPatrol`** — `L.maybeRandomPatrol(state)` check → `screen: "intercept"`
4. **`advanceHiddenPorts`** — checks auto-unlock conditions for hidden ports

If none trigger, returns normal sailing state with updated wind, day, gold, rep, crew, hold, discoveredPorts, and log.

**⚠ Known issue**: `daysLost` in RESOLVE_EVENT **adds** to `sailingDaysLeft` instead of subtracting. This is a pre-existing bug — storms make voyages shorter rather than longer. Fix: change `+= lost` to `-= lost` (minimum 0).

---

### **5. `DISCOVER_PORT`**
**Action**: `{ type: A.DISCOVER_PORT, portKey: string }`

Adds `portKey` to `discoveredPorts` if not already present. Logs discovery message. Idempotent — no-op if already discovered.

---

### **6. `ENTER_PORT`**
**Action**: `{ type: A.ENTER_PORT }`

Reads `state.destination`. Checks in priority order:

1. **Assault mission at destination**: builds `hostile_port_entry` encounter with mission enemy (or default garrison 200hp/20 cannons/50 crew). Routes to `screen: "intercept"`.
2. **Hostile port** (`reputation[destination] < 10`): builds `hostile_port_entry` encounter with port guards (150hp/15 cannons/40 crew). Routes to `screen: "intercept"`.
3. **Normal entry**: sets `currentPort`, clears `destination` and `sailingDaysLeft`, regenerates `missions` and `portMarket`, routes to `screen: "port"`. Calls `autoSave`.

---

### **7. `REPAIR`**
**Action**: `{ type: A.REPAIR }`

Guards: `checkServicesBlocked` (At War early return). Calculates cost as `(maxHull - hull) * 2 * repPerk.repairMult`. Checks affordability. Deducts gold, restores hull to max. Log includes discount note if `repairMult < 1`.

---

### **8. `BUY_SHIP`**
**Action**: `{ type: A.BUY_SHIP, shipType: string }`

Guards: `checkServicesBlocked`, `L.meetsRequirement` (fame gate), gold check. Truncates crew roster if new ship's `maxCrew` is smaller. Updates `ship`, `crew.max`, `hold.capacity`. Clears upgrades. Logs purchase.

---

### **9. `BUY_UPGRADE`**
**Action**: `{ type: A.BUY_UPGRADE, upgradeKey: string }`

Guards: `checkServicesBlocked`, `L.meetsRequirement` (fame gate), gold check, duplicate check, ship compatibility check (`SHIPS[type].upgradeable.includes(upgradeKey)`). Appends `upgradeKey` to `ship.upgrades`. Logs installation.

---

### **10. `HIRE_CREW`**
**Action**: `{ type: A.HIRE_CREW, count: number }`

Guards: `checkServicesBlocked`, max crew check, gold check (`count × 50g`). Generates new roster via `G.generateRoster(count, portFaction)`. Appends to existing roster.

---

### **11. `RAISE_MORALE`**
**Action**: `{ type: A.RAISE_MORALE }`

Guards: `checkServicesBlocked`, gold check (`roster.length × 5g`), morale already at 100. Increases morale by 5 (capped at 100). Deducts cost.

---

### **12. `REFRESH_MISSIONS`**
**Action**: `{ type: A.REFRESH_MISSIONS }`

Regenerates `missions` via `G.generateMissions(currentPort, state)`. No other changes.

---

### **13. `TAKE_MISSION`**
**Action**: `{ type: A.TAKE_MISSION, mission: object }`

Dispatches the full mission object (no ID lookup). Two paths:
- **Combat missions** (`type === "combat"` with `enemy`): sets `activeMission`, builds encounter context via `L.buildEncounterContext(state, "mission_combat", mission.enemy)`, routes to `screen: "intercept"`.
- **All other types** (trade, escort, smuggle, assault): sets `activeMission: { ...mission, encounterOccurred: false }`, stays on current screen.

**Note**: Fame gating is handled at generation time in `G.generateMissions`. No fame check in this reducer case.

---

### **14. `COMPLETE_MISSION`**
**Action**: `{ type: A.COMPLETE_MISSION }`

1. Validates `activeMission` exists and `currentPort === targetPort`.
2. **Cargo check** (trade/smuggle): `hold.items[requiredGood] >= requiredQty` required. Fails with log if insufficient.
3. **Cargo removal**: deducts `requiredQty` from hold on trade/smuggle completion.
4. **Gold calculation**:
   - `trade` and `smuggle`: `mission.gold` directly (no rep multiplier).
   - All other types: `mission.gold × repPerk.missionMult` with bonus/penalty note in log.
5. **Infamy/fame/rep**: applies `mission.infamyGain`, `mission.fame`, `mission.repImpact`. Logs infamy threshold crossings.
6. **Plot item removal**: clears `hold.items.plot_item` if `mission.plotItem` is set.
7. Regenerates `missions`. Calls `autoSave`.

---

### **15. `ABANDON_MISSION`**
**Action**: `{ type: A.ABANDON_MISSION }`

Clears `activeMission`. Applies −10 reputation with `mission.faction` (defaults to `"pirate"`). Logs abandonment.

---

### **16. `CONFIRM_TRADE`**
**Action**: `{ type: A.CONFIRM_TRADE, buys: object, sells: object }`

1. Calls `validateTrade(state, buys, sells)` for holistic pre-validation. Returns early with error log if invalid.
2. Executes sells: deducts from hold, adds to goldDelta, logs each transaction.
3. Executes buys: checks per-good availability (stock), adds to hold, deducts from goldDelta, applies `infamyOnBuy` for illegal goods, logs each transaction.
4. Returns updated `gold`, `hold.items`, `infamy`, `log`.

**Two-pass design**: sells are processed first (freeing hold space), then buys are committed. The `validateTrade` helper runs the full batch holistically before any mutation occurs.

---

### **17. `ENTER_MARKET`**
**Action**: `{ type: A.ENTER_MARKET }`

Sets `screen: "market"`.

---

### **18. `LEAVE_MARKET`**
**Action**: `{ type: A.LEAVE_MARKET }`

Sets `screen: "port"`.

---

### **19. `INTERCEPT_FIGHT`**
**Action**: `{ type: A.INTERCEPT_FIGHT }`

Uses `createBattleState(state, ctx.enemy, log, ctx.encounterType)`. Sets `encounterContext: null`, `battleState`, `screen: "battle"`.

`encounterType` from `ctx.encounterType` is stored in `battleState.encounterType` for use by `DISMISS_BATTLE`.

---

### **20. `INTERCEPT_FLEE`**
**Action**: `{ type: A.INTERCEPT_FLEE }`

Reads speed check from `ctx.options.find(o => o.id === "flee").speedCheck`. Rolls `L.roll(6)` for each. `playerSpeed + roll >= enemySpeed + roll` → success (clears context, returns to `L.returnScreen`). Failure → `createBattleState`, `screen: "battle"`.

---

### **21. `INTERCEPT_PARLEY`**
**Action**: `{ type: A.INTERCEPT_PARLEY }`

`L.roll(100) <= Math.min(80, rep + 20)` → success (clears context, +3 rep at port, returns via `L.returnScreen`). Failure → `createBattleState`, `screen: "battle"`.

---

### **22. `INTERCEPT_BRIBE`**
**Action**: `{ type: A.INTERCEPT_BRIBE }`

Reads `cost` from `ctx.options.find(o => o.id === "bribe").cost`. Deducts gold, −2 rep at port, clears context, returns via `L.returnScreen`.

---

### **23. `INTERCEPT_SURRENDER`**
**Action**: `{ type: A.INTERCEPT_SURRENDER }`

Looks up consequence from `SURRENDER_CONSEQUENCE[ctx.type] ?? SURRENDER_CONSEQUENCE.random`. Applies:
- `goldFine`: flat gold deduction.
- `loseGoldPercent`: percentage gold loss.
- `moralePenalty`: morale reduction.
- `loseDays`: day increment.
- `rep_loss`: reputation loss at current/destination port.
- `loseCargoPercent`: `L.applyLoseCargoPercent`.
- `loseContraband`: `L.applyLoseContraband`.

Clears context, returns via `L.returnScreen`.

**Note**: The old `consequence: function` path has been removed. All consequences are now declarative objects.

---

### **24. `PATROL_INSPECT`**
**Action**: `{ type: A.PATROL_INSPECT }`

Dispatched when the player allows a navy patrol to inspect their cargo. Also reachable via `RESOLVE_EVENT` when `choice.outcome.action === "PATROL_INSPECT"`.

**Clean hold path**: clears `encounterContext`, returns via `L.returnScreen`, logs "found nothing."

**Contraband found path** (tobacco > 0, slaves > 0, or rum ≥ requiredQty on active smuggle mission):
- Computes `seizedValue` from base prices of seized goods.
- `fine = Math.round(seizedValue × D.PATROL_FINE_RATE / 25) × 25` (rounded to nearest 25g).
- Applies `L.applyLoseContraband` to hold.
- Deducts fine from gold (floor 0).
- +2 infamy.
- −5 reputation with all ports of the inspecting faction.
- −10 morale.
- Logs all consequences.

**Rum special case**: rum is only treated as contraband if `activeMission.requiredGood === "rum"` AND `hold.items.rum >= activeMission.requiredQty`. Rum is a legal good for non-smuggle purposes.

---

### **25. `BATTLE_ACTION`**
**Action**: `{ type: A.BATTLE_ACTION, action: string }`

`action` is one of `"broadside"`, `"precision"`, `"grapple"`, `"evade"`.

Calls `L.resolveCombatAction(state, action)` to get the outcome. Updates `battleState`:
- **Instant victory** (grapple success): sets `phase: "victory"`, adds gold reward, applies −5 rep to enemy faction, logs crew loss summary.
- **Enemy defeated** (`enemyHull <= 0`): sets `phase: "victory"`, adds gold reward, applies −5 rep.
- **Player defeated** (`playerHull <= 0`): sets `phase: "defeat"`, logs crew loss summary.
- **Fled** (`outcome.fled`): sets `phase: "fled"`.
- **Normal round**: increments round, updates hull/crew values, logs action.

Crew losses are tracked by name via `L.removeRandomCrew`. `battleState.lostCrewNames` accumulates names across rounds.

---

### **26. `DISMISS_BATTLE`**
**Action**: `{ type: A.DISMISS_BATTLE }`

**Patrol infamy**: checks `battleState.encounterType === "navy_patrol" || "navy_patrol_combat"`. If true, adds +2 infamy regardless of outcome (fight started = public record). Logs infamy addition.

**Defeat path** (`phase === "defeat"`):
- Returns to `previousPort` (or `currentPort` as fallback).
- Clears all cargo (all `hold.items` set to 0).
- Regenerates market and missions for the return port.
- Adds patrol infamy if applicable.

**Sailing return** (if `battleState.returnScreen === "sailing"` and still en route):
- Returns to `screen: "sailing"`.
- Adds patrol infamy.

**Victory/other**: returns to `battleState.returnScreen` (defaults to `"port"`). Adds patrol infamy. Calls `autoSave`.

**Note**: Gold reward from combat is added during `BATTLE_ACTION` (at the moment of victory), not here. `DISMISS_BATTLE` only handles cleanup and screen transition.

---

### **27. `RESOLVE_EVENT`**
**Action**: `{ type: A.RESOLVE_EVENT, choiceIndex: number }`

Gets `choice = activeEvent.choices[choiceIndex]`. Clears `activeEvent`. Applies outcome fields in order:

| Outcome field | Effect |
|---|---|
| `log` | Appended to state log |
| `gold` | Added to state.gold (floor 0) |
| `fame` | Added to state.fame |
| `hullDamage` | Subtracted from ship.hull (floor 0) |
| `crewLoss` | Removes N random crew via `L.removeRandomCrew`, logs names |
| `loseCargoPercent` | `L.applyLoseCargoPercent`, logs |
| `daysLost` | **⚠ Bug**: currently adds to `sailingDaysLeft` (should subtract). Also increments `day`, `sailingDaysTotal`, deducts wages × days, decays rep per lost day |
| `repImpact` | `L.applyReputationImpact` |
| `moraleBonus` | Adjusts `crew.morale` (clamped 0–100) |
| `battle` | Builds encounter context with faction-corrected enemy name, routes to `screen: "intercept"` |
| `mapFragment` | Adds to `mapFragments[]`, checks if it unlocks a hidden port via `unlockCondition.conditions` item match |
| `action` | Dispatches a secondary reducer call: `reducer({ ...newState, activeEvent: null }, { type: choice.outcome.action })`. Used for navy_patrol "Allow Inspection" → `PATROL_INSPECT` |

If no `battle` outcome, routes to `L.returnScreen(state)`.

**`outcome.action` pattern**: when `choice.outcome.action` is set, RESOLVE_EVENT applies any log from the outcome, then recursively calls the reducer with the specified action type. This is used by the `navy_patrol` event's "Allow Inspection" choice to dispatch `PATROL_INSPECT`. No infinite recursion risk — `PATROL_INSPECT` never sets `outcome.action`.

---

### **28. `SAVE_GAME`**
**Action**: `{ type: A.SAVE_GAME }`

Saves full state to `localStorage["piratesSave"]`. Adds "Game saved." log entry.

---

### **29. `LOAD_GAME`**
**Action**: `{ type: A.LOAD_GAME }`

Reads and parses `localStorage["piratesSave"]`. Runs `migrateState(parsed)`. Returns loaded state with: `screen: "port"`, `battleState: null`, `activeEvent: null`, `encounterContext: null`, fresh `portMarket` and `missions` for `currentPort`. Falls back to error log if no save or parse failure.

---

### **30. `SET_WIND`**
**Action**: `{ type: A.SET_WIND, angle: number, speed: number }`

Directly sets `state.wind`. Used in tests and debug tooling.

---

## **🐛 Debug Actions**
Only available when `?debug=1` in URL (UI-gated in `App.jsx`).

| Action | Effect |
|---|---|
| `DEBUG_ADD_GOLD { amount }` | Adds `amount` to `state.gold` |
| `DEBUG_SET_FAME { fame }` | Sets `state.fame` to `fame` |
| `DEBUG_SET_INFAMY { infamy }` | Sets `state.infamy` to `infamy` |
| `DEBUG_SET_SHIP { shipType }` | Replaces ship with full-hull version of `shipType`; updates `hold.capacity` and `crew.max` |
| `DEBUG_SET_PORT_REP { port, amount }` | Sets `reputation[port]` to `amount` |
| `DEBUG_FILL_HOLD` | Fills hold with a fixed mixed cargo set |
| `DEBUG_REPAIR` | Restores hull to max; refills food and water scaled to current crew |

Debug actions are **not gated in the reducer**. The UI is the only gate.

---

## **📦 Exports**

```js
window.E = {
  A,            // Action type constants
  initialState, // Default state
  reducer,      // State reducer
  migrateState, // State migration helper (also exported for testing)
};
```

`autoSave` is **not exported** — it is an internal side effect called at specific points within the reducer.

---

## **🔗 Dependencies**
- **`window.D`**: `PORTS`, `SHIPS`, `FACTIONS`, `UPGRADES`, `STARTS`, `SURRENDER_CONSEQUENCE`, `RESOURCES`, `PATROL_FINE_RATE`.
- **`window.L`**: `travelDays`, `canReach`, `returnScreen`, `buildEncounterContext`, `getRepPerk`, `getShipStats`, `meetsRequirement`, `payCrewWages`, `decayReputation`, `applyReputationImpact`, `applyLoseCargoPercent`, `applyLoseContraband`, `removeRandomCrew`, `triggerRandomEvent`, `maybeRandomPatrol`, `resolveCombatAction`, `getNPCAction`, `getInfamyLabel`, `getProvisionConsumptionPerDay`, `roll`.
- **`window.G`**: `generateMissions`, `generatePortMarket`, `generateRoster`, `generateEnemy`.

---

## **📝 Notes**

1. **`ADVANCE_DAY` helper extraction**: The case is now structured as a pipeline of private helper calls. Each helper (`advanceWind`, `advanceCrew`, etc.) is independently testable. This replaced the former monolithic single-function body.

2. **Encounter options are now an array**: `buildEncounterContext` returns `options: Option[]` not `options: { flee, parley, bribe, surrender, fight }`. Intercept actions read options by id: `ctx.options.find(o => o.id === "flee")`. Adding new option types requires no screen changes.

3. **`encounterType` replaces `isNavyPatrol`**: `battleState.encounterType: string` is the canonical field for identifying encounter origin in `DISMISS_BATTLE`. Future encounter types (bounty hunters, distressed merchants) add one check each.

4. **`PATROL_INSPECT` is the correct path for navy inspection**: The old `if (event.id === "navy_patrol")` special-case block in `RESOLVE_EVENT` has been removed. The `navy_patrol` event now has a choice with `outcome.action: "PATROL_INSPECT"` which dispatches cleanly through the normal event resolution path.

5. **Trade and smuggle missions bypass rep multiplier**: `COMPLETE_MISSION` applies `repPerk.missionMult` to all mission types **except** `trade` and `smuggle`, which pay their fixed `mission.gold` directly.

6. **`daysLost` sign bug**: `RESOLVE_EVENT` currently adds `daysLost` to `sailingDaysLeft` instead of subtracting. Storms make voyages shorter. Fix: `sailingDaysLeft = Math.max(0, current - lost)`.

7. **State immutability**: The reducer treats state as immutable via spread. One exception: `BATTLE_ACTION` directly mutates `state.battleState.lostCrewNames` (`state.battleState.lostCrewNames = lostCrewNames`). This should be replaced with a proper spread.

8. **Auto-save points**: Called in `ENTER_PORT` (normal entry), `COMPLETE_MISSION`, and `DISMISS_BATTLE` (victory path). Not called in `ABANDON_MISSION` — this is an omission worth fixing.