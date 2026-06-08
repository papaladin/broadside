# specs_data.md -- Data Constants Specification

---

## Overview

This document specifies the **structure, purpose, and constraints** of all constants defined across two files:

| File | Namespace | Contents |
|---|---|---|
| `data.js` | `window.D` | Game constants (ports, ships, factions, equipment, resources, missions, events, starts) |
| `data_text.js` | extends `window.D` | Text constants (crew names, bio templates, gossip templates, encounter flavour, mission name parts, enemy ship names) |

`data_text.js` loads after `data.js` and extends the same `window.D` namespace using `Object.assign`.

**Core Principles:**

- All data is **static** and **immutable** at runtime.
- No logic functions or side effects (exception: event `condition` callbacks in RANDOM_EVENTS).
- Exported as a single object: `window.D = { PORTS, SHIPS, FACTIONS, ... }`.

---

## 1. FACTIONS

**Purpose**: Defines political factions, their colours, and rivalries.

### Structure

```javascript
FACTIONS: {
  [factionKey: string]: {
    label: string,        // Display name (e.g., "English")
    color: string,        // Hex colour for UI
    rivalFactions: string[] // Faction keys that are rivals
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
- **Reputation Decay**: Reputation with rival factions decays faster.

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
      type: "any" | "all",
      conditions: [
        { type: "fame" | "infamy" | "reputation" | "item", value: number | string, faction?: string }
      ]
    }
  }
}
```

### Port Categories

| Category | Count | Description | Example Ports |
|---|---|---|---|
| **Standard** | 16 | Visible and reachable from the start | `portRoyal`, `tortuga`, `havana` |
| **Remote** | 5 | Visible but require `minHull >= 101` (brigantine+) | `campeche`, `veracruz`, `bermuda` |
| **Hidden** | 4 | Not rendered until `unlockCondition` is satisfied | `roatan`, `dryTortugas`, `lasAves`, `libertalia` |

### Services

- `tavern`: Morale recovery, crew hiring.
- `shipyard`: Ship purchases, equipment install/remove.
- `crew`: Crew hiring.
- `missions`: Mission board access.

### Unlock Conditions

| Port | Unlock Condition |
|---|---|
| **Roatan** | Fame >= 50 **OR** Pirate reputation >= 65 |
| **Dry Tortugas** | Infamy >= 25 **AND** Pirate reputation >= 65 |
| **Las Aves** | Item: `map_fragment_lasAves` (from "The Wrecker's Map" event, costs 5,000g) |
| **Libertalia** | Fame >= 200 **AND** Item: `map_fragment_libertalia` (from "A Dying Sailor's Secret" event) |

---

## 3. SHIPS

**Purpose**: Defines all player and enemy ship types, including stats, costs, and equipment slot counts.

### Structure

```javascript
SHIPS: {
  [shipType: string]: {
    name: string,
    maxHull: number,
    maxCrew: number,
    cannons: number,
    speed: number,
    cost: number,
    requiredFame: number,
    maxDays: number,
    holdCapacity: number,
    slots: {               // Equipment slot counts per type
      hull: number,
      armament: number,
      rigging: number,
      special: number
    },
    desc: string
  }
}
```

### Ship Tiers

| Tier | Ship | Hull | Crew | Cannons | Speed | Cost | Fame | Days | Hold | Hull Slots | Arm Slots | Rig Slots | Spc Slots |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | Dinghy | 30 | 5 | 2 | 6 | 200 | 0 | 5 | 20 | 0 | 0 | 0 | 0 |
| 0 | Cutter | 60 | 20 | 6 | 20 | 1,500 | 0 | 8 | 80 | 1 | 0 | 0 | 0 |
| 1 | Sloop | 100 | 40 | 10 | 18 | 30,000 | 20 | 10 | 200 | 1 | 1 | 1 | 0 |
| 2 | Schooner | 110 | 55 | 8 | 19 | 70,000 | 50 | 12 | 240 | 1 | 0 | 1 | 1 |
| 2 | Merchantman | 180 | 60 | 5 | 10 | 60,000 | 50 | 14 | 600 | 1 | 0 | 0 | 1 |
| 2 | Brigantine | 150 | 80 | 15 | 14 | 150,000 | 50 | 14 | 448 | 1 | 1 | 1 | 1 |
| 3 | Corvette | 180 | 90 | 18 | 15 | 250,000 | 100 | 16 | 500 | 1 | 1 | 1 | 1 |
| 3 | Frigate | 220 | 120 | 24 | 12 | 500,000 | 100 | 18 | 720 | 1 | 1 | 1 | 2 |
| 3 | Fluyt | 180 | 70 | 6 | 9 | 200,000 | 100 | 24 | 1,100 | 1 | 0 | 1 | 1 |
| 4 | Galleon | 300 | 150 | 30 | 7 | 1,000,000 | 150 | 22 | 1,320 | 2 | 2 | 1 | 2 |
| 4 | Ship of the Line | 420 | 280 | 50 | 5 | 2,000,000 | 150 | 28 | 1,600 | 2 | 2 | 1 | 2 |

### Ship Progression Notes

- **Dinghy -> Cutter -> Sloop**: Early-game progression for new players.
- **Merchantman/Fluyt**: High hold capacity, low combat stats (trade-focused).
- **Corvette/Frigate**: Naval warships (combat-focused).
- **Galleon/Ship of the Line**: Endgame ships (high cost, high stats, most equipment slots).
- When buying a new ship, all installed equipment is **lost** (reset to empty). Removable equipment should be uninstalled to the locker first.

---
## 4. EQUIPMENT

**Purpose**: Defines all installable ship equipment, their costs, slot types, and stat effects. Replaces the former `UPGRADES` system.

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
      hullBonus?: number,   // Multiplicative hull HP bonus (0.2 = +20%)
      cannonBonus?: number, // Additive cannon bonus
      speedBonus?: number,  // Additive speed bonus
      holdPct?: number,     // Multiplicative hold bonus (0.25 = +25%)
      moraleBonus?: number, // Additive morale bonus
      hullPenalty?: number, // Multiplicative hull penalty
      speedPenalty?: number // Additive speed penalty
    }
  }
}
```

### Hull Slot Equipment

| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `reinforced_hull` | Reinforced Hull | 500 | 100 | `hullBonus: 0.2` (+20% hull) | Yes | -- | -- |
| `ironclad_plates` | Ironclad Plates | 2,000 | 400 | `hullBonus: 0.4, speedPenalty: -2` | Yes | 100 | 150 |
| `copper_plating` | Copper Plating | 1,200 | 250 | `speedBonus: 1` (+1 speed) | Yes | 50 | -- |
| `tar_sealed_hull` | Tar-Sealed Hull | 300 | 50 | `hullBonus: 0.1` (+10% hull) | No | -- | -- |

### Armament Slot Equipment

| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `extra_cannons` | Extra Cannons | 800 | 150 | `cannonBonus: 2` (+2 cannons) | Yes | 50 | -- |
| `grapeshot_supply` | Grapeshot Supply | 400 | 75 | `cannonBonus: 1` (+1 cannon) | No | -- | -- |
| `long_guns` | Long Guns | 1,500 | 300 | `cannonBonus: 4, speedPenalty: -1` | Yes | 100 | 100 |

### Rigging Slot Equipment

| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `extra_sails` | Extra Sails | 600 | 100 | `speedBonus: 1` | Yes | -- | -- |
| `storm_rigging` | Storm Rigging | 400 | 75 | `speedBonus: 1` (storm resistance) | No | -- | -- |
| `lateen_rig` | Lateen Rig | 900 | 150 | `speedBonus: 2, hullPenalty: -0.05` | Yes | 50 | -- |
| `war_pennants` | War Pennants | 200 | 25 | (cosmetic/heat visual) | No | -- | -- |

### Special Slot Equipment

| Key | Name | Cost | Install | Effects | Removable | Req Fame | Req Hull |
|---|---|---|---|---|---|---|---|
| `expanded_hold` | Expanded Hold | 800 | 150 | `holdPct: 0.25` (+25% hold) | Yes | -- | -- |
| `hidden_compartment` | Hidden Compartment | 600 | 100 | (hides contraband from inspection) | Yes | -- | -- |
| `surgeons_bay` | Surgeon's Bay | 1,000 | 200 | (reduces crew loss in combat) | Yes | 50 | 100 |
| `officer_quarters` | Officer's Quarters | 1,200 | 250 | `moraleBonus: 5` | Yes | 50 | 100 |
| `ornate_figurehead` | Ornate Figurehead | 300 | 50 | `moraleBonus: 3` | No | -- | -- |
| `navigation_tools` | Navigation Tools | 600 | 100 | `speedBonus: 1` (-1 travel day) | Yes | 50 | -- |

### Equipment Rules

- Ships have **fixed slot counts** (see `SHIPS[type].slots`). A ship with `slots: { hull: 1 }` can install exactly 1 hull equipment.
- **No slot conflicts**: Multiple items in the same slot (on ships with 2+ slots) stack additively.
- **Removable** equipment can be uninstalled to the **locker** (`state.equipmentInventory`) at no cost.
- **Non-removable** equipment is permanently installed (destroyed if ship is sold).
- **Buying a new ship clears all equipment** -- uninstall removable items to locker first.
- Equipment can be installed from the locker (no purchase cost, only `installFee`).

---

## 5. RESOURCES

**Purpose**: Defines all tradeable goods, their base prices, variance, legality, and units.

### Good List

| Key | Name | Base Price | Variance | Illegal | Infamy/Buy | Unit |
|---|---|---|---|---|---|---|
| `food` | Food | 3 | 0% | No | 0 | ration |
| `water` | Water | 2 | 0% | No | 0 | barrel |
| `rum` | Rum | 30 | +/-20% | No | 0 | cask |
| `sugar` | Sugar | 40 | +/-25% | No | 0 | sack |
| `timber` | Timber | 25 | +/-15% | No | 0 | plank |
| `cloth` | Cloth | 55 | +/-20% | No | 0 | bale |
| `spices` | Spices | 120 | +/-45% | No | 0 | chest |
| `silk` | Silk | 160 | +/-30% | No | 0 | bolt |
| `coffee` | Coffee | 70 | +/-25% | No | 0 | bag |
| `cocoa` | Cocoa | 90 | +/-30% | No | 0 | crate |
| `weapons` | Weapons | 80 | +/-35% | No | 0 | crate |
| `tobacco` | Tobacco | 90 | +/-30% | **Yes** | 0 | bale |
| `silver` | Silver | 250 | +/-35% | No | 0 | chest |
| `slaves` | Slaves | 220 | +/-60% | **Yes** | **+1** | person |

### Price Calculation

- **Market Price**: `basePrice +/- (basePrice * variance * random)`
- **Buy Price**: `marketPrice * 1.10` (10% markup)
- **Sell Price**: `marketPrice * 0.90` (10% discount)

### Contraband Rules

- `illegal: true`: Carrying these goods triggers patrol inspection risk at sea and when entering lawful ports.
- **Slaves** add **+1 infamy per unit purchased**.
- Patrol inspection can seize contraband and impose fines (see `PATROL_FINE_RATE`).
- Hidden Compartment equipment can protect contraband from inspection.

---

## 6. GOODS_AVAILABILITY

**Purpose**: Defines which goods are available in each port, and their rarity tiers.

### Availability Tiers

| Tier | Probability | Quantity Range |
|---|---|---|
| `always` | 100% | 40-80 |
| `frequently` | 66% | 20-40 |
| `sometimes` | 33% | 8-20 |
| `rarely` | 10% | 2-8 |
| `never` | 0% | -- |

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

## 7. Mission Configuration

**Purpose**: Defines parametric mission generation rules.

### Mission Gold Ranges (MISSION_GOLD_RANGES)

| Fame Tier | Low Risk | Medium Risk | High Risk | Assault Risk |
|---|---|---|---|---|
| 0 (Unknown) | 80-100 | 100-125 | 125-150 | 150-200 |
| 1 (Recognised) | 400-1,500 | 1,500-5,000 | 5,000-7,000 | 7,000-10,000 |
| 2 (Notorious) | 2,000-7,000 | 7,000-10,000 | 10,000-18,000 | 18,000-22,000 |
| 3 (Legendary) | 6,000-15,000 | 15,000-30,000 | 30,000-50,000 | 50,000-75,000 |
| 4 (Immortal) | 15,200-25,000 | 25,000-50,000 | 50,000-80,000 | 80,000-100,000 |

**Fame Tiers**: 0 (< 50), 1 (50-99), 2 (100-199), 3 (200-349), 4 (350+)

### Mission Enemy Ranges (MISSION_ENEMY_RANGES)

| Fame Tier | Hull | Cannons | Crew |
|---|---|---|---|
| 0 | 20-45 | 2-6 | 8-18 |
| 1 | 40-75 | 5-10 | 15-35 |
| 2 | 65-110 | 8-16 | 25-55 |
| 3 | 95-155 | 13-22 | 40-80 |
| 4 | 135-210 | 18-30 | 60-110 |

### Mission Reputation Impacts (MISSION_REP_IMPACTS)

| Type | Low | Medium | High |
|---|---|---|---|
| escort | +2 | +3 | +4 |
| patrol | +2 | +3 | +4 |
| combat | +3 | +4 | +5 |
| trade | +2 | +3 | +4 |
| smuggle | +2 (any) | -- | -- |
| assault | +5 (any) | -- | -- |

### Trade Goods by Tier (TRADE_GOODS_BY_TIER)

| Tier | Eligible Goods |
|---|---|
| 0 | rum, sugar, timber, cloth |
| 1 | rum, sugar, timber, cloth, coffee, cocoa |
| 2 | coffee, cocoa, cloth, weapons, spices |
| 3-4 | spices, silk, weapons, cocoa |

### Smuggle Goods by Tier (SMUGGLE_GOODS_BY_TIER)

| Tier | Eligible Goods |
|---|---|
| 0-1 | rum, tobacco |
| 2-4 | rum, tobacco, slaves |

**Note**: `slaves` only appear if `infamy >= 25`.

### Profit Margins

| Risk | Trade Margin | Smuggle Margin |
|---|---|---|
| Low | +60% | +80% |
| Medium | +80% | +120% |
| High | +110% | +180% |

---

## 8. Plunder Configuration

**Purpose**: Defines rules for generating enemy cargo and gold rewards after victories.

### Plunder Target Values (PLUNDER_TARGET)

| Fame Tier | Low Risk | Medium Risk | High Risk |
|---|---|---|---|
| 0 | 27 | 34 | 41 |
| 1 | 285 | 975 | 1,800 |
| 2 | 1,350 | 2,550 | 4,200 |
| 3 | 3,150 | 6,750 | 12,000 |
| 4 | 6,030 | 11,250 | 19,500 |

### Plunder Gold Ratio

`PLUNDER_GOLD_RATIO: 0.20` -- 20% of total plunder value is gold, 80% is cargo.

### Faction Plunder Goods (FACTION_PLUNDER_GOODS)

| Faction | Primary Goods (Weight) | Secondary Goods (Weight) |
|---|---|---|
| Spanish | silver (60%), cocoa (30%) | spices (10%) |
| Pirate | rum (50%), weapons (30%) | tobacco (20%), slaves (10%) |
| English | cloth (50%), weapons (30%) | sugar (20%) |
| Dutch | spices (40%), silk (30%) | coffee (20%), cocoa (10%) |
| French | sugar (40%), cocoa (30%) | rum (20%), coffee (10%) |

---
## 9. RANDOM_EVENTS

**Purpose**: Defines random events that occur at sea during `ADVANCE_DAY`.

### Structure

```javascript
RANDOM_EVENTS: [
  {
    id: string,                // Unique identifier (e.g., "storm")
    type: string,              // "hazard" | "choice" | "reward" | "crew" | "discovery"
    title: string,             // Event title
    desc: string,              // Event description
    condition?: (state) => boolean,  // Optional gate
    choices: [
      {
        label: string,         // Choice button text
        outcome: {
          log?: string,
          gold?: number,
          fame?: number,
          hullDamage?: number,
          crewLoss?: number,
          daysLost?: number,
          moraleBonus?: number,
          moralePenalty?: number,
          mapFragment?: string,
          action?: string       // e.g., "ATTACK_PIRATE", "ATTACK_MERCHANT"
        }
      }
    ]
  }
]
```

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

### Event Triggers

- **At Sea**: ~10% chance per day during `ADVANCE_DAY` (see `engine_voyage.js`).
- **Conditional**: Events with `condition` only fire if the state meets the criteria.
- Events are resolved by `RESOLVE_EVENT` in `engine_combat.js`, which reads `outcome` fields and applies them to state.

---

## 10. STARTS

**Purpose**: Defines starting scenarios with unique characters, factions, ships, and opening conditions.

### Scenario List

| Key | Name | Faction | Ship | Gold | Crew | Start Port | Focus |
|---|---|---|---|---|---|---|---|
| `english_william` | The Forged Commission | English | Dinghy | 190 | 4 | Port Royal | Bluffing as a legitimate captain |
| `spanish_elena` | The Governor's Errand | Spanish | Dinghy | 205 | 4 | Havana | Delivering mysterious cargo |
| `french_luc` | The Cartographer's Debt | French | Dinghy | 190 | 4 | Petit-Goave | Completing a dead man's work |
| `dutch_pieter` | The Company's Ledger | Dutch | Dinghy | 205 | 4 | Santo Domingo | Meeting a quota under pressure |
| `pirate_rosa` | The Survivor | Pirate | Dinghy | 190 | 4 | Santiago de Cuba | Rebuilding after a shipwreck |
| `debug` | Developer Mode | English | Sloop | 5,000 | 15 | Port Royal | Testing (Fame 100, all ports Friendly) |

### Structure

```javascript
STARTS: {
  [scenarioKey: string]: {
    id: string,
    name: string,           // Scenario display name
    desc: string,           // Opening narrative
    faction: string,        // Starting faction
    ship: string,           // Ship type key (e.g., "dinghy")
    gold: number,
    crewCount: number,
    startPort: string,      // Port key (e.g., "portRoyal")
    fame: number,           // Starting fame (0 for normal, 100 for debug)
    infamy: number,
    repAdjust: { [portKey]: number },  // Rep offsets from default 50
    starterMission: { ... },  // Pre-built first mission
    log: string[]           // Opening log entries
  }
}
```

Each scenario includes a **starter mission** that introduces the core loop (sail to a port, complete an objective, return).

---

## 11. SURRENDER_CONSEQUENCE

**Purpose**: Defines consequences when the player surrenders during different encounter types.

```javascript
SURRENDER_CONSEQUENCE: {
  [encounterType: string]: {
    goldLoss: number | string,   // Fixed amount or percentage
    cargoLoss: boolean,
    crewLoss: number,
    infamyGain: number,
    log: string
  }
}
```

| Encounter Type | Gold Loss | Cargo Loss | Crew Loss | Infamy |
|---|---|---|---|---|
| `patrol` | 50% | Contraband only | 0 | 0 |
| `hostile_port_entry` | 30% | All | 0 | 0 |
| `random` | 50% | All | 0 | 0 |

---

## 12. Text Constants (data_text.js)

`data_text.js` extends `window.D` with all text-heavy constants. Separated from `data.js` for maintainability.

### CREW_FIRST_NAMES / CREW_LAST_NAMES

Faction-specific name pools for crew generation.

```javascript
CREW_FIRST_NAMES: { english: [...], spanish: [...], french: [...], dutch: [...], pirate: [...] }
CREW_LAST_NAMES: { english: [...], spanish: [...], french: [...], dutch: [...], pirate: [...] }
```

Each faction has 20-30 first names and 15-25 last names. Pirate names draw from a mixed international pool.

### CREW_ROLES

| Role | Weight | Notes |
|---|---|---|
| deckhand | 60 | Basic crew member |
| gunner | 20 | **Cosmetic only** (no gameplay effect) |
| carpenter | 10 | **Cosmetic only** |
| cook | 5 | **Cosmetic only** |
| navigator | 5 | **Cosmetic only** |

> **Important**: Crew roles are purely cosmetic in the current version. All crew members function identically in combat, sailing, and morale calculations.

### BIO_OPENINGS

Templates for generating crew biographies. Organised by experience bracket:

| Bracket | Days Threshold | Example Template |
|---|---|---|
| newHand | 0-15 days | "{name} signed on as {role} just days ago." |
| settling | 16-49 days | "{name} is finding {his/her} place among the crew." |
| seasoned | 50-99 days | "{name} has become a reliable presence on deck." |
| veteran | 100-199 days | "{name} is one of the most experienced hands aboard." |
| oldSalt | 200+ days | "{name} has been with you since the early days." |

Each bracket has 5-8 template variants. Bio generation (`G.generateCrewBio`) combines an opening template with combination sentences for scars/traits, using suppression logic to avoid redundancy.

### PORT_GOSSIP_TEMPLATES

Priority-based gossip generation system. Templates are categorised by type and assigned priorities:

| Priority | Categories | Trigger |
|---|---|---|
| P3 (highest) | heat, contraband | Faction alert > 0, carrying illegal goods |
| P2 | reputation, fame, infamy | Rep tier changes, notable fame/infamy |
| P1 | market, hiddenPorts | Extreme prices, hints for undiscovered ports |
| P0 (lowest) | ambiance, weather | Always available as filler |

Gossip size distribution: 25% large (P3), 50% medium (P2/P1), 25% small (P0).

### MISSION_NAME_PARTS

```javascript
MISSION_NAME_PARTS: {
  cargo: ["spice shipment", "merchant convoy", ...],
  contraband: ["rum", "stolen charts", ...],
  regionAdj: ["southern", "northern", ...],
  factionAdj: {
    english: ["English", "Crown", ...],
    spanish: ["Spanish", "Colonial", ...],
    // ...
  }
}
```

### ENEMY_SHIP_NAMES

```javascript
ENEMY_SHIP_NAMES: {
  adjectives: ["Black", "Scarlet", "Iron", ...],
  nouns: ["Serpent", "Tide", "Fortune", ...]
}
```

**Example Output**: "The Black Serpent", "The Iron Tide".

### ENCOUNTER_FLAVOUR

Function map returning flavour text arrays by encounter type:

```javascript
ENCOUNTER_FLAVOUR: {
  patrol: (enemy) => [...],      // Navy patrol descriptions
  navy_patrol: (enemy) => [...],  // Faction-specific patrol text
  mission_combat: (enemy) => [...],
  random: (enemy) => [...],
  // etc.
}
```

Each type returns an array of 3-6 variants. `pickRandom()` selects one at generation time.

---

## 13. Constants Summary

| Constant | Value | Purpose |
|---|---|---|
| `PATROL_FINE_RATE` | 0.50 | Fine = 50% of seized contraband value |

---

## 14. Dependencies & Usage Notes

### Imported by

| Consumer | Uses |
|---|---|
| `logic.js` | PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES |
| `generators.js` | MISSION_*, FACTION_PLUNDER_GOODS, ENEMY_SHIP_NAMES, CREW_*, BIO_*, PORT_GOSSIP_TEMPLATES |
| `engine_*.js` | RANDOM_EVENTS, EQUIPMENT, STARTS, ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE |
| `screens_*.jsx` | PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES (for UI rendering) |

### Usage Rules

1. **No Logic**: These files contain **only data**. All logic lives in `logic.js` or `generators.js`.
2. **Immutability**: Do not modify `window.D` at runtime. Treat it as read-only.
3. **Validation**: All data should be verified by tests (see `tests/tests_logic.js`).
4. **New Data**: When adding new constants, document them in this spec.
5. **Text Split**: Text-heavy constants (names, templates, flavour) go in `data_text.js`. Numeric/structural constants go in `data.js`.

