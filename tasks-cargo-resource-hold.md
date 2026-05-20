# Tasks: Cargo, Resource & Hold System
### P1.2 · P1.3 · P1.4

> **Implementing agent:** read this entire document before writing a single line.
> All design decisions are locked. Sections marked ⚙ require the agent to
> confirm a specific value or approach before coding that section.
> The MVP scope is defined at the end of Part 0. Build only what is in scope.

---

## Design Decisions (All Locked)

**Hold model:** Single shared hold for all goods — food, water, and trade goods
compete for the same cargo units. This is the P1.4 "every success creates a new
problem" tension: a hold full of silk means less food and shorter range.

**Provision types in scope:** Food and water only. Medicine and ammunition are
deferred — they add system surface area without proportional gameplay benefit at
this stage.

**Consumption rate:** `Math.ceil(crew.roster.length / 10)` units of food per day
+ same for water. Scales with actual crew aboard. A skeleton crew travels further
on the same provisions.

**Hold capacity formula:** `4 × Math.ceil(maxCrew / 10) × maxDays`. This ensures
that at maximum crew, maximum-range provisions (food + water) consume exactly half
the hold. The other half is available for trade goods. `maxDays` is a new field
on each SHIPS entry (also used by the future geographic progression system).

**Morale penalty:** When food = 0 OR water = 0 OR gold < daily wages, apply −1
morale per day. These three triggers do **not** stack — only one −1 applies
regardless of how many are active simultaneously. Log entry when any provision
first hits 0.

**Prices:** Food and water have fixed prices (0% variance). Trade goods have
20% variance, re-rolled on each port entry. Player sees three values per good:
base price (reference), port buy price (what you pay, rolled), port sell price
(what port pays you, also rolled independently). All ports buy everything
(no sell restrictions). Available stock is also rolled per port entry.

**Speed penalty:** Applied as a travel time multiplier, not a speed subtraction
(avoids integer rounding issues with low speed values):
- Hold < 50% full: ×1.0 (no penalty)
- Hold 50–75% full: ×1.11 (~−10% speed equivalent)
- Hold 75–100% full: ×1.33 (~−25% speed equivalent)

**Cargo in events:** `loseCargoPercent` events reduce ALL hold items including
food and water (harsh but consistent — storms don't spare your bread).
`loseContraband` events remove only illegal goods (tobacco, slaves).

**Market navigation:** Dedicated `MarketScreen`, accessed from `PortScreen`.
Shows all goods. Market state (prices, available stock) is stored in
`state.portMarket` and generated fresh on ENTER_PORT.

**Combat plunder:** Combat victory remains as a gold reward. Plunder as actual
cargo is a future feature (plunder screen, noted on roadmap below).

**Contraband:** Tobacco is illegal (display only — patrol consequences come with
smuggling mission rework). Slaves are illegal + infamy gain on purchase (+1
infamy per buy transaction, regardless of quantity).

**Time in port:** No time advancement, no provision consumption in port.
Provisions only matter at sea.

**Cargo hold upgrade:** Deferred to equipment slot system implementation.

**Price memory:** No inter-port price memory in this phase. Future world events
will influence prices.

**Cargo surrender/seizure:** `SURRENDER_CONSEQUENCE.loseCargoPercent` and
`loseContraband` fields already exist in data.js but are not yet implemented
in the reducer. This phase implements them.

---

## Deferred (Do Not Build — Document for Roadmap)

Add the following to the roadmap after P1.4:

- **Plunder screen:** After combat victory, a dedicated screen showing enemy
  cargo estimate. Player chooses how much to take (limited by hold space).
  Generates actual goods in hold instead of flat gold reward.
- **Medicine and ammunition:** Two additional provision types with triggered
  (not passive) consumption. Medicine consumed when crew are lost in combat.
  Ammo consumed per battle. Deferred until combat system is more mature.
- **Cargo hold upgrade:** Part of the equipment slot redesign. Will increase
  `hold.capacity` as an upgrade effect.
- **Dynamic prices from world events:** World events (e.g., "Spain bans rum
  trade") apply a multiplier to base prices. Feeds into P2.4.
- **Smuggling mission rework:** Smuggling missions will reference actual cargo
  in hold. Navy patrol event will check for contraband. Deferred until after
  this phase is stable.
- **Patrol contraband check:** `navy_patrol` random event currently doesn't
  inspect hold. Once smuggling is reworked, "Allow inspection" should trigger
  `loseContraband` if illegal goods are present.

---

## MVP Scope (P25 decision)

The implementing agent builds the full scope described in this document.
The MVP is NOT a reduced subset — all parts below are in scope. The "minimum
viable" clarification means: no speed penalty in a separate phase, no plunder
screen, no medicine/ammo. Everything else described here is required.

---

## Part 0 — Roadmap Additions

Before writing code, add to roadmap.md:

- [ ] **Add "Plunder Screen" as a roadmap item** after P1.4. Short description:
  "After combat victory, show a plunder screen with estimated enemy cargo.
  Player allocates hold space to take goods. Replaces flat gold-only reward
  with actual cargo items."
- [ ] **Note P1.6 (Morale decay in port)** — currently listed on roadmap as
  morale decay for idle players. Confirm this is still the same item and not
  confused with provisions morale decay (which is implemented here at sea).
  These are separate: provisions morale (at sea, this phase) vs. idle morale
  (in port, P1.6 roadmap item, still pending).

---

## Part 1 — data.js: New Constants

### 1.1 — Add `maxDays` and `holdCapacity` to SHIPS

`maxDays` is the maximum number of days this ship type can provision for
at maximum crew. Also used by the future geographic range system.
`holdCapacity` is derived by the formula above — include it explicitly in
data.js so no other file needs to recompute it.

```js
// Formula: holdCapacity = 4 × ceil(maxCrew / 10) × maxDays
dinghy:      { ..., maxDays:  5, holdCapacity:  20  }  // ceil(5/10)=1  → 4×1×5
sloop:       { ..., maxDays: 10, holdCapacity: 200  }  // ceil(50/10)=5 → 4×5×10
brigantine:  { ..., maxDays: 14, holdCapacity: 448  }  // ceil(80/10)=8 → 4×8×14
merchantman: { ..., maxDays: 14, holdCapacity: 336  }  // ceil(60/10)=6 → 4×6×14
frigate:     { ..., maxDays: 18, holdCapacity: 720  }  // ceil(100/10)=10 → 4×10×18
galleon:     { ..., maxDays: 22, holdCapacity: 1320 }  // ceil(150/10)=15 → 4×15×22
```

Note: merchantman has 60 maxCrew, so ceil(60/10)=6, × 14 × 4 = 336.
The merchantman has a slightly smaller hold than the brigantine (80 crew)
because it has fewer crew — this is intentional. Its advantage is cost (1500g).

### 1.2 — Add `RESOURCES` constant

One entry per tradeable good. This is the single source of truth for all goods
in the game. Fields:
- `name`: display name
- `basePrice`: reference price in gold (shown to player)
- `variance`: price variance fraction (0 = fixed, 0.2 = ±20%)
- `illegal`: boolean — shows in red with "(Illegal)" in market screen
- `infamyOnBuy`: infamy gained when buying this good (0 for most)
- `unit`: display unit string (e.g. "crate", "barrel", "bale")

```js
window.D.RESOURCES = {
  food: {
    name: "Food",       basePrice: 5,   variance: 0,    illegal: false, infamyOnBuy: 0,
    unit: "ration",
  },
  water: {
    name: "Water",      basePrice: 3,   variance: 0,    illegal: false, infamyOnBuy: 0,
    unit: "barrel",
  },
  rum: {
    name: "Rum",        basePrice: 30,  variance: 0.20, illegal: false, infamyOnBuy: 0,
    unit: "cask",
  },
  sugar: {
    name: "Sugar",      basePrice: 40,  variance: 0.20, illegal: false, infamyOnBuy: 0,
    unit: "sack",
  },
  timber: {
    name: "Timber",     basePrice: 25,  variance: 0.20, illegal: false, infamyOnBuy: 0,
    unit: "plank",
  },
  cloth: {
    name: "Cloth",      basePrice: 55,  variance: 0.20, illegal: false, infamyOnBuy: 0,
    unit: "bale",
  },
  spices: {
    name: "Spices",     basePrice: 80,  variance: 0.20, illegal: false, infamyOnBuy: 0,
    unit: "chest",
  },
  silk: {
    name: "Silk",       basePrice: 110, variance: 0.20, illegal: false, infamyOnBuy: 0,
    unit: "bolt",
  },
  weapons: {
    name: "Weapons",    basePrice: 65,  variance: 0.20, illegal: false, infamyOnBuy: 0,
    unit: "crate",
  },
  tobacco: {
    name: "Tobacco",    basePrice: 150,  variance: 0.20, illegal: true,  infamyOnBuy: 0,
    unit: "bale",
  },
  slaves: {
    name: "Slaves",     basePrice: 200, variance: 0.20, illegal: true,  infamyOnBuy: 1,
    unit: "person",
  },
};
```

⚙ **Agent to confirm:** are these base prices coherent with the ship economy?
A sloop hull at 100 gold, an upgrade at 500–800g. A full sloop hold (100 units)
of silk = 11,000g at base price. That is a late-game windfall. Spices at 80g
with 100 units = 8,000g. These feel like the right range for late-game trade.
Early game the player uses the 100 free-cargo-units to carry 50-unit lots (5000g
of silk), so a full trade run pays more than a mission but takes more voyage time.
Confirm or adjust before coding.

### 1.3 — Add `GOODS_AVAILABILITY` constant

Per-port availability for each good. Tiers: `"always"`, `"frequently"`,
`"sometimes"`, `"rarely"`, `"never"`.

Food and water are always `"always"` at every port. Hidden ports get minimal
tables (food/water sometimes, a few goods rarely).

The generator uses these tiers to determine:
- Whether the good appears in this port's market (never = absent entirely)
- How many units are available to buy (rolled from tier-appropriate range):
  - always: 999 (effectively unlimited for food/water); for trade goods: 40–80
  - frequently: 20–40
  - sometimes: 8–20
  - rarely: 2–8
  - never: 0 / not rendered

```js
window.D.GOODS_AVAILABILITY = {
  //                    food      water     rum         sugar       timber      cloth       spices      silk        weapons     tobacco     slaves
  tortuga:          [ "always",  "always",  "always",   "rarely",   "sometimes","rarely",   "rarely",   "never",    "sometimes","frequently","sometimes"],
  portDepaix:       [ "always",  "always",  "sometimes","frequently","rarely",   "sometimes","rarely",   "never",    "rarely",   "rarely",   "never"    ],
  petitGoave:       [ "always",  "always",  "frequently","sometimes","sometimes","rarely",   "never",    "never",    "never",    "sometimes","rarely"   ],
  santoDomingo:     [ "always",  "always",  "rarely",   "frequently","rarely",   "sometimes","sometimes","rarely",   "rarely",   "never",    "rarely"   ],
  havana:           [ "always",  "always",  "rarely",   "frequently","rarely",   "frequently","sometimes","sometimes","sometimes","never",    "never"    ],
  santiagoDeCuba:   [ "always",  "always",  "rarely",   "sometimes","rarely",   "rarely",   "never",    "never",    "rarely",   "never",    "never"    ],
  nassau:           [ "always",  "always",  "frequently","never",    "rarely",   "rarely",   "rarely",   "never",    "sometimes","sometimes","sometimes"],
  portRoyal:        [ "always",  "always",  "sometimes","sometimes","frequently","frequently","sometimes","sometimes","frequently","rarely",   "rarely"  ],
  kingston:         [ "always",  "always",  "rarely",   "rarely",   "frequently","sometimes","rarely",   "rarely",   "sometimes","never",    "never"   ],
  portobelo:        [ "always",  "always",  "rarely",   "rarely",   "rarely",   "sometimes","frequently","sometimes","sometimes","never",    "never"   ],
  cartagena:        [ "always",  "always",  "rarely",   "sometimes","rarely",   "frequently","frequently","frequently","rarely",  "never",    "never"   ],
  maracaibo:        [ "always",  "always",  "rarely",   "sometimes","frequently","sometimes","rarely",   "rarely",   "rarely",   "never",    "never"   ],
  curacao:          [ "always",  "always",  "sometimes","sometimes","sometimes","frequently","frequently","sometimes","sometimes","rarely",   "rarely"  ],
  stEustatius:      [ "always",  "always",  "sometimes","rarely",   "rarely",   "frequently","sometimes","sometimes","frequently","sometimes","sometimes"],
  martinique:       [ "always",  "always",  "frequently","always",  "rarely",   "sometimes","sometimes","rarely",   "rarely",   "rarely",   "rarely"  ],
  // Hidden ports (visible only when unlocked)
  dryTortugas:      [ "sometimes","sometimes","sometimes","never",  "never",    "never",    "never",    "never",    "rarely",   "sometimes","never"   ],
  lasAves:          [ "sometimes","sometimes","never",    "never",  "never",    "never",    "never",    "never",    "never",    "rarely",   "rarely"  ],
  libertalia:       [ "always",  "always",  "always",   "rarely",   "rarely",   "rarely",   "rarely",   "sometimes","frequently","frequently","frequently"],
};
// Column order matches: food, water, rum, sugar, timber, cloth, spices, silk, weapons, tobacco, slaves
// Agents: keep this comment in the code for maintainability.
```

⚙ **Agent to confirm:** review this table against the port descriptions in data.js
PORTS. The table should match the port's narrative identity. For example, Cartagena
is described as "luxury goods" → silk and spices high. Tortuga is a pirate haven
→ rum always, contraband available. Adjust any entries that feel wrong.

### 1.4 — Update `SURRENDER_CONSEQUENCE` to document cargo fields

The fields `loseCargoPercent` and `loseContraband` already exist. No data change
needed — just confirm the engine implements them (Part 4).

However, add a new consequence type for completeness:
```js
random: { loseCargoPercent: 20, moralePenalty: 8 },
```
Already present. No change needed here. Verify during engine implementation.

### 1.5 — Add RESOURCES to the exports object

```js
return {
  // ... existing exports ...
  RESOURCES,
  GOODS_AVAILABILITY,
};
```

---

## Part 2 — logic.js: New Pure Functions

All functions are deterministic (no `Math.random`). Add to `window.L`.

### 2.1 — `getHoldUsed(holdItems)` → number

```js
const getHoldUsed = (holdItems) =>
  Object.values(holdItems || {}).reduce((sum, qty) => sum + qty, 0);
```

### 2.2 — `getHoldLoadPct(holdItems, capacity)` → number (0–1)

```js
const getHoldLoadPct = (holdItems, capacity) => {
  if (!capacity || capacity <= 0) return 0;
  return Math.min(1, getHoldUsed(holdItems) / capacity);
};
```

### 2.3 — `getHoldSpeedMultiplier(loadPct)` → number

Returns travel-time multiplier (higher = slower). Apply to travelDays result.
```js
const getHoldSpeedMultiplier = (loadPct) => {
  if (loadPct < 0.50) return 1.00;
  if (loadPct < 0.75) return 1.11;
  return 1.33;
};
```

### 2.4 — `getProvisionConsumptionPerDay(state)` → `{ food, water }`

```js
const getProvisionConsumptionPerDay = (state) => {
  const crewCount = state.crew?.roster?.length ?? 0;
  const rate = Math.ceil(crewCount / 10);
  return { food: rate, water: rate };
};
```

### 2.5 — `getDaysOfProvisions(holdItems, consumptionPerDay)` → `{ food, water }`

Returns how many days of each provision the player has at current consumption.
Used by SailingScreen and MapScreen for display.

```js
const getDaysOfProvisions = (holdItems, consumptionPerDay) => ({
  food:  consumptionPerDay.food  > 0 ? Math.floor((holdItems.food  || 0) / consumptionPerDay.food)  : Infinity,
  water: consumptionPerDay.water > 0 ? Math.floor((holdItems.water || 0) / consumptionPerDay.water) : Infinity,
});
```

### 2.6 — Update `travelDays(state, destinationKey)` to apply cargo penalty

Current `travelDays` returns a base number. Wrap the result:

```js
const travelDays = (state, destinationKey) => {
  // ... existing distance / wind / speed calculation ...
  const baseDays = /* existing result */;
  const loadPct = getHoldLoadPct(state.hold?.items, state.hold?.capacity);
  const mult = getHoldSpeedMultiplier(loadPct);
  return Math.max(1, Math.round(baseDays * mult));
};
```

If cargo hold is empty or absent (early state), `loadPct` = 0, multiplier = 1.0,
no change to existing behaviour.

### 2.7 — `applyLoseCargoPercent(holdItems, percent)` → holdItems

Used by engine when surrender or event triggers cargo loss.
```js
const applyLoseCargoPercent = (holdItems, percent) => {
  const factor = 1 - (percent / 100);
  const result = {};
  Object.entries(holdItems || {}).forEach(([good, qty]) => {
    result[good] = Math.floor(qty * factor);
  });
  return result;
};
```

### 2.8 — `applyLoseContraband(holdItems)` → holdItems

Removes all illegal goods. Reads RESOURCES to determine which goods are illegal.
```js
const applyLoseContraband = (holdItems) => {
  const result = { ...holdItems };
  Object.keys(window.D.RESOURCES).forEach(good => {
    if (window.D.RESOURCES[good].illegal) result[good] = 0;
  });
  return result;
};
```

### 2.9 — Export all new functions from `window.L`

Add to the return object at the bottom of logic.js:
`getHoldUsed`, `getHoldLoadPct`, `getHoldSpeedMultiplier`,
`getProvisionConsumptionPerDay`, `getDaysOfProvisions`,
`applyLoseCargoPercent`, `applyLoseContraband`.

`travelDays` already exported — just update its implementation.

---

## Part 3 — generators.js: Port Market Generator

### 3.1 — Add `generatePortMarket(portKey, state)` → portMarket object

Generates the market data for a port on entry. Called from ENTER_PORT reducer.

```js
const generatePortMarket = (portKey) => {
  const resources   = window.D.RESOURCES;
  const availability = window.D.GOODS_AVAILABILITY[portKey] || {};
  const goodKeys    = Object.keys(resources);
  // GOODS_AVAILABILITY rows follow this column order:
  const colOrder    = ["food","water","rum","sugar","timber","cloth","spices","silk","weapons","tobacco","slaves"];

  const tierQtyRanges = {
    always:     { min: 40, max: 80  },  // food/water get special 999 treatment
    frequently: { min: 20, max: 40  },
    sometimes:  { min: 8,  max: 20  },
    rarely:     { min: 2,  max: 8   },
    never:      null,
  };

  const goods = {};
  colOrder.forEach((good, idx) => {
    const tier = availability[idx] || "never";
    if (tier === "never") return;  // absent from this port's market

    const res = resources[good];
    const isFixed = res.variance === 0;

    // Roll market price
    const variance = res.basePrice * res.variance;
    const marketPrice = isFixed
      ? res.basePrice
      : Math.round((res.basePrice + randBetween(-variance, variance)) / 5) * 5;

    // Buy from port (player pays) and sell to port (player receives)
    const buyFromPort  = isFixed ? res.basePrice : Math.round(marketPrice * 1.10);
    const sellToPort   = isFixed ? res.basePrice : Math.round(marketPrice * 0.90);

    // Available quantity
    let available;
    if (good === "food" || good === "water") {
      available = 999;
    } else {
      const range = tierQtyRanges[tier];
      available = range ? randInt(range.min, range.max) : 0;
    }

    goods[good] = { basePrice: res.basePrice, buyFromPort, sellToPort, available };
  });

  return { portKey, goods };
};
```

Add `generatePortMarket` to the `window.G` export object.

### 3.2 — Export

```js
return {
  // ... existing exports ...
  generatePortMarket,
};
```

---

## Part 4 — engine.js: State, Actions, Reducer

### 4.1 — Update `initialState`

Add `hold` and `portMarket` to initialState. The ship starts with some food
and water (a few days' worth — not full provisions, to nudge the player to the
market immediately).

```js
// In initialState, after crew:
hold: {
  capacity: D.SHIPS.sloop.holdCapacity,  // 200 — default ship is sloop
  items: {
    food: 10,    // ~2 days for small crew — enough to reach a nearby port
    water: 10,
    rum: 0, sugar: 0, timber: 0, cloth: 0, spices: 0,
    silk: 0, weapons: 0, tobacco: 0, slaves: 0,
  },
},
portMarket: null,  // generated on ENTER_PORT
```

### 4.2 — Update `START_GAME`

When building `newState` in START_GAME, set hold capacity from the starting ship:
```js
hold: {
  capacity: D.SHIPS[startShip.type].holdCapacity,
  items: { food: 10, water: 10, rum:0, sugar:0, timber:0, cloth:0,
           spices:0, silk:0, weapons:0, tobacco:0, slaves:0 },
},
portMarket: null,
infamy: 0,  // already set — verify this is present
```

### 4.3 — Update `BUY_SHIP`

When the player buys a new ship, update `hold.capacity` to the new ship's capacity.
Items in hold are preserved (the player's goods transfer to the new ship). If the
new ship's capacity is smaller than current load, the items are kept as-is but the
hold will show as over-capacity — this is an edge case that can be flagged in the
log: `"Warning: your cargo exceeds this ship's hold capacity."` The player must
sell goods before sailing efficiently.

```js
// In BUY_SHIP case, when constructing the returned state:
hold: {
  ...state.hold,
  capacity: D.SHIPS[action.shipType].holdCapacity,
},
```

### 4.4 — Update `ENTER_PORT`

Add market generation on port entry:
```js
// In ENTER_PORT case, add to returned state:
portMarket: G.generatePortMarket(portKey),
```

### 4.5 — Update `ADVANCE_DAY`

Provisions consumption is the most critical piece of this system.
Insert into the ADVANCE_DAY case after existing wage/wind/event logic:

```js
// — Provision consumption —
const consumption = L.getProvisionConsumptionPerDay(state);
const newFood  = Math.max(0, (state.hold?.items?.food  || 0) - consumption.food);
const newWater = Math.max(0, (state.hold?.items?.water || 0) - consumption.water);

const newHoldItems = {
  ...(state.hold?.items || {}),
  food: newFood,
  water: newWater,
};

// — Morale penalty (one -1 max per day regardless of stacking) —
// Check: was food or water just exhausted? (crossed zero this day)
const foodJustRanOut  = newFood === 0 && (state.hold?.items?.food  || 0) > 0;
const waterJustRanOut = newWater === 0 && (state.hold?.items?.water || 0) > 0;
const foodOut  = newFood  === 0;
const waterOut = newWater === 0;
const wagesOwed = /* existing wages calculation */;
const goldAfterWages = newGold - wagesOwed;
const wagesCrisis = goldAfterWages < 0;

const anyProvisionCrisis = foodOut || waterOut || wagesCrisis;
const newMorale = anyProvisionCrisis
  ? Math.max(0, crewState.morale - 1)
  : crewState.morale;  // other morale changes (existing system) still apply separately

// Log entries for first-time exhaustion
const provisionLog = [];
if (foodJustRanOut)  provisionLog.push("⚠ The food stores are empty. The crew grows hungry.");
if (waterJustRanOut) provisionLog.push("⚠ The water barrels are dry. The crew suffers.");

// Include newHoldItems, newMorale, provisionLog in the returned state.
```

⚙ **Agent note:** Integrate this with the existing morale system. If the existing
code already applies a morale change (from events, wages, etc.), the provision
morale change is ADDITIONAL — but the rule is max −1 per day total from the
provision/wages crisis. Do not let it stack with other morale deltas from the
same day unless they come from distinct systems (events are separate).

### 4.6 — Add `A.CONFIRM_TRADE` action

New action dispatched when the player confirms the market screen trade.

```js
A.CONFIRM_TRADE = "CONFIRM_TRADE";
```

In the reducer:
```js
case A.CONFIRM_TRADE: {
  const { buys, sells } = action;  // buys: {food: 10, rum: 5}, sells: {sugar: 3}
  if (!state.portMarket) return state;

  const items = { ...state.hold.items };
  let goldDelta = 0;
  let infamyDelta = 0;
  const logLines = [];

  // Process sells first (frees up hold space)
  Object.entries(sells || {}).forEach(([good, qty]) => {
    if (qty <= 0) return;
    const portGood = state.portMarket.goods[good];
    if (!portGood) return;
    const actualQty = Math.min(qty, items[good] || 0);
    if (actualQty <= 0) return;
    const revenue = actualQty * portGood.sellToPort;
    items[good] = (items[good] || 0) - actualQty;
    goldDelta += revenue;
    logLines.push(`Sold ${actualQty} ${window.D.RESOURCES[good]?.unit || good} of ${window.D.RESOURCES[good]?.name || good} for ${revenue}g.`);
  });

  // Compute hold space after sells
  const usedAfterSells = L.getHoldUsed(items);

  // Process buys
  Object.entries(buys || {}).forEach(([good, qty]) => {
    if (qty <= 0) return;
    const portGood = state.portMarket.goods[good];
    if (!portGood) return;
    const cost = qty * portGood.buyFromPort;
    // Validate: gold, hold space, available stock
    const spaceRemaining = state.hold.capacity - usedAfterSells - L.getHoldUsed(
      Object.fromEntries(Object.entries(buys).filter(([g]) => g !== good))
    );
    if (qty > portGood.available) { logLines.push(`Not enough ${good} available at this port.`); return; }
    if (goldDelta + state.gold < cost) { logLines.push(`Not enough gold to buy ${good}.`); return; }
    if (qty > spaceRemaining) { logLines.push(`Not enough hold space for ${good}.`); return; }
    items[good] = (items[good] || 0) + qty;
    goldDelta -= cost;
    // Infamy for contraband
    const res = window.D.RESOURCES[good];
    if (res?.infamyOnBuy) {
      infamyDelta += res.infamyOnBuy;
      logLines.push(`Purchasing ${res.name} darkens your reputation.`);
    }
    logLines.push(`Bought ${qty} ${res?.unit || good} of ${res?.name || good} for ${Math.abs(goldDelta)}g.`);
  });

  const newGold = state.gold + goldDelta;
  if (newGold < 0) {
    return { ...state, log: [...state.log, "Trade cancelled — insufficient gold."] };
  }

  return {
    ...state,
    gold: newGold,
    hold: { ...state.hold, items },
    infamy: Math.min(999, (state.infamy ?? 0) + infamyDelta),
    log: [...state.log, ...logLines],
  };
}
```

⚙ **Agent note:** The gold validation above has a subtlety — sells happen
first and generate gold, which can then fund buys. The reducer should process
in two passes: (1) validate and apply all sells, (2) validate and apply all
buys. The implementation sketch above is correct in approach but the "remaining
space" calculation inside the buys loop needs to account for all other pending
buys. A cleaner approach: accumulate pending buys in a local object, validate
the batch holistically before committing, then commit. Use whichever is clearest.

### 4.7 — Update `DISMISS_BATTLE` (defeat path)

When the player is defeated (`battleState.phase === "defeat"`), clear all hold
items:
```js
// In defeat branch of DISMISS_BATTLE:
hold: { ...state.hold, items: Object.fromEntries(Object.keys(state.hold.items).map(k => [k, 0])) },
log: [...log, "All cargo lost."],
```

### 4.8 — Implement `loseCargoPercent` and `loseContraband` in `INTERCEPT_SURRENDER`

Currently these fields in `SURRENDER_CONSEQUENCE` are read but not applied.
In the `INTERCEPT_SURRENDER` case:

```js
const consequence = D.SURRENDER_CONSEQUENCE[encounterType] || {};
let newHoldItems = state.hold?.items || {};

if (consequence.loseCargoPercent) {
  newHoldItems = L.applyLoseCargoPercent(newHoldItems, consequence.loseCargoPercent);
  newLog.push(`${consequence.loseCargoPercent}% of your cargo was seized.`);
}
if (consequence.loseContraband) {
  newHoldItems = L.applyLoseContraband(newHoldItems);
  newLog.push("Your contraband was confiscated.");
}

// Include in returned state:
hold: { ...state.hold, items: newHoldItems },
```

### 4.9 — Handle `loseCargoPercent` in `RESOLVE_EVENT`

Some random event outcomes may include cargo loss in future. For now, add the
handler so it's ready:
```js
// In RESOLVE_EVENT, in the outcome processing section:
if (choice.outcome.loseCargoPercent) {
  newHoldItems = L.applyLoseCargoPercent(newHoldItems, choice.outcome.loseCargoPercent);
  newLog.push(`${choice.outcome.loseCargoPercent}% of your cargo was lost.`);
}
```
Wire `newHoldItems` into the returned hold state.

### 4.10 — Add `A.ENTER_MARKET` and `A.LEAVE_MARKET` screen actions

```js
case A.ENTER_MARKET:
  return { ...state, screen: "market" };

case A.LEAVE_MARKET:
  return { ...state, screen: "port" };
```

These are trivial screen transitions. No data transformation needed.

---

## Part 5 — screens.jsx: Market Screen and UI Updates

### 5.1 — New `MarketScreen` component

This is the largest new UI component. Structure:

```
MarketScreen
├── ScreenHeader ("⚓ Market — {portName}", onBack → LEAVE_MARKET)
├── HoldBar (used/capacity, visual fill bar)
├── SpeedPenaltyNote (shown when hold > 50%)
├── GoodsList
│   ├── [food row]   — always shown first
│   ├── [water row]  — always shown second
│   ├── Divider
│   └── [trade goods] — only goods portMarket has rolled (+ goods player holds)
└── TradeFooter
    ├── PendingGoldDelta (+ or -)
    ├── ConfirmTrade button (disabled if no pending changes)
    └── ResetPending button
```

**Local state in MarketScreen:**
```js
const [pending, setPending] = React.useState({});
// pending: { good: { buy: qty, sell: qty } }
// Positive buy means buying from port, positive sell means selling to port.
// Net: if buy=3 sell=1, net holding 2 more of this good.
```

**Per-good row layout:**
```
[Name] [Contraband badge?]  [Base: Xg]  [Buy: Xg ↑]  [Sell: Xg ↓]  [Available: X]  [In Hold: X]
[         ← Sell: -  0  + →]            [← Buy: -  0  + →]
```

Sell buttons: limited to `min(inHold, available space in pending)`.
Buy buttons: limited to `min(portAvailable, holdSpace)`.
When pending buy/sell > 0, row highlights.

**Illegal goods display:**
If `RESOURCES[good].illegal === true`, show `"(Illegal)"` in T.red next to name.

**Speed penalty note:**
```jsx
const loadPct = L.getHoldLoadPct(previewItems, state.hold.capacity);
const mult = L.getHoldSpeedMultiplier(loadPct);
{mult > 1.0 && (
  <div style={{ color: T.gold }}>
    ⚠ Hold over 50% — voyages take {Math.round((mult - 1) * 100)}% longer.
  </div>
)}
```
Where `previewItems` = current hold items merged with pending changes. Update
this live as the player adjusts pending quantities.

**Goods to display:**
Show food and water always (port always stocks them). For trade goods: show a
good if `portMarket.goods[good]` exists (port stocks it) OR `state.hold.items[good] > 0`
(player has it to sell). Goods the port doesn't stock but player doesn't have:
not shown (no noise).

**Confirm trade button:**
Dispatches `{ type: E.A.CONFIRM_TRADE, buys, sells }` where buys and sells are
derived from `pending` (separate positive buy and positive sell quantities).
After dispatching, reset `pending` to `{}`.

### 5.2 — Update `PortScreen`

Add a "Market" button in the port services section. Beside the existing buttons
(Shipyard, Crew, etc.):
```jsx
<Btn onClick={() => dispatch({ type: E.A.ENTER_MARKET })}>
  ⚓ Market
</Btn>
```

This button should be available regardless of rep perk (markets are always
accessible — even At War ports let you buy food and water in the base game,
per the "food and water always available" safeguard from the design decisions).

⚙ **Agent to decide:** should the market button be disabled/hidden At War?
The design decision says food and water are always available but the port is
hostile. Recommendation: show market but with extremely limited inventory — no
trade goods, just food and water at a premium. This is not mechanically
implemented in the market generator (which only blocks based on `getRepPerk`
through mission board), so for now: market is always accessible. At War affects
the mission board, crew hire, and shipyard, not the market. Confirm this
interpretation.

### 5.3 — Update `SailingScreen`

Add a provisions panel showing:
```
PROVISIONS
🍖 Food:  {food} units  ({foodDays} days remaining at current crew)
💧 Water: {water} units ({waterDays} days remaining)
👥 Crew consumes {rate} food + {rate} water per day
```

This is where the player sees their consumption rate (P21 decision: sailing
screen is the right place). Use `L.getProvisionConsumptionPerDay(state)` and
`L.getDaysOfProvisions(state.hold.items, consumption)`.

Show the panel in T.red if either resource has < 3 days remaining.
Show in T.gold if between 3–6 days remaining.

### 5.4 — Update `MapScreen`

When showing travel time to each port, include the cargo penalty:
The existing code calls `L.travelDays(state, portKey)` — this now returns the
penalised value automatically (Part 2.6). No additional UI change needed, the
number shown is already correct.

Optionally: if the multiplier is > 1.0, add a small `"(heavy load)"` note
next to the travel time. Simple implementation:
```js
const mult = L.getHoldSpeedMultiplier(L.getHoldLoadPct(state.hold?.items, state.hold?.capacity));
const label = mult > 1.0 ? ` ★` : "";
// Render: "4 days★" → tooltip or inline note "(heavy load)"
```

### 5.5 — Update `App.jsx` HUD

Add food and water to the HUD alongside crew and hull:
```jsx
<span style={{ color: T.textDim, marginLeft: 10 }}>
  🍖 {state.hold?.items?.food ?? 0}
</span>
<span style={{ color: T.textDim, marginLeft: 10 }}>
  💧 {state.hold?.items?.water ?? 0}
</span>
```

Show in T.red if either is ≤ 0. Show in T.gold if either is ≤ (3 × daily rate).
The HUD shows raw quantities, not days — keep it compact.

---

## Part 6 — Router Updates (App.jsx)

Add `market` to the screen router:
```jsx
case "market": return <S.MarketScreen state={state} dispatch={dispatch} />;
```

Ensure `MarketScreen` is exported from `window.S`.

---

## Part 7 — Tests

### Unit tests (tests_logic.js)

- [ ] `getHoldUsed({ food:10, rum:5, water:0 })` returns 15.
- [ ] `getHoldUsed({})` returns 0.
- [ ] `getHoldLoadPct({ rum:100 }, 200)` returns 0.5.
- [ ] `getHoldSpeedMultiplier(0.4)` returns 1.00.
- [ ] `getHoldSpeedMultiplier(0.6)` returns 1.11.
- [ ] `getHoldSpeedMultiplier(0.8)` returns 1.33.
- [ ] `getProvisionConsumptionPerDay` with 30 crew returns `{ food:3, water:3 }`.
- [ ] `getProvisionConsumptionPerDay` with 0 crew returns `{ food:0, water:0 }`.
- [ ] `getDaysOfProvisions({ food:9, water:15 }, { food:3, water:3 })` returns `{ food:3, water:5 }`.
- [ ] `getDaysOfProvisions({ food:0, water:10 }, { food:3, water:3 })` returns `{ food:0, water:3 }`.
- [ ] `applyLoseCargoPercent({ rum:10, food:20, water:15 }, 50)` returns `{ rum:5, food:10, water:7 }`.
- [ ] `applyLoseContraband({ rum:10, tobacco:5, slaves:2, food:20 })` returns `{ rum:10, tobacco:0, slaves:0, food:20 }`.
- [ ] `travelDays` returns a higher value when hold is 80% full vs. 0% full (integration check).

### Generator tests (tests_logic.js, G suite)

- [ ] `G.generatePortMarket("portRoyal")` returns object with `goods.food` and `goods.water`.
- [ ] `G.generatePortMarket("portRoyal")` food has `buyFromPort === 5` and `sellToPort === 5` (fixed price).
- [ ] `G.generatePortMarket("tortuga")` includes `goods.rum` (always available).
- [ ] `G.generatePortMarket("portRoyal")` rum `buyFromPort` is within 0.8–1.2 × 30 range (20% variance × 1.1 markup).
- [ ] `G.generatePortMarket("cartagena")` does NOT include `goods.tobacco` (`never` tier).
- [ ] All rolled buy prices are >= sell prices for the same good (no negative spread).
- [ ] Food available quantity is 999 at any port where tier is `"always"`.
- [ ] `G.generatePortMarket("nassau")` rum quantity is between 20 and 40 (frequently tier).

### Reducer tests (tests_engine.js)

- [ ] `CONFIRM_TRADE` buying 5 rum at 33g each deducts 165g and adds 5 to hold.
- [ ] `CONFIRM_TRADE` selling 10 food at 5g each adds 50g and removes 10 from hold.
- [ ] `CONFIRM_TRADE` buying more than available at port is rejected with log entry.
- [ ] `CONFIRM_TRADE` buying more than hold capacity allows is rejected with log entry.
- [ ] `CONFIRM_TRADE` buying slaves adds +1 infamy.
- [ ] `ADVANCE_DAY` with 30 crew deducts 3 food and 3 water from hold.
- [ ] `ADVANCE_DAY` with food=0 applies morale penalty of −1.
- [ ] `ADVANCE_DAY` with food=0 and water=0 applies morale penalty of only −1 (no stacking).
- [ ] `ADVANCE_DAY` logs "food stores are empty" when food crosses zero.
- [ ] `ADVANCE_DAY` does NOT apply provision penalty when food > 0 and water > 0 and gold sufficient.
- [ ] `BUY_SHIP` updates `hold.capacity` to the new ship's holdCapacity.
- [ ] `DISMISS_BATTLE` on defeat clears all hold items.
- [ ] `INTERCEPT_SURRENDER` with `loseCargoPercent: 30` reduces all hold items by 30%.
- [ ] `INTERCEPT_SURRENDER` with `loseContraband: true` removes tobacco and slaves, leaves rum.
- [ ] `START_GAME` produces state with `hold.capacity === D.SHIPS[startShip.type].holdCapacity`.

### UI smoke tests (tests_ui.js)

- [ ] `MarketScreen` renders without crash with a state that has `portMarket: null` (graceful empty state).
- [ ] `MarketScreen` shows "Food" and "Water" rows.
- [ ] `MarketScreen` shows "(Illegal)" text when `portMarket` includes tobacco.
- [ ] `MarketScreen` shows hold bar (used/capacity).
- [ ] `SailingScreen` shows "Food" and "Water" quantities.
- [ ] `SailingScreen` shows daily consumption rate.
- [ ] HUD shows 🍖 and 💧 when not on start screen.
- [ ] HUD shows food in red when food = 0.

---

## Part 8 — architecture.md Updates

- [ ] **State shape:** add `state.hold` (`{ capacity, items: { food, water, rum, ... } }`).
- [ ] **State shape:** add `state.portMarket` (`{ portKey, goods: { [good]: { basePrice, buyFromPort, sellToPort, available } } }`).
- [ ] **State shape:** note that `hold.capacity` changes on `BUY_SHIP`.
- [ ] **Data:** document `RESOURCES` constant structure and all 11 goods.
- [ ] **Data:** document `GOODS_AVAILABILITY` table format (column order).
- [ ] **Data:** document `maxDays` and `holdCapacity` fields on SHIPS.
- [ ] **logic.js exports:** add all new functions from Part 2.
- [ ] **generators.js exports:** add `generatePortMarket`.
- [ ] **Actions:** add `CONFIRM_TRADE`, `ENTER_MARKET`, `LEAVE_MARKET`.
- [ ] **Actions:** update `ADVANCE_DAY` to note provision consumption.
- [ ] **Actions:** update `DISMISS_BATTLE` to note cargo loss on defeat.
- [ ] **Actions:** update `INTERCEPT_SURRENDER` to note `loseCargoPercent` / `loseContraband` now implemented.
- [ ] **Screens:** add `MarketScreen` to the screen inventory table.
- [ ] **Note:** `travelDays` now includes cargo penalty multiplier. Future geographic progression feature will use `SHIPS[type].maxDays` for range blocking.

---

## Reference Tables

### Hold Capacity by Ship (confirmed — do not modify)

| Ship | maxCrew | maxDays | Daily rate (max crew) | Max provisions | Hold capacity |
|------|---------|---------|----------------------|----------------|--------------|
| Dinghy | 5 | 5 | 1+1 = 2/day | 10 | 20 |
| Sloop | 50 | 10 | 5+5 = 10/day | 100 | 200 |
| Brigantine | 80 | 14 | 8+8 = 16/day | 224 | 448 |
| Merchantman | 60 | 14 | 6+6 = 12/day | 168 | 336 |
| Frigate | 100 | 18 | 10+10 = 20/day | 360 | 720 |
| Galleon | 150 | 22 | 15+15 = 30/day | 660 | 1320 |

*Daily rate = `Math.ceil(maxCrew / 10)` for food + same for water.*
*Max provisions = daily rate × maxDays for food + water combined.*
*Hold capacity = 2 × max provisions (half hold reserved for trade goods).*

### Speed Penalty (confirmed — do not modify)

| Load | Multiplier | Travel time effect |
|------|-----------|-------------------|
| < 50% | ×1.00 | No change |
| 50–75% | ×1.11 | ~+11% travel days |
| 75–100% | ×1.33 | ~+33% travel days |

### Resource Base Prices (confirmed — do not modify)

| Good | Base price | Variance | Illegal | Infamy on buy |
|------|-----------|----------|---------|--------------|
| Food | 5g | 0% | No | 0 |
| Water | 3g | 0% | No | 0 |
| Rum | 30g | 20% | No | 0 |
| Sugar | 40g | 20% | No | 0 |
| Timber | 25g | 20% | No | 0 |
| Cloth | 55g | 20% | No | 0 |
| Spices | 80g | 20% | No | 0 |
| Silk | 110g | 20% | No | 0 |
| Weapons | 65g | 20% | No | 0 |
| Tobacco | 150g | 20% | Yes | 0 |
| Slaves | 200g | 20% | Yes | 1 |

*Buy from port = rolled price × 1.10. Sell to port = rolled price × 0.90.*
*Food and water: buy price = sell price = base price (no spread, no variance).*
