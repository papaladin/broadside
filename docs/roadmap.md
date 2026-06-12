# Broadside — Development Roadmap

---

## Current Playable State

Broadside is fully playable with rich narrative systems:

- **5 starting scenarios** with unique characters, factions, backstories, and opening missions
- **25 ports** across the Caribbean (16 standard, 5 remote, 4 hidden)
- **11 ship types** across 5 tiers (Dinghy → Ship of the Line)
- **17 equipment items** across 4 slot types (hull, armament, rigging, special) with buy/install/remove/locker system
- **6 mission types**: escort, patrol, combat, trade, smuggle, assault — procedurally generated, fame-tier scaled
- **Turn-based combat** with 4 actions (broadside, precision, grapple, evade) + plunder screen
- **Encounter system** with data-driven options (fight, flee, parley, bribe, surrender, inspect)
- **Dynamic market economy** with 14 tradeable resources, per-port availability, buy/sell/black market
- **Faction heat system** — short-term regional danger from aggressive actions, decays over time
- **Port gossip generator** — atmospheric text based on heat, reputation, fame, infamy, contraband, market prices, hidden port hints
- **Crew loyalty system** — faction alignment morale modifier, upset/desertion mechanics, named crew consequences
- **Crew traits** — hidden traits (drunkard, coward, greedy, troublemaker) revealed through gameplay, scars earned from events, positive progression (seasoned → veteran → loyal)
- **Generated crew biographies** — role/faction/days/scars/traits combined into readable character descriptions with combo sentences
- **Reputation system** per port (5 tiers: At War → Allied), affects services, prices, and missions
- **Fame & infamy** progression gating ships, missions, equipment, and hidden port discovery
- **Random events** at sea (storms, shipwrecks, merchant distress, mutiny, drifting wreck, marooned sailors, map fragment discovery)
- **Mid-voyage course change** — reroute to alternate ports while at sea, with endurance budget, sea position tracking, and reachability checks
- **SVG world map** with faction-colored ports, wind compass rose, ship marker at sea, grid overlay, gradient backgrounds
- **Captain's Journal** with category filtering (crew/combat/ports/missions/trade), search, day grouping, reverse-chronological display
- **Warm gold/brown visual theme** with responsive layout and mobile-friendly touch targets
- **Captain's Log** with category icons, day stamps, varied message templates
- **Robust save/load** with localStorage auto-save, file export/import, hash integrity check, migration support, error recovery
- **Tutorial overlay system** — per-screen dismissible popups with "disable all" option
- **Economy simulator** (`tests/sim.html`), **crew lifecycle simulator** (`tests/crew_sim.html`), **bio/log redundancy analyzer** (`tests/crew_bio_log_sim.html`), **balance dashboard** (`tests/tests_balance.html`), **equipment combo analyzer** (`tests/equipment_combo_analyzer.html`)
- **Screenshot generator** for itch.io assets (`screenshots/index.html`)




---

## Architecture Principles

- **State immutability**: single state tree, useReducer, no direct mutation.
- **Pure logic**: `logic.js` has zero side effects. All game rules are testable in isolation.
- **Generator separation**: `generators.js` handles all randomness. Pure logic never calls `Math.random()`.
- **Reducer chain**: domain engines register independently. Adding a new domain = adding a new file.
- **Data-driven design**: game content lives in `data.js` / `data_text.js`. Code reads data; it never hardcodes content.
- **Test-first balance**: economy sim, crew sim, bio analyzer, balance dashboard run in-browser with no build step.

---

## Constraints

| Constraint | Reason |
|---|---|
| No build step | Must run from any HTTP server, including GitHub Pages. |
| No external dependencies beyond React, ReactDOM, Babel | Minimise attack surface and maintenance burden. |
| All state in one tree | Enables save/load, undo, and replay. |
| Text-first UI | Art and sound are polish layers, not structural. The game must be compelling with text alone. |
| Mobile-friendly | Touch targets ≥ 44px, responsive layouts, no hover-only interactions for critical actions. |

---

## Phase Sequence at a Glance

| Phase | Theme | Status |
|---|---|---|
| **T1** | Core loop: sail, trade, fight | ✅ Complete |
| **T2** | Systemic depth: crew, reputation, events | ✅ Complete |
| **T3** | Content: missions, factions, economy | ✅ Complete |
| **T4** | Polish & resilience: save/load, journal, onboarding, safety nets | 🔧 In progress |
| **T5** | Identity: equipment, visual personality, juice, career tracking | 🔧 In progress |
| **T6** | UI polish: mobile, responsive, visual overhaul | 🔲 Next |
| **T7** | Sailing enrichment: weather, dynamic events, micro-decisions | 🔲 Planned |
| **T8** | World events: story arcs, endgame, rival captains, legacy | 🔲 Planned |
| **T9** | Audio & visual polish: sound, animation, map art | 🔲 Future |

---

## Implementation Order

---

### T4 — Polish & Resilience

> **Goal**: make the game robust, trustworthy, and approachable for new players.

#### T4.4 — Map Visual Improvements
- [X] SVG coastline outlines for major landmasses (Cuba, Hispaniola, mainland)
- [X] Port dots styled by faction with glow on hover
- [X] Route line when sailing (animated dash)
- [X] Compass rose polish
- **Note**: Base SVG map with gradients, grid, wind compass, and sea-position ship marker already implemented.

#### T4.5 — itch.io Listing & Web Presence
- [ ] itch.io page with screenshots, description, tags
- [X] GitHub Pages deployment verified
- [X] README badges (play link, license)

#### T4.6 — Softlock Safety Net *(NEW)*
- [ ] Detect unrecoverable states: 0 gold + 0 crew + no food + damaged hull at port
- [ ] Mercy event: "A passing merchant offers you a loan" / charity rescue / port governor intervention
- [ ] Or: graceful game-over screen with career summary if truly irrecoverable
- [ ] Ensure defeat-in-combat recovery (wash ashore) always leaves player with minimum viable resources
- **Pillar**: Consequence (failure should sting, but not softlock)

#### T4.7 — Onboarding Redesign *(NEW)*
- [ ] Replace text-wall tutorial popups with progressive mechanic introduction
- [ ] Gate early complexity: equipment only appears after first ship upgrade, contraband after day 30 or first smuggle mission encounter
- [ ] Add contextual situation-triggered hints (e.g., "you're about to sail without food — here's how provisions work")
- [ ] First voyage as safe failure zone: starter mission to a nearby port with generous provisions, low encounter chance
- [ ] Watch a first-time player silently — adjust based on where they get confused
- **Note**: Current per-screen tutorial overlays remain as fallback; this redesign layers on top.
- **Pillar**: Discovery (learn by doing, not by reading)

---

### T5 — Identity & Personality

> **Goal**: give the game its visual fingerprint and unique feel.

#### T5.2 — Ship Visual Identity
- [ ] Unique ship silhouettes per ship type (currently `ShipSprite` component exists but renders identical for all ships)
- [ ] Ship name visible on sailing screen / HUD
- [ ] Equipment visually reflected on ship (e.g., extra sails, cannons visible)
- [ ] Port arrival illustration or vignette per faction

#### T5.3 — UI Juice & Immediate Feedback *(NEW)*
- [ ] CSS transitions on gold gain/loss (flash green/red in HUD)
- [ ] Hull bar pulse on damage taken
- [ ] Morale indicator flash on morale shift
- [ ] Screen tint / brief overlay on combat damage
- [ ] Battle log entries animate in (slide/fade)
- [ ] "Loot gained" summary with visual pop after plunder
- **Do AFTER T6 (UI polish / mobile) to avoid rework on elements that may be restructured.**
- **Pillar**: Consequence (make every impact *feel* real, not just *read* real)

#### T5.4 — Career Stats Tracking *(NEW)*
- [ ] Add persistent career stats to state: days survived, total gold earned, total gold spent, ships sunk, crew lost, crew hired, ports visited, missions completed, missions failed, goods traded, contraband seized, battles won/lost/fled
- [ ] Display on revamped Status screen as "Captain's Career" section
- [ ] Track per-run and cumulative (for future multi-run legacy)
- **Prerequisite for T8.3 (retirement / score / legacy screen).**
- **Build the data layer early to avoid retrofitting.**
- **Pillar**: Consequence (the Caribbean keeps score)

---

### T6 — UI Polish & Mobile

> **Goal**: make the game feel good to use on any device.

#### T6.1 — Responsive Overhaul
- [ ] Audit all screens at 360px–1440px widths
- [X] Stack panels vertically on narrow screens (port, shipyard, crew)
- [X] Touch-friendly: all interactive elements ≥ 44px
- [ ] Swipe gestures for tab navigation (market, shipyard, journal)
- **Note**: Basic responsive breakpoints exist (`isNarrow` checks). This pass is about comprehensive polish.

#### T6.2 — Visual Theme Refinement
- [X] Consistent spacing, typography, and panel styling across all screens
- [ ] Improve color contrast for accessibility
- [ ] Add subtle hover/focus states to all interactive elements
- [ ] Consider high-contrast / colorblind-safe palette option

#### T6.3 — Accessibility Pass
- [ ] ARIA labels on all interactive elements
- [ ] Alt text on SVG icons
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility for critical information (HUD, combat, journal)

---

### T7 — Sailing Enrichment

> **Goal**: make the voyage — the most-repeated action — more engaging.

#### T7.1 — Sailing Micro-Loop Improvement
- [ ] More frequent micro-decisions during sailing (around 50-60% dead air at the moment)
- [ ] Crew events at sea: arguments, sightings, morale moments, trait reveals
- [ ] Weather changes that affect speed and create decisions ("storm approaching — push through or divert?")
- [ ] Wind system that matters more: tacking, favorable/unfavorable wind as active consideration
- [ ] Sighting reports: "smoke on the horizon", "sail spotted", "land ahead" — information before commitment
- **Note**: Mid-voyage course change is already implemented, which transforms passive clicking into active route decisions. This tier enriches the *between-ports* experience further.
- **Pillar**: Freedom (the journey is a decision space, not dead air)

#### T7.2 — Dynamic Event Expansion
- [ ] Expand random event pool (currently ~5% per day, ~10 event types)
- [ ] Conditional events: appear only when specific state conditions are met (low morale + storm, high infamy + bounty hunter, etc.)
- [ ] Multi-part events: "you found a map" → later "the island from the map is nearby"
- [ ] Crew-specific events: triggered by individual crew traits (drunkard causes brawl, coward panics in storm)
- **Pillar**: Discovery (every voyage holds surprises)

---

### T8 — World Events, Story Arcs & Endgame

> **Goal**: the world comes to *you* — not just reacting, but initiating. Give the career a shape with a beginning, middle, and end.

#### T8.1 — World Events & Escalation
- [ ] Named rival captain(s) who appear, escalate, and must eventually be confronted
- [ ] Bounty hunter encounters that scale with infamy
- [ ] Governor missions: high-rep faction offers a multi-part quest chain (e.g., "clear the pirate nest at Roatán")
- [ ] Faction war events: two factions go to war, prices shift, new missions appear, allegiance is tested
- [ ] Treasure hunt chains: multi-port clue gathering leading to a hidden cache

#### T8.2 — Mid-Game Content
- [ ] Story beats at fame thresholds (50, 100, 200) — the world acknowledges your rise
- [ ] Crew loyalty events: long-serving crew members initiate conversations, requests, or betrayals
- [ ] Port-specific quest lines: unique missions available only at certain ports after reputation thresholds
- [ ] Equipment quest: a legendary item that requires a multi-step quest to obtain

#### T8.3 — Endgame & Legacy
- [ ] Optional victory conditions: retire with X gold, reach Legendary fame, discover all hidden ports, complete a final quest chain
- [ ] Retirement screen: career summary with stats, notable events, crew roster, ships owned
- [ ] Score system: calculate a "legend score" from career stats (uses T5.4 data layer)
- [ ] "One more thing" hook: after retirement, option to continue sailing or start a new game with a legacy bonus
- [ ] Difficulty settings: Forgiving / Standard / Ruthless (affects initial resources, enemy scaling, event frequency)

---

### T9 — Audio & Visual Polish

> **Goal**: sensory layer that reinforces the systems underneath.

#### T9.1 — Sound Design
- [ ] Ambient port sounds (seagulls, waves, crowd murmur)
- [ ] Sailing ambient (wind, creaking hull, waves)
- [ ] Combat sounds (cannon fire, wood cracking, crew shouts)
- [ ] UI sounds (button click, gold clink, mission accept)
- [ ] Music: atmospheric sea shanty / period-appropriate background

#### T9.2 — Animation & Visual Effects
- [ ] Ship movement animation on map
- [ ] Combat round animations (cannon flash, hull impact)
- [ ] Port arrival transition
- [ ] Weather effects on sailing screen (rain, storm clouds, calm shimmer)

---

## Completed

### T1 — Core Loop ✅
> Sail → trade → fight → upgrade → repeat. Basic navigation, market, combat, and port systems.

### T2 — Systemic Depth ✅
> Crew loyalty with faction alignment, upset/desertion mechanics. Reputation system (5 tiers). Random events at sea. Crew traits (hidden → revealed), scars, positive progression (seasoned → veteran → loyal). Generated crew biographies with combo sentences.

### T3 — Content Expansion ✅
> 6 mission types (trade, escort, patrol, assault, smuggle, bounty). 25 ports with faction services. 14 tradeable goods with variance. Port gossip generator (heat, fame, infamy, reputation, ambiance, weather, market hints). 5 starting scenarios. Faction heat system. Black market with contraband risk.

### T4.1 — Robust Save System ✅
> localStorage auto-save on port arrival. File export/import with base64 encoding and hash integrity check. State migration for version upgrades. Error boundary with "Try Load Last Save" recovery. Import via file picker on both title and port screens.

### T4.2 — Captain's Journal Screen ✅
> Full journal with category filtering (crew, combat, ports, missions, trade). Search bar. Day grouping. Reverse chronological display. Log line classification with icons. Accessible from port screen.

### T4.3 — Tutorial Overlay System ✅
> Per-screen dismissible tutorial popups (port, map, sailing, battle, market, crew, shipyard, journal, status). "Don't show again" checkbox that disables all tutorials. Tutorial state persisted in localStorage independently of game save. Toggle on title screen.

### T5.1 — Equipment Slot System ✅
> 17 equipment items across 4 slot types (hull, armament, rigging, special). Per-ship slot limits. Buy, install, remove to locker, reinstall from locker. Fame and hull prerequisites. Stat preview with before/after deltas. Trade-offs on every item (speed vs hull, damage vs crew loss, etc.). Structural items (non-removable) vs removable items.

### T4/T5 — Mid-Voyage Course Change ✅
> Route tracking with sea position interpolation. Endurance budget system (can't exceed ship's maxDays across legs). "Change Course" button on sailing screen opens map in at-sea mode. Map shows reachable ports from current sea position with remaining endurance. Reroute recalculates travel days from current position. Ship marker visible on map while at sea.

### T4/T5 — SVG Map Enhancements ✅
> Sea gradient background with radial highlight. Grid overlay. Wind compass rose with speed display. Faction-colored port markers with hover info (days, reputation, heat). Mission route indicator line. Ship marker at sea position during voyages.

---

## Parked Concepts

> Ideas captured but not scheduled. May be promoted to a tier if they pass the three-pillar test.

- **Crew relationships**: friendship/rivalry pairs that affect morale and combat
- **Ship naming**: player can rename their ship; name appears in journal and on map
- **Port investment**: spend gold to build infrastructure at a port, improving services over time
- **Fleet command**: own multiple ships, assign crew, run trade routes automatically
- **Seasonal weather patterns**: hurricane season, trade winds, monsoon — affect routes and risk
- **Historical events**: real 1695 events (e.g., Henry Every's trial) appear as news, affect the world
- **Pirate republic**: if player controls multiple pirate ports, trigger a faction-level event
- **Crew skill system**: individual crew members gain XP in their role, affecting ship performance
- **Reputation decay curve**: different factions forget at different rates (pirates forget fast, Spanish never forget)

---

## Long-term Vision

Broadside should feel like **reading a novel you wrote by playing it**. The Captain's Journal, crew biographies, and gossip system are the foundation of that vision. Every mechanical system should feed back into the narrative layer — creating stories that are unique to each playthrough, told in the player's own words through their choices.

The game is complete when a player can finish a run, read their journal from start to finish, and say: **"That was my story."**
