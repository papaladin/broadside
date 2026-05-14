# Broadside

**Caribbean Pirates** – a turn-based strategy game inspired by *Sid Meier’s Pirates!*  

Sail the Caribbean, trade, fight, upgrade your ship, and build your reputation in the golden age of piracy.

---

# 🎮 Features

- ⚓ Explore an interactive map with 11 ports across 5 factions
- 🛒 Trade & Missions – deliver goods, escort merchants, hunt pirates
- ⚔️ Turn-based naval combat – broadside, precision shots, grappling, and evading
- 🏴 Faction reputation – ally with nations or turn pirate
- 🔧 Ship upgrades – reinforced hull, extra cannons, figureheads, and more
- 👥 Crew management – hire sailors, maintain morale, pay wages
- 🌪️ Random events – storms, mutinies, treasures, and patrols
- 💾 Save / Load via browser `localStorage`

---

# 🧱 Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 (functional components, hooks) |
| State | `useReducer` in a single immutable state tree |
| Styling | Inline CSS (no external libraries) |
| Transpilation | Babel standalone (JSX in-browser) |
| Storage | `localStorage` |
| Testing | Custom browser-native test harness |

Everything runs entirely in the browser — no build step, no server.

---

# 🚀 Running the Game

You can either play directly on github (https://papaladin.github.io/broadside/) or play locally on your machine using the method below.

## 1. Clone the Repository

```bash
git clone https://github.com/papaladin/broadside.git
cd Broadside
```

## 2. Open the Project

Open the folder in VS Code (or any editor).

## 3. Launch a Local Server

A local server is required for ES modules / Babel.

### VS Code Live Server

Right-click `index.html` → **Open with Live Server**

### Python

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Node

```bash
npx serve .
```

## 4. Play!

Open the game in your browser.

> ⚠️ Opening `index.html` directly with `file://` will not work because of browser CORS restrictions.

---

# 🧪 Running the Tests

## Steps

1. Start your local server
2. Open `tests/tests.html` in your browser
3. Tests run automatically

Results are displayed with:

- Pass/fail counts
- Filters
- Error details

## Test Coverage

- **Unit tests** – pure functions in `logic.js`
- **Reducer tests** – state transitions in `engine.js`
- **Integration tests** – voyages, missions, save/load
- **Scenario tests** – simulated user flows
- **UI smoke tests** – rendering validation
- **Edge case & regression tests**

Use the **Copy Failing Details** button to export troubleshooting information.

---

# 📁 Project Structure

```text
Broadside/
├── index.html          # Entry point
├── data.js             # Game constants (ports, ships, factions, etc.)
├── logic.js            # Pure game logic functions
├── engine.js           # State management (reducer, actions, initial state)
├── ui.jsx              # Reusable UI components & theme tokens
├── screens.jsx         # All game screens
├── App.jsx             # Root React component (router + HUD)
├── architecture.md     # Full architecture documentation
├── README.md           # This file
└── tests/
    ├── tests.html      # Test runner & utilities
    └── tests.js        # Test suite definitions
```

---

# 📖 Documentation

For a deep dive into:

- Architecture
- Data flow
- State shape
- Game mechanics

See:

```text
architecture.md
```

---

# 🐛 Known Issues

- Fame exists in the state but has no gameplay effect yet
- Some UI tests are still being stabilised

---

# 📜 License

This project is open-source.

Feel free to use, modify, and expand it.

---

# 🏴☠️ Hoist the Colours!

Fair winds and following seas, Captain.