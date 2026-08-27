# Game Design — Data Constants Specification

---

## Overview

This document specifies the **structure, purpose, and constraints** of all constants defined across two files:

| File | Namespace | Contents |
|---|---|---|
| `data.js` | `window.D` | Game constants (ports, ships, factions, equipment, resources, missions, events, starts, career, NPC AI, combat constants) |
| `data_text.js` | extends `window.D` | Text constants (crew names, bio templates, gossip templates, encounter flavour, mission name parts, enemy ship names, combat logs, arrival messages, market flavour, QM dialogue) |

`data_text.js` loads after `data.js` and extends the same `window.D` namespace using `Object.assign`.

**Core Principles:**

- All data is **static** and **immutable** at runtime.
- No logic functions or side effects (exception: event `condition` callbacks in `RANDOM_EVENTS`).
- Exported as a single object: `window.D = { PORTS, SHIPS, SHIP_VISUALS, FACTIONS, EQUIPMENT, RESOURCES, ... }`.

---

## 1. FACTIONS

**Purpose**: Defines political factions, their colours, and rivalries.

### Structure

```js
FACTIONS: {
  [factionKey: string]: {
    label: string,        // Display name (e.g., "English")
    color: string,        // Hex colour for UI (e.g., "#ff0000")
    rivalFactions: string[] // Faction keys that are rivals (e.g., ["spanish", "french"])
  }
}
```

### Faction List

| Key | Label | Colour | Rival Factions |
|---|---|---|---|
| `english` | English | `#ff0000` | `spanish`, `french` |
| `spanish` | Spanish | `#ffcc00` | `english`, `dutch` |
| `french` | French | `#0066ff` | `english` |
| `dutch` | Dutch | `#ff6600` | `spanish` |
| `pirate` | Pirate | `#800080` | `english`, `spanish`, `french`, `dutch` |

### Rivalry Rules

- **Hostile Port Entry**: If a player enters a port owned by a rival faction with `reputation < 10`, they trigger a hostile encounter.
- **Mission Availability**: Missions from rival factions are **blocked** at low reputation.
- **Reputation Decay**: Reputation with rival factions decays faster (see `decayReputation` in `logic_core.js`).

---

## 2. PORTS

**Purpose**: Defines all ports in the Caribbean map, including coordinates, factions, services, and unlock conditions.

### Structure

```js
PORTS: {
  [portKey: string]: {
    name: string,               // Display name (e.g., "Port Royal")
    faction: string,            // Key in FACTIONS (e.g., "english")
    x: number,                  // X-coordinate for map rendering (0-760)
    y: number,                  // Y-coordinate for map rendering (0-460)
    services: string[],         // Available services (e.g., ["tavern", "shipyard"])
    desc: string,               // Flavour text for UI tooltips
    minHull?: number,           // Minimum hull required to reach (101 for remote ports)
    hidden?: boolean,           // If true, port is hidden until unlocked
    unlockCondition?: {         // Conditions to unlock hidden ports
      type: "any" | "all",      // "any" = OR, "all" = AND
      conditions: [
        { type: "fame" | "infamy" | "reputation" | "item", value: number | string, faction?: string }
      ]
    }
  }
}
```

### Port Categories

| Category | Count | Description | Example Ports | Requirements |
|---|---|---|---|---|
| **Standard** | 16 | Visible and reachable from the start | `portRoyal`, `tortuga`, `havana` | None |
| **Remote** | 5 | Visible but require `minHull >= 101` (brigantine+) | `campeche`, `veracruz`, `bermuda` | Ship tier 2+ |
| **Hidden** | 4 | Not rendered until `unlockCondition` is satisfied | `roatan`, `dryTortugas`, `lasAves`, `libertalia` | See below |

### Services

| Service | Description | Impact |
|---|---|---|
| `tavern` | Morale recovery, crew hiring | Enables `RAISE_MORALE` and `HIRE_CREW` actions |
| `shipyard` | Ship purchases, equipment install/remove | Enables `BUY_SHIP`, `BUY_EQUIPMENT`, `INSTALL_EQUIPMENT`, `REMOVE_EQUIPMENT` |
| `crew` | Crew hiring | Enables `HIRE_CREW` |
| `missions` | Mission board access | Enables `REFRESH_MISSIONS`, `TAKE_MISSION` |

### Unlock Conditions

| Port | Unlock Condition | Notes |
|---|---|---|
| **Roatan** | `type: "any"`, conditions: `[{type: "fame", value: 50}, {type: "reputation", faction: "pirate", value: 65}]` | Fame **OR** Pirate reputation |
| **Dry Tortugas** | `type: "all"`, conditions: `[{type: "infamy", value: 25}, {type: "reputation", faction: "pirate", value: 65}]` | Infamy **AND** Pirate reputation |
| **Las Aves** | `type: "item"`, value: `"map_fragment_lasAves"` | Requires item from "The Wrecker's Map" event |
| **Libertalia** | `type: "all"`, conditions: `[{type: "fame", value: 200}, {type: "item", value: "map_fragment_libertalia"}]` | Fame **AND** item from "A Dying Sailor's Secret" event |

---

## 3. SHIPS

**Purpose**: Defines all player and enemy ship types, including stats, costs, and equipment slot counts.

### Structure

```js
SHIPS: {
  [shipType: string]: {
    name: string,           // Display name (e.g., "Sloop")
    maxHull: number,        // Maximum hull HP
    maxCrew: number,        // Maximum crew capacity
    cannons: number,        // Number of cannons
    speed: number,          // Sailing speed (higher = faster)
    cost: number,           // Gold cost to purchase
    requiredFame: number,   // Minimum fame to purchase
    maxDays: number,        // Maximum days at sea before forced return
    holdCapacity: number,   // Maximum hold capacity (units)
    slots: {               // Equipment slot counts per type
      hull: number,
      armament: number,
      rigging: number,
      special: number
    },
    desc: string           // Flavour text
  }
}
```

### Ship Tiers

| Tier | Ship | Hull | Crew | Cannons | Speed | Cost | Fame | Days | Hold | Slots (H/A/R/S) | Role |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | Dinghy | 30 | 5 | 2 | 6 | 200 | 0 | 5 | 20 | 0/0/0/0 | Starter (tutorial) |
| 0 | Cutter | 60 | 20 | 6 | 12 | 1,000 | 0 | 8 | 80 | 1/0/1/0 | Scout |
| 1 | Sloop | 100 | 40 | 10 | 11 | 4,000 | 20 | 10 | 200 | 1/1/1/0 | Balanced |
| 2 | Schooner | 110 | 55 | 12 | 11 | 20,000 | 50 | 12 | 240 | 1/0/1/1 | Smuggler |
| 2 | Merchantman | 180 | 60 | 5 | 8 | 25,000 | 50 | 14 | 700 | 1/0/1/2 | Trader |
| 2 | Brigantine | 150 | 80 | 15 | 10 | 40,000 | 50 | 14 | 448 | 1/1/1/1 | Combat |
| 3 | Corvette | 180 | 90 | 18 | 11 | 130,000 | 100 | 16 | 500 | 1/1/1/1 | Naval |
| 3 | Frigate | 220 | 120 | 24 | 9 | 250,000 | 100 | 18 | 720 | 1/1/1/1 | Warship |
| 3 | Fluyt | 180 | 70 | 6 | 7 | 100,000 | 100 | 24 | 1,100 | 1/0/1/3 | Cargo |
| 4 | Galleon | 300 | 150 | 30 | 6 | 500,000 | 150 | 22 | 1,000 | 1/1/1/2 | Heavy Combat |
| 4 | Ship of the Line | 420 | 280 | 50 | 5 | 1,000,000 | 150 | 28 | 900 | 1/2/1/1 | Endgame |

**Note**: The actual `holdCapacity` values in `data.js` for Merchantman, Fluyt, Galleon, and Ship of the Line may differ from older versions. Current values are as shown above.

### Ship Progression Notes
- **Tier 0**: Starter ships (Dinghy, Cutter). No fame requirement.
- **Tier 1**: First upgrade (Sloop). Requires **20 fame**.
- **Tier 2**: Specialization (Schooner, Merchantman, Brigantine). Requires **50 fame**.
- **Tier 3**: Advanced (Corvette, Frigate, Fluyt). Requires **100 fame**.
- **Tier 4**: Endgame (Galleon, Ship of the Line). Requires **150 fame**.
- **Equipment Loss**: When buying a new ship, **all installed equipment is lost** (reset to empty). Removable equipment should be uninstalled to the locker first.

---
## 4. SHIP_VISUALS

**Purpose**: Visual configurations for each ship type, used by `ship-sprite.js` to render SVG silhouettes.

### Structure
```js
SHIP_VISUALS: {
  [shipType: string]: {
    hullShape: "open" | "lowSloop" | "military" | "galleon", // Base hull shape
    hullLength: number,       // Relative length (scaling unit)
    hullHeight: number,       // Relative height
    hasForecastle?: boolean,  // Visual: raised front deck
    hasQuarterdeck?: boolean, // Visual: raised rear deck
    hasPoopDeck?: boolean,    // Visual: highest rear deck (galleons)
    hasSternGallery?: boolean,// Visual: decorative stern
    gunDecks: number,         // Number of gun decks
    gunPortsLower?: number,   // Gun ports on lower deck
    gunPortsUpper?: number,   // Gun ports on upper deck (if gunDecks > 1)
    masts: [                  // Mast configurations
      {
        x: number,           // Position along hull (0.0 to 1.0)
        rig: string,         // "lateen", "gaff", "square", "squareWithLateen"
        sails?: {            // Sail configurations
          course?: boolean,
          topsail?: boolean,
          topgallant?: boolean,
          royal?: boolean,
          mizzen?: boolean
        }
      }
    ],
    bowsprit?: string        // "none", "oneJib", "twoJibs", "squareSpritsail"
  }
}
```

### Notes
- Used exclusively by `ship-sprite.js` (no gameplay impact).
- Shapes: `open` (dinghy), `lowSloop` (cutter/sloop/schooner), `military` (brigantine/corvette/frigate/ship of the line), `galleon` (galleon/fluyt).
- Visual features (forecastle, quarterdeck, etc.) affect the SVG rendering but not stats.

---

## 5. EQUIPMENT

**Purpose**: Defines all installable ship equipment, their costs, slot types, and stat effects.

### Structure
```js
EQUIPMENT: {
  [equipKey: string]: {
    name: string,           // Display name (e.g., "Reinforced Hull")
    desc: string,           // Positive effect description
    downsideDesc?: string,  // Negative effect description (shown in UI)
    slot: string,           // "hull" | "armament" | "rigging" | "special"
    removable: boolean,     // Can be uninstalled to locker?
    requiredFame?: number,  // Minimum fame to purchase
    requiredHull?: number,  // Minimum base hull to install
    cost: number,           // Gold cost to purchase
    installFee: number,     // Gold cost to install at shipyard
    effects: {              // Stat modifiers (applied in L.getShipStats)
      hullPct?: number,     // Multiplicative hull HP bonus (e.g., 0.2 = +20%)
      cannons?: number,     // Additive cannon bonus/penalty
      speed?: number,       // Additive speed bonus/penalty
      holdPct?: number,     // Multiplicative hold bonus (e.g., 0.25 = +25%)
      maxCrew?: number,     // Additive max crew bonus
      maxDays?: number,     // Additive max days at sea
      repairCostPct?: number, // Multiplicative repair cost penalty (e.g., 0.40 = +40%)
      crewLossMult?: number, // Multiplicative crew loss modifier (e.g., 0.60 = -40% loss)
      missionCombatFameBonus?: number, // Additive fame bonus for combat missions
      combatHeatMult?: number, // Multiplicative heat gain from combat (e.g., 2 = double heat)
      repGainBonus?: number,   // Additive reputation gain bonus
      contrabandAvoidChance?: number, // Probability to avoid contraband detection (0.0-1.0)
      calmImmune?: boolean,   // Immune to calm wind delays
      stormHullImmune?: boolean, // Immune to storm hull damage
      crewDmgPct?: number,   // +% crew damage to enemy
      hullDmgPct?: number,   // +% hull damage to enemy (or negative for penalty)
      precisionHitPct?: number, // +% precision hit chance (additive)
      longVoyageDayReduction?: number // -1 day for voyages > 4 days
    }
  }
}
```

### Equipment by Slot

#### Hull Slot
| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `reinforced_hull` | Reinforced Hull | 500 | 100 | `hullPct: 0.20` (+20% hull) | No | — | — |
| `ironclad_plates` | Ironclad Plates | 2,000 | 200 | `hullPct: 0.35`, `speed: -2` | No | 50 | 100 |
| `copper_plating` | Copper Plating | 3,500 | 300 | `speed: 2`, `repairCostPct: 0.40` (+40% repair cost) | No | 100 | 150 |
| `tar_sealed_hull` | Tar-Sealed Hull | 1,200 | 150 | `maxDays: 2`, `speed: -1`, `calmImmune: true` | No | 20 | 60 |

#### Armament Slot
| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `extra_cannons` | Extra Cannons | 800 | 50 | `cannons: 4`, `speed: -1` | Yes | 20 | 60 |
| `grapeshot_supply` | Grapeshot Supply | 1,800 | 100 | `crewDmgPct: 0.50`, `hullDmgPct: -0.20` | Yes | 50 | 100 |
| `long_guns` | Long Guns | 3,000 | 150 | `cannons: -2`, `precisionHitPct: 0.10` | Yes | 100 | 150 |

#### Rigging Slot
| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `extra_sails` | Extra Sails | 600 | 50 | `speed: 3`, `hullPct: -0.10` | Yes | — | 60 |
| `storm_rigging` | Storm Rigging | 900 | 75 | `maxDays: 2`, `speed: -1`, `stormHullImmune: true` | Yes | 20 | 60 |
| `lateen_rig` | Lateen Rig | 1,500 | 150 | `maxDays: 1`, `hullPct: -0.10` | No | 50 | 100 |
| `war_pennants` | War Pennants | 3,500 | 150 | `missionCombatFameBonus: 1`, `combatHeatMult: 2` (double heat from combat) | Yes | 100 | 100 |

#### Special Slot
| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `expanded_hold` | Expanded Hold | 700 | 50 | `holdPct: 0.20`, `speed: -2` | Yes | — | 60 |
| `hidden_compartment` | Hidden Compartment | 1,000 | 100 | `contrabandAvoidChance: 0.50`, `holdPct: -0.10` | No | 20 | 60 |
| `surgeons_bay` | Surgeon's Bay | 2,000 | 100 | `crewLossMult: 0.60`, `holdPct: -0.15` | Yes | 50 | 100 |
| `officer_quarters` | Officer Quarters | 1,800 | 100 | `maxCrew: 10`, `holdPct: -0.20` | Yes | 50 | 100 |
| `ornate_figurehead` | Ornate Figurehead | 300 | 25 | `repGainBonus: 2` (+2 rep gain from positive mission outcomes) | Yes | — | — |
| `navigation_tools` | Navigation Tools | 600 | 50 | `longVoyageDayReduction: 1` (-1 day for voyages > 4 days) | Yes | 50 | 60 |

### Equipment Rules
- Ships have **fixed slot counts** (see `SHIPS[type].slots`).
- **No slot conflicts**: Multiple items in the same slot (on ships with 2+ slots) stack additively.
- **Removable** equipment can be uninstalled to the **locker** (`state.equipmentInventory`) at no cost.
- **Non-removable** equipment is permanently installed (destroyed if ship is sold).
- **Buying a new ship clears all equipment** -- uninstall removable items to locker first.
- Equipment can be installed from the locker (no purchase cost, only `installFee`).

---
## 6. RESOURCES

**Purpose**: Defines all tradeable goods, their base prices, variance, legality, and units.

### Good List

| Key | Name | Base Price | Variance | Illegal | Infamy/Buy | Unit | Smuggle Hint |
|---|---|---|---|---|---|---|---|
| `food` | Food | 3 | 0% | No | 0 | ration | — |
| `water` | Water | 2 | 0% | No | 0 | barrel | — |
| `rum` | Rum | 30 | ±5% | No | 0 | cask | Common in pirate ports |
| `sugar` | Sugar | 40 | ±5% | No | 0 | sack | — |
| `timber` | Timber | 25 | ±5% | No | 0 | plank | — |
| `cloth` | Cloth | 55 | ±5% | No | 0 | bale | — |
| `spices` | Spices | 120 | ±5% | No | 0 | chest | — |
| `silk` | Silk | 160 | ±5% | No | 0 | bolt | — |
| `coffee` | Coffee | 70 | ±5% | No | 0 | bag | — |
| `cocoa` | Cocoa | 90 | ±5% | No | 0 | crate | — |
| `weapons` | Weapons | 80 | ±5% | No | 0 | crate | — |
| `tobacco` | Tobacco | 90 | ±5% | **Yes** | 0 | bale | Found in Havana, Tortuga, Providencia, Nassau |
| `silver` | Silver | 250 | ±5% | No | 0 | chest | — |
| `slaves` | Slaves | 220 | ±5% | **Yes** | **+1** | person | Available in Portobelo, Cartagena, Libertalia, Veracruz |

### Price Calculation (B8 — Stable Trade Routes)

Prices are designed to create **stable, learnable trade routes**. Each port has a consistent price identity based on:
1. **Availability Tier** (`always` / `frequently` / `sometimes` / `rarely` / `never`) — see `AVAILABILITY_PRICE_MODIFIERS` below.
2. **Faction Production Bonus** — see `FACTION_PRICE_MODIFIERS` below.
3. **Random Variance** — ±5% for all goods except food/water (which are fixed).

```js
marketPrice = basePrice × availMult × factionMod × (1 + variance × random(-1,1))
buyFromPort = Math.round(marketPrice × 1.10)
sellToPort  = Math.round(marketPrice × 0.90)
```

#### AVAILABILITY_PRICE_MODIFIERS
| Tier | Multiplier | Effect |
|---|---|---|
| `always` | 0.72 | −28% (local surplus) |
| `frequently` | 0.88 | −12% |
| `sometimes` | 1.00 | Neutral |
| `rarely` | 1.20 | +20% (scarce) |
| `never` | 1.40 | +40% (must import) |

#### FACTION_PRICE_MODIFIERS
Faction-specific production bonuses stack multiplicatively with availability tier.

| Faction | Goods | Modifier |
|---|---|---|
| English | sugar, cloth | 0.90 |
| Spanish | silver, cocoa | 0.90 |
| French | rum, coffee | 0.90 |
| Dutch | spices (0.85), silk, timber, weapons | 0.90 |
| Pirate | rum, tobacco | 0.90 |

### Contraband Rules
- `illegal: true`: Carrying these goods triggers **patrol inspection risk** at sea and when entering lawful ports.
- **Slaves** add **+1 infamy per unit purchased**.
- **Patrol Inspection**:
  - If contraband is found: goods are **seized**, fine = `PATROL_FINE_RATE × seizedValue` (20%), **+2 infamy**, **-5 faction reputation**, **-10 morale**.
  - **Hidden Compartment**: 50% chance to avoid detection.
- **PATROL_FINE_RATE**: `0.20` (20% of seized goods' value).

---

## 7. GOODS_AVAILABILITY

**Purpose**: Defines which goods are available in each port, and their rarity tiers.

### Availability Tiers
| Tier | Probability | Quantity Range |
|---|---|---|
| `always` | 100% | 40-80 |
| `frequently` | 66% | 20-40 |
| `sometimes` | 33% | 8-20 |
| `rarely` | 10% | 2-8 |
| `never` | 0% | — |

**Exception**: `food` and `water` always have `available: 999` (unlimited).

### Faction Trends
| Faction | Common Goods | Rare Goods |
|---|---|---|
| English | cloth, sugar, weapons | silk, cocoa |
| Spanish | silver, cocoa, spices | rum, timber |
| French | sugar, cocoa, rum | coffee, cloth |
| Dutch | spices, silk, coffee | cocoa, weapons |
| Pirate | rum, weapons, tobacco, slaves | silver, spices |

---
## 8. Mission Configuration

**Purpose**: Defines parametric mission generation rules.

### Mission Gold Ranges (`MISSION_GOLD_RANGES`)
| Fame Tier | Low Risk | Medium Risk | High Risk | Assault Risk |
|---|---|---|---|---|
| 0 | 140-180 | 180-230 | 230-300 | 300-400 |
| 1 | 250-750 | 750-2000 | 2000-3000 | 3000-4000 |
| 2 | 400-1500 | 1500-5000 | 5000-7000 | 7000-10000 |
| 3 | 2000-7000 | 7000-10000 | 10000-18000 | 18000-22000 |
| 4 | 6000-15000 | 15000-30000 | 30000-50000 | 50000-75000 |
| 5 | 15200-25000 | 25000-50000 | 50000-80000 | 80000-100000 |

**Fame Tiers**: 0 (< 50), 1 (50-99), 2 (100-199), 3 (200-349), 4 (350+)

---
### Mission Enemy Ranges (`MISSION_ENEMY_RANGES`)
| Fame Tier | Hull | Cannons | Crew |
|---|---|---|---|
| 0 | 10-20 | 1-3 | 3-6 |
| 1 | 20-45 | 2-6 | 6-18 |
| 2 | 40-75 | 5-10 | 15-35 |
| 3 | 65-110 | 8-16 | 25-55 |
| 4 | 95-155 | 13-22 | 40-80 |
| 5 | 135-210 | 18-30 | 60-110 |

---
### Mission Reputation Impacts (`MISSION_REP_IMPACTS`)
| Type | Low | Medium | High |
|---|---|---|---|
| escort | +2 | +3 | +4 |
| patrol | +2 | +3 | +4 |
| combat | +3 | +4 | +5 |
| trade | +2 | +3 | +4 |
| smuggle | +2 (any) | — | — |
| assault | +5 (any) | — | — |

---
### Trade Goods by Tier (`TRADE_GOODS_BY_TIER`)
| Tier | Eligible Goods |
|---|---|
| 0 | rum, sugar, timber |
| 1 | rum, sugar, timber, cloth |
| 2 | rum, sugar, timber, cloth, coffee, cocoa |
| 3 | coffee, cocoa, cloth, weapons, spices |
| 4-5 | spices, silk, weapons, cocoa |

---
### Smuggle Goods by Tier (`SMUGGLE_GOODS_BY_TIER`)
| Tier | Eligible Goods |
|---|---|
| 0 | rum |
| 1-2 | rum, tobacco |
| 3-5 | rum, tobacco, slaves |

**Note**: `slaves` only appear if `state.infamy >= 25`.

---
### Profit Margins
| Risk | Trade Margin | Smuggle Margin |
|---|---|---|
| Low | +60% | +80% |
| Medium | +80% | +120% |
| High | +110% | +180% |

---
## 9. Plunder Configuration

**Purpose**: Defines rules for generating enemy cargo and gold rewards after victories.

### Plunder Target Values (`PLUNDER_TARGET`)
| Fame Tier | Low Risk | Medium Risk | High Risk |
|---|---|---|---|
| 0 | 15 | 20 | 28 |
| 1 | 27 | 34 | 41 |
| 2 | 285 | 975 | 1,800 |
| 3 | 1,350 | 2,550 | 4,200 |
| 4 | 3,150 | 6,750 | 12,000 |
| 5 | 6,030 | 11,250 | 19,500 |

### Plunder Gold Ratio
`PLUNDER_GOLD_RATIO: 0.20` — 20% of total plunder value is gold, 80% is cargo.

---
### Faction Plunder Goods (`FACTION_PLUNDER_GOODS`)
| Faction | Primary Goods (Weight) | Secondary Goods (Weight) |
|---|---|---|
| Spanish | silver (60%), cocoa (30%) | spices (10%) |
| Pirate | rum (50%), weapons (30%) | tobacco (20%), slaves (10%) |
| English | cloth (50%), weapons (30%) | sugar (20%) |
| Dutch | spices (40%), silk (30%) | coffee (20%), cocoa (10%) |
| French | sugar (40%), cocoa (30%) | rum (20%), coffee (10%) |

---
## 10. RANDOM_EVENTS

**Purpose**: Defines random events that occur at sea during `ADVANCE_DAY`.

### Structure
```js
RANDOM_EVENTS: [
  {
    id: string,                // Unique identifier (e.g., "storm")
    type: string,              // "hazard" | "choice" | "reward" | "crew" | "discovery"
    title: string,             // Event title (e.g., "Violent Storm!")
    desc: string[] | string,   // Event description (array of variants or a single string)
    condition?: (state) => boolean,  // Optional gate (e.g., morale < 20)
    choices?: [               // For "choice" events
      {
        label: string,         // Choice button text
        outcome: {
          log?: string,        // Log entry
          gold?: number,       // Gold change
          fame?: number,       // Fame change
          hullDamage?: number, // Hull damage
          crewLoss?: number,   // Crew lost
          daysLost?: number,   // Days added
          moraleBonus?: number, // Morale change
          moralePenalty?: number,
          mapFragment?: string, // e.g., "map_fragment_lasAves"
          action?: string       // e.g., "ATTACK_PIRATE"
          // Additional outcome fields: food, water, addCrew, generateCargo, battle, loseCargoPercent, repImpact
        }
      }
    ]
  }
]
```

### Event List (current)

| ID | Type | Title | Condition | Key Outcomes |
|---|---|---|---|---|
| `storm` | hazard | Violent Storm! | Always | Brace: hull 15, days +1, crew 3; Detour: hull 5, crew 1 (available only if a reachable port exists) |
| `calm_winds` | hazard | Doldrums | Always | Days +3 |
| `distressed_merchant` | choice | Merchant in Distress | Always | Defend → combat; Plunder → combat; Pass By → morale -2 |
| `drifting_wreck` | choice | Drifting Wreck | Always | Search (risky) → possible cargo, survivor, empty, or ambush; Leave → none |
| `drifting_sailors` | choice | Marooned Sailors | `fame >= 10` | Take aboard → +3 crew; Give supplies → -50g, -15 food, -15 water, +3 morale; Sail on → -5 morale |
| `whale_sighting` | reward | Whale Sighting | Always | Harvest → +500g; Leave → +5 morale |
| `mutiny` | crew | Mutiny! | `morale < 20` | Negotiate (costs gold or upsets crew); Crush → -10 crew, -15 morale |
| `deserters` | crew | Deserters | `morale < 40` | Let go → -5 crew; Punish → -1 crew, -10 morale |
| `mysterious_chart` | discovery | A Dying Sailor's Secret | `fame >= 100` && no Libertalia fragment | Take → gain map_fragment_libertalia |
| `wreckers_chart` | discovery | The Wrecker's Map | `fame >= 50` && no Las Aves fragment | Buy (-5000g) → gain map_fragment_lasAves; Decline → none |

**Note**: `treasure_map` event was **removed** from the active pool.

### Event Triggers
- **At Sea**: ~5% chance per day during `ADVANCE_DAY` (see `maybeRandomEvent` in `engine_voyage.js`).
- **Conditional**: Events with `condition` only fire if the state meets the criteria.
- **Exclusive**: Only **one event per day** (first triggered event blocks others).
- **Skipped During Onboarding**: Random events are **suppressed** if `state.onboarding?.enabled && !state.onboarding?.completed`.

---
## 11. STARTS (Faction-Based System)

**Purpose**: Defines **faction-based starting scenarios** with unique characters, backstories, and initial conditions.

### Structure
```js
STARTS: {
  gold: number,               // Starting gold (shared across all factions)
  ship: string,               // Starting ship type (e.g., "dinghy")
  hold: { [goodKey]: number }, // Starting hold contents
  startDate: { day, month, year }, // Starting date (e.g., { day: 1, month: 6, year: 1695 })
  factionPorts: {             // Starting port for each faction
    english: string,          // e.g., "portRoyal"
    spanish: string,          // e.g., "havana"
    french: string,           // e.g., "portDePaix"
    dutch: string,            // e.g., "curacao"
    pirate: string            // e.g., "tortuga"
  },
  factionRepAdjust: {         // Reputation adjustments for each faction
    [factionKey]: {           // e.g., "english"
      [otherFactionKey]: number // e.g., "spanish": -10, "french": +5
    }
  },
  factionBackstory: {         // Opening narrative and log lines for each faction
    [factionKey]: {
      hook: string,            // Short flavor hook
      flavour: string,         // Longer backstory text
      openingLog: string[]     // Log entries to show at game start
    }
  },
  factionQM: {                // Quartermaster (QM) character for each faction
    [factionKey]: {
      firstName: string,
      lastName: string,
      bio: string
    }
  }
}
```

### Starting Scenarios (faction-keyed)

| Faction | Start Port | Gold | Ship | Hold | Backstory Theme | QM Character |
|---|---|---|---|---|---|---|
| English | Kingston | 490 | Dinghy | { food: 5, water: 5 } | Forged commission | "Old Morley" |
| Spanish | Havana | 490 | Dinghy | { food: 5, water: 5 } | Governor's errand | "Viejo Cortés" |
| French | Petit-Goâve | 490 | Dinghy | { food: 5, water: 5 } | Cartographer's debt | "Vieux Deschamps" |
| Dutch | Santo Domingo | 490 | Dinghy | { food: 5, water: 5 } | Company's ledger | "Oude Bakker" |
| Pirate | Santiago de Cuba | 490 | Dinghy | { food: 5, water: 5 } | The Survivor | "Scarred Jim" |

### Reputation Adjustments
Each faction starts with **reputation adjustments** to reflect their political standing. The actual `factionRepAdjust` in `data.js` maps faction → `{ otherFaction: delta }`. For example, English starts with `{ english: +10, pirate: -5 }`.

---

## 12. TUTORIAL_DELIVERY

**Purpose**: Pre-built **tutorial delivery mission** auto-accepted in `"full"` onboarding mode.

### Structure (faction-keyed)
```js
TUTORIAL_DELIVERY: {
  [factionKey]: {
    targetPort: string,       // Destination port key
    requiredGood: string,     // Good to deliver
    requiredQty: number,      // Quantity
    gold: number,             // Reward gold
    fame: number,             // Reward fame
    faction: string,          // Commissioning faction
    risk: string,             // "low"
    name: string,
    description: string,
    repImpact: { [faction]: number },
    tutorial: true
  }
}
```

---

## 13. TUTORIAL_HUNT

**Purpose**: Pre-built **tutorial combat mission** injected after the player hires their first crew.

### Structure
```js
TUTORIAL_HUNT: {
  type: "combat",
  name: string,
  description: string,
  faction: string,
  risk: "low",
  gold: number,
  fame: number,
  infamyGain: 0,
  repImpact: {},
  tutorial: true,
  enemy: { name, faction, hull, maxHull, cannons, crew, speed }
}
```

---

## 14. QM_DIALOGUE

**Purpose**: Scripted dialogue lines for the **Quartermaster (QM)** character in `"full"` onboarding mode.

### Structure (new keys)
```js
QM_DIALOGUE: {
  [stepKey: string]: (qmName: string, ...args) => string
}
```

### Current step keys:
- `step0_welcome`
- `step1_accepted` (not used? may be legacy)
- `step1_contractAccepted`
- `step2_marketOpen`
- `step2_stocked`
- `step3_mapOpen`
- `step4_sailing`
- `step5_arrival`
- `step5_delivered`
- `step6_crewOpen`
- `step6_hired`
- `step6b_huntAccepted`
- `step6b_victory`
- `step7_shipyardOpen`
- `step7_repaired`
- `step8_journalOpen`
- `step9_departure`
- `tutorialAbandonRefuse`

---

## 15. DEFAULT_CAREER

**Purpose**: Default template for `state.career` (lifetime statistics). Initialized on `START_GAME` if missing.

### Structure
```js
DEFAULT_CAREER: {
  goldEarned: 0,
  goldSpent: 0,
  battles: { won: 0, lost: 0, fled: 0 },
  shipsSunk: 0,
  shipsPlundered: 0,
  crewHired: 0,
  crewLost: { inBattle: 0, inStorm: 0, deserted: 0, other: 0 },
  crewDismissed: 0,
  longestCrewTenure: 0,
  portsVisited: [],
  shipsOwned: [],
  stormsSurvived: 0,
  contrabandSeized: 0,
  missionLog: [],
  combatLog: [],
}
```

---

## 16. SURRENDER_CONSEQUENCE

**Purpose**: Defines consequences when the player surrenders during different encounter types.

### Structure
```js
SURRENDER_CONSEQUENCE: {
  [encounterType: string]: {
    loseGoldPercent?: number,
    loseCargoPercent?: number,
    goldFinePct?: number,      // % of contraband value as fine
    loseDays?: number,
    moralePenalty?: number,
    rep_loss?: number,
    loseContraband?: boolean,
    loseCargo?: boolean,
    infamyGain?: number
  }
}
```

### Current consequences
| Encounter Type | Gold Loss | Cargo Loss | Crew Loss | Infamy | Morale | Days Lost | Rep Loss |
|---|---|---|---|---|---|---|---|
| `navy_patrol` | 40% of contraband value (fine) | Contraband + 50% other cargo | 0 | +2 | -15 | 0 | -5 |
| `hostile_port_entry` | 30% | All | 0 | 0 | -20 | +5 | -5 |
| `named_rival` | 40% | — | 0 | 0 | -25 | 0 | -10 |
| `random` | — | 20% | 0 | 0 | -8 | 0 | 0 |

---

## 17. COMBAT_LOG_TEMPLATES

**Purpose**: Templates for generating **round-by-round combat log entries** in `BattleScreen`. Used by `buildRoundLog` in `engine_battle.js`.

### Structure (updated for B11)
```js
COMBAT_LOG_TEMPLATES: {
  naval: {
    player: { broadside, precision_hit, precision_miss, grapple_success, grapple_fail, evade_success, evade_fail, close_distance_success, open_distance_success },
    npc:    { broadside, precision_hit, precision_miss, grapple_success, grapple_fail, evade_success, evade_fail, close_distance_success, open_distance_success },
    combined: {
      close_vs_open_player_wins, close_vs_open_enemy_wins,
      open_vs_close_player_wins, open_vs_close_enemy_wins,
      both_close, both_open
    }
  },
  boarding: {
    combined: {
      continue_vs_continue, continue_vs_fall_back, continue_vs_surrender,
      fall_back_vs_continue, fall_back_vs_fall_back, fall_back_vs_surrender,
      demand_surrender_vs_continue_success, demand_surrender_vs_continue_fail,
      demand_surrender_vs_fall_back, demand_surrender_vs_surrender,
      surrender_vs_anything, enemy_surrender
    },
    outcome: { player_wipeout, enemy_wipeout, player_surrendered, enemy_surrendered, returned_to_naval }
  }
}
```

### Template Variables
- `{hull}`: Hull damage dealt.
- `{crew}`: Crew lost.
- `{name}`: Enemy ship name.
- `{distance}`: New distance band (for movement logs).
- `{crewLost}` / `{enemyCrewLost}`: Crew losses in boarding.
- `{lostNames}`: Names of crew lost (if any).

---

## 18. ARRIVAL_MESSAGES

**Purpose**: Random messages for port arrivals. Used by `pickArrivalMessage` in `engine_port.js`.

### Structure
```js
ARRIVAL_MESSAGES: (portName: string, state: object) => string[]
```

---

## 19. MARKET_FLAVOUR

**Purpose**: Atmospheric text for the **Market screen**. Generated by `G.generateMarketFlavour` in `generators.js`.

### Structure
```js
MARKET_FLAVOUR: {
  gold_rich, gold_comfortable,
  hold_empty, hold_light, hold_half, hold_full,
  price_surplus, price_shortage,
  rare_good, tobacco_present, slaves_present,
  fame_recognised, fame_legendary,
  infamy_wanted, infamy_notorious,
  port_english, port_spanish, port_french, port_dutch, port_pirate,
  ambiance
}
```

---

## 20. NPC AI — Data Constants

**Purpose**: Defines NPC combat AI personality weights and encounter-type modifiers.

### AI_ARCHETYPES
Base personality weights per faction. Used by the AI scorer in `logic_combat_encounter.js`.

```js
AI_ARCHETYPES: {
  english:  { broadside: 1.0, precision: 1.0, close: 0.8, open: 0.8, grapple: 0.7 },
  spanish:  { broadside: 1.2, precision: 0.8, close: 0.6, open: 0.7, grapple: 0.5 },
  french:   { broadside: 0.9, precision: 1.1, close: 1.0, open: 0.7, grapple: 0.8 },
  dutch:    { broadside: 1.0, precision: 1.0, close: 0.7, open: 1.1, grapple: 0.5 },
  pirate:   { broadside: 0.8, precision: 0.7, close: 1.3, open: 0.5, grapple: 1.4 },
}
```

### AI_ORIGIN_MODIFIERS
Small additive deltas to grapple/continue-fighting weight, keyed by encounter type.

```js
AI_ORIGIN_MODIFIERS: {
  mission_combat:     { grapple: +0.3, continueFighting: +0.2 },
  escort_defend:      { grapple: -0.3, continueFighting: -0.2 },
  hostile_port_entry: { grapple: +0.2 },
  navy_patrol:        {},
  random:              {},
}
```

---

## 21. Combat Constants

### DISTANCE_DAMAGE_MULTIPLIERS
```js
DISTANCE_DAMAGE_MULTIPLIERS: {
  broadside: { far: 0.6, medium: 1.0, close: 0.9 },
  precision: { far: 1.1, medium: 1.0, close: 0.7 },
}
```

### LEGAL_ACTIONS_BY_DISTANCE
```js
LEGAL_ACTIONS_BY_DISTANCE: {
  far:    ["broadside", "precision", "close_distance", "evade"],
  medium: ["broadside", "precision", "close_distance", "open_distance"],
  close:  ["broadside", "precision", "open_distance", "grapple"],
}
```

---

## 22. Constants Summary

| Constant | Value | Purpose |
|---|---|---|
| `PATROL_FINE_RATE` | `0.20` | Fine = 20% of seized contraband value |
| `PLUNDER_GOLD_RATIO` | `0.20` | 20% of plunder value is gold, 80% is cargo |
| `CURRENT_STATE_VERSION` | `2` | Current save schema version (defined in engine_core.js) |

---

## 23. Dependencies & Usage Notes

### Imported by

| Consumer | Uses |
|---|---|
| `logic_core.js` | `PORTS`, `SHIPS`, `FACTIONS`, `EQUIPMENT`, `RESOURCES`, `RANDOM_EVENTS` (for condition callbacks only) |
| `logic_economy_crew.js` | `PORTS`, `FACTIONS`, `RESOURCES`, `GOODS_AVAILABILITY`, `FACTION_PRICE_MODIFIERS`, `AVAILABILITY_PRICE_MODIFIERS` |
| `logic_travel_events.js` | `PORTS`, `SHIPS`, `RANDOM_EVENTS` |
| `logic_combat_encounter.js` | `SHIPS`, `FACTIONS`, `AI_ARCHETYPES`, `AI_ORIGIN_MODIFIERS`, `DISTANCE_DAMAGE_MULTIPLIERS`, `LEGAL_ACTIONS_BY_DISTANCE`, `ENCOUNTER_FLAVOUR`, `SURRENDER_CONSEQUENCE`, `PATROL_FINE_RATE` |
| `generators.js` | `MISSION_*`, `FACTION_PLUNDER_GOODS`, `ENEMY_SHIP_NAMES`, `CREW_*`, `BIO_*`, `PORT_GOSSIP_TEMPLATES`, `MARKET_FLAVOUR`, `COMBAT_LOG_TEMPLATES`, `ARRIVAL_MESSAGES`, `STARTS`, `TUTORIAL_DELIVERY`, `TUTORIAL_HUNT` |
| `engine_*.js` | `RANDOM_EVENTS`, `EQUIPMENT`, `STARTS`, `TUTORIAL_DELIVERY`, `TUTORIAL_HUNT`, `SURRENDER_CONSEQUENCE`, `FACTION_PRICE_MODIFIERS`, `GOODS_AVAILABILITY` |
| `screens_*.jsx` | `PORTS`, `SHIPS`, `FACTIONS`, `EQUIPMENT`, `RESOURCES` (for UI rendering) |
| `ship-sprite.js` | `SHIP_VISUALS`, `FACTIONS` (for SVG rendering) |

### Usage Rules

1. **No Logic**: These files contain **only data**. All logic lives in `logic_*.js` or `generators.js`.
2. **Immutability**: Do not modify `window.D` at runtime. Treat it as read-only.
3. **Validation**: All data should be verified by tests (see `tests/tests_logic.js`).
4. **New Data**: When adding new constants, document them in this spec.
5. **Text Split**: Text-heavy constants (names, templates, flavour) go in `data_text.js`. Numeric/structural constants go in `data.js`.