# Tasks: Fame, Reputation Perks & Infamy Tracks
### P1.5 · P1.7 · P2.7

> Each phase is independently shippable and stable.
> P1.5 surfaces fame as a progression axis and gates content behind it.
> P1.7 gives reputation mechanical weight at port services.
> P2.7 adds infamy as a second identity track with a single in-scope gate.
> Do not start P2.7 without P1.5 and P1.7 fully closed.

---

## Design Decisions (All Locked)

---

### FAME

**Q1 — What earns fame?** ✅ DECIDED: Missions only.
Fame is a record of sanctioned achievement. Notable combat is almost always
tied to a mission anyway. Non-mission sources deferred to Phase 2+.

**Q2 — Does fame decay?** ✅ DECIDED: No.
Fame is the player's level — a permanent ratchet. It never decreases.
Infamy provides the opposing pressure axis; fame decay is not needed.

**Q3 — Fame tier thresholds and mission values** ✅ DECIDED
Thresholds confirmed. Mission fame values are drastically reduced from the
original pool — most missions award **1 fame point**. High-risk, assault,
and future governor/named NPC missions award **2–3 points**. Tiers are
designed to feel earned over a full campaign, not a few sessions.

| Tier | Threshold | Label | Example unlocks |
|------|-----------|-------|-----------------|
| 0 | 0–49 | Unknown | Base access |
| 1 | 50–99 | Recognised | Frigate for sale, extra_cannons upgrade |
| 2 | 100–199 | Notorious | Galleon for sale, Roatán visible |
| 3 | 200–349 | Legendary | Copper hull upgrade, top-tier missions |
| 4 | 350+ | Immortal | Libertalia visible, retirement eligible |

**Mission fame values (apply to all existing missions):**

| Mission type | Fame |
|---|---|
| trade, escort (low/medium risk) | 1 |
| patrol, smuggle_rum, hunt missions | 2 |
| assault missions | 3 |
| debug_combat | 0 |

**Q4 — How does fame gate missions?** ✅ DECIDED: Hidden, not greyed.
The board shows only missions the player can currently access. Gated missions
are entirely hidden. Mystery is intentional. When parametric generation lands,
mission quality and rewards will scale with fame tier — no backfill needed.

---

### REPUTATION

**Q5 — Do reputation perks apply at sea or in port only?** ✅ DECIDED: Port only.
When the player enters a port, that port's reputation determines service access
and gold modifiers. No at-sea effects in P1.7. Faction-level patrol effects
are a Phase 2 feature.

**Q6 — Repair discount rates and UI** ✅ DECIDED
Rates:
- Neutral (30–49): ×1.0
- Friendly (50–69): ×0.90
- Allied (≥80): ×0.80

UI shows the discounted price inline with `"(allied discount applied)"`.
No tooltip — the mention is the explanation.

**Q7 — Mission pool and gold modifiers by rep tier** ✅ DECIDED
No pool filtering by rep (except At War). The full faction-eligible pool always
shows. A gold multiplier applies to completion rewards:

| Rep tier | Gold multiplier | Note |
|---|---|---|
| At War (<10) | ×0 | No missions available |
| Hostile (10–29) | ×0.75 | −25% penalty |
| Neutral (30–49) | ×0.90 | −10% penalty |
| Friendly (50–69) | ×1.10 | +10% bonus |
| Allied (≥80) | ×1.20 | +20% bonus |

The modifier is shown on the mission card and in the completion log entry so
the player understands why rep has monetary value.

**Q8 — What happens at At War (<10)?** ✅ DECIDED: Total service denial.
At War = no repair, no crew hire, no upgrades, no morale boost, no missions.
The only reason to dock is if there is no choice. Implementation: when
`servicesBlocked === true`, all service panel content is replaced by a single
hostile notice. Buttons are not greyed — the entire content is hidden.
No docking fee — service denial is already significant.

**Q9 — Does reputation decay in port?** ✅ DECIDED: No.
No mechanism to advance time in port currently. Decay only fires in ADVANCE_DAY
which runs at sea. This is correct and intentional — unchanged.

---

### INFAMY

**Q10 — Single or faction-specific track?** ✅ DECIDED: Single global track.
Faction-weighted encounter effects can come later without a state shape change.

**Q11 — What earns infamy?** ✅ DECIDED: Certain missions only (for now).
Only smuggle and assault missions carry an `infamyGain` field in data.js.
Other actions (faction rep changes, combat, events) affect reputation, not
infamy. Broader infamy triggers are deferred until parametric event generation.

**Q12 — Infamy values, decay, and mechanical effects** ✅ DECIDED
- Infamy does **not decay**. Permanent accumulation, same as fame.
  Methods to reduce infamy (paying governors) are a future Phase 3 concept.
- Values are small: `+1` for smuggling, up to `+3` for major assaults.
- **Patrol rate effects are deferred** until parametric random event generation.
- **The only in-scope P2.7 mechanical effect:** infamy ≥ 50 removes the Bribe
  option from InterceptScreen. Reason shown: `"Your reputation for bribery has
  preceded you."`
- Infamy is displayed **from day 1** — always visible, even at 0. The player
  should know the track exists before it becomes dangerous.

**Infamy tier labels (display only — mechanical effect is bribe block at 50):**

| Infamy | Label |
|--------|-------|
| 0–9 | Clean |
| 10–24 | Suspect |
| 25–49 | Wanted |
| 50–99 | Notorious |
| 100+ | Legendary Outlaw |

**Q13 — Infamy vs. pirate reputation** ✅ DECIDED: Independent.
High pirate reputation does not generate infamy. They track different things.

**Q14 — Does infamy modify rep decay or block ports?** ✅ DECIDED: Neither.
No rep decay rate change. No port blocking. The bribe block (Q12) is the only
in-scope mechanical effect. Port blocking and debt-payment infamy reduction
are Phase 3 concepts.

**Q15 — Where is infamy displayed?** ✅ DECIDED: HUD + StatusScreen.
1. **HUD** — alongside fame, always visible.
2. **StatusScreen** — the current FactionsScreen is renamed "Status". A
   Captain's Standing panel at the top shows Fame and Infamy together, above
   the existing per-faction reputation list.

---

## Implementation Tasks

---

## P1.5 — Fame Display & Gating

> **Scope:** surface `state.fame` in HUD and StatusScreen. Gate ships, upgrades,
> and missions behind fame thresholds. No new mechanics, no new state fields.

### data.js

- [ ] **Reduce all mission `fame` values to the new scale.**
  Apply the table from Q3 to every entry in MISSION_POOL.

- [ ] **Add `requiredFame` to SHIPS.**
  ```js
  frigate:  { ..., requiredFame: 50  }
  galleon:  { ..., requiredFame: 100 }
  // dinghy, sloop, brigantine, merchantman: no field (implicitly 0)
  ```

- [ ] **Add `requiredFame` to UPGRADES.**
  ```js
  extra_cannons:      { ..., requiredFame: 50  }
  copper_hull:        { ..., requiredFame: 100 }
  navigational_tools: { ..., requiredFame: 50  }
  // reinforced_hull, figurehead: no field
  ```

- [ ] **Add `requiredFame` to high-tier MISSION_POOL entries.**
  ```js
  hunt_pirate:       { ..., requiredFame: 50  }
  hunt_privateer:    { ..., requiredFame: 50  }
  escort_fleet:      { ..., requiredFame: 50  }
  assault_havana:    { ..., requiredFame: 100 }
  assault_cartagena: { ..., requiredFame: 100 }
  assault_portRoyal: { ..., requiredFame: 100 }
  ```

### logic.js

- [ ] **Add `getFameLabel(fame)` pure function.**
  ```js
  const getFameLabel = (fame) => {
    if (fame >= 350) return "Immortal";
    if (fame >= 200) return "Legendary";
    if (fame >= 100) return "Notorious";
    if (fame >= 50)  return "Recognised";
    return "Unknown";
  };
  ```
  Export from `window.L`.

- [ ] **Add `meetsRequirement(state, item)` pure function.**
  Single gate for fame checks. Returns `{ allowed: bool, reason: string | null }`.
  ```js
  const meetsRequirement = (state, item) => {
    if (item.requiredFame && state.fame < item.requiredFame)
      return { allowed: false,
               reason: `Requires ★ ${item.requiredFame} fame (${getFameLabel(item.requiredFame)})` };
    return { allowed: true, reason: null };
  };
  ```
  Forward note: when P3.1 (unlockable ports) is implemented, this function
  will be extended to read port `unlockCondition` objects without changing
  any existing call sites.

- [ ] **Extend `generateMissions(portKey, state)` to filter by fame.**
  Add to the existing `availableMissions` filter:
  ```js
  && !(mission.requiredFame && state.fame < mission.requiredFame)
  ```
  Gated missions are excluded from the returned array entirely (hidden, not shown).

### engine.js

- [ ] **Guard `BUY_SHIP` with fame check.**
  Before the gold check, add:
  ```js
  const req = L.meetsRequirement(state, ship);
  if (!req.allowed) return { ...state,
    log: [...state.log, `Cannot purchase: ${req.reason}.`] };
  ```

- [ ] **Guard `BUY_UPGRADE` with fame check.**
  Same pattern using `L.meetsRequirement(state, upgrade)`.

- [ ] **Guard `TAKE_MISSION` with fame check.**
  Same pattern using `L.meetsRequirement(state, mission)`.
  Note: `generateMissions` already filters gated missions, so this guard is
  belt-and-suspenders against a direct dispatch.

### App.jsx

- [ ] **Add fame to HUD.**
  In the left span cluster, after the existing stats:
  ```jsx
  <span style={{ color: T.gold, marginLeft: 10 }}>★ {state.fame}</span>
  ```

- [ ] **Add infamy HUD stub (wired in P2.7, added now so App.jsx is not
  touched again).**
  ```jsx
  <span style={{ color: (state.infamy ?? 0) > 0 ? T.red : T.textFaint, marginLeft: 10 }}>
    ☠ {state.infamy ?? 0}
  </span>
  ```
  Reads `state.infamy` which will be `undefined` until P2.7. The `?? 0` guard
  makes this safe — renders `☠ 0` in T.textFaint with no errors.

### screens.jsx

- [ ] **ShipyardScreen — filter ships by fame.**
  Ships where `L.meetsRequirement(state, ship).allowed === false` are not
  rendered. The player does not see ships they cannot access. If all purchasable
  ships are filtered out, show `EmptyState` with `"No ships available at your
  current fame (★ {state.fame})."`.

- [ ] **ShipyardScreen — filter upgrades by fame.**
  Same pattern. Show `EmptyState` if none remain.

- [ ] **PortScreen mission board — already filtered by `generateMissions`.**
  No additional UI change needed.

- [ ] **Rename FactionsScreen → StatusScreen.**
  - Rename the component function to `StatusScreen`.
  - Update `window.S` export key to `StatusScreen`.
  - Update the router case in App.jsx: `case "status": return <S.StatusScreen .../>`.
  - Update any navigation buttons that currently dispatch `screen: "factions"`
    to dispatch `screen: "status"`.

- [ ] **StatusScreen — add Captain's Standing panel above faction rows.**
  New top panel:
  ```
  ┌──────────────────────────────────┐
  │  CAPTAIN'S STANDING              │
  │  ★ 14  Unknown                   │
  │  ☠  0  Clean                     │
  └──────────────────────────────────┘
  ```
  Infamy row shows in T.textFaint when 0. The P2.7 task will add the label
  consequence text below the infamy row — stub the row structure now so P2.7
  only needs to add content, not restructure the panel.

### tests.js

- [ ] **Unit: `getFameLabel` returns correct string at each tier boundary.**
- [ ] **Unit: `meetsRequirement` returns `{ allowed: false }` with reason string
  when `state.fame < item.requiredFame`.**
- [ ] **Unit: `meetsRequirement` returns `{ allowed: true }` when fame sufficient.**
- [ ] **Unit: `meetsRequirement` returns `{ allowed: true }` when item has no
  `requiredFame` field.**
- [ ] **Unit: `generateMissions` excludes missions where `requiredFame > state.fame`.**
- [ ] **Unit: `generateMissions` includes missions where `requiredFame <= state.fame`.**
- [ ] **Reducer: `BUY_SHIP` blocked with log entry when fame insufficient.**
- [ ] **Reducer: `BUY_UPGRADE` blocked with log entry when fame insufficient.**
- [ ] **Reducer: `TAKE_MISSION` blocked with log entry when fame insufficient.**
- [ ] **Reducer: `BUY_SHIP` succeeds when fame sufficient (and gold sufficient).**
- [ ] **UI smoke: HUD shows `★` at all non-start screens.**
- [ ] **UI smoke: HUD shows `☠ 0` in faint colour when infamy is 0 or undefined.**
- [ ] **UI smoke: StatusScreen renders Captain's Standing panel plus faction rows.**
- [ ] **UI smoke: ShipyardScreen shows EmptyState when all ships are fame-gated.**

### architecture.md

- [ ] **State shape: document `state.fame` as progression axis with tier table.**
- [ ] **State shape: add `state.infamy: 0` stub entry** (implemented in P2.7,
  documented now).
- [ ] **logic.js exports: add `getFameLabel`, `meetsRequirement`.**
- [ ] **Screens: document renamed StatusScreen replacing FactionsScreen.**
- [ ] **Data: document `requiredFame` field on SHIPS, UPGRADES, MISSION_POOL.**

---

## P1.7 — Reputation Perks

> **Scope:** give reputation mechanical weight at port services. All effects are
> port-local. No at-sea effects. No new state fields. No new screens.
> Depends on P1.5 being fully closed.

### logic.js

- [ ] **Add `getRepPerk(rep)` pure function.**
  Returns a descriptor used by reducer enforcement and UI display.
  ```js
  const getRepPerk = (rep) => {
    if (rep >= 80) return { tier: "allied",   repairMult: 0.80, missionMult: 1.20, servicesBlocked: false };
    if (rep >= 50) return { tier: "friendly", repairMult: 0.90, missionMult: 1.10, servicesBlocked: false };
    if (rep >= 30) return { tier: "neutral",  repairMult: 1.00, missionMult: 0.90, servicesBlocked: false };
    if (rep >= 10) return { tier: "hostile",  repairMult: 1.00, missionMult: 0.75, servicesBlocked: false };
    return               { tier: "at_war",   repairMult: 1.00, missionMult: 0,    servicesBlocked: true  };
  };
  ```
  `missionMult: 0` at At War is a safeguard — if a mission somehow reaches
  COMPLETE_MISSION at this rep level, the reward is zeroed. Export from `window.L`.

### engine.js

- [ ] **REPAIR case — apply discount.**
  ```js
  const rep = state.reputation[state.currentPort] ?? 50;
  const perk = L.getRepPerk(rep);
  const baseCost = (shipStats.maxHull - state.ship.hull) * 2;
  const cost = Math.floor(baseCost * perk.repairMult);
  if (state.gold < cost) return { ...state,
    log: [...state.log, "Not enough gold to repair."] };
  const discountNote = perk.repairMult < 1 ? ` (${perk.tier} discount applied)` : "";
  return { ...state, gold: state.gold - cost,
    ship: { ...state.ship, hull: shipStats.maxHull },
    log: [...state.log, `Repaired ship for ${cost}g${discountNote}.`] };
  ```

- [ ] **HIRE_CREW case — block when At War.**
  Add before the existing cost/roster logic:
  ```js
  const perk = L.getRepPerk(state.reputation[state.currentPort] ?? 50);
  if (perk.servicesBlocked) return { ...state,
    log: [...state.log, "You are at war with this port. No services available."] };
  ```

- [ ] **BUY_UPGRADE case — block when At War.**
  Same one-liner check before the existing guards.

- [ ] **BUY_SHIP case — block when At War.**
  Same pattern.

- [ ] **RAISE_MORALE case — block when At War.**
  Same pattern.

- [ ] **COMPLETE_MISSION case — apply gold multiplier.**
  ```js
  const rep = state.reputation[state.currentPort] ?? 50;
  const perk = L.getRepPerk(rep);
  const baseGold = mission.gold;
  const finalGold = Math.floor(baseGold * perk.missionMult);
  const goldDelta = finalGold - baseGold;
  const bonusNote = goldDelta > 0 ? ` (+${goldDelta}g ${perk.tier} bonus)`
                  : goldDelta < 0 ? ` (${Math.abs(goldDelta)}g ${perk.tier} penalty)` : "";
  // Use finalGold instead of baseGold in the state update and log entry.
  ```

### screens.jsx

- [ ] **All port service panels — block content when At War.**
  In PortScreen, ShipyardScreen, and CrewScreen: check
  `L.getRepPerk(state.reputation[state.currentPort] ?? 50).servicesBlocked`.
  When true, replace all service panel content with:
  ```jsx
  <EmptyState message="⚔ You are at war with this port. No faction will deal with you here." />
  ```
  The panel header (e.g. "SHIPYARD") remains visible — the player needs to
  understand what they are missing, not just see a blank panel.

- [ ] **ShipyardScreen repair section — show discounted price.**
  Compute final cost using `getRepPerk(rep).repairMult` and display it
  regardless of whether a discount applies. When `repairMult < 1`, append
  `"— {tier} discount applied"` after the cost number.

- [ ] **PortScreen mission board — show gold modifier notice.**
  Above the mission list, when not at Neutral tier, show a one-line notice:
  - Friendly/Allied: `"★ {tier} standing: +X% mission rewards"` in T.greenBr
  - Hostile: `"⚠ Hostile standing: −25% mission rewards"` in T.gold
  - At War: board replaced by the `EmptyState` hostile notice (see above).

- [ ] **StatusScreen — add perk description to each faction row.**
  In the per-faction section, after the reputation label, add a brief perk note:
  - Allied: `"20% repair · +20% missions"`
  - Friendly: `"10% repair · +10% missions"`
  - Neutral: `"−10% missions"`
  - Hostile: `"−25% missions"`
  - At War: `"No services"`
  This gives the player a quick reference for what each tier means.

### tests.js

- [ ] **Unit: `getRepPerk` returns correct object at rep boundaries: 9, 10,
  29, 30, 49, 50, 79, 80.**
- [ ] **Reducer: `REPAIR` applies 10% discount (repairMult 0.90) at Friendly.**
- [ ] **Reducer: `REPAIR` applies 20% discount (repairMult 0.80) at Allied.**
- [ ] **Reducer: `REPAIR` applies no discount at Neutral.**
- [ ] **Reducer: `REPAIR` log entry contains "allied discount applied" when Allied.**
- [ ] **Reducer: `REPAIR` fails with log entry when gold insufficient.**
- [ ] **Reducer: `HIRE_CREW` blocked with log entry when rep < 10.**
- [ ] **Reducer: `BUY_UPGRADE` blocked with log entry when rep < 10.**
- [ ] **Reducer: `BUY_SHIP` blocked with log entry when rep < 10.**
- [ ] **Reducer: `COMPLETE_MISSION` applies +20% gold at Allied.**
- [ ] **Reducer: `COMPLETE_MISSION` applies +10% gold at Friendly.**
- [ ] **Reducer: `COMPLETE_MISSION` applies −10% gold at Neutral.**
- [ ] **Reducer: `COMPLETE_MISSION` applies −25% gold at Hostile.**
- [ ] **Reducer: `COMPLETE_MISSION` applies 0 gold at At War (safeguard).**
- [ ] **Reducer: `COMPLETE_MISSION` log entry contains bonus/penalty note.**
- [ ] **UI smoke: ShipyardScreen shows hostile EmptyState notice when rep < 10.**
- [ ] **UI smoke: ShipyardScreen shows discounted repair price when Allied.**
- [ ] **UI smoke: PortScreen mission board shows bonus notice when Friendly.**
- [ ] **UI smoke: StatusScreen shows perk description on each faction row.**

### architecture.md

- [ ] **logic.js exports: add `getRepPerk`.**
- [ ] **Action reference: update REPAIR, HIRE_CREW, BUY_UPGRADE, BUY_SHIP,
  RAISE_MORALE, COMPLETE_MISSION to note rep-perk reads.**
- [ ] **Game Mechanics: add reputation tier effects table (repairMult,
  missionMult, servicesBlocked).**

---

## P2.7 — Infamy Track

> **Scope:** add `state.infamy` as a permanent accumulation track. Surface it
> in HUD (stub already placed in P1.5) and StatusScreen. Add infamy-earning
> triggers to smuggle and assault mission completions. Block bribe at infamy ≥ 50.
> No patrol rate effects. No rep decay changes. No port blocking.
> Depends on P1.5 and P1.7 fully closed.

### data.js

- [ ] **Add `infamyGain` to infamy-earning MISSION_POOL entries.**
  Absence of the field means zero — do not add `infamyGain: 0` to clean missions.
  ```js
  smuggle_rum:        { ..., infamyGain: 1 }
  smuggle_goods:      { ..., infamyGain: 1 }
  smuggle_slaves:     { ..., infamyGain: 3 }
  assault_havana:     { ..., infamyGain: 2 }
  assault_cartagena:  { ..., infamyGain: 2 }
  assault_portRoyal:  { ..., infamyGain: 3 }
  ```

### logic.js

- [ ] **Add `getInfamyLabel(infamy)` pure function.**
  ```js
  const getInfamyLabel = (infamy) => {
    if (infamy >= 100) return "Legendary Outlaw";
    if (infamy >= 50)  return "Notorious";
    if (infamy >= 25)  return "Wanted";
    if (infamy >= 10)  return "Suspect";
    return "Clean";
  };
  ```
  Export from `window.L`.

- [ ] **Add `canBribe(state)` pure function.**
  Single place for the bribe-block threshold. Keeps the reducer and UI in sync.
  ```js
  const canBribe = (state) => (state.infamy ?? 0) < 50;
  ```
  Export from `window.L`.

- [ ] **Extend `buildEncounterContext(state, type, enemy)` to apply infamy
  bribe block.**
  In the bribe options section, after the existing type-block and gold checks:
  ```js
  const bribeInfamyBlocked = !L.canBribe(state);
  const canBribeResult = !bribeBlocked && canAffordBribe && !bribeInfamyBlocked;
  const bribeReason = bribeBlocked        ? "They cannot be bought"
                    : bribeInfamyBlocked  ? "Your reputation for bribery has preceded you."
                    : !canAffordBribe     ? `Need ${bribeCost}g (you have ${gold}g)`
                    : null;
  ```
  No change to the returned object shape — `bribe.available` and `bribe.reason`
  already exist. Only the logic computing them changes.

### engine.js

- [ ] **Add `infamy: 0` to `initialState`.**

- [ ] **START_GAME case — explicitly set `infamy: 0` in newState.**
  Already in initialState, but set it explicitly so partial spreads don't
  accidentally carry over a previous game's infamy.

- [ ] **COMPLETE_MISSION case — add infamy gain.**
  After the existing gold/fame/rep update, before returning:
  ```js
  const infamyGain = mission.infamyGain || 0;
  const oldInfamy = state.infamy ?? 0;
  const newInfamy = Math.min(999, oldInfamy + infamyGain);
  const crossedThreshold =
    L.getInfamyLabel(newInfamy) !== L.getInfamyLabel(oldInfamy);
  const infamyEntries = [];
  if (infamyGain > 0) infamyEntries.push(`+${infamyGain} infamy.`);
  if (crossedThreshold) infamyEntries.push(
    `Your name grows darker. You are now ${L.getInfamyLabel(newInfamy)}.`);
  // Merge infamyEntries into the log and include infamy: newInfamy in returned state.
  ```

### screens.jsx

- [ ] **StatusScreen — fill in infamy row in Captain's Standing panel.**
  The panel stub was placed in P1.5. Now add:
  - Infamy value and label (red when > 0, faint when 0)
  - When infamy ≥ 10, a one-line plain-language consequence below the label:
    - Suspect (10–24): `"Coastal patrols are watching you more closely."`
    - Wanted (25–49): `"Bribe option will be unavailable above 50 infamy."`
    - Notorious (50–99): `"You cannot bribe your way past patrols."`
    - Legendary Outlaw (100+): `"Every colonial faction considers you an enemy of civilisation."`

- [ ] **InterceptScreen — infamy bribe block is already handled by
  `buildEncounterContext`.**
  The screen renders `bribe.available` and `bribe.reason` from encounterContext.
  No UI change needed if the existing disabled-option rendering pattern handles
  a false `available` flag. Verify this works and add a note if any adjustment
  is needed.

### App.jsx

- [ ] **Activate the infamy HUD stub from P1.5.**
  No code change needed if the stub was written with `?? 0`. The field now
  exists in state and will render correctly. Verify only.

### tests.js

- [ ] **Unit: `getInfamyLabel` returns correct string at boundaries: 9, 10,
  24, 25, 49, 50, 99, 100.**
- [ ] **Unit: `canBribe` returns `true` when `state.infamy = 49`.**
- [ ] **Unit: `canBribe` returns `false` when `state.infamy = 50`.**
- [ ] **Unit: `canBribe` returns `true` when `state.infamy` is undefined.**
- [ ] **Unit: `buildEncounterContext` sets `bribe.available = false` and
  non-null `bribe.reason` when `state.infamy = 50`.**
- [ ] **Unit: `buildEncounterContext` sets `bribe.available` normally when
  `state.infamy = 49`.**
- [ ] **Reducer: `COMPLETE_MISSION` on smuggle_rum adds 1 infamy.**
- [ ] **Reducer: `COMPLETE_MISSION` on assault_portRoyal adds 3 infamy.**
- [ ] **Reducer: `COMPLETE_MISSION` on a trade mission adds 0 infamy.**
- [ ] **Reducer: `COMPLETE_MISSION` adds threshold-crossing log entry when
  label changes (e.g. 9 → 10 crossing from Clean to Suspect).**
- [ ] **Reducer: `COMPLETE_MISSION` does not add infamy log when gain = 0.**
- [ ] **Reducer: `START_GAME` produces `state.infamy === 0`.**
- [ ] **UI smoke: StatusScreen shows `☠ 0 — Clean` in faint colour.**
- [ ] **UI smoke: StatusScreen shows red label and consequence text when
  infamy = 10.**
- [ ] **UI smoke: HUD shows `☠ 0` in faint colour when infamy is 0.**
- [ ] **UI smoke: HUD shows `☠ 55` in red when infamy is 55.**

### architecture.md

- [ ] **State shape: document `state.infamy` — permanent accumulation,
  no decay, range 0–999.**
- [ ] **logic.js exports: add `getInfamyLabel`, `canBribe`. Update
  `buildEncounterContext` note to mention infamy check.**
- [ ] **Action reference: update COMPLETE_MISSION to note infamy gain.**
- [ ] **Game Mechanics: add infamy tier table (label, consequence text,
  bribe block threshold).**
- [ ] **Note: P2.8 (bounty hunter spawns) is the next feature reading
  `state.infamy`. No state shape changes needed.**

---

## Cross-Cutting Notes (Final)

**Three axes, three concerns, deliberately separated:**
- **Fame** — what you've accomplished. Opens content. Never decreases.
- **Reputation** — how each port sees you. Governs local service access and
  mission gold multipliers. Decays slowly at sea.
- **Infamy** — what you've done wrong. Closes options (bribe first, more later).
  Never decreases.

Fame and infamy are both visible in the HUD at all times. Reputation is too
granular for HUD — it lives in StatusScreen's faction rows only.

**`meetsRequirement` is not used for infamy.** The bribe block is the one
in-scope infamy gate, and it lives in `buildEncounterContext` via `canBribe()`.
`meetsRequirement` stays focused on fame gating — one concern, one function.
If infamy gating grows (e.g., certain upgrades require infamy below a threshold),
add a sibling `canAccess(state, item)` function at that time rather than
extending `meetsRequirement`.

**`buildEncounterContext` is the right home for infamy effects.** It already
assembles all option availability in one place. Future infamy effects (reduced
flee odds, no parley above a certain infamy) slot in cleanly alongside the
existing reputation and encounter-type checks — no architecture changes needed.

**At War is the reputation-equivalent of high infamy.** Total service denial
(rep) and closed options (infamy) are intentionally parallel pressures. Both
are visible, both are explained in StatusScreen, both have an escape path
(rebuild rep; reduce infamy via future governor mechanic).

**Log entries are the player's conscience.** Every infamy gain, threshold
crossing, service denial, and mission gold modifier must produce a log entry.
The player should always know why something changed without reading a tooltip.

**Retirement (P4.3) reads both tracks.** Fame is the primary score. Infamy
affects epilogue text variants. Do not write epilogues now, but both fields
must be present in state and named consistently so P4.3 can read them without
a state migration.

**`meetsRequirement` is forward-compatible with P3.1.** When unlockable ports
are implemented, their `unlockCondition` schema (`{ type: "fame", value: 100 }`)
maps directly onto what `meetsRequirement` already checks. Extend the function
there — no call site changes needed.