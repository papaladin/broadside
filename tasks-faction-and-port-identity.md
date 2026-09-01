# B10 --- Starts Variety: Faction Identity & Port Identity

## 1. Purpose and scope

B10 establishes two related but distinct sources of faction identity.

**Birth faction** is the player's permanent origin identity. It changes
the practical texture of a career through an incentive, a trade-off, or
a unique edge into an existing game system. It must not force a single
strategy or become a generic numerical advantage.

**Port faction** is a property of the world. Ports belonging to
different factions should not be interchangeable service locations. Each
faction's ports provide one recognizable specialty that gives the player
a concrete reason to value reputation with that faction and to think
twice before becoming hostile to it.

The two layers intentionally interact. A player can value a faction
because of both their own birth identity and the services available in
that faction's ports. Faction identity should therefore be felt through
decisions the player already makes: combat, crew, provisions,
navigation, trade, smuggling, reputation, Infamy, ship progression and
port visits.

B10 is about **identity and asymmetric access**. It is not the later
"living Caribbean" system. It must not introduce dynamic faction wars,
territorial simulation, persistent world reactions, or major political
world-state simulation.

B10 is complete when a player can explain why different birth factions
and different port factions lead to different practical careers, while
no faction is obviously the universal optimal choice.

------------------------------------------------------------------------

## 2. Design philosophy

The revised design deliberately distributes faction identity across
existing systems rather than creating five isolated minigames.

Every identity should answer three questions:

1.  What does this faction make easier or more attractive?
2.  What does the captain have to give up, accept, or work around?
3.  Which existing game system does the identity actually touch?

The objective is not mathematical equality. The objective is **clear
strategic propositions with understandable opportunity costs**.

New port services should reuse existing systems wherever possible. A
Bank extends the economy, an Embassy extends reputation, an Inquisitor
Office extends Infamy management, the Black Market changes mission
availability, and the British Military Naval Yard extends the existing
shipyard/equipment access.

The player should be able to discover faction identity before committing
to a voyage. Therefore port specialties are communicated both in the
navigation port-preview modal and, when the player is actually in the
port, through the normal PortScreen.

------------------------------------------------------------------------

## 3. Birth-faction identities

### 3.1 English --- discipline and naval survivability

An English-born captain represents a disciplined naval tradition. The
defining advantage is **20% less combat crew loss**.

The modifier applies to the already-calculated combat casualty amount,
before final integer rounding/clamping. It is not a direct damage bonus.

Surgeon and English discipline are independent modifiers and stack
**multiplicatively**. Conceptually:

`finalLoss = max(0, ceil(baseLoss × EnglishCrewLossMultiplier × SurgeonCrewLossMultiplier))`

The English multiplier is `0.80`; the Surgeon multiplier is whatever the
existing equipment system defines. Do not duplicate or replace the
Surgeon calculation.

This is especially relevant after B11 because boarding produces
meaningful crew casualties.

**Locked target: 20% reduction in combat crew loss.**

No additional English birth-faction penalty is part of this design.

### 3.2 Spanish --- loyal, inexpensive Spanish crew

A Spanish-born captain may recruit **only Spanish crew, and may recruit
them only while visiting a Spanish port**. A Spanish-born captain at a
non-Spanish port cannot use the recruitment action. The restriction is
intentionally a location restriction as well as a crew-nationality
restriction; it is not a rule that Spanish crew are globally available
at every port.

The restriction belongs to birth identity and remains true after any later
political-affiliation/Letter-of-Marque change unless a future design
explicitly changes that rule.

The restriction is compensated by a recruitment price of **40g per
Spanish crew member**.

The actual game must enforce the Spanish-only recruitment rule. Any
simplified recruitment-availability probability used by the coarse
balance simulator is only a simulation approximation.

Existing crew are not silently converted.

**Locked target: 40g per Spanish crew member; Spanish-born captains can
recruit Spanish crew only.**

### 3.3 French --- endurance and exploration

A French-born captain is optimized for staying at sea and reaching
distant destinations efficiently.

French food and water consumption is reduced to approximately **50% of
normal consumption**, while preserving the game's integer provision
model. No fractional food or water should be stored.

French navigation also receives **+1 day of effective maximum voyage
reach**. This is preferred to removing the heavy-hull/100+ HP
remote-port barrier because it remains relevant later in progression.

**Locked targets: approximately 50% provision consumption and +1 day
effective maximum reach.**

The normal hull/readiness rule remains otherwise unchanged.

### 3.4 Dutch --- superior trade margins

A Dutch-born captain represents commercial expertise.

The intended normal market values are:

-   **sell: 0.95 × port price**
-   **buy: 1.05 × port price**

This narrows the normal market spread from 20 percentage points to 10
percentage points.

The values must be integrated into the existing authoritative
market-price calculation and must combine intentionally with existing B8
port-level modifiers. They must not be applied twice.

**Locked targets: sell at 0.95× and buy at 1.05× the relevant port
price.**

### 3.5 Pirate --- freedom, evasion and illicit trade

A Pirate-born captain should feel less constrained by authority and
better equipped to survive enforcement.

The Pirate birth identity provides:

-   **+10 percentage points to flee/evade success** at the existing
    resolution point.
-   **Bribe remains accessible without the normal reputation/Infamy
    restriction** that would otherwise block it. Normal cost and outcome
    rules remain unchanged.
-   **10% additional chance for smuggled goods to evade discovery during
    inspection.**
-   **Smuggling missions are available exclusively from Pirate ports.**

The inspection benefit applies only to contraband inspection. It must
integrate with the existing contraband-avoidance mechanism rather than
create a second inspection system. If the current representation is an
additive chance, the Pirate modifier is +10 percentage points.

Pirate identity does **not** automatically reduce Infamy.

**Locked targets: +10 percentage points flee/evade, unrestricted Bribe
access, +10 percentage points contraband avoidance, and Pirate-only
smuggling mission acquisition.**

------------------------------------------------------------------------

## 4. Port-faction identities

  -----------------------------------------------------------------------
  Port faction            Unique service          Practical effect
  ----------------------- ----------------------- -----------------------
  Dutch                   **BANK**                Borrow gold. Capacity
                                                  and terms improve with
                                                  Dutch reputation and
                                                  player progression.

  French                  **DIPLOMATIC EMBASSY**  Spend gold to improve
                                                  reputation with other
                                                  factions.

  Spanish                 **INQUISITOR OFFICE**   Spend gold to reduce
                                                  Infamy by 1 point per
                                                  use.

  Pirate                  **BLACK MARKET**        Exclusive source of
                                                  smuggling missions.

  English                 **BRITISH MILITARY      At English reputation
                          NAVAL YARD**            \>50, remove/unmount
                                                  equipment; at Fame 80+,
                                                  obtain selected early
                                                  ship/equipment access.
  -----------------------------------------------------------------------

The specialty is a real mechanical reason to maintain reputation with
the corresponding faction.

Black Market and British Military Naval Yard do not require dedicated
screens. They are access modes layered onto the existing mission and
shipyard systems.

------------------------------------------------------------------------

## 5. Locked numbers and deliberately open tuning

The following values were explicitly converged on during design and are
not placeholders:

| Identity / service | Locked value |
| --- | --- |
| English birth | **20% less combat crew loss**; multiplier 0.80 |
| Spanish birth | **40g per crew member**; recruitment only at Spanish ports |
| French birth | **50% provision consumption target** and **+1 day effective maximum reach** |
| Dutch birth | **0.95× sell / 1.05× buy** relative to the relevant port price |
| Pirate birth: flee/evade | **+10 percentage points** |
| Pirate birth: contraband inspection | **+10 percentage points** |
| Pirate birth: Bribe | **Normal reputation/Infamy availability gate removed** |
| Pirate port | **Exclusive source of smuggling missions** |
| English Naval Yard | **English reputation >50** for equipment removal; **Fame 80+** for selected early access |
| Spanish Inquisitor | **Spanish reputation >50**; **-1 Infamy per use** |
| French Embassy | **French reputation >50**; **+5 reputation per transaction** with another faction |
| Dutch Bank | **10,000g minimum useful loan target; 30-day maturity; 10%→5% interest target** |

The following are intentionally **not yet exact numbers** and must not
be invented by an implementation agent: the Inquisitor price base and
Infamy scaling coefficient, the Embassy price base and reputation
scaling coefficient, the Bank Fame/reputation ceiling formula, the Bank
default consequence, and the exact British early-access ship/equipment
list. These are balance decisions to be resolved before the affected
service is considered final.

The B10 coarse career simulator may use approximations to model these
effects across hundreds of runs. Those simulator approximations are not
gameplay rules and must never be copied into the game engine merely
because they exist in the simulator.

------------------------------------------------------------------------

## 6. Port-service rules

### 6.1 Spanish Inquisitor Office

Access requires **Spanish reputation \> 50**.

Each use reduces Infamy by **exactly 1 point**, never below zero. The
price increases with current Infamy: reducing 10→9 must cost less than
reducing 100→99.

Use a centralized formula of the form:

`cost = baseCost + currentInfamy × costPerInfamy`

The exact base and scaling values remain tuning parameters and must be
centralized in `data.js`, not embedded in a reducer.

The service is unavailable at Infamy 0 and must not modify Fame,
reputation or unrelated state.

### 6.2 French Diplomatic Embassy

Access requires **French reputation \> 50**.

Each transaction purchases **+5 reputation with another faction**. Lower
target reputation costs more to restore.

Use a centralized formula of the form:

`cost = baseCost + max(0, targetThreshold - targetRep) × costPerMissingRep`

The exact constants remain tuning parameters and must be chosen against
the existing gold/reputation economy.

The first implementation targets other factions only. Purchasing French
reputation itself is intentionally not enabled unless separately
approved.

### 6.3 Dutch Bank

The Bank is available in Dutch ports.

The player may have **one outstanding loan at a time**. Store only
genuinely persistent loan information; derive interest and repayment
where practical.

Loan ceiling depends on both **Fame and Dutch reputation**.
High-Fame/high-reputation captains must have materially greater
borrowing capacity than early captains.

Initial targets:

-   minimum useful loan: **10,000g**;
-   **30-day maturity**;
-   interest approximately **10% at minimum qualifying reputation,
    falling toward 5% at very high Dutch reputation**;
-   one outstanding loan;
-   maximum loan should remain a meaningful fraction of ship value.

The exact ceiling formula is a tuning implementation detail, but it must
be deterministic and centralized.

Before confirmation, show principal, interest, total repayment, due
date, current Dutch reputation and Fame.

The exact default consequence for an unpaid loan is **not locked by this
document**. It must be explicitly decided before shipping the service;
debt must never simply disappear.

### 6.4 British Military Naval Yard

Access to the special service requires **English reputation \> 50**.

At that level the player can remove/unmount installed equipment using
the existing equipment/shipyard representation.

At **Fame 80+**, the yard provides earlier access to a selected list of
ships and/or equipment. Normal Fame gates elsewhere remain unchanged.

The early-access list must be explicit and centralized. It must not be
implemented as a global reduction of all Fame gates.

### 6.5 Pirate Black Market

Pirate ports are the **exclusive source of smuggling missions**.

Non-Pirate ports may continue to buy illegal goods and sell illegal
commodities wherever existing market data permits. The Black Market rule
concerns mission acquisition only.

The existing Mission Board remains the UI. An accepted smuggling mission
remains valid after departure from a Pirate port.

------------------------------------------------------------------------

## 7. Navigation port-preview communication

The navigation port-preview modal is part of B10's communication layer.

Every port preview must show the port name, faction, description,
faction-specific service, service access status/requirement, existing
navigation information, and the existing Back to Map / Sail Here
actions.

Recommended structure:

``` text
PORT NAME
Faction
────────────────────────
Port description

FACTION SERVICE
[icon] BANK
Loans available to captains
with sufficient Dutch standing.
────────────────────────
Existing port information
────────────────────────
[Back to Map]       [Sail Here]
```

The same pattern applies to all five specialties.

The service must remain visible when gated. The UI should explain the
requirement rather than hiding the service.

Use the existing port-card/modal components and design tokens. Do not
create a second visual language.

------------------------------------------------------------------------

## 8. Birth identity and political affiliation

`birthFaction` is the permanent origin selected at New Game and
determines birth-faction traits.

If a Letter of Marque or other political-affiliation system exists or is
added later, it must not overwrite `birthFaction`.

B10 does **not** define or implement a new Letter of Marque progression
system. The old proposal in which a Letter of Marque stacked or replaced
faction bonuses is outside this B10 specification. The Letter of Marque
system is **paused/on hold** for B10 and must not be redesigned or
implemented here. It may be revisited later, potentially as part of the
story/political progression arc. B10 only requires compatibility with a
future/current political-affiliation system.

The Spanish recruitment restriction is explicitly tied to birth faction
and therefore remains after political affiliation changes.

------------------------------------------------------------------------

## 9. State, architecture and persistence

B10 should add as little persistent state as possible.

`birthFaction` is already the authoritative persistent identity selected
at game start. It must remain independent from any current political
affiliation.

Port-service availability must be derived from current state such as
port faction, reputation, Fame, Infamy, gold and ship/equipment state.
Do not persist derived flags such as `bankAvailable`,
`embassyUnlocked`, `hasNavalYardAccess` or `canUseInquisitor`.

The Bank is the only B10 service that necessarily needs new persistent
state. The minimum representation is:

- `loan.amount` (outstanding principal or balance, according to the
  existing save convention);
- `loan.dueDay`;
- `loan.interestRate` only if the implementation cannot safely derive
  the rate from the agreed loan terms.

Do not add a persistent field merely to remember that a service is
available; recompute that from the authoritative state.

If the existing code already has a compatible loan/debt representation,
reuse it rather than introducing a second one.

Follow the current architecture:

``` text
data.js
  ↓
pure rule/helper in logic_*.js
  ↓
engine reducer/action
  ↓
screen
```

UI must present authoritative rules rather than reimplementing them.

Likely authoritative rule locations are the current `data.js`,
`logic_core.js`, `logic_economy_crew.js`, `logic_travel_events.js`,
`logic_combat_encounter.js` and relevant engine files. Use the current
repository's actual responsibility boundaries if they have moved.

------------------------------------------------------------------------

## 10. Decisions that must not be invented by the implementation agent

Most B10 behavior is locked above. A small number of values were
discussed but deliberately not finalized. The implementing agent must
not silently choose values for these and then treat them as design
decisions.

**Bank default:** the exact consequence of failing to repay by the due
date remains a design decision. The Bank implementation may establish
the loan lifecycle and due-date detection, but the release behavior for
an unpaid loan must be agreed before the service is considered complete.

**Inquisitor pricing:** the rule is one Infamy removed per use, available
above Spanish reputation 50, with a price that rises with current
Infamy. The base price and scaling coefficient are not locked.

**Embassy pricing:** the rule is +5 reputation per transaction, available
above French reputation 50, with the price increasing as the target
faction's reputation gets lower. The base price and scaling coefficient
are not locked.

**British early access:** the gate is Fame 80+ and English reputation
above 50. The exact selected ships/equipment are not locked. The agent
must inspect the current ship/equipment data and propose a concrete
small list for approval rather than lowering every Fame gate.

These are the only intentionally open B10 tuning/design points. The
birth-faction values and access thresholds listed in Section 5 are
locked and must be implemented as written.

------------------------------------------------------------------------

# 11. Detailed implementation tasks

## B10.1 --- Centralize faction and service definitions

**Dependencies:** B11 and B12 foundations are complete.

**Likely impacted files:** `data.js`, relevant `logic_*.js`,
`engine_*.js`, `data_text.js`.

-   [ ] Define all five birth-faction modifiers in centralized data.
-   [ ] Define all five port-specialty identifiers and labels.
-   [ ] Define service reputation/Fame thresholds centrally.
-   [ ] Define tuning constants centrally.
-   [ ] Reuse existing helper functions where they are already
    authoritative.
-   [ ] Do not duplicate faction conditions in JSX.
-   [ ] Keep derived availability out of persistent state.
-   [ ] Preserve `birthFaction` separately from active political
    affiliation.

**Definition of done:** faction/service values have one authoritative
source and changing a tuning value does not require unrelated UI edits.

## B10.2 --- English birth identity

**Dependencies:** B10.1.

**Likely impacted files:** combat logic, faction data, combat tests.

-   [ ] Apply a 0.80 English crew-loss multiplier after normal casualty
    calculation and before final rounding/clamping.
-   [ ] Cover naval and boarding crew-loss paths.
-   [ ] Preserve existing minimum-loss/death rules.
-   [ ] Stack English and Surgeon multiplicatively.
-   [ ] Do not add damage or combat-speed penalties.
-   [ ] Add deterministic tests for normal combat, boarding,
    minimum-crew cases and English + Surgeon.

**Definition of done:** identical combat inputs produce the intended 20%
reduction for English-born captains.

## B10.3 --- Spanish birth identity

**Dependencies:** B10.1.

**Likely impacted files:** `data.js`, crew logic, port engine, crew
screen, crew-generation code, tests.

-   [ ] Enforce both Spanish-only recruitment and Spanish-port-only recruitment
    from immutable birth identity.
-   [ ] Set Spanish recruitment price to 40g.
-   [ ] Keep existing crew unchanged.
-   [ ] Preserve the restriction after political-affiliation changes.
-   [ ] Explain the restriction in the Crew UI.
-   [ ] Reuse existing crew-nationality representation.

**Definition of done:** Spanish-born captains can hire Spanish crew at
40g and cannot hire non-Spanish crew.

## B10.4 --- French birth identity

**Dependencies:** B10.1.

**Likely impacted files:** `data.js`, provision logic,
travel/reachability logic, voyage UI if required, tests.

-   [ ] Apply the French provision modifier through the authoritative
    provision calculation.
-   [ ] Preserve integer inventory quantities.
-   [ ] Target approximately 50% normal food/water consumption using the
    existing rounding convention.
-   [ ] Add +1 day to effective maximum reach.
-   [ ] Apply the reach modifier consistently to every authoritative
    reachability check.
-   [ ] Preserve the normal hull-based remote-port restriction.
-   [ ] Test exact provision and reach boundaries.

**Definition of done:** French captains consume less provision and can
reach destinations exactly one day beyond the normal effective limit.

## B10.5 --- Dutch birth identity

**Dependencies:** B10.1.

**Likely impacted files:** market logic, `engine_port.js`, market
screen, tests.

-   [ ] Set Dutch sell price to 0.95× relevant port price.
-   [ ] Set Dutch buy price to 1.05× relevant port price.
-   [ ] Integrate through the existing market-price calculation.
-   [ ] Define composition with existing B8 port-level modifiers.
-   [ ] Ensure mission cargo and free trade are not modified twice.
-   [ ] Test Dutch and non-Dutch transactions at multiple port
    modifiers.

**Definition of done:** Dutch captains receive the narrower spread
exactly once.

## B10.6 --- Pirate birth identity

**Dependencies:** B10.1 and current B12 encounter/inspection plumbing.

**Likely impacted files:** encounter/inspection logic, mission
generation, port/mission engine, data, tests.

-   [ ] Add +10 percentage points to flee/evade success.
-   [ ] Remove the normal Infamy-based Bribe availability restriction for
    Pirate-born captains while preserving any separate reputation/context
    requirement and all normal cost/outcome rules.
-   [ ] Add +10 percentage points to contraband avoidance using the
    existing inspection mechanism.
-   [ ] Ensure the bonus applies only to contraband inspection.
-   [ ] Gate smuggling mission acquisition on Pirate port faction.
-   [ ] Preserve ordinary illegal-goods market behavior at non-Pirate
    ports.
-   [ ] Add deterministic tests for each rule.

**Definition of done:** Pirate identity changes enforcement and
smuggling access without automatically reducing Infamy.

## B10.7 --- Dutch Bank

**Dependencies:** B10.1 and existing gold/reputation/Fame systems.

**Likely impacted files:** `data.js`, port/finance logic,
`screens_port.jsx`, save/storage logic, tests.

-   [ ] Add Bank specialty to Dutch ports.
-   [ ] Define minimal persistent outstanding-loan state.
-   [ ] Allow one outstanding loan.
-   [ ] Calculate ceiling from Fame and Dutch reputation.
-   [ ] Calculate interest from Dutch reputation.
-   [ ] Target 10%→5% interest range and 30-day maturity.
-   [ ] Prevent invalid loans and negative gold.
-   [ ] Show ceiling, principal, interest, total repayment and due date
    before confirmation.
-   [ ] Do not ship an unspecified default consequence: implement the due-date
    state first, then apply the separately approved default consequence.
-   [ ] Persist and restore loan state.

**Screen proposal:** a compact `BANK` panel inside PortScreen. When no
loan exists, show borrowing capacity and confirmation details. When a
loan exists, show outstanding amount and due date instead of another
borrowing form.

**Definition of done:** borrowing and loan tracking work through the
normal port flow and survive save/load.

## B10.8 --- French Diplomatic Embassy

**Dependencies:** B10.1.

**Likely impacted files:** `data.js`, reputation logic, port engine,
`screens_port.jsx`, tests.

-   [ ] Add Embassy specialty to French ports.
-   [ ] Require French reputation \>50.
-   [ ] Allow selection of another faction.
-   [ ] Purchase +5 reputation per transaction.
-   [ ] Scale price with target reputation.
-   [ ] Prevent reputation above its normal maximum.
-   [ ] Prevent zero/negative-cost transactions.
-   [ ] Reject insufficient-gold transactions.
-   [ ] Keep buying French reputation disabled unless separately
    approved.

**Screen proposal:** `DIPLOMATIC EMBASSY` panel showing target faction,
current reputation, +5 result, cost and resulting reputation.

**Definition of done:** the player understands which relationship is
being bought and what it costs.

## B10.9 --- Spanish Inquisitor Office

**Dependencies:** B10.1.

**Likely impacted files:** `data.js`, Infamy logic, port engine,
`screens_port.jsx`, tests.

-   [ ] Add Inquisitor specialty to Spanish ports.
-   [ ] Require Spanish reputation \>50.
-   [ ] Reduce Infamy by exactly 1 per transaction.
-   [ ] Increase cost with current Infamy.
-   [ ] Prevent Infamy below zero.
-   [ ] Disable the action at Infamy 0.
-   [ ] Centralize pricing constants/formula.
-   [ ] Do not modify Fame or reputation.

**Screen proposal:** `INQUISITOR OFFICE` panel showing current Infamy,
new Infamy, price and confirmation.

**Definition of done:** high Infamy is visibly more expensive to reduce
than low Infamy.

## B10.10 --- Pirate Black Market

**Dependencies:** B10.6.

**Likely impacted files:** mission generation, port engine, mission
screen, tests.

-   [ ] Add Black Market specialty to Pirate ports.
-   [ ] Restrict smuggling mission generation to Pirate ports.
-   [ ] Apply the restriction to first generation, refreshes and
    alternate mission-generation paths.
-   [ ] Prevent stale data from creating a new smuggling mission at a
    non-Pirate port.
-   [ ] Preserve accepted smuggling missions after departure.
-   [ ] Do not change ordinary illegal-goods markets.

**Definition of done:** Pirate ports are the exclusive source of
smuggling missions.

## B10.11 --- British Military Naval Yard

**Dependencies:** B10.1 and current shipyard/equipment systems.

**Likely impacted files:** `data.js`, shipyard/equipment logic,
`screens_shipyard.jsx`, port engine, tests.

-   [ ] Add Naval Yard specialty to English ports.
-   [ ] Require English reputation \>50 for equipment removal.
-   [ ] Reuse existing equipment inventory/install/remove logic.
-   [ ] Expose removal only when the service is available.
-   [ ] At Fame 80+, enable an explicit selected list of early-access
    ships/equipment.
-   [ ] Centralize the affected list and gate.
-   [ ] Do not globally lower Fame gates.
-   [ ] Preserve normal shipyard behavior elsewhere.
-   [ ] Mark early-access items clearly in the UI.

**Screen proposal:** reuse ShipyardScreen. Add a small British Naval
Yard banner/status and an `Early Access` marker to applicable items.

**Definition of done:** English ports provide practical naval-yard
advantages without duplicating the shipyard.

## B10.12 --- Navigation port-preview integration

**Dependencies:** B10.7--B10.11.

**Likely impacted files:** current navigation port-card/modal
components, `data.js`, UI tests.

-   [ ] Add faction-service descriptors to port data.
-   [ ] Render the specialty for every faction.
-   [ ] Show services even when gated.
-   [ ] Explain access requirements briefly.
-   [ ] Use the exact player-facing service names.
-   [ ] Preserve current at-sea card behavior, including the removal of
    current-port/trader-tip information and the mission-target
    indicator.
-   [ ] Do not imply a dedicated screen for Black Market or Naval Yard.
-   [ ] Keep service information compact enough not to crowd
    navigation-critical information.

**Definition of done:** clicking any port from navigation immediately
communicates its faction-specific value.

## B10.13 --- PortScreen service integration

**Dependencies:** B10.7--B10.11.

**Likely impacted files:** `screens_port.jsx`, UI components, service
logic, tests.

-   [ ] Add contextual Bank, Embassy and Inquisitor panels.
-   [ ] Add British Naval Yard service information inside the existing
    shipyard flow.
-   [ ] Add Black Market information to the existing mission/port flow
    without a redundant screen.
-   [ ] Show gated requirements where appropriate.
-   [ ] Preserve normal arrival → inspect → use services → leave flow.
-   [ ] Ensure actions update existing authoritative state.

**Definition of done:** each specialty feels like an extension of the
existing port rather than a disconnected minigame.

## B10.14 --- Save/load and migration

**Dependencies:** any B10 task introducing persistent state.

**Likely impacted files:** `engine_core.js`, `storage.js`,
migration/default-state logic, tests.

-   [ ] Add only genuinely persistent B10 fields.
-   [ ] Add defaults for existing saves.
-   [ ] Verify existing progression remains intact.
-   [ ] Verify Bank state survives save/load.
-   [ ] Verify `birthFaction` survives save/load.
-   [ ] Verify derived service availability is recalculated after load.
-   [ ] Ensure debug-modified states remain saveable/reloadable.
-   [ ] Do not add debug/save heuristics.

**Definition of done:** B10 introduces no save corruption or debug/save
coupling.

## B10.15 --- Automated behavioral test coverage

**Dependencies:** gameplay implementation.

**Likely impacted files:** `tests/tests_logic.js`,
`tests/tests_engine.js`, `tests/tests_robustness.js`,
`tests/tests_ui.js`, integration harness.

Tests must cover branches and outcomes, not merely function existence or
generic return shapes.

-   [ ] English casualty reduction with/without Surgeon, naval and
    boarding cases.
-   [ ] Spanish recruitment restriction, 40g price and
    political-affiliation change.
-   [ ] French provision thresholds and exact reach boundary.
-   [ ] Dutch buy/sell values and composition with B8 port modifiers.
-   [ ] Pirate flee/evade, Bribe access and contraband protection.
-   [ ] Pirate-only smuggling mission generation, including refresh
    paths.
-   [ ] Inquisitor access, one-point reduction and price scaling.
-   [ ] Embassy access, target selection, +5 result and price scaling.
-   [ ] Bank ceiling, rate, maturity, one-loan restriction and
    persistence.
-   [ ] British removal gate and Fame-80 early access.
-   [ ] Port-preview locked/unlocked states for all five factions.
-   [ ] Legacy/malformed state robustness.
-   [ ] Save/load migration.

**Definition of done:** every B10 rule has deterministic behavioral
coverage and every new UI surface has smoke coverage.

## B10.16 --- Documentation and handbook update

**Dependencies:** gameplay/UI behavior is stable.

**Likely impacted files:** project `README.md`, `docs/readme.md`, player
handbook/guide, developer handbook, architecture/data/logic/engine/JSX
specifications, roadmap and system indexes.

-   [ ] Document all five birth identities in player-facing language.
-   [ ] Document Spanish-only recruitment and 40g price.
-   [ ] Document English 20% crew-loss reduction.
-   [ ] Document French provision/reach advantages.
-   [ ] Document Dutch 0.95/1.05 trading.
-   [ ] Document Pirate evasion, Bribe access, inspection protection and
    Pirate-only smuggling missions.
-   [ ] Document all five port specialties and their access gates.
-   [ ] Document Bank terms once finalized.
-   [ ] Document Embassy/Inquisitor pricing formulas and final tuning
    values.
-   [ ] Document the British early-access item list.
-   [ ] Document that Black Market and Naval Yard reuse existing
    systems/screens.
-   [ ] Update data/logic/engine/JSX specifications.
-   [ ] Update save/migration documentation.
-   [ ] Update roadmap and handbook indexes.

**Definition of done:** a new developer or AI agent can understand final
B10 behavior without conversation history.

------------------------------------------------------------------------

# 12. Recommended implementation order

``` text
B10.1 Centralized faction/service data
        │
        ├── B10.2 English
        ├── B10.3 Spanish
        ├── B10.4 French
        ├── B10.5 Dutch
        └── B10.6 Pirate
                │
                ├── B10.7 Dutch Bank
                ├── B10.8 French Embassy
                ├── B10.9 Spanish Inquisitor
                ├── B10.10 Pirate Black Market
                └── B10.11 British Naval Yard
                                │
                                ├── B10.12 Navigation preview
                                └── B10.13 PortScreen
                                        │
                                        └── B10.14 Save/migration
                                                │
                                                └── B10.15 Tests
                                                        │
                                                        └── B10.16 Documentation
```

Birth-faction tasks can proceed independently after B10.1. Port services
can proceed independently after B10.1, subject to their individual
dependencies.

------------------------------------------------------------------------

# 13. Acceptance criteria

B10 is not complete merely because buttons exist.

**Birth identity:** each faction produces a practical difference during
ordinary play that the player can understand.

**Port identity:** every navigation port preview communicates its
faction specialty, including when gated.

**Economic identity:** Dutch captains use 0.95/1.05 market values;
Spanish captains recruit only Spanish crew at 40g; French captains
receive the intended provision and reach benefits.

**Combat identity:** English captains lose 20% fewer combat crew
casualties and Surgeon stacks multiplicatively.

**Criminal identity:** Pirate captains receive the flee/evade, Bribe,
inspection and smuggling advantages without automatic Infamy reduction.

**Political identity:** Dutch, French and Spanish port services create
concrete reasons to maintain reputation.

**Progression identity:** the British Naval Yard provides equipment
removal above English reputation 50 and selected early access at Fame
80+ without globally changing shipyard gates.

**Robustness:** old saves load correctly; new persistent state survives
save/load; no service creates invalid gold, reputation, Infamy, loans,
equipment, recruitment or missions.

**Maintainability:** faction/service rules are centralized and UI does
not duplicate them.

**Documentation:** player and developer documentation describe the same
implemented behavior.

------------------------------------------------------------------------

# 14. Balance validation

The existing coarse career simulator remains a balance instrument rather
than an exact reproduction.

The seven diagnostic profiles remain useful:

-   random faction / low risk;
-   random faction / high risk;
-   Dutch trader;
-   Pirate smuggler;
-   English privateer;
-   Spanish mixed;
-   French opportunist.

Compare final wealth, Fame progression, crew loss, crew hiring cost,
provision cost, mission income, trade income, smuggling income, plunder
income, reputation and Infamy trajectories, and time to major ship
upgrades.

The simulator's Spanish recruitment-availability approximation is only a
balance-testing simplification and is not the gameplay rule.

The objective is differentiated career shape, not exact mathematical
parity. No identity should be universally optimal, and no identity
should be so weak that its defining mechanic is effectively invisible.

------------------------------------------------------------------------

# 15. Rejected, deferred and unresolved items

### Rejected --- English damage bonus

A direct Broadside/Precision damage bonus would risk making English the
obvious combat-optimal choice. Crew preservation is more consistent with
the intended identity after B11.

### Rejected --- English combat-speed penalty

An artificial combat-speed penalty has weak thematic justification and
makes the identity harder to understand.

### Rejected --- English plunder penalty

Punishing successful combat/plunder income would penalize a legitimate
combat outcome without strengthening the intended identity.

### Rejected --- Spanish free crew

Spanish crew are cheap at 40g, not free. Free recruitment would make the
advantage disproportionately strong.

### Rejected --- Spanish restriction without compensation

Spanish-only recruitment is retained because it is paired with the 40g
recruitment advantage.

### Rejected --- Pirate crew/wage identity

Earlier Pirate free-crew, wage-exemption and tribute proposals are not
part of B10. Pirate identity is now enforcement/evasion/smuggling
focused.

### Rejected --- Pirate automatic Infamy reduction

Pirates gain tools to avoid or survive enforcement; they do not erase
criminal consequences automatically.

### Rejected --- French removal of the heavy-hull/100+ HP barrier

The chosen French navigation advantage is +1 day effective reach.

### Rejected --- permanent French mission-gold penalty

French identity is an endurance/exploration identity rather than a
blanket mission-income penalty.

### Rejected --- cosmetic port identities

Port specialties must have practical mechanical consequences.

### Rejected --- dedicated minigames for every faction

Services should reuse existing economy, reputation, Infamy, mission and
shipyard systems.

### Deferred --- full Letter of Marque redesign

B10 preserves birth identity separately from political affiliation but
does not define the full Letter of Marque progression or stacked hybrid
identity system.

### Deferred --- exact Bank default consequence

The Bank must not silently erase debt, but the exact consequence
requires an explicit economy/risk decision before release.

### Deferred --- exact Embassy and Inquisitor price constants

The formulas are defined, but exact base/scaling values remain tuning
parameters until checked against the current economy.

### Deferred --- exact British early-access list

Fame 80+ is locked as the threshold; the selected ships/equipment must
be chosen from current data and documented before implementation.

### Out of scope --- new tutorial popup system

B10 does not require a new onboarding popup for every service.
Navigation preview, PortScreen and existing UI conventions are the
primary discovery mechanisms.

### Out of scope --- Living Caribbean

No B10 work should introduce faction wars, dynamic territorial control,
changing port ownership, persistent world reactions, global political
events, faction-wide economic simulation, major story arcs or new
victory conditions.

------------------------------------------------------------------------

# 16. Final design intent

The intended player experience is not:

> "I selected a faction and received a passive bonus."

It is:

> "My captain's origin makes some careers easier and others less
> convenient, while the political map contains ports whose services are
> worth maintaining relationships with."

A Dutch captain should value Dutch ports for both commercial margins and
access to the Bank.

A Pirate captain should value Pirate ports because they are the source
of smuggling missions, while also having better tools for evasion and
inspection.

A Spanish captain should value Spanish crew and Spanish access to the
Inquisitor Office.

A French captain should be able to sustain longer voyages and use French
diplomatic influence to repair damaged relationships.

An English captain should value reduced boarding casualties and, once
politically established, special naval-yard services.

This network of incentives is the purpose of B10. It creates
differentiated careers and meaningful political choices without turning
B10 into a simulation of the Caribbean itself.
