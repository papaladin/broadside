
---

# **📌 LOGIC**

- **File**: `logic.js`
- **Exposed as**: `window.L`
- **Dependencies**: `window.D` (data constants)
- **Purpose**: Contains all pure functions for game logic, including save/load, helpers, ship/repair, travel, reputation, crew, events, combat, initialization, and resource/trade functions.

*Pure functions for game logic. No side effects, no state mutation. Only calculations and data transformations.*


---

## **🗃️ Save/Load Functions**

### **1. `hasSave()**`

- **Purpose**: Checks if a saved game exists in `localStorage`.
- **Input**: None
- **Output**: `boolean` (`true` if a save exists, `false` otherwise)
- **Dependencies**: `localStorage`
- **Notes**: Uses the key `"piratesSave"`.

---

### **2. `saveGame(state)**`

- **Purpose**: Saves the current game state to `localStorage`.
- **Input**:
  - `state` (object): The current game state to save.
- **Output**: `void`
- **Dependencies**: `localStorage`
- **Notes**: Stringifies the state using `JSON.stringify`.

---

### **3. `loadGame()**`

- **Purpose**: Loads a saved game state from `localStorage`.
- **Input**: None
- **Output**:
  - `object | null`: The parsed saved state, or `null` if no save exists.
- **Dependencies**: `localStorage`
- **Notes**: Uses `JSON.parse` to deserialize the saved state.

---

---

## **⚙️ Helper Functions**

### **1. `canAfford(state, cost)**`

- **Purpose**: Checks if the player has enough gold to afford a purchase.
- **Input**:
  - `state` (object): The current game state.
  - `cost` (number): The cost to check.
- **Output**: `boolean` (`true` if the player can afford it, `false` otherwise)
- **Notes**: Compares `state.gold` with `cost`.

---

### **2. `reputationLabel(rep)**`

- **Purpose**: Returns a human-readable label for a reputation value.
- **Input**:
  - `rep` (number): The reputation value (0-100).
- **Output**: `string` (e.g., `"Allied"`, `"Friendly"`, `"Neutral"`, `"Unfriendly"`, `"Hostile"`, `"At War"`)
- **Thresholds**:
  - `>= 80`: `"Allied"`
  - `>= 60`: `"Friendly"`
  - `>= 40`: `"Neutral"`
  - `>= 20`: `"Unfriendly"`
  - `>= 10`: `"Hostile"`
  - `< 10`: `"At War"`

---

### **3. `getFameLabel(fame)**`

- **Purpose**: Returns a human-readable label for a fame value.
- **Input**:
  - `fame` (number): The fame value.
- **Output**: `string` (e.g., `"Immortal"`, `"Legendary"`, `"Notorious"`, `"Recognised"`, `"Unknown"`)
- **Thresholds**:
  - `>= 350`: `"Immortal"`
  - `>= 200`: `"Legendary"`
  - `>= 100`: `"Notorious"`
  - `>= 50`: `"Recognised"`
  - `< 50`: `"Unknown"`

---

### **4. `getFameTier(fame)**`

- **Purpose**: Returns a numeric tier for a fame value.
- **Input**:
  - `fame` (number): The fame value.
- **Output**: `number` (0-4)
- **Thresholds**:
  - `>= 350`: `4`
  - `>= 200`: `3`
  - `>= 100`: `2`
  - `>= 50`: `1`
  - `< 50`: `0`

---

### **5. `getInfamyLabel(infamy)**`

- **Purpose**: Returns a human-readable label for an infamy value.
- **Input**:
  - `infamy` (number): The infamy value.
- **Output**: `string` (e.g., `"Legendary Outlaw"`, `"Notorious"`, `"Wanted"`, `"Suspect"`, `"Clean"`)
- **Thresholds**:
  - `>= 100`: `"Legendary Outlaw"`
  - `>= 50`: `"Notorious"`
  - `>= 25`: `"Wanted"`
  - `>= 10`: `"Suspect"`
  - `< 10`: `"Clean"`

---

---

### **6. `hasUpgrade(state, upgradeKey)**`

- **Purpose**: Checks if the player's ship has a specific upgrade.
- **Input**:
  - `state` (object): The current game state.
  - `upgradeKey` (string): The key of the upgrade to check.
- **Output**: `boolean` (`true` if the upgrade is installed, `false` otherwise)
- **Notes**: Checks `state.ship.upgrades`.

---

---

### **7. `meetsRequirement(state, item)**`

- **Purpose**: Checks if the player meets the requirements to purchase or use an item.
- **Input**:
  - `state` (object): The current game state.
  - `item` (object): The item to check (e.g., a ship or upgrade).
- **Output**: `object` with:
  - `allowed` (boolean): `true` if requirements are met.
  - `reason` (string | null): Reason for denial (e.g., `"Requires ★ 50 fame (Notorious)"`), or `null` if allowed.
- **Notes**: Currently checks `item.requiredFame` against `state.fame`.

---

---

### **8. `canBribe(state)**`

- **Purpose**: Checks if the player can bribe NPCs.
- **Input**:
  - `state` (object): The current game state.
- **Output**: `boolean` (`true` if `state.infamy < 50`, `false` otherwise)
- **Notes**: Bribes are blocked if infamy is 50 or higher.

---

---

### **9. `getEffectiveMorale(state)**`

- **Purpose**: Calculates the player's effective morale, including bonuses from ship upgrades.
- **Input**:
  - `state` (object): The current game state.
- **Output**: `number` (effective morale, capped at 100)
- **Notes**:
  - Uses `getShipStats(state)` to get morale bonuses from upgrades.
  - Formula: `Math.min(100, state.crew.morale + moraleBonus)`

---

---

### **10. `getShipStats(state)**`

- **Purpose**: Calculates the player's ship stats, including upgrades.
- **Input**:
  - `state` (object): The current game state.
- **Output**: `object` with:
  - `maxHull` (number): Maximum hull HP (modified by upgrades).
  - `cannons` (number): Number of cannons (modified by upgrades).
  - `speed` (number): Sailing speed (modified by upgrades).
  - `moraleBonus` (number): Morale bonus from upgrades (e.g., `figurehead`).
- **Notes**:
  - Starts with base stats from `SHIPS[state.ship.type]`.
  - Applies upgrades from `state.ship.upgrades` (e.g., `reinforced_hull`, `extra_cannons`, `copper_hull`).

---

---

## **⚓ Ship & Repair Functions**

### **1. `shipRepairCost(state)**`

- **Purpose**: Calculates the cost to fully repair the player's ship.
- **Input**:
  - `state` (object): The current game state.
- **Output**: `number` (cost in gold)
- **Notes**:
  - Uses `getShipStats(state)` to get the ship's `maxHull`.
  - Formula: `(maxHull - state.ship.hull) * 2` (2 gold per hull point).

---

---

## **⛵ Travel Functions**

### **1. `travelDays(fromPort, toPort, state)**`

- **Purpose**: Calculates the number of days required to travel between two ports.
- **Input**:
  - `fromPort` (string): Key of the starting port.
  - `toPort` (string): Key of the destination port.
  - `state` (object): The current game state.
- **Output**: `number` (days required, minimum 1)
- **Notes**:
  - Uses Euclidean distance between port coordinates (`x`, `y`).
  - Factors:
    - Ship speed (from `getShipStats(state)`).
    - Morale modifier: `-1 day` if morale `< 50`, `-1 day` if morale `< 30`.
    - Wind modifier:
      - `-1 day` if wind is favorable (angle difference `< 45°` or `> 315°`).
      - `+1 day` if wind is opposing (angle difference `> 135°` and `< 225°`).
    - Hold load penalty: Uses `getHoldLoadPct` and `getHoldSpeedMultiplier`.
- **Formula**:
  ```js
  const distance = Math.hypot(dx, dy);
  let days = Math.ceil(distance / (ship.speed * 4));
  // Apply modifiers...
  return Math.max(1, Math.round(days * speedMultiplier));
  ```

---

---

### **2. `canReach(state, portKey)**`

- **Purpose**: Checks if the player can reach a port from their current location.
- **Input**:
  - `state` (object): The current game state.
  - `portKey` (string): Key of the port to check.
- **Output**: `boolean` (`true` if reachable, `false` otherwise)
- **Notes**:
  - Returns `false` if `portKey === state.currentPort`.
  - Checks:
    1. **Hidden ports**: Returns `false` if the port is hidden and not discovered.
    2. **Ship size**: Returns `false` if the ship's `maxHull` is less than the port's `minHull`.
    3. **Range**: Returns `false` if `travelDays` exceeds the ship's `maxDays`.

---

---

### **3. `getUnreachableReason(state, portKey)**`

- **Purpose**: Returns a human-readable reason why a port is unreachable.
- **Input**:
  - `state` (object): The current game state.
  - `portKey` (string): Key of the port to check.
- **Output**: `string | null` (reason or `null` if reachable)
- **Notes**:
  - Returns `null` for undiscovered hidden ports.
  - Returns reasons for:
    - Ship size (e.g., `"Requires a heavier vessel (your ship: 100 hull, required: 150+)"`).
    - Range (e.g., `"5-day voyage exceeds your ship's range (10 days)"`).

---

---

## **🤝 Reputation Functions**

### **1. `decayReputation(state)**`

- **Purpose**: Decays the player's reputation with all ports (except those at or below 50).
- **Input**:
  - `state` (object): The current game state.
- **Output**: `object` (new reputation object)
- **Notes**:
  - Only decays reputation values `> 50` by 1 point.
  - Caps at 50 (minimum).

---

---

### **2. `updateReputation(state, port, delta)**`

- **Purpose**: Updates the player's reputation with a specific port.
- **Input**:
  - `state` (object): The current game state.
  - `port` (string): Key of the port.
  - `delta` (number): Change in reputation (positive or negative).
- **Output**: `object` (new reputation object)
- **Notes**:
  - Clamps reputation between `0` and `100`.
  - Defaults to `50` if no reputation exists for the port.

---

---

### **3. `applyReputationImpact(state, repImpact)**`

- **Purpose**: Applies a reputation impact object to all ports of the specified factions.
- **Input**:
  - `state` (object): The current game state.
  - `repImpact` (object): Key-value pairs of faction-reputation changes (e.g., `{ english: +10, spanish: -5 }`).
- **Output**: `object` (new reputation object)
- **Notes**:
  - Iterates over all ports and applies the delta to those matching the faction.

---

---

### **4. `getRepPerk(rep)**`

- **Purpose**: Returns the reputation perks for a given reputation value.
- **Input**:
  - `rep` (number): The reputation value (0-100).
- **Output**: `object` with:
  - `tier` (string): `"allied"`, `"friendly"`, `"neutral"`, `"hostile"`, or `"at_war"`.
  - `repairMult` (number): Multiplier for repair costs (e.g., `0.8` for allied).
  - `missionMult` (number): Multiplier for mission rewards (e.g., `1.2` for allied).
  - `servicesBlocked` (boolean): `true` if at war (no services available).
- **Thresholds**:
  - `>= 80`: `"allied"` (`repairMult: 0.8`, `missionMult: 1.2`)
  - `>= 50`: `"friendly"` (`repairMult: 0.9`, `missionMult: 1.1`)
  - `>= 30`: `"neutral"` (`repairMult: 1.0`, `missionMult: 0.9`)
  - `>= 10`: `"hostile"` (`repairMult: 1.0`, `missionMult: 0.75`)
  - `< 10`: `"at_war"` (`repairMult: 1.0`, `missionMult: 0`, `servicesBlocked: true`)

---

---

## **👥 Crew Functions**

### **1. `payCrewWages(state)**`

- **Purpose**: Calculates the daily wage cost for the player's crew.
- **Input**:
  - `state` (object): The current game state.
- **Output**: `number` (wage cost in gold)
- **Notes**:
  - Base wage: `2 gold per crew member`.
  - Morale modifier: `+50%` if morale `< 30`.
  - Formula: `Math.floor(state.crew.roster.length * 2 * wageMultiplier)`.

---

---

### **2. `removeRandomCrew(roster, count)**`

- **Purpose**: Removes a random subset of crew members from the roster.
- **Input**:
  - `roster` (array): The current crew roster.
  - `count` (number): Number of crew members to remove.
- **Output**: `object` with:
  - `newRoster` (array): The updated roster.
  - `removed` (array): The removed crew members.
- **Notes**:
  - Returns the original roster if `count <= 0`.
  - Uses `Math.random()` to shuffle the roster.

---

---

## **🎲 Event Functions**

### **1. `triggerRandomEvent(state)**`

- **Purpose**: Randomly selects and returns an event that matches the current state conditions.
- **Input**:
  - `state` (object): The current game state.
- **Output**: `object | null` (the selected event or `null` if no events are available)
- **Notes**:
  - Filters `RANDOM_EVENTS` using `event.condition(state)`.
  - Returns a copy of the event object.

---

---

### **2. `maybeRandomPatrol(state)**`

- **Purpose**: Determines if a random navy patrol should intercept the player.
- **Input**:
  - `state` (object): The current game state.
- **Output**: `boolean` (`true` if a patrol should appear, `false` otherwise)
- **Notes**:
  - Returns `false` if the current port is pirate-controlled.
  - Base chance: `10%`.
  - Infamy bonus: `+1% per infamy point` (capped at `30%`).
  - Formula: `Math.min(0.10 + (state.infamy / 100), 0.30)`.

---

---

## **⚔️ Combat Functions**

### **1. `getNPCAction(enemy)**`

- **Purpose**: Randomly selects an action for an NPC enemy during combat.
- **Input**:
  - `enemy` (object): The enemy object.
- **Output**: `string` (`"broadside"`, `"precision"`, or `"grapple"`)
- **Notes**:
  - Probabilities:
    - `70%`: `"broadside"`
    - `25%`: `"precision"`
    - `5%`: `"grapple"`

---

---

### **2. `resolveCombatAction(state, action)**`

- **Purpose**: Resolves a combat action (player or NPC) and returns the outcome.
- **Input**:
  - `state` (object): The current game state.
  - `action` (string): The action to resolve (`"broadside"`, `"precision"`, `"grapple"`, `"evade"`).
- **Output**: `object` with:
  - `player` (object):
    - `hullDamage` (number): Damage dealt to the player's hull.
    - `crewLoss` (number): Crew lost by the player.
  - `enemy` (object):
    - `hullDamage` (number): Damage dealt to the enemy's hull.
    - `crewLoss` (number): Crew lost by the enemy.
  - `moraleDelta` (number): Change in player morale.
  - `fled` (boolean): `true` if the player fled.
  - `instantVictory` (boolean): `true` if the player won instantly (e.g., via grapple).
  - `goldReward` (number): Gold reward for victory (e.g., from grapple).
- **Notes**:
  - **Player Actions**:
    - `**"broadside"**`: Deals damage based on `shipStats.cannons * (0.8 + random * 0.4)`.
      - Hull damage: `60%` of total.
      - Crew loss: `40%` of total (50% chance to avoid).
    - `**"precision"**`: Deals damage based on `shipStats.cannons * (1.2 + random * 0.6)` (70% hit chance).
      - Hull damage: `90%` of total.
      - Crew loss: `10%` of total (50% chance to avoid).
    - `**"grapple"**`: Attempts to board the enemy.
      - Success chance depends on:
        - Crew difference (`+30%` max if player has more crew).
        - Morale (`+20%` max if morale > 50%).
        - Hull integrity (`+20%` max if hull > 50%).
      - On success: `instantVictory = true`.
      - On failure: Player loses `30-50%` of their crew.
    - `**"evade"**`: Attempts to flee.
      - `90%` success chance.
      - On failure: Player takes reduced damage (`30%` of enemy's broadside).
  - **NPC Actions**:
    - Uses `getNPCAction(enemy)` to select an action.
    - Damage calculations mirror player actions.
    - Grapple success chance depends on:
      - Crew difference.
      - Hull integrity.
      - Fixed morale (`70%`).
  - **Morale Modifier**:
    - Player damage is multiplied by:
      - `1.2` if morale `< 30`.
      - `0.9` if morale `> 70`.
      - `1.0` otherwise.
  - **Gold Reward**:
    - Only awarded for grapple victories.
    - Formula: `Math.floor((enemy.hull + enemy.cannons * 10 + enemy.crew * 5) * 0.3)`.

---

---

## **🚀 Initialization Functions**

### **1. `initializeReputation()**`

- **Purpose**: Initializes the player's reputation with all ports to `50` (neutral).
- **Input**: None
- **Output**: `object` (reputation object with keys for all ports)
- **Notes**: Uses `Object.keys(PORTS)`.

---

---

### **2. `getStartingShip(bonuses)**`

- **Purpose**: Returns the player's starting ship based on scenario bonuses.
- **Input**:
  - `bonuses` (array): Array of scenario bonuses (e.g., `["ship:frigate"]`).
- **Output**: `object` with:
  - `type` (string): Ship type (e.g., `"sloop"`).
  - `name` (string): Ship name.
  - `hull` (number): Starting hull HP.
  - `cannons` (number): Starting cannons.
  - `upgrades` (array): Starting upgrades (empty by default).
- **Notes**:
  - Defaults to `"sloop"` if no ship bonus is found.
  - Uses `SHIPS[shipType]` to get ship stats.

---

---

### **3. `getStartingGold(bonuses)**`

- **Purpose**: Calculates the player's starting gold based on scenario bonuses.
- **Input**:
  - `bonuses` (array): Array of scenario bonuses (e.g., `["+500"]`).
- **Output**: `number` (starting gold)
- **Notes**:
  - Base gold: `1000`.
  - Parses bonuses starting with `+` (e.g., `"+500"` adds 500 gold).

---

---

### **4. `getStartingReputation(bonuses)**`

- **Purpose**: Initializes the player's starting reputation based on scenario bonuses.
- **Input**:
  - `bonuses` (array): Array of scenario bonuses (e.g., `["+10 reputation with english"]`).
- **Output**: `object` (reputation object)
- **Notes**:
  - Starts with `50` for all ports.
  - Parses bonuses matching `/([+-]\d+) reputation with (\w+)/i`.
  - Applies the delta to all ports of the specified faction.

---

---

## **📦 Resource & Trade Functions**

### **1. `getHoldUsed(holdItems)**`

- **Purpose**: Calculates the total number of items in the ship's hold.
- **Input**:
  - `holdItems` (object): The ship's hold items (e.g., `{ food: 10, water: 5 }`).
- **Output**: `number` (total items)
- **Notes**: Uses `Object.values` and `reduce`.

---

---

### **2. `getHoldLoadPct(holdItems, capacity)**`

- **Purpose**: Calculates the percentage of the hold's capacity that is used.
- **Input**:
  - `holdItems` (object): The ship's hold items.
  - `capacity` (number): The hold's maximum capacity.
- **Output**: `number` (percentage, 0-1)
- **Notes**:
  - Returns `0` if `capacity <= 0`.
  - Formula: `Math.min(1, getHoldUsed(holdItems) / capacity)`.

---

---

### **3. `getHoldSpeedMultiplier(loadPct)**`

- **Purpose**: Returns the speed multiplier based on the hold's load percentage.
- **Input**:
  - `loadPct` (number): The hold's load percentage (0-1).
- **Output**: `number` (multiplier)
- **Notes**:
  - `< 50%`: `1.00` (no penalty).
  - `< 75%`: `1.11` (11% slower).
  - `>= 75%`: `1.33` (33% slower).

---

---

### **4. `getProvisionConsumptionPerDay(state)**`

- **Purpose**: Calculates the daily consumption of food and water.
- **Input**:
  - `state` (object): The current game state.
- **Output**: `object` with:
  - `food` (number): Food consumed per day.
  - `water` (number): Water consumed per day.
- **Notes**:
  - Formula: `Math.ceil(crewCount / 10)` for both food and water.

---

---

### **5. `getDaysOfProvisions(holdItems, consumptionPerDay)**`

- **Purpose**: Calculates the number of days the current provisions will last.
- **Input**:
  - `holdItems` (object): The ship's hold items.
  - `consumptionPerDay` (object): Daily consumption (from `getProvisionConsumptionPerDay`).
- **Output**: `object` with:
  - `food` (number): Days of food remaining.
  - `water` (number): Days of water remaining.
- **Notes**:
  - Returns `Infinity` if consumption is `0`.
  - Formula: `Math.floor((holdItems[good] || 0) / consumptionPerDay[good])`.

---

---

### **6. `applyLoseCargoPercent(holdItems, percent)**`

- **Purpose**: Reduces the quantity of all cargo in the hold by a percentage.
- **Input**:
  - `holdItems` (object): The ship's hold items.
  - `percent` (number): Percentage to lose (0-100).
- **Output**: `object` (updated hold items)
- **Notes**:
  - Formula: `Math.floor(qty * (1 - percent / 100))` for each item.

---

---

### **7. `applyLoseContraband(holdItems)**`

- **Purpose**: Removes all illegal goods from the hold.
- **Input**:
  - `holdItems` (object): The ship's hold items.
- **Output**: `object` (updated hold items)
- **Notes**:
  - Uses `window.D.RESOURCES[good].illegal` to check for illegal goods.

---

---

## **🎯 Encounter Functions**

### **1. `buildEncounterContext(state, type, enemy)**`

- **Purpose**: Builds a context object for an encounter (e.g., navy patrol, hostile port entry).
- **Input**:
  - `state` (object): The current game state.
  - `type` (string): Encounter type (e.g., `"navy_patrol"`, `"hostile_port_entry"`).
  - `enemy` (object): The enemy object.
- **Output**: `object` with:
  - `type` (string): Encounter type.
  - `enemy` (object): Enemy details (includes `ship` type).
  - `flavourText` (string): Descriptive text for the encounter.
  - `options` (object): Available actions and their details:
    - `flee` (object):
      - `available` (boolean): `true` if fleeing is possible.
      - `reason` (string | null): Reason if not available.
      - `speedCheck` (object | null): Player and enemy speed for flee check.
    - `parley` (object):
      - `available` (boolean): `true` if parley is possible.
      - `reason` (string | null): Reason if not available.
      - `repRequired` (number): Minimum reputation required (30).
    - `bribe` (object):
      - `available` (boolean): `true` if bribe is possible.
      - `reason` (string | null): Reason if not available.
      - `cost` (number): Bribe cost in gold.
    - `surrender` (object):
      - `available` (boolean): `true` if surrender is possible.
      - `reason` (string | null): Reason if not available.
      - `consequence` (function | object): Dynamic or static consequence.
    - `fight` (object):
      - `available` (boolean): Always `true`.
      - `reason` (string | null): Always `null`.
- **Notes**:
  - **Flee**:
    - Not available for `"hostile_port_entry"`, `"bounty_target"`, or `"mission_combat"`.
    - Reason: `"Already in range of the harbour guns"` or `"The target is cornered — no escape"`.
  - **Parley**:
    - Not available for `"hostile_port_entry"`, `"bounty_target"`, `"mission_combat"`, `"smuggling_caught"`, or `"cargo_inspection_refused"`.
    - Requires reputation `>= 30`.
    - Reason: `"They are not here to negotiate"` or `"Reputation too low (X — need 30)"`.
  - **Bribe**:
    - Not available for `"hostile_port_entry"`, `"bounty_target"`, or `"mission_combat"`.
    - Requires `canBribe(state)` (infamy `< 50`).
    - Cost: `Math.round((enemy.gold || 500) * 0.4)`.
    - Reason: `"They cannot be bought"`, `"Your reputation for bribery has preceded you."`, or `"Need Xg (you have Yg)"`.
  - **Surrender**:
    - Not available for `"bounty_target"` or `"mission_combat"`.
    - Reason: `"Surrender means death here"`.
  - **Navy Patrol Overrides**:
    - Flee: Not available (`"You cannot outrun a patrol in open waters."`).
    - Parley: Not available (`"They have no interest in negotiating."`).
    - Bribe: Not available (`"Patrols are too loyal to be bribed."`).
  - **Speed Check**:
    - Uses `guessShipType(enemy)` to determine enemy ship type and speed.
    - Player speed: `getShipStats(state).speed`.
    - Enemy speed: `SHIPS[enemyShip]?.speed ?? 5`.
  - **Bribe Cost**:
    - `Math.round((enemy.gold ?? 500) * 0.4)`.
  - **Surrender Consequence**:
    - For navy patrols, dynamically checks for illegal goods in the hold.
    - If no illegal goods: `"The patrol finds nothing illegal. They let you pass."` (reputation +5).
    - If illegal goods: Confiscates all illegal goods, fines 200 gold, +1 infamy, -10 morale, reputation -5.

---

---

### **2. `roll(sides)**`

- **Purpose**: Rolls a random integer between 1 and `sides` (inclusive).
- **Input**:
  - `sides` (number): Maximum value (inclusive).
- **Output**: `number` (random integer)
- **Notes**: Uses `Math.ceil(Math.random() * sides)`.

---

---

### **3. `guessShipType(enemy)**`

- **Purpose**: Guesses the ship type of an enemy based on its cannons.
- **Input**:
  - `enemy` (object): The enemy object.
- **Output**: `string` (ship type key, e.g., `"sloop"`, `"galleon"`)
- **Notes**:
  - Thresholds:
    - `>= 50 cannons`: `"ship_of_the_line"` (speed 5).
    - `>= 30 cannons`: `"galleon"` (speed 7).
    - `>= 24 cannons`: `"frigate"` (speed 12).
    - `>= 18 cannons`: `"corvette"` (speed 15).
    - `>= 14 cannons`: `"brigantine"` (speed 14).
    - `>= 10 cannons`: `"sloop"` (speed 18).
    - `>= 6 cannons`: `"schooner"` (speed 19).
    - `< 6 cannons`: `"cutter"` (speed 20).

---

---

## **📜 Exposed Functions**

All functions are exposed globally via `window.L` for use in other modules (e.g., `engine.js`, `generators.js`).

```js
window.L = {
  // Save/Load
  hasSave,
  saveGame,
  loadGame,

  // Helpers
  canAfford,
  reputationLabel,
  getFameLabel,
  getFameTier,
  getInfamyLabel,
  meetsRequirement,
  canBribe,
  hasUpgrade,
  getShipStats,
  getEffectiveMorale,

  // Ship/Repair
  shipRepairCost,

  // Travel
  travelDays,
  canReach,
  getUnreachableReason,

  // Reputation
  decayReputation,
  updateReputation,
  applyReputationImpact,
  getRepPerk,

  // Crew
  payCrewWages,
  removeRandomCrew,

  // Events
  triggerRandomEvent,
  maybeRandomPatrol,

  // Encounter
  buildEncounterContext,
  roll,

  // Combat
  getNPCAction,
  resolveCombatAction,

  // Initialization
  initializeReputation,
  getStartingShip,
  getStartingGold,
  getStartingReputation,

  // Resource & Trade
  getHoldUsed,
  getHoldLoadPct,
  getHoldSpeedMultiplier,
  getProvisionConsumptionPerDay,
  getDaysOfProvisions,
  applyLoseCargoPercent,
  applyLoseContraband,
};
```

---

## **🔗 Dependencies**

- `**window.D**`: Global data constants (e.g., `PORTS`, `SHIPS`, `FACTIONS`, `UPGRADES`, `RANDOM_EVENTS`).
- `**Math**`: Used for randomness (`Math.random`), rounding (`Math.floor`, `Math.ceil`), and trigonometry (`Math.hypot`, `Math.atan2`).
- `**localStorage**`: Used for save/load functionality.

---

## **📝 Notes for Refactoring**

1. **Pure Functions**: All functions in `logic.js` are pure (no side effects, no state mutation). This makes them easy to test and reuse.
2. **Global Exposure**: Functions are exposed via `window.L` for accessibility across the codebase.
3. **Data-Driven**: Heavy reliance on `window.D` for constants (e.g., ship stats, port data). Changes to `data.js` may require updates here.
4. **Morale System**: Morale affects combat effectiveness, travel speed, and crew wages. Centralized in `getEffectiveMorale`.
5. **Reputation System**: Reputation impacts mission rewards, repair costs, and service availability. Centralized in `getRepPerk`.
6. **Combat Balance**: Damage formulas and success chances are hardcoded. Adjust these for balancing.
7. **Travel Calculations**: `travelDays` is complex and considers multiple factors (distance, ship speed, morale, wind, hold load). Test thoroughly if modifying.
8. **Encounter Context**: `buildEncounterContext` is a large function with many conditionals. Consider breaking it into smaller helpers for readability.
9. **Error Handling**: No explicit error handling (e.g., invalid inputs). Add validation if needed for robustness.
10. **Performance**: No performance bottlenecks identified. Functions are lightweight and called infrequently (e.g., per turn or action).
