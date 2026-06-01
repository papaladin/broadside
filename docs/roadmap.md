# Broadside — Development Roadmap

---

## Design Philosophy

> **The goal is not many mechanics. It is a few mechanics that interact strongly.**

The game should feel alive and pressured — not because it scripts dramatic moments, but because small systems constantly push against each other and produce emergent stories the player didn't expect. Every mechanic added should be evaluated against two questions:

1. **Does it interact with at least two existing systems?** Isolated mechanics are content. Interacting mechanics are emergence.
2. **Does every success create a new problem?** Bigger ship → more provisions needed. High fame → bounty hunters. Elite crew → wage demands. Rich cargo → pirate attention. Forward momentum must always carry new costs.

### Core emotional targets

* **Pressure**: the player should always have reasons to act rather than sit still. Time, money, morale, and the world itself should push.
* **Consequence**: the world remembers what you did. Factions, NPCs, and your own crew carry history.
* **Attachment**: the player should care about their ship, their crew, and their reputation — because those things took time to build and can be lost.
* **Emergent stories**: the best moments in the game should be ones no one designed. They should arise from systems colliding.

### 🧭 Game Influences & Systems Extraction

To guide future features and keep the project scope aligned, this matrix outlines what *Broadside* explicitly borrows from its core inspirations—incorporating existing systems and planned mechanics—and where it intentionally draws the line.

### Core Alignment Matrix

| Influence | What We Are Taking / Already Have | What We Are Rejecting |
|---|---|---|
| **Sid Meier’s Pirates!** | * **Core Gameplay Loop:** The macroscopic port-to-sea cycle (visit port $\rightarrow$ take missions $\rightarrow$ trade $\rightarrow$ battle ships at sea $\rightarrow$ gather plunder $\rightarrow$ upgrade ship and crew).* **The Ticking Career Clock:** Time and age act as passive motivators.* **Crew Management:** Managing crew expectations, patience, and appetite for split spoils rather than a static headcount. | * **Arcade Mini-games:** Real-time reflex tests, arcade ship steering, and screen-blocking action sub-games (e.g., fencing or dancing mechanics). |
| **Galaxy on Fire 2 HD** | * **Progression Framework:** Open-ended transit network where players navigate between discrete hubs to unlock higher tiers of ship hulls, weapons, and equipment slots.* **Progression Gates:** Fame-gated access to high-tier ships and black-market utilities.* **Trade Delivery Loop:** Dynamic trade missions where you risk your own capital to buy local commodities and haul them to specific destinations for a premium payout. | * **Real-Time Interface:** 3D cockpit flight controls, manual joystick/mouse aiming, real-time space navigation overlays, and high-fidelity asset rendering. |
| **Caravaneer** | * **Brutal Logistics:** Parametric market forces, distinct buy/sell price spreads, physical cargo volume constraints, and explicit speed/range penalties for over-encumbered hulls.* **Survival Pressure:** Strict, unrelenting consumption cycles (food/water decay routines) that turn long-distance travel into a resource calculation problem. | * **Micro-Simulation:** Absolute asset tracking down to the exact ounce/pound metrics for every individual animal or crew pack, and hyper-dense nested inventory grids. |
| **Dwarf Fortress** | * **Procedural Generation Philosophy:** Relies heavily on condition-gated, regionally weighted parametric algorithms (`generators.js`) rather than predictable, static handcrafted content.* **Psychological Cause-and-Effect:** Granular background tracking on individual entities (named crew members, personality traits, scars, dynamic tensions, and feuds) to spark unpredictable emergent stories. | * **Extreme Layout Complexity:** Text-only terminal interfaces, impenetrable nested control menus, multi-layered base building, and fully unbound, unconstrained procedural world-generation. |
| **Occidental Heroes** | * **Tactical Friction:** Turn-based choice architecture where every choice carries lethal consequences and structural permanence (e.g., permanent crew death, irreversible ship losses).* **Choice-Driven Intercepts:** The pre-battle operational intercept layer (negotiate / bribe / flee / surrender).* **Narrative Architecture:** Pre-defined starting scenario profiles (personas) providing initial logs, coupled with a loose, multi-chapter endgame quest line framework. | * **Tactical Combat Maps:** Strict hex-grid tactical troop placement, tile-based line-of-sight movement tracking, and high-fantasy RPG element scaling. |

### The Systemic Filter
> When analyzing a new feature proposal, pass it through this mental checklist:
> *"Does this feel like Galaxy on Fire 2 HD's open-ended progression loop and Caravaneer's economic weight, reacting to Dwarf Fortress's chaotic human psychology, wrapped in the pacing of Sid Meier's Pirates!, executed with the lethal turn-based simplicity of Occidental Heroes?"*

### Core Alignment Matrix

| Influence | What We Are Taking | What We Are Rejecting |
|---|---|---|
| **Sid Meier’s Pirates!** | * The ticking career clock.* Managing crew expectations and patience rather than just an endless headcount.* Sudden shifts from wealth back to a clean slate. | * Real-time arcade sailing reflex tests.* Minigames that block strategic choice (e.g., dancing or fencing mechanics). |
| **Caravaneer** | * Brutal, mathematical logistics.* Heavy emphasis on resource weight, storage volume, and physical trade-offs.* Economic pressure acting as the primary driver for risk-taking. | * Absolute simulation tracking down to weight parameters per pack mule/crew member.* Massive real-time grid navigation menus. |
| **Dwarf Fortress** | * Psychological cause-and-effect.* History tracking on individual characters (scars, memories, relationships).* Emergent storytelling born from interconnected systemic failures. | * Extreme complexity, unreadable interfaces, and fully untamed procedural world-generation. |
| **Occidental Heroes** | * Direct tactical friction and turn-based combat penalties.* Punishing choices where a single tactical mistake snowballs into permanent character loss. | * Hex-grid tactical movement and complex grid combat simulation. |

### The Systemic Filter
> When analyzing a new feature proposal, pass it through this mental checklist:
> *"Does this feel like Caravaneer's economic weight, reacting to Dwarf Fortress's chaotic human psychology, wrapped in the pacing of Sid Meier's Pirates!, executed with the lethal turn-based simplicity of Occidental Heroes?"*

### What this game is

> A systemic pirate RPG where the player creates emergent stories through faction politics, crew drama, dangerous travel, and reputation.

### What this game is not

* A naval combat simulator
* A grand strategy game
* A realistic economy simulator
* A base-building game

---

## Architecture Principles (locked)

| Decision | Rationale |
| --- | --- |
| Fixed map, unlockable areas | Player knowledge accumulates. Geography is learnable and meaningful. |
| Parametric randomization, not procedural generation | Structure is fixed, values vary within ranges. Emergence from interaction, not from generation. |
| Random events: condition-gated, regionally weighted | Events feel appropriate to context. No full proc-gen. |
| Hidden locations: fixed positions | Consistent with fixed map. Discovery is exploration reward, not generation. |
| Enemy ships: parametric stat ranges, faction-appropriate | Nameless encounters need no identity. Interest comes from the combat system. |
| Named NPCs only get named ships | Identity is reserved for characters who matter. |
| Port ownership: does not change | Too complex, risks world instability. Faction *influence* varies; geography does not. |
| Faction strength simulation: out of scope | Would become a game unto itself. Faction relations are reactive to player, not autonomous. |
| **Divide the Plunder Loop** | Crew operates on signed partnership Articles rather than flat daily wages. Accumulating massive wealth accelerates morale decay until players visit a Pirate Haven to split the hoard. This forces an organic game cycle reset: distributing 50% to 70% of gold, drydocking the flagship, and starting fresh with a smaller hull and select loyal Officers. |
| **Psychological Trauma Triggers** | Severe combat crises or starvation blocks leave crew members with permanent mental trauma traits (e.g., *Pyrophobia*, *Scurvy Paranoia*). These sit silently until triggered by specific contexts, unexpectedly locking down slot systems or accelerating supply decay—transforming past narrow victories into modern tactical liabilities. |
| **Market Saturation & Shipping Lanes** | Dumping high-volume commodities into local markets forces a "Saturated State," dropping local sell values to zero for 14 days. Simultaneously, a neighboring or rival port registers a supply deficit, spiking its buy rates. This organically breaks predictable trading loops and forces players into dangerous waters. |
| **Hold Disasters & Cargo Shifts** | Cargo holds are treated as physically volatile spaces. Executing extreme maneuvers (heavy storm running or high-speed tactical broadside pivots) triggers a physics check against cargo capacity. Failure causes cargo shifts: loose cannonballs fracture internal hull integrity, or crushed rum casks ruin perishable spices while triggering unmanaged crew chaos. |


---

## Development Constraints

These apply to every phase, every feature, without exception:

* **Test coverage:** every new system ships with unit tests in `logic.js`/`generators.js`, reducer tests in `engine.js`, and UI smoke tests for any new screen. Written in the same session as the feature.
* **Documentation:** `architecture.md` updated when state shape, major functions, or screens change. `README.md` updated at each phase boundary.
* **No orphaned code:** every added function is called somewhere. Every added state field is read somewhere. Dead code removed before the phase closes.

---

## ✅ COMPLETED

### Foundation & Stabilisation

* **P0.1–P0.7** All critical bug fixes (getEffectiveMorale, travelDays naming, localStorage, START_GAME mutation, dead mission completion code, victory gold display, HIRE_CREW maxCrew bug).
* **P0.8** Pre-battle intercept screen (negotiate / bribe / flee / surrender before every encounter).
* **T1.3** React Error Boundary — Root component wrapper capturing deep rendering layout errors to display a localized safe recovery interface.
* **T1.2** State Shape Versioning & Save Migration — Implementation of additive, version-gated object transformers protecting save integrity inside `LOAD_GAME`.

### Core Loop Pressure

* **P1.1** Morale recovery in port (Tavern service).
* **P1.2** Provisions system — food and water consumption at sea, morale penalty when empty.
* **P1.3** Port resource system — parametric prices, GOODS_AVAILABILITY per port, buy/sell spread.
* **P1.4** Cargo system — shared hold, speed penalty, MarketScreen, Black Market section.
* **P1.5** Fame display in HUD and StatusScreen, fame gating on ships / upgrades / missions.
* **P1.7** Reputation perks — repair discount, mission gold multiplier, At War service block.
* **T1.4** Wind System Integration — Connected daily fluid speed and angle bearing factors to alter `L.travelDays()` outputs by $\pm$20%.
* **T1.5** Auto-Save Triggers — Automated background state serialization firing on core loop lifecycle milestones with interactive HUD confirmation.

### Crew as Characters

* **P1.5.1** Named crew roster (roster array replaces crew.current number).

### Progression & Identity Tracks

* **P1.6a** Parametric mission generation — generators.js split, MISSION_POOL removed, all five mission types generated at runtime with fame/risk scaling.
* **P2.7** Infamy track — state.infamy, bribe block at 50, label display, infamy gain from missions.
* **N1.1** Starting scenarios redesign — five faction-aligned personas, dinghy starts, structured STARTS format, opening logs and starter missions.
* **N1.4** Economy & balance health check tool — `tests_balance.html` with reachability matrix, enemy scaling, trade profit ceiling, ship cost vs. progression checks.
* **T1.7** Geographic Progression — Range constraints based on ship types using `L.canReach()` to block remote coordinate routing.

### Mission & Tactical Rework

* **N3.1** Trade delivery missions — Galaxy on Fire model, buy goods yourself, deliver for bonus, fame vehicle for merchant players.
* **N3.2** Smuggling missions — real contraband in hold, patrol risk during voyage, navy inspection branching on hold contents, patrol fight costs infamy, revised gold margins.
* **T2.4** Post-Grapple Plunder Screen — Dedicated intermediate salvage loot selector restricting item acquisition based on real-time spatial hold volume.
* **T6.3** Unlockable Map Areas Framework — Fog-of-war structural overrides rendering secretive safe harbors unroutable until fulfilling progression requirements.

### UI & UX Layouts

* **T1.8** Mobile Browser Optimization — Component sizing, 44px interactives, and responsive single-column mutations across core interface windows.
* **T1.9** High-Value Polish — Implemented live hold pre-calculations during commerce adjustments, stat HUD tooltip modals, historical hull shipyard comparisons, and static descriptive port elements.

---

## IMPLEMENTATION ORDER

Items are ordered by: dependency satisfaction first, then impact-per-complexity, then grouping of naturally related work. The game is always in a fully playable state at any phase boundary.

---

## Tier 1 — Final Clean-Up & Balance Grounding

> **Goal: everything already built works cleanly, feels right, and can be tested. No new systems yet.**
> This remaining item has no blocking dependencies and delivers immediate verification safety.

### T1.1 — Fix Test Suite (74 failing tests)

**What:** Repair all failing tests identified in the last audit. Nine root causes, all in test code except one engine bug:

* Remove all `D.MISSION_POOL.find()` references — replace with `testMission()` fixtures
* Fix `screens_shared/port/voyage` path prefix (`../`) in `tests.html`
* Update START_GAME test assertions to match the new structured STARTS format
* Pad random stubs in combat tests (L.30–36, E.27–30, E.44)
* Fix undefined `upgrade` variable references in BUY_UPGRADE tests
* Update fame-gate log message assertions to match current engine output
* Fix L.17 assertion — allied faction missions can now appear at non-rival ports
* Fix G.31 — food base price is now 3g not 5g
* Add `hold.capacity` update to BUY_SHIP reducer (genuine engine bug)
* Fix log message strings in E.81 (food exhaustion) and E.85 (stock rejection)

**Complexity:** Low
**Dependencies:** None — do this first
**Design impact:** None visible to players. Without a clean test suite, every subsequent feature is developed blind.

---

## Tier 2 — Ship Equipment Overhaul & Structural Identity

> **Goal: Re-engineer ship upgrades into a modular, tactical slot-based inventory system. The hull you navigate is a clear statement of playstyle intent.**

### T2.1 — Equipment Slot System (Formerly T3.1)

**What:** Replace `ship.upgrades: string[]` with `ship.equipment: { hull: string|null, rigging: string|null, armament: string|null, figurehead: string|null, cargo: string|null }`. Each slot accepts exactly one item. Existing upgrades redistribute:

* `reinforced_hull` → hull slot
* `copper_plated_hull` → hull slot (conflicts with reinforced_hull — player must choose one)
* `extra_cannons` → armament slot
* `navigational_tools` → rigging slot
* `figurehead` → figurehead slot
* `cargo_hold_upgrade` (previously deferred) → cargo slot, now implementable

ShipyardScreen becomes an equipment management view: five slots displayed, current item shown in each, available options per slot with cost to swap. Swapping removes the old item's effect and applies the new one. `L.getShipStats()` reads from `ship.equipment` instead of `ship.upgrades`. New games use the new structure. Existing saves are migrated by the T1.2 migration function (v3 patch: convert `ship.upgrades[]` to `ship.equipment{}`).

**Complexity:** Medium (data.js restructure, getShipStats rewrite, ShipyardScreen redesign, migration patch)
**Dependencies:** T1.1 (Test suite clean)
**Design impact:** Upgrades become genuine tradeoffs. You cannot have maximum hull AND maximum armament AND maximum cargo simultaneously. Every ship build is a statement about how you intend to play.

### T2.2 — Ship Visual Differentiation (Formerly T3.2)

**What:** Update `ShipSprite` in `screens_shared.jsx` to render meaningfully different silhouettes per ship type. Using SVG only — no assets. Each ship class gets a distinct hull shape, mast count, and size:

* Dinghy: tiny, single mast, no gun ports
* Cutter/Sloop: slim, two masts, 2–4 visible gun ports
* Schooner/Brigantine: medium, two masts with fore-and-aft rigging suggestion, 6–8 ports
* Merchantman/Fluyt: wide beam, three masts, deep hull
* Corvette/Frigate: sleek, three masts, prominent gun deck
* Galleon/Ship of the Line: massive, three masts, double gun deck

Same SVG approach as current — just distinct shapes. The ShipSprite is rendered in PortScreen header, ShipyardScreen ship list, StatusScreen, and BattleScreen. Scale by `size` prop as currently.

**Complexity:** Low-medium (SVG design work, no logic changes)
**Dependencies:** T2.1
**Design impact:** Buying a galleon feels dramatic. The player's ship is visually recognisable as the thing they've been sailing, not an abstract stat block. Combat and port screens feel more grounded.

### T2.3 — Prize Ship Escort System (Brought forward from Long-Term Vision)

**What:** Expand the post-victory combat choice suite in `engine_combat.js`. Following a successful grapple victory, add a third execution action: "Claim Prize Ship". Selecting this triggers a state flag `state.voyage.prizeEscort = { type: enemy.type, hull: enemy.hull }`. While towing a prize ship back to harbor, the player suffers a mandatory flat 30% penalty to velocity calculations within `L.travelDays()` and random encounter probability scales by 1.5x due to lack of maneuverability. Upon entering any friendly port, the prize ship is automatically liquidated for 60% of its base configuration price value in gold.

**Complexity:** Medium (State modifications, intercept modifications, conditional logic in travel math)
**Dependencies:** T2.1, T2.2
**Design impact:** Pure expression of the "success creates a new problem" philosophy. Capturing a massive frigate yields vast wealth, but leaves you crawling across the open map, vulnerable to enemy privateers.

### T2.4 — Perishable Cargo & Spoilage (New Design Philosophy Recommendation)

**What:** Introduce resource fragility to cargo storage arrays. Add a `perishable: true` modifier flag to `sugar`, `food`, and `tobacco` inside `D.RESOURCES`. Track an internal counter `state.hold.dampness` that increments by 1 for every consecutive day spent navigating directly through heavy crosswinds/headwinds, or when taking over 40% maximum hull integrity structural damage. At a threshold of 5 dampness, 15% of all stored perishable commodities rot and are stripped from the hold inventory array automatically during `ADVANCE_DAY`. Visiting a shipyard for structural repairs completely wipes the dampness accumulator back to 0.

**Complexity:** Low-medium (State tracking additions in navigation/combat loops, conditional filters)
**Dependencies:** T2.1
**Design impact:** Directly ties the weather grid and tactical battle hazards into the stability of economic trade profits, making cargo protection an active concern rather than a passive status.

---

## Tier 3 — Marine Encounters & World Interactions

### T3.1 — Friendly Encounter Types (Formerly T2.2)

**What:** Add non-hostile encounter types routed through the existing intercept screen. Three new encounter types in `RANDOM_EVENTS` / encounter generator:

* **Distressed merchant:** a ship flying distress colours. Choices: rescue (morale +5, reputation with their faction +3, small gold reward from gratitude), ignore (no effect), board (infamy +5, cargo available — functions as a mini-plunder). Fires at sea with 3% daily chance.
* **Passing naval escort:** a friendly faction patrol offers to sail in company for a leg of the voyage. Choices: accept (patrol risk halved for next 2 days, small reputation gain), decline (no effect). Only fires when reputation with their faction ≥ 60.
* **Merchant convoy:** a group of merchants heading the same direction. Choices: join convoy (slower travel but protected), trade with them (access to their goods at market prices without visiting a port), let them pass.

**Complexity:** Medium (new event entries in data.js, three new encounterContext types, intercept screen handles them already)
**Dependencies:** T2.1
**Design impact:** The sea is not only dangerous. Friendly encounters make the world feel inhabited. The distressed merchant is a moral choice that interacts with infamy, reputation, and cargo.

---

## Tier 4 — Crew Become People

> **Goal: the crew roster is a cast, not a headcount. Losing named crew means something.**
> Build in strict order — each item feeds the next.

### T4.1 — Crew Traits (Visible and Hidden)

**What:** `generateCrewMember` gains a `traits: string[]` field (one positive, one negative at hire). Negative traits marked `hidden: true` in `D.CREW_TRAITS` data are not shown in the manifest until their trigger fires. `L.checkCrewTraits(state, trigger)` returns a list of effects for trigger points (`"combat"`, `"sailing"`, `"port"`, `"long_voyage"`). Reducer calls this at trigger points and applies effects.

Initial trait set:

* `veteran` (combat: −1 damage taken per round)
* `surgeon` (post-combat: boosts injured-crew recovery rate when medicine > 0 — multiplies recovery fraction from 0.4 to 0.6)
* `navigator` (sailing: −1 travel day, minimum 1)
* `drunkard` (port — hidden: consumes 2 rum from hold per port visit if rum present)
* `coward` (high-risk battle — hidden: morale −5 when assault or high-risk combat begins)
* `troublemaker` (long voyage — hidden: triggers a tension event after 7+ continuous days at sea)
* `lucky` (random events: 15% chance to negate negative outcome)
* `greedy` (mission completion — hidden: demands a 50g bonus or morale −3)

**Complexity:** Medium-high (trait data structure, trigger hook in engine.js, 8 trait implementations)
**Dependencies:** T1.1, T2.1
**Design impact:** Stories happen without scripting. The drunkard depletes your rum stock. The navigator cuts a day off your route. The coward panics before an assault. This is the emergent story engine.

### T4.2 — Crew Scars

**What:** A `scars: string[]` array on each crew member, populated by combat outcomes and events. Examples: `"battle_scarred"` (survived boarding, +1 morale aura on ship), `"storm_scarred"` (survived severe weather), `"plague_survivor"` (survived port plague event). Scars display as small labels on each crew member's row in the CrewScreen manifest. Some provide minor passive effects (read by `L.checkCrewTraits` as a scar modifier layer).

**Complexity:** Low (additive on T4.1 infrastructure — scars are persistent trait overrides)
**Dependencies:** T4.1
**Design impact:** Players remember the scar. A one-armed navigator who is still your best pathfinder creates genuine attachment. Every veteran crew member carries visible history.

### T4.3 — Crew Tensions

**What:** A `state.crew.tensions: []` array tracking feuds between specific crew members by id pair. Tension increments from trait interaction events (`drunkard` + `troublemaker` on the same ship; `coward` + `veteran` after a battle where one fled). At threshold (5), a conflict event fires at sea with choices: side with one (other leaves the ship), lock both up (morale −5, both available but morale debuffed), mediate (costs 100g and a rum unit). Unresolved tensions increment morale decay rate.

**Complexity:** Medium (tension table management, conflict event pool, trigger logic in ADVANCE_DAY)
**Dependencies:** T4.1
**Design impact:** "I've been managing the feud between my navigator and my gunner since Nassau" is the exact emergent story this creates. Crew drama is an active management challenge, not just flavour.

### T4.4 — Officer Poaching & Mutiny Crises (New Design Philosophy Recommendation)

**What:** Wire high local crew tension scores directly into the officer framework. If `state.crew.tensions` involves an officer slot assignment and overall vessel morale sits below 20 units for three consecutive intervals, trigger an active "Poaching Alert" random event when docking at neutral pirate hubs. A named rival captain targets your disgruntled officer, extending an active financial contract bid to leave your vessel. The player must match the gold sum counter-offer, attempt an intimidation check based on raw Infamy metrics, or suffer an instantaneous crew desertion consequence alongside the loss of that officer's specialized equipment modifier.

**Complexity:** Medium (Event branching, status assessment checks)
**Dependencies:** T4.3
**Design impact:** Transforms low morale management from a generic passive debuff numbers drop into active internal administrative threats to the player's core operational asset hierarchy.

---

## Tier 5 — World Comes Alive

> **Goal: the world moves whether the player acts or not. Events reshape prices, missions, and relationships.**
> Build in order — each item feeds the next.

### T5.1 — World State Flags (Infrastructure Layer)

**What:** Add `state.world: { wars: [], plagues: [], sieges: [], treasureFleets: [], eventLog: [] }` to `initialState`. A `L.getWorldModifiers(state, context)` function returns relevant modifiers for any query (encounter rate, price multiplier, service availability). Add migration patch (v4) in T1.2's migration chain. On its own, nothing is visible — this is the foundation for T5.2–T5.5.

**Complexity:** Low
**Dependencies:** T4.3, T1.2
**Design impact:** Infrastructure only. Unlocks everything in Tier 5 immediately.

### T5.2 — Scripted World Events

**What:** A `WORLD_EVENTS` pool in data.js. Condition-gated, weighted events fire in ADVANCE_DAY (~5% per day when no event active). Events set world state flags with durations. Initial set:

* War between two factions (patrol rate +30% near their ports, enemy-faction missions more available, weapon prices +40%)
* Plague at a port (services restricted, medicine price ×3, morale penalty on arrival)
* Treasure fleet in transit (timed window: high-gold interception mission available at 2 ports for 10 days)
* Navy sweeps pirate haven (Tortuga or Nassau services suspended, pirate missions unavailable, for 7 days)

Each event has `effects` modifying encounter rates, prices, service availability, and mission pools. Duration stored in world flags; ADVANCE_DAY decrements and clears expired events.

**Complexity:** Medium (new event pool, daily check, duration tracking)
**Dependencies:** T5.1, P1.3
**Design impact:** The world breathes. Wars create simultaneous danger and opportunity. Treasure fleet windows create timed decisions. The player is not the only thing happening in the Caribbean.

### T5.3 — Dynamic Prices Reacting to World Events

**What:** World events modify a `priceModifier` that `L.getWorldModifiers` returns. `G.generatePortMarket` reads world modifiers and applies them before rolling prices. War raises weapons and food prices. Plague raises medicine prices dramatically. A blockaded port raises all goods. Modifiers stack multiplicatively on top of existing variance.

**Complexity:** Low (T5.1 infrastructure already designed for this — one additional read in the generator)
**Dependencies:** T5.2
**Design impact:** Prices tell a story. A medicine price spike tells the player something is wrong before they reach the afflicted port. Economy is a source of world information, not just a number.

### T5.4 — Mission Board Reacts to World Events

**What:** World events include a `missionPool` field with mission templates active while the event is live. `G.generateMissions` checks `state.world` active events and includes their missions in the eligible pool. Examples: war → escort fleet missions appear at both warring factions; treasure fleet → interception mission at specific ports for 10 days; plague → medicine delivery mission chain unlocks.

**Complexity:** Low (world events carry the data; generator reads it — one additional filter pass)
**Dependencies:** T5.2, N3.1
**Design impact:** The player has concrete reasons to engage with world events. The world does not just happen around them — they can profit from it, or ignore it at opportunity cost.

### T5.5 — Rumour System (Formerly T5.6)

**What:** Taverns generate 2–3 rumours per port visit. `G.generateRumours(portKey, state)` returns an array of strings built from parametric templates filled with live game state: active world events, known flag positions, port price anomalies, infamy consequences. Rumours have an invisible `reliability` flag (`true` / `outdated` / `false`) — players must evaluate whether to act. Rendered in PortScreen as a "Word at the Tavern" section below the mission board.

Example outputs:

* "They say the Spanish are massing ships near Cartagena. Something's moving." (war event starting)
* "A merchant told me silk fetches double the usual price in Havana right now." (may be true or outdated)
* "A captain matching your description is wanted in Port Royal. Large reward." (infamy ≥ 50, true)

**Complexity:** Medium (template system, state query functions, UI section in PortScreen)
**Dependencies:** T5.2, T4.1
**Design impact:** Information becomes a resource. The world feels inhabited by people with knowledge the player doesn't have. False rumours create risk. Supports the rival NPC system (T6.2) and the quest line (T6.4).

### T5.6 — Bounty Hunter Spawns (Formerly T5.7)

**What:** High infamy attracts hired hunters. `L.calculateNotoriety(state)` combines `state.infamy` with negative faction reputations. `shouldSpawnHunter(state)` rolls daily against notoriety in ADVANCE_DAY. Hunter ships route through the intercept screen as `bounty_hunt` encounter type with faction-appropriate dialogue. Stats scale with infamy tier: sloop at notoriety tier 1, frigate at tier 3, Ship of the Line at tier 4. Defeating a hunter yields high gold and a small infamy reduction (the warrant is cleared). Notoriety displayed on StatusScreen.

**Complexity:** Medium (new logic functions, encounter type, data templates, notoriety display)
**Dependencies:** P2.7
**Design impact:** High infamy has real teeth that escalate. A string of profitable smuggling runs summons increasingly dangerous hunters. The "just kill the patrol" strategy accumulates infamy that makes the next encounter harder. The pressure ratchets.

### T5.7 — Indulgences & Infamy Pardon Mechanic (Brought forward from Long-Term Vision)

**What:** Wire financial liquidation frameworks directly into the high-infamy hunter penalty parameters. At Allied or high-affinity colonial hubs (rep ≥ 70), add an interactive "Contact Governor's Emissary" element to the Port layout screen. Spending a localized scaling sum of gold (e.g., `150g × current_infamy_tier`) triggers a direct `PARDON_INFAMY` reduction dispatch, reducing raw `state.infamy` metrics by 25 points while lowering regional naval alert levels across adjacent sea quadrants.

**Complexity:** Low-medium (State adjustment mechanics, static pricing hooks inside port views)
**Dependencies:** T5.1, T5.6
**Design impact:** Implements an active alternative systemic outlet for highly wealthy criminal characters to cycle acquired gold back into the core loop under heavy financial tax pressure.

---

## Tier 6 — Depth and Replayability

> **Goal: the world has secrets. Rivals. Political power. A reason to return.**
> These are the features that make players start a second campaign.

### T6.1 — Port Personality and Ambiance

**What:** Each port gets:

* A `flavour` one-liner in data.js, displayed in the port screen header beneath the port name ("The busiest harbour in the English Caribbean." / "A lawless anchorage where no questions are asked.")
* A `tavernName` string used in the morale/rumour UI ("The Rusty Anchor" / "Le Coq d'Or")
* 3–5 rotating ambient log entries that appear when entering port, drawn from a `portArrivals[]` pool per port ("The smell of tar and rum hits you before you've tied off." / "The harbour master eyes your papers longer than necessary.")

All content in data.js. No new systems.

**Complexity:** Low (content work — 25 ports × ~6 strings each)
**Dependencies:** T5.5
**Design impact:** Every port feels like a place rather than a menu. Geography becomes narrative. Players develop preferences and aversions based on how ports feel, not just what services they offer.

### T6.2 — Named Rival NPC Captains

**What:** 3–5 rival captains generated at game start (name + ship class + 2 traits + faction + a rivalry hook: "They once sailed with you." / "They hold a letter you were promised."). They appear in rumours (T5.5 references them), occasionally intercept the player as named encounters with custom battle log dialogue, and can be defeated permanently or escape. Each rival has a `history[]` populated by actual game events — if they escaped at Nassau, rumours mention they were spotted rebuilding at Tortuga. A defeated rival drops a unique item (their commission papers, a map fragment, a letter) used in the quest line.

**Complexity:** Medium-high (NPC state, persistence across sessions, encounter routing, rumour integration)
**Dependencies:** T5.5, T4.1
**Design impact:** Players love recurring enemies. The rival who escaped in Nassau, rebuilt, and returned with a frigate is one of the most memorable things a game can generate without scripting.

### T6.3 — Governor Missions and Letters of Marque (Formerly T6.4)

**What:** At Allied ports (rep ≥ 80), the governor offers unique high-stakes missions unavailable on the regular board. Completing a governor mission chain earns a Letter of Marque — a legal commission making you a privateer for that faction. With a Letter: attacking that faction's enemies gives no reputation loss; attacking their allies is a severe betrayal (−30 rep, Letter revoked). Letters can be held for multiple factions but maintaining all requires careful enemy selection.

**Complexity:** Medium (new mission type, governor NPC in PortScreen, Letter state flag and modifiers)
**Dependencies:** P1.7, P2.7, T5.4
**Design impact:** High reputation has a concrete political payoff. The Letter is a commitment — it closes some doors while opening others. A player with English and French Letters cannot attack either faction, which defines their available enemies narrowly. Identity through political allegiance.

### T6.4 — Crew Officers (Formerly T6.5)

**What:** Named officer slots: Navigator, Surgeon, Gunner, Bosun. Hired separately at port taverns for significantly higher cost (200–500g each). Each has a `loyalty: number` influenced by player decisions (paying on time, morale, dangerous situations). Passive bonuses: navigator −1 travel day, surgeon boosts T2.2 recovery fraction further (0.4 → 0.7 when fully loyal), gunner +15% cannon damage, bosun slows morale decay −1 per 3 days. Officers are named crew members with traits (T4.1) and scars (T4.2) — they use the full crew trait system. Losing an officer costs a significant one-time morale penalty.

**Complexity:** High (officer slots interact with nearly every system — implement only after Tier 4 is fully stable)
**Dependencies:** T4.2, T2.1
**Design impact:** A small cast of named characters the player actively protects. The surgeon you've had since Tortuga who has two scars and a navigator trait is irreplaceable. Officers are the highest-attachment characters in the game.

### T6.5 — Personal Quest Line (Formerly T6.6)

**What:** A loose 5-chapter quest providing long-term narrative purpose. Each chapter is a mission chain using existing infrastructure — no new systems. Classic framing: a personal wrong to right (a stolen Letter, a betrayed crew, a bounty that's been following you since before the game began). The antagonist is one of the generated rivals (T6.2). Chapters require: sailing to specific ports, completing a particular mission type, obtaining an item from a random event, building reputation with a specific faction. Resolution involves a final confrontation with the antagonist rival and a choice that affects the epilogue.

**Complexity:** Medium-high (content work — mechanics all exist)
**Dependencies:** T6.2, T5.5, T6.3
**Design impact:** Transforms a hundred voyages into a story with a shape. The best campaigns should feel like they were about something.

---

## Tier 7 — Save, Polish, and Endgame

> **Goal: long campaigns are protected. The game has a finish line.**
> These items only pay off once the game is worth saving and finishing.

### T7.1 — Onboarding Overlay

**What:** A 3-step overlay triggered only on the first play session (stored in localStorage as `broadside_firstPlay`). Step 1: "Your ship needs provisions before sailing — visit the Market." Step 2: "Accept a mission from the board to earn fame and gold." Step 3: "Reach the next port to complete your first mission." Dismissable at any point. Never shown again after first session. Uses existing UI components — no new design language.

**Complexity:** Low
**Dependencies:** All Tier 1–6 features stable (onboarding only makes sense when the game it's teaching is complete)
**Design impact:** Dramatically reduces early abandonment. New players currently arrive with no guidance and face a port screen with 5+ actions and no indication of where to start.

### T7.2 — Multiple Save Slots + JSON Export

**What:** Three named save slots alongside the auto-save. Each slot shows: captain name, scenario, day, gold, ship type, fame tier, last played date. JSON export button for backup and cross-device play. Import JSON to restore a save.

**Complexity:** Medium
**Dependencies:** T1.5, T1.2
**Design impact:** Players experiment safely. Multiple slots enable "what if I'd played as the Smuggler" second campaigns.

### T7.3 — Difficulty Settings

**What:** Three settings at game start: Easy / Normal / Brutal. Multipliers on: encounter rates (×0.6 / ×1.0 / ×1.4), wage costs (×0.8 / ×1.0 / ×1.2), provision consumption (×0.7 / ×1.0 / ×1.3), starting gold (×1.5 / ×1.0 / ×0.7). Stored in `state.difficulty`, read by all calculation functions.

**Complexity:** Low (multipliers on existing calculations)
**Dependencies:** All Tier 1–6 complete (difficulty only means something once all pressure systems exist)
**Design impact:** Accessibility for new players. Brutal mode is the intended experience for veterans.

### T7.4 — Endgame: Retirement and Final Score

**What:** Retirement available when fame ≥ 500. Triggers RetirementScreen: final score computation, text epilogue determined by dominant faction reputation, infamy tier, personal quest outcome (T6.5), and Letters held (T6.3). New Game+ option: keep one equipment item, start with a cutter, infamy reset. High-infamy epilogues are distinct — the game acknowledges what kind of captain you were.

**Complexity:** Medium
**Dependencies:** T7.3, T6.3, T6.5
**Design impact:** The game has a destination. "The Notorious Captain Rosa Esperanza, scourge of the Spanish Main, retired to Libertalia in 1712 with 923 fame, a French Letter of Marque, and a warrant still outstanding from Port Royal" is a sentence the game can generate.

### T7.5 — Native Asset Bundling Toolchain (Brought forward from Long-Term Vision)

**What:** Introduce a production compilation framework to replace raw in-browser Babel interpretation dependencies. Set up a lightweight automated `esbuild` script to package raw Javascript and nested React `.jsx` syntax files into a single optimized static deployment script. Strip CDN script lookups within `index.html` to improve initial load velocities from roughly 500ms down to a localized 50ms constraint.

**Complexity:** Medium (Configuration, asset assembly, index refactoring)
**Dependencies:** All Tier 1-7 functional features finalized
**Design impact:** Architectural optimization only. Protects client deployment safety and establishes standard web security alignment.

---

## Long-Term Vision

> Design ideas worth keeping in mind. Build only if the game is stable, fun, and there is capacity.

| Idea | Notes |
| --- | --- |
| Keyboard shortcuts | Tab/Space/Enter navigation for power users. Low complexity, high feel for desktop players. |
| Campaign clock / year progression | Year starts 1695, advances every 365 days. Difficulty increases at thresholds. Golden age of piracy ends ~1730 — soft long-term deadline. |
| Morale decay in port (idle pressure) | Requires a "Pass Time" button or similar mechanic to advance time in port. Design decision needed before implementation. |
| Procedural rumour generation | NLP-style template expansion. Defer until T5.5 is stable. |
| Dynamic faction wars (autonomous) | Factions act and expand without player. Very high complexity and instability risk. |
| Fleet system | Player owns multiple ships, assigns crew and routes. Transforms game scope entirely. |
| Visual sailing mode | Animated top-down sailing. Medium complexity, high feel — after all systems stable. |
| Content Security Policy + SRI hashes | Add `integrity` attributes to CDN script tags. Prevents supply chain attacks. 30-minute fix. |
| Procedural music | Web Audio API, mood-reactive shanties. Cosmetic only. |
| **Divide the Plunder Loop** | Crew operates on signed partnership Articles rather than flat daily wages. Accumulating massive wealth accelerates morale decay until players visit a Pirate Haven to split the hoard. This forces an organic game cycle reset: distributing 50% to 70% of gold, drydocking the flagship, and starting fresh with a smaller hull and select loyal Officers. |
| **Psychological Trauma Triggers** | Severe combat crises or starvation blocks leave crew members with permanent mental trauma traits (e.g., *Pyrophobia*, *Scurvy Paranoia*). These sit silently until triggered by specific contexts, unexpectedly locking down slot systems or accelerating supply decay—transforming past narrow victories into modern tactical liabilities. |
| **Market Saturation & Shipping Lanes** | Dumping high-volume commodities into local markets forces a "Saturated State," dropping local sell values to zero for 14 days. Simultaneously, a neighboring or rival port registers a supply deficit, spiking its buy rates. This organically breaks predictable trading loops and forces players into dangerous waters. |
| **Hold Disasters & Cargo Shifts** | Cargo holds are treated as physically volatile spaces. Executing extreme maneuvers (heavy storm running or high-speed tactical broadside pivots) triggers a physics check against cargo capacity. Failure causes cargo shifts: loose cannonballs fracture internal hull integrity, or crushed rum casks ruin perishable spices while triggering unmanaged crew chaos. |
| **Rare Schematic & Prototype Assembly** | Inspired by GoF2’s blueprint loop, players can acquire rare "Smuggler Schematics" or "Naval Prototypes" from shady tavern dealers. Instead of traditional raw mining, players must utilize *Caravaneer*-style logistics to hunt, purchase, and transport highly specific, heavy components (e.g., *Damascus Steel Plates*, *Clockwork Chronometers*) across volatile shipping lanes to a Master Shipwright to assemble unique, overpowered equipment slots. |
| **Hireable Mercenary Escorts (Wingman Loop)** | Replicating GoF2's station lounge mercenary hiring, players can contract independent captained vessels in taverns to sail alongside them as tactical escorts. This adds heavy *Sid Meier’s Pirates!* style friction: the escort ship rapidly accelerates your global daily provision consumption rates and demands a flat 20% cut of all mission/plunder gold payouts, but acts as a vital damage sponge and provides secondary artillery volleys during intense tactical broadside combat. |

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
✅  Wind system & auto-save integrations (T1.2-T1.5)
✅  Geographic limits & mobile engine pass (T1.7-T1.9)
✅  Tactical Plunder & Map unlock layers (T2.4, T6.3)

→ T1  Clean up. Fix remaining 74 test scripts to stabilize core logic validation.
→ T2  Ship identity overhaul. Drop upgrades for deep Equipment Slots, silhouettes, prize tow & spoilage.
→ T3  Marine encounters. Deploy ongoing active friendly interaction types across open sea routing.
→ T4  Crew development. Activate trait distributions, visual scars, tension matrices & poaching events.
→ T5  Macro world updates. Deploy dynamic state structures, market events, rumours & bounty warrants.
→ T6  Deep replayability parameters. Port ambiance, named rival persistence, letters of marque & officers.
→ T7  Endgame finish lines. Tutorial overlays, cross-device save slots, difficulty multipliers & retirement.

```

**Why this order:**

T1.1 must close before the modular overhaul, ensuring any broken calculations are cataloged prior to structural file adjustments. Elevating the Ship Equipment Overhaul (T2) immediately follows your core priority: replacing simple booleans with physics-linked hold configurations before establishing crew traits (T4) or dynamic world events (T5) that directly target those components. Friendly encounter paths (T3) bridge the gap to make cargo transit alive prior to introducing named officers or permanent faction letters of marque.

---

## ⏸ PARKED OR REJECTED CONCEPTS

*Items suspended or removed during historical audits to prevent architectural bloating or focus drift.*

* **T1.6 — Morale Floor Cascade (REJECTED)**
* *What:* Tracking continuous zero-morale periods to force crew desertion and lock out sailing navigation controls entirely.
* *Reason:* Severe disruption to user agency. Forced lockouts and automated crew deletion loops caused mechanical death spirals that alienated testing groups.


* **T1.9 — Post-Defeat Historical Stat Screen (REJECTED)**
* *What:* Integrating an intermediate operational stat-tracking layout window following absolute battle failures.
* *Reason:* Redundant state footprint. Standard reload actions loop directly into port initialization scripts, making an intermediate death log text-block unnecessary.


* **T1.10 — Integration & Regression Automation Suite (PARKED)**
* *What:* Writing high-volume systemic end-to-end operational loop validation scripts for trade/smuggling chains.
* *Reason:* High code velocity friction. Rapid layout refactoring and structural parameter updates frequently render long integration test suites volatile; reliance on the `tests_balance.html` check matrix is sufficient for ongoing tuning.


* **T2.1 — Ammunition as Combat Resource (PARKED)**
* *What:* Tracking individual flat weapon ammo values within standard resource arrays, locking firing actions out at 0 ammunition.
* *Reason:* Deferred until the completion of the modular Slot Framework overhaul to ensure dedicated ammo varieties interact with specialized weapon hardpoints properly.


* **T2.2 — Medicine as Injury Recovery Track (PARKED)**
* *What:* Tracking clinical inventory variables to process wounded crew members inside separate recovery timer blocks.
* *Reason:* Suspended until Tier 4 crew persona structures are stable, ensuring specialized medical traits interact natively with physical healing loops.


* **T5.5 — Passive Port Entry Contraband Inspection (REJECTED)**
* *What:* Firing localized 15% random custom checks directly when clicking to enter lawful harbors while hauling illegal cargo tags.
* *Reason:* Replaced cleanly by active, high-pressure naval sea patrols across open map hex coordinates during transit, making destination-arrival menu penalties redundant.