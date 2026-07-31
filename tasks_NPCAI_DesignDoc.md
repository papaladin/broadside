# NPC Combat AI — Design Decisions
## Companion to design_combat_rework.md — covers enemy decision-making only

This document defines *how the enemy chooses actions* within the naval/boarding
resolution rules already locked in `design_combat_rework.md`. That document defines
what happens when an action is chosen and by whom it can legally be chosen; this
document defines which action the NPC actually picks, each round, and why.

---

## 1. Architecture: Utility (Scoring) AI, Not a Decision Tree

**Decision**: every legal action, each round, is scored by a small set of independent
numeric signals. The NPC then picks from among the highest-scoring actions via
weighted-random selection, not a fixed decision tree or nested conditionals.

**Why**: a hand-written branching tree ("if hull low and crew high and distance close
and risk high, then...") grows combinatorially with every new signal or action added.
A scoring system stays flat — adding a new signal means adding one more term to a sum,
not multiplying the number of branches. This was chosen explicitly to avoid both
failure modes named during design: an over-engineered subsystem, and an unmaintainable
pile of conditionals.

**Rejected alternative**: a formal behavior tree or finite state machine per
archetype. Rejected as more machinery than this game's combat depth warrants — scoring
achieves the same "feels intentional, varies by situation" result with a fraction of
the implementation and testing surface.

---

## 2. Core Requirement: Side-Agnostic Scoring Functions

**Decision**: the scoring and selection functions must be written generically — taking
a `self` snapshot and an `opponent` snapshot as plain data, never reading directly from
`encounterSession.enemy` / `encounterSession.battle.player*` by name inside the scoring
logic itself. The shipped game's enemy-decision function is a thin wrapper that
extracts `self = encounterSession.enemy`, `opponent = player-side view`, and calls the
generic scorer.

**Why this matters beyond code cleanliness**: this is what makes the self-play
simulation harness (Part 8 of the task list) valid. If the enemy's decision logic were
hard-wired to "I am always `encounterSession.enemy`," there would be no way to run
NPC-vs-NPC battles using the *actual shipped scoring logic* — the harness would need a
separate reimplementation, which could silently drift from production behavior and
give misleading balance signal. Writing the scorer generically means the harness calls
the exact same function twice per round, once from each side's point of view, with
zero duplicated logic.

---

## 3. What Was Removed From the NPC's Action Set, and Why

### 3.1 — Evade removed entirely

**Decision**: the NPC never declares Evade. Every naval battle now resolves to the
enemy being Sunk, Captured, or the player successfully Evading/fleeing — never "the
enemy got away."

**Why**: mission logic (patrol/hunt/assault completion, `enemyDefeated` flags) is
already built around the assumption that engaging an enemy leads to a defeat/capture
outcome. Allowing the NPC to flee reopens exactly the kind of "did the mission actually
resolve" ambiguity the encounter-session refactor was built to eliminate. Removing it
is a simplification with a real payoff, not a compromise.

**Consequence for the pairing tables**: this doesn't remove the *pairing* where the
player declares Evade against an NPC's Close Distance (that contest still exists,
symmetrically, exactly as designed in `design_combat_rework.md`) — it only removes the
NPC's own ability to *initiate* a flee attempt.

### 3.2 — Demand Surrender removed entirely

**Decision**: the NPC never declares Demand Surrender. The player may still use it
against the NPC (per the existing boarding rules); the NPC may still voluntarily
Surrender on its own initiative; but the NPC never forces the surrender-demand roll
against the player.

**Why**: keeps the player's own crew/ship never at risk of an externally-imposed
capitulation they didn't choose — consistent with the game's broader design instinct
of not taking control away from the player without an explicit action on their part.

### 3.3 — What remains

**Naval phase**: Broadside, Precision, Close Distance, Open Distance, Grapple.
**Boarding phase**: Continue Fighting, Fall Back, Surrender.

---

## 4. Signal Tiers

### 4.1 — Tier 1: Static signals (computed once, at battle start)

These come from the encounter's origin and the player's standing — not from how the
fight is currently going. They establish the NPC's *personality* for the whole
encounter.

| Signal | Source | Actions it touches |
|---|---|---|
| Faction archetype | `enemy.faction` | Broadside, Precision, Close, Open, Grapple (the full tactical personality axis) |
| Risk intensity | `enemy.risk` | Broadside, Precision, Grapple, Continue Fighting, Fall Back |
| Origin modifier | `encounterSession.type` | Grapple, Continue Fighting (small deltas only — hunt/mission targets more aggressive, escort-defenders more defensive) |
| Reputation (player's standing with enemy's faction) | `state.reputation[...]` | *(No longer touches Evade — NPC has none. Retained as a future hook for Surrender willingness, see 4.1.1)* |
| Heat with enemy's faction | `state.factionAlerts` | Continue Fighting (revenge/won't-back-down — raises willingness to keep fighting rather than fall back) |
| Fame | `state.fame` | Surrender (raises NPC's willingness to yield to a well-known captain) |
| Infamy | `state.infamy` | Surrender (suppresses — "better to sink than be taken by that captain"), Continue Fighting (small raise) |

**4.1.1 — Reputation's reduced role**: with Evade removed, reputation loses its
original touchpoint entirely. Rather than force it onto an action where it doesn't
clearly belong, it's retained only as a minor modifier on the NPC's own voluntary
Surrender threshold (hostile standing = less willing to yield) and otherwise left
available for future encounter-origin work rather than shoehorned in now.

### 4.2 — Tier 2: Dynamic signals (recomputed every round, from live battle state)

| Signal | Derived from | Actions it touches |
|---|---|---|
| Hull advantage | own hull% vs. opponent hull% | Broadside/Precision split (badly-hulled favors Precision — can't trade blows, whittles crew instead), Open Distance |
| Crew advantage | own crew vs. opponent crew, normalized | Grapple, Open Distance |
| Speed differential | own speed vs. opponent speed | Close/Open Distance willingness only — does not affect damage-action choice |
| Current distance | `battle.distance` | Filters the legal set; within it, shifts weight toward whichever damage action has the best multiplier there |
| Boarding ratio | `getBoardingRatio` | Continue Fighting, Fall Back (the primary boarding-phase driver) |
| Morale-equivalent (risk stand-in) | boarding phase only | Fall Back **threshold** only — shifts how bad the ratio needs to get before breaking; does not duplicate the ratio's own weight in Continue Fighting's score |

**Open Distance's dual driver (explicit note)**: hull disadvantage and crew
disadvantage are both independent, non-redundant drivers of Open Distance — hull
disadvantage is the ship trying to survive the gunnery duel itself; crew disadvantage
is specifically boarding-avoidance (not wanting to end up somewhere Grapple becomes
live). A ship can be hull-healthy but crew-light (wants distance purely to avoid
boarding) or hull-damaged but crew-heavy (wants distance purely to survive gunfire,
would happily board given the chance). Both signals are summed into Open Distance's
score, not chosen between.

### 4.3 — Morale vs. boarding ratio (not double-counted)

`getBoardingRatio` already blends crew count and morale-equivalent into a single
combat-effectiveness number (`effective = crew × (0.5 + morale/200)`). Using morale
*again* as a separate weight on Continue Fighting would double-count the same
underlying signal. Morale's only additional role is as a **threshold shift** on Fall
Back — a high-morale side tolerates a worse ratio before breaking; a low-morale side
breaks earlier at the same ratio. This is a distinct axis (risk tolerance) from combat
power (which the ratio already captures), and it's the only place morale acts
independently of the ratio.

---

## 5. Selection Mechanism

**Decision**: weighted-random selection among the top-scoring actions each round —
not pure `argmax` (always picking the single highest score).

**Why**: pure argmax makes the NPC fully deterministic — the same state always produces
the same choice, which reads as robotic over a long fight (and is trivially
predictable once a player learns the pattern). Weighted-random over the top few scores
keeps behavior strongly biased toward sensible choices while introducing enough
variation that repeated encounters against the same archetype don't feel identical.

---

## 6. Combat Flavor Text — Shares the Same Disposition Computation

**Decision**: the intercept-phase narrative description (previously discussed as a
"what kind of fight is this going to be" flavor generator) reads the *same* computed
Tier 1 disposition values used to drive the NPC's actual scoring — it is not a
separately-authored decorative pass.

**Why**: this is the same idiom already used by `generatePortGossip` and
`generateMarketFlavour` (read several state signals, pick from templated text pools)
applied to a new screen — not a new system. Sharing the disposition computation means
the flavor text is a genuine, non-gamey readout of what the player is about to face
("they're already closing — no interest in talking" for an aggressive, close-preferring
archetype; "they look like they'd rather not be here" for a low-resolve, flee-prone
one) rather than flavor that could contradict what actually happens in the fight.

---

## 7. Explicitly Deferred, Not Rejected

**Action-pattern memory** (the NPC noticing "I've fired Precision three rounds running,
time to change approach") was considered and set aside — not because it's a bad idea,
but because the Tier 2 instantaneous signals (hull%, crew%, distance) already capture
the *result* of any pattern of prior rounds, just not the sequence of actions that
produced it. This is a legitimate v2 enhancement if playtesting shows the baseline
scoring AI doesn't feel sufficiently reactive — but it's additive, and shouldn't be
built speculatively before knowing it's needed.

---

## 8. Summary Tables

### Player actions — what influences the *result* (no probability layer; player chooses freely)

| Action | Phase | Result influenced by |
|---|---|---|
| Broadside | Naval | Distance multiplier, own cannons, equipment effects |
| Precision | Naval | Distance multiplier, `precisionHitPct` equipment |
| Close Distance | Naval | Speed contest, only if opponent declares Open |
| Open Distance | Naval | Speed contest, only if opponent declares Close |
| Evade | Naval | Speed contest, only if opponent declares Close; automatic success otherwise |
| Grapple | Naval | Requires Close; speed contest only if opponent declares Open; pre-empted by a same-round lethal shot |
| Continue Fighting | Boarding | `getBoardingRatio` |
| Fall Back | Boarding | `getBoardingRatio` (one-sided cost); transition always succeeds |
| Demand Surrender | Boarding | Available only at ratio ≥ 0.65; success chance `(ratio − 0.5) × 2` |
| Surrender | Boarding | No roll — always succeeds |

### NPC actions — result vs. selection probability

| Action | Phase | Result influenced by | Selection probability influenced by |
|---|---|---|---|
| Broadside | Naval | Distance multiplier, enemy cannons | Faction archetype, risk, own hull advantage, distance suitability |
| Precision | Naval | Distance multiplier | Faction archetype, risk, own hull *disadvantage*, distance suitability |
| Close Distance | Naval | Speed contest, only if player declares Open | Faction archetype, own crew advantage |
| Open Distance | Naval | Speed contest, only if player declares Close | Faction archetype, own hull disadvantage **and** own crew disadvantage (independent) |
| Grapple | Naval | Requires Close; speed contest only if player declares Open; pre-empted by lethal shot | Faction archetype, risk, origin, own crew advantage |
| Continue Fighting | Boarding | `getBoardingRatio` (risk stand-in on NPC side) | Risk, heat, current ratio |
| Fall Back | Boarding | `getBoardingRatio` (one-sided cost) | Risk (inverse), morale-standin threshold, current ratio (inverse) |
| Surrender | Boarding | Always succeeds if chosen | Fame (raises), infamy (suppresses), very low ratio |

**Evade and Demand Surrender do not appear on the NPC side** — removed per Section 3.

---

## 9. What This Design Does Not Cover

- Exact numeric weight values for the faction archetype table — that's a tuning pass,
  informed by the simulation harness (task list Part 8), not a design decision made in
  the abstract.
- Any change to the naval/boarding resolution rules themselves — those are entirely
  owned by `design_combat_rework.md` and untouched here.
- Ally or escort-companion combat behavior — out of scope, would extend this same
  scoring approach if built later.