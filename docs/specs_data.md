# Game Design — Data Constants Specification

---

## Overview

This document specifies the **structure, purpose, and constraints** of all constants defined across two files:

| File | Namespace | Contents |
|---|---|---|
| `data.js` | `window.D` | Game constants (ports, ships, factions, equipment, resources, missions, events, starts, career) |
| `data_text.js` | extends `window.D` | Text constants (crew names, bio templates, gossip templates, encounter flavour, mission name parts, enemy ship names, combat logs, arrival messages, market flavour) |

`data_text.js` loads after `data.js` and extends the same `window.D` namespace using `Object.assign`.

**Core Principles:**

- All data is **static** and **immutable** at runtime.
- No logic functions or side effects (exception: event `condition` callbacks in `RANDOM_EVENTS`).
- Exported as a single object: `window.D = { PORTS, SHIPS, FACTIONS, ... }`.

---

## 1. FACTIONS

**Purpose**: Defines political factions, their colours, and rivalries.

### Structure

```javascript
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
- **Reputation Decay**: Reputation with rival factions decays faster (see `decayReputation` in `logic.js`).

---

## 2. PORTS

**Purpose**: Defines all ports in the Caribbean map, including coordinates, factions, services, and unlock conditions.

### Structure

```javascript
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

```javascript
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
| 2 | Schooner | 110 | 55 | 8 | 11 | 20,000 | 50 | 12 | 240 | 1/0/1/1 | Smuggler |
| 2 | Merchantman | 180 | 60 | 5 | 8 | 25,000 | 50 | 14 | 700 | 1/0/1/2 | Trader |
| 2 | Brigantine | 150 | 80 | 15 | 10 | 40,000 | 50 | 14 | 448 | 1/1/1/1 | Combat |
| 3 | Corvette | 180 | 90 | 18 | 11 | 130,000 | 100 | 16 | 500 | 1/1/1/1 | Naval |
| 3 | Frigate | 220 | 120 | 24 | 9 | 250,000 | 100 | 18 | 720 | 1/1/1/1 | Warship |
| 3 | Fluyt | 180 | 70 | 6 | 7 | 100,000 | 100 | 24 | 1,100 | 1/0/1/3 | Cargo |
| 4 | Galleon | 300 | 150 | 30 | 6 | 500,000 | 150 | 22 | 1,320 | 2/2/1/2 | Heavy Combat |
| 4 | Ship of the Line | 420 | 280 | 50 | 5 | 1,000,000 | 150 | 28 | 1,600 | 2/2/1/2 | Endgame |

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
```javascript
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
```javascript
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
      hullBonus?: number,   // Additive hull HP bonus (rare)
      cannonBonus?: number, // Additive cannon bonus
      speedBonus?: number,  // Additive speed bonus
      speedPenalty?: number, // Additive speed penalty
      holdPct?: number,      // Multiplicative hold bonus (e.g., 0.25 = +25%)
      moraleBonus?: number, // Additive morale bonus
      repairCostPct?: number, // Multiplicative repair cost penalty (e.g., 0.40 = +40%)
      maxDays?: number,      // Additive max days at sea
      crewLossMult?: number, // Multiplicative crew loss modifier (e.g., 0.60 = -40% loss)
      missionCombatFameBonus?: number, // Additive fame bonus for combat missions
      combatHeatMult?: number, // Multiplicative heat gain from combat (e.g., 2 = double heat)
      repGainBonus?: number,   // Additive reputation gain bonus
      contrabandAvoidChance?: number, // Probability to avoid contraband detection (0.0-1.0)
      calmImmune?: boolean,   // Immune to calm wind delays
      stormHullImmune?: boolean // Immune to storm hull damage
    }
  }
}
```

### Equipment by Slot

#### Hull Slot
| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `reinforced_hull` | Reinforced Hull | 500 | 100 | `hullPct: 0.20` (+20% hull) | Yes | — | — |
| `ironclad_plates` | Ironclad Plates | 2,000 | 400 | `hullPct: 0.35`, `speedPenalty: -2` | Yes | 50 | 100 |
| `copper_plating` | Copper Plating | 3,500 | 300 | `speedBonus: 2`, `repairCostPct: 0.40` (+40% repair cost) | Yes | 100 | 150 |
| `tar_sealed_hull` | Tar-Sealed Hull | 1,200 | 150 | `hullPct: 0.10` (+10% hull), `maxDays: 2`, `speedPenalty: -1`, `calmImmune: true` | Yes | 20 | 60 |

#### Armament Slot
| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `extra_cannons` | Extra Cannons | 800 | 50 | `cannonBonus: 2`, `speedPenalty: -1` | Yes | 20 | — |
| `grapeshot_supply` | Grapeshot Supply | 1,800 | 100 | `crewDmgPct: 0.50` (+50% crew damage), `hullDmgPct: -0.20` (-20% hull damage) | Yes | 50 | 100 |
| `long_guns` | Long Guns | 3,000 | 150 | `cannonBonus: -2`, `precisionHitPct: 0.10` (+10% precision hit chance) | Yes | 100 | 150 |

#### Rigging Slot
| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `extra_sails` | Extra Sails | 600 | 50 | `speedBonus: 3`, `hullPct: -0.10` (-10% hull) | Yes | — | — |
| `storm_rigging` | Storm Rigging | 900 | 75 | `maxDays: 2`, `speedPenalty: -1`, `stormHullImmune: true` | Yes | 20 | 60 |
| `lateen_rig` | Lateen Rig | 1,500 | 150 | `maxDays: 1`, `hullPct: -0.10` (-10% hull) | No | 50 | 100 |
| `war_pennants` | War Pennants | 3,500 | 150 | `missionCombatFameBonus: 1`, `combatHeatMult: 2` (double heat from combat) | Yes | 100 | 100 |

#### Special Slot
| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `expanded_hold` | Expanded Hold | 800 | 50 | `holdPct: 0.20` (+20% hold) | Yes | — | — |
| `hidden_compartment` | Hidden Compartment | 1,000 | 100 | `contrabandAvoidChance: 0.50` (50% chance to avoid detection) | Yes | 20 | 60 |
| `surgeons_bay` | Surgeon's Bay | 2,000 | 100 | `crewLossMult: 0.60` (-40% crew loss in combat) | Yes | 50 | 100 |
| `officer_quarters` | Officer Quarters | 1,800 | 100 | `maxCrew: 10`, `holdPct: -0.20` (-20% hold) | Yes | 50 | 100 |
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
| `rum` | Rum | 30 | ±20% | No | 0 | cask | Common in pirate ports |
| `sugar` | Sugar | 40 | ±25% | No | 0 | sack | — |
| `timber` | Timber | 25 | ±15% | No | 0 | plank | — |
| `cloth` | Cloth | 55 | ±20% | No | 0 | bale | — |
| `spices` | Spices | 120 | ±45% | No | 0 | chest | — |
| `silk` | Silk | 160 | ±30% | No | 0 | bolt | — |
| `coffee` | Coffee | 70 | ±25% | No | 0 | bag | — |
| `cocoa` | Cocoa | 90 | ±30% | No | 0 | crate | — |
| `weapons` | Weapons | 80 | ±35% | No | 0 | crate | — |
| `tobacco` | Tobacco | 90 | ±30% | **Yes** | 0 | bale | Found in Havana, Tortuga, Providencia, Nassau |
| `silver` | Silver | 250 | ±35% | No | 0 | chest | — |
| `slaves` | Slaves | 220 | ±60% | **Yes** | **+1** | person | Available in Portobelo, Cartagena, Libertalia, Veracruz |

### Price Calculation
- **Market Price**: `basePrice ± (basePrice × variance × random(-1, 1))`
- **Buy Price**: `marketPrice × 1.10` (10% markup)
- **Sell Price**: `marketPrice × 0.90` (10% discount)

### Contraband Rules
- `illegal: true`: Carrying these goods triggers **patrol inspection risk** at sea and when entering lawful ports.
- **Slaves** add **+1 infamy per unit purchased**.
- **Patrol Inspection**:
  - If contraband is found: goods are **seized**, fine = `PATROL_FINE_RATE × seizedValue` (50%), **+2 infamy**, **-5 faction reputation**, **-10 morale**.
  - **Hidden Compartment**: 50% chance to avoid detection.
- **PATROL_FINE_RATE**: `0.50` (50% of seized goods' value).

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
| 0 (Unknown) | 80-100 | 100-125 | 125-150 | 150-200 |
| 1 (Recognised) | 400-1,500 | 1,500-5,000 | 5,000-7,000 | 7,000-10,000 |
| 2 (Notorious) | 2,000-7,000 | 7,000-10,000 | 10,000-18,000 | 18,000-22,000 |
| 3 (Legendary) | 6,000-15,000 | 15,000-30,000 | 30,000-50,000 | 50,000-75,000 |
| 4 (Immortal) | 15,200-25,000 | 25,000-50,000 | 50,000-80,000 | 80,000-100,000 |

**Fame Tiers**: 0 (< 50), 1 (50-99), 2 (100-199), 3 (200-349), 4 (350+)

---
### Mission Enemy Ranges (`MISSION_ENEMY_RANGES`)
| Fame Tier | Hull | Cannons | Crew |
|---|---|---|---|
| 0 | 20-45 | 2-6 | 8-18 |
| 1 | 40-75 | 5-10 | 15-35 |
| 2 | 65-110 | 8-16 | 25-55 |
| 3 | 95-155 | 13-22 | 40-80 |
| 4 | 135-210 | 18-30 | 60-110 |

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
| 0 | rum, sugar, timber, cloth |
| 1 | rum, sugar, timber, cloth, coffee, cocoa |
| 2 | coffee, cocoa, cloth, weapons, spices |
| 3-4 | spices, silk, weapons, cocoa |

---
### Smuggle Goods by Tier (`SMUGGLE_GOODS_BY_TIER`)
| Tier | Eligible Goods |
|---|---|
| 0-1 | rum, tobacco |
| 2-4 | rum, tobacco, slaves |

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
| 0 | 27 | 34 | 41 |
| 1 | 285 | 975 | 1,800 |
| 2 | 1,350 | 2,550 | 4,200 |
| 3 | 3,150 | 6,750 | 12,000 |
| 4 | 6,030 | 11,250 | 19,500 |

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
```javascript
RANDOM_EVENTS: [
  {
    id: string,                // Unique identifier (e.g., "storm")
    type: string,              // "hazard" | "choice" | "reward" | "crew" | "discovery"
    title: string,             // Event title (e.g., "Violent Storm!")
    desc: string,              // Event description
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
        }
      }
    ]
  }
]
```

---
### Event List

| ID | Type | Title | Condition | Key Outcomes |
|---|---|---|---|---|
| `storm` | hazard | Violent Storm! | Always | Hull damage 10-20, crew loss 1-3, days lost 1-2 |
| `calm_winds` | hazard | Doldrums | Always | Days lost 1-3, morale -5 |
| `distressed_merchant` | choice | Merchant in Distress | Always | Help (fight pirates), plunder (attack merchant), or ignore |
| `drifting_wreck` | choice | Drifting Wreck | Always | Search (gold/cargo/survivor/trap) or sail on |
| `drifting_sailors` | choice | Marooned Sailors | Always | Rescue (gain crew, possible hidden trait) or sail on |
| `treasure_map` | reward | Treasure Map Found! | Always | Gold reward 50-200 |
| `whale_sighting` | reward | Whale Sighting | Always | Morale +5 |
| `mutiny` | crew | Mutiny! | `morale < 20` | Crush (lose crew, gain mutineer tags) or negotiate (lose gold) |
| `deserters` | crew | Deserters | `morale < 40` | Lose 1-3 crew |
| `mysterious_chart` | discovery | A Dying Sailor's Secret | `fame >= 150` | Gain `map_fragment_libertalia` |
| `wreckers_chart` | discovery | The Wrecker's Map | `gold >= 5000` | Pay 5,000g for `map_fragment_lasAves` or decline |
| `drunkard_event` | crew | Rum Thief! | Has rum in hold + crew with `hidden_drunkard` tag | Reveals drunkard tag, consumes 1 rum |

### Event Triggers
- **At Sea**: ~10% chance per day during `ADVANCE_DAY` (see `maybeRandomEvent` in `engine_voyage.js`).
- **Conditional**: Events with `condition` only fire if the state meets the criteria.
- **Exclusive**: Only **one event per day** (first triggered event blocks others).
- **Skipped During Onboarding**: Random events are **suppressed** if `state.onboarding?.enabled && !state.onboarding?.completed`.

---
## 11. STARTS (New Faction-Based System)

**Purpose**: Defines **faction-based starting scenarios** with unique characters, backstories, and initial conditions. Replaces the old scenario-array system.

### Structure
```javascript
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
    pirate: string           // e.g., "tortuga"
  },
  factionRepAdjust: {         // Reputation adjustments for each faction
    [factionKey]: {           // e.g., "english"
      [otherFactionKey]: number // e.g., "spanish": -10, "french": +5
    }
  },
  factionBackstory: {         // Opening narrative and log lines for each faction
    [factionKey]: {
      openingLog: string[],    // Log entries to show at game start
      backstory: string        // Flavour text for scenario selection
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

### Starting Scenarios

| Faction | Start Port | Gold | Ship | Hold | Backstory Theme | QM Character |
|---|---|---|---|---|---|---|
| English | Port Royal | 200 | Dinghy | { food: 5, water: 5 } | Forged commission | William "Ironhook" |
| Spanish | Havana | 205 | Dinghy | { food: 5, water: 5 } | Governor's errand | Elena "La Sombra" |
| French | Port-de-Paix | 190 | Dinghy | { food: 5, water: 5 } | Cartographer's debt | Luc "Le Renard" |
| Dutch | Curaçao | 205 | Dinghy | { food: 5, water: 5 } | Company's ledger | Pieter "De Boekhouder" |
| Pirate | Tortuga | 190 | Dinghy | { food: 5, water: 5 } | The Survivor | Rosa "Scarlet" |

### Reputation Adjustments
Each faction starts with **reputation adjustments** to reflect their political standing:
- **English**: +10 with England, -10 with Spain/France
- **Spanish**: +10 with Spain, -10 with England/Dutch
- **French**: +10 with France, -10 with England
- **Dutch**: +10 with Dutch, -10 with Spain
- **Pirate**: -10 with all nations (except pirate ports)

---
## 12. TUTORIAL_DELIVERY

**Purpose**: Pre-built **tutorial delivery mission** auto-accepted in `"full"` onboarding mode. Introduces the player to missions and trading.

### Structure
```javascript
TUTORIAL_DELIVERY: {
  [factionKey]: {            // One per starting faction
    name: string,            // Mission name (e.g., "A Governor's Errand")
    desc: string,            // Mission description
    type: "trade",           // Always trade mission
    risk: "low",             // Always low risk
    faction: string,         // Commissioning faction
    targetPort: string,      // Destination port
    requiredGood: string,    // Good to deliver (e.g., "sugar")
    requiredQty: number,     // Quantity to deliver
    gold: number,            // Reward gold
    fame: number,            // Reward fame
    repImpact: { [faction]: number }, // Reputation changes
    starter: true            // Marks as tutorial mission
  }
}
```

### Example (English)
```javascript
TUTORIAL_DELIVERY: {
  english: {
    name: "A Governor's Errand",
    desc: "Deliver sugar to Kingston. The Governor will reward you handsomely.",
    type: "trade",
    risk: "low",
    faction: "english",
    targetPort: "kingston",
    requiredGood: "sugar",
    requiredQty: 5,
    gold: 200,
    fame: 10,
    repImpact: { english: +3 },
    starter: true
  },
  // Similar for spanish, french, dutch, pirate
}
```

---
## 13. TUTORIAL_HUNT

**Purpose**: Pre-built **tutorial combat mission** injected after the player hires their first crew. Introduces combat mechanics.

### Structure
```javascript
TUTORIAL_HUNT: {
  name: string,             // Mission name (e.g., "The Rat of Port Royal")
  desc: string,             // Mission description
  type: "combat",           // Always combat mission
  risk: "low",              // Always low risk
  faction: string,          // Commissioning faction (matches player's faction)
  enemy: {                  // Pre-defined enemy
    name: string,           // e.g., "The Rat"
    hull: number,           // e.g., 40
    cannons: number,       // e.g., 4
    crew: number,           // e.g., 10
    faction: string,       // e.g., "english"
    gold: number            // e.g., 50
  },
  gold: number,             // Reward gold (e.g., 150)
  fame: number,             // Reward fame (e.g., 15)
  repImpact: { [faction]: number },
  starter: true,            // Marks as tutorial mission
  tutorial: true            // Marks as onboarding mission
}
```

---
## 14. QM_DIALOGUE

**Purpose**: Scripted dialogue lines for the **Quartermaster (QM)** character in `"full"` onboarding mode.

### Structure
```javascript
QM_DIALOGUE: {
  [stepKey: string]: (state) => string // Function returning dialogue text
}
```

### Dialogue Steps
| Step Key | Trigger | Example Text |
|---|---|---|
| `qm_welcome` | `START_GAME` | `"Ahoy, Captain! I'm [QM name], your Quartermaster. I'll guide you through your first steps."` |
| `qm_first_contract` | `TAKE_MISSION` (tutorial delivery) | `"Good choice! Deliver the goods to [port] to complete your first mission."` |
| `qm_need_crew` | `SAIL_TO` (if crew < 5) | `"You'll need more hands to sail safely. Visit the tavern to hire crew."` |
| `qm_need_provisions` | `SAIL_TO` (if food/water < 5) | `"Don't forget provisions! Your crew won't sail far without food and water."` |
| `qm_shipyard` | `NAVIGATE` to shipyard | `"Here you can buy new ships and equipment. Your current [ship] is a good start, but you'll want to upgrade soon."` |
| `qm_combat_hint` | First `INTERCEPT_FIGHT` | `"In combat, you can broadside, use precision shots, grapple, or evade. Try them all!"` |
| `qm_first_victory` | `DISMISS_BATTLE` (victory) | `"Well done, Captain! Victory tastes sweet, but remember: every battle has a cost."` |
| `qm_farewell` | `ONBOARDING_COMPLETE` | `"You've learned the basics, Captain. The Caribbean is yours now. Fair winds!"` |

---
## 15. DEFAULT_CAREER

**Purpose**: Default template for `state.career` (lifetime statistics). Initialized on `START_GAME` if missing.

### Structure
```javascript
DEFAULT_CAREER: {
  // Lifetime counters
  goldEarned: 0,         // Total gold earned (positive deltas)
  goldSpent: 0,          // Total gold spent (negative deltas)
  crewHired: 0,          // Total crew hired
  crewDismissed: 0,      // Total crew dismissed
  longestCrewTenure: 0,  // Max daysAboard for any crew member

  // Combat stats
  battles: {
    won: 0,
    lost: 0,
    fled: 0
  },
  shipsSunk: 0,          // Enemy ships sunk (hull-zero victories)
  shipsPlundered: 0,     // Enemy ships plundered (grapple victories)

  // Exploration stats
  portsVisited: [],      // List of port keys visited
  stormsSurvived: 0,     // Storm events survived
  contrabandSeized: 0,   // Times contraband was seized by patrols

  // Detailed logs
  combatLog: [],          // List of combat entries (see engine_career.js)
  missionLog: []          // List of mission entries (see engine_career.js)
}
```

---
## 16. SURRENDER_CONSEQUENCE

**Purpose**: Defines consequences when the player surrenders during different encounter types.

### Structure
```javascript
SURRENDER_CONSEQUENCE: {
  [encounterType: string]: {
    loseGoldPercent?: number,  // % of gold to lose
    loseCargoPercent?: number,  // % of cargo to lose
    loseGoldFine?: number,      // Fixed gold fine
    moralePenalty?: number,     // Morale drop
    loseDays?: number,          // Days added to voyage
    rep_loss?: number,          // Reputation loss at current port
    loseCargo?: boolean,        // Lose all cargo?
    loseContraband?: boolean,   // Lose only contraband?
    infamyGain?: number         // Infamy increase
  }
}
```

### Consequences by Encounter Type

| Encounter Type | Gold Loss | Cargo Loss | Crew Loss | Infamy | Morale | Days Lost | Rep Loss |
|---|---|---|---|---|---|---|---|
| `patrol` | 50% | Contraband only | 0 | 0 | 0 | 0 | 0 |
| `navy_patrol` | 50% | Contraband only | 0 | +2 | -10 | 0 | -5 |
| `hostile_port_entry` | 30% | All | 0 | 0 | -10 | 0 | -5 |
| `random` | 50% | All | 0 | 0 | -5 | 0 | 0 |
| `mission_combat` | 50% | All | 0 | +2 | -5 | 0 | -5 |

---
## 17. COMBAT_LOG_TEMPLATES

**Purpose**: Templates for generating **round-by-round combat log entries** in `BattleScreen`. Used by `buildRoundLog` in `engine_combat.js`.

### Structure
```javascript
COMBAT_LOG_TEMPLATES: {
  player: {
    broadside: string[],    // e.g., ["You fire a devastating broadside, raking the enemy's hull!"]
    precision_hit: string[], // e.g., ["Your precision shot tears through the enemy's rigging!"]
    precision_miss: string[],// e.g., ["Your precision shot falls short of the mark."]
    grapple_success: string[], // e.g., ["Your crew swarms the enemy deck!"]
    grapple_fail: string[],   // e.g., ["Your boarding attempt is repelled with heavy losses!"]
    evade_success: string[], // e.g., ["You outmaneuver the enemy and escape unscathed!"]
    evade_fail: string[]      // e.g., ["The enemy closes the distance despite your efforts!"]
  },
  npc: {
    broadside: string[],    // e.g., ["The enemy returns fire, damaging your hull!"]
    precision_hit: string[], // e.g., ["A well-aimed enemy shot strikes your mast!"]
    precision_miss: string[],// e.g., ["The enemy's shot sails wide."]
    grapple_success: string[], // e.g., ["The enemy boards your ship!"]
    grapple_fail: string[]    // e.g., ["The enemy's boarding attempt fails!"]
  }
}
```

### Template Variables
- `{hull}`: Hull damage dealt.
- `{crew}`: Crew lost.
- `{name}`: Enemy ship name.

---
## 18. ARRIVAL_MESSAGES

**Purpose**: Random messages for port arrivals. Used by `pickArrivalMessage` in `engine_port.js`.

### Structure
```javascript
ARRIVAL_MESSAGES: string[];
// Example entries:
[
  (portName) => `Arrived at ${portName}.`,
  (portName) => `Dropped anchor at ${portName}.`,
  (portName) => `Made port at ${portName}.`,
  (portName) => `The harbour of ${portName} comes into view.`,
  (portName) => `${portName} at last. The crew is glad to see land.`,
  (portName) => `${portName} welcomes you, for now.`
]
```

---
## 19. MARKET_FLAVOUR

**Purpose**: Atmospheric text for the **Market screen**. Generated by `G.generateMarketFlavour` in `generators.js`.

### Structure
```javascript
MARKET_FLAVOUR: {
  gold: {
    poor: string[],       // e.g., ["Your purse feels light..."]
    average: string[],    // e.g., ["A moderate sum of gold jingles in your pocket."]
    rich: string[],       // e.g., ["Your wealth commands respect in these parts."]
    wealthy: string[]     // e.g., ["Merchants bow as you enter - a captain of means!"]
  },
  hold: {
    empty: string[],      // e.g., ["Your hold yawns empty."]
    light: string[],      // e.g., ["Plenty of room for more cargo."]
    full: string[],       // e.g., ["Your hold is nearly bursting!"]
    overloaded: string[]  // e.g., ["Your ship groans under the weight of your greed."]
  },
  prices: {
    high: string[],       // e.g., ["Prices are steep today - supply is low."]
    low: string[],        // e.g., ["A buyer's market! Goods are cheap."]
    extreme: string[]     // e.g., ["The market is in turmoil - a rare opportunity!"]
  },
  faction: {
    [factionKey]: string[] // e.g., ["The English flag flies high here."]
  }
}
```

---
## 20. Constants Summary

| Constant | Value | Purpose |
|---|---|---|
| `PATROL_FINE_RATE` | `0.50` | Fine = 50% of seized contraband value |
| `PLUNDER_GOLD_RATIO` | `0.20` | 20% of plunder value is gold, 80% is cargo |

---
## 21. Dependencies & Usage Notes

### Imported by

| Consumer | Uses |
|---|---|
| `logic.js` | `PORTS`, `SHIPS`, `FACTIONS`, `EQUIPMENT`, `RESOURCES`, `RANDOM_EVENTS` |
| `generators.js` | `MISSION_*`, `FACTION_PLUNDER_GOODS`, `ENEMY_SHIP_NAMES`, `CREW_*`, `BIO_*`, `PORT_GOSSIP_TEMPLATES`, `MARKET_FLAVOUR`, `COMBAT_LOG_TEMPLATES`, `ARRIVAL_MESSAGES` |
| `engine_*.js` | `RANDOM_EVENTS`, `EQUIPMENT`, `STARTS`, `ENCOUNTER_FLAVOUR`, `SURRENDER_CONSEQUENCE`, `TUTORIAL_DELIVERY`, `TUTORIAL_HUNT` |
| `screens_*.jsx` | `PORTS`, `SHIPS`, `FACTIONS`, `EQUIPMENT`, `RESOURCES` (for UI rendering) |
| `ship-sprite.js` | `SHIP_VISUALS`, `FACTIONS` (for SVG rendering) |

### Usage Rules

1. **No Logic**: These files contain **only data**. All logic lives in `logic.js` or `generators.js`.
2. **Immutability**: Do not modify `window.D` at runtime. Treat it as read-only.
3. **Validation**: All data should be verified by tests (see `tests/tests_logic.js`).
4. **New Data**: When adding new constants, document them in this spec.
5. **Text Split**: Text-heavy constants (names, templates, flavour) go in `data_text.js`. Numeric/structural constants go in `data.js`.
