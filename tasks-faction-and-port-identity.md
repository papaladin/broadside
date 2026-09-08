Yes. Given the confusion from earlier task lists, I would make this one deliberately **implementation-oriented, self-contained, and limited to what remains**. It should supersede older B10 port-service lists.

# B10 — Remaining Port Identity Implementation

This task list **supersedes previous B10 port-service task lists**.

The port-specialty design is now numerically specified. Do not redesign the mechanics or invent alternative values unless a concrete implementation conflict requires it.

## 1. Architecture: dedicated faction-service screens

Create a new UI module:

```text
screens_FactionService.jsx
```

This file should contain the dedicated screens for faction-specific port services.

Required screens/components:

```text
ScreenBank
ScreenInquisitor
ScreenEmbassy
```

The screens should be entered from the normal port interface and should contain the information and actions relevant to that service.

Do **not** implement these services as increasingly large inline sections inside the generic port screen.

### ScreenBank

Display:

* Dutch Bank name / identity
* player's Dutch reputation
* current outstanding debt, if any
* available borrowing capacity
* applicable interest rate
* resulting repayment obligation if a loan is taken
* automatic repayment rule: 20% of qualifying income
* full-repayment option when debt exists
* clear confirmation before taking a loan
* clear success/failure result

### ScreenInquisitor

Display:

* Spanish Inquisitor Office identity
* player's Spanish reputation
* current Infamy
* cost for the next −1 Infamy
* exact result of the transaction
* disabled/locked state when Spanish Rep <50

Action:

```text
Pay cost → Infamy −1
```

Do not provide bulk Infamy reduction.

### ScreenEmbassy

Display:

* French Diplomatic Embassy identity
* player's French reputation
* target faction selector
* target faction's current reputation
* cost for +5 reputation
* resulting reputation
* disabled/locked state when French Rep <50

Action:

```text
Pay cost → target faction reputation +5
```

The target may include France itself.

---

## 2. Implement / verify the service data in `data.js`

Ensure `SERVICE_THRESHOLDS` contains the complete numerical specification.

### Inquisitor

```js
repRequired: 50

pricing:
0–19   → 250
20–39  → 400
40–59  → 600
60–79  → 850
80–99  → 1150
100+   → 1500
```

### Embassy

```js
repRequired: 50

pricing:
0–19   → 500
20–39  → 1000
40–59  → 1750
60–79  → 3000
80–94  → 5000
95+    → 8000
```



### Naval Yard

```js
equipment Fame requirement modifier = ×0.80
ship Fame requirement modifier = −10 Fame
```

Requirements:

* Rep >50 → equipment removal/unmount
* Fame ≥80 → early-access service
* Applies to all ships and equipments, as long as the requirements are met.

### Bank

```js
repRequired: 30
loanCap: 300000
baseLoan: 500
fameFactor: 850

repFactor:
  min: 0.4
  max: 1.0
  repMin: 30
  repMax: 100

interestRate:
  min: 0.05
  max: 0.20

garnishPercent: 0.20
```

Loan capacity:

- **Loan capacity formula:**
  ```
  maxLoan = min( (500 + fame * 850) * repFactor, 300000 )
  repFactor = 0.4 + 0.6 * clamp((dutchRep - 30) / 70, 0, 1)
  ```

Interest:

 ```
  interestRate = 0.20 - (dutchRep - 30) / 70 * 0.15
  ```

Therefore:

```text
Dutch Rep 30  → 20% interest
Dutch Rep 100 → 5% interest
```


```js
bank: {
  repRequired: 30,
  loanCap: 300000,
  baseLoan: 500,
  fameFactor: 850,
  repFactor: { min: 0.4, max: 1.0, repMin: 30, repMax: 100 },
  interestRate: { min: 0.05, max: 0.20 },
  garnishPercent: 0.20,
}
```
---

## 3. Implement Dutch Bank loan state and transactions

Implement the loan as a persistent part of game state.

Required behavior:

### Taking a loan

Player selects an amount up to the currently available maximum.

On confirmation:

1. Calculate applicable interest.
2. Calculate total repayment obligation.
3. Add borrowed gold to player gold.
4. Store the outstanding repayment obligation.
5. Prevent taking another loan while one is outstanding.

### Automatic repayment

Every qualifying income event automatically sends:

```text
20% of income → loan repayment
80% → player
```

Repayment continues until the outstanding obligation reaches zero.

When the final repayment is smaller than 20% of the income event:

```text
actual repayment = remaining debt
player receives the rest
debt = 0
```

Do not allow overpayment.

### Full repayment

At a Dutch Bank, if a loan is outstanding:

```text
Repay remaining debt in full
```

must be available.

After repayment:

* debt = 0
* loan becomes available again
* no additional automatic deductions occur

### No separate default system

Do not implement:

* repayment deadline
* missed-payment penalty
* bankruptcy/default state
* separate late fee

The automatic 20% income deduction is the repayment/default mechanism.

---

## 4. Define qualifying income events

Do not implement the 20% deduction by watching arbitrary changes to the player's gold balance.

The engine should identify actual income events.

At minimum:

```text
Mission rewards
Trade profits / qualifying trade income
Plunder gold
```

Do not accidentally garnish:

```text
Starting gold
Loan proceeds
Refunds
Internal transfers
Other non-income state adjustments
```

For ambiguous sources such as ship sales or equipment sales, follow the existing economy classification rather than creating a new interpretation solely for B10.

The important implementation rule is:

> Garnish is triggered by explicit income events, not by detecting that `gold` increased.

---

## 5. Implement Spanish Inquisitor mechanics

Create a logic-layer calculation for Inquisitor pricing.

Inputs:

```text
Spanish reputation
Current Infamy
```

Rules:

* Spanish Rep must be ≥50.
* Cost determined by current Infamy table.
* Each successful transaction reduces Infamy by exactly 1.
* Player must have enough gold.
* No bulk reduction.
* No negative Infamy.

Transaction should go through the engine/domain layer rather than directly mutating state from the screen.

---

## 6. Implement French Embassy mechanics

Create a logic-layer calculation for Embassy pricing.

Inputs:

```text
French reputation
Target faction
Target faction reputation
```

Rules:

* French Rep must be ≥50.
* Player chooses target faction.
* Purchase amount is always +5.
* Cost comes from target reputation table.
* France may be selected as the target.
* Do not allow reputation to exceed the game's normal maximum.
* Player must have enough gold.

The screen displays the current target reputation and resulting reputation before confirmation.

---

## 7. Complete English Naval Yard content

The numeric rules are fixed, but the **specific early-access content list is still open**.

Select a small concrete list of:

* ships receiving the −10 Fame requirement
* equipment receiving the ×0.80 Fame requirement

Document that list in `data.js` and/or the appropriate content documentation.

Do not apply these modifiers globally to every ship/equipment item.

Also implement/verify:

```text
English Rep >50
→ equipment removal/unmount available

Fame ≥80
→ selected early-access content becomes available
```

The Naval Yard should have its own dedicated service screen only if the existing port architecture requires it; the current B10 requirement for dedicated screens explicitly covers:

```text
ScreenBank
ScreenInquisitor
ScreenEmbassy
```

Do not expand this architectural requirement unnecessarily.

---

## 8. Verify Pirate Black Market

No new numerical data is required.

Existing generator behavior should enforce:

```text
Smuggling missions
    ↓
Pirate ports only
```

Verify that no other port can generate the mission.

Do not introduce another Pirate-port economy mechanic.

---

## 9. Update the generic port screen

The generic port screen should act as the **entry point**, not the implementation container.

It should show the faction specialty and provide an action such as:

```text
Dutch Port
→ Visit Bank

Spanish Port
→ Visit Inquisitor

French Port
→ Visit Embassy
```

The player should be able to understand the service before entering it.

The port preview should continue to show the faction specialty even when the service is currently gated.

Examples:

```text
Inquisitor
Requires Spanish Rep 50

Embassy
Requires French Rep 50

Bank
Requires Dutch Rep 30
```

Do not silently hide unavailable services.

---

## 10. Wire navigation cleanly

Add the new screens to the existing screen/navigation architecture.

Required flow:

```text
Port
  ↓
Faction Service
  ↓
Dedicated service screen
  ↓
Perform transaction
  ↓
Return to Port
```

Returning from a service screen must preserve all updated state correctly.

Do not duplicate port state locally in the service screens.

The screens should consume current game state and dispatch engine actions.

---

## 11. Add logic-layer tests

Test the pure calculations independently from UI.

### Inquisitor

Test:

* each Infamy pricing bracket
* Rep <50 blocked
* insufficient gold
* Infamy 0 cannot decrease
* exactly 1 Infamy removed

### Embassy

Test:

* each target-reputation pricing bracket
* Rep <50 blocked
* each target faction
* France as target
* insufficient gold
* +5 result
* reputation cap handling

### Bank

Test:

* Rep <30 blocked
* rep-factor calculation
* interest calculation
* Fame scaling
* 300,000g maximum cap
* minimum/maximum reputation endpoints
* loan amount validation
* repayment-obligation calculation
* 20% income garnish
* final partial garnish
* full repayment
* no second loan while debt exists

### English Naval Yard

Test:

* equipment Fame ×0.80
* ship Fame −10
* Rep >50 removal gate
* Fame ≥80 access gate
* non-listed items remain unchanged

---

## 12. Add engine/integration tests

Test complete state transitions rather than only helper functions.

At minimum:

```text
Take Dutch loan
→ receive gold
→ generate income
→ automatic repayment
→ eventually clear debt
```

```text
Visit Spanish Inquisitor
→ pay
→ Infamy −1
```

```text
Visit French Embassy
→ select faction
→ pay
→ target reputation +5
```

```text
Visit English Naval Yard
→ eligible service available
```

Also verify save/load persistence for:

```text
Outstanding loan
Repayment obligation
```

---

## 13. Documentation cleanup

Update B10 documentation so it reflects the now-fixed design.

The documentation should include:

### Birth identities

* English: −20% crew losses
* Spanish: Spanish crew only, 40g recruitment
* French: −25% food/water +1 voyage day
* Dutch: buy ×1.05 / sell ×0.95
* Pirate: +10pp evade, Bribe Infamy gate removed, +10pp contraband avoidance

### Port identities

* English Naval Yard
* Spanish Inquisitor
* French Embassy
* Dutch Bank
* Pirate Black Market

Include all numerical tables/formulas from this specification.

Do not retain older alternative values.

---

# B10 Port Work — Definition of Done

B10 port identity is complete when:

* [ ] `screens_FactionService.jsx` exists.
* [ ] `ScreenBank` exists and is fully functional.
* [ ] `ScreenInquisitor` exists and is fully functional.
* [ ] `ScreenEmbassy` exists and is fully functional.
* [ ] Bank loan formulas are implemented exactly as specified.
* [ ] 20% automatic income repayment works.
* [ ] Full loan repayment works at Dutch ports.
* [ ] Inquisitor pricing table is implemented.
* [ ] Embassy pricing table is implemented.
* [ ] English early-access modifiers are implemented.
* [ ] English early-access item list is explicitly defined.
* [ ] Pirate smuggling exclusivity is verified.
* [ ] Generic Port screen links to the appropriate service screen.
* [ ] Gated services remain visible with their requirements.
* [ ] Logic tests pass.
* [ ] Engine/integration tests pass.
* [ ] Save/load of loan state passes.
* [ ] B10 documentation contains only the finalized rules.

## Explicitly out of scope

Do **not** add these as part of this B10 port task:

* Letter of Marque
* additional Pirate-port services
* new faction identities
* redesign of the five faction concepts
* a generic service-screen framework beyond what is needed for these screens
* new loan default/penalty mechanics
* bulk Infamy removal
* reputation purchases other than the specified +5 Embassy action

This should give the other agent a much cleaner boundary: **the design is settled; the remaining work is implementation, the English content-list decision, and verification.**
