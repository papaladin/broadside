# Broadside
**A turn-based pirate strategy game set in the 17th-century Caribbean.**
Trade, scheme, and fight your way to fortune — but the world keeps score.

---

## 🎮 Features

### Your Crew Has a Story
- **Every crew member is unique, and they change over time** — Names, roles, traits, scars, and days at sea all accumulate into a biography you can read at any point. No two crews look alike after a few months at sea.
- **Losing them hurts on purpose** — When a crew member dies, the game tells you exactly who. You watched them become someone. And death isn't the only way to lose them — neglect morale long enough, and they'll leave on their own terms. Some losses are the enemy's fault. Some are yours.
- **The Captain's Log reads like a story** — Every battle, death, betrayal, and lucky escape is recorded in full. Not just what happened, but who was there and how they felt about it. It's meant to be read.

### A World That Reacts to You
- **24 ports across 5 rival factions** — Each with its own economy, services, and politics. Your reception shifts based on your reputation, your fame, your infamy, and what's sitting in your hold.
- **Port gossip** — Every visit generates a gossip screen: rumors and whispers shaped by who you are right now. Famous captains hear different things than unknowns. Smugglers get different looks than merchants.
- **Reputation with real weight** — Betray a faction and their ports close to you. Earn their trust and get better prices, cheaper repairs, and exclusive missions. Standing decays over time; you have to keep earning it.
- **Hidden ports that have to be found** — Four ports don't appear on your map until you've earned them. Some require fame. Some require infamy. One requires finding a dying sailor's last secret.

### Logistics Are the Game
- **The economy isn't optional** — Crew wages drain gold every day at sea. Food and water run out. Even a player who only wants to fight still needs to sell plunder, stock provisions, and keep money flowing. The Caribbean doesn't wait for you to get comfortable.
- **14 tradeable goods with real variance** — Prices shift by port and supply. A full hold slows your ship. Buying smart is a skill of its own.
- **Contraband pays well, until it doesn't** — Tobacco and slaves are lucrative. They're also illegal. Patrols strip cargo and add to your infamy. The more notorious you become, the more patrols you attract.

### Combat With Consequences
- **Turn-based naval combat** — Four actions: broadside, precision shot, grappling, evasion. There's no always-correct answer — it depends on your ship, your crew count, and how much risk you can absorb.
- **Every fight costs something** — Hull damage, crew loss, morale drop. Win the battle and you still have problems. Dead crew can't be replaced at sea. A demoralized crew fights worse next time.
- **Intercept screen before every battle** — Negotiate, bribe, flee, or surrender before a single cannon fires. Sometimes the fight isn't worth it.
- **Plunder decisions** — After boarding: take the cargo and split the gold, or sink her and take it all. One fills your hold. The other might deepen your infamy.

### A Career That Accumulates
- **Fame and infamy as parallel tracks** — Fame unlocks bigger ships and better-paying missions. Infamy unlocks pirate ports and attracts more patrols. They pull in different directions. You can't have everything.
- **11 ships across 5 tiers** — From a dinghy to a Ship of the Line. Bigger ships require more crew, more provisions, more gold to sustain — and fame to even purchase.
- **5 starting scenarios** — Different factions, starting ports, and opening problems. Each drops you into a different corner of the Caribbean with a different hand to play.
- **Random events at sea** — Storms, shipwrecks, distressed merchants, mutinies, treasure maps. About one in ten days at sea brings something unplanned.

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