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

## Architecture Principles (inform all phases)

These decisions are locked. New features must respect them.

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
| Rumors: parametric sentence templates for now | Proc-gen sentences deferred until systems are stable enough to feed them. |

---

## Development Constraints

These apply to every phase, every feature, without exception:

- **Test coverage:** every new system ships with at least one unit test in `logic.js` and one reducer test in `engine.js`. UI smoke tests for any new screen. Tests are written in the same session as the feature, not deferred.
- **Documentation:** `architecture.md` is updated when a new system changes the state shape, adds a major function, or introduces a new screen. `README.md` feature list is updated at the end of each phase.
- **No orphaned code:** if a function is added to `logic.js`, it must be called somewhere. If a field is added to state, it must be read somewhere. Dead code is removed before the phase is closed.

---

## ✅ COMPLETED

Everything below has been implemented, tested, and closed.

### Foundation & Stabilisation
- **P0.1** Fix duplicate `getEffectiveMorale` declaration
- **P0.2** Fix `L.calculateTravelDays` wrong function name
- **P0.3** Fix `localStorage` key mismatch (save/load)
- **P0.4** Fix `START_GAME` mutating `initialState`
- **P0.5** Remove/fix dead `completeMissionOnCombatVictory`
- **P0.6** Fix victory gold display in BattleScreen
- **P0.7** Fix HIRE_CREW using base maxCrew instead of state.crew.max
- **P0.8** Pre-battle intercept screen (negotiate / bribe / flee / surrender)

### Core Loop Pressure
- **P1.1** Morale recovery in port (Tavern service)
- **P1.2** Provisions system — food and water (medicine and ammunition deferred → see N1.4)
- **P1.3** Port resource system (parametric prices, GOODS_AVAILABILITY per port)
- **P1.4** Cargo system (shared hold, speed penalty, buy/sell market screen)
- **P1.5** Fame display in HUD + fame gating on ships, upgrades, and missions
- **P1.7** Reputation perks (threshold behaviours: repair discount, mission gold multiplier, At War service block)

### Crew as Characters
- **P1.5.1** Named crew roster (roster array replaces crew.current number)

### Progression Tracks
- **P1.6 (renamed P1.6a)** Parametric mission generation (generators.js split, MISSION_POOL removed, all mission types generated at runtime)
- **P2.7** Infamy track (state.infamy, bribe block at 50, label display, infamy gain from smuggle and assault missions)

---

## RECOMMENDED IMPLEMENTATION ORDER

The phases below are ordered by dependency and impact. Each item is independently shippable unless noted. The game is always in a playable state at any phase boundary.

---

## Phase N1 — Foundation & Feel
> **Goal: the game feels like a real game world from the first minute. Starting experience is polished, the map has spatial meaning, and the game runs on mobile.**

These items have no dependencies on each other and can be tackled in any order within the phase. Do all four before moving to Phase 1.5 crew work, because they affect every play session.

---

### N1.1 — Starting Scenarios Redesign
**What:** All scenarios start with a **dinghy** (or very small sloop) and minimal crew. The persona differentiation moves away from ship class and toward starting position, faction affiliation, and initial reputation — not starting power. Proposed personas:

| Persona | Start Port | Gold | Rep profile | Crew | Flavour |
|---|---|---|---|---|---|
| Runaway Sailor | Nassau | 150g | All neutral | 0 | No ship yet — first mission: steal or buy a dinghy |
| Merchant Apprentice | Bridgetown | 400g | English +20 | 5 | Dinghy + small trade goods in hold |
| Disgraced Privateer | Port Royal | 200g | English +10, Pirate −20 | 3 | Dinghy + one low-risk English mission pre-loaded |
| Pirate Recruit | Tortuga | 180g | Pirate +20, English −15 | 4 | Dinghy + infamy 3 already |
| Smuggler | Petit-Goâve | 300g | French +10, infamy 5 | 3 | Dinghy with 10 tobacco in hold |

All personas: dinghy, max 5 crew initially, enough gold to provision for 2–3 short voyages. The player is immediately forced into a mission or trade decision. No persona is given a comfortable starting position.

Persona differentiation is through: starting port (defines accessible missions and faction baseline), reputation pre-set (some factions warmer or cooler), infamy pre-set (smuggler/pirate starts already flagged), and one small unique starting condition (trade goods, pre-loaded mission, or ship event in log).

**Complexity:** Low-medium (rewrite STARTS in data.js, adjust START_GAME reducer to handle infamy/rep pre-sets, update StartScreen UI to reflect the persona narrative)
**Dependencies:** None — but benefits from N1.2 (max days at sea) being implemented first, so starting ship range is meaningful from day one
**Design impact:** The first 10 minutes define every player's emotional relationship with the game. Starting small makes every upgrade meaningful. Starting different makes every replay feel like a different story. Removes the "I chose Merchant and already have the best trade ship" problem.

---

### N1.2 — Max Days at Sea / Geographic Progression
**What:** Activate the `maxDays` field already present on SHIPS. Ships cannot reach ports whose travel time exceeds `state.ship.maxDays` at current provisions level. MapScreen shows out-of-range ports greyed/locked with a tooltip: "Requires a ship with more than X days range." Ports marked `remote: true` in data.js are visible on the map but unreachable by small ships. This creates a natural exploration arc: dinghy → reach 4–6 nearby ports → upgrade to sloop → Caribbean opens → upgrade to brigantine/frigate → remote Gulf and Atlantic ports accessible.

The range check uses `L.travelDays(state, portKey)` (already includes cargo penalty) against `SHIPS[state.ship.type].maxDays`. Hidden/unlockable ports are a separate mechanic (P3.1) — this item only gates by ship capability, not by discovery.

**Complexity:** Low (add `canReach(state, portKey)` to logic.js, update MapScreen to grey and disable out-of-range ports, mark `remote: true` on appropriate ports in data.js)
**Dependencies:** Provisions system (P1.2 ✅), SHIPS.maxDays already set
**Design impact:** The map has spatial meaning beyond just "how many days does this take." A dinghy captain genuinely cannot reach Veracruz. The Brigantine is not just a bigger sloop — it opens the western Caribbean. Ship upgrades become geographic unlocks. Combined with N1.1 (small starting ship), the early game feels genuinely constrained and the mid-game feels like expansion.

---

### N1.3 — Mobile Browser Support
**What:** The game currently runs on desktop browsers only. Add responsive layout so it plays on phone browsers (Chrome/Safari mobile, ~390px wide viewport). Changes required:
- HUD: wrap onto two lines or collapse non-critical stats behind a toggle on small screens
- All screens: replace fixed pixel widths with `min(90vw, 480px)` patterns
- Buttons: minimum 44px touch target height throughout
- Map screen: add pinch-zoom or fixed zoom level for small viewports; port tap targets sized appropriately
- Market screen: column layout collapses to single column on mobile
- Battle screen: action buttons stacked vertically
- Font size: all `fontSize: 10` → `fontSize: max(10, 12)` responsive minimum
- No new game logic — purely layout and touch target changes

**Complexity:** Medium (systematic CSS pass across all screen components; no logic changes)
**Dependencies:** None — but do after N1.1 and N1.2 so the screens being resized are in their final structure
**Design impact:** Broadside is a turn-based game with short decision loops — it is naturally suited to mobile. Mobile access dramatically expands the audience. The game should be genuinely playable during a commute, not just technically loadable on a phone.

---

### N1.4 — Economy & Balance Health Check Tool
**What:** A dedicated `balance.html` developer tool (does not ship as part of the game) that reads `window.D` and `window.L` and displays calculated balance metrics:
- **Port reachability matrix:** for each ship type × each origin port, how many ports are reachable within maxDays
- **Provisions cost vs. morale purchase cost:** confirm buying food+water is always cheaper per morale-point than tavern drinks
- **Voyage cost vs. mission reward:** for each fame tier and risk level, average mission gold vs. average voyage cost (wages + provisions for average trip length)
- **Trade profit ceiling:** for each good, maximum possible profit per voyage at each port pair (best buy × worst sell, quantity-capped by tier) — flags if any route exceeds 3× the mission reward for that fame tier
- **Ship price vs. accumulated gold:** estimated sessions (missions × net gold per mission) to afford each ship at the appropriate fame tier
- **Enemy scaling vs. player scaling:** at each fame tier, compare average enemy hull/cannons/crew against player ship stats — flag if enemy is ever stronger than player's current-tier ship
- **Infamy bribe block check:** confirm that average infamy accumulated from a standard playstyle hits the bribe-block threshold (50) only after the player has had meaningful opportunities to clear infamy

**Complexity:** Medium (standalone HTML file, reads window.D and window.L, renders results as tables and colour-coded pass/fail indicators)
**Dependencies:** All completed systems (provisions, cargo, missions, ships) — this is a verification tool, not a feature
**Design impact:** Not visible to players. Prevents balance regressions as new content is added. Gives the designer a live dashboard to sanity-check any data change before committing.

---

## Phase N2 — Combat Depth & Plunder
> **Goal: combat has consequences beyond gold. Grapple victory means a choice. Provisions matter in battle.**

---

### N2.1 — Plunder Screen (post-grapple boarding)
**What:** When the player wins via grapple (boarding action), instead of immediately showing the victory screen, show a **Plunder Screen**. This screen shows:
- Enemy ship's estimated cargo (parametrically generated based on enemy ship type, faction, and route — not tied to the cargo system yet, generates gold-equivalent lots: "4 crates of spices", "12 barrels of rum")
- Player's current hold: used / capacity
- A selection UI: player allocates which goods to take, up to available hold space
- Taking contraband (tobacco, slaves) adds infamy
- Taking all cargo takes full time (adds 1 sailing day); partial takes are faster (flavour)
- "Take nothing — sink her" option: full gold reward (current system), no cargo, no infamy from cargo
- "Take the lot": cargo added to hold as actual goods, gold reward reduced (you took the goods instead)

This requires generating enemy cargo at encounter build time (new function in generators.js: `generateEnemyCargo(enemy, risk)`).

**Complexity:** Medium (new screen, new generator function, integration with hold state, partial dispatch of TAKE_PLUNDER action)
**Dependencies:** Cargo system (P1.4 ✅), intercept screen (P0.8 ✅)
**Design impact:** Every grapple victory becomes a decision with spatial consequences. A hold full of silk is a problem when you just captured a Spanish galleon's tobacco. The "sink her" option exists so players who want clean gold can still have it. Embodies "every success creates a new problem" — great loot means you travel slower and attract more attention.

---

### N2.2 — Ammunition as Combat Resource
**What:** Add `ammo` to the hold alongside food and water. Ammo is consumed per combat round (1 unit per broadside or precision shot fired, not per round of evade/grapple). Ammo is available at most ports (see GOODS_AVAILABILITY). Running out of ammo mid-battle disables Broadside and Precision actions — only Grapple and Evade remain. Player is warned at battle start if ammo is below 5 units ("Low ammunition — cannon actions may not be available for long"). Ammo does not consume hold units (it is a separate ship resource, like provisions — this avoids forcing the player to choose between ammo and cargo on every voyage).

**Complexity:** Low-medium (add `ammo` to hold.items as a tracked-separately provision; modify BATTLE_ACTION reducer to decrement ammo; modify combat action availability check; update MarketScreen to show ammo as a provision)
**Dependencies:** Cargo system (P1.4 ✅), BattleScreen
**Design impact:** Pre-battle preparation becomes meaningful. A trader with a full hold of silk and no ammo is genuinely vulnerable. Pirates are incentivised to carry more ammo, which means less trade cargo — creating a real identity trade-off between combat and commerce builds.

---

### N2.3 — Medicine as Combat Consequence Modifier
**What:** Add `medicine` to the hold as a provision. Medicine is not consumed daily — it is consumed when crew are lost in combat or in certain random events. Without medicine, all combat crew losses are permanent (current system). With medicine, each combat that causes crew loss has a `salvageable` portion: `Math.floor(crewLost × 0.4)` crew are "injured not dead" and recover after 3 days at sea (they are removed from active roster temporarily but return). Medicine is consumed per salvage event (1 unit per injured crew member saved). Running out of medicine fires a log warning before battle: "No medicine aboard — all losses will be permanent."

**Complexity:** Low-medium (add `medicine` to hold.items; modify DISMISS_BATTLE to check medicine and create a `recoveringCrew` array in state; modify ADVANCE_DAY to decrement recovery timers and restore recovered crew)
**Dependencies:** N2.2 (ammo — implement both provisions together in the same session), named crew (P1.5.1 ✅)
**Design impact:** Medicine makes named crew survivable, increasing attachment. A veteran gunner who gets injured in battle and recovers three days later is a story. Without medicine he's just gone. Creates a new preparation decision: trade cargo vs. medicine stock. Also creates a compelling risk at high infamy: the fight where you run out of medicine and lose four veterans permanently.

---

## Phase N3 — Smuggling & Mission Rework
> **Goal: mission types reflect the cargo system. Smuggling requires actual cargo. The mission board is fully meaningful.**

---

### N3.1 — Smuggling Mission Rework
**What:** Smuggling missions now require the player to purchase contraband goods (tobacco or slaves) and carry them to the target port. The mission board shows: what contraband, quantity required, target port, gold reward. Player must buy the goods at the current port (or a nearby port that stocks them), sail with contraband in hold, and deliver. Navy patrol random event now checks hold for contraband when inspection occurs — if found, contraband is seized (loseContraband consequence) and rep takes a hit. Completing delivery gives gold + infamy + pirate rep, as currently.

**Complexity:** Medium (update mission generator to produce contraband-specific missions; update COMPLETE_MISSION to verify correct cargo in hold; update navy_patrol event to inspect hold)
**Dependencies:** N2.1 (plunder screen), cargo system (P1.4 ✅), parametric missions (✅)
**Design impact:** Smuggling becomes a full system loop rather than a mission that generates a port and a number. The risk is real — you carry illegal goods across the sea and can be caught at any moment. High infamy players face more patrols, making smuggling progressively riskier as you specialize in it.

---

### N3.2 — Trade Delivery Mission Type
**What:** A new mission type: "deliver X units of [good] to [port] within [days]." Player must purchase the goods (at their own cost), transport them, and deliver for a reward that exceeds the purchase cost by a margin worth the risk. The mission board shows: good type, quantity, delivery port, reward, and days remaining. If the player doesn't have enough hold space, the mission is shown with a warning. No time limit in the first implementation — add time pressure in N3.3.

**Complexity:** Low (new mission type in generator; COMPLETE_MISSION checks hold.items for required goods; no new reducer logic beyond the check)
**Dependencies:** N3.1 (smuggling rework — do both mission types in the same session), cargo system (P1.4 ✅)
**Design impact:** Trade and missions converge. A player doing a spice delivery mission is also a trader — their commerce and their quest are the same action. Hold space becomes contested between personal speculation and contracted delivery. Embodies the interaction-between-systems principle.

---

## Phase 1.5 (Remaining) — Crew as Characters
> **Goal: the crew are people. Losing them means something.**

---

### P1.5.2 — Crew Traits, Visible and Hidden
**What:** Each crew member gets 1 positive and 1 negative trait at hire. Negative traits marked `hidden: true` are not shown until their trigger fires. Traits are dormant flags activating at specific moments (combat, sailing, port, long voyage). `logic.js` gets `checkCrewTraits(state, trigger)` returning a list of effects. Reducer calls this at trigger points.

Example traits: `veteran` (combat: reduce damage taken), `surgeon` (post-combat: save crew — interacts with N2.3 medicine), `navigator` (sailing: reduce travel days), `drunkard` (in port: consume rum from hold — hidden), `coward` (high-risk battle: morale penalty), `informant` (enemy port: reputation leak — hidden), `troublemaker` (long voyage: tension spark).

**Complexity:** Medium-high (new logic hook system, data structure, trigger points in engine)
**Dependencies:** P1.5.1 ✅, N2.3 (surgeon trait is more meaningful with the medicine system)
**Design impact:** Stories happen without scripting. The drunkard consumes your rum stock. The surgeon saves lives when you have medicine. The coward deserts before an assault. This is the core of the emergent story engine.

---

### P1.5.3 — Crew Scars and Permanent Consequences
**What:** Combat outcomes and certain events permanently modify a crew member's state via a `scars[]` array. Surviving a boarding adds `"battle_scarred"`. Surviving plague adds `"plague_survivor"`. Some scars are penalties, some are badges of honour (minor morale bonus from veteran's presence). Displayed in CrewScreen.
**Complexity:** Low (Layer 2 infrastructure handles modifier logic — scars are persistent trait overrides)
**Dependencies:** P1.5.2
**Design impact:** Players remember scars more than stats. A one-handed veteran navigator who is still your best navigator creates genuine attachment.

---

### P1.5.4 — Crew Tensions
**What:** A `tensions[]` array in crew state tracks active feuds between specific crew members by id. Tension increments from trait interaction events. At threshold (5), a conflict event fires with player choices: side with one, lock both up, mediate. Resolution either removes a crew member or resets tension with morale consequences.
**Complexity:** Medium (tension table management, conflict event pool, trigger logic in ADVANCE_DAY)
**Dependencies:** P1.5.2 (traits cause tension)
**Design impact:** "I've been managing the feud between my navigator and my gunner since Nassau" is the exact story this creates. Crew drama becomes a management challenge the player actively navigates.

---

## Phase 1 (Remaining) — Core Loop Completion
> **Goal: remaining pressure mechanics that close the loop on the original design.**

---

### P1.6 — Morale Decay in Port (Idle Pressure)
**What:** Crew morale decays 1 point per day in port when the player hasn't completed a mission or sailed in 3+ days. A gentle push — not punishing, but clearly present. Log entry: "The crew grows restless in harbour."
**Complexity:** Low (add idle day counter to state, check in a future ADVANCE_IN_PORT action, or approximate with a port-days counter)
**Dependencies:** P1.1 ✅ (recovery must exist before decay pressure), note: there is currently no time advancement in port — this item requires deciding whether to add a "Rest in Port" button that advances time, or to approximate with a different mechanism
**Design impact:** The player cannot park indefinitely. There is always a soft reason to act.

---

### P1.8 — Campaign Clock
**What:** Display the current year (starting 1695). Every 365 days the year advances. At certain year thresholds, world difficulty increases: more patrols, stronger enemy ships, fewer pirate-friendly ports. The golden age of piracy ends around 1730. If the player hasn't retired by then, the world becomes actively hostile — a soft long-term deadline.
**Complexity:** Low (year is `Math.floor(state.day / 365) + 1695`; thresholds checked in world state)
**Dependencies:** P1.5 ✅ (retirement needs to exist for the deadline to be meaningful)
**Design impact:** Every voyage has a place in time. The player is building toward something before the window closes.

---

## Phase 2 — World Comes Alive
> **Goal: the world moves whether the player acts or not. Every voyage finds a different Caribbean.**

---

### P2.1 — World State Flags (Layer 1)
**What:** Add a `world` object to `initialState`: `{ wars: [], plagues: [], sieges: [], treasureFleets: [], eventLog: [] }`. A `getWorldModifiers(state, context)` function in logic.js returns relevant modifiers for any query (encounter rate, price multiplier, available services).
**Complexity:** Low (new state object, one new logic function, reads in existing systems)
**Dependencies:** All Phase 1 and N-phase items complete
**Design impact:** Infrastructure layer. On its own, minimal impact — it is the foundation for everything else in Phase 2.

---

### P2.2 — Scripted World Events (Layer 2)
**What:** A `WORLD_EVENTS` pool in data.js with condition-gated, weighted events that fire in `ADVANCE_DAY` (~5% per day). Events set world state flags with durations. Initial set: war between two factions, plague at a port, treasure fleet in transit, navy moves on a pirate haven. Each event has `effects` modifying encounter rates, prices, missions, and services.
**Complexity:** Medium (new event pool, daily check in engine, duration tracking)
**Dependencies:** P2.1, P1.3 ✅ (price system must exist for price effects to matter)
**Design impact:** The world breathes. Wars create danger and opportunity simultaneously. Plague creates moral choices. Treasure fleets create timed high-risk windows.

---

### P2.3 — Player Interaction with World Events via Missions (Layer 3)
**What:** World events include a `missionPool` field listing mission templates active while the event is live. `generateMissions` checks active world events and adds these to the pool. No new architecture — world events feed the existing mission system.
**Complexity:** Low (world events carry the data; mission generator reads it)
**Dependencies:** P2.2
**Design impact:** The player now has concrete reasons to engage with or ignore world events. The world doesn't just happen to them — they can shape it.

---

### P2.4 — Dynamic Prices Reacting to World Events
**What:** World events modify the `priceModifier` field that `getWorldModifiers` returns. War raises weapon and food prices. Plague raises medicine prices dramatically. A blockaded port raises all prices. Modifiers stack on top of the parametric base variance.
**Complexity:** Low (P2.1 infrastructure already designed for this)
**Dependencies:** P2.2, P1.3 ✅
**Design impact:** Prices tell a story. A medicine price spike tells you something is wrong before you know what. Economy becomes a source of world information.

---

### P2.5 — Rumor System
**What:** Taverns generate 2–3 rumors per visit. Rumors are parametric sentence templates filled from live game state: world events, active flags, known NPC locations, port prices. Rumors have a `reliability` flag (true/outdated/false) the player cannot see — they must evaluate whether to act on them.
**Complexity:** Medium (template system, state query functions, UI in port screen)
**Dependencies:** P2.2 (world events give rumors content), P1.5.1 ✅ (named crew give rumors texture)
**Design impact:** Information becomes a resource. False rumors create risk. Supports exploration motivation and faction intrigue.

---

### P2.6 — Captured Ships and Prize System
**What:** After combat victory, a post-battle option: sink, loot and let go, or take as prize. A prize ship sails alongside you to the next port and can be sold (scaled to class and hull condition). Cannot fight effectively while escorting a prize — speed reduced, cannot flee easily.
**Complexity:** Medium (new state field `escortedPrize`, speed/flee modifiers, sale UI in shipyard)
**Dependencies:** P0.8 ✅ (intercept screen), N2.1 (plunder screen — do prizes and plunder in the same combat-reward pass)
**Design impact:** Every victory becomes a decision. The temptation of a prize creates risk — escorting it makes you vulnerable. Embodies "success creates new problems."

---

### P2.8 — Bounty Hunter Spawns
**What:** High infamy attracts hired hunters. `calculateNotoriety(state)` combines infamy and negative faction reputation. `shouldSpawnHunter(state)` rolls daily against notoriety. Hunter ships route through the intercept screen as `bounty_hunt` encounter type with scaling templates (sloop at low fame, frigate at high fame). Defeating a hunter yields high gold, fame, and notoriety reduction.
**Complexity:** Medium (new logic functions, encounter type, data templates, notoriety display)
**Dependencies:** P2.7 ✅ (infamy track), P0.8 ✅ (intercept screen)
**Design impact:** High infamy has real teeth. A string of profitable raids summons increasingly dangerous hunters. Notoriety display gives visible warning before hunters become overwhelming.

---

## Phase 3 — Depth and Replayability
> **Goal: the world has secrets. The player has rivals. Named characters have histories.**

---

### P3.1 — Unlockable Map Areas
**What:** Certain ports are hidden until unlock conditions are met: fame threshold, specific item (map fragment from event or quest), minimum ship size, or faction relationship threshold. Locked areas shown as fog with a faint hint. Unlock is permanent for that save.
**Complexity:** Medium (unlock condition check in MapScreen, `unlockedAreas[]` in state)
**Dependencies:** P1.5 ✅, N1.2 (max days at sea — range and discovery are related gatings), P2.2 (map fragments can come from world events)
**Design impact:** The map is not a solved space. Experienced players know where secrets are. New players discover them through play.

---

### P3.2 — Named Rival NPC Captains
**What:** 3–5 named rival captains generated at game start (name + ship name + 2 traits + faction). They appear at ports, feature in rumors, occasionally cross the player's path as combat encounters. They have a `history[]` populated by actual game events. When encountered, their ship has a name and they taunt you in the battle log. They can be defeated permanently or escape.
**Complexity:** Medium-high (NPC state management, persistence, encounter routing, rumor integration)
**Dependencies:** P2.5 (rumors reference them), P1.5.1 ✅
**Design impact:** Players love recurring enemies. The rival who escaped in Nassau, rebuilt, and returned stronger is one of the most memorable things a game can generate.

---

### P3.3 — Governor Missions and Letters of Marque
**What:** At Allied ports (rep ≥ 80), the governor has unique high-stakes missions. Completing enough earns a Letter of Marque — a legal commission making you a privateer. With a Letter, attacking that faction's enemies gives no negative reputation with them; attacking their allies is a severe betrayal.
**Complexity:** Medium (new NPC type, governor mission pool, Letter of Marque state flag and modifier)
**Dependencies:** P1.7 ✅, P2.7 ✅
**Design impact:** High reputation has tangible endgame payoff. The Letter is a meaningful political choice — committing to one faction closes doors with others.

---

### P3.4 — Crew Officers
**What:** Named officer slots: Navigator, Surgeon, Gunner, Bosun. Hired separately at taverns for higher cost with specific trait requirements. Each has a `loyalty` score influenced by player decisions. Officers provide passive bonuses (navigator reduces travel days, surgeon reduces combat crew loss with or without medicine, gunner increases combat damage, bosun maintains discipline). Losing an officer is a significant setback.
**Complexity:** High (officer slots interact with almost every system)
**Dependencies:** P1.5 fully complete and stable
**Design impact:** Small cast of named characters the player actively manages and protects. Losing your surgeon before a long voyage is a real tactical decision.

---

### P3.5 — Personal Quest Line
**What:** A loose multi-part quest providing long-term narrative purpose. Classic pirate framing: a personal wrong to right (a stolen ship, a betrayed family, a past to escape). Each chapter requires sailing to specific ports, gathering intel, completing difficult missions. Implemented as a special mission chain with unique events, not a new system.
**Complexity:** Medium-high (content work more than system work)
**Dependencies:** Phase 2 stable, P3.2 (the antagonist is a named rival NPC)
**Design impact:** Gives the player a "why" beneath the systemic loop. Transforms voyages into a story with a shape.

---

## Phase 4 — Save, Persistence, and Polish
> **Goal: long campaigns are protected. The game communicates clearly.**

---

### P4.1 — Auto-Save at Key Moments
**What:** Automatically call `L.saveGame()` on every `ADVANCE_DAY`, port entry, and mission completion. Show a brief "Saved" indicator in HUD.
**Complexity:** Low
**Dependencies:** P0.3 ✅
**Design impact:** Removes fear of progress loss. Players take more risks.

---

### P4.2 — Multiple Save Slots + JSON Export
**What:** Three manual save slots plus auto-save. Each slot shows: captain name, day, gold, ship, fame. JSON export button for backup and sharing.
**Complexity:** Medium
**Dependencies:** P4.1
**Design impact:** Enables experimentation. Players can try risky plays and reload, or continue on another device.

---

### P4.3 — Endgame: Retirement and Final Score
**What:** Retirement available from port screen when fame ≥ 500. Triggers a retirement screen with final score (gold + fame × 100 + ship value + crew size + years active), a text epilogue based on score tier and dominant faction reputation, and options for New Game+ or main menu.
**Complexity:** Medium
**Dependencies:** P1.5 ✅ (fame gating), P3.3 (Letters of Marque affect epilogue)
**Design impact:** The game has a shape and a destination. Retirement transforms a score into a story summary.

---

### P4.4 — Difficulty Settings
**What:** Three settings at game start affecting: encounter rates, wage multipliers, provision consumption rate, and starting gold. Easy / Normal / Brutal. Brutal: morale decay faster, provisions run out quicker, every success creates more pressure.
**Complexity:** Low (multipliers on existing calculations)
**Dependencies:** Phase 1 complete and N-phases complete (difficulty settings only mean something once all pressure systems exist)
**Design impact:** Accessibility for new players. Brutal mode becomes the intended experience for veterans.

---

## Long-Term Vision
> Design ideas worth keeping in mind but not scheduling. Build only if the game is stable, fun, and there is capacity.

| Idea | Notes |
|---|---|
| Equipment slot system | Replace the current simple upgrade list with physical ship slots (hull, rigging, armament, figurehead). Each slot accepts one item. Creates tradeoffs between upgrade types. Prerequisite before adding more upgrade items. |
| Cargo hold upgrade | Deferred from P1.4. Part of the equipment slot redesign — increases hold.capacity as an upgrade effect. |
| Infamy reduction mechanic | Paying a debt to governors to reduce infamy. Gives high-infamy players an expensive escape valve. Natural fit with P3.3 (governor relationship). |
| Procedural rumor generation | NLP-style template expansion from game state. Deferred until rumor system (P2.5) is stable. |
| Dynamic faction wars (autonomous) | Factions act and expand without player. Risks runaway domination. Very high complexity. |
| Fleet system | Player owns multiple ships, assigns crew and routes. Transforms game scope significantly. |
| Visual sailing mode | Upgrade SailingScreen from day-counter to animated top-down sailing. Medium complexity, high feel — only after all systems are stable. |
| Procedural music (sea shanties) | Web Audio API, mood-reactive. Fun but purely cosmetic. |
| Multiplayer | Shared world, competing captains. Entirely different architecture. |

---

## Phase Sequence Summary

```
✅ Phase 0     Fix what's broken before building anything.
✅ Phase 1     Add pressure. Make existing systems matter.
✅ Phase 1.5a  Named crew roster. Crew are people now.
✅ P2.7        Infamy track — player identity has mechanical weight.
✅ P1.6a       Parametric missions — the board generates, not selects.

→ Phase N1     Start right. Dinghy starts, map range, mobile, balance tool.
→ Phase N2     Combat depth. Plunder, ammo, medicine.
→ Phase N3     Mission rework. Smuggling and trade delivery are real loops.
→ Phase 1.5b   Crew traits, scars, tensions. Crew become cast.
→ Phase 1 rem  Idle morale decay, campaign clock.
→ Phase 2      World comes alive. Events, prices, rumors, prizes, bounties.
→ Phase 3      Depth. Rivals, unlocks, governors, officers, quest line.
→ Phase 4      Polish. Auto-save, multiple slots, retirement, difficulty.
```

The sequence avoids rework by establishing foundations before features. Geographic range (N1.2) must exist before unlockable areas (P3.1) are meaningful. Medicine (N2.3) must exist before the surgeon crew trait (P1.5.2) has mechanical depth. Named rivals (P3.2) must exist before the personal quest line (P3.5) has an antagonist. Each layer is stable before the next builds on it.

The game is always in a fully playable state at any phase boundary.