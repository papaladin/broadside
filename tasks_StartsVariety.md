# Starting Faction Traits — Implementation Task List
## B10.1: Five birth-faction bonus/drawback pairs, new crew wage upkeep mechanic

**Prerequisite**: assumes B11 (combat rework + encounter-session refactor) is complete
— `encounterSession.battle`, `resolveNavalRound`, `resolveBoardingRound`,
`getBoardingRatio` all exist and are the sole combat resolution path.

**Scope note**: this covers the five birth-faction traits only. The Letter of Marque
mid-game pivot system (how a trait changes when the player takes a LoM from another
faction) is a separate, not-yet-locked design question — tracked separately, not part
of this task list.

---

## Final Design Recap

| Faction | System | Bonus | Drawback |
|---|---|---|---|
| English | Naval combat performance | Broadside/Precision damage +15–20% | Combat-only speed reduced ~15% (worse at Evade/Close/Open contests) |
| Spanish | Crew wage economy | Spanish crew free to hire, wage upkeep halved | Non-Spanish crew hire ×3–4, wage upkeep ×1.5 |
| Pirate | Crew wage economy | Free hiring, exempt from wage upkeep entirely | Periodic tribute at port entry (5–10% of gold, ~every 50–75 days); crew morale/upset penalty if tribute is unfairly low relative to what wages would have cost |
| French | Reputation system | Positive reputation gains ×1.5–2 | Infamy gain ×1.5, heat accumulation ×1.5 |
| Dutch | Wealth acquisition | Buy/sell price bonus (player-level, stacks with existing port-level B8.1 modifiers), no hold-weight travel speed penalty | Gold from combat missions and plunder ×0.75 |

Three factions (English, Spanish, Pirate) now cluster into two systems (combat
performance; crew wages) with different specific mechanics each — this is fine and
doesn't need forcing into five totally distinct systems. French and Dutch each own a
system no one else touches.

---

## Part 1 — Data Layer

### Task 1.1 — Add `FACTION_TRAITS` to `data.js`

```js
const FACTION_TRAITS = {
  english: {
    combatDamageMult: 1.18,      // Broadside/Precision damage output
    combatSpeedMult: 0.85,       // ONLY applied inside naval battle contests — never
                                   // affects travel-day speed calculations
  },
  spanish: {
    crewHireCostMult: { own: 0, other: 3.5 },   // own = spanish crew, other = all else
    wageUpkeepMult:   { own: 0.5, other: 1.5 },
  },
  pirate: {
    crewHireCostMult: { own: 0, other: 0 },     // free hiring, any nationality
    exemptFromWageUpkeep: true,
    tributeIntervalDays: 60,      // midpoint of the 50-75 day range, tunable
    tributePct: 0.08,              // midpoint of 5-10%, tunable
  },
  french: {
    reputationGainMult: 1.6,      // positive rep changes only
    infamyGainMult: 1.5,
    heatGainMult: 1.5,
  },
  dutch: {
    tradePriceMult: { buy: 0.92, sell: 1.08 },  // stacks multiplicatively with
                                                    // port-level B8.1 modifiers
    holdWeightSpeedExempt: true,
    combatGoldMult: 0.75,          // mission gold (combat-type only) and plunder gold
  },
};
```

Export in `window.D`. **All values are a first-pass starting point** — tune via
playtesting, not by inspection. Nothing in this task list depends on the exact
numbers being final.

### Task 1.2 — Add base wage upkeep constants

```js
const WAGE_TICK_INTERVAL_DAYS = 15;
const BASE_WAGE_PER_CREW = 5; // gold per crew member per tick, at the base rate
```

Export in `window.D`. **Note**: `BASE_WAGE_PER_CREW` is deliberately the same constant
used both by the universal wage-tick (Part 2) and by the pirate tribute fairness check
(Part 5) — one canonical "what a day of one crew member's wage costs" number, reused
in two places rather than two separately-tuned constants that could drift apart.

### Task 1.3 — Add `FACTION_START_DESCRIPTIONS` to `data_text.js`

One entry per faction: a short flavor description (1–2 sentences) and a compact,
literal mechanics recap string for the New Game screen (Part 8).

```js
const FACTION_START_DESCRIPTIONS = {
  english: {
    flavor: "Trained in Royal Navy gunnery. Your crews fire true, but discipline doesn't come cheap.",
    mechanics: "Broadside/Precision damage ×1.18 · Combat maneuvering speed ×0.85 · Crew wages: standard",
  },
  spanish: {
    flavor: "Sons and daughters of the colonial fleet. Spanish sailors follow you without question — others, less so.",
    mechanics: "Spanish crew: free to hire, wages ×0.5 · Non-Spanish crew: hire cost ×3.5, wages ×1.5",
  },
  pirate: {
    flavor: "No formal wages — the crew takes their share when the ship makes port. Shortchange them at your peril.",
    mechanics: "Free crew hiring, no standing wages · Crew claims 8% of gold roughly every 60 days · Morale penalty if the take is unfairly small",
  },
  french: {
    flavor: "Court-trained in the art of favor and consequence. Trust builds fast in French circles — so does scandal.",
    mechanics: "Reputation gained from good deeds ×1.6 · Infamy gained ×1.5 · Heat accumulation ×1.5",
  },
  dutch: {
    flavor: "Bred into the trading houses. You buy low and sell high — but war was never your family's business.",
    mechanics: "Buy price ×0.92, sell price ×1.08 · No speed penalty from a full hold · Combat mission & plunder gold ×0.75",
  },
};
```

Export in `window.D`.

---

## Part 2 — Universal Crew Wage Upkeep

### Task 2.1 — Add wage-tick state fields

**Where**: `engine_core.js`, `initialState` (~line 155).

```js
nextWageTickDay: WAGE_TICK_INTERVAL_DAYS, // set relative to START_GAME's actual start day
```

**Where**: `engine_port.js` or wherever `START_GAME` builds the initial ship/crew
state — set `nextWageTickDay: state.day + D.WAGE_TICK_INTERVAL_DAYS` at game start,
not a hardcoded absolute day, in case the starting day ever changes.

**Migration**: add `if (s.nextWageTickDay === undefined) s.nextWageTickDay = s.day + D.WAGE_TICK_INTERVAL_DAYS;`
in `migrateState`.

### Task 2.2 — Apply the wage tick during `ADVANCE_DAY`

**Where**: `engine_voyage.js`, `ADVANCE_DAY` case, alongside existing provision
consumption logic.

```js
// Wage tick — applies to all factions except pirate (Part 5 has its own mechanic).
if (state.faction !== "pirate" && newState.day >= newState.nextWageTickDay) {
  const traits = D.FACTION_TRAITS[state.faction] ?? {};
  const wageMult = traits.wageUpkeepMult ?? null; // Spanish only; everyone else pays base rate

  let totalWage = 0;
  for (const member of newState.crew.roster) {
    const isOwnFaction = member.faction === state.faction;
    const mult = wageMult
      ? (isOwnFaction ? wageMult.own : wageMult.other)
      : 1.0; // base rate for English, French, Dutch
    totalWage += D.BASE_WAGE_PER_CREW * mult;
  }
  totalWage = Math.round(totalWage);

  newState.gold = Math.max(0, newState.gold - totalWage);
  newState.nextWageTickDay = newState.day + D.WAGE_TICK_INTERVAL_DAYS;
  if (totalWage > 0) {
    newState.log = [...newState.log, window.E.logEntry(newState, `Crew wages paid: -${totalWage}g.`)];
  }
}
```

**Note**: wage cost is floored at 0 gold deduction (`Math.max(0, ...)`), never pushes
gold negative — consistent with how every other gold-deducting mechanic in the game
behaves.

---

## Part 3 — English: Combat Damage & Speed

### Task 3.1 — Apply damage multiplier in `resolveNavalRound`

**Where**: `logic.js`, inside `resolveNavalRound`'s Step 2 (Damage), wherever the
existing Broadside/Precision damage formulas compute output. Apply
`D.FACTION_TRAITS.english.combatDamageMult` only when `state.faction === "english"`
and only to the **player's own outgoing damage** — this is a player-faction trait, not
something that should ever apply to an English-faction *enemy* the player fights
(that's a separate, not-yet-built NPC-side consideration, out of scope here).

```js
const factionDamageMult = state.faction === "english" ? D.FACTION_TRAITS.english.combatDamageMult : 1.0;
// ... apply factionDamageMult alongside the existing distance multiplier when computing
// enemyHullDamage / enemyCrewLoss from the player's declared action
```

### Task 3.2 — Apply speed reduction, scoped strictly to combat contests

**Where**: `logic.js`, inside `resolveNavalRound`, at the point `playerSpeed` is
computed for the Evade/Close/Open contest formulas (per `design_combat_rework.md`
Section 3.4).

```js
const baseSpeed = getShipStats(state).speed;
const combatSpeedMult = state.faction === "english" ? D.FACTION_TRAITS.english.combatSpeedMult : 1.0;
const playerSpeed = baseSpeed * combatSpeedMult; // used ONLY for resolveSpeedContest calls in this function
```

**Critical scoping note**: `combatSpeedMult` must be applied **only** at this local
point inside the naval resolver — never as a modification to `getShipStats`'s
returned `speed` value itself, and never touching `L.travelDays` or any other
travel-day calculation. English ships are not literally slower ships; they maneuver
worse specifically inside a fight. Verify no other code path reads a "modified" speed
value — the trait should be invisible everywhere except inside
`resolveNavalRound`'s contest calls.

---

## Part 4 — Spanish: Crew Hire & Wage Modifiers

### Task 4.1 — Apply hire cost modifier in `HIRE_CREW`

**Where**: `engine_port.js`, `case A.HIRE_CREW` (~line 608). Current cost is a flat
50g/crew; this becomes faction-conditional.

```js
case A.HIRE_CREW: {
  const traits = D.FACTION_TRAITS[state.faction];
  const hireMult = traits?.crewHireCostMult;
  // Existing logic generates `count` new crew members with rolled nationalities —
  // cost must be computed AFTER nationality is known for each new hire, not as a
  // flat pre-multiplied lump sum, since Spanish cost depends on each hire's faction.
  let totalCost = 0;
  const newMembers = []; // ... existing roster-generation logic, per member:
  for (const member of newMembers) {
    const baseCost = 50;
    const mult = hireMult
      ? (member.faction === state.faction ? hireMult.own : hireMult.other)
      : 1.0;
    totalCost += Math.round(baseCost * mult);
  }
  // ... rest of existing HIRE_CREW logic, using totalCost instead of count * 50
}
```

**Note**: this changes the cost-calculation shape from "cost known before hiring" to
"cost depends on which crew get generated" — the UI (crew screen's hire button/cost
preview) needs a matching update, see Task 4.3.

### Task 4.2 — Apply wage multiplier in the wage tick

Already covered generically in Task 2.2's `wageMult` branch — no separate task needed,
confirm it's exercised correctly for Spanish specifically (covered by testing, Part
10).

### Task 4.3 — Update crew hiring UI to reflect variable cost

**Where**: `screens_crew.jsx`, hire crew button/cost display. Since Spanish hire cost
now depends on rolled nationality (not knowable until after the hire), the pre-hire
cost estimate should show a range or an average-case estimate
(`"~50-175g depending on nationality"`) rather than a fixed number, for Spanish
players specifically. Non-Spanish players see the unchanged flat cost.

---

## Part 5 — Pirate: Tribute Instead of Wages

### Task 5.1 — Exempt pirates from the universal wage tick

Already covered in Task 2.2's `if (state.faction !== "pirate" ...)` guard. No
separate task needed.

### Task 5.2 — Add tribute state fields

**Where**: `engine_core.js`, `initialState`.

```js
nextTributeDay: null, // set at START_GAME only if faction === "pirate"
```

Set during `START_GAME`: `nextTributeDay: faction === "pirate" ? startDay + D.FACTION_TRAITS.pirate.tributeIntervalDays : null`.

**Migration**: add the field as `null` if missing; no retroactive tribute owed on
migrated saves regardless of faction.

### Task 5.3 — Apply the tribute check on `ENTER_PORT`

**Where**: `engine_port.js`, `case A.ENTER_PORT` (~line 378). Per the ordering
established in B9's task list, this must run **before** the `isUnrecoverable` check
and before `autoSave` — so both evaluate the true post-tribute state, not a stale
pre-tribute one.

```js
case A.ENTER_PORT: {
  // ... existing port-entry logic builds nextState as normal ...

  if (state.faction === "pirate" && nextState.day >= (nextState.nextTributeDay ?? Infinity)) {
    const traits = D.FACTION_TRAITS.pirate;
    const tribute = Math.round(nextState.gold * traits.tributePct);
    const daysSincePayout = nextState.day - (nextState.nextTributeDay - traits.tributeIntervalDays);

    // Fairness check: what would standard wages have cost over this period?
    // See design note below — this is what closes the "stay broke on purpose" exploit.
    const expectedBaselineWage = daysSincePayout * D.BASE_WAGE_PER_CREW * nextState.crew.roster.length;

    nextState.gold = Math.max(0, nextState.gold - tribute);
    nextState.nextTributeDay = nextState.day + traits.tributeIntervalDays;
    nextState.log = [...nextState.log, window.E.logEntry(nextState, `The crew claims their share: -${tribute}g.`)];

    if (tribute < expectedBaselineWage * 0.5) {
      // Crew feels shortchanged relative to what they'd have earned on standard wages.
      nextState.crew = {
        ...nextState.crew,
        morale: Math.max(0, nextState.crew.morale - 12),
        roster: nextState.crew.roster.map(m =>
          !L.hasTag(m, "upset") && Math.random() < 0.3 ? L.addTag(m, "upset") : m
        ),
      };
      nextState.log = [...nextState.log, window.E.logEntry(nextState, "The crew grumbles — that's a thin share for the risk they've taken.")];
    }
  }

  const check = L.isUnrecoverable(nextState);
  if (check.unrecoverable) {
    return { ...nextState, screen: "gameover", gameOverReason: check.reason };
  }
  if (state.autoSave !== false) autoSave(nextState);
  return nextState;
}
```

**Design note on the fairness check** (worth preserving as a comment in the code, not
just this doc): a player who deliberately keeps gold near-zero right before the
tribute check to minimize the percentage-based cost is gaming an obvious exploit. The
`expectedBaselineWage` comparison — literally "what would `daysSincePayout ×
BASE_WAGE_PER_CREW × crewSize` have cost under the standard system" — catches exactly
this pattern without needing a hard minimum-tribute rule. A player who's genuinely
poor because the voyage went badly pays a small tribute and faces no penalty (the
comparison is proportional, not absolute); a player who's hoarding gold elsewhere and
timing their port entry to dodge the cost gets caught by the same check. This is a
structural answer to the exploit, not a patch.

### Task 5.4 — Surface tribute timing to the player

**Where**: `screens_port.jsx` or the HUD, for pirate-faction players only — a small
indicator of days until the next tribute is due (`nextTributeDay - state.day`), so the
mechanic is plannable rather than a surprise deduction. Doesn't need to be prominent —
a small line in the Status screen's career/finance section is sufficient, consistent
with the game's existing "don't hide mechanically relevant info" principle without
over-emphasizing a once-every-60-days event.

---

## Part 6 — Dutch: Trade & Travel

### Task 6.1 — Apply player-level trade price multiplier

**Where**: `generators.js`, `generatePortMarket` — the price calculation established
in B8.1 (`marketPrice = basePrice × availMult × factionMod × variance`) is entirely
port-identity-driven. Add a **second, independent** multiplier layered on top, keyed
to the player's own faction, applied only when computing `buyFromPort`/`sellToPort`
(not the underlying `marketPrice`, so gossip/extreme-price detection logic keyed off
`marketPrice` is unaffected).

```js
const playerTradeMult = state.faction === "dutch" ? D.FACTION_TRAITS.dutch.tradePriceMult : { buy: 1, sell: 1 };
const buyFromPort = Math.round(marketPrice * 1.10 * playerTradeMult.buy);
const sellToPort  = Math.round(marketPrice * 0.90 * playerTradeMult.sell);
```

**Confirms non-redundancy with B8.1**: this multiplies against the *already-computed*
port-level price, which stays driven entirely by port availability/faction — a Dutch
player gets an additional personal discount on top of whatever the port's own identity
already produces, never replacing or duplicating that calculation.

### Task 6.2 — Exempt Dutch from hold-weight travel speed penalty

**Where**: `logic.js`, wherever `getHoldSpeedMultiplier(loadPct)` is called (confirmed
at line 296, feeding into `L.travelDays`).

```js
const loadPct = getHoldLoadPct(state.hold?.items, getHoldCapacity(state));
const speedMult = state.faction === "dutch" && D.FACTION_TRAITS.dutch.holdWeightSpeedExempt
  ? 1.0
  : getHoldSpeedMultiplier(loadPct);
```

### Task 6.3 — Apply combat gold reduction

**Where**: two call sites —

1. `engine_port.js`, `COMPLETE_MISSION` case, for combat-type missions
   (combat/patrol/assault/escort) — apply `D.FACTION_TRAITS.dutch.combatGoldMult` to
   the gold reward when `state.faction === "dutch"`.
2. `engine_combat.js`, `TAKE_PLUNDER` case — apply the same multiplier to
   `goldReward` when `state.faction === "dutch"`.

Trade-type mission gold and free-trade income are **unaffected** — the drawback is
scoped precisely to combat-sourced income, consistent with "wealth acquisition, one
channel not the other" as a single coherent identity.

---

## Part 7 — French: Reputation, Infamy, Heat

### Task 7.1 — Amplify positive reputation gains

**Where**: `logic.js`, `applyReputationImpact` (confirmed at line 402 — this is
already the central funnel for all reputation changes, both mission completion and
event outcomes route through it per the earlier grep).

```js
const applyReputationImpact = (state, repImpact) => {
  const mult = state.faction === "french" ? D.FACTION_TRAITS.french.reputationGainMult : 1.0;
  const adjustedImpact = {};
  for (const [faction, delta] of Object.entries(repImpact)) {
    // Only amplify POSITIVE deltas — a French player's reputation LOSSES are not
    // reduced by this trait (that would make the trait strictly better with no
    // real trade-off; the infamy/heat side below is where the cost lives instead).
    adjustedImpact[faction] = delta > 0 ? delta * mult : delta;
  }
  // ... existing clamping/application logic, using adjustedImpact instead of repImpact
};
```

### Task 7.2 — Amplify infamy gain via a new central helper

**Where**: `logic.js`, new function — infamy gain currently happens at multiple
inline call sites (`engine_combat.js` lines ~155, ~430, ~622; `engine_port.js` line
~976) rather than through one shared function. Introduce a funnel, consistent with
the "route internal calls through a shared function" principle applied elsewhere in
this codebase's cleanup work.

```js
const applyInfamyGain = (state, baseAmount) => {
  const mult = state.faction === "french" ? D.FACTION_TRAITS.french.infamyGainMult : 1.0;
  return Math.min(999, (state.infamy ?? 0) + Math.round(baseAmount * mult));
};
```

Export in `window.L`. **Update all existing infamy-gain call sites** (the four
locations found above, and any others surfaced by a full grep for `infamy ?? 0) +`)
to call `L.applyInfamyGain(state, baseAmount)` instead of inlining the calculation —
this is a real refactor, not just an addition, and it's the only way to guarantee the
French multiplier applies uniformly rather than needing to be remembered at every
future infamy-gain call site too.

### Task 7.3 — Amplify heat accumulation

**Where**: `engine_combat.js`, `addHeat` (confirmed still living here as a private
helper, not yet moved to `logic.js` per the earlier architecture audit — this task
does not require moving it, just modifying it in place; moving it remains a separate,
optional cleanup item).

```js
const addHeat = (state, faction, heatAmount) => {
  const mult = state.faction === "french" ? D.FACTION_TRAITS.french.heatGainMult : 1.0;
  const adjustedAmount = Math.round(heatAmount * mult);
  // ... existing heat-application logic, using adjustedAmount instead of heatAmount
};
```

---

## Part 8 — New Game Screen Updates

### Task 8.1 — Display faction description and mechanics recap

**Where**: `screens_core.jsx`, `NewGameScreen`, the faction selection buttons.

Per the established "don't hide critical mechanical info in a tooltip on mobile"
principle, both the flavor text and the mechanics recap render **inline**, always
visible — not behind a hover state.

```jsx
{Object.entries(D.FACTIONS).map(([key, faction]) => (
  <button key={key} onClick={() => setSelectedFaction(key)}
    style={{ /* existing faction button styling, selected-state highlight */ }}>
    <div style={{ fontWeight: "bold", color: faction.color }}>{faction.label}</div>
    <div style={{ fontSize: T.narrativeFontSize, color: T.textDim, marginTop: 4 }}>
      {D.FACTION_START_DESCRIPTIONS[key].flavor}
    </div>
    <div style={{ fontSize: T.captionFontSize, color: T.gold, marginTop: 6, fontFamily: T.font }}>
      {D.FACTION_START_DESCRIPTIONS[key].mechanics}
    </div>
  </button>
))}
```

**Layout note**: five buttons each now carrying two lines of text is meaningfully
taller than the current compact faction picker (confirmed from earlier screenshots —
currently a single row of short-label buttons). This likely needs a layout change from
a horizontal row to a vertical stack or a 2-column grid on the New Game screen. Flag
for whoever implements the UI — this task list specifies the content and data
requirement, not the final layout, which should follow the game's established
hand-drawn panel conventions (`Panel` component) rather than the plain bordered
buttons currently used.

---

## Part 9 — State Shape Summary

New fields added to `initialState` by this task list, consolidated for the migration
pass:

```js
nextWageTickDay: null,   // set at START_GAME
nextTributeDay: null,    // set at START_GAME only for pirate faction, else stays null
```

**Migration** (`engine_core.js`, `migrateState`):
```js
if (s.nextWageTickDay === undefined) s.nextWageTickDay = s.day + D.WAGE_TICK_INTERVAL_DAYS;
if (s.nextTributeDay === undefined) s.nextTributeDay = null; // no retroactive tribute on old saves
```

---

## Part 10 — Automated Test Coverage

### Task 10.1 — `tests_logic.js`: pure formula checks

- `L.FACTION.01` — English damage multiplier applies only when `state.faction ===
  "english"`, confirmed via `resolveNavalRound` output comparison against a
  non-English baseline
- `L.FACTION.02` — English combat speed multiplier affects contest outcomes but does
  NOT affect `L.travelDays` output for an otherwise-identical English vs. non-English
  state (regression guard for the critical scoping note in Task 3.2)
- `L.FACTION.03` — Spanish hire cost: own-faction crew costs 0g, non-Spanish crew
  costs `50 × 3.5`, rounded correctly
- `L.FACTION.04` — `applyReputationImpact`: French positive deltas amplified,
  negative deltas unchanged (regression guard for Task 7.1's asymmetric design)
- `L.FACTION.05` — `applyInfamyGain`: French multiplier applies; non-French unaffected
- `L.FACTION.06` — Dutch trade multiplier stacks correctly with an existing
  port-level B8.1 modifier (e.g. confirm final price = `basePrice × availMult ×
  factionMod × variance × dutchPlayerMult`, all four layers present)
- `L.FACTION.07` — Dutch hold-weight exemption: `getHoldSpeedMultiplier` result is
  overridden to 1.0 for Dutch regardless of load%, confirmed at both <50% and >50% load

### Task 10.2 — `tests_logic.js`: pirate tribute fairness check

- `L.TRIBUTE.01` — tribute deducted correctly as `gold × tributePct`, rounded
- `L.TRIBUTE.02` — fairness check: tribute below 50% of `expectedBaselineWage`
  triggers morale penalty and at least one `upset` tag application
- `L.TRIBUTE.03` — fairness check: tribute at or above 50% of
  `expectedBaselineWage` applies no penalty (a genuinely poor player isn't punished
  twice)
- `L.TRIBUTE.04` — the "stay broke on purpose" exploit case: low current gold but a
  large crew and long `daysSincePayout` still triggers the penalty correctly (this is
  the specific scenario the fairness check exists to catch — worth its own explicit
  test, same reasoning as the regression tests preserved in the combat rework task
  lists)

### Task 10.3 — `tests_engine.js`: reducer integration

- `E.WAGE.01` — `ADVANCE_DAY` past `nextWageTickDay` deducts the correct amount for a
  non-Spanish, non-pirate faction (base rate)
- `E.WAGE.02` — same, for Spanish, with a mixed-nationality roster — confirms
  per-member cost calculation, not a flat rate
- `E.WAGE.03` — pirate faction never triggers the wage tick regardless of
  `nextWageTickDay`
- `E.TRIBUTE.01` — `ENTER_PORT` past `nextTributeDay` for a pirate player deducts
  tribute and resets the timer
- `E.TRIBUTE.02` — non-pirate factions never trigger the tribute check
- `E.TRIBUTE.03` — tribute check runs, and correctly feeds into, the
  `isUnrecoverable` check in the same `ENTER_PORT` dispatch — construct a scenario
  where tribute deduction is what brings liquid value below the recovery threshold,
  confirm `isUnrecoverable` sees the POST-tribute state (ordering regression test,
  directly checking the ordering requirement stated in Task 5.3)
- `E.HIRE.01` — Spanish `HIRE_CREW` cost varies correctly based on rolled crew
  nationality across multiple hires in one dispatch

### Task 10.4 — `tests_ui.js`: New Game screen smoke test

- `U.SMOKE.NEWGAME.01` — `NewGameScreen` renders all five faction descriptions and
  mechanics recap strings without throwing
- `U.SMOKE.NEWGAME.02` — every key in `D.FACTION_START_DESCRIPTIONS` has both a
  `flavor` and `mechanics` string, non-empty (content completeness check, catches a
  missing faction entry before it ships)

---

## Build Order

1. Part 1 (data tables) — no dependencies
2. Part 9 (state shape) — trivial, do early, alongside Part 1
3. Part 2 (universal wage tick) — depends on Part 1
4. Part 3 (English) — depends on B11's `resolveNavalRound` existing; independent of
   Parts 4–7
5. Part 4 (Spanish) — depends on Part 2
6. Part 5 (Pirate) — depends on Part 1 (tribute constants); independent of Part 2's
   mechanism since pirates are exempt from it
7. Part 6 (Dutch) — independent of Parts 2–5, touches `generators.js`/`logic.js` only
8. Part 7 (French) — independent of Parts 2–6; Task 7.2's refactor (centralizing
   infamy gain) is worth doing carefully since it touches multiple existing call
   sites — grep thoroughly before considering it done
9. Part 8 (New Game screen) — depends on Part 1's description content existing;
   can be built in parallel with Parts 2–7 once Task 1.3 is done
10. Part 10 (tests) — incrementally alongside each part; Task 10.2's `L.TRIBUTE.04`
    and Task 10.3's `E.TRIBUTE.03` are the highest-value tests in this list, since
    each encodes a deliberate design decision (the exploit-closing fairness check, and
    the tribute-before-isUnrecoverable ordering) that would be easy to silently break
    in a future refactor without realizing it contradicts the design.