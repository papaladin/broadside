# 📖 Broadside: Player Guide
*How to Play, Mechanics, and Strategies for the Caribbean (1700s)*

---

## 🎯 **Quick Start**

### ** Choose Your Scenario**
Your game offers **5 unique starting personas** (plus a debug mode):
   Scenario | Name | Faction | Starting Ship | Gold | Starting Port | Focus |
 |----------|------|---------|----------------|------|---------------|-------|
 | **english_william** | The Forged Commission | English | Dinghy | 190g | Port Royal | Bluffing as a legitimate captain |
 | **spanish_elena** | The Governor's Errand | Spanish | Dinghy | 205g | Havana | Delivering mysterious cargo |
 | **french_luc** | The Cartographer's Debt | French | Dinghy | 190g | Petit-Goâve | Completing a dead man's work |
 | **dutch_pieter** | The Company's Ledger | Dutch | Dinghy | 205g | Santo Domingo | Meeting a quota under pressure |
 | **pirate_rosa** | The Survivor | Pirate | Dinghy | 190g | Santiago de Cuba | Rebuilding after a shipwreck |
 | **debug** | ⚙ Developer Mode | English | Sloop | 5,000g | Port Royal | Testing (Fame 100, all ports Friendly) |

**Tip**: Each scenario includes a **starter mission** to help you learn the ropes.

---

## 🗺️ **Game World**

### **The Caribbean (1700s)**
- **5 Factions**: English, Spanish, French, Dutch, Pirate.
- **24 Ports**: Mix of **standard** (always visible), **remote** (require larger ships), and **hidden** (unlocked by fame/reputation/items).
- **Dynamic Economy**: Prices fluctuate based on supply/demand (variance % per good).

### **Port Types**
 | Type | Description | Example Ports | Requirement |
 |------|-------------|---------------|-------------|
 | **Standard** | Always visible, full services. | Port Royal, Havana, Curaçao | None |
 | **Remote** | Visible but require a **ship with hull ≥ 101** to reach. | Campeche, Veracruz, Bermuda | Brigantine+ |
 | **Hidden** | Unlocked by conditions (fame, reputation, or map fragments). | Roatán, Libertalia, Dry Tortugas, Las Aves | See [Unlock Conditions](#-unlocking-hidden-ports) |

### **Port Services**
All ports offer a subset of these services:
 | Service | Icon | Description |
 |---------|------|-------------|
 | **Tavern** | 🍺 | Restore crew morale, hire crew. |
 | **Shipyard** | ⚓ | Buy/sell ships, install upgrades. |
 | **Missions** | 📜 | Accept missions from factions. |
 | **Market** | 💰 | Buy/sell goods (prices vary by port). |
 | **Crew** | 👥 | Hire additional crew members. |

---
---
## ⛵ **Ships & Upgrades**

### **Full Ship List** *(From `SHIPS` in `data.js`)*
 | Tier | Ship | Hull | Crew | Cannons | **Speed** | Cost | Fame Req | Max Days | Hold Capacity | Upgrades |
 |------|------|------|------|---------|-----------|------|----------|----------|----------------|----------|
 | 0 | Dinghy | 30 | 5 | 2 | **6** | 200g | 0 | 5 | 20 | None |
 | 0 | Cutter | 60 | 20 | 6 | **20** | 1,500g | 0 | 8 | 80 | Reinforced Hull |
 | 1 | Sloop | 100 | 40 | 10 | **18** | 30,000g | 20 | 10 | 200 | Reinforced Hull, Extra Cannons |
 | 2 | Schooner | 110 | 55 | 8 | **19** | 70,000g | 50 | 12 | 240 | Reinforced Hull, Figurehead |
 | 2 | Merchantman | 180 | 60 | 5 | **10** | 60,000g | 50 | 14 | 600 | Reinforced Hull |
 | 2 | Brigantine | 150 | 80 | 15 | **14** | 150,000g | 50 | 14 | 448 | Reinforced Hull, Extra Cannons, Figurehead |
 | 3 | Corvette | 180 | 90 | 18 | **15** | 250,000g | 100 | 16 | 500 | Reinforced Hull, Extra Cannons, Copper Hull |
 | 3 | Frigate | 220 | 120 | 24 | **12** | 500,000g | 100 | 18 | 720 | Reinforced Hull, Extra Cannons, Figurehead, Copper Hull |
 | 3 | Fluyt | 180 | 70 | 6 | **9** | 200,000g | 100 | 24 | 1,100 | Reinforced Hull, Expanded Hold |
 | 4 | Galleon | 300 | 150 | 30 | **7** | 1,000,000g | 150 | 22 | 1,320 | Reinforced Hull, Extra Cannons, Figurehead, Copper Hull |
 | 4 | Ship of the Line | 420 | 280 | 50 | **5** | 2,000,000g | 150 | 28 | 1,600 | Reinforced Hull, Extra Cannons, Figurehead, Copper Hull |

### **Upgrades** *(From `UPGRADES` in `data.js`)*
 | Upgrade | Cost | Fame Req | Effect |
 |---------|------|----------|--------|
 | Reinforced Hull | 500g | None | +20% hull HP |
 | Extra Cannons | 800g | 50 | +2 cannons |
 | Ornate Figurehead | 300g | None | +5% crew morale (max +15%) |
 | Copper-Plated Hull | 1,200g | 100 | -1 day travel time |
 | Navigational Tools | 600g | 50 | -1 day travel time |

---
---
## 👥 **Crew Management**

### **Crew Roles** *(From `CREW_ROLES` in `data.js`)*
 | Role | Weight | Notes |
 |------|--------|-------|
 | Deckhand | 60% | Basic crew member. |
 | Gunner | 20% | **No gameplay effect** (flavor only). |
 | Cook | 5% | **No gameplay effect** (flavor only). |
 | Carpenter | 10% | **No gameplay effect** (flavor only). |
 | Navigator | 5% | **No gameplay effect** (flavor only). |

> ⚠️ **Important**: Crew roles are **purely cosmetic** in the current version. All crew members function identically in combat, sailing, and morale calculations.

### **Morale System** *(From `logic.js`)*
- **Range**: 0 (mutiny) to 100 (loyal).
- **Decay**: -1/day if morale < 30.
- **Boosts**:
  - **Raise Morale** (tavern): +5 morale (costs **5g per crew member**).
  - **Victory in Battle**: +5 to +10 morale.
  - **Completing Missions**: +5 morale.
- **Penalties**:
  - **Low Provisions**: -1/day if food or water = 0.
  - **Wage Crisis**: -1/day if can’t pay wages.
  - **Defeat in Battle**: -10 morale.
  - **Fleeing Combat**: -5 morale.

### **Wages & Provisions**
- **Wages**: 2g per crew member per day (×1.5 if morale < 30).
- **Provision Consumption**: 1 ration of food + 1 barrel of water **per 10 crew per day**.
- **Running Out**: If food or water reaches 0, morale drops by 1/day.

---
---
## 💰 **Trade & Economy**

### **Goods Overview** *(From `RESOURCES` in `data.js`)*
 | Good | Base Price | Variance | Illegal | Infamy/Buy | Unit | Notes |
 |------|------------|----------|---------|-------------|------|-------|
 | Food | 3g | 0% | ❌ | 0 | ration | Always available. |
 | Water | 2g | 0% | ❌ | 0 | barrel | Always available. |
 | Rum | 30g | ±20% | ❌ | 0 | cask | Common in pirate ports. |
 | Sugar | 40g | ±25% | ❌ | 0 | sack | - |
 | Timber | 25g | ±15% | ❌ | 0 | plank | - |
 | Cloth | 55g | ±20% | ❌ | 0 | bale | - |
 | Spices | 120g | ±45% | ❌ | 0 | chest | High profit potential. |
 | Silk | 160g | ±30% | ❌ | 0 | bolt | - |
 | Coffee | 70g | ±25% | ❌ | 0 | bag | - |
 | Cocoa | 90g | ±30% | ❌ | 0 | crate | - |
 | Weapons | 80g | ±35% | ❌ | 0 | crate | - |
 | **Tobacco** | 90g | ±30% | ✅ | **0** | bale | **Contraband** (seized by patrols). |
 | **Silver** | 250g | ±35% | ❌ | 0 | chest | - |
 | **Slaves** | 220g | ±60% | ✅ | **+1** | person | **Contraband** (seized + infamy). |

### **Buying/Selling**
- **Buy Price**: Market price × **1.10** (10% markup).
- **Sell Price**: Market price × **0.90** (10% discount).
- **Hold Capacity**: Limited by ship type (see [Ships](#⛵-ships--upgrades)).
- **All Goods Available Everywhere**: You can buy/sell **any good in any port**. Prices and availability vary by port (see [Port Availability](#-port-good-availability)).

### **Smuggling**
- **Contraband Goods**: Tobacco, Slaves.
- **Patrol Risk**: Higher if carrying contraband (especially near lawful ports).
- **Inspection Chance**: ~15% when entering a **lawful port** (non-pirate).
- **Fine**: 50% of seized goods’ **base price** (from `PATROL_FINE_RATE`).
- **Infamy**: +2 per inspection (from `PATROL_INSPECT`).
- **All Goods Can Be Smuggled**: Contraband can be sold **anywhere**, but carrying it risks inspection in lawful ports.

### **Port Good Availability** *(From `GOODS_AVAILABILITY` in `data.js`)*
Prices vary by port, and some goods are **rare/never** available in certain locations.
Example:
- **Tortuga (Pirate)**: Always has rum, frequently has tobacco/slaves.
- **Port Royal (English)**: Always has food/water, frequently has sugar/cloth.
- **Havana (Spanish)**: Always has food/water, frequently has sugar/silver.

---
---
## 🎯 **Missions**

### **Mission Types** *(From `MISSION_REP_IMPACTS` in `data.js`)*
 | Type | Description | Gold Reward | Rep Impact | Infamy | Notes |
 |------|-------------|-------------|------------|--------|-------|
 | **Escort** | Protect a merchant ship to its destination. | Tier-based | +2/+3/+4 | 0 | Low risk, guaranteed payment. |
 | **Patrol** | Clear a region of hostile vessels. | Tier-based | +2/+3/+4 | 0 | Medium risk. |
 | **Combat** | Hunt down and sink a specific enemy. | Tier-based | +3/+4/+5 | 0 | High risk. |
 | **Trade** | Deliver goods to a port. | Tier-based | +2/+3/+4 | 0 | **Guaranteed profit**, but you must source the goods yourself. |
 | **Smuggle** | Deliver contraband to a port. | Tier-based | +2 pirate, -3 target | +1 | High risk (patrols). |
 | **Assault** | Attack and capture a port. | Tier-based | +5 pirate, -8 target | +3 | Very high risk. |

#### **Mission Gold Ranges** *(From `MISSION_GOLD_RANGES`)*
 | Fame Tier | Low Risk | Medium Risk | High Risk | Assault Risk |
 |-----------|----------|-------------|-----------|--------------|
 | 0 (Unknown) | 80–100g | 100–125g | 125–150g | 150–200g |
 | 1 (Recognised) | 400–1,500g | 1,500–5,000g | 5,000–7,000g | 7,000–10,000g |
 | 2 (Notorious) | 2,000–7,000g | 7,000–10,000g | 10,000–18,000g | 18,000–22,000g |
 | 3 (Legendary) | 6,000–15,000g | 15,000–30,000g | 30,000–50,000g | 50,000–75,000g |
 | 4 (Immortal) | 15,200–25,000g | 25,000–50,000g | 50,000–80,000g | 80,000–100,000g |

#### **Mission Enemy Stats** *(From `MISSION_ENEMY_RANGES`)*
 | Fame Tier | Hull | Cannons | Crew |
 |-----------|------|---------|------|
 | 0 | 20–45 | 2–6 | 8–18 |
 | 1 | 40–75 | 5–10 | 15–35 |
 | 2 | 65–110 | 8–16 | 25–55 |
 | 3 | 95–155 | 13–22 | 40–80 |
 | 4 | 135–210 | 18–30 | 60–110 |

---
---
## ⚔️ **Combat**

### **Combat Actions** *(From `resolveCombatAction` in `logic.js`)*
 | Action | Description | Effect |
 |--------|-------------|--------|
 | **Broadside** | Full cannon volley. | 0.8–1.2 × cannons damage (60% hull, 40% crew). |
 | **Precision** | Aimed shot (70% hit chance). | 1.2–1.8 × cannons damage (90% hull, 10% crew). |
 | **Grapple** | Board the enemy. | Success chance based on crew diff, hull %, morale. **Win**: Instant victory + plunder. **Lose**: Lose crew. |
 | **Evade** | Attempt to flee. | 90% success if your **speed** > enemy speed; else take 30% enemy damage. |

### **Combat Flow**
1. **Player Turn**: Choose an action.
2. **NPC Turn**: Enemy responds with a random action (`getNPCAction` in `logic.js`).
3. **Repeat** until victory, defeat, or flee.

### **Victory/Defeat**
 | Outcome | Effect |
 |---------|--------|
 | **Victory** | Gain **gold**, **plunder cargo** (if grappled), +**reputation** with your faction. |
 | **Defeat** | Lose **50% ship hull**, **50% crew**, **all cargo**, -**10 reputation** with enemy faction. Return to previous port. |
 | **Flee** | Avoid combat, but **-5 morale** and possible **reputation loss** with enemy faction. |

### **Plunder Screen**
After a **grapple victory**:
- **Take Cargo**: 50% of gold, keep enemy cargo (infamy risk if contraband).
- **Sink Her**: 100% of gold, no cargo.

---
---
## 🌍 **Factions & Reputation**

### **Faction Overview** *(From `FACTIONS` in `data.js`)*
 | Faction | Color | Rivals | Starting Rep |
 |---------|-------|--------|--------------|
 | English | 🔴 | Spanish, French | 50 |
 | Spanish | 🟡 | English, Dutch | 50 |
 | French | 🔵 | English | 50 |
 | Dutch | 🟠 | Spanish | 50 |
 | Pirate | 🟣 | All | 50 |

### **Reputation Tiers** *(From `getRepPerk` in `logic.js`)*
 | Tier | Range | Repair Cost | Mission Gold | Services |
 |------|-------|-------------|--------------|----------|
 | **At War** | 0–9 | Standard | **0%** (missions blocked) | ❌ Blocked |
 | **Hostile** | 10–19 | Standard | **-25%** | ❌ No missions |
 | **Unfriendly** | 20–29 | Standard | **-10%** | ✅ Limited |
 | **Neutral** | 30–49 | Standard | **Standard** | ✅ All |
 | **Friendly** | 50–79 | **-10%** | **+10%** | ✅ All |
 | **Allied** | 80–100 | **-20%** | **+20%** | ✅ All |

### **Reputation Decay**
- **Decay Rate**: -1/day for rep > 50 (toward 50).
- **Prevent Decay**: Complete missions for the faction.

---
---
## 🏆 **Fame & Infamy**

### **Fame Tiers** *(From `getFameInfo` in `logic.js`)*
 | Tier | Range | Title | Ship Unlocks |
 |------|-------|-------|---------------|
 | 0 | 0–49 | Unknown | Dinghy, Cutter |
 | 1 | 50–99 | Recognised | Sloop |
 | 2 | 100–199 | Notorious | Schooner, Merchantman, Brigantine |
 | 3 | 200–349 | Legendary | Corvette, Frigate, Fluyt |
 | 4 | 350+ | Immortal | Galleon, Ship of the Line |

### **Infamy Tiers** *(From `getInfamyLabel` in `logic.js`)*
 | Tier | Range | Title | Patrol Risk |
 |------|-------|-------|-------------|
 | 0 | 0–9 | Clean | Standard |
 | 1 | 10–24 | Suspect | +10% |
 | 2 | 25–49 | Wanted | +25% |
 | 3 | 50–99 | Notorious | +50% |
 | 4 | 100+ | Legendary Outlaw | +75% |

---
---
## 🌪️ **Random Events** *(From `RANDOM_EVENTS` in `data.js`)*
- **Frequency**: ~10% chance per day at sea.
- **Conditions**: Some events require specific states (e.g., morale < 20 for mutiny).

### **Event Types**
 | Type | Example | Effect |
 |------|---------|--------|
 | **Hazard** | Storm, Calm Winds | Hull damage, days lost, crew loss. |
 | **Choice** | Distressed Merchant, Shipwreck | Gold, crew, or combat. |
 | **Reward** | Treasure Map, Whale Sighting | Gold or morale. |
 | **Crew** | Mutiny, Deserters | Morale crisis, crew loss. |
 | **Discovery** | Mysterious Chart, Wrecker's Map | Map fragments for hidden ports. |

---
---
## 🗺️ **Unlocking Hidden Ports**
Hidden ports require specific conditions to appear on the map:
 | Port | Unlock Condition |
 |------|------------------|
 | **Roatán** | Fame ≥ 50 **OR** Pirate reputation ≥ 65 |
 | **Dry Tortugas** | Infamy ≥ 25 **AND** Pirate reputation ≥ 65 |
 | **Las Aves** | Acquire **map_fragment_lasAves** (from "The Wrecker's Map" event, costs 5,000g) |
 | **Libertalia** | Fame ≥ 200 **AND** **map_fragment_libertalia** (from "A Dying Sailor's Secret" event) |

---
---
## 🎮 **Controls & UI**

### **Port Screen**
- **Map**: Click a port to sail there (greyed out if unreachable).
- **Services**: Icons show available services (tavern, shipyard, etc.).
- **Missions**: Accept/abandon missions.
- **Market**: Buy/sell goods.
- **Shipyard**: Purchase/upgrade ships.
- **Tavern**: Hire crew, raise morale.

### **Sailing Screen**
- **Progress Bar**: Shows voyage progress.
- **Wind Indicator**: Current wind direction/speed.
- **Log**: Recent events and actions.

### **Battle Screen**
- **Player/Enemy Stats**: Hull, crew, cannons.
- **Action Buttons**: Broadside, Precision, Grapple, Evade.
- **Battle Log**: Turn-by-turn results.

### **Plunder Screen**
- **Cargo List**: Available goods from the enemy ship.
- **Gold Reward**: 50% if taking cargo, 100% if sinking.
- **Hold Space**: Visualizes remaining capacity.

---
---
## 💡 **Tips & Strategies**

### **Early Game**
- **Start Small**: Use a **Cutter** or **Sloop** for early missions.
- **Stock Up**: Always carry **10–20 days’ worth of food/water** (1 ration + 1 barrel per 10 crew per day).
- **Easy Missions**: Focus on **escort** and **trade** missions (low risk, guaranteed profit).

### **Mid Game**
- **Upgrade**: Install **Reinforced Hull** and **Extra Cannons** for combat.
- **Explore**: Unlock **hidden ports** (Roatán: fame 50 OR pirate rep 65; Dry Tortugas: infamy 25 AND pirate rep 65).
- **Trade Smart**: Buy low in one port, sell high in another. Use the **market variance** to your advantage.

### **Late Game**
- **Big Ships**: Use a **Frigate** or **Galleon** for assault missions and large cargo hauls.
- **Balance Fame/Infamy**: Fame unlocks better ships; infamy unlocks pirate missions and increases patrol risk.
- **Contraband**: Tobacco and slaves are lucrative but **illegal** (seized by patrols in lawful ports).

### **Combat Tips**
- **Broadside**: Safest for consistent damage.
- **Precision**: Use against high-value targets (70% hit chance, higher damage).
- **Grapple**: Best for plunder, but risky if outnumbered or outgunned.
- **Evade**: Use if your **speed** > enemy speed (check ship stats in the table above).

### **Economy Tips**
- **Buy Low, Sell High**: Check port prices and exploit variance.
- **Trade Missions Guarantee Profit**: The mission reward ensures you won’t lose money, but you must source the goods yourself.
- **Smuggling**: Contraband (tobacco, slaves) can be sold **anywhere**, but carrying it risks inspection during travel.

---

## 📚 **Further Reading**
- [Developer Guide](developer_guide.md) — For modders and contributors.
- [Roadmap](roadmap.md) — Upcoming features and priorities.
- [Architecture](architecture.md) — Technical deep dive into the game’s design.