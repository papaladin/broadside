# Tasks: Trade & Smuggling Mission Rework
### N3.1 (Smuggling) · N3.2 (Trade Delivery)

> **Implementing agent:** read this entire document before writing a line.
> All design decisions are locked (see section below).
> Sections marked ⚙ require the agent to confirm a value before coding.
> Both mission types ship in a single session — they share generator,
> UI, and reducer changes. Do not implement one without the other.

---

## Design Decisions (All Locked)

**Trade missions — model:** Galaxy on Fire. The player buys the required goods
themselves at the current port, sails to the target port, sells at the
destination market, and collects a **separate mission bonus** on delivery.
The mission bonus is the fame-forcing incentive — pure trade without a mission
pays only the market spread; trade with a mission pays the spread *plus* a bonus.
The rep multiplier (`perk.missionMult`) applies to the **bonus only**, not to
the sale price.

**Trade mission goods:** Non-illegal, non-provision goods only: rum, sugar,
timber, cloth, spices, silk, coffee, cocoa, weapons. No silver (too volatile),
no tobacco/slaves (those are smuggle goods).

**Trade mission quantity:** Scaled to current ship hold capacity:
`Math.max(3, Math.floor(state.hold.capacity × 0.08))`. A dinghy (20 cap)
demands `max(3, floor(1.6)) = 3` units. A sloop (200) demands 16. A galleon
(1320) demands 105. This scales naturally — bigger ships get bigger contracts.

**Trade mission good availability filter:** Only generate trade missions for
goods that are actually in `state.portMarket.goods` right now. If timber didn't
roll this visit, no timber delivery mission appears. This guarantees the player
can always source the required good at the current port.

**Trade mission failure condition:** Check-at-completion only. No timer, no
mid-voyage fail. At COMPLETE_MISSION, verify `hold.items[good] >= requiredQty`.
If not, refuse completion with a log entry. No automatic fail if the player
sells the goods — they must re-buy before reaching the target. This is
intentionally forgiving — the pressure is hold space, not a countdown.

**Trade mission gold structure:** `missionBonus` (paid at completion, rep-
multiplied) is set so that `marketBuyPrice + missionBonus ≈ 1.4× marketBuyPrice`.
In other words the bonus compensates purchase cost and adds ~40% margin on top
of whatever the destination market pays. This ensures trade missions are always
worth more than uncontracted trade for the same route.

**Smuggling missions — model:** Player must purchase the specified contraband
at the current port (only available if `portMarket.goods[good]` exists). Mission
gold is a fixed delivery payment (not a sale — the contraband is handed off, not
sold on the open market). The player does not receive a separate sale price.

**Smuggling target ports:** Contraband is delivered *to* colonial ports (English,
Spanish, French, Dutch faction ports), not to pirate ports. Pirate ports are
where contraband originates. `pickTargetPort` for smuggle must be rewritten to
target non-pirate, non-rival faction ports specifically.

**Contraband goods in scope:** `tobacco` and `slaves` only (those flagged
`illegal: true` in RESOURCES). No other goods are contextually illegal in
this phase.

**Patrol interception of contraband:** The `navy_patrol` random event now
branches on hold contents. "Allow inspection" path checks `hold.items.tobacco > 0`
OR `hold.items.slaves > 0`. If contraband found: `loseContraband` consequence
fires (existing `L.applyLoseContraband`), +2 infamy, morale penalty, log entry.
If hold is clean: pass as currently. This applies regardless of whether the
player is on a smuggle mission — the hold doesn't know your reasons.

**Patrol interception probability by risk:** Smuggle missions carry a
`patrolRisk` field (`low: 0.15`, `medium: 0.35`, `high: 0.60`). During
ADVANCE_DAY, when `state.activeMission?.type === "smuggle"`, the base random
event chance (currently ~10%) is increased by `patrolRisk`. This replaces the
general event check for smuggle missions only — not additive.

**Smuggling infamy:** `infamyGain` on mission completion stays as-is (1 for
smuggle). Being caught with contraband during a patrol adds +2 infamy separately
(applied in RESOLVE_EVENT navy_patrol outcome). These are independent.

**No hold space reservation:** Accepting a mission does not reserve hold space.
The player may fill their hold and find they can't buy the mission goods — that
is a natural consequence of their choices. The mission board card will show the
required quantity and the player's current hold space to inform the decision.

**Type weights:** Add `trade: 2` to mission type weights alongside existing
types. Keep `smuggle: 2`. Patrol faction remains: `trade` and `patrol` are
unavailable for pirate faction (same rule as patrol). Pirate faction generates
combat, smuggle, assault, escort only.

---

## Part 0 — Data Changes (data.js)

### 0.1 — No new RESOURCES entries needed

`tobacco` and `slaves` already carry `illegal: true`. All non-illegal trade
goods are already in RESOURCES. No data changes required here.

### 0.2 — Add `patrolRisk` field to MISSION_REP_IMPACTS (or keep inline)

`patrolRisk` is generator logic, not static rep data. Keep it inline in the
generator as a local constant — do not add to MISSION_REP_IMPACTS.

### 0.3 — Add trade mission bonus multiplier constant

Add to `data.js` alongside `MISSION_GOLD_RANGES`:

```js
// Trade mission: bonus paid on delivery, on top of whatever the destination
// market pays. Scaled to base purchase cost at origin.
// bonus = Math.round(originBuyPrice × requiredQty × TRADE_MISSION_BONUS_MULT)
// rounded to nearest 25g.
window.D.TRADE_MISSION_BONUS_MULT = 0.40; // 40% of total purchase cost as bonus
```

This is the single tuning knob for trade mission profitability. Do not hardcode
0.40 anywhere in generator or engine — always read from `D.TRADE_MISSION_BONUS_MULT`.

---

## Part 1 — generators.js Changes

### 1.1 — Add `trade` to mission type weight table

In `typeWeightsFor(faction)`, add `trade: 2`:

```js
const typeWeightsFor = (faction) => {
  const isPirate = faction === "pirate";
  return {
    escort:  3,
    patrol:  isPirate ? 0 : 2,
    combat:  2,
    smuggle: 2,
    trade:   isPirate ? 0 : 2,   // ← new
    assault: 1,
  };
};
```

Pirates do not offer trade missions (they offer smuggle instead for their
"delivery" fantasy).

### 1.2 — Rewrite `pickTargetPort` to handle `trade` and `smuggle` correctly

Current: smuggle excludes rival faction ports, which accidentally sends all
smuggle missions to pirate ports. Fix:

```js
const pickTargetPort = (currentPortKey, type, state, faction) => {
  if (type === "combat" || type === "patrol") return null;

  const allPorts = Object.keys(window.D.PORTS);
  let eligible = allPorts.filter(k => k !== currentPortKey);

  if (type === "assault") {
    eligible = eligible.filter(k => window.D.PORTS[k].faction !== faction);

  } else if (type === "smuggle") {
    // Smuggle: deliver TO colonial ports (non-pirate only).
    // The pirate faction is offering payment to get contraband INTO enemy territory.
    eligible = eligible.filter(k => window.D.PORTS[k].faction !== "pirate");

  } else if (type === "trade") {
    // Trade: deliver to non-rival ports (same logic as escort).
    // But also exclude current port's faction ports to force actual travel.
    const rivals = window.D.FACTIONS[faction]?.rivalFactions || [];
    eligible = eligible.filter(k => !rivals.includes(window.D.PORTS[k].faction));

  } else {
    // escort: exclude rival faction ports
    const rivals = window.D.FACTIONS[faction]?.rivalFactions || [];
    eligible = eligible.filter(k => !rivals.includes(window.D.PORTS[k].faction));
  }

  if (eligible.length === 0) return null;
  return pickRandom(eligible);
};
```

### 1.3 — Add `generateTradeMission(portKey, state, faction, risk)` function

This function generates a complete trade mission object. Called from the main
`generateMissions` loop when `type === "trade"`.

```js
const generateTradeMission = (portKey, state, faction, risk) => {
  const portMarket = state.portMarket;
  if (!portMarket) return null;

  // Only goods that are actually available at this port right now
  const tradeGoods = ["rum","sugar","timber","cloth","spices","silk","coffee","cocoa","weapons"];
  const availableGoods = tradeGoods.filter(g => portMarket.goods[g]);
  if (availableGoods.length === 0) return null;

  const good = pickRandom(availableGoods);
  const portGoodData = portMarket.goods[good];
  const requiredQty = Math.max(3, Math.floor((state.hold?.capacity || 200) * 0.08));

  // Mission bonus: 40% of total purchase cost, rounded to 25g
  const totalPurchaseCost = portGoodData.buyFromPort * requiredQty;
  const missionBonus = Math.round(totalPurchaseCost * window.D.TRADE_MISSION_BONUS_MULT / 25) * 25;

  const targetPort = pickTargetPort(portKey, "trade", state, faction);
  if (!targetPort) return null;

  const targetPortName = window.D.PORTS[targetPort]?.name || "unknown port";
  const goodName = window.D.RESOURCES[good]?.name || good;
  const goodUnit = window.D.RESOURCES[good]?.unit || good;
  const factionAdj = pickRandom(window.D.MISSION_NAME_PARTS.factionAdj[faction] || ["Foreign"]);

  const fame = risk === "high" ? 2 : 1;
  const repImpact = generateRepImpact("trade", faction, risk, null);

  return {
    type: "trade",
    name: `Deliver ${goodName} to ${targetPortName}`,
    description: `The ${factionAdj} factor needs ${requiredQty} ${goodUnit} of ${goodName} delivered to ${targetPortName}. Source the goods here and deliver personally. A bonus awaits on arrival.`,
    faction,
    targetPort,
    risk,
    gold: missionBonus,         // bonus only — paid on delivery in addition to sale
    fame,
    infamyGain: 0,
    repImpact,
    enemy: null,
    requiredGood: good,         // new field
    requiredQty,                // new field
    missionBonus,               // explicit bonus field (same as gold, for clarity)
  };
};
```

### 1.4 — Add `generateSmugglingMission(portKey, state, risk)` function

```js
const generateSmugglingMission = (portKey, state, risk) => {
  const portMarket = state.portMarket;
  if (!portMarket) return null;

  // Only generate if contraband is available at this port right now
  const contrabandGoods = ["tobacco", "slaves"];
  const availableContraband = contrabandGoods.filter(g => portMarket.goods[g]);
  if (availableContraband.length === 0) return null;

  const good = pickRandom(availableContraband);
  const portGoodData = portMarket.goods[good];
  const requiredQty = Math.max(2, Math.floor((state.hold?.capacity || 200) * 0.06));

  const targetPort = pickTargetPort(portKey, "smuggle", state, "pirate");
  if (!targetPort) return null;

  const targetPortName = window.D.PORTS[targetPort]?.name || "unknown port";
  const goodName = window.D.RESOURCES[good]?.name || good;
  const goodUnit = window.D.RESOURCES[good]?.unit || good;

  // Gold: covers purchase cost + significant risk premium
  const totalPurchaseCost = portGoodData.buyFromPort * requiredQty;
  const riskMultiplier = { low: 1.8, medium: 2.4, high: 3.2 }[risk] || 2.0;
  const gold = Math.round(totalPurchaseCost * riskMultiplier / 25) * 25;

  // Patrol risk during voyage
  const patrolRisk = { low: 0.15, medium: 0.35, high: 0.60 }[risk] || 0.20;

  const infamyGain = good === "slaves" ? 2 : 1;
  const fame = risk === "high" ? 2 : 1;

  return {
    type: "smuggle",
    name: `Smuggle ${goodName} to ${targetPortName}`,
    description: `Get ${requiredQty} ${goodUnit} of ${goodName} past the patrols to ${targetPortName}. Source them here. No inspection, no questions, no official record. Risk: ${risk}.`,
    faction: "pirate",
    targetPort,
    risk,
    gold,                       // full delivery payment (no separate sale)
    fame,
    infamyGain,
    repImpact: { pirate: window.D.MISSION_REP_IMPACTS.smuggle.any },
    enemy: generateEnemy(risk, state.fame ?? 0, "pirate"),
    requiredGood: good,         // new field
    requiredQty,                // new field
    patrolRisk,                 // new field — used by ADVANCE_DAY intercept logic
  };
};
```

### 1.5 — Update main `generateMissions` loop to call new generators

In the `for` loop inside `generateMissions`, after `type` is determined:

```js
// Replace the existing mission object construction with type-branched calls
let missionObj = null;

if (type === "trade") {
  missionObj = generateTradeMission(portKey, state, missionFaction, risk);
} else if (type === "smuggle") {
  missionObj = generateSmugglingMission(portKey, state, risk);
} else {
  // existing construction for escort, patrol, combat, assault
  // ... (unchanged)
  missionObj = {
    type, name, description: desc, faction: missionFaction,
    targetPort: targetPort || null,
    risk, gold, fame, infamyGain, repImpact, enemy,
  };
}

// If generator returned null (e.g. no available goods), skip this slot
if (!missionObj) continue;
missions.push(missionObj);
```

⚙ **Agent note:** When a type returns `null` (no available goods for trade or
smuggle), the loop `continue`s without pushing. This means the board might
return only 1 mission instead of 2–3 if both trade/smuggle slots fail. Add a
fallback: if `missions.length < 2` after the loop, generate one escort mission
to fill the gap.

### 1.6 — Add `generateRepImpact` support for `trade` type

In `generateRepImpact`, add:

```js
if (type === "trade") {
  const positiveDelta = impacts.escort?.[risk] ?? 2; // trade has same impact as escort
  impact[commissioningFaction] = positiveDelta;
  return impact;
}
```

Trade missions give the same rep impact as escort — they are legitimate commerce
for the faction. No negative impact on other factions.

### 1.7 — Update `generateMissionText` for `trade` type

Add a case to the switch in `generateMissionText`:

```js
case "trade":
  // The trade generator already builds name and desc — this case handles
  // fallback only if called directly. In practice, generateTradeMission
  // builds its own strings.
  name = `Deliver goods to ${portName}`;
  desc = `A ${factionAdj} merchant needs cargo delivered to ${portName}.`;
  break;
```

---

## Part 2 — engine.js Changes

### 2.1 — Update `COMPLETE_MISSION` to handle trade and smuggle cargo checks

Before computing gold, add a cargo validation block:

```js
case A.COMPLETE_MISSION: {
  const mission = state.activeMission;
  if (!mission) return state;
  if (mission.targetPort && state.currentPort !== mission.targetPort) {
    return { ...state };
  }

  // ── Cargo check for trade and smuggle missions ────────────────
  if (mission.requiredGood && mission.requiredQty) {
    const inHold = state.hold?.items?.[mission.requiredGood] || 0;
    if (inHold < mission.requiredQty) {
      const goodName = window.D.RESOURCES[mission.requiredGood]?.name || mission.requiredGood;
      return {
        ...state,
        log: [...state.log,
          `Cannot complete ${mission.name}: requires ${mission.requiredQty} ${goodName} in hold. You have ${inHold}.`
        ]
      };
    }
  }

  // ── Trade mission: remove goods from hold, grant sale price + bonus ──
  let holdItems = { ...(state.hold?.items || {}) };
  let saleRevenue = 0;

  if (mission.type === "trade" && mission.requiredGood) {
    holdItems[mission.requiredGood] = (holdItems[mission.requiredGood] || 0) - mission.requiredQty;

    // Sale at destination market price (what the port would pay, or base if no market)
    const destMarket = state.portMarket?.goods?.[mission.requiredGood];
    const salePrice = destMarket?.sellToPort
      ?? window.D.RESOURCES[mission.requiredGood]?.basePrice
      ?? 0;
    saleRevenue = salePrice * mission.requiredQty;
  }

  // ── Smuggle mission: remove goods from hold, no sale (delivery payment only) ──
  if (mission.type === "smuggle" && mission.requiredGood) {
    holdItems[mission.requiredGood] = (holdItems[mission.requiredGood] || 0) - mission.requiredQty;
  }

  // ── Existing gold/fame/rep logic ──────────────────────────────
  const rep = state.reputation[state.currentPort] ?? 50;
  const perk = L.getRepPerk(rep);

  // For trade: apply missionMult to bonus only; add sale revenue flat
  // For all others: apply missionMult to full mission.gold as before
  let finalGold;
  let bonusNote;
  if (mission.type === "trade") {
    const finalBonus = Math.floor(mission.missionBonus * perk.missionMult);
    const bonusDelta = finalBonus - mission.missionBonus;
    finalGold = saleRevenue + finalBonus;
    bonusNote = saleRevenue > 0
      ? ` (sold ${mission.requiredGood} for ${saleRevenue}g + ${finalBonus}g delivery bonus)`
      : ` (+${finalBonus}g delivery bonus)`;
    if (bonusDelta !== 0) bonusNote += ` (${bonusDelta > 0 ? '+' : ''}${bonusDelta}g ${perk.tier})`;
  } else {
    const baseGold = mission.gold;
    finalGold = Math.floor(baseGold * perk.missionMult);
    const goldDelta = finalGold - baseGold;
    bonusNote = goldDelta > 0 ? ` (+${goldDelta}g ${perk.tier} bonus)`
              : goldDelta < 0 ? ` (${Math.abs(goldDelta)}g ${perk.tier} penalty)` : "";
  }

  // Infamy, rep, log (unchanged from existing)
  const newRep = L.applyReputationImpact(state, mission.repImpact);
  const infamyGain = mission.infamyGain || 0;
  const oldInfamy = state.infamy ?? 0;
  const newInfamy = Math.min(999, oldInfamy + infamyGain);
  const crossedThreshold = L.getInfamyLabel(newInfamy) !== L.getInfamyLabel(oldInfamy);

  const newLog = [
    ...state.log,
    `Completed: ${mission.name}. +${finalGold}g${bonusNote}, +${mission.fame} fame.`
  ];
  if (infamyGain > 0) newLog.push(`+${infamyGain} infamy.`);
  if (crossedThreshold) newLog.push(`Your name grows darker. You are now ${L.getInfamyLabel(newInfamy)}.`);

  return {
    ...state,
    gold: state.gold + finalGold,
    fame: state.fame + mission.fame,
    infamy: newInfamy,
    reputation: newRep,
    activeMission: null,
    hold: { ...state.hold, items: holdItems },
    missions: G.generateMissions(state.currentPort, { ...state, activeMission: null }),
    log: newLog,
  };
}
```

### 2.2 — Update `ADVANCE_DAY` to apply smuggle patrol risk

In ADVANCE_DAY, in the random event check section, add before the general
event roll:

```js
// ── Smuggle mission patrol risk ───────────────────────────────
// When on a smuggle mission, override the event probability
// with the mission's patrolRisk field (instead of the default ~10%)
const activeMission = state.activeMission;
const isSmuggling = activeMission?.type === "smuggle";
const eventChance = isSmuggling
  ? (activeMission.patrolRisk || 0.20)
  : 0.10; // default 10% chance

// Force navy_patrol event when smuggling and intercept triggers
if (isSmuggling && Math.random() < eventChance) {
  const navyPatrol = window.D.RANDOM_EVENTS.find(e => e.id === "navy_patrol");
  if (navyPatrol) {
    // Override: fire navy_patrol specifically (not a random event)
    return { ...newState, activeEvent: navyPatrol, screen: "event" };
  }
}
// Otherwise: proceed with normal random event check (unchanged)
```

⚙ **Agent note:** The `newState` reference here should be the state after all
other ADVANCE_DAY processing (wages, provisions, wind, etc.) — the event fires
at the end of the day's processing. Ensure this is placed after the existing
daily calculations, not before.

### 2.3 — Update `RESOLVE_EVENT` to handle contraband inspection

In `RESOLVE_EVENT`, when the event is `navy_patrol` and the choice is
"Allow inspection" (index 0), add contraband detection:

```js
case A.RESOLVE_EVENT: {
  const { choice } = action;
  const event = state.activeEvent;
  // ... existing outcome processing ...

  // Special handling for navy_patrol inspection
  if (event?.id === "navy_patrol" && action.choiceIndex === 0) {
    const hasContraband = (state.hold?.items?.tobacco || 0) > 0
                       || (state.hold?.items?.slaves  || 0) > 0;

    if (hasContraband) {
      const newHoldItems = L.applyLoseContraband(state.hold?.items || {});
      const contrabandInfamy = 2;
      const newInfamy = Math.min(999, (state.infamy ?? 0) + contrabandInfamy);
      return {
        ...state,
        activeEvent: null,
        screen: "sailing",
        hold: { ...state.hold, items: newHoldItems },
        infamy: newInfamy,
        crew: { ...state.crew, morale: Math.max(0, state.crew.morale - 10) },
        log: [
          ...state.log,
          "The patrol found contraband in your hold. The goods were seized.",
          `+${contrabandInfamy} infamy — your name is on their list.`,
          "The crew's morale drops. This was not the plan."
        ]
      };
    }
    // No contraband: fall through to normal outcome (existing logic)
  }

  // ... rest of existing RESOLVE_EVENT logic unchanged ...
}
```

---

## Part 3 — screens_port.jsx: Mission Card UI

### 3.1 — Update mission card in PortScreen to show cargo requirements

The existing mission card renders: name, description, risk, gold, fame.
For `trade` and `smuggle` missions, add a requirements block below the
description:

```jsx
{/* Cargo requirement (trade and smuggle only) */}
{(mission.requiredGood && mission.requiredQty) && (() => {
  const res = D.RESOURCES[mission.requiredGood];
  const inHold = state.hold?.items?.[mission.requiredGood] || 0;
  const portHas = state.portMarket?.goods?.[mission.requiredGood];
  const canSource = portHas && portHas.available >= mission.requiredQty;
  const alreadyHave = inHold >= mission.requiredQty;
  const isIllegal = res?.illegal;

  return (
    <div style={{
      marginTop: 6,
      padding: "4px 8px",
      background: T.bgDeep,
      borderRadius: 3,
      border: `1px solid ${isIllegal ? T.red + '60' : T.border}`,
    }}>
      <div style={{ fontSize: 10, color: T.textDim }}>
        {mission.type === "smuggle" ? "⚠ Contraband required:" : "Cargo required:"}
      </div>
      <div style={{ fontSize: 11, color: isIllegal ? T.red : T.text }}>
        {mission.requiredQty} × {res?.name || mission.requiredGood}
        {isIllegal && <span style={{ color: T.red }}> (Illegal)</span>}
      </div>
      <div style={{ fontSize: 10, marginTop: 2 }}>
        {alreadyHave
          ? <span style={{ color: T.greenBr }}>✓ In hold ({inHold})</span>
          : canSource
            ? <span style={{ color: T.gold }}>Available at market — {portHas.buyFromPort}g each</span>
            : <span style={{ color: T.redBr }}>Not available here this visit</span>
        }
      </div>
      {mission.type === "trade" && portHas && (
        <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2 }}>
          Est. purchase: {portHas.buyFromPort * mission.requiredQty}g
          · Bonus on delivery: +{mission.missionBonus}g
        </div>
      )}
      {/* Hold space check */}
      {!alreadyHave && (() => {
        const freeSpace = (state.hold?.capacity || 0) - L.getHoldUsed(state.hold?.items || {});
        if (freeSpace < mission.requiredQty) return (
          <div style={{ fontSize: 10, color: T.redBr }}>
            ⚠ Only {freeSpace} hold space free
          </div>
        );
      })()}
    </div>
  );
})()}
```

### 3.2 — No change to TAKE_MISSION dispatch

`TAKE_MISSION` still dispatches `{ type: A.TAKE_MISSION, mission: missionObject }`.
The full mission object (including `requiredGood`, `requiredQty`, `patrolRisk`)
is already in `action.mission` — no structural change needed.

### 3.3 — Update COMPLETE_MISSION button in SailingScreen or PortScreen

When the player arrives at the target port with an active trade/smuggle mission,
the "Complete Mission" button should show a verification state. Add below the
button when `activeMission.requiredGood` is set:

```jsx
{activeMission?.requiredGood && (() => {
  const inHold = state.hold?.items?.[activeMission.requiredGood] || 0;
  const satisfied = inHold >= activeMission.requiredQty;
  const goodName = D.RESOURCES[activeMission.requiredGood]?.name || activeMission.requiredGood;
  return (
    <div style={{ fontSize: 10, color: satisfied ? T.greenBr : T.redBr, marginTop: 4 }}>
      {satisfied
        ? `✓ ${inHold} ${goodName} in hold (${activeMission.requiredQty} required)`
        : `✗ ${inHold}/${activeMission.requiredQty} ${goodName} in hold — visit market`
      }
    </div>
  );
})()}
```

---

## Part 4 — logic.js: No new functions required

All required functions already exist:
- `L.applyLoseContraband` — used in patrol seizure
- `L.getHoldUsed` — used for hold space display in mission card
- `L.getRepPerk` — used in COMPLETE_MISSION bonus multiplier
- `L.applyReputationImpact` — unchanged

No additions to `window.L` needed for this feature.

---

## Part 5 — Tests (tests_engine.js and tests_logic.js)

### Generator tests (add to G.* suite in tests_logic.js)

- [ ] `G.generateMissions` includes at least one `trade` or `smuggle` mission
  in a 20-call sample (probability check — run 20 times, assert at least one).
- [ ] Trade mission object has `requiredGood`, `requiredQty`, `missionBonus` fields.
- [ ] `requiredGood` on a trade mission is one of the non-illegal trade goods.
- [ ] Trade mission `requiredGood` is always present in `state.portMarket.goods`.
- [ ] Smuggle mission `requiredGood` is always `tobacco` or `slaves`.
- [ ] Smuggle mission `patrolRisk` is between 0.10 and 0.70.
- [ ] Smuggle mission `targetPort` is never a pirate faction port.
- [ ] Trade mission `gold` equals `missionBonus` (bonus only, not including sale).
- [ ] `generateMissions` returns at least 1 mission even if all trade/smuggle
  slots fail (fallback escort generated).

### Reducer tests (add to tests_engine.js)

- [ ] `COMPLETE_MISSION` on trade mission without required goods in hold
  fails with log entry and does not change gold or hold.
- [ ] `COMPLETE_MISSION` on trade mission with required goods: removes goods
  from hold, adds sale revenue + mission bonus to gold.
- [ ] `COMPLETE_MISSION` on trade mission: rep multiplier applies to bonus only
  (not to sale revenue). Test at Allied rep (×1.20): `finalGold = saleRevenue + Math.floor(missionBonus × 1.20)`.
- [ ] `COMPLETE_MISSION` on smuggle mission without required goods fails.
- [ ] `COMPLETE_MISSION` on smuggle mission: removes goods from hold, adds
  full mission gold.
- [ ] `COMPLETE_MISSION` on smuggle mission adds correct `infamyGain`.
- [ ] `RESOLVE_EVENT` navy_patrol with tobacco in hold: contraband seized,
  +2 infamy, morale −10.
- [ ] `RESOLVE_EVENT` navy_patrol with clean hold: no cargo change, no infamy.
- [ ] `RESOLVE_EVENT` navy_patrol refusal ("Refuse inspection"): triggers
  encounter as existing logic (unchanged).

### UI smoke tests (add to tests_ui.js)

- [ ] PortScreen mission card shows "Cargo required" block for trade mission.
- [ ] PortScreen mission card shows "Contraband required" with red styling for
  smuggle mission.
- [ ] Mission card shows "Available at market" when good is in `portMarket`.
- [ ] Mission card shows hold space warning when free space < requiredQty.
- [ ] Complete Mission button area shows cargo satisfaction indicator when
  `activeMission.requiredGood` is set.

---

## Part 6 — architecture.md Updates

- [ ] **Mission object shape:** add `requiredGood?: string`, `requiredQty?: number`,
  `missionBonus?: number`, `patrolRisk?: number` as optional fields present only
  on `trade` and `smuggle` types.
- [ ] **generators.js exports:** add `generateTradeMission`,
  `generateSmugglingMission` (note: called internally, not exported — document as
  internal).
- [ ] **COMPLETE_MISSION:** document the two-path gold calculation (trade vs.
  all others) and the cargo removal step.
- [ ] **ADVANCE_DAY:** document the `patrolRisk`-based navy_patrol override
  for active smuggle missions.
- [ ] **RESOLVE_EVENT:** document the contraband branch on navy_patrol inspection.
- [ ] **data.js constants:** document `TRADE_MISSION_BONUS_MULT`.

---

## Appendix: Mission Flow Comparison

### Trade mission — full player journey
```
Port A (e.g. Port Royal)
  → Mission board shows: "Deliver 16 Rum to Martinique — +400g bonus"
  → Card shows: "Available at market — 33g each. Est. purchase: 528g. Bonus: +400g"
  → Player accepts mission
  → Player goes to market, buys 16 rum (528g)
  → Player sails to Martinique (4 days, ~336g in wages+provisions)
  → Arrives, hits Complete Mission
  → Hold checked: 16 rum ✓
  → 16 rum removed from hold
  → Martinique sells rum at 27g each = 432g sale revenue
  → Bonus: 400g × 1.10 (Friendly rep) = 440g
  → Total received: 872g
  → Net: 872g − 528g purchase − 336g voyage = +8g profit
```
At neutral rep that's: 432 + 400 − 528 − 336 = −32g (slight loss but +1 fame).
At allied rep: 432 + 480 − 528 − 336 = +48g.
The player is working **for the fame**, not the gold. The gold breaks even.
This is the intended design — trade missions are fame vehicles for merchant players.

### Smuggle mission — full player journey
```
Tortuga (pirate port)
  → Mission board shows: "Smuggle Tobacco to Port Royal — 720g"
  → Card shows: "⚠ Contraband required: 8 × Tobacco (Illegal). Available at market — 81g each."
  → Player accepts mission
  → Player buys 8 tobacco (648g) — +0 infamy on purchase (tobacco has infamyOnBuy: 0)
  → Player sails to Port Royal (patrolRisk: 0.35 at medium risk)
  → On each sailing day: 35% chance navy_patrol fires instead of normal 10% event
  → If patrol fires and player allows inspection: tobacco seized, +2 infamy, morale −10, mission fails
  → If patrol fires and player refuses: combat with navy patrol
  → If player arrives undetected: completes mission
  → 8 tobacco removed from hold
  → +720g, +1 infamy, +1 fame, +2 pirate rep
  → Net: 720g − 648g purchase − ~252g voyage (3 days on sloop) = −180g
```
Smuggling is intentionally not profitable in pure gold — the reward is fame,
pirate rep, and the thrill of the run. The player who specialises in smuggling
is making an identity choice, not an optimal economic choice.
This preserves the design philosophy: infamy is earned through choices, not
through being the most profitable path.