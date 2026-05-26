# Broadside — Development Roadmap

---

## Design Philosophy

> **The goal is not many mechanics. It is a few mechanics that interact strongly.**

The game should feel alive and pressured — not because it scripts dramatic moments, but because small systems constantly push against each other and produce emergent stories the player didn't expect. Every mechanic added should be evaluated against two questions:

1. **Does it interact with at least two existing systems?** Isolated mechanics are content. Interacting mechanics are emergence.
2. **Does every success create a new problem?** Bigger ship → more provisions needed. High fame → bounty hunters. Elite crew → wage demands. Rich cargo → pirate attention. Forward momentum must always carry new costs.

### Core emotional targets

- **Pressure**: the player should always have reasons to act rather than sit still. Time, money, morale, and the world itself should push.
- **Consequence**: the world remembers what you did. Factions, NPCs, and your own crew carry history.
- **Attachment**: the player should care about their ship, their crew, and their reputation — because those things took time to build and can be lost.
- **Emergent stories**: the best moments in the game should be ones no one designed. They should arise from systems colliding.

### What this game is

> A systemic pirate RPG where the player creates emergent stories through faction politics, crew drama, dangerous travel, and reputation.

### What this game is not

- A naval combat simulator
- A grand strategy game
- A realistic economy simulator
- A base-building game

---

## Architecture Principles (locked)

| Decision | Rationale |
|---|---|
| Fixed map, unlockable areas | Player knowledge accumulates. Geography is learnable and meaningful. |
| Parametric randomization, not procedural generation | Structure is fixed, values vary within ranges. Emergence from interaction, not from generation. |
| Random events: condition-gated, regionally weighted | Events feel appropriate to context. No full proc-gen. |
| Hidden locations: fixed positions | Consistent with fixed map. Discovery is exploration reward, not generation. |
| Enemy ships: parametric stat ranges, faction-appropriate | Nameless encounters need no identity. Interest comes from the combat system. |
| Named NPCs only get named ships | Identity is reserved for characters who matter. |
| Port ownership: does not change | Too complex, risks world instability. Faction *influence* varies; geography does not. |
| Faction strength simulation: out of scope | Would become a game unto itself. Faction relations are reactive to player, not autonomous. |

---

## Development Constraints

These apply to every phase, every feature, without exception:

- **Test coverage:** every new system ships with unit tests in `logic.js`/`generators.js`, reducer tests in `engine.js`, and UI smoke tests for any new screen. Written in the same session as the feature.
- **Documentation:** `architecture.md` updated when state shape, major functions, or screens change. `README.md` updated at each phase boundary.
- **No orphaned code:** every added function is called somewhere. Every added state field is read somewhere. Dead code removed before the phase closes.

---

## ✅ COMPLETED

### Foundation & Stabilisation
- **P0.1–P0.7** All critical bug fixes (getEffectiveMorale, travelDays naming, localStorage, START_GAME mutation, dead mission completion code, victory gold display, HIRE_CREW maxCrew bug)
- **P0.8** Pre-battle intercept screen (negotiate / bribe / flee / surrender before every encounter)

### Core Loop Pressure
- **P1.1** Morale recovery in port (Tavern service)
- **P1.2** Provisions system — food and water consumption at sea, morale penalty when empty
- **P1.3** Port resource system — parametric prices, GOODS_AVAILABILITY per port, buy/sell spread
- **P1.4** Cargo system — shared hold, speed penalty, MarketScreen, Black Market section
- **P1.5** Fame display in HUD and StatusScreen, fame gating on ships / upgrades / missions
- **P1.7** Reputation perks — repair discount, mission gold multiplier, At War service block

### Crew as Characters
- **P1.5.1** Named crew roster (roster array replaces crew.current number)

### Progression & Identity Tracks
- **P1.6a** Parametric mission generation — generators.js split, MISSION_POOL removed, all five mission types generated at runtime with fame/risk scaling
- **P2.7** Infamy track — state.infamy, bribe block at 50, label display, infamy gain from missions
- **N1.1** Starting scenarios redesign — five faction-aligned personas, dinghy starts, structured STARTS format, opening logs and starter missions
- **N1.4** Economy & balance health check tool — `tests_balance.html` with reachability matrix, enemy scaling, trade profit ceiling, ship cost vs. progression checks

### Mission Rework
- **N3.1** Trade delivery missions — Galaxy on Fire model, buy goods yourself, deliver for bonus, fame vehicle for merchant players
- **N3.2** Smuggling missions — real contraband in hold, patrol risk during voyage, navy inspection branching on hold contents, patrol fight costs infamy, revised gold margins

---

## IMPLEMENTATION ORDER

Items are ordered by: dependency satisfaction first, then impact-per-complexity, then grouping of naturally related work. The game is always in a fully playable state at any phase boundary.

---

## Tier 1 — Close the Loop on What Exists
> **Goal: everything already built works cleanly, feels right, and can be tested. No new systems yet.**
> These items have no blocking dependencies and deliver immediate visible improvement.
> Do all of Tier 1 before adding any new gameplay system.

---

### T1.1 — Fix Test Suite (74 failing tests) 
**What:** Repair all failing tests identified in the last audit. Nine root causes, all in test code except one engine bug:
- Remove all `D.MISSION_POOL.find()` references — replace with `testMission()` fixtures
- Fix `screens_shared/port/voyage` path prefix (`../`) in `tests.html`
- Update START_GAME test assertions to match the new structured STARTS format
- Pad random stubs in combat tests (L.30–36, E.27–30, E.44)
- Fix undefined `upgrade` variable references in BUY_UPGRADE tests
- Update fame-gate log message assertions to match current engine output
- Fix L.17 assertion — allied faction missions can now appear at non-rival ports
- Fix G.31 — food base price is now 3g not 5g
- Add `hold.capacity` update to BUY_SHIP reducer (genuine engine bug)
- Fix log message strings in E.81 (food exhaustion) and E.85 (stock rejection)

**Complexity:** Low
**Dependencies:** None — do this first
**Design impact:** None visible to players. Without a clean test suite, every subsequent feature is developed blind.

---

### T1.2 — State Shape Versioning + Save Migration --> DONE
**What:** Add `state.version: number` to `initialState` (start at 1). On `LOAD_GAME`, after parsing localStorage, run `migrateState(loaded)` in `engine.js` before applying the state. `migrateState` is a chain of version-gated patches: if `loaded.version < 2`, add `state.world = {}` with defaults; if `< 3`, add `state.crew.recoveringCrew = []`; etc. Each migration is additive — never destructive. This means every subsequent state shape change (every Tier 2–6 feature that adds a new field) ships with a corresponding migration patch, and existing saves continue to work.

**Complexity:** Low (one function, one new state field, one call in LOAD_GAME)
**Dependencies:** T1.1 ✅ (test suite clean before adding migration tests)
**Design impact:** Invisible to players when working correctly. Without it, every state shape change risks corrupting existing saves — which is the single most user-visible failure mode in a browser game. Must exist before any Tier 2+ feature adds new state fields.

---

### T1.3 — React Error Boundary --> DONE
**What:** Wrap the root render in `App.jsx` with a React ErrorBoundary class component. On any unhandled render error, show a recovery UI instead of a blank screen: "Something went wrong. [Reload] [Load Last Save]". The boundary catches component errors, logs them to console, and displays the recovery options. One component, ~30 lines.

**Complexity:** Low
**Dependencies:** None
**Design impact:** Players never see a white screen again. In a game with complex conditional rendering (intercept screen, battle screen, market screen all have deep state dependencies), render errors are inevitable during development. This is the safety net that prevents a bad session from feeling like a crash.

---

### T1.4 — Wind System Wired to Travel Days --> DONE
**What:** `state.wind` (angle 0–360, speed 0–20) already exists and displays in HUD and MapScreen. Wire it to `L.travelDays()`. Headwind (sailing within 45° of directly into the wind) adds 20% to travel days. Tailwind (sailing within 45° of directly with the wind) reduces by 20%. Crosswind: no modifier. The wind angle is compared to the bearing from origin to destination port to determine modifier. Wind already changes daily in ADVANCE_DAY — this makes those changes matter.

If wiring is not feasible in this session, **remove the wind display from HUD and MapScreen entirely**. A stat that means nothing erodes player trust in the UI more than its absence.

**Complexity:** Low-medium (bearing calculation between two port coordinates, modifier in travelDays)
**Dependencies:** T1.1 ✅
**Design impact:** Every sailing decision now has a weather dimension. Waiting one day in port for the wind to shift is a real choice. The wind rose in MapScreen becomes useful rather than decorative. Also sets up weather-based world events (T4.2) more naturally.

---

### T1.5 — Auto-Save at Key Moments --> DONE
**What:** Call the existing save function automatically on every `ADVANCE_DAY`, `ENTER_PORT`, and `COMPLETE_MISSION` dispatch. Show a brief "✓ Saved" flash in the HUD (1.5 seconds via CSS transition, then fades). No new save slot logic — this wraps what already exists.

**Complexity:** Low
**Dependencies:** T1.2 ✅ (state versioning must exist before auto-saving, so saves are always versioned)
**Design impact:** Players never lose meaningful progress. With smuggling missions now risking patrol encounters and cargo loss, a crash after a long voyage is no longer devastating.

---

### T1.6 — Morale Floor Cascade -> rejected
**What:** Extend the existing morale system with two escalating consequences when `crew.morale === 0` for sustained periods. Track `state.crew.moraleZeroDays: number` in state, incremented in ADVANCE_DAY when morale is 0.
- Days 1–3 at zero: existing behaviour (morale stays 0, existing penalties apply)
- Day 4+: `abandonRate` triggers — 1 random crew member lost per day (they desert). Log entry: "Another sailor slips away in the night."
- Day 8+: `uncontrollable` flag set — SAIL_TO is blocked, forced ENTER_PORT at nearest port. Log entry: "The crew refuses to sail. You have no choice but to find harbour."

Reset `moraleZeroDays` to 0 when morale rises above 0.

**Complexity:** Low (new state field, three condition checks in ADVANCE_DAY)
**Dependencies:** T1.1 ✅
**Design impact:** Morale 0 is now a genuine emergency, not just a number. The cascade gives the player clear warning and time to act before the situation becomes uncontrollable. Feeds into the crew trait system (T3.1) — a `coward` trait accelerates desertion.

---

### T1.7 — Max Days at Sea / Geographic Progression --> DONE
**What:** Activate the `maxDays` field already on SHIPS. Add `L.canReach(state, portKey)` — returns false when `L.travelDays(state, portKey) > SHIPS[state.ship.type].maxDays`. MapScreen greys and disables out-of-range ports with tooltip: "Requires a ship with more than X days range." Mark remote ports in data.js (`remote: true`): Bermuda, Veracruz, Campeche, Las Aves inaccessible by dinghy; Libertalia requires brigantine or larger.

**Complexity:** Low (one new logic function, MapScreen CSS change, data.js flags)
**Dependencies:** N1.1 ✅ (dinghy starts make this immediately meaningful), T1.4 ✅ (wind affects travelDays, so range calculation must be correct first)
**Design impact:** Ship upgrades are now geographic unlocks. The early game is genuinely constrained. Every ship purchase opens new regions of the map. Directly feeds T5.1 (unlockable areas).

---

### T1.8 — Mobile Browser Support --> DONE
**What:** Responsive layout pass so the game is genuinely playable on phones (~390px viewport):
- HUD: wrap to two lines on narrow viewports; hide hold display unless non-zero
- All panels: `minWidth: "min(90vw, 480px)"` pattern throughout
- Buttons: minimum 44px height for touch targets everywhere
- MapScreen: port tap targets enlarged; scale viewBox for small screens
- MarketScreen: single-column layout on mobile
- BattleScreen: action buttons stacked vertically
- Font sizes: `fontSize: 11` minimum in all interactive elements
- No game logic changes

**Complexity:** Medium (systematic layout pass across screens_port.jsx, screens_voyage.jsx, App.jsx)
**Dependencies:** T1.7 ✅ (screens in final structure before the layout pass)
**Design impact:** Turns a desktop-only game into something playable during a commute. The turn-based loop with short decision points is a natural fit for mobile.

---

### T1.9 — Missing UI Polish (no new systems) --> done except defeat screen summary, rejected
**What:** A bundle of high-value, low-complexity UI improvements that make existing systems feel finished. Do as one session:

- **Live hold preview in MarketScreen:** as the player adjusts +/− quantities, the hold bar updates in real time showing post-trade state. Currently updates only on confirm.
- **HUD stat tooltips:** tapping any HUD stat (hull, morale, fame, infamy, food, water) shows a two-sentence explanation. "Fame ★ — your permanent reputation as a captain. Gates access to ships, upgrades, and high-risk missions."
- **Ship comparison in Shipyard:** selecting a ship for purchase shows a side-by-side stat comparison with the player's current ship (hull, cannons, crew, hold, speed, range).
- **Port flavour text:** one-line description in the port header for each port. "The busiest harbour in the English Caribbean." / "A lawless anchorage where no questions are asked." Static strings in data.js.
- **Defeat summary screen:** when `battleState.phase === "defeat"` resolves, before returning to port, show a brief screen: "You survived. Days sailed: X. Missions completed: Y. Gold lost: Z." Simple stats, 10 seconds of context before the game continues.

**Complexity:** Low-medium (all UI-only, no reducer changes except defeat summary screen needing one new action)
**Dependencies:** T1.8 ✅ (mobile layout done first so these components are responsive from the start)
**Design impact:** Makes the game feel professional. The live hold preview alone removes the most common source of accidental over-purchasing. Tooltips make the game self-documenting for new players.

---

### T1.10 — Test Coverage: Integration and Regression
**What:** After T1.1 fixes the existing 74 failures, add the tests that are missing entirely:
- Full trade mission loop: accept → buy goods → sail → arrive → complete → goods removed, gold paid, fame awarded
- Full smuggle mission loop: accept → buy contraband → ADVANCE_DAY with patrolRisk → navy_patrol fires → allow inspection → contraband seized, fine paid, infamy +2
- Save/load round-trip test: complex state (active mission, hold with cargo, recovering crew) → SAVE_GAME → LOAD_GAME → verify all fields identical
- Morale cascade test: morale=0 for 4+ ADVANCE_DAY calls → crew member lost
- State migration test: load a v1 state (no `world` field) → verify `world` is added with defaults after migration
- Generator distribution test: call `G.generateMissions` 50 times → verify trade missions appear 20–40% of the time, assault < 15%

**Complexity:** Medium (new test content, no code changes)
**Dependencies:** T1.1 ✅, T1.2 ✅, T1.6 ✅
**Design impact:** Invisible to players. Without these, the cargo-mission interaction and the save system are unverified at the integration level. These are the tests that catch regressions when Tier 2 features modify ADVANCE_DAY and COMPLETE_MISSION.

---

## Tier 2 — Combat Has Consequences
> **Goal: combat costs something. Winning creates new problems. Preparation matters.**
> Implement in order — T2.2 depends on T2.1 infrastructure, T2.3 wraps both.

---

### T2.1 — Ammunition as Combat Resource --> parked for now.
**What:** Add `ammo` to `state.hold.items` as a tracked provision (does not consume hold capacity — stored in the ship's magazine separately). Consumption: 1 unit per Broadside or Precision action. If `ammo === 0`, both actions grey out in BattleScreen with "No ammunition." Warn at battle start when `ammo < 5`. Add `ammo` to RESOURCES and GOODS_AVAILABILITY (available wherever `weapons` is stocked). SailingScreen provisions panel shows ammo alongside food and water. HUD shows ammo when at sea.

**Complexity:** Low-medium (new RESOURCES entry, BATTLE_ACTION check, UI changes)
**Dependencies:** T1.10 ✅ (integration tests exist before adding new BATTLE_ACTION behaviour)
**Design impact:** Pre-battle preparation becomes meaningful. A full hold of silk and no ammo is a real vulnerability. Pirates carry ammo instead of cargo — a genuine identity tradeoff.

---

### T2.2 — Medicine as Combat Consequence Modifier --> parked for now.
**What:** Add `medicine` to `state.hold.items` (same pattern — no hold capacity consumed). Consumed when crew are lost in combat: `Math.floor(crewLost × 0.4)` crew become injured (not dead) when medicine > 0. A `state.crew.recoveringCrew: []` array holds them with a `daysRemaining` counter. ADVANCE_DAY decrements timers and returns recovered crew to `roster`. Without medicine, all losses are permanent. Log warns before battle when medicine = 0: "No medicine aboard — all losses will be permanent."

**Complexity:** Low-medium (new state field, ADVANCE_DAY timer, DISMISS_BATTLE recovery logic)
**Dependencies:** T2.1 ✅ (implement both combat provisions together — same session), T1.2 ✅ (recoveringCrew is a new state field requiring migration patch v2)
**Design impact:** Named crew can survive battles. Crew loss becomes a medical crisis rather than just a number drop. Sets up the surgeon crew trait (T3.1) and surgeon officer (T5.4) with real mechanical depth.

---

### T2.3 — Friendly Encounter Types
**What:** Add non-hostile encounter types routed through the existing intercept screen. Three new encounter types in `RANDOM_EVENTS` / encounter generator:
- **Distressed merchant:** a ship flying distress colours. Choices: rescue (morale +5, reputation with their faction +3, small gold reward from gratitude), ignore (no effect), board (infamy +5, cargo available — functions as a mini-plunder). Fires at sea with 3% daily chance.
- **Passing naval escort:** a friendly faction patrol offers to sail in company for a leg of the voyage. Choices: accept (patrol risk halved for next 2 days, small reputation gain), decline (no effect). Only fires when reputation with their faction ≥ 60.
- **Merchant convoy:** a group of merchants heading the same direction. Choices: join convoy (slower travel but protected), trade with them (access to their goods at market prices without visiting a port), let them pass.

**Complexity:** Medium (new event entries in data.js, three new encounterContext types, intercept screen handles them already)
**Dependencies:** T2.1 ✅ (combat ammo system established before adding more encounter types)
**Design impact:** The sea is not only dangerous. Friendly encounters make the world feel inhabited. The distressed merchant is a moral choice that interacts with infamy, reputation, and cargo. Players develop a sense of who they are through how they respond to these moments.

---

### T2.4 — Plunder Screen (post-grapple boarding)
**What:** When the player wins via grapple, show a PlunderScreen before the victory resolution:
- `G.generateEnemyCargo(enemy, risk)` produces a parametric cargo list based on enemy faction and ship class (Spanish galleon carries silver and cocoa; pirate sloop carries weapons and rum)
- Player's hold shown live: current used / capacity
- Per-good allocation with +/− buttons, constrained by hold space
- "Sink her" option: full existing gold reward, no cargo, no additional infamy
- Taking cargo: goods added to hold, gold reward reduced by 50% (you took goods instead of prize money)
- Taking tobacco or slaves adds infamy as per normal purchase rules

**Complexity:** Medium (new screen, new generator function, TAKE_PLUNDER action, hold integration)
**Dependencies:** T2.2 ✅ (combat has cost you something before you get to choose your reward), T1.2 ✅ (no new state fields without migration)
**Design impact:** Every grapple victory is a decision under spatial pressure. A hold full of spices is a problem when you just boarded a slaver. "Sink her" is always available for players who want clean gold. Cargo from plunder feeds back into trade mission systems.

---

## Tier 3 — Ship Identity
> **Goal: the ship the player sails is a statement of intent, not just a stat upgrade.**
> Equipment slots block the addition of further ship content. Do this before the world events phase adds content that would benefit from richer ship customisation.

---

### T3.1 — Equipment Slot System
**What:** Replace `ship.upgrades: string[]` with `ship.equipment: { hull: string|null, rigging: string|null, armament: string|null, figurehead: string|null, cargo: string|null }`. Each slot accepts exactly one item. Existing upgrades redistribute:
- `reinforced_hull` → hull slot
- `copper_plated_hull` → hull slot (conflicts with reinforced_hull — player must choose one)
- `extra_cannons` → armament slot
- `navigational_tools` → rigging slot
- `figurehead` → figurehead slot
- `cargo_hold_upgrade` (previously deferred) → cargo slot, now implementable

ShipyardScreen becomes an equipment management view: five slots displayed, current item shown in each, available options per slot with cost to swap. Swapping removes the old item's effect and applies the new one. `L.getShipStats()` reads from `ship.equipment` instead of `ship.upgrades`. New games use the new structure. Existing saves are migrated by the T1.2 migration function (v3 patch: convert `ship.upgrades[]` to `ship.equipment{}`).

**Complexity:** Medium (data.js restructure, getShipStats rewrite, ShipyardScreen redesign, migration patch)
**Dependencies:** T1.2 ✅ (migration infrastructure must exist), T2.4 ✅ (combat system stable before restructuring ship stats)
**Design impact:** Upgrades become genuine tradeoffs. You cannot have maximum hull AND maximum armament AND maximum cargo simultaneously. Every ship build is a statement about how you intend to play. The cargo hold upgrade (previously deferred to "later") can now ship. Blocks no further new upgrade content.

---

### T3.2 — Ship Visual Differentiation
**What:** Update `ShipSprite` in `screens_shared.jsx` to render meaningfully different silhouettes per ship type. Using SVG only — no assets. Each ship class gets a distinct hull shape, mast count, and size:
- Dinghy: tiny, single mast, no gun ports
- Cutter/Sloop: slim, two masts, 2–4 visible gun ports
- Schooner/Brigantine: medium, two masts with fore-and-aft rigging suggestion, 6–8 ports
- Merchantman/Fluyt: wide beam, three masts, deep hull
- Corvette/Frigate: sleek, three masts, prominent gun deck
- Galleon/Ship of the Line: massive, three masts, double gun deck

Same SVG approach as current — just distinct shapes. The ShipSprite is rendered in PortScreen header, ShipyardScreen ship list, StatusScreen, and BattleScreen. Scale by `size` prop as currently.

**Complexity:** Low-medium (SVG design work, no logic changes)
**Dependencies:** T3.1 ✅ (ship identity defined by equipment first, then visualised)
**Design impact:** Buying a galleon feels dramatic. The player's ship is visually recognisable as the thing they've been sailing, not an abstract stat block. Combat and port screens feel more grounded.

---

## Tier 4 — Crew Become People
> **Goal: the crew roster is a cast, not a headcount. Losing named crew means something.**
> Build in strict order — each item feeds the next.

---

### T4.1 — Crew Traits (Visible and Hidden)
**What:** `generateCrewMember` gains a `traits: string[]` field (one positive, one negative at hire). Negative traits marked `hidden: true` in `D.CREW_TRAITS` data are not shown in the manifest until their trigger fires. `L.checkCrewTraits(state, trigger)` returns a list of effects for trigger points (`"combat"`, `"sailing"`, `"port"`, `"long_voyage"`). Reducer calls this at trigger points and applies effects.

Initial trait set:
- `veteran` (combat: −1 damage taken per round)
- `surgeon` (post-combat: boosts injured-crew recovery rate when medicine > 0 — multiplies T2.2 recovery fraction from 0.4 to 0.6)
- `navigator` (sailing: −1 travel day, minimum 1)
- `drunkard` (port — hidden: consumes 2 rum from hold per port visit if rum present)
- `coward` (high-risk battle — hidden: morale −5 when assault or high-risk combat begins)
- `troublemaker` (long voyage — hidden: triggers a tension event after 7+ continuous days at sea)
- `lucky` (random events: 15% chance to negate negative outcome)
- `greedy` (mission completion — hidden: demands a 50g bonus or morale −3)

**Complexity:** Medium-high (trait data structure, trigger hook in engine.js, 8 trait implementations)
**Dependencies:** T2.2 ✅ (surgeon trait needs medicine), T1.10 ✅ (test coverage stable before adding new trigger points)
**Design impact:** Stories happen without scripting. The drunkard depletes your rum stock. The navigator cuts a day off your route. The coward panics before an assault. This is the emergent story engine.

---

### T4.2 — Crew Scars
**What:** A `scars: string[]` array on each crew member, populated by combat outcomes and events. Examples: `"battle_scarred"` (survived boarding, +1 morale aura on ship), `"storm_scarred"` (survived severe weather), `"plague_survivor"` (survived port plague event). Scars display as small labels on each crew member's row in the CrewScreen manifest. Some provide minor passive effects (read by `L.checkCrewTraits` as a scar modifier layer).

**Complexity:** Low (additive on T4.1 infrastructure — scars are persistent trait overrides)
**Dependencies:** T4.1 ✅
**Design impact:** Players remember the scar. A one-armed navigator who is still your best pathfinder creates genuine attachment. Every veteran crew member carries visible history.

---

### T4.3 — Crew Tensions
**What:** A `state.crew.tensions: []` array tracking feuds between specific crew members by id pair. Tension increments from trait interaction events (`drunkard` + `troublemaker` on the same ship; `coward` + `veteran` after a battle where one fled). At threshold (5), a conflict event fires at sea with choices: side with one (other leaves the ship), lock both up (morale −5, both available but morale debuffed), mediate (costs 100g and a rum unit). Unresolved tensions increment morale decay rate.

**Complexity:** Medium (tension table management, conflict event pool, trigger logic in ADVANCE_DAY)
**Dependencies:** T4.1 ✅ (traits cause tensions), T1.2 ✅ (tensions[] is a new state field requiring migration)
**Design impact:** "I've been managing the feud between my navigator and my gunner since Nassau" is the exact emergent story this creates. Crew drama is an active management challenge, not just flavour.

---

## Tier 5 — World Comes Alive
> **Goal: the world moves whether the player acts or not. Events reshape prices, missions, and relationships.**
> Build in order — each item feeds the next.

---

### T5.1 — World State Flags (Infrastructure Layer)
**What:** Add `state.world: { wars: [], plagues: [], sieges: [], treasureFleets: [], eventLog: [] }` to `initialState`. A `L.getWorldModifiers(state, context)` function returns relevant modifiers for any query (encounter rate, price multiplier, service availability). Add migration patch (v4) in T1.2's migration chain. On its own, nothing is visible — this is the foundation for T5.2–T5.5.

**Complexity:** Low
**Dependencies:** T4.3 ✅ (crew tensions settled before world events add more ADVANCE_DAY complexity), T1.2 ✅
**Design impact:** Infrastructure only. Unlocks everything in Tier 5 immediately.

---

### T5.2 — Scripted World Events
**What:** A `WORLD_EVENTS` pool in data.js. Condition-gated, weighted events fire in ADVANCE_DAY (~5% per day when no event active). Events set world state flags with durations. Initial set:
- War between two factions (patrol rate +30% near their ports, enemy-faction missions more available, weapon prices +40%)
- Plague at a port (services restricted, medicine price ×3, morale penalty on arrival)
- Treasure fleet in transit (timed window: high-gold interception mission available at 2 ports for 10 days)
- Navy sweeps pirate haven (Tortuga or Nassau services suspended, pirate missions unavailable, for 7 days)

Each event has `effects` modifying encounter rates, prices, service availability, and mission pools. Duration stored in world flags; ADVANCE_DAY decrements and clears expired events.

**Complexity:** Medium (new event pool, daily check, duration tracking)
**Dependencies:** T5.1 ✅, P1.3 ✅ (price system must exist for price effects)
**Design impact:** The world breathes. Wars create simultaneous danger and opportunity. Treasure fleet windows create timed decisions. The player is not the only thing happening in the Caribbean.

---

### T5.3 — Dynamic Prices Reacting to World Events
**What:** World events modify a `priceModifier` that `L.getWorldModifiers` returns. `G.generatePortMarket` reads world modifiers and applies them before rolling prices. War raises weapons and food prices. Plague raises medicine prices dramatically. A blockaded port raises all goods. Modifiers stack multiplicatively on top of existing variance.

**Complexity:** Low (T5.1 infrastructure already designed for this — one additional read in the generator)
**Dependencies:** T5.2 ✅
**Design impact:** Prices tell a story. A medicine price spike tells the player something is wrong before they reach the afflicted port. Economy is a source of world information, not just a number.

---

### T5.4 — Mission Board Reacts to World Events
**What:** World events include a `missionPool` field with mission templates active while the event is live. `G.generateMissions` checks `state.world` active events and includes their missions in the eligible pool. Examples: war → escort fleet missions appear at both warring factions; treasure fleet → interception mission at specific ports for 10 days; plague → medicine delivery mission chain unlocks.

**Complexity:** Low (world events carry the data; generator reads it — one additional filter pass)
**Dependencies:** T5.2 ✅, N3.1 ✅ (trade delivery type makes medicine delivery missions natural)
**Design impact:** The player has concrete reasons to engage with world events. The world does not just happen around them — they can profit from it, or ignore it at opportunity cost.

---

### T5.5 — Passive Contraband Inspection at Port Entry
**What:** When the player enters any lawful faction port (English, Spanish, French, Dutch) with contraband in hold (`tobacco > 0` or `slaves > 0`), a 15% chance of customs inspection fires — separate from the navy_patrol sailing event. If inspection triggers: player is shown a one-choice alert ("The harbour master requests to inspect your manifest.") with options to comply (seizure + fine as per navy_patrol) or bribe (costs 200g + faction rep −3, no seizure). No inspection if player is Allied (rep ≥ 80) with that port — authorities look the other way.

**Complexity:** Low (new check in ENTER_PORT, reuses existing `L.applyLoseContraband` and fine logic)
**Dependencies:** T2.4 ✅ (plunder adds more ways to acquire contraband), T5.2 ✅ (world events can raise inspection probability during war/crackdown)
**Design impact:** Smuggling into colonial ports is now genuinely risky at the destination, not just during the voyage. Allied reputation has an additional concrete benefit. Closes the loop on the smuggling system — previously arriving safely with contraband was completely risk-free.

---

### T5.6 — Rumour System
**What:** Taverns generate 2–3 rumours per port visit. `G.generateRumours(portKey, state)` returns an array of strings built from parametric templates filled with live game state: active world events, known flag positions, port price anomalies, infamy consequences. Rumours have an invisible `reliability` flag (`true` / `outdated` / `false`) — players must evaluate whether to act. Rendered in PortScreen as a "Word at the Tavern" section below the mission board.

Example outputs:
- "They say the Spanish are massing ships near Cartagena. Something's moving." (war event starting)
- "A merchant told me silk fetches double the usual price in Havana right now." (may be true or outdated)
- "A captain matching your description is wanted in Port Royal. Large reward." (infamy ≥ 50, true)

**Complexity:** Medium (template system, state query functions, UI section in PortScreen)
**Dependencies:** T5.2 ✅ (world events give rumours content), T4.1 ✅ (crew traits give rumours texture — a navigator who heard something specific)
**Design impact:** Information becomes a resource. The world feels inhabited by people with knowledge the player doesn't have. False rumours create risk. Supports the rival NPC system (T6.2) and the quest line (T6.4).

---

### T5.7 — Bounty Hunter Spawns
**What:** High infamy attracts hired hunters. `L.calculateNotoriety(state)` combines `state.infamy` with negative faction reputations. `shouldSpawnHunter(state)` rolls daily against notoriety in ADVANCE_DAY. Hunter ships route through the intercept screen as `bounty_hunt` encounter type with faction-appropriate dialogue. Stats scale with infamy tier: sloop at notoriety tier 1, frigate at tier 3, Ship of the Line at tier 4. Defeating a hunter yields high gold and a small infamy reduction (the warrant is cleared). Notoriety displayed on StatusScreen.

**Complexity:** Medium (new logic functions, encounter type, data templates, notoriety display)
**Dependencies:** P2.7 ✅ (infamy track), T5.5 ✅ (contraband inspection raises infamy — both systems feed bounty spawn rate)
**Design impact:** High infamy has real teeth that escalate. A string of profitable smuggling runs summons increasingly dangerous hunters. The "just kill the patrol" strategy accumulates infamy that makes the next encounter harder. The pressure ratchets.

---

## Tier 6 — Depth and Replayability
> **Goal: the world has secrets. Rivals. Political power. A reason to return.**
> These are the features that make players start a second campaign.

---

### T6.1 — Port Personality and Ambiance
**What:** Each port gets:
- A `flavour` one-liner in data.js, displayed in the port screen header beneath the port name ("The busiest harbour in the English Caribbean." / "A lawless anchorage where no questions are asked.")
- A `tavernName` string used in the morale/rumour UI ("The Rusty Anchor" / "Le Coq d'Or")
- 3–5 rotating ambient log entries that appear when entering port, drawn from a `portArrivals[]` pool per port ("The smell of tar and rum hits you before you've tied off." / "The harbour master eyes your papers longer than necessary.")

All content in data.js. No new systems.

**Complexity:** Low (content work — 25 ports × ~6 strings each)
**Dependencies:** T5.6 ✅ (rumours fill the tavern space; port personality frames it)
**Design impact:** Every port feels like a place rather than a menu. Geography becomes narrative. Players develop preferences and aversions based on how ports feel, not just what services they offer.

---

### T6.2 — Named Rival NPC Captains
**What:** 3–5 rival captains generated at game start (name + ship class + 2 traits + faction + a rivalry hook: "They once sailed with you." / "They hold a letter you were promised."). They appear in rumours (T5.6 references them), occasionally intercept the player as named encounters with custom battle log dialogue, and can be defeated permanently or escape. Each rival has a `history[]` populated by actual game events — if they escaped at Nassau, rumours mention they were spotted rebuilding at Tortuga. A defeated rival drops a unique item (their commission papers, a map fragment, a letter) used in the quest line.

**Complexity:** Medium-high (NPC state, persistence across sessions, encounter routing, rumour integration)
**Dependencies:** T5.6 ✅ (rumours reference them), T4.1 ✅ (rivals use the trait system)
**Design impact:** Players love recurring enemies. The rival who escaped in Nassau, rebuilt, and returned with a frigate is one of the most memorable things a game can generate without scripting.

---

### T6.3 — Unlockable Map Areas
**What:** Certain ports are hidden until unlock conditions are met: fame threshold, specific item found in an event or dropped by a rival, minimum ship size, or faction relationship. Locked ports appear as fog with a faint hint ("Strange lights reported to the southeast"). Unlock is permanent for that save. Condition checking routes through `L.meetsRequirement(state, item)` — already exists and forward-compatible with port `unlockCondition` objects.

Proposed gates:
- Dry Tortugas: any ship, fame ≥ 50
- Las Aves: brigantine or larger, pirate rep ≥ 60
- Libertalia: frigate or larger, fame ≥ 200, triggered by a specific rumour chain

**Complexity:** Medium (`state.unlockedPorts[]`, unlock check in MapScreen, condition data on port entries)
**Dependencies:** T1.7 ✅ (geographic range gating), T6.2 ✅ (rival defeat can drop map fragments that trigger unlocks), T5.6 ✅ (rumour chain can point to hidden ports)
**Design impact:** The map is not a solved space from day one. Libertalia and Las Aves become genuine revelations rather than ports that are just dimmed at the start.

---

### T6.4 — Governor Missions and Letters of Marque
**What:** At Allied ports (rep ≥ 80), the governor offers unique high-stakes missions unavailable on the regular board. Completing a governor mission chain earns a Letter of Marque — a legal commission making you a privateer for that faction. With a Letter: attacking that faction's enemies gives no reputation loss; attacking their allies is a severe betrayal (−30 rep, Letter revoked). Letters can be held for multiple factions but maintaining all requires careful enemy selection.

**Complexity:** Medium (new mission type, governor NPC in PortScreen, Letter state flag and modifiers)
**Dependencies:** P1.7 ✅ (Allied rep threshold), P2.7 ✅ (infamy interacts with Letter validity), T5.4 ✅ (world events make governor missions contextually relevant)
**Design impact:** High reputation has a concrete political payoff. The Letter is a commitment — it closes some doors while opening others. A player with English and French Letters cannot attack either faction, which defines their available enemies narrowly. Identity through political allegiance.

---

### T6.5 — Crew Officers
**What:** Named officer slots: Navigator, Surgeon, Gunner, Bosun. Hired separately at port taverns for significantly higher cost (200–500g each). Each has a `loyalty: number` influenced by player decisions (paying on time, morale, dangerous situations). Passive bonuses: navigator −1 travel day, surgeon boosts T2.2 recovery fraction further (0.4 → 0.7 when fully loyal), gunner +15% cannon damage, bosun slows morale decay −1 per 3 days. Officers are named crew members with traits (T4.1) and scars (T4.2) — they use the full crew trait system. Losing an officer costs a significant one-time morale penalty.

**Complexity:** High (officer slots interact with nearly every system — implement only after Tier 4 is fully stable)
**Dependencies:** T4.2 ✅ (officers are named crew with traits and scars), T2.2 ✅ (surgeon extends medicine system)
**Design impact:** A small cast of named characters the player actively protects. The surgeon you've had since Tortuga who has two scars and a navigator trait is irreplaceable. Officers are the highest-attachment characters in the game.

---

### T6.6 — Personal Quest Line
**What:** A loose 5-chapter quest providing long-term narrative purpose. Each chapter is a mission chain using existing infrastructure — no new systems. Classic framing: a personal wrong to right (a stolen Letter, a betrayed crew, a bounty that's been following you since before the game began). The antagonist is one of the generated rivals (T6.2). Chapters require: sailing to specific ports, completing a particular mission type, obtaining an item from a random event, building reputation with a specific faction. Resolution involves a final confrontation with the antagonist rival and a choice that affects the epilogue.

**Complexity:** Medium-high (content work — mechanics all exist)
**Dependencies:** T6.2 ✅ (antagonist is a named rival), T5.6 ✅ (rumours advance the quest), T6.4 ✅ (quest resolution involves a Letter)
**Design impact:** Transforms a hundred voyages into a story with a shape. The best campaigns should feel like they were about something.

---

## Tier 7 — Save, Polish, and Endgame
> **Goal: long campaigns are protected. The game has a finish line.**
> These items only pay off once the game is worth saving and finishing.

---

### T7.1 — Onboarding Overlay
**What:** A 3-step overlay triggered only on the first play session (stored in localStorage as `broadside_firstPlay`). Step 1: "Your ship needs provisions before sailing — visit the Market." Step 2: "Accept a mission from the board to earn fame and gold." Step 3: "Reach the next port to complete your first mission." Dismissable at any point. Never shown again after first session. Uses existing UI components — no new design language.

**Complexity:** Low
**Dependencies:** All Tier 1–6 features stable (onboarding only makes sense when the game it's teaching is complete)
**Design impact:** Dramatically reduces early abandonment. New players currently arrive with no guidance and face a port screen with 5+ actions and no indication of where to start.

---

### T7.2 — Multiple Save Slots + JSON Export
**What:** Three named save slots alongside the auto-save. Each slot shows: captain name, scenario, day, gold, ship type, fame tier, last played date. JSON export button for backup and cross-device play. Import JSON to restore a save.

**Complexity:** Medium
**Dependencies:** T1.5 ✅ (auto-save must exist first), T1.2 ✅ (versioned saves)
**Design impact:** Players experiment safely. Multiple slots enable "what if I'd played as the Smuggler" second campaigns.

---

### T7.3 — Difficulty Settings
**What:** Three settings at game start: Easy / Normal / Brutal. Multipliers on: encounter rates (×0.6 / ×1.0 / ×1.4), wage costs (×0.8 / ×1.0 / ×1.2), provision consumption (×0.7 / ×1.0 / ×1.3), starting gold (×1.5 / ×1.0 / ×0.7). Stored in `state.difficulty`, read by all calculation functions.

**Complexity:** Low (multipliers on existing calculations)
**Dependencies:** All Tier 1–6 complete (difficulty only means something once all pressure systems exist)
**Design impact:** Accessibility for new players. Brutal mode is the intended experience for veterans.

---

### T7.4 — Endgame: Retirement and Final Score
**What:** Retirement available when fame ≥ 500. Triggers RetirementScreen: final score computation, text epilogue determined by dominant faction reputation, infamy tier, personal quest outcome (T6.6), and Letters held (T6.4). New Game+ option: keep one equipment item, start with a cutter, infamy reset. High-infamy epilogues are distinct — the game acknowledges what kind of captain you were.

**Complexity:** Medium
**Dependencies:** T7.3 ✅, T6.4 ✅ (Letters affect epilogue), T6.6 ✅ (quest outcome affects epilogue)
**Design impact:** The game has a destination. "The Notorious Captain Rosa Esperanza, scourge of the Spanish Main, retired to Libertalia in 1712 with 923 fame, a French Letter of Marque, and a warrant still outstanding from Port Royal" is a sentence the game can generate.

---

## Long-Term Vision
> Design ideas worth keeping in mind. Build only if the game is stable, fun, and there is capacity.

| Idea | Notes |
|---|---|
| Infamy reduction mechanic | Paying a debt to governors to reduce infamy. Natural fit with T6.4 (governor relationship). |
| Prize ship system | After combat victory: option to escort captured ship to port and sell it. Speed reduced while escorting. "Success creates new problems." |
| Keyboard shortcuts | Tab/Space/Enter navigation for power users. Low complexity, high feel for desktop players. |
| Build step (replace Babel standalone) | esbuild or parcel replaces in-browser transpilation. Eliminates CDN dependency, reduces cold start from ~500ms to ~50ms, enables proper module imports. Medium complexity but significant architecture improvement. |
| Campaign clock / year progression | Year starts 1695, advances every 365 days. Difficulty increases at thresholds. Golden age of piracy ends ~1730 — soft long-term deadline. |
| Morale decay in port (idle pressure) | Requires a "Pass Time" button or similar mechanic to advance time in port. Design decision needed before implementation. |
| Procedural rumour generation | NLP-style template expansion. Defer until T5.6 is stable. |
| Dynamic faction wars (autonomous) | Factions act and expand without player. Very high complexity and instability risk. |
| Fleet system | Player owns multiple ships, assigns crew and routes. Transforms game scope entirely. |
| Visual sailing mode | Animated top-down sailing. Medium complexity, high feel — after all systems stable. |
| Content Security Policy + SRI hashes | Add `integrity` attributes to CDN script tags. Prevents supply chain attacks. 30-minute fix. |
| Procedural music | Web Audio API, mood-reactive shanties. Cosmetic only. |
| Multiplayer | Shared world, competing captains. Entirely different architecture. |

---

## Phase Sequence at a Glance

```
✅  Foundation & stabilisation (P0.1–P0.8)
✅  Core loop pressure (P1.1–P1.5, P1.7)
✅  Named crew roster (P1.5.1)
✅  Parametric missions (P1.6a)
✅  Infamy track (P2.7)
✅  Starting scenarios redesign (N1.1)
✅  Balance health check tool (N1.4)
✅  Trade delivery missions (N3.1)
✅  Smuggling missions rework (N3.2)

→ T1  Foundation of quality. Tests, state versioning, error boundary,
      wind system, auto-save, morale cascade, geographic range, mobile, UI polish, coverage.
→ T2  Combat has consequences. Ammo, medicine, friendly encounters, plunder.
→ T3  Ship identity. Equipment slots, ship visuals.
→ T4  Crew become people. Traits, scars, tensions.
→ T5  World comes alive. World state, events, prices, missions, contraband inspection,
      rumours, bounty hunters.
→ T6  Depth and replayability. Port personality, rivals, unlockable map,
      governors, officers, quest line.
→ T7  Finish line. Onboarding, save slots, difficulty, retirement.
```

**Why this order:**

T1 before everything — 74 broken tests mean every feature is built without a safety net. State versioning must exist before any new state field is added. Error boundary before any complex UI. Wind before geographic range (travelDays must be correct before range is computed). Auto-save after versioning (saves must be versioned before auto-saving). Morale cascade before crew traits (cascade is the floor that traits build on). Mobile before UI polish (layout must be responsive before adding new UI elements).

T2 before T3 — equipment slots restructure ship stats; the combat system (ammo, medicine) must be stable before the stat layer changes. Plunder makes cargo meaningful before the cargo hold upgrade slots in.

T3 before T4 — crew traits interact with ship equipment (the coward trait in an assault-slot ship is a different experience than a sloop). Establish ship identity before crew identity.

T4 before T5 — world events gain texture when crew traits exist to interact with them (plague world event is more interesting when your surgeon trait becomes critical). Crew tensions need ADVANCE_DAY to be stable before adding more daily triggers.

T5 before T6 — rivals (T6.2) need rumours (T5.6) to feel present. Port personality (T6.1) builds on the world event context. Unlockable areas (T6.3) use the rumour chain and rival drops.

T6 before T7 — there is no point in a retirement screen until the game is rich enough to be worth finishing. Onboarding teaches a game that should already be complete.