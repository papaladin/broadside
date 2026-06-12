# Player Guide

*How to Play, Mechanics, and Strategies for the Caribbean (1700s)*

---

## Quick Start

### Choose Your Scenario

| Scenario | Name | Faction | Ship | Gold | Port | Focus |
|---|---|---|---|---|---|---|
| **english_william** | The Forged Commission | English | Dinghy | 190g | Port Royal | Bluffing as a legitimate captain |
| **spanish_elena** | The Governor's Errand | Spanish | Dinghy | 205g | Havana | Delivering mysterious cargo |
| **french_luc** | The Cartographer's Debt | French | Dinghy | 190g | Petit-Goave | Completing a dead man's work |
| **dutch_pieter** | The Company's Ledger | Dutch | Dinghy | 205g | Santo Domingo | Meeting a quota under pressure |
| **pirate_rosa** | The Survivor | Pirate | Dinghy | 190g | Santiago de Cuba | Rebuilding after a shipwreck |

**Tip**: Each scenario includes a **starter mission** to help you learn the ropes.

---

## Game World

### The Caribbean (1700s)

- **5 Factions**: English, Spanish, French, Dutch, Pirate.
- **25 Ports**: Mix of **standard** (always visible), **remote** (require larger ships), and **hidden** (unlocked by fame/reputation/items).
- **Dynamic Economy**: Prices fluctuate based on supply/demand (variance % per good).

### Port Types

| Type | Description | Requirement |
|---|---|---|
| **Standard** (16) | Always visible, full services | None |
| **Remote** (5) | Visible but require a **ship with hull >= 101** | Brigantine+ |
| **Hidden** (4) | Unlocked by conditions (fame, reputation, or map fragments) | See Hidden Ports section |

### Port Services

| Service | Description |
|---|---|
| **Tavern** | Restore crew morale, hire crew |
| **Shipyard** | Buy/sell ships, install/remove equipment |
| **Missions** | Accept missions from factions |
| **Market** | Buy/sell goods (prices vary by port) |
| **Crew** | Hire additional crew members |

---

## Ships & Equipment

### Ship List

| Tier | Ship | Hull | Crew | Cannons | Speed | Cost | Fame Req | Days | Hold | Slots (H/A/R/S) |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | Dinghy | 30 | 5 | 2 | 6 | 200g | 0 | 5 | 20 | 0/0/0/0 |
| 0 | Cutter | 60 | 20 | 6 | 20 | 1,500g | 0 | 8 | 80 | 1/0/0/0 |
| 1 | Sloop | 100 | 40 | 10 | 18 | 30,000g | 20 | 10 | 200 | 1/1/1/0 |
| 2 | Schooner | 110 | 55 | 8 | 19 | 70,000g | 50 | 12 | 240 | 1/0/1/1 |
| 2 | Merchantman | 180 | 60 | 5 | 10 | 60,000g | 50 | 14 | 600 | 1/0/0/1 |
| 2 | Brigantine | 150 | 80 | 15 | 14 | 150,000g | 50 | 14 | 448 | 1/1/1/1 |
| 3 | Corvette | 180 | 90 | 18 | 15 | 250,000g | 100 | 16 | 500 | 1/1/1/1 |
| 3 | Frigate | 220 | 120 | 24 | 12 | 500,000g | 100 | 18 | 720 | 1/1/1/2 |
| 3 | Fluyt | 180 | 70 | 6 | 9 | 200,000g | 100 | 24 | 1,100 | 1/0/1/1 |
| 4 | Galleon | 300 | 150 | 30 | 7 | 1,000,000g | 150 | 22 | 1,320 | 2/2/1/2 |
| 4 | Ship of the Line | 420 | 280 | 50 | 5 | 2,000,000g | 150 | 28 | 1,600 | 2/2/1/2 |

**Slots** = Hull / Armament / Rigging / Special equipment slots.

### Equipment System

Ships have **equipment slots** instead of fixed upgrades. Each slot type (hull, armament, rigging, special) accepts specific equipment items. The Shipyard screen has 3 tabs:

- **Equipment Tab**: Buy new equipment from the shop and install it.
- **Ships Tab**: Purchase new ships (warning: buying a new ship **clears all installed equipment**).
- **Locker Tab**: Install previously removed equipment (only install fee, no purchase cost).

Equipment can be **removed** to the locker (if `removable: true`) before selling your ship.

#### Hull Equipment

| Name | Cost | Install | Effect | Removable |
|---|---|---|---|---|
| Reinforced Hull | 500g | 100g | +20% hull HP | Yes |
| Ironclad Plates | 2,000g | 400g | +40% hull HP, -2 speed | Yes |
| Copper Plating | 1,200g | 250g | +1 speed | Yes |
| Tar-Sealed Hull | 300g | 50g | +10% hull HP | No |

#### Armament Equipment

| Name | Cost | Install | Effect | Removable |
|---|---|---|---|---|
| Extra Cannons | 800g | 150g | +2 cannons | Yes |
| Grapeshot Supply | 400g | 75g | +1 cannon | No |
| Long Guns | 1,500g | 300g | +4 cannons, -1 speed | Yes |

#### Rigging Equipment

| Name | Cost | Install | Effect | Removable |
|---|---|---|---|---|
| Extra Sails | 600g | 100g | +1 speed | Yes |
| Storm Rigging | 400g | 75g | +1 speed (storm protection) | No |
| Lateen Rig | 900g | 150g | +2 speed, -5% hull | Yes |
| War Pennants | 200g | 25g | Intimidation (increases heat gain) | No |

#### Special Equipment

| Name | Cost | Install | Effect | Removable |
|---|---|---|---|---|
| Expanded Hold | 800g | 150g | +25% hold capacity | Yes |
| Hidden Compartment | 600g | 100g | 50% chance to hide contraband from inspection | Yes |
| Surgeon's Bay | 1,000g | 200g | Reduces crew loss in combat | Yes |
| Officer's Quarters | 1,200g | 250g | +5 crew morale | Yes |
| Ornate Figurehead | 300g | 50g | +3 crew morale | No |
| Navigation Tools | 600g | 100g | +1 speed (-1 travel day) | Yes |

---

## Crew Management

### Crew Roles

| Role | Weight | Notes |
|---|---|---|
| Deckhand | 60% | Basic crew member |
| Gunner | 20% | **Cosmetic only** (no gameplay effect) |
| Carpenter | 10% | **Cosmetic only** |
| Cook | 5% | **Cosmetic only** |
| Navigator | 5% | **Cosmetic only** |

> Crew roles are purely **cosmetic** in the current version. All crew members function identically.

### Morale System

- **Range**: 0 (mutiny risk) to 100 (loyal)
- **Boosts**: Buy Drinks (+5, costs 5g/crew), Victory (+5 to +10), Complete Mission (+5)
- **Penalties**: Low provisions (-1/day), Can't pay wages (-1/day), Defeat (-10), Fleeing (-5)
- **Equipment**: Officer's Quarters (+5), Ornate Figurehead (+3)

### Wages & Provisions

- **Wages**: 2g per crew member per day (x1.5 if morale < 30)
- **Provision Consumption**: 1 food + 1 water **per 10 crew per day**
- **Running Out**: If food or water reaches 0, morale drops by 1/day

### Crew Traits & Scars

Crew members accumulate **tags** over time:

- **Hidden Traits** (5% chance at hire): drunkard, coward, greedy, troublemaker. Revealed through gameplay events.
- **Scars**: battle, storm, shipwreck, grapple, mutiny. Permanent, earned from events.
- **Positive Progression**: Seasoned (50 days), Veteran (100 days), Loyal (200 days + conditions)
- **Faction Loyalty**: Crew from a specific faction may become upset if you attack their homeland. Neglect them and they may desert at port.

Each crew member has a **generated biography** that reflects their accumulated history, visible in the Crew detail panel.

---

## Trade & Economy

### Goods Overview

| Good | Base Price | Variance | Illegal | Unit |
|---|---|---|---|---|
| Food | 3g | 0% | No | ration |
| Water | 2g | 0% | No | barrel |
| Rum | 30g | +/-20% | No | cask |
| Sugar | 40g | +/-25% | No | sack |
| Timber | 25g | +/-15% | No | plank |
| Cloth | 55g | +/-20% | No | bale |
| Spices | 120g | +/-45% | No | chest |
| Silk | 160g | +/-30% | No | bolt |
| Coffee | 70g | +/-25% | No | bag |
| Cocoa | 90g | +/-30% | No | crate |
| Weapons | 80g | +/-35% | No | crate |
| **Tobacco** | 90g | +/-30% | **Yes** | bale |
| Silver | 250g | +/-35% | No | chest |
| **Slaves** | 220g | +/-60% | **Yes** | person |

### Buying/Selling

- **Buy Price**: Market price x 1.10 (10% markup)
- **Sell Price**: Market price x 0.90 (10% discount)
- **Hold Capacity**: Limited by ship type + Expanded Hold equipment

### Smuggling

- **Contraband**: Tobacco, Slaves
- **Patrol Risk**: Higher if carrying contraband (especially with high infamy and faction heat)
- **Inspection**: Navy patrols can inspect your cargo. Hidden Compartment gives 50% chance to avoid detection.
- **Fine**: 50% of seized contraband value
- **Slaves**: +1 infamy per unit purchased

---

## Missions

### Mission Types

| Type | Description | Rep Impact |
|---|---|---|
| **Escort** | Protect a merchant ship to destination | +2/+3/+4 |
| **Patrol** | Clear a region of hostiles | +2/+3/+4 |
| **Combat** | Hunt down and sink a specific enemy | +3/+4/+5 |
| **Trade** | Deliver goods to a port (source them yourself) | +2/+3/+4 |
| **Smuggle** | Deliver contraband (high risk from patrols) | +2 pirate, -3 target |
| **Assault** | Attack a port's defences | +5 pirate, -8 target |

### Mission Gold Ranges

| Fame Tier | Low Risk | Medium Risk | High Risk | Assault |
|---|---|---|---|---|
| 0 (Unknown) | 80-100g | 100-125g | 125-150g | 150-200g |
| 1 (Recognised) | 400-1,500g | 1,500-5,000g | 5,000-7,000g | 7,000-10,000g |
| 2 (Notorious) | 2,000-7,000g | 7,000-10,000g | 10,000-18,000g | 18,000-22,000g |
| 3 (Legendary) | 6,000-15,000g | 15,000-30,000g | 30,000-50,000g | 50,000-75,000g |
| 4 (Immortal) | 15,200-25,000g | 25,000-50,000g | 50,000-80,000g | 80,000-100,000g |

### Mission Enemy Stats

| Fame Tier | Hull | Cannons | Crew |
|---|---|---|---|
| 0 | 20-45 | 2-6 | 8-18 |
| 1 | 40-75 | 5-10 | 15-35 |
| 2 | 65-110 | 8-16 | 25-55 |
| 3 | 95-155 | 13-22 | 40-80 |
| 4 | 135-210 | 18-30 | 60-110 |

---

## Combat

### Pre-Battle: Intercept Screen

Before every fight, you see an intercept screen with options that depend on the encounter type:

- **Fight**: Always available. Enters turn-based combat.
- **Flee**: Speed check (your speed vs enemy speed). Faster ships flee more reliably.
- **Parley**: Reputation check. Higher rep = better odds of talking your way out.
- **Bribe**: Pay gold to avoid the encounter (not available at high infamy).
- **Surrender**: Lose cargo/gold but avoid combat.
- **Allow Inspection**: Navy patrols only. They check for contraband.

### Combat Actions

| Action | Description | Effect |
|---|---|---|
| **Broadside** | Full cannon volley | 0.8-1.2 x cannons damage (60% hull, 40% crew). Always hits. |
| **Precision** | Aimed shot (70% hit) | 1.2-1.8 x cannons damage (90% hull, 10% crew). Can miss entirely. |
| **Grapple** | Board the enemy | Success = instant victory + plunder. Failure = lose crew. Chance based on crew ratio, hull %, morale. |
| **Evade** | Attempt to flee | Speed-based: faster ships flee up to 95%, slower ships down to 20%. Equal speed = 60%. Failure = take 30% enemy damage. |

### Victory / Defeat / Fled

| Outcome | Effect |
|---|---|
| **Victory** | +gold, +fame, morale boost. If canPlunder: navigate to Plunder screen to pick enemy cargo. |
| **Defeat** | Wash ashore at previous port. Lose all cargo. Active mission cancelled. -10 morale. Ship hull scarred. |
| **Fled** | -5 morale. Mission cancelled if it was a mission fight. Resume sailing. |

### Plunder Screen

After a victory with plunder available:

- **Gold Reward**: 20% of total plunder value awarded automatically
- **Enemy Cargo**: Browse and select which goods to take (limited by your hold capacity)
- **Jettison**: Drop items from your own hold to make room

---

## Factions & Reputation

### Factions

| Faction | Rivals |
|---|---|
| English | Spanish, French |
| Spanish | English, Dutch |
| French | English |
| Dutch | Spanish |
| Pirate | All |

### Reputation Tiers

| Tier | Range | Label | Repair Discount | Mission Gold | Services |
|---|---|---|---|---|---|
| 0 | 0-9 | **At War** | -- | Blocked | Blocked |
| 1 | 10-29 | **Hostile** | -- | -25% | No missions |
| 2 | 30-49 | **Neutral** | -- | Standard | All |
| 3 | 50-79 | **Friendly** | -10% | +10% | All |
| 4 | 80-100 | **Allied** | -20% | +20% | All |

### Reputation Decay

- Reputation above 50 decays -1/day toward 50
- Prevent decay by completing missions for the faction

### Faction Heat

Aggressive actions (combat, fleeing patrols, smuggling) generate **faction heat** -- a short-term alert level (0-10) that increases patrol frequency and changes port gossip. Heat decays over time.

---

## Fame & Infamy

### Fame Tiers

| Tier | Range | Title | Ship Unlocks |
|---|---|---|---|
| 0 | 0-49 | Unknown | Dinghy, Cutter |
| 1 | 50-99 | Recognised | Sloop |
| 2 | 100-199 | Notorious | Schooner, Merchantman, Brigantine |
| 3 | 200-349 | Legendary | Corvette, Frigate, Fluyt |
| 4 | 350+ | Immortal | Galleon, Ship of the Line |

### Infamy Tiers

| Tier | Range | Title | Effect |
|---|---|---|---|
| 0 | 0-9 | Clean | Standard patrol rate |
| 1 | 10-24 | Suspect | Slightly increased patrols |
| 2 | 25-49 | Wanted | Noticeably more patrols |
| 3 | 50-99 | Notorious | Frequent patrols, bribe unavailable |
| 4 | 100+ | Legendary Outlaw | Maximum patrol pressure |

---

## Random Events

- **Frequency**: ~10% chance per day at sea
- **Conditions**: Some events require specific states (e.g., morale < 20 for mutiny)

| Type | Examples | Effects |
|---|---|---|
| **Hazard** | Storm, Doldrums | Hull damage, days lost, crew loss |
| **Choice** | Distressed Merchant, Drifting Wreck, Marooned Sailors | Gold, crew, or combat depending on choice |
| **Reward** | Treasure Map, Whale Sighting | Gold or morale |
| **Crew** | Mutiny, Deserters | Morale crisis, crew loss |
| **Discovery** | Mysterious Chart, Wrecker's Map | Map fragments for hidden ports |

---

## Unlocking Hidden Ports

| Port | Unlock Condition |
|---|---|
| **Roatan** | Fame >= 50 **OR** Pirate reputation >= 65 |
| **Dry Tortugas** | Infamy >= 25 **AND** Pirate reputation >= 65 |
| **Las Aves** | Acquire `map_fragment_lasAves` (from The Wrecker's Map event, costs 5,000g) |
| **Libertalia** | Fame >= 200 **AND** `map_fragment_libertalia` (from A Dying Sailor's Secret event) |

---

## Controls & UI

### Port Screen
- **Map**: Click a port to set sail (greyed out if unreachable)
- **Services**: Navigate to Shipyard, Crew, Market, Status, Journal
- **Gossip**: WORD ON THE DOCKS panel shows local rumours based on your heat, reputation, fame, and market conditions
- **Missions**: Accept/abandon missions on the mission board
- **Save/Load**: Save, Export (download .json), Import (upload .json), Load

### Sailing Screen
- **Progress**: SVG route with ship position
- **Wind**: Compass indicator (wind affects travel time)
- **Provisions**: Food/water bars with days remaining
- **Log**: Recent events and actions

### Battle Screen
- **Player/Enemy**: Hull bars, crew count, cannons
- **Actions**: Broadside, Precision, Grapple, Evade buttons
- **Log**: Turn-by-turn results with crew loss names

---

## Tips & Strategies

### Early Game
- **Start Small**: Focus on escort and trade missions (low risk, guaranteed profit)
- **Stock Up**: Always carry 10-20 days of food/water (1 per 10 crew per day)
- **Save Often**: Use Export Save to keep a backup outside the browser
- **Upgrade to Cutter ASAP**: The Dinghy is fragile and slow

### Mid Game
- **Equip Your Ship**: Install Reinforced Hull and Extra Cannons for combat survivability
- **Explore**: Unlock hidden ports (Roatan: fame 50 OR pirate rep 65)
- **Trade Smart**: Buy low in one port, sell high in another. Watch the gossip for price hints.
- **Manage Crew**: Keep morale above 50. Buy drinks at taverns. Watch for faction tensions.

### Late Game
- **Big Ships**: Frigate or Galleon for assault missions and large cargo hauls
- **Equipment Combos**: Long Guns + Expanded Hold on a Galleon = devastating trade-warship
- **Balance Fame/Infamy**: Fame unlocks better ships; infamy unlocks pirate content but increases patrols
- **Locker Management**: Remove equipment before buying a new ship!

### Combat Tips
- **Broadside**: Safest for consistent damage
- **Precision**: Use against high-hull targets (70% hit, higher damage)
- **Grapple**: Best when you have crew advantage. Instant win + plunder.
- **Evade**: Check ship speeds first. Faster ships flee reliably (up to 95%). Slower ships may still flee at 20-60%.

### Economy Tips
- **Trade Missions Guarantee Profit**: The reward ensures you won't lose money, but source goods yourself
- **Smuggling**: High profit but risky. Hidden Compartment helps with inspection.
- **Spices & Silk**: Highest variance = biggest trade profits (but sometimes unavailable)

---

## Further Reading

- [Roadmap](roadmap) -- Upcoming features and priorities
- [Architecture](architecture) -- Technical deep dive into the game's design