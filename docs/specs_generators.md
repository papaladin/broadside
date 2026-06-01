# **Broadside: specs_generators.md**

*Runtime content generators. Functions that use `Math.random` to produce game content dynamically.*  
*No pure game logic here—that lives in `logic.js`.*

---

## **📌 Overview**

- **File**: `generators.js`
- **Exposed as**: `window.G`
- **Dependencies**:
  - `window.D` (data constants: `PORTS`, `SHIPS`, `FACTIONS`, `RESOURCES`, `GOODS_AVAILABILITY`, `MISSION_*`, `ENEMY_SHIP_NAMES`, `CREW_*`, etc.).
  - `window.L` (pure logic helpers, e.g., `getFameInfo`, `getRepPerk`).
- **Purpose**:
  - Generates **runtime content** (e.g., crew members, missions, enemies, markets).
  - Uses **randomness** (`Math.random`) for variety.
  - **No side effects**: All functions are pure (given the same input and RNG seed, they produce the same output).

---

---

## **🔧 Helper Functions**

Internal utilities used by other generators.

---

### **1. `randBetween(min, max)**`

- **Purpose**: Returns a random float between `min` (inclusive) and `max` (exclusive).
- **Input**:
  - `min` (number): Minimum value.
  - `max` (number): Maximum value.
- **Output**: `number` (random float in `[min, max)`).
- **Notes**: Uses `Math.random() * (max - min) + min`.

---

### **2. `randInt(min, max)**`

- **Purpose**: Returns a random integer between `min` (inclusive) and `max` (inclusive).
- **Input**:
  - `min` (number): Minimum value.
  - `max` (number): Maximum value.
- **Output**: `number` (random integer in `[min, max]`).
- **Notes**: Uses `Math.floor(randBetween(min, max + 1))`.

---

### **3. `pickRandom(arr)**`

- **Purpose**: Returns a random element from an array.
- **Input**:
  - `arr` (array): Array of elements.
- **Output**: `any` (random element from `arr`).
- **Notes**: Uses `Math.floor(Math.random() * arr.length)`.

---

### **4. `pickWeighted(items, weights)**`

- **Purpose**: Returns a random element from `items`, weighted by `weights`.
- **Input**:
  - `items` (array): Array of elements.
  - `weights` (array): Array of weights (same length as `items`).
- **Output**: `any` (random element from `items`, weighted by `weights`).
- **Notes**:
  - Calculates total weight: `weights.reduce((a, b) => a + b, 0)`.
  - Rolls a random value in `[0, totalWeight)`.
  - Iterates through `items` to find the matching weight bucket.

---

---

## **👥 Crew Generators**

Functions for generating crew members and rosters.

---

### **1. `pickWeightedRole()**`

- **Purpose**: Randomly selects a crew role based on weighted probabilities.
- **Input**: None.
- **Output**: `string` (role key, e.g., `"deckhand"`, `"gunner"`, `"cook"`).
- **Notes**:
  - Uses `window.D.CREW_ROLES` (e.g., `{ role: "deckhand", weight: 60 }`).
  - Total weight: Sum of all role weights.
  - Falls back to `"deckhand"` if no role is selected.

---

### **2. `generateCrewMember(faction, existingNames = [])**`

- **Purpose**: Generates a single crew member with a unique name.
- **Input**:
  - `faction` (string): Faction key (e.g., `"english"`, `"pirate"`).
  - `existingNames` (array): Array of existing full names to avoid duplicates.
- **Output**: `object` with:
  - `id` (string): Unique ID (timestamp + random string).
  - `firstName` (string): Random first name from `CREW_FIRST_NAMES[faction]`.
  - `lastName` (string): Random last name from `CREW_LAST_NAMES[faction]`.
  - `role` (string): Random role from `pickWeightedRole()`.
  - `faction` (string): Crew member's faction.
  - `daysAboard` (number): Always `0` (new crew).
- **Notes**:
  - If `faction` is not in `CREW_FIRST_NAMES` or `CREW_LAST_NAMES`, falls back to `"pirate"`.
  - Attempts to generate a unique name (up to 50 tries).
  - Example: `{ id: "abc123", firstName: "William", lastName: "Smith", role: "gunner", faction: "english", daysAboard: 0 }`.

---

### **3. `generateRoster(count, faction = "pirate")**`

- **Purpose**: Generates a roster of `count` crew members.
- **Input**:
  - `count` (number): Number of crew members to generate.
  - `faction` (string): Faction key (default: `"pirate"`).
- **Output**: `array` of crew member objects (from `generateCrewMember`).
- **Notes**:
  - Tracks `existingNames` to avoid duplicates.
  - Example: `[{ id: "abc123", ... }, { id: "def456", ... }]`.

---

---

## **🏪 Market Generators**

Functions for generating port markets.

---

### **1. `generatePortMarket(portKey)**`

- **Purpose**: Generates a market for a specific port, including goods, prices, and availability.
- **Input**:
  - `portKey` (string): Key of the port (e.g., `"portRoyal"`).
- **Output**: `object` with:
  - `portKey` (string): The port key.
  - `goods` (object): Key-value pairs of goods and their market data.
    - Keys: Good names (e.g., `"food"`, `"rum"`, `"sugar"`).
    - Values: `object` with:
      - `basePrice` (number): Base price of the good.
      - `buyFromPort` (number): Price to buy from the port (player pays this).
      - `sellToPort` (number): Price to sell to the port (player receives this).
      - `available` (number): Quantity available in the market.
- **Notes**:
  - **Column Order**: Uses `colOrder` to map `GOODS_AVAILABILITY` columns to good keys:
    ```js
    const colOrder = [
      "food", "water", "rum", "sugar", "timber", "cloth", "spices", "silk",
      "coffee", "cocoa", "weapons", "tobacco", "silver", "slaves"
    ];
    ```
  - **Availability**:
    - Uses `GOODS_AVAILABILITY[portKey]` to get availability tiers (e.g., `"always"`, `"frequently"`).
    - **Tier Chances**:
      - `always`: `1.0` (100%).
      - `frequently`: `0.66` (~66%).
      - `sometimes`: `0.33` (~33%).
      - `rarely`: `0.10` (10%).
      - `never`: `0.0` (0%).
    - Skips goods that fail their appearance roll.
  - **Pricing**:
    - For goods with `variance === 0` (e.g., food, water):
      - `buyFromPort = sellToPort = basePrice`.
    - For other goods:
      - Rolls a random market price: `basePrice ± (basePrice * variance)`.
      - `buyFromPort = Math.round(marketPrice * 1.10)` (10% markup).
      - `sellToPort = Math.round(marketPrice * 0.90)` (10% discount).
  - **Quantity**:
    - For `food` and `water`: `available = 999` (unlimited).
    - For other goods:
      - Uses `tierQtyRanges`:
        ```js
        const tierQtyRanges = {
          always:     { min: 40, max: 80 },
          frequently: { min: 20, max: 40 },
          sometimes:  { min: 8,  max: 20 },
          rarely:     { min: 2,  max: 8 },
          never:      null,
        };
        ```
      - Rolls `randInt(range.min, range.max)` for the tier.

---

---

## **⚔️ Mission Generators**

Functions for generating missions (trade, smuggle, combat, etc.).

---

### **1. `opposingFaction(factionKey)**`

- **Purpose**: Returns a random rival faction for the given faction.
- **Input**:
  - `factionKey` (string): Faction key (e.g., `"english"`).
- **Output**: `string` (rival faction key, e.g., `"spanish"`).
- **Notes**:
  - Uses `FACTIONS[factionKey].rivalFactions` to get rivals.
  - Falls back to `"pirate"` if no rivals exist.

---

### **2. `generateEnemyName(faction)**`

- **Purpose**: Generates a random enemy ship name.
- **Input**:
  - `faction` (string): Faction key (unused in current implementation).
- **Output**: `string` (e.g., `"The Black Serpent"`).
- **Notes**:
  - Uses `ENEMY_SHIP_NAMES.adjectives` and `ENEMY_SHIP_NAMES.nouns`.
  - Format: `"The [adjective] [noun]"` (e.g., `"The Cursed Drake"`).

---

### **3. `generateEnemy(risk, fame, faction)**`

- **Purpose**: Generates a random enemy ship with stats based on risk and player fame.
- **Input**:
  - `risk` (string): Risk level (`"low"`, `"medium"`, `"high"`, `"assault"`).
  - `fame` (number): Player's fame (used to determine tier).
  - `faction` (string): Faction key (used to determine opposing faction).
- **Output**: `object` with:
  - `name` (string): Enemy ship name (from `generateEnemyName`).
  - `faction` (string): Opposing faction (from `opposingFaction`).
  - `hull` (number): Enemy hull HP.
  - `cannons` (number): Enemy cannons.
  - `crew` (number): Enemy crew count.
- **Notes**:
  - **Tier**: Uses `L.getFameInfo(fame).tier` to get the player's tier (0-4).
  - **Risk Factors**:
    ```js
    const riskFactors = { low: 0.0, medium: 0.5, high: 1.0, assault: 1.4 };
    ```
  - **Stat Ranges**: Uses `MISSION_ENEMY_RANGES`:
    ```js
    const ranges = {
      hull:    { 0: [20, 45],  1: [40, 75],  2: [65, 110], 3: [95, 155],  4: [135, 210] },
      cannons: { 0: [2, 6],    1: [5, 10],   2: [8, 16],   3: [13, 22],   4: [18, 30] },
      crew:    { 0: [8, 18],   1: [15, 35],  2: [25, 55],  3: [40, 80],   4: [60, 110] },
    };
    ```
  - **Stat Calculation**:
    - For each stat (hull, cannons, crew):
      - Gets the range for the player's tier.
      - Calculates `span = max - min`.
      - For `"assault"` risk: `effectiveMax = min + span * 1.6`.
      - Adds noise: `randBetween(0, span * 0.15)`.
      - Final stat: `Math.round(Math.min(effectiveMax, Math.max(min, min + span * rf + noise)))`.
    - Example: For `risk = "high"`, `fame = 100` (tier 2), `faction = "english"`:
      - Hull: `[65, 110]` → `65 + (110-65)*1.0 + noise` → ~`90-110`.
      - Cannons: `[8, 16]` → ~`12-16`.
      - Crew: `[25, 55]` → ~`40-55`.

---

### **4. `generateEnemyForAssault(targetPortKey, fame)**`

- **Purpose**: Generates an enemy for an assault mission (defending the target port).
- **Input**:
  - `targetPortKey` (string): Key of the port being assaulted.
  - `fame` (number): Player's fame.
- **Output**: `object` (enemy object, same as `generateEnemy`).
- **Notes**:
  - Uses the **defending port's faction** (from `PORTS[targetPortKey].faction`).
  - Calls `generateEnemy("assault", fame, faction)`.

---

### **5. `generateGold(type, risk, fame)**`

- **Purpose**: Generates a random gold reward for a mission.
- **Input**:
  - `type` (string): Mission type (e.g., `"escort"`, `"assault"`).
  - `risk` (string): Risk level (`"low"`, `"medium"`, `"high"`).
  - `fame` (number): Player's fame.
- **Output**: `number` (gold reward, rounded to nearest 25).
- **Notes**:
  - **Tier**: Uses `L.getFameInfo(fame).tier`.
  - **Effective Risk**: For `"assault"` missions, uses `"assault"` risk regardless of input.
  - **Gold Ranges**: Uses `MISSION_GOLD_RANGES`:
    ```js
    const MISSION_GOLD_RANGES = {
      0: { low: [150, 300], medium: [300, 550],  high: [550, 900],  assault: [900, 1400] },
      1: { low: [250, 500], medium: [500, 850],  high: [850, 1400], assault: [1400, 2200] },
      2: { low: [400, 750], medium: [750, 1200], high: [1200, 2000], assault: [2000, 3200] },
      3: { low: [650, 1100], medium: [1100, 1800], high: [1800, 3000], assault: [3000, 5000] },
      4: { low: [1000, 1600], medium: [1600, 2600], high: [2600, 4200], assault: [4200, 7000] },
    };
    ```
  - **Calculation**:
    - Gets the range for the tier and effective risk.
    - Rolls a random value in the range.
    - Rounds to nearest 25: `Math.round(raw / 25) * 25`.

---

### **6. `generateRepImpact(type, commissioningFaction, risk, defendingFaction)**`

- **Purpose**: Generates a reputation impact object for a mission.
- **Input**:
  - `type` (string): Mission type (`"escort"`, `"patrol"`, `"combat"`, `"smuggle"`, `"assault"`).
  - `commissioningFaction` (string): Faction offering the mission.
  - `risk` (string): Risk level (`"low"`, `"medium"`, `"high"`).
  - `defendingFaction` (string): Faction of the target (for assault missions).
- **Output**: `object` with faction-reputation deltas (e.g., `{ english: +2, spanish: -3 }`).
- **Notes**:
  - **Smuggle Missions**:
    - `+2` with `"pirate"`.
    - `-3` with `defendingFaction` (if provided).
  - **Other Missions**:
    - Uses `MISSION_REP_IMPACTS`:
      ```js
      const MISSION_REP_IMPACTS = {
        escort:  { low: 2, medium: 3, high: 4 },
        patrol:  { low: 2, medium: 3, high: 4 },
        combat:  { low: 3, medium: 4, high: 5 },
        smuggle: { any: 2 },
        assault: { any: 5 },
      };
      ```
    - Positive delta: `impacts[type]?.[risk] ?? impacts[type]?.any ?? 2`.
    - For `"patrol"` or `"combat"`, also adds a negative delta for the opposing faction:
      - `impact[opposingFaction(commissioningFaction)] = -(positiveDelta - 1)`.
    - For `"assault"`, adds `-8` with `defendingFaction`.

---

### **7. `generateMissionText(type, faction, targetPortKey, risk, enemy)**`

- **Purpose**: Generates the name and description for a mission.
- **Input**:
  - `type` (string): Mission type.
  - `faction` (string): Commissioning faction.
  - `targetPortKey` (string): Target port key (if applicable).
  - `risk` (string): Risk level.
  - `enemy` (object): Enemy object (for combat missions).
- **Output**: `object` with:
  - `name` (string): Mission name.
  - `desc` (string): Mission description.
- **Notes**:
  - Uses `MISSION_NAME_PARTS` for dynamic text:
    ```js
    const MISSION_NAME_PARTS = {
      cargo: ["spice shipment", "merchant convoy", ...],
      contraband: ["rum", "stolen charts", ...],
      regionAdj: ["southern", "northern", ...],
      factionAdj: {
        english: ["English", "Crown", ...],
        spanish: ["Spanish", "Colonial", ...],
        // ...
      },
    };
    ```
  - **Templates**:
    - **Escort**: `"Escort the [cargo] to [portName]"`.
    - **Patrol**: `"Patrol the [regionAdj] waters"`.
    - **Combat**: `"Hunt down [enemy.name]"`.
    - **Smuggle**: `"Smuggle contraband to [portName]"`.
    - **Assault**: `"Assault [portName]"`.
  - **Descriptions**:
    - Dynamic based on type, faction, and target port.

---

### **8. `pickTargetPort(currentPortKey, type, state, faction)**`

- **Purpose**: Picks a random target port for a mission, respecting faction politics.
- **Input**:
  - `currentPortKey` (string): Current port key.
  - `type` (string): Mission type.
  - `state` (object): Game state (for hold capacity, etc.).
  - `faction` (string): Commissioning faction.
- **Output**: `string | null` (target port key or `null` if no valid port exists).
- **Notes**:
  - **Combat/Patrol Missions**: Returns `null` (no destination).
  - **Assault Missions**:
    - Only ports with a **different faction** than the commissioning faction.
  - **Smuggle Missions**:
    - Excludes **pirate ports** (you smuggle *to* colonial powers, not pirate havens).
  - **Trade/Escort Missions**:
    - Excludes ports of **rival factions** (from `FACTIONS[faction].rivalFactions`).
  - **Fallback**: Returns `null` if no eligible ports exist.

---

---

## **📦 Trade Mission Generator**

### **1. `generateTradeMission(portKey, state, faction, risk)**`

- **Purpose**: Generates a trade mission (deliver goods to a port).
- **Input**:
  - `portKey` (string): Current port key.
  - `state` (object): Game state.
  - `faction` (string): Commissioning faction.
  - `risk` (string): Risk level (`"low"`, `"medium"`, `"high"`).
- **Output**: `object | null` (mission object or `null` if generation fails).
- **Mission Object Structure**:
  ```js
  {
    type: "trade",
    name: string,               // e.g., "Deliver Sugar to Bridgetown"
    description: string,        // Mission details
    faction: string,           // Commissioning faction
    targetPort: string,        // Destination port key
    risk: string,               // Risk level
    gold: number,               // Reward gold
    fame: number,              // Fame reward
    infamyGain: 0,              // No infamy for trade missions
    repImpact: object,          // Reputation changes
    enemy: null,               // No enemy for trade missions
    requiredGood: string,      // Good to deliver (e.g., "sugar")
    requiredQty: number,       // Quantity to deliver
  }
  ```
- **Notes**:
  - **Eligible Goods**:
    - Uses `TRADE_GOODS_BY_TIER` based on `L.getFameInfo(state.fame).tier`:
      ```js
      const TRADE_GOODS_BY_TIER = {
        0: ["rum", "sugar", "timber", "cloth"],
        1: ["rum", "sugar", "timber", "cloth", "coffee", "cocoa"],
        2: ["coffee", "cocoa", "cloth", "weapons", "spices"],
        3: ["spices", "silk", "weapons", "cocoa"],
        4: ["spices", "silk", "weapons", "cocoa"],
      };
      ```
    - Randomly picks one good from the tier's list.
  - **Quantity**:
    - Based on hold capacity: `holdCapacity * holdPct`, where:
      ```js
      const holdPct = { low: 0.10, medium: 0.25, high: 0.50 }[risk] || 0.10;
      ```
    - Minimum: `3`.
  - **Gold Reward**:
    - Uses `TRADE_MISSION_PROFIT_MARGINS`:
      ```js
      const TRADE_MISSION_PROFIT_MARGINS = {
        low: 0.60,
        medium: 0.80,
        high: 1.10,
      };
      ```
    - Formula: `Math.round(expectedCost * (1 + margin) / 25) * 25`, where:
      - `expectedCost = RESOURCES[good].basePrice * requiredQty`.
  - **Target Port**:
    - Uses `pickTargetPort(portKey, "trade", state, faction)`.
  - **Fame Reward**:
    - `1` for `"low"`/`"medium"`, `2` for `"high"`.
  - **Reputation Impact**:
    - Uses `MISSION_REP_IMPACTS.escort[risk]` (default: `2`).

---

---

## **🕵️ Smuggle Mission Generator**

### **1. `generateSmuggleMission(portKey, state, risk)**`

- **Purpose**: Generates a smuggle mission (deliver illegal goods to a port).
- **Input**:
  - `portKey` (string): Current port key.
  - `state` (object): Game state.
  - `risk` (string): Risk level (`"low"`, `"medium"`, `"high"`).
- **Output**: `object | null` (mission object or `null` if generation fails).
- **Mission Object Structure**:
  ```js
  {
    type: "smuggle",
    name: string,               // e.g., "Smuggle Tobacco to Havana"
    description: string,        // Mission details
    faction: "pirate",         // Always pirate for smuggle missions
    targetPort: string,        // Destination port key
    risk: string,               // Risk level
    gold: number,               // Reward gold
    fame: number,              // Fame reward
    infamyGain: 1,             // +1 infamy on completion
    repImpact: object,          // Reputation changes
    enemy: object,             // Random enemy (for intercepts)
    requiredGood: string,      // Good to smuggle (e.g., "tobacco")
    requiredQty: number,       // Quantity to smuggle
    interceptChance: number,    // Chance of patrol intercept (0-1)
    isContraband: boolean,     // true if good is illegal (except rum)
  }
  ```
- **Notes**:
  - **Eligible Goods**:
    - Uses `SMUGGLE_GOODS_BY_TIER` based on `L.getFameInfo(state.fame).tier`:
      ```js
      const SMUGGLE_GOODS_BY_TIER = {
        0: ["rum", "tobacco"],
        1: ["rum", "tobacco"],
        2: ["rum", "tobacco", "slaves"],
        3: ["rum", "tobacco", "slaves"],
        4: ["rum", "tobacco", "slaves"],
      };
      ```
    - **Slaves Gating**:
      - Only appears if `risk !== "low"` **and** `state.infamy >= 25`.
    - **Infamy Weighting**:
      - If `infamy >= 50` and `Math.random() < 0.50`, forces `good = "slaves"`.
  - **Quantity**:
    - Based on hold capacity: `holdCapacity * holdPct * infamyQtyMult`, where:
      - `holdPct = { low: 0.08, medium: 0.18, high: 0.35 }[risk] || 0.08`.
      - `infamyQtyMult = 1.5` if `good === "slaves"` and `infamy >= 50` and `risk === "high"`, else `1.0`.
    - Minimum: `2`.
  - **Gold Reward**:
    - Uses `SMUGGLE_PROFIT_MARGINS`:
      ```js
      const SMUGGLE_PROFIT_MARGINS = {
        low: 0.80,
        medium: 1.20,
        high: 1.80,
      };
      ```
    - Formula: `Math.round(expectedCost * (1 + margin) / 25) * 25`.
  - **Intercept Chance**:
    - `{ low: 0.70, medium: 0.80, high: 0.90 }[risk] || 0.70`.
  - **Target Port**:
    - Uses `pickTargetPort(portKey, "smuggle", state, "pirate")` (excludes pirate ports).
  - **Fame Reward**:
    - `1` for `"low"`/`"medium"`, `2` for `"high"`.
  - **Infamy Gain**:
    - Always `+1` on completion.
  - **Reputation Impact**:
    - `+2` with `"pirate"`.
    - `-3` with the target port's faction.
  - **Enemy**:
    - Generates a random enemy using `generateEnemy(risk, state.fame, "pirate")`.
  - **Description**:
    - Includes risk label (e.g., `"perilous work"`), intercept warning, and source hint (from `RESOURCES[good].sourceHint`).

---

---

## **🎯 Main Mission Generator**

### **1. `generateMissions(portKey, state)**`

- **Purpose**: Generates a list of missions for the current port.
- **Input**:
  - `portKey` (string): Current port key.
  - `state` (object): Game state.
- **Output**: `array` of mission objects (2-3 missions).
- **Notes**:
  - **Reputation Check**:
    - Uses `L.getRepPerk(reputation[portKey])` to check if services are blocked.
    - Returns `[]` if at war (`servicesBlocked: true`).
  - **Eligible Factions**:
    - Starts with the port's faction.
    - Adds all factions **not** rivals of the port's faction.
  - **Mission Count**:
    - `2` or `3` missions (50% chance for each).
  - **Mission Type Weights**:
    - Uses `typeWeightsFor(faction)`:
      ```js
      const typeWeightsFor = (faction) => {
        const isPirate = faction === "pirate";
        return {
          escort:  3,
          patrol:  isPirate ? 0 : 2,
          combat:  2,
          smuggle: 1,
          trade:   isPirate ? 0 : 3,
          assault: 1,
        };
      };
      ```
    - Pirate ports **cannot** generate `"patrol"` or `"trade"` missions.
  - **Risk Weights**:
    - Uses `riskWeightsFor(fame)`:
      ```js
      const riskWeightsFor = (fame) => {
        const tier = L.getFameInfo(fame).tier;
        const table = [
          { low:5, medium:4, high:1, assault:0 }, // Tier 0
          { low:4, medium:4, high:2, assault:0 }, // Tier 1
          { low:3, medium:4, high:3, assault:0 }, // Tier 2
          { low:2, medium:3, high:4, assault:1 }, // Tier 3
          { low:1, medium:3, high:4, assault:2 }, // Tier 4
        ];
        return table[tier];
      };
      ```
    - Higher tiers have higher chances for `"high"` and `"assault"` risks.
  - **Mission Generation**:
    - For each mission:
      - Randomly picks a faction from `eligibleFactions`.
      - Randomly picks a type based on `typeWeights`.
      - For `"smuggle"`, forces `missionFaction = "pirate"`.
      - Randomly picks a risk based on `riskWeights`.
      - Generates the mission:
        - **Trade**: Uses `generateTradeMission`.
        - **Smuggle**: Uses `generateSmuggleMission`.
        - **Other Types (escort, patrol, combat, assault)**:
          - Picks a target port using `pickTargetPort`.
          - Generates an enemy (if `"combat"` or `"assault"`).
          - Generates gold using `generateGold`.
          - Generates reputation impact using `generateRepImpact`.
          - Generates name/description using `generateMissionText`.
  - **Fallback Mission**:
    - If no missions were generated, creates a fallback `"escort"` mission with:
      - `gold`: `generateGold("escort", "low", state.fame)`.
      - `fame`: `1`.
      - `repImpact`: `{ [port.faction]: 2 }`.

---

---

## **📦 Exposed Functions**

All generators are exposed globally via `window.G`:

```js
window.G = {
  // Crew
  generateCrewMember,
  generateRoster,

  // Market
  generatePortMarket,

  // Missions
  generateMissions,
  generateEnemy,
  generateEnemyName,
  generateMissionText,
  generateGold,
  generateRepImpact,
  pickTargetPort,
  opposingFaction,
  generateTradeMission,
  generateSmuggleMission,
};
```

---

---

## **🔗 Dependencies**

- `**window.D**`: Data constants for:
  - Ports, ships, factions, upgrades.
  - Resources, goods availability, mission configs.
  - Crew names, enemy ship names, mission text parts.
- `**window.L**`: Pure logic helpers for:
  - `getFameInfo`, `getRepPerk`, `meetsRequirement`.
- `**Math.random()**`: For all randomness (names, stats, prices, etc.).

---

---

## **📝 Notes for Refactoring**

1. **Pure Functions**:
  - All functions in `generators.js` are **pure** (no side effects, no state mutation). This makes them easy to test and reuse.
2. **Randomness**:
  - Heavy reliance on `Math.random()`. For testing, consider:
    - Injecting a RNG function (e.g., `rng = Math.random`).
    - Using a seedable RNG for reproducibility.
3. **Data-Driven**:
  - Most logic is driven by `window.D` constants. Changes to `data.js` may require updates here (e.g., new mission types, goods, or factions).
4. **Mission Generation**:
  - The `generateMissions` function is **complex** (handles multiple mission types, weights, and validations). Consider breaking it into smaller helpers (e.g., `generateEscortMission`, `generatePatrolMission`).
5. **Error Handling**:
  - No explicit error handling (e.g., invalid `portKey` or `faction`). Add validation if needed for robustness.
6. **Performance**:
  - No performance bottlenecks identified. Functions are called infrequently (e.g., when entering a port or refreshing missions).
7. **Testing**:
  - Critical functions to test:
    - `generatePortMarket` (prices, availability, quantities).
    - `generateEnemy` (stats based on risk/fame).
    - `generateMissions` (mission variety, validity).
    - `generateTradeMission`/`generateSmuggleMission` (cargo requirements, rewards).
8. **Extensibility**:
  - Adding new mission types (e.g., `"rescue"`, `"exploration"`) would require:
    - Updates to `typeWeightsFor`.
    - New generator functions (e.g., `generateRescueMission`).
    - Updates to `generateMissions` to handle the new type.
9. **Balancing**:
  - Mission rewards, enemy stats, and intercept chances are **hardcoded**. Adjust these for game balance.
10. **Smuggle Missions**:
  - The `isContraband` flag is `false` for `"rum"` (since it’s not always illegal). Ensure this aligns with game design.

---