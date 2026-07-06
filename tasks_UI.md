# Broadside — UI De-vibecodification Task List

All tasks reference the agreed design direction from the session.
Organised from foundation (border system) outward to individual screens.

---

## A — Hand-Drawn Border System

The core technical work. Everything else in this document depends on having
this component available. Two levels of character, one migration strategy.

---

### A1 · Global SVG defs + filter preview (zero screen file changes, instant result)

**Purpose**: Let you see the rough-border aesthetic immediately, changing only `ui.jsx`,
before the proper component is built. This is the preview step, not the final solution.

**How it works**: Add a hidden SVG element to the DOM once (inside ui.jsx's IIFE, using
`ReactDOM.createPortal` or just injecting it on load). It registers named SVG filters
using `feTurbulence + feDisplacementMap`. Then add `filter: "url(#rough-l2)"` to the
`panelStyle` return object and `filter: "url(#rough-pill)"` to `Pill`'s style.
The filter is applied to the whole element including text — text becomes slightly organic.
At low displacement (scale 2–3) this is acceptable for preview and sometimes desirable.

**Add to ui.jsx, inject once on module load:**
```js
// Add near the top of the IIFE, before exports
const injectGlobalSvgDefs = () => {
  if (document.getElementById('broadside-svg-defs')) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "broadside-svg-defs";
  svg.setAttribute("style", "position:fixed;width:0;height:0;overflow:hidden;pointer-events:none");
  svg.innerHTML = `
    <defs>
      <!-- Level 2: subtle wobble for most panels and pills -->
      <filter id="rough-l2" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="8" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5"
          xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <!-- Level 2 pill: higher frequency for smaller elements -->
      <filter id="rough-pill" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="14" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8"
          xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <!-- Level 3: heavier wobble for large feature panels -->
      <filter id="rough-l3" x="-3%" y="-3%" width="106%" height="106%">
        <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="4" seed="22" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4"
          xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);
};
injectGlobalSvgDefs();
```

**Then in `panelStyle`**, add to the returned object:
```js
filter: "url(#rough-l2)",
```

**And in `Pill`**, add to its style:
```js
filter: "url(#rough-pill)",
```

**Limitation**: The filter applies to text inside the panel too. At scale 2.5 this reads
as organic rather than broken. Acceptable for preview. The proper fix is A2–A4 below,
where the rough SVG is rendered as an overlay that doesn't touch the content.

**Tuning knobs**:
- `baseFrequency`: lower = slower waves (larger bumps), higher = tighter noise (smaller bumps).
  0.025–0.04 is the sweet spot for panel-scale elements.
- `scale` on `feDisplacementMap`: how many pixels the displacement moves. 2–3 for Level 2,
  4–6 for Level 3.
- `seed`: change this number for a different noise character. Each seed produces a
  completely different pattern. Try several before committing.

**This step takes ~30 minutes and gives you the full aesthetic to evaluate.**

---

### A2 · Build the `Panel` component — Level 2 (proper implementation, border only)

**Purpose**: The production-quality approach. The rough path is drawn as an absolutely-
positioned SVG overlay on the panel. The panel content is a normal div underneath —
no filter applied to text. Each `Panel` instance gets unique jitter generated once on
mount and kept stable across re-renders. ResizeObserver keeps the path fitted to the
panel's actual size.

**Where it lives**: `ui.jsx`, exported as `window.UI.Panel`.

**Full component**:
```jsx
const Panel = ({
  children,
  color,           // border color — defaults to T.border
  variant,         // "default" | "danger" | "gold" | "subtle" — same as panelStyle
  padding,         // inner padding in px, default 12
  style = {},      // additional styles on the container
  className = "",
}) => {
  const { useState, useRef, useLayoutEffect } = React;

  // Resolve border color from variant, same logic as panelStyle
  const borderColor = color || {
    danger: T.redBr, gold: T.gold, subtle: T.borderFaint,
  }[variant] || T.border;

  // Jitter values: generated once on mount, stable forever.
  // 20 values: 4 corners × 2 coords + 12 midpoint offsets
  const jitter = useRef(null);
  if (!jitter.current) {
    jitter.current = Array.from({ length: 20 }, () => (Math.random() - 0.5) * 5);
  }
  const j = (i) => jitter.current[i];

  const [dims, setDims] = useState({ w: 0, h: 0 });
  const containerRef = useRef(null);
  const rafRef = useRef(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const { width, height } = entries[0].contentRect;
        setDims({ w: Math.round(width), h: Math.round(height) });
      });
    });
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(rafRef.current); };
  }, []);

  // Level 2 path: each side has one midpoint with a slight deviation.
  // 4 corners + 4 midpoints = 8 key points, drawn as a closed path.
  const { w, h } = dims;
  const pad = 5; // SVG overflow room on each side

  const path = w > 0 && h > 0 ? (() => {
    // Corner offsets (subtle)
    const tl = { x: j(0) * 0.6, y: j(1) * 0.6 };
    const tr = { x: w + j(2) * 0.6, y: j(3) * 0.6 };
    const br = { x: w + j(4) * 0.6, y: h + j(5) * 0.6 };
    const bl = { x: j(6) * 0.6, y: h + j(7) * 0.6 };

    // Side midpoints: deviate slightly from the straight line
    const mt = { x: w / 2 + j(8) * 1.5,  y: j(9) * 1.5 };       // top mid
    const mr = { x: w + j(10) * 1.5,      y: h / 2 + j(11) * 1.5 }; // right mid
    const mb = { x: w / 2 + j(12) * 1.5,  y: h + j(13) * 1.5 };  // bottom mid
    const ml = { x: j(14) * 1.5,          y: h / 2 + j(15) * 1.5 }; // left mid

    return [
      `M ${tl.x} ${tl.y}`,
      `L ${mt.x} ${mt.y}`,
      `L ${tr.x} ${tr.y}`,
      `L ${mr.x} ${mr.y}`,
      `L ${br.x} ${br.y}`,
      `L ${mb.x} ${mb.y}`,
      `L ${bl.x} ${bl.y}`,
      `L ${ml.x} ${ml.y}`,
      `Z`
    ].join(' ');
  })() : '';

  const svgW = w + pad * 2;
  const svgH = h + pad * 2;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        background: T.panel,
        padding: padding ?? T.spacing.md,
        color: T.text,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {/* Rough border SVG — absolutely positioned, non-interactive */}
      {path && (
        <svg
          style={{
            position: "absolute",
            top: -pad, left: -pad,
            width: svgW, height: svgH,
            overflow: "visible",
            pointerEvents: "none",
            zIndex: 0,
          }}
          viewBox={`0 0 ${svgW} ${svgH}`}
        >
          <g transform={`translate(${pad}, ${pad})`}>
            <path d={path} fill="none" stroke={borderColor}
              strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      )}
      {/* Content — rendered above the SVG, no filter */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};
```

**Export**: add `Panel` to the `Object.assign(window.UI, { ... })` at the bottom of ui.jsx.

**Zero-flash strategy**: the component renders its children immediately. The SVG path
appears on the first `ResizeObserver` callback (one frame after mount). This means there
is one frame with no border, then the border appears. To avoid this for panels that have
a known structure, you can pass `initialDims={{ w: 300, h: 120 }}` as a hint — the
component uses it before the observer fires, then corrects after measurement.

---

### A3 · Build the `PanelLarge` component — Level 3 (two-stroke pass)

**Purpose**: Used for the biggest visual elements — map container, journal, mission board,
market and plunder side panels. Two-stroke means two overlapping paths, each with their
own jitter, drawn at slightly different offsets and opacities. At normal reading distance
this reads as a confident hand-drawn line. Up close it shows obvious character.

**Differences from Level 2**:
- Two independent path generations from two separate jitter arrays
- Each side has **two** midpoints instead of one — the side is a gentle S-curve, not a
  single deviation
- Stroke 1: full opacity, strokeWidth 1.5, the "primary" line
- Stroke 2: 45% opacity, strokeWidth 1.0, offset by `(1.5px, 1px)` — the "shadow" pass
  that creates the double-ink feel
- Corner offsets are larger (±4px instead of ±3px)
- Midpoint deviations are larger (±5px instead of ±2.5px)

**Path generation for Level 3** (replace the path calculation inside Panel above):
```js
// Each side: two intermediate points instead of one,
// creating a gentle S-curve on every edge.
// jitter1 and jitter2 are both useRef arrays, generated once.

const buildL3Path = (w, h, jit) => {
  const j = (i, scale = 1) => jit[i] * scale;
  const tl = { x: j(0, 2),    y: j(1, 2) };
  const tr = { x: w + j(2,2), y: j(3, 2) };
  const br = { x: w + j(4,2), y: h + j(5, 2) };
  const bl = { x: j(6, 2),    y: h + j(7, 2) };

  // Each side: 2 control points at 33% and 66% of length
  const top1  = { x: w * 0.33 + j(8, 4),  y: j(9, 3) };
  const top2  = { x: w * 0.66 + j(10, 3), y: j(11, 4) };
  const right1= { x: w + j(12, 3),         y: h * 0.33 + j(13, 4) };
  const right2= { x: w + j(14, 4),         y: h * 0.66 + j(15, 3) };
  const bot1  = { x: w * 0.66 + j(16, 3), y: h + j(17, 4) };
  const bot2  = { x: w * 0.33 + j(18, 4), y: h + j(19, 3) };
  const left1 = { x: j(20, 3),             y: h * 0.66 + j(21, 4) };
  const left2 = { x: j(22, 4),             y: h * 0.33 + j(23, 3) };

  return [
    `M ${tl.x} ${tl.y}`,
    `L ${top1.x} ${top1.y}`,
    `L ${top2.x} ${top2.y}`,
    `L ${tr.x} ${tr.y}`,
    `L ${right1.x} ${right1.y}`,
    `L ${right2.x} ${right2.y}`,
    `L ${br.x} ${br.y}`,
    `L ${bot1.x} ${bot1.y}`,
    `L ${bot2.x} ${bot2.y}`,
    `L ${bl.x} ${bl.y}`,
    `L ${left1.x} ${left1.y}`,
    `L ${left2.x} ${left2.y}`,
    `Z`
  ].join(' ');
};

// In the SVG render, two <path> elements:
<path d={path1} fill="none" stroke={borderColor}
  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="1" />
<path d={path2} fill="none" stroke={borderColor}
  strokeWidth="1.0" strokeLinecap="round" strokeLinejoin="round" opacity="0.45"
  transform="translate(1.5, 1)" />
```

Where `path1` uses `jitter1.current` and `path2` uses `jitter2.current` (a second,
independently initialised `useRef` array). The transform on path2 nudges it slightly
down-right, as if the pen passed twice.

**Export**: add `PanelLarge` to `window.UI` alongside `Panel`.

**Props identical to `Panel`** except:
- Default `padding` is `T.spacing.lg` (16) instead of `T.spacing.md` (12)
- Default background is `T.bgDeep` instead of `T.panel` — large panels should feel deeper

---

### A4 · Build the `RoughPill` component (replaces `Pill` for all existing uses)

**Purpose**: Pills are small, inline, text-only. The approach here is different from
Panel/PanelLarge because the pill sizes to its text content, not the other way around.
We can't pre-measure. Solution: render the pill text normally, then draw the SVG path
on top using the same ResizeObserver strategy as Panel, but with a tighter jitter range
appropriate for small elements (±2px max).

**Key differences from Panel**:
- Jitter range: ±1.5px only (pills are small — any more and the border clips outside)
- No midpoints on sides — just the 4 corners with slight offsets
- strokeWidth 1.0 (not 1.2 — pills are detail elements, not structural)
- `display: inline-flex` so the pill wraps its text naturally
- No background fill change — keep `T.panelAlt` as-is

**Modify the existing `Pill` component** in ui.jsx to be a RoughPill. Since Pill is
already a React component (not a style object), this change propagates everywhere
automatically with zero screen file changes:

```jsx
const Pill = ({ label, color = T.textDim, style = {} }) => {
  const { useState, useRef, useLayoutEffect } = React;
  const jitter = useRef(null);
  if (!jitter.current) {
    jitter.current = Array.from({ length: 8 }, () => (Math.random() - 0.5) * 3);
  }
  const j = (i) => jitter.current[i];
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const ref = useRef(null);
  const rafRef = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const { width, height } = entries[0].contentRect;
        setDims({ w: Math.round(width), h: Math.round(height) });
      });
    });
    obs.observe(el);
    return () => { obs.disconnect(); cancelAnimationFrame(rafRef.current); };
  }, []);

  const { w, h } = dims;
  const pad = 4;
  const path = w > 0 && h > 0 ? [
    `M ${j(0)} ${j(1)}`,
    `L ${w + j(2)} ${j(3)}`,
    `L ${w + j(4)} ${h + j(5)}`,
    `L ${j(6)} ${h + j(7)}`,
    `Z`
  ].join(' ') : '';

  return (
    <div ref={ref} style={{
      position: "relative",
      display: "inline-block",
      background: T.panelAlt,
      color: color,
      padding: "3px 7px",
      fontSize: T.metadataFontSize,
      margin: "2px",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      ...style,
    }}>
      {path && (
        <svg style={{
          position: "absolute",
          top: -pad, left: -pad,
          width: w + pad * 2, height: h + pad * 2,
          overflow: "visible", pointerEvents: "none",
        }}>
          <g transform={`translate(${pad}, ${pad})`}>
            <path d={path} fill="none" stroke={color}
              strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      )}
      <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
    </div>
  );
};
```

`FactionPill` and `RepPill` both wrap `Pill` — they update automatically.

---

### A5 · Migration plan: screen files from `panelStyle` to `Panel`

**The fast path** (after A1 preview confirms the aesthetic is right):

`panelStyle` returns a plain style object and cannot render JSX. Changing it breaks nothing
immediately, but to get the rough border on content panels, screen files must switch from
`<div style={panelStyle(opts)}>` to `<Panel variant={opts.variant}>`.

**Step-by-step**:

1. Keep `panelStyle` in place — it's still used by `TransferLayout`, `NarrativePanel`,
   and `TutorialPopup` internally (fix those in ui.jsx as part of this task).

2. In `ui.jsx`, update `TransferLayout` to use `<Panel>` instead of
   `<div style={panelStyle(...)}>`. Same for `NarrativePanel`.

3. For screen files: find all `<div style={panelStyle(` usages and replace with `<Panel`.
   The closing `</div>` becomes `</Panel>`. This is a mechanical grep-and-replace.
   Estimated scope: ~30–40 instances across 8 screen files.

4. For `PanelLarge`, apply to the following specific containers:
   - Map container in `screens_voyage.jsx`
   - Journal outer panel in `screens_port.jsx`
   - Mission board outer panel in `screens_port.jsx`
   - Left and right panels in `TransferLayout` (market + plunder)
   - Port silhouette + gossip panel in `screens_port.jsx`
   - Battle screen ship panels in `screens_combat.jsx`

5. Panels that should **stay as `Panel` (Level 2)**, not `PanelLarge`:
   - Mission cards
   - Crew member cards
   - Equipment cards in shipyard grid
   - Status screen career section
   - HUD cells (these need their own small variant — see B1)
   - Sailing screen info blocks (provisions, log)

---

## B — Typography & Hierarchy

### B1 · HUD: Gold as dominant, Food/Water as warning system

**Current problem**: All 10 HUD cells have identical visual weight. Gold and Water look
the same.

**Changes, all in `App.jsx` HUD component**:

- Gold value: `fontSize: 20, fontWeight: "bold", color: T.gold`. The label "GOLD" can
  be smaller and dimmer. The gold cell should be slightly wider than others.
- Day/Date cell: normal size, `color: T.textDim` for the label and date — it's a clock,
  not a decision input.
- Food and Water: render normally at all times. When below a threshold
  (Food < crew×3 days, Water < crew×1 day), switch the value to `color: T.redBr` and
  add a `⚠` prefix. When at 0, apply `flash-red` class continuously (pulsing).
  This makes the warning system self-explanatory without adding new UI elements.
- Morale: show a small colored dot (●) next to the value in the appropriate color tier
  instead of just the number. The number stays but the dot gives instant scannable signal.
- Hull bar: already working well — leave as-is.

### B2 · Section titles should sit outside their panels, not inside them

**Current problem**: titles like "CAPTAIN'S LOG", "CAREER", "MISSION BOARD", "WORD ON
THE DOCKS" sit inside a bordered panel, competing with the border for your eye.

**Direction**: render the title **above** the panel as a flush label. The panel itself
starts below the title. This is the standard manuscript/chart-room convention.

```jsx
// Before:
<div style={panelStyle()}>
  <SectionTitle>MISSION BOARD</SectionTitle>
  {content}
</div>

// After:
<div>
  <SectionTitle>MISSION BOARD</SectionTitle>   {/* outside, above */}
  <Panel>{content}</Panel>
</div>
```

`SectionTitle` currently has `borderBottom: 1px solid T.borderFaint` and `marginBottom: 10`.
When used outside a panel, remove the borderBottom — the gap between the title and the
panel edge is the separator. Add a small `marginBottom: 6` between title and panel.

Apply to: Mission Board, Captain's Log, Port gossip "Word on the Docks", Career section,
World's View, Provisions (sailing screen), Journal header.

### B3 · Size jumps — increase contrast between label and value

Currently label and value are often 10px and 14px. That's not enough jump.
Target: labels at 10px (`T.captionFontSize`), values at 16–18px for primary stats,
14px for secondary. This applies especially to:
- StatBlock component: increase `value` font size to 16px (currently heading3 = 14px)
- Ship stats in the Shipyard compare panel: the `30 → 60 ↑` values should be 16px
- Gold reward on mission cards: make it visually prominent (18px, T.gold color)
- Port name on the Port screen: this is the headline of the screen — should be 22–24px,
  not the current 18px heading1

---

## C — Mission Cards

### C1 · Mission title in faction color

**Change in `screens_port.jsx`** mission card render:
```jsx
// Before:
<div style={{ fontWeight: "bold", fontSize: 14 }}>{mission.name}</div>

// After:
<div style={{
  fontWeight: "bold",
  fontSize: 14,
  color: FACTIONS[mission.faction]?.color ?? T.text,
}}>
  {mission.name}
</div>
```

The faction color on the title is the primary identity signal.

### C2 · Risk as uppercase text, not a second pill

Replace the risk `Pill` on mission cards with a plain text label:
```jsx
// Before:
<Pill label={mission.risk} color={T.riskColor[mission.risk]} />

// After:
<span style={{
  fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
  color: T.riskColor[mission.risk],
}}>
  {mission.risk}
</span>
```

Keep the faction `Pill` for now (it's the element that gets the RoughPill treatment).
Or: replace that too with colored text matching C1 — the faction name in faction color,
no pill at all. Decide after seeing C1 in place.

### C3 · Mission card border in faction color

When `Panel` is applied to mission cards (via A5 migration), pass the faction color
as the border color:
```jsx
<Panel color={FACTIONS[mission.faction]?.color ?? T.border} style={{ marginBottom: 8 }}>
  ...
</Panel>
```

The panel shape is unique per card instance (A2), the border color is faction-keyed.
Two visual signals working together without a stripe or a badge.

---

## D — Port Screen

### D1 · ACTIONS section: from button grid to navigation row

**Current problem**: 6 identical ghost buttons in two rows look like a settings page.

**Direction**: One horizontal row of text-link-style buttons with icons, separated by
a subtle divider between the primary group (World Map, Market, Shipyard) and the secondary
group (Status, Journal, Crew). Menu stays as-is since it's a different action type.

```jsx
// Action button: no border, just text + icon, underline on hover
// Primary: normal brightness. Secondary: slightly dimmer.
<button style={{
  background: "none", border: "none",
  color: isPrimary ? T.text : T.textDim,
  fontSize: 13, fontFamily: T.font,
  padding: "8px 10px", cursor: "pointer",
  display: "flex", alignItems: "center", gap: 6,
  minHeight: T.btnMinHeight,
  borderBottom: "1px solid transparent",  // reserve space, hover shows it
}}>
  <IconWorld size={14} /> World Map
</button>
```

On hover: `borderBottom: '1px solid T.goldDim'`.

This keeps touch targets (minHeight 44px) while removing the box-per-button look.
The Menu button stays as a `Btn v="ghost"` since it's a different action category.

### D2 · Port gossip: remove the card box, use a ruled left accent

**Current**: "WORD ON THE DOCKS" section is inside a bordered NarrativePanel card.

**Direction**: No box. The title sits above, then each gossip line is separated by
a very faint horizontal rule, all on the raw background. The section gets visual
identity from the title's gold color and the italic text, not a border.

If a container is still needed for structure, use an absolutely-positioned 2px vertical
line on the left (`position: absolute, left: 0, top: 0, bottom: 0, width: 2px,
background: T.goldDim`) on the section wrapper. This is not a "stripe panel" — it's a
paragraph accent mark, a standard editorial device. The box is gone; the accent marks
the section type without containing it.

---

## E — Status Screen: Faction Relationships as Prose

### E1 · Replace the 5 faction cards with flowing text sentences

**Current**: A CSS grid of 5 identical bordered boxes, each with a faction name,
reputation bar, reputation label, and perks line. Looks like a SaaS pricing table.

**Direction**: One paragraph per faction, using `T.textDim` for body text with the
faction name colored inline. No boxes, no bars. Separated by a single `<Divider />`
between factions. The section title "THE WORLD'S VIEW" sits above the whole block.

**Sentence templates** — these live in `data_text.js` as
`D.FACTION_RELATIONSHIP_TEMPLATES`, keyed by a composite of rep tier and heat tier:

```js
// Composite key: `${repTier}_${heatTier}` where
// repTier: "war" | "hostile" | "neutral" | "friendly" | "allied"
// heatTier: "clean" | "watched" | "hunted"
const FACTION_RELATIONSHIP_TEMPLATES = {
  allied_clean:   (f, p) => `The ${f} regard you as one of their own. Your name opens doors in every ${f} port.`,
  allied_watched: (f, p) => `The ${f} call you a friend in public. In private, they have questions they haven't asked yet.`,
  allied_hunted:  (f, p) => `You have powerful friends among the ${f}. Their patrols are still looking for you. It won't stay comfortable.`,
  friendly_clean: (f, p) => `The ${f} know your reputation and approve. You're welcome in their waters.`,
  friendly_watched:(f,p) => `The ${f} respect what you've built, but your recent actions have caught attention. A watchful peace.`,
  friendly_hunted:(f, p) => `The ${f} would rather not admit how much trouble you've caused them. Don't test it.`,
  neutral_clean:  (f, p) => `The ${f} consider you a known quantity. You've given them neither reason to celebrate nor to worry.`,
  neutral_watched:(f, p) => `The ${f} have your description. You're not welcome, but you're not yet hunted.`,
  neutral_hunted: (f, p) => `The ${f} are actively looking for you. A dangerous neutrality.`,
  hostile_clean:  (f, p) => `The ${f} have long memories. Your name is on their lists. Keep your distance.`,
  hostile_watched:(f, p) => `The ${f} want you gone. Their patrols don't need much excuse.`,
  hostile_hunted: (f, p) => `Every ${f} captain has your description. You will not be welcomed at any of their ports.`,
  war_clean:      (f, p) => `You are at war with the ${f}. There is no welcome for you in their waters.`,
  war_watched:    (f, p) => `You are at war with the ${f} and they are watching. You will not see a ${f} ship before it fires.`,
  war_hunted:     (f, p) => `The ${f} have declared you an enemy. Bounties, warships, and hostility at every port. There is no path to peace that doesn't cost blood.`,
};
```

**Special case — player's own faction** adds a sentence prefix:
`"Your people, the ${f}."` before the template, and a different neutral tone
(`"You have built a respectable name. There is more to do."` instead of the external
neutral).

**Render in `StatusScreen`**:
```jsx
{Object.entries(FACTIONS).map(([key, faction]) => {
  const rep = state.reputation[currentPort] ?? 50; // or average across faction ports
  const heat = state.factionAlerts[key] ?? 0;
  const repTier = L.reputationLabel(rep).toLowerCase(); // "neutral", etc.
  const heatTier = heat >= 7 ? "hunted" : heat >= 3 ? "watched" : "clean";
  const templateKey = `${repTier}_${heatTier}`;
  const sentence = D.FACTION_RELATIONSHIP_TEMPLATES[templateKey]?.(faction.label, rep)
    ?? `The ${faction.label} regard you with ${repTier} standing.`;
  const isOwnFaction = key === state.faction;

  return (
    <div key={key} style={{ marginBottom: 16 }}>
      <span style={{ color: faction.color, fontWeight: "bold", fontSize: 14 }}>
        {faction.label}
      </span>
      {isOwnFaction && (
        <span style={{ color: T.textFaint, fontSize: 10, marginLeft: 8 }}>
          your allegiance
        </span>
      )}
      <p style={{ color: T.textDim, fontSize: 12, lineHeight: 1.6,
                  margin: "4px 0 0 0", fontStyle: "italic" }}>
        {sentence}
      </p>
      <Divider style={{ marginTop: 12 }} />
    </div>
  );
})}
```

---

## F — Battle Screen

### F1 · Combat action buttons: angular, weighted, decisive

**Current**: 4 identical ghost-card tiles in a row, same visual weight.

**Direction**: Two rows of two on narrow, a single row on wide. Each button:
- `borderRadius: 0` (angular)
- Larger icon (20px, not 14px)
- Gradient fill that makes the button feel physically weighted:
  `background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)"`
  over the existing variant background
- On hover: `boxShadow: "0 0 12px rgba(201,170,110,0.25)"` (warm glow, not blue)
- Label in `T.gold`, sub-label in `T.textDim`
- `minHeight: 56px` (taller than standard buttons to feel like a physical control)

The Grapple button should have a slightly different treatment when the player has
boarding-favorable conditions (crew advantage): `borderColor: T.greenBr` instead of
`T.border`, indicating opportunity.

### F2 · Fix ship name double-space in battle screen

In `screens_combat.jsx`, the ship name "Cartographer's  Folly" has two spaces between
words. This is a JSX rendering artifact — likely two adjacent text nodes or two `<span>`
elements with no separator character between them. Locate the ship name render and
ensure the full name is rendered as a single string, not split across spans.

---

## G — Sailing Screen Info Panel

### G1 · Destination and day count: from sidebar to chart notation

**Current**: The right panel ("En route to Petit-Goâve / 4 days remaining / Advance Day")
looks like a project management sidebar.

**Direction**: Render the destination name as a large-print heading in `T.gold`
(`fontSize: 22px, fontWeight: bold`), like a destination written on a chart. The day
count as a standalone prominent numeral (`fontSize: 32px, color: T.text`) with the word
"days" subscript below it in `T.textDim`. The Advance Day and Enter Port buttons sit
below, separated by whitespace rather than more panels.

The provisions sub-section can become two inline stats (Food: X · Water: Y) with the
warning coloring from B1, rather than a full bordered card.

---

## H — Shipyard

### H1 · Locked ships visually distinct from available ones

**Current**: All 9 ship cards have identical visual treatment regardless of availability.
Locked ships have a small lock icon as an afterthought.

**Direction**:
- Available ships: normal `Panel` (L2 border), `T.text` color, full opacity
- Affordable available: `Panel` with `color={T.gold}` border (faction color treatment)
- Not enough gold: `Panel` with `T.border` + a gold amount needed line in `T.gold`
- Locked by fame: `opacity: 0.45`, `filter: "grayscale(0.6)"`, lock icon 18px centered,
  no hover effect, cursor `"not-allowed"`
- Current ship: `Panel` with `color={T.greenBr}` border + "CURRENT" pill inside

This gives 4 distinct visual states that are immediately readable at a glance.

---

## I — BackButton

### I1 · BackButton: less browser, more game

**Current**: A ghost `Btn` labeled "← Back to Port" on every sub-screen. Reads as
browser back button.

**Direction**: Remove the Btn wrapper. Make it a plain inline-style anchor-like element:
```jsx
const BackButton = ({ dispatch, screen = "port", label }) => {
  const destination = screen === "port" ? "Port" : screen;
  const displayLabel = label ?? `↩ ${destination}`;
  return (
    <button onClick={() => dispatch({ type: window.E.A.NAVIGATE, screen })}
      style={{
        background: "none", border: "none",
        color: T.textDim, fontSize: 11,
        letterSpacing: 1.5, textTransform: "uppercase",
        cursor: "pointer", fontFamily: T.font,
        padding: "4px 0", marginBottom: 10,
        alignSelf: "flex-start",
        minHeight: T.btnMinHeight,
        display: "flex", alignItems: "center",
      }}
      onMouseEnter={e => e.currentTarget.style.color = T.gold}
      onMouseLeave={e => e.currentTarget.style.color = T.textDim}
    >
      {displayLabel}
    </button>
  );
};
```

The hover color change (dim → gold) is the only affordance. No border, no background,
no box.

---

## J — Map Container

### J1 · Apply PanelLarge (Level 3) to the map container

The map is already the best-looking screen. The one thing that breaks its atmosphere
is the plain `1px solid T.border` rectangle containing it.

Replace the map div's `border: 1px solid T.border` with `<PanelLarge>` wrapping,
using `color={T.borderBr}` (slightly brighter than default for visual importance).
The rough border on the map container reinforces that the map is a physical chart,
not a UI element.

The map's own SVG coordinate system is unaffected — the `PanelLarge` just wraps the
outer container. `mapSize.width` and `mapSize.height` still control the SVG dimensions
(see MAP-03 in the audit task list for the ResizeObserver sizing fix that should land
at the same time).

---

## Implementation Order

| Order | Task | Scope | Why now |
|---|---|---|---|
| 1 | A1 — Filter preview | ui.jsx only | Confirms aesthetic in 30 min, zero risk |
| 2 | A4 — RoughPill | ui.jsx only | Immediate everywhere, no screen changes |
| 3 | A2 — Panel component | ui.jsx only | Required for everything below |
| 4 | A3 — PanelLarge | ui.jsx only | Required for J1, market, journal |
| 5 | B2 — Titles outside panels | ui.jsx + screen files | Visual impact, mechanical change |
| 6 | C1 + C2 — Mission card title/risk | screens_port.jsx | High visibility, low risk |
| 7 | A5 — Screen migration panelStyle → Panel | All screen files | Mechanical, grep-able |
| 8 | C3 — Mission card border colors | screens_port.jsx | After A5 lands |
| 9 | E1 — Faction prose (Status screen) | screens_port.jsx + data_text.js | Medium complexity |
| 10 | D1 — Actions section redesign | screens_port.jsx | Structural change |
| 11 | F1 — Battle buttons | screens_combat.jsx | Standalone |
| 12 | B1 — HUD gold dominance | App.jsx | Standalone |
| 13 | J1 — Map PanelLarge | screens_voyage.jsx | After A3 + MAP-03 fix |
| 14 | G1, H1, I1, D2, F2, B3 | Various | Polish, any order |
