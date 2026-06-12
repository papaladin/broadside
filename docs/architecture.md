
# Game Design


***

## Design Philosophy

Broadside is a **systems-driven pirate game** that creates stories through mechanical interaction, not scripted narrative.

> *A few mechanics that interact strongly beat many mechanics that exist independently.*

Every feature must pass this test: **does it create situations where two or more existing systems collide in ways the player didn't expect?**

### Three Pillars

Every feature must serve at least one of these. If it doesn't, it doesn't ship.

| Pillar | What it means | Examples in-game |
|---|---|---|
| **Freedom** | Open-world, player-directed, multiple viable playstyles | Go anywhere, be a trader/pirate/privateer/smuggler, no forced path |
| **Consequence** | Every choice ripples — the world reacts, remembers, and pushes back | Reputation, crew loyalty, faction heat, infamy, gossip, named crew death |
| **Discovery** | The Caribbean reveals itself through play — secrets earned, not given | Hidden ports, gossip hints, emergent crew stories, market patterns, map fragments |

### Core Design Axioms

- **Every success creates a new problem.** Win a battle → hull damaged, crew lost, cargo to manage, reputation shifted, heat increased.
- **The world remembers what you did.** Reputation, infamy, heat, crew loyalty, gossip — actions have echoes.
- **Crew are people, not numbers.** Named individuals with traits, scars, faction loyalties, and generated biographies. Losing a veteran hurts because you remember their story.
- **Resources are interconnected.** Gold buys crew, crew costs wages, wages require missions, missions require ships, ships require fame.
- **Time is the universal cost.** Every action takes days. Days consume provisions. Provisions cost gold. The clock is always ticking.

### Core Emotional Targets

| Emotion | Source | Example |
|---|---|---|
| **Pressure** | Resource interconnection | You need crew but can't afford wages. You need gold but can't afford the mission's risk. |
| **Consequence** | Permanent state changes | Your best navigator dies. A faction remembers your betrayal. Your ship is scarred. |
| **Attachment** | Named crew, emergent reputation | You protect crew members who've been with you since the beginning. |
| **Emergent story** | System collisions | A smuggle run goes wrong because your Spanish crew refused to forgive the attack on a Spanish patrol. |

### Game Influences & Stance

| Area | Reference | Broadside stance |
|---|---|---|
| Game loop structure| *Sid Meier's Pirates!*, *Galaxy on Fire 2HD*, *Caravaneer* | Similar feel, but with the resource pressure and logistics of Caravaneer |
| Roguelike structure | *FTL: Faster Than Light* | Node-based exploration, meaningful events, permadeath consequences |
| Systems-driven narrative | *Dwarf Fortress* | Stories emerge from mechanics, not scripts |
| Crew identity | *Darkest Dungeon* | Named characters accumulate traits; loss has weight |
| Encounter design | *Sunless Sea* | Atmosphere-first writing, choices with consequences |

***

## Gameplay Architecture

Broadside is designed as a systems-driven game. The goal is not to add isolated features, but to build interacting rule sets where player choices create consequences across multiple parts of the game.

| Term                             | Meaning in Broadside                                                                          | Example                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Loop**                         | A repeated player activity cycle                                                              | Port → Prepare → Sail → Encounter → Arrive → Recover      |
| **System**                       | A stateful rule set that can be affected by actions and can mechanically affect other systems | Heat, Crew, Combat, Economy                               |
| **Mechanic**                     | A specific action or rule operation within a system                                           | Buy goods, grapple, install equipment, buy drinks         |
| **Stat / Resource / Tag**        | A value read or written by systems                                                            | Gold, hull, fame, morale, `upset`, `loyal`, `scar_battle` |
| **Feature / Screen**             | A player-facing implementation that exposes or supports systems                               | Shipyard screen, Captain's Journal, tutorial overlay      |
| **Narrative Presentation Layer** | Textual output that makes systemic consequences readable                                      | Gossip, captain's log, crew bios, journal entries         |

> Every major gameplay system should create consequences that at least one or two other systems care about — but not every stat needs to affect everything.

***

## Nested Game Loops

**Core Loop** (click)
```
Advance Day
 → Travel progresses
 → Event roll (heat / mission / random)
 → Player reaction (fight / flee / accept / ignore)
 → Resolution (combat / reward / loss)
 → Log entry generated
 → State updated (crew / morale / gold / supplies)
```

**Decision & Resolution loops** (micro, sec)
Player decisions
- Choose destination
- Choose mission
- Trade / hire / upgrade
- Choose reactions
System resolutions
- Random events and encounters
- Combat, mission and trade resolution
- Crew & morale updates
- Resourse and gold consumption
- Log and bio generation (externalized narrative output).

**Activity loops**  (mini, minutes)
- Trading and managing resources (Buy → Transport → Sell → Profit)
- Combat (Engage → Resolve → Loot/Loss → Consequences)
- Doing missions (Accept → Travel → Resolve → Reward)
- Sailing from A to B (Select route → Travel days → Encounters → Arrival)
- Manging crew size and morale (Hire → Serve → Events → Desert/Death → Replace)
- Managing ships and equipments (Purchase Ship or Equipment → Compare new Ship or Equipment → Install Equipments → Replace Ship )
- Recovery at port (Repair / resupply / recruit → Reduce risk (heat, morale recovery) → Prepare next expedition )

**Progression & Narrative loop** (main, hours)
- Economic progression ( Gold → ships → capacity)
- Power progression (Ship size → combat strength → mission tier )
- Reputation progression (Fame / infamy → unlock content → risk increase )
- Create a unique story (Log& bio generated through resolution of Core,  Decision & Resolution loops)





***

## Core Gameplay Systems

| System                       | Main state                                                            | Main design role                 |  Mains Systems impacted            |  
| ---------------------------- | --------------------------------------------------------------------- | -------------------------------- | ---------------------------------- |
| **Economy**                  | Gold, cargo, provisions, wages, prices, repair costs                  | Pressure                         | Navigation, Ship, Equipment, Crew               |
| **Mission**                  | Active mission, rewards, destination, risk, target, reputation impact | Structure                        | Economy, Combat, Fame/Infamy, Reputation          |
| **Navigation**               | Current port, destination, travel days, range, speed, provisions      | Time cost                        | Events, Port, Heat               |
| **Combat**                   | Hull, crew, cannons, enemy state, action choices, plunder             | Consequence generator            | Ship, Heat, Reputation, Crew               |
| **Crew**                     | Roster, morale, faction, traits, scars, tags, days aboard             | Attachment and human consequence | Economy, Combat               |
| **Reputation**               | Port/faction standing, service access, prices                         | World memory                     | Mission, Economy               |
| **Heat**                     | Temporary faction alert, decay, patrol pressure                       | Short-term consequence           | Event, Combat               |
| **Fame / Infamy**            | Career progression, unlocks, notoriety                                | Long-term identity               | Mission, Combat, Ship, Equipment      |
| **Ship**                     | Hull, speed, cannons, hold, max crew, max days                        | Strategic capability             | Combat, Economy, Crew   |
| **Equipment**                | Installed items per slot, locker inventory, effect flags              | Build specialisation             | Ship, Combat, Economy, Navigation, ..       |
| **Port / Market / Services** | Port faction, services, goods, missions, shipyard access              | Decision hub                     | Economy, Mission, Crew, Navigation        |
| **Events**                   | Voyage events, event choices, outcomes                                | System disruption and surprise   |  Navigation, Crew          |

Gossip, captain's log entries, crew biographies, and the Captain's Journal are not treated as core gameplay systems by themselves. They are part of the **Narrative Presentation Layer**.
Their role is to make consequences visible and help the player understand why things happened.
They generally do not create mechanical effects on their own.

Technical modules should remain simple and data-driven, but gameplay architecture should preserve clear boundaries:

* Systems own state and rules.
* Mechanics are actions or rule operations inside systems.
* Stats/resources/tags are data read and written by systems.
* Features/screens expose systems to the player.
* Narrative presentation translates system consequences into readable story.

This keeps Broadside expandable without turning every feature into an isolated mini-system or making every stat affect every other stat.

Example:

```
Combat system:    The player defeats a Spanish ship.
Crew system:      Spanish crew members may become upset.
Heat system:      Spanish heat increases.
Reputation system: Spanish reputation may fall.
Narrative Layer:  "Maria Navarro is disturbed by the attack on Spanish ships."
                  "Soldiers patrol the docks. The garrison has been reinforced."
                  The Journal records both under the relevant day.
```




# Technical Design


## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Tech Stack and Constraints](#2-tech-stack-and-constraints)
3. [File Structure](#3-file-structure)
4. [Dependency Graph](#4-dependency-graph)
5. [File Responsibilities](#5-file-responsibilities)
6. [Global Namespace Convention](#6-global-namespace-convention)
7. [State Shape Reference](#7-state-shape-reference)
8. [Game Mechanics Implementation](#8-game-mechanics-implementation)
9. [Adding New Content — Patterns](#9-adding-new-content--patterns)
10. [Testing Infrastructure](#10-testing-infrastructure)
11. [Constraints for AI Agents](#11-constraints-for-ai-agents)

---

## 1. Design Principles

### Separation of concerns — the core rule

| Layer | File(s) | May call | May NOT call |
|---|---|---|---|
| **Data** | `data.js`, `data_text.js` | Nothing | Logic, Engine, UI |
| **Logic** | `logic.js` | `window.D` | Engine, UI |
| **Storage** | `storage.js` | `window.D`, `window.L` | Engine, UI |
| **Generators** | `generators.js` | `window.D`, `window.L` | Engine, UI |
| **Engine** | `engine_core.js`, `engine_port.js`, `engine_voyage.js`, `engine_combat.js` | `window.D`, `window.L`, `window.G` | UI |
| **UI** | `ui.jsx` | `window.D`, `window.L` | Engine, Generators |
| **Screens** | `screens_port.jsx`, `screens_voyage.jsx`, `screens_market.jsx`, `screens_crew.jsx`, `screens_shipyard.jsx` | `window.D`, `window.L`, `window.E`, `window.UI` | Generators (directly) |
| **App** | `App.jsx` | Everything via dispatch | — |

### Pure functions in logic.js

`logic.js` contains **zero side-effects**. Every function is `(input) → output` with no mutation, no DOM access, no randomness. All RNG lives in `generators.js`.

### Storage as a logic extension

`storage.js` extends `window.L` with localStorage-related helpers (save/load encoding, tutorial state management). It loads immediately after `logic.js` and attaches functions to the same `window.L` namespace. No RNG — just I/O wrappers.

### Immutable state

The reducer always returns a **new** state object. No mutation of the previous state. Spread-copy every nested object that changes.

### Single source of truth

- All game constants → `data.js` + `data_text.js`
- All derived calculations → `logic.js`
- All save/load and tutorial state → `storage.js`
- All random generation → `generators.js`
- All state transitions → `engine_*.js` reducers
- All visual tokens → `ui.jsx` theme object `T`

### Files that change together live together

Port-related screens, port engine actions, and port-related generators are organized by domain, not by technical layer. The engine is split into domain files (`engine_port.js`, `engine_voyage.js`, `engine_combat.js`) that each register their own reducer into the core chain. Screens are split by domain: port, voyage, market, crew, shipyard.

---

## 2. Tech Stack and Constraints

### Stack

| Tool | Role |
|---|---|
| React 18 (CDN) | UI rendering |
| Babel Standalone (CDN) | JSX → JS in-browser |
| Vanilla JS (ES2020) | All game logic, engine, data |
| localStorage | Save/load |
| No build step | Files loaded via `<script>` tags in `index.html` |

### Hard constraints

- No npm, no bundler, no TypeScript, no build step.
- Each `.js` / `.jsx` file is a single IIFE or global assignment.
- Scripts are loaded in strict dependency order via `<script>` tags.
- All inter-file communication is via `window.*` namespaces.
- Target: modern desktop and mobile browsers.

### Save keys

```
localStorage key: "piratesSave"
Format: JSON.stringify(state)
Migration: migrateState() in engine_core.js adds missing fields on load

Tutorial state key: "broadside_tutorial"
Format: JSON.stringify({ seenScreens: [...] })
Managed by: storage.js (shouldShowTutorial, markTutorialSeen)
```

---

## 3. File Structure

### Current structure

```
broadside/
├── index.html              ← entry point, <script> load order
├── data.js                 ← window.D — game constants (ports, ships, factions, equipment, resources, etc.)
├── data_text.js            ← extends window.D — text constants (crew names, bio openings, gossip templates, etc.)
├── logic.js                ← window.L — pure functions
├── storage.js              ← extends window.L — save/load encoding, tutorial state
├── generators.js           ← window.G — RNG: missions, markets, crew, enemies, gossip, bios
├── engine_core.js          ← window.E — reducer chain, initial state, actions, save/load, state migration
├── engine_port.js          ←           port domain reducer (docked actions, equipment, missions, trade)
├── engine_voyage.js        ←           voyage domain reducer (sailing, day advance, events, patrols)
├── engine_combat.js        ←           combat domain reducer (encounters, battles, plunder, event resolution)
├── ui.jsx                  ← window.UI — theme tokens, all presentational components
├── screens_port.jsx        ← window.S — TitleScreen, ScenarioScreen, PortScreen, StatusScreen, JournalScreen
├── screens_shipyard.jsx    ← window.S — ShipyardScreen (3 tabs: Ships, Equipment, Locker)
├── screens_crew.jsx        ← window.S — CrewScreen
├── screens_market.jsx      ← window.S — MarketScreen
├── screens_voyage.jsx      ← window.S — MapScreen, SailingScreen, EventScreen, InterceptScreen, BattleScreen, PlunderScreen
├── App.jsx                 ← Root: HUD, screen router, ErrorBoundary, DebugPanel
├── docs/
│   ├── architecture.md
│   ├── readme.md
│   ├── player_guide.md
│   ├── developer_guide.md
│   ├── roadmap.md
│   ├── specs_data.md
│   ├── specs_engine.md
│   ├── specs_logic.md
│   ├── specs_generators.md
│   ├── specs_jsx.md
│   ├── Home.md
│   └── _Sidebar.md
├── tests/
│   ├── tests.html              ← test runner & utilities
│   ├── tests_balance.html      ← balance and tuning checks
│   ├── tests_helpers.js        ← shared test helpers
│   ├── tests_logic.js          ← unit tests (logic + generators)
│   ├── tests_engine.js         ← reducer tests
│   ├── tests_flows.js          ← integration & scenario tests
│   ├── tests_ui.js             ← UI smoke & edge case tests
│   ├── sim.html                ← economy playtest simulator (Monte Carlo)
│   ├── crew_sim.html           ← crew lifecycle simulator
│   ├── crew_bio_log_sim.html   ← bio/log redundancy analyser
│   └── equipment_combo_analyzer.html ← equipment combination analyser
└── screenshots/
    └── index.html              ← screenshot generator for itch.io assets
```

---

## 4. Dependency Graph

### Current

```
data.js (D)
└─→ data_text.js (extends D)
    └─→ logic.js (L)
        ├─→ storage.js (extends L)
        └─→ generators.js (G)
            └─→ engine_core.js (E)
                ├─→ engine_port.js
                ├─→ engine_voyage.js
                └─→ engine_combat.js
                    └─→ ui.jsx (UI)
                        ├─→ screens_port.jsx (S)
                        ├─→ screens_shipyard.jsx (S)
                        ├─→ screens_crew.jsx (S)
                        ├─→ screens_market.jsx (S)
                        └─→ screens_voyage.jsx (S)
                            └─→ App.jsx
```

### Dependency direction rule — never violated

Arrows point **downward only**. A file may import from files above it in the graph but never below. `data.js` imports nothing. `App.jsx` can read anything.

The `index.html` `<script>` load order matches this graph top-to-bottom:

```html
<!-- index.html load order -->
<script src="data.js"></script>
<script src="data_text.js"></script>
<script src="logic.js"></script>
<script src="storage.js"></script>
<script src="generators.js"></script>
<script src="engine_core.js"></script>
<script src="engine_port.js"></script>
<script src="engine_voyage.js"></script>
<script src="engine_combat.js"></script>
<script type="text/babel" src="ui.jsx"></script>
<script type="text/babel" src="screens_port.jsx"></script>
<script type="text/babel" src="screens_shipyard.jsx"></script>
<script type="text/babel" src="screens_crew.jsx"></script>
<script type="text/babel" src="screens_market.jsx"></script>
<script type="text/babel" src="screens_voyage.jsx"></script>
<script type="text/babel" src="App.jsx"></script>
```

---
## 5. File Responsibilities

### data.js -> `window.D`

Pure constants. No functions, no logic, no imports. Contains: `PORTS`, `SHIPS`, `FACTIONS`, `EQUIPMENT`, `RESOURCES`, `GOODS_AVAILABILITY`, `MISSION_GOLD_RANGES`, `MISSION_ENEMY_RANGES`, `PLUNDER_TARGET`, `PLUNDER_GOLD_RATIO`, `FACTION_PLUNDER_GOODS`, `MISSION_REP_IMPACTS`, `TRADE_MISSION_PROFIT_MARGINS`, `SMUGGLE_PROFIT_MARGINS`, `TRADE_GOODS_BY_TIER`, `SMUGGLE_GOODS_BY_TIER`, `RANDOM_EVENTS`, `STARTS`, `CREW_ROLES`.

-> See [specs_data.md](specs_data) for full schema.

### data_text.js -> extends `window.D`

Text-only constants split from `data.js` for maintainability. Contains: `CREW_FIRST_NAMES`, `CREW_LAST_NAMES`, `MISSION_NAME_PARTS`, `ENEMY_SHIP_NAMES`, `BIO_OPENINGS`, `BIO_COMBOS`, `PORT_GOSSIP_TEMPLATES`, `ENCOUNTER_FLAVOUR`, `SURRENDER_CONSEQUENCE`, `ARRIVAL_MESSAGES`, `TRAIT_REVEAL_TEMPLATES`, `SCAR_LABELS`.

Extends `window.D` by assigning additional keys to the existing namespace.

### logic.js -> `window.L`

Pure functions. No side-effects, no RNG. All game math: combat resolution, reputation checks, travel calculations, fame tiers, hold/provision math, encounter context building, equipment effects, crew tag operations, log classification, heat labels.

Key functions: `getShipStats`, `travelDays`, `canReach`, `getUnreachableReason`, `getRepPerk`, `getFameInfo`, `getInfamyLabel`, `combatRound`, `getNPCAction`, `buildEncounterContext`, `getEquipmentEffect`, `canInstallEquipment`, `getHoldCapacity`, `getHoldUsed`, `hasTag`, `addTag`, `removeTag`, `revealTag`, `getCrewAlignment`, `getAlignmentModifier`, `classifyLogLine`, `getLogTabCategory`, `getHeatLabel`, `guessShipType`, `roll`, `getEffectiveMorale`, `maybeRandomPatrol`, `canSeePort`, `getRepairCost`.

-> See [specs_logic.md](specs_logic) for function catalogue.

### storage.js -> extends `window.L`

Save/load I/O and tutorial state management. Loads after `logic.js` and attaches helpers to `window.L`. No RNG, no game logic -- pure I/O wrappers around `localStorage`.

Key functions: `hasSave`, `encodeSave`, `decodeSave`, `checkLocalStorageAvailable`, `loadTutorialState`, `saveTutorialState`, `getDefaultTutorialState`, `shouldShowTutorial`, `markTutorialSeen`.

### generators.js -> `window.G`

All RNG-dependent generation. Depends on `window.D` and `window.L`.

Key functions: `generateMissions`, `generatePortMarket`, `generateCrewMember`, `generateRoster`, `generateEnemyCargo`, `generateCrewBio`, `generatePortGossip`, `generateLocalMarketGossip`, `generateHiddenPortHint`.

Internal helpers: `randBetween`, `randInt`, `pickRandom`, `pickWeighted`, `pickWeightedRole`.

-> See [specs_generators.md](specs_generators) for function catalogue.

### engine_core.js -> `window.E`

Sets up the reducer chain and shared infrastructure:

- `window.E.A` -- action type constants (48 actions)
- `window.E.initialState` -- the blank initial state object
- `window.E._reducers` -- array; each domain file pushes its own reducer
- `window.E.reducer` -- master reducer that chains all domain reducers
- `window.E.autoSave`, `window.E.migrateState` -- save/load helpers
- `window.E.createBattleState` -- battle state factory

The master reducer works by chaining:
```js
window.E.reducer = (state, action) =>
  window.E._reducers.reduce((s, r) => r(s, action), state);
```

### engine_port.js

Port domain reducer. Handles: `START_GAME`, `LOAD_GAME`, `SAVE_GAME`, `EXPORT_SAVE`, `IMPORT_SAVE`, `NAVIGATE`, `REPAIR`, `BUY_SHIP`, `BUY_EQUIPMENT`, `INSTALL_EQUIPMENT`, `REMOVE_EQUIPMENT`, `HIRE_CREW`, `RAISE_MORALE`, `TAKE_MISSION`, `ABANDON_MISSION`, `COMPLETE_MISSION`, `REFRESH_MISSIONS`, `SAIL_TO`, `CONFIRM_TRADE`, `ENTER_PORT`.

Key helpers: `processDesertion`, `processPositiveTraits`, `pickArrivalMessage`, `checkServicesBlocked`, `validateTrade`.

### engine_voyage.js

Voyage domain reducer. Handles: `ADVANCE_DAY` (the core sailing loop -- consume provisions, pay wages, advance crew days, check events, check encounters, check arrival, discover hidden ports) and `DISCOVER_PORT`.

Key helpers: `advanceWind`, `advanceCrew`, `advanceProvisions`, `maybeSmugglePatrol`, `maybeMissionEncounter`, `maybeRandomEvent`, `checkRandomPatrol`, `advanceHiddenPorts`.

### engine_combat.js

Combat domain reducer. Handles: `INTERCEPT_FIGHT`, `INTERCEPT_FLEE`, `INTERCEPT_SURRENDER`, `INTERCEPT_BRIBE`, `INTERCEPT_PARLEY`, `INTERCEPT_INSPECT`, `BATTLE_ACTION`, `DISMISS_BATTLE`, `TAKE_PLUNDER`, `RESOLVE_EVENT`, `ATTACK_PIRATE`, `ATTACK_MERCHANT`.

Key helper: `pickMerchantFaction`.

-> See [specs_engine.md](specs_engine) for the full action table.

### ui.jsx -> `window.UI`

Pure presentational components. No game logic. Contains:

- **Theme tokens** `T` -- all colors, fonts, spacing
- **Style helper** `panelStyle(overrides)`
- **Base components**: `Btn`, `Bar`, `Pill`, `StatBlock`, `SectionTitle`, `ScreenHeader`, `LogList`, `Divider`, `EmptyState`, `BackButton`, `NarrativePanel`, `NarrativeLine`, `TutorialPopup`
- **Game components**: `FactionPill`, `RepPill`, `ShipSprite`

### screens_port.jsx -> `window.S`

`TitleScreen`, `ScenarioScreen`, `PortScreen`, `StatusScreen`, `JournalScreen`.

### screens_shipyard.jsx -> `window.S`

`ShipyardScreen` (3 tabs: Ships, Equipment, Locker).

### screens_crew.jsx -> `window.S`

`CrewScreen`.

### screens_market.jsx -> `window.S`

`MarketScreen`.

### screens_voyage.jsx -> `window.S`

`MapScreen`, `SailingScreen`, `EventScreen`, `InterceptScreen`, `BattleScreen`, `PlunderScreen`.

All game screens receive `{ state, dispatch }` props.

### App.jsx

Root component. Contains:

- `ErrorBoundary` -- catches render errors, offers reload + load-save recovery
- `App` -- initializes `useReducer(E.reducer, E.initialState)`, renders HUD + screen router
- `HUD` -- sticky top bar with gold, day, crew, hull, morale, fame, infamy, provisions, hold, contraband indicator
- `DebugPanel` -- activated via `?debug=1` URL param
- Screen router -- `switch(state.screen)` maps to screen components

---

## 6. Global Namespace Convention

| Namespace | Source | Contents |
|---|---|---|
| `window.D` | `data.js` + `data_text.js` | All constants: PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES, crew names, gossip templates, etc. |
| `window.L` | `logic.js` + `storage.js` | All pure functions + save/load encoding + tutorial state helpers |
| `window.G` | `generators.js` | All RNG-dependent generators |
| `window.E` | `engine_core.js` + domain files | Reducer chain, actions, initial state |
| `window.UI` | `ui.jsx` | Theme tokens, all presentational components |
| `window.S` | `screens_*.jsx` (5 files) | All screen components |

Common destructuring patterns at the top of files:

```js
// In engine files:
const { PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES } = window.D;
const L = window.L;
const G = window.G;

// In screen files:
const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, BackButton, NarrativePanel, TutorialPopup } = window.UI;
const { FactionPill, RepPill, ShipSprite } = window.UI;
```

---

## 7. State Shape Reference

The full state shape is defined in `engine_core.js` -> `window.E.initialState`. See [specs_engine.md](specs_engine) for the complete shape with types and defaults.

Key top-level fields:

```js
{
  version: 1,
  screen: "title",
  day: 1,
  startDate: { day: 1, month: 6, year: 1695 },
  log: [],
  gold: 0,
  fame: 0,
  infamy: 0,
  scenarioId: null,
  factionAlerts: { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 },
  currentPort: "portRoyal",
  previousPort: null,
  destination: null,
  discoveredPorts: [...],  // non-hidden port keys
  mapFragments: [],
  equipmentInventory: [],   // locker: removed equipment stored here
  sailingDaysLeft: 0,
  sailingDaysTotal: 0,
  wind: { angle: 45, speed: 10 },
  ship: {
    type: "sloop",
    name: "Sea Dog",
    hull: 100,
    cannons: 10,
    equipment: { hull: [], armament: [], rigging: [], special: [] }
  },
  crew: {
    roster: [],  // array of crew member objects
    max: 50,
    morale: 80
  },
  hold: {
    items: { food: 10, water: 10, rum: 0, sugar: 0, timber: 0, cloth: 0, spices: 0, silk: 0, coffee: 0, cocoa: 0, weapons: 0, tobacco: 0, silver: 0, slaves: 0 }
    // NOTE: no 'capacity' field -- use L.getHoldCapacity(state) for computed hold capacity
  },
  portMarket: null,
  portGossip: [],
  missions: [],
  activeMission: null,
  reputation: { /* all port keys: 50 */ },
  battleState: null,
  activeEvent: null,
  encounterContext: null
}
```

---

## 8. Game Mechanics Implementation

This section describes how game mechanics are implemented. For detailed numbers, see the referenced spec files.

### Equipment installation rules

Ships have a `slots` object defining how many items of each slot type they support (e.g. `{ hull: 1, armament: 1, rigging: 1, special: 0 }`). Player equipment is stored in `state.ship.equipment: { hull: [], armament: [], rigging: [], special: [] }`.

```js
// Check if equipment can be installed:
L.canInstallEquipment(state, equipKey) // checks slot availability, requiredFame, requiredHull

// Effective stats with equipment applied:
L.getShipStats(state) // { cannons, speed, maxHull } with equipment bonuses
```

Equipment effects are defined in `D.EQUIPMENT[key].effects` -- e.g. `{ hullBonus: 0.2 }`, `{ cannonBonus: 2 }`, `{ speedBonus: 1 }`.

When buying a new ship, all installed equipment is **lost** (reset to empty arrays). Removable equipment can be uninstalled to the **locker** (`state.equipmentInventory`) before selling the ship.

Equipment has an `installFee` (gold cost to install) and `removable` flag (whether it can be moved to the locker).

### Travel and range

```js
L.travelDays(fromPort, toPort, state) // number of days
L.canReach(state, portKey) // boolean
L.getUnreachableReason(state, portKey) // string | null
```

Travel days are based on Euclidean distance between port coordinates, modified by ship speed, equipment bonuses, morale modifier, and hold load. Some ports have a `minHull` requirement (remote ports need brigantine+ sized vessels).

Hidden ports (`port.hidden = true`) are not shown on the map until `state.discoveredPorts` includes their key. Discovery is gated by `port.unlockCondition` -- checked by `L.canSeePort(state, portKey)`.

### Wind and sailing

Wind is randomised at game start and drifts each day: `{ angle: 0-360, speed: 5-25 }`. Wind **affects travel time**: favourable wind (-1 day), opposing wind (+1 day), based on the angle difference between wind direction and the bearing to the destination. This is applied inside `L.travelDays()`.

### Encounter routing -- all encounters through InterceptScreen

Every hostile encounter (patrol, pirate, mission combat) goes through `L.buildEncounterContext(state, enemy, encounterType)` which produces an `encounterContext` object with:

- `enemy` -- stats of the hostile ship
- `flavourText` -- generated from `D.ENCOUNTER_FLAVOUR[encounterType]`
- `options[]` -- array of available actions, each with `{ id, label, available, reason, action }`

The `InterceptScreen` renders these options directly -- it has **no game logic**, only UI.

#### Encounter types and available options

| Encounter Type | Fight | Flee | Parley | Bribe | Surrender | Inspect | Source |
|---|---|---|---|---|---|---|---|
| `patrol` | Y | Y | Y | Y (infamy<50) | Y | -- | Random patrol while sailing |
| `navy_patrol` | Y | -- | -- | -- | -- | Y | Faction patrol -- only inspect or fight |
| `mission_combat` | Y | Y | -- | -- | -- | -- | Combat/patrol mission target |
| `escort_defend` | Y | Y | -- | -- | -- | -- | Escort mission -- pirates attack convoy |
| `distressed_merchant_help` | Y | -- | -- | -- | -- | -- | Event: chose to defend merchant |
| `distressed_merchant_plunder` | Y | -- | -- | -- | -- | -- | Event: chose to attack merchant |
| `hostile_port_entry` | Y | Y | -- | -- | Y | -- | Entering a port at war (rep < 10) |
| `random` | Y | Y | Y | Y | Y | -- | Generic pirate encounter |

#### Flee mechanics

Pre-battle flee (from InterceptScreen):
```
Player speed estimated from ship type
Enemy speed estimated via L.guessShipType(enemy)
speedBonus = min(0.3, max(-0.3, (playerSpeed - enemySpeed) * 0.02))
fleeChance = min(0.95, max(0.20, 0.6 + speedBonus))
Failure -> forced into battle
```

In-battle evade (from BattleScreen, action = "evade"): same speed-based formula, ends battle with phase `"fled"`.

#### Random patrol generation

```js
L.maybeRandomPatrol(state)
Base chance: ~1% per sailing day
+ infamy / 400  (i.e. +0.25% per infamy point)
+ heat bonus: highest faction alert * 0.03
- dampened by high reputation with the patrolling faction
Capped at 40%
Formula: Math.min(baseChance + infamyBonus + heatBonus, 0.40)
```

### Reputation thresholds

Port reputation (0-100) determines service access, mission reward multipliers, and repair discounts.

| Tier | Range | Label | Repair Discount | Mission Gold | Services |
|---|---|---|---|---|---|
| 0 | 0-9 | At War | -- | Blocked | Blocked |
| 1 | 10-29 | Hostile | -- | -25% | No missions |
| 2 | 30-49 | Neutral | -- | Standard | All |
| 3 | 50-79 | Friendly | -10% | +10% | All |
| 4 | 80-100 | Allied | -20% | +20% | All |

Reputation above 50 decays -1/day toward 50.

-> See [specs_logic.md -- getRepPerk()](specs_logic) for the full threshold table.

### Fame system

Fame is a permanent progression score (never decreases). It gates ship purchases (`SHIPS[type].requiredFame`), equipment availability (`EQUIPMENT[key].requiredFame`), mission tiers, and hidden port discovery.

| Tier | Range | Label |
|---|---|---|
| 0 | 0-49 | Unknown |
| 1 | 50-99 | Recognised |
| 2 | 100-199 | Notorious |
| 3 | 200-349 | Legendary |
| 4 | 350+ | Immortal |

### Morale system

Crew morale (0-100) affects combat effectiveness and can trigger desertion/mutiny events. `getEffectiveMorale(state)` adds equipment morale bonuses.

### Economy system

The market uses a dynamic pricing model: each port visit generates prices based on `RESOURCES[good].basePrice * (1 +/- variance)`, with availability tiers (`always`, `frequently`, `sometimes`, `rarely`, `never`) mapped per-port in `GOODS_AVAILABILITY`. Hold capacity is computed via `L.getHoldCapacity(state)` which accounts for ship type and equipment effects.

### Parametric mission generation

Missions are generated procedurally by `G.generateMissions()`. Six types: **escort, patrol, combat, trade, smuggle, assault**. Type selection is weighted by the issuing port's faction. Risk level (low/medium/high) is tier-weighted. Gold, fame, and enemy stats scale with the player's fame tier (0-4).

-> See [specs_generators.md](specs_generators) for generation logic.

### Named crew roster

Crew members are generated with `G.generateCrewMember(faction)` -> `{ id, firstName, lastName, role, faction, daysAboard, tags }`. Names are drawn from faction-specific pools in `D.CREW_FIRST_NAMES` / `D.CREW_LAST_NAMES`. Roles are weighted-random but **currently cosmetic only**.

Crew accumulate **tags** over time: hidden traits (`hidden_drunkard`, `hidden_coward`, `hidden_greedy`, `hidden_troublemaker`), revealed traits, scars (`scar_battle`, `scar_storm`, `scar_grapple`, `scar_mutiny`, `scar_shipwreck`), positive progression (`seasoned` at 50d, `veteran` at 100d, `loyal` at 200d), faction alignment tags (`upset`, `mutineer`). Tags are operated on by `L.hasTag`, `L.addTag`, `L.removeTag`, `L.revealTag`.

Crew biographies are generated by `G.generateCrewBio()` using opening templates, combination sentences, scar/trait variants, and suppression logic to avoid redundancy.

### Combat resolution flow

Turn-based, resolved in `engine_combat.js` via `BATTLE_ACTION`.

1. Player chooses action: `broadside` | `precision` | `grapple` | `evade`
2. NPC chooses action (weighted random via `L.getNPCAction`)
3. Damage is calculated by `L.combatRound(state, playerAction, npcAction)` -> returns updated battle state
4. Phase check: hull <= 0 -> defeat/victory. Successful evade -> fled. Successful grapple -> instant victory.
5. On victory with `canPlunder`: player navigates to PlunderScreen to manually pick cargo.

### Save / load behaviour

- **Auto-save flash**: HUD shows checkmark when `currentPort` or `missions.length` changes
- **Manual save**: `SAVE_GAME` action in engine_port.js -> `localStorage.setItem("piratesSave", ...)`
- **Load**: `LOAD_GAME` action -> `JSON.parse` + `migrateState()` (adds missing fields for save compatibility)
- **File export**: `EXPORT_SAVE` -> `L.encodeSave(state)` -> downloads as JSON file
- **File import**: `IMPORT_SAVE` -> `L.decodeSave(json)` -> `migrateState` -> dispatch
- **Error recovery**: `ErrorBoundary` in App.jsx offers "Try Load Last Save" button
- **localStorage availability**: `L.checkLocalStorageAvailable()` detects iframe/Safari blocks

---
## 9. Adding New Content -- Patterns

### Add a port

1. Add entry to `PORTS` in `data.js` with `name`, `faction`, `x`, `y`, `services[]`, `desc`
2. If hidden: add `hidden: true` and `unlockCondition`
3. Add goods availability row to `GOODS_AVAILABILITY` in `data.js`
4. Add reputation entry to `initialState.reputation` in `engine_core.js`
5. MapScreen reads `PORTS` directly -- no screen changes needed

### Add a ship

1. Add entry to `SHIPS` in `data.js` with all stats: `name`, `maxHull`, `maxCrew`, `cannons`, `speed`, `cost`, `requiredFame`, `maxDays`, `holdCapacity`, `slots: { hull, armament, rigging, special }`, `desc`
2. ShipyardScreen iterates `SHIPS` automatically -- no screen changes needed
3. Ensure the `slots` object only lists counts for valid slot types

### Add an equipment item

1. Add entry to `EQUIPMENT` in `data.js` with `name`, `desc`, `cost`, `installFee`, `slot`, `effects`, `removable`, and optionally `requiredFame`, `requiredHull`
2. If the item introduces a **new effect key** (not `hullBonus`, `cannonBonus`, `speedBonus`, `holdPct`): update `L.getShipStats()` in `logic.js` to apply it
3. ShipyardScreen Equipment tab reads `EQUIPMENT` automatically

### Add a random event

1. Add entry to `RANDOM_EVENTS[]` in `data.js` following the `{ id, type, title, desc, choices[] }` pattern
2. Each choice needs an `outcome` object with the effects to apply
3. If the outcome includes a new field not handled by `RESOLVE_EVENT`: update `engine_combat.js`
4. Optional: add a `condition: (state) => boolean` to restrict when the event can fire

### Add a mission type

1. Add generator function in `generators.js` (follow `generateCombatMission` pattern)
2. Add to the type-selection weights in `G.generateMissions()`
3. Add completion logic in `engine_port.js` -> `COMPLETE_MISSION` case
4. Add gold/rep tables to `data.js` if the type has unique reward scaling

### Tuning the economy

All balance numbers are in `data.js`:

- Ship costs -> `SHIPS[key].cost`
- Mission rewards -> `MISSION_GOLD_RANGES`
- Trade profits -> `TRADE_MISSION_PROFIT_MARGINS`
- Smuggle profits -> `SMUGGLE_PROFIT_MARGINS`
- Resource prices -> `RESOURCES[key].basePrice`
- Plunder value -> `PLUNDER_TARGET`, `PLUNDER_GOLD_RATIO`

Use `tests/sim.html` to run Monte Carlo simulations after changing values.

### Add a screen

1. Create the component in the appropriate screen file (port-related -> `screens_port.jsx`, voyage-related -> `screens_voyage.jsx`, etc.)
2. Add to `window.S` in the `Object.assign` at the bottom of that file
3. Add `case "screenname":` to the router in `App.jsx` -> `renderScreen()`
4. If the screen needs a new action: add to `window.E.A` and the relevant domain reducer

### Add an action

1. Add the action name to `window.E.A` in `engine_core.js`
2. Add the `case A.YOUR_ACTION:` to the appropriate domain reducer (`engine_port.js`, `engine_voyage.js`, or `engine_combat.js`)
3. Return a new state object (spread-copy, never mutate)

---

## 10. Testing Infrastructure

### Test runner

`tests/tests.html` -- browser-native test harness that loads all game source files via `<script>` tags and runs assertions. No npm or build tools required. Tests are split across:

| File | Contents |
|---|---|
| `tests_helpers.js` | Shared helpers (state factories, assertion utilities) |
| `tests_logic.js` | Unit tests for `logic.js` and `generators.js` |
| `tests_engine.js` | Reducer tests for all engine files |
| `tests_flows.js` | Integration and scenario tests (full game loops) |
| `tests_ui.js` | UI smoke tests and edge case tests |

### Simulation tools

| Tool | File | Purpose |
|---|---|---|
| Economy simulator | `tests/sim.html` | Monte Carlo economy simulations -- 6 strategy profiles, fame-indexed charts |
| Balance dashboard | `tests/tests_balance.html` | Reachability, economy, combat, patrol, trade, events, gossip balance checks |
| Crew lifecycle sim | `tests/crew_sim.html` | 6 playstyles, per-member tracking, survival curves |
| Bio/log analyser | `tests/crew_bio_log_sim.html` | Bio uniqueness scoring, log pattern detection |
| Equipment combos | `tests/equipment_combo_analyzer.html` | Equipment combination analysis and stat delta preview |
| Screenshot gen | `screenshots/index.html` | 5 scenes x 3 sizes + itch.io assets, html2canvas export |

All tools load real game files via `<script>` tags -- they use the live `window.D`, `window.L`, `window.G` namespaces directly.

---

## 11. Constraints for AI Agents

### Before editing any file

1. Read the **dependency graph** in S4. Never import downward.
2. Check which `window.*` namespace the file belongs to.
3. Search for every reference to the function/constant you're changing -- use `window.L.`, `window.E.A.`, etc.
4. If adding a new export, add it to the `return` block (for IIFEs) or `Object.assign` (for screen files).

### Things that cause a blank screen with no error message

- Syntax error in any `.js` file (breaks the `<script>` load chain)
- Missing comma in `data.js` or `data_text.js` object literals
- Referencing `window.L` before `logic.js` has loaded
- Babel parse error in `.jsx` files (unclosed tags, mismatched braces)

### Things that break silently (no crash, wrong behaviour)

- Mutating `state` instead of spreading: `state.gold -= 100` <-- WRONG
- Forgetting to add a new action to `window.E.A` (dispatch does nothing)
- Adding an equipment key to `EQUIPMENT` that references a non-existent slot type
- Referencing `state.crew.current` (doesn't exist) instead of `state.crew.roster.length`
- Referencing `state.hold.capacity` directly instead of `L.getHoldCapacity(state)`
- Referencing `state.ship.upgrades` (removed) instead of `state.ship.equipment`

### Always do

- Spread-copy: `return { ...state, gold: state.gold + 100 }`
- Nested spread: `ship: { ...state.ship, hull: newHull }`
- Add log entries: `log: [...state.log, "message"]`
- Gate purchases: check `gold >= cost` AND `fame >= requiredFame` AND ship supports slot
- Test in debug mode (`?debug=1`) after changes
- Run `tests/sim.html` after any balance change
- Run `tests/tests.html` after any logic/engine change

### File size limit

Keep each file under 1500 lines. If a file approaches this limit, split by domain (as was done with `engine.js` -> 4 files, and screens -> 5 files).
