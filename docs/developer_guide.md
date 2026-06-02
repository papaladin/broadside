# Broadside — Developer Guide

> Quick-start guide for contributors. For the full architecture deep-dive, see [architecture.md](architecture).
> Last verified against codebase: June 2026.

## Table of Contents

1. [Overview](#overview)
2. [Setup & Quick Start](#setup--quick-start)
3. [Project Structure](#project-structure)
4. [Module Responsibilities](#module-responsibilities)
5. [Namespace Convention](#namespace-convention)
6. [Code Style](#code-style)
7. [Naming Conventions](#naming-conventions)
8. [Developer Tools](#developer-tools)
9. [Testing](#testing)
10. [Performance Notes](#performance-notes)
11. [Git Workflow](#git-workflow)
12. [Common Pitfalls](#common-pitfalls)

---

## Overview

Broadside is a browser-based pirate strategy game built with:

| Tool | Role |
|---|---|
| React 18 (CDN) | UI rendering |
| Babel Standalone (CDN) | JSX → JS in-browser |
| Vanilla JS (ES2020) | Game logic, engine, data |
| localStorage | Save/load |

**No build step.** No npm, no bundler, no TypeScript. Files are loaded via `<script>` tags in strict dependency order.

---

## Setup & Quick Start

### Requirements

- Any modern browser (Chrome, Firefox, Edge, Safari)
- A **local HTTP server** (required — Babel Standalone uses XHR to load JSX files, which is blocked on `file://`)

### Running locally

```bash
# Option 1: VS Code Live Server (recommended)
# Right-click index.html → Open with Live Server

# Option 2: Python
python -m http.server

# Option 3: Node
npx serve .
```

Then open `http://localhost:PORT` in your browser.

### Debug mode

Append `?debug=1` to the URL to enable the debug panel:

```
http://localhost:5500/?debug=1
```

The debug panel (⚙ button in HUD) provides:
- **Gold**: +1000, +10000, +10000, +1000000
- **Fame**: set to 50, 100, 200, 350
- **Infamy**: set to 0, 25, 50, 100
- **Ship**: instantly switch to any ship type
- **Reputation**: set current port rep to 5, 10, 50, 65, 85
- **Morale**: set to 10, 50, 80, 100
- **Fill hold**, **Full repair**, **Unlock hidden ports**, **Max crew**, **Complete mission**

Console shortcuts (debug mode only):
```js
window.__b.gold(5000)    // add gold
window.__b.fame(200)     // set fame
window.__b.infamy(50)    // set infamy
window.__b.ship("frigate") // set ship type
```

---

## Project Structure

```
broadside/
├── index.html              ← entry point, <script> load order
├── data.js                 ← window.D — all game constants
├── logic.js                ← window.L — pure functions (no RNG, no side-effects)
├── generators.js           ← window.G — RNG: missions, markets, crew, enemies
├── engine_core.js          ← window.E — reducer chain, actions, initial state, save/load
├── engine_port.js          ← port domain reducer (docked actions)
├── engine_voyage.js        ← voyage domain reducer (sailing, day advance)
├── engine_combat.js        ← combat domain reducer (encounters, battles, plunder, events)
├── ui.jsx                  ← window.UI — theme tokens + presentational components
├── screens_port.jsx        ← window.S — port-zone screens (Start, Port, Shipyard, Crew, Status, Market)
├── screens_voyage.jsx      ← window.S — voyage-zone screens (Map, Sailing, Event, Intercept, Battle, Plunder)
├── App.jsx                 ← Root: HUD, screen router, ErrorBoundary, DebugPanel
└── tests/
    └── sim.html            ← Economy playtest simulator (Monte Carlo)
```

**No `styles.css`** — all styling is inline via theme tokens in `ui.jsx` → `T` object.

---

## Module Responsibilities

| File | Namespace | Key Contents |
|---|---|---|
| `data.js` | `window.D` | PORTS, SHIPS, FACTIONS, UPGRADES, RESOURCES, MISSION_GOLD_RANGES, RANDOM_EVENTS, STARTS, etc. |
| `logic.js` | `window.L` | Pure functions: combat math, reputation, travel, fame, hold/provisions, encounter context |
| `generators.js` | `window.G` | RNG generators: missions, markets, crew names, enemies, plunder cargo |
| `engine_core.js` | `window.E` | Action constants (E.A), initialState, reducer chain, save/load, migrateState |
| `engine_port.js` | — | START_GAME, LOAD_GAME, SAVE_GAME, NAVIGATE, REPAIR, BUY_SHIP, BUY_UPGRADE, HIRE_CREW, SAIL_TO, ENTER_MARKET, CONFIRM_TRADE, DEBUG_*, etc. |
| `engine_voyage.js` | — | ADVANCE_DAY (core sailing loop), DISCOVER_PORT |
| `engine_combat.js` | — | INTERCEPT_*, BATTLE_ACTION, DISMISS_BATTLE, TAKE_PLUNDER, RESOLVE_EVENT, ENTER_PORT |
| `ui.jsx` | `window.UI` | Theme tokens (T), Btn, Bar, Pill, StatBlock, SectionTitle, FactionPill, RepPill, ShipSprite |
| `screens_port.jsx` | `window.S` | StartScreen, PortScreen, ShipyardScreen, CrewScreen, StatusScreen, MarketScreen |
| `screens_voyage.jsx` | `window.S` | MapScreen, SailingScreen, EventScreen, InterceptScreen, BattleScreen, PlunderScreen |
| `App.jsx` | — | ErrorBoundary, App (useReducer + HUD + router), DebugPanel |

---

## Namespace Convention

All inter-file communication uses `window.*` namespaces:

| Namespace | Source | Used By |
|---|---|---|
| `window.D` | data.js | Everything |
| `window.L` | logic.js | generators, engine_*, ui, screens |
| `window.G` | generators.js | engine_* |
| `window.E` | engine_core.js + domain files | screens, App |
| `window.UI` | ui.jsx | screens, App |
| `window.S` | screens_port.jsx + screens_voyage.jsx | App |

Common import patterns at the top of files:

```js
// In engine files:
const { PORTS, SHIPS, FACTIONS, UPGRADES } = window.D;
const L = window.L;
const G = window.G;

// In screen files:
const { T, panelStyle, Btn, Bar, Pill, StatBlock } = window.UI;
```

→ See [architecture.md §6](architecture) for full details.

---

## Code Style

| Rule | Convention |
|---|---|
| Indentation | 2 spaces |
| Semicolons | Required |
| Strings | Double quotes `"` in JS, backticks for templates |
| Braces | Same-line opening, always used (no braceless `if`) |
| Trailing commas | Yes, in objects and arrays |
| Max line length | ~120 chars (soft limit) |
| Max file length | ~1500 lines (split by domain if exceeded) |

---

## Naming Conventions

| Category | Convention | Example |
|---|---|---|
| Files | `snake_case.js` or `camelCase.jsx` | `engine_port.js`, `screens_port.jsx` |
| Constants | `SCREAMING_SNAKE` | `MISSION_GOLD_RANGES`, `PORTS` |
| Variables/functions | `camelCase` | `getShipStats`, `buildEncounterContext` |
| Components | `PascalCase` | `PortScreen`, `SectionTitle` |
| Action types | `SCREAMING_SNAKE` strings | `"START_GAME"`, `"BATTLE_ACTION"` |
| Port keys | `camelCase` | `portRoyal`, `stEustatius` |
| Ship keys | `snake_case` | `ship_of_the_line` |

**No CSS classes.** All styling is inline via the `T` theme object and `panelStyle()` helper in `ui.jsx`.

---

## Developer Tools

### Debug mode (`?debug=1`)

See [Setup](#debug-mode) above. Essential for testing game mechanics without grinding through the early game.

### Economy Simulator (`tests/sim.html`)

A self-contained HTML page that loads your game files via `<script>` tags and runs Monte Carlo economy simulations.

- **Reads real values** from `window.D`, `window.L`, `window.G` — no hardcoded constants
- Simulates 6 strategy profiles (Low Risk, High Risk, Combat, Trade, Smuggle, Mixed)
- Outputs fame-indexed charts + summary tables + pacing analysis
- **Run after any balance change** to verify the economy curve

Open in browser via Live Server (same as the game):
```
http://localhost:5500/tests/sim.html
```

### Save data

Game state is stored in localStorage:

```js
localStorage key: "piratesSave"
Format: JSON.stringify(state)
```

To clear a save during development:
```js
localStorage.removeItem("piratesSave");
```

`engine_core.js` → `migrateState()` handles backward compatibility when new state fields are added.

---

## Testing

### Manual Testing Checklist

Before merging changes, verify:

1. **Start each scenario**: The Forged Commission (English), The Governor's Errand (Spanish), The Cartographer's Debt (French), The Company's Ledger (Dutch), The Survivor (Pirate)
2. **Core loop**: accept mission → sail → encounter → return to port → complete mission
3. **Combat**: test broadside, precision, grapple, evade actions
4. **Trade flow**: buy goods at market → sail → sell at another port
5. **Save/load**: save in port, reload page, load the save
6. **Debug mode**: verify debug panel works (`?debug=1`)
7. **Error recovery**: force an error (e.g., bad state), verify ErrorBoundary appears with recovery options

### Economy Balance Testing

After any change to ship costs, mission rewards, resource prices, or progression gates:

1. Open `tests/sim.html` in browser
2. Run with default settings (100 runs, Fame 200 target)
3. Verify all non-smuggle strategies reach Fame 200
4. Check pacing: Cutter by missions 4–6, Sloop by Fame ~60–80, Brigantine by Fame ~150
5. Check gold curve: S-shaped (flat early, steep mid-game, plateau late)

### Automated Testing

Not yet implemented. The project avoids npm/build tools by design, so Jest/React Testing Library are not used. The pure-function architecture of `logic.js` and `generators.js` makes them ideal for browser-native test files (HTML pages that load source files and run assertions). Contributions welcome.

---

## Performance Notes

| Guideline | Reason |
|---|---|
| All RNG in `generators.js` | Keeps `logic.js` pure and testable. Never add `Math.random()` to `logic.js`. |
| Spread-copy state, don't mutate | React depends on reference equality for re-renders. `state.gold -= 100` won't trigger updates. |
| Keep `data.js` free of functions | It's loaded first and parsed as pure data. Event `condition` callbacks are the only exception. |
| Minimize re-renders | The reducer chain means every action touches the top-level state. Use `React.memo` on heavy components if needed. |
| Hold capacity via `L.getHoldCapacity(state)` | Don't read `state.hold.capacity` directly — use the function which accounts for ship type. |

---

## Git Workflow

### Branch naming
```
feature/market-screen
fix/combat-evade-speed
balance/tier0-gold-increase
docs/update-player-guide
```

### Commit messages
```
feat: add PlunderScreen with manual cargo selection
fix: evade now checks ship speed vs enemy speed
balance: triple Tier 0 mission gold rewards
docs: fix hallucinations in player guide
refactor: split engine.js into domain files
```

### Pull Request checklist

- [ ] Manual testing completed (see checklist above)
- [ ] Economy sim run if balance values changed (`tests/sim.html`)
- [ ] No new `window.*` namespace pollution (check browser console)
- [ ] Debug mode tested (`?debug=1`)
- [ ] Save/load tested (save, reload, load)
- [ ] No files exceed ~1500 lines
- [ ] Documentation updated if mechanics changed

---

## Common Pitfalls

### Things that cause a blank screen (no error)

- Syntax error in any `.js` file — breaks the `<script>` load chain
- Missing comma in `data.js` object literals
- Referencing `window.L` before `logic.js` has loaded (load order matters!)
- Babel parse error in `.jsx` files (unclosed tags, mismatched braces)
- Opening `index.html` via `file://` instead of an HTTP server

### Things that break silently

- **Mutating state**: `state.gold -= 100` ← WRONG, use `{ ...state, gold: state.gold - 100 }`
- **Missing action**: forgetting to add new action to `window.E.A` (dispatch does nothing)
- **Wrong crew accessor**: `state.crew.current` doesn't exist → use `state.crew.roster.length`
- **Wrong hold accessor**: `state.hold.capacity` may be undefined → use `L.getHoldCapacity(state)`
- **Phantom upgrade**: adding key to `SHIPS[type].upgradeable` that doesn't exist in `UPGRADES`
- **Mismatched reducer domain**: adding a port action case to `engine_voyage.js` (it'll never fire for port-screen dispatches)

### Things to always do

- Spread-copy: `return { ...state, gold: state.gold + 100 }`
- Nested spread: `ship: { ...state.ship, hull: newHull }`
- Add log entries: `log: [...state.log, "message"]`
- Gate purchases: check `gold >= cost` AND `fame >= requiredFame`
- Test with `?debug=1` after changes
- Run `tests/sim.html` after balance changes
