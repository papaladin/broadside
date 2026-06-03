# Broadside — Development Roadmap

> Last updated: June 2026

## Current Playable State

Broadside is fully playable in its current form:

- **5 starting scenarios** with unique characters, factions, backstories, and opening missions
- **25 ports** across the Caribbean (16 standard, 5 remote, 4 hidden)
- **11 ship types** across 5 tiers (Dinghy → Ship of the Line)
- **5 upgrades** installable at select ports
- **6 mission types**: escort, patrol, combat, trade, smuggle, assault — procedurally generated, fame-tier scaled
- **Turn-based combat** with 4 actions (broadside, precision, grapple, evade) + plunder screen
- **Encounter system** with data-driven options (fight, flee, parley, bribe, surrender, inspect)
- **Dynamic market economy** with 14 tradeable resources, per-port availability, buy/sell/black market
- **Reputation system** per port (5 tiers: At War → Allied), affects services, prices, and missions
- **Fame & infamy** progression gating ships, missions, upgrades, and hidden port discovery
- **Random events** at sea (storms, shipwrecks, merchant distress, mutiny, map fragment discovery)
- **Save/load** with migration support + error recovery
- **Economy simulator** (`tests/sim.html`) for balance validation

The game is always in a fully playable state at any phase boundary.

---

## Design Philosophy

Broadside is a **systems-driven pirate game** that creates stories through mechanical interaction, not scripted narrative. The design philosophy can be summarised in one sentence:

> *A few mechanics that interact strongly beat many mechanics that exist independently.*

Every feature must pass this test: **does it create situations where two or more existing systems collide in ways the player didn't expect?**

Core design axioms:

- **Every success creates a new problem.** Win a battle → hull damaged, crew lost, cargo to manage, reputation shifted. No victory is clean.
- **The world remembers what you did.** Reputation, infamy, crew loyalty, faction alert — actions have echoes.
- **Resources are interconnected.** Gold buys crew, crew costs wages, wages require missions, missions require ships, ships require fame. Every resource feeds into and drains from others.
- **Time is the universal cost.** Every action takes days. Days consume provisions. Provisions cost gold. The clock is always ticking.

### Core Emotional Targets

| Emotion | Source | Example |
|---|---|---|
| **Pressure** | Resource interconnection | You need crew but can't afford wages. You need gold but can't afford the mission's risk. |
| **Consequence** | Permanent state changes | Your best navigator dies. A faction remembers your betrayal. Your ship is scarred. |
| **Attachment** | Named crew, emergent reputation | You protect crew members who've been with you since the beginning. |
| **Emergent story** | System collisions | A smuggle run goes wrong because your English crew refused to attack an English patrol. |

### 🧭 Game Influences & Systems Extraction

| Game | What We're Taking | What We're Rejecting |
|---|---|---|
| **Sid Meier's Pirates!** | Career arc with time pressure, port-hopping loop, faction reputation | Real-time combat, dancing minigames, romance subplot |
| **Galaxy on Fire 2** | Station-to-station trade loop, progressive ship upgrades, faction standing | 3D flight, skill trees, instanced missions |
| **Caravaneer** | Brutal economic weight, crew wages as constant drain, distance-as-risk | Inventory tetris, vehicle fuel micromanagement |
| **Dwarf Fortress** | Named individuals with traits creating emergent crises, losing is fun | Simulation depth beyond the player's ability to track, ASCII UI |
| **Occidental Heroes** | Lethal turn-based combat, every choice has structural permanence, main quest as spine | Party RPG mechanics, dungeon crawling |

### The Systemic Filter

Before adding any feature, ask:

> *Does this feel like Caravaneer's economic weight, reacting to Dwarf Fortress's chaotic human psychology, wrapped in the pacing of Sid Meier's Pirates!, executed with the lethal turn-based simplicity of Occidental Heroes?*

If the answer is no, don't build it.

### What this game is

- A **text-driven strategy game** with systemic depth
- A game where **every port visit is a decision tree** (repair vs. upgrade vs. hire vs. trade vs. mission)
- A game where **losing your best crew member hurts** because you remember their name
- A game where **the map is a web of trade-offs**, not a checklist of locations

### What this game is not

- Not a base-building game (no island ownership, no construction)
- Not an action game (no real-time combat, no reflexes)
- Not a narrative RPG (no dialogue trees, no branching storylines)
- Not a simulation (no weather physics, no NPC economic AI, no faction territory wars)

---

## Architecture Principles (Locked)

These are structural constraints that will not change:

| Principle | Rationale |
|---|---|
| Port ownership does not change | Keeps the map stable and learnable. Faction politics happen through reputation, not conquest. |
| Faction strength simulation: out of scope | The world reacts to the *player*, not to itself. NPC factions don't wage wars autonomously. |
| No party RPG mechanics | Crew are individuals with traits, not a party with classes and XP. |
| Named NPCs only get named ships | Named enemies are rare and significant. Generic patrols are procedural. |
| Ship equipment is per-hull, lost on upgrade | Prevents hoarding. Every ship purchase is a fresh start. |
| No build step, no npm, no TypeScript | The game runs from `<script>` tags. This constraint keeps the project shippable by one person. |
| Economy validated by simulation | Every balance change is verified against `tests/sim.html` before shipping. |

---

## Development Constraints

- Solo developer (with AI assistance)
- No build tools, no framework beyond React CDN
- Browser-only (desktop + mobile)
- Each file under 1500 lines
- The game must be playable at every commit

---

## ✅ COMPLETED

### Foundation & Stabilisation
- 4-file engine architecture (core, port, voyage, combat) with reducer chaining
- 25 ports with faction-specific services, goods availability, hidden port system
- 11 ships across 5 tiers with fame-gated progression
- 5 upgrades with per-ship compatibility
- Save/load with state migration for backward compatibility
- Error boundary with "Load Last Save" recovery
- Debug mode (`?debug=1`) with full cheat panel

### Core Loop
- 6 mission types (escort, patrol, combat, trade, smuggle, assault) with procedural generation
- Turn-based combat (broadside, precision, grapple, evade) with speed-based evade check
- Encounter system with data-driven intercept options (fight, flee, parley, bribe, surrender, inspect)
- Plunder screen with manual cargo selection
- Dynamic market with per-port availability tiers and black market for illegal goods
- Provision system (food + water consumption, starvation morale penalty)
- Hold load speed penalty (>50% = slower voyages)
- Wind display (cosmetic — does not currently affect travel time)

### Progression & Identity
- Fame system (5 tiers: Unknown → Immortal) gating ships, upgrades, missions
- Infamy system affecting patrol frequency and bribe availability
- Reputation per port (5 tiers: At War → Allied) with decay toward neutral
- Named crew roster with faction-specific name pools and cosmetic roles
- Hidden ports unlocked by fame, reputation, infamy, or map fragment events
- 5 starting scenarios with unique characters and opening missions

### UI & Polish
- Responsive HUD with tooltips, auto-save flash, detail toggle
- Ship comparison panel in shipyard
- Market UI with batch buy/sell, hold preview, speed warning
- Status screen with faction relations overview
- Map with wind compass, hover info, mission destination line

---

## IMPLEMENTATION ORDER

Each tier is self-contained. The game is fully playable at every tier boundary.

## Tier 1 — Final Clean-Up & Balance Grounding

### T1.1 — Fix Test Suite

**Status:** In progress (down from 74 failures to ~15)

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | None |
| **Definition of Done** | All tests in `tests/tests.html` pass green. No skipped tests without documented reason. |

Root causes of remaining failures:
- Random stub exhaustion (combat uses many `Math.random()` calls via `removeRandomCrew` sort)
- Mission flow assertions that don't match current reducer logic (COMPLETE_MISSION at wrong port)
- Discovery condition edge cases (dryTortugas requires ALL conditions, not ANY)

### T1.2 — Economy Balance Validation

| | |
|---|---|
| **Complexity** | Low |
| **Dependencies** | T1.1 |
| **Definition of Done** | `tests/sim.html` shows all non-smuggle strategies reaching Fame 200. Pacing: Cutter by missions 4–6, Sloop by Fame ~60, gold S-curve confirmed. |

---

## Tier 2 — The World Notices You

> *Theme: Make existing systems visible and interconnected. The world stops being a backdrop and starts being a participant.*

### T2.1 — Alert System (Faction Heat)

When you do something aggressive near a faction's territory, that faction's ports get a temporary **alert level** that decays over 10–15 days.

| | |
|---|---|
| **Complexity** | Low (~50 lines) |
| **Dependencies** | None |
| **Definition of Done** | Attacking a Spanish patrol near Cartagena raises Spanish alert. Patrol frequency spikes in Spanish waters for 10–15 days. Alert visible on map (subtle glow or icon). Alert decays by 1/day. |

**Why it matters:** Creates regional consequences. The player must weigh *where* they act, not just *what* they do. Enables "laying low" as a tactical choice.

**Implementation:** `state.factionAlerts: { spanish: { level: 3, decayDay: 45 } }`. Checked by `maybeRandomPatrol()`. Set by `DISMISS_BATTLE` and `INTERCEPT_FLEE`.

### T2.2 — Crew Faction Loyalty

Crew members react when you attack ships belonging to their faction.

| | |
|---|---|
| **Complexity** | Low (~30 lines) |
| **Dependencies** | None |
| **Definition of Done** | Defeating an English ship causes English crew members to lose morale (−5 per member affected). Log names the upset crew. Repeated offenses: crew member may desert at next port. |

**Why it matters:** Crew composition becomes a strategic consideration layered on top of faction missions. Creates attachment to specific crew members.

**Implementation:** Check in `DISMISS_BATTLE`: loop roster, find members whose `faction` matches defeated `enemy.faction`, apply morale delta, add log entry.

### T2.3 — Arrival Gossip

When entering a port, contextual log lines reflect recent player actions.

| | |
|---|---|
| **Complexity** | Low (~40 lines) |
| **Dependencies** | None |
| **Definition of Done** | Port entry log includes 1–2 contextual lines based on: recent combat (faction + outcome), cargo contents (contraband), reputation changes, fame level. Generated by `G.generateArrivalGossip(state)`. |

**Examples:**
- *"Dockworkers eye your battered hull. Word of a fight near Cartagena has reached here."*
- *"Merchants approach eagerly — your reputation as a reliable trader precedes you."*
- *"The harbourmaster frowns. The contraband in your hold is poorly hidden."*

### T2.4 — Port Personality and Ambiance

Each port gets a generated flavour paragraph on arrival — weather, crowd mood, market activity, rumours.

| | |
|---|---|
| **Complexity** | Low (~60 lines in generators.js) |
| **Dependencies** | None |
| **Definition of Done** | Every port entry shows a 2–3 sentence generated description. Templates in `data.js`, assembly in `generators.js`. No two visits identical. |

**Note:** This is pure content via generators — template strings filled with game state. Zero new systems, massive feel improvement.

### T2.5 — Rumour System

Taverns and port arrivals surface procedurally generated rumours about trade opportunities, dangers, and missions elsewhere.

| | |
|---|---|
| **Complexity** | Low-Medium (~80 lines) |
| **Dependencies** | T2.4 (port personality) |
| **Definition of Done** | Arriving at port shows 1–3 rumours generated from current game state: good prices elsewhere, patrol activity, hidden port hints, faction tensions. Generated by `G.generateRumours(state, portKey)`, not handcrafted. |

**Implementation:** Template system in `data.js` + `generators.js`. Rumours reflect real game state (actual prices, actual alert levels, actual reputation). Some are misleading (10% chance of false rumour).

### T2.6 — Friendly Encounter Types

Not every encounter at sea is hostile.

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | None |
| **Definition of Done** | 3–4 new encounter types: friendly merchant (trade opportunity), allied patrol (safe passage bonus), stranded sailor (rescue for crew/morale), fishing fleet (provision resupply). Each uses existing InterceptScreen with non-combat options. |

### T2.7 — Defeat Has Teeth

Defeat currently means: wash ashore, lose cargo, continue. No lasting scar.

| | |
|---|---|
| **Complexity** | Low-Medium |
| **Dependencies** | None |
| **Definition of Done** | On defeat: ship takes permanent hull scar (max hull reduced by 5–10%, repairable at shipyard for extra cost). Defeating faction gains +5 rep boost at their ports. Log reflects the lasting damage. |

**Why it matters:** Makes combat feel consequential beyond cargo loss. Creates a recovery arc — "I need to get my ship repaired before I can take on anything serious."

---

## Tier 3 — Crew Become People

> *Theme: Crew stop being numbers and start being characters. This is where attachment and emergent stories come from.*

### T3.1 — Crew Traits (Visible and Hidden)

Each crew member gains 0–2 traits at generation. Visible traits are shown immediately. Hidden traits reveal after 30+ days aboard.

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | None |
| **Definition of Done** | 8+ traits implemented. Each trait has at least one mechanical effect. Hidden traits reveal with a log entry. Crew manifest shows trait icons. |

**Trait examples:**
- **Drunkard** (hidden): consumes rum from hold. Revealed when rum disappears.
- **Eagle-Eyed** (visible): +5% precision hit chance when this crew member is aboard.
- **Coward** (hidden): morale drops −10 before assault missions. Revealed on first assault.
- **Loyal** (visible): will not desert even at morale 0.
- **Disloyal** (hidden): attempts to poach crew during port stops if morale < 30.

### T3.2 — Crew Scars

Crew members who survive dangerous events gain permanent scars.

| | |
|---|---|
| **Complexity** | Low |
| **Dependencies** | T3.1 |
| **Definition of Done** | Storm survivors, battle survivors, and mutiny survivors gain scars. Scars are visible traits with minor effects. A scarred crew tells the story of where you've been. |

### T3.3 — Crew Tensions

Crew members from rival factions generate tension events.

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T3.1 |
| **Definition of Done** | Having English and Spanish crew aboard triggers occasional tension events. Player must mediate (cost: gold/morale) or let it escalate (risk: crew fight, injury, desertion). |

### T3.4 — Officer Poaching & Mutiny Crises

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T3.1, T3.3 |
| **Definition of Done** | Named officers (gunner, navigator, cook with high stats) can be poached by rival captains at port. Mutiny events escalate from tension events rather than appearing randomly. |

---

## Tier 4 — Ship Identity & Equipment Overhaul

> *Theme: Ships stop being stat blocks and start being characters of their own.*

### T4.1 — Equipment Slot System

Replace the current flat `upgrades[]` array with a slot-based system where each ship class has specific slot types (hull, rigging, armament, special).

| | |
|---|---|
| **Complexity** | High |
| **Dependencies** | None |
| **Definition of Done** | Each ship has named slots. Equipment is installed per-slot. Swapping equipment is a port action with a cost. Equipment defines ship personality (fast raider vs. armoured trader vs. balanced warship). |

### T4.2 — Ship Visual Differentiation

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T4.1 |
| **Definition of Done** | Each ship type has a distinct SVG sprite. Equipped items visually alter the sprite (e.g., copper hull = green tint, extra cannons = gun ports). Ship sprite appears in HUD, map, and battle. |

---

## Tier 5 — World Comes Alive

> *Theme: The Caribbean reacts to forces larger than the player.*

### T5.1 — World State Flags (Infrastructure)

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | None |
| **Definition of Done** | `state.world` object with named flags (`warEnglishSpanish`, `plagueHavana`, `treasureFleetSailing`). Flags have start day and duration. Checked by mission generation, market prices, encounter frequency. |

### T5.2 — Scripted World Events

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T5.1 |
| **Definition of Done** | 4+ world events (war declaration, plague outbreak, treasure fleet, trade embargo). Each sets world flags + shows announcement on next port entry. Events fire at fame thresholds or day thresholds. |

### T5.3 — Dynamic Prices Reacting to World Events

| | |
|---|---|
| **Complexity** | Low |
| **Dependencies** | T5.1 |
| **Definition of Done** | Market prices modified by active world flags. War → weapons expensive. Plague → medicine valuable. Embargo → affected goods scarce. Validated by `tests/sim.html`. |

### T5.4 — Mission Board Reacts to World Events

| | |
|---|---|
| **Complexity** | Low |
| **Dependencies** | T5.1 |
| **Definition of Done** | Mission generation weights shift based on world flags. War → more combat/escort missions. Plague → more trade missions (supplies needed). |

### T5.5 — Bounty Hunter Spawns

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T2.1 (Alert System) |
| **Definition of Done** | At very high infamy (75+) or max faction alert, named bounty hunters spawn as encounters. They are tougher than regular patrols and specifically target the player. Defeating them gives fame + gold. |

### T5.6 — Infamy Pardon Mechanic

| | |
|---|---|
| **Complexity** | Low-Medium |
| **Dependencies** | None |
| **Definition of Done** | At certain ports (governor ports), player can pay gold + do a mission to reduce infamy. Cost scales with infamy level. Creates an infamy management loop. |

---

## Tier 6 — Depth & Replayability

> *Theme: The game world has memory, personality, and recurring characters.*

### T6.1 — Named Rival NPC Captains

| | |
|---|---|
| **Complexity** | High |
| **Dependencies** | T5.1 (world flags) |
| **Definition of Done** | 3–5 named NPC captains generated at game start. Each has a faction, ship, personality. They appear as encounters at dramatically appropriate moments. Defeating them is a major fame event. They can also appear as mission targets. |

### T6.2 — Governor Missions & Letters of Marque

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T5.1 |
| **Definition of Done** | At Allied reputation with a faction, the governor offers special high-reward missions. Letters of Marque legalize piracy against a specific rival faction (reduces infamy from attacking them). |

### T6.3 — Crew Officers

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T3.1 (crew traits) |
| **Definition of Done** | Designated officer slots (First Mate, Navigator, Gunner Chief, Surgeon). Officers provide passive bonuses. Losing an officer is mechanically significant. |

### T6.4 — Personal Quest Line

| | |
|---|---|
| **Complexity** | High |
| **Dependencies** | T5.2 (world events), T6.1 (rival captains) |
| **Definition of Done** | Each starting scenario has a 3–5 step personal quest that unfolds as fame increases. Quests interact with world events and rival captains. Completing the quest is one path to the endgame. Inspired by Occidental Heroes' main quest as spine. |

---

## Tier 7 — Save, Polish, and Endgame

### T7.1 — Onboarding Overlay

| | |
|---|---|
| **Complexity** | Low |
| **Dependencies** | None |
| **Definition of Done** | First-time player sees contextual tooltips on first port visit, first sailing, first combat. Can be dismissed permanently. |

### T7.2 — Multiple Save Slots + JSON Export

| | |
|---|---|
| **Complexity** | Low |
| **Dependencies** | None |
| **Definition of Done** | 3 save slots. Export/import as JSON file. Useful for sharing saves and bug reports. |

### T7.3 — Difficulty Settings

| | |
|---|---|
| **Complexity** | Low |
| **Dependencies** | None |
| **Definition of Done** | Easy/Normal/Hard modifier on: mission gold, combat damage, crew wages, event frequency. Applied as multiplier in `logic.js`. |

### T7.4 — Endgame: Retirement and Final Score

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T6.4 (quest line) |
| **Definition of Done** | Player can retire at any port. Final score based on: fame, gold, ships owned, crew alive, missions completed, ports discovered. Leaderboard (local). |

### T7.5 — Career Clock ⚠️ NEEDS DESIGN DISCUSSION

The game currently has no time pressure — a player can grind indefinitely with no consequence. This is the most significant missing systemic element.

| | |
|---|---|
| **Complexity** | Medium |
| **Dependencies** | T3 (crew), T5 (world events) |
| **Definition of Done** | TBD — requires design discussion |

**Open design questions:**
- Is the clock tied to **real time** (day count, like Sid Meier's Pirates! aging)?
- Or tied to **fame level** milestones (at fame 100, something happens)?
- Or tied to a **main quest** spine (like Occidental Heroes)?
- Or tied to **something else** (crew unrest, faction escalation, world event cascade)?
- What happens when the clock triggers? Is it:
  - **End of game** (retirement forced)?
  - **A major crisis** (mutiny, bounty, war) that you survive and continue?
  - **A new stage** (the game changes — new mechanics unlock, old ones shift)?
- Can the player delay or accelerate the clock through their choices?

**Reference:** Sid Meier's Pirates! uses aging (stats degrade over years, forcing eventual retirement). Occidental Heroes uses a main quest deadline. Caravaneer uses economic collapse.



# T7.6 — Advanced Text Generation (Slot-Based NLG)

> Roadmap item for long-term polish. Not blocking any gameplay features.

## Purpose

Reduce gossip and event text repetition by evolving from static templates to **slot-based sentence assembly**. The player should rarely see the exact same line twice across dozens of port visits — without requiring hundreds of handcrafted strings.

**Player mental model:** "Every port visit has something new to read. The world feels alive and talkative."

---

## Current State (Level 1: Template Interpolation)

The gossip generator uses handcrafted sentences with `{good}` / `{Good}` variable slots:

```js
"Warehouses overflow with {good}. A buyer's market."
→ "Warehouses overflow with sugar. A buyer's market."
```

This works well but each template always produces the same sentence structure. With ~50 templates, players start recognising lines after ~15 port visits.

---

## Target State (Level 2: Slot-Based Sentence Assembly)

Templates are decomposed into **independent slot pools** that combine combinatorially:

```js
// One template definition:
{
  pattern: "{source} says {good} {verb} at {port}.",
  source: [
    "A merchant",
    "A drunk sailor",
    "A trader just arrived from {otherPort}",
    "The harbourmaster's clerk",
    "An old captain nursing his rum",
  ],
  verb: [
    "fetches a fortune",
    "sells for double the usual price",
    "is in high demand",
    "commands a premium",
    "is worth the voyage alone",
  ],
}

// Assembly:
function assembleSlotTemplate(template, context) {
  let text = template.pattern;
  // Replace each {slot} with a random pick from its pool
  if (template.source) text = text.replace("{source}", pickRandom(template.source));
  if (template.verb) text = text.replace("{verb}", pickRandom(template.verb));
  // Replace context variables
  text = text.replace(/\{good\}/g, context.goodName.toLowerCase());
  text = text.replace(/\{Good\}/g, context.goodName);
  text = text.replace(/\{port\}/g, context.portName);
  text = text.replace(/\{otherPort\}/g, context.otherPortName || "parts unknown");
  return text;
}
```

**Output variety:** 1 template × 5 sources × 5 verbs = **25 unique sentences**.
10 templates per category = **250 unique sentences** from ~50 lines of data.

---

## What Gets Upgraded

| Category | Current Templates | With Slots | Unique Outputs |
|---|---|---|---|
| Market surplus | 4 static | 4 patterns × 5 sources × 5 verbs | ~100 |
| Market shortage | 4 static | 4 patterns × 5 sources × 5 verbs | ~100 |
| Heat warnings | 4+4 static | 4 patterns × 3 observers × 3 details | ~36 per tier |
| Fame reactions | 2-3 per tier | 3 patterns × 4 crowd reactions | ~12 per tier |
| Infamy reactions | 2-4 per tier | 3 patterns × 4 watcher types | ~12 per tier |
| Ambiance | 4 per faction | 4 patterns × 3 details × 2 weather | ~24 per faction |
| **Total** | ~60 static lines | ~60 pattern lines + ~30 slot pools | **~500+ unique outputs** |

Reputation and contraband gossip remain static — they're already varied enough and benefit from precise authorial control.

---

## Slot Pool Design Principles

1. **Slots must be independently combinable** — any source × any verb must make grammatical sense
2. **Context slots** (`{good}`, `{port}`) come from game state — always factually accurate
3. **Flavour slots** (`{source}`, `{verb}`) come from pools — always grammatically safe
4. **No recursive expansion** — this is NOT a grammar/Tracery system. One level of slots only. Keep it simple.
5. **Existing templates remain valid** — a template without slot pools is just a static string. The system is backward-compatible.

---

## Implementation

| | |
|---|---|
| **Complexity** | Low-Medium (~80 lines in generators.js + ~100 lines of slot data) |
| **Dependencies** | T2.3 Gossip Generator (must be complete and stable) |
| **Files Changed** | `data.js` (slot pool data), `generators.js` (assembly function) |
| **New Functions** | `assembleSlotTemplate(template, context)` in generators.js |
| **Risk** | Low — backward-compatible, no new systems, pure content expansion |

### Task List

- [ ] **generators.js**: Add `assembleSlotTemplate(template, context)` — replaces `{slot}` from pools + `{variable}` from context
- [ ] **data.js**: Convert market surplus/shortage templates from strings to slot objects
- [ ] **data.js**: Add slot pools: `source` (5+), `verb` (5+ per category), `detail` (3+ per category)
- [ ] **data.js**: Convert heat, fame, infamy templates to slot format
- [ ] **data.js**: Add ambiance slot pools per faction (crowd, sound, smell, activity)
- [ ] **generators.js**: Update `generatePortGossip` to detect slot templates vs static strings and handle both
- [ ] Test: verify no grammatical nonsense in 100 random generations
- [ ] Test: verify context variables ({good}, {port}) are always factually correct

---

## Definition of Done

- [ ] `assembleSlotTemplate` produces grammatically correct output for all template × slot combinations
- [ ] At least 5 source slots and 5 verb/adjective slots per gossip category
- [ ] 500+ unique gossip outputs possible across all categories (verified by combinatorial count)
- [ ] Static templates still work (backward-compatible)
- [ ] No player-visible regression — gossip feels richer, not different
- [ ] Player sees a repeated exact line less than 5% of the time across 20 consecutive port visits

---

## Future Consideration: Grammar-Based Generation (Level 3)

If slot assembly still feels repetitive after hundreds of hours, the next step is a **recursive grammar system** (e.g., Tracery). This allows:

```
"#source# heard that #rumour#, and #reaction#."
→ "A sailor heard that spices are scarce at Curaçao, and is heading there with a full hold."
```

Tracery is a ~5KB JS library designed for exactly this use case. It would be loaded as a vendored dependency (no CDN, no npm). This is a **long-term consideration**, not a current plan — slot assembly should provide sufficient variety for the foreseeable future.




---

## Long-Term Vision

These are ideas that are interesting but require major new systems or significant scope expansion. They may never be built — they exist here to capture the design intent.

| Idea | Description | Status |
|---|---|---|
| **Prize Ship Escort** | Capture enemy ships, escort them to port for bonus gold. Adds travel modifier + intercept vulnerability. | Deferred from T2 — fleet management territory |
| **Fleet Management** | Own multiple ships, assign captains, run trade routes. Transforms the game's scope entirely. | Long-term only |
| **Ship Naming & History** | Ships track their battle history, ports visited, enemies defeated. A "ship's log" that tells the vessel's story. | Needs T4 (ship identity) first |
| **Market Saturation & Shipping Lanes** | Prices respond to player trading patterns. Flooding a market with sugar crashes the price. | Needs T5.3 (dynamic prices) first |
| **Hold Disasters & Cargo Shifts** | Storm events can damage specific cargo. Loose cargo shifts in heavy seas. | Needs more event system maturity |
| **Divide the Plunder** | Periodic crew payout events where gold is redistributed. | Tied to Career Clock design |
| **Psychological Trauma** | Crew who survive near-death events develop PTSD-like traits. | Needs T3.2 (scars) first |
| **Native Asset Bundling** | Replace CDN scripts with vendored copies. Service worker for offline play. | Polish-tier, not gameplay |

---

## Phase Sequence at a Glance

| Tier | Theme | Key Deliverable | Estimated Scope |
|---|---|---|---|
| **T1** | Clean-up | Tests pass, balance validated | 1–2 weeks |
| **T2** | World notices you | Alert system, gossip, port personality, rumours, friendly encounters, defeat scars | 3–4 weeks |
| **T3** | Crew become people | Traits, scars, tensions, officer poaching | 3–4 weeks |
| **T4** | Ship identity | Equipment slots, ship visuals | 2–3 weeks |
| **T5** | World comes alive | World events, dynamic prices, bounty hunters, infamy pardon | 4–5 weeks |
| **T6** | Depth & replayability | Rival captains, governor missions, officers, quest line | 5–6 weeks |
| **T7** | Endgame | Onboarding, saves, difficulty, retirement, career clock | 3–4 weeks |

**Total estimated: ~22–28 weeks of focused work** (solo developer pace)

---

## ⏸ PARKED OR REJECTED CONCEPTS

| Concept | Reason | Date |
|---|---|---|
| **Perishable Cargo & Spoilage** | Punishes luck (wind/weather), not decisions. "Your sugar rotted because of a headwind" doesn't create interesting choices — the player can't control the wind. Fails the systemic filter. | June 2026 |
| **Morale Floor Cascade** | Originally morale would compound-decay below 10. Playtesting showed this created unrecoverable death spirals with no player agency. | Earlier |
| **Post-Defeat Stat Screen** | A detailed "what you lost" screen after combat defeat. Cut because it slowed the recovery loop — players want to get back in action, not review their losses. | Earlier |
| **Crew XP / Leveling** | Crew were going to gain XP and level up skills. Rejected because it turns crew into RPG party members rather than named individuals with personality. Conflicts with Dwarf Fortress influence (traits > stats). | Earlier |
| **Dynamic port ownership** | Factions conquering each other's ports. Rejected: makes the map unpredictable in a way that frustrates rather than challenges. The player should be the agent of change, not the world. | Earlier |
