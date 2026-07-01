// engine_career.js
// ─────────────────────────────────────────────────────────────────────────────
// Career stats middleware.
// Tracks running totals (gold, battles, crew, ports, ships, storms, contraband)
// and detailed logs (missions, combats) — all without touching domain reducers.
//
// Depends on: window.E (action constants, reducer chain, __prevState on actions)
//             window.D.DEFAULT_CAREER (single source of truth for shape)
// Exposes:    nothing — pushes one reducer into window.E._reducers
//
// Load after engine_onboarding.js (runs after domain reducers, same as onboarding).
//
// Note on delta-based tracking:
//   Any state-delta detection (gold, crew, hold) should be gated to the specific
//   action that performed the delta. Wholesale state replacement actions
//   (START_GAME, LOAD_GAME, IMPORT_SAVE) should be excluded — see SKIP_GOLD_TRACKING.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  const A = window.E.A;

  // Actions that wholesale-replace state and should not contribute to career deltas.
  const SKIP_GOLD_TRACKING = [A.START_GAME, A.LOAD_GAME, A.IMPORT_SAVE];

  // ── Combat log entry builder (avoids repetition) ─────────────────────────
  // Note: `plundered` always starts as false. The TAKE_PLUNDER handler updates
  // the most recent entry's plundered flag to true if the player actually plunders.
  const buildCombatLogEntry = (state, prevState, battle, outcome, crewLost) => ({
    day: state.day,
    encounterType: battle.encounterType || "unknown",
    enemyName: battle.enemy?.name || "Unknown",
    enemyFaction: battle.enemy?.faction,
    enemyShipType: window.L.guessShipType?.(battle.enemy) || "sloop",
    outcome,
    playerShipType: prevState.ship?.type,
    crewLost,
    plundered: false,
  });

  // ── Middleware reducer ──────────────────────────────────────────────────

  function careerMiddleware(state, action) {
    const nextCareer = { ...state.career };
    let changed = false;
    const prevState = action.__prevState || state;

    // ── Gold earned / spent (net deltas only — documented simplification) ──
    // Skipped for wholesale state replacements (game start, load, import).
    if (!SKIP_GOLD_TRACKING.includes(action.type)) {
      const goldDelta = (state.gold ?? 0) - (prevState.gold ?? 0);
      if (goldDelta > 0) {
        nextCareer.goldEarned = (nextCareer.goldEarned || 0) + goldDelta;
        changed = true;
      } else if (goldDelta < 0) {
        nextCareer.goldSpent = (nextCareer.goldSpent || 0) + Math.abs(goldDelta);
        changed = true;
      }
    }

    switch (action.type) {
      // ── Crew hiring ───────────────────────────────────────────
      case A.HIRE_CREW: {
        const count = action.count || 0;
        if (count > 0) {
          nextCareer.crewHired = (nextCareer.crewHired || 0) + count;
          changed = true;
        }
        break;
      }

      // ── Crew dismissal ────────────────────────────────────────
      case A.DISMISS_CREW: {
        const memberId = action.memberId;
        if (memberId) {
          nextCareer.crewDismissed = (nextCareer.crewDismissed || 0) + 1;
          const prevRoster = prevState.crew?.roster || [];
          const member = prevRoster.find(m => m.id === memberId);
          if (member) {
            const days = member.daysAboard || 0;
            if (days > (nextCareer.longestCrewTenure || 0)) {
              nextCareer.longestCrewTenure = days;
            }
          }
          changed = true;
        }
        break;
      }

      // ── Enter port — visited ports + desertion detection ──────
      case A.ENTER_PORT: {
        // Track visited port
        const portKey = state.currentPort;
        if (portKey && !(nextCareer.portsVisited || []).includes(portKey)) {
          nextCareer.portsVisited = [...(nextCareer.portsVisited || []), portKey];
          changed = true;
        }

        // Detect desertion: crew in prev roster but not in current roster
        const prevRoster = prevState.crew?.roster || [];
        const currRoster = state.crew?.roster || [];
        const departed = prevRoster.filter(p => !currRoster.find(c => c.id === p.id));

        if (departed.length > 0) {
          // ENTER_PORT only removes crew via desertion (defeat clears crew before ENTER_PORT)
          nextCareer.crewLost = nextCareer.crewLost || { inBattle: 0, inStorm: 0, deserted: 0, other: 0 };
          nextCareer.crewLost.deserted += departed.length;
          departed.forEach(m => {
            const days = m.daysAboard || 0;
            if (days > (nextCareer.longestCrewTenure || 0)) {
              nextCareer.longestCrewTenure = days;
            }
          });
          changed = true;
        }
        break;
      }

      // ── Buy ship → track ownership ────────────────────────────
      case A.BUY_SHIP: {
        const shipType = action.shipType;
        if (shipType) {
          nextCareer.shipsOwned = [
            ...(nextCareer.shipsOwned || []),
            { type: shipType, dayAcquired: state.day },
          ];
          changed = true;
        }
        break;
      }

      // ── Resolve event — storms survived + crew loss ───────────
      case A.RESOLVE_EVENT: {
        const event = prevState.activeEvent;
        if (!event) break;

        // Count storms survived
        if (event.id === "storm") {
          nextCareer.stormsSurvived = (nextCareer.stormsSurvived || 0) + 1;
          changed = true;
        }

        // Detect crew loss from state delta
        const prevRoster = prevState.crew?.roster || [];
        const currRoster = state.crew?.roster || [];
        const lostMembers = prevRoster.filter(p => !currRoster.find(c => c.id === p.id));

        if (lostMembers.length > 0) {
          nextCareer.crewLost = nextCareer.crewLost || { inBattle: 0, inStorm: 0, deserted: 0, other: 0 };
          if (event.id === "storm") {
            nextCareer.crewLost.inStorm += lostMembers.length;
          } else {
            nextCareer.crewLost.other += lostMembers.length;
          }
          lostMembers.forEach(m => {
            const days = m.daysAboard || 0;
            if (days > (nextCareer.longestCrewTenure || 0)) {
              nextCareer.longestCrewTenure = days;
            }
          });
          changed = true;
        }
        break;
      }

      // ── Contraband seized — detect from hold delta ────────────
      case A.PATROL_INSPECT: {
        const prevHold = prevState.hold?.items || {};
        const currHold = state.hold?.items || {};
        const tobaccoLost = Math.max(0, (prevHold.tobacco || 0) - (currHold.tobacco || 0));
        const slavesLost  = Math.max(0, (prevHold.slaves || 0) - (currHold.slaves || 0));

        if (tobaccoLost + slavesLost > 0) {
          nextCareer.contrabandSeized = (nextCareer.contrabandSeized || 0) + 1;
          changed = true;
        }
        break;
      }

      // ── Battle conclusion → combat stats + crew loss ─────────
      // Note: shipsPlundered is NO LONGER tracked here. It's tracked in TAKE_PLUNDER
      // because "could plunder" ≠ "did plunder" — the player can choose to sail away.
      case A.DISMISS_BATTLE: {
        const battle = prevState.battleState;
        if (!battle) break;

        const outcome = battle.phase; // "victory", "defeat", "fled"
        const prevRoster = prevState.crew?.roster || [];
        const currRoster = state.crew?.roster || [];
        const lostInBattle = prevRoster.filter(p => !currRoster.find(c => c.id === p.id));
        const crewLostThisBattle = lostInBattle.length;

        // Update battle counters + combat log entry
        if (!nextCareer.battles) nextCareer.battles = { won: 0, lost: 0, fled: 0 };

        if (outcome === "victory") {
          nextCareer.battles.won++;
          
          // Only count as "sunk" if the ship was destroyed (hull-zero path).
          // Grapple wins leave the ship boardable (canPlunder: true).
          if (!battle.canPlunder) {
            nextCareer.shipsSunk = (nextCareer.shipsSunk || 0) + 1;
          }
          
          nextCareer.combatLog = [...(nextCareer.combatLog || []),
            buildCombatLogEntry(state, prevState, battle, "won", crewLostThisBattle)];
        } else if (outcome === "defeat") {
          nextCareer.battles.lost++;
          nextCareer.combatLog = [...(nextCareer.combatLog || []),
            buildCombatLogEntry(state, prevState, battle, "lost", crewLostThisBattle)];

          // Mission failure via combat defeat
          const failedMission = prevState.activeMission;
          if (failedMission && (failedMission.type === "combat" ||
              battle.encounterType === "escort_defend")) {
            nextCareer.missionLog = [...(nextCareer.missionLog || []), {
              day: state.day,
              faction: failedMission.faction,
              type: failedMission.type,
              risk: failedMission.risk,
              status: "failed",
              gold: 0,
              fame: 0,
              infamyGain: 0,
              targetPort: failedMission.targetPort,
              daysToComplete: state.day - (failedMission.acceptedDay || state.day),
            }];
          }
        } else if (outcome === "fled") {
          nextCareer.battles.fled++;
          nextCareer.combatLog = [...(nextCareer.combatLog || []),
            buildCombatLogEntry(state, prevState, battle, "fled", crewLostThisBattle)];
        }

        // Track crew lost in battle (deaths)
        if (crewLostThisBattle > 0) {
          nextCareer.crewLost = nextCareer.crewLost || { inBattle: 0, inStorm: 0, deserted: 0, other: 0 };
          nextCareer.crewLost.inBattle += crewLostThisBattle;
          lostInBattle.forEach(m => {
            const days = m.daysAboard || 0;
            if (days > (nextCareer.longestCrewTenure || 0)) {
              nextCareer.longestCrewTenure = days;
            }
          });
        }

        changed = true;
        break;
      }

// ── Plunder taken — actual plunder tracking ───────────────
      // TAKE_PLUNDER fires when the player grapple-wins and chooses to plunder.
      // DISMISS_BATTLE NEVER fires in this path — the plunder screen replaces it.
      // So this handler must also do everything DISMISS_BATTLE would have done:
      //   - increment battles.won
      //   - track crew lost during the battle
      //   - add a combat log entry (marked as plundered)
      //
      // Other paths:
      //   - sink-win → DISMISS_BATTLE handles it (canPlunder is false)
      //   - grapple-win + sail away → DISMISS_BATTLE handles it (canPlunder is true but no plunder)
      case A.TAKE_PLUNDER: {
        const battle = prevState.battleState;

        // Always count the plunder act itself
        nextCareer.shipsPlundered = (nextCareer.shipsPlundered || 0) + 1;
        changed = true;

        // Defensive: if there's no battle state, we can't do the rest
        if (!battle) break;

        // Count the won battle (DISMISS_BATTLE won't fire in this path)
        if (!nextCareer.battles) nextCareer.battles = { won: 0, lost: 0, fled: 0 };
        nextCareer.battles.won++;

        // Track crew lost during this battle
        const prevRoster = prevState.crew?.roster || [];
        const currRoster = state.crew?.roster || [];
        const lostInBattle = prevRoster.filter(p => !currRoster.find(c => c.id === p.id));
        const crewLostThisBattle = lostInBattle.length;

        if (crewLostThisBattle > 0) {
          nextCareer.crewLost = nextCareer.crewLost || { inBattle: 0, inStorm: 0, deserted: 0, other: 0 };
          nextCareer.crewLost.inBattle += crewLostThisBattle;
          lostInBattle.forEach(m => {
            const days = m.daysAboard || 0;
            if (days > (nextCareer.longestCrewTenure || 0)) {
              nextCareer.longestCrewTenure = days;
            }
          });
        }

        // Add a combat log entry, marked as plundered from the start
        const entry = buildCombatLogEntry(state, prevState, battle, "won", crewLostThisBattle);
        entry.plundered = true;
        nextCareer.combatLog = [...(nextCareer.combatLog || []), entry];

        break;
      }

      // ── Mission completion ────────────────────────────────────
      case A.COMPLETE_MISSION: {
        const mission = prevState.activeMission;
        if (mission && !state.activeMission) {
          nextCareer.missionLog = [...(nextCareer.missionLog || []), {
            day: state.day,
            faction: mission.faction,
            type: mission.type,
            risk: mission.risk,
            status: "completed",
            gold: mission.gold || 0,
            fame: mission.fame || 0,
            infamyGain: mission.infamyGain || 0,
            targetPort: mission.targetPort,
            daysToComplete: state.day - (mission.acceptedDay || state.day),
          }];
          changed = true;
        }
        break;
      }

      // ── Mission abandoned ─────────────────────────────────────
      case A.ABANDON_MISSION: {
        const mission = prevState.activeMission;
        if (mission) {
          nextCareer.missionLog = [...(nextCareer.missionLog || []), {
            day: state.day,
            faction: mission.faction,
            type: mission.type,
            risk: mission.risk,
            status: "abandoned",
            gold: 0,
            fame: 0,
            infamyGain: 0,
            targetPort: mission.targetPort,
            daysToComplete: state.day - (mission.acceptedDay || state.day),
          }];
          changed = true;
        }
        break;
      }

      // ── Game start — initialize career with starting port ─────
      case A.START_GAME: {
        const startPort = state.currentPort;
        if (startPort) {
          nextCareer.portsVisited = [startPort];
          changed = true;
        }
        break;
      }

      default:
        break;
    }

    if (changed) {
      return { ...state, career: nextCareer };
    }
    return state;
  }

  window.E._reducers.push(careerMiddleware);
})();