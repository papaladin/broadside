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

### **2.1 Rename UI Labels for Immersion** --> rejected
- **What**: Replace generic labels with nautical/pirate-themed terms.
### **2.2 Add Flavour Text to Screens** --> DONE (where relevant)
### **2.3 Add Tooltips for Buttons** --> DONE (mostly)
### **2.4 Enhance Port Descriptions**. --> already present in port screen, rejeccted for map screen.
### **2.5 Improve Event Descriptions** --> postpone for now, we already created varuations chosen randomly.
- **What**: Rewrite event descriptions to be more vivid and thematic.
### **2.6 Thematic Reputation Labels** --> rejected, kept for player familiarity.
- **What**: Replace generic reputation labels (e.g., "Friendly") with pirate-themed terms.
### **2.7 Add Icons for Goods/Factions/Events** --> in progress
- **What**: Replace emoji or text icons with custom SVG icons.
### **2.8 Visual Atmosphere: Parchment/Ocean Textures** --> parked / fil rouge
- **What**: Add subtle textures to panels for a pirate aesthetic.
### **2.9 Animate Wind/Waves/Ship Movement** --> parked
- **What**: Add subtle animations to the map and sailing screens.



---
## 📱 **3. Responsiveness & Mobile Support Tasks**

---
### **3.1 Fix Map Aspect Ratio** --> DONE
### **3.2 Increase Touch Targets** --> DONE

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
### **3.5 Fix SailingScreen Layout on Mobile** --> OK
### **3.6 Scale Up Ship SVG on Mobile**  --> parked, not relevant for now
- **What**: Increase the size of the ship SVG in `SailingScreen` on mobile.
### **3.7 Fix BattleScreen Action Buttons on Mobile** --> already OK
### **3.8 Fix MarketScreen Layout on Mobile** --> already OK


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
  ```


Files: index.html
Priority: H
Effort: ⚡

### 3.11 Improve Touch Scrolling

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

### 3.12 Style Input/Select Elements for Mobile

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

## 🗺️ 4. Screen-Specific Tasks

### 4.1 MapScreen (screens_voyage.jsx)


  
    
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
    
  




### 4.2 SailingScreen (screens_voyage.jsx)


  
    
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
    
  




### 4.3 BattleScreen (screens_voyage.jsx)


  
    
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
    
  




### 4.4 PlunderScreen (screens_voyage.jsx)


  
    
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
    
  
