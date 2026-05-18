# Broadside — Architecture Documentation

> This document covers **code structure, design constraints, and implementation
> decisions**. It does not cover the feature roadmap or future plans — those live
> in `roadmap.md`. It does not cover how to run the game or tests — that lives in
> `README.md`. When those documents conflict with this one, this one is authoritative
> on code structure; `roadmap.md` is authoritative on priorities.

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
├── index.html          Entry point. Loads dependencies and game files in order.
├── data.js             All game constants. Exposes window.D
├── logic.js            All pure game functions. Exposes window.L
├── engine.js           State shape, reducer, action constants. Exposes window.E
├── ui.jsx              React primitives and theme tokens. Exposes window.UI
├── screens.jsx         All game screens. Exposes window.S
├── App.jsx             Root component, HUD, screen router. Renders to #root
├── architecture.md     This document
├── roadmap.md          Feature roadmap and design decisions
├── README.md           Setup and running instructions
└── tests/
    ├── tests.html      Test runner UI
    └── tests.js        Test suite definitions
```

### Planned split — screens.jsx (at Phase 2 boundary)

When `screens.jsx` approaches 1000 lines, split into three files. Each extends
`window.S` using `Object.assign`:

```
screens_port.jsx      PortScreen, ShipyardScreen, CrewScreen, TavernScreen,
                      FactionsScreen, StartScreen
screens_voyage.jsx    MapScreen, SailingScreen, InterceptScreen, EventScreen
screens_action.jsx    BattleScreen, QuestScreen, RetirementScreen, PrizeScreen
```

`index.html` load order becomes:
```html
<script type="text/babel" src="screens_port.jsx"></script>
<script type="text/babel" src="screens_voyage.jsx"></script>
<script type="text/babel" src="screens_action.jsx"></script>
```

### Planned split — data.js (at Phase 1.5 boundary)

When crew names, trait definitions, and content pools are added, split `data.js`:

```
data.js           Stable definitions rarely edited: PORTS, SHIPS, FACTIONS,
                  EQUIPMENT, STARTS, FACTION_RELATIONS.
                  Exposes window.D

data_content.js   Frequently edited content pools: CREW_NAME_POOLS,
                  TRAIT_DEFINITIONS, MISSION_TEMPLATES, RANDOM_EVENTS,
                  WORLD_EVENTS, RUMOR_TEMPLATES, ENCOUNTER_FLAVOUR,
                  SURRENDER_CONSEQUENCE, EPILOGUES.
                  Exposes window.C
```

### Planned addition — generators.js (at Phase 1.5 boundary)

When parametric generation functions are added, extract them from `logic.js`:

```
generators.js     buildCrewMember(), generateMission(), buildRumor(),
                  buildEncounterContext(), buildRival().
                  Reads window.D and window.C. Exposes window.G.
```

This separates stable calculation functions (`logic.js`) from content assembly
functions (`generators.js`) that change more frequently.

---

## 4. Dependency Graph

### Current

```
index.html
  ├── data.js        (window.D)  ← no dependencies
  ├── logic.js       (window.L)  ← reads D
  ├── engine.js      (window.E)  ← reads D, L
  ├── ui.jsx         (window.UI) ← no game dependencies
  ├── screens.jsx    (window.S)  ← reads D, L, E, UI
  └── App.jsx                    ← reads D, L, E, UI, S

tests/tests.html    ← loads all game files above, then tests.js
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
| `FACTIONS` | Faction labels and colours: pirate, spanish, english, dutch, french |
| `PORTS` | Port definitions: name, faction, SVG coords, available services, description |
| `SHIPS` | Ship stats: maxCrew, cannons, speed, maxHull, cost, upgradeSlots, maxDaysAtSea |
| `EQUIPMENT` | Equipment definitions: name, category, cost, description, effects object |
| `MISSION_POOL` | Mission templates: type, base gold/fame, risk level, description |
| `RANDOM_EVENTS` | Event pool: id, type, icon, description, apply fn or choices array |
| `WORLD_EVENTS` | World-level events: condition, weight, effects, duration range |
| `STARTS` | Starting scenarios: gold, fame, startPort, shipType, crew, reputation |
| `FACTION_RELATIONS` | Inter-faction stance matrix (−100 to +100) |
| `ENCOUNTER_FLAVOUR` | Functions returning flavour text per encounter type |
| `SURRENDER_CONSEQUENCE` | Consequence objects per encounter type |

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
| `travelDays` | `(fromKey, toKey, state)` | Effective travel days, accounts for speed and cargo load |
| `canReach` | `(state, fromKey, toKey)` | Whether ship can reach port within `maxDaysAtSea` |
| `randomWind` | `()` | Generates `{ angle, speed }` |
| `encounterRoll` | `(state)` | Boolean — random encounter fires this day |
| `rollRandomEvent` | `(state)` | Selects event from pool, filtered by state context |
| `applyEvent` | `(event, state, choiceIndex)` | Returns partial state from event |
| `buildEncounterContext` | `(state, type, enemy)` | Builds context object for InterceptScreen |
| `generateMissions` | `(portKey, state)` | Returns mission array for a port |
| `missionOdds` | `(mission, state)` | Returns 0–95 success probability |
| `getShipStats` | `(state)` | Effective ship stats with all equipment effects applied |
| `getEffectiveMorale` | `(state)` | Morale with equipment bonuses applied |
| `canAfford` | `(state, cost)` | Boolean |
| `hasUpgrade` | `(state, key)` | Boolean — equipment key is installed |
| `getFameLabel`     |  `L.getFameLabel(50)` → `"Recognised"` | Returns a tier label (Unknown → Immortal) based on fame.     |
| `meetsRequirement` |  `L.meetsRequirement(state, ship)` → `{ allowed: false, reason: "Requires ★ 50 fame" }` | Checks if the player's fame meets an item's `requiredFame`.  |
| `shipRepairCost` | `(state)` | Gold cost to fully repair |
| `reputationLabel` | `(rep)` | String label for a reputation value |
| `payCrewWages` | `(state)` | Partial state after daily wage payment |
| `applyReputationImpact` | `(state, impact)` | Updated reputation object |
| `decayReputation` | `(reputation)` | Reputation after daily decay |
| `resolveCombatAction` | `(battleState, shipStats, crew, action)` | Updated battleState |
| `getNPCAction` | `(battleState)` | NPC's chosen combat action string |
| `updateReputation` | `(state, portKey, delta)` | State with reputation updated |
| `saveGame` | `(state)` | Serialise to localStorage. Returns boolean |
| `loadGame` | `()` | Deserialise from localStorage. Returns state or null |
| `hasSave` | `()` | Boolean |
| `deleteSave` | `()` | Removes save |
| `roll` | `(sides)` | Returns random integer 1–sides |

**Critical:** `getShipStats(state)` is the central stat aggregator. All combat,
travel, capacity, and UI code must call this rather than reading
`SHIPS[state.ship.type]` directly. Equipment effects are invisible to anything
that bypasses this function.

**Critical:** `travelDays(fromKey, toKey, state)` must receive `state` to apply
speed bonuses from equipment and future cargo load penalties. The base distance
uses port SVG coordinates internally — callers treat the return value as days only.

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
| Port | `REPAIR`, `BUY_SHIP`, `BUY_EQUIPMENT`, `REMOVE_EQUIPMENT`, `HIRE_CREW` |
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

| Screen | `state.screen` value | Description |
|---|---|---|
| `StartScreen` | `"start"` | Scenario selection, load game |
| `PortScreen` | `"port"` | Main hub: mission board, log, quick actions |
| `MapScreen` | `"map"` | Interactive SVG world map, sail destination |
| `SailingScreen` | `"sailing"` | Day-advance, voyage progress |
| `InterceptScreen` | `"intercept"` | Pre-combat encounter options |
| `BattleScreen` | `"battle"` | Turn-based naval combat |
| `ShipyardScreen` | `"shipyard"` | Ship purchase, equipment, repair |
| `CrewScreen` | `"crew"` | Crew roster, hire, morale |
| `StatusScreen`    | View reputation, fame, infamy, and faction relations.       | Displays Captain's Standing panel, faction rep bars, and perk info. |
| `EventScreen` | `"event"` | Random event resolution |

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
| `window.G` | `generators.js` | Generation functions (after split) |
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
  screen:       "start",    // current screen key — see screen list in Section 5
  day:          1,          // absolute day counter, never resets
  gold:         0,
  fame:         0,          // cumulative fame (heroic acts)
  infamy:       0,          // cumulative infamy (piracy, criminal acts)

  // ── Ship ────────────────────────────────────────────────────────
  ship: {
    type:       "sloop",    // key into SHIPS
    hull:       100,        // current hull points
    name:       "The Sea Rat",
    equipment:  [],         // array of EQUIPMENT keys
                            // max length = SHIPS[type].upgradeSlots
                            // no duplicate keys allowed
  },

  // ── Crew ────────────────────────────────────────────────────────
  crew: {
    current:    20,         // number of crew aboard
    max:        30,         // effective max (base from ship + equipment bonuses)
    morale:     75,         // 0–100
  },

  // ── Navigation ──────────────────────────────────────────────────
  currentPort:      "tortuga",  // port key of current location
  worldPos:         { x: 0, y: 0 }, // SVG coords, mirrors port position
  destination:      null,       // port key of destination while sailing
  sailingDaysLeft:  0,
  sailingDaysTotal: 0,
  wind:             { angle: 0, speed: 8 },

  // ── Reputation ──────────────────────────────────────────────────
  reputation: {
    tortuga:      60,       // 0–100 per port key
    portRoyal:    20,
    // all port keys present
  },

  // ── Missions ────────────────────────────────────────────────────
  missions:         [],     // available missions at current port
  activeMission:    null,   // accepted mission object, or null

  // ── Combat ──────────────────────────────────────────────────────
  battleState:      null,   // see battleState shape below
  encounterContext: null,   // see encounterContext shape below

  // ── Events ──────────────────────────────────────────────────────
  activeEvent:      null,   // event object from RANDOM_EVENTS, or null

  // ── Captain's log ───────────────────────────────────────────────
  log:              [],     // strings, newest first, max 30 entries

  // ── Planned fields (not yet in state) ───────────────────────────
  // provisions: { food, water, medicine, ammunition }  ← Phase 1.2
  // world: { wars, plagues, sieges, eventLog }         ← Phase 2.1
  // crew.roster: []                                    ← Phase 1.5.1
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
| `TAKE_MISSION` | `mission` (full mission object) |
| `COMPLETE_MISSION` | — |
| `ABANDON_MISSION` | — |
| `REFRESH_MISSIONS` | — |
| `BATTLE_ACTION` | `action`: `"broadside"` \| `"precision"` \| `"grapple"` \| `"evade"` |
| `DISMISS_BATTLE` | — |
| `RESOLVE_EVENT` | `choiceIndex` (number, or null for non-choice events) |

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

`travelDays(fromKey, toKey, state)` computes effective days using port SVG
coordinates for distance, divided by effective speed from `getShipStats(state)`.
Future cargo load penalty will reduce speed proportionally to fill percentage.

`canReach(state, fromKey, toKey)` compares `travelDays` result against
`getShipStats(state).maxDaysAtSea`. Used by MapScreen to grey out unreachable
ports. Mid-voyage events that extend travel are never blocking — consequences
come from provision consumption and wage costs for the extra days.

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

| Range | Label | Mechanical effect |
|---|---|---|
| < 10 | Hostile | Port entry triggers combat. Black market only. |
| 10–29 | Restricted | Port fee to dock. No crew hire. Reduced missions. |
| 30–49 | Neutral | Standard access. |
| 50–69 | Friendly | 10% repair discount. Better mission quality. |
| ≥ 80 | Allied | 20% repair discount. Elite crew. Governor missions. |

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
- **Gating**: Ships, upgrades, and missions can have a `requiredFame` field. Items with a requirement are either hidden (missions) or greyed‑out with a lock reason (ships/upgrades).

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

### Add a mission template

1. Add to `MISSION_POOL` in `data.js`:
   ```js
   {
     tpl:      "template_id",
     name:     "Mission Name",
     baseGold: 1000,
     baseFame: 12,
     risk:     "low"|"medium"|"high",
     desc:     "Player-facing description.",
   }
   ```
2. `generateMissions` picks randomly from the pool — no further wiring needed
3. Test: verify `generateMissions` can produce the new template

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
├── tests.html    Loads all game files, runs window.TESTS, renders results UI
└── tests.js      Defines window.TESTS — array of suite objects
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
- Using `crew.current` instead of `crew.roster.length` after the Phase 1.5 split
- Using `crew.max` instead of `getShipStats(state).maxCrew` for hire limits

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