
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
| **Screens** | `screens_port.jsx`, `screens_voyage.jsx`, `screens_combat.jsx`, `screens_market.jsx`, `screens_crew.jsx`, `screens_shipyard.jsx` | `window.D`, `window.L`, `window.E`, `window.UI` | Generators (directly) |
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
├── engine_onboarding.js       ←           onboarding middleware reducer (QM step tracking — see §8.x)
├── engine_career.js           ←           career-stats middleware reducer (delta tracking — see §8.x)
├── engine_scripted.js         ←           dev-only scripted-playthrough reducer, inert unless ?scripted=1 is in the URL
├── ui.jsx                  ← window.UI — theme tokens, all presentational components
├── icons.jsx                  ← extends window.UI — SVG icon component library + LOG_ICONS category map
├── screens_core.jsx           ← window.S — TitleScreen, NewGameScreen, OnboardingPopup, QMPopup
├── screens_port.jsx        ← window.S — TitleScreen, ScenarioScreen, PortScreen, StatusScreen, JournalScreen
├── screens_shipyard.jsx    ← window.S — ShipyardScreen (3 tabs: Ships, Equipment, Locker)
├── screens_crew.jsx        ← window.S — CrewScreen
├── screens_market.jsx      ← window.S — MarketScreen
├── screens_voyage.jsx      ← window.S — MapScreen, SailingScreen
├── screens_combat.jsx         ← window.S — EventScreen, InterceptScreen, BattleScreen, PlunderScreen

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

└── tools/
    └── screenshot.html              ← screenshot generator for itch.io assets
    ├── sim.html                ← economy playtest simulator (Monte Carlo)
│   ├── crew_sim.html           ← crew lifecycle simulator
│   ├── crew_bio_log_sim.html   ← bio/log redundancy analyser
│   └── equipment_combo_analyzer.html ← equipment combination analyser
```

---

## 4. Dependency Graph

### Current

```
data.js (D)
└─→ data_text.js (extends D)
    └─→ ship-sprite.js (reads D.SHIP_VISUALS, D.FACTIONS — exposes window.ShipSprite)
        └─→ logic.js (L)
            ├─→ storage.js (extends L)
            └─→ generators.js (G)
                └─→ engine_core.js (E)
                    ├─→ engine_port.js
                    ├─→ engine_voyage.js
                    ├─→ engine_combat.js
                    ├─→ engine_onboarding.js   (middleware — runs after the three domain reducers)
                    ├─→ engine_career.js       (middleware — runs after onboarding)
                    └─→ engine_scripted.js     (dev-only — runs last, inert without ?scripted=1)
                        └─→ ui.jsx (UI)
                            └─→ icons.jsx (extends UI)
                                ├─→ screens_core.jsx (S)
                                ├─→ screens_port.jsx (S)
                                ├─→ screens_shipyard.jsx (S)
                                ├─→ screens_crew.jsx (S)
                                ├─→ screens_market.jsx (S)
                                ├─→ screens_voyage.jsx (S)
                                └─→ screens_combat.jsx (S)
                                    └─→ App.jsx
```

### Dependency direction rule — never violated

Arrows point **downward only**. A file may import from files above it in the graph but never below. `data.js` imports nothing. `App.jsx` can read anything.

The `index.html` `<script>` load order matches this graph top-to-bottom:

```html
<!-- index.html load order -->
<script src="data.js"></script>
<script src="data_text.js"></script>
<script src="ship-sprite.js"></script>
<script src="logic.js"></script>
<script src="storage.js"></script>
<script src="generators.js"></script>
<script src="engine_core.js"></script>
<script src="engine_port.js"></script>
<script src="engine_voyage.js"></script>
<script src="engine_combat.js"></script>
<script src="engine_onboarding.js"></script>
<script src="engine_career.js"></script>
<script src="engine_scripted.js"></script>
<script type="text/babel" src="ui.jsx"></script>
<script type="text/babel" src="icons.jsx"></script>
<script type="text/babel" src="screens_core.jsx"></script>
<script type="text/babel" src="screens_port.jsx"></script>
<script type="text/babel" src="screens_shipyard.jsx"></script>
<script type="text/babel" src="screens_crew.jsx"></script>
<script type="text/babel" src="screens_market.jsx"></script>
<script type="text/babel" src="screens_voyage.jsx"></script>
<script type="text/babel" src="screens_combat.jsx"></script>
<script type="text/babel" src="App.jsx"></script>
```

---
## Section 5 — File Responsibilities (rewrite)

### data.js → `window.D`

Pure constants. No functions except a few inline `(state) => boolean` condition callbacks on `RANDOM_EVENTS`. Contains: `FACTIONS`, `PORTS`, `SHIPS`, `SHIP_VISUALS`, `EQUIPMENT`, `RESOURCES`, `GOODS_AVAILABILITY`, `MISSION_GOLD_RANGES`, `MISSION_ENEMY_RANGES`, `PLUNDER_TARGET`, `PLUNDER_GOLD_RATIO`, `FACTION_PLUNDER_GOODS`, `MISSION_REP_IMPACTS`, `TRADE_MISSION_PROFIT_MARGINS`, `SMUGGLE_PROFIT_MARGINS`, `TRADE_GOODS_BY_TIER`, `SMUGGLE_GOODS_BY_TIER`, `PATROL_FINE_RATE`, `RANDOM_EVENTS`, `STARTS`, `TUTORIAL_DELIVERY`, `TUTORIAL_HUNT`, `DEFAULT_CAREER`, `SURRENDER_CONSEQUENCE`.

**`SHIP_VISUALS`** is new since the last revision: one entry per ship type describing hull shape (`open`/`lowSloop`/`military`/`galleon`), hull length/height, deck flags, mast/sail rigging, and bowsprit style. It's pure data — `ship-sprite.js` is the only file that interprets it.

**`STARTS` has a different shape than before.** It is no longer an array of scenario objects (`{id, name, ship, gold, crewCount, startPort, starterMission, ...}`). It is now a single faction-keyed object: `factionPorts` (faction → starting port), `factionRepAdjust` (faction → rep deltas), `factionBackstory` (faction → opening narrative + log lines), `factionQM` (faction → quartermaster name/bio for onboarding), plus shared `gold`, `ship`, `hold`, `startDate` values common to every start. There is no per-faction starting mission baked into `STARTS` itself — that now lives separately in `TUTORIAL_DELIVERY` (faction-keyed opening delivery mission, auto-accepted only in guided onboarding) and `TUTORIAL_HUNT` (a single shared combat-mission template injected later once the player has hired crew). `specs_data.md` still documents the old scenario-array shape and needs the same correction.

`DEFAULT_CAREER` is new: the zeroed shape for `state.career` (gold earned/spent, battles won/lost/fled, ships sunk/plundered, crew hired/dismissed/lost-by-cause, ports visited, ships owned, storms survived, contraband seized, mission/combat logs).

### data_text.js → extends `window.D`

Text-only constants. Contains: `CREW_FIRST_NAMES`, `CREW_LAST_NAMES`, `CREW_ROLES`, `BIO_OPENINGS`, `PORT_GOSSIP_TEMPLATES`, `MARKET_FLAVOUR`, `MISSION_NAME_PARTS`, `COMBAT_LOG_TEMPLATES`, `ENEMY_SHIP_NAMES`, `ENCOUNTER_FLAVOUR`, `QM_DIALOGUE`.

Three of these are new: **`MARKET_FLAVOUR`** (atmosphere lines for the Market screen — gold tier, hold fullness, price extremes, fame/infamy, port-faction ambiance — generated by `G.generateMarketFlavour`, distinct from port gossip), **`COMBAT_LOG_TEMPLATES`** (per-round narrative line variants for broadside/precision/grapple/evade, player and NPC sides), and **`QM_DIALOGUE`** (the guided-onboarding quartermaster's scripted dialogue lines, one function per onboarding step, called from `OnboardingPopup`).

### ship-sprite.js → `window.ShipSprite`

New file, no equivalent in the previous architecture. Pure SVG silhouette renderer with zero game logic — reads `window.D.SHIP_VISUALS` for hull/mast/sail configuration and `window.D.FACTIONS` for flag colour, and exposes a single entry point: `window.ShipSprite.render(shipType, { faction, equipment, width, height, facing, showFlag })` → an `SVGElement`. Internally it composes hull-shape drawers (`drawHull_open/lowSloop/military/galleon`), mast/sail drawers per rig type, and a handful of equipment-driven visual flourishes (`war_pennants` → pennants on every mast, `extra_sails`/`lateen_rig` → taller rigging, `copper_plating` → hull banding, `ornate_figurehead` → a bow ornament). This is what powers the detailed side-view ship art in the Shipyard and Battle screens, as opposed to the small top-down `ShipSprite` icon in `ui.jsx` used on the map.

### logic.js → `window.L`

Pure functions, zero side-effects, zero randomness (the lone documented exception remains `roll()`, kept here to avoid a circular dependency with `buildEncounterContext`). Two functions are new since the last pass:

- **`isFeatureUnlocked(state, feature)`** — the onboarding gating check. Returns `true` unconditionally once onboarding is disabled or completed; otherwise consults `state.onboarding.stepsCompleted`/`qmMessagesSeen` to decide whether `market`, `navigation`, `crew`, `shipyard`, or `journal` should be visible yet on the Port screen.
- **`getLogTabCategory(text)`** — maps a log line to one of the Journal's filter tabs (`crew`/`combat`/`ports`/`missions`/`trade`/`other`), built on top of `classifyLogLine`'s finer-grained category.

`classifyLogLine` itself now returns a **category key string** (`"arrival"`, `"combat"`, `"crew"`, etc.), not an emoji — the emoji/icon is resolved separately via `window.UI.LOG_ICONS[category]` in `icons.jsx`. This split is what lets `LogList` strip any author-supplied leading emoji from older log strings and render a consistent SVG icon instead.

Everything else is as previously documented: ship/equipment stat math, travel/reachability (including the at-sea reroute helpers `getSeaPosition`, `travelDaysFromPosition`, `canReachFromPosition`, `getReachablePortsFromSea`), reputation, crew wages/tags/alignment, event/patrol triggers, combat resolution, encounter-context building, and hold/provision math.

### storage.js → extends `window.L`

Save/load I/O and tutorial-state helpers, unchanged in shape (`hasSave`, `encodeSave`, `decodeSave`, `checkLocalStorageAvailable`, `loadTutorialState`, `saveTutorialState`, `getDefaultTutorialState`, `shouldShowTutorial`, `markTutorialSeen`, `simpleHash`) — but **`shouldShowTutorial` now has a precondition it didn't have before**: it returns `false` immediately if `state.tutorialMode` is `"full"` (guided QM mode owns onboarding entirely) or `"none"`. The old localStorage-backed per-screen popup system now only applies in `"light"` mode. This tri-state (`full`/`light`/`none`) is chosen once on the New Game screen and stored on `state.tutorialMode`.

### generators.js → `window.G`

All RNG-dependent generation. One new export: **`generateMarketFlavour(state, portKey)`**, sibling to `generatePortGossip` but for the Market screen's atmosphere text — it draws from `D.MARKET_FLAVOUR` based on gold tier, hold fullness, extreme prices, rare-goods availability, fame/infamy, and port-faction ambiance, picking up to 3 non-duplicate-category lines. Everything else (crew/bio generation, port market, plunder cargo, mission generation, port gossip) is as previously documented.

### engine_core.js → `window.E`

Shared infrastructure: `window.E.A` (action constants — now ~50, including a block of `ONBOARDING_*` actions and an expanded `DEBUG_*` set), `window.E.initialState`, the reducer dispatcher, `window.E.autoSave`, `window.E.migrateState`, `window.E.createBattleState`, plus the debug and save/load reducers (these two stay inline in `engine_core.js` rather than living in a domain file).

**Two things changed at the dispatcher level that matter for anyone adding new reducers:**

1. The dispatcher now stamps every action with the pre-chain state before running it: `const tagged = { ...action, __prevState: state }`. Any reducer — domain or middleware — can read `action.__prevState` to see what the world looked like *before this action*, which is how the career and onboarding middleware do delta detection without owning the relevant state themselves.
2. `migrateState` grew several new defaults for old saves: it backfills `factionAlerts`, `portGossip`, crew `tags` arrays, `startDate`, `scenarioId: null`, ship `equipment` (replacing any legacy `upgrades` field), `equipmentInventory`, a fully-populated `onboarding` object pinned to "already completed" (so old saves don't suddenly get a quartermaster), `captainName`/`faction` fallbacks, a guessed `tutorialMode`, and `career` (cloned from `D.DEFAULT_CAREER` if absent).

### engine_port.js

Port domain reducer. Handles: `START_GAME`, `NAVIGATE`, `SAIL_TO`, `ENTER_PORT`, `REPAIR`, `BUY_SHIP`, `BUY_EQUIPMENT`, `INSTALL_EQUIPMENT`, `REMOVE_EQUIPMENT`, `HIRE_CREW`, `DISMISS_CREW`, `RAISE_MORALE`, `REFRESH_MISSIONS`, `TAKE_MISSION`, `COMPLETE_MISSION`, `ABANDON_MISSION`, `CONFIRM_TRADE`.

**`START_GAME`'s contract changed.** It now takes `{ captainName, faction, tutorialMode }` instead of `{ scenarioId }` — it looks up the starting port/ship/gold from the faction-keyed `STARTS` shape (see §5 data.js note above), and conditionally injects the quartermaster crew member and the `TUTORIAL_DELIVERY` mission only when `tutorialMode === "full"`.

`ENTER_PORT` and `HIRE_CREW` both gained tutorial-hunt injection logic: once the onboarding state shows the player has hired their first crew member (but hasn't yet accepted the hunt), either action will splice `D.TUTORIAL_HUNT` onto the mission board. `DISMISS_CREW` now has a guard that blocks dismissing the quartermaster while onboarding is active and incomplete (the UI is expected to redirect that into an onboarding-skip confirmation instead).

Helpers: `checkServicesBlocked`, `validateTrade`, `pickArrivalMessage` (now picks from several arrival-message templates, not a single fixed string), `processDesertion`, `processPositiveTraits`.

### engine_voyage.js

Voyage domain reducer. Handles `ADVANCE_DAY` (the core sailing loop) and `DISCOVER_PORT`.

`ADVANCE_DAY`'s pipeline gained one more day-event check beyond what was previously documented — **`maybeDrunkardEvent`**, a small chance (gated on having rum in the hold and at least one drunkard-tagged crew member) that reveals a hidden drunkard trait and consumes a unit of rum. All of the day-event checks (smuggle patrol, mission encounter, random event, random patrol, drunkard event) are explicitly skipped while guided onboarding is active and incomplete, to protect new players from random disruption during the tutorial.

Other helpers (`advanceWind`, `advanceCrew`, `advanceProvisions`, `maybeSmugglePatrol`, `maybeMissionEncounter`, `maybeRandomEvent`, `checkRandomPatrol`, `advanceHiddenPorts`) are as previously documented.

### engine_combat.js

Combat domain reducer. Handles `INTERCEPT_FIGHT`, `INTERCEPT_FLEE`, `INTERCEPT_PARLEY`, `INTERCEPT_BRIBE`, `INTERCEPT_SURRENDER`, `PATROL_INSPECT`, `BATTLE_ACTION`, `DISMISS_BATTLE`, `TAKE_PLUNDER`, `RESOLVE_EVENT`, `ATTACK_PIRATE`, `ATTACK_MERCHANT`, `RESOLVE_DRIFTING_WRECK_SEARCH`.

Two action names are corrected from the old doc: the navy-patrol inspection action is **`PATROL_INSPECT`**, not `INTERCEPT_INSPECT`. **`RESOLVE_DRIFTING_WRECK_SEARCH`** is a new action (the "Drifting Wreck" event's risky-search choice dispatches into this rather than resolving inline) with four weighted outcomes: salvaged cargo, nothing found, a rescued survivor (tagged `scar_shipwreck`), or an ambush that opens an intercept.

This file has grown a substantial helper layer to keep the action cases short: `victoryMessage`/`defeatMessage`/`fledMessage` (template pickers for battle-end log lines), `buildRoundLog` (assembles a turn's narrative from `D.COMBAT_LOG_TEMPLATES`), `applyCrewLoss`, `buildCaptainLog`, `applyAlignment` (crew-faction-alignment morale modifier on victory), and outcome-specific extractions (`handleDefeat`, `applyVictoryAftermath`, `handlePatrolVictory`, `handleFledMission`).

### engine_onboarding.js (new file)

Not a domain reducer — a **middleware reducer** that watches every action after the domain reducers have already run, using a declarative `STEP_RULES` lookup table keyed by action type. Each rule is a function of `(prevState, nextState, action)` returning which `onboarding.stepsCompleted` flags and `qmMessagesSeen` keys to mark, or `null` for no change. This file also owns the three onboarding lifecycle actions directly: `ONBOARDING_QM_SEEN`, `ONBOARDING_SKIP`, `ONBOARDING_COMPLETE` (both of the latter two remove the quartermaster from the crew roster and log a farewell line).

**Load-order constraint:** this file must load after `engine_port.js`, `engine_voyage.js`, and `engine_combat.js`, because several `STEP_RULES` entries need to inspect *post-domain-reducer* state (e.g. whether `CONFIRM_TRADE` left the hold with both the tutorial mission's required goods and provisions).

### engine_career.js (new file)

Also middleware, registered to run after onboarding. Tracks the running `state.career` totals purely as a side effect of other actions — it never changes gameplay-relevant state. Gold earned/spent is derived from the raw `state.gold - prevState.gold` delta on every action *except* the wholesale-state-replacement actions (`START_GAME`, `LOAD_GAME`, `IMPORT_SAVE`), which are explicitly excluded so a fresh game or an imported save doesn't get misread as "100,000 gold earned in one tick." Crew-loss attribution (battle vs. storm vs. desertion vs. other) is derived by diffing `prevState.crew.roster` against the post-action roster and cross-referencing which action fired. Plunder is tracked separately from the generic battle-victory case, since `TAKE_PLUNDER` and `DISMISS_BATTLE` are mutually exclusive code paths for the same underlying fight (grapple-win-and-plunder never dispatches `DISMISS_BATTLE`).

### engine_scripted.js (new file, dev-only)

Entirely inert unless the URL contains `?scripted=1`. When active, it overrides `START_GAME` to produce a fixed, hand-authored game state (named captain/ship/crew, seeded mission) and overrides `ADVANCE_DAY` to fire a small scripted sequence of events at specific days — built for recording trailers/GIFs/screenshots with deterministic, visually interesting content rather than relying on RNG. Registered last in the reducer chain so it can override the otherwise-normal domain behaviour for `START_GAME`.

### ui.jsx → `window.UI`

Theme tokens (`T`) and presentational primitives. The palette itself changed from the earlier brown/parchment scheme to a navy-and-gold pirate theme (`T.bg`, `T.bgDeep`, `T.bgAlt` are now navy blues; faction/status colours are unchanged in role). Several primitives are new since the last pass: **`PulseBtn`** (a button that glows a few times the first time it becomes visible per `pulseKey`, used to draw attention to newly-unlocked features), **`useFlashOnChange`** (a hook returning a CSS class that briefly flashes green/red when a numeric value increases/decreases — powers the HUD's gold/morale/hull flash feedback), **`Tooltip`** (hover tooltip, viewport-aware positioning), **`getGoodIcon`** (resource-key → icon component lookup, resolved lazily since `icons.jsx` loads after `ui.jsx`), **`TransferLayout`** (the two-column "left hold / right market-or-cargo" layout shared by the Market and Plunder screens), and **`PortSilhouette`** (renders a `port-{faction}.svg` background image for the current port, swallowing load errors). **`ShipSideSprite`** is also new — a thin React wrapper around `window.ShipSprite.render()` that mounts the generated SVG into a ref'd container, used wherever the detailed side-view ship art (as opposed to the small top-down `ShipSprite` icon) is needed.

### icons.jsx (new file, extends `window.UI`)

A library of ~50 hand-drawn SVG icon components (`IconAnchor`, `IconSwords`, `IconCannon`, per-resource icons like `IconRhum`/`IconSugar`/`IconSpice`, etc.), all attached directly onto `window.UI`. Also defines and exports **`window.UI.LOG_ICONS`**, a category-key → icon-component map (`arrival`, `sailing`, `crew`, `combat`, `trade`, `mission`, `discovery`, `infamy`, `warning`) consumed by `LogList` and the Journal screen to render an icon next to each log line based on `L.classifyLogLine`'s category output.

### screens_core.jsx (new file) → `window.S`

`TitleScreen`, `NewGameScreen`, `OnboardingPopup`, `QMPopup`. `NewGameScreen` replaces the old scenario-card picker entirely: it's a captain-name field (with a randomize button), a faction selector, a backstory preview drawn from `STARTS.factionBackstory`, and a three-way tutorial-style radio (Guided / Hints only / None) that sets `state.tutorialMode`. `OnboardingPopup` is the component that walks the guided-onboarding step sequence and renders `QMPopup` with the current quartermaster's dialogue line, dismiss button, and "I'll take it from here" skip link.

### screens_port.jsx → `window.S`

`PortScreen`, `StatusScreen`, `JournalScreen`. No longer contains `TitleScreen` or a scenario screen (moved to `screens_core.jsx`). `StatusScreen` has grown substantially: beyond faction reputation, it now has a hero identity panel (captain name, faction, a fame/infamy-derived "captain tag" like *A Notorious Captain*), a narrative "Career" section built from `state.career` (the engine_career.js-tracked stats), and a per-faction "World's View" section combining reputation, heat, and crew faction-alignment in one panel.

### screens_shipyard.jsx → `window.S`

`ShipyardScreen` only, but restructured as a split dashboard: a sticky left panel (current ship's side-view sprite via `ShipSideSprite`, live stats, hull repair, equipped-items-by-slot list) and a tabbed right panel (Equipment / Ships / Locker), with a shared stat-delta preview panel that shows before/after numbers in green/red when an equipment item or a different ship is selected for comparison.

### screens_crew.jsx → `window.S`

`CrewScreen`, largely as previously documented (roster summary, hire panel, manifest grid, detail panel with generated bio and tag pills).

### screens_market.jsx → `window.S`

`MarketScreen`, now built on the shared `TransferLayout` primitive (hold on the left, port market on the right) instead of a bespoke two-column layout, plus the new market-flavour atmosphere line under the header (from `G.generateMarketFlavour`).

### screens_voyage.jsx → `window.S`

**Now contains only `MapScreen` and `SailingScreen`.** Event/Intercept/Battle/Plunder were split out into `screens_combat.jsx` (this is the completed roadmap item B1.5). `MapScreen` gained zoom/pan support (mouse wheel, pinch) and an at-sea mode that shows reachability and travel time from the player's *current sea position* rather than the last port, for the mid-voyage reroute feature.

### screens_combat.jsx (new file) → `window.S`

`EventScreen`, `InterceptScreen`, `BattleScreen`, `PlunderScreen` — split out of `screens_voyage.jsx`. `BattleScreen` now renders both combatants with proportionally-scaled `ShipSideSprite` side-view art (sized relative to each ship's configured hull length) rather than abstract stat panels alone, and has a small set of CSS-class-driven "juice" touches (miss-flash on the log panel, click-pulse on action buttons).

### App.jsx

`ErrorBoundary`, `HUD` (pulled into its own component specifically so the `useFlashOnChange` hooks have stable identity across re-renders), `App` (root, screen router, auto-save), `DebugPanel` (`?debug=1`-gated, now with more controls: heat per faction, morale, hidden-port unlock, max-crew, complete-mission, age-crew).

---

## Section 6 — Global Namespace Convention (rewrite)

| Namespace | Source | Contents |
|---|---|---|
| `window.D` | `data.js` + `data_text.js` | All constants: PORTS, SHIPS, SHIP_VISUALS, FACTIONS, EQUIPMENT, RESOURCES, STARTS, TUTORIAL_DELIVERY, TUTORIAL_HUNT, DEFAULT_CAREER, crew names, gossip/market-flavour templates, QM dialogue, etc. |
| `window.ShipSprite` | `ship-sprite.js` | Single function `render(shipType, options) → SVGElement`. No game knowledge — pure geometry/SVG composition over `window.D.SHIP_VISUALS`. |
| `window.L` | `logic.js` + `storage.js` | All pure functions + save/load encoding + tutorial state helpers. |
| `window.G` | `generators.js` | All RNG-dependent generators. |
| `window.E` | `engine_core.js` + 6 domain/middleware files | Reducer chain (`window.E._reducers`), action constants (`window.E.A`), initial state, shared helpers. Not all six files contributing reducers are domain owners — three are cross-cutting middleware (onboarding, career, scripted-demo). |
| `window.UI` | `ui.jsx` + `icons.jsx` | Theme tokens, all presentational components, the full icon library, and the `LOG_ICONS` category map. |
| `window.S` | `screens_*.jsx` (7 files) | All screen components. |

Common destructuring patterns at the top of files are unchanged in spirit, but note the icon imports now typically come alongside theme/component imports since `icons.jsx` merges into the same `window.UI` object:

```js
// In engine files:
const { PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES } = window.D;
const L = window.L;
const G = window.G;

// In screen files:
const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle, BackButton,
        NarrativePanel, TutorialPopup, ShipSideSprite, Tooltip, PortSilhouette } = window.UI;
const { IconAnchor, IconSwords, IconCannon } = window.UI;  // from icons.jsx, same namespace
```

**One dependency-direction note worth stating explicitly here, since it's easy to get backwards:** `window.E` (engine) is the *only* layer that may read `window.G` (generators) — this hasn't changed — but within `window.E` itself, the middleware files (`engine_onboarding.js`, `engine_career.js`) deliberately avoid calling into `window.G` or `window.L`'s domain-specific helpers at all. They only read and write plain state diffs. If a future middleware-style reducer finds itself needing generator or heavy logic calls, that's usually a sign it should be a domain reducer instead.


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
  factionAlerts: { english: 0, spanish: 0, french: 0, dutch: 0, pirate: 0 },
  currentPort: "portRoyal",
  route: null,                // see "Route shape" below — populated while sailing
  captainName: "",            // NEW — set on NewGameScreen, carried through START_GAME
  faction: null,               // NEW — player's chosen faction (english/spanish/french/dutch/pirate)
  tutorialMode: "full",        // NEW — "full" | "light" | "none", chosen once on NewGameScreen
  onboarding: {                 // NEW — entire object; see "Onboarding shape" below
    enabled: false,
    completed: true,
    currentStep: 0,
    stepsCompleted: { /* ~15 boolean flags */ },
    qmMessagesSeen: {},
    combatHintShown: false,
    qmDismissed: false,
  },
  scenarioId: null,             // vestigial — no longer set by START_GAME; kept for save compatibility
  previousPort: null,
  destination: null,
  discoveredPorts: [...],      // non-hidden port keys
  mapFragments: [],
  equipmentInventory: [],       // locker: removed equipment stored here
  sailingDaysLeft: 0,
  sailingDaysTotal: 0,
  wind: { angle: 45, speed: 10 },
  ship: {
    type: "dinghy",            // initialState default is dinghy, not sloop — actual starting ship comes from STARTS at START_GAME time
    name: "Sea Dog",
    hull: 30,
    cannons: 2,
    equipment: { hull: [], armament: [], rigging: [], special: [] },
  },
  crew: { roster: [], max: 5, morale: 80 },
  hold: {
    items: {
      food: 0, water: 0, rum: 0, sugar: 0, timber: 0, cloth: 0, spices: 0, silk: 0,
      coffee: 0, cocoa: 0, weapons: 0, tobacco: 0, silver: 0, slaves: 0,
    },
    // NOTE: no 'capacity' field on state.hold itself — always use L.getHoldCapacity(state),
    // which derives capacity from ship type + installed equipment effects.
  },
  portMarket: null,
  portGossip: [],
  missions: [],
  activeMission: null,
  reputation: { /* all port keys: 50 */ },
  battleState: null,
  activeEvent: null,
  encounterContext: null,
  career: { /* cloned from D.DEFAULT_CAREER — see "Career shape" below */ },
}
```

Route shape (populated by SAIL_TO, consumed by ADVANCE_DAY / getSeaPosition)

```js
route: {
  originPort: "portRoyal",
  destinationPort: "tortuga",
  originPos: { x, y },
  destinationPos: { x, y },
  progressDays: 0,
  totalDays: 4,
  seaPosition: { x, y },        // interpolated each ADVANCE_DAY via L.getSeaPosition
  enduranceBudget: 10,           // ship's maxDays at time of departure
  enduranceSpent: 0,             // increments each day; reroute (mid-voyage SAIL_TO) preserves this
}
```


Onboarding shape (owned by engine_onboarding.js, read by screens_core.jsx and L.isFeatureUnlocked)

```js
onboarding: {
  enabled: false,        // true only when tutorialMode === "full"
  completed: true,        // flips to false at START_GAME when enabled; true again on skip/complete
  currentStep: 0,          // not currently used for branching logic — stepsCompleted is the source of truth
  stepsCompleted: {
    contractsOpened: false, firstContractAccepted: false,
    marketOpened: false, provisionsAndGoodsBought: false,
    mapOpened: false, firstVoyageStarted: false,
    firstArrival: false, firstContractDelivered: false,
    crewOpened: false, firstCrewHired: false,
    tutorialHuntAccepted: false, tutorialHuntCompleted: false,
    shipyardOpened: false, shipRepaired: false,
    journalOpened: false,
  },
  qmMessagesSeen: {},      // keyed by QM_DIALOGUE step key, e.g. { welcome: true, marketOpen: true }
  combatHintShown: false,
  qmDismissed: false,
}
```

Career shape (owned by engine_career.js, read by StatusScreen)

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
  missionLog: [],          // [{ day, faction, type, risk, status, gold, fame, infamyGain, targetPort, daysToComplete }]
  combatLog: [],           // [{ day, encounterType, enemyName, enemyFaction, enemyShipType, outcome, playerShipType, crewLost, plundered }]
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

**Correction:** equipment effect keys are not `hullBonus`/`cannonBonus`/`speedBonus` as previously documented — they match the *actual stat field names* directly, with two special-cased percentage keys. In `D.EQUIPMENT[key].effects`:

- `hullPct` and `holdPct` are **multiplicative** — summed across all installed equipment, then applied once as `maxHull = round(base.maxHull * (1 + hullPct))` and `holdCapacity = round(base.holdCapacity * (1 + holdPct))`.
- Any other key matching a stat field name (`cannons`, `speed`, `maxDays`, `maxCrew`) is **additive** directly onto that stat.
- Non-stat keys (`repairCostPct`, `precisionHitPct`, `crewDmgPct`, `hullDmgPct`, `contrabandAvoidChance`, `crewLossMult`, `repGainBonus`, `missionCombatFameBonus`, `combatHeatMult`, `longVoyageDayReduction`, `stormHullImmune`, `calmImmune`) aren't stats at all — they're read individually via `L.getEquipmentEffect(state, key)` at the point of use (combat resolution, repair cost, travel days, patrol inspection, etc.), not folded into `getShipStats`.

```js
// Example: Tar-Sealed Hull
// effects: { maxDays: 2, speed: -1, calmImmune: true }
// → +2 maxDays and -1 speed apply directly via getShipStats;
//   calmImmune is read separately by the calm-winds event handler.

// Example: Reinforced Hull
// effects: { hullPct: 0.20 }
// Base sloop hull 100 → effective maxHull = round(100 * 1.20) = 120
```

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

Every hostile encounter goes through `L.buildEncounterContext(state, encounterType, enemy)`, producing an `encounterContext` with `enemy`, `flavourText` (from `D.ENCOUNTER_FLAVOUR[encounterType]`), and an `options[]` array, each with `{ id, label, available, reason, action }`. `InterceptScreen` renders these directly with no game logic of its own.

| Encounter Type | Fight | Flee | Parley | Bribe | Surrender | Inspect | Source |
|---|---|---|---|---|---|---|---|
| `patrol` | Y | Y | Y | Y (infamy<50) | Y | -- | Random patrol while sailing |
| `navy_patrol` / `navy_patrol_combat` | Y | -- | -- | -- | -- | Y | Faction patrol — only inspect or fight |
| `mission_combat` | Y | Y | -- | -- | -- | -- | Combat/patrol mission target |
| `escort_defend` | Y | -- | -- | -- | -- | -- | Escort mission — pirates attack convoy |
| `distressed_merchant_help` / `distressed_merchant_plunder` | Y | -- | -- | -- | -- | -- | Event: help or plunder a merchant |
| `hostile_port_entry` | Y | Y | -- | -- | Y | -- | Entering a port at war (rep < 10) |
| `random` | Y | Y | Y | Y | Y | -- | Generic pirate encounter |

**Patrol inspection (`PATROL_INSPECT`)** — the action name is `PATROL_INSPECT`, not `INTERCEPT_INSPECT`. On a navy-patrol encounter, choosing "Allow Inspection" checks the hold for tobacco, slaves, or rum tied to an active smuggle mission's required quantity. If contraband is found, the **Hidden Compartment** equipment effect (`contrabandAvoidChance`, default 0.50 when installed) is rolled first to potentially avoid detection entirely; on detection, the player loses the contraband, pays a fine of `seizedValue * D.PATROL_FINE_RATE` (rounded to the nearest 25g), gains +2 infamy, loses 5 reputation at every port of the inspecting faction, and loses 10 morale.

Pre-battle flee (InterceptScreen) and in-battle evade (`BattleScreen`, action `"evade"`) use the same speed-based formula: `fleeChance = clamp(0.6 + (playerSpeed - enemySpeed) * 0.02, 0.20, 0.95)`.

### Random patrol generation

```
L.maybeRandomPatrol(state)
Base chance: ~1% per sailing day
+ infamy / 400  (i.e. +0.25% per infamy point)
+ heat bonus: highest relevant faction alert * 0.03, itself dampened by reputation
  (Allied rep ≥70 → ×0.5, Friendly rep ≥50 → ×0.75, else ×1.0)
Capped at 40%: min(baseChance + infamyBonus + heatBonus, 0.40)
```

When a random patrol does trigger (`checkRandomPatrol` in `engine_voyage.js`), the **enemy's risk tier scales with the current port's faction heat**, not just the player's fame: heat ≥7 → `"high"` risk enemy, heat ≥3 → `"medium"`, otherwise `"low"`. This means a player who has been provoking a faction will face progressively tougher patrol ships from that faction even before any other stat changes.

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

Crew morale (0–100) affects combat effectiveness, wage cost (×1.5 below 30), and can trigger desertion/mutiny events. `L.getEffectiveMorale(state)` adds equipment morale bonuses and caps at 100.

### Economy system

Each port visit generates prices via `RESOURCES[good].basePrice * (1 ± variance)`, with availability tiers (`always`/`frequently`/`sometimes`/`rarely`/`never`) mapped per-port in `GOODS_AVAILABILITY`. Hold capacity is always `L.getHoldCapacity(state)` — never a stored field. The **Market screen's atmosphere text** (gold tier, hold fullness, price extremes, rare goods, fame/infamy framing, port-faction ambiance) is generated separately from port gossip, by `G.generateMarketFlavour(state, portKey)` reading `D.MARKET_FLAVOUR` — the two systems share detection logic (e.g. `isExtremePrice`) but serve different screens and never share template pools.

### Parametric mission generation

Missions are generated procedurally by `G.generateMissions()`. Six types: **escort, patrol, combat, trade, smuggle, assault**. Type selection is weighted by the issuing port's faction (pirate ports never offer patrol or trade missions). Risk level is tier-weighted toward higher risk as fame increases. Gold, fame, and enemy stats scale with the player's fame tier (0–4).

### Named crew roster

Crew members are generated with `G.generateCrewMember(faction)` → `{ id, firstName, lastName, role, faction, daysAboard, tags }`. Roles are weighted-random but cosmetic. Crew accumulate tags over time: hidden traits (`hidden_drunkard`, `hidden_coward`, `hidden_greedy`, `hidden_troublemaker`) revealed through gameplay, scars (`scar_battle`, `scar_storm`, `scar_shipwreck`), positive progression (`seasoned` at 50d, `veteran` at 100d, `loyal` at 200d + high faction rep), and alignment tags (`upset`, `mutineer`). Generated biographies (`G.generateCrewBio`) combine opening templates with combo sentences and suppression logic to avoid redundant scar/trait lines.

### Combat resolution flow

Turn-based, resolved in `engine_combat.js` via `BATTLE_ACTION`.

1. Player chooses `broadside` | `precision` | `grapple` | `evade`.
2. NPC action is weighted random (`L.getNPCAction`): 70% broadside, 25% precision, 5% grapple.
3. `L.resolveCombatAction(state, playerAction)` resolves both sides, applies the Surgeon's Bay `crewLossMult` effect, and applies a morale-based damage-taken modifier (worse below 30 morale, better above 70).
4. Phase check: enemy hull ≤0 → victory (sink); player hull ≤0 → defeat; successful evade → fled; successful grapple → instant victory with `canPlunder: true`.
5. On a grapple-win victory with `canPlunder`, the player navigates to `PlunderScreen` to manually select cargo; on a sink-win victory, gold is awarded automatically and there is nothing to plunder.

### Save / load behaviour

- **Auto-save**: triggers on `ENTER_PORT` and a few other state-settling actions via `window.E.autoSave`.
- **Manual save/load**: `SAVE_GAME`/`LOAD_GAME` in `engine_core.js` → `localStorage.setItem("piratesSave", ...)` / `JSON.parse` + `migrateState()`.
- **File export/import**: `EXPORT_SAVE` → `L.encodeSave(state)` (base64 + hash) → downloads as a `.broadside` file; `IMPORT_SAVE` → `L.decodeSave(json)` → `migrateState` → dispatch, flagging tampering if the embedded hash doesn't match.
- **Error recovery**: `ErrorBoundary` in `App.jsx` offers "Try Load Last Save."
- `L.checkLocalStorageAvailable()` detects iframe/Safari storage blocks and the Title/Port screens surface a warning + push the player toward Export/Import instead.

---

### Onboarding system (guided quartermaster tutorial)

New since the last revision of this document. When a player picks **Guided** on the New Game screen, `tutorialMode` is set to `"full"`, `START_GAME` injects a faction-specific quartermaster into the crew roster (tagged `quartermaster, protected` — protected crew never desert and can't be dismissed mid-onboarding) and auto-accepts the faction's `D.TUTORIAL_DELIVERY` mission.

From there, progress is **inferred, not driven**: `engine_onboarding.js` registers as middleware (see §4) and watches ordinary actions — `NAVIGATE`, `SAIL_TO`, `ENTER_PORT`, `HIRE_CREW`, `TAKE_MISSION`, `COMPLETE_MISSION`, `CONFIRM_TRADE`, `DISMISS_BATTLE` — against a `STEP_RULES` lookup table. Each rule is a pure function of `(prevState, nextState, action)` that returns which `onboarding.stepsCompleted` flags should flip. There is no "next step" button; the player simply plays, and the relevant flags set themselves as a side effect of normal actions.

Two other systems consume these flags:

- **`L.isFeatureUnlocked(state, feature)`** gates which Port-screen action buttons (`market`, `navigation`, `crew`, `shipyard`, `journal`) are visible while onboarding is active — they appear in a fixed order as the corresponding steps complete.
- **`OnboardingPopup`** (in `screens_core.jsx`) walks a separate ordered list of QM dialogue conditions, picks the first one whose `stepsCompleted` precondition is met and whose `qmMessagesSeen` key hasn't been shown yet *and* whose required screen matches the current screen, and renders that line via `QMPopup`. Dismissing a message marks it seen; dismissing the final ("departure") message also dispatches `ONBOARDING_COMPLETE`, which removes the quartermaster from the roster and logs a farewell line.

A player can bail out early via the "I'll take it from here" link, which dispatches `ONBOARDING_SKIP` — this marks every step complete at once, disables onboarding, and removes the quartermaster, without waiting for the natural step sequence to finish.

Two content-injection points are tied to onboarding state rather than the mission generator: the **tutorial hunt** (`D.TUTORIAL_HUNT`, a fixed low-risk combat mission against "The Rat") is spliced onto the mission board by both `HIRE_CREW` and `ENTER_PORT` once the player has hired their first crew member but hasn't yet accepted the hunt; and `G.generatePortMarket` force-stocks whatever good the active tutorial delivery mission requires, so a new player is never blocked from completing the opening mission by bad market RNG.

While `onboarding.enabled && !onboarding.completed`, `engine_voyage.js` also suppresses the normal random-event/patrol/drunkard checks during `ADVANCE_DAY`, so a brand-new player's first voyage can't be derailed by an unrelated storm or ambush before they've learned the basics.

The **Hints** mode (`tutorialMode: "light"`) is unrelated to any of this — it's the older, simpler localStorage-backed per-screen `TutorialPopup` system (`storage.js`'s `shouldShowTutorial`/`markTutorialSeen`), which now only activates when `tutorialMode === "light"`. **None** (`tutorialMode: "none"`) disables both systems entirely.

### Career stats tracking (middleware pattern)

`engine_career.js` is the second middleware reducer, registered after `engine_onboarding.js`. It maintains `state.career` purely as derived bookkeeping — nothing in the game reads `career` to make a gameplay decision, so a bug here can never affect actual play, only the Status screen's narrative.

The pattern it demonstrates is worth calling out for anyone adding similar cross-cutting tracking in the future: rather than adding `nextCareer.x++` lines scattered across `engine_port.js`/`engine_combat.js`/`engine_voyage.js` reducer cases (which is how this kind of tracking is usually bolted on, and how it used to be done here before B1.1), the middleware instead does a single `switch (action.type)` over the *already-resolved* state, comparing `action.__prevState` (the state before any domain reducer ran) against `state` (the state after every domain reducer has already run). This means:

- Gold earned/spent is just `state.gold - prevState.gold`, sign-split into the two running totals — with an explicit exemption list (`SKIP_GOLD_TRACKING = [START_GAME, LOAD_GAME, IMPORT_SAVE]`) for actions that replace the whole state wholesale, so loading a save doesn't get misread as a single enormous earning event.
- Crew loss attribution (`inBattle`/`inStorm`/`deserted`/`other`) is derived by diffing `prevState.crew.roster` against `state.crew.roster` and using the *action type* to decide which bucket the diff belongs to (`ENTER_PORT` → desertion, `RESOLVE_EVENT` with a storm event id → storm, `DISMISS_BATTLE`/`TAKE_PLUNDER` → battle).
- Plunder is **not** tracked under the generic `DISMISS_BATTLE` victory case, because `TAKE_PLUNDER` and `DISMISS_BATTLE` are mutually exclusive for the same fight — a grapple-won battle with cargo available routes to the Plunder screen and `DISMISS_BATTLE` is simply never dispatched for it, so `shipsPlundered`, the battle-won counter, and the combat log entry are all incremented from inside the `TAKE_PLUNDER` case instead, duplicating the small amount of bookkeeping `DISMISS_BATTLE` would otherwise have done.

Domain reducers (`engine_port.js`, `engine_voyage.js`, `engine_combat.js`) have **zero knowledge** that `engine_career.js` exists. This is the property that makes the pattern worth reusing: a new piece of cross-cutting tracking can be added as a new middleware file without editing any existing reducer, as long as the data it needs can be derived from a before/after state diff plus the action type.

### Ship visual identity system

`window.D.SHIP_VISUALS` (one entry per ship type in `data.js`) and `ship-sprite.js` (`window.ShipSprite.render`) together produce the detailed side-view ship art used in the Shipyard and Battle screens — this is distinct from the small top-down `ShipSprite` SVG in `ui.jsx` used as a map marker.

Each `SHIP_VISUALS` entry describes, in relative units: a `hullShape` (one of four shared hull-silhouette functions — `open`, `lowSloop`, `military`, `galleon`), `hullLength`/`hullHeight`, deck flags (`hasForecastle`, `hasQuarterdeck`, `hasPoopDeck`, `hasSternGallery`), gun deck count and gun-port counts, an array of `masts` (each with an `x` position as a fraction of hull length, a `rig` type, and which sails are present), an optional `staysails` list, and a `bowsprit` style. `ship-sprite.js` reads this purely as geometry — it has no knowledge of game rules, costs, or stats.

Equipment has a small set of opt-in visual hooks, checked by name inside the renderer rather than being a generic data-driven system: `war_pennants` adds a small pennant to every mast, `extra_sails` and `lateen_rig` extend mast height / force a lateen rig on the mizzen, `copper_plating` adds a hull band, and `ornate_figurehead` adds a bow ornament. `screens_shipyard.jsx`'s `getVisualEquipment(state)` helper filters the player's installed equipment down to just this short list (`VISUAL_EQUIPMENT`) before passing it to the sprite, since most equipment effects have no visual representation at all.

`BattleScreen` additionally scales both combatants' sprites *proportionally to each other* using `hullLength` — it computes `playerSize = playerLen / maxLen` and `enemySize = enemyLen / maxLen` so a dinghy fighting a galleon visibly reads as a mismatch, rather than rendering both ships at a fixed size. The enemy's ship type for this purpose is guessed from its cannon count via `L.guessShipType(enemy)`, since enemy combatants don't carry an explicit `SHIP_VISUALS`-compatible type field.


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
4. Add a matching entry to `SHIP_VISUALS` in `data.js` (hull shape, mast/sail layout, deck flags) or the ship will render as a blank/missing sprite in the Shipyard and Battle screens — see §8 "Ship visual identity system."

### Add an equipment item

1. Add entry to `EQUIPMENT` in `data.js` with `name`, `desc`, `cost`, `installFee`, `slot`, `effects`, `removable`, and optionally `requiredFame`, `requiredHull`
 2. If the item introduces a **new effect key**: stat-named keys (`cannons`, `speed`, `maxDays`, `maxCrew`) are additive and applied automatically inside `L.getShipStats()`; `hullPct`/`holdPct` are multiplicative and also applied automatically. Anything else (`repairCostPct`, `precisionHitPct`, `crewDmgPct`, `hullDmgPct`, `contrabandAvoidChance`, `crewLossMult`, `repGainBonus`, `missionCombatFameBonus`, `combatHeatMult`, `longVoyageDayReduction`, `stormHullImmune`, `calmImmune`) is **not** picked up automatically — you must add a `L.getEquipmentEffect(state, "yourNewKey")` call at whatever point in combat/travel/repair logic should consume it.
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

1. Create the component in the matching screen file: port-related → `screens_port.jsx`, voyage (map/sailing) → `screens_voyage.jsx`, combat/event/intercept/plunder → `screens_combat.jsx`, shipyard/crew/market → their own dedicated files, title/new-game/onboarding → `screens_core.jsx`.
2. Add to `window.S` in the `Object.assign` at the bottom of that file
3. Add `case "screenname":` to the router in `App.jsx` -> `renderScreen()`
4. If the screen needs a new action: add to `window.E.A` and the relevant domain reducer

### Add an action

1. Add the action name to `window.E.A` in `engine_core.js`
2. Add the `case A.YOUR_ACTION:` to the appropriate domain reducer (`engine_port.js`, `engine_voyage.js`, or `engine_combat.js`)
3. Return a new state object (spread-copy, never mutate)
4. If the action should also be tracked for onboarding progress or career stats, add a rule to `STEP_RULES` in `engine_onboarding.js` and/or a `case` in `engine_career.js` — **do not** add tracking code to the domain reducer itself. See §8's middleware pattern writeup for why.

### Add a tracked career stat
1. Add the field (zeroed) to `D.DEFAULT_CAREER` in `data.js`.
2. Add a `case` to the `switch` in `engine_career.js`'s `careerMiddleware`, deriving the value from `action.__prevState` vs the post-reducer `state` — never from gameplay-affecting logic.
3. Surface it on `StatusScreen` (either the narrative "Career" highlights list or the full-ledger toggle).
4. Do **not** touch `engine_port.js`/`engine_voyage.js`/`engine_combat.js` — that's the point of the middleware pattern.

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
| `tests_integration.html` | Standalone load-test: verifies every script tag loads cleanly and all core namespaces/components/data shapes exist. Catches load-order regressions (the original motivating case was `LOG_ICONS` going missing) without needing the full `tests.html` suite running. 

### Simulation tools

| Tool | File | Purpose |
|---|---|---|
| Economy simulator | `tests/sim.html` | Monte Carlo economy simulations -- 6 strategy profiles, fame-indexed charts |
| Balance dashboard | `tests/tests_balance.html` | Reachability, economy, combat, patrol, trade, events, gossip balance checks |
| Crew lifecycle sim | `tests/crew_sim.html` | 6 playstyles, per-member tracking, survival curves |
| Bio/log analyser | `tests/crew_bio_log_sim.html` | Bio uniqueness scoring, log pattern detection |
| Equipment combos | `tests/equipment_combo_analyzer.html` | Equipment combination analysis and stat delta preview |
| Screenshot gen | `tools/screenshots_builder.html` | 5 scenes × 3 sizes + itch.io assets, html2canvas export, built on real `window.UI`/`window.D` components rather than mocked markup. |
| Ship sprite preview | `tools/ship-preview.html` | Visual verification grid of  all ship types' procedural SVG silhouettes (`ship-sprite.js`), with toggles for faction flag, facing, and visual equipment — used when adding/adjusting `SHIP_VISUALS` entries. |

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
- Adding tracking/bookkeeping code directly inside `engine_port.js`/`engine_voyage.js`/`engine_combat.js` instead of as a middleware case in `engine_career.js` or `engine_onboarding.js` — works at first, but duplicates logic the moment a second domain reducer needs the same tracking, and breaks the "domain reducers know nothing about onboarding/career" invariant.
- Registering a new equipment effect key without also adding a `getEquipmentEffect` call somewhere — `getShipStats` only auto-applies stat-named keys plus `hullPct`/`holdPct`; everything else silently does nothing.
- Treating `L.classifyLogLine()`'s return value as an emoji/icon — it returns a **category key string** (`"arrival"`, `"combat"`, etc.); the icon comes from `window.UI.LOG_ICONS[category]` in `icons.jsx`, loaded separately.
- Assuming `STARTS` is an array of scenario objects (`{id, name, ship, gold, ...}`) — it's a single faction-keyed object (`factionPorts`, `factionBackstory`, `factionQM`, `factionRepAdjust`, + shared `gold`/`ship`/`hold`). `specs_data.md` still documents the old shape and shouldn't be trusted as a reference until it's corrected.
- Forgetting that `tutorialMode` is tri-state (`"full"`/`"light"`/`"none"`) — code that only checks a boolean "tutorial enabled" flag will mishandle the Hints-only mode, which uses the older localStorage-backed `TutorialPopup` system instead of `state.onboarding`.

### Always do

- Spread-copy: `return { ...state, gold: state.gold + 100 }`
- Nested spread: `ship: { ...state.ship, hull: newHull }`
- Add log entries: `log: [...state.log, "message"]`
- Gate purchases: check `gold >= cost` AND `fame >= requiredFame` AND ship supports slot
- Test in debug mode (`?debug=1`) after changes
- Run `tests/sim.html` after any balance change
- Run `tests/tests.html` after any logic/engine change
- When adding a new middleware-style reducer (cross-cutting tracking, not domain logic), push it onto `window.E._reducers` **after** the domain reducers it needs to observe — it reads `action.__prevState` for the before-state, but needs the domain reducers to have already run to see the after-state.
- Load-order matters doubly now: `engine_onboarding.js` and `engine_career.js` must load after `engine_port.js`/`engine_voyage.js`/`engine_combat.js`, and `icons.jsx` must load after `ui.jsx` (it extends `window.UI` rather than replacing it).

### File size limit

Keep each file under 1500 lines. If a file approaches this limit, split by domain (as was done with `engine.js` -> 4 files, and screens -> 5 files).
