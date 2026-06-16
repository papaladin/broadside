# Broadside — Progressive Onboarding System
## Full Design & Implementation Specification


---

## Table of Contents

| § | Section | Related Tasks |
|---|---------|---------------|
| 1 | [Overview & Design Philosophy](#1-overview--design-philosophy) | — |
| 2 | [Onboarding Flow Summary](#2-onboarding-flow-summary) | — |
| 3 | [T0 — Fame Tier Rescaling (0→5)](#3-t0--fame-tier-rescaling-05) | Foundation |
| 4 | [T1 — New Game Screen Redesign](#4-t1--new-game-screen-redesign) | UI / Data |
| 5 | [T2 — Onboarding State System](#5-t2--onboarding-state-system) | State |
| 6 | [T3 — Quartermaster as Crew Member](#6-t3--quartermaster-as-crew-member) | Mechanics |
| 7 | [T4 — Progressive Feature Unlocking (UI Gating)](#7-t4--progressive-feature-unlocking-ui-gating) | UI |
| 8 | [T5 — Tutorial Delivery Mission](#8-t5--tutorial-delivery-mission) | Content / Data |
| 9 | [T6 — Tutorial Hunt Mission (Combat Introduction)](#9-t6--tutorial-hunt-mission-combat-introduction) | Content / Combat |
| 10 | [T7 — Random Event Protection During Onboarding](#10-t7--random-event-protection-during-onboarding) | Engine |
| 11 | [T8 — QM Popup Component & Dialogue](#11-t8--qm-popup-component--dialogue) | UI / Content |
| 12 | [T9 — Journal Screen Unlock & Auto-Save Messaging](#12-t9--journal-screen-unlock--auto-save-messaging) | UI |
| 13 | [T10 — Onboarding Completion & QM Departure](#13-t10--onboarding-completion--qm-departure) | Engine / Narrative |
| 14 | [T11 — Skip / Exit Mechanism (3 Layers)](#14-t11--skip--exit-mechanism-3-layers) | UI / Engine |
| 15 | [T12 — Economy Tuning & Balance Verification](#15-t12--economy-tuning--balance-verification) | Data |
| 16 | [Resolved Design Questions](#16-resolved-design-questions) | — |
| 17 | [Implementation Sequence & Phasing](#17-implementation-sequence--phasing) | — |
| 18 | [Dependency Graph](#18-dependency-graph) | — |
| 19 | [Open / Deferred Items](#19-open--deferred-items) | — |

### Complexity & Scope Summary

| # | Task | Complexity | Est. Lines Changed | Files Touched |
|---|------|-----------|---------------------|----------------|
| T0 | Fame Tier Rescaling | Medium | ~50 | 3 |
| T1 | New Game Screen | Medium | ~200 | 4 |
| T2 | Onboarding State System | Low | ~40 | 3 |
| T3 | QM Crew Member | Medium | ~80 | 5 |
| T4 | Progressive Feature Unlocking | Medium | ~100 | 3 |
| T5 | Tutorial Delivery Mission | Low–Medium | ~60 | 3 |
| T6 | Tutorial Hunt Mission | Medium | ~70 | 4 |
| T7 | Random Event Protection | Low | ~15 | 1 |
| T8 | QM Popup Component & Dialogue | Medium | ~150 | 5 |
| T9 | Journal Screen Unlock | Low | ~30 | 2 |
| T10 | Onboarding Completion | Medium | ~50 | 2 |
| T11 | Skip / Exit Mechanism | Low | ~40 | 3 |
| T12 | Economy Tuning | Low | ~20 | 1 |
| | **Total** | | **~900** | **13 unique files** |

---

## 1. Overview & Design Philosophy

### What

Replace the current tutorial popup system with a **progressive onboarding** that narratively guides the player through their first full voyage loop, unlocking screens and features as they go. A **Quartermaster (QM)** character — a real crew member — delivers all guidance in-world.

### Why

The current tutorial popups are:

- Disconnected from gameplay (appear at arbitrary moments)
- Non-diegetic (break immersion)
- All-or-nothing (no progressive disclosure)
- Not tied to player actions (time-based, not state-based)

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Narrative, not tutorial** | Every unlock is motivated by story. The player lives their first chapter, not reads a manual. |
| **Sail fast** | Player should be at sea within ~3 minutes. That's the fantasy. Don't gate it behind too many systems. |
| **Mentor, not narrator** | The starting QM speaks in short, salty lines. Diegetic (in-world) guidance, not UI chrome. |
| **Unlock by doing** | Buttons/screens appear *when the game state creates the need*, not on a timer or click count. |
| **Respect the player** | Skippable at any point. Never more than 2–3 sentences per popup. No forced clicks on highlighted buttons. |

### The Mentor: Your Quartermaster

All onboarding dialogue comes from a **Quartermaster** — a named, faction-specific crew member who joins you at game start. This gives:

- A **consistent voice** (personality, pirate flavour)
- A **diegetic reason** for guidance ("Your QM advises you…")
- A character you can **reuse** for hints, warnings, lore
- A natural **exit point** ("I think I can handle it from here" = dismiss the QM = skip onboarding)
- A **real crew member** who participates in combat and counts toward crew size

---

## 2. Onboarding Flow Summary

### Step-by-Step Flow

| Step | Trigger | Unlocks | QM Message (summary) | Est. Time |
|------|---------|---------|------------------------|-----------|
| **0** | New game starts | 📜 Contracts button | "Welcome to {port}. Let's see what work there is." | 10s |
| **1** | Accept first contract | 🏪 Market button | "We'll need cargo and provisions. Head to the Market." | 30s |
| **2** | Buy contract goods + provisions | ⛵ Navigation / Set Sail | "Cargo loaded. Time to chart a course." | 1–2 min |
| **3** | Open map, select destination | Sailing screen | "{dest} — just a few days' sail. Select it." | 30s |
| **4** | Sailing begins (passive) | *(atmosphere only)* | "Smooth seas. Watch our provisions." | 1–2 min |
| **5** | Arrive + deliver contract goods | 👥 Crew button | "Well done. Might be worth checking the Crew quarters." | 1 min |
| **6** | Open Crew, hire ≥1 member | Tutorial hunt mission appears | "We've got hands now. There's a bounty posted." | 30s |
| **6b** | Accept + complete tutorial hunt | 🔧 Shipyard button | "Well fought! She's got holes. Let's find a Shipyard." | 3–4 min |
| **7** | Visit Shipyard, repair hull | *(QM hints at Cutter)* | "Repairs, upgrades. A Cutter would serve us well — ~1,000g." | 30s |
| **8** | Return to port after repair | 📖 Journal button | "I've been keeping a record. Your Journal — your story." | 30s |
| **9** | Open Journal | ✅ Onboarding complete | "Sea legs earned, Captain. Fair winds." QM departs. | 15s |
| | | **Total** | | **~8–11 min** |

### Combat: Deliberate Placement

Combat is introduced at step **6b** via the tutorial hunt mission, not left to chance. This ensures:

- Every player experiences combat before the tutorial ends
- Combat is **motivated** (bounty contract, not random encounter)
- Hull damage from combat **motivates** the Shipyard visit (step 7)
- Random events are **blocked** during onboarding (see T7), so the tutorial hunt is the only combat

---

## 3. T0 — Fame Tier Rescaling (0→5) --> DONE

### Overview

Add a new **tier 0 ("Greenhorn")** for fame 0–9 and shift all existing tiers up by 1. This provides properly scaled enemies, missions, and rewards for brand-new players in a dinghy — regardless of whether they play the tutorial or skip it.

### Rationale

Current tier 0 enemies (fame 0–49) have 2–6 cannons and 20–45 hull. A dinghy (2 cannons, 30 hull) **cannot reliably win** against the upper end of this range. The new tier 0 creates a beatable-but-dangerous difficulty band for the first ~10 fame points.

### New Tier Table

| New Tier | Fame Range | Label | Old Tier | Notes |
|----------|-----------|-------|----------|-------|
| **0** | 0–9 | **Greenhorn** | *(new)* | Dinghy-appropriate enemies |
| 1 | 10–49 | Unknown | was 0 | Post-tutorial, pre-Cutter |
| 2 | 50–99 | Recognised | was 1 | Mid-game |
| 3 | 100–199 | Notorious | was 2 | Late-game |
| 4 | 200–349 | Legendary | was 3 | End-game |
| 5 | 350+ | Immortal | was 4 | Prestige |

### Complexity: **Medium**

### Files Impacted

#### 1. `logic.js` — L25: `getFameInfo()` — REWRITE

This is the **single source of truth** for fame tier calculation. All other systems cascade from here.

```javascript
const getFameInfo = (fame) => {
  if (fame >= 350) return { label: "Immortal", tier: 5 };
  if (fame >= 200) return { label: "Legendary", tier: 4 };
  if (fame >= 100) return { label: "Notorious", tier: 3 };
  if (fame >= 50) return { label: "Recognised", tier: 2 };
  if (fame >= 10) return { label: "Unknown", tier: 1 };
  return { label: "Greenhorn", tier: 0 };
};
```

#### 2. `data.js` — 5 tier-keyed tables need new row 0 + renumbering

**`MISSION_GOLD_RANGES` (L652)** — Gold rewards per tier/risk:

```javascript
const MISSION_GOLD_RANGES = {
  0: { low:[75,120], medium:[120,160], high:[160,200], assault:[200,280] }, // NEW tier 0
  1: { low:[140,180], medium:[180,230], high:[230,300], assault:[300,400] }, // was 0
  2: { low:[400,1500], medium:[1500,5000], high:[5000,7000], assault:[7000,10000] }, // was 1
  3: { low:[2000,6000], medium:[6000,15000], high:[15000,25000], assault:[25000,40000] }, // was 2
  4: { low:[8000,20000], medium:[20000,50000], high:[50000,80000], assault:[80000,120000] }, // was 3
  5: { low:[30000,60000], medium:[60000,100000], high:[100000,180000], assault:[180000,300000] }, // was 4
};
```

**`MISSION_ENEMY_RANGES` (L661)** — Enemy stats per tier:

```javascript
const MISSION_ENEMY_RANGES = {
  hull: { 0:[12,22], 1:[20,45], 2:[40,75], 3:[65,110], 4:[95,155], 5:[135,210] },
  cannons: { 0:[1,3], 1:[2,6], 2:[5,10], 3:[8,16], 4:[13,22], 5:[18,30] },
  crew: { 0:[3,8], 1:[8,18], 2:[15,35], 3:[25,55], 4:[40,80], 5:[60,110] },
};
```

**`PLUNDER_TARGET` (L668)** — Plunder value per tier/risk:

```javascript
const PLUNDER_TARGET = {
  0: { low: 15, medium: 20, high: 28 }, // NEW
  1: { low: 27, medium: 34, high: 41 }, // was 0
  2: { low: 70, medium: 100, high: 150 }, // was 1
  3: { low: 200, medium: 350, high: 500 }, // was 2
  4: { low: 500, medium: 800, high: 1200 }, // was 3
  5: { low: 1200, medium: 2000, high: 3500 }, // was 4
};
```

**`TRADE_GOODS_BY_TIER` (L734)** — Available trade goods per tier:

```javascript
const TRADE_GOODS_BY_TIER = {
  0: ["rum", "sugar", "timber"], // NEW — simple goods
  1: ["rum", "sugar", "timber", "cloth"], // was 0
  2: ["rum", "sugar", "timber", "cloth", "coffee", "cocoa"], // was 1
  3: ["rum", "sugar", "timber", "cloth", "coffee", "cocoa", "spices", "dyes"], // was 2
  4: ["rum", "sugar", "timber", "cloth", "coffee", "cocoa", "spices", "dyes", "gems", "gold_ore"], // was 3
  5: ["rum", "sugar", "timber", "cloth", "coffee", "cocoa", "spices", "dyes", "gems", "gold_ore", "silk", "ivory"], // was 4
};
```

**`SMUGGLE_GOODS_BY_TIER` (L742)** — Available smuggle goods per tier:

```javascript
const SMUGGLE_GOODS_BY_TIER = {
  0: ["rum"], // NEW — only rum
  1: ["rum", "tobacco"], // was 0
  2: ["rum", "tobacco", "weapons"], // was 1
  3: ["rum", "tobacco", "weapons", "contraband"], // was 2
  4: ["rum", "tobacco", "weapons", "contraband", "gems"], // was 3
  5: ["rum", "tobacco", "weapons", "contraband", "gems", "slaves"], // was 4
};
```

#### 3. `generators.js` — 2 functions need updating

**`riskWeightsFor()` (L749)** — Mission risk distribution per tier:

```javascript
const riskWeightsFor = (fame) => {
  const tier = window.L.getFameInfo(fame).tier;
  const table = [
    { low:6, medium:3, high:1, assault:0 }, // NEW tier 0 — mostly easy
    { low:5, medium:4, high:1, assault:0 }, // was tier 0
    { low:4, medium:4, high:2, assault:0 }, // was tier 1
    { low:3, medium:4, high:3, assault:0 }, // was tier 2
    { low:2, medium:3, high:4, assault:1 }, // was tier 3
    { low:1, medium:3, high:4, assault:2 }, // was tier 4
  ];
  return table[tier] || table[table.length - 1];
};
```

**`generateMarketFlavour()` (L984)** — Fame tier thresholds at ~L1064:

```javascript
// Was: tier >= 4 for legendary, tier >= 2 for recognised
// Now: tier >= 5 for legendary, tier >= 3 for recognised
if (fameInfo.tier >= 5) {
  pools.push({ priority: 4, category: "fame_legendary", text: pickRandom(T.fame_legendary) });
} else if (fameInfo.tier >= 3) {
  pools.push({ priority: 4, category: "fame_recognised", text: pickRandom(T.fame_recognised) });
}
```

### Cascade Analysis — Files That Do NOT Need Changes

| File | Why Safe |
|------|----------|
| `data_text.js` | Gossip system (`generatePortGossip` L898) uses fame value thresholds directly, not tier numbers |
| `engine_voyage.js` | All tier usage cascades through `G.generateEnemy()` → `L.getFameInfo()` |
| `engine_combat.js` | Uses `G.generateEnemyCargo()` which cascades from `getFameInfo()` |
| `engine_port.js` | No direct tier usage |
| `SHIPS` / `EQUIPMENT` | Use `requiredFame` as point thresholds (not tier numbers) |
| `screens_*.jsx` | Read labels from `getFameInfo()` — auto-updated |
| `ui.jsx` | Same — displays `fameInfo.label` |

**Existing fame < 10 Guard**: `generators.js` L578 already has a `fame < 10` guard in `pickTargetPort()` that restricts destinations to a curated list of nearby ports. This is architecturally consistent with the new tier 0 boundary and requires no change.

### Dependencies

None — this is the foundation task. Everything else depends on correct tier numbering.

---

## 4. T1 — New Game Screen Redesign --> DONE

### Overview

Replace the current 5-scenario selection list (`STARTS` array, L1076 in `data.js`) with a single universal start: captain name input + faction selection. The onboarding flow is always the same structure; only the starting port and flavour text change per faction.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scenario count | 1 universal (was 5) | One onboarding to build, test, maintain. Faction choice still gives strategic variety. |
| Captain name | Pre-populated with random English name | Immediate sense of identity. Player can edit or re-roll. |
| Random name pool | Faction-appropriate names from `data_text.js` (L9 `CREW_FIRST_NAMES`, L36 `CREW_LAST_NAMES`) | Immersive — Spanish captain gets Spanish names, etc. |
| Faction choice | 5 clickable cards | Visual, immediate, updates backstory in real time |
| Backstory text | Template + faction-specific fragments | Salvages best writing from existing `STARTS`; one structure to maintain |
| Debug scenario | Removed entirely | Use the existing debug tool menu to generate equivalent state (sloop, gold, crew, fame) |
| Validation | "Set Sail" disabled until name nonempty AND faction selected | Prevents broken game start |

### Complexity: Medium

### Screen Layout

```
┌──────────────────────────────────────────────────────┐
│ BROADSIDE                                             │
│ The Caribbean, June 1695                              │
│                                                        │
│ Captain's Name                                        │
│ ┌──────────────────────────────────┐ ┌──────────┐    │
│ │ William Hartley                   │ │ Random   │    │
│ └──────────────────────────────────┘ └──────────┘    │
│                                                        │
│ Choose your allegiance:                               │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│ │      │ │ 🇪🇸   │ │ 🇫🇷   │ │ 🇳🇱   │ │      │          │
│ │ ENG  │ │ SPA  │ │ FRA  │ │ DUT  │ │ PIR  │          │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                        │
│ ┌────────────────────────────────────────────────┐   │
│ │ Captain William Hartley arrived in Port Royal   │   │
│ │ with a forged commission and a borrowed tide.   │   │
│ │                                                  │   │
│ │ The ink is passable. The signature is not. You  │   │
│ │ need to become the kind of captain who doesn't  │   │
│ │ need the letter before someone looks closely    │   │
│ │ enough to notice.                                │   │
│ │                                                  │   │
│ │ Your adventure begins in Port Royal.            │   │
│ └────────────────────────────────────────────────┘   │
│                                                        │
│ ☑ Enable guided first voyage (recommended)            │
│                                                        │
│              [ Set Sail ]                             │
│                                                        │
└──────────────────────────────────────────────────────┘
```

### Behaviour Notes

- **On page load**: Captain name is pre-populated with a random English name. No faction is selected. "Set Sail" is disabled.
- **On faction select**: Faction card highlights. Backstory text updates in real time. Starting port name appears. If Random is clicked again, name pool switches to selected faction.
- **On "Set Sail" click**: Validate name is non-empty AND faction is selected. If invalid, show inline error. If valid, dispatch `START_GAME`.
- **Onboarding toggle**: Default checked. Maps to `onboarding.enabled` in game state.

### Files Impacted

#### 1. `data.js` — L1076: Replace `STARTS` array

Remove the entire `const STARTS = [...]` array (5 scenarios + debug) and replace with:

```javascript
const STARTS = {
  // ── Faction → Starting Port ────────────────────────────
  factionPorts: {
    english: "portRoyal",
    spanish: "havana",
    french: "petitGoave",
    dutch: "santoDomingo",
    pirate: "santiagoDeCuba",
  },

  // ── Faction → Reputation Adjustments ───────────────────
  factionRepAdjust: {
    english: { english: +10, pirate: -5 },
    spanish: { spanish: +10, english: -5 },
    french: { french: +10, english: -5 },
    dutch: { dutch: +10, spanish: -5 },
    pirate: { pirate: +10, spanish: -5 },
  },

  // ── Faction → Backstory Fragments ─────────────────────
  factionBackstory: {
    english: {
      hook: "a forged commission and a borrowed tide",
      flavour: "The ink is passable. The signature is not. You need to become the kind of captain who doesn't need the letter before someone looks closely enough to notice.",
    },
    spanish: {
      hook: "a sealed crate and a debt you didn't ask for",
      flavour: "The crate makes no sound. It's heavier than it looks. You've decided not to think about it. After the first delivery, you'll know if you have a choice in any of this.",
    },
    french: {
      hook: "a dead man's charts and a contract you inherited",
      flavour: "Your mentor left you his instruments, his dinghy, and a six-month charting contract the navy has already paid for. The navy wants charts. You want freedom. Both require moving.",
    },
    dutch: {
      hook: "a company ledger and a quota that won't meet itself",
      flavour: "You found a discrepancy in a senior partner's account. You were 'promoted' to independent contractor within the week. The freedom is real enough. The accounting isn't.",
    },
    pirate: {
      hook: "a shipwreck, a friend, and nothing else",
      flavour: "The storm took the ship and everyone on it except you. You made port on the fifth day. You have two years of knowledge, a dinghy, and no particular loyalty to anyone.",
    },
  },

  // ── Faction → Quartermaster Names (handcrafted) ───────
  factionQM: {
    english: { firstName: "Old", lastName: "Morley" },
    spanish: { firstName: "Viejo", lastName: "Cortés" },
    french: { firstName: "Vieux", lastName: "Deschamps" },
    dutch: { firstName: "Oude", lastName: "Bakker" },
    pirate: { firstName: "Scarred", lastName: "Jim" },
  },

  // ── Universal Starting Conditions ─────────────────────
  gold: 490,
  ship: "dinghy",
  hold: { food: 8, water: 8 },
  startDate: { day: 1, month: 6, year: 1695 },
};
```

#### 2. `engine_port.js` — L199: Rewrite `START_GAME` reducer

Currently: looks up `STARTS.find(s => s.id === action.scenarioId)`. New signature: `{ type: A.START_GAME, captainName, faction, onboardingEnabled }`.

Key changes in the reducer:

- Use `D.STARTS.factionPorts[action.faction]` for starting port
- Use `D.STARTS.factionRepAdjust[action.faction]` for rep
- Set `state.captainName = action.captainName`
- Set `state.faction = action.faction`
- If `action.onboardingEnabled`: inject QM crew member (see T3), auto-accept tutorial delivery (see T5)
- If `!action.onboardingEnabled`: crew starts empty (`roster = []`), no starter mission, all features unlocked

#### 3. New file: `screens_newgame.jsx` (or section in `App.jsx`)

New React component for the game creation screen. Includes:

- Text input for captain name
- Random button (generates faction-appropriate name from `data_text.js` L9/L36)
- 5 faction selection cards
- Dynamic backstory text area
- Onboarding toggle checkbox (default: checked)
- "Set Sail" button with validation

#### 4. `App.jsx` — L219–232: Add routing for "newgame" screen

```javascript
case "newgame": return React.createElement(NewGameScreen, { state, dispatch });
```

The current title screen's "New Game" button navigates to "newgame" instead of the old scenario selection.

### Dependencies

- **T0** (fame rescaling) — starting economy should be tuned for tier 0
- **T2** (onboarding state) — new game screen sets `onboarding.enabled`
- **T3** (QM crew member) — QM is injected during `START_GAME`

---

## 5. T2 — Onboarding State System --> DONE

### Overview

Add an `onboarding` object to the game state that tracks tutorial progress. This is the data backbone for all progressive unlocking, QM dialogue, and skip logic.

### Complexity: Low

### State Shape

```javascript
onboarding: {
  enabled: true,        // false = everything unlocked (skipped or never enabled)
  completed: false,      // true when all steps done
  currentStep: 0,        // current step index (0–9), informational
  stepsCompleted: {
    // ── Step 0–1: Contracts & first mission ──
    contractsOpened: false,
    firstContractAccepted: false,
    // ── Step 2: Market ──
    marketOpened: false,
    provisionsAndGoodsBought: false,
    // ── Step 3–4: Navigation & sailing ──
    mapOpened: false,
    firstVoyageStarted: false,
    // ── Step 5: Arrival & delivery ──
    firstArrival: false,
    firstContractDelivered: false,
    // ── Step 6: Crew ──
    crewOpened: false,
    firstCrewHired: false,
    // ── Step 6b: Tutorial hunt ──
    tutorialHuntAccepted: false,
    tutorialHuntCompleted: false,
    // ── Step 7: Shipyard ──
    shipyardOpened: false,
    shipRepaired: false,
    // ── Step 8: Journal ──
    journalOpened: false,
  },
  combatHintShown: false, // separate from main chain — first combat tip
  qmDismissed: false,     // QM was dismissed (skip) vs. departed (complete)
}
```

### Files Impacted

#### 1. `engine_core.js` — L2: Add to `initialState`

Add the `onboarding` object to `window.E.initialState`. Default: `enabled: false, completed: true` (so existing code without onboarding works). The `START_GAME` reducer overrides this based on player choice.

#### 2. `engine_core.js` — Action constants (near L16)

Add new action constants:

```javascript
ONBOARDING_ADVANCE: "ONBOARDING_ADVANCE",
ONBOARDING_SKIP: "ONBOARDING_SKIP",
ONBOARDING_COMPLETE: "ONBOARDING_COMPLETE",
```

#### 3. `logic.js` — Add `isFeatureUnlocked()` function

```javascript
const isFeatureUnlocked = (state, feature) => {
  if (!state.onboarding || !state.onboarding.enabled || state.onboarding.completed) return true;
  const s = state.onboarding.stepsCompleted;
  switch (feature) {
    case 'contracts': return true; // always available
    case 'market': return s.firstContractAccepted; // after accepting first contract
    case 'navigation': return s.provisionsAndGoodsBought; // after buying goods + provisions
    case 'crew': return s.firstContractDelivered; // after delivering first contract
    case 'shipyard': return s.tutorialHuntCompleted; // after winning tutorial hunt
    case 'journal': return s.shipRepaired; // after repairing at shipyard
    default: return true;
  }
};
```

Export via `window.L.isFeatureUnlocked = isFeatureUnlocked;`

#### 4. `engine_core.js` or `storage.js` — Migration for existing saves

In `migrateState()` (or wherever save migration happens), add:

```javascript
if (!s.onboarding) {
  s.onboarding = {
    enabled: false,
    completed: true,
    currentStep: 9,
    stepsCompleted: {
      contractsOpened: true, firstContractAccepted: true,
      marketOpened: true, provisionsAndGoodsBought: true,
      mapOpened: true, firstVoyageStarted: true,
      firstArrival: true, firstContractDelivered: true,
      crewOpened: true, firstCrewHired: true,
      tutorialHuntAccepted: true, tutorialHuntCompleted: true,
      shipyardOpened: true, shipRepaired: true,
      journalOpened: true,
    },
    combatHintShown: true,
    qmDismissed: false,
  };
}
if (!s.captainName) {
  s.captainName = "Captain";
}
```

### Dependencies

None — pure state shape. Must be done before T4, T7, T8, T10, T11.

---

## 6. T3 — Quartermaster as Crew Member --> DONE

### Overview

The QM is a real crew member injected at game start with a "protected" tag that prevents removal by any game system. One handcrafted name per faction. The QM participates in combat and counts toward crew size.

### QM Names (Handcrafted)

| Faction | First Name | Last Name | Flavour |
|---------|-----------|-----------|---------|
| English | Old | Morley | Weathered English bosun |
| Spanish | Viejo | Cortés | Grizzled Spanish veteran |
| French | Vieux | Deschamps | Seasoned French mariner |
| Dutch | Oude | Bakker | Practical Dutch quartermaster |
| Pirate | Scarred | Jim | No-nonsense pirate hand |

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Combat participation | Yes, counts as crew | Simplest; +1 crew is marginal; narratively "helping" |
| Protected from all removal | Yes, via "protected" tag | One tag, checked in one function, covers all paths |
| Dismiss from crew screen | Triggers onboarding skip confirmation | QM's presence IS the tutorial; removing him IS ending it |
| Departure on complete | QM leaves crew with narrative farewell | Crew count decreases by 1; clean exit |
| Fireable? | No — dismiss button hidden or triggers skip | See above |
| Killable? | No — protected tag in `removeRandomCrew` | See below |

### Complexity: Medium

### Files Impacted

#### 1. `logic.js` — L389: Modify `removeRandomCrew()`

This is the single choke point for all random crew removal. Modifying it covers broadside losses, grapple failures, NPC grapple, storms, mutiny, desertion, and all random events.

```javascript
const removeRandomCrew = (roster, count) => {
  if (count <= 0) return { newRoster: [...roster], removed: [] };
  // Protected crew can NEVER be randomly removed
  const eligible = roster.filter(m => !(m.tags || []).includes("protected"));
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  const removed = shuffled.slice(0, Math.min(count, shuffled.length));
  const removedIds = new Set(removed.map(m => m.id));
  const newRoster = roster.filter(m => !removedIds.has(m.id));
  return { newRoster, removed };
};
```

### Crew Removal Paths — Complete Audit

| Removal Path | File & Line | Mechanism | Protected by `removeRandomCrew`? |
|--------------|-------------|-----------|-------------------------------------|
| Broadside crew loss | `engine_combat.js` L72–119 | `crewLoss` → `L.removeRandomCrew` | Yes |
| Player grapple failure | `logic.js` (grapple calc) → `L.removeRandomCrew` | | Yes |
| NPC grapple success | `logic.js` (grapple calc) → `L.removeRandomCrew` | | Yes |
| Storm event | `data.js` L753+ (`RANDOM_EVENTS`) | `crewLoss` → engine → `L.removeRandomCrew` | Yes |
| Mutiny event | `data.js` (`RANDOM_EVENTS`) | `crewLoss` → engine → `L.removeRandomCrew` | Yes |
| Desertion (low morale) | `engine_port.js` L389+ | Custom loop | Needs guard |
| Dismiss/fire crew | `engine_port.js` L560 | Direct removal by ID | Needs guard |

#### 2. `engine_port.js` — L389+: `processDesertion()` guard

Add protection in the desertion loop:

```javascript
// Inside the desertion iteration:
if (L.hasTag(member, "protected")) {
  newRoster.push(member);
  continue; // QM never deserts
}
```

#### 3. `engine_port.js` — L560: `DISMISS_CREW` reducer guard

```javascript
case A.DISMISS_CREW: {
  const member = state.crew.roster.find(m => m.id === action.memberId);
  if (!member) return state;

  // QM dismissal = skip onboarding (handled by UI confirmation → ONBOARDING_SKIP)
  if (L.hasTag(member, "quartermaster") && state.onboarding?.enabled && !state.onboarding?.completed) {
    return state; // Block direct dismissal — UI should show skip confirmation instead
  }

  // ... rest of existing dismiss logic unchanged
}
```

#### 4. `engine_port.js` — L199: `START_GAME` — inject QM

When `onboardingEnabled === true`:

```javascript
const qmData = D.STARTS.factionQM[action.faction];
const quartermaster = {
  id: "qm_tutorial",
  firstName: qmData.firstName,
  lastName: qmData.lastName,
  role: "quartermaster",
  faction: action.faction,
  daysAboard: 0,
  tags: ["quartermaster", "protected"],
  bio: "Your quartermaster. Knows these waters better than most — and has the scars to prove it.",
};
newState.crew.roster = [quartermaster];
```

When `onboardingEnabled === false`:

```javascript
newState.crew.roster = []; // Empty crew, player hires on their own
```

#### 5. `screens_crew.jsx` — L34/L153/L159: Hide dismiss for protected crew

```javascript
{!L.hasTag(member, "protected") ? (
  // normal dismiss button
) : (
  // Show "Skip Tutorial?" button instead (only during onboarding)
  state.onboarding?.enabled && !state.onboarding?.completed && (
    // skip tutorial button
  )
)}
```

### Dependencies

- **T1** (new game screen) — QM injection happens in `START_GAME`
- **T2** (onboarding state) — QM dismiss triggers `ONBOARDING_SKIP`

---

## 7. T4 — Progressive Feature Unlocking (UI Gating)

### Overview

Port screen buttons (Contracts, Market, Crew, Shipyard, Navigation, Journal) are conditionally rendered based on `L.isFeatureUnlocked()`. During onboarding, only unlocked buttons appear. Newly unlocked buttons get a subtle pulse/glow animation.

### Complexity: Medium

### Files Impacted

#### 1. `screens_port.jsx` — L144+: `PortScreen` component

Wrap each navigation button in an unlock check:

```javascript
const PortScreen = ({ state, dispatch }) => {
  // Helper: check if a feature was JUST unlocked (for pulse animation)
  const justUnlocked = (feature) => {
    // Logic: feature is unlocked AND the step that unlocked it was completed
    // within the current port visit (could track via a "newlyUnlocked" set in state)
    return false; // Placeholder — refine in implementation
  };

  return (
    // ... button rendering with unlock checks
  );
};
```

#### 2. `ui.jsx` — Add CSS for `.btn-pulse` animation

```css
.btn-pulse {
  animation: btnPulse 1.5s ease-in-out 3; /* pulse 3 times, then stop */
}
@keyframes btnPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
  50% { box-shadow: 0 0 12px 4px rgba(255, 215, 0, 0.6); }
}
```

#### 3. Onboarding step advancement triggers

Each relevant reducer/screen must dispatch `ONBOARDING_ADVANCE` when the player completes a step. These dispatches are added in the engine reducers, not the UI:

| Step Flag | Where to Advance | Trigger |
|-----------|-------------------|---------|
| `contractsOpened` | Screen navigation to missions | Player clicks Contracts button |
| `firstContractAccepted` | `engine_port.js` `ACCEPT_MISSION` | Player accepts a mission |
| `marketOpened` | Screen navigation to market | Player clicks Market button |
| `provisionsAndGoodsBought` | `engine_port.js` `BUY_GOODS` | Player has provisions + contract goods |
| `mapOpened` | Screen navigation to map | Player clicks Set Sail |
| `firstVoyageStarted` | `engine_voyage.js` `SET_SAIL` | Player begins sailing |
| `firstArrival` | `engine_port.js` `ENTER_PORT` | Player arrives at a port (not starting port) |
| `firstContractDelivered` | `engine_port.js` `COMPLETE_MISSION` L636 | Player delivers contract goods |
| `crewOpened` | Screen navigation to crew | Player clicks Crew button |
| `firstCrewHired` | `engine_port.js` `HIRE_CREW` L545 | Player hires at least 1 crew |
| `tutorialHuntAccepted` | `engine_port.js` `ACCEPT_MISSION` | Player accepts tutorial hunt |
| `tutorialHuntCompleted` | `engine_combat.js` victory resolution | Player wins tutorial hunt |
| `shipyardOpened` | Screen navigation to shipyard | Player clicks Shipyard button |
| `shipRepaired` | `engine_port.js` `REPAIR_SHIP` | Player repairs hull |
| `journalOpened` | Screen navigation to journal | Player clicks Journal button |

### Dependencies

- **T2** (onboarding state) — `isFeatureUnlocked` reads from onboarding state

---

## 8. T5 — Tutorial Delivery Mission --> DONE

### Overview

The first mission is a pre-seeded short-distance delivery to a nearby port. It's auto-accepted at game start and provides the narrative motivation for visiting the Market and Navigation screens.

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Mission type | Delivery (trade) | Simplest loop; teaches Market → Sail → Deliver |
| Goods | Guaranteed available via force-stock | Player must not arrive at market and find goods missing |
| Distance | Within dinghy range (maxDays: 5) | All routes verified ≤ 4 days at speed 6 |
| Goods type | Never food/water | Avoids confusion with provisions |
| Gold reward | Per-faction, 200–280g range | Tuned for Cutter progression (see T12) |

### Goods Availability Analysis

`GOODS_AVAILABILITY` (L607 in `data.js`) defines per-port availability tiers:

| Tier | Meaning |
|------|---------|
| `"always"` | 100% spawn — guaranteed |
| `"frequently"` | High chance but not 100% |
| `"sometimes"` | Moderate chance |
| `"rarely"` / `"never"` | Unreliable / impossible |

**Problem**: No starting port has an `"always"`-available non-food/water legal trade good. Best is `"frequently"`.

**Solution**: Force-stock the tutorial good in the market generator when onboarding is active.

### Force-Stock Mechanism

In `generators.js` (market generation) or `engine_port.js` (`ENTER_PORT` reducer), after normal market generation:

```javascript
// Force-stock tutorial goods during onboarding
if (state.onboarding?.enabled && !state.onboarding?.completed && state.activeMission?.tutorial) {
  const requiredGood = state.activeMission.requiredGood;
  if (requiredGood && !market.goods[requiredGood]) {
    const res = D.RESOURCES[requiredGood]; // L587 in data.js
    market.goods[requiredGood] = {
      buyFromPort: Math.round(res.basePrice * (1 + (Math.random() * 0.1 - 0.05))),
      sellToPort: Math.round(res.basePrice * 0.75),
      qty: 20,
    };
  }
}
```

### Per-Faction Routes

| Faction | Start Port | Destination | Good | Qty | Est. Cost | Reward | Distance | Days |
|---------|-----------|-------------|------|-----|-----------|--------|----------|------|
| English | Port Royal | Kingston | rum | 3 | ~90g | 240g | ~31 | 1–2 |
| Spanish | Havana | Santiago de Cuba | sugar | 3 | ~120g | 280g | ~108 | 3–4 |
| French | Petit-Goâve | Port-de-Paix | sugar | 3 | ~120g | 220g | ~27 | 1–2 |
| Dutch | Santo Domingo | Petit-Goâve | cloth | 2 | ~110g | 250g | ~55 | 2–3 |
| Pirate | Santiago de Cuba | Tortuga | rum | 3 | ~90g | 200g | ~71 | 2–3 |

All routes are within the fame < 10 curated port list (`generators.js` L578) and within dinghy range (maxDays: 5).

### Dinghy Feasibility Check

Dinghy stats (`data.js` L293): `maxHull: 30, maxCrew: 5, cannons: 2, speed: 6, maxDays: 5`.

| Route | Approx. Distance | Est. Days (speed 6) | Within limit? |
|-------|-------------------|----------------------|----------------|
| Port Royal → Kingston | ~31 | 1–2 | Easy |
| Havana → Santiago de Cuba | ~108 | 3–4 | Tight but doable |
| Petit-Goâve → Port-de-Paix | ~27 | 1–2 | Very easy |
| Santo Domingo → Petit-Goâve | ~55 | 2–3 | Comfortable |
| Santiago de Cuba → Tortuga | ~71 | 2–3 | Comfortable |

### Tutorial Delivery Data Structure

Add to `data.js`:

```javascript
const TUTORIAL_DELIVERY = {
  english: {
    targetPort: "kingston",
    requiredGood: "rum",
    requiredQty: 3,
    gold: 240,
    fame: 2,
    name: "Carry the Dispatch to Kingston",
    description: "An official packet needs to reach Kingston, along with a cask of rum for the harbour office. Buy the rum at the market and deliver it sealed.",
    repImpact: { english: 2 },
    tutorial: true,
  },
  spanish: {
    targetPort: "santiagoDeCuba",
    requiredGood: "sugar",
    requiredQty: 3,
    gold: 280,
    fame: 2,
    name: "The Crate for Santiago",
    description: "A consignment of sugar must reach a contact in Santiago de Cuba. Prompt and quiet.",
    repImpact: { spanish: 3 },
    tutorial: true,
  },
  french: {
    targetPort: "portDePaix",
    requiredGood: "sugar",
    requiredQty: 3,
    gold: 220,
    fame: 2,
    name: "Provisions for Port-de-Paix",
    description: "The garrison at Port-de-Paix needs sugar for the officers' mess. A small job — but it pays, and it's close.",
    repImpact: { french: 2 },
    tutorial: true,
  },
  dutch: {
    targetPort: "petitGoave",
    requiredGood: "cloth",
    requiredQty: 2,
    gold: 250,
    fame: 2,
    name: "The Consignment for Petit-Goâve",
    description: "A Dutch factor in Petit-Goâve awaits a delivery of cloth. The manifest is signed. Don't ask questions.",
    repImpact: { dutch: 3 },
    tutorial: true,
  },
  pirate: {
    targetPort: "tortuga",
    requiredGood: "rum",
    requiredQty: 3,
    gold: 200,
    fame: 2,
    name: "Rum for Renard in Tortuga",
    description: "Captain Renard in Tortuga needs rum — and a message. Delivering both is a way to introduce yourself.",
    repImpact: { pirate: 3 },
    tutorial: true,
  },
};
```

### Cost Affordability Check

| Faction | Good | Base Price | Qty | Est. Cost | Starting Gold (490g) | After Purchase |
|---------|------|-----------|-----|-----------|-----------------------|-----------------|
| English | Rum | 30g | 3 | ~90g | 490 | ~400g |
| Spanish | Sugar | 40g | 3 | ~120g | 490 | ~370g |
| French | Sugar | 40g | 3 | ~120g | 490 | ~370g |
| Dutch | Cloth | 55g | 2 | ~110g | 490 | ~380g |
| Pirate | Rum | 30g | 3 | ~90g | 490 | ~400g |

All affordable with ample margin for provisions (~15–25g).

### Complexity: Low–Medium

### Dependencies

- **T1** (new game screen) — determines faction → route
- **T2** (onboarding state) — step tracking

---

## 9. T6 — Tutorial Hunt Mission (Combat Introduction)

### Overview

After the player hires their first crew member (step 6), a tutorial hunt mission appears in the Contracts board. This is a low-risk combat mission against a handcrafted tier 0 enemy that guarantees:

1. The player experiences the combat system
2. The player takes hull damage (motivating the Shipyard visit)
3. The player cannot flee — must engage

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Enemy | Handcrafted "The Rat" | Within tier 0 range but precisely tuned for dinghy fight |
| Flee | Blocked entirely | Guarantees combat experience; button hidden for tutorial missions |
| Hull damage | Guaranteed minimum 8–12 | If player somehow takes 0 damage, force minimum (narrative: "lucky shot grazed your hull") |
| Reward | 250g | Tuned for Cutter progression (see T12) |
| Appears when | `firstCrewHired === true` | Player has at least +1 crew for combat |

### "The Rat" — Tutorial Enemy

```javascript
const TUTORIAL_HUNT = {
  type: "combat",
  name: "Hunt the Rat",
  description: "A small vessel has been preying on fishing boats near here. Easy pickings — and good coin.",
  faction: "pirate",
  risk: "low",
  gold: 250,
  fame: 3,
  infamyGain: 0,
  repImpact: {},
  tutorial: true,
  enemy: {
    name: "The Rat",
    faction: "pirate",
    hull: 15,
    maxHull: 15,
    cannons: 2,
    crew: 4,
    maxCrew: 4,
    speed: 5,
  },
};
```

### Combat Math Verification

**Player** (dinghy + QM + 1 hired crew = 3 crew total, 2 cannons):

- Player broadside damage: 2 × (0.8–1.2) × 0.6 ≈ 1.0–1.4 hull/round
- Rounds to kill The Rat (15 hull): ~11–15 rounds

**The Rat** (2 cannons, 4 crew):

- Rat broadside damage: 2 × (0.7–1.0) × 0.6 ≈ 0.8–1.2 hull/round
- Player hull depleted (30 hull) in: ~25–37 rounds

**Result**: Player wins comfortably with ~15–20 hull remaining. Takes ~10–15 damage.

### Flee Button Blocking

In `screens_voyage.jsx` — L487/L525 (flee action) and L561 (Flee button):

```javascript
{/* Hide Flee button for tutorial missions */}
{!(state.activeMission?.tutorial) && (
  // Flee button
)}
```

### Guaranteed Minimum Damage

In the combat victory resolution path (in `engine_combat.js`), after combat ends:

```javascript
// Ensure tutorial missions always result in some hull damage
if (state.activeMission?.tutorial && state.ship.hull >= state.ship.maxHull - 5) {
  const forcedDamage = 8 + Math.floor(Math.random() * 5); // 8–12 damage
  newState.ship.hull = Math.max(1, newState.ship.hull - forcedDamage);
  newState.log.push("A lucky shot grazed the hull during the fight. We'll need repairs.");
}
```

### Complexity: Medium

### Files Impacted

- `data.js` — Add `TUTORIAL_HUNT` constant
- `engine_port.js` — Inject hunt mission into contracts when `firstCrewHired` is true
- `engine_combat.js` — Guaranteed damage on tutorial victory
- `screens_voyage.jsx` — L487/L525/L561: Hide flee button for tutorial missions

### Dependencies

- **T0** (fame rescaling) — enemy stats within tier 0 range
- **T2** (onboarding state) — step tracking
- **T3** (QM crew member) — player has QM + 1 hired = 3 crew for combat

---

## 10. T7 — Random Event Protection During Onboarding

### Overview

During onboarding, block random voyage events that could confuse or kill a new player in a dinghy. Mission encounters still fire (needed for the tutorial hunt combat encounter).

### Complexity: Low

### Implementation

One guard block in `engine_voyage.js`, in the `ADVANCE_DAY` reducer (L226), wrapping the event interception chain (~L287–296):

```javascript
const isOnboarding = state.onboarding?.enabled && !state.onboarding?.completed;

// ── Event interception chain ────────────────────────
// Skip random events during onboarding (protect new player)
if (!isOnboarding) {
  // Smuggle patrol check (~L287)
  const smuggleResult = maybeSmugglePatrol(state, ...);
  if (smuggleResult) return { ...baseState, ...smuggleResult };

  // Random event check (~L290)
  const eventResult = maybeRandomEvent(state, ...);
  if (eventResult) return { ...baseState, ...eventResult };

  // Random patrol check (~L181)
  const patrolResult = checkRandomPatrol(state, ...);
  if (patrolResult) return { ...baseState, ...patrolResult };

  // Drunkard event
  const drunkardResult = maybeDrunkardEvent(state, ...);
  if (drunkardResult) return { ...baseState, ...drunkardResult };
}

// Mission encounters ALWAYS fire (tutorial hunt needs this) (~L296)
const missionEncResult = maybeMissionEncounter(state, ...);
if (missionEncResult) return { ...baseState, ...missionEncResult };
```

### What's Protected vs. What's Allowed

| Event Type | During Onboarding | Why |
|------------|---------------------|-----|
| Random events (storm, doldrums, wreck, whales) | Blocked | Could kill or strand player in dinghy |
| Random patrols (faction inspection) | Blocked | Player can't handle inspection mechanics yet |
| Smuggle intercepts | Blocked | Player won't have smuggle missions during tutorial |
| Drunkard rum theft | Blocked | Confusing side-mechanic too early |
| Mission encounters (escort/patrol/combat) | Allowed | Tutorial hunt mission needs its combat encounter |
| Hidden port discovery | Allowed | Harmless; fame < 10 means nothing unlocks anyway |
| Provision consumption | Allowed | Core learning mechanic — this IS the tutorial |
| Wind changes | Allowed | Cosmetic, doesn't disrupt flow |

### Tutorial-Skippers

When `onboarding.enabled === false`, the `isOnboarding` flag is false, so all events fire normally from the start. Tutorial-skippers get the full unprotected experience — including the risk.

### Architectural Note

The guard is placed at the call site (`engine_voyage.js`) rather than inside the probability functions themselves (e.g., `maybeRandomPatrol` in `logic.js` L456). This keeps the probability functions pure calculators and puts the "should we even roll?" decision in the engine layer — consistent with the architecture's separation of concerns.

### Dependencies

- **T2** (onboarding state) — reads `onboarding.enabled` and `onboarding.completed`

---

## 11. T8 — QM Popup Component & Dialogue

### Overview

A new toast-style UI component for Quartermaster dialogue. Not a modal — it sits at the bottom of the screen and doesn't block interaction. Every popup includes a dismiss button and a "skip onboarding" link.

### Complexity: Medium

### QMPopup Component

New file `ui_onboarding.jsx` (or add to `ui.jsx`):

```javascript
const QMPopup = ({ qmName, message, onDismiss, onSkipOnboarding }) => {
  if (!message) return null;
  return React.createElement('div', { className: 'qm-popup' },
    React.createElement('div', { className: 'qm-portrait' }, '⚓'),
    React.createElement('div', { className: 'qm-content' },
      React.createElement('div', { className: 'qm-name' }, qmName),
      React.createElement('div', { className: 'qm-text' }, message)
    ),
    React.createElement('div', { className: 'qm-actions' },
      React.createElement('button', { onClick: onDismiss, className: 'qm-ok' }, 'OK'),
      React.createElement('a', {
        onClick: onSkipOnboarding,
        className: 'qm-skip'
      }, "I'll take it from here")
    )
  );
};
```

### CSS (add to `ui.jsx` styles or `index.html`)

```css
.qm-popup {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border: 1px solid #d4a574;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 600px;
  width: 90%;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  animation: qmSlideIn 0.3s ease-out;
}
@keyframes qmSlideIn {
  from { transform: translateX(-50%) translateY(100%); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}
.qm-portrait { font-size: 2em; }
.qm-name { color: #d4a574; font-weight: bold; font-size: 0.85em; }
.qm-text { color: #e0d5c1; font-style: italic; margin-top: 4px; }
.qm-actions { display: flex; flex-direction: column; gap: 4px; margin-left: auto; }
.qm-ok { padding: 4px 12px; cursor: pointer; }
.qm-skip { font-size: 0.75em; color: #888; cursor: pointer; text-decoration: underline; }
.qm-skip:hover { color: #d4a574; }
```

### Full QM Dialogue Data

Add to `data_text.js` or `data.js`:

```javascript
const QM_DIALOGUE = {
  // ── Step 0: Welcome ──────────────────────────────────
  step0_welcome: (portName) =>
    `Welcome to ${portName}, Captain. We've a ship, a handful of coin, and not much else. Let's see what work there is. Check the Contracts Board.`,

  // ── Step 1: First contract ───────────────────────────
  step1_contractsOpen: () =>
    `Here's the work board. I picked an easy run. something short, something close. Good way to earn our first coin.`,
  step1_accepted: () =>
    `Right. We'll need to pick up the cargo and stock provisions. Let's head to the Market.`,

  // ── Step 2: Market ───────────────────────────────────
  step2_marketOpen: () =>
    `Buy what we need for our contract, and don't forget provisions: the crew's gotta eat. Running dry at sea is... unpleasant.`,
  step2_stocked: () =>
    `Cargo loaded, bellies will be full. Time to chart a course, Captain. Let's look at the Map.`,

  // ── Step 3: Navigation ───────────────────────────────
  step3_mapOpen: (destName) =>
    `${destName} — just a few days' sail. Select it and we'll weigh anchor.`,

  // ── Step 4: Sailing ──────────────────────────────────
  step4_sailing: () =>
    `Smooth seas so far. Watch our provisions: each day at sea costs food and water. If we spot trouble, I'll let you know.`,

  // ── Step 5: Arrival & delivery ───────────────────────
  step5_arrival: () =>
    `We've made port. Head to the Market to deliver our cargo and collect the pay.`,
  step5_delivered: () =>
    `Well done, Captain. Coin in our pockets and a name on the docks. Might be worth checking the Crew quarters — we could use more hands.`,

  // ── Step 6: Crew ─────────────────────────────────────
  step6_crewOpen: () =>
    `Here's our lot. You can hire more hands here. Each one's got different skills. More crew means we can handle tougher seas... and tougher fights.`,
  step6_hired: () =>
    `Good, we've got hands now. There's a bounty posted: A small vessel preying on fishing boats near here. Check the Contracts Board, I've marked the one.`,

  // ── Step 6b: Tutorial hunt ───────────────────────────
  step6b_huntAccepted: () =>
    `Easy pickings. Let's set sail and find this rat.`,
  step6b_combatStart: () =>
    `Enemy sails! Battle stations, Captain. Aim for their hull to sink them.`,
  step6b_victory: () =>
    `Well fought! She's got some holes in her now, though. Let's find a Shipyard before they get worse.`,

  // ── Step 7: Shipyard ─────────────────────────────────
  step7_shipyardOpen: () =>
    `Repairs, upgrades, or a new ship when we've saved enough. A Cutter would serve us well:  faster, tougher, more hold space. About 1,000 gold. A few more jobs and we're there.`,
  step7_repaired: () =>
    `Good as new! Well, good enough. I've been keeping a record of our voyages. Your Journal might be worth a look.`,

  // ── Step 8: Journal ──────────────────────────────────
  step8_journalOpen: () =>
    `Everything's written down here — every port, every fight, every deal. The log saves itself each time we make port. If you ever want to take your story elsewhere, or keep a copy safe, you can export it from here.`,

  // ── Step 9: Completion ───────────────────────────────
  step9_complete: (qmName) =>
    `I'd say you've got your sea legs now, Captain. The Caribbean's a big place, plenty more where that came from. You don't need me anymore. `,
  step9_departure: (qmName) =>
    `${qmName} tips his hat. "Fair winds, Captain." He takes a jolly boat ashore.`,

  // ── Combat hint (one-time, outside main chain) ──────
  combatHint: () =>
    `Enemy sails! Battle stations, Captain. Aim for their hull if you want them sunk, try to grapple if you want to plunder, or escape to live another day.`,
};
```

### Which Screens Show Which Messages

| Screen | QM Messages | Trigger |
|--------|-------------|---------|
| `screens_port.jsx` | `step0_welcome`, `step5_delivered`, `step6_hired`, `step6b_victory`, `step7_repaired` | On screen mount / after action |
| `screens_port.jsx` (missions sub) | `step1_contractsOpen`, `step1_accepted`, `step6b_huntAccepted` | On open / accept |
| `screens_market.jsx` | `step2_marketOpen`, `step2_stocked`, `step5_arrival` | On open / after purchase |
| `screens_voyage.jsx` (map) | `step3_mapOpen` | On map open |
| `screens_voyage.jsx` (sailing) | `step4_sailing` | On sailing start |
| `screens_voyage.jsx` (combat) | `step6b_combatStart` | On combat start |
| `screens_crew.jsx` | `step6_crewOpen` | On crew screen open |
| `screens_shipyard.jsx` | `step7_shipyardOpen` | On shipyard open |
| Journal screen | `step8_journalOpen` | On journal open |

### Dependencies

- **T2** (onboarding state) — determines which message to show
- **T3** (QM crew member) — provides QM name for the popup

---

## 12. T9 — Journal Screen Unlock & Auto-Save Messaging

### Overview

The Journal button appears after the player repairs at the Shipyard (step 8). Opening it triggers the final QM dialogue about auto-save and export.

### Complexity: Low

### Implementation

1. **Button gating**: Already handled by `L.isFeatureUnlocked(state, 'journal')` (from T4). Journal button appears when `stepsCompleted.shipRepaired === true`.
2. **QM message**: `step8_journalOpen` communicates:
   - Journal = memory of your run
   - Auto-save at each port entry
   - Export for safeguarding / portability
3. **Step advancement**: When journal screen opens and `stepsCompleted.journalOpened === false`, dispatch `ONBOARDING_ADVANCE` with `journalOpened: true`. This triggers onboarding completion (T10).

### `captainName` in Save Naming

Per OQ5 resolution, the save name format becomes: `{captainName}_{faction}_{totalDays}`

Update `storage.js` (L9+) to use this format:

```javascript
const saveName = `${state.captainName}_${state.faction}_${state.day}d`;
```

### Files Impacted

- `screens_port.jsx` — Journal button already gated (T4)
- Journal screen component — Add QM popup trigger
- `storage.js` — Update save naming convention

### Dependencies

- **T4** (UI gating)
- **T8** (QM popup)

---

## 13. T10 — Onboarding Completion & QM Departure

### Overview

When the player opens the Journal (step 9), onboarding is marked complete. The QM delivers a farewell message, then leaves the crew (roster count decreases by 1). A log entry records the departure.

### Complexity: Medium

### `ONBOARDING_COMPLETE` Reducer

Add to engine reducers (in `engine_core.js` or a new `engine_onboarding.js`):

```javascript
case A.ONBOARDING_COMPLETE: {
  const qmIdx = state.crew.roster.findIndex(m =>
    (m.tags || []).includes("quartermaster")
  );
  const qmName = qmIdx >= 0
    ? `${state.crew.roster[qmIdx].firstName} ${state.crew.roster[qmIdx].lastName}`
    : "Your quartermaster";

  const newRoster = state.crew.roster.filter(m =>
    !(m.tags || []).includes("quartermaster")
  );

  return {
    ...state,
    onboarding: {
      ...state.onboarding,
      enabled: false,
      completed: true,
      currentStep: 9,
    },
    crew: {
      ...state.crew,
      roster: newRoster,
    },
    log: [
      ...state.log,
      `${qmName} tips his hat. "You've got your sea legs now, Captain. Fair winds." He takes a jolly boat ashore.`,
    ],
  };
}
```

### Trigger

Dispatched when `stepsCompleted.journalOpened` is set to `true` (the final step). The QM popup shows `step9_complete`, player clicks OK, then `ONBOARDING_COMPLETE` fires.

### Files Impacted

- `engine_core.js` (or new `engine_onboarding.js`) — New reducer
- `engine_core.js` — New action constant `ONBOARDING_COMPLETE`

### Dependencies

- **T2** (onboarding state)
- **T3** (QM crew member — removal from roster)
- **T8** (QM popup — farewell message)

---

## 14. T11 — Skip / Exit Mechanism (3 Layers)

### Overview

Three ways to skip the onboarding, all converging on the same `ONBOARDING_SKIP` action. Skipping immediately unlocks all features and removes the QM.

### Layer 1: At Game Creation

On the New Game screen (T1):

```
☐ Enable guided first voyage (recommended for new players)
```

- Default: checked
- If unchecked: `onboardingEnabled: false` → no QM injected, crew starts at 0, no starter mission, all features visible from start

### Layer 2: At Any QM Popup

Every `<QMPopup>` includes a small, non-intrusive link:

```
[I'll take it from here]
```

Clicking shows confirmation:

> "Sure thing, Captain. You know where to find me." **[Yes, skip tutorial]** → dispatches `ONBOARDING_SKIP` · **[Never mind]** → cancel

### Layer 3: Dismissing the QM from Crew Screen

If the player tries to dismiss the QM crew member from `screens_crew.jsx`:

> "Are you sure? Dismissing {QM name} will end the guided voyage — all features will be unlocked immediately." **[Yes, I'll manage]** → dispatches `ONBOARDING_SKIP` · **[Never mind]** → cancel

### `ONBOARDING_SKIP` Reducer

```javascript
case A.ONBOARDING_SKIP: {
  // Remove QM from roster
  const newRoster = state.crew.roster.filter(m =>
    !(m.tags || []).includes("quartermaster")
  );

  // Mark all steps as complete
  const allStepsComplete = Object.fromEntries(
    Object.keys(state.onboarding.stepsCompleted).map(k => [k, true])
  );

  return {
    ...state,
    onboarding: {
      enabled: false,
      completed: true,
      currentStep: 9,
      stepsCompleted: allStepsComplete,
      combatHintShown: true,
      qmDismissed: true,
    },
    crew: {
      ...state.crew,
      roster: newRoster,
    },
    log: [
      ...state.log,
      "You've decided to go it alone. All features are now available.",
    ],
  };
}
```

### Complexity: Low

### Files Impacted

- `engine_core.js` — `ONBOARDING_SKIP` reducer + action constant
- `ui_onboarding.jsx` — Skip link in `QMPopup` component
- `screens_crew.jsx` — Skip confirmation on QM dismiss attempt

### Dependencies

- **T2** (onboarding state)
- **T3** (QM crew member)
- **T8** (QM popup — skip link)

---

## 15. T12 — Economy Tuning & Balance Verification

### Overview

Ensure the tutorial economy nets the player ~80–85% of a Cutter (1,000g), creating a clear post-tutorial goal: "one more mission and I can upgrade."

### Cutter Cost Reference

`data.js` L301: Cutter — `cost: 1000, requiredFame: 0`

### Gold Flow Trace (English Path as Reference)

| Moment | Gold In | Gold Out | Running Total |
|--------|---------|----------|-----------------|
| Game start | 490 | — | 490g |
| Buy 3 rum (~30g each) | — | ~90g | 400g |
| Buy provisions top-up (food+water) | — | ~20g | 380g |
| Sail to Kingston → deliver | +240g | — | 620g |
| Hire 1 crew member | — | ~50g | 570g |
| Buy provisions for hunt voyage | — | ~15g | 555g |
| Hunt "The Rat" → reward | +250g | — | 805g |
| Plunder from The Rat (tier 0 low) | +15g | — | 820g |
| Repair hull (~10 dmg × 2g) | — | ~20g | 800g |
| **End of tutorial** | | | **~800g** |

**Gap to Cutter**: ~200g

One more low-risk tier 0 mission (75–120g reward) won't quite cover it. One medium-risk mission (120–160g) will. This is intentional — the player needs 1–2 independent missions post-tutorial, which is the perfect "I'm on my own now" moment.

### Per-Faction Variance

| Faction | Delivery Reward | Good Cost | Net After Tutorial | Gap to Cutter |
|---------|--------------------|-----------|----------------------|-----------------|
| English | 240g | ~90g (rum) | ~800g | ~200g |
| Spanish | 280g | ~120g (sugar) | ~810g | ~190g |
| French | 220g | ~120g (sugar) | ~750g | ~250g |
| Dutch | 250g | ~110g (cloth) | ~790g | ~210g |
| Pirate | 200g | ~90g (rum) | ~760g | ~240g |

French and Pirate paths are slightly behind. This is acceptable — the variance is within one mission's range. If desired, bump French to 240g and Pirate to 220g to narrow the gap.

### Tuning Levers (if needed)

| Lever | Current | Range | Effect |
|-------|---------|-------|--------|
| Starting gold | 490g | 450–550g | ±50g end balance |
| Delivery reward | 200–280g | 180–300g | Direct ±g |
| Hunt reward | 250g | 200–300g | Direct ±g |
| Tier 0 plunder | 15g | 10–25g | Minor |
| Crew hire cost | ~50g | 30–80g | Inverse |

### QM Cutter Hint

After shipyard repair (step 7), QM says:

> "A Cutter would serve us well — faster, tougher, more hold space. About 1,000 gold. A few more jobs and we're there."

This plants the seed for the player's first self-directed goal.

### Complexity: Low (data tuning only, no logic changes)

### Dependencies

- **T0** (tier 0 data)
- **T5** (delivery reward values)
- **T6** (hunt reward value)

---

## 16. Resolved Design Questions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| OQ1 | Does QM participate in combat? | Yes, counts as crew | Simplest; +1 is marginal; narratively "helping" |
| OQ2 | What if player skips at game start? | Crew = 0, no starter mission, full sandbox | Respects experienced players; clean separation |
| OQ3 | Can player flee tutorial hunt? | No — Flee button hidden for `tutorial: true` missions | Guarantees combat experience; one-line check in `screens_voyage.jsx` |
| OQ4 | Post-tutorial QM reappearance? | Deferred to Phase 2 | Nice-to-have, not MVP |
| OQ5 | Where is `captainName` stored? | New field in state + used in save naming (`{name}_{faction}_{days}`) | Natural location; useful for Journal and exports |
| OQ6 | Existing save compatibility? | Migration: `onboarding.enabled=false`, `completed=true` | Treats existing saves as veteran players |
| OQ7 | Debug scenario preservation? | Removed entirely — use debug tool menu | Cleaner; debug menu can set sloop/gold/crew/fame directly |
| OQ8 | Settings toggle to re-enable? | Deferred | Low priority; skip is permanent per run |

---

## 17. Implementation Sequence & Phasing

### Phase 1 — Foundation (no visible changes)

| Order | Task | What | Est. Effort |
|-------|------|------|---------------|
| 1.1 | T0 | Fame tier rescaling | 1–2h |
| 1.2 | T2 | Onboarding state system | 30min |

**Deliverable**: Game runs identically to before, but with new tier 0 data and onboarding state in `initialState`. Existing saves migrate cleanly.

### Phase 2 — Core Mechanics (invisible to player)

| Order | Task | What | Est. Effort |
|-------|------|------|---------------|
| 2.1 | T3 | QM crew member + protected tag | 1–2h |
| 2.2 | T7 | Random event protection | 15min |
| 2.3 | T5 | Tutorial delivery mission data | 1h |
| 2.4 | T6 | Tutorial hunt mission data + flee block | 1–2h |

**Deliverable**: All onboarding mechanics work in the engine. No UI changes yet — you can test by manually dispatching actions.

### Phase 3 — UI & Screens

| Order | Task | What | Est. Effort |
|-------|------|------|---------------|
| 3.1 | T1 | New game screen | 2–3h |
| 3.2 | T4 | Progressive feature unlocking | 1–2h |
| 3.3 | T8 | QM popup component + dialogue | 2–3h |

**Deliverable**: Full onboarding UI is functional. Player can go through the entire tutorial flow.

### Phase 4 — Completion Flow

| Order | Task | What | Est. Effort |
|-------|------|------|---------------|
| 4.1 | T9 | Journal screen unlock | 30min |
| 4.2 | T10 | Onboarding completion + QM departure | 1h |
| 4.3 | T11 | Skip / exit mechanism (3 layers) | 1h |

**Deliverable**: Tutorial has a clean ending. Skip works at all three layers.

### Phase 5 — Polish

| Order | Task | What | Est. Effort |
|-------|------|------|---------------|
| 5.1 | T12 | Economy tuning & balance | 1h |
| 5.2 | — | Playtesting full flow (all 5 factions) | 2–3h |
| 5.3 | — | Edge case testing (skip at each step, skip at start, existing save migration) | 1–2h |

**Total estimated effort: ~16–24 hours**

---

## 18. Dependency Graph

```
T0 (Fame Rescale) ─────────────────────────────────────────┐
  │                                                         │
  ├──► T6 (Hunt Mission) ────────────────────────┐         │
  │                                               │         │
  ├──► T12 (Economy Tuning) ◄────────────────────┤         │
  │                                               │         │
T2 (Onboarding State) ────────────────────────┐  │         │
  │                                            │  │         │
  ├──► T3 (QM Crew) ───────────────────────┐  │  │         │
  │       │                                 │  │  │         │
  │       ├──► T1 (New Game Screen) ◄───────┤  │  │         │
  │       │                                 │  │  │         │
  │       ├──► T10 (Onboarding Complete) ◄──┤  │  │         │
  │       │                                 │  │  │         │
  │       └──► T11 (Skip Mechanism) ◄───────┤  │  │         │
  │                                         │  │  │         │
  ├──► T4 (UI Gating) ─────────────────────┤  │  │         │
  │       │                                 │  │  │         │
  │       └──► T9 (Journal Unlock) ◄────────┤  │  │         │
  │                                         │  │  │         │
  ├──► T5 (Delivery Mission) ───────────────┤  │  │         │
  │                                         │  │  │         │
  ├──► T7 (Event Protection) ───────────────┤  │  │         │
  │                                         │  │  │         │
  └──► T8 (QM Popup) ◄──────────────────────┘  │  │         │
          │                                    │  │         │
          ├──► T9 (Journal Unlock) ◄───────────┘  │         │
          ├──► T10 (Onboarding Complete) ◄────────┘         │
          └──► T11 (Skip Mechanism)                         │
                                                             │
T12 (Economy Tuning) ◄───────────────────────────────────────┘
  ◄── T5 (Delivery Mission)
  ◄── T6 (Hunt Mission)
```

### Critical Path

```
T0 → T2 → T3 → T1 → T4 → T8 → T10
```

All other tasks can be parallelised alongside this critical path.

---

## 19. Open / Deferred Items

### Deferred to Phase 2

| Item | Description | Priority |
|------|-------------|----------|
| Post-tutorial QM hints | QM occasionally surfaces tips if player seems stuck (e.g., hasn't visited shipyard in 50 days) | Medium |
| Captain's Log recap | A journal narrative that tracks your first voyage as a story — doubles as reference | Low |
| Contextual re-hints | If tutorial-skipper seems stuck (5+ min idle in port), QM offers: "Need a hand?" | Low |
| Settings toggle | Re-enable onboarding mid-game (resets to current step) | Low |
| Deeper scenario support | Re-introduce branching backstories as Phase 2 enhancement once core onboarding is solid | Low |
| QM personality variants | Different QM dialogue flavour per faction (salty English, formal Spanish, etc.) | Low |

### Potential Edge Cases to Test

| Scenario | Expected Behaviour |
|----------|----------------------|
| Skip at game start (uncheck toggle) | No QM, 0 crew, no starter mission, all buttons visible |
| Skip via QM popup at step 0 | All features unlock, QM removed, log entry |
| Skip via QM dismiss at step 3 (mid-voyage) | Features unlock but player continues current voyage |
| Player sells contract goods instead of delivering | QM should not advance; goods must be re-purchased |
| Player buys provisions but not contract goods | `provisionsAndGoodsBought` should NOT trigger until both conditions met |
| Player arrives at wrong port | `firstArrival` triggers but `firstContractDelivered` does not |
| Player has existing save from before onboarding | Migration sets `completed: true`, no QM, all features visible |
| Player somehow reaches 0 crew during tutorial | QM is protected; cannot reach 0 crew while QM exists |
| Tutorial hunt enemy is fled from | Flee button is hidden — impossible. If somehow triggered via console, mission persists |
| Player repairs 0 damage at shipyard | `shipRepaired` should trigger on any shipyard visit during onboarding (even if no damage to repair) |

---
