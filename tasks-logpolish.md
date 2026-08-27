Yes. The formatting problem is separate from the underlying audit. I could identify the actual log-producing structures and the different pools/branches; I would not treat the malformed corpus rendering as evidence that the source itself is malformed.

For harmonisation, I would **not** attempt a global rewrite. I would make these 10 localized changes, in roughly this order.

## Top 10 concrete changes

### 1. Normalize the generic combat victory messages

**Location:** `data_text.js` — `VICTORY_MESSAGES` / combat aftermath messages.

There are currently several ways of announcing essentially the same thing: victory, enemy defeated, enemy striking colours, etc.

I would pick one consistent structure:

> **"The Black Gull strikes her colours. Victory."**

and remove/rewrite variants that read like UI status messages such as:

> `"Black Gull defeated."`

The former fits the game's nautical voice while remaining short enough for a combat log.

**Why:** victory is one of the most repeated combat-log outcomes, so inconsistency here is disproportionately visible.

---

### 2. Rewrite the explicit numeric broadside result that reads like a combat UI

**Location:** `data_text.js` — naval `broadside` templates.

There are templates along the lines of:

> `"They land a perfect shot. 12 damage, 4 casualties."`

I would replace those with the same information expressed in the established narrative syntax, e.g.:

> **"Their broadside tears into the Sea Wraith. 12 hull damage and 4 casualties."**

This preserves the useful numbers but removes the abrupt `damage / casualties` accounting style.

**Why:** this is one of the clearest places where the combat log suddenly stops sounding like the rest of the game.

---

### 3. Normalize "crew loss" vocabulary in combat

**Location:** `data_text.js` — naval and boarding combat templates.

There are several formulations around:

* crew lost
* casualties
* sailors fall
* crew down
* crew killed

I would specifically replace the weaker/UI-like formulations rather than globally rewriting every sentence.

For example:

> `"4 crew down."`

→

> **"4 sailors are lost."**

And where the context genuinely implies casualties from a destructive attack:

> `"4 casualties."`

→

> **"4 sailors are killed."**

I would reserve **"casualties"** for situations where the exact fate isn't important or known.

**Why:** "crew", "sailors", and "casualties" currently sometimes refer to the same mechanical quantity without an obvious distinction.

---

### 4. Remove duplicated boarding conclusion messages

**Location:** `engine_battle.js` + `data_text.js` boarding outcome templates.

When a boarding action ends with one side wiped out, there are currently cases where the log can effectively say:

> the enemy crew is wiped out

followed by another victory/conclusion message conveying the same fact.

I would retain the **more evocative boarding-specific sentence** and remove the redundant generic conclusion where both are emitted.

For example, keep:

> **"The Black Gull's deck falls silent. Her remaining crew are gone."**

and don't immediately append another:

> `"Enemy crew wiped out!"`

**Why:** this is not merely stylistic. Repetition makes the combat log feel generated from independent mechanical systems rather than describing one continuous fight.

---

### 5. Make the distance-change messages use one grammatical structure

**Location:** `data_text.js` — naval `close_distance_success`, `open_distance_success`, and corresponding NPC templates.

Where the current templates describe movement in different ways, I would normalize them around:

> **"You close the distance. The ships are now at close range."**

and:

> **"You open the distance. The ships are now at long range."**

For the enemy:

> **"The Black Gull closes the distance. The ships are now at close range."**

etc.

I would use the actual game's distance terminology consistently rather than alternating between phrases such as "pull away", "close in", "increase the range", etc.

**Why:** distance is a mechanical state, so the combat log benefits from especially predictable language.

---

### 6. Rewrite `both_close` / `both_open` contest messages to avoid mechanical-sounding ties

**Location:** `data_text.js` — naval combined movement contest templates.

These are places where the game reports the result of both sides attempting the same movement action.

I would make the tie/unchanged-state message explicitly describe the stalemate, e.g.:

> **"Both ships manoeuvre for position, but neither gains ground."**

rather than a sentence that simply reports that the distance remained unchanged.

Likewise for long range:

> **"Both ships try to open the distance, but neither can shake the other."**

**Why:** these are inherently good opportunities for concise nautical flavour, and the current mechanical outcome does not need to sound like a state dump.

---

### 7. Rewrite the "pass by / refuse to help" merchant sentence to match the event's moral tone

**Location:** `data.js` / `engine_encounter.js` — `distressed_merchant` pass-by outcome.

This event is one of the more narrative events, so its refusal outcome should not sound like a generic morale modifier.

I would make the actual log something like:

> **"You leave the merchant to her fate. The crew is uneasy about it."**

rather than effectively reporting:

> merchant ignored → morale penalty.

If the current implementation already records a more atmospheric sentence, I would preserve that and only adjust it toward this structure.

**Why:** the player is making a meaningful moral/identity choice here; the log should describe the choice, not merely its stat consequence.

---

### 8. Give the drifting-wreck outcome messages one coherent "risk → discovery" vocabulary

**Location:** `engine_encounter.js` — `drifting_wreck` resolution.

The three outcomes should feel like variants of the **same dangerous salvage attempt**.

I would explicitly make the successful and empty outcomes use the same narrative framing:

> **"You search the wreck. Inside, you find 175 gold worth of salvage."**

versus:

> **"You search the wreck, but find nothing of value."**

and, once the ambush is implemented:

> **"You search the wreck. A hidden crew springs from below deck!"**

The existing "survivor" branch should likewise begin from the search action.

**Why:** this makes the player's decision legible retrospectively: *I took the risk of searching, and this is what that risk produced.*

---

### 9. Normalize crew-event logs around the person, not the mechanic

**Location:** `engine_encounter.js` / crew-event log generation — mutiny, deserters, crew upset.

For example, where the current output essentially says:

> `"Thomas Reed and Anne Bell are now upset."`

I would use:

> **"Thomas Reed and Anne Bell are angered by the decision."**

For mutiny:

> **"Thomas Reed and Anne Bell emerge as the ringleaders of the mutiny."**

rather than a mechanically oriented:

> `"They are marked as mutineers."`

The latter may remain useful internally, but it should not be the primary player-facing sentence.

**Why:** crew names are one of the game's strongest sources of emergent narrative. These events should read as things people did, not status flags being assigned to people.

---

### 10. Clean the generic economy/accounting sentences that leak into the Journal

**Location:** `engine_port.js`, `engine_encounter.js`, and other places producing direct Journal entries such as purchases, repairs, fines, and rewards.

I would target the obvious accounting-style formulations individually.

For example:

> `"Purchased a brig for 2400g."`

→

> **"You purchase the brig for 2,400 gold."**

and:

> `"Installed Copper Plating for 180g."`

→

> **"The shipwright installs Copper Plating for 180 gold."**

Likewise, instead of:

> `"+2 infamy."`

use:

> **"Your infamy rises by 2."**

where the value is important enough to record.

**Why:** these are among the most obvious places where the Journal currently switches from prose into an application's transaction log. They don't need to become literary; they just need to belong to the same sentence grammar as the rest of the game.

---

## The pattern I would deliberately **not** fix

I would **not** make every log start with `"You..."`.

That would actually make the game more monotonous.

These are perfectly compatible voices:

> **"You close the distance."**

> **"The Black Gull's broadside tears into the Sea Wraith."**

> **"Both ships manoeuvre for position, but neither gains ground."**

> **"The crew grows restless."**

> **"The Black Gull strikes her colours."**

The important thing is that each sentence has a clear **actor, event, and consequence**, and that the game doesn't randomly switch into UI/accounting language.

### My priority order

If I were making the changes before touching anything else, I'd do:

1. **Victory/defeat duplication**
2. **Combat numeric/accounting phrasing**
3. **Crew-loss vocabulary**
4. **Boarding conclusions**
5. **Distance messages**
6. **Movement stalemates**
7. **Merchant event**
8. **Wreck event**
9. **Crew/mutiny events**
10. **Economy/accounting Journal entries**

That would already make the corpus feel substantially more like it came from **one writing system**, without homogenizing the actual prose or prematurely designing the B13 journal voice.
