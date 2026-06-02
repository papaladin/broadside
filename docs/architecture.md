# Broadside — Architecture Documentation

> Canonical reference for project structure, conventions, and game mechanics.
> Last updated to match codebase: June 2026.

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
| **Data** | `data.js` | Nothing | Logic, Engine, UI |
| **Logic** | `logic.js` | `window.D` | Engine, UI |
| **Generators** | `generators.js` | `window.D`, `window.L` | Engine, UI |
| **Engine** | `engine_core.js`, `engine_port.js`, `engine_voyage.js`, `engine_combat.js` | `window.D`, `window.L`, `window.G` | UI |
| **UI** | `ui.jsx` | `window.D`, `window.L` | Engine, Generators |
| **Screens** | `screens_port.jsx`, `screens_voyage.jsx` | `window.D`, `window.L`, `window.E`, `window.UI` | Generators (directly) |
| **App** | `App.jsx` | Everything via dispatch | — |

### Pure functions in logic.js

`logic.js` contains **zero side-effects**. Every function is `(input) → output` with no mutation, no DOM access, no randomness. All RNG lives in `generators.js`.

### Immutable state

The reducer always returns a **new** state object. No mutation of the previous state. Spread-copy every nested object that changes.

### Single source of truth

- All game constants → `data.js`
- All derived calculations → `logic.js`
- All random generation → `generators.js`
- All state transitions → `engine_*.js` reducers
- All visual tokens → `ui.jsx` theme object `T`

### Files that change together live together

Port-related screens, port engine actions, and port-related generators are organized by domain, not by technical layer. The engine is split into domain files (`engine_port.js`, `engine_voyage.js`, `engine_combat.js`) that each register their own reducer into the core chain.

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

### Save key

```
localStorage key: "broadside_save"
Format: JSON.stringify(state)
Migration: migrateState() in engine_core.js adds missing fields on load
```

---

## 3. File Structure

### Current structure

```
broadside/
├── index.html            ← entry point, <script> load order
├── data.js               ← window.D — all constants
├── logic.js              ← window.L — pure functions
├── generators.js         ← window.G — RNG: missions, markets, crew, enemies
├── engine_core.js        ← window.E — reducer chain, initial state, actions, save/load
├── engine_port.js        ←           port domain reducer (docked actions)
├── engine_voyage.js      ←           voyage domain reducer (sailing, day advance)
├── engine_combat.js      ←           combat domain reducer (encounters, battles, plunder, events)
├── ui.jsx                ← window.UI — theme tokens, Btn, Bar, Pill, StatBlock, etc.
├── screens_port.jsx      ← window.S — StartScreen, PortScreen, ShipyardScreen, CrewScreen, StatusScreen, MarketScreen
├── screens_voyage.jsx    ← window.S — MapScreen, SailingScreen, EventScreen, InterceptScreen, BattleScreen, PlunderScreen
├── App.jsx               ← Root component: HUD, screen router, ErrorBoundary, DebugPanel
└── tests/
    └── sim.html          ← Economy playtest simulator (loads game files via <script>)
```

---

## 4. Dependency Graph

### Current

```
data.js (D)
  └─→ logic.js (L)
        └─→ generators.js (G)
              └─→ engine_core.js (E)
                    ├─→ engine_port.js
                    ├─→ engine_voyage.js
                    └─→ engine_combat.js
                          └─→ ui.jsx (UI)
                                ├─→ screens_port.jsx (S)
                                └─→ screens_voyage.jsx (S)
                                      └─→ App.jsx
```

### Dependency direction rule — never violated

Arrows point **downward only**. A file may import from files above it in the graph but never below. `data.js` imports nothing. `App.jsx` can read anything.

The `index.html` `<script>` load order matches this graph top-to-bottom:

```html
<!-- index.html load order -->
<script src="data.js"></script>
<script src="logic.js"></script>
<script src="generators.js"></script>
<script src="engine_core.js"></script>
<script src="engine_port.js"></script>
<script src="engine_voyage.js"></script>
<script src="engine_combat.js"></script>
<script type="text/babel" src="ui.jsx"></script>
<script type="text/babel" src="screens_port.jsx"></script>
<script type="text/babel" src="screens_voyage.jsx"></script>
<script type="text/babel" src="App.jsx"></script>
```

---

## 5. File Responsibilities

### data.js → `window.D`

Pure constants. No functions, no logic, no imports. Contains: `PORTS`, `SHIPS`, `FACTIONS`, `UPGRADES`, `RESOURCES`, `GOODS_AVAILABILITY`, `CREW_FIRST_NAMES`, `CREW_LAST_NAMES`, `CREW_ROLES`, `MISSION_GOLD_RANGES`, `MISSION_ENEMY_RANGES`, `PLUNDER_TARGET`, `PLUNDER_GOLD_RATIO`, `FACTION_PLUNDER_GOODS`, `MISSION_REP_IMPACTS`, `TRADE_MISSION_PROFIT_MARGINS`, `SMUGGLE_PROFIT_MARGINS`, `TRADE_GOODS_BY_TIER`, `SMUGGLE_GOODS_BY_TIER`, `MISSION_NAME_PARTS`, `ENEMY_SHIP_NAMES`, `RANDOM_EVENTS`, `STARTS`, `ENCOUNTER_FLAVOUR`, `SURRENDER_CONSEQUENCE`.

→ See [specs_data.md](specs_data) for full schema.

### logic.js → `window.L`

Pure functions. No side-effects, no RNG. All game math: combat resolution, reputation checks, travel calculations, fame tiers, hold/provision math, encounter context building.

→ See [specs_logic.md](specs_logic) for function catalogue.

### generators.js → `window.G`

All RNG-dependent generation: mission generation (`generateMissions`), market generation (`generatePortMarket`), crew name generation (`generateCrewMember`), enemy generation, plunder cargo generation (`generateEnemyCargo`). Depends on `window.D` and `window.L`.

→ See [specs_generators.md](specs_generators) for function catalogue.

### engine_core.js → `window.E`

Sets up the reducer chain and shared infrastructure:

- `window.E.A` — action type constants (43 actions)
- `window.E.initialState` — the blank initial state object
- `window.E._reducers` — array; each domain file pushes its own reducer
- `window.E.reducer` — master reducer that chains all domain reducers
- `window.E.autoSave`, `window.E.migrateState` — save/load helpers
- `window.E.createBattleState` — battle state factory

The master reducer works by chaining:
```js
window.E.reducer = (state, action) =>
  window.E._reducers.reduce((s, r) => r(s, action), state);
```

### engine_port.js

Port domain reducer. Handles: `START_GAME`, `LOAD_GAME`, `SAVE_GAME`, `NAVIGATE`, `REPAIR`, `BUY_SHIP`, `BUY_UPGRADE`, `HIRE_CREW`, `RAISE_MORALE`, `TAKE_MISSION`, `ABANDON_MISSION`, `COMPLETE_MISSION`, `REFRESH_MISSIONS`, `SAIL_TO`, `ENTER_MARKET`, `LEAVE_MARKET`, `CONFIRM_TRADE`, and all `DEBUG_*` actions.

### engine_voyage.js

Voyage domain reducer. Handles: `ADVANCE_DAY` (the core sailing loop — consume provisions, check events, check encounters, check arrival) and `DISCOVER_PORT`.

### engine_combat.js

Combat domain reducer. Handles: `INTERCEPT_FIGHT`, `INTERCEPT_FLEE`, `INTERCEPT_SURRENDER`, `INTERCEPT_BRIBE`, `INTERCEPT_PARLEY`, `INTERCEPT_INSPECT`, `BATTLE_ACTION`, `DISMISS_BATTLE`, `TAKE_PLUNDER`, `RESOLVE_EVENT`, `ENTER_PORT`.

→ See [specs_engine.md](specs_engine) for the full action table.

### ui.jsx → `window.UI`

Pure presentational components. No game logic. Contains:

- **Theme tokens** `T` — all colors, fonts, spacing
- **Style helper** `panelStyle(overrides)`
- **Base components**: `Btn`, `Bar`, `Pill`, `StatBlock`, `SectionTitle`, `ScreenHeader`, `LogList`, `Divider`, `EmptyState`
- **Game components**: `FactionPill`, `RepPill`, `ShipSprite`

### screens_port.jsx, screens_voyage.jsx → `window.S`

All game screens. Each receives `{ state, dispatch }` props.

| File | Screens |
|---|---|
| `screens_port.jsx` | `StartScreen`, `PortScreen`, `ShipyardScreen`, `CrewScreen`, `StatusScreen`, `MarketScreen` |
| `screens_voyage.jsx` | `MapScreen`, `SailingScreen`, `EventScreen`, `InterceptScreen`, `BattleScreen`, `PlunderScreen` |

### App.jsx

Root component. Contains:

- `ErrorBoundary` — catches render errors, offers reload + load-save recovery
- `App` — initializes `useReducer(E.reducer, E.initialState)`, renders HUD + screen router
- `HUD` — sticky top bar with gold, day, crew, hull, morale, fame, infamy, provisions, hold
- `DebugPanel` — activated via `?debug=1` URL param
- Screen router — `switch(state.screen)` maps to screen components

---

## 6. Global Namespace Convention

| Namespace | Source | Contents |
|---|---|---|
| `window.D` | `data.js` | All constants: PORTS, SHIPS, FACTIONS, UPGRADES, RESOURCES, etc. |
| `window.L` | `logic.js` | All pure functions |
| `window.G` | `generators.js` | All RNG-dependent generators |
| `window.E` | `engine_core.js` + domain files | Reducer chain, actions, initial state |
| `window.UI` | `ui.jsx` | Theme tokens, presentational components |
| `window.S` | `screens_port.jsx` + `screens_voyage.jsx` | All screen components |

Common destructuring patterns at the top of files:

```js
// In engine files:
const { PORTS, SHIPS, FACTIONS, UPGRADES, RESOURCES } = window.D;
const L = window.L;
const G = window.G;

// In screen files:
const { T, panelStyle, Bar, Pill, Btn, StatBlock, SectionTitle } = window.UI;
const { FactionPill, RepPill, ShipSprite } = window.UI;
```

---

## 7. State Shape Reference

The full state shape is defined in `engine_core.js` → `window.E.initialState`. See [specs_engine.md](specs_engine) for the complete shape with types and defaults.

Key top-level fields: `screen`, `day`, `gold`, `fame`, `infamy`, `ship`, `crew`, `hold`, `reputation`, `currentPort`, `destination`, `sailingDaysLeft`, `sailingDaysTotal`, `wind`, `missions`, `activeMission`, `battleState`, `encounterContext`, `activeEvent`, `portMarket`, `log`, `discoveredPorts`, `mapFragments`.

---

## 8. Game Mechanics Implementation

This section describes how game mechanics are implemented. For detailed numbers, see the referenced spec files.

### Upgrade installation rules

Ships have an `upgradeable` array listing which upgrade keys they support (e.g. `["reinforced_hull", "extra_cannons"]`). Player upgrades are stored in `state.ship.upgrades: string[]`.

```js
// Check if upgrade is installed:
L.hasUpgrade(state, key) → state.ship.upgrades.includes(key)

// Check if upgrade is available for current ship:
SHIPS[state.ship.type].upgradeable.includes(key)

// Effective stats with upgrades applied:
L.getShipStats(state) → { cannons, speed, maxHull } with upgrade bonuses
```

Upgrade effects are defined in `D.UPGRADES[key].effects` — e.g. `{ hullBonus: 0.2 }`, `{ cannonBonus: 2 }`, `{ moraleBonus: 5 }`, `{ speedBonus: 1 }`.

When buying a new ship, all upgrades are **lost** (reset to `[]`).

### Travel and range

```js
L.travelDays(fromPort, toPort, state) → number of days
L.canReach(state, portKey) → boolean  // uses state.currentPort internally
L.getUnreachableReason(state, portKey) → string | null
```

Travel days are based on Euclidean distance between port coordinates, modified by ship speed and upgrades. `canReach` checks if the travel days ≤ the ship's `maxDays`. Some ports have a `minHull` requirement (remote ports need brigantine+ sized vessels).

Hidden ports (`port.hidden = true`) are not shown on the map until `state.discoveredPorts` includes their key. Discovery is gated by `port.unlockCondition` — checked by `L.canSeePort(state, portKey)`.

### Wind & Sailing

Wind is randomized at game start and on certain events: `{ angle: 0–360, speed: 5–25 }`. Wind primarily serves as flavour and tooltip content; it does not currently modify travel times (reserved for future implementation).

### Encounter routing — all encounters through InterceptScreen

Every hostile encounter (patrol, pirate, mission combat) goes through `L.buildEncounterContext(state, enemy, encounterType)` which produces an `encounterContext` object with:

- `enemy` — stats of the hostile ship
- `flavourText` — generated from `D.ENCOUNTER_FLAVOUR[encounterType]`
- `options[]` — array of available actions, each with `{ id, label, available, reason, action }`

The `InterceptScreen` renders these options directly — it has **no game logic**, only UI.

#### Encounter types and available options

| Encounter Type | Fight | Flee | Parley | Bribe | Surrender | Inspect | Source |
|---|---|---|---|---|---|---|---|
| `patrol` | ✅ | ✅ | ✅ | ✅ (infamy<50) | ✅ | — | Random patrol while sailing |
| `navy_patrol` | ✅ | — | — | — | — | ✅ | Faction patrol — only inspect or fight |
| `mission_combat` | ✅ | ✅ | — | — | — | — | Combat/patrol mission target |
| `escort_defend` | ✅ | ✅ | — | — | — | — | Escort mission — pirates attack convoy |
| `distressed_merchant_help` | ✅ | — | — | — | — | — | Event: chose to defend merchant |
| `distressed_merchant_plunder` | ✅ | — | — | — | — | — | Event: chose to attack merchant |
| `hostile_port_entry` | ✅ | ✅ | — | — | ✅ | — | Entering a port at war (rep < 10) |
| `random` | ✅ | ✅ | ✅ | ✅ | ✅ | — | Generic pirate encounter |

**Roadmap (not yet implemented):** `named_rival`, `bounty_target`. See [roadmap.md](roadmap).

#### Flee mechanics

Pre-battle flee (from InterceptScreen):
```
Player roll: player speed + L.roll(6)  // d6
Enemy roll:  enemy speed + L.roll(6)
Success if player roll > enemy roll
Failure → forced into battle
```

In-battle evade (from BattleScreen, action = "evade"): flat 90% success chance, ends battle with phase `"fled"`.

#### Random patrol generation

```js
L.maybeRandomPatrol(state)
  Base chance: 1% per sailing day
  + infamy / 400  (i.e. +0.25% per infamy point)
  Capped at 25%
  Formula: Math.min(0.01 + (state.infamy ?? 0) / 400, 0.25)
```

### Reputation thresholds

Port reputation (0–100) determines service access, mission reward multipliers, and repair discounts. Reputation decays slowly toward 50 over time for ports above 50.

→ See [specs_logic.md — getRepPerk()](specs_logic) for the full threshold table (At War / Hostile / Neutral / Friendly / Allied) and their gameplay effects.

### Fame system

Fame is a permanent progression score (never decreases). It gates ship purchases (`SHIPS[type].requiredFame`), upgrade availability (`UPGRADES[key].requiredFame`), mission tiers, and hidden port discovery.

→ See [specs_data.md §8](specs_data) for fame tier thresholds and labels.

### Morale system

Crew morale (0–100) affects travel speed, combat effectiveness, crew wages, and can trigger desertion/mutiny events.

→ See [specs_logic.md — getEffectiveMorale()](specs_logic) for the full morale calculation including upgrade bonuses.

### Economy system

The market uses a dynamic pricing model: each port visit generates prices based on `RESOURCES[good].basePrice × (1 ± variance)`, with availability tiers (`always`, `frequently`, `sometimes`, `rarely`, `never`) mapped per-port in `GOODS_AVAILABILITY`. Hold capacity affects ship speed when >50% full.

→ See [specs_data.md §6–7](specs_data) for resource definitions and availability matrix.

### Parametric mission generation

Missions are generated procedurally by `G.generateMissions()`. Six types: **escort, patrol, combat, trade, smuggle, assault**. Type selection is weighted by the issuing port's faction. Risk level (low/medium/high) is tier-weighted. Gold, fame, and enemy stats scale with the player's fame tier (0–4).

→ See [specs_generators.md](specs_generators) for generation logic.
→ See [specs_data.md §8](specs_data) for the gold/enemy/rep-impact tables.

### Trade & smuggling missions

**Trade missions** require the player to source cargo (buy from a market), transport it, and deliver to the target port. Profit = cargo cost × margin + mission gold reward. Margins scale by risk: low 60%, medium 80%, high 110%.

**Smuggle missions** work similarly but use illegal goods (tobacco, slaves). The smuggle intercept chance is currently hardcoded in `generators.js` → `generateSmuggleMission()`:

```js
const interceptChance = { low: 0.70, medium: 0.80, high: 0.90 }[risk] || 0.70;
```

If the player carries contraband and is intercepted by a patrol, they can refuse inspection and flee. Buying slaves incurs +1 infamy. Completing a smuggle mission incurs infamy (amount stored in `mission.infamyGain`).

### Named crew roster

Crew members are generated with `G.generateCrewMember(faction)` → `{ id, firstName, lastName, role, faction }`. Names are drawn from faction-specific pools in `D.CREW_FIRST_NAMES` / `D.CREW_LAST_NAMES`. Roles (deckhand, gunner, cook, carpenter, navigator) are weighted-random but **currently cosmetic only** — no gameplay effect per role.

### Pre-Battle intercept screen

See [Encounter routing](#encounter-routing--all-encounters-through-interceptscreen) above. The `encounterContext` object is built by `L.buildEncounterContext()` and rendered by `InterceptScreen` (in `screens_voyage.jsx`). Options are data-driven — the screen has no conditional logic.

### Combat resolution flow

Turn-based, resolved in `engine_combat.js` via `BATTLE_ACTION`.

1. Player chooses action: `broadside` | `precision` | `grapple` | `evade`
2. NPC chooses action (weighted random: 70% broadside, 25% precision, 5% grapple)
3. Damage is calculated by `L.combatRound(state, playerAction, npcAction)` → returns updated battle state
4. Phase check: hull ≤ 0 → defeat/victory. Successful evade → fled. Successful grapple → instant victory.
5. On victory with `canPlunder`: player can navigate to PlunderScreen to manually pick cargo from the defeated ship, or sail away.

### Save / load behaviour

- **Auto-save flash**: HUD shows "✓ saved" when `currentPort` or `missions.length` changes
- **Manual save**: `SAVE_GAME` action in engine_port.js → `localStorage.setItem`
- **Load**: `LOAD_GAME` action → `JSON.parse` + `migrateState()` (adds missing fields for save compatibility)
- **Error recovery**: `ErrorBoundary` in App.jsx offers "Try Load Last Save" button

### Random events

Events are defined in `D.RANDOM_EVENTS[]`. Each event has:

```js
{
  id: "storm",
  type: "hazard",      // hazard | choice | reward | crew | faction | discovery
  title: "Violent Storm!",
  desc: "A storm batters your ship...",
  condition: (state) => ...,  // optional — if present, event only fires when true
  choices: [
    {
      label: "Brace for impact",
      outcome: {
        log: "The storm rages on!",
        hullDamage: 15,
        daysLost: 2,
        crewLoss: 2,
        // Also supports: gold, fame, moraleBonus, moralePenalty, mapFragment, action
      }
    }
  ]
}
```

Events are resolved by `RESOLVE_EVENT` in `engine_combat.js`, which reads `outcome` fields and applies them to state.

---

## 9. Adding New Content — Patterns

### Add a port

1. Add entry to `PORTS` in `data.js` with `name`, `faction`, `x`, `y`, `services[]`, `desc`
2. If hidden: add `hidden: true` and `unlockCondition`
3. Add goods availability row to `GOODS_AVAILABILITY` in `data.js`
4. MapScreen reads `PORTS` directly — no screen changes needed

### Add a ship

1. Add entry to `SHIPS` in `data.js` with all stats: `name`, `maxHull`, `maxCrew`, `cannons`, `speed`, `cost`, `requiredFame`, `maxDays`, `holdCapacity`, `upgradeable[]`, `desc`
2. ShipyardScreen iterates `SHIPS` automatically — no screen changes needed
3. Ensure the `upgradeable` array only references keys that exist in `UPGRADES`

### Add an upgrade

1. Add entry to `UPGRADES` in `data.js` with `name`, `desc`, `cost`, `effects`, and optionally `requiredFame`
2. Add the upgrade key to the `upgradeable` arrays of ships that should support it
3. If the upgrade introduces a **new effect key** (not `hullBonus`, `cannonBonus`, `moraleBonus`, `speedBonus`): update `L.getShipStats()` in `logic.js` to apply it

### Add a random event

1. Add entry to `RANDOM_EVENTS[]` in `data.js` following the `{ id, type, title, desc, choices[] }` pattern
2. Each choice needs an `outcome` object with the effects to apply
3. If the outcome includes a new field not handled by `RESOLVE_EVENT`: update `engine_combat.js`
4. Optional: add a `condition: (state) => boolean` to restrict when the event can fire

### Add a mission type

1. Add generator function in `generators.js` (follow `generateCombatMission` pattern)
2. Add to the type-selection weights in `G.generateMissions()`
3. Add completion logic in `engine_port.js` → `COMPLETE_MISSION` case
4. Add gold/rep tables to `data.js` if the type has unique reward scaling

### Tuning the economy

All balance numbers are in `data.js`:

- Ship costs → `SHIPS[key].cost`
- Mission rewards → `MISSION_GOLD_RANGES`
- Trade profits → `TRADE_MISSION_PROFIT_MARGINS`
- Smuggle profits → `SMUGGLE_PROFIT_MARGINS`
- Resource prices → `RESOURCES[key].basePrice`
- Plunder value → `PLUNDER_TARGET`, `PLUNDER_GOLD_RATIO`

Use `tests/sim.html` to run Monte Carlo simulations after changing values.

### Add a screen

1. Create the component in the appropriate screen file (port-related → `screens_port.jsx`, voyage-related → `screens_voyage.jsx`)
2. Add to `window.S` in the `Object.assign` at the bottom of that file
3. Add `case "screenname":` to the router in `App.jsx` → `renderScreen()`
4. If the screen needs a new action: add to `window.E.A` and the relevant domain reducer

### Add an action

1. Add the action name to `window.E.A` in `engine_core.js`
2. Add the `case A.YOUR_ACTION:` to the appropriate domain reducer (`engine_port.js`, `engine_voyage.js`, or `engine_combat.js`)
3. Return a new state object (spread-copy, never mutate)

---

## 10. Testing Infrastructure

### Economy simulation

`tests/sim.html` — a self-contained HTML page that loads the actual game files via `<script>` tags and runs Monte Carlo economy simulations. No Python or build tools required — works on Live Server or GitHub Pages.

- Reads `window.D`, `window.L`, `window.G` directly from game source files
- Simulates 6 strategies × configurable runs
- Outputs fame-indexed charts and tables
- Re-run after any balance change to see impact

### Unit tests

Not yet implemented. The pure-function design of `logic.js` and `generators.js` makes them ideal candidates for unit testing. Recommended: add a `tests/` folder with test HTML files that load source files and run assertions.

---

## 11. Constraints for AI Agents

### Before editing any file

1. Read the **dependency graph** in §4. Never import downward.
2. Check which `window.*` namespace the file belongs to.
3. Search for every reference to the function/constant you're changing — use `window.L.`, `window.E.A.`, etc.
4. If adding a new export, add it to the `return` block (for IIFEs) or `Object.assign` (for screen files).

### Things that cause a blank screen with no error message

- Syntax error in any `.js` file (breaks the `<script>` load chain)
- Missing comma in `data.js` object literals
- Referencing `window.L` before `logic.js` has loaded
- Babel parse error in `.jsx` files (unclosed tags, mismatched braces)

### Things that break silently (no crash, wrong behaviour)

- Mutating `state` instead of spreading: `state.gold -= 100` ← WRONG
- Forgetting to add a new action to `window.E.A` (dispatch does nothing)
- Adding an upgrade key to `SHIPS[type].upgradeable` that doesn't exist in `UPGRADES`
- Referencing `state.crew.current` (doesn't exist) instead of `state.crew.roster.length`
- Referencing `state.hold.capacity` directly instead of `L.getHoldCapacity(state)`

### Always do

- Spread-copy: `return { ...state, gold: state.gold + 100 }`
- Nested spread: `ship: { ...state.ship, hull: newHull }`
- Add log entries: `log: [...state.log, "message"]`
- Gate purchases: check `gold >= cost` AND `fame >= requiredFame` AND ship supports it
- Test in debug mode (`?debug=1`) after changes
- Run `tests/sim.html` after any balance change

### File size limit

Keep each file under 1500 lines. If a file approaches this limit, split by domain (as was done with `engine.js` → 4 files).
