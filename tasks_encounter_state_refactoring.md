# tasks_encounter_state_refactoring.md

**Roadmap item:** B1.4 — Implement encounter architecture refactor
**Discovery source:** B1.3 — Discovery: encounter vs activeMission vs battleState
**Status:** Plan approved, implementation pending
**Last updated:** amended for B11 combat rework integration

> **Amendment note**: this document was updated after the B11 combat rework's design
> (`design_combat_rework.md`) and implementation task list (`tasks_combat_rework.md`)
> were finalized. Changes from the original version are marked **[B11 AMENDMENT]**
> inline. The core migration plan and phase structure are unchanged — the amendments
> are additive: two new fields in the target `battle` shape, two scope-clarifying notes
> on existing phases, one integration note on the modifier system, and one new parked
> question. **`tasks_combat_rework.md` depends on this refactor being complete through
> Phase B1.4.8 before it begins — see the note at the end of this document.**

---

## Executive Summary

The current engine entangles three overlapping state concerns — `encounterContext`, `battleState`, and `activeMission` — across multiple reducer files. This refactor consolidates them into a clearer three-concept model:

| Concept | Purpose | Lifecycle |
|---|---|---|
| `notableNPC` | Persistent state for named entities in the world (rivals, head-hunters, story NPCs, allies) | Long-lived; survives across encounters |
| `encounterSession` | The current confrontation being resolved (intercept → battle → plunder) | Short-lived; one per active situation |
| `activeMission` | The long-term goal driving player choices | Unchanged from current behavior |

The migration is broken into 10 small, individually testable phases. Each phase ends in a stable, fully playable game state. Total estimated effort: 6–8 hours of focused work, recommended spread across multiple sessions.

**Why this matters:**
- Enables persistent rivals (the same enemy across multiple encounters, hull state preserved)
- Enables a combat modifier system (ambush, surprise, weather effects, tutorial setup)
- Reduces the cost of adding new encounter types (most additions become data, not code)
- Unblocks downstream roadmap items B9 (softlock detection, already integrates with the existing `battleState`/wash-ashore path), **B11 (combat depth rework — distance, boarding, the full naval/boarding resolution pipeline; see `design_combat_rework.md` and `tasks_combat_rework.md`)**, and world/story-arc items (B19/B20)

**[B11 AMENDMENT]** The combat rework is no longer a hypothetical future consumer of this architecture — it's a fully designed and task-listed piece of work (`design_combat_rework.md`, `tasks_combat_rework.md`) that depends directly on this refactor's `encounterSession.battle` shape. The amendments below reflect exactly what that dependency requires.

---

## Context: The Problem

### Current state-field overlap

Three fields in `state` carry partial information about "the player is currently in some kind of confrontation":

- **`encounterContext`** — populated when the player is on the InterceptScreen (pre-battle decision). Cleared on action.
- **`battleState`** — populated when combat starts. Cleared on DISMISS_BATTLE.
- **`activeMission`** — the accepted mission, which may have its own `enemy` field, `requiredGood`, etc.

The same enemy data can exist in all three places at once during a tutorial hunt fight. They all start identical, but only `battleState.enemyHull` decrements during combat — the others are reference copies.

### Cross-coupling examples

1. **`DISMISS_BATTLE`** has to inspect `battleState.encounterType` AND `activeMission.type` AND `battleState.phase` to determine which post-combat path to take.
2. **`handlePatrolVictory`** specifically checks `encounterType === "mission_combat" && activeMission.type === "patrol"` — a hard coupling between two state fields.
3. **Escort missions** carry a `convoyHull` inside `battleState` that only matters for `encounterType === "escort_defend"`.
4. **Tutorial hunt opening shot** lives as an inline `if (state.activeMission?.tutorial)` check in `INTERCEPT_FIGHT`.

### Practical cost

Adding a new encounter type currently touches 5+ files (data, encounter context builder, intercept handlers, battle action, dismiss battle, encounter flavour). The conceptual addition is small; the surface area is large.

Adding a persistent rival captain is currently impossible without bolting on a separate registry, because neither `encounterContext` nor `battleState` survives session boundaries.

---

## Target Architecture

### Three concepts, three responsibilities

```
              ┌─── activeMission ───┐
              │ (long-term intent)  │
              └──────────┬──────────┘
                         │ source.id, source.kind = "mission"
                         ▼
              ┌─── encounterSession ───┐
              │ (current resolution)   │
              │ phase, enemy, options  │
              └──────┬────────┬────────┘
                     │        │
        notableNPCId │        │ phase: intercept → battle → plunder → null
                     ▼        │
              ┌─── notableNPC ─────────┐
              │ (persistent state)     │
              │ rival, head-hunter,    │
              │ story NPC, ally        │
              └────────────────────────┘
```

### Concept 1: `notableNPC`

A registry of named entities in the world with persistent state. Random patrols and one-off pirates do NOT get registry entries — they are disposable.

```js
state.notableNPCs = {
  "rival_calicojack_42": {
    id: "rival_calicojack_42",
    name: "Calico Jack",
    kind: "rival_captain",          // rival_captain | head_hunter | story_npc | ally | escort_companion
    disposition: "hostile",         // hostile | neutral | friendly | ally
    hull: 87,                         // current hull — damaged from last encounter
    maxHull: 120,
    crew: 15,
    cannons: 18,
    speed: 14,
    shipType: "brigantine",
    faction: "pirate",
    risk: "high",                    // [B11 AMENDMENT] persisted here too, not just on
                                      // the disposable enemy snapshot — see Task B1.4.2 note
    flags: {
      hostile: true,
      hasParleyed: false,
      bountyValue: 5000,             // for head-hunters or rivals worth turning in
      storyArcStage: 0,              // for story NPCs
    },
    history: [
      { day: 12, event: "first_sighting" },
      { day: 23, event: "fled_combat", hullDelta: -33 },
      // [B11 AMENDMENT] new event types the combat rework can now produce:
      // "captured_player_ship" | "was_captured" | "boarding_repelled" — not required
      // for B1.4, but worth knowing the history log should accept these once B11 ships.
    ],
    spawn: {
      preferredRegions: ["east_caribbean"],
      triggerCondition: "player_infamy >= 50",
      lastSeenDay: 23,
      cooldownDays: 7,
    },
  },
  "ally_first_mate_blackwood": { ... },  // future use
};
```

**Lifecycle:** entries are created when the world or a story arc spawns a notable NPC. They persist until explicitly removed (e.g., killed, joined player permanently, story arc ended).

**Read access:** world tick reads to decide spawn behavior; encounter session reads to populate enemy snapshot.

**Write access:** session close writes back persistent changes (hull damage, flags); world tick updates spawn metadata.

### Concept 2: `encounterSession`

The single source of truth for the current confrontation. Replaces both `encounterContext` and `battleState`.

```js
state.encounterSession = {
  // Identity
  type: "navy_patrol",                 // categorical key for options/flavour lookup
  phase: "intercept",                  // "intercept" | "battle" | "plunder" | "dialogue" | null

  // Who you're facing
  notableNPCId: "rival_calicojack_42",  // backlink to registry; null for disposable encounters
  enemy: {                               // snapshot of stats at session start; mutates during battle
    name: "Calico Jack",
    shipType: "brigantine",
    hull: 87,                            // mutates as battle progresses
    maxHull: 120,
    crew: 15,
    cannons: 18,
    speed: 14,
    faction: "pirate",
    risk: "high",                        // [B11 AMENDMENT] carried on the snapshot too —
                                          // needed by L.getBoardingRatio's morale stand-in
                                          // (design_combat_rework.md Section 7.1)
  },

  // Where this came from
  source: {
    kind: "world",                     // "mission" | "world" | "random" | "event" | "port"
    id: null,                            // mission id, event id, etc. — null for random
  },

  // Modifiers (combat starts, ongoing effects)
  modifiers: [
    { id: "tutorial_warmup", scope: "battle_start", effect: { playerHullDelta: -1 } },
    { id: "ambush", scope: "battle_start", effect: { enemyFirstRound: true } },
    { id: "favourable_wind", scope: "ongoing", effect: { evadeBonus: 0.2 } },
  ],

  // Phase-specific data
  intercept: {
    flavourText: "A navy patrol bears down on you...",
    options: [
      { id: "fight", label: "Engage", available: true, action: { type: "INTERCEPT_FIGHT" } },
      { id: "flee",  label: "Run",    available: true, action: { type: "INTERCEPT_FLEE" }, speedCheck: { player: 12, enemy: 14 } },
      // ...
    ],
  },

  battle: {                              // null until phase === "battle"
    round: 3,
    log: [ "Round 1: ...", "Round 2: ..." ],
    playerHull: 67,                      // snapshot of player's hull at battle start; mutates
    playerCrew: 18,                      // mutates as crew is lost
    initialPlayerCrew: 20,
    lostCrewNames: [ "Maria Vargas" ],
    convoyHull: 45,                      // escort missions only; otherwise undefined
    distance: "close",                   // [B11 AMENDMENT] "far" | "medium" | "close" —
                                          // see design_combat_rework.md Section 3.
                                          // Set at battle creation via initialDistanceFor(type),
                                          // mutates each round via the Reposition step.
    subPhase: "naval",                    // [B11 AMENDMENT] "naval" | "boarding" — see
                                          // design_combat_rework.md Section 7. Nested inside
                                          // `battle`, NOT a new top-level `phase` value — see
                                          // "Nested subPhase" note under Phase Transitions below.
  } | null,

  plunder: {                             // null until phase === "plunder"
    goldReward: 1240,
    enemyCargo: { sugar: 12, rum: 8, ... },
    canPlunder: true,
    outcomeType: "captured",             // [B11 AMENDMENT] "captured" | "sunk" — sunk should
                                          // never actually reach the plunder phase (no plunder
                                          // possible per design doc Section 6), but recording
                                          // which outcome led here is useful for the journal/log
                                          // and for notableNPC history entries.
  } | null,

  // Return state
  returnScreen: "sailing",              // where to go when session closes
};
```

**Lifecycle:** created when a confrontation begins; phase transitions explicitly via reducer actions; cleared to `null` when fully resolved.

**Phase transitions:**
- `null` → `"intercept"` (encounter opens)
- `"intercept"` → `"battle"` (INTERCEPT_FIGHT, INTERCEPT_FLEE_FAILED, INTERCEPT_PARLEY_FAILED)
- `"intercept"` → `null` (INTERCEPT_FLEE_SUCCESS, INTERCEPT_PARLEY_SUCCESS, INTERCEPT_BRIBE, INTERCEPT_SURRENDER, INTERCEPT_INSPECT)
- `"battle"` → `"plunder"` (victory with canPlunder, player chooses Plunder)
- `"battle"` → `null` (victory without plunder, defeat, fled)
- `"plunder"` → `null` (TAKE_PLUNDER)
- `"dialogue"` → `"intercept"` (future story NPC pre-encounter dialogue)
- `"dialogue"` → `null` (dialogue-only encounter, no combat)

**[B11 AMENDMENT] Nested `subPhase` transitions, within `phase === "battle"` only:**
- `battle.subPhase` starts at `"naval"` whenever `phase` transitions to `"battle"`.
- `"naval"` → `"boarding"` (successful Grapple — see design_combat_rework.md Section 4, Step 5)
- `"boarding"` → `"naval"` (Fall Back, mutual or one-sided, returns to Naval combat at Close distance — the ships detached but didn't separate further)
- `"boarding"` → *(session-ending outcome, `phase` leaves `"battle"` entirely)* on wipeout, surrender, or a successful Demand Surrender/capture
- This is a state machine nested one level inside the existing `phase` state machine, not a sibling of it — deliberately, so none of the top-level phase transition logic above needs to change to accommodate boarding.

### Concept 3: `activeMission` (unchanged)

Continues to track the player's accepted mission. Provides backlink data via `encounterSession.source` when an encounter is mission-driven.

No structural changes. No new fields. The mission system already works.

---

## How They Interact

### Scenario: Random navy patrol

1. `engine_voyage.js` `ADVANCE_DAY` rolls patrol chance, hits
2. Generates a random patrol enemy via `G.generateEnemy(...)`
3. Dispatches an action that opens an `encounterSession`:
   - `notableNPCId: null` (disposable)
   - `source: { kind: "random", id: null }`
   - `enemy: { generated stats }`
   - `phase: "intercept"`
4. Player resolves session (fight/flee/inspect)
5. Session closes; no persistence

### Scenario: Rival captain encounter

1. World system tick checks rival spawn conditions, decides Calico Jack appears
2. Reads `state.notableNPCs["rival_calicojack_42"]` for current hull/crew state
3. Opens `encounterSession`:
   - `notableNPCId: "rival_calicojack_42"`
   - `source: { kind: "world", id: "rival_spawn_tick_138" }`
   - `enemy: snapshot from notableNPC`
   - `phase: "intercept"`
4. Player engages in combat
5. Player damages enemy hull to 45, but enemy flees
6. Session close writes back: `notableNPCs["rival_calicojack_42"].hull = 45`, appends history entry
7. `encounterSession = null`
8. Next time Calico Jack spawns, he starts with hull 45 (may have healed partially via world tick)

### Scenario: Mission combat (tutorial hunt)

1. Player accepts "Hunt the Rat" mission → `activeMission` populated
2. Mission system either:
   - Immediately opens an `encounterSession` (current behavior for combat missions)
   - OR waits for mid-voyage trigger (some mission types)
3. `encounterSession`:
   - `notableNPCId: null` (The Rat is a one-off, not a notable NPC)
   - `source: { kind: "mission", id: "tutorial_hunt" }`
   - `enemy: snapshot from mission.enemy`
   - `modifiers: [{ id: "tutorial_warmup", ... }]`
   - `phase: "intercept"`
4. Player fights and wins
5. Session closes; `activeMission.enemyDefeated = true` (so player can complete mission at port)
6. `encounterSession = null`

### Scenario: Story NPC dialogue, no combat

1. Player arrives at hidden port, triggers story event
2. Opens `encounterSession`:
   - `notableNPCId: "story_libertalia_elder"`
   - `source: { kind: "event", id: "libertalia_first_meeting" }`
   - `phase: "dialogue"`
   - `intercept` and `battle` remain null
3. Player navigates dialogue tree
4. Session closes when dialogue ends
5. Notable NPC state updated (storyArcStage++, etc.)

### Consequences (heat, infamy, reputation)

Per B1.3 decision #6: consequence logic stays **outside** the encounter session.

- `addHeat`, `applyReputationImpact`, infamy gain, upset crew tagging, battle scars — all remain in reducer code (currently in `DISMISS_BATTLE`).
- Consequences read `encounterSession` to know what happened, then apply system effects on `state`.
- The session is data; consequences are systemic effects.

---

## Migration Plan

Each phase ends in a stable, fully playable game state. Refresh `tests_integration.html` after every phase.

### Phase B1.4.1 — Add `encounterSession` to initial state

**Purpose:** Introduce the new field without using it. Set up the foundation.

**Files affected:**
- `engine_core.js` — add `encounterSession: null` to `initialState`
- `engine_core.js` — update `migrateState` to add `encounterSession: null` for old saves
- `tests/tests_integration.html` — add a test verifying `E.initialState.encounterSession === null`

**Changes:**
- Add field to initial state object
- Add migration line: `if (state.encounterSession === undefined) state.encounterSession = null;`

**Test plan:**
- Refresh tests_integration.html — all pass, new test passes
- Refresh game in incognito — no behavior change
- Load an old save — migration runs cleanly, field present and null

**Exit criteria:**
- `state.encounterSession` is reliably `null` in all flows
- Old saves migrate without error
- Tests integration page green

**Risk:** Negligible. Pure additive change.

**Estimated effort:** 15 minutes

---

### Phase B1.4.2 — Add `notableNPCs` registry to initial state

**Purpose:** Establish the registry alongside the session. Empty for now.

**Files affected:**
- `engine_core.js` — add `notableNPCs: {}` to `initialState`
- `engine_core.js` — update `migrateState` to add `notableNPCs: {}` for old saves
- `tests/tests_integration.html` — verify field exists and is an empty object

**Changes:**
- Add field to initial state
- Add migration line

**[B11 AMENDMENT] Note on the `risk` field**: when this registry actually gets populated (future work, not this phase), each entry's shape should carry `risk` alongside `hull`/`crew`/etc., since `L.getBoardingRatio`'s morale stand-in (design_combat_rework.md Section 7.1) reads it. Not actionable in this phase — the registry is empty here — but worth the shape being right from the start once B10/B11-adjacent rival work actually populates it, rather than discovering the gap later.

**Test plan:**
- Refresh tests page — green
- Game plays identically — no producers/consumers yet

**Exit criteria:**
- `state.notableNPCs` exists as empty object across all flows
- Old saves migrate cleanly

**Risk:** Negligible.

**Estimated effort:** 10 minutes

---

### Phase B1.4.3 — Mirror `encounterContext` into `encounterSession` (parallel state)

**Purpose:** Every existing `encounterContext` mutation also populates `encounterSession.intercept`. Read paths still use `encounterContext`. This is the shadow-state phase.

**Files affected:**
- `engine_core.js` — add helper `mirrorToSession(state, encounterContext)` that builds an equivalent `encounterSession` skeleton
- `engine_port.js` — wherever `encounterContext` is set (SAIL_TO hostile branch, ENTER_PORT hostile entry), also call mirror helper
- `engine_voyage.js` — patrol generation paths
- `engine_combat.js` — `INTERCEPT_FIGHT`, `INTERCEPT_FLEE` failure path, `INTERCEPT_PARLEY` failure path
- `engine_port.js` — `TAKE_MISSION` combat branch
- Anywhere else `encounterContext` is set

**Changes:**
- Helper takes the existing context and produces a session skeleton:
  ```
  {
    type: ctx.type,
    phase: "intercept",
    notableNPCId: null,
    enemy: { ...ctx.enemy },
    source: inferSource(state, ctx),
    modifiers: [],
    intercept: { flavourText: ctx.flavourText, options: ctx.options },
    battle: null,
    plunder: null,
    returnScreen: state.destination ? "sailing" : "port",
  }
  ```
- `inferSource` helper: looks at current state to decide source kind (mission → "mission", random patrol → "random", etc.)

**Test plan:**
- Refresh game in incognito
- Trigger every existing encounter type: random patrol, mission combat (tutorial hunt), hostile port entry, distressed merchant, smuggle patrol
- For each, open browser console and verify `state.encounterSession` is populated alongside `state.encounterContext`
- Inspect that the enemy, flavour text, and options match
- Tests integration page green
- Game behavior unchanged

**Exit criteria:**
- Every encounter that opens `encounterContext` also opens an equivalent `encounterSession`
- Console inspection confirms shadow state mirrors the original
- No regressions in encounter behavior

**Risk:** Medium. Mistake in mirror logic produces a desynced session. Detect via console inspection.

**Estimated effort:** 60–90 minutes

---

### Phase B1.4.4 — InterceptScreen reads from `encounterSession`

**Purpose:** Switch the InterceptScreen to read from the new session. The shadow `encounterContext` is still populated and used by intercept action handlers.

**Files affected:**
- `screens_combat.jsx` — `InterceptScreen` component

**Changes:**
- Replace `state.encounterContext.options` with `state.encounterSession.intercept.options`
- Replace `state.encounterContext.flavourText` with `state.encounterSession.intercept.flavourText`
- Replace `state.encounterContext.enemy` with `state.encounterSession.enemy`
- Keep dispatched actions identical (they still write to `encounterContext` for now)

**Test plan:**
- Trigger each encounter type via gameplay
- Verify InterceptScreen renders identically (flavour, options, enemy stats)
- Click each option and verify the action dispatches correctly

**Exit criteria:**
- InterceptScreen no longer reads from `encounterContext`
- All encounter rendering is identical to before

**Risk:** Low. The screen is presentational; bugs surface immediately.

**Estimated effort:** 30 minutes

---

### Phase B1.4.5 — Intercept action handlers write to `encounterSession`

**Purpose:** When the player picks an intercept option, the action handlers write to `encounterSession` (phase transition to `"battle"` or `null`) and stop maintaining `encounterContext`.

**Files affected:**
- `engine_combat.js` — `INTERCEPT_FIGHT`, `INTERCEPT_FLEE`, `INTERCEPT_PARLEY`, `INTERCEPT_BRIBE`, `INTERCEPT_SURRENDER`, `INTERCEPT_INSPECT`

**Changes:**
- Each handler clears `encounterContext` to `null` AND updates `encounterSession`:
  - `INTERCEPT_FIGHT`: sets `encounterSession.phase = "battle"`, populates `encounterSession.battle` with initial battle state **[B11 AMENDMENT: including `distance` via `initialDistanceFor(encounterSession.type)` and `subPhase: "naval"` — see Phase B1.4.6's scope note below for why the actual distance/boarding *logic* is NOT built in this phase, only the initial field values]**
  - `INTERCEPT_FLEE` success: sets `encounterSession = null`
  - `INTERCEPT_FLEE` failure: sets `encounterSession.phase = "battle"`, populates battle
  - `INTERCEPT_PARLEY` success: applies rep change, sets `encounterSession = null`
  - `INTERCEPT_PARLEY` failure: sets phase to `"battle"`, populates battle
  - `INTERCEPT_BRIBE`: applies cost and rep change, sets `encounterSession = null`
  - `INTERCEPT_SURRENDER`: applies consequences, sets `encounterSession = null`
  - `INTERCEPT_INSPECT`: applies inspection logic, sets `encounterSession = null`
- Still write to `battleState` (the old field) for backward compat with `BATTLE_ACTION`

**Test plan:**
- Play through each intercept option for each encounter type
- Verify the resulting game state is correct: combat starts when expected, returns to sailing/port when expected, consequences applied
- Verify `encounterSession.phase` transitions correctly

**Exit criteria:**
- All intercept options work correctly
- `encounterSession.phase` accurately reflects the post-action state
- `battleState` is still populated when entering combat (shadow for now)

**Risk:** Medium-high. This is where the action handlers fork. Test thoroughly.

**Estimated effort:** 90 minutes

---

### Phase B1.4.6 — Migrate `BATTLE_ACTION` and `BattleScreen` to read/write `encounterSession.battle`

**[B11 AMENDMENT — SCOPE CLARIFICATION, READ BEFORE STARTING]**: this phase migrates
**today's actual shipped combat logic** (broadside/precision/evade/grapple, no
distance, no boarding sub-phase, grapple = instant win) onto the new
`encounterSession.battle` structure. It does **not** implement any of the B11 combat
rework (distance bands, the ordered resolution pipeline, boarding as a real sub-phase,
sunk-vs-captured outcomes). That work is a separate, already-designed and task-listed
effort (`design_combat_rework.md`, `tasks_combat_rework.md`) that begins only after
this phase — and Phase B1.4.8 — are complete, building directly on the
`encounterSession.battle` shape this phase produces. Keeping this boundary sharp
matters: this phase's job is "move the existing logic without changing behavior,"
which is already flagged below as the highest-risk phase in the whole migration —
folding in new combat mechanics at the same time would make an already-risky phase
substantially riskier for no benefit, since the new mechanics need this phase's output
to exist first anyway.

**Purpose:** Move combat resolution onto the new session structure.

**Files affected:**
- `engine_combat.js` — `BATTLE_ACTION` case
- `engine_combat.js` — combat helper functions (`applyCrewLoss`, `buildRoundLog`, etc.)
- `screens_combat.jsx` — `BattleScreen` component

**Changes:**
- `BATTLE_ACTION` reads from and writes to `encounterSession.battle`
- All references to `state.battleState.playerHull`, `state.battleState.enemyHull`, etc. become `state.encounterSession.battle.playerHull`, etc.
- BattleScreen reads from `state.encounterSession`
- Continue maintaining `battleState` as a shadow mirror

**Test plan:**
- Play multiple combat scenarios: tutorial hunt, navy patrol, distressed merchant defense, escort defense
- Verify each round resolves correctly
- Verify victory, defeat, fled phases work
- Verify convoy hull (escort) still triggers convoy defeat
- Verify plunder is offered when appropriate

**Exit criteria:**
- Combat flows identically to before
- `encounterSession.battle` is authoritative; `battleState` is shadow
- Tests integration green

**Risk:** High. BATTLE_ACTION is the most complex case. Plan for an extended testing session.

**Estimated effort:** 90–120 minutes

---

### Phase B1.4.7 — Migrate `DISMISS_BATTLE` and `TAKE_PLUNDER`

**[B11 AMENDMENT — SCOPE CLARIFICATION]**: same boundary as Phase B1.4.6 — this phase
migrates the *existing* `handleDefeat`/`applyVictoryAftermath`/`handlePatrolVictory`/
`handleFledMission` logic onto the new session structure, unchanged in behavior. The
B11 combat rework's new outcome vocabulary (`player_sunk`, `enemy_sunk`,
`player_captured`, `enemy_captured`, and the boarding-specific outcomes) is built on
top of this phase's output afterward, not part of this phase.

**Purpose:** Move post-combat resolution onto the new session.

**Files affected:**
- `engine_combat.js` — `DISMISS_BATTLE`, `TAKE_PLUNDER`
- `engine_combat.js` — helpers `handleDefeat`, `applyVictoryAftermath`, `handlePatrolVictory`, `handleFledMission`

**Changes:**
- All helpers read from `encounterSession` instead of `battleState`
- `DISMISS_BATTLE` clears `encounterSession = null` (or transitions to `"plunder"` if applicable)
- `TAKE_PLUNDER` reads from `encounterSession.plunder`, then clears session
- Consequence application (heat, infamy, rep) reads `encounterSession.type` and `encounterSession.source`
- Continue clearing `battleState` to `null` in same paths for backward compat

**Test plan:**
- Test every DISMISS_BATTLE path: victory, defeat, fled, plunder offered, plunder taken, plunder skipped
- Test patrol mission victory path
- Test escort mission convoy loss path
- Verify heat is applied correctly for navy fights
- Verify rep impact applied for faction fights

**Exit criteria:**
- All DISMISS_BATTLE paths work
- All post-combat consequences applied correctly
- `encounterSession` cleared in all paths

**Risk:** Medium-high. Many branches to test.

**Estimated effort:** 60–90 minutes

---

### Phase B1.4.8 — Delete `encounterContext` and `battleState`

**Purpose:** Remove the shadow fields now that nothing reads them.

**Files affected:**
- `engine_core.js` — remove `encounterContext: null` and `battleState: null` from `initialState`
- `engine_core.js` — update `migrateState` to delete these fields from old saves
- All engine files — grep for any remaining references and remove
- `tests/tests_integration.html` — update tests to no longer expect these fields
- `screens_combat.jsx` — verify no remaining references

**Changes:**
- Grep for `encounterContext` and `battleState` across the entire codebase
- Remove any orphaned writes (helpers that were still populating them "just in case")
- Migration drops these fields from old saves: `delete state.encounterContext; delete state.battleState;`

**Test plan:**
- Full game playthrough: title, scenario, port, market, sailing, encounter (all types), battle, plunder, journal, status
- Tests integration page green
- Load an old save and verify migration removes the fields

**Exit criteria:**
- Zero references to `encounterContext` or `battleState` anywhere in the codebase (verified by grep)
- Old saves migrate cleanly with fields removed
- Game fully playable

**Risk:** Medium. Easy to miss a reference; if missed, error appears at runtime.

**Estimated effort:** 45 minutes

**[B11 AMENDMENT]**: this is the completion gate for `tasks_combat_rework.md`. That
task list should not begin until this phase's exit criteria are met — see the note at
the very end of this document.

---

### Phase B1.4.9 — Introduce modifier system (one modifier)

**[B11 AMENDMENT — INTEGRATION NOTE]**: the original open question #6 ("combat modifier
resolution order when multiple apply") is answered now that `design_combat_rework.md`
defines a concrete five-step resolution order (Evade → Damage → Hull/Crew check →
Reposition → Grapple). Modifiers integrate at two distinct points, and should be
implemented accordingly once this work resumes after B11's naval resolver exists:
- **`scope: "battle_start"` modifiers** (e.g. the tutorial warmup) apply once, before
  Round 1's Step 1 begins — a pre-round setup effect, not part of the per-round
  pipeline at all. This matches the existing plan below with no change needed.
- **`scope: "ongoing"` modifiers** (e.g. `favourable_wind`'s `evadeBonus`) need to hook
  directly into Step 1 (Evade) of `L.resolveNavalRound` — specifically, adjusting the
  contest chance calculated by `L.resolveSpeedContest` when Evade is contested against
  an opposing Close Distance declaration. This is a new, concrete integration point
  that didn't exist when this phase was originally scoped; it doesn't change this
  phase's own effort estimate (the tutorial warmup modifier alone doesn't need it), but
  should inform how the modifier-application helper is written so an `ongoing`-scope
  modifier can be added later without another refactor.

**Purpose:** Establish the API for combat modifiers. Implement only the tutorial warmup for now.

**Files affected:**
- `engine_combat.js` — `INTERCEPT_FIGHT` handler
- `engine_combat.js` — `BATTLE_ACTION` handler (apply battle_start modifiers)
- `data.js` — define modifier shape constants (optional)

**Changes:**
- When `INTERCEPT_FIGHT` fires, before creating the battle, check for applicable modifiers and populate `encounterSession.modifiers`
- The tutorial warmup is now a modifier:
  ```
  if (activeMission?.tutorial && !activeMission?.requiredGood) {
    modifiers.push({
      id: "tutorial_warmup",
      scope: "battle_start",
      effect: { playerHullDelta: -1 },
      log: "The Rat fires a hasty shot, grazing your hull!"
    });
  }
  ```
- `BATTLE_ACTION` (or a new helper called from it) applies `battle_start` modifiers when the battle begins (round 1 setup)
- Document the modifier shape in a comment block at the top of engine_combat.js

**Test plan:**
- Play through tutorial hunt
- Verify the opening hull damage still occurs (-1 hull at start)
- Verify the log message still appears
- Verify the modifier shows in `encounterSession.modifiers` via console
- Play through a non-tutorial fight and verify no modifier is applied

**Exit criteria:**
- Tutorial warmup works via the modifier system
- The API is documented enough that B11 can extend it
- No regressions in non-tutorial fights

**Risk:** Low–medium. Risk is over-designing the modifier system. Keep it minimal — one modifier, no fancy combinators, no premature optimization.

**Estimated effort:** 60 minutes

---

### Phase B1.4.10 — Document the new architecture

**Purpose:** Capture the design in specs so it survives without you.

**Files affected:**
- `docs/specs_engine.md` — major update describing `encounterSession`, `notableNPCs`, phase transitions, modifier API
- `docs/architecture.md` — update state shape section, add encounter flow diagram
- `docs/_Sidebar.md` and `docs/Home.md` — verify nothing needs updating
- `tasks_encounter_state_refactoring.md` (this file) — mark complete, archive

**Changes:**
- specs_engine.md gets a new section: "Encounter Session Architecture"
  - The three concepts
  - State shape examples
  - Phase transitions
  - Modifier API
  - How consequences integrate
  - **[B11 AMENDMENT]** once B11 ships, this section should also cover the nested
    `battle.subPhase` state machine and link to `design_combat_rework.md`
- architecture.md updates:
  - Initial state shape now mentions encounterSession, notableNPCs
  - Encounter routing diagram updated
- This file (`tasks_encounter_state_refactoring.md`) gets a final status block:
  - All phases marked complete
  - Notes on what diverged from plan (if anything)
  - Notes for future work

**Test plan:**
- Re-read specs_engine.md fresh — does it make sense?
- Can a hypothetical new contributor understand the encounter system from the spec alone?

**Exit criteria:**
- Specs accurately describe the implemented system
- This task doc is archived/marked complete in the roadmap

**Risk:** None.

**Estimated effort:** 60 minutes

---

## Cross-Cutting Concerns

### Save Migration

Old saves that predate this refactor must continue to load. The migration logic in `engine_core.js` `migrateState` should:

- During phases B1.4.1 and B1.4.2: add `encounterSession: null` and `notableNPCs: {}` if missing
- During phase B1.4.8: remove `encounterContext` and `battleState` fields if present
- Increment save version after phase B1.4.8

### Debug Tooling

The debug panel (`?debug=1`) should gain helpers for:

- Inspect `encounterSession` state
- Force-open an encounter of a specific type (for testing)
- Spawn a notable NPC (future, once features arrive)

These are nice-to-have, not blocking. Park them as a follow-up after B1.4.10.

### Integration Test Updates

The `tests_integration.html` file should be updated to:

- Verify `state.encounterSession` and `state.notableNPCs` exist
- Verify phase transitions in `encounterSession` (state machine validity)
- Once modifier system exists: verify the modifier shape
- **[B11 AMENDMENT]** once B11 ships: verify `battle.distance` and `battle.subPhase` exist with valid enum values when `phase === "battle"`

Each phase that adds state should add a corresponding test.

### Generators

`G.generateEnemy` and related generators continue to produce raw enemy data. Whether that data is wrapped in a `notableNPC` registry entry or used as a disposable encounter enemy is decided by the caller, not the generator. **No change to generators.js.**

**[B11 AMENDMENT]**: `generateEnemy`'s return shape does need one small addition
(`risk`, see `tasks_combat_rework.md` Part 6) — this is a B11-scoped change to
`generators.js`, made after this refactor is complete, not part of this refactor
itself. Noted here only so the "no change" statement above isn't read as blocking that
later, unrelated addition.

---

## Future-Proofing Notes

What this architecture enables that the current one doesn't:

1. **Persistent rivals** — same enemy across multiple encounters, hull state preserved (Phase 1 enables registry; specific rivals come later)
2. **Head-hunters with bounty triggers** — notable NPC with spawn conditions tied to player infamy/contraband
3. **Story NPCs with multi-stage arcs** — `flags.storyArcStage` evolves, session offers different options at each stage
4. **Allies and escort companions** — notable NPC with `disposition: "ally"` and `kind: "escort_companion"` provides combat support (modifiers, or future explicit ally mechanics)
5. **Combat modifiers as data** — wind, surprise, weather, crew condition, equipment effects all expressed as modifiers
6. **Parley-only encounters** — session with options array containing only parley/decline, never transitions to battle phase
7. **Dialogue-only encounters** — `phase: "dialogue"` for story-only meetings without combat
8. **Multi-phase encounters** — "first dialogue, then maybe combat" via `dialogue → intercept → battle` chain
9. **Escalation across encounters** — fleeing a rival sets a flag, world tick spawns them more aggressively next time
10. **Bounty mechanics** — defeating a notable NPC pays differently than a random; outcome handler checks `notableNPCId`
11. **[B11 AMENDMENT] Distance-and-boarding naval combat** — the `battle.distance`/`battle.subPhase` fields this refactor's target shape now includes directly support the full B11 combat rework (positional maneuvering, a real boarding sub-phase distinct from an instant grapple-win, sunk-vs-captured outcomes) without any further state-shape changes. See `design_combat_rework.md` for the full design.

---

## Open Questions Parked for Later

These do NOT need to be resolved during B1.4. They will be answered by the features that need them.

1. **Are notable NPCs stored individually or in groups?** (E.g., a faction war involves multiple ships — one notable NPC entity, or multiple linked?) Decision deferred to B10/B11.

2. **Can multiple sessions exist simultaneously?** (E.g., random patrol intercepts a player who's mid-mission encounter.) Currently no, and the new architecture preserves the single-session model. Revisit if needed.

3. **How do notable NPCs heal between encounters?** (Linear regen, port repair simulation, story-driven.) Deferred to B10/B11 with rival/head-hunter design.

4. **Should notable NPC death be irreversible, or can they return?** ("A pirate has many lives.") Deferred.

5. **What happens to notable NPCs when the player retires?** (Wiped on new game, or carried over via legacy system.) Deferred to B12 (Endgame & Legacy).

6. ~~**Combat modifier resolution order when multiple apply.**~~ **[B11 AMENDMENT — RESOLVED]** Answered by `design_combat_rework.md`'s five-step resolution order; see the integration note under Phase B1.4.9 above.

7. **Should the encounter session have an `id` for save/log references?** Currently no, may be useful later. Park for now.

8. **[B11 AMENDMENT — NEW] Does an escort mission's convoy have its own `distance` state, or does it always share the player's `battle.distance`?** Surfaced by the B11 design's distance/positioning system — the existing `convoyHull` field assumes a single shared battle state, but doesn't specify whether the convoy maneuvers independently. Not resolved by either this document or `design_combat_rework.md`. Simplest default (convoy shares the player's distance, no independent positioning) is likely correct, but should be an explicit decision when escort missions are revisited under B11's action set, not an assumption baked in silently.

---

## Rollback Strategy

Each phase ends in a stable state, so rollback is straightforward at any point:

- **During a phase:** revert the in-progress file edits, refresh game in incognito. Previous phase's state is intact.
- **After a phase:** mark the phase as not-yet-done in this doc, re-enter implementation mode. Saves from completed phases remain compatible because each phase preserves backward compatibility via the shadow-state approach.
- **Mid-migration emergency:** if a phase introduces an unfixable bug, the prior phase's state is the rollback target. Worst case: revert through git to before the phase started.

If a phase reveals that the plan is fundamentally wrong (the architecture doesn't fit some edge case discovered mid-implementation), pause and revisit B1.3 design before continuing.

---

## Estimated Total Effort

| Phase | Estimated |
|---|---|
| B1.4.1 — Add encounterSession field | 15 min |
| B1.4.2 — Add notableNPCs registry | 10 min |
| B1.4.3 — Mirror encounterContext into session | 60–90 min |
| B1.4.4 — InterceptScreen reads from session | 30 min |
| B1.4.5 — Intercept handlers write to session | 90 min |
| B1.4.6 — Migrate BATTLE_ACTION and BattleScreen | 90–120 min |
| B1.4.7 — Migrate DISMISS_BATTLE and TAKE_PLUNDER | 60–90 min |
| B1.4.8 — Delete encounterContext and battleState | 45 min |
| B1.4.9 — Modifier system (one modifier) | 60 min |
| B1.4.10 — Documentation | 60 min |
| **Total** | **8–10 hours** |

Spread across 5–8 focused sessions of 60–90 minutes each.

**[B11 AMENDMENT]**: `tasks_combat_rework.md` is a separate effort estimate, not included
in the total above — it begins only after B1.4.8 is complete.

---

## Glossary

| Term | Meaning |
|---|---|
| **encounterSession** | The single state field representing the current confrontation. Replaces `encounterContext` and `battleState`. |
| **notableNPC** | Persistent named entity in the world (rival, head-hunter, story NPC, ally). Has lasting state across encounters. |
| **disposable encounter** | An encounter with no notable NPC backlink. Once resolved, no persistence. (E.g., random patrol, one-off pirate.) |
| **session phase** | The current step in the resolution: `"intercept"`, `"battle"`, `"plunder"`, `"dialogue"`, or `null`. |
| **[B11 AMENDMENT] battle subPhase** | Nested inside `encounterSession.battle`, only meaningful when `phase === "battle"`: `"naval"` or `"boarding"`. See `design_combat_rework.md` Section 7. |
| **session source** | Where the encounter came from: `"mission"`, `"world"`, `"random"`, `"event"`, `"port"`. |
| **combat modifier** | A data entry on `encounterSession.modifiers` that alters combat behavior (tutorial warmup, ambush, weather). |
| **shadow state** | A temporary state field maintained alongside the new one during migration, to allow incremental switching of read paths. |
| **consequence** | A systemic effect applied after an encounter resolves: heat, infamy, reputation impact, crew upset, scars. Owned by reducer code, not the session. |

---

## Status Tracking

Update this table as phases complete.

| Phase | Status | Date completed | Notes |
|---|---|---|---|
| B1.4.1 | Not started | — | DONE|
| B1.4.2 | Not started | — | DONE |
| B1.4.3 | Not started | — | — |
| B1.4.4 | Not started | — | — |
| B1.4.5 | Not started | — | — |
| B1.4.6 | Not started | — | — |
| B1.4.7 | Not started | — | — |
| B1.4.8 | Not started | — | — |
| B1.4.9 | Not started | — | — |
| B1.4.10 | Not started | — | — |

---

## Sequencing Note for `tasks_combat_rework.md`

**`tasks_combat_rework.md` must not begin until Phase B1.4.8's exit criteria are met**
(`encounterContext` and `battleState` fully removed, `encounterSession.battle` is the
sole source of truth). Building the combat rework against the pre-refactor
`battleState` shape would mean every reference to `battleState.enemy`,
`battleState.distance`, `battleState.subPhase`, etc. throughout that task list would
need renaming to `encounterSession.battle.*` / `encounterSession.enemy` afterward — a
mechanical but pervasive rename across the highest-risk parts of both efforts, done
twice for no benefit. `tasks_combat_rework.md` has already been updated to reference
`encounterSession.battle` directly, on the assumption this refactor completes first.