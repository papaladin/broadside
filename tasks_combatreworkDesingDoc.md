# Combat Rework — Design Decisions
## B11: Naval Battle, Boarding, and the resolution model behind both

This document is the single source of truth for *what was decided and why* during the
B11 combat rework design pass. It exists so that implementation, future balance changes,
and onboarding a new contributor don't require re-deriving these decisions from
conversation history. Rejected alternatives are recorded deliberately — they represent
real design work, and re-proposing them later without knowing they were already
considered and set aside wastes effort.

---

## 1. Scope decisions (what kind of rework this is)

### 1.1 — Combat's role in the game: Profession Parity

**Decision**: Combat should have equivalent depth, decision density, and completion
time to a full trade loop (assess hold → check prices → decide buy/sell → think ahead
to next port → calculate margin → confirm). A player should be able to specialise in
combat, in trade, or mix both, without either path being strictly dominant.

**Why**: Wave 1 feedback (petripeeduhpedro, Ren, the 608-day save audit) converged
independently on the same complaint — not just "combat is repetitive" but "grappling
became the obviously optimal path to everything," which crowded out trade and
diplomacy entirely. The B8.1 economy revamp already addressed half of this (trade is
now a genuinely profitable, learnable alternative). This decision addresses the other
half: making combat *earn* its rewards through comparable decision density, rather than
remaining a shallow, dominant shortcut.

**Rejected alternatives**:
- *Combat as consequence, not goal* (rare, narrative-weighted, deliberately
  under-rewarded relative to trade) — rejected because it under-serves players who
  enjoy fighting; risks feeling punitive rather than balanced.
- *Combat as pacing/frequent-and-shallow* — rejected explicitly: this is close to
  today's actual system, and building toward "frequent and shallow" would risk
  recreating the exact complaint that motivated this rework in the first place.
- *Combat as rare narrative set-pieces* (named rivals, faction-war escalations,
  replacing generated encounters almost entirely) — rejected as too large a structural
  swing for this pass; some elements of this (rival captains) already have a home in
  the existing roadmap (B19) and don't need to be pulled forward.

---

### 1.2 — Loop duration: single-sitting, not multi-day

**Decision**: A full combat loop (Intercept → Naval Battle → Boarding → Plunder)
resolves in one sitting, the way a trade transaction resolves in one visit — not spread
across multiple `ADVANCE_DAY` ticks the way a voyage or a multi-day pursuit would.

**Why**: Initially explored as a multi-day chase (sighting → pursuit across several
days → engagement), mirroring a voyage's time-extended structure. **This was proposed,
then explicitly reversed** in favor of the single-sitting version: stretching gunfire
or a chase across multiple days risked reading as padding rather than earned depth,
and fights closer to a novel-style story beat than a slow-burn admin loop.

**Rejected alternative**: multi-day pursuit stage (sighting with incomplete
information → days-long chase with daily Close/Hold/Open decisions influenced by wind
→ engagement only once distance closes). Genuinely designed in detail before being set
aside — if a future need arises for a "the hunt is on" narrative beat, this design
exists and could be revisited, but it is **not** part of the current build.

---

### 1.3 — Ammo/medicine as consumable resources: parked

**Decision**: Not included in this pass.

**Why**: Explicitly assessed and set aside — adds resource-tracking complexity without
meaningfully changing the feel of the Intercept → Combat → Boarding sequence this
rework is actually targeting. May be revisited independently later, but is not a
dependency of anything decided here.

---

## 2. The Four-Stage Flow

**Decision**: Every combat encounter proceeds through up to four stages in the same
sitting:

1. **Intercept** — the existing pre-fight menu (Fight / Flee / Parley / Bribe /
   Surrender), now informed by a starting distance value.
2. **Naval Battle** — round-based ship-vs-ship combat, now with a live distance
   mechanic threaded through every round.
3. **Boarding** — a distinct sub-phase entered via successful Grapple, with its own
   action set and its own resolution rules.
4. **Plunder** — largely unchanged, with a light "keep searching vs. leave now" tension
   added as the loop's equivalent of a trade margin decision.

Boarding failing or being abandoned (Fall Back) returns to Naval Battle at Close
distance, not to Intercept — the ships are still adjacent, they simply detached.

---

## 3. Distance System

### 3.1 — Three bands, persistent

**Decision**: Far / Medium / Close. Distance is set once at encounter creation
(derived from `encounterType` — e.g. a navy patrol or hostile port entry starts Close;
a random "sail spotted" encounter starts Far or Medium) and persists round to round
until an action explicitly changes it.

### 3.2 — Legal actions are distance-gated, not universal

**Decision**:
- **Far**: Broadside, Precision, Close Distance, Evade
- **Medium**: Broadside, Precision, Close Distance, Open Distance
- **Close**: Broadside, Precision, Open Distance, Grapple

**Why**: Gating Evade to Far-only and Grapple to Close-only wasn't just a balance
choice — it eliminates an entire category of pairing that would otherwise need
defining (Evade and Grapple can now never occur in the same round, since they don't
share a distance band). This directly reduced the total combination space that needed
independent resolution rules.

**Rejected alternative**: all five combat actions available at every distance, with
availability/effectiveness purely modified rather than gated. Rejected because it
multiplied the number of pairings needing bespoke resolution without adding meaningful
choice — a player would rarely choose Evade at Close range even if legal, given the
contest math; making it illegal there instead removes a dead option and shrinks the
rules surface.

### 3.3 — Damage multipliers by distance

| Action | Far | Medium | Close |
|---|---|---|---|
| Broadside | 0.6× | 1.0× | 0.9× |
| Precision | 1.1× | 1.0× | 0.7× |

**Why these values**: Broadside (full cannon sweep) needs room to be effective, and
suffers close in; Precision (aimed shot) rewards standoff distance and suffers in
frantic close-quarters exchange. This gives Far/Close a genuine tactical identity
instead of Medium being strictly best for everything.

### 3.4 — The reposition contest formula (shared across all contested actions)

**Decision**: One formula, reused for every contested pairing (Close vs Open, Grapple
vs Open, Evade vs Close):

```
contestChance = 0.5 + (actorSpeed − opposerSpeed) × 0.03,  clamped to [0.15, 0.85]
```

**Why one shared formula**: deliberately reused rather than tuned independently per
pairing, so speed differential means the same thing everywhere in the system, and
balance changes only need to happen in one place.

---

## 4. Naval Battle Resolution Order

**Decision (final, after two revisions during design)**:

1. **Evade** — resolves first. Contested only against an opposing **Close Distance**
   declaration; succeeds automatically against every other action, ending the
   encounter cleanly with **no damage taken from anything else declared that round.**
2. **Damage** — Broadside/Precision resolve, using the distance as it stood at the
   *start* of the round (never a same-round repositioned distance). Both hull damage
   and crew loss apply here, as they already do in the existing combat resolver.
3. **Hull/Crew check** — if this round's damage brought either side's hull *or* crew to
   0, the encounter ends immediately in defeat/victory (see Section 6 for the
   sunk-vs-captured distinction and tie-break rules). Steps 4–5 never run if this
   fires.
4. **Reposition** — Close/Open pairs resolve: mutual agreement is always free (no
   contest when both sides want the same thing); Close-vs-Open is contested via the
   Section 3.4 formula.
5. **Grapple** — resolves last, against whatever distance now stands after step 4.
   Requires Close distance to succeed. Mutual Grapple (both sides declare it, distance
   was already Close, nobody repositioned) succeeds automatically and transitions to
   Boarding.

### 4.1 — Rejected/revised orderings, and why the final one won

**First version**: Evade → Grapple → Reposition → Damage, with an explicit "defeat
override" step needed at the end to retroactively cancel a Grapple/Boarding transition
if the same round's damage had actually been lethal.

**Problem found**: this allowed a sequence where Grapple's success was computed, then
had to be *undone* after the fact if damage turned out to be lethal — a
resolve-then-cancel pattern rather than a clean sequential gate.

**Second version (accepted)**: reordering to Evade → Damage → Hull/Crew check →
Reposition → Grapple eliminates the need for any retroactive cancellation. A lethal hit
simply means Grapple is never evaluated at all that round, because the encounter has
already ended by the time step 5 would run.

**Known behavior change accepted as a consequence of the reorder**: under the new
order, **Grapple vs Open Distance at Close range is no longer a speed contest — Open
always wins.** Because Reposition (step 4) now resolves strictly before Grapple (step
5), a successful Open Distance moves the encounter out of Close range before Grapple's
precondition is even checked, so Grapple simply fails to meet its own requirement. This
was flagged explicitly during design and **accepted deliberately** rather than
patched around with a special-case exception (which would have reintroduced the exact
kind of per-pairing carve-out the reordering was meant to eliminate).

**Mitigation, not a mechanical fix**: since Open now deterministically beats Grapple,
the enemy AI needs tuning so it doesn't reflexively choose Open Distance every time
it's at Close range and outmatched — otherwise the player could rarely ever
successfully board. This is an AI-behavior tuning task (see Section 8), not a rules
change.

### 4.2 — Evade's own correction, mid-design

**First version**: a failed Evade (i.e. Evade declared against anything other than an
opposing Close) still let the opponent's declared action land as a "parting shot,"
including lethal damage.

**Problem found**: this meant a "successful" evade could still result in the evading
ship being reduced to 0 hull in the same round — logically incoherent (an escape that
kills you isn't an escape).

**Final version**: Evade is **only ever contested against an opposing Close Distance
declaration.** Against every other action (Broadside, Precision, Open, Grapple — though
Grapple can't co-occur with Evade given the distance gating in 3.2), Evade succeeds
automatically with **zero damage taken from anything else that round.**

---

## 5. Naval Battle — Full Pairing Table

Legend: Br = Broadside, Pr = Precision, Cl = Close Distance, Op = Open Distance,
Ev = Evade, Gr = Grapple.

### Far (legal: Br, Pr, Cl, Ev)

| Pairing | Resolution |
|---|---|
| Br/Pr vs Br/Pr (any combination) | Both fire at Far multiplier. No distance change. |
| Br/Pr vs Cl | Firer deals damage; closer's move uncontested → Medium. |
| Br/Pr vs Ev | Evade succeeds automatically, no damage, encounter ends. |
| Cl vs Cl | Mutual → Medium, no damage. |
| Cl vs Ev | Contested (Section 3.4). Evader wins → encounter ends. Closer wins → Medium, encounter continues. |
| Ev vs Ev | Mutual break-off, encounter ends. |

### Medium (legal: Br, Pr, Cl, Op)

| Pairing | Resolution |
|---|---|
| Br/Pr vs Br/Pr (any combination) | Both fire at Medium multiplier (1.0×). No distance change. |
| Br/Pr vs Cl | Firer deals damage; closer uncontested → Close. |
| Br/Pr vs Op | Firer deals damage; opener uncontested → Far. |
| Cl vs Cl | Mutual → Close, no damage. |
| Op vs Op | Mutual → Far, no damage. |
| Cl vs Op | Contested. Winner's direction applies, no damage. |

### Close (legal: Br, Pr, Op, Gr)

| Pairing | Resolution |
|---|---|
| Br/Pr vs Br/Pr (any combination) | Both fire at Close multiplier. No distance change. |
| Br/Pr vs Op | Shot resolves first. If it defeats the opener, encounter ends (Section 6). Otherwise Open resolves uncontested → Medium. |
| Br/Pr vs Gr | Shot resolves first, Close multiplier. If it defeats the grappler, encounter ends — Grapple never evaluated. Otherwise, no reposition this round → Grapple succeeds → Boarding begins. |
| Op vs Op | Mutual → Medium, no damage. |
| Gr vs Gr | No reposition declared → distance stays Close → mutual Grapple → Boarding begins. |
| Op vs Gr | Open resolves uncontested at step 4 (nothing opposes it — Grapple isn't a repositioning action) → Medium → Grapple fails (Close no longer satisfied). **Open always wins this pairing** — see Section 4.1 for why this is accepted, and Section 8 for the required AI mitigation. |

---

## 6. Defeat Outcomes: Sunk vs Captured

**Decision**: two distinct defeat outcomes, not one generic "encounter ends in loss":

- **Sunk** — hull reaches 0. No plunder possible.
- **Captured** — crew reaches 0 while hull remains above 0. Full plunder available —
  an intact, undefended ship is a *better* prize than a sinking one, not an
  equivalent-or-worse outcome.

**Why**: this distinction was surfaced by checking the actual codebase, which
confirmed Broadside and Precision already produce crew losses as a side effect of
every hit (`crewLoss = dmg × 0.4/3` for Broadside, `dmg × 0.1/3` for Precision),
entirely independent of hull damage. This means a crew-zero-while-hull-intact state
was already reachable under the existing combat math — it simply had no defined
outcome before this design pass. Rather than force it into the same bucket as a sunk
ship, giving it its own (better, for the victor) resolution adds real texture for free.

### 6.1 — Tie-break rule 1: mutual defeat in the same round

**Decision**: if both sides hit a zero-condition in the same round (both hull, both
crew, or one of each), **player defeat takes priority over enemy defeat**, regardless
of what else happened to the enemy in the same exchange.

**Why this is not just a tie-break convenience**: the B9 softlock-detection system
(wash-ashore, `isUnrecoverable`) is keyed entirely off the *player's* hull/crew hitting
0. If a mutual-defeat round resolved as a player victory, the safety net that's
supposed to fire whenever the player's ship is genuinely gone would never trigger —
a real correctness bug, not a cosmetic edge case. This rule is required for B9 to
function correctly, not optional polish.

### 6.2 — Tie-break rule 2: same-side dual condition

**Decision**: if the *same* side's hull and crew both hit 0 from the same shot
(mechanically possible, since one hit produces both effects simultaneously), **Sunk
overrides Captured.**

**Why**: Capture only makes sense as an outcome for a vessel that still exists to be
seized. A hull that's reached 0 means there's no ship left, regardless of what also
happened to its crew in the same instant.

---

## 7. Boarding Phase

### 7.1 — Effective strength formula

**Decision**:
```
effective = crewCount × (0.5 + morale/200)
ratio = playerEffective / (playerEffective + enemyEffective)
```

Recomputed every round as losses accumulate on either side.

**Enemy morale stand-in**: the enemy object doesn't currently track morale (confirmed:
`generateEnemy` returns `{ name, faction, hull, cannons, crew }` only). **Decision**:
derive a morale-equivalent from the encounter's risk tier — tougher encounters fight
with more resolve in the boarding phase, which is both nearly free to implement and
adds coherent texture (a high-risk enemy shouldn't just have bigger stats, it should
also fight harder hand-to-hand).

### 7.2 — Boarding actions

| Action | Available when | Effect |
|---|---|---|
| **Continue Fighting** | always (default) | Mutual casualties: `playerLossPct = 0.15 × (1 − ratio)`, `enemyLossPct = 0.15 × ratio`. `ratio` recomputes for next round. |
| **Fall Back** | always | Unconditionally ends boarding, returns to Naval Battle at Close distance. One-sided cost to the retreater: `0.15 × (1 − ratio)`, same shape as Continue's formula, applied only to the retreating side. Waived if both sides Fall Back the same round. |
| **Demand Surrender** | `ratio ≥ 0.65` from the declarer's perspective | `successChance = (ratio − 0.5) × 2`. Success: boarding ends, full plunder. Failure: one-sided cost to the demander (same formula as Fall Back's cost). |
| **Surrender** | always | Ends the encounter outright. Deliberately harsher terms than Naval-Battle-phase surrender (bigger cargo loss, bigger morale hit) — yielding with enemy crew already on your deck is a materially weaker position than surrendering before contact. |

**Note on `Demand Surrender` vs `Demand Surrender`**: mathematically impossible, not
merely unlikely — `ratio` is zero-sum between the two sides, so both can never
independently clear the 0.65 threshold simultaneously. Excluded from the pairing table
rather than defined.

### 7.3 — Boarding resolution order

1. **Surrender** — final if either side declares it; nothing else evaluates.
2. **Demand Surrender vs Fall Back** — automatic success (see 7.4 for why this changed).
3. **Demand Surrender vs Continue** — resolves via the probability roll.
4. **Fall Back** (mutual or one-sided) — apply any casualty cost, **then check for 0
   crew before finalizing the return-to-Naval-Battle transition.**
5. **Continue vs Continue** — apply mutual casualties, **then check for 0 crew before
   allowing another boarding round to begin.**

### 7.4 — Revision: Demand Surrender vs Fall Back

**First version**: resolved via the same probability roll as Demand-vs-Continue.

**Problem found**: illogical — if the enemy is already trying to disengage while the
player demands their surrender, rolling for it as if they were still fighting doesn't
match the situation. A retreating crew has no stomach to reject terms.

**Final version**: automatic success. This became its own explicit row in the pairing
table rather than a probability-based one.

### 7.5 — General principle: crew-zero checks take priority over transitions

Applied uniformly: **any casualty-producing step, in either phase, checks for a side
reaching 0 crew immediately after the casualty applies, and this check takes priority
over any transition that same step (or a later step in the same round) would
otherwise produce.** This is the same principle as the Naval Battle hull/crew check in
Section 4, applied a second time to boarding's Fall Back and Continue actions
specifically — it's what correctly handles "the retreating side's last man dies on the
way out" without needing special-cased handling per action.

---

## 8. NPC Behavior — Explicitly Deferred

**Decision**: this design pass defines the *rules* both sides operate under, not the
enemy's decision-making. A stub/simple AI (closely modeled on the existing static-weight
approach already in the game) is sufficient for this implementation phase.

**Two known tuning requirements already identified**, to be addressed in the *next*
design pass, not this one:

1. The AI should not reflexively choose Open Distance every time it's at Close range
   and disadvantaged — since Open now deterministically beats Grapple (Section 4.1),
   an AI that always tries to open would make successful boarding rare for the player.
2. The AI should not fall back from boarding too eagerly — if it does, the player
   ends up bouncing between Naval Battle and Boarding repeatedly without ever reaching
   a clean Plunder, which defeats the purpose of the rework rather than fixing the
   original "combat is too easy" complaint.

Both are flagged here so the implementation task list can stub something reasonable now
without conflating "build the rules" with "tune the opponent," which are different
kinds of work.

---

## 9. UI Decisions

- **Advantage bar during Boarding**: a single split bar (player-advantage vs
  enemy-advantage, summing to 100%, derived from `ratio`) displayed as a card above the
  action buttons, recalculated and redrawn each round. Crew count (and the
  morale-equivalent from Section 7.1) shown per side beneath it. Chosen over a raw
  percentage or hidden-information design, consistent with the game's existing
  prose-first, no-hidden-tooltip-critical-info conventions (career stats, faction
  relationships).
- **Unavailable actions**: shown, disabled, with a tooltip explaining why — not hidden
  entirely. Applies uniformly to both Naval Battle (e.g. Grapple disabled at Far/Medium)
  and Boarding (e.g. Demand Surrender disabled below the 0.65 threshold). Consistent
  with the existing player-guide principle of not hiding critical mechanical
  information, especially on mobile.

---

## 10. Summary of All Rejected Alternatives

For quick reference — anyone revisiting this design later should check this list before
re-proposing something already considered:

| Rejected | In favor of | Where discussed |
|---|---|---|
| Ammo/medicine as consumable resources | Parked entirely | Section 1.3 |
| Multi-day pursuit/chase stage | Single-sitting four-stage flow | Section 1.2 |
| Combat as rare/under-rewarded consequence | Profession parity with trade | Section 1.1 |
| Combat as frequent-and-shallow pacing | Profession parity with trade | Section 1.1 |
| Combat as rare narrative set-pieces | Profession parity (set-pieces may return via B19) | Section 1.1 |
| All 5 actions legal at every distance | Distance-gated legal action sets | Section 3.2 |
| Per-pairing independently tuned contest odds | One shared contest formula | Section 3.4 |
| Evade → Grapple → Reposition → Damage ordering | Evade → Damage → Check → Reposition → Grapple | Section 4.1 |
| Retroactive defeat-override after Grapple resolves | Sequential gate, no undo needed | Section 4.1 |
| Evade taking a "parting shot" on partial failure | Evade succeeds cleanly against everything but Close | Section 4.2 |
| Grapple vs Open as a special-cased contest post-reorder | Accept deterministic Open-wins, fix via AI tuning | Section 4.1 |
| Crew-zero folded into the same outcome as hull-zero | Distinct Sunk vs Captured outcomes | Section 6 |
| Demand Surrender vs Fall Back resolved via roll | Automatic success | Section 7.4 |