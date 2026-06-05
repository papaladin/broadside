# T5.1 — Equipment Slot System — Detailed Task List

> Replaces the current flat `upgrades[]` array with a typed slot-based equipment system.
> All design decisions locked. Ready for implementation.
> Last updated: June 5, 2026.

---

## 1. Goal

Turn ship upgrades into actual equipment choices:

- Ships have typed slots: **Hull**, **Armament**, **Rigging**, **Special**.
- Equipment can be bought, installed, removed, stored in an equipment inventory, and reused on future ships if removable.
- Some equipment is **structural** and cannot be removed.
- Equipment is not universally better: each item supports a playstyle and usually has a downside.
- The Shipyard becomes the place where the player compares ships, manages equipment, previews stat changes, and chooses a build identity.

---

## 2. Locked Design Decisions

| Decision | Choice |
|---|---|
| Slot types | 4: Hull, Armament, Rigging, Special |
| Slot assignment | Fixed typed slots per ship |
| Equipment count | 17 items |
| Purchase gating | Fame requirement |
| Installation gating | Minimum base hull requirement (`requiredHull <= ship.maxHull`) |
| Size/weight system | No separate weight system |
| Named exclusions | No named ship exclusions |
| Stacking | Same equipment cannot be installed twice on the same ship |
| Effects | Additive; percent effects apply to base ship stats |
| Equipment inventory | Separate from cargo hold |
| Ship change | Removable equipment must be unmounted before selling or it is lost; structural equipment is always lost |
| Swapping | Only at shipyard, with an install/remove fee |
| Old saves | Do not migrate old upgrades; discard `ship.upgrades` and start with empty equipment |
| Cargo hold revamp | Merchantman 700, Fluyt 1500, Galleon 1000, Ship of the Line 900 |

---

## 3. Ship Slot Definitions

| Ship | Tier | Hull | Armament | Rigging | Special | Total | Role |
|---|---:|---:|---:|---:|---:|---:|---|
| Dinghy | 0 | 0 | 0 | 0 | 0 | 0 | Starter craft; no equipment |
| Cutter | 0 | 1 | 0 | 1 | 0 | 2 | Fast early vessel |
| Sloop | 1 | 1 | 1 | 1 | 0 | 3 | Early balanced vessel |
| Schooner | 2 | 1 | 1 | 1 | 1 | 4 | Fast flexible vessel |
| Merchantman | 2 | 1 | 0 | 1 | 2 | 4 | Mid-game trader |
| Brigantine | 2 | 1 | 1 | 1 | 1 | 4 | Balanced raider |
| Corvette | 3 | 1 | 1 | 1 | 1 | 4 | Fast warship |
| Frigate | 3 | 1 | 1 | 1 | 1 | 4 | Heavy warship |
| Fluyt | 3 | 1 | 0 | 1 | 3 | 5 | Trade king |
| Galleon | 4 | 1 | 1 | 1 | 2 | 5 | Heavy hybrid |
| Ship of the Line | 4 | 1 | 2 | 1 | 1 | 5 | Combat fortress |

---

## 4. Cargo Hold Revamp

This change prevents the Ship of the Line from also being the best trader.

| Ship | Current Hold | New Hold | Reason |
|---|---:|---:|---|
| Merchantman | 600 | 700 | Strengthen mid-game trader identity |
| Fluyt | 1100 | 1500 | Make Fluyt the best cargo ship |
| Galleon | 1320 | 1000 | Keep Galleon as heavy hybrid, not trade king |
| Ship of the Line | 1600 | 900 | Keep Ship of the Line as combat king, not cargo king |

---

## 5. Equipment Catalogue

### 5.1 Hull Equipment

All hull equipment is **structural** and cannot be removed. It is lost when the ship is sold.

| Key | Name | Bonus | Downside | Fame | Min Hull | Cost | Install Fee |
|---|---|---|---|---:|---:|---:|---:|
| `reinforced_hull` | Reinforced Hull | +20% maxHull | None | 0 | 0 | 500 | 100 |
| `ironclad_plates` | Ironclad Plates | +35% maxHull | -2 speed | 50 | 100 | 2000 | 200 |
| `copper_plating` | Copper Plating | +2 speed | +40% repair cost | 100 | 150 | 3500 | 300 |
| `tar_sealed_hull` | Tar-Sealed Hull | +2 maxDays, prevents calm wind / doldrums delay | -1 speed | 20 | 60 | 1200 | 150 |

### 5.2 Armament Equipment

All armament equipment is removable.

| Key | Name | Bonus | Downside | Fame | Min Hull | Cost | Install Fee |
|---|---|---|---|---:|---:|---:|---:|
| `extra_cannons` | Extra Cannons | +4 cannons | -1 speed | 20 | 60 | 800 | 50 |
| `grapeshot_supply` | Grapeshot Supply | +50% crew damage to enemy | -20% hull damage to enemy | 50 | 100 | 1800 | 100 |
| `long_guns` | Long Guns | Precision hit chance 70% → 80% | -2 cannons | 100 | 150 | 3000 | 150 |

### 5.3 Rigging Equipment

| Key | Name | Bonus | Downside | Removable | Fame | Min Hull | Cost | Install Fee |
|---|---|---|---|---|---:|---:|---:|---:|
| `extra_sails` | Extra Sails | +3 speed | -10% maxHull | Yes | 0 | 60 | 600 | 50 |
| `storm_rigging` | Storm Rigging | +2 maxDays, prevents storm hull damage | -1 speed | Yes | 20 | 60 | 900 | 75 |
| `lateen_rig` | Lateen Rig | +1 maxDays | -10% maxHull | No | 50 | 100 | 1500 | 150 |
| `war_pennants` | War Pennants | +1 fame on hunt/combat, patrol, and assault mission victories | Heat from those victories is doubled | Yes | 100 | 100 | 3500 | 150 |

**Storm Rigging note:** prevents storm hull damage only. It does **not** prevent storm crew loss.

**War Pennants note:** does not apply to starter missions, trade, smuggle, escort, or random fights.

### 5.4 Special Equipment

| Key | Name | Bonus | Downside | Removable | Fame | Min Hull | Cost | Install Fee |
|---|---|---|---|---|---:|---:|---:|---:|
| `expanded_hold` | Expanded Hold | +20% holdCapacity | -2 speed | Yes | 0 | 60 | 700 | 50 |
| `hidden_compartment` | Hidden Compartment | 50% chance contraband is not detected on inspection | -10% holdCapacity | No | 20 | 60 | 1000 | 100 |
| `surgeons_bay` | Surgeon's Bay | -40% crew loss in combat | -15% holdCapacity | Yes | 50 | 100 | 2000 | 100 |
| `officer_quarters` | Officer Quarters | +10 maxCrew | -20% holdCapacity | Yes | 50 | 100 | 1800 | 100 |
| `ornate_figurehead` | Ornate Figurehead | +2 positive reputation gain from missions | None | Yes | 0 | 0 | 300 | 25 |
| `navigation_tools` | Navigation Tools | -1 travel day if base voyage is > 4 days | None | Yes | 50 | 60 | 600 | 50 |

---

## 6. State Shape

### 6.1 Ship state

```js
ship: {
  type: "brigantine",
  name: "Sea Dog",
  hull: 150,
  equipment: {
    hull: [],
    armament: [],
    rigging: [],
    special: [],
  },
}
```

### 6.2 Equipment inventory

```js
equipmentInventory: []
```

This inventory is separate from cargo hold. It does not consume hold capacity.

### 6.3 Slot validation

```js
ship.equipment[slot].length <= D.SHIPS[ship.type].slots[slot]
```

### 6.4 Duplicate validation

```js
Object.values(ship.equipment).flat().includes(equipmentKey) === false
```

---

## 7. Expected Player Behavior

### 7.1 Buying equipment

1. Player opens Shipyard.
2. Equipment Shop lists all equipment, including disabled items with reasons.
3. Player selects an equipment item.
4. Preview panel shows current stats vs after-install stats.
5. Player clicks **Buy & Install**.
6. Game validates:
   - enough gold
   - required fame met
   - required hull met
   - correct slot exists
   - slot has room
   - item not already installed
7. Gold is deducted: `cost + installFee`.
8. Item is installed into `ship.equipment[item.slot]`.
9. Log entry: `Installed {itemName} for {totalCost}g.`

### 7.2 Removing equipment

1. Player clicks Remove on installed removable equipment.
2. Game validates item is removable.
3. Gold is deducted: `installFee`.
4. Item moves from ship equipment to equipment inventory.
5. Log entry: `Removed {itemName}. Stored in equipment locker.`

### 7.3 Installing from inventory

1. Equipment inventory appears in Shipyard.
2. Player selects an inventory item.
3. Preview panel shows stat changes.
4. Player clicks Install.
5. Game deducts `installFee` only.
6. Item moves from inventory to ship equipment.

### 7.4 Buying a new ship

Before the ship purchase completes:

- If removable equipment is installed, display warning:

> You have removable equipment installed. Unmount it before selling this ship, or it will be lost with the hull.

Buttons:

- **Unmount All ({totalFee}g)**
- **Sell As-Is (lose equipment)**

Structural equipment is always lost with the old ship.

New ship starts with empty equipment.

---

## 8. Data.js Implementation

Add a new top-level `EQUIPMENT` object.

```js
const EQUIPMENT = {
  reinforced_hull: {
    name: "Reinforced Hull",
    desc: "+20% max hull.",
    downsideDesc: null,
    slot: "hull",
    removable: false,
    requiredFame: 0,
    requiredHull: 0,
    cost: 500,
    installFee: 100,
    effects: { hullPct: 0.20 },
  },
  extra_cannons: {
    name: "Extra Cannons",
    desc: "+4 cannons.",
    downsideDesc: "-1 speed.",
    slot: "armament",
    removable: true,
    requiredFame: 20,
    requiredHull: 60,
    cost: 800,
    installFee: 50,
    effects: { cannons: 4, speed: -1 },
  },
};
```

Add `slots` to every ship in `SHIPS`.

```js
brigantine: {
  // existing stats
  slots: { hull: 1, armament: 1, rigging: 1, special: 1 },
}
```

Remove old:

- `UPGRADES`
- `upgradeable`

Export `EQUIPMENT`.

---

## 9. Logic Helpers

### 9.1 `hasEquipment`

```js
const hasEquipment = (state, equipmentKey) => {
  const eq = state.ship?.equipment || {};
  return Object.values(eq).flat().includes(equipmentKey);
};
```

### 9.2 `getEquipmentEffect`

```js
const getEquipmentEffect = (state, effectKey) => {
  const eq = state.ship?.equipment || {};
  let total = effectKey === "combatHeatMult" ? 1 : 0;

  for (const key of Object.values(eq).flat()) {
    const item = D.EQUIPMENT[key];
    if (!item) continue;
    const value = item.effects?.[effectKey];
    if (value === undefined) continue;

    if (effectKey === "combatHeatMult") total *= value;
    else total += value;
  }

  return total;
};
```

### 9.3 `getShipStats`

Rewrite old upgrade logic.

```js
const getShipStats = (state) => {
  const base = D.SHIPS[state.ship.type];
  const stats = { ...base };
  let hullPct = 0;
  let holdPct = 0;

  for (const key of Object.values(state.ship.equipment || {}).flat()) {
    const item = D.EQUIPMENT[key];
    if (!item) continue;

    for (const [effect, value] of Object.entries(item.effects || {})) {
      if (effect === "hullPct") hullPct += value;
      else if (effect === "holdPct") holdPct += value;
      else if (effect in stats) stats[effect] += value;
    }
  }

  stats.maxHull = Math.round(base.maxHull * (1 + hullPct));
  stats.holdCapacity = Math.round(base.holdCapacity * (1 + holdPct));
  stats.speed = Math.max(1, stats.speed);
  stats.maxDays = Math.max(1, stats.maxDays);

  return stats;
};
```

### 9.4 Validation helpers

```js
const canInstallEquipment = (state, equipmentKey) => {
  const item = D.EQUIPMENT[equipmentKey];
  if (!item) return { ok: false, reason: "Unknown equipment" };

  const shipDef = D.SHIPS[state.ship.type];
  const current = state.ship.equipment?.[item.slot] || [];

  if ((state.fame || 0) < item.requiredFame) return { ok: false, reason: "Requires more fame" };
  if ((shipDef.maxHull || 0) < item.requiredHull) return { ok: false, reason: "Ship hull too small" };
  if ((shipDef.slots?.[item.slot] || 0) <= 0) return { ok: false, reason: "No matching slot" };
  if (current.length >= shipDef.slots[item.slot]) return { ok: false, reason: "Slot full" };
  if (Object.values(state.ship.equipment || {}).flat().includes(equipmentKey)) return { ok: false, reason: "Already installed" };

  return { ok: true };
};
```

---

## 10. Non-Stat Effect Integration

| Effect | File / Place | Expected behavior |
|---|---|---|
| `stormHullImmune` | `engine_combat.js` or event resolver, storm event | Storm hull damage becomes 0. Crew loss still applies. |
| `calmImmune` | event resolver, calm wind event | Calm wind days lost becomes 0. |
| `contrabandAvoidChance` | patrol inspection | 50% chance that contraband is not detected. |
| `crewDmgPct` | combat player action resolution | Enemy crew loss multiplied by 1.5. |
| `hullDmgPct` | combat player action resolution | Enemy hull damage multiplied by 0.8. |
| `precisionHitPct` | precision action | Hit chance becomes 0.80 with Long Guns. |
| `repairCostPct` | repair cost helper | Repair cost multiplied by 1.4 with Copper Plating. |
| `missionCombatFameBonus` | mission completion / patrol victory | +1 fame only on hunt/combat, patrol, assault; not starter missions. |
| `combatHeatMult` | heat gain helper | Heat doubled for eligible War Pennants victories. |
| `repGainBonus` | mission reputation application | +2 to positive rep gains from missions. |
| `longVoyageDayReduction` | travel days helper | If base voyage > 4 days, subtract 1. |
| `maxCrew` | `getShipStats` | +10 max crew with Officer Quarters. |

---

## 11. Reducer Actions

Add actions:

```js
BUY_EQUIPMENT
INSTALL_EQUIPMENT
REMOVE_EQUIPMENT
```

### 11.1 `BUY_EQUIPMENT`

Inputs:

```js
{ type: A.BUY_EQUIPMENT, equipmentKey }
```

Behavior:

- Validate shipyard service available.
- Validate item exists.
- Validate `canInstallEquipment`.
- Validate enough gold for `cost + installFee`.
- Deduct gold.
- Add item to correct slot array.
- Add log entry.

### 11.2 `INSTALL_EQUIPMENT`

Inputs:

```js
{ type: A.INSTALL_EQUIPMENT, equipmentKey }
```

Behavior:

- Validate item exists in `equipmentInventory`.
- Validate `canInstallEquipment`.
- Validate enough gold for `installFee`.
- Deduct fee.
- Remove item from inventory.
- Add item to ship equipment.

### 11.3 `REMOVE_EQUIPMENT`

Inputs:

```js
{ type: A.REMOVE_EQUIPMENT, equipmentKey }
```

Behavior:

- Validate item is installed.
- Validate item is removable.
- Validate enough gold for `installFee`.
- Deduct fee.
- Remove item from ship equipment.
- Add item to equipment inventory.

---

## 12. Shipyard UI Overhaul

The Shipyard screen needs a significant redesign.

### 12.1 Sections

1. **Current Ship & Stats**
   - Name, type, hull, cannons, crew, speed, maxDays, hold.

2. **Equipment Slots**
   - Row per slot type.
   - Show installed items.
   - Show empty slots.
   - Structural items get a “Structural” badge.
   - Removable items get a Remove button.

3. **Equipment Shop**
   - Items available for purchase.
   - Disabled items show reason.
   - Buy & Install button.

4. **Equipment Locker**
   - Items in `equipmentInventory`.
   - Install button when compatible.
   - Disabled reason if incompatible.

5. **Preview Panel**
   - Clicking equipment previews before/after stats.
   - Green for improvements, red for downsides.

6. **Ship Purchase Warning**
   - If removable equipment is installed, warn before purchase.
   - Offer Unmount All or Sell As-Is.

---

## 13. File Impact

| File | Required changes |
|---|---|
| `data.js` | Add `EQUIPMENT`, ship slots, cargo hold revamp, remove old upgrades. |
| `engine_core.js` | State shape, migration, action constants. |
| `logic.js` | `getShipStats`, equipment helpers, repair/travel changes. |
| `engine_port.js` | Equipment reducers, ship purchase flow, mission effects. |
| `engine_combat.js` | Combat/effect integration, patrol inspection, storm/calm handling, heat multiplier. |
| `screens_port.jsx` | Shipyard UI overhaul. |
| `ui.jsx` | Optional reusable UI helpers for slot badges / stat preview. |
| `tests_balance.html` | Update expected ship/equipment assumptions if needed. |
| `equipment_combo_analyzer.html` | Update final data if values change during implementation. |

---

## 14. Implementation Order

### Phase 1 — Data layer

- [ ] Add all 17 equipment entries in `data.js`.
- [ ] Add slot definitions to all ships.
- [ ] Apply cargo hold revamp.
- [ ] Remove old `UPGRADES` and `upgradeable`.
- [ ] Export `EQUIPMENT`.

### Phase 2 — State and migration

- [ ] Update initial state ship shape.
- [ ] Add `equipmentInventory: []`.
- [ ] Migrate old saves by deleting `ship.upgrades` and adding empty equipment.
- [ ] Add action constants.

### Phase 3 — Core logic

- [ ] Rewrite `getShipStats`.
- [ ] Add `hasEquipment`.
- [ ] Add `getEquipmentEffect`.
- [ ] Add `canInstallEquipment`.
- [ ] Update repair cost.
- [ ] Update travel days.

### Phase 4 — Effect integration

- [ ] Long Guns precision chance.
- [ ] Grapeshot crew/hull damage modifiers.
- [ ] Storm Rigging storm hull immunity.
- [ ] Tar-Sealed Hull calm wind immunity.
- [ ] Hidden Compartment inspection avoidance.
- [ ] War Pennants mission fame bonus.
- [ ] War Pennants heat multiplier.
- [ ] Ornate Figurehead rep gain bonus.
- [ ] Navigation Tools travel day reduction.
- [ ] Surgeon’s Bay crew loss reduction.

### Phase 5 — Equipment reducers

- [ ] Implement `BUY_EQUIPMENT`.
- [ ] Implement `INSTALL_EQUIPMENT`.
- [ ] Implement `REMOVE_EQUIPMENT`.
- [ ] Update `BUY_SHIP` flow.
- [ ] Remove `BUY_UPGRADE`.

### Phase 6 — Shipyard UI

- [ ] Remove old upgrade UI.
- [ ] Add slot grid.
- [ ] Add equipment shop.
- [ ] Add equipment locker.
- [ ] Add stat preview panel.
- [ ] Add ship purchase equipment warning.

### Phase 7 — Cleanup

- [ ] Search codebase for `UPGRADES`.
- [ ] Search codebase for `upgradeable`.
- [ ] Search codebase for `ship.upgrades`.
- [ ] Search codebase for `BUY_UPGRADE`.
- [ ] Search codebase for `hasUpgrade`.
- [ ] Remove or replace all references.

### Phase 8 — Testing

- [ ] New game starts with empty equipment.
- [ ] Old saves load with old upgrades discarded.
- [ ] Each equipment can be bought if requirements are met.
- [ ] Each equipment is blocked if requirements are not met.
- [ ] Slot limits are enforced.
- [ ] Duplicate equipment is blocked.
- [ ] Structural items cannot be removed.
- [ ] Removable items can be removed to inventory.
- [ ] Inventory equipment can be installed on compatible ships.
- [ ] Buying a ship warns about removable equipment.
- [ ] Unmount All deducts fees and preserves removable equipment.
- [ ] Sell As-Is loses removable equipment.
- [ ] Structural equipment is always lost on ship sale.
- [ ] All non-stat effects work.
- [ ] Balance dashboard still runs.
- [ ] Economy sim still runs.

---

## 15. Definition of Done

- [ ] Old upgrade system fully removed.
- [ ] All ships have slot definitions.
- [ ] All 17 equipment items exist in `D.EQUIPMENT`.
- [ ] Cargo hold revamp applied.
- [ ] Equipment inventory exists and persists.
- [ ] Ship stats are calculated from equipment.
- [ ] Shipyard supports buying, installing, removing, and previewing equipment.
- [ ] Ship purchase handles removable and structural equipment correctly.
- [ ] Storm Rigging prevents storm hull damage but not crew loss.
- [ ] Tar-Sealed Hull prevents calm wind delay.
- [ ] Hidden Compartment provides 50% contraband inspection avoidance.
- [ ] Grapeshot and Long Guns alter combat as designed.
- [ ] War Pennants adds +1 fame only to eligible mission victories and doubles heat.
- [ ] Figurehead adds +2 positive mission reputation gain.
- [ ] Navigation Tools reduce only voyages longer than 4 days.
- [ ] Old saves do not crash.
- [ ] No remaining references to `UPGRADES`, `upgradeable`, `ship.upgrades`, `BUY_UPGRADE`, or `hasUpgrade`.

---

## 16. Estimated Complexity

| Area | Estimated lines | Estimated time |
|---|---:|---:|
| Data | ~50 | 1-2h |
| State / migration | ~30 | 1h |
| Logic helpers | ~40 | 1-2h |
| Effect integration | ~50 | 2-3h |
| Reducers | ~70 | 2-3h |
| Shipyard UI | ~120-180 | 4-6h |
| Cleanup | ~20 | 30min |
| Testing | — | 2-3h |
| **Total** | **~380-440** | **14-20h** |

---

## 17. Recommended Implementation Strategy

Implement mechanics before UI:

1. Data
2. State shape
3. `getShipStats`
4. Non-stat effects
5. Reducers
6. Shipyard UI
7. Cleanup
8. Tests

This allows equipment to be tested through debug/state manipulation before the Shipyard UI is finished.
