# Prose Journal — Design Decisions
## B13.2: Structured event capture and fragment-composed daily narration (V1)

This document covers V1 only — the sandbox-era version, built against the current
game with no dependency on notable NPCs or story arcs. V2 (rival continuity, arc-aware
narration) is explicitly deferred; V1's job is to build the plumbing V2 will later
activate, not to anticipate V2's content.

---

## 1. Purpose and Scope

The current Journal screen is a filtered view of `state.log` — the same terse,
mechanical strings shown everywhere else in the game (HUD flashes, combat rounds),
just grouped by category tab. B13.2 replaces this with a genuinely different artifact:
a daily, first-person, prose-composed account of what happened, written only on days
that contain something worth writing about.

**B13.2 is complete when**: a player can read their journal end to end and it reads as
a account of their voyage, not a re-rendering of the mechanical log — while every
factual claim in it remains exactly true to what the game state actually recorded.

**Explicitly not in scope for V1**: rival/notable-NPC continuity, story-arc-aware
narration, any reduction in routine mission density. These are V2, gated on B19 content
existing. V1 must build the seam V2 will use, not the content itself.

---

## 2. Architecture

### 2.1 — A dedicated middleware file, `engine_journal.js`, mirroring `engine_career.js`

**Decision**: a new reducer pushed onto `window.E._reducers`, running after every
action, in the same shape as the existing career-tracking middleware. This is where
*composition* happens — reading the day's accumulated structured events and producing
prose. It contains no game logic about what happened; it only ever consumes facts
already recorded elsewhere.

### 2.2 — Emission stays local to each domain reducer; composition stays central

**Decision**: every domain reducer that produces a noteworthy outcome (combat
resolution, patrol inspection, random events, starvation death, etc.) makes one small,
uniform call at the exact point of resolution:

```js
L.pushJournalEvent(state, {
  type: "patrol_inspection",
  outcome: "bribed",
  deltas: { gold: -150 },
});
```

**Why this split, not one or the other**: a middleware reading state-before/state-after
diffs can only *reconstruct* what happened from side effects (gold changed, hold
changed) — this is the same lossy-reconstruction trap already identified and rejected
for the combat log (`MISS_PHRASES` string-matching) and for mission-completion tracking
earlier in this project. Only the reducer resolving `PATROL_INSPECT` knows with
certainty whether goods were seized, bribed, or hidden. Emission must happen where the
fact is unambiguous; composition happens later, centrally, from facts already captured
— never by re-deriving facts from rendered text or state diffs.

`pushJournalEvent` is a small, shared primitive (`logic_travel_events.js` or
wherever the emitting reducer already lives) — the same pattern as `L.applyInfamyGain`:
one shared function many call sites route through, not logic duplicated per call site.

---

## 3. State Shape

### 3.1 — Both structured facts and frozen prose are persisted

**Decision**:

```js
state.journalBuffer = [
  // Accumulates through the current day; flushed and cleared on day-close.
  { type: "combat_victory", outcome: "captured", enemyId: null,
    deltas: { crewLost: 2, hullLost: 15, gold: +340 } },
  { type: "storm", outcome: "rode_out", deltas: { hullLost: 8 } },
];

state.journalEntries = [
  // One entry per day that had ≥1 noteworthy event. Permanent, in day order.
  {
    day: 14,
    facts: [ /* the flushed journalBuffer contents for this day */ ],
    text: "The storm hit hard before dawn... [full composed prose]",
  },
];
```

**Why both, not one**: facts-only would require re-composing prose on every read,
risking different wording on repeat visits to the same day (breaks "this is my
story" the moment a player notices inconsistency). Prose-only would permanently lock
V1's exact wording, with no way to retroactively enrich old entries once V2 adds rival
continuity or better fragments. Persisting both: `text` is the source of truth for
display today; `facts` is what a future V2 pass can use to regenerate or annotate
without needing to re-parse prose.

### 3.2 — `journalBuffer` is not itself save-critical

Confirmed acceptable to lose on an unsaved session end: the game only saves on port
arrival, which is also the only place the journal is ever read, so a buffer that never
survived to a save was never going to be visible to the player anyway. `journalBuffer`
does not need special migration handling beyond defaulting to `[]` on old saves.

---

## 4. Flush Triggers

**Decision**: two trigger points, not one.

1. **`ADVANCE_DAY`, at the transition from day N to day N+1** — the standard case.
   `journalBuffer` (accumulated during day N) is composed into a `journalEntries`
   record for day N (only if non-empty after noteworthiness filtering — see Section 5),
   then cleared for day N+1.
2. **The `isUnrecoverable` game-over transition** (B9) — added specifically because the
   normal trigger never fires for a campaign's final day. Whatever combat or event
   produced the game-over condition is very likely the single most narratively
   significant day of the run, and it must not be silently dropped just because there
   was no subsequent day to advance into. Flush `journalBuffer` into a final
   `journalEntries` record at this transition, before `gameOverReason` is set.

---

## 5. Noteworthiness

### 5.1 — Decided once, near the source, per event type

**Decision**: each event type carries a fixed base tier (`routine` / `significant` /
`not_noteworthy`) decided at the point of emission, not inferred later from
accumulated state. Examples: combat resolution — always at least `routine`; clean
patrol passage (no goods found, nothing to hide) — `not_noteworthy`; patrol resulting
in a bribe, seizure, or repelled inspection — `significant`; ordinary day of sailing
and provision consumption — never emits an event at all.

### 5.2 — Severity escalation via centralized threshold check on raw deltas

**Decision**: every emitted event carries raw deltas (`crewLost`, `hullLost`,
`goldLost`, etc.) at emission time — the reducer already knows these precisely, no
inference needed. A single, centralized check (`L.escalateSeverity(deltas)`) runs
uniformly across every event type at composition time, promoting an otherwise-`routine`
event to `significant` if it crosses a shared threshold (draft: >30% crew lost, >50%
hull lost, >20% of current gold lost in one event — exact values tunable, not locked
by this document).

**Why one shared function, not per-type severity logic**: matches the same shape
already used for the boarding-tribute fairness check and the mutual-defeat tie-break —
one rule, applied uniformly, rather than bespoke severity logic duplicated per event
type. A near-death against a disposable enemy and a near-death against a random storm
should both escalate through the identical mechanism.

---

## 6. Fragment Composition

### 6.1 — Slot decomposition, not whole-sentence template pools

**Decision**: each noteworthy event type composes from independent slots — draft
shape for a combat entry: **Opening/context** (how it began — ambush, patrol,
sighting), **Combat-flow** (how the fight went), **Outcome** (what happened — kept as
a small, precise pool, since accuracy matters most here), **Consequence** (cost or
gain — omitted entirely when negligible). Each slot is a small array of interchangeable
fragments, conditioned on the event's real facts.

**Why this beats template count directly**: variety compounds multiplicatively across
slots while authored content only grows additively. Eight opening variants × six
combat-flow variants × five outcome variants × four consequence variants yields 960
distinct paragraph shapes from 23 authored fragments — adding one more opening option
adds 120 combinations, not one. This is the direct answer to "200 battles would need a
huge template library": it doesn't, because the combinatorics do the work, not raw
authored volume.

### 6.2 — Two-tier depth, not uniform treatment

**Decision**: `routine`-tier events get a single short clause (possibly folded into a
broader day-summary line); `significant`-tier events get the full slot-composed
paragraph. Giving all ~200 potential battles across a campaign full paragraph
treatment would make the journal exhausting regardless of phrasing variety — volume is
the real risk at scale, not repetition, and this is the actual mitigation for it, not
the template system itself.

---

## 7. Non-Repeat Selection

### 7.1 — Compare stored fragment indices, never rendered text

**Decision**: each composed entry stores which fragment index was selected per slot
(alongside `facts`, not just the final `text`). Before selecting a fragment for a new
entry, exclude the index used in the most recent *noteworthy* entry for that slot (not
strictly "yesterday" — the last entry that actually exists, which may be several real
days back given non-noteworthy days emit nothing).

**Why index comparison, not text comparison**: re-parsing the previous entry's
*rendered prose* to infer which fragment produced it is the exact `MISS_PHRASES`
string-matching anti-pattern already identified and rejected during the combat system
review — fragile to any future rewording, fails silently. Comparing stored indices is
robust to content edits and costs nothing extra to implement, since the facts layer
already needs to persist per-entry data.

---

## 8. Multi-Event Days

**Decision**: when a day produces multiple noteworthy events, they compose into a
single paragraph in **chronological order of occurrence** — first event of the day
leads the paragraph, last event closes it. No priority-based reordering.

---

## 9. Voice

**Decision**: first-person, matching the existing Captain's Log voice already
established in-game (*"The Company gave me a list of contacts... I did not expect..."*).
Every fragment across every slot must be authored consistent with this voice — this is
a grammatical constraint on content authoring, not a runtime decision.

---

## 10. The V2 Continuity Seam (built now, dormant until V2)

**Decision**: every combat-related event record carries an `enemyId` field from V1
onward — `null` for a disposable enemy (the overwhelming majority in the current
sandbox game), populated once `notableNPC` registry entries exist in V2. The
opening-clause slot for combat entries includes a conditional branch —
`hasHistoryWith(enemyId)` — that always evaluates false in V1 (no registry data exists
yet) but requires zero composition-logic changes to activate once V2 populates the
registry and adds rival-specific fragment variants.

**Why build a seam for content that doesn't exist yet**: this is the one piece of
forward-looking architecture worth paying for now, specifically because it's cheap (a
field and a conditional branch, not a subsystem) and because retrofitting it after V1
ships would mean reopening the composition logic rather than just adding content. This
is different in kind from the "don't build for hypothetical future needs" discipline
applied elsewhere in this project (rejecting a unified pre-combat event screen, e.g.)
— those were genuine premature abstractions; this is a near-zero-cost hook for a
feature already firmly on the roadmap (B19), not a speculative one.

---

## 11. Journal Screen Replacement

**Decision**: the existing category-tabbed raw-log view is fully replaced, not
extended. New `JournalScreen` renders `state.journalEntries` as a chronological prose
read, with a search box for finding specific entries by content. No filter tabs.

**Open consideration, not blocking**: pure free-text search serves "I remember a
detail, help me find it" well but not "show me everything combat-related" browsing,
which tabs supported. Since each entry's `facts` layer already knows its own
originating event type(s), a small inline category icon next to each entry's date
(reusing the existing `LOG_ICONS` set) is a low-cost addition worth considering during
implementation if pure search feels too blind in practice — not a blocking decision for
this document.

---

## 12. Rejected Alternatives

| Rejected | In favor of | Reasoning |
|---|---|---|
| Markov chains / statistical text models, for either ambiance or structured prose | Slot-based fragment composition | Ambiance-only use is technically feasible but the authoring cost of a training corpus rivals writing template variants directly, with unpredictable output instead of guaranteed coherence. For structured event prose specifically, rejected outright — zero semantic grounding means zero guarantee of factual accuracy, which breaks the entire premise of a journal claiming to summarize real events. |
| Whole-sentence template pools only (no slot decomposition) | Fragment/slot composition | Variety would scale additively with authored content instead of multiplicatively — genuinely would require a huge template library to avoid perceptible repetition across ~200 battles. |
| Reconstructing "what happened" from state diffs or rendered log text, at composition time | Emission at the point of resolution, in each domain reducer | Lossy and error-prone; only the resolving reducer knows the fact with certainty. Same failure mode already identified in `MISS_PHRASES` and the mission-completion tracking bug found during the combat system review. |
| Repeat-detection via comparing rendered prose text | Repeat-detection via stored fragment indices | Fragile to future content rewording, fails silently. Facts layer already needs to persist this data regardless. |
| Persisting `journalBuffer` across sessions / mid-day save support | Buffer is ephemeral within a day, cleared on flush | The game only saves on port arrival, which is also the only place the journal is read — a buffer that never reached a save was never visible anyway. Matches the project's general discipline of minimizing new persistent state. |
| Category filter tabs retained alongside prose | Search-based navigation, tabs removed | Explicit product decision — the whole point of B13.2 is that this is prose to be read, not a categorized log to be filtered. |
| Full-paragraph treatment for every noteworthy event uniformly | Two-tier (`routine`/`significant`) depth | At campaign scale (~200 battles), volume — not repetition — is the real risk to readability. Uniform full treatment would make the journal exhausting regardless of phrasing variety. |
| Building rival-continuity content now, ahead of B19 | Building only the seam (`enemyId` field, dormant conditional branch) now; content deferred to V2 | Same discipline already applied to rejecting a premature unified event-screen system earlier in this project — don't design against content that doesn't exist and isn't finalized. The seam is cheap; the content is not yet ready to write. |

---

## 13. Open Items Not Locked by This Document

These are real tuning/authoring decisions, deliberately left open rather than guessed
at here — to be resolved during task-list implementation or a later balance pass, not
invented silently by an implementing agent:

- Exact severity-escalation thresholds (Section 5.2's 30%/50%/20% figures are drafts)
- Exact fragment counts per slot per event type (Section 6.1's 8/6/5/4 example is
  illustrative, not a target)
- Whether the inline category-icon addition to `JournalScreen` (Section 11) ships in V1
  or is deferred
- The complete list of which event types get `journalEntries` treatment at all in V1
  versus remain purely mechanical (`state.log` only) — this document assumes combat,
  patrol-with-consequence, storms, starvation deaths, and wreck searches per the
  original scoping conversation, but the exhaustive list should be confirmed against
  actual current event/mission data before task-list writing begins.