# T2 — Remaining Tasks (Consolidated)

> Ordered by recommended implementation sequence.
> Status as of: June 3, 2026.

---

## Summary

| Block | What | Est. | Status |
|---|---|---|---|
| **Block 1** | Gossip Generator (T2.3/T2.4/T2.5) | ~4 hours | 35% done — plumbing + UI ready, needs generator + templates |
| **Block 2** | Heat Cleanup (T2.1 remaining) | ~2 hours | 90% done — needs SailingScreen + tests |
| **Block 3** | Crew Loyalty (T2.2) | ~6 hours | 25% done — morale fixes done, needs all core mechanics |
| | **Total remaining** | **~12 hours** | |

---

## Block 1: Gossip Generator (T2.3 + T2.4 + T2.5)

> Finish first — self-contained, UI already rendering, enables gossip hooks for crew loyalty later.

### Already Done
- [x] `initialState.portGossip: []`
- [x] `migrateState` adds `portGossip`
- [x] `ENTER_PORT` generates heat gossip (inline, 3 tiers)
- [x] `SAIL_TO` clears `portGossip: []`
- [x] PortScreen: "WORD ON THE DOCKS" panel with italic styling
- [x] Panel only renders if `portGossip.length > 0`

### 1.1 Data Templates (~80 lines in data.js)

- [ ] Add `PORT_GOSSIP_TEMPLATES` constant to `data.js` with these categories:
  - [ ] `heat.medium` — 3+ templates for heat 3-6
  - [ ] `heat.high` — 3+ templates for heat 7+
  - [ ] `contraband` — 3+ templates
  - [ ] `reputation.at_war` / `.hostile` / `.neutral` / `.friendly` / `.allied` — 2+ each
  - [ ] `fame.unknown` / `.emerging` / `.recognised` / `.notorious` / `.legendary` — 2+ each
  - [ ] `infamy.low` / `.medium` / `.high` / `.extreme` — 1+ each
  - [ ] `ambiance.english` / `.spanish` / `.french` / `.dutch` / `.pirate` — 3+ each (15+ total)
  - [ ] `hiddenPorts.roatan` / `.dryTortugas` / `.lasAves` / `.libertalia` — 1 each
  - [ ] `market.surplus` — 3+ generic surplus templates
  - [ ] `market.shortage` — 3+ generic shortage templates
- [ ] Export `PORT_GOSSIP_TEMPLATES` in data.js return block

### 1.2 Generator Functions (~120 lines in generators.js)

- [ ] **`generatePortGossip(state, portKey)`** — main function:
  - Builds priority pool from all categories
  - Priority 3: heat (if `factionAlerts[faction] >= 3`) + contraband (if hold has illegal goods)
  - Priority 2: reputation + fame + infamy (if >= 10)
  - Priority 1: trade hint + local market gossip + hidden port hint
  - Priority 0: ambiance (2 random faction-specific lines)
  - Sorts by priority, returns top 2-4 as `string[]`
- [ ] **`generateTradeHint(state, portKey)`** — helper:
  - Pick random legal resource
  - Find reachable port where that resource is rarer (via `GOODS_AVAILABILITY`)
  - 10% chance of false rumour (points to port where good is common)
  - Returns string or null
- [ ] **`generateLocalMarketGossip(state)`** — helper:
  - Scan `state.portMarket.goods` for >20% deviation from `RESOURCES[good].basePrice`
  - Return surplus or shortage line for the most extreme deviation
  - Only 1 line per visit
  - Returns string or null
- [ ] **`generateHiddenPortHint(state)`** — helper:
  - Check each hidden port's `unlockCondition` against state
  - If player is at ~70% of threshold but hasn't discovered it: return vague hint
  - Never reveal exact conditions
  - Skip if port already in `discoveredPorts`
  - Returns string or null
- [ ] Export `generatePortGossip` in generators.js return block

### 1.3 Reducer Integration (~10 lines)

- [ ] **`engine_port.js` or `engine_combat.js` -> `ENTER_PORT`**: Replace the inline heat gossip code with `portGossip: G.generatePortGossip(newState, portKey)` — the generator handles heat gossip internally via templates

### 1.4 Tests (~30 lines)

- [ ] `generatePortGossip` returns 2-4 strings for any valid port
- [ ] Heat gossip (priority 3) appears when `factionAlerts[faction] >= 3`
- [ ] Contraband gossip appears when hold has tobacco or slaves
- [ ] Trade hint references a real reachable port where the good is rarer
- [ ] Local market gossip appears when `portMarket` has >20% price deviation
- [ ] Hidden port hint appears when player is close to unlock conditions (e.g., fame 35 for Roatan)
- [ ] Hidden port hint does NOT appear when port is already discovered
- [ ] Gossip persists across screen navigation (NAVIGATE does not clear)
- [ ] SAIL_TO clears `portGossip`

---

## Block 2: Heat Cleanup (T2.1 Remaining)

> Small items — heat system is 90% done. Finish the edges.

### Already Done
- [x] `factionAlerts` in state + migration
- [x] All 5 heat triggers (battle, flee, fight, attack merchant, smuggle complete)
- [x] Heat cap at 10
- [x] Decay -1 every 2 days in ADVANCE_DAY
- [x] `maybeRandomPatrol` with heat bonus + rep dampening + cap 0.40
- [x] Patrol strength scales with heat in `checkRandomPatrol`
- [x] Heat gossip on port entry (inline — will move to generator in Block 1)
- [x] MapScreen: heat indicator on hover
- [x] HUD: highest faction heat displayed
- [x] StatusScreen: faction alert section
- [x] Debug panel: set heat per faction

### 2.1 SailingScreen Heat Display (~10 lines)

- [ ] **`screens_voyage.jsx` -> `SailingScreen`**: Show current heat level for origin/destination factions in the provisions/status panel
  - Format: "⚠ Spanish alert: HIGH" or "Spanish waters: CALM"
  - Use `L.getHeatLabel()` for the label
  - Only show if heat > 0 for either origin or destination faction

### 2.2 Optional: Mission Reward Bonus (~5 lines)

- [ ] **`engine_port.js` -> `COMPLETE_MISSION`**: If `factionAlerts[mission.faction] >= 3`, apply +15% gold bonus
  - Log: "Danger pay: +15% mission reward (faction on alert)"
  - Design note: creates tension — the faction you angered pays MORE, but their waters are dangerous

### 2.3 Tests (~30 lines)

- [ ] `maybeRandomPatrol` returns higher chance with heat > 0
- [ ] Rep dampening: allied rep (70+) halves heat effect
- [ ] `DISMISS_BATTLE` (victory) increments `factionAlerts[enemy.faction]` by 3
- [ ] `ADVANCE_DAY` decays factionAlerts (verify -1 every 2 days)
- [ ] Heat caps at 10 (multiple triggers don't exceed cap)
- [ ] Patrol at max infamy + max heat does not exceed 40%

---

## Block 3: Crew Faction Loyalty (T2.2)

> Last — builds on gossip generator (crew-related gossip lines) and heat system.

### Already Done
- [x] M-FIX-1: Victory morale normalized to +5
- [x] M-FIX-2: +3 morale on mission completion
- [x] M-FIX-3: Mutiny negotiation cost scales with crew size
- [x] `generateCrewMember()` includes `tags: []`

### 3.1 Crew Object & Helpers (~20 lines in logic.js + engine_core.js)

- [ ] **`engine_core.js` -> `migrateState()`**: Add `tags: []` to any crew member missing the field:
  ```js
  if (state.crew?.roster) {
    state.crew.roster = state.crew.roster.map(m => ({
      ...m,
      tags: m.tags || [],
    }));
  }
  ```
- [ ] **`logic.js`**: Add tag helper functions:
  - `L.hasTag(member, tag)` -> `(member.tags || []).includes(tag)`
  - `L.addTag(member, tag)` -> `{ ...member, tags: [...(member.tags || []), tag] }`
  - `L.removeTag(member, tag)` -> `{ ...member, tags: (member.tags || []).filter(t => t !== tag) }`
  - `L.crewWithTag(roster, tag)` -> `roster.filter(m => L.hasTag(m, tag))`
- [ ] **`logic.js`**: Add alignment functions:
  - `L.getCrewAlignment(state, faction)` -> fraction of crew matching faction (0.0-1.0)
  - `L.getAlignmentModifier(state, faction)` -> `0.5 + getCrewAlignment(state, faction)` (range 0.5-1.5)
- [ ] Export all new functions in logic.js return block

### 3.2 Alignment Modifier on Morale (~15 lines)

- [ ] **`engine_port.js` -> `COMPLETE_MISSION`**: Modify the +3 morale to use alignment:
  ```js
  const alignment = L.getAlignmentModifier(state, mission.faction);
  const moraleGain = Math.round(3 * alignment);
  ```
- [ ] **`engine_combat.js` -> `DISMISS_BATTLE`** (victory): Add -3 morale * alignment when defeating a faction ship:
  ```js
  const alignment = L.getAlignmentModifier(state, enemy.faction);
  const moralePenalty = Math.round(3 * alignment);
  // Apply: newMorale = Math.max(0, state.crew.morale - moralePenalty)
  ```
- [ ] Log the alignment effect when significant: "Your mostly-Spanish crew is furious about attacking Spanish ships."

### 3.3 Upset & Desertion (~40 lines)

- [ ] **`engine_combat.js` -> `DISMISS_BATTLE`** (victory): For each crew member where `faction === enemy.faction`:
  - 15% chance -> add `upset` tag
  - Log by name: "Juan Rodriguez is disturbed by the attack on Spanish ships."
  - Skip if member already has `upset` tag
- [ ] **`engine_combat.js` -> `ENTER_PORT`**: For each crew member with `upset` tag:
  - Base desert chance: 30%
  - If morale > 60: desert chance drops to 10%
  - If member has `mutineer` tag: desert chance x2
  - If port faction matches member faction: desert chance +20%
  - If member has `trait_loyal` tag (T3 future): never deserts
  - **If desert roll succeeds:**
    - Remove from roster
    - Log: "Juan Rodriguez has left the crew. He could not forgive the attack on Spanish ships."
  - **If desert roll fails:**
    - Remove `upset` tag
    - Log: "Juan Rodriguez seems to have settled down."
- [ ] **`engine_combat.js` -> `RESOLVE_EVENT`** (mutiny): Tag 30% of crew as `mutineer`:
  - Shuffle roster, take first `ceil(roster.length * 0.3)`, add `mutineer` tag
  - `mutineer` tag is permanent (never cleared)

### 3.4 Crew UI (~30 lines in screens_port.jsx)

- [ ] **CrewScreen** -> Crew manifest: Add faction colour dot per member:
  - Small circle with `FACTIONS[member.faction].color` next to role icon
- [ ] **CrewScreen** -> Upset indicator: ⚠ icon on crew members with `upset` tag
- [ ] **CrewScreen** -> Crew composition summary at top:
  - "English: 5 · Spanish: 3 · Pirate: 12"
  - Use `FACTIONS[faction].color` for each count
- [ ] **CrewScreen** -> Tooltip on upset member shows: "Upset — disturbed by attack on [faction] ships"

### 3.5 Gossip Integration (~5 lines)

- [ ] Add crew-related gossip line to `generatePortGossip` (priority 2):
  - If any crew member has `upset` tag: "Some of your crew seem uneasy. They avoid eye contact."
  - If >50% crew matches port faction: "Your crew fits right in here. The locals treat them as their own."
  - If 0% crew matches port faction: "Your crew draws curious looks. They're clearly not from around here."

### 3.6 Tests (~40 lines)

- [ ] `getCrewAlignment` returns correct ratio for various roster compositions
- [ ] `getAlignmentModifier` returns 0.5 for empty roster, 1.5 for all-matching
- [ ] `hasTag`, `addTag`, `removeTag` work correctly
- [ ] `DISMISS_BATTLE` adds `upset` tag to matching-faction crew (probabilistic — run multiple times)
- [ ] `ENTER_PORT` desertion: upset member either deserts or calms down
- [ ] `ENTER_PORT` desertion: `mutineer` tag doubles desert chance
- [ ] `COMPLETE_MISSION` applies +3 * alignment morale
- [ ] `DISMISS_BATTLE` applies -3 * alignment morale penalty
- [ ] `RESOLVE_EVENT` (mutiny) tags 30% of crew as `mutineer`
- [ ] `migrateState` adds `tags: []` to crew members from old saves

---

## Dependency Map

```
Block 1: Gossip Generator
  ├── no dependencies (self-contained)
  └── produces: G.generatePortGossip() — shared output channel

Block 2: Heat Cleanup
  ├── depends on: Block 1 (gossip replaces inline heat lines)
  └── produces: complete heat system

Block 3: Crew Loyalty
  ├── depends on: Block 1 (crew gossip lines plug into generator)
  ├── depends on: Block 2 (heat system complete for full patrol pressure test)
  └── produces: complete T2 feature set
```

---

## Definition of Done (all of T2)

### Heat (T2.1)
- [x] Heat triggers on aggressive actions
- [x] Heat decays automatically
- [x] Patrol chance scales with heat
- [x] Heat visible in HUD, map, status screen
- [ ] Heat visible on SailingScreen
- [ ] Heat tests pass

### Gossip (T2.3/T2.4/T2.5)
- [ ] PORT_GOSSIP_TEMPLATES in data.js with all categories
- [ ] G.generatePortGossip() returns 2-4 priority-sorted lines
- [ ] Heat, contraband, reputation, fame, infamy, trade, market, hidden port gossip all working
- [ ] Inline heat gossip in ENTER_PORT replaced by generator call
- [ ] Gossip tests pass

### Crew Loyalty (T2.2)
- [ ] Tag helpers in logic.js
- [ ] Old saves migrated (tags: [])
- [ ] Alignment modifier on mission completion morale
- [ ] Morale penalty when attacking own-faction ships
- [ ] 15% upset trigger on crew from defeated faction
- [ ] Desertion at port (30% base, modified by morale/port faction/mutineer tag)
- [ ] Mutineer tag on mutiny survivors
- [ ] Crew UI shows factions, upset icons, composition
- [ ] Crew gossip lines in generator
- [ ] Crew loyalty tests pass

### Overall
- [ ] Economy sim (tests/sim.html) shows no regression
- [ ] Balance dashboard (tests/tests_balance.html) renders cleanly
- [ ] All existing tests still pass
