# task_parchment.md

**Goal:** Replace the dark panel background with a parchment-style texture in *narrative panels only* (gossip, captain's log, journal entries, crew bios, mission flavor). All other UI panels keep the current dark theme.

**Status:** Plan approved, implementation pending
**Last updated:** 2026-06-22
**Estimated effort:** 3-5 hours

---

## Executive Summary

We want to add visual character to the narrative moments of the game — the places where the player reads story, gossip, and crew details — by giving those panels a parchment background. This signals "this is a period-appropriate diary or notice board" without changing the gameplay UI's modern functional feel.

**What we ARE doing:**
- Parchment background on narrative panels only
- New theme tokens for parchment text (dark sepia/brown)
- Updated `NarrativePanel` component to support the new visual variant
- A "parchment" variant becomes the default for narrative content

**What we are NOT doing:**
- Parchment on action panels (mission cards, market rows, shipyard tabs, status counters)
- Parchment on pills, buttons, or input fields (previous attempt failed, scope is acknowledged)
- Parchment on combat or HUD (functional, not narrative)
- Wholesale visual redesign
- Adding new fonts

---

## Scope: Where parchment goes vs doesn't

### Gets parchment background
| Element | Where it appears | Justification |
|---|---|---|
| `NarrativePanel` variant=gossip | Port screen "Word on the Docks" | Pure narrative content |
| `NarrativePanel` variant=crew | Crew screen biographies | Reading a person's story |
| `NarrativePanel` variant=discovery | Event resolutions, map fragments | Story moments |
| `NarrativePanel` variant=trade | Market flavor text | Atmospheric narrative |
| `NarrativePanel` variant=danger | Combat narrative, intercept text | Narrative tension |
| `LogList` entries (Captain's Log + Journal) | Port screen + Journal screen | Reading a diary |
| Mission descriptions (in mission cards) | Mission board | Maybe — see open question |
| Bio text in crew detail view | Crew detail panel | Reading a biography |

### Does NOT get parchment
| Element | Justification |
|---|---|
| Top HUD bar | Functional, not narrative |
| Action buttons | Functional, must remain dark/punchy |
| Pills (faction, risk, rep) | Already tried, didn't work |
| Status screen counters | Stat data, not narrative |
| Market goods rows (buy/sell controls) | Functional table |
| Shipyard ship/equipment cards | Comparison UI |
| BattleScreen action panels | Combat functional UI |
| Ship sprite backgrounds | Already styled with sea gradient |

---

## Technical Approach

### Background asset
A single SVG or PNG parchment texture file, dropped into the project root or a new `assets/` folder. The asset is applied via CSS `background-image` on parchment-variant panels.

**Why SVG if possible:** scales cleanly to any panel size, smaller file size (typically 15-40KB), inline-able if needed.

**Why PNG fallback:** if a good SVG isn't available, a JPG/PNG (50-150KB) at 1200x800 with `background-size: cover` is acceptable.

### Text color
On a warm parchment background, the existing cream/gold text is invisible. We need a new family of text tokens for parchment context:

| Existing token | Parchment equivalent |
|---|---|
| `T.text` (cream) | `T.parchmentText` (~#3a2810 dark sepia) |
| `T.textDim` | `T.parchmentTextDim` (~#5a4530 medium sepia) |
| `T.textFaint` | `T.parchmentTextFaint` (~#7a6850 muted sepia) |
| `T.gold` (gold accent) | `T.parchmentAccent` (~#8a3a10 dark amber, "ink") |

These get added to the theme tokens. Consumer components opt in via prop or variant.

### Fallback
If the background image fails to load, the panel falls back to a solid warm cream color (`#e8dcc4` or similar). The text remains readable. Visual is degraded but not broken.

---

## Asset Acquisition

Pick ONE source. Don't agonize.

### Option A — Public domain SVG/PNG
- **publicdomainvectors.org** — CC0 license, search "parchment", "old paper", "worn paper"
- **freesvg.org** — CC0 / public domain, same
- **openclipart.org** — public domain
- **unsplash.com** — high-quality photos, "parchment" or "old paper", free license (no attribution required for use but appreciated)

### Option B — Generate via CSS
A pure CSS approach with gradients and noise filters can approximate parchment without an asset. More work, less photorealistic, but no external file needed. Example:
```css
background:
  radial-gradient(ellipse at top, #e8dcc4 0%, #d4c4a0 70%, #b8a888 100%),
  url("data:image/svg+xml,...noise...");
```

### Option C — One paid asset
Adobe Stock, Shutterstock, etc. ~$10 for a clean asset. Only consider if A and B fail.

**Recommendation:** Start with Option A. If you can't find one that fits the warm sepia tone of your game in 15 minutes, move to Option B.

---

## Implementation Phases

### Phase 1 — Asset prep (30-60 min)

- [ ] Download or generate one parchment background
- [ ] Verify it's CC0 / public domain / appropriately licensed
- [ ] Optional: simplify/recolor to match warm sepia tones in Inkscape (or use as-is if already warm)
- [ ] Save as `assets/parchment.svg` or `assets/parchment.jpg`
- [ ] Verify it tiles cleanly (no obvious seams) OR is large enough that tiling isn't needed
- [ ] Verify it looks acceptable at the smallest panel size (~200px wide on mobile)

**Exit criteria:** asset exists in project, license documented in `assets/README.md` or similar.

### Phase 2 — Theme tokens (15 min)

In `ui.jsx`, add to the theme:
```js
parchmentText:      "#3a2810",
parchmentTextDim:   "#5a4530",
parchmentTextFaint: "#7a6850",
parchmentAccent:    "#8a3a10",
parchmentBg:        "#e8dcc4",  // fallback solid color
parchmentBgImage:   "url('assets/parchment.svg')",
```

Add a helper for the parchment panel style:
```js
const parchmentPanelStyle = (overrides = {}) => ({
  background: `${T.parchmentBg} ${T.parchmentBgImage}`,
  backgroundSize: "cover",
  border: `1px solid ${T.parchmentAccent}40`,  // subtle amber border
  borderRadius: 3,
  padding: T.spacing.md,
  color: T.parchmentText,
  ...overrides,
});
```

**Exit criteria:** tokens exist, helper exists, neither is used yet (no behavior change).

### Phase 3 — Update `NarrativePanel` component (1-1.5 hours)

The component currently accepts a `variant` prop (`gossip`, `crew`, `discovery`, etc.) that maps to a color theme. We extend it to use parchment as the default for narrative panels.

**Approach:**
- Add a new prop `surface="parchment" | "dark"` (default `"parchment"`)
- When `surface="parchment"`, render with parchment background + sepia text
- When `surface="dark"`, render with existing dark style (for any panel that explicitly wants the old look)
- Sub-elements (`NarrativeLine`, title, icons) inherit from the surface

**Files affected:**
- `ui.jsx` — `NarrativePanel`, `NarrativeLine` definitions

**Exit criteria:** `NarrativePanel` renders parchment by default. Visual review against current implementation. Tests/tests_integration.html passes.

### Phase 4 — Audit consumers (1-2 hours)

Walk every place `NarrativePanel` or `LogList` is used. Verify:
- Parchment renders correctly
- Text is legible at all reasonable sizes
- Icons (if any) remain visible (may need a darker variant)
- Nested elements (pills, links inside narrative) look correct
- Mobile narrow views still look acceptable

**Consumer audit checklist:**

| Location | Element | Verified? |
|---|---|---|
| `screens_port.jsx` — PortScreen | "Word on the Docks" gossip panel | [ ] |
| `screens_port.jsx` — PortScreen | Captain's Log (LogList) | [ ] |
| `screens_port.jsx` — JournalScreen | Journal entries (LogList) | [ ] |
| `screens_crew.jsx` — CrewScreen | Crew bio narrative panel | [ ] |
| `screens_market.jsx` — MarketScreen | Market flavor text | [ ] |
| `screens_combat.jsx` — EventScreen | Event narrative panel | [ ] |
| `screens_combat.jsx` — InterceptScreen | Encounter flavor text | [ ] |
| `screens_voyage.jsx` — SailingScreen | Voyage log (if uses LogList) | [ ] |

**Per-consumer changes:** mostly none. The component does the work. Each consumer might need a small style tweak if a nested pill or icon clashes.

**Exit criteria:** every consumer verified visually. No regressions.

---

## Mission Description Question (Open)

Mission cards on the mission board currently have a dark background with the mission description as part of the card. Two possibilities:

**A.** Mission cards stay fully dark. The "narrative" of a mission is part of action UI (you're going to do this thing), not pure narrative.

**B.** Mission cards get a parchment background for the description text only (the body), while pills, buttons, and metadata stay on a dark surround.

Recommendation: **A** for now. Mission cards are functional. Revisit only if playtesters say mission descriptions feel disconnected from the rest of the narrative.

---

## Quality Checks

After Phase 4, verify:

1. **Contrast:** Read all parchment text at normal monitor brightness. Nothing should require squinting.
2. **Visual cohesion:** The parchment panels feel like part of the same game as the dark UI. They should look intentional, not like a separate skin.
3. **Mobile:** At 360px viewport, parchment panels still render well and text is still readable.
4. **Performance:** Loading the parchment asset doesn't noticeably slow the page load. Single small file should not be a problem.
5. **No accidental breakage:** Other parts of the UI (pills, buttons, status data) are unchanged.

---

## Rollback Strategy

Each phase ends in a stable state:

- **After Phase 1:** asset exists, unused. Revert = delete asset.
- **After Phase 2:** tokens exist, unused. Revert = remove token additions.
- **After Phase 3:** parchment variant active. If it looks wrong, change the `surface` default in `NarrativePanel` from `"parchment"` to `"dark"` — one-line revert, all consumers go back to old look.
- **After Phase 4:** Per-consumer issues caught. Revert specific consumers individually by passing `surface="dark"` on the affected `NarrativePanel`.

If the whole thing feels wrong post-implementation, the rollback path is: set default `surface="dark"` and the parchment becomes an opt-in feature for a few specific places only. Or remove entirely.

---

## Open Questions (Deferred)

- **Should LogList entries each get their own subtle "torn paper" treatment?** Defer — adds complexity for marginal gain.
- **Should mission cards' descriptions get parchment?** See "Mission Description Question" above. Defer to playtest.
- **Should the journal screen itself have a parchment background, not just entries?** Possibility worth considering after Phase 4 if entries-on-parchment-on-dark feels weird.
- **Should we add an aged border / torn edge effect to parchment panels?** Defer — pure visual polish, not blocking.

---

## Files Touched (Summary)

| File | Change |
|---|---|
| `assets/parchment.svg` (or .jpg) | NEW — the texture asset |
| `ui.jsx` | Theme tokens + parchmentPanelStyle helper + updated NarrativePanel + updated NarrativeLine + LogList styling for parchment |
| All `screens_*.jsx` consuming NarrativePanel or LogList | Mostly no change. Verified visually. |

---

## After completion

When you're done, update the roadmap entry for B3.2 to reflect this work. Note that "Consistent spacing, typography, and panel styling" was partly addressed via the parchment surface system — narrative panels now have a deliberate visual identity distinct from action panels.

The parchment work is also a partial answer to your "looks too SaaS-y" concern. The dark functional UI now has a textured narrative counterpart, which is the period-appropriate game-feel you're after.
