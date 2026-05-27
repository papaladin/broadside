# **Broadside: Complete Wiki Setup and Documentation Refactoring Guide**

*Single, unified guide for setting up the GitHub Wiki, refactoring existing docs, and adding new pages.*

---

---

---

## **🎯 Overview**

This guide combines **three goals** into one workflow:

1. **Set up a GitHub Wiki** for `papaladin/broadside` with GitHub Actions auto-sync.
2. **Refactor existing `.md` files** (`architecture.md`, `specs*.md`) to avoid overlap.
3. **Add new wiki pages** (user guides, contributing docs, etc.).

**Estimated Time**: ~1-2 hours (depending on how much content you move).

---

---

---

## **📌 Phase 1: Set Up the Wiki and GitHub Actions**

**Goal**: Create the wiki structure and automate syncing from your repo to the wiki.

---

### **Step 1: Create the GitHub Actions Workflow**

1. **Create the workflow directory** in your local repo:
  ```bash
   mkdir -p .github/workflows
  ```
2. **Create the workflow file** at `.github/workflows/sync-wiki.yml` with this content:
  ```yaml
   name: Sync Wiki with Repo

   on:
     push:
       branches: [ main ]
       paths:
         - '**.md'  # Only run if .md files change

   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
           with:
             fetch-depth: 0  # Needed to fetch the wiki repo later

         - name: Clone wiki repo
           run: |
             git clone https://github.com/papaladin/broadside.wiki.git wiki
             cd wiki
             git config user.name "GitHub Actions"
             git config user.email "actions@github.com"

         - name: Copy .md files to wiki
           run: |
             # Copy existing docs
             cp ../architecture.md wiki/Architecture.md
             cp ../specs_logic.md wiki/API-Reference.md
             cp ../specs_engine.md wiki/Engine-Specs.md
             cp ../specs_generators.md wiki/Generators-Specs.md
             cp ../roadmap.md wiki/Roadmap.md
             cp ../tasks-T1fix.md wiki/Tasks.md

             # Copy new wiki pages (will be created later)
             cp ../docs/Gameplay-Basics.md wiki/Gameplay-Basics.md 2>/dev/null || true
             cp ../docs/Tips-and-Strategies.md wiki/Tips-and-Strategies.md 2>/dev/null || true
             cp ../docs/Lore.md wiki/Lore.md 2>/dev/null || true
             cp ../docs/Contributing.md wiki/Contributing.md 2>/dev/null || true
             cp ../docs/Setting-Up.md wiki/Setting-Up.md 2>/dev/null || true
             cp ../docs/Testing.md wiki/Testing.md 2>/dev/null || true

         - name: Commit and push to wiki
           run: |
             cd wiki
             git add .
             git commit -m "Sync docs from repo (${{ github.sha }})" || true
             git push
  ```
3. **Commit and push the workflow**:
  ```bash
   git add .github/workflows/sync-wiki.yml
   git commit -m "Add GitHub Actions workflow to sync wiki"
   git push origin main
  ```

---

### **Step 2: Enable the Wiki on GitHub**

1. Go to your repo: `https://github.com/papaladin/broadside`.
2. Click the **"Wiki"** tab at the top.
3. If prompted, click **"Create the first page"** to enable the wiki.

---

### **Step 3: Create the Wiki Homepage and Sidebar**

1. **Create `Home.md**` in the wiki with this content:
  ```markdown
   # 🏴‍☠️ Broadside
   *A turn-based pirate adventure game set in the Caribbean (1695).*

   ---
   ## 🌍 Overview
   Broadside is a **single-player, turn-based** game where you take on the role of a pirate captain, building your fleet, trading goods, completing missions, and battling rivals to become the most notorious captain in the New World.

   [**Play Now**](https://papaladin.github.io/broadside/) |
   [**Documentation**](#documentation) |
   [**Contributing**](#contributing)

   ---
   ## 🚀 Quick Start
  ```
  1. **Clone the repo**:
    ```bash
     git clone https://github.com/papaladin/broadside.git
    ```
  2. **Open `index.html**` in a browser (or run `npm run dev` for development).
  3. **Start a new game** from the **Start Screen**.
    - &nbsp;
     📖 Documentation

    | **Category**      | **Page**                             | **Description**                                   |
    | ----------------- | ------------------------------------ | ------------------------------------------------- |
    | **Architecture**  | [Architecture](Architecture)         | High-level design of the game.                    |
    | **API Reference** | [API Reference](API-Reference)       | Technical specs for functions/modules.            |
    | **Engine**        | [Engine Specs](Engine-Specs)         | Details on the game engine and reducer.           |
    | **Generators**    | [Generators Specs](Generators-Specs) | How missions, enemies, and markets are generated. |
    | **Roadmap**       | [Roadmap](Roadmap)                   | Planned features and priorities.                  |
    | **Tasks**         | [Tasks](Tasks)                       | Open tasks and issues.                            |

    - &nbsp;
     🎮 Gameplay Guide  
    [Gameplay Basics](Gameplay-Basics) – Movement, combat, missions.  
    [Tips and Strategies](Tips-and-Strategies) – Best practices for trading, combat, and reputation.  
    [Lore](Lore) – Backstory of the game world.
    - &nbsp;
     🛠️ Development  
    [Contributing](Contributing) – How to contribute to the project.  
    [Setting Up](Setting-Up) – Local development setup.  
    [Testing](Testing) – How to test the game.  
    `
2. **Create `_Sidebar.md**` in the wiki with this content:
  ```markdown
   - [[Home]]
   - **📖 Documentation**
     - [[Architecture]]
     - [[API Reference]]
     - [[Engine Specs]]
     - [[Generators Specs]]
     - [[Roadmap]]
     - [[Tasks]]
   - **🎮 Gameplay**
     - [[Gameplay Basics]]
     - [[Tips and Strategies]]
     - [[Lore]]
   - **🛠️ Development**
     - [[Contributing]]
     - [[Setting Up]]
     - [[Testing]]
  ```

---

### **Step 4: Test the Workflow**

1. Make a small change to one of your `.md` files (e.g., add a test line to `architecture.md`).
2. Commit and push:
  ```bash
   git add architecture.md
   git commit -m "Test: Update architecture.md"
   git push origin main
  ```
3. Go to `https://github.com/papaladin/broadside/actions` and verify the workflow runs successfully.
4. Check the wiki to ensure the change appears.

---

---

---

## **📌 Phase 2: Refactor Existing Documentation**

**Goal**: Split content between `architecture.md` (high-level) and `specs*.md` (low-level) to avoid overlap.

---

### **Step 1: Understand the Division of Responsibilities**


| **File**              | **Purpose**                                                           | **Content Types**                                                              |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `architecture.md`     | High-level design and system overviews.                               | Game overview, core systems, data flow, module descriptions, design decisions. |
| `specs_logic.md`      | Technical reference for pure logic functions (`logic.js`).            | Function signatures, parameters, return values, examples, dependencies.        |
| `specs_engine.md`     | Technical reference for state management (`engine.js`).               | Action cases, input/output, detailed logic, dependencies.                      |
| `specs_generators.md` | Technical reference for runtime content generation (`generators.js`). | Function signatures, parameters, return values, examples, dependencies.        |


---

### **Step 2: Refactor `architecture.md**`

#### **What to KEEP in `architecture.md`:**

- **Game Overview** (e.g., "Broadside is a turn-based pirate game...").
- **Core Systems** (e.g., "The Combat System is turn-based...") – **High-level descriptions only**.
- **Data Flow** (e.g., "Actions are dispatched to the reducer...").
- **Module Descriptions** (e.g., "logic.js contains pure functions...") – **Brief descriptions only**.
- **Design Decisions** (e.g., "We chose a reducer pattern for state management...").
- **File Structure** (e.g., "App.jsx is the root component...").
- **Key Concepts** (e.g., "Reputation affects mission rewards...") – **High-level explanations only**.

#### **What to MOVE to `specs*.md`:**

- **Function signatures** (e.g., `travelDays(fromPort, toPort, state)`).
- **Parameter descriptions** (e.g., `@param {object} state - The current game state`).
- **Return value descriptions** (e.g., `@returns {number} The number of days`).
- **Code examples** (e.g., `travelDays("portRoyal", "tortuga", state)`).
- **Detailed logic explanations** (e.g., "This function calculates distance using `Math.hypot`...").
- **Dependencies** (e.g., "Uses `window.DATA.PORTS`").

#### **How to Refactor:**

1. Open `architecture.md` and **create a new file** called `architecture_new.md`.
2. **Copy only the high-level content** (from the "KEEP" list above) to `architecture_new.md`.
3. For **each low-level section** (from the "MOVE" list above):
  - Copy it to the **appropriate `specs*.md` file** (`specs_logic.md`, `specs_engine.md`, or `specs_generators.md`).
  - **Reformat it** to match the style of the `specs*.md` files (e.g., use `###` for headings, add parameter tables).
  - **Add context** (e.g., "Part of the Travel System. Used in `engine.js` for the `SAIL_TO` action.").
4. **Replace `architecture.md**` with `architecture_new.md`:
  ```bash
   mv architecture.md architecture_old.md  # Backup
   mv architecture_new.md architecture.md
  ```

---

### **Step 3: Example Refactoring**

#### **Before (in `architecture.md`):**

```markdown
## Travel System
The game uses a turn-based travel system where players click on ports to sail there.
The `travelDays` function in `logic.js` calculates the number of days required to travel between ports.
It takes three parameters: `fromPort`, `toPort`, and `state`.
The function uses the Euclidean distance between port coordinates, ship speed, morale, and wind to calculate the days.
Example: `travelDays("portRoyal", "tortuga", state)` returns the number of days.
```

#### **After:**

- **In `architecture.md` (keep high-level):**
  ```markdown
  ## Travel System
  The game uses a **turn-based travel system** where players click on ports to sail there.
  Travel time depends on:
  - **Distance** between ports.
  - **Ship speed** (faster ships = shorter travel time).
  - **Morale** (low morale = slower travel).
  - **Wind** (favorable wind = faster, opposing wind = slower).
  - **Hold load** (heavier cargo = slower).

  For a detailed breakdown of the travel calculations, see the [API Reference (Logic)](API-Reference#traveldays).
  ```
- **In `specs_logic.md` (move low-level details):**
  ```markdown
  ### `travelDays(fromPort, toPort, state)`
  Calculates the number of days required to travel between two ports.

  **Parameters:**
  - `fromPort` (string): The key of the starting port (e.g., "portRoyal").
  - `toPort` (string): The key of the destination port (e.g., "tortuga").
  - `state` (object): The current game state, including ship stats and wind.

  **Returns:** (number) The number of days required (minimum 1).

  **Dependencies:**
  - `window.DATA.PORTS`: For port coordinates.
  - `getShipStats(state)`: To get the ship’s speed.

  **Logic:**
  1. Calculates Euclidean distance between `fromPort` and `toPort` coordinates using `Math.hypot`.
  2. Divides distance by `(ship.speed * 4)` to get base days.
  3. Applies modifiers:
     - **Morale**: `-1 day` if morale `< 50`, `-1 day` if morale `< 30`.
     - **Wind**: `-1 day` if wind is favorable, `+1 day` if opposing.
     - **Hold load**: Uses `getHoldLoadPct` and `getHoldSpeedMultiplier` to adjust for cargo weight.
  4. Returns the minimum of `1` or the calculated days.

  **Example:**
  ```js
  travelDays("portRoyal", "tortuga", state); // Returns 3
  ```
  **Part of:** Travel System.  
  **Used in:** `engine.js` (for the `SAIL_TO` and `ADVANCE_DAY` actions).
  ---
  [← Back to Architecture](Architecture) | [Edit on GitHub](https://github.com/papaladin/broadside/edit/main/specs_logic.md)
  ```

  ```

---

### **Step 4: Add Cross-References**

1. In each `specs*.md` file, add a **link back to `architecture.md**` at the bottom:
  ```markdown
   ---
   [← Back to Architecture](Architecture) | [Edit on GitHub](https://github.com/papaladin/broadside/edit/main/specs_logic.md)
  ```
2. In `architecture.md`, add a **Cross-References** section at the bottom:
  ```markdown
   ## 📚 Cross-References
   For detailed technical specifications, see:
   - [API Reference (Logic)](API-Reference)
   - [Engine Specs](Engine-Specs)
   - [Generators Specs](Generators-Specs)
  ```

---

---

---

## **📌 Phase 3: Add New Wiki Pages**

**Goal**: Create user-facing and development documentation for the wiki.

---

### **Step 1: Create a `docs/` Folder (Optional but Recommended)**

To keep your repo organized, create a `docs/` folder for new wiki pages:

```bash
mkdir -p docs
```

---

### **Step 2: Create New Wiki Pages**

Create the following files in the `docs/` folder (or directly in the root if you prefer). These will be **copied to the wiki by the GitHub Actions workflow**.

#### **1. `docs/Gameplay-Basics.md**`

```markdown
# **Gameplay Basics**
*How to play Broadside.*

---
## 🌍 Movement
- Click on a **port** on the map to sail there.
- Travel time depends on:
  - **Distance** between ports.
  - **Ship speed** (faster ships = shorter travel time).
  - **Wind direction** (favorable wind = faster, opposing wind = slower).
  - **Hold load** (heavier cargo = slower).
- **Provisions**: Your crew consumes **food and water** daily. Run out, and morale drops!

---
## ⚔️ Combat
When you encounter an enemy (e.g., navy patrol, pirate, merchant), you can:
- **Fight**: Engage in combat.
- **Flee**: Attempt to escape (speed check vs. enemy).
- **Parley**: Negotiate (requires reputation >= 30).
- **Bribe**: Pay gold to avoid conflict (blocked if infamy >= 50).
- **Surrender**: Give up (may result in penalties).

### Combat Actions
| **Action**   | **Description**                          | **Best Used When**                     |
|--------------|------------------------------------------|----------------------------------------|
| Broadside    | Full cannon volley. Reliable damage.    | You have more cannons than the enemy. |
| Precision    | Aimed shot. 70% hit chance, massive damage. | Enemy has low hull.                  |
| Grapple      | Board the enemy ship.                   | You have more crew and higher morale. |
| Evade        | Attempt to flee. Reduced incoming damage. | Enemy has more cannons or crew.       |

---
## 📜 Missions
- **Accept missions** from the **Mission Board** in ports.
- **Types of missions**:
  - **Escort**: Protect a merchant ship.
  - **Patrol**: Clear hostile vessels from an area.
  - **Combat**: Hunt down a specific enemy.
  - **Trade**: Deliver goods to another port.
  - **Smuggle**: Transport illegal goods (risk of patrol interception).
  - **Assault**: Attack and capture a port.
- **Rewards**: Gold, fame, reputation, and sometimes items.

---
## 💰 Trading
- **Buy low, sell high**: Prices vary by port and faction.
- **Market availability**: Some goods are **rare** in certain ports.
- **Illegal goods**: Smuggling tobacco, slaves, or weapons increases **infamy**.
- **Hold capacity**: Limited by your ship’s **hold size**. Upgrade your ship for more space!

---
[← Back to Home](Home) | [Edit on GitHub](https://github.com/papaladin/broadside/edit/main/docs/Gameplay-Basics.md)
```

---

#### **2. `docs/Tips-and-Strategies.md**`

```markdown
# **Tips and Strategies**
*How to succeed in Broadside.*

---
## 🏆 General Tips
- **Save often**: Use the **Save Game** button in port to avoid losing progress.
- **Check the map**: Hover over ports to see **distance, reputation, and services**.
- **Manage provisions**: Always carry **extra food and water** for long voyages.
- **Upgrade your ship**: Better ships = more cannons, crew, and hold capacity.

---
## ⚔️ Combat Tips
- **Broadside**: Best for **reliable damage**. Use when you outgun the enemy.
- **Precision**: High risk, high reward. Use against **low-hull enemies** for massive damage.
- **Grapple**: Best when you have **more crew** and **higher morale** than the enemy.
- **Flee**: Use if the enemy is **stronger** (more cannons/crew). Success depends on **ship speed**.
- **Morale matters**: Low morale = **weaker combat performance**. Keep morale high with **rum or successful battles**.

---
## 💰 Trading Tips
- **Buy low, sell high**: Check prices in different ports.
- **Trade goods**: Focus on goods with **high profit margins** (e.g., spices, silk).
- **Smuggle contraband**: Illegal goods (tobacco, slaves) sell for **high prices** but increase **infamy**.
- **Hold space**: Sell cargo if your hold is **full** before buying more.

---
## 🤝 Reputation Tips
- **Higher reputation** = better mission rewards and **lower repair costs**.
- **Reputation decays** over time (every 2 days). Stay active in ports to maintain it.
- **At War (<10 rep)**: No services available. Avoid enemy ports!
- **Allied (>=80 rep)**: Discounts on repairs and **higher mission rewards**.

---
## ☠ Infamy Tips
- **Infamy** increases when you:
  - Smuggle **illegal goods**.
  - **Surrender** in combat.
  - **Abandon missions**.
- **Infamy >= 50**: **Bribe option is blocked**. Patrols will hunt you more aggressively.
- **Infamy >= 100**: **Legendary Outlaw**. Every faction considers you an enemy.

---
[← Back to Home](Home) | [Edit on GitHub](https://github.com/papaladin/broadside/edit/main/docs/Tips-and-Strategies.md)
```

---

#### **3. `docs/Lore.md**`

```markdown
# **Lore: The World of Broadside**
*The backstory and setting of Broadside.*

---
## 🌍 Setting: The Caribbean, 1695
The year is **1695**, and the **Golden Age of Piracy** is in full swing. The Caribbean is a lawless paradise for pirates, privateers, and freebooters, where **gold, glory, and infamy** await those bold enough to seize them.

The major powers of Europe—**England, Spain, France, and the Dutch Republic**—compete for control of the region’s vast wealth, while **pirates and privateers** prey on their ships, settlements, and treasure fleets. Amidst this chaos, you must **build your reputation**, **amass a fortune**, and **carve out your own legend**.

---
## 🏴‍☠️ Factions
| **Faction** | **Description**                                                                 | **Home Ports**               | **Allies**               | **Enemies**               |
|-------------|---------------------------------------------------------------------------------|------------------------------|--------------------------|---------------------------|
| English     | The dominant naval power in the Caribbean. Wealthy but arrogant.             | Port Royal, Kingston         | -                        | Spain, France, Pirates    |
| Spanish     | The oldest colonial power. Rich in silver but heavily fortified.           | Havana, Cartagena, Portobelo | -                        | England, Dutch, Pirates   |
| French      | Skilled sailors and traders. Often at odds with England.                      | Tortuga, Martinique          | -                        | England, Pirates          |
| Dutch       | Master traders with a strong naval presence.                                  | Curaçao, St. Eustatius       | -                        | Spain, Pirates            |
| Pirates     | Lawless freebooters. Enemies of all nations but allies to each other.         | Tortuga, Nassau, Providencia | -                        | England, Spain, France, Dutch |

---
## 🏝️ Notable Locations
- **Tortuga**: A lawless pirate haven off the coast of Hispaniola. The perfect place to **start your career**.
- **Port Royal**: The wealthiest English port in the Caribbean. A hub for **trade and gossip**.
- **Havana**: The heart of Spanish power in the New World. **Heavily fortified** and rich in silver.
- **Cartagena**: A formidable Spanish city. The **treasure fleet** assembles here before crossing the Atlantic.
- **Nassau**: A loosely governed English settlement in the Bahamas. Rapidly becoming a **pirate refuge**.

---
## 📜 Historical Context
Broadside is inspired by the **real-life Golden Age of Piracy (1650-1730)**, when pirates like **Blackbeard, Calico Jack, and Anne Bonny** ruled the Caribbean. The game blends **historical accuracy** with **fantasy**, allowing you to rewrite history as the most notorious captain of them all.

---
[← Back to Home](Home) | [Edit on GitHub](https://github.com/papaladin/broadside/edit/main/docs/Lore.md)
```

---

#### **4. `docs/Contributing.md**`

```markdown
# **Contributing to Broadside**
*How to contribute to the project.*

---
## 📥 Getting Started
1. **Fork the repo**:
   ```bash
   git clone https://github.com/papaladin/broadside.git
   cd broadside
```

2. **Install dependencies** (if any):
  ```bash
   npm install
  ```
3. **Run the game locally**:
  - Open `index.html` in a browser.
  - Or run `npm run dev` for development (requires Vite).

---

## 🛠️ How to Contribute

### Reporting Issues

- Open an issue on GitHub with:
  - A **clear title** (e.g., "Combat crash when grappling").
  - **Steps to reproduce**.
  - **Expected vs. actual behavior**.
  - **Screenshots** (if applicable).

### Suggesting Features

- Open an issue with:
  - A **detailed description** of the feature.
  - **Why it’s useful**.
  - **Possible implementation ideas** (if you have any).

### Submitting Pull Requests

1. **Create a branch**:
  ```bash
   git checkout -b feature/your-feature-name
  ```
2. **Make your changes**:
  - Follow the **existing code style**.
  - Add **JSDoc comments** to new functions.
  - Update **documentation** (e.g., `architecture.md`, `specs_*.md`).
3. **Test your changes**:
  - Play the game to ensure nothing is broken.
  - Check for **console errors**.
4. **Commit your changes**:
  ```bash
   git add .
   git commit -m "Add your commit message here"
  ```
5. **Push to your fork**:
  ```bash
   git push origin feature/your-feature-name
  ```
6. **Open a Pull Request**:
  - Go to `https://github.com/papaladin/broadside/pulls`.
  - Click **"New Pull Request"**.
  - Select your branch and submit.

---

## 📜 Coding Standards

- **Use JSDoc**: Document all **public functions** with `@param`, `@returns`, and `@description`.
- **Follow existing patterns**: Match the style of the surrounding code.
- **Keep commits atomic**: One feature/fix per commit.
- **Write clear commit messages**: Use the **imperative mood** (e.g., "Fix combat crash" instead of "Fixed combat crash").

---

## 🧪 Testing

- **Manual testing**: Play the game and test your changes thoroughly.
- **Edge cases**: Test with:
  - Low morale, low hull, no provisions.
  - Different ship types and upgrades.
  - All faction reputations (from "At War" to "Allied").

---

[← Back to Home](Home) | [Edit on GitHub](https://github.com/papaladin/broadside/edit/main/docs/Contributing.md)

```

---
#### **5. `docs/Setting-Up.md`**
```markdown
# **Setting Up Broadside Locally**
*How to set up the project for development.*

---
## 📋 Prerequisites
- **Git**: [Download Git](https://git-scm.com/)
- **Node.js**: [Download Node.js (v16+)](https://nodejs.org/)
- **npm**: Comes with Node.js.
- **Browser**: Chrome, Firefox, or Edge (for testing).

---
## 🛠️ Setup Steps
1. **Clone the repo**:
   ```bash
   git clone https://github.com/papaladin/broadside.git
   cd broadside
```

2. **Install dependencies** (if any):
  ```bash
   npm install
  ```
   *(Note: Broadside may not have many dependencies, but this ensures everything is set up.)*
3. **Run the game**:
  - **Option 1 (Simple)**: Open `index.html` in your browser.
  - **Option 2 (Development)**: Run the Vite dev server:
    ```bash
    npm run dev
    ```
    Then open `http://localhost:5173` in your browser.

---

## 🔧 Development Tools

- **VSCode**: Recommended IDE (with **ESLint**, **Prettier**, and **GitLens** extensions).
- **Live Server**: If you’re not using Vite, you can use the **Live Server** extension in VSCode to serve `index.html`.
- **GitHub Desktop**: Optional GUI for Git.

---

## 🐛 Debugging

- **Browser Dev Tools**: Press `F12` to open dev tools. Use the **Console** and **Debugger** tabs.
- **Logging**: Use `console.log()` to debug. Example:
  ```js
  console.log("Current state:", state);
  ```
- **Error Handling**: Check the browser console for errors if the game isn’t working.

---

[← Back to Home](Home) | [Edit on GitHub](https://github.com/papaladin/broadside/edit/main/docs/Setting-Up.md)

```

---
#### **6. `docs/Testing.md`**
```markdown
# **Testing Broadside**
*How to test the game and ensure quality.*

---
## 🧪 Manual Testing
The primary way to test Broadside is by **playing the game** and verifying that:
- All **screens** render correctly (Start, Port, Map, Sailing, Battle, etc.).
- All **actions** work as expected (e.g., sailing, combat, trading).
- **Edge cases** are handled gracefully (e.g., low morale, no provisions, at war with a port).

---
## 📋 Test Cases
Here are **key scenarios** to test after making changes:

### Travel System
| **Test Case** | **Steps** | **Expected Result** |
|---------------|-----------|---------------------|
| Sail to a nearby port | Click a nearby port on the map. | Ship arrives after the correct number of days. |
| Sail to a distant port | Click a distant port. | Ship takes longer to arrive. |
| Sail with low morale | Reduce morale to <30, then sail. | Travel takes +1 day. |
| Sail with opposing wind | Set wind to oppose your direction, then sail. | Travel takes +1 day. |
| Sail with heavy cargo | Fill hold to >75%, then sail. | Travel takes +1 day. |

### Combat System
| **Test Case** | **Steps** | **Expected Result** |
|---------------|-----------|---------------------|
| Broadside action | Use Broadside in combat. | Deals damage based on cannons. |
| Precision action | Use Precision in combat. | 70% chance to deal massive damage. |
| Grapple action | Use Grapple with more crew than enemy. | High chance to win instantly. |
| Flee action | Use Flee with a faster ship. | High chance to escape. |
| Low morale combat | Reduce morale to <30, then fight. | Player deals/receives +20% damage. |

### Mission System
| **Test Case** | **Steps** | **Expected Result** |
|---------------|-----------|---------------------|
| Accept a mission | Click "Accept" on a mission. | Mission appears in the active mission slot. |
| Complete a mission | Fulfill mission requirements (e.g., deliver goods). | Reward (gold, fame, reputation) is granted. |
| Abandon a mission | Click "Abandon" on an active mission. | Mission is removed, reputation decreases. |

---
## 🛠️ Automated Testing (Future)
If you add automated tests in the future, consider:
- **Unit tests** for pure functions (e.g., `travelDays`, `resolveCombatAction`).
- **Integration tests** for reducer actions (e.g., `SAIL_TO`, `BATTLE_ACTION`).
- **End-to-end tests** for user flows (e.g., "Sail to Port Royal and buy a ship").

---
[← Back to Home](Home) | [Edit on GitHub](https://github.com/papaladin/broadside/edit/main/docs/Testing.md)
```

---

---

---

## **📌 Phase 4: Finalize and Sync**

**Goal**: Ensure all files are in place and synced to the wiki.

---

### **Step 1: Commit All Changes**

1. **Add all new/updated files**:
  ```bash
   git add .github/workflows/sync-wiki.yml
   git add architecture.md specs_logic.md specs_engine.md specs_generators.md
   git add docs/
  ```
2. **Commit**:
  ```bash
   git commit -m "Refactor docs: split architecture.md and specs*.md, add new wiki pages"
  ```
3. **Push to `main**`:
  ```bash
   git push origin main
  ```

---

### **Step 2: Verify the Wiki**

1. Go to `https://github.com/papaladin/broadside/wiki`.
2. Check that all pages are present and properly formatted:
  - `Home`
  - `Architecture`
  - `API Reference`
  - `Engine Specs`
  - `Generators Specs`
  - `Roadmap`
  - `Tasks`
  - `Gameplay Basics`
  - `Tips and Strategies`
  - `Lore`
  - `Contributing`
  - `Setting Up`
  - `Testing`
3. Verify that:
  - All **links work** (e.g., from `Home` to `Architecture`).
  - No **duplicate content** exists between `architecture.md` and `specs*.md`.
  - The **sidebar navigation** works correctly.

---

### **Step 3: Clean Up (Optional)**

If everything looks good, delete the backup files:

```bash
rm -rf architecture_old.md
```

---

---

---

## **✅ Final Checklist**

### **Wiki Setup**

- Created `.github/workflows/sync-wiki.yml`.
- Pushed the workflow file to `main`.
- Enabled the wiki on GitHub.
- Created `Home.md` and `_Sidebar.md` in the wiki.
- Tested the workflow by pushing a change to a `.md` file.

### **Refactoring**

- Audited `architecture.md` for low-level content.
- Created `architecture_new.md` with high-level content only.
- Moved low-level content to `specs_logic.md`.
- Moved low-level content to `specs_engine.md`.
- Moved low-level content to `specs_generators.md`.
- Replaced `architecture.md` with `architecture_new.md`.
- Added cross-references between `architecture.md` and `specs*.md`.

### **New Wiki Pages**

- Created `docs/Gameplay-Basics.md`.
- Created `docs/Tips-and-Strategies.md`.
- Created `docs/Lore.md`.
- Created `docs/Contributing.md`.
- Created `docs/Setting-Up.md`.
- Created `docs/Testing.md`.

### **Final Steps**

- Committed all changes to `main`.
- Verified the wiki is up-to-date.
- Tested all links and navigation.

---

---

---

## **🎯 Summary of Changes**


| **Category**    | **Action**                                                     | **Files Affected**                       |
| --------------- | -------------------------------------------------------------- | ---------------------------------------- |
| **Wiki Setup**  | Created GitHub Actions workflow.                               | `.github/workflows/sync-wiki.yml`        |
| **Wiki Setup**  | Enabled wiki on GitHub.                                        | Wiki repo (`broadside.wiki`)             |
| **Wiki Setup**  | Added `Home.md` and `_Sidebar.md`.                             | Wiki repo                                |
| **Refactoring** | Split `architecture.md` into high-level and low-level content. | `architecture.md`, `specs_*.md`          |
| **Refactoring** | Moved low-level details to `specs_logic.md`.                   | `architecture.md`, `specs_logic.md`      |
| **Refactoring** | Moved low-level details to `specs_engine.md`.                  | `architecture.md`, `specs_engine.md`     |
| **Refactoring** | Moved low-level details to `specs_generators.md`.              | `architecture.md`, `specs_generators.md` |
| **New Pages**   | Added user-facing docs.                                        | `docs/Gameplay-Basics.md`, etc.          |
| **New Pages**   | Added development docs.                                        | `docs/Contributing.md`, etc.             |


---

---

---

## **🚀 Next Steps**

1. **Promote the wiki** in your `README.md`:
  ```markdown
   ## 📖 Documentation
   - [Wiki](https://github.com/papaladin/broadside/wiki) – Full documentation, including architecture, API reference, and gameplay guides.
  ```
2. **Encourage contributors** to update the wiki as they work on the codebase.
3. **Add JSDoc** to your code to make future spec updates easier (see previous recommendations).
4. **Review and expand** the wiki over time (e.g., add more gameplay tips, lore, or development guides).