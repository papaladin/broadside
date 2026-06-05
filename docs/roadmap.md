# Broadside — Development Roadmap

> Last updated: June 5, 2026

---

## Current Playable State

Broadside is fully playable with rich narrative systems:

- **5 starting scenarios** with unique characters, factions, backstories, and opening missions
- **25 ports** across the Caribbean (16 standard, 5 remote, 4 hidden)
- **11 ship types** across 5 tiers (Dinghy → Ship of the Line)
- **5 upgrades** installable at select ports
- **6 mission types**: escort, patrol, combat, trade, smuggle, assault — procedurally generated, fame-tier scaled
- **Turn-based combat** with 4 actions (broadside, precision, grapple, evade) + plunder screen
- **Encounter system** with data-driven options (fight, flee, parley, bribe, surrender, inspect)
- **Dynamic market economy** with 14 tradeable resources, per-port availability, buy/sell/black market
- **Faction heat system** — short-term regional danger from aggressive actions, decays over time
- **Port gossip generator** — atmospheric text based on heat, reputation, fame, infamy, contraband, market prices, hidden port hints
- **Crew loyalty system** — faction alignment morale modifier, upset/desertion mechanics, named crew consequences
- **Crew traits** — hidden traits (drunkard, coward, greedy, troublemaker) revealed through gameplay, scars earned from events, positive progression (seasoned → veteran → loyal)
- **Generated crew biographies** — role/faction/days/scars/traits combined into readable character descriptions
- **Reputation system** per port (5 tiers: At War → Allied), affects services, prices, and missions
- **Fame & infamy** progression gating ships, missions, upgrades, and hidden port discovery
- **Random events** at sea (storms, shipwrecks, merchant distress, mutiny, drifting wreck, marooned sailors, map fragment discovery)
- **Warm gold/brown visual theme** with responsive 3-column port layout
- **Captain's Log** with category icons, day stamps, varied message templates
- **Save/load** with migration support + error recovery
- **Economy simulator** (`tests/sim.html`), **crew lifecycle simulator** (`tests/crew_sim.html`), **bio/log redundancy analyzer** (`tests/crew_bio_log_sim.html`), **balance dashboard** (`tests/tests_balance.html`)
- **Screenshot generator** for itch.io assets (`screenshots/index.html`)

The game is always in a fully playable state at any phase boundary.

---

## Design Philosophy

Broadside is a **systems-driven pirate game** that creates stories through mechanical interaction, not scripted narrative.

> *A few mechanics that interact strongly beat many mechanics that exist independently.*

Every feature must pass this test: **does it create situations where two or more existing systems collide in ways the player didn't expect?**

Core design axioms:

- **Every success creates a new problem.** Win a battle → hull damaged, crew lost, cargo to manage, reputation shifted, heat increased.
- **The world remembers what you did.** Reputation, infamy, heat, crew loyalty, gossip — actions have echoes.
- **Resources are interconnected.** Gold buys crew, crew costs wages, wages require missions, missions require ships, ships require fame.
- **Time is the universal cost.** Every action takes days. Days consume provisions. Provisions cost gold. The clock is always ticking.
- **Crew are people, not numbers.** Named individuals with traits, scars, faction loyalties, and generated biographies. Losing a veteran hurts because you remember their story.

### Core Emotional Targets

| Emotion | Source | Example |
|---|---|---|
| **Pressure** | Resource interconnection | You need crew but can't afford wages. You need gold but can't afford the mission's risk. |
| **Consequence** | Permanent state changes | Your best navigator dies. A faction remembers your betrayal. Your ship is scarred. |
| **Attachment** | Named crew, emergent reputation | You protect crew members who've been with you since the beginning. |
| **Emergent story** | System collisions | A smuggle run goes wrong because your Spanish crew refused to forgive the attack on a Spanish patrol. |

### Game Influences & Systems Extraction

| Game | What We're Taking | What We're Rejecting |
|---|---|---|
| **Sid Meier's Pirates!** | Career arc with time pressure, port-hopping loop, faction reputation | Real-time combat, dancing minigames, romance subplot |
| **Galaxy on Fire 2** | Station-to-station trade loop, progressive ship upgrades, faction standing | 3D flight, skill trees, instanced missions |
| **Caravaneer** | Brutal economic weight, crew wages as constant drain, distance-as-risk | Inventory tetris, vehicle fuel micromanagement |
| **Dwarf Fortress** | Named individuals with traits creating emergent crises, losing is fun | Simulation depth beyond the player's ability to track, ASCII UI |
| **Occidental Heroes** | Lethal turn-based combat, every choice has structural permanence, main quest as spine | Party RPG mechanics, dungeon crawling |
| **Sunless Sea** | Crew accumulate biography that feeds back into the game, narrative and mechanical rewards are the same thing | Real-time movement, permadeath-by-default, excessive grinding |

### The Systemic Filter

> *Does this feel like Caravaneer's economic weight, reacting to Dwarf Fortress's chaotic human psychology, wrapped in the pacing of Sid Meier's Pirates!, executed with the lethal turn-based simplicity of Occidental Heroes, where crew biographies actually matter like Sunless Sea?*

If the answer is no, don't build it.

### What this game is

- A **text-driven strategy game** with systemic depth
- A game where **every port visit is a decision tree** (repair vs. upgrade vs. hire vs. trade vs. mission)
- A game where **losing your best crew member hurts** because you remember their name, their scars, their loyalty
- A game where **the map is a web of trade-offs**, not a checklist of locations

### What this game is not

- Not a base-building game (no island ownership, no construction)
- Not an action game (no real-time combat, no reflexes)
- Not a narrative RPG (no dialogue trees, no branching storylines)
- Not a simulation (no weather physics, no NPC economic AI, no faction territory wars)

---

## Architecture Principles (Locked)

| Principle | Rationale |
|---|---|
| Port ownership does not change | Keeps the map stable and learnable. Faction politics happen through reputation, not conquest. |
| Faction strength simulation: out of scope | The world reacts to the *player*, not to itself. NPC factions don't wage wars autonomously. |
| No party RPG mechanics | Crew are individuals with traits, not a party with classes and XP. |
| Named NPCs only get named ships | Named enemies are rare and significant. Generic patrols are procedural. |
| Ship equipment is per-hull, lost on upgrade | Prevents hoarding. Every ship purchase is a fresh start. |
| No build step, no npm, no TypeScript | The game runs from `<script>` tags. This constraint keeps the project shippable by one person. |
| Economy validated by simulation | Every balance change is verified against `tests/sim.html` before shipping. |
| **Wind is intentionally cosmetic** | Wind direction/speed is displayed for atmosphere. It does NOT affect travel times. This is a design decision, not unfinished work. |

---

## Development Constraints

- Solo developer (with AI assistance)
- No build tools, no framework beyond React CDN
- Browser-only (desktop + mobile)
- Each file under 1500 lines
- The game must be playable at every commit

---

## ✅ COMPLETED

### Tier 1 — Foundation & Clean-Up
- 4-file engine architecture (core, port, voyage, combat) with reducer chaining
- Test suite infrastructure (tests.html, test helpers, logic/engine/flow/UI tests)
- Economy balance validation via Monte Carlo simulator (tests/sim.html)
- Save/load with state migration for backward compatibility

### Tier 2 — The World Notices You
- **Heat system** — `factionAlerts` per faction (0-10), triggers on combat/flee/smuggle, decays -1/2 days, patrol frequency scales with heat + rep dampening, patrol strength escalates, heat gossip on port entry, visible in HUD/map/status/debug
- **Crew faction loyalty** — `getCrewAlignment` modifier on morale, upset trigger (15% per matching-faction crew), desertion at port (30%/10%/mutineer×2), mutineer tagging on mutiny crush
- **Port gossip generator** — priority-based system (heat/contraband P3, rep/fame/infamy P2, market/hidden hints P1, ambiance/weather P0), gossip size 25/50/25% distribution, bracket-based market price detection, 5% hidden port hints
- **Port personality** — faction-flavoured ambiance templates, WORD ON THE DOCKS panel
- **Friendly encounters** — Drifting Wreck (4 outcomes: cargo/nothing/survivor/trap), Marooned Sailors (hidden trait chance)
- **Defeat consequences** — wash ashore at previous port, all cargo lost, mission cancelled

### Tier 3 — Crew Become People
- **Crew traits** — hidden_drunkard/coward/greedy/troublemaker assigned at hire (5%) and via marooned sailors (40%). Trigger-based reveal (hidden_X → revealed_X). Effects: drunkard consumes rum, coward morale penalty on high-risk, greedy demands gold, troublemaker brawls
- **Crew scars** — scar_battle (≥10 crew died), scar_storm, scar_shipwreck, scar_grapple, scar_mutiny. Permanent, visible, pure narrative
- **Positive traits** — seasoned (50d, halved desertion), veteran (100d, flavour), loyal (200d + no upset + faction rep ≥ 80, immune to upset/desertion)
- **Generated biographies** — 25 opening templates (5 brackets × 5 variants using name/role/faction), 15 combination sentences, scar/trait variants, suppression logic
- **Crew detail card** — faction dots, scar icons with tooltips, revealed traits, veteran labels (New Hand → Old Salt), generated bio paragraph

### UI & Presentation
- Warm gold/brown panel color palette (global theme shift from cold blue)
- Responsive PortScreen redesign (3-column laptop, stacked mobile)
- Ship Status panel removed from PortScreen (redundant with HUD)
- Actions panel with Save + Load buttons
- Faction flag icons on port headers and mission cards
- HUD contraband indicator
- Captain's Log with category icons, day stamps (right-aligned, shown on day change)
- Victory/defeat/arrival/fled message template pools (4-6 variants each)
- Trade line compression (single summary per transaction)
- "Game saved" removed from log (HUD flash only)
- Narrative typography pass (larger font, increased line height for story text)
- Log category classification (arrival/combat/crew/trade/event with color coding)

### Tools & Testing
- Economy simulator — `tests/sim.html` (reads game files, 6 strategies, fame-indexed output)
- Crew lifecycle simulator — `tests/crew_sim.html` (6 playstyles, per-member tracking, survival curves)
- Bio/log redundancy analyzer — `tests/crew_bio_log_sim.html` (bio uniqueness, log pattern detection)
- Balance dashboard — `tests/tests_balance.html` (reachability, economy, combat, patrol, trade, events, gossip)
- Screenshot generator — `screenshots/index.html` (5 scenes × 3 sizes + itch.io assets, html2canvas export)

---

## IMPLEMENTATION ORDER

Each tier is self-contained. The game is fully playable at every tier boundary.

---

## Tier 4 — Polish, Readability & Save Robustness

> *Theme: Make what exists more usable, more readable, and more robust. Every player from this point on has a solid first experience.*

### T4.1 — Robust Save System

The game is deployed on GitHub Pages and itch.io. Saves must survive platform changes, browser wipes, and iframe restrictions.

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | None |
| **Definition of Done** | Player can save/load via localStorage (fast default) AND export/import via JSON file (indestructible backup). Both methods work on GitHub Pages and itch.io. |

**The problem:**
- localStorage is tied to origin — saves from GitHub Pages don't exist on itch.io
- itch.io can embed in iframes — some browsers (Safari, Brave) block localStorage in iframes
- Clearing browser data destroys all saves
- Redeploying to a different URL loses all saves

**The solution: dual save system.**

- **localStorage** remains the fast auto-save/quick-load default (current behavior)
- **JSON file export** — new "Export Save" button downloads the complete game state as a `.json` file
- **JSON file import** — new "Import Save" button loads a `.json` file and restores game state
- **Both accessible from**: StartScreen (load), PortScreen actions panel (save/export), and the debug panel

**Implementation:**
- [ ] Add `exportSave()` function — `JSON.stringify(state)` → download as `broadside-save-YYYY-MM-DD.json`
- [ ] Add `importSave()` function — file input → `JSON.parse` → `migrateState` → dispatch `LOAD_GAME`
- [ ] Add "Export Save" button on PortScreen actions panel alongside Save
- [ ] Add "Import Save" button on StartScreen alongside "Continue Saved Game"
- [ ] Add "Import Save" button on PortScreen actions panel
- [ ] Handle errors gracefully (corrupt file, wrong format, old version → migrateState handles it)
- [ ] Test on: GitHub Pages, itch.io iframe embed, itch.io full-page, Safari, Chrome, Firefox
- [ ] Consider: auto-detect when localStorage is blocked (iframe) and show a warning + redirect to file export

### T4.2 — Captain's Journal Screen

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | None — all narrative systems are already generating content |
| **Definition of Done** | Dedicated Journal screen accessible from Port, Sailing, and Status. Log entries grouped by day. Category filter tabs. |

**Why now (not Tier 6):** The game now generates rich narrative content — gossip, crew events, trait reveals, battle outcomes, desertion, scars. Without a Journal, all of this scrolls away in the log and is lost. The narrative payoff of T2+T3 needs a readable screen.

- [ ] Add `📖 Journal` navigation target and screen constant
- [ ] Add `JournalScreen` component
- [ ] Display log entries grouped by day (use day prefix `[N]` already encoded)
- [ ] Category filter tabs: All / Crew / Combat / Ports / Missions / Trade
- [ ] Accessible from PortScreen, SailingScreen, StatusScreen
- [ ] Scrollable, with most recent at top
- [ ] Warm panel styling consistent with rest of UI

### T4.3 — Onboarding Overlay

| | |
|---|---|
| **Complexity** | Low-Medium |
| **Dependencies** | None |
| **Definition of Done** | First-time player sees contextual tooltips on first port visit, first sailing, first combat. Can be dismissed permanently. |

**Why now (not Tier 7):** Every player who discovers the game from this point forward plays without guidance. The Sunless Sea postmortem is explicit: neglecting the early game because veteran players dominated feedback was their biggest regret. Even basic contextual hints prevent confusion.

- [ ] Detect first-time player (no save exists, or `state.day === 1`)
- [ ] Show tooltip overlay on first port visit: "This is your port. Accept missions, trade goods, hire crew."
- [ ] Show tooltip on first map interaction: "Click a port to sail there."
- [ ] Show tooltip on first combat: "Choose an action each round."
- [ ] Show tooltip on first gossip panel: "Word on the docks — listen for hints."
- [ ] "Got it" / "Don't show again" button — stores flag in localStorage
- [ ] Non-intrusive — overlays don't block gameplay, just highlight

### T4.4 — Defeat Has Teeth (Persistent Consequences)

| | |
|---|---|
| **Complexity** | Low-Medium |
| **Dependencies** | None |
| **Definition of Done** | On defeat: ship takes permanent hull scar (max hull reduced by 5-10%, repairable at extra cost). Defeating faction gains +5 rep at their ports. |

- [ ] On defeat in `DISMISS_BATTLE`: reduce `ship.maxHullScar` (new field, default 0) by 5-10%
- [ ] `L.getShipStats` accounts for hull scar: `maxHull = SHIPS[type].maxHull * (1 - ship.hullScar/100) + upgrades`
- [ ] Repair scar at shipyard for extra cost (e.g., 2× normal repair cost)
- [ ] Add `hullScar` to migrateState (default 0)
- [ ] Log: "Your ship bears the scars of defeat. Maximum hull reduced."
- [ ] Defeating faction gets +5 rep at their ports (they're emboldened)

### T4.5 — Crew Flashpoint Events

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T3 (crew traits + scars must be complete) |
| **Definition of Done** | After X days aboard + specific trait/scar combinations, a named crew member generates a one-off decision event. The biography feeds back into gameplay. |

**The Sunless Sea insight:** Mechanical reward and narrative reward should be the same thing. Right now, crew accumulate biography but the biography doesn't feed back into the game. Flashpoint events close that loop.

**Trigger conditions (examples):**
- Veteran (100d+) with scar_battle: "Juan asks to be your first mate. He's earned it."
- Seasoned (50d+) with revealed_drunkard: "Maria is found passed out near the rum stores. The crew is angry."
- Loyal (200d+) with scar_mutiny: "Katherine pulls you aside. 'Captain, I've heard talk among the new hands. Watch the Dutchman.'"
- Mutineer (any) with 150d+ aboard: "Calico has been unusually quiet. He approaches you alone at sunset."

**Implementation:**
- [ ] Define 6-8 flashpoint conditions in `data.js` (tag combinations + days thresholds)
- [ ] Check conditions in `ENTER_PORT` or `ADVANCE_DAY` (low frequency — once per port visit)
- [ ] Generate event as a special `RANDOM_EVENT` variant that references the specific crew member by name
- [ ] Each flashpoint has 2-3 choices with meaningful consequences (reputation shift, crew loss/gain, trait change, gold cost)
- [ ] A crew member can only trigger ONE flashpoint ever (tag `flashpoint_fired` to prevent repeats)
- [ ] Log the outcome narratively

---

## Tier 5 — Ship Identity & Equipment Overhaul

> *Theme: Ships stop being stat blocks and start being characters of their own.*

### T5.1 — Equipment Slot System

| | |
|---|---|
| **Complexity** | High |
| **Dependencies** | None |
| **Definition of Done** | Each ship has named slots. Equipment is installed per-slot. Swapping equipment is a port action with a cost. Equipment defines ship personality (fast raider vs. armoured trader vs. balanced warship). |

### T5.2 — Ship Visual Differentiation

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T5.1 |
| **Definition of Done** | Each ship type has a distinct SVG sprite. Equipped items visually alter the sprite. Ship sprite appears in HUD, map, and battle. |

---

## Tier 6 — World Comes Alive

> *Theme: The Caribbean reacts to forces larger than the player.*

### T6.1 — World State Flags (Infrastructure)

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | None |
| **Definition of Done** | `state.world` object with named flags. Flags have start day and duration. Checked by mission generation, market prices, encounter frequency. |

### T6.2 — Scripted World Events

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T6.1 |
| **Definition of Done** | 4+ world events (war declaration, plague, treasure fleet, embargo). Each sets world flags + shows announcement on port entry. |

### T6.3 — Dynamic Prices Reacting to World Events

| | |
|---|---|
| **Complexity** | Low |
| **Dependencies** | T6.1 |
| **Definition of Done** | Market prices modified by active world flags. Validated by `tests/sim.html`. |

### T6.4 — Mission Board Reacts to World Events

| | |
|---|---|
| **Complexity** | Low |
| **Dependencies** | T6.1 |
| **Definition of Done** | Mission generation weights shift based on world flags. |

### T6.5 — Bounty Hunter Spawns

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T2.1 (Heat System) |
| **Definition of Done** | At very high infamy (75+) or max faction alert, named bounty hunters spawn. Tougher than regular patrols. Defeating them gives fame + gold. |

### T6.6 — Infamy Pardon Mechanic

| | |
|---|---|
| **Complexity** | Low-Medium |
| **Dependencies** | None |
| **Definition of Done** | At governor ports, player can pay gold + do a mission to reduce infamy. Cost scales with infamy level. |

---

## Tier 7 — Depth & Replayability

> *Theme: The game world has memory, personality, and recurring characters.*

### T7.1 — Named Rival NPC Captains

| | |
|---|---|
| **Complexity** | High |
| **Dependencies** | T6.1 (world flags) |
| **Definition of Done** | 3-5 named NPC captains generated at game start. Each has a faction, ship, personality. They appear as encounters at dramatically appropriate moments. |

### T7.2 — Governor Missions & Letters of Marque

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T6.1 |
| **Definition of Done** | At Allied reputation, the governor offers special high-reward missions. Letters of Marque legalize piracy against a specific rival faction. |

### T7.3 — Crew Officers

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T3 (crew traits) |
| **Definition of Done** | Designated officer slots (First Mate, Navigator, Gunner Chief, Surgeon). Officers provide passive bonuses. Losing an officer is mechanically significant. |

### T7.4 — Personal Quest Line + Career Clock ⚠️ DESIGN TOGETHER

These are the same design decision. The quest line provides structure. The clock provides pressure. Design them as one system even if implemented sequentially.

| | |
|---|---|
| **Complexity** | High |
| **Dependencies** | T6.2 (world events), T7.1 (rival captains) |
| **Definition of Done** | Each starting scenario has a 3-5 step personal quest. The quest IS the career clock — fame milestones unlock quest chapters. Completing the quest ends the career with a final score. Ignoring it means the world escalates. |

**The design question to answer before building:**

> *What does "completing your career" look like for each of the 5 starting scenarios?*

If you can answer that, the career clock answers itself.

**Reference approaches:**
- Sid Meier's Pirates! aging: punishes time mechanically but feels arbitrary in a text game
- Caravaneer economic collapse: thematically right but requires T6 world events first
- **Occidental Heroes main quest spine** (recommended): the clock IS the quest. Fame milestones unlock chapters. The world escalates if you ignore it. Player can keep playing freely but at increasing cost.

### T7.5 — Crew Tensions (Revisit)

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T3 (crew traits), T6 (world events) |
| **Definition of Done** | TBD — revisit after T6. Crew members from rival factions generate tension events. Player mediates or lets it escalate. |

**Not the same as upset/mutiny.** This is a system collision: crew roster × faction reputation. Two existing systems interact in a way the player didn't expect. Worth keeping on the roadmap rather than fully parking.

---

## Tier 8 — Endgame & Final Polish

### T8.1 — Multiple Save Slots + Cloud Awareness

| | |
|---|---|
| **Complexity** | Low-Medium |
| **Dependencies** | T4.1 (robust save) |
| **Definition of Done** | 3 save slots in localStorage. JSON export/import already exists from T4.1. Add slot selection UI. |

### T8.2 — Difficulty Settings

| | |
|---|---|
| **Complexity** | Low |
| **Dependencies** | None |
| **Definition of Done** | Easy/Normal/Hard modifier on mission gold, combat damage, crew wages, event frequency. |

### T8.3 — Retirement & Final Score

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T7.4 (quest line) |
| **Definition of Done** | Player can retire at any port. Final score based on fame, gold, crew alive, missions completed, ports discovered. |

### T8.4 — Advanced Text Generation (Slot-Based NLG)

| | |
|---|---|
| **Complexity** | Low-Medium |
| **Dependencies** | T4.2 (journal), all narrative systems stable |
| **Definition of Done** | Template interpolation upgraded to slot-based assembly. 500+ unique gossip/log outputs from 60 pattern lines + 30 slot pools. |

---

## Long-Term Vision

Ideas that require major new systems or significant scope expansion:

| Idea | Description | Status |
|---|---|---|
| **Prize Ship Escort** | Capture enemy ships, escort to port for bonus gold | Deferred — fleet management territory |
| **Fleet Management** | Own multiple ships, assign captains, run trade routes | Long-term only |
| **Ship Naming & History** | Ships track battle history, ports visited | Needs T5 first |
| **Market Saturation** | Prices respond to player trading patterns | Needs T6.3 first |
| **Hold Disasters** | Storm events damage specific cargo | Needs more event maturity |
| **Divide the Plunder** | Periodic crew payout events | Tied to Career Clock design |
| **Psychological Trauma** | Crew develop PTSD-like traits from near-death | Needs T3 scars first |
| **Native Asset Bundling** | Vendored scripts, service worker for offline | Polish-tier |
| **Rumour Memory** | Store useful gossip for later review | Only if playtesting demands it |

---

## Phase Sequence at a Glance

| Tier | Theme | Key Deliverable | Estimated Scope |
|---|---|---|---|
| **T4** | Polish & robustness | Robust saves, journal, onboarding, defeat scars, crew flashpoints | 3-4 weeks |
| **T5** | Ship identity | Equipment slots, ship visuals | 2-3 weeks |
| **T6** | World comes alive | World events, dynamic prices, bounty hunters, infamy pardon | 4-5 weeks |
| **T7** | Depth & replayability | Rival captains, governors, officers, quest line + career clock, crew tensions | 5-6 weeks |
| **T8** | Endgame | Save slots, difficulty, retirement, NLG | 3-4 weeks |

**Total estimated: ~18-22 weeks of focused work** (solo developer pace)

---

## ⏸ PARKED OR REJECTED CONCEPTS

| Concept | Reason | Date |
|---|---|---|
| **Perishable Cargo & Spoilage** | Punishes luck (wind/weather), not decisions. Fails the systemic filter. | June 2026 |
| **Morale Floor Cascade** | Compound-decay below 10 created unrecoverable death spirals with no player agency. | Earlier |
| **Post-Defeat Stat Screen** | Slowed the recovery loop. Players want to get back in action. | Earlier |
| **Crew XP / Leveling** | Turns crew into RPG party members rather than named individuals. Conflicts with Dwarf Fortress influence. | Earlier |
| **Dynamic Port Ownership** | Makes the map unpredictable in a way that frustrates rather than challenges. The player should be the agent of change. | Earlier |
| **Crew Stats Counters** | Deferred. Scars tell the story for now. Add if detail card needs more data. | June 2026 |
| **T3.4 Officer Poaching** | Requires named NPCs (T7), officer slots (T7.3), poaching economy. Too many dependencies for now. | June 2026 |
