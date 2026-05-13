# Test Cases to Create for Caribbean Pirates

This document lists all recommended test cases from the testing plan.  
They are organized by category: **Unit**, **Reducer**, **Integration**, **Scenario**, and **UI Smoke**.

---

## A. Unit Tests (logic.js – Pure Functions)

### Travel / Distance
- [ ] **L.01** `travelDays` – basic distance between two ports, normal conditions → returns days ≥ 1
- [ ] **L.02** `travelDays` – favorable wind (within 45° of route direction) reduces days
- [ ] **L.03** `travelDays` – opposing wind (180° off route) increases days
- [ ] **L.04** `travelDays` – low morale (<30) adds penalty days (1 or 2 extra)

### Ship Stats & Upgrades
- [ ] **L.05** `getShipStats` – no upgrades: returns raw ship stats (hull, cannons, speed, etc.)
- [ ] **L.06** `getShipStats` – "Reinforced Hull" adds +20% max hull (floored)
- [ ] **L.07** `getShipStats` – "Extra Cannons" adds +2 cannons
- [ ] **L.08** `getShipStats` – "Copper-Plated Hull" and "Navigational Tools" each add +1 speed
- [ ] **L.09** `getShipStats` – "Ornate Figurehead" adds +5 morale bonus (tracked in `moraleBonus`)
- [ ] **L.10** `getEffectiveMorale` – no upgrades: returns raw crew morale, capped at 100
- [ ] **L.11** `getEffectiveMorale` – with figurehead: morale = crew.morale + 5 (max 100)
- [ ] **L.12** `hasUpgrade` – returns true if upgrade key is in ship.upgrades, false otherwise

### Crew & Wages
- [ ] **L.13** `payCrewWages` – normal morale (≥30): daily wages = crew.current * 2
- [ ] **L.14** `payCrewWages` – low morale (<30): multiplier 1.5 → wages = crew.current * 2 * 1.5

### Missions
- [ ] **L.15** `generateMissions` – port with mission service, sufficient rep → returns 2‑3 missions
- [ ] **L.16** `generateMissions` – high‑risk missions hidden if player rep < 40
- [ ] **L.17** `generateMissions` – only missions of port’s faction (or pirate) are offered
- [ ] **L.18** `generateMissions` – medium‑risk missions hidden if player rep < 20

### Events
- [ ] **L.19** `triggerRandomEvent` – without conditions, returns a random event
- [ ] **L.20** `triggerRandomEvent` – conditional event (e.g., mutiny at morale<20) only triggers when condition true

### Reputation
- [ ] **L.21** `reputationLabel` – returns correct label for thresholds: Allied ≥80, Friendly 60‑79, Neutral 40‑59, Unfriendly 20‑39, Hostile 10‑19, At War <10
- [ ] **L.22** `decayReputation` – every port drops by 1, never below 0
- [ ] **L.23** `applyReputationImpact` – changes all ports of a given faction by delta, clamped 0‑100
- [ ] **L.24** `updateReputation` – single port update, clamped 0‑100

### Repair
- [ ] **L.25** `shipRepairCost` – returns (effectiveMaxHull – currentHull) * 2 gold

### Combat Core
- [ ] **L.30** `resolveCombatAction` – **Broadside**: hits enemy hull (60%) and crew (40%), player also receives NPC damage
- [ ] **L.31** `resolveCombatAction` – **Precision**: 70% accuracy; if hit, high hull damage (90%), low crew damage (10%)
- [ ] **L.32** `resolveCombatAction` – **Grapple (success)**: instant victory (no damage) when conditions met (crew/morale advantage)
- [ ] **L.33** `resolveCombatAction` – **Grapple (failure)**: player loses 30‑50% crew, no hull damage
- [ ] **L.34** `resolveCombatAction` – **Evade (success)**: fled = true, no damage taken
- [ ] **L.35** `resolveCombatAction` – **Evade (fail)**: player takes reduced enemy damage
- [ ] **L.36** `resolveCombatAction` – Morale modifier: high morale (>70) reduces player damage by ×0.9; low morale (<30) increases by ×1.2
- [ ] **L.37** `resolveCombatAction` – NPC actions: verify NPC picks weighted random action (broadside 60%, precision 20%, grapple 10%, evade 10%) and deals appropriate damage

### Save / Load
- [ ] **L.40** `hasSave` – returns true if save exists in localStorage
- [ ] **L.41** `saveGame` – stores state as JSON under correct key (`pirates_save` or `piratesSave` – consistency important)
- [ ] **L.42** `loadGame` – returns parsed state if save exists, null otherwise

---

## B. Reducer Tests (engine.js – State Transitions)

### Start & Navigation
- [ ] **E.01** `START_GAME` – merchant scenario: +2000 gold, ship = merchantman, crew adjusted to new max, screen = "port"
- [ ] **E.02** `START_GAME` – privateer scenario: sloop, +500 gold, English rep +10
- [ ] **E.03** `START_GAME` – pirate scenario: brigantine, +20 Pirate rep, +1000 gold
- [ ] **E.04** `START_GAME` – admiral scenario: frigate, +30 English rep, +1500 gold
- [ ] **E.05** `START_GAME` – invalid scenario ID → returns initial state with screen "start"
- [ ] **E.06** `SAIL_TO` – sets destination, sailingDaysLeft, sailingDaysTotal, screen = "sailing", log entry
- [ ] **E.07** `ENTER_PORT` (normal) – updates currentPort, resets sailing, generates missions, screen = "port"
- [ ] **E.08** `ENTER_PORT` (hostile, rep < 10) – triggers battleState with port guards, screen = "battle"

### Daily Advancement
- [ ] **E.09** `ADVANCE_DAY` – reduces sailingDaysLeft by 1, deducts wages, day +1
- [ ] **E.10** `ADVANCE_DAY` – with active smuggle mission, first call may trigger combat (intercept chance)
- [ ] **E.11** `ADVANCE_DAY` – random event (10%) sets activeEvent and screen to "event"
- [ ] **E.12** `ADVANCE_DAY` – morale decays by 1 if already <30

### Port Services
- [ ] **E.13** `REPAIR` – hull restored to effective max, gold deducted
- [ ] **E.14** `REPAIR` (insufficient gold) – no change, log message
- [ ] **E.15** `BUY_SHIP` – ship type changed, hull/cannons set, upgrades cleared, crew max updated, gold deducted
- [ ] **E.16** `BUY_SHIP` (not enough gold) – state unchanged
- [ ] **E.17** `BUY_UPGRADE` – upgrade installed, gold subtracted, log entry
- [ ] **E.18** `BUY_UPGRADE` (already installed) – only log message
- [ ] **E.19** `BUY_UPGRADE` (incompatible ship) – no change, log
- [ ] **E.20** `HIRE_CREW` – adds crew up to max, gold deducted (50g/sailor)

### Missions
- [ ] **E.21** `TAKE_MISSION` – combat type: sets battleState, screen = "battle"
- [ ] **E.22** `TAKE_MISSION` – trade/escort type: only sets activeMission
- [ ] **E.23** `COMPLETE_MISSION` – at target port: gold/fame added, rep updated, activeMission cleared, missions refreshed
- [ ] **E.24** `COMPLETE_MISSION` – wrong port: no reward, log message
- [ ] **E.25** `ABANDON_MISSION` – active mission cleared, rep penalty for mission’s faction
- [ ] **E.26** `REFRESH_MISSIONS` – generates new missions for current port

### Combat
- [ ] **E.27** `BATTLE_ACTION` – victory (enemy hull ≤0) → phase = "victory"
- [ ] **E.28** `BATTLE_ACTION` – defeat (player hull ≤0) → phase = "defeat", ship hull = 0, return to port
- [ ] **E.29** `BATTLE_ACTION` – flee (from Evade) → phase = "fled"
- [ ] **E.30** `BATTLE_ACTION` – grapple instant victory → phase = "victory"
- [ ] **E.31** `DISMISS_BATTLE` – after victory and combat/assault mission → auto‑complete mission, rewards
- [ ] **E.32** `DISMISS_BATTLE` – after fled while sailing → continue sailing (screen = "sailing")
- [ ] **E.33** `DISMISS_BATTLE` – after victory with no mission → return to appropriate screen

### Events
- [ ] **E.34** `RESOLVE_EVENT` – gold gain/loss applied
- [ ] **E.35** `RESOLVE_EVENT` – hull damage applied
- [ ] **E.36** `RESOLVE_EVENT` – crew loss applied
- [ ] **E.37** `RESOLVE_EVENT` – days lost applied
- [ ] **E.38** `RESOLVE_EVENT` – reputation changes applied
- [ ] **E.39** `RESOLVE_EVENT` – battle triggered by event outcome

### Save / Load
- [ ] **E.40** `SAVE_GAME` – state stored in localStorage, log entry
- [ ] **E.41** `LOAD_GAME` – restores full state (screen becomes "port")
- [ ] **E.42** `LOAD_GAME` – no save found: log message, state unchanged
- [ ] **E.43** `LOAD_GAME` – corrupted save: log message, state unchanged

---

## C. Integration Tests (Multiple Actions Chained)

- [ ] **I.01** Basic voyage: Start → SAIL_TO → ADVANCE_DAY (until arrival) → ENTER_PORT. Verify correct port, missions generated.
- [ ] **I.02** Trade mission completion: Accept trade mission, sail to target, enter port, complete. Check gold/fame/rep.
- [ ] **I.03** Combat mission – victory: Accept combat mission, dispatch actions until enemy sunk, dismiss battle, verify rewards.
- [ ] **I.04** Defeat in combat: Reduce player hull to 0 via actions, verify defeat phase, forced return to port, hull/crew reduced.
- [ ] **I.05** Smuggle mission intercept: Accept smuggle, SAIL_TO, ADVANCE_DAY (force intercept), win battle, continue sailing, enter port, complete.
- [ ] **I.06** Ship purchase & upgrade flow: With enough gold, buy frigate, install extra cannons. Check effective stats and gold.
- [ ] **I.07** Crew hiring & wage scaling: Hire max crew, advance days many times; verify wage deduction and morale decay + low morale wage increase.
- [ ] **I.08** Hostile port entry: Lower rep to 9, sail to that port, enter port → battle triggered; win, then see low rep remains.
- [ ] **I.09** Event resolution: Force event, choose option, apply outcomes, return to sailing/port.
- [ ] **I.10** Save & load cycle: Play some actions, save, reset state, load, verify all key fields restored.

---

## D. High‑Level Scenario Tests (User Simulation)

- [ ] **S.01** Full voyage UI: Start → click World Map → click Tortuga → Advance Day until arrived → Enter Port. Verify Port screen at Tortuga.
- [ ] **S.02** Purchase ship & check HUD: Start admiral, go to Shipyard, buy Galleon, return to Port; verify HUD shows new hull/crew.
- [ ] **S.03** Combat mission via UI: Accept combat mission, use Broadside repeatedly until victory, dismiss battle, verify gold/fame in HUD.
- [ ] **S.04** Crew hiring & manifest: Go to Crew screen, hire 10, check manifest icon count, verify gold decrease.
- [ ] **S.05** Low morale warning: Force morale to 25%, check Crew screen shows warning.
- [ ] **S.06** Save & Continue: Start game, save, reload page, click Continue Saved Game, verify restored state.
- [ ] **S.07** Upgrade ship & see stat changes: Install reinforced hull, check ship status shows updated hull and upgrade pill.
- [ ] **S.08** Multiple mission completions: Accept and complete two trade missions sequentially, check cumulative gold/fame.
- [ ] **S.09** Faction screen reflects reputation changes after mission.
- [ ] **S.10** Random event while sailing: Advance day until event triggers, resolve, return to sailing.

---

## E. UI Smoke Tests (Component Rendering)

- [ ] **U.01** `StartScreen` – renders all starting scenarios as clickable cards (check text)
- [ ] **U.02** `PortScreen` – shows current port name, mission board, ship status, Captain’s Log
- [ ] **U.03** `MapScreen` – SVG contains port circles, "Back to Port" button, wind rose
- [ ] **U.04** `SailingScreen` – shows origin/destination names, progress bar, wind rose
- [ ] **U.05** `ShipyardScreen` – lists all ships and upgrades, repair button
- [ ] **U.06** `CrewScreen` – shows hire buttons, manifest icons, morale bar
- [ ] **U.07** `FactionsScreen` – shows faction panels with reputation bars
- [ ] **U.08** `EventScreen` – renders event title, description, and choice buttons
- [ ] **U.09** `BattleScreen` – shows player/enemy hull bars, action buttons, battle log
- [ ] **U.10** `HUD` (in App) – when screen ≠ "start", gold/day/crew/hull/morale/port displayed

---

## F. Additional Tests (bugs / edge cases)

- [ ] LocalStorage key consistency: both `L.hasSave`/`saveGame`/`loadGame` and the reducer use the same key
- [ ] `getShipStats` with invalid upgrade key – should not crash
- [ ] `applyReputationImpact` with empty object – no change
- [ ] `resolveCombatAction` with `battleState` undefined – should handle gracefully
- [ ] `generateMissions` when no eligible missions – returns empty array
- [ ] `ADVANCE_DAY` when already arrived – no change
- [ ] `BUY_SHIP` to a smaller ship – crew current capped at new max, upgrades reset
- [ ] `HIRE_CREW` when already at max – no hire, log message
- [ ] `COMPLETE_MISSION` without active mission – no crash
- [ ] Reputation clamping (0‑100) during many decays and gains