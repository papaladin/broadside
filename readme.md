# Broadside

**A pirate game set in the 17th-century Caribbean.**
Trade, scheme, and fight your way to fortune... but your crew has opinions, and the world keeps score.
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

### On the Roadmap

Broadside is in active development. Major upcoming additions include:

- **Crew councils** — periodic moments where the crew weighs in on your decisions, with their observations shaped by what you've actually done.
- **Ship's articles** — the rules of your ship (share splits, treatment of prisoners, mandatory shore leave), amendable through crew vote.
- **Shore leave** — port stays that surface what your crew does ashore, not just what you do.
- **World events** — famines, blockades, and faction wars that shift the Caribbean around you.
- **Story arcs** — rival captains who remember you across encounters, governor quest chains, the legend of Libertalia.
- **Endgame and legacy** — captains retire, or the sea takes them. Either way, the next captain inherits something.

See [the full roadmap](docs/roadmap.md) for the complete plan.

---

## Architecture at a Glance

Broadside is built around four ideas that you should know before reading any code:

1. **Single state tree, single reducer.** All game state lives in one object, mutated only through dispatched actions. No hidden state.
2. **Strict layer separation.** Data → Logic → Generators → Engine → UI. Each layer only reads from the layers above it. Pure functions in `logic.js`. All randomness in `generators.js`. All state transitions in the engine reducers.
3. **Narrative as a presentation layer.** Gossip, captain's log, crew biographies, journal — these *describe* what happened, they don't *cause* anything. Gameplay systems own the consequences.
4. **No build step.** Everything runs in the browser via React + Babel-standalone CDN. Edit a file, refresh, see it.

The dependency direction is strictly downward: `data.js → logic.js → generators.js → engine_*.js → ui.jsx → screens_*.jsx → App.jsx`.

For the full picture — state shape, reducer chain mechanics, file-by-file responsibilities, and contribution patterns — see [ocs/architecture.md and the docs/.

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

**[papaladin.itch.io/broadside](https://papaladin.itch.io/broadside)**
OR
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
+-- handbook.html           # A player guide handbook, reachable from in game Menu
+-- data.js                 # Game constants (ports, ships, factions, equipment, resources, etc.)
+-- data_text.js            # Text constants (crew names, bio templates, gossip templates, etc.)
+-- logic.js                # Pure game logic functions
+-- storage.js              # Save/load encoding, tutorial state (extends window.L)
+-- generators.js           # Runtime content generators (crew, missions, market, gossip, bios)
+-- engine_core.js          # Core engine: action constants, initial state, reducer chain, auto-save, state migration
+-- engine_onboarding.js    # Onboarding engine: toast style indication, menu unlocking, onboarding mission injection, etc..
+-- engine_career.js         # Career stats middleware: lifetime tracking (gold, crew, battles, missions)
+-- engine_scripted.js      # Dev-only: scripted playthroughs (enabled via ?scripted=1)
+-- engine_port.js          # Port engine: reducers for port actions (REPAIR, BUY_SHIP, BUY_EQUIPMENT, HIRE_CREW, MISSIONS, SAVE/LOAD)
+-- engine_voyage.js        # Voyage engine: reducers for sailing (ADVANCE_DAY, DISCOVER_PORT, random events, patrols)
+-- engine_combat.js        # Combat engine: reducers for intercepts, battles, plunder, and events
+-- ui.jsx                  # Reusable UI components & theme tokens
+-- icons.jsx               # svg path Icons pack.
+-- screens_core.jsx        # Title screen and New Game screen, as well aas onboarding elements.
+-- screens_menu.jsx        # In game Menu, with Game Save/Load/Import/export, feedback, link to socials, etc.
+-- screens_port.jsx        # Port-zone screens ( Port, Status, Journal)
+-- screens_shipyard.jsx    # Shipyard screen (Ships, Equipment, Locker tabs)
+-- screens_crew.jsx        # Crew screen (roster, bios, hiring)
+-- screens_market.jsx      # Market screen (buy/sell goods)
+-- screens_voyage.jsx      # Voyage-zone screens (Map, Sailing)
+-- screens_combat.jsx      # Combat and event related screens (Event, Intercept, Battle, Plunder)
+-- App.jsx                 # Root React component (router + HUD)
+-- docs/
|   +-- architecture.md     # Full architecture documentation
|   +-- player_guide.md     # Player guide
|   +-- developer_guide.md  # Developer guide
|   +-- roadmap.md          # Development roadmap
|   +-- changelog.md        # Changelog, visible in game. Based on Commits
|   +-- specs_data.md       # Data constants specification
|   +-- specs_engine.md     # Engine architecture specification
|   +-- specs_logic.md      # Logic module specification
|   +-- specs_generators.md # Generators module specification
|   +-- specs_storage.md    # Game save and import/export management specs
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
+-- tools/
    +-- index.html          # Screenshot generator for itch.io assets
|   +-- sim.html            # Economy playtest simulator
|   +-- icon_preview.html            # Preview svg icon result before adding them.
|   +-- pirate_sound_tester.html      # Tool to prepare for sound addition
|   +-- crew_sim.html       # Crew lifecycle simulator
|   +-- crew_bio_log_sim.html # Bio/log redundancy analyser
|   +-- equipment_combo_analyzer.html # Equipment combination analyser
```

---

# Documentation

For a deep dive into architecture, data flow, state shape, and game mechanics, see:

- [Architecture](docs/architecture.md) -- System design, data flow, module roles
- [Player Guide](docs/player_guide.md) -- How to play, mechanics, strategies
- [Roadmap](docs/roadmap.md) -- Planned features and priorities
- Module specs: [Data](docs/specs_data.md) | [Engine](docs/specs_engine.md) | [Logic](docs/specs_logic.md) | [Generators](docs/specs_generators.md) | [JSX](docs/specs_jsx.md)


---

# License AGPL 3.0

This project is open-source. Feel free to use, modify, and expand it.
If you like it, don't hesitate to buy me coffee!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/U3J11ZXS37)
