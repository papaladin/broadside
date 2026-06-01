# 🛠️ Broadside: Developer Guide

*Architecture, Setup, and Contribution Rules*

---

## 📌 **Overview**

Broadside is a **turn-based pirate trading and naval combat game** built with:

- **Vanilla JavaScript** (ES6+) for core logic.
- **React** (via Babel) for UI components.
- **No build step** — runs directly in the browser.

This guide covers:

1. [Setup](#-setup)
2. [Project Structure](#-project-structure)
3. [Code Style](#-code-style)
4. [Contribution Rules](#-contribution-rules)
5. [Testing](#-testing)

---

## 🚀 **Setup**

### **Prerequisites**

- Modern browser (Chrome, Firefox, Edge).
- Git (for contributing).
- Node.js (optional, for linting/testing).

### **Quick Start**

1. **Clone the Repository**:
  ```bash
   git clone https://github.com/papaladin/broadside.git
   cd broadside
  ```
2. **Open `index.html**`:
  - No server needed! Just open `index.html` in your browser.
  - For development, use a local server (e.g., `python -m http.server`).

### **Project Structure**

```
broadside/
├── index.html              # Entry point
├── README.md               # Project overview
├── docs/                   # Documentation (synced to wiki)
│   ├── player_guide.md     # Player-facing guide
│   ├── developer_guide.md  # This file
│   ├── roadmap.md          # Feature roadmap
│   ├── architecture.md     # High-level design
│   └── specs_*.md          # Module specifications
│
├── data.js                 # Game constants (PORTS, SHIPS, FACTIONS, etc.)
├── logic.js                # Pure functions (no side effects)
├── generators.js           # Runtime content generation (missions, enemies, etc.)
│
├── engine_core.js          # Core infrastructure (A, initialState, reducer dispatcher)
├── engine_port.js          # Port domain (market, missions, crew, shipyard)
├── engine_voyage.js        # Voyage domain (sailing, ADVANCE_DAY, wind)
├── engine_combat.js        # Combat domain (encounters, battles, plunder)
│
├── screens_port.jsx        # Port UI (PortScreen, MarketScreen, ShipyardScreen, etc.)
├── screens_voyage.jsx      # Voyage UI (MapScreen, SailingScreen) and  Combat UI (EventScreen, InterceptScreen, BattleScreen, PlunderScreen)
│
├── styles.css              # Global styles
├── ui.jsx                  # Reusable UI components (Btn, Panel, Bar, etc.)
└── App.jsx                 # Main React app (entry point)
```

---

## 🗂️ **Module Specifications**

All modules are documented in the `docs/` folder. Key files:


| Module             | File                 | Description                                                         |
| ------------------ | -------------------- | ------------------------------------------------------------------- |
| **Data**           | `data.js`            | Game constants (ports, ships, factions, goods, etc.). **No logic.** |
| **Logic**          | `logic.js`           | Pure functions (travel days, combat resolution, reputation, etc.).  |
| **Generators**     | `generators.js`      | Runtime content generation (missions, enemies, markets).            |
| **Engine Core**    | `engine_core.js`     | Action constants, initial state, reducer dispatcher.                |
| **Engine Port**    | `engine_port.js`     | Port actions (REPAIR, BUY_SHIP, HIRE_CREW, etc.).                   |
| **Engine Voyage**  | `engine_voyage.js`   | Sailing logic (SAIL_TO, ADVANCE_DAY, wind, provisions).             |
| **Engine Combat**  | `engine_combat.js`   | Encounters, battles, plunder (INTERCEPT_*, BATTLE_ACTION, etc.).    |
| **Screens Port**   | `screens_port.jsx`   | Port UI components (PortScreen, MarketScreen, etc.).                |
| **Screens Voyage** | `screens_voyage.jsx` | Voyage UI components (MapScreen, SailingScreen) & Combat UI components (EventScreen, InterceptScreen, etc.).  .                    |


---

## 📜 **Code Style**

### **General Rules**

- **Indentation**: 2 spaces (no tabs).
- **Line Length**: Max 100 characters.
- **Semicolons**: Required.
- **Quotes**: Single quotes (`'`) for strings, double quotes (`"`) for JSON.
- **Braces**: Same line for single-line blocks, new line for multi-line.

### **Naming Conventions**


| Type                    | Convention           | Example                                |
| ----------------------- | -------------------- | -------------------------------------- |
| **Variables/Functions** | camelCase            | `calculateTravelDays`, `maxHull`       |
| **Constants**           | SCREAMING_SNAKE_CASE | `MAX_CREW`, `BASE_PRICE`               |
| **Files**               | kebab-case           | `engine_port.js`                       |
| **React Components**    | PascalCase           | `PortScreen`, `BattleLog`              |
| **CSS Classes**         | kebab-case           | `.port-screen`, `.battle-log`          |


### **Comments**

- **JSDoc**: Use for all exported functions.
  ```javascript
  /**
   * Calculates travel days between two ports.
   * @param {string} fromPort - Starting port key.
   * @param {string} toPort - Destination port key.
   * @param {Object} state - Current game state.
   * @returns {number} Days required to travel.
   */
  const travelDays = (fromPort, toPort, state) => { ... };
  ```
- **Inline Comments**: Use sparingly, only for non-obvious logic.
  ```javascript
  // Morale decay: -1/day if below 30
  if (state.crew.morale < 30) newMorale = Math.max(0, newMorale - 1);
  ```

### **Git Commits**

- **Message Format**: `[module] description` (e.g., `[engine] fix plunder gold calculation`).
- **Scope**: Use `fix:`, `feat:`, `refactor:`, `docs:`, `chore:`.
- **Body**: Explain **why** (not just what).

---

## 🤝 **Contribution Rules**

### **How to Contribute**

1. **Fork the Repository**.
2. **Create a Feature Branch**: `git checkout -b feat/your-feature`.
3. **Commit Changes**: Follow [code style](#code-style).
4. **Push to Fork**: `git push origin feat/your-feature`.
5. **Open a PR**: Target the `main` branch.

### **PR Requirements**

- **Tests Pass**: Run `npm test` (if available).
- **No Console Errors**: Test in Chrome/Firefox.
- **Code Review**: Address all feedback.
- **Update Docs**: If adding/removing features, update `docs/`.
- **Squash Commits**: Rebase to a single commit before merging.

### **What to Contribute**

- **Bug Fixes**: Open an issue first, then submit a PR.
- **New Features**: Discuss in [Discussions](https://github.com/papaladin/broadside/discussions) before coding.
- **Documentation**: Improvements to `docs/` are always welcome.
- **Balancing**: Propose changes in an issue first.

---

## 🧪 **Testing**

### **Manual Testing**

1. **Start a New Game**: Test all scenarios (New Captain, Pirate King, etc.).
2. **Port Actions**: Buy/sell goods, repair, hire crew, take missions.
3. **Sailing**: Test short/long voyages, wind effects, provisions.
4. **Combat**: Test all actions (Broadside, Precision, Grapple, Evade).
5. **Edge Cases**:
  - Run out of food/water.
  - Lose all crew.
  - Enter a hostile port.
  - Carry contraband into a lawful port.

### **Automated Testing** *(Future)*

- **Goal**: Add Jest/React Testing Library for unit/integration tests.
- **Current**: Manual testing only.

---

## 📊 **Performance Tips**

- **Avoid Heavy Loops**: `ADVANCE_DAY` runs frequently; keep it lean.
- **Memoize Calculations**: Cache results for `travelDays`, `getShipStats`.
- **Minimize DOM Updates**: Batch React state updates in screens.
- **Use `Math.random` Sparingly**: Prefer `L.roll()` or `G.pickRandom()`.

---

## 🔗 **Useful Links**

- [GitHub Repository](https://github.com/papaladin/broadside)
- [Issues](https://github.com/papaladin/broadside/issues)
- [Discussions](https://github.com/papaladin/broadside/discussions)
- [Wiki](https://github.com/papaladin/broadside/wiki) *(auto-synced from `docs/`)*