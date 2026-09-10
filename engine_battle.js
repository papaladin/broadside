// @ts-check
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
  const handleVictoryWithPlunder = (state, session, battle, result, logMessage) => {
    const crewResult = L.applyCrewLoss(state, result.playerCrewLoss);
    const updatedState = crewResult.state;
    const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];
    const enemy = session.enemy;
    const plunder = G.generateEnemyCargo(state, enemy, enemy.risk || "medium");

    // Append the victory message to the battle log
    const updatedBattleLog = [...battle.log, logMessage];

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
      log: updatedBattleLog,
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
          enemyAction = L.getNPCNavalAction(state, session);
        } else {
          enemyAction = L.getNPCBoardingAction(state, session);
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

        // ── Helper to apply convoy damage ──────────────────────────────
        const applyConvoyDamage = (battleObj, resultObj) => {
          let newConvoyHull = battleObj.convoyHull;
          let convoyLost = battleObj.convoyLost || false;
          if (resultObj.convoyDamage > 0 && battleObj.convoyHull !== undefined) {
            newConvoyHull = Math.max(0, battleObj.convoyHull - resultObj.convoyDamage);
            if (newConvoyHull === 0 && battleObj.convoyHull > 0) {
              convoyLost = true;
              newLog.push("The merchant ship is destroyed!");
            }
          }
          return { newConvoyHull, convoyLost };
        };

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
              nextState = {
                ...nextState,
                activeMission: null,
                log: [...nextState.log, window.E.logEntry(state, "The mission has been abandoned.")]
              };
            }
            return nextState;
          }

          // ---- Boarding transition ----
          case "boarding_begins": {
            const crewResult = L.applyCrewLoss(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newPlayerCrew = updatedState.crew.roster.length;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            const { newConvoyHull, convoyLost } = applyConvoyDamage(battle, result);

            const newBattle = {
              ...battle,
              playerCrew: newPlayerCrew,
              enemyCrew: Math.max(0, battle.enemyCrew - result.enemyCrewLoss),
              subPhase: "boarding",
              distance: "close",
              log: newLog,
              phase: "player_turn",
              lostCrewNames: newLostNames,
              convoyHull: newConvoyHull,
              convoyLost: convoyLost,
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
            const crewResult = L.applyCrewLoss(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newPlayerCrew = updatedState.crew.roster.length;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            const { newConvoyHull, convoyLost } = applyConvoyDamage(battle, result);

            const newBattle = {
              ...battle,
              playerCrew: newPlayerCrew,
              enemyCrew: Math.max(0, battle.enemyCrew - (result.enemyCrewLoss || 0)),
              subPhase: "naval",
              distance: "close",
              log: newLog,
              phase: "player_turn",
              lostCrewNames: newLostNames,
              convoyHull: newConvoyHull,
              convoyLost: convoyLost,
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
            const crewResult = L.applyCrewLoss(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newPlayerCrew = updatedState.crew.roster.length;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            let newPlayerHull = battle.playerHull;
            let newEnemyHull = battle.enemyHull;
            if (battle.subPhase === "naval") {
              newPlayerHull = Math.max(0, battle.playerHull - result.playerHullDamage);
              newEnemyHull = Math.max(0, battle.enemyHull - result.enemyHullDamage);
            }

            const { newConvoyHull, convoyLost } = applyConvoyDamage(battle, result);

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
              convoyHull: newConvoyHull,
              convoyLost: convoyLost,
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
            const crewResult = L.applyCrewLoss(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            const { newConvoyHull, convoyLost } = applyConvoyDamage(battle, result);

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
                convoyHull: newConvoyHull,
                convoyLost: convoyLost,
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
              convoyHull: newConvoyHull,
              convoyLost: convoyLost,
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
            const crewResult = L.applyCrewLoss(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newPlayerCrew = updatedState.crew.roster.length;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            const { newConvoyHull, convoyLost } = applyConvoyDamage(battle, result);

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
              log: updatedBattleLog,
              lostCrewNames: newLostNames,
              convoyHull: newConvoyHull,
              convoyLost: convoyLost,
            };
            const newSession = { ...session, battle: newBattle };
            let currentState = applyVictoryAftermath({ ...updatedState, encounterSession: newSession });

            return {
              ...currentState,
              encounterSession: newSession,
              screen: "battle",
              log: [...currentState.log, window.E.logEntry(currentState, victoryLogMsg)],
            };
          }

          // ---- ENEMY CAPTURED / WIPEOUT / SURRENDER / DEMAND SUCCESS ----
          case "enemy_captured":
            return handleVictoryWithPlunder(
              state, session, battle, result,
              `The ${enemy.name} is captured!`
            );

          case "enemy_wipeout":
            return handleVictoryWithPlunder(
              state, session, battle, result,
              `The ${enemy.name}'s crew is wiped out!`
            );

          case "enemy_win_capture":
            return handleVictoryWithPlunder(
              state, session, battle, result,
              `The ${enemy.name} surrenders!`
            );

          case "enemy_surrendered":
            return handleVictoryWithPlunder(
              state, session, battle, result,
              `The ${enemy.name} surrenders!`
            );

          // ---- PLAYER WIPEOUT (defeat) ----
          case "player_wipeout": {
            const crewResult = L.applyCrewLoss(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            const { newConvoyHull, convoyLost } = applyConvoyDamage(battle, result);

            const isSmallShip = state.ship.type === "dinghy" || state.ship.type === "cutter";
            if (isSmallShip && battle.playerHull > 0) {
              const newBattle = {
                ...battle,
                playerCrew: 0,
                enemyCrew: Math.max(0, battle.enemyCrew - result.enemyCrewLoss),
                phase: "player_turn",
                log: newLog,
                lostCrewNames: newLostNames,
                convoyHull: newConvoyHull,
                convoyLost: convoyLost,
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
              convoyHull: newConvoyHull,
              convoyLost: convoyLost,
            };
            const newSession = { ...session, battle: newBattle };
            return {
              ...updatedState,
              encounterSession: newSession,
            };
          }

          // ---- PLAYER DEFEATED BY DEMAND (defeat) ----
          case "player_defeated_by_demand": {
            const { newConvoyHull, convoyLost } = applyConvoyDamage(battle, result);

            const newBattle = {
              ...battle,
              phase: "defeat",
              log: newLog,
              convoyHull: newConvoyHull,
              convoyLost: convoyLost,
            };
            const newSession = { ...session, battle: newBattle };
            return { ...state, encounterSession: newSession };
          }

          // ---- PLAYER SURRENDERED (defeat) ----
          case "player_surrendered": {
            const crewResult = L.applyCrewLoss(state, result.playerCrewLoss);
            const updatedState = crewResult.state;
            const newLostNames = [...battle.lostCrewNames, ...crewResult.lostNames];

            const { newConvoyHull, convoyLost } = applyConvoyDamage(battle, result);

            const newBattle = {
              ...battle,
              playerCrew: crewResult.state.crew.roster.length,
              phase: "defeat",
              log: newLog,
              lostCrewNames: newLostNames,
              convoyHull: newConvoyHull,
              convoyLost: convoyLost,
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

        const isNavyFight = session.type === "navy_patrol" ;
        const patrolInfamy = isNavyFight ? 2 : 0;
        const patrolLog = patrolInfamy > 0
          ? [window.E.logEntry(state, `+${patrolInfamy} infamy. Attacking crown forces was witnessed.`)]
          : [];

        // If the player surrendered to a navy patrol after refusing inspection,
        // apply the special surrender consequences instead of full wash ashore.
        if (session?.type === "navy_patrol" && session?.inspectionRefused && battle.phase === "defeat") {
          return window.E.applyNavyPatrolSurrender(state, session);
        }

        if (battle.phase === "defeat") {
          return window.E.washAshore(state, battle, patrolLog);
        }

        let nextState = applyVictoryAftermath(state);

        // ── Merchant / Convoy reward handling ──────────────────────────
        if (battle.phase === "victory") {
          const isEscort = nextState.activeMission?.type === "escort";
          const isMerchantDefense = session.merchantProtected === true;

          if (isMerchantDefense || isEscort) {
            const merchantFaction = session.merchantFaction ||
              (isEscort ? nextState.activeMission?.faction : null);

            if (!battle.convoyLost) {
              // ── Convoy survived ──
              if (isMerchantDefense && merchantFaction) {
                const bonusGold = 200 + Math.floor(Math.random() * 200);
                const bonusRep = { [merchantFaction]: 5 };
                nextState = {
                  ...nextState,
                  gold: (nextState.gold ?? 0) + bonusGold,
                  reputation: L.applyReputationImpact(nextState, bonusRep),
                  log: [...nextState.log, window.E.logEntry(nextState,
                    `The merchant is saved! You receive ${bonusGold}g and gratitude from the ${FACTIONS[merchantFaction]?.label || merchantFaction}.`
                  )],
                };
              } else if (isEscort && merchantFaction) {
                // Escort mission: convoy survived → mission can be completed
                nextState = {
                  ...nextState,
                  log: [...nextState.log, window.E.logEntry(nextState,
                    `The convoy is safe! You protected them against the attack.`
                  )],
                };
              }
            } else {
              // ── Convoy was destroyed ──
              if (isMerchantDefense) {
                nextState = {
                  ...nextState,
                  log: [...nextState.log, window.E.logEntry(nextState,
                    "The merchant ship was destroyed. There is no reward for the rescue."
                  )],
                };
              } else if (isEscort) {
                // Escort mission: convoy destroyed → mission fails
                nextState = {
                  ...nextState,
                  log: [...nextState.log, window.E.logEntry(nextState,
                    "The convoy was destroyed! The escort mission has failed."
                  )],
                };
                if (nextState.activeMission) {
                  nextState = {
                    ...nextState,
                    activeMission: {
                      ...nextState.activeMission,
                      convoyLost: true,
                      failed: true,
                    },
                  };
                }
              }
            }
          }
        }

        // ── Resist inspection: victory ──
        if (battle.phase === "victory" && session.inspectionContraband && session.inspectionRefused) {
          const inspectingFaction = session.enemy.faction;
          let reputation = nextState.reputation;
          if (inspectingFaction) {
            reputation = L.applyReputationImpact(nextState, { [inspectingFaction]: -8 });
          }

          nextState = {
            ...nextState,
            infamy: Math.min(999, (nextState.infamy ?? 0) + 3),
            reputation,
            crew: { ...nextState.crew, morale: Math.max(0, nextState.crew.morale - 5) },
            log: [...nextState.log, window.E.logEntry(nextState,
              "You defeated the patrol! Your cargo remains intact. But you have earned a powerful enemy."
            )],
            encounterSession: {
              ...nextState.encounterSession,
              inspectionContraband: null,
            },
          };
        }

        // ── Resist inspection: defeat ──
        if (battle.phase === "defeat" && session.inspectionContraband && session.inspectionRefused) {
          const contraband = session.inspectionContraband;
          const inspectingFaction = session.enemy.faction;

          let newHoldItems = L.applyLoseContraband(nextState.hold?.items || {});
          if (contraband.hasRumSmuggle) {
            newHoldItems.rum = 0;
          }

          let reputation = nextState.reputation;
          if (inspectingFaction) {
            reputation = L.applyReputationImpact(nextState, { [inspectingFaction]: -5 });
          }

          const finalState = {
            ...nextState,
            gold: Math.max(0, (nextState.gold ?? 0) - contraband.fine),
            hold: { ...nextState.hold, items: newHoldItems },
            infamy: Math.min(999, (nextState.infamy ?? 0) + 2),
            reputation,
            crew: { ...nextState.crew, morale: Math.max(0, nextState.crew.morale - 10) },
            log: [...nextState.log, window.E.logEntry(nextState,
              "You fought but were defeated. The patrol confiscates your contraband and fines you."
            )],
            encounterSession: null,
            screen: L.returnScreen(nextState),
          };

          return finalState;
        }

        const patrolResult = handlePatrolVictory(nextState);
        if (patrolResult) return patrolResult;

        if (battle.phase === "fled") {
          const fledResult = handleFledMission(nextState);
          if (fledResult) return fledResult;
        }

        const returnToSailing = session.returnScreen === "sailing" && nextState.destination && nextState.sailingDaysLeft > 0;
        const finalState = {
          ...nextState,
          encounterSession: null,
          screen: returnToSailing ? "sailing" : (session.returnScreen || "port"),
          infamy: Math.min(999, (nextState.infamy ?? 0) + patrolInfamy),
          log: [
            ...nextState.log,
            window.E.logEntry(nextState, L.logPick(D.VICTORY_MESSAGES, nextState, session.enemy.name)),
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

        let nextState = { ...state };
        if (state.activeMission && (state.activeMission.type === "patrol" || state.activeMission.type === "combat")) {
          nextState = {
            ...nextState,
            activeMission: { ...state.activeMission, enemyDefeated: true },
          };
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