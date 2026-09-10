# Onboarding Coverage Re-Audit (v2)
## Every mechanic cross-referenced against QM, hints, and Handbook, post-B10/B11/B12

---

## What's changed since the last audit

The previous audit was written before the following shipped. Each was either marked 🔜 or didn't exist, and now needs a real coverage check:

**B10 — Player & Port Identity**
- 5 player birth traits, one per faction (chosen at New Game, mechanical effect for the whole run)
- 5 port specialties: Dutch Bank, Spanish Inquisitor, French Embassy, English Naval Yard, Pirate Black Market
- Reputation is now faction-scoped, not port-scoped
- Mission rewards now scale with **faction** rep, shown as a `(Eng : +20%)` badge on mission cards

**B11 — Combat Rework**
- Distance bands (Far / Medium / Close) and the `DistanceIndicator` UI
- Close Distance / Open Distance movement actions
- Legal-action gating per distance (some actions only available at some ranges)
- Grapple now requires Close range and leads to boarding, no longer instant-win
- Boarding sub-phase with its own action set: Continue Fighting, Fall Back, Surrender, Demand Surrender
- Advantage bar (split green/red crew-×-morale ratio)
- Demand Surrender's 0.65 ratio threshold
- Fall Back's parting-shot crew cost
- Sunk vs. Captured distinction (no plunder on Sunk)
- Action previews on each combat button (hull range, crew range, hit chance)
- Miss-fail flash animation on player misses

**B12 — Sailing Enrichment**
- Port modal (click a port on the map to open a modal with full details, service specialty, goods & trade, trade tip, compare-with-current, mission target badge, Set Sail button)
- Port comparison ("Compare with current port" expandable section inside the modal)
- Trade tip ("Cloth is 18% cheaper here…") computed live between two ports
- Stable, learnable economy (fixed per-port prices with faction modifiers, no randomness on already-known goods)
- SVG illustrations on event and intercept screens
- Port silhouettes on the port screen
- Quick Repair and Top Up Provisions as one-click port actions
- Mission reward badge showing faction rep multiplier

**Older but previously unaudited:**
- Change Course mid-voyage
- Faction reputation display on Status screen (coloured faction blocks with prose)
- Autosave toggle
- Menu's "Game Menu" button on Port screen

---

## Structural notes (updated)

1. **Guided mode is QM-only.** `shouldShowTutorial` returns `false` when `tutorialMode === "full"`. Any mechanic taught exclusively via a per-screen popup is **invisible to guided-mode players**. This is the single most important constraint in this audit — it means the QM dialogue is the *only* teaching surface for players who chose the most hand-held option.

2. **Light mode is popup-only.** `tutorialMode === "light"` never shows QM dialogue. Light-mode players learn via popups + Handbook + self-discovery.

3. **Handbook is push-neutral.** Opened voluntarily from the Menu. Being "✅ Handbook" does not mean a player has seen it.

4. **The right surface depends on the mechanic.** Critical path + complex = QM. Situational + contextual = hint. Reference = Handbook. Most mechanics warrant more than one.

---

## Coverage matrix

**Legend:** ✅ Covered · ❌ Missing, should be · ➖ Not needed · 🆕 New since last audit · 🔜 Planned, not yet shipped

### Core Loop & Navigation

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Port screen — purpose & layout | ✅ | ✅ | ➖ | Keep |
| World Map — navigation | ✅ | ✅ | ➖ | Keep |
| Sailing — Advance Day / Enter Port | ✅ | ✅ | ➖ | Keep |
| **Change Course mid-voyage** | ❌ | ❌ | ❌ | **Add hint popup on Sailing screen** (contextual, only appears if a reroute is currently possible — right pattern). Low QM priority since it's a mid-game convenience, not critical path. |
| Status screen — purpose | ❌ QM never routes here | ✅ | ✅ | **Add QM routing step** — either insert `statusOpened` between crew and shipyard, or explicitly skip and accept that guided players may not visit Status during onboarding. The current status popup is invisible in guided mode. |
| Journal screen | ✅ | ✅ | ➖ | Keep |
| Menu / Game Menu button | ❌ | ❌ | ❌ | **Handbook entry only**. Self-explanatory on open. |
| Save / Load / Export / Import | ❌ | ❌ | ✅ Save & Load card | Keep as Handbook-only. |
| Autosave toggle | ❌ | ❌ | ❌ | **Fold into Save & Load Handbook card**. |
| Discovered vs hidden ports | ❌ | ❌ | ❌ | **Add Handbook section**. Currently only discoverable via gossip hints. |

### 🆕 Player Faction Identity (B10)

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Player faction trait exists | ✅ via New Game screen (labels + desc + beginner note for each faction) | N/A | ❌ | **Handbook: add card "Your Captain's Allegiance"** listing all five traits with exact mechanical numbers. Returning players forget exact values; they shouldn't have to start a new game to look them up. |
| English: crew loss reduction | ✅ New Game screen | N/A | ❌ | Handbook |
| Spanish: cheap crew, Spanish-port-only | ✅ New Game screen | N/A | ❌ | Handbook |
| French: less provisions + 1 max day | ✅ New Game screen | N/A | ❌ | Handbook |
| Dutch: better trade margins | ✅ New Game screen | N/A | ❌ | Handbook |
| Pirate: flee/contraband/bribe bonuses | ✅ New Game screen | N/A | ❌ | Handbook |
| **Universal wage upkeep tick** | ❌ | ❌ | ✅ Gold card mentions wages | **Add a QM line the first time wages fire** ("Your crew's wages come due — every day at sea costs gold"). It's a recurring cost every player feels regardless of faction. |

### 🆕 Port Identity & Faction Services (B10)

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Port specialty exists (BANK, INQUISITOR, etc.) | ❌ | ❌ | ✅ Faction Services card | Keep as Handbook + inline discovery (the port modal and PortCard both display the specialty with its description at the moment of decision, which is correct) |
| Dutch Bank — loans, interest, garnish | ❌ | ❌ | ✅ | Keep |
| Spanish Inquisitor — infamy reduction | ❌ | ❌ | ✅ | Keep |
| French Embassy — buy reputation | ❌ | ❌ | ✅ | Keep |
| English Naval Yard — early access / servicing | ❌ | ❌ | ✅ | Keep |
| Pirate Black Market — smuggling source | ❌ | ❌ | ✅ | Keep |
| Port reputation vs faction reputation distinction | ❌ | ❌ | ⚠ Partially (Reputation card framed per-port; recent change made it faction-scoped) | **Update Handbook Reputation card** to explain faction-scoped rep and how it averages. **Consider a Status-screen hint popup** explaining "standing with each faction" since the Status screen now shows a prose summary per faction. |
| Mission reward faction-rep multiplier | ❌ | ❌ | ❌ | **Add Handbook line** in Missions card. Also **update the reward-badge tooltip** if you have one (currently the `(Eng : +20%)` badge is self-explanatory on inspection, but a hover tooltip on the badge explaining "because your standing with England is Allied" would help first-timers). |

### Economy & Trade

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Buying/selling — basic | ✅ | ✅ | ✅ | Keep |
| **Free trade / natural trade routes** | ❌ guided-mode-invisible (only in market popup) | ✅ | ✅ | **Add QM line** in `step2_marketOpen` or a new post-tutorial step: "You can also buy low here and sell high elsewhere." QM's market step is currently framed purely as mission-errand. |
| **Good Deals / In Demand labels** | ❌ | ❌ | ✅ Resources & Trade card | Already documented. Consider adding a small tooltip on the label in the Market screen itself for contextual teaching. |
| **Trade tip in Port modal** | N/A — self-teaching at the moment of use | N/A | ❌ | **No teaching needed** — the tip is its own explanation. Worth one line in the Handbook's trade card: "When previewing a port on the map, the modal shows the best current trade between your port and theirs." |
| **Port comparison feature** | N/A — self-evident | N/A | ❌ | **No teaching needed**. |
| Price variance/availability | ➖ | ➖ | ✅ | Keep |
| Illegal goods / contraband risk | ➖ | ✅ | ✅ | Keep |
| Hold capacity & overload penalty | ➖ | ✅ (inline warning) | ✅ | Keep |
| Food/water consumption | ✅ | ❌ | ✅ | Keep |
| Starvation consequences | ❌ | ❌ | ✅ | **Add Handbook-linked hint** — no proactive teaching needed, but if you ever add a "provisions low" warning popup, it should mention the starvation thresholds. |
| Top Up Provisions quick action | ❌ | ❌ | ❌ | **Tooltip already explains the exact quantity** ("Buy N food and N water for 10 days"). No further teaching needed. |

### Crew

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Hiring crew | ✅ | ✅ | ✅ | Keep |
| Crew count affects combat | ➖ | ➖ | ✅ | Keep |
| Wages | ❌ | ❌ | ✅ | **Add QM line** (see Faction Identity table above — universal wage tick). |
| Morale — thresholds | ❌ | ❌ | ✅ | **Add Handbook crosslink from Crew hint** — the Crew popup mentions "keep morale up" but never the 50/30/0 thresholds. Handbook already documents them. Consider extending the Crew popup with one line: "Below 50 slows travel; below 30 raises wages; at 0 crew desert." |
| Crew traits (hidden/revealed) | ❌ | ✅ | ✅ | **Add to QM** — the crew screen has zero QM dialogue about traits. Even one line ("Some traits are hidden until the crew trusts you") would help. |
| Crew progression (Seasoned/Veteran/Loyal) | ❌ | ❌ | ✅ | Keep as Handbook-only. Emergent, not actionable. |
| Desertion | ❌ | ❌ | ✅ | **Add line to QM crew step** if you want — but arguably discoverable-by-play (the log tells you clearly when it happens). Low priority. |
| Minimum crew to sail | ✅ (contextual disabled-button reason) | N/A | ❌ | Keep the disabled-button pattern. |
| Crew alignment / upset on attacking home faction | ❌ | ❌ | ⚠ Only in "Crew" card's "Attacking a faction's ships reduces reputation with all its ports" | **Add Handbook section "Crew Loyalty"** — the alignment modifier is fully invisible to players right now. |
| Dismissing crew | ❌ | ❌ | ❌ | Tooltip on the button suffices. |

### Reputation, Fame, Infamy, Heat

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Fame — definition, gain | ❌ | ✅ | ✅ | **Add to QM at step5_delivered** — one line ("Completing missions builds your fame; that's how you unlock bigger ships"). Currently invisible to guided players. |
| Infamy — definition, thresholds | ❌ | ✅ | ✅ | **Add to QM step6b_victory** — after the tutorial hunt, one line about reputation earned from combat. |
| Faction reputation (per-faction, post-change) | ❌ | ✅ | ⚠ Partially | **Update Status hint + Handbook.** |
| Reputation decay toward neutral | ❌ | ❌ | ✅ | Keep. |
| **Faction Heat** | ❌ | ❌ | ✅ | **Add to QM** — heat is invisible in the HUD (only shows when > 0) and never explained. One QM line at step6b_victory ("Word of your deeds spreads — factions remember") is cheap. **Add HUD tooltip.** |
| Attacking one faction hurts allies | ❌ | ❌ | ✅ | Keep. |
| Reputation-gated perks | ❌ | ❌ | ✅ | **Add to QM at step5_delivered** — currently invisible to guided players. |
| Faction reputation display on Status | ❌ | ✅ | ➖ | Keep. |

### Missions

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Trade mission | ✅ | ➖ | ✅ | Keep |
| Combat mission | ✅ (via tutorial hunt) | ➖ | ✅ | Keep |
| Smuggle mission | ❌ | ❌ | ✅ | **Add to QM at step6_hired** — one line ("Pirate ports offer smuggling work, if you're willing"). Currently invisible until the player is at a pirate port and happens to open the board. |
| Patrol mission | ❌ | ❌ | ✅ | Keep as Handbook-only. |
| Escort mission | ❌ | ❌ | ✅ | Keep as Handbook-only. |
| Assault mission | ❌ | ❌ | ✅ | Keep as Handbook-only. |
| Abandoning a mission | ❌ | ❌ | ❌ | **Add Handbook line** (consequence: reputation penalty with commissioning faction). |
| Mission reward scaling by faction rep | ❌ | ❌ | ❌ | **Add Handbook line** (see Faction Identity table). |
| **Patrol "not guaranteed encounter" mechanic** | ❌ | ❌ | ✅ Handbook mentions | Keep. |
| Patrol "sail near target, advance days" instruction | ❌ | ❌ | ❌ | **Add to mission card** as persistent text (if not already there — the sub-panel now shows this per the current PortScreen code) — **already done in B12 changes, verify it's visible in all modes.** |

### Combat — Intercept Phase

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Intercept screen exists | ❌ | ❌ | ✅ | **Add hint popup on first Intercept screen.** This is a critical path screen during the tutorial hunt and has zero teaching surface. The player sees five options with no context. **Highest-priority gap.** |
| Fight | ✅ (implicit via hunt) | ❌ | ✅ | Keep (once the hint above lands) |
| Flee — success odds | ➖ | ➖ | ➖ | Keep |
| Parley | ❌ | ❌ | ✅ | Fold into the Intercept hint popup. |
| Bribe — requirements (rep > 30, infamy < 25, or pirate) | ❌ | ❌ | ⚠ Listed but not the requirements | **Add Handbook line + intercept hint line.** The bribe gate is complex and undiscoverable. |
| Surrender — costs | ❌ | ❌ | ✅ | Fold into the Intercept hint popup. |
| Allow Inspection (patrols) | ❌ | ❌ | ✅ | Fold into the Intercept hint popup (patrol-specific variant). |
| **Intercept flavour text / SVG** | N/A | N/A | N/A | Cosmetic — no teaching needed. |

### Combat — Naval Phase (B11)

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Distance bands exist | ❌ | ✅ (Battle popup mentions them) | ✅ | Keep popup. **Add QM line at step6b_huntAccepted** — the player will hit the Battle screen within a few turns; the QM should set expectations. |
| Broadside | ✅ (implicit) | ✅ | ✅ | Keep |
| Precision | ❌ | ✅ | ✅ | Keep popup. |
| Grapple requires Close | ❌ | ✅ | ✅ | Keep popup. |
| Evade requires Far | ❌ | ✅ | ✅ | Keep popup. |
| Close Distance / Open Distance actions | ❌ | ✅ | ✅ | Keep popup. |
| **Action previews (hull range, crew range, hit chance)** | N/A | N/A | N/A | Self-explanatory on the button. No teaching. |
| **Legal-action gating with disabled tooltips** | N/A | N/A | N/A | Self-explanatory — this is the correct contextual pattern. |
| **Sunk vs Captured distinction** | ❌ | ❌ | ✅ | **Add Hint popup on first victory** — or a one-line QM at step6b_victory. Player will see one or the other first. |
| **"You can't plunder a sunk ship"** | ❌ | ❌ | ✅ | **Add contextual hint on the Sunk outcome screen** — the correct pattern per the previous audit. |
| **Miss-fail flash animation** | N/A | N/A | N/A | Cosmetic feedback, no teaching. |

### Combat — Boarding Phase (B11)

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Boarding as distinct sub-phase | ❌ | ✅ (Battle popup has a boarding branch) | ✅ | Keep popup. **Add QM reference at step6b_huntAccepted** — the tutorial hunt doesn't grapple, so guided players never see this popup either. One line would help. |
| Continue Fighting / Fall Back / Surrender | ❌ | ✅ | ✅ | Keep popup. |
| Demand Surrender — 0.65 threshold | ➖ | N/A (disabled button + tooltip) | ✅ | Keep contextual pattern. |
| Advantage ratio bar | ➖ | ✅ | ✅ | Keep popup. |
| Fall Back's parting-shot cost | ❌ | ❌ | ✅ | **Add action preview on the Fall Back button** showing expected crew loss, matching the other buttons. |

### Plunder Screen

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Plunder screen purpose | ❌ | ❌ | ⚠ Implied | **Add hint popup** — first time plunder is available, explain that you're transferring cargo from the enemy's hold, and that illegal goods attract patrols. Highest-priority missing popup. |
| Keep searching vs leave now | 🔜 Not a mechanic yet | 🔜 | 🔜 | Defer. |
| Jettison from your own hold to make room | ❌ | ❌ | ❌ | **Add inline hint on the Plunder screen** — the "Jettison" button is unexplained. |

### Random Events & Patrol Enforcement

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Random events exist | ❌ | ❌ | ➖ | Keep discoverable. A popup would spoil the surprise. |
| Event screen purpose | ❌ | ❌ | ➖ | Same. |
| Event SVG illustrations | N/A | N/A | N/A | Cosmetic. |
| Patrol inspection catches goods | ➖ | ➖ | ✅ | Keep. |
| Random (non-mission) patrols can catch contraband | ❌ | ❌ | ⚠ Read as mission-specific | **Update Handbook patrol wording** to mention both mission and random patrols. |
| **Resist inspection (B12)** | ❌ | ❌ | ❌ | **Add Handbook line + Intercept hint line.** The `RESOLVE_INSPECTION` choice screen is a distinct screen with no teaching. |

### Ship & Equipment

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Repair | ✅ | ✅ | ✅ | Keep |
| Equipment slots per tier | ❌ | ❌ | ✅ | **Add to QM at step7_shipyardOpen** — QM mentions "Repairs, upgrades, or a new ship" but not the slot system. One line would help. |
| Removable vs structural equipment | ❌ | ❌ | ✅ | Keep |
| Buying a new ship clears equipment | ✅ (inline warning) | ✅ | ➖ | Keep |
| **Purchasing equipment from Shipyard needs Naval Yard access for install/remove** | ❌ | ❌ | ✅ | Keep |
| **English Naval Yard early-access thresholds** | ❌ | ❌ | ✅ | Keep |
| Hull vs max hull | ➖ | ➖ | ✅ | Keep |

### Onboarding & Meta

| Mechanic | QM | Hint | Handbook | Recommendation |
|---|---|---|---|---|
| Tutorial mode choice (full/light/none) | ✅ New Game screen explains each | N/A | N/A | Keep |
| **Quartermaster as crew member** | ✅ (implicit) | N/A | ❌ | Keep — the QM introduces itself. No Handbook entry needed. |
| **Skipping the QM** | ✅ ("I'll take it from here" button) | N/A | N/A | Keep |
| **Refusing to abandon tutorial** | ✅ (contextual refusal popup) | N/A | N/A | Keep |
| **Game Over screen** | ❌ | ❌ | ❌ | **Add Handbook line** in a new "Career" section — you can lose if hull 0 + no crew + no gold + no cargo to sell. It's a real state, and the QM never mentions it. |

---

## Priority buckets for implementation

**Bucket 1 — Critical path, guided-mode-invisible (do first):**

1. **Intercept screen hint popup.** Every new player sees this during the tutorial hunt with zero context. Add a `TutorialPopup` covering all five options, plus the patrol-specific "Allow Inspection" variant.
2. **Plunder screen hint popup.** Same problem — a distinct screen with distinct mechanics (jettison, illegal goods risk) that appears at a moment of high cognitive load.
3. **QM routing to Status screen.** Insert `statusOpened` step. Currently the Fame/Infamy/Reputation content of the Status screen is *assumed* to be seen by the Handbook, but is invisible to guided players.
4. **QM line for Fame/Infamy/Reputation.** One line each, woven into existing steps (`step5_delivered` for Fame, `step6b_victory` for Infamy/Heat).

**Bucket 2 — New mechanics from B10/B11/B12 with no coverage:**

5. **Boarding phase QM reference.** One line at `step6b_huntAccepted` mentioning that grappling leads to a boarding fight.
6. **Sunk-vs-captured contextual hint.** Shown on the first battle victory (whichever outcome fires first).
7. **Fall Back action preview.** Match the other combat buttons, showing expected crew loss.
8. **Resist inspection** hint on the Intercept screen + Handbook line.

**Bucket 3 — Handbook updates (batch as one pass):**

9. **New Handbook card: "Your Captain's Allegiance"** — all five birth traits with exact numbers.
10. **Update Reputation card** — faction-scoped rep, not per-port.
11. **Update Faction Services card** — verify all five service descriptions are current.
12. **Update Combat/Boarding cards** — the B11 mechanics are described, but verify thresholds (Fall Back cost, Demand Surrender at 0.65) are stated.
13. **Add to Handbook: abandoning missions, wage tick, game over conditions, hidden vs discovered ports, crew alignment/upset, resist inspection.**
14. **Update Missions card** — faction reward multiplier.

**Bucket 4 — QM enrichment (nice-to-have lines):**

15. **Free trade mention** in `step2_marketOpen`.
16. **Smuggle mission mention** in `step6_hired`.
17. **Equipment slots mention** in `step7_shipyardOpen`.
18. **Crew traits hint** in `step6_crewOpen`.
19. **Change Course hint** on the Sailing screen.

**Bucket 5 — Console/polish:**

20. **HUD tooltip for Faction Heat** (currently only appears at > 0 with no explanation).
21. **Crew hint popup extension** — mention 50/30/0 morale thresholds.
22. **Save/Load Handbook card** — fold in autosave toggle.

---

## top 5 to do first


| # | Task | Estimated time |
|---|---|---|
| 1 | Intercept `TutorialPopup` (covers Fight/Flee/Parley/Bribe/Surrender/Inspect/Resist) | ~30 min |
| 2 | Plunder `TutorialPopup` (covers transfer, jettison, illegal goods) | ~20 min |
| 3 | QM routing to Status + Fame/Infamy/Heat lines in existing steps | ~30 min |
| 4 | New Handbook card "Your Captain's Allegiance" | ~30 min |
| 5 | Fall Back action preview + Sunk-vs-captured contextual hint | ~20 min |

----

## one more thing

upon dismissal (either of pop up hints or of qm onboarding process), the player should be showed what he would miss as guided/helped information (aka : the list of hint not seen and qm onboarding step not done, but with some rephrasing so that its inteligible for the new player) To be defined/refined how this should happend and be displayed.