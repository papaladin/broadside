# Economy Revamp — Implementation Task List
## B8.1: Price structure, port identity, Good Deals tagging, map trade profile

Covers five files: `data.js`, `generators.js`, `logic.js`, `screens_market.jsx`,
`screens_voyage.jsx`. Tasks are ordered by dependency — complete in sequence.

---

## Context: what changes and why

**Before**: all 25 ports generate prices by rolling `basePrice ± (basePrice × variance)`
independently on every visit. No geographic identity. Spices at Curacao cost the same
expected price as spices at Bermuda. Players cannot plan routes because nothing is
learnable.

**After**: prices are anchored to two structural factors:
1. **Availability tier** — how readily a port stocks a good (e.g. always = they produce
   it = cheap; never = they import it = expensive).
2. **Faction production modifier** — each faction has historically-grounded cheap goods
   (English = sugar/cloth, Spanish = silver/cocoa, French = rum/coffee, Dutch =
   spices/silk/timber/weapons, Pirate = rum/tobacco).

Variance is reduced from 15-60% to ±5% so prices are stable enough to plan around.
A static "trade profile" (Good Deals / In Demand) is pre-computed per port from these
two factors and shown in the market UI separator and the map tooltip.

---

## Task 1 — data.js: Add AVAILABILITY_PRICE_MODIFIERS constant

**Where**: after `const GOODS_AVAILABILITY = { ... };`, before the mission config block.

**Add**:
```js
// Price multiplier applied to basePrice based on how readily a port stocks a good.
// "always"  → port produces this good locally → cheap
// "never"   → port must import it at great cost → expensive
const AVAILABILITY_PRICE_MODIFIERS = {
  always:     0.72,   // −28% vs neutral
  frequently: 0.88,   // −12%
  sometimes:  1.00,   // neutral
  rarely:     1.20,   // +20%
  never:      1.40,   // +40%
};
```

**Expose**: add `AVAILABILITY_PRICE_MODIFIERS` to the `Object.assign(window.D, { ... })`
block at the bottom of data.js.

---

## Task 2 — data.js: Add FACTION_PRICE_MODIFIERS constant

**Where**: immediately after AVAILABILITY_PRICE_MODIFIERS.

**Add**:
```js
// Additional production discount applied when a port belongs to a faction that
// historically produced or traded a specific good. Stacks multiplicatively with
// the availability tier multiplier.
// Dutch gets 4 goods (historically the dominant trading faction of this era).
// This affects port prices only — there is no link between PLAYER faction and prices.
const FACTION_PRICE_MODIFIERS = {
  english: { sugar: 0.90,  cloth:   0.90 },
  spanish: { silver: 0.90, cocoa:   0.90 },
  french:  { rum: 0.90,    coffee:  0.90 },
  dutch:   { spices: 0.85, silk:    0.90, timber: 0.90, weapons: 0.90 },
  pirate:  { rum: 0.90,    tobacco: 0.90 },
};
```

**Expose**: add `FACTION_PRICE_MODIFIERS` to `Object.assign(window.D, { ... })`.

---

## Task 3 — data.js: Reduce variance to 0.05 on all trade goods

**Where**: in the `RESOURCES` constant.

**Change the `variance` field** for every trade good. Keep `food` and `water` at `0`
(provisions are fixed price). The ±5% remaining variance is enough to produce slightly
different prices on each visit while keeping prices stable and learnable.

| Good    | Old variance | New variance |
|---------|-------------|-------------|
| rum     | 0.20        | **0.05**    |
| sugar   | 0.25        | **0.05**    |
| timber  | 0.15        | **0.05**    |
| cloth   | 0.20        | **0.05**    |
| spices  | 0.45        | **0.05**    |
| silk    | 0.30        | **0.05**    |
| coffee  | 0.25        | **0.05**    |
| cocoa   | 0.30        | **0.05**    |
| weapons | 0.35        | **0.05**    |
| tobacco | 0.30        | **0.05**    |
| silver  | 0.35        | **0.05**    |
| slaves  | 0.60        | **0.05**    |
| food    | 0           | 0 (no change) |
| water   | 0           | 0 (no change) |

---

## Task 4 — generators.js: Update generatePortMarket price formula

**Where**: inside `generatePortMarket`, in the `colOrder.forEach` callback (currently
around lines 364–398). The change is to the price calculation block only — the
availability roll, quantity ranges, scale factor, and tutorial force-stock remain
unchanged.

**Current code** (lines ~368–377):
```js
const isFixed = res.variance === 0;
const variance = res.basePrice * res.variance;
const marketPrice = isFixed
  ? res.basePrice
  : Math.round(res.basePrice + randBetween(-variance, variance));

const buyFromPort = isFixed ? res.basePrice : Math.round(marketPrice * 1.10);
const sellToPort  = isFixed ? res.basePrice : Math.round(marketPrice * 0.90);

// ── Roll availability separately ─────────────────────────────
const tier = availability[idx] || "never";
```

**Problem**: `tier` is computed AFTER the price block, but the new price formula needs
`tier` to look up the availability multiplier. The fix is to hoist the `tier` variable
above the price block.

**Replace the entire block** (from `const isFixed` to `goods[good] = { ... }`) with:

```js
// Hoist tier so price formula can use the availability multiplier
const tier        = availability[idx] || "never";
const isFixed     = res.variance === 0;

// ── Structural price: basePrice × availabilityMult × factionMod × (1 ± 5%) ──
const port        = window.D.PORTS[portKey];
const availMult   = window.D.AVAILABILITY_PRICE_MODIFIERS[tier]  ?? 1.00;
const factionMods = window.D.FACTION_PRICE_MODIFIERS[port?.faction] ?? {};
const factionMod  = factionMods[good] ?? 1.00;

const marketPrice = isFixed
  ? res.basePrice
  : Math.round(res.basePrice * availMult * factionMod * (1 + res.variance * (Math.random() * 2 - 1)));

const buyFromPort = isFixed ? res.basePrice : Math.round(marketPrice * 1.10);
const sellToPort  = isFixed ? res.basePrice : Math.round(marketPrice * 0.90);

// ── Availability roll (unchanged) ────────────────────────────────────────────
const chance = tierChance[tier] ?? 0;
let available = 0;
if (chance > 0 && Math.random() <= chance) {
  if (good === "food" || good === "water") {
    available = 999;
  } else {
    const range = tierQtyRanges[tier];
    available = range ? randInt(range.min * scale, range.max * scale) : 0;
  }
}

goods[good] = { basePrice: res.basePrice, buyFromPort, sellToPort, available };
```

**Important**: remove the now-redundant `const tier = availability[idx] || "never";`
line that previously appeared after the price block (it was at line ~380). It's now
at the top.

**Verify after change**: food and water prices are unaffected (isFixed = true → price
= basePrice, not multiplied). Only trade goods get structural multipliers.

---

## Task 5 — generators.js: Recalibrate isExtremePrice thresholds

**Where**: the `isExtremePrice` function (~lines 52–63).

**Why**: the old logic computes `pct` as position within the `[min, max]` range derived
from the old high-variance values. With ±5% variance and structural multipliers, "always"
goods will always appear at the LOW end of the old range and trigger false positives.
The new logic compares against the neutral `buyFromPort` (no multipliers) instead.

**Replace**:
```js
const isExtremePrice = (good, buyPrice) => {
  const res = window.D.RESOURCES[good];
  if (!res || res.variance === 0) return null;
  const min = res.basePrice * (1 - res.variance);
  const max = res.basePrice * (1 + res.variance);
  const range = max - min;
  if (range <= 0) return null;
  const pct = (buyPrice - min) / range;
  if (pct <= 0.20) return { type: "surplus",  deviation: 0.20 - pct };
  if (pct >= 0.80) return { type: "shortage", deviation: pct - 0.80 };
  return null;
};
```

**With**:
```js
const isExtremePrice = (good, buyPrice) => {
  const res = window.D.RESOURCES[good];
  if (!res || res.variance === 0) return null;
  // Neutral buyFromPort = basePrice × 1.10 (no availability or faction modifier)
  const neutral = res.basePrice * 1.10;
  const ratio   = buyPrice / neutral;
  // Flag goods that are structurally cheap (≤−18%) or expensive (≥+18%).
  // This corresponds to: "always" tier (0.72×) = ratio ~0.72–0.79 → surplus
  //                       "rarely" tier (1.20×) = ratio ~1.20–1.26 → shortage
  //                       "sometimes" (1.00×)   = ratio ~0.99–1.01 → not flagged
  if (ratio <= 0.82) return { type: "surplus",  deviation: 0.82 - ratio };
  if (ratio >= 1.18) return { type: "shortage", deviation: ratio - 1.18 };
  return null;
};
```

---

## Task 6 — logic.js: Add getPortTradeProfile helper

**Where**: add near the end of logic.js, before the large `Object.assign(window.L, {...})`
export block.

**Purpose**: computes the static Good Deals and In Demand lists for a port. Called by
the market UI and the map tooltip. Returns arrays of good keys.

```js
// Returns the static trade profile of a port — which goods are structurally cheap
// (Good Deals) and which are structurally scarce (In Demand / good to sell here).
// This is derived purely from GOODS_AVAILABILITY + FACTION_PRICE_MODIFIERS and
// does NOT change between visits unless the underlying data changes.
const getPortTradeProfile = (portKey) => {
  const port  = window.D.PORTS[portKey];
  const avail = window.D.GOODS_AVAILABILITY[portKey];
  if (!port || !avail) return { goodDeals: [], inDemand: [] };

  // Must match the column order in GOODS_AVAILABILITY rows (same as generators.js)
  const colOrder = [
    "food","water","rum","sugar","timber","cloth","spices","silk",
    "coffee","cocoa","weapons","tobacco","silver","slaves"
  ];

  const factionMods = window.D.FACTION_PRICE_MODIFIERS[port.faction] ?? {};
  const illegalGoods = new Set(
    Object.entries(window.D.RESOURCES)
      .filter(([, r]) => r.illegal)
      .map(([k]) => k)
  );
  const provisionGoods = new Set(["food", "water"]);

  const goodDeals = [];
  const inDemand  = [];

  colOrder.forEach((good, idx) => {
    const tier = avail[idx] || "never";

    // Good Deal: always available at this port OR port faction has a production modifier.
    // "always" catches provisions (food/water) and high-production goods.
    // Faction modifier catches goods the port's faction specialises in, regardless
    // of their availability tier (e.g. sugar is "sometimes" at Kingston but English
    // ports still have a production advantage → tagged as Good Deal).
    if (tier === "always" || (good in factionMods)) {
      goodDeals.push(good);
    }

    // In Demand: rarely or never stocked → high structural price → good to sell here.
    // Exclude provisions (always available everywhere, not relevant) and illegal goods
    // (players can't openly sell contraband, confusing to show).
    if (
      (tier === "rarely" || tier === "never") &&
      !provisionGoods.has(good) &&
      !illegalGoods.has(good)
    ) {
      // Sort "never" before "rarely" (higher price = more valuable sell opportunity)
      inDemand.push({ good, tier });
    }
  });

  // Sort In Demand: "never" tier first (1.40× multiplier > 1.20× for "rarely")
  inDemand.sort((a, b) => {
    if (a.tier === "never" && b.tier === "rarely") return -1;
    if (a.tier === "rarely" && b.tier === "never") return 1;
    return 0;
  });

  return {
    goodDeals,
    inDemand: inDemand.map(x => x.good),
  };
};
```

**Export**: add `getPortTradeProfile` to the `Object.assign(window.L, { ... })` block.

---

## Task 7 — screens_market.jsx: Add "Good Deals" separator in PORT MARKET column

**Where**: in the PORT MARKET goods list render, inside `MarketScreen`.

**What**: split the list of available market goods into two visual sections using the
static trade profile. The separator replaces the current single flat list.

**Implementation steps**:

1. At the top of the `MarketScreen` component (or in the render scope), compute:
   ```js
   const tradeProfile = L.getPortTradeProfile(state.currentPort);
   const goodDealKeys = new Set(tradeProfile.goodDeals);
   ```

2. When building the market goods list, split into two arrays:
   ```js
   const marketGoods = Object.entries(portMarket.goods);
   const dealGoods   = marketGoods.filter(([k]) => goodDealKeys.has(k));
   const otherGoods  = marketGoods.filter(([k]) => !goodDealKeys.has(k));
   ```

3. Render the two sections separated by a label + divider:
   ```jsx
   {/* Good Deals section */}
   <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
                 color: T.gold, marginBottom: 4 }}>
     Local produce &amp; Good Deals
   </div>
   {dealGoods.map(([good, data]) => renderMarketRow(good, data))}

   {/* Separator — only if there are other goods to show */}
   {otherGoods.some(([, d]) => d.available > 0) && (
     <Divider style={{ margin: "8px 0 6px" }} />
   )}

   {/* Other available goods */}
   {otherGoods.filter(([, d]) => d.available > 0).map(([good, data]) =>
     renderMarketRow(good, data))}

   {/* Out of stock goods (last, collapsed/dim) */}
   {otherGoods.filter(([, d]) => d.available === 0).map(([good, data]) =>
     renderMarketRow(good, data))}
   ```

4. The "out of stock" rows in Good Deals (food/water can be 0 if port generation
   failed, unlikely but possible) should still appear in the Good Deals section with
   available=0 styling.

5. No visual changes to the row itself — same `-/0/+/x20` controls, same price display.
   The separator is purely positional grouping.

**Expected result per port**:
- English ports: Good Deals = food, water, sugar, cloth (4 items)
- Spanish ports: Good Deals = food, water, cocoa, silver (4 items)
  - Havana adds tobacco (always stocked) → 5 items
- French ports: Good Deals = food, water, rum, coffee (4 items)
  - Martinique adds sugar (always stocked) → 5 items
- Dutch ports: Good Deals = food, water, spices, silk, timber, weapons (6 items)
- Pirate ports: Good Deals = food, water, rum, tobacco (4 items)

---

## Task 8 — screens_market.jsx: "In Demand" indicator in YOUR HOLD column

**Where**: in the YOUR HOLD section, for each good the player currently holds.

**What**: when the current port has high structural demand for a good the player is
carrying, show a small "▲ In demand" hint next to the sell price. Tells the player
this is an actively good time to sell — without forcing them.

**Implementation**:

1. Reuse `tradeProfile` from Task 7 (compute once for the component).
   ```js
   const inDemandSet = new Set(tradeProfile.inDemand);
   ```

2. In the hold row render, add after the sell price:
   ```jsx
   {inDemandSet.has(good) && (
     <span style={{ fontSize: 10, color: T.gold, marginLeft: 4 }}>
       ▲ in demand
     </span>
   )}
   ```

3. Only show if the player actually has quantity > 0 of that good (don't show for empty
   hold slots).

---

## Task 9 — screens_voyage.jsx: Add trade profile to port hover tooltip in MapScreen

**Where**: in `MapScreen`, in the port hover tooltip render (the `hov` state that shows
on port mouseover/touchstart).

**What**: add two lines below the existing port info (reputation/days):
- Good Deals (in gold): goods worth buying at this port
- In Demand (in amber): goods worth selling here

**Implementation**:

1. When building the tooltip for a hovered port, call:
   ```js
   const profile = L.getPortTradeProfile(portKey);
   ```

2. Filter Good Deals to exclude food and water for the tooltip (they're everywhere and
   not useful travel intelligence):
   ```js
   const tooltipDeals = profile.goodDeals.filter(g => g !== "food" && g !== "water");
   const tooltipDemand = profile.inDemand.slice(0, 4); // cap at 4 for space
   ```

3. Only show for ports in `state.discoveredPorts`. Hidden/undiscovered ports: no trade
   profile displayed (they don't know it exists yet).

4. Add to the tooltip JSX below the reputation line:
   ```jsx
   {tooltipDeals.length > 0 && (
     <div style={{ marginTop: 4, fontSize: 10 }}>
       <span style={{ color: T.gold }}>✦ </span>
       <span style={{ color: T.textDim }}>
         {tooltipDeals.map(g => D.RESOURCES[g]?.name).join(" · ")}
       </span>
     </div>
   )}
   {tooltipDemand.length > 0 && (
     <div style={{ fontSize: 10 }}>
       <span style={{ color: T.amber ?? T.gold }}>⟶ </span>
       <span style={{ color: T.textDim }}>
         {tooltipDemand.map(g => D.RESOURCES[g]?.name).join(" · ")}
       </span>
     </div>
   )}
   ```

5. The two lines use `T.gold` and `T.amber` (or `T.goldDim` if amber doesn't exist in
   your theme) to distinguish "buy here" from "sell here" without adding icons or labels.

**Expected tooltip appearance for Port Royal (English)**:
```
Port Royal · English
Friendly (65) · 4 days

✦ Sugar · Cloth
⟶ Silk · Silver · Cocoa
```

**Expected for Curacao (Dutch)**:
```
Curaçao · Dutch
Neutral (50) · 3 days

✦ Spices · Silk · Timber · Weapons
⟶ (nothing — Dutch ports need almost everything, but major goods are stocked)
```

---

## Verification checklist

Run these spot-checks after all tasks are complete:

| Test | Expected result |
|---|---|
| Kingston sugar price | ≈ 39–40g buyFromPort (40 × 1.00 × 0.90 × 1.10 = 39.6g) |
| Bridgetown sugar price | ≈ 28–29g (40 × 0.72 × 0.90 × 1.10 = 28.5g) — doubly advantaged |
| Tortuga rum price | ≈ 21–22g (30 × 0.72 × 0.90 × 1.10 = 21.4g) |
| Bermuda spices price | ≈ 155–165g (120 × 1.20 × 1.00 × 1.10 = 158.4g) — scarce |
| Curacao spices price | ≈ 99–105g (120 × 0.88 × 0.85 × 1.10 = 98.8g) — double discount |
| Food price anywhere | = 3g (fixed, unaffected by multipliers) |
| Water price anywhere | = 2g (fixed, unaffected by multipliers) |
| isExtremePrice(sugar, 28.5g) | → { type: "surplus" } (28.5/44 = 0.65 ≤ 0.82) |
| isExtremePrice(spices, 158g) | → { type: "shortage" } (158/132 = 1.20 ≥ 1.18) |
| isExtremePrice(cloth, 50g) | → null (50/60.5 = 0.83, inside band) |
| Market at Port Royal | Good Deals section shows: food, water, sugar, cloth |
| Market at Curacao | Good Deals section shows: food, water, spices, silk, timber, weapons |
| Map tooltip for Port Royal | Shows "Sugar · Cloth" as deals, "Silk · Silver · Cocoa" as in demand |
| Map tooltip for Nassau | Shows "Rum · Tobacco" as deals, up to 4 in-demand goods |
| Map tooltip for undiscovered port | No trade profile shown |

---

## Out of scope (separate tasks)

These related improvements are NOT part of this task set and should be tracked separately:

- **Mission requiredQty mismatch**: at tier 4+, trade missions ask for more units than
  any single port stocks. The price fix does not address this — quantity scaling is a
  separate calibration pass.
- **Gossip template wording**: some templates say "a convoy flooded the market" implying
  a temporary condition. With structural prices, these should eventually say "this port
  is known for its cheap sugar" to match the permanent nature. Not urgent — the gossip
  still triggers correctly, just with slightly misleading framing.
- **Mission requiredQty using structural price**: `requiredQty` is calculated from
  `res.basePrice`, not the structural port price. At production ports, missions become
  more profitable to source (you buy at 28g, mission was calibrated for 40g). This is
  an emergent positive incentive — intentional — but worth monitoring in Wave 2.