# Broadside — Career Simulator Design Specification

## 1. Purpose

This document locks the design and implementation architecture for the **end-to-end Career Simulator**.

The simulator exists to answer questions that the current specialized tools cannot answer reliably:

> **What does a Broadside career actually look like when the real game engine, economy, voyage loop, events, encounters, combat, crew, progression, and port decisions all interact?**

The simulator must therefore **exercise the actual game implementation** rather than reproduce a simplified version of its rules.

The accompanying `career-simulator-policy-spec.md` defines how simulated captains make decisions. This document defines:

- what the simulator runs;
- what it observes;
- how it drives the real engine;
- how runs are seeded and reproduced;
- what is stored;
- what is measured;
- what is visualized;
- how personas and policies are integrated;
- how the implementation should be structured;
- how the simulator should be tested.

The intended result is a reusable development tool, not a second game implementation.

---

# 2. Design principles

## 2.1 One source of truth

The actual Broadside implementation is the source of truth for game mechanics.

The simulator must not duplicate mechanics such as:

- travel duration;
- provision consumption;
- mission generation;
- event probabilities;
- patrol probabilities;
- combat formulas;
- crew-loss formulas;
- reward calculations;
- reputation changes;
- heat changes;
- ship statistics;
- equipment effects;
- plunder rules.

Where the game already has a function or reducer for a behavior, the simulator must call that behavior rather than reproduce its logic.

A simulator-specific implementation is acceptable only for **player decision-making, observation, metrics, orchestration, and simulation control**.

---

## 2.2 The simulator is a player, not a second engine

The simulator's role is:

```text
Observe current game state
        ↓
Identify legal player decisions
        ↓
Ask policy which action to take
        ↓
Dispatch real game action
        ↓
Observe resulting state
        ↓
Repeat
```

The simulator must never directly mutate `state`.

All gameplay state transitions go through:

```text
E.reducer(state, action)
```

or the same reducer entry point used by the game.

---

## 2.3 Policies cannot cheat

A policy may use information available to the real player through current state/UI.

A policy may:

- read current gold;
- read current ship and crew;
- read current market data;
- read currently displayed missions;
- calculate visible profit;
- inspect available encounter/event choices;
- compare visible routes;
- use deterministic helper functions that correspond to player-visible information.

A policy may not:

- inspect future RNG;
- inspect future events;
- inspect future market prices;
- know hidden inspection outcomes;
- know the next NPC combat action;
- inspect future mission refresh results before actually refreshing;
- inspect internal random seeds to choose an action;
- invoke a generator merely to preview an outcome that the player would not have seen.

This distinction is fundamental. Otherwise the simulation would measure an omniscient algorithm rather than player behavior.

---

# 3. Career lifecycle

A career starts by running the real `START_GAME` path using a selected starting scenario/persona configuration.

Conceptually:

```text
create simulator run
      ↓
seed RNG
      ↓
E.initialState
      ↓
START_GAME(startingScenario)
      ↓
policy begins observing game
      ↓
repeat:
    observe state
    choose legal action
    dispatch action
    record transition
until:
    game over
    OR
    max simulated day reached
```

The default maximum horizon is **2,000 in-game days**.

The simulator must allow a smaller horizon for targeted tests and a larger horizon for stress runs.

The simulation does not depend on onboarding. A career simulation begins from normal gameplay after `START_GAME`; tutorial/UI progression is not part of the policy experiment.

---

# 4. Starting scenarios

The simulator must support all current starting scenarios.

A batch may be configured as:

```text
one persona × one starting scenario × N runs
```

or:

```text
one persona × all starting scenarios × N runs each
```

The scenario identifier must be included in every run's metadata.

Starting-scenario balancing must therefore be analyzable independently from persona behavior.

---

# 5. Randomness and reproducibility

Every run has:

```text
seed
personaId
scenarioId
simulatorVersion
gameVersion
```

The simulator must use the game's injectable RNG infrastructure.

A deterministic simulation must satisfy:

```text
same game code
+ same simulator code
+ same seed
+ same scenario
+ same persona
= same sequence of decisions and game states
```

The simulator must not use `Math.random()` directly.

The simulator runner owns a deterministic RNG instance and passes/sets it through the supported game RNG mechanism.

Randomness used for game mechanics therefore comes from the same RNG abstraction as normal game logic.

---

# 6. Simulation loop architecture

Implement the runner as a plain JavaScript module independent from the HTML UI.

Recommended structure:

```text
tools/
    sim-career.html
    sim-career.js
```

The HTML is responsible for:

- configuration inputs;
- Run/Stop controls;
- progress display;
- dashboard rendering;
- result browsing;
- JSON/Markdown export.

The JS module is responsible for:

- simulation orchestration;
- policy execution;
- deterministic seeding;
- career tracing;
- metrics collection;
- batch aggregation.

The simulator must be usable without rendering every simulated state.

The UI must never participate in the simulation loop.

---

# 7. Recommended simulator module structure

`sim-career.js` should be organized conceptually into these components:

```text
CareerSimulator
    runCareer(config)
    runBatch(config)

PolicyRegistry
    registerPersona(...)
    getPersona(...)

DecisionContextBuilder
    buildPortContext(...)
    buildMissionContext(...)
    buildEventContext(...)
    buildEncounterContext(...)
    buildBattleContext(...)
    buildPlunderContext(...)

Policy implementations
    NaivePlayerPolicy
    OpportunisticPolicy
    CautiousTraderPolicy
    PrivateerPolicy
    SmugglerPolicy
    PirateRaiderPolicy
    ExplorerPolicy

TraceCollector
    recordAction(...)
    recordDecision(...)
    recordEvent(...)
    recordEncounter(...)
    recordBattle(...)
    recordPortVisit(...)

MetricsCollector
    updateFromTransition(...)
    finalizeCareer(...)

BatchAggregator
    aggregate(careerResults)

Export
    toJSON(...)
    toMarkdown(...)
```

Exact function names may vary, but the separation of responsibilities should remain.

---

# 8. Action-driving model

The simulator must not assume that every action immediately produces a meaningful decision.

The policy runner should inspect the state and determine the current decision context.

Conceptually:

```text
while career active:
    if encounterSession:
        resolve encounter via encounter policy
    else if activeEvent:
        resolve event via event policy
    else if screen represents port:
        resolve port decision
    else if screen represents battle:
        resolve battle action
    else if screen represents plunder:
        resolve plunder decision
    else if sailing:
        dispatch ADVANCE_DAY / route-related action
    else:
        use appropriate neutral/continuation action
```

The actual implementation must use current game state and real screen/session fields rather than hardcoding an assumed screen sequence.

The simulator must never dispatch an action that is not currently legal.

---

# 9. Action result loop

Every policy decision is followed by a real reducer call.

Conceptually:

```text
before = state

action = policy.choose(context)

after = E.reducer(before, action)

record:
    action
    before-relevant-state
    after-relevant-state
    decision reasoning
    game outcome

state = after
```

The simulator should not clone or mutate the state unnecessarily.

For trace purposes, use compact snapshots/deltas rather than retaining every full state object indefinitely.

---

# 10. Policy interface

The policy interface must be generic enough that all personas can use the same runner.

Conceptually:

```text
policy.chooseDecision(context, state)
    -> action + explanation
```

A policy response should contain:

```text
action
reason
scoreDetails (optional)
```

For example:

```text
{
    action: {
        type: E.A.TAKE_MISSION,
        payload: { missionId: "..." }
    },

    reason: "Best available fame-adjusted mission.",

    scoreDetails: {
        gold: 42,
        fame: 18,
        risk: -9,
        duration: -4,
        total: 47
    }
}
```

The policy may return a structured explanation even when no numeric scoring was performed.

---

# 11. Legal-action filtering

The simulator should prefer receiving the list of currently legal/available actions from the real game context.

The policy operates on:

```text
availableActions
```

rather than on a hardcoded assumption that an action is available.

For example:

```text
Navy patrol:
    Inspect
    Bribe
    Refuse/Open Fire

Inspection:
    Hand Over
    Resist

Battle:
    actions permitted by current phase/distance/state
```

If a policy requests an illegal action:

1. do not mutate the game state;
2. record a policy error;
3. invoke a safe fallback action;
4. count the policy error in the run metadata.

The simulator must not silently invent a valid replacement without recording that the policy failed.

---

# 12. Decision context

A decision context is the information passed to a policy.

It should contain:

```text
decisionType
availableActions
visibleState
visibleDerivedValues
currentObjective
```

It should never contain hidden simulator information.

Example mission-selection context:

```text
decisionType: mission_choice
currentPort
gold
fame
heat
infamy
crew
morale
hull
availableMissions
refreshCountUsed
activeMission
```

Example patrol context:

```text
decisionType: patrol_intercept
patrolFaction
currentGold
currentHeat
currentInfamy
currentReputation
cargo
visibleContraband
availableActions
```

The exact context structures should be kept minimal and decision-specific.

Do not pass the simulator's internal objects indiscriminately if they contain hidden information.

---

# 13. Port decision loop

When at port, the policy should be able to make a sequence of actual port actions.

Typical flow:

```text
enter port
    ↓
repair if needed
    ↓
manage crew
    ↓
manage provisions
    ↓
raise morale if desired
    ↓
buy equipment/ship if desired
    ↓
evaluate mission
    ↓
trade if appropriate
    ↓
select destination / SAIL_TO
```

Do not impose this exact order as a game rule. The policy is allowed to prioritize different actions.

The simulator should allow policies to make multiple port decisions before sailing.

A guard is required so that a policy cannot loop indefinitely at a port. If the policy repeats non-progressing actions beyond a configurable threshold, record a policy stall and invoke the policy's fallback.

---

# 14. Mission selection and refresh

The simulator must expose the actual currently generated mission list.

The policy may:

- accept one;
- reject/leave it;
- refresh if legal;
- evaluate again.

The simulator must track refresh count for the current mission-selection session.

Recommended maximum refresh behavior:

```text
Naive: 0 intentional refreshes
Opportunistic: up to 5
Other personas: configured 0–5
```

The simulator must not generate a fresh set of missions itself.

---

# 15. Trade and cargo sourcing

For trade/smuggle mission preparation, the simulator must operate through the real trading system.

The policy can inspect:

- current port stock;
- prices;
- required quantity;
- target port;
- available gold;
- hold capacity.

If mission cargo is unavailable locally, the policy must choose whether to source it elsewhere using actual navigation.

The simulator must not shortcut:

```text buy mission cargo
```

if the real market does not contain enough.

This is particularly important for measuring whether mission preparation creates excessive dead time or routing friction.

---

# 16. Voyage orchestration

A voyage is driven by real `SAIL_TO` and `ADVANCE_DAY` actions.

The simulator must not simply deduct travel days from a counter.

For each simulated day, the actual voyage reducer must be allowed to trigger:

- provision consumption;
- wages;
- wind/travel updates;
- random events;
- patrols;
- mission encounters;
- drunkard/crew events;
- hidden discoveries;
- arrival.

This ensures the career simulator actually measures interaction among those systems.

---

# 17. Event handling

For every event currently supported by the game, the policy specification defines the intended decision behavior.

The simulator must therefore provide event contexts using the actual event choices.

The event handler should record:

```text
event id
day
available choices
chosen choice
policy reasoning
resulting state delta
whether event escalated into encounter
```

When an event escalates into a battle, the same run continues through the encounter and combat systems rather than treating the event as an abstract probability.

---

# 18. Encounter handling

Encounter handling must use the real `encounterSession`.

The simulator must support the currently implemented encounter categories, including:

- mission combat;
- escort defense;
- navy patrol;
- distressed merchant defense;
- distressed merchant plunder;
- pirate ambush / event-origin combat;
- hostile port entry;
- random encounter.

The simulator should not have a separate hardcoded interpretation of what these encounters do.

It asks the current policy to choose from the actual available intercept choices and dispatches the resulting action.

---

# 19. Patrol and inspection handling

The patrol decision tree must be represented explicitly because it can involve multiple decisions:

```text
patrol intercept
    ↓
Inspect / Bribe / Refuse
    ↓
if Inspect
    ↓
clean → encounter ends
    OR
contraband found
    ↓
Hand Over / Resist
    ↓
if Resist
    ↓
boarding battle
```

The simulator must let the policy make each decision from the state available at that point.

It must not decide in advance whether inspection finds contraband.

---

# 20. Combat simulation

Enemy combat behavior should use the actual current NPC AI.

Player behavior should use the policy system.

The simulator must therefore create a genuine asymmetric interaction:

```text
Player policy
       vs
real NPC AI
```

The player policy should be allowed to consider:

- visible battle state;
- action previews;
- crew;
- morale;
- hull;
- distance;
- enemy state;
- mission context;
- expected plunder value.

It may not inspect the enemy's next random action.

Every battle round should be recorded in compact form:

```text
round
player action
enemy action
distance before/after
player hull/crew delta
enemy hull/crew delta
outcome
```

---

# 21. Plunder policy

After a victorious battle that allows plunder, the policy makes the real plunder choice.

The trace must record:

- available goods;
- hold capacity;
- selected goods;
- jettisoned goods if applicable;
- final hold.

The simulator must not award plunder directly.

---

# 22. Crew policy

The simulator should exercise real crew mechanics for:

- hiring;
- dismissal;
- morale;
- crew loss;
- desertion;
- trait revelation;
- positive trait progression;
- named consequences.

The policy may deliberately choose to overstaff/understaff according to persona, but the actual game handles the consequences.

Crew metrics should distinguish:

- hired;
- dismissed voluntarily;
- killed/lost;
- deserted;
- affected by events;
- trait-revealed;
- trait-progressed.

---

# 23. Reputation policy

Reputation is not universally a goal.

The policy system must support both:

```text consequence-driven reputation
```

and:

```text goal-directed reputation
```

The initial Naive policy is consequence-driven.

Opportunistic and persona variants may actively pursue reputation when it has a concrete strategic value.

The trace should record when a policy deliberately chose an action because of reputation.

---

# 24. Heat policy

Heat is primarily an emergent consequence of player behavior.

The initial policies should not continuously "farm" heat downward.

Deliberate low-value travel to cool heat is permitted only when the policy judges high heat to be materially damaging.

The simulator should record:

```text heat before
action
heat after
whether heat management was the stated reason
```

This lets us distinguish natural heat curves from deliberate cooling behavior.

---

# 25. Port spending priority

Every persona must resolve situations where available gold cannot fund all desired actions.

The policy must rank:

```text repair
minimum crew
minimum provisions
mission-critical cargo
equipment
morale
free-trade cargo
discretionary upgrades
```

No persona may knowingly spend operationally essential resources on a discretionary purchase that leaves it unable to sail safely, unless the policy is explicitly classified as a "reckless" variant.

The initial personas do not include a deliberately self-destructive variant.

---

# 26. Career termination

A run ends when:

```text state.gameOverReason != null
```

or when:

```text state.day >= maxDays
```

The simulator must distinguish:

```text natural game-over
horizon reached
policy stall
policy error
simulation error
```

A horizon-reached career is not counted as a game-over.

---

# 27. Policy stall detection

The simulator must guard against infinite loops caused by poor policies or missing action handling.

Recommended rules:

- configurable maximum number of consecutive actions without day progression;
- configurable maximum number of repeated identical actions in the same context;
- hard maximum action count per career.

When triggered:

```text mark run as policy_stall
record last context/action sequence
terminate run
```

This protects batch simulations from hanging.

---

# 28. Trace model

Each career should contain:

```text
CareerTrace
├── run metadata
├── decisions[]
├── transitions[]
├── significantEvents[]
├── encounters[]
├── battles[]
└── portVisits[]
```

The trace should be designed for later AI inspection.

A decision record should contain:

```text
day
location
decisionType
availableActions
chosenAction
persona
reason
scoreDetails
```

A significant-event record should contain:

```text day
type
source
action
outcome
importantStateChanges
```

A battle record should contain a compact round-by-round history.

---

# 29. State snapshots vs deltas

Do not store a full state snapshot after every action by default.

Use:

```text
initial state
+
decision/action trace
+
important state deltas
+
final state
```

Store full snapshots only at meaningful boundaries, for example:

- start of career;
- port arrival;
- mission acceptance;
- event trigger;
- encounter creation;
- battle start;
- battle end;
- game over;
- optionally every N simulated days.

The implementation should make this frequency configurable.

---

# 30. Complete run result

Every career result should include:

```text
{
    metadata,
    finalState,
    summary,
    timeline,
    decisions,
    events,
    encounters,
    battles,
    errors
}
```

### Metadata

```text
runId
seed
personaId
scenarioId
simulatorVersion
gameVersion
maxDays
startDate
```

### Final state

Include enough information to reconstruct the player's final position, but avoid redundant copies of immutable data.

### Summary

At minimum:

```text
careerDays
gameOverReason
finalGold
finalFame
finalInfamy
finalHeat
finalShip
finalCrew
finalMorale
portsVisited
portsDiscovered
missionsTaken
missionsCompleted
missionsFailed
trades
smuggles
battles
battleWins
battleLosses
boardings
plunders
crewHired
crewLost
crewDeserted
events
patrols
storms
goldEarned
goldSpent
tradeGold
missionGold
smuggleGold
repairGold
crewGold
provisionGold
equipmentGold
shipGold
```

Exact metrics may expand later.

---

# 31. Batch aggregation

A simulation batch should aggregate careers without destroying individual runs.

For every relevant metric, calculate at least:

```text count
minimum
maximum
mean
median
p10
p25
p75
p90
```

For rates:

```text numerator
denominator
rate
```

where appropriate.

Do not report only averages for heavily skewed economic/progression data.

---

# 32. Core visualizations

The HTML dashboard should provide prebuilt visualizations for the metrics most useful to game design.

## Career survival

- game-over rate by persona;
- game-over cause distribution;
- career length distribution.

## Progression

- fame over career day;
- gold over career day;
- ship progression timing;
- days to fame thresholds;
- days to first major ship upgrades.

Use median and percentile bands for career trajectories.

## Economy

- gold earned/day;
- gold spent/day;
- mission vs free-trade income;
- repair/provision/crew costs;
- final wealth distribution.

## Activity

- voyages per career;
- port visits;
- events per 100 days;
- patrols per 100 days;
- battles per 100 days;
- boarding frequency;
- plunder frequency.

## Crew

- crew size trajectory;
- morale trajectory;
- crew losses by cause;
- desertion frequency;
- trait/reveal rates.

## Risk

- heat trajectory;
- patrol frequency vs heat;
- combat win rate;
- game-over risk by persona;
- provisioning failures.

## Progression milestones

- time to Cutter/Sloop/etc.;
- time to Fame 50/100/200/350;
- time to important discovery thresholds where applicable.

All visualizations should allow filtering by:

```text persona
starting scenario
```

and, where useful:

```text survived only
game-over only
```

---

# 33. Per-career inspection

The dashboard must allow selecting an individual run and seeing:

```text
career summary
↓
timeline
↓
decision trace
↓
important events
↓
encounters
↓
battles
```

This is essential for debugging policies.

A useful career view should be readable as:

```text
Day 1
  Start: English Privateer
  ...
Day 4
  Accepted Escort mission
  Reason: ...
Day 8
  Navy patrol
  Chose Inspect
Day 8
  Contraband found
  Chose Resist
Day 8
  Boarding battle
  ...
Day 11
  Arrived at Port Royal
  ...
```

The purpose is to identify whether surprising aggregate results come from game mechanics or bad policy behavior.

---

# 34. Batch export

The simulator must support:

### JSON export

Full machine-readable batch.

Recommended structure:

```text
{
    metadata: {...},
    aggregate: {...},
    careers: [...]
}
```

### Markdown export

Human/AI-readable summary containing:

- batch configuration;
- persona definitions;
- aggregate metrics;
- notable findings already calculable by the simulator;
- selected individual careers;
- optionally full traces for selected careers.

### Optional CSV export

Useful for external spreadsheet/Python analysis, with one row per career for aggregate metrics.

---

# 35. Browser persistence

For the first implementation:

```text
localStorage
```

may retain the most recent batch metadata/results.

Large complete batches should be downloadable rather than relying indefinitely on localStorage.

A future IndexedDB implementation is optional and should not be required for V1.

---

# 36. AI-analysis readiness

The exported JSON must be sufficiently self-contained to be provided to another AI agent without requiring the AI to reconstruct the entire repository.

Each batch should identify:

```text
gameVersion
simulatorVersion
policyVersion
scenario
seed range / per-run seeds
```

and include the policy definitions used.

For selected careers, the complete decision/event/battle trace should be exportable.

The simulator should therefore make it possible to ask later:

> "Why did Smuggler runs stall around day 40?"

using actual run traces rather than only aggregate metrics.

---

# 37. Persona registry

The simulator should define personas through a registry.

Conceptually:

```text
PERSONAS = {
    naive: {
        label,
        policyFactory,
        parameters
    },

    opportunistic: {
        label,
        policyFactory,
        parameters
    },

    cautiousTrader: {...},
    privateer: {...},
    smuggler: {...},
    pirateRaider: {...},
    explorer: {...}
}
```

The policy specification document remains the authoritative behavioral definition.

The simulator should not embed seven unrelated decision systems.

Shared evaluators should be reused.

---

# 38. Persona variants

The simulator must support parameter overrides so we can later run experiments such as:

```text
Smuggler / low heat tolerance
Smuggler / high heat tolerance
Opportunist / high crew safety
Opportunist / high fame priority
```

without creating separate policy implementations.

A run must record its exact parameter set.

---

# 39. Initial policy implementation priority

Implement in this order.

### Phase 1 — infrastructure

- simulator runner;
- deterministic seed;
- actual reducer driving;
- legal-action handling;
- trace;
- metrics;
- JSON export;
- basic dashboard.

### Phase 2 — Naive Player

Implement all required decision points from the policy specification.

Use simple, explicit heuristics rather than sophisticated optimization.

The primary goal is to validate the end-to-end simulation.

### Phase 3 — Opportunistic Player

Implement shared scoring/evaluation helpers and adaptive decisions.

This validates that the policy architecture can support a more sophisticated decision-maker.

### Phase 4 — remaining personas

Add:

- Cautious Trader;
- Privateer;
- Smuggler;
- Pirate Raider;
- Explorer.

Reuse the common decision evaluator whenever possible.

---

# 40. First implementation milestone

Before implementing all visualizations and all personas, prove this:

```text
1 persona
×
1 starting scenario
×
100 careers
```

using the real engine.

Each career must:

- reach a legitimate termination or horizon;
- contain a valid final state;
- contain an inspectable decision trace;
- contain no direct simulator state mutation;
- be reproducible from its seed.

Then run a deterministic replay of one selected career and verify that the trace is identical.

Only after this succeeds should the simulator be expanded to large batches.

---

# 41. Simulator invariants

Every run must maintain:

- state transitions only through the real reducer;
- no negative physical quantities unless the game intentionally allows them;
- no impossible route;
- no illegal action silently accepted;
- no policy access to hidden outcomes;
- finite action count;
- deterministic replay under identical seed/configuration.

The simulator should check invariants during development/debug mode and optionally disable expensive checks for large production-style runs.

---

# 42. Simulator test strategy

Add a dedicated simulator test layer.

At minimum:

### Engine integration

Verify that a simulated action produces the same state as manually dispatching the same action through `E.reducer`.

### Reproducibility

Same seed + same configuration → identical career result.

### Divergence

Different seeds should eventually produce differing careers without changing the policy.

### Policy legality

Policies never knowingly dispatch unavailable actions.

### Trace integrity

Every decision has:

- timestamp/day;
- decision type;
- chosen action;
- policy;
- reason.

### Termination

No career can run indefinitely due to simulator orchestration.

### Export

JSON round-trip must preserve the relevant data.

---

# 43. Failure handling

A simulation error must not silently corrupt the batch.

Each career should have:

```text status:
    completed
    game_over
    horizon
    policy_stall
    policy_error
    simulation_error
```

The error payload should include:

```text
day
screen
last action
last decision
exception/message
```

Batch aggregation must exclude failed simulations from gameplay averages unless explicitly requested, while separately reporting the failure rate.

---

# 44. Performance requirements

Do not render React/UI during the career loop.

Do not generate screenshots.

Do not write localStorage for every action.

Do not retain unnecessary full-state histories.

The target should be that:

```text
1,000 careers
```

is comfortably runnable in a normal desktop browser.

The implementation may provide a progress indicator and yield periodically to the browser event loop for large batches so the tab remains responsive.

For example:

```text
run N careers
yield every K careers
update progress
continue
```

The yield frequency is an implementation detail and can be tuned.

---

# 45. What the simulator must not become

Do not turn this into:

- a rewritten Broadside rules engine;
- a hardcoded probability model;
- a single "optimal player" algorithm;
- a full reinforcement-learning system;
- a generic AI-agent framework;
- a second implementation of mission/economy/combat formulas.

The value of the simulator comes from using the actual Broadside systems.

---

# 46. Future extensions deliberately outside V1

These are valid future directions but should not block the first implementation:

- Monte Carlo policy optimization;
- genetic/evolutionary policies;
- reinforcement learning;
- larger-than-browser batch execution;
- Python statistical analysis pipeline;
- IndexedDB archive of many batches;
- automatic anomaly detection;
- automatic AI-written reports;
- player-policy calibration against real playtest telemetry;
- full event-synthesis/narrative analysis.

The architecture should leave room for these without implementing them prematurely.

---

# 47. Final implementation checklist

The implementation agent should consider the simulator V1 complete when all of the following are true:

- [ ] `sim-career.js` runs actual Broadside reducer actions.
- [ ] `sim-career.html` provides configuration and dashboard.
- [ ] All current starting scenarios can be selected.
- [ ] Seeded deterministic runs work.
- [ ] Naive Player covers all required decision points.
- [ ] Opportunistic Player covers all required decision points.
- [ ] Other personas can be registered and run.
- [ ] Policy decisions are traced.
- [ ] Significant events/encounters/battles are traced.
- [ ] Full career results can be exported as JSON.
- [ ] Batch aggregates support median and percentile metrics.
- [ ] Core career/progression/economy/risk/activity charts exist.
- [ ] Individual career inspection exists.
- [ ] Policy stalls and simulation errors are safely contained.
- [ ] Same-seed replay reproduces the same career.
- [ ] No simulator-specific duplicate game mechanics exist unless explicitly justified.
- [ ] The simulator can run at least 1,000 careers without UI rendering becoming part of the simulation loop.

---

# 48. Relationship to the policy specification

This document and `career-simulator-policy-spec.md` should be supplied together to the implementation agent.

The division of authority is:

```text
career-simulator-design.md
    → what the simulator is,
      how it runs,
      what it stores,
      how it measures,
      technical architecture

career-simulator-policy-spec.md
    → how simulated players make decisions,
      persona behavior,
      decision priorities,
      knowledge boundaries
```

If the two documents ever appear to conflict, the implementation agent should not silently choose one. The conflict should be surfaced before implementation continues.


---

# ADDENDUNM : additiona questions/decisions taken

Here is the consolidated summary with all your clarifications incorporated, structured for easy reference.


## 1. Core Principles (Confirmed)

| Principle | Decision |
|-----------|----------|
| **One source of truth** | Use actual game engine/reducers, never duplicate mechanics |
| **Simulator is a player** | Observe state → identify legal actions → ask policy → dispatch real action → repeat |
| **Policies cannot cheat** | No hidden RNG, no future events, no unrevealed outcomes |
| **No direct state mutation** | All transitions through `E.reducer()` |
| **No save/load** | Each run is ephemeral, starts fresh from `initialState` |
| **No batching** | Advance one day at a time; events/encounters handled as they arise |

---

## 2. Game Start & Initialization

| Item | Decision |
|------|----------|
| **Starting state** | Fresh deep-clone of `window.E.initialState` for each run |
| **Tutorial mode** | Always `"none"` – no onboarding, no QM |
| **Scenario selection** | All current starting scenarios supported; scenarioId recorded in metadata |
| **localStorage** | Mocked/isolated per run to prevent interference |
| **RNG** | Each run has a seed; use `Math.random` globally – no RNG injection needed, determinism comes from seeded RNG replay, not from using the same seed across runs |

---

## 3. Simulation Loop (Confirmed)

| Item | Decision |
|------|----------|
| **Day advancement** | One `ADVANCE_DAY` per loop iteration – never batch |
| **Event handling** | Full real events (storm, wreck, merchant, etc.) – policy responds to actual choices |
| **Encounter handling** | Full real `encounterSession` – policy chooses from actual intercept options |
| **Combat** | Real NPC AI vs. player policy – full real combat resolver |
| **Plunder** | Real plunder screen with hold capacity, jettison, selection |
| **Port decisions** | Multiple port actions per visit – repair, crew, provisions, missions, trade, shipyard |

---

## 4. Legal Actions & Decision Context

| Item | Decision |
|------|----------|
| **Legal actions helper** | Simulator will implement `getLegalActions(state)` that inspects state and returns structured available actions |
| **Context detection** | Helper identifies current context: `port` / `sailing` / `intercept` / `battle` / `plunder` / `event` |
| **Fallback** | If no legal action found, simulate safe continuation (e.g., ADVANCE_DAY at sea, no-op at port) |
| **Policy interface** | `policy.chooseDecision(context, state) → { action, reason, scoreDetails? }` |

---

## 5. Persona Policy Decisions (Confirmed & Extended)

| Decision Point | Policy Behavior |
|----------------|-----------------|
| **START_GAME** | All scenarios supported; no tutorial/onboarding |
| **Ship purchase** | Evaluate cost/fame/crew/hold/speed/combat; never buy if it leaves unsafe operation |
| **Equipment purchase** | Consider cost, reserve, ship longevity, persona goals; defer on temporary ships |
| **Crew recruitment** | Maintain minimum + comfortable margin; consider traits/faction when known |
| **Provisions** | Buy enough for planned route + safety margin; use `TOP_UP_PROVISIONS` shortcut |
| **Free trade** | Evaluate profit/day vs mission alternatives; personas have different trade frequencies |
| **Mission selection** | Inspect visible missions; Opportunistic may refresh (max 5); Naive takes first acceptable |
| **Mission refresh** | Zero cost. Max refreshes per session configurable per persona (Naive: 0, Opportunistic: up to 5) |
| **Mission abandonment** | Abandon if: required goods unavailable for >50 days, or target port becomes unreachable |
| **Mission cargo sourcing** | Check current port stock; if unavailable, may route via source port or abandon |
| **Patrol mission** | Continue attempting to satisfy real mission rules; don't force/assume encounter |
| **Navigation / course** | Direct route by default; change course mid-voyage if provisions/crew/hull situation worsens |
| **Destination preview** | Policies may preview any port before any voyage (for trade/profit evaluation) |
| **Event reactions** | Real event choices; policy selects based on expected reward vs risk vs current need |
| **Patrol inspection** | Clean → inspect. Contraband → compare bribe/hand-over/resist. Resist → boarding combat. |
| **Morale management** | Keep above danger zone when affordable; varies by persona |
| **Repairs** | First port expense before discretionary spending |
| **Combat** | Real NPC AI vs player policy; player uses action evaluation (broadside/precision/grapple/etc.) |
| **Plunder** | Value incoming cargo vs held cargo vs mission-critical vs contraband risk |
| **Port budget priority** | Repair → min crew → min provisions → mission cargo → free trade → equipment → morale → upgrades |
| **Reputation** | Consequence-driven OR goal-directed depending on persona |
| **Heat management** | Emergent consequence; deliberate cooling only when heat is materially damaging |
| **Discovery reaction** | Continue to original destination; at next port, decide whether to visit newly discovered port |
| **New port discovery** | At port, evaluate if newly discovered port is worth routing to |

---

## 6. Persona Definitions (Summarized)

| Persona | Key Traits |
|---------|------------|
| **Naive** | Risk: med-low; combat: avoid; refresh: 0; consequence-driven; simple heuristics |
| **Opportunistic** | Risk: med; combat: balanced; refresh: ≤5; goal-directed; scores all actions |
| **Cautious Trader** | Risk: low; cash/crew/heat: high priority; avoids combat; prefers trade; large reserves |
| **Privateer** | Risk: med-high; seeks combat; fame/rep high; favors one faction; invests in combat equipment |
| **Smuggler** | Risk: high; cash: very high; heat-aware; resists when cargo value justifies; values speed/hidden compartment |
| **Pirate Raider** | Risk: very high; seeks combat; accepts high heat; plunders aggressively; high crew strength |
| **Explorer** | Risk: med; discovery: very high; favors new ports/charts; values Navigation Tools/endurance |

---

## 7. Run Termination & Status

| Status | Meaning |
|--------|---------|
| `game_over` | Real game-over triggered (`state.gameOverReason != null`) |
| `horizon` | Reached configured max days (5000 by default) |
| `endgame` | Reached final ship (Ship of the Line) + full crew/equipment (optional win condition) |
| `policy_stall` | Policy repeated non-progressing actions beyond threshold |
| `policy_error` | Policy attempted an illegal action |
| `simulation_error` | Unexpected simulator exception |

| Item | Decision |
|------|----------|
| **Max days** | 5000 (default) – configurable |
| **Batch size** | 200 runs minimum (or more if performance allows) – target: runnable on Mac Air M5 |
| **Early game-over** | Report as anomaly if run ends < 50 days |

---

## 8. Trace & Metrics

| Item | Decision |
|------|----------|
| **State snapshots** | Store at meaningful boundaries: port arrival, mission accept, event start, encounter start, battle start/end, game-over; optionally every N days |
| **Decision trace** | Store: day, context, availableActions, chosenAction, persona, reason, scoreDetails |
| **Battle trace** | Store round-by-round: actions, distance, damage, crew loss, outcome |
| **Full state** | Stored at start, end, and every 100 days (configurable) |
| **Export format** | JSON (machine-readable) + Markdown (human-readable) |

---

## 9. Performance & Failure Handling

| Item | Decision |
|------|----------|
| **Yield** | Yield to browser event loop every 10 careers (or configurable) |
| **Pre-flight check** | Before each action: verify legal + check `L.isUnrecoverable` |
| **Dead zone detection** | Detect loops (repeated same action in same context); trigger fallback after threshold |
| **Policy fallback** | Safe continuation: ADVANCE_DAY at sea, repair/provision at port, continue fighting in combat |
| **Error containment** | Simulation errors do not corrupt batch; marked as `simulation_error` |

---

## 10. Visualization & Reporting

| Report Type | Content |
|-------------|---------|
| **Survival** | Game-over rate, cause distribution, career length |
| **Progression** | Fame/gold over time, ship timing, days to thresholds |
| **Economy** | Income/spending breakdown, final wealth |
| **Activity** | Events/patrols/battles per 100 days, port visits, voyages |
| **Crew** | Size/morale trajectory, losses by cause, desertion |
| **Risk** | Heat trajectory, patrol frequency vs heat, win rate |
| **Anomaly detection** | Runs under 50 days flagged, with context |

---

## 11. Open Questions (Remaining)

| # | Question | Status |
|---|----------|--------|
| 1 | **Batch size maximum:** What's the performance target? 200 runs × 5000 days each. Is this doable on a Mac Air M5? | Need to test |
| 2 | **Policy version field:** How should it be defined/incremented? | Agreed to include – specifics TBD |
| 3 | **Max days:** 5000 is the default – should it be configurable per batch? | Yes (configurable) |
| 4 | **Endgame condition:** "Final ship + full crew/equipment" – what exactly counts? | TBD when implementing |
| 5 | **Anomaly reporting:** What format? Console log, separate file, dashboard highlight? | TBD |

---

## 12. Implementation Order (Revised)

| Phase | Focus | Criteria |
|-------|-------|----------|
| **Phase 1** | Infrastructure: runner, deterministic seed, reducer driving, legal-actions helper, trace, metrics, JSON export, basic dashboard | 100 runs × 1000 days, reproducible |
| **Phase 2** | Naive Player: all decision points covered | 200 runs × 2000 days, no errors |
| **Phase 3** | Opportunistic Player: shared evaluator, adaptive decisions | Compare vs Naive |
| **Phase 4** | Remaining personas: Trader, Privateer, Smuggler, Pirate Raider, Explorer | All personas functional |

---

## 13. Success Criteria Checklist

- [ ] 1 persona × 1 scenario × 100 careers run successfully
- [ ] Same seed + same configuration = identical career (reproducible)
- [ ] Different seeds produce different careers
- [ ] No illegal actions dispatched
- [ ] Career trace is inspectable
- [ ] No career runs indefinitely due to simulator orchestration
- [ ] JSON export preserves all relevant data
- [ ] No direct state mutation outside `E.reducer`
- [ ] Anomalies (<50 days) detected and reported

---

## 14. Key Files (Proposed)

```
tools/
  sim-career.html          # Configuration UI, dashboard, export
  sim-career.js            # Simulator module (runner, policies, trace, metrics)
  sim-career-utils.js      # getLegalActions, context builders, helpers
```

---

This document now represents the **finalized design** with all clarifications incorporated. The remaining open questions are minor and can be resolved during implementation. The overall architecture is clear, testable, and aligned with the goal of running realistic careers using the actual game engine.
