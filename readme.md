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
2. **Strict layer separation.** Data → Logic → Generators → Engine → UI. Each layer only reads from the layers above it. Pure functions in `logic_*.js`. All randomness in `generators.js`. All state transitions in the engine reducers.
3. **Narrative as a presentation layer.** Gossip, captain's log, crew biographies, journal — these *describe* what happened, they don't *cause* anything. Gameplay systems own the consequences.
4. **No build step.** Everything runs in the browser via React + Babel-standalone CDN. Edit a file, refresh, see it.

The dependency direction is strictly downward: `data.js → logic_*.js → generators.js → engine_*.js → ui.jsx → screens_*.jsx → App.jsx`.

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
| **Balance dashboard** | `tools/tests_balance.html` | Reachability, economy, combat, patrol, trade, event, gossip checks |
| **Economy simulator** | `tools/sim.html` | Monte Carlo economy simulation (6 strategies) |
| **Crew lifecycle sim** | `tools/crew_sim.html` | Crew survival curves across 6 playstyles |
| **Bio/log analyser** | `tools/crew_bio_log_sim.html` | Bio uniqueness and log pattern detection |
| **Equipment combos** | `tools/equipment_combo_analyzer.html` | Equipment combination analysis and stat deltas |

Tests run automatically in the browser.

---

# Project Structure

```text
Broadside/
broadside/
├── index.html                         ← entry point, <script> load order
├── data.js                            ← window.D — game constants
├── data_text.js                       ← extends window.D — text/content constants
├── logic_core.js                      ← window.L — core pure helpers
├── logic_economy_crew.js              ← window.L — crew, economy, cargo, reputation
├── logic_travel_events.js             ← window.L — travel, sea position, events, patrols
├── logic_combat_encounter.js          ← window.L — B11 combat resolvers + encounter helpers
├── storage.js                         ← extends window.L — save/load + tutorial state
├── generators.js                      ← window.G — RNG: missions, markets, crew, enemies, gossip, bios
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
├── screens_port.jsx                   ← window.S — PortScreen, StatusScreen, JournalScreen
├── screens_shipyard.jsx               ← window.S — ShipyardScreen
├── screens_crew.jsx                   ← window.S — CrewScreen
├── screens_market.jsx                 ← window.S — MarketScreen
├── screens_voyage.jsx                 ← window.S — MapScreen, SailingScreen
├── screens_combat.jsx                 ← window.S — EventScreen, InterceptScreen, BattleScreen, PlunderScreen
├── App.jsx                            ← root: HUD, screen router, ErrorBoundary, DebugPanel
│
├── docs/
│   ├── architecture.md                ← system architecture, data flow, state shape
│   ├── readme.md                      ← project/documentation entry point
│   ├── player_guide.md                ← player-facing mechanics/reference
│   ├── developer_guide.md             ← development conventions/workflows
│   ├── roadmap.md                     ← development roadmap and planning space
│   ├── specs_data.md                  ← data/constants specification
│   ├── specs_engine.md                ← engine/reducer/state specification
│   ├── specs_logic.md                 ← logic-layer specification
│   ├── specs_generators.md            ← generator specification
│   ├── specs_jsx.md                   ← React/JSX/UI specification
│   ├── Home.md                        ← wiki home
│   └── _Sidebar.md                    ← wiki sidebar
│
├── tests/
│   ├── tests.html                     ← main test runner & utilities
│   ├── tests_integration.html         ← integration/load-order/dependency tests
│   ├── tests_helpers.js               ← shared test helpers
│   ├── tests_logic.js                 ← logic + generator unit tests
│   ├── tests_engine.js                ← reducer/engine tests
│   ├── tests_robustness.js            ← robustness tests for flaky/edge inputs
│   └── tests_ui.js                    ← UI smoke & edge-case tests
│
└── tools/
    ├── carreer-simulator.html         ← career/progression simulator
    ├── combine_source.py              ← repository/export utility
    ├── crew_bio_log_sim.html          ← crew bio/log redundancy analyzer
    ├── crew_sim.html                  ← crew lifecycle simulator
    ├── equipment_combo_analyzer.html  ← equipment combination analyzer
    ├── gamedesignin3min.html          ← game-design reference / learning tool
    ├── icon_preview.html              ← SVG icon preview tool
    ├── pill_tester.html               ← UI pill/component testing tool
    ├── port-preview-vignette.html     ← port vignette / silhouette preview
    ├── screenshots_builder.html       ← screenshot generator/builder
    ├── ship-preview.html              ← ship sprite preview tool
    ├── sim.html                       ← economy playtest simulator (Monte Carlo)
    ├── sound_tester.html              ← sound preparation/testing tool
    └── tests_balance.html             ← balance and tuning dashboard
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
