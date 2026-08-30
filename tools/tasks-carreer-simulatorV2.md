# Career Simulator – Implementation Checklist

---

## Phase 0 – Foundation (Shared Infrastructure)

**Goal:** Core utilities, helpers, and data structures that all other phases depend on.

---

### 0.1 – Create `tools/sim-career.html` skeleton

- [ ] Create HTML file with basic structure
- [ ] Add configuration inputs: scenario selector, persona selector, runs count, maxDays, seed (optional)
- [ ] Add Run / Stop buttons
- [ ] Add progress bar and status text
- [ ] Add placeholder dashboard sections (charts, summary, per‑run list)
- [ ] Add export buttons (JSON, Markdown, CSV) — initially disabled
- [ ] Ensure responsive layout (works on desktop + laptop)
- [ ] Add dark theme matching Broadside aesthetic

**Deliverable:** `tools/sim-career.html` with working UI (no logic yet)

---

### 0.2 – Create `tools/sim-career.js` module skeleton

- [ ] Create `tools/sim-career.js`
- [ ] Wrap in IIFE or ES module pattern (match project convention)
- [ ] Define `window.Simulator` namespace
- [ ] Add `CareerSimulator` class with placeholder methods: `runCareer`, `runBatch`, `stop`
- [ ] Add `PolicyRegistry` class with placeholder methods: `registerPersona`, `getPersona`
- [ ] Add `TraceCollector` class with placeholder methods: `recordDecision`, `recordEvent`, `recordEncounter`, `recordBattle`
- [ ] Add `MetricsCollector` class with placeholder methods: `updateFromTransition`, `finalizeCareer`
- [ ] Add `BatchAggregator` class with placeholder methods: `aggregate`, `toJSON`, `toMarkdown`

**Deliverable:** `tools/sim-career.js` with class skeletons, no implementation yet

---

### 0.3 – Implement `getLegalActions(state)` helper

- [ ] Inspect `state.screen` to determine context
- [ ] For each context, return list of legal actions with payloads
- [ ] Contexts: `title`, `newgame`, `port`, `map`, `sailing`, `event`, `intercept`, `inspection_pending`, `battle`, `plunder`, `shipyard`, `crew`, `market`, `status`, `journal`, `gameover`
- [ ] For `port`: include `REPAIR`, `HIRE_CREW`, `RAISE_MORALE`, `REFRESH_MISSIONS`, `TAKE_MISSION`, `ABANDON_MISSION`, `BUY_SHIP`, `BUY_EQUIPMENT`, `INSTALL_EQUIPMENT`, `REMOVE_EQUIPMENT`, `CONFIRM_TRADE`, `NAVIGATE(map)`, `NAVIGATE(shipyard)`, `NAVIGATE(crew)`, `NAVIGATE(market)`, `NAVIGATE(status)`, `NAVIGATE(journal)`, `SAIL_TO` (if reachable), `TOP_UP_PROVISIONS`
- [ ] For `sailing`: include `ADVANCE_DAY`, `ENTER_PORT` (if arrived), `NAVIGATE(map)` (change course)
- [ ] For `intercept`: include `INTERCEPT_FIGHT`, `INTERCEPT_FLEE`, `INTERCEPT_PARLEY`, `INTERCEPT_BRIBE`, `INTERCEPT_SURRENDER`, `PATROL_INSPECT`
- [ ] For `inspection_pending`: include `RESOLVE_INSPECTION(handOver)`, `RESOLVE_INSPECTION(resist)`
- [ ] For `battle`: include `BATTLE_ACTION` with all legal actions for current phase/distance
- [ ] For `plunder`: include `TAKE_PLUNDER` with current hold selection
- [ ] For `event`: include `RESOLVE_EVENT` for each choice (with condition checked)
- [ ] For `gameover`: return empty array (no legal actions)
- [ ] For each action, include `legal: boolean` and `reason: string | null` if illegal
- [ ] Return `{ context, actions: [{ type, payload, legal, reason }] }`

**Deliverable:** `getLegalActions` helper returning accurate available actions for any state

**Acceptance:** 100% of actions match actual game behaviour for all contexts

---

### 0.4 – Implement `isOperationallySafe(state, plannedRoute?)` helper

- [ ] Check hull: `state.ship.hull > 0` OR `state.gold >= L.shipRepairCost(state)`
- [ ] Check crew: `state.crew.roster.length >= L.getMinViableCrew(state.ship.type)`
- [ ] Check provisions (if plannedRoute provided): `L.getDaysOfProvisions(state.hold.items, state).food >= routeDays + safetyMargin`
- [ ] Check if `L.isUnrecoverable(state)` returns `false`
- [ ] Return `{ safe: boolean, reason: string | null }`
- [ ] Safety margin configurable per persona (default 2 days)

**Deliverable:** `isOperationallySafe` helper used in pre‑flight checks

---

### 0.5 – Add deterministic RNG seeding

- [ ] Add `seedrandom` or simple custom PRNG (e.g., Mulberry32)
- [ ] Implement `setSeed(seed)` that replaces `Math.random` with seeded version
- [ ] Each run gets a seed (from batch seed + run index, or random if not provided)
- [ ] Store seed in run metadata
- [ ] Ensure `Math.random()` is deterministic for the entire run
- [ ] Add `resetMathRandom()` to restore original after run

**Deliverable:** Deterministic RNG for reproducible runs

---

### 0.6 – Add run isolation (fresh state + mock localStorage)

- [ ] Implement `createFreshState()` that deep‑clones `window.E.initialState`
- [ ] Set `tutorialMode: "none"` and `onboarding.enabled: false`
- [ ] Mock `localStorage` per run (in‑memory object) to prevent cross‑run interference
- [ ] Ensure `window.L.saveToLocalStorage`, `loadFromLocalStorage`, etc. use the mock
- [ ] Restore real localStorage after each run

**Deliverable:** Isolated runs with no side effects

---

### 0.7 – Add basic trace store

- [ ] Define trace shape: `{ decisions: [], events: [], encounters: [], battles: [], portVisits: [], snapshots: [] }`
- [ ] Implement `appendDecision(decision)` — stores day, context, action, reason, scoreDetails
- [ ] Implement `appendEvent(event)` — stores eventId, day, choices, chosen, outcome
- [ ] Implement `appendEncounter(encounter)` — stores type, day, options, chosen, outcome
- [ ] Implement `appendBattle(battle)` — stores rounds, actions, damage, crew loss, outcome
- [ ] Implement `appendPortVisit(port)` — stores portKey, day, gold, crew, hull, morale
- [ ] Implement `appendSnapshot(state, label)` — stores full state at meaningful boundaries
- [ ] Implement `getTrace()` returns full trace

**Deliverable:** In‑memory trace with append‑only interface

---

## Phase 1 – Core Simulator Runner

**Goal:** The main loop that drives a career from start to termination.

---

### 1.1 – Implement `runCareer(scenarioId, seed, policy, config)`

- [ ] Create fresh state via `createFreshState()`
- [ ] Set seed via `setSeed(seed)`
- [ ] Dispatch `START_GAME` with scenarioId
- [ ] Initialise trace store
- [ ] Initialise metrics collector
- [ ] Set `day = 0`, `actions = 0`, `consecutiveNonProgressing = 0`
- [ ] Return result object: `{ status, metadata, trace, summary, finalState }`

**Deliverable:** `runCareer` function returns a complete career result

---

### 1.2 – Wire `START_GAME` through real reducer

- [ ] Call `E.reducer(state, { type: A.START_GAME, captainName, faction, tutorialMode: "none" })`
- [ ] Verify state.screen is `"port"`
- [ ] Verify state.currentPort matches scenario
- [ ] Verify ship, crew, gold match starting scenario
- [ ] Record start snapshot

**Deliverable:** Real `START_GAME` used for every run

---

### 1.3 – Implement main loop: observe → context → policy → dispatch → record

```
while (active) {
  const legalActions = getLegalActions(state);
  if (legalActions.actions.length === 0) break; // terminal

  const context = buildContext(state, legalActions);
  const decision = policy.chooseDecision(context, state);

  if (!isLegal(decision.action, legalActions)) {
    // policy error – fallback
    decision = getFallbackAction(state, legalActions);
    recordPolicyError();
  }

  const prevState = state;
  state = E.reducer(state, decision.action);
  recordDecision(decision, prevState, state);
  updateMetrics(prevState, state, decision.action);
  day = state.day;
  actions++;

  if (state.screen === "gameover") break;
  if (day >= maxDays) break;
  if (isStalled()) break;
}
```

**Deliverable:** Working main loop with all components integrated

---

### 1.4 – Implement `ADVANCE_DAY`‑only progression (one day per loop)

- [ ] Never batch multiple `ADVANCE_DAY` calls
- [ ] After each `ADVANCE_DAY`, check if events/encounters triggered
- [ ] If event triggered, loop handles it on next iteration
- [ ] If encounter triggered, loop handles it on next iteration
- [ ] If arrived at port, loop handles it on next iteration

**Deliverable:** Single‑day advancement with full event/encounter handling

---

### 1.5 – Implement stall detection

- [ ] Track `consecutiveNonProgressingActions` — reset when `day` advances or location changes
- [ ] Track `identicalActionCount` per context — reset when action changes
- [ ] Define thresholds: `maxConsecutiveNonProgressing = 20`, `maxIdenticalActions = 10`
- [ ] If threshold exceeded, mark run as `policy_stall`
- [ ] Record last 5 actions in trace for debugging

**Deliverable:** Stalled runs terminate cleanly with `policy_stall` status

---

### 1.6 – Implement horizon termination

- [ ] Default `maxDays = 5000`
- [ ] Configurable per batch
- [ ] If `state.day >= maxDays`, mark run as `horizon`

**Deliverable:** Runs terminate at configured horizon

---

### 1.7 – Add run metadata collection

- [ ] `runId` – UUID or incrementing counter
- [ ] `seed` – seed used
- [ ] `personaId` – policy name
- [ ] `scenarioId` – starting scenario
- [ ] `simulatorVersion` – version constant
- [ ] `gameVersion` – from `window.E.initialState.version`
- [ ] `policyVersion` – version of policy code
- [ ] `startDay` – `state.day` at start (always 1)
- [ ] `endDay` – `state.day` at termination
- [ ] `status` – `completed` | `game_over` | `horizon` | `policy_stall` | `policy_error` | `simulation_error`

**Deliverable:** Full metadata in every run result

---

### 1.8 – Add error containment

- [ ] Wrap `runCareer` in try/catch
- [ ] On error, mark run as `simulation_error`
- [ ] Record error message and stack
- [ ] Return partial result (state before error, trace up to error)
- [ ] Continue batch (don't kill entire batch)

**Deliverable:** Individual run errors don't corrupt batch

---

## Phase 2 – Policy Infrastructure

**Goal:** Shared policy interface, context builders, and evaluators.

---

### 2.1 – Define `Policy` interface

- [ ] Method: `chooseDecision(context, state) → { action, reason, scoreDetails? }`
- [ ] Method: `getName() → string`
- [ ] Method: `getParameters() → object`
- [ ] Method: `getVersion() → string`

**Deliverable:** `Policy` interface contract

---

### 2.2 – Implement shared decision‑context builders

- [ ] `buildPortContext(state, legalActions)` – missions, market, shipyard, crew, repairs, gold, fame, infamy, heat, reputation, ship, crew
- [ ] `buildSailingContext(state, legalActions)` – destination, days left, provisions, wind, activeMission, events
- [ ] `buildInterceptContext(state, legalActions)` – encounter type, enemy, options, contraband, heat
- [ ] `buildBattleContext(state, legalActions)` – distance, phase, subPhase, hull, crew, morale, enemy, mission
- [ ] `buildEventContext(state, legalActions)` – event id, title, choices, current needs
- [ ] `buildPlunderContext(state, legalActions)` – enemy cargo, gold reward, hold capacity, current hold

**Deliverable:** Context builders returning normalised decision‑ready data

---

### 2.3 – Implement shared evaluator helpers

- [ ] `scoreMission(mission, state, context)` – returns `{ score, breakdown }`
- [ ] `scoreTrade(good, fromPort, toPort, state)` – returns `{ profit, profitPerDay, score }`
- [ ] `scoreShipPurchase(shipType, state)` – returns `{ score, breakdown }`
- [ ] `scoreEquipment(equipmentKey, state)` – returns `{ score, breakdown }`
- [ ] `scoreEventChoice(choice, state)` – returns `{ expectedValue, risk, score }`
- [ ] `scoreCombatAction(action, state, battle)` – returns `{ expectedDamage, risk, score }`
- [ ] `scorePatrolChoice(choice, state, encounter)` – returns `{ expectedCost, risk, score }`

**Deliverable:** Reusable scoring functions for all personas

---

### 2.4 – Implement fallback action for each context

- [ ] Port fallback: `NAVIGATE(map)` if possible, otherwise `REFRESH_MISSIONS` or `ADVANCE_DAY`? Actually port fallback is "do nothing" – but we need a safe action. Use `REFRESH_MISSIONS` once, then `NAVIGATE(map)` if available.
- [ ] Sailing fallback: `ADVANCE_DAY`
- [ ] Intercept fallback: `INTERCEPT_FIGHT`
- [ ] Battle fallback: `BATTLE_ACTION` with `"broadside"`
- [ ] Event fallback: first choice (index 0)
- [ ] Plunder fallback: take all cargo

**Deliverable:** Safe fallback for every context (prevents no‑op loops)

---

### 2.5 – Add `Persona` registry

- [ ] `registerPersona(id, label, policyFactory, defaultParameters)`
- [ ] `getPersona(id) → { label, policy, parameters }`
- [ ] Pre‑register all personas: `naive`, `opportunistic`, `cautiousTrader`, `privateer`, `smuggler`, `pirateRaider`, `explorer`
- [ ] Each persona stores: riskTolerance, cashWeight, fameWeight, discoveryWeight, crewSafetyWeight, combatWeight, heatWeight, refreshTolerance, etc.

**Deliverable:** Configurable persona registry

---

## Phase 3 – Naive Policy

**Goal:** A simple, script‑based policy that covers all decision points.

---

### 3.1 – Implement `NaivePolicy` class

- [ ] Extend base Policy interface
- [ ] Implement `chooseDecision` for all contexts
- [ ] Use simple heuristics, not scoring/optimisation
- [ ] Name: `"Naive"`

---

### 3.2 – Port Naive decision rules from policy spec

- [ ] **Port:** repair first → crew if below min → provisions if needed → take first acceptable mission → trade if obvious → sail to destination
- [ ] **Mission selection:** accept first mission with risk ≤ medium
- [ ] **Refresh:** never refresh
- [ ] **Ship purchase:** buy next affordable ship only if current ship is < tier 2
- [ ] **Equipment:** buy only if cheap and obvious upgrade
- [ ] **Crew:** recruit to `minCrew + 3`
- [ ] **Provisions:** buy enough for route + 2 days
- [ ] **Free trade:** only if profit > 50g and route < 5 days
- [ ] **Events:** choose "safe" or "helpful" option
- [ ] **Patrol:** inspect if no contraband; hand over if found
- [ ] **Combat:** broadside by default; flee if enemy clearly stronger
- [ ] **Plunder:** take all cargo if hold space allows
- [ ] **Navigation:** direct route to destination

**Deliverable:** Full Naive policy implementation

---

### 3.3 – Wire Naive into runner and test 100 runs × 1000 days

- [ ] Run 100 careers with Naive
- [ ] Verify all terminate (no infinite loops)
- [ ] Verify no illegal actions
- [ ] Verify trace contains decisions for every action
- [ ] Verify no `policy_error` status
- [ ] Record baseline metrics

**Deliverable:** Working Naive policy with validation

---

### 3.4 – Add decision‑trace verification

- [ ] Every decision has: `day`, `context`, `action`, `reason`
- [ ] `reason` is a non‑empty string
- [ ] `action` is a real `E.A` action with valid payload
- [ ] `context` matches current state
- [ ] Add automated checks in test suite

**Deliverable:** Trace integrity enforced

---

## Phase 4 – Opportunistic Policy

**Goal:** A scoring‑based policy that evaluates options.

---

### 4.1 – Implement `OpportunisticPolicy` class

- [ ] Extend base Policy interface
- [ ] Implement `chooseDecision` for all contexts
- [ ] Use scoring/evaluation for all decisions
- [ ] Name: `"Opportunistic"`

---

### 4.2 – Add refresh logic (max 5, with expected‑benefit check)

- [ ] Track refresh count per mission‑selection session
- [ ] Max refreshes = 5
- [ ] Only refresh if: `expectedImprovement > threshold`
- [ ] ExpectedImprovement = average reward of visible missions
- [ ] Threshold = 10% of current gold or 1 fame

**Deliverable:** Refresh decisions traceable and constrained

---

### 4.3 – Add mission‑preparation sourcing logic

- [ ] For trade/smuggle missions:
  - [ ] Check if required good is available at current port
  - [ ] If yes, buy it
  - [ ] If no, check reachable ports for availability
  - [ ] If available within 3 days detour, route via that port
  - [ ] If not, reject mission
- [ ] Record sourcing decision in trace

**Deliverable:** Cargo sourcing decisions

---

### 4.4 – Add event scoring

- [ ] For each event choice:
  - [ ] Estimate reward (gold, fame, morale)
  - [ ] Estimate risk (hull damage, crew loss, time)
  - [ ] Estimate time cost (days lost)
  - [ ] Score = reward - risk - timeCost * dailyValue
- [ ] Choose highest score
- [ ] Record score breakdown in trace

**Deliverable:** Event choices scored and traceable

---

### 4.5 – Add combat action scoring (player side)

- [ ] Use `L.getActionPreview` for damage estimates
- [ ] For each action:
  - [ ] Estimate expected hull damage to enemy
  - [ ] Estimate expected crew loss to enemy
  - [ ] Estimate risk to player (hull/crew)
  - [ ] Estimate plunder value if victory
  - [ ] Estimate mission value if completed
  - [ ] Score = (damageValue + plunderValue + missionValue) - riskCost
- [ ] Choose highest score
- [ ] Record score breakdown in trace

**Deliverable:** Player combat actions scored

---

### 4.6 – Add heat management

- [ ] If heat >= 7 and no high‑value action available:
  - [ ] Consider a short, safe voyage to cool heat
  - [ ] Only if cost < benefit of cooling
  - [ ] Record as "heat management" decision
- [ ] If heat < 3, ignore

**Deliverable:** Heat‑management decisions traceable

---

### 4.7 – Run 200 runs × 2000 days, compare vs Naive

- [ ] Run Opportunistic batch
- [ ] Compare metrics: survival rate, fame, gold, progression speed, event outcomes
- [ ] Verify Opportunistic outperforms Naive on most metrics
- [ ] Identify any edge cases where Opportunistic fails

**Deliverable:** Validation of Opportunistic vs Naive

---

## Phase 5 – Remaining Personas

**Goal:** Implement remaining four personas using shared evaluators.

---

### 5.1 – Implement `CautiousTrader`

- [ ] Parameters: `riskTolerance: low`, `cashWeight: high`, `crewSafetyWeight: high`, `heatWeight: high`, `combatWeight: low`
- [ ] Prefers trade missions
- [ ] Maintains large reserves
- [ ] Avoids combat
- [ ] Uses hand‑over over resist
- [ ] Avoids risky wrecks
- [ ] Invests in hold/speed/endurance

**Deliverable:** CautiousTrader persona

---

### 5.2 – Implement `Privateer`

- [ ] Parameters: `riskTolerance: medium-high`, `combatWeight: high`, `fameWeight: high`, `reputationWeight: high`
- [ ] Prefers combat and escort missions
- [ ] Seeks faction reputation
- [ ] Invests in combat equipment
- [ ] Accepts moderate crew losses for reward
- [ ] Defends merchants aggressively

**Deliverable:** Privateer persona

---

### 5.3 – Implement `Smuggler`

- [ ] Parameters: `riskTolerance: high`, `cashWeight: very high`, `heatWeight: medium`, `combatWeight: medium-low`
- [ ] Prefers smuggle missions
- [ ] Evaluates bribe cost
- [ ] Resists inspection when cargo value justifies
- [ ] Values hidden compartment
- [ ] Cools heat after profitable runs
- [ ] Invests in speed

**Deliverable:** Smuggler persona

---

### 5.4 – Implement `PirateRaider`

- [ ] Parameters: `riskTolerance: very high`, `combatWeight: high`, `heatWeight: very low`, `plunderWeight: high`
- [ ] Prefers assault/combat missions
- [ ] Searches risky wrecks
- [ ] Plunders aggressively
- [ ] Resists patrols
- [ ] Tolerates high heat
- [ ] Invests in crew strength

**Deliverable:** PirateRaider persona

---

### 5.5 – Implement `Explorer`

- [ ] Parameters: `riskTolerance: medium`, `discoveryWeight: very high`, `fameWeight: medium-high`
- [ ] Prioritises undiscovered ports
- [ ] Values chart/discovery events
- [ ] Prefers routes to new locations
- [ ] Invests in Navigation Tools and endurance
- [ ] Accepts economic inefficiency for exploration

**Deliverable:** Explorer persona

---

### 5.6 – Ensure all personas use shared evaluators

- [ ] No duplicate code between personas
- [ ] Differences only in weights and a few overrides
- [ ] Each persona has a `getParameters()` method showing all weights

**Deliverable:** DRY policy code

---

## Phase 6 – Metrics & Aggregation

**Goal:** Collect, aggregate, and report career metrics.

---

### 6.1 – Define career summary metrics

- [ ] `careerDays`
- [ ] `gameOverReason`
- [ ] `finalGold`
- [ ] `finalFame`
- [ ] `finalInfamy`
- [ ] `finalHeat` (max or current)
- [ ] `finalShip`
- [ ] `finalCrew`
- [ ] `finalMorale`
- [ ] `portsVisited` (count and list)
- [ ] `portsDiscovered`
- [ ] `missionsTaken` / `completed` / `failed` / `abandoned`
- [ ] `trades` (count and profit)
- [ ] `smuggles` (count and profit)
- [ ] `battles` / `battleWins` / `battleLosses`
- [ ] `boardings`
- [ ] `plunders`
- [ ] `crewHired` / `crewLost` / `crewDeserted`
- [ ] `events` (count by type)
- [ ] `patrols`
- [ ] `storms`
- [ ] `goldEarned` / `goldSpent` (by category: trade, mission, smuggle, repair, crew, provision, equipment, ship)

**Deliverable:** Summary object shape

---

### 6.2 – Implement `MetricsCollector.updateFromTransition(prevState, nextState, action)`

- [ ] Track gold delta: if positive → `goldEarned`, if negative → `goldSpent` by category
- [ ] Track crew changes: hire, dismiss, death, desertion
- [ ] Track fame/infamy changes
- [ ] Track hull changes (repair cost)
- [ ] Track mission status changes
- [ ] Track port visits (new ports)
- [ ] Track event/encounter/battle counts

**Deliverable:** Incremental metrics update

---

### 6.3 – Implement `MetricsCollector.finalizeCareer(finalState, trace)`

- [ ] Compute final summary from trace + final state
- [ ] Ensure all fields are populated
- [ ] Add computed fields: `averageGoldPerDay`, `averageFamePerDay`, `survivalRate` (1 if gameover, 0 if horizon)
- [ ] Add `progressionMilestones`: day of first ship upgrade, day of fame thresholds

**Deliverable:** Complete career summary

---

### 6.4 – Implement `BatchAggregator`

- [ ] Aggregate career summaries into batch summary
- [ ] For each numeric metric: `count`, `min`, `max`, `mean`, `median`, `p10`, `p25`, `p75`, `p90`
- [ ] For categorical metrics: `distribution` (counts per value)
- [ ] Add `statusDistribution` (counts by status)
- [ ] Add `personaComparison` (metrics side‑by‑side per persona)

**Deliverable:** Batch aggregate statistics

---

### 6.5 – Add anomaly detection

- [ ] For each career, if `careerDays < 50`, flag as anomaly
- [ ] Store anomaly reason (gameOverReason or status)
- [ ] In batch summary, add `anomalies` list with runId, day, reason
- [ ] In dashboard, highlight anomalies in red

**Deliverable:** Anomaly detection and reporting

---

### 6.6 – Add per‑persona comparison

- [ ] For each persona, compute all metrics
- [ ] Display side‑by‑side in dashboard
- [ ] Highlight best/worst per metric
- [ ] Add "persona ranking" for key metrics

**Deliverable:** Persona comparison view

---

## Phase 7 – Dashboard & Visualisations

**Goal:** Interactive UI for viewing batch results.

---

### 7.1 – HTML config panel

- [ ] Scenario selector: dropdown with all STARTS.factionPorts
- [ ] Persona selector: dropdown with all registered personas
- [ ] Runs input: number (default 200)
- [ ] MaxDays input: number (default 5000)
- [ ] Seed input: number or "random"
- [ ] Run button
- [ ] Stop button (graceful interrupt)
- [ ] Status text (current run, progress)

**Deliverable:** Usable config UI

---

### 7.2 – Progress bar + status updates

- [ ] Progress bar fills as runs complete
- [ ] Status text: "Run 47/200 – 23% – Naive – 4 errors"
- [ ] Estimated time remaining (optional)
- [ ] Cancel/stop button interrupts gracefully

**Deliverable:** Live progress feedback

---

### 7.3 – Career survival chart

- [ ] Stacked bar: game-over cause distribution (per persona)
- [ ] Kaplan‑Meier survival curve (days survived)
- [ ] Tooltips show counts and percentages

**Deliverable:** Survival visualisation

---

### 7.4 – Progression charts

- [ ] Fame over time (median + percentile bands)
- [ ] Gold over time (median + percentile bands)
- [ ] Ship progression timing (box plot: day to each ship)
- [ ] Days to fame thresholds (50, 100, 200, 350)

**Deliverable:** Progression visualisation

---

### 7.5 – Economy/activity/crew/risk charts

- [ ] Gold earned vs spent (stacked bar by category)
- [ ] Activities per 100 days (missions, battles, events, patrols)
- [ ] Crew size over time (median + bands)
- [ ] Heat over time (median + bands)
- [ ] Morale over time (median + bands)
- [ ] Combat win rate (pie chart)

**Deliverable:** Full dashboard

---

### 7.6 – Individual career inspection

- [ ] List of all runs with filter by persona/status
- [ ] Click on a run to view:
  - [ ] Summary card (metrics)
  - [ ] Timeline (day by day, with key events)
  - [ ] Decision trace (scrollable)
  - [ ] Event list
  - [ ] Encounter list
  - [ ] Battle list (with round‑by‑round)
- [ ] Export selected career as JSON

**Deliverable:** Per‑run drill‑down

---

### 7.7 – Export buttons

- [ ] **JSON Export:** full batch (metadata + aggregate + all careers)
- [ ] **Markdown Export:** human‑readable summary with key metrics
- [ ] **CSV Export:** one row per career with all summary metrics
- [ ] File download (`broadside-sim-{timestamp}.json` etc.)

**Deliverable:** Export functionality

---

## Phase 8 – Testing & Validation

**Goal:** Ensure correctness, reproducibility, and robustness.

---

### 8.1 – Test runner: 1 seed → same career every time

- [ ] Run same seed twice with same config
- [ ] Compare trace: identical actions and state transitions
- [ ] Assert: `JSON.stringify(trace1) === JSON.stringify(trace2)`

**Deliverable:** Reproducibility proof

---

### 8.2 – Test runner: different seeds → different careers

- [ ] Run two different seeds with same config
- [ ] Compare trace: should differ
- [ ] Assert: `trace1 !== trace2`

**Deliverable:** Non‑determinism proof

---

### 8.3 – Test legal‑actions helper

- [ ] For each context, assert correct actions returned
- [ ] For each action, assert legal flag matches actual game state
- [ ] Test edge cases: gameover → empty array, empty state → fallback

**Deliverable:** Helper correctness

---

### 8.4 – Test pre‑flight check

- [ ] Build state with low hull: assert `isOperationallySafe` returns false with reason
- [ ] Build state with insufficient crew: assert false
- [ ] Build state with insufficient provisions: assert false (if route provided)
- [ ] Build state with sufficient resources: assert true

**Deliverable:** Pre‑flight check works

---

### 8.5 – Test stall detection

- [ ] Mock policy that repeats same action 20 times
- [ ] Assert run terminates with `policy_stall`
- [ ] Stall reason recorded

**Deliverable:** Stall handling works

---

### 8.6 – Test trace integrity

- [ ] Every decision has: day, context, action, reason
- [ ] Every event has: id, day, chosen
- [ ] Every encounter has: type, day, chosen
- [ ] Every battle has: rounds, actions, outcome
- [ ] No missing fields

**Deliverable:** Trace completeness

---

### 8.7 – Test batch export

- [ ] Export JSON, import back
- [ ] Assert: `JSON.stringify(original) === JSON.stringify(imported)`
- [ ] Markdown export: verify readable

**Deliverable:** Export correctness

---

### 8.8 – Test anomaly detection

- [ ] Run batch with forced early game-over
- [ ] Assert anomalies flagged with correct reason

**Deliverable:** Anomaly detection works

---

## Phase 9 – Polish & Optimisation

**Goal:** Performance, usability, and edge‑case handling.

---

### 9.1 – Add `yield` every N careers

- [ ] After every 10 careers, yield to event loop via `setTimeout` or `requestAnimationFrame`
- [ ] Allow UI updates (progress, status)
- [ ] Allow graceful interrupt (stop button)

**Deliverable:** Responsive large‑batch simulation

---

### 9.2 – Optimise trace storage

- [ ] Don't store full state after every action
- [ ] Store full state at: start, end, port visits, mission accept, event start, encounter start, battle start/end, every 100 days
- [ ] Use deltas for other transitions

**Deliverable:** Memory/performance optimisation

---

### 9.3 – Add version fields

- [ ] `simulatorVersion` – manual constant
- [ ] `gameVersion` – from `E.initialState.version`
- [ ] `policyVersion` – per persona, manual constant

**Deliverable:** Versioned data

---

### 9.4 – Add "Run" + "Stop" (graceful interrupt)

- [ ] Stop button sets `shouldStop = true`
- [ ] Runner checks `shouldStop` between careers
- [ ] Finishes current career then exits gracefully
- [ ] Status shows "Stopped by user"

**Deliverable:** Usable Run/Stop controls

---

### 9.5 – Add configurable maxDays per batch

- [ ] Input field in HTML
- [ ] Passed to `runBatch`

**Deliverable:** Flexible horizon

---

### 9.6 – Auto‑detect endgame condition (optional)

- [ ] If `state.ship.type === "ship_of_the_line"` and `state.crew.roster.length >= state.crew.max * 0.9` and all equipment slots filled → mark as `endgame`
- [ ] Optional: add to config as "Stop at endgame"

**Deliverable:** Endgame detection (optional)

---

## Summary of Phases

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 0** | Foundation | 🔲 |
| **Phase 1** | Core Runner | 🔲 |
| **Phase 2** | Policy Infrastructure | 🔲 |
| **Phase 3** | Naive Policy | 🔲 |
| **Phase 4** | Opportunistic Policy | 🔲 |
| **Phase 5** | Remaining Personas | 🔲 |
| **Phase 6** | Metrics & Aggregation | 🔲 |
| **Phase 7** | Dashboard & Visualisations | 🔲 |
| **Phase 8** | Testing & Validation | 🔲 |
| **Phase 9** | Polish & Optimisation | 🔲 |

---

## Minimum Viable Product (MVP) – First Ship

To get a working simulator *fast*, complete:

- Phase 0 (all)
- Phase 1 (all)
- Phase 2 (all)
- Phase 3 (Naive)
- Phase 6 (metrics, basic aggregation)
- Phase 7 (basic dashboard: config, progress, survival, one chart)
- Phase 8 (reproducibility test)

**MVP Deliverable:** Working end‑to‑end simulator running Naive careers, producing trace data and basic results.

Everything else can be incrementally added.