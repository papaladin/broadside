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
| Game loop structure | *Sid Meier's Pirates!*, *Galaxy on Fire 2HD*, *Caravaneer* | Similar feel, but with the resource pressure and logistics of Caravaneer |
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

One system sits outside this table deliberately: **Onboarding** (the guided quartermaster tutorial) is scaffolding, not a permanent gameplay system — it has its own state ('state.onboarding') and it does reach into other systems (gating which Port actions are visible, suppressing random events and patrols during the first voyage, force-stocking the market for the opening delivery), but every one of those effects is temporary and switches off once onboarding completes or the player skips it. It earns a place in this document because of how it's wired in — see the engine middleware pattern below — not because it's a pillar-bearing system in the way Combat or Reputation are."

Gossip, captain's log entries, crew biographies, the Captain's Journal, the quartermaster's onboarding dialogue, and the Market screen's flavour text are not treated as core gameplay systems by themselves. They are part of the **Narrative Presentation Layer**.
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
| **Logic** | `logic_core.js`, `logic_economy_crew.js`, `logic_travel_events.js`, `logic_combat_encounter.js` | `window.D` | Engine, UI, Generators (except `generateCombatFlavour`? Actually logic doesn't call generators) |
| **Storage** | `storage.js` | `window.D`, `window.L` | Engine, UI |
| **Generators** | `generators.js` | `window.D`, `window.L` | Engine, UI |
| **Engine** | `engine_core.js`, `engine_port.js`, `engine_voyage.js`, `engine_battle.js`, `engine_encounter.js`, `engine_onboarding.js`, `engine_career.js`, `engine_scripted.js` | `window.D`, `window.L`, `window.G` | UI |
| **UI** | `ui.jsx`, `icons.jsx` | `window.D`, `window.L` | Engine, Generators |
| **Screens** | `screens_*.jsx` | `window.D`, `window.L`, `window.E`, `window.UI` | Generators (directly) |
| **App** | `App.jsx` | Everything via dispatch | — |

### Pure functions in logic.js

`logic_*.js` files contain **zero side-effects**. Every function is `(input) → output` with no mutation, no DOM access, no randomness. All RNG lives in `generators.js` — but logic functions accept an **injectable RNG** parameter (defaulting to `window.L.RNG`) so they remain testable and deterministic.

### Storage as a logic extension

`storage.js` extends `window.L` with localStorage-related helpers (save/load encoding, tutorial state management, persistence functions). It loads immediately after the logic files and attaches functions to the same `window.L` namespace. No RNG — just I/O wrappers.

### Immutable state

The reducer always returns a **new** state object. No mutation of the previous state. Spread-copy every nested object that changes.

### Single source of truth

- All game constants → `data.js` + `data_text.js`
- All derived calculations → `logic_*.js`
- All save/load and tutorial state → `storage.js`
- All random generation → `generators.js` (but logic functions may accept injected RNG for testability)
- All state transitions → `engine_*.js` reducers
- All visual tokens → `ui.jsx` theme object `T`

### Files that change together live together

Port-related screens, port engine actions, and port-related generators are organized by domain, not by technical layer. The engine is split into domain files (`engine_port.js`, `engine_voyage.js`, `engine_battle.js`, `engine_encounter.js`) that each register their own reducer into the core chain. Screens are split by domain: port, voyage, market, crew, shipyard.

---

## 2. Tech Stack and Constraints

### Stack

| Tool | Role |
|---|---|
| React 18 (CDN) | UI rendering |
| Babel Standalone (CDN) | JSX → JS in-browser (! use Babel 7.29, currently incompatible with Babel 8 and above) |
| Vanilla JS (ES2020) | All game logic, engine, data |
| localStorage | Save/load (via `storage.js`) |
| No build step | Files loaded via `<script>` tags in `index.html` |

### Hard constraints

- No npm, no bundler, no TypeScript, no build step.
- Each `.js` / `.jsx` file is a single IIFE or global assignment.
- Scripts are loaded in strict dependency order via `<script>` tags.
- All inter-file communication is via `window.*` namespaces.
- Target: modern desktop and mobile browsers.

### Save keys

```
localStorage key: "BroadsideGameSave"
Format: JSON.stringify(state)
Migration: migrateState() in engine_core.js adds missing fields on load

Tutorial state key: "broadside_tutorial"
Format: JSON.stringify({ seenScreens: [...] })
Managed by: storage.js (shouldShowTutorial, markTutorialSeen)
```

---

## 3. File Structure

### Current structure

```text
broadside/
├── index.html                         ← entry point, <script> load order
├── data.js                            ← window.D — game constants
├── data_text.js                       ← extends window.D — text/content constants
├── logic_core.js                      ← window.L — core pure helpers
├── logic_economy_crew.js              ← window.L — crew, economy, cargo, reputation
├── logic_travel_events.js             ← window.L — travel, sea position, events, patrols
├── logic_combat_encounter.js          ← window.L — combat resolvers + encounter helpers + NPC AI + action preview
├── storage.js                         ← extends window.L — save/load + tutorial state + persistence
├── generators.js                      ← window.G — RNG: missions, markets, crew, enemies, gossip, bios, combat flavour
│
├── engine_core.js                     ← window.E — reducer chain, initial state, actions, migration
├── engine_port.js                     ←           port domain reducer
├── engine_voyage.js                   ←           voyage domain reducer
├── engine_battle.js                   ←           battle domain reducer (BATTLE_ACTION, DISMISS_BATTLE, TAKE_PLUNDER)
├── engine_encounter.js                ←           encounter domain reducer (intercepts, random events, merchant encounters)
├── engine_onboarding.js               ←           onboarding middleware reducer
├── engine_career.js                   ←           career-stats middleware reducer
├── engine_scripted.js                 ←           dev-only scripted-playthrough reducer (?scripted=1)
│
├── ui.jsx                             ← window.UI — theme tokens + presentational components
├── icons.jsx                          ← extends window.UI — SVG icon library + LOG_ICONS
├── screens_core.jsx                   ← window.S — TitleScreen, NewGameScreen, onboarding UI
├── screens_port.jsx                   ← window.S — PortScreen
├── screens_status.jsx                 ← window.S — StatusScreen, JournalScreen
├── screens_shipyard.jsx               ← window.S — ShipyardScreen
├── screens_crew.jsx                   ← window.S — CrewScreen
├── screens_market.jsx                 ← window.S — MarketScreen
├── screens_voyage.jsx                 ← window.S — MapScreen, SailingScreen
├── screens_combat.jsx                 ← window.S — EventScreen, InterceptScreen, BattleScreen, PlunderScreen
├── screens_menu.jsx                   ← window.S — MenuModal, FeedbackPanel
├── App.jsx                            ← root: HUD, screen router, ErrorBoundary, DebugPanel
│
├── docs/                              (see documentation section)
├── tests/                             (see testing section)
└── tools/                             (see tools section)
```

---

## 4. Dependency Graph

### Current

```text
data.js (D)
└─→ data_text.js (extends D)
    └─→ logic_core.js (L)
        ├─→ logic_economy_crew.js
        ├─→ logic_travel_events.js
        └─→ logic_combat_encounter.js
            ├─→ storage.js (extends L)
            └─→ generators.js (G)
                └─→ engine_core.js (E)
                    ├─→ engine_port.js
                    ├─→ engine_voyage.js
                    ├─→ engine_battle.js
                    ├─→ engine_encounter.js
                    ├─→ engine_onboarding.js   (middleware — runs after the domain reducers)
                    ├─→ engine_career.js       (middleware — runs after onboarding)
                    └─→ engine_scripted.js     (dev-only — runs last, inert without ?scripted=1)
                        └─→ ui.jsx (UI)
                            └─→ icons.jsx (extends UI)
                                ├─→ screens_core.jsx (S)
                                ├─→ screens_port.jsx (S)
                                ├─→ screens_status.jsx (S)
                                ├─→ screens_shipyard.jsx (S)
                                ├─→ screens_crew.jsx (S)
                                ├─→ screens_market.jsx (S)
                                ├─→ screens_voyage.jsx (S)
                                ├─→ screens_combat.jsx (S)
                                ├─→ screens_menu.jsx (S)
                                └─→ App.jsx
```

### Dependency direction rule — never violated

Arrows point **downward only**. A file may import from files above it in the graph but never below. `data.js` imports nothing. `App.jsx` can read anything.

The `index.html` `<script>` load order matches this graph top-to-bottom.

---

## 5. File Responsibilities (rewrite)

### data.js → `window.D`

Pure constants. No functions except a few inline `(state) => boolean` condition callbacks on `RANDOM_EVENTS`. Contains: `FACTIONS`, `PORTS`, `SHIPS`, `SHIP_VISUALS`, `EQUIPMENT`, `RESOURCES`, `GOODS_AVAILABILITY`, `MISSION_GOLD_RANGES`, `MISSION_ENEMY_RANGES`, `PLUNDER_TARGET`, `PLUNDER_GOLD_RATIO`, `FACTION_PLUNDER_GOODS`, `MISSION_REP_IMPACTS`, `TRADE_MISSION_PROFIT_MARGINS`, `SMUGGLE_PROFIT_MARGINS`, `PATROL_FINE_RATE`, `RANDOM_EVENTS`, `STARTS`, `TUTORIAL_DELIVERY`, `TUTORIAL_HUNT`, `DEFAULT_CAREER`, `SURRENDER_CONSEQUENCE`, `DISTANCE_DAMAGE_MULTIPLIERS`, `LEGAL_ACTIONS_BY_DISTANCE`, `AI_ARCHETYPES`, `AI_ORIGIN_MODIFIERS`.

**`SHIP_VISUALS`** is pure data — `ship-sprite.js` is the only file that interprets it.

**`STARTS`** is now a faction-keyed object: `factionPorts` (faction → starting port), `factionRepAdjust` (faction → rep deltas), `factionBackstory` (faction → opening narrative + log lines), `factionQM` (faction → quartermaster name/bio), plus shared `gold`, `ship`, `hold`, `startDate` values.

**`DEFAULT_CAREER`** is the zeroed shape for `state.career`.

### data_text.js → extends `window.D`

Text-only constants. Contains: `CREW_FIRST_NAMES`, `CREW_LAST_NAMES`, `CREW_ROLES`, `BIO_OPENINGS`, `PORT_GOSSIP_TEMPLATES`, `MARKET_FLAVOUR`, `MISSION_NAME_PARTS`, `COMBAT_LOG_TEMPLATES`, `ENEMY_SHIP_NAMES`, `ENCOUNTER_FLAVOUR`, `QM_DIALOGUE`, `ARRIVAL_MESSAGES`, `SAILING_MESSAGES`, `VICTORY_MESSAGES`, `DEFEAT_MESSAGES`, `FLED_MESSAGES`, `BOARDING_SUCCESS_MESSAGES`, `REPAIR_MESSAGES`, `PURCHASE_MESSAGES`, `PLUNDER_MESSAGES`, `FACTION_RELATIONSHIP_TEMPLATES`.

`QM_DIALOGUE` keys are now `step0_welcome`, `step1_accepted`, `step1_contractAccepted`, `step2_marketOpen`, `step2_stocked`, `step3_mapOpen`, `step4_sailing`, `step5_arrival`, `step5_delivered`, `step6_crewOpen`, `step6_hired`, `step6b_huntAccepted`, `step6b_victory`, `step7_shipyardOpen`, `step7_repaired`, `step8_journalOpen`, `step9_departure`, `tutorialAbandonRefuse`.

### ship-sprite.js → `window.ShipSprite`

Pure SVG silhouette renderer. Reads `window.D.SHIP_VISUALS` and `window.D.FACTIONS`. Exposes `window.ShipSprite.render(shipType, { faction, equipment, width, height, facing, showFlag }) → SVGElement`.

### logic_core.js / logic_economy_crew.js / logic_travel_events.js / logic_combat_encounter.js → `window.L`

Pure functions, zero side-effects. Functions accept an optional `rng` parameter (default `window.L.RNG`) for determinism. New functions added:
- `L.applyCrewLoss(state, crewLoss, rng)` — removes crew and returns `{ state, lostNames, lostCount }`.
- `L.getPatrolContrabandInfo(state, fineRate)` — centralizes contraband detection and fine calculation.
- `L.getActionPreview(state, action, distance, enemy, battle)` — returns combat action preview for UI.
- NPC AI scoring functions: `computeAIDisposition`, `getHullAdvantage`, `getCrewAdvantage`, `getSpeedDifferential`, `scoreNavalActions`, `scoreBoardingActions`, `selectWeightedAction`.
- `L.RNG` — default RNG object with `random()`, `int()`, `pick()`.

### storage.js → extends `window.L`

Owns all browser persistence. Functions: `simpleHash`, `checkLocalStorageAvailable`, `hasSave`, `encodeSave`, `decodeSave`, `loadTutorialState`, `saveTutorialState`, `getDefaultTutorialState`, `shouldShowTutorial`, `markTutorialSeen`, `saveToLocalStorage`, `loadFromLocalStorage`, `clearLocalStorage`, `getSeenDiscoveries`, `setSeenDiscovery`.

### generators.js → `window.G`

All RNG-dependent generation. New: `generateCombatFlavour`. Now only called by the engine (never by UI).

### engine_core.js → `window.E`

Shared infrastructure: `window.E.A` (action constants), `window.E.initialState`, the reducer dispatcher, `window.E.autoSave`, `window.E.migrateState`, `window.E.buildEncounterSession`, `window.E.logEntry`. No longer contains `createBattleState`. Persistence actions call `storage.js` functions.

### engine_port.js

Port domain reducer: `START_GAME`, `NAVIGATE`, `SAIL_TO`, `ENTER_PORT`, `REPAIR`, `BUY_SHIP`, `BUY_EQUIPMENT`, `INSTALL_EQUIPMENT`, `REMOVE_EQUIPMENT`, `HIRE_CREW`, `DISMISS_CREW`, `RAISE_MORALE`, `REFRESH_MISSIONS`, `TAKE_MISSION`, `COMPLETE_MISSION`, `ABANDON_MISSION`, `CONFIRM_TRADE`, `PREVIEW_PORT`.

### engine_voyage.js

Voyage domain reducer: `ADVANCE_DAY`, `DISCOVER_PORT`. Includes `maybeDrunkardEvent`, `maybeSmugglePatrol`, `maybeMissionEncounter`, `maybeRandomEvent`, `checkRandomPatrol`, `advanceHiddenPorts`.

### engine_battle.js

Battle domain reducer: `BATTLE_ACTION`, `DISMISS_BATTLE`, `TAKE_PLUNDER`. No longer exports `applyCrewLossToState` or `washAshore`; uses `L.applyCrewLoss` and `window.E.washAshore` (from encounter).

### engine_encounter.js

Encounter domain reducer: `INTERCEPT_FIGHT`, `INTERCEPT_FLEE`, `INTERCEPT_PARLEY`, `INTERCEPT_BRIBE`, `INTERCEPT_SURRENDER`, `PATROL_INSPECT`, `RESOLVE_INSPECTION`, `RESOLVE_EVENT`, `ATTACK_PIRATE`, `ATTACK_MERCHANT`, `RESOLVE_DRIFTING_WRECK_SEARCH`. Owns `washAshore` and `applyNavyPatrolSurrender`.

### engine_onboarding.js (middleware)

Watches actions via `STEP_RULES`. Owns lifecycle actions: `ONBOARDING_QM_SEEN`, `ONBOARDING_SKIP`, `ONBOARDING_COMPLETE`.

### engine_career.js (middleware)

Tracks `state.career` via delta-based detection.

### engine_scripted.js (dev-only)

Inert unless `?scripted=1`.

### ui.jsx → `window.UI`

Theme tokens (`T`) and presentational primitives. Includes `PortCard`, `PortModal` (which dispatches `PREVIEW_PORT`), `ShipSideSprite`, `Tooltip`, etc. No generator calls.

### icons.jsx → extends `window.UI`

SVG icon library + `LOG_ICONS`.

### screens_*.jsx → `window.S`

All screen components. No generator calls.

---

## 6. Global Namespace Convention

| Namespace | Source | Contents |
|---|---|---|
| `window.D` | `data.js` + `data_text.js` | All constants. |
| `window.ShipSprite` | `ship-sprite.js` | Single function `render(shipType, options) → SVGElement`. |
| `window.L` | `logic_core.js` + `logic_economy_crew.js` + `logic_travel_events.js` + `logic_combat_encounter.js` + `storage.js` | All pure functions + save/load encoding + tutorial state helpers + persistence. |
| `window.G` | `generators.js` | All RNG-dependent generators. |
| `window.E` | `engine_core.js` + 7 other engine files | Reducer chain (`window.E._reducers`), action constants (`window.E.A`), initial state, shared helpers. |
| `window.UI` | `ui.jsx` + `icons.jsx` | Theme tokens, all presentational components, the full icon library, and the `LOG_ICONS` category map. |
| `window.S` | `screens_*.jsx` (9 files) | All screen components. |

---

## 7. State Shape Reference

The full state shape is defined in `engine_core.js` -> `window.E.initialState`. See [specs_engine.md](specs_engine) for the complete shape with types and defaults.

Key top-level fields:

```js
{
  version: 2,                     // CURRENT_STATE_VERSION
  screen: "title",
  day: 1,
  startDate: { day: 1, month: 6, year: 1695 },
  log: [],
  gold: 0,
  fame: 0,
  infamy: 0,
  factionAlerts: { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 },
  currentPort: "portRoyal",
  route: null,
  captainName: "",
  faction: null,
  tutorialMode: "full",
  onboarding: { /* see below */ },
  autoSave: true,
  scenarioId: null,               // vestigial
  previousPort: null,
  previewPortMarket: null,        // NEW — generated by PREVIEW_PORT
  destination: null,
  discoveredPorts: [...],
  mapFragments: [],
  equipmentInventory: [],
  sailingDaysLeft: 0,
  sailingDaysTotal: 0,
  wind: { angle: 45, speed: 10 },
  ship: { type, name, hull, cannons, equipment },
  crew: { roster: [], max, morale },
  hold: { items: { ... } },
  portMarket: null,
  portGossip: [],
  missions: [],
  activeMission: null,
  reputation: {},
  encounterSession: null,         // { type, phase, source, intercept, battle, ... }
  notableNPCs: {},
  activeEvent: null,
  gameOverReason: null,
  career: { /* deep-cloned from D.DEFAULT_CAREER */ },
}
```

Onboarding shape:

```js
onboarding: {
  enabled: false,
  completed: true,
  currentStep: 0,
  stepsCompleted: { /* ~15 boolean flags */ },
  qmMessagesSeen: {},
  combatHintShown: false,
  qmDismissed: false,
}
```

Career shape:

```js
career: {
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

## 8. Game Mechanics Implementation

This section describes how game mechanics are implemented. For detailed numbers, see the referenced spec files.

---

### Equipment installation rules

Ships have a `slots` object defining how many items of each slot type they support (e.g. `{ hull: 1, armament: 1, rigging: 1, special: 0 }`). Player equipment is stored in `state.ship.equipment: { hull: [], armament: [], rigging: [], special: [] }`.

```js
// Check if equipment can be installed:
L.canInstallEquipment(state, equipKey) // checks slot availability, requiredFame, requiredHull

// Effective stats with equipment applied:
L.getShipStats(state) // { maxHull, cannons, speed, holdCapacity, maxDays, maxCrew, ... } with equipment applied
```

**Equipment effect keys**: stat-named keys (e.g. `cannons`, `speed`, `maxDays`, `maxCrew`) are additive; `hullPct` and `holdPct` are multiplicative. Non-stat keys (e.g. `repairCostPct`, `crewLossMult`, `calmImmune`) are read individually via `L.getEquipmentEffect(state, key)`.

When buying a new ship, all installed equipment is **lost** (reset to empty arrays). Removable equipment (`removable: true`) can be uninstalled to the **locker** (`state.equipmentInventory`) before selling the ship; non-removable equipment is simply destroyed.

### Travel and range

```js
L.travelDays(fromPort, toPort, state) // number of days
L.canReach(state, portKey) // boolean
L.getUnreachableReason(state, portKey) // string | null
```

Travel days are based on Euclidean distance between port coordinates, modified by ship speed, equipment bonuses, morale modifier, hold load, and wind. Some ports have a `minHull` requirement (remote ports need brigantine+ sized vessels). Hidden ports (`port.hidden = true`) are not shown on the map until `state.discoveredPorts` includes their key; discovery is gated by `port.unlockCondition` and evaluated by the `advanceHiddenPorts` helper in `engine_voyage.js` each day.

A second family of helpers exists for **mid-voyage rerouting from sea position** rather than from a port: `L.getSeaPosition(route)`, `L.travelDaysFromPosition(seaPos, portKey, state)`, `L.canReachFromPosition(seaPos, portKey, state, remainingEndurance)`, `L.getReachablePortsFromSea(state)`. These back the "Change Course" button on the Sailing screen — dispatching `SAIL_TO` while a `route` is active and `sailingDaysLeft > 0` recalculates the trip from the ship's current interpolated `seaPosition`, not from the original origin port, while `route.enduranceSpent` keeps accumulating against the ship's `maxDays` budget so a reroute can't extend total range beyond what the ship could actually sail.

### Wind and sailing

Wind is randomised at game start and drifts each day: `{ angle: 0-360, speed: 5-25 }`. Wind affects travel time inside `L.travelDays()`: favourable wind (-1 day), opposing wind (+1 day), based on the angle difference between wind direction and bearing to the destination.

### Encounter routing — all encounters through InterceptScreen

Every hostile encounter now uses the unified `encounterSession` model. When an encounter is triggered:

1. `engine_port.js` or `engine_voyage.js` calls `L.buildEncounterContext()` to create a context object (with explicit `source`).
2. The caller then passes this context to `window.E.buildEncounterSession(state, context)` to create the `encounterSession`.
3. The session is stored on `state.encounterSession` with `phase: "intercept"`.
4. `InterceptScreen` renders `encounterSession.intercept.flavourText` and `encounterSession.intercept.flavourLines` (generated during session creation).

When the player chooses an action (Fight, Flee, Parley, Bribe, Surrender, Inspect):
- The action handler transitions the session phase:
  - `INTERCEPT_FIGHT`, `INTERCEPT_FLEE` (failure), `INTERCEPT_PARLEY` (failure) → `phase: "battle"` and populate `battle`
  - `INTERCEPT_FLEE` (success), `INTERCEPT_PARLEY` (success), `INTERCEPT_BRIBE`, `INTERCEPT_SURRENDER`, `PATROL_INSPECT` → `encounterSession: null`
- `BattleScreen` reads from `encounterSession.battle`
- `DISMISS_BATTLE` clears `encounterSession` (or transitions to `"plunder"` if applicable)
- `TAKE_PLUNDER` clears `encounterSession` after the player confirms

**Note:** `PATROL_INSPECT` may transition to `phase: "inspection_pending"` if contraband is found. The player then chooses `handOver` or `resist` via `RESOLVE_INSPECTION`.

### Random patrol generation

```
L.maybeRandomPatrol(state)
Base chance: ~1% per sailing day
+ infamy / 400  (i.e. +0.25% per infamy point)
+ heat bonus: highest relevant faction alert * 0.03, itself dampened by reputation
  (Allied rep ≥70 → ×0.5, Friendly rep ≥50 → ×0.75, else ×1.0)
Capped at 40%: min(baseChance + infamyBonus + heatBonus, 0.40)
```

When a random patrol does trigger (`checkRandomPatrol` in `engine_voyage.js`), the **enemy's risk tier scales with the current port's faction heat**, not just the player's fame: heat ≥7 → `"high"` risk enemy, heat ≥3 → `"medium"`, otherwise `"low"`.

### Reputation thresholds

Port reputation (0–100) determines service access, mission reward multipliers, and repair discounts.

| Tier | Range | Label | Repair Discount | Mission Gold | Services |
|---|---|---|---|---|---|
| 0 | 0–9 | At War | -- | Blocked | Blocked |
| 1 | 10–29 | Hostile | -- | -25% | No missions |
| 2 | 30–49 | Neutral | -- | Standard | All |
| 3 | 50–79 | Friendly | -10% | +10% | All |
| 4 | 80–100 | Allied | -20% | +20% | All |

Reputation above 50 decays -1/day toward 50.

### Fame system

Fame is a permanent progression score (never decreases). It gates ship purchases, equipment availability, mission tiers, and hidden-port discovery.

| Tier | Range | Label |
|---|---|---|
| 0 | 0–49 | Unknown |
| 1 | 50–99 | Recognised |
| 2 | 100–199 | Notorious |
| 3 | 200–349 | Legendary |
| 4 | 350+ | Immortal |

### Morale system

Crew morale (0–100) affects combat effectiveness, wage cost (×1.5 below 30), and can trigger desertion/mutiny events.

### Economy system

Each port visit generates prices via `RESOURCES[good].basePrice * (1 ± variance)`, with availability tiers (`always`/`frequently`/`sometimes`/`rarely`/`never`) mapped per-port in `GOODS_AVAILABILITY`. Hold capacity is always `L.getHoldCapacity(state)` — never a stored field. The **Market screen's atmosphere text** is generated separately from port gossip, by `G.generateMarketFlavour(state, portKey)` reading `D.MARKET_FLAVOUR`.

### Parametric mission generation

Missions are generated procedurally by `G.generateMissions()`. Six types: **escort, patrol, combat, trade, smuggle, assault**. Type selection is weighted by the issuing port's faction (pirate ports never offer patrol or trade missions). Risk level is tier-weighted toward higher risk as fame increases. Gold, fame, and enemy stats scale with the player's fame tier (0–4).

**Trade missions** now select a target port where the required good is **in demand** (using `L.getPortTradeProfile`). This guarantees the trade itself is profitable, making the mission reward a pure bonus.

**Smuggle missions** now select a target port where the illegal good is **scarce** (availability tier `"rarely"` or `"never"` in `GOODS_AVAILABILITY`). The enemy faction is set to match the target port's faction.

### Named crew roster

Crew members are generated with `G.generateCrewMember(faction)` → `{ id, firstName, lastName, role, faction, daysAboard, tags }`. Roles are weighted-random but cosmetic. Crew accumulate tags over time: hidden traits (`hidden_drunkard`, `hidden_coward`, `hidden_greedy`, `hidden_troublemaker`) revealed through gameplay, scars (`scar_battle`, `scar_storm`, `scar_shipwreck`), positive progression (`seasoned` at 50d, `veteran` at 100d, `loyal` at 200d + high faction rep), and alignment tags (`upset`, `mutineer`). Generated biographies (`G.generateCrewBio`) combine opening templates with combo sentences and suppression logic to avoid redundant scar/trait lines.

### Combat resolution flow

Turn-based, resolved in `engine_battle.js` via `BATTLE_ACTION`.

The combat system now uses **distance bands (Far/Medium/Close)** and a **boarding phase**:

1. **Naval Battle**:
   - Actions: Broadside, Precision, Close Distance, Open Distance, Evade, Grapple.
   - Resolution order: Evade → Damage → Hull/Crew check → Reposition → Grapple.
   - Distance changes based on Close/Open actions (contested via speed when opposing).
   - Damage multipliers vary by distance (Broadside: 0.6× at Far, 1.0× at Medium, 0.9× at Close; Precision: 1.1× at Far, 1.0× at Medium, 0.7× at Close).
   - Grapple requires Close distance; if successful, the battle transitions to Boarding sub‑phase.

2. **Boarding Phase**:
   - Actions: Continue Fighting, Fall Back, Demand Surrender, Surrender.
   - Effective strength: `crew × (0.5 + morale/200)`, enemy morale derived from risk tier.
   - Continue Fighting: both sides take losses proportional to their advantage ratio.
   - Fall Back: returns to Naval battle at Close distance with a cost to the retreater.
   - Demand Surrender: success chance based on advantage ratio; automatic if the opponent tries to Fall Back.
   - Surrender: ends the battle immediately.

3. **Victory/Defeat**:
   - **Sunk** (hull reaches 0): no plunder, immediate victory screen with "Sail Away" only.
   - **Captured/Wiped** (crew reaches 0 while hull remains): plunder available, victory screen with "Plunder" and "Sail Away" buttons.
   - **Player defeat**: wash ashore, lose cargo, mission may fail.

NPC action selection uses utility scoring (`L.getNPCNavalAction`, `L.getNPCBoardingAction`) based on faction archetypes, hull/crew/speed advantages, and distance.

### Save / load behaviour

- **Auto-save**: triggers on `ENTER_PORT` and a few other state-settling actions via `window.E.autoSave`, which calls `L.saveToLocalStorage`.
- **Manual save/load**: `SAVE_GAME`/`LOAD_GAME` in `engine_core.js` → `L.saveToLocalStorage` / `L.loadFromLocalStorage` + `migrateState()`.
- **File export/import**: `EXPORT_SAVE` → `L.encodeSave(state)` (base64 + hash) → downloads as a `.broadside` file; `IMPORT_SAVE` → `L.decodeSave(json)` → `migrateState` → dispatch, flagging tampering if the embedded hash doesn't match.
- **Error recovery**: `ErrorBoundary` in `App.jsx` offers "Try Load Last Save."
- `L.checkLocalStorageAvailable()` detects iframe/Safari storage blocks and the Title/Port screens surface a warning + push the player toward Export/Import instead.

### Onboarding system (guided quartermaster tutorial)

When a player picks **Guided** on the New Game screen, `tutorialMode` is set to `"full"`, `START_GAME` injects a faction-specific quartermaster into the crew roster (tagged `quartermaster, protected`) and auto-accepts the faction's `D.TUTORIAL_DELIVERY` mission.

From there, progress is **inferred, not driven**: `engine_onboarding.js` registers as middleware and watches ordinary actions against a `STEP_RULES` lookup table. There is no "next step" button; the player simply plays, and the relevant flags set themselves as a side effect of normal actions.

Two other systems consume these flags:
- **`L.isFeatureUnlocked(state, feature)`** gates which Port-screen action buttons are visible while onboarding is active.
- **`OnboardingPopup`** walks a separate ordered list of QM dialogue conditions, picks the first one whose precondition is met, and renders that line via `QMPopup`.

A player can bail out early via the "I'll take it from here" link, which dispatches `ONBOARDING_SKIP`.

Two content-injection points are tied to onboarding state: the **tutorial hunt** (`D.TUTORIAL_HUNT`) is spliced onto the mission board once the player has hired their first crew member; and `G.generatePortMarket` force-stocks whatever good the active tutorial delivery mission requires.

While `onboarding.enabled && !onboarding.completed`, `engine_voyage.js` also suppresses the normal random-event/patrol/drunkard checks during `ADVANCE_DAY`.

### Career stats tracking (middleware pattern)

`engine_career.js` is the second middleware reducer, registered after `engine_onboarding.js`. It maintains `state.career` purely as derived bookkeeping — nothing in the game reads `career` to make a gameplay decision, so a bug here can never affect actual play, only the Status screen's narrative.

The pattern it demonstrates is worth calling out: rather than adding `nextCareer.x++` lines scattered across domain reducers, the middleware instead does a single `switch (action.type)` over the *already-resolved* state, comparing `action.__prevState` (the state before any domain reducer ran) against `state` (the state after every domain reducer has already run).

### Ship visual identity system

`window.D.SHIP_VISUALS` (one entry per ship type) and `ship-sprite.js` (`window.ShipSprite.render`) together produce the detailed side-view ship art used in the Shipyard and Battle screens — this is distinct from the small top-down `ShipSprite` SVG in `ui.jsx` used as a map marker.

---

## 9. Adding New Content — Patterns

### Add a port

1. Add entry to `PORTS` in `data.js` with `name`, `faction`, `x`, `y`, `services[]`, `desc`
2. If hidden: add `hidden: true` and `unlockCondition`
3. Add goods availability row to `GOODS_AVAILABILITY` in `data.js`
4. Add reputation entry to `initialState.reputation` in `engine_core.js`
5. MapScreen reads `PORTS` directly -- no screen changes needed

### Add a ship

1. Add entry to `SHIPS` in `data.js` with all stats
2. ShipyardScreen iterates `SHIPS` automatically -- no screen changes needed
3. Ensure the `slots` object only lists counts for valid slot types
4. Add a matching entry to `SHIP_VISUALS` in `data.js` or the ship will render as a blank/missing sprite

### Add an equipment item

1. Add entry to `EQUIPMENT` in `data.js` with `name`, `desc`, `cost`, `installFee`, `slot`, `effects`, `removable`, and optionally `requiredFame`, `requiredHull`
2. If the item introduces a **new effect key**: stat-named keys are additive; `hullPct`/`holdPct` are multiplicative; non-stat keys are read individually.

### Add a random event

1. Add entry to `RANDOM_EVENTS` in `data.js` with `id`, `type`, `title`, `desc`, `choices`, and optional `condition`.
2. Ensure `triggerRandomEvent` in `logic_travel_events.js` does not mutate the data (it creates a copy).

---

## 10. Testing Infrastructure

- **Unit tests** (`tests/tests_logic.js`): pure logic and generator functions.
- **Engine tests** (`tests/tests_engine.js`): reducer cases, immutability checks, new actions.
- **UI tests** (`tests/tests_ui.js`): namespace existence, smoke renders.
- **Integration tests** (`tests/tests_integration.html`): load order and namespace integrity.
- **Robustness tests** (`tests/tests_robustness.js`): edge cases, fuzzing, RNG determinism.
- **Simulation tools** in `tools/`: balance, career, crew, combat AI, etc.

---

## 11. Constraints for AI Agents

- Never violate the dependency direction (downward only).
- Never call `window.G` from UI or logic (engine only).
- Keep reducers immutable.
- Use injectable RNG in logic functions.
- All text constants go in `data_text.js`, not hardcoded in engine logic.
- After any code change, run the test suite (`tests/tests.html`).