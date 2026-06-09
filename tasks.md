 # Tier 6 — World Comes Alive

> *Theme: The Caribbean reacts to forces larger than the player.*
>
> *Design Intent: The world should feel like it has its own momentum. Events happen that the player didn't cause, but that change what they should do. This creates the feeling of a living world — not a theme park waiting for the player to pull levers.*

---

## 1. Design Decisions

All decisions made during design review. These are constraints — implementations must respect them.

### Architecture Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | World events are **generated parametrically** (like missions), not scripted | Same event type with different factions/goods/ports feels different. Replayability comes from combination, not content volume. Start with 5 types, expand later — same pattern as missions. |
| D2 | **Max 3 simultaneous** active world events | More than 3 is unplayable — too many overlapping effects, too hard to communicate. Hard cap in generator: `state.world.activeEvents.length < 3`. |
| D3 | Events persist in **`state.world`**, survive save/load | World state is part of game state. Add `world` to `migrateState()` for backward compatibility with pre-T6 saves. |
| D4 | **Hybrid trigger model**: periodic roll + condition gating | Every 50-80 days at sea, roll for a new event. Only events whose conditions are met can fire. Prevents nonsensical early-game events (war on day 5) while preserving unpredictability. |
| D5 | Event roll happens during **ADVANCE_DAY** | The world moves while you sail. Effects apply immediately. Announcement appears in log at sea, full details on next ENTER_PORT via gossip and status screen. |
| D6 | Events must be **long enough** for player to reach port and feel impact | Minimum duration ~25 days. Player sailing 5-10 days should still have 15+ days of event remaining when they dock. |

### Player Experience Decisions

| # | Decision | Rationale |
|---|---|---|
| D7 | **No countdown** visible to player | Player should adapt to the event, not wait it out. Event end is a surprise — communicated via log entry and post-event gossip on next port visit. |
| D8 | **Timer-only resolution** (v1) | Events expire after their duration. No player influence on resolution for now. Future roadmap item: T6.7+ player-influenced resolution (completing missions shortens war, delivering supplies shortens plague). |
| D9 | **Static effects** (v1) | Price modifiers and mission weight shifts are constant for the event's duration. No escalation/de-escalation curves for now. Future refinement. |
| D10 | **No aftermath effects** (v1) | When an event ends, effects stop cleanly. Prices normalise on next market generation (ENTER_PORT). No lingering post-event modifiers. Keep it simple. |
| D11 | World events get a **dedicated WORLD STATE panel** on the Status screen | Clear, scannable, separate from faction relations. Each event shows generated flavour text + bullet-point effects. |
| D12 | Status screen gets a **narrative revamp** alongside world events | Replace stats-sheet feel with narrative text — NarrativePanel components. Numbers still accessible but story comes first. Natural moment since we're adding the World State panel. |

### Gossip Decisions

| # | Decision | Rationale |
|---|---|---|
| D13 | World event gossip is **P3 priority** (highest) | World events are the biggest news in the Caribbean. They should dominate gossip when active. |
| D14 | Gossip is **contextual**: varies by `[eventType][portRelationship]` | Gossip about a Spanish-English war sounds different in an English port vs a Dutch port vs a pirate port. This is what makes the world feel alive. 2D template matrix in `data_text.js`. |
| D15 | Gossip has **conditions**: some events only generate gossip at affected ports | Plague gossip is P3 at the affected port and same-faction ports, but P1 at distant ports. Embargo gossip is P3 at ports where the embargoed good is traded. War gossip is P3 everywhere. |
| D16 | **Post-event gossip** on first port entry after event ends | "The war has ended. An uneasy peace settles over the Caribbean." Different per faction perspective. One-time gossip, then normal gossip resumes. |

### Bounty Hunter Decisions

| # | Decision | Rationale |
|---|---|---|
| D17 | Bounty hunters are a **standalone system**, not a world event | They're driven by player actions (infamy, heat, rep), not world randomness. Separate check in ADVANCE_DAY alongside maybeRandomPatrol. |
| D18 | **1 bounty hunter at a time** | Keeps pressure focused and readable. One named nemesis is more memorable than a queue. |
| D19 | Hunter **stats scale on encounter** to match player's current power | Hunter is always a challenge. Stats derived from player's fame tier + ship tier at the moment of encounter, not at spawn time. Prevents trivialising an old hunter with a new ship. |
| D20 | Hunter is **persistent** until defeated | Stays in `state.bountyHunter`. Encounter chance increases over time. Can appear at sea or waiting at destination port. Creates ongoing tension. |
| D21 | Bounty board is **bidirectional** — hunters tracking you + your targets | Status screen shows who's hunting you. Allied ports (rep >= 80) offer player-targeted bounties on named enemies. |
| D22 | Bounty hunters can **overlap with world events** | Absolutely. A hunter appearing during a war while you're escorting a convoy = emergent storytelling. This is the design philosophy in action. |

### Infamy Pardon Decisions

| # | Decision | Rationale |
|---|---|---|
| D23 | Pardon is **mission-based** (earn it, not buy it) | Governor gives you a task. Completing it reduces infamy. Feels earned, not transactional. |
| D24 | Pardon reduces infamy by **-50%, never to zero** | The world remembers. A pirate with 80 infamy pardoned to 40 is still Wanted. Full redemption is not available. |
| D25 | Pirate crew **become upset** when you accept a pardon | You're betraying the Brotherhood. Pirate-faction crew may get `upset` tag, risking desertion at next port. This is a system collision that creates story. |
| D26 | Pardons available at **governor ports only** (faction capital ports with rep >= 50) | Not every port can issue a pardon. Need standing with the faction to even ask. |

---

## 2. Architecture Overview

### State Shape

```js
state.world = {
  activeEvents: [
    {
      id: "war_english_spanish_d47",  // unique ID (type + slots + startDay)
      type: "war",                     // event type key
      startDay: 47,                    // day event was generated
      duration: 52,                    // total days (hidden from player)
      slots: {                         // generated parameters
        factionA: "english",
        factionB: "spanish",
      },
      effects: {                       // computed at generation time
        priceModifiers: { weapons: 1.5 },
        missionWeights: { combat: 2.0, patrol: 2.0, escort: 1.5, trade: 0.5 },
        encounterFrequency: { english: 1.5, spanish: 1.5 },
      },
      flavourText: "Warships prowl the Windward Passage...",
      effectsSummary: [                // player-readable bullet points
        "Combat missions pay double at English and Spanish ports",
        "Weapons prices +50% everywhere",
      ],
      announced: false,                // flipped to true on first ENTER_PORT
    }
  ],
  recentlyEnded: [],  // events that ended since last ENTER_PORT (for post-event gossip)
  lastEventRollDay: 0,  // prevents rolling too frequently
}
```

### Bounty Hunter State Shape

```js
state.bountyHunter = {
  name: "Captain Blackwood",
  faction: "english",
  shipType: "frigate",
  spawnDay: 120,
  fleeCount: 0,           // increases encounter chance
  baseEncounterChance: 0.08,
  defeated: false,
}
// null when no hunter is active

state.playerBounty = {
  target: { name: "The Red Widow", faction: "pirate", ... },
  issuingFaction: "english",
  goldReward: 3000,
  fameReward: 15,
}
// null when no player bounty is active
```

### Generator Pattern

```
World Event = Type x Slots x Duration x Effects x FlavourText

Same pattern as missions:
  Mission = Type x Faction x Risk x TargetPort x Gold

Generator function:
  G.generateWorldEvent(state) -> event object | null
    1. Check: activeEvents.length < 3
    2. Check: day - lastEventRollDay >= 50
    3. Roll: ~30% chance per eligible check
    4. Filter: eligible event types by conditions
    5. Weight: by game state proxies
    6. Pick type, fill slots, roll duration, compute effects
    7. Generate flavour text from templates
    8. Return event object
```

### Weight Proxies (from existing state — no new tracking needed)

| Weight Factor | State Proxy | Favours |
|---|---|---|
| Faction tension | avg rep < 30 for 2+ factions | War |
| Criminal career | `infamy >= 25` | Crackdown, Embargo |
| Wealth / progression | `fame` tier >= 2 | Treasure Fleet, Embargo |
| Pirate alignment | avg pirate port rep >= 60 | Pirate Crackdown |
| Time elapsed | `day >= 80` | All (prevents too-early events) |
| Faction heat | `max(factionAlerts) >= 5` | Crackdown |

---

## 3. Starter Event Types (5)

### War

| Field | Value |
|---|---|
| **Slots** | factionA (colonial), factionB (rival of A) |
| **Condition** | day >= 80, factionA and factionB must both exist with ports |
| **Duration** | 40-60 days |
| **Price effects** | weapons +50% everywhere |
| **Mission effects** | combat x2.0, patrol x2.0, escort x1.5, trade x0.5 at belligerent ports |
| **Encounter effects** | patrol frequency x1.5 in belligerent faction waters |
| **Gossip dimension** | belligerent_A / belligerent_B / neutral / pirate |
| **System collisions** | Crew with factionA/B loyalty may become upset. Taking sides shifts rep. |

### Trade Embargo

| Field | Value |
|---|---|
| **Slots** | faction (colonial), good (trade good, not food/water) |
| **Condition** | day >= 60 |
| **Duration** | 25-40 days |
| **Price effects** | {good} +80% at faction's ports, +30% elsewhere |
| **Mission effects** | smuggle x2.5 at affected ports |
| **Encounter effects** | patrol frequency x1.3 at faction's ports |
| **Gossip dimension** | affected_faction / other_faction / pirate |
| **System collisions** | Smuggling the embargoed good is extremely profitable but risky. |

### Treasure Fleet

| Field | Value |
|---|---|
| **Slots** | faction (colonial), routeFrom (port), routeTo (port, same faction) |
| **Condition** | day >= 100, fame >= 50 |
| **Duration** | 15-25 days (short — time pressure) |
| **Price effects** | silver -30% at routeTo port (flood) after event |
| **Mission effects** | escort mission from faction (huge reward), intercept missions from rivals |
| **Encounter effects** | heavy naval presence along route |
| **Gossip dimension** | fleet_faction / rival_factions / pirate |
| **System collisions** | Massive risk/reward. Escort for gold+rep, or intercept for gold+infamy. |

### Plague

| Field | Value |
|---|---|
| **Slots** | port (any non-pirate port) |
| **Condition** | day >= 80 |
| **Duration** | 20-35 days |
| **Price effects** | food +50%, water +50% at affected port |
| **Mission effects** | no missions generated at affected port |
| **Service effects** | tavern service disabled (no morale recovery, no hiring) |
| **Crew effects** | docking at affected port: 10% chance per crew member of losing 1-3 crew |
| **Gossip dimension** | affected_port / same_faction / other_faction / pirate |
| **System collisions** | Need to repair there but docking risks crew. Provisions are expensive. |

### Pirate Crackdown

| Field | Value |
|---|---|
| **Slots** | faction (colonial — the faction leading the crackdown) |
| **Condition** | day >= 60, player infamy >= 20 OR any faction heat >= 5 |
| **Duration** | 30-45 days |
| **Price effects** | weapons +30% at faction ports |
| **Mission effects** | combat x2.0 (anti-pirate bounties), patrol x2.0 at faction ports |
| **Encounter effects** | patrol frequency x2.0 in faction waters, x1.3 everywhere |
| **Gossip dimension** | crackdown_faction / pirate / neutral |
| **System collisions** | High-infamy players hunted more aggressively. Pirate ports feel the pressure too. |

---

## 4. Implementation Tasks

### T6.1 — World State Flags (Infrastructure)

| Subtask | File(s) | Description |
|---|---|---|
| T6.1.1 | `engine_core.js` | Add `world: { activeEvents: [], recentlyEnded: [], lastEventRollDay: 0 }` to `initialState` |
| T6.1.2 | `engine_core.js` | Add `bountyHunter: null` and `playerBounty: null` to `initialState` |
| T6.1.3 | `engine_core.js` | Update `migrateState()` to add missing `world`, `bountyHunter`, `playerBounty` fields for old saves |
| T6.1.4 | `logic.js` | Add `getActiveWorldEvents(state)` — returns active events where `day < startDay + duration` |
| T6.1.5 | `logic.js` | Add `isWorldEventActive(state, eventType)` — checks if any active event matches type |
| T6.1.6 | `logic.js` | Add `getWorldPriceModifier(state, goodKey)` — multiplies all active event price modifiers for a good |
| T6.1.7 | `logic.js` | Add `getWorldMissionWeights(state)` — returns combined mission weight multipliers from active events |
| T6.1.8 | `logic.js` | Add `getWorldEncounterModifier(state, faction)` — returns patrol frequency multiplier |
| T6.1.9 | `logic.js` | Add `getPortRelationship(portKey, event)` — returns relationship string for gossip lookup |
| T6.1.10 | `engine_voyage.js` | Add `expireWorldEvents(state)` helper — moves expired events to `recentlyEnded`, removes from `activeEvents` |
| T6.1.11 | `tests/tests_logic.js` | Unit tests for all new logic functions |

**Definition of Done**: `state.world` exists. Helper functions return correct values. Old saves migrate cleanly. All helpers unit-tested.

### T6.2 — World Event Generator

| Subtask | File(s) | Description |
|---|---|---|
| T6.2.1 | `data.js` | Add `WORLD_EVENT_TYPES` with 5 starter types (war, embargo, treasure_fleet, plague, crackdown). Each type defines: slotRequirements, durationRange, effectTemplates, conditionFn, weightFn. |
| T6.2.2 | `data_text.js` | Add `WORLD_EVENT_FLAVOUR` — per-type array of flavour text templates with `{slot}` vars |
| T6.2.3 | `data_text.js` | Add `WORLD_EVENT_GOSSIP` — 2D template matrix `[eventType][portRelationship]` with 3-5 variants each |
| T6.2.4 | `data_text.js` | Add `WORLD_EVENT_END_GOSSIP` — post-event gossip templates per type per relationship |
| T6.2.5 | `data_text.js` | Add `WORLD_EVENT_EFFECTS_SUMMARY` — player-readable description templates per type |
| T6.2.6 | `generators.js` | Add `G.generateWorldEvent(state)` — main generator function. Checks cap (< 3), cooldown (>= 50 days), rolls chance (~30%), filters eligible types by conditions, weights by proxies, fills slots, computes effects, generates flavour text. |
| T6.2.7 | `generators.js` | Add internal helpers: `fillEventSlots(type, state)`, `computeEventEffects(type, slots)`, `weightEventTypes(eligible, state)` |
| T6.2.8 | `engine_voyage.js` | In ADVANCE_DAY pipeline: call `G.generateWorldEvent(state)` after step 9 (advanceHiddenPorts). If event generated: add to `activeEvents`, add log entry. |
| T6.2.9 | `engine_voyage.js` | In ADVANCE_DAY pipeline: call `expireWorldEvents(state)` at start of each day. If events expired: add log entries. |
| T6.2.10 | `engine_core.js` | Add action `DISMISS_WORLD_EVENT_ANNOUNCEMENT` for clearing the `announced` flag after player views on status screen |
| T6.2.11 | `tests/tests_logic.js` | Unit tests for generator: slot filling, effect computation, weight calculation |
| T6.2.12 | `tests/tests_engine.js` | Reducer tests: event generation in ADVANCE_DAY, expiry, migration |

**Definition of Done**: World events generate parametrically during sailing. 5 types with distinct slot combinations. Events appear in log. Events expire silently. Generator is testable and deterministic given fixed RNG.

### T6.3 — Dynamic Prices Reacting to World Events

| Subtask | File(s) | Description |
|---|---|---|
| T6.3.1 | `generators.js` | In `generatePortMarket()`: after computing base price, multiply by `L.getWorldPriceModifier(state, goodKey)` |
| T6.3.2 | `tests/sim.html` | Verify economy stability with 0, 1, 2, 3 active events via Monte Carlo |
| T6.3.3 | `tests/tests_logic.js` | Test price modifier stacking (2 events both affecting weapons) |

**Definition of Done**: Market prices visibly shift during active events. Economy sim shows no runaway inflation/deflation. Modifiers stack multiplicatively.

### T6.4 — Mission Board Reacts to World Events

| Subtask | File(s) | Description |
|---|---|---|
| T6.4.1 | `generators.js` | In `typeWeightsFor(faction)`: multiply base weights by `L.getWorldMissionWeights(state)` |
| T6.4.2 | `generators.js` | In `generateMissions()`: check for plague — if affected port, return empty array (no missions) |
| T6.4.3 | `tests/tests_logic.js` | Test mission weight shifts during war, embargo, crackdown |

**Definition of Done**: Mission board shifts during events. More combat missions during wars. More smuggle missions during embargoes. No missions at plague ports.

### T6.5 — Bounty Hunter System

| Subtask | File(s) | Description |
|---|---|---|
| T6.5.1 | `data.js` | Add `BOUNTY_HUNTER_NAMES` — list of named hunter captains (20+ names, faction-specific) |
| T6.5.2 | `data_text.js` | Add `BOUNTY_HUNTER_FLAVOUR` — encounter text, gossip hints, bounty board descriptions |
| T6.5.3 | `logic.js` | Add `shouldSpawnBountyHunter(state)` — conditions: `bountyHunter === null` AND (`infamy >= 50` OR `max(factionAlerts) >= 8`) AND `day >= 40` |
| T6.5.4 | `logic.js` | Add `getBountyHunterEncounterChance(state)` — base 8% + 5% per previous flee. Increases +1% per 10 days since spawn. |
| T6.5.5 | `logic.js` | Add `scaleBountyHunterStats(state)` — generates stats on encounter, scaled to player's fame tier + 1 difficulty bump. Always a credible threat. |
| T6.5.6 | `generators.js` | Add `G.generateBountyHunter(state)` — picks faction (most hostile to player), generates named captain, ship type based on player tier |
| T6.5.7 | `engine_voyage.js` | In ADVANCE_DAY: after random patrol check, check `shouldSpawnBountyHunter`. If true and no active hunter: generate and store in `state.bountyHunter`. Log entry. |
| T6.5.8 | `engine_voyage.js` | In ADVANCE_DAY: if `bountyHunter` active, roll encounter chance. If triggered: scale stats, build encounter context as `bounty_hunter` type, switch to intercept screen. |
| T6.5.9 | `engine_port.js` | In ENTER_PORT: if `bountyHunter` active, small chance (15%) hunter is waiting at port. Same encounter flow. |
| T6.5.10 | `engine_combat.js` | In DISMISS_BATTLE: if defeated bounty hunter: +fame, +gold reward, clear `state.bountyHunter`, reduce heat for hunter's faction, log entry. |
| T6.5.11 | `engine_combat.js` | In INTERCEPT_FLEE: if bounty hunter, increment `fleeCount`. Log entry noting they'll find you again. |
| T6.5.12 | `logic.js` | Add `bounty_hunter` to `buildEncounterContext` — options: fight, flee (harder), surrender (pay bounty). No bribe, no parley. |
| T6.5.13 | `data.js` | Add `BOUNTY_HUNTER_ENCOUNTER` type to encounter system (fight + flee + surrender only) |
| T6.5.14 | `generators.js` | Add `G.generatePlayerBounty(state, portFaction)` — generates a bounty target for the player to hunt. Available at Allied ports. |
| T6.5.15 | `engine_port.js` | Add action `ACCEPT_BOUNTY` — takes player bounty from available list at Allied port |
| T6.5.16 | `engine_voyage.js` | If `playerBounty` active: chance for target to appear during sailing (similar to mission encounter) |
| T6.5.17 | `engine_combat.js` | On defeating player bounty target: +gold, +fame, +rep with issuing faction. Clear `state.playerBounty`. |
| T6.5.18 | `tests/tests_engine.js` | Bounty hunter spawn, encounter, defeat, flee escalation tests |

**Definition of Done**: Bounty hunter spawns at high infamy/heat. Named, persistent, stats scale on encounter. Player can also hunt bounties from Allied ports. Bounty board visible on status screen.

### T6.6 — Infamy Pardon Mechanic

| Subtask | File(s) | Description |
|---|---|---|
| T6.6.1 | `data.js` | Add `PARDON_CONFIG`: `{ minRep: 50, infamyReduction: 0.5, costBase: 500, costPerInfamy: 50, missionTypes: ['escort', 'patrol'] }` |
| T6.6.2 | `data_text.js` | Add pardon mission text templates, acceptance/completion log entries |
| T6.6.3 | `logic.js` | Add `canRequestPardon(state, portKey)` — checks: governor port, rep >= 50, infamy > 0, no active pardon mission |
| T6.6.4 | `logic.js` | Add `getPardonCost(state)` — `costBase + costPerInfamy * infamy` |
| T6.6.5 | `generators.js` | Add `G.generatePardonMission(state, portKey)` — escort or patrol mission with pardon reward instead of gold |
| T6.6.6 | `engine_port.js` | Add action `REQUEST_PARDON` — deducts gold cost, generates pardon mission, sets as active mission |
| T6.6.7 | `engine_port.js` | In `COMPLETE_MISSION`: if mission type is `pardon`, reduce infamy by 50% (floor), never below 1. Tag pirate crew as `upset`. Log entry. |
| T6.6.8 | `engine_core.js` | Add `REQUEST_PARDON` to `window.E.A` |
| T6.6.9 | `screens_port.jsx` | Add pardon button to PortScreen when `canRequestPardon()` is true. Show cost + infamy reduction preview. |
| T6.6.10 | `tests/tests_engine.js` | Pardon flow: request, complete, infamy reduction, crew upset, can't pardon to zero |

**Definition of Done**: Player can request pardon at governor ports with rep >= 50. Costs gold. Generates a pardon mission. Completing it reduces infamy by 50% (never to zero). Pirate crew become upset. Tested.

### T6.7 — Status Screen Revamp

| Subtask | File(s) | Description |
|---|---|---|
| T6.7.1 | `logic.js` | Add `generateCareerNarrative(state)` — returns 2-3 sentence career description based on fame, infamy, day count, ships owned |
| T6.7.2 | `logic.js` | Add `generateFactionNarrative(state, faction)` — returns 1-2 sentence description of relationship with faction (based on avg rep + heat) |
| T6.7.3 | `screens_port.jsx` | Rewrite StatusScreen: replace StatBlock grid with NarrativePanel sections |
| T6.7.4 | `screens_port.jsx` | Add **WORLD STATE** panel — active events with flavour text + effects summary. No countdown. |
| T6.7.5 | `screens_port.jsx` | Add **BOUNTY BOARD** panel — hunter tracking you (if any) + your active bounty (if any) |
| T6.7.6 | `screens_port.jsx` | **YOUR NAME CARRIES WEIGHT** section — narrative career text, fame tier, infamy label |
| T6.7.7 | `screens_port.jsx` | **FACTION RELATIONS** section — narrative per-faction text with rep pills (numbers as metadata, not headline) |
| T6.7.8 | `screens_port.jsx` | **FACTION ALERTS** section — heat levels with narrative warnings |
| T6.7.9 | `ui.jsx` | If needed: add NarrativePanel variants for `world`, `bounty`, `career` |
| T6.7.10 | `tests/tests_ui.js` | Smoke tests for new status screen layout |

**Definition of Done**: Status screen feels like reading a report, not a spreadsheet. World events, bounty board, career, and faction relations all use narrative text with numbers as supporting metadata. All new panels render correctly.

### T6.8 — Contextual World Event Gossip

| Subtask | File(s) | Description |
|---|---|---|
| T6.8.1 | `generators.js` | In `generatePortGossip()`: add P3 world event gossip. For each active event, determine port relationship via `L.getPortRelationship()`, pick template from `WORLD_EVENT_GOSSIP[type][relationship]`. |
| T6.8.2 | `generators.js` | In `generatePortGossip()`: check `state.world.recentlyEnded`. For each, add post-event gossip from `WORLD_EVENT_END_GOSSIP[type][relationship]`. Clear `recentlyEnded` after generation. |
| T6.8.3 | `generators.js` | Add bounty hunter gossip: if `state.bountyHunter` active, add P2 gossip hint ("They say a hunter named {name} is asking about you...") |
| T6.8.4 | `data_text.js` | Write all gossip templates: 5 event types x 4-5 relationships x 3-5 variants each = ~75-125 templates |
| T6.8.5 | `data_text.js` | Write post-event gossip: 5 types x 3-4 relationships x 2-3 variants = ~30-60 templates |
| T6.8.6 | `data_text.js` | Write bounty hunter gossip: 5-8 templates |
| T6.8.7 | `tests/crew_bio_log_sim.html` | Extend bio/log sim to preview world event gossip variety |

**Definition of Done**: Port gossip reflects active world events at P3 priority. Gossip varies by port faction and proximity to event. Post-event gossip appears once on first port visit after event ends. Bounty hunter hints appear in gossip. ~100+ new gossip templates.

---

## 5. File Impact Matrix

| File | T6.1 | T6.2 | T6.3 | T6.4 | T6.5 | T6.6 | T6.7 | T6.8 |
|---|---|---|---|---|---|---|---|---|
| `data.js` | -- | WORLD_EVENT_TYPES | -- | -- | BOUNTY_HUNTER_NAMES, encounter type | PARDON_CONFIG | -- | -- |
| `data_text.js` | -- | flavour, gossip, effects_summary, end_gossip | -- | -- | hunter flavour | pardon text | -- | gossip templates (~150) |
| `logic.js` | helpers (6 new) | -- | getWorldPriceModifier | getWorldMissionWeights | spawn/encounter/scale (5 new) | canRequestPardon, getPardonCost | generateCareerNarrative, generateFactionNarrative | getPortRelationship |
| `storage.js` | -- | -- | -- | -- | -- | -- | -- | -- |
| `generators.js` | -- | generateWorldEvent + helpers | modify generatePortMarket | modify typeWeightsFor | generateBountyHunter, generatePlayerBounty | generatePardonMission | -- | modify generatePortGossip |
| `engine_core.js` | initialState + migrateState | DISMISS_WORLD_EVENT_ANNOUNCEMENT | -- | -- | -- | REQUEST_PARDON to E.A | -- | -- |
| `engine_port.js` | -- | -- | -- | -- | hunter at port check | REQUEST_PARDON, COMPLETE_MISSION (pardon) | -- | clear recentlyEnded |
| `engine_voyage.js` | expireWorldEvents | generate + expire in ADVANCE_DAY | -- | -- | spawn + encounter check | -- | -- | -- |
| `engine_combat.js` | -- | -- | -- | -- | hunter defeat/flee handling | -- | -- | -- |
| `ui.jsx` | -- | -- | -- | -- | -- | -- | new NarrativePanel variants | -- |
| `screens_port.jsx` | -- | -- | -- | -- | -- | pardon button | StatusScreen rewrite | -- |
| `screens_voyage.jsx` | -- | -- | -- | -- | InterceptScreen: bounty_hunter type | -- | -- | -- |
| `tests/*.js` | unit tests | generator + reducer tests | sim.html | weight tests | full bounty flow | pardon flow | UI smoke | gossip preview |

---

## 6. Implementation Order

```
Phase 1: Infrastructure (T6.1)
  state.world shape, migrateState, all logic helpers
  No visible change yet — foundation only
  Tests: all helpers passing

Phase 2: Generator + Engine (T6.2)
  World event generator, ADVANCE_DAY integration, expiry
  Events now fire and expire — visible in log only
  Tests: events generate, expire, log entries appear

Phase 3: System Reactions (T6.3 + T6.4)
  Market prices react, mission weights shift
  Events now mechanically affect gameplay
  Tests: sim.html validates economy, mission mix shifts

Phase 4: Status Screen + Gossip (T6.7 + T6.8)
  Status screen revamp with World State panel
  Contextual gossip for world events
  Events now fully communicable to player

Phase 5: Bounty Hunters (T6.5)
  Standalone system, can build independently
  Hunter spawn, encounter, defeat, flee, bounty board

Phase 6: Pardons (T6.6)
  Mission-based pardon, infamy reduction, crew upset
  Requires working mission system (already exists)
```

Each phase is **playable and testable** at its boundary. No phase depends on a later phase.

---

## 7. Future Refinements (Not in V1)

| Item | Description | Prerequisite |
|---|---|---|
| Player-influenced resolution | Completing missions shortens events (war, plague). Delivering supplies to plague port = -5 days. | T6.2 working |
| Escalating effects | Event effects intensify over duration (embargo prices ramp from +30% to +80%). | T6.2 working |
| Aftermath effects | Post-event lingering modifiers (war aftermath: -10% price depression for losing faction). | T6.2 working |
| Event chains | Events cause follow-on events (war -> embargo -> plague in besieged port). | T6.2 + more event types |
| Additional event types | Hurricane Season, Gold Rush, Slave Revolt, Governor Assassination, Mutiny Wave. | T6.2 template system |
| Bounty hunter escalation | New hunter after defeating old one is from a higher tier. Nemesis system. | T6.5 working |
| Pardon betrayal | Accepting a pardon then committing crimes = double infamy gain for 30 days. | T6.6 working |
