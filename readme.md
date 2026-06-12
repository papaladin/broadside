# Broadside
**A turn-based pirate strategy game set in the 17th-century Caribbean.**
Trade, scheme, and fight your way to fortune... but the world keeps score.

---

## Features

### Your Crew Has a Story
- **Every crew member is unique, and they change over time:**  Names, roles, traits, scars, and days at sea all accumulate into a biography you can read at any point. No two crew members look alike after a few months at sea.
- **Losing them hurts on purpose:**  When a crew member dies, the game tells you exactly who. You watched them become someone. And death isn't the only way to lose them -- neglect morale long enough, and they'll leave on their own terms. Some losses are the enemy's fault. Some are yours.
- **The Captain's Log reads like a story:**  Every battle, death, betrayal, and lucky escape is recorded in full. Not just what happened, but who was there and how they felt about it. It's meant to be read.
- **Generated biographies:**  Each crew member's history -- traits revealed, scars earned, days survived -- is assembled into a readable narrative paragraph. The longer they live, the richer their story becomes.

### A World That Reacts to You
- **25 ports across 5 rival factions:**  Each with its own economy, services, and politics. Your reception shifts based on your reputation, your fame, your infamy, and what's sitting in your hold.
- **Port gossip:**  Every visit generates a gossip screen: rumours and whispers shaped by who you are right now. Famous captains hear different things than unknowns. Smugglers get different looks than merchants.
- **Reputation with real weight:**  Betray a faction and their ports close to you. Earn their trust and get better prices, cheaper repairs, and exclusive missions. Standing decays over time; you have to keep earning it.
- **Hidden ports that have to be found:**  Four ports don't appear on your map until you've earned them. Some require fame. Some require infamy. One requires finding a dying sailor's last secret.
- **Faction heat:**  Aggressive actions generate short-term faction alerts that increase patrol frequency and change how ports greet you. Heat decays, but the world remembers.

### Logistics Are the Game
- **The economy isn't optional:**  Crew wages drain gold every day at sea. Food and water run out. Even a player who only wants to fight still needs to sell plunder, stock provisions, and keep money flowing. The Caribbean doesn't wait for you to get comfortable.
- **14 tradeable goods with real variance:**  Prices shift by port and supply. A full hold slows your ship. Buying smart is a skill of its own.
- **Contraband pays well, until it doesn't:**  Tobacco and slaves are lucrative. They're also illegal. Patrols strip cargo and add to your infamy. The more notorious you become, the more patrols you attract.

### Combat With Consequences
- **Turn-based naval combat:**  Four actions: broadside, precision shot, grappling, evasion. There's no always-correct answer -- it depends on your ship, your crew count, and how much risk you can absorb.
- **Every fight costs something:**  Hull damage, crew loss, morale drop. Win the battle and you still have problems. Dead crew can't be replaced at sea. A demoralized crew fights worse next time.
- **Intercept screen before every battle:**  Negotiate, bribe, flee, or surrender before a single cannon fires. Sometimes the fight isn't worth it.
- **Plunder decisions:**  After boarding, browse the enemy's cargo and pick what to take. Your hold space is limited -- choose wisely.

### A Career That Accumulates
- **Fame and infamy as parallel tracks:**  Fame unlocks bigger ships and better-paying missions. Infamy unlocks pirate ports and attracts more patrols. They pull in different directions. You can't have everything.
- **11 ships across 5 tiers:**  From a dinghy to a Ship of the Line. Bigger ships require more crew, more provisions, more gold to sustain -- and fame to even purchase.
- **17 equipment items across 4 slot types:**  Hull, armament, rigging, and special equipment let you customise your ship's identity. Fast raider, armoured trader, balanced warship -- your build defines your strategy.
- **5 starting scenarios:**  Different factions, starting ports, and opening problems. Each drops you into a different corner of the Caribbean with a different hand to play.
- **Random events at sea:**  Storms, shipwrecks, distressed merchants, mutinies, treasure maps. About one in ten days at sea brings something unplanned.

---

# Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| UI             | React 18 (functional components, hooks)         |
| State          | `useReducer` with a single immutable state tree |
| Styling        | Inline CSS (no external libraries)              |
| Transpilation  | Babel standalone (JSX runs in-browser)          |
| Storage        | `localStorage`                                  |
| Testing        | Custom browser-native test harness              |

Everything runs entirely in the browser -- no build step, no server needed for the player.

---

# Running the Game

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

> Opening `index.html` directly with `file://` will not work because of browser CORS restrictions.

---

# Running the Tests

Start a local server, then open:

| Tool | URL | Purpose |
|---|---|---|
| **Unit & integration tests** | `tests/tests.html` | Logic, engine, flow, and UI tests |
| **Balance dashboard** | `tests/tests_balance.html` | Reachability, economy, combat, patrol, trade, event, gossip checks |
| **Economy simulator** | `tests/sim.html` | Monte Carlo economy simulation (6 strategies) |
| **Crew lifecycle sim** | `tests/crew_sim.html` | Crew survival curves across 6 playstyles |
| **Bio/log analyser** | `tests/crew_bio_log_sim.html` | Bio uniqueness and log pattern detection |
| **Equipment combos** | `tests/equipment_combo_analyzer.html` | Equipment combination analysis and stat deltas |

Tests run automatically in the browser.

---

# Project Structure

```text
Broadside/
+-- index.html              # Entry point
+-- data.js                 # Game constants (ports, ships, factions, equipment, resources, etc.)
+-- data_text.js            # Text constants (crew names, bio templates, gossip templates, etc.)
+-- logic.js                # Pure game logic functions
+-- storage.js              # Save/load encoding, tutorial state (extends window.L)
+-- generators.js           # Runtime content generators (crew, missions, market, gossip, bios)
+-- engine_core.js          # Core engine: action constants, initial state, reducer chain, auto-save, state migration
+-- engine_port.js          # Port engine: reducers for port actions (REPAIR, BUY_SHIP, BUY_EQUIPMENT, HIRE_CREW, MISSIONS, SAVE/LOAD)
+-- engine_voyage.js        # Voyage engine: reducers for sailing (ADVANCE_DAY, DISCOVER_PORT, random events, patrols)
+-- engine_combat.js        # Combat engine: reducers for intercepts, battles, plunder, and events
+-- ui.jsx                  # Reusable UI components & theme tokens
+-- screens_port.jsx        # Port-zone screens (Title, Scenario, Port, Status, Journal)
+-- screens_shipyard.jsx    # Shipyard screen (Ships, Equipment, Locker tabs)
+-- screens_crew.jsx        # Crew screen (roster, bios, hiring)
+-- screens_market.jsx      # Market screen (buy/sell goods)
+-- screens_voyage.jsx      # Voyage-zone screens (Map, Sailing, Event, Intercept, Battle, Plunder)
+-- App.jsx                 # Root React component (router + HUD)
+-- docs/
|   +-- architecture.md     # Full architecture documentation
|   +-- player_guide.md     # Player guide
|   +-- developer_guide.md  # Developer guide
|   +-- roadmap.md          # Development roadmap
|   +-- specs_data.md       # Data constants specification
|   +-- specs_engine.md     # Engine architecture specification
|   +-- specs_logic.md      # Logic module specification
|   +-- specs_generators.md # Generators module specification
|   +-- specs_jsx.md        # React/JSX module specification
|   +-- Home.md             # Wiki home page
|   +-- _Sidebar.md         # Wiki sidebar
+-- tests/
|   +-- tests.html          # Test runner & utilities
|   +-- tests_balance.html  # Balance testing dashboard
|   +-- tests_helpers.js    # Shared test helpers
|   +-- tests_logic.js      # Unit tests (logic + generators)
|   +-- tests_engine.js     # Reducer tests
|   +-- tests_flows.js      # Integration & scenario tests
|   +-- tests_ui.js         # UI smoke & edge case tests
|   +-- sim.html            # Economy playtest simulator
|   +-- crew_sim.html       # Crew lifecycle simulator
|   +-- crew_bio_log_sim.html # Bio/log redundancy analyser
|   +-- equipment_combo_analyzer.html # Equipment combination analyser
+-- screenshots/
    +-- index.html          # Screenshot generator for itch.io assets
```

---

# Documentation

For a deep dive into architecture, data flow, state shape, and game mechanics, see:

- [Architecture](docs/architecture.md) -- System design, data flow, module roles
- [Player Guide](docs/player_guide.md) -- How to play, mechanics, strategies
- [Roadmap](docs/roadmap.md) -- Planned features and priorities
- Module specs: [Data](docs/specs_data.md) | [Engine](docs/specs_engine.md) | [Logic](docs/specs_logic.md) | [Generators](docs/specs_generators.md) | [JSX](docs/specs_jsx.md)


---

# License

This project is open-source. Feel free to use, modify, and expand it.
If you like it, don't hesitate to buy me coffee!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/U3J11ZXS37)
