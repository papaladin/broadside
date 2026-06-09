# Navigation Mid-Voyage Rerouting — Tasks & Design Notes

> **Feature goal:** While sailing, the player may open the map, see their **current at-sea position** (recomputed once per day), and **change destination mid-voyage** if at least one alternate port is reachable from that sea position under current conditions.

---

## 1. Agreed Design Decisions

These are the design constraints for the implementation. They should drive both code and tests.

### Core Navigation Model

- Time remains **day-based**. Ship position/progress is recalculated **once per day**, not mid-day.
- Mid-voyage rerouting is allowed only **between day advances**, from the Sailing screen via a new **Change Course** action.
- The ship gets a real **at-sea position** (`seaPosition`) derived from route origin, route destination, and daily progress.
- The player is **not allowed to stop with no destination**. “Change course” means “open map and select a new destination,” not “drift at sea.”

### Route Commitment Rule

- Once a voyage has started, the **current route remains valid** even if conditions later worsen (wind changes, cargo changes, event side effects, etc.).
- This avoids soft-locks caused by recalculating the currently active route under changed conditions.
- However, **new reroutes** must obey current conditions and remaining endurance constraints.

### Reroute Eligibility Rule

- The player may only reroute if there is at least **one alternate reachable port** from current `seaPosition` under current state/conditions.
- If no alternate port is reachable, the **Change Course** button is disabled (or opens a message explaining why rerouting is impossible).
- Reselecting the **same destination** is treated like cancel/back: the previous route remains active and unchanged.

### Port Availability / Discovery Rules

- Rerouting must always use the **current** discovered port list.
- Hidden ports discovered mid-voyage are immediately eligible for rerouting checks if they otherwise pass reachability rules.
- Standard min-hull / access restrictions still apply during reroute calculations.

### Mission / Encounter Rules

- Rerouting has **no special mission penalty** in V1.
- Hostile-port interception, mission arrival logic, and port-entry logic continue to trigger only when the player finally enters the chosen destination port.
- No special changes are needed for escort/trade/smuggle/combat mission state in V1.

### UX Rules

- Sailing screen gets a **Change Course** button.
- If no alternate is reachable, the button is disabled and accompanied by explanatory text such as:

> *No alternate port is reachable from your current position under present conditions.*

- If the player opens the map and then backs out without choosing a new port, the voyage continues toward the **existing destination**.

---

## 2. Design Intent

This feature is meant to shift navigation from a pure **port-to-port countdown** into a more spatial system without turning the game into real-time movement.

### Why this feature is worth adding

- It adds **agency** during voyages: the player can react to new information or state changes.
- It makes the map feel more like a **real navigable space** and less like a fixed node menu.
- It creates meaningful logistical tension: cargo, wind, remaining endurance, and route commitment all matter more.
- It opens future doors for richer systems (treasure fleet interception, patrol avoidance, storm evasion, hunt mechanics, dynamic sea positioning).

### Why the constraints matter

- **Day-based only** keeps the feature aligned with the rest of the game loop.
- **No drift mode** avoids introducing a whole new “stationary at sea” state machine.
- **Current route immunity** prevents frustrating dead-end states after mid-voyage stat changes.
- **Alternate-port requirement** prevents players from being allowed into impossible reroutes.

---

## 3. Proposed State Model Changes

### New / Updated State Fields

Add the following route-navigation state fields:

```js
state.route = {
  originPort: "portRoyal",       // port where the current voyage began
  destinationPort: "tortuga",    // current active destination
  originPos: { x: 120, y: 80 },   // fixed start position of this current route leg
  destinationPos: { x: 240, y: 140 },
  progressDays: 2,                // elapsed voyage days on this route leg
  totalDays: 6,                   // recalculated route duration for this leg
  seaPosition: { x: 160, y: 100 },// interpolated current position, updated daily
  enduranceBudget: 8,             // max voyage endurance when the voyage began
  enduranceSpent: 2               // how many days have already been consumed in this voyage
};
```

### Notes

- `currentPort` should continue to mean **last docked port**, not current physical position while sailing.
- `destination` may remain for compatibility, but should mirror `route.destinationPort`.
- `sailingDaysLeft` / `sailingDaysTotal` can remain for backward compatibility, but should be derived from or synchronized with `route`.

### Minimal Alternative (if you want smaller change footprint)

If you want to minimize refactor breadth, you can avoid a nested `route` object and instead add flat fields:

```js
routeOrigin
routeOriginPos
routeDestination
routeDestinationPos
routeProgressDays
seaPosition
voyageEnduranceBudget
voyageEnduranceSpent
```

This is less elegant but may be easier to integrate into the current reducer structure.

---

## 4. Core Rules to Encode

### 4.1 Sea Position

Sea position is recalculated after each `ADVANCE_DAY` using linear interpolation:

```js
progress = progressDays / totalDays
x = originPos.x + (destinationPos.x - originPos.x) * progress
y = originPos.y + (destinationPos.y - originPos.y) * progress
```

### 4.2 Remaining Endurance for Reroutes

When evaluating a new possible destination from sea:

```js
remainingEndurance = enduranceBudget - enduranceSpent
```

A new destination is only reachable if:

```js
travelDaysFromPosition(seaPosition, targetPort, state) <= remainingEndurance
```

### 4.3 Current Route Immunity

The current route is not invalidated by later state changes. This rule is explicit. Example:

- Start a 6-day route when it is valid.
- Day 3: cargo increases, wind worsens, recalculated travel would now be 8 days.
- The route **still remains valid** because it was already committed.
- But rerouting to a new port must use the stricter current-state calculation.

### 4.4 Same Destination = Cancel

If the player reselects the current destination or backs out of the map:

- keep the current route untouched
- do not reset progress
- do not consume time
- return to Sailing screen

---

## 5. Required New Helpers

These are the key helper functions to introduce.

### logic.js

#### `getSeaPosition(route)`

- Input: `route.originPos`, `route.destinationPos`, `route.progressDays`, `route.totalDays`
- Output: `{ x, y }`
- Purpose: calculate the ship marker position while at sea.

#### `travelDaysFromPosition(originPos, portKey, state)`

- Input: an arbitrary `{x,y}` sea position instead of a port key
- Output: integer day cost to reach the target port from sea
- Purpose: make mid-voyage rerouting possible.

#### `canReachFromPosition(originPos, portKey, state, remainingEndurance)`

- Checks discovered status, min-hull/access rules, and day cost from sea.

#### `getReachablePortsFromSea(state)`

- Returns a list of alternate ports reachable from current `seaPosition` with current conditions and remaining endurance.
- Excludes the current active destination if desired for UI purposes.

#### `getRerouteBlockReason(state)`

- Optional helper.
- Returns user-facing reason if Change Course should be disabled.
- Example: “No alternate port is reachable under current conditions.”

---

## 6. Reducer / Engine Tasks

### T-NAV.1 — Extend Navigation State Infrastructure

**Files:** `engine_core.js`, `logic.js`

**Tasks:**

- Add new route-related fields to `initialState`.
- Update `migrateState()` to add missing route fields for old saves.
- Ensure legacy saves still load cleanly if they only have `destination`, `sailingDaysLeft`, etc.

**Definition of Done:**

- Old saves load without crash.
- New saves include route/seaPosition/endurance fields.

---

### T-NAV.2 — Refactor `SAIL_TO` to Support Port-Origin and Sea-Origin

**Files:** `engine_voyage.js`, `logic.js`

**Tasks:**

- Update `SAIL_TO` so that origin is:
  - the current port position when sailing begins from port, or
  - the current `seaPosition` when rerouting mid-voyage.
- When starting a **new voyage from port**, initialize:
  - `originPort`
  - `originPos`
  - `destinationPort`
  - `destinationPos`
  - `totalDays`
  - `progressDays = 0`
  - `seaPosition = originPos`
  - `enduranceBudget = ship.maxDays` (or equivalent)
  - `enduranceSpent = 0`
- When **rerouting from sea**, preserve `enduranceSpent` and only overwrite route-leg fields.

**Definition of Done:**

- Normal port departure still works.
- Rerouting from sea starts a fresh route leg from `seaPosition` while preserving overall endurance spent.

---

### T-NAV.3 — Update `ADVANCE_DAY` to Recalculate Progress and Position

**Files:** `engine_voyage.js`, `logic.js`

**Tasks:**

- On each sailing day:
  - increment `route.progressDays`
  - increment `enduranceSpent`
  - decrement `sailingDaysLeft`
  - recompute `seaPosition` via interpolation
- Keep the current route logic immune to recalculation invalidation.
- Arrival remains triggered when current route leg finishes (`sailingDaysLeft === 0`).

**Definition of Done:**

- Ship position visibly progresses on the route by day.
- Existing arrival flow still works.

---

### T-NAV.4 — Add “Open Map From Sea” Flow

**Files:** `engine_core.js`, `screens_voyage.jsx`

**Tasks:**

- Reuse existing `NAVIGATE` to go from Sailing screen to Map screen while currently at sea.
- Do **not** clear the current destination when the player only opens the map.
- If the player cancels/backtracks, return to Sailing screen and keep the original route unchanged.

**Definition of Done:**

- Opening the map from sea does not break the current voyage.
- Back/cancel returns to sailing with the old destination intact.

---

### T-NAV.5 — Reroute Validation / Gating

**Files:** `logic.js`, `screens_voyage.jsx`

**Tasks:**

- Implement alternate-port reachability check from sea.
- Disable or block **Change Course** if no alternate reachable port exists.
- Grey out unreachable ports on the map while at sea.
- Add a clear message in Sailing screen when rerouting is impossible.

**Definition of Done:**

- Player cannot enter an impossible reroute.
- UI clearly communicates why the action is unavailable.

---

## 7. UI Tasks

### T-NAV.6 — Sailing Screen UX

**Files:** `screens_voyage.jsx`, maybe `ui.jsx`

**Tasks:**

- Add **Change Course** button to Sailing screen.
- Button states:
  - enabled when there is at least one alternate reachable port
  - disabled otherwise
- Add helper text for blocked state.
- Optional: show remaining endurance metadata (or keep it hidden if you want uncertainty).

**Recommended copy:**

> No alternate port is reachable from your current position under present conditions.

**Definition of Done:**

- Sailing screen communicates whether rerouting is possible.

---

### T-NAV.7 — Map Screen Supports At-Sea Origin

**Files:** `screens_voyage.jsx`

**Tasks:**

- Render ship marker at `seaPosition` when map is opened mid-voyage.
- Compute travel days to ports from `seaPosition` instead of `currentPort`.
- Show reachable/unreachable port states from sea.
- Keep hidden ports governed by current discovery state.
- If player selects current destination again, treat as cancel/no-op.

**Definition of Done:**

- Map can be used both from port and from mid-sea seamlessly.

---

## 8. Edge Cases to Explicitly Test

These edge cases must be converted into test cases.

### EC-1 — No Alternate Port Reachable

- Mid-voyage, with current state and remaining endurance, no alternate port is reachable.
- Expected: Change Course disabled or blocked with message.
- Expected: player may still continue current route.

### EC-2 — Current Route Would Be Unreachable If Recalculated

- Wind/cargo/event changes conditions mid-voyage.
- Expected: current route remains valid (route commitment immunity).
- Expected: alternate reroutes use current recalculated constraints.

### EC-3 — Open Map From Sea and Back Out

- Player opens map, chooses nothing, returns to sailing.
- Expected: original destination preserved.
- Expected: no progress reset, no time consumed.

### EC-4 — Reselect Same Destination

- Expected: no-op, equivalent to cancel/back.

### EC-5 — Hidden Port Discovered Mid-Voyage

- Expected: newly discovered hidden port immediately becomes eligible for reroute selection if reachable.

### EC-6 — Small Ship Near Hull-Gated Region

- Example: dinghy or sloop near ports requiring larger hull.
- Expected: reroute blocked if all alternates fail hull gate.
- Expected: current committed route still survives.

### EC-7 — Cargo Gain Mid-Sea Makes Reroute Impossible

- Example: plunder fills hold, effective travel days increase.
- Expected: reroute may become unavailable.
- Expected: existing route still continues.

---

## 9. Test Plan

### logic tests to add

- `getSeaPosition()` interpolation at 0%, 50%, 100% progress
- `travelDaysFromPosition()` correctness from arbitrary coordinates
- `getReachablePortsFromSea()` returns correct filtered set
- current destination excluded from alternates list if desired
- same destination reroute returns no-op

### engine tests to add

- `SAIL_TO` from port initializes route fields correctly
- `ADVANCE_DAY` updates `seaPosition` and progress
- open map from sea preserves active route
- reroute from sea recalculates new route from current `seaPosition`
- reroute blocked when no alternates reachable
- current route still completes after conditions worsen

### flow tests to add

- start route, advance 2 days, change course, arrive at new destination
- start route, open map, back out, continue original destination
- discover hidden port mid-sea, reroute to it if reachable

---

## 10. File Impact Matrix

| File | Impact |
|---|---|
| `logic.js` | New helpers for sea position, travel from arbitrary position, alternate reachability |
| `engine_core.js` | New route fields in state + migration support |
| `engine_voyage.js` | Refactor `SAIL_TO`, `ADVANCE_DAY`, preserve committed route, reroute flow |
| `screens_voyage.jsx` | Sailing button, map-from-sea rendering, reroute UX |
| `tests_logic.js` | New helper tests |
| `tests_engine.js` | New reducer/state progression tests |
| `tests_flows.js` | End-to-end reroute flow tests |

---

## 11. Implementation Order

### Phase 1 — Infrastructure

1. Add route fields to state + migration
2. Add sea-position helper(s)
3. Add travel-from-position helper(s)

### Phase 2 — Route Progression

4. Update `SAIL_TO` to initialize route metadata
5. Update `ADVANCE_DAY` to recompute progress/seaPosition each day

### Phase 3 — Reroute Capability

6. Add alternate reachability logic from sea
7. Allow map opening from sea without cancelling route
8. Allow selecting a new destination from sea

### Phase 4 — UI/UX Safety

9. Add Change Course button + disabled state + explanatory text
10. Update map screen to support sea-origin routing visuals

### Phase 5 — Tests / Balancing

11. Add logic tests
12. Add reducer tests
13. Add end-to-end flow tests

---

## 12. Definition of Done

The feature is considered done when all of the following are true:

- While sailing, the player can open the map and see the ship marker at a **daily-updated mid-sea position**.
- The player can choose a **new destination** from that map if at least one alternate reachable port exists.
- Travel time to the new destination is recalculated from current `seaPosition` under current conditions.
- Rerouting obeys **remaining endurance**, **current discovery state**, and **port access restrictions**.
- If no alternate port is reachable, the player is clearly informed and **cannot** enter an impossible reroute.
- If the player closes the map or reselects the same destination, the **existing route continues unchanged**.
- If current conditions worsen mid-voyage, the **current committed route still remains valid**.
- Save/load migration supports both old and new navigation states without breaking existing saves.
- Logic, reducer, and end-to-end tests cover the main happy-path and the agreed edge cases.

---

## 13. Future Extensions (Not in V1)

These are deliberately out of scope but made possible by this feature:

- Patrol-zone avoidance / hunting from sea position
- Treasure fleet interception based on route crossing
- Storm rerouting behavior
- Emergency drift / no-destination mode
- Waypoint plotting instead of destination-only rerouting
- Sea-region systems and coast proximity mechanics