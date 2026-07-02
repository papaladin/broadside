# Broadside — Development Roadmap

## Current Playable State

Broadside is fully playable with rich narrative systems:

- **5 faction-based starts** with unique characters, factions, backstories, quartermasters, and opening tutorial missions
- **Captain name + faction selection** on a dedicated New Game screen (replaces older scenario card system)
- **QM-led onboarding mode** — 16-step guided tutorial with a named Quartermaster who appears in your crew, talks via popup dialogue, and disembarks once you graduate
- **Three onboarding modes**: Guided (QM), Hints only (per-screen popups), or None — validated against real playtesters in Wave 1, QM confirmed to outperform (see Completed Work)
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
- **Captain's Journal** with category filtering (crew/combat/ports/missions/trade), search, day grouping, reverse-chronological display
- **Captain's Log** with category icons (SVG, mapped via window.UI.LOG_ICONS), day stamps, varied message templates
- **Warm gold/brown visual theme** with responsive layout (basic isNarrow breakpoints) and mobile-friendly touch targets
- **Robust save/load** with localStorage auto-save, file export/import, hash integrity check, migration support, error recovery, and a guardrail against environments where localStorage access itself throws (iframe/embedded contexts) — found and patched during Wave 1
- **Tutorial overlay system** — per-screen dismissible popups with "disable all" option, runs in Hints mode
- **Career stats tracking** (gold earned/spent, battles, crew, ports, ships, storms, contraband, mission/combat logs) displayed on Status screen
- **Test harness** (tests/tests.html), **economy simulator** (tests/sim.html), **crew lifecycle simulator** (tests/crew_sim.html), **bio/log redundancy analyzer** (tests/crew_bio_log_sim.html), **balance dashboard** (tests/tests_balance.html), **equipment combo analyzer** (tests/equipment_combo_analyzer.html)
- **Screenshot generator** for itch.io assets (screenshots_builder.html)

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

**B0 through B4 are complete** (foundation cleanup, architecture cleanup, identity/feedback, UI polish, and Playtest Wave 1). Their detailed records, plus the now-resolved Onboarding Decision, live in **Completed Work** below using their original numbers.

| Block | Theme | Status |
|---|---|---|
| **B5** | Critical bug & exploit fixes | 🔲 Planned |
| **B6** | Quick wins & quality of life | 🔲 Planned |
| **B7** | Player menu, reference & community links | 🔲 Planned |
| **B8** | Economy & mission design discovery | 🔲 Planned |
| **B9** | Player trust & resilience | 🔲 Planned |
| **B10** | Starts variety & captain identity discovery | 🔲 Planned |
| **B11** | Combat depth rework | 🔲 Planned |
| **B12** | Sailing enrichment | 🔲 Planned |
| **B13** | Narrative layer upgrade | 🔲 Planned |
| **B14** | Playtest Wave 2 | 🔲 Planned |
| **B15** | Functional crew roles | 🔲 Planned |
| **B16** | Shore leave system | 🔲 Planned |
| **B17** | Crew council system | 🔲 Planned |
| **B18** | Pirate articles system | 🔲 Planned |
| **B19** | World events & economy dynamics | 🔲 Planned |
| **B20** | Hidden ports & story arc | 🔲 Planned |
| **B21** | Endgame & legacy | 🔲 Planned |
| **B22** | Promotion & web presence | 🔲 Planned |
| **B23** | Audio & visual polish | 🔲 Future |

## Implementation Order

### B5 — Critical Bug & Exploit Fixes

**Goal**: close confirmed exploits and platform bugs before any further content or balance work. These were surfaced by Wave 1 testers and by a full audit of a 608-day, fame-252 save (Ren's campaign) that exposed how far the current loop can be trivialised. This block is what makes every later balance decision trustworthy — there is no point tuning mission rewards while grappling and starvation don't actually cost anything.

#### B5.1 — Combat exploit closure
- [X] **Grapple minimum casualty**: boarding success still costs crew, scaled to crew ratio (e.g. `loss = ceil(playerCrew * (0.05 + 0.25 * (1 - ratio)))`). Confirmed: 140 boarding victories in one save, zero crew lost across all of them.
- [X] **Patrol mission duplication**: block `COMPLETE_MISSION` from re-awarding a patrol that has already been completed. Confirmed: the same patrol mission was completed 10 times for full rewards in one save, despite the story log showing "you have not yet found the enemy."
- [X] **Same-port mission chaining**: prevent accepting another mission of the same type immediately after completing one, in the same port, with zero travel in between — this is what let the exploit above collapse into "five combat missions in a single day" repeatedly.

**Source**: petripeeduhpedro (Reddit), Ren's 608-day save audit

#### B5.2 — Survival & stat integrity
- [X] **Starvation lethality (stopgap)**: after 2-3 consecutive days at zero food or zero water, start killing 1 crew member per day instead of only reducing morale. (A richer, asymmetric food-vs-water redesign is a separate discovery — see B8.2.)
- [X] **Desertion at sea**: allow upset crew to attempt desertion mid-voyage if morale < 30, not only at port entry. Confirmed in the save audit: several permanently-upset crew never deserted because the player simply never entered a port belonging to their faction.
- [X] **Storm scar subset**: tag only 20-40% of survivors with `scar_storm`, not the entire crew. Confirmed: a single storm at day 338 left all 220 crew members carrying the tag, making it meaningless noise.
- [X] **`longestCrewTenure` fix**: compute the stat from the current roster as well as departed crew. Confirmed: the stat showed 36 days despite multiple crew members with 500+ days aboard, because it only updates on removal.

**Note**: most low-morale-gated content (mutiny `<20`, deserters `<40`) should become naturally reachable once the above lands — a successful player currently never sees morale drop far enough to trigger either. Revisit if it's still unreachable after this ships.

**Source**: petripeeduhpedro (deliberately tested 20-day no-provisions voyages), Ren's save audit

#### B5.3 — Platform & input bugs
- [X] Equipment-boosted hull doesn't unlock `minHull`-gated ports — `canReach` / `getUnreachableReason` must read effective hull (`L.getShipStats`) instead of the ship's base hull
- [X] Crew can exceed ship max via the shipwreck-rescue event (confirmed: 81/80) — clamp roster additions to current max
- [X] Map pinch/scroll zoom also scrolls the page underneath it, with visible black-border glitching — `preventDefault` on the map's wheel/touch handlers
- [0] Fullscreen escape has no way back in short of exiting and restarting the game -> rejected, it works (escape touch on keyboard)
- [X] Market quantity-input field expands on first click and shifts the buttons out from under the cursor, breaking repeated click-click-click — reserve the layout space whether or not a trade is pending

**Source**: Ren (Discord), confirmed across both mobile and desktop sessions

#### B5.4 — Tutorial safety net
- [X] Abandoning the starter tutorial mission currently leaves a guided-onboarding player stuck with no recovery path. The QM should acknowledge the abandonment and advance onboarding regardless, instead of waiting indefinitely on a mission that will never complete.

**Source**: Ren (Discord) — hit this in the very first session, had to restart the game entirely

#### B5.5 — Economy scaling (known-direction fix)
- [X] Port market stock quantities don't scale with hold capacity or fame tier — confirmed independently by DocTheYounger, Ren, and the save audit (endgame port stocking 0-30 of most goods against a 900-capacity hold). Scale the tier quantity ranges in `generatePortMarket` by fame tier and/or hold size. (The deeper "is trade strategically interesting" question is a separate discovery — see B8.1.)

**Source**: DocTheYounger (Reddit), Ren's save audit, petripeeduhpedro

---

### B6 — Quick Wins & Quality of Life

**Goal**: cheap, low-risk improvements independently requested by multiple testers. Ship as a batch once B5 is in, before the heavier discovery/design work begins.

- [X] "Sell all (except food/water)" button — especially useful after plunder (petripeeduhpedro, Ren both asked independently)
- [X] "Buy x5 / x10 / x100" quantity buttons on the market --> x20 only (for screen size on phone)
- [0] Auto-topup food & water at market to a chosen target quantity --> rejecte for now. maybe later when there is a menu & options
- [X] Gold-sack icon + an attention/warning icon on mission cards
- [X] Indicate which faction is harmed by a mission, not only who benefits from it
- [X] Mission-type tooltips on mission cards
- [X] Repair cost scales with the ship's max hull/price, not only its missing hull points
- [X] Surrender consequences explicitly logged (gold lost, cargo seized, days imprisoned) — currently implied but never stated
- [O] Stat-change feedback beyond the existing flash: show a transient numeric delta (e.g. "-1000") near the affected HUD stat for a couple of seconds, since the colour flash alone is easy to miss --> REJECTED
- [X] Morale threshold-crossed log entries (e.g. crossing 30/50/70/90, in either direction)
- [X] Hidden port discovery gets a visible callout beyond a single log line (a player found a new port via random encounter and almost missed that it happened)
- [X] Being able to name your ship on purchase (so all ships will be named, except the dinghy. If necessary we can name it a default name in the "starts" data.)
- [X] Ship name visible on the Sailing screen / HUD (carried over from B2.1, never shipped)
- [X] Pirate crew names drawn from a random/weighted nationality pool instead of defaulting to English for every pirate hire
- [O] General log message throttling utility — apply a once-per-period cooldown to repetitive lines (navy patrol hails repeating 19 times in one session, a coward-trait reveal line firing dozens of times) -> parked
- [X] Finish hover/focus state coverage on any remaining interactive elements (carried over from B3.1, partially done)
- [O] Shipyard nudge: when the player is within roughly 1-2 missions' worth of gold of an affordable upgrade (e.g. the Cutter), show a contextual hint --> parked, playtest shows its enough.
- [X] Patrol mission card: until the full rework in B8.3 ships, add explicit instructional text telling the player to sail near the target port and advance days for the enemy to appear, instead of leaving them to guess

**Source**: petripeeduhpedro, Ren, DocTheYounger, project backlog

---

### B7 — Player Menu, Reference & Community Links

**Goal**: give players a way to manage their session and find Broadside's wider presence without hunting through the Port screen, and open a real feedback channel now that there are real players to hear from.

#### B7.1 — Menu screen
- [X] Accessible from both the Port and Sailing screens --> port only
- [X] Resume / Save / Load / Export / Import / Back to Title
- [X] Toggle auto-save on/off
- [X] Link to captain's handbook
- [X] Link to feedback form or integrated form
- [X] link to comunity (github, kofi, itch, discord?) 

#### B7.2 — Captain's Handbook
- [X] Static reference (in-app panel or linked page) explaining stats, status effects, faction mechanics, and the other hidden rules new players keep asking about in feedback
- [0] Linked from the menu and from the New Game screen -> doesnt make sense. player never read user guide before stating to play and beingt stuck or having a question.

#### B7.3 — Ship & equipment flavour text
- [0] Short descriptive text per ship type and equipment item, surfaced in the Shipyard -> there is already a stat modifier text.

#### B7.4 — Community & feedback links
- [X] Feedback form link, replacing ad-hoc collection over Discord/Reddit
- [X] Links to the itch.io page, GitHub repo, and Ko-fi

**Note**: thematically pairs with B22 (Promotion), but ships much earlier since real testers are already active and asking where to send feedback.

---

### B8 — Economy & Mission Design Discovery

**Goal**: define a clear direction for making trade viable and missions feel distinct, before committing to implementation. This is the discovery layer behind the quick numeric fix already shipped in B5.5.

#### B8.1 — Trade & economy viability
- [ ] Beyond the B5.5 quantity-scaling fix, decide on a price/availability **memory** system: surface last-known prices and stock for ports the player has already visited (status screen? a dedicated tab?) so trading isn't "searching in the dark," as described by Ren
- [ ] Audit reputation decay vs. mission completion timing — trade missions cost travel days (during which reputation decays toward 50), while combat/patrol chains can complete same-day. Confirm whether this structurally disadvantages trade-faction reputation gain, and adjust decay timing or trade rewards if so (DocTheYounger)
- [ ] Minor data balance: review port-per-faction distribution — Spanish ports are currently over-represented relative to the other four factions (DocTheYounger)

#### B8.2 — Provisions depth
- [ ] Decide: keep food and water as separate resources, or merge them, since they're always consumed in equal amounts (Ren)
- [ ] Decide: asymmetric effects — e.g. water deprivation killing crew faster than food deprivation — as a richer follow-up to the uniform B5.2 stopgap
- [ ] Explore at-sea acquisition alternatives instead of always needing a port: rain-catching, fishing, whaling

**See also**: Parked Concepts — faction-specific reputation decay curves may inform the decay audit above.

#### B8.3 — Patrol & hunt mission identity
- [ ] Core problem: patrols are confusing (multiple testers couldn't find the enemy) and hunts barely differ from generic combat missions
- [ ] Explore: a guaranteed encounter after X days (rising chance), tied to a random sea point within the patrol zone; hunts requiring scouting or trail-following instead of a flat combat trigger
- [ ] Decide whether to merge the two mission types or give each a genuinely distinct loop

#### B8.4 — Concurrent mission tracking
- [ ] Explore letting a mission (the bounty hunt especially) stay tracked passively while the player does other things, instead of forcing dedicated back-and-forth travel just to keep it active (Ren)
- [ ] This is an architecture change — `state.activeMission` is currently singular — scope the change before committing to it

---

### B9 — Player Trust & Resilience

**Goal**: ensure the game never leaves a player clicking buttons that do nothing. Scope is now informed by Wave 1 data and recalibrated against B5.2's harsher starvation rules — "unrecoverable state" means something different once starvation can actually kill crew.

#### B9.1 — Detect unrecoverable states
- [ ] Define the condition (e.g. 0 gold + 0 crew + 0 food + damaged hull + no friendly port reachable)
- [ ] Not being able to sail with 0 hull. If 0 hull + 0 gold → game over? This is the real softlock condition — no food and no crew isn't recoverable on its own, and no reachable port isn't either, but a "hunt" mission can still offer a way out
- [ ] Not being able to fight or take a mission with 0 hull
- [ ] Detection runs on port entry / end of day

#### B9.2 — Graceful career end screen
- [ ] Replace the older "mercy event" idea with an on-pillar "Your career ends here" screen
- [ ] Career summary using B2.3 stats: days survived, gold earned, ports visited, crew lost
- [ ] Option to start a new game
- [ ] Reuses the data layer built for B21 retirement
- **Pillar**: Consequence (not every captain reaches retirement, and that's allowed)

#### B9.3 — Defeat recovery audit
- [ ] Verify wash-ashore-after-defeat always leaves minimum viable resources
- [ ] Or routes to graceful career end if not

---

### B10 — Starts Variety & Captain Identity Discovery

**Goal**: the five faction starts currently differ only in opening flavour text and a fixed rep adjustment. A discovery session to decide whether — and how — to seed more replayability into the very first choice of the game.

- [ ] Discovery: should the captain have traits/background (story flavour with a mechanical bonus/malus), distinct from the faction choice?
- [ ] Discovery: should faction be locked-in with a fixed bonus (current model), or freely picked with no inherent bonus but a purchasable or story-earned **Letter of Marque** that lets the player switch allegiance later — possibly with each faction's marque carrying a different effect?
- [ ] Discovery: any other seed choices worth adding at New Game time purely for opening replayability
- [ ] Decide on a direction and implement it on the New Game screen

---

### B11 — Combat Depth Rework

**Goal**: four actions where the enemy picks broadside 70% of the time will feel repetitive over a long campaign, no matter how good the narrative log gets — and this was independently confirmed by petripeeduhpedro ("grappling pushed me away from combat"), Ren ("you just steamroll"), and the save audit (140 grapple wins, near-zero combat variety). Scope and direction informed by Wave 1.

#### B11.1 — Encounter architecture refactor (carried over from B1.4)
- [ ] Apply the unified encounter/activeMission/battleState model already designed during the B1.3 discovery, before adding distance, AI variety, or a boarding minigame on top of the old per-type conditionals
- **Pillar**: Consequence (every new encounter type should be a data addition, not a code conditional)

#### B11.2 — Discovery: what role should combat play?
- [ ] Primary activity vs. punishment for failed negotiation
- [ ] How much depth vs. how much speed (1-minute fights vs. 5-minute fights)
- [ ] Decision stacking vs. positional play
- [ ] Cross-reference Wave 1 findings on combat fatigue

#### B11.3 — Discovery: wind & position
- [ ] Should wind affect combat actions (favourable for chase, opposing for boarding)?
- [ ] Distance bands (long / medium / boarding range), with a "close distance" / "open distance" action that makes fleeing easier at range and grappling easier up close?
- [ ] A maneuver phase?

#### B11.4 — Implement combat depth changes
- [ ] Apply the model chosen in B11.2/B11.3: distance system, revised enemy AI (situational, not flat weights)
- [ ] **Post-boarding crew-fight phase**: grappling success no longer ends the fight outright. A boarding success still favours the larger crew, but resolves into a separate crew-combat roll/phase so a 80-vs-60 crew advantage is still an advantage, not an automatic, costless win (petripeeduhpedro, Ren, save audit all converge on this exact complaint)
- **Pillar**: Consequence

#### B11.5 — Enemy AI variety
- [ ] NPCs choose actions based on situation, not flat weights (low hull → grapple attempt, fast ship → evade, large crew → grapple)
- [ ] Each enemy type gets a "preferred doctrine" reflected in its choice weights
- [ ] Cheap win even independent of B11.4, can ship on its own

#### B11.6 — Combat log narrative depth pass
- [ ] Leverage existing crew names/traits in the round-by-round log ("Maria refuses to load the cannons," "the cook screams when the deck is hit")
- [ ] Connects combat to the crew attachment pillar
- **Pillar**: Consequence

#### B11.7 — Weapons & ammunition as a combat resource
- [ ] Add weapons/ammunition as a consumable resource analogous to food/water, gating combat actions the way provisions gate morale (Ren's suggestion). Touches the market and hold the same way provisions do — if B8.2's provisions redesign has already shipped, model this consistently with whatever direction that took.

---

### B12 — Sailing Enrichment

**Goal**: make the voyage — the most-repeated action — more engaging. Direction informed by Wave 1.

#### B12.1 — Sailing micro-loop improvement
- [ ] More frequent micro-decisions during sailing (currently 50-60% dead air estimated)
- [ ] Crew events at sea: arguments, sightings, morale moments, trait reveals
- [ ] **Press-your-luck choices** in random events — give players genuine risk/reward decisions at sea rather than a single safe option and a single risky one
- [ ] Weather changes that affect speed and create decisions ("storm approaching — push through or divert?")
- [ ] Wind system that matters more: tacking, favourable/unfavourable wind as an active consideration
- [ ] Sighting reports: "smoke on the horizon," "sail spotted," "land ahead" — information before commitment
- **Note**: mid-voyage course change is already implemented and turns passive clicking into active route decisions; this tier enriches the between-ports experience further.
- **Pillar**: Freedom (the journey is a decision space, not dead air)

#### B12.2 — Dynamic event expansion
- [ ] Expand the random event pool (currently ~5% per day, ~10 event types)
- [ ] Conditional events: appear only when specific state conditions are met (low morale + storm, high infamy + bounty hunter, etc.)
- [ ] Multi-part events: "you found a map" → later "the island from the map is nearby"
- [ ] Crew-specific events: triggered by individual crew traits (drunkard causes brawl, coward panics in storm)
- [ ] Scale event frequency with fame, the way patrol frequency already scales with infamy and heat, so the late game feels progressively busier rather than emptier
- **Pillar**: Discovery (every voyage holds surprises)

---

### B13 — Narrative Layer Upgrade

**Goal**: surface named crew members in routine events and elevate the raw log into something closer to a written account, now that the random event pool (B12) gives it richer material to work with. Pairs naturally with the existing Identity & Feedback pillar — could in principle ship at any point with no hard prerequisite, but lands here so Wave 2 can react to it alongside the combat and sailing changes.

#### B13.1 — Role-based log entries
- [ ] Identify all log-generating moments where a crew member's *role* could plausibly be invoked: combat shots, food/water depletion, storms, voyage events, repair moments, scouting/arrivals
- [ ] Write 8-15 template variants per role (gunner, cook, carpenter, navigator, deckhand) for each applicable moment
- [ ] Templates use the `{name}`, `{role}`, `{daysAboard}` slots the bio generator already uses, for consistency
- [ ] Store in `data_text.js` alongside existing log templates
- [ ] Helper `pickCrewMemberByRole(state, role)` and `formatNamedLogLine(template, member)` in `generators.js`, with a frequency cap (roughly 1-in-3 chance of naming someone, otherwise generic) and a dedupe check so the same crew member isn't named twice in close succession
- [ ] Inject into: `BATTLE_ACTION` (gunner), provision depletion (cook), arrival proximity (navigator), storm hull damage and `REPAIR` (carpenter), `ENTER_PORT` (navigator)
- [ ] Test pass: verify named crew appear across at least 5 event types, no errors when a role isn't represented in the crew

#### B13.2 — Prose-style daily journal summarisation
- [ ] On days with notable events, generate a paragraph or two of prose summarising the day, rather than a flat list of log lines — aiming for a tone closer to a written journal than a game log (the explicit reference point is the Baldur's Gate journal style)
- [ ] Decide where this lives: a rewrite of existing log entries, or an additional "journal" rendering layer that reads the same underlying log/career data without replacing the raw log
- [ ] This is the most direct expression of the project's long-term vision (see below) — worth treating as a flagship feature, not an afterthought

**Pillar**: Consequence (named individuals and a readable day-by-day account both make the story visibly the player's own)

---

### B14 — Playtest Wave 2

**Goal**: validate combat (B11), sailing (B12), and the narrative upgrade (B13) before investing in world events and story arc.

#### B14.1 — Recruit testers
- [ ] Mix of new testers and returning Wave 1 testers (returning testers can compare directly)

#### B14.2 — Define Wave 2 metrics
- [ ] Did combat feel less repetitive?
- [ ] Did sailing feel less like dead air?
- [ ] Are encounter decisions interesting on repeat?
- [ ] Does the prose journal read as an improvement, or as noise?
- [ ] What broke in the changes?

#### B14.3 — Synthesise findings
- [ ] Document what to keep, what to revisit
- [ ] Identify any architectural rot that needs a B1-style cleanup pass before B19

---

## Crew Systems Deepening (B15–B18)

Multiple testers reported having almost no interaction with their crew despite the game's named-crew identity ("I had zero crew interactions," "I rarely even checked on them" — Ren). The four blocks below are the direct answer: functional roles give crew members a reason to be looked at individually, and shore leave, councils, and articles give the crew a voice and a presence beyond combat and hiring screens.

Genre-inspiration notes worth keeping in mind while designing these (from a Reddit exchange about comparable tabletop/board games): a **crew unrest track**, **scurvy**, and **days of Revelry & Debauchery followed by a hangover** were all cited as mechanics the player found compelling in other Caribbean-themed games — useful flavour reference for B16 and B17 specifically, not a directive to copy them wholesale.

### B15 — Functional Crew Roles

**Goal**: promote crew roles from cosmetic to mechanical. Roles already exist (deckhand, gunner, cook, carpenter, navigator) but currently have zero gameplay effect.

- [ ] Discovery: what stat bonus per role — Gunner → combat, Navigator → travel days, Carpenter → repair cost, Cook → provision efficiency, etc.
- [ ] Discovery: when do bonuses unlock — immediately on hire, or tied to days-served the way seasoned/veteran/loyal tags already are?
- [ ] Implement the chosen bonuses
- [ ] Update role icon tooltips to reflect their new mechanical weight, not just flavour

**Note**: best sequenced after B11 (Combat Rework) settles the combat math, since a Gunner's bonus interacts with it directly.

### B16 — Shore Leave System

**Goal**: convert port-time from "instant transactional space" to a place where named crew members live and small events occur. Give the player a meaningful duration choice on arrival.

**Pairs naturally with**: B12 (Sailing Enrichment). Provides the port-side equivalent to the sailing micro-loop improvements. Prerequisites: none structurally, but the writing investment is heavy, so it makes sense only once Wave 1 (complete) and the crew-depth motivation above have confirmed players engage with named crew enough to justify it.

#### B16.1 — Discovery: shore leave mechanics
- [ ] Decide: is shore leave a *duration choice* on arrival, or a *separate action* at port?
- [ ] Decide: what's the morale recovery rate per day on leave vs. the current "Buy Drinks" gold cost?
- [ ] Decide: do wages accrue normally during shore leave, or at a reduced rate, or not at all?
- [ ] Decide: does the player choose total duration upfront, or extend day-by-day?
- [ ] Decide: what's the trigger frequency for crew events during leave? (One roll per day? Tiered by member traits?)
- [ ] Decide: do harbour-side events affect things outside the crew (port reputation, gold, gossip pool)?
- [ ] Decide: can shore leave be force-shortened if an emergency happens (faction war declared, mission urgency)?

#### B16.2 — Implement: duration UI and core loop
- [ ] Add a "Shore Leave" panel/screen accessed from the port screen
- [ ] Duration selector or day-by-day extension button
- [ ] Per-day cost calculation (wages, possibly minus a discount)
- [ ] Per-day morale recovery applied to crew
- [ ] Port reputation/gossip refresh during/after leave

#### B16.3 — Implement: event pool
- [ ] New event type `port_event` (separate from `RANDOM_EVENTS` for sea)
- [ ] Event generator that picks events based on the named crew aboard, the port faction, and ongoing world state (heat, infamy, etc.)
- [ ] Event resolution: dispatch through the same `RESOLVE_EVENT` flow or a parallel one (decide in B16.1)

#### B16.4 — Writing: 20-30 port event templates
- [ ] Cost events: tavern brawls, jail fines, lost crew (passed out and missed roll-call)
- [ ] Benefit events: map fragments overheard, gossip leads, found goods, recruited skilled crew
- [ ] Trait-revealing events: drunkard caught red-handed, coward backs out of a barfight, greedy fights over their share
- [ ] Faction-flavour events: Spanish religious processions if Spanish crew, French market festivals, etc.
- [ ] Possible: events that consume specific cargo for benefits ("trade rum for tavern story leads")

#### B16.5 — Integration with existing systems
- [ ] Shore leave should NOT trigger random sea events (different event pool)
- [ ] Shore leave SHOULD trigger faction heat decay normally
- [ ] Shore leave SHOULD trigger reputation decay normally
- [ ] Shore leave should respect tutorial onboarding (no shore leave events during the QM phase, or suppress until the first contract is complete)
- [ ] Mid-leave emergencies (e.g. a heat spike, a world event) might shorten leave

#### B16.6 — Test pass
- [ ] Full playthrough with shore leave at multiple ports
- [ ] Verify cost/morale balance feels right
- [ ] Verify event frequency feels right (~1 per 2-3 days?)
- [ ] Verify named crew appear in events

**Pillar**: Discovery (port becomes a place, not a transaction)

**Risk**: Medium. The discovery questions in B16.1 must produce a coherent mechanic before implementation; if shore leave costs outweigh rewards, players will simply skip it.

### B17 — Crew Council System

**Goal**: a periodic, gated mechanism for the crew to weigh in on the captain's decisions. Historically grounded in pirate-era democracy. Outputs range from narrative observation to demands the player must respond to. The defining mechanic of "crew are people who run this ship with you."

**Pairs naturally with**: B20 (Hidden Ports & Story Arc). Hard dependency on B2.3 (Career Stats Tracking), already complete.

**Implemented in phases**: narrative output first (lowest risk), then meaningful choices, then demands/quests.

#### B17.1 — Discovery: council mechanics
- [ ] **Trigger conditions**: time-based (every N days at sea), fame-based (each tier unlock), event-based (after major incidents), player-initiated (button, but rate-limited)? Probably a combination.
- [ ] **Frequency caps**: minimum days between councils to prevent spam (e.g. 30 days)
- [ ] **Convening cost**: does calling a council cost morale/gold/time? Is there a cost to *not* calling one occasionally?
- [ ] **Outputs structure**: pure observation? observation + advice? advice + demand?
- [ ] **Data sources**: which career stats does the council read? Which crew composition data? Which event history?
- [ ] **Failure modes**: what if the council's content is repetitive? What if the player ignores it?

#### B17.2 — Implement: career stats data layer
- [ ] Verify B2.3 data is accessible from the council generator
- [ ] If gaps exist (specific stats the council needs that B2.3 doesn't track), add them as a prerequisite task

#### B17.3 — Phase 1: narrative output only
- [ ] UI for the council screen — list of named crew speaking, each with a short observation
- [ ] Generator picks 3-5 crew members based on relevance (faction alignment to recent actions, role to recent events, traits)
- [ ] Each speaker says one thing drawn from a template pool
- [ ] At end of council: morale shift based on whether speakers' concerns align with the captain's recent actions
- [ ] **Templates needed**: 30-40 observation templates covering all major career-stat conditions (heavy combat, heavy trade, faction bias, contraband, neglected crew, etc.)
- [ ] No player choices yet — player closes council, gets the morale outcome, moves on

#### B17.4 — Phase 2: meaningful choices
- [ ] At end of observation phase, present 2-4 player choices: "Agree with crew" / "Disagree" / "Acknowledge but defer" / etc.
- [ ] Each choice has direct consequences: morale change, reputation shift, faction heat, internal upset/loyal tagging
- [ ] **Templates needed**: choice text + consequence definitions for each council scenario
- [ ] UI updates: choice buttons under each speaker, or a single resolution choice at the bottom

#### B17.5 — Phase 3: requests and quest hooks
- [ ] Some council outcomes generate **crew requests**: "We want shore leave in Tortuga" / "We want a share of next prize" / "We want to sail to a specific port"
- [ ] Player can accept (cost) or refuse (morale cost)
- [ ] Some council outcomes generate **personal quests**: a specific named crew member gets a quest hook ("Maria wants to find her uncle's ship near Trinidad")
- [ ] Quest hooks live as a new mission type or as story flags

#### B17.6 — Phase 4: council convening UX
- [ ] Add a "Convene Council" button accessible from the Crew screen
- [ ] Show next-available date based on cooldown
- [ ] Optional: auto-convene at significant career milestones (first 100 days at sea, first 100 ships defeated, etc.)
- [ ] Council history visible in the Journal under a new "Councils" tab

#### B17.7 — Test pass
- [ ] Trigger councils in various game states to verify content is contextually relevant
- [ ] Verify the player isn't getting the same observation twice in close succession
- [ ] Verify quest hooks generate sensible missions
- [ ] Balance test: are players actually using councils, or ignoring them?

**Pillar**: Consequence (the crew has agency and a voice; the captain isn't a dictator)

**Risk**: Medium-high. The council needs to feel meaningful, not repetitive. Quality of writing in observation templates is the make-or-break factor — ship Phase 1 first and gauge engagement before committing to Phases 2-4.

### B18 — Pirate Articles System

**Goal**: a small set of player-editable ship's articles (rules) that affect gameplay. The articles can be amended through crew council outcomes, giving the council a tangible mechanism for crew influence on the ship's direction. Disguises some gameplay settings (difficulty modifiers, share splits, behavioural tendencies) as in-world contracts.

**Pairs naturally with**: B17 (Crew Council). Hard prerequisite: B17 must exist for articles to be amendable through it.

**Could ship in two parts**: static articles set at game start (Phase 1), then dynamic amendment via council (Phase 2).

#### B18.1 — Discovery: articles design
- [ ] **What rules become articles?** Candidates:
  - Gold share split (Captain takes X%, crew gets rest)
  - Combat preference (Hunt all merchants / Spare neutrals / Only legitimate prey)
  - Crew share-out timing (Per-port / Per-mission / End-of-voyage)
  - Mandatory shore leave (Every X days / At captain's discretion)
  - Punishment severity (Lenient / Severe / Marooning)
  - Loot distribution rules (Equal shares / By rank / By role)
  - Mutiny conditions (At what morale level does crew act?)
- [ ] **How many articles?** 4-7 seems right; fewer feels thin, more becomes a spreadsheet
- [ ] **Mechanical effects per article**: each toggle should produce a visible gameplay change (morale modifier, reputation shift, mission availability, faction reactions, internal crew dynamics)
- [ ] **Starting articles**: each faction start begins with defaults consistent with their backstory. Pirate start has the most flexible articles; English start has the most rigid.

#### B18.2 — Implement: static articles at game start
- [ ] New screen: "Ship's Articles" accessible from Crew screen or Status screen
- [ ] Visual: looks like a parchment contract, not a settings menu
- [ ] Articles displayed as checkboxes / radio buttons / sliders dressed up as period-appropriate rules
- [ ] At game start: articles are set by faction default, locked from player edit (Phase 1)
- [ ] Each article displays its gameplay effect inline ("Captain takes 30% → +20% personal gold gain, -10 crew morale on prize")

#### B18.3 — Implement: article effects on gameplay
- [ ] Each article toggle reads/affects relevant state
  - Share split affects gold distribution in `COMPLETE_MISSION` and plunder
  - Combat preference affects encounter generation (or just mission availability)
  - Punishment severity affects mutiny/desertion probabilities
- [ ] Effects must be balanced so no single article is dominant or trivial
- [ ] Balance pass: economy simulator (tests/sim.html) updated to model article effects

#### B18.4 — Phase 2: dynamic amendment via council
- [ ] Crew council outcomes can propose article amendments (B17 Phase 3 request mechanism)
- [ ] Player can accept (article changes, crew morale +) or refuse (no change, possible upset/desertion)
- [ ] Some amendments require council vote — multiple crew members must agree before the player can ratify
- [ ] Failed ratification creates crew upset
- [ ] Player can also propose amendments themselves (with crew approval check, gated by morale)

#### B18.5 — Phase 3: world-event amendment hooks
- [ ] Some world events propose article changes ("After repeated mutinies, the crew demands stricter punishment articles")
- [ ] Some story events lock or unlock article options ("After reaching Libertalia, you may add the 'Equal Shares for All' article")
- [ ] Articles become part of the player's identity that the world reacts to ("This captain is known for fair shares" → reputation shift)

#### B18.6 — UI polish: parchment aesthetic
- [ ] Articles screen should look in-period — parchment background, gold ink, signatures
- [ ] Each amendment is added as an addendum, dated to the day it was made
- [ ] Full articles document persists as part of the save and shows up in the Journal under a new "Articles" tab

#### B18.7 — Test pass
- [ ] Articles work mechanically across all faction starts
- [ ] Council amendments flow correctly
- [ ] Effects balance out (no broken combinations)
- [ ] Visual feels period-appropriate, not modern-UI

**Pillar**: Freedom (the player shapes the kind of captain they are through real rules, not menu settings) + Consequence (rules have visible mechanical and social effects)

---

### B19 — World Events & Economy Dynamics

**Goal**: the world acts on its own, not just in reaction to the player. Trade and exploration get a dynamic backdrop, and player actions visibly shift the economy and faction balance.

#### B19.1 — Discovery: world event types & cadence
- [ ] Famines, harvest fails, blockades, faction wars, naval supremacy shifts
- [ ] How frequently do they fire? How visible to the player (gossip, headlines, in-game news)?
- [ ] How long do they last? Can the player interact with them?

#### B19.2 — Implement world event system (placeholder)
- [ ] Apply chosen model from B19.1

#### B19.3 — Discovery: economy dynamism mechanics
- [ ] Do prices react to world events?
- [ ] Does player heavy-trading nudge prices? For how long? Per port or regional?
- [ ] Does port defence strength shift with faction wars, raiding pressure, or heavy trading — making the world feel like it's reacting to the player's specific pattern of play, not just a static backdrop?
- [ ] (Player-impact economics is hard; world events give 80% of the feel for 20% of the work)

#### B19.4 — Implement economy dynamics (placeholder)
- [ ] Apply chosen model from B19.3, including dynamic port defence and trade prices

#### B19.5 — Named rival captains & escalation
- [ ] Named rival captain(s) who appear, escalate, and must eventually be confronted
- [ ] Bounty hunter encounters that scale with infamy
- [ ] Governor missions: high-rep faction offers a multi-part quest chain (e.g. "clear the pirate nest at Roatán")

#### B19.6 — Mid-game content
- [ ] Story beats at fame thresholds (50, 100, 200) — the world acknowledges your rise
- [ ] Crew loyalty events: long-serving crew members initiate conversations, requests, or betrayals
- [ ] Port-specific quest lines: unique missions available only at certain ports after reputation thresholds
- [ ] Equipment quest: a legendary item that requires a multi-step quest to obtain

---

### B20 — Hidden Ports & Story Arc

**Goal**: hidden ports currently feel like "more ports." Give each one a reason to exist and tie them to the endgame arc.

#### B20.1 — Discovery: what's the main story arc?
- [ ] Does the campaign have a shape? Rising action? Climactic confrontation?
- [ ] Player-defined milestones (fame ladder, infamy ladder, gold target)?
- [ ] How do the four starting factions intersect with the arc?

#### B20.2 — Implement story arc framework (placeholder)
- [ ] Apply model chosen in B20.1

#### B20.3 — Discovery: unique mechanic per hidden port
- [ ] Roatán, Dry Tortugas, Las Aves, Libertalia each get a reason to matter beyond services
- [ ] Each could anchor a piece of the story arc

#### B20.4 — Implement hidden port mechanics (placeholder)
- [ ] Apply per-port chosen mechanics from B20.3

#### B20.5 — Discovery: Libertalia as endgame anchor
- [ ] Does discovering it change the game? Unlock retirement? Trigger faction-level events?
- [ ] Is it a place, an idea, or a faction?

#### B20.6 — Implement Libertalia endgame role (placeholder)
- [ ] Apply chosen model from B20.5

---

### B21 — Endgame & Legacy

**Goal**: the career has a shape with a beginning, middle, and end. Player can choose to retire, or accept that their career ended on its own terms.

#### B21.1 — Victory conditions
- [ ] **Three victory tracks**: Fame, Infamy, and Popularity, giving the sandbox a clear win condition along three distinct playstyles. Note: Popularity does not currently exist as a tracked stat — define it before implementation (likely some aggregate of cross-faction reputation, distinct from the existing Fame/Infamy pair)
- [ ] Additional optional paths: retire with X gold, discover all hidden ports, complete a final quest chain
- [ ] Multiple paths so different playstyles have a finish line

#### B21.2 — Retirement screen
- [ ] Career summary with stats (uses B2.3 data layer)
- [ ] Notable events, crew roster at retirement, ships owned
- [ ] Readable story-format summary ("the novel you wrote by playing") — natural pairing with B13.2's prose journal work

#### B21.3 — Legend score
- [ ] Calculate from career stats
- [ ] Display alongside the retirement screen

#### B21.4 — "One more thing" hook
- [ ] After retirement, option to continue sailing or start a new game with a legacy bonus
- [ ] Multi-run legacy: new runs benefit from the previous captain's legend in small ways

#### B21.5 — Difficulty settings
- [ ] Forgiving / Standard / Ruthless
- [ ] Affects initial resources, enemy scaling, event frequency, softlock detection thresholds

#### B21.6 — Polish graceful career end from B9
- [ ] If softlock detection has been driving the player to a career end screen, make sure it integrates cleanly with the retirement flow

---

### B22 — Promotion & Web Presence

**Goal**: promote a game that's been through two playtest cycles, not one that's been through zero.

#### B22.1 — itch.io listing
- [ ] Page with screenshots, description, tags
- [ ] Use screenshots generated via screenshots_builder.html

#### B22.2 — GitHub Pages deployment verified
- [ ] Confirm play link works on first visit, no localStorage prompts

#### B22.3 — README badges and play link prominence
- [ ] License, play link, build status (if applicable)

#### B22.4 — Contributor onboarding
- [ ] CONTRIBUTING.md with how to run, how to test, file responsibility map (carried over from B0.2)
- [ ] Three-pillar test documented as a checklist for proposed features (carried over from B0.2)
- [ ] Triage open work into labelled GitHub Issues, including good-first-issue labels
- [ ] Pin a discussion or write a short blog post inviting contributors

---

### B23 — Audio & Visual Polish

**Goal**: sensory layer that reinforces the systems underneath. Done last because sound and animation are amplifiers of working systems, not substitutes.

#### B23.1 — Sound design
- [ ] Ambient port sounds (seagulls, waves, crowd murmur)
- [ ] Sailing ambient (wind, creaking hull, waves)
- [ ] Combat sounds (cannon fire, wood cracking, crew shouts)
- [ ] UI sounds (button click, gold clink, mission accept)
- [ ] Music: atmospheric sea shanty / period-appropriate background

#### B23.2 — Animation & visual effects
- [ ] Ship movement animation on map
- [ ] Combat round animations (cannon flash, hull impact)
- [ ] Port arrival transition
- [ ] Weather effects on sailing screen (rain, storm clouds, calm shimmer)

#### B23.3 — Small atmospheric details
- [ ] Small visual flourishes on the sailing/port screens — a bird flying, a parrot or palm tree at harbour, similar low-cost details that add a lot to the sense of place (Ren)
- [ ] Specific sound cues called out directly by testers: a ship departing, a seagull cawing, waves crashing, dockside chatter, harbour bells

---

## Completed Work

### T1 — Core Loop ✅
Sail → trade → fight → upgrade → repeat. Basic navigation, market, combat, and port systems.

### T2 — Systemic Depth ✅
Crew loyalty with faction alignment, upset/desertion mechanics. Reputation system (5 tiers). Random events at sea. Crew traits (hidden → revealed), scars, positive progression (seasoned → veteran → loyal). Generated crew biographies with combo sentences.

### T3 — Content Expansion ✅
6 mission types (trade, escort, patrol, assault, smuggle, bounty). 25 ports with faction services. 14 tradeable goods with variance. Port gossip generator (heat, fame, infamy, reputation, ambiance, weather, market hints). 5 starting scenarios. Faction heat system. Black market with contraband risk.

### T4.1 — Robust Save System ✅
localStorage auto-save on port arrival. File export/import with base64 encoding and hash integrity check. State migration for version upgrades. Error boundary with "Try Load Last Save" recovery. Import via file picker on both title and port screens.

### T4.2 — Captain's Journal Screen ✅
Full journal with category filtering (crew, combat, ports, missions, trade). Search bar. Day grouping. Reverse chronological display. Log line classification with icons. Accessible from port screen.

### T4.3 — Tutorial Overlay System ✅
Per-screen dismissible tutorial popups (port, map, sailing, battle, market, crew, shipyard, journal, status). "Don't show again" checkbox that disables all tutorials. Tutorial state persisted in localStorage independently of game save. Toggle on title screen.

### T4.4 — Map Visual Improvements ✅
SVG coastline outlines for major landmasses. Faction-colored port dots with hover info. Mission route indicator. Wind compass rose. Zoom and pan (mouse wheel + pinch). Grid overlay. Gradient backgrounds.

### T4.5 — itch.io Listing Prep ✅
Screenshot generator. Initial itch.io page and GitHub Pages deployment work done. (Full promotion deferred to B22.)

### T4.7 — Onboarding Redesign (initial pass) ✅
QM-led 16-step guided tutorial implemented as the "Guided" mode. Hints mode and None mode coexist. Tutorial delivery and tutorial hunt missions auto-inject during Guided onboarding. Force-stocked market goods during the first delivery. Playtest validation of these three modes happened in Wave 1 — see Onboarding Decision below.

### T5.1 — Equipment Slot System ✅
17 equipment items across 4 slot types (hull, armament, rigging, special). Per-ship slot limits. Buy, install, remove to locker, reinstall from locker. Fame and hull prerequisites. Stat preview with before/after deltas. Trade-offs on every item (speed vs hull, damage vs crew loss, etc.). Structural items (non-removable) vs removable items.

### T6.1 — Responsive Overhaul (touch + buttons) ✅
Responsive breakpoints (isNarrow checks). Touch targets ≥ 44px. Stack panels on narrow screens. (Swipe gestures parked — see Parked Concepts.)

### T4/T5 — Mid-Voyage Course Change ✅
Route tracking with sea position interpolation. Endurance budget system (can't exceed ship's maxDays across legs). "Change Course" button on sailing screen opens map in at-sea mode. Map shows reachable ports from current sea position with remaining endurance. Reroute recalculates travel days from current position. Ship marker visible on map while at sea.

### T4/T5 — SVG Map Enhancements ✅
Sea gradient background with radial highlight. Grid overlay. Wind compass rose with speed display. Faction-colored port markers with hover info (days, reputation, heat). Mission route indicator line. Ship marker at sea position during voyages. Zoom and pan controls.

### Icon system & Captain's Log icons ✅
SVG icon library in icons.jsx. LOG_ICONS lookup map (window.UI.LOG_ICONS) maps classification categories to icon components. Captain's Log and Journal both render category icons inline.

### B0 — Foundation Cleanup ✅
- README architecture overview, debug noise removal, stale `ship.upgrades` reference fixed, integration sanity test page (`tests_integration.html`) catching load-order regressions.
- **Not done, deliberately deferred**: CONTRIBUTING.md and a three-pillar feature checklist → moved to B22.4. Dependency comments at the top of each file → explicitly skipped; revisit only if a real load-order bug recurs (the original LOG_ICONS-class issue was caught by the sanity test page instead).

### B1 — Architecture Cleanup ✅
- Onboarding extracted into a single middleware reducer (`engine_onboarding.js`) watching all actions via an action→step lookup table, instead of scattered `if (onboarding.enabled)` checks across domain reducers.
- `screens_voyage.jsx` split: Battle/Plunder/Event/Intercept moved into their own files, Map/Sailing stayed together.
- Full documentation refresh across all spec files, including the QM onboarding system, the `STARTS` data shape, and the market flavour generator.
- **Not done, deliberately deferred**: the unified encounter/activeMission/battleState architecture refactor (designed during the B1.3 discovery) → moved to B11.1, to land at the start of Combat Depth Rework rather than being implemented in isolation. `engine_port.js`/`engine_combat.js`/`data.js` size audits → rejected, still comfortably under the size limit.

### B2 — Identity & Feedback ✅
- Unique procedural ship silhouettes per type, equipment partially reflected visually (extra sails, war pennants, copper plating), faction-specific port arrival illustrations.
- UI juice pass: HUD flash-on-change for gold/morale/hull, panel glow on combat damage, animated battle log entries, plunder "loot gained" pop.
- Career stats tracking added to state and displayed on a revamped Status screen. Decided against per-run vs. cumulative split — not a roguelite/roguelike.
- **Not done, deliberately deferred**: ship name visible on the Sailing screen/HUD → moved to B6.

### B3 — UI Polish & Mobile ✅
- Responsive audit at 360px-1440px, panels stack vertically on narrow screens, all interactive elements ≥ 44px.
- Hover/focus states added across most interactive elements. Color contrast and high-contrast palette options rejected as unnecessary. ARIA labels hidden for icons (all buttons carry text). Keyboard navigation parked; screen reader compatibility rejected for now, pending real feedback that it's needed.
- **Ongoing, non-blocking**: fully consistent spacing/typography across every screen is treated as background polish to land incrementally — nothing currently reads as visually broken, so it isn't gating any other block. Any remaining hover/focus gaps moved to B6 as a quick win.

### B4 — Playtest Wave 1 ✅
- Recruited testers via Reddit (r/WebGames) and Discord, covering a mix of phone/desktop and varying familiarity with the genre.
- Synthesized findings directly informed the full B5-B10 sequence above: confirmed exploits (grapple, patrol duplication, mission chaining), confirmed UX confusion points (patrol missions, market memory, fullscreen/zoom bugs), and confirmed the trading-vs-combat balance gap.
- A full save-state audit (608 in-game days, fame 252) was performed on one tester's completed campaign and is the source of most of the B5 bugfix list.
- A localStorage-access bug specific to certain browser/embed combinations (itch.io iframe context) was found and patched with a guardrail during this wave.

### Onboarding Decision (formerly B6) ✅ Resolved
- **Outcome: keep the three-tier system (Guided/Hints/None) as-is.**
- Guided (QM) mode produced meaningfully better outcomes than Hints alone.
- Hints alone was still sufficient to get players to their first ship upgrade.
- Where players got lost regardless of mode: specific mission types (patrol, hunt) being unclear — this is **not** an onboarding-mode problem, it's a mission-design problem, and is handled directly in B8.3 rather than by changing the onboarding system itself.
- Documentation already reflects this decision; no format change needed.

## Parked Concepts

Ideas captured but not scheduled. May be promoted to a block if they pass the three-pillar test.

- **Swipe gestures for tab navigation** (market, shipyard, journal): low priority while touch + buttons work well
- **Crew relationships**: friendship/rivalry pairs that affect morale and combat
- **Ship naming**: player can rename their ship; name appears in journal and on map (distinct from B6's "show the existing name" quick win — this is about letting the player *change* it)
- **Port investment**: spend gold to build infrastructure at a port, improving services over time
- **Fleet command**: own multiple ships, assign crew, run trade routes automatically
- **Seasonal weather patterns**: hurricane season, trade winds, monsoon — affect routes and risk
- **Historical events**: real 1695 events (e.g., Henry Every's trial) appear as news, affect the world
- **Pirate republic**: if player controls multiple pirate ports, trigger a faction-level event
- **Crew skill system**: individual crew members gain XP in their role, affecting ship performance (note: overlaps with B15's Functional Crew Roles — revisit once B15 ships to see if this is still a distinct idea or already covered)
- **Reputation decay curve**: different factions forget at different rates (pirates forget fast, Spanish never forget) — directly relevant to the B8.1 reputation-decay-vs-mission-type audit; consider promoting alongside that work rather than independently
- **Forced softlock playtest scenario**: deliberately giving a tester an unwinnable save. Decided against — natural data from Wave 1 was preferred, and the 608-day save audit ended up serving exactly this purpose unintentionally.

## Long-term Vision

Broadside should feel like **reading a novel you wrote by playing it**. The Captain's Journal, crew biographies, and gossip system are the foundation of that vision, and the planned prose-style daily journal (B13.2) and named-crew retirement summary (B21.2) are the most direct steps toward actually delivering it. Every mechanical system should feed back into the narrative layer — creating stories that are unique to each playthrough, told in the player's own words through their choices.

The game is complete when a player can finish a run, read their journal from start to finish, and say: **"That was my story."**