# Onboarding Coverage Audit — QM Dialogue vs Handbook
## Every game mechanic/action, cross-referenced against both teaching surfaces

**Legend**
- ✅ Covered — confirmed present in the actual shipped content
- ❌ Not covered — should be, nothing currently addresses it
- ➖ Not needed — fine to leave discoverable-by-play, or QM Handbook are the wrong tool for it
- 🔜 Planned — mechanic doesn't exist yet (B10/B11), coverage should ship alongside it, not before

**Two important structural notes surfaced during this audit:**
1. Per-screen `TutorialPopup` hints (Hints-only mode) are **suppressed entirely** when
   `tutorialMode === "full"` (Guided/QM mode) — confirmed in `storage.js`'s
   `shouldShowTutorial`. Any mechanic taught only via a per-screen popup is invisible
   to guided-mode players. This is called out explicitly wherever it applies.
2. The Handbook is reference documentation, opened voluntarily via the Menu — it is
   never pushed to the player. A mechanic being "✅ Handbook" does not mean a new
   player has necessarily seen it; it means the information exists if they look.

---

## Core Loop & Navigation

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Port screen — purpose & layout | ✅ Implicit (QM walks the player through it) | ➖ Not needed, self-evident once used |
| World Map screen — purpose & navigation | ✅ `step3_mapOpen` | ➖ Not needed |
| Sailing screen — Advance Day / Enter Port | ✅ `step4_sailing` | ➖ Not needed |
| Change Course mid-voyage | ❌ Never mentioned by QM | ❌ Not documented |
| Status screen — purpose & contents | ❌ **QM never routes here** — no `statusOpened` step exists in the 15-step list | ✅ Implicitly covered (Fame/Infamy/Reputation cards) |
| Journal screen — purpose & log categories | ✅ `journalOpened` step exists, though QM's exact wording at that step wasn't verified in this pass | ➖ Not needed |
| Crew screen — purpose | ✅ `crewOpened` step | ➖ Not needed |
| Market screen — purpose | ✅ `marketOpened` step | ➖ Not needed |
| Shipyard screen — purpose | ✅ `shipyardOpened` step | ➖ Not needed |
| Menu — save/load/export/import | ❌ Never mentioned by QM or any hint | ❌ Not documented |
| Discovered vs. hidden ports | ❌ Only obliquely via flavor gossip text | ❌ Not documented as an explicit mechanic |

---

## Economy & Trade

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Buying/selling goods — basic mechanic | ✅ `step2_marketOpen` (framed as contract fulfillment only) | ✅ "Resources & Trade" card |
| **Free trade / natural trade routes as a strategy independent of missions** | ❌ QM's market step is purely mission-errand framed — real content exists but only in the market screen's `TutorialPopup`, which is **suppressed in guided mode** | ✅ "Buy low in one port, sell high in another for profit" — explicitly stated |
| Good Deals / In Demand labels (B8.1 UI) | ❌ Neither QM nor Handbook references these specific labels by name | ❌ Handbook's trade advice predates this UI, doesn't point to it |
| Map tooltip trade profile (hover a port) | ❌ Not mentioned anywhere | ❌ Not documented |
| Price variance/availability mechanic | ➖ Implied by "buy low sell high," reasonable to leave as discoverable texture | ✅ "Prices vary per port based on availability and random variance" |
| Illegal goods / contraband risk | ➖ Reasonable to leave discoverable — a smuggler finding this out by consequence is arguably correct design | ✅ Explicitly flagged in "Resources & Trade" and "Combat & Intercept" cards |
| Hold capacity & overload speed penalty | ➖ Surfaced as a persistent inline UI warning on the market screen itself (contextual, always-visible — the right pattern) | ✅ Exact thresholds documented (+11% at 50%, +33% at 75%) |
| Food & water consumption rate | ✅ `step2_marketOpen` mentions provisions | ✅ "1 unit per 10 crew" |
| Starvation consequences (0 food/water) | ❌ QM teaches buying provisions, never the failure consequence | ✅ "14 days no food / 3 days no water, crew die" — exact thresholds given |

---

## Crew

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Hiring crew — basic mechanic | ✅ `firstCrewHired` step | ✅ "Crew" card |
| Crew count affects combat speed/effectiveness | ➖ Reasonable as background texture | ✅ "More crew → faster combat actions" |
| Wages — daily cost, morale penalty multiplier | ❌ Never mentioned by QM | ✅ Exact formula given (2g/crew, ×1.5 under 30 morale) |
| Morale — what raises/lowers it, thresholds | ❌ Never mentioned by QM | ✅ Full threshold table (50/30/0 breakpoints) |
| Crew traits system (hidden/revealed) | ❌ Never mentioned anywhere in guided experience | ✅ "Crew Traits" card, dedicated section |
| Crew progression (Seasoned/Veteran/Loyal) | ❌ Never mentioned | ✅ Exact day thresholds given |
| Desertion mechanic | ❌ Never mentioned proactively | ✅ Implied via "0 morale → crew deserts" and "Upset crew may desert" |
| Minimum crew to sail (B9 gate) | ✅ Contextual — disabled Sail button shows a tooltip reason when triggered (the right pattern, same as the equipment-clearing warning) | ❌ Not documented as a standing rule |

---

## Reputation, Fame, Infamy, Heat

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Fame — what it is, how it's gained | ❌ Never mentioned by QM | ✅ Dedicated card |
| Infamy — what it is, thresholds (50/100) | ❌ Never mentioned by QM | ✅ Dedicated card, exact thresholds |
| Reputation — per-port standing, effects | ❌ Never mentioned by QM | ✅ Dedicated card |
| Reputation decay toward neutral | ❌ Never mentioned | ✅ "Decays slowly toward 50 over time" |
| Faction Heat — what it is, decay rate | ❌ Never mentioned by QM, and not shown in the HUD at all (confirmed no HUD tooltips exist anywhere) | ✅ Dedicated card, exact decay rate given |
| Attacking one faction hurts rep with allies | ❌ Not mentioned by QM | ✅ "reduces reputation with all its ports" |
| Reputation-gated perks (repair cost, mission pay) | ❌ Only discoverable by checking Status screen (which QM never routes to) | ✅ "Affects repair cost, mission rewards, and service access" |

---

## Missions

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Trade mission type | ✅ QM's own delivered mission is this type | ✅ Listed |
| Combat mission type | ✅ QM's tutorial hunt is this type | ✅ Listed |
| Smuggle mission type | ❌ Never introduced by QM | ✅ Listed |
| Patrol mission type | ❌ Never introduced by QM | ✅ Listed, including the "not guaranteed encounter" mechanic |
| Escort mission type | ❌ Never introduced by QM | ✅ Listed |
| Assault mission type | ❌ Never introduced by QM | ✅ Listed |
| Abandoning a mission — consequence | ❌ Never mentioned | ❌ Not documented |
| Mission reward scaling by risk/reputation | ❌ Never mentioned | ➖ Implied, not explicit |

---

## Combat — Intercept Phase

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Intercept screen — purpose, exists at all | ❌ QM's tutorial hunt likely walks through this once live, but the screen itself has **zero `TutorialPopup` in either mode** | ✅ "Combat & Intercept" card lists all five options |
| Fight option | ✅ (implicit, via tutorial hunt) | ✅ |
| Flee option — success odds | ➖ Reasonable as felt-through-play texture | ➖ Not detailed (odds not given) |
| Parley option | ❌ Never explained | ✅ Listed |
| Bribe option | ❌ Never explained | ✅ Listed |
| Surrender option — costs | ❌ Never explained | ✅ "costs gold, cargo, days, or reputation depending on context" |
| Allow Inspection (navy patrols) | ❌ Never explained | ✅ Listed, contraband-seizure consequence given |

---

## Combat — Naval Phase (current system)

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Broadside action | ✅ (implicit, tutorial hunt) | ✅ "reliable" |
| Precision action | ❌ Never explained proactively | ✅ "risky high damage" |
| Grapple action (current: instant win) | ❌ Never explained proactively | ✅ "board and capture" |
| Evade action (current: flee attempt) | ❌ Never explained proactively | ✅ Listed |
| Round resolution / how actions interact | ❌ Never explained | ➖ Not detailed at this level, reasonable to leave felt-through-play |

---

## Combat — Naval Phase (🔜 B11 rework — distance & positioning)

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Distance bands (Far/Medium/Close) exist | 🔜 Needs a QM line or contextual hint once shipped — this is a genuinely new concept, not an extension of something already taught | 🔜 Needs a new Handbook card |
| Close Distance / Open Distance actions | 🔜 Same — new mechanic | 🔜 Same |
| Legal-action gating per distance | 🔜 Best taught contextually (disabled buttons with tooltips, per the established pattern) rather than QM prose | ➖ Can be inferred from the UI itself if gating is visually clear |
| Grapple requires Close, no longer instant-win | 🔜 Needs explicit mention — this is a **behavior change** from the current system, worth flagging even to returning players via changelog, not just new players via QM | 🔜 Needs updated Handbook wording |
| Sunk vs. Captured outcome distinction | 🔜 Needs explicit mention — directly affects whether plunder is available | 🔜 Needs new Handbook wording |
| **"You can't plunder when the enemy is sunk"** | 🔜 High-value single line, contextual (shown at the moment of a Sunk outcome) rather than pre-taught | 🔜 Needs explicit statement |

---

## Combat — Boarding Phase (🔜 B11 rework)

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Boarding as a distinct sub-phase (not instant) | 🔜 New concept, needs coverage | 🔜 New Handbook card |
| Continue Fighting / Fall Back / Surrender actions | 🔜 New concept | 🔜 New Handbook card |
| Advantage ratio (the split bar UI) | 🔜 The bar itself is designed to be self-explanatory via visual split (per the UI design decision already made) — likely doesn't need QM prose, but a first-encounter contextual hint is worth considering | 🔜 Should explain what the bar represents and how it's calculated (crew × morale-equivalent) |
| Fall Back's parting-shot cost | 🔜 Worth a contextual warning the first time a player attempts it, not just Handbook text | 🔜 Needs explicit statement |
| Demand Surrender's 0.65 ratio threshold | ➖ The disabled-with-tooltip UI pattern already communicates this contextually — no separate teaching needed | 🔜 Worth stating the exact threshold for reference |

---

## Plunder

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Plunder screen — purpose | ❌ **Zero `TutorialPopup` in either mode** | ➖ Implied by Combat & Intercept card, not explicit |
| Keep searching vs. leave now (risk of lingering) | 🔜 Not yet a mechanic (noted as a B11-adjacent design idea, not yet task-listed) | 🔜 If built, needs coverage |

---

## Random Events & Patrol Enforcement

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Random events exist (storms, distressed ships, etc.) | ❌ **Zero `TutorialPopup`**, never QM-mentioned | ➖ Not documented, reasonable to leave discoverable — the whole point of a random event is surprise |
| Patrol inspection catches smuggled goods | ➖ Reasonable as a natural consequence to discover | ✅ "If contraband is found during inspection, it is seized and you are fined" |
| Random (non-mission) patrols can also catch contraband | ❌ Not distinguished from mission-driven patrol encounters anywhere | ❌ Not explicitly stated — the Handbook's patrol wording reads as mission-specific |

---

## Ship & Equipment

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Repair mechanic | ✅ `shipRepaired` step | ✅ "Repair at any port's Shipyard" |
| Equipment slots per ship tier | ❌ Shipyard hint says "browse the tabs," doesn't explain slot limits | ❌ Not documented |
| Buying a new ship clears equipment | ➖ **Already well-handled** — persistent inline warning directly on the Ships tab, the correct pattern (this was the example that started this whole audit) | ➖ Not needed given the inline warning already covers it |
| Hull vs. max hull, damage sources | ➖ Reasonable as background texture | ✅ Dedicated Hull card |

---

## 🔜 Starting Faction Traits (B10, not yet built)

| Mechanic / Action | QM Coverage | Handbook Coverage |
|---|---|---|
| Faction trait exists at all (bonus + drawback) | 🔜 Belongs on the **New Game screen itself** (already speced in that task list — inline description + mechanics recap per faction), not the QM, since it's chosen before the QM ever starts | 🔜 Needs a Handbook card once shipped — a returning player forgetting their own starting trait's exact numbers is a real, ordinary need |
| English: combat damage/speed trade-off | 🔜 New Game screen (per B10 task list) | 🔜 Handbook |
| Spanish: crew hire/wage asymmetry | 🔜 New Game screen | 🔜 Handbook |
| Pirate: tribute mechanic, fairness check | 🔜 New Game screen for the base concept; the fairness-check nuance (don't hoard gold to dodge tribute) is arguably better discovered than pre-taught — over-explaining an anti-exploit mechanic can read as accusatory | 🔜 Handbook, full mechanic |
| French: reputation/infamy/heat amplification | 🔜 New Game screen | 🔜 Handbook |
| Dutch: trade bonus / combat-gold drawback | 🔜 New Game screen | 🔜 Handbook |
| Universal wage upkeep tick (new base mechanic) | 🔜 Worth a QM line the first time it fires ("the crew's wages come due"), since it's a new recurring cost every player will feel regardless of faction | 🔜 Handbook — replaces/extends the existing Gold card's current wage description, which will be stale once this ships |

---

## Summary: What's Actually Missing Right Now (excluding 🔜 future items)

The pattern across the whole table is consistent: **the Handbook is doing most of the real work already** — it's thorough, accurate, and covers nearly everything at a reference level. The gaps cluster into three distinct categories, each needing a different fix:

1. **Screens with zero teaching surface in either mode**: Intercept, Plunder, Random Events, Menu. These need `TutorialPopup` hints added, full stop — the same mechanical pattern already used for nine other screens.

2. **Content that exists but is guided-mode-invisible**: the market's trade-route explanation is the clearest example — real, good content, but structurally unreachable by the player population most likely to need it. Fix is porting a line into the QM's own dialogue, not writing new content.

3. **Status screen is a QM dead zone**: the guided sequence never routes there, so its Fame/Infamy/Reputation content (which the Handbook assumes will be seen) may never be encountered by a guided player at all during onboarding.

Want this turned into the actual implementation task list — the three missing hint popups, the QM dialogue insertions, and the Status-screen routing fix — scoped to ship now, independent of B10/B11?