# Game Design

***

## Design Philosophy

Broadside is a **systems-driven pirate game** that creates emergent stories through mechanical interaction, not scripted narrative.

> *A few mechanics that interact strongly beat many mechanics that exist independently.*

Every feature must pass this test: **does it create situations where two or more existing systems collide in ways the player didn't expect?**


### Core Design Axioms

- **Every success creates a new problem.** Win a battle → hull damaged, crew lost, cargo to manage, reputation shifted, heat increased.
- **The world remembers what you did.** Reputation, infamy, heat, crew loyalty, gossip : actions have echoes.
- **Crew are people, not numbers.** Named individuals with traits, scars, faction loyalties, and generated biographies. Losing a veteran hurts because you remember their story.
- **Resources are interconnected.** Gold buys crew, crew costs wages, wages require missions, missions require ships, ships require fame.
- **Time is the universal cost.** Every action takes days, days consume provisions, provisions cost gold.

### Game Influences & Stance

| Area | Reference | Broadside stance |
|---|---|---|
| Game loop structure | *Sid Meier's Pirates!*, *Galaxy on Fire 2HD*, *Caravaneer* | Similar feel, but with the resource pressure and logistics of Caravaneer |
| Systems-driven narrative | *Dwarf Fortress* | Stories emerge from mechanics, not scripts |
| Crew identity | *Darkest Dungeon* | Named characters accumulate traits; loss has weight |
| Encounter design | *Sunless Sea* | Atmosphere-first writing, choices with consequences |

***


## Nested Game Loops

**Core Loop** (click)
 - Travel progresses (advance day)
 - Event roll (heat / mission / random)
 - Player reaction (fight / flee / accept / ignore)
 - Resolution (combat / reward / loss)
 - Log entry generated
 - State updated (crew / morale / gold / supplies)


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

| System                       | Main state                | Main design role                 |  Mains Systems impacted            |  
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

One system sits outside this table deliberately: **Onboarding** (the guided quartermaster tutorial) is scaffolding, not a permanent gameplay system : it has its own state ('state.onboarding') and it does reach into other systems (gating which Port actions are visible, suppressing random events and patrols during the first voyage, force-stocking the market for the opening delivery), but every one of those effects is temporary and switches off once onboarding completes or the player skips it. It earns a place in this document because of how it's wired in : see the engine middleware pattern below : not because it's a pillar-bearing system in the way Combat or Reputation are."

Gossip, captain's log entries, crew biographies, the Captain's Journal, the quartermaster's onboarding dialogue, and the  screen's flavour text are not treated as core gameplay systems by themselves. They are part of the **Narrative Presentation Layer**.
Their role is to make consequences visible and help the player understand why things happened.
They do not create mechanical effects on their own.

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

---

## 1. Design Principles


## Module Responsibilities & Ownership

Each layer has a clear responsibility. Put new code in the layer that owns the concern rather than duplicating the concern across layers.

| Layer           | Files                     | Responsibility                          |  May call | May NOT call |
| --------------- | ------------------------- | ----------------------------------------------------------------------------------- | ----------|--------------|
| **Data**        | `data.js`, `data_text.js` | Canonical game constants and content.   |   Nothing | Logic, Engine, UI |
| **Logic**       | `logic_*.js`              | Pure game rules, calculations, validation, and deterministic resolution.            | `window.D` | Engine, UI, Generators |
| **Generators**  | `generators.js`           | Random/procedural runtime content generation.                                       |  `window.D`, `window.L` | Engine, UI |
| **Engine**      | `engine_*.js`             | State transitions and domain orchestration.                                         |  `window.D`, `window.L` | Engine, UI |
| **Storage**     | `storage.js`              | Browser persistence, save/load, migration, and persistent tutorial/discovery state. | `window.D`, `window.L`, `window.G` | UI |
| **UI**          | `ui.jsx`, `icons.jsx`     | Reusable presentation components, theme tokens, and icons.                          | `window.D`, `window.L` | Engine  |
| **Screens**     | `screens_*.jsx`           | Player-facing rendering and action dispatch.                                        | `window.D`, `window.L`, `window.E`, `window.UI` | Generators (except flavour texts) |
| **Application** | `App.jsx`                 | Root application, screen routing, HUD, and application-level UI/debug integration.  | Everything via dispatch | N/A |

### Ownership Rules

* **Data owns constants.** Do not duplicate game constants in logic, engine, generators, or UI.
* **Logic owns rules.** If a calculation or validation is a game rule, it should have one authoritative implementation in the logic layer. `logic_*.js` files contain **zero side-effects**. Every function is `(input) → output` with no mutation, no DOM access, no randomness. All RNG lives in `generators.js` : but logic functions accept an **injectable RNG** parameter (defaulting to `window.L.RNG`) so they remain testable and deterministic.
* **Generators own randomness.** Procedural content generation belongs in `generators.js`, not in UI or pure logic.  generators.js handles all randomness. Pure logic never calls Math.random().
* **Engine owns state transitions.** UI expresses intent through actions; engine reducers decide how state changes.
* **Storage owns persistence.** Game systems should not perform direct `localStorage` operations. `storage.js` extends `window.L` with localStorage-related helpers (save/load encoding, tutorial state management, persistence functions). It loads immediately after the logic files and attaches functions to the same `window.L` namespace. No RNG : just I/O wrappers.
* **UI owns presentation.** Screens render state and dispatch actions; they do not become alternate implementations of game rules.
* **Application code owns routing and composition.** Individual screens should not take over application-level navigation or state ownership.

The code is authoritative for implementation details such as exact function names, object fields, reducer cases, and current constants. This document defines architectural ownership and constraints, not an exhaustive API reference.


### Immutable state

The reducer always returns a **new** state object. No mutation of the previous state. Spread-copy every nested object that changes. useReducer, no direct mutation.

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

### Hard constraints and Anti-Patterns

- No npm, no bundler, no TypeScript, no build step. 
- No external dependencies:  Nothing beyond React, ReactDOM, Babel to Minimise  maintenance burden.
- Each `.js` / `.jsx` file is a single IIFE or global assignment.
- Reducer chain: domain engines register independently. Adding a new domain = adding a new file. Keep reducers immutable.
- Scripts are loaded in strict dependency order via `<script>` tags.
- Never violate the dependency direction (downward only).
- Use injectable RNG in logic functions.
- All text constants go in `data_text.js`, not hardcoded in engine logic.
- All inter-file communication is via `window.*` namespaces.
- Target: modern desktop and mobile browsers. Touch targets ≥ 44px, responsive layouts, no hover-only interactions for critical actions. 
- Text first UI : Art and sound are polish layers, not structural. The game must be compelling and playable with text alone.
- After any code change, run the test suite (`tests/tests.html`).
* **Single ownership**: each rule, state transition, data definition, and persistence concern has one authoritative owner.
* **No duplicated rules**: consumers call canonical logic rather than reproducing calculations locally.
* **Layered responsibility**: data defines, logic calculates, generators generate, engine transitions, storage persists, and UI presents.
* **Code over inventory**: implementation details are read from the source; architecture documentation records decisions and boundaries.


Avoid:
* Duplicating a game rule in multiple layers.
* Copying a constant from `data.js` into engine, logic, generator, or UI code.
* Calling `generators.js` directly from a screen.
* Implementing authoritative game rules inside UI components.
* Mutating the shared state tree directly.
* Performing direct browser persistence outside `storage.js`.
* Creating alternate representations of state when the existing state can express the information.
* Adding a new abstraction solely to work around an existing ownership boundary.
* Maintaining Markdown inventories of functions, constants, reducer cases, components, or object fields that can be obtained directly from the code.
* Treating historical implementation notes as current architecture.
The preferred solution is usually to strengthen the existing owner rather than create a second owner.



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
├── data.js                            ← window.D : game constants
├── data_text.js                       ← extends window.D : text/content constants
├── logic_core.js                      ← window.L : core pure helpers
├── logic_economy_crew.js              ← window.L : crew, economy, cargo, reputation
├── logic_travel_events.js             ← window.L : travel, sea position, events, patrols
├── logic_combat_encounter.js          ← window.L : combat resolvers + encounter helpers + NPC AI + action preview
├── storage.js                         ← extends window.L : save/load + tutorial state + persistence
├── generators.js                      ← window.G : RNG: missions, markets, crew, enemies, gossip, bios, combat flavour
│
├── engine_core.js                     ← window.E : reducer chain, initial state, actions, migration
├── engine_port.js                     ←           port domain reducer
├── engine_voyage.js                   ←           voyage domain reducer
├── engine_battle.js                   ←           battle domain reducer (BATTLE_ACTION, DISMISS_BATTLE, TAKE_PLUNDER)
├── engine_encounter.js                ←           encounter domain reducer (intercepts, random events, merchant encounters)
├── engine_onboarding.js               ←           onboarding middleware reducer
├── engine_career.js                   ←           career-stats middleware reducer
├── engine_scripted.js                 ←           dev-only scripted-playthrough reducer (?scripted=1)
│
├── ui.jsx                             ← window.UI : theme tokens + presentational components
├── icons.jsx                          ← extends window.UI : SVG icon library + LOG_ICONS
├── screens_core.jsx                   ← window.S : TitleScreen, NewGameScreen, onboarding UI
├── screens_port.jsx                   ← window.S : PortScreen
├── screens_status.jsx                 ← window.S : StatusScreen, JournalScreen
├── screens_shipyard.jsx               ← window.S : ShipyardScreen
├── screens_crew.jsx                   ← window.S : CrewScreen
├── screens_market.jsx                 ← window.S : MarketScreen
├── screens_voyage.jsx                 ← window.S : MapScreen, SailingScreen
├── screens_combat.jsx                 ← window.S : EventScreen, InterceptScreen, BattleScreen, PlunderScreen
├── screens_menu.jsx                   ← window.S : MenuModal, FeedbackPanel
├── App.jsx                            ← root: HUD, screen router, ErrorBoundary, DebugPanel
│
├── docs/                              (see documentation section)
├── tests/                             (see testing section)
└── tools/                             (see tools section)
```

---

## 4. Dependency Graph


#### Namespace Convention

| Namespace | Source | Contents |
|---|---|---|
| `window.D` | `data.js` + `data_text.js` | All constants. |
| `window.ShipSprite` | `ship-sprite.js` | Single function `render(shipType, options) → SVGElement`. |
| `window.L` | `logic_*.js`  + `storage.js` | All pure functions + save/load encoding + tutorial state helpers + persistence. |
| `window.G` | `generators.js` | All RNG-dependent generators. |
| `window.E` | `engine_*.js` | Reducer chain (`window.E._reducers`), action constants (`window.E.A`), initial state, shared helpers. |
| `window.UI` | `ui.jsx` + `icons.jsx` | Theme tokens, all presentational components, the full icon library, and the `LOG_ICONS` category map. |
| `window.S` | `screens_*.jsx` | All screen components. |

### Dependency Direction

The runtime layers communicate through clear boundaries:

```text
                    data.js / data_text.js
                       window.D
                           ↑
             ┌─────────────┼─────────────┐
             │             │             │
             L             G             UI
        window.L      window.G       window.UI
             ↑             ↑             ↑
             │             │             │
             └──────────── E ────────────┘
                         window.E
                            │
                         state
                            │
                         storage
```

The practical dependency rules are:

* `data.js` and `data_text.js` are read by other layers; runtime code does not mutate `window.D`.
* `logic_*.js` may read data and call other pure logic helpers.
* `logic_*.js` must not call Engine, Generators, UI, or persistence.
* `generators.js` may use data and pure logic helpers.
* `generators.js` must not call Engine or UI.
* Engine reducers may use data, logic, and generators.
* Screens and UI may read data and logic and dispatch Engine actions.
* Screens must not call generators directly.
* Screens must not directly mutate game state.
* Persistence is centralized in `storage.js`; other modules do not bypass it with direct browser storage operations.

When a dependency would violate these boundaries, move the responsibility to the layer that owns it rather than introducing a cross-layer shortcut.


### Dependency direction rule : never violated

Arrows point **downward only**. A file may import from files above it in the graph but never below. `data.js` imports nothing. `App.jsx` can read anything.

The `index.html` `<script>` load order matches this graph top-to-bottom.


### Canonical Sources of Truth

Each kind of information has one authoritative home.

| Information                                    | Canonical source                      |
| ---------------------------------------------- | ------------------------------------- |
| Game constants and content                     | `data.js`, `data_text.js`             |
| Pure game rules and calculations               | `logic_*.js`                          |
| Random/procedural generation                   | `generators.js`                       |
| Current game state shape and state transitions | `engine_*.js`                         |
| Persistence format and migrations              | `storage.js` / state-version handling |
| Reusable UI primitives and theme tokens        | `ui.jsx`                              |
| Icons                                          | `icons.jsx`                           |
| Player-facing screen composition               | `screens_*.jsx`                       |
| Application routing and root composition       | `App.jsx`                             |
| Guaranteed behavior and invariants             | Tests                                 |

Do not maintain parallel Markdown copies of exhaustive constants, function inventories, reducer cases, component inventories, or state schemas. Those documents become stale as the code changes.

Use this document to describe **architectural intent, ownership, dependencies, and invariants**. Use the source code to determine the current implementation.



### State & Reducer Contract

Game state is owned by the Engine.
The full state shape is defined in `engine_core.js` -> `window.E.initialState`.

* The game uses one immutable state tree.
* UI code reads state and dispatches actions; it does not own gameplay state.
* Engine reducers are the authoritative mechanism for state transitions.
* Domain reducers are responsible for their own state-transition concerns.
* Shared reducer infrastructure belongs in `engine_core.js`.
* Middleware reducers may observe completed transitions and maintain derived/lifetime tracking state.
* Pure calculations needed by reducers belong in the logic layer rather than being duplicated inside reducers.
* Random content required by a state transition is generated through `generators.js` and then stored in state where appropriate.

A new gameplay mechanic should therefore normally follow this path:

```text
player action
    ↓
UI dispatches action
    ↓
engine reducer
    ↓
logic resolves rules / generator creates content
    ↓
new immutable state
    ↓
UI renders new state
```

Do not create a second state model in UI, generators, or individual engine domains merely to simplify a local implementation.


### Logic & Generator Contract

placeholder

### Persistence Contract

`storage.js` owns browser persistence.

* Game saves are serialized and restored through the storage layer.
* Tutorial and discovery persistence remains separate from the main game save where the implementation requires it.
* Persisted game state is versioned.
* Changes to the persisted state shape require migration handling rather than silently breaking existing saves.
* Storage failures should fail gracefully where possible, including restricted browser storage environments.
* Game rules and UI code must not implement their own persistence paths.
* Save/load behavior is separate from gameplay logic: a state modified through normal gameplay or development/debug tooling is still ordinary state for persistence purposes.

## UI Contract

The UI is a presentation and interaction layer, not a second game engine.

* `ui.jsx` owns reusable presentation primitives and theme tokens.
* `icons.jsx` owns the shared SVG icon library.
* `screens_*.jsx` own player-facing screen composition.
* Screens read current state and dispatch Engine actions.
* Screens do not directly mutate state.
* Screens do not call generators.
* Game rules and authoritative calculations belong in the logic layer.
* Reuse existing UI primitives before introducing new one-off components.
* Shared visual constants should use the existing theme/token system rather than introducing unrelated hardcoded values.
* UI behavior should remain usable on the supported narrow/mobile layouts as well as desktop layouts.


---

## 5. File & Responsibility Map

This section provides a high-level map of runtime file responsibilities.

It is intended to answer:
* Which file owns a given kind of rule, calculation, state transition, generation step, or presentation?
* What type of functionality is expected to live in each file?
* When does a file appear to be accumulating responsibilities that belong elsewhere?

This is an architectural overview, not an API reference. Exact function names, reducer cases, fields, and constants are defined by the source code and should not be duplicated here unless they represent an important architectural interface.

### Runtime Ownership

| File    | Scope owns | Typical functions or cases     |
| ------- | ---------- | ------------------------------ |
| `data.js`| Canonical game data and configuration. No gameplay orchestration.| Ship definitions, equipment definitions, goods, ports, factions, missions, balance constants, thresholds, tables, static configuration, progression data.|
| `data_text.js`| Canonical player-facing text and narrative content.| UI labels, descriptions, mission text, flavour text, dialogue, tutorial text, contextual messages, named text keys.|
| `ship-sprite.js`| Ship visual representation independent of gameplay rules.| Ship silhouette/sprite construction, visual configuration, rendering helpers, damage/state visual variants.   |
| `logic_core.js`| Cross-system pure rules and generic calculations used throughout the game.| Shared validation, generic requirement checks, derived values, reputation/Fame relationships, common state queries, reusable rule helpers.      |
| `logic_economy_crew.js`| Economy, crew, provisions, morale, wages, and related pure rules.| Trade calculations, buy/sell validation, prices and profits, crew costs, wages, provisions consumption, morale effects, crew-related derived values and validation.|
| `logic_travel_events.js`| Travel, voyage, distance, timing, patrol/event conditions, and other at-sea pure rules.   | Travel time and reach, speed/hold effects, voyage constraints, event/patrol conditions, encounter eligibility, at-sea derived values.|
| `logic_combat_encounter.js`| Combat, encounter, boarding, and related pure resolution/validation rules.| Combat action legality, hit/damage calculations, distance rules, boarding resolution, surrender conditions, encounter validation, combat previews, deterministic resolution helpers.|
| `storage.js`| Persistence and save/load concerns. It may use the shared `L` namespace for historical compatibility, but its responsibility is persistence rather than gameplay logic. | Save/load, serialization, migration, export/import, persistence validation, browser storage access, tutorial/discovery persistence.             |
| `generators.js`| Random and procedural content generation. Generates content but does not own gameplay state transitions.| Random encounters, patrol composition, enemy generation, mission generation, random traits, procedural choices, seeded/testable generation helpers.|
| `engine_core.js`| Central state/reducer infrastructure and cross-domain orchestration.| Initial state, reducer registration/dispatch infrastructure, shared reducer flow, global actions that do not belong to a specific domain engine, reducer composition.|
| `engine_port.js`| Port and port-service state transitions.| Entering/leaving ports, port actions, trade completion, repairs, hiring/dismissing crew, provisions, faction services, loans, reputation/service transactions, port-specific state updates. |
| `engine_voyage.js`| Voyage lifecycle and at-sea state transitions.| Departing, travelling, course changes, consuming travel resources, travel time progression, voyage completion, event/patrol triggers, at-sea state changes.|
| `engine_battle.js`| Naval combat state transitions.| Starting/resolving turns, combat actions, distance changes, damage, evasion, grappling, boarding transitions, combat victory/defeat, plunder-related state changes.|
| `engine_encounter.js`| Encounter/interception flow outside the core battle exchange.| Encounter creation, intercept choices, parley/bribe/inspection/surrender flows, encounter consequences, escalation into battle or other outcomes.|
| `engine_onboarding.js`| New-player onboarding state and tutorial progression.| First-game setup, onboarding choices, tutorial progression, introductory unlocks, one-time onboarding state changes.|
| `engine_career.js`| Career/progression state transitions and career-specific rules.| Career progression, milestones, rewards, unlock progression, career-specific state changes.|
| `engine_scripted.js`| Explicit scripted events and authored state transitions that do not belong to normal procedural systems.| Story/scripted events, special one-off sequences, authored branching outcomes, predefined event state changes.|
| `ui.jsx`| Shared UI primitives and presentation utilities.| Panels, buttons, cards, layout primitives, common controls, formatting helpers, reusable presentation components.|
| `icons.jsx`| Reusable visual icons and icon components.    | UI icons, symbolic indicators, status/action icons, shared icon rendering helpers.|
| `screens_core.jsx`| Shared/core application screens.| Menu, general HUD/status views, common information screens, screens that do not belong to a specific domain subsystem.|
| `screens_port.jsx`| Port-facing UI and port navigation.| Port overview, port services, navigation from port, port information cards, service entry points.|
| `screens_shipyard.jsx`| Shipyard and equipment UI.| Ship browsing, ship selection, equipment browsing, installation/removal UI, requirement previews, purchase actions.|
| `screens_crew.jsx`| Crew management UI.| Crew roster, hiring/dismissal, crew details, morale/trait presentation, crew-related actions.|
| `screens_market.jsx`| Market and trade UI.| Goods listings, prices, buy/sell controls, trade summaries, trade-related information and validation display. |
| `screens_voyage.jsx`| Voyage and navigation UI.| Map/navigation, route selection, at-sea status, voyage actions, travel information, event presentation.|
| `screens_combat.jsx`| Combat and boarding UI.| Combat state display, legal action presentation, combat previews, boarding choices, combat outcome presentation.|
| `screens_status.jsx`| Player/ship/faction status presentation.| Fame, reputation, Infamy, faction status, ship statistics, progression and other overview information.        |
| `screens_menu.jsx`| Menu and persistence-related UI.| Save/load, export/import, settings and menu-level actions.|
| `screens_FactionService.jsx` | Dedicated faction-service screens.| Dutch Bank, Spanish Inquisitor, French Embassy, and other specialized faction-service interfaces.|
| `App.jsx`| Application composition and top-level routing.| Screen routing, global HUD/debug integration, root composition, dispatch wiring, top-level application state flow.|

### Scope-Creep Checks

A change should be reviewed when it causes a file to accumulate responsibilities outside the scope above.

Typical warning signs include:
* A **screen** starts implementing authoritative gameplay calculations, state transitions, or random generation instead of displaying prepared state and dispatching actions.
* A **generator** directly mutates game state or begins acting as a reducer.
* A **logic** file performs persistence, DOM access, UI work, or owns uncontrolled randomness.
* An **engine** introduces reusable calculations that should be pure logic helpers instead of being tied to a state transition.
* `engine_core.js` starts accumulating domain-specific reducer cases that clearly belong to a domain engine.
* A **data** file starts containing procedural generation or gameplay orchestration instead of canonical definitions/configuration.
* A **UI utility** or screen begins containing rules that already have a canonical implementation in `logic_*.js`.
* A new helper is placed in a file only because it is convenient there, while another file already clearly owns that responsibility.
* A file starts needing detailed knowledge of several unrelated game domains in order to implement what should be a local responsibility.

### Ownership Test

Before adding a new function or reducer case, ask:
1. **What responsibility does this code own?**
2. **Does another module already own that kind of responsibility?**
3. **Is it calculating, generating, mutating state, persisting, or presenting?**
4. **Would another developer immediately know why this code belongs in this file?**

When the answer is unclear, prefer extracting the responsibility into the existing owning layer rather than expanding the file opportunistically.

### Architectural Interfaces Worth Naming

Most individual helpers do not need to be listed here. A small number of interfaces are important enough to document because they define boundaries between modules.

Examples include:
* `E.initialState`
* `E._reducers`
* major reducer action families owned by each engine domain
* shared logic interfaces such as `L.canInstallEquipment()`
* important derived-state or rules interfaces such as `L.getShipStats()`
* major encounter/combat context builders
* the ship visual rendering interface exposed by `ship-sprite.js`

These should be documented when they represent an architectural contract; ordinary implementation helpers should remain visible only in the source code.



---

## 6. Game Mechanics & System Invariants

This section documents the important mechanics, cross-system relationships, and invariants that the implementation must preserve.
It is not a complete mechanics reference or balance sheet. Canonical data belongs in `data.js` / `data_text.js`, executable rules belong in the appropriate logic and engine modules, and exact implementation details belong in the source code.
The purpose of this section is to document rules that are especially important when changing or extending the game because they involve multiple systems, ordering constraints, or architectural boundaries.

### 6.1 State Flow & Domain Boundaries

Gameplay follows a layered flow:
`data → logic / generators → engine state transition → UI`

The responsibilities remain distinct:
* **Data** defines canonical configuration and content.
* **Logic** calculates rules, validates actions, and resolves deterministic outcomes without mutating game state.
* **Generators** create random or procedural content.
* **Engines** combine rules and generated content with state transitions.
* **Screens** present prepared state and dispatch actions rather than implementing authoritative gameplay rules.
* **Storage** persists and restores authoritative state.

When a mechanic crosses several systems, each layer should still retain its normal responsibility rather than moving the entire mechanic into the layer where it is first encountered.
State transitions should remain centralized in the owning engine domain. Derived values should normally be recalculated from authoritative state rather than stored separately unless persistence or performance requires otherwise.

### 6.2 Reputation, Fame & Infamy

Fame, faction reputation, Infamy, and faction Heat are separate progression/state systems and must not be treated as interchangeable.
**Fame** is a persistent player progression value. It does not decay and is used for progression and access requirements.
**Faction reputation** represents the player's standing with a specific faction. Reputation affects missions, faction services, and other faction-specific access rules.
**Infamy** represents criminal notoriety and is independent of faction reputation and Fame.
**Faction Heat** represents a faction's current hostility toward the player's recent activity and is distinct from long-term faction reputation.

Important invariants:
* Faction reputation effects must use the canonical reputation rules rather than ad-hoc changes in UI or individual screens.
* Fame progression must not be silently replaced by faction reputation as a progression gate.
* Service access may depend on faction reputation while service-level benefits may additionally depend on Fame.
* Reputation-based effects that intentionally apply to an entire faction should use the canonical faction-wide mechanism rather than modifying only the currently displayed port.
* Reputation decay, where applicable, is a time/state transition and is not a UI-side calculation.

Exact thresholds and progression values are data-driven and should not be duplicated here.

### 6.3 Economy & Trade

The economy is authoritative at the engine/logic level. Screens display prices and possible outcomes but do not determine the final transaction result.

Trade calculations should remain centralized so that:
* port-specific pricing and modifiers are applied consistently;
* buy and sell totals are calculated from the same authoritative rules;
* the final transaction result is resolved by the port/trade engine path;
* derived profit is not independently recalculated by UI code.

The Dutch Bank debt system interacts with trade as a separate financial rule:
* positive trade income can be subject to debt repayment;
* the debt garnish is calculated from eligible trade income and remaining debt;
* irregular cash acquired outside trade, such as plunder, is not automatically treated as trade income;
* mission reward garnish is applied to the reward itself rather than to the value of mission cargo.

These distinctions are intentional and must remain explicit when modifying economy systems.

### 6.4 Crew, Morale & Resources

Crew, morale, provisions, and wages form an interconnected system.

Important relationships include:
* crew count affects ship operation and combat effectiveness;
* provisions are consumed over time based on crew requirements;
* shortages produce morale consequences and, under sustained deprivation, crew losses;
* wages are a recurring cost and interact with morale;
* morale affects crew effectiveness and certain travel/combat outcomes;
* crew losses can themselves affect morale and subsequent combat performance.

Crew-related UI should present these consequences but should not reproduce the underlying calculations.
Crew requirements and ship capacity constraints are game rules and belong in canonical validation/calculation helpers. Actions such as hiring, dismissing, losing, or restoring crew are state transitions owned by the appropriate engine.

### 6.5 Travel, Events & Encounters

Travel is a stateful process rather than a single calculation.

The voyage system combines:
* ship capabilities,
* current cargo/load,
* provisions and other travel resources,
* elapsed travel time,
* route and destination constraints,
* random events and patrol generation,
* encounters that may interrupt or redirect normal travel flow.

Important architectural distinctions:
* Travel calculations belong in pure logic.
* Random event/patrol creation belongs in generators.
* Changes to voyage state belong in the voyage/encounter engines.
* Screens present the current voyage state and dispatch available actions.
* Encounter generation and encounter resolution are separate responsibilities.

An encounter may lead to several distinct outcomes, including escalation into combat, negotiation, inspection, surrender, or continuation of travel. The encounter engine owns those state transitions; combat rules are handled by the combat domain once combat begins.
Port entry is an important state boundary. Entering a port may reset visit-specific values and establish the new current-port context. Visit-scoped mechanics should therefore be reset through the canonical port-entry transition rather than through individual screens.

### 6.6 Naval Combat & Boarding

Naval combat is turn-based and uses the ship's current combat state, including distance, hull, crew, and relevant combat modifiers.
The important architectural invariant is that **action legality and combat resolution are determined by logic**, while the combat screen only presents actions that are currently available and dispatches the chosen action.
Combat is organized around distance states. Available actions depend on the current distance, and actions that change distance must use the canonical movement/resolution rules rather than directly modifying the distance in the UI.
Broadside, precision fire, distance control, evasion, and grappling are separate combat actions with distinct resolution rules.
Grappling transitions combat into the boarding state. Boarding is not simply another naval attack action; it is a separate resolution phase with its own crew and morale relationships and its own action set.

Important combat invariants include:
* the combat engine owns combat state transitions;
* the logic layer owns action legality and deterministic combat calculations;
* zero hull and zero crew represent different combat outcomes;
* boarding victory determines whether plunder becomes available;
* a ship that sinks cannot subsequently be plundered;
* mission-linked consequences may occur when the relevant target is lost, even if the surrounding combat continues;
* surrender, retreat, capture, and victory consequences are resolved centrally rather than inferred by the screen.

Exact hit chances, damage multipliers, thresholds, and numerical modifiers belong to the canonical rules/data and tests.

### 6.7 Missions & Mission Consequences

Missions are structured gameplay objectives rather than independent UI activities.
Mission state should remain authoritative in the appropriate engine domain, while mission-specific calculations and validation remain in logic helpers.

Mission outcomes can affect several systems simultaneously, including:
* gold,
* Fame,
* faction reputation,
* cargo,
* Infamy or Heat,
* ship/crew state,
* subsequent encounter or voyage state.

These consequences should be resolved as part of the relevant state transition rather than distributed across multiple screens.
Abandoning or failing a mission must use the canonical mission-consequence path so that any associated commissioning-faction effects are applied consistently.
Mission rewards, requirements, and outcome values remain data-driven.

### 6.8 Faction Services & Special Access

Faction services are intentionally implemented as domain-specific port interactions rather than as generic global bonuses.
The current special-service pattern is:

| Faction | Service      | Important rule|
| ------- | ------------ | -------------- |
| English | Naval Yard   | Reputation unlocks servicing/removal access; higher reputation unlocks early access to ships and equipment with reduced Fame requirements. |
| Spanish | Inquisitor   | Reputation-gated service that reduces Infamy by a fixed amount, subject to the service's visit/use restrictions.|
| French  | Embassy      | Reputation-gated service that converts gold into a reputation increase with another faction.|
| Dutch   | Bank         | Reputation-gated loans and debt repayment through eligible income.|
| Pirate  | Black Market | Pirate ports provide the exclusive source of Smuggling missions.|

These services illustrate an important distinction between **access reputation** and **progression requirements**. For example, a faction's reputation may unlock a service while Fame still determines normal ship/equipment progression, with the service providing an explicitly defined exception.
Service requirements and costs are data-driven. Individual service screens should not duplicate their rules; they dispatch actions to the owning engine.

### 6.9 Ship, Equipment & Progression Invariants

Ships and equipment are related but distinct progression systems.

Important rules include:
* ship capability and equipment compatibility are validated centrally;
* equipment installation/removal must respect slot type, hull/ship compatibility, duplicate restrictions, and other structural constraints;
* removable equipment can be stored and reinstalled according to the applicable service rules;
* structural or permanently attached equipment is handled differently from removable equipment;
* acquiring a new ship may change the equipment state and therefore requires a canonical transition rather than UI-side manipulation;
* Fame remains the normal progression gate for ships and equipment;
* explicit faction-service privileges may reduce or bypass only the progression requirement they are intended to affect, while structural validity rules still apply.

The English Naval Yard is an example of this separation: servicing access and early-access progression benefits are different privileges and should not be merged into a single generic bypass.

### 6.10 Persistence & Migration Invariants

Saved data represents authoritative game state, not UI state.

Persistence code is responsible for:
* serializing authoritative state;
* restoring state into the current schema;
* migrating older save versions;
* preserving player progress across sessions and exports/imports;
* supplying appropriate defaults for fields introduced by later versions.

Derived presentation state should not be persisted merely because it is convenient for a screen.
Debug-modified state follows the same persistence rules as normal game state. There should not be a separate save path or implicit "debug save" classification unless explicitly introduced as a gameplay feature.
When a new persistent field is introduced, its initialization, save/load behavior, and migration/default behavior should be considered together.

### 6.11 Randomness & Determinism

Randomness belongs to generation and explicitly random resolution rules, not to arbitrary engine or UI code.
The project supports injectable randomness so that rules involving random outcomes can remain deterministic under test.

Important expectations:
* generators own procedural/random content creation;
* pure logic may accept an injected RNG when randomness is part of the rule being resolved;
* engines should consume the generated/resolved result and apply state transitions;
* screens should not call random generators to decide gameplay outcomes.

This separation allows random systems to remain testable and prevents UI rendering or interaction order from changing gameplay outcomes.

### 6.12 Derived State & Presentation

The UI should generally consume authoritative state plus canonical derived calculations.
When a value can be calculated from existing authoritative state, storing a second copy creates a synchronization risk.

Examples include:
* displayed ship statistics,
* combat action legality,
* service availability,
* trade totals,
* progression/access previews,
* voyage information.

Presentation code may format, group, or explain these values, but it should not silently create a competing version of the underlying rule.
When a screen needs a new calculation, first check whether the rule already belongs in an existing logic owner. A new screen-local helper is appropriate primarily for presentation formatting or genuinely local display concerns.

### 6.13 Architectural Change Guardrails

When extending an existing mechanic, preserve the following sequence:

1. Identify the canonical data/configuration involved.
2. Identify the logic owner of the rule or calculation.
3. Identify the engine owner of the resulting state transition.
4. Keep random/procedural generation in `generators.js`.
5. Expose the result to the UI through authoritative state or canonical derived calculations.
6. Add or update tests for the invariant or cross-system interaction being changed.

A mechanic that requires substantial logic in multiple unrelated screens, duplicated validation, or duplicated state is a signal that the implementation boundary should be reconsidered rather than extended locally.


---

## 7. Testing Infrastructure

- **Unit tests** (`tests/tests_logic.js`): pure logic and generator functions.
- **Engine tests** (`tests/tests_engine.js`): reducer cases, immutability checks, new actions.
- **UI tests** (`tests/tests_ui.js`): namespace existence, smoke renders.
- **Integration tests** (`tests/tests_integration.html`): load order and namespace integrity.
- **Robustness tests** (`tests/tests_robustness.js`): edge cases, fuzzing, RNG determinism.
- **Simulation tools** in `tools/`: balance, career, crew, combat AI, etc.
