# B12 — Navigation & Sea Incidents

## 1. Design philosophy and agreed decisions

### B12 goal

B12 is not a “make sailing busier” pass. The goal is to make significant things that happen at sea more memorable, consequential, and connected to existing game systems.

Quiet sailing days are intentional. Do not increase random-event frequency, patrol frequency, or generic event density merely to reduce dead air.

When something significant happens, it should preferably:
1. create a meaningful choice;
2. escalate into an existing system such as combat, crew, cargo, navigation, reputation, or heat;
3. leave a consequence that survives beyond the event screen; or
4. reveal something meaningful about the crew, faction, or world.

The target is **depth over density**: fewer forgettable “choose your reward” interruptions, more incidents that produce a story or lasting state change.

### Major incidents versus atmospheric events

Not every event needs to become multi-step.

Some events should remain simple because their purpose is to make the sea feel alive rather than create optimization problems. Doldrums/calm winds and whale sightings are intentionally kept in this category for B12 V1.

A major event does not need to become a long minigame. A short incident with consequences that matter later can be more valuable than a lengthy self-contained sequence.

### Reuse existing systems before creating new ones

B12 should preferentially reuse:
- naval and boarding combat;
- voyage rerouting and sea-position reachability;
- crew roster, morale, faction alignment, tags, scars, and traits;
- cargo, provisions, gold, reputation, heat, infamy, and mission state;
- existing intercept actions such as fight, flee, parley, bribe, surrender, and inspection;
- existing notable-NPC and encounter-session plumbing.

Do not create a parallel minigame when an existing subsystem can express the intended incident.

### Event origin must survive escalation

An event and the encounter it creates are not the same concept.

The system should preserve why an encounter happened independently from the phase it is currently in. Entering battle must not turn a specific event into a generic `"patrol"` encounter merely because a generic fallback exists.

Desired flow:

```text
sea event
  ↓
event decision
  ↓
optional escalation
  ↓
encounter with preserved source/origin
  ↓
intercept / battle / plunder
  ↓
aftermath
```

Encounter phase is a state transition, not a new encounter identity.

### Patrols should become a real decision loop

A patrol should not be reduced to “inspect or fight”. Different captain builds should create different legitimate responses.

Desired shape:

```text
PATROL
  ├─ Flee
  │    ├─ success → escape + heat
  │    └─ failure → battle
  │
  ├─ Bribe, when appropriate
  │    └─ meaningful cost → avoid escalation
  │
  ├─ Inspect
  │    ├─ clean hold → pass
  │    └─ contraband found → surrender it or resist
  │
  └─ Fight
       └─ battle + meaningful heat/reputation consequences
```

For smuggling, a fast ship should make escape easier, but repeated fleeing must create heat so smuggling never becomes a zero-risk “fast ship prints gold” strategy.

### B12 V1 success criterion

The test is not “how many events happen per voyage”.

The test is:

> **Will the player remember what happened?**

A successful B12 incident should make the player think “I found that wreck and got ambushed”, “I barely outran that patrol”, or “that merchant survived because I intervened”, rather than “I clicked a button and got +X gold”.

---

# 2. Detailed implementation task list

## B12.1 — Clean up encounter taxonomy and preserve event origin

**Dependency:** None. This should be the first implementation task.

**Impacted files:** `logic_combat_encounter.js`, `engine_encounter.js`, `engine_battle.js`, `tests_logic.js`, `tests_engine.js`, `tests_integration.html`, and relevant specs/docs.

### B12.1.1 — Remove obsolete `navy_patrol_combat`

- [ ] Treat `navy_patrol` as one encounter identity that moves through `intercept`, `battle`, and later phases.
- [ ] Remove `navy_patrol_combat` from encounter creation and transition logic.
- [ ] Replace checks that distinguish `navy_patrol` and `navy_patrol_combat` with the single identity plus encounter phase.
- [ ] Update initial-distance rules, heat handling, flee handling, tests, and documentation.

### B12.1.2 — Remove unused encounter-session `patrol`

- [ ] Keep the mission type named `patrol`; this task only removes the encounter-session type `"patrol"`.
- [ ] Keep debug combat using `"random"`.
- [ ] Remove the generic event-escalation fallback that creates `encounterSession.type === "patrol"`.
- [ ] Future event-triggered combat must preserve its actual origin.

### B12.1.3 — Preserve source/origin when an event escalates

Minimum concepts:

| Concept | Purpose |
|---|---|
| Encounter identity | What kind of encounter is being resolved. |
| Source/origin | Why it happened, such as random event, mission, navy patrol, or debug. |
| Phase | Current step such as intercept, battle, or plunder. |

Do not build a large generalized encounter ontology in V1.

Examples:

```text
drifting_wreck
  → search
  → ambush
  → combat
```

must remain identifiable as a wreck-origin incident.

```text
distressed_merchant
  → defend merchant
  → pirate combat
```

must remain identifiable as a merchant-distress incident.

### B12.1.4 — Reduce hard-coded type lists

The current context builder contains several independent lists deciding whether an encounter can flee, parley, bribe, or surrender.

- [ ] Remove duplicated entries created only by `navy_patrol_combat`.
- [ ] Separate encounter identity from phase restrictions.
- [ ] Prefer explicit encounter rules when they are already available.
- [ ] Do not introduce a large generic rules framework unless the concrete B12 changes require it.

### B12.1.5 — Cross-check actual intercept options

- [ ] Verify every active encounter type against actual `buildEncounterContext` output and InterceptScreen behavior.
- [ ] Resolve discrepancies between code, tests, and the reference table.
- [ ] Add/update tests for final option sets.

At minimum verify:
- mission combat;
- escort defense;
- navy patrol;
- hostile port entry;
- distressed merchant defense;
- distressed merchant plunder;
- debug/random combat.

### B12.1.6 — Regression checks

- [ ] Patrol missions still work.
- [ ] Navy patrol fights/flees apply correct heat.
- [ ] Debug combat still uses `"random"`.
- [ ] Merchant-distress escalation still reaches normal combat.
- [ ] No runtime path creates `navy_patrol_combat`.
- [ ] No runtime path uses encounter-session `"patrol"` for random-event combat.

---

## B12.2 — Storm: add one meaningful alternative

**Dependency:** B12.1 recommended. Reuse existing voyage/sea-position routing.

**Impacted files:** `data.js`, `engine_encounter.js`, possibly `logic_travel_events.js` and `screens_voyage.jsx`, plus tests.

### B12.2.1 — Keep “Brace for impact”

Preserve the current direct-risk behavior:

```text
Brace
  → accept storm
  → immediate hull/crew/time consequences
```

### B12.2.2 — Add “Seek shelter / Detour”

Desired shape:

```text
Storm
  ├─ Brace
  │   └─ higher immediate storm cost
  │
  └─ Seek shelter / Detour
      └─ route/time cost
          → reduced direct storm exposure
```

Requirements:

- [ ] Use existing sea-position/route logic.
- [ ] Impose a real cost, primarily time and/or route disruption.
- [ ] Reduce at least one direct storm consequence enough to create a real tradeoff.
- [ ] Keep active missions coherent.
- [ ] Calculate from current sea position when already at sea.
- [ ] Do not turn storms into a multi-round weather minigame in V1.

### B12.2.3 — Keep Doldrums simple

- [ ] Do not add extra Doldrums choices or systems in B12 V1.
- [ ] Keep it as a simple meteorological interruption costing time.

---

## B12.3 — Merchant in Distress: deepen existing combat

**Dependency:** B12.1.

**Impacted files:** `engine_encounter.js`, `engine_battle.js`, `logic_combat_encounter.js`, `screens_combat.jsx`, `tests_engine.js`, `tests_ui.js`.

The existing event decision is good and should remain:

| Choice | Intent |
|---|---|
| Defend the Merchant | Fight the attacking pirates. |
| Plunder the Merchant | Fight the merchant. |
| Pass By | Avoid combat and accept the morale consequence. |

### B12.3.1 — Treat the merchant/convoy as a protected objective, not as the player's defeat condition

The protected ship reaching zero HP should **fail the objective without automatically ending the player's combat**.

Desired flow:

```text
Merchant / convoy HP reaches 0
        ↓
Protected-objective failure
        ↓
Apply objective-specific consequences
        ↓
Log what happened
        ↓
Continue the current battle
```

For escort missions:

* [ ] When the convoy reaches 0 HP, automatically abandon/fail the active escort mission.
* [ ] Add a clear log explaining that the convoy was lost and the escort mission failed.
* [ ] Clear the active escort objective state as appropriate.
* [ ] Do **not** end the battle solely because the convoy was destroyed.
* [ ] Allow the player to continue fighting, flee, or otherwise resolve the attackers normally.
* [ ] Do not award the successful escort outcome after the convoy has been lost.

For merchant-defense encounters:

* [ ] When the merchant reaches 0 HP, mark the merchant as lost.
* [ ] Add a clear combat/event log explaining that the merchant was sunk.
* [ ] Do **not** end the battle solely because the merchant was sunk.
* [ ] Allow the player to continue fighting the pirates, flee, and potentially plunder them.
* [ ] If the pirates are defeated after the merchant sinks, award only the normal combat victory/plunder consequences.
* [ ] Do not award the additional merchant-rescue reward, gratitude, reputation benefit, or future notable-NPC relationship associated with saving the merchant.
* [ ] If the merchant survives, preserve the full defender outcome and any associated reward/relationship consequences.

### B12.3.2 — Represent protected-objective outcome explicitly

Do not infer merchant/convoy survival later from whether the overall battle was won.

Use explicit objective state, conceptually:

```text
escortObjective:
    active
    failed
    completed
```

and for merchant defense:

```text
merchantOutcome:
    active
    saved
    sunk
```

The exact state representation should follow the existing `encounterSession` conventions; these are conceptual requirements, not mandatory field names.

### B12.3.3 — Reuse existing escort/convoy combat plumbing

* [ ] Reuse the existing secondary HP/`convoyHull` mechanism where possible.
* [ ] Show the protected objective's HP clearly in the combat UI.
* [ ] Ensure objective failure is visually distinct from player defeat.
* [ ] Preserve normal naval combat resolution for the attacker after the objective is lost.
* [ ] Do not introduce a separate merchant-specific combat system.

### B12.3.4 — Verify both possible outcomes

Test at least:

```text
Merchant survives
  → pirates defeated
  → full defense outcome

Merchant survives
  → player flees
  → merchant was saved, but no combat victory reward

Merchant sinks
  → pirates defeated
  → combat victory/plunder only
  → no merchant rescue reward

Merchant sinks
  → player flees
  → failed rescue, player survives

Player ship defeated
  → normal combat defeat
```

The important rule is:

> **Protected-objective failure is an objective consequence, not automatically a combat-ending consequence.**

---

## B12.4 — Drifting Wreck: make “risky” real

**Dependency:** B12.1.

**Impacted files:** `engine_encounter.js`, `logic_combat_encounter.js` if encounter metadata needs adjustment, `screens_combat.jsx`, `data.js`, tests.

Keep:

```text
Search the wreck (risky)
Leave it be
```

### B12.4.1 — Add a low-probability ambush

Desired distribution:

```text
Search wreck
  ├─ empty
  ├─ reward
  ├─ survivor
  └─ ambush → normal combat
```

Requirements:

- [ ] Keep ambush probability low enough that searching remains a reasonable gamble.
- [ ] Reuse the existing combat system.
- [ ] Preserve wreck origin through escalation.
- [ ] Ensure “risky” is now truthful.
- [ ] Add deterministic tests for every outcome path.

### B12.4.2 — Tune expected value

- [ ] Recheck reward probabilities after adding ambush.
- [ ] Searching should be tempting, but never obviously dominated.
- [ ] Walking away should remain a legitimate safe choice.

---

## B12.5 — Marooned Sailors: make the resource choice truthful

**Dependency:** None, except existing event resolver behavior.

**Impacted files:** `data.js`, `engine_encounter.js`, possibly `logic_economy_crew.js`, tests.

Existing choices:

```text
Take them aboard
Give supplies and gold
Sail on
```

### B12.5.1 — Take them aboard

- [ ] Preserve the three-sailor recruitment concept.
- [ ] Respect crew capacity.
- [ ] Reuse existing crew generation/faction logic.

### B12.5.2 — Give supplies

Make the option actually transfer resources:

```text
Give supplies
  → gold cost
  → food cost
  → water cost
  → morale benefit
  → sailors leave safely
```

Requirements:

- [ ] Required resource amounts are explicit and deterministic.
- [ ] Option is disabled when resources are insufficient.
- [ ] UI explains why it is unavailable.
- [ ] No resource can go below zero.

### B12.5.3 — Sail on

- [ ] Keep a small morale penalty.
- [ ] Consider a chance of an existing thematically relevant crew member becoming upset.
- [ ] Reuse existing faction/alignment/trait systems; do not add a new ethics system.

---

## B12.6 — Treasure-map cleanup and future chart direction

**Dependency:** None.

**Impacted files:** `data.js`, `engine_encounter.js`, hidden-port/chart logic if needed, tests, docs.

### B12.6.1 — Retire `treasure_map`

- [ ] Remove `treasure_map` from the active random-event pool or explicitly mark it retired/unreachable.
- [ ] Ensure no test/tutorial depends on it.
- [ ] Do not replace it with another immediate map-for-gold event.

Reason: it overlaps conceptually with the existing chart/map-fragment system and makes the player's understanding of “map” versus “chart” less clear.

### B12.6.2 — Leave current chart events working

- [ ] Keep `mysterious_chart` and `wreckers_chart` operational for V1.
- [ ] Do not implement the full quest chain yet.

### B12.6.3 — Record future chart direction

Target future flow:

```text
Chart/clue
  ↓
Quest to retrieve/secure fragment
  ↓
Fragment acquired
  ↓
Other criteria satisfied
  ↓
Second quest/unlock
  ↓
Hidden location becomes visible
```

This is parked for later.

---

## B12.7 — Patrol and smuggling inspection flow

**Dependency:** B12.1. This is the largest systemic B12 V1 task.

**Impacted files:** `logic_combat_encounter.js`, `engine_encounter.js`, `engine_battle.js`, `screens_combat.jsx`, `data.js`, tests.

### B12.7.1 — Allow fleeing from navy patrols

Current patrol logic blocks fleeing. Replace that with the existing speed-contest system.

Desired flow:

```text
Patrol
  ├─ Flee
  │    ├─ success → escape + heat
  │    └─ failure → battle
  ├─ Inspect
  ├─ Bribe, when allowed
  └─ Fight
```

Requirements:

- [ ] Reuse existing `INTERCEPT_FLEE`.
- [ ] Successful escape adds faction heat.
- [ ] Failed escape enters normal battle.
- [ ] Fast ships/speed equipment become meaningful.
- [ ] Repeated fleeing must remain self-limiting through heat.

### B12.7.2 — Allow patrol bribes where appropriate

- [ ] Reuse existing bribe affordability and reputation/infamy rules.
- [ ] Cost must be meaningful.
- [ ] Keep cases where bribe is unavailable.
- [ ] Do not create a new smuggling-only bribery currency.

### B12.7.3 — Split inspection from contraband response

Desired flow:

```text
Inspect
  ↓
Check hold
  ├─ clean
  │    → pass
  │
  └─ contraband found
       ↓
       ├─ Hand it over
       │    → lose contraband + applicable fine/consequence
       │
       └─ Resist seizure
            → battle
            → significant heat/reputation consequence
```

Requirements:

- [ ] Do not automatically finish the encounter when contraband is discovered.
- [ ] Present the second choice only when contraband is found.
- [ ] Preserve existing seizure/fine behavior for hand-over.
- [ ] Resistance enters normal combat.
- [ ] Winning preserves remaining contraband according to the normal combat/plunder rules, but has substantial heat/infamy/faction consequences.
- [ ] Losing uses normal defeat/cargo consequences.
- [ ] Hidden Compartment reduces detection/escalation probability; it must not make smuggling risk-free.

### B12.7.4 — Prevent fast-ship smuggling from becoming dominant

Test at least:

```text
Fast ship + smuggling + repeated flee
Fast ship + smuggling + inspect
Slow ship + smuggling + flee
Slow ship + smuggling + bribe
Strong combat ship + smuggling + resist
```

The intended loop is:

```text
smuggle
  ↓
flee patrol
  ↓
heat rises
  ↓
future patrol pressure rises
```

Do not add a new “suspicion” stat unless existing heat/infamy cannot achieve the intended result after tuning.

### B12.7.5 — Reconcile actual option sets

- [ ] Verify the real runtime options for `navy_patrol`.
- [ ] Reconcile the implementation, tests, and reference table if they disagree.
- [ ] Do not infer the final option set from stale documentation.

---

## B12.8 — Validation and regression pass

**Dependency:** All V1 implementation tasks.

**Impacted files:** `tests_logic.js`, `tests_engine.js`, `tests_ui.js`, `tests_integration.html`, and relevant simulation tools.

### B12.8.1 — Event regression matrix

For every modified event, verify:

- correct availability conditions;
- valid/invalid choices;
- resource guards;
- correct return screen;
- mission coherence;
- meaningful log entry.

### B12.8.2 — Encounter regression matrix

Verify:

- no runtime `navy_patrol_combat`;
- no generic encounter-session `patrol` fallback;
- event origin survives escalation;
- debug/random combat remains functional;
- patrol flee/bribe/inspect/fight work;
- contraband discovery creates the intended second choice;
- merchant-distress combat retains its origin;
- wreck ambush retains its origin.

### B12.8.3 — B12 playtest questions

Explicitly observe:

- Does the wreck search feel genuinely risky?
- Does the storm choice feel like a tradeoff?
- Does defending a merchant feel different from generic combat?
- Do patrols create decisions rather than interruptions?
- Can fast ships evade patrols without making smuggling trivial?
- Does contraband discovery create a memorable decision?
- Are quiet sailing days still comfortable and intentional?

---

# 3. Rejected or parked ideas

## B12.P1 — Increase event or patrol frequency

**Rejected.** The problem is not a lack of interruptions. More interruptions would increase busyness without solving forgettable outcomes.

## B12.P2 — Add many new random events before reworking existing ones

**Parked.** Reworking a small number of existing events gives more information and player impact per implementation effort.

## B12.P3 — Rework Doldrums into a multi-choice weather system

**Rejected for V1.** Doldrums are allowed to remain a simple meteorological interruption.

## B12.P4 — Make whale sightings mechanically reactive

**Parked.** Keep the whale as an atmospheric event. Do not turn every observation into a resource optimization.

## B12.P5 — Add fishing, rain-catching, whaling, or similar at-sea activities

**Parked.** These are only worthwhile if they create real route/resource decisions. They should not exist merely to fill quiet sailing time.

## B12.P6 — Multi-round storms

**Parked.** A richer sequential storm model may be worthwhile later, but V1 only needs one meaningful storm alternative.

## B12.P7 — Build a large generalized incident framework

**Parked.** Do not create a broad family/variant/rules abstraction before concrete incidents demonstrate which abstractions are actually necessary.

## B12.P8 — Full mutiny boarding incident

**Parked for the next B12 slice rather than V1.** Mutiny remains the strongest candidate for the first major multi-step incident because it can reuse boarding combat, morale, crew identity, named crew, and aftermath. The intended future flow is:

```text
Mutiny
  ↓
Confront / negotiate
  ↓
crew conflict
  ↓
loyal crew vs mutineers
  ├─ mutineers defeated
  ├─ mutineers surrender
  └─ mutineers prevail
  ↓
persistent crew/morale aftermath
```

Do not build a separate combat minigame. Reuse or extract the crew-vs-crew portion of boarding once the concrete mutiny implementation justifies it.

## B12.P9 — Full hidden-port chart quest chain

**Parked.** Keep current chart/map-fragment scaffolding for now. Later, make chart discovery start a quest to secure the fragment and a later quest/condition reveal the location.

## B12.P10 — Add a dedicated smuggling suspicion stat

**Rejected for V1.** First use existing heat, infamy, reputation, speed, bribe, contraband, and combat systems.

## B12.P11 — Full crew relationship/trait-event system

**Parked for B15/B16/B17.** B12 may use existing crew identity in small ways, but should not become the implementation vehicle for the larger crew relationship system.

---

# 4. Recommended implementation order

```text
B12.1  Encounter taxonomy cleanup
          ↓
B12.7  Patrol / smuggling flow
          ↓
B12.3  Merchant combat refinement
          ↓
B12.4  Wreck ambush
          ↓
B12.5  Marooned Sailors resource logic
          ↓
B12.2  Storm alternative
          ↓
B12.6  Treasure-map cleanup
          ↓
B12.8  Regression + focused playtest
```

The order after B12.1 is flexible, but B12.1 should come first so new escalations do not build on the obsolete patrol/fallback taxonomy.

After V1 is validated, the next B12 slice should use **Mutiny as the first full major incident prototype**. Only then generalize whatever incident plumbing the concrete implementation proves necessary.
