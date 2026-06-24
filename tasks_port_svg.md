
***

# tasks\_port\_svg.md

**Goal:** Integrate the 5 port silhouette SVGs into the port screen so each faction's ports display their corresponding atmospheric backdrop above the port description.

**Status:** Plan approved, implementation pending
**Last updated:** 2026-06-24
**Estimated effort:** 2-3 hours total

***

## Executive Summary

We have 5 hand-tuned SVG silhouettes (English, Spanish, French, Dutch, Pirate) representing each faction's port type. They get saved as standalone `.svg` files at the project root (like `map.svg`), then loaded as image assets in a new `PortSilhouette` React component that selects the right one based on the current port's faction.

**What we ARE doing:**

* Save 5 standalone SVG files in the project root
* Add one `PortSilhouette` React component to `ui.jsx`
* Insert the component into `PortScreen` between the header and the description text

**What we are NOT doing:**

* Inlining SVGs as JS strings (keeping them as files matches how `map.svg` works)
* Per-port overrides (factional silhouettes are enough for now)
* Day/night or weather variants (parked for later)
* Animation or interactivity (silhouettes are static atmospheric backdrops)

***

## Decisions Already Made

| Decision          | Choice                                                  | Rationale                                                                    |
| ----------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Asset format      | 5 separate `.svg` files                                 | Matches existing pattern (`map.svg`), simpler than JSON-stringified inlining |
| File location     | Project root (alongside `map.svg`)                      | Same loading semantics as the existing map                                   |
| Loading mechanism | `...` element                                           | Browser handles loading and caching, no JS work                              |
| Selection logic   | `state.currentPort` → faction → silhouette              | One silhouette per faction, multiple ports share it                          |
| Display position  | Between header (name/faction/pill) and description text | Sets the scene visually before reading the port description                  |
| Sizing            | 100% panel width, max-height \~280px on desktop         | Hero element without dominating the panel                                    |

***

## File Naming Convention

| Faction | File name          |
| ------- | ------------------ |
| English | `english_port.svg` |
| Spanish | `spanish_port.svg` |
| French  | `french_port.svg`  |
| Dutch   | `dutch_port.svg`   |
| Pirate  | `pirate_port.svg`  |

Naming matches the faction key in `D.PORTS[portKey].faction` exactly. This keeps the selection logic to a single string interpolation.

***

## Phase 1 — Asset Preparation

**Purpose:** Extract each silhouette from its preview HTML and save as a clean, standalone SVG file.

### Tasks

* [ ] Open `tools/port-preview.html` (the Pirate one, currently)
* [ ] Copy the `<svg viewBox="0 0 1200 400">...</svg>` block (excluding all HTML wrapping)
* [ ] Paste into a new file at project root: `pirate_port.svg`
* [ ] Verify the file starts with `<svg viewBox="0 0 1200 400" xmlns="http://www.w3.org/2000/svg">`
* [ ] Verify it ends with `</svg>` and contains no HTML wrappers, headers, or stylesheets
* [ ] Open the file in browser directly (`file:///.../pirate_port.svg` or via local server) — should display the silhouette correctly
* [ ] Repeat for each of the other 4 silhouettes (you have them in your previous `port-preview` files saved per iteration)
* [ ] Save with the naming convention from the table above

### Exit criteria

* 5 SVG files in project root
* Each file opens standalone in browser and displays the silhouette correctly
* No HTML, no `<head>`, no `<body>` — just `<svg>` to `</svg>`
* Each file is between \~10-20 KB

### Risk

* Low. Just file manipulation.
* Make sure to copy ONLY the `<svg>` block from your preview HTML files. The previews had `<!DOCTYPE html>`, `<style>`, `<header>`, etc. wrappers that must be removed.

***

## Phase 2 — `PortSilhouette` React Component

**Purpose:** Create the React wrapper that loads and displays the correct silhouette based on the current port's faction.

### Component code

Add this to `ui.jsx` near the other UI components (between `ShipSideSprite` and `BackButton`, for example):

```jsx
const PortSilhouette = ({ portKey }) => {
  const port = window.D.PORTS?.[portKey];
  const factionKey = port?.faction;
  
  if (!factionKey) return null;
  
  const src = `./port-${factionKey}.svg`;
  
  return (
    <div style={{
      width: "100%",
      maxHeight: 280,
      overflow: "hidden",
      borderRadius: 3,
      marginBottom: T.spacing.md,
      lineHeight: 0,
    }}>
      <img
        src={src}
        alt={`${port?.name || "Port"} silhouette`}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
        }}
        onError={(e) => {
          // Gracefully hide the image if the file is missing
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
};
```

### Tasks

* [ ] Add the component above to `ui.jsx` (inside the IIFE, near the other components)
* [ ] Add `PortSilhouette` to the `Object.assign(window.UI, { ... })` exports at the bottom of the file
* [ ] Verify the change doesn't break the integration tests page (it shouldn't)
* [ ] In browser console, verify `typeof window.UI.PortSilhouette === 'function'`

### Exit criteria

* Component defined and exported
* No console errors on page load
* Integration tests still pass

### Design notes

* `lineHeight: 0` on the wrapper prevents accidental whitespace below the image from inline rendering
* `display: "block"` on the img prevents the same whitespace issue
* `onError` gracefully hides the image element if the SVG file is missing — fail safe, no broken-image icon
* `marginBottom: T.spacing.md` separates the silhouette visually from the description text below

### Risk

* **Image loading flicker:** On first port visit, there may be a brief moment where the panel renders without the silhouette. SVGs are small (\~10-20 KB), so this should be imperceptible after the first load (browser cache). Acceptable.
* **Cross-origin issues:** If served from `file://`, some browsers block image loading. Same constraint as the existing game (already requires HTTP server). Not a new issue.

***

## Phase 3 — `PortScreen` Integration

**Purpose:** Insert the `PortSilhouette` component into the port screen's atmosphere panel.

### Locate the insertion point

In `screens_port.jsx`, find the `PortScreen` function. Look for the atmosphere panel (the one containing the port name header, faction label, reputation pill, description, and gossip):

```jsx
<div style={panelStyle()}>
  <div style={{ display: "flex", justifyContent: "space-between", ... }}>
    <div>
      <div style={{ color: T.gold, ... }}>{port.name}</div>
      <div style={{ color: FACTIONS[port.faction]?.color, ... }}>
        {FACTIONS[port.faction]?.label.toUpperCase()} PORT
      </div>
    </div>
    <RepPill rep={rep} />
  </div>

  <p style={{ color: T.textDim, ... }}>
    {port.desc}
  </p>
  ...
</div>
```

### Insertion

Insert `<PortSilhouette portKey={state.currentPort} />` **between** the header `<div>` (containing the port name, faction label, and reputation pill) and the description `<p>` element:

```jsx
<div style={panelStyle()}>
  <div style={{ display: "flex", justifyContent: "space-between", ... }}>
    <div>
      <div style={{ color: T.gold, ... }}>{port.name}</div>
      <div style={{ color: FACTIONS[port.faction]?.color, ... }}>
        {FACTIONS[port.faction]?.label.toUpperCase()} PORT
      </div>
    </div>
    <RepPill rep={rep} />
  </div>

  {/* NEW: Port silhouette */}
  <PortSilhouette portKey={state.currentPort} />

  <p style={{ color: T.textDim, ... }}>
    {port.desc}
  </p>
  ...
</div>
```

Add `PortSilhouette` to the destructuring at the top of the file where other UI components are imported:

```jsx
const { ..., PortSilhouette } = window.UI;
```

### Tasks

* [ ] Locate the atmosphere panel in `PortScreen`
* [ ] Add `PortSilhouette` to the UI component destructuring at the top of the file
* [ ] Insert `<PortSilhouette portKey={state.currentPort} />` at the correct position
* [ ] Refresh and visit any port — silhouette should appear between the header and description

### Exit criteria

* Silhouette displays correctly at the right position
* No layout regression on the rest of the port screen
* All other elements (gossip, mission board, actions) still render as before

### Risk

* **Visual overflow:** If the silhouette is too tall on certain layouts, it may push content below into awkward positions. The `maxHeight: 280` cap and the responsive checks in Phase 4 should catch this.

***

## Phase 4 — Responsive Verification

**Purpose:** Make sure the silhouette scales and displays correctly across screen sizes.

### Tasks

* [ ] Open the game on a desktop browser at full width (\~1440px)
* [ ] Visit a port, verify silhouette renders well-proportioned (likely \~200-280px tall)
* [ ] Resize browser to mobile width (\~360px) using DevTools
* [ ] Verify silhouette scales down proportionally and doesn't break the layout
* [ ] Test at iPad-ish width (\~768px)
* [ ] Check that the silhouette doesn't push the gossip panel or mission board out of view

### Exit criteria

* Silhouette renders well at all tested widths
* No layout breaks
* Aspect ratio (3:1) preserved
* Text below remains readable

### Risk

* **Mobile detail loss:** At narrow widths, the small details (windows, individual buildings) become invisible. This is acceptable — the overall composition (sea, sky, land mass, town silhouette) still reads as "approaching a port." Confirm this is acceptable by viewing.

***

## Phase 5 — Cross-Port Verification

**Purpose:** Confirm each faction's silhouette displays at the correct ports.

### Tasks

* [ ] Visit an English port (e.g., Port Royal) — verify `english_port.svg` displays
* [ ] Visit a Spanish port (e.g., Havana) — verify `spanish_port.svg` displays
* [ ] Visit a French port (e.g., Petit-Goâve or Port-de-Paix) — verify `french_port.svg` displays
* [ ] Visit a Dutch port (e.g., Curaçao or Sint Eustatius) — verify `dutch_port.svg` displays
* [ ] Visit a pirate port (e.g., Tortuga or Nassau) — verify `pirate_port.svg` displays
* [ ] Try a port that hasn't been visited yet (debug-unlock if needed)
* [ ] Confirm the silhouette appears immediately on port arrival, not after a delay

### Exit criteria

* All 5 faction silhouettes display at their corresponding ports
* No 404 errors in browser console for missing SVG files
* Visual transition feels natural

### Risk

* **Mismatched faction key:** If a port has a faction value that doesn't match a silhouette file name, the `onError` handler hides the image silently. To catch this case, check browser console for 404 errors during testing.

***

## Files Affected

| File               | Change   | Notes                                       |
| ------------------ | -------- | ------------------------------------------- |
| `english_port.svg` | NEW      | Project root                                |
| `spanish_port.svg` | NEW      | Project root                                |
| `french_port.svg`  | NEW      | Project root                                |
| `dutch_port.svg`   | NEW      | Project root                                |
| `pirate_port.svg`  | NEW      | Project root                                |
| `ui.jsx`           | Modified | Add `PortSilhouette` component + export     |
| `screens_port.jsx` | Modified | Insert `<PortSilhouette />` in `PortScreen` |

***

## Rollback Strategy

If anything goes wrong or the silhouettes look bad in context:

**Full rollback:**

1. Remove the `<PortSilhouette />` line from `screens_port.jsx`
2. Optionally delete the `PortSilhouette` component from `ui.jsx`
3. SVG files can stay in place (they're not loaded if no component references them)

**Partial rollback (e.g., one silhouette looks bad):**

* Delete the offending SVG file
* The `onError` handler in the component will gracefully hide the image element
* Other ports continue to display their silhouettes normally

**No engine or state changes are involved** — this is pure presentation. Nothing to migrate, no save compatibility concerns.

***

## Risk Register

| Risk                                                           | Severity | Likelihood | Mitigation                                                                         |
| -------------------------------------------------------------- | -------- | ---------- | ---------------------------------------------------------------------------------- |
| SVG files don't load on local file://                          | Medium   | Low        | Game already requires HTTP server, same constraint as `map.svg`                    |
| Image loading flicker on first visit                           | Low      | Medium     | Browser cache handles subsequent visits; small file size means short initial load  |
| Mobile rendering loses detail                                  | Low      | High       | Acceptable — overall composition still reads at small sizes                        |
| Visual hierarchy off (silhouette dominates panel)              | Medium   | Low        | `maxHeight: 280` cap; can be tuned                                                 |
| Faction key mismatch (port faction doesn't match SVG filename) | Low      | Low        | `onError` handler gracefully hides; verify in cross-port testing                   |
| Future port-specific overrides need a different system         | Low      | Medium     | Could add `D.PORTS[k].silhouetteOverride` field later without disrupting this work |

***

## Parking Lot — Future Enhancements

These are NOT part of this work. Captured here for future reference.

* **Port-specific overrides** — e.g., Port Royal gets a unique silhouette distinct from generic English. Would add a `silhouetteOverride` field on `D.PORTS[k]` and a fallback chain in the component.
* **Day/night/weather variants** — multiple SVGs per faction, selected by time-of-day state. Probably overkill but possible.
* **Animated elements** — birds flying, smoke rising, waves moving. Would require switching from `<img>` to inline SVG. Cool but high effort.
* **Subtle fade-in on port entry** — CSS transition for a softer arrival feel. Easy add later if desired.
* **Higher resolution version** — current viewBox is 1200x400. If illustrators ever join the project, they could replace these silhouettes with more detailed versions while keeping the same component contract.
* **Smaller "thumbnail" version** — for the world map (showing each port's silhouette as a tooltip preview). Different aspect ratio, would need separate assets.

***

## Estimated Total Effort

| Phase                             | Estimated time    |
| --------------------------------- | ----------------- |
| Phase 1 — Asset preparation       | 30-45 min         |
| Phase 2 — Component creation      | 15 min            |
| Phase 3 — PortScreen integration  | 15 min            |
| Phase 4 — Responsive verification | 15-30 min         |
| Phase 5 — Cross-port verification | 15-30 min         |
| **Total**                         | **1.5-2.5 hours** |

Could realistically be done in a single focused session.

***

## Status Tracking

Update as phases complete.

| Phase   | Status      | Date | Notes |
| ------- | ----------- | ---- | ----- |
| Phase 1 | Not started | —    | —     |
| Phase 2 | Not started | —    | —     |
| Phase 3 | Not started | —    | —     |
| Phase 4 | Not started | —    | —     |
| Phase 5 | Not started | —    | —     |

***
