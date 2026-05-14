## Phase 1 – Player Progression & Endgame: Task List

### 1. Fame System (core unlocks, HUD)
- [ ] **data.js** – Add `requiredFame` field to `SHIPS` (e.g., galleon 200, frigate 100, etc.).
- [ ] **data.js** – Add `requiredFame` to selected `UPGRADES` (e.g., copper hull 100, extra cannons 50).
- [ ] **data.js** – Add `requiredFame` to `MISSION_POOL` entries for high‑risk missions.
- [ ] **logic.js** – (No pure functions needed, filtering done in UI).
- [ ] **engine.js** – No reducer changes required; fame is already in state.
- [ ] **screens.jsx** – Modify `ShipyardScreen` to grey out ships/upgrades if `fame < requiredFame`, show requirement.
- [ ] **screens.jsx** – Modify `PortScreen` mission board filter to hide missions requiring more fame.
- [ ] **App.jsx** – Add fame display to HUD (next to gold, e.g., `★ {state.fame}`).
- [ ] **tests.js** – Add unit/reducer tests for fame gating (try buying gated ship with insufficient fame).
- [ ] **tests.js** – Add UI smoke test for fame visibility in HUD and shipyard.
- [ ] **architecture.md** – Document fame field and its effects on unlocks.
- [ ] **README.md** – Update feature list to mention fame progression.

### 2. Reputation Perks
- [ ] **data.js** – Define perks per reputation tier: `ALLIED` (≥80) → repair cost -10%; `HOSTILE` (<10) → gold from plunder +20%. Could store in `FACTIONS` or a new constant.
- [ ] **logic.js** – (Optional) Create a pure function `getReputationPerk(state, perkType)` returning modifier.
- [ ] **engine.js** – Apply repair discount in `A.REPAIR` if player is Allied with current port’s faction.
- [ ] **engine.js** – Apply plunder bonus in `BATTLE_ACTION` / `DISMISS_BATTLE` if attacking a Hostile faction’s ship (not just hostile port entry). Decide scope: maybe any combat against a faction where player rep <10 gives bonus.
- [ ] **screens.jsx** – Show active perk in Port screen (e.g., Pill “Allied bonus: 10% off repair”).
- [ ] **tests.js** – Test repair cost reduction when Allied.
- [ ] **tests.js** – Test gold bonus when plundering Hostile faction ship.
- [ ] **architecture.md** – Document reputation perk system.

### 3. Crew Specialists
- [ ] **data.js** – Define specialist types: `{ id, name, trait, effect }` (e.g., Gunner: +10% cannon damage, Navigator: -1 travel day, Doctor: reduce crew loss by 20%).
- [ ] **data.js** – Add specialist hiring chance to port services (new service “tavern”) or via random events.
- [ ] **logic.js** – Modify `getShipStats` to apply specialist effects if active (e.g., `cannons *= 1.1` if Gunner).
- [ ] **logic.js** – Modify `payCrewWages` if a Boatswain reduces wages?
- [ ] **engine.js** – Add `crew.specialists` array to state (initial empty).
- [ ] **engine.js** – Add action `HIRE_SPECIALIST` (cost gold, limited slots).
- [ ] **engine.js** – Integrate specialist effects into combat, travel, etc. via calls to logic functions.
- [ ] **screens.jsx** – Add “Tavern” section to PortScreen (if port has service) to hire specialists.
- [ ] **screens.jsx** – Update CrewScreen to show active specialists and their bonuses.
- [ ] **tests.js** – Unit tests for specialist modifiers.
- [ ] **tests.js** – Reducer tests for hiring, max slots.
- [ ] **tests.js** – UI smoke test for specialist display.
- [ ] **architecture.md** – Document specialist system.
- [ ] **README.md** – Update feature list.

### 4. Bounty Hunter System
- [ ] **data.js** – Define hunter ship templates (scaled to player fame/notoriety).
- [ ] **logic.js** – `calculateNotoriety(state)` = fame + (negative rep * 2) or similar.
- [ ] **logic.js** – `shouldSpawnHunter(state)` using notoriety and random chance.
- [ ] **engine.js** – On `ADVANCE_DAY`, check for hunter spawn; if yes, create a battle with a hunter ship (enemy faction based on most hostile faction). Interrupt sailing (like an event, go to battle).
- [ ] **engine.js** – Hunter defeat rewards: high gold, fame, maybe a special item.
- [ ] **screens.jsx** – Add hunter encounter as a special event screen or directly into battle.
- [ ] **screens.jsx** – Show notoriety level somewhere (e.g., FactionsScreen).
- [ ] **tests.js** – Unit test for notoriety calculation.
- [ ] **tests.js** – Integration test: reach high notoriety, advance days, verify battle triggers.
- [ ] **tests.js** – UI test for hunter warning if desired.
- [ ] **architecture.md** – Document bounty system.

### 5. Retirement & Endgame
- [ ] **data.js** – Define epilogue texts by score thresholds.
- [ ] **logic.js** – `calculateFinalScore(state)` using formula (gold, fame, ship value, etc.).
- [ ] **logic.js** – `getEpilogue(score)` returns story text.
- [ ] **engine.js** – Add action `RETIRE` (available from port screen when fame ≥ 500). Sets screen to “retirement”.
- [ ] **engine.js** – Add `RETIRE` reducer that calculates score, stores it, and sets a flag.
- [ ] **screens.jsx** – Create `RetirementScreen` component showing score, epilogue, and options: “New Game+” or “Return to Main Menu”.
- [ ] **App.jsx** – Route `screen === "retirement"` to RetirementScreen.
- [ ] **tests.js** – Unit test score calculation.
- [ ] **tests.js** – Reducer test: RETIRE action changes screen and stores result.
- [ ] **tests.js** – UI smoke test for RetirementScreen rendering.
- [ ] **architecture.md** – Document endgame mechanics.
- [ ] **README.md** – Update feature list with endgame.

### 6. Documentation & Final Integration
- [ ] **architecture.md** – Ensure all Phase 1 changes are reflected in mechanics and state shape.
- [ ] **README.md** – Update feature list, possibly add “How to Win” section.
- [ ] **tests.js** – Add any missing integration/scenario tests for combined flows (e.g., reach fame 500 via trading, hire specialist, retire).
- [ ] **tests.html** – (No changes expected unless new utilities needed).