# Tasks: Trade & Smuggling Mission Rework
### N3.1 (Trade Delivery) · N3.2 (Smuggling)

> **Implementing agent:** read this entire document before writing a line.
> All design decisions are locked (section below).
> Implement trade missions fully and verify them before starting smuggle.
> Smuggle reuses the same card, generator pattern, and completion flow —
> build trade first so smuggle has a clean foundation to extend.

---

## Design Decisions (All Locked)

### Trade Missions

**Sourcing model:** The mission appears on the board regardless of whether the
current port stocks the required good. The player must source the goods
themselves — at the current port if available, or by sailing elsewhere first.
This can create a 2-stop journey: buy at port A, deliver to port C, collect reward.
Goods already in hold count toward the requirement immediately.

**Completion model:** The player arrives at the target port. The "Complete
Mission" button is only clickable if `hold.items[requiredGood] >= requiredQty`.
If not satisfied, the button is greyed with a tooltip explaining what's missing.
Clicking Complete removes exactly `requiredQty` units from hold and pays the
full mission gold. No market transaction on completion — the port pays directly.
If the player sold the goods before arrival: button stays greyed. No penalty,
no fail — they simply re-source and return. This is intentionally forgiving.

**Gold structure:** A single fixed gold amount that substantially compensates
the player. Formula (generated at mission creation):
`gold = Math.round(expectedPurchaseCost × (1 + profitMargin) / 25) * 25`
where `expectedPurchaseCost = good.basePrice × requiredQty` and
`profitMargin` is 0.60 at low risk, 0.80 at medium, 1.10 at high.
This means: buy at base price, deliver, collect 60–110% profit over your
purchase cost regardless of market variance. The player's actual profit
depends on how cheaply they source the goods.

**No rep multiplier on trade missions.** `perk.missionMult` is not applied.
Trade gold is fixed and substantial — adding a rep modifier on top would
over-reward Allied players and further punish Hostile players who already
have fewer reasons to do honest trade.

**Fame:** Same as other mission types — low/medium=1, high=2. Big cargo =
big trade = meaningful fame. Trade missions are the merchant player's primary
fame vehicle.

**Eligible goods:** All non-illegal goods except food, water, and silver.
Silver is excluded because its 50% variance makes expected purchase cost
calculation unreliable. Full eligible list: rum, sugar, timber, cloth, spices,
silk, coffee, cocoa, weapons.

**Quantity scaling:** Determined by risk level as a percentage of current
hold capacity, then cross-referenced against fame tier to select which goods
are requested (higher fame = more valuable goods requested).

| Risk | Hold % | Example on sloop (200 cap) | Example on frigate (720 cap) |
|------|--------|---------------------------|------------------------------|
| low | 10% | 20 units | 72 units |
| medium | 25% | 50 units | 180 units |
| high | 50% | 100 units | 360 units |

**Good selection by fame tier:**

| Fame tier | Eligible goods for trade missions |
|-----------|----------------------------------|
| 0 (Unknown) | rum, sugar, timber, cloth |
| 1 (Recognised) | rum, sugar, timber, cloth, coffee, cocoa |
| 2 (Notorious) | coffee, cocoa, cloth, weapons, spices |
| 3+ (Legendary+) | spices, silk, weapons, cocoa |

Higher tiers get more valuable goods. This scales gold naturally — silk at
160g base × 50% of a galleon hold = large contracts for high-fame players.

**Target port:** Any non-rival port. No restriction beyond that — the
player can be sent anywhere, including ports far away. Distance creates
the risk/reward tension without a timer.

**Type weight:** 3 (same as escort). Trade missions are a primary offering
for legitimate-faction boards.

---

### Smuggling Missions

**Eligible goods:** `tobacco` (illegal, non-infamy on buy), `slaves`
(illegal, +1 infamy on buy), and `rum` (contextually illegal — rum
smuggling was a real Caribbean trade). Rum gets a `smuggleOnly: true`
flag in its RESOURCES entry for this context — it is not flagged `illegal`
globally (still buyable normally in markets), but when it appears as a
smuggling mission cargo, it is treated as contraband during that voyage.

**Sourcing model:** Same as trade — player must buy the goods themselves.
The mission appears on the board regardless of current market availability.
The card tells the player where the good can be sourced (based on
GOODS_AVAILABILITY tier — "commonly found in pirate ports" etc.).

**Completion model:** Same check-at-completion as trade. Goods removed
from hold on completion. Gold paid as the delivery fee.

**Gold structure:** Higher than equivalent trade — the risk premium is
built into the gold:
`gold = Math.round(expectedPurchaseCost × (1 + smuggleMargin) / 25) * 25`
where `smuggleMargin` = 1.20 at low, 1.80 at medium, 2.60 at high.
Smuggling should feel lucrative *when it works*. The player earns 2–3×
their purchase cost, but the patrol risk means they may never collect.

**Quantity scaling:** Fame tier × risk × infamy weighting:

| Risk | Hold % | Infamy modifier |
|------|--------|----------------|
| low | 8% | none |
| medium | 18% | if infamy ≥ 25: can roll slaves more often |
| high | 35% | if infamy ≥ 50: slave missions more frequent, quantities higher |

Good selection by fame + infamy:
- Fame 0–49: rum, tobacco only
- Fame 50–99: rum, tobacco, small slave quantities
- Fame 100+: all three including large slave contracts
- Infamy ≥ 25: slave missions appear in pool at medium+ risk
- Infamy ≥ 50: slave quantities at high risk scale up (×1.5 multiplier)

This means: low-infamy players rarely see slave missions. High-infamy
players attract them. Their history defines what the network offers them.

**Patrol encounter during voyage:** Fires instead of the normal random
event check when `activeMission?.type === "smuggle"` AND
`hold.items[requiredGood] > 0`. If the player has not yet sourced the
goods (hold is empty), no increased patrol risk applies. The risk
is in carrying the goods, not in accepting the mission.

| Mission risk | patrolRisk per day |
|-------------|-------------------|
| low | 0.12 |
| medium | 0.30 |
| high | 0.55 |

**Patrol catch consequences (applies to ALL contraband holds, mission or not):**
1. Contraband goods seized (`L.applyLoseContraband`)
2. Fine paid: `fine = seizureValue × 0.5` (half the base value of seized goods)
3. Rep penalty: −5 with the inspecting faction's ports
4. +2 infamy (for being officially caught — this is a public record)
5. Morale −10
6. Log entries for all of the above

If the player cannot pay the fine: gold goes to 0 (no debt mechanic yet).

**Fighting a patrol costs infamy regardless of outcome.** When the player
refuses inspection and the encounter resolves as combat (win, lose, or flee),
+3 infamy is applied in DISMISS_BATTLE or INTERCEPT_FLEE. Attacking a crown
vessel is a public, recorded act. This means a player who routinely fights
patrols instead of surrendering accumulates infamy fast, progressively closing
options and escalating future patrol difficulty. The "just kill the patrol"
strategy is not free — it is a long-term identity choice.

Note: patrol strength scaling by infamy (stronger escorts for more wanted
players) is a roadmap item deferred to Phase 2 encounter rework. Flag in
architecture.md as a known future dependency.

**Infamy rules:**
- Buying tobacco: 0 infamy (legal good being smuggled contextually)
- Buying rum for smuggle: 0 infamy on purchase (rum is legal)
- Buying slaves: +1 infamy on purchase (existing `infamyOnBuy: 1`)
- Being caught with any contraband: +2 infamy (existing or on a mission)
- Completing a smuggle mission: existing `infamyGain` per mission (1 or 2)
These are independent and stack.

**Reputation impact on completion:**
- +rep with pirate faction
- −rep with the target port's faction (they know contraband came in)
This replaces the current "always pirate only" impact. The receiving
faction takes a rep hit because you are undermining their port authority.

**Target port:** Anywhere — no faction restriction. Smuggling is
geographically agnostic. The rep impact is on the receiving faction,
not on route eligibility.

**Type weight:** 1. Smuggle missions are rare by design — they are high-
commitment events. A player who only smuggles is a specialist, not the
default experience.

**Rum as smuggle good — special handling:** Rum appears in the normal
market. A smuggle mission for rum means the port is asking for rum that
bypasses customs (untaxed, undeclared). The player buys rum normally,
but during the voyage the `activeMission` marks them as smuggling rum.
The patrol check looks at `hold.items.rum > 0` only when
`activeMission.requiredGood === "rum"` — not at all other times.
This prevents penalising players who legitimately carry rum without a
smuggle mission.

---

### Market Screen — Black Market Section

The MarketScreen gains a visual split: a standard goods section and a
"Black Market" section at the bottom, separated by a styled divider.

The Black Market section shows:
- Tobacco (when available) — with "(Illegal)" label in red
- Slaves (when available) — with "(Illegal)" label in red, infamy warning
- Rum always shows in the standard section (it is a legal good)

No mechanical difference between the two sections — it is purely visual
organisation. Buying from the Black Market section uses the same
CONFIRM_TRADE action. The visual separation is for clarity and immersion.

---

## Part 0 — Data Changes (data.js)

### 0.1 — Add `TRADE_MISSION_BONUS_MULT` by risk

```js
window.D.TRADE_MISSION_PROFIT_MARGINS = {
  low:    0.60,
  medium: 0.80,
  high:   1.10,
};

// Was: low:1.20, medium:1.80, high:2.60
// Rationale: original values assumed cargo loss as the balancing factor.
// A combat-capable player faces near-zero loss risk, making those values
// gamebreaking. New values assume successful evasion as the baseline —
// the risk premium is moderate, not catastrophic.
window.D.SMUGGLE_PROFIT_MARGINS = {
  low:    0.30,   // 30% profit over purchase cost
  medium: 0.60,   // 60% profit over purchase cost
  high:   1.00,   // 100% profit (double your money) — for high infamy, high risk runs
};
```

These are the single tuning knobs. Never hardcode these values in generators.js.

### 0.2 — Add `TRADE_GOODS_BY_TIER` lookup

```js
window.D.TRADE_GOODS_BY_TIER = {
  0: ["rum", "sugar", "timber", "cloth"],
  1: ["rum", "sugar", "timber", "cloth", "coffee", "cocoa"],
  2: ["coffee", "cocoa", "cloth", "weapons", "spices"],
  3: ["spices", "silk", "weapons", "cocoa"],
  4: ["spices", "silk", "weapons", "cocoa"],
};
```

### 0.3 — Add `SMUGGLE_GOODS_BY_TIER` lookup

```js
window.D.SMUGGLE_GOODS_BY_TIER = {
  0: ["rum", "tobacco"],
  1: ["rum", "tobacco"],
  2: ["rum", "tobacco", "slaves"],  // slaves unlocks at tier 2
  3: ["rum", "tobacco", "slaves"],
  4: ["rum", "tobacco", "slaves"],
};
```

### 0.4 — Add `smuggleOnly` hint to rum RESOURCES entry

```js
rum: {
  name: "Rum", basePrice: 30, variance: 0.20, illegal: false,
  infamyOnBuy: 0, unit: "cask",
  smuggleHint: "Commonly found in pirate ports and French islands.",
},
```

`smuggleOnly` is not added — rum remains a legal market good.
`smuggleHint` is a display string used on the mission card only when rum
appears as a smuggle mission cargo. Other goods do not need this field.
Add similar `smuggleHint` to tobacco and slaves for their mission cards.

### 0.5 — Add `sourceHint` to illegal RESOURCES entries

```js
tobacco: {
  ...,
  sourceHint: "Found in Havana, Tortuga, Providencia, and Nassau.",
},
slaves: {
  ...,
  sourceHint: "Available in Portobelo, Cartagena, Libertalia, and Veracruz.",
},
```

These strings appear on the smuggle mission card to help the player
know where to source goods without opening the market at every port.

---

## Part 1 — generators.js Changes

### 1.1 — Update type weights

```js
const typeWeightsFor = (faction) => {
  const isPirate = faction === "pirate";
  return {
    escort:  3,
    patrol:  isPirate ? 0 : 2,
    combat:  2,
    smuggle: 1,            // rare — high commitment
    trade:   isPirate ? 0 : 3,  // pirates don't offer legit trade
    assault: 1,
  };
};
```

### 1.2 — Rewrite `pickTargetPort` for trade and smuggle

```js
const pickTargetPort = (currentPortKey, type, state, faction) => {
  if (type === "combat" || type === "patrol") return null;

  const allPorts = Object.keys(window.D.PORTS);
  let eligible = allPorts.filter(k => k !== currentPortKey);

  if (type === "assault") {
    eligible = eligible.filter(k => window.D.PORTS[k].faction !== faction);

  } else if (type === "smuggle") {
    // Smuggle: anywhere. No faction restriction.
    // eligible is already all ports except currentPort.

  } else {
    // trade, escort: exclude rival faction ports
    const rivals = window.D.FACTIONS[faction]?.rivalFactions || [];
    eligible = eligible.filter(k => !rivals.includes(window.D.PORTS[k].faction));
  }

  if (eligible.length === 0) return null;
  return pickRandom(eligible);
};
```

### 1.3 — Add `generateTradeMission(portKey, state, faction, risk)` function

```js
const generateTradeMission = (portKey, state, faction, risk) => {
  const tier = window.L.getFameTier(state.fame ?? 0);
  const eligibleGoods = window.D.TRADE_GOODS_BY_TIER[tier] || window.D.TRADE_GOODS_BY_TIER[0];

  const good = pickRandom(eligibleGoods);
  const res = window.D.RESOURCES[good];
  if (!res) return null;

  // Quantity: % of current hold capacity by risk
  const holdCapacity = state.hold?.capacity || 200;
  const holdPct = { low: 0.10, medium: 0.25, high: 0.50 }[risk] || 0.10;
  const requiredQty = Math.max(3, Math.round(holdCapacity * holdPct));

  // Gold: base price × qty × (1 + profitMargin), rounded to 25g
  const margin = window.D.TRADE_MISSION_PROFIT_MARGINS[risk] || 0.60;
  const expectedCost = res.basePrice * requiredQty;
  const gold = Math.round(expectedCost * (1 + margin) / 25) * 25;

  const targetPort = pickTargetPort(portKey, "trade", state, faction);
  if (!targetPort) return null;

  const targetPortName = window.D.PORTS[targetPort]?.name || "unknown port";
  const factionAdj = pickRandom(window.D.MISSION_NAME_PARTS.factionAdj[faction] || ["Foreign"]);
  const fame = risk === "high" ? 2 : 1;
  const repImpact = { [faction]: window.D.MISSION_REP_IMPACTS.escort?.[risk] ?? 2 };

  return {
    type: "trade",
    name: `Deliver ${res.name} to ${targetPortName}`,
    description: `The ${factionAdj} factor requires ${requiredQty} ${res.unit} of ${res.name} at ${targetPortName}. Source the goods yourself and deliver — you will be paid in full on arrival.`,
    faction,
    targetPort,
    risk,
    gold,              // full payment: purchase compensation + profit
    fame,
    infamyGain: 0,
    repImpact,
    enemy: null,
    requiredGood: good,
    requiredQty,
  };
};
```

### 1.4 — Add `generateSmuggleMission(portKey, state, risk)` function

```js
const generateSmuggleMission = (portKey, state, risk) => {
  const tier = window.L.getFameTier(state.fame ?? 0);
  const infamy = state.infamy ?? 0;

  // Good pool by tier + infamy gating
  let eligibleGoods = window.D.SMUGGLE_GOODS_BY_TIER[tier] || ["rum", "tobacco"];
  // Slaves only appear at medium+ risk and infamy >= 25
  if (risk === "low" || infamy < 25) {
    eligibleGoods = eligibleGoods.filter(g => g !== "slaves");
  }
  if (eligibleGoods.length === 0) eligibleGoods = ["tobacco"];

  // Infamy weighting: high infamy increases slave probability
  let good;
  if (eligibleGoods.includes("slaves") && infamy >= 50 && Math.random() < 0.50) {
    good = "slaves"; // 50% chance of slave mission at high infamy
  } else {
    good = pickRandom(eligibleGoods);
  }

  const res = window.D.RESOURCES[good];
  if (!res) return null;

  // Quantity: hold % by risk, with infamy multiplier for slaves at high infamy
  const holdCapacity = state.hold?.capacity || 200;
  const holdPct = { low: 0.08, medium: 0.18, high: 0.35 }[risk] || 0.08;
  const infamyQtyMult = (good === "slaves" && infamy >= 50 && risk === "high") ? 1.5 : 1.0;
  const requiredQty = Math.max(2, Math.round(holdCapacity * holdPct * infamyQtyMult));

  // Gold: substantial delivery fee
  const margin = window.D.SMUGGLE_PROFIT_MARGINS[risk] || 1.20;
  const expectedCost = res.basePrice * requiredQty;
  const gold = Math.round(expectedCost * (1 + margin) / 25) * 25;

  // Patrol risk during voyage
  const patrolRisk = { low: 0.12, medium: 0.30, high: 0.55 }[risk] || 0.12;

  // Infamy on completion
  const infamyGain = good === "slaves" ? 2 : 1;

  const targetPort = pickTargetPort(portKey, "smuggle", state, "pirate");
  if (!targetPort) return null;

  const targetPortName = window.D.PORTS[targetPort]?.name || "unknown port";
  const targetFaction = window.D.PORTS[targetPort]?.faction || "english";
  const goodName = res.name;
  const goodUnit = res.unit;
  const sourceHint = res.sourceHint || "";
  const riskLabel = { low: "routine", medium: "dangerous", high: "perilous" }[risk] || "";
  const infamyWarning = good === "slaves"
    ? " Purchasing this cargo will darken your reputation."
    : "";

  const fame = risk === "high" ? 2 : 1;

  // Rep: +pirate, -receiving faction
  const repImpact = {
    pirate: window.D.MISSION_REP_IMPACTS.smuggle?.any ?? 2,
    [targetFaction]: -3,
  };

  return {
    type: "smuggle",
    name: `Smuggle ${goodName} to ${targetPortName}`,
    description: `Get ${requiredQty} ${goodUnit} of ${goodName} to ${targetPortName} without inspection. ${riskLabel.charAt(0).toUpperCase() + riskLabel.slice(1)} work — patrols are active.${infamyWarning} ${sourceHint}`,
    faction: "pirate",
    targetPort,
    risk,
    gold,
    fame,
    infamyGain,
    repImpact,
    enemy: generateEnemy(risk, state.fame ?? 0, "pirate"),
    requiredGood: good,
    requiredQty,
    patrolRisk,       // used by ADVANCE_DAY patrol check
    isContraband: good !== "rum", // rum smuggle doesn't trigger hold scan for non-mission voyages
  };
};
```

### 1.5 — Update main `generateMissions` loop

Replace inline mission object construction with type-dispatched generator calls:

```js
for (let i = 0; i < count; i++) {
  const faction = pickRandom(eligibleFactions);
  const typeWeights = typeWeightsFor(faction);
  const types = Object.keys(typeWeights).filter(t => typeWeights[t] > 0);
  const weights = types.map(t => typeWeights[t]);
  const type = pickWeighted(types, weights);
  const missionFaction = type === "smuggle" ? "pirate" : faction;

  const riskWeights = riskWeightsFor(state.fame ?? 0);
  const riskPool = type === "assault" ? ["assault"] : ["low", "medium", "high"];
  const riskWArr = riskPool.map(r => riskWeights[r] || 0);
  const risk = pickWeighted(riskPool, riskWArr);

  let missionObj = null;

  if (type === "trade") {
    missionObj = generateTradeMission(portKey, state, missionFaction, risk);
  } else if (type === "smuggle") {
    missionObj = generateSmuggleMission(portKey, state, risk);
  } else {
    // escort, patrol, combat, assault — existing construction unchanged
    const targetPort = pickTargetPort(portKey, type, state, missionFaction);
    const enemy = (type === "combat" || type === "assault")
      ? (type === "assault"
          ? generateEnemyForAssault(targetPort, state.fame ?? 0)
          : generateEnemy(risk, state.fame ?? 0, missionFaction))
      : null;
    const gold = generateGold(type, risk, state.fame ?? 0);
    const fame = type === "assault" ? 3 : risk === "high" ? 2 : 1;
    const infamyGain = type === "assault" ? (risk === "high" ? 3 : 2) : 0;
    const defendingFaction = (type === "assault" && targetPort)
      ? window.D.PORTS[targetPort]?.faction : null;
    const repImpact = generateRepImpact(type, missionFaction, risk, defendingFaction);
    const { name, desc } = generateMissionText(type, missionFaction, targetPort, risk, enemy);
    missionObj = {
      type, name, description: desc, faction: missionFaction,
      targetPort: targetPort || null,
      risk, gold, fame, infamyGain, repImpact, enemy,
    };
  }

  if (!missionObj) continue;
  missions.push(missionObj);
}

// Fallback: ensure at least 1 mission always returned
if (missions.length === 0) {
  const fallback = generateTradeMission(portKey, state, port.faction, "low")
    || { // absolute fallback if trade also fails
      type: "escort", name: "Escort the merchant fleet", faction: port.faction,
      description: "Safe passage required.",
      targetPort: null, risk: "low", gold: 200, fame: 1,
      infamyGain: 0, repImpact: { [port.faction]: 2 }, enemy: null,
    };
  missions.push(fallback);
}
```

---

## Part 2 — engine.js Changes

### 2.1 — Update `COMPLETE_MISSION` for trade and smuggle

```js
case A.COMPLETE_MISSION: {
  const mission = state.activeMission;
  if (!mission) return state;
  if (mission.targetPort && state.currentPort !== mission.targetPort) {
    return { ...state };
  }

  // ── Cargo satisfaction check (trade and smuggle) ──────────────
  if (mission.requiredGood && mission.requiredQty) {
    const inHold = state.hold?.items?.[mission.requiredGood] || 0;
    if (inHold < mission.requiredQty) {
      // Not enough goods — do nothing (UI already prevents button press,
      // this is a belt-and-suspenders guard)
      return {
        ...state,
        log: [...state.log,
          `Cannot complete: ${mission.requiredQty} ${window.D.RESOURCES[mission.requiredGood]?.name} required, ${inHold} in hold.`
        ]
      };
    }
  }

  // ── Remove goods from hold on trade/smuggle completion ────────
  let holdItems = { ...(state.hold?.items || {}) };
  if (mission.requiredGood && mission.requiredQty) {
    holdItems[mission.requiredGood] = Math.max(0,
      (holdItems[mission.requiredGood] || 0) - mission.requiredQty
    );
  }

  // ── Gold (no rep multiplier for trade or smuggle) ─────────────
  let finalGold;
  let bonusNote;

  if (mission.type === "trade" || mission.type === "smuggle") {
    finalGold = mission.gold;  // fixed amount, no multiplier
    bonusNote = "";
  } else {
    const rep = state.reputation[state.currentPort] ?? 50;
    const perk = L.getRepPerk(rep);
    const baseGold = mission.gold;
    finalGold = Math.floor(baseGold * perk.missionMult);
    const goldDelta = finalGold - baseGold;
    bonusNote = goldDelta > 0 ? ` (+${goldDelta}g ${perk.tier} bonus)`
              : goldDelta < 0 ? ` (${Math.abs(goldDelta)}g ${perk.tier} penalty)` : "";
  }

  // ── Infamy, rep, fame (unchanged logic) ───────────────────────
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

### 2.2 — Update `ADVANCE_DAY` patrol risk for smuggle missions

In ADVANCE_DAY, after existing daily processing (wages, provisions, wind),
add the smuggle patrol override **before** the general random event roll:

```js
// ── Smuggle mission patrol risk ───────────────────────────────
// Fires only when on a smuggle mission AND the required contraband
// is actually in hold. Risk is in carrying the goods, not accepting.
const activeMission = newState.activeMission;  // newState = state after daily costs
const isSmuggling = activeMission?.type === "smuggle" && activeMission?.requiredGood;

const contrabandInHold = isSmuggling
  ? (newState.hold?.items?.[activeMission.requiredGood] || 0) > 0
  : false;

if (contrabandInHold && Math.random() < (activeMission.patrolRisk || 0.12)) {
  // Fire navy_patrol event specifically
  const navyPatrol = window.D.RANDOM_EVENTS?.find(e => e.id === "navy_patrol");
  if (navyPatrol) {
    return {
      ...newState,
      activeEvent: navyPatrol,
      screen: "event",
      log: [...newLog, "A patrol vessel approaches, flying inspection colours."]
    };
  }
}
// Otherwise: continue to normal random event roll (unchanged)

// When firing the navy_patrol event from ADVANCE_DAY's smuggle check,
// store the flag in encounterContext so DISMISS_BATTLE can read it later.
// Currently the patrol fires as an event (screen: "event"), not directly
// as a battle. The isNavyPatrol flag needs to survive through the
// RESOLVE_EVENT → INTERCEPT_FIGHT path.
//
// Simplest implementation: when RESOLVE_EVENT processes the "Refuse
// inspection" choice on a navy_patrol event, set isNavyPatrol: true
// on the encounterContext that gets built:

// In RESOLVE_EVENT, "refuse inspection" branch:
return {
  ...state,
  activeEvent: null,
  screen: "intercept",
  encounterContext: {
    ...buildEncounterContext(state, "navy_patrol_combat", generatedPatrolEnemy),
    isNavyPatrol: true,   // ← flag carried through to DISMISS_BATTLE
  },
};
```

⚙ **Agent:** `newLog` is whatever log array has been built during ADVANCE_DAY
processing. Append to it, don't replace. The patrol fires in addition to
other daily events, but replaces the general random event slot for that day.

### 2.2A - Implement impact of fighting a patrol

```js
// In DISMISS_BATTLE, after computing victory/defeat/fled outcome,
// before building the returned state — add infamy for fighting a patrol:

const foughtPatrol = state.encounterContext?.type === "navy_patrol"
                  || state.encounterContext?.enemyFaction === "english"
                     && state.activeMission?.type === "smuggle";
// More precisely: check if the encounter originated from a navy_patrol event.
// The cleanest approach is to set a flag on encounterContext when the patrol
// fires from ADVANCE_DAY's smuggle check:
//   encounterContext: { ...existing, isNavyPatrol: true }
// Then read it here:

const isNavyPatrol = state.encounterContext?.isNavyPatrol === true;
const patrolInfamyGain = isNavyPatrol ? 3 : 0;

const newInfamy = Math.min(999, (state.infamy ?? 0) + patrolInfamyGain);
const patrolInfamyLog = isNavyPatrol && patrolInfamyGain > 0
  ? [`+${patrolInfamyGain} infamy — attacking crown forces was witnessed.`]
  : [];

// Include newInfamy and patrolInfamyLog in the returned state.
// This applies whether the player won, lost, or fled — the attack happened.
```

### 2.3 — Implement contraband seizure in `RESOLVE_EVENT`

In RESOLVE_EVENT, add handling for navy_patrol inspection choice:

```js
case A.RESOLVE_EVENT: {
  const event = state.activeEvent;
  const choice = event?.choices?.[action.choiceIndex];
  if (!event || !choice) return { ...state, activeEvent: null };

  // ── Special: navy_patrol + allow inspection ───────────────────
  if (event.id === "navy_patrol" && action.choiceIndex === 0) {
    // "Allow inspection" path
    const activeMission = state.activeMission;

    // What counts as contraband:
    // - tobacco and slaves always
    // - rum only if on a smuggle mission for rum
    const hasTobacco = (state.hold?.items?.tobacco || 0) > 0;
    const hasSlaves  = (state.hold?.items?.slaves  || 0) > 0;
    const hasRumSmuggle = activeMission?.requiredGood === "rum"
                       && (state.hold?.items?.rum || 0) >= activeMission.requiredQty;
    const hasContraband = hasTobacco || hasSlaves || hasRumSmuggle;

    if (hasContraband) {
      // Calculate fine: 50% of base value of seized goods
      const items = state.hold?.items || {};
      let seizedValue = 0;
      if (hasTobacco) seizedValue += (items.tobacco || 0) * (window.D.RESOURCES.tobacco?.basePrice || 90);
      if (hasSlaves)  seizedValue += (items.slaves  || 0) * (window.D.RESOURCES.slaves?.basePrice  || 220);
      if (hasRumSmuggle) seizedValue += activeMission.requiredQty * (window.D.RESOURCES.rum?.basePrice || 30);
      const fine = Math.round(seizedValue * 0.5 / 25) * 25;
      const goldAfterFine = Math.max(0, state.gold - fine);

      // Determine inspecting faction rep to penalise
      const inspectingFaction = window.D.PORTS[state.currentPort]?.faction || null;

      let newRep = { ...state.reputation };
      if (inspectingFaction) {
        Object.keys(window.D.PORTS).forEach(portKey => {
          if (window.D.PORTS[portKey].faction === inspectingFaction) {
            newRep[portKey] = Math.max(0, (newRep[portKey] ?? 50) - 5);
          }
        });
      }

      const newHoldItems = L.applyLoseContraband(state.hold?.items || {});
      const newInfamy = Math.min(999, (state.infamy ?? 0) + 2);
      const newMorale = Math.max(0, state.crew.morale - 10);

      return {
        ...state,
        activeEvent: null,
        screen: "sailing",
        gold: goldAfterFine,
        hold: { ...state.hold, items: newHoldItems },
        infamy: newInfamy,
        reputation: newRep,
        crew: { ...state.crew, morale: newMorale },
        log: [
          ...state.log,
          "The patrol found contraband. All illegal goods seized.",
          `Fine levied: ${fine}g.`,
          `+2 infamy — your name is in their ledger now.`,
          "The crew's morale drops. They know this will bring more trouble."
        ]
      };
    }

    // Clean hold: pass normally, continue to next choice outcome
    return {
      ...state,
      activeEvent: null,
      screen: "sailing",
      log: [...state.log, "The patrol found nothing. You are waved through."]
    };
  }

  // ── All other events: existing logic unchanged ────────────────
  // ... rest of existing RESOLVE_EVENT implementation ...
}
```

---

## Part 3 — logic.js: One New Function

### 3.1 — Add `hasContrabandForMission(state)` pure function

Utility function used by screens to determine if a mission can be completed
or if a patrol triggers. Keeps the logic in one place.

```js
const hasContrabandForMission = (state) => {
  const mission = state.activeMission;
  if (!mission) return false;
  if (mission.type !== "smuggle") return false;
  const inHold = state.hold?.items?.[mission.requiredGood] || 0;
  return inHold > 0;
};
```

Add to `window.L` exports.

---

## Part 4 — screens_port.jsx: Mission Card + Complete Button

### 4.1 — Update mission card for trade and smuggle

Add a cargo requirement block below the existing description/gold row.
This block appears only when `mission.requiredGood` is set:

```jsx
{(mission.requiredGood && mission.requiredQty) && (() => {
  const res = D.RESOURCES[mission.requiredGood];
  const inHold = state.hold?.items?.[mission.requiredGood] || 0;
  const alreadyHave = inHold >= mission.requiredQty;
  const partialHave = inHold > 0 && inHold < mission.requiredQty;
  const isIllegal = res?.illegal;
  const holdFree = (state.hold?.capacity || 0) - L.getHoldUsed(state.hold?.items || {});
  const canFit = holdFree >= (mission.requiredQty - inHold);

  return (
    <div style={{
      marginTop: 6, padding: "5px 8px", borderRadius: 3,
      background: T.bgDeep,
      border: `1px solid ${isIllegal ? T.red + "55" : T.border}`,
    }}>
      <div style={{ fontSize: 10, color: isIllegal ? T.red : T.textDim, marginBottom: 2 }}>
        {mission.type === "smuggle" ? "⚠ Contraband required" : "Cargo required"}
      </div>
      <div style={{ fontSize: 11, color: isIllegal ? T.red : T.text }}>
        {mission.requiredQty} × {res?.name || mission.requiredGood}
        {isIllegal && <span style={{ color: T.red, fontSize: 10 }}> (Illegal)</span>}
      </div>

      {/* Sourcing status */}
      <div style={{ fontSize: 10, marginTop: 3 }}>
        {alreadyHave
          ? <span style={{ color: T.greenBr }}>✓ In hold ({inHold} — ready to deliver)</span>
          : partialHave
            ? <span style={{ color: T.gold }}>
                {inHold}/{mission.requiredQty} in hold — need {mission.requiredQty - inHold} more
              </span>
            : <span style={{ color: T.textDim }}>
                Not yet sourced — check market or source elsewhere
              </span>
        }
      </div>

      {/* Hold space warning */}
      {!alreadyHave && !canFit && (
        <div style={{ fontSize: 10, color: T.redBr, marginTop: 2 }}>
          ⚠ Only {holdFree} hold space free — sell cargo first
        </div>
      )}

      {/* Source hint for smuggle */}
      {mission.type === "smuggle" && res?.sourceHint && (
        <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2, fontStyle: "italic" }}>
          {res.sourceHint}
        </div>
      )}

      {/* Cost estimate for trade */}
      {mission.type === "trade" && (
        <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2 }}>
          Est. cost: ~{res?.basePrice * mission.requiredQty}g
          · Payment on delivery: {mission.gold}g
          · Est. profit: ~{mission.gold - res?.basePrice * mission.requiredQty}g
        </div>
      )}

      {/* Infamy warning for smuggle */}
      {mission.type === "smuggle" && (
        <div style={{ fontSize: 10, color: T.red, marginTop: 2 }}>
          +{mission.infamyGain} infamy on completion
          {mission.requiredGood === "slaves" ? " · +1 infamy on purchase" : ""}
        </div>
      )}
    </div>
  );
})()}
```

### 4.2 — Update Complete Mission button (PortScreen, when at target port)

When `activeMission?.requiredGood` is set and player is at target port:

```jsx
{activeMission && state.currentPort === activeMission.targetPort && (() => {
  const hasGoods = !activeMission.requiredGood ||
    (state.hold?.items?.[activeMission.requiredGood] || 0) >= activeMission.requiredQty;
  const goodName = activeMission.requiredGood
    ? (D.RESOURCES[activeMission.requiredGood]?.name || activeMission.requiredGood)
    : null;
  const inHold = activeMission.requiredGood
    ? (state.hold?.items?.[activeMission.requiredGood] || 0) : null;

  return (
    <div>
      <Btn
        v={hasGoods ? "gold" : "default"}
        disabled={!hasGoods}
        onClick={() => dispatch({ type: E.A.COMPLETE_MISSION })}
      >
        ✓ Complete Mission
      </Btn>
      {activeMission.requiredGood && (
        <div style={{ fontSize: 10, marginTop: 4,
          color: hasGoods ? T.greenBr : T.redBr }}>
          {hasGoods
            ? `✓ ${inHold} ${goodName} in hold — ready`
            : `✗ ${inHold}/${activeMission.requiredQty} ${goodName} — visit market`
          }
        </div>
      )}
    </div>
  );
})()}
```

### 4.3 — MarketScreen: Black Market visual section

In MarketScreen, after rendering all legal goods, add a divider and black
market section if any illegal goods are present in `state.portMarket.goods`:

```jsx
{/* ── Black Market section ─────────────────────────────────── */}
{(() => {
  const illegalGoods = Object.keys(D.RESOURCES).filter(
    g => D.RESOURCES[g].illegal && state.portMarket?.goods?.[g]
  );
  if (illegalGoods.length === 0) return null;

  return (
    <div>
      <div style={{
        margin: "12px 0 6px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ flex: 1, height: 1, background: T.red + "40" }} />
        <span style={{ color: T.red, fontSize: 10, letterSpacing: "0.1em" }}>
          ⚠ BLACK MARKET
        </span>
        <div style={{ flex: 1, height: 1, background: T.red + "40" }} />
      </div>
      <div style={{ fontSize: 10, color: T.redBr, marginBottom: 8 }}>
        These goods are illegal. Carrying them risks inspection and seizure.
        {illegalGoods.includes("slaves") &&
          " Purchasing slaves increases your infamy."}
      </div>
      {illegalGoods.map(good => (
        /* Render same GoodRow component as standard goods,
           but with isIllegal=true prop for red styling */
        <GoodRow key={good} good={good} isIllegal={true} {...rowProps} />
      ))}
    </div>
  );
})()}
```

---

## Part 5 — Tests

### Generator tests (tests_logic.js, add to G.* suite)

- [ ] `generateTradeMission` returns object with `requiredGood`, `requiredQty`,
  `gold`, `targetPort` fields.
- [ ] `requiredGood` is in the eligible goods list for current fame tier.
- [ ] `requiredQty` for low risk is ~10% of hold capacity (within ±1).
- [ ] `requiredQty` for high risk is ~50% of hold capacity (within ±1).
- [ ] `gold` for low-risk trade mission is approximately
  `basePrice × requiredQty × 1.60` (within 5% after rounding).
- [ ] `generateSmuggleMission` returns object with `requiredGood` in
  `["rum", "tobacco", "slaves"]`.
- [ ] Smuggle `requiredGood` is never `"slaves"` at fame tier 0.
- [ ] Smuggle `requiredGood` is never `"slaves"` when `infamy < 25`.
- [ ] Smuggle `patrolRisk` matches expected value per risk tier.
- [ ] Smuggle `targetPort` faction is never `"pirate"` ... wait, rechecked:
  smuggle can go anywhere. Remove this test.
- [ ] Smuggle `repImpact` has a negative value for target port's faction.
- [ ] `generateMissions` returns at least 1 mission even on repeated calls
  (fallback mechanism active).
- [ ] `pickTargetPort("portRoyal", "smuggle", state, "pirate")` returns a
  non-current-port result (can be any faction including colonial).

### Reducer tests (tests_engine.js)

- [ ] `COMPLETE_MISSION` trade mission: with correct goods in hold →
  goods removed from hold, gold increased by `mission.gold`.
- [ ] `COMPLETE_MISSION` trade mission: without goods → state unchanged,
  log entry added, mission NOT cleared.
- [ ] `COMPLETE_MISSION` trade mission: rep multiplier NOT applied — gold
  equals exactly `mission.gold` regardless of rep tier.
- [ ] `COMPLETE_MISSION` smuggle mission: with correct goods in hold →
  goods removed, gold increased, infamyGain applied.
- [ ] `COMPLETE_MISSION` smuggle mission: without goods → state unchanged.
- [ ] `RESOLVE_EVENT` navy_patrol, "allow inspection", tobacco in hold →
  tobacco removed from hold, fine deducted, +2 infamy, morale −10.
- [ ] `RESOLVE_EVENT` navy_patrol, "allow inspection", clean hold →
  no cargo change, no infamy change.
- [ ] `RESOLVE_EVENT` navy_patrol, "allow inspection", rum in hold but
  NOT on smuggle mission for rum → no seizure (rum is legal).
- [ ] `RESOLVE_EVENT` navy_patrol, "allow inspection", rum in hold AND
  on smuggle mission for rum → rum seized, fine applied.
- [ ] Fine calculation: 5 tobacco at 90g base → seizure value 450g →
  fine = 225g.

### UI smoke tests (tests_ui.js)

- [ ] Mission card renders cargo requirement block for trade mission.
- [ ] Mission card shows green "✓ In hold" when goods are present.
- [ ] Mission card shows gold partial-have message when partially stocked.
- [ ] Mission card shows cost estimate and profit estimate for trade.
- [ ] Mission card shows infamy warning for smuggle.
- [ ] Complete Mission button is disabled when hold doesn't have required goods.
- [ ] Complete Mission button is enabled when hold has required goods.
- [ ] MarketScreen shows Black Market section when illegal goods in portMarket.
- [ ] MarketScreen Black Market section absent when no illegal goods present.

---

## Part 6 — architecture.md Updates

- [ ] **Mission object shape:** add optional fields: `requiredGood?: string`,
  `requiredQty?: number`, `patrolRisk?: number`, `isContraband?: boolean`.
- [ ] **COMPLETE_MISSION:** document two-path gold (trade/smuggle = fixed, no
  missionMult; others = missionMult applied) and cargo removal step.
- [ ] **ADVANCE_DAY:** document smuggle patrol risk override — fires when
  `activeMission.type === "smuggle"` and contraband is in hold.
- [ ] **RESOLVE_EVENT:** document navy_patrol contraband branch: seizure,
  fine, infamy, rep penalty.
- [ ] **data.js:** document `TRADE_MISSION_PROFIT_MARGINS`,
  `SMUGGLE_PROFIT_MARGINS`, `TRADE_GOODS_BY_TIER`, `SMUGGLE_GOODS_BY_TIER`,
  `sourceHint` and `smuggleHint` fields on RESOURCES entries.
- [ ] **logic.js exports:** add `hasContrabandForMission`.
- [ ] **MarketScreen:** note Black Market visual section (display only —
  no separate action, uses existing CONFIRM_TRADE).

---

## Appendix — Expected Economics

### Trade mission at fame tier 0, sloop (200 cap), low risk

- Good: cloth (55g base)
- Quantity: `max(3, floor(200 × 0.10))` = 20 units
- Expected purchase at base price: 20 × 55g = 1100g
- Mission gold: `round(1100 × 1.60 / 25) × 25` = 1750g
- Voyage cost (4 days, sloop 25 crew): ~336g
- Est. profit: 1750 − 1100 − 336 = **+314g and +1 fame**

If sourced cheaply (cloth at 20% below base = 44g): purchase = 880g,
profit = **+534g**. The player who trades well earns more — the mission
rewards smart sourcing, not just accepting the first deal.

### Smuggle mission at fame tier 0, sloop, medium risk

- Good: tobacco (90g base)
- Quantity: `max(2, floor(200 × 0.18))` = 36 units
- Expected purchase: 36 × 90g = 3240g
- Mission gold: `round(3240 × 2.80 / 25) × 25` = 9075g
- Voyage cost (4 days): ~336g
- If caught (patrol fires, all tobacco seized): lose 3240g cargo
  + 50% fine (1620g) + morale penalty
- If delivered: net = 9075 − 3240 − 336 = **+5499g and +1 fame and +1 infamy**

Smuggling is dramatically more profitable than trade — but one bad roll
wipes the entire purchase cost plus a fine. The expected value accounting
for 30% patrol probability per day × 4 days ≈ 73% chance of at least one
patrol on a 4-day voyage at medium risk. This is intentionally punishing
for a full round trip. Pirate players pick ports close together (2 days)
to reduce exposure.