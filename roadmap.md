# Broadside – Development Roadmap

The original phases are expanded to include new gameplay ideas and the long-term endgame.

Each phase is designed to build on the previous one while minimising dependencies and avoiding major rewrites.

---

# 🧭 Phase 1 – Player Progression & the Endgame

> **Complexity:** Low → Medium  
> **Goal:** Give every action meaning and create long-term motivation.

| Feature | Why | Complexity | Dependencies |
|---|---|---|---|
| Fame unlocks ships / upgrades / missions | Rewards combat, trade, and exploration | Low | None |
| Fame displayed in HUD | Improves visibility and feedback | Trivial | None |
| Reputation perks | Makes diplomacy meaningful | Low | Fame can influence reputation gain |
| Crew specialists | Adds strategic depth and personality | Medium | None |
| Bounty system | Creates late-game tension | Medium | Fame + negative reputation |
| Retirement & Endgame | Gives closure and replayability | Medium | Fame, gold, ship value, crew |

## Reputation Perk Examples

- **Allied:** `-10%` repair cost
- **Hostile:** `+20%` gold from plunder

## Crew Specialist Examples

- Gunner
- Navigator
- Doctor

## Endgame Ideas

- Final score screen
- Text epilogues
- New Game+
- Retirement options

### Benefits

- Long-term player goals
- Stronger progression loop
- Every system contributes to final scoring

### Estimated Effort

`~5–7 development sessions`

---

# 💰 Phase 2 – Trading & Economy

> **Complexity:** Medium  
> **Goal:** Enable peaceful progression and deeper resource management.

| Feature | Why | Complexity | Dependencies |
|---|---|---|---|
| Cargo capacity per ship | Balances trade vs combat | Low | None |
| Goods per port | Creates natural trade routes | Medium | Cargo system |
| Dynamic prices | Encourages speculation | Medium | Goods system |
| Trade missions | Integrates economy with missions | Low | Dynamic prices |
| Contraband goods | Adds risk/reward gameplay | Medium | Goods + event integration |

## Example Systems

### Cargo Capacity

```js
ship.cargoSlots = 12;
```

### Dynamic Prices

- Prices fluctuate daily
- Prices react to player trading activity
- Regional shortages and surpluses possible

### Contraband Gameplay

- Illegal goods in certain ports
- Random inspections
- Reputation penalties
- Smuggling opportunities

### Benefits

- New non-combat playstyle
- Increased replayability
- Longer game sessions

### Estimated Effort

`~6–10 development sessions`

---

# 🌍 Phase 3 – Procedural Generation

> **Complexity:** High  
> **Goal:** Make every playthrough unique.

| Feature | Why | Complexity | Dependencies |
|---|---|---|---|
| Procedural missions & events | Endless variation | Medium | Existing mission/event systems |
| Procedural ports & maps | Sandbox exploration | High | Trading systems |
| Faction wars & alliances | Living world simulation | Medium | Reputation + world systems |
| Procedural weather | Tactical depth and immersion | High | Sailing/combat systems |
| Seeded randomness | Replayable worlds | Low | Procedural systems |

## Planned Systems

### Procedural Missions

Generated using:

- Faction
- Risk level
- Fame
- Reputation
- Port ownership
- Distance

### Procedural Maps

Generated data includes:

- Port names
- Coordinates
- Factions
- Wind regions
- Trade goods

### Dynamic World Events

- Wars
- Peace treaties
- Pirate uprisings
- Economic booms
- Naval blockades

### Weather Effects

- Storms
- Fog
- Doldrums
- Strong winds

### Why This Phase Comes Later

Procedural systems depend heavily on stable:

- Mission systems
- Trading systems
- Reputation systems
- World generation rules

Building those foundations first reduces rewrite risk.

### Estimated Effort

`Long-term / multi-month phase`

Recommended order:

1. Procedural missions/events
2. Procedural maps
3. Dynamic wars
4. Weather systems

---

# 💾 Phase 4 – Robust Save / Load

> **Complexity:** Medium  
> **Goal:** Protect long campaigns and support experimentation.

| Feature | Why | Complexity | Dependencies |
|---|---|---|---|
| JSON export/import | Backups and sharing | Low | None |
| Auto-save | Prevent progress loss | Low | None |
| Multiple save slots | Experimentation | Medium | JSON saves |
| IndexedDB storage | Larger saves | Medium | Stable state shape |

## Planned Features

### JSON Export

```json
{
  "saveVersion": 1,
  "day": 42,
  "gold": 12800
}
```

### Auto-Save

Triggered automatically on:

- `ADVANCE_DAY`
- Port entry
- Mission completion

### Multiple Save Slots

- Manual saves
- Autosaves
- Quick saves

### IndexedDB Benefits

- Much larger storage limits
- Async storage
- Better long-run support

### Recommended Timing

This phase should happen:

- After economy systems stabilise
- Before large procedural systems

### Estimated Effort

`~2–4 development sessions`

---

# 🎨 Phase 5 – Visual & Audio Polish

> **Complexity:** Low → Medium  
> **Goal:** Improve immersion without external assets.

| Feature | Why | Complexity | Dependencies |
|---|---|---|---|
| Procedural ship hulls | Unique ship identity | Medium | None |
| Procedural port flags | Visual variety | Low | None |
| Weather effects | Immersion | Medium | Weather systems |
| Sea shanties | Atmosphere | Medium | None |
| UI animations | Overall polish | Low–Medium | None |

## Visual Systems

### Procedural Ship Hulls

Generated SVG hull shapes based on:

- Ship class
- Size
- Faction
- Random seed

### Port Flags

Flags generated using:

- Faction colours
- Procedural symbols
- Regional styling

### Weather Effects

Visual effects may include:

- Rain
- Lightning
- Fog
- Sea spray
- Wave motion

---

## Audio Systems

### Sea Shanties

Generated dynamically using:

- Wind intensity
- Crew morale
- Region
- Battle state

Potential implementation:

- Web Audio API
- Procedural melody generation

---

## UI Polish

### Planned Improvements

- Screen transitions
- Combat shake effects
- Smooth HUD animations
- Tooltip fades
- Animated sailing effects

### Estimated Effort

`Ongoing / optional polish phase`

---

# 🗺️ Overall Development Flow

```text
Phase 1 ─── Progression & Endgame
   │
Phase 2 ─── Trading & Economy
   │
Phase 4 ─── Save/Load Upgrade
   │
Phase 3 ─── Procedural Generation
   │
Phase 5 ─── Visual & Audio Polish
```

---

# 📌 Why This Order?

This roadmap prioritises:

- Stable foundations first
- Minimal rewrites
- Clear progression between systems
- Scalable architecture

Each phase builds naturally on the previous one while keeping the project maintainable and extensible.

---

# 🏴☠️ Long-Term Vision

Broadside aims to evolve from a simple naval strategy game into:

- A replayable sandbox
- A procedural pirate simulation
- A story generator
- A full “pirate career” experience

With modular systems, deterministic testing, and procedural generation, the architecture is designed to scale gradually without losing maintainability.