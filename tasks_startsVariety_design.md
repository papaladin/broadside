# B10 — Starts Variety & Captain Identity Discovery

## Summary of Discussions, Rejections, and Final Direction

---

## 1. The Goal

Increase replayability at the very start of the game and add a mid-game identity pivot. The five faction starts should feel genuinely different, not just in flavour text but in how you play the game.

---

## 2. Rejected Ideas (and why)

| Idea | Why Rejected |
|---|---|
| **Captain traits (6 options) with their own bonuses/maluses** | "Too much different things and too much noise." Adding a trait layer on top of factions created unnecessary complexity and diluted faction identity. |
| **Multiple levers per faction (e.g., English gets rep bonus + trade bonus)** | Same reason – too much noise. One clear lever per faction is more memorable and impactful. |
| **English: Reputation never decays below 50** | Felt too passive and "safe." Didn't change playstyle meaningfully. Also, no faction currently has a combat edge, so English is parked to get one after the combat rework (B11). |
| **Spanish: 50% higher wages** | Too punishing without enough offset. Replaced with a crew-restriction mechanic that feels more thematic and strategic. |
| **Pirate: Crew never deserts** | Felt too powerful and removed a core tension (managing upset crew). Replaced with flee/evade/parley bonuses – more thematic for outlaws. |

---

## 3. Final Direction: One Lever Per Faction

Each faction gives **one clear bonus** and **one clear malus** that affect different game systems. The choice determines your playstyle.

| Faction | Core Lever | Bonus | Malus | Playstyle |
|---|---|---|---|---|
| **Dutch** | Trade | +50% trade profit (buy -20%, sell +20%) | -25% combat loot (plunder, mission gold) | Pure merchant. Combat is unprofitable. |
| **Pirate** | Freedom & Cunning | +25% flee/evade success, Parley success doubled (flat +20 on d100), free crew at pirate ports | All colonial factions start at -25 rep | You're slippery. You talk or run. But everyone hates you. |
| **Spanish** | Homogeneous Crew | Spanish crew cost 25g (half), +10 starting morale | Can only hire Spanish crew | Loyal, cheap crew. But you're locked into Spanish ports/recruitment. |
| **French** | Provisions Efficiency | Provisions consumption is halved (rounded up) | -15% mission gold | Stay at sea twice as long. Exploration is your strength. |
| **English** | Naval Discipline *(placeholder)* | -30% crew loss in combat (placeholder) | Plunder gold is halved | You fight smart. But you don't plunder. *(Parked until B11 combat rework)* |

---

## 4. Letter of Marque System (The Pivot)

**How it works:**

- A **Letter of Marque** lets you formally switch allegiance to a new faction.
- **Requirements**: Fame ≥ 75, Reputation ≥ 70 with target faction, cost 10,000g.
- **Limit**: Once per game (or twice if you go back to pirate via a special "Pirate's Code").

**The key insight: Bonuses stack.**

You keep your **birth faction** bonus and **add** the new faction's bonus. Maluses also stack.

| Example | Birth Bonus | Letter Bonus | Combined Identity |
|---|---|---|---|
| Dutch → French | +50% trade profit | Provisions halved | "Franco-Dutch Merchant Explorer" |
| Spanish → English | Cheap Spanish crew (locked) | -30% crew loss | "Spanish-born English Naval Officer" |
| Pirate → English | +25% flee/evade | -30% crew loss | "Reformed Pirate Privateer" |

**Same-faction Letter ("Super Loyal"):**

If you get a Letter from your own faction (e.g., English → English, promoted to Admiral), you **double** your birth bonus.

| Faction | Same-Faction Bonus (Stacked) |
|---|---|
| Dutch | +100% trade profit |
| Pirate | +50% flee/evade, Parley +40 |
| Spanish | Spanish crew cost 12g (quarter), still locked |
| French | Provisions are 25% of normal |
| English | -60% crew loss |

---

## 5. The Spanish Edge Case (Crew Lock)

- **Birth Spanish**: You can **only** hire Spanish crew. When you take a Letter (e.g., to English), you **keep** this restriction. You're a Spanish captain in English service – your crew is still Spanish.
- **Getting a Spanish Letter** (if you weren't born Spanish): You gain the ability to hire Spanish crew at 25g, but you are **not** restricted. You can mix nationalities. You're just leveraging Spanish sailors.

---

## 6. All Possible Combined Identities

| Birth | Letter | Combined Identity | Key Effect |
|---|---|---|---|
| Dutch | French | Franco-Dutch Merchant | Trade + Provisions |
| Dutch | Spanish | Spanish-Dutch Merchant | Trade + Cheap Spanish crew |
| Dutch | English | Anglo-Dutch Privateer | Trade + Crew loss reduction |
| Dutch | Pirate | Pirate Merchant | Trade + Flee/evade |
| French | Dutch | Dutch-French Explorer | Provisions + Trade |
| French | Spanish | Spanish-French Explorer | Provisions + Cheap Spanish crew |
| French | English | Anglo-French Privateer | Provisions + Crew loss reduction |
| French | Pirate | Pirate Explorer | Provisions + Flee/evade |
| Spanish | Dutch | Dutch-Spanish Merchant | Cheap Spanish crew + Trade |
| Spanish | French | Franco-Spanish Privateer | Cheap Spanish crew + Provisions |
| Spanish | English | Anglo-Spanish Naval Officer | Cheap Spanish crew + Crew loss reduction |
| Spanish | Pirate | Pirate Spaniard | Cheap Spanish crew + Flee/evade |
| English | Dutch | Anglo-Dutch Trader | Crew loss reduction + Trade |
| English | French | Anglo-French Explorer | Crew loss reduction + Provisions |
| English | Spanish | Spanish-English Officer | Crew loss reduction + Cheap Spanish crew |
| English | Pirate | Reformed Pirate | Crew loss reduction + Flee/evade |
| Pirate | Dutch | Pirate Trader | Flee/evade + Trade |
| Pirate | French | Pirate Explorer | Flee/evade + Provisions |
| Pirate | Spanish | Pirate Spaniard | Flee/evade + Cheap Spanish crew |
| Pirate | English | Reformed Pirate Privateer | Flee/evade + Crew loss reduction |
| Any | Same | Super Loyal | Double the original bonus |

---

## 7. Implementation Overview

| Lever | Where | Implementation |
|---|---|---|
| Trade profit | `engine_port.js` (CONFIRM_TRADE) | Apply buy/sell multipliers based on `getFactionBonus(state)` |
| Flee/evade | `logic.js` (buildEncounterContext, resolveCombatAction) | Add `+0.25` to speed check for Pirate |
| Parley | `engine_combat.js` (INTERCEPT_PARLEY) | Add `+20` to success roll for Pirate |
| Crew hire | `engine_port.js` (HIRE_CREW) | Check `state.crewLock`. Spanish: only allow Spanish hires at 25g. Pirate: free at pirate ports. |
| Provisions | `logic.js` (getProvisionConsumptionPerDay) | French: `Math.ceil(crew / 20)` instead of `/10` |
| Crew loss | `logic.js` (resolveCombatAction, applyCrewLoss) | English: multiply crew loss by `0.7` |
| Starting rep | `engine_port.js` (START_GAME) | Set faction-specific rep adjustments |
| Mission gold | `engine_port.js` (COMPLETE_MISSION) | Apply -15% for French, -25% for Dutch/English plunder |
| Plunder gold | `engine_combat.js` (TAKE_PLUNDER) | Apply multipliers based on faction |
| Letter of Marque | `engine_port.js` (new action: `A.USE_LETTER_OF_MARQUE`) | Update `state.faction`, `state.letterFaction`, apply rep changes |

---

## 8. State Changes

| Field | Purpose |
|---|---|
| `birthFaction` | The faction chosen at New Game (never changes) |
| `letterFaction` | The faction from the Letter of Marque (null if not used) |
| `letterUsed` | Boolean (true if Letter used) |
| `faction` | Current active faction (used for missions, ports, reputation) |
| `crewLock` | `"spanish"` if birth faction was Spanish (restricts crew hiring) |

---

## 9. Roadmap Alignment

| Roadmap Block | Integration |
|---|---|
| **B11 (Combat Rework)** | English bonus swapped to something tactical (e.g., +1 boarding defence, or +10% broadside accuracy) |
| **B19 (World Events)** | Faction war events could offer a free Letter of Marque as a reward |
| **B20 (Story Arc)** | Libertalia could offer a unique "Pirate's Code" granting all bonuses (or none) |
| **B21 (Endgame)** | Final faction identity determines victory conditions / retirement framing |

