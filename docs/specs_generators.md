# specs_generators.md -- Generators Module Specification

**Broadside Runtime Content Generators**
*Last Updated: June 8, 2026*

---

## 1. Overview

- **File**: `generators.js`
- **Exposed as**: `window.G`
- **Dependencies**:
  - `window.D` (data constants: PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES, GOODS_AVAILABILITY, MISSION_*, ENEMY_SHIP_NAMES, CREW_*, BIO_OPENINGS, BIO_COMBOS, PORT_GOSSIP_TEMPLATES, FACTION_PLUNDER_GOODS, PLUNDER_TARGET, PLUNDER_GOLD_RATIO)
  - `window.L` (pure logic helpers: getFameInfo, getRepPerk, getHoldCapacity, canSeePort, getShipStats, hasTag)
- **Purpose**: Generates **runtime content** (crew, missions, enemies, markets, cargo, biographies, gossip). Uses `Math.random()` for variety.
- **No side effects**: Functions are pure given the same RNG seed.

---

## 2. Internal Helper Functions

These are private to generators.js -- not exported on `window.G`.

| Function | Signature | Purpose |
|---|---|---|
| `randBetween` | `(min, max) -> float` | Random float in [min, max) |
| `randInt` | `(min, max) -> int` | Random integer in [min, max] inclusive |
| `pickRandom` | `(arr) -> element` | Random element from array |
| `pickWeighted` | `(items, weights) -> element` | Weighted random selection |
| `shuffleArray` | `(arr) -> arr` | Fisher-Yates shuffle (returns new array) |
| `isExtremePrice` | `(good, buyPrice) -> object|null` | Returns `{type: 'surplus'|'shortage', deviation}` if price deviates >30% from base, else null |

---

## 3. Crew Generators

### pickWeightedRole()

- **Purpose**: Randomly selects a crew role based on D.CREW_ROLES weights.
- **Output**: `string` (role key)
- **Weights**: deckhand 60, gunner 20, carpenter 10, cook 5, navigator 5
- **Fallback**: `"deckhand"` if no role selected

### generateCrewMember(faction, existingNames = [])

- **Purpose**: Generates a single crew member with a unique name.
- **Input**:
  - `faction` (string): Faction key for name pool selection
  - `existingNames` (array): Full names to avoid duplicates
- **Output**:
  ```js
  {
    id: string,         // Unique ID (timestamp + random)
    firstName: string,
    lastName: string,
    role: string,
    faction: string,
    daysAboard: 0,
    tags: []            // May include hidden trait (5% chance)
  }
  ```
- **Hidden Traits** (5% total chance at generation):
  - 2% `hidden_drunkard`
  - 1% `hidden_coward`
  - 1% `hidden_greedy`
  - 1% `hidden_troublemaker`
- **Name uniqueness**: Retries up to 50 times if name collision or firstName === lastName
- **Fallback faction**: `"pirate"` if faction not in CREW_FIRST_NAMES

### generateRoster(count, faction)

- **Purpose**: Generates `count` crew members with unique names.
- **Output**: Array of crew member objects

---

## 4. Crew Biography Generator

### generateCrewBio(member, state)

- **Purpose**: Builds a multi-sentence narrative biography for a crew member based on their accumulated state (days aboard, tags, scars, traits, faction).
- **Output**: `string` (1-4 sentences joined)

#### Generation Pipeline

```
1. Select opening bracket based on daysAboard:
   - newHand:  0-15 days
   - settling: 16-49 days
   - seasoned: 50-99 days
   - veteran:  100-199 days
   - oldSalt:  200+ days

2. Pick random template from BIO_OPENINGS[bracket]
   Template vars: {fn}, {days}, {role}, {factionLabel}

3. Check tag combinations against BIO_COMBOS (15 defined combos)
   e.g., mutineer + scar_battle, revealed_drunkard + revealed_greedy
   If matched: use combo sentence and suppress generic scar/trait lines

4. Add generic scar sentences (if not suppressed)
   Each scar type has 3-4 variant templates

5. Add generic trait sentences (if not suppressed)
   Each revealed trait has 2-3 variant templates

6. Add standalone mutineer line (if tagged and not suppressed)

7. Join all sentences into final biography string
```

#### Suppression Logic

When a combo is matched, it **suppresses** the individual scar/trait lines that make up the combo. This prevents redundancy like:

```
BAD:  "Juan bears the scars of battle. Juan was branded a mutineer. Juan survived a bloody mutiny and wears its scars."
GOOD: "Juan survived a bloody mutiny and wears its scars."  (combo replaces both individual lines)
```

---

## 5. Market Generator

### generatePortMarket(portKey)

- **Purpose**: Generates market data for a specific port visit.
- **Input**: `portKey` (string)
- **Output**:
  ```js
  {
    portKey: string,
    goods: {
      [goodKey]: {
        basePrice: number,     // Base price of the good
        buyFromPort: number,   // Price player pays (basePrice * 1.10)
        sellToPort: number,    // Price player receives (basePrice * 0.90)
        available: number      // Quantity in market
      }
    }
  }
  ```
- **Logic**:
  1. Read `GOODS_AVAILABILITY[portKey]` tier array
  2. For each good: roll appearance chance based on tier (always=100%, frequently=66%, sometimes=33%, rarely=10%, never=0%)
  3. If appeared: calculate price = `basePrice * (1 +/- variance * random)`, quantity from tier range
  4. **Exception**: food/water always available with qty 999 and fixed zero-variance price

---

## 6. Plunder & Cargo Generator

### generateEnemyCargo(state, enemy, risk)

- **Purpose**: Generates cargo and gold for a defeated enemy ship.
- **Input**:
  - `state` -- for fame tier lookup
  - `enemy` -- for faction (determines cargo type distribution)
  - `risk` -- `'low'` | `'medium'` | `'high'` (determines total value)
- **Output**: `{ gold: number, cargo: { [goodKey]: qty } }`
- **Logic**:
  1. Look up total plunder value from `PLUNDER_TARGET[fameTier][risk]`
  2. Split: `gold = totalValue * PLUNDER_GOLD_RATIO` (20%), `cargoValue = totalValue * 0.80`
  3. Pick 2-4 goods from `FACTION_PLUNDER_GOODS[enemy.faction]` using weighted random
  4. Distribute `cargoValue` proportionally across picked goods (qty = value / basePrice)
  5. Add small amounts of food/water (2-5 each)

---

## 7. Mission Generation Helpers

### opposingFaction(factionKey)

- **Purpose**: Picks a random rival faction from `FACTIONS[faction].rivalFactions`.
- **Output**: `string` (faction key)

### generateEnemyName(faction)

- **Purpose**: Creates a ship name like "The Black Serpent".
- **Source**: `ENEMY_SHIP_NAMES.adjectives` + `ENEMY_SHIP_NAMES.nouns`

### generateEnemy(risk, fame, faction)

- **Purpose**: Creates enemy ship stats scaled by risk and fame tier.
- **Output**: `{ name, hull, maxHull, cannons, crew, speed, faction }`
- **Scaling**: Base from `MISSION_ENEMY_RANGES[fameTier]`, multiplied by risk factor (low=0.8, medium=1.0, high=1.3)

### generateGold(type, risk, fame)

- **Purpose**: Generates mission gold reward.
- **Source**: `MISSION_GOLD_RANGES[fameTier][risk]`, rounded to nearest 25

### generateRepImpact(type, commissioningFaction, risk, defendingFaction)

- **Purpose**: Calculates reputation changes for mission completion.
- **Source**: `MISSION_REP_IMPACTS[type][risk]`
- **Returns**: `{ [factionKey]: delta }` -- positive for commissioning faction, negative for defending

### pickTargetPort(currentPort, type, state, faction)

- **Purpose**: Selects a valid destination port for the mission.
- **Constraints**:
  - Different from current port
  - Respects faction politics (trade missions go to friendly ports)
  - Hidden ports excluded
  - Early-game restriction: fame < 10 limits to nearby starter ports

---

## 8. Trade Mission Generator

### generateTradeMission(portKey, state, faction, risk)

- **Purpose**: Creates a trade delivery mission.
- **Flow**:
  1. Pick good from `TRADE_GOODS_BY_TIER[fameTier]`
  2. Calculate quantity as % of hold capacity (low=15%, med=25%, high=40%)
  3. Calculate gold reward: `qty * basePrice * TRADE_MISSION_PROFIT_MARGINS[risk]` + base mission gold
  4. Pick target port (must have good `frequently` or `always` available)
- **Player must** source the goods themselves (buy from market) and deliver to target port

---

## 9. Smuggle Mission Generator

### generateSmuggleMission(portKey, state, risk)

- **Purpose**: Creates a contraband delivery mission.
- **Flow**:
  1. Pick good from `SMUGGLE_GOODS_BY_TIER[fameTier]`
  2. **Slaves gated**: only appear if `state.infamy >= 25`
  3. Calculate gold reward: `qty * basePrice * SMUGGLE_PROFIT_MARGINS[risk]`
  4. Set intercept chance by risk: low=70%, medium=80%, high=90%
  5. Pick target port
- **Intercept**: During sailing, `maybeSmugglePatrol()` rolls against intercept chance each day
- **Infamy**: Completing a smuggle mission adds `mission.infamyGain`

---

## 10. Main Mission Generator

### generateMissions(portKey, state)

- **Purpose**: Main entry point. Generates 2-3 missions for the mission board at a port.
- **Output**: Array of mission objects

#### Pipeline

```
1. getEligibleFactions(portKey, state)
   -> port faction + non-rival factions with rep >= 10

2. For each mission slot (2-3):
   a. pickMissionType(faction) using typeWeightsFor(faction)
   b. pickMissionRisk(fame) using riskWeightsFor(fame)
   c. generateOneMission(type, risk, portKey, state, faction)
   d. If generation fails: generateFallbackMission (escort, low risk)
```

#### Type Weights by Faction

| Type | Non-Pirate | Pirate |
|---|---|---|
| escort | 3 | 3 |
| patrol | 2 | 0 |
| combat | 2 | 2 |
| trade | 3 | 0 |
| smuggle | 1 | 1 |
| assault | 1 | 1 |

#### Risk Weights by Fame

| Fame Tier | Low | Medium | High |
|---|---|---|---|
| 0 (Unknown) | 70% | 25% | 5% |
| 1 (Recognised) | 40% | 40% | 20% |
| 2 (Notorious) | 25% | 40% | 35% |
| 3 (Legendary) | 15% | 35% | 50% |
| 4 (Immortal) | 10% | 30% | 60% |

#### Mission Object Shape

```js
{
  type: string,           // escort | patrol | combat | trade | smuggle | assault
  risk: string,           // low | medium | high
  name: string,           // Generated mission name
  desc: string,           // Mission description text
  faction: string,        // Commissioning faction
  targetPort: string,     // Destination port key
  gold: number,           // Gold reward
  fame: number,           // Fame reward
  repImpact: {},          // { factionKey: delta }
  enemy: object | null,   // Enemy stats (combat/patrol/assault)
  // Trade/smuggle specific:
  requiredGood: string,   // Good key to deliver
  requiredQty: number,    // Quantity to deliver
  infamyGain: number,     // Infamy on completion (smuggle only)
  interceptChance: number // Patrol intercept chance (smuggle only)
}
```

---

## 11. Port Gossip Generators

### generatePortGossip(state, portKey)

- **Purpose**: Main entry point. Generates 2-4 gossip lines for the port's WORD ON THE DOCKS panel.
- **Output**: Array of strings
- **Size distribution**: 25% small (2 lines), 50% medium (3 lines), 25% large (4 lines)

#### Priority System

```
P3 (highest): heat, contraband
  -> Faction alert > 0: pick from heat templates
  -> Carrying illegal goods: pick from contraband templates

P2: reputation, fame, infamy
  -> Rep tier at current port: pick relevant rep template
  -> Notable fame (>50) or infamy (>10): pick fame/infamy template

P1: market, hiddenPorts
  -> Extreme market prices: via generateLocalMarketGossip()
  -> 5% chance: hidden port hint via generateHiddenPortHint()

P0 (filler): ambiance, weather
  -> Always available: faction-flavoured port descriptions
  -> Always available: weather/atmosphere lines
```

Templates are filled from `D.PORT_GOSSIP_TEMPLATES[category]` using `pickRandom`.

### generateLocalMarketGossip(state)

- **Purpose**: Finds the most extreme price deviation in the current market and generates a hint.
- **Logic**: Iterates `state.portMarket.goods`, calls `isExtremePrice()` for each. Picks the most extreme. Returns template string with good name and surplus/shortage description.
- **Output**: `string | null`

### generateHiddenPortHint(state)

- **Purpose**: 5% chance per port visit. Generates a vague hint about an undiscovered hidden port.
- **Logic**: Filters hidden ports not in `discoveredPorts`. Picks random. Returns hint string from templates.
- **Output**: `string | null`

---

## 12. Exposed Functions Summary

### Exported on window.G

| Category | Functions |
|---|---|
| **Crew** | `generateCrewMember`, `generateRoster`, `generateCrewBio` |
| **Market** | `generatePortMarket` |
| **Plunder** | `generateEnemyCargo` |
| **Missions** | `generateMissions` |
| **Gossip** | `generatePortGossip`, `generateLocalMarketGossip`, `generateHiddenPortHint` |
| **Enemies** | `generateEnemy`, `generateEnemyName` |

### NOT exported (internal only)

`randBetween`, `randInt`, `pickRandom`, `pickWeighted`, `shuffleArray`, `isExtremePrice`, `pickWeightedRole`, `opposingFaction`, `generateGold`, `generateRepImpact`, `generateMissionText`, `pickTargetPort`, `generateTradeMission`, `generateSmuggleMission`, `generateOneMission`, `generateFallbackMission`, `getEligibleFactions`, `typeWeightsFor`, `riskWeightsFor`, `pickMissionType`, `pickMissionRisk`

---

## Dependencies

| Reads | Used for |
|---|---|
| `window.D` | PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES, GOODS_AVAILABILITY, CREW_*, BIO_*, PORT_GOSSIP_TEMPLATES, MISSION_*, FACTION_PLUNDER_GOODS, PLUNDER_TARGET, PLUNDER_GOLD_RATIO, ENEMY_SHIP_NAMES, ENCOUNTER_FLAVOUR |
| `window.L` | getFameInfo, getRepPerk, getHoldCapacity, canSeePort, getShipStats, hasTag, getEquipmentEffect |

**May NOT call**: Engine (`window.E`), UI (`window.UI`)
