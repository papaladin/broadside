# Broadside — Code Audit Task List

Generated after a full read of all engine, logic, generator, screen, and data files.
Tasks are grouped by category and ordered by priority within each group.

---

## Category 1 — Bugs (Functional)

### BUG-01 · REPAIR formula divergence: UI displays tier-scaled cost, engine deducts flat rate

**Files**: `engine_port.js` line 476, `logic.js` lines 248–251, `screens_shipyard.jsx` line 64

**What is wrong**: `logic.js` defines `shipRepairCost(state)` as
`hullMissing * Math.ceil(ship.maxHull / 20)` — a tier-scaled formula (2g/point for a dinghy,
20g/point for a Ship of the Line). `screens_shipyard.jsx` correctly uses
`L.shipRepairCost(state)` to display the cost. But `engine_port.js` line 476 still has the
old formula `baseCost = (shipStats.maxHull - state.ship.hull) * 2`, so the REPAIR action
deducts using the flat rate regardless of ship tier. A player on a Frigate sees 200g in the
UI and pays 40g.

**Why it matters**: Silent financial exploit on every mid-to-high tier ship repair.

**Fix**: Replace `engine_port.js` line 476:
```js
// BEFORE
const baseCost = (shipStats.maxHull - state.ship.hull) * 2;
// AFTER
const baseCost = L.shipRepairCost(state);
```
`eqRepairPct` and the multiplier chain on the lines that follow remain unchanged.

---

### BUG-02 · TAKE_PLUNDER skips all victory aftermath (heat, upset tagging, battle scar)

**Files**: `engine_combat.js` — BATTLE_ACTION (grapple win), DISMISS_BATTLE, TAKE_PLUNDER

**What is wrong**: After a grapple win (`canPlunder = true`) the player can choose
"Plunder the Ship" (→ TAKE_PLUNDER) or "Sail Away" (→ DISMISS_BATTLE). DISMISS_BATTLE
correctly runs `applyVictoryAftermath` (enemy-faction crew upset tagging, battle scar if
≥10 crew lost) and `addHeat`. TAKE_PLUNDER does none of it — it returns immediately with
just the gold and hold changes. A player who always plunders generates zero faction heat
and no crew consequences from any grapple victory.

**Why it matters**: Removes the main consequence of the most powerful combat action.
Explains in part why late-game testers found combat consequence-free.

**Fix**: At the start of TAKE_PLUNDER, before building the return value, call the same
aftermath chain that DISMISS_BATTLE calls for a victory:
```js
case A.TAKE_PLUNDER: {
  const bs = state.battleState;
  if (!bs || !bs.canPlunder) return state;

  // Apply the same aftermath as a sail-away victory
  let currentState = applyVictoryAftermath(state, bs);
  const isWarPennantMission = (
    state.activeMission?.type === "combat" ||
    state.activeMission?.type === "patrol" ||
    state.activeMission?.type === "assault"
  ) && !state.activeMission?.starter;
  const heatMult = isWarPennantMission
    ? L.getEquipmentEffect(state, "combatHeatMult") : 1;
  currentState = addHeat(currentState, bs.enemy.faction, Math.round(3 * heatMult));

  const goldReward = bs.goldReward || 0;
  const plunderMsg = L.logPick(D.PLUNDER_MESSAGES, currentState, bs.enemy.name);
  return {
    ...currentState,
    gold: currentState.gold + goldReward,
    hold: { ...currentState.hold, items: action.holdItems },
    battleState: null,
    screen: bs.returnScreen === "sailing" && state.destination && state.sailingDaysLeft > 0
      ? "sailing" : "port",
    log: [...currentState.log, `${plunderMsg} +${goldReward}g.`],
  };
}
```

---

### BUG-03 · `logic.js` calls `G.generateEnemyCargo` — dependency direction violation

**Files**: `logic.js` line 607, `generators.js` (`generateEnemyCargo`)

**What is wrong**: `logic.js` line 607:
```js
const plunder = G.generateEnemyCargo(state, state.battleState.enemy, risk);
```
By the documented architecture, `logic.js` sits below `generators.js` in the load chain and
must never call into it. This works at runtime only because `generators.js` happens to load
first — but it breaks the "pure logic is independently testable" guarantee and is a silent
landmine for any future restructuring.

**Why it matters**: Architectural correctness. Any test of `logic.js` in isolation will
fail if `G` is not loaded. It also prevents the cargo generation from being mocked or
overridden independently.

**Fix**: Remove the `G.generateEnemyCargo` call from `resolvePlayerAction` in `logic.js`.
Return `risk` as part of the grapple outcome instead, and let `engine_combat.js` call
`G.generateEnemyCargo` when it processes the grapple result:
```js
// In logic.js resolvePlayerAction grapple case — replace the plunder call with:
out.plunderRisk = state.activeMission?.risk || "medium";

// In engine_combat.js BATTLE_ACTION instant-victory path — add:
const plunder = G.generateEnemyCargo(state, state.battleState.enemy, outcome.plunderRisk);
const newBS = {
  ...state.battleState,
  goldReward: plunder.gold,
  enemyCargo: plunder.cargo,
  ...
};
```

---

### BUG-04 · Typo: "ASttacking" in engine_combat.js line 594

**Files**: `engine_combat.js` line 594

**What is wrong**: `"ASttacking crown forces was witnessed."` — stray capital S.

**Fix**: `"Attacking crown forces was witnessed."`

---

### BUG-05 · Desertion log wrongly attributes faction grievance to all deserters

**Files**: `engine_port.js` — `processDesertion` function (~lines 52–118)

**What is wrong**: Two separate problems in the same function.

First: the faction-grievance message ("They could not forgive the attack on [faction] ships")
is appended to the desertion log for every desertion, including those triggered purely by the
flat 15% morale-based `desertChance` with no faction conflict involved. The condition for
adding that sentence is not gated on whether the deserter actually has a faction-loyalty
conflict.

Second: the `repFaction` label is looked up from only the first deserter's faction, then
applied verbatim to all deserters in the batch, even if other deserters are from a completely
different faction.

**Fix**: Move the faction-grievance sentence inside the per-member loop, and only append it
when the deserter's faction matches the port's opposing faction:
```js
deserters.forEach(name => {
  const member = crewRoster.find(m => `${m.firstName} ${m.lastName}` === name);
  const memberFaction = member?.faction;
  const portFaction = PORTS[currentPort]?.faction;
  const isFactionGrievance = memberFaction && portFaction && memberFaction !== portFaction
    && memberFaction !== "pirate";
  const suffix = isFactionGrievance
    ? ` Could not forgive the attack on ${FACTIONS[memberFaction]?.label} ships.`
    : "";
  logLines.push(`${name} has deserted.${suffix}`);
});
```

---

## Category 2 — Architecture Issues

### ARCH-01 · Morale threshold middleware lives in `engine_core.js` — wrong file

**Files**: `engine_core.js` lines 394–407, `engine_career.js`

**What is wrong**: `engine_core.js` registers three reducers: the debug reducer, the
save/load reducer, and a morale threshold crossing logger. The first two are genuine
infrastructure. The third is a cross-cutting tracking concern — exactly the pattern that
`engine_career.js` exists for. It also breaks the IIFE structure (it is the only
`_reducers.push` in engine_core that sits at column 0 outside the IIFE).

**Fix**: Move the morale threshold logger from `engine_core.js` into `engine_career.js`,
either as a new `case` inside `careerMiddleware`'s action switch or as an additional small
reducer pushed after `careerMiddleware`.

---

### ARCH-02 · ADVANCE_DAY event helpers take 8 positional parameters

**Files**: `engine_voyage.js` — `maybeSmugglePatrol`, `maybeMissionEncounter`,
`maybeRandomEvent`, `checkRandomPatrol`, `maybeDrunkardEvent`

**What is wrong**: All five helpers take the same 8 positional parameters:
`(state, newDays, newWind, newGold, newRep, newMorale, updatedRoster, newHoldItems)`.
Each function then reconstructs a near-complete state return from those arguments.
Since `baseState` is built before any of them are called and the caller already does
`return { ...baseState, ...result }`, the functions are carrying dead weight. Adding any
new field to ADVANCE_DAY requires updating all five helpers simultaneously.

**Fix**: Change all five helpers to take `(baseState, originalState)` where `baseState`
is the already-built day-advance state, and return only the fields that differ from it.
The caller pattern stays `if (result) return { ...baseState, ...result }`.

---

### ARCH-03 · Stale `hold.capacity` field written in three engine cases

**Files**: `engine_port.js` lines 229, 515 — `engine_core.js` line 264

**What is wrong**: START_GAME, BUY_SHIP, and DEBUG_SET_SHIP all write
`hold: { ...state.hold, capacity: shipData.holdCapacity }`. The architecture document
explicitly states "no `capacity` field on `state.hold` — always use
`L.getHoldCapacity(state)`." The field is never read by any game logic, so it is dead
data on the save object that contradicts the documented invariant and will confuse anyone
reading save files.

**Fix**: Remove the `capacity:` key from all three hold spread expressions.

---

### ARCH-04 · `processDesertion`, `processPositiveTraits`, `processStarvation` are pure — belong in `logic.js`

**Files**: `engine_port.js` (`processDesertion`, `processPositiveTraits`),
`engine_voyage.js` (`processStarvation`)

**What is wrong**: All three functions take plain data in, return plain data out, make no
engine calls, have no side effects, and do not call into `G`. They live in engine files
only because that was where they were first written. This means they cannot be unit-tested
in isolation through `logic.js`, and if another domain reducer ever needs them, it would
have to cross-import from a sibling engine file (forbidden).

**Fix**: Move all three to `logic.js` and export them via `window.L`. The engine files
then call `L.processDesertion(...)`, `L.processPositiveTraits(...)`,
`L.processStarvation(...)` exactly as they do now, with no change to call sites.

---

### ARCH-05 · `screens_port.jsx` (1039 lines, 3 unrelated screens) should be split

**Files**: `screens_port.jsx`

**What is wrong**: One file contains `PortScreen` (lines 16–453), `StatusScreen`
(lines 455–873), and `JournalScreen` (lines 874–1036). These are three distinct screens
with different state concerns. `PortScreen` alone mixes mission board rendering, QM popup
logic, tutorial abandon interception, port service navigation, and faction display. At 1039
lines it is the longest file in the codebase and significantly harder to navigate than any
other screen file.

**Fix**: Extract `StatusScreen` and `JournalScreen` into a new `screens_status.jsx`.
Register both in `window.S` from there. Add `screens_status.jsx` to `index.html` after
`screens_port.jsx` and before `screens_voyage.jsx`. No change to routing or the rest of
the system — both screens are already referenced via `window.S`.

---

### ARCH-06 · `pickMerchantFaction` uses `Math.random()` inside an engine file

**Files**: `engine_combat.js` lines 11–14

**What is wrong**:
```js
const pickMerchantFaction = () => {
  const factions = Object.keys(FACTIONS).filter(f => f !== "pirate");
  return factions[Math.floor(Math.random() * factions.length)];
};
```
The architecture rule is: all RNG lives in `generators.js`. This is a one-liner, easy to
miss, but it means any test of merchant encounter generation that goes through
`engine_combat.js` produces non-deterministic output that cannot be seeded.

**Fix**: Move to `generators.js` as `G.pickMerchantFaction()` and call it from
`engine_combat.js` as `G.pickMerchantFaction()`.

---

### ARCH-07 · `addHeat` is a pure state transform — belongs in `logic.js`

**Files**: `engine_combat.js` lines 17–22

**What is wrong**: `addHeat(state, faction, amount)` reads `state.factionAlerts` and
returns `{ ...state, factionAlerts: { ...alerts, [faction]: ... } }`. No RNG, no side
effects — it is a pure state transformation. It currently only exists inside
`engine_combat.js`, so if `engine_port.js` or `engine_voyage.js` ever need to add heat
(patrol interception, port entry conflict), they'd need to duplicate the function or call
across engine files.

**Fix**: Move to `logic.js` as `L.addHeat(state, faction, amount)`. All existing call
sites in `engine_combat.js` become `L.addHeat(...)`.

---

## Category 3 — Long Functions / Cases to Refactor

### REFACTOR-01 · `COMPLETE_MISSION` (148 lines) — extract `resolveMissionReward` helper

**Files**: `engine_port.js` lines 746–893

**What is wrong**: At 148 lines, `COMPLETE_MISSION` is the longest reducer case in the
codebase. It handles six mission type outcomes (trade, smuggle, patrol, escort, assault,
combat/hunt) each with their own gold/fame/rep calculations and log construction. The trade
and smuggle paths share ~60% of their structure but are written as parallel if-branches
with no shared code.

**Fix**: Extract a `resolveMissionReward(state, mission)` helper that takes the active
mission and returns `{ goldGain, fameDelta, repImpact, logLines, missionFailed }`. The
COMPLETE_MISSION case then calls it and merges the result — reducing the case to ~30 lines
of state assembly with the reward logic clearly separated and testable.

---

### REFACTOR-02 · `buildEncounterContext` (162 lines) — extract `buildOption` helper

**Files**: `logic.js` lines 844–1005

**What is wrong**: The function builds flee, parley, bribe, surrender, and inspect options
in five independent blocks, each ~25 lines. All five follow the same pattern:
blocked-list check → reason string → availability boolean → push to `options[]`. The only
variation is the specifics of each option. The structural repetition is the main cause of
the function's length.

**Fix**: Extract:
```js
const buildOption = (id, label, available, reason, action) =>
  ({ id, label, available, reason: available ? null : reason, action });
```
Each option becomes one `options.push(buildOption(...))` call. The function shrinks from
162 lines to ~60.

---

### REFACTOR-03 · `RESOLVE_EVENT` (246 lines) — extract per-event handler functions

**Files**: `engine_combat.js` lines 657–902

**What is wrong**: At 246 lines, RESOLVE_EVENT is the second longest case in the codebase.
It handles mutiny-negotiate, mutiny-crush, generic crewLoss, generic cargo, and storm scar
as inline `if (event.id === ...)` branches, some of which are 80+ lines each. The mutiny
branch alone is more complex than some entire reducer files.

**Fix**: Extract per-event handler functions at the top of the file — `handleMutinyEvent`,
`handleStormEvent` — and replace the branching logic with a dispatch table:
```js
const EVENT_HANDLERS = {
  mutiny: handleMutinyEvent,
  storm: handleStormEvent,
};
const handler = EVENT_HANDLERS[event.id];
if (handler) return handler(state, event, choice, newState);
// Generic outcome (gold, log, crewLoss) handled below
```
RESOLVE_EVENT case becomes ~20 lines; the complex handlers are self-contained and
independently readable.

---

### REFACTOR-04 · `generateCrewBio` — move `specialSentences` to `data_text.js`

**Files**: `generators.js` lines 185–231, `data_text.js`

**What is wrong**: `specialSentences` is a large object literal (47 lines) declaring
trait/scar combination sentence templates. It is a data declaration embedded inside a
function body, re-created on every bio generation call. It belongs in `data_text.js`
alongside the other text template pools.

**Fix**: Move `specialSentences` to `data_text.js` as `D.CREW_BIO_COMBOS`. Reference it
in `generateCrewBio` as `const specialSentences = D.CREW_BIO_COMBOS;`. `generateCrewBio`
shrinks by 47 lines and the content is editable without touching generator logic.

---

## Category 4 — Code Quality / AI Soup

### QUALITY-01 · Case indentation inconsistency in `engine_port.js` switch — three different levels

**Files**: `engine_port.js`

**What is wrong**: The main reducer switch has three different indentation levels for
`case` labels:
- `case A.START_GAME` at column 0 (no indent)
- `case A.NAVIGATE`, `case A.SAIL_TO` at 4 spaces
- `case A.ENTER_PORT` at 0 spaces
- `case A.REPAIR` through `case A.CONFIRM_TRADE` at 6 spaces

This is the most visually obvious "different session" marker in the codebase.

**Fix**: Standardise all `case` labels in the switch to 6 spaces (matching the majority
of existing cases, and consistent with `engine_combat.js`). Pure cosmetic change, no
logic affected.

---

### QUALITY-02 · Helper functions at wrong indentation relative to IIFE in `engine_core.js` and `engine_port.js`

**Files**: `engine_core.js` (lines 74, 409), `engine_port.js` (lines 52, 119)

**What is wrong**: `window.E.autoSave` and the morale threshold reducer in `engine_core.js`
are at column 0, while all other code in the same file is at 2 spaces. `processDesertion`
and `processPositiveTraits` in `engine_port.js` are at column 0, while the reducer that
calls them is at 2 spaces. The inconsistency makes it visually ambiguous whether these
helpers are inside or outside the IIFE.

**Fix**: Indent all of them to 2 spaces, matching the surrounding code. The `window.E.*`
assignments remain global even when indented — the indent is cosmetic only.

---

### QUALITY-03 · `let s = { ...state }; return s;` pattern instead of direct return

**Files**: `engine_port.js` — REPAIR case (lines 484–490), HIRE_CREW case (lines 615–635)

**What is wrong**: Both cases create a `let s` variable, populate it, then immediately
`return s`. The `let` adds nothing — the variable is never reassigned or modified after
construction, and the pattern visually suggests mutation where there is none.

**Fix**: Replace each `let s = { ... }; return s;` with `return { ... };` directly.
See also BUG-01 which touches the REPAIR case at the same time.

---

### QUALITY-04 · `pickRandom` independently defined in `engine_combat.js` and `generators.js`

**Files**: `engine_combat.js` line 28, `generators.js` line 14

**What is wrong**: Both IIFEs define:
```js
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
```
This is the same as `L.logPick` for single-element arrays. Since both are inside closures,
they cannot share directly. The function in `engine_combat.js` is used only to pick from
template arrays in `buildRoundLog` — which is exactly what `L.logPick` does.

**Fix**: In `engine_combat.js`, replace `pickRandom(arr)` calls with
`arr[Math.floor(Math.random() * arr.length)]` inline (the calls are few and short), or
export a `L.pickRandom` utility from `logic.js`. The local definition in `generators.js`
can remain as is since it is only used internally.

---

### QUALITY-05 · Duplicate `QM_DIALOGUE` key: `step1_accepted` is dead code

**Files**: `data_text.js` lines 681–685

**What is wrong**: Two keys exist with identical content:
- `step1_accepted` (line 681)
- `step1_contractAccepted` (line 684)

`screens_core.jsx` references only `step1_contractAccepted`. `step1_accepted` is never
referenced anywhere and is dead code.

**Fix**: Delete `step1_accepted` from `QM_DIALOGUE` in `data_text.js`.

---

### QUALITY-06 · `RESOLVE_EVENT` uses property mutation style on a spread object

**Files**: `engine_combat.js` lines 662–665 and throughout the case

**What is wrong**: `RESOLVE_EVENT` creates `const newState = { ...state, activeEvent: null }`
then mutates it with `newState.log = [...]`, `newState.gold = ...`, `newState.crew = ...`
across ~80 lines. Every other reducer in the codebase uses
`return { ...state, field: newValue }`. The mutation style breaks the "immutable return"
visual convention and makes it harder to see what the final returned state actually
contains — especially when a property is written, then read, then overwritten in the same
branch.

**Fix**: After extracting the event-specific handlers (REFACTOR-03), the remaining generic
path shrinks enough that each branch can use a clean spread return. No functional change
needed — just a style normalisation as part of the same refactor pass.

---

## Category 5 — Data / Text / Log Location

### DATA-01 · `buildCaptainLog` has hardcoded narrative strings — belongs in `data_text.js`

**Files**: `engine_combat.js` lines 104–116

**What is wrong**: `buildCaptainLog` constructs battle-end log entries using inline strings:
`"Victory! Boarding successful."`, `"You sunk the enemy ship."`,
`"Defeated! Your ship was destroyed."`. These are log content, not logic, and they follow
the same pattern as `VICTORY_MESSAGES`, `DEFEAT_MESSAGES`, and `BOARDING_SUCCESS_MESSAGES`
already in `data_text.js`.

**Fix**: Replace the inline strings with calls to `L.logPick`:
- `"Victory! Boarding successful."` → one entry in `BOARDING_SUCCESS_MESSAGES` (already
  exists as a template pool — extend it or add a `GRAPPLE_VICTORY_MESSAGES` pool)
- `"You sunk the enemy ship."` → add to `VICTORY_MESSAGES` or a new `SINK_MESSAGES` pool
- `"Defeated! Your ship was destroyed."` → extend `DEFEAT_MESSAGES`

The function then becomes a pure combinator with no hardcoded strings.

---

### DATA-02 · `settledTemplates` array in `processDesertion` — belongs in `data_text.js`

**Files**: `engine_port.js` lines 106–110

**What is wrong**: An inline array of three log strings lives inside the `processDesertion`
function body:
```js
const settledTemplates = [
  "👥 The rest of the upset crew seem to have settled down.",
  "👥 The mood aboard has improved. Tensions are easing.",
  "👥 Your upset crew appear to have calmed down. For now.",
];
```
This is text content declared inside an engine helper function, re-created on every call.

**Fix**: Move to `data_text.js` as `D.SETTLED_CREW_MESSAGES`. Reference in
`processDesertion` as `D.SETTLED_CREW_MESSAGES`.

---

### DATA-03 · Provision warning strings hardcoded in `engine_voyage.js` — belongs in `data_text.js`

**Files**: `engine_voyage.js` lines 316–317

**What is wrong**:
```js
if (prov.foodJustRanOut) newLog.push("⚠ The food stores are empty. The crew grows hungry.");
if (prov.waterJustRanOut) newLog.push("⚠ The water barrels are dry. The crew suffers.");
```
Two hardcoded narrative strings in the engine layer, inconsistent with how every other log
message is handled (via template pools in `data_text.js`).

**Fix**: Add to `data_text.js`:
```js
const PROVISION_WARNING_MESSAGES = {
  food: "⚠ The food stores are empty. The crew grows hungry.",
  water: "⚠ The water barrels are dry. The crew suffers.",
};
```
Or extend as arrays if multiple variants per type are wanted later. Reference as
`D.PROVISION_WARNING_MESSAGES.food` in `engine_voyage.js`.

---

### DATA-04 · INTERCEPT case log strings are hardcoded — should use `logPick` with `data_text.js` pools

**Files**: `engine_combat.js` — INTERCEPT_FLEE, INTERCEPT_PARLEY, INTERCEPT_BRIBE cases

**What is wrong**: Every INTERCEPT case uses hardcoded strings where the rest of the
combat system uses `L.logPick(D.SOME_MESSAGES, ...)`:
- INTERCEPT_FLEE: `"You pulled clear, the enemy couldn't keep up."`,
  `"Escape failed! The enemy closes in."`, `"Failed to escape. The battle is unavoidable."`
- INTERCEPT_PARLEY: `"Parley successful. They let you pass."`,
  `"Your parley failed. They attack!"`, `"Parley failed. Battle unavoidable."`
- INTERCEPT_BRIBE: `` `Bribed them with ${cost}g. They looked the other way.` ``

**Fix**: Add pools to `data_text.js`:
```js
const FLEE_SUCCESS_MESSAGES = [ ... ];
const FLEE_FAIL_MESSAGES = [ ... ];
const PARLEY_SUCCESS_MESSAGES = [ ... ];
const PARLEY_FAIL_MESSAGES = [ ... ];
const BRIBE_MESSAGES = [ ... ];  // {cost} as a template placeholder
```
Replace the hardcoded strings with `L.logPick(D.FLEE_SUCCESS_MESSAGES, state)` etc.
Bribe can use a function-style template: `(cost) => \`Bribed them with ${cost}g...\``
matching the existing pattern in `data_text.js`.

---

### DATA-05 · PATROL_INSPECT has four hardcoded log strings — belongs in `data_text.js`

**Files**: `engine_combat.js` lines 390–439

**What is wrong**: Four inline log strings in the PATROL_INSPECT case:
- `"The patrol found nothing. You are waved through."`
- `"The patrol searches your hold but finds nothing. The hidden compartment does its job."`
- `"The patrol found contraband. All illegal goods seized."`
- `"+2 infamy. Your name is in their ledger now."`

Pattern inconsistent with the rest of the combat log system.

**Fix**: Add to `data_text.js` as `D.PATROL_INSPECT_MESSAGES` with keys `clear`,
`hiddenCompartment`, `caught`, `infamy`. Reference in the case as
`D.PATROL_INSPECT_MESSAGES.clear` etc. These don't need `logPick` since they are single
fixed-context strings, not random variants.

---

## Category 6 — Map Screen Fix

### MAP-01 · Wheel listener re-registers on every zoom — causes event listener churn

**Files**: `screens_voyage.jsx` lines 88–98

**What is wrong**:
```js
useEffect(() => {
  const el = mapRef.current;
  if (!el) return;
  const onWheel = (e) => {
    e.preventDefault();
    handleWheel(e);       // ← closes over handleWheel
  };
  el.addEventListener('wheel', onWheel, { passive: false });
  return () => el.removeEventListener('wheel', onWheel);
}, [transform]);           // ← re-runs on every transform change
```
`handleWheel` uses `setTransform(prev => ...)` with a functional update, meaning it never
actually reads `transform` from the closure. But the dependency array is `[transform]`,
so the listener is removed and re-added on every single zoom increment — potentially
dozens of times per second during active zooming. This causes micro-glitches where a
wheel event fires between the remove and re-add, and wastes work on every frame.

**Fix**: Move all wheel logic directly into the native listener, using a functional
`setTransform` update so no stale closure can form. Use `[]` as the dependency:
```js
useEffect(() => {
  const el = mapRef.current;
  if (!el) return;
  const onWheel = (e) => {
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const direction = e.deltaY > 0 ? -1 : 1;
    const factor = 1.15;
    setTransform(prev => {
      const newScale = Math.max(1, Math.min(3,
        prev.scale * (direction > 0 ? factor : 1 / factor)));
      const scaleChange = newScale / prev.scale;
      return {
        scale: newScale,
        x: mouseX - (mouseX - prev.x) * scaleChange,
        y: mouseY - (mouseY - prev.y) * scaleChange,
      };
    });
  };
  el.addEventListener('wheel', onWheel, { passive: false });
  return () => el.removeEventListener('wheel', onWheel);
}, []);  // ← stable: functional update needs no deps
```
Remove the standalone `handleWheel` function above it (lines 72–86) — it is now unused.

---

### MAP-02 · Touch pan does not call `preventDefault` — page scrolls during map interaction on mobile

**Files**: `screens_voyage.jsx` lines 127–151

**What is wrong**: `handleTouchMove` is attached as React's `onTouchMove`, which is a
passive listener since React 17. `e.preventDefault()` is never called inside it, so on
mobile the browser scroll activates whenever the user pans the map.

**Fix**: Add a second `useEffect` that attaches a non-passive native `touchmove` listener
whose sole job is `preventDefault`. The React `onTouchMove` continues to handle the pan
and pinch state updates — this native listener only suppresses the browser scroll:
```js
useEffect(() => {
  const el = mapRef.current;
  if (!el) return;
  const preventScroll = (e) => e.preventDefault();
  el.addEventListener('touchmove', preventScroll, { passive: false });
  return () => el.removeEventListener('touchmove', preventScroll);
}, []);
```

---

### MAP-03 · Map size computed using magic number HUD height constants — fragile

**Files**: `screens_voyage.jsx` lines 32–34

**What is wrong**:
```js
const hudHeight = 150;
const controlsHeight = 60;
const padding = 40;
```
These are hardcoded guesses at the rendered height of the HUD and zoom controls. If the
HUD ever changes height (font size, new row, responsive breakpoint), the map silently
becomes the wrong size without any error.

**Fix**: Replace magic constants with a `ResizeObserver` on the wrapper element itself,
computing available height from the wrapper's actual `clientHeight` minus the measured
heights of the `BackButton` row and the legend/controls row:
```js
const wrapperRef = useRef(null);
const backBtnRef = useRef(null);
const legendRef = useRef(null);

useLayoutEffect(() => {
  const compute = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const wH = wrapper.clientHeight;
    const wW = wrapper.clientWidth;
    const backH = (backBtnRef.current?.offsetHeight ?? 32) + 10; // +gap
    const legendH = (legendRef.current?.offsetHeight ?? 40) + 10;
    const availH = Math.max(100, wH - backH - legendH);
    const availW = wW;
    const ASPECT = 760 / 460;
    let w, h;
    if (availH * ASPECT <= availW) { h = availH; w = Math.round(h * ASPECT); }
    else { w = availW; h = Math.round(w / ASPECT); }
    setMapSize({ width: w, height: h });
  };
  compute();
  const obs = new ResizeObserver(compute);
  if (wrapperRef.current) obs.observe(wrapperRef.current);
  return () => obs.disconnect();
}, []);
```
Attach `ref={wrapperRef}` to the outer div, `ref={backBtnRef}` to the BackButton wrapper,
and `ref={legendRef}` to the zoom/legend row. Remove the `window.addEventListener("resize")`
approach entirely — `ResizeObserver` handles viewport changes and also responds to layout
shifts the window resize event misses.

---

## Summary Table

| ID | Category | Priority | File(s) |
|---|---|---|---|
| BUG-01 | Functional bug | High | `engine_port.js`, `logic.js` |
| BUG-02 | Functional bug | High | `engine_combat.js` |
| BUG-03 | Architecture violation + bug | High | `logic.js`, `generators.js`, `engine_combat.js` |
| BUG-04 | Typo | Low | `engine_combat.js` |
| BUG-05 | Functional bug | Medium | `engine_port.js` |
| ARCH-01 | Wrong file | Medium | `engine_core.js`, `engine_career.js` |
| ARCH-02 | Structural fragility | Medium | `engine_voyage.js` |
| ARCH-03 | Stale state field | Low | `engine_port.js`, `engine_core.js` |
| ARCH-04 | Wrong file | Low | `engine_port.js`, `engine_voyage.js`, `logic.js` |
| ARCH-05 | File too long | Low | `screens_port.jsx` |
| ARCH-06 | RNG in wrong layer | Low | `engine_combat.js`, `generators.js` |
| ARCH-07 | Pure fn in wrong layer | Low | `engine_combat.js`, `logic.js` |
| REFACTOR-01 | Case too long | Medium | `engine_port.js` |
| REFACTOR-02 | Function too long | Low | `logic.js` |
| REFACTOR-03 | Case too long | Medium | `engine_combat.js` |
| REFACTOR-04 | Data in function body | Low | `generators.js`, `data_text.js` |
| QUALITY-01 | AI soup / indentation | Low | `engine_port.js` |
| QUALITY-02 | AI soup / indentation | Low | `engine_core.js`, `engine_port.js` |
| QUALITY-03 | Needless `let` pattern | Low | `engine_port.js` |
| QUALITY-04 | Duplicate utility | Low | `engine_combat.js`, `logic.js` |
| QUALITY-05 | Dead code | Low | `data_text.js` |
| QUALITY-06 | Style inconsistency | Low | `engine_combat.js` |
| DATA-01 | Strings in engine | Low | `engine_combat.js`, `data_text.js` |
| DATA-02 | Strings in engine | Low | `engine_port.js`, `data_text.js` |
| DATA-03 | Strings in engine | Low | `engine_voyage.js`, `data_text.js` |
| DATA-04 | Strings in engine | Low | `engine_combat.js`, `data_text.js` |
| DATA-05 | Strings in engine | Low | `engine_combat.js`, `data_text.js` |
| MAP-01 | Performance / correctness | Medium | `screens_voyage.jsx` |
| MAP-02 | Mobile UX bug | Medium | `screens_voyage.jsx` |
| MAP-03 | Fragile magic numbers | Low | `screens_voyage.jsx` |
