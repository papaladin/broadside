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

### Development Constraints

These apply to every phase, every feature, without exception:

- **Test coverage:** every new system ships with at least one unit test in `logic.js` and one reducer test in `engine.js`. UI smoke tests for any new screen. Tests are written in the same session as the feature, not deferred.
- **Documentation:** `architecture.md` is updated when a new system changes the state shape, adds a major function, or introduces a new screen. `README.md` feature list is updated at the end of each phase.
- **No orphaned code:** if a function is added to `logic.js`, it must be called somewhere. If a field is added to state, it must be read somewhere. Dead code is removed before the phase is closed.

---

## Roadmap Overview
**Standing rule across all phases:** a phase is not closed until its test coverage is written and `architecture.md` reflects any state shape changes introduced. Doc and test work are part of the feature, not a follow-up.

```
Phase 0 — Stabilization          (prerequisite for everything)
Phase 1 — Core Loop Pressure      (morale, time, money matter)
Phase 1.5 — Crew as Characters    (names, traits, scars)
Phase 2 — World Comes Alive       (economy, world events, crew drama)
Phase 3 — Depth & Replayability   (unlockable world, named NPCs, officers)
Phase 4 — Save & Polish           (robust persistence, UI feedback)
Long-term Vision                  (flags only — low priority)
```

Each phase is designed so the game is fully playable at the end of it. No phase creates a broken intermediate state.

---

## Phase 0 — Stabilization --> DONE
> **Goal: the foundation is trustworthy before we build on it.**

Nothing in Phase 1+ should be built on buggy infrastructure. This phase has no new features — only fixes.

---

### P0.1 — Fix duplicate `getEffectiveMorale` declaration --> DONE
**What:** `logic.js` declares `getEffectiveMorale` twice with `const` in the same scope. Fatal `SyntaxError` — `window.L` never loads, entire game is a blank screen.
**Complexity:** Trivial (delete 5 lines)
**Dependencies:** None
**Design impact:** Prerequisite for morale system functioning at all.

---

### P0.2 — Fix `L.calculateTravelDays` wrong function name in engine.js --> DONE
**What:** `engine.js` calls `L.calculateTravelDays()` but the function is named `L.travelDays()`. Crashes on every sail attempt.
**Complexity:** Trivial (rename call)
**Dependencies:** None
**Design impact:** Prerequisite for sailing to work.

---

### P0.3 — Fix `localStorage` key mismatch (save/load broken) --> DONE
**What:** `logic.js` save functions use key `"pirates_save"`, engine.js reducer uses `"piratesSave"`. The Continue button never appears. `L.saveGame` and `L.loadGame` are effectively dead code.
**Complexity:** Low (unify key, route engine SAVE/LOAD through `L.saveGame`/`L.loadGame`)
**Dependencies:** None
**Design impact:** Save/load must work before long campaigns have any meaning.

---

### P0.4 — Fix `START_GAME` mutating `initialState` --> DONE
**What:** `newState.crew.max = ...` mutates the shared `initialState` object. After the first game, a new game starts with corrupted initial state.
**Complexity:** Low (spread `crew` before mutating)
**Dependencies:** None
**Design impact:** Prerequisite for New Game and multiple sessions working correctly.

---

### P0.5 — Remove/fix dead `completeMissionOnCombatVictory` in logic.js --> DONE
**What:** Function internally calls `L.xxx` inside the IIFE where `L` doesn't exist yet. Never called anywhere. Either remove it or fix the references.
**Complexity:** Low
**Dependencies:** None
**Design impact:** Dead code cleanup — reduces confusion when extending the mission system.

---

### P0.6 — Fix victory gold display in BattleScreen --> DONE
**What:** `bs.goldReward` is never set in `battleState`. Victory screen always shows blank reward. Players receive gold silently with no feedback.
**Complexity:** Low (store `goldReward` in battleState when building it)
**Dependencies:** None
**Design impact:** Feedback. Players must know what they earned. Combat feels unrewarding without it.

---

### P0.7 — Fix HIRE_CREW and CrewScreen using base maxCrew instead of state.crew.max --> DONE
**What:** Two places read `SHIPS[type].maxCrew` instead of `state.crew.max`. Will break silently when any upgrade modifies crew capacity.
**Complexity:** Trivial
**Dependencies:** None
**Design impact:** Correctness prerequisite for upgrade system and crew capacity changes.

---

### P0.8 — Pre-battle intercept screen --> DONE
**What:** Currently every encounter jumps straight to combat. Add a brief intercept screen with options: Engage, Attempt to flee (speed check), Demand surrender (reputation-gated), Parley (faction-gated). This is the last Phase 0 item because it costs almost nothing structurally but has outsized impact on feel.
**Complexity:** Low-medium (new screen, new action, route existing battle trigger through it)
**Dependencies:** P0.2
**Design impact:** Encounters become *events* instead of interruptions. Supports faction reputation having practical meaning. Introduces player agency before combat begins. High feel-per-effort ratio — do early.

---

## Phase 1 — Core Loop Pressure
> **Goal: every day at sea has a cost. Every port has a purpose. The player cannot idle.**

This phase makes the existing systems matter. Nothing here is a new system — it's adding the *cost side* and *time pressure* that make current mechanics feel consequential.

---

### P1.1 — Morale recovery in port (Tavern service) --> DONE
**What:** Morale currently only decays. Add a Tavern service at eligible ports where the player can spend gold to raise crew morale. Also add passive morale recovery: each day in port (not at sea) restores 2 morale. Morale decay at sea continues.
**Complexity:** Low
**Dependencies:** P0.1
**Design impact:** Morale becomes a real resource with a natural cycle: decay at sea → recover in port → costs gold → drives the need for missions. Without recovery, morale is a permanent death spiral.

---

### P1.2 — Provisions system (food, water, medicine, ammunition)
**What:** Ships consume provisions daily at sea. Each provision type has a current stock and a max capacity (scaled to ship size). Running out of food/water causes morale loss per day. Running out of medicine means combat injuries become permanent crew losses. Running out of ammunition disables certain combat actions. Ports always have food and water (safeguard against hardlock), other provisions are available per port resource table. Player must consciously stock up before sailing.
**Complexity:** Medium
**Dependencies:** P1.1 (morale), P0.7 (crew capacity)
**Design impact:** This is the single most important pressure mechanic. Every long voyage becomes a calculation: "can I make it?" Short routes are safe. Long routes require planning. The sea becomes the real game board. Also creates the first meaningful reason to visit certain ports over others.

---

### P1.3 — Port resource system (fixed + parametric prices)
**What:** Each port in `data.js` gets a resource table defining what goods it stocks, base prices, supply tier, and price variance range. Price is recalculated on port entry (not simulated continuously). Certain ports have structural cheapness in certain goods (Tortuga: rum cheap; Cartagena: weapons expensive; Nassau: no medicine). Food and water always available at minimum stock. Creates logical trade routes from the fixed differentials.
**Complexity:** Medium
**Dependencies:** P1.2 (provisions system defines what resources matter)
**Design impact:** Trading becomes strategic rather than arbitrary. The player learns the map through its economic logic. Combined with P1.2, provisioning becomes a genuine pre-voyage decision.

---

### P1.4 — Cargo system (capacity, weight, speed tradeoff)
**What:** Ships have a cargo capacity (scaled by ship type, increased by cargo hold upgrade). Filling cargo slows the ship (speed penalty proportional to load %). Player must balance profit from cargo against the risk of being slower to flee or maneuver. Plundered goods from combat victories go into cargo and must be sold at port.
**Complexity:** Medium
**Dependencies:** P1.3 (resource system defines what cargo exists)
**Design impact:** Every combat victory creates a new decision (take the cargo or leave it?). Trade becomes a genuine risk/reward tradeoff. Speed upgrades become more meaningful when the player is regularly hauling cargo.

---

### P1.5 — Fame display in HUD + basic fame gating
**What:** Add `★ {state.fame}` to HUD. In `data.js`, add `requiredFame` to certain ships, upgrades, and high-risk missions. Shipyard and mission board filter/grey out items below fame threshold with visible requirement shown.
**Complexity:** Low
**Dependencies:** None (fame already exists in state)
**Design impact:** Fame becomes a visible progression axis. Players understand what they're working toward. High-tier content feels earned rather than bought.
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

---

### P1.6 — Morale decay in port (idle pressure)
**What:** Crew morale decays 1 point per day in port when the player hasn't done a mission or sailed in 3+ days. This is a gentle push — not punishing, but clearly present. Log entry: "The crew grows restless in harbour."
**Complexity:** Low
**Dependencies:** P1.1 (morale recovery must exist before adding decay pressure)
**Design impact:** The player cannot park indefinitely. There is always a soft reason to act. Embodies the core design principle: pressure.

---

### P1.7 — Reputation perks (threshold behaviors)
**What:** Reputation thresholds unlock or restrict concrete mechanical behaviors, not just narrative flavor. Proposed tiers:
- **At War (< 10):** entering port triggers combat (already partially exists). Black market only (no official services).
- **Hostile (10–29):** port fee to dock. No crew hire. Reduced mission pool.
- **Neutral (30–49):** standard access.
- **Friendly (50–69):** repair discount 10%. Better mission quality.
- **Allied (≥ 80):** repair discount 20%. Elite crew available. Governor missions unlock. Patrol ships ignore minor crimes.
**Complexity:** Low-medium (add threshold lookup to existing service-access checks)
**Dependencies:** P0.3 (save must work — reputation is a long-term investment)
**Design impact:** Reputation becomes mechanical, not cosmetic. Building relationship with a faction has practical payoff. Burning bridges has practical costs. Supports the conflicting-faction design principle.

---

### P1.8 — Campaign clock
**What:** Display the current year (starting 1695). Every 365 days, the year advances. At certain year thresholds, world difficulty increases: more patrols, stronger enemy ships, fewer pirate-friendly ports. The golden age of piracy ends around 1730. If the player hasn't retired by then, the world becomes actively hostile. This creates a soft long-term deadline.
**Complexity:** Low (year is `Math.floor(state.day / 365) + 1695`, thresholds are checked in world state)
**Dependencies:** P1.5 (fame/retirement system needs to exist for the deadline to be meaningful)
**Design impact:** Every voyage has a place in time. The player is building toward something before the window closes. Embodies the pressure principle at the macro scale.

---

## Phase 1.5 — Crew as Characters
> **Goal: the crew are people. Losing them means something.**

This phase transforms the crew from a number into a cast. It makes every existing event more emotionally resonant without adding new content — the storm now kills someone with a name. Build before economy (Phase 2) because crew attachment makes dangerous voyages feel significant.

---

### P1.5.1 — Named crew roster (Layer 1) -> DONE
**What:** Replace `crew.current` (a number) with `crew.roster` (an array of crew member objects). Each member has: `id`, `name` (drawn from faction-appropriate name list in data.js), `role` (deckhand/gunner/cook/carpenter/navigator — weighted random), `daysAboard`. `crew.current` becomes `crew.roster.length`. Hire/fire/lose crew becomes array add/remove. Events reference specific crew members by name.
**Complexity:** Medium (refactor all `crew.current` references in engine.js, logic.js, screens.jsx — systematic but not conceptually hard)
**Dependencies:** Phase 0 complete
**Design impact:** Immediate emotional resonance. "Lost 3 crew" becomes "Torres and Marta didn't make it." Players remember names. Attachment begins here.

---

### P1.5.2 — Crew traits, visible and hidden (Layer 2)
**What:** Each crew member gets 1 positive and 1 negative trait at hire. Negative traits marked `hidden: true` are not shown to the player until their trigger fires. Traits are dormant flags that activate at specific game moments (combat, sailing, port, long voyage). Logic.js gets `checkCrewTraits(state, trigger)` which returns a list of effects. Reducer calls this at trigger points.

Example traits: `veteran` (combat: reduce damage taken), `surgeon` (post-combat: save crew from death), `navigator` (sailing: reduce travel days), `drunkard` (in port: lose rum stock — hidden), `coward` (high-risk battle: morale penalty), `informant` (enemy port: reputation leak — hidden), `troublemaker` (long voyage: tension spark).

**Complexity:** Medium-high (new logic hook system, data structure, trigger points in engine)
**Dependencies:** P1.5.1
**Design impact:** Stories happen without scripting. The drunkard seems like a normal deckhand for two weeks. The surgeon reveals himself when he saves someone's life. The coward reveals himself at the worst moment. This is the core of the emergent story engine.

---

### P1.5.3 — Crew scars and permanent consequences (Layer 3)
**What:** Certain combat outcomes or events permanently modify a crew member's state via a `scars[]` array. A crew member who survives a bad boarding loses `"lost_hand"` — suppressing their `strong` trait bonus but not removing them from the roster. A sailor who survives plague gets `"survived_plague"`. Some scars are penalties, some are badges of honor (minor morale bonus from the rest of the crew toward a scarred veteran). Scars displayed in CrewScreen.
**Complexity:** Low (Layer 2 infrastructure handles the modifier logic — scars are just persistent negative traits)
**Dependencies:** P1.5.2
**Design impact:** Players remember scars more than stats. A one-handed veteran navigator who is still your best navigator creates genuine attachment. The cost of keeping them is the story.

---

### P1.5.4 — Crew tensions (Layer 4)
**What:** A `tensions[]` array in crew state tracks active feuds between specific crew members (identified by id). Tension level increments from trait interaction events (troublemaker near gambler, coward near veteran after a battle the coward ran from). When tension hits threshold (5), a conflict event fires with player choices: side with one, lock both up, mediate. Resolution either removes one crew member or resets tension with morale consequences for all.
**Complexity:** Medium (tension table management, conflict event pool, trigger logic in ADVANCE_DAY)
**Dependencies:** P1.5.2 (traits are what cause tension), robust event system
**Design impact:** "I've been managing the feud between my navigator and my gunner since Nassau" is the exact story this creates. Crew drama becomes a management challenge the player actively navigates. Embodies emergent storytelling.

---

## Phase 2 — World Comes Alive
> **Goal: the world moves whether the player acts or not. Every voyage finds a different Caribbean.**

---

### P2.1 — World state flags (Layer 1)
**What:** Add a `world` object to `initialState`: `{ wars: [], plagues: [], sieges: [], treasureFleets: [], eventLog: [] }`. These flags are read by existing systems to modify behavior. A `getWorldModifiers(state, context)` function in logic.js returns relevant modifiers for any query (encounter rate, price multiplier, available services).
**Complexity:** Low (new state object, one new logic function, reads in existing systems)
**Dependencies:** Phase 1 complete
**Design impact:** Infrastructure that enables everything else in Phase 2. On its own, minimal impact — it's the foundation layer.

---

### P2.2 — Scripted world events (Layer 2)
**What:** A `WORLD_EVENTS` pool in data.js with condition-gated, weighted events that fire in `ADVANCE_DAY` (separate roll from personal events, ~5% per day, conditions prevent spam). Events set world state flags and have durations after which they expire with a resolution entry in the event log. Initial event set: war between two factions, plague at a port, treasure fleet in transit, navy moves on a pirate haven. Each event has `effects` that modify encounter rates, prices, available missions, and services at affected ports.
**Complexity:** Medium (new event pool, new daily check in engine, duration tracking)
**Dependencies:** P2.1, P1.3 (price system must exist for price effects to matter)
**Design impact:** The world breathes. The player logs into a Caribbean that has changed since their last session. Wars create danger and opportunity simultaneously. Plague creates moral choices (price-gouge medicine or deliver it?). Treasure fleets create timed high-risk high-reward windows.

---

### P2.3 — Player interaction with world events via missions (Layer 3)
**What:** World events in P2.2 include a `missionPool` field listing mission templates to activate at affected ports while the event is live. `generateMissions` checks active world events and adds these to the available pool. No new architecture — world events simply feed the existing mission system. Examples: war → blockade-run missions and supply convoy missions appear; plague → medicine delivery mission; treasure fleet → escort or intercept mission.
**Complexity:** Low (world events already carry the data, mission generator reads it)
**Dependencies:** P2.2
**Design impact:** The player now has concrete reasons to engage with or ignore world events. The world doesn't just happen to them — they can shape it through their choices of which missions to take. Embodies the agency principle.

---

### P2.4 — Dynamic prices reacting to world events
**What:** World events modify the `priceModifier` field that `getWorldModifiers` already returns. War raises weapon and food prices. Plague raises medicine prices dramatically. A blockaded port raises all prices. These modifiers stack on top of the parametric base variance from P1.3. Calculated at port entry.
**Complexity:** Low (P2.1 infrastructure already designed for this)
**Dependencies:** P2.2, P1.3
**Design impact:** Prices tell a story. A medicine price spike tells you something is wrong before you know what. Trade routes are not static — the profitable route last month might be unprofitable now. Economy becomes a source of world information.

---

### P2.5 — Rumor system
**What:** Taverns (port service) generate 2-3 rumors per visit. Rumors are parametric sentence templates filled from live game state: world events, active world flags, known NPC locations, port prices. Template examples: "[Faction] warships are patrolling the [region] route", "Medicine prices are high in [plague port]", "A treasure fleet was spotted near [port]", "[NPC name] was seen in [port] three days ago". Rumors have a `reliability` flag (true/outdated/false) that the player cannot see — they must evaluate whether to act on them.
**Complexity:** Medium (template system + state query functions + UI in port screen)
**Dependencies:** P2.2 (world events give rumors content), P1.5.1 (named crew give rumors texture)
**Design impact:** Information becomes a resource. The player has reasons to visit taverns even without missions. False rumors create risk — acting on bad intel is a real loss. Supports exploration motivation and faction intrigue.

---

### P2.6 — Captured ships and prize system
**What:** After a combat victory, the intercept screen (P0.8) gets a post-battle option: sink, loot and let go, or take as prize. Taking a prize means the ship sails alongside you to the next port where it can be sold for gold (scaled to ship class and hull condition). Cannot fight effectively while escorting a prize (speed reduced, cannot flee easily). Gives combat a second reward layer — a big galleon is worth as much as 10 standard missions.
**Complexity:** Medium (new state field `escortedPrize`, modifiers to speed/flee, sale UI in shipyard)
**Dependencies:** P0.8 (intercept screen), P1.4 (cargo system for loot)
**Design impact:** Every combat victory becomes a decision. The temptation of a prize creates risk — escorting it makes you vulnerable. Embodies the "success creates new problems" principle.

---

### P2.7 — Infamy track (separate from Fame)
**What:** Add `infamy` to state alongside `fame`. Fame rises from heroic acts (rescues, defending merchants, completing good-faction missions). Infamy rises from piracy, raiding, attacking civilians. Both are visible in HUD. High infamy triggers bounty hunters and makes law-abiding ports hostile. High fame opens governor missions and reduces hostile encounters. High in both (the notorious privateer) is the most interesting state — attracts hunters from criminal side AND attracts challengers from the heroic side.
**Complexity:** Medium (new state field, new event triggers for both tracks, UI)
**Dependencies:** P1.5, P1.7 (reputation perks need the distinction to be meaningful)
**Design impact:** Player identity becomes mechanical. A pure pirate plays differently from a privateer differently from a trader. Replayability increases because each identity has different pressures.

---

### P2.8 — Bounty Hunter Spawns
**What:** High infamy attracts hired hunters. A `calculateNotoriety(state)` function in logic.js combines infamy score and negative reputation across factions into a single notoriety value. A `shouldSpawnHunter(state)` function rolls against notoriety daily — low notoriety means rare spawns, high notoriety means near-certain. When a hunter spawns, it routes through the intercept screen (P0.8) as a special encounter type (`bounty_hunt`) with fight as the only real option and flavour text naming the hiring faction. Hunter ships are templates in `data.js` scaled to player fame tier — a low-fame player gets a sloop, a high-fame player gets a frigate with veteran crew. Defeating a hunter yields high gold, high fame, and a notoriety reduction. Notoriety is displayed on the FactionsScreen.
**Complexity:** Medium (new logic functions, new encounter type, new data templates, notoriety display)
**Dependencies:** P2.7 (infamy track is the input to notoriety), P0.8 (intercept screen handles the encounter)
**Design impact:** High infamy has real teeth. The player cannot raid indefinitely without consequences finding them at sea. Embodies "every success creates new problems" — a string of profitable raids summons increasingly dangerous hunters. Notoriety display on FactionsScreen gives the player visible warning before hunters become overwhelming.


---

## Phase 3 — Depth and Replayability
> **Goal: the world has secrets. The player has rivals. Named characters have histories.**

---

### P3.1 — Unlockable map areas
**What:** Certain ports and sea areas are hidden on the map until unlock conditions are met. Conditions can be: fame threshold, specific item (map fragment found via random event or quest), minimum ship size (certain straits require a frigate or larger), faction relationship threshold (a hidden pirate haven only revealed by high pirate rep). Locked areas shown as fog on the map with a faint hint that something exists there. Unlock is permanent for that save.
**Complexity:** Medium (unlock condition check in MapScreen, `unlockedAreas[]` in state)
**Dependencies:** P1.5 (fame gating), P2.2 (map fragments can come from world events)
**Design impact:** The map is not a solved space. Experienced players know where secrets are. New players discover them through play. Replay value comes from deliberately pursuing different unlock paths.

---

### P3.2 — Named rival NPC captains
**What:** 3-5 named rival captains exist in the game world. Generated once at game start (name from faction word list + ship name + 2 traits + faction). They appear at ports, feature in rumors, occasionally cross the player's path as combat encounters. They have a `history[]` array populated by actual game events (survived a fight with the player, sacked a port, gained notoriety). When encountered in combat, their ship has a name and they taunt you in the battle log. They can be defeated permanently or escape (at low hull they flee). Defeating a named rival gives a large fame/infamy reward.
**Complexity:** Medium-high (NPC state management, persistence, encounter routing, rumor integration)
**Dependencies:** P2.5 (rumors reference them), P1.5.1 (named characters infrastructure)
**Design impact:** Players LOVE recurring enemies. The rival who escaped in Nassau, built up their ship, and comes back stronger is one of the most memorable things a game can generate. Rivals create personal narrative arcs within the systemic game.

---

### P3.3 — Governor missions and Letters of Marque
**What:** At Allied ports (rep ≥ 80), the governor becomes accessible as a special NPC with unique missions unavailable on the standard board. These are higher stakes, higher reward, and push the world state in meaningful directions (defeat a rival, break a blockade, deliver a treaty). Completing enough governor missions for a faction can earn a Letter of Marque — a formal commission that makes you a legal privateer. With a Letter of Marque, attacking that faction's enemies gives no negative reputation with them, but attacking their allies becomes a severe betrayal.
**Complexity:** Medium (new NPC type, governor mission pool, Letter of Marque state flag and modifier)
**Dependencies:** P1.7 (reputation perks), P2.7 (infamy track — the Letter is about legal identity)
**Design impact:** High reputation has a tangible endgame payoff. The Letter of Marque is a meaningful political choice — committing to one faction closes doors with others. Supports the conflicting-faction design principle.

---

### P3.4 — Crew officers (Layer 5)
**What:** A small number of named officer slots: Navigator, Surgeon, Gunner, Bosun. Hired separately at taverns for higher cost and with specific trait requirements. Each officer has a `loyalty` score (separate from morale) that tracks their personal relationship with the captain — influenced by player decisions during events. Officers provide passive bonuses to their domain (navigator reduces travel days, surgeon reduces combat crew loss, gunner increases combat damage, bosun maintains discipline). Losing an officer (killed, deserted due to low loyalty) is a significant setback.
**Complexity:** High (officer slots interact with almost every system)
**Dependencies:** P1.5 complete and stable, P2.5 (rumors can reference officers)
**Design impact:** Small cast of named characters the player actively manages and protects. Creates attachment at a higher intensity than roster crew. Losing your surgeon before a long voyage is a real tactical decision: do you delay and find a new one, or risk it?
**Note — subsumes Crew Specialists from earlier design:** The officer system is the intended implementation of the "crew specialists" concept (named hireable roles with mechanical effects: Gunner, Navigator, Doctor/Surgeon, Bosun). The distinction is that officers are slot-based, loyalty-tracked, and deeply integrated rather than a flat array of stat modifiers. Any tasks previously listed under "Crew Specialists" (tavern hire flow, `crew.specialists` state array, `getShipStats` modifier integration) are implemented here instead, not as a separate prior system.

---

### P3.5 — Personal quest line (optional, narrative layer)
**What:** A loose multi-part quest that provides long-term narrative purpose without railroading. Classic pirate framing: a personal wrong to right (a stolen ship, a betrayed family, a past to escape). Each chapter requires sailing to specific ports, gathering intel, completing difficult missions. The quest exists alongside all other systems — it doesn't replace emergent play, it gives it direction. Implemented as a special mission chain with unique events, not a new system.
**Complexity:** Medium-high (content work more than system work)
**Dependencies:** Phase 2 stable, P3.2 (the antagonist is a named rival NPC)
**Design impact:** Gives the player a "why" beneath the systemic loop. Transforms a series of voyages into a story with a shape. Not required for the game to be good — but makes it memorable.

---

## Phase 4 — Save, Persistence, and Polish
> **Goal: long campaigns are protected. The game communicates clearly.**

---

### P4.1 — Auto-save at key moments
**What:** Automatically call `L.saveGame()` on every `ADVANCE_DAY`, port entry, and mission completion. Show a brief "Saved" indicator in HUD. Player can always continue from last meaningful state.
**Complexity:** Low
**Dependencies:** P0.3 (save must be fixed first)
**Design impact:** Removes fear of progress loss. Players take more risks when they know they can continue.

---

### P4.2 — Multiple save slots + JSON export
**What:** Three manual save slots plus the auto-save. Each slot shows: captain name, day, gold, ship, fame. JSON export button for backup and sharing.
**Complexity:** Medium
**Dependencies:** P4.1
**Design impact:** Enables experimentation. Players can try a risky play and reload if it goes wrong — or export their save to continue on another device.

---

### P4.3 — Endgame: retirement and final score
**What:** Retirement available from port screen when fame ≥ 500. Triggers a retirement screen showing final score (formula: gold + fame × 100 + ship value + crew size + years active), a text epilogue based on score tier and dominant faction reputation, and options for New Game+ (carries over one persistent bonus) or main menu.
**Complexity:** Medium (score calculation, epilogue text bank, retirement screen)
**Dependencies:** P1.5 (fame gating), P3.3 (Letters of Marque affect epilogue)
**Design impact:** The game has a shape. There is a destination, and the journey to it matters. Retirement transforms a score into a story summary.

---

### P4.4 — Difficulty settings
**What:** Three settings at game start affecting: encounter rates, wage multipliers, provision consumption rate, and starting gold. Easy/Normal/Brutal. Brutal mode: morale decay is faster, provisions run out quicker, every success creates more pressure.
**Complexity:** Low (multipliers on existing calculations)
**Dependencies:** Phase 1 complete (difficulty settings only mean something once pressure systems exist)
**Design impact:** Accessibility for new players. Brutal mode becomes the intended experience for veterans — maximum pressure, maximum emergence.

---

## Long-Term Vision
> These are design ideas worth keeping in mind but not scheduling. They should only be built if the game is stable, fun, and the team has capacity.

| Idea | Notes |
|---|---|
| Procedural rumor generation | NLP-style template expansion from game state. Deferred until rumor system is stable. |
| Dynamic faction wars (autonomous) | Factions act and expand without player. Risks runaway domination. Very high complexity. |
| Fleet system | Player owns multiple ships, assigns crew and routes. Transforms the game's scope significantly. |
| Multiplayer | Shared world, competing captains. Entirely different architecture. |
| Mobile-optimized UI | Responsive layout, touch controls. After core game is feature-complete. |
| Procedural music (sea shanties) | Web Audio API, mood-reactive. Fun but purely cosmetic. |
| Visual sailing mode (real-time) | Upgrade SailingScreen from day-counter to animated top-down sailing. Medium complexity, high feel — but only after all systems are stable. |

---

## Summary: Phase Sequence and Rationale

```
Phase 0    Fix what's broken before building anything.
Phase 1    Add pressure. Make existing systems matter.
Phase 1.5  Give the crew names and personalities.
           Now every system has emotional weight.
Phase 2    The world moves. Economy, events, rivals begin.
           Crew drama and world events interact for the first time.
Phase 3    Depth and secrets. Rivals, unlocks, narrative arcs.
Phase 4    Protect progress. Communicate clearly. Provide closure.
```

The sequence avoids rework by establishing foundations before features. Morale recovery (P1.1) must exist before morale decay pressure (P1.6). The resource system (P1.3) must exist before world event price effects (P2.4). Named crew (P1.5.1) must exist before trait triggers (P1.5.2) before tensions (P1.5.4). Each layer is stable before the next builds on it.

The early phases produce a playable, pressured, emotionally resonant game. Later phases add replayability and narrative depth. The game is never in a broken intermediate state — every phase boundary is a shippable version.