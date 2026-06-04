# Broadside

**A turn‑based pirate adventure set in the Caribbean.**  
Trade, fight, and scheme your way to fortune and infamy.  
Build your ship, manage your crew, and navigate the treacherous waters of the 17th century.

---

# 🎮 Features

- **Caribbean map** – 14 ports across 5 factions, each with its own economy and services.
- **Turn‑based naval combat** – broadsides, precision shots, grappling, and evasive maneuvers.
- **Pre‑battle intercept** – negotiate, bribe, flee, or surrender before every encounter.
- **Dynamic missions** – trade, escort, smuggle, hunt pirates, or assault ports, each mission is randomly generated, creating thousands of combinations.
- **Cargo trading** – 14 tradeable goods (food, water, rum, sugar, timber, cloth, spices, silk, coffee, cocoa, weapons, tobacco, silver, slaves), each with unique availability, legality, and pricing per port. Buy low, sell high across ports; a full hold slows your ship.
- **Provision management** – stock food and water for voyages; shortages hurt morale, full hold impacts speed.
- **Fame & Infamy** – permanent reputation that unlocks ships, upgrades, and missions (or closes options).
- **Ship upgrades** – reinforced hull, extra cannons, figureheads, and more.
- **Crew Management** – keep the crew happy with port drinks; low morale weakens combat and travel, or could lead to mutiny and deserters. Over the days, each crew member will have its own story written.
- **Random events** – storms, mutinies, treasures, and patrols.
- **Save & Load** – progress stored in your browser’s localStorage.

---

# 🧱 Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| UI             | React 18 (functional components, hooks)         |
| State          | `useReducer` with a single immutable state tree |
| Styling        | Inline CSS (no external libraries)              |
| Transpilation  | Babel standalone (JSX runs in‑browser)          |
| Storage        | `localStorage`                                  |
| Testing        | Custom browser‑native test harness              |

Everything runs entirely in the browser — no build step, no server needed for the player.

---

# 🚀 Running the Game

Play online:  
**[papaladin.github.io/broadside](https://papaladin.github.io/broadside/)**

Or run locally:

```bash
git clone https://github.com/papaladin/broadside.git
cd Broadside
# Start any HTTP server, for example:
python3 -m http.server 8000
```
Open http://localhost:8000 in your browser.

> ⚠️ Opening `index.html` directly with `file://` will not work because of browser CORS restrictions.

---

# 🧪 Running the Tests

Start a local server, then open:

tests/tests.html — unit, integration, and UI tests

tests/tests_balance.html — balance and tuning checks

Tests run automatically in the browser.

---

# 📁 Project Structure

```text
Broadside/
├── index.html              # Entry point
├── data.js                 # Game constants (ports, ships, factions, etc.)
├── logic.js                # Pure game logic functions
├── generators.js           # Runtime content generators (crew, missions, market)
├── engine_core.js          # **Core engine**: Action constants, initial state, reducer chain, auto-save, state migration
├── engine_port.js          # **Port engine**: Reducers for port actions (REPAIR, BUY_SHIP, BUY_UPGRADE, HIRE_CREW, MISSIONS, SAVE/LOAD)
├── engine_voyage.js        # **Voyage engine**: Reducers for sailing (ADVANCE_DAY, DISCOVER_PORT, hidden port discovery, random events, patrols)
├── engine_combat.js        # **Combat engine**: Reducers for intercepts, battles, plunder, and events (INTERCEPT_*, BATTLE_ACTION, DISMISS_BATTLE, RESOLVE_EVENT)
├── ui.jsx                  # Reusable UI components & theme tokens
├── screens_shared.jsx      # Shared micro‑components
├── screens_port.jsx        # Port‑zone screens (Start, Port, Shipyard, Crew, Status, Market)
├── screens_voyage.jsx      # Voyage‑zone screens (Map, Sailing, Event, Intercept, Battle)
├── App.jsx                 # Root React component (router + HUD)
├── architecture.md         # Full architecture documentation
├── README.md               # This file
└── tests/
    ├── tests.html          # Test runner & utilities
    ├── tests_balance.html  # Balance testing
    ├── tests_helpers.js    # Shared helpers
    ├── tests_logic.js      # Unit tests (logic + generators)
    ├── tests_engine.js     # Reducer tests
    ├── tests_flows.js      # Integration & scenario tests
    └── tests_ui.js         # UI smoke & edge case tests
```

---

# 📖 Documentation

For a deep dive into architecture, data flow, state shape, and game mechanics, see
```text
architecture.md
specs_*.md
```

---

# 🐛 Known Issues

- Patrol mission type is not yet fully integrated into the mission board.
- Grapple crew‑loss logic has a known bug (losses are sometimes applied to the wrong side). Manual testing is pending.
- Some UI smoke tests are still being stabilised.

---

# 📜 License

This project is open-source. Feel free to use, modify, and expand it.
If you like it, dont hesitate to buy me coffee !

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/U3J11ZXS37)