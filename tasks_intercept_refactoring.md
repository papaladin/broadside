# Tasks: Intercept & Event System Refactor
### Pre-requisite for T2.3 (Friendly Encounters) and T2.4 (Plunder Screen)

> **Goal:** make the intercept screen data-driven so new encounter types (plunder,
> friendly encounters, encounter trading, quest actions) slot in as data changes,
> not code changes. Fix the navy_patrol hack in the same pass.
>
> **Scope:** logic.js, engine.js, screens_voyage.jsx, data.js.
> No changes to BattleScreen, EventScreen, combat resolution, or any port screen.
> No new state fields except `battleState.encounterType`.
> No migration patch needed — encounterContext and battleState are transient.
>
> **Do not start until T1.1 (test suite) is green.** This refactor touches
> RESOLVE_EVENT and INTERCEPT_* cases that have tests. A clean baseline first.

---

## What Changes and Why

### Current problems

1. `encounterContext.options` is a fixed object `{ flee, parley, bribe, surrender, fight }`.
   Adding a new option (Allow Inspection, Show Plunder, Accept Trade) requires editing
   the InterceptScreen component.

2. `navy_patrol` has a hardcoded `if (event.id === "navy_patrol")` block in RESOLVE_EVENT
   (70 lines) that bypasses the normal event resolution path entirely.

3. `consequence: (state) => {...}` in INTERCEPT_SURRENDER is a function passed as data.
   Functions-as-data cannot be serialised, tested cleanly, or expressed declaratively.

4. `encounterContext.isNavyPatrol = true` is a boolean mutated onto the context after
   construction, then copied into battleState. It cannot express "this was a bounty hunt"
   or "this was a distressed merchant."

5. `state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port"` appears verbatim
   in 6+ reducer cases. Any change to return-screen logic requires 6 edits.

### After this refactor

1. `encounterContext.options` is an ordered array. The InterceptScreen renders whatever
   options the context provides. Adding a new option is adding an array entry in
   `buildEncounterContext` — zero screen changes.

2. `navy_patrol` resolves through the normal event path. The special-case block is deleted.
   The "allow inspection" choice dispatches `PATROL_INSPECT`. The "refuse" choice builds
   an encounterContext and goes to the intercept screen normally.

3. The function-consequence path in INTERCEPT_SURRENDER is removed. All consequences are
   declarative objects. Contraband-fine computation lives in the reducer where it belongs,
   triggered by a `contrabandFineRate` field on the consequence object.

4. `battleState.encounterType: string` replaces `isNavyPatrol: boolean`. DISMISS_BATTLE
   reads the type string. Future encounter types (bounty hunt, distressed merchant) add
   one check each.

5. `returnScreen(state)` is a helper called once. All 6 inline occurrences are replaced.

---

## Part 1 — logic.js: Rebuild `buildEncounterContext`

### 1.1 — Add `returnScreen` helper

Add near the top of the encounter context section:

```js
const returnScreen = (state) =>
  state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port";
```

Export from `window.L`. This is the only place the sailing/port decision is made.
Every reducer case that currently inlines this expression is updated to call
`L.returnScreen(state)` instead.

### 1.2 — Define option shape

An option in the new array has this shape:

```js
{
  id:        string,   // "fight" | "flee" | "parley" | "bribe" | "surrender" | custom
  label:     string,   // display text, may include cost: "Bribe (400g)"
  available: boolean,
  reason:    string | null,   // shown when available === false
  action:    object,          // dispatched on click: { type: A.INTERCEPT_FIGHT }
  // Optional metadata used by specific option logic:
  speedCheck: { player: number, enemy: number } | null,   // flee only
}
```

The InterceptScreen renders every entry in `ctx.options`. When `available === false`,
the button is disabled and `reason` is shown as a subtitle. The screen does not
know or care what option ids mean — it just renders and dispatches.

### 1.3 — Rewrite `buildEncounterContext` to return options array

Replace the current `options: { flee: {...}, parley: {...}, ... }` object with
`options: []`. The existing boolean logic (canFlee, canParley, etc.) is unchanged —
it now populates array entries instead of object keys.

```js
function buildEncounterContext(state, type, enemy) {
  const { ENCOUNTER_FLAVOUR, SURRENDER_CONSEQUENCE, SHIPS } = window.D;

  const shipStats = getShipStats(state);
  const mySpeed   = shipStats.speed;
  const enemyShip = guessShipType(enemy);
  const eSpeed    = SHIPS[enemyShip]?.speed ?? 5;
  const rep       = state.reputation[state.destination ?? state.currentPort] ?? 20;
  const gold      = state.gold;
  const bribeCost = Math.round((enemy.gold ?? 500) * 0.4);

  // ── Flee ────────────────────────────────────────────────────────
  const noFleeTypes = ["hostile_port_entry", "bounty_target", "mission_combat",
                       "navy_patrol"];
  const canFlee    = !noFleeTypes.includes(type);
  const fleeReason = canFlee ? null
    : type === "hostile_port_entry" ? "Already in range of the harbour guns"
    : type === "navy_patrol"        ? "You cannot outrun a patrol in open waters"
    : "The target is cornered — no escape";

  // ── Parley ──────────────────────────────────────────────────────
  const noParleyTypes = ["hostile_port_entry", "bounty_target", "mission_combat",
                         "smuggling_caught", "navy_patrol"];
  const canParley    = !noParleyTypes.includes(type) && rep >= 30;
  const parleyReason = noParleyTypes.includes(type) ? "They are not here to negotiate"
    : rep < 30 ? `Reputation too low (${rep} — need 30)`
    : null;

  // ── Bribe ───────────────────────────────────────────────────────
  const noBribeTypes = ["hostile_port_entry", "bounty_target", "mission_combat",
                        "navy_patrol"];
  const bribeBlocked       = noBribeTypes.includes(type);
  const canAffordBribe     = gold >= bribeCost;
  const bribeInfamyBlocked = !canBribe(state);
  const canBribeResult     = !bribeBlocked && canAffordBribe && !bribeInfamyBlocked;
  const bribeReason        = bribeBlocked           ? "They cannot be bought"
    : bribeInfamyBlocked                            ? "Your reputation for bribery has preceded you"
    : !canAffordBribe                               ? `Need ${bribeCost}g (you have ${gold}g)`
    : null;

  // ── Surrender ───────────────────────────────────────────────────
  const noSurrenderTypes = ["bounty_target", "mission_combat"];
  const canSurrender    = !noSurrenderTypes.includes(type);
  const surrenderReason = canSurrender ? null : "Surrender means death here";

  // ── Navy patrol: Allow Inspection replaces Surrender ───────────
  // The patrol doesn't want you to surrender — they want to inspect your hold.
  // "Allow Inspection" dispatches PATROL_INSPECT (not INTERCEPT_SURRENDER).
  // "Refuse Inspection" is Fight (renamed for this context).
  const isNavyPatrol = type === "navy_patrol" || type === "navy_patrol_combat";

  // ── Build options array ─────────────────────────────────────────
  const options = [];

  if (isNavyPatrol) {
    // Navy patrol has a unique option set: inspect or fight
    options.push({
      id:         "inspect",
      label:      "Allow Inspection",
      available:  true,
      reason:     null,
      action:     { type: "PATROL_INSPECT" },
      speedCheck: null,
    });
    options.push({
      id:         "fight",
      label:      "Refuse — Open Fire",
      available:  true,
      reason:     null,
      action:     { type: "INTERCEPT_FIGHT" },
      speedCheck: null,
    });
  } else {
    // Standard encounter options
    options.push({
      id:         "fight",
      label:      "Fight",
      available:  true,
      reason:     null,
      action:     { type: "INTERCEPT_FIGHT" },
      speedCheck: null,
    });
    options.push({
      id:         "flee",
      label:      "Attempt to Flee",
      available:  canFlee,
      reason:     fleeReason,
      action:     { type: "INTERCEPT_FLEE" },
      speedCheck: canFlee ? { player: mySpeed, enemy: eSpeed } : null,
    });
    options.push({
      id:         "parley",
      label:      "Parley",
      available:  canParley,
      reason:     parleyReason,
      action:     { type: "INTERCEPT_PARLEY" },
      speedCheck: null,
    });
    options.push({
      id:         "bribe",
      label:      canBribeResult ? `Bribe (${bribeCost}g)` : "Bribe",
      available:  canBribeResult,
      reason:     bribeReason,
      action:     { type: "INTERCEPT_BRIBE" },
      speedCheck: null,
    });
    options.push({
      id:         "surrender",
      label:      "Surrender",
      available:  canSurrender,
      reason:     surrenderReason,
      action:     { type: "INTERCEPT_SURRENDER" },
      speedCheck: null,
    });
  }

  // ── Future option slots ─────────────────────────────────────────
  // To add a new option to any encounter type, insert an entry here:
  //   options.push({
  //     id: "plunder", label: "Board and Plunder",
  //     available: true, reason: null,
  //     action: { type: "OPEN_PLUNDER" }, speedCheck: null,
  //   });
  // The InterceptScreen renders it automatically. No screen changes needed.
  //
  // For encounter trading (future T2.3):
  //   action: { type: "OPEN_ENCOUNTER_MARKET" }
  // OPEN_ENCOUNTER_MARKET will set screen: "market" with a returnTo flag.
  // No state design needed now — the option slot is ready when the feature lands.

  return {
    type,
    encounterType: type,  // explicit string for battleState (replaces isNavyPatrol flag)
    enemy: { ...enemy, ship: enemyShip },
    flavourText:
      ENCOUNTER_FLAVOUR[type]?.(enemy, rep) ??
      `A ${enemy.name} moves to intercept.`,
    options,
    // Legacy path removed: no isNavyPatrol boolean, no options object
  };
}
```

### 1.4 — Update all internal `returnScreen` inline expressions in logic.js

Search for `state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port"` in
logic.js and replace each with `returnScreen(state)`.

### 1.5 — Export `returnScreen` from `window.L`

Add to the exports return object at the bottom of logic.js:
```js
returnScreen,
```

---

## Part 2 — engine.js: Add `PATROL_INSPECT`, fix `INTERCEPT_FIGHT`, remove hacks

### 2.1 — Add `A.PATROL_INSPECT` to the actions object

```js
A.PATROL_INSPECT: "PATROL_INSPECT",
```

### 2.2 — Add `PATROL_INSPECT` reducer case

This is the entire navy patrol inspection logic, extracted from the former
`navy_patrol` special case in RESOLVE_EVENT. The consequence object
`contrabandFineRate: 0.50` tells the reducer to compute the fine at runtime:

```js
case A.PATROL_INSPECT: {
  // Player allows cargo inspection. Check for contraband.
  const activeMission = state.activeMission;
  const items = state.hold?.items || {};

  const hasTobacco   = (items.tobacco || 0) > 0;
  const hasSlaves    = (items.slaves  || 0) > 0;
  const hasRumSmuggle = activeMission?.requiredGood === "rum"
    && (items.rum || 0) >= (activeMission?.requiredQty || 0);
  const hasContraband = hasTobacco || hasSlaves || hasRumSmuggle;

  if (!hasContraband) {
    // Clean hold — waved through
    return {
      ...state,
      encounterContext: null,
      screen: L.returnScreen(state),
      log: [...state.log, "The patrol found nothing. You are waved through."],
    };
  }

  // Contraband found — seize, fine, infamy, rep, morale
  let seizedValue = 0;
  if (hasTobacco)
    seizedValue += (items.tobacco || 0) * (D.RESOURCES.tobacco?.basePrice || 90);
  if (hasSlaves)
    seizedValue += (items.slaves  || 0) * (D.RESOURCES.slaves?.basePrice  || 220);
  if (hasRumSmuggle)
    seizedValue += (activeMission.requiredQty || 0) * (D.RESOURCES.rum?.basePrice || 30);

  const fine = Math.round(seizedValue * 0.50 / 25) * 25;
  const newHoldItems = L.applyLoseContraband(items);

  // Rep loss with inspecting faction (all its ports)
  const inspectingFaction =
    PORTS[state.destination ?? state.currentPort]?.faction || null;
  let newRep = { ...state.reputation };
  if (inspectingFaction) {
    Object.keys(PORTS).forEach(portKey => {
      if (PORTS[portKey].faction === inspectingFaction) {
        newRep[portKey] = Math.max(0, (newRep[portKey] ?? 50) - 5);
      }
    });
  }

  return {
    ...state,
    encounterContext: null,
    screen: L.returnScreen(state),
    gold:       Math.max(0, state.gold - fine),
    hold:       { ...state.hold, items: newHoldItems },
    infamy:     Math.min(999, (state.infamy ?? 0) + 2),
    reputation: newRep,
    crew:       { ...state.crew, morale: Math.max(0, state.crew.morale - 10) },
    log: [
      ...state.log,
      "The patrol found contraband. All illegal goods seized.",
      `Fine levied: ${fine}g.`,
      "+2 infamy — your name is in their ledger now.",
      "The crew's morale drops.",
    ],
  };
}
```

⚙ **Note on fine rate:** the `0.50` multiplier is hardcoded here but should
be read from a constant. Add `window.D.PATROL_FINE_RATE = 0.50` to data.js
and reference it: `const fine = Math.round(seizedValue * D.PATROL_FINE_RATE / 25) * 25`.
This makes it tunable without editing engine.js.

### 2.3 — Update `INTERCEPT_FIGHT` to set `encounterType` on battleState

Replace the current `isNavyPatrol: ctx.isNavyPatrol || false` line with
`encounterType: ctx.encounterType || ctx.type || "unknown"`:

```js
case A.INTERCEPT_FIGHT: {
  const ctx = state.encounterContext;
  if (!ctx) return state;
  const enemy = ctx.enemy;
  const bs = {
    phase:             "player_turn",
    playerHull:        state.ship.hull,
    playerCrew:        state.crew.roster.length,
    enemy,
    enemyHull:         enemy.hull,
    enemyCrew:         enemy.crew,
    round:             1,
    log:               [`You engage the ${enemy.name}!`],
    returnScreen:      L.returnScreen(state),
    initialCrewCount:  state.crew.roster.length,
    lostCrewNames:     [],
    encounterType:     ctx.encounterType || ctx.type || "unknown",  // ← replaces isNavyPatrol
  };
  return { ...state, encounterContext: null, battleState: bs, screen: "battle" };
}
```

### 2.4 — Update `DISMISS_BATTLE` to read `encounterType`

Replace the `battleState.isNavyPatrol` check with `encounterType`:

```js
// BEFORE
const patrolInfamy = battleState.isNavyPatrol ? 2 : 0;

// AFTER
const isNavyFight = battleState.encounterType === "navy_patrol"
                 || battleState.encounterType === "navy_patrol_combat";
const patrolInfamy = isNavyFight ? 2 : 0;
```

Also replace the log message for clarity:
```js
// BEFORE
const patrolLog = patrolInfamy > 0
  ? [`+${patrolInfamy} infamy — attacking crown forces was witnessed.`] : [];

// AFTER (unchanged — same message, just different trigger condition)
```

⚙ **Future extension point:** when bounty hunters land (T5.7), add:
```js
const isBountyHunt = battleState.encounterType === "bounty_hunt";
const bountyInfamy = isBountyHunt ? -3 : 0; // defeating a bounty hunter clears infamy
```
This is where that logic will live. No changes needed now — just note it.

### 2.5 — Update `INTERCEPT_FLEE` to use `L.returnScreen`

```js
// Replace all inline occurrences of:
state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port"
// with:
L.returnScreen(state)
```

Same for `INTERCEPT_PARLEY`, `INTERCEPT_BRIBE`, `INTERCEPT_SURRENDER`.

### 2.6 — Remove the function-consequence path from `INTERCEPT_SURRENDER`

Delete the entire `if (typeof consequence === "function") { ... }` block (lines
817–838 in the current file). This path was only used by the navy patrol.
The navy patrol now uses `PATROL_INSPECT` instead.

The static consequence path (lines 841–876) is unchanged and handles all
remaining surrender types correctly.

After deletion, the case should start directly with:
```js
case A.INTERCEPT_SURRENDER: {
  const ctx = state.encounterContext;
  if (!ctx) return state;
  const consequence = ctx.options.find(o => o.id === "surrender")
    ?.consequence                         // new lookup from options array
    ?? SURRENDER_CONSEQUENCE[ctx.type]    // fallback to data.js table
    ?? SURRENDER_CONSEQUENCE.random;

  let s = { ...state, encounterContext: null };
  // ... existing static consequence logic unchanged ...
}
```

⚙ **Note on consequence lookup:** currently `consequence` comes from
`ctx.options.surrender.consequence`. With the new options array, it's
accessed via `ctx.options.find(o => o.id === "surrender")`. Alternatively,
keep the consequence lookup purely from the data table:
`SURRENDER_CONSEQUENCE[ctx.type] ?? SURRENDER_CONSEQUENCE.random`.
This is cleaner — the consequence data lives in data.js, not embedded in
the options array. Recommended: remove consequence from options entirely
and always look it up by `ctx.type`. The encounter type is already on the
context as `ctx.encounterType`.

Updated INTERCEPT_SURRENDER opening:
```js
case A.INTERCEPT_SURRENDER: {
  const ctx = state.encounterContext;
  if (!ctx) return state;
  // Consequence is always looked up by encounter type — not stored in options
  const consequence = SURRENDER_CONSEQUENCE[ctx.type]
    ?? SURRENDER_CONSEQUENCE.random;
  // ... rest unchanged ...
  s.screen = L.returnScreen(state);
  // ...
}
```

### 2.7 — Remove the `navy_patrol` special-case block from `RESOLVE_EVENT`

Delete lines 1046–1136 (the entire `if (event.id === "navy_patrol") { ... }` block).

The navy_patrol event now resolves through the normal event path. Its choices
dispatch normal outcome objects. "Refuse inspection" dispatches to the intercept
screen via the `battle` outcome key (already handled in lines 1170–1173):
```js
if (choice.outcome.battle) {
  newState.encounterContext = L.buildEncounterContext(state, "navy_patrol_combat",
    choice.outcome.battle.enemy);
  newState.screen = "intercept";
}
```
This is already correct. No change needed here — just verify it still works
after the special-case block is removed.

### 2.8 — Update all inline `returnScreen` expressions in engine.js

Search for every occurrence of:
```js
state.destination && state.sailingDaysLeft > 0 ? "sailing" : "port"
```

Replace each with `L.returnScreen(state)`. There should be 5–7 occurrences
across INTERCEPT_FLEE, INTERCEPT_PARLEY, INTERCEPT_BRIBE, INTERCEPT_SURRENDER,
RESOLVE_EVENT (multiple places), and possibly ADVANCE_DAY.

---

## Part 3 — data.js: Update `navy_patrol` Event and Add Fine Rate Constant

### 3.1 — Add `PATROL_FINE_RATE` constant

```js
window.D.PATROL_FINE_RATE = 0.50; // Fine = 50% of seized contraband base value
```

Add alongside the other economic constants (`TRADE_MISSION_PROFIT_MARGINS`, etc.).
Reference this in the `PATROL_INSPECT` reducer case (Part 2.2).

### 3.2 — Rewrite `navy_patrol` event to be fully declarative

The old event had hardcoded choices that the RESOLVE_EVENT special-case block
overrode. The new event has two genuine choices: allow inspection (dispatches
`PATROL_INSPECT`) and refuse (builds a battle encounter via `battle` outcome).

```js
{
  id:    "navy_patrol",
  title: "Naval Patrol",
  type:  "encounter",
  desc:  "A patrol vessel flying colonial colours cuts across your heading. An officer hails you through a speaking-trumpet: 'Heave to for inspection.'",
  condition: (state) =>
    state.screen === "sailing" &&
    ["english","spanish","french","dutch"].includes(
      window.D.PORTS[state.destination]?.faction
    ),
  choices: [
    {
      label:   "Allow Inspection",
      sublabel: "Let them board and check your manifest.",
      outcome: {
        action: "PATROL_INSPECT",   // special key: RESOLVE_EVENT dispatches this action
        log:    "You order the crew to heave to. The patrol boat comes alongside.",
      }
    },
    {
      label:   "Refuse — Run Up the Black",
      sublabel: "Deny them. This means a fight.",
      outcome: {
        log:   "You refuse the inspection. The patrol moves to engage.",
        battle: {
          enemy: {
            name:    "Naval Patrol",
            faction: "english",  // overridden by RESOLVE_EVENT to match destination faction
            hull:    100,
            cannons: 12,
            crew:    35,
            gold:    300,
          }
        }
      }
    }
  ]
},
```

⚙ **Agent note on `outcome.action`:** RESOLVE_EVENT needs a new outcome key
`action` alongside `gold`, `crewLoss`, etc. When `choice.outcome.action` is
set, RESOLVE_EVENT dispatches it as a further action rather than resolving inline.
This is a small but important addition — see Part 2, item 2.9 below.

⚙ **Agent note on patrol faction:** the enemy faction in the "refuse" outcome
is hardcoded as `"english"` above. RESOLVE_EVENT should override this with the
actual faction of `state.destination` before building the encounter context:
```js
if (choice.outcome.battle) {
  const patrolFaction = PORTS[state.destination]?.faction || "english";
  const patrolEnemy = {
    ...choice.outcome.battle.enemy,
    faction: patrolFaction,
    name: `${FACTIONS[patrolFaction]?.label || "Colonial"} Patrol`,
  };
  newState.encounterContext = L.buildEncounterContext(
    state, "navy_patrol_combat", patrolEnemy
  );
  newState.screen = "intercept";
}
```

### 3.3 — Update `SURRENDER_CONSEQUENCE` for patrol types

Add explicit entries for the patrol encounter types. These were previously
handled by the function-consequence path:

```js
// In SURRENDER_CONSEQUENCE:
navy_patrol: {
  // Surrendering to a patrol = allow inspection = same as PATROL_INSPECT
  // But this path is now unreachable — navy_patrol uses PATROL_INSPECT directly.
  // Keep entry for safety / other code that reads this table by type.
  loseContraband: true,
  contrabandFineRate: 0.50,  // documented even though PATROL_INSPECT computes it
  rep_loss: 5,
  moralePenalty: 10,
},
navy_patrol_combat: {
  // Surrendering mid-fight with a patrol (different from allowing inspection)
  loseGoldPercent: 30,
  loseContraband: true,
  moralePenalty: 20,
  rep_loss: 10,
},
```

⚙ **Note:** `contrabandFineRate` is a new field. INTERCEPT_SURRENDER's static
consequence path does not yet read it. Add handling alongside the existing
`loseContraband` case:
```js
if (consequence.loseContraband) {
  newHoldItems = L.applyLoseContraband(newHoldItems);
  logExtra.push("Your contraband was confiscated.");
  if (consequence.contrabandFineRate) {
    // Compute fine from what was actually seized
    // (reuse the same logic as PATROL_INSPECT)
    const seizedValue = computeContrabandValue(state.hold?.items || {});
    const fine = Math.round(seizedValue * consequence.contrabandFineRate / 25) * 25;
    s.gold = Math.max(0, s.gold - fine);
    logExtra.push(`Fine levied: ${fine}g.`);
  }
}
```

Extract `computeContrabandValue(items)` as a shared helper in engine.js to
avoid duplicating the tobacco/slaves/rum calculation between PATROL_INSPECT
and this path:
```js
const computeContrabandValue = (items) => {
  let value = 0;
  value += (items.tobacco || 0) * (D.RESOURCES.tobacco?.basePrice || 90);
  value += (items.slaves  || 0) * (D.RESOURCES.slaves?.basePrice  || 220);
  // rum is only contraband when on a smuggle mission — handled by PATROL_INSPECT
  // not included here (surrender during non-smuggle voyage, rum is legal)
  return value;
};
```

---

## Part 2 (continued) — engine.js: `outcome.action` dispatch in RESOLVE_EVENT

### 2.9 — Add `outcome.action` handling to RESOLVE_EVENT

After the existing outcome property reads (gold, crewLoss, hull, etc.), add:

```js
// outcome.action: string — dispatch a further action instead of resolving inline.
// Used when event outcome requires complex reducer logic (e.g. PATROL_INSPECT).
if (choice.outcome.action) {
  // Apply any log from the outcome first
  if (choice.outcome.log && !newState.log.includes(choice.outcome.log)) {
    newState.log = [...newState.log, choice.outcome.log];
  }
  // Then dispatch the secondary action
  // Since we're inside the reducer, we call it recursively:
  return reducer(
    { ...newState, activeEvent: null },
    { type: choice.outcome.action }
  );
}
```

⚙ **Agent note on recursive dispatch:** calling `reducer(state, action)` from
within the reducer is valid in this architecture since the reducer is a pure
function. The recursive call handles `PATROL_INSPECT` with the updated state
(activeEvent cleared, log updated). This is a small but elegant pattern — the
event outcome says "now do PATROL_INSPECT" and the reducer handles it cleanly.
No infinite recursion risk since PATROL_INSPECT never triggers another `outcome.action`.

---

## Part 4 — screens_voyage.jsx: InterceptScreen renders options array

### 4.1 — Replace hardwired button logic with options map

**Current pattern (hardwired):**
```jsx
// Five separate button blocks, each checking ctx.options.flee.available,
// ctx.options.bribe.available, etc.
```

**New pattern (data-driven):**
```jsx
function InterceptScreen({ state, dispatch }) {
  const { T, Btn, Bar, SectionTitle } = window.UI;
  const ctx = state.encounterContext;
  if (!ctx) return null;

  const { enemy, flavourText, options } = ctx;

  return (
    <div style={{ /* existing panel style */ }}>
      {/* Enemy info section — unchanged */}
      <SectionTitle>ENCOUNTER</SectionTitle>
      <div style={{ color: T.textDim, fontSize: 11, marginBottom: 8 }}>
        {flavourText}
      </div>

      {/* Enemy stats — unchanged */}
      <div style={{ /* enemy stats display */ }}>
        {enemy.name} — Hull: {enemy.hull}, Cannons: {enemy.cannons}, Crew: {enemy.crew}
      </div>

      {/* Options — now rendered from array */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
        {options.map(opt => (
          <div key={opt.id}>
            <Btn
              v={opt.available ? (opt.id === "fight" ? "red" : "default") : "default"}
              disabled={!opt.available}
              onClick={() => opt.available && dispatch(opt.action)}
              style={{ width: "100%", textAlign: "left" }}
            >
              {opt.label}
            </Btn>
            {!opt.available && opt.reason && (
              <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2, paddingLeft: 4 }}>
                {opt.reason}
              </div>
            )}
            {opt.id === "flee" && opt.available && opt.speedCheck && (
              <div style={{ fontSize: 10, color: T.textDim, marginTop: 2, paddingLeft: 4 }}>
                Speed check: your {opt.speedCheck.player} vs their {opt.speedCheck.enemy}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4.2 — Hide unavailable options (optional enhancement)

The current design shows all options with unavailable ones greyed. An alternative
that reduces visual noise — only render unavailable options when there are fewer
than 3 available options total. This gives the player all context when choices
are limited (e.g. navy patrol with only 2 options) but doesn't clutter encounters
with many available options (e.g. a pirate with all 5 options).

```jsx
const availableCount = options.filter(o => o.available).length;
const visibleOptions = options.filter(o =>
  o.available || availableCount < 3
);
```

This is optional — implement only if the screen feels cluttered after T2.3 adds
more option types. The architecture supports it either way.

---

## Part 5 — Tests

### tests_logic.js

- [ ] **L.BC.1** — `buildEncounterContext` returns an array for `options`:
  ```js
  const state = makeState();
  const ctx = L.buildEncounterContext(state, "patrol",
    { name: "Pirate", hull: 60, cannons: 8, crew: 20, faction: "pirate", gold: 300 });
  u.assert(Array.isArray(ctx.options), "options should be an array");
  ```

- [ ] **L.BC.2** — standard encounter has 5 options:
  ```js
  u.assertEqual(ctx.options.length, 5);
  ```

- [ ] **L.BC.3** — navy_patrol encounter has 2 options (inspect + fight):
  ```js
  const navyCtx = L.buildEncounterContext(state, "navy_patrol",
    { name: "Patrol", hull: 100, cannons: 12, crew: 35, faction: "english", gold: 300 });
  u.assertEqual(navyCtx.options.length, 2);
  u.assertEqual(navyCtx.options[0].id, "inspect");
  u.assertEqual(navyCtx.options[1].id, "fight");
  ```

- [ ] **L.BC.4** — navy_patrol inspect option dispatches `PATROL_INSPECT`:
  ```js
  u.assertEqual(navyCtx.options[0].action.type, "PATROL_INSPECT");
  ```

- [ ] **L.BC.5** — `ctx.encounterType` is set correctly:
  ```js
  u.assertEqual(ctx.encounterType, "patrol");
  u.assertEqual(navyCtx.encounterType, "navy_patrol");
  ```

- [ ] **L.BC.6** — `returnScreen` returns "sailing" when destination and days > 0:
  ```js
  const s = makeState({ destination: "tortuga", sailingDaysLeft: 2 });
  u.assertEqual(L.returnScreen(s), "sailing");
  ```

- [ ] **L.BC.7** — `returnScreen` returns "port" otherwise:
  ```js
  const s = makeState({ destination: null, sailingDaysLeft: 0 });
  u.assertEqual(L.returnScreen(s), "port");
  ```

### tests_engine.js

- [ ] **E.PI.1** — `PATROL_INSPECT` with clean hold returns to sailing/port:
  ```js
  const s = makeState({
    screen: "sailing", destination: "tortuga", sailingDaysLeft: 2,
    hold: { capacity: 200, items: { food:10, water:10 } },
    encounterContext: L.buildEncounterContext(makeState(), "navy_patrol",
      { name: "Patrol", hull:100, cannons:12, crew:35, faction:"english", gold:300 }),
  });
  const next = E.reducer(s, { type: E.A.PATROL_INSPECT });
  u.assertEqual(next.screen, "sailing");
  u.assertEqual(next.encounterContext, null);
  u.assert(next.log.some(l => l.includes("found nothing")));
  ```

- [ ] **E.PI.2** — `PATROL_INSPECT` with tobacco seizes cargo, applies fine:
  ```js
  const s = makeState({
    hold: { capacity: 200, items: { food:5, water:5, tobacco:8 } },
    gold: 1000, infamy: 0,
    encounterContext: L.buildEncounterContext(makeState(), "navy_patrol",
      { name: "Patrol", hull:100, cannons:12, crew:35, faction:"english", gold:300 }),
  });
  const next = E.reducer(s, { type: E.A.PATROL_INSPECT });
  u.assertEqual(next.hold.items.tobacco, 0, "Tobacco seized");
  u.assert(next.gold < 1000, "Fine deducted");
  u.assertEqual(next.infamy, 2, "+2 infamy");
  u.assert(next.crew.morale < s.crew.morale, "Morale penalised");
  ```

- [ ] **E.PI.3** — `PATROL_INSPECT` fine amount: 8 tobacco × 90g × 50% = 360g:
  ```js
  u.assertEqual(s.gold - next.gold, 360); // 8 × 90 × 0.5 = 360
  ```

- [ ] **E.PI.4** — `INTERCEPT_FIGHT` sets `encounterType` on battleState:
  ```js
  const s = makeState({
    encounterContext: L.buildEncounterContext(makeState(), "navy_patrol_combat",
      { name: "Patrol", hull:100, cannons:12, crew:35, faction:"english", gold:300 }),
  });
  const next = E.reducer(s, { type: E.A.INTERCEPT_FIGHT });
  u.assertEqual(next.battleState.encounterType, "navy_patrol_combat");
  ```

- [ ] **E.PI.5** — `DISMISS_BATTLE` after navy patrol fight adds patrol infamy:
  ```js
  const s = {
    ...makeState(),
    battleState: {
      phase: "victory", encounterType: "navy_patrol_combat",
      playerHull: 80, enemyHull: 0, playerCrew: 25, enemyCrew: 0,
      round: 3, log: [], returnScreen: "sailing",
      initialCrewCount: 30, lostCrewNames: [], goldReward: 200,
    },
    destination: "tortuga", sailingDaysLeft: 1, infamy: 5,
  };
  const next = E.reducer(s, { type: E.A.DISMISS_BATTLE });
  u.assertEqual(next.infamy, 7, "Patrol fight adds 2 infamy");
  ```

- [ ] **E.PI.6** — `DISMISS_BATTLE` after non-patrol fight adds no patrol infamy:
  ```js
  // Same setup but encounterType: "patrol" (pirate patrol, not navy)
  // Verify infamy unchanged
  ```

- [ ] **E.RE.1** — `RESOLVE_EVENT` navy_patrol "Allow Inspection" dispatches
  `PATROL_INSPECT` correctly:
  ```js
  const navyEvent = D.RANDOM_EVENTS.find(e => e.id === "navy_patrol");
  u.assert(navyEvent, "navy_patrol event must exist");
  const s = { ...makeState(), activeEvent: navyEvent,
    hold: { capacity: 200, items: { food:5, water:5, tobacco:5 } } };
  // choiceIndex 0 = Allow Inspection
  const next = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 0 });
  u.assertEqual(next.hold.items.tobacco, 0, "Tobacco seized via PATROL_INSPECT");
  u.assertEqual(next.activeEvent, null);
  ```

- [ ] **E.RE.2** — `RESOLVE_EVENT` navy_patrol "Refuse" goes to intercept screen:
  ```js
  const s = { ...makeState(), activeEvent: navyEvent };
  const next = E.reducer(s, { type: E.A.RESOLVE_EVENT, choiceIndex: 1 });
  u.assertEqual(next.screen, "intercept");
  u.assert(next.encounterContext !== null);
  u.assert(Array.isArray(next.encounterContext.options));
  u.assertEqual(next.activeEvent, null);
  ```

- [ ] **E.RE.3** — after refactor, no other event resolves incorrectly
  (regression — pick 2 existing passing events and verify they still pass).

### tests_ui.js

- [ ] **U.IC.1** — InterceptScreen renders options from array:
  ```js
  const ctx = L.buildEncounterContext(makeState(), "patrol",
    { name: "Pirate", hull:60, cannons:8, crew:20, faction:"pirate", gold:300 });
  const state = makeState({ screen: "intercept", encounterContext: ctx });
  const { container, unmount } = u.mountReact(window.S.InterceptScreen,
    { state, dispatch: () => {} });
  u.assert(container.textContent.includes("Fight"));
  u.assert(container.textContent.includes("Attempt to Flee"));
  u.assert(container.textContent.includes("Parley"));
  u.assert(container.textContent.includes("Bribe"));
  u.assert(container.textContent.includes("Surrender"));
  unmount();
  ```

- [ ] **U.IC.2** — navy_patrol InterceptScreen shows "Allow Inspection" and
  "Refuse — Open Fire":
  ```js
  const navyCtx = L.buildEncounterContext(makeState(), "navy_patrol",
    { name: "Patrol", hull:100, cannons:12, crew:35, faction:"english", gold:300 });
  const state = makeState({ screen: "intercept", encounterContext: navyCtx });
  const { container, unmount } = u.mountReact(window.S.InterceptScreen,
    { state, dispatch: () => {} });
  u.assert(container.textContent.includes("Allow Inspection"));
  u.assert(container.textContent.includes("Refuse"));
  u.assert(!container.textContent.includes("Parley"),
    "Parley should not appear for navy patrol");
  unmount();
  ```

---

## Part 6 — architecture.md Updates

- [ ] **encounterContext shape:** update from `options: { flee, parley, bribe,
  surrender, fight }` to `options: Option[]` with the option shape documented.
  Add `encounterType: string` field.
- [ ] **battleState shape:** replace `isNavyPatrol: boolean` with
  `encounterType: string`.
- [ ] **Actions:** add `PATROL_INSPECT`. Document that it is dispatched both
  directly (from InterceptScreen) and indirectly (from RESOLVE_EVENT via
  `outcome.action`).
- [ ] **RESOLVE_EVENT:** document `outcome.action` key — triggers a secondary
  reducer dispatch with the updated state.
- [ ] **logic.js exports:** add `returnScreen`, `buildEncounterContext` (already
  exported — verify it is).
- [ ] **data.js:** document `PATROL_FINE_RATE` constant. Document `outcome.action`
  field on event choices. Document updated `navy_patrol` event structure.
- [ ] **Future extension note:** document the option slot pattern —
  "to add a new encounter option, add an entry to the options array in
  buildEncounterContext for the relevant encounter type(s). The InterceptScreen
  renders it automatically. New actions (OPEN_PLUNDER, OPEN_ENCOUNTER_MARKET)
  follow the same INTERCEPT_* pattern."

---

## Verification Checklist

Before closing this task, verify manually in the browser:

- [ ] Navy patrol event fires during a smuggle mission voyage
- [ ] "Allow Inspection" with contraband in hold: goods seized, fine logged, infamy +2
- [ ] "Allow Inspection" with clean hold: waved through, back to sailing
- [ ] "Refuse Inspection": goes to intercept screen with 2 options
- [ ] Intercept screen "Refuse — Open Fire": starts battle normally
- [ ] Winning the patrol fight: DISMISS_BATTLE adds +2 infamy
- [ ] Fleeing the patrol fight: DISMISS_BATTLE adds +2 infamy (you fought them)
- [ ] Standard pirate patrol encounter: all 5 options shown, Fight/Flee/Parley/Bribe/Surrender
- [ ] Bribe with infamy ≥ 50: bribe shows as unavailable with reason
- [ ] Parley with rep < 30: parley shows as unavailable with reason
- [ ] No white screen on any encounter transition