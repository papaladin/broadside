# Broadside — Development Roadmap

## Current Playable State

Broadside is fully playable with rich narrative systems:

- **5 faction-based starts** with unique characters, factions, backstories, quartermasters, and opening tutorial missions
- **Captain name + faction selection** on a dedicated New Game screen (replaces older scenario card system)
- **QM-led onboarding mode** — 16-step guided tutorial with a named Quartermaster who appears in your crew, talks via popup dialogue, and disembarks once you graduate
- **Three onboarding modes**: Guided (QM), Hints only (per-screen popups), or None
- **25 ports** across the Caribbean (16 standard, 5 remote, 4 hidden)
- **11 ship types** across 5 tiers (Dinghy → Ship of the Line)
- **17 equipment items** across 4 slot types (hull, armament, rigging, special) with buy/install/remove/locker system
- **6 mission types**: escort, patrol, combat, trade, smuggle, assault — procedurally generated, fame-tier scaled
- **Tutorial delivery + tutorial hunt missions** auto-injected during QM onboarding
- **Turn-based combat** with 4 actions (broadside, precision, grapple, evade) + plunder screen
- **Encounter system** with data-driven options (fight, flee, parley, bribe, surrender, inspect)
- **Dynamic market economy** with 14 tradeable resources, per-port availability, buy/sell/black market
- **Faction heat system** — short-term regional danger from aggressive actions, decays over time
- **Port gossip generator** — atmospheric text based on heat, reputation, fame, infamy, contraband, market prices, hidden port hints
- **Market flavour generator** — atmosphere lines on the market screen reflecting gold, hold, prices, fame, infamy, and port faction
- **Crew loyalty system** — faction alignment morale modifier, upset/desertion mechanics, named crew consequences
- **Crew traits** — hidden traits (drunkard, coward, greedy, troublemaker) revealed through gameplay, scars earned from events, positive progression (seasoned → veteran → loyal)
- **Generated crew biographies** — role/faction/days/scars/traits combined into readable character descriptions with combo sentences
- **Reputation system** per port (5 tiers: At War → Allied), affects services, prices, and missions
- **Fame & infamy** progression gating ships, missions, equipment, and hidden port discovery
- **Random events** at sea (storms, shipwrecks, merchant distress, mutiny, drifting wreck, marooned sailors, map fragment discovery)
- **Mid-voyage course change** — reroute to alternate ports while at sea, with endurance budget, sea position tracking, and reachability checks
- **SVG world map** with faction-colored ports, wind compass rose, ship marker at sea, grid overlay, zoom/pan controls (mouse wheel + pinch), gradient backgrounds
- **Captain\'s Journal** with category filtering (crew/combat/ports/missions/trade), search, day grouping, reverse-chronological display
- **Captain\'s Log** with category icons (SVG, mapped via window.UI.LOG_ICONS), day stamps, varied message templates
- **Warm gold/brown visual theme** with responsive layout (basic isNarrow breakpoints) and mobile-friendly touch targets
- **Robust save/load** with localStorage auto-save, file export/import, hash integrity check, migration support, error recovery
- **Tutorial overlay system** — per-screen dismissible popups with "disable all" option, runs in Hints mode
- **Test harness** (tests/tests.html), **economy simulator** (tests/sim.html), **crew lifecycle simulator** (tests/crew_sim.html), **bio/log redundancy analyzer** (tests/crew_bio_log_sim.html), **balance dashboard** (tests/tests_balance.html), **equipment combo analyzer** (tests/equipment_combo_analyzer.html)
- **Screenshot generator** for itch.io assets (screenshots/index.html)

## Architecture Principles

- **State immutability**: single state tree, useReducer, no direct mutation.
- **Pure logic**: logic.js has zero side effects. All game rules are testable in isolation.
- **Generator separation**: generators.js handles all randomness. Pure logic never calls Math.random().
- **Reducer chain**: domain engines register independently. Adding a new domain = adding a new file.
- **Data-driven design**: game content lives in data.js / data_text.js. Code reads data; it never hardcodes content.
- **Narrative as presentation layer**: gossip, log, bios, journal translate system consequences into readable story. They do not own mechanical effects of their own.
- **Test-first balance**: economy sim, crew sim, bio analyzer, balance dashboard run in-browser with no build step.

## Constraints

| Constraint | Reason |
|---|---|
| No build step | Must run from any HTTP server, including GitHub Pages. |
| No external dependencies beyond React, ReactDOM, Babel | Minimise attack surface and maintenance burden. |
| All state in one tree | Enables save/load, undo, and replay. |
| Text-first UI | Art and sound are polish layers, not structural. The game must be compelling with text alone. |
| Mobile-friendly | Touch targets ≥ 44px, responsive layouts, no hover-only interactions for critical actions. |

## Phase Sequence at a Glance

| Block | Theme | Status |
|---|---|---|
| **B0** | Foundation cleanup: docs sync, README, debug noise removal | 🔲 Next |
| **B1** | Codebase architectural cleanup: onboarding middleware, reducer helpers, encounter discovery, file splits | 🔲 Planned |
| **B2** | Identity & feedback: ship visuals, UI juice, career stats display | 🔲 Planned |
| **B3** | UI polish & mobile: responsive overhaul, accessibility | 🔲 Planned |
| **B4** | Playtest Wave 1: first impressions, UX, mobile, onboarding modes | 🔲 Planned |
| **B5** | Player trust & resilience: graceful career end on unrecoverable states | 🔲 Planned |
| **B6** | Onboarding decision: keep, kill, or refine QM mode based on B4 data | 🔲 Planned |
| **B7** | Combat depth rework: discovery + implementation, informed by B4 | 🔲 Planned |
| **B8** | Sailing enrichment: micro-loop + dynamic events, informed by B4 | 🔲 Planned |
| **B9** | Playtest Wave 2: validate combat & sailing changes | 🔲 Planned |
| **B10** | World events & economy dynamics | 🔲 Planned |
| **B11** | Hidden ports & story arc | 🔲 Planned |
| **B12** | Endgame & legacy | 🔲 Planned |
| **B13** | Promotion & web presence | 🔲 Planned |
| **B14** | Audio & visual polish | 🔲 Future |

## Implementation Order

### B0 — Foundation Cleanup

**Goal**: remove friction for both day-to-day development and any future contributor. Nothing else ships before this is done.

#### B0.2 — README + CONTRIBUTING --> contributing parked.
- [X] Short architecture overview at the top of README
- [ ] CONTRIBUTING.md with how to run, how to test, file responsibility map
- [ ] Three-pillar test for proposed features
- [ ] GitHub good-first-issue labels prepared (for B13)

#### B0.3 — Dependency comments at the top of each file --> skip until it causes an issue. archi + readme + load order should be enough.
- [ ] Declare "depends on" and "exposes" as comment headers
- [ ] Convention catches load-order bugs before runtime (the LOG_ICONS class of issue)

#### B0.4 — Debug noise cleanup
- [X] Remove console.log calls (handleDismiss, canMarket, START_GAME stepsCompleted, others)
- [X] Fix stale `ship.upgrades` reference in BUY_SHIP (schema is `equipment`)
- [X] Audit for other commented-out helpers like stripLeadingEmoji and either restore or delete

#### B0.5 — Integration sanity test page
- [X] Single HTML that loads all scripts and asserts core namespaces exist
- [X] Catches future LOG_ICONS-style load-order regressions in seconds

### B1 — Codebase Architectural Cleanup

**Goal**: clean the foundations before adding more content on top. Every system in B7-B11 will touch encounters, missions, or onboarding state.

#### B1.1 — Onboarding middleware reducer
- [X] Extract step-tracking from 6+ reducer files into a single action→step lookup table
- [X] Single reducer watches all actions and updates onboarding.stepsCompleted as a side effect
- [X] Domain reducers become noise-free (no more `if (s.onboarding?.enabled && ...)` everywhere)
- **Dependency**: makes B6 (onboarding decision) cheap to execute either way

#### B1.2 — Helper extraction in oversized reducer cases
- [X] Break COMPLETE_MISSION (~150 lines) into composable helpers --> done due to B1.1
- [X] Break BATTLE_ACTION (~100 lines) similarly --> rejected, its already clear enough to read, its mainly return states.
- [X] Break RESOLVE_EVENT cases by outcome type --> parked, complex
- Target: every reducer case ≤ 30 lines, calling named helpers 
- **Pillar**: Discovery (for contributors)

#### B1.3 — Discovery: encounter vs activeMission vs battleState architecture
- [X] Map current state interactions across encounter types (8 types, overlapping option matrices)
- [X] Identify duplication and ad-hoc conditionals (especially around tutorial hunt, patrol inspection, escort defend)
- [X] Propose unified model and migration path
- [X] task list created

#### B1.4 — Implement encounter architecture refactor (placeholder) --> to be postponed to before combat rework or addition or new events
- [ ] Apply the model chosen in B1.3
- **Pillar**: Consequence (every new encounter type should be a data addition, not a code conditional)

#### B1.5 — Split screens_voyage.jsx
- [X] Currently holds 6 unrelated screens (Map, Sailing, Event, Intercept, Battle, Plunder)
- [X] Approaching the 1500-line architecture limit
- [X] Co-locate BattleScreen and PlunderScreen near engine_combat.js conceptually
- [X] Map and Sailing stay together (route + voyage state)
- [X] Event and Intercept become their own files

#### B1.6 — Audit other files approaching the size limit --> rejected for now. still acceptable, revisit when it grows.
- [X] engine_port.js (~12k tokens)
- [X] engine_combat.js (~12k tokens)
- [X] data.js (~15k tokens — likely split data into multiple thematic files)

#### B1.7 — Documentation refresh pass
- [ ] Sync wiki specs with current code state
- [ ] Document screens_core.jsx (TitleScreen, NewGameScreen, OnboardingPopup, QMPopup)
- [ ] Document icons.jsx and the LOG_ICONS lookup map
- [ ] Document the QM onboarding system (qmMessagesSeen, stepsCompleted, dialogue flow)
- [ ] Update STARTS shape in specs_data.md (factionPorts, factionBackstory, factionQM, factionRepAdjust)
- [ ] Document TUTORIAL_DELIVERY and TUTORIAL_HUNT constants
- [ ] Document the captain name + faction selection flow
- [ ] Document the market flavour generator alongside the gossip generator
- **Pillar**: Discovery (for contributors)

### B2 — Identity & Feedback

**Goal**: make the game feel like itself in the first 30 seconds, not a generic Pirates! clone. Visible feedback is what keeps a new player from quitting.

#### B2.1 — Ship visual identity
- [X] Unique ship silhouettes per ship type (currently ShipSprite renders identically for all ships) 
- [ ] Ship name visible on sailing screen / HUD -
- [ ] Equipment visually reflected on ship where reasonable (extra sails, visible cannons) -> partial
- [ ] Port arrival illustration or vignette per faction
- **Pillar**: Discovery

#### B2.2 — UI juice & immediate feedback
- [X] CSS transitions on gold gain/loss (flash green/red in HUD) — partly done via useFlashOnChange, audit completeness
- [X] Hull bar pulse on damage taken -> rejected
- [X] Morale indicator flash on morale shift
- [X] Screen tint / brief overlay on combat damage -> pannel glow
- [X] Battle log entries animate in (slide/fade)
- [X] "Loot gained" summary with visual pop after plunder
- **Pillar**: Consequence (make every impact feel real, not just read real)

#### B2.3 — Career stats tracking
- [ ] Add persistent career stats to state: days survived, total gold earned/spent, ships sunk, crew lost, crew hired, ports visited, missions completed/failed, goods traded, contraband seized, battles won/lost/fled
- [ ] Display on revamped Status screen as "Captain\'s Career" section
- [ ] Track per-run and cumulative (for future multi-run legacy)
- **Prerequisite for B12 (retirement / score / legacy screen).** Build the data layer early to avoid retrofitting.
- **Pillar**: Consequence (the Caribbean keeps score)

### B3 — UI Polish & Mobile

**Goal**: solid mobile experience before any playtester touches the game. Don\'t waste playtester goodwill on issues you already know exist.

#### B3.1 — Responsive polish pass
- [X] Comprehensive audit at 360px–1440px (basic isNarrow breakpoints already exist)
- [X] Stack panels vertically on narrow screens (port, shipyard, crew specifically)
- [X] All interactive elements ≥ 44px touch targets
- [X] Note: swipe gestures parked (see Parked Concepts)

#### B3.2 — Visual theme refinement
- [ ] Consistent spacing, typography, and panel styling across all screens
- [ ] Improve color contrast for accessibility
- [ ] Subtle hover/focus states on all interactive elements
- [ ] Consider high-contrast / colorblind-safe palette option

#### B3.3 — Accessibility pass
- [ ] ARIA labels on all interactive elements
- [ ] Alt text on SVG icons
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility for HUD, combat, journal

### B4 — Playtest Wave 1

**Goal**: gather real data on first impressions, UX, mobile, and the three onboarding modes. Decisions about onboarding (B6), combat depth (B7), and sailing enrichment (B8) all flow from this.

#### B4.1 — Recruit playtesters
- [ ] 3-5 testers minimum
- [ ] Mix of phone and desktop
- [ ] Mix of game familiarity (some who know Pirates!-likes, some who don\'t)

#### B4.2 — Define success metrics before testing
- [ ] Completion rate of first contract
- [ ] Time to first ship upgrade
- [ ] Qualitative confusion points (where did they re-read the screen?)
- [ ] Where did they quit?
- [ ] Did combat feel repetitive by encounter N?
- [ ] Did sailing feel like dead air?

#### B4.3 — Run sessions with each onboarding mode
- [ ] Tester A on Guided (QM)
- [ ] Tester B on Hints only
- [ ] Tester C on None
- [ ] If possible, observe a session silently

#### B4.4 — Synthesise findings
- [ ] Group feedback by block (onboarding, combat, sailing, UI, mobile)
- [ ] Document which findings inform which downstream block


## B15 — Role-based Captain's Log entries

**Goal**: surface named crew members in routine log entries so the player sees their crew *doing things*, not just dying or being hired. Cheapest path to making the crew feel populated by people.

**Pairs naturally with**: B2 (Identity & Feedback). Could be done any time, no prerequisites.

### B15.1 — Log template expansion by role

* [ ] Identify all log-generating moments where a crew member's *role* could plausibly be invoked: combat shots, food/water depletion, storms, voyage events, repair moments, scouting/arrivals
* [ ] Write 8-15 template variants per role (gunner, cook, carpenter, navigator, deckhand) for each applicable moment
* [ ] Templates use the `{name}`, `{role}`, `{daysAboard}` slots that the bio generator already uses for consistency
* [ ] Store in `data_text.js` alongside existing log templates

### B15.2 — Picker logic

* [ ] Helper function: `pickCrewMemberByRole(state, role)` returns a random crew member with the given role, or null if none aboard
* [ ] Helper: `formatNamedLogLine(template, member)` does template substitution
* [ ] Lives in `generators.js` (uses Math.random, picks from existing crew)

### B15.3 — Inject into existing log sites

* [ ] `BATTLE_ACTION` — when player lands hits, occasionally name the gunner: "Maria opens up the gun deck..."
* [ ] `ADVANCE_DAY` provision depletion — name the cook: "Pedro stretches the last of the rations..."
* [ ] `ADVANCE_DAY` arrival proximity — name the navigator: "Inès reads the stars and points to land..."
* [ ] `RESOLVE_EVENT` storm hull damage — name the carpenter: "Anders patches the worst of it overnight..."
* [ ] `REPAIR` action — name the carpenter: "Anders leads the repair work..."
* [ ] `ENTER_PORT` — occasionally name the navigator: "Inès calls the harbor approach..."
* [ ] Frequency cap: maybe 1-in-3 chance of naming someone, otherwise generic log. Avoid making every line feel "narratorial."

### B15.4 — Test pass

* [ ] Play through a full QM tutorial flow + a few normal voyages
* [ ] Verify named crew appear in logs across at least 5 different event types
* [ ] Verify the same crew member doesn't get named twice in close succession (run a small dedupe check in the picker)
* [ ] Verify no errors when the relevant role isn't represented in the crew

**Pillar**: Consequence (named individuals visibly contribute to the story being told)


### B5 — Player Trust & Resilience

**Goal**: ensure the game never leaves a player clicking buttons that do nothing. Scope confirmed by Wave 1 data — if no playtester hits a softlock, this stays small.

#### B5.1 — Detect unrecoverable states
- [ ] Define the condition (e.g. 0 gold + 0 crew + 0 food + damaged hull + no friendly port reachable)
- [ ] Not beeing able to sail with 0HP. If 0HP + 0gold -> game over? this is the actual softlock conditions. no food and now crew isnt. no reachable port isnt aswell -> you can "hunt" mission to recover.
- [ ] not being able to fight or take mission with 0HP
- [ ] Detection runs on port entry / end of day

#### B5.2 — Graceful career end screen
- [ ] Replace the older "mercy event" idea with an on-pillar "Your career ends here" screen
- [ ] Career summary using B2.3 stats: days survived, gold earned, ports visited, crew lost
- [ ] Option to start a new game
- [ ] Reuses data layer built for B12 retirement
- **Pillar**: Consequence (not every captain reaches retirement, and that\'s allowed)

#### B5.3 — Defeat recovery audit
- [ ] Verify wash-ashore-after-defeat always leaves minimum viable resources
- [ ] Or routes to graceful career end if not

### B6 — Onboarding Decision

**Goal**: act on B4 data. Either keep QM mode, retire it, or refine it.

#### B6.1 — Review B4 findings
- [ ] Did QM mode produce meaningfully better outcomes than Hints?
- [ ] Did Hints alone get players to the first ship upgrade?
- [ ] Where did each mode lose people?

#### B6.2 — Decision and execution
- [ ] **If QM wins clearly**: keep, refine confusing steps
- [ ] **If Hints is roughly equivalent**: retire QM, remove tutorial mission auto-injection, simplify start flow. Much cheaper post-B1.1 middleware refactor.
- [ ] **If both are weak**: progressive contextual hints redesign (smaller scope, no QM character, no popups unless triggered by player state)

#### B6.3 — Update onboarding documentation
- [ ] Reflect whichever path is taken

### B7 — Combat Depth Rework

**Goal**: address the gap in the previous roadmap. Four actions where the enemy picks broadside 70% of the time will feel repetitive over a long campaign, no matter how good the narrative log gets. Scope and direction informed by B4.

#### B7.1 — Discovery: what role should combat play?
- [ ] Primary activity vs punishment for failed negotiation
- [ ] How much depth vs how much speed (1-minute fights vs 5-minute fights)
- [ ] Decision stacking vs positional play
- [ ] Cross-reference B4 findings on combat fatigue

#### B7.2 — Discovery: wind & position
- [ ] Should wind affect combat actions (favourable for chase, opposing for boarding)?
- [ ] Distance bands (long / medium / boarding range)?
- [ ] Maneuver phase?

#### B7.3 — Implement combat depth changes (placeholder)
- [ ] Apply the model chosen in B7.1 and B7.2
- **Pillar**: Consequence

#### B7.4 — Enemy AI variety
- [ ] NPCs choose actions based on situation, not flat weights (low hull → grapple attempt, fast ship → evade, large crew → grapple)
- [ ] Each enemy type gets a "preferred doctrine" reflected in choice weights
- [ ] Cheap win even without B7.3, can ship independently

#### B7.5 — Combat log narrative depth pass
- [ ] Leverage existing crew names/traits in round-by-round log ("Maria refuses to load the cannons", "the cook screams when the deck is hit")
- [ ] Connects combat to the crew attachment pillar
- **Pillar**: Consequence

### B8 — Sailing Enrichment

**Goal**: make the voyage — the most-repeated action — more engaging. Direction informed by B4.

#### B8.1 — Sailing micro-loop improvement
- [ ] More frequent micro-decisions during sailing (currently 50-60% dead air estimated)
- [ ] Crew events at sea: arguments, sightings, morale moments, trait reveals
- [ ] Weather changes that affect speed and create decisions ("storm approaching — push through or divert?")
- [ ] Wind system that matters more: tacking, favorable/unfavorable wind as active consideration
- [ ] Sighting reports: "smoke on the horizon", "sail spotted", "land ahead" — information before commitment
- **Note**: Mid-voyage course change is already implemented and turns passive clicking into active route decisions. This tier enriches the between-ports experience further.
- **Pillar**: Freedom (the journey is a decision space, not dead air)

#### B8.2 — Dynamic event expansion
- [ ] Expand random event pool (currently ~5% per day, ~10 event types)
- [ ] Conditional events: appear only when specific state conditions are met (low morale + storm, high infamy + bounty hunter, etc.)
- [ ] Multi-part events: "you found a map" → later "the island from the map is nearby"
- [ ] Crew-specific events: triggered by individual crew traits (drunkard causes brawl, coward panics in storm)
- **Pillar**: Discovery (every voyage holds surprises)

### B9 — Playtest Wave 2

**Goal**: validate combat (B7) and sailing (B8) changes before investing in world events and story arc.

#### B9.1 — Recruit testers
- [ ] Mix of new testers and returning Wave 1 testers (returning testers can compare)

#### B9.2 — Define wave 2 metrics
- [ ] Did combat feel less repetitive?
- [ ] Did sailing feel less like dead air?
- [ ] Are encounter decisions interesting on repeat?
- [ ] What broke in the changes?

#### B9.3 — Synthesise findings
- [ ] Document what to keep, what to revisit
- [ ] Identify any architectural rot that needs a B1-style cleanup pass before B10

### B10 — World Events & Economy Dynamics

**Goal**: the world acts on its own, not just in reaction to the player. Trade and exploration get a dynamic backdrop.

#### B10.1 — Discovery: world event types & cadence
- [ ] Famines, harvest fails, blockades, faction wars, naval supremacy shifts
- [ ] How frequently do they fire? How visible to the player (gossip, headlines, in-game news)?
- [ ] How long do they last? Player can interact with them?

#### B10.2 — Implement world event system (placeholder)
- [ ] Apply chosen model from B10.1

#### B10.3 — Discovery: economy dynamism mechanics
- [ ] Do prices react to world events?
- [ ] Does player heavy-trading nudge prices? For how long? Per port or regional?
- [ ] (Player-impact economics is hard; world events give 80% of the feel for 20% of the work)

#### B10.4 — Implement economy dynamics (placeholder)
- [ ] Apply chosen model from B10.3

#### B10.5 — Named rival captains & escalation
- [ ] Named rival captain(s) who appear, escalate, and must eventually be confronted
- [ ] Bounty hunter encounters that scale with infamy
- [ ] Governor missions: high-rep faction offers a multi-part quest chain (e.g., "clear the pirate nest at Roatán")

#### B10.6 — Mid-game content
- [ ] Story beats at fame thresholds (50, 100, 200) — the world acknowledges your rise
- [ ] Crew loyalty events: long-serving crew members initiate conversations, requests, or betrayals
- [ ] Port-specific quest lines: unique missions available only at certain ports after reputation thresholds
- [ ] Equipment quest: a legendary item that requires a multi-step quest to obtain

### B11 — Hidden Ports & Story Arc

**Goal**: hidden ports currently feel like "more ports." Give each one a reason to exist and tie them to the endgame arc.

#### B11.1 — Discovery: what\'s the main story arc?
- [ ] Does the campaign have a shape? Rising action? Climactic confrontation?
- [ ] Player-defined milestones (fame ladder, infamy ladder, gold target)?
- [ ] How do the four starting factions intersect with the arc?

#### B11.2 — Implement story arc framework (placeholder)
- [ ] Apply model chosen in B11.1

#### B11.3 — Discovery: unique mechanic per hidden port
- [ ] Roatán, Dry Tortugas, Las Aves, Libertalia each get a reason to matter beyond services
- [ ] Each could anchor a piece of the story arc

#### B11.4 — Implement hidden port mechanics (placeholder)
- [ ] Apply per-port chosen mechanics from B11.3

#### B11.5 — Discovery: Libertalia as endgame anchor
- [ ] Does discovering it change the game? Unlock retirement? Trigger faction-level events?
- [ ] Is it a place or an idea or a faction?

#### B11.6 — Implement Libertalia endgame role (placeholder)
- [ ] Apply chosen model from B11.5

### B12 — Endgame & Legacy

**Goal**: the career has a shape with a beginning, middle, and end. Player can choose to retire, or accept that their career ended on its own terms.

#### B12.1 — Victory conditions
- [ ] Optional victory paths: retire with X gold, reach Legendary fame, discover all hidden ports, complete a final quest chain
- [ ] Multiple paths so different playstyles have a finish line

#### B12.2 — Retirement screen
- [ ] Career summary with stats (uses B2.3 data layer)
- [ ] Notable events, crew roster at retirement, ships owned
- [ ] Readable story-format summary ("the novel you wrote by playing")

#### B12.3 — Legend score
- [ ] Calculate from career stats
- [ ] Display alongside retirement screen

#### B12.4 — "One more thing" hook
- [ ] After retirement, option to continue sailing or start a new game with a legacy bonus
- [ ] Multi-run legacy: new runs benefit from previous captain\'s legend in small ways

#### B12.5 — Difficulty settings
- [ ] Forgiving / Standard / Ruthless
- [ ] Affects initial resources, enemy scaling, event frequency, softlock detection thresholds

#### B12.6 — Polish graceful career end from B5
- [ ] If softlock detection has been driving the player to a career end screen, make sure it integrates cleanly with retirement flow


## B16 — Shore Leave System

**Goal**: convert port-time from "instant transactional space" to a place where named crew members live and small events occur. Give the player a meaningful duration choice on arrival.

**Pairs naturally with**: B8 (Sailing Enrichment). Provides the port-side equivalent to sailing micro-loop improvements. Prerequisites: none structurally, but writing is heavier so probably after B4 playtesting confirms the crew direction matters to players.

### B16.1 — Discovery: shore leave mechanics

* [ ] Decide: is shore leave a *duration choice* on arrival, or a *separate action* at port?
* [ ] Decide: what's the morale recovery rate per day on leave vs current "Buy Drinks" gold cost?
* [ ] Decide: do wages accrue normally during shore leave, or at a reduced rate, or not at all?
* [ ] Decide: does the player choose total duration upfront, or extend day-by-day?
* [ ] Decide: what's the trigger frequency for crew events during leave? (One roll per day? Tier by member traits?)
* [ ] Decide: do harbor-side events affect things outside the crew (port reputation, gold, gossip pool)?
* [ ] Decide: can shore leave be force-shortened if an emergency happens (faction war declared, mission urgency)?

### B16.2 — Implement: duration UI and core loop

* [ ] Add a "Shore Leave" panel/screen accessed from the port screen
* [ ] Duration selector or day-by-day extension button
* [ ] Per-day cost calculation (wages, possibly minus discount)
* [ ] Per-day morale recovery applied to crew
* [ ] Port reputation/gossip refresh during/after leave

### B16.3 — Implement: event pool

* [ ] New event type `port_event` (separate from `RANDOM_EVENTS` for sea)
* [ ] Event generator that picks events based on the named crew aboard, the port faction, and ongoing world state (heat, infamy, etc.)
* [ ] Event resolution: dispatch through the same `RESOLVE_EVENT` flow or a parallel one (decide in B16.1)

### B16.4 — Writing: 20-30 port event templates

* [ ] Cost events: tavern brawls, jail fines, lost crew (passed out and missed roll-call)
* [ ] Benefit events: map fragments overheard, gossip leads, found goods, recruited skilled crew
* [ ] Trait-revealing events: drunkard caught red-handed, coward backs out of barfight, greedy fights over share
* [ ] Faction-flavor events: Spanish religious processions if Spanish crew, French market festivals, etc.
* [ ] Possible: events that consume specific cargo for benefits ("trade rum for tavern story leads")

### B16.5 — Integration with existing systems

* [ ] Shore leave should NOT trigger random sea events (different event pool)
* [ ] Shore leave SHOULD trigger faction heat decay normally
* [ ] Shore leave SHOULD trigger reputation decay normally
* [ ] Shore leave should respect tutorial onboarding (no shore leave events during the QM phase, or suppress until first contract complete)
* [ ] Mid-leave emergencies (e.g., heat spike, world event) might shorten leave

### B16.6 — Test pass

* [ ] Full playthrough with shore leave at multiple ports
* [ ] Verify cost/morale balance feels right
* [ ] Verify event frequency feels right (\~1 per 2-3 days?)
* [ ] Verify named crew appear in events

**Pillar**: Discovery (port becomes a place, not a transaction)

**Risk**: Medium. The discovery questions in B16.1 must produce a coherent mechanic before implementation; if shore leave costs > rewards, players will skip it.

**Dependency**: Best done after B4 playtest confirms players engage with named crew enough to justify the writing investment.

***

## B17 — Crew Council System

**Goal**: a periodic, gated mechanism for the crew to weigh in on the captain's decisions. Historically grounded in pirate-era democracy. Outputs range from narrative observation to demands the player must respond to. The defining mechanic of "crew are people who run this ship with you."

**Pairs naturally with**: B11 (Hidden Ports & Story Arc). Critical dependency on B2.3 (Career Stats Tracking).

**Implemented in phases**: narrative output first (lowest risk), then meaningful choices, then demands/quests.

### B17.1 — Discovery: council mechanics

* [ ] **Trigger conditions**: time-based (every N days at sea), fame-based (each tier unlock), event-based (after major incidents), player-initiated (button, but rate-limited)? Probably combination.
* [ ] **Frequency caps**: minimum days between councils to prevent spam (e.g., 30 days)
* [ ] **Convening cost**: does calling a council cost morale/gold/time? Is there a cost to *not* calling one occasionally?
* [ ] **Outputs structure**: pure observation? observation + advice? advice + demand?
* [ ] **Data sources**: which career stats does the council read? Which crew composition data? Which event history?
* [ ] **Failure modes**: what if the council's content is repetitive? What if the player ignores it?

### B17.2 — Implement: career stats data layer (B2.3 prerequisite)

* [ ] **Note**: this depends on B2.3 being done. The council needs missions completed, ships sunk, factions attacked, days at sea, gold flow, crew turnover, etc., already being tracked.
* [ ] Verify B2.3 data is accessible from the council generator
* [ ] If gaps exist (specific stats the council needs that B2.3 doesn't track), add them as a B17 prerequisite task

### B17.3 — Phase 1: narrative output only

* [ ] UI for the council screen — list of named crew speaking, each with a short observation
* [ ] Generator picks 3-5 crew members based on relevance (faction alignment to recent actions, role to recent events, traits)
* [ ] Each speaker says one thing drawn from a template pool
* [ ] At end of council: morale shift based on whether speakers' concerns align with captain's recent actions
* [ ] **Templates needed**: 30-40 observation templates covering all major career-stat conditions (heavy combat, heavy trade, faction bias, contraband, neglected crew, etc.)
* [ ] No player choices yet. Player closes council, gets the morale outcome, moves on.

### B17.4 — Phase 2: meaningful choices

* [ ] At end of observation phase, present 2-4 player choices: "Agree with crew" / "Disagree" / "Acknowledge but defer" / etc.
* [ ] Each choice has direct consequences: morale change, reputation shift, faction heat, internal upset/loyal tagging
* [ ] **Templates needed**: choice text + consequence definitions for each council scenario
* [ ] UI updates: choice buttons under each speaker, or a single resolution choice at the bottom

### B17.5 — Phase 3: requests and quest hooks

* [ ] Some council outcomes generate **crew requests**: "We want shore leave in Tortuga" / "We want a share of next prize" / "We want to sail to a specific port"
* [ ] Player can accept (cost) or refuse (morale cost)
* [ ] Some council outcomes generate **personal quests**: a specific named crew member gets a quest hook ("Maria wants to find her uncle's ship near Trinidad")
* [ ] Quest hooks live as a new mission type or as story flags
* [ ] **This phase absorbs the "personal quests" idea from earlier brainstorming**

### B17.6 — Phase 4: council convening UX

* [ ] Add a "Convene Council" button accessible from the Crew screen
* [ ] Show next-available date based on cooldown
* [ ] Optional: auto-convene at significant career milestones (first 100 days at sea, first 100 ships defeated, etc.)
* [ ] Council history visible in the Journal under a new "Councils" tab

### B17.7 — Test pass

* [ ] Trigger councils in various game states to verify content is contextually relevant
* [ ] Verify the player isn't getting the same observation twice in close succession
* [ ] Verify quest hooks generate sensible missions
* [ ] Balance test: are players actually using councils, or ignoring them?

**Pillar**: Consequence (the crew has agency and a voice; the captain isn't a dictator)

**Risk**: Medium-high. The council needs to feel meaningful, not repetitive. Quality of writing in observation templates is the make-or-break factor. Phase it carefully — ship Phase 1 first and gauge engagement before committing to Phases 2-4.

**Dependency**: B2.3 (Career Stats Tracking) is hard prerequisite. B4 playtest data should inform whether to invest in Phases 2-4.

***

## B18 — Pirate Articles System

**Goal**: a small set of player-editable ship's articles (rules) that affect gameplay. The articles can be amended through crew council outcomes, giving the council a tangible mechanism for crew influence on the ship's direction. Disguises some gameplay settings (difficulty modifiers, share splits, behavioral tendencies) as in-world contracts.

**Pairs naturally with**: B17 (Crew Council). Hard prerequisite: B17 must exist for articles to be amendable through it.

**Could ship in two parts**: static articles set at game start (Phase 1), then dynamic amendment via council (Phase 2).

### B18.1 — Discovery: articles design

* [ ] **What rules become articles?** Candidates:
  * Gold share split (Captain takes X%, crew gets rest)
  * Combat preference (Hunt all merchants / Spare neutrals / Only legitimate prey)
  * Crew share-out timing (Per-port / Per-mission / End-of-voyage)
  * Mandatory shore leave (Every X days / At captain's discretion)
  * Punishment severity (Lenient / Severe / Marooning)
  * Loot distribution rules (Equal shares / By rank / By role)
  * Mutiny conditions (At what morale level does crew act?)
* [ ] **How many articles?** 4-7 seems right; fewer feels thin, more becomes a spreadsheet
* [ ] **Mechanical effects per article**: each article toggle should produce a visible gameplay change (morale modifier, reputation shift, mission availability, faction reactions, internal crew dynamics)
* [ ] **Starting articles**: each faction start (English, Spanish, etc.) begins with default articles consistent with their backstory. Pirate start has the most flexible articles; English start has the most rigid.

### B18.2 — Implement: static articles at game start

* [ ] New screen: "Ship's Articles" accessible from Crew screen or Status screen
* [ ] Visual: looks like a parchment contract, not a settings menu
* [ ] Articles displayed as checkboxes / radio buttons / sliders dressed up as period-appropriate rules
* [ ] At game start: articles are set by faction default, locked from player edit (Phase 1)
* [ ] Each article displays its gameplay effect inline ("Captain takes 30% → +20% personal gold gain, -10 crew morale on prize")

### B18.3 — Implement: article effects on gameplay

* [ ] Each article toggle reads/affects relevant state
  * Share split affects gold distribution in `COMPLETE_MISSION` and plunder
  * Combat preference affects encounter generation (or just mission availability)
  * Punishment severity affects mutiny/desertion probabilities
* [ ] Effects must be balanced so no single article is dominant or trivial
* [ ] Balance pass: economy simulator (tests/sim.html) updated to model article effects

### B18.4 — Phase 2: dynamic amendment via council

* [ ] Crew council outcomes can propose article amendments (B17 Phase 3 request mechanism)
* [ ] Player can accept (article changes, crew morale +) or refuse (no change, possible upset/desertion)
* [ ] Some amendments require council vote — multiple crew members must agree before the player can ratify
* [ ] Failed ratification creates crew upset
* [ ] Player can also propose amendments themselves (with crew approval check, gated by morale)

### B18.5 — Phase 3: world-event amendment hooks

* [ ] Some world events propose article changes ("After repeated mutinies, the crew demands stricter punishment articles")
* [ ] Some story events lock or unlock article options ("After reaching Libertalia, you may add the 'Equal Shares for All' article")
* [ ] Articles become part of the player's identity that the world reacts to ("This captain is known for fair shares" → reputation shift)

### B18.6 — UI polish: parchment aesthetic

* [ ] Articles screen should look in-period — parchment background, gold ink, signatures
* [ ] Each amendment is added as an addendum, dated to the day it was made
* [ ] Full articles document persists as part of the save and shows up in the Journal under a new "Articles" tab

### B18.7 — Test pass

* [ ] Articles work mechanically across all faction starts
* [ ] Council amendments flow correctly
* [ ] Effects balance out (no broken combinations)
* [ ] Visual feels period-appropriate, not modern-UI

**Pillar**: Freedom (the player shapes the kind of captain they are through real rules, not menu settings) + Consequence (rules have visible mechanical and social effects)



### B13 — Promotion & Web Presence

**Goal**: promote a game that\'s been through two playtest cycles, not one that\'s been through zero.

#### B13.1 — itch.io listing
- [ ] Page with screenshots, description, tags
- [ ] Use screenshots generated via screenshots/index.html

#### B13.2 — GitHub Pages deployment verified
- [ ] Confirm play link works on first visit, no localStorage prompts

#### B13.3 — README badges and play link prominence
- [ ] License, play link, build status (if applicable)

#### B13.4 — Good-first-issue labels and contributor announcement
- [ ] Triage open work into labelled GitHub Issues
- [ ] Pin a discussion or write a short blog post inviting contributors

### B14 — Audio & Visual Polish

**Goal**: sensory layer that reinforces the systems underneath. Done last because sound and animation are amplifiers of working systems, not substitutes.

#### B14.1 — Sound design
- [ ] Ambient port sounds (seagulls, waves, crowd murmur)
- [ ] Sailing ambient (wind, creaking hull, waves)
- [ ] Combat sounds (cannon fire, wood cracking, crew shouts)
- [ ] UI sounds (button click, gold clink, mission accept)
- [ ] Music: atmospheric sea shanty / period-appropriate background

#### B14.2 — Animation & visual effects
- [ ] Ship movement animation on map
- [ ] Combat round animations (cannon flash, hull impact)
- [ ] Port arrival transition
- [ ] Weather effects on sailing screen (rain, storm clouds, calm shimmer)

## Completed

### T1 — Core Loop ✅
Sail → trade → fight → upgrade → repeat. Basic navigation, market, combat, and port systems.

### T2 — Systemic Depth ✅
Crew loyalty with faction alignment, upset/desertion mechanics. Reputation system (5 tiers). Random events at sea. Crew traits (hidden → revealed), scars, positive progression (seasoned → veteran → loyal). Generated crew biographies with combo sentences.

### T3 — Content Expansion ✅
6 mission types (trade, escort, patrol, assault, smuggle, bounty). 25 ports with faction services. 14 tradeable goods with variance. Port gossip generator (heat, fame, infamy, reputation, ambiance, weather, market hints). 5 starting scenarios. Faction heat system. Black market with contraband risk.

### T4.1 — Robust Save System ✅
localStorage auto-save on port arrival. File export/import with base64 encoding and hash integrity check. State migration for version upgrades. Error boundary with "Try Load Last Save" recovery. Import via file picker on both title and port screens.

### T4.2 — Captain\'s Journal Screen ✅
Full journal with category filtering (crew, combat, ports, missions, trade). Search bar. Day grouping. Reverse chronological display. Log line classification with icons. Accessible from port screen.

### T4.3 — Tutorial Overlay System ✅
Per-screen dismissible tutorial popups (port, map, sailing, battle, market, crew, shipyard, journal, status). "Don\'t show again" checkbox that disables all tutorials. Tutorial state persisted in localStorage independently of game save. Toggle on title screen.

### T4.4 — Map Visual Improvements ✅
SVG coastline outlines for major landmasses. Faction-colored port dots with hover info. Mission route indicator. Wind compass rose. Zoom and pan (mouse wheel + pinch). Grid overlay. Gradient backgrounds.

### T4.5 — itch.io Listing Prep ✅
Screenshot generator (screenshots/index.html). Initial itch.io page and GitHub Pages deployment work done. (Full promotion deferred to B13.)

### T4.7 — Onboarding Redesign (initial pass) ✅
QM-led 16-step guided tutorial implemented as the "Guided" mode. Hints mode and None mode coexist. Tutorial delivery and tutorial hunt missions auto-inject during Guided onboarding. Force-stocked market goods during the first delivery. (Playtest validation of these three modes deferred to B4.)

### T5.1 — Equipment Slot System ✅
17 equipment items across 4 slot types (hull, armament, rigging, special). Per-ship slot limits. Buy, install, remove to locker, reinstall from locker. Fame and hull prerequisites. Stat preview with before/after deltas. Trade-offs on every item (speed vs hull, damage vs crew loss, etc.). Structural items (non-removable) vs removable items.

### T6.1 — Responsive Overhaul (touch + buttons) ✅
Responsive breakpoints (isNarrow checks). Touch targets ≥ 44px. Stack panels on narrow screens. (Swipe gestures parked — see Parked Concepts. Comprehensive responsive polish carried forward into B3.1.)

### T4/T5 — Mid-Voyage Course Change ✅
Route tracking with sea position interpolation. Endurance budget system (can\'t exceed ship\'s maxDays across legs). "Change Course" button on sailing screen opens map in at-sea mode. Map shows reachable ports from current sea position with remaining endurance. Reroute recalculates travel days from current position. Ship marker visible on map while at sea.

### T4/T5 — SVG Map Enhancements ✅
Sea gradient background with radial highlight. Grid overlay. Wind compass rose with speed display. Faction-colored port markers with hover info (days, reputation, heat). Mission route indicator line. Ship marker at sea position during voyages. Zoom and pan controls.

### Icon system & Captain\'s Log icons ✅
SVG icon library in icons.jsx. LOG_ICONS lookup map (window.UI.LOG_ICONS) maps classification categories to icon components. Captain\'s Log and Journal both render category icons inline.

## Parked Concepts

Ideas captured but not scheduled. May be promoted to a block if they pass the three-pillar test.

- **Swipe gestures for tab navigation** (market, shipyard, journal): low priority while touch + buttons work well
- **Crew relationships**: friendship/rivalry pairs that affect morale and combat
- **Ship naming**: player can rename their ship; name appears in journal and on map
- **Port investment**: spend gold to build infrastructure at a port, improving services over time
- **Fleet command**: own multiple ships, assign crew, run trade routes automatically
- **Seasonal weather patterns**: hurricane season, trade winds, monsoon — affect routes and risk
- **Historical events**: real 1695 events (e.g., Henry Every\'s trial) appear as news, affect the world
- **Pirate republic**: if player controls multiple pirate ports, trigger a faction-level event
- **Crew skill system**: individual crew members gain XP in their role, affecting ship performance
- **Reputation decay curve**: different factions forget at different rates (pirates forget fast, Spanish never forget)
- **Forced softlock playtest scenario**: deliberately giving a tester an unwinnable save. Decided against — natural data from B4 is preferred.

## Long-term Vision

Broadside should feel like **reading a novel you wrote by playing it**. The Captain\'s Journal, crew biographies, and gossip system are the foundation of that vision. Every mechanical system should feed back into the narrative layer — creating stories that are unique to each playthrough, told in the player\'s own words through their choices.

The game is complete when a player can finish a run, read their journal from start to finish, and say: **"That was my story."**
