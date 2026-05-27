# **Broadside: Refactoring Recommendations**

*Prioritized list of refactoring suggestions for JavaScript/JSX files to improve maintainability, reduce duplication, and enhance readability.*

---

---

## **🎯 Overview**

This document outlines **practical refactoring suggestions** for the `broadside` codebase, focusing on:

- **Reducing code duplication** (DRY principle).
- **Improving readability** and maintainability.
- **Enhancing testability** and robustness.
- **Preparing for future scalability**.

All recommendations are **low-risk** and can be implemented **incrementally**.

---

---

## **📌 Prioritized Refactoring List**

*(Sorted by impact/effort ratio, from highest to lowest priority.)*

---

### **🔥 High-Impact, Low-Effort**

---

#### **1. Merge `screens_shared.jsx` and `ui.jsx` into a Single File (`UI.jsx`)** --> DONE

**Why?**

- Both files contain **pure presentational components** with no game logic.
- `screens_shared.jsx` only has 3 components (`FactionPill`, `RepPill`, `ShipSprite`), while `ui.jsx` has the rest (e.g., `Btn`, `Bar`, `Panel`).
- Merging them **simplifies imports** and centralizes all UI primitives in one place.

**How?**

- Create a new `UI.jsx` file and **move all components** from `screens_shared.jsx` and `ui.jsx` into it.
- Replace all imports of `window.UI` and `window.S` with `window.UI` (or keep `window.S` for screens if preferred).
- Example structure:
  ```jsx
  // UI.jsx
  window.UI = (() => {
    // Theme tokens (T)
    const T = { ... };

    // Style helpers (e.g., panelStyle)
    const panelStyle = (overrides = {}) => ({ ... });

    // Components from ui.jsx
    const Btn = ({ ... }) => { ... };
    const Bar = ({ ... }) => { ... };
    const Pill = ({ ... }) => { ... };
    // ... other UI primitives

    // Components from screens_shared.jsx
    const FactionPill = ({ faction }) => { ... };
    const RepPill = ({ rep }) => { ... };
    const ShipSprite = ({ type, size }) => { ... };

    // Expose everything
    return {
      T,
      panelStyle,
      Btn,
      Bar,
      Pill,
      FactionPill,
      RepPill,
      ShipSprite,
      // ... other components
    };
  })();
  ```

**Impact**:  
✅ **Simplifies imports**: One place for all UI components.  
✅ **Reduces cognitive load**: No need to remember whether a component is in `UI` or `S`.  
✅ **Easier testing**: UI components can be tested in isolation.

**Effort**: Low (file reorganization + import updates).

---

#### **2. Consolidate `getHoldUsed` and `getHoldLoadPct` in `logic.js**`

**Why?**

- `getHoldUsed` is **only used by `getHoldLoadPct**` and `getHoldSpeedMultiplier`.
- These functions are **tightly coupled** and could be merged or inlined.

**How?**

- **Option 1**: Inline `getHoldUsed` into `getHoldLoadPct`:
  ```js
  const getHoldLoadPct = (holdItems, capacity) => {
    if (!capacity || capacity <= 0) return 0;
    const used = Object.values(holdItems || {}).reduce((sum, qty) => sum + qty, 0);
    return Math.min(1, used / capacity);
  };
  ```
- **Option 2**: Keep `getHoldUsed` but make it a **private helper** (not exposed in `window.L`).

**Impact**:  
✅ **Reduces API surface**: Fewer exposed functions to maintain.  
✅ **Simplifies logic**: No need to call `getHoldUsed` separately.

**Effort**: Low.

---

#### **3. Merge `getFameLabel` and `getFameTier` in `logic.js**`

**Why?**

- Both functions use the **same thresholds** and could be combined into a single function that returns **both the label and tier**.
- Currently, `getFameTier` is only used in `generators.js`, while `getFameLabel` is used in UI.

**How?**

- Replace both with a single function:
  ```js
  const getFameInfo = (fame) => {
    if (fame >= 350) return { label: "Immortal", tier: 4 };
    if (fame >= 200) return { label: "Legendary", tier: 3 };
    if (fame >= 100) return { label: "Notorious", tier: 2 };
    if (fame >= 50)  return { label: "Recognised", tier: 1 };
    return { label: "Unknown", tier: 0 };
  };
  ```
- Update callers to use:
  - `getFameInfo(fame).label` (replaces `getFameLabel(fame)`).
  - `getFameInfo(fame).tier` (replaces `getFameTier(fame)`).

**Impact**:  
✅ **Single source of truth**: No risk of thresholds getting out of sync.  
✅ **Reduces code**: 2 functions → 1.

**Effort**: Low (requires updating ~5-10 callers).

---

#### **4. Extract `createBattleState` Helper in `engine.js**` --> DONE

**Why?**

- The `battleState` object is **created in multiple places** (`INTERCEPT_FIGHT`, `INTERCEPT_FLEE` failure, `INTERCEPT_PARLEY` failure, `INTERCEPT_SURRENDER` failure).
- The logic is **identical** (player hull, crew, enemy stats, etc.).

**How?**

- Add a helper function in `engine.js`:
  ```js
  const createBattleState = (state, enemy, initialLog = "You engage the enemy!") => ({
    phase: "player_turn",
    playerHull: state.ship.hull,
    playerCrew: state.crew.roster.length,
    enemy,
    enemyHull: enemy.hull,
    enemyCrew: enemy.crew,
    round: 1,
    log: [initialLog],
    returnScreen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port",
    initialCrewCount: state.crew.roster.length,
    lostCrewNames: [],
    isNavyPatrol: false,
  });
  ```
- Replace all `battleState` creations with calls to this helper.

**Impact**:  
✅ **DRY**: ~30 lines of duplicated code removed.  
✅ **Easier to modify**: Changes to `battleState` structure only need to be made in one place.

**Effort**: Low.

---

#### **5. Consolidate Reputation Checks in `engine.js**` --> DONE

**Why?**

- **Every port action** (`REPAIR`, `BUY_SHIP`, `BUY_UPGRADE`, `HIRE_CREW`, `RAISE_MORALE`) has the **same reputation check**:
  ```js
  const repPerk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
  if (repPerk.servicesBlocked) {
    return { ...state, log: [...state.log, "You are at war with this port. No services available."] };
  }
  ```
- This is **repeated 5 times** with identical logic.

**How?**

- Extract a helper in `engine.js`:
  ```js
  const checkServicesBlocked = (state) => {
    const repPerk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
    if (repPerk.servicesBlocked) {
      return { ...state, log: [...state.log, "You are at war with this port. No services available."] };
    }
    return null; // Proceed with action
  };
  ```
- Use it in each action:
  ```js
  case A.REPAIR: {
    const blocked = checkServicesBlocked(state);
    if (blocked) return blocked;
    // ... rest of logic
  }
  ```

**Impact**:  
✅ **DRY**: ~25 lines of duplicated code removed.  
✅ **Consistency**: Ensures all service checks use the same logic.

**Effort**: Low.

---

#### **6. Extract `resolveInterceptAction` Helper in `engine.js**`

**Why?**

- The `INTERCEPT_FLEE`, `INTERCEPT_PARLEY`, `INTERCEPT_BRIBE`, and `INTERCEPT_SURRENDER` cases in `engine.js` have **very similar structures**:
  - Check if `encounterContext` exists.
  - Perform some logic (e.g., roll dice, check reputation).
  - On success: Update state and return to sailing/port.
  - On failure: Trigger a battle.
- This is **duplicated code** with minor variations.

**How?**

- Create a helper function in `engine.js`:
  ```js
  const resolveInterceptAction = (state, actionType, successCondition, onSuccess, onFailure) => {
    if (!state.encounterContext) return state;
    const ctx = state.encounterContext;
    const success = successCondition(state, ctx);
    if (success) {
      return onSuccess(state, ctx);
    } else {
      return onFailure(state, ctx);
    }
  };
  ```
- Refactor the intercept cases to use this helper. Example for `INTERCEPT_FLEE`:
  ```js
  case A.INTERCEPT_FLEE: {
    return resolveInterceptAction(
      state,
      A.INTERCEPT_FLEE,
      (state, ctx) => {
        const { player, enemy } = ctx.options.flee.speedCheck;
        return (player + L.roll(6)) >= (enemy + L.roll(6));
      },
      (state, ctx) => ({
        ...state,
        encounterContext: null,
        screen: state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port",
        log: [...state.log, "You pulled clear — the enemy couldn't keep up."]
      }),
      (state, ctx) => {
        const enemyObj = ctx.enemy;
        const bs = createBattleState(state, enemyObj, "Escape failed! The enemy closes in.");
        return { ...state, encounterContext: null, battleState: bs, screen: "battle" };
      }
    );
  }
  ```

**Impact**:  
✅ **DRY**: ~50 lines of duplicated code removed.  
✅ **Improves readability**: Clear separation of success/failure cases.  
✅ **Easier to extend**: Adding new intercept actions (e.g., `"bluff"`) becomes trivial.

**Effort**: Medium (requires careful refactoring of 4-5 cases).

---

---

### **🌟 Medium-Impact, Medium-Effort**

---

#### **7. Split `ADVANCE_DAY` in `engine.js` into Smaller Functions**

**Why?**

- The `ADVANCE_DAY` case is **~150 lines long** and handles:
  - Wind updates.
  - Crew wages.
  - Reputation decay.
  - Morale decay.
  - Provision consumption.
  - Random events.
  - Patrol checks.
  - Hidden port discovery.
- This is **hard to test and maintain**.

**How?**

- Extract sub-functions in `engine.js`:
  ```js
  // Wind update
  const updateWind = (state) => {
    const rawAngle = (state.wind.angle + (Math.random() - 0.5) * 30 + 360) % 360;
    return {
      angle: Math.round(rawAngle) % 360,
      speed: Math.round(Math.max(1, Math.min(20, state.wind.speed + (Math.random() - 0.5) * 5))),
    };
  };

  // Provision consumption
  const consumeProvisions = (state) => {
    const consumption = L.getProvisionConsumptionPerDay(state);
    const holdItems = state.hold?.items || {};
    return {
      food: Math.max(0, (holdItems.food || 0) - consumption.food),
      water: Math.max(0, (holdItems.water || 0) - consumption.water),
    };
  };

  // Provision crisis check
  const checkProvisionCrisis = (state, newFood, newWater) => {
    const foodJustRanOut = newFood === 0 && (state.hold?.items?.food || 0) > 0;
    const waterJustRanOut = newWater === 0 && (state.hold?.items?.water || 0) > 0;
    const foodOut = newFood === 0;
    const waterOut = newWater === 0;
    const wagesCrisis = state.gold < L.payCrewWages(state);
    return { foodJustRanOut, waterJustRanOut, anyCrisis: foodOut || waterOut || wagesCrisis };
  };

  // Random event handling
  const handleRandomEvent = (state) => {
    if (state.sailingDaysLeft >= 1 && Math.random() < 0.1) {
      const event = L.triggerRandomEvent(state);
      if (event) {
        return {
          activeEvent: event,
          screen: "event",
          log: [...state.log, `Day ${state.day + 1}: ${event.title}`],
        };
      }
    }
    return {};
  };

  // Patrol check
  const handlePatrolCheck = (state) => {
    if (state.sailingDaysLeft > 0 && !state.activeEvent && !state.encounterContext) {
      if (L.maybeRandomPatrol(state)) {
        const port = D.PORTS[state.currentPort];
        const enemy = G.generateEnemy("low", state.fame, port.faction);
        const context = L.buildEncounterContext(state, "navy_patrol", enemy);
        context.options.surrender.consequence = function(st) { ... }; // Override for navy patrols
        return { encounterContext: context, screen: "intercept" };
      }
    }
    return {};
  };

  // Hidden port discovery
  const handleHiddenPortDiscovery = (state) => {
    let autoDiscovered = [...(state.discoveredPorts || [])];
    let autoDiscoveryLog = [];
    Object.entries(D.PORTS).forEach(([key, port]) => {
      if (!port.hidden) return;
      if (autoDiscovered.includes(key)) return;
      const conditions = port.unlockCondition?.conditions || [];
      if (port.unlockCondition?.type === "item") return;
      const operator = port.unlockCondition?.type || "any";
      const results = conditions.map(c => { ... });
      const unlocked = operator === "all" ? results.every(Boolean) : results.some(Boolean);
      if (unlocked) {
        autoDiscovered.push(key);
        autoDiscoveryLog.push(`⚓ New port discovered: ${port.name}. Mark it on your charts.`);
      }
    });
    return { discoveredPorts: autoDiscovered, log: autoDiscoveryLog };
  };
  ```
- Rewrite `ADVANCE_DAY` to use these helpers.

**Impact**:  
✅ **Testable**: Each sub-function can be unit-tested in isolation.  
✅ **Readable**: Easier to understand the flow of `ADVANCE_DAY`.  
✅ **Maintainable**: Changes to one part (e.g., provision consumption) don’t risk breaking others.

**Effort**: Medium (requires careful extraction and testing).

---

#### **8. Merge `generateTradeMission` and `generateSmuggleMission` in `generators.js**`

**Why?**

- Both functions share **~80% of their logic**:
  - Picking a target port.
  - Calculating quantity based on hold capacity.
  - Calculating gold reward based on profit margins.
  - Generating mission text.
- The differences are:
  - Goods pool (`TRADE_GOODS_BY_TIER` vs. `SMUGGLE_GOODS_BY_TIER`).
  - Infamy gating for slaves.
  - Intercept chance (smuggle only).
  - Reputation impact (smuggle: +pirate, -target faction).

**How?**

- Create a **generic `generateDeliveryMission**` function:
  ```js
  const generateDeliveryMission = (portKey, state, type, faction, risk) => {
    const tier = L.getFameTier(state.fame ?? 0);
    const isSmuggle = type === "smuggle";
    const goodsPool = isSmuggle ? D.SMUGGLE_GOODS_BY_TIER[tier] : D.TRADE_GOODS_BY_TIER[tier];
    const infamy = state.infamy ?? 0;

    // Filter goods (e.g., slaves for smuggle)
    let eligibleGoods = [...goodsPool];
    if (isSmuggle && (risk === "low" || infamy < 25)) {
      eligibleGoods = eligibleGoods.filter(g => g !== "slaves");
    }
    if (isSmuggle && eligibleGoods.includes("slaves") && infamy >= 50 && Math.random() < 0.50) {
      eligibleGoods = ["slaves"];
    }
    if (eligibleGoods.length === 0) eligibleGoods = ["tobacco"];

    const good = pickRandom(eligibleGoods);
    const res = D.RESOURCES[good];
    if (!res) return null;

    // Quantity
    const holdCapacity = state.hold?.capacity || 200;
    const holdPct = isSmuggle
      ? { low: 0.08, medium: 0.18, high: 0.35 }[risk] || 0.08
      : { low: 0.10, medium: 0.25, high: 0.50 }[risk] || 0.10;
    const infamyQtyMult = (isSmuggle && good === "slaves" && infamy >= 50 && risk === "high") ? 1.5 : 1.0;
    const requiredQty = Math.max(isSmuggle ? 2 : 3, Math.round(holdCapacity * holdPct * infamyQtyMult));

    // Gold
    const margin = isSmuggle
      ? D.SMUGGLE_PROFIT_MARGINS[risk] || 0.80
      : D.TRADE_MISSION_PROFIT_MARGINS[risk] || 0.60;
    const expectedCost = res.basePrice * requiredQty;
    const gold = Math.round(expectedCost * (1 + margin) / 25) * 25;

    // Target port
    const targetPort = pickTargetPort(portKey, type, state, isSmuggle ? "pirate" : faction);
    if (!targetPort) return null;

    // Fame and infamy
    const fame = risk === "high" ? 2 : 1;
    const infamyGain = isSmuggle ? 1 : 0;

    // Reputation
    const repImpact = isSmuggle
      ? { pirate: D.MISSION_REP_IMPACTS.smuggle?.any ?? 2, [D.PORTS[targetPort]?.faction]: -3 }
      : { [faction]: D.MISSION_REP_IMPACTS.escort?.[risk] ?? 2 };

    // Enemy (for smuggle intercepts)
    const enemy = isSmuggle ? G.generateEnemy(risk, state.fame ?? 0, "pirate") : null;

    // Text
    const targetPortName = D.PORTS[targetPort]?.name || "unknown port";
    const goodName = res.name;
    const goodUnit = res.unit;
    const riskLabel = { low: "routine", medium: "dangerous", high: "perilous" }[risk] || "";
    const name = isSmuggle
      ? `Smuggle ${goodName} to ${targetPortName}`
      : `Deliver ${goodName} to ${targetPortName}`;

    const description = isSmuggle
      ? `Get ${requiredQty} ${goodUnit} of ${goodName} to ${targetPortName} without inspection. ${riskLabel.charAt(0).toUpperCase() + riskLabel.slice(1)} work — patrols are active.${res.illegal ? " Purchasing this cargo will darken your reputation." : ""} ${res.sourceHint || ""}`
      : `The ${pickRandom(D.MISSION_NAME_PARTS.factionAdj[faction] || ["Foreign"])} factor requires ${requiredQty} ${goodUnit} of ${goodName} at ${targetPortName}. Source the goods yourself and deliver — you will be paid in full on arrival.`;

    return {
      type,
      name,
      description,
      faction: isSmuggle ? "pirate" : faction,
      targetPort,
      risk,
      gold,
      fame,
      infamyGain,
      repImpact,
      enemy,
      requiredGood: good,
      requiredQty,
      ...(isSmuggle && { interceptChance: { low: 0.70, medium: 0.80, high: 0.90 }[risk] || 0.70 }),
      ...(isSmuggle && { isContraband: good !== "rum" }),
    };
  };
  ```
- Replace `generateTradeMission` and `generateSmuggleMission` with calls to this function.

**Impact**:  
✅ **DRY**: ~100 lines of duplicated logic removed.  
✅ **Easier to extend**: Adding new delivery mission types (e.g., `"courier"`) is trivial.  
✅ **Consistency**: Ensures trade and smuggle missions use the same logic for shared parts.

**Effort**: Medium (requires careful parameter passing and testing).

---

#### **9. Extract `validateTrade` Helper in `engine.js` (CONFIRM_TRADE)**

**Why?**

- The `CONFIRM_TRADE` case has **complex validation logic** for buys/sells, which is hard to follow.
- The validation for **gold** and **hold space** is interleaved with the execution logic.

**How?**

- Extract validation into a helper in `engine.js`:
  ```js
  const validateTrade = (state, buys, sells) => {
    const items = { ...(state.hold?.items || {}) };
    const usedAfterSells = L.getHoldUsed(items);
    let pendingBuysGold = 0;
    let pendingBuysSpace = 0;

    // Validate sells
    for (const [good, qty] of Object.entries(sells || {})) {
      if (qty <= 0) continue;
      const portGood = state.portMarket?.goods[good];
      if (!portGood) return { valid: false, reason: `${good} is not available at this port.` };
      if (qty > (items[good] || 0)) return { valid: false, reason: `Not enough ${good} in hold.` };
    }

    // Validate buys
    for (const [good, qty] of Object.entries(buys || {})) {
      if (qty <= 0) continue;
      const portGood = state.portMarket?.goods[good];
      if (!portGood) return { valid: false, reason: `${good} is not available at this port.` };
      if (qty > portGood.available) return { valid: false, reason: `Not enough ${good} available.` };
      pendingBuysGold += qty * portGood.buyFromPort;
      pendingBuysSpace += qty;
    }

    // Check gold
    const goldAfterSells = state.gold + Object.entries(sells || {}).reduce(
      (sum, [good, qty]) => sum + (qty * (state.portMarket?.goods[good]?.sellToPort || 0)),
      0
    );
    if (goldAfterSells - pendingBuysGold < 0) {
      return { valid: false, reason: "Insufficient gold." };
    }

    // Check hold space
    if (usedAfterSells + pendingBuysSpace > state.hold.capacity) {
      return { valid: false, reason: "Not enough hold space." };
    }

    return { valid: true };
  };
  ```
- Use it in `CONFIRM_TRADE`:
  ```js
  case A.CONFIRM_TRADE: {
    const { buys, sells } = action;
    if (!state.portMarket) return state;

    const validation = validateTrade(state, buys, sells);
    if (!validation.valid) {
      return { ...state, log: [...state.log, `Trade cancelled — ${validation.reason}`] };
    }
    // Proceed with trade...
  }
  ```

**Impact**:  
✅ **Separation of concerns**: Validation logic is separate from execution.  
✅ **Reusable**: Can be used elsewhere (e.g., for trade previews).  
✅ **Testable**: Validation can be tested independently.

**Effort**: Medium.

---

---

### **🌱 Low-Impact, Low-Effort**

---

#### **10. Rename Global Namespaces to More Descriptive Names**

**Why?**

- `window.D`, `window.L`, `window.E`, and `window.G` are **terse and unclear**.
- More descriptive names improve **readability** and **maintainability**.

**How?**

- Rename in all files:
  - `window.D` → `window.DATA` (or `window.CONSTANTS`).
  - `window.L` → `window.LOGIC`.
  - `window.E` → `window.ENGINE`.
  - `window.G` → `window.GENERATORS`.

**Impact**:  
✅ **Readability**: Easier for new contributors to understand.

**Effort**: Low (find-and-replace).

---

#### **11. Use `Object.freeze` for Constants**

**Why?**

- The `window.DATA` (formerly `window.D`) object contains **immutable constants** (e.g., `PORTS`, `SHIPS`).
- Accidentally modifying these could cause **hard-to-debug issues**.

**How?**

- Wrap the assignments in `Object.freeze`:
  ```js
  // data.js
  window.DATA = Object.freeze((() => { ... })());

  // logic.js
  window.LOGIC = Object.freeze((() => { ... })());

  // engine.js
  window.ENGINE = Object.freeze((() => { ... })());

  // generators.js
  window.GENERATORS = Object.freeze((() => { ... })());
  ```

**Impact**:  
✅ **Safety**: Prevents accidental mutations.  
✅ **Clarity**: Signals to developers that these are constants.

**Effort**: Low.

---

#### **12. Add JSDoc Comments to Exposed Functions**

**Why?**

- The codebase lacks **documentation for parameters and return types**.
- JSDoc improves **IDE support** (autocomplete, type hints) and **maintainability**.

**How?**

- Add JSDoc to all exposed functions in `logic.js`, `engine.js`, and `generators.js`:
  ```js
  /**
   * Calculates the number of days required to travel between two ports.
   * @param {string} fromPort - Key of the starting port.
   * @param {string} toPort - Key of the destination port.
   * @param {object} state - Current game state.
   * @returns {number} Days required (minimum 1).
   */
  const travelDays = (fromPort, toPort, state) => { ... };
  ```

**Impact**:  
✅ **Developer Experience**: Better IDE support.  
✅ **Maintainability**: Easier to understand function contracts.

**Effort**: Medium (requires adding comments to ~50 functions).

---

#### **13. Replace `Math.random` with a Seedable RNG for Testing**

**Why?**

- **Testing functions that use `Math.random` is difficult** because outputs are non-deterministic.
- A **seedable RNG** (e.g., `seedrandom`) allows reproducible tests.

**How?**

- Create a new file `rng.js`:
  ```js
  let rng = Math.random;
  export const setRng = (newRng) => { rng = newRng; };
  export const random = () => rng();
  ```
- Update all files to use `random()` instead of `Math.random()`:
  ```js
  // In logic.js, engine.js, generators.js
  import { random } from './rng.js';
  // Replace Math.random() with random()
  ```
- In tests, use `setRng` to inject a seedable RNG:
  ```js
  import { setRng } from './rng.js';
  import { generateEnemy } from './generators.js';

  test('generateEnemy returns valid stats', () => {
    setRng(seedrandom('test-seed')); // seedrandom is a library
    const enemy = generateEnemy('low', 0, 'english');
    expect(enemy.hull).toBeGreaterThan(0);
  });
  ```

**Impact**:  
✅ **Testability**: Reproducible tests for random functions (e.g., `generateMissions`, `generateEnemy`).  
✅ **Debugging**: Easier to reproduce edge cases.

**Effort**: Medium (requires updating ~20-30 calls to `Math.random`).

---

---

---

## **📊 Summary Table**


| **#** | **Refactoring**                                       | **Impact** | **Effort** | **Priority** | **Files Affected**                                  |
| ----- | ----------------------------------------------------- | ---------- | ---------- | ------------ | --------------------------------------------------- |
| 1     | Merge `screens_shared.jsx` and `ui.jsx` into `UI.jsx` | High       | Low        | ⭐⭐⭐          | `screens_shared.jsx`, `ui.jsx`, `App.jsx`, `*.jsx`  |
| 2     | Consolidate `getHoldUsed`/`getHoldLoadPct`            | High       | Low        | ⭐⭐⭐          | `logic.js`                                          |
| 3     | Merge `getFameLabel`/`getFameTier`                    | High       | Low        | ⭐⭐⭐          | `logic.js`, `generators.js`                         |
| 4     | Extract `createBattleState` helper                    | High       | Low        | ⭐⭐⭐          | `engine.js`                                         |
| 5     | Consolidate reputation checks                         | High       | Low        | ⭐⭐⭐          | `engine.js`                                         |
| 6     | Extract `resolveInterceptAction` helper               | High       | Medium     | ⭐⭐⭐          | `engine.js`                                         |
| 7     | Split `ADVANCE_DAY` into helpers                      | Medium     | Medium     | ⭐⭐           | `engine.js`                                         |
| 8     | Merge `generateTradeMission`/`generateSmuggleMission` | Medium     | Medium     | ⭐⭐           | `generators.js`                                     |
| 9     | Extract `validateTrade` helper                        | Medium     | Medium     | ⭐⭐           | `engine.js`                                         |
| 10    | Rename global namespaces                              | Low        | Low        | ⭐            | All files                                           |
| 11    | Use `Object.freeze` for constants                     | Low        | Low        | ⭐            | `data.js`, `logic.js`, `engine.js`, `generators.js` |
| 12    | Add JSDoc comments                                    | Low        | Medium     | ⭐            | All files                                           |
| 13    | Seedable RNG for testing                              | Low        | Medium     | ⭐            | All files                                           |


---

---

---

## **🎯 Recommended Order of Implementation**

### **Phase 1: Quick Wins (Low Effort, High Impact)**

1. **Merge `screens_shared.jsx` and `ui.jsx` into `UI.jsx**`.
2. **Consolidate `getHoldUsed`/`getHoldLoadPct**`.
3. **Merge `getFameLabel`/`getFameTier**`.
4. **Extract `createBattleState` helper**.
5. **Consolidate reputation checks in `engine.js**`.
6. **Rename global namespaces** (`D` → `DATA`, `L` → `LOGIC`, etc.).
7. **Use `Object.freeze` for constants**.

### **Phase 2: Medium Effort, High Impact**

8. **Extract `resolveInterceptAction` helper**.
9. **Split `ADVANCE_DAY` into smaller functions**.
10. **Merge `generateTradeMission`/`generateSmuggleMission**`.
11. **Extract `validateTrade` helper**.

### **Phase 3: Longer-Term Improvements**

12. **Add JSDoc comments** to all exposed functions.
13. **Replace `Math.random` with a seedable RNG** for testing.

---

---

---

## **📝 Notes for Each Refactoring**

### **1. Merge `screens_shared.jsx` and `ui.jsx` into `UI.jsx**`

- **Why not a folder?** You requested a **single file**, so we’ll merge everything into `UI.jsx`.
- **Backward Compatibility**: Update all imports to use `window.UI` (or keep `window.S` for screens if you prefer separation).
- **Testing**: Easier to test UI components in isolation.

---

### **2-5. Consolidate Small Functions**

- These are **low-risk, high-reward** changes that reduce duplication and improve clarity.
- **Test After Each Change**: Ensure no regressions in game logic.

---

### **6. Extract `resolveInterceptAction` Helper**

- **Key Benefit**: Reduces **~50 lines of duplicated code** in `engine.js`.
- **Testing**: Test each intercept action (`FLEE`, `PARLEY`, etc.) to ensure the helper works correctly.

---

### **7. Split `ADVANCE_DAY` into Helpers**

- **Why?** The `ADVANCE_DAY` case is **too complex** (150+ lines). Splitting it improves readability and testability.
- **Approach**: Extract **one helper at a time** and test after each extraction.

---

### **8. Merge `generateTradeMission`/`generateSmuggleMission`**

- **Why?** These functions share **~80% of their logic**. Merging them reduces duplication.
- **Testing**: Test mission generation to ensure trade and smuggle missions still work as expected.

---

### **9. Extract `validateTrade` Helper**

- **Why?** The `CONFIRM_TRADE` case has **complex validation logic** that’s hard to follow. Extracting it improves clarity.
- **Testing**: Test trade validation with edge cases (e.g., insufficient gold, no hold space).

---

### **10-13. Low-Impact Improvements**

- These are **nice-to-have** changes that improve code quality but aren’t urgent.
- **JSDoc**: Start with the most **critical functions** (e.g., `travelDays`, `resolveCombatAction`).
- **Seedable RNG**: Useful for **unit testing** but requires a library (`seedrandom`).

---

---

---

## **⚠️ Risks and Mitigations**


| **Risk**                            | **Mitigation**                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| **Breaking existing functionality** | Test thoroughly after each refactoring. Focus on **combat, missions, and trading**. |
| **Performance regressions**         | None of these refactorings should impact performance.                               |
| **Merge conflicts**                 | Refactor **one file at a time** and commit changes frequently.                      |
| **Loss of context**                 | Add **JSDoc comments** to explain the purpose of each function.                     |
| **Over-engineering**                | Stick to **practical, low-risk** changes. Avoid premature abstraction.              |


---

---

---

## **🚀 Example PR Plan**

Here’s how you might structure **pull requests** for these refactorings:

---

### **PR 1: Clean Up Global Namespaces and Merge UI Files**

**Changes**:

1. Rename `window.D` → `window.DATA`, `window.L` → `window.LOGIC`, etc.
2. Merge `screens_shared.jsx` and `ui.jsx` into `UI.jsx`.
3. Update all imports in other files.

**Impact**:

- ✅ More descriptive global names.
- ✅ Single location for all UI components.

**Effort**: Low.

---

### **PR 2: Extract Helpers in `engine.js**`

**Changes**:

1. Extract `createBattleState` helper.
2. Extract `resolveInterceptAction` helper.
3. Consolidate reputation checks.
4. Split `ADVANCE_DAY` into smaller functions.

**Impact**:

- ✅ ~100 lines of duplicated code removed.
- ✅ Easier to test and maintain.

**Effort**: Medium.

---

### **PR 3: Consolidate Functions in `logic.js` and `generators.js**`

**Changes**:

1. Merge `getFameLabel` and `getFameTier`.
2. Consolidate `getHoldUsed` and `getHoldLoadPct`.
3. Merge `generateTradeMission` and `generateSmuggleMission`.

**Impact**:

- ✅ ~50 lines of duplicated code removed.
- ✅ Single source of truth for related logic.

**Effort**: Medium.

---

### **PR 4: Add Documentation and Testing Improvements**

**Changes**:

1. Add JSDoc comments to all exposed functions.
2. Replace `Math.random` with a seedable RNG for testing.

**Impact**:

- ✅ Better IDE support.
- ✅ Reproducible tests.

**Effort**: Medium.

---

---

---

## **🎉 Final Thoughts**

- **Start small**: Tackle the **low-effort, high-impact** refactorings first (e.g., merging UI files, renaming globals).
- **Test frequently**: After each change, test **combat, missions, trading, and saving/loading**.
- **Commit often**: Small, focused commits make it easier to **revert changes** if something breaks.
- **Prioritize readability**: The goal is to make the codebase **easier to understand and maintain**, not just shorter.

By following this plan, you’ll **gradually improve** the codebase without introducing risk or downtime. Happy refactoring! 🚀