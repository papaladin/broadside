# Broadside — Architecture Documentation

# Broadside — Architecture Documentation

> This document covers **code structure, design constraints, and current
> implementation**. It does not cover the feature roadmap or future plans — those
> live in `roadmap.md`. It does not cover how to run the game or tests — that lives
> in `README.md`.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Tech Stack and Constraints](#2-tech-stack-and-constraints)
3. [File Structure](#3-file-structure)
4. [Dependency Graph](#4-dependency-graph)
5. [File Responsibilities](#5-file-responsibilities)
6. [Global Namespace Convention](#6-global-namespace-convention)
7. [State Shape Reference](#7-state-shape-reference)
8. [Action Reference](#8-action-reference)
9. [Game Mechanics Implementation](#9-game-mechanics-implementation)
10. [Adding New Content — Patterns](#10-adding-new-content--patterns)
11. [Testing Infrastructure](#11-testing-infrastructure)
12. [Constraints for AI Agents](#12-constraints-for-ai-agents)

---

## 1. Design Principles

These principles govern every implementation decision. When in doubt about how to
build something, refer back to these.

### Separation of concerns — the core rule

**Data files never contain logic. Logic files never contain UI. UI files never
contain business logic.**

```
data.js     → what things are (constants, definitions, pools)
logic.js    → how things work (pure functions, calculations)
engine.js   → what happens (state transitions, action handlers)
ui.jsx      → how things look (React primitives, theme tokens)
screens.jsx → what the player sees (composed from the above)
App.jsx     → how it fits together (router, HUD, root render)
```

If you find yourself writing a calculation inside a screen component, it belongs in
`logic.js`. If you find yourself importing a screen inside `logic.js`, something is
wrong.

### Pure functions in logic.js

Every function in `logic.js` must be:
- **Deterministic:** same input always produces same output
- **Side-effect free:** no DOM access, no state mutation, no `console.log`
- **Independently testable:** callable with a plain JS object, no React context needed

The test suite (`tests.js`) calls logic functions directly. If a logic function
cannot be tested without setting up React, it is not pure.

### Immutable state

The reducer never mutates state directly. Every action returns a new object:

```js
// Wrong
case A.HIRE_CREW:
  state.crew.current += action.count;  // mutation — never do this
  return state;

// Correct
case A.HIRE_CREW:
  return {
    ...state,
    crew: { ...state.crew, current: state.crew.current + action.count }
  };
```

This applies at every nesting level. Spread every object you modify.

### Single source of truth

All game state lives in the single `state` object managed by `useReducer` in
`App.jsx`. No component has its own game state with `useState` (UI-only state
like hover effects is the only exception). No global variables store game state
outside the reducer.

### Files that change together live together

Files are split by **change frequency and responsibility**, not by line count alone:

- `data.js` changes when new ports, ships, or factions are added — rarely
- `logic.js` changes when a mechanic is fixed or tuned — occasionally
- `engine.js` changes when a new action or state field is added — occasionally
- `screens.jsx` changes when UI is updated — frequently

Do not move a function from one file to another just because a file feels long.
Move it when its change frequency aligns better with a different file.

---

## 2. Tech Stack and Constraints

### Stack

| Layer | Technology | Why |
|---|---|---|
| UI framework | React 18 (UMD build) | Component model, `useReducer` state management |
| Transpilation | Babel standalone | In-browser JSX compilation, no build step |
| Styling | Inline CSS via `T` token object | No stylesheet dependencies, theme in one place |
| Persistence | `localStorage` via `logic.js` | Simple, no server required |
| Testing | Browser-native harness | No npm, no Jest, runs in any browser |
| Hosting | GitHub Pages (static) | No server, no build pipeline |

### Hard constraints

These are not preferences — they are constraints the whole architecture depends on.

**No build step.** The game must run via a local server (VSCode Live Server,
`python3 -m http.server`) or GitHub Pages with no compilation step. Babel compiles
JSX in the browser on first load. This means:

- No ES module `import`/`export` syntax — use the window global pattern instead
- No npm packages — only CDN-loaded libraries (React, ReactDOM, Babel)
- No TypeScript

**No `file://` protocol.** Babel standalone uses XHR to fetch script sources.
XHR is blocked on `file://` by browser CORS policy. Always use a local server.

**No localStorage in screen components.** All persistence goes through
`L.saveGame()` and `L.loadGame()` called from the reducer. Screen components
read state only.

**File length limit: ~1000 lines.** Files longer than this cause AI agents to
lose context and make incorrect edits. When a file approaches this limit, split
it. Planned splits are documented in Section 3.

### Save key

The localStorage save key is `"piratesSave"` (camelCase). This is the canonical
key used by both `logic.js` and `engine.js`. Do not introduce a second key.

---

## 3. File Structure

### Current structure

```
broadside/
broadside/
├── index.html              Entry point. Loads dependencies and game files in order.
├── data.js                 All game constants. Exposes window.D
├── logic.js                All pure game functions. Exposes window.L
├── generators.js           All runtime content generators. Exposes window.G
├── engine.js               State shape, reducer, action constants. Exposes window.E
├── ui.jsx                  React primitives and theme tokens. Exposes window.UI
├── screens_shared.jsx      Shared micro‑components (FactionPill, RepPill, ShipSprite)
├── screens_port.jsx        Port‑zone screens (Start, Port, Shipyard, Crew, Status, Market)
├── screens_voyage.jsx      Voyage‑zone screens (Map, Sailing, Event, Intercept, Battle)
├── App.jsx                 Root component, HUD, screen router. Renders to #root
├── architecture.md         This document
├── README.md               Setup and running instructions
└── tests/
    ├── tests.html          Test runner UI
    ├── tests_helpers.js    Shared helpers (fillRoster, makeState, testMission)
    ├── tests_logic.js      Unit tests (logic.js + generators.js)
    ├── tests_engine.js     Reducer tests
    ├── tests_flows.js      Integration + Scenario tests
    └── tests_ui.js         UI smoke + Edge case tests
```


`index.html` load order becomes:
```html
<script type="text/babel" src="screens_port.jsx"></script>
<script type="text/babel" src="screens_voyage.jsx"></script>
<script type="text/babel" src="screens_action.jsx"></script>
```


---


### generators.js — `window.G`

Created at the P1.6 boundary. Contains all `Math.random`‑using content generators:
crew creation, mission generation, enemy building, and supporting helpers.
Reads `window.D` and `window.L`. Exposes `window.G`.

---

## 4. Dependency Graph

### Current

```
index.html
  ├── data.js              (window.D)  ← no dependencies
  ├── logic.js             (window.L)  ← reads D
  ├── generators.js        (window.G)  ← reads D, L
  ├── engine.js            (window.E)  ← reads D, L, G
  ├── ui.jsx               (window.UI) ← no game dependencies
  ├── screens_shared.jsx   (window.S)  ← reads D, UI
  ├── screens_port.jsx     (window.S)  ← reads D, L, G, E, UI, S (extends)
  ├── screens_voyage.jsx   (window.S)  ← reads D, L, G, E, UI, S (extends)
  └── App.jsx                          ← reads D, L, G, E, UI, S

tests/tests.html    ← loads all game files above, then test files
```

### Dependency direction rule — never violated

```
data → logic → engine → screens → App
```

A file may only read from files that appear to its left in this chain.
`logic.js` cannot read from `engine.js`. `data.js` cannot read from anything.

### After planned splits

```
data.js         (window.D)   ← no deps
data_content.js (window.C)   ← no deps
logic.js        (window.L)   ← reads D
generators.js   (window.G)   ← reads D, C
engine.js       (window.E)   ← reads D, L, G
ui.jsx          (window.UI)  ← no game deps
screens_*.jsx   (window.S)   ← reads D, C, L, G, E, UI
App.jsx                      ← reads all
```

---

## 5. File Responsibilities

### data.js → `window.D`

**Contains:** Pure JS objects and arrays. No functions, no imports, no logic.

**Exception:** `RANDOM_EVENTS` entries include `apply: (state) => ({...})` functions
inline. This is a pragmatic exception to keep event definitions self-contained.
Event effect functions must not call other `L.*` functions — they return plain
partial state objects only.

**Current exports:**

| Export | Description |
|---|---|
| Export | Description |
|---|---|
| `PORTS` | Port definitions: name, faction, coordinates, services, description |
| `SHIPS` | Ship stats: maxHull, maxCrew, cannons, speed, cost, upgradeable, requiredFame |
| `FACTIONS` | Faction labels and colours: english, spanish, french, dutch, pirate |
| `UPGRADES` | Ship upgrades: name, cost, desc, effects object, requiredFame |
| `RANDOM_EVENTS` | Event pool: id, type, title, desc, condition, choices with outcomes |
| `STARTS` | Starting scenarios: name, desc, bonuses array |
| `FACTION_RELATIONS` | Inter-faction stance matrix (currently unused) |
| `ENCOUNTER_FLAVOUR` | Functions returning flavour text per encounter type |
| `SURRENDER_CONSEQUENCE` | Consequence objects per encounter type |
| `CREW_FIRST_NAMES` | First name pools per faction |
| `CREW_LAST_NAMES` | Last name pools per faction |
| `CREW_ROLES` | Role definitions with weights |
| `RESOURCES` | Goods definitions: name, basePrice, variance, illegal, infamyOnBuy, unit |
| `GOODS_AVAILABILITY` | Per‑port tier table controlling market appearance and quantity |
| `MISSION_GOLD_RANGES` | Gold reward ranges by fame tier and risk level |
| `MISSION_ENEMY_RANGES` | Enemy stat ranges (hull, cannons, crew) by fame tier |
| `MISSION_REP_IMPACTS` | Reputation impact values per mission type and risk |
| `MISSION_NAME_PARTS` | Word pools for generating mission names and descriptions |
| `ENEMY_SHIP_NAMES` | Adjective/noun pools for enemy ship names |

**Port service keys** used in `port.services[]`:

| Key | Meaning |
|---|---|
| `"tavern"` | Rumors, morale recovery, specialist hire (future) |
| `"shipyard"` | Buy ships, install equipment, repair |
| `"crew"` | Hire crew members |
| `"missions"` | Mission board |

---

### logic.js → `window.L`

**Contains:** Pure functions only. No React, no DOM, no side effects.

**Every function here must be callable in a test with a plain JS object.**

**Current exports:**

| Function | Signature | Description |
|---|---|---|
| `travelDays` | `(fromKey, toKey, state)` | Travel days accounting for speed, wind, morale |
| `getShipStats` | `(state)` | Effective ship stats with all upgrade effects applied |
| `getEffectiveMorale` | `(state)` | Morale with figurehead bonus applied, capped at 100 |
| `hasUpgrade` | `(state, key)` | Boolean — upgrade key is installed |
| `getFameLabel` | `(fame)` | Returns tier label (Unknown → Immortal) |
| `getFameTier` | `(fame)` | Returns numeric tier 0‑4 for fame value |
| `meetsRequirement` | `(state, item)` | Returns `{ allowed, reason }` for fame-gated items |
| `getRepPerk` | `(rep)` | Returns `{ tier, repairMult, missionMult, servicesBlocked }` |
| `getInfamyLabel` | `(infamy)` | Returns label (Clean → Legendary Outlaw) |
| `getHoldUsed` | `(holdItems)` | Total cargo units |
| `getHoldLoadPct` | `(holdItems, capacity)` | Load fraction 0–1 |
| `getHoldSpeedMultiplier` | `(loadPct)` | Travel time multiplier (1.0, 1.11, 1.33) |
| `getProvisionConsumptionPerDay` | `(state)` | `{ food, water }` per day |
| `getDaysOfProvisions` | `(holdItems, consumptionPerDay)` | `{ food, water }` days remaining |
| `applyLoseCargoPercent` | `(holdItems, percent)` | Reduced hold items after loss |
| `applyLoseContraband` | `(holdItems)` | Hold with illegal goods removed |
| `canBribe` | `(state)` | Boolean — infamy < 50 |
| `buildEncounterContext` | `(state, type, enemy)` | Builds context object for InterceptScreen |
| `triggerRandomEvent` | `(state)` | Selects event from pool filtered by conditions |
| `shipRepairCost` | `(state)` | Gold cost to fully repair |
| `reputationLabel` | `(rep)` | String label for a reputation value |
| `payCrewWages` | `(state)` | Daily wage amount |
| `applyReputationImpact` | `(state, impact)` | Updated reputation object |
| `decayReputation` | `(state)` | Reputation after daily decay (only above 50) |
| `updateReputation` | `(state, portKey, delta)` | Single port update, clamped 0‑100 |
| `resolveCombatAction` | `(state, action)` | Returns `{ player, enemy, moraleDelta, goldReward, fled, instantVictory }` |
| `getNPCAction` | `(enemy)` | NPC's chosen combat action (weighted random, no evade) |
| `removeRandomCrew` | `(roster, count)` | Removes random members, returns `{ newRoster, removed }` |
| `roll` | `(sides)` | Random integer 1–sides |
| `saveGame` | `(state)` | Serialise to localStorage |
| `loadGame` | `()` | Deserialise from localStorage, returns state or null |
| `hasSave` | `()` | Boolean |

**Critical:** `getShipStats(state)` is the central stat aggregator. All combat,
travel, capacity, and UI code must call this rather than reading
`SHIPS[state.ship.type]` directly. Equipment effects are invisible to anything
that bypasses this function.

**Critical:** `travelDays(fromKey, toKey, state)` must receive `state` to apply
speed bonuses from equipment and future cargo load penalties. The base distance
uses port SVG coordinates internally — callers treat the return value as days only.

---

### generators.js → `window.G`

**Contains:** All functions that use `Math.random` to produce runtime content.
No pure game logic — that lives in `logic.js`.

**Current exports:**

| Function | Signature | Description |
|---|---|---|
| `generateCrewMember` | `(faction, existingNames)` | Creates a named crew member |
| `generateRoster` | `(count, faction)` | Creates a full roster |
| `generateMissions` | `(portKey, state)` | Returns 2‑3 parametric mission objects |
| `generateEnemy` | `(risk, fame, faction)` | Builds enemy object from scaling ranges |
| `generateEnemyForAssault` | `(targetPortKey, fame)` | Builds assault enemy from port's faction |
| `generateEnemyName` | `(faction)` | Returns "The Black Serpent" style name |
| `generateGold` | `(type, risk, fame)` | Gold reward, rounded to nearest 25 |
| `generateRepImpact` | `(type, faction, risk, defendingFaction)` | Returns rep‑impact object |
| `generateMissionText` | `(type, faction, targetPortKey, risk, enemy)` | Returns `{ name, desc }` |
| `pickTargetPort` | `(currentPortKey, type, state, faction)` | Picks a valid destination port |
| `opposingFaction` | `(factionKey)` | Returns a random rival faction |
| `generatePortMarket` | `(portKey)` | Generates `{ portKey, goods: { … } }` for a port visit |


---

### engine.js → `window.E`

**Contains:** `initialState`, `reducer`, and the `A` action constants object.

**The reducer is the only place state changes.** It calls logic functions but
never contains calculation logic itself. If a reducer case grows long, extract
the calculation to `logic.js` first.

**Exports:** `window.E = { A, initialState, reducer }`

**`addLog` helper** — used by every action producing a captain's log entry:

```js
function addLog(state, entry) {
  return { ...state, log: [entry, ...state.log].slice(0, 30) };
}
```

Always call it last, wrapping the final state object.

**Action categories:**

| Category | Actions |
|---|---|
| Navigation | `NAVIGATE`, `SAIL_TO`, `ENTER_PORT`, `ADVANCE_DAY` |
| Game lifecycle | `START_GAME`, `SAVE_GAME`, `LOAD_GAME` |
| Intercept | `INTERCEPT_FIGHT`, `INTERCEPT_FLEE`, `INTERCEPT_PARLEY`, `INTERCEPT_BRIBE`, `INTERCEPT_SURRENDER` |
| Port | `REPAIR`, `BUY_SHIP`, `BUY_UPGRADE`, `HIRE_CREW`, `RAISE_MORALE` |
| Missions | `TAKE_MISSION`, `COMPLETE_MISSION`, `ABANDON_MISSION`, `REFRESH_MISSIONS` |
| Combat | `BATTLE_ACTION`, `DISMISS_BATTLE` |
| Events | `RESOLVE_EVENT` |

---

### ui.jsx → `window.UI`

**Contains:** React components with zero knowledge of game state. They receive
only primitive props (strings, numbers, booleans, callbacks). They never call
`dispatch` directly or read from `window.E` or `window.D`.

**Exports:** `{ T, panelStyle, Btn, Bar, Pill, StatBlock, SectionTitle,
ScreenHeader, LogList, Divider, EmptyState }`

**Theme tokens `T`** — all colours and font values live here. Never hardcode
a colour in a screen component.

Key tokens:

```js
T.bg          // #0a141e  — page background
T.panel       // #121c28  — card/panel background
T.border      // #2a3a4a  — default border
T.gold        // #ffd700  — primary accent, headings, important values
T.text        // #e0e0e0  — primary text
T.textDim     // #a0a0a0  — secondary text, labels
T.textFaint   // #606060  — placeholder, disabled text
T.greenBr     // #4caf50  — success, positive values
T.redBr       // #f44336  — danger, negative values
T.riskColor   // { low, medium, high } — mission risk pill colours
T.font        // 'Courier New', monospace
```

**`Btn` variants** (`v` prop):

| Value | Use case |
|---|---|
| `"default"` | Standard secondary action |
| `"gold"` | Primary / confirm action |
| `"ghost"` | Back / cancel action |
| `"green"` | Positive action: hire, accept, confirm |
| `"red"` | Destructive action: attack, abandon |

**`panelStyle(overrides)`** — returns base style object for panel containers.
Pass overrides for border colour, background, or padding adjustments.

---

### screens.jsx → `window.S`

**Contains:** All game screen components. Each receives `{ state, dispatch }`.
Screens compose `window.UI` primitives and read from `window.D`, `window.L`,
`window.E` as needed.

**No business logic in screens.** If a screen calculates something, that
calculation belongs in `logic.js`. Screens read and render; they do not decide.

**Current screens:**

| Screen           | `state.screen` value | Description |
|------------------|----------------------|-------------|
| StartScreen      | `"start"`            | Scenario selection, load game |
| PortScreen       | `"port"`             | Main hub: mission board, log, ship status, services, market button |
| MapScreen        | `"map"`              | Interactive SVG world map, click to sail |
| SailingScreen    | `"sailing"`          | Day-advance, voyage progress, provisions, log |
| InterceptScreen  | `"intercept"`        | Pre-combat encounter: fight, flee, parley, bribe, surrender |
| BattleScreen     | `"battle"`           | Turn-based naval combat with battle log |
| ShipyardScreen   | `"shipyard"`         | Buy ships/upgrades, repair (fame-gated, reputation-discounted) |
| CrewScreen       | `"crew"`             | Named crew manifest, hire, buy drinks for morale |
| StatusScreen     | `"status"`           | Captain's Standing (fame/infamy), faction relations, reputation per port with perk info |
| EventScreen      | `"event"`            | Random event resolution with choices |
| MarketScreen     | `"market"`           | Buy/sell provisions and trade goods; shows hold, prices, and cargo penalty |

**Export pattern:**

```js
// Single file
window.S = { StartScreen, PortScreen, /* ... all screens */ };

// After split — each file extends the object
// screens_voyage.jsx:
Object.assign(window.S, { MapScreen, SailingScreen, InterceptScreen, EventScreen });
```

---

### App.jsx

**Contains:** Root React component. Owns `useReducer`. Renders HUD and routes
to the correct screen. Mounts to `#root`.

**HUD** is defined inline inside `App` (not exported to `window.S`). It is
always visible except on `"start"` screen. It reads `state` from the closure.

**Screen router** maps `state.screen` to the corresponding `window.S` component.
Every screen in `window.S` must have a corresponding case in the router.

**Mounting:**
```jsx
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
```

---

### index.html

**Load order — must not change without updating this document:**

```html
<!-- CDN — must precede all game files -->
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

<!-- Game files — strict dependency order -->
<script type="text/babel" data-presets="react" src="data.js"></script>
<script type="text/babel" data-presets="react" src="logic.js"></script>
<script type="text/babel" data-presets="react" src="engine.js"></script>
<script type="text/babel" data-presets="react" src="ui.jsx"></script>
<script type="text/babel" data-presets="react" src="screens.jsx"></script>
<script type="text/babel" data-presets="react" src="App.jsx"></script>
```

When new files are added, update this file and update Section 3 and Section 4
of this document in the same session.

---

## 6. Global Namespace Convention

No ES module imports exist. Files communicate through `window` globals.

| Global | File | Contents |
|---|---|---|
| `window.D` | `data.js` | Game constants |
| `window.C` | `data_content.js` | Content pools (after split) |
| `window.L` | `logic.js` | Pure functions |
| `window.G` | `generators.js` | Generation functions |
| `window.E` | `engine.js` | `{ A, initialState, reducer }` |
| `window.UI` | `ui.jsx` | `{ T, panelStyle, Btn, Bar, ... }` |
| `window.S` | `screens.jsx` | `{ StartScreen, PortScreen, ... }` |

**Destructuring pattern** — destructure at the top of every IIFE or component:

```js
// In logic.js (top of IIFE)
const { PORTS, SHIPS, EQUIPMENT, FACTION_RELATIONS } = window.D;

// In a screen component (top of function body)
const { T, Btn, Bar, panelStyle } = window.UI;
const { PORTS, SHIPS }            = window.D;
const { A }                       = window.E;
```

This makes dependencies explicit and text-searchable.

---

## 7. State Shape Reference

Authoritative state shape. Update this section when adding new fields.

```js
{
  // ── Game lifecycle ──────────────────────────────────────────────
  screen:       "start",
  day:          1,
  gold:         1000,
  fame:         0,          // permanent progression, never decays
  infamy:       0,          // permanent outlaw track, never decays

  // ── Ship ────────────────────────────────────────────────────────
  ship: {
    type:       "sloop",
    hull:       100,
    cannons:    10,
    name:       "Sea Dog",
    upgrades:   [],         // array of UPGRADES keys
  },

  // ── Crew (named roster) ─────────────────────────────────────────
  crew: {
    roster:     [{ id, firstName, lastName, role, faction, daysAboard }],
    max:        50,
    morale:     80,         // 0–100
  },

    // ── Cargo & Economy ───────────────────────────────────────────────
  hold: {
    capacity: 200,      // from SHIPS[type].holdCapacity
    items: {
      food: 10, water: 10,
      rum: 0, sugar: 0, timber: 0, cloth: 0, spices: 0, silk: 0,
      coffee: 0, cocoa: 0, weapons: 0, tobacco: 0, silver: 0, slaves: 0,
    },
  },
  portMarket: null,     // generated on ENTER_PORT; { portKey, goods: { [good]: { basePrice, buyFromPort, sellToPort, available } } }

  // ── Navigation ──────────────────────────────────────────────────
  currentPort:      "portRoyal",
  previousPort:     null,       // set on SAIL_TO, used for defeat return
  destination:      null,
  sailingDaysLeft:  0,
  sailingDaysTotal: 0,
  wind:             { angle: 45, speed: 10 },

  // ── Reputation ──────────────────────────────────────────────────
  reputation: { /* portKey: 0–100 for all ports */ },

  // ── Missions ────────────────────────────────────────────────────
  missions:         [],
  activeMission:    null,

  // ── Combat ──────────────────────────────────────────────────────
  battleState:      null,   // { phase, playerHull, enemyHull, playerCrew, enemyCrew,
                            //   enemy, round, log, returnScreen, goldReward,
                            //   initialCrewCount, lostCrewNames }
  encounterContext: null,   // { type, enemy, flavourText, options: { flee, parley, bribe, surrender, fight } }

  // ── Events ──────────────────────────────────────────────────────
  activeEvent:      null,

  // ── Captain's log ───────────────────────────────────────────────
  log:              [],
}
```

### battleState shape

```js
battleState: {
  enemy: {
    name:     "Spanish Warship",
    faction:  "spanish",
    ship:     "frigate",        // key into SHIPS
    hull:     280,
    maxHull:  280,
    cannons:  32,
    crew:     120,
    gold:     1800,             // reward on victory
    fame:     24,               // fame reward on victory
  },
  playerHull:   100,            // tracks independently from state.ship.hull
  enemyHull:    280,
  goldReward:   0,              // set when enemy is defeated, displayed in BattleScreen
  crewLost:     0,              // accumulated this battle
  round:        1,
  phase:        "player_turn",  // "player_turn"|"victory"|"defeat"|"fled"
  log:          [],             // battle event strings, oldest first
  returnScreen: "sailing",      // screen to return to after battle dismissal
}
```

### encounterContext shape

```js
encounterContext: {
  type:        "patrol",        // key into ENCOUNTER_FLAVOUR
  enemy:       { /* same shape as battleState.enemy */ },
  flavourText: "A Spanish patrol vessel hails you.",
  options: {
    flee:      { available: true,  reason: null,
                 speedCheck: { player: 7, enemy: 5 } },
    parley:    { available: false,
                 reason: "Reputation too low (18 — need 30)", repRequired: 30 },
    bribe:     { available: true,  reason: null, cost: 420 },
    surrender: { available: true,  reason: null,
                 consequence: { loseCargoPercent: 30, moralePenalty: 10 } },
    fight:     { available: true,  reason: null },
  },
}
```

---

## 8. Action Reference

Always use `A.ACTION_NAME` constants — never dispatch string literals directly.

```js
dispatch({ type: A.SAIL_TO, port: "havana" });  // correct
dispatch({ type: "SAIL_TO", port: "havana" });  // never do this
```

### Payload reference

| Action | Required payload fields |
|---|---|
| `NAVIGATE` | `screen` |
| `SAIL_TO` | `port` |
| `ENTER_PORT` | — |
| `ADVANCE_DAY` | — |
| `START_GAME` | `scenarioKey` |
| `SAVE_GAME` | — |
| `LOAD_GAME` | — |
| `INTERCEPT_FIGHT` | — |
| `INTERCEPT_FLEE` | — |
| `INTERCEPT_PARLEY` | — |
| `INTERCEPT_BRIBE` | — |
| `INTERCEPT_SURRENDER` | — |
| `REPAIR` | — |
| `BUY_SHIP` | `shipType` |
| `BUY_EQUIPMENT` | `equipmentKey` |
| `REMOVE_EQUIPMENT` | `equipmentKey` |
| `HIRE_CREW` | `count` |
| `TAKE_MISSION` | `mission` (full mission object — no ID field) |
| `COMPLETE_MISSION` | — |
| `ABANDON_MISSION` | — |
| `REFRESH_MISSIONS` | — |
| `BATTLE_ACTION` | `action`: `"broadside"` \| `"precision"` \| `"grapple"` \| `"evade"` |
| `DISMISS_BATTLE` | — |
| `RESOLVE_EVENT` | `choiceIndex` (number, or null for non-choice events) |
| `RAISE_MORALE` | — |
| `INTERCEPT_FIGHT` | — |
| `INTERCEPT_FLEE` | — |
| `INTERCEPT_PARLEY` | — |
| `INTERCEPT_BRIBE` | — |
| `INTERCEPT_SURRENDER` | — |
| `CONFIRM_TRADE` | `buys` object, `sells` object |
| `ENTER_MARKET` | — |
| `LEAVE_MARKET` | — |

---

## 9. Game Mechanics Implementation

### getShipStats — the central aggregator

```js
function getShipStats(state) {
  const base = { ...SHIPS[state.ship.type] };
  for (const key of (state.ship.equipment ?? [])) {
    const eq = EQUIPMENT[key];
    if (!eq) continue;
    for (const [stat, delta] of Object.entries(eq.effect)) {
      base[stat] = (base[stat] ?? 0) + delta;
    }
  }
  return base;
}
```

All code that reads ship stats must call this. Never read `SHIPS[state.ship.type]`
directly in game logic — equipment effects would be invisible.

### Equipment installation rules

Enforced in the `BUY_EQUIPMENT` reducer case before any state change:

1. `!state.ship.equipment.includes(equipmentKey)` — no duplicates
2. `state.ship.equipment.length < getShipStats(state).upgradeSlots` — slot limit

No category-level restrictions. Balance comes from upgrade values, not slot
categories. When buying a new ship, equipment transfers; if the new ship has
fewer slots, the player chooses which items to keep before purchase confirms.

### Travel and range

### Travel and range

`travelDays(fromKey, toKey, state)` computes effective days using port SVG
coordinates for distance, divided by effective speed from `getShipStats(state)`.
A cargo‑load multiplier is then applied: <50% → ×1.00, 50‑75% → ×1.11, ≥75% → ×1.33.
The final value is rounded, minimum 1 day.

`canReach(state, fromKey, toKey)` compares `travelDays` result against
`getShipStats(state).maxDaysAtSea`. Used by MapScreen to grey out unreachable
ports. Mid-voyage events that extend travel are never blocking — consequences
come from provision consumption and wage costs for the extra days.

### Wind & Sailing

- Wind shifts daily at sea: angle drifts ±15°, speed drifts ±2.5 kt (clamped 1‑20).
- Wind affects travel days: favourable wind reduces days, opposing wind increases them.
- The wind rose on MapScreen and SailingScreen shows current wind direction and speed.


### Encounter routing — all encounters through InterceptScreen

No encounter ever goes directly to `BattleScreen`. Every trigger point builds
an `encounterContext` via `L.buildEncounterContext(state, type, enemy)` and
sets `screen: "intercept"`. `InterceptScreen` either resolves the encounter
(flee, parley, bribe, surrender) or dispatches `INTERCEPT_FIGHT`, which then
builds `battleState` and transitions to `BattleScreen`.

Encounter types and the options they enable/disable:

| Type | Flee | Parley | Bribe | Surrender |
|---|---|---|---|---|
| `"patrol"` | ✅ speed check | ✅ rep ≥ 30 | ✅ | ✅ |
| `"hostile_port_entry"` | ❌ | ❌ | ❌ | ✅ |
| `"smuggling_caught"` | ✅ | ❌ | ✅ pay fine | ✅ lose cargo |
| `"mission_combat"` | ❌ | ❌ | ❌ | ❌ |
| `"named_rival"` | ✅ speed check | ✅ if history | ❌ | ✅ |
| `"bounty_target"` | ❌ | ❌ | ❌ | ❌ |

Fight is always available in all types.

### Reputation thresholds

| Range | Label | Repair multiplier | Mission gold multiplier | Services |
|---|---|---|---|---|
| < 10 | At War | 1.00 | ×0 | Blocked entirely |
| 10–29 | Hostile | 1.00 | ×0.75 | Available |
| 30–49 | Neutral | 1.00 | ×0.90 | Available |
| 50–69 | Friendly | 0.90 | ×1.10 | Available |
| ≥ 80 | Allied | 0.80 | ×1.20 | Available |

`L.reputationLabel(rep)` returns the label string. Threshold checks happen in
the reducer (port entry) and screen components (service access, mission filtering).

### Fame System (New)

- **Earning**: Fame is awarded on mission completion. Most missions give **1 fame**; high‑risk missions give **2–3**.
- **Decay**: Never.
- **Tiers**:  
  | Fame | Label |  
  |------|-------|  
  | 0–49 | Unknown |  
  | 50–99 | Recognised |  
  | 100–199 | Notorious |  
  | 200–349 | Legendary |  
  | 350+ | Immortal |
- **Gating**: Ships, upgrades, and missions can have a `requiredFame` field.
  Ships/upgrades are greyed‑out in the shipyard; missions are hidden from the board.
  The reducer also guards `BUY_SHIP`, `BUY_UPGRADE`, and `TAKE_MISSION` with
  `L.meetsRequirement`.


### Morale System

- **Initial**: 80.
- **Daily decay**: -1 only when morale is already below 30.
- **Combat outcomes**:  
  - Victory by sinking: **+10**  
  - Victory by grapple: **+5**  
  - Flee: **-5**  
  - Grapple failure: **-10**  
- **Events**: Certain choices (e.g., whale sighting "Leave them be") give morale bonuses.
- **Recovery**: "Buy Drinks" button on CrewScreen costs `crew.roster.length * 5` gold for +5 morale (capped at 100).
- **Effective morale**: `crew.morale + ship.moraleBonus` (from figurehead upgrade), displayed in HUD. Affects combat damage and crew wages.

### Economy System

**Hold:** All cargo shares a single hold with capacity `SHIPS[type].holdCapacity`.
Food and water are provision types; all other goods are trade goods.

**Provision consumption:** Each day at sea, `Math.ceil(crew.roster.length / 10)`
units of food and water are deducted. When either reaches zero, a morale penalty
of −1 is applied (max once per day from provision/wages crisis).

**Port market:** On entering a port, `G.generatePortMarket(portKey)` builds a
fresh market. Each good has a chance to appear based on the port's tier in
`GOODS_AVAILABILITY` (always / frequently / sometimes / rarely / never). Prices
are rolled around the base price with the good's variance. The player sees
base price, buy price (×1.10 of rolled market price), and sell price (×0.90).
Food and water always appear with quantity 999; other goods use tier‑based
quantity ranges (40‑80, 20‑40, 8‑20, 2‑8).

**Trade:** `CONFIRM_TRADE` processes sells first (freeing space), then buys.
Buys are validated holistically against gold and hold capacity. Buying illegal
goods adds infamy.

**Cargo penalties:** Surrender events apply `loseCargoPercent` (removes a
fraction of all items) or `loseContraband` (removes all illegal goods). Defeat
in battle clears the entire hold.

### Parametric Mission Generation

Missions are generated at runtime by `G.generateMissions(portKey, state)`.
There is no static mission pool. Each call produces 2‑3 missions from weighted
type and risk tables.

**Mission types:** escort, patrol, combat, smuggle, assault.

**Risk levels:** low, medium, high (assault always uses the assault bracket).

**Gating:**
- At War (rep < 10): no missions returned.
- Fame tier gates risk via weight tables (assault only appears at tier 3+).
- Assault missions only target ports of other factions.
- Trade/escort/smuggle exclude ports belonging to rival factions.
- Smuggle missions are always offered by the pirate faction, regardless of port.

**Enemy generation** uses `MISSION_ENEMY_RANGES` scaling by fame tier and risk.
Assault enemies use the defending port's faction and get extended stat ranges.

**Reputation impacts** follow `MISSION_REP_IMPACTS`:
- Escort/patrol/combat: positive to commissioning faction, negative to rival.
- Smuggle: positive to pirate faction only.
- Assault: +5 to commissioning faction, −8 to defending faction.

**Gold rewards** come from `MISSION_GOLD_RANGES`, scaled by fame tier and risk,
rounded to the nearest 25.

### Named Crew Roster

- Crew are individual objects with `id`, `firstName`, `lastName`, `role`, `faction`, `daysAboard`.
- Names are drawn from faction‑specific pools in `CREW_FIRST_NAMES` and `CREW_LAST_NAMES`.
- Roles (deckhand, gunner, cook, carpenter, navigator) are assigned by weighted random.
- The manifest on CrewScreen shows each member as an icon with a tooltip.
- Crew losses in combat and events remove specific named members; the log names them.
- `L.removeRandomCrew(roster, count)` handles removal.


### Pre-Battle Intercept Screen

All encounters route through `InterceptScreen` before any combat. Options are
context‑dependent:

- **Fight**: always available.
- **Flee**: speed check (player speed + d3 vs enemy speed + d3). Blocked in hostile port entry, mission combat.
- **Parley**: reputation check (d100 ≤ min(80, rep+20)). Requires rep ≥ 30. Blocked in certain encounter types.
- **Bribe**: costs gold, reduces rep by 2. Blocked by encounter type, insufficient gold, or infamy ≥ 50.
- **Surrender**: applies penalties (gold loss, morale loss, days lost, rep loss) depending on encounter type.


### Combat resolution flow

```
BATTLE_ACTION dispatched
  → reducer calls L.resolveCombatAction(battleState, shipStats, crew, action)
  → returns new battleState: updated hulls, crew losses, log entries, phase
  → phase "victory"    → apply gold/fame to state, set goldReward in battleState
  → phase "defeat"     → apply penalties, set screen based on returnScreen
  → phase "fled"       → return to sailing or port, no penalties
  → phase "player_turn"→ re-render BattleScreen, await next dispatch
```

### Save / load behaviour

Fields excluded from save (transient state, always reset on load):
`screen`, `battleState`, `encounterContext`, `activeEvent`

On load, player always resumes at `screen: "port"` at `currentPort`. A `migrate`
function in `logic.js` handles forward compatibility — add a migration case
whenever the state shape changes between versions.

---

## 10. Adding New Content — Patterns

### Add a port

1. Add to `PORTS` in `data.js`: `name`, `faction`, `x`, `y`, `services[]`, `desc`
2. Add starting reputation to every `STARTS` scenario in `data.js`
3. Add starting reputation to `initialState` in `engine.js`
4. Port appears automatically on MapScreen and in travel calculations
5. Test: verify the port is reachable from at least one adjacent port

### Add a ship

1. Add to `SHIPS` in `data.js` with all fields including `upgradeSlots` and
   `maxDaysAtSea` and `requiredFame`
2. ShipyardScreen renders from `SHIPS` automatically for ships with `cost > 0`
3. `cost: 0` is reserved for the starting ship only
4. Test: verify `getShipStats` returns correct base stats

### Add equipment

1. Add to `EQUIPMENT` in `data.js`: `name`, `category`, `cost`, `desc`, `effect`
2. Appears automatically in ShipyardScreen grouped by `category`
3. Verify effect keys match what `getShipStats` sums
4. Test: verify `getShipStats` applies the effect correctly

### Add a random event

1. Add to `RANDOM_EVENTS` in `data.js`:
   ```js
   {
     id:     "unique_id",
     title:  "Display Title",
     type:   "hazard"|"choice"|"reward"|"crew"|"faction",
     icon:   "emoji",
     desc:   "Player-facing description.",
     apply:  (state) => ({ /* partial state to merge */ }),
     // OR for choice events, instead of apply:
     choices: [
       { label: "Option A", apply: (state) => ({ /* partial state */ }) },
       { label: "Option B", apply: (state) => ({ /* partial state */ }) },
     ],
   }
   ```
2. `apply` functions must return plain partial state objects only — no `L.*` calls
3. Add weight or condition if the event should not fire in all contexts
4. Test: verify `L.applyEvent` returns valid partial state for each branch

### Tuning the economy

To adjust trade balance, modify these constants in `data.js`:

- `RESOURCES` — base prices, variance, legality, infamy cost.
- `GOODS_AVAILABILITY` — per‑port tier table for appearance and quantity.
- `MISSION_GOLD_RANGES` — interacts with trade income; adjust together.

The speed‑penalty thresholds are in `logic.js` (`getHoldSpeedMultiplier`).
Provision consumption rate is in `getProvisionConsumptionPerDay`.

### Tuning mission generation

Missions are generated parametrically. To adjust the mix, modify these constants
in `data.js`:

- `MISSION_GOLD_RANGES` — gold reward [min, max] per fame tier and risk.
- `MISSION_ENEMY_RANGES` — enemy hull/cannons/crew ranges per fame tier.
- `MISSION_REP_IMPACTS` — reputation deltas per mission type and risk.
- `MISSION_NAME_PARTS` — word pools for mission name/description templates.
- `ENEMY_SHIP_NAMES` — adjective/noun pools for enemy ship names.

To change mission type weights or risk distributions, edit the weight tables
inside `G.generateMissions` in `generators.js`.

No code outside `generators.js` and `data.js` needs to change when adjusting
mission balance.

### Add a screen

1. Define the component in the appropriate screens file
2. Add to `window.S` exports (or `Object.assign` if using split files)
3. Add a case to the screen router in `App.jsx`
4. Add the `state.screen` key value to the screen list in Section 5
5. Add a `U.*` UI smoke test in `tests.js`

### Add an action

1. Add the constant string to `A` in `engine.js`
2. Add a case to the reducer `switch`
3. Extract any calculation to `logic.js` before writing the reducer case
4. Add the action and its payload to the reference table in Section 8
5. Add an `E.*` reducer test in `tests.js`

---

## 11. Testing Infrastructure

### Files

```
tests/
tests/
├── tests.html          Loads all game files, runs window.TESTS, renders results UI
├── tests_helpers.js    Shared helpers: fillRoster, makeState, testMission
├── tests_logic.js      Unit tests for logic.js (L.*) and generators.js (G.*)
├── tests_engine.js     Reducer tests for engine.js (E.*)
├── tests_flows.js      Integration tests (I.*) and Scenario tests (S.*)
└── tests_ui.js         UI smoke tests (U.*) and Edge case / Regression tests (F.*)
```

### Test structure

```js
window.TESTS = [
  {
    name: "L — Logic functions",
    tests: [
      {
        name: "L.01 travelDays returns positive integer",
        type: "unit",   // "unit"|"reducer"|"integration"|"scenario"|"ui"
        run: ({ assert, assertEqual }) => {
          const mockState = {
            ship: { type: "sloop", equipment: [] },
            // minimum fields needed by the function under test
          };
          const days = L.travelDays("tortuga", "havana", mockState);
          assert(days > 0, "travelDays must be positive");
          assert(Number.isInteger(days), "travelDays must return an integer");
        }
      },
    ]
  },
];
```

### Test utilities (`window.__testUtils`)

| Utility | Purpose |
|---|---|
| `assert(condition, msg)` | Throws if condition is false |
| `assertEqual(actual, expected, msg)` | Throws if values differ |
| `assertDeepEqual(actual, expected, msg)` | Throws if JSON representations differ |
| `setRandomSequence(values)` | Stubs `Math.random` with deterministic values |
| `resetRandomStub()` | Restores real `Math.random` |
| `installLocalStorageMock()` | Replaces localStorage with in-memory store |
| `clearLocalStorageMock()` | Clears mock store |
| `restoreLocalStorage()` | Restores real localStorage |
| `mountReact(Component, props)` | Mounts component for UI smoke tests |

### Naming convention

```
L.01  Logic unit test      (functions in logic.js)
E.01  Reducer test         (actions in engine.js)
I.01  Integration test     (multiple systems together)
S.01  Scenario simulation  (full player flow)
U.01  UI smoke test        (screen renders without crash)
F.01  Edge case/regression
G.01  Generator test        (functions in generators.js)
```

### Coverage requirement

Every new system ships with tests written in the same session:
- `L.*` unit test for each new logic function
- `E.*` reducer test for each new action
- `U.*` smoke test for each new screen

---

## 12. Constraints for AI Agents

Read this section before making any changes to the codebase.

### Before editing any file

1. Read the entire file before touching it
2. Identify which `window.*` globals it consumes — only read from those
3. Check whether the function or constant already exists elsewhere
4. Confirm your change does not violate the dependency direction (Section 4)

### Things that cause a blank screen with no error message

- Declaring the same `const` twice in the same IIFE scope → fatal `SyntaxError`
- Calling `L.functionName` inside `logic.js`'s own IIFE before `window.L` is
  assigned → `ReferenceError`
- Failing to export a new function from the IIFE's `return` statement

### Things that break silently (no crash, wrong behaviour)

- Mutating state directly in the reducer instead of spreading
- Using a localStorage key other than `"piratesSave"`
- Reading `SHIPS[state.ship.type].someField` directly instead of calling
  `getShipStats(state)` — equipment effects are ignored
- Using `crew.current` instead of `crew.roster.length` after the named-crew migration
- Forgetting to export a new logic function from the IIFE's `return` statement
- Using `rep < 10` instead of `L.getRepPerk(rep).servicesBlocked` for At War checks
- Using string literals like `"pirates_save"` instead of the canonical `"piratesSave"` key
- Using `crew.max` instead of `getShipStats(state).maxCrew` for hire limits
- Forgetting to update `hold.capacity` in `BUY_SHIP` when the new ship has a different hold size

### Always do

- Use `A.ACTION_NAME`, never string literals in dispatch
- Call `addLog(state, entry)` for any action appearing in the captain's log
- Spread every nested object modified: `crew: { ...state.crew, morale: x }`
- Call `getShipStats(state)` for any stat equipment could affect
- Check `state.ship.equipment.includes(key)` before installing equipment
- Update Section 7 (state shape) when adding new state fields
- Update Section 8 (action reference) when adding new actions
- Write tests for new logic functions and reducer cases in the same session

### File size limit

No file should exceed ~1000 lines. If an edit would push a file past this, raise
the issue rather than proceeding. Planned splits are in Section 3.