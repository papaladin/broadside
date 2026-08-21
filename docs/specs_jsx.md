# React/JSX Module Specification

**Broadside UI Components & Screens**
*Last Updated: August 21, 2026*

---

## 1. Overview

| File | Namespace | Contents | Dependencies |
|---|---|---|---|
| `ui.jsx` | `window.UI` | Theme tokens, all presentational/reusable components | `window.D`, `window.L` |
| `icons.jsx` | extends `window.UI` | SVG icon component library + `LOG_ICONS` category map | `window.D` |
| `App.jsx` | — | Root: `ErrorBoundary`, `App` (HUD + screen router), `DebugPanel` | `window.D`, `window.L`, `window.E`, `window.UI`, `window.S` |
| `screens_core.jsx` | `window.S` | `TitleScreen`, `NewGameScreen`, `OnboardingPopup`, `QMPopup`, `GameOverScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_port.jsx` | `window.S` | `PortScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_status.jsx` | `window.S` | `StatusScreen`, `JournalScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_shipyard.jsx` | `window.S` | `ShipyardScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_crew.jsx` | `window.S` | `CrewScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_market.jsx` | `window.S` | `MarketScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_voyage.jsx` | `window.S` | `MapScreen`, `SailingScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_combat.jsx` | `window.S` | `EventScreen`, `InterceptScreen`, `BattleScreen`, `PlunderScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_menu.jsx` | `window.S` | `MenuModal`, `FeedbackPanel` | `window.D`, `window.L`, `window.E`, `window.UI` |

**Core Principles:**

- **No CSS files**: All styling is **inline** via theme tokens (`T`) and helper functions (`panelStyle()`).
- **Single source of truth**: Theme tokens (`T`) define all colors, fonts, and sizing.
- **Pure presentational**: Screens **do not contain game logic**—they only dispatch actions to `window.E`.
- **Responsive**: All screens adapt to mobile/desktop via inline styles.
- **Accessibility**: Minimum touch targets = `T.btnMinHeight` (44px).
- **No direct `window.G` calls**: Generators are invoked **only by engine reducers**.

---

## 2. ui.jsx — Theme & Reusable Components

### 2.1 Theme Tokens (`T`)

All visual constants. **No component may use hardcoded colors or fonts.**

```javascript
T = {
  // Colors
  bg: '#0a1622',            // deep navy
  bgDeep: '#060e14',        // very dark navy for shadows/gradients
  bgAlt: '#0d1824',         // subtle lighter navy for separation
  panel: '#221d16',
  panelAlt: '#1a1510',
  border: '#5a4a32',
  borderFaint: '#3e3222',
  borderBr: '#7a6440',
  text: '#e2d6be',
  textDim: '#b0a48c',
  textFaint: '#706050',
  gold: '#c9aa6e',
  goldDim: '#96784a',
  goldBr: '#dfc080',
  green: '#6a9a5a',
  greenBr: '#7ab868',
  greenBg: '#0e1a0c',
  red: '#b85a4a',
  redBr: '#d06a58',
  redBg: '#1a0c08',
  blue: '#5a8aaa',
  blueBr: '#6a9aba',
  blueBg: '#0c1420',
  purple: '#8a5a9a',
  purpleBr: '#9a6aaa',
  yellow: '#c8a840',
  yellowBr: '#d8b850',
  riskColor: { low: '#6a9a5a', medium: '#c8a840', high: '#b85a4a' },

  // Typography
  font: "Georgia, 'Times New Roman', serif",
  fontMono: "'Courier New', monospace",
  fontSize: 'max(11px, min(1.2vw, 14px))',
  narrativeLineHeight: 1.55,
  captionFontSize: 10,
  metadataFontSize: 11,
  narrativefontSize: 12,
  heading3FontSize: 14,
  heading2FontSize: 16,
  heading1FontSize: 18,

  // Sizing
  btnMinHeight: 44,
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 },
}
```

### 2.2 Helper Functions

#### panelStyle(overrides)
- **Purpose**: Returns a base panel style object with consistent theming.
- **Input**: `overrides` (optional object to merge with defaults)
- **Output**: `Object` with:
  ```javascript
  {
    backgroundColor: T.panel,
    border: `1px solid ${T.border}`,
    borderRadius: 2,
    padding: T.panelPadding,
    ...overrides
  }
  ```

### 2.3 Base Components

| Component | Props | Purpose | Example Usage |
|---|---|---|---|
| **`Btn`** | `onClick, children, disabled, variant, sm, style` | Generic button. Variants: `default` (gold border), `gold` (filled), `ghost` (borderless), `green`, `red`, `blue`. `sm` for compact. | `<Btn onClick={handleClick} variant="gold">Buy</Btn>` |
| **`PulseBtn`** | `visible, children, pulseKey, ...btnProps` | Button that pulses the first time it becomes visible. | `<PulseBtn visible={canMarket} pulseKey="market" onClick={...}>Market</PulseBtn>` |
| **`Bar`** | `value, max, color, h` | Horizontal progress bar (e.g., hull, morale). `h` = height (default 20px). | `<Bar value={ship.hull} max={maxHull} color={T.green} />` |
| **`Pill`** | `label, color, style` | Small coloured badge with hand-drawn border. | `<Pill label="High Risk" color={T.riskColor.high} />` |
| **`Panel`** | `children, color, variant, padding, style, ...rest` | Main container with hand-drawn double‑stroke border. Variants: `default`, `danger`, `gold`, `subtle`. | `<Panel variant="gold" style={{...}}>Content</Panel>` |
| **`SubPanel`** | `children, color, style, ...rest` | Inline block with single‑stroke border (like Pill but for blocks). | `<SubPanel color={T.gold}>Details</SubPanel>` |
| **`StatBlock`** | `label, value, color` | Label + value pair with optional colour. | `<StatBlock label="Gold" value={state.gold} color={T.gold} />` |
| **`SectionTitle`** | `children, action` | Section header with optional action button. | `<SectionTitle action={<Btn>Refresh</Btn>}>Missions</SectionTitle>` |
| **`LogList`** | `entries, maxEntries` | Renders captain's log entries with icons. Groups by day. | `<LogList entries={state.log} maxEntries={50} />` |
| **`NarrativePanel`** | `title, icon, variant, children, style` | Themed panel for story content. Variants: `neutral`, `gossip`, `danger`, `crew`, `discovery`, `trade`. | `<NarrativePanel variant="gossip" title="Gossip">...</NarrativePanel>` |
| **`NarrativeLine`** | `children, style` | A single narrative line with italic styling. | `<NarrativeLine>"The harbour is quiet today."</NarrativeLine>` |
| **`Divider`** | `style` | Horizontal separator line. | `<Divider style={{ margin: "8px 0" }} />` |
| **`EmptyState`** | `message, icon` | Placeholder for empty lists. | `<EmptyState message="No missions available" />` |
| **`BackButton`** | `dispatch, screen, label` | Dispatches `NAVIGATE` action to return to a screen. | `<BackButton dispatch={dispatch} screen="port" />` |
| **`Tooltip`** | `text, children` | Hover tooltip with viewport-aware positioning. | `<Tooltip text="Repair your ship">...` |
| **`TutorialPopup`** | `title, children, onDismiss` | Dismissible overlay card for per-screen tutorials. | `<TutorialPopup title="Welcome" onDismiss={...}>...</TutorialPopup>` |
| **`TransferLayout`** | `leftTitle, leftContent, leftFooter, rightTitle, rightContent, rightFooter, style` | Two-column transfer layout (Market, Plunder). | `<TransferLayout leftTitle="Hold" rightTitle="Market" ... />` |
| **`useFlashOnChange`** | `(value, options) -> className` | Hook that returns a CSS class that flashes green/red on value change. | `const flash = useFlashOnChange(state.gold, { direction: 'up' });` |
| **`PortSilhouette`** | `portKey` | Renders a faction-specific port silhouette SVG. | `<PortSilhouette portKey="tortuga" />` |

### 2.4 Game-Specific Components

| Component | Props | Purpose | Example |
|---|---|---|---|
| **`FactionPill`** | `faction` | Coloured pill showing faction label + flag icon. | `<FactionPill faction="english" />` |
| **`RepPill`** | `rep` | Pill coloured by reputation tier (At War/Hostile/Neutral/Friendly/Allied). | `<RepPill rep={state.reputation.portRoyal} />` |
| **`ShipSprite`** | `type, size` | Small top-down ship icon for the map and HUD. | `<ShipSprite type="sloop" size={28} />` |
| **`ShipSideSprite`** | `type, faction, equipment, width, height, facing` | Detailed side-view ship silhouette for Shipyard and Battle screens. Uses `window.ShipSprite.render()`. | `<ShipSideSprite type="frigate" faction="english" width={300} height={210} />` |

---

## 3. icons.jsx — SVG Icons & Log Classification

### 3.1 Icon Library
**Purpose**: Reusable SVG icons for UI elements (e.g., buttons, log entries).

| Icon | Props | Description |
|---|---|---|
| `IconGold` | `size, color` | Gold coin icon. |
| `IconHull` / `IconShield` | `size, color` | Ship hull/shield icon. |
| `IconCrew` | `size, color` | Crew icon. |
| `IconHeart` | `size, color` | Morale icon (heart). |
| `IconStar` | `size, color` | Fame icon (star). |
| `IconSkull` | `size, color` | Infamy icon (skull). |
| `IconFlame` | `size, color` | Heat icon (fire). |
| `IconCompass` | `size, color` | Compass icon (navigation). |
| `IconAnchor` | `size, color` | Anchor icon (port arrival). |
| `IconSwords` | `size, color` | Sword icon (combat). |
| `IconCannon` | `size, color` | Cannon icon (broadside action). |
| `IconTarget` | `size, color` | Target icon (precision action). |
| `IconGrapple` | `size, color` | Grapple icon (boarding action). |
| `IconWind` | `size, color` | Wind/Evade icon. |
| `IconMarket` | `size, color` | Market icon. |
| `IconMap` | `size, color` | Map icon. |
| `IconJournal` | `size, color` | Journal icon. |
| `IconCrew` | `size, color` | Crew icon. |
| `IconShip` | `size, color` | Generic ship icon. |
| `IconFood`, `IconWater`, `IconRhum`, `IconSugar`, `IconSpice`, `IconCloth`, `IconTimber`, `IconCoffee`, `IconTobacco`, `IconSilk`, `IconCocoa`, `IconGoldBag`, `IconPerson`, `IconGoblet`, `IconSpear` | `size, color` | Resource-specific icons for goods. |

**Note**: All icons default to `size={T.iconSize}` and `color={T.text}` if not specified.

### 3.2 LOG_ICONS
**Purpose**: Maps log entry categories to SVG icons for `LogList` and `JournalScreen`.

```javascript
LOG_ICONS: {
  arrival:   IconAnchor,
  sailing:   IconSailboat,
  crew:      IconCrew,
  combat:    IconSwords,
  trade:     IconGold,
  mission:   IconParchment,
  discovery: IconMap,
  infamy:    IconSkull,
  warning:   IconTalking,
}
```

---

## 4. Combat UI Components (B11)

### DistanceIndicator
- **Purpose**: Visual indicator showing current distance band (Far/Medium/Close) in the Battle screen.
- **Location**: `screens_combat.jsx` (internal component)
- **UI**:
  - Three dots with connecting lines
  - Current distance highlighted in gold
  - Descriptive text below (e.g., "Long range – cannons at full spread")

### AdvantageBar
- **Purpose**: Visual split bar showing player vs enemy boarding advantage (crew × morale effectiveness).
- **Location**: `screens_combat.jsx` (internal component)
- **UI**:
  - Green side = player advantage percentage
  - Red side = enemy advantage percentage
  - Shows effective crew counts (crew × morale/200) for both sides

### Boarding Action Buttons
- **Purpose**: Actions available during boarding phase.
- **Location**: `BattleScreen` in `screens_combat.jsx`
- **Actions**:
  - `continue_fighting` — press the attack (both sides take losses)
  - `fall_back` — return to naval combat (costs crew)
  - `demand_surrender` — force enemy to yield (requires ≥65% advantage)
  - `surrender` — yield to enemy
- **UI**: Each button shows crew loss preview and advantage requirement where applicable.

### ShipSideSprite Scaling
- **Purpose**: In `BattleScreen`, ships are scaled proportionally to their `SHIP_VISUALS.hullLength`.
- **Logic**:
  ```js
  const playerLen = window.D.SHIP_VISUALS[playerType]?.hullLength || 400;
  const enemyLen = window.D.SHIP_VISUALS[enemyType]?.hullLength || 400;
  const maxLen = Math.max(playerLen, enemyLen);
  const playerSize = playerLen / maxLen;
  const enemySize = enemyLen / maxLen;
  ```
- **Result**: A dinghy looks tiny next to a galleon, reinforcing the power difference visually.

---

## 5. App.jsx — Root Component

### 5.1 ErrorBoundary
**Purpose**: Catches render errors anywhere in the component tree.

- **State**: Tracks `hasError` and `error`.
- **UI**:
  - **Error State**: Shows error message with two recovery options:
    - **Reload Page**: Full page reload.
    - **Try Load Last Save**: Dispatches `LOAD_GAME` to recover from `localStorage`.
  - **Fallback**: Renders children if no error.

### 5.2 App (Root)
**Purpose**: Initializes the Redux-like store and renders the app.

- **State Management**:
  - Uses `useReducer(E.reducer, E.initialState)`.
  - **Auto-Save**: Triggers `E.autoSave(state)` on every state change.
- **UI Structure**:
  - Renders `<HUD />` (sticky top bar).
  - Renders the active screen via `<ScreenRouter />`.
  - Renders `<OnboardingPopup />` (global QM dialogue).
  - Renders hidden port discovery popup when a new hidden port is found.

### 5.3 HUD (Heads-Up Display)
**Purpose**: Sticky top bar showing critical player state.

| Element | Source | Format |
|---|---|---|
| **Gold** | `state.gold` | `{gold} g` (gold color, flash on change) |
| **Day + Date** | `state.day`, `state.startDate` | `Day {day} — {month} {day}, {year}` |
| **Crew** | `state.crew.roster.length`, `L.getShipStats(state).maxCrew` | `{current}/{max}` |
| **Hull** | `state.ship.hull`, `L.getShipStats(state).maxHull` | `{current}/{max}` |
| **Morale** | `L.getEffectiveMorale(state)` | `{value}%` (bar + number) |
| **Fame** | `state.fame`, `L.getFameInfo(state.fame).label` | `{fame} ({label})` |
| **Infamy** | `state.infamy`, `L.getInfamyLabel(state.infamy)` | `{infamy} ({label})` |
| **Heat** | `Math.max(...Object.values(state.factionAlerts))` | `{level} {L.getHeatLabel(level)}` (if > 0) |
| **Hold** | `L.getHoldUsed(state)`, `L.getHoldCapacity(state)` | `{used}/{capacity}` |
| **Food** | `state.hold?.items?.food` | `{food}` |
| **Water** | `state.hold?.items?.water` | `{water}` |

### 5.4 DebugPanel
**Purpose**: Development-only panel for testing. **Activated via `?debug=1` URL parameter.**

| Category | Controls | Effect |
|---|---|---|
| **Gold** | +1K, +10K, +100K, +1M | Adds gold |
| **Fame** | Set to 50, 100, 200, 350 | Sets fame |
| **Infamy** | Set to 0, 25, 50, 100 | Sets infamy |
| **Ship** | Switch to any ship type | Changes ship (resets equipment) |
| **Reputation** | Set current port to 5, 10, 50, 65, 85 | Adjusts rep |
| **Heat** | Set per-faction alert 0-10 | Adjusts faction alerts |
| **Morale** | Set to 10, 50, 80, 100 | Adjusts morale |
| **Crew** | Max crew, age +50/+100/+200 days | Fills crew or ages them |
| **Misc** | Fill hold, full repair, unlock hidden ports, complete mission, start debug combat | Various utilities |

### 5.5 Screen Router
**Purpose**: Renders the active screen based on `state.screen`.

```javascript
switch(state.screen) {
  case "title":      return <TitleScreen />;
  case "newgame":    return <NewGameScreen />;
  case "port":       return <PortScreen />;
  case "map":        return <MapScreen />;
  case "sailing":    return <SailingScreen />;
  case "shipyard":   return <ShipyardScreen />;
  case "crew":       return <CrewScreen />;
  case "status":     return <StatusScreen />;
  case "market":     return <MarketScreen />;
  case "journal":    return <JournalScreen />;
  case "event":      return <EventScreen />;
  case "intercept":  return <InterceptScreen />;
  case "battle":     return <BattleScreen />;
  case "plunder":    return <PlunderScreen />;
  case "gameover":   return <GameOverScreen />;
  default:          return <PortScreen />; // Fallback
}
```

---

## 6. Screens — Quick Reference

### screens_core.jsx
- `TitleScreen` — Main menu (New Game, Continue, Import, Changelog)
- `NewGameScreen` — Captain name, faction selection, tutorial mode choice
- `OnboardingPopup` — Global QM dialogue popup (rendered in App)
- `QMPopup` — Internal popup component for QM messages
- `GameOverScreen` — Non-dismissible career-end screen

### screens_port.jsx
- `PortScreen` — Main hub: port info, gossip, actions, mission board, active mission, log

### screens_status.jsx
- `StatusScreen` — Captain identity, career narrative, faction relations with prose
- `JournalScreen` — Filterable, searchable log with day grouping

### screens_shipyard.jsx
- `ShipyardScreen` — Split dashboard: current ship (left) + tabs (Equipment/Ships/Locker) with stat preview

### screens_crew.jsx
- `CrewScreen` — Roster, hiring, morale, crew detail with generated bio, trait pills, dismiss

### screens_market.jsx
- `MarketScreen` — Two-column transfer layout with buy/sell, market flavour, hold status

### screens_voyage.jsx
- `MapScreen` — SVG Caribbean map with zoom/pan, port tooltips, reachability, wind compass
- `SailingScreen` — Voyage progress, provisions, wind, log, Advance Day / Enter Port / Change Course

### screens_combat.jsx
- `EventScreen` — Random event resolution (choices, outcomes)
- `InterceptScreen` — Pre-battle options (fight, flee, parley, bribe, surrender, inspect)
- `BattleScreen` — Full turn-based combat (naval + boarding) with DistanceIndicator and AdvantageBar
- `PlunderScreen` — Transfer layout for loot selection

### screens_menu.jsx
- `MenuModal` — Game menu (Save, Load, Export, Import, New Game, Changelog, Feedback)
- `FeedbackPanel` — Feedback form with auto-filled metadata and optional save attachment

---

## 7. Tutorial System Integration

### 7.1 TutorialPopup (ui.jsx)
**Purpose**: Dismissible overlay card for per-screen tutorials.

- **Props**: `title`, `children`, `onDismiss`
- **UI Elements**:
  - Title text
  - Content (children)
  - "Got it" dismiss button
  - "Don't show tutorial hints again" checkbox → Calls `L.markTutorialSeen(screen, true)`

### 7.2 Per-Screen Tutorials
Each screen checks `L.shouldShowTutorial(state, screenName)` on mount. If true, renders a `TutorialPopup` with screen-specific guidance:

| Screen | Tutorial Content |
|---|---|
| `port` | Port services overview, mission board, gossip panel |
| `map` | How to select destinations, unreachable ports |
| `sailing` | Advance Day, provisions, events |
| `battle` | Combat actions, victory/defeat (naval + boarding) |
| `market` | Buy/sell, contraband risk, hold management |
| `crew` | Hiring, morale, member details |
| `shipyard` | Equipment slots, ships, locker |
| `journal` | Filtering, searching log entries |
| `status` | Reputation, fame, faction relations |

### 7.3 Tutorial State Management
- **Storage Key**: `"broadside_tutorial"` (managed by `storage.js`).
- **State Shape**:
  ```javascript
  {
    enabled: boolean,
    seen: {
      port: boolean,
      map: boolean,
      sailing: boolean,
      battle: boolean,
      market: boolean,
      crew: boolean,
      shipyard: boolean,
      journal: boolean,
      status: boolean,
    }
  }
  ```
- **Functions**: `L.shouldShowTutorial(state, screen)`, `L.markTutorialSeen(screen, disableAll)`

---

## 8. Dependencies & Rules

### 8.1 Dependency Rules

| File | May Read | May NOT Call |
|---|---|---|
| `ui.jsx` | `window.D`, `window.L` | Engine, Generators |
| `icons.jsx` | `window.D` | Engine, Generators |
| `App.jsx` | `window.D`, `window.L`, `window.E`, `window.UI`, `window.S` | — |
| `screens_*.jsx` | `window.D`, `window.L`, `window.E.A`, `window.UI`, `window.S` | `window.G` (generators) |

### 8.2 Style Rules

1. **No CSS files**: All styling is **inline** via theme tokens (`T`) and helper functions (`panelStyle()`).
2. **Color Tokens**: **Never hardcode hex values**. Always use `T.*` (e.g., `T.gold` instead of `#c9aa6e`).
3. **Touch Targets**: Minimum size = `T.btnMinHeight` (44px) for buttons.
4. **Narrative Text**: Uses `T.narrativeFontSize` (11px) and `T.narrativeLineHeight` (1.55).
5. **Responsive Layouts**: Use inline `flexbox`/`grid` with media queries if needed.
6. **Rough Borders**: `Btn`, `Panel`, `SubPanel`, and `Pill` components use SVG‑based hand‑drawn borders with jitter for a period feel.

### 8.3 Screen Naming Convention

| Type | Convention | Example |
|---|---|---|
| **Component** | PascalCase | `ShipyardScreen` |
| **Screen Key** | camelCase | `"shipyard"` |
| **Navigation** | `A.NAVIGATE` action | `dispatch({ type: A.NAVIGATE, screen: "shipyard" })` |
