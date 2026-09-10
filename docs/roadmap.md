# Broadside : Development Roadmap

## Long‑term Vision

Broadside should feel like **reading a novel you wrote by playing it**. The Captain's Journal, crew biographies, and gossip system are the foundation of that vision.

The game should turn **state changes into situations**, and **situations into stories**. Every mechanical outcome should be legible as a narrative event, and every narrative event should have mechanical weight. The Journal is not a log : it is the player's memory of their career. Every mechanical system should feed back into the narrative layer : creating stories that are unique to each playthrough, told in the player's own words through their choices.

The game is complete when a player can finish a run, read their journal from start to finish, and say: **"That was my story."**

---


## Phase Sequence at a Glance


| Block | Theme | Status |
|---|---|---|
| **T1-T6** | First game loop and screens versions. | ✅ DONE |
| **B0–B4** | Foundation fixes, architecture revamp, onboarding, Playtest Wave 1 | ✅ DONE |
| **B5** | Critical bug & exploit fixes | ✅ DONE |
| **B6** | Quick wins & quality of life | ✅ DONE |
| **B7** | Player menu, reference & community links | ✅ DONE |
| **B8** | Economy & mission design discovery | ✅ DONE |
| **B9** | Player trust & resilience | ✅ DONE |
| **B11** | Combat depth rework | ✅ DONE|
| **B10** | Starts variety & port identity | ✅ DONE |
| **B12** | Sailing enrichment | ✅ DONE |
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



### Leftover, parked, orphaned ideas,..

- [ ] Linked from the menu and from the New Game screen -> doesnt make sense. player never read user guide before stating to play and beingt stuck or having a question.
- [ ] Core problem: patrols are confusing (multiple testers couldn't find the enemy) and hunts barely differ from generic combat missions. Explore: a guaranteed encounter after X days (rising chance), tied to a random sea point within the patrol zone; hunts requiring scouting or trail-following instead of a flat combat trigger. Decide whether to merge the two mission types or give each a genuinely distinct loop
- [ ] evaluate adding a reminder of the ongoing mission somexhere on screen? (at least during market, crew; shipyard, maybe not during combat, nav and sailing. maybe a bottom hud like? or dismissable toast?)
- [ ] add the integration testing as part of the github actions?



---

### B13 : Narrative Synthesis (Journal as Memory) (🔲 Planned)


- Transform the raw log from a mechanical record into a coherent narrative memory : the "novel you wrote by playing."
-  surface named crew members in routine events and elevate the raw log into something closer to a written account, now that the random event pool (B12) gives it richer material to work with. Pairs naturally with the existing Identity & Feedback pillar : could in principle ship at any point with no hard prerequisite, but lands here so Wave 2 can react to it alongside the combat and sailing changes.
- The raw log should remain as the mechanical record. The journal is a **synthesis layer** on top.
- The journal should **filter and weight events** : a crew member gaining a day shouldn't have the same weight as a storm, major battle, or named crew loss.
- Avoid over‑narrating mechanical noise.

#### B13.1 : Role-based log entries
- [ ] Identify all log-generating moments where a crew member's *role* could plausibly be invoked: combat shots, food/water depletion, storms, voyage events, repair moments, scouting/arrivals
- [ ] Write 8-15 template variants per role (gunner, cook, carpenter, navigator, deckhand) for each applicable moment
- [ ] Templates use the `{name}`, `{role}`, `{daysAboard}` slots the bio generator already uses, for consistency
- [ ] Store in `data_text.js` alongside existing log templates
- [ ] Helper `pickCrewMemberByRole(state, role)` and `formatNamedLogLine(template, member)` in `generators.js`, with a frequency cap (roughly 1-in-3 chance of naming someone, otherwise generic) and a dedupe check so the same crew member isn't named twice in close succession
- [ ] Inject into: `BATTLE_ACTION` (gunner), provision depletion (cook), arrival proximity (navigator), storm hull damage and `REPAIR` (carpenter), `ENTER_PORT` (navigator)
- [ ] Test pass: verify named crew appear across at least 5 event types, no errors when a role isn't represented in the crew

#### B13.2 : Prose-style daily journal summarisation
- [ ] On days with notable events, generate a paragraph or two of prose summarising the day, rather than a flat list of log lines : aiming for a tone closer to a written journal than a game log (the explicit reference point is the Baldur's Gate journal style)
- [ ] Decide where this lives: a rewrite of existing log entries, or an additional "journal" rendering layer that reads the same underlying log/career data without replacing the raw log
- [ ] This is the most direct expression of the project's long-term vision (see below) : worth treating as a flagship feature, not an afterthought

---

### B14 : Playtest Wave 2 + Telemetry Discovery (🔲 Planned)


#### B14.0 : Telemetry Discovery 
**Goal**: Decide where player data goes before defining metrics.

**The architectural question**: Broadside is a backend‑less, static, client‑only game. Before scoping metrics (tutorial completion, voyage duration, mission acceptance, etc.), the actual open question is *where does the data go* : a real backend, or an opt‑in local‑only stats view the player can see about themselves? That decision gates everything else.

**Tasks**:
- [ ] Discovery: backend vs. local‑only stats.
- [ ] If backend: choose a lightweight solution (e.g., Google Analytics 4, Plausible, or a custom JSON endpoint).
- [ ] If local‑only: design a "Captain's Stats" page that aggregates local save data.
- [ ] Define metrics: tutorial completion, mission acceptance/abandonment, voyage duration, combat outcomes, equipment usage, crew loss.

#### B14.1 : Wave 2 playtest
- [ ] Mix of new testers and returning Wave 1 testers (returning testers can compare directly)
- [ ] Combat: action choice distribution, combat duration, distance transitions, grapple/boarding frequency, surrender frequency.
- [ ] Sailing: do players feel like they are *choosing intentionally* or just clicking "Advance Day"?
- [ ] Narrative: does the prose journal read as an improvement, or as noise?
- [ ] Identity: do players feel like faction identity matters (captain and port)?
- [ ] What broke in the changes?


---


### B15 : Functional Crew Roles (🔲 Planned)

**Goal**: Promote crew roles from cosmetic to mechanical.  From "roles are cosmetic labels" to "roles have one modest mechanical effect that makes hiring choices matter."The Crew screen teaches the player "this person is a Gunner" without "being a Gunner means something."  **One modest effect per role**, not a full RPG skill tree.  

- [ ] Discovery: what stat bonus per role : Gunner → combat, Navigator → travel days, Carpenter → repair cost, Cook → provision efficiency, etc.
- [ ] Discovery: when do bonuses unlock : immediately on hire, or tied to days-served the way seasoned/veteran/loyal tags already are?
- [ ] Implement the chosen bonuses
- [ ] Update role icon tooltips to reflect their new mechanical weight, not just flavour



### B16 : Shore Leave System (🔲 Planned)

- **Goal**: convert port-time from "port is a menu hub" to a place where named crew members live and small events occur. Give the player a meaningful duration choice on arrival.
- Shore leave is the bridge between "I know this guy" and "I care about this guy."
- Shore leave creates situations where crew members reveal themselves.
- Events during shore leave should express who the crew are, not just hand out resources.

**Out of Scope**:
- Full simulation of every crew member's activities.
- Complex mini‑games for shore leave activities.


#### B16.1 : Discovery: shore leave mechanics
- [ ] Decide: is shore leave a *duration choice* on arrival, or a *separate action* at port?
- [ ] Decide: what's the morale recovery rate per day on leave vs. the current "Buy Drinks" gold cost?
- [ ] Decide: do wages accrue normally during shore leave, or at a reduced rate, or not at all?
- [ ] Decide: does the player choose total duration upfront, or extend day-by-day?
- [ ] Decide: what's the trigger frequency for crew events during leave? (One roll per day? Tiered by member traits?)
- [ ] Decide: do harbour-side events affect things outside the crew (port reputation, gold, gossip pool)?
- [ ] Decide: can shore leave be force-shortened if an emergency happens (faction war declared, mission urgency)?

#### B16.2 : Implement: duration UI and core loop
- [ ] Add a "Shore Leave" panel/screen accessed from the port screen
- [ ] Duration selector or day-by-day extension button
- [ ] Per-day cost calculation (wages, possibly minus a discount)
- [ ] Per-day morale recovery applied to crew
- [ ] Port reputation/gossip refresh during/after leave

#### B16.3 : Implement: event pool
- [ ] New event type `port_event` (separate from `RANDOM_EVENTS` for sea)
- [ ] Event generator that picks events based on the named crew aboard, the port faction, and ongoing world state (heat, infamy, etc.)
- [ ] Event resolution: dispatch through the same `RESOLVE_EVENT` flow or a parallel one (decide in B16.1)

#### B16.4 : Writing: 20-30 port event templates
- [ ] Cost events: tavern brawls, jail fines, lost crew (passed out and missed roll-call)
- [ ] Benefit events: map fragments overheard, gossip leads, found goods, recruited skilled crew
- [ ] Trait-revealing events: drunkard caught red-handed, coward backs out of a barfight, greedy fights over their share
- [ ] Faction-flavour events: Spanish religious processions if Spanish crew, French market festivals, etc.
- [ ] Possible: events that consume specific cargo for benefits ("trade rum for tavern story leads")

#### B16.5 : Integration with existing systems
- [ ] Shore leave should NOT trigger random sea events (different event pool)
- [ ] Shore leave SHOULD trigger faction heat decay normally
- [ ] Shore leave SHOULD trigger reputation decay normally
- [ ] Shore leave should respect tutorial onboarding (no shore leave events during the QM phase, or suppress until the first contract is complete)
- [ ] Mid-leave emergencies (e.g. a heat spike, a world event) might shorten leave

#### B16.6 : Test pass
- [ ] Full playthrough with shore leave at multiple ports
- [ ] Verify cost/morale balance feels right
- [ ] Verify event frequency feels right (~1 per 2-3 days?)
- [ ] Verify named crew appear in events


### B17 : Crew Council System (🔲 Planned)

-**Goal**: a periodic, gated mechanism for the crew to weigh in on the captain's decisions. Historically grounded in pirate-era democracy. Outputs range from narrative observation to demands the player must respond to. The defining mechanic of "crew are people who run this ship with you."
- The council should make the player *feel* that the crew has opinions, not just be a stat check.
- The ideal crew progression is: Unknown sailor → "I know this guy" → "They have a quirk" → "We survived something together" → "They have a history" → "They care about this ship" → "I don't want to lose them." The current systems do steps 1–4. B15–B17 should accomplish 5–7.

**Phases**:
1. Narrative output only (observations).
2. Meaningful choices (agree/disagree/defer).
3. Requests and quest hooks (crew demands, personal quests).
Dependency with B20 ? to be confirmed.


#### B17.1 : Discovery: council mechanics
- [ ] **Trigger conditions**: time-based (every N days at sea), fame-based (each tier unlock), event-based (after major incidents), player-initiated (button, but rate-limited)? Probably a combination.
- [ ] **Frequency caps**: minimum days between councils to prevent spam (e.g. 30 days)
- [ ] **Convening cost**: does calling a council cost morale/gold/time? Is there a cost to *not* calling one occasionally?
- [ ] **Outputs structure**: pure observation? observation + advice? advice + demand?
- [ ] **Data sources**: which career stats does the council read? Which crew composition data? Which event history?
- [ ] **Failure modes**: what if the council's content is repetitive? What if the player ignores it?

#### B17.2 : Implement: career stats data layer
- [ ] Verify B2.3 data is accessible from the council generator
- [ ] If gaps exist (specific stats the council needs that B2.3 doesn't track), add them as a prerequisite task

#### B17.3 : Phase 1: narrative output only
- [ ] UI for the council screen : list of named crew speaking, each with a short observation
- [ ] Generator picks 3-5 crew members based on relevance (faction alignment to recent actions, role to recent events, traits)
- [ ] Each speaker says one thing drawn from a template pool
- [ ] At end of council: morale shift based on whether speakers' concerns align with the captain's recent actions
- [ ] **Templates needed**: 30-40 observation templates covering all major career-stat conditions (heavy combat, heavy trade, faction bias, contraband, neglected crew, etc.)
- [ ] No player choices yet : player closes council, gets the morale outcome, moves on

#### B17.4 : Phase 2: meaningful choices
- [ ] At end of observation phase, present 2-4 player choices: "Agree with crew" / "Disagree" / "Acknowledge but defer" / etc.
- [ ] Each choice has direct consequences: morale change, reputation shift, faction heat, internal upset/loyal tagging
- [ ] **Templates needed**: choice text + consequence definitions for each council scenario
- [ ] UI updates: choice buttons under each speaker, or a single resolution choice at the bottom

#### B17.5 : Phase 3: requests and quest hooks
- [ ] Some council outcomes generate **crew requests**: "We want shore leave in Tortuga" / "We want a share of next prize" / "We want to sail to a specific port"
- [ ] Player can accept (cost) or refuse (morale cost)
- [ ] Some council outcomes generate **personal quests**: a specific named crew member gets a quest hook ("Maria wants to find her uncle's ship near Trinidad")
- [ ] Quest hooks live as a new mission type or as story flags

#### B17.6 : Phase 4: council convening UX
- [ ] Add a "Convene Council" button accessible from the Crew screen
- [ ] Show next-available date based on cooldown
- [ ] Optional: auto-convene at significant career milestones (first 100 days at sea, first 100 ships defeated, etc.)
- [ ] Council history visible in the Journal under a new "Councils" tab

#### B17.7 : Test pass
- [ ] Trigger councils in various game states to verify content is contextually relevant
- [ ] Verify the player isn't getting the same observation twice in close succession
- [ ] Verify quest hooks generate sensible missions
- [ ] Balance test: are players actually using councils, or ignoring them?


### B18 : Pirate Articles System (🔲 Planned)

- A small set of player-editable ship's articles (rules) that affect gameplay. The articles can be amended through crew council outcomes, giving the council a tangible mechanism for crew influence on the ship's direction. Disguises some gameplay settings (difficulty modifiers, share splits, behavioural tendencies) as in-world contracts.
- Hard prerequisite: B17 (Crew Counsil) must exist for articles to be amendable through it.
- Static articles set at game start (Phase 1), then dynamic amendment via council (Phase 2).

#### B18.1 : Discovery: articles design
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

#### B18.2 : Implement: static articles at game start
- [ ] New screen: "Ship's Articles" accessible from Crew screen or Status screen
- [ ] Visual: looks like a parchment contract, not a settings menu
- [ ] Articles displayed as checkboxes / radio buttons / sliders dressed up as period-appropriate rules
- [ ] At game start: articles are set by faction default, locked from player edit (Phase 1)
- [ ] Each article displays its gameplay effect inline ("Captain takes 30% → +20% personal gold gain, -10 crew morale on prize")

#### B18.3 : Implement: article effects on gameplay
- [ ] Each article toggle reads/affects relevant state
  - Share split affects gold distribution in `COMPLETE_MISSION` and plunder
  - Combat preference affects encounter generation (or just mission availability)
  - Punishment severity affects mutiny/desertion probabilities
- [ ] Effects must be balanced so no single article is dominant or trivial
- [ ] Balance pass: economy simulator (tests/sim.html) updated to model article effects

#### B18.4 : Phase 2: dynamic amendment via council
- [ ] Crew council outcomes can propose article amendments (B17 Phase 3 request mechanism)
- [ ] Player can accept (article changes, crew morale +) or refuse (no change, possible upset/desertion)
- [ ] Some amendments require council vote : multiple crew members must agree before the player can ratify
- [ ] Failed ratification creates crew upset
- [ ] Player can also propose amendments themselves (with crew approval check, gated by morale)

#### B18.5 : Phase 3: world-event amendment hooks
- [ ] Some world events propose article changes ("After repeated mutinies, the crew demands stricter punishment articles")
- [ ] Some story events lock or unlock article options ("After reaching Libertalia, you may add the 'Equal Shares for All' article")
- [ ] Articles become part of the player's identity that the world reacts to ("This captain is known for fair shares" → reputation shift)

#### B18.6 : UI polish: parchment aesthetic
- [ ] Articles screen should look in-period : parchment background, gold ink, signatures
- [ ] Each amendment is added as an addendum, dated to the day it was made
- [ ] Full articles document persists as part of the save and shows up in the Journal under a new "Articles" tab

#### B18.7 : Test pass
- [ ] Articles work mechanically across all faction starts
- [ ] Council amendments flow correctly
- [ ] Effects balance out (no broken combinations)
- [ ] Visual feels period-appropriate, not modern-UI

**Pillar**: Freedom (the player shapes the kind of captain they are through real rules, not menu settings) + Consequence (rules have visible mechanical and social effects)

---

### B19 : World Events & Living Caribbean (🔲 Planned)

- the world acts on its own, not just in reaction to the player. Trade and exploration get a dynamic backdrop, and player actions visibly shift the economy and faction balance.
- the world has its own momentum : events happen that the player didn't cause, but that change what they should do. This is distinct from B19's discrete world events; this is about **persistent, slow‑moving change**.

#### B19.1 : Discovery: world event types & cadence
- [ ] Famines, harvest fails, blockades, faction wars, naval supremacy shifts, embargo, plague, pirate crackdown,.. ?
- [ ] What can be the effects?  price modifiers, mission weight shifts, patrol frequency changes, gossip, ..?
- [ ] How frequently do they fire? How visible to the player (gossip, headlines, in-game news)?
- [ ] How long do they last? Can the player interact with them (resolve them, make them shorter, longer, better, worse?)
- [ ] Discovery: what systems to simulate : shifting trade routes, governor replacements, epidemics, seasonal rhythms?
- [ ] Discovery: how much simulation is visible to the player vs. background mechanics?
- [ ] Discovery: trade route shifts (prices slowly change over time based on simulated supply/demand).
- [ ] Discovery: governor replacements (faction leadership changes, altering mission availability and reputation modifiers).
- [ ] Discovery: epidemics (ports become quarantined, services blocked, provisions scarce).
- [ ] Discovery: seasonal rhythms (hurricane season, trade winds, monsoon : affect routes and risk).

#### B19.2 : Implement world event system (placeholder)
- [ ] Apply chosen model from B19.1

#### B19.3 : Discovery: economy dynamism mechanics
- [ ] Do prices react to world events?
- [ ] Does player heavy-trading nudge prices? For how long? Per port or regional?
- [ ] Does port defence strength shift with faction wars, raiding pressure, or heavy trading : making the world feel like it's reacting to the player's specific pattern of play, not just a static backdrop?
- [ ] (Player-impact economics is hard; world events give 80% of the feel for 20% of the work)

#### B19.4 : Implement economy dynamics (placeholder)
- [ ] Apply chosen model from B19.3, including dynamic port defence and trade prices
- [ ] Balance pass: ensure simulation doesn't overwhelm the player or make the world feel unpredictable in a frustrating way.

#### B19.5 : Named rival captains & escalation
- [ ] Named rival captain(s) who appear, escalate, and must eventually be confronted
- [ ] Bounty hunter encounters that scale with infamy
- [ ] Governor missions: high-rep faction offers a multi-part quest chain (e.g. "clear the pirate nest at Roatán")

#### B19.6 : Mid-game content
- [ ] Story beats at fame thresholds (50, 100, 200, others?) : the world acknowledges your rise
- [ ] Crew loyalty events: long-serving crew members initiate conversations, requests, or betrayals
- [ ] Port-specific quest lines: unique missions available only at certain ports after reputation thresholds
- [ ] Equipment quest: a legendary item that requires a multi-step quest to obtain ?

---

### B20 : Hidden Ports & Story Arc (🔲 Planned)

hidden ports currently feel like "more ports." Give each one a reason to exist and tie them to the endgame arc.

#### B20.1 : Discovery: what's the main story arc?
- [ ] Does the campaign have a shape? Rising action? Climactic confrontation?
- [ ] Player-defined milestones (fame ladder, infamy ladder, gold target)?
- [ ] How do the four starting factions intersect with the arc?

#### B20.2 : Implement story arc framework (placeholder)
- [ ] Apply model chosen in B20.1

#### B20.3 : Discovery: unique mechanic per hidden port
- [ ] Roatán, Dry Tortugas, Las Aves, Libertalia each get a reason to matter beyond services
- [ ] Each could anchor a piece of the story arc

#### B20.4 : Implement hidden port mechanics (placeholder)
- [ ] Apply per-port chosen mechanics from B20.3

#### B20.5 : Discovery: Libertalia as endgame anchor
- [ ] Does discovering it change the game? Unlock retirement? Trigger faction-level events?
- [ ] Is it a place, an idea, or a faction?

#### B20.6 : Implement Libertalia endgame role (placeholder)
- [ ] Apply chosen model from B20.5

---

### B21 : Endgame & Legacy (🔲 Planned)

the career has a shape with a beginning, middle, and end. Player can choose to retire, or accept that their career ended on its own terms. Late‑game must feel different from early‑game.

#### B21.1 : Victory conditions
- [ ] **Three victory tracks**: Fame, Infamy, and wealth.. or end of story arc?
- [ ] Additional optional paths: retire with X gold, discover all hidden ports, complete a final quest chain
- [ ] Multiple paths so different playstyles have a finish line
- [ ] The progression should be: start faction → early ship/crew style → learn preferred play pattern → build around it → eventually change allegiance → combine identities. 

#### B21.2 : Retirement screen
- [ ] Career summary with stats
- [ ] Notable events, crew roster at retirement, ships owned
- [ ] Readable story-format of the Journal
een

#### B21.3 : "One more thing" hook
- [ ] After retirement, option to continue sailing or start a new game with a legacy bonus ?
- [ ] "Captain legacy across campaigns" : a retired captain appearing as a rumour/reference in your next playthrough. This is the perfect capstone.

#### B21.4 : Difficulty settings
- [ ] Forgiving / Standard / Ruthless
- [ ] Affects initial resources, enemy scaling, event frequency, softlock detection thresholds

#### B21.5 : Polish the Game over screen ?
- [ ] If softlock detection has been driving the player to a career end screen, make sure it integrates cleanly with the retirement flow


---

### B23 : Audio & Visual Polish


#### B23.1 : Sound design
- [ ] Ambient port sounds (seagulls, waves, crowd murmur)
- [ ] Sailing ambient (wind, creaking hull, waves)
- [ ] Combat sounds (cannon fire, wood cracking, crew shouts)
- [ ] UI sounds (button click, gold clink, mission accept)
- [ ] Music: atmospheric sea shanty / period-appropriate background

#### B23.2 : Animation & visual effects
- [ ] Ship movement animation on map
- [ ] Combat round animations (cannon flash, hull impact)
- [ ] Port arrival transition
- [ ] Weather effects on sailing screen (rain, storm clouds, calm shimmer)

#### B23.3 : Small atmospheric details
- [ ] Small visual flourishes on the sailing/port screens : a bird flying, a parrot or palm tree at harbour, similar low-cost details that add a lot to the sense of place


---


## Parked Concepts

Ideas captured but not scheduled. May be promoted to a block if they pass the three-pillar test.

- **Swipe gestures for tab navigation** (market, shipyard, journal): low priority while touch + buttons work well
- **Crew relationships**: friendship/rivalry pairs that affect morale and combat
- **Port investment**: spend gold to build infrastructure at a port, improving services over time
- **Fleet command**: own multiple ships, assign crew, run trade routes automatically
- **Seasonal weather patterns**: hurricane season, trade winds, monsoon afecting affect routes and risk
- **Historical events**: real 1695 events (e.g., Henry Every's trial) appear as news, affect the world
- **Pirate republic**: if player controls multiple pirate ports, trigger a faction-level event
- **Crew skill system**: individual crew members gain XP in their role, affecting ship performance (note: overlaps with B15's Functional Crew Roles : revisit once B15 ships to see if this is still a distinct idea or already covered)