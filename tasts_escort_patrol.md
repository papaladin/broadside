# Escort & Patrol Mission Enhancement

## Overview

Add combat encounters to **Escort** (guaranteed convoy protection fight) and **Patrol** (optional proximity‑based search) missions, using the existing `mission_combat` encounter type and battle flow. No new screens or state fields required.

---

## Task List

| Task | File | Description |
|------|------|-------------|
| **E.1** | `generators.js` | **Escort enemy generation** – In the escort mission branch of `generateMissions`, generate an enemy (using `generateEnemy(risk, state.fame, missionFaction)`) and attach it to the mission object (`mission.enemy`). |
| **E.2** | `engine.js` (`ADVANCE_DAY`) | **Escort encounter check** – Add a block (after smuggle, before random event) that triggers when `activeMission.type === "escort"`, not yet occurred, and destination matches. Compute daily probability `0.20 + 0.60 * progress`; force on last day. On trigger, build a `mission_combat` encounter, mark `encounterOccurred: true`. |
| **P.1** | `generators.js` | **Patrol target port** – Modify the patrol branch of `generateMissions` to pick a target port (a rival faction port of the commissioning faction). Fallback: any port of a different faction. Attach `targetPort` and update mission name/description (e.g. “Patrol the waters near Havana”). |
| **P.2** | `generators.js` | **Patrol enemy generation** – In the same branch, generate an enemy using `generateEnemy(risk, state.fame, missionFaction)` and attach it as `mission.enemy`. |
| **P.3** | `engine.js` (`ADVANCE_DAY`) | **Patrol encounter check** – Add a block that triggers when `activeMission.type === "patrol"`, not yet occurred, and destination matches. Only when `progress > 0.60`, compute chance `0.20 + 0.60 * (progress - 0.60) / 0.40`. If triggered, build a `mission_combat` encounter, mark `encounterOccurred: true`. Never forced. |
| **D.1** | `engine.js` (`DISMISS_BATTLE`) | **Mission failure on defeat/flee** – Extend the existing `mission_combat` defeat/flee handling to also cover escort and patrol missions. If `battleState.encounterType === "mission_combat"` and `activeMission.type` is `"escort"` or `"patrol"`, clear `activeMission` and log failure. |
| **T.1** | Manual test | **Playtest** – Accept an escort mission, verify the fight occurs during the voyage, win/lose/flee to check outcomes. Accept a patrol mission, verify that sailing to the patrol zone can trigger a fight, and that arriving without a fight still completes the mission. |

---

## Dependencies

- E.1 → E.2
- P.1 & P.2 → P.3
- D.1 after E.2 & P.3 (can be done in parallel)
- Manual test after all changes

---

## Code Placement

### `ADVANCE_DAY` blocks

Insert **after** the existing smuggle patrol block and **before** the random event block. The escort block goes first, then patrol.

```js
// ── Escort / Patrol mission encounter check ──────────────────
if (state.activeMission && !state.activeMission.encounterOccurred &&
    state.destination === state.activeMission.targetPort && newDays >= 1) {
  const mission = state.activeMission;
  const progress = 1 - (newDays / state.sailingDaysTotal);

  if (mission.type === "escort") {
    const chance = 0.20 + 0.60 * progress;
    if (newDays <= 1 || Math.random() < chance) {
      const enemy = mission.enemy || G.generateEnemy("medium", state.fame, mission.faction);
      const ctx = L.buildEncounterContext(state, "mission_combat", enemy);
      const newActiveMission = { ...mission, encounterOccurred: true };
      return {
        ...state,
        activeMission: newActiveMission,
        encounterContext: ctx,
        screen: "intercept",
        log: [...newLog, "The convoy is under attack!"]
      };
    }
  } else if (mission.type === "patrol") {
    if (progress > 0.60) {
      const chance = 0.20 + 0.60 * (progress - 0.60) / 0.40;
      if (Math.random() < chance) {
        const enemy = mission.enemy || G.generateEnemy("medium", state.fame, mission.faction);
        const ctx = L.buildEncounterContext(state, "mission_combat", enemy);
        const newActiveMission = { ...mission, encounterOccurred: true };
        return {
          ...state,
          activeMission: newActiveMission,
          encounterContext: ctx,
          screen: "intercept",
          log: [...newLog, "You spot a hostile vessel in the patrol zone!"]
        };
      }
    }
  }
}
```

### DISMISS_BATTLE block

Extend the existing mission‑fled/defeat block to also fail escort/patrol:

```js
// Existing combat mission failure
if (battleState.phase === "fled" && battleState.encounterType === "mission_combat") {
  const missionType = state.activeMission?.type;
  if (missionType === "combat" || missionType === "escort" || missionType === "patrol") {
    return {
      ...state,
      battleState: null,
      activeMission: null,
      screen: "sailing",
      log: [...state.log, "You fled the battle. The mission is a failure."],
    };
  }
}
```