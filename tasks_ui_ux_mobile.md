# Broadside UI/UX, Narrative, and Mobile Support Improvement Tasks

> **Goal**: Improve visual consistency, immersion, narrative atmosphere, and mobile responsiveness across all screens in *Broadside*.
> **Scope**: UI/UX refinements, thematic renaming, flavour text, visual polish, and mobile support.
> **Priority**: High (H), Medium (M), Low (L)
> **Effort**: Low (⚡), Medium (⚡⚡), High (⚡⚡⚡)

---

---

## 🎯 **Table of Contents**
1. [UI/UX Consistency Tasks](#-1-uiux-consistency-tasks)
2. [Narrative Atmosphere Tasks](#-2-narrative-atmosphere-tasks)
3. [Responsiveness & Mobile Support Tasks](#-3-responsiveness--mobile-support-tasks)
4. [Screen-Specific Tasks](#-4-screen-specific-tasks)
5. [Implementation Roadmap](#-5-implementation-roadmap)
6. [Testing Checklist](#-6-testing-checklist)

---



## 🎨 **1. UI/UX Consistency Tasks**

### **1.1 Standardize Panel Styling** --> DONE
### **1.2 Unify Button Styling** --> DONE
### **1.3 Typographic Scale** --> DONE
### **1.4 Spacing System** --> DONE
### **1.5 Color Token Audit** -- DONE
### **1.6 Standardize Back Navigation** --> DONE
### **1.7 Centralize Tutorial Popups** -- Parked due to future onbording revamp
- **What**: Create a `<TutorialProvider>` to manage tutorial state and styling.
### **1.8 Standardize Empty States** --> DONE
### **1.9 Add Loading States** --> alost instant, rejected.
- **What**: Add a `<LoadingSpinner>` for async actions (e.g., event generation).



---
## 📜 **2. Narrative Atmosphere Tasks**

---
### **2.1 Rename UI Labels for Immersion** --> rejected
- **What**: Replace generic labels with nautical/pirate-themed terms.
- **Why**: Enhances immersion and fits the game’s setting.
- **How**:
  - Update button/text labels in `screens_*.jsx`. Examples:
 | **Current**         | **New**               | **File**               |
 |---------------------|-----------------------|------------------------|
 | "Advance Day"       | "Sail Onward"         | `screens_voyage.jsx`   |
 | "Enter Port"        | "Dock at Port"        | `screens_voyage.jsx`   |
 | "Change Course"     | "Alter Course"        | `screens_voyage.jsx`   |
 | "Plunder the Ship"  | "Seize the Spoils"    | `screens_voyage.jsx`   |
 | "Provisions"        | "Ship's Stores"       | `screens_voyage.jsx`   |
 | "Captain's Log"     | "Ship's Log"          | `screens_voyage.jsx`   |
 | "Crew"              | "Hands"               | `screens_crew.jsx`     |
 | "Market"            | "Port Bazaar"         | `screens_market.jsx`   |
 | "Shipyard"          | "Dry Dock"            | `screens_shipyard.jsx` |
 | "Battle"            | "Naval Combat"        | `screens_voyage.jsx`   |
 | "Flee"              | "Make for Open Sea"   | `screens_voyage.jsx`   |
 | "Grapple"           | "Board the Enemy"     | `screens_voyage.jsx`   |
 | "Broadside"         | "Loose a Broadside"   | `screens_voyage.jsx`   |
 | "Precision"         | "Aimed Shot"          | `screens_voyage.jsx`   |
 | "Evade"             | "Outmaneuver"         | `screens_voyage.jsx`   |
- **Priority**: H
- **Effort**: ⚡

---
### **2.2 Add Flavour Text to Screens**
- **What**: Add immersive descriptions to screens (e.g., tutorials, empty states).
- **Why**: Enhances the game’s narrative and guides players thematically.
- **How**:
  - Replace generic tutorial text with thematic descriptions. Examples:
    - **MapScreen**:
      > *"The Caribbean stretches before you, Captain. Click a port to set sail, but beware—grey ports are beyond your ship's range. Upgrade at a Dry Dock to reach farther horizons."*
    - **SailingScreen**:
      > *"The wind fills your sails as you cut through the waves. Each day brings new challenges—storms, encounters, or fortune. Advance carefully, and keep an eye on your provisions."*
    - **BattleScreen**:
      > *"The enemy ship looms ahead, cannons primed. Your crew stands ready—will you fire a broadside, attempt a daring boarding action, or flee to fight another day?"*
  - Add flavour to empty states:
    ```jsx
    <EmptyState message="The market is barren, Captain. Try another port!" />
    ```
- **Files**: `screens_*.jsx`
- **Priority**: H
- **Effort**: ⚡

---
### **2.3 Add Tooltips for Buttons** --> DONE (mostly)
- **What**: Add tooltips to buttons to explain actions in-character.
- **Why**: Helps players understand mechanics while staying immersive.
- **How**:
  - Create a `<Tooltip>` component in `ui.jsx`:
    ```jsx
    const Tooltip = ({ text, children }) => (
      <div style={{ position: "relative", display: "inline-block" }}>
        {children}
        <div style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          background: T.panel,
          border: `1px solid ${T.border}`,
          borderRadius: 2,
          padding: 4,
          fontSize: 10,
          color: T.textDim,
          whiteSpace: "nowrap",
          opacity: 0,
          transition: "opacity 0.2s",
          pointerEvents: "none",
          zIndex: 100,
        }}>
          {text}
        </div>
      </div>
    );
    ```
  - Add tooltips to key buttons. Examples:
 | **Button**         | **Tooltip**                                      |
 |-------------------|--------------------------------------------------|
 | "Sail Onward"     | *"Order the crew to advance one day. Consumes provisions and may trigger events."* |
 | "Dock at Port"    | *"Drop anchor and enter the port. Trade, rest, or recruit here."* |
 | "Alter Course"    | *"Change your destination mid-voyage—if your ship can handle it."* |
- **Files**: `ui.jsx`, `screens_*.jsx`
- **Priority**: M
- **Effort**: ⚡⚡

---
### **2.4 Enhance Port Descriptions**. --> already present in port screen, rejeccted for map screen.
- **What**: Add flavour text to ports in `data.js`.
- **Why**: Makes the world feel alive and gives players a sense of place.
- **How**:
  - Extend `PORTS` in `data.js` with a `description` field:
    ```js
    PORTS: {
      port_royal: {
        name: "Port Royal",
        description: "A bustling hub of trade and intrigue, where gold flows as freely as rum. The Governor's watchful eye keeps piracy in check... for now.",
        x: 100,
        y: 200,
        faction: "british",
      },
      tortuga: {
        name: "Tortuga",
        description: "A haven for pirates and scoundrels. The air smells of salt, gunpowder, and opportunity.",
        x: 300,
        y: 150,
        faction: "pirate",
      },
    }
    ```
  - Display the description in `MapScreen` on hover or in a sidebar.
- **Files**: `data.js`, `screens_voyage.jsx`
- **Priority**: M
- **Effort**: ⚡

---
### **2.5 Improve Event Descriptions** --> postpone for now, we already created varuations chosen randomly.
- **What**: Rewrite event descriptions to be more vivid and thematic.
- **Why**: Current events are functional but lack atmosphere.
- **How**:
  - Update event descriptions in `engine_voyage.js` or `engine_combat.js`. Examples:
 | **Current**               | **Improved**                                                                 |
 |---------------------------|------------------------------------------------------------------------------|
 | "You encountered a storm!" | *"The skies darken as a squall bears down on your ship. The crew scrambles to reef the sails—will you weather the storm or be dashed against the rocks?"* |
 | "Found treasure!"         | *"Your lookout spots a wreckage floating in the distance. A chest bobs in the water—could it be treasure, or a trap?"* |
 | "Enemy ship spotted!"     | *"A black flag snaps in the wind on the horizon. The enemy ship turns toward you, cannons glinting in the sunlight. Prepare for battle!"* |
- **Files**: `engine_voyage.js`, `engine_combat.js`
- **Priority**: M
- **Effort**: ⚡⚡

---
### **2.6 Thematic Reputation Labels** --> rejected
- **What**: Replace generic reputation labels (e.g., "Friendly") with pirate-themed terms.
- **Why**: Fits the game’s setting better.
- **How**:
  - Update `reputationLabel` in `logic.js` or `ui.jsx`:
    ```js
    reputationLabel: (rep) => {
      if (rep >= 80) return "Allied";
      if (rep >= 60) return "Favored";
      if (rep >= 40) return "Neutral";
      if (rep >= 20) return "Distrusted";
      return "Wanted";
    }
    ```
- **Files**: `logic.js`, `ui.jsx`
- **Priority**: M
- **Effort**: ⚡

---
### **2.7 Add Icons for Goods/Factions/Events** --> in progress
- **What**: Replace emoji or text icons with custom SVG icons.
- **Why**: Enhances visual identity and immersion.
- **How**:
  - Add SVG icons to `ui.jsx` (e.g., `IconRum`, `IconCannon`, `IconStorm`).
  - Example:
    ```jsx
    const IconRum = ({ size = 16, color = T.gold }) => (
      <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
        <path d="M8 2L10 6H6L8 2Z" />
        <path d="M4 6V14H12V6H4Z" />
      </svg>
    );
    ```
  - Use icons in `PlunderScreen`, `MarketScreen`, and event descriptions.
- **Files**: `ui.jsx`, `screens_*.jsx`
- **Priority**: M
- **Effort**: ⚡⚡

---
### **2.8 Visual Atmosphere: Parchment/Ocean Textures** --> parked / fil rouge
- **What**: Add subtle textures to panels for a pirate aesthetic.
- **Why**: Breaks up flat colors and enhances the theme.
- **How**:
  - Add a `parchment.png` or `ocean-waves.png` texture to the repo.
  - Apply as a background to panels:
    ```jsx
    <div style={{
      ...panelStyle(),
      background: "url('parchment.png') repeat",
      backgroundSize: "100px 100px",
    }}>
    ```
  - Alternatively, use CSS gradients to simulate texture:
    ```jsx
    background: "linear-gradient(45deg, #2a221a 25%, #1a1510 25%, #1a1510 50%, #2a221a 50%, #2a221a 75%, #1a1510 75%)",
    ```
- **Files**: `ui.jsx`, `screens_*.jsx`
- **Priority**: L
- **Effort**: ⚡⚡

---
### **2.9 Animate Wind/Waves/Ship Movement** --> parked
- **What**: Add subtle animations to the map and sailing screens.
- **Why**: Brings the world to life and improves immersion.
- **How**:
  - **Wind Arrow Animation** (in `MapScreen`):
    ```jsx
    // In the wind indicator SVG:
    <g transform={`rotate(${state.wind.angle})`} style={{ animation: "spin 10s linear infinite" }}>
      <line x1={0} y1={10} x2={0} y2={-12} stroke={T.blueBr} strokeWidth="2" />
    </g>
    ```
    Add to `index.html`:
    ```html
    <style>
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    </style>
    ```
  - **Wave Animation** (in `MapScreen`):
    - Animate the `seaGrid` pattern to simulate gentle waves.
  - **Ship Bobbing** (in `SailingScreen`):
    - Add a subtle vertical animation to the ship SVG:
      ```jsx
      <g transform={`translate(${shipX},${shipY}) rotate(${hdgDeg})`} style={{ animation: "bob 3s ease-in-out infinite" }}>
        ...
      </g>
      ```
      Add to `index.html`:
      ```html
      @keyframes bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      ```
- **Files**: `screens_voyage.jsx`, `index.html`
- **Priority**: L
- **Effort**: ⚡⚡⚡

---
---
## 📱 **3. Responsiveness & Mobile Support Tasks**

---
### **3.1 Fix Map Aspect Ratio**
- **What**: Ensure the map scales properly to fill the screen without empty space.
- **Why**: On mobile, the map appears as a thin rectangle with black bars above/below due to mismatched aspect ratios.
- **How**:
  - **Option 1: Use `aspectRatio` (Modern Browsers)**
    ```jsx
    <div style={{
      border: `1px solid ${T.border}`,
      borderRadius: 4,
      overflow: "hidden",
      flex: 1,
      aspectRatio: "760 / 460", // Enforce map aspect ratio
      minHeight: 0,
      width: "100%",
    }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block", background: T.bgDeep }}>
        ...
      </svg>
    </div>
    ```
  - **Option 2: Padding Hack (Fallback for Older Browsers)**
    ```jsx
    <div style={{
      border: `1px solid ${T.border}`,
      borderRadius: 4,
      overflow: "hidden",
      flex: 1,
      position: "relative",
      width: "100%",
    }}>
      <div style={{
        paddingTop: `${(460 / 760) * 100}%`, // 60.526%
        position: "relative",
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
          background: T.bgDeep,
        }}>
          ...
        </svg>
      </div>
    </div>
    ```
- **Files**: `screens_voyage.jsx`
- **Priority**: **H**
- **Effort**: ⚡

---
### **3.2 Increase Touch Targets**
- **What**: Ensure all interactive elements (ports, buttons) have a minimum touch target size of **48x48px**.
- **Why**: Small touch targets are hard to tap on mobile (recommended: **48x48px**).
- **How**:
  - **For Ports in `MapScreen`**:
    Add invisible hit areas around port circles:
    ```jsx
    <g
      key={key}
      onClick={() => !isCur && reachable && dispatch({ type: A.SAIL_TO, port: key })}
      onMouseEnter={() => setHov(key)}
      onMouseLeave={() => setHov(null)}
      style={{ cursor: isCur ? "default" : (reachable ? "pointer" : "default") }}
    >
      {/* Invisible touch target */}
      <rect
        x={p.x - 24}
        y={p.y - 24}
        width={48}
        height={48}
        fill="transparent"
        onClick={() => !isCur && reachable && dispatch({ type: A.SAIL_TO, port: key })}
      />
      {/* Existing port visuals */}
      {(isCur || isHov) && <circle cx={p.x} cy={p.y} r={22} fill={isCur ? T.gold : fColor} opacity="0.10" />}
      ...
    </g>
    ```
  - **For Buttons**:
    Ensure `<Btn>` has a `minHeight: 48` and `minWidth: 48` on mobile:
    ```jsx
    // In ui.jsx:
    const Btn = ({ children, onClick, disabled, v = "default", sm = false, style = {} }) => {
      const variants = { ... };
      return (
        <button onClick={onClick} disabled={disabled} style={{
          ...variants[v],
          padding: sm ? "8px 12px" : "12px 16px", // Larger padding
          minHeight: 48, // Minimum touch height
          minWidth: sm ? 48 : 120, // Minimum touch width
          ...style,
        }}>
          {children}
        </button>
      );
    };
    ```
- **Files**: `screens_voyage.jsx`, `ui.jsx`
- **Priority**: **H**
- **Effort**: ⚡

---
### **3.3 Responsive Font Sizes**
- **What**: Ensure text is readable on mobile (minimum **12px** for body, **16px** for interactive elements).
- **Why**: Current font sizes (e.g., `8px` for port names) are unreadable on mobile.
- **How**:
  - Replace fixed `fontSize` values with `clamp()` or responsive units:
    ```jsx
    // In MapScreen:
    <text x={p.x} y={p.y + 18} textAnchor="middle" fontSize="clamp(10px, 2vw, 12px)" fill={...}>
      {p.name.toUpperCase()}
    </text>
    ```
  - Update `T` in `ui.jsx` to use responsive font sizes:
    ```js
    fontSize: 'clamp(12px, 1.5vw, 14px)',
    narrativeFontSize: 'clamp(12px, 1.5vw, 13px)',
    captionFontSize: 'clamp(10px, 1.2vw, 11px)',
    ```
- **Files**: `screens_*.jsx`, `ui.jsx`
- **Priority**: **H**
- **Effort**: ⚡

---
### **3.4 Fix Overlapping UI on Mobile**
- **What**: Prevent UI elements (e.g., faction legend, tutorial popup) from overlapping on small screens.
- **Why**: On mobile, elements like the faction legend and tutorial popup can overlap with the map.
- **How**:
  - **Faction Legend**:
    Stack vertically on mobile:
    ```jsx
    <div style={{
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
      alignItems: "center",
      flexDirection: window.innerWidth < 600 ? "column" : "row",
      alignItems: window.innerWidth < 600 ? "flex-start" : "center",
    }}>
      {Object.entries(FACTIONS).map(([k, f]) => (
        <div key={k} style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.color }} />
          <span style={{ color: T.textDim, fontSize: 11 }}>{f.label}</span>
        </div>
      ))}
    </div>
    ```
  - **Tutorial Popup**:
    Adjust positioning and width for mobile:
    ```jsx
    <TutorialPopup
      style={{
        maxWidth: window.innerWidth < 600 ? "90vw" : "460px",
        margin: window.innerWidth < 600 ? "0 5vw" : "0 auto",
      }}
      ...
    />
    ```
- **Files**: `screens_voyage.jsx`
- **Priority**: **M**
- **Effort**: ⚡

---
### **3.5 Fix SailingScreen Layout on Mobile**
- **What**: Ensure the map and sidebar stack vertically on mobile.
- **Why**: The current layout forces the map and sidebar to sit side-by-side, squishing the sidebar on small screens.
- **How**:
  - Update the container to stack on mobile:
    ```jsx
    <div style={{
      padding: 14,
      display: "flex",
      gap: 12,
      flex: 1,
      overflow: "hidden",
      flexDirection: window.innerWidth < 600 ? "column" : "row",
    }}>
      {/* Map container */}
      <div style={{
        flex: window.innerWidth < 600 ? "1" : "2 1 400px",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${T.border}`,
        borderRadius: 4,
        overflow: "hidden",
        minHeight: window.innerWidth < 600 ? 300 : 400,
      }}>
        ...
      </div>
      {/* Sidebar */}
      <div style={{
        flex: window.innerWidth < 600 ? "1" : "1 1 240px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minWidth: window.innerWidth < 600 ? "100%" : 220,
        overflowY: "auto",
      }}>
        ...
      </div>
    </div>
    ```
- **Files**: `screens_voyage.jsx`
- **Priority**: **H**
- **Effort**: ⚡⚡

---
### **3.6 Scale Up Ship SVG on Mobile**
- **What**: Increase the size of the ship SVG in `SailingScreen` on mobile.
- **Why**: The ship icon is too small to see on mobile screens.
- **How**:
  - Scale the ship SVG on mobile:
    ```jsx
    <g transform={`translate(${shipX},${shipY}) rotate(${hdgDeg})`} style={{
      transformOrigin: "center",
      transform: window.innerWidth < 600 ? `translate(${shipX},${shipY}) rotate(${hdgDeg}) scale(1.5)` : `translate(${shipX},${shipY}) rotate(${hdgDeg})`,
    }}>
      ...
    </g>
    ```
- **Files**: `screens_voyage.jsx`
- **Priority**: **M**
- **Effort**: ⚡

---
### **3.7 Fix BattleScreen Action Buttons on Mobile**
- **What**: Ensure action buttons (Broadside, Precision, etc.) are large enough and stack vertically on mobile.
- **Why**: Buttons may be too small or misaligned on narrow screens.
- **How**:
  - Force a single column layout on mobile and increase button padding:
    ```jsx
    <div style={{
      display: "grid",
      gridTemplateColumns: window.innerWidth < 600 ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 12,
    }}>
      {[{ a: "broadside", label: "🔥 Broadside", desc: "Full cannon volley. Reliable damage." }, ...].map(({ a, label, desc }) => (
        <div
          key={a}
          onClick={() => dispatch({ type: A.BATTLE_ACTION, action: a })}
          style={{
            ...panelStyle({
              background: T.panelAlt,
              cursor: "pointer",
              transition: "border-color 0.15s",
              padding: window.innerWidth < 600 ? 16 : 12,
            }),
          }}
        >
          ...
        </div>
      ))}
    </div>
    ```
- **Files**: `screens_voyage.jsx`
- **Priority**: **M**
- **Effort**: ⚡

---
### **3.8 Fix MarketScreen Layout on Mobile**
- **What**: Ensure the goods grid stacks vertically on mobile.
- **Why**: The current layout may overflow horizontally on small screens.
- **How**:
  - Stack goods vertically on mobile:
    ```jsx
    <div style={{
      display: "grid",
      gridTemplateColumns: window.innerWidth < 600 ? "1fr" : "repeat(auto-fill, minmax(200px, 1fr))",
      gap: 12,
    }}>
      {goods.map(good => (
        <div key={good.id} style={panelStyle()}>
          <div style={{ fontSize: window.innerWidth < 600 ? 14 : 12 }}>{good.name}</div>
          ...
        </div>
      ))}
    </div>
    ```
- **Files**: `screens_market.jsx`
- **Priority**: **M**
- **Effort**: ⚡⚡

---
### **3.9 Replace `window.innerWidth` with Responsive Solutions**
- **What**: Replace hardcoded `window.innerWidth` checks with CSS media queries or a `useWindowSize` hook.
- **Why**: `window.innerWidth` checks are not reactive—layouts won’t update on device rotation or window resize.
- **How**:
  - **Option 1: CSS Media Queries**
    Replace inline checks with CSS classes:
    ```jsx
    // Before:
    <div style={{ flexDirection: window.innerWidth < 600 ? "column" : "row" }}>

    // After:
    <div className="responsive-row" />
    ```
    Add to `index.html`:
    ```html
    <style>
      .responsive-row {
        flex-direction: row;
      }
      @media (max-width: 600px) {
        .responsive-row {
          flex-direction: column;
        }
      }
    </style>
    ```
  - **Option 2: `useWindowSize` Hook**
    Create a custom hook to track window size reactively:
    ```jsx
    // hooks/useWindowSize.js
    import { useState, useEffect } from 'react';

    export const useWindowSize = () => {
      const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
      });

      useEffect(() => {
        const handleResize = () => {
          setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
          });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, []);

      return windowSize;
    };
    ```
    Use it in components:
    ```jsx
    const { width } = useWindowSize();
    <div style={{ flexDirection: width < 600 ? "column" : "row" }}>
      ...
    </div>
    ```
- **Files**: All `screens_*.jsx`, `index.html`, `hooks/useWindowSize.js` (new)
- **Priority**: **H**
- **Effort**: ⚡⚡

---
### **3.10 Add Viewport Meta Tag**
- **What**: Add a viewport meta tag to `index.html` to prevent zooming issues on mobile.
- **Why**: Without this, mobile browsers may render the game at desktop scale, requiring manual zooming.
- **How**:
  Add this to the `<head>` in `index.html`:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />




Files: index.html
Priority: H
Effort: ⚡

3.11 Improve Touch Scrolling

What: Ensure scrollable panels (e.g., logs, cargo lists) scroll smoothly on mobile.
Why: Touch scrolling may be janky or unresponsive on iOS/Android.
How:
Add WebkitOverflowScrolling: "touch" to scrollable panels:
jsx
Copy

<div style={{
  ...panelStyle(),
  overflowY: "auto",
  WebkitOverflowScrolling: "touch", // iOS smooth scrolling
  maxHeight: 200,
}}>
  ...
</div>




Files: screens_*.jsx, ui.jsx
Priority: M
Effort: ⚡

3.12 Style Input/Select Elements for Mobile

What: Ensure <input> and <select> elements are mobile-friendly.
Why: Default browser styles for inputs/selects are not optimized for touch.
How:
Style inputs/selects with larger touch targets:
jsx
Copy

<select style={{
  padding: "12px",
  fontSize: "16px",
  background: T.panel,
  color: T.text,
  border: `1px solid ${T.border}`,
  borderRadius: 2,
  width: "100%",
}}>
  ...
</select>




Files: Any screens with forms/inputs
Priority: L
Effort: ⚡

🗺️ 4. Screen-Specific Tasks

4.1 MapScreen (screens_voyage.jsx)


  
    
      Task
      Why
      How
      Priority
      Effort
    
  
  
    
      Add region flavour text
      Enhances world-building.
      Display descriptions when hovering over regions (e.g., "The Windward Passage").
      M
      ⚡⚡
    
    
      Animate wind direction arrow
      Makes the map feel dynamic.
      Add a slow rotation animation to the wind indicator.
      L
      ⚡⚡
    
    
      Use nautical symbols for ports
      Improves clarity and theme.
      Replace ⚓ with a custom SVG anchor icon.
      M
      ⚡
    
    
      Add port descriptions on hover
      Provides context for ports.
      Show PORTS[portKey].description in a tooltip.
      M
      ⚡
    
  




4.2 SailingScreen (screens_voyage.jsx)


  
    
      Task
      Why
      How
      Priority
      Effort
    
  
  
    
      Add visual provisions
      Makes inventory more tangible.
      Replace text with barrel icons (🍷 for rum, 🥩 for food).
      M
      ⚡
    
    
      Show crew morale emoji
      Adds emotional depth.
      Display 😊/😐/😠 next to the log based on morale.
      L
      ⚡
    
    
      Animate ship bobbing
      Enhances immersion.
      Add a subtle vertical animation to the ship SVG.
      L
      ⚡⚡
    
  




4.3 BattleScreen (screens_voyage.jsx)


  
    
      Task
      Why
      How
      Priority
      Effort
    
  
  
    
      Add flavour text for actions
      Clarifies actions thematically.
      Replace "Broadside" with "Loose a Broadside!" and add descriptions.
      M
      ⚡
    
    
      Show hull damage visually
      Makes combat more engaging.
      Add cracks or scorch marks to the ship SVG as hull decreases.
      L
      ⚡⚡⚡
    
    
      Animate cannon fire
      Adds excitement.
      Add a "shake" effect to the screen when firing.
      L
      ⚡⚡⚡
    
  




4.4 PlunderScreen (screens_voyage.jsx)


  
    
      Task
      Why
      How
      Priority
      Effort
    
  
  
    
      Add icons for goods
      Improves readability.
      Replace text with SVG icons (e.g., 💎 for jewels, 🍷 for rum).
      M
      ⚡
    
    
      Show total plunder value
      Helps players assess loot.
      Display Total: ${goldReward} gold at the top.
      M
      ⚡
    
  




4.5 MarketScreen (screens_market.jsx)


  
    
      Task
      Why
      How
      Priority
      Effort
    
  
  
    
      Highlight illegal goods
      Warns players of risks.
      Add a ⚠️ emoji or red border to illegal goods.
      M
      ⚡
    
    
      Add haggling flavour text
      Enhances immersion.
      Show random messages like "The merchant eyes your gold hungrily..."
      L
      ⚡⚡
    
  




4.6 CrewScreen (screens_crew.jsx)


  
    
      Task
      Why
      How
      Priority
      Effort
    
  
  
    
      Use nautical terms for roles
      Fits the theme.
      Replace "Crew" with "Hands", "First Mate", "Powder Monkey".
      M
      ⚡
    
    
      Add crew portraits/silhouettes
      Personalizes crew members.
      Add simple SVG silhouettes for each crew member.
      L
      ⚡⚡
    
  




4.7 ShipyardScreen (screens_shipyard.jsx)


  
    
      Task
      Why
      How
      Priority
      Effort
    
  
  
    
      Add flavour text for upgrades
      Explains upgrades thematically.
      Replace "Hull +10" with "Reinforced Hull – Survive the fiercest storms!"
      M
      ⚡
    
    
      Show before/after visuals
      Helps players visualize upgrades.
      Add small SVG previews of ship upgrades.
      L
      ⚡⚡⚡
    
  




🚀 5. Implementation Roadmap

Phase 1: Critical Fixes (1-3 days)
Goal: Address the most pressing UI/UX and mobile issues.

 1.5 Color Token Audit (H, ⚡)
 1.1 Standardize Panel Styling (H, ⚡⚡)
 1.2 Unify Button Styling (H, ⚡⚡)
 3.1 Fix Map Aspect Ratio (H, ⚡)
 3.2 Increase Touch Targets (H, ⚡)
 3.3 Responsive Font Sizes (H, ⚡)
 3.10 Add Viewport Meta Tag (H, ⚡)
 3.9 Replace window.innerWidth with Responsive Solutions (H, ⚡⚡)

Phase 2: Narrative & Layout Improvements (3-5 days)
Goal: Enhance immersion and fix layout issues.

 2.1 Rename UI Labels for Immersion (H, ⚡)
 2.2 Add Flavour Text to Screens (H, ⚡)
 3.4 Fix Overlapping UI on Mobile (M, ⚡)
 3.5 Fix SailingScreen Layout on Mobile (H, ⚡⚡)
 3.7 Fix BattleScreen Action Buttons on Mobile (M, ⚡)
 3.8 Fix MarketScreen Layout on Mobile (M, ⚡⚡)
 1.3 Typographic Scale (H, ⚡)
 1.4 Spacing System (H, ⚡)

Phase 3: Polish & Atmosphere (5-7 days)
Goal: Add visual polish and narrative depth.

 2.3 Add Tooltips for Buttons (M, ⚡⚡)
 2.4 Enhance Port Descriptions (M, ⚡)
 2.5 Improve Event Descriptions (M, ⚡⚡)
 2.6 Thematic Reputation Labels (M, ⚡)
 2.7 Add Icons for Goods/Factions/Events (M, ⚡⚡)
 3.6 Scale Up Ship SVG on Mobile (M, ⚡)
 3.11 Improve Touch Scrolling (M, ⚡)
 4.1-4.7 Screen-Specific Tasks (M/L, ⚡-⚡⚡⚡)

Phase 4: Low-Priority Enhancements (Ongoing)
Goal: Fine-tune and optimize.

 1.6 Standardize Back Navigation (M, ⚡)
 1.7 Centralize Tutorial Popups (M, ⚡⚡)
 1.8 Standardize Empty States (M, ⚡)
 1.9 Add Loading States (L, ⚡)
 2.8 Visual Atmosphere: Parchment/Ocean Textures (L, ⚡⚡)
 2.9 Animate Wind/Waves/Ship Movement (L, ⚡⚡⚡)
 3.12 Style Input/Select Elements for Mobile (L, ⚡)

✅ 6. Testing Checklist

Desktop Testing


  
    
      Task
      Browser
      Notes
    
  
  
    
      All panels use consistent styling
      Chrome/Firefox
      Check colors, borders, padding.
    
    
      Buttons are uniformly styled
      Safari
      Verify hover/focus states.
    
    
      Typography is consistent
      Edge
      Check font sizes/weights.
    
    
      Spacing is uniform
      All
      No inconsistent gaps.
    
  




Mobile Testing


  
    
      Task
      Device
      Notes
    
  
  
    
      Map displays without empty space
      iPhone SE
      No black bars above/below.
    
    
      Ports are tappable
      Android (320px)
      Touch targets ≥ 48x48px.
    
    
      Text is readable
      iPad
      Fonts ≥ 12px.
    
    
      Layouts stack vertically
      iPhone 12
      No horizontal overflow.
    
    
      Buttons are large enough
      Galaxy S20
      Minimum 44x44px.
    
    
      Scrolling works smoothly
      iOS Safari
      No janky scrolling.
    
    
      Rotation handles gracefully
      All devices
      Layout updates on rotation.
    
    
      Viewport scales correctly
      All devices
      No manual zooming required.
    
  




Narrative Testing


  
    
      Task
      Screen
      Notes
    
  
  
    
      Labels use nautical terms
      All screens
      No generic terms like "Advance Day".
    
    
      Flavour text is immersive
      All screens
      Text fits the pirate theme.
    
    
      Tooltips are helpful
      All interactive
      Tooltips explain actions clearly.
    
    
      Port descriptions are vivid
      MapScreen
      Descriptions enhance world-building.
    
  




📝 7. Notes for Implementation


Testing:

Test on real devices (iOS/Android) and browser dev tools (Chrome/Firefox mobile emulation).
Use React DevTools to inspect component hierarchies and styles.


Collaboration:

Use GitHub issues to track progress on each task.
Label issues with ui, narrative, mobile, or polish.


Assets:

Create a /assets folder for textures (e.g., parchment.png).
Add SVG icons to ui.jsx or a new /icons folder.


Performance:

Avoid excessive animations on mobile (use prefers-reduced-motion media query).
Use CSS transforms for animations (better performance than JS).


Fallbacks:

Use feature detection (e.g., aspectRatio polyfill for older browsers).
Provide fallbacks for unsupported CSS properties (e.g., flexbox for grid).

