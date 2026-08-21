// engine_battle.js – Combat Resolution (BATTLE_ACTION, DISMISS_BATTLE, TAKE_PLUNDER)
// Registers its reducer into window.E._reducers.

(() => {
  const { A } = window.E;
  const { PORTS, FACTIONS, SURRENDER_CONSEQUENCE } = window.D;
  const D = window.D;
  const L = window.L;
  const G = window.G;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  HELPERS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ── Build a narrative round log using the combined templates ───────
  const buildRoundLog = (phase, playerAction, npcAction, result, battle, state) => {
    const T = D.COMBAT_LOG_TEMPLATES;
    if (!T) return "";

    const templates = T[phase];
    if (!templates) return "";

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const formatLostNames = (names) => {
      if (!names || names.length === 0) return "";
      const shown = names.slice(0, 3).join(", ");
      if (names.length <= 3) return ` (lost: ${shown})`;
      return ` (lost: ${shown} and ${names.length - 3} others)`;
    };

    // --- Naval phase ---
    if (phase === "naval") {
      let logs = [];

      const isDistanceAction = (act) => act === "close_distance" || act === "open_distance";
      const playerMoved = isDistanceAction(playerAction);
      const enemyMoved = isDistanceAction(npcAction);

      // 1. Distance change logs (if either side moved)
      if (playerMoved && !enemyMoved) {
        const key = playerAction === "close_distance" ? "close_distance_success" : "open_distance_success";
        const pool = templates.player[key];
        if (pool) {
          const log = pick(pool).replace(/\{distance\}/g, result.newDistance || battle.distance);
          logs.push(log);
        } else {
          logs.push(`You move to ${result.newDistance || battle.distance} range.`);
        }
      } else if (enemyMoved && !playerMoved) {
        const key = npcAction === "close_distance" ? "close_distance_success" : "open_distance_success";
        const pool = templates.npc[key];
        if (pool) {
          const log = pick(pool).replace(/\{distance\}/g, result.newDistance || battle.distance);
          logs.push(log);
        } else {
          logs.push(`The enemy moves to ${result.newDistance || battle.distance} range.`);
        }
      } else if (playerMoved && enemyMoved) {
        let key;
        const bothClose = playerAction === "close_distance" && npcAction === "close_distance";
        const bothOpen = playerAction === "open_distance" && npcAction === "open_distance";
        if (bothClose) key = "both_close";
        else if (bothOpen) key = "both_open";
        else {
          const winner = result.distanceChangeWinner || "none";
          const playerWantsClose = playerAction === "close_distance";
          const enemyWantsClose = npcAction === "close_distance";
          if (playerWantsClose && !enemyWantsClose) {
            key = winner === "player" ? "close_vs_open_player_wins" : "close_vs_open_enemy_wins";
          } else {
            key = winner === "player" ? "open_vs_close_player_wins" : "open_vs_close_enemy_wins";
          }
        }
        const pool = templates.combined?.[key];
        if (pool) {
          const log = pick(pool).replace(/\{distance\}/g, result.newDistance || battle.distance);
          logs.push(log);
        } else {
          logs.push(`The distance changes to ${result.newDistance || battle.distance}.`);
        }
      }

      // 2. Damage / grapple / evade logs (only for non‑movement actions)
      const playerTemplate = templates.player;
      const npcTemplate = templates.npc;

      if (!playerMoved) {
        if (playerAction === "broadside") {
          const log = pick(playerTemplate.broadside)
            .replace("{hull}", result.enemyHullDamage || 0)
            .replace("{crew}", result.enemyCrewLoss || 0);
          logs.push(log);
        } else if (playerAction === "precision") {
          if (result.playerHit) {
            const log = pick(playerTemplate.precision_hit)
              .replace("{hull}", result.enemyHullDamage || 0)
              .replace("{crew}", result.enemyCrewLoss || 0);
            logs.push(log);
          } else {
            logs.push(pick(playerTemplate.precision_miss));
          }
        } else if (playerAction === "grapple") {
          if (result.outcome === "boarding_begins" || result.playerGrappleSuccess) {
            logs.push(pick(playerTemplate.grapple_success));
          } else {
            logs.push(pick(playerTemplate.grapple_fail));
          }
        } else if (playerAction === "evade") {
          if (result.fled) logs.push(pick(playerTemplate.evade_success));
          else logs.push(pick(playerTemplate.evade_fail));
        }
      }

      if (!enemyMoved) {
        if (npcAction === "broadside") {
          const log = pick(npcTemplate.broadside)
            .replace("{hull}", result.playerHullDamage || 0)
            .replace("{crew}", result.playerCrewLoss || 0);
          logs.push(log);
        } else if (npcAction === "precision") {
          if (result.npcHit) {
            const log = pick(npcTemplate.precision_hit)
              .replace("{hull}", result.playerHullDamage || 0)
              .replace("{crew}", result.playerCrewLoss || 0);
            logs.push(log);
          } else {
            logs.push(pick(npcTemplate.precision_miss));
          }
        } else if (npcAction === "grapple") {
          if (result.outcome === "boarding_begins" || result.npcGrappleSuccess) {
            logs.push(pick(npcTemplate.grapple_success));
          } else {
            logs.push(pick(npcTemplate.grapple_fail));
          }
        } else if (npcAction === "evade") {
          if (result.fled) logs.push(pick(npcTemplate.evade_success));
          else logs.push(pick(npcTemplate.evade_fail));
        }
      }

      return logs.join(" ") || "The round passes without event.";
    }

    // --- Boarding phase ---
    if (phase === "boarding") {
      const mapAction = (a) => {
        if (a === "continue_fighting") return "continue";
        if (a === "fall_back") return "fall_back";
        if (a === "demand_surrender") return "demand_surrender";
        if (a === "surrender") return "surrender";
        return a;
      };

      const pAction = mapAction(playerAction);
      const nAction = mapAction(npcAction);

      // Special cases: surrender
      if (pAction === "surrender") {
        const pool = templates.combined?.surrender_vs_anything;
        if (pool) return pick(pool);
      }
      if (nAction === "surrender") {
        const pool = templates.combined?.enemy_surrender;
        if (pool) return pick(pool);
      }

      const key = `${pAction}_vs_${nAction}`;
      let pool = templates.combined?.[key];

      if (!pool && result.outcome && templates.outcome?.[result.outcome]) {
        return pick(templates.outcome[result.outcome]);
      }

      if (!pool) return "";

      const template = pick(pool);
      let log = template
        .replace(/\{crewLost\}/g, result.playerCrewLoss || 0)
        .replace(/\{enemyCrewLost\}/g, result.enemyCrewLoss || 0);

      const names = battle.lostCrewNames || [];
      const nameSuffix = formatLostNames(names);
      log = log.replace(/\{lostNames\}/g, nameSuffix);

      return log;
    }

    return "";
  };

  // ── Apply crew loss to state ──────────────────────────────────────────
  const applyCrewLossToState = (state, crewLoss) => {
    if (crewLoss <= 0) return { state, lostNames: [], lostCount: 0 };
    const safeLoss = Math.min(crewLoss, state.crew.roster.length);
    if (safeLoss <= 0) return { state, lostNames: [], lostCount: 0 };
    const { newRoster, removed } = L.removeRandomCrew(state.crew.roster, safeLoss);
    const lostNames = removed.map(m => `${m.firstName} ${m.lastName}`);
    return {
      state: { ...state, crew: { ...state.crew, roster: newRoster } },
      lostNames,
      lostCount: safeLoss,
    };
  };

  // ── Apply victory aftermath (upset tagging, battle scars) ───────────
  const applyVictoryAftermath = (currentState) => {
    const session = currentState.encounterSession;
    if (!session) return currentState;
    let s = currentState;

    // Upset tagging
    if (s.crew?.roster) {
      const enemyFaction = session.enemy?.faction;
      if (enemyFaction) {
        const upsetMembers = [];
        const updatedRoster = s.crew.roster.map(member => {
          if (member.faction === enemyFaction && !L.hasTag(member, "upset") && !L.hasTag(member, "loyal") && Math.random() < 0.15) {
            upsetMembers.push(`${member.firstName} ${member.lastName}`);
            return L.addTag(member, "upset");
          }
          return member;
        });

        if (upsetMembers.length > 0) {
          const newLog = [...s.log];
          if (upsetMembers.length === 1) {
            newLog.push(window.E.logEntry(s, `${upsetMembers[0]} is disturbed by the attack on ${FACTIONS[enemyFaction]?.label || enemyFaction} ships.`));
          } else if (upsetMembers.length === 2) {
            newLog.push(window.E.logEntry(s, `${upsetMembers[0]} and ${upsetMembers[1]} are disturbed by the attack on ${FACTIONS[enemyFaction]?.label || enemyFaction} ships.`));
          } else {
            newLog.push(window.E.logEntry(s, `Some of the crew are disturbed by the attack on ${FACTIONS[enemyFaction]?.label || enemyFaction} ships.`));
          }
          s = { ...s, crew: { ...s.crew, roster: updatedRoster }, log: newLog };
        }
      }
    }

    // Battle scar
    if (session.battle && s.crew?.roster) {
      const initialCrew = session.battle.initialPlayerCrew ?? s.crew.roster.length;
      const lostCount = initialCrew - s.crew.roster.length;
      if (lostCount >= 10) {
        const scarredRoster = s.crew.roster.map(member =>
          L.hasTag(member, "scar_battle") ? member : L.addTag(member, "scar_battle")
        );
        s = { ...s, crew: { ...s.crew, roster: scarredRoster } };
      }
    }

    return s;
  };

  // ── Handles all victory‑with‑plunder outcomes ────────────────────────
  // FIX: added battleLogMessage parameter to also append to battle log
  const handleVictoryWithPlunder = (state, session, battle, result, logMessage, battleLogMessage) => {
    const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
    const updatedState = crewResult.state;
    const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];
    const enemy = session.enemy;
    const plunder = G.generateEnemyCargo(state, enemy, enemy.risk || "medium");

    // Append the victory message to the battle log
    const updatedBattleLog = [...battle.log, battleLogMessage];

    const newBattle = {
      ...battle,
      playerHull: Math.max(0, battle.playerHull - result.playerHullDamage),
      playerCrew: crewResult.state.crew.roster.length,
      enemyHull: Math.max(0, battle.enemyHull - result.enemyHullDamage),
      enemyCrew: Math.max(0, battle.enemyCrew - result.enemyCrewLoss),
      phase: "victory",
      canPlunder: true,
      goldReward: plunder.gold,
      enemyCargo: plunder.cargo,
      log: updatedBattleLog, // <-- now includes victory message
      lostCrewNames: newLostNames,
    };
    const newSession = { ...session, battle: newBattle };
    let currentState = applyVictoryAftermath({ ...updatedState, encounterSession: newSession });

    // Also add to state log (captain's log)
    return {
      ...currentState,
      encounterSession: newSession,
      screen: "battle",
      log: [...currentState.log, window.E.logEntry(currentState, logMessage)],
    };
  };

  // ── Patrol victory marking ───────────────────────────────────────────
  const handlePatrolVictory = (currentState) => {
    const session = currentState.encounterSession;
    if (!session || session.type !== "mission_combat") return null;
    const missionType = currentState.activeMission?.type;
    if (missionType !== "patrol" || !currentState.activeMission) return null;

    return {
      ...currentState,
      encounterSession: null,
      activeMission: { ...currentState.activeMission, enemyDefeated: true },
      screen: session.returnScreen === "sailing" ? "sailing" : "port",
      log: [...currentState.log, window.E.logEntry(currentState, "The patrol zone is clear.")],
    };
  };

  // ── Mission failed due to fleeing ────────────────────────────────────
  const handleFledMission = (currentState) => {
    const session = currentState.encounterSession;
    if (!session) return null;
    const isMissionFight = session.type === "mission_combat" || session.type === "escort_defend";
    if (!isMissionFight) return null;
    const returnToSailing = currentState.destination && currentState.sailingDaysLeft > 0;
    return {
      ...currentState,
      encounterSession: null,
      activeMission: null,
      screen: returnToSailing ? "sailing" : "port",
      log: [...currentState.log, window.E.logEntry(currentState, L.logPick(D.FLED_MESSAGES, currentState)), window.E.logEntry(currentState, "The mission is a failure.")],
    };
  };

  // ── WASH ASHORE (generalized defeat handler) ──────────────────────────
  const washAshore = (state, battleState = null, extraLog = []) => {
    const returnPort = state.previousPort || state.currentPort;
    const portName = D.PORTS[returnPort]?.name || "a nearby port";

    const session = state.encounterSession;
    const isMissionFight = session && (
      session.type === "mission_combat" ||
      session.type === "escort_defend"
    );
    const missionFailed = isMissionFight && state.activeMission;

    const defeatLog = session
      ? L.logPick(D.DEFEAT_MESSAGES, state, session.enemy?.name || "unknown", portName)
      : `The ship, crippled and adrift, washes ashore near ${portName}.`;

    const infamyGain = session && (extraLog.length > 0 || session.type === "navy_patrol" || session.type === "navy_patrol_combat") ? 2 : 0;

    const result = {
      ...state,
      encounterSession: null,
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
      infamy: Math.min(999, (state.infamy ?? 0) + infamyGain),
      log: [
        ...state.log,
        window.E.logEntry(state, defeatLog),
        window.E.logEntry(state, "All cargo lost."),
        ...(missionFailed ? [window.E.logEntry(state, "The mission has failed.")] : []),
        ...extraLog,
      ],
    };

    const check = L.isUnrecoverable(result);
    if (check.unrecoverable) {
      return { ...result, screen: "gameover", gameOverReason: check.reason };
    }
    return result;
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  EXPOSE SHARED HELPERS FOR OTHER ENGINE FILES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  window.E.applyCrewLossToState = applyCrewLossToState;
  window.E.washAshore = washAshore;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  REDUCER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  window.E._reducers.push((state, action) => {
    switch (action.type) {

      // ── COMBAT ──────────────────────────────────────────────

      case A.BATTLE_ACTION: {
        const session = state.encounterSession;
        if (!session || session.phase !== "battle" || !session.battle) return state;

        const battle = session.battle;
        const enemy = session.enemy;
        const playerAction = action.action;

        // NPC action
        let enemyAction;
        if (battle.subPhase === "naval") {
          enemyAction = L.getNPCNavalAction(battle, enemy);
        } else {
          const ratio = L.getBoardingRatio(state, battle, enemy);
          enemyAction = L.getNPCBoardingAction(battle, enemy, ratio);
        }

        // Resolve
        let result;
        if (battle.subPhase === "naval") {
          result = L.resolveNavalRound(state, playerAction, enemyAction, battle, enemy);
        } else {
          result = L.resolveBoardingRound(state, playerAction, enemyAction, battle, enemy);
        }

        const newLog = [...battle.log];
        const roundLog = buildRoundLog(battle.subPhase, playerAction, enemyAction, result, battle, state);
        if (roundLog) newLog.push(roundLog);

        // ── Grapple‑vs‑Open specific log ──────────────────────────────
        if (battle.subPhase === "naval" &&
            playerAction === "grapple" &&
            result.outcome === "continue" &&
            result.newDistance !== "close") {
          newLog.push("You try to grapple, but the enemy opens the distance – your hooks fall short.");
        }

        // ── Process outcome ──────────────────────────────────────────────
        switch (result.outcome) {

          // ---- Evade (immediate session clear) ----
          case "player_evaded":
          case "enemy_evaded": {
            const who = result.outcome === "player_evaded" ? "You" : "The enemy";
            const logMsg = `${who} evaded successfully and broke contact.`;
            const newScreen = L.returnScreen(state);
            let nextState = { ...state, encounterSession: null, screen: newScreen, log: [...state.log, window.E.logEntry(state, logMsg)] };
            const sessionType = state.encounterSession?.type;
            if ((sessionType === "mission_combat" || sessionType === "escort_defend") && state.activeMission) {
              nextState.activeMission = null;
              nextState.log.push(window.E.logEntry(state, "The mission has been abandoned."));
            }
            return nextState;
          }

          // ---- Boarding transition ----
          case "boarding_begins": {
            const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newPlayerCrew = updatedState.crew.roster.length;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            const newBattle = {
              ...battle,
              playerCrew: newPlayerCrew,
              enemyCrew: Math.max(0, battle.enemyCrew - result.enemyCrewLoss),
              subPhase: "boarding",
              distance: "close",
              log: newLog,
              phase: "player_turn",
              lostCrewNames: newLostNames,
            };
            const newSession = { ...session, battle: newBattle };
            return {
              ...updatedState,
              encounterSession: newSession,
              log: [...updatedState.log, window.E.logEntry(updatedState, "Boarding action begins!")],
            };
          }

          // ---- Return to naval (Fall Back) ----
          case "returned_to_naval": {
            const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newPlayerCrew = updatedState.crew.roster.length;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            const newBattle = {
              ...battle,
              playerCrew: newPlayerCrew,
              enemyCrew: Math.max(0, battle.enemyCrew - (result.enemyCrewLoss || 0)),
              subPhase: "naval",
              distance: "close",
              log: newLog,
              phase: "player_turn",
              lostCrewNames: newLostNames,
            };
            const newSession = { ...session, battle: newBattle };
            return {
              ...updatedState,
              encounterSession: newSession,
              log: [...updatedState.log, window.E.logEntry(updatedState, "Boarding action ends. Ships are at Close range.")],
            };
          }

          // ---- Continue (next round) ----
          case "continue":
          default: {
            const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newPlayerCrew = updatedState.crew.roster.length;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            let newPlayerHull = battle.playerHull;
            let newEnemyHull = battle.enemyHull;
            if (battle.subPhase === "naval") {
              newPlayerHull = Math.max(0, battle.playerHull - result.playerHullDamage);
              newEnemyHull = Math.max(0, battle.enemyHull - result.enemyHullDamage);
            }

            const newBattle = {
              ...battle,
              playerHull: newPlayerHull,
              enemyHull: newEnemyHull,
              playerCrew: newPlayerCrew,
              enemyCrew: Math.max(0, battle.enemyCrew - result.enemyCrewLoss),
              distance: result.newDistance ?? battle.distance,
              round: battle.round + 1,
              log: newLog,
              phase: "player_turn",
              lostCrewNames: newLostNames,
            };
            const newSession = { ...session, battle: newBattle };
            return {
              ...updatedState,
              ship: { ...updatedState.ship, hull: newBattle.playerHull },
              encounterSession: newSession,
            };
          }

          // ---- PLAYER DEFEAT ----
          case "player_sunk":
          case "player_captured": {
            const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            const isSmallShip = state.ship.type === "dinghy" || state.ship.type === "cutter";
            if (isSmallShip && battle.playerHull > 0) {
              const newBattle = {
                ...battle,
                playerHull: Math.max(0, battle.playerHull - result.playerHullDamage),
                playerCrew: 0,
                enemyHull: Math.max(0, battle.enemyHull - result.enemyHullDamage),
                enemyCrew: Math.max(0, battle.enemyCrew - result.enemyCrewLoss),
                phase: "player_turn",
                log: newLog,
                lostCrewNames: newLostNames,
              };
              const newSession = { ...session, battle: newBattle };
              return {
                ...updatedState,
                encounterSession: newSession,
                log: updatedState.log,
              };
            }

            const newBattle = {
              ...battle,
              playerHull: Math.max(0, battle.playerHull - result.playerHullDamage),
              playerCrew: crewResult.state.crew.roster.length,
              enemyHull: Math.max(0, battle.enemyHull - result.enemyHullDamage),
              enemyCrew: Math.max(0, battle.enemyCrew - result.enemyCrewLoss),
              phase: "defeat",
              log: newLog,
              lostCrewNames: newLostNames,
            };
            const newSession = { ...session, battle: newBattle };
            return {
              ...updatedState,
              encounterSession: newSession,
              log: [...updatedState.log, window.E.logEntry(updatedState, "Your crew is overwhelmed. The enemy takes your ship!")],
            };
          }

          // ---- ENEMY SUNK (no plunder) ----
          case "enemy_sunk": {
            const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newPlayerCrew = updatedState.crew.roster.length;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            // FIX: Append victory message to battle log
            const victoryLogMsg = `The ${enemy.name} is sunk!`;
            const updatedBattleLog = [...newLog, victoryLogMsg];

            const newBattle = {
              ...battle,
              playerHull: Math.max(0, battle.playerHull - result.playerHullDamage),
              playerCrew: newPlayerCrew,
              enemyHull: Math.max(0, battle.enemyHull - result.enemyHullDamage),
              enemyCrew: Math.max(0, battle.enemyCrew - result.enemyCrewLoss),
              phase: "victory",
              canPlunder: false,
              log: updatedBattleLog, // <-- includes victory message
              lostCrewNames: newLostNames,
            };
            const newSession = { ...session, battle: newBattle };
            let currentState = applyVictoryAftermath({ ...updatedState, encounterSession: newSession });

            // Also add to state log
            return {
              ...currentState,
              encounterSession: newSession,
              screen: "battle",
              log: [...currentState.log, window.E.logEntry(currentState, victoryLogMsg)],
            };
          }

          // ---- ENEMY CAPTURED / WIPEOUT / SURRENDER / DEMAND SUCCESS ----
          // FIX: pass battleLogMessage as second log string
          case "enemy_captured":
            return handleVictoryWithPlunder(
              state, session, battle, result,
              `The ${enemy.name} is captured!`,
              `The ${enemy.name} is captured!`
            );

          case "enemy_wipeout":
            return handleVictoryWithPlunder(
              state, session, battle, result,
              `The ${enemy.name}'s crew is wiped out!`,
              `The ${enemy.name}'s crew is wiped out!`
            );

          case "enemy_win_capture":
            return handleVictoryWithPlunder(
              state, session, battle, result,
              `The ${enemy.name} surrenders!`,
              `The ${enemy.name} surrenders!`
            );

          case "enemy_surrendered":
            return handleVictoryWithPlunder(
              state, session, battle, result,
              `The ${enemy.name} surrenders!`,
              `The ${enemy.name} surrenders!`
            );

          // ---- PLAYER WIPEOUT (defeat) ----
          case "player_wipeout": {
            const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            const isSmallShip = state.ship.type === "dinghy" || state.ship.type === "cutter";
            if (isSmallShip && battle.playerHull > 0) {
              const newBattle = {
                ...battle,
                playerCrew: 0,
                enemyCrew: Math.max(0, battle.enemyCrew - result.enemyCrewLoss),
                phase: "player_turn",
                log: newLog,
                lostCrewNames: newLostNames,
              };
              const newSession = { ...session, battle: newBattle };
              return {
                ...updatedState,
                encounterSession: newSession,
                log: updatedState.log,
              };
            }

            const newBattle = {
              ...battle,
              playerCrew: crewResult.state.crew.roster.length,
              enemyCrew: Math.max(0, battle.enemyCrew - result.enemyCrewLoss),
              phase: "defeat",
              log: newLog,
              lostCrewNames: newLostNames,
            };
            const newSession = { ...session, battle: newBattle };
            return {
              ...updatedState,
              encounterSession: newSession,
            };
          }

          // ---- PLAYER DEFEATED BY DEMAND (defeat) ----
          case "player_defeated_by_demand": {
            const newBattle = {
              ...battle,
              phase: "defeat",
              log: newLog,
            };
            const newSession = { ...session, battle: newBattle };
            return { ...state, encounterSession: newSession };
          }

          // ---- PLAYER SURRENDERED (defeat) ----
          case "player_surrendered": {
            const crewResult = applyCrewLossToState(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            const newBattle = {
              ...battle,
              playerCrew: crewResult.state.crew.roster.length,
              phase: "defeat",
              log: newLog,
              lostCrewNames: newLostNames,
            };
            const newSession = { ...session, battle: newBattle };
            return { ...updatedState, encounterSession: newSession };
          }
        }
      }

      case A.DISMISS_BATTLE: {
        const session = state.encounterSession;
        if (!session || session.phase !== "battle" || !session.battle) return state;

        const battle = session.battle;
        const isWarPennantMission = (
          state.activeMission?.type === "combat" ||
          state.activeMission?.type === "patrol" ||
          state.activeMission?.type === "assault"
        ) && !state.activeMission?.starter;
        const heatMult = isWarPennantMission
          ? L.getEquipmentEffect(state, "combatHeatMult") : 1;
        const heatAmount = Math.round(3 * heatMult);

        const isNavyFight = session.type === "navy_patrol" || session.type === "navy_patrol_combat";
        const patrolInfamy = isNavyFight ? 2 : 0;
        const patrolLog = patrolInfamy > 0
          ? [window.E.logEntry(state, `+${patrolInfamy} infamy. Attacking crown forces was witnessed.`)]
          : [];

        if (battle.phase === "defeat") {
          return washAshore(state, battle, patrolLog);
        }

        let currentState = applyVictoryAftermath(state);

        const patrolResult = handlePatrolVictory(currentState);
        if (patrolResult) return patrolResult;

        if (battle.phase === "fled") {
          const fledResult = handleFledMission(currentState);
          if (fledResult) return fledResult;
        }

        const returnToSailing = session.returnScreen === "sailing" && currentState.destination && currentState.sailingDaysLeft > 0;
        const finalState = {
          ...currentState,
          encounterSession: null,
          screen: returnToSailing ? "sailing" : (session.returnScreen || "port"),
          infamy: Math.min(999, (currentState.infamy ?? 0) + patrolInfamy),
          log: [
            ...currentState.log,
            window.E.logEntry(currentState, L.logPick(D.VICTORY_MESSAGES, currentState, session.enemy.name)),
            ...patrolLog,
          ],
        };

        return L.addHeat(finalState, session.enemy.faction, heatAmount);
      }

      case A.TAKE_PLUNDER: {
        const session = state.encounterSession;
        if (!session || session.phase !== "plunder") return state;

        const goldReward = session.battle?.goldReward || 0;
        const finalHoldItems = action.holdItems;
        const plunderMsg = L.logPick(D.PLUNDER_MESSAGES, state, session.enemy.name);

        // ── Mark patrol/combat missions as defeated ──────────────────────────
        let nextState = { ...state };
        if (state.activeMission && (state.activeMission.type === "patrol" || state.activeMission.type === "combat")) {
          nextState.activeMission = { ...state.activeMission, enemyDefeated: true };
        }

        return {
          ...nextState,
          gold: nextState.gold + goldReward,
          hold: { ...nextState.hold, items: finalHoldItems },
          encounterSession: null,
          screen: session.returnScreen === "sailing" && nextState.destination && nextState.sailingDaysLeft > 0
            ? "sailing" : "port",
          log: [...nextState.log, `${plunderMsg} +${goldReward}g.`],
        };
      }

      default:
        return state;
    }
  });
})();