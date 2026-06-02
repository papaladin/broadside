# T2.1 — Alert System (Faction Heat)

> Detailed specification for implementation. Approved design: June 2026.

## Purpose

Create **short-term regional danger** as a consequence of aggressive actions. The world reacts to violence on a timescale of days, not weeks. The player must consider *which faction's waters* they're sailing through based on recent actions.

**Player mental model:** "I pissed off the Spanish. I need to avoid their waters for a few days."

---

## Relationship to Existing Systems

### Heat vs Reputation — Clean Separation

| | **Reputation** | **Heat** |
|---|---|---|
| **Metaphor** | What do they think of you? | Are they looking for you right now? |
| **Real-world analogy** | Criminal record | Active APB / manhunt |
| **Timescale** | Weeks — slow to build, slow to lose | Days — spikes fast, fades automatically |
| **Recovery** | Active work (missions, parley) | Passive (avoid the area, wait) |
| **Player feeling** | "I need to rebuild my standing with Spain" | "I need to stay out of Spanish waters for a week" |

### Independence Rules

- **Independent inputs:** Different actions trigger each (with intentional overlap on combat)
- **Independent outputs:** Rep affects services/prices/missions. Heat affects patrol frequency/strength. Neither modifies the other directly.
- **Different recovery:** Rep = active (missions). Heat = passive (decay).
- **Never double-output:** Heat never reduces reputation. Rep loss never increases heat.
- **One interaction:** High reputation dampens heat effects (see below).

---

## State Shape

```js
// engine_core.js → initialState
factionAlerts: {
  english: 0,
  spanish: 0,
  french: 0,
  dutch: 0,
  pirate: 0,    // pirates don't run organized patrols — reserved for future bounty hunter spawns (T5.5)
},
```

**Value range:** 0 (calm) to 10 (maximum alert). Integer only.

**Scope:** Per-faction, not per-port. Rationale: the player's mental model should be *"the Spanish are angry"*, not *"Havana specifically is angry."* Faction ports cluster geographically, so faction heat ≈ regional heat in practice.

---

## Triggers

Heat is triggered by **combat events**, not by diplomatic choices:

| Action | Heat Applied To | Amount | Rationale |
|---|---|---|---|
| Win battle vs faction ship | `enemy.faction` | +3 | Direct military confrontation |
| Refuse inspection + flee successfully | Patrol's faction | +2 | They saw you run |
| Refuse inspection + fight | Patrol's faction | +3 | Violence against crown forces |
| Complete smuggle mission to faction port | Target port's faction | +1 | Quiet, but word gets around |
| Attack merchant (distressed merchant event) | Merchant's faction | +2 | Witnesses report piracy |

### What does NOT trigger heat

| Action | Reason |
|---|---|
| Completing a mission for a faction | You were hired — no aggression |
| Parley / Bribe | Diplomatic resolution, no violence |
| Surrender | You submitted to authority |
| Abandon mission | Broken trust, not a combat event |
| Defeating a pirate ship | Pirates don't run organized patrols |

### Overlap with Reputation

Combat victories are the **only intentional overlap** — they trigger both −5 rep AND +3 heat. This is by design because they create different problems requiring different solutions:

| System | Problem Created | Solution | Timescale |
|---|---|---|---|
| **Rep −5** | Drift toward Hostile / At War | Do missions for that faction, parley | Weeks |
| **Heat +3** | More patrols in their waters | Avoid the area, wait for decay | Days |

---

## Decay

```js
// engine_voyage.js → ADVANCE_DAY, after existing checks
// Decay faction alerts by 1 every 2 days
if (state.day % 2 === 0) {
  const newAlerts = {};
  for (const [faction, level] of Object.entries(state.factionAlerts || {})) {
    newAlerts[faction] = Math.max(0, level - 1);
  }
  // ... spread into new state
}
```

| Heat Level | Decay Time | Player Perception |
|---|---|---|
| 1–2 | 2–4 days | Barely noticeable |
| 3–5 | 6–10 days | "Coast is hot, be careful" |
| 6–8 | 12–16 days | "Active manhunt, avoid the area" |
| 9–10 | 18–20 days | "Every ship is looking for you" |

**Heat caps at 10.** Multiple triggers stack: fight a patrol (+3) then flee another (+2) = heat 5.

---

## Effects

### Effect 1: Patrol Encounter Frequency (Primary)

Modify `L.maybeRandomPatrol()` to factor in heat based on the faction of origin/destination ports:

```js
// logic.js → maybeRandomPatrol(state)
const originFaction = PORTS[state.currentPort]?.faction;
const destFaction = PORTS[state.destination]?.faction;
const alerts = state.factionAlerts || {};

// Take the highest relevant heat from origin or destination faction
const relevantHeat = Math.max(
  alerts[originFaction] || 0,
  alerts[destFaction] || 0
);

// High reputation dampens heat effect
const avgRep = ((state.reputation[state.currentPort] || 50) + (state.reputation[state.destination] || 50)) / 2;
const heatDampening = avgRep >= 70 ? 0.5 : avgRep >= 50 ? 0.75 : 1.0;
const effectiveHeat = Math.floor(relevantHeat * heatDampening);

// Each heat point adds 3% patrol chance
const heatBonus = effectiveHeat * 0.03;

const chance = Math.min(baseChance + infamyBonus + heatBonus, 0.40);
//                                                             cap raised from 0.25 to 0.40
```

**Reputation dampening:**

| Reputation | Heat Multiplier | Rationale |
|---|---|---|
| Allied (70+) | ×0.5 | They know you — one incident won't trigger a manhunt |
| Friendly (50–69) | ×0.75 | They'll investigate, but not aggressively |
| Neutral/Hostile (<50) | ×1.0 | Already suspicious — full heat effect |

**Patrol chance examples:**

| Infamy | Heat | Rep | Effective Patrol Chance |
|---|---|---|---|
| 0 | 0 | 50 | 1% (base) |
| 20 | 0 | 50 | 6% (infamy only) |
| 0 | 5 | 30 | 16% (full heat, hostile rep) |
| 0 | 5 | 70 | 7.5% (heat dampened by allied rep) |
| 20 | 8 | 30 | 30% (infamy + full heat) |
| 50 | 10 | 10 | 40% (max cap) |

### Effect 2: Patrol Strength Escalation

When a patrol IS triggered, heat determines the enemy's strength:

```js
// In patrol generation (engine_voyage.js or generators.js)
const heatLevel = state.factionAlerts?.[faction] || 0;
const patrolRisk = heatLevel >= 7 ? "high" : heatLevel >= 3 ? "medium" : "low";
const enemy = G.generateEnemy(patrolRisk, state.fame, faction);
```

| Heat | Patrol Risk | What Spawns |
|---|---|---|
| 0–2 | Low | Small cutters/sloops — routine patrol |
| 3–6 | Medium | Brigantines — active search |
| 7–10 | High | Frigates/corvettes — hunting you specifically |

### Effect 3: Arrival Gossip (Flavour)

When entering a port whose faction has heat > 0, arrival log reflects it:

| Heat | Example Gossip |
|---|---|
| 1–3 | *"The harbourmaster checks your papers more carefully than usual."* |
| 4–6 | *"Soldiers patrol the docks. The garrison is on alert."* |
| 7+ | *"Warships sit in the harbour. They're looking for someone. Possibly you."* |

Implementation: Add to `G.generateArrivalGossip()` (T2.3) or as a check in `ENTER_PORT` reducer.

### Effect 4: Mission Reward Bonus (Optional)

Factions on high alert offer better mission rewards — they need capable captains:

```js
// In COMPLETE_MISSION or generateMissions
const alertBonus = (state.factionAlerts?.[mission.faction] || 0) >= 3 ? 1.15 : 1.0;
```

Creates interesting tension: the faction you angered pays MORE, but their waters are dangerous.

### What heat does NOT affect

| System | Reason |
|---|---|
| Port services | That's reputation's job (At War blocks services) |
| Market prices | Reserved for T5 (World Events) |
| Reputation directly | Heat and rep are independent inputs/outputs |

---

## Implementation Task List

### Phase 1: State & Decay (~20 lines)

- [ ] **data.js**: No changes needed (alert thresholds are in logic, not data)
- [ ] **engine_core.js**: Add `factionAlerts: { english:0, spanish:0, french:0, dutch:0, pirate:0 }` to `initialState`
- [ ] **engine_core.js**: Add `factionAlerts` to `migrateState()` (backward compat for old saves)
- [ ] **engine_voyage.js** → `ADVANCE_DAY`: Add decay logic (−1 every 2 days for each faction)

### Phase 2: Triggers (~30 lines)

- [ ] **engine_combat.js** → `DISMISS_BATTLE` (victory case): Add `factionAlerts[enemy.faction] += 3`
- [ ] **engine_combat.js** → `INTERCEPT_FLEE` (success case): Add `factionAlerts[patrol.faction] += 2`
- [ ] **engine_combat.js** → `INTERCEPT_FIGHT` (when fighting a patrol): Add `factionAlerts[patrol.faction] += 3`
- [ ] **engine_combat.js** → `RESOLVE_EVENT` (attack merchant choice): Add `factionAlerts[merchant.faction] += 2`
- [ ] **engine_port.js** → `COMPLETE_MISSION` (smuggle type): Add `factionAlerts[targetPort.faction] += 1`
- [ ] All alert mutations must use `Math.min(10, ...)` to cap at 10

### Phase 3: Effects (~40 lines)

- [ ] **logic.js** → `maybeRandomPatrol()`: Add `heatBonus` calculation with rep dampening. Raise cap from 0.25 to 0.40.
- [ ] **logic.js** or **generators.js**: Patrol risk level based on heat (low/medium/high)
- [ ] **engine_port.js** → `ENTER_PORT` or **generators.js** → `generateArrivalGossip()`: Add heat-aware gossip lines
- [ ] *(Optional)* **engine_port.js** → `COMPLETE_MISSION`: Add +15% reward bonus when faction alert ≥ 3

### Phase 4: UI (~15 lines)

- [ ] **screens_voyage.jsx** → `MapScreen`: Subtle visual indicator on ports whose faction has heat > 0 (e.g., faint red pulse, or ⚠ icon next to port name on hover)
- [ ] **screens_voyage.jsx** → `SailingScreen`: Show current heat level in provisions/status panel (e.g., "⚠ Spanish alert: HIGH")

### Phase 5: Tests

- [ ] **tests_logic.js**: Test `maybeRandomPatrol` returns higher chance with heat > 0
- [ ] **tests_logic.js**: Test rep dampening (allied rep halves heat effect)
- [ ] **tests_engine.js**: Test DISMISS_BATTLE increments factionAlerts
- [ ] **tests_engine.js**: Test ADVANCE_DAY decays factionAlerts
- [ ] **tests_engine.js**: Test heat caps at 10
- [ ] **tests/sim.html**: Verify economy balance still holds with heat system (infamy-heavy strategies should see more patrols but similar overall progression)

---

## Complexity Estimate

| Phase | Lines | Risk |
|---|---|---|
| State & Decay | ~20 | Low — only touches initialState + ADVANCE_DAY |
| Triggers | ~30 | Low — adds to existing action cases |
| Effects | ~40 | Medium — modifies maybeRandomPatrol + adds patrol scaling |
| UI | ~15 | Low — flavour indicators |
| Tests | ~60 | Low — pure function tests |
| **Total** | **~165 lines** | **Low-Medium overall** |

---

## Definition of Done

- [ ] Attacking a Spanish ship raises `factionAlerts.spanish` by 3
- [ ] Heat decays by 1 every 2 days automatically
- [ ] Patrol encounter chance increases when sailing through a heated faction's waters
- [ ] Patrol strength scales with heat level (low/medium/high)
- [ ] Allied reputation (70+) halves the heat effect on patrol chance
- [ ] Heat is visible to the player (map indicator + sailing panel + gossip)
- [ ] Heat caps at 10, patrol chance caps at 40%
- [ ] Old saves load without crashing (migrateState adds factionAlerts)
- [ ] Economy sim (`tests/sim.html`) shows no regression in progression curves
- [ ] All new tests pass




---------------------------------


# T2.2 — Crew Faction Loyalty

> Detailed specification for implementation. Approved design: June 2026.

## Purpose

Crew members react to your faction choices. Crew composition becomes a strategic commitment — not just a headcount. Named crew create personal consequences for political decisions.

**Player mental model:** "My crew is mostly Spanish. Working for England is fine, but attacking Spain will cause problems."

---

## Prerequisite: Morale Audit & Fixes

Before implementing crew loyalty, these morale corrections should be applied:

### Current Morale Map (Verified from Code)

#### Morale Gains

| Source | Amount | Location | Notes |
|---|---|---|---|
| Raise Morale (buy drinks) | +5 | `engine_port.js` → `RAISE_MORALE` | Costs `crew.length × 5` gold, capped at 100 |
| Battle victory — enemy hull ≤ 0 | +10 | `logic.js` → `applyMoraleModifier` | ⚠ **FIX: normalize to +5** |
| Battle victory — grapple instant win | +5 | `logic.js` → `applyMoraleModifier` | Correct |
| Mutiny — negotiate | +20 | `data.js` → `RANDOM_EVENTS` | Costs 200g flat. ⚠ **FIX: scale with crew** |
| Whale sighting — leave them be | +5 | `data.js` → `RANDOM_EVENTS` | `moraleBonus: 5` |
| Port entry | **None** | `engine_combat.js` → `ENTER_PORT` | Confirmed: no morale change on port entry |
| Mission completion | **None** | `engine_port.js` → `COMPLETE_MISSION` | ⚠ **FIX: add +3 base** |

#### Morale Losses

| Source | Amount | Location | Condition |
|---|---|---|---|
| Daily decay at sea | −1 | `engine_voyage.js` | Only when morale already < 30 |
| Starvation / wage crisis | −1/day | `engine_voyage.js` | Food=0 OR water=0 OR can't pay wages |
| Patrol inspection (contraband) | −10 | `engine_combat.js` | Contraband found during inspection |
| Flee battle | −5 | `logic.js` → `applyMoraleModifier` | Any flee attempt |
| Grapple failure | −10 | `logic.js` → `applyMoraleModifier` | Grapple attempted, failed |
| Surrender | −8 to −20 | `engine_combat.js` | From `D.SURRENDER_CONSEQUENCE[type].moralePenalty` |
| Mutiny — crush | −15 | `data.js` → `RANDOM_EVENTS` | Plus `crewLoss: 10` |
| Deserters — punish | −10 | `data.js` → `RANDOM_EVENTS` | Plus `crewLoss: 1` |

#### Morale Effects (Reading Morale)

| Effect | Threshold | Detail |
|---|---|---|
| Crew wages ×1.5 | morale < 30 | `logic.js` → `payCrewWages` |
| Daily morale decay | morale < 30 | −1/day at sea (compounds spiral) |
| **Damage taken ×1.2** | effective morale < 30 | Player ship takes 20% MORE damage in combat |
| **Damage taken ×0.9** | effective morale > 70 | Player ship takes 10% LESS damage in combat |
| Mutiny event fires | morale < 20 | `data.js` → condition check |
| Deserter event fires | morale < 40 | `data.js` → condition check |

### Morale Fixes to Apply

| Fix | What | Where | Rationale |
|---|---|---|---|
| **M-FIX-1** | Normalize ALL battle victory morale to **+5** | `logic.js` → `applyMoraleModifier`: change `delta = 10` (sink) to `delta = 5` | All victories should feel equal. Sinking and grappling are tactics, not moral tiers. |
| **M-FIX-2** | Add **+3 morale on mission completion** | `engine_port.js` → `COMPLETE_MISSION`: add `morale: Math.min(100, state.crew.morale + moraleGain)` | Currently missing entirely. This is the base that crew alignment will modify. |
| **M-FIX-3** | Scale mutiny negotiation cost with crew size | `engine_combat.js` → `RESOLVE_EVENT`: change fixed `gold: -200` to `gold: -(crew.roster.length * 10)` | 200g is trivial late-game. Scaling keeps mutiny threatening at all stages. |

---

## Crew Member Object — Future-Proof Design

### Current Shape

```js
{
  id: "crew_abc123",
  firstName: "Juan",
  lastName: "Rodríguez",
  role: "gunner",        // cosmetic: deckhand, gunner, cook, carpenter, navigator
  faction: "spanish",
}
```

### Proposed Addition: `tags` Array

Add a single `tags: string[]` field. All future crew mechanics use tag presence checks. No complex objects, no nested structures, no long text.

```js
{
  id: "crew_abc123",
  firstName: "Juan",
  lastName: "Rodríguez",
  role: "gunner",
  faction: "spanish",
  tags: ["upset"],        // ← NEW: simple string array
}
```

### Tag Catalogue (Projected Across All Tiers)

| Tag | Added By | Tier | Effect |
|---|---|---|---|
| `upset` | T2.2: battle vs own faction | T2 | 30% desert chance at port (10% if morale > 60) |
| `mutineer` | T2.2: mutiny event survivor | T2 | 2× desert chance when upset |
| `scar_battle` | T3.2: survived close combat | T3 | Flavour + minor morale immunity |
| `scar_storm` | T3.2: survived a storm event | T3 | Flavour + minor morale immunity |
| `scar_mutiny` | T3.2: survived a mutiny | T3 | Flavour |
| `trait_drunkard` | T3.1: hidden, revealed after 30d | T3 | Consumes rum from hold |
| `trait_eagle_eyed` | T3.1: visible at hire | T3 | +5% precision hit chance |
| `trait_coward` | T3.1: hidden, revealed before assault | T3 | −10 morale before assault missions |
| `trait_loyal` | T3.1: visible at hire | T3 | Never deserts, even at morale 0 |
| `trait_disloyal` | T3.1: hidden, revealed at low morale | T3 | Attempts to poach crew |
| `officer_firstmate` | T6.3: designated by player | T6 | Passive crew bonus |
| `officer_navigator` | T6.3: designated by player | T6 | Travel time reduction |
| `officer_surgeon` | T6.3: designated by player | T6 | Reduced crew loss in combat |

### Helper Functions

```js
// logic.js — simple tag checks
L.hasTag = (member, tag) => (member.tags || []).includes(tag);
L.addTag = (member, tag) => ({ ...member, tags: [...(member.tags || []), tag] });
L.removeTag = (member, tag) => ({ ...member, tags: (member.tags || []).filter(t => t !== tag) });
L.crewWithTag = (roster, tag) => roster.filter(m => L.hasTag(m, tag));
```

**Migration:** `migrateState()` in `engine_core.js` adds `tags: []` to any crew member missing the field.

---

## Mechanics

### Mechanic 1: Crew Alignment Modifier

Crew faction composition modifies morale gains and losses from faction-related actions.

```js
// logic.js — NEW
L.getCrewAlignment = (state, targetFaction) => {
  const roster = state.crew?.roster || [];
  if (roster.length === 0) return 0;
  const matching = roster.filter(m => m.faction === targetFaction).length;
  return matching / roster.length;  // 0.0 to 1.0
};

// Modifier: ranges from 0.5 (0% alignment) to 1.5 (100% alignment)
L.getAlignmentModifier = (state, targetFaction) => {
  return 0.5 + L.getCrewAlignment(state, targetFaction);
};
```

**Applied to:**

| Event | Base | With 80% matching crew | With 10% matching crew |
|---|---|---|---|
| Complete mission for faction | +3 | +3 × 1.3 = **+4** | +3 × 0.6 = **+2** |
| Attack own-faction ship | −3 (new) | −3 × 1.3 = **−4** (furious) | −3 × 0.6 = **−2** (mild) |

**NOT applied to:** combat morale (mid-battle), drinks, surrender, starvation, random events. Faction loyalty is a reflection mechanic, not a combat mechanic.

### Mechanic 2: Individual Upset Trigger

When you win a battle against a faction, each crew member from that faction has a chance of becoming individually upset.

**Trigger:** In `DISMISS_BATTLE` (victory phase), for each crew member where `member.faction === enemy.faction`:

```
Roll: 15% chance → member gets tag "upset"
Log: "Juan Rodríguez is disturbed by the attack on Spanish ships."
```

**All factions including pirate.** Pirate crew get upset when attacking pirate ships.

**Why 15%:** Most crew swallow it. When someone doesn't, it's memorable — a named person with a grievance, not a stat change.

### Mechanic 3: Desertion at Port

When entering a port (`ENTER_PORT`), each upset crew member has a chance of deserting.

```
For each crew member with tag "upset":
  Base desert chance: 30%
  If morale > 60: desert chance drops to 10%
  If member also has tag "mutineer": desert chance × 2 (60% / 20%)
  If member has tag "trait_loyal" (T3): never deserts

  If desert roll succeeds:
    → Remove from roster
    → Log: "Juan Rodríguez has left the crew. He could not forgive the attack on Spanish ships."

  If desert roll fails:
    → Remove "upset" tag (calmed down)
    → Log: "Juan Rodríguez seems to have settled down."
```

**Port faction matters:** If the port's faction matches the upset member's faction, desert chance gets +20% (they have somewhere to go).

### Mechanic 4: Mutiny Survivors Get Tagged

When a mutiny event fires (`RESOLVE_EVENT` for event id `mutiny`), surviving crew who were part of the mutiny get the `mutineer` tag.

```
// In RESOLVE_EVENT, mutiny case:
// Tag 30% of crew as "mutineer" (the ringleaders)
const mutineerCount = Math.ceil(roster.length * 0.3);
// First N crew (random order) get the tag
```

The `mutineer` tag is permanent — it doesn't clear. A mutineer who later becomes upset has double desert chance.

### Mechanic 5: Crew Manifest — Faction Visibility

The CrewScreen already shows each member with a role icon. Add:
- **Faction colour dot** next to each crew member (matching `FACTIONS[member.faction].color`)
- **Upset indicator** — small ⚠ icon on crew members with the `upset` tag
- **Crew composition summary** at the top: "English: 5 · Spanish: 3 · Pirate: 12"

---

## Strategic Implications

| Player Choice | Consequence |
|---|---|
| Hire at English ports | English-majority crew → great for English missions, dangerous to attack England |
| Hire at Pirate ports | Pirate crew get upset when attacking pirates — but pirate ports have fewer services |
| Mixed crew | No strong alignment bonus, but no strong penalty either. Jack of all trades. |
| Attack your crew's faction | Morale hit + individual upset + potential desertion at next port |
| Avoid your crew's faction's enemies | Safer but limits mission options |

**Hiring becomes a faction commitment.** The player thinks about *who* they're hiring, not just *how many*.

---

## Implementation Task List

### Phase 0: Morale Fixes (~15 lines)

- [ ] **logic.js** → `applyMoraleModifier`: Change sink victory from `delta = 10` to `delta = 5` (M-FIX-1)
- [ ] **engine_port.js** → `COMPLETE_MISSION`: Add `+3 base morale` on mission completion (M-FIX-2)
- [ ] **data.js** → `RANDOM_EVENTS` mutiny negotiate: Change `gold: -200` to `gold: -(roster.length * 10)` — or handle in `RESOLVE_EVENT` reducer (M-FIX-3)

### Phase 1: Crew Object Extension (~20 lines)

- [ ] **engine_core.js** → `migrateState()`: Add `tags: []` to any crew member missing the field
- [ ] **engine_port.js** → `START_GAME`: Ensure new crew members get `tags: []`
- [ ] **generators.js** → `generateCrewMember()`: Add `tags: []` to generated crew object
- [ ] **logic.js**: Add `hasTag`, `addTag`, `removeTag`, `crewWithTag` helpers
- [ ] **logic.js**: Add `getCrewAlignment(state, faction)` and `getAlignmentModifier(state, faction)`

### Phase 2: Alignment Modifier (~20 lines)

- [ ] **engine_port.js** → `COMPLETE_MISSION`: Apply alignment modifier to the +3 base morale gain
- [ ] **engine_combat.js** → `DISMISS_BATTLE` (victory): Apply −3 × alignment morale penalty when defeating a faction ship

### Phase 3: Upset & Desertion (~40 lines)

- [ ] **engine_combat.js** → `DISMISS_BATTLE` (victory): For each crew where `faction === enemy.faction`, 15% chance → add `upset` tag + log
- [ ] **engine_combat.js** → `ENTER_PORT`: For each upset crew member, roll desertion. Remove from roster or clear `upset` tag. Log by name.
- [ ] **engine_combat.js** → `ENTER_PORT`: Port faction match = +20% desert chance
- [ ] **engine_combat.js** → `RESOLVE_EVENT` (mutiny): Tag 30% of crew as `mutineer`

### Phase 4: UI (~30 lines)

- [ ] **screens_port.jsx** → `CrewScreen`: Add faction colour dot per crew member
- [ ] **screens_port.jsx** → `CrewScreen`: Add ⚠ icon for upset crew members
- [ ] **screens_port.jsx** → `CrewScreen`: Add crew composition summary ("English: 5 · Spanish: 3 · Pirate: 12")
- [ ] **screens_port.jsx** → `CrewScreen`: Tooltip on upset member shows reason

### Phase 5: Tests (~40 lines)

- [ ] **tests_logic.js**: Test `getCrewAlignment` with various roster compositions
- [ ] **tests_logic.js**: Test `hasTag`, `addTag`, `removeTag` helpers
- [ ] **tests_engine.js**: Test DISMISS_BATTLE adds `upset` tag to matching-faction crew
- [ ] **tests_engine.js**: Test ENTER_PORT desertion (upset member deserts or calms)
- [ ] **tests_engine.js**: Test COMPLETE_MISSION gives +3 × alignment morale
- [ ] **tests_engine.js**: Test `mutineer` tag applied on mutiny event
- [ ] **tests_engine.js**: Test migrateState adds `tags: []` to old crew

---

## Complexity Estimate

| Phase | Lines | Risk |
|---|---|---|
| Morale fixes | ~15 | Low — 3 simple value changes |
| Crew object extension | ~20 | Low — add field + helpers |
| Alignment modifier | ~20 | Low — arithmetic on existing data |
| Upset & desertion | ~40 | Medium — new logic in DISMISS_BATTLE + ENTER_PORT |
| UI | ~30 | Low — display only |
| Tests | ~40 | Low — pure function + reducer tests |
| **Total** | **~165 lines** | **Low-Medium overall** |

---

## Definition of Done

- [ ] Crew members have a `tags: []` array (old saves migrated)
- [ ] `L.getCrewAlignment(state, faction)` returns correct ratio
- [ ] Mission completion gives +3 base morale × alignment modifier
- [ ] Defeating a faction ship gives −3 morale × alignment modifier
- [ ] All battle victories give +5 morale (normalized)
- [ ] 15% of matching-faction crew become "upset" after battle victory vs their faction
- [ ] Upset crew have 30% desert chance at port (10% if morale > 60, +20% if port matches their faction)
- [ ] Mutiny survivors get `mutineer` tag (permanent, doubles desert chance)
- [ ] Mutiny negotiation cost scales with crew size (`roster.length × 10`)
- [ ] Crew manifest shows faction colours, upset indicators, and composition summary
- [ ] Desertion and calming logged by crew member name
- [ ] All new tests pass
- [ ] Economy sim (`tests/sim.html`) shows no regression


-------------------------------------------


# T2.3 — Port Gossip & Ambiance (covers T2.3 + T2.4 + T2.5)

> Merged specification for T2.3 (Arrival Gossip) + T2.4 (Port Personality) + T2.5 (Rumour System). Approved design: June 2026.
>
> The Gossip Generator handles all three features in a single system.

## Purpose

Every port entry feels **alive and reactive**. The player sees the world noticing them — their fame, their cargo, their recent actions, their reputation. Ports stop being menus and start being places.

**Player mental model:** "Havana feels different from Tortuga. And Havana feels different *today* than last week, because the Spanish are on alert and I'm carrying contraband."

---

## Design Principles

### Gossip Panel vs Captain's Log

| | **Gossip Panel** | **Captain's Log** |
|---|---|---|
| **Content** | What the world thinks of you | What just happened |
| **Tone** | Atmospheric, overheard, ambient | Factual, mechanical |
| **Persistence** | Stays for entire port visit | Scrolls chronologically |
| **Player action** | Read at leisure, informs decisions | Scan for results |
| **Refresh** | Only on new port entry | Every action |

### The Separation Rule

| Content | Gossip Panel | Log | Rationale |
|---|---|---|---|
| Port ambiance ("smell of tar and rum") | Yes | No | Atmosphere, not event |
| Heat warning ("garrison on alert") | Yes | No | Persistent awareness |
| Trade rumour ("silk expensive at Curacao") | Yes | No | Re-readable intel |
| Fame/infamy reaction | Yes | No | Ambient world response |
| Cargo warning ("contraband poorly hidden") | Yes | No | Persistent while in port |
| Reputation reaction ("harbourmaster is cold") | Yes | No | Ambient |
| Crew desertion ("Juan left the crew") | No | Yes | Mechanical event with impact |
| Mission/purchase/repair results | No | Yes | Mechanical |
| Arrival notification | No | Yes | Event marker |

---

## State Shape

```js
// In engine_core.js -> initialState
portGossip: [],   // string[] — 2-4 gossip lines, generated on ENTER_PORT
```

### Lifecycle

| Event | Action |
|---|---|
| `ENTER_PORT` | Generate: `state.portGossip = G.generatePortGossip(state, portKey)` |
| Screen navigation (port->shipyard->crew->port) | **No change** — gossip persists |
| `SAIL_TO` | Clear: `state.portGossip = []` |
| `REFRESH_MISSIONS` | **No change** — gossip not affected |
| `LOAD_GAME` | Preserved from save (or regenerated if missing via `migrateState`) |

---

## Display

### Location on PortScreen

Between the port description and the service buttons, in a visually distinct panel:

```
+---------------------------------------------------+
| Anchor HAVANA                          [Friendly]  |
| SPANISH PORT                                       |
| Crown jewel of Spanish power in the New World.     |
| Heavily fortified and fiercely proud.              |
|                                                    |
| +-- Speech Word on the Docks --------------------+ |
| | The garrison is on high alert. Soldiers         | |
| | patrol the harbour more than usual.             | |
| |                                                 | |
| | A trader whispers that cocoa fetches double     | |
| | at Bridgetown right now.                        | |
| |                                                 | |
| | "That captain's flag is well-known," says a     | |
| | dockworker. "Best keep your distance."          | |
| +-------------------------------------------------+ |
|                                                    |
| [Map] [Status] [Market]                           |
| [Shipyard] [Crew]                                 |
| [Quick Repair (200g)]                             |
+---------------------------------------------------+
```

### Visual Style

```jsx
// In screens_port.jsx -> PortScreen, new panel
{state.portGossip?.length > 0 && (
  <div style={panelStyle({ background: T.bgDeep, borderColor: T.borderFaint, marginBottom: 10 })}>
    <div style={{ color: T.textDim, fontSize: 10, marginBottom: 6, letterSpacing: "0.08em" }}>
      WORD ON THE DOCKS
    </div>
    {state.portGossip.map((line, i) => (
      <p key={i} style={{
        color: T.textDim, fontSize: 10, marginBottom: 6,
        lineHeight: 1.5, fontStyle: "italic"
      }}>{line}</p>
    ))}
  </div>
)}
```

**Styling notes:**
- Italic text, slightly dimmer than normal — feels like overheard conversation
- Uses `T.bgDeep` background — visually distinct from the port info panel
- Font size 10 — same as port description, not competing for attention
- No interaction — purely informational

---

## Gossip Categories

Each category has a **condition** (when eligible), a **priority** (importance), and **templates** (text options).

### Priority System

```
Priority 3 (Critical):   Always shown if condition met (heat, contraband)
Priority 2 (Important):  Shown if space available (reputation, fame, infamy)
Priority 1 (Useful):     Shown if space available (trade hints)
Priority 0 (Filler):     Atmospheric — fills remaining slots
```

Final gossip = top 2-4 entries sorted by priority. If tied, random selection.

**Priority 1 now includes 3 sources:** trade hints (other ports), local market gossip (this port), and hidden port hints.

### Category Details

#### Heat Warning (Priority 3)

**Condition:** `state.factionAlerts[port.faction] >= 3`

| Heat Level | Template Examples |
|---|---|
| 3-4 | "The harbourmaster checks papers more carefully than usual." |
| 5-6 | "Soldiers patrol the docks. The garrison has been reinforced." |
| 7+ | "Warships sit in the harbour, crews at the ready. Someone is being hunted." |

#### Contraband Warning (Priority 3)

**Condition:** Hold contains illegal goods (`tobacco` or `slaves` with qty > 0)

| Template Examples |
|---|
| "Dockworkers glance at your hold with knowing eyes." |
| "A customs officer lingers near your berth, nose in the air." |
| "The smell from your hold is drawing attention. Not the good kind." |

#### Reputation Reaction (Priority 2)

**Condition:** Based on `state.reputation[portKey]`

| Rep Range | Template Examples |
|---|---|
| 0-9 (At War) | "Armed men watch your every move. You are not welcome here." |
| 10-29 (Hostile) | "The harbourmaster's greeting is ice cold. Papers are checked twice." |
| 30-49 (Neutral) | "Nobody pays you special attention. Just another ship in port." |
| 50-69 (Friendly) | "The dockmaster nods in recognition. Your berth is ready." |
| 70+ (Allied) | "Merchants approach before you've tied off. Your name opens doors." |

#### Fame Reaction (Priority 2)

**Condition:** Based on `state.fame`

| Fame | Template Examples |
|---|---|
| 0-19 | "Nobody recognises you. Just another dinghy captain scraping by." |
| 20-49 | "A few sailors nod in recognition. You've been making a name." |
| 50-99 | "Tavern conversations pause as you pass. People know your ship." |
| 100-199 | "Children point at your flag. Sailors trade stories about you." |
| 200+ | "Your arrival is the talk of the port. Captains raise a glass." |

#### Infamy Reaction (Priority 2)

**Condition:** `state.infamy >= 10` (not shown below 10)

| Infamy | Template Examples |
|---|---|
| 10-24 | "A wanted notice on the tavern wall bears a description that could be yours." |
| 25-49 | "People avoid eye contact. Your reputation precedes you -- and not the good kind." |
| 50-99 | "The constable watches from the dock. You feel the noose tightening." |
| 100+ | "Every colonial power wants you dead. The question is who gets there first." |

#### Trade Hint (Priority 1)

**Condition:** Always eligible (generated from actual market data)

**Logic:** Pick a random legal resource. Find a reachable port where that resource is rarer (= more expensive). Generate a hint pointing there. ~10% chance of a **false rumour** that points somewhere the good is actually common.

```js
// In generators.js -> generatePortGossip
// Pick random good, find port where it's rarer, generate hint
// 10% chance: false rumour points to a port where the good is common
```

**Accuracy:** Hints are based on **real `GOODS_AVAILABILITY` data** — not random. The player can learn to trust (most) rumours and use them to plan trade routes.

#### Hidden Port Hints (Priority 1)

**Condition:** Player is close to unlocking a hidden port but hasn't discovered it yet.

**Logic:** Check each hidden port's `unlockCondition` against current state. If the player meets *some but not all* conditions (or is within ~70% of a threshold), generate a vague hint. Never reveal exact conditions — be mysterious.

```js
// Examples of condition proximity checks:
// Roatan: needs fame >= 50 OR pirate rep >= 65
//   If fame >= 35 or pirate rep >= 50 → hint eligible
// Dry Tortugas: needs infamy >= 25 AND pirate rep >= 65
//   If infamy >= 15 AND pirate rep >= 45 → hint eligible
// Las Aves: needs map_fragment_lasAves
//   If fame >= 40 (wrecker event needs fame 50) → hint about old wreckers
// Libertalia: needs fame >= 200 AND map_fragment_libertalia
//   If fame >= 150 → hint about a mythical place
```

| Hidden Port | Hint Examples |
|---|---|
| Roatan | "Old sailors speak of a hidden cove in the Bay Islands. Only those known to the Brotherhood find it." |
| Dry Tortugas | "A drunk pirate mumbles about islands at the tip of Florida. 'You need to be one of us,' he says." |
| Las Aves | "A wrecker nurses his drink alone. He looks like a man with charts to sell — for the right price." |
| Libertalia | "A dying sailor's tale keeps surfacing in tavern talk — a free republic, somewhere far south." |

**Not shown if:** Port is already discovered, OR player is nowhere near the conditions (< 50% of thresholds).

#### Local Market Gossip (Priority 1)

**Condition:** Current port has a generated market (`state.portMarket`) with notable price deviations.

**Logic:** Scan `state.portMarket.goods`. For each good, compare `buyFromPort` to `D.RESOURCES[good].basePrice`. If the deviation is > 20%, generate gossip about local abundance or scarcity.

```js
// In generators.js -> generatePortGossip, after trade hint
const market = state.portMarket;
if (market?.goods) {
  for (const [good, data] of Object.entries(market.goods)) {
    if (good === "food" || good === "water") continue;
    const base = D.RESOURCES[good]?.basePrice || 50;
    const ratio = data.buyFromPort / base;

    if (ratio < 0.80) {
      // Cheap — surplus/good harvest
      pool.push({
        text: pickRandom([
          `The ${D.RESOURCES[good].name.toLowerCase()} harvest was generous this season. Prices are low.`,
          `Warehouses overflow with ${D.RESOURCES[good].name.toLowerCase()}. A buyer's market.`,
          `${D.RESOURCES[good].name} is cheap here — the docks are stacked with it.`,
        ]),
        priority: 1,
      });
      break; // only one local market gossip per visit
    }

    if (ratio > 1.20) {
      // Expensive — shortage
      pool.push({
        text: pickRandom([
          `There's a shortage of ${D.RESOURCES[good].name.toLowerCase()}. Merchants are paying premium.`,
          `${D.RESOURCES[good].name} is scarce. Anyone with a hold full could name their price.`,
          `"We haven't seen a shipment of ${D.RESOURCES[good].name.toLowerCase()} in weeks," complains a merchant.`,
        ]),
        priority: 1,
      });
      break;
    }
  }
}
```

**Only one local market line per visit** — pick the most extreme deviation, not all of them.

**Why this matters:** Gives the player actionable intel about the port they're IN, without opening the market screen. "Oh, sugar is cheap here — I should buy some before I sail to a port where it's rare." Combines naturally with the trade hint (which points ELSEWHERE) to create a buy-here-sell-there loop visible entirely through gossip.

#### Port Ambiance (Priority 0)

**Condition:** Always eligible. Faction-flavoured atmospheric filler.

Templates grouped by faction in `data.js`:

```js
// data.js -> PORT_GOSSIP_TEMPLATES.ambiance
{
  english: [
    "The smell of tar and tobacco drifts from the shipyard.",
    "English sailors argue over cards in the shade of a warehouse.",
    "A preacher on the dock warns of God's judgment. Nobody is listening.",
  ],
  spanish: [
    "Church bells echo across the harbour. Mass has just ended.",
    "The scent of coffee and gunpowder hangs in the humid air.",
    "A line of soldiers marches past, muskets gleaming in the sun.",
  ],
  french: [
    "The sound of French drifts from the tavern, mixed with laughter and breaking glass.",
    "Buccaneers lounge on the dock, sharpening knives and lying about their catches.",
    "A woman sells fresh fruit from a cart. The mangoes look almost worth the price.",
  ],
  dutch: [
    "Merchants crowd the counting houses, ledgers open, voices sharp.",
    "The harbour is immaculate. Even the bollards look polished.",
    "Crates stamped VOC are stacked three-high on the quay.",
  ],
  pirate: [
    "The tavern is already loud, and the sun hasn't set yet.",
    "A man with more scars than teeth offers to sell you a map. It's clearly fake.",
    "Someone is playing a fiddle badly. Someone else is enjoying it even worse.",
  ],
}
```

**3 templates per faction minimum.** More can be added as pure content — no code changes needed.

---

## Generator: `G.generatePortGossip(state, portKey)`

```js
// generators.js — NEW function
const generatePortGossip = (state, portKey) => {
  const port = D.PORTS[portKey];
  const faction = port.faction;
  const rep = state.reputation?.[portKey] ?? 50;
  const heat = state.factionAlerts?.[faction] ?? 0;
  const fame = state.fame ?? 0;
  const infamy = state.infamy ?? 0;
  const holdItems = state.hold?.items || {};
  const hasContraband = (holdItems.tobacco || 0) > 0 || (holdItems.slaves || 0) > 0;

  const pool = [];

  // Priority 3: Heat
  if (heat >= 7)
    pool.push({ text: pickRandom(TEMPLATES.heat.high), priority: 3 });
  else if (heat >= 3)
    pool.push({ text: pickRandom(TEMPLATES.heat.medium), priority: 3 });

  // Priority 3: Contraband
  if (hasContraband)
    pool.push({ text: pickRandom(TEMPLATES.contraband), priority: 3 });

  // Priority 2: Reputation
  const repTier = rep >= 70 ? "allied" : rep >= 50 ? "friendly"
    : rep >= 30 ? "neutral" : rep >= 10 ? "hostile" : "at_war";
  pool.push({ text: pickRandom(TEMPLATES.reputation[repTier]), priority: 2 });

  // Priority 2: Fame
  const fameTier = fame >= 200 ? "legendary" : fame >= 100 ? "notorious"
    : fame >= 50 ? "recognised" : fame >= 20 ? "emerging" : "unknown";
  pool.push({ text: pickRandom(TEMPLATES.fame[fameTier]), priority: 2 });

  // Priority 2: Infamy (only if >= 10)
  if (infamy >= 10) {
    const infTier = infamy >= 100 ? "extreme" : infamy >= 50 ? "high"
      : infamy >= 25 ? "medium" : "low";
    pool.push({ text: pickRandom(TEMPLATES.infamy[infTier]), priority: 2 });
  }

  // Priority 1: Trade hint
  const hint = generateTradeHint(state, portKey);
  if (hint) pool.push({ text: hint, priority: 1 });

  // Priority 1: Local market gossip (shortage or surplus at THIS port)
  const localMarketGossip = generateLocalMarketGossip(state);
  if (localMarketGossip) pool.push({ text: localMarketGossip, priority: 1 });

  // Priority 1: Hidden port hint (if player is close to unlocking one)
  const hiddenHint = generateHiddenPortHint(state);
  if (hiddenHint) pool.push({ text: hiddenHint, priority: 1 });

  // Priority 0: Ambiance (2 random faction-specific lines)
  const ambiance = [...(D.PORT_GOSSIP_TEMPLATES.ambiance[faction] || [])];
  shuffleArray(ambiance).slice(0, 2).forEach(t =>
    pool.push({ text: t, priority: 0 })
  );

  // Sort by priority (highest first), take 2-4
  pool.sort((a, b) => b.priority - a.priority);
  const count = 2 + Math.floor(Math.random() * 3); // 2, 3, or 4
  return pool.slice(0, count).map(g => g.text);
};
```

### Trade Hint Generator

```js
const generateTradeHint = (state, currentPortKey) => {
  const resources = Object.keys(D.RESOURCES)
    .filter(g => g !== "food" && g !== "water" && !D.RESOURCES[g].illegal);
  const good = resources[Math.floor(Math.random() * resources.length)];
  const goodIndex = Object.keys(D.RESOURCES).indexOf(good);

  const tierRank = { always: 0, frequently: 1, sometimes: 2, rarely: 3, never: 4 };
  const currentTier = D.GOODS_AVAILABILITY[currentPortKey]?.[goodIndex] || "sometimes";
  const currentRank = tierRank[currentTier] || 2;

  // Find reachable ports where this good is rarer (more expensive)
  const candidates = Object.entries(D.PORTS)
    .filter(([key]) => key !== currentPortKey && !D.PORTS[key].hidden)
    .filter(([key]) => L.canReach(state, key))
    .filter(([key]) => {
      const targetTier = D.GOODS_AVAILABILITY[key]?.[goodIndex] || "never";
      return tierRank[targetTier] > currentRank;
    });

  if (candidates.length === 0) return null;
  const [targetKey, targetPort] = candidates[Math.floor(Math.random() * candidates.length)];

  // 10% false rumour
  if (Math.random() < 0.10) {
    const falseTargets = Object.entries(D.PORTS)
      .filter(([k]) => k !== currentPortKey && !D.PORTS[k].hidden)
      .filter(([k]) => (tierRank[D.GOODS_AVAILABILITY[k]?.[goodIndex]] || 2) < currentRank);
    if (falseTargets.length > 0) {
      const [fk, fp] = falseTargets[Math.floor(Math.random() * falseTargets.length)];
      return `A merchant claims ${D.RESOURCES[good].name} sells well at ${fp.name}. He seems unreliable.`;
    }
  }

  return `A trader mentions ${D.RESOURCES[good].name} fetches a good price at ${targetPort.name}.`;
};
```

---

## Implementation Task List

### Phase 1: Data Templates (~60 lines)

- [ ] **data.js**: Add `PORT_GOSSIP_TEMPLATES` with all categories (heat, contraband, reputation, fame, infamy, ambiance)
- [ ] **data.js**: Write 3+ ambiance templates per faction (15+ total)
- [ ] **data.js**: Add hidden port hint templates (1 per hidden port: Roatan, Dry Tortugas, Las Aves, Libertalia)
- [ ] **data.js**: Add local market gossip templates (3+ surplus, 3+ shortage — generic, not per-good)
- [ ] **data.js**: Export `PORT_GOSSIP_TEMPLATES` in return block

### Phase 2: Generator (~80 lines)

- [ ] **generators.js**: Add `generatePortGossip(state, portKey)` function
- [ ] **generators.js**: Add `generateTradeHint(state, portKey)` helper
- [ ] **generators.js**: Priority-based selection (3=critical, 2=important, 1=useful, 0=filler)
- [ ] **generators.js**: 10% false rumour chance for trade hints
- [ ] **generators.js**: Add `generateLocalMarketGossip(state)` — scan portMarket for >20% price deviations
- [ ] **generators.js**: Add `generateHiddenPortHint(state)` — check proximity to hidden port unlock conditions
- [ ] **generators.js**: Export `generatePortGossip` in return block

### Phase 3: State & Reducer (~15 lines)

- [ ] **engine_core.js** -> `initialState`: Add `portGossip: []`
- [ ] **engine_core.js** -> `migrateState()`: Add `portGossip: []` for old saves
- [ ] **engine_combat.js** -> `ENTER_PORT`: Set `portGossip: G.generatePortGossip(state, portKey)`
- [ ] **engine_port.js** -> `SAIL_TO`: Clear `portGossip: []`

### Phase 4: UI (~20 lines)

- [ ] **screens_port.jsx** -> `PortScreen`: Add gossip panel between port description and service buttons
- [ ] Style: italic, `T.bgDeep` background, `T.textDim` colour, 10px font
- [ ] Title: "WORD ON THE DOCKS"
- [ ] Only render if `state.portGossip.length > 0`

### Phase 5: Tests (~30 lines)

- [ ] **tests_engine.js**: Test `generatePortGossip` returns 2-4 strings
- [ ] Test heat gossip appears when `factionAlerts[faction] >= 3`
- [ ] Test contraband gossip appears when hold has tobacco or slaves
- [ ] Test trade hint points to a real port where the good is rarer
- [ ] Test gossip persists across screen navigation (NAVIGATE does not clear it)
- [ ] Test SAIL_TO clears `portGossip`
- [ ] Test local market gossip appears when portMarket has >20% price deviation
- [ ] Test hidden port hint appears when player is close to unlock conditions
- [ ] Test hidden port hint does NOT appear when port is already discovered

---

## Complexity Estimate

| Phase | Lines | Risk |
|---|---|---|
| Data templates | ~80 | Low — pure content strings + hidden port + market templates |
| Generator | ~120 | Low-Medium — condition checks + template selection + market scan + hidden port proximity |
| State & reducer | ~15 | Low — add field, set on entry, clear on sail |
| UI | ~20 | Low — single panel in PortScreen |
| Tests | ~30 | Low — generator output checks |
| **Total** | **~265 lines** | **Low** |

---

## Definition of Done

- [ ] `state.portGossip` is generated on every port entry via `G.generatePortGossip()`
- [ ] Gossip panel appears on PortScreen between port description and service buttons
- [ ] Gossip persists when navigating to shipyard/crew/market and back to port
- [ ] Gossip cleared on `SAIL_TO`
- [ ] Heat warnings appear when faction alert >= 3 (priority 3 — always shown)
- [ ] Contraband warnings appear when hold contains illegal goods (priority 3)
- [ ] Reputation, fame, and infamy reactions appear at appropriate thresholds
- [ ] Trade hints reference real goods and real reachable ports with accurate availability data
- [ ] ~10% of trade hints are false rumours
- [ ] Each faction has 3+ unique ambiance templates
- [ ] 2-4 gossip lines shown per visit (priority-sorted)
- [ ] No two consecutive visits to the same port show identical gossip (RNG in template selection)
- [ ] Old saves load without crashing (`migrateState` adds `portGossip: []`)
- [ ] Local market gossip shows when a good is >20% above or below base price at current port
- [ ] Hidden port hints appear when player is close to (but hasn't met) unlock conditions
- [ ] Hidden port hints are vague — never reveal exact conditions
- [ ] All new tests pass
