# NPC Combat AI — Implementation Task List
## Building design_npc_combat_ai.md

Depends on `tasks_combat_rework_updated.md` (naval/boarding resolvers) being complete
— this task list replaces that document's Part 7 (AI stub) with the real
scoring-based implementation, and adds two new tools: a debug combat button and a
standalone self-play simulation harness.

---

## Part 1 — Data: Faction Archetypes & Origin Modifiers

### Task 1.1 — Add `AI_ARCHETYPES` to `data.js`

**Where**: new constant, one entry per faction. Each is a set of base weight
multipliers applied to the relevant action scores (Section 4.1 of the design doc).

```js
// Base personality weights per faction. Multiplied into action scores alongside
// risk intensity and dynamic (Tier 2) signals. Values are relative, not probabilities
// — they get normalized during selection (Part 3). Tune via the simulation harness
// (Part 8), not by guessing — these starting values are a reasonable first pass only.
const AI_ARCHETYPES = {
  english:  { broadside: 1.0, precision: 1.0, close: 0.8, open: 0.8, grapple: 0.7 },
  spanish:  { broadside: 1.2, precision: 0.8, close: 0.6, open: 0.7, grapple: 0.5 }, // disciplined gunnery
  french:   { broadside: 0.9, precision: 1.1, close: 1.0, open: 0.7, grapple: 0.8 },
  dutch:    { broadside: 1.0, precision: 1.0, close: 0.7, open: 1.1, grapple: 0.5 }, // trade-minded, avoids melee
  pirate:   { broadside: 0.8, precision: 0.7, close: 1.3, open: 0.5, grapple: 1.4 }, // boarders
};
```

Export in `window.D`. **These numbers are placeholders for structure, not final
balance** — the simulation harness in Part 8 is what actually validates and tunes
them.

### Task 1.2 — Add `AI_ORIGIN_MODIFIERS` to `data.js`

**Where**: new constant. Small deltas only, added on top of the archetype base — per
design doc Section 4.1, this is deliberately not a full second table.

```js
// Small additive deltas to grapple/continue-fighting weight, keyed by
// encounterSession.type. Anything not listed gets no modifier (neutral).
const AI_ORIGIN_MODIFIERS = {
  mission_combat:     { grapple: +0.3, continueFighting: +0.2 }, // generated to be fought
  escort_defend:      { grapple: -0.3, continueFighting: -0.2 }, // protecting cargo, not hunting
  hostile_port_entry: { grapple: +0.2 },
  navy_patrol:        {}, // neutral
  random:              {}, // neutral
};
```

Export in `window.D`.

---

## Part 2 — Logic: Signal Functions

### Task 2.1 — Tier 1 static signal computation

**Where**: `logic.js`, new function. Computed once per battle, not per round — call at
battle start (`INTERCEPT_FIGHT`) and store the result on `encounterSession` (e.g.
`encounterSession.aiDisposition`) so both the AI scorer and the flavor text generator
(Part 6) read the identical precomputed values, per design doc Section 6.

```js
// Returns a flat disposition object combining faction archetype, risk, origin,
// and player-standing signals. See design doc Section 4.1.
const computeAIDisposition = (state, enemy, encounterType) => {
  const archetype = window.D.AI_ARCHETYPES[enemy.faction] ?? window.D.AI_ARCHETYPES.pirate;
  const originMod = window.D.AI_ORIGIN_MODIFIERS[encounterType] ?? {};
  const riskMult = { low: 0.7, medium: 1.0, high: 1.3, assault: 1.6 }[enemy.risk] ?? 1.0;

  const heatLevel = state.factionAlerts?.[enemy.faction] ?? 0;
  const fame = state.fame ?? 0;
  const infamy = state.infamy ?? 0;

  return {
    weights: {
      broadside: archetype.broadside * riskMult,
      precision: archetype.precision * riskMult,
      close:     archetype.close,
      open:      archetype.open,
      grapple:   (archetype.grapple + (originMod.grapple ?? 0)) * riskMult,
    },
    continueFightingBonus: (originMod.continueFighting ?? 0) + (heatLevel >= 5 ? 0.3 : 0) + (infamy >= 50 ? 0.15 : 0),
    surrenderWillingness: Math.max(0, 0.4 + (fame / 500) - (infamy / 300)), // 0..~1 range
    riskLevel: enemy.risk,
  };
};
```

Export `computeAIDisposition` in `window.L`.

### Task 2.2 — Tier 2 dynamic signal helpers

**Where**: `logic.js`, small pure functions, called fresh every round.

```js
// All return 0..1-ish normalized values, not raw stat differences.
const getHullAdvantage = (selfHull, selfMaxHull, oppHull, oppMaxHull) =>
  (selfHull / selfMaxHull) - (oppHull / oppMaxHull);

const getCrewAdvantage = (selfCrew, oppCrew) => {
  const total = selfCrew + oppCrew;
  return total === 0 ? 0 : (selfCrew - oppCrew) / total;
};

const getSpeedDifferential = (selfSpeed, oppSpeed) => selfSpeed - oppSpeed;
```

Export all three in `window.L`.

---

## Part 3 — Logic: The Generic Scorer & Selector

### Task 3.1 — Build the side-agnostic naval action scorer

**Where**: `logic.js`, new function. **This is the core architectural requirement
from design doc Section 2** — must take plain `self`/`opponent` snapshots, never read
`encounterSession.enemy` by name internally, so both the shipped one-sided AI and the
simulation harness call the exact same function.

```js
// self / opponent: { hull, maxHull, crew, speed }
// disposition: output of computeAIDisposition (or an equivalent constructed one for
// self-play, where "self" is being scored as if it held the enemy role)
// legalActions: array from D.LEGAL_ACTIONS_BY_DISTANCE[distance]
// Returns: { actionName: score, ... } for every legal action — caller selects.
const scoreNavalActions = (self, opponent, distance, disposition, legalActions) => {
  const hullAdv = getHullAdvantage(self.hull, self.maxHull, opponent.hull, opponent.maxHull);
  const crewAdv = getCrewAdvantage(self.crew, opponent.crew);
  const speedDiff = getSpeedDifferential(self.speed, opponent.speed);
  const w = disposition.weights;

  const distanceFit = {
    broadside: window.D.DISTANCE_DAMAGE_MULTIPLIERS.broadside[distance],
    precision: window.D.DISTANCE_DAMAGE_MULTIPLIERS.precision[distance],
  };

  const scores = {};
  if (legalActions.includes("broadside")) {
    scores.broadside = w.broadside * distanceFit.broadside * (1 - Math.max(0, -hullAdv));
  }
  if (legalActions.includes("precision")) {
    scores.precision = w.precision * distanceFit.precision * (1 + Math.max(0, -hullAdv));
  }
  if (legalActions.includes("close_distance")) {
    scores.close_distance = w.close * Math.max(0.2, 0.5 + crewAdv) * (speedDiff >= 0 ? 1.0 : 0.6);
  }
  if (legalActions.includes("open_distance")) {
    scores.open_distance = w.open * Math.max(0.2, 0.5 + Math.max(0, -hullAdv) + Math.max(0, -crewAdv)) * (speedDiff >= 0 ? 1.0 : 0.6);
  }
  if (legalActions.includes("grapple")) {
    scores.grapple = w.grapple * Math.max(0.1, 0.5 + crewAdv);
  }

  return scores;
};
```

Export in `window.L`.

### Task 3.2 — Build the side-agnostic boarding action scorer

**Where**: `logic.js`, new function. Same genericity requirement.

```js
// ratio: from the self side's perspective (self's share of combined effectiveness)
// moraleThresholdShift: from disposition or a direct override (see Part 4)
const scoreBoardingActions = (ratio, disposition, moraleThresholdShift = 0) => {
  const scores = {};
  scores.continue_fighting =
    (disposition.riskLevel === "high" || disposition.riskLevel === "assault" ? 1.2 : 1.0)
    + disposition.continueFightingBonus
    + ratio;

  const fallBackPressure = Math.max(0, 0.5 - ratio - moraleThresholdShift);
  scores.fall_back =
    (disposition.riskLevel === "low" ? 1.3 : disposition.riskLevel === "high" ? 0.6 : 1.0)
    * fallBackPressure * 2;

  // Surrender only scored (and only chosen) at genuinely low ratio — a deliberate
  // floor, not just a naturally-low score, so the NPC doesn't yield early just
  // because Continue looks mildly unfavorable.
  scores.surrender = ratio < 0.25
    ? disposition.surrenderWillingness * (0.25 - ratio) * 4
    : 0;

  return scores;
};
```

Export in `window.L`.

### Task 3.3 — Build the weighted-random selector

**Where**: `logic.js`, new function. Per design doc Section 5 — not pure argmax.

```js
// scores: { actionName: number, ... } — from either scorer above.
// Picks among the top `topN` scores, weighted by their relative score values.
const selectWeightedAction = (scores, topN = 2) => {
  const entries = Object.entries(scores).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const pool = entries.slice(0, Math.min(topN, entries.length));
  const total = pool.reduce((sum, [, v]) => sum + v, 0);
  let roll = Math.random() * total;
  for (const [action, weight] of pool) {
    roll -= weight;
    if (roll <= 0) return action;
  }
  return pool[0][0]; // fallback, floating point safety
};
```

Export in `window.L`.

---

## Part 4 — Wiring the Shipped Game's One-Sided AI

### Task 4.1 — Replace the naval AI stub

**Where**: `logic.js`, replacing `getNPCNavalAction` from
`tasks_combat_rework_updated.md` Part 7. Now a **thin wrapper** around the generic
scorer — per design doc Section 2, all real logic lives in Task 3.1/3.3.

```js
const getNPCNavalAction = (state, encounterSession) => {
  const { distance } = encounterSession.battle;
  const enemy = encounterSession.enemy;
  const disposition = encounterSession.aiDisposition
    ?? computeAIDisposition(state, enemy, encounterSession.type);

  const self = { hull: enemy.hull, maxHull: enemy.maxHull, crew: enemy.crew, speed: enemy.speed };
  const opponent = {
    hull: encounterSession.battle.playerHull,
    maxHull: getShipStats(state).maxHull,
    crew: encounterSession.battle.playerCrew,
    speed: getShipStats(state).speed,
  };

  const legalActions = window.D.LEGAL_ACTIONS_BY_DISTANCE[distance];
  const scores = scoreNavalActions(self, opponent, distance, disposition, legalActions);
  return selectWeightedAction(scores);
};
```

Export, replacing the old stub in `window.L`.

### Task 4.2 — Replace the boarding AI stub

**Where**: `logic.js`, replacing `getNPCBoardingAction`.

```js
const getNPCBoardingAction = (state, encounterSession) => {
  const ratio = 1 - getBoardingRatio(state, encounterSession); // enemy's own share
  const disposition = encounterSession.aiDisposition
    ?? computeAIDisposition(state, encounterSession.enemy, encounterSession.type);
  const moraleShift = { low: -0.1, medium: 0, high: 0.1, assault: 0.2 }[disposition.riskLevel] ?? 0;

  const scores = scoreBoardingActions(ratio, disposition, moraleShift);
  return selectWeightedAction(scores, 2);
};
```

Export, replacing the old stub.

### Task 4.3 — Populate `encounterSession.aiDisposition` at battle start

**Where**: `engine_combat.js`, `INTERCEPT_FIGHT` handler, alongside the `battle`
sub-object population from `tasks_combat_rework_updated.md` Task 1.1.

```js
aiDisposition: L.computeAIDisposition(state, enemySnapshot, encounterSession.type),
```

Computed once, reused every round by both `getNPCNavalAction`/`getNPCBoardingAction`
and the flavor text generator (Part 6).

---

## Part 5 — Remove Evade/Demand Surrender From NPC Reachability

### Task 5.1 — Confirm the NPC scorers never produce these actions

Already true by construction — `scoreNavalActions` has no `evade` entry, and
`scoreBoardingActions` has no `demand_surrender` entry. **No filtering logic needed
elsewhere** — this is a natural consequence of the scorers' action sets, not a
separate exclusion rule to maintain. Add a one-line comment in both functions noting
this is deliberate (design doc Section 3), so a future contributor doesn't "fix" the
apparent gap by adding them back in.

---

## Part 6 — Combat Flavor Text Generator

### Task 6.1 — Build `generateCombatFlavour`

**Where**: `generators.js`, new function, same idiom as `generatePortGossip` /
`generateMarketFlavour`. Reads `encounterSession.aiDisposition` (Task 4.3's output) —
the same values driving the AI's actual choices, per design doc Section 6.

```js
const generateCombatFlavour = (disposition) => {
  const { weights, riskLevel } = disposition;
  const pool = [];

  if (weights.grapple > 1.0 && weights.close > 0.9) {
    pool.push("They're closing fast — this crew means to board.");
  }
  if (weights.open > 1.0 && weights.close < 0.7) {
    pool.push("They're keeping their distance, guns ready.");
  }
  if (riskLevel === "low") {
    pool.push("They look like they'd rather not be here.");
  }
  if (riskLevel === "assault" || riskLevel === "high") {
    pool.push("Their gunners are already in position. No hesitation here.");
  }
  if (disposition.surrenderWillingness > 0.6) {
    pool.push("Word of your reputation may have reached this crew already.");
  }
  if (disposition.surrenderWillingness < 0.2) {
    pool.push("This crew looks ready to fight to the last.");
  }

  return pool.length > 0
    ? pool[Math.floor(Math.random() * pool.length)]
    : "The two ships size each other up.";
};
```

Export in `window.G`. Add 3–5 more template variants per bucket once the structure is
confirmed working — this draft has one per condition, matching the sparse-pool pattern
used elsewhere (e.g. `generateLocalMarketGossip`), not final content.

### Task 6.2 — Surface it on the InterceptScreen

**Where**: `screens_combat.jsx`, `InterceptScreen`. Compute once when the session
opens (or read a pre-computed value stored on `encounterSession.intercept`), display
above or alongside the existing flavour text.

---

## Part 7 — Debug Combat Button

### Task 7.1 — Add `DEBUG_COMBAT` action

**Where**: `engine_core.js`, alongside the existing `DEBUG_SET_SHIP` pattern
(`A.DEBUG_SET_SHIP` at line 59, case at line 257 — follow the identical structure).

```js
DEBUG_COMBAT: "DEBUG_COMBAT",
```

```js
case window.E.A.DEBUG_COMBAT: {
  const enemy = G.generateEnemy("medium", state.fame ?? 0, action.faction ?? "pirate");
  const encounterSession = {
    type: "random",
    phase: "battle",
    notableNPCId: null,
    enemy: { ...enemy, maxHull: enemy.hull }, // generateEnemy's hull IS the max at generation time
    source: { kind: "world", id: "debug" },
    modifiers: [],
    intercept: null,
    battle: {
      round: 1, log: [], playerHull: state.ship.hull,
      playerCrew: state.crew.roster.length, initialPlayerCrew: state.crew.roster.length,
      lostCrewNames: [],
      distance: L.initialDistanceFor("random"),
      subPhase: "naval",
    },
    plunder: null,
    aiDisposition: L.computeAIDisposition(state, enemy, "random"),
    returnScreen: "port",
  };
  return { ...state, encounterSession, screen: "battle" };
}
```

**Note**: "medium risk for the player's fame tier" is already what
`G.generateEnemy("medium", state.fame, faction)` does — risk and fame together
determine the generated stat scaling, per the existing generator. No new scaling logic
needed, just calling it with a fixed `"medium"` risk argument.

### Task 7.2 — Add the debug panel button

**Where**: `App.jsx`, `DebugPanel`, alongside the existing ship-type buttons (~line
351). Offer a faction picker (5 buttons, same pattern as the ship-type row) so the
archetype/faction axis can be spot-checked directly in-game, not just via the
simulation harness.

```jsx
<div style={{ marginTop: 8 }}>
  <div style={{ fontSize: 10, color: T.textFaint, marginBottom: 4 }}>Debug Combat</div>
  {["english","spanish","french","dutch","pirate"].map(f => (
    <button key={f} onClick={() => dispatch({ type: A.DEBUG_COMBAT, faction: f })}
      style={{ ...btnStyle, color: T.textDim }}>
      vs {f}
    </button>
  ))}
</div>
```

---

## Part 8 — Self-Play Simulation Harness

### Task 8.1 — Create `tools/combat_ai_sim.html`

**Where**: new standalone file, same load pattern as `tests.html`/`tests_coverage.html`
(plain `<script src>` for all `.js` game files — no Babel needed, this tool never
touches JSX or React).

**Load order**: `data.js` → `data_text.js` → `logic.js` → `generators.js` →
`engine_core.js` (for `SHIPS`/`FACTIONS` lookups and shared constants — the reducer
itself isn't needed since this harness calls `L.resolveNavalRound` /
`L.resolveBoardingRound` / the AI functions directly, not through `E.reducer`).

**Core simulation function**:

```js
// Builds minimal fake state/encounterSession fixtures — same shape the real engine
// uses, same pattern as tests_helpers.js's factories — and runs the ACTUAL production
// resolvers/scorers against them. This is what makes the harness a faithful validator,
// not a parallel reimplementation that could drift from shipped behavior.
function simulateOneBattle(configA, configB) {
  // configA/B: { faction, risk, hull, maxHull, crew, speed, moraleOverride? }
  const fakeStateA = buildFakeState(configA); // state.ship / state.crew shaped for side A
  let session = buildFakeSession(configA, configB); // encounterSession-shaped, A as "player", B as "enemy"

  const roundLog = [];
  let rounds = 0;
  const MAX_ROUNDS = 50; // safety cap against a pathological infinite-continue loop

  while (rounds < MAX_ROUNDS) {
    rounds++;
    if (session.battle.subPhase === "naval") {
      // Call the SAME generic scorer twice, once per side, per design doc Section 2 —
      // this is the whole point of the side-agnostic architecture.
      const actionA = pickSideAction(fakeStateA, session, "A");
      const actionB = pickSideAction(fakeStateA, session, "B");
      const result = L.resolveNavalRound(fakeStateA, actionA, actionB, session);
      roundLog.push({ round: rounds, phase: "naval", actionA, actionB, distance: session.battle.distance, outcome: result.outcome });
      applyNavalResult(session, result); // mutates session.battle/enemy per result, or returns terminal
      if (isTerminalOutcome(result.outcome)) return { outcome: result.outcome, rounds, roundLog };
    } else {
      const actionA = pickSideBoardingAction(fakeStateA, session, "A");
      const actionB = pickSideBoardingAction(fakeStateA, session, "B");
      const result = L.resolveBoardingRound(fakeStateA, actionA, actionB, session);
      roundLog.push({ round: rounds, phase: "boarding", actionA, actionB, ratio: L.getBoardingRatio(fakeStateA, session), outcome: result.outcome });
      applyBoardingResult(session, result);
      if (isTerminalOutcome(result.outcome)) return { outcome: result.outcome, rounds, roundLog };
    }
  }
  return { outcome: "timeout", rounds, roundLog }; // flag as a data point, not a crash
}
```

`pickSideAction`/`pickSideBoardingAction` are the harness's own small wrappers that
construct the right `self`/`opponent` view (swapping which side is "self" depending on
whether A or B is being asked) and call `L.scoreNavalActions`/`L.scoreBoardingActions`
+ `L.selectWeightedAction` directly — the exact same functions Part 3/4 wired into the
shipped game, called from both directions.

**Note on surrender/evade in results**: since the NPC-side scorers never produce
`evade` or `demand_surrender` (Part 5), and this harness treats *both* sides as
NPC-scored for pure self-play, **no simulated battle will ever end in Evade success or
a Demand-Surrender outcome** — every battle resolves to Sunk, Captured, wipeout, or
voluntary Surrender (or the `MAX_ROUNDS` timeout safety valve). This matches the
original request's own expectation — those two paths need manual player-side testing,
not simulation.

### Task 8.2 — Scenario presets

**Where**: same file, a row of preset buttons above a "Run N Simulations" control
(default N = 200, adjustable).

1. **Faction comparison, identical stats** — same hull/crew/speed on both sides,
   faction varied (e.g. English vs. Pirate). Confirms archetype weights produce visibly
   different action distributions despite identical raw stats.
2. **Heat/reputation variance** — identical stats and faction, but vary
   `state.factionAlerts`/`state.reputation` inputs on the "player" fake state across
   runs. Confirms Continue Fighting's heat-driven persistence shows up in aggregate
   results.
3. **Hull/crew asymmetry** — deliberately mismatched stats (e.g. A: high hull/low
   crew, B: low hull/high crew), same faction both sides. Confirms Open Distance and
   Grapple respond to the *correct* one of the two independent drivers (design doc
   Section 4.2's dual-driver note) — this scenario is specifically designed to
   distinguish "avoiding for hull reasons" from "avoiding for crew reasons."
4. **Symmetry check** — fully identical configs on both sides (same faction, same
   stats, no overrides). Run at N ≥ 100. **Pass criterion: win rate between 45–55%
   for either side.** A result outside that band indicates a hidden asymmetry in the
   resolution pipeline itself (e.g. an unintended first-mover advantage), not an AI
   tuning issue — this is a correctness check on `resolveNavalRound`/
   `resolveBoardingRound`, piggybacking on the harness rather than needing a separate
   test.
5. **Mid-battle shift check** — any asymmetric scenario, single verbose run (N = 1,
   full round log displayed). Confirms action choices visibly shift as hull/crew
   advantage changes over the course of the *same* battle, not just differing in
   aggregate across separate battles.

### Task 8.3 — Results display

**Where**: same file, rendered after a run completes.

- **Outcome distribution**: bar or table of `{sunk_A, sunk_B, captured_A, captured_B,
  timeout}` counts and percentages
- **Average rounds to resolution**
- **Action frequency histogram**, per side, per phase (naval/boarding), aggregated
  across all runs in the batch
- **Distance-time distribution**: % of naval rounds spent at each of Far/Medium/Close,
  per side — useful to visually confirm a "skittish" archetype (e.g. Dutch) actually
  spends more time at Far than a "boarder" archetype (Pirate)
- **Symmetry check verdict**: for Scenario 4 specifically, a pass/fail readout against
  the 45–55% band, not just raw numbers
- **Full round log table**, shown only for single-run (N=1) verbose mode (Scenario 5),
  since a full log for 200 runs would be unusable — one row per round, columns for
  both sides' chosen actions, distance/ratio, and outcome

### Task 8.4 — Manual configuration panel

**Where**: same file, below the presets — free-form inputs for faction, risk, hull,
maxHull, crew, speed, and optional heat/reputation/fame/infamy overrides per side, plus
an N-runs field. Lets you construct scenarios beyond the five presets without editing
the file directly. Each preset button (Task 8.2) should simply populate this panel's
fields and trigger a run, rather than being separate hard-coded logic paths — keeps
the tool to one configuration mechanism, not two.

---

## Part 9 — Automated Test Coverage

### Task 9.1 — `tests_logic.js`: signal functions

- `L.AISIG.01` — `getHullAdvantage`: symmetric inputs → 0; clear advantage → positive
- `L.AISIG.02` — `getCrewAdvantage`: normalized correctly, symmetric inputs → 0
- `L.AISIG.03` — `computeAIDisposition`: known faction + risk combination produces
  expected weight values (spot-check the archetype table lookup works)
- `L.AISIG.04` — `computeAIDisposition`: high infamy raises `continueFightingBonus`
  and lowers `surrenderWillingness`; high fame raises `surrenderWillingness`

### Task 9.2 — `tests_logic.js`: scorers never produce removed actions

- `L.AISCORE.01` — `scoreNavalActions`: returned object never contains an `evade` key,
  across a range of inputs (regression guard for design doc Section 3.1)
- `L.AISCORE.02` — `scoreBoardingActions`: returned object never contains a
  `demand_surrender` key (regression guard for Section 3.2)

### Task 9.3 — `tests_logic.js`: selector behavior

- `L.AISELECT.01` — `selectWeightedAction`: with one dominant score, returns that
  action in the large majority of samples (statistical test, not 100% — it's
  weighted-random by design)
- `L.AISELECT.02` — `selectWeightedAction`: empty/all-zero scores returns `null`
  without throwing

### Task 9.4 — `tests_engine.js`: `DEBUG_COMBAT`

- `E.DEBUG.COMBAT.01` — dispatching `DEBUG_COMBAT` produces a valid
  `encounterSession` in naval battle phase, with enemy risk fixed at `"medium"`
  regardless of player fame

---

## Build Order

1. Part 1 (data tables) — no dependencies
2. Part 2 (signal functions) — depends on Part 1's constants existing
3. Part 3 (generic scorers + selector) — depends on Part 2
4. Part 4 (wire into shipped game) — depends on Part 3
5. Part 5 — verification only, no new code
6. Part 6 (flavor text) — depends on Part 4's `aiDisposition` field existing
7. Part 7 (debug button) — depends on Part 4
8. Part 8 (simulation harness) — depends on Parts 3–4 (calls the same functions
   directly); can be built in parallel with Parts 6–7 once Part 4 lands
9. Part 9 (tests) — incrementally alongside Parts 2–4; Task 9.2's regression guards are
   the highest-value tests here, same reasoning as the combat rework list — they
   encode a deliberate design decision (Section 3) that would be easy to accidentally
   reverse later without realizing it contradicts the design doc