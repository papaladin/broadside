# specs_data.js — Data Constants Specification


---

## 📌 **Overview**

This document specifies the **structure, purpose, and constraints** of all constants defined in `data.js`. This file contains **pure data** (no logic, no functions) and is exposed globally as `window.D` for access by `logic.js`, `generators.js`, and `engine.js`.

**Core Principles:**

- All data is **static** and **immutable** at runtime.
- No functions or side effects.
- Exported as a single object: `window.D = { PORTS, SHIPS, FACTIONS, ... }`.

---

## 🗺️ **1. PORTS**

**Purpose**: Defines all ports in the Caribbean map, including coordinates, factions, services, and unlock conditions.

### **Structure**

```javascript
PORTS: {
  [portKey: string]: {
    name: string,               // Display name (e.g., "Port Royal")
    faction: string,            // Key in FACTIONS (e.g., "english", "pirate")
    x: number,                  // X-coordinate for map rendering (0-760)
    y: number,                  // Y-coordinate for map rendering (0-460)
    services: string[],         // Available services (e.g., ["tavern", "shipyard"])
    desc: string,               // Flavor text for UI tooltips
    minHull?: number,          // Minimum hull required to enter (e.g., 101 for remote ports)
    hidden?: boolean,          // If true, port is hidden until unlocked
    unlockCondition?: {        // Conditions to unlock hidden ports
      type: "any" | "all",     // "any" = OR, "all" = AND
      conditions: [
        { type: "fame" | "infamy" | "reputation" | "item", value: number | string, faction?: string }
      ]
    }
  }
}
```

### **Port Categories**


| Category     | Description                                                                                           | Example Ports          |
| ------------ | ----------------------------------------------------------------------------------------------------- | ---------------------- |
| **Standard** | Visible and reachable from the start.                                                                 | `portRoyal`, `tortuga` |
| **Remote**   | Visible on map but require sufficient ship range (`minHull`). Greyed out in MapScreen if unreachable. | `campeche`, `veracruz` |
| **Hidden**   | Not rendered on MapScreen until `unlockCondition` is satisfied.                                       | `roatan`, `libertalia` |


### **Services**

Available services for ports (array of strings):

- `tavern`: Allows morale recovery, crew hiring.
- `shipyard`: Allows ship purchases/upgrades.
- `crew`: Allows crew hiring.
- `missions`: Allows mission board access.

### **Unlock Conditions**

Hidden ports use `unlockCondition` to determine visibility:

- `**type: "any"**`: Port unlocks if **any** condition is met.
- `**type: "all"**`: Port unlocks if **all** conditions are met.
- `**type: "item"**`: Port unlocks if the player has a specific item in their hold.

**Condition Types:**


| Type         | Fields                             | Example                                                |
| ------------ | ---------------------------------- | ------------------------------------------------------ |
| `fame`       | `value: number`                    | `{ type: "fame", value: 50 }`                          |
| `infamy`     | `value: number`                    | `{ type: "infamy", value: 25 }`                        |
| `reputation` | `faction: string`, `value: number` | `{ type: "reputation", faction: "pirate", value: 65 }` |
| `item`       | `value: string`                    | `{ type: "item", value: "map_fragment_lasAves" }`      |


### **Port List**


| Key          | Name       | Faction | Coordinates | Services                         | Hidden? | Unlock Condition                            |
| ------------ | ---------- | ------- | ----------- | -------------------------------- | ------- | ------------------------------------------- |
| `tortuga`    | Tortuga    | pirate  | (490, 245)  | tavern, shipyard, crew, missions | ❌       | -                                           |
| `portRoyal`  | Port Royal | english | (405, 280)  | tavern, shipyard, crew, missions | ❌       | -                                           |
| `havana`     | Havana     | spanish | (310, 190)  | tavern, shipyard, crew, missions | ❌       | -                                           |
| `nassau`     | Nassau     | pirate  | (405, 152)  | tavern, crew, missions           | ❌       | -                                           |
| `campeche`   | Campeche   | spanish | (148, 248)  | tavern, shipyard, missions       | ❌       | `minHull: 101`                              |
| `roatan`     | Roatán     | pirate  | (220, 308)  | tavern, crew, missions           | ✅       | `fame >= 50` OR `pirate rep >= 65`          |
| `libertalia` | Libertalia | pirate  | (718, 445)  | tavern, shipyard, crew, missions | ✅       | `fame >= 200` AND `map_fragment_libertalia` |


---

## ⛵ **2. SHIPS**

**Purpose**: Defines all player and enemy ship types, including stats, costs, and upgrade slots.

### **Structure**

```javascript
SHIPS: {
  [shipType: string]: {
    name: string,             // Display name (e.g., "Sloop")
    maxHull: number,          // Maximum hull HP
    maxCrew: number,          // Maximum crew capacity
    cannons: number,          // Number of cannons
    speed: number,            // Sailing speed (higher = faster)
    cost: number,             // Gold cost to purchase
    requiredFame: number,     // Minimum fame to purchase
    maxDays: number,          // Maximum days at sea (range)
    holdCapacity: number,     // Cargo hold capacity
    upgradeable: string[],    // Array of upgrade keys from UPGRADES
    desc: string              // Flavor text
  }
}
```

### **Ship Tiers**


| Tier | Ship Type        | maxHull | maxCrew | Cannons | Speed | Cost    | requiredFame | maxDays | holdCapacity | Upgradeable Slots                                                 |
| ---- | ---------------- | ------- | ------- | ------- | ----- | ------- | ------------ | ------- | ------------ | ----------------------------------------------------------------- |
| 0    | Dinghy           | 30      | 5       | 2       | 6     | 200     | 0            | 5       | 20           | []                                                                |
| 0    | Cutter           | 60      | 20      | 6       | 20    | 1500    | 0            | 8       | 80           | ["reinforced_hull"]                                               |
| 1    | Sloop            | 100     | 40      | 10      | 18    | 30000   | 20           | 10      | 200          | ["reinforced_hull", "extra_cannons"]                              |
| 2    | Schooner         | 110     | 55      | 8       | 19    | 70000   | 50           | 12      | 240          | ["reinforced_hull", "figurehead"]                                 |
| 2    | Merchantman      | 180     | 60      | 5       | 10    | 60000   | 50           | 14      | 600          | ["reinforced_hull"]                                               |
| 2    | Brigantine       | 150     | 80      | 15      | 14    | 150000  | 50           | 14      | 448          | ["reinforced_hull", "extra_cannons", "figurehead"]                |
| 3    | Corvette         | 180     | 90      | 18      | 15    | 250000  | 100          | 16      | 500          | ["reinforced_hull", "extra_cannons", "copper_hull"]               |
| 3    | Frigate          | 220     | 120     | 24      | 12    | 500000  | 100          | 18      | 720          | ["reinforced_hull", "extra_cannons", "figurehead", "copper_hull"] |
| 3    | Fluyt            | 180     | 70      | 6       | 9     | 200000  | 100          | 24      | 1100         | ["reinforced_hull", "expanded_hold"]                              |
| 4    | Galleon          | 300     | 150     | 30      | 7     | 1000000 | 150          | 22      | 1320         | ["reinforced_hull", "extra_cannons", "figurehead", "copper_hull"] |
| 4    | Ship of the Line | 420     | 280     | 50      | 5     | 2000000 | 150          | 28      | 1600         | ["reinforced_hull", "extra_cannons", "figurehead", "copper_hull"] |


### **Ship Progression Notes**

- **Dinghy → Cutter → Sloop**: Early-game progression for new players.
- **Merchantman/Fluyt**: High hold capacity, low combat stats (trade-focused).
- **Corvette/Frigate**: Naval warships (combat-focused).
- **Galleon/Ship of the Line**: Endgame ships (high cost, high stats).

---

## 🏳️ **3. FACTIONS**

**Purpose**: Defines political factions, their colors, and rivalries.

### **Structure**

```javascript
FACTIONS: {
  [factionKey: string]: {
    label: string,       // Display name (e.g., "English")
    color: string,       // Hex color for UI (e.g., "#ff0000")
    rivalFactions: string[] // Array of faction keys that are rivals
  }
}
```

### **Faction List**


| Key       | Label   | Color     | Rival Factions                          |
| --------- | ------- | --------- | --------------------------------------- |
| `english` | English | `#ff0000` | `spanish`, `french`                     |
| `spanish` | Spanish | `#ffcc00` | `english`, `dutch`                      |
| `french`  | French  | `#0066ff` | `english`                               |
| `dutch`   | Dutch   | `#ff6600` | `spanish`                               |
| `pirate`  | Pirate  | `#800080` | `english`, `spanish`, `french`, `dutch` |


### **Rivalry Rules**

- **Hostile Port Entry**: If a player enters a port owned by a rival faction with `reputation < 10`, they trigger a hostile encounter.
- **Mission Availability**: Missions from rival factions are **blocked** (see `G.generateMissions`).
- **Reputation Decay**: Reputation with rival factions decays faster.

---

## 🔧 **4. UPGRADES**

**Purpose**: Defines ship upgrades, their costs, and stat bonuses.

### **Structure**

```javascript
UPGRADES: {
  [upgradeKey: string]: {
    name: string,         // Display name (e.g., "Reinforced Hull")
    desc: string,         // Description
    cost: number,         // Gold cost
    requiredFame?: number,// Minimum fame to purchase
    effects: {             // Stat bonuses (applied in L.getShipStats)
      hullBonus?: number,  // Multiplicative hull HP bonus (e.g., 0.2 = +20%)
      cannonBonus?: number,// Additive cannon bonus (e.g., 2 = +2 cannons)
      moraleBonus?: number,// Additive morale bonus (e.g., 5 = +5%)
      speedBonus?: number  // Additive speed bonus (e.g., 1 = +1 speed)
    }
  }
}
```

### **Upgrade List**


| Key                  | Name               | Cost | requiredFame | Effects                           |
| -------------------- | ------------------ | ---- | ------------ | --------------------------------- |
| `reinforced_hull`    | Reinforced Hull    | 500  | -            | `{ hullBonus: 0.2 }` (+20% hull)  |
| `extra_cannons`      | Extra Cannons      | 800  | 50           | `{ cannonBonus: 2 }` (+2 cannons) |
| `figurehead`         | Ornate Figurehead  | 300  | -            | `{ moraleBonus: 5 }` (+5 morale)  |
| `copper_hull`        | Copper-Plated Hull | 1200 | 100          | `{ speedBonus: 1 }` (+1 speed)    |
| `navigational_tools` | Navigational Tools | 600  | 50           | `{ speedBonus: 1 }` (+1 speed)    |


### **Upgrade Slots**

- Ships have **fixed upgrade slots** (see `SHIPS[shipType].upgradeable`).
- **No slot conflicts**: Upgrades are additive (e.g., `reinforced_hull` + `copper_hull` = +20% hull +1 speed).

---

## 👥 **5. Crew Data**

**Purpose**: Defines crew name pools and role weights for random generation.

### **Structure**

```javascript
// First names by faction
CREW_FIRST_NAMES: {
  [factionKey: string]: string[]  // Array of first names
}

// Last names by faction
CREW_LAST_NAMES: {
  [factionKey: string]: string[]  // Array of last names
}

// Crew roles with weights
CREW_ROLES: {
  role: string,   // e.g., "deckhand"
  weight: number // Relative probability (e.g., 60 = 60% chance)
}[]
```

### **Factions**

Crew names are generated based on the **port’s faction** (or `pirate` for pirate ports).

### **Roles**


| Role      | Weight | Description                      |
| --------- | ------ | -------------------------------- |
| deckhand  | 60     | Basic crew member.               |
| gunner    | 20     | Bonus to cannon damage.          |
| cook      | 5      | Reduces provision consumption.   |
| carpenter | 10     | Bonus to hull repair efficiency. |
| navigator | 5      | Reduces travel days.             |


---

## 💰 **6. RESOURCES (Goods & Economy)**

**Purpose**: Defines all tradeable goods, their base prices, variance, legality, and units.

### **Structure**

```javascript
RESOURCES: {
  [goodKey: string]: {
    name: string,         // Display name (e.g., "Food")
    basePrice: number,   // Base price (gold)
    variance: number,    // Price variance multiplier (0 = fixed, 0.2 = ±20%)
    illegal: boolean,     // If true, buying/selling adds infamy
    infamyOnBuy: number, // Infamy gained per unit purchased (0 if legal)
    unit: string,         // Unit of measurement (e.g., "ration", "cask")
    smuggleHint?: string, // Hint for smuggling missions
    sourceHint?: string   // Hint for where to find the good
  }
}
```

### **Good List**


| Key       | Name    | basePrice | variance | illegal | infamyOnBuy | unit   | Notes                       |
| --------- | ------- | --------- | -------- | ------- | ----------- | ------ | --------------------------- |
| `food`    | Food    | 3         | 0        | ❌       | 0           | ration | Always available in ports.  |
| `water`   | Water   | 2         | 0        | ❌       | 0           | barrel | Always available in ports.  |
| `rum`     | Rum     | 30        | 0.20     | ❌       | 0           | cask   | Common in pirate ports.     |
| `sugar`   | Sugar   | 40        | 0.25     | ❌       | 0           | sack   | &nbsp;                      |
| `timber`  | Timber  | 25        | 0.15     | ❌       | 0           | plank  | &nbsp;                      |
| `cloth`   | Cloth   | 55        | 0.20     | ❌       | 0           | bale   | &nbsp;                      |
| `spices`  | Spices  | 120       | 0.45     | ❌       | 0           | chest  | High variance.              |
| `silk`    | Silk    | 160       | 0.30     | ❌       | 0           | bolt   | &nbsp;                      |
| `coffee`  | Coffee  | 70        | 0.25     | ❌       | 0           | bag    | &nbsp;                      |
| `cocoa`   | Cocoa   | 90        | 0.30     | ❌       | 0           | crate  | &nbsp;                      |
| `weapons` | Weapons | 80        | 0.35     | ❌       | 0           | crate  | &nbsp;                      |
| `tobacco` | Tobacco | 90        | 0.30     | ✅       | 0           | bale   | **Contraband**.             |
| `silver`  | Silver  | 250       | 0.35     | ❌       | 0           | chest  | &nbsp;                      |
| `slaves`  | Slaves  | 220       | 0.60     | ✅       | **1**       | person | **Contraband** (+1 infamy). |


### **Price Calculation**

- **Market Price**: `basePrice ± (basePrice × variance × random)`
- **Buy Price**: `marketPrice × 1.10` (10% markup)
- **Sell Price**: `marketPrice × 0.90` (10% discount)

### **Contraband Rules**

- `**illegal: true**`: Buying/selling in **lawful ports** (non-pirate) triggers:
  - **Patrol Risk**: Higher chance of navy interception at sea.
  - **Port Inspection**: 15% chance of inspection when entering a lawful port.
- **Infamy**: `slaves` add **+1 infamy per unit purchased** (other contraband does not).

---

## 📦 **7. GOODS_AVAILABILITY**

**Purpose**: Defines which goods are available in each port, and their rarity tiers.

### **Structure**

```javascript
GOODS_AVAILABILITY: {
  [portKey: string]: [
    // Array of availability tiers for each good, in column order:
    // [food, water, rum, sugar, timber, cloth, spices, silk, coffee, cocoa, weapons, tobacco, silver, slaves]
    "always" | "frequently" | "sometimes" | "rarely" | "never"
  ]
}
```

### **Availability Tiers**


| Tier         | Probability | Quantity Range (if rolled) |
| ------------ | ----------- | -------------------------- |
| `always`     | 100%        | 40–80                      |
| `frequently` | 66%         | 20–40                      |
| `sometimes`  | 33%         | 8–20                       |
| `rarely`     | 10%         | 2–8                        |
| `never`      | 0%          | -                          |


**Exception**: `food` and `water` always have `available: 999` (unlimited).

### **Example: Port Royal (English)**

```javascript
portRoyal: [
  "always",    // food
  "always",    // water
  "frequently", // rum
  "sometimes", // sugar
  "frequently", // timber
  "frequently", // cloth
  "sometimes", // spices
  "rarely",    // silk
  "sometimes", // coffee
  "rarely",    // cocoa
  "sometimes", // weapons
  "sometimes", // tobacco
  "rarely",    // silver
  "rarely"     // slaves
]
```

### **Faction Trends**


| Faction | Common Goods                  | Rare Goods     |
| ------- | ----------------------------- | -------------- |
| English | cloth, sugar, weapons         | silk, cocoa    |
| Spanish | silver, cocoa, spices         | rum, timber    |
| French  | sugar, cocoa, rum             | coffee, cloth  |
| Dutch   | spices, silk, coffee          | cocoa, weapons |
| Pirate  | rum, weapons, tobacco, slaves | silver, spices |


---

## 🎯 **8. Mission Configuration**

**Purpose**: Defines parametric mission generation rules.

### **Mission Gold Ranges**

```javascript
MISSION_GOLD_RANGES: {
  [fameTier: 0-4]: {
    low: [min, max],      // Low-risk mission gold range
    medium: [min, max],   // Medium-risk mission gold range
    high: [min, max],      // High-risk mission gold range
    assault: [min, max]    // Assault mission gold range
  }
}
```


| Fame Tier | Low Risk    | Medium Risk | High Risk   | Assault Risk |
| --------- | ----------- | ----------- | ----------- | ------------ |
| 0         | 80–100      | 100–125     | 125–150     | 150–200      |
| 1         | 400–1500    | 1500–5000   | 5000–7000   | 7000–10000   |
| 2         | 2000–7000   | 7000–10000  | 10000–18000 | 18000–22000  |
| 3         | 6000–15000  | 15000–30000 | 30000–50000 | 50000–75000  |
| 4         | 15200–25000 | 25000–50000 | 50000–80000 | 80000–100000 |


**Fame Tiers:**

- Tier 0: `fame < 50` (Unknown/Recognised)
- Tier 1: `50 ≤ fame < 100` (Recognised/Notorious)
- Tier 2: `100 ≤ fame < 200` (Notorious/Legendary)
- Tier 3: `200 ≤ fame < 350` (Legendary)
- Tier 4: `fame ≥ 350` (Immortal)

### **Mission Enemy Ranges**

```javascript
MISSION_ENEMY_RANGES: {
  hull:    { [fameTier]: [min, max] },  // Enemy hull HP
  cannons: { [fameTier]: [min, max] },  // Enemy cannons
  crew:    { [fameTier]: [min, max] }   // Enemy crew count
}
```


| Fame Tier | Hull Range | Cannons Range | Crew Range |
| --------- | ---------- | ------------- | ---------- |
| 0         | 20–45      | 2–6           | 8–18       |
| 1         | 40–75      | 5–10          | 15–35      |
| 2         | 65–110     | 8–16          | 25–55      |
| 3         | 95–155     | 13–22         | 40–80      |
| 4         | 135–210    | 18–30         | 60–110     |


### **Mission Reputation Impacts**

```javascript
MISSION_REP_IMPACTS: {
  escort:  { low: 2, medium: 3, high: 4 },   // +rep for escort missions
  patrol:  { low: 2, medium: 3, high: 4 },   // +rep for patrol missions
  combat:  { low: 3, medium: 4, high: 5 },   // +rep for combat missions
  trade:   { low: 2, medium: 3, high: 4 },   // +rep for trade missions
  smuggle: { any: 2 },                       // +rep for smuggle missions (always +2)
  assault: { any: 5 }                        // +rep for assault missions (always +5)
}
```

### **Trade Mission Goods by Tier**

```javascript
TRADE_GOODS_BY_TIER: {
  [fameTier: 0-4]: [goodKey1, goodKey2, ...]  // Eligible goods for trade missions
}
```


| Fame Tier | Eligible Goods                           |
| --------- | ---------------------------------------- |
| 0         | rum, sugar, timber, cloth                |
| 1         | rum, sugar, timber, cloth, coffee, cocoa |
| 2         | coffee, cocoa, cloth, weapons, spices    |
| 3         | spices, silk, weapons, cocoa             |
| 4         | spices, silk, weapons, cocoa             |


### **Smuggle Mission Goods by Tier**

```javascript
SMUGGLE_GOODS_BY_TIER: {
  [fameTier: 0-4]: [goodKey1, goodKey2, ...]  // Eligible contraband goods
}
```


| Fame Tier | Eligible Goods       |
| --------- | -------------------- |
| 0         | rum, tobacco         |
| 1         | rum, tobacco         |
| 2         | rum, tobacco, slaves |
| 3         | rum, tobacco, slaves |
| 4         | rum, tobacco, slaves |


**Note**: `slaves` only appear if `infamy >= 25`.

### **Mission Profit Margins**

```javascript
TRADE_MISSION_PROFIT_MARGINS: {
  low: 0.60,    // +60% profit margin
  medium: 0.80, // +80% profit margin
  high: 1.10    // +110% profit margin
}

SMUGGLE_PROFIT_MARGINS: {
  low: 0.80,    // +80% profit margin
  medium: 1.20, // +120% profit margin
  high: 1.80    // +180% profit margin
}
```

### **Mission Name Parts**

```javascript
MISSION_NAME_PARTS: {
  cargo: ["spice shipment", "merchant convoy", ...],       // For trade missions
  contraband: ["rum", "stolen charts", ...],            // For smuggle missions
  regionAdj: ["southern", "northern", ...],             // Regional descriptors
  factionAdj: {                                          // Faction-specific adjectives
    english: ["English", "Crown", ...],
    spanish: ["Spanish", "Colonial", ...],
    // ...
  }
}
```

---

## 🏴☠️ **9. Plunder Configuration** *(New for T2.4)*

**Purpose**: Defines rules for generating enemy cargo and gold rewards after grapple victories.

### **Plunder Target Values**

```javascript
PLUNDER_TARGET: {
  [fameTier: 0-4]: {
    low: number,     // Target cargo value for low-risk enemies
    medium: number,  // Target cargo value for medium-risk enemies
    high: number     // Target cargo value for high-risk enemies
  }
}
```


| Fame Tier | Low Risk | Medium Risk | High Risk |
| --------- | -------- | ----------- | --------- |
| 0         | 27       | 34          | 41        |
| 1         | 285      | 975         | 1800      |
| 2         | 1350     | 2550        | 4200      |
| 3         | 3150     | 6750        | 12000     |
| 4         | 6030     | 11250       | 19500     |


### **Plunder Gold Ratio**

```javascript
PLUNDER_GOLD_RATIO: 0.20  // 20% of total plunder value is gold, 80% is cargo
```

### **Faction Plunder Goods**

```javascript
FACTION_PLUNDER_GOODS: {
  [factionKey: string]: {
    good: string,   // Good key (e.g., "silver")
    weight: number  // Relative probability (e.g., 60 = 60% chance)
  }[]
}
```


| Faction | Primary Goods (Weight)     | Secondary Goods (Weight)    |
| ------- | -------------------------- | --------------------------- |
| Spanish | silver (60%), cocoa (30%)  | spices (10%)                |
| Pirate  | rum (50%), weapons (30%)   | tobacco (20%), slaves (10%) |
| English | cloth (50%), weapons (30%) | sugar (20%)                 |
| Dutch   | spices (40%), silk (30%)   | coffee (20%), cocoa (10%)   |
| French  | sugar (40%), cocoa (30%)   | rum (20%), coffee (10%)     |


---

## 🎲 **10. Enemy Ship Names**

**Purpose**: Generates random names for enemy ships.

### **Structure**

```javascript
ENEMY_SHIP_NAMES: {
  adjectives: ["Black", "Scarlet", "Iron", ...],  // e.g., "Black"
  nouns:      ["Serpent", "Tide", "Fortune", ...] // e.g., "Serpent"
}
```

**Example Output**: "The Black Serpent", "The Iron Tide".

---

## 🌊 **11. RANDOM_EVENTS**

**Purpose**: Defines random events that can occur at sea or in port.

### **Structure**

```javascript
RANDOM_EVENTS: [
  {
    id: string,               // Unique identifier (e.g., "storm")
    type: string,             // "hazard" | "choice" | "reward" | "crew" | "faction"
    title: string,            // Event title (e.g., "Violent Storm!")
    desc: string,             // Event description
    condition?: (state) => boolean, // Function to check if event can fire
    choices: [                // Array of player choices
      {
        label: string,         // Choice label (e.g., "Brace for impact")
        outcome: {            // Outcome object (applied to state)
          log?: string,        // Log message
          gold?: number,       // Gold change (positive/negative)
          fame?: number,       // Fame change
          hullDamage?: number, // Hull damage
          crewLoss?: number,   // Crew lost
          daysLost?: number,   // Days added to voyage
          moraleBonus?: number,// Morale change
          repImpact?: { [faction: string]: number }, // Reputation changes
          battle?: { enemy: object } // Triggers a battle
        }
      }
    ]
  }
]
```

### **Event Types**


| Type    | Description                                            | Example Events                   |
| ------- | ------------------------------------------------------ | -------------------------------- |
| hazard  | Negative event with no choices (automatic resolution). | `storm`, `calm_winds`            |
| choice  | Player must choose an outcome.                         | `merchant_distress`, `shipwreck` |
| reward  | Positive event with choices.                           | `treasure_map`, `whale_sighting` |
| crew    | Event related to crew morale/management.               | `mutiny`, `deserters`            |
| faction | Event related to faction reputation.                   | (Future use)                     |


### **Event List**


| ID                  | Type   | Title                | Condition          |
| ------------------- | ------ | -------------------- | ------------------ |
| `storm`             | hazard | Violent Storm!       | Always             |
| `calm_winds`        | hazard | Doldrums             | Always             |
| `merchant_distress` | choice | Merchant in Distress | Always             |
| `shipwreck`         | choice | Shipwreck Spotted    | Always             |
| `treasure_map`      | reward | Treasure Map Found!  | Always             |
| `whale_sighting`    | reward | Whale Sighting       | Always             |
| `mutiny`            | crew   | Mutiny!              | `crew.morale < 20` |
| `deserters`         | crew   | Deserters            | `crew.morale < 40` |


### **Event Triggers**

- **At Sea**: Events fire during `ADVANCE_DAY` with a **10% chance per day** (see `L.triggerRandomEvent`).
- **In Port**: Some events (e.g., `navy_patrol`) fire when entering a port.
- **Conditional**: Events with `condition` only fire if the state meets the criteria (e.g., `mutiny` requires `morale < 20`).

---

## 📊 **12. Constants Summary**

### **Global Constants**


| Constant           | Value | Purpose                                |
| ------------------ | ----- | -------------------------------------- |
| `PATROL_FINE_RATE` | 0.50  | Fine = 50% of seized contraband value. |


---

## 🔗 **Dependencies**

This file is **imported by**:

- `logic.js`: Uses `PORTS`, `SHIPS`, `FACTIONS`, `RESOURCES`, `GOODS_AVAILABILITY`, etc.
- `generators.js`: Uses `MISSION_*`, `FACTION_PLUNDER_GOODS`, `ENEMY_SHIP_NAMES`, etc.
- `engine.js`: Uses `RANDOM_EVENTS`, `UPGRADES`, etc.
- `screens_*.jsx`: Uses `PORTS`, `SHIPS`, `FACTIONS` for UI rendering.

---

## 📝 **Changelog**


| Date       | Change                                                                | Author |
| ---------- | --------------------------------------------------------------------- | ------ |
| 2026-05-28 | Added `PLUNDER_TARGET`, `PLUNDER_GOLD_RATIO`, `FACTION_PLUNDER_GOODS` | G P    |
| 2026-05-28 | Updated ship costs and stats for balance                              | G P    |
| 2026-05-28 | Added `minHull` to remote ports                                       | G P    |


---

## 🎯 **Usage Notes**

1. **No Logic**: This file contains **only data**. All logic (e.g., mission generation, port visibility) lives in `logic.js` or `generators.js`.
2. **Immutability**: Do not modify `window.D` at runtime. Treat it as read-only.
3. **Validation**: All data should be validated in tests (see `tests/`).
4. **New Data**: When adding new constants, document them in this spec.

---

## 🧪 **Test Coverage**

Ensure all data is tested for:

- **Validity**: All required fields are present.
- **Consistency**: References (e.g., `faction` in `PORTS` must exist in `FACTIONS`).
- **Balance**: Ship/upgrade costs are reasonable for progression.

Example test cases:

```javascript
// Test that all port factions exist in FACTIONS
Object.values(D.PORTS).forEach(port => {
  assert(D.FACTIONS[port.faction], `Port ${port.name} references unknown faction ${port.faction}`);
});

// Test that all ship upgradeable slots exist in UPGRADES
Object.values(D.SHIPS).forEach(ship => {
  ship.upgradeable.forEach(upgradeKey => {
    assert(D.UPGRADES[upgradeKey], `Ship ${ship.name} references unknown upgrade ${upgradeKey}`);
  });
});
```

---
