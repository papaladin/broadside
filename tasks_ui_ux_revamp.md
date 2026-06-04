# Text Presentation & Narrative UX — Detailed Task List

> Goal: make the text-first parts of **Broadside — Caribbean 1695** more visible, readable, atmospheric, and worth engaging with.
>
> Scope: Captain’s Log, Port Gossip, Mission descriptions, Combat logs, Event text, Crew detail/history, and future Journal/Rumour memory.
>
> Recommended implementation approach: **small presentation wins first**, then structured logs/journal later.

---

## 0. Current Situation / Baseline

The game now has several strong narrative text sources:

- **Port gossip** generated through `G.generatePortGossip()` and displayed in `PortScreen` under `WORD ON THE DOCKS`.
- **Captain’s Log** fed by many reducers: arrivals, battle outcomes, market actions, crew desertion, discoveries, mission completion, and event results.
- **Combat logs** stored in `battleState.log`, with battle round/action text and crew loss details.
- **Mission descriptions** shown directly in mission cards, alongside rewards, cargo requirements, and enemy info.
- **Crew detail text** in `CrewScreen`, including faction, role, days aboard, tags, tag legend, and selected crew card.

The content is strong, but the UI still often presents narrative text as secondary helper text. The objective of this task list is to make narrative text feel like a primary feature of the game.

---

## 1. Implementation Principles

### 1.1 Prioritize readability before adding new systems

- [ ] Increase narrative text size slightly where appropriate.
- [ ] Increase line height for narrative blocks.
- [ ] Add spacing between narrative lines.
- [ ] Avoid dense walls of small text.
- [ ] Use consistent narrative panel styling across screens.

### 1.2 Separate atmospheric text from mechanical text

- [ ] Atmospheric text should be visually distinct from buttons, stats, and rewards.
- [ ] Mechanical results should remain easy to scan.
- [ ] Important events should not be buried in generic log lines.

### 1.3 Use visual language consistently

- [ ] Use icons for categories: arrival, gossip, crew, combat, trade, discovery, heat, infamy.
- [ ] Use color accents for category/tone.
- [ ] Use panels, borders, and spacing to signal importance.

### 1.4 Keep first pass low-risk

- [ ] Avoid changing `state.log` from strings to objects in the first pass.
- [ ] Start with rendering heuristics/prefixes.
- [ ] Introduce reusable UI components gradually.
- [ ] Leave the larger Captain’s Journal for a later phase.

---

# Phase 1 — Quick Text Presentation Pass

> Highest return for the least disruption.
>
> Target files: mostly `screens_port.jsx`, shared UI helpers, later `screens_combat.jsx` / wherever battle UI is rendered.

---

## 1.1 Add reusable narrative UI primitives

**Player impact:** Very high  
**Code impact:** Medium  
**Priority:** P0

### Purpose

Create a consistent visual language for text that the player should read for atmosphere or story.

### Tasks

- [ ] Add a reusable `NarrativePanel` UI helper/component.
- [ ] Add a reusable `NarrativeLine` or `RumourLine` helper/component.
- [ ] Add a reusable `LogLine` helper/component.
- [ ] Add a reusable `NoticeBanner` helper/component, even if not used immediately.

### Suggested component responsibilities

#### `NarrativePanel`

- [ ] Accept `title`.
- [ ] Accept `icon`.
- [ ] Accept `tone` / `variant`.
- [ ] Accept children content.
- [ ] Apply consistent background, border, spacing, and typography.

Suggested variants:

```js
"neutral"   // default story text
"gossip"    // port rumours / ambient world text
"danger"    // heat, threat, combat warnings
"crew"      // crew loyalty, desertion, mutiny
"discovery" // hidden ports, map fragments, special findings
"trade"     // market hints, trade information
```

#### `NarrativeLine`

- [ ] Use larger text than tiny metadata.
- [ ] Use `lineHeight: 1.55` or more.
- [ ] Add margin between lines.
- [ ] Optionally add opening quote styling for gossip.

#### `LogLine`

- [ ] Detect or receive a category.
- [ ] Render icon + color + text.
- [ ] Keep mechanical lines compact.
- [ ] Make crew/combat/discovery lines stand out.

### Acceptance criteria

- [ ] A narrative panel can be used without duplicating inline styles.
- [ ] The panel visually differs from normal stat panels.
- [ ] The player can immediately tell “this is story text”.
- [ ] Existing screens still render with no layout break.

---

## 1.2 Upgrade `WORD ON THE DOCKS`

**Player impact:** Very high  
**Code impact:** Low-Medium  
**Priority:** P0

### Current state

`PortScreen` already renders `state.portGossip` in a panel titled `WORD ON THE DOCKS`.

### Goal

Make port gossip feel like a premium text feature, not a small aside.

### Tasks

- [ ] Replace current inline gossip panel with `NarrativePanel` variant `gossip`.
- [ ] Change title to `🗣 WORD ON THE DOCKS`.
- [ ] Increase gossip text font size from very small to comfortable narrative size.
- [ ] Increase line height.
- [ ] Add vertical spacing between gossip lines.
- [ ] Render each gossip line as its own line/block.
- [ ] Keep italic styling, but avoid making text too faint.
- [ ] Add subtle gold or muted border accent.
- [ ] Ensure the panel remains above service buttons.

### Suggested layout

```text
🗣 WORD ON THE DOCKS

“The harbourmaster checks papers more carefully than usual.”
“A trader whispers that silk is scarce in Curaçao.”
“Children point at your flag. Sailors trade stories about you.”
```

### Acceptance criteria

- [ ] Gossip is one of the most visually noticeable parts of the PortScreen.
- [ ] Gossip remains readable on small screens.
- [ ] The player sees gossip before interacting with services.
- [ ] No duplicate rendering or weird spacing when there are 2, 3, or 4 gossip lines.

---

## 1.3 Improve global narrative typography

**Player impact:** High  
**Code impact:** Low  
**Priority:** P0

### Tasks

- [ ] Define text sizes for narrative content.
- [ ] Define text sizes for mechanical metadata.
- [ ] Define line-height constants.
- [ ] Apply narrative size/line-height to:
  - [ ] Port description.
  - [ ] Gossip lines.
  - [ ] Mission description.
  - [ ] Event description.
  - [ ] Crew selected-member details.
  - [ ] Combat transcript lines.

### Suggested values

```js
narrativeFontSize: 11,
narrativeLineHeight: 1.6,
metadataFontSize: 10,
captionFontSize: 9,
```

### Acceptance criteria

- [ ] Narrative text no longer feels cramped.
- [ ] Mechanical/stat text remains compact.
- [ ] Font size hierarchy is consistent across screens.

---

## 1.4 Add category icons and color coding to Captain’s Log rendering

**Player impact:** Medium-High  
**Code impact:** Low-Medium  
**Priority:** P0/P1

### Current state

Many reducers append plain strings to `state.log`.

### First-pass goal

Do not change state structure yet. Instead, improve rendering by detecting categories from prefixes or keywords.

### Tasks

- [ ] Create a `classifyLogLine(text)` helper.
- [ ] Return a category object:

```js
{
  icon: "👥",
  label: "Crew",
  color: T.blueBr,
  tone: "crew"
}
```

- [ ] Apply category styling in `LogList` or wherever Captain’s Log is rendered.
- [ ] Add color/icon categories:
  - [ ] Arrival: `⚓`
  - [ ] Gossip / dockside: `🗣`
  - [ ] Crew: `👥`
  - [ ] Desertion / warning: `⚠`
  - [ ] Combat: `⚔`
  - [ ] Death / infamy: `☠`
  - [ ] Trade / gold: `💰`
  - [ ] Discovery / map: `🗺`
  - [ ] Heat / patrol: `🚨`
  - [ ] Debug: `⚙`

### Example keyword mapping

```js
if (text.includes("Arrived at")) return "arrival";
if (text.includes("left the crew") || text.includes("upset")) return "crew";
if (text.includes("Victory") || text.includes("Defeated")) return "combat";
if (text.includes("Bought") || text.includes("Sold")) return "trade";
if (text.includes("New port discovered") || text.includes("chart")) return "discovery";
if (text.includes("infamy") || text.includes("wanted")) return "infamy";
```

### Acceptance criteria

- [ ] Important log lines are visually scannable.
- [ ] Mechanical trade lines do not visually compete with crew/combat/discovery lines.
- [ ] No reducer changes required in first pass.

---

## 1.5 Improve mission card readability

**Player impact:** Medium  
**Code impact:** Low  
**Priority:** P1

### Goal

Make mission cards narrative-first, while still allowing players to scan reward/risk quickly.

### Tasks

- [ ] Render mission description in a narrative block.
- [ ] Move reward/fame/target into a compact footer.
- [ ] Use risk color coding:
  - [ ] Low: green.
  - [ ] Medium: gold.
  - [ ] High: orange/red.
  - [ ] Assault: red/purple.
- [ ] Make cargo requirements visually distinct from mission flavour.
- [ ] Keep Accept button aligned and easy to find.

### Suggested layout

```text
Escort the spice shipment to Bridgetown

“The English merchants need safe passage to Bridgetown. Deliver them without incident.”

Risk: Medium · Faction: English · Target: Bridgetown
Reward: 1,500g · Fame +1

[Accept]
```

### Acceptance criteria

- [ ] Mission description is easier to read before rewards.
- [ ] Cargo requirements remain prominent when relevant.
- [ ] Rewards remain easy to compare.

---

# Phase 2 — PortScreen Narrative Layout Pass

> Make the port feel like a place before it feels like a menu.

---

## 2.1 Reorder PortScreen hierarchy

**Player impact:** Very high  
**Code impact:** Low-Medium  
**Priority:** P0/P1

### Current rough order

- Port header.
- Description.
- Gossip.
- Services/buttons.
- Mission board.
- Active mission.
- Ship status.
- Captain’s Log.

### Target hierarchy

```text
[Port Header]
Port name, faction, reputation

[Port Description]
Atmospheric description

[WORD ON THE DOCKS]
Gossip / rumours / heat / infamy / market hints


[Actions]
Map / Market / Shipyard / Crew / Save

[Mission Board]
Narrative-first mission cards

[Ship + Log]
Status and recent log
```

### Tasks

- [ ] Keep port name/faction prominent.
- [ ] Add reputation pill near header.
- [ ] Keep port description immediately below header.
- [ ] Place gossip immediately after description.
  - [ ] Active mission.
  - [ ] Heat at current faction.
  - [ ] Contraband in hold.
  - [ ] At-war services blocked.
- [ ] Move action buttons below narrative area.

### Acceptance criteria

- [ ] First screen impression is atmosphere, not buttons.
- [ ] Player can still reach actions quickly.
- [ ] Relevant danger/context appears before mission/action decisions.

---

## 3.1 Add `notice` / `lastNotice` state field

**Player impact:** High  
**Code impact:** Medium  
**Priority:** P1

### Purpose

Important story/consequence moments should briefly appear as a banner at the top of the relevant screen.

### State shape

```js
notice: {
  type: "crew",
  severity: "warning",
  title: "Crew Desertion",
  text: "Juan Rodríguez has left the crew.",
  subtext: "He could not forgive the attack on Spanish ships.",
  day: state.day,
}
```

### Tasks

- [ ] Add `notice: null` to `initialState`.
- [ ] Add migration default for old saves.
- [ ] Add `NoticeBanner` render component.
- [ ] Add action or reducer behavior to clear notice:
  - [ ] Clear on screen navigation, or
  - [ ] Clear when player dismisses it, or
  - [ ] Clear when new notice replaces it.

### Important notice triggers

- [ ] Crew desertion.
- [ ] Crew upset event.
- [ ] Mutiny.
- [ ] New mutineer tag.
- [ ] Port discovery.
- [ ] Battle victory.
- [ ] Battle defeat.
- [ ] Fame threshold crossed.
- [ ] Infamy threshold crossed.
- [ ] Heat threshold crossed.
- [ ] Mission complete.

### Acceptance criteria

- [ ] Major crew/combat/discovery moments are visible without scrolling the log.
- [ ] Notices do not become spammy.
- [ ] Player can dismiss or naturally move past the notice.

---

## 3.2 Start with notices for only crew and discovery events

**Player impact:** High  
**Code impact:** Low-Medium  
**Priority:** P1

### Rationale

Crew and discovery events are the most emotional. Start there before adding notices for everything.

### Tasks

- [ ] Add notice when crew deserts.
- [ ] Add notice when a named crew member becomes upset.
- [ ] Add notice when mutineer tag is applied.
- [ ] Add notice when a hidden port is discovered.

### Acceptance criteria

- [ ] Named crew events feel more personal.
- [ ] Port discovery feels like a moment, not just a log line.

---

# Phase 4 — Combat Text / Battle Transcript Pass

> Combat should read like a tense exchange, not only calculations.

---

## 4.1 Reformat combat log as round transcript

**Player impact:** High  
**Code impact:** Medium  
**Priority:** P1/P2

### Current state

`battleState.log` stores compact battle action strings.

### Goal

Render battle logs by round with better spacing, icons, and emphasis.

### Suggested display

```text
ROUND 3

⚓ Your broadside tears into the enemy hull.
☠ The enemy answers with precision fire.
👥 Lost crew: Diego Vargas, Pieter Bakker.
```

### Tasks

- [ ] Add a combat log rendering component.
- [ ] Detect round markers or use `battleState.round` where possible.
- [ ] Render player actions in gold.
- [ ] Render enemy actions in red.
- [ ] Render crew losses in crew/danger color.
- [ ] Render victory/defeat as large banner.
- [ ] Keep full log scrollable.

### Optional data improvement

Later, convert combat logs to structured entries:

```js
{
  round: 3,
  actor: "player",
  action: "broadside",
  text: "Your broadside tears into the enemy hull.",
  tone: "attack"
}
```

### Acceptance criteria

- [ ] Player can understand combat flow at a glance.
- [ ] Crew deaths are visibly called out.
- [ ] Victory/defeat feels dramatic.

---

## 4.2 Add richer combat message templates

**Player impact:** Medium-High  
**Code impact:** Medium  
**Priority:** P2

### Tasks

- [ ] Add player action templates for:
  - [ ] Broadside.
  - [ ] Precision shot.
  - [ ] Grapple success.
  - [ ] Grapple failure.
  - [ ] Evade success.
  - [ ] Evade failure.
- [ ] Add enemy response templates.
- [ ] Add crew loss templates.
- [ ] Add low morale combat flavour.
- [ ] Add high morale combat flavour.

### Acceptance criteria

- [ ] Repeated combats do not all read the same.
- [ ] Text remains mechanically accurate.
- [ ] No misleading lines about outcomes that did not happen.

---

# Phase 5 — Crew Attachment / Crew Chronicle Pass

> Crew attachment is now a major design goal. The UI should help players remember people.

---

## 5.1 Improve selected crew detail card

**Player impact:** High  
**Code impact:** Low-Medium  
**Priority:** P1

### Current state

`CrewScreen` selected member card shows name, faction, role, days aboard, and tags.

### Tasks

- [ ] Make days aboard more prominent.
- [ ] Add veteran labels:
  - [ ] `New hand` under 15 days.
  - [ ] `Seasoned` at 30+ days.
  - [ ] `Veteran` at 100+ days.
  - [ ] `Old salt` at 200+ days.
- [ ] Add visual badge for long-serving crew.
- [ ] Make negative tags visually distinct from scars/flavour tags.
- [ ] Show tag explanations in the detail card, not only legend.

### Suggested display

```text
Juan Rodríguez
Spanish Gunner — Veteran, 127 days aboard

Tags
⚠ Upset — may desert at next port
⚓ Mutineer — doubles desertion chance if upset
```

### Acceptance criteria

- [ ] Long-serving crew feel special.
- [ ] Tag meaning is clear without reading the global legend.
- [ ] Player can quickly identify crew at risk.

---

## 5.2 Add lightweight crew history counters

**Player impact:** High  
**Code impact:** Medium  
**Priority:** P2

### Purpose

Attachment comes from memory. We can start with counters before full histories.

### Add to crew member object

```js
stats: {
  battlesSurvived: 0,
  voyagesSurvived: 0,
  timesUpset: 0,
  stormsSurvived: 0,
}
```

### Tasks

- [ ] Add migration default for `member.stats`.
- [ ] Increment `voyagesSurvived` on safe port arrival.
- [ ] Increment `battlesSurvived` for surviving crew after battle victory/flee.
- [ ] Increment `timesUpset` when `upset` tag is added.
- [ ] Increment `stormsSurvived` when storm event happens and member survives.
- [ ] Show stats in selected member detail.

### Acceptance criteria

- [ ] Player can see why a veteran matters.
- [ ] No full history log required yet.
- [ ] Stats survive save/load.

---

## 5.3 Add full crew history later

**Player impact:** Very high  
**Code impact:** Medium-High  
**Priority:** P3

### Future state

```js
history: [
  { day: 12, text: "Hired in Havana." },
  { day: 44, text: "Survived the battle against The Black Serpent." },
  { day: 58, text: "Became upset after the attack on Spanish ships." },
]
```

### Tasks

- [ ] Add `history: []` to crew member object.
- [ ] Add migration default.
- [ ] Add helper `L.addCrewHistory(member, day, text)`.
- [ ] Push history when:
  - [ ] Hired.
  - [ ] Survives major battle.
  - [ ] Becomes upset.
  - [ ] Calms down.
  - [ ] Becomes mutineer.
  - [ ] Gains scar/trait.
  - [ ] Dies/deserts.
- [ ] Display last 3-5 history entries in CrewScreen detail card.

### Acceptance criteria

- [ ] Crew members feel like named characters with continuity.
- [ ] History does not overwhelm the UI.
- [ ] Full log/journal can later reuse crew history.

---

# Phase 6 — Rumour Memory / Useful Text Persistence

> If gossip can contain actionable information, the player should be able to revisit it.

---

## 6.1 Add `rumoursHeard` state field

**Player impact:** Medium  
**Code impact:** Medium  
**Priority:** P2

### Purpose

Store useful rumours so players are more inclined to read them.

### State shape

```js
rumoursHeard: [
  {
    day: 42,
    port: "havana",
    type: "hidden_port",
    text: "Old sailors speak of a hidden cove in the Bay Islands...",
  }
]
```

### Tasks

- [ ] Add `rumoursHeard: []` to initial state.
- [ ] Add migration default.
- [ ] Update gossip generator to optionally return metadata, not only strings.
- [ ] Store only useful rumours:
  - [ ] Hidden port hints.
  - [ ] Local market hints.
  - [ ] High heat warnings.
  - [ ] Contraband warnings, optionally.
- [ ] Limit stored rumours to last 30 or 50 entries.
- [ ] Avoid storing duplicate exact rumours repeatedly.

### Acceptance criteria

- [ ] Useful rumours can be reviewed later.
- [ ] Ambient filler is not stored.
- [ ] Save file remains small.

---

## 6.2 Add Rumours section to Status screen or future Journal

**Player impact:** Medium  
**Code impact:** Low-Medium  
**Priority:** P2/P3

### Tasks

- [ ] Show last 5 rumours in Status screen.
- [ ] Add filter by type later.
- [ ] Show source port and day.
- [ ] Add `Clear old rumours` button if needed.

### Acceptance criteria

- [ ] Player can revisit hidden port hints.
- [ ] Player can revisit market hints before deciding routes.

---

# Phase 7 — Captain’s Journal Screen

> Bigger feature. Do after smaller presentation work and preferably after typed log entries.

---

## 7.1 Add new Journal screen

**Player impact:** High  
**Code impact:** Medium-High  
**Priority:** P3

### Purpose

Give players a dedicated place to revisit the story of the run.

### Suggested navigation

- [ ] Add `📖 Journal` button from:
  - [ ] PortScreen.
  - [ ] SailingScreen.
  - [ ] StatusScreen.

### Suggested tabs

```text
[All] [Crew] [Combat] [Ports] [Missions] [Trade] [Rumours]
```

### Tasks

- [ ] Add screen constant / navigation target.
- [ ] Add `JournalScreen` component.
- [ ] Display log entries grouped by day.
- [ ] Add category filters.
- [ ] Add search/filter later if needed.
- [ ] Include rumours if `rumoursHeard` exists.
- [ ] Include crew history if implemented.

### Acceptance criteria

- [ ] Player can understand the story of their run from the journal.
- [ ] Log does not become unreadable as the run grows.
- [ ] Journal does not replace short local logs; it complements them.

---

## 7.2 Prepare for typed log objects

**Player impact:** Very high long-term  
**Code impact:** High  
**Priority:** P3/P4

### Current state

Log entries are strings.

### Target state

```js
{
  day: state.day,
  type: "crew",
  severity: "warning",
  text: "Juan Rodríguez has left the crew.",
  tags: ["desertion", "crew"],
}
```

### Migration strategy

- [ ] Support both strings and objects in renderer.
- [ ] Add helper `L.logEntry(type, text, options)` or `E.makeLogEntry(...)`.
- [ ] Gradually convert reducers one by one.
- [ ] Keep backwards compatibility with old saves.

### Conversion order

- [ ] Crew events first.
- [ ] Combat events second.
- [ ] Discovery events third.
- [ ] Mission events fourth.
- [ ] Trade events last.

### Acceptance criteria

- [ ] Old string logs still render.
- [ ] New object logs render with category and metadata.
- [ ] Journal can filter reliably.

---

# Phase 8 — Optional Arrival / Dramatic Moment Presentation

> Optional polish. Do not start here.

---

## 8.1 Add arrival emphasis panel

**Player impact:** Medium-High  
**Code impact:** Medium  
**Priority:** P3

### Purpose

Make arrival at a port feel like a small scene.

### Lightweight version

On PortScreen, show a top panel after arrival:

```text
ARRIVAL — HAVANA

The harbour is quiet when you arrive.
Too quiet.
```

### Tasks

- [ ] Add `lastArrival` or notice variant.
- [ ] Render once on PortScreen.
- [ ] Clear on navigation or after first action.

### Acceptance criteria

- [ ] Arrival feels atmospheric.
- [ ] It does not block flow.

---

## 8.2 Arrival interstitial screen

**Player impact:** Medium-High  
**Code impact:** Medium-High  
**Priority:** P4

### Purpose

Create a dedicated “pause” after voyages.

### Suggested flow

```text
ARRIVAL — HAVANA

The harbourmaster checks your papers twice.
Warships sit idle beneath the fort guns.

[Continue to Port]
```

### Caution

This can become annoying if shown too often. Prefer inline arrival panel first.

### Acceptance criteria

- [ ] Player can continue quickly.
- [ ] Repeated port visits do not feel slowed down.

---

# Phase 9 — Readability / Accessibility Options

---

## 9.1 Add text size mode

**Player impact:** Medium-High  
**Code impact:** Low-Medium  
**Priority:** P2

### Modes

```text
Compact / Comfortable / Large
```

### Tasks

- [ ] Add text size setting to UI state or localStorage.
- [ ] Define text scale constants.
- [ ] Apply to narrative panels and logs first.
- [ ] Apply globally later.

### Acceptance criteria

- [ ] Text-heavy players can choose a comfortable reading size.
- [ ] Layout remains usable in all modes.

---

## 9.2 Add reduced log density option

**Player impact:** Medium  
**Code impact:** Medium  
**Priority:** P3

### Purpose

Allow players to hide low-importance mechanical log spam.

### Tasks

- [ ] Add setting: `Show detailed trade log` on/off.
- [ ] Add setting: `Show compact combat log` on/off.
- [ ] Add setting: `Show debug log` on/off.

### Acceptance criteria

- [ ] Narrative signals stand out more.
- [ ] Players who want details can still see them.

---

# Recommended Implementation Order

## Sprint A — Immediate UX improvement

1. [ ] Add `NarrativePanel` / `NarrativeLine` UI helpers.
2. [ ] Upgrade `WORD ON THE DOCKS` panel.
3. [ ] Improve narrative font size and line height.
4. [ ] Add log category icons/colors using string classification.
5. [ ] Improve mission card text hierarchy.

**Expected player impact:** Very high  
**Risk:** Low-Medium  
**Best reason to do this first:** It makes existing content feel better without requiring new game systems.

---

## Sprint B — Consequence emphasis

1. [ ] Add `notice` state field.
2. [ ] Add `NoticeBanner` component.
3. [ ] Add notices for crew desertion/upset/mutineer.
4. [ ] Add notice for hidden port discovery.

**Expected player impact:** High  
**Risk:** Medium  
**Best reason to do this second:** Crew loyalty and discovery moments become emotionally visible.

---

## Sprint C — Combat readability

1. [ ] Reformat battle log as transcript.
2. [ ] Add action/crew-loss color coding.
3. [ ] Add victory/defeat narrative banner.
4. [ ] Add richer combat text templates.

**Expected player impact:** High  
**Risk:** Medium  
**Best reason to do this third:** Combat becomes more dramatic and less spreadsheet-like.

---

## Sprint D — Crew attachment layer

1. [ ] Improve selected crew detail card.
2. [ ] Add veteran badges based on days aboard.
3. [ ] Add lightweight crew stats.
4. [ ] Display crew stats in detail card.
5. [ ] Later: add full crew history.

**Expected player impact:** High  
**Risk:** Medium  
**Best reason to do this after combat:** Crew survival and battle history become meaningful.

---

## Sprint E — Journal / memory systems

1. [ ] Add `rumoursHeard` state.
2. [ ] Store useful rumours.
3. [ ] Display rumours in Status or Journal.
4. [ ] Add Journal screen.
5. [ ] Gradually migrate logs to typed objects.

**Expected player impact:** High long-term  
**Risk:** Medium-High  
**Best reason to do this later:** Needs stable categories and enough text history to justify the screen.

---

# Impact / Effort Ranking

| Rank | Task | Player Impact | Code Impact | Recommended Timing |
|---:|---|---|---|---|
| 1 | Upgrade `WORD ON THE DOCKS` panel | Very High | Low-Medium | Sprint A |
| 2 | Reusable narrative UI components | Very High | Medium | Sprint A |
| 3 | Log icons/colors | Medium-High | Low-Medium | Sprint A |
| 4 | Narrative typography pass | High | Low | Sprint A |
| 5 | Mission card readability | Medium | Low | Sprint A |
| 6 | Notice banner for major events | High | Medium | Sprint B |
| 8 | Combat transcript formatting | High | Medium | Sprint C |
| 9 | Crew veteran badges/detail card | High | Low-Medium | Sprint D |
| 10 | Crew stats/history | High | Medium | Sprint D |
| 11 | Rumour memory | Medium | Medium | Sprint E |
| 12 | Captain’s Journal | High | Medium-High | Sprint E |
| 13 | Typed log objects | Very High long-term | High | Sprint E/F |
| 14 | Arrival interstitial | Medium-High | Medium-High | Later |

---

# Definition of Done — Text Presentation Pass

The first pass can be considered complete when:

- [ ] Port gossip is visually prominent and readable.
- [ ] Mission descriptions are easier to read and separated from mechanics.
- [ ] Captain’s Log lines have icons/colors by category.
- [ ] Narrative text has consistent size and line height.
- [ ] Major crew/discovery/combat consequences are easier to notice.
- [ ] No screen becomes slower to use.
- [ ] No save/load migration issue is introduced.
- [ ] Existing tests still pass.

---

# Definition of Done — Long-Term Narrative UX

The full narrative UX vision can be considered complete when:

- [ ] The player consistently reads port gossip because it looks important and sometimes contains useful information.
- [ ] The player notices named crew events without digging through logs.
- [ ] Combat logs read like a tense exchange and highlight crew loss by name.
- [ ] Long-serving crew are visibly celebrated.
- [ ] Useful rumours can be reviewed later.
- [ ] A player can reconstruct the story of the run from the Journal.
- [ ] Text presentation strengthens atmosphere without overwhelming gameplay.
