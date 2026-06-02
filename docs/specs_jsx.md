# **Broadside: specs_jsx.md**

*React components for UI rendering, screens, and shared primitives.*

---

## **📌 Overview**

- **Files**:
  - `App.jsx`: Root component, state management, and screen routing.
  - `ui.jsx`: UI primitives (buttons, bars, panels, etc.).
  - `screens_shared.jsx`: Shared micro-components (e.g., `FactionPill`, `RepPill`).
  - `screens_port.jsx`: Port-related screens (start, port, shipyard, crew, status).
  - `screens_voyage.jsx`: Voyage-related screens (map, sailing, events, intercepts, battle).
- **Exposed as**:
  - `window.UI`: UI primitives from `ui.jsx`.
  - `window.S`: Screens and shared components from `screens_*.jsx`.
- **Dependencies**:
  - React (for component rendering).
  - `window.D` (data constants).
  - `window.L` (logic helpers).
  - `window.E` (engine: reducer, actions, state).
  - `window.G` (generators).

---

---

## **🌲 App.jsx**

*Root component. Initializes the game, manages state, and renders the HUD and current screen.*

---

### **1. `ErrorBoundary` (Class Component)**

- **Purpose**: Catches and displays render errors to prevent white screens.
- **State**:
  - `hasError` (boolean): Whether an error occurred.
  - `error` (object): The caught error.
- **Methods**:
  - `getDerivedStateFromError(error)`: Sets `hasError` and `error`.
  - `componentDidCatch(error, info)`: Logs the error to the console.
- **Render**:
  - If `hasError`: Displays an error message with options to **reload** or **load the last save**.
  - Otherwise: Renders children.

---

### **2. `App` (Functional Component)**

- **Purpose**: Main game container. Manages state, HUD, and screen routing.
- **State**:
  - Uses `React.useReducer(window.E.reducer, window.E.initialState)` for game state.
  - `savedFlash` (boolean): Whether to show the auto-save indicator.
  - `debugOpen` (boolean): Whether the debug panel is open (only if `debug=1` in URL).
- **Effects**:
  - Auto-save flash: Resets after 1.5 seconds.
- **Debug Mode**:
  - If `debug=1` in URL, exposes `window.__b` with cheat functions:
    - `__b.gold(n)`: Adds `n` gold.
    - `__b.fame(n)`: Sets fame to `n`.
    - `__b.infamy(n)`: Sets infamy to `n`.
    - `__b.ship(t)`: Sets ship type to `t`.
- **Tooltips**:
  - Defines tooltips for HUD elements (e.g., gold, food, morale).
- **Components**:
  - `**HUD**`: Sticky header with game stats (gold, day, crew, hull, morale, fame, infamy, hold, provisions).
    - Toggles detailed stats with a button.
    - Shows auto-save indicator (`✓ saved`).
    - Displays current port name (colored by faction).
  - **Screen Router**: Renders the current screen based on `state.screen`:
    - `"start"`: `<StartScreen />`
    - `"port"`: `<PortScreen />`
    - `"map"`: `<MapScreen />`
    - `"sailing"`: `<SailingScreen />`
    - `"shipyard"`: `<ShipyardScreen />`
    - `"crew"`: `<CrewScreen />`
    - `"status"`: `<StatusScreen />`
    - `"event"`: `<EventScreen />`
    - `"intercept"`: `<InterceptScreen />`
    - `"battle"`: `<BattleScreen />`
    - `"market"`: `<MarketScreen />`
- **Debug Panel**:
  - Only rendered if `debug=1` in URL and `debugOpen` is `true`.
  - Buttons for:
    - Adding gold (`+100`, `+500`, `+1000`, `+5000`).
    - Setting fame (`★50`, `★100`, `★200`, `★350`).
    - Setting infamy (`☠0`, `☠25`, `☠50`, `☠100`).
    - Setting ship (`dinghy`, `sloop`, `brigantine`, `frigate`, `galleon`).
    - Setting port reputation (`10`, `50`, `65`, `85`).
    - Filling hold with mixed goods.
    - Full repair + provisions.

---

---

## **🎨 ui.jsx**

*UI primitives and theme tokens. Pure presentational components with no game logic.*

---

### **1. Theme Tokens (`T`)**

- **Purpose**: Centralized design tokens (colors, fonts, sizes).
- **Colors**:
  - Backgrounds: `bg`, `bgDeep`, `bgAlt`, `panel`, `panelAlt`.
  - Borders: `border`, `borderFaint`, `borderBr`.
  - Text: `text`, `textDim`, `textFaint`.
  - Accents: `gold`, `goldDim`, `goldBr`, `green`, `greenBr`, `red`, `redBr`, `blue`, `blueBr`, `purple`.
  - Risk colors: `riskColor.low` (green), `riskColor.medium` (orange), `riskColor.high` (red).
- **Fonts**:
  - `font`: `"'Courier New', monospace"`.
  - `fontSize`: `'max(10px, min(1.2vw, 13px))'`.
- **Layout**:
  - `btnMinHeight`: `44` (minimum button height).

---

### **2. Style Helpers**

- `**panelStyle(overrides = {})**`:
  - Returns a style object for panels (background, border, padding, etc.).
  - Merges `overrides` into the default style.

---

### **3. Components**

All components are **pure functions** (no state or side effects).

#### `**Btn` (Button)**

- **Props**:
  - `children`: Button content.
  - `onClick`: Click handler.
  - `disabled`: Whether the button is disabled.
  - `v` (variant): `"default"`, `"gold"`, `"ghost"`, `"green"`, `"red"`.
  - `sm` (small): Whether to use small padding.
  - `style`: Additional inline styles.
- **Variants**:
  - `default`: Dark background, light border.
  - `gold`: Gold background, dark text.
  - `ghost`: Transparent background, gold border/text.
  - `green`/`red`: Colored background with matching border/text.

#### `**Bar` (Progress Bar)**

- **Props**:
  - `value`: Current value.
  - `max`: Maximum value.
  - `color`: Bar color (default: `T.greenBr`).
  - `h`: Height (default: `10`).
- **Render**: Horizontal bar with percentage fill.

#### `**Pill` (Label Tag)**

- **Props**:
  - `label`: Text to display.
  - `color`: Background/text color (default: `T.textDim`).
  - `style`: Additional styles.
- **Render**: Small, rounded tag with the label.

#### `**StatBlock` (Stat Display)**

- **Props**:
  - `label`: Stat name (e.g., "Hull").
  - `value`: Stat value.
  - `color`: Value color (default: `T.text`).
- **Render**: Vertical stack of label (dim) and value (bold).

#### `**SectionTitle` (Section Header)**

- **Props**:
  - `children`: Title text.
  - `action`: Optional action button (rendered on the right).
- **Render**: Bold, gold-colored title with optional action.

#### `**ScreenHeader` (Screen Title with Back Button)**

- **Props**:
  - `title`: Screen title.
  - `onBack`: Back button click handler.
- **Render**: Title with a gold back button (if `onBack` is provided).

#### `**LogList` (Log Entries)**

- **Props**:
  - `entries`: Array of log strings.
  - `maxEntries`: Maximum entries to display (default: `20`).
- **Render**: Scrollable list of log entries (newest at the bottom).

#### `**Divider` (Horizontal Rule)**

- **Props**:
  - `style`: Additional styles.
- **Render**: Thin horizontal line.

#### `**EmptyState` (Empty Placeholder)**

- **Props**:
  - `message`: Message to display.
  - `style`: Additional styles.
- **Render**: Centered, faint message (e.g., "No missions posted.").

*Shared micro-components used across multiple screens.*

### **1. `FactionPill**`

- **Purpose**: Displays a faction label with its color.
- **Props**:
  - `faction` (string): Faction key (e.g., `"english"`).
- **Render**: Uses `Pill` with the faction's label and color from `FACTIONS[faction]`.

---

### **2. `RepPill**`

- **Purpose**: Displays a reputation label with its color.
- **Props**:
  - `rep` (number): Reputation value (0-100).
- **Render**:
  - Uses `L.reputationLabel(rep)` to get the label (e.g., "Allied").
  - Color:
    - `>= 60`: Green (`T.greenBr`).
    - `>= 30`: Gold (`T.gold`).
    - `< 30`: Red (`T.redBr`).
  - Format: `"[Label] ([rep])"` (e.g., "Allied (80)").

---

### **3. `ShipSprite**`

- **Purpose**: Renders a ship SVG icon.
- **Props**:
  - `type` (string): Ship type (unused in current implementation).
  - `size` (number): Width in pixels (default: `40`).
- **Render**: SVG of a ship (ellipse hull, sails, etc.).


---

## **🏝️ screens_port.jsx**

*Screens for port-related actions (start, port, shipyard, crew, status).*

---

### **1. `StartScreen**`

- **Purpose**: Displays the game's start screen with scenario selection.
- **Props**:
  - `dispatch`: Redux-style dispatch function.
- **Logic**:
  - Checks for existing saves (`L.hasSave()`).
  - Filters scenarios: Shows all if `debug=1`, else excludes `"debug"` scenario.
- **Render**:
  - Title: "⚓ Broadside" with subtitle "CARIBBEAN · 1695".
  - Grid of scenario cards (from `STARTS`):
    - Each card shows:
      - Faction and ship type.
      - Scenario name and tagline.
      - Story description.
      - Opening quest (if `starterMission` exists).
      - Starting stats (gold, crew, provisions).
      - Reputation bonuses.
    - Clicking a card dispatches `START_GAME` with the scenario ID.
  - Continue button (if save exists): Dispatches `LOAD_GAME`.

---

### **2. `PortScreen**`

- **Purpose**: Main port screen with actions, missions, and ship status.
- **Props**:
  - `state`: Current game state.
  - `dispatch`: Dispatch function.
- **Logic**:
  - Gets current port, reputation, and ship stats.
  - Checks if the player can complete the active mission (`canFinish`).
- **Render**:
  - **Port Card**:
    - Port name, faction, and description.
    - Services (e.g., tavern, shipyard) as `Pill` components.
    - Buttons:
      - World Map (`NAVIGATE` to `"map"`).
      - Status (`NAVIGATE` to `"status"`).
      - Market (`ENTER_MARKET`).
      - Shipyard (`NAVIGATE` to `"shipyard"`) if available.
      - Crew (`NAVIGATE` to `"crew"`) if available.
      - Quick Repair (if hull < max and affordable).
    - Save button (`SAVE_GAME`).
  - **Mission Board**:
    - Refresh button (`REFRESH_MISSIONS`).
    - Reputation perk notice (e.g., "+20% mission rewards" for allied).
    - List of missions (from `state.missions`):
      - Each mission shows:
        - Name, faction, and risk (as `Pill`).
        - Description.
        - Enemy stats (if combat mission).
        - **Cargo Requirements (Trade/Smuggle)**:
          - Required good/quantity.
          - Current hold quantity (with color-coded status: green if ready, gold if partial, red if missing).
          - Hold space warning (if not enough capacity).
          - Source hint (for smuggle missions).
          - Estimated profit (for trade missions).
          - Infamy warning (for smuggle missions).
        - Rewards: Gold, fame, infamy.
        - Accept button (`TAKE_MISSION`).
    - **Active Mission**:
      - Highlighted in green.
      - Shows destination, rewards, and cargo status.
      - Complete/Abandon buttons.
  - **Ship Status**:
    - Ship name, class, cannons, speed, crew.
    - Hull bar (red if < 30%).
    - Upgrades (as `Pill` components).
  - **Captain's Log**: Scrollable list of recent log entries.

---

### **3. `ShipyardScreen**`

- **Purpose**: Allows purchasing ships and upgrades.
- **Props**:
  - `state`: Current game state.
  - `dispatch`: Dispatch function.
- **Logic**:
  - Checks if services are blocked (`getRepPerk`).
  - Calculates repair cost.
  - Tracks `comparing` state for ship comparisons.
- **Render**:
  - Back button (`NAVIGATE` to `"port"`).
  - **Repair Section**:
    - Hull bar and repair button (`REPAIR`).
  - **Ships for Sale**:
    - Grid of ship cards (from `SHIPS`):
      - Each card shows:
        - Ship name, cost, and description.
        - Stats (crew, guns, speed, hull).
        - Requirements (e.g., fame) if locked.
        - Purchase button (`BUY_SHIP`).
      - Clicking a card toggles comparison mode.
    - **Ship Comparison Panel** (if `comparing`):
      - Side-by-side stats of current ship vs. selected ship.
      - Close button.
  - **Upgrades** (if port has `"upgrades"` service):
    - Grid of upgrade cards (from `UPGRADES`):
      - Each card shows:
        - Upgrade name, cost, and description.
        - Requirements if locked.
        - Install button (`BUY_UPGRADE`).

---

### **4. `CrewScreen**`

- **Purpose**: Manages crew hiring, morale, and roster.
- **Props**:
  - `state`: Current game state.
  - `dispatch`: Dispatch function.
- **Logic**:
  - Checks if services are blocked (`getRepPerk`).
  - Calculates open crew slots.
- **Render**:
  - Back button (`NAVIGATE` to `"port"`).
  - **Roster Panel**:
    - Current crew count / max.
    - Morale bar (green if > 60, gold if > 30, red if <= 30).
    - Warning if morale < 50 (weakens combat).
    - Buy Drinks button (`RAISE_MORALE`): +5 morale for `crew.length * 5` gold.
  - **Hire Panel**:
    - Cost: 50g per sailor.
    - Buttons for hiring 1, 5, or 10 crew (`HIRE_CREW`).
    - Warning if ship is at capacity.
  - **Manifest Panel**:
    - Grid of crew member icons (by role: ⚓ deckhand, 🗡 gunner, 🍖 cook, 🔧 carpenter, 🧭 navigator).

---

### **5. `StatusScreen**`

- **Purpose**: Displays player standing, faction relations, and port reputations.
- **Props**:
  - `state`: Current game state.
  - `dispatch`: Dispatch function.
- **Logic**:
  - Groups ports by faction.
- **Render**:
  - Back button (`NAVIGATE` to `"port"`).
  - **Captain's Standing**:
    - Fame (★) and infamy (☠) with labels (e.g., "Notorious").
    - Infamy warnings (e.g., "Bribe option will be unavailable above 50 infamy.").
  - **Faction Relations**:
    - Grid of faction cards (from `FACTIONS`):
      - Each card shows faction name, color, and rivals.
  - **Port Reputations**:
    - Grouped by faction.
    - Each port shows:
      - Name and faction color.
      - Reputation value and label (e.g., "Friendly (65)").
      - Services offered (as `Pill` components).

---

---

## **⛵ screens_voyage.jsx**

*Screens for voyage-related actions (map, sailing, events, intercepts, battle).*

---

### **1. `MapScreen**`

- **Purpose**: Displays the world map with ports and sailing routes.
- **Props**:
  - `state`: Current game state.
  - `dispatch`: Dispatch function.
- **State**:
  - `hov` (hovered port key).
- **Logic**:
  - Map dimensions: `W = 760`, `H = 460`.
  - Checks if the active mission has a target port (for route line).
- **Render**:
  - Back button (`NAVIGATE` to `"port"`).
  - **SVG Map**:
    - Sea grid pattern.
    - Landmass paths (Caribbean islands).
    - **Ports**:
      - Rendered as circles (size depends on current/hover state).
      - Color: Faction color (or faint if unreachable).
      - Current port: Gold circle with ⚓ anchor.
      - Hover: Shows port name, distance (in days), and reputation.
      - Click: Sails to port (`SAIL_TO`) if reachable.
    - **Active Mission Route**:
      - Dashed gold line from current port to target port.
    - **Wind Indicator**:
      - Compass rose (N, E, S, W).
      - Wind direction arrow (blue).
      - Wind speed (e.g., "10KT").
  - **Legend**:
    - Faction colors with labels.
    - Hint: "Click a port to sail there · Hover to see distance & standing".

---

### **2. `SailingScreen**`

- **Purpose**: Displays the sailing screen with ship progress and voyage details.
- **Props**:
  - `state`: Current game state.
  - `dispatch`: Dispatch function.
- **Logic**:
  - Calculates:
    - `progress`: 0-1 (based on `sailingDaysLeft / sailingDaysTotal`).
    - Ship position (`shipX`, `shipY`) along the route.
    - Heading angle (`hdgDeg`).
    - Provision consumption and days remaining.
    - Hold load percentage and speed multiplier.
- **Render**:
  - **Map Panel** (2/3 width):
    - SVG with:
      - Sea waves pattern.
      - Route line (from current port to destination).
      - Current port (small circle).
      - Destination port (dashed circle with flag).
      - Ship SVG (rotated to heading).
      - Wind indicator (same as `MapScreen`).
  - **Info Panel** (1/3 width):
    - Voyage destination and days remaining.
    - **Controls**:
      - Advance Day (`ADVANCE_DAY`).
      - Enter Port (`ENTER_PORT`) if arrived.
    - Wind info and mission name (if active).
    - **Provisions Panel**:
      - Food and water quantities with days remaining.
      - Warning if low (< 3 days).
    - **Captain's Log**: Recent entries.

---

### **3. `EventScreen**`

- **Purpose**: Displays a random event with choices.
- **Props**:
  - `state`: Current game state.
  - `dispatch`: Dispatch function.
- **Logic**:
  - Gets the active event (`state.activeEvent`).
  - Maps event types to colors:
    - `hazard`: Red.
    - `choice`: Gold.
    - `reward`: Green.
    - `crew`: Blue.
    - `faction`: Purple.
- **Render**:
  - Centered modal panel with:
    - Event type `Pill`.
    - Day counter.
    - Event title and description.
    - **Choices**:
      - Each choice is a clickable card (`RESOLVE_EVENT` with `choiceIndex`).
      - Shows choice label and outcome preview.

---

### **4. `InterceptScreen**`

- **Purpose**: Displays an encounter (e.g., navy patrol, hostile ship) with response options.
- **Props**:
  - `state`: Current game state.
  - `dispatch`: Dispatch function.
- **Logic**:
  - Gets the encounter context (`state.encounterContext`).
  - Gets enemy ship stats (from `SHIPS[enemy.ship]`).
- **Render**:
  - Title: "⚠ ENCOUNTER".
  - **Flavor Text Panel**: Event description.
  - **Enemy Panel**:
    - Enemy name and ship type.
    - Stats: Hull, cannons, crew, speed.
    - Hull bar (red).
  - **Response Options**:
    - **Fight** (`INTERCEPT_FIGHT`): Red button.
    - **Flee** (`INTERCEPT_FLEE`):
      - Shows speed check (player vs. enemy) if available.
      - Disabled with reason if not available.
    - **Parley** (`INTERCEPT_PARLEY`):
      - Shows current reputation if available.
      - Disabled with reason if not available.
    - **Bribe** (`INTERCEPT_BRIBE`):
      - Shows cost if available.
      - Gold variant button.
      - Disabled with reason if not available.
    - **Surrender** (`INTERCEPT_SURRENDER`):
      - Ghost variant button.
      - Disabled with reason if not available.

---

### **5. `BattleScreen**`

- **Purpose**: Displays the combat screen with player and enemy stats.
- **Props**:
  - `state`: Current game state.
  - `dispatch`: Dispatch function.
- **Logic**:
  - Gets `battleState` (`state.battleState`).
  - Checks if battle is done (`"victory"`, `"defeat"`, or `"fled"`).
  - Calculates hull percentages for player and enemy.
- **Render**:
  - Title: "⚔ NAVAL BATTLE — ROUND [X]".
  - **Combatants Layout** (3-column grid):
    - **Player Panel** (left):
      - Ship name.
      - Hull: Current / max.
      - Hull bar (green if > 30%, red otherwise).
      - Crew count and cannons.
      - Upgrades (as `Pill` components).
    - **Vs. Indicator** (center): ⚡.
    - **Enemy Panel** (right):
      - Enemy name and ship type.
      - Hull: Current / max.
      - Hull bar (red).
      - Crew count and cannons.
      - Faction `Pill`.
  - **Combat Log Panel**:
    - Scrollable list of battle logs (newest at the top).
  - **Actions**:
    - If battle is **not done**:
      - **Action Buttons** (grid):
        - **Broadside** (`BATTLE_ACTION` with `"broadside"`): Reliable damage.
        - **Precision** (`BATTLE_ACTION` with `"precision"`): High damage or miss.
        - **Grapple** (`BATTLE_ACTION` with `"grapple"`): Board the enemy.
        - **Evade** (`BATTLE_ACTION` with `"evade"`): Flee if faster.
      - Each button shows an icon and description.
    - If battle is **done**:
      - **Result Title**:
        - Victory: "⚓ VICTORY!" (green).
        - Escaped: "🌊 ESCAPED" (gold).
        - Defeat: "💀 DEFEATED" (red).
      - Gold reward (if victory).
      - **Dismiss Button** (`DISMISS_BATTLE`):
        - Label: "Continue Voyage", "Enter Port", or "Return to Port".

---

---

## **📦 Exposed Globally**

All screens and shared components are exposed via `window.S`:

```js
window.S = {
  // Shared components (from screens_shared.jsx)
  FactionPill,
  RepPill,
  ShipSprite,

  // Port screens (from screens_port.jsx)
  StartScreen,
  PortScreen,
  ShipyardScreen,
  CrewScreen,
  StatusScreen,

  // Voyage screens (from screens_voyage.jsx)
  MapScreen,
  SailingScreen,
  EventScreen,
  InterceptScreen,
  BattleScreen,
};
```

---

---

## **🔗 Dependencies**

- **React**: For component rendering and hooks (`useState`, `useEffect`).
- `**window.D**`: Data constants (ports, ships, factions, resources, etc.).
- `**window.L**`: Logic helpers (e.g., `travelDays`, `canReach`, `getShipStats`).
- `**window.E**`: Engine (reducer, actions, initial state).
- `**window.G**`: Generators (e.g., `generatePortMarket`).
- `**window.UI**`: UI primitives (from `ui.jsx`).

---

---

## **📝 Notes for Refactoring**

1. **Component Structure**:
  - Screens are **large** and handle their own rendering logic. Consider breaking them into smaller sub-components (e.g., `MissionCard`, `PortCard`, `ShipCard`).
2. **State Management**:
  - All state is managed via the **reducer** (`window.E.reducer`). Components dispatch actions and receive state via props.
3. **Styling**:
  - Inline styles are used extensively. Consider:
    - Extracting styles into a separate `styles.js` file.
    - Using CSS-in-JS (e.g., `styled-components`) or CSS modules.
  - Many styles are **repetitive** (e.g., button styles, panel styles). Consolidate these.
4. **Responsiveness**:
  - Some screens (e.g., `SailingScreen`) use `window.innerWidth` to adjust layout. Consider using CSS media queries or a responsive grid system.
5. **Performance**:
  - No performance issues identified. Screens are rendered once per state update.
6. **Testing**:
  - Critical components to test:
    - `PortScreen` (mission rendering, cargo checks).
    - `SailingScreen` (provision warnings, progress).
    - `BattleScreen` (action buttons, log updates).
    - `MapScreen` (port rendering, route lines).
7. **Debug Mode**:
  - Debug panel is **only rendered if `debug=1` in URL**. Ensure this is secure for production.
8. **Error Handling**:
  - `ErrorBoundary` catches render errors. Consider adding error boundaries for specific components (e.g., `BattleScreen`).
9. **Accessibility**:
  - No explicit accessibility features (e.g., ARIA labels, keyboard navigation). Consider adding these for better UX.
10. **Internationalization**:
  - All text is hardcoded. For localization, extract strings into a `locales.js` file.

---