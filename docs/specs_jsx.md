# specs_jsx.md -- React/JSX Module Specification

**Broadside UI Components & Screens**
*Last Updated: June 8, 2026*

---

## 1. Overview

| File | Namespace | Contents |
|---|---|---|
| `ui.jsx` | `window.UI` | Theme tokens, all presentational/reusable components |
| `screens_port.jsx` | `window.S` | TitleScreen, ScenarioScreen, PortScreen, StatusScreen, JournalScreen |
| `screens_shipyard.jsx` | `window.S` | ShipyardScreen |
| `screens_crew.jsx` | `window.S` | CrewScreen |
| `screens_market.jsx` | `window.S` | MarketScreen |
| `screens_voyage.jsx` | `window.S` | MapScreen, SailingScreen, EventScreen, InterceptScreen, BattleScreen, PlunderScreen |
| `App.jsx` | -- | Root component: ErrorBoundary, App (HUD + router), DebugPanel |

**Dependencies** (all JSX files may read):

- `window.D` -- data constants (PORTS, SHIPS, FACTIONS, EQUIPMENT, RESOURCES)
- `window.L` -- logic helpers (getShipStats, getRepPerk, getFameInfo, getHoldCapacity, etc.)
- `window.E` -- engine (E.A action constants for dispatch)
- `window.UI` -- theme + components (screens only)

**May NOT call**: `window.G` (generators) directly from screen files. Generators are invoked only by engine reducers.

---

## 2. ui.jsx -- Theme & Reusable Components

### Theme Tokens (T)

All visual constants. No component may use a hardcoded colour or font.

```js
T = {
  bg:         '#1a1207',   // Page background
  panel:      '#2a1f10',   // Panel background
  panelAlt:   '#352a18',   // Alternate panel
  border:     '#5a4a2a',   // Standard border
  borderFaint:'#3a2e1a',   // Subtle border
  borderBr:   '#8a7a50',   // Bright border (hover)
  text:       '#d4c4a0',   // Primary text
  textDim:    '#a09070',   // Secondary text
  textFaint:  '#706050',   // Tertiary text
  gold:       '#c9a84c',   // Gold accent
  goldDim:    '#8a7530',   // Muted gold
  goldBr:     '#e8d080',   // Bright gold (hover)
  green:      '#4a8c4a',   // Positive / success
  red:        '#8c4a4a',   // Negative / danger
  blue:       '#4a6a8c',   // Info / navigation
  purple:     '#6a4a8c',   // Pirate / special
  font:       'Courier New, monospace',
  fontSize:   12,
  btnMinHeight: 44,        // Touch target minimum
  narrativeFontSize: 11,
  narrativeLineHeight: 1.6,
  metadataFontSize: 10,
  captionFontSize: 9,
  riskColor: { low: '#4a8c4a', medium: '#c9a84c', high: '#8c4a4a' }
}
```

### panelStyle(overrides)

Returns a base panel style object (background, border, padding, borderRadius) with optional overrides. Used by all screens for consistent panel appearance.

### Base Components

| Component | Props | Purpose |
|---|---|---|
| **Btn** | `onClick, children, disabled, variant, sm, style` | Button. Variants: `default` (gold border), `gold` (filled), `ghost` (borderless), `green`, `red`. `sm` for compact. |
| **Bar** | `value, max, color, h, label` | Horizontal progress bar (hull, morale, etc.) |
| **Pill** | `label, color, style` | Small coloured badge |
| **StatBlock** | `label, value, sub` | Label + value pair with optional sub-text |
| **SectionTitle** | `children, action` | Section header with optional action button |
| **ScreenHeader** | `title, onBack` | Screen title with back navigation |
| **LogList** | `entries, maxEntries` | Captain's log display. Groups entries by day (detects `[Day N]` prefix). Applies `L.classifyLogLine` icons. |
| **Divider** | `style` | Horizontal separator line |
| **EmptyState** | `message, icon` | Placeholder for empty lists |
| **BackButton** | `dispatch, screen, label` | Dispatches `A.NAVIGATE` to return to a screen |
| **NarrativePanel** | `title, icon, variant, children` | Styled narrative container. Variants: `neutral`, `gossip`, `danger`, `crew`, `discovery`, `trade`. Each variant has distinct border colour and icon. |
| **NarrativeLine** | `children` | Single narrative text line (uses `narrativeFontSize` and `narrativeLineHeight`) |
| **TutorialPopup** | `title, children, onDismiss` | Overlay tutorial card with dismiss button and "Don't show tutorials again" checkbox |

### Game Components

| Component | Props | Purpose |
|---|---|---|
| **FactionPill** | `faction` | Coloured pill showing faction label + flag icon |
| **RepPill** | `rep` | Pill coloured by reputation tier (At War/Hostile/Neutral/Friendly/Allied) |
| **ShipSprite** | `type, size` | SVG ship silhouette by type. Scales by `size`. |

---

## 3. App.jsx -- Root Component

### ErrorBoundary

- Catches render errors anywhere in the component tree
- Displays error message with two recovery options:
  - **Reload Page**: full page reload
  - **Try Load Last Save**: dispatches `LOAD_GAME` to recover from localStorage

### App

- Initialises `useReducer(E.reducer, E.initialState)`
- Renders `HUD` (sticky top) + screen router
- Auto-save effect: triggers `E.autoSave(state)` on state changes

### HUD

Sticky top bar showing:

| Element | Source |
|---|---|
| Gold | `state.gold` |
| Day + Calendar Date | `state.day`, computed from `state.startDate` |
| Crew | `roster.length / crew.max` |
| Hull | `ship.hull / getShipStats().maxHull` |
| Morale | `getEffectiveMorale(state)` |
| Fame | `state.fame` with tier label |
| Infamy | `state.infamy` with label |
| Heat indicator | Max faction alert (if > 0) |
| Provisions | Food + water days remaining |
| Hold | Used / capacity with load % |
| Contraband | Warning icon if carrying illegal goods |
| Saved flash | Brief checkmark animation after auto-save |

### DebugPanel

Activated via `?debug=1` URL parameter. Gear icon in HUD toggles panel.

| Category | Controls |
|---|---|
| Gold | +1K, +10K, +100K, +1M |
| Fame | Set to 50, 100, 200, 350 |
| Infamy | Set to 0, 25, 50, 100 |
| Ship | Switch to any ship type |
| Reputation | Set current port to 5, 10, 50, 65, 85 |
| Heat | Set per-faction alert 0-10 |
| Morale | Set to 10, 50, 80, 100 |
| Crew | Max crew, age +50/+100/+200 days |
| Misc | Fill hold, full repair, unlock hidden ports, complete mission |

### Screen Router

```js
switch(state.screen) {
  case "title":     return <TitleScreen />
  case "start":     return <ScenarioScreen />
  case "port":      return <PortScreen />
  case "map":       return <MapScreen />
  case "sailing":   return <SailingScreen />
  case "shipyard":  return <ShipyardScreen />
  case "crew":      return <CrewScreen />
  case "status":    return <StatusScreen />
  case "market":    return <MarketScreen />
  case "journal":   return <JournalScreen />
  case "event":     return <EventScreen />
  case "intercept": return <InterceptScreen />
  case "battle":    return <BattleScreen />
  case "plunder":   return <PlunderScreen />
}
```

---

## 4. screens_port.jsx -- Port Zone Screens

### TitleScreen

- Game title and subtitle
- **New Game** button -> ScenarioScreen
- **Continue** button (if `L.hasSave()`) -> dispatches `LOAD_GAME`
- **Import Save** file input -> dispatches `IMPORT_SAVE`
- Tutorial toggle checkbox

### ScenarioScreen

- Displays 5 scenario cards + 1 debug card (if `?debug=1`)
- Each card shows: faction flag, character name, backstory excerpt, starting stats (ship, gold, crew, port)
- Selecting a scenario dispatches `START_GAME { scenarioId }`

### PortScreen

Main hub screen. 2-column responsive layout:

**Left column:**
- Port name + faction flag + reputation pill
- **WORD ON THE DOCKS** gossip panel (`NarrativePanel` variant=gossip)
- **Actions** panel: navigation buttons (Map, Shipyard, Crew, Market, Status, Journal)
- **Save/Load** buttons: Save Game, Export Save, Import Save, Load Game

**Right column:**
- **Active Mission** panel (if any): details, progress, complete/abandon buttons
- **Mission Board**: 2-3 mission cards with type, risk pill, faction, gold/fame/rep rewards, trade/smuggle cargo requirements
- **Captain's Log** (`LogList` component)

### StatusScreen

- **Career Standing**: fame tier + progress, infamy label
- **Faction Relations**: per-faction reputation with labels, heat indicators
- **Port Reputations**: all ports grouped by faction, rep pills, service availability notes
- BackButton to port

### JournalScreen

- **Filter Tabs**: All / Crew / Combat / Ports / Missions / Trade (uses `L.getLogTabCategory`)
- **Search Bar**: text filter across all entries
- **Entries**: grouped by day, reverse chronological, with icons from `L.classifyLogLine`
- BackButton to port or sailing (via `L.returnScreen`)

---

## 5. screens_shipyard.jsx -- Ship & Equipment Management

### ShipyardScreen

3-tab split dashboard layout:

**Left panel (always visible):**
- Current ship name + type + ShipSprite
- Ship stats (hull, cannons, speed, hold, crew, range)
- Equipped items grouped by slot, with remove buttons (if `removable: true`)

**Right panel (tab-driven):**

| Tab | Content |
|---|---|
| **Equipment** | Available equipment grid. Slot filter buttons (hull/armament/rigging/special/all). Each card shows: name, desc, downsideDesc, cost+installFee, effects, requiredFame/Hull. Buy button validates via `L.canInstallEquipment`. |
| **Ships** | Ship tier list. Each card: stats comparison, cost, requiredFame. Buy button with trade-in value shown. Equipment loss warning. |
| **Locker** | Equipment inventory (`state.equipmentInventory`). Each item shows install button (installFee only, no purchase cost). |

**Stat Preview Panel:**
- Shows before/after stat deltas when hovering or selecting equipment/ship
- Green for improvements, red for regressions

**Responsive**: On mobile, left panel collapses to accordion.

---

## 6. screens_crew.jsx -- Crew Management

### CrewScreen

- **Roster Header**: crew count / max, morale bar, faction composition breakdown
- **Buy Drinks** button: 5g/crew, +5 morale (dispatches `RAISE_MORALE`)
- **Hire Panel**: hire 1/5/10 crew at 50g each (dispatches `HIRE_CREW`)
- **Crew Manifest Grid**: each member shown as a card with:
  - Name (firstName lastName)
  - Role icon
  - Faction border colour
  - Days aboard label (New Hand / Settling / Seasoned / Veteran / Old Salt)
  - Scar icons with tooltips
  - Revealed trait badges
  - Mutineer warning indicator
  - Loyal/veteran positive badge
- **Crew Detail Panel** (on member click):
  - Full name, role, faction, days aboard
  - Generated biography (from `G.generateCrewBio`)
  - Complete tag list with icon legend
- BackButton to port

---

## 7. screens_market.jsx -- Trading

### MarketScreen

- **Hold Status Bar**: used / capacity with colour-coded load % and speed warning
- **Goods List**: all available market goods with:
  - Good name + unit
  - Market buy/sell prices
  - Available quantity in port
  - Buy/sell quantity controls (decrement/increment buttons + direct input)
  - Player's current stock of that good
- **Black Market Section**: illegal goods (tobacco, slaves) shown separately with infamy warning
- **Pending Trade Summary**: running total of gold delta, hold space delta
- **Confirm / Reset** buttons: Confirm dispatches `CONFIRM_TRADE { buys, sells }`
- BackButton to port

---

## 8. screens_voyage.jsx -- Voyage Zone Screens

### MapScreen

- SVG Caribbean map with port circles:
  - Faction-coloured fill
  - Hover tooltip: port name, faction, days to reach, reputation, heat level
  - Greyed out if unreachable (with reason from `L.getUnreachableReason`)
  - Hidden ports not rendered until in `discoveredPorts`
- Current location marker
- Mission route line (dotted to active mission target port)
- Wind compass indicator
- Faction colour legend
- Click port -> dispatches `SAIL_TO { destination }`
- BackButton to port

### SailingScreen

- Responsive layout
- **Route Visualisation**: SVG mini-map with origin, destination, ship position based on progress
- **Wind Indicator**: compass direction + speed
- **Provisions Panel**: food/water bars with days remaining
- **Controls**: Advance Day button (dispatches `ADVANCE_DAY`), Enter Port (if arrived)
- **Captain's Log**: recent entries via `LogList`
- Journal link

### EventScreen

- Modal overlay with event title, type-coloured pill, description text
- Choices rendered as clickable cards
- Each choice shows label + brief outcome hint
- Selecting dispatches `RESOLVE_EVENT { choiceIndex }`

### InterceptScreen

- **Fully data-driven** from `state.encounterContext`
- Enemy stats panel: name, hull, cannons, crew, faction
- Flavour text from `encounterContext.flavourText`
- Options rendered from `encounterContext.options[]`:
  - Each option: label, available flag, disabled reason
  - Clicking dispatches the option's `action` (e.g., `INTERCEPT_FIGHT`, `INTERCEPT_FLEE`)
- Speed comparison display for flee option
- **No game logic in this component** -- purely presentational

### BattleScreen

- **3-column layout**: Player | Battle Log | Enemy
- Each combatant shows: name, hull bar, crew count, cannons, ship type
- Convoy hull bar (escort missions only)
- **Action Grid**: 4 buttons (broadside, precision, grapple, evade) with brief effect descriptions
- **Battle Log**: scrolling turn-by-turn results with damage numbers and crew loss names
- **Result States**:
  - Victory: gold/fame summary, plunder button (if `canPlunder`), continue button
  - Defeat: loss summary, return to port button
  - Fled: morale penalty note, continue sailing button

### PlunderScreen

- **Enemy Cargo List**: goods with quantities, take buttons (adds to player hold)
- **Player Hold Panel**: current contents, jettison buttons, remaining capacity
- **Gold Reward**: shown at top (PLUNDER_GOLD_RATIO of total)
- **Confirm** button: dispatches `TAKE_PLUNDER` with selected cargo, returns to sailing/port

---

## 9. Exposed Screen Components

All screen components are registered on `window.S` via `Object.assign` at the bottom of each screen file:

```js
// screens_port.jsx
Object.assign(window.S, { TitleScreen, ScenarioScreen, PortScreen, StatusScreen, JournalScreen });

// screens_shipyard.jsx
Object.assign(window.S, { ShipyardScreen });

// screens_crew.jsx
Object.assign(window.S, { CrewScreen });

// screens_market.jsx
Object.assign(window.S, { MarketScreen });

// screens_voyage.jsx
Object.assign(window.S, { MapScreen, SailingScreen, EventScreen, InterceptScreen, BattleScreen, PlunderScreen });
```

All screens receive `{ state, dispatch }` props from App.jsx.

---

## 10. Tutorial System

### TutorialPopup Component (ui.jsx)

A dismissible overlay card with:
- Title text
- Content (children)
- "Got it" dismiss button
- "Don't show tutorials again" checkbox (calls `L.markTutorialSeen(screen, true)`)

### Per-Screen Tutorials

Each screen checks `L.shouldShowTutorial(screenName)` on mount. If true, renders a TutorialPopup with screen-specific guidance:

| Screen | Tutorial Content |
|---|---|
| port | Port services overview, mission board, gossip panel |
| map | How to select destinations, unreachable ports |
| sailing | Advance Day, provisions, events |
| battle | Combat actions, victory/defeat |
| market | Buy/sell, contraband risk, hold management |
| crew | Hiring, morale, member details |
| shipyard | Equipment slots, ships, locker |
| journal | Filtering, searching log entries |
| status | Reputation, fame, faction relations |

### State Management (storage.js)

Tutorial state is stored in `localStorage` under key `"broadside_tutorial"`:

```js
{ seenScreens: ['port', 'map', ...], disableAll: false }
```

Functions: `shouldShowTutorial(screen)`, `markTutorialSeen(screen, disableAll?)`

---

## 11. Dependencies & Notes

### Dependency Rules

| File | May Read | May NOT Call |
|---|---|---|
| `ui.jsx` | `window.D`, `window.L` | Engine, Generators |
| `screens_*.jsx` | `window.D`, `window.L`, `window.E.A`, `window.UI` | `window.G` (generators) |
| `App.jsx` | Everything | -- |

### Style Rules

- **No CSS files**. All styling is inline via theme tokens `T` and `panelStyle()`.
- Colours must come from `T.*`. No hardcoded hex values in screen files.
- Minimum touch target: `T.btnMinHeight` (44px).
- Narrative text uses `T.narrativeFontSize` (11px) and `T.narrativeLineHeight` (1.6).

### Screen Naming Convention

- Component: `PascalCase` (e.g., `ShipyardScreen`)
- Screen key (for router): `camelCase` string (e.g., `"shipyard"`)
- Navigation: dispatch `{ type: A.NAVIGATE, screen: "shipyard" }`
