# React/JSX Module Specification

**Broadside UI Components & Screens**
*Last Updated: June 27, 2026*

---

## 1. Overview

| File | Namespace | Contents | Dependencies |
|---|---|---|---|
| `ui.jsx` | `window.UI` | Theme tokens, all presentational/reusable components | `window.D`, `window.L` |
| `icons.jsx` | extends `window.UI` | SVG icon component library + `LOG_ICONS` category map | `window.D` |
| `App.jsx` | — | Root: `ErrorBoundary`, `App` (HUD + screen router), `DebugPanel` | `window.D`, `window.L`, `window.E`, `window.UI`, `window.S` |
| `screens_core.jsx` | `window.S` | `TitleScreen`, `NewGameScreen`, `OnboardingPopup`, `QMPopup` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_port.jsx` | `window.S` | `PortScreen`, `ScenarioScreen`, `StatusScreen`, `JournalScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_shipyard.jsx` | `window.S` | `ShipyardScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_crew.jsx` | `window.S` | `CrewScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_market.jsx` | `window.S` | `MarketScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |
| `screens_voyage.jsx` | `window.S` | `MapScreen`, `SailingScreen`, `EventScreen`, `InterceptScreen`, `BattleScreen`, `PlunderScreen` | `window.D`, `window.L`, `window.E`, `window.UI` |

**Core Principles:**

- **No CSS files**: All styling is **inline** via theme tokens (`T`) and helper functions (`panelStyle()`).
- **Single source of truth**: Theme tokens (`T`) define all colors, fonts, and sizing.
- **Pure presentational**: Screens **do not contain game logic**—they only dispatch actions to `window.E`.
- **Responsive**: All screens adapt to mobile/desktop via inline styles.
- **Accessibility**: Minimum touch targets = `T.btnMinHeight` (44px).
- **No direct `window.G` calls**: Generators are invoked **only by engine reducers**.

---

## 2. ui.jsx — Theme & Reusable Components

---
### 2.1 Theme Tokens (`T`)

All visual constants. **No component may use hardcoded colors or fonts.**

```javascript
T = {
  // Colors
  bg: '#1a1207',            // Page background (dark brown)
  panel: '#2a1f10',         // Panel background
  panelAlt: '#352a18',      // Alternate panel (e.g., nested)
  border: '#5a4a2a',        // Standard border
  borderFaint: '#3a2e1a',   // Subtle border (e.g., dividers)
  borderBr: '#8a7a50',      // Bright border (hover states)
  text: '#d4c4a0',          // Primary text (off-white)
  textDim: '#a09070',       // Secondary text
  textFaint: '#706050',     // Tertiary text (e.g., metadata)
  gold: '#c9a84c',          // Gold accent
  goldDim: '#8a7530',       // Muted gold
  goldBr: '#e8d080',        // Bright gold (hover)
  green: '#4a8c4a',         // Positive/success
  red: '#8c4a4a',           // Negative/danger
  blue: '#4a6a8c',          // Info/navigation
  purple: '#6a4a8c',        // Pirate/special

  // Typography
  font: 'Courier New, monospace',
  fontSize: 12,
  narrativeFontSize: 11,
  narrativeLineHeight: 1.6,
  metadataFontSize: 10,
  captionFontSize: 9,

  // Sizing
  btnMinHeight: 44,        // Touch target minimum (px)
  iconSize: 20,            // Default icon size (px)
  panelPadding: 12,        // Inner padding for panels (px)
  borderRadius: 6,        // Default border radius (px)

  // Risk colors (for pills/badges)
  riskColor: {
    low: '#4a8c4a',       // Green
    medium: '#c9a84c',    // Gold
    high: '#8c4a4a'       // Red
  }
}
```

---
### 2.2 Helper Functions

#### panelStyle(overrides)
- **Purpose**: Returns a base panel style object with consistent theming.
- **Input**: `overrides` (optional object to merge with defaults)
- **Output**: `Object` with:
  ```javascript
  {
    backgroundColor: T.panel,
    border: `1px solid ${T.border}`,
    borderRadius: T.borderRadius,
    padding: T.panelPadding,
    ...overrides
  }
  ```

---
### 2.3 Base Components

| Component | Props | Purpose | Example Usage |
|---|---|---|---|
| **`Btn`** | `onClick, children, disabled, variant, sm, style` | Generic button. Variants: `default` (gold border), `gold` (filled), `ghost` (borderless), `green`, `red`. `sm` for compact. | `<Btn onClick={handleClick} variant="gold">Buy</Btn>` |
| **`Bar`** | `value, max, color, h, label` | Horizontal progress bar (e.g., hull, morale). `h` = height (default 20px). | `<Bar value={ship.hull} max={maxHull} color={T.green} />` |
| **`Pill`** | `label, color, style` | Small colored badge (e.g., faction tags, risk levels). | `<Pill label="High Risk" color={T.riskColor.high} />` |
| **`StatBlock`** | `label, value, sub` | Label + value pair with optional sub-text. | `<StatBlock label="Gold" value={state.gold} sub="₧" />` |
| **`SectionTitle`** | `children, action` | Section header with optional action button. | `<SectionTitle action={<Btn>Refresh</Btn>}>Missions</SectionTitle>` |
| **`ScreenHeader`** | `title, onBack` | Screen title with back navigation. | `<ScreenHeader title="Port Royal" onBack={() => navigate("port")} />` |
| **`LogList`** | `entries, maxEntries` | Renders captain's log entries with icons. Groups by day. | `<LogList entries={state.log} maxEntries={50} />` |
| **`Divider`** | `style` | Horizontal separator line. | `<Divider style={{ margin: "8px 0" }} />` |
| **`EmptyState`** | `message, icon` | Placeholder for empty lists (e.g., no missions). | `<EmptyState message="No missions available" icon="📜" />` |
| **`BackButton`** | `dispatch, screen, label` | Dispatches `NAVIGATE` action to return to a screen. | `<BackButton dispatch={dispatch} screen="port" label="Back to Port" />` |

---
### 2.4 Game-Specific Components

| Component | Props | Purpose | Example |
|---|---|---|---|
| **`FactionPill`** | `faction` | Colored pill showing faction label + flag icon. | `<FactionPill faction="english" />` |
| **`RepPill`** | `rep` | Pill colored by reputation tier (At War/Hostile/Neutral/Friendly/Allied). | `<RepPill rep={state.reputation.portRoyal} />` |
| **`ShipSprite`** | `type, size, faction, equipment, facing, showFlag` | SVG ship silhouette (top-down view). | `<ShipSprite type="sloop" size={32} faction="english" />` |

---
## 3. icons.jsx — SVG Icons & Log Classification

---
### 3.1 Icon Library
**Purpose**: Reusable SVG icons for UI elements (e.g., buttons, log entries).

| Icon | Props | Description |
|---|---|---|
| `IconGold` | `size, color` | Gold coin icon. |
| `IconHull` | `size, color` | Ship hull icon. |
| `IconCrew` | `size, color` | Crew icon. |
| `IconMorale` | `size, color` | Morale icon (heart). |
| `IconFame` | `size, color` | Fame icon (star). |
| `IconInfamy` | `size, color` | Infamy icon (skull). |
| `IconHeat` | `size, color` | Heat icon (fire). |
| `IconCompass` | `size, color` | Compass icon (navigation). |
| `IconAnchor` | `size, color` | Anchor icon (port arrival). |
| `IconSword` | `size, color` | Sword icon (combat). |
| `IconTrade` | `size, color` | Trade icon (sack). |
| `IconShip` | `size, color` | Ship icon (generic). |

**Note**: All icons default to `size={T.iconSize}` and `color={T.text}` if not specified.

---
### 3.2 LOG_ICONS
**Purpose**: Maps log entry categories to SVG icons for `LogList` and `JournalScreen`.

```javascript
LOG_ICONS: {
  arrival: <IconAnchor />,
  departure: <IconCompass />,
  combat: <IconSword />,
  victory: <IconSword color={T.green} />,
  defeat: <IconSword color={T.red} />,
  fled: <IconCompass color={T.gold} />,
  crew: <IconCrew />,
  death: <IconCrew color={T.red} />,
  desertion: <IconCrew color={T.red} />,
  mission: <IconScroll />,
  trade: <IconTrade />,
  smuggle: <IconTrade color={T.purple} />,
  storm: <IconLightning />,
  event: <IconExclamation />,
  port: <IconAnchor />,
  repair: <IconHammer />,
  equipment: <IconWrench />,
  gossip: <IconSpeech />,
  ...
}
```

---
## 4. App.jsx — Root Component

---
### 4.1 ErrorBoundary
**Purpose**: Catches render errors anywhere in the component tree.

- **State**: Tracks `hasError` and `error`.
- **UI**:
  - **Error State**: Shows error message with two recovery options:
    - **Reload Page**: Full page reload.
    - **Try Load Last Save**: Dispatches `LOAD_GAME` to recover from `localStorage`.
  - **Fallback**: Renders children if no error.

---
### 4.2 App (Root)
**Purpose**: Initializes the Redux-like store and renders the app.

- **State Management**:
  - Uses `useReducer(E.reducer, E.initialState)`.
  - **Auto-Save**: Triggers `E.autoSave(state)` on every state change.
- **UI Structure**:
  - Renders `<HUD />` (sticky top bar).
  - Renders the active screen via `<ScreenRouter />`.

---
### 4.3 HUD (Heads-Up Display)
**Purpose**: Sticky top bar showing critical player state.

| Element | Source | Format |
|---|---|---|
| **Gold** | `state.gold` | `₧{gold}` (gold color) |
| **Day + Date** | `state.day`, `state.startDate` | `Day {day} — {month} {day}, {year}` |
| **Crew** | `state.crew.roster.length`, `L.getShipStats(state).maxCrew` | `{current}/{max}` |
| **Hull** | `state.ship.hull`, `L.getShipStats(state).maxHull` | `{current}/{max}` |
| **Morale** | `L.getEffectiveMorale(state)` | `{value}%` (bar + number) |
| **Fame** | `state.fame`, `L.getFameInfo(state.fame).label` | `{fame} ({label})` |
| **Infamy** | `state.infamy`, `L.getInfamyLabel(state.infamy)` | `{infamy} ({label})` |
| **Heat** | `Math.max(...Object.values(state.factionAlerts))` | `{level} {L.getHeatLabel(level)}` (if > 0) |
| **Provisions** | `L.getDaysOfProvisions(state.hold.items, L.getProvisionConsumptionPerDay(state))` | `{days} days` |
| **Hold** | `L.getHoldUsed(state)`, `L.getHoldCapacity(state)` | `{used}/{capacity} ({loadPct}%)` |
| **Contraband** | `L.hasContraband(state)` | Warning icon (⚠️) if carrying illegal goods |
| **Saved** | Auto-save confirmation | Brief ✓ animation after save |

---
### 4.4 DebugPanel
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
| **Misc** | Fill hold, full repair, unlock hidden ports, complete mission | Various utilities |

---
### 4.5 Screen Router
**Purpose**: Renders the active screen based on `state.screen`.

```javascript
switch(state.screen) {
  case "title":      return <TitleScreen />;
  case "start":      return <ScenarioScreen />;
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
  default:          return <PortScreen />; // Fallback
}
```

---
## 5. screens_core.jsx — Core Screens

---
### 5.1 TitleScreen
**Purpose**: Main menu with game title, new game, continue, and import options.

- **UI Elements**:
  - Game title and subtitle.
  - **New Game** button → Navigates to `ScenarioScreen`.
  - **Continue** button (if `L.hasSave()`) → Dispatches `LOAD_GAME`.
  - **Import Save** file input → Dispatches `IMPORT_SAVE`.
  - **Tutorial Toggle**: Checkbox to set `tutorialMode` (`"full"`, `"light"`, `"none"`).

---
### 5.2 ScenarioScreen
**Purpose**: Scenario selection for new games.

- **UI Elements**:
  - **Scenario Cards**: 5 faction-based scenarios + 1 debug card (if `?debug=1`).
  - **Card Content**:
    - Faction flag icon.
    - Character name (e.g., "William the Forger").
    - Backstory excerpt.
    - Starting stats: ship, gold, crew, port.
  - **Selection**: Clicking a card dispatches `START_GAME { captainName, faction, tutorialMode }`.

---
### 5.3 OnboardingPopup
**Purpose**: Modal popup for **Quartermaster (QM) dialogue** in `"full"` onboarding mode.

- **Props**: `title`, `children`, `onDismiss`, `disableCheckbox`
- **UI Elements**:
  - **Title**: QM name or step title.
  - **Content**: Dialogue text (from `D.QM_DIALOGUE`).
  - **Dismiss Button**: "Got it" → Calls `onDismiss`.
  - **Checkbox**: "Don’t show tutorials again" → Calls `L.markTutorialSeen(screen, true)` if checked.

---
### 5.4 QMPopup
**Purpose**: Non-modal QM hints for **specific UI elements** (e.g., highlighting the mission board).

- **Props**: `target`, `text`, `onDismiss`, `placement`
- **UI Elements**:
  - **Arrow**: Points to the target element.
  - **Text**: Brief hint (e.g., "Click here to accept missions").
  - **Dismiss**: Click anywhere to close.

---
## 6. screens_port.jsx — Port Zone Screens

---
### 6.1 PortScreen
**Purpose**: Main hub for port activities. **2-column responsive layout** (stacks on mobile).

#### Left Column
| Section | Content | Actions |
|---|---|---|
| **Port Info** | Port name + faction flag + `RepPill` | — |
| **WORD ON THE DOCKS** | `NarrativePanel` with gossip (from `state.portGossip`) | — |
| **Actions** | Buttons for: Map, Shipyard, Crew, Market, Status, Journal | Navigates to respective screens |
| **Save/Load** | Save Game, Export Save, Import Save, Load Game | Dispatches `SAVE_GAME`, `EXPORT_SAVE`, etc. |

#### Right Column
| Section | Content | Actions |
|---|---|---|
| **Active Mission** | Mission details, progress, complete/abandon buttons | `COMPLETE_MISSION`, `ABANDON_MISSION` |
| **Mission Board** | 2-3 mission cards with type, risk pill, faction, rewards | `TAKE_MISSION` |
| **Captain’s Log** | `LogList` with recent entries | — |

---
### 6.2 StatusScreen
**Purpose**: Overview of reputation, faction relations, and career standing.

#### Sections
| Section | Content |
|---|---|
| **Career Standing** | Fame tier + progress bar, infamy label |
| **Faction Relations** | Per-faction reputation with labels, heat indicators |
| **Port Reputations** | All ports grouped by faction, `RepPill`, service availability notes |
| **Back Button** | Returns to `PortScreen` |

---
### 6.3 JournalScreen
**Purpose**: Browse and filter the captain’s log.

#### UI Elements
| Element | Purpose |
|---|---|
| **Filter Tabs** | All / Crew / Combat / Ports / Missions / Trade (uses `L.getLogTabCategory`) |
| **Search Bar** | Text filter across all entries |
| **Entries** | Grouped by day, reverse chronological, with icons from `L.classifyLogLine` |
| **Back Button** | Returns to previous screen (via `L.returnScreen`) |

---
## 7. screens_shipyard.jsx — Ship & Equipment Management

**Purpose**: Manage ships, equipment, and locker inventory. **3-tab dashboard layout**.

---
### 7.1 ShipyardScreen
#### Left Panel (Always Visible)
| Element | Content |
|---|---|
| **Current Ship** | Name + type + `ShipSprite` (side view) |
| **Ship Stats** | Hull, cannons, speed, hold, crew, range |
| **Equipped Items** | Grouped by slot (hull/armament/rigging/special), with remove buttons (if `removable: true`) |

#### Right Panel (Tab-Driven)
| Tab | Content | Actions |
|---|---|---|
| **Equipment** | Available equipment grid. Slot filter buttons. Each card shows: name, desc, downsideDesc, cost+installFee, effects, requiredFame/Hull. | `BUY_EQUIPMENT`, `INSTALL_EQUIPMENT` |
| **Ships** | Ship tier list. Each card: stats comparison, cost, requiredFame. Trade-in value shown. Equipment loss warning. | `BUY_SHIP` |
| **Locker** | Equipment inventory (`state.equipmentInventory`). Each item shows install button (installFee only, no purchase cost). | `INSTALL_EQUIPMENT` |

#### Stat Preview Panel
- Shows **before/after** stat deltas when hovering or selecting equipment/ship.
- **Green** for improvements, **red** for regressions.

---
## 8. screens_crew.jsx — Crew Management

---
### 8.1 CrewScreen
**Purpose**: View and manage the crew roster.

#### UI Elements
| Section | Content |
|---|---|
| **Roster Header** | Crew count / max, morale bar, faction composition breakdown |
| **Buy Drinks** | Button: 5g/crew, +5 morale → Dispatches `RAISE_MORALE` |
| **Hire Panel** | Hire 1/5/10 crew at 50g each (capped at `maxCrew`) → Dispatches `HIRE_CREW` |
| **Crew Manifest Grid** | Each member as a card with: name, role icon, faction border, days aboard label, scar icons, revealed trait badges, mutineer warning, loyal/veteran badges |
| **Crew Detail Panel** | (On member click) Full name, role, faction, days aboard, generated biography (from `G.generateCrewBio`), complete tag list with icon legend |
| **Back Button** | Returns to `PortScreen` |

---
## 9. screens_market.jsx — Trading

---
### 9.1 MarketScreen
**Purpose**: Buy/sell goods, manage hold.

#### UI Elements
| Section | Content |
|---|---|
| **Hold Status Bar** | Used / capacity with color-coded load % and speed warning (if > 50% full) |
| **Goods List** | All available market goods with: name + unit, market buy/sell prices, available quantity, buy/sell quantity controls (decrement/increment + direct input), player’s current stock |
| **Black Market** | Illegal goods (tobacco, slaves) shown separately with infamy warning |
| **Pending Trade Summary** | Running total of gold delta, hold space delta |
| **Controls** | Confirm (dispatches `CONFIRM_TRADE`), Reset |
| **Back Button** | Returns to `PortScreen` |

---
## 10. screens_voyage.jsx — Voyage Zone Screens

---
### 10.1 MapScreen
**Purpose**: Select destination and view the Caribbean map.

#### UI Elements
| Element | Description |
|---|---|
| **SVG Map** | Caribbean with port circles (faction-colored fill). Current location marker. Mission route line (dotted to active mission target). |
| **Port Tooltips** | On hover: port name, faction, days to reach, reputation, heat level |
| **Port Styling** | Greyed out if unreachable (with reason from `L.getUnreachableReason`). Hidden ports not rendered until discovered. |
| **Wind Compass** | Shows current wind direction and speed |
| **Faction Legend** | Color key for factions |
| **Click Handling** | Click port → Dispatches `SAIL_TO { destination }` |
| **Back Button** | Returns to `PortScreen` |

---
### 10.2 SailingScreen
**Purpose**: Manage active voyage.

#### UI Elements
| Section | Content |
|---|---|
| **Route Visualization** | SVG mini-map with origin, destination, ship position (based on progress) |
| **Wind Indicator** | Compass direction + speed |
| **Provisions Panel** | Food/water bars with days remaining |
| **Controls** | Advance Day button (dispatches `ADVANCE_DAY`), Enter Port (if arrived) |
| **Captain’s Log** | Recent entries via `LogList` |
| **Journal Link** | Navigates to `JournalScreen` |

---
### 10.3 EventScreen
**Purpose**: Resolve random events.

#### UI Elements
| Element | Description |
|---|---|
| **Modal Overlay** | Blocks interaction with underlying screen |
| **Event Title** | From `activeEvent.title` |
| **Type Pill** | Color-coded by event type (hazard/choice/reward/crew/discovery) |
| **Description** | From `activeEvent.desc` |
| **Choices** | Rendered as clickable cards. Each shows label + brief outcome hint. |
| **Choice Handling** | Clicking dispatches `RESOLVE_EVENT { choiceIndex }` |

---
### 10.4 InterceptScreen
**Purpose**: Resolve ship encounters (combat, patrol, etc.).

#### UI Elements
| Element | Description |
|---|---|
| **Enemy Stats Panel** | Name, hull, cannons, crew, faction |
| **Flavour Text** | From `encounterContext.flavourText` |
| **Options** | Rendered from `encounterContext.options[]`:
  - Each option: label, available flag, disabled reason
  - Clicking dispatches the option’s `action` (e.g., `INTERCEPT_FIGHT`, `INTERCEPT_FLEE`)
| **Speed Comparison** | Shows player vs. enemy speed for flee option |
| **Note** | **Fully data-driven** from `state.encounterContext`. No game logic in this component. |

---
### 10.5 BattleScreen
**Purpose**: Turn-based naval combat.

#### Layout
- **3-column layout**: Player | Battle Log | Enemy

#### UI Elements
| Section | Content |
|---|---|
| **Player/Enemy** | Name, hull bar, crew count, cannons, ship type |
| **Convoy Hull Bar** | (Escort missions only) |
| **Action Grid** | 4 buttons: Broadside, Precision, Grapple, Evade. Each has brief effect description. |
| **Battle Log** | Scrolling turn-by-turn results with damage numbers and crew loss names |
| **Result States** | |
| - **Victory** | Gold/fame summary, plunder button (if `canPlunder`), continue button |
| - **Defeat** | Loss summary, return to port button |
| - **Fled** | Morale penalty note, continue sailing button |

---
### 10.6 PlunderScreen
**Purpose**: Loot defeated enemy ships.

#### UI Elements
| Section | Content |
|---|---|
| **Gold Reward** | Shown at top (`PLUNDER_GOLD_RATIO` of total) |
| **Enemy Cargo List** | Goods with quantities, take buttons (adds to player hold) |
| **Player Hold Panel** | Current contents, jettison buttons, remaining capacity |
| **Confirm Button** | Dispatches `TAKE_PLUNDER` with selected cargo, returns to sailing/port |



---

---
### 11. screens_menu.jsx — Menu & Feedback System

**Purpose**: Centralized menu modal for game controls, feedback, and changelog.

#### Components
   Component | Props | Purpose |
 |---|---|---|
 | **`MenuModal`** | `state, dispatch, onClose` | Main menu modal with tabs for menu, new game, changelog, feedback |
 | **`FeedbackPanel`** | `popPanel, state` | Feedback form with auto-filled metadata (OS, browser, URL, playtime) and optional save data |
 | **`renderChangelog`** | `md` | Renders changelog markdown as JSX |

#### Features
- **Auto-detection**: Detects if running on itch.io (blocks external form submission).
- **Feedback Form**:
  - Uses **FormSubmit.co** (`https://formsubmit.co/gregory.paladin@me.com`).
  - Pre-fills: date, OS, browser, URL, playtime, save data (optional).
  - Opens in new tab on itch.io (due to CSP restrictions).
- **Changelog Viewer**: Fetches `docs/changelog.md` and renders it as formatted cards.
- **Menu Options**:
  - Resume, Save Game, Load Game, New Game, Export Save, Import Save.
  - Links to Handbook, Changelog, Feedback.
  - External links: GitHub, itch.io, Ko-fi.

#### itch.io Limitation
- Feedback form **does not work** on itch.io due to CSP blocking `formsubmit.co`.
- Falls back to redirecting users to itch.io’s **comments section**.

**Equipment Impact**: *None* (UI-only).


---
## 12. Exposed Components Summary

All screen components are registered on `window.S` via `Object.assign` at the bottom of each screen file:

```javascript
// screens_core.jsx
Object.assign(window.S, {
  TitleScreen,
  ScenarioScreen,
  OnboardingPopup,
  QMPopup
});

// screens_port.jsx
Object.assign(window.S, {
  PortScreen,
  StatusScreen,
  JournalScreen
});

// screens_shipyard.jsx
Object.assign(window.S, {
  ShipyardScreen
});

// screens_crew.jsx
Object.assign(window.S, {
  CrewScreen
});

// screens_market.jsx
Object.assign(window.S, {
  MarketScreen
});

// screens_voyage.jsx
Object.assign(window.S, {
  MapScreen,
  SailingScreen,
  EventScreen,
  InterceptScreen,
  BattleScreen,
  PlunderScreen
});
```

All screens receive `{ state, dispatch }` props from `App.jsx`.

---
## 13. Tutorial System Integration

---
### 13.1 TutorialPopup (ui.jsx)
**Purpose**: Dismissible overlay card for per-screen tutorials.

- **Props**: `title`, `children`, `onDismiss`
- **UI Elements**:
  - Title text
  - Content (children)
  - "Got it" dismiss button
  - "Don’t show tutorials again" checkbox → Calls `L.markTutorialSeen(screen, true)`

---
### 13.2 Per-Screen Tutorials
Each screen checks `L.shouldShowTutorial(screenName)` on mount. If true, renders a `TutorialPopup` with screen-specific guidance:

| Screen | Tutorial Content |
|---|---|
| `port` | Port services overview, mission board, gossip panel |
| `map` | How to select destinations, unreachable ports |
| `sailing` | Advance Day, provisions, events |
| `battle` | Combat actions, victory/defeat |
| `market` | Buy/sell, contraband risk, hold management |
| `crew` | Hiring, morale, member details |
| `shipyard` | Equipment slots, ships, locker |
| `journal` | Filtering, searching log entries |
| `status` | Reputation, fame, faction relations |

---
### 13.3 Tutorial State Management
- **Storage Key**: `"broadside_tutorial"` (managed by `storage.js`).
- **State Shape**:
  ```javascript
  {
    seenScreens: string[],    // e.g., ["port", "map"]
    disableAll: boolean       // true if user opted out
  }
  ```
- **Functions**: `L.shouldShowTutorial(screen)`, `L.markTutorialSeen(screen, disableAll)`

---
## 14. Dependencies & Rules

---
### 14.1 Dependency Rules

| File | May Read | May NOT Call |
|---|---|---|
| `ui.jsx` | `window.D`, `window.L` | Engine, Generators |
| `icons.jsx` | `window.D` | Engine, Generators |
| `App.jsx` | `window.D`, `window.L`, `window.E`, `window.UI`, `window.S` | — |
| `screens_*.jsx` | `window.D`, `window.L`, `window.E.A`, `window.UI`, `window.S` | `window.G` (generators) |

---
### 14.2 Style Rules

1. **No CSS files**: All styling is **inline** via theme tokens (`T`) and helper functions (`panelStyle()`).
2. **Color Tokens**: **Never hardcode hex values**. Always use `T.*` (e.g., `T.gold` instead of `#c9a84c`).
3. **Touch Targets**: Minimum size = `T.btnMinHeight` (44px) for buttons.
4. **Narrative Text**: Uses `T.narrativeFontSize` (11px) and `T.narrativeLineHeight` (1.6).
5. **Responsive Layouts**: Use inline `flexbox`/`grid` with media queries if needed.

---
### 14.3 Screen Naming Convention

| Type | Convention | Example |
|---|---|---|
| **Component** | PascalCase | `ShipyardScreen` |
| **Screen Key** | camelCase | `"shipyard"` |
| **Navigation** | `A.NAVIGATE` action | `dispatch({ type: A.NAVIGATE, screen: "shipyard" })` |
