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
- **Intercept screen before every battle:**  Negotiate, bribe, flee, or surrender before a single cannon fires. Sometimes the fight isn't worth it.
- **Turn-based naval combat:**  Fire at your enemy, maneuver to change distance, try boarding them to bring the fight on their deck. There's no always-correct answer -- it depends on your ship, your crew count, and how much risk you can absorb.
- **Every fight costs something:**  Hull damage, crew loss, morale drop. Win the battle and you still have problems. Dead crew can't be replaced at sea. A demoralized crew wont be eager to board the next enemy.
- **Plunder decisions:**  After boarding, browse the enemy's cargo and pick what to take. Your hold space is limited so choose wisely.

### A Career That Accumulates
- **Fame and infamy as parallel tracks:**  Fame unlocks bigger ships and better-paying missions. Infamy unlocks pirate ports and attracts more patrols. They pull in different directions. You can't have everything.
- **11 ships across 5 tiers:**  From a dinghy to a Ship of the Line. Bigger ships require more crew, more provisions, more gold to sustain and fame to be allowed to purchase them.
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

# Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| UI             | React 18 (functional components, hooks)         |
| State          | `useReducer` with a single immutable state tree |
| Styling        | Inline CSS (no external libraries)              |
| Transpilation  | Babel standalone (JSX runs in-browser)          |
| Storage        | `localStorage` (via `storage.js`)               |
| Testing        | Custom browser-native test harness              |

Everything runs entirely in the browser or as a PWA on your phone if you want.

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
| **Equipment combos** | `tools/sim-equipment.html` | Equipment combination analysis and stat deltas |
| **Combat AI simulator** | `tools/sim-combatAI.html` | AI action distribution and balance validation |

Tests run automatically in the browser.

---

# Project Structure

The complete file tree is documented in [the architecture reference](docs/architecture.md). The root-level runtime modules are:

```text
broadside/
├── index.html                         ← entry point, <script> load order
├── data.js                            ← window.D — game constants
├── data_text.js                       ← extends window.D — text/content constants
├── logic_*.js                         ← window.L — pure game rules
├── storage.js                         ← extends window.L — save/load + persistence
├── generators.js                      ← window.G — procedural content generation
├── engine_*.js                        ← window.E — reducer/domain modules
├── ui.jsx / icons.jsx                 ← window.UI — reusable UI and icons
├── screens_*.jsx                      ← window.S — player-facing screens
└── App.jsx                            ← root UI, routing, debug tools
```

---

# Documentation

For a deep dive into architecture, data flow, state shape, and game mechanics, see:

- [Architecture](docs/architecture.md) — System design, data flow, module roles
- [Player Guide](docs/player_guide.md) — How to play, mechanics, strategies
- [Roadmap](docs/roadmap.md) — Planned features and priorities
- Module specs: [Data](docs/specs_data.md) | [Engine](docs/specs_engine.md) | [Logic](docs/specs_logic.md) | [Generators](docs/specs_generators.md) | [JSX](docs/specs_jsx.md) | [Storage](docs/specs_storage.md)

---

# License AGPL 3.0

This project is open-source. Feel free to use, modify, and expand it.
If you like it, don't hesitate to buy me coffee!

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/U3J11ZXS37)