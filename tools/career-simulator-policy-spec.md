# Career Simulator — Player Policy Specification

## Purpose

This document specifies the **player-decision layer** for an end-to-end Broadside career simulator.

The simulator must use the real Broadside game engine and logic for all game rules. A policy is only responsible for deciding **which legal player action to take** from the current state. It must never reimplement travel, combat, economy, reputation, heat, mission generation, event outcomes, or other game mechanics.

The goal is to simulate recognizable player behavior and compare resulting careers, not to create a second implementation of the game.

---

# 1. Simulation contract

The simulation loop is conceptually:

```text
initial game state
      ↓
policy observes current state + visible options
      ↓
policy chooses one legal player action
      ↓
E.reducer(state, action)
      ↓
new state
      ↓
repeat until career termination / horizon
```

The policy may inspect the same information a player can reasonably obtain from the current game state and UI. It may also use deterministic derived information that a player could calculate from visible values, such as:

- remaining gold;
- current crew size and morale;
- current hull;
- cargo quantities and prices;
- mission rewards and destinations;
- displayed travel days;
- current reputation;
- current fame/infamy/heat;
- visible ship/equipment stats;
- currently available mission choices;
- currently available encounter/event choices.

The policy must not use hidden RNG outcomes, future generated events, future market states, hidden enemy rolls, or internal random seeds to make decisions.

For reproducibility, every simulation run has a seed. The simulator records the seed, policy, starting scenario, action sequence, and outcomes.

---

# 2. Policy architecture

A policy has four conceptual layers:

```text
Persona configuration
        ↓
Decision context
        ↓
Decision evaluator
        ↓
Chosen legal action
```

### Persona configuration

Contains stable preferences such as:

- risk tolerance;
- combat preference;
- cash preference;
- fame/progression preference;
- discovery preference;
- crew-safety preference;
- reputation preference;
- heat aversion;
- generosity/altruism;
- willingness to buy equipment;
- willingness to carry provisions conservatively.

### Decision context

Normalizes the current choice into a small set of candidate actions. It should expose only actions that are legal and available.

### Decision evaluator

Scores or selects among the candidate actions using the persona's preferences and current state.

### Chosen action

Must be an actual game action understood by `window.E.A` and processed by the real reducer chain.

No simulator-only shortcut may mutate the state directly.

---

# 3. Decision points that the simulator must support

The policy layer must have an explicit answer for all of the following.

## 3.1 Ship purchase / ship replacement

The policy decides:

- whether to buy a ship when one is affordable and available;
- which legal ship to buy;
- whether to delay in favor of another purchase;
- whether to keep the current ship despite having enough money.

The decision must consider at least:

- current ship;
- purchase cost;
- fame requirement;
- current gold after purchase;
- crew requirement/capacity;
- hold capacity;
- speed;
- endurance;
- combat capability;
- current mission/route needs.

Default common rule: **never buy a ship if doing so would leave the captain unable to operate safely for the next planned voyage**.

For the initial simulator, ship purchase may be conservative: every persona may repair first and only buy when the purchase leaves a defined reserve.

---

## 3.2 Equipment purchase and installation

The policy decides:

- whether to buy equipment;
- which item to buy;
- which slot to install it in when relevant;
- whether to defer because the current ship is temporary.

The evaluator should consider:

- equipment cost;
- immediate gold reserve;
- ship tier / expected time until next ship;
- equipment contribution to the persona's goals;
- trade-offs such as speed vs hull or hold vs special utility.

A temporary ship should normally receive only cheap equipment with immediate value. A ship expected to be kept for a long time can justify stronger investment.

---

## 3.3 Crew recruitment and renewal

The policy decides:

- whether to recruit;
- how many crew to recruit;
- which available crew to hire;
- whether to dismiss or replace crew;
- whether to favor faction/alignment/traits when known.

The policy must account for:

- minimum sailing crew;
- ship maximum crew;
- wage burden;
- provision burden;
- morale;
- known crew traits;
- faction compatibility;
- mission/combat needs.

Crew recruitment is not simply "fill to maximum". A cautious policy may deliberately remain below maximum to reduce upkeep; a combat-oriented policy may favor a fuller roster.

---

## 3.4 Provision management

The policy decides:

- how much food/water to buy;
- whether current supplies are sufficient for the intended route;
- whether to maintain a safety reserve;
- whether a proposed mission/trade run is affordable after provisions.

The simulator must use the actual game provisioning logic, including the current integer consumption model.

Policy behavior must not manually deduct provisions.

Recommended baseline rule:

> Never intentionally begin a voyage without enough provisions for the planned route plus the persona's safety margin.

Safety margin may vary by persona.

---

## 3.5 Free trade

The policy decides:

- whether free trading is worth doing at the current port;
- which good to buy;
- quantity to buy;
- target port;
- when to stop trading and return to mission/progression activity.

The policy may evaluate actual current market information and `L.getPortTradeProfile`/visible market data.

It must account for:

- purchase price;
- destination price;
- cargo capacity;
- route duration;
- current mission obligations;
- contraband legality;
- expected profit per day;
- remaining gold;
- provision and repair needs.

A persona should be allowed to have a **free-trade frequency preference** rather than always trading whenever profitable.

---

## 3.6 Mission selection

The policy must explicitly define:

- whether to accept missions at all;
- how many displayed mission sets to inspect;
- whether to use mission refreshes;
- how to compare missions;
- whether to reject a merely acceptable mission in search of a better one.

### Refresh rule

The initial simulator should support two behaviors:

**Naive:** evaluate only the first mission set presented; never refresh intentionally.

**Opportunistic:** refresh up to a defined maximum (recommended: 5 refresh actions), but only when the expected benefit is greater than the refresh opportunity cost.

Other personas can use 0–5 refreshes depending on personality.

The policy must not regenerate missions independently. It can only inspect the missions currently supplied by the real game state and issue `REFRESH_MISSIONS` when the action is legal.

---

## 3.7 Mission acquisition / preparation

Before taking a mission, the policy decides whether it can realistically execute it.

For trade/smuggle missions it must evaluate:

- required good;
- required quantity;
- current cargo;
- current port stock and price;
- target demand / destination value;
- gold available after purchase;
- route duration and provisions.

The simulator must explicitly model this decision:

```text
mission selected
    ↓
required cargo fully available?
 ├─ yes → buy what is needed
 └─ no
      ↓
can source required cargo elsewhere?
 ├─ yes → decide whether to route via source port
 └─ no → reject/abandon mission
```

A policy must not assume the mission cargo magically exists.

---

## 3.8 Patrol mission if no encounter occurs on the first travel

A patrol mission is not completed merely because the player reaches the target port unless the real engine says so.

The policy must define what to do when the mission's first voyage produces no required patrol encounter.

Recommended initial behavior:

- continue attempting to satisfy the mission according to actual mission rules;
- if the mission state requires another voyage/intercept, make the next route decision from current state;
- do not force a combat encounter or invent a success.

The policy may choose another mission only if the game legally permits abandoning the current patrol mission.

---

## 3.9 Event reactions

Every event with player choices requires a policy response.

Initial event set includes:

- storm;
- calm winds / doldrums;
- merchant in distress;
- drifting wreck;
- marooned sailors;
- treasure-map style legacy event if still active;
- whale sighting;
- mutiny/deserter events as currently implemented;
- chart/discovery events.

The policy must select from the **actual legal choices supplied by the event context**.

It must never directly infer or execute an unavailable choice.

---

## 3.10 Smuggle-patrol reaction

This is a sequential decision policy.

Conceptual flow:

```text
patrol
  ↓
inspect / bribe / refuse
  ↓
if inspect:
    clean → continue
    contraband → hand over / resist
  ↓
if resist:
    real boarding combat
```

The policy may use:

- contraband value;
- current gold;
- current reputation;
- infamy/heat;
- ship and crew condition;
- available combat strength;
- current mission importance.

The policy must not use hidden inspection outcomes before they happen.

---

## 3.11 Random-patrol reaction

The policy uses the actual available intercept choices for a random patrol context.

The decision should account for:

- whether carrying legal or illegal cargo;
- current heat;
- current faction reputation;
- ship combat condition;
- current gold;
- bribe availability/cost.

The policy must not assume a choice exists unless it is provided by the current encounter context.

---

## 3.12 Morale management

The policy decides whether to raise morale / buy drinks.

It should consider:

- current morale;
- crew composition;
- upcoming combat;
- current gold;
- wage/provision pressure;
- probability of desertion/mutiny.

Default common rule:

> Keep morale above the danger zone when affordable, but do not spend heavily on morale when the captain is economically constrained.

Persona differences affect how much reserve is maintained.

---

## 3.13 Navigation

The policy chooses between:

- direct travel to the current target;
- mid-voyage course changes;
- short-hop routing through intermediate ports.

Navigation policy must use actual reachability and endurance.

### Baseline behaviors

**Cautious:** prefer short hops when they create a materially safer route or allow resupply/repair.

**Naive:** sail directly toward the displayed target whenever possible.

**Opportunistic:** compare direct route and profitable/strategic intermediate stop.

**Explorer:** deliberately prefer new destinations/discovery opportunities when viable.

The simulator must never create a route that the real engine considers unreachable.

---

## 3.14 Repairs

All personas should default to **repairing before departure**, as agreed.

The policy must decide:

- whether to repair fully;
- whether gold constraints make a partial/late repair acceptable;
- whether a repair should be prioritized over another port expenditure.

Common rule:

> Repair is the first port expense unless doing so prevents survival/progression-critical preparation.

Persona variation should mostly affect what comes after repair, not whether an obviously damaged ship is sent back to sea.

---

## 3.15 Combat

The simulator should initially use the real NPC AI logic for enemy behavior.

For the player side, the policy chooses actual player actions.

The player combat policy must decide:

- broadside;
- precision hit;
- close/open distance;
- grapple;
- continue fighting;
- fall back;
- demand surrender where available;
- surrender when appropriate.

The policy must consider:

- player hull;
- enemy hull;
- player crew;
- enemy crew;
- morale;
- distance;
- speed;
- equipment;
- expected plunder value;
- mission objective.

### Player vs NPC AI

The existing NPC AI is acceptable as the baseline for enemies. However, a player policy should **not simply copy the NPC action scorer**, because the human player has a different objective: plunder and long-term career value matter.

The initial player combat evaluator should therefore add:

```text
expected plunder value
+ mission value
+ survival value
- expected damage
- crew loss
- escape/heat costs
```

to action evaluation.

---

## 3.16 Plunder decisions

After victory, the policy decides:

- whether to take plunder;
- which goods to keep when hold space is limited;
- whether to jettison existing cargo;
- whether to leave low-value goods behind.

This must use actual plunder content and hold capacity.

Recommended base heuristic:

```text
value of incoming cargo
vs
value of cargo already held
vs
mission-critical cargo
vs
contraband risk
```

A player should prefer mission-critical cargo over generic low-value cargo even if the generic cargo has slightly higher immediate sale value.

Personas can vary in willingness to jettison cargo.

---

## 3.17 Port-budget prioritization

When gold is insufficient for every desired port action, the policy must rank expenditures.

Required candidates:

1. repair;
2. crew recruitment;
3. minimum provisions;
4. mission cargo purchase;
5. free-trade cargo;
6. equipment;
7. morale spending;
8. discretionary upgrades.

Default common priority:

```text
repair
→ minimum operational crew
→ minimum voyage provisions
→ mission-critical cargo
→ everything else
```

Persona-specific preferences may change the ordering of discretionary spending, but no persona should knowingly spend its last operational resources on optional equipment while unable to sail.

---

## 3.18 Reputation management

Reputation can be treated in two ways, and the policy specification supports both.

### Consequence-only mode

Reputation is an outcome of other decisions.

The policy never deliberately farms reputation unless it is necessary for another goal.

### Goal-directed mode

The policy monitors reputation and actively chooses actions that improve a target faction's standing when the expected strategic value is high.

For the initial personas:

- Cautious Trader: moderate goal-directed reputation management.
- Privateer: strong goal-directed reputation with one preferred faction.
- Smuggler: mostly consequence-driven; actively protects reputation where useful for bribery/services.
- Pirate Raider: consequence-driven toward hostility/infamy; little interest in conventional reputation.
- Explorer: moderate reputation interest to preserve access.
- Opportunist: dynamically values reputation when it unlocks or improves a concrete near-term objective.
- Naive: consequence-only.

The simulator should record reputation changes and policy decisions separately so we can distinguish:

> "this persona happened to become allied"

from:

> "this persona deliberately pursued allied status."

---

## 3.19 Heat management

Heat should primarily be an **emergent consequence of policy**, not something every player actively farms down.

However, personas may choose to let time pass when high heat becomes strategically dangerous.

### Default

A policy may choose an "empty travel" / non-profit voyage only when:

- current heat is materially harmful;
- the trip has low operational cost;
- there is no better productive action;
- the expected benefit of waiting exceeds the cost.

This should be relatively rare for competent personas.

### Persona variations

**Naive:** does not deliberately cool heat.

**Cautious Trader:** may make a safe low-value trip to reduce dangerous heat.

**Smuggler:** actively manages heat once it reaches a defined risk threshold.

**Pirate Raider:** accepts high heat and rarely cools it deliberately.

**Opportunist:** compares the value of cooling against immediate economic/progression opportunities.

---

# 4. Shared decision framework

All personas should use a common set of derived concepts.

## 4.1 Operational safety

```text
safeToSail(state, plannedRoute)
```

Considers:

- hull;
- minimum crew;
- provisions;
- route duration;
- available gold at destination if relevant.

## 4.2 Economic runway

```text
postActionGold
```

should account for the next foreseeable mandatory costs.

## 4.3 Expected value

Where outcomes can be approximated from visible information:

```text
expectedValue =
    expectedReward
  + progressionValue
  - expectedLoss
  - timeCost
  - riskPenalty
```

The simulator may use existing deterministic helper functions to estimate these values, but must not peek at hidden future outcomes.

## 4.4 Risk

Risk should be represented relative to the current career state rather than as one universal number.

A loss of 200g means something different when the captain owns 500g versus 50,000g.

Likewise a loss of 3 crew is much more severe when operating at minimum crew.

---

# 5. Persona definitions

## 5.1 Naive New Player — implement first

The Naive policy represents a player who understands the basic interface but not the deeper optimization.

### Core profile

```text
riskTolerance: medium-low
combatPreference: avoid unless committed/obvious
cashPreference: immediate
famePreference: low
discoveryPreference: low
crewSafety: high
heatAversion: low
reputationManagement: consequence-only
refreshMissions: 0
```

### Ship

- Buy the cheapest next ship that is clearly affordable.
- Do not save for an expensive optimal ship unless it is the first obvious available upgrade.
- Repair before sailing.
- Avoid expensive equipment until the current ship feels established.

### Equipment

- Prefer obvious stat upgrades.
- Buy at most one useful upgrade when affordable.
- Do not optimize combinations.

### Crew

- Recruit toward a comfortable crew count.
- Prefer filling obvious capacity gaps.
- Do not deliberately optimize faction or traits.
- Dismiss only when clearly necessary.

### Provisions

- Buy enough for the visible planned trip.
- Keep only a small safety margin.
- Do not deliberately stockpile.

### Free trade

- Trade when a clearly attractive opportunity is visible.
- Use simple profitable routes.
- Do not spend many days searching for perfect prices.

### Missions

- Accept the first acceptable mission.
- Never deliberately refresh.
- Prefer missions with straightforward descriptions/rewards.
- Avoid obviously dangerous missions when the danger is directly visible.

### Mission cargo

- Buy required mission cargo when available.
- If unavailable locally, prefer abandoning/rejecting rather than constructing a complicated sourcing route.

### Events

Use simple, intuitive responses:

- Storm → safer-looking option.
- Doldrums → wait.
- Wreck → usually leave unless the reward looks obvious.
- Merchant → usually help.
- Marooned sailors → help when cheap.
- Whale → leave them alone.
- Charts → take them.
- Mutiny → choose the obvious conciliatory or defensive option depending on the visible wording.

### Patrol

- Prefer inspection when no obvious contraband problem exists.
- If contraband is found, hand it over unless the cargo value looks very large.
- Use bribe only when the interface makes it look inexpensive.

### Navigation

- Sail directly toward the selected destination.
- Rarely make strategic intermediate stops.

### Morale

- Buy drinks when morale becomes noticeably low.
- Do not optimize morale points per gold.

### Combat

Use a simplified player heuristic:

```text
enemy clearly weaker → fight aggressively
enemy clearly stronger → preserve distance / disengage when possible
close + strong crew advantage → grapple
otherwise → broadside / precision according to preview
```

After victory:

- plunder obvious valuable cargo;
- keep mission cargo;
- jettison low-value cargo only when necessary.

### Reputation / heat

Treat as consequences, not long-term goals.

### Key purpose

The Naive policy is primarily a test of:

> **Does the game remain viable and understandable when the player makes plausible but non-optimal decisions?**

---

# 5.2 Opportunistic / Competent Player — implement first

This is the first "reasonably competent" policy.

Unlike the Naive policy, it evaluates the current situation rather than following a fixed script.

### Core profile

```text
riskTolerance: medium
cashPreference: medium-high
famePreference: medium
discoveryPreference: medium
crewSafety: medium
heatAversion: medium
reputationManagement: goal-directed when strategically valuable
refreshMissions: up to 5 when justified
```

### General rule

At each decision:

```text
score all legal actions
→ reject actions violating operational safety
→ choose highest utility
```

The policy should use current state and visible consequences, not hidden future events.

### Ship

Prefer the next ship that gives the strongest improvement for the current strategic goal while preserving an adequate cash reserve.

Do not buy merely because it is affordable.

### Equipment

Choose combinations that reinforce the current strategy and remain useful for the expected life of the ship.

Avoid buying equipment on a nearly obsolete ship unless the item is unusually cheap or broadly useful.

### Crew

Maintain enough crew for safe operations and combat.

Consider:

- morale;
- known traits;
- faction alignment;
- wage burden.

A crew member with a strong known positive trait may be worth hiring over a generic cheaper alternative.

### Provisions

Maintain a meaningful reserve beyond the minimum route requirement.

### Free trade

Trade when profit per day exceeds the value of available mission/progression alternatives.

Prefer routes with:

- strong price spread;
- short travel;
- manageable risk;
- useful destination.

### Missions

Inspect all visible missions.

Refresh when:

```text expected improvement × remaining opportunity
>
cost/penalty of refreshing
```

Never refresh indefinitely.

Prioritize missions that match the current career objective:

```text need gold → profitable trade/smuggle
need fame → higher-fame missions
high heat → avoid unnecessary smuggling
weak ship → lower-risk missions
```

### Mission cargo

If mission cargo is not available at the issuing port:

- check whether it is obtainable at a nearby reachable port;
- compare detour cost against mission profit;
- reject when sourcing cost/time destroys the advantage.

### Events

Evaluate actions using:

```text reward
vs
expected risk
vs
time cost
vs
current need
```

Examples:

- Wreck → search if expected value remains positive.
- Merchant → defend when merchant survival bonus is materially valuable and combat risk acceptable.
- Sailors → help if supplies are affordable relative to current reserve.
- Storm → use shelter/route change when it materially lowers expected damage.
- Charts → prioritize if discovery progress has strategic value.

### Patrol

At patrol intercept:

```text if clean:
    inspect
if contraband:
    compare bribe cost / surrender loss / combat risk
```

If inspection discovers contraband:

```text choose hand-over vs resist
based on cargo value and combat state
```

Use boarding and subsequent combat rules rather than inventing shortcut outcomes.

### Navigation

Compare:

- direct route;
- intermediate port;
- resupply/repair opportunity;
- destination value.

Choose the highest overall utility route.

### Morale

Maintain morale above the range where severe negative effects become likely, but do not spend heavily when money is needed elsewhere.

### Combat

Use player-specific action evaluation that incorporates:

- expected damage;
- crew loss;
- hull loss;
- board/capture probability;
- plunder value;
- mission value;
- escape value.

Favor plunder more than the current NPC AI, because a player rationally values the economic consequence of victory.

### Reputation / heat

Actively manage them only when a concrete strategic payoff exists.

Example:

```text
rep 68
need 70 for a useful benefit
→ prefer low-cost positive-rep action

heat 8
about to attempt valuable smuggle
→ consider cooling trip if no higher-value alternative
```

### Key purpose

This policy tests:

> **What does a broadly competent player career look like under the actual game rules?**

---

# 5.3 Cautious Trader

Build from Opportunistic with:

```text
riskTolerance = low
cashPreference = high
crewSafety = high
heatAversion = high
combatPreference = avoid
discoveryPreference = low-medium
```

Key differences:

- prefers trade and low-risk missions;
- avoids unnecessary combat;
- maintains larger provision/gold reserves;
- favors stable reputation;
- leaves risky wrecks unless profitable enough;
- prefers hand-over over risky resistance;
- may cool heat deliberately;
- invests in hold/speed/endurance rather than combat.

---

# 5.4 Privateer

Build from Opportunistic with:

```text
riskTolerance = medium-high
combatPreference = seek
famePreference = high
reputationPreference = high with one chosen faction
cashPreference = medium
```

Key differences:

- strongly prefers combat and escort missions;
- values faction reputation and fame;
- more willing to defend merchants;
- more willing to pursue attackers after secondary-objective failure;
- invests in combat equipment;
- still repairs before sailing;
- accepts moderate crew losses when the reward is worthwhile.

---

# 5.5 Smuggler

Build from Opportunistic with:

```text
riskTolerance = high
cashPreference = very high
heatAversion = medium at low heat, high at extreme heat
combatPreference = avoid unless resistance has high expected value
```

Key differences:

- strongly prefers smuggle missions and profitable contraband;
- actively evaluates bribe cost;
- understands hidden compartment value;
- tolerates inspection risk;
- resists seizure when cargo value justifies the combat risk;
- may deliberately cool heat after a profitable run;
- values speed and smuggling-oriented equipment.

The Smuggler must not assume that evading patrols is free. It must use the actual game's heat consequences.

---

# 5.6 Pirate Raider

Build from Opportunistic with:

```text
riskTolerance = very high
combatPreference = seek
cashPreference = high
famePreference = medium
discoveryPreference = low
heatAversion = very low
reputationManagement = consequence-driven
```

Key differences:

- favors assault/combat missions;
- aggressively takes profitable fights;
- searches risky wrecks;
- plunders aggressively;
- resists patrols more readily;
- accepts high heat;
- values crew strength;
- tolerates low diplomatic reputation.

The policy should still avoid obviously suicidal choices. "High risk" must not mean random self-destruction.

---

# 5.7 Explorer

Build from Opportunistic with:

```text
riskTolerance = medium
discoveryPreference = very high
cashPreference = medium
famePreference = medium-high
heatAversion = medium
```

Key differences:

- prioritizes undiscovered ports;
- values chart/discovery events;
- prefers routes that expand geographic knowledge;
- accepts moderate economic inefficiency for exploration;
- favors Navigation Tools and endurance;
- treats new-port access as a strategic reward.

---

# 6. Persona variation parameters

Personas should not become seven completely separate policy implementations.

Use shared decision functions plus persona parameters.

Suggested parameters:

```text
riskTolerance
cashWeight
fameWeight
progressionWeight
discoveryWeight
crewSafetyWeight
combatWeight
plunderWeight
heatWeight
reputationWeight
travelTimeWeight
moraleWeight
altruism
refreshTolerance
inventoryReserveFactor
provisionReserveFactor
shipUpgradeAggression
equipmentInvestment
```

Each persona can override only what materially differs.

---

# 7. Decision examples

## Mission choice

```text
Candidate A: medium-risk escort
Reward: 420g + 2 fame
Travel: 6 days

Candidate B: low-risk trade
Reward: 210g + 1 fame
Travel: 4 days

Naive:
    choose B if it appears simpler/safer.

Opportunistic:
    compare reward, risk, duration, current gold need, fame need.

Privateer:
    likely prefer A.

Cautious Trader:
    likely prefer B.

Pirate Raider:
    choose the highest risk-adjusted combat/progression opportunity.

Smuggler:
    prefer a profitable smuggle if available.

Explorer:
    prefer the mission with the more strategically useful destination.
```

## Wreck

```text
Low-risk cargo already abundant:
    Cautious → leave.

Current gold low, hull healthy:
    Opportunistic → search.

Current hull low, crew low:
    Opportunistic → leave.

Pirate Raider:
    search unless survival is critically threatened.
```

## Patrol with contraband

```text
Contraband value = 800g
Bribe = 400g
Combat odds = favorable

Smuggler:
    likely resist.

Naive:
    likely hand over.

Cautious:
    likely pay/hand over depending on reserve.

Opportunistic:
    calculate expected value of resist vs bribe vs loss.
```

---

# 8. Required fallback behavior

Every policy must define a safe fallback when it cannot make a specialized decision.

Fallback rules:

1. Never issue an illegal action.
2. Never deliberately create an unrecoverable state when another legal action avoids it.
3. Prefer safe continuation over speculative optimization when required information is unavailable.
4. At sea, continue toward the current valid destination if no better navigation decision exists.
5. At port, repair and provision before discretionary spending when operational safety is threatened.
6. In combat, use the existing combat action scorer when no persona-specific override applies.
7. When all candidate actions have strongly negative utility, choose the action with the lowest expected career damage.

---

# 9. Decision trace requirements

Every policy decision should be recorded in the simulation trace.

Minimum fields:

```text
day
screen/context
decisionType
availableActions
chosenAction
persona
reason
```

For scored decisions, include the main score components, for example:

```text
reason:
  immediateGold: 82
  fame: 20
  progression: 10
  riskPenalty: -35
  crewSafety: -5
  timePenalty: -8
  finalScore: 64
```

The trace must distinguish:

- what the policy knew;
- what it chose;
- why it chose it;
- what the real game engine subsequently did.

The policy must never record a fabricated explanation that depends on information unavailable at decision time.

---

# 10. Initial implementation scope

Implement the policy engine in this order:

### Phase 1

Implement:

- shared policy interface;
- deterministic decision context;
- Naive New Player;
- Opportunistic/Competent Player;
- decision tracing;
- actual-engine action execution.

The Phase 1 policy must cover:

- mission selection;
- refresh;
- ship purchase;
- crew recruitment;
- provisions;
- repair;
- trade;
- navigation;
- all current event choices;
- patrol/inspection choices;
- combat;
- plunder;
- port spending priorities.

### Phase 2

Add:

- Cautious Trader;
- Privateer;
- Smuggler;
- Pirate Raider;
- Explorer.

These should mostly reuse the same evaluator with different weights and a small number of explicit behavior overrides.

### Phase 3

Add richer adaptive behavior where data shows a need, rather than pre-building complex "human simulation" rules.

---

# 11. Anti-cheating / realism rules

The simulator must not:

- inspect future RNG;
- inspect future event outcomes;
- regenerate missions outside the normal game action;
- directly access hidden enemy action choices;
- choose a target port based on a market that has not yet been generated/observed;
- assume that a future encounter will or will not occur;
- assume that a current action succeeds.

The simulator may:

- calculate visible expected values;
- compare current mission rewards;
- compare visible prices;
- compare current travel days;
- compare current ship stats;
- use deterministic game helpers intended for player-facing previews.

---

# 12. Success criteria

The policy system is successful when:

1. multiple personas produce visibly different decision patterns;
2. they all use the same underlying game rules;
3. none can access hidden future information;
4. Naive careers remain plausible enough to expose onboarding/early-game problems;
5. Opportunistic careers represent competent use of the current systems;
6. decision traces explain *why* materially different choices occurred;
7. the resulting careers can be exported as complete structured run data for later aggregate and AI analysis.

The simulator is not intended to discover a single mathematically optimal player. Its main purpose is to produce **representative, explainable career trajectories** under several coherent play styles.
