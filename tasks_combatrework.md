# Combat Rework — Implementation Task List
## B11: Building the design in design_combat_rework.md

Read `design_combat_rework.md` first — every task below references a specific,
already-settled decision from that document. This list assumes B11.1's architecture
refactor (unified encounter/activeMission/battleState model) either already happened
or happens as Part 1 here — check current state of `engine_combat.js` before starting,
since some of the groundwork may already exist.

---

## Part 1 — Prerequisite: Encounter Architecture Groundwork

### Task 1.1 — Confirm or build the unified battleState shape

**Where**: `engine_core.js`, `window.E.createBattleState`.

Current shape (confirmed): `{ phase, playerHull, playerCrew, enemy, enemyHull,
enemyCrew, round, log, returnScreen, initialCrewCount, lostCrewNames, encounterType,
...escort-specific fields }`.

**Add**:
```js
distance: initialDistanceFor(encounterType),   // "far" | "medium" | "close"
subPhase: "naval",                             // "naval" | "boarding"
```

**Add helper** `initialDistanceFor(encounterType)` in `engine_core.js` or `logic.js`:
```js
const initialDistanceFor = (encounterType) => {
  const closeRangeTypes = ["navy_patrol", "navy_patrol_combat", "hostile_port_entry",
                            "escort_defend", "distressed_merchant_plunder"];
  return closeRangeTypes.includes(encounterType) ? "close" : "far";
};
```

Per design doc Section 3.1 — starting distance is derived from encounter type, not
random. Adjust the exact type list against `buildEncounterContext`'s actual type set
(logic.js ~line 844) if any types are missing from this draft list.

---

## Part 2 — Distance & Contest Mechanics (logic.js)

### Task 2.1 — Add the shared contest formula

**Where**: `logic.js`, new exported function.

```js
// Shared contest resolver for any speed-differential-based action pair
// (Close vs Open, Grapple vs Open, Evade vs Close). See design doc Section 3.4.
const resolveSpeedContest = (actorSpeed, opposerSpeed) => {
  const chance = 0.5 + (actorSpeed - opposerSpeed) * 0.03;
  const clamped = Math.max(0.15, Math.min(0.85, chance));
  return Math.random() < clamped; // true = actor's action succeeds
};
```

Export in `window.L`.

### Task 2.2 — Add distance-based damage multiplier lookup

**Where**: `data.js`, new constant.

```js
// See design doc Section 3.3
const DISTANCE_DAMAGE_MULTIPLIERS = {
  broadside: { far: 0.6, medium: 1.0, close: 0.9 },
  precision: { far: 1.1, medium: 1.0, close: 0.7 },
};
```

Export in `window.D`.

### Task 2.3 — Add legal-action-by-distance lookup

**Where**: `data.js`, new constant.

```js
// See design doc Section 3.2
const LEGAL_ACTIONS_BY_DISTANCE = {
  far:    ["broadside", "precision", "close_distance", "evade"],
  medium: ["broadside", "precision", "close_distance", "open_distance"],
  close:  ["broadside", "precision", "open_distance", "grapple"],
};
```

Export in `window.D`. Used by the UI to grey out illegal actions (Section 9 of design
doc) and by the reducer to reject illegal action dispatches defensively.

---

## Part 3 — Naval Battle Resolution (engine_combat.js / logic.js)

### Task 3.1 — Build the ordered resolver function

**Where**: new function in `logic.js`, replacing the ad-hoc per-action-type branches
in the current `resolveCombatAction`. This is the centerpiece of the rework — implement
the exact five-step order from design doc Section 4, not a reordered variant.

```js
// Resolves one round of Naval Battle combat. Returns:
// { playerHullDamage, enemyHullDamage, playerCrewLoss, enemyCrewLoss,
//   newDistance, outcome: "continue" | "player_evaded" | "enemy_evaded" |
//   "boarding_begins" | "player_sunk" | "enemy_sunk" | "player_captured" |
//   "enemy_captured", log: [...] }
const resolveNavalRound = (state, playerAction, enemyAction, battleState) => {
  const distance = battleState.distance;
  const playerSpeed = getShipStats(state).speed;
  const enemySpeed = SHIPS[guessShipType(battleState.enemy)]?.speed ?? 10;

  // ── Step 1: Evade ──────────────────────────────────────────────────
  // Contested ONLY against an opposing Close Distance declaration.
  // Succeeds automatically against everything else. See design doc 4.2.
  if (playerAction === "evade") {
    const opposed = enemyAction === "close_distance";
    const succeeds = opposed
      ? resolveSpeedContest(playerSpeed, enemySpeed)
      : true;
    if (succeeds) return { outcome: "player_evaded", log: [] };
    // Opposed and failed: fall through to Reposition ONLY — closer wins, no gunfire.
    // Do not evaluate Damage for this round in this specific case.
    const newDistance = stepDistance(distance, -1);
    return { outcome: "continue", newDistance, log: [] };
  }
  if (enemyAction === "evade") {
    const opposed = playerAction === "close_distance";
    const succeeds = opposed
      ? resolveSpeedContest(enemySpeed, playerSpeed)
      : true;
    if (succeeds) return { outcome: "enemy_evaded", log: [] };
    const newDistance = stepDistance(distance, -1);
    return { outcome: "continue", newDistance, log: [] };
  }

  // ── Step 2: Damage ─────────────────────────────────────────────────
  // Only fires for Broadside/Precision actions. Uses `distance` as captured
  // above — the value at the START of this round, before any reposition.
  let playerHullDamage = 0, enemyHullDamage = 0, playerCrewLoss = 0, enemyCrewLoss = 0;
  if (playerAction === "broadside" || playerAction === "precision") {
    const mult = window.D.DISTANCE_DAMAGE_MULTIPLIERS[playerAction][distance];
    // apply existing damage/crewLoss formulas × mult → enemyHullDamage / enemyCrewLoss
  }
  if (enemyAction === "broadside" || enemyAction === "precision") {
    const mult = window.D.DISTANCE_DAMAGE_MULTIPLIERS[enemyAction][distance];
    // apply existing damage/crewLoss formulas × mult → playerHullDamage / playerCrewLoss
  }

  // ── Step 3: Hull/Crew check ────────────────────────────────────────
  // See design doc Section 6 for Sunk vs Captured, and 6.1/6.2 for the two
  // tie-break rules. THIS ORDER MATTERS — do not reorder these checks.
  const newPlayerHull = Math.max(0, state.ship.hull - playerHullDamage);
  const newEnemyHull  = Math.max(0, battleState.enemyHull - enemyHullDamage);
  const newPlayerCrew = Math.max(0, battleState.playerCrew - playerCrewLoss);
  const newEnemyCrew  = Math.max(0, battleState.enemyCrew - enemyCrewLoss);

  const playerDefeated = newPlayerHull === 0 || newPlayerCrew === 0;
  const enemyDefeated  = newEnemyHull === 0 || newEnemyCrew === 0;

  if (playerDefeated || enemyDefeated) {
    // Tie-break rule 1 (design 6.1): player defeat takes priority in mutual defeat.
    if (playerDefeated) {
      // Tie-break rule 2 (design 6.2): same-side dual condition — Sunk overrides Captured.
      const outcome = newPlayerHull === 0 ? "player_sunk" : "player_captured";
      return { outcome, playerHullDamage, enemyHullDamage, playerCrewLoss, enemyCrewLoss, log: [] };
    }
    const outcome = newEnemyHull === 0 ? "enemy_sunk" : "enemy_captured";
    return { outcome, playerHullDamage, enemyHullDamage, playerCrewLoss, enemyCrewLoss, log: [] };
  }

  // ── Step 4: Reposition ─────────────────────────────────────────────
  let newDistance = distance;
  const bothClose = playerAction === "close_distance" && enemyAction === "close_distance";
  const bothOpen  = playerAction === "open_distance"  && enemyAction === "open_distance";
  const closeOpenContest = (playerAction === "close_distance" && enemyAction === "open_distance") ||
                            (playerAction === "open_distance"  && enemyAction === "close_distance");

  if (bothClose) newDistance = stepDistance(distance, -1);
  else if (bothOpen) newDistance = stepDistance(distance, +1);
  else if (closeOpenContest) {
    const playerWantsClose = playerAction === "close_distance";
    const actorSpeed = playerWantsClose ? playerSpeed : enemySpeed;
    const opposerSpeed = playerWantsClose ? enemySpeed : playerSpeed;
    const actorWins = resolveSpeedContest(actorSpeed, opposerSpeed);
    if (actorWins) newDistance = stepDistance(distance, playerWantsClose ? -1 : +1);
  } else if (playerAction === "close_distance" || playerAction === "open_distance") {
    newDistance = stepDistance(distance, playerAction === "close_distance" ? -1 : +1);
  } else if (enemyAction === "close_distance" || enemyAction === "open_distance") {
    newDistance = stepDistance(distance, enemyAction === "close_distance" ? -1 : +1);
  }

  // ── Step 5: Grapple ────────────────────────────────────────────────
  // Resolves against newDistance (post-reposition), NOT the round's starting distance.
  // Requires Close. See design doc 4.1 for why Grapple-vs-Open is now deterministic.
  const playerGrapples = playerAction === "grapple" && newDistance === "close";
  const enemyGrapples   = enemyAction === "grapple" && newDistance === "close";
  if (playerGrapples || enemyGrapples) {
    return { outcome: "boarding_begins", newDistance, playerHullDamage, enemyHullDamage,
             playerCrewLoss, enemyCrewLoss, log: [] };
  }

  return { outcome: "continue", newDistance, playerHullDamage, enemyHullDamage,
           playerCrewLoss, enemyCrewLoss, log: [] };
};

// Helper: Far=0, Medium=1, Close=2. Clamps at both ends.
const stepDistance = (current, delta) => {
  const order = ["far", "medium", "close"];
  const idx = order.indexOf(current);
  return order[Math.max(0, Math.min(2, idx + delta))];
};
```

Export `resolveNavalRound` and `stepDistance` in `window.L`.

### Task 3.2 — Replace `BATTLE_ACTION`'s dispatch logic in `engine_combat.js`

**Where**: `engine_combat.js`, wherever `BATTLE_ACTION` currently branches per action
type. Replace with a call to `L.resolveNavalRound`, then translate its `outcome` field
into the appropriate state transition:

- `player_evaded` / `enemy_evaded` → end encounter, no plunder, appropriate log
- `player_sunk` / `enemy_sunk` → defeat/victory, no plunder
- `player_captured` / `enemy_captured` → defeat/victory, **full plunder available**
  (this is the mechanical difference from `_sunk` — set `canPlunder: true` on capture,
  `false` on sunk)
- `boarding_begins` → set `battleState.subPhase = "boarding"`, do NOT end the battle
- `continue` → update `battleState.distance = newDistance`, apply damage, next round

### Task 3.3 — Gate the UI to only offer legal actions per distance

**Where**: `screens_combat.jsx`, `BattleScreen`'s action buttons. Use
`D.LEGAL_ACTIONS_BY_DISTANCE[battleState.distance]` to determine which of the 6 actions
(Broadside, Precision, Close Distance, Open Distance, Evade, Grapple) render as
enabled vs. disabled-with-tooltip (design doc Section 9 — show, don't hide).

---

## Part 4 — Boarding Phase

### Task 4.1 — Add the effective-strength and ratio calculation

**Where**: `logic.js`, new function.

```js
// See design doc Section 7.1. Enemy morale is derived from risk tier since the
// enemy object has no morale field of its own.
const RISK_MORALE_STANDIN = { low: 50, medium: 65, high: 80, assault: 90 };

const getBoardingRatio = (state, battleState) => {
  const playerMorale = state.crew.morale;
  const playerEffective = battleState.playerCrew * (0.5 + playerMorale / 200);

  const enemyMorale = RISK_MORALE_STANDIN[battleState.enemy.risk] ?? 60;
  const enemyEffective = battleState.enemyCrew * (0.5 + enemyMorale / 200);

  return playerEffective / (playerEffective + enemyEffective);
};
```

Export `getBoardingRatio` in `window.L`. Note: confirm `battleState.enemy.risk` is
actually populated — see Part 6 below.

### Task 4.2 — Build the boarding round resolver

**Where**: `logic.js`, new function implementing the resolution order from design doc
Section 7.3.

```js
// Resolves one round of Boarding. Returns:
// { outcome: "continue" | "enemy_win_capture" | "player_defeated_by_demand" |
//   "returned_to_naval" | "player_wipeout" | "enemy_wipeout" |
//   "player_surrendered" | "enemy_surrendered",
//   playerCrewLoss, enemyCrewLoss, newRatio, log: [...] }
const resolveBoardingRound = (state, playerAction, enemyAction, battleState) => {
  // ── Step 1: Surrender — final, nothing else evaluates ──────────────
  if (playerAction === "surrender" || enemyAction === "surrender") {
    const whoSurrendered = playerAction === "surrender" ? "player" : "enemy";
    return { outcome: `${whoSurrendered}_surrendered`, log: [] };
  }

  // ── Step 2: Demand Surrender vs Fall Back — AUTOMATIC success ──────
  // See design doc 7.4 — this is NOT a probability roll.
  if (playerAction === "demand_surrender" && enemyAction === "fall_back") {
    return { outcome: "enemy_win_capture", log: [] };
  }
  if (enemyAction === "demand_surrender" && playerAction === "fall_back") {
    return { outcome: "player_defeated_by_demand", log: [] };
  }

  const ratio = getBoardingRatio(state, battleState);

  // ── Step 3: Demand Surrender vs Continue — probability roll ────────
  if (playerAction === "demand_surrender") {
    if (ratio < 0.65) throw new Error("Demand Surrender declared below threshold — UI should have blocked this");
    const successChance = (ratio - 0.5) * 2;
    if (Math.random() < successChance) return { outcome: "enemy_win_capture", log: [] };
    const cost = Math.ceil(battleState.playerCrew * 0.15 * (1 - ratio));
    const newPlayerCrew = Math.max(0, battleState.playerCrew - cost);
    if (newPlayerCrew === 0) return { outcome: "player_wipeout", playerCrewLoss: cost, log: [] };
    const newRatio = getBoardingRatio(state, { ...battleState, playerCrew: newPlayerCrew });
    return { outcome: "continue", playerCrewLoss: cost, newRatio, log: [] };
  }
  if (enemyAction === "demand_surrender") {
    const enemyRatio = 1 - ratio;
    if (enemyRatio < 0.65) throw new Error("Enemy Demand Surrender below threshold — AI should not have chosen this");
    const successChance = (enemyRatio - 0.5) * 2;
    if (Math.random() < successChance) return { outcome: "player_defeated_by_demand", log: [] };
    const cost = Math.ceil(battleState.enemyCrew * 0.15 * ratio);
    const newEnemyCrew = Math.max(0, battleState.enemyCrew - cost);
    if (newEnemyCrew === 0) return { outcome: "enemy_wipeout", enemyCrewLoss: cost, log: [] };
    const newRatio = getBoardingRatio(state, { ...battleState, enemyCrew: newEnemyCrew });
    return { outcome: "continue", enemyCrewLoss: cost, newRatio, log: [] };
  }

  // ── Step 4: Fall Back (mutual or one-sided) ────────────────────────
  const bothFallBack = playerAction === "fall_back" && enemyAction === "fall_back";
  if (bothFallBack) {
    return { outcome: "returned_to_naval", log: [] };
  }
  if (playerAction === "fall_back") {
    const cost = Math.ceil(battleState.playerCrew * 0.15 * (1 - ratio));
    const newPlayerCrew = Math.max(0, battleState.playerCrew - cost);
    // Section 7.5: crew-zero check BEFORE finalizing the return-to-naval transition
    if (newPlayerCrew === 0) return { outcome: "player_wipeout", playerCrewLoss: cost, log: [] };
    return { outcome: "returned_to_naval", playerCrewLoss: cost, log: [] };
  }
  if (enemyAction === "fall_back") {
    const cost = Math.ceil(battleState.enemyCrew * 0.15 * ratio);
    const newEnemyCrew = Math.max(0, battleState.enemyCrew - cost);
    if (newEnemyCrew === 0) return { outcome: "enemy_wipeout", enemyCrewLoss: cost, log: [] };
    return { outcome: "returned_to_naval", enemyCrewLoss: cost, log: [] };
  }

  // ── Step 5: Continue vs Continue ───────────────────────────────────
  const playerLoss = Math.ceil(battleState.playerCrew * 0.15 * (1 - ratio));
  const enemyLoss  = Math.ceil(battleState.enemyCrew * 0.15 * ratio);
  const newPlayerCrew = Math.max(0, battleState.playerCrew - playerLoss);
  const newEnemyCrew  = Math.max(0, battleState.enemyCrew - enemyLoss);

  // Section 7.5: crew-zero check before allowing another round
  const playerWiped = newPlayerCrew === 0;
  const enemyWiped  = newEnemyCrew === 0;
  if (playerWiped || enemyWiped) {
    // Same mutual-defeat priority as Naval Battle (design 6.1) — player wipeout
    // takes priority if both hit zero in the same exchange.
    const outcome = playerWiped ? "player_wipeout" : "enemy_wipeout";
    return { outcome, playerCrewLoss: playerLoss, enemyCrewLoss: enemyLoss, log: [] };
  }

  const newRatio = getBoardingRatio(state, { ...battleState, playerCrew: newPlayerCrew, enemyCrew: newEnemyCrew });
  return { outcome: "continue", playerCrewLoss: playerLoss, enemyCrewLoss: enemyLoss, newRatio, log: [] };
};
```

Export `resolveBoardingRound` in `window.L`.

### Task 4.3 — Wire `resolveBoardingRound` into `BATTLE_ACTION` when `subPhase === "boarding"`

**Where**: `engine_combat.js`, `BATTLE_ACTION` case — branch on `battleState.subPhase`
at the top: if `"naval"`, use Task 3.2's path; if `"boarding"`, call
`L.resolveBoardingRound` and translate its outcome:

- `player_wipeout` / `player_defeated_by_demand` → defeat, **captured** (boarding
  wipeout is always a capture-class outcome, never "sunk" — the ship itself was never
  targeted in a boarding fight)
- `enemy_wipeout` / `enemy_win_capture` → victory, full plunder
- `*_surrendered` → encounter ends with boarding-phase surrender terms (harsher than
  naval-phase surrender per design doc 7.2 — apply existing surrender consequence
  logic but with adjusted multipliers)
- `returned_to_naval` → `battleState.subPhase = "naval"`, distance stays `"close"`
  (falling back doesn't teleport away — an Open action is still needed to separate)
- `continue` → apply crew losses, update `battleState.ratio` for the UI bar

### Task 4.4 — Boarding action availability gating

**Where**: `screens_combat.jsx`, boarding-phase action buttons.

- **Demand Surrender**: enabled only when `L.getBoardingRatio(state, battleState) >=
  0.65`; disabled-with-tooltip otherwise ("Need a clear advantage")
- **Continue Fighting, Fall Back, Surrender**: always enabled

---

## Part 5 — UI: The Advantage Bar

### Task 5.1 — Build the split advantage bar component

**Where**: `screens_combat.jsx`, new sub-component rendered at the top of the boarding
phase's action area, above the buttons.

```jsx
function AdvantageBar({ state, battleState }) {
  const ratio = L.getBoardingRatio(state, battleState);
  const playerPct = Math.round(ratio * 100);
  const enemyPct = 100 - playerPct;

  return (
    <Panel style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", height: 20, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${playerPct}%`, background: T.greenBr }} />
        <div style={{ width: `${enemyPct}%`, background: T.redBr }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: T.captionFontSize }}>
        <span style={{ color: T.greenBr }}>Your crew: {battleState.playerCrew}</span>
        <span style={{ color: T.redBr }}>Enemy crew: {battleState.enemyCrew}</span>
      </div>
    </Panel>
  );
}
```

Use `Panel` (the rough-border component from the UI de-vibecodification work) for
visual consistency, not a plain bordered div.

---

## Part 6 — Enemy Object: Add Risk Tier

### Task 6.1 — Ensure `risk` is carried on the enemy object

**Where**: `generators.js`, `generateEnemy`. Confirm the returned object includes
`risk` (needed by Task 4.1's morale stand-in). If not already present, add it to the
return value.

---

## Part 7 — NPC AI Stub (deferred design, minimal implementation now)

### Task 7.1 — Extend `getNPCAction` for the new action set

**Where**: `logic.js`, existing `getNPCAction`. Per design doc Section 8, this is
explicitly a stub — reasonable but simple, not the full tuned behavior, which is a
separate follow-up design pass.

**Naval Battle stub logic**:
```js
const getNPCNavalAction = (battleState) => {
  const { distance, enemyHull, enemy } = battleState;
  const hullPct = enemyHull / (window.D.SHIPS[guessShipType(enemy)]?.maxHull ?? enemyHull);

  // Minimal viable logic: prefer firing, occasionally reposition, rarely grapple.
  // KNOWN GAP (design doc Section 8): does not yet avoid the Open-always-beats-Grapple
  // exploit deliberately, nor tune fall-back frequency. Both flagged for next pass.
  const roll = Math.random();
  if (distance === "close" && hullPct < 0.3 && roll < 0.3) return "open_distance";
  if (distance !== "close" && roll < 0.15) return "close_distance";
  return roll < 0.7 ? "broadside" : "precision";
};
```

**Boarding stub logic**:
```js
const getNPCBoardingAction = (battleState) => {
  const enemyRatio = 1 - getBoardingRatio(null, battleState);
  const roll = Math.random();
  if (enemyRatio >= 0.65 && roll < 0.4) return "demand_surrender";
  if (enemyRatio < 0.25 && roll < 0.3) return "fall_back"; // KNOWN GAP: tune later
  return "continue";
};
```

Export both in `window.L`. **Explicitly comment both functions as temporary stubs**
referencing design doc Section 8, so a future contributor doesn't mistake this for
finished AI design.

---

## Part 8 — Automated Test Coverage

All new tests follow the existing `tests_helpers.js` / `tests_logic.js` /
`tests_engine.js` conventions (`reg(id, name, run)`, `makeState`/`makeBattleState`
factories, deterministic where possible, `setRandomSequence` for genuinely
probabilistic cases).

### Task 8.1 — `tests_logic.js`: contest formula and helpers

- `L.CONTEST.01` — `resolveSpeedContest`: higher actor speed increases win
  probability (statistical test over N samples)
- `L.CONTEST.02` — `resolveSpeedContest`: extreme speed differential clamps to
  [0.15, 0.85], never reaches 0 or 1
- `L.DIST.01` — `stepDistance`: Far→Medium→Close on +1 steps, clamps at Close
- `L.DIST.02` — `stepDistance`: Close→Medium→Far on -1 steps, clamps at Far
- `L.DIST.03` — `initialDistanceFor`: navy_patrol/hostile_port_entry → "close";
  generic "random" → "far"

### Task 8.2 — `tests_logic.js`: `resolveNavalRound` — deterministic pairings

One test per row in design doc Section 5's pairing table where the outcome is
deterministic (no contest involved) — roughly 20 tests, e.g.:

- `L.NAVAL.01` — Br vs Br at Far: both take damage at 0.6× multiplier, distance
  unchanged
- `L.NAVAL.02` — Br vs Cl at Medium: firer deals damage, distance drops to Close
- `L.NAVAL.03` — Br vs Ev at any distance: Evade succeeds, zero damage taken by
  evader
- `L.NAVAL.04` — Cl vs Cl at Far: mutual, distance → Medium, zero damage
- `L.NAVAL.05` — Br vs Gr at Close, lethal shot: `outcome` is `"enemy_sunk"` (or
  `"player_sunk"`), NOT `"boarding_begins"` — the specific bug-fix case from design
  doc 4.1, worth its own explicit test
- `L.NAVAL.06` — Gr vs Gr at Close, no lethal damage: `outcome: "boarding_begins"`
- `L.NAVAL.07` — Op vs Gr at Close: Open resolves uncontested, distance → Medium,
  Grapple fails — confirms the accepted deterministic behavior from design 4.1 (this
  test exists specifically to catch a regression if this gets "fixed" back to a
  contest without re-reading the design doc)

### Task 8.3 — `tests_logic.js`: `resolveNavalRound` — contested pairings (seeded RNG)

- `L.NAVAL.08` — Cl vs Ev at Far, seeded to force evader win: `outcome:
  "player_evaded"`, zero damage
- `L.NAVAL.09` — Cl vs Ev at Far, seeded to force closer win: distance → Medium,
  encounter continues, zero damage (confirms the design 4.2 fix — no parting shot)
- `L.NAVAL.10` — Cl vs Op at Medium, seeded both directions: confirm winner's
  direction applies correctly each way

### Task 8.4 — `tests_logic.js`: mutual/same-side defeat tie-breaks

- `L.NAVAL.11` — construct a round where both sides' damage brings both hulls to 0
  simultaneously: `outcome` must be a `player_*` outcome, never `enemy_*` (design
  doc 6.1 — required for B9 correctness, not just a preference)
- `L.NAVAL.12` — construct a round where one side's hull AND crew both hit 0 from the
  same hit: `outcome` must be `"_sunk"`, never `"_captured"` (design doc 6.2)

### Task 8.5 — `tests_logic.js`: boarding resolver

- `L.BOARD.01` — `getBoardingRatio`: even crew/morale on both sides → ratio ≈ 0.5
- `L.BOARD.02` — `getBoardingRatio`: player crew advantage → ratio > 0.5
- `L.BOARD.03` — Continue vs Continue: both sides take proportional losses matching
  the `0.15 × (1∓ratio)` formula
- `L.BOARD.04` — Demand Surrender vs Fall Back: **always** resolves to capture,
  regardless of `ratio` — seed RNG to a value that would normally fail a probability
  roll, confirm it still succeeds (this is the specific fix from design 7.4, worth an
  explicit regression test)
- `L.BOARD.05` — Demand Surrender declared below 0.65 threshold: throws (defensive
  check from Task 4.2's stub)
- `L.BOARD.06` — Fall Back vs Continue, seeded so the retreater's cost brings them to
  exactly 0 crew: `outcome` is `"player_wipeout"` or `"enemy_wipeout"`, NOT
  `"returned_to_naval"` — the exact case that motivated Section 7.5, worth its own
  explicit test
- `L.BOARD.07` — mutual Fall Back: `outcome: "returned_to_naval"`, zero cost either
  side
- `L.BOARD.08` — Surrender vs anything: always resolves to the surrender outcome
  regardless of what the other side declared

### Task 8.6 — `tests_engine.js`: `BATTLE_ACTION` reducer integration

- `E.CMB.NAVAL.01` — dispatch `BATTLE_ACTION` with naval sub-phase, confirm
  `battleState.distance` updates correctly after a reposition round
- `E.CMB.NAVAL.02` — dispatch resulting in `boarding_begins`: confirm
  `battleState.subPhase` flips to `"boarding"` and the battle does NOT end
- `E.CMB.NAVAL.03` — dispatch resulting in `enemy_captured`: confirm `canPlunder:
  true` is set (as opposed to `enemy_sunk`, which should NOT set it)
- `E.CMB.BOARD.01` — dispatch `BATTLE_ACTION` with boarding sub-phase, `fall_back` vs
  `continue`: confirm `subPhase` returns to `"naval"` and `distance` remains `"close"`
- `E.CMB.BOARD.02` — dispatch resulting in boarding-phase surrender: confirm the
  applied consequence multiplier is harsher than a naval-phase `INTERCEPT_SURRENDER`
  (compare the two directly in one test)

### Task 8.7 — `tests_ui.js`: smoke tests for new UI states

- `U.SMOKE.NAVAL.01` — `BattleScreen` renders without throwing at each of the three
  distances, with the corresponding legal/illegal action set
- `U.SMOKE.BOARD.01` — `BattleScreen` renders without throwing in boarding sub-phase,
  including the `AdvantageBar` component with a range of `ratio` values (0.1, 0.5, 0.9)
- `U.SMOKE.BOARD.02` — Demand Surrender button renders disabled with tooltip when
  `ratio < 0.65`, enabled when `ratio >= 0.65`

---

## Build Order

1. Part 1 (groundwork) — confirm/extend `createBattleState`
2. Part 2 (distance/contest primitives in `logic.js`/`data.js`) — no dependencies
3. Part 6 (enemy risk field) — small, independent, needed by Part 4
4. Part 3 (naval resolution + reducer wiring)
5. Part 4 (boarding resolution + reducer wiring) — depends on Part 6
6. Part 7 (AI stub) — depends on Parts 3 and 4 existing
7. Part 5 (advantage bar UI) — depends on Part 4
8. Task 3.3 / 4.4 (action-gating UI) — depends on Parts 2–4
9. Part 8 (tests) — write incrementally alongside each part above, not all at the end;
   the specific regression tests (8.2's L.NAVAL.05/07, 8.5's L.BOARD.04/06) are the
   highest-value tests in this list since each one encodes a bug that was actually
   found and fixed during design — losing them to a future refactor would silently
   reintroduce a real, previously-identified problem.