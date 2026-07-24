# Game Over System — Complete Task List
## B9: Prevention gates, unrecoverable-state detection, and the end screen

One continuous build: prevention gates stop nonsensical states from being entered,
wash-ashore generalization closes the gap where random events could zero out hull with
no consequence, a shared detection function defines what "unrecoverable" actually means,
two trigger points call it at the right moments, and the game-over screen presents the
result. The autosave-ordering fix is folded directly into Task 3.3 below rather than
kept as a separate correction — this is one build, not two.

---

## Part 1 — Prevention Gates

### Task 1.1 — Block sailing with 0 crew (dinghy exempt)

**Where**: `engine_port.js`, `case A.SAIL_TO` (~line 306) — add the guard near the top
of the case, before route calculation. Also add a UI-level disable in
`screens_voyage.jsx` (the sail/change-course button) so the player sees why before
attempting it, not just after a rejected dispatch.

```js
case A.SAIL_TO: {
  const isDinghy = state.ship.type === "dinghy";
  if (!isDinghy && state.crew.roster.length === 0) {
    return { ...state, log: [...state.log,
      window.E.logEntry(state, "There is no one left to crew the ship.")] };
  }
  // ... existing route calculation continues unchanged
}
```

**UI side** (`screens_voyage.jsx`, sail/course-change button):
```jsx
disabled={state.crew.roster.length === 0 && state.ship.type !== "dinghy"}
title={state.crew.roster.length === 0 && state.ship.type !== "dinghy"
  ? "You have no crew to sail with" : undefined}
```

Apply the same guard to the map's "Change Course" action if it's a separate dispatch
path from the main Sail button.

---

### Task 1.2 — Block sailing with 0 hull

**Where**: same `SAIL_TO` case, same pattern, no ship-type exception this time.

```js
if (state.ship.hull === 0) {
  return { ...state, log: [...state.log,
    window.E.logEntry(state, "The ship cannot sail — the hull is destroyed.")] };
}
```

**UI side**: disable the sail button whenever `state.ship.hull === 0`, tooltip:
"The ship needs repairs before it can sail."

---

### Task 1.3 — Block combat-type mission acceptance at 0 hull

**Where**: `engine_port.js`, `case A.TAKE_MISSION` (~line 690). Add a type check —
trade/smuggle missions remain acceptable at 0 hull (no fighting involved); combat,
patrol, assault, and escort do not.

```js
const FIGHT_INVOLVED_TYPES = ["combat", "patrol", "assault", "escort"];
if (state.ship.hull === 0 && FIGHT_INVOLVED_TYPES.includes(action.mission.type)) {
  return { ...state, log: [...state.log,
    window.E.logEntry(state, "The ship is unfit for a fight in this condition.")] };
}
```

---

### Task 1.4 — Block INTERCEPT_FIGHT at 0 hull (safeguard)

**Where**: `engine_combat.js`, `case A.INTERCEPT_FIGHT` (~line 245). Defensive backstop
in case an encounter is somehow already in progress when hull hits 0 — Part 2 below
should mean the player is never actually mid-encounter with 0 hull in practice, but this
costs nothing to guard against directly too.

```js
case A.INTERCEPT_FIGHT: {
  if (state.ship.hull === 0) {
    return { ...state, log: [...state.log,
      window.E.logEntry(state, "There is no fighting to be done — the ship is already lost.")] };
  }
  // ... existing logic continues
}
```

---

### Task 1.5 — 10% minimum crew ratio (soft warning, not a hard block)

**Where**: this is NOT a gate — it's a UI warning shown on the Sailing/Map screen when
crew count is below the recommended minimum for the current ship, so the player
understands the risk without being blocked from choosing it.

**Add to `logic.js`**:
```js
// Minimum viable crew per ship type — a skeleton crew, not a comfortable one.
// Purely informational; sailing below this is legal, just risky (existing morale/
// combat-effectiveness penalties already apply proportionally).
const MIN_CREW_RATIO = 0.10;
const getMinViableCrew = (shipType) => {
  if (shipType === "dinghy") return 0; // exempt — the one-person boat
  const maxCrew = window.D.SHIPS[shipType]?.maxCrew ?? 0;
  return Math.floor(maxCrew * MIN_CREW_RATIO);
};
```

Export `getMinViableCrew` in the `window.L` return block.

Verified minimums against real ship data: dinghy 0 (exempt), cutter 2, sloop 4,
schooner 5, galleon 15, Ship of the Line 28.

**UI side** (`screens_voyage.jsx` or wherever crew count is shown pre-departure): if
`state.crew.roster.length < L.getMinViableCrew(state.ship.type)`, show a small amber
warning line: "Skeleton crew — this voyage carries extra risk." No block, no dispatch
change — purely advisory.

---

## Part 2 — Generalize Wash-Ashore to Non-Combat Hull-Zero Events

### Task 2.1 — Confirmed gap (context, no code change)

Verified directly in `engine_combat.js` line 740: `RESOLVE_EVENT`'s hull-damage handling
correctly floors hull at 0 (`Math.max(0, state.ship.hull - choice.outcome.hullDamage)`)
but does nothing after — no check for "did this hit 0," no forced return to port. A
storm event can currently zero out hull and the game simply continues with a 0-hull ship
that (before Task 1.2) could attempt to sail indefinitely.

---

### Task 2.2 — Extract a shared `washAshore` helper from `handleDefeat`

**Where**: `engine_combat.js`. Rename/generalize the existing `handleDefeat` (~line 133)
into a shared helper that both the battle-defeat path and the new event path can call.
The original takes `battleState` for two specific things (`encounterType` for
mission-fail detection, `enemy.name` for the log message) — the generalized version
makes both optional so it works without a battle context.

```js
// Renamed from handleDefeat. `battleState` is optional — when present (combat defeat),
// behaves exactly as before. When absent (event-triggered), skips the
// mission-fail/enemy-name-specific parts and uses a generic log line instead.
const washAshore = (state, battleState = null, extraLog = []) => {
  const returnPort = state.previousPort || state.currentPort;
  const portName = D.PORTS[returnPort]?.name || "a nearby port";
  const isMissionFight = battleState && (
    battleState.encounterType === "mission_combat" ||
    battleState.encounterType === "escort_defend"
  );
  const missionFailed = isMissionFight && state.activeMission;

  const defeatLog = battleState
    ? L.logPick(D.DEFEAT_MESSAGES, state, battleState.enemy.name, portName)
    : `The ship, crippled and adrift, washes ashore near ${portName}.`;

  const result = {
    ...state,
    battleState: null,
    activeMission: missionFailed ? null : state.activeMission,
    screen: "port",
    currentPort: returnPort,
    destination: null,
    sailingDaysLeft: 0,
    sailingDaysTotal: 0,
    hold: {
      ...state.hold,
      items: Object.fromEntries(Object.keys(state.hold?.items || {}).map(k => [k, 0])),
    },
    portMarket: G.generatePortMarket(returnPort, state),
    missions: G.generateMissions(returnPort, state),
    infamy: battleState
      ? Math.min(999, (state.infamy ?? 0) + (extraLog.length > 0 ? 2 : 0))
      : state.infamy,
    log: [
      ...state.log,
      window.E.logEntry(state, defeatLog),
      window.E.logEntry(state, "All cargo lost."),
      ...(missionFailed ? [window.E.logEntry(state, "The mission has failed.")] : []),
      ...extraLog,
    ],
  };

  // Check for unrecoverable state before returning — see Part 3.
  const check = L.isUnrecoverable(result);
  if (check.unrecoverable) {
    return { ...result, screen: "gameover", gameOverReason: check.reason };
  }
  return result;
};
```

Update the one existing call site (~line 599) from `handleDefeat(state, battleState, patrolLog)`
to `washAshore(state, battleState, patrolLog)`.

Note: `L.isUnrecoverable` is defined in Task 3.1 below — this task references it, but
build order should be Task 3.1 before wiring the check into `washAshore` here, or stub
it temporarily and come back.

---

### Task 2.3 — Call `washAshore` from `RESOLVE_EVENT` when hull hits 0

**Where**: `engine_combat.js`, `RESOLVE_EVENT` case, right after the existing
hull-damage block (~line 740). After applying damage, check if it brought hull to
exactly 0, and if so, short-circuit the rest of the event resolution and wash ashore
instead of continuing with the event's normal outcome flow.

```js
if (choice.outcome.hullDamage) {
  if (event.id === "storm" && L.getEquipmentEffect(newState, "stormHullImmune")) {
    newState.log = [...(newState.log || state.log), "The storm batters your ship, but the reinforced rigging holds."];
  } else {
    const newHull = Math.max(0, state.ship.hull - choice.outcome.hullDamage);
    newState.ship = { ...state.ship, hull: newHull };
    if (newHull === 0) {
      return washAshore(newState);   // ← short-circuits the rest of RESOLVE_EVENT
    }
  }
}
```

This needs to sit **after** any crew-loss logic in the same event has already applied to
`newState` (so the crew consequences of the event that damaged the hull aren't lost),
but **before** any further gold/rep/other outcome effects that assume the voyage
continues normally.

---

## Part 3 — Unified Unrecoverable-State Check

### Task 3.1 — Build `isUnrecoverable` in `logic.js`

**Where**: new function in `logic.js`, exported via `window.L`.

```js
// Returns { unrecoverable: boolean, reason: string | null }.
// All conditions must hold simultaneously — this is intentionally strict.
const isUnrecoverable = (state) => {
  const hull0     = state.ship.hull === 0;
  const noCrew    = state.crew.roster.length === 0;
  const notDinghy = state.ship.type !== "dinghy";

  // A dinghy with 0 crew is normal, not a crisis (Task 1.1 exemption).
  const crewCrisis = noCrew && notDinghy;

  // Only meaningful to evaluate when the ship is actually stuck one way or another —
  // either hull-zero (can't sail per Task 1.2) or crew-zero on a non-dinghy (Task 1.1).
  if (!hull0 && !crewCrisis) {
    return { unrecoverable: false, reason: null };
  }

  // Liquid value: cash + everything in the hold, sellable at CURRENT port prices.
  const portGoods = state.portMarket?.goods || {};
  const holdValue = Object.entries(state.hold.items).reduce((sum, [good, qty]) => {
    const sellPrice = portGoods[good]?.sellToPort ?? 0;
    return sum + qty * sellPrice;
  }, 0);
  const liquidValue = state.gold + holdValue;

  // Recovery cost: full repair (only relevant if hull is exactly 0 — a damaged
  // but nonzero hull needs no repair to be considered sailable) + crew to reach
  // the 10% minimum viable ratio for the current ship type.
  const repairCost = hull0 ? window.L.shipRepairCost(state) : 0;
  const minCrew = window.L.getMinViableCrew(state.ship.type);
  const crewNeeded = Math.max(0, minCrew - state.crew.roster.length);
  const crewCost = crewNeeded * 50; // matches HIRE_CREW's flat 50g/crew rate

  const minRecoveryCost = repairCost + crewCost;

  if (liquidValue >= minRecoveryCost) {
    return { unrecoverable: false, reason: null };
  }

  // Can't afford recovery here — check if ANY reachable port could help instead.
  const reachable = window.L.getReachablePortsFromSea
    ? window.L.getReachablePortsFromSea(state)
    : [];
  const hasReachableHelp = reachable.some(portKey => {
    const rep = state.reputation?.[portKey] ?? 50;
    return window.L.getRepPerk(rep).tier !== "at_war"; // services not blocked there
  });

  if (hasReachableHelp) {
    return { unrecoverable: false, reason: null };
  }

  return {
    unrecoverable: true,
    reason: hull0
      ? "Your ship is wrecked, your crew is gone, and there is nothing left to trade or sail with."
      : "There is no one left to crew your ship, no gold to hire more, and nothing left to sell.",
  };
};
```

Export `isUnrecoverable` in the `window.L` return block.

**Verify before relying on it**: `getReachablePortsFromSea` was built for the mid-voyage
reroute feature and may assume an active `route`. When this check runs while docked
(Task 3.3, no active route), confirm it degrades gracefully — if not, add a
`state.currentPort`-based fallback (e.g. looping `L.canReach(state, portKey)` per port)
for the docked case rather than assuming the existing function covers both.

---

### Task 3.2 — Trigger point 1: inside `washAshore`

Already wired in Task 2.2 above — `washAshore` calls `L.isUnrecoverable` on the state it
just built, before returning. This covers both the combat-defeat path and the new
event-triggered path from Task 2.3, since both route through the same shared function.

---

### Task 3.3 — Trigger point 2: on `ENTER_PORT`, checked *before* autosave

**Where**: `engine_port.js`, `case A.ENTER_PORT` (~line 378). This catches the case
`washAshore` can't reach: a non-dinghy ship with intact hull, 0 crew (via
desertion/mutiny/storm death — none of which zero the hull), 0 gold, and empty hold.
Since hull never hit 0, `washAshore` never fires, so this needs its own check.

**Important — ordering matters**: `ENTER_PORT` also autosaves near the end of the case
(`if (state.autoSave !== false) autoSave(nextState);`). The unrecoverable check **must**
run before that autosave call, not after — otherwise the save file gets overwritten with
the losing state, and "Load Last Save" on the game-over screen would just reload the
player right back into the same unrecoverable state, defeating its entire purpose.

```js
case A.ENTER_PORT: {
  // ... existing port-entry logic builds nextState as normal
  // (gossip generation, mission refresh, etc. all still happen first) ...

  const check = L.isUnrecoverable(nextState);
  if (check.unrecoverable) {
    // Skip autosave entirely — preserve whatever save existed before this happened.
    return { ...nextState, screen: "gameover", gameOverReason: check.reason };
  }

  if (state.autoSave !== false) autoSave(nextState);
  return nextState;
}
```

---

## Part 4 — State Shape

### Task 4.1 — Add `gameOverReason` to `initialState`

**Where**: `engine_core.js`, `window.E.initialState`.

```js
gameOverReason: null,
```

### Task 4.2 — Add to `migrateState`

**Where**: `engine_core.js`, `window.E.migrateState`.

```js
if (s.gameOverReason === undefined) s.gameOverReason = null;
```

---

## Part 5 — Extract Shared Career Prose Logic

### Task 5.1 — Move `getCaptainTag` and `getHighlights` from `screens_port.jsx` into `logic.js`

**Where**: both functions currently live inline inside `StatusScreen`
(`screens_port.jsx` ~lines 476–570). They're already pure functions of `state` with no
JSX or component-local state inside them — straightforward to extract as-is. Doing this
means the game-over screen's career summary and the Status screen's career section stay
guaranteed-identical, since both will call the same source.

**In `logic.js`**, add:

```js
// ── Captain identity tag (fame/infamy-derived headline) ──────────────
const getCaptainTag = (state) => {
  const fame = state.fame || 0;
  const infamy = state.infamy || 0;
  if (infamy >= 100) return { text: "Legendary Outlaw of the Caribbean", colorKey: "redBr" };
  if (infamy >= 50)  return { text: "Notorious Across the Caribbean", colorKey: "redBr" };
  if (fame >= 200)   return { text: "A Legend of the Caribbean", colorKey: "gold" };
  if (fame >= 100)   return { text: "A Notorious Captain", colorKey: "gold" };
  if (fame >= 50)    return { text: "A Recognised Captain", colorKey: "gold" };
  if (infamy >= 25)  return { text: "Wanted by the Law", colorKey: "redBr" };
  if (infamy >= 10)  return { text: "A Suspect in Several Ports", colorKey: "gold" };
  return { text: "An Unknown Captain", colorKey: "textDim" };
};

// ── Career narrative highlights (prose lines from career stats) ──────
const getCareerHighlights = (state) => {
  const career = state.career || {};
  const daysSurvived = state.day;
  const portsTotal = Object.keys(window.D.PORTS).length;
  const portsVisitedCount = (career.portsVisited || []).length;
  const totalBattles = (career.battles?.won || 0) + (career.battles?.lost || 0) + (career.battles?.fled || 0);
  const totalCrewLost = (career.crewLost?.inBattle || 0) + (career.crewLost?.inStorm || 0)
                     + (career.crewLost?.deserted || 0) + (career.crewLost?.other || 0);
  const lines = [];

  lines.push(`You have sailed for ${daysSurvived} day${daysSurvived === 1 ? "" : "s"}.`);

  if (totalBattles > 0) {
    const won = career.battles?.won || 0;
    const lost = career.battles?.lost || 0;
    const fled = career.battles?.fled || 0;
    const parts = [];
    if (won > 0) parts.push(`won ${won}`);
    if (lost > 0) parts.push(`lost ${lost}`);
    if (fled > 0) parts.push(`fled ${fled}`);
    lines.push(`Across ${totalBattles} battle${totalBattles === 1 ? "" : "s"}, you have ${parts.join(", ")}.`);

    const sunk = career.shipsSunk || 0;
    const plundered = career.shipsPlundered || 0;
    if (sunk > 0 || plundered > 0) {
      const detailParts = [];
      if (sunk > 0) detailParts.push(`sunk ${sunk}`);
      if (plundered > 0) detailParts.push(`boarded and plundered ${plundered}`);
      lines.push(`Of those, you ${detailParts.join(" and ")}.`);
    }
  }

  if (totalCrewLost > 0) {
    const inBattle = career.crewLost?.inBattle || 0;
    const inStorm = career.crewLost?.inStorm || 0;
    const deserted = career.crewLost?.deserted || 0;
    const parts = [];
    if (inBattle > 0) parts.push(`${inBattle} to combat`);
    if (inStorm > 0) parts.push(`${inStorm} to the storms`);
    if (deserted > 0) parts.push(`${deserted} who walked away`);
    if (parts.length > 0) lines.push(`You have lost ${totalCrewLost} crew: ${parts.join(", ")}.`);
  }

  if (career.longestCrewTenure && career.longestCrewTenure >= 50) {
    lines.push(`Your longest-serving crew member sailed with you for ${career.longestCrewTenure} days.`);
  }

  if (portsVisitedCount > 0) {
    lines.push(`You have made landfall at ${portsVisitedCount} of ${portsTotal} ports across the Caribbean.`);
  }

  const earned = career.goldEarned || 0;
  const spent = career.goldSpent || 0;
  if (earned > 0 || spent > 0) {
    lines.push(`You have earned ${earned.toLocaleString()}g and spent ${spent.toLocaleString()}g.`);
  }

  if (career.stormsSurvived > 0) {
    lines.push(`You have weathered ${career.stormsSurvived} storm${career.stormsSurvived === 1 ? "" : "s"}.`);
  }

  const ships = (career.shipsOwned || []).length;
  if (ships > 1) {
    lines.push(`You have commanded ${ships} ship${ships === 1 ? "" : "s"} over your career.`);
  }

  if (career.contrabandSeized > 0) {
    lines.push(`You have been caught smuggling contraband ${career.contrabandSeized} time${career.contrabandSeized === 1 ? "" : "s"}.`);
  }

  return lines;
};
```

Export both in the `window.L` return block.

### Task 5.2 — Update `StatusScreen` to use the shared functions

**Where**: `screens_port.jsx`. Replace the inline `getCaptainTag`/`getHighlights`
definitions with calls to `L.getCaptainTag(state)` / `L.getCareerHighlights(state)`.
Delete the now-duplicated inline versions. No visual change — this is a pure
extraction, StatusScreen's rendering of the results stays identical.

---

## Part 6 — The Game Over Screen Component

### Task 6.1 — Create `GameOverScreen` in `screens_core.jsx`

**Where**: `screens_core.jsx`, alongside `TitleScreen`/`NewGameScreen`. Modeled on
`MenuModal`'s backdrop+card structure, with two deliberate differences: the backdrop
has **no** `onClick` handler (non-dismissible — clicking outside does nothing), and
there's no close button anywhere in the card.

**Decision confirmed**: hide "Load Last Save" entirely when `L.hasSave()` is false —
same pattern `MenuModal` already uses for its own Load Game button.

```jsx
function GameOverScreen({ state, dispatch }) {
  const captainTag = L.getCaptainTag(state);
  const highlights = L.getCareerHighlights(state);
  const canLoad = L.hasSave();

  const handleLoad = () => dispatch({ type: A.LOAD_GAME });
  const handleMainMenu = () => dispatch({ type: A.NAVIGATE, screen: "title" });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000, // above MenuModal's 1000
      background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
      // Deliberately NO onClick here — non-dismissible.
    }}>
      <div style={{
        background: T.panel,
        border: `1px solid ${T.redBr}`,
        borderRadius: 2,
        padding: T.spacing.lg,
        width: 480,
        maxWidth: "95vw",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
      }}>
        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          fontSize: T.heading1FontSize, fontWeight: "bold",
          color: T.redBr, marginBottom: 4, textAlign: "center",
        }}>
          Your Voyage Ends Here
        </div>
        <div style={{
          fontSize: T.metadataFontSize, color: T.textDim,
          textAlign: "center", marginBottom: 4,
        }}>
          {captainTag.text}
        </div>

        {/* ── Reason ─────────────────────────────────────────── */}
        <div style={{
          fontStyle: "italic", color: T.text,
          textAlign: "center", margin: "16px 0",
          padding: "12px 16px",
          background: T.bgDeep,
          borderLeft: `2px solid ${T.redBr}`,
        }}>
          {state.gameOverReason || "Your journey has come to an end."}
        </div>

        {/* ── Career summary ─────────────────────────────────── */}
        <div style={{
          fontSize: T.captionFontSize, letterSpacing: 1.5, textTransform: "uppercase",
          color: T.gold, marginTop: 20, marginBottom: 8,
        }}>
          The Voyage of {state.captainName || "an Unknown Captain"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {highlights.map((line, i) => (
            <p key={i} style={{ color: T.textDim, fontSize: T.narrativeFontSize, margin: 0, lineHeight: 1.5 }}>
              {line}
            </p>
          ))}
        </div>

        {/* ── Actions ────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
          {canLoad && (
            <Btn v="gold" style={{ width: "100%" }} onClick={handleLoad}>
              <IconFloppy size={12} color={T.gold} /> Load Last Save
            </Btn>
          )}
          <Btn style={{ width: "100%" }} onClick={handleMainMenu}>
            Return to Main Menu
          </Btn>
        </div>
      </div>
    </div>
  );
}
```

**Export**: add `GameOverScreen` to the `Object.assign(window.S, { ... })` block at the
bottom of `screens_core.jsx`.

### Task 6.2 — Wire it into `App.jsx`'s screen router

**Where**: `App.jsx`, `renderScreen()`.

```js
case "gameover":
  return <window.S.GameOverScreen state={state} dispatch={dispatch} />;
```

### Task 6.3 — Render as overlay, not a screen swap (design note)

Because this uses `position: fixed, inset: 0` with a high z-index — exactly like
`MenuModal` — it renders as a full-screen overlay regardless of whatever
`renderScreen()` would otherwise show underneath. Whatever screen the player was on
when they became unrecoverable stays rendered underneath (frozen — the opaque backdrop
prevents any interaction with it), and the game-over card sits on top. No special-casing
needed elsewhere in `App.jsx` beyond the one router case in Task 6.2.

---

## Part 7 — Non-dismissibility Verification

### Task 7.1 — Confirm no escape hatches exist

Checklist to verify once built, since "non-dismissible" needs to hold under every input,
not just mouse clicks:

- [ ] Clicking the dark backdrop does nothing (no `onClick` on the outer div)
- [ ] Pressing `Escape` does nothing (no keydown listener in this component; confirm no
      global Escape handler elsewhere in `App.jsx` accidentally catches it)
- [ ] Browser back button: out of scope to prevent (client-only app, no routing/history
      manipulation)
- [ ] The two buttons (Load / Main Menu) are the only interactive elements reachable
      while this is showing

---

## Full Verification Checklist

| Scenario | Expected result |
|---|---|
| Dinghy, 0 crew, dock at port | `SAIL_TO` still works (Task 1.1 exemption) |
| Sloop, 0 crew, attempt `SAIL_TO` | Blocked with log message, no state change |
| Any ship, 0 hull, attempt `SAIL_TO` | Blocked with log message |
| 0 hull, attempt to accept a `combat` mission | Blocked |
| 0 hull, attempt to accept a `trade` mission | **Allowed** (no fight involved) |
| Storm event reduces hull from 15 to 0 | `washAshore` triggers, returns to `previousPort`, cargo lost |
| Sloop with 3/40 crew (< 4 minimum) | Sail allowed, amber "skeleton crew" warning shown |
| 0 hull, 0 crew, 5000g cash, docked | `isUnrecoverable` → false (liquid value covers recovery) |
| 0 hull, 0 crew, 0 gold, empty hold, no reachable friendly port | `isUnrecoverable` → true, game over |
| 0 hull, 0 crew, 0 gold, but 50 units of sellable cargo in hold | `isUnrecoverable` → false (hold value covers recovery) |
| Intact hull, 0 crew (deserted), 0 gold, empty hold, non-dinghy, `ENTER_PORT` fires | Game over triggers via Task 3.3, not Task 3.2 |
| Same as above, but ship is a dinghy | `isUnrecoverable` → false (dinghy exemption) |
| Player has a save, becomes unrecoverable | Modal shows reason + career summary + both buttons |
| Player has never saved, becomes unrecoverable | Modal shows reason + career summary + only "Main Menu" button |
| Click the dark backdrop | Nothing happens, modal stays open |
| Click "Load Last Save" | `LOAD_GAME` dispatches, modal disappears |
| Click "Return to Main Menu" | `NAVIGATE` to `"title"`, modal disappears, title screen shows |
| After "Main Menu", start a new game | `START_GAME` fully replaces state — `gameOverReason` resets to `null` |
| Become unrecoverable via `washAshore` (combat/event path) | No autosave-ordering issue — `washAshore` never autosaves |
| Become unrecoverable via `ENTER_PORT` | Autosave is skipped (Task 3.3) — the save the player loads is from *before* the unrecoverable state |
| Career summary content | Matches `StatusScreen`'s career section exactly — both call `L.getCareerHighlights` |

---

## Out of Scope — noted, not blocking

- **`getReachablePortsFromSea` docked-state behavior** — flagged in Task 3.1 as needing
  verification before relying on it; may need a companion function for the docked
  (non-route) case.
- **Difficulty settings interaction (roadmap B21.5)**: once difficulty modes exist, they
  may want to adjust `isUnrecoverable`'s thresholds per mode. Not needed now — current
  thresholds are difficulty-neutral by design.
- **Legend score / retirement flow overlap (roadmap B21)**: this screen is explicitly a
  *failure* end state, distinct from the planned voluntary retirement screen. They'll
  share the career-prose functions from Part 5, but retirement's own design (victory
  framing, legend score, "one more thing" hook) is a separate task.

---

## Build Order

1. Part 5 (career prose extraction) — fully independent, do first or in parallel
2. Part 4 (state shape) — trivial, do early
3. Part 3, Task 3.1 (`isUnrecoverable`) — needed before Part 2 can wire its check in
4. Part 1 (prevention gates) — independent of everything else, any time
5. Part 2 (wash-ashore generalization, references `isUnrecoverable` from step 3)
6. Part 3, Task 3.3 (`ENTER_PORT` trigger, with the autosave-ordering fix)
7. Part 6 (game-over screen) — needs Parts 4 and 5 done first
8. Part 7 (verification pass)