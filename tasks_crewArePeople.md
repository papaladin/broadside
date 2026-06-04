# Tier 3 — Crew Become People (Revised)

> Activate what's planted. No new data fields — everything uses existing `tags: []`.
> Total estimated: ~140 lines across 5 files. 3 sprints, ~5 hours.

---

## Design Decisions (Locked)

| Decision | Detail |
|---|---|
| **Tag pattern** | `hidden_X` → trigger fires → remove `hidden_X`, add `revealed_X`. Display filters out `hidden_*`. |
| **Trait assignment** | 5% chance on any hired crew (max 1 trait). Marooned sailors keep 40% from event. |
| **Reveal mechanism** | Trigger-based, not timer-based. First time trait fires, it's revealed with a named log entry. |
| **Scars** | Permanent visible tags. Pure flavour — no mechanical effect. |
| **Veteran** | Flavour badge at 100+ days. No gameplay effect. |
| **Loyal** | 200+ days AND no `upset` tag AND crew member's faction rep ≥ 80. Immune to upset + desertion. |
| **Crew stats counters** | Deferred. Scars tell the story for now. |
| **Detail card** | Generated paragraph from tag combinations. Scar icons with tooltips. |
| **New data fields** | **None.** Everything uses the existing `tags: string[]` array. |

---

## Tag Catalogue (Complete After T3)

### Hidden Traits (assigned on hire, revealed on first trigger)

| Tag (hidden) | Tag (revealed) | Assigned By | Chance | Effect |
|---|---|---|---|---|
| `hidden_drunkard` | `revealed_drunkard` | Hire (2%), Marooned sailors (40%) | 2% on hire | Consumes 1 rum at port. No rum → morale −2 for self. |
| `hidden_coward` | `revealed_coward` | Hire (1%), Marooned sailors (40%) | 1% on hire | High-risk/assault mission accepted → −3 global morale. |
| `hidden_troublemaker` | `revealed_troublemaker` | Hire (1%), Marooned sailors (40%) | 1% on hire | 10% chance at port of brawl: −5 morale, −50g fine. |
| `hidden_greedy` | `revealed_greedy` | Hire (1%), Marooned sailors (40%) | 1% on hire | Mission completion → demands 50g or becomes `upset`. |

### Status Tags (system-managed)

| Tag | Assigned By | Effect |
|---|---|---|
| `upset` | Battle vs own faction (15%) | 30% desert at port (10% if morale > 60). |
| `mutineer` | Mutiny crush (30% of crew) | 2× desert chance when upset. Permanent. |

### Scars (permanent, visible, no mechanical effect)

| Tag | Assigned When | Display | Icon |
|---|---|---|---|
| `scar_shipwreck` | Drifting Wreck survivor event | "Shipwreck Survivor" | 🚢 |
| `scar_battle` | Survives battle where ≥ 3 crew die | "Battle-Scarred" | ⚔ |
| `scar_storm` | Survives storm random event | "Storm Survivor" | 🌊 |
| `scar_mutiny` | Survives mutiny event (either outcome) | "Mutiny Survivor" | ⚓ |
| `scar_grapple` | Survives a grapple boarding victory | "Boarding Veteran" | 🪝 |

### Positive Tags (earned over time)

| Tag | Condition | Effect | Display |
|---|---|---|---|
| `seasoned` | `daysAboard >= 50` | Desert chance halved (15% instead of 30%). | "Seasoned" badge |
| `veteran` | `daysAboard >= 100` | **Flavour only** — no mechanical effect. | "Veteran" badge |
| `loyal` | `daysAboard >= 200` AND no `upset` tag AND faction rep ≥ 80 | Immune to `upset`. Never deserts. | "Loyal" badge |

---

# Sprint 1 — Trait Effects + Reveal (~2-3 hours)

## 1.1 Random trait assignment on hire

**File:** `generators.js` → `generateCrewMember()`  
**Lines:** ~8

### Tasks

- [ ] After creating the member, roll for one hidden trait (max 1):
  ```js
  const traitRoll = Math.random();
  if      (traitRoll < 0.02) member.tags.push("hidden_drunkard");
  else if (traitRoll < 0.03) member.tags.push("hidden_coward");
  else if (traitRoll < 0.04) member.tags.push("hidden_greedy");
  else if (traitRoll < 0.05) member.tags.push("hidden_troublemaker");
  // 95%: no trait
  ```
- [ ] Keep marooned sailors event at 40% (already handled by `negativeTagChance` in `addCrew` outcome).
- [ ] Update marooned sailors `negativeTagChance` pool to use `hidden_` prefix:
  ```js
  const negativeTags = ["hidden_troublemaker", "hidden_drunkard", "hidden_coward", "hidden_greedy"];
  ```

### Acceptance criteria

- [ ] ~5% of hired crew have a hidden trait.
- [ ] Marooned sailors have ~40% chance.
- [ ] Max 1 trait per crew member at hire.
- [ ] Hidden tags are not visible in CrewScreen (filtered by `hidden_` prefix).

---

## 1.2 Trait effects + reveal

**Files:** `engine_port.js`, `engine_combat.js`  
**Lines:** ~50 total

### Helper: Reveal function

```js
// Use in any reducer when a hidden trait fires for the first time
function revealTrait(member, traitName, log, message) {
  const hiddenTag = "hidden_" + traitName;
  const revealedTag = "revealed_" + traitName;
  if (member.tags?.includes(hiddenTag)) {
    member = L.removeTag(member, hiddenTag);
    member = L.addTag(member, revealedTag);
    log.push(message);
  }
  return member;
}
```

### Drunkard — Consumes rum at port

**Where:** `engine_port.js` → `ENTER_PORT` (or wherever port entry logic runs)

- [ ] For each crew member with `hidden_drunkard` or `revealed_drunkard`:
  - If hold has rum > 0: consume 1 rum from hold.
  - If hold has no rum: morale −2 (the drunkard is miserable).
  - If still `hidden_drunkard`: reveal with log:
    > *"[Name] has been drinking your rum stores. A drunkard, it seems."*
  - If already `revealed_drunkard`: shorter log:
    > *"[Name] helped himself to the rum again."* (only if rum consumed, 50% chance to log)

### Coward — Morale penalty on dangerous missions

**Where:** `engine_port.js` → `TAKE_MISSION`

- [ ] When accepting a mission with `risk === "high"` or `type === "assault"`:
  - For each crew member with `hidden_coward` or `revealed_coward`:
    - Apply: morale −3 (global).
    - If still `hidden_coward`: reveal with log:
      > *"[Name] is visibly shaking. He didn't sign up for this kind of work."*
    - If already `revealed_coward`: shorter log:
      > *"[Name] looks terrified. Again."* (only first coward, not all)
    - Only one coward penalty per mission acceptance (not stacking).

### Troublemaker — Brawl at port

**Where:** `engine_port.js` → `ENTER_PORT` (or `engine_combat.js` depending on where ENTER_PORT lives)

- [ ] For each crew member with `hidden_troublemaker` or `revealed_troublemaker`:
  - 10% chance of starting a brawl.
  - If brawl: morale −5, gold −50 (or gold −0 if can't afford, morale −8 instead).
  - If still `hidden_troublemaker`: reveal with log:
    > *"[Name] started a brawl in the tavern. You're paying for the damage."*
  - If already `revealed_troublemaker`: shorter log:
    > *"[Name] has been in another fight. The harbourmaster is not amused."*
  - Max 1 brawl per port visit (even if multiple troublemakers).

### Greedy — Demands bonus on mission completion

**Where:** `engine_port.js` → `COMPLETE_MISSION`

- [ ] For each crew member with `hidden_greedy` or `revealed_greedy`:
  - Demands: 50g bonus.
  - If gold ≥ 50: deduct 50g. Log the demand.
  - If gold < 50: crew member becomes `upset`. Log the refusal.
  - If still `hidden_greedy`: reveal with log:
    > *"[Name] demands a larger share. 'I did my part,' he says, hand out."*
  - If already `revealed_greedy`: shorter log:
    > *"[Name] demands his usual cut."*
  - Only one greedy demand per mission (not stacking).

### Acceptance criteria

- [ ] Each of the 4 traits has a visible, named gameplay effect.
- [ ] First trigger reveals the trait (hidden_ → revealed_) with a log entry naming the crew member.
- [ ] Subsequent triggers use shorter log messages.
- [ ] Effects are not overwhelming (one brawl max, one coward penalty max, etc.).
- [ ] Player learns crew personalities through gameplay, not through the manifest.

---

## 1.3 Display: filter hidden tags

**File:** `screens_port.jsx` → `CrewScreen`  
**Lines:** ~3

- [ ] Filter crew tags for display:
  ```js
  const visibleTags = (member.tags || []).filter(t => !t.startsWith("hidden_"));
  ```
- [ ] Use `visibleTags` for all tag rendering in CrewScreen.
- [ ] Hidden traits are completely invisible until revealed.

---

# Sprint 2 — Scars + Positive Traits (~2 hours)

## 2.1 Scars — Event memory tags

**Files:** `engine_combat.js`, `engine_voyage.js`  
**Lines:** ~25

### Tasks

- [ ] **`scar_battle`** — in `DISMISS_BATTLE` (victory), if ≥ 3 crew died in the battle:
  - Add `scar_battle` to all surviving crew who don't already have it.
  - No log needed (the battle log is enough context).

- [ ] **`scar_storm`** — in `RESOLVE_EVENT` (storm event):
  - Add `scar_storm` to all surviving crew who don't already have it.

- [ ] **`scar_mutiny`** — in `RESOLVE_EVENT` (mutiny event, both outcomes):
  - Add `scar_mutiny` to all surviving crew who don't already have it.

- [ ] **`scar_grapple`** — in `BATTLE_ACTION` (grapple instant victory):
  - Add `scar_grapple` to all crew who don't already have it.

- [ ] **`scar_shipwreck`** — already exists from Drifting Wreck event. ✅

### Acceptance criteria

- [ ] Scars are permanent — never removed.
- [ ] Scars are visible immediately (no hidden_ prefix — scars are earned, not discovered).
- [ ] No duplicate tags (check before adding).
- [ ] A crew member who survived a battle, a storm, and a mutiny has 3 scar tags telling their story.

---

## 2.2 Positive traits — Earned over time

**File:** `engine_port.js` → `ENTER_PORT` or `engine_voyage.js` → `ADVANCE_DAY`  
**Lines:** ~25

### Where to check

Best place: `ENTER_PORT` — the player is in port, naturally a moment of reflection. Check each crew member's `daysAboard` and state conditions.

### Tasks

- [ ] **`seasoned`** — `daysAboard >= 50`:
  - Add tag if not present.
  - Log (first time only):
    > *"[Name] has found their sea legs. A seasoned hand now."*
  - **Effect:** Desert chance halved (15% base instead of 30%) — modify desertion check in `ENTER_PORT`.

- [ ] **`veteran`** — `daysAboard >= 100`:
  - Add tag if not present.
  - Log (first time only):
    > *"[Name] has served 100 days aboard. A true veteran."*
  - **Effect:** Flavour only. No mechanical change. The badge IS the reward.

- [ ] **`loyal`** — ALL three conditions must be true:
  1. `daysAboard >= 200`
  2. Does NOT have `upset` tag currently
  3. Player's reputation with `member.faction` ≥ 80 (at ANY port of that faction)
  - Add tag if not present.
  - Log (first time only):
    > *"[Name] has pledged their loyalty. 'This ship is my home now, Captain.'"*
  - **Effect:** Immune to `upset` tag. Never deserts. (Check in DISMISS_BATTLE upset logic + ENTER_PORT desertion logic.)

### Checking faction rep for loyal

```js
// In the loyal check:
const memberFaction = member.faction;
const factionPorts = Object.keys(D.PORTS).filter(k => D.PORTS[k].faction === memberFaction);
const maxRep = Math.max(...factionPorts.map(k => state.reputation[k] || 0));
const isAllied = maxRep >= 80;
```

This checks if ANY port of the crew member's faction has rep ≥ 80, not an average. The player only needs to be allied with one port of that faction — they don't need to be allied with all Spanish ports, just one.

### Desertion logic updates

In `ENTER_PORT` desertion check, add:

```js
// Skip loyal crew entirely
if (L.hasTag(member, "loyal")) continue;

// Seasoned crew: halved desert chance
if (L.hasTag(member, "seasoned")) desertChance *= 0.5;
```

In `DISMISS_BATTLE` upset check, add:

```js
// Loyal crew never get upset
if (L.hasTag(member, "loyal")) continue;
```

### Acceptance criteria

- [ ] Seasoned at 50 days, veteran at 100, loyal at 200 (with conditions).
- [ ] Loyal requires: 200d + no upset + faction rep ≥ 80.
- [ ] Loyal crew immune to upset and desertion.
- [ ] Seasoned crew have halved desertion chance.
- [ ] Veteran is flavour only — visible badge, no mechanic.
- [ ] Log entries name the crew member when threshold is crossed.
- [ ] Tags are permanent once earned (never removed).

---

# Sprint 3 — Crew Detail Card (~1-2 hours)

## 3.1 Generated paragraph from tags

**File:** `generators.js` or `screens_port.jsx`  
**Lines:** ~40

### Purpose

Instead of displaying raw tag names, generate a readable paragraph that tells the crew member's story from their tag combination.

### Generator function

```js
// generators.js or inline in screens_port.jsx
function generateCrewBio(member, state) {
  const lines = [];
  const days = member.daysAboard || 0;
  const name = member.firstName;

  // Opening — based on time aboard
  if (days < 15) lines.push(`${name} is new aboard. Time will tell what kind of sailor they are.`);
  else if (days < 50) lines.push(`${name} has been aboard for ${days} days. Still settling in.`);
  else if (days < 100) lines.push(`${name} is a seasoned hand with ${days} days at sea on this ship.`);
  else if (days < 200) lines.push(`${name} is a veteran of ${days} days. The crew looks up to them.`);
  else lines.push(`${name} has served ${days} days. This ship is their life now.`);

  // Scars
  const scars = [];
  if (member.tags?.includes("scar_battle")) scars.push("a deadly battle");
  if (member.tags?.includes("scar_storm")) scars.push("a violent storm");
  if (member.tags?.includes("scar_mutiny")) scars.push("a mutiny");
  if (member.tags?.includes("scar_grapple")) scars.push("a boarding action");
  if (member.tags?.includes("scar_shipwreck")) scars.push("a shipwreck");
  if (scars.length === 1) lines.push(`They survived ${scars[0]}.`);
  else if (scars.length > 1) lines.push(`They survived ${scars.slice(0, -1).join(", ")} and ${scars[scars.length - 1]}.`);

  // Revealed traits
  if (member.tags?.includes("revealed_drunkard")) lines.push("Known to drink more than their share.");
  if (member.tags?.includes("revealed_coward")) lines.push("Tends to lose nerve when things get dangerous.");
  if (member.tags?.includes("revealed_troublemaker")) lines.push("Has a talent for starting fights ashore.");
  if (member.tags?.includes("revealed_greedy")) lines.push("Always looking for a bigger cut.");

  // Status
  if (member.tags?.includes("loyal")) lines.push("Loyal to the ship and the captain. They will never leave.");
  if (member.tags?.includes("mutineer")) lines.push("Was part of a mutiny once. Watch them carefully.");
  if (member.tags?.includes("upset")) lines.push("Upset about recent events. May desert at the next port.");

  return lines.join(" ");
}
```

### Example outputs

**New hire, no tags:**
> *"Maria is new aboard. Time will tell what kind of sailor they are."*

**Veteran with scars and a revealed trait:**
> *"Juan is a veteran of 127 days. The crew looks up to them. They survived a deadly battle and a violent storm. Known to drink more than their share."*

**Loyal old salt:**
> *"Pieter has served 230 days. This ship is their life now. They survived a mutiny and a boarding action. Loyal to the ship and the captain. They will never leave."*

---

## 3.2 Scar icons with tooltips

**File:** `screens_port.jsx` → `CrewScreen` detail card  
**Lines:** ~20

### Tasks

- [ ] Display scar icons in a row above the bio paragraph:
  ```
  ⚔ 🌊 ⚓ 🪝 🚢
  ```
- [ ] Each icon has a tooltip showing the scar name:
  - ⚔ → "Battle-Scarred"
  - 🌊 → "Storm Survivor"
  - ⚓ → "Mutiny Survivor"
  - 🪝 → "Boarding Veteran"
  - 🚢 → "Shipwreck Survivor"
- [ ] Only show icons for scars the member actually has.
- [ ] If no scars: no icon row displayed.

### Scar icon map

```js
const SCAR_ICONS = {
  scar_battle: { icon: "⚔", label: "Battle-Scarred" },
  scar_storm: { icon: "🌊", label: "Storm Survivor" },
  scar_mutiny: { icon: "⚓", label: "Mutiny Survivor" },
  scar_grapple: { icon: "🪝", label: "Boarding Veteran" },
  scar_shipwreck: { icon: "🚢", label: "Shipwreck Survivor" },
};
```

---

## 3.3 Veteran label in crew manifest

**File:** `screens_port.jsx` → `CrewScreen`  
**Lines:** ~10

### Tasks

- [ ] In the crew manifest grid (the icon tiles), add a subtle indicator for veterans:
  - `veteran` or `loyal`: gold border on tile.
  - `seasoned`: slightly brighter border.
  - `upset`: red/orange border (already exists as ⚠).
  - `mutineer`: purple border.
- [ ] In the detail card header, show the label:
  ```
  Juan Rodríguez
  🟡 Spanish Gunner — Veteran (127 days)
  ```
- [ ] Labels:
  ```
  < 15 days:   "New Hand"
  15-49 days:  "Crew"
  50-99 days:  "Seasoned"
  100-199 days: "Veteran"
  200+ days:   "Old Salt"
  ```

---

## 3.4 Full detail card layout

### Suggested display

```
──────────────────────────────────
Juan Rodríguez
🟡 Spanish Gunner — Veteran (127 days)

⚔ 🌊     ← scar icons (hover for tooltip)

"Juan is a veteran of 127 days. The crew
looks up to them. They survived a deadly
battle and a violent storm. Known to drink
more than their share."

Tags: ⚠ Upset · 🍺 Drunkard
──────────────────────────────────
```

---

# Complexity Estimate

| Sprint | What | Lines | Time |
|---|---|---|---|
| **Sprint 1** | Trait assignment + 4 effects + reveal | ~60 | 2-3 hours |
| **Sprint 2** | 5 scars + 3 positive traits + desertion updates | ~50 | 2 hours |
| **Sprint 3** | Bio generator + scar icons + veteran labels + detail card | ~70 | 1-2 hours |
| **Total** | | **~180 lines** | **~5-7 hours** |

---

# Files Changed

| File | Changes |
|---|---|
| `generators.js` | Trait roll in `generateCrewMember` + `generateCrewBio` function |
| `engine_port.js` | Drunkard/troublemaker/greedy effects in ENTER_PORT + COMPLETE_MISSION. Positive trait checks. Seasoned/loyal in desertion logic. |
| `engine_combat.js` | Coward check in TAKE_MISSION. Scar assignment in DISMISS_BATTLE + BATTLE_ACTION. Loyal immunity in upset check. Scar on mutiny. |
| `engine_voyage.js` | Scar on storm event. |
| `screens_port.jsx` | Filter hidden_ tags. Bio paragraph. Scar icons. Veteran labels. Detail card layout. |
| `data.js` | Update marooned sailors negativeTagChance pool to `hidden_` prefix. |

---

# Definition of Done

- [ ] ~5% of hired crew have one hidden trait. Marooned sailors have ~40%.
- [ ] Hidden traits are invisible in CrewScreen until revealed.
- [ ] Each of the 4 traits has a named gameplay effect that fires in the relevant reducer.
- [ ] First trigger reveals the trait with a log entry naming the crew member.
- [ ] Subsequent triggers use shorter log messages (not spammy).
- [ ] Survivors of battles (≥3 dead), storms, mutinies, grapples, and shipwrecks earn scar tags.
- [ ] Scars are permanent, visible, and displayed as icons with tooltips in the detail card.
- [ ] Crew earn `seasoned` (50d), `veteran` (100d), `loyal` (200d + no upset + faction rep ≥ 80).
- [ ] Seasoned crew: halved desertion chance.
- [ ] Loyal crew: immune to upset, never desert.
- [ ] Veteran: flavour badge only — no mechanical effect.
- [ ] Crew detail card shows generated bio paragraph from tag combinations.
- [ ] Bio reads naturally for any combination of scars, traits, and status.
- [ ] No new data fields on crew member objects — only tags.
- [ ] Old saves work (migrateState already adds tags: []).
- [ ] Crew sim (tests/crew_sim.html) shows no regression in lifecycle balance.
