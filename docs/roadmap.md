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
- **Turn‑based naval combat** with 4 actions (broadside, precision, grapple, evade) + distance movement (Far/Medium/Close),.
- **Boarding phase** as a second part of the combat : Advantage Bar (crew × morale), Demand Surrender, and Fall Back.
- **Encounter system** with data-driven options (fight, flee, parley, bribe, surrender, inspect)
- **Stable, learnable economy** — port prices driven by availability tier and faction production modifiers, not pure random noise.
- **Dynamic market economy** with 14 tradeable resources, per‑port availability, buy/sell/black market.
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
- **Prefer deepening interaction between existing systems over adding new isolated features.** A feature passes the test if it makes two existing systems talk to each other in a way that creates new situations, not if it simply adds a new number to track.

---
## Long‑term Vision

Broadside should feel like **reading a novel you wrote by playing it**. The Captain's Journal, crew biographies, and gossip system are the foundation of that vision.

The game should turn **state changes into situations**, and **situations into stories**. Every mechanical outcome should be legible as a narrative event, and every narrative event should have mechanical weight. The Journal is not a log — it is the player's memory of their career. Every mechanical system should feed back into the narrative layer — creating stories that are unique to each playthrough, told in the player's own words through their choices.

The game is complete when a player can finish a run, read their journal from start to finish, and say: **"That was my story."**

---

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
| **T1-T6** | First game loop and screens versions. | ✅ DONE |
| **B0–B4** | Foundation fixes, architecture revamp, onboarding, Playtest Wave 1 | ✅ DONE |
| **B5** | Critical bug & exploit fixes | ✅ DONE |
| **B6** | Quick wins & quality of life | ✅ DONE |
| **B7** | Player menu, reference & community links | ✅ DONE |
| **B8** | Economy & mission design discovery | ✅ DONE |
| **B9** | Player trust & resilience | ✅ DONE |
| **B11** | Combat depth rework | ONGOING |
| **B10** | Starts variety & captain identity discovery | 🔲 Planned |
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
| **B22** | Promotion & web presence | ✅ DONE |
| **B23** | Audio & visual polish | 🔲 Future |

## Implementation Order

╔═══════════════════════════════════════════════════════════════╗
║                   PARALLEL TRACKS (B10–B13)                  ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║   B10 (Captain Identity) ──────┐                              ║
║                                ├── B12 (Sailing) ──┐          ║
║   B11.8 (Combat AI) ───────────┤                    │          ║
║                                ├── B13 (Narrative) ─┘          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
                                │
                                ▼
╔═══════════════════════════════════════════════════════════════╗
║         B14 — Playtest Wave 2 + Telemetry (Validation Hub)   ║
╚═══════════════════════════════════════════════════════════════╝
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
╔═══════════════════════════════╗ ╔═══════════════════════════════╗
║   B15–B18 (Crew Depth)        ║ ║   B19 (World Events)          ║
║   • B15 Functional Roles     ║ ║   • Parametric events          ║
║   • B16 Shore Leave          ║ ║   • Economy dynamics           ║
║   • B17 Crew Council         ║ ║   • Named rivals               ║
║   • B18 Pirate Articles      ║ ║   • Mid‑game content           ║
╚═══════════════════════════════╝ ╚═══════════════════════════════╝
                │                               │
                └───────────────┬───────────────┘
                                ▼
╔═══════════════════════════════════════════════════════════════╗
║          B20–B21 — Story Arc & Endgame (Finale)              ║
║          (Requires both crew depth and world state)          ║
╚═══════════════════════════════════════════════════════════════╝
                                │
                                ▼
╔═══════════════════════════════════════════════════════════════╗
║              B22–B23 — Promotion & Audio/Visual Polish       ║
║                        (Amplifiers, independent)             ║
╚═══════════════════════════════════════════════════════════════╝


### Leftover, parked, orphaned ideas,..

- [ ] Auto-topup food & water at market to a chosen target quantity --> rejecte for now. maybe later when there is a menu & options
- [ ] Linked from the menu and from the New Game screen -> doesnt make sense. player never read user guide before stating to play and beingt stuck or having a question.
- [ ] Minor data balance: review port-per-faction distribution — Spanish ports are currently over-represented relative to the other four factions (DocTheYounger)
- [ ] Explore at-sea acquisition alternatives instead of always needing a port: rain-catching, fishing, whaling
- [ ] Core problem: patrols are confusing (multiple testers couldn't find the enemy) and hunts barely differ from generic combat missions. Explore: a guaranteed encounter after X days (rising chance), tied to a random sea point within the patrol zone; hunts requiring scouting or trail-following instead of a flat combat trigger. Decide whether to merge the two mission types or give each a genuinely distinct loop
- [ ] Explore letting a mission (the bounty hunt especially) stay tracked passively while the player does other things, instead of forcing dedicated back-and-forth travel just to keep it active (Ren). This is an architecture change — `state.activeMission` is currently singular — scope the change before committing to it.
- [ ] Make a PWA (needs to build the icons, and ensure layout still wokrs on phone with island, camera in screen, etc.)
- [ ] evaluate adding SVG illustration on event screen and on intercept screen (reuse ship for battle, for the rest..to inventorize to evaluate effort)
- [ ] evaluate adding a reminder of the ongoing mission somexhere on screen? (at least during market, crew; shipyard, maybe not during combat, nav and sailing. maybe a bottom hud like? or dismissable toast?)
- [ ] add the integration testing as part of the github actions?
- [ ] review and potentially restructure all "random encounter", the list of encounter type, encounters from random event and from mission to have something more lean and polyvalent (not patrol, navy_patrol and navy_patrol combat, where they all represent a navy patrol checking cargo, but pirate ambush during wrek random event is different yet defaults on.. patrol ?)



---

### B11 — Combat Depth Rework

**Goal**: four actions where the enemy picks broadside 70% of the time will feel repetitive over a long campaign, no matter how good the narrative log gets — and this was independently confirmed by petripeeduhpedro ("grappling pushed me away from combat"), Ren ("you just steamroll"), and the save audit (140 grapple wins, near-zero combat variety). Scope and direction informed by Wave 1.

#### B11.1 — Encounter architecture refactor (carried over from B1.4)
- [X] Apply the unified encounter/activeMission/battleState model already designed during the B1.3 discovery, before adding distance, AI variety, or a boarding minigame on top of the old per-type conditionals
- **Pillar**: Consequence (every new encounter type should be a data addition, not a code conditional)

#### B11.2 — Discovery: what role should combat play?
- [X] Primary activity vs. punishment for failed negotiation
- [X] How much depth vs. how much speed (1-minute fights vs. 5-minute fights)
- [X] Decision stacking vs. positional play
- [X] Cross-reference Wave 1 findings on combat fatigue

#### B11.3 — Discovery: wind & position
- [X] Should wind affect combat actions (favourable for chase, opposing for boarding)?
- [X] Distance bands (long / medium / boarding range), with a "close distance" / "open distance" action that makes fleeing easier at range and grappling easier up close?
- [X] A maneuver phase?

#### B11.4 — Implement combat depth changes
- [X] Apply the model chosen in B11.2/B11.3: distance system, revised enemy AI (situational, not flat weights)
- [X] **Post-boarding crew-fight phase**: grappling success no longer ends the fight outright. A boarding success still favours the larger crew, but resolves into a separate crew-combat roll/phase so a 80-vs-60 crew advantage is still an advantage, not an automatic, costless win (petripeeduhpedro, Ren, save audit all converge on this exact complaint)
- **Pillar**: Consequence

#### B11.5 — Enemy AI variety
- [X] Design complete (`tasks_NPCAI.md`).
- [ ] NPCs choose actions based on situation, not flat weights (low hull → grapple attempt, fast ship → evade, large crew → grapple)
- [ ] Each enemy type gets a "preferred doctrine" reflected in its choice weights

#### B11.6 — Combat log narrative depth pass
- [X] Leverage existing crew names/traits in the round-by-round log ("Maria refuses to load the cannons," "the cook screams when the deck is hit")
- [X] Connects combat to the crew attachment pillar
- **Pillar**: Consequence

#### B11.7 — Weapons & ammunition as a combat resource
- [0] Add weapons/ammunition as a consumable resource analogous to food/water, gating combat actions the way provisions gate morale (Ren's suggestion). Touches the market and hold the same way provisions do — if B8.2's provisions redesign has already shipped, model this consistently with whatever direction that took. --> REJECTED FOR NOW, TOO COMPLEX FOR WHAT IS ENVISONNED. ITS NOT A NAVAL BATTLE GAME.

#### B11.8 — Combat AI & Intercept UX

**Goal**: Complete the missing piece of B11 — make the AI use the distance/boarding mechanics intelligently, and make the intercept screen a rich, informative pre‑battle experience.

**State Transition**: From "combat mechanics are solid but AI is simple and intercept screen is generic" to "AI feels intentional and intercept screen gives the player meaningful information to act on."

**Tasks**:
- [ ] **Full NPC AI scoring**: Implement utility‑based AI from `tasks_NPCAI.md` (faction archetypes, risk, dynamic signals).
- [ ] **Intercept screen flavour**: Rich, contextual flavour text per encounter type/faction.
- [ ] **Intercept screen UX improvements**:
  - Show faction tag prominently.
  - Add qualitative risk read ("Low/Medium/High") — "the crew believes victory is likely."
- [ ] **Combat AI simulator**: Standalone tool to validate action distribution and balance across archetypes.
- [ ] **Optional**: SVG illustrations for intercept/event screens (faction‑specific or encounter‑type art).

**Measurement** (to validate B11 as the stable central tactical system):
- Action choice distribution (are players choosing intentionally, or is one action obviously best?)
- Combat duration
- Distance transitions
- Grapple/boarding frequency
- Surrender frequency
- Crew loss
- Flee rate
- Player understanding (qualitative)

---

### B10 — Starts Variety & Captain Identity Discovery

**Goal**: The five faction starts currently differ only in opening flavour text and a fixed rep adjustment. This block makes the player's captain identity explicit and evolutionary.

**State Transition**: From "faction is a starting flavour choice" to "faction is a meaningful identity that shapes gameplay and can evolve through the campaign."

**Design Intent**:
- The player should increasingly upgrade **who their captain is**, not just ship stats.
- The Letter of Marque system (already in the design doc) is the ideal mechanism for late-game identity transformation.
- The trait/bonus system should create **situations where choices feel different**, not just stat modifiers. The Greedy trait is a model: "mission success → demand → pay or refuse → trait revealed → upset → desertion risk."

**Scope**:
- Faction‑specific birth bonuses and drawbacks.
- Letter of Marque system (switch allegiance, stack bonuses).
- Early‑game identity expression through starting backstory and faction‑specific opening events.

**Out of Scope**:
- Full narrative branching (that's B20/B21).
- Dynamic faction reputation simulation (that's B19).

See dedicated task list.

---

### B12 — Voyage Decision Density (Sailing Enrichment) (🔲 Planned)

**Goal**: Make the voyage — the most‑repeated action — worth paying attention to. The problem is not event frequency; it's that normal sailing days lack decision density.

**State Transition**: From "sailing is mostly passive time with occasional interruptions" to "sailing is a continuous decision space where the player actively navigates opportunities and risks."

**Design Intent**:
- Frame this as **"How do we make sailing itself worth paying attention to?"** before "What new events should we add?"
- Focus on **decision density**, not encounter frequency.
- Quality over quantity — 1 good event every 8–12 days is better than 1 mediocre event every 2–3 days.
- The Change Course mechanic should evolve from route correction to route strategy.

**Tasks**:
- [ ] **Tactical route choices**: Do I take the risky shortcut? Do I push further or turn back?
- [ ] **Sightings as information**: "Smoke on the horizon" — investigate or ignore? Decision before commitment.
- [ ] **Crew‑initiated sailing events**: Arguments, sightings, morale moments that the player can respond to (not just passive logs).
- [ ] **Weather as trade‑off**: Weather should create trade‑offs (shortcut vs. safe route), not just modifiers.
- [ ] **At‑sea acquisition**: Fishing, rain‑catching, whaling — activities that give the player something to do during sailing.
- [ ] **Patrol/hunt mission differentiation**: Differentiate patrol (find/intercept) from combat (deliberate violence) experientially.
- [ ] **Do NOT increase random event frequency**. The current framework is approximately right.

**Out of Scope**:
- Full ship simulation (not that kind of game).
- Real‑time weather system (turn‑based game).

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

### B13 — Narrative Synthesis (Journal as Memory) (🔲 Planned)

**Goal**: 
- Transform the raw log from a mechanical record into a coherent narrative memory — the "novel you wrote by playing."
-  surface named crew members in routine events and elevate the raw log into something closer to a written account, now that the random event pool (B12) gives it richer material to work with. Pairs naturally with the existing Identity & Feedback pillar — could in principle ship at any point with no hard prerequisite, but lands here so Wave 2 can react to it alongside the combat and sailing changes.

**State Transition**: From "log is a record of what happened" to "journal is a curated, weighted memory of the voyage that the player wants to read."

**Design Intent**:
- The raw log should remain as the mechanical record. The journal is a **synthesis layer** on top.
- The journal should **filter and weight events** — a crew member gaining a day shouldn't have the same weight as a storm, major battle, or named crew loss.
- Avoid over‑narrating mechanical noise.

**Tasks**:
- [ ] **Role‑based log entries**: Identify all log‑generating moments where a crew member's *role* could be invoked (gunner, cook, carpenter, navigator, deckhand). Write 8‑15 template variants per role. Store in `data_text.js`. Inject into: `BATTLE_ACTION` (gunner), provision depletion (cook), arrival (navigator), storm hull damage (carpenter), `ENTER_PORT` (navigator).
- [ ] **Prose‑style daily summarisation**: On days with notable events, generate a paragraph summarising the day.
- [ ] **Weighting system**: Events have different narrative weights. A scar, a battle, a betrayal, a new port — these are high‑weight. Routine days are low‑weight or omitted.
- [ ] **Tie to crew state**: When a named crew member appears in the journal, link to their current state (scars, traits, days aboard).

**Design Note**: The journal should not narrate every +1 day aboard. It should narrate the moments that matter. The existing event/state system already has the categories to do this.


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

### B14 — Playtest Wave 2 + Telemetry Discovery (🔲 Planned)

**Goal**: Validate the combined effect of B10 (identity), B12 (sailing), and B13 (narrative) before investing in world events and crew depth.

#### B14.0 — Telemetry Discovery (prerequisite)
**Goal**: Decide where player data goes before defining metrics.

**The architectural question**: Broadside is a backend‑less, static, client‑only game. Before scoping metrics (tutorial completion, voyage duration, mission acceptance, etc.), the actual open question is *where does the data go* — a real backend, or an opt‑in local‑only stats view the player can see about themselves? That decision gates everything else.

**Tasks**:
- [ ] Discovery: backend vs. local‑only stats.
- [ ] If backend: choose a lightweight solution (e.g., Google Analytics 4, Plausible, or a custom JSON endpoint).
- [ ] If local‑only: design a "Captain's Stats" page that aggregates local save data.
- [ ] Define metrics: tutorial completion, mission acceptance/abandonment, voyage duration, combat outcomes, equipment usage, crew loss.

#### B14.1 — Recruit testers
- [ ] Mix of new testers and returning Wave 1 testers (returning testers can compare directly)

#### B14.2 — Define Wave 2 metrics
- [ ] Combat: action choice distribution, combat duration, distance transitions, grapple/boarding frequency, surrender frequency.
- [ ] Sailing: do players feel like they are *choosing intentionally* or just clicking "Advance Day"?
- [ ] Narrative: does the prose journal read as an improvement, or as noise?
- [ ] Identity: do players feel like their captain identity matters?
- [ ] What broke in the changes?

#### B14.3 — Synthesise findings
- [ ] Document what to keep, what to revisit
- [ ] Identify any architectural rot that needs a B1-style cleanup pass before B19

---

## Crew Systems Deepening (B15–B18)

Multiple testers reported having almost no interaction with their crew despite the game's named-crew identity ("I had zero crew interactions," "I rarely even checked on them" — Ren). The four blocks below are the direct answer: functional roles give crew members a reason to be looked at individually, and shore leave, councils, and articles give the crew a voice and a presence beyond combat and hiring screens.

Genre-inspiration notes worth keeping in mind while designing these (from a Reddit exchange about comparable tabletop/board games): a **crew unrest track**, **scurvy**, and **days of Revelry & Debauchery followed by a hangover** were all cited as mechanics the player found compelling in other Caribbean-themed games — useful flavour reference for B16 and B17 specifically, not a directive to copy them wholesale.

### B15 — Functional Crew Roles (🔲 Planned)

**Goal**: Promote crew roles from cosmetic to mechanical.

**State Transition**: From "roles are cosmetic labels" to "roles have one modest mechanical effect that makes hiring choices matter."

**Design Intent**:
- **One modest effect per role**, not a full RPG skill tree.
- Roles: Gunner → combat. Navigator → travel. Carpenter → repair. Cook → provisions. Deckhand → general.

**Design Note**: The Crew screen teaches the player "this person is a Gunner" without "being a Gunner means something." This is a broken promise that B15 closes.

- [ ] Discovery: what stat bonus per role — Gunner → combat, Navigator → travel days, Carpenter → repair cost, Cook → provision efficiency, etc.
- [ ] Discovery: when do bonuses unlock — immediately on hire, or tied to days-served the way seasoned/veteran/loyal tags already are?
- [ ] Implement the chosen bonuses
- [ ] Update role icon tooltips to reflect their new mechanical weight, not just flavour

**Note**: best sequenced after B11 (Combat Rework) settles the combat math, since a Gunner's bonus interacts with it directly.

### B16 — Shore Leave System (🔲 Planned)

**Goal**: convert port-time from "instant transactional space" to a place where named crew members live and small events occur. Give the player a meaningful duration choice on arrival.

**State Transition**: From "port is a menu hub" to "port is a location in the captain's story."

**Design Intent**:
- Shore leave is the bridge between "I know this guy" and "I care about this guy."
- Shore leave creates situations where crew members reveal themselves.
- Events during shore leave should express who the crew are, not just hand out resources.

**Out of Scope**:
- Full simulation of every crew member's activities.
- Complex mini‑games for shore leave activities.

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

### B17 — Crew Council System (🔲 Planned)

**Goal**: a periodic, gated mechanism for the crew to weigh in on the captain's decisions. Historically grounded in pirate-era democracy. Outputs range from narrative observation to demands the player must respond to. The defining mechanic of "crew are people who run this ship with you."

**State Transition**: From "crew is a resource to manage" to "crew has opinions and agency that the captain must reckon with."

**Design Intent**:
- The council should make the player *feel* that the crew has opinions, not just be a stat check.
- The ideal crew progression is: Unknown sailor → "I know this guy" → "They have a quirk" → "We survived something together" → "They have a history" → "They care about this ship" → "I don't want to lose them." The current systems do steps 1–4. B15–B17 should accomplish 5–7.

**Phases**:
1. Narrative output only (observations).
2. Meaningful choices (agree/disagree/defer).
3. Requests and quest hooks (crew demands, personal quests).

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

### B18 — Pirate Articles System (🔲 Planned)

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

### B19 — World Events & Living Caribbean (🔲 Planned)

**Goal**: 
- the world acts on its own, not just in reaction to the player. Trade and exploration get a dynamic backdrop, and player actions visibly shift the economy and faction balance.
- the world has its own momentum — events happen that the player didn't cause, but that change what they should do. This is distinct from B19's discrete world events; this is about **persistent, slow‑moving change**.


**State Transition**: From "the Caribbean is a static backdrop" to "the Caribbean reacts to forces larger than the player."

**Design Intent**:
- **Discrete events** that change the world for a period and then resolve.
- Events should **express identity**, not just hand out resources. The merchant distress event (help/exploit/ignore) is a model — it affects crew morale, reputation, and captain identity, not just gold.
- **Quality over quantity.** 1 good event every 8–12 days is better than 1 mediocre event every 2–3 days.

**Scope**:
- Parametric world events: war, embargo, plague, treasure fleet, pirate crackdown.
- Event effects: price modifiers, mission weight shifts, patrol frequency changes, gossip.
- Player‑influenced resolution: completing missions shortens events, delivering supplies helps.
- Faction tension, shifting trade routes, governor changes as *event outcomes* (not continuous simulation).

**Explicitly Out of Scope**:
- Continuous real‑time simulation of the entire Caribbean economy (the game is turn‑based and event‑driven).
- Seasonal rhythms / hurricane season (parked — too complex for B19, could be future).

#### B19.1 — Discovery: world event types & cadence
- [ ] Famines, harvest fails, blockades, faction wars, naval supremacy shifts
- [ ] How frequently do they fire? How visible to the player (gossip, headlines, in-game news)?
- [ ] How long do they last? Can the player interact with them?
- [ ] Discovery: what systems to simulate — shifting trade routes, governor replacements, epidemics, seasonal rhythms?
- [ ] Discovery: how much simulation is visible to the player vs. background mechanics?
- [ ] Discovery: trade route shifts (prices slowly change over time based on simulated supply/demand).
- [ ] Discovery: governor replacements (faction leadership changes, altering mission availability and reputation modifiers).
- [ ] Discovery: epidemics (ports become quarantined, services blocked, provisions scarce).
- [ ] Discovery: seasonal rhythms (hurricane season, trade winds, monsoon — affect routes and risk).

#### B19.2 — Implement world event system (placeholder)
- [ ] Apply chosen model from B19.1

#### B19.3 — Discovery: economy dynamism mechanics
- [ ] Do prices react to world events?
- [ ] Does player heavy-trading nudge prices? For how long? Per port or regional?
- [ ] Does port defence strength shift with faction wars, raiding pressure, or heavy trading — making the world feel like it's reacting to the player's specific pattern of play, not just a static backdrop?
- [ ] (Player-impact economics is hard; world events give 80% of the feel for 20% of the work)

#### B19.4 — Implement economy dynamics (placeholder)
- [ ] Apply chosen model from B19.3, including dynamic port defence and trade prices
- [ ] Balance pass: ensure simulation doesn't overwhelm the player or make the world feel unpredictable in a frustrating way.

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

### B20 — Hidden Ports & Story Arc (🔲 Planned)

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

### B21 — Endgame & Legacy (🔲 Planned)

**Goal**: the career has a shape with a beginning, middle, and end. Player can choose to retire, or accept that their career ended on its own terms.

**Design Intent**:
- **Late‑game must feel different from early‑game.** B21 should not just be "bigger numbers."
- The progression should be: start faction → early ship/crew style → learn preferred play pattern → build around it → eventually change allegiance → combine identities. B10 is the seed; B21 is the harvest.
- "Captain legacy across campaigns" — a retired captain appearing as a rumour/reference in your next playthrough. This is the perfect capstone.

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
- [X] Page with screenshots, description, tags
- [X] Use screenshots generated via screenshots_builder.html

#### B22.2 — GitHub Pages deployment verified
- [X] Confirm play link works on first visit, no localStorage prompts

#### B22.3 — README badges and play link prominence
- [X] License, play link, build status (if applicable)

#### B22.4 — Contributor onboarding
- [ ] CONTRIBUTING.md with how to run, how to test, file responsibility map (carried over from B0.2)
- [ ] Three-pillar test documented as a checklist for proposed features (carried over from B0.2)
- [ ] Triage open work into labelled GitHub Issues, including good-first-issue labels
- [ ] Pin a discussion or write a short blog post inviting contributors

---

### B23 — Audio & Visual Polish

**Goal**: sensory layer that reinforces the systems underneath. Done last because sound and animation are amplifiers of working systems, not substitutes.
**Amplifiers, not structural fixes.** These should be done last because sound and animation are amplifiers of working systems, not substitutes.


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

### B5 — Critical Bug & Exploit Fixes (✅ DONE)
- **Grapple exploit closed**: boarding now costs crew proportional to crew ratio; no more bloodless victories.
- **Patrol mission duplication fixed**: `COMPLETE_MISSION` can no longer re‑award a completed patrol.
- **Same‑port mission chaining blocked**: you must sail away and return before accepting another combat/patrol mission in the same port.
- **Starvation now kills crew**: after 14 days no food or 3 days no water, crew members die (not just morale penalties).
- **Desertion at sea**: upset crew can now desert mid‑voyage when morale is low, not only at port.
- **Storm scar subset**: only 20‑40% of survivors receive `scar_storm`, making the tag meaningful again.
- **`longestCrewTenure` fixed**: now correctly tracks the longest‑serving crew member, both current and departed.
- **Equipment‑boosted hull unlocks remote ports**: `canReach` now reads effective hull from `L.getShipStats`.
- **Crew cap enforced**: shipwreck‑rescue events can no longer exceed ship `maxCrew`.
- **Map touch/scroll fixed**: wheel and pinch gestures no longer scroll the page underneath.
- **Market quantity input stable**: layout no longer shifts on click, preventing mis‑clicks.
- **Tutorial safety net**: abandoning the starter mission now advances onboarding instead of soft‑locking.
- **Economy scaling**: port market stock quantities now scale with fame tier and hold capacity.

---

### B7 — Player Menu, Reference & Community Links (✅ DONE)
- **Menu modal** added (accessible from Port screen): Resume, Save, Load, Export, Import, Back to Title, Auto‑save toggle.
- **Captain's Handbook**: static in‑game reference covering all stats, status effects, faction mechanics, and hidden rules.
- **Feedback form**: integrated form with auto‑filled metadata (OS, browser, URL, playtime, optional save attachment).
- **Community links**: GitHub repo, itch.io page, and Ko‑fi donation link surfaced in the menu.
- **Changelog viewer**: displays `docs/changelog.md` directly in the menu modal.

---

### B8 — Economy & Mission Design Discovery (✅ DONE)
- **Stable, learnable trade routes**: prices are now driven by `AVAILABILITY_PRICE_MODIFIERS` (tier‑based) and `FACTION_PRICE_MODIFIERS` (faction production bonuses), with low random variance. Each port has a consistent price identity, not pure noise.
- **Trade missions**: target ports now guarantee the required good is **in demand** there, ensuring the trade itself is profitable on top of the mission reward.
- **Smuggle missions**: target ports now guarantee the illegal good is **scarce** there (`"rarely"` or `"never"`), and the enemy faction matches the target port's faction for consistent reputation impact.
- **Market flavour**: atmospheric lines on the Market screen reflect gold tier, hold fullness, extreme prices, rare goods, fame/infamy, and port faction.
- **Repair cost scaling**: now scales with ship max hull and includes equipment penalties (e.g., Copper Plating's +40% repair cost).
- **Surrender consequences explicitly logged**: players now see exactly what they lost (gold, cargo, days, morale).

---

### B9 — Player Trust & Resilience (✅ DONE)
- **Unrecoverable state detection**: `isUnrecoverable` checks for 0 hull + insufficient gold/cargo to repair, or 0 crew on a non‑dinghy.
- **Minimum crew to sail**: non‑dinghy ships require at least 10% of max crew to sail (enforced in `SAIL_TO`).
- **Game Over screen**: dedicated, non‑dismissible screen with career summary (days, gold, ports, crew lost, etc.) and options to load last save or return to main menu.
- **Defeat recovery**: wash‑ashore‑after‑defeat now leaves minimum viable resources, or routes to game over if unrecoverable.
- **Action gating**: `SAIL_TO` and `TAKE_MISSION` (combat types) are blocked when hull is 0 or crew is below minimum.
- **Career stats tracking**: `engine_career.js` middleware tracks gold earned/spent, battles, crew loss by cause, ports visited, ships owned, storms survived, contraband seized, and detailed mission/combat logs.

---

### B11 — Combat Depth Rework (✅ DONE)
- **Encounter session architecture**: unified `encounterSession` replaces the old `encounterContext` + `battleState` split (B1.4).
- **Distance bands**: Far, Medium, and Close with `Close Distance` / `Open Distance` actions.
- **Damage multipliers by distance**: Broadside (0.6× at Far, 1.0× at Medium, 0.9× at Close); Precision (1.1× at Far, 1.0× at Medium, 0.7× at Close).
- **Grapple rework**: no longer instant victory; requires **Close** range and leads to a **boarding phase**.
- **Boarding phase**: Continue Fighting, Fall Back, Demand Surrender, Surrender. Uses crew × morale effectiveness ratio (`getBoardingRatio`).
- **Advantage Bar**: visual split bar showing player vs enemy boarding advantage percentage, now using the same calculation as the resolver.
- **NPC AI stubs**: `getNPCNavalAction` and `getNPCBoardingAction` now use scoring‑based logic (full utility AI is a separate task list).
- **Combat log templates**: narrative log entries for all actions (broadside, precision, grapple, evade, boarding outcomes).
- **Zero‑crew grapple guard**: Grapple button is disabled when player crew is 0, with a clear tooltip.
- **B11 integration**: fully wired into `engine_battle.js` and `engine_encounter.js`; battle screen shows proportional ship sprites, distance indicator, and boarding phase UI.


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